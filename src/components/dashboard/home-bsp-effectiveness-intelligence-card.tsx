"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BSP EFFECTIVENESS INTELLIGENCE CARD
// Cross-cutting analysis: behaviour support plans × behaviour log × restraints.
// CHR 2015 Reg 19, Reg 20. SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, BookOpen,
  ThumbsUp, ShieldOff, Target, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeBSPEffectivenessIntelligence } from "@/hooks/use-home-bsp-effectiveness-intelligence";
import type { BSPEffectivenessRating } from "@/lib/engines/home-bsp-effectiveness-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<BSPEffectivenessRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeBSPEffectivenessIntelligenceCard() {
  const { data, isLoading } = useHomeBSPEffectivenessIntelligence();

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

  const ratingStyle = RATING_STYLES[d.bsp_rating] ?? RATING_STYLES.insufficient_data;
  const hasCoverageGap = d.coverage.children_with_concerning_no_bsp > 0;
  const isAlert = d.bsp_rating === "inadequate" || (hasCoverageGap && d.restraint.total_restraints > 0);

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-violet-500")} />
            <span className="text-slate-900">BSP Effectiveness</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.bsp_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.bsp_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.bsp_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.bsp_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Active Plans */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.plan_quality.total_active > 0 ? "text-violet-600" : "text-slate-400"
                )}>
                  {d.plan_quality.total_active}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Active BSPs</p>
            </div>

            {/* Strategy Usage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.behaviour.strategy_usage_rate >= 80 ? "text-green-600" :
                  d.behaviour.strategy_usage_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.behaviour.concerning_count > 0 ? `${d.behaviour.strategy_usage_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Strategy Use</p>
            </div>

            {/* Restraints */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldOff className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restraint.total_restraints === 0 ? "text-green-600" :
                  d.restraint.total_restraints <= 2 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.restraint.total_restraints}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">BSP Restraints</p>
            </div>

            {/* Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.coverage.children_with_concerning_no_bsp === 0 ? "text-green-600" :
                  d.coverage.children_with_concerning_no_bsp <= 1 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.coverage.children_with_concerning_no_bsp}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Gap</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.bsp_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Plan Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Effectiveness: <span className={cn("font-medium",
                  d.plan_quality.strategy_effectiveness_rate >= 80 ? "text-green-600" :
                  d.plan_quality.strategy_effectiveness_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>{d.plan_quality.total_active > 0 ? `${d.plan_quality.strategy_effectiveness_rate}%` : "N/A"}</span></p>
                <p>Child voice: <span className={cn("font-medium",
                  d.plan_quality.child_voice_rate >= 90 ? "text-green-600" :
                  d.plan_quality.child_voice_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>{d.plan_quality.total_active > 0 ? `${d.plan_quality.child_voice_rate}%` : "N/A"}</span></p>
                <p>Professional input: <span className={cn("font-medium",
                  d.plan_quality.professional_input_rate >= 80 ? "text-green-600" :
                  d.plan_quality.professional_input_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>{d.plan_quality.total_active > 0 ? `${d.plan_quality.professional_input_rate}%` : "N/A"}</span></p>
                <p>Safety plan: <span className={cn("font-medium",
                  d.plan_quality.safety_plan_rate >= 90 ? "text-green-600" : "text-amber-600"
                )}>{d.plan_quality.total_active > 0 ? `${d.plan_quality.safety_plan_rate}%` : "N/A"}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Behaviour</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Entries: <span className="font-medium text-slate-600">{d.behaviour.total_entries}</span></p>
                <p>Positive: <span className={cn("font-medium",
                  d.behaviour.positive_rate >= 70 ? "text-green-600" :
                  d.behaviour.positive_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>{d.behaviour.total_entries > 0 ? `${d.behaviour.positive_rate}%` : "N/A"}</span></p>
                <p>High intensity: <span className={cn("font-medium",
                  d.behaviour.high_intensity_count === 0 ? "text-green-600" :
                  d.behaviour.high_intensity_rate <= 30 ? "text-amber-600" : "text-red-600"
                )}>{d.behaviour.high_intensity_count}</span></p>
                <p>Overdue reviews: <span className={cn("font-medium",
                  d.currency.overdue_reviews === 0 ? "text-green-600" : "text-red-600"
                )}>{d.currency.overdue_reviews}</span></p>
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

        {/* ARIA BSP Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA BSP Intelligence
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
