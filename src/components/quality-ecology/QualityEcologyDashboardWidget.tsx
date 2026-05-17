// ══════════════════════════════════════════════════════════════════════════════
// QualityEcologyDashboardWidget — Document lifecycle & QA compliance card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ComplianceSummary {
  totalOccurrences: number;
  completedOnTime: number;
  completedLate: number;
  missed: number;
  overdue: number;
  complianceRate: number;
}

interface StatusBreakdown {
  [key: string]: number;
}

interface PendingItem {
  id: string;
  templateName: string;
  completedBy?: string;
  status: string;
}

interface DashboardData {
  compliance: ComplianceSummary;
  statusBreakdown: StatusBreakdown;
  pendingApprovalCount: number;
  overdueCount: number;
  pendingApproval: PendingItem[];
  overdueItems: PendingItem[];
}

interface Props {
  homeId?: string;
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Scheduled",
  assigned: "Assigned",
  in_progress: "In Progress",
  submitted: "Submitted",
  checked: "Checked",
  approved: "Approved",
  locked: "Locked",
  filed: "Filed",
  overdue: "Overdue",
  escalated: "Escalated",
  missed: "Missed",
  returned_for_improvement: "Returned",
  resubmitted: "Resubmitted",
};

export function QualityEcologyDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/quality-ecology?homeId=${homeId}`);
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

  const { compliance, pendingApprovalCount, overdueCount, pendingApproval, overdueItems } = data;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-800 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Quality Assurance</h3>
              <p className="text-xs text-muted-foreground">Document lifecycle & QA</p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            compliance.complianceRate >= 90 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" :
            compliance.complianceRate >= 70 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
            "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
          }`}>
            {compliance.complianceRate}%
          </div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50/50 dark:bg-red-900/10">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">
              {overdueCount} overdue item{overdueCount > 1 ? "s" : ""}
            </span>
          </div>
          {overdueItems[0] && (
            <p className="text-[10px] text-red-600 dark:text-red-400 line-clamp-1">
              {overdueItems[0].templateName}
            </p>
          )}
        </div>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{compliance.completedOnTime}</p>
          <p className="text-[10px] text-muted-foreground">On time</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${pendingApprovalCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
            {pendingApprovalCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${compliance.missed > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
            {compliance.missed}
          </p>
          <p className="text-[10px] text-muted-foreground">Missed</p>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-muted-foreground">Completion compliance</span>
          <span className="text-xs font-semibold">{compliance.completedOnTime}/{compliance.totalOccurrences}</span>
        </div>
        <div className="h-2.5 bg-muted rounded-full overflow-hidden flex">
          {compliance.totalOccurrences > 0 && (
            <>
              <div className="h-full bg-emerald-500" style={{ width: `${(compliance.completedOnTime / compliance.totalOccurrences) * 100}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${(compliance.completedLate / compliance.totalOccurrences) * 100}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${(compliance.missed / compliance.totalOccurrences) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-emerald-600">On time</span>
          <span className="text-[9px] text-amber-600">Late</span>
          <span className="text-[9px] text-red-600">Missed</span>
        </div>
      </div>

      {/* Pending approval */}
      {pendingApproval.length > 0 && (
        <div className="border-b border-border">
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Awaiting Approval</p>
          </div>
          <div className="divide-y divide-border">
            {pendingApproval.slice(0, 3).map(item => (
              <div key={item.id} className="px-4 py-2 flex items-center justify-between">
                <p className="text-xs font-medium truncate flex-1">{item.templateName}</p>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-2">
                  {STATUS_LABELS[item.status] ?? item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/quality-assurance" className="text-xs text-primary font-medium hover:underline">
          View quality dashboard →
        </a>
      </div>
    </div>
  );
}
