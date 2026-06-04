"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT STABILITY INTELLIGENCE CARD
// Dashboard card showing placement stability scores, child risk profiles,
// disruption indicators, and ARIA stability intelligence.
// Powered by the Placement Stability Engine — live data (Reg 11/12/14).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, ChevronRight, AlertTriangle, Brain, Loader2,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacementStability } from "@/hooks/use-placement-stability";

// ── Styling ─────────────────────────────────────────────────────────────────

const STABILITY_COLOURS: Record<string, string> = {
  excellent: "bg-green-100 text-green-700",
  good: "bg-green-50 text-green-600",
  moderate: "bg-amber-100 text-amber-700",
  at_risk: "bg-red-100 text-red-700",
  critical: "bg-red-600 text-white",
};

const DISRUPTION_STYLES: Record<string, string> = {
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const MOOD_ICON: Record<string, typeof TrendingUp> = {
  improving: TrendingUp,
  declining: TrendingDown,
  stable: Minus,
  insufficient_data: Minus,
};

// ── Component ────────────────────────────────────────────────────────────────

export function PlacementIntelligenceCard() {
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
          <Link href="/placement-plan" className="text-xs text-brand hover:underline flex items-center gap-1">
            Details <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{m.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", m.average_stability_score >= 70 ? "bg-green-50" : m.average_stability_score >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.average_stability_score >= 70 ? "text-green-600" : m.average_stability_score >= 50 ? "text-amber-600" : "text-red-600")}>
              {Math.round(m.average_stability_score)}
            </p>
            <p className="text-[10px] text-muted-foreground">Stability</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", m.children_at_risk === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.children_at_risk === 0 ? "text-green-600" : "text-amber-600")}>
              {m.children_at_risk}
            </p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{Math.round(m.average_placement_days)}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Stay</p>
          </div>
        </div>

        {/* ── Home metrics bar ─────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium">{m.incident_rate_per_child_30d.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Incidents/child</p>
            </div>
            <div>
              <p className="text-xs font-medium">{m.keywork_frequency_per_child_30d.toFixed(1)}</p>
              <p className="text-[10px] text-muted-foreground">Keywork/child</p>
            </div>
            {m.avg_mood_home !== null && (
              <div>
                <p className="text-xs font-medium">{m.avg_mood_home.toFixed(1)}/10</p>
                <p className="text-[10px] text-muted-foreground">Avg Mood</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Child Stability Profiles ──────────────────────────────────── */}

        {intel.children.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Child Stability Profiles
            </p>
            {intel.children.map((child) => {
              const MoodIcon = MOOD_ICON[child.mood_trend] ?? Minus;
              return (
                <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{child.child_name}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge className={cn("text-[9px] capitalize", STABILITY_COLOURS[child.stability_level])}>
                        {child.stability_level.replace("_", " ")}
                      </Badge>
                      <span className="text-[10px] font-bold tabular-nums">{child.stability_score}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                    <span className="text-[10px]">{child.placement_days}d placed</span>
                    <span className="text-[10px] flex items-center gap-0.5">
                      <MoodIcon className={cn("h-2.5 w-2.5", child.mood_trend === "improving" ? "text-green-500" : child.mood_trend === "declining" ? "text-red-500" : "text-gray-400")} />
                      {child.avg_mood_recent !== null ? `${child.avg_mood_recent.toFixed(1)} mood` : "No mood data"}
                    </span>
                    {child.incident_count_30d > 0 && (
                      <span className="text-[10px] text-red-500">{child.incident_count_30d} incidents</span>
                    )}
                  </div>
                  {(child.risk_factors?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(child.risk_factors ?? []).slice(0, 3).map((rf, i) => (
                        <span key={i} className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                          {rf}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Disruption Indicators ────────────────────────────────────── */}

        {intel.disruption_indicators.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Disruption Indicators
            </p>
            {intel.disruption_indicators.slice(0, 3).map((d, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  DISRUPTION_STYLES[d.severity] ?? DISRUPTION_STYLES.medium,
                )}
              >
                <span className="font-medium">{d.child_name}</span> — {d.detail}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Stability Intelligence ──────────────────────────────── */}

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
