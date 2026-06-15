"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MENTAL HEALTH INTELLIGENCE CARD
// Mental health check-ins, therapy, safety plans, therapeutic referrals.
// CHR 2015 Reg 7/10: "Welfare — promote physical/mental health."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, HeartPulse,
  SmilePlus, ShieldCheck, CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeMentalHealthIntelligence } from "@/hooks/use-home-mental-health-intelligence";
import type { MentalHealthRating } from "@/lib/engines/home-mental-health-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<MentalHealthRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-red-200 bg-red-50 text-red-800",
  soon: "border-amber-200 bg-amber-50 text-amber-800",
  planned: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeMentalHealthIntelligenceCard() {
  const { data, isLoading } = useHomeMentalHealthIntelligence();

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
  const __emptyState = d.mental_health_rating === "inadequate" && (d.mental_health_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      mental_health_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.mental_health_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.mental_health_rating === "inadequate" || d.safety_plans.recent_incident_plans >= 2;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartPulse className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-pink-500")} />
            <span className="text-slate-900">Mental Health</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.mental_health_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.mental_health_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.mental_health_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.mental_health_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Check-In Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <SmilePlus className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.check_ins.check_in_coverage_rate >= 100 ? "text-green-600" :
                  d.check_ins.check_in_coverage_rate >= 75 ? "text-blue-600" : "text-red-600"
                )}>
                  {d.check_ins.check_in_coverage_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Coverage</p>
            </div>

            {/* Avg Mood */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <HeartPulse className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.check_ins.avg_mood_rating >= 3.5 ? "text-green-600" :
                  d.check_ins.avg_mood_rating >= 2.5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.check_ins.avg_mood_rating || "—"}/5
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Mood</p>
            </div>

            {/* Safety Plans */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.safety_plans.active_plans === 0 ? "text-green-600" :
                  d.safety_plans.recent_incident_plans === 0 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.safety_plans.active_plans}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Safety Plans</p>
            </div>

            {/* Therapy */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.therapy.attendance_rate >= 90 ? "text-green-600" :
                  d.therapy.attendance_rate >= 75 ? "text-amber-600" :
                  d.therapy.total_sessions_90d === 0 ? "text-slate-600" : "text-red-600"
                )}>
                  {d.therapy.total_sessions_90d > 0 ? `${d.therapy.attendance_rate}%` : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Therapy</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.mental_health_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Check-Ins</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total (30d): <span className="font-medium text-slate-600">{d.check_ins.total_check_ins_30d}</span></p>
                <p>Low mood: <span className={cn("font-medium",
                  d.check_ins.low_mood_count === 0 ? "text-green-600" :
                  d.check_ins.low_mood_count <= 3 ? "text-amber-600" : "text-red-600"
                )}>{d.check_ins.low_mood_count}</span></p>
                <p>Flagged: <span className="font-medium text-slate-600">{d.check_ins.flagged_check_ins}</span></p>
                <p>Follow-up: <span className={cn("font-medium",
                  d.check_ins.follow_up_rate >= 100 ? "text-green-600" : "text-amber-600"
                )}>{d.check_ins.follow_up_rate}%</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Support</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>In therapy: <span className="font-medium text-slate-600">{d.therapy.children_in_therapy}</span></p>
                <p>Pending ref: <span className={cn("font-medium",
                  d.referrals.pending_referrals === 0 ? "text-green-600" : "text-amber-600"
                )}>{d.referrals.pending_referrals}</span></p>
                <p>Overdue plans: <span className={cn("font-medium",
                  d.safety_plans.overdue_reviews === 0 ? "text-green-600" : "text-red-600"
                )}>{d.safety_plans.overdue_reviews}</span></p>
                <p>Mood trend: <span className={cn("font-medium",
                  d.therapy.avg_mood_improvement > 0 ? "text-green-600" :
                  d.therapy.avg_mood_improvement === 0 ? "text-slate-600" : "text-red-600"
                )}>{d.therapy.avg_mood_improvement > 0 ? "+" : ""}{d.therapy.avg_mood_improvement || "—"}</span></p>
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

        {/* Cara Mental Health Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Mental Health Intelligence
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
