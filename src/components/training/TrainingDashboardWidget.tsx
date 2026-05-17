// ══════════════════════════════════════════════════════════════════════════════
// TrainingDashboardWidget — Training & Development dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface StaffSummary {
  staffId: string;
  staffName: string;
  role: string;
  isCompliant: boolean;
  overallComplianceRate: number;
  expiredCount: number;
  expiringSoonCount: number;
  inductionComplete: boolean;
  qualificationOnTrack: boolean;
  issueCount: number;
}

interface UpcomingExpiry {
  staffName: string;
  category: string;
  expiryDate: string;
}

interface Metrics {
  staffCount: number;
  overallComplianceRate: number;
  fullyCompliantStaff: number;
  staffWithExpiredTraining: number;
  staffWithExpiringSoon: number;
  inductionCompletionRate: number;
  qualificationRate: number;
  averageCpdHours: number;
  cpdComplianceRate: number;
  restraintTrainingCurrent: number;
  safeguardingCurrent: number;
  firstAidCurrent: number;
  loneWorkingAuthorised: number;
}

interface DashboardData {
  metrics: Metrics;
  staff: StaffSummary[];
  upcomingExpiries: UpcomingExpiry[];
  complianceIssues: string[];
}

interface Props {
  homeId?: string;
}

const ROLE_LABELS: Record<string, string> = {
  registered_manager: "RM",
  deputy_manager: "DM",
  senior_worker: "Senior",
  residential_worker: "RCW",
  waking_night: "Night",
};

export function TrainingDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/training?homeId=${homeId}&mode=dashboard`);
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

  const { metrics, staff, upcomingExpiries, complianceIssues } = data;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Training & Development</h3>
              <p className="text-xs text-muted-foreground">Mandatory training matrix</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${metrics.overallComplianceRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : metrics.overallComplianceRate >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
              {metrics.overallComplianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">compliance</p>
          </div>
        </div>
      </div>

      {/* Expired training alert */}
      {metrics.staffWithExpiredTraining > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {metrics.staffWithExpiredTraining} staff with expired training
            </span>
          </div>
          {complianceIssues[0] && (
            <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-1">
              {complianceIssues[0]}
            </p>
          )}
        </div>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.fullyCompliantStaff}/{metrics.staffCount}</p>
          <p className="text-[10px] text-muted-foreground">Compliant</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.qualificationRate >= 80 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.qualificationRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Qualified</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.averageCpdHours}h</p>
          <p className="text-[10px] text-muted-foreground">Avg CPD</p>
        </div>
      </div>

      {/* Staff list */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Staff</p>
        </div>
        <div className="divide-y divide-border">
          {staff.map(s => (
            <div key={s.staffId} className="px-4 py-2">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium">{s.staffName}</p>
                  <span className="text-[9px] text-muted-foreground">{ROLE_LABELS[s.role] ?? s.role}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  s.isCompliant
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}>
                  {s.isCompliant ? `${s.overallComplianceRate}%` : `${s.issueCount} issue${s.issueCount > 1 ? "s" : ""}`}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    s.overallComplianceRate >= 90 ? "bg-emerald-500" :
                    s.overallComplianceRate >= 70 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${s.overallComplianceRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming expiries */}
      {upcomingExpiries.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Expiring Soon</p>
          </div>
          <div className="px-4 py-2 space-y-1">
            {upcomingExpiries.slice(0, 3).map((exp, i) => (
              <div key={i} className="flex justify-between text-[10px]">
                <span className="text-muted-foreground">{exp.staffName} — {exp.category}</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  {new Date(exp.expiryDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key training counts */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Safeguarding current</span>
          <span className={`font-medium ${metrics.safeguardingCurrent === metrics.staffCount ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.safeguardingCurrent}/{metrics.staffCount}
          </span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Restraint (PI) current</span>
          <span className={`font-medium ${metrics.restraintTrainingCurrent === metrics.staffCount ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.restraintTrainingCurrent}/{metrics.staffCount}
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">First Aid current</span>
          <span className={`font-medium ${metrics.firstAidCurrent === metrics.staffCount ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.firstAidCurrent}/{metrics.staffCount}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/training" className="text-xs text-primary font-medium hover:underline">
          View training matrix →
        </a>
      </div>
    </div>
  );
}
