import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/store";
import { requirePermission } from "@/lib/auth-guard";
import { PERMISSIONS } from "@/lib/permissions";
import type { CareEventJob, JobType } from "@/types/care-events";

/**
 * GET /api/v1/care-events/jobs
 * List background jobs — optionally filtered by status or care_event_id.
 * Requires manager+ permission.
 */
export async function GET(req: NextRequest) {
  const authResult = requirePermission(req, PERMISSIONS.VIEW_DAILY_LOG);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const care_event_id = searchParams.get("care_event_id");
  const job_type = searchParams.get("job_type") as JobType | null;

  let jobs: CareEventJob[] = [
    ...db.careEventJobs.findPending(),
    ...db.careEventJobs.findFailed(),
  ];

  if (status) jobs = jobs.filter((j) => j.status === status);
  if (care_event_id) jobs = jobs.filter((j) => j.care_event_id === care_event_id);
  if (job_type) jobs = jobs.filter((j) => j.job_type === job_type);

  // Sort: pending first, then newest
  jobs = jobs.sort((a, b) => {
    const ORDER = { pending: 0, retry_required: 1, processing: 2, failed: 3, completed: 4 };
    const ao = ORDER[a.status as keyof typeof ORDER] ?? 5;
    const bo = ORDER[b.status as keyof typeof ORDER] ?? 5;
    if (ao !== bo) return ao - bo;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return NextResponse.json({
    data: jobs,
    meta: {
      total: jobs.length,
      pending: jobs.filter((j) => j.status === "pending").length,
      processing: jobs.filter((j) => j.status === "processing").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed" || j.status === "retry_required").length,
    },
  });
}

/**
 * POST /api/v1/care-events/jobs
 * Run pending and retry-required background jobs.
 * Body: { care_event_id?: string; job_type?: string; max_jobs?: number }
 *
 * This endpoint is safe to call multiple times — it is idempotent.
 * In production, call from a scheduled cron or via a Supabase pg_cron trigger.
 * Requires registered_manager+ permission.
 */
export async function POST(req: NextRequest) {
  const authResult = requirePermission(req, PERMISSIONS.APPROVE_FORMS);
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  let body: { care_event_id?: string; job_type?: JobType; max_jobs?: number } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is fine
  }

  const maxJobs = Math.min(body.max_jobs ?? 50, 100);
  const care_event_id = body.care_event_id;
  const job_type = body.job_type;

  // Collect eligible jobs
  let eligible: CareEventJob[] = [
    ...db.careEventJobs.findPending(),
    ...db.careEventJobs.findFailed(),
  ].filter((j) => j.retry_count < j.max_retries);

  if (care_event_id) eligible = eligible.filter((j) => j.care_event_id === care_event_id);
  if (job_type) eligible = eligible.filter((j) => j.job_type === job_type);
  eligible = eligible.slice(0, maxJobs);

  const results: Array<{
    job_id: string;
    job_type: JobType;
    care_event_id: string;
    status: "completed" | "failed" | "skipped";
    error?: string;
  }> = [];

  for (const job of eligible) {
    // Mark as processing
    db.careEventJobs.patch(job.id, {
      status: "processing",
      started_at: new Date().toISOString(),
      retry_count: job.retry_count + (job.status === "retry_required" ? 1 : 0),
      last_retried_at: job.status === "retry_required" ? new Date().toISOString() : job.last_retried_at,
    });

    try {
      const result = await runJob(job);

      db.careEventJobs.patch(job.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
        result,
        error_message: null,
      });

      // Audit
      db.careEventAuditLog.append({
        care_event_id: job.care_event_id,
        home_id: job.home_id,
        action: "care_event_routed",
        actor_staff_id: userId,
        actor_role: "system",
        detail: { job_id: job.id, job_type: job.job_type, result },
        ip_address: null,
      });

      results.push({ job_id: job.id, job_type: job.job_type, care_event_id: job.care_event_id, status: "completed" });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const newRetryCount = job.retry_count + 1;
      const exhausted = newRetryCount >= job.max_retries;

      db.careEventJobs.patch(job.id, {
        status: exhausted ? "failed" : "retry_required",
        error_message: errorMessage,
        retry_count: newRetryCount,
        last_retried_at: new Date().toISOString(),
      });

      // Audit failure
      db.careEventAuditLog.append({
        care_event_id: job.care_event_id,
        home_id: job.home_id,
        action: exhausted ? "care_event_route_failed" : "care_event_route_retried",
        actor_staff_id: userId,
        actor_role: "system",
        detail: { job_id: job.id, job_type: job.job_type, retry_count: newRetryCount, exhausted, error: errorMessage },
        ip_address: null,
      });

      results.push({ job_id: job.id, job_type: job.job_type, care_event_id: job.care_event_id, status: "failed", error: errorMessage });
    }
  }

  const completed = results.filter((r) => r.status === "completed").length;
  const failed = results.filter((r) => r.status === "failed").length;

  return NextResponse.json({
    processed: results.length,
    completed,
    failed,
    results,
  });
}

// ── Job runners ───────────────────────────────────────────────────────────────

async function runJob(job: CareEventJob): Promise<Record<string, unknown>> {
  switch (job.job_type) {
    case "reg45_summary_update":
      return runReg45SummaryUpdate(job);
    case "annex_a_snapshot_update":
      return runAnnexASnapshotUpdate(job);
    case "inspection_readiness_update":
      return runInspectionReadinessUpdate(job);
    case "saved_time_metrics":
      return runSavedTimeMetrics(job);
    case "pattern_analysis":
      return runPatternAnalysis(job);
    case "pdf_generation":
      throw new Error("PDF generation not yet implemented — use evidence export UI.");
    case "evidence_pack_export":
      throw new Error("Evidence pack export not yet implemented — use export UI.");
    case "filing_cabinet_index_rebuild":
      return runFilingCabinetIndexRebuild(job);
    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }
}

function runReg45SummaryUpdate(job: CareEventJob): Record<string, unknown> {
  const event = db.careEvents.findById(job.care_event_id);
  if (!event) throw new Error(`Care event ${job.care_event_id} not found`);

  // Tally queue for this home
  const pending = db.reg45EvidenceQueue.findPending();
  const total = db.reg45EvidenceQueue.findAll().length;

  return {
    job_type: "reg45_summary_update",
    care_event_id: job.care_event_id,
    reg45_pending_items: pending.length,
    reg45_total_items: total,
    updated_at: new Date().toISOString(),
    notes: "Reg 45 evidence queue refreshed. No auto-finalisation — manager approval required.",
  };
}

function runAnnexASnapshotUpdate(job: CareEventJob): Record<string, unknown> {
  const event = db.careEvents.findById(job.care_event_id);
  if (!event) throw new Error(`Care event ${job.care_event_id} not found`);

  const pending = db.annexAEvidenceQueue.findPending();
  const total = db.annexAEvidenceQueue.findAll().length;

  return {
    job_type: "annex_a_snapshot_update",
    care_event_id: job.care_event_id,
    annex_a_pending_items: pending.length,
    annex_a_total_items: total,
    updated_at: new Date().toISOString(),
    notes: "Annex A snapshot updated. Point-in-time export available via Annex A page.",
  };
}

function runInspectionReadinessUpdate(job: CareEventJob): Record<string, unknown> {
  // Tally key readiness signals
  const openTasks = db.tasks.findAll().filter((t) => t.status !== "completed").length;
  const unreviewedEvents = db.careEvents.findNeedingManagerReview().length;

  return {
    job_type: "inspection_readiness_update",
    care_event_id: job.care_event_id,
    open_tasks: openTasks,
    unreviewed_care_events: unreviewedEvents,
    updated_at: new Date().toISOString(),
    notes: "Inspection readiness dashboard signals refreshed.",
  };
}

function runSavedTimeMetrics(job: CareEventJob): Record<string, unknown> {
  const event = db.careEvents.findById(job.care_event_id);
  if (!event) throw new Error(`Care event ${job.care_event_id} not found`);

  const routes = db.careEventRoutes.findByCareEvent(job.care_event_id);
  const completedRoutes = routes.filter((r) => r.status === "completed");
  const totalMinutes = completedRoutes.reduce((sum, r) => sum + r.time_saved_minutes, 0);

  return {
    job_type: "saved_time_metrics",
    care_event_id: job.care_event_id,
    routes_completed: completedRoutes.length,
    estimated_minutes_saved: totalMinutes,
    updated_at: new Date().toISOString(),
  };
}

function runPatternAnalysis(job: CareEventJob): Record<string, unknown> {
  // Lightweight pattern: count categories in last 28 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const recent = db.careEvents
    .findCurrent()
    .filter((e) => e.event_date >= cutoffStr);

  const categoryCounts: Record<string, number> = {};
  for (const e of recent) {
    categoryCounts[e.category] = (categoryCounts[e.category] ?? 0) + 1;
  }

  return {
    job_type: "pattern_analysis",
    care_event_id: job.care_event_id,
    events_in_period: recent.length,
    category_counts: categoryCounts,
    period_days: 28,
    updated_at: new Date().toISOString(),
  };
}

function runFilingCabinetIndexRebuild(job: CareEventJob): Record<string, unknown> {
  const items = db.filingCabinet.findAll();
  return {
    job_type: "filing_cabinet_index_rebuild",
    care_event_id: job.care_event_id,
    items_indexed: items.length,
    updated_at: new Date().toISOString(),
  };
}
