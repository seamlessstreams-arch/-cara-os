// ══════════════════════════════════════════════════════════════════════════════
// Routing Health — engine tests (Milestone 16)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import {
  loadRoutingHealth,
  retryJob,
  routingHealthCount,
} from "@/lib/care-events/routing-health";

const HOME_ID = "home_routing_test";

function clearAll() {
  // Drop test home's care events from underlying array
  const events = db.careEvents.findAll().filter((e) => e.home_id === HOME_ID);
  const allEvents = db.careEvents.findAll();
  for (const e of events) {
    const idx = allEvents.indexOf(e);
    if (idx >= 0) allEvents.splice(idx, 1);
  }
  // Wipe routes for this home (no findAll exposed -> use findFailed +
  // upsert never targets test rows; just iterate underlying via patch)
  const routes = db.careEventRoutes.findFailed().filter((r) => r.home_id === HOME_ID);
  for (const r of routes) db.careEventRoutes.patch(r.id, { status: "completed" });
  // Wipe jobs for this home
  const jobs = db.careEventJobs.findFailed().filter((j) => j.home_id === HOME_ID);
  for (const j of jobs) db.careEventJobs.patch(j.id, { status: "completed" });
}

function seedEvent() {
  return db.careEvents.create({
    home_id: HOME_ID,
    child_id: "yp_alex",
    category: "general",
    title: "Test event",
    content: "x",
    is_current_version: true,
    event_date: "2026-05-10",
  });
}

describe("routing-health engine", () => {
  beforeEach(() => clearAll());

  it("returns an empty summary when nothing is failing", () => {
    const s = loadRoutingHealth(HOME_ID);
    expect(s.affected_event_count).toBe(0);
    expect(s.failed_route_count).toBe(0);
    expect(s.failed_job_count).toBe(0);
    expect(s.rows).toEqual([]);
  });

  it("groups failed routes by care event", () => {
    const ev = seedEvent();
    db.careEventRoutes.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      route_type: "daily_log",
      status: "failed",
      linked_record_id: null,
      linked_record_table: null,
      processing_notes: null,
      error_message: "boom",
      retry_count: 0,
      last_retried_at: null,
      time_saved_minutes: 0,
    });
    db.careEventRoutes.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      route_type: "child_daily_summary",
      status: "retry_required",
      linked_record_id: null,
      linked_record_table: null,
      processing_notes: null,
      error_message: "needs retry",
      retry_count: 1,
      last_retried_at: null,
      time_saved_minutes: 0,
    });

    const s = loadRoutingHealth(HOME_ID);
    expect(s.affected_event_count).toBe(1);
    expect(s.failed_route_count).toBe(2);
    expect(s.rows[0].failed_routes).toHaveLength(2);
  });

  it("includes failed jobs alongside failed routes", () => {
    const ev = seedEvent();
    db.careEventJobs.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      job_type: "reg45_summary_update",
      status: "failed",
      payload: {},
      result: null,
      error_message: "timeout",
      retry_count: 1,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      last_retried_at: null,
    });

    const s = loadRoutingHealth(HOME_ID);
    expect(s.failed_job_count).toBe(1);
    expect(s.rows[0].failed_jobs).toHaveLength(1);
  });

  it("retryJob marks a failed job pending and bumps retry_count", () => {
    const ev = seedEvent();
    const job = db.careEventJobs.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      job_type: "saved_time_metrics",
      status: "failed",
      payload: {},
      result: null,
      error_message: "timeout",
      retry_count: 0,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      last_retried_at: null,
    });

    const result = retryJob(job.id);
    if ("code" in result) throw new Error("expected success");
    expect(result.status).toBe("pending");
    expect(result.retry_count).toBe(1);
    expect(result.error_message).toBeNull();
  });

  it("retryJob refuses if max_retries reached", () => {
    const ev = seedEvent();
    const job = db.careEventJobs.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      job_type: "saved_time_metrics",
      status: "failed",
      payload: {},
      result: null,
      error_message: "x",
      retry_count: 3,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      last_retried_at: null,
    });
    const r = retryJob(job.id);
    expect("code" in r && r.code).toBe("max_retries_exceeded");
  });

  it("retryJob refuses unknown job id", () => {
    const r = retryJob("cej_does_not_exist");
    expect("code" in r && r.code).toBe("not_found");
  });

  it("routingHealthCount sums failed routes and jobs for a home", () => {
    const ev = seedEvent();
    db.careEventRoutes.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      route_type: "daily_log",
      status: "failed",
      linked_record_id: null,
      linked_record_table: null,
      processing_notes: null,
      error_message: "x",
      retry_count: 0,
      last_retried_at: null,
      time_saved_minutes: 0,
    });
    db.careEventJobs.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      job_type: "reg45_summary_update",
      status: "failed",
      payload: {},
      result: null,
      error_message: "x",
      retry_count: 0,
      max_retries: 3,
      scheduled_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      last_retried_at: null,
    });
    expect(routingHealthCount(HOME_ID)).toBe(2);
  });

  it("preserves the source care event after route failure", () => {
    const ev = seedEvent();
    db.careEventRoutes.upsert({
      care_event_id: ev.id,
      home_id: HOME_ID,
      route_type: "daily_log",
      status: "failed",
      linked_record_id: null,
      linked_record_table: null,
      processing_notes: null,
      error_message: "x",
      retry_count: 0,
      last_retried_at: null,
      time_saved_minutes: 0,
    });
    expect(db.careEvents.findById(ev.id)).toBeDefined();
  });
});
