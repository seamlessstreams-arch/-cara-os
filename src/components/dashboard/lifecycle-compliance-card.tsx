"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  FileCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface StatusBreakdown {
  [key: string]: number;
}

interface ComplianceData {
  totalScheduled: number;
  completedOnTime: number;
  completedLate: number;
  missed: number;
  overdue: number;
  escalated: number;
  complianceRate: number;
  returnedCount: number;
  qaPassRate: number;
}

// ── Component ──────────────────────────────────────────────────────────────

export function LifecycleComplianceCard({ homeId }: { homeId?: string }) {
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [breakdown, setBreakdown] = useState<StatusBreakdown>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = homeId
      ? `/api/quality-ecology?homeId=${homeId}`
      : "/api/quality-ecology";

    fetch(url)
      .then(r => r.json())
      .then(data => {
        setCompliance(data.compliance);
        setBreakdown(data.statusBreakdown ?? {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-48 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!compliance) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Unable to load compliance data.</p>
      </div>
    );
  }

  const total = compliance.totalScheduled;
  const complianceColor = compliance.complianceRate >= 90 ? "text-green-600" :
                          compliance.complianceRate >= 75 ? "text-amber-600" : "text-red-600";

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Lifecycle Compliance</h3>
          </div>
        </div>
      </div>

      {/* Big Compliance Rate */}
      <div className="p-6 text-center border-b">
        <div className={cn("text-5xl font-bold", complianceColor)}>
          {compliance.complianceRate}%
        </div>
        <p className="text-sm text-gray-500 mt-1">
          of scheduled items completed on time
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {compliance.complianceRate >= 90 ? (
            <><TrendingUp className="h-4 w-4 text-green-500" /><span className="text-xs text-green-600 font-medium">Outstanding</span></>
          ) : compliance.complianceRate >= 75 ? (
            <><TrendingUp className="h-4 w-4 text-amber-500" /><span className="text-xs text-amber-600 font-medium">Requires Improvement</span></>
          ) : (
            <><TrendingDown className="h-4 w-4 text-red-500" /><span className="text-xs text-red-600 font-medium">Inadequate</span></>
          )}
        </div>
      </div>

      {/* Status Breakdown Grid */}
      <div className="p-4">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          Status Breakdown
        </span>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatusRow
            icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
            label="Approved / Filed"
            count={(breakdown.approved ?? 0) + (breakdown.filed ?? 0) + (breakdown.locked ?? 0)}
            total={total}
            color="bg-green-500"
          />
          <StatusRow
            icon={<FileCheck className="h-4 w-4 text-blue-500" />}
            label="Awaiting Review"
            count={(breakdown.submitted ?? 0) + (breakdown.checked ?? 0) + (breakdown.resubmitted ?? 0)}
            total={total}
            color="bg-blue-500"
          />
          <StatusRow
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            label="In Progress"
            count={(breakdown.in_progress ?? 0) + (breakdown.assigned ?? 0)}
            total={total}
            color="bg-amber-500"
          />
          <StatusRow
            icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
            label="Returned"
            count={breakdown.returned_for_improvement ?? 0}
            total={total}
            color="bg-orange-500"
          />
          <StatusRow
            icon={<XCircle className="h-4 w-4 text-red-500" />}
            label="Overdue / Missed"
            count={(breakdown.overdue ?? 0) + (breakdown.missed ?? 0)}
            total={total}
            color="bg-red-500"
          />
          <StatusRow
            icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
            label="Escalated"
            count={breakdown.escalated ?? 0}
            total={total}
            color="bg-red-600"
          />
        </div>
      </div>

      {/* Visual Bar */}
      <div className="px-4 pb-4">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden flex">
          {total > 0 && (
            <>
              <div className="bg-green-500 h-full" style={{ width: `${((breakdown.approved ?? 0) + (breakdown.filed ?? 0) + (breakdown.locked ?? 0)) / total * 100}%` }} />
              <div className="bg-blue-500 h-full" style={{ width: `${((breakdown.submitted ?? 0) + (breakdown.checked ?? 0)) / total * 100}%` }} />
              <div className="bg-amber-500 h-full" style={{ width: `${((breakdown.in_progress ?? 0) + (breakdown.assigned ?? 0)) / total * 100}%` }} />
              <div className="bg-orange-500 h-full" style={{ width: `${(breakdown.returned_for_improvement ?? 0) / total * 100}%` }} />
              <div className="bg-red-500 h-full" style={{ width: `${((breakdown.overdue ?? 0) + (breakdown.missed ?? 0) + (breakdown.escalated ?? 0)) / total * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>Complete</span>
          <span>In Progress</span>
          <span>At Risk</span>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatusRow({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-2">
      {icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600 truncate">{label}</span>
          <span className="text-xs font-bold text-gray-800">{count}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 mt-1 overflow-hidden">
          <div className={cn("h-full rounded-full", color)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
