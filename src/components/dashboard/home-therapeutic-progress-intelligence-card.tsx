"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME THERAPEUTIC PROGRESS INTELLIGENCE CARD
// Behaviour mapping, sensory profiles, sleep assessments, emotional
// vocabulary, bereavement support, attachment, self-soothing.
// CHR 2015 Reg 6.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRate, meets } from "@/lib/metrics/rate";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Heart,
  Moon, Puzzle, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { TherapeuticRating, HomeTherapeuticProgressResult } from "@/lib/engines/home-therapeutic-progress-intelligence-engine";

interface HomeTherapeuticProgressResponse {
  data: HomeTherapeuticProgressResult;
}

function useHomeTherapeuticProgressIntelligence() {
  return useQuery<HomeTherapeuticProgressResponse>({
    queryKey: ["home-therapeutic-progress-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-therapeutic-progress-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home therapeutic progress intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<TherapeuticRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeTherapeuticProgressIntelligenceCard() {
  const { data, isLoading } = useHomeTherapeuticProgressIntelligence();

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
  const __emptyState = d.therapeutic_rating === "inadequate" && (d.therapeutic_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      therapeutic_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.therapeutic_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.therapeutic_rating === "inadequate" || d.behaviour_map.crisis_count >= 5;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-pink-500")} />
            <span className="text-slate-900">Therapeutic Progress</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.therapeutic_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.therapeutic_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.therapeutic_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.therapeutic_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* De-escalation Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  meets(d.behaviour_map.de_escalation_rate, 90) ? "text-[--cs-success]" :
                  meets(d.behaviour_map.de_escalation_rate, 70) ? "text-blue-600" : "text-[--cs-risk]"
                )}>
                  {d.behaviour_map.total_entries_90d > 0 ? `${formatRate(d.behaviour_map.de_escalation_rate)}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">De-escalation</p>
            </div>

            {/* Sleep Quality */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Moon className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  meets(d.sleep.good_quality_rate, 70) ? "text-[--cs-success]" :
                  meets(d.sleep.good_quality_rate, 40) ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.sleep.total_assessments > 0 ? `${formatRate(d.sleep.good_quality_rate)}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Sleep</p>
            </div>

            {/* Sensory Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Puzzle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.sensory.child_coverage >= 80 ? "text-[--cs-success]" :
                  d.sensory.child_coverage >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.sensory.total_profiles > 0 ? `${d.sensory.child_coverage}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Sensory</p>
            </div>

            {/* Self-Soothing Effectiveness */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Heart className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  meets(d.self_soothing.effectiveness_rate, 80) ? "text-[--cs-success]" :
                  meets(d.self_soothing.effectiveness_rate, 50) ? "text-blue-600" : "text-[--cs-warning]"
                )}>
                  {d.self_soothing.total_toolkits > 0 ? `${formatRate(d.self_soothing.effectiveness_rate)}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Soothing</p>
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
              Cara Therapeutic Intelligence
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
