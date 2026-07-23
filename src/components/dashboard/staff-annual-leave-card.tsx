"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF ANNUAL LEAVE / SICKNESS CARD
// Live data from useWorkforceIntelligence() — sickness days, trend, coverage.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronRight, Brain, Loader2, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const TREND_CONFIG = {
  increasing: { icon: TrendingUp, color: "text-[--cs-risk]", label: "Increasing" },
  stable: { icon: Minus, color: "text-blue-600", label: "Stable" },
  decreasing: { icon: TrendingDown, color: "text-[--cs-success]", label: "Decreasing" },
};

export function StaffAnnualLeaveCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-sky-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-sky-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { sickness, staffing } = d;
  const trend = TREND_CONFIG[sickness.trend];
  const TrendIcon = trend.icon;

  return (
    <Card className="overflow-hidden border-sky-200">
      <CardHeader className="pb-3 bg-sky-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-sky-600" />
            <span className="text-sky-900">Staff Leave & Sickness</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", sickness.total_sick_days_this_month > 10 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.total_sick_days_this_month > 10 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{sickness.total_sick_days_this_month}</p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", sickness.staff_with_sickness > 3 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.staff_with_sickness > 3 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{sickness.staff_with_sickness}</p>
            <p className="text-[10px] text-muted-foreground">Staff Sick</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-sky-50">
            <p className={cn("text-lg font-bold tabular-nums flex items-center justify-center gap-1", trend.color)}>
              <TrendIcon className="h-3.5 w-3.5" />
            </p>
            <p className="text-[10px] text-muted-foreground">{trend.label}</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", meets(staffing.coverage_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(staffing.coverage_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(staffing.coverage_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
        </div>

        {/* ── Staffing coverage ──────────────────────────────────────── */}
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Staffing Coverage</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Shifts This Week</span>
              <span className="font-bold tabular-nums">{staffing.shifts_this_week}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Filled</span>
              <span className="font-bold tabular-nums text-green-600">{staffing.shifts_filled}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Unfilled</span>
              <span className={cn("font-bold tabular-nums", staffing.shifts_unfilled > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{staffing.shifts_unfilled}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last Month Sick</span>
              <span className="font-bold tabular-nums">{sickness.total_sick_days_last_month}d</span>
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
