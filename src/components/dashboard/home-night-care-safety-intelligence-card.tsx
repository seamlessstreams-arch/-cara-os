"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME NIGHT CARE & SAFETY INTELLIGENCE CARD
// Home-level: night checks, handovers, night anxiety support, bedtime routines,
// wake-up routines, sleep quality, child voice, review compliance.
// CHR 2015 Reg 12/25: Night care and safety.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Moon, ClipboardCheck, BedDouble,
  Sunrise, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeNightCareSafetyIntelligence } from "@/hooks/use-home-night-care-safety-intelligence";
import type { NightCareRating } from "@/lib/engines/home-night-care-safety-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<NightCareRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-600",  border: "border-slate-300",  label: "NO DATA" },
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

function scoreColor(score: number): string {
  if (score >= 65) return "text-green-600";
  if (score >= 45) return "text-amber-600";
  return "text-red-600";
}

// ── Component ───────────────────────────────────────────────────────────────

export function HomeNightCareSafetyIntelligenceCard() {
  const { data, isLoading } = useHomeNightCareSafetyIntelligence();

  if (isLoading) {
    return (
      <Card className="col-span-full overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const ratingStyle = RATING_STYLES[d.night_care_rating] ?? RATING_STYLES.insufficient_data;

  return (
    <Card className="col-span-full overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-indigo-600" />
            <span className="text-slate-900">Night Care & Safety</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            <span className="text-xs font-bold tabular-nums text-slate-600">{d.night_care_score}%</span>
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Night Check KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-indigo-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.night_checks.total_checks_30d >= 50 ? "text-green-600" : d.night_checks.total_checks_30d >= 20 ? "text-amber-600" : "text-red-600")}>
              {d.night_checks.total_checks_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">Checks (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.night_checks.checks_per_child >= 20 ? "text-green-600" : d.night_checks.checks_per_child >= 10 ? "text-amber-600" : "text-red-600")}>
              {d.night_checks.checks_per_child}
            </p>
            <p className="text-[10px] text-muted-foreground">Per Child</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <div className="flex items-center justify-center gap-1">
              <Shield className={cn("h-3.5 w-3.5", d.night_checks.room_temp_ok_rate >= 90 ? "text-green-500" : "text-amber-500")} />
              <p className={cn("text-lg font-bold tabular-nums", scoreColor(d.night_checks.room_temp_ok_rate))}>
                {d.night_checks.room_temp_ok_rate}%
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground">Temp OK</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className={cn("text-lg font-bold tabular-nums", d.handovers.completion_rate >= 90 ? "text-green-600" : d.handovers.completion_rate >= 70 ? "text-amber-600" : "text-red-600")}>
              {d.handovers.completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Handover</p>
          </div>
        </div>

        {/* Routine Coverage */}
        {(d.bedtime_routines.total_routines > 0 || d.wake_up_routines.total_routines > 0) && (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-indigo-200 bg-indigo-50 p-2 text-xs">
              <p className="font-medium text-indigo-700 flex items-center gap-1 mb-1">
                <BedDouble className="h-3 w-3" />
                Bedtime Routines
              </p>
              <div className="space-y-0.5 text-[10px] text-indigo-800">
                <p>Coverage: <span className="font-bold">{d.bedtime_routines.child_coverage}%</span></p>
                <p>Effectiveness: <span className="font-bold">{d.bedtime_routines.avg_effectiveness}/5</span></p>
                <p>Child Agreed: <span className="font-bold">{d.bedtime_routines.child_agreed_rate}%</span></p>
              </div>
            </div>
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs">
              <p className="font-medium text-amber-700 flex items-center gap-1 mb-1">
                <Sunrise className="h-3 w-3" />
                Wake-Up Routines
              </p>
              <div className="space-y-0.5 text-[10px] text-amber-800">
                <p>Coverage: <span className="font-bold">{d.wake_up_routines.child_coverage}%</span></p>
                <p>Effectiveness: <span className="font-bold">{d.wake_up_routines.avg_effectiveness}/5</span></p>
                <p>Child Agreed: <span className="font-bold">{d.wake_up_routines.child_agreed_rate}%</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Review Compliance */}
        {d.review_compliance.total_overdue > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-2 text-xs">
            <p className="font-medium text-red-700 flex items-center gap-1 mb-1">
              <ClipboardCheck className="h-3 w-3" />
              Overdue Reviews ({d.review_compliance.total_overdue})
            </p>
            <div className="flex flex-wrap gap-2 text-[10px] text-red-800">
              {d.review_compliance.anxiety_overdue > 0 && <span>Anxiety: {d.review_compliance.anxiety_overdue}</span>}
              {d.review_compliance.bedtime_overdue > 0 && <span>Bedtime: {d.review_compliance.bedtime_overdue}</span>}
              {d.review_compliance.wakeup_overdue > 0 && <span>Wake-Up: {d.review_compliance.wakeup_overdue}</span>}
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

        {/* ARIA Night Care Insights */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-indigo-700">
              <Brain className="h-3 w-3" />
              ARIA Night Care Intelligence
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
