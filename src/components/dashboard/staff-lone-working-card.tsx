"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF LONE WORKING CARD
// Live data from useWorkforceIntelligence() — staffing, profile.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserX, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffLoneWorkingCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserX className="h-4 w-4 text-brand" />
            Lone Working
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

  const { staffing, profile } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserX className="h-4 w-4 text-brand" />
            Lone Working
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile.staff_on_shift_today}</p>
            <p className="text-[10px] text-muted-foreground">On Shift</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(staffing.coverage_rate, 95) ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(staffing.coverage_rate, 95) ? "text-[--cs-success]" : "text-[--cs-risk]")}>{formatRate(staffing.coverage_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", staffing.shifts_unfilled === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.shifts_unfilled === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{staffing.shifts_unfilled}</p>
            <p className="text-[10px] text-muted-foreground">Unfilled</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{staffing.shifts_filled}</p>
            <p className="text-[10px] text-muted-foreground">Filled</p>
          </div>
        </div>

        {/* ── Risk context ────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold">Lone Working Context</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">No-shows:</span>{" "}
              <span className="font-semibold">{staffing.no_shows_this_month}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Overtime hrs:</span>{" "}
              <span className="font-semibold">{staffing.overtime_hours_this_month}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">On leave:</span>{" "}
              <span className="font-semibold">{profile.staff_on_leave_today}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Total staff:</span>{" "}
              <span className="font-semibold">{profile.active_staff}</span>
            </div>
          </div>
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Lone Working Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
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
