"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, Anchor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomePlacementDisruptionPreventionIntelligence } from "@/hooks/use-home-placement-disruption-prevention-intelligence";
import type { DisruptionPreventionRating } from "@/lib/engines/home-placement-disruption-prevention-intelligence-engine";

const RATING_STYLES: Record<DisruptionPreventionRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  adequate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ADEQUATE" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-red-200 bg-red-50 text-red-800", soon: "border-amber-200 bg-amber-50 text-amber-800", planned: "border-blue-200 bg-blue-50 text-blue-800" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800" };

export function HomePlacementDisruptionPreventionIntelligenceCard() {
  const { data, isLoading } = useHomePlacementDisruptionPreventionIntelligence();
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.disruption_rating === "inadequate" && (d.disruption_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      disruption_rating: "insufficient_data",
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
  const ratingStyle = RATING_STYLES[d.disruption_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.disruption_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-pink-200 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-pink-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Anchor className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-pink-600")} />
            <span className="text-slate-900 font-bold">Disruption Prevention</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>{ratingStyle.label}</span>
            {d.disruption_rating !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.disruption_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.disruption_rating === "insufficient_data" && <IntelligenceCardEmpty />}
        {d.disruption_rating !== "insufficient_data" && (
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            <div className={cn("text-center rounded-lg p-1.5", d.children_with_plans > 0 ? "bg-green-50" : "bg-amber-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.children_with_plans > 0 ? "text-green-600" : "text-amber-600")}>{d.children_with_plans}</p>
              <p className="text-[9px] text-muted-foreground">Plans</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.planned_ending_rate >= 90 ? "bg-green-50" : d.planned_ending_rate >= 60 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.planned_ending_rate >= 90 ? "text-green-600" : d.planned_ending_rate >= 60 ? "text-amber-600" : "text-red-600")}>{d.planned_ending_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Planned</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.disruption_rate === 0 ? "bg-green-50" : d.disruption_rate <= 10 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.disruption_rate === 0 ? "text-green-600" : d.disruption_rate <= 10 ? "text-amber-600" : "text-red-600")}>{d.disruption_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Disrupted</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.average_placement_months >= 12 ? "bg-green-50" : d.average_placement_months >= 6 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.average_placement_months >= 12 ? "text-green-600" : d.average_placement_months >= 6 ? "text-amber-600" : "text-red-600")}>{d.average_placement_months}m</p>
              <p className="text-[9px] text-muted-foreground">Avg Stay</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.high_risk_children === 0 ? "bg-green-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.high_risk_children === 0 ? "text-green-600" : "text-red-600")}>{d.high_risk_children}</p>
              <p className="text-[9px] text-muted-foreground">High Risk</p>
            </div>
          </div>
        )}
        {d.strengths.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s, i) => (<div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">{s}</div>))}</div>)}
        {d.concerns.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c, i) => (<div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Stability Intelligence</p>{d.insights.slice(0, 3).map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
