"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME DELEGATED AUTHORITY INTELLIGENCE CARD
// Delegated authority completeness, review compliance, category coverage.
// CHR 2015 Reg 22: "Arrangements for the delegation of authority."
// SCCIF: "Staff understand what decisions they can make day to day."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, KeyRound,
  ShieldCheck, Users, ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeDelegatedAuthorityIntelligence } from "@/hooks/use-home-delegated-authority-intelligence";
import type { DelegatedAuthorityRating } from "@/lib/engines/home-delegated-authority-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<DelegatedAuthorityRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeDelegatedAuthorityIntelligenceCard() {
  const { data, isLoading } = useHomeDelegatedAuthorityIntelligence();

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
  const __emptyState = d.authority_rating === "inadequate" && (d.authority_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      authority_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.authority_rating] ?? RATING_STYLES.insufficient_data;
  const isAlert = d.authority_rating === "inadequate" || d.review_profile.reviews_overdue > 1;

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <KeyRound className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-amber-500")} />
            <span className="text-slate-900">Delegated Authority</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.authority_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.authority_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.authority_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.authority_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Granted Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.status_profile.granted_rate >= 70 ? "text-green-600" :
                  d.status_profile.granted_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.status_profile.granted_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Granted</p>
            </div>

            {/* Children Covered */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.child_coverage.coverage_rate >= 100 ? "text-green-600" :
                  d.child_coverage.coverage_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.child_coverage.children_with_authority}/{d.child_coverage.total_children}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Children</p>
            </div>

            {/* Categories */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.category_coverage.categories_addressed >= 10 ? "text-green-600" :
                  d.category_coverage.categories_addressed >= 7 ? "text-blue-600" : "text-amber-600"
                )}>
                  {d.category_coverage.categories_addressed}/{d.category_coverage.total_possible_categories}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Categories</p>
            </div>

            {/* Reviews */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.review_profile.reviews_overdue === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.review_profile.reviews_overdue}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Overdue</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.authority_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Status</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Granted: <span className="font-medium text-green-600">{d.status_profile.granted}</span></p>
                <p>Partial: <span className="font-medium text-amber-600">{d.status_profile.partial}</span></p>
                <p>Pending: <span className={cn("font-medium",
                  d.status_profile.pending === 0 ? "text-green-600" : "text-red-600"
                )}>{d.status_profile.pending}</span></p>
                <p>Not granted: <span className="font-medium text-slate-600">{d.status_profile.not_granted}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Reviews</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Due soon: <span className={cn("font-medium",
                  d.review_profile.reviews_due_soon === 0 ? "text-green-600" : "text-amber-600"
                )}>{d.review_profile.reviews_due_soon}</span></p>
                <p>Avg age: <span className="font-medium text-slate-600">{d.review_profile.avg_days_since_review}d</span></p>
                <p>Stale (90d+): <span className={cn("font-medium",
                  d.review_profile.last_reviewed_stale === 0 ? "text-green-600" : "text-red-600"
                )}>{d.review_profile.last_reviewed_stale}</span></p>
                <p>Total items: <span className="font-medium text-slate-600">{d.status_profile.total_items}</span></p>
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

        {/* Cara Authority Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Authority Intelligence
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
