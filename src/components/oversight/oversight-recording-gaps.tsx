"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Recording gaps.
// Surfaces documentation/recording gaps identified across the workflow. Cautious
// "critical friend" framing — prompts to confirm or close, not conclusions.
// One severity pill per row; calm hairline rows.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { RecordingGap } from "@/lib/oversight/types";

const SEVERITY: Record<RecordingGap["severity"], { label: string; cls: string }> = {
  significant: { label: "Significant", cls: "bg-red-50 text-red-700 border-red-200" },
  moderate: { label: "Moderate", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  minor: { label: "Minor", cls: "bg-slate-50 text-slate-600 border-slate-200" },
};

export function OversightRecordingGaps({ gaps }: { gaps: RecordingGap[] }) {
  if (!gaps.length) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
        <p className="text-sm text-emerald-900">
          No recording gaps identified — the record and connected workflow appear appropriately documented.
        </p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-[var(--cs-border-subtle)]">
      {gaps.map((g, i) => {
        const s = SEVERITY[g.severity];
        return (
          <div key={i} className="flex items-start gap-3 py-2.5">
            <AlertTriangle
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                g.severity === "significant" ? "text-red-500" : g.severity === "moderate" ? "text-amber-500" : "text-slate-400",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-[var(--cs-text)]">
                <span className="font-medium text-[var(--cs-navy)]">{g.area}:</span> {g.gap}
              </p>
            </div>
            <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", s.cls)}>
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
