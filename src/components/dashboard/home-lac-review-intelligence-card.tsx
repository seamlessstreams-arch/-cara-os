"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME LAC REVIEW INTELLIGENCE CARD
// Home-level: LAC review compliance, child participation, action tracking,
// placement stability, care plan updates.
// CHR 2015 Reg 36. SCCIF: "Experiences and progress", "Overall experiences."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ClipboardList,
  Users, CheckCheck, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeLACReviewIntelligence } from "@/hooks/use-home-lac-review-intelligence";
import type { LACReviewRating } from "@/lib/engines/home-lac-review-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<LACReviewRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeLACReviewIntelligenceCard() {
  const { data, isLoading } = useHomeLACReviewIntelligence();

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
  const __emptyState = d.lac_review_rating === "inadequate" && (d.lac_review_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      lac_review_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.lac_review_rating] ?? RATING_STYLES.insufficient_data;
  const hasOverdue = d.compliance.overdue_reviews.length > 0;
  const hasUnstable = d.stability.unstable_count > 0;
  const hasNoParticipation = d.participation.no_participation_count > 0;
  const isAlert = hasOverdue || hasUnstable || hasNoParticipation || d.lac_review_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-indigo-500")} />
            <span className="text-slate-900">LAC Reviews</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.lac_review_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.lac_review_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.lac_review_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.lac_review_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Reviews */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.compliance.total_reviews_180d > 0 ? "text-green-600" : "text-red-600")}>
                  {d.compliance.total_reviews_180d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Reviews (180d)</p>
            </div>

            {/* Participation */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.participation.attended_rate === 100 ? "text-green-600" : d.participation.attended_rate >= 80 ? "text-amber-600" : "text-red-600")}>
                  {d.participation.attended_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Participation</p>
            </div>

            {/* Actions */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.actions.completion_rate >= 80 ? "text-green-600" : d.actions.completion_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.actions.completion_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Actions Done</p>
            </div>

            {/* Stability */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.stability.stability_rate === 100 ? "text-green-600" : d.stability.unstable_count > 0 ? "text-red-600" : "text-amber-600")}>
                  {d.stability.stability_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Stable</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.lac_review_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Compliance Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Per child: <span className="font-medium text-slate-600">{d.compliance.reviews_per_child}</span></p>
                <p>Care plan rate: <span className={cn("font-medium", d.compliance.care_plan_update_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.compliance.care_plan_update_rate}%</span></p>
                {d.compliance.overdue_reviews.length > 0 && <p>Overdue: <span className="font-medium text-red-600">{d.compliance.overdue_reviews.length}</span></p>}
                {d.compliance.children_without_reviews.length > 0 && <p>No reviews: <span className="font-medium text-red-600">{d.compliance.children_without_reviews.length} children</span></p>}
              </div>
            </div>

            {/* Participation & Actions */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Participation & Actions</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Views documented: <span className={cn("font-medium", d.participation.views_rate === 100 ? "text-green-600" : "text-amber-600")}>{d.participation.views_rate}%</span></p>
                {d.participation.no_participation_count > 0 && <p>No participation: <span className="font-medium text-red-600">{d.participation.no_participation_count}</span></p>}
                <p>Actions: <span className="font-medium text-slate-600">{d.actions.completed_actions}/{d.actions.total_actions}</span></p>
                {d.actions.overdue_actions > 0 && <p>Overdue actions: <span className="font-medium text-red-600">{d.actions.overdue_actions}</span></p>}
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

        {/* Cara LAC Review Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara LAC Review Intelligence
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
