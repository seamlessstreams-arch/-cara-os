// ══════════════════════════════════════════════════════════════════════════════
// MedicationDashboardWidget — Medication Management dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildSummary {
  childId: string;
  childName: string;
  activeMedications: number;
  isCompliant: boolean;
  marCompletionRate: number;
  issueCount: number;
  warningCount: number;
  refusalRate: number;
}

interface RecentError {
  childName: string;
  errorType: string;
  severity: string;
  date: string;
}

interface Metrics {
  totalActiveMedications: number;
  controlledDrugCount: number;
  overallMarCompletionRate: number;
  overallComplianceRate: number;
  errorCount30Days: number;
  nearMissCount30Days: number;
  refusalRate: number;
  overdueReviews: number;
  stockDiscrepancies: number;
  controlledDrugCompliant: boolean;
  staffTrainingCompliant: boolean;
  selfAdminChildCount: number;
  childCount: number;
}

interface DashboardData {
  metrics: Metrics;
  children: ChildSummary[];
  recentErrors: RecentError[];
  complianceIssues: string[];
}

interface Props {
  homeId?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  near_miss: "text-slate-600 dark:text-slate-400",
  minor: "text-amber-600 dark:text-amber-400",
  moderate: "text-orange-600 dark:text-orange-400",
  serious: "text-red-600 dark:text-red-400",
  critical: "text-red-700 dark:text-red-300 font-bold",
};

export function MedicationDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/medication?homeId=${homeId}&mode=dashboard`);
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

  const { metrics, children, recentErrors, complianceIssues } = data;
  const nonCompliantChildren = children.filter(c => !c.isCompliant);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Medication Management</h3>
              <p className="text-xs text-muted-foreground">MAR charts & controlled drugs</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">{metrics.totalActiveMedications}</p>
            <p className="text-[10px] text-muted-foreground">active meds</p>
          </div>
        </div>
      </div>

      {/* Compliance issues alert */}
      {complianceIssues.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {complianceIssues.length} issue{complianceIssues.length > 1 ? "s" : ""} requiring action
            </span>
          </div>
          <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-1">
            {complianceIssues[0]}
          </p>
        </div>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.overallMarCompletionRate >= 98 ? "text-emerald-600 dark:text-emerald-400" : metrics.overallMarCompletionRate >= 90 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {metrics.overallMarCompletionRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">MAR complete</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.errorCount30Days === 0 ? "text-emerald-600 dark:text-emerald-400" : metrics.errorCount30Days <= 2 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
            {metrics.errorCount30Days}
          </p>
          <p className="text-[10px] text-muted-foreground">Errors (30d)</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.controlledDrugCompliant ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {metrics.controlledDrugCompliant ? "Yes" : "No"}
          </p>
          <p className="text-[10px] text-muted-foreground">CD compliant</p>
        </div>
      </div>

      {/* Per-child summary */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Children ({metrics.childCount})</p>
        </div>
        <div className="divide-y divide-border">
          {children.map(child => (
            <div key={child.childId} className="px-4 py-2">
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium">{child.childName}</p>
                  <span className="text-[9px] text-muted-foreground">{child.activeMedications} med{child.activeMedications !== 1 ? "s" : ""}</span>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                  child.isCompliant
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                    : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                }`}>
                  {child.isCompliant ? "Compliant" : `${child.issueCount} issue${child.issueCount > 1 ? "s" : ""}`}
                </span>
              </div>
              {child.refusalRate > 0 && (
                <p className="text-[10px] text-amber-600 dark:text-amber-400">
                  {child.refusalRate}% refusal rate
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent errors */}
      {recentErrors.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Recent Errors</p>
          </div>
          <div className="divide-y divide-border">
            {recentErrors.slice(0, 2).map((err, i) => (
              <div key={i} className="px-4 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{err.childName}</p>
                  <span className={`text-[9px] font-medium ${SEVERITY_STYLES[err.severity] ?? ""}`}>
                    {err.severity.replace("_", " ")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{err.errorType}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Controlled drugs</span>
          <span className="font-medium">{metrics.controlledDrugCount}</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Overdue reviews</span>
          <span className={`font-medium ${metrics.overdueReviews > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            {metrics.overdueReviews}
          </span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Self-admin children</span>
          <span className="font-medium">{metrics.selfAdminChildCount}</span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Staff training</span>
          <span className={`font-medium ${metrics.staffTrainingCompliant ? "text-emerald-600" : "text-red-600"}`}>
            {metrics.staffTrainingCompliant ? "Compliant" : "Below 80%"}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/medication" className="text-xs text-primary font-medium hover:underline">
          View medication dashboard →
        </a>
      </div>
    </div>
  );
}
