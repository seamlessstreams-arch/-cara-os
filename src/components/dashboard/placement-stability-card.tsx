"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT STABILITY INTELLIGENCE CARD
// Dashboard card for placement moves, stability tracking, and disruption
// meeting outcomes.
// CHR 2015 Reg 36/8/9. SCCIF: Overall Experiences — Stability.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Home, ChevronRight, AlertTriangle, Brain,
  ArrowRightLeft, CheckCircle2, AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_moves: 8,
  planned_moves: 5,
  unplanned_moves: 3,
  planned_rate: 62.5,
  breakdowns: 2,
  average_placement_duration: 187,
  disruption_meeting_rate: 75.0,
  child_views_sought_rate: 87.5,
  children_with_multiple_moves: 2,
};

const DEMO_MOVES: {
  child: string;
  date: string;
  type: string;
  reason: string;
  planned: boolean;
  disruptionMeeting: boolean;
}[] = [
  { child: "Child A", date: "2026-04-15", type: "Residential", reason: "Planned Transition", planned: true, disruptionMeeting: false },
  { child: "Child C", date: "2026-03-20", type: "Residential", reason: "Placement Breakdown", planned: false, disruptionMeeting: true },
  { child: "Child B", date: "2026-02-10", type: "Foster Care", reason: "Closer to Family", planned: true, disruptionMeeting: false },
  { child: "Child D", date: "2026-01-05", type: "Residential", reason: "Escalation of Need", planned: false, disruptionMeeting: true },
  { child: "Child C", date: "2025-11-12", type: "Foster Care", reason: "Placement Breakdown", planned: false, disruptionMeeting: true },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "instability_pattern", severity: "critical", message: "Child C has had 3 placement moves — significant instability, review permanence plan urgently." },
  { type: "placement_breakdown", severity: "high", message: "Placement breakdown for Child C on 2026-03-20 — ensure disruption meeting is held and lessons learned are documented." },
  { type: "views_not_sought", severity: "medium", message: "Child's views not sought for placement move of Child A (2026-04-15) — children's wishes and feelings must be recorded." },
];

const ARIA_INSIGHTS = [
  "8 placement moves recorded. 62.5% planned (target: 80%+). 2 placement breakdowns. Average placement duration: 187 days. Disruption meetings held for 75% of moves. Child views sought in 87.5% of cases. 2 children with multiple moves.",
  "Concern: Child C has had 3 moves including 2 breakdowns — pattern of instability requiring urgent permanence planning. The planned move rate (62.5%) is below best practice. Consider what additional support could prevent breakdowns.",
  "Positive: Child views sought rate is strong (87.5%). Disruption meetings are mostly happening (75%). Recommendation: Ensure all unplanned moves trigger a disruption meeting within 5 working days. Review matching processes to improve placement stability.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function PlacementStabilityCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Home className="h-4 w-4 text-brand" />
            Placement Stability
          </CardTitle>
          <Link href="/placement-stability" className="text-xs text-brand hover:underline flex items-center gap-1">
            Stability <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.total_moves}</p>
            <p className="text-[10px] text-muted-foreground">Total Moves</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.planned_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.planned_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {m.planned_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Planned</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.breakdowns === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.breakdowns === 0 ? "text-green-600" : "text-red-600")}>
              {m.breakdowns}
            </p>
            <p className="text-[10px] text-muted-foreground">Breakdowns</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.average_placement_duration}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
        </div>

        {/* ── Move history ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ArrowRightLeft className="h-3 w-3" />
            Placement Moves
          </p>
          <div className="space-y-1">
            {DEMO_MOVES.map((mv, i) => (
              <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {mv.planned ? (
                    <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3 w-3 text-red-500 shrink-0" />
                  )}
                  <span className="font-medium">{mv.child}</span>
                  <span className="text-muted-foreground truncate">{mv.reason}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground">{mv.date}</span>
                  <Badge variant="outline" className={cn("text-[10px]", mv.planned ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200")}>
                    {mv.planned ? "Planned" : "Unplanned"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Stability Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Stability Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
