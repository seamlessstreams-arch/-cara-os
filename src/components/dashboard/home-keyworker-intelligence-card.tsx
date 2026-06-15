"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME KEYWORKER INTELLIGENCE CARD
// Home-level: keyworker session coverage, therapeutic quality, child
// engagement, mood improvement, follow-through, theme diversity.
// CHR 2015 Reg 44. SCCIF: "How well children are helped and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, Heart,
  Users, Smile, TrendingUp, Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeKeyworkerIntelligence } from "@/hooks/use-home-keyworker-intelligence";
import type { KeyworkerRating } from "@/lib/engines/home-keyworker-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<KeyworkerRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeKeyworkerIntelligenceCard() {
  const { data, isLoading } = useHomeKeyworkerIntelligence();

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
  const __emptyState = d.keyworker_rating === "inadequate" && (d.keyworker_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      keyworker_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.keyworker_rating] ?? RATING_STYLES.insufficient_data;
  const hasLowCoverage = d.coverage_profile.coverage_rate < 50;
  const hasLowSatisfaction = d.quality_profile.avg_satisfaction < 3.0 && d.coverage_profile.total_sessions > 0;
  const isAlert = hasLowCoverage || hasLowSatisfaction || d.keyworker_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-rose-500")} />
            <span className="text-slate-900">Keyworker Practice</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.keyworker_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.keyworker_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.keyworker_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.keyworker_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Coverage */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.coverage_profile.coverage_rate >= 100 ? "text-green-600" :
                  d.coverage_profile.coverage_rate >= 80 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.coverage_profile.coverage_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Coverage</p>
            </div>

            {/* Satisfaction */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Smile className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.quality_profile.avg_satisfaction >= 4.0 ? "text-green-600" :
                  d.quality_profile.avg_satisfaction >= 3.0 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.quality_profile.avg_satisfaction}/5
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Satisfaction</p>
            </div>

            {/* Mood Improvement */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.therapeutic_profile.mood_improvement_rate >= 70 ? "text-green-600" :
                  d.therapeutic_profile.mood_improvement_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.therapeutic_profile.mood_improvement_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Mood ↑</p>
            </div>

            {/* Themes */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Palette className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.quality_profile.avg_themes >= 3 ? "text-green-600" :
                  d.quality_profile.avg_themes >= 2 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.quality_profile.avg_themes}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Themes</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.keyworker_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Sessions</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.coverage_profile.total_sessions}</span></p>
                <p>Per child: <span className="font-medium text-slate-600">{d.coverage_profile.avg_sessions_per_child}</span></p>
                <p>Avg duration: <span className="font-medium text-slate-600">{d.quality_profile.avg_duration}m</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Engagement</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Chose format: <span className={cn("font-medium",
                  d.engagement_profile.child_chose_format_rate >= 80 ? "text-green-600" : "text-amber-600"
                )}>{d.engagement_profile.child_chose_format_rate}%</span></p>
                <p>Child raised: <span className="font-medium text-slate-600">{d.engagement_profile.child_brought_up_rate}%</span></p>
                <p>Flags raised: <span className={cn("font-medium",
                  d.follow_up_profile.flags_raised_total > 0 ? "text-red-600" : "text-green-600"
                )}>{d.follow_up_profile.flags_raised_total}</span></p>
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

        {/* Cara Keyworker Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Keyworker Intelligence
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
