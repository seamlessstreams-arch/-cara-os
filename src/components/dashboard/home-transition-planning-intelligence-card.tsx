"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TRANSITION PLANNING INTELLIGENCE CARD
// Pathway planning, independence preparation, goal achievement, area coverage.
// CHR 2015 Reg 14: "The care and independence planning standard."
// SCCIF: "Children are well prepared for their future."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, GraduationCap,
  Target, CheckCircle, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeTransitionPlanningIntelligence } from "@/hooks/use-home-transition-planning-intelligence";
import type { TransitionRating } from "@/lib/engines/home-transition-planning-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<TransitionRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeTransitionPlanningIntelligenceCard() {
  const { data, isLoading } = useHomeTransitionPlanningIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.transition_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.transition_rating === "inadequate" || d.goal_status.at_risk > 2;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">Transition Planning</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.transition_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.transition_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.transition_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Total Goals */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-lg font-bold tabular-nums text-blue-600">
                  {d.goal_status.total_goals}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Goals</p>
            </div>

            {/* Achieved */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.goal_status.achieved > 0 ? "text-green-600" : "text-slate-400"
                )}>
                  {d.goal_status.achieved}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Achieved</p>
            </div>

            {/* Children Covered */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.child_coverage.coverage_rate >= 100 ? "text-green-600" :
                  d.child_coverage.coverage_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.child_coverage.children_with_goals}/{d.child_coverage.total_children}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Children</p>
            </div>

            {/* Area Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.area_coverage.areas_covered >= 6 ? "text-green-600" :
                  d.area_coverage.areas_covered >= 4 ? "text-blue-600" : "text-amber-600"
                )}>
                  {d.area_coverage.areas_covered}/{d.area_coverage.total_possible_areas}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Areas</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.transition_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Goal Status</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>On track: <span className="font-medium text-green-600">{d.goal_status.on_track}</span></p>
                <p>In progress: <span className="font-medium text-blue-600">{d.goal_status.in_progress}</span></p>
                <p>At risk: <span className={cn("font-medium",
                  d.goal_status.at_risk === 0 ? "text-green-600" : "text-red-600"
                )}>{d.goal_status.at_risk}</span></p>
                <p>Not started: <span className="font-medium text-slate-600">{d.goal_status.not_started}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Progress</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg complete: <span className="font-medium text-slate-600">{d.progress.avg_percent_complete}%</span></p>
                <p>Overdue: <span className={cn("font-medium",
                  d.progress.goals_overdue === 0 ? "text-green-600" : "text-red-600"
                )}>{d.progress.goals_overdue}</span></p>
                <p>Review rate: <span className={cn("font-medium",
                  d.progress.review_rate >= 80 ? "text-green-600" :
                  d.progress.review_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>{d.progress.review_rate}%</span></p>
                <p>With actions: <span className="font-medium text-slate-600">{d.progress.goals_with_actions}</span></p>
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
              <div key={i} className="rounded border border-green-200 bg-green-50 p-2.5 text-xs text-green-800 leading-relaxed">
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
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
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

        {/* ARIA Transition Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Transition Intelligence
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
