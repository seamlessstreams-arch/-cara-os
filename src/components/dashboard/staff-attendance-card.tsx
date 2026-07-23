"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF ATTENDANCE & STAFFING INTELLIGENCE CARD
// Dashboard card for shift coverage, overtime, agency usage, and supervision.
// Powered by the Workforce Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarClock, ChevronRight, Brain, Loader2,
  CheckCircle2, Clock, Users, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffAttendanceCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand" />
            Staff Attendance
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

  const st = intel.staffing;
  const sup = intel.supervision;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-brand" />
            Staff Attendance
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", meets(st.coverage_rate, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(st.coverage_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(st.coverage_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {st.shifts_filled}/{st.shifts_this_week}
            </p>
            <p className="text-[10px] text-muted-foreground">Filled</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", st.shifts_unfilled === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", st.shifts_unfilled === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {st.shifts_unfilled}
            </p>
            <p className="text-[10px] text-muted-foreground">Unfilled</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", st.overtime_hours_this_month === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", st.overtime_hours_this_month === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {st.overtime_hours_this_month}h
            </p>
            <p className="text-[10px] text-muted-foreground">Overtime</p>
          </div>
        </div>

        {/* ── Staffing details ────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Staffing Details
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">No-shows this month</span>
            <span className="font-semibold tabular-nums">{st.no_shows_this_month}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Shifts this week</span>
            <span className="font-semibold tabular-nums">{st.shifts_this_week}</span>
          </div>
          {/* Coverage bar */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span>Coverage</span>
              <span className="tabular-nums">{formatRate(st.coverage_rate)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", meets(st.coverage_rate, 90) ? "bg-green-400" : meets(st.coverage_rate, 75) ? "bg-amber-400" : "bg-red-400")}
                style={{ width: `${Math.min(st.coverage_rate ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Supervision compliance ─────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Users className={cn("h-4 w-4", sup.overdue > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Supervision</p>
              <p className="text-[10px] text-muted-foreground">
                {sup.up_to_date} up to date · {sup.overdue} overdue · {sup.due_within_7_days} due soon
              </p>
            </div>
          </div>
          {sup.overdue > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {sup.overdue} overdue
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All current
            </Badge>
          )}
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Attendance Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
