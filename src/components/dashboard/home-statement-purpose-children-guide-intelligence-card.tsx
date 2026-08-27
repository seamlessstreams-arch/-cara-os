"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, BookMarked } from "lucide-react";
import { cn } from "@/lib/utils";
import { meets, formatRate } from "@/lib/metrics/rate";
import { useQuery } from "@tanstack/react-query";
import type { StatementPurposeRating, StatementPurposeChildrenGuideResult } from "@/lib/engines/home-statement-purpose-children-guide-intelligence-engine";

function useHomeStatementPurposeChildrenGuideIntelligence() {
  return useQuery({
    queryKey: ["home-statement-purpose-children-guide-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-statement-purpose-children-guide-intelligence");
      if (!res.ok) throw new Error("Failed to fetch statement of purpose children guide intelligence");
      return res.json() as Promise<{ data: StatementPurposeChildrenGuideResult }>;
    },
    refetchInterval: 60_000,
  });
}

const RATING_STYLES: Record<StatementPurposeRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  adequate: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "ADEQUATE" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]" };

export function HomeStatementPurposeChildrenGuideIntelligenceCard() {
  const { data, isLoading } = useHomeStatementPurposeChildrenGuideIntelligence();
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.statement_rating === "inadequate" && (d.statement_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      statement_rating: "insufficient_data",
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
  const ratingStyle = RATING_STYLES[d.statement_rating as StatementPurposeRating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.statement_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-purple-600 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-purple-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookMarked className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-purple-600")} />
            <span className="text-slate-900 font-bold">Statement of Purpose & Children&apos;s Guide</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>{ratingStyle.label}</span>
            {d.statement_rating !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.statement_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.statement_rating !== "insufficient_data" && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            <div className={cn("text-center rounded-lg p-1.5", meets(d.statement_currency_rate, 90) ? "bg-green-50" : meets(d.statement_currency_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.statement_currency_rate, 90) ? "text-[--cs-success]" : meets(d.statement_currency_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.statement_currency_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Currency</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.guide_accessibility_rate, 90) ? "bg-green-50" : meets(d.guide_accessibility_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.guide_accessibility_rate, 90) ? "text-[--cs-success]" : meets(d.guide_accessibility_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.guide_accessibility_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Access.</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.review_cycle_rate, 90) ? "bg-green-50" : meets(d.review_cycle_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.review_cycle_rate, 90) ? "text-[--cs-success]" : meets(d.review_cycle_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.review_cycle_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Reviews</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.young_person_involvement_rate, 90) ? "bg-green-50" : meets(d.young_person_involvement_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.young_person_involvement_rate, 90) ? "text-[--cs-success]" : meets(d.young_person_involvement_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.young_person_involvement_rate)}</p>
              <p className="text-[9px] text-muted-foreground">YP Involve.</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.ofsted_submission_rate, 90) ? "bg-green-50" : meets(d.ofsted_submission_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.ofsted_submission_rate, 90) ? "text-[--cs-success]" : meets(d.ofsted_submission_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.ofsted_submission_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Ofsted</p>
            </div>
            <div className={cn("text-center rounded-lg p-1.5", meets(d.stakeholder_awareness_rate, 90) ? "bg-green-50" : meets(d.stakeholder_awareness_rate, 70) ? "bg-amber-50" : "bg-red-50")}>
              <p className={cn("text-sm font-bold tabular-nums", meets(d.stakeholder_awareness_rate, 90) ? "text-[--cs-success]" : meets(d.stakeholder_awareness_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(d.stakeholder_awareness_rate)}</p>
              <p className="text-[9px] text-muted-foreground">Awareness</p>
            </div>
          </div>
        )}
        {d.strengths?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s: string, i: number) => (<div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">{s}</div>))}</div>)}
        {d.concerns?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c: string, i: number) => (<div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights?.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Statement of Purpose & Children&apos;s Guide Intelligence</p>{d.insights.slice(0, 3).map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
