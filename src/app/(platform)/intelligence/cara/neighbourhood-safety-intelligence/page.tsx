"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertTriangle, Clock, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { NeighbourhoodSafetyRiskAssessmentResult, NeighbourhoodSafetyRating } from "@/lib/engines/home-neighbourhood-safety-risk-assessment-intelligence-engine";

function useHomeNeighbourhoodSafetyRiskAssessmentIntelligence() {
  return useQuery({
    queryKey: ["home-neighbourhood-safety-risk-assessment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-neighbourhood-safety-risk-assessment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch neighbourhood safety risk assessment intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

const RATING_META: Record<NeighbourhoodSafetyRating, { label: string; color: string; bg: string; border: string }> = {
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

export default function NeighbourhoodSafetyIntelligencePage() {
  const { data: raw, isLoading, error } = useHomeNeighbourhoodSafetyRiskAssessmentIntelligence();
  const d = (raw as { data?: NeighbourhoodSafetyRiskAssessmentResult } | undefined)?.data;

  if (isLoading) {
    return (
      <PageShell title="Neighbourhood Safety Intelligence" description="Analysing neighbourhood safety risk assessment data…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Neighbourhood Safety Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load neighbourhood safety data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.neighbourhood_rating];

  return (
    <PageShell
      title="Neighbourhood Safety Intelligence"
      description="Risk assessment coverage, safety mapping, hazard identification, route safety, community partnerships and child awareness — evidencing that the home understands the environment beyond its walls and actively manages external risks to children in the local area (CHR 2015 Reg 5, 17; Contextual Safeguarding framework; NMS 18)."
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
                  Neighbourhood score: {d.neighbourhood_score}/100 · risk assessment {Math.round(d.risk_assessment_rate)}% · safety mapping {Math.round(d.safety_mapping_rate)}% · route safety {Math.round(d.route_safety_rate)}% · child awareness {Math.round(d.child_awareness_rate)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{d.neighbourhood_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(d.risk_assessment_rate < 80 || d.hazard_identification_rate < 80 || d.child_awareness_rate < 70) && (
          <div className="flex flex-col gap-2">
            {d.risk_assessment_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Neighbourhood risk assessment rate {Math.round(d.risk_assessment_rate)}% — the area around the home is part of the children's environment; an unassessed neighbourhood means risks from local gangs, county lines, exploitation networks or physical hazards may be unknown and unmitigated
              </div>
            )}
            {d.hazard_identification_rate < 80 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                Hazard identification rate {Math.round(d.hazard_identification_rate)}% — known hazards that have not been formally identified and recorded cannot be mitigated; children using local routes are at risk from hazards the home cannot manage if it does not know about them
              </div>
            )}
            {d.child_awareness_rate < 70 && (
              <div className="flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                Child awareness rate {Math.round(d.child_awareness_rate)}% — children are the most effective safeguard for their own safety in the community if they understand the risks; safety awareness is not frightening children, it is equipping them
              </div>
            )}
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> Neighbourhood Safety Rates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RateBar label="Risk assessment rate" value={d.risk_assessment_rate} warn={90} />
            <RateBar label="Safety mapping rate" value={d.safety_mapping_rate} warn={85} />
            <RateBar label="Hazard identification rate" value={d.hazard_identification_rate} warn={90} />
            <RateBar label="Route safety rate" value={d.route_safety_rate} warn={85} />
            <RateBar label="Community partnership rate" value={d.community_partnership_rate} warn={75} />
            <RateBar label="Child awareness rate" value={d.child_awareness_rate} warn={80} />
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
          CHR 2015 Regulation 17 (risk assessments must consider the location of the home and the risks it presents to children; neighbourhood risk is explicitly within scope). Regulation 5 (welfare — children's safety does not end at the front door; the home is responsible for understanding and mitigating risks in the environment where children live their daily lives). NMS Standard 18 (the registered person must ensure that the risks presented by the local area are regularly assessed and shared with children in a way that promotes rather than restricts their independence). Contextual Safeguarding (Firmin, 2015 / Contextual Safeguarding Network) — abuse and exploitation often occur in peer groups, online, and in local areas rather than only in the home; neighbourhood-level risk mapping is a core element of a modern safeguarding approach, particularly for children at risk of county lines involvement, criminal exploitation or CSE.
        </p>
      </div>
    </PageShell>
  );
}
