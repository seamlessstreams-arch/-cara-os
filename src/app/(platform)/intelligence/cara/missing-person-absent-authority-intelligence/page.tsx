"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeMissingPersonAbsentAuthorityIntelligence } from "@/hooks/use-home-missing-person-absent-authority-intelligence";
import type {
  MissingPersonRating,
  MissingPersonResult,
} from "@/lib/engines/home-missing-person-absent-authority-intelligence-engine";

const RATING_META: Record<MissingPersonRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function MissingPersonAbsentAuthorityIntelligencePage() {
  const { data, isLoading, error } = useHomeMissingPersonAbsentAuthorityIntelligence();
  const d = data?.data as MissingPersonResult | undefined;

  if (isLoading) {
    return (
      <PageShell title="Missing Person & Absent Without Authority" description="Analysing missing person and absent authority data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Missing Person & Absent Without Authority" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load missing person and absent authority data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.missing_rating];

  return (
    <PageShell
      title="Missing Person & Absent Without Authority"
      description="Protocol adherence, return interview compliance, exploitation screening, police liaison and pattern analysis (CHR 2015 Reg 40; NCA Missing Persons guidance; Working Together 2023; contextual safeguarding)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <MapPin className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Missing person score: {d.missing_score}/100 · {d.total_episodes} total episodes · return interview {Math.round(d.return_interview_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.missing_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {d.total_episodes > 0 && d.protocol_adherence_rate < 100 && (
          <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
            Protocol not fully adhered to across all {d.total_episodes} episode(s) — review outstanding actions
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Protocol compliance */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Protocol Compliance
                </CardTitle>
                <Badge variant="outline" className="text-xs">{d.total_episodes} episodes</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateBar label="Protocol adherence" value={d.protocol_adherence_rate} warn={100} />
              <RateBar label="Return interview completed" value={d.return_interview_rate} warn={100} />
              <RateBar label="Notification timeliness" value={d.notification_timeliness_rate} warn={100} />
              <RateBar label="Police liaison" value={d.police_liaison_rate} warn={100} />
              <div className="flex items-center justify-between pt-1.5 text-xs text-muted-foreground border-t">
                <span>Return interview quality (avg)</span>
                <span className={`font-medium ${d.return_interview_quality_avg >= 7 ? "text-emerald-600" : d.return_interview_quality_avg >= 5 ? "text-amber-600" : "text-red-500"}`}>
                  {d.return_interview_quality_avg.toFixed(1)}/10
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Safeguarding analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Safeguarding Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateBar label="Exploitation screening rate" value={d.exploitation_screening_rate} warn={100} />
              <RateBar label="Risk assessment timeliness" value={d.risk_assessment_timeliness_rate} warn={100} />
              <RateBar label="Risk update on return" value={d.risk_update_rate} warn={100} />
              <RateBar label="Pattern analysis completed" value={d.pattern_analysis_rate} warn={80} />
              <RateBar label="Prevention actions taken" value={d.prevention_rate} warn={70} />
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
          CHR 2015 Reg 40 — notifiable events (missing persons). NCA Missing Persons guidance. Working Together 2023 — contextual safeguarding and exploitation risk. Return interviews are mandatory under statutory guidance.
        </p>
      </div>
    </PageShell>
  );
}
