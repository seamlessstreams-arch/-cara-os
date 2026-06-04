"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, ChevronRight, AlertTriangle, Brain, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEducationIntelligence } from "@/hooks/use-education-intelligence";

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
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
              overview.avg_attendance_pct >= 95 ? "bg-green-50" : "bg-amber-50"
            )}
          >
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                overview.avg_attendance_pct >= 95 ? "text-green-600" : "text-amber-600"
              )}
            >
              {overview.avg_attendance_pct}%
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
                overview.excluded_count === 0 ? "text-green-600" : "text-red-600"
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
                overview.pep_overdue_count === 0 ? "text-green-600" : "text-amber-600"
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
                    attendance.avg_pct >= 95
                      ? "text-green-700 bg-green-50 border-green-200"
                      : attendance.avg_pct >= 90
                      ? "text-amber-700 bg-amber-50 border-amber-200"
                      : "text-red-700 bg-red-50 border-red-200"
                  )}
                >
                  {attendance.avg_pct}%
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

              {attendance.below_90_children.length > 0 && (
                <div className="rounded border p-2 text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Children below 90%:</p>
                  {attendance.below_90_children.map((child: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-red-700">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>{child}</span>
                    </div>
                  ))}
                </div>
              )}

              {attendance.term_comparison.length > 0 && (
                <div className="rounded border p-2 text-xs space-y-1">
                  <p className="text-muted-foreground font-medium">Term comparison:</p>
                  {attendance.term_comparison.map((term: { term: string; pct: number }, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{term.term}</span>
                      <span className="font-medium tabular-nums">{term.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Exclusion events */}
        {overview.exclusion_events_90d > 0 && (
          <div className="rounded border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
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

        {/* ARIA Insights */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Attendance Intelligence
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
