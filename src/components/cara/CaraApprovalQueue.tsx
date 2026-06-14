// ══════════════════════════════════════════════════════════════════════════════
// CaraApprovalQueue — Queue of AI outputs awaiting human review
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraApprovalRecord, CaraRiskLevel } from "@/lib/cara/core/types";

interface Props {
  items: CaraApprovalRecord[];
  onSelect: (item: CaraApprovalRecord) => void;
  onApprove: (id: string, notes: string) => void;
  onReject: (id: string, reason: string) => void;
  loading?: boolean;
}

const RISK_STYLES: Record<CaraRiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

export function CaraApprovalQueue({
  items,
  onSelect,
  onApprove,
  onReject,
  loading = false,
}: Props) {
  const [filter, setFilter] = useState<"all" | "high" | "critical">("all");

  const filtered = items.filter(item => {
    if (filter === "all") return true;
    if (filter === "high") return item.riskLevel === "high" || item.riskLevel === "critical";
    return item.riskLevel === "critical";
  });

  const pendingCount = items.filter(i => i.status === "pending_review").length;
  const criticalCount = items.filter(i => i.riskLevel === "critical").length;

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Approval Queue</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {pendingCount} pending review{criticalCount > 0 && ` • ${criticalCount} critical`}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilter("all")}
              className={`px-2 py-1 rounded ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("high")}
              className={`px-2 py-1 rounded ${filter === "high" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              High+
            </button>
            <button
              onClick={() => setFilter("critical")}
              className={`px-2 py-1 rounded ${filter === "critical" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            >
              Critical
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading approvals...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <svg className="w-8 h-8 mx-auto mb-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No items pending approval
          </div>
        ) : (
          filtered.map(item => (
            <ApprovalQueueItem
              key={item.id}
              item={item}
              onSelect={() => onSelect(item)}
              onApprove={(notes) => onApprove(item.id, notes)}
              onReject={(reason) => onReject(item.id, reason)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ApprovalQueueItem({
  item,
  onSelect,
  onApprove,
  onReject,
}: {
  item: CaraApprovalRecord;
  onSelect: () => void;
  onApprove: (notes: string) => void;
  onReject: (reason: string) => void;
}) {
  const [showQuickActions, setShowQuickActions] = useState(false);

  const timeAgo = getRelativeTime(item.generatedAt);

  return (
    <div className="p-3 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onSelect} className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${RISK_STYLES[item.riskLevel]}`}>
              {item.riskLevel}
            </span>
            <span className="text-sm font-medium">{item.taskType.replace(/_/g, " ")}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{item.provider} / {item.generatedByModel}</span>
            <span>{timeAgo}</span>
            {item.redactionApplied && (
              <span className="text-violet-600 dark:text-violet-400">Redacted</span>
            )}
          </div>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          {!showQuickActions ? (
            <button
              onClick={() => setShowQuickActions(true)}
              className="p-1.5 rounded hover:bg-muted text-muted-foreground"
              title="Quick actions"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onApprove(""); setShowQuickActions(false); }}
                className="px-2 py-1 text-xs font-medium rounded bg-emerald-600 text-white hover:bg-emerald-700"
                title="Quick approve"
              >
                ✓
              </button>
              <button
                onClick={() => { onReject("Rejected via queue"); setShowQuickActions(false); }}
                className="px-2 py-1 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700"
                title="Quick reject"
              >
                ✗
              </button>
              <button
                onClick={() => setShowQuickActions(false)}
                className="px-2 py-1 text-xs rounded text-muted-foreground hover:bg-muted"
              >
                ←
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
