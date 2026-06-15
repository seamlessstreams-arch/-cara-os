"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME STAFF DEVELOPMENT INTELLIGENCE CARD
// Home-level: supervision compliance, mandatory training, qualifications,
// induction progress, staff wellbeing — holistic workforce development view.
// CHR 2015 Reg 32, 33. SCCIF: "Leadership and management."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, GraduationCap, ClipboardCheck, BookOpen,
  TrendingUp, TrendingDown, Minus, UserCheck,
  Heart, Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeStaffDevelopmentIntelligence } from "@/hooks/use-home-staff-development-intelligence";
import type { StaffDevelopmentRating } from "@/lib/engines/home-staff-development-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<StaffDevelopmentRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:        { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:               { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:           { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:         { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data:  { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
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

export function HomeStaffDevelopmentIntelligenceCard() {
  const { data, isLoading } = useHomeStaffDevelopmentIntelligence();

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
  const __emptyState = d.staff_development_rating === "inadequate" && (d.staff_development_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      staff_development_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.staff_development_rating] ?? RATING_STYLES.insufficient_data;
  const hasExpired = d.training.expired_count > 0;
  const hasOverdueSup = d.supervision.overdue_count > 0;
  const isAlert = hasExpired || d.staff_development_rating === "inadequate";

  const SupTrendIcon = TREND_ICON[d.supervision.trend];

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-amber-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-amber-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className={cn("h-4 w-4", isAlert ? "text-amber-600" : "text-teal-500")} />
            <span className="text-slate-900">Staff Development</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.staff_development_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.staff_development_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.staff_development_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.staff_development_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Supervision Completion */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.supervision.completion_rate_6m >= 90 ? "text-green-600" : d.supervision.completion_rate_6m >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.supervision.completion_rate_6m}%
                </p>
                {d.supervision.trend !== "insufficient_data" && (
                  <SupTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.supervision.trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Supervision (6m)</p>
            </div>

            {/* Training Compliance */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.training.mandatory_compliance_rate === 100 ? "text-green-600" : d.training.mandatory_compliance_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                {d.training.mandatory_compliance_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Training Compliant</p>
            </div>

            {/* Expired Training */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.training.expired_count === 0 ? "text-green-600" : "text-red-600")}>
                {d.training.expired_count}
              </p>
              <p className="text-[10px] text-muted-foreground">Expired</p>
            </div>

            {/* Wellbeing */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Heart className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.supervision.avg_wellbeing_score !== null && d.supervision.avg_wellbeing_score >= 7 ? "text-green-600" : d.supervision.avg_wellbeing_score !== null && d.supervision.avg_wellbeing_score >= 5 ? "text-amber-600" : "text-red-600")}>
                  {d.supervision.avg_wellbeing_score ?? "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Wellbeing</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.staff_development_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Supervision Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <UserCheck className="h-3 w-3 text-teal-400" />
                Supervision
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Completed: <span className="font-medium text-slate-600">{d.supervision.total_completed_6m}</span> · Overdue: <span className={cn("font-medium", d.supervision.overdue_count > 0 ? "text-red-600" : "text-green-600")}>{d.supervision.overdue_count}</span></p>
                <p>Dual-signed: <span className={cn("font-medium", d.supervision.dual_signature_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.supervision.dual_signature_rate}%</span></p>
                {d.supervision.avg_duration_minutes !== null && (
                  <p>Avg duration: <span className="font-medium text-slate-600">{d.supervision.avg_duration_minutes}min</span></p>
                )}
              </div>
            </div>

            {/* Qualifications Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <Award className="h-3 w-3 text-teal-400" />
                Qualifications
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Completed: <span className="font-medium text-green-600">{d.qualifications.completed_count}</span> · In progress: <span className="font-medium text-blue-600">{d.qualifications.in_progress_count}</span></p>
                <p>Not started: <span className={cn("font-medium", d.qualifications.not_started_count > 0 ? "text-amber-600" : "text-slate-600")}>{d.qualifications.not_started_count}</span></p>
                <p>Mandatory: <span className={cn("font-medium", d.qualifications.mandatory_completion_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.qualifications.mandatory_completion_rate}%</span></p>
              </div>
            </div>

            {/* Training Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="h-3 w-3 text-teal-400" />
                Training
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.training.total_records}</span> · Mandatory: <span className="font-medium text-slate-600">{d.training.mandatory_total}</span></p>
                {d.training.expiring_soon_count > 0 && (
                  <p className="text-amber-600 font-medium">{d.training.expiring_soon_count} expiring soon</p>
                )}
                {d.training.not_started_count > 0 && (
                  <p className="text-amber-600 font-medium">{d.training.not_started_count} not started</p>
                )}
              </div>
            </div>

            {/* Induction Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1 flex items-center gap-1">
                <GraduationCap className="h-3 w-3 text-teal-400" />
                Inductions
              </p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Completed: <span className="font-medium text-green-600">{d.inductions.completed_count}</span> · In progress: <span className="font-medium text-blue-600">{d.inductions.in_progress_count}</span></p>
                {d.inductions.overdue_count > 0 && (
                  <p className="text-red-600 font-medium">{d.inductions.overdue_count} overdue</p>
                )}
                {d.inductions.completed_count > 0 && (
                  <p>Probation pass: <span className={cn("font-medium", d.inductions.probation_pass_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.inductions.probation_pass_rate}%</span></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expired Training Courses */}
        {d.training.expired_courses.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Expired Training</p>
            <div className="flex flex-wrap gap-1">
              {d.training.expired_courses.slice(0, 5).map((c, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Staff Without Recent Supervision */}
        {d.supervision.staff_without_recent_supervision.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">No Supervision (8+ Weeks)</p>
            <div className="flex flex-wrap gap-1">
              {d.supervision.staff_without_recent_supervision.slice(0, 6).map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Low Wellbeing Staff */}
        {d.supervision.low_wellbeing_staff.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-semibold text-red-600 uppercase tracking-wider">Low Wellbeing</p>
            <div className="flex flex-wrap gap-1">
              {d.supervision.low_wellbeing_staff.slice(0, 4).map((s, i) => (
                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">
                  {s}
                </span>
              ))}
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

        {/* Cara Staff Development Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Staff Intelligence
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
