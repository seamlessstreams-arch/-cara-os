"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S MEETINGS & CONSULTATION INTELLIGENCE CARD
// Dashboard card powered by the Meetings Intelligence Engine.
// Reg 7 (wishes & feelings), Reg 16 (consultation), SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronRight, AlertTriangle,
  Brain, Users, ClipboardCheck, Loader2, FileWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMeetingsIntelligence } from "@/hooks/use-meetings-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function MeetingsCard() {
  const { data, isLoading } = useMeetingsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Children&apos;s Voice & Meetings
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

  const o = intel.overview;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Children&apos;s Voice & Meetings
          </CardTitle>
          <Link href="/meetings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Meetings <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_meetings}
            </p>
            <p className="text-[10px] text-muted-foreground">Meetings</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_attendance_rate >= 80 ? "bg-green-50" : o.avg_attendance_rate >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_attendance_rate >= 80 ? "text-green-600" : o.avg_attendance_rate >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.avg_attendance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Attendance</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.action_completion_rate >= 80 ? "bg-green-50" : o.action_completion_rate >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.action_completion_rate >= 80 ? "text-green-600" : o.action_completion_rate >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.action_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Actions Done</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.actions_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.actions_overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.actions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Meeting types ───────────────────────────────────────────── */}

        {intel.type_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Meeting Types
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {intel.type_breakdown.slice(0, 4).map((t) => (
                <div key={t.meeting_type} className="flex items-center justify-between rounded border p-2 text-xs">
                  <span className="truncate">{t.type_label}</span>
                  <Badge variant="outline" className="text-[10px] tabular-nums ml-1">{t.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Child participation ──────────────────────────────────────── */}

        {intel.child_participation.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" />
              Child Participation
            </p>
            {intel.child_participation.slice(0, 4).map((c) => (
              <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.child_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-600">
                      {c.meetings_attended}/{c.meetings_attended + c.meetings_absent}
                    </span>
                    <Badge className={cn(
                      "text-[10px] tabular-nums",
                      c.attendance_rate >= 80 ? "bg-green-100 text-green-700"
                        : c.attendance_rate >= 50 ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700",
                    )}>
                      {c.attendance_rate}%
                    </Badge>
                  </div>
                </div>
                {(c.risk_flags?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(c.risk_flags ?? []).slice(0, 3).map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />
                        {flag.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Key metrics ──────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.meetings_last_30_days}</p>
            <p className="text-[10px] text-muted-foreground">Last 30d</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.avg_duration_minutes}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Duration</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.children_never_attended === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.children_never_attended}
            </p>
            <p className="text-[10px] text-muted-foreground">Never Attended</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Participation Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Child Voice Intelligence ───────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Child Voice Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
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
