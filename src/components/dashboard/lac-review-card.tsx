"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — LAC REVIEW INTELLIGENCE CARD
// Dashboard card for LAC review tracking, IRO engagement, and outcomes.
// CHR 2015 Reg 45, Care Planning Regs 2010. SCCIF: Well-Led.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  Calendar, Users, CheckCircle2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  total_reviews: 12,
  completed_reviews: 10,
  overdue_reviews: 0,
  scheduled_reviews: 2,
  within_timescale_rate: 90.0,
  child_participation_rate: 100,
  child_views_recorded_rate: 100,
  parent_attendance_rate: 60.0,
  children_reviewed: 5,
  review_coverage: 100,
};

const DEMO_UPCOMING: {
  child: string;
  type: string;
  date: string;
  iro: string;
}[] = [
  { child: "Child A", type: "Subsequent", date: "2026-05-22", iro: "Helen Carter" },
  { child: "Child C", type: "Second", date: "2026-06-03", iro: "Helen Carter" },
];

const DEMO_RECENT: {
  child: string;
  type: string;
  date: string;
  outcome: string;
  participation: string;
  withinTimescale: boolean;
}[] = [
  { child: "Child B", type: "Subsequent", date: "2026-04-28", outcome: "Plan Endorsed", participation: "Attended & Spoke", withinTimescale: true },
  { child: "Child D", type: "Subsequent", date: "2026-04-15", outcome: "Plan Amended", participation: "Written Views", withinTimescale: true },
  { child: "Child E", type: "Initial", date: "2026-03-20", outcome: "Plan Endorsed", participation: "Attended & Spoke", withinTimescale: false },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "review_upcoming", severity: "medium", message: "LAC review for Child A due 22/05 — ensure preparation complete, all parties invited, and child's views gathered." },
  { type: "review_upcoming", severity: "medium", message: "Second LAC review for Child C due 03/06 — within statutory 3-month window from initial review." },
];

const ARIA_INSIGHTS = [
  "12 LAC reviews recorded, 10 completed. 0 overdue. 90% within statutory timescale. 100% child participation and views recorded. 60% parent attendance rate. All 5 children have been reviewed.",
  "Strength: 100% child participation — all children either attended and spoke or provided written views. Gap: Parent attendance at 60% — consider strategies to improve engagement (virtual attendance, flexible scheduling).",
  "1 review (Child E initial) was outside timescale — root cause was delayed IRO allocation. 2 upcoming reviews in next 3 weeks. All care plans current and endorsed or appropriately amended.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function LacReviewCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            LAC Reviews
          </CardTitle>
          <Link href="/lac-reviews" className="text-xs text-brand hover:underline flex items-center gap-1">
            Reviews <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", m.overdue_reviews === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_reviews === 0 ? "text-green-600" : "text-red-600")}>
              {m.overdue_reviews}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.within_timescale_rate >= 95 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.within_timescale_rate >= 95 ? "text-green-600" : "text-amber-600")}>
              {m.within_timescale_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">On Time</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.child_participation_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.child_participation_rate >= 100 ? "text-green-600" : "text-amber-600")}>
              {m.child_participation_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Participation</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.scheduled_reviews}</p>
            <p className="text-[10px] text-muted-foreground">Upcoming</p>
          </div>
        </div>

        {/* ── Upcoming reviews ────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Upcoming Reviews
          </p>
          <div className="space-y-1">
            {DEMO_UPCOMING.map((r) => (
              <div key={r.child} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{r.child}</span>
                  <span className="text-muted-foreground"> — {r.type}</span>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div>{r.date}</div>
                  <div className="text-muted-foreground text-[10px]">IRO: {r.iro}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent completed reviews ─────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Recent Reviews
          </p>
          <div className="space-y-1">
            {DEMO_RECENT.map((r) => (
              <div key={`${r.child}-${r.date}`} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium">{r.child}</span>
                  {r.withinTimescale && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                  {!r.withinTimescale && <Clock className="h-3 w-3 text-amber-500 shrink-0" />}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-muted-foreground">{r.date}</span>
                  <Badge variant="outline" className={cn(
                    "text-[10px]",
                    r.outcome === "Plan Endorsed"
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-blue-700 bg-blue-50 border-blue-200",
                  )}>
                    {r.outcome}
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
              Review Alerts
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
            ARIA Review Intelligence
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
