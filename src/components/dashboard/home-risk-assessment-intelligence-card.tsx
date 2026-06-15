"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RISK ASSESSMENT INTELLIGENCE CARD
// Home-level: risk assessments, behaviour support plans, trend analysis,
// mitigation effectiveness, review compliance.
// CHR 2015 Reg 12, 13. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ShieldAlert,
  TrendingDown, TrendingUp, CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeRiskAssessmentIntelligence } from "@/hooks/use-home-risk-assessment-intelligence";
import type { RiskAssessmentRating } from "@/lib/engines/home-risk-assessment-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<RiskAssessmentRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeRiskAssessmentIntelligenceCard() {
  const { data, isLoading } = useHomeRiskAssessmentIntelligence();

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
  const __emptyState = d.risk_rating === "inadequate" && (d.risk_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      risk_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.risk_rating] ?? RATING_STYLES.insufficient_data;
  const hasVeryHigh = d.risk_profile.very_high_risk_count > 0;
  const hasIncreasing = d.risk_profile.increasing_trend_count > 0;
  const hasOverdue = d.risk_profile.overdue_reviews + d.bsp_profile.overdue_reviews > 0;
  const hasMissing = d.risk_profile.children_without_assessments.length > 0;
  const isAlert = hasVeryHigh || hasIncreasing || hasOverdue || hasMissing || d.risk_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Risk Assessments & BSPs</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.risk_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.risk_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.risk_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.risk_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Assessments */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.risk_profile.total_assessments > 0 ? "text-green-600" : "text-red-600")}>
                  {d.risk_profile.total_assessments}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Assessments</p>
            </div>

            {/* Trends */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                {d.risk_profile.decreasing_trend_count > d.risk_profile.increasing_trend_count
                  ? <TrendingDown className="h-3.5 w-3.5 text-green-500" />
                  : <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                }
                <p className={cn("text-lg font-bold tabular-nums",
                  d.risk_profile.increasing_trend_count === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.risk_profile.decreasing_trend_count}↓ {d.risk_profile.increasing_trend_count}↑
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Trends</p>
            </div>

            {/* Mitigation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.risk_profile.mitigation_effectiveness_rate >= 80 ? "text-green-600" :
                  d.risk_profile.mitigation_effectiveness_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.risk_profile.mitigation_effectiveness_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Mitigations</p>
            </div>

            {/* BSPs */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.bsp_profile.active_plans > 0 ? "text-green-600" : "text-slate-600")}>
                  {d.bsp_profile.active_plans}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Active BSPs</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.risk_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Risk Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Risk Profile</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Children covered: <span className={cn("font-medium", d.risk_profile.children_without_assessments.length === 0 ? "text-green-600" : "text-red-600")}>{d.risk_profile.children_with_assessments.length}</span></p>
                {d.risk_profile.very_high_risk_count > 0 && <p>Very high risk: <span className="font-medium text-red-600">{d.risk_profile.very_high_risk_count}</span></p>}
                {d.risk_profile.high_risk_count > 0 && <p>High risk: <span className="font-medium text-amber-600">{d.risk_profile.high_risk_count}</span></p>}
                <p>Child views: <span className={cn("font-medium", d.risk_profile.child_views_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.risk_profile.child_views_rate}%</span></p>
                {d.risk_profile.overdue_reviews > 0 && <p>Overdue reviews: <span className="font-medium text-red-600">{d.risk_profile.overdue_reviews}</span></p>}
              </div>
            </div>

            {/* BSP Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">BSP Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Improving behaviours: <span className={cn("font-medium", d.bsp_profile.improving_behaviour_rate >= 60 ? "text-green-600" : "text-amber-600")}>{d.bsp_profile.improving_behaviour_rate}%</span></p>
                <p>Avg strategies: <span className="font-medium text-slate-600">{d.bsp_profile.avg_strategies_per_plan}</span></p>
                <p>Safety plans: <span className={cn("font-medium", d.bsp_profile.safety_plan_coverage === 100 ? "text-green-600" : "text-amber-600")}>{d.bsp_profile.safety_plan_coverage}%</span></p>
                {d.bsp_profile.overdue_reviews > 0 && <p>Overdue reviews: <span className="font-medium text-red-600">{d.bsp_profile.overdue_reviews}</span></p>}
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

        {/* Cara Risk Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Risk Intelligence
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
