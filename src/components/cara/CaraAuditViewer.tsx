// ══════════════════════════════════════════════════════════════════════════════
// CaraAuditViewer — Audit log viewer for AI operations
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useState } from "react";
import type { CaraRiskLevel, CaraTaskType, CaraProviderName } from "@/lib/cara/core/types";

interface AuditEntry {
  id: string;
  userId: string;
  taskType: CaraTaskType;
  provider: CaraProviderName;
  model: string;
  riskLevel: CaraRiskLevel;
  redactionApplied: boolean;
  approvalRequired: boolean;
  approvalStatus: string;
  tokenUsage: number;
  estimatedCost: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  timestamp: string;
}

interface Props {
  entries: AuditEntry[];
  loading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}

const RISK_STYLES: Record<CaraRiskLevel, string> = {
  low: "text-emerald-700 dark:text-emerald-400",
  medium: "text-amber-700 dark:text-amber-400",
  high: "text-orange-700 dark:text-orange-400",
  critical: "text-red-700 dark:text-red-400",
};

export function CaraAuditViewer({
  entries,
  loading = false,
  onLoadMore,
  hasMore = false,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold">AI Audit Log</h3>
            <p className="text-xs text-muted-foreground">
              {entries.length} entries • All AI operations are logged for governance
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Task</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Provider</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Risk</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cost</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Latency</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map(entry => (
              <tr
                key={entry.id}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="hover:bg-muted/50 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {new Date(entry.timestamp).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  {entry.taskType.replace(/_/g, " ")}
                </td>
                <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                  {entry.provider}
                </td>
                <td className={`px-3 py-2 font-medium ${RISK_STYLES[entry.riskLevel]}`}>
                  {entry.riskLevel}
                </td>
                <td className="px-3 py-2">
                  {entry.success ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      OK
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-400">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {entry.errorCode ?? "Error"}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  £{entry.estimatedCost.toFixed(4)}
                </td>
                <td className="px-3 py-2 text-right text-muted-foreground">
                  {entry.latencyMs}ms
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
      )}

      {hasMore && !loading && (
        <div className="p-3 border-t border-border text-center">
          <button
            onClick={onLoadMore}
            className="text-xs text-primary hover:underline font-medium"
          >
            Load more entries
          </button>
        </div>
      )}
    </div>
  );
}
