"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT STABILITY INTELLIGENCE CARD
// Dashboard card powered by the Placement Stability Intelligence Engine.
// CHR 2015 Reg 5/11/36. SCCIF: Overall Experiences — Stability & belonging.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, ChevronRight, AlertTriangle, Brain,
  Users, TrendingUp, TrendingDown, Minus, Loader2,
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

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const STABILITY_STYLES: Record<string, string> = {
  excellent: "bg-[--cs-success-bg] text-[--cs-success]",
  good:      "bg-[--cs-info-bg] text-[--cs-info]",
  moderate:  "bg-[--cs-warning-bg] text-[--cs-warning]",
  poor:      "bg-[--cs-risk-bg] text-[--cs-risk]",
};

const MOOD_ICON = { improving: TrendingUp, stable: Minus, declining: TrendingDown };
const MOOD_COLOUR = { improving: "text-[--cs-success]", stable: "text-blue-600", declining: "text-[--cs-risk]" };

// ── Component ───────────────────────────────────────────────────────────────

export function PlacementStabilityIntelligenceCard() {
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

  const hm = intel.home_metrics;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4 text-brand" />
            Placement Stability
          </CardTitle>
          <Link href="/placement-plan" className="text-xs text-brand hover:underline flex items-center gap-1">
            Placements <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", hm.average_stability_score >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", hm.average_stability_score >= 70 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{hm.average_stability_score}</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{hm.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", hm.avg_mood_home == null ? "bg-slate-50" : hm.avg_mood_home >= 7 ? "bg-green-50" : hm.avg_mood_home >= 5 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", hm.avg_mood_home == null ? "text-slate-500" : hm.avg_mood_home >= 7 ? "text-[--cs-success]" : hm.avg_mood_home >= 5 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{hm.avg_mood_home ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", hm.children_at_risk === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", hm.children_at_risk === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{hm.children_at_risk}</p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
        </div>

        {/* ── Child stability profiles ────────────────────────────────── */}

        {intel.children.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Stability
            </p>
            {intel.children.map((child) => {
              const MoodIcon = MOOD_ICON[child.mood_trend as keyof typeof MOOD_ICON] ?? Minus;
              return (
                <div key={child.child_id} className="rounded border p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.child_name}</span>
                      <MoodIcon className={cn("h-3 w-3", MOOD_COLOUR[child.mood_trend as keyof typeof MOOD_COLOUR] ?? "text-gray-400")} />
                    </div>
                    <Badge className={cn("text-[10px]", STABILITY_STYLES[child.stability_level] ?? STABILITY_STYLES.moderate)}>
                      {child.stability_score}/100
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>{child.placement_days}d placed · Mood {child.avg_mood_recent}/10</span>
                    <span>{child.incident_count_30d} incidents/30d</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Disruption indicators ──────────────────────────────────── */}

        {intel.disruption_indicators.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Disruption Indicators
            </p>
            {intel.disruption_indicators.map((di, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  di.severity === "high" ? "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]" : "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
                )}
              >
                <span className="font-medium">{di.child_name}:</span> {di.detail}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara Stability Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Stability Intelligence
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
