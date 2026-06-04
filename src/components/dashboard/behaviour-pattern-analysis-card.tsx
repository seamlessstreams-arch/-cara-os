"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR PATTERN ANALYSIS INTELLIGENCE CARD
// Dashboard card powered by the Behaviour Intelligence Engine.
// Analyses time patterns, categories, and trajectories.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ChevronRight, AlertTriangle, Brain,
  Clock, BarChart3, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBehaviourIntelligence } from "@/hooks/use-behaviour-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function BehaviourPatternAnalysisCard() {
  const { data, isLoading } = useBehaviourIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Behaviour Patterns
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

  const p = intel.profile;
  const hotspots = intel.time_patterns.filter((tp) => tp.concerning_count > 0).sort((a, b) => b.concerning_count - a.concerning_count);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Behaviour Patterns
          </CardTitle>
          <Link href="/behaviour-mapping" className="text-xs text-brand hover:underline flex items-center gap-1">
            Analysis <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", p.pi_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.pi_count === 0 ? "text-green-600" : "text-red-600")}>{p.pi_count}</p>
            <p className="text-[10px] text-muted-foreground">Restraints</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{p.concerning_count}</p>
            <p className="text-[10px] text-muted-foreground">Concerning</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", p.de_escalation_success_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.de_escalation_success_rate >= 80 ? "text-green-600" : "text-amber-600")}>{p.de_escalation_success_rate}%</p>
            <p className="text-[10px] text-muted-foreground">De-escal.</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{p.total_entries}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}

        {intel.categories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Categories
            </p>
            <div className="space-y-1">
              {intel.categories.filter((c) => c.category !== "positive").slice(0, 5).map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <span className="w-24 truncate capitalize text-muted-foreground">{cat.category.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-300 rounded-full" style={{ width: `${cat.percentage}%` }} />
                  </div>
                  <span className="text-[10px] tabular-nums font-medium w-8 text-right">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Time pattern hotspots ──────────────────────────────────── */}

        {hotspots.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Peak Concern Times
            </p>
            {hotspots.slice(0, 3).map((tp) => (
              <div key={tp.hour_block} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="font-medium">{tp.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{tp.hour_block}</span>
                  <Badge variant="outline" className="text-[10px] border-red-200 text-red-700">
                    {tp.concerning_count} incidents
                  </Badge>
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
              Behaviour Alerts
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

        {/* ── ARIA Behaviour Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Behaviour Intelligence
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
