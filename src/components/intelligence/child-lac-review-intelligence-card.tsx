"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD LAC REVIEW INTELLIGENCE CARD
// Per-child: LAC review compliance, participation, action completion,
// care plan updates, IRO consistency, timeliness.
// CHR 2015 Reg 45, Reg 5. IRO Handbook. SCCIF: "Impact of leaders."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, ClipboardCheck, CheckCircle2, XCircle,
  Clock, UserCheck, FileCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildLACReviewIntelligence } from "@/hooks/use-child-lac-review-intelligence";
import type { ReviewComplianceRating } from "@/lib/engines/child-lac-review-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<ReviewComplianceRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:         { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:     { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:   { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_reviews:   { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO REVIEWS" },
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

export function ChildLACReviewIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildLACReviewIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.compliance_rating] ?? RATING_STYLES.no_reviews;
  const isOverdue = d.timeliness.is_overdue;

  return (
    <Card className={cn("overflow-hidden", isOverdue ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isOverdue ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className={cn("h-4 w-4", isOverdue ? "text-red-600" : "text-teal-500")} />
            <span className="text-slate-900">LAC Reviews</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.compliance_rating !== "no_reviews" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.compliance_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Overdue Alert */}
        {isOverdue && d.timeliness.days_until_next !== null && (
          <div className="rounded border-2 border-red-400 bg-red-100 p-3 text-xs text-red-900 font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            LAC REVIEW OVERDUE by {Math.abs(d.timeliness.days_until_next)} days — Contact IRO immediately
          </div>
        )}

        {/* KPI Row */}
        {d.iro.total_reviews > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", isOverdue ? "text-red-600" : d.timeliness.days_until_next !== null && d.timeliness.days_until_next <= 30 ? "text-amber-600" : "text-green-600")}>
                  {d.timeliness.days_until_next !== null ? (d.timeliness.days_until_next >= 0 ? `${d.timeliness.days_until_next}d` : `−${Math.abs(d.timeliness.days_until_next)}d`) : "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">{isOverdue ? "Overdue" : "Next Review"}</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UserCheck className={cn("h-3.5 w-3.5", d.participation.attended_rate >= 80 ? "text-green-500" : d.participation.attended_rate >= 50 ? "text-amber-500" : "text-red-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.participation.attended_rate >= 80 ? "text-green-600" : d.participation.attended_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.participation.attended_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Attended</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className={cn("h-3.5 w-3.5", d.action_completion.completion_rate >= 80 ? "text-green-500" : d.action_completion.completion_rate >= 50 ? "text-amber-500" : "text-red-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.action_completion.completion_rate >= 80 ? "text-green-600" : d.action_completion.completion_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.action_completion.completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Actions Done</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileCheck className={cn("h-3.5 w-3.5", d.care_plan_update_rate === 100 ? "text-green-500" : "text-amber-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.care_plan_update_rate === 100 ? "text-green-600" : "text-amber-600")}>
                  {d.care_plan_update_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Care Plan</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.iro.total_reviews > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Participation</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Attended: <span className="font-medium text-slate-600">{d.participation.attended_rate}%</span></p>
                <p>Views submitted: <span className="font-medium text-slate-600">{d.participation.views_submitted_rate}%</span></p>
                {d.participation.advocate_rate > 0 && (
                  <p>Advocate: <span className="font-medium text-slate-600">{d.participation.advocate_rate}%</span></p>
                )}
                <p>Views recorded: <span className={d.participation.views_recorded_rate === 100 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.participation.views_recorded_rate}%</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Review Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total reviews: <span className="font-medium text-slate-600">{d.iro.total_reviews}</span></p>
                <p>On-time rate: <span className={d.timeliness.reviews_on_time_rate === 100 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.timeliness.reviews_on_time_rate}%</span></p>
                <p>IRO: <span className={d.iro.iro_consistency ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.iro.iro_names.join(", ")}</span></p>
                <p>Stability: <span className={cn("font-medium capitalize", d.placement_stability_current === "stable" ? "text-green-600" : d.placement_stability_current === "at_risk" ? "text-red-600" : "text-amber-600")}>{d.placement_stability_current.replace(/_/g, " ")}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Overdue Actions */}
        {d.action_completion.overdue_count > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              Overdue Actions ({d.action_completion.overdue_count})
            </p>
            {d.action_completion.overdue_actions.slice(0, 3).map((a, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 leading-relaxed">
                {a}
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

        {/* ARIA LAC Review Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA LAC Review Intelligence
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
