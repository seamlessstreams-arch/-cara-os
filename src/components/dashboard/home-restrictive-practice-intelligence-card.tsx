"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RESTRICTIVE PRACTICE INTELLIGENCE CARD
// Home-level: restraint frequency, proportionality, de-escalation quality,
// debrief completion, review compliance, and staff training.
// CHR 2015 Reg 19, 20. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ShieldBan,
  Clock, CheckCheck, UserCheck, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeRestrictivePracticeIntelligence } from "@/hooks/use-home-restrictive-practice-intelligence";
import type { RestrictivePracticeRating } from "@/lib/engines/home-restrictive-practice-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<RestrictivePracticeRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeRestrictivePracticeIntelligenceCard() {
  const { data, isLoading } = useHomeRestrictivePracticeIntelligence();

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
  const __emptyState = d.restrictive_rating === "inadequate" && (d.restrictive_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      restrictive_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.restrictive_rating] ?? RATING_STYLES.insufficient_data;
  const hasPending = d.restraint_profile.pending_reviews > 0;
  const hasInjuries = d.restraint_profile.injury_count > 0;
  const hasRepeat = d.restraint_profile.repeat_children.length > 0;
  const isAlert = hasPending || hasInjuries || d.restrictive_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldBan className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Restrictive Practice</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.restrictive_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.restrictive_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.restrictive_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.restraint_profile.total_restraints_90d > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Restraints */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Activity className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restraint_profile.total_restraints_90d <= 2 ? "text-green-600" :
                  d.restraint_profile.total_restraints_90d <= 5 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.restraint_profile.total_restraints_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Restraints (90d)</p>
            </div>

            {/* De-escalation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restraint_profile.de_escalation_rate === 100 ? "text-green-600" :
                  d.restraint_profile.de_escalation_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.restraint_profile.de_escalation_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">De-escalation</p>
            </div>

            {/* Debriefs */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restraint_profile.child_debrief_rate === 100 ? "text-green-600" :
                  d.restraint_profile.child_debrief_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.restraint_profile.child_debrief_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Child Debrief</p>
            </div>

            {/* Training */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restraint_profile.training_compliance_rate === 100 ? "text-green-600" :
                  d.restraint_profile.training_compliance_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.restraint_profile.training_compliance_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Staff Trained</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.restraint_profile.total_restraints_90d > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Reviews: <span className={cn("font-medium", d.restraint_profile.review_completion_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.restraint_profile.review_completion_rate}%</span></p>
                <p>Body maps: <span className={cn("font-medium", d.restraint_profile.body_map_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.restraint_profile.body_map_rate}%</span></p>
                {hasPending && <p>Pending: <span className="font-medium text-red-600">{d.restraint_profile.pending_reviews}</span></p>}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Patterns</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg duration: <span className={cn("font-medium", d.restraint_profile.avg_duration <= 3 ? "text-green-600" : d.restraint_profile.avg_duration <= 10 ? "text-amber-600" : "text-red-600")}>{d.restraint_profile.avg_duration} min</span></p>
                {hasInjuries && <p>Injuries: <span className="font-medium text-red-600">{d.restraint_profile.injury_count}</span></p>}
                {hasRepeat && <p>Repeat children: <span className="font-medium text-amber-600">{d.restraint_profile.repeat_children.length}</span></p>}
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

        {/* Cara Restrictive Practice Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Restrictive Practice Intelligence
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
