"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT STABILITY INTELLIGENCE CARD
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
import { usePlacementStability } from "@/hooks/use-placement-stability";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const STABILITY_STYLES: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good:      "bg-blue-100 text-blue-700",
  moderate:  "bg-amber-100 text-amber-700",
  poor:      "bg-red-100 text-red-700",
};

const MOOD_ICON = { improving: TrendingUp, stable: Minus, declining: TrendingDown };
const MOOD_COLOUR = { improving: "text-green-600", stable: "text-blue-600", declining: "text-red-600" };

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
            <p className={cn("text-lg font-bold tabular-nums", hm.average_stability_score >= 70 ? "text-green-600" : "text-amber-600")}>{hm.average_stability_score}</p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{hm.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", hm.avg_mood_home >= 7 ? "bg-green-50" : hm.avg_mood_home >= 5 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", hm.avg_mood_home >= 7 ? "text-green-600" : hm.avg_mood_home >= 5 ? "text-amber-600" : "text-red-600")}>{hm.avg_mood_home}</p>
            <p className="text-[10px] text-muted-foreground">Avg Mood</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", hm.children_at_risk === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", hm.children_at_risk === 0 ? "text-green-600" : "text-red-600")}>{hm.children_at_risk}</p>
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
                  di.severity === "high" || di.severity === "critical" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                <span className="font-medium">{di.child_name}:</span> {di.detail}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Stability Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Stability Intelligence
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
