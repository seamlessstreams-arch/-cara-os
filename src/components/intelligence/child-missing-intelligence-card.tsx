"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD MISSING & RETURN INTELLIGENCE CARD
// Per-child: missing episode frequency, duration trends, risk escalation,
// return interview compliance, contextual safeguarding, patterns.
// CHR 2015 Reg 12, 34. SCCIF: "Safety of children."
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle, Brain, Loader2, AlertCircle,
  Sparkles, MapPin, TrendingUp, TrendingDown, Minus,
  Clock, Shield, FileCheck, AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildMissingIntelligence } from "@/hooks/use-child-missing-intelligence";
import type { MissingRiskLevel } from "@/lib/engines/child-missing-intelligence-engine";

// ── Style Maps ──────────────────────────────────────────────────────────────

const RISK_STYLES: Record<MissingRiskLevel, { bg: string; text: string; border: string; label: string }> = {
  high_risk:    { bg: "bg-red-100",    text: "text-red-800",    border: "border-red-300",    label: "HIGH RISK" },
  elevated:     { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-300", label: "ELEVATED" },
  managed:      { bg: "bg-amber-100",  text: "text-amber-800",  border: "border-amber-300",  label: "MANAGED" },
  low:          { bg: "bg-blue-100",   text: "text-blue-800",   border: "border-blue-300",   label: "LOW" },
  no_episodes:  { bg: "bg-green-100",  text: "text-green-800",  border: "border-green-300",  label: "NO EPISODES" },
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

const PATTERN_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

const TREND_ICON = {
  increasing: TrendingUp,
  stable: Minus,
  decreasing: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOR: Record<string, string> = {
  increasing: "text-red-600",   // For missing, increasing = bad
  stable: "text-slate-500",
  decreasing: "text-green-600", // Decreasing = good
  insufficient_data: "text-slate-400",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildMissingIntelligenceCard({ childId }: { childId: string }) {
  const { data, isLoading } = useChildMissingIntelligence(childId);

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

  const riskStyle = RISK_STYLES[d.missing_risk] ?? RISK_STYLES.no_episodes;
  const FreqTrendIcon = TREND_ICON[d.frequency.trend];
  const DurTrendIcon = TREND_ICON[d.duration.duration_trend];

  return (
    <Card className={cn("overflow-hidden", d.is_currently_missing ? "border-red-400 border-2" : "border-slate-200")}>
      <CardHeader className={cn("pb-3", d.is_currently_missing ? "bg-red-50" : "bg-slate-50/50")}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className={cn("h-4 w-4", d.is_currently_missing ? "text-red-600" : "text-orange-500")} />
            <span className="text-slate-900">Missing Episodes</span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", riskStyle.bg, riskStyle.text, riskStyle.border)}>
              {riskStyle.label}
            </span>
            {d.missing_risk !== "no_episodes" && (
              <span className="text-xs font-bold tabular-nums text-slate-600">{d.missing_risk_score}%</span>
            )}
          </CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{d.headline}</p>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* Currently Missing Alert */}
        {d.is_currently_missing && (
          <div className="rounded border-2 border-red-400 bg-red-100 p-3 text-xs text-red-900 font-medium flex items-center gap-2">
            <AlertOctagon className="h-4 w-4 shrink-0" />
            CHILD IS CURRENTLY MISSING — All protocols must be activated
          </div>
        )}

        {/* KPI Row */}
        {d.frequency.total_episodes > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <p className={cn("text-lg font-bold tabular-nums", d.frequency.episodes_90d >= 3 ? "text-red-600" : d.frequency.episodes_90d >= 1 ? "text-amber-600" : "text-green-600")}>
                  {d.frequency.episodes_90d}
                </p>
                <FreqTrendIcon className={cn("h-3.5 w-3.5", TREND_COLOR[d.frequency.trend])} />
              </div>
              <p className="text-[10px] text-muted-foreground">Episodes (90d)</p>
              {d.frequency.trend !== "insufficient_data" && (
                <p className={cn("text-[10px] capitalize", TREND_COLOR[d.frequency.trend])}>{d.frequency.trend}</p>
              )}
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-lg font-bold tabular-nums text-slate-600">
                  {d.duration.avg_duration_hours > 0 ? `${d.duration.avg_duration_hours}h` : "—"}
                </p>
                {d.duration.duration_trend !== "insufficient_data" && (
                  <DurTrendIcon className={cn("h-3.5 w-3.5", TREND_COLOR[d.duration.duration_trend])} />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Avg Duration</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <Shield className={cn("h-3.5 w-3.5", d.risk.contextual_safeguarding_episodes > 0 ? "text-red-500" : "text-green-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.risk.contextual_safeguarding_episodes > 0 ? "text-red-600" : "text-green-600")}>
                  {d.risk.contextual_safeguarding_episodes}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">CS Flagged</p>
            </div>
            <div className="text-center rounded-lg bg-slate-50 p-2">
              <div className="flex items-center justify-center gap-1">
                <FileCheck className={cn("h-3.5 w-3.5", d.response_quality.return_interview_rate === 100 ? "text-green-500" : "text-amber-500")} />
                <p className={cn("text-lg font-bold tabular-nums", d.response_quality.return_interview_rate === 100 ? "text-green-600" : "text-amber-600")}>
                  {d.response_quality.return_interview_rate}%
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">RI Rate</p>
            </div>
          </div>
        )}

        {/* Risk + Response Detail */}
        {d.frequency.total_episodes > 0 && (
          <div className="grid grid-cols-2 gap-1.5">
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Risk Profile</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>Current: <span className={cn("font-medium capitalize", d.risk.current_risk_level === "high" || d.risk.current_risk_level === "critical" ? "text-red-600" : "text-slate-600")}>{d.risk.current_risk_level}</span></p>
                <p>Highest ever: <span className="font-medium capitalize text-slate-600">{d.risk.highest_ever_risk}</span></p>
                {d.risk.risk_escalating && <p className="text-red-600 font-medium">Risk escalating</p>}
                <p>Police involved: {d.risk.police_involved_count}x</p>
              </div>
            </div>
            <div className="rounded border p-2 text-xs">
              <p className="font-medium text-slate-700 mb-1">Response Quality</p>
              <div className="space-y-0.5 text-[10px] text-muted-foreground">
                <p>RI completed: <span className={d.response_quality.return_interview_rate === 100 ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{d.response_quality.return_interview_rate}%</span></p>
                {d.response_quality.avg_ri_delay_days > 0 && <p>Avg RI delay: {d.response_quality.avg_ri_delay_days}d</p>}
                <p>Police rate (high/crit): {d.response_quality.police_reporting_rate}%</p>
                <p>LA notified: {d.response_quality.la_notification_rate}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Patterns */}
        {d.patterns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              Patterns Identified ({d.patterns.length})
            </p>
            {d.patterns.map((p, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", PATTERN_STYLES[p.severity] ?? PATTERN_STYLES.info)}>
                {p.text}
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

        {/* ARIA Missing Intelligence */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Missing Intelligence
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
