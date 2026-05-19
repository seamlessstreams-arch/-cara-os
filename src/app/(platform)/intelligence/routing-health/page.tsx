"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — Routing Health (Milestone 16)
//
// Surfaces failed care-event routes and stuck/failed background jobs so
// authorised users can see exactly what didn't process and retry. The
// source care event is always preserved.
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, RefreshCw, RotateCcw, Activity, CheckCircle2,
} from "lucide-react";
import {
  useRoutingHealth,
  useRetryRoutes,
  useRetryJob,
} from "@/hooks/use-routing-health";
import { useAuthContext } from "@/contexts/auth-context";
import { appRoleToAriaRole } from "@/lib/aria/aria-permissions";

const HOME_ID = "home_oak";

export default function RoutingHealthPage() {
  const { currentUser } = useAuthContext();
  const ariaRole = appRoleToAriaRole(currentUser?.role ?? "registered_manager");
  const { data, isLoading, refetch, isFetching } = useRoutingHealth(HOME_ID);
  const retryRoutes = useRetryRoutes();
  const retryJob = useRetryJob();

  const summary = data?.data;

  return (
    <PageShell
      title="Routing Health"
      subtitle="Failed care-event routes and background jobs. The source care event is always preserved. Retry creates no duplicate records."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard
          label="Affected events"
          value={summary?.affected_event_count ?? 0}
          icon={<AlertTriangle className="h-4 w-4 text-rose-700" />}
          tone="bg-rose-50"
        />
        <SummaryCard
          label="Failed routes"
          value={summary?.failed_route_count ?? 0}
          icon={<Activity className="h-4 w-4 text-amber-700" />}
          tone="bg-amber-50"
        />
        <SummaryCard
          label="Failed jobs"
          value={summary?.failed_job_count ?? 0}
          icon={<Activity className="h-4 w-4 text-amber-700" />}
          tone="bg-amber-50"
        />
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading routing health…
            </CardContent>
          </Card>
        ) : !summary || summary.rows.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              All routing healthy. No failed routes or jobs.
            </CardContent>
          </Card>
        ) : (
          summary.rows.map((row) => (
            <Card key={row.care_event_id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm">{row.care_event_title}</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.care_event_category} · event {row.care_event_date}
                    </p>
                  </div>
                  {row.failed_routes.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() =>
                        retryRoutes.mutate({
                          care_event_id: row.care_event_id,
                          actor_id: currentUser?.id,
                          actor_role: ariaRole,
                        })
                      }
                      disabled={retryRoutes.isPending}
                    >
                      <RotateCcw className="mr-1 h-3 w-3" />
                      Retry {row.failed_routes.length} route
                      {row.failed_routes.length === 1 ? "" : "s"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {row.failed_routes.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Failed routes
                    </p>
                    <ul className="space-y-1">
                      {row.failed_routes.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-start justify-between gap-2 rounded border bg-rose-50 px-2 py-1 text-xs"
                        >
                          <div>
                            <span className="font-medium">{r.route_type}</span>
                            <span className="ml-2 text-muted-foreground">
                              attempt {r.retry_count}
                            </span>
                            {r.error_message && (
                              <p className="text-rose-800">{r.error_message}</p>
                            )}
                          </div>
                          <Badge variant="outline" className="bg-rose-100 text-rose-800">
                            {r.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {row.failed_jobs.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Failed jobs
                    </p>
                    <ul className="space-y-1">
                      {row.failed_jobs.map((j) => (
                        <li
                          key={j.id}
                          className="flex items-start justify-between gap-2 rounded border bg-amber-50 px-2 py-1 text-xs"
                        >
                          <div>
                            <span className="font-medium">{j.job_type}</span>
                            <span className="ml-2 text-muted-foreground">
                              attempt {j.retry_count}/{j.max_retries}
                            </span>
                            {j.error_message && (
                              <p className="text-amber-800">{j.error_message}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="bg-amber-100 text-amber-800">
                              {j.status}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                retryJob.mutate({
                                  job_id: j.id,
                                  actor_id: currentUser?.id,
                                  actor_role: ariaRole,
                                })
                              }
                              disabled={
                                retryJob.isPending ||
                                j.retry_count >= j.max_retries
                              }
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Retry
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </PageShell>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: string;
}) {
  return (
    <Card className={tone}>
      <CardContent className="flex items-center justify-between py-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        {icon}
      </CardContent>
    </Card>
  );
}
