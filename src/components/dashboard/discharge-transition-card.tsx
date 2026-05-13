"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DISCHARGE & TRANSITION INTELLIGENCE CARD
// Dashboard card for discharge planning and transition readiness.
// CHR 2015 Reg 36/37. Children Act 1989 s23C.
// SCCIF: Overall Experiences — "Transitions are well planned."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightCircle, ChevronRight, AlertTriangle, Brain,
  Home, CheckCircle2, User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_METRICS = {
  total_reviews: 6,
  fully_ready_count: 2,
  not_ready_count: 1,
  overdue_reviews: 1,
  child_views_rate: 66.7,
  education_plan_rate: 50.0,
  life_story_rate: 33.3,
  unplanned_breakdowns: 1,
};

const DEMO_REVIEWS: { child: string; reason: string; readiness: string; date: string }[] = [
  { child: "Child D", reason: "Reunification", readiness: "Fully Ready", date: "2026-06-01" },
  { child: "Child E", reason: "Semi-Independence", readiness: "Mostly Ready", date: "2026-07-15" },
  { child: "Child F", reason: "Foster Care", readiness: "Partially Ready", date: "2026-08-01" },
  { child: "Child G", reason: "Aged Out", readiness: "Not Ready", date: "2026-06-10" },
  { child: "Child B", reason: "Unplanned Breakdown", readiness: "Not Assessed", date: "2026-05-01" },
  { child: "Child A", reason: "Transfer", readiness: "Fully Ready", date: "2026-05-20" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium"; message: string }[] = [
  { type: "not_ready", severity: "critical", message: "Child G is not ready for discharge (planned 2026-06-10) — review plan urgently." },
  { type: "unplanned_breakdown", severity: "high", message: "Child B's placement ended as unplanned breakdown — conduct disruption review and identify learning." },
  { type: "child_views_missing", severity: "medium", message: "Child F's views not recorded for discharge planning — ensure participation in transition planning." },
];

const ARIA_INSIGHTS = [
  "6 discharge reviews: 2 fully ready, 1 not ready. 1 overdue review. Child views: 66.7%. Education plans: 50%. Life story work: 33.3%. 1 unplanned breakdown.",
  "Priority: Child G is not ready for discharge in 4 weeks — escalate with social worker. Child B's breakdown needs disruption review. Life story work only at 33.3% — every child leaving should have completed life story.",
  "Positive: Child D's reunification well prepared (fully ready). Child E progressing well towards semi-independence. Education plan rate needs increasing to 100% before any discharge. Goodbye events should be offered to all children leaving.",
];

const READINESS_BADGES: Record<string, { label: string; color: string }> = {
  "Fully Ready": { label: "Ready", color: "text-green-700 bg-green-50 border-green-200" },
  "Mostly Ready": { label: "Mostly", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  "Partially Ready": { label: "Partial", color: "text-amber-700 bg-amber-50 border-amber-200" },
  "Not Ready": { label: "Not Ready", color: "text-red-700 bg-red-50 border-red-200" },
  "Not Assessed": { label: "Pending", color: "text-gray-700 bg-gray-50 border-gray-200" },
};

export function DischargeTransitionCard() {
  const m = DEMO_METRICS;
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-brand" />
            Discharge & Transition
          </CardTitle>
          <Link href="/discharge-transition" className="text-xs text-brand hover:underline flex items-center gap-1">
            Transitions <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">{m.fully_ready_count}</p>
            <p className="text-[10px] text-muted-foreground">Ready</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.not_ready_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.not_ready_count === 0 ? "text-green-600" : "text-red-600")}>{m.not_ready_count}</p>
            <p className="text-[10px] text-muted-foreground">Not Ready</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.overdue_reviews === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.overdue_reviews === 0 ? "text-green-600" : "text-amber-600")}>{m.overdue_reviews}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.unplanned_breakdowns === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.unplanned_breakdowns === 0 ? "text-green-600" : "text-red-600")}>{m.unplanned_breakdowns}</p>
            <p className="text-[10px] text-muted-foreground">Breakdowns</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Home className="h-3 w-3" />Discharge Plans</p>
          <div className="space-y-1">
            {DEMO_REVIEWS.map((dr, i) => {
              const badge = READINESS_BADGES[dr.readiness] ?? READINESS_BADGES["Not Assessed"];
              return (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <CheckCircle2 className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{dr.child}</span>
                    <span className="text-muted-foreground truncate">{dr.reason} · {dr.date}</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>{badge.label}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Transition Alerts</p>
            {DEMO_ALERTS.map((a, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", a.severity === "critical" || a.severity === "high" ? "border-red-200 bg-red-50 text-red-800" : "border-amber-200 bg-amber-50 text-amber-800")}>{a.message}</div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700"><Brain className="h-3 w-3" />ARIA Transition Intelligence</p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", i === 0 ? "border-blue-200 bg-blue-50 text-blue-800" : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-green-200 bg-green-50 text-green-800")}>{insight}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
