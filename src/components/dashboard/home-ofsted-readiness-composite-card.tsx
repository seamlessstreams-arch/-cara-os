"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, AlertTriangle, Sparkles, Brain, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { HomeOfstedReadinessResult, OfstedGrade } from "@/lib/engines/home-ofsted-readiness-composite-engine";

interface HomeOfstedReadinessResponse { data: HomeOfstedReadinessResult; }

function useHomeOfstedReadinessComposite() {
  return useQuery<HomeOfstedReadinessResponse>({
    queryKey: ["home-ofsted-readiness-composite"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-ofsted-readiness-composite");
      if (!res.ok) throw new Error("Failed to fetch Ofsted readiness composite");
      return res.json();
    },
    refetchInterval: 120_000, // 2 minutes — composite is heavier
  });
}

const GRADE_STYLES: Record<OfstedGrade, { bg: string; text: string; border: string; label: string }> = {
  outstanding: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300", label: "OUTSTANDING" },
  good: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300", label: "GOOD" },
  requires_improvement: { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-300", label: "REQ IMPROVEMENT" },
  inadequate: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300", label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", label: "NO DATA" },
};
const REC_STYLES: Record<string, string> = { immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]" };
const INSIGHT_STYLES: Record<string, string> = { critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]", warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]", positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]" };

export function HomeOfstedReadinessCompositeCard() {
  const { data, isLoading } = useHomeOfstedReadinessComposite();
  if (isLoading) return <Card className="overflow-hidden border-slate-200"><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></CardContent></Card>;
  const d = data?.data;
  if (!d) return null;
  const gradeStyle = GRADE_STYLES[d.overall_grade] ?? GRADE_STYLES.insufficient_data;
  const isAlert = d.overall_grade === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-indigo-200 border-2")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-indigo-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-indigo-600")} />
            <span className="text-slate-900 font-bold">Ofsted Readiness</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", gradeStyle.bg, gradeStyle.text, gradeStyle.border)}>{gradeStyle.label}</span>
            {d.overall_grade !== "insufficient_data" && <span className="text-xs font-bold tabular-nums text-slate-600">{d.overall_score}%</span>}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.overall_grade !== "insufficient_data" && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {d.judgement_areas.map((area, i) => {
                const shortName = area.name.includes("experiences") ? "Experiences" : area.name.includes("protected") ? "Protection" : area.name.includes("leaders") ? "Leadership" : "Workforce";
                return (
                  <div key={i} className="text-center rounded-lg bg-slate-50 p-2">
                    <p className={cn("text-lg font-bold tabular-nums", area.grade === "outstanding" ? "text-[--cs-success]" : area.grade === "good" ? "text-blue-600" : area.grade === "requires_improvement" ? "text-[--cs-warning]" : area.grade === "inadequate" ? "text-[--cs-risk]" : "text-slate-400")}>{area.grade !== "insufficient_data" ? `${area.average_score}%` : "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{shortName}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-1.5 text-[10px] font-mono">
              <span className="px-1.5 py-0.5 rounded bg-[--cs-success-bg] text-[--cs-success]">{d.engines_outstanding} O</span>
              <span className="px-1.5 py-0.5 rounded bg-[--cs-info-bg] text-[--cs-info]">{d.engines_good} G</span>
              <span className="px-1.5 py-0.5 rounded bg-[--cs-warning-bg] text-[--cs-warning]">{d.engines_adequate} A</span>
              <span className="px-1.5 py-0.5 rounded bg-[--cs-risk-bg] text-[--cs-risk]">{d.engines_inadequate} I</span>
              {d.engines_no_data > 0 && <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{d.engines_no_data} —</span>}
              <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 ml-auto">{d.total_engines} engines</span>
            </div>
          </>
        )}
        {d.strengths.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-green-700 flex items-center gap-1"><Sparkles className="h-3 w-3" /> Strengths ({d.strengths.length})</p>{d.strengths.slice(0, 3).map((s, i) => (<div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">{s}</div>))}</div>)}
        {d.concerns.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-red-700 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Concerns ({d.concerns.length})</p>{d.concerns.slice(0, 3).map((c, i) => (<div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">{c}</div>))}</div>)}
        {d.recommendations.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-amber-600" /> Recommendations ({d.recommendations.length})</p>{d.recommendations.slice(0, 3).map((rec) => (<div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}><div className="flex items-start justify-between gap-2"><span>{rec.recommendation}</span>{rec.regulatory_ref && <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>}</div></div>))}</div>)}
        {d.insights.length > 0 && (<div className="space-y-1.5"><p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" /> Cara Ofsted Intelligence</p>{d.insights.slice(0, 3).map((insight, i) => (<div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>{insight.text}</div>))}</div>)}
      </CardContent>
    </Card>
  );
}
