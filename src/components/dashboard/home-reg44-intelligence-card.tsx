"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME REG 44 VISITS INTELLIGENCE CARD
// Home-level: visit frequency, recommendation completion, action plan
// compliance, child voice capture, Ofsted notification, quality trends.
// CHR 2015 Reg 44. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, UserCheck,
  CalendarCheck, CheckCircle, ClipboardList, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeReg44Intelligence } from "@/hooks/use-home-reg44-intelligence";
import type { Reg44Rating } from "@/lib/engines/home-reg44-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<Reg44Rating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeReg44IntelligenceCard() {
  const { data, isLoading } = useHomeReg44Intelligence();

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

  const ratingStyle = RATING_STYLES[d.reg44_rating] ?? RATING_STYLES.insufficient_data;
  const hasOverdue = d.action_plan_profile.overdue > 0;
  const hasHighOutstanding = d.recommendation_profile.high_priority_outstanding > 0;
  const isAlert = hasOverdue || hasHighOutstanding || d.reg44_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-teal-500")} />
            <span className="text-slate-900">Reg 44 Visits</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.reg44_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.reg44_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.reg44_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Visits in 12m */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.visit_frequency_profile.total_visits_12m >= 12 ? "text-green-600" :
                  d.visit_frequency_profile.total_visits_12m >= 10 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.visit_frequency_profile.total_visits_12m}/12
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Visits (12m)</p>
            </div>

            {/* Rec Completion */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.recommendation_profile.completion_rate >= 80 ? "text-green-600" :
                  d.recommendation_profile.completion_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.recommendation_profile.completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Recs Done</p>
            </div>

            {/* Ofsted Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.quality_profile.ofsted_notification_rate === 100 ? "text-green-600" :
                  d.quality_profile.ofsted_notification_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.quality_profile.ofsted_notification_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">To Ofsted</p>
            </div>

            {/* Trend */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.quality_profile.judgement_trend === "improving" ? "text-green-600" :
                  d.quality_profile.judgement_trend === "stable" ? "text-blue-600" : "text-red-600"
                )}>
                  {d.quality_profile.judgement_trend === "improving" ? "↑" :
                   d.quality_profile.judgement_trend === "declining" ? "↓" : "→"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Trend</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.reg44_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Frequency</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Last 90d: <span className="font-medium text-slate-600">{d.visit_frequency_profile.visits_90d} visits</span></p>
                <p>Largest gap: <span className={cn("font-medium", d.visit_frequency_profile.gap_days_largest <= 35 ? "text-green-600" : "text-amber-600")}>{d.visit_frequency_profile.gap_days_largest}d</span></p>
                <p>Monthly: <span className={cn("font-medium", d.visit_frequency_profile.monthly_compliance ? "text-green-600" : "text-red-600")}>{d.visit_frequency_profile.monthly_compliance ? "Yes" : "No"}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Actions</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.action_plan_profile.total_actions}</span></p>
                {d.action_plan_profile.overdue > 0 && (
                  <p>Overdue: <span className="font-medium text-red-600">{d.action_plan_profile.overdue}</span></p>
                )}
                {d.recommendation_profile.high_priority_outstanding > 0 && (
                  <p>High priority: <span className="font-medium text-red-600">{d.recommendation_profile.high_priority_outstanding} outstanding</span></p>
                )}
                {d.action_plan_profile.carried_forward > 0 && (
                  <p>Carried fwd: <span className="font-medium text-amber-600">{d.action_plan_profile.carried_forward}</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Quality metrics */}
        {d.reg44_rating !== "insufficient_data" && (
          <div className="rounded border p-2 text-xs">
            <p className="font-medium text-slate-700 mb-1">Visit Quality</p>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-muted-foreground">
              <p>Duration: <span className="font-medium text-slate-600">{d.quality_profile.avg_duration_hours}h avg</span></p>
              <p>Children: <span className={cn("font-medium", d.quality_profile.child_voice_every_visit ? "text-green-600" : "text-amber-600")}>{d.quality_profile.avg_children_spoken_pct}%</span></p>
              <p>Records: <span className="font-medium text-slate-600">{d.quality_profile.avg_records_reviewed} avg</span></p>
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

        {/* ARIA Reg 44 Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Reg 44 Intelligence
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
