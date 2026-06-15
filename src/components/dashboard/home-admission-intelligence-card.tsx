"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME ADMISSION & PLACEMENT INTELLIGENCE CARD
// Home-level: impact assessment compliance, matching quality, decision
// timeliness, referral volume, and alignment with Statement of Purpose.
// CHR 2015 Reg 14. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ClipboardCheck,
  FileCheck, Clock, Users, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeAdmissionIntelligence } from "@/hooks/use-home-admission-intelligence";
import type { AdmissionRating } from "@/lib/engines/home-admission-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<AdmissionRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeAdmissionIntelligenceCard() {
  const { data, isLoading } = useHomeAdmissionIntelligence();

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
  const __emptyState = d.admission_rating === "inadequate" && (d.admission_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      admission_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.admission_rating] ?? RATING_STYLES.insufficient_data;
  const hasPending = d.assessment_profile.pending_over_14_days > 0;
  const lowImpact = d.assessment_profile.impact_assessment_rate < 60 && d.referral_profile.total_referrals > 0;
  const isAlert = lowImpact || d.admission_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">Admissions & Placement</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.admission_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.admission_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.admission_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.admission_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Impact Assessment Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.assessment_profile.impact_assessment_rate >= 80 ? "text-green-600" :
                  d.assessment_profile.impact_assessment_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.assessment_profile.impact_assessment_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Impact</p>
            </div>

            {/* Matching Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.assessment_profile.matching_consideration_rate >= 80 ? "text-green-600" :
                  d.assessment_profile.matching_consideration_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.assessment_profile.matching_consideration_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Matching</p>
            </div>

            {/* Decision Speed */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.assessment_profile.avg_days_to_decision <= 14 ? "text-green-600" :
                  d.assessment_profile.avg_days_to_decision <= 21 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.assessment_profile.avg_days_to_decision}d
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Decision</p>
            </div>

            {/* Occupancy */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.quality_profile.occupancy_rate >= 80 ? "text-green-600" :
                  d.quality_profile.occupancy_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.quality_profile.occupancy_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Occupancy</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.admission_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Referrals</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.referral_profile.total_referrals}</span></p>
                <p>Active: <span className="font-medium text-slate-600">{d.referral_profile.active}</span></p>
                {d.referral_profile.placed > 0 && (
                  <p>Placed: <span className="font-medium text-green-600">{d.referral_profile.placed}</span></p>
                )}
                {d.referral_profile.declined > 0 && (
                  <p>Declined: <span className="font-medium text-slate-600">{d.referral_profile.declined}</span></p>
                )}
                {d.referral_profile.emergency_count > 0 && (
                  <p>Emergency: <span className="font-medium text-amber-600">{d.referral_profile.emergency_count}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Assessment</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Decision docs: <span className={cn("font-medium", d.assessment_profile.decision_documented_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.assessment_profile.decision_documented_rate}%</span></p>
                {hasPending && (
                  <p>Pending &gt;14d: <span className="font-medium text-red-600">{d.assessment_profile.pending_over_14_days}</span></p>
                )}
                <p>Acceptance: <span className="font-medium text-slate-600">{d.referral_profile.acceptance_rate}%</span></p>
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

        {/* Cara Admission Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Admission Intelligence
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
