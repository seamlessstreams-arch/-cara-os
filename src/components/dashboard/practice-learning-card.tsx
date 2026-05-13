"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PRACTICE LEARNING INTELLIGENCE CARD
// Dashboard card for learning from incidents, reviews, and continuous
// improvement tracking.
// CHR 2015 Reg 45/13/40. SCCIF: Well-Led — Learning Culture.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Clock, Target, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_events: 12,
  events_this_quarter: 5,
  critical_events: 1,
  total_actions: 18,
  actions_completed: 11,
  actions_overdue: 2,
  actions_in_progress: 3,
  completion_rate: 64.7,
  shared_with_team_rate: 83.3,
  avg_learning_points: 2.8,
  impact_positive: 9,
  impact_not_assessed: 3,
};

const DEMO_EVENTS: {
  title: string;
  source: string;
  priority: string;
  learningPoints: number;
  sharedWithTeam: boolean;
  actionsComplete: number;
  actionsTotal: number;
}[] = [
  { title: "Medication near miss — double dose", source: "Near Miss", priority: "critical", learningPoints: 4, sharedWithTeam: true, actionsComplete: 2, actionsTotal: 3 },
  { title: "Restraint debrief — bedroom escalation", source: "Incident", priority: "high", learningPoints: 3, sharedWithTeam: true, actionsComplete: 1, actionsTotal: 2 },
  { title: "Reg 44 visitor feedback — privacy", source: "Reg 44 Visit", priority: "medium", learningPoints: 2, sharedWithTeam: true, actionsComplete: 2, actionsTotal: 2 },
  { title: "Child feedback — bedtime routines", source: "Child Feedback", priority: "medium", learningPoints: 2, sharedWithTeam: false, actionsComplete: 0, actionsTotal: 1 },
  { title: "Ofsted area for improvement — records", source: "Ofsted Inspection", priority: "high", learningPoints: 3, sharedWithTeam: true, actionsComplete: 1, actionsTotal: 3 },
];

const DEMO_OVERDUE_ACTIONS = [
  { action: "Revise medication administration protocol", responsible: "Sarah Mitchell", targetDate: "2026-04-28", event: "Medication near miss" },
  { action: "Update record-keeping template", responsible: "James Taylor", targetDate: "2026-05-01", event: "Ofsted area for improvement" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "action_overdue", severity: "high", message: "2 learning actions are overdue — medication protocol revision (Sarah Mitchell) and record template update (James Taylor). Escalate to supervision." },
  { type: "learning_not_shared", severity: "medium", message: "Child feedback on bedtime routines has not been shared with team — schedule for next team meeting." },
  { type: "no_impact_assessment", severity: "medium", message: "3 completed actions have not had their impact assessed — review whether changes have improved practice." },
];

const ARIA_INSIGHTS = [
  "12 learning events captured, 5 this quarter. 64.7% of actions completed (11/17 active). 83.3% of learning shared with team. Average 2.8 learning points per event. 9 actions show positive impact on practice.",
  "Priority: 1 critical event (medication near miss) has 1 outstanding action — protocol revision overdue by 15 days. Ofsted improvement actions tracking behind schedule (1/3 complete). Recommend escalation to RI supervision.",
  "Learning culture trend: Sources are well-diversified (incidents, Reg 44 visits, child feedback, Ofsted). Team sharing rate is strong at 83%. Gap: impact assessment not completed for 3 actions — embed 'measure the change' into action closure process.",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const PRIORITY_BADGES: Record<string, { label: string; color: string }> = {
  critical: { label: "Critical", color: "text-red-700 bg-red-50 border-red-200" },
  high: { label: "High", color: "text-orange-700 bg-orange-50 border-orange-200" },
  medium: { label: "Medium", color: "text-blue-700 bg-blue-50 border-blue-200" },
  low: { label: "Low", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

// ── Component ────────────────────────────────────────────────────────────────

export function PracticeLearningCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            Practice Learning
          </CardTitle>
          <Link href="/practice-learning" className="text-xs text-brand hover:underline flex items-center gap-1">
            Learning <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.events_this_quarter}</p>
            <p className="text-[10px] text-muted-foreground">This Qtr</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.completion_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.completion_rate >= 80 ? "text-green-600" : "text-amber-600")}>
              {m.completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.shared_with_team_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.shared_with_team_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {m.shared_with_team_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Shared</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.actions_overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.actions_overdue === 0 ? "text-green-600" : "text-red-600")}>
              {m.actions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Recent learning events ──────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Target className="h-3 w-3" />
            Recent Learning Events
          </p>
          <div className="space-y-1">
            {DEMO_EVENTS.map((ev) => {
              const badge = PRIORITY_BADGES[ev.priority] ?? PRIORITY_BADGES.medium;
              const allDone = ev.actionsComplete === ev.actionsTotal;
              return (
                <div key={ev.title} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-medium truncate">{ev.title}</span>
                    {ev.sharedWithTeam && <Users className="h-3 w-3 text-green-500 shrink-0" />}
                    {allDone && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-muted-foreground">{ev.actionsComplete}/{ev.actionsTotal}</span>
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Overdue actions ─────────────────────────────────────────── */}

        {DEMO_OVERDUE_ACTIONS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Overdue Actions
            </p>
            {DEMO_OVERDUE_ACTIONS.map((a, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs leading-relaxed text-red-800">
                <span className="font-medium">{a.action}</span>
                <span className="text-red-600"> — {a.responsible}</span>
                <span className="text-red-500"> (due {a.targetDate})</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Learning Alerts
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
            ARIA Learning Intelligence
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
