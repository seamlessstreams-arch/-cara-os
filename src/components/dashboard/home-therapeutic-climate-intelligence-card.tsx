"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME THERAPEUTIC CLIMATE INTELLIGENCE CARD
// Home-level meta-analysis: behaviour log, restraints, incidents, missing
// episodes combined to assess overall therapeutic atmosphere.
// CHR 2015 Reg 19, Reg 20, Reg 35. SCCIF: "How well children are helped
// and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRate, meets } from "@/lib/metrics/rate";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Thermometer,
  ThumbsUp, ShieldOff, Flame, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { TherapeuticClimateRating, HomeTherapeuticClimateResult } from "@/lib/engines/home-therapeutic-climate-intelligence-engine";

interface HomeTherapeuticClimateResponse { data: HomeTherapeuticClimateResult; }

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<TherapeuticClimateRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeTherapeuticClimateIntelligenceCard() {
  const { data, isLoading } = useQuery<HomeTherapeuticClimateResponse>({
    queryKey: ["home-therapeutic-climate-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-therapeutic-climate-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home therapeutic climate intelligence");
      return res.json() as Promise<{ data: HomeTherapeuticClimateResult }>;
    },
    refetchInterval: 60_000,
  });

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
  const __emptyState = d.climate_rating === "inadequate" && (d.climate_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      climate_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.climate_rating] ?? RATING_STYLES.insufficient_data;
  const hasRestraints = d.restraint_profile.total_restraints > 0;
  const hasInjuries = d.restraint_profile.injuries_count > 0;
  const isAlert = hasInjuries || d.climate_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Thermometer className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-teal-500")} />
            <span className="text-slate-900">Therapeutic Climate</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.climate_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.climate_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.climate_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.climate_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Positive Ratio */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  meets(d.behaviour_profile.positive_ratio, 70) ? "text-[--cs-success]" :
                  meets(d.behaviour_profile.positive_ratio, 50) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.behaviour_profile.total_entries > 0 ? `${formatRate(d.behaviour_profile.positive_ratio)}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Positive</p>
            </div>

            {/* Restraints */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldOff className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restraint_profile.total_restraints === 0 ? "text-[--cs-success]" :
                  (d.restraint_profile.restraint_rate_per_child ?? 0) <= 0.5 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.restraint_profile.total_restraints}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Restraints</p>
            </div>

            {/* Incidents */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Flame className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.safety_profile.total_incidents === 0 ? "text-[--cs-success]" :
                  (d.safety_profile.incident_rate_per_child ?? 0) <= 1.0 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.safety_profile.total_incidents}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Incidents</p>
            </div>

            {/* Calm Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Smile className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.pattern_profile.calm_rate ?? 0) >= 75 ? "text-[--cs-success]" :
                  (d.pattern_profile.calm_rate ?? 0) >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {formatRate(d.pattern_profile.calm_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Calm</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.climate_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Behaviour</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Entries: <span className="font-medium text-slate-600">{d.behaviour_profile.total_entries}</span></p>
                <p>Positive: <span className="font-medium text-green-600">{d.behaviour_profile.positive_count}</span></p>
                <p>Concerning: <span className={cn("font-medium",
                  d.behaviour_profile.concerning_count > 0 ? "text-[--cs-warning]" : "text-[--cs-success]"
                )}>{d.behaviour_profile.concerning_count}</span></p>
                <p>High intensity: <span className={cn("font-medium",
                  d.behaviour_profile.high_intensity_count > 0 ? "text-[--cs-risk]" : "text-[--cs-success]"
                )}>{d.behaviour_profile.high_intensity_count}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Restraints</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Per child: <span className={cn("font-medium",
                  d.restraint_profile.restraint_rate_per_child === 0 ? "text-[--cs-success]" :
                  (d.restraint_profile.restraint_rate_per_child ?? 0) <= 0.5 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>{d.restraint_profile.restraint_rate_per_child}</span></p>
                <p>Child debrief: <span className={cn("font-medium",
                  !hasRestraints ? "text-slate-600" :
                  (d.restraint_profile.child_debrief_rate ?? 0) >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]"
                )}>{hasRestraints ? `${formatRate(d.restraint_profile.child_debrief_rate)}` : "N/A"}</span></p>
                <p>Injuries: <span className={cn("font-medium",
                  d.restraint_profile.injuries_count > 0 ? "text-[--cs-risk]" : "text-[--cs-success]"
                )}>{d.restraint_profile.injuries_count}</span></p>
                <p>Missing ep.: <span className={cn("font-medium",
                  d.safety_profile.missing_episodes > 0 ? "text-[--cs-warning]" : "text-[--cs-success]"
                )}>{d.safety_profile.missing_episodes}</span></p>
              </div>
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

        {/* Cara Climate Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Climate Intelligence
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
