"use client";

// ══════════════════════════════════════════════════════════════════════════════
// Saved-Time Live Dashboard page  (Milestone 28)
// ══════════════════════════════════════════════════════════════════════════════

import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock } from "lucide-react";
import { useSavedTimeDashboard } from "@/hooks/use-saved-time-dashboard";
import { ROUTE_TYPE_LABEL } from "@/types/care-events";
import type { SavedTimeWindow } from "@/lib/care-events/saved-time-dashboard";

const HOME_ID = "home_oak";

export default function SavedTimeDashboardPage() {
  const { data, refetch, isFetching, isLoading } = useSavedTimeDashboard(HOME_ID);
  const dash = data?.data;

  return (
    <PageShell
      title="Saved-Time Dashboard"
      subtitle="Live operational time saved by automatic routing of Care Events into linked records, evidence and filing."
      actions={
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      {dash && (
        <div className="space-y-8">
          <WindowBlock label="Last 7 days"  window={dash.last_7_days}  showByDay />
          <WindowBlock label="Last 30 days" window={dash.last_30_days} showByDay />
          <WindowBlock label="All time"     window={dash.all_time} />
        </div>
      )}
    </PageShell>
  );
}

function WindowBlock({
  label, window: w, showByDay,
}: { label: string; window: SavedTimeWindow; showByDay?: boolean }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Clock className="h-4 w-4 text-slate-500" />
        {label}
      </h2>

      {/* Headline counters */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Counter title="Hours saved" value={w.total_hours.toFixed(1)} />
        <Counter title="Minutes saved" value={String(w.total_minutes)} />
        <Counter title="Care events" value={String(w.events)} />
        <Counter title="Routing actions" value={String(w.records)} />
      </div>

      {w.records === 0 ? (
        <p className="text-sm text-slate-500">No routing activity in this window.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {/* By route type */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By route type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {w.by_route_type.slice(0, 8).map((r) => (
                <Row
                  key={r.route_type}
                  left={ROUTE_TYPE_LABEL[r.route_type] ?? r.route_type}
                  right={`${r.minutes_saved}m · ${r.events} events`}
                />
              ))}
            </CardContent>
          </Card>

          {/* By staff */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">By staff</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {w.by_staff.slice(0, 8).map((s) => (
                <Row
                  key={s.staff_id}
                  left={s.staff_id}
                  right={`${s.minutes_saved}m · ${s.events} events`}
                />
              ))}
            </CardContent>
          </Card>

          {/* By day */}
          {showByDay && w.by_day.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">By day</CardTitle>
              </CardHeader>
              <CardContent>
                <SparkBars data={w.by_day} />
              </CardContent>
            </Card>
          )}

          {/* Recent */}
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {w.recent.slice(0, 10).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1 truncate">
                    <span className="text-slate-700">{m.activity_description}</span>
                    <span className="ml-2 text-xs text-slate-400">{m.staff_id}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {ROUTE_TYPE_LABEL[m.route_type] ?? m.route_type}
                  </Badge>
                  <span className="w-16 text-right text-xs text-slate-500">{m.minutes_saved}m</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </section>
  );
}

function Counter({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-wide text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function Row({ left, right }: { left: string; right: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate text-slate-700">{left}</span>
      <span className="text-xs text-slate-500">{right}</span>
    </div>
  );
}

function SparkBars({ data }: { data: { date: string; minutes_saved: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.minutes_saved));
  return (
    <div className="flex items-end gap-1" style={{ height: 80 }}>
      {data.map((d) => (
        <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-sm bg-emerald-500/70"
            style={{ height: `${(d.minutes_saved / max) * 64}px` }}
            title={`${d.date}: ${d.minutes_saved}m`}
          />
          <span className="text-[10px] text-slate-400">{d.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}
