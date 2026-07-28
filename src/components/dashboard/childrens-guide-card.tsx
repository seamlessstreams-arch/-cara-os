"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S GUIDE INTELLIGENCE CARD
// Live data from usePlacementStability() — home metrics, children.
// CHR 2015 Reg 16(2), Reg 16(3). SCCIF: Children's Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BookHeart, ChevronRight, Brain, Loader2,
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

export function ChildrensGuideCard() {
  const { data, isLoading } = usePlacementStability();
  const d = data?.data;
  const metrics = d?.home_metrics;

  if (isLoading || !d) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookHeart className="h-4 w-4 text-brand" />
            Children&apos;s Guide
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

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookHeart className="h-4 w-4 text-brand" />
            Children&apos;s Guide
          </CardTitle>
          <Link href="/childrens-guide" className="text-xs text-brand hover:underline flex items-center gap-1">
            Guide <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{metrics?.total_children ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (metrics?.average_stability_score ?? 0) >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (metrics?.average_stability_score ?? 0) >= 70 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{metrics?.average_stability_score ?? 0}%</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{(metrics?.avg_mood_home ?? 0).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{metrics?.average_placement_days ?? 0}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Place</p>
          </div>
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {(d?.insights ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Guide Intelligence
            </p>
            {(d?.insights ?? []).slice(0, 2).map((insight, i) => (
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
