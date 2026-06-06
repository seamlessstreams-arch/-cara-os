"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEETING GOVERNANCE INTELLIGENCE CARD
// Home-level: house meeting regularity, action completion, child attendance,
// feedback quality, and governance structure.
// CHR 2015 Reg 45. SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Megaphone,
  Users, CheckCircle2, MessageSquare, Timer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeMeetingGovernanceIntelligence } from "@/hooks/use-home-meeting-governance-intelligence";
import type { MeetingRating } from "@/lib/engines/home-meeting-governance-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<MeetingRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeMeetingGovernanceIntelligenceCard() {
  const { data, isLoading } = useHomeMeetingGovernanceIntelligence();

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

  const ratingStyle = RATING_STYLES[d.meeting_rating] ?? RATING_STYLES.insufficient_data;
  const hasLowAttendance = d.attendance_profile.avg_child_attendance_rate < 70;
  const hasLargeGap = d.regularity_profile.max_gap_days > 21;
  const isAlert = hasLowAttendance || hasLargeGap || d.meeting_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Meeting Governance</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.meeting_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.meeting_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.meeting_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.meeting_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Meetings */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Megaphone className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-lg font-bold tabular-nums text-slate-700">
                  {d.regularity_profile.total_meetings}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Meetings</p>
            </div>

            {/* Attendance */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.attendance_profile.avg_child_attendance_rate >= 90 ? "text-green-600" :
                  d.attendance_profile.avg_child_attendance_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.attendance_profile.avg_child_attendance_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Attendance</p>
            </div>

            {/* Action Completion */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.action_profile.completion_rate >= 80 ? "text-green-600" :
                  d.action_profile.completion_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.action_profile.completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Actions Done</p>
            </div>

            {/* Child-Raised Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.engagement_profile.child_raised_rate >= 50 ? "text-green-600" :
                  d.engagement_profile.child_raised_rate >= 30 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.engagement_profile.child_raised_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Child-Led</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.meeting_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Schedule</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Per month: <span className="font-medium text-slate-600">{d.regularity_profile.meetings_per_month}</span></p>
                <p>Avg gap: <span className="font-medium text-slate-600">{d.regularity_profile.avg_days_between}d</span></p>
                <p>Max gap: <span className={cn("font-medium",
                  d.regularity_profile.max_gap_days <= 10 ? "text-green-600" :
                  d.regularity_profile.max_gap_days <= 14 ? "text-amber-600" : "text-red-600"
                )}>{d.regularity_profile.max_gap_days}d</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Engagement</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg duration: <span className="font-medium text-slate-600">{d.engagement_profile.avg_duration}m</span></p>
                <p>Feedback: <span className="font-medium text-slate-600">{d.engagement_profile.meetings_with_feedback}/{d.regularity_profile.total_meetings}</span></p>
                <p>Avg items: <span className="font-medium text-slate-600">{d.engagement_profile.avg_agenda_items}</span></p>
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

        {/* ARIA Meeting Governance Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Meeting Intelligence
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
