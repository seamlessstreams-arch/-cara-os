"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SAVED-TIME DASHBOARD
// Shows time saved through automated routing from Care Events
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  TrendingUp,
  Zap,
  Users,
  PoundSterling,
  BarChart3,
} from "lucide-react";
import { useSavedTime } from "@/hooks/use-filing-cabinet";
import { ROUTE_TYPE_LABEL } from "@/types/care-events";
import { formatDate } from "@/lib/utils";
import { CareEventsPanel } from "@/components/care-events/care-events-panel";
import { AriaPanel } from "@/components/aria/aria-panel";
import { AriaStudioQuickActionButton } from "@/components/aria/studio-quick-action-button";

// ── Route bar component ───────────────────────────────────────────────────────

function RouteBar({
  label,
  minutes,
  count,
  maxMinutes,
}: {
  label: string;
  minutes: number;
  count: number;
  maxMinutes: number;
}) {
  const pct = maxMinutes > 0 ? Math.round((minutes / maxMinutes) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700 font-medium truncate max-w-[60%]">{label}</span>
        <span className="text-slate-500 shrink-0">
          {minutes >= 60
            ? `${(minutes / 60).toFixed(1)}h`
            : `${minutes}m`}{" "}
          · {count} events
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Mini chart (daily bars) ───────────────────────────────────────────────────

function DailyChart({ daily }: { daily: Array<{ date: string; minutes: number }> }) {
  if (daily.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 text-xs">No daily data yet</div>
    );
  }
  const max = Math.max(...daily.map((d) => d.minutes), 1);
  return (
    <div className="flex items-end gap-1 h-20">
      {daily.slice(-30).map((day) => {
        const h = Math.max(4, Math.round((day.minutes / max) * 72));
        return (
          <div
            key={day.date}
            title={`${day.date}: ${day.minutes}m`}
            className="flex-1 bg-emerald-400 rounded-sm hover:bg-emerald-500 transition-colors"
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SavedTimePage() {
  const { data, isLoading } = useSavedTime();
  const meta = data?.meta;
  const metrics = data?.metrics ?? [];

  const byRoute = meta?.by_route ?? {};
  const maxRouteMinutes = Math.max(...Object.values(byRoute).map((r) => r.minutes), 1);

  const byStaff = meta?.by_staff ?? {};

  return (
    <PageShell
      title="Saved-Time Dashboard"
      subtitle="Time saved through automated routing from Care Events — duplication eliminated"
      ariaContext={{ pageTitle: "Saved-Time Dashboard", sourceType: "general" }}
      actions={<AriaStudioQuickActionButton context={{ record_type: "management_oversight", record_id: "home_oak", home_id: "home_oak" }} />}
    >
      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-600" />
              <div>
                <div className="text-2xl font-bold text-emerald-800">
                  {meta?.total_hours ?? 0}h
                </div>
                <div className="text-xs text-emerald-600">Total Saved</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {meta?.total_entries ?? 0}
                </div>
                <div className="text-xs text-slate-500">Routing Events</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {Object.keys(byStaff).length}
                </div>
                <div className="text-xs text-slate-500">Staff Benefiting</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-amber-500" />
              <div>
                <div className="text-2xl font-bold text-amber-700">
                  £{meta?.estimated_value_gbp ?? 0}
                </div>
                <div className="text-xs text-slate-500">Est. Value (£14/hr)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Daily trend */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Daily Trend (last 30 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-20 bg-slate-50 animate-pulse rounded" />
            ) : (
              <DailyChart daily={meta?.daily ?? []} />
            )}
          </CardContent>
        </Card>

        {/* By route type */}
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              By Route Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-6 bg-slate-50 animate-pulse rounded" />
                ))}
              </div>
            ) : Object.keys(byRoute).length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            ) : (
              Object.entries(byRoute)
                .sort((a, b) => b[1].minutes - a[1].minutes)
                .map(([routeType, { minutes, count }]) => (
                  <RouteBar
                    key={routeType}
                    label={ROUTE_TYPE_LABEL[routeType as keyof typeof ROUTE_TYPE_LABEL] ?? routeType}
                    minutes={minutes}
                    count={count}
                    maxMinutes={maxRouteMinutes}
                  />
                ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Per-staff table */}
      {Object.keys(byStaff).length > 0 && (
        <Card className="border-slate-200 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-500" />
              Per-Staff Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {Object.entries(byStaff)
                .sort((a, b) => b[1].minutes - a[1].minutes)
                .map(([staffId, { minutes, count, name }]) => (
                  <div key={staffId} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-slate-700 font-medium">{name}</span>
                    <div className="flex items-center gap-3 text-slate-500 text-xs">
                      <span>{count} events</span>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        {minutes >= 60 ? `${(minutes / 60).toFixed(1)}h` : `${minutes}m`}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent entries */}
      {metrics.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {metrics.slice(0, 20).map((m) => (
                <div key={m.id} className="flex items-start justify-between py-2 text-xs gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-700 font-medium truncate">
                      {m.activity_description}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {ROUTE_TYPE_LABEL[m.route_type as keyof typeof ROUTE_TYPE_LABEL] ?? m.route_type}
                      {m.care_event && (
                        <>
                          {" · "}
                          <Link
                            href={`/care-events/${m.care_event.id}`}
                            className="text-indigo-500 hover:underline"
                          >
                            {m.care_event.title}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      {m.minutes_saved}m
                    </Badge>
                    <p className="text-slate-400 mt-1">{formatDate(m.recorded_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoading && metrics.length === 0 && (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center text-slate-400">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No time savings recorded yet.</p>
            <p className="text-xs mt-1">Savings are logged automatically when Care Events are routed.</p>
          </CardContent>
        </Card>
      )}
      <CareEventsPanel
        title="Related Care Events"
        days={28}
        defaultCollapsed
      />
      <AriaPanel
        mode="assist"
        pageContext="Saved-Time Dashboard — time saved through automated Care Event routing, duplication eliminated, administrative efficiency, staff time metrics, operational efficiency evidence, management oversight"
        recordType="management_oversight"
        className="mt-6"
      />
    </PageShell>
  );
}
