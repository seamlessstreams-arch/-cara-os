"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME EDUCATION ACHIEVEMENT INTELLIGENCE CARD
// Home-level: attendance, PEP compliance, achievements, exclusions —
// holistic education intelligence view for the home dashboard.
// CHR 2015 Reg 8, 29. SCCIF: "Education", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, GraduationCap, BookOpen,
  Clock, Ban, Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { below, formatRate, meets } from "@/lib/metrics/rate";
import { useHomeEducationAchievementIntelligence } from "@/hooks/use-home-education-achievement-intelligence";
import type { EducationRating } from "@/lib/engines/home-education-achievement-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<EducationRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeEducationAchievementIntelligenceCard() {
  const { data, isLoading } = useHomeEducationAchievementIntelligence();

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
  const hasExcl = d.attendance.exclusion_count_90d > 0;
  const lowAtt = below(d.attendance.attendance_rate, 80);
  const missingPep = d.pep.children_without_pep_90d.length > 0;
  const isAlert = hasExcl || lowAtt || missingPep || d.education_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-emerald-500")} />
            <span className="text-slate-900">Education</span>
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
                <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.attendance.attendance_rate === null ? "text-muted-foreground" : meets(d.attendance.attendance_rate, 90) ? "text-[--cs-success]" : meets(d.attendance.attendance_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
                  {formatRate(d.attendance.attendance_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Attendance</p>
            </div>

            {/* Exclusions */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Ban className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.attendance.exclusion_count_90d === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
                  {d.attendance.exclusion_count_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Exclusions</p>
            </div>

            {/* PEPs */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", missingPep ? "text-[--cs-risk]" : "text-[--cs-success]")}>
                  {d.pep.total_pep_meetings_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">PEPs (90d)</p>
            </div>

            {/* Achievements */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.achievements.achievements_90d > 0 ? "text-[--cs-success]" : "text-slate-400")}>
                  {d.achievements.achievements_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Achievements</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.education_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Attendance Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Attendance (30d)</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Present: <span className="font-medium text-green-600">{d.attendance.present_count}</span></p>
                {d.attendance.late_count > 0 && <p>Late: <span className="font-medium text-amber-600">{d.attendance.late_count}</span></p>}
                {d.attendance.absent_count > 0 && <p>Absent: <span className="font-medium text-red-600">{d.attendance.absent_count}</span></p>}
                {d.attendance.excluded_count > 0 && <p>Excluded: <span className="font-medium text-red-600">{d.attendance.excluded_count}</span></p>}
                <p>Punctuality: <span className={cn("font-medium", d.attendance.punctuality_rate === null ? "text-muted-foreground" : meets(d.attendance.punctuality_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(d.attendance.punctuality_rate)}</span></p>
              </div>
            </div>

            {/* PEP & Achievement Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">PEP & Progress</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>PEP coverage: <span className={cn("font-medium", missingPep ? "text-[--cs-risk]" : "text-[--cs-success]")}>{d.pep.children_with_pep_90d.length}/{d.pep.children_with_pep_90d.length + d.pep.children_without_pep_90d.length}</span></p>
                <p>Attainment: <span className="font-medium text-slate-600">{d.achievements.attainment_records_90d}</span></p>
                {d.achievements.concerns_90d > 0 && (
                  <p>Concerns: <span className={cn("font-medium", meets(d.achievements.concern_resolution_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{d.achievements.concerns_90d} ({formatRate(d.achievements.concern_resolution_rate)} managed)</span></p>
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

        {/* Cara Education Intelligence */}
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
