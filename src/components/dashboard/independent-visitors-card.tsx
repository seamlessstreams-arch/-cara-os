"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDEPENDENT VISITORS INTELLIGENCE CARD
// Dashboard card for IV assignments, visit tracking, child engagement,
// and ARIA independent visitor intelligence.
// Children Act 1989 s23ZB, CHR 2015 Reg 44, IRO Handbook 2010.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, ChevronRight, AlertTriangle, Brain,
  Calendar, MessageSquare, Heart, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  children_with_iv: 3,
  total_children: 5,
  active_assignments: 3,
  overdue_visits: 1,
  visits_this_quarter: 8,
  avg_visit_duration: 55,
  child_attendance_rate: 88,
  concerns_raised: 1,
};

const DEMO_ASSIGNMENTS = [
  { child: "Child A", visitor: "P. Morgan", frequency: "Monthly", last_visit: "2026-05-05", overdue: false },
  { child: "Child B", visitor: "R. Singh", frequency: "Fortnightly", last_visit: "2026-04-28", overdue: true },
  { child: "Child D", visitor: "L. Williams", frequency: "Monthly", last_visit: "2026-05-10", overdue: false },
];

const DEMO_VISIT_TYPES = [
  { type: "In Person", count: 5 },
  { type: "Activity Outing", count: 2 },
  { type: "Phone Call", count: 1 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue_visit", severity: "high", message: "Child B's IV visit is overdue by 5 days. R. Singh (fortnightly frequency). Contact the IV to reschedule urgently." },
  { type: "child_wishes", severity: "medium", message: "2 of 8 visits this quarter did not record the child's wishes and feelings. Ensure IV records child's views at every visit." },
];

const ARIA_INSIGHTS = [
  "Child B's IV visit overdue — R. Singh has fortnightly schedule, last visit 28 April. This is the second consecutive late visit. Contact R. Singh to understand barriers and consider whether a different visiting pattern would be more sustainable.",
  "1 concern raised this quarter by P. Morgan (Child A's IV) regarding Child A's anxiety about upcoming LAC review. Concern was escalated to the social worker. Cross-reference with Child A's CAMHS engagement and advocate involvement — multi-agency response coordinated.",
  "Overall: 3/5 children have IVs assigned (Child C and Child E assessed as not requiring — both have regular family contact). 8 visits this quarter, 88% attendance. Average duration 55 minutes. All IVs have current DBS checks. Most visits in-person (63%). Child satisfaction consistently positive.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function IndependentVisitorsCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand" />
            Independent Visitors
          </CardTitle>
          <Link href="/independent-visitors" className="text-xs text-brand hover:underline flex items-center gap-1">
            Assignments <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.children_with_iv}</p>
            <p className="text-[10px] text-muted-foreground">With IV</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.visits_this_quarter}</p>
            <p className="text-[10px] text-muted-foreground">Visits (Q)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.child_attendance_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.child_attendance_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {m.child_attendance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Attendance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_visits === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_visits === 0 ? "text-green-600" : "text-red-600")}>
              {m.overdue_visits}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Assignments ─────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3" />
            Active Assignments
          </p>
          {DEMO_ASSIGNMENTS.map((a) => (
            <div key={a.child} className="rounded border p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">{a.child}</span>
                <Badge variant="outline" className="text-[10px]">{a.frequency}</Badge>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>IV: {a.visitor}</span>
                <Badge className={cn(
                  "text-[10px]",
                  a.overdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700",
                )}>
                  <Calendar className="h-2.5 w-2.5 mr-0.5" />
                  {a.overdue ? "Overdue" : new Date(a.last_visit).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Visit types ─────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <MessageSquare className="h-3 w-3 text-blue-500" />
            Visit Types This Quarter
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_VISIT_TYPES.map((v) => (
              <div key={v.type} className="text-center rounded border p-2">
                <p className="text-sm font-bold tabular-nums text-blue-600">{v.count}</p>
                <p className="text-[10px] text-muted-foreground">{v.type}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Avg duration
            </span>
            <span className="font-bold tabular-nums text-blue-600">{m.avg_visit_duration} min</span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              IV Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA IV Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
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
