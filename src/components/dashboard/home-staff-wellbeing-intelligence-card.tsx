"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF WELLBEING INTELLIGENCE CARD
// Staff morale, support, stressors, follow-up compliance.
// CHR 2015 Reg 33. SCCIF: "Leadership supports staff wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Heart,
  Users, Activity, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeStaffWellbeingIntelligence } from "@/hooks/use-home-staff-wellbeing-intelligence";
import type { StaffWellbeingRating } from "@/lib/engines/home-staff-wellbeing-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<StaffWellbeingRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeStaffWellbeingIntelligenceCard() {
  const { data, isLoading } = useHomeStaffWellbeingIntelligence();

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

  const ratingStyle = RATING_STYLES[d.wellbeing_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.wellbeing_rating === "inadequate" || d.morale.at_risk_count >= 2;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-rose-500")} />
            <span className="text-slate-900">Staff Wellbeing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.wellbeing_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.wellbeing_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.wellbeing_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.wellbeing_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Average Morale */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.morale.avg_overall >= 7 ? "text-green-600" :
                  d.morale.avg_overall >= 5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.morale.avg_overall}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Morale</p>
            </div>

            {/* At Risk */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.morale.at_risk_count === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.morale.at_risk_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">At Risk</p>
            </div>

            {/* Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.coverage.coverage_rate >= 80 ? "text-green-600" :
                  d.coverage.coverage_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.coverage.coverage_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Coverage</p>
            </div>

            {/* Thriving */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.morale.thriving_count > 0 ? "text-green-600" : "text-slate-400"
                )}>
                  {d.morale.thriving_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Thriving</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.wellbeing_rating !== "insufficient_data" && d.coverage.total_checks > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Morale</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Workload: <span className={cn("font-medium",
                  d.morale.avg_workload >= 6 ? "text-green-600" : "text-amber-600"
                )}>{d.morale.avg_workload}/10</span></p>
                <p>Support: <span className={cn("font-medium",
                  d.morale.avg_support >= 6 ? "text-green-600" : "text-amber-600"
                )}>{d.morale.avg_support}/10</span></p>
                <p>Moral: <span className={cn("font-medium",
                  d.morale.avg_moral >= 6 ? "text-green-600" : "text-amber-600"
                )}>{d.morale.avg_moral}/10</span></p>
                <p>Range: <span className="font-medium text-slate-600">{d.morale.lowest_overall}–{d.morale.highest_overall}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Support</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total checks: <span className="font-medium text-slate-600">{d.coverage.total_checks}</span></p>
                <p>Staff checked: <span className="font-medium text-slate-600">{d.coverage.unique_staff_checked}</span></p>
                <p>Follow-ups due: <span className={cn("font-medium",
                  d.follow_ups.overdue_follow_ups === 0 ? "text-green-600" : "text-red-600"
                )}>{d.follow_ups.overdue_follow_ups} overdue</span></p>
                <p>Stressors: <span className={cn("font-medium",
                  d.stressor_profile.total_positives > d.stressor_profile.total_stressors ? "text-green-600" : "text-amber-600"
                )}>{d.stressor_profile.total_stressors} vs {d.stressor_profile.total_positives} pos</span></p>
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

        {/* ARIA Wellbeing Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Wellbeing Intelligence
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
