"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH MONITORING INTELLIGENCE CARD
// Home-level: annual health assessments, immunisation coverage, dental
// registration, health passport currency, LA sign-off compliance.
// CHR 2015 Reg 10/15. SCCIF: "Health & Wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Stethoscope,
  Syringe, SmilePlus, FileHeart, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeHealthMonitoringIntelligence } from "@/hooks/use-home-health-monitoring-intelligence";
import type { HomeHealthMonitoringRating } from "@/lib/engines/home-health-monitoring-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<HomeHealthMonitoringRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeHealthMonitoringIntelligenceCard() {
  const { data, isLoading } = useHomeHealthMonitoringIntelligence();

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

  const ratingStyle = RATING_STYLES[d.health_monitoring_rating] ?? RATING_STYLES.insufficient_data;
  const hasGaps = d.assessment.children_assessed < (d.assessment.recent_365d > 0 ? d.assessment.children_assessed + 1 : 1);
  const hasOverdueDental = d.dental.overdue_checkups > 0;
  const hasMissedImmun = d.immunisation.missed_total > 0;
  const isAlert = hasOverdueDental || hasMissedImmun || d.health_monitoring_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-emerald-500")} />
            <span className="text-slate-900">Health Monitoring</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.health_monitoring_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.health_monitoring_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.health_monitoring_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Assessments */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileHeart className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.assessment.recent_365d >= 3 ? "text-green-600" : d.assessment.recent_365d >= 1 ? "text-amber-600" : "text-red-600")}>
                  {d.assessment.recent_365d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">AHAs (12m)</p>
            </div>

            {/* Immunisation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Syringe className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.immunisation.catch_up_ratio === 100 ? "text-green-600" : d.immunisation.catch_up_ratio >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.immunisation.catch_up_ratio}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Immun Cover</p>
            </div>

            {/* Dental */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <SmilePlus className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.dental.registered_rate === 100 ? "text-green-600" : d.dental.registered_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.dental.registered_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Dental Reg</p>
            </div>

            {/* Passport Currency */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.passport.currency_rate === 100 ? "text-green-600" : d.passport.currency_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.passport.currency_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Passport</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.health_monitoring_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Assessment Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Assessments</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Completion: <span className={cn("font-medium", d.assessment.completion_rate === 100 ? "text-green-600" : d.assessment.completion_rate >= 80 ? "text-amber-600" : "text-red-600")}>{d.assessment.completion_rate}%</span></p>
                <p>LA sign-off: <span className={cn("font-medium", d.assessment.la_sign_off_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.assessment.la_sign_off_rate}%</span></p>
                <p>Optical: <span className={cn("font-medium", d.assessment.optical_up_to_date_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.assessment.optical_up_to_date_rate}%</span></p>
                {d.assessment.avg_recommendations > 0 && <p>Avg recs: <span className="font-medium text-slate-600">{d.assessment.avg_recommendations}</span></p>}
              </div>
            </div>

            {/* Dental & Immunisation */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Dental & Immun</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>GP registered: <span className={cn("font-medium", d.immunisation.gp_registered_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.immunisation.gp_registered_rate}%</span></p>
                {d.immunisation.missed_total > 0 && <p>Missed immun: <span className="font-medium text-red-600">{d.immunisation.missed_total}</span></p>}
                {d.dental.overdue_checkups > 0 && <p>Overdue dental: <span className="font-medium text-red-600">{d.dental.overdue_checkups}</span></p>}
                {d.dental.anxiety_count > 0 && <p>Dental anxiety: <span className="font-medium text-amber-600">{d.dental.anxiety_count}</span></p>}
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

        {/* ARIA Health Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Health Monitoring Intelligence
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
