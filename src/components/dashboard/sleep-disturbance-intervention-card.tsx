"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SLEEP DISTURBANCE INTERVENTION CARD
// Live data from useNightMonitoring() — overview, child profiles, security.
// CHR 2015 Reg 12/24/25. SCCIF: Overall Experiences — Night care.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { NightMonitoringResult } from "@/lib/engines/night-monitoring-engine";

// ── Inlined from former hook wrapper: use-night-monitoring ─────────────────

interface NightMonitoringResponse {
  data: NightMonitoringResult;
}

function useNightMonitoring() {
  return useQuery({
    queryKey: ["night-monitoring"],
    queryFn: () => api.get<NightMonitoringResponse>("/night-monitoring"),
    refetchInterval: 60_000, // 60 second refresh
  });
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

export function SleepDisturbanceInterventionCard() {
  const { data, isLoading } = useNightMonitoring();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Sleep Disturbance
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

  const { overview, child_profiles } = intel;
  const disrupted = child_profiles.filter((c) => c.sleep_pattern === "disrupted").length;
  const variable = child_profiles.filter((c) => c.sleep_pattern === "variable").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Sleep Disturbance
          </CardTitle>
          <Link href="/night-checks" className="text-xs text-brand hover:underline flex items-center gap-1">
            Nights <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", disrupted === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", disrupted === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{disrupted}</p>
            <p className="text-[10px] text-muted-foreground">Disrupted</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", variable === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", variable === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{variable}</p>
            <p className="text-[10px] text-muted-foreground">Variable</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.concern_count_7d === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.concern_count_7d === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{overview.concern_count_7d}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.not_in_room_count_7d === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.not_in_room_count_7d === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{overview.not_in_room_count_7d}</p>
            <p className="text-[10px] text-muted-foreground">Not in Room</p>
          </div>
        </div>

        {/* ── Child sleep profiles ────────────────────────────────────── */}

        {child_profiles.filter((c) => c.sleep_pattern !== "settled").length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Intervention Needed</p>
            {child_profiles.filter((c) => c.sleep_pattern !== "settled").slice(0, 3).map((c) => (
              <div key={c.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{c.child_name}</span>
                <div className="flex items-center gap-1">
                  <Badge className={cn("text-[9px]", c.sleep_pattern === "disrupted" ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-warning-bg] text-[--cs-warning]")}>
                    {c.sleep_pattern}
                  </Badge>
                  {c.concern_count_7d > 0 && (
                    <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">{c.concern_count_7d} concerns</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Night Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
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
              Cara Sleep Intelligence
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
