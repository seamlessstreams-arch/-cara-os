"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Background Job Queue Status  (Milestone 26)
//
// Surfaces the live state of every CareEventJob and CareEventRoute scoped to
// the home, satisfying the CLAUDE.md requirement that the UI must show
// pending / processing / completed / failed / retry-required states.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useJobQueueStatus } from "@/hooks/use-job-queue-status";
import type { JobStatus } from "@/types/care-events";

const HOME_ID = "home_oak";

const STATUS_TONE: Record<string, string> = {
  pending:        "bg-slate-100 text-slate-700 border-slate-300",
  processing:     "bg-blue-100 text-blue-800 border-blue-300",
  completed:      "bg-emerald-100 text-emerald-800 border-emerald-300",
  failed:         "bg-rose-100 text-rose-800 border-rose-300",
  retry_required: "bg-orange-100 text-orange-800 border-orange-300",
  skipped:        "bg-slate-100 text-slate-600 border-slate-300",
};

const HEALTH_TONE: Record<string, string> = {
  healthy:  "bg-emerald-100 text-emerald-800 border-emerald-300",
  degraded: "bg-amber-100 text-amber-800 border-amber-300",
  at_risk:  "bg-rose-100 text-rose-800 border-rose-300",
};

function pretty(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const JOB_STATUS_ORDER: JobStatus[] = ["pending", "processing", "completed", "failed", "retry_required"];

export default function JobQueuePage() {
  const { data, refetch, isFetching, isLoading } = useJobQueueStatus(HOME_ID);
  const q = data?.data;

  return (
    <PageShell
      title="Background Job Queue"
      subtitle="Live status of every routing job and processing job, refreshed every 15 seconds."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading queue…</p>}

      {q && (
        <div className="space-y-6">
          {/* Health */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">System health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-3">
                <Badge className={`border ${HEALTH_TONE[q.health]}`}>
                  <Activity className="mr-1 h-3 w-3" />
                  {pretty(q.health)}
                </Badge>
                <span className="text-sm text-slate-500">
                  {q.jobs_total} job{q.jobs_total === 1 ? "" : "s"}, {q.routes_total} route{q.routes_total === 1 ? "" : "s"}
                </span>
                {q.oldest_pending_job_at && (
                  <span className="text-xs text-slate-500 inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Oldest pending: {new Date(q.oldest_pending_job_at).toLocaleString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Job status counters */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {JOB_STATUS_ORDER.map((s) => (
              <Card key={s}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase tracking-wide text-slate-500">{pretty(s)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold">{q.jobs_by_status[s]}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Per-job-type breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Jobs by type</CardTitle>
            </CardHeader>
            <CardContent>
              {q.jobs_by_type.length === 0 ? (
                <p className="text-sm text-slate-500">No jobs queued.</p>
              ) : (
                <div className="space-y-3">
                  {q.jobs_by_type.map((g) => (
                    <div key={g.job_type} className="rounded border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{pretty(g.job_type)}</p>
                        <span className="text-xs text-slate-500">{g.total} total</span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {JOB_STATUS_ORDER.map((s) => (
                          g.by_status[s] > 0 && (
                            <Badge key={s} className={`border text-xs ${STATUS_TONE[s]}`}>
                              {pretty(s)}: {g.by_status[s]}
                            </Badge>
                          )
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent failed jobs */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                Recent failed jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.recent_failed_jobs.length === 0 ? (
                <p className="text-sm text-emerald-700 inline-flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> No failed jobs.
                </p>
              ) : (
                <ul className="space-y-2">
                  {q.recent_failed_jobs.map((j) => (
                    <li key={j.id} className="rounded border border-slate-200 p-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`border text-xs ${STATUS_TONE[j.status]}`}>{pretty(j.status)}</Badge>
                        <span className="font-medium">{pretty(j.job_type)}</span>
                        <span className="text-xs text-slate-500">retry {j.retry_count}/{j.max_retries}</span>
                      </div>
                      {j.error_message && (
                        <p className="mt-1 text-xs text-rose-700">{j.error_message}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Care event {j.care_event_id} · updated {new Date(j.updated_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Routes summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Routes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(["pending", "processing", "completed", "failed", "retry_required", "skipped"] as const).map((s) => (
                  <Badge key={s} className={`border text-xs ${STATUS_TONE[s]}`}>
                    {pretty(s)}: {q.routes_by_status[s]}
                  </Badge>
                ))}
              </div>
              {q.recent_failed_routes.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {q.recent_failed_routes.map((r) => (
                    <li key={r.id} className="rounded border border-slate-200 p-2 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={`border text-xs ${STATUS_TONE[r.status]}`}>{pretty(r.status)}</Badge>
                        <span className="font-medium">{pretty(r.route_type)}</span>
                      </div>
                      {r.error_message && (
                        <p className="mt-1 text-xs text-rose-700">{r.error_message}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        Care event {r.care_event_id} · updated {new Date(r.updated_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
