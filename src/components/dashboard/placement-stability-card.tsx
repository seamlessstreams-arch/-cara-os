"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT STABILITY INTELLIGENCE CARD
// Dashboard card showing per-child stability profiles, disruption indicators,
// wellbeing trends, and Cara placement intelligence (Reg 5/12/14).
// Powered by the Placement Stability Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, TrendingUp, TrendingDown, Minus,
  Loader2, Users, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { PlacementStabilityResult } from "@/lib/engines/placement-stability-engine";

interface PlacementStabilityResponse {
  data: PlacementStabilityResult;
}

function usePlacementStability() {
  return useQuery({
    queryKey: ["placement-stability"],
    queryFn: () => api.get<PlacementStabilityResponse>("/placement-stability"),
    refetchInterval: 45_000, // 45 second refresh (placement data is semi-live)
  });
}

// ── Styling maps ────────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  excellent: { bg: "bg-emerald-100", text: "text-emerald-700" },
  good: { bg: "bg-green-100", text: "text-green-700" },
  moderate: { bg: "bg-amber-100", text: "text-amber-700" },
  at_risk: { bg: "bg-orange-100", text: "text-orange-700" },
  critical: { bg: "bg-red-100", text: "text-red-700" },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const TREND_ICONS: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-3 w-3 text-green-500" />,
  declining: <TrendingDown className="h-3 w-3 text-red-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
  insufficient_data: <Minus className="h-3 w-3 text-gray-300" />,
};

// ── Component ────────────────────────────────────────────────────────────────

export function PlacementStabilityCard() {
  const { data, isLoading } = usePlacementStability();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4 text-brand" />
            Placement Stability
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

  const m = intel.home_metrics;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4 text-brand" />
            Placement Stability
          </CardTitle>
          <Link href="/placement-stability" className="text-xs text-brand hover:underline flex items-center gap-1">
            Stability <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2" style={{ background: (m.average_stability_score ?? 0) >= 65 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", (m.average_stability_score ?? 0) >= 65 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {m.average_stability_score}
            </p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {m.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.children_at_risk + m.children_critical > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.children_at_risk + m.children_critical > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>
              {m.children_at_risk + m.children_critical}
            </p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {m.average_placement_days}d
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
        </div>

        {/* ── Per-child stability profiles ────────────────────────────── */}

        {intel.children.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Stability Profiles
            </p>
            <div className="space-y-1">
              {intel.children.map((child) => {
                const level = LEVEL_STYLES[child.stability_level] ?? LEVEL_STYLES.moderate;
                return (
                  <div key={child.child_id} className="flex items-center justify-between rounded border p-2 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {TREND_ICONS[child.mood_trend]}
                      <span className="font-medium">{child.child_name}</span>
                      <span className="text-muted-foreground">
                        {child.placement_days}d · {child.age}yrs
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="tabular-nums font-bold text-[11px]">{child.stability_score}</span>
                      <Badge className={cn("text-[10px]", level.bg, level.text)}>
                        {child.stability_level.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Disruption indicators ──────────────────────────────────── */}

        {intel.disruption_indicators.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Disruption Indicators
            </p>
            {intel.disruption_indicators.slice(0, 4).map((di, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  di.severity === "high"
                    ? "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]"
                    : "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
                )}
              >
                <span className="font-medium">{di.child_name}</span>{" "}
                — {di.detail}
              </div>
            ))}
          </div>
        )}

        {/* ── All clear state ────────────────────────────────────────── */}

        {intel.disruption_indicators.length === 0 && intel.children.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-[--cs-success-soft] bg-[--cs-success-bg] p-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">
              No disruption indicators. All placements stable.
            </span>
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Stability Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
