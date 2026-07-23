"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF CONFIDENCE INDICATOR CARD
// Live data from useSupervisionIntelligence() — wellbeing, threshold, trends.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Gauge, ChevronRight, Brain, Loader2,
  AlertTriangle, Users, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useSupervisionIntelligence } from "@/hooks/use-supervision-intelligence";

// ── Styling ──────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const TREND_CONFIG = {
  improving: { icon: TrendingUp, color: "text-[--cs-success]", label: "Improving" },
  stable: { icon: Minus, color: "text-blue-600", label: "Stable" },
  declining: { icon: TrendingDown, color: "text-[--cs-risk]", label: "Declining" },
  insufficient_data: { icon: Minus, color: "text-slate-600", label: "N/A" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffConfidenceIndicatorCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4 text-brand" />
            Confidence Indicators
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

  const { wellbeing, overview, staff_profiles } = intel;
  const trend = TREND_CONFIG[wellbeing.trend];
  const TrendIcon = trend.icon;
  const completionRate = overview.action_completion_rate;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Gauge className="h-4 w-4 text-brand" />
            Confidence Indicators
          </CardTitle>
          <Link href="/supervision" className="text-xs text-brand hover:underline flex items-center gap-1">
            Supervision <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", wellbeing.avg_score === null ? "bg-slate-50" : wellbeing.avg_score >= 7 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", wellbeing.avg_score === null ? "text-[var(--cs-text-muted)]" : wellbeing.avg_score >= 7 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {wellbeing.avg_score ?? "—"}/10
            </p>
            <p className="text-[10px] text-muted-foreground">Wellbeing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", wellbeing.staff_below_threshold === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", wellbeing.staff_below_threshold === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {wellbeing.staff_below_threshold}
            </p>
            <p className="text-[10px] text-muted-foreground">Below Thr.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(completionRate, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(completionRate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(completionRate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-purple-50">
            <p className={cn("text-lg font-bold tabular-nums flex items-center justify-center gap-1", trend.color)}>
              <TrendIcon className="h-3.5 w-3.5" />
            </p>
            <p className="text-[10px] text-muted-foreground">{trend.label}</p>
          </div>
        </div>

        {/* ── Staff wellbeing profiles ────────────────────────────────── */}

        {staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Staff Wellbeing
            </p>
            <div className="space-y-1">
              {staff_profiles
                .filter((p) => p.avg_wellbeing !== null)
                .sort((a, b) => (a.avg_wellbeing ?? 0) - (b.avg_wellbeing ?? 0))
                .slice(0, 5)
                .map((profile) => (
                  <div key={profile.staff_id} className="flex items-center justify-between rounded border p-2 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Gauge className="h-3 w-3 text-purple-500 shrink-0" />
                      <span className="font-medium">{profile.staff_name}</span>
                      <span className="text-muted-foreground truncate">{profile.role}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", meets(profile.avg_wellbeing, 7) ? "text-green-700 bg-green-50 border-green-200" : meets(profile.avg_wellbeing, 5) ? "text-amber-700 bg-amber-50 border-amber-200" : "text-red-700 bg-red-50 border-red-200")}>
                      {profile.avg_wellbeing}/10
                    </Badge>
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
              Confidence Alerts
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

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Confidence Intelligence
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
