"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EDUCATION ENGAGEMENT INTELLIGENCE CARD
// Attendance, PEP compliance, EHCP reviews, school engagement, tutoring, homework.
// CHR 2015 Reg 8.
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, GraduationCap,
  BookOpen, ClipboardCheck, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { EducationRating, HomeEducationEngagementResult } from "@/lib/engines/home-education-engagement-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<EducationRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeEducationEngagementIntelligenceCard() {
  const { data, isLoading } = useQuery<{ data: HomeEducationEngagementResult }>({
    queryKey: ["home-education-engagement-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-education-engagement-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home education engagement intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });

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
  const __emptyState = d.education_rating === "inadequate" && (d.education_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      education_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.education_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.education_rating === "inadequate" || d.pep_compliance.overdue_count >= 2;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-indigo-500")} />
            <span className="text-slate-900">Education Engagement</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.education_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.education_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.education_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.education_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Attendance */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.attendance.attendance_rate ?? 0) >= 95 ? "text-[--cs-success]" :
                  (d.attendance.attendance_rate ?? 0) >= 80 ? "text-blue-600" : "text-[--cs-risk]"
                )}>
                  {d.attendance.total_sessions_30d > 0 ? `${d.attendance.attendance_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Attendance</p>
            </div>

            {/* PEP Compliance */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.pep_compliance.current_count > 0 && d.pep_compliance.overdue_count === 0 ? "text-[--cs-success]" :
                  d.pep_compliance.overdue_count > 0 ? "text-[--cs-risk]" : "text-[--cs-warning]"
                )}>
                  {d.pep_compliance.total_peps > 0 ? `${d.pep_compliance.current_count}/${d.pep_compliance.total_peps}` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">PEPs</p>
            </div>

            {/* Homework */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.homework.completion_rate ?? 0) >= 90 ? "text-[--cs-success]" :
                  (d.homework.completion_rate ?? 0) >= 75 ? "text-blue-600" : "text-[--cs-warning]"
                )}>
                  {d.homework.total_sessions_30d > 0 ? `${d.homework.completion_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Homework</p>
            </div>

            {/* Engagement */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.school_engagement.total_events_90d >= 3 ? "text-[--cs-success]" :
                  d.school_engagement.total_events_90d >= 1 ? "text-blue-600" : "text-[--cs-warning]"
                )}>
                  {d.school_engagement.total_events_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Events</p>
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
              Cara Education Intelligence
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
