"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, CheckCircle, AlertTriangle, Clock, Star, BarChart2 } from "lucide-react";
import { useHomeChronologyIntelligence } from "@/hooks/use-home-chronology-intelligence";
import type { ChronologyRating } from "@/lib/engines/home-chronology-intelligence-engine";

const RATING_META: Record<ChronologyRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function ChronologyIntelligencePage() {
  const { data, isLoading, error } = useHomeChronologyIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Chronology Intelligence" description="Analysing chronology data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Chronology Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load chronology intelligence data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.chronology_rating];
  const evd = d.event_distribution;
  const cov = d.coverage_profile;
  const qual = d.quality_profile;
  const time = d.timeliness_profile;

  return (
    <PageShell
      title="Chronology Intelligence"
      description="Event distribution, child coverage, recording quality and timeliness across the whole-life chronology (CHR 2015 Reg 15; Working Together 2023; IRO Handbook; Ofsted ILACS recording standards)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <ScrollText className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Chronology score: {d.chronology_score}/100 · {evd.total_entries} entries · {cov.coverage_rate}% child coverage · {evd.critical_count} critical events
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.chronology_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(cov.children_without_entries > 0 || time.recording_gap_days > 7) && (
          <div className="flex flex-wrap gap-2">
            {cov.children_without_entries > 0 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                {cov.children_without_entries} child(ren) with no chronology entries — start immediately
              </div>
            )}
            {time.recording_gap_days > 7 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Last chronology entry was {time.recording_gap_days} days ago — bring up to date
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Event distribution */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-muted-foreground" />
                  Event Distribution
                </CardTitle>
                <Badge variant="outline" className="text-xs">{evd.total_entries} total · {evd.categories_used} categories</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className={`rounded border p-2 text-center ${evd.critical_count > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${evd.critical_count > 0 ? "text-red-600" : "text-foreground"}`}>{evd.critical_count}</p>
                  <p className="text-xs text-muted-foreground">Critical</p>
                </div>
                <div className="rounded border bg-amber-50 p-2 text-center">
                  <p className="text-lg font-bold text-amber-700">{evd.significant_count}</p>
                  <p className="text-xs text-muted-foreground">Significant</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{evd.routine_count}</p>
                  <p className="text-xs text-muted-foreground">Routine</p>
                </div>
              </div>
              {Object.keys(evd.category_breakdown).length > 0 && (
                <div className="pt-2 space-y-1">
                  {Object.entries(evd.category_breakdown).sort(([,a],[,b]) => b - a).slice(0, 5).map(([cat, count]) => (
                    <div key={cat} className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{cat.replace(/_/g, " ")}</span>
                      <span className="font-medium text-foreground">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coverage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Child Coverage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-emerald-50 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-700">{cov.children_with_entries}</p>
                  <p className="text-xs text-muted-foreground">With entries</p>
                </div>
                <div className={`rounded border p-2 text-center ${cov.children_without_entries > 0 ? "bg-red-50" : "bg-muted/30"}`}>
                  <p className={`text-lg font-bold ${cov.children_without_entries > 0 ? "text-red-600" : "text-foreground"}`}>{cov.children_without_entries}</p>
                  <p className="text-xs text-muted-foreground">Without entries</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                <span>Avg entries per child</span>
                <span className="font-medium text-foreground">{cov.avg_entries_per_child.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Range</span>
                <span className="font-medium text-foreground">{cov.min_entries} – {cov.max_entries}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Quality */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                Recording Quality
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <RateBar label="Description rate" value={qual.description_rate} />
              <RateBar label="Time recorded" value={qual.time_recording_rate} />
              <RateBar label="Incident-linked entries" value={qual.incident_linked_rate} warn={60} />
              <RateBar label="Critical events with incident" value={qual.critical_with_incident_rate} warn={100} />
            </CardContent>
          </Card>

          {/* Timeliness */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recording Timeliness
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{time.entries_last_30_days}</p>
                  <p className="text-xs text-muted-foreground">Entries (30d)</p>
                </div>
                <div className="rounded border bg-muted/30 p-2 text-center">
                  <p className="text-lg font-bold">{time.entries_per_month.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Per month</p>
                </div>
              </div>
              <div className={`flex items-center justify-between rounded border px-3 py-2 text-xs ${time.recording_gap_days > 7 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
                <span>Days since last entry</span>
                <span className="font-medium">{time.recording_gap_days} days</span>
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
          CHR 2015 Reg 15 (records). Working Together 2023 — chronologies as core safeguarding tool. IRO Handbook — chronology requirements. Ofsted ILACS 2023 — quality of recording and chronology maintenance.
        </p>
      </div>
    </PageShell>
  );
}
