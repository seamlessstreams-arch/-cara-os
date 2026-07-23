"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME MISSING EPISODES INTELLIGENCE CARD
// Home-level: missing from care episodes, safeguarding response, reporting
// compliance, contextual safeguarding, pattern analysis.
// CHR 2015 Reg 12, 34. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntelligenceCardEmpty } from "@/components/dashboard/intelligence-card-empty";
import {
  Loader2, AlertCircle, AlertTriangle,
  Sparkles, Brain, MapPin,
  Shield, Clock, UserX, AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useHomeMissingEpisodesIntelligence } from "@/hooks/use-home-missing-episodes-intelligence";
import type { MissingEpisodesRating } from "@/lib/engines/home-missing-episodes-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RATING_STYLES: Record<MissingEpisodesRating, { bg: string; text: string; border: string; label: string }> = {
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

export function HomeMissingEpisodesIntelligenceCard() {
  const { data, isLoading } = useHomeMissingEpisodesIntelligence();

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
  const __emptyState = d.missing_episodes_rating === "inadequate" && (d.missing_episodes_score ?? 0) <= 15;
  if (__emptyState) {
    d = {
      ...d,
      missing_episodes_rating: "insufficient_data",
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

  const ratingStyle = RATING_STYLES[d.missing_episodes_rating] ?? RATING_STYLES.insufficient_data;
  const hasEscalation = d.pattern.escalating;
  const hasCS = d.episodes.contextual_safeguarding_count > 0;
  const hasOpen = d.episodes.open_episodes > 0;
  const hasHighRisk = d.episodes.high_risk_count > 0;
  const isAlert = hasEscalation || hasCS || hasOpen || hasHighRisk || d.missing_episodes_rating === "inadequate";

  return (
    <Card className={cn("overflow-hidden", isAlert ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", isAlert ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className={cn("h-4 w-4", isAlert ? "text-[--cs-risk]" : "text-orange-500")} />
            <span className="text-slate-900">Missing Episodes</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", ratingStyle.bg, ratingStyle.text, ratingStyle.border)}>
              {ratingStyle.label}
            </span>
            {d.missing_episodes_rating !== "insufficient_data" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.missing_episodes_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {d.missing_episodes_rating === "insufficient_data" && <IntelligenceCardEmpty />}

        {/* KPI Row */}
        {d.missing_episodes_rating !== "insufficient_data" && d.episodes.total_180d > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Episodes 90d */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <AlertOctagon className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.episodes.total_90d === 0 ? "text-[--cs-success]" : d.episodes.total_90d <= 2 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
                  {d.episodes.total_90d}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Episodes (90d)</p>
            </div>

            {/* High Risk */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Shield className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.episodes.high_risk_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
                  {d.episodes.high_risk_count}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">High Risk</p>
            </div>

            {/* Return Interviews */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.episodes.return_interview_rate === null ? "text-muted-foreground" : meets(d.episodes.return_interview_rate, 100) ? "text-[--cs-success]" : meets(d.episodes.return_interview_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
                  {formatRate(d.episodes.return_interview_rate)}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">RI Rate</p>
            </div>

            {/* Children Affected */}
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <UserX className="h-3.5 w-3.5 text-slate-400" />
                <p className={cn("text-lg font-bold tabular-nums", d.episodes.children_with_episodes.length === 0 ? "text-[--cs-success]" : d.episodes.repeat_children.length > 0 ? "text-[--cs-risk]" : "text-[--cs-warning]")}>
                  {d.episodes.children_with_episodes.length}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">Children</p>
            </div>
          </div>
        )}

        {/* Detail Panels */}
        {d.episodes.total_180d > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Episode Detail */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Episodes (180d)</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Total: <span className="font-medium text-slate-600">{d.episodes.total_180d}</span></p>
                <p>Avg duration: <span className="font-medium text-slate-600">{d.episodes.avg_duration_hours}h</span></p>
                <p>Longest: <span className={cn("font-medium", d.episodes.longest_duration_hours > 4 ? "text-[--cs-risk]" : "text-slate-600")}>{d.episodes.longest_duration_hours}h</span></p>
                {d.episodes.open_episodes > 0 && <p>Open: <span className="font-medium text-red-600">{d.episodes.open_episodes}</span></p>}
                {d.episodes.contextual_safeguarding_count > 0 && <p>CS risk: <span className="font-medium text-red-600">{d.episodes.contextual_safeguarding_count}</span></p>}
              </div>
            </div>

            {/* Compliance & Pattern */}
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Compliance & Pattern</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Police reported: <span className={cn("font-medium", d.episodes.police_reported_rate === null ? "text-muted-foreground" : meets(d.episodes.police_reported_rate, 100) ? "text-[--cs-success]" : "text-[--cs-risk]")}>{formatRate(d.episodes.police_reported_rate)}</span></p>
                <p>LA notified: <span className={cn("font-medium", d.episodes.la_reported_rate === null ? "text-muted-foreground" : meets(d.episodes.la_reported_rate, 100) ? "text-[--cs-success]" : "text-[--cs-risk]")}>{formatRate(d.episodes.la_reported_rate)}</span></p>
                {d.episodes.repeat_children.length > 0 && <p>Repeat children: <span className="font-medium text-red-600">{d.episodes.repeat_children.length}</span></p>}
                <p>Trend: <span className={cn("font-medium", d.pattern.trend === "improving" ? "text-[--cs-success]" : d.pattern.trend === "worsening" ? "text-[--cs-risk]" : "text-slate-600")}>{d.pattern.trend}</span></p>
                {d.pattern.escalating && <p className="font-medium text-red-600">⚠ Escalating</p>}
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

        {/* Cara Missing Episodes Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Missing Episodes Intelligence
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
