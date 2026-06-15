"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME WORKFORCE PLANNING INTELLIGENCE CARD
// Home-level: staff composition, succession readiness, vacancy coverage,
// induction completion, workforce stability.
// CHR 2015 Reg 33. SCCIF: "Well-Led."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Users2,
  UserCheck, Briefcase, GraduationCap, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeWorkforcePlanningIntelligence } from "@/hooks/use-home-workforce-planning-intelligence";
import type { WorkforcePlanningRating } from "@/lib/engines/home-workforce-planning-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<WorkforcePlanningRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeWorkforcePlanningIntelligenceCard() {
  const { data, isLoading } = useHomeWorkforcePlanningIntelligence();

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
  const __emptyState = d.workforce_rating === "inadequate" && (d.workforce_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      workforce_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.workforce_rating] ?? RATING_STYLES.insufficient_data;
  const hasVacancies = d.vacancy_coverage.open_count > 0;
  const hasOverdueInductions = d.induction_profile.overdue_count > 0;
  const hasNoSuccession = d.succession_profile.total_plans === 0;
  const isAlert = hasOverdueInductions || (hasVacancies && hasNoSuccession) || d.workforce_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users2 className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-teal-500")} />
            <span className="text-slate-900">Workforce Planning</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.workforce_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.workforce_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.workforce_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.workforce_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Active Staff */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-lg font-bold tabular-nums text-slate-700">
                  {d.staff_composition.total_active}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Active Staff</p>
            </div>

            {/* Permanent Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.staff_composition.permanent_rate >= 80 ? "text-green-600" :
                  d.staff_composition.permanent_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.staff_composition.permanent_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Permanent</p>
            </div>

            {/* Succession Readiness */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.succession_profile.avg_readiness_score >= 70 ? "text-green-600" :
                  d.succession_profile.avg_readiness_score >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.succession_profile.total_plans > 0 ? `${d.succession_profile.avg_readiness_score}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Succession</p>
            </div>

            {/* DBS Update */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.staff_composition.dbs_update_service_rate >= 80 ? "text-green-600" :
                  d.staff_composition.dbs_update_service_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.staff_composition.dbs_update_service_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">DBS Update</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.workforce_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Composition</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Permanent: <span className="font-medium text-slate-600">{d.staff_composition.permanent_count}</span></p>
                {d.staff_composition.agency_count > 0 && (
                  <p>Agency: <span className="font-medium text-red-600">{d.staff_composition.agency_count}</span></p>
                )}
                <p>Long-serving: <span className="font-medium text-slate-600">{d.staff_composition.long_serving_count}</span></p>
                <p>New: <span className="font-medium text-slate-600">{d.staff_composition.new_staff_count}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Succession</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Plans: <span className="font-medium text-slate-600">{d.succession_profile.total_plans}</span></p>
                <p>Candidates: <span className="font-medium text-slate-600">{d.succession_profile.total_candidates}</span></p>
                {d.succession_profile.ready_now_count > 0 && (
                  <p>Ready now: <span className="font-medium text-green-600">{d.succession_profile.ready_now_count}</span></p>
                )}
                {d.vacancy_coverage.open_count > 0 && (
                  <p>Open vacancies: <span className="font-medium text-amber-600">{d.vacancy_coverage.open_count}</span></p>
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

        {/* Cara Workforce Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Workforce Intelligence
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
