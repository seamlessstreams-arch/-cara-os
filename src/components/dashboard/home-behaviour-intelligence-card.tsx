"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BEHAVIOUR MANAGEMENT INTELLIGENCE CARD
// Home-level: behaviour management quality, positive reinforcement,
// restorative approaches, ABC documentation, and proportionality.
// CHR 2015 Reg 19, 20. SCCIF: "Effective", "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, HeartHandshake,
  ThumbsUp, Scale, BookOpen, Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeBehaviourIntelligence } from "@/hooks/use-home-behaviour-intelligence";
import type { BehaviourRating } from "@/lib/engines/home-behaviour-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<BehaviourRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeBehaviourIntelligenceCard() {
  const { data, isLoading } = useHomeBehaviourIntelligence();

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
  const __emptyState = d.behaviour_rating === "inadequate" && (d.behaviour_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      behaviour_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.behaviour_rating] ?? RATING_STYLES.insufficient_data;
  const hasRepeat = d.behaviour_profile.repeat_concern_children.length > 0;
  const hasHighCritical = d.behaviour_profile.high_critical_count > 3;
  const isAlert = hasHighCritical || hasRepeat || d.behaviour_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-rose-500")} />
            <span className="text-slate-900">Behaviour Management</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.behaviour_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.behaviour_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.behaviour_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.behaviour_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Positive Ratio */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.behaviour_profile.positive_ratio >= 60 ? "text-green-600" :
                  d.behaviour_profile.positive_ratio >= 40 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.behaviour_profile.positive_ratio}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Positive</p>
            </div>

            {/* Reward Ratio */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.reinforcement_profile.reward_ratio >= 60 ? "text-green-600" :
                  d.reinforcement_profile.reward_ratio >= 40 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.reinforcement_profile.reward_ratio}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Rewards</p>
            </div>

            {/* Proportionality */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Scale className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.reinforcement_profile.proportionality_rate === 100 ? "text-green-600" :
                  d.reinforcement_profile.proportionality_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.reinforcement_profile.proportionality_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Proportionate</p>
            </div>

            {/* Repair Rate */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Repeat className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.restorative_profile.relationship_repair_rate >= 80 ? "text-green-600" :
                  d.restorative_profile.relationship_repair_rate >= 60 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.restorative_profile.relationship_repair_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Repair</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.behaviour_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Behaviour</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Logs: <span className="font-medium text-slate-600">{d.behaviour_profile.total_logs_90d}</span> (90d)</p>
                <p>ABC docs: <span className={cn("font-medium", d.behaviour_profile.abc_documentation_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.behaviour_profile.abc_documentation_rate}%</span></p>
                {d.behaviour_profile.high_critical_count > 0 && (
                  <p>High/critical: <span className="font-medium text-red-600">{d.behaviour_profile.high_critical_count}</span></p>
                )}
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Restorative</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Child voice: <span className={cn("font-medium", d.restorative_profile.child_voice_rate >= 80 ? "text-green-600" : "text-amber-600")}>{d.restorative_profile.child_voice_rate}%</span></p>
                <p>BSP linked: <span className={cn("font-medium", d.restorative_profile.bsp_linked_rate >= 60 ? "text-green-600" : "text-amber-600")}>{d.restorative_profile.bsp_linked_rate}%</span></p>
                {hasRepeat && (
                  <p>Repeat concerns: <span className="font-medium text-red-600">{d.behaviour_profile.repeat_concern_children.length}</span></p>
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

        {/* Cara Behaviour Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Behaviour Intelligence
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
