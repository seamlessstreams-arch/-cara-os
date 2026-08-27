"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkforceResilienceRating, WorkforceResilienceResult } from "@/lib/engines/home-workforce-resilience-composite-engine";

const RATING_STYLES: Record<WorkforceResilienceRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  adequate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ADEQUATE" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]" };

export function HomeWorkforceResilienceCompositeCard() {
  const { data, isLoading } = useQuery<{ data: WorkforceResilienceResult }>({
    queryKey: ["home-workforce-resilience-composite"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-workforce-resilience-composite");
      if (!res.ok) throw new Error("Failed to fetch workforce resilience composite");
      return res.json() as Promise<{ data: WorkforceResilienceResult }>;
    },
    refetchInterval: 120_000,
  });
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  const d = data?.data;
  if (!d) return null;
  const ratingStyle = RATING_STYLES[d.resilience_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.resilience_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-emerald-200 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-emerald-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-emerald-600")} />
            <span className="text-slate-900 font-bold">Workforce Resilience</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>{ratingStyle.label}</span>
            {d.resilience_rating !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.resilience_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.resilience_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-green-50 p-2">
              <p className="text-lg font-bold tabular-nums text-green-600">{d.staff_flourishing}</p>
              <p className="text-[10px] text-muted-foreground">Flourishing</p>
            </div>
            <div className="text-center rounded-lg bg-blue-50 p-2">
              <p className="text-lg font-bold tabular-nums text-blue-600">{d.staff_stable}</p>
              <p className="text-[10px] text-muted-foreground">Stable</p>
            </div>
            <div className="text-center rounded-lg bg-amber-50 p-2">
              <p className="text-lg font-bold tabular-nums text-amber-600">{d.staff_struggling}</p>
              <p className="text-[10px] text-muted-foreground">Struggling</p>
            </div>
            <div className="text-center rounded-lg bg-red-50 p-2">
              <p className="text-lg font-bold tabular-nums text-red-600">{d.staff_at_risk}</p>
              <p className="text-[10px] text-muted-foreground">At Risk</p>
            </div>
          </div>
        )}
        {d.strengths.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s, i) => (<div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">{s}</div>))}</div>)}
        {d.concerns.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c, i) => (<div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Workforce Intelligence</p>{d.insights.slice(0, 3).map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
