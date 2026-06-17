"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeHazardNearMissReportingIntelligence } from "@/hooks/use-home-hazard-near-miss-reporting-intelligence";
import type { HazardNearMissResult, HazardNearMissRating } from "@/lib/engines/home-hazard-near-miss-reporting-intelligence-engine";

const RATING_META: Record<HazardNearMissRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function HazardNearMissReportingIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeHazardNearMissReportingIntelligence();
  const d = (raw as { data?: HazardNearMissResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Hazard & Near Miss Reporting" description="Analysing hazard and near miss reporting data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Hazard & Near Miss Reporting" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load hazard and near miss reporting data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.hazard_rating];

  return (
    <PageShell
      title="Hazard & Near Miss Reporting"
      description="Hazard identification, near miss tracking, corrective actions, safety walks, incident learning and staff engagement — building a proactive safety culture that addresses risk before harm occurs (CHR 2015 Reg 25; HSE guidance; SCCIF — Leadership and management)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <ShieldAlert className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hazard score: {d.hazard_score}/100 · {d.total_hazard_reports} hazard reports · {d.total_near_misses} near misses · corrective actions {Math.round(d.corrective_action_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.hazard_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.corrective_action_rate < 80 || d.hazard_reporting_rate < 70 || d.staff_engagement_rate < 70) && (
          <div className="flex flex-col gap-2">
            {d.corrective_action_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Corrective action rate {Math.round(d.corrective_action_rate)}% — identified hazards must be actioned; unactioned reports signal a culture where reporting has no consequence
              </div>
            )}
            {d.hazard_reporting_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Hazard reporting rate {Math.round(d.hazard_reporting_rate)}% — low reporting rates indicate under-reporting or a barrier to safety reporting culture
              </div>
            )}
            {d.staff_engagement_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Staff engagement rate {Math.round(d.staff_engagement_rate)}% — safety is a whole-team responsibility; low engagement leaves blind spots
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Hazard reports", value: d.total_hazard_reports, color: "text-blue-600" },
            { label: "Near misses", value: d.total_near_misses, color: d.total_near_misses === 0 ? "text-amber-600" : "" },
            { label: "Corrective actions", value: d.total_corrective_actions, color: "" },
            { label: "Safety walks", value: d.total_safety_walks, color: d.total_safety_walks === 0 ? "text-red-600" : "" },
            { label: "Incident learnings", value: d.total_incident_learnings, color: "" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              Safety Culture Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Hazard reporting rate" value={d.hazard_reporting_rate} warn={80} />
            <RateBar label="Near miss tracking rate" value={d.near_miss_tracking_rate} warn={80} />
            <RateBar label="Corrective action rate" value={d.corrective_action_rate} warn={90} />
            <RateBar label="Safety walk rate" value={d.safety_walk_rate} warn={75} />
            <RateBar label="Incident learning rate" value={d.incident_learning_rate} warn={75} />
            <RateBar label="Staff engagement rate" value={d.staff_engagement_rate} warn={80} />
          </CardContent>
        </Card>

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
                  rec.urgency === "soon"      ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">{rec.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{rec.recommendation}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{rec.urgency}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Regulation 25 (Premises — must be safe). HSE Management of Health and Safety at Work Regulations 1999 (risk assessment duty). SCCIF — Leadership and management. A home that reports no hazards or near misses is not a safe home — it is a home where staff do not feel safe reporting. Genuine safety culture is measured by the quality of response to reports, not by the absence of them. Every near miss that goes unrecorded is a future incident waiting to happen.
        </p>
      </div>
    </PageShell>
  );
}
