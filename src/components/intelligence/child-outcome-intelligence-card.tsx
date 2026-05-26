"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD OUTCOME INTELLIGENCE CARD
// Per-child: outcome targets across 8 domains, progress tracking,
// review compliance, YP participation, barriers, strengths/concerns.
// CHR 2015 Reg 5, 6, 13. SCCIF: "Progress and outcomes."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, Target, TrendingUp, TrendingDown, Minus,
  Award, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildOutcomeIntelligence } from "@/hooks/use-child-outcome-intelligence";
import type { OutcomeProgressRating, DomainProfile } from "@/lib/engines/child-outcome-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<OutcomeProgressRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:   { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:          { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:      { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_targets:    { bg: "bg-slate-100",  text: "text-slate-800",  border: "border-slate-300",  label: "NO TARGETS" },
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

// ── Domain bar ──────────────────────────────────────────────────────────────

function DomainBar({ profile }: { profile: DomainProfile }) {
  const barWidth = Math.round((profile.avg_current_rating / 5) * 100);
  const baselineWidth = Math.round((profile.avg_baseline_rating / 5) * 100);
  const targetWidth = Math.round((profile.avg_target_rating / 5) * 100);

  const directionIcon = profile.has_declining
    ? <TrendingDown className="h-3 w-3 text-red-500" />
    : profile.improving_count > 0
    ? <TrendingUp className="h-3 w-3 text-green-500" />
    : <Minus className="h-3 w-3 text-slate-400" />;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between text-[10px]">
        <span className="font-medium text-slate-700 flex items-center gap-1">
          {directionIcon}
          {profile.domain_label}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {profile.avg_current_rating}/{profile.avg_target_rating}
        </span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        {/* Target marker */}
        <div
          className="absolute top-0 h-full border-r-2 border-slate-400 z-10"
          style={{ width: `${targetWidth}%` }}
        />
        {/* Baseline */}
        <div
          className="absolute top-0 h-full bg-slate-200 rounded-full"
          style={{ width: `${baselineWidth}%` }}
        />
        {/* Current progress */}
        <div
          className={cn(
            "absolute top-0 h-full rounded-full transition-all",
            profile.has_declining ? "bg-red-400" :
            profile.improving_count > 0 ? "bg-green-400" : "bg-amber-400",
          )}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function ChildOutcomeIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildOutcomeIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.progress_rating] ?? RATING_STYLES.no_targets;
  const hasDeclining = d.progress_summary.declining_count > 0;

  return (
    <Card className={cn("overflow-hidden", hasDeclining ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", hasDeclining ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className={cn("h-4 w-4", hasDeclining ? "text-red-600" : "text-emerald-500")} />
            <span className="text-slate-900">Outcome Progress</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.progress_rating !== "no_targets" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.progress_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.progress_summary.total_targets > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className={cn("h-3.5 w-3.5", d.progress_summary.improving_count > 0 ? "text-green-500" : "text-slate-400")} />
                <p className={cn("text-lg font-bold tabular-nums", d.progress_summary.improving_count > 0 ? "text-green-600" : "text-slate-500")}>
                  {d.progress_summary.improving_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Improving</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className={cn("h-3.5 w-3.5", d.progress_summary.declining_count > 0 ? "text-red-500" : "text-slate-400")} />
                <p className={cn("text-lg font-bold tabular-nums", d.progress_summary.declining_count > 0 ? "text-red-600" : "text-green-600")}>
                  {d.progress_summary.declining_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Declining</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Award className={cn("h-3.5 w-3.5", d.progress_summary.achieved_targets > 0 ? "text-green-500" : "text-slate-400")} />
                <p className={cn("text-lg font-bold tabular-nums", d.progress_summary.achieved_targets > 0 ? "text-green-600" : "text-slate-500")}>
                  {d.progress_summary.achieved_targets}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Achieved</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <BarChart3 className={cn("h-3.5 w-3.5", d.progress_summary.yp_voice_rate >= 80 ? "text-green-500" : d.progress_summary.yp_voice_rate >= 50 ? "text-amber-500" : "text-red-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.progress_summary.yp_voice_rate >= 80 ? "text-green-600" : d.progress_summary.yp_voice_rate >= 50 ? "text-amber-600" : "text-red-600")}>
                  {d.progress_summary.yp_voice_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">YP Voice</p>
            </div>
          </div>
        )}

        {/* Domain Progress Bars */}
        {d.domain_profiles.length > 0 && (
          <div className="rounded border p-2.5 space-y-2">
            <p className="text-xs font-medium text-slate-700 flex items-center gap-1">
              <Target className="h-3 w-3 text-emerald-500" />
              Domain Progress ({d.domain_profiles.length} domains)
            </p>
            {d.domain_profiles.map((dp) => (
              <DomainBar key={dp.domain} profile={dp} />
            ))}
            <div className="flex items-center gap-3 text-[9px] text-muted-foreground pt-1 border-t">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-200 inline-block" /> Baseline</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" /> Current</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1 border-r-2 border-slate-400 inline-block" /> Target</span>
            </div>
          </div>
        )}

        {/* Review Compliance Detail */}
        {d.review_compliance.total_reviews > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Review Activity</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total reviews: <span className="font-medium text-slate-600">{d.review_compliance.total_reviews}</span></p>
                <p>YP participated: <span className={d.review_compliance.yp_participation_rate === 100 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.review_compliance.yp_participation_rate}%</span></p>
                {d.review_compliance.overdue_reviews > 0 && (
                  <p className="text-red-600 font-medium">{d.review_compliance.overdue_reviews} reviews overdue</p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Progress Summary</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Avg progress: <span className={cn("font-medium", d.progress_summary.avg_progress > 0 ? "text-green-600" : d.progress_summary.avg_progress < 0 ? "text-red-600" : "text-slate-600")}>{d.progress_summary.avg_progress > 0 ? "+" : ""}{d.progress_summary.avg_progress}</span></p>
                <p>Active: <span className="font-medium text-slate-600">{d.progress_summary.active_targets}</span> / On hold: <span className="font-medium text-slate-600">{d.progress_summary.on_hold_targets}</span></p>
                {d.review_compliance.reviews_with_barriers > 0 && (
                  <p>Barriers identified: <span className="font-medium text-amber-600">{d.review_compliance.reviews_with_barriers}</span></p>
                )}
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

        {/* ARIA Outcome Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Outcome Intelligence
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
