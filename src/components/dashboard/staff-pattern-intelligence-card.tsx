"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF PATTERN INTELLIGENCE CARD
// Live data from useWorkforceIntelligence() — staffing, sickness, profile.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffPatternIntelligenceCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand" />
            Staff Patterns
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

  const { staffing, sickness, profile } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-brand" />
            Staff Patterns
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{staffing.shifts_this_week}</p>
            <p className="text-[10px] text-muted-foreground">Shifts/wk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{staffing.avg_shifts_per_staff_per_week}</p>
            <p className="text-[10px] text-muted-foreground">Avg/Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", staffing.overtime_hours_this_month <= 20 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.overtime_hours_this_month <= 20 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{staffing.overtime_hours_this_month}h</p>
            <p className="text-[10px] text-muted-foreground">Overtime</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", sickness.trend === "decreasing" ? "bg-green-50" : sickness.trend === "increasing" ? "bg-red-50" : "bg-blue-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.trend === "decreasing" ? "text-[--cs-success]" : sickness.trend === "increasing" ? "text-[--cs-risk]" : "text-blue-600")}>{sickness.total_sick_days_this_month}d</p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
        </div>

        {/* ── Pattern breakdown ───────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold">Workforce Patterns</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Sickness trend:</span>{" "}
              <Badge className={cn("text-[9px]", sickness.trend === "decreasing" ? "bg-[--cs-success-bg] text-[--cs-success]" : sickness.trend === "increasing" ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-info-bg] text-[--cs-info]")}>{sickness.trend}</Badge>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Avg tenure:</span>{" "}
              <span className="font-semibold">{profile.average_tenure_months}m</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Coverage:</span>{" "}
              <span className="font-semibold">{formatRate(staffing.coverage_rate)}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Bradford alerts:</span>{" "}
              <span className="font-semibold">{(sickness.bradford_factor_alerts?.length ?? 0)}</span>
            </div>
          </div>
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Pattern Intelligence
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
