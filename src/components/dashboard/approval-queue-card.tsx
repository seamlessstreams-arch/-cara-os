"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  FileCheck,
  Flame,
  RotateCcw,
  Shield,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface PendingItem {
  id: string;
  templateName: string;
  completedBy?: string;
  status: string;
  approvalLevel: number;
  dueDate: string;
  homeId: string;
}

interface OverdueItem {
  id: string;
  templateName: string;
  status: string;
  escalationLevel: number;
  dueDate: string;
  dueTime?: string;
  homeId: string;
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

interface QualityEcologyData {
  compliance: ComplianceData;
  statusBreakdown: Record<string, number>;
  pendingApprovalCount: number;
  overdueCount: number;
  pendingApproval: PendingItem[];
  overdueItems: OverdueItem[];
  recentActivity?: { action: string; templateName: string; by: string; at: string; reason?: string }[];
}

// ── Component ──────────────────────────────────────────────────────────────

export function ApprovalQueueCard({ homeId }: { homeId?: string }) {
  const [data, setData] = useState<QualityEcologyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = homeId
      ? `/api/quality-ecology?homeId=${homeId}`
      : "/api/quality-ecology";

    fetch(url)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [homeId]);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
        <div className="h-32 bg-gray-100 rounded" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">Unable to load quality ecology data.</p>
      </div>
    );
  }

  const { compliance, pendingApproval, overdueItems, recentActivity } = data;

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Quality Ecology</h3>
          </div>
          <ComplianceBadge rate={compliance.complianceRate} />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Live lifecycle tracking &bull; {compliance.totalScheduled} items tracked
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 divide-x border-b">
        <MetricCell
          label="On Time"
          value={compliance.completedOnTime}
          icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
        />
        <MetricCell
          label="Late"
          value={compliance.completedLate}
          icon={<Clock className="h-4 w-4 text-amber-500" />}
        />
        <MetricCell
          label="Overdue"
          value={compliance.overdue + compliance.escalated}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          alert={compliance.overdue + compliance.escalated > 0}
        />
        <MetricCell
          label="Returned"
          value={compliance.returnedCount}
          icon={<RotateCcw className="h-4 w-4 text-orange-500" />}
        />
      </div>

      {/* Pending Approval Section */}
      {pendingApproval.length > 0 && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <FileCheck className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Awaiting Your Action ({data.pendingApprovalCount})
            </span>
          </div>
          <div className="space-y-2">
            {pendingApproval.slice(0, 4).map(item => (
              <PendingRow key={item.id} item={item} />
            ))}
            {data.pendingApprovalCount > 4 && (
              <button className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                View all {data.pendingApprovalCount} items
                <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Overdue/Escalated Section */}
      {overdueItems.length > 0 && (
        <div className="p-4 border-b bg-red-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">
              Requires Attention ({data.overdueCount})
            </span>
          </div>
          <div className="space-y-2">
            {overdueItems.slice(0, 3).map(item => (
              <OverdueRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* QA Pass Rate */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium text-gray-700">QA Pass Rate</span>
          </div>
          <span className={cn(
            "text-sm font-bold",
            compliance.qaPassRate >= 80 ? "text-green-600" :
            compliance.qaPassRate >= 60 ? "text-amber-600" : "text-red-600",
          )}>
            {compliance.qaPassRate}%
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              compliance.qaPassRate >= 80 ? "bg-green-500" :
              compliance.qaPassRate >= 60 ? "bg-amber-500" : "bg-red-500",
            )}
            style={{ width: `${compliance.qaPassRate}%` }}
          />
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="p-4">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recent Activity
          </span>
          <div className="mt-2 space-y-2">
            {recentActivity.slice(0, 4).map((activity, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <ActivityDot action={activity.action} />
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-700">{activity.templateName}</span>
                  <span className="text-gray-500"> &mdash; {activity.action} by {activity.by}</span>
                  {activity.reason && (
                    <p className="text-gray-400 italic truncate">&ldquo;{activity.reason}&rdquo;</p>
                  )}
                </div>
                <span className="text-gray-400 whitespace-nowrap">
                  {formatTime(activity.at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ComplianceBadge({ rate }: { rate: number }) {
  const color = rate >= 90 ? "bg-green-100 text-green-700" :
                rate >= 75 ? "bg-amber-100 text-amber-700" :
                "bg-red-100 text-red-700";
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold", color)}>
      {rate}% Compliant
    </span>
  );
}

function MetricCell({
  label,
  value,
  icon,
  alert,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <div className={cn("p-3 text-center", alert && "bg-red-50")}>
      <div className="flex items-center justify-center gap-1">
        {icon}
        <span className={cn("text-lg font-bold", alert && "text-red-600")}>
          {value}
        </span>
      </div>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

function PendingRow({ item }: { item: PendingItem }) {
  const levelColor = item.approvalLevel >= 2 ? "bg-purple-100 text-purple-700" :
                     item.approvalLevel === 1 ? "bg-blue-100 text-blue-700" :
                     "bg-gray-100 text-gray-600";
  const statusLabel = item.status === "submitted" ? "Needs Check" :
                      item.status === "checked" ? "Needs Approval" :
                      "Resubmitted";

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors cursor-pointer">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.templateName}</p>
        <p className="text-xs text-gray-500">
          {statusLabel} &bull; Level {item.approvalLevel}
        </p>
      </div>
      <span className={cn("px-2 py-0.5 rounded text-xs font-medium", levelColor)}>
        L{item.approvalLevel}
      </span>
      <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
    </div>
  );
}

function OverdueRow({ item }: { item: OverdueItem }) {
  const severity = item.escalationLevel >= 2 ? "text-red-700 bg-red-100" :
                   item.escalationLevel === 1 ? "text-amber-700 bg-amber-100" :
                   "text-gray-700 bg-gray-100";
  const statusLabel = item.status === "escalated" ? "ESCALATED" :
                      item.status === "missed" ? "MISSED" : "OVERDUE";

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white border border-red-200">
      <AlertTriangle className={cn(
        "h-4 w-4 flex-shrink-0",
        item.escalationLevel >= 2 ? "text-red-500" : "text-amber-500",
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{item.templateName}</p>
        <p className="text-xs text-gray-500">
          Due {item.dueTime ?? "today"} &bull; Escalation Level {item.escalationLevel}
        </p>
      </div>
      <span className={cn("px-2 py-0.5 rounded text-xs font-bold", severity)}>
        {statusLabel}
      </span>
    </div>
  );
}

function ActivityDot({ action }: { action: string }) {
  const color = action === "approved" ? "bg-green-400" :
                action === "submitted" ? "bg-blue-400" :
                action === "returned" ? "bg-orange-400" :
                action === "escalated" ? "bg-red-400" :
                "bg-gray-400";
  return <div className={cn("h-2 w-2 rounded-full mt-1.5 flex-shrink-0", color)} />;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
