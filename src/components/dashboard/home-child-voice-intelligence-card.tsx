"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CHILD VOICE INTELLIGENCE CARD
// Home-level: house meetings, visitor engagement, child participation —
// holistic child voice intelligence view for the home dashboard.
// CHR 2015 Reg 7, 11. SCCIF: "Experiences and progress of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, MessageCircle, Users,
  CalendarCheck, UserCheck, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeChildVoiceIntelligence } from "@/hooks/use-home-child-voice-intelligence";
import type { ChildVoiceRating } from "@/lib/engines/home-child-voice-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<ChildVoiceRating, { bg: string; text: string; border: string; label: string }> = {
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

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  improving: "text-green-600",
  stable: "text-slate-500",
  declining: "text-red-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeChildVoiceIntelligenceCard() {
  const { data, isLoading } = useHomeChildVoiceIntelligence();

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
  const __emptyState = d.child_voice_rating === "inadequate" && (d.child_voice_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      child_voice_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.child_voice_rating] ?? RATING_STYLES.insufficient_data;
  const noMeetings = d.meetings.total_meetings_90d === 0 && d.child_voice_rating !== "insufficient_data";
  const hasDBS = d.visitors.dbs_compliance_rate < 100 && d.visitors.professional_count > 0;
  const isAlert = noMeetings || hasDBS || d.child_voice_rating === "inadequate";

  const MtgTrendIcon = TREND_ICON[d.meetings.trend];

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-violet-500")} />
            <span className="text-slate-900">Child Voice</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.child_voice_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.child_voice_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.child_voice_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.child_voice_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Meetings 90d */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CalendarCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.meetings.total_meetings_90d >= 6 ? "text-green-600" : d.meetings.total_meetings_90d >= 3 ? "text-amber-600" : "text-red-600")}>
                  {d.meetings.total_meetings_90d}
                </p>
                {d.meetings.trend !== "insufficient_data" && (
                  <MtgTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.meetings.trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Meetings (90d)</p>
            </div>

            {/* Attendance */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.meetings.avg_attendance_rate >= 90 ? "text-green-600" : d.meetings.avg_attendance_rate >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.meetings.avg_attendance_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Attendance</p>
            </div>

            {/* Child Voice Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.meetings.child_raised_topic_rate >= 50 ? "text-green-600" : d.meetings.child_raised_topic_rate >= 30 ? "text-amber-600" : "text-red-600")}>
                  {d.meetings.child_raised_topic_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Child Voice</p>
            </div>

            {/* Visitors 90d */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.visitors.total_90d > 0 ? "text-slate-700" : "text-slate-400")}>
                  {d.visitors.total_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Visitors (90d)</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.child_voice_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Meeting Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Meeting Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Full attend: <span className={cn("font-medium", d.meetings.full_attendance_count > 0 ? "text-green-600" : "text-slate-500")}>{d.meetings.full_attendance_count}</span></p>
                <p>Avg feedback: <span className={cn("font-medium", d.meetings.avg_feedback_per_meeting >= 2 ? "text-green-600" : "text-amber-600")}>{d.meetings.avg_feedback_per_meeting}</span></p>
                <p>Actions done: <span className={cn("font-medium", d.meetings.action_completion_rate >= 90 ? "text-green-600" : d.meetings.action_completion_rate >= 70 ? "text-amber-600" : "text-red-600")}>{d.meetings.action_completion_rate}%</span></p>
                {d.meetings.meeting_frequency_weeks !== null && (
                  <p>Frequency: <span className={cn("font-medium", d.meetings.meeting_frequency_weeks <= 1.5 ? "text-green-600" : d.meetings.meeting_frequency_weeks <= 2.5 ? "text-amber-600" : "text-red-600")}>{d.meetings.meeting_frequency_weeks}wk</span></p>
                )}
              </div>
            </div>

            {/* Visitor Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Visitor Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>DBS: <span className={cn("font-medium", d.visitors.dbs_compliance_rate === 100 ? "text-green-600" : "text-red-600")}>{d.visitors.dbs_compliance_rate}%</span></p>
                <p>ID verified: <span className={cn("font-medium", d.visitors.id_verification_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.visitors.id_verification_rate}%</span></p>
                <p>Signed out: <span className={cn("font-medium", d.visitors.sign_out_compliance_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.visitors.sign_out_compliance_rate}%</span></p>
                {d.visitors.visitors_still_signed_in > 0 && (
                  <p className="text-red-600 font-medium">{d.visitors.visitors_still_signed_in} still in</p>
                )}
                {d.visitors.family_count > 0 && (
                  <p>Family: <span className="font-medium text-green-600">{d.visitors.family_count}</span></p>
                )}
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

        {/* Cara Child Voice Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Child Voice Intelligence
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
