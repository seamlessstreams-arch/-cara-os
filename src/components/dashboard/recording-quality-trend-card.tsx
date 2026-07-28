"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RECORDING QUALITY TREND CARD
// Weekly trajectory of recording quality and the child's voice — is it improving?
// Powered by the Recording Quality Trend engine (Reg 13 — driving improvement).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, ChevronRight, Loader2, Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { RecordingQualityTrendResult } from "@/lib/recording-quality-trend/recording-quality-trend-engine";

interface RecordingQualityTrendResponse {
  data: RecordingQualityTrendResult;
}

function useRecordingQualityTrend() {
  return useQuery({
    queryKey: ["recording-quality-trend"],
    queryFn: () => api.get<RecordingQualityTrendResponse>("/recording-quality-trend"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

const TREND_META: Record<string, { icon: React.ReactNode; cls: string; label: string }> = {
  improving: { icon: <TrendingUp className="h-3.5 w-3.5" />, cls: "text-[--cs-success]", label: "improving" },
  declining: { icon: <TrendingDown className="h-3.5 w-3.5" />, cls: "text-[--cs-risk]", label: "declining" },
  stable: { icon: <Minus className="h-3.5 w-3.5" />, cls: "text-gray-500", label: "stable" },
  insufficient_data: { icon: <Minus className="h-3.5 w-3.5" />, cls: "text-gray-400", label: "—" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};
function barColor(v: number) { return v >= 85 ? "bg-green-400" : v >= 70 ? "bg-blue-400" : v >= 50 ? "bg-amber-400" : "bg-red-400"; }

export function RecordingQualityTrendCard() {
  const { data, isLoading } = useRecordingQualityTrend();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><LineChart className="h-4 w-4 text-brand" /> Recording Quality Trend</CardTitle>
        </CardHeader>
        <CardContent><div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" /></div></CardContent>
      </Card>
    );
  }

  const o = intel.overview;
  const series = intel.series ?? [];
  const insights = intel.insights ?? [];
  const overall = TREND_META[o.overall_trend] ?? TREND_META.stable;
  const voice = TREND_META[o.childvoice_trend] ?? TREND_META.stable;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><LineChart className="h-4 w-4 text-brand" /> Recording Quality Trend</CardTitle>
          <Link href="/recording-quality-trend" className="text-xs text-brand hover:underline flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Headline trends ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-2.5">
            <p className="text-[10px] text-muted-foreground">Overall quality</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold tabular-nums">{o.current_avg}</span>
              <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", overall.cls)}>{overall.icon}{overall.label}{o.overall_change !== 0 ? ` ${o.overall_change > 0 ? "+" : ""}${o.overall_change}` : ""}</span>
            </div>
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="text-[10px] text-muted-foreground">Child's voice</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-lg font-bold tabular-nums">{o.childvoice_current}</span>
              <span className={cn("flex items-center gap-0.5 text-[11px] font-medium", voice.cls)}>{voice.icon}{voice.label}{o.childvoice_change !== 0 ? ` ${o.childvoice_change > 0 ? "+" : ""}${o.childvoice_change}` : ""}</span>
            </div>
          </div>
        </div>

        {/* ── Weekly mini-chart (avg overall) ──────────────────────────── */}
        <div>
          <div className="flex items-end gap-1 h-16">
            {series.map((p, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end items-center" title={`${p.label}: ${p.count ? `${p.avg_overall}/100 (${p.count})` : "no records"}`}>
                <div className={cn("w-full rounded-t", p.count ? barColor(p.avg_overall) : "bg-gray-100")} style={{ height: `${p.count ? Math.max(6, p.avg_overall) : 4}%` }} />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-[var(--cs-text-gentle)] mt-1 text-center">avg quality / week · last {series.length} weeks</p>
        </div>

        {/* ── Cara insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Trend Intelligence</p>
            {insights.slice(0, 2).map((i, idx) => (
              <div key={idx} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[i.severity] ?? INSIGHT_STYLES.positive)}>{i.text}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
