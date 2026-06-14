"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CaraHistoryTimeline
//
// Compact timeline showing a user's recent Cara interactions. Shows command
// name, module, status, confidence, and a text preview. Designed for the
// Cara dashboard and profile pages.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { useCaraHistory, type HistoryEntry } from "@/hooks/use-cara-history";
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  FileEdit,
  AlertTriangle,
  Loader2,
} from "lucide-react";

interface CaraHistoryTimelineProps {
  userId: string;
  days?: number;
  limit?: number;
  className?: string;
}

function formatCommandId(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
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

const STATUS_ICON: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  draft: { icon: FileEdit, color: "text-amber-500", label: "Draft" },
  edited: { icon: FileEdit, color: "text-blue-500", label: "Edited" },
  submitted_for_approval: {
    icon: Clock,
    color: "text-indigo-500",
    label: "Pending",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-green-600",
    label: "Approved",
  },
  committed: {
    icon: CheckCircle2,
    color: "text-emerald-700",
    label: "Committed",
  },
  rejected: { icon: XCircle, color: "text-red-500", label: "Rejected" },
  archived: { icon: Clock, color: "text-gray-400", label: "Archived" },
};

const MODULE_LABELS: Record<string, string> = {
  daily_log: "Daily Log",
  incident: "Incidents",
  key_work: "Key Work",
  supervision: "Supervision",
  care_plan: "Care Plans",
  handover: "Handover",
  management_oversight: "Oversight",
  general: "General",
  hr: "HR",
  safeguarding: "Safeguarding",
  audit: "Audit",
};

export function CaraHistoryTimeline({
  userId,
  days = 30,
  limit = 10,
  className,
}: CaraHistoryTimelineProps) {
  const { data: entries, isLoading } = useCaraHistory({
    userId,
    days,
    limit,
  });

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--cs-border)] bg-white p-5",
          className,
        )}
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--cs-cara-gold)]" />
          <span className="text-xs text-[var(--cs-text-muted)]">
            Loading Cara history...
          </span>
        </div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--cs-border)] bg-white p-5 text-center",
          className,
        )}
      >
        <Sparkles className="h-6 w-6 text-[var(--cs-text-gentle)] mx-auto mb-2" />
        <p className="text-xs text-[var(--cs-text-muted)]">
          No Cara activity in the last {days} days
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--cs-border)] bg-white overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[var(--cs-cara-gold-bg)] to-white border-b border-[var(--cs-border)]">
        <div className="h-7 w-7 rounded-lg bg-[var(--cs-navy)] flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-[var(--cs-navy)]">
            My Cara History
          </div>
          <div className="text-[10px] text-[var(--cs-text-muted)]">
            Last {days} days · {entries.length} interaction
            {entries.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="divide-y divide-[var(--cs-border)]">
        {entries.map((entry) => (
          <TimelineRow key={entry.requestId} entry={entry} />
        ))}
      </div>
    </div>
  );
}

function TimelineRow({ entry }: { entry: HistoryEntry }) {
  const statusConfig = entry.output
    ? STATUS_ICON[entry.output.status] ?? STATUS_ICON.draft
    : { icon: Clock, color: "text-gray-400", label: "No output" };
  const StatusIcon = statusConfig.icon;

  return (
    <div className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start gap-3">
        {/* Status icon */}
        <div className="mt-0.5 shrink-0">
          <StatusIcon className={cn("h-4 w-4", statusConfig.color)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--cs-navy)]">
              {formatCommandId(entry.commandId)}
            </span>
            <span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-[var(--cs-text-muted)]">
              {MODULE_LABELS[entry.module] ?? entry.module}
            </span>
            {entry.output && (
              <span
                className={cn(
                  "text-[10px] font-medium",
                  statusConfig.color,
                )}
              >
                {statusConfig.label}
              </span>
            )}
            {entry.output?.guardrailFlagged && (
              <AlertTriangle className="h-3 w-3 text-amber-500" />
            )}
          </div>

          {entry.output?.generatedTextPreview && (
            <p className="text-[11px] text-[var(--cs-text-secondary)] mt-1 line-clamp-2 leading-relaxed">
              {entry.output.generatedTextPreview}
              {entry.output.generatedTextPreview.length >= 120 && "..."}
            </p>
          )}

          <div className="text-[10px] text-[var(--cs-text-muted)] mt-1">
            {formatDate(entry.createdAt)}
            {entry.output && (
              <>
                {" · "}
                <span
                  className={cn(
                    "font-medium",
                    entry.output.confidence === "high" && "text-green-600",
                    entry.output.confidence === "medium" && "text-amber-600",
                    entry.output.confidence === "low" && "text-red-500",
                  )}
                >
                  {entry.output.confidence} confidence
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Expose pure helpers for testing
export const _testing = { formatCommandId, formatDate, STATUS_ICON, MODULE_LABELS };
