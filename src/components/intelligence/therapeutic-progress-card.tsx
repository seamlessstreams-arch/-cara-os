"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — THERAPEUTIC PROGRESS INTELLIGENCE CARD
// Per-child therapeutic trajectory — therapy, mood, behaviour, outcomes.
// CHR 2015 Reg 6 (quality of care), Reg 9 (care plans), Reg 10 (health).
// SCCIF: Overall experiences and progress of children.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, CheckCircle2, ChevronRight, Heart,
  Loader2, Minus, TrendingDown, TrendingUp, Activity,
  AlertCircle, Sparkles, Stethoscope, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTherapeuticProgress } from "@/hooks/use-therapeutic-progress";
import type {
  TrajectoryDirection,
  EngagementLevel,
  TherapeuticConcernLevel,
} from "@/lib/engines/therapeutic-progress-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const TRAJECTORY_STYLES: Record<TrajectoryDirection, { icon: typeof TrendingUp; color: string; label: string }> = {
  improving:         { icon: TrendingUp,   color: "text-green-600",  label: "Improving" },
  stable:            { icon: Minus,        color: "text-blue-600",   label: "Stable" },
  declining:         { icon: TrendingDown, color: "text-red-600",    label: "Declining" },
  insufficient_data: { icon: Activity,     color: "text-slate-400",  label: "Insufficient Data" },
};

const ENGAGEMENT_STYLES: Record<EngagementLevel, { bg: string; text: string }> = {
  excellent:    { bg: "bg-green-100",  text: "text-green-800" },
  good:         { bg: "bg-blue-100",   text: "text-blue-800" },
  inconsistent: { bg: "bg-amber-100",  text: "text-amber-800" },
  poor:         { bg: "bg-red-100",    text: "text-red-800" },
  disengaged:   { bg: "bg-slate-100",  text: "text-slate-600" },
};

const CONCERN_STYLES: Record<TherapeuticConcernLevel, { bg: string; text: string; border: string; label: string }> = {
  none:        { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "NONE" },
  low:         { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "LOW" },
  moderate:    { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "MODERATE" },
  significant: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "SIGNIFICANT" },
  critical:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "CRITICAL" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const REC_URGENCY_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function TherapeuticProgressCard({ childId }: { childId: string }) {
  const { data, isLoading } = useTherapeuticProgress(childId);

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

  const trajStyle = TRAJECTORY_STYLES[d.overall_trajectory];
  const TrajIcon = trajStyle.icon;
  const concernStyle = CONCERN_STYLES[d.concern_level];
  const engStyle = ENGAGEMENT_STYLES[d.therapy_engagement.engagement_level];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-purple-600" />
            <span className="text-slate-900">Therapeutic Progress</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", concernStyle.bg, concernStyle.text, concernStyle.border)}>
              {concernStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.overall_progress_score}%</span>
          </CardTitle>
          <div className={cn("flex items-center gap-1", trajStyle.color)}>
            <TrajIcon className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">{trajStyle.label}</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Trajectory KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <TrajIcon className={cn("h-3.5 w-3.5", trajStyle.color)} />
            </div>
            <p className={cn("text-lg font-bold tabular-nums", trajStyle.color)}>{d.overall_progress_score}</p>
            <p className="text-[10px] text-muted-foreground">Progress Score</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", engStyle.bg)}>
            <p className={cn("text-[10px] font-bold uppercase", engStyle.text)}>{d.therapy_engagement.engagement_level}</p>
            <p className="text-lg font-bold tabular-nums text-slate-600">{d.therapy_engagement.attendance_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Therapy Attend.</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d.mood_trajectory.current_avg_mood ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">Current Mood</p>
          </div>
          <div className={cn("text-center rounded-lg p-2",
            d.behaviour_trajectory.incidents_last_30d > 3 ? "bg-red-50" :
            d.behaviour_trajectory.incidents_last_30d > 0 ? "bg-amber-50" : "bg-green-50"
          )}>
            <p className={cn("text-lg font-bold tabular-nums",
              d.behaviour_trajectory.incidents_last_30d > 3 ? "text-red-600" :
              d.behaviour_trajectory.incidents_last_30d > 0 ? "text-amber-600" : "text-green-600"
            )}>{d.behaviour_trajectory.incidents_last_30d}</p>
            <p className="text-[10px] text-muted-foreground">Incidents (30d)</p>
          </div>
        </div>

        {/* Domain Trajectories */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Mood Trajectory", direction: d.mood_trajectory.direction, detail: d.mood_trajectory.data_points + " data points" },
            { label: "Behaviour", direction: d.behaviour_trajectory.direction, detail: d.behaviour_trajectory.de_escalation_success_rate + "% de-escalation" },
            { label: "Therapy Sessions", direction: d.therapy_engagement.attended > d.therapy_engagement.missed ? "improving" as TrajectoryDirection : d.therapy_engagement.total_sessions === 0 ? "insufficient_data" as TrajectoryDirection : "declining" as TrajectoryDirection, detail: d.therapy_engagement.sessions_last_30d + " in 30d" },
            { label: "Outcomes", direction: d.outcome_progress.improving > d.outcome_progress.declining ? "improving" as TrajectoryDirection : d.outcome_progress.declining > 0 ? "declining" as TrajectoryDirection : d.outcome_progress.total_targets === 0 ? "insufficient_data" as TrajectoryDirection : "stable" as TrajectoryDirection, detail: `${d.outcome_progress.improving}↑ ${d.outcome_progress.stable}→ ${d.outcome_progress.declining}↓` },
          ].map((item) => {
            const ts = TRAJECTORY_STYLES[item.direction];
            const DirIcon = ts.icon;
            return (
              <div key={item.label} className="rounded border p-2 flex items-center gap-2 text-xs">
                <DirIcon className={cn("h-3.5 w-3.5 shrink-0", ts.color)} />
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

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
              <div key={rec.rank} className={cn("rounded border p-2.5 text-xs leading-relaxed", REC_URGENCY_STYLES[rec.urgency] ?? REC_URGENCY_STYLES.planned)}>
                <div className="flex items-start justify-between gap-2">
                  <span>{rec.recommendation}</span>
                  <div className="flex flex-col items-end shrink-0">
                    {rec.regulatory_ref && <span className="text-[10px] font-mono opacity-60">{rec.regulatory_ref}</span>}
                    <span className="text-[10px] uppercase opacity-60">{rec.urgency}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CAMHS Status */}
        {(d.camhs_status.active_referrals > 0 || d.camhs_status.waiting) && (
          <div className="rounded border p-2.5 text-xs">
            <p className="font-semibold text-slate-700 flex items-center gap-1 mb-1">
              <BookOpen className="h-3 w-3 text-indigo-500" />
              CAMHS Status
            </p>
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              <span>{d.camhs_status.active_referrals} active referral(s)</span>
              <span>{d.camhs_status.total_sessions_held} sessions held</span>
              {d.camhs_status.waiting && (
                <span className="text-amber-600 font-medium">Waiting {d.camhs_status.waiting_weeks}w</span>
              )}
              {d.camhs_status.approaches_used.length > 0 && (
                <span>Approach: {d.camhs_status.approaches_used.join(", ")}</span>
              )}
            </div>
          </div>
        )}

        {/* ARIA Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Therapeutic Intelligence
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
