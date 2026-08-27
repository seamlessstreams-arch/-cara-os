"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { meets, formatRate } from "@/lib/metrics/rate";
import { useQuery } from "@tanstack/react-query";
import type { ClothingLabellingRating, ClothingLabellingStorageResult } from "@/lib/engines/home-clothing-labelling-storage-intelligence-engine";

function useHomeClothingLabellingStorageIntelligence() {
  return useQuery({
    queryKey: ["home-clothing-labelling-storage-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-clothing-labelling-storage-intelligence");
      if (!res.ok) throw new Error("Failed to fetch clothing labelling storage intelligence");
      return res.json() as Promise<{ data: ClothingLabellingStorageResult }>;
    },
    refetchInterval: 60_000,
  });
}

const RATING_STYLES: Record<ClothingLabellingRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  adequate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ADEQUATE" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]" };

export function HomeClothingLabellingStorageIntelligenceCard() {
  const { data, isLoading } = useHomeClothingLabellingStorageIntelligence();
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.labelling_rating === "inadequate" && (d.labelling_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      labelling_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }
  const ratingStyle = RATING_STYLES[d.labelling_rating as ClothingLabellingRating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.labelling_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-pink-600 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-pink-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-pink-600")} />
            <span className="text-slate-900 font-bold">Clothing Labelling & Storage</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>{ratingStyle.label}</span>
            {d.labelling_rating !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.labelling_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.labelling_rating !== "insufficient_data" && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <div className={cn("text-center rounded-lg p-1.5", meets(d.labelling_compliance_rate, 90) ? "bg-green-50" : meets(d.labelling_compliance_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.labelling_compliance_rate, 90) ? "text-[--cs-success]" : meets(d.labelling_compliance_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.labelling_compliance_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Labelling</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.storage_adequacy_rate, 90) ? "bg-green-50" : meets(d.storage_adequacy_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.storage_adequacy_rate, 90) ? "text-[--cs-success]" : meets(d.storage_adequacy_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.storage_adequacy_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Storage</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.seasonal_rotation_rate, 90) ? "bg-green-50" : meets(d.seasonal_rotation_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.seasonal_rotation_rate, 90) ? "text-[--cs-success]" : meets(d.seasonal_rotation_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.seasonal_rotation_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Rotation</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.ownership_respect_rate, 90) ? "bg-green-50" : meets(d.ownership_respect_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.ownership_respect_rate, 90) ? "text-[--cs-success]" : meets(d.ownership_respect_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.ownership_respect_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Ownership</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.condition_monitoring_rate, 90) ? "bg-green-50" : meets(d.condition_monitoring_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.condition_monitoring_rate, 90) ? "text-[--cs-success]" : meets(d.condition_monitoring_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.condition_monitoring_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Condition</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.child_satisfaction_rate, 90) ? "bg-green-50" : meets(d.child_satisfaction_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.child_satisfaction_rate, 90) ? "text-[--cs-success]" : meets(d.child_satisfaction_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.child_satisfaction_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Satisf.</p>
            </div>
          </div>
        )}
        {d.strengths?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s: string, i: number) => (<div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">{s}</div>))}</div>)}
        {d.concerns?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c: string, i: number) => (<div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Clothing Labelling & Storage Intelligence</p>{d.insights.slice(0, 3).map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
