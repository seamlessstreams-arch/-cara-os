"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S ASPIRATIONS & GOALS INTELLIGENCE CARD
// Live data from usePlacementStability() — home metrics, children.
// CHR 2015 Reg 6/7/12. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Star, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacementStability } from "@/hooks/use-placement-stability";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function ChildrensAspirationsGoalsCard() {
  const { data, isLoading } = usePlacementStability();
  const d = data?.data;
  const metrics = d?.home_metrics;

  if (isLoading || !d) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Star className="h-4 w-4 text-brand" />
            Aspirations & Goals
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
            <Star className="h-4 w-4 text-brand" />
            Aspirations & Goals
          </CardTitle>
          <Link href="/child-aspirations-tracker" className="text-xs text-brand hover:underline flex items-center gap-1">
            Goals <ChevronRight className="h-3 w-3" />
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
            <p className={cn("text-lg font-bold tabular-nums", (metrics?.average_stability_score ?? 0) >= 70 ? "text-green-600" : "text-amber-600")}>{metrics?.average_stability_score ?? 0}%</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (metrics?.children_at_risk ?? 0) === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (metrics?.children_at_risk ?? 0) === 0 ? "text-green-600" : "text-amber-600")}>{metrics?.children_at_risk ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{metrics?.keywork_frequency_per_child_30d ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Keywork/m</p>
          </div>
        </div>

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {(d?.insights ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Aspirations Intelligence
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
