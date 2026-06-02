"use client";

// ══════════════════════════════════════════════════════════════════════════════
// RECORD ACTIVITY FEED
//
// Live stream of every record created via the universal "Enter Once" entry,
// read from the orchestrator audit log (GET /api/v1/audit). Closes the loop:
// records entered once are now visible flowing through the system.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { useRecordAudit, type RecordAuditEntry } from "@/hooks/use-record-audit";
import { formatRelative } from "@/lib/utils";
import { Activity, Shield, AlertTriangle, FileText, Loader2 } from "lucide-react";

const RISK_STYLES: Record<string, { dot: string; label: string }> = {
  critical: { dot: "bg-red-500", label: "text-red-700" },
  high: { dot: "bg-orange-500", label: "text-orange-700" },
  medium: { dot: "bg-amber-500", label: "text-amber-700" },
  low: { dot: "bg-emerald-500", label: "text-emerald-700" },
  none: { dot: "bg-slate-300", label: "text-slate-500" },
};

function entityIcon(entityType: string): React.ElementType {
  if (entityType === "incident" || entityType === "restraint") return AlertTriangle;
  if (entityType === "safeguarding_concern" || entityType === "missing_from_care") return Shield;
  return FileText;
}

export function RecordActivityFeed({ limit = 25, className }: { limit?: number; className?: string }) {
  const { data, isLoading } = useRecordAudit({ limit });
  const entries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className={cn("rounded-2xl border border-[var(--cs-border)] bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cs-border)]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[var(--cs-aria-gold-bg)] flex items-center justify-center">
            <Activity className="h-4 w-4 text-[var(--cs-aria-gold)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--cs-navy)]">Record Activity</p>
            <p className="text-[11px] text-[var(--cs-text-muted)]">
              Live stream of records entered across the home
            </p>
          </div>
        </div>
        {meta && (
          <span className="text-[10px] text-[var(--cs-text-muted)] tabular-nums">
            {meta.total} entr{meta.total === 1 ? "y" : "ies"}
          </span>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-[var(--cs-text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading activity…
        </div>
      ) : entries.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Activity className="h-8 w-8 text-[var(--cs-text-gentle)] mx-auto mb-2" />
          <p className="text-sm text-[var(--cs-text-muted)]">No records entered yet.</p>
          <p className="text-[11px] text-[var(--cs-text-gentle)] mt-1">
            Records created via &ldquo;Record anything&rdquo; will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--cs-border-subtle)] max-h-[480px] overflow-y-auto">
          {entries.map((e: RecordAuditEntry) => {
            const Icon = entityIcon(e.entity_type);
            const risk = RISK_STYLES[e.risk_level] ?? RISK_STYLES.none;
            return (
              <li key={e.id} className="flex items-start gap-3 px-5 py-3 hover:bg-[var(--cs-bg)] transition-colors">
                <div className="mt-0.5 h-7 w-7 rounded-lg bg-[var(--cs-bg)] flex items-center justify-center shrink-0">
                  <Icon className="h-3.5 w-3.5 text-[var(--cs-text-secondary)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--cs-text)] leading-snug">{e.summary}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1">
                      <span className={cn("h-1.5 w-1.5 rounded-full", risk.dot)} />
                      <span className={cn("text-[10px] capitalize", risk.label)}>{e.risk_level} risk</span>
                    </span>
                    <span className="text-[10px] text-[var(--cs-text-gentle)]">·</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)] capitalize">{e.entity_type.replace(/_/g, " ")}</span>
                    <span className="text-[10px] text-[var(--cs-text-gentle)]">·</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)]">{formatRelative(e.created_at)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
