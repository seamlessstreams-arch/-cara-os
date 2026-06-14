"use client";

// ══════════════════════════════════════════════════════════════════════════════
// TASK SLA CARD
//
// Dashboard widget for the Task SLA Monitor — surfaces overdue deadline-bound
// tasks (especially statutory/safeguarding ones) created by the Enter Once
// orchestrators. Completes the feature's vertical (engine+tests+API+hook+widget).
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTaskSla, type SlaEscalation } from "@/hooks/use-task-sla";
import { AlarmClock, ShieldAlert, Clock, CheckCircle2, ChevronRight } from "lucide-react";

const SEV_STYLE: Record<string, { dot: string; text: string; chip: string }> = {
  critical: { dot: "bg-red-500", text: "text-red-700", chip: "bg-red-50 border-red-200 text-red-700" },
  high: { dot: "bg-orange-500", text: "text-orange-700", chip: "bg-orange-50 border-orange-200 text-orange-700" },
  medium: { dot: "bg-amber-500", text: "text-amber-700", chip: "bg-amber-50 border-amber-200 text-amber-700" },
  watch: { dot: "bg-blue-400", text: "text-blue-700", chip: "bg-blue-50 border-blue-200 text-blue-700" },
};

export function TaskSlaCard({ className }: { className?: string }) {
  const { data, isLoading } = useTaskSla();
  const summary = data?.summary;
  const escalations = data?.data ?? [];
  const allClear = !isLoading && (summary?.overdue ?? 0) === 0 && (summary?.approaching ?? 0) === 0;

  return (
    <div className={cn("rounded-2xl border bg-white", allClear ? "border-emerald-200" : "border-[var(--cs-border)]", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--cs-border-subtle)]">
        <div className="flex items-center gap-2">
          <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", allClear ? "bg-emerald-50" : "bg-red-50")}>
            {allClear ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlarmClock className="h-4 w-4 text-red-600" />}
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--cs-navy)]">Action SLAs</p>
            <p className="text-[11px] text-[var(--cs-text-muted)]">Deadline-bound tasks from recorded events</p>
          </div>
        </div>
        <Link href="/tasks" className="text-[11px] text-[var(--cs-cara-gold)] hover:underline flex items-center gap-0.5">
          All tasks <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {isLoading ? (
        <div className="px-5 py-8 text-center text-sm text-[var(--cs-text-muted)]">Checking SLAs…</div>
      ) : (
        <div className="p-5 space-y-4">
          {/* Headline */}
          <p className={cn("text-sm font-medium", allClear ? "text-emerald-700" : "text-[var(--cs-text)]")}>
            {data?.headline}
          </p>

          {/* Summary chips */}
          {!allClear && summary && (
            <div className="flex flex-wrap gap-1.5">
              {summary.breached_critical > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", SEV_STYLE.critical.chip)}>
                  <ShieldAlert className="h-3 w-3" /> {summary.breached_critical} critical
                </span>
              )}
              {summary.breached_high > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", SEV_STYLE.high.chip)}>
                  {summary.breached_high} overdue
                </span>
              )}
              {summary.statutory_overdue > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
                  {summary.statutory_overdue} statutory
                </span>
              )}
              {summary.approaching > 0 && (
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", SEV_STYLE.watch.chip)}>
                  <Clock className="h-3 w-3" /> {summary.approaching} due soon
                </span>
              )}
            </div>
          )}

          {/* Top escalations */}
          {escalations.length > 0 && (
            <ul className="space-y-1.5">
              {escalations.slice(0, 5).map((e: SlaEscalation) => {
                const style = SEV_STYLE[e.severity] ?? SEV_STYLE.medium;
                return (
                  <li key={e.task_id} className="flex items-start gap-2.5">
                    <span className={cn("mt-1 h-2 w-2 rounded-full shrink-0", style.dot)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--cs-text)] truncate">{e.title}</p>
                      <p className={cn("text-[11px]", style.text)}>
                        {e.reason}{e.is_statutory ? " · statutory" : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {allClear && (
            <p className="text-xs text-[var(--cs-text-muted)]">
              Every deadline-bound action from recorded events is within its SLA. Nothing overdue.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
