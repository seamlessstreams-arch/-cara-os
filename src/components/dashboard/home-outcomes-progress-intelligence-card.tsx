"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME OUTCOMES PROGRESS INTELLIGENCE CARD
// Home-level: therapeutic outcome targets — domain coverage, rating progress,
// direction trends, review timeliness, young person voice, child equity.
// CHR 2015 Reg 6, Reg 44, Reg 45. SCCIF: "Impact on children's lives".
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { HomeOutcomesProgressResult, OutcomesRating } from "@/lib/engines/home-outcomes-progress-intelligence-engine";

interface HomeOutcomesProgressResponse {
  data: HomeOutcomesProgressResult;
}

function useHomeOutcomesProgressIntelligence() {
  return useQuery<HomeOutcomesProgressResponse>({
    queryKey: ["home-outcomes-progress-intelligence"],
    queryFn: async () => {
      const res = await fetch("/api/v1/home-outcomes-progress-intelligence");
      if (!res.ok) throw new Error("Failed to fetch home outcomes progress intelligence");
      return res.json();
    },
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<OutcomesRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:       { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:              { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:          { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:        { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  insufficient_data: { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO DATA" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const REC_STYLES: Record<string, string> = {
  immediate: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  soon: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  planned: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function HomeOutcomesProgressIntelligenceCard() {
  const { data, isLoading } = useHomeOutcomesProgressIntelligence();

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
  const __emptyState = d.outcomes_rating === "inadequate" && (d.outcomes_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      outcomes_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.outcomes_rating] ?? RATING_STYLES.insufficient_data;
  const hasDeclining = d.progress_profile.declining_count > 0;
  const hasUncoveredChildren = d.equity_profile.children_without_targets > 0;
  const isAlert = hasDeclining || hasUncoveredChildren || d.outcomes_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-emerald-500")} />
            <span className="text-slate-900">Outcomes Progress</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.outcomes_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.outcomes_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.outcomes_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.outcomes_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Improving */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.progress_profile.improving_rate ?? 0) >= 60 ? "text-[--cs-success]" :
                  (d.progress_profile.improving_rate ?? 0) >= 40 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.progress_profile.improving_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Improving</p>
            </div>

            {/* Declining */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.progress_profile.declining_count === 0 ? "text-[--cs-success]" :
                  (d.progress_profile.declining_rate ?? 0) <= 10 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.progress_profile.declining_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Declining</p>
            </div>

            {/* Domains */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Minus className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.domain_profile.total_domains_covered >= 6 ? "text-[--cs-success]" :
                  d.domain_profile.total_domains_covered >= 4 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.domain_profile.total_domains_covered}/8
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Domains</p>
            </div>

            {/* YP Voice */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  (d.equity_profile.yp_voice_rate ?? 0) >= 80 ? "text-[--cs-success]" :
                  (d.equity_profile.yp_voice_rate ?? 0) >= 60 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>
                  {d.equity_profile.yp_voice_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">YP Voice</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.outcomes_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Progress</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg rating: <span className="font-medium text-slate-600">{d.progress_profile.avg_current_rating}/5</span></p>
                <p>Avg progress: <span className={cn("font-medium",
                  d.progress_profile.avg_progress >= 1 ? "text-[--cs-success]" :
                  d.progress_profile.avg_progress > 0 ? "text-[--cs-warning]" : "text-[--cs-risk]"
                )}>+{d.progress_profile.avg_progress}</span></p>
                <p>On target: <span className="font-medium text-slate-600">{d.progress_profile.on_target_count}</span></p>
                <p>Achieved: <span className={cn("font-medium",
                  d.progress_profile.achieved_count > 0 ? "text-[--cs-success]" : "text-slate-600"
                )}>{d.progress_profile.achieved_count}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Reviews & Equity</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Reviews (90d): <span className="font-medium text-slate-600">{d.review_profile.reviews_in_window}</span></p>
                <p>Overdue: <span className={cn("font-medium",
                  d.review_profile.overdue_targets > 0 ? "text-[--cs-risk]" : "text-[--cs-success]"
                )}>{d.review_profile.overdue_targets}</span></p>
                <p>Children covered: <span className={cn("font-medium",
                  (d.equity_profile.coverage_rate ?? 0) >= 100 ? "text-[--cs-success]" : "text-[--cs-warning]"
                )}>{d.equity_profile.children_with_targets}/{d.equity_profile.children_with_targets + d.equity_profile.children_without_targets}</span></p>
                <p>Avg per child: <span className="font-medium text-slate-600">{d.equity_profile.avg_targets_per_child}</span></p>
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
              <div key={i} className="rounded border border-[--cs-success-soft] bg-[--cs-success-bg] p-2.5 text-xs text-[--cs-success] leading-relaxed">
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
              <div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk] leading-relaxed">
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

        {/* Cara Outcomes Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Outcomes Intelligence
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
