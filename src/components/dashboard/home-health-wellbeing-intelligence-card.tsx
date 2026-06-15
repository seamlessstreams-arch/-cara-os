"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME HEALTH & WELLBEING INTELLIGENCE CARD
// Home-level: health records, medication compliance, dental/optical/MH coverage,
// follow-up compliance, outcome documentation.
// CHR 2015 Reg 10. SCCIF: "Health", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, HeartPulse,
  Pill, Eye, Stethoscope, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeHealthWellbeingIntelligence } from "@/hooks/use-home-health-wellbeing-intelligence";
import type { HealthWellbeingRating } from "@/lib/engines/home-health-wellbeing-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<HealthWellbeingRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeHealthWellbeingIntelligenceCard() {
  const { data, isLoading } = useHomeHealthWellbeingIntelligence();

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
  const __emptyState = d.health_rating === "inadequate" && (d.health_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      health_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.health_rating] ?? RATING_STYLES.insufficient_data;
  const hasOverdue = d.records.overdue_follow_ups > 0;
  const hasMissedMeds = d.medication.missed_count > 0;
  const hasChildrenWithout = d.records.children_without_records.length > 0;
  const isAlert = hasOverdue || hasMissedMeds || hasChildrenWithout || d.health_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartPulse className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-rose-500")} />
            <span className="text-slate-900">Health & Wellbeing</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.health_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.health_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.health_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.health_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Records */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.records.total_records_180d >= 6 ? "text-green-600" : d.records.total_records_180d >= 3 ? "text-amber-600" : "text-red-600")}>
                  {d.records.total_records_180d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Records (180d)</p>
            </div>

            {/* Follow-up */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.records.follow_up_compliance_rate === 100 ? "text-green-600" : d.records.follow_up_compliance_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.records.follow_up_compliance_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Follow-up</p>
            </div>

            {/* Medication */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Pill className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.medication.administered_rate === 100 ? "text-green-600" : d.medication.administered_rate >= 90 ? "text-amber-600" : "text-red-600")}>
                  {d.medication.administered_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Med Admin</p>
            </div>

            {/* Outcome Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Eye className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.records.outcome_rate >= 80 ? "text-green-600" : d.records.outcome_rate >= 60 ? "text-amber-600" : "text-red-600")}>
                  {d.records.outcome_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Outcomes</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.health_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Records Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Records & Coverage</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Per child: <span className="font-medium text-slate-600">{d.records.records_per_child}</span></p>
                <p>Health assessments: <span className={cn("font-medium", d.records.health_assessments_count > 0 ? "text-green-600" : "text-red-600")}>{d.records.health_assessments_count}</span></p>
                {d.records.mental_health_count > 0 && <p>Mental health: <span className="font-medium text-purple-600">{d.records.mental_health_count}</span></p>}
                {d.records.referrals_active > 0 && <p>Active referrals: <span className="font-medium text-amber-600">{d.records.referrals_active}</span></p>}
                {d.records.overdue_follow_ups > 0 && <p>Overdue: <span className="font-medium text-red-600">{d.records.overdue_follow_ups}</span></p>}
              </div>
            </div>

            {/* Coverage & Medication */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Coverage & Meds</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Dental: <span className={cn("font-medium", d.coverage.dental_coverage ? "text-green-600" : "text-red-600")}>{d.coverage.dental_coverage ? "✓" : "✗"}</span></p>
                <p>Optical: <span className={cn("font-medium", d.coverage.optical_coverage ? "text-green-600" : "text-red-600")}>{d.coverage.optical_coverage ? "✓" : "✗"}</span></p>
                <p>MH monitored: <span className={cn("font-medium", d.coverage.mental_health_monitored ? "text-green-600" : "text-slate-400")}>{d.coverage.mental_health_monitored ? "✓" : "—"}</span></p>
                {d.medication.active_medications > 0 && <p>Active meds: <span className="font-medium text-slate-600">{d.medication.active_medications}</span></p>}
                {d.medication.missed_count > 0 && <p>Missed doses: <span className="font-medium text-red-600">{d.medication.missed_count}</span></p>}
                {d.medication.refused_count > 0 && <p>Refused: <span className="font-medium text-amber-600">{d.medication.refused_count}</span></p>}
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

        {/* Cara Health Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Health Intelligence
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
