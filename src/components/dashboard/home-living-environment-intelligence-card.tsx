"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LIVING ENVIRONMENT INTELLIGENCE CARD
// Bedrooms, pets, gardens, outdoor activities, environmental risks.
// CHR 2015 Reg 15.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRate, meets } from "@/lib/metrics/rate";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Home,
  BedDouble, PawPrint, TreePine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { LivingEnvironmentRating, HomeLivingEnvironmentResult } from "@/lib/engines/home-living-environment-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<LivingEnvironmentRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeLivingEnvironmentIntelligenceCard() {
  const { data: queryData, isLoading } = useQuery<{ data: HomeLivingEnvironmentResult }>({
    queryKey: ["home-living-environment-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-living-environment-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home living environment intelligence");
      return res.json() as Promise<{ data: HomeLivingEnvironmentResult }>;
    },
    refetchInterval: 60_000,
  });
  const data = queryData;

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  let d = data?.data;
  if (!d) return null;
  // Calm reframe: an empty-with-children engine result (inadequate + score<=15) is
  // 'not yet recorded', not a failing home — render it as honest, neutral insufficient_data.
  const __emptyState = d.living_environment_rating === "inadequate" && (d.living_environment_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      living_environment_rating: "insufficient_data",
      concerns: [],
      recommendations: [],
      insights: [],
      headline:
        String(d.headline || "")
          .split(/ despite | — | -- /)[0]
          .replace(/[\u2014,\-]\s*$/, "")
          .trim() + " — not yet recorded; capturing entries will enable this analysis.",
    };
  }

  const ratingStyle = RATING_STYLES[d.living_environment_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.living_environment_rating === "inadequate" || d.environmental_risks.critical_count > 0;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-teal-600")} />
            <span className="text-slate-900">Living Environment</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.living_environment_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{formatRate(d.living_environment_score)}</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.living_environment_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.living_environment_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Bedroom Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BedDouble className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  meets(d.bedrooms.child_coverage, 90) ? "text-[--cs-success]" :
                  meets(d.bedrooms.child_coverage, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.bedrooms.total_profiles > 0 ? `${formatRate(d.bedrooms.child_coverage)}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Bedrooms</p>
            </div>

            {/* Satisfaction */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Home className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.bedrooms.avg_satisfaction ?? 0) >= 4.0 ? "text-[--cs-success]" :
                  (d.bedrooms.avg_satisfaction ?? 0) >= 3.0 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.bedrooms.total_profiles > 0 ? `${d.bedrooms.avg_satisfaction}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Satisfaction</p>
            </div>

            {/* Pets */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <PawPrint className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.pets.total_pets > 0 && (d.pets.vaccination_rate ?? 0) >= 100 ? "text-[--cs-success]" :
                  d.pets.total_pets > 0 ? "text-[--cs-warning]" : "text-slate-400"
                )}>
                  {d.pets.total_pets > 0 ? d.pets.total_pets : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Pets</p>
            </div>

            {/* Gardens */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TreePine className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.gardens.total_plots > 0 ? "text-[--cs-success]" : "text-slate-400"
                )}>
                  {d.gardens.total_plots > 0 ? d.gardens.total_plots : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Gardens</p>
            </div>
          </div>
        )}

        {/* Strengths */}
        {d.strengths.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-green-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Strengths ({d.strengths.length})
            </p>
            {d.strengths.slice(0, 3).map((s, i) => (
              <div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">
                {s}
              </div>
            ))}
          </div>
        )}

        {/* Concerns */}
        {d.concerns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Concerns ({d.concerns.length})
            </p>
            {d.concerns.slice(0, 3).map((c, i) => (
              <div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">
                {c}
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {d.recommendations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Recommendations ({d.recommendations.length})
            </p>
            {d.recommendations.slice(0, 3).map((rec) => (
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_STYLES[rec.urgency] ?? REC_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  {rec.regulatory_ref && (
                    <span className="text-[10px] font-mono shrink-0 opacity-60">{rec.regulatory_ref}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cara Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Living Environment Intelligence
            </p>
            {d.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
