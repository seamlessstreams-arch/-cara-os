"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY SCORE CARD
// Scores the WRITING of the home's records across six Ofsted-relevant dimensions
// (completeness, clarity, professional language, factuality, child-centredness,
// risk relevance), with per-record suggestions. Powered by the Recording Quality
// Engine — Reg 36 (records) / Reg 13 / child-centred care.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PenLine, ChevronRight, Loader2, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecordingQuality } from "@/hooks/use-recording-quality";

const BAND_STYLES: Record<string, { bg: string; text: string }> = {
  strong: { bg: "bg-green-100", text: "text-green-700" },
  good: { bg: "bg-blue-100", text: "text-blue-700" },
  needs_improvement: { bg: "bg-amber-100", text: "text-amber-700" },
  poor: { bg: "bg-red-100", text: "text-red-700" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const DIM_LABELS: Record<string, string> = {
  completeness: "Completeness", clarity: "Clarity", professionalLanguage: "Professional",
  factuality: "Factual", childCentredness: "Child voice", riskRelevance: "Risk",
};
function barColor(v: number) { return v >= 85 ? "bg-green-400" : v >= 70 ? "bg-blue-400" : v >= 50 ? "bg-amber-400" : "bg-red-400"; }

export function RecordingQualityScoreCard() {
  const { data, isLoading } = useRecordingQuality();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><PenLine className="h-4 w-4 text-brand" /> Recording Quality</CardTitle>
        </CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const records = intel.records ?? [];
  const insights = intel.insights ?? [];
  const dims = Object.entries(o.dimension_averages ?? {}) as [string, number][];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><PenLine className="h-4 w-4 text-brand" /> Recording Quality</CardTitle>
          <Link href="/recording-quality" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.avg_overall >= 80 ? "bg-green-50" : o.avg_overall >= 65 ? "bg-blue-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.avg_overall >= 80 ? "text-green-600" : o.avg_overall >= 65 ? "text-blue-600" : "text-amber-600")}>{o.avg_overall}</p>
            <p className="text-[10px] text-muted-foreground">Avg /100</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.records_scored}</p>
            <p className="text-[10px] text-muted-foreground">Records</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.below_threshold > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.below_threshold > 0 ? "text-amber-600" : "text-green-600")}>{o.below_threshold}</p>
            <p className="text-[10px] text-muted-foreground">Below 70</p>
          </div>
        </div>

        {/* ── Dimension breakdown ──────────────────────────────────────── */}
        <div className="space-y-1">
          {dims.map(([dim, v]) => (
            <div key={dim} className="flex items-center gap-2 text-[11px]">
              <span className={cn("w-24 truncate", dim === o.weakest_dimension ? "font-semibold text-amber-700" : "text-[var(--cs-text-secondary)]")}>{DIM_LABELS[dim] ?? dim}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className={cn("h-full rounded-full", barColor(v))} style={{ width: `${v}%` }} /></div>
              <span className="w-6 text-right tabular-nums text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>

        {/* ── Weakest records ──────────────────────────────────────────── */}
        {records.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Needs attention</p>
            {records.slice(0, 3).map((r) => {
              const band = BAND_STYLES[r.band] ?? BAND_STYLES.needs_improvement;
              return (
                <div key={r.id} className="rounded-lg border p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[var(--cs-text-secondary)]">{r.type.replace(/_/g, " ")}{r.child_name ? ` · ${r.child_name}` : ""}</span>
                    <Badge className={cn("text-[9px] shrink-0", band.bg, band.text)}>{r.overall}</Badge>
                  </div>
                  {r.score.ariaSuggestions[0] && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">→ {r.score.ariaSuggestions[0]}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> ARIA Recording Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
