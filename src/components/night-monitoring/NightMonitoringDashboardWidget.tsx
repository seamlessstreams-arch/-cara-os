// ══════════════════════════════════════════════════════════════════════════════
// NightMonitoringDashboardWidget — Night Monitoring dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface LastShift {
  date: string;
  compliant: boolean;
  staffCount: number;
  checksRecorded: number;
  checkRate: number;
  incidents: number;
  handoverCompleted: boolean;
}

interface SleepIssue {
  childName: string;
  poorNights: number;
  totalNights: number;
}

interface IncidentType {
  type: string;
  count: number;
}

interface RecentShift {
  date: string;
  compliant: boolean;
  incidents: number;
  checkRate: number;
}

interface Metrics {
  totalNightsRecorded: number;
  overallComplianceRate: number;
  averageCheckCompletionRate: number;
  handoverCompletionRate: number;
  totalIncidents30Days: number;
  averageSleepHours: number;
  poorSleepRate: number;
  missedCheckRate: number;
  nightsWithIssues: number;
}

interface DashboardData {
  metrics: Metrics;
  lastShift: LastShift;
  childrenWithSleepIssues: SleepIssue[];
  incidentsByType: IncidentType[];
  recentShifts: RecentShift[];
}

interface Props {
  homeId?: string;
}

export function NightMonitoringDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/night-monitoring?homeId=${homeId}&mode=dashboard`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-36 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, lastShift, childrenWithSleepIssues, recentShifts } = data;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Night Monitoring</h3>
              <p className="text-xs text-muted-foreground">Waking checks & sleep</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${metrics.overallComplianceRate >= 90 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
              {metrics.overallComplianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">compliant</p>
          </div>
        </div>
      </div>

      {/* Last night summary */}
      <div className="px-4 py-2.5 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-muted-foreground uppercase">Last Night ({lastShift.date})</span>
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${lastShift.compliant ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"}`}>
            {lastShift.compliant ? "Compliant" : "Issues"}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          <div>
            <span className="text-muted-foreground">Checks</span>
            <p className="font-medium">{lastShift.checkRate}%</p>
          </div>
          <div>
            <span className="text-muted-foreground">Incidents</span>
            <p className="font-medium">{lastShift.incidents}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Handover</span>
            <p className={`font-medium ${lastShift.handoverCompleted ? "text-emerald-600" : "text-red-600"}`}>
              {lastShift.handoverCompleted ? "Done" : "Missing"}
            </p>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.averageSleepHours}h</p>
          <p className="text-[10px] text-muted-foreground">Avg sleep</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.totalIncidents30Days <= 5 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.totalIncidents30Days}
          </p>
          <p className="text-[10px] text-muted-foreground">Incidents (30d)</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.poorSleepRate <= 15 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.poorSleepRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Poor sleep</p>
        </div>
      </div>

      {/* Sleep issues */}
      {childrenWithSleepIssues.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Sleep Concerns</p>
          </div>
          <div className="px-4 py-2 space-y-1">
            {childrenWithSleepIssues.map((child, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{child.childName}</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {child.poorNights}/{child.totalNights} poor nights
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent nights */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Last 7 Nights</p>
        </div>
        <div className="px-4 py-2">
          <div className="flex gap-1">
            {recentShifts.slice(0, 7).map((shift, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={`h-6 rounded-sm flex items-center justify-center text-[8px] font-medium ${
                  shift.compliant
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                }`}>
                  {shift.checkRate}%
                </div>
                <p className="text-[8px] text-muted-foreground mt-0.5">
                  {new Date(shift.date).getDate()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Check completion (avg)</span>
          <span className={`font-medium ${metrics.averageCheckCompletionRate >= 95 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.averageCheckCompletionRate}%
          </span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Handover rate</span>
          <span className={`font-medium ${metrics.handoverCompletionRate >= 95 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.handoverCompletionRate}%
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Nights with issues</span>
          <span className="font-medium">{metrics.nightsWithIssues}/{metrics.totalNightsRecorded}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/night-checks" className="text-xs text-primary font-medium hover:underline">
          View night log →
        </a>
      </div>
    </div>
  );
}
