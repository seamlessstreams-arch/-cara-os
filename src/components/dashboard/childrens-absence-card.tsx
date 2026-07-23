"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S ABSENCE INTELLIGENCE CARD
// Live data from useEducationIntelligence() — attendance, overview, alerts.
// CHR 2015 Reg 8. SCCIF: Overall Experiences — Education.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarX, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useEducationIntelligence } from "@/hooks/use-education-intelligence";

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function ChildrensAbsenceCard() {
  const { data, isLoading } = useEducationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarX className="h-4 w-4 text-brand" />
            Children&apos;s Absence
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

  const { attendance, overview } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CalendarX className="h-4 w-4 text-brand" />
            Children&apos;s Absence
          </CardTitle>
          <Link href="/education" className="text-xs text-brand hover:underline flex items-center gap-1">
            Education <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", attendance.overall_pct === null ? "bg-muted" : meets(attendance.overall_pct, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", attendance.overall_pct === null ? "text-muted-foreground" : meets(attendance.overall_pct, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(attendance.overall_pct)}</p>
            <p className="text-[10px] text-muted-foreground">Attendance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", attendance.below_90_count === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", attendance.below_90_count === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{attendance.below_90_count}</p>
            <p className="text-[10px] text-muted-foreground">&lt;90%</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", attendance.persistent_absence_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", attendance.persistent_absence_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{attendance.persistent_absence_count}</p>
            <p className="text-[10px] text-muted-foreground">Persistent</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.excluded_count === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.excluded_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{overview.excluded_count}</p>
            <p className="text-[10px] text-muted-foreground">Excluded</p>
          </div>
        </div>

        {/* ── Session breakdown ───────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold">Session Breakdown</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-green-600">{attendance.sessions_present}</p>
              <p className="text-[10px] text-muted-foreground">Present</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-red-600">{attendance.sessions_absent}</p>
              <p className="text-[10px] text-muted-foreground">Absent</p>
            </div>
            <div className="rounded border p-2 text-center">
              <p className="font-semibold text-amber-600">{attendance.sessions_late}</p>
              <p className="text-[10px] text-muted-foreground">Late</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Absence Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Absence Intelligence
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
