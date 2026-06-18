"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeMinorRepairsMaintenanceIntelligence } from "@/hooks/use-home-minor-repairs-maintenance-intelligence";
import type { MinorRepairsResult, MinorRepairsRating } from "@/lib/engines/home-minor-repairs-maintenance-intelligence-engine";

const RATING_META: Record<MinorRepairsRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function MinorRepairsMaintenanceIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeMinorRepairsMaintenanceIntelligence();
  const d = (raw as { data?: MinorRepairsResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Minor Repairs & Maintenance" description="Analysing repairs and maintenance data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Minor Repairs & Maintenance" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load minor repairs maintenance data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.maintenance_rating];

  return (
    <PageShell
      title="Minor Repairs & Maintenance"
      description="Request response rates, repair completion, safety checks, condition compliance, preventative maintenance and child environment quality — evidencing that the home maintains a safe, well-functioning physical environment that supports children's wellbeing (CHR 2015 Reg 5, 17; NMS 28)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Wrench className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Maintenance score: {d.maintenance_score}/100 · {d.total_maintenance_requests} requests · completion {Math.round(d.repair_completion_rate)}% · safety checks {Math.round(d.safety_check_rate)}% · child environment {Math.round(d.child_environment_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.maintenance_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.repair_completion_rate < 80 || d.safety_check_rate < 90 || d.child_environment_rate < 70) && (
          <div className="flex flex-col gap-2">
            {d.repair_completion_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Repair completion rate {Math.round(d.repair_completion_rate)}% — outstanding repairs signal to children that the home does not prioritise their environment; Ofsted frequently note that unresolved repairs communicate neglect of the physical space
              </div>
            )}
            {d.safety_check_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Safety check rate {Math.round(d.safety_check_rate)}% — safety checks are not optional; a home that is not systematically checking fire, electrical, water and structural safety is exposed to foreseeable harm
              </div>
            )}
            {d.child_environment_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Child environment rate {Math.round(d.child_environment_rate)}% — children spend most of their time in this home; the quality of that environment directly affects their wellbeing, sense of belonging and ability to regulate
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Maintenance requests", value: d.total_maintenance_requests },
            { label: "Repair completions", value: d.total_repair_completions },
            { label: "Safety checks", value: d.total_safety_checks },
            { label: "Condition audits", value: d.total_condition_audits },
            { label: "Preventative tasks", value: d.total_preventative_tasks },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border bg-muted/30 p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground" /> Maintenance & Safety Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Request response rate" value={d.request_response_rate} warn={90} />
            <RateBar label="Repair completion rate" value={d.repair_completion_rate} warn={90} />
            <RateBar label="Safety check rate" value={d.safety_check_rate} warn={100} />
            <RateBar label="Condition compliance rate" value={d.condition_compliance_rate} warn={90} />
            <RateBar label="Preventative maintenance rate" value={d.preventative_maintenance_rate} warn={80} />
            <RateBar label="Child environment rate" value={d.child_environment_rate} warn={80} />
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
          CHR 2015 Regulation 5 (the registered person must promote the welfare of children by ensuring the home environment is safe, well-maintained and supports their wellbeing). Regulation 17 (the registered person must carry out a risk assessment in respect of the premises and their location; maintenance failures can create or exacerbate risks that should have been identified and addressed). NMS Standard 28 (the home is well maintained, clean and in a good state of repair; children's bedrooms and communal areas are personalised and of an adequate standard). Ofsted's ILACS framework expects inspectors to assess whether the physical environment supports children's wellbeing — not just whether it is safe in a minimum sense, but whether it reflects genuine investment in where children live. Outstanding homes have excellent environments because staff understand that bricks and mortar are part of the therapeutic offer.
        </p>
      </div>
    </PageShell>
  );
}
