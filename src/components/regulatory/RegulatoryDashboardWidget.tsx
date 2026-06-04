// ══════════════════════════════════════════════════════════════════════════════
// RegulatoryDashboardWidget — Reg 44/45 reporting compliance card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface RegulatoryData {
  homeId: string;
  reg44Compliance: {
    totalExpected: number;
    completed: number;
    overdue: number;
    lastVisitDate: string | null;
    daysSinceLastVisit: number | null;
    nextDueDate: string;
    unannounced: number;
    announcedPercentage: number;
    openActionPoints: number;
    overdueActionPoints: number;
  };
  reg45Compliance: {
    totalExpected: number;
    completed: number;
    overdue: number;
    lastReviewDate: string | null;
    nextDueDate: string;
    sentToOfsted: boolean;
  };
  notifications: {
    total: number;
    overdue: number;
    withinTimescale: number;
    complianceRate: number;
  };
  overallStatus: "compliant" | "at_risk" | "non_compliant";
  issues: string[];
}

interface Props {
  homeId?: string;
}

const STATUS_STYLES: Record<string, string> = {
  compliant: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  at_risk: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  non_compliant: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  compliant: "Compliant",
  at_risk: "At Risk",
  non_compliant: "Non-Compliant",
};

export function RegulatoryDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<RegulatoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/regulatory?homeId=${homeId}&view=compliance`);
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

  const { reg44Compliance, reg45Compliance, notifications } = data;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Regulatory Reporting</h3>
              <p className="text-xs text-muted-foreground">Reg 44/45 — Independent visits</p>
            </div>
          </div>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[data.overallStatus] ?? ""}`}>
            {STATUS_LABELS[data.overallStatus] ?? data.overallStatus}
          </span>
        </div>
      </div>

      {/* Issues alert */}
      {data.issues.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {data.issues.length} compliance issue{data.issues.length > 1 ? "s" : ""}
            </span>
          </div>
          <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-1">
            {data.issues[0]}
          </p>
        </div>
      )}

      {/* Reg 44 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">Reg 44 — Monthly Visits</p>
          <span className="text-[10px] text-muted-foreground">{reg44Compliance.completed}/{reg44Compliance.totalExpected} this year</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Last visit</p>
            <p className="text-xs font-medium">
              {reg44Compliance.lastVisitDate
                ? `${reg44Compliance.daysSinceLastVisit}d ago`
                : "None recorded"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Next due</p>
            <p className="text-xs font-medium">
              {new Date(reg44Compliance.nextDueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
            </p>
          </div>
        </div>
        {(reg44Compliance.openActionPoints > 0 || reg44Compliance.overdueActionPoints > 0) && (
          <div className="mt-2 flex gap-3">
            {reg44Compliance.openActionPoints > 0 && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400">
                {reg44Compliance.openActionPoints} open actions
              </span>
            )}
            {reg44Compliance.overdueActionPoints > 0 && (
              <span className="text-[10px] text-red-600 dark:text-red-400">
                {reg44Compliance.overdueActionPoints} overdue
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reg 45 */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium">Reg 45 — Quality Review</p>
          <span className={`text-[10px] font-medium ${reg45Compliance.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
            {reg45Compliance.overdue > 0 ? "Overdue" : "On track"}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground">Last review</p>
            <p className="text-xs font-medium">
              {reg45Compliance.lastReviewDate
                ? new Date(reg45Compliance.lastReviewDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                : "None"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Sent to Ofsted</p>
            <p className={`text-xs font-medium ${reg45Compliance.sentToOfsted ? "text-emerald-600" : "text-red-600"}`}>
              {reg45Compliance.sentToOfsted ? "Yes" : "No"}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-medium">Statutory Notifications</p>
          <span className="text-xs font-bold">{notifications.complianceRate}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${notifications.complianceRate >= 95 ? "bg-emerald-500" : notifications.complianceRate >= 75 ? "bg-amber-500" : "bg-red-500"}`}
            style={{ width: `${notifications.complianceRate}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">{notifications.withinTimescale}/{notifications.total} within timescale</span>
          {notifications.overdue > 0 && (
            <span className="text-[10px] text-red-600 dark:text-red-400">{notifications.overdue} overdue</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/ri" className="text-xs text-primary font-medium hover:underline">
          View regulatory reports →
        </a>
      </div>
    </div>
  );
}
