"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD EDUCATION & LEARNING INTELLIGENCE CARD
// Per-child education analysis: attendance, attainment, PEP compliance,
// EHCP status, exclusions, homework, tutoring, and achievements.
// CHR 2015 Reg 8, 10, 25. SCCIF: Education and learning.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  AlertTriangle, Brain, Loader2, GraduationCap, BookOpen,
  AlertCircle, Sparkles, Calendar, TrendingUp, TrendingDown,
  Minus, Award, ClipboardCheck, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildEducationIntelligence } from "@/hooks/use-child-education-intelligence";
import type { EducationHealth, AttendanceBand } from "@/lib/engines/child-education-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const HEALTH_STYLES: Record<EducationHealth, { bg: string; text: string; border: string; label: string }> = {
  outstanding:          { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:                 { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  requires_improvement: { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "REQ. IMPROVEMENT" },
  inadequate:           { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data:    { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "INSUFFICIENT DATA" },
};

const BAND_STYLES: Record<AttendanceBand, string> = {
  excellent: "text-green-600",
  good: "text-blue-600",
  concern: "text-amber-600",
  persistent_absence: "text-red-600",
  severe_absence: "text-red-700",
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

const TREND_ICON: Record<string, typeof TrendingUp> = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildEducationIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildEducationIntelligence(childId);

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

  const healthStyle = HEALTH_STYLES[d.education_health] ?? HEALTH_STYLES.insufficient_data;
  const att = d.attendance;
  const exc = d.exclusions;
  const pep = d.pep_compliance;
  const TrendIcon = TREND_ICON[att.trend] ?? Minus;
  const bandStyle = BAND_STYLES[att.band] ?? "text-slate-600";

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-blue-500" />
            <span className="text-slate-900">Education & Learning</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", healthStyle.bg, healthStyle.text, healthStyle.border)}>
              {healthStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.education_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
        {d.school_name && (
          <p className="text-[10px] text-muted-foreground">School: {d.school_name}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {d.education_health === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* Attendance & Exclusion KPIs */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", att.overall_pct >= 96 ? "bg-green-50" : att.overall_pct >= 90 ? "bg-blue-50" : att.overall_pct >= 85 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", bandStyle)}>{att.overall_pct}%</p>
            <p className="text-[10px] text-muted-foreground">Attendance</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-0.5">
              <TrendIcon className={cn("h-3.5 w-3.5", att.trend === "improving" ? "text-green-500" : att.trend === "declining" ? "text-red-500" : "text-slate-400")} />
              <p className={cn("text-sm font-bold capitalize", att.trend === "improving" ? "text-green-600" : att.trend === "declining" ? "text-red-600" : "text-slate-600")}>
                {att.trend === "insufficient_data" ? "N/A" : att.trend}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Trend</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", exc.total_90d > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", exc.total_90d > 0 ? "text-red-600" : "text-green-600")}>{exc.total_90d}</p>
            <p className="text-[10px] text-muted-foreground">Exclusions (90d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", att.unauthorised_count > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", att.unauthorised_count > 0 ? "text-amber-600" : "text-green-600")}>{att.unauthorised_count}</p>
            <p className="text-[10px] text-muted-foreground">Unauthorised</p>
          </div>
        </div>

        {/* PEP & EHCP Row */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <ClipboardCheck className={cn("h-3.5 w-3.5 shrink-0", pep.pep_current ? "text-green-500" : "text-red-500")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">PEP Status</p>
              <p className="text-[10px] text-muted-foreground">
                {pep.pep_current ? (
                  <>
                    <span className="text-green-600">Current</span> · Last: {pep.latest_pep_date ?? "N/A"}
                  </>
                ) : (
                  <span className="text-red-600 font-medium">Overdue / Missing</span>
                )}
              </p>
              {pep.targets_set > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  Targets: {pep.targets_achieved}/{pep.targets_set} achieved ({pep.target_achievement_rate}%)
                </p>
              )}
            </div>
          </div>
          <div className="rounded border p-2 flex items-center gap-2 text-xs">
            <BookOpen className={cn("h-3.5 w-3.5 shrink-0", d.ehcp_status.has_ehcp ? "text-purple-500" : "text-slate-400")} />
            <div className="min-w-0">
              <p className="font-medium text-slate-700">EHCP</p>
              <p className="text-[10px] text-muted-foreground">
                {d.ehcp_status.has_ehcp ? (
                  <>
                    <span className="text-purple-600">Active</span>
                    {d.ehcp_status.review_overdue && <span className="text-red-600 ml-1">· Review overdue</span>}
                    {d.ehcp_status.provision_in_place && <span className="text-green-600 ml-1">· Provision in place</span>}
                  </>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </p>
              {d.ehcp_status.needs_areas.length > 0 && (
                <p className="text-[10px] text-muted-foreground truncate">
                  Needs: {d.ehcp_status.needs_areas.join(", ")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Homework & Tutoring Row */}
        {(d.homework.total_sessions_30d > 0 || d.tutoring.total_sessions_90d > 0) && (
          <div className="grid grid-cols-2 gap-1.5">
            {d.homework.total_sessions_30d > 0 && (
              <div className="rounded border p-2 flex items-center gap-2 text-xs">
                <Pencil className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">Homework (30d)</p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.homework.total_sessions_30d} sessions · {d.homework.completion_rate}% complete · {d.homework.engagement_rate}% engaged
                  </p>
                </div>
              </div>
            )}
            {d.tutoring.total_sessions_90d > 0 && (
              <div className="rounded border p-2 flex items-center gap-2 text-xs">
                <BookOpen className="h-3.5 w-3.5 text-teal-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-slate-700">Tutoring (90d)</p>
                  <p className="text-[10px] text-muted-foreground">
                    {d.tutoring.total_sessions_90d} sessions · {d.tutoring.total_hours}h · Progress: {d.tutoring.avg_progress_rating}/5
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {d.achievements.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
              <Award className="h-3 w-3" />
              Achievements ({d.achievements.length})
            </p>
            {d.achievements.slice(0, 3).map((a, i) => (
              <div key={i} className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800 leading-relaxed">
                <span className="text-[10px] text-amber-600 mr-1">{a.date}</span>
                {a.description}
              </div>
            ))}
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

        {/* ARIA Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Education Intelligence
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
