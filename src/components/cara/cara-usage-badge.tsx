"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraUsageBadge
//
// Small badge shown on record pages (daily logs, incidents, key work, etc.)
// when Cara was used to assist with that record. Clicking expands to show
// which Cara command was used, when, and its current status.
//
// Usage:
//   <CaraUsageBadge sourceTable="daily_log_entries" recordId={entry.id} />
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface CaraUsage {
  outputId: string;
  outputLabel: string;
  commandId: string;
  generatedAt: string;
  status: string;
  confidence: string;
}

interface CaraUsageBadgeProps {
  /** Whether the record has the cara_assist_used / cara_oversight_used flag */
  caraAssisted?: boolean;
  /** Source table name for fetching usage details */
  sourceTable?: string;
  /** Record ID for fetching usage details */
  recordId?: string;
  /** Size variant */
  size?: "sm" | "md";
  className?: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "text-amber-600" },
  edited: { label: "Edited", color: "text-blue-600" },
  submitted_for_approval: { label: "Pending", color: "text-indigo-600" },
  approved: { label: "Approved", color: "text-green-600" },
  committed: { label: "Committed", color: "text-emerald-700" },
  rejected: { label: "Rejected", color: "text-red-600" },
  archived: { label: "Archived", color: "text-gray-500" },
};

function formatCommandId(id: string): string {
  return id.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function CaraUsageBadge({
  caraAssisted,
  sourceTable,
  recordId,
  size = "sm",
  className,
}: CaraUsageBadgeProps) {
  const [expanded, setExpanded] = useState(false);
  const [usages, setUsages] = useState<CaraUsage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const fetchUsage = useCallback(async () => {
    if (!sourceTable || !recordId || loaded) return;
    try {
      const res = await fetch(
        `/api/cara/usage?sourceTable=${encodeURIComponent(sourceTable)}&recordId=${encodeURIComponent(recordId)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setUsages(data.data ?? []);
      }
    } catch {
      // Silent fail — badge still shows
    }
    setLoaded(true);
  }, [sourceTable, recordId, loaded]);

  useEffect(() => {
    if (expanded && !loaded) {
      fetchUsage();
    }
  }, [expanded, loaded, fetchUsage]);

  // Don't render if not Cara-assisted
  if (!caraAssisted) return null;

  return (
    <div className={cn("inline-flex flex-col", className)}>
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border transition-colors",
          "border-[var(--cs-cara-gold-soft)] bg-[var(--cs-cara-gold-bg)] hover:bg-[var(--cs-cara-gold-soft)]",
          size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        )}
      >
        <Sparkles
          className={cn(
            "text-[var(--cs-cara-gold)]",
            size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3",
          )}
        />
        <span className="font-medium text-[var(--cs-navy)]">Cara assisted</span>
        {sourceTable && recordId && (
          expanded ? (
            <ChevronUp className="h-2.5 w-2.5 text-[var(--cs-text-muted)]" />
          ) : (
            <ChevronDown className="h-2.5 w-2.5 text-[var(--cs-text-muted)]" />
          )
        )}
      </button>

      {expanded && usages.length > 0 && (
        <div className="mt-1 rounded-lg border border-[var(--cs-border)] bg-white shadow-sm p-2 space-y-1.5 max-w-xs">
          {usages.map((usage) => {
            const statusConfig = STATUS_LABELS[usage.status] ?? {
              label: usage.status,
              color: "text-gray-500",
            };
            return (
              <div
                key={usage.outputId}
                className="flex items-start gap-2 text-[10px]"
              >
                <Sparkles className="h-3 w-3 text-[var(--cs-cara-gold)] mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <div className="font-medium text-[var(--cs-navy)]">
                    {formatCommandId(usage.commandId)}
                  </div>
                  <div className="text-[var(--cs-text-muted)]">
                    {formatTimestamp(usage.generatedAt)}
                    {" · "}
                    <span className={statusConfig.color}>
                      {statusConfig.label}
                    </span>
                    {" · "}
                    {usage.confidence} confidence
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expanded && loaded && usages.length === 0 && (
        <div className="mt-1 text-[10px] text-[var(--cs-text-muted)]">
          Cara usage details not available
        </div>
      )}
    </div>
  );
}

// Expose pure helpers for unit testing
export const _testing = { formatCommandId, formatTimestamp, STATUS_LABELS };
