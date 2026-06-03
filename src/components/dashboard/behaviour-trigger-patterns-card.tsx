"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — BEHAVIOUR TRIGGER & ESCALATION PATTERNS CARD
// Per-child triggers, intensity trajectory and de-escalation coverage. Powered by
// the Behaviour Trigger Pattern Engine (Reg 11 — behaviour management).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ChevronRight, AlertTriangle, Brain, Loader2,
  TrendingUp, TrendingDown, Minus, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBehaviourTriggerPatterns } from "@/hooks/use-behaviour-trigger-patterns";

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};
const LEVEL_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  moderate: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-green-100", text: "text-green-700" },
};
const TRAJECTORY_ICON: Record<string, React.ReactNode> = {
  escalating: <TrendingUp className="h-3 w-3 text-red-500" />,
  improving: <TrendingDown className="h-3 w-3 text-green-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
  insufficient_data: <Minus className="h-3 w-3 text-gray-300" />,
};

export function BehaviourTriggerPatternsCard() {
  const { data, isLoading } = useBehaviourTriggerPatterns();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Behaviour Triggers & Escalation
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

  const o = intel.overview;
  const children = intel.children ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Behaviour Triggers & Escalation
          </CardTitle>
          <Link href="/behaviour-trigger-patterns" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_concerning_90d}</p>
            <p className="text-[10px] text-muted-foreground">Concerns 90d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.escalating_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.escalating_count > 0 ? "text-red-600" : "text-green-600")}>{o.escalating_count}</p>
            <p className="text-[10px] text-muted-foreground">Escalating</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.high_concern_count > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.high_concern_count > 0 ? "text-amber-600" : "text-gray-500")}>{o.high_concern_count}</p>
            <p className="text-[10px] text-muted-foreground">High concern</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{o.avg_reinforcement_ratio}</p>
            <p className="text-[10px] text-muted-foreground">+:concern</p>
          </div>
        </div>

        {/* ── Home-wide top trigger ────────────────────────────────────── */}
        {(o.top_home_triggers ?? [])[0] && (
          <div className="flex items-center gap-2 rounded-lg border p-2.5 text-xs">
            <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-muted-foreground">Most common trigger:</span>
            <span className="font-medium truncate">{o.top_home_triggers[0].trigger}</span>
            <Badge className="text-[9px] bg-amber-100 text-amber-700 ml-auto shrink-0">×{o.top_home_triggers[0].count}</Badge>
          </div>
        )}

        {/* ── Per-child patterns (highest concern first) ───────────────── */}
        {children.length > 0 && (
          <div className="space-y-1.5">
            {children.slice(0, 4).map((c) => {
              const lvl = LEVEL_STYLES[c.concern_level] ?? LEVEL_STYLES.low;
              return (
                <div key={c.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{c.child_name}</span>
                      {TRAJECTORY_ICON[c.intensity_trajectory]}
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", lvl.bg, lvl.text)}>{c.concern_level}</Badge>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {c.concerning_90d} concern{c.concerning_90d === 1 ? "" : "s"} · strategy {c.strategy_coverage_pct}%
                    {c.top_triggers[0] && <span> · trigger: {c.top_triggers[0].trigger}</span>}
                  </div>
                  {c.flags[0] && <p className="text-[10px] text-amber-700 mt-0.5 truncate">⚠ {c.flags[0]}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Behaviour Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Behaviour Pattern Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
