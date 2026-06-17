"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, AlertTriangle, Clock, Star, ShieldAlert } from "lucide-react";
import { useHomeBehaviourSupportPlanIntelligence } from "@/hooks/use-home-behaviour-support-plan-intelligence";
import type { BehaviourSupportPlanRating } from "@/lib/engines/home-behaviour-support-plan-intelligence-engine";

const RATING_META: Record<BehaviourSupportPlanRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 80 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 50 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function BehaviourSupportPlanIntelligencePage() {
  const { data, isLoading, error } = useHomeBehaviourSupportPlanIntelligence();

  if (isLoading) {
    return (
      <PageShell title="Behaviour Support Plan Intelligence" description="Analysing behaviour support plan data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !data) {
    return (
      <PageShell title="Behaviour Support Plan Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load behaviour support plan intelligence data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[data.bsp_rating];

  return (
    <PageShell
      title="Behaviour Support Plan Intelligence"
      description="BSP coverage, trigger analysis, de-escalation pathways, positive strategies, child voice and review currency (CHR 2015 Reg 13; SCCIF Helped & Protected; Experiences & Progress)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <FileText className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{data.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Score: {data.bsp_score}/100 · {data.total_plans} plan{data.total_plans !== 1 ? "s" : ""} · {data.children_with_plan_rate}% children covered · {data.active_plan_rate}% active
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{data.bsp_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.total_plans === 0 && (
          <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
            No behaviour support plans — the home cannot demonstrate structured therapeutic responses. Ofsted expects plans for all children with identified needs.
          </div>
        )}

        {data.total_plans > 0 && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-2xl font-bold">{data.total_plans}</p>
                <p className="text-xs text-muted-foreground mt-1">Total plans</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className={`text-2xl font-bold ${data.children_with_plan_rate >= 80 ? "text-emerald-600" : data.children_with_plan_rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {data.children_with_plan_rate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Children covered</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className={`text-2xl font-bold ${data.active_plan_rate >= 80 ? "text-emerald-600" : data.active_plan_rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {data.active_plan_rate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Active plans</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className={`text-2xl font-bold ${data.child_voice_rate >= 80 ? "text-emerald-600" : data.child_voice_rate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {data.child_voice_rate}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">Child voice</p>
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  BSP Quality Indicators
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <RateBar label="Children with active BSP" value={data.active_plan_rate} />
                <RateBar label="Trigger & early warning analysis" value={data.trigger_analysis_rate} />
                <RateBar label="Full de-escalation pathway (green/amber/red)" value={data.de_escalation_rate} warn={75} />
                <RateBar label="Positive strategies documented" value={data.positive_strategy_rate} />
                <RateBar label="Child voice in BSP" value={data.child_voice_rate} />
              </CardContent>
            </Card>
          </>
        )}

        {data.insights.length > 0 && (
          <div className="space-y-2">
            {data.insights.map((ins, i) => {
              const cls =
                ins.severity === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                ins.severity === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800";
              return (
                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                  {ins.severity === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   ins.severity === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
                  {ins.text}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.strengths.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2"><Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {data.concerns.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.concerns.map((c, i) => (
                    <li key={i} className="text-xs flex gap-2"><AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {data.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.recommendations.map((rec) => {
                const urgencyColor =
                  rec.urgency === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  rec.urgency === "soon"       ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      {rec.regulatory_ref && <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Reg 13 (behaviour management), Reg 35 (staff training). SCCIF: Helped and protected; Experiences and progress. Positive Behaviour Support (PBS) framework.
        </p>
      </div>
    </PageShell>
  );
}
