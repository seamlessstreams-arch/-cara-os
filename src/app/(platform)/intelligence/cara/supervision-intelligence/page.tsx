"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle, AlertTriangle, Clock, Star, Eye } from "lucide-react";
import { useHomeSupervisionIntelligence } from "@/hooks/use-home-supervision-intelligence";
import type { SupervisionRating } from "@/lib/engines/home-supervision-intelligence-engine";

const RATING_META: Record<SupervisionRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

function RateBar({ label, value, warn = 90 }: { label: string; value: number; warn?: number }) {
  const pct = Math.round(value);
  const color = pct >= warn ? "bg-emerald-500" : pct >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span className={`font-medium ${pct < 60 ? "text-red-600" : "text-foreground"}`}>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SupervisionIntelligencePage() {
  const { data, isLoading, error } = useHomeSupervisionIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Supervision Intelligence" description="Analysing supervision data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Supervision Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load supervision intelligence data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.supervision_rating];
  const sup = d.supervision_profile;
  const obs = d.observation_profile;
  const apr = d.appraisal_profile;

  return (
    <PageShell
      title="Supervision Intelligence"
      description="Staff supervision completion, practice observations and annual appraisal compliance (CHR 2015 Reg 33; Staying Put; Social work supervision standards; SCCIF)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Users className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Supervision score: {d.supervision_score}/100 · {sup.total_supervisions_90d} supervisions (90d) · avg wellbeing {sup.avg_wellbeing_score.toFixed(1)}/10
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.supervision_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(sup.staff_without_supervision.length > 0 || apr.overdue_count > 0) && (
          <div className="flex flex-wrap gap-2">
            {sup.staff_without_supervision.length > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {sup.staff_without_supervision.length} staff member(s) with no supervision in 90 days
              </div>
            )}
            {apr.overdue_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                {apr.overdue_count} overdue annual appraisal(s) — book now
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Supervision */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Supervision (90d)
                </CardTitle>
                <Badge variant="outline" className="text-xs">{sup.total_supervisions_90d} sessions</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{sup.completed_count}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{sup.formal_count}</p>
                  <p className="text-xs text-muted-foreground">Formal</p>
                </div>
              </div>
              <RateBar label="Completion rate" value={sup.completion_rate} warn={90} />
              <RateBar label="Action completion" value={sup.action_completion_rate} />
              <RateBar label="Signed off" value={sup.signature_rate} warn={100} />
            </CardContent>
          </Card>

          {/* Observation */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  Practice Observations (90d)
                </CardTitle>
                <Badge variant="outline" className="text-xs">{obs.total_observations_90d} obs</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{obs.outstanding_count}</p>
                  <p className="text-xs text-muted-foreground">Outstanding</p>
                </div>
                <div className="rounded border bg-blue-50 p-2 text-center">
                  <p className="text-lg font-bold text-blue-700">{obs.meets_standard_count}</p>
                  <p className="text-xs text-muted-foreground">Meets standard</p>
                </div>
              </div>
              {obs.staff_not_observed.length > 0 && (
                <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  {obs.staff_not_observed.length} staff not yet observed
                </div>
              )}
              <RateBar label="Positive outcome rate" value={obs.positive_outcome_rate} />
              <RateBar label="Signed off" value={obs.sign_off_rate} warn={100} />
            </CardContent>
          </Card>

          {/* Appraisal */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Annual Appraisals
                </CardTitle>
                <Badge variant={apr.overdue_count > 0 ? "destructive" : "outline"} className="text-xs">
                  {apr.overdue_count} overdue
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{apr.completed_count}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className={`rounded border p-2 text-center ${apr.overdue_count > 0 ? "bg-amber-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${apr.overdue_count > 0 ? "text-amber-700" : "text-foreground"}`}>{apr.overdue_count}</p>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1.5 text-xs text-muted-foreground">
                <span>Avg competency score</span>
                <span className={`font-medium ${apr.avg_competency_score >= 7 ? "text-emerald-600" : apr.avg_competency_score >= 5 ? "text-amber-600" : "text-red-500"}`}>
                  {apr.avg_competency_score.toFixed(1)}/10
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {d.insights.length > 0 && (
          <div className="space-y-2">
            {d.insights.map((ins, i) => {
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
          CHR 2015 Reg 33 (staff supervision). Social Work England Standards of Proficiency. SCCIF — leadership and management standard. Ofsted: quality of supervision is a key judgement factor.
        </p>
      </div>
    </PageShell>
  );
}
