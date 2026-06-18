"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trees, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useHomeOutdoorNatureEngagementIntelligence } from "@/hooks/use-home-outdoor-nature-engagement-intelligence";
import type { OutdoorNatureResult, OutdoorNatureRating } from "@/lib/engines/home-outdoor-nature-engagement-intelligence-engine";

const RATING_META: Record<OutdoorNatureRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function OutdoorNatureEngagementIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeOutdoorNatureEngagementIntelligence();
  const d = (raw as { data?: OutdoorNatureResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Outdoor & Nature Engagement" description="Analysing outdoor and nature engagement data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Outdoor & Nature Engagement" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load outdoor nature engagement data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.outdoor_rating];

  return (
    <PageShell
      title="Outdoor & Nature Engagement"
      description="Outdoor activity frequency, nature-based learning, garden participation, exploration diversity, safety compliance, and child enjoyment — evidencing that children experience outdoor environments as a meaningful and regular part of their care, contributing to physical health, wellbeing, and developmental growth (CHR 2015 Reg 5; NMS 2, 10; ECMinds / Green Social Prescribing evidence)."
    >
      <div className="space-y-6">

        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <Trees className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Outdoor score: {d.outdoor_score}/100 · frequency {Math.round(d.outdoor_frequency_rate)}% · nature learning {Math.round(d.nature_learning_rate)}% · child enjoyment {Math.round(d.child_enjoyment_rate)}% · safety compliance {Math.round(d.safety_compliance_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.outdoor_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.outdoor_frequency_rate < 50 || d.safety_compliance_rate < 90) && (
          <div className="flex flex-col gap-2">
            {d.outdoor_frequency_rate < 50 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Outdoor frequency rate {Math.round(d.outdoor_frequency_rate)}% — low engagement with outdoor environments reduces children's opportunities for physical exercise, sensory regulation, and nature-based learning; these are not optional enrichment activities but core therapeutic and developmental provision
              </div>
            )}
            {d.safety_compliance_rate < 90 && (
              <div className="flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Safety compliance rate {Math.round(d.safety_compliance_rate)}% — outdoor activities with incomplete risk assessments or weather-inappropriate planning expose children to avoidable physical risks; safety planning enables outdoor activities rather than preventing them
              </div>
            )}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Trees className="h-4 w-4 text-muted-foreground" /> Outdoor Engagement Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Outdoor activity frequency rate" value={d.outdoor_frequency_rate} warn={80} />
            <RateBar label="Nature-based learning rate" value={d.nature_learning_rate} warn={60} />
            <RateBar label="Garden participation rate" value={d.garden_participation_rate} warn={60} />
            <RateBar label="Exploration diversity rate" value={d.exploration_diversity_rate} warn={70} />
            <RateBar label="Child enjoyment rate" value={d.child_enjoyment_rate} warn={80} />
            <RateBar label="Safety compliance rate" value={d.safety_compliance_rate} warn={100} />
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
          CHR 2015 Regulation 5 (welfare — the registered person must promote each child's physical, intellectual, emotional, social, and behavioural development, including through appropriate opportunities for play and recreation). NMS Standard 2 (The home) and Standard 10 (Physical activity and recreation). Green Social Prescribing evidence (NHS England, 2022) demonstrates significant wellbeing benefits for children and young people from regular nature connection and outdoor activities, particularly for those with adverse childhood experiences, anxiety, or developmental trauma. Looked-after children disproportionately spend time in indoor, screen-based environments; residential homes have a distinctive opportunity to reverse this through structured outdoor programmes. Risk assessment is the mechanism that enables outdoor activities, not the barrier to them — a home with low outdoor engagement due to risk aversion is failing children just as surely as one with inadequate safety planning.
        </p>
      </div>
    </PageShell>
  );
}
