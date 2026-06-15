"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Oversight record picker.
// Lets a manager choose a real event to run workflow assurance on. Calm rows,
// one severity pill + one status pill per row.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import type { OversightRecordOption } from "@/hooks/use-oversight-workflow";

const SEVERITY_CLS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  critical: "bg-red-50 text-red-700 border-red-200",
};

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", cls)}>{label}</span>
  );
}

export function OversightRecordPicker({
  records,
  selectedId,
  onSelect,
}: {
  records: OversightRecordOption[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) {
  if (!records.length) {
    return <p className="text-sm text-[var(--cs-text-muted)]">No recent events available to review.</p>;
  }
  return (
    <div className="divide-y divide-[var(--cs-border-subtle)]">
      {records.map((r) => {
        const selected = r.id === selectedId;
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r.id)}
            className={cn(
              "flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-[var(--cs-surface)]",
              selected && "bg-[var(--cs-surface)]",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--cs-navy)]">
                {r.reference} · {r.type.replace(/_/g, " ")}
              </p>
              <p className="truncate text-xs text-[var(--cs-text-muted)]">
                {r.childName} · {r.date}
              </p>
            </div>
            <Pill label={r.severity} cls={SEVERITY_CLS[r.severity] ?? "bg-slate-50 text-slate-600 border-slate-200"} />
            {r.oversightDone ? (
              <Pill label="Reviewed" cls="bg-emerald-50 text-emerald-700 border-emerald-200" />
            ) : r.requiresOversight ? (
              <Pill label="Needs oversight" cls="bg-sky-50 text-sky-700 border-sky-200" />
            ) : null}
            <ChevronRight className="h-4 w-4 shrink-0 text-[var(--cs-text-muted)]" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
