"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY TREND CARD
// Is the home's recording getting more child-conscious over time? Two 8-week
// trends from metadata-only analysis history: PACE relational stance + Writing-
// to-the-Child readability. Cara advises; managers decide. Reg 36 / SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Loader2, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePracticeTrends } from "@/hooks/use-practice-trends";
import type { TrendSeries, TrendDirection } from "@/lib/practice-history/types";

function DirIcon({ d }: { d: TrendDirection }) {
  if (d === "improving") return <TrendingUp className="h-4 w-4 text-green-600" />;
  if (d === "worsening") return <TrendingDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-[var(--cs-text-muted)]" />;
}

function barColor(score: number): string {
  if (score >= 75) return "var(--cs-success, #15803d)";
  if (score >= 55) return "var(--cs-teal, #0d9488)";
  if (score > 0) return "var(--cs-warning-text, #b45309)";
  return "var(--cs-border)";
}

function TrendBlock({ label, s }: { label: string; s: TrendSeries }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[var(--cs-navy)]">{label}</span>
        <span className="inline-flex items-center gap-1 text-xs text-[var(--cs-text-secondary)]">
          <DirIcon d={s.direction} />
          {s.recent4wAvg != null ? `${s.recent4wAvg}/100` : "—"}
        </span>
      </div>
      {/* 8 weekly bars, oldest → newest */}
      <div className="mt-1.5 flex items-end gap-1 h-12">
        {s.series.map((p, i) => (
          <div key={i} className="flex-1 rounded-sm" title={`${p.weeksAgo}w ago: ${p.avgScore ?? "—"} (${p.count})`}
            style={{ height: `${Math.max(6, (p.avgScore ?? 0) * 0.48)}px`, backgroundColor: barColor(p.avgScore ?? 0) }} />
        ))}
      </div>
      <p className="mt-1 text-[11px] text-[var(--cs-text-secondary)]">{s.headline}</p>
    </div>
  );
}

export function RecordingTrendCard() {
  const { data, isLoading } = usePracticeTrends();
  const t = data?.data;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-1.5"><LineChart className="h-4 w-4" /> Recording quality trend</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 py-6 text-sm text-[var(--cs-text-muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading trend…</div>
        )}
        {!isLoading && t && (
          <div className="space-y-4">
            <TrendBlock label="PACE relational stance" s={t.pace} />
            <TrendBlock label="Child-readable recording" s={t.writing} />
            <p className={cn("text-[11px]", "text-[var(--cs-text-gentle)]")}>
              Last {t.weeks} weeks · metadata only (no record content) · Cara advises, managers decide.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
