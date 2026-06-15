"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Task-by-task oversight.
// Every discrete task in the workflow (steps, paperwork, debriefs, key-work) with
// its own deterministic oversight status + suggested comment, so the manager can
// see at a glance what has been reviewed and what still needs action.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, AlertTriangle, HelpCircle, MinusCircle } from "lucide-react";
import type { TaskOversightResult, TaskOversightStatus } from "@/lib/oversight/types";

const STATUS: Record<TaskOversightStatus, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  reviewed_satisfactory: { label: "Satisfactory", cls: "bg-emerald-50 text-emerald-700 border-emerald-200", Icon: CheckCircle2 },
  requires_clarification: { label: "Needs clarification", cls: "bg-amber-50 text-amber-700 border-amber-200", Icon: HelpCircle },
  requires_action: { label: "Action needed", cls: "bg-orange-50 text-orange-700 border-orange-200", Icon: AlertCircle },
  escalated: { label: "Escalated", cls: "bg-red-50 text-red-700 border-red-200", Icon: AlertTriangle },
  not_reviewed: { label: "Not reviewed", cls: "bg-slate-50 text-slate-600 border-slate-200", Icon: MinusCircle },
  not_applicable: { label: "N/A", cls: "bg-slate-50 text-slate-500 border-slate-200", Icon: MinusCircle },
};

export function OversightTaskList({ tasks }: { tasks: TaskOversightResult[] }) {
  if (!tasks.length) {
    return <p className="text-sm text-[var(--cs-text-muted)]">No discrete workflow tasks to review for this record.</p>;
  }
  return (
    <div className="space-y-2">
      {tasks.map((t, i) => {
        const s = STATUS[t.oversightStatus];
        const Icon = s.Icon;
        return (
          <div key={i} className="rounded-lg border border-[var(--cs-border-subtle)] bg-[var(--cs-surface)] p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-[var(--cs-navy)]">{t.taskName}</p>
              <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", s.cls)}>
                <Icon className="h-3 w-3" />
                {s.label}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-[var(--cs-text)]">{t.suggestedOversight}</p>
            {t.requiredAction && (
              <p className="mt-1.5 text-xs text-[var(--cs-text-muted)]">
                Action: {t.requiredAction.action} (responsible: {t.requiredAction.responsibleRole.replace(/_/g, " ")}, by:{" "}
                {t.requiredAction.timescale})
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
