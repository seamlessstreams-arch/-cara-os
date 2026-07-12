// ══════════════════════════════════════════════════════════════════════════════
// API — Routing Health  (Milestone 16)
//
// GET    ?home_id= → routing-health summary (failed routes + jobs grouped
//                    by care event)
// POST   { care_event_id, action: "retry_routes" } → retry all failed
//        routes for a care event via the processor
// POST   { job_id, action: "retry_job" } → mark a failed job pending again
//
// Permission: cara.view_audit_logs for read; cara.commit_to_records
// for retry actions (they re-run logic that creates linked records).
// All retry actions are appended to the live Cara audit tail.
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { requireCaraStudioPermission } from "@/lib/cara/cara-studio-guard";
import { appendCaraAudit } from "@/lib/cara/cara-audit-trail";
import { loadRoutingHealth, retryJob } from "@/lib/care-events/routing-health";
import { retryFailedRoutes } from "@/lib/care-events/processor";
import { db } from "@/lib/db/store";
import { readJsonBody } from "@/lib/http/read-json";

const DEFAULT_HOME_ID = "home_oak";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const homeId = searchParams.get("home_id") ?? DEFAULT_HOME_ID;
  const guard = requireCaraStudioPermission(req, {}, {
    permission: "cara.view_audit_logs",
    homeId,
    intent: "view routing health",
  });
  if (!guard.ok) return guard.response;
  return NextResponse.json({ data: loadRoutingHealth(homeId) });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    const __parsed = await readJsonBody(req);
    if (!__parsed.ok) return __parsed.response;
    body = __parsed.data as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : null;

  // ── Retry failed routes for a care event ────────────────────────────────
  if (action === "retry_routes") {
    const careEventId =
      typeof body.care_event_id === "string" ? body.care_event_id : null;
    if (!careEventId) {
      return NextResponse.json(
        { error: "care_event_id is required" },
        { status: 400 },
      );
    }
    const ev = db.careEvents.findById(careEventId);
    if (!ev) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const guard = requireCaraStudioPermission(req, body, {
      permission: "cara.commit_to_records",
      homeId: ev.home_id,
      childId: ev.child_id,
      intent: "retry care event routes",
      isSafeguardingSensitive: ev.is_safeguarding,
    });
    if (!guard.ok) return guard.response;

    let result: ReturnType<typeof retryFailedRoutes>;
    try {
      result = retryFailedRoutes(careEventId);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Retry failed" },
        { status: 500 },
      );
    }

    await appendCaraAudit({
      homeId: ev.home_id,
      actorId: guard.actor.userId,
      actionType: "artifact_recovered",
      artifactId: ev.id,
      summary: `Retried failed routes for care event "${ev.title}"`,
      after: result as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ data: result });
  }

  // ── Retry a failed background job ────────────────────────────────────────
  if (action === "retry_job") {
    const jobId = typeof body.job_id === "string" ? body.job_id : null;
    if (!jobId) {
      return NextResponse.json({ error: "job_id is required" }, { status: 400 });
    }

    // Find the job's home for RBAC.
    const failed = db.careEventJobs.findFailed();
    const job = failed.find((j) => j.id === jobId);
    if (!job) {
      return NextResponse.json(
        { error: "Job not found or not in a failed state" },
        { status: 404 },
      );
    }

    const guard = requireCaraStudioPermission(req, body, {
      permission: "cara.commit_to_records",
      homeId: job.home_id,
      intent: `retry job:${job.job_type}`,
    });
    if (!guard.ok) return guard.response;

    const result = retryJob(jobId);
    if ("code" in result) {
      if (result.code === "not_found") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      if (result.code === "not_failed") {
        return NextResponse.json(
          { error: "Only failed jobs can be retried" },
          { status: 409 },
        );
      }
      if (result.code === "max_retries_exceeded") {
        return NextResponse.json(
          { error: "Max retries exceeded for this job" },
          { status: 409 },
        );
      }
    }

    const j = result as Exclude<typeof result, { code: string }>;
    await appendCaraAudit({
      homeId: job.home_id,
      actorId: guard.actor.userId,
      actionType: "artifact_recovered",
      artifactId: j.id,
      sourceIds: [j.care_event_id],
      summary: `Retried failed job ${j.job_type} (attempt ${j.retry_count})`,
    });

    return NextResponse.json({ data: j });
  }

  return NextResponse.json(
    { error: "action must be one of: retry_routes, retry_job" },
    { status: 400 },
  );
}
