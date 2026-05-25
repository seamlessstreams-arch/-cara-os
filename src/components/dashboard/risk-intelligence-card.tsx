"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RISK INTELLIGENCE CARD
// Dashboard card showing overall risk profile, child risk profiles,
// domain analysis, overdue reviews, and ARIA risk intelligence.
// Powered by the Risk Assessment Intelligence Engine — live data (Reg 12/34).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, AlertTriangle, TrendingDown,
  TrendingUp, Brain, Loader2, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRiskAssessmentIntelligence } from "@/hooks/use-risk-assessment-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const LEVEL_COLOURS: Record<string, string> = {
  very_high: "bg-red-600 text-white",
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
  minimal: "bg-green-50 text-green-600",
};

const LEVEL_BAR: Record<string, string> = {
  very_high: "bg-red-600",
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-green-400",
  minimal: "bg-green-300",
};

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const TREND_ICON: Record<string, typeof TrendingUp> = {
  increasing: TrendingUp,
  stable: Minus,
  decreasing: TrendingDown,
};

// ── Component ────────────────────────────────────────────────────────────────

export function RiskIntelligenceCard() {
  const { data, isLoading } = useRiskAssessmentIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Risk Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const o = intel.overview;

  // Determine overall trend
  const overallTrend = o.increasing_count > o.decreasing_count
    ? "increasing"
    : o.decreasing_count > o.increasing_count
      ? "decreasing"
      : "stable";
  const TrendIcon = TREND_ICON[overallTrend] ?? Minus;

  // Risk level distribution for bar chart
  const levels = [
    { key: "very_high", label: "Very High", count: o.very_high_count },
    { key: "high", label: "High", count: o.high_count },
    { key: "medium", label: "Medium", count: o.medium_count },
    { key: "low", label: "Low", count: o.low_count },
  ];
  const maxLevel = Math.max(...levels.map((l) => l.count), 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Risk Intelligence
          </CardTitle>
          <Link href="/risk-register" className="text-xs text-brand hover:underline flex items-center gap-1">
            Risk Register <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_current_assessments}</p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.overdue_review_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.overdue_review_count > 0 ? "text-red-600" : "text-green-600")}>
              {o.overdue_review_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.child_voice_rate === 100 ? "bg-green-50" : o.child_voice_rate >= 75 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.child_voice_rate === 100 ? "text-green-600" : o.child_voice_rate >= 75 ? "text-amber-600" : "text-red-600")}>
              {o.child_voice_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Voice</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <div className="flex items-center justify-center gap-1">
              <TrendIcon className={cn("h-4 w-4", overallTrend === "decreasing" ? "text-green-600" : overallTrend === "increasing" ? "text-red-600" : "text-gray-500")} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Trend</p>
          </div>
        </div>

        {/* ── Risk level distribution ──────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Risk Distribution</p>
          {levels.map(({ key, label, count }) => {
            const pct = (count / maxLevel) * 100;
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 text-right">
                  {label}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", LEVEL_BAR[key])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium">{o.mitigation_effectiveness_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Mitigations</p>
            </div>
            <div>
              <p className="text-xs font-medium">{o.contingency_plan_rate}%</p>
              <p className="text-[10px] text-muted-foreground">Contingency</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600">{o.decreasing_count}</p>
              <p className="text-[10px] text-muted-foreground">Decreasing</p>
            </div>
            <div>
              <p className={cn("text-xs font-medium", o.increasing_count > 0 ? "text-red-600" : "text-green-600")}>{o.increasing_count}</p>
              <p className="text-[10px] text-muted-foreground">Increasing</p>
            </div>
          </div>
        </div>

        {/* ── Child Risk Profiles ──────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Child Risk Profiles
            </p>
            {intel.child_profiles.map((profile) => (
              <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{profile.child_name}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn("text-[9px] capitalize", LEVEL_COLOURS[profile.highest_level])}>
                      {profile.highest_level.replace("_", " ")}
                    </Badge>
                    {profile.increasing_risks > 0 && (
                      <Badge className="text-[9px] bg-red-100 text-red-700">
                        {profile.increasing_risks} rising
                      </Badge>
                    )}
                    {profile.overdue_reviews > 0 && (
                      <Badge className="text-[9px] bg-amber-100 text-amber-700">
                        {profile.overdue_reviews} overdue
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{profile.active_assessments} risks</span>
                  <span className="text-[10px]">{profile.domains.join(", ")}</span>
                  {!profile.child_voice_present && (
                    <span className="text-[10px] text-red-500">No voice</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Domain Analysis ──────────────────────────────────────────── */}

        {intel.domain_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Domain Analysis
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {intel.domain_analysis.slice(0, 4).map((d) => (
                <div key={d.domain} className="rounded border p-2 text-center">
                  <p className="text-[10px] font-medium capitalize">{d.domain.replace("_", " ")}</p>
                  <p className="text-xs font-bold tabular-nums">{d.avg_level_score}</p>
                  <p className="text-[9px] text-muted-foreground">{d.count} assessment{d.count > 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Risk Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Risk Intelligence ──────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Risk Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
