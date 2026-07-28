"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — RELIGIOUS CULTURAL OBSERVANCE CARD
// Live data from placement intelligence engine.
// CHR 2015 Reg 12, Reg 34. SCCIF: Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Brain, ChevronRight, Heart, Loader2,
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

export function ReligiousCulturalObservanceCard() {
  const { data, isLoading } = usePlacementStability();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  const insights = d?.insights ?? [];

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-slate-600" />
            <span className="text-slate-900">Religious & Cultural</span>
          </CardTitle>
          <Link href="/placement-plan" className="text-xs text-slate-600 hover:underline flex items-center gap-1">
            View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-slate-50 p-2">
            <p className="text-lg font-bold tabular-nums text-slate-600">{d?.home_metrics?.total_children ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{Math.round(d?.home_metrics?.average_stability_score ?? 0)}%</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (d?.home_metrics?.children_at_risk ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (d?.home_metrics?.children_at_risk ?? 0) > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{d?.home_metrics?.children_at_risk ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{(d?.home_metrics?.avg_mood_home ?? 0).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Mood</p>
          </div>
        </div>

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Religious & Cultural Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
