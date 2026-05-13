"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ACTIVITY PLANNING INTELLIGENCE CARD
// Dashboard card for activities, participation, enjoyment, and engagement.
// CHR 2015 Reg 9/6/7. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Palette, ChevronRight, AlertTriangle, Brain,
  Star, Users, Calendar, CheckCircle2, Smile,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_activities: 18,
  completed_activities: 12,
  upcoming_activities: 4,
  full_participation_rate: 72.5,
  enjoyment_positive_rate: 85.0,
  children_participating: 5,
  participation_coverage: 100,
  risk_assessed_rate: 88.9,
  total_cost: 345.00,
};

const DEMO_UPCOMING: {
  title: string;
  category: string;
  date: string;
  riskAssessed: boolean;
  external: boolean;
}[] = [
  { title: "Swimming — local leisure centre", category: "Sport & Fitness", date: "2026-05-15", riskAssessed: true, external: true },
  { title: "Art workshop — self-portraits", category: "Creative Arts", date: "2026-05-16", riskAssessed: true, external: false },
  { title: "Community litter pick", category: "Community & Volunteering", date: "2026-05-17", riskAssessed: false, external: false },
  { title: "Cinema trip — evening outing", category: "Social Outing", date: "2026-05-18", riskAssessed: true, external: true },
];

const DEMO_ENJOYMENT = [
  { child: "Child A", activitiesCompleted: 10, favouriteCategory: "Sport & Fitness", enjoymentAvg: "Loved It" },
  { child: "Child B", activitiesCompleted: 8, favouriteCategory: "Creative Arts", enjoymentAvg: "Enjoyed" },
  { child: "Child C", activitiesCompleted: 5, favouriteCategory: "Cooking & Baking", enjoymentAvg: "Enjoyed" },
  { child: "Child D", activitiesCompleted: 9, favouriteCategory: "Outdoor Adventure", enjoymentAvg: "Loved It" },
  { child: "Child E", activitiesCompleted: 7, favouriteCategory: "Music", enjoymentAvg: "Enjoyed" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "not_risk_assessed", severity: "high", message: "Community litter pick (17/05) has not been risk assessed — complete before activity takes place." },
  { type: "follow_up_pending", severity: "medium", message: "2 activity participations require follow-up action — review observations from cooking session and swimming." },
];

const ARIA_INSIGHTS = [
  "18 activities this period, 12 completed. 72.5% full participation rate. 85% positive enjoyment ratings. 100% of children have participated in activities. 88.9% risk-assessed.",
  "Activity mix is well-diversified: sport, creative arts, cooking, outdoor adventure, community, social, and music represented. All children engaged. Child C shows lower participation (5 activities) — consider preferred activity scheduling.",
  "Strengths: Strong enjoyment scores, good variety, children's preferences reflected in planning. Action needed: Risk assessment outstanding for 1 upcoming activity. 2 follow-ups pending from recent sessions.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function ActivityPlanningCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4 text-brand" />
            Activity Planning
          </CardTitle>
          <Link href="/activity-planning" className="text-xs text-brand hover:underline flex items-center gap-1">
            Activities <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.upcoming_activities}</p>
            <p className="text-[10px] text-muted-foreground">Upcoming</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.full_participation_rate >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.full_participation_rate >= 70 ? "text-green-600" : "text-amber-600")}>
              {m.full_participation_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Joined</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.enjoyment_positive_rate >= 75 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.enjoyment_positive_rate >= 75 ? "text-green-600" : "text-amber-600")}>
              {m.enjoyment_positive_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Enjoyed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.participation_coverage >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.participation_coverage >= 100 ? "text-green-600" : "text-amber-600")}>
              {m.participation_coverage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
        </div>

        {/* ── Upcoming activities ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Upcoming Activities
          </p>
          <div className="space-y-1">
            {DEMO_UPCOMING.map((a) => (
              <div key={a.title} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{a.title}</span>
                  {a.riskAssessed && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  {!a.riskAssessed && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground">{a.date}</span>
                  {a.external && <Badge variant="outline" className="text-[10px] text-blue-700 bg-blue-50 border-blue-200">External</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Child enjoyment ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Smile className="h-3 w-3" />
            Children&apos;s Enjoyment
          </p>
          <div className="space-y-1">
            {DEMO_ENJOYMENT.map((c) => (
              <div key={c.child} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium">{c.child}</span>
                  <span className="text-muted-foreground">{c.activitiesCompleted} activities</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground">{c.favouriteCategory}</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    c.enjoymentAvg === "Loved It"
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-blue-700 bg-blue-50 border-blue-200",
                  )}>
                    {c.enjoymentAvg}
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
              Activity Alerts
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
            ARIA Activity Intelligence
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
