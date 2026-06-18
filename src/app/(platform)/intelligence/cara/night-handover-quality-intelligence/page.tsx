"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Moon, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeNightHandoverQualityIntelligence } from "@/hooks/use-home-night-handover-quality-intelligence";
import type { NightHandoverQualityResult, NightHandoverRating } from "@/lib/engines/home-night-handover-quality-intelligence-engine";

const RATING_META: Record<NightHandoverRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function NightHandoverQualityIntelligencePage() {
  const { data, isLoading, error } = useHomeNightHandoverQualityIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Night Handover Quality" description="Analysing night handover quality data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Night Handover Quality" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load night handover quality data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.handover_rating];

  return (
    <PageShell
      title="Night Handover Quality"
      description="Risk briefing rate, medication compliance, morning handover completion, night events documentation and per-child notes — evidencing that overnight information is consistently and accurately transferred between teams so that no safety-critical detail is lost across the night transition (CHR 2015 Reg 26; NMS 13; safe handover guidance)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Moon className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Handover score: {d.handover_score}/100 · {d.total_handovers} handovers · risk briefing {Math.round(d.risk_briefing_rate)}% · medication compliance {Math.round(d.medication_compliance_rate)}% · morning completion {Math.round(d.morning_completion_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.handover_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.risk_briefing_rate < 90 || d.medication_compliance_rate < 100 || d.morning_completion_rate < 90) && (
          <div className="flex flex-col gap-2">
            {d.risk_briefing_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Risk briefing rate {Math.round(d.risk_briefing_rate)}% — a handover without a risk briefing means the incoming team does not know what to watch for; risk that is not communicated cannot be managed
              </div>
            )}
            {d.medication_compliance_rate < 100 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Medication compliance rate {Math.round(d.medication_compliance_rate)}% — medication status must be confirmed at every handover; medication errors frequently occur at shift transitions when information about what has or has not been given is incomplete
              </div>
            )}
            {d.morning_completion_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Morning handover completion {Math.round(d.morning_completion_rate)}% — the morning handover is where overnight events are communicated to the day team; incomplete morning handovers mean day staff begin their shift without knowledge of what happened overnight
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Total handovers", value: d.total_handovers, color: d.total_handovers === 0 ? "text-red-600" : "text-blue-600" },
            { label: "Night events documented", value: `${Math.round(d.night_events_documented_rate)}%`, color: d.night_events_documented_rate < 90 ? "text-amber-600" : "text-emerald-600" },
            { label: "Children notes rate", value: `${Math.round(d.children_notes_rate)}%`, color: d.children_notes_rate < 80 ? "text-amber-600" : "text-emerald-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Moon className="h-4 w-4 text-muted-foreground" /> Handover Quality Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Risk briefing rate" value={d.risk_briefing_rate} warn={100} />
            <RateBar label="Medication compliance rate" value={d.medication_compliance_rate} warn={100} />
            <RateBar label="Morning handover completion rate" value={d.morning_completion_rate} warn={100} />
            <RateBar label="Night events documented rate" value={d.night_events_documented_rate} warn={100} />
            <RateBar label="Per-child notes rate" value={d.children_notes_rate} warn={90} />
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
          CHR 2015 Regulation 26 (night-time handover is part of the requirement for adequate night-time oversight; the transfer of risk information between teams is a regulatory expectation). NMS Standard 13 (night-time practice must be consistent and safe; handover quality directly determines the quality of care that follows). Safe handover guidance (NHS and care sector) — medication errors, missed safety concerns and escalation failures disproportionately occur at handover points; structured handover tools that require completion of specific safety-critical items (risk briefing, medication status, child-specific concerns) are the most effective mitigation. A handover that takes three minutes but covers every required element is better than a handover that takes thirty minutes and misses the risk-critical information.
        </p>
      </div>
    </PageShell>
  );
}
