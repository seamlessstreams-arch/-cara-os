"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, Scissors } from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeEthnicHairSkincareIntelligence } from "@/hooks/use-home-ethnic-hair-skincare-intelligence";
import type { EthnicHairSkincareRating } from "@/lib/engines/home-ethnic-hair-skincare-intelligence-engine";

const RATING_STYLES: Record<EthnicHairSkincareRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  adequate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ADEQUATE" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-red-200 bg-red-50 text-red-800", soon: "border-amber-200 bg-amber-50 text-amber-800", planned: "border-blue-200 bg-blue-50 text-blue-800" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-red-200 bg-red-50 text-red-800", warning: "border-amber-200 bg-amber-50 text-amber-800", positive: "border-green-200 bg-green-50 text-green-800" };

export function HomeEthnicHairSkincareIntelligenceCard() {
  const { data, isLoading } = useHomeEthnicHairSkincareIntelligence();
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  const d = data?.data ?? data;
  if (!d) return null;
  const ratingStyle = RATING_STYLES[d.haircare_rating as EthnicHairSkincareRating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.haircare_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-fuchsia-600 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-fuchsia-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scissors className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-fuchsia-600")} />
            <span className="text-slate-900 font-bold">Ethnic Hair & Skincare</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>{ratingStyle.label}</span>
            {d.haircare_rating !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.haircare_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.haircare_rating !== "insufficient_data" && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <div className={cn("text-center rounded-lg p-1.5", d.hair_care_rate >= 90 ? "bg-green-50" : d.hair_care_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.hair_care_rate >= 90 ? "text-green-600" : d.hair_care_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.hair_care_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Hair Care</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.skincare_routine_rate >= 90 ? "bg-green-50" : d.skincare_routine_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.skincare_routine_rate >= 90 ? "text-green-600" : d.skincare_routine_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.skincare_routine_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Skincare</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.product_availability_rate >= 90 ? "bg-green-50" : d.product_availability_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.product_availability_rate >= 90 ? "text-green-600" : d.product_availability_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.product_availability_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Products</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.specialist_access_rate >= 90 ? "bg-green-50" : d.specialist_access_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.specialist_access_rate >= 90 ? "text-green-600" : d.specialist_access_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.specialist_access_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Specialist</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.staff_training_rate >= 90 ? "bg-green-50" : d.staff_training_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.staff_training_rate >= 90 ? "text-green-600" : d.staff_training_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.staff_training_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Training</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", d.child_satisfaction_rate >= 90 ? "bg-green-50" : d.child_satisfaction_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", d.child_satisfaction_rate >= 90 ? "text-green-600" : d.child_satisfaction_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.child_satisfaction_rate}%</p>
              <p className="text-[9px] text-muted-foreground">Satisf.</p>
            </div>
          </div>
        )}
        {d.strengths?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s: string, i: number) => (<div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">{s}</div>))}</div>)}
        {d.concerns?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c: string, i: number) => (<div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec: any) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> ARIA Ethnic Hair & Skincare Intelligence</p>{d.insights.slice(0, 3).map((insight: any, i: number) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
