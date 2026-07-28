"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — PLACEMENT MATCHING ASSESSMENT CARD
// Live data from usePlacementStability() — children, disruption indicators.
// CHR 2015 Reg 36. SCCIF: Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Puzzle, ChevronRight, Brain, Loader2,
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

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function PlacementMatchingAssessmentCard() {
  const { data, isLoading } = usePlacementStability();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Puzzle className="h-4 w-4 text-brand" />
            Placement Matching
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

  const { home_metrics, children, disruption_indicators } = intel;
  const highDisruption = disruption_indicators.filter((d) => d.severity === "high").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Puzzle className="h-4 w-4 text-brand" />
            Placement Matching
          </CardTitle>
          <Link href="/placement-plan" className="text-xs text-brand hover:underline flex items-center gap-1">
            Placements <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{home_metrics.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Placed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", home_metrics.average_stability_score >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", home_metrics.average_stability_score >= 70 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{home_metrics.average_stability_score}%</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", highDisruption === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", highDisruption === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{highDisruption}</p>
            <p className="text-[10px] text-muted-foreground">High Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{disruption_indicators.length}</p>
            <p className="text-[10px] text-muted-foreground">Indicators</p>
          </div>
        </div>

        {/* ── Disruption indicators ───────────────────────────────────── */}

        {disruption_indicators.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Disruption Indicators</p>
            {disruption_indicators.slice(0, 3).map((d, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{d.child_name}</span>
                <Badge className={cn("text-[9px]", d.severity === "high" ? "bg-[--cs-risk-bg] text-[--cs-risk]" : d.severity === "medium" ? "bg-[--cs-warning-bg] text-[--cs-warning]" : "bg-[--cs-info-bg] text-[--cs-info]")}>
                  {d.indicator}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Matching Intelligence
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
