"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, ChevronRight, AlertTriangle, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { below, formatRate, meets } from "@/lib/metrics/rate";
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

export function EducationAttendanceTrackingCard() {
  const { data, isLoading } = useEducationIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const intel = data?.data;
  if (!intel) return null;

  const overview = intel.overview;
  const attendance = intel.attendance;
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];
  const below90Names = (intel.child_profiles ?? [])
    .filter((p) => below(p.attendance_pct, 90))
    .map((p) => p.child_name);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <School className="h-4 w-4 text-brand" />
            Education Attendance
          </CardTitle>
          <Link
            href="/education-attendance-tracker"
            className="text-xs text-brand hover:underline flex items-center gap-1"
          >
            Attendance <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-2">
          <div
            className={cn(
              "text-center rounded-lg p-2",
              meets(overview.avg_attendance_pct, 95) ? "bg-green-50" : overview.avg_attendance_pct === null ? "bg-muted" : "bg-amber-50"
            )}
          >
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                meets(overview.avg_attendance_pct, 95) ? "text-[--cs-success]" : overview.avg_attendance_pct === null ? "text-muted-foreground" : "text-[--cs-warning]"
              )}
            >
              {formatRate(overview.avg_attendance_pct)}
            </p>
            <p className="text-[10px] text-muted-foreground">Attendance</p>
          </div>

          <div
            className={cn(
              "text-center rounded-lg p-2",
              overview.excluded_count === 0 ? "bg-green-50" : "bg-red-50"
            )}
          >
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                overview.excluded_count === 0 ? "text-[--cs-success]" : "text-[--cs-risk]"
              )}
            >
              {overview.excluded_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Exclusions</p>
          </div>

          <div
            className={cn(
              "text-center rounded-lg p-2",
              overview.pep_overdue_count === 0 ? "bg-green-50" : "bg-amber-50"
            )}
          >
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                overview.pep_overdue_count === 0 ? "text-[--cs-success]" : "text-[--cs-warning]"
              )}
            >
              {overview.pep_current_count}/{overview.pep_current_count + overview.pep_overdue_count}
            </p>
            <p className="text-[10px] text-muted-foreground">PEP Current</p>
          </div>

          <div className="text-center rounded-lg p-2 bg-blue-50">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {overview.sen_support_count}
            </p>
            <p className="text-[10px] text-muted-foreground">SEN Support</p>
          </div>
        </div>

        {/* Attendance breakdown */}
        {attendance && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              Attendance Breakdown
            </p>
            <div className="space-y-1">
              <div className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="font-medium">Average attendance</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    attendance.overall_pct === null
                      ? "text-muted-foreground bg-muted border-transparent"
                      : meets(attendance.overall_pct, 95)
                      ? "text-green-700 bg-green-50 border-green-200"
                      : meets(attendance.overall_pct, 90)
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-red-700 bg-red-50 border-red-200"
                  )}
                >
                  {formatRate(attendance.overall_pct)}
                </Badge>
              </div>

              <div className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="font-medium">Below 90% attendance</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    attendance.below_90_count === 0
                      ? "text-green-700 bg-green-50 border-green-200"
                      : "text-red-700 bg-red-50 border-red-200"
                  )}
                >
                  {attendance.below_90_count} children
                </Badge>
              </div>

              {below90Names.length > 0 && (
                <div className="rounded border p-2 text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Children below 90%:</p>
                  {below90Names.map((child, i) => (
                    <div key={i} className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{child}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exclusion events */}
        {overview.exclusion_events_90d > 0 && (
          <div className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs text-[--cs-risk]">
            <span className="font-medium">{overview.exclusion_events_90d}</span> exclusion event{overview.exclusion_events_90d !== 1 ? "s" : ""} in the last 90 days
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Education Alerts
            </p>
            {alerts.map((a: { severity: string; message: string }, i: number) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[a.severity] ?? ALERT_STYLES.medium
                )}
              >
                {a.message}
              </div>
            ))}
          </div>
        )}

        {/* Cara Insights */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Attendance Intelligence
            </p>
            {insights.map((insight: { severity: string; text: string }, i: number) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive
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
