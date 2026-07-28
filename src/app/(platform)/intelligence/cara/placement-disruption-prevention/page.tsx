"use client";

import { PageShell } from "@/components/ui/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, TrendingDown, CheckCircle, AlertTriangle, Users, Clock, BarChart2, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { DisruptionPreventionRating, DisruptionPreventionResult } from "@/lib/engines/home-placement-disruption-prevention-intelligence-engine";

interface DisruptionPreventionResponse { data: DisruptionPreventionResult; }

function useHomePlacementDisruptionPreventionIntelligence() {
  return useQuery<DisruptionPreventionResponse>({
    queryKey: ["home-placement-disruption-prevention-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-placement-disruption-prevention-intelligence");
      if (!res.ok) throw new Error("Failed to fetch placement disruption prevention intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

// ── Rating helpers ─────────────────────────────────────────────────────────────

const RATING_META: Record<DisruptionPreventionRating, { label: string; color: string; bg: string; border: string }> = {
  outstanding:       { label: "Outstanding",       color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  good:              { label: "Good",               color: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  adequate:          { label: "Adequate",           color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  inadequate:        { label: "Inadequate",         color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  insufficient_data: { label: "Insufficient Data",  color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

// ── Metric tile ───────────────────────────────────────────────────────────────

function Metric({ label, value, suffix = "", warn = false, good = false }: {
  label: string;
  value: string | number;
  suffix?: string;
  warn?: boolean;
  good?: boolean;
}) {
  const color = warn ? "text-red-600" : good ? "text-emerald-600" : "text-foreground";
  return (
    <div className="rounded-lg border bg-muted/30 p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}{suffix}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{label}</p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PlacementDisruptionPreventionPage() {
  const { data, isLoading, error } = useHomePlacementDisruptionPreventionIntelligence();
  const d = data?.data;

  if (isLoading) {
    return (
      <PageShell title="Disruption Prevention Intelligence" description="Analysing placement disruption prevention…">
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Loading…</div>
      </PageShell>
    );
  }
  if (error || !d) {
    return (
      <PageShell title="Disruption Prevention Intelligence" description="Unable to load data.">
        <div className="flex items-center justify-center h-48 text-destructive text-sm">Failed to load disruption prevention data.</div>
      </PageShell>
    );
  }

  const rating = RATING_META[d.disruption_rating];

  return (
    <PageShell
      title="Disruption Prevention Intelligence"
      description="Placement disruption planning, risk management, and stability outcomes (CHR 2015 Reg 5, 6, 9; SCCIF)."
    >
      <div className="space-y-6">

        {/* Rating banner */}
        <Card className={`border-2 ${rating.border}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${rating.bg} ${rating.border} border`}>
                <ShieldAlert className={`h-5 w-5 ${rating.color}`} />
                <span className={`text-sm font-semibold ${rating.color}`}>{rating.label}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{d.headline}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Disruption prevention score: {d.disruption_score}/100</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{d.disruption_score}</p>
                <p className="text-xs text-muted-foreground">/100</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* High-risk children banner */}
        {d.high_risk_children > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-medium text-red-800">
              {d.high_risk_children} child{d.high_risk_children !== 1 ? "ren" : ""} at elevated placement disruption risk — immediate planning required.
            </p>
          </div>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric
            label="Children with disruption plans"
            value={d.children_with_plans}
            good={d.children_with_plans > 0}
          />
          <Metric
            label="Disruption rate"
            value={Math.round(d.disruption_rate)}
            suffix="%"
            warn={d.disruption_rate > 20}
            good={d.disruption_rate === 0}
          />
          <Metric
            label="Planned endings"
            value={Math.round(d.planned_ending_rate)}
            suffix="%"
            good={d.planned_ending_rate >= 80}
            warn={d.planned_ending_rate < 50}
          />
          <Metric
            label="Average placement length"
            value={Math.round(d.average_placement_months)}
            suffix=" mo"
            good={d.average_placement_months >= 6}
          />
        </div>

        {/* Insights */}
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

        {/* Strengths + Concerns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {d.strengths.length > 0 && (
            <Card className="border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.strengths.map((s, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <Star className="h-3 w-3 text-emerald-500 flex-shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
          {d.concerns.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {d.concerns.map((c, i) => (
                    <li key={i} className="text-xs text-foreground flex gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      {c}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-muted-foreground" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {d.recommendations.map((rec) => {
                const urgencyColor =
                  rec.urgency === "immediate" ? "bg-red-100 text-red-700 border-red-200" :
                  rec.urgency === "soon"       ? "bg-amber-100 text-amber-700 border-amber-200" :
                  "bg-blue-100 text-blue-700 border-blue-200";
                return (
                  <div key={rec.rank} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold">
                      {rec.rank}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{rec.recommendation}</p>
                      {rec.regulatory_ref && (
                        <p className="text-xs text-muted-foreground mt-0.5">{rec.regulatory_ref}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-xs capitalize border ${urgencyColor}`}>
                      {rec.urgency}
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground border-t pt-3">
          CHR 2015 Reg 5 (engaging children), Reg 6 (quality of care), Reg 9 (accommodation). SCCIF: "Experiences and progress of children in care." Working Together 2023.
        </p>
      </div>
    </PageShell>
  );
}
