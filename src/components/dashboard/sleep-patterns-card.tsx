"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SLEEP PATTERNS INTELLIGENCE CARD
// Dashboard card powered by the Night Monitoring Intelligence Engine.
// CHR 2015 Reg 12/24/25. SCCIF: Overall Experiences — Night care.
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, ChevronRight, AlertTriangle, Brain,
  Users, Loader2,
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

const PATTERN_STYLES: Record<string, string> = {
  settled:   "bg-[--cs-success-bg] text-[--cs-success]",
  variable:  "bg-[--cs-warning-bg] text-[--cs-warning]",
  disturbed: "bg-[--cs-risk-bg] text-[--cs-risk]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function SleepPatternsCard() {
  const { data, isLoading } = useNightMonitoring();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Sleep Patterns
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Sleep Patterns
          </CardTitle>
          <Link href="/night-checks" className="text-xs text-brand hover:underline flex items-center gap-1">
            Nights <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", (o.all_children_checked_rate ?? 0) >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (o.all_children_checked_rate ?? 0) >= 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(o.all_children_checked_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Checks</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_rounds_7d}</p>
            <p className="text-[10px] text-muted-foreground">Rounds/7d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.concern_count_7d === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.concern_count_7d === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{o.concern_count_7d}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (o.building_secure_rate ?? 0) >= 100 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (o.building_secure_rate ?? 0) >= 100 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{formatRate(o.building_secure_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Secure</p>
          </div>
        </div>

        {/* ── Child sleep profiles ────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Sleep Profiles
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="rounded border p-2.5 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{cp.child_name}</span>
                  <Badge className={cn("text-[10px]", PATTERN_STYLES[cp.sleep_pattern] ?? PATTERN_STYLES.variable)}>
                    {cp.sleep_pattern}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-300" style={{ width: `${formatRate(cp.asleep_rate)}` }} />
                    <div className="h-full bg-amber-300" style={{ width: `${formatRate(cp.awake_rate)}` }} />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{formatRate(cp.asleep_rate)} asleep</span>
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

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Sleep Intelligence
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
