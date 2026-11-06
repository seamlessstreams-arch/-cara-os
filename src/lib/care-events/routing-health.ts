// ══════════════════════════════════════════════════════════════════════════════
// CARE EVENTS — Routing Health  (Milestone 16)
//
// Surfaces failed care-event routes and stuck/failed background jobs so
// authorised users can see exactly what didn't process and retry.
//
// CLAUDE.md spec invariant: "If routing partially fails, the system
// must preserve the source Care Event, mark failed routes clearly,
// show the failure to authorised users, allow retry, avoid duplicate
// records, audit the failure, and never lose the original staff
// entry."
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import { careEventsDb } from "@/lib/db";
import type {
  CareEvent,
  CareEventJob,
  CareEventRoute,
} from "@/types/care-events";

export interface RoutingHealthRow {
  care_event_id: string;
  care_event_title: string;
  care_event_category: string;
  care_event_date: string;
  home_id: string;
  child_id: string | null;
  failed_routes: CareEventRoute[];
  failed_jobs: CareEventJob[];
}

export interface RoutingHealthSummary {
  home_id: string;
  generated_at: string;
  failed_route_count: number;
  failed_job_count: number;
  affected_event_count: number;
  rows: RoutingHealthRow[];
}

function isFailedStatus(s: string): boolean {
  return s === "failed" || s === "retry_required";
}

// Shared assembly: group a home's failed routes + jobs by care event. The
// caller resolves care-event ids to rows first (sync store map, or live fetch)
// and hands the map in, so this stays identical across the sync/async variants.
function assembleRoutingHealth(
  homeId: string,
  allRoutes: CareEventRoute[],
  allJobs: CareEventJob[],
  events: Map<string, CareEvent>,
): RoutingHealthSummary {
  const eventIds = new Set<string>();
  for (const r of allRoutes) eventIds.add(r.care_event_id);
  for (const j of allJobs) eventIds.add(j.care_event_id);

  const rows: RoutingHealthRow[] = [];
  for (const id of eventIds) {
    const ev = events.get(id);
    if (!ev) continue;
    rows.push({
      care_event_id: ev.id,
      care_event_title: ev.title,
      care_event_category: ev.category,
      care_event_date: ev.event_date,
      home_id: ev.home_id,
      child_id: ev.child_id,
      failed_routes: allRoutes.filter((r) => r.care_event_id === id),
      failed_jobs: allJobs.filter((j) => j.care_event_id === id),
    });
  }

  rows.sort((a, b) => b.care_event_date.localeCompare(a.care_event_date));

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    failed_route_count: allRoutes.length,
    failed_job_count: allJobs.length,
    affected_event_count: rows.length,
    rows,
  };
}

/**
 * Store-backed (sync). Used by the in-process projection consumers
 * (notifications, oversight inbox, inspection readiness/snapshot) — themselves
 * store-only. On a live tenant the store is empty, so anything that runs on
 * live must use {@link loadRoutingHealthAsync} instead.
 */
export function loadRoutingHealth(homeId: string): RoutingHealthSummary {
  const allRoutes = db.careEventRoutes.findFailed().filter((r) => r.home_id === homeId);
  const allJobs = db.careEventJobs.findFailed().filter((j) => j.home_id === homeId);
  const events = new Map<string, CareEvent>();
  for (const id of careEventIdsFrom(allRoutes, allJobs)) {
    const ev = db.careEvents.findById(id);
    if (ev) events.set(id, ev);
  }
  return assembleRoutingHealth(homeId, allRoutes, allJobs, events);
}

/**
 * Live-safe (async) twin of {@link loadRoutingHealth}: resolves failed routes,
 * jobs and their care events through `careEventsDb`, which reads Supabase on a
 * live tenant and the in-memory store otherwise. This is what the
 * /api/v1/care-events/routing-health route calls.
 */
export async function loadRoutingHealthAsync(homeId: string): Promise<RoutingHealthSummary> {
  const allRoutes = (await careEventsDb.careEventRoutes.findFailed()).filter(
    (r) => r.home_id === homeId,
  );
  const allJobs = (await careEventsDb.careEventJobs.findFailed()).filter(
    (j) => j.home_id === homeId,
  );
  const events = new Map<string, CareEvent>();
  for (const id of careEventIdsFrom(allRoutes, allJobs)) {
    const ev = await careEventsDb.careEvents.findById(id);
    if (ev) events.set(id, ev);
  }
  return assembleRoutingHealth(homeId, allRoutes, allJobs, events);
}

function careEventIdsFrom(routes: CareEventRoute[], jobs: CareEventJob[]): Set<string> {
  const ids = new Set<string>();
  for (const r of routes) ids.add(r.care_event_id);
  for (const j of jobs) ids.add(j.care_event_id);
  return ids;
}

// ── Job retry (routes are retried by the existing processor) ─────────────────

export type RetryJobError =
  | { code: "not_found" }
  | { code: "not_failed"; job: CareEventJob }
  | { code: "max_retries_exceeded"; job: CareEventJob };

/**
 * Mark a failed/retry_required job as pending again so a worker can
 * pick it up. Bumps retry_count and last_retried_at. Refuses if
 * max_retries reached. The job runner itself executes the work.
 */
type RetryPlan =
  | RetryJobError
  | { ok: true; job: CareEventJob; patch: Parameters<typeof db.careEventJobs.patch>[1] };

/** Validate a retry against the job list and compute the patch to apply. */
function planRetry(jobId: string, all: CareEventJob[]): RetryPlan {
  // findById is not exposed on careEventJobs, so search via failed/pending.
  const job = all.find((j) => j.id === jobId);
  if (!job) return { code: "not_found" };
  if (!isFailedStatus(job.status)) return { code: "not_failed", job };
  if (job.retry_count >= job.max_retries) {
    return { code: "max_retries_exceeded", job };
  }
  return {
    ok: true,
    job,
    patch: {
      status: "pending",
      retry_count: job.retry_count + 1,
      last_retried_at: new Date().toISOString(),
      error_message: null,
    },
  };
}

/** Store-backed (sync). See {@link loadRoutingHealth} for the live caveat. */
export function retryJob(jobId: string): CareEventJob | RetryJobError {
  const all = db.careEventJobs.findPending().concat(db.careEventJobs.findFailed());
  const plan = planRetry(jobId, all);
  if (!("ok" in plan)) return plan;
  const patched = db.careEventJobs.patch(jobId, plan.patch);
  return patched ?? plan.job;
}

/** Live-safe (async) twin of {@link retryJob} via `careEventsDb`. */
export async function retryJobAsync(jobId: string): Promise<CareEventJob | RetryJobError> {
  const all = (await careEventsDb.careEventJobs.findPending()).concat(
    await careEventsDb.careEventJobs.findFailed(),
  );
  const plan = planRetry(jobId, all);
  if (!("ok" in plan)) return plan;
  const patched = await careEventsDb.careEventJobs.patch(jobId, plan.patch);
  return patched ?? plan.job;
}

/**
 * Convenience: count of all rows that need attention.
 */
export function routingHealthCount(homeId: string): number {
  const rs = db.careEventRoutes.findFailed().filter((r) => r.home_id === homeId).length;
  const js = db.careEventJobs.findFailed().filter((j) => j.home_id === homeId).length;
  return rs + js;
}

export function isCareEventStillIntact(eventId: string): CareEvent | null {
  return db.careEvents.findById(eventId) ?? null;
}
