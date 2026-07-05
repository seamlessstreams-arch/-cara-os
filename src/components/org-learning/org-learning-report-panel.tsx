"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — Organisational Learning Report Panel (leadership)
//
// A period synthesis for the RM / RI: emerging risks and unresolved learning
// first, then repeated themes, child-voice themes, strengths and evidence of
// improvement. Every theme links to its source records; thin sections say so.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, BookOpen } from "lucide-react";
import { useOrgLearningReport } from "@/hooks/use-org-learning-report";
import type { ReportPeriod, ThemeWeight } from "@/lib/org-learning-report/types";

const WEIGHT_STYLE: Record<ThemeWeight, { bg: string; fg: string; border: string }> = {
  priority: { bg: "#fdeceb", fg: "#c0392b", border: "#f0b8b2" },
  watch: { bg: "#fdf4e3", fg: "#b7791f", border: "#f0dcb0" },
  notable: { bg: "#eef4f8", fg: "#31708e", border: "#c7dbe6" },
  positive: { bg: "#e6f7f2", fg: "#0d9488", border: "#b6e4d7" },
};

export function OrgLearningReportPanel() {
  const [period, setPeriod] = useState<ReportPeriod>("quarter");
  const { data, isLoading, isError } = useOrgLearningReport(period);
  const r = data?.data;

  return (
    <Card className="border-[var(--cs-border,#e2e8ec)]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" style={{ color: "var(--cs-teal,#0d9488)" }} />
            Organisational Learning
          </CardTitle>
          <div className="flex gap-1">
            {(["month", "quarter"] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                style={period === p ? { backgroundColor: "var(--cs-teal,#0d9488)", color: "#fff" } : { backgroundColor: "var(--cs-surface-subtle,#f0faf7)", color: "var(--cs-text-muted,#6c7a83)" }}
              >
                {p === "month" ? "Month" : "Quarter"}
              </button>
            ))}
          </div>
        </div>
        <CardDescription>{r ? r.headline : "A leadership synthesis across the whole practice signal set."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted,#6c7a83)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Reading the period…
          </div>
        )}
        {isError && <p className="py-4 text-sm text-[var(--cs-text-muted,#6c7a83)]">Couldn&apos;t load the learning report right now.</p>}

        {r && r.sections.map((s) => (
          <div key={s.key}>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--cs-text-muted,#6c7a83)]">
              {s.label}
              {s.key === "improvement_evidence" && <TrendingUp className="h-3 w-3" style={{ color: "#0d9488" }} />}
            </p>
            {s.insufficientData && (
              <p className="rounded-md border border-dashed border-[var(--cs-border,#e2e8ec)] px-2.5 py-1.5 text-xs text-[var(--cs-text-muted,#6c7a83)]">Insufficient data this period.</p>
            )}
            {!s.insufficientData && s.themes.length === 0 && (
              <p className="px-1 text-xs text-[var(--cs-text-muted,#6c7a83)]">Nothing flagged this period.</p>
            )}
            <div className="space-y-1.5">
              {s.themes.map((t) => {
                const w = WEIGHT_STYLE[t.weight];
                return (
                  <div key={t.id} className="rounded-md border px-2.5 py-1.5" style={{ borderColor: w.border, backgroundColor: w.bg }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium" style={{ color: w.fg }}>{t.title}</p>
                      <span className="shrink-0 text-[11px] tabular-nums text-[var(--cs-text-muted,#6c7a83)]">{t.evidenceCount} record{t.evidenceCount === 1 ? "" : "s"}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-[var(--cs-text,#14202a)]">{t.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {r && <p className="pt-1 text-[11px] italic leading-relaxed text-[var(--cs-text-muted,#6c7a83)]">{r.disclaimer}</p>}
      </CardContent>
    </Card>
  );
}

export default OrgLearningReportPanel;
