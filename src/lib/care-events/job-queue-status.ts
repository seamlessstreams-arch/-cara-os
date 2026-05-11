// ══════════════════════════════════════════════════════════════════════════════
// Background Job Queue Status  (Milestone 26)
//
// CLAUDE.md spec: "The user interface must show processing states: pending,
// processing, completed, failed, retry required." This engine surfaces the
// current state of every CareEventJob (Reg 45, Annex A, inspection readiness,
// pattern analysis, PDF generation, evidence pack export, filing index
// rebuild, saved-time metrics) and every CareEventRoute, scoped per home.
//
// Read-only.
// ══════════════════════════════════════════════════════════════════════════════

import { db } from "@/lib/db/store";
import type {
  CareEventJob,
  JobStatus,
  JobType,
  CareEventRoute,
  RouteStatus,
} from "@/types/care-events";

const JOB_STATUSES: JobStatus[] = [
  "pending", "processing", "completed", "failed", "retry_required",
];

const ROUTE_STATUSES: RouteStatus[] = [
  "pending", "processing", "completed", "failed", "skipped", "retry_required",
];

const ALL_JOB_TYPES: JobType[] = [
  "reg45_summary_update",
  "annex_a_snapshot_update",
  "inspection_readiness_update",
  "pattern_analysis",
  "pdf_generation",
  "evidence_pack_export",
  "filing_cabinet_index_rebuild",
  "saved_time_metrics",
];

export interface JobsByType {
  job_type: JobType;
  total: number;
  by_status: Record<JobStatus, number>;
  recent_failures: CareEventJob[]; // up to 5 newest failed/retry
}

export interface JobQueueStatus {
  home_id: string;
  generated_at: string;
  // Jobs
  jobs_total: number;
  jobs_by_status: Record<JobStatus, number>;
  jobs_by_type: JobsByType[];
  oldest_pending_job_at: string | null;
  recent_failed_jobs: CareEventJob[]; // up to 10 newest
  // Routes
  routes_total: number;
  routes_by_status: Record<RouteStatus, number>;
  recent_failed_routes: CareEventRoute[]; // up to 10 newest
  // Health
  health: "healthy" | "degraded" | "at_risk";
}

function emptyJobStatusBuckets(): Record<JobStatus, number> {
  return { pending: 0, processing: 0, completed: 0, failed: 0, retry_required: 0 };
}
function emptyRouteStatusBuckets(): Record<RouteStatus, number> {
  return {
    pending: 0, processing: 0, completed: 0,
    failed: 0, skipped: 0, retry_required: 0,
  };
}

export function loadJobQueueStatus(homeId: string): JobQueueStatus {
  const jobs = db.careEventJobs.findAll().filter((j) => j.home_id === homeId);
  const routes = db.careEventRoutes.findAll().filter((r) => r.home_id === homeId);

  // Jobs aggregations
  const jobs_by_status = emptyJobStatusBuckets();
  for (const s of JOB_STATUSES) jobs_by_status[s] = 0;
  for (const j of jobs) {
    if (jobs_by_status[j.status] !== undefined) jobs_by_status[j.status] += 1;
  }

  const jobs_by_type: JobsByType[] = [];
  for (const t of ALL_JOB_TYPES) {
    const inType = jobs.filter((j) => j.job_type === t);
    if (inType.length === 0) continue;
    const buckets = emptyJobStatusBuckets();
    for (const j of inType) buckets[j.status] = (buckets[j.status] ?? 0) + 1;
    const failures = inType
      .filter((j) => j.status === "failed" || j.status === "retry_required")
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 5);
    jobs_by_type.push({
      job_type: t,
      total: inType.length,
      by_status: buckets,
      recent_failures: failures,
    });
  }
  jobs_by_type.sort((a, b) => b.total - a.total);

  const pendings = jobs.filter((j) => j.status === "pending");
  const oldest_pending_job_at = pendings.length === 0
    ? null
    : pendings.reduce<string>((acc, j) => acc < j.scheduled_at ? acc : j.scheduled_at, pendings[0].scheduled_at);

  const recent_failed_jobs = jobs
    .filter((j) => j.status === "failed" || j.status === "retry_required")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 10);

  // Routes aggregations
  const routes_by_status = emptyRouteStatusBuckets();
  for (const s of ROUTE_STATUSES) routes_by_status[s] = 0;
  for (const r of routes) {
    if (routes_by_status[r.status] !== undefined) routes_by_status[r.status] += 1;
  }

  const recent_failed_routes = routes
    .filter((r) => r.status === "failed" || r.status === "retry_required")
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 10);

  // Health rule
  const failures = jobs_by_status.failed + jobs_by_status.retry_required +
                   routes_by_status.failed + routes_by_status.retry_required;
  const health: JobQueueStatus["health"] =
    failures === 0 ? "healthy" : failures <= 3 ? "degraded" : "at_risk";

  return {
    home_id: homeId,
    generated_at: new Date().toISOString(),
    jobs_total: jobs.length,
    jobs_by_status,
    jobs_by_type,
    oldest_pending_job_at,
    recent_failed_jobs,
    routes_total: routes.length,
    routes_by_status,
    recent_failed_routes,
    health,
  };
}
