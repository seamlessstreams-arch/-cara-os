"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ADMISSION ASSESSMENT CARD
// Live data from usePlacementStability() — home metrics, children.
// CHR 2015 Reg 36. SCCIF: Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacementStability } from "@/hooks/use-placement-stability";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function AdmissionAssessmentCard() {
  const { data, isLoading } = usePlacementStability();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Admission Assessment
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

  const { home_metrics, children } = intel;
  const criticalChildren = children.filter((c) => c.stability_level === "critical").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Admission Assessment
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
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", home_metrics.average_stability_score >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", home_metrics.average_stability_score >= 70 ? "text-green-600" : "text-amber-600")}>{home_metrics.average_stability_score}%</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", home_metrics.children_at_risk === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", home_metrics.children_at_risk === 0 ? "text-green-600" : "text-amber-600")}>{home_metrics.children_at_risk}</p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", criticalChildren === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", criticalChildren === 0 ? "text-green-600" : "text-red-600")}>{criticalChildren}</p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold">Home Metrics</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Avg placement:</span>{" "}
              <span className="font-semibold">{home_metrics.average_placement_days}d</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Incident rate:</span>{" "}
              <span className="font-semibold">{home_metrics.incident_rate_per_child_30d}/child</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Keywork freq:</span>{" "}
              <span className="font-semibold">{home_metrics.keywork_frequency_per_child_30d}/child</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Breakdown risk:</span>{" "}
              <span className="font-semibold">{home_metrics.placement_breakdown_risk}%</span>
            </div>
          </div>
        </div>

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Placement Intelligence
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
