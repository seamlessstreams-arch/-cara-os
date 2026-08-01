"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD RESTRICTIVE PRACTICE INTELLIGENCE CARD
// Per-child: restraint analysis — frequency, duration, compliance,
// patterns, injuries, debrief rates.
// CHR 2015 Reg 19, 20, 35. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, HandMetal, Clock, ShieldAlert,
  TrendingUp, TrendingDown, Minus, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { ChildRestrictivePracticeResult, RestrictivePracticeRating } from "@/lib/engines/child-restrictive-practice-intelligence-engine";

interface ChildRestrictivePracticeResponse {
  data: ChildRestrictivePracticeResult;
}

function useChildRestrictivePracticeIntelligence(childId: string) {
  return useQuery<ChildRestrictivePracticeResponse>({
    queryKey: ["child-restrictive-practice-intelligence", childId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/child-restrictive-practice-intelligence?childId=${childId}`);
      if (!res.ok) throw new Error("Failed to fetch child restrictive practice intelligence");
      return res.json();
    },
    enabled: !!childId,
    refetchInterval: 60_000,
  });
}

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<RestrictivePracticeRating, { bg: string; text: string; border: string; label: string }> = {
  outstanding:      { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "OUTSTANDING" },
  good:             { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "GOOD" },
  adequate:         { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "ADEQUATE" },
  inadequate:       { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "INADEQUATE" },
  no_restraints:    { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "NONE" },
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

const TREND_ICON = {
  increasing: TrendingUp,
  stable: Minus,
  decreasing: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  increasing: "text-red-600",
  stable: "text-slate-500",
  decreasing: "text-green-600",
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildRestrictivePracticeIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildRestrictivePracticeIntelligence(childId);

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

  const ratingStyle = RATING_STYLES[d.restrictive_practice_rating] ?? RATING_STYLES.no_restraints;
  const FreqTrendIcon = TREND_ICON[d.frequency.frequency_trend];
  const hasInjuries = d.patterns.child_injury_count > 0;
  const highFrequency = d.frequency.restraints_30d >= 3;

  return (
    <Card className={cn("overflow-hidden", hasInjuries ? "border-red-400 border-2" : highFrequency ? "border-amber-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", hasInjuries ? "bg-red-50" : highFrequency ? "bg-amber-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HandMetal className={cn("h-4 w-4", hasInjuries ? "text-red-600" : "text-rose-500")} />
            <span className="text-slate-900">Restrictive Practice</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.restrictive_practice_rating !== "no_restraints" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.restrictive_practice_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* KPI Row */}
        {d.frequency.total_restraints > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.frequency.restraints_30d === 0 ? "text-green-600" : d.frequency.restraints_30d <= 2 ? "text-amber-600" : "text-red-600")}>
                  {d.frequency.restraints_30d}
                </p>
                {d.frequency.frequency_trend !== "insufficient_data" && (
                  <FreqTrendIcon className={cn("h-3 w-3", TREND_COLOR[d.frequency.frequency_trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Episodes (30d)</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.duration.avg_duration_minutes !== null && d.duration.avg_duration_minutes <= 5 ? "text-green-600" : "text-amber-600")}>
                  {d.duration.avg_duration_minutes ?? "—"}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg mins</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", (d.compliance.child_debrief_rate ?? 0) >= 90 ? "text-green-600" : (d.compliance.child_debrief_rate ?? 0) >= 70 ? "text-amber-600" : "text-red-600")}>
                  {d.compliance.child_debrief_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Debriefed</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <p className={cn("text-lg font-bold tabular-nums", d.patterns.child_injury_count === 0 ? "text-green-600" : "text-red-600")}>
                {d.patterns.child_injury_count}
              </p>
              <p className="text-[10px] text-muted-foreground">Injuries</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.frequency.total_restraints > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Frequency</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>90d: <span className="font-medium text-slate-600">{d.frequency.restraints_90d} episode(s)</span></p>
                <p>Avg/month: <span className="font-medium text-slate-600">{d.frequency.avg_per_month_90d}</span></p>
                {d.frequency.days_since_last !== null && (
                  <p>Last: <span className="font-medium text-slate-600">{d.frequency.days_since_last}d ago</span></p>
                )}
                {d.duration.long_restraints_count > 0 && (
                  <p className="text-amber-600 font-medium">{d.duration.long_restraints_count} over 10 min</p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Body maps: <span className={(d.compliance.body_map_rate ?? 0) >= 90 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.compliance.body_map_rate}%</span></p>
                <p>Reviews done: <span className={(d.compliance.review_completion_rate ?? 0) >= 80 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.compliance.review_completion_rate}%</span></p>
                <p>De-escalation: <span className={(d.compliance.de_escalation_documented_rate ?? 0) >= 90 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.compliance.de_escalation_documented_rate}%</span></p>
                {d.compliance.pending_reviews > 0 && (
                  <p className="text-amber-600 font-medium">{d.compliance.pending_reviews} pending review(s)</p>
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
