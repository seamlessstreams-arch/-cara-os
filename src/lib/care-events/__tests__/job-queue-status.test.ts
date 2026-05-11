// ══════════════════════════════════════════════════════════════════════════════
// Background Job Queue Status — engine tests (Milestone 26)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db/store";
import { loadJobQueueStatus } from "@/lib/care-events/job-queue-status";
import type { JobStatus, JobType, RouteType, RouteStatus } from "@/types/care-events";

const HOME_ID = "home_jobqueue_test";

function clearAll() {
  const jobs = db.careEventJobs.findAll();
  for (const j of jobs.filter((x) => x.home_id === HOME_ID)) {
    const i = jobs.indexOf(j); if (i >= 0) jobs.splice(i, 1);
  }
  const routes = db.careEventRoutes.findAll();
  for (const r of routes.filter((x) => x.home_id === HOME_ID)) {
    const i = routes.indexOf(r); if (i >= 0) routes.splice(i, 1);
  }
}

let seq = 0;
function seedJob(opts: {
  job_type: JobType;
  status: JobStatus;
  care_event_id?: string;
  scheduled_at?: string;
  updated_at?: string;
  retry_count?: number;
}) {
  seq += 1;
  return db.careEventJobs.upsert({
    care_event_id: opts.care_event_id ?? `ce_j_${seq}`,
    home_id: HOME_ID,
    job_type: opts.job_type,
    status: opts.status,
    payload: {},
    result: null,
    error_message: opts.status === "failed" ? "boom" : null,
    retry_count: opts.retry_count ?? 0,
    max_retries: 3,
    scheduled_at: opts.scheduled_at ?? new Date().toISOString(),
    started_at: null,
    completed_at: opts.status === "completed" ? new Date().toISOString() : null,
    last_retried_at: null,
  });
}

function seedRoute(opts: {
  route_type: RouteType;
  status: RouteStatus;
  care_event_id?: string;
}) {
  seq += 1;
  return db.careEventRoutes.upsert({
    care_event_id: opts.care_event_id ?? `ce_r_${seq}`,
    home_id: HOME_ID,
    route_type: opts.route_type,
    status: opts.status,
    linked_record_id: null,
    linked_record_table: null,
    processing_notes: null,
    error_message: opts.status === "failed" ? "x" : null,
    retry_count: 0,
    last_retried_at: null,
    time_saved_minutes: 0,
  });
}

beforeEach(() => clearAll());

describe("loadJobQueueStatus", () => {
  it("returns empty/healthy snapshot when nothing queued", () => {
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.jobs_total).toBe(0);
    expect(r.routes_total).toBe(0);
    expect(r.jobs_by_status.pending).toBe(0);
    expect(r.health).toBe("healthy");
    expect(r.oldest_pending_job_at).toBeNull();
    expect(r.jobs_by_type).toEqual([]);
  });

  it("aggregates jobs_by_status across all jobs", () => {
    seedJob({ job_type: "reg45_summary_update", status: "pending" });
    seedJob({ job_type: "reg45_summary_update", status: "completed" });
    seedJob({ job_type: "annex_a_snapshot_update", status: "failed" });
    seedJob({ job_type: "annex_a_snapshot_update", status: "retry_required" });
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.jobs_total).toBe(4);
    expect(r.jobs_by_status.pending).toBe(1);
    expect(r.jobs_by_status.completed).toBe(1);
    expect(r.jobs_by_status.failed).toBe(1);
    expect(r.jobs_by_status.retry_required).toBe(1);
  });

  it("groups jobs_by_type with per-status counts and sorts by total desc", () => {
    seedJob({ job_type: "reg45_summary_update", status: "completed" });
    seedJob({ job_type: "reg45_summary_update", status: "completed" });
    seedJob({ job_type: "reg45_summary_update", status: "pending" });
    seedJob({ job_type: "pdf_generation", status: "completed" });
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.jobs_by_type.length).toBe(2);
    expect(r.jobs_by_type[0].job_type).toBe("reg45_summary_update");
    expect(r.jobs_by_type[0].total).toBe(3);
    expect(r.jobs_by_type[0].by_status.completed).toBe(2);
    expect(r.jobs_by_type[0].by_status.pending).toBe(1);
    expect(r.jobs_by_type[1].job_type).toBe("pdf_generation");
  });

  it("computes oldest_pending_job_at across pending jobs", () => {
    seedJob({ job_type: "pattern_analysis", status: "pending", scheduled_at: "2026-05-05T00:00:00Z" });
    seedJob({ job_type: "pattern_analysis", status: "pending", scheduled_at: "2026-05-01T00:00:00Z" });
    seedJob({ job_type: "pattern_analysis", status: "pending", scheduled_at: "2026-05-10T00:00:00Z" });
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.oldest_pending_job_at).toBe("2026-05-01T00:00:00Z");
  });

  it("returns recent_failed_jobs newest first, capped at 10", () => {
    for (let i = 0; i < 12; i += 1) {
      const j = seedJob({ job_type: "pdf_generation", status: "failed" });
      // mutate directly: patch() would overwrite updated_at with now()
      j.updated_at = `2026-05-${String(i + 1).padStart(2, "0")}T00:00:00Z`;
    }
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.recent_failed_jobs.length).toBe(10);
    expect(r.recent_failed_jobs[0].updated_at).toBe("2026-05-12T00:00:00Z");
  });

  it("computes routes_by_status and recent failed routes", () => {
    seedRoute({ route_type: "incident", status: "completed" });
    seedRoute({ route_type: "health_record", status: "failed" });
    seedRoute({ route_type: "medication_record", status: "skipped" });
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.routes_total).toBe(3);
    expect(r.routes_by_status.completed).toBe(1);
    expect(r.routes_by_status.failed).toBe(1);
    expect(r.routes_by_status.skipped).toBe(1);
    expect(r.recent_failed_routes.length).toBe(1);
  });

  it("derives health from failure counts", () => {
    expect(loadJobQueueStatus(HOME_ID).health).toBe("healthy");

    seedJob({ job_type: "reg45_summary_update", status: "failed" });
    expect(loadJobQueueStatus(HOME_ID).health).toBe("degraded");

    seedJob({ job_type: "annex_a_snapshot_update", status: "failed" });
    seedJob({ job_type: "pdf_generation", status: "failed" });
    seedJob({ job_type: "pattern_analysis", status: "failed" });
    expect(loadJobQueueStatus(HOME_ID).health).toBe("at_risk");
  });

  it("excludes other homes", () => {
    seedJob({ job_type: "reg45_summary_update", status: "pending" });
    db.careEventJobs.upsert({
      care_event_id: "ce_other",
      home_id: "other_home",
      job_type: "reg45_summary_update",
      status: "failed",
      payload: {}, result: null, error_message: null,
      retry_count: 0, max_retries: 3,
      scheduled_at: new Date().toISOString(),
      started_at: null, completed_at: null, last_retried_at: null,
    });
    const r = loadJobQueueStatus(HOME_ID);
    expect(r.jobs_total).toBe(1);
    expect(r.jobs_by_status.pending).toBe(1);
    expect(r.jobs_by_status.failed).toBe(0);
  });
});
