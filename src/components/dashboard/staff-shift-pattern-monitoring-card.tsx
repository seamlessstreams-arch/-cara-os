"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SHIFT PATTERN MONITORING CARD
// Live data from useWorkforceIntelligence() — shifts, filled, unfilled, coverage.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ChevronRight, Brain, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffShiftPatternMonitoringCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-indigo-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { staffing } = d;

  return (
    <Card className="overflow-hidden border-indigo-200">
      <CardHeader className="pb-3 bg-indigo-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-indigo-600" />
            <span className="text-indigo-900">Shift Patterns</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2 bg-indigo-50">
            <p className="text-lg font-bold tabular-nums text-indigo-600">{staffing.shifts_this_week}</p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-green-50">
            <p className="text-lg font-bold tabular-nums text-green-600">{staffing.shifts_filled}</p>
            <p className="text-[10px] text-muted-foreground">Filled</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", staffing.shifts_unfilled > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.shifts_unfilled > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{staffing.shifts_unfilled}</p>
            <p className="text-[10px] text-muted-foreground">Unfilled</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(staffing.coverage_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(staffing.coverage_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(staffing.coverage_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
        </div>

        {/* ── Agency shift count ──────────────────────────────────────── */}
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />Shift Coverage Detail
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">No-Shows (Month)</span>
              <span className={cn("font-bold tabular-nums", staffing.no_shows_this_month > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{staffing.no_shows_this_month}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Overtime Hours</span>
              <span className={cn("font-bold tabular-nums", staffing.overtime_hours_this_month > 20 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{staffing.overtime_hours_this_month}h</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Coverage Rate</span>
              <span className={cn("font-bold tabular-nums", meets(staffing.coverage_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(staffing.coverage_rate)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Fill Rate</span>
              <span className="font-bold tabular-nums text-blue-600">
                {staffing.shifts_this_week > 0 ? Math.round((staffing.shifts_filled / staffing.shifts_this_week) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Cara insights ──────────────────────────────────────────── */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />Cara Insights
            </p>
            {d.insights.map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity])}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
