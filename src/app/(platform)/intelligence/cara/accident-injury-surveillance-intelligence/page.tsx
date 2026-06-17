"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeAccidentInjurySurveillanceIntelligence } from "@/hooks/use-home-accident-injury-surveillance-intelligence";
import type { AccidentInjuryRating } from "@/lib/engines/home-accident-injury-surveillance-intelligence-engine";

const RATING_META: Record<AccidentInjuryRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function AccidentInjurySurveillanceIntelligencePage() {
  const { data, isLoading, error } = useHomeAccidentInjurySurveillanceIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Accident & Injury Surveillance" description="Analysing accident and injury data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Accident & Injury Surveillance" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load accident and injury surveillance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.surveillance_rating];

  return (
    <PageShell
      title="Accident & Injury Surveillance"
      description="Accident and injury recording, unexplained injury tracking, RIDDOR obligations, debrief completion and safety check compliance (RIDDOR 2013; CHR 2015 Reg 40; HSE guidance; Ofsted ILACS)."
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
                  Surveillance score: {d.surveillance_score}/100 · {d.accidents_total} accidents · {d.injuries_total} injuries · debrief {Math.round(d.debrief_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.surveillance_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.riddor_count > 0 || d.injuries_unexplained > 0 || d.children_with_repeat_injuries > 0) && (
          <div className="flex flex-col gap-2">
            {d.riddor_count > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {d.riddor_count} RIDDOR reportable event(s) — confirm HSE notification has been submitted
              </div>
            )}
            {d.injuries_unexplained > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {d.injuries_unexplained} unexplained injury(ies) recorded — safeguarding review required
              </div>
            )}
            {d.children_with_repeat_injuries > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {d.children_with_repeat_injuries} child(ren) with repeat injuries — consider pattern review
              </div>
            )}
          </div>
        )}

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className={`text-2xl font-bold ${d.accidents_total > 0 ? "text-amber-600" : "text-emerald-600"}`}>{d.accidents_total}</p>
            <p className="text-xs text-muted-foreground mt-1">Total accidents</p>
          </div>
          <div className={`rounded-lg border p-3 text-center ${d.accidents_serious > 0 ? "bg-red-50" : "bg-muted/30"}`}>
            <p className={`text-2xl font-bold ${d.accidents_serious > 0 ? "text-red-600" : "text-foreground"}`}>{d.accidents_serious}</p>
            <p className="text-xs text-muted-foreground mt-1">Serious accidents</p>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3 text-center">
            <p className={`text-2xl font-bold ${d.hospital_visits > 0 ? "text-amber-600" : "text-foreground"}`}>{d.hospital_visits}</p>
            <p className="text-xs text-muted-foreground mt-1">Hospital visits</p>
          </div>
          <div className={`rounded-lg border p-3 text-center ${d.riddor_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
            <p className={`text-2xl font-bold ${d.riddor_count > 0 ? "text-red-600" : "text-foreground"}`}>{d.riddor_count}</p>
            <p className="text-xs text-muted-foreground mt-1">RIDDOR events</p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              Response & Safety Compliance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Post-incident debrief completion" value={d.debrief_rate} warn={100} />
            <RateBar label="Safety check pass rate" value={d.safety_check_pass_rate} warn={95} />
          </CardContent>
        </Card>

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
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>{urg}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          RIDDOR 2013 (Reporting of Injuries, Diseases and Dangerous Occurrences Regulations). CHR 2015 Reg 40 — notifiable events. HSE accident reporting guidance. Unexplained injuries trigger safeguarding review under Working Together 2023.
        </p>
      </div>
    </PageShell>
  );
}
