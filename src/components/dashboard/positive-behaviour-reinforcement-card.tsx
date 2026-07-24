"use client";

// ��═════════════════════════════════════════════════════════════════════════════
// CARA — POSITIVE BEHAVIOUR REINFORCEMENT CARD
// Live data from useBehaviourIntelligence() — rewards, profile, categories.
// CHR 2015 Reg 11/12. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { BehaviourIntelligenceResult } from "@/lib/engines/behaviour-intelligence-engine";

interface BehaviourIntelligenceResponse {
  data: BehaviourIntelligenceResult;
}

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

export function PositiveBehaviourReinforcementCard() {
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
            <Star className="h-4 w-4 text-brand" />
            Positive Reinforcement
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

  const { profile, rewards_sanctions } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-brand" />
            Positive Reinforcement
          </CardTitle>
          <Link href="/behaviour-log" className="text-xs text-brand hover:underline flex items-center gap-1">
            Behaviour <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{profile.positive_count}</p>
            <p className="text-[10px] text-muted-foreground">Positive</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", profile.positive_percentage >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", profile.positive_percentage >= 70 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{profile.positive_percentage}%</p>
            <p className="text-[10px] text-muted-foreground">Pos Rate</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{rewards_sanctions.total_rewards}</p>
            <p className="text-[10px] text-muted-foreground">Rewards</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile.de_escalation_success_rate}%</p>
            <p className="text-[10px] text-muted-foreground">De-escal</p>
          </div>
        </div>

        {/* ── Rewards/Sanctions ratio ─────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold">Rewards vs Sanctions</p>
          <div className="flex items-center gap-2">
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">{rewards_sanctions.total_rewards} rewards</Badge>
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">{rewards_sanctions.total_sanctions} sanctions</Badge>
            <Badge className="text-[10px] bg-[--cs-info-bg] text-[--cs-info]">ratio: {rewards_sanctions.reward_to_sanction}</Badge>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Behaviour Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ────────────────────────────────���──────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Behaviour Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
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
