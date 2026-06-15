"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME RISK LANDSCAPE INTELLIGENCE CARD
// Home-level: risk assessment distribution, trends, mitigation effectiveness,
// review currency, child voice, and coverage across all children.
// CHR 2015 Reg 12, Reg 35, Reg 36. SCCIF: "How well children are helped
// and protected."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, ShieldAlert,
  TrendingDown, TrendingUp, CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHomeRiskLandscapeIntelligence } from "@/hooks/use-home-risk-landscape-intelligence";
import type { RiskLandscapeRating } from "@/lib/engines/home-risk-landscape-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<RiskLandscapeRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeRiskLandscapeIntelligenceCard() {
  const { data, isLoading } = useHomeRiskLandscapeIntelligence();

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
  const __emptyState = d.risk_rating === "inadequate" && (d.risk_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      risk_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.risk_rating] ?? RATING_STYLES.insufficient_data;
  const hasIncreasing = d.trend_profile.increasing_count > 0;
  const hasHighRisk = d.distribution_profile.high_or_very_high_count > 0;
  const isAlert = hasIncreasing || d.risk_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className={cn("h-4 w-4", isAlert ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Risk Landscape</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.risk_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.risk_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.risk_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.risk_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Decreasing */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.trend_profile.decreasing_rate >= 50 ? "text-green-600" :
                  d.trend_profile.decreasing_rate >= 30 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.trend_profile.decreasing_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Decreasing</p>
            </div>

            {/* Increasing */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.trend_profile.increasing_count === 0 ? "text-green-600" : "text-red-600"
                )}>
                  {d.trend_profile.increasing_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Increasing</p>
            </div>

            {/* Mitigation Effectiveness */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.mitigation_profile.effectiveness_rate >= 70 ? "text-green-600" :
                  d.mitigation_profile.effectiveness_rate >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.mitigation_profile.effectiveness_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Effective</p>
            </div>

            {/* Child Voice */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums",
                  d.coverage_profile.child_voice_rate >= 90 ? "text-green-600" :
                  d.coverage_profile.child_voice_rate >= 70 ? "text-amber-600" : "text-red-600"
                )}>
                  {d.coverage_profile.child_voice_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Child Voice</p>
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {d.risk_rating !== "insufficient_data" && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Risk Levels</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>High/V.High: <span className={cn("font-medium",
                  d.distribution_profile.high_or_very_high_count > 0 ? "text-red-600" : "text-green-600"
                )}>{d.distribution_profile.high_or_very_high_count}</span></p>
                <p>Medium: <span className="font-medium text-amber-600">{d.distribution_profile.medium_count}</span></p>
                <p>Low: <span className="font-medium text-green-600">{d.distribution_profile.low_count}</span></p>
                <p>Domains: <span className="font-medium text-slate-600">{d.distribution_profile.unique_domains}</span></p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Currency</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Overdue: <span className={cn("font-medium",
                  d.currency_profile.overdue_reviews > 0 ? "text-red-600" : "text-green-600"
                )}>{d.currency_profile.overdue_reviews}</span></p>
                <p>Due in 7d: <span className={cn("font-medium",
                  d.currency_profile.upcoming_reviews_7d > 0 ? "text-amber-600" : "text-slate-600"
                )}>{d.currency_profile.upcoming_reviews_7d}</span></p>
                <p>Avg age: <span className="font-medium text-slate-600">{d.currency_profile.avg_days_since_assessment}d</span></p>
                <p>Contingency: <span className={cn("font-medium",
                  d.coverage_profile.contingency_rate >= 90 ? "text-green-600" : "text-amber-600"
                )}>{d.coverage_profile.contingency_rate}%</span></p>
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

        {/* Cara Risk Landscape Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Risk Intelligence
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
