"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEHAVIOUR SUPPORT PLANS INTELLIGENCE CARD
// Dashboard card powered by the Behaviour Intelligence Engine.
// CHR 2015 Reg 19/20/6. SCCIF: Overall Experiences — Behaviour support.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, ChevronRight, AlertTriangle, Brain,
  TrendingUp, TrendingDown, Minus, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { BehaviourIntelligenceResult } from "@/lib/engines/behaviour-intelligence-engine";

interface BehaviourIntelligenceResponse {
  data: BehaviourIntelligenceResult;
}

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high:     "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium:   "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low:      "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  insufficient_data: Minus,
};

const TREND_COLOUR = {
  improving: "text-[--cs-success]",
  stable: "text-blue-600",
  declining: "text-[--cs-risk]",
  insufficient_data: "text-gray-400",
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-50 text-red-700 border-red-200",
  high: "bg-orange-50 text-orange-700 border-orange-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-green-50 text-green-700 border-green-200",
};

// ── Component ───────────────────────────────────────────────────────────────

export function BehaviourSupportPlansCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["behaviour-intelligence"],
    queryFn: () => api.get<BehaviourIntelligenceResponse>("/behaviour-intelligence"),
    refetchInterval: 30_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand" />
            Behaviour Support Plans
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

  const p = intel.profile;
  const rs = intel.rewards_sanctions;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand" />
            Behaviour Support Plans
          </CardTitle>
          <Link href="/behaviour-support-plans" className="text-xs text-brand hover:underline flex items-center gap-1">
            BSPs <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            p.positive_percentage >= 50 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn("text-lg font-bold tabular-nums", p.positive_percentage >= 50 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {p.positive_percentage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Positive</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            (p.de_escalation_success_rate ?? 0) >= 80 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn("text-lg font-bold tabular-nums", (p.de_escalation_success_rate ?? 0) >= 80 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {p.de_escalation_success_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">De-escal.</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{rs.reward_to_sanction}</p>
            <p className="text-[10px] text-muted-foreground">R:S Ratio</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            p.pi_count === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn("text-lg font-bold tabular-nums", p.pi_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {p.pi_count}
            </p>
            <p className="text-[10px] text-muted-foreground">PIs</p>
          </div>
        </div>

        {/* ── Child trajectories ──────────────────────────────────────── */}

        {intel.child_trajectories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Child Trajectories
            </p>
            {intel.child_trajectories.map((ct) => {
              const TrendIcon = TREND_ICON[ct.trend] ?? Minus;
              return (
                <div key={ct.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <TrendIcon className={cn("h-3.5 w-3.5", TREND_COLOUR[ct.trend])} />
                    <span className="font-medium">{ct.child_name}</span>
                    <span className="text-muted-foreground">
                      {ct.positive_recent}+ / {ct.concerning_recent}−
                    </span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px]", SEVERITY_STYLES[ct.severity] ?? SEVERITY_STYLES.medium)}>
                    {ct.trend}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PI compliance ───────────────────────────────────────────── */}

        {p.pi_count > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold">Physical Intervention Compliance</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className={cn("font-bold tabular-nums", (p.pi_debrief_completion_rate ?? 0) >= 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                  {p.pi_debrief_completion_rate}%
                </p>
                <p className="text-[10px] text-muted-foreground">Debriefed</p>
              </div>
              <div>
                <p className={cn("font-bold tabular-nums", p.pi_injury_rate === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
                  {p.pi_injury_rate}%
                </p>
                <p className="text-[10px] text-muted-foreground">Injury Rate</p>
              </div>
              <div>
                <p className="font-bold tabular-nums text-slate-700">{p.pi_avg_duration_minutes}m</p>
                <p className="text-[10px] text-muted-foreground">Avg Duration</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              BSP Alerts
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

        {/* ── Cara Behaviour Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara BSP Intelligence
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
