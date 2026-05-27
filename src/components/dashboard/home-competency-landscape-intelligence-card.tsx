"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME COMPETENCY LANDSCAPE INTELLIGENCE CARD
// Workforce capability: competency profiles + development plans.
// CHR 2015 Reg 32, Reg 33. SCCIF: "The effectiveness of leaders and managers."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, GraduationCap,
  TrendingUp, Users, Award, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeCompetencyLandscapeIntelligence } from "@/hooks/use-home-competency-landscape-intelligence";
import type { CompetencyLandscapeRating } from "@/lib/engines/home-competency-landscape-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<CompetencyLandscapeRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeCompetencyLandscapeIntelligenceCard() {
  const { data, isLoading } = useHomeCompetencyLandscapeIntelligence();

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

  const ratingStyle = RATING_STYLES[d.competency_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.competency_rating === "inadequate" || d.currency.overdue_assessments > 2;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-cyan-500")} />
            <span className="text-slate-900">Competency Landscape</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.competency_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.competency_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.competency_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Avg Readiness */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Award className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.readiness.avg_readiness_score >= 70 ? "text-green-600" :
                  d.readiness.avg_readiness_score >= 55 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.readiness.avg_readiness_score > 0 ? d.readiness.avg_readiness_score : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Readiness</p>
            </div>

            {/* Active Plans */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.progression.active_plans > 0 ? "text-cyan-600" : "text-slate-400"
                )}>
                  {d.progression.active_plans}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Dev Plans</p>
            </div>

            {/* Stage Levels */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.stage_distribution.length >= 3 ? "text-green-600" :
                  d.stage_distribution.length >= 2 ? "text-amber-600" : "text-slate-600"
                )}>
                  {d.stage_distribution.length}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Stages</p>
            </div>

            {/* On Pathway */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.readiness.staff_with_target_rate >= 80 ? "text-green-600" :
                  d.readiness.staff_with_target_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.readiness.staff_with_target > 0 ? `${d.readiness.staff_with_target_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">On Pathway</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.competency_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Readiness</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Highest: <span className="font-medium text-green-600">{d.readiness.highest_readiness}</span></p>
                <p>Lowest: <span className={cn("font-medium",
                  d.readiness.lowest_readiness >= 60 ? "text-green-600" :
                  d.readiness.lowest_readiness >= 45 ? "text-amber-600" : "text-red-600"
                )}>{d.readiness.lowest_readiness}</span></p>
                <p>Above 70: <span className="font-medium text-slate-600">{d.readiness.staff_above_70}</span></p>
                <p>Overdue reviews: <span className={cn("font-medium",
                  d.currency.overdue_assessments === 0 ? "text-green-600" : "text-red-600"
                )}>{d.currency.overdue_assessments}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Progression</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Plan coverage: <span className={cn("font-medium",
                  d.progression.plan_coverage_rate >= 60 ? "text-green-600" :
                  d.progression.plan_coverage_rate >= 40 ? "text-amber-600" : "text-red-600"
                )}>{d.progression.plan_coverage_rate}%</span></p>
                <p>Actions done: <span className="font-medium text-slate-600">{d.progression.completed_actions}/{d.progression.total_actions}</span></p>
                <p>Overdue actions: <span className={cn("font-medium",
                  d.progression.overdue_actions === 0 ? "text-green-600" : "text-red-600"
                )}>{d.progression.overdue_actions}</span></p>
                <p>Completed plans: <span className="font-medium text-slate-600">{d.progression.completed_plans}</span></p>
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

        {/* ARIA Competency Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Competency Intelligence
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
