"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useHomeOfstedReadinessComposite } from "@/hooks/use-home-ofsted-readiness-composite";
import type { HomeOfstedReadinessResult, OfstedGrade } from "@/lib/engines/home-ofsted-readiness-composite-engine";

const GRADE_META: Record<OfstedGrade, { label: string; color: string; bg: string; border: string }> = {
  outstanding:          { label: "Outstanding",           color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:                 { label: "Good",                  color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  requires_improvement: { label: "Requires Improvement",  color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:           { label: "Inadequate",            color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data:    { label: "Insufficient Data",     color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function GradePill({ grade }: { grade: OfstedGrade }) {
  const m = GRADE_META[grade];
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${m.color} ${m.bg} ${m.border}`}>
      {m.label}
    </span>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 65 ? "bg-blue-400" : score >= 45 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="font-medium">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

export default function OfstedReadinessIntelligencePage() {
  const { data, isLoading, error } = useHomeOfstedReadinessComposite();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Ofsted Readiness Intelligence" description="Aggregating all intelligence engines into readiness composite…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Ofsted Readiness Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load Ofsted readiness composite data.</div>
      </PageShell>
    );
  }

  const overall = GRADE_META[d.overall_grade];

  return (
    <PageShell
      title="Ofsted Readiness Intelligence"
      description="Composite view across all intelligence engines, mapped to the four Ofsted ILACS judgement areas — overall experiences and progress, how well children are helped and protected, leadership and management effectiveness, and workforce impact — giving a single readiness score and grade for each area (CHR 2015 Schedule 7; Regs 44–46; ILACS framework)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${overall.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${overall.bg} ${overall.border} border`}>
                <Star className={`h-5 w-5 ${overall.color}`} />
                <span className={`text-sm font-semibold ${overall.color}`}>{overall.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Overall score: {d.overall_score}/100 · {d.total_engines} engines · {d.engines_outstanding} outstanding · {d.engines_inadequate} inadequate · {d.engines_no_data} no data
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.overall_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.engines_inadequate > 0 || d.engines_no_data >= 10) && (
          <div className="flex flex-col gap-2">
            {d.engines_inadequate > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {d.engines_inadequate} engine{d.engines_inadequate > 1 ? "s" : ""} rated inadequate — any inadequate area is a serious inspection risk; Ofsted's overall effectiveness judgement is bounded by the weakest judgement area
              </div>
            )}
            {d.engines_no_data >= 10 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {d.engines_no_data} engines have insufficient data — evidence gaps undermine inspection readiness; Ofsted will look for evidence across all areas, not just the ones with records
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Outstanding",     value: d.engines_outstanding, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
            { label: "Good",            value: d.engines_good, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
            { label: "Adequate",        value: d.engines_adequate, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
            { label: "Inadequate",      value: d.engines_inadequate, color: "text-red-600", bg: "bg-red-50 border-red-200" },
            { label: "No data",         value: d.engines_no_data, color: "text-slate-500", bg: "bg-muted/30" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-lg border p-3 text-center ${bg}`}>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold">Judgement Area Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {d.judgement_areas.map((area) => {
              const areaMeta = GRADE_META[area.grade];
              return (
                <Card key={area.name} className={`border ${areaMeta.border}`}>
                  <CardHeader className="pb-1 pt-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xs font-semibold leading-snug">{area.name}</CardTitle>
                      <GradePill grade={area.grade} />
                    </div>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    <ScoreBar score={area.average_score} label={`${area.engine_count} engine${area.engine_count !== 1 ? "s" : ""}`} />
                    {area.weakest_engine && (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className={`rounded border p-1.5 ${area.weakest_score < 45 ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
                          <p className="text-muted-foreground">Weakest</p>
                          <p className="font-medium truncate">{area.weakest_engine}</p>
                          <p className={`font-bold ${area.weakest_score < 45 ? "text-red-600" : "text-amber-600"}`}>{area.weakest_score}%</p>
                        </div>
                        {area.strongest_engine && (
                          <div className="rounded border border-emerald-200 bg-emerald-50 p-1.5">
                            <p className="text-muted-foreground">Strongest</p>
                            <p className="font-medium truncate">{area.strongest_engine}</p>
                            <p className="font-bold text-emerald-600">{area.strongest_score}%</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {d.insights.length > 0 && (
          <div className="space-y-2">
            {d.insights.map((ins, i) => {
              const sev = ins.severity as string;
              const cls =
                sev === "critical" ? "bg-red-50 border-red-200 text-red-800" :
                sev === "warning"  ? "bg-amber-50 border-amber-200 text-amber-800" :
                "bg-emerald-50 border-emerald-200 text-emerald-800";
              return (
                <div key={i} className={`flex items-start gap-2 rounded border px-3 py-2 text-xs ${cls}`}>
                  {sev === "critical" ? <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   sev === "positive"  ? <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" /> :
                   <Clock className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />}
                  {ins.text}
                </div>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.strengths.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.strengths.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2"><Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {d.concerns.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.concerns.map((c, i) => (
                    <li key={i} className="text-xs flex gap-2"><AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />{c}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {d.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Recommendations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {d.recommendations.map((rec) => {
                const urg = rec.urgency as string;
                const urgencyColor =
                  urg === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  urg === "soon"      ? "bg-amber-100 text-amber-700 border-amber-200" :
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
          ILACS (Inspection of Local Authority Children's Services) framework — the four judgement areas for children's homes registered under CHR 2015: (1) the overall experiences and progress of children; (2) how well children are helped and protected; (3) the effectiveness of leaders and managers; (4) the impact of leaders on staff practice. Ofsted's overall effectiveness judgement is determined by the lowest individual judgement area — a home cannot be judged good overall if any judgement area is inadequate or requires improvement. CHR 2015 Schedule 7 (matters to be considered in inspection); Reg 44 (monthly visits by nominated individual); Reg 45 (annual review of quality of care); Reg 46 (actions required by Ofsted). This composite score is indicative only — it is based on recorded practice data and cannot replicate the full range of evidence Ofsted would gather during an inspection, including direct observation, conversations with children, and staff interviews.
        </p>
      </div>
    </PageShell>
  );
}
