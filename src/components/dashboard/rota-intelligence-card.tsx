"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ROTA & WORKFORCE INTELLIGENCE CARD
// Dashboard card powered by the Rota Intelligence Engine.
// Reg 16/33/34 — staffing levels, shift coverage, workforce compliance.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronRight, AlertTriangle,
  Brain, Clock, CalendarClock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRotaIntelligence } from "@/hooks/use-rota-intelligence";

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

export function RotaIntelligenceCard() {
  const { data, isLoading } = useRotaIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Staff Rota & Workforce
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
            <Users className="h-4 w-4 text-brand" />
            Staff Rota & Workforce
          </CardTitle>
          <Link href="/rota" className="text-xs text-brand hover:underline flex items-center gap-1">
            Rota <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {o.total_staff_today}
            </p>
            <p className="text-[10px] text-muted-foreground">Staff Today</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.completion_rate >= 95 ? "bg-green-50" : o.completion_rate >= 85 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.completion_rate >= 95 ? "text-green-600" : o.completion_rate >= 85 ? "text-amber-600" : "text-red-600",
            )}>
              {o.completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.open_shifts_7_days === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.open_shifts_7_days === 0 ? "text-green-600" : "text-amber-600",
            )}>
              {o.open_shifts_7_days}
            </p>
            <p className="text-[10px] text-muted-foreground">Open Shifts</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {Math.round(o.total_hours_week)}h
            </p>
            <p className="text-[10px] text-muted-foreground">This Week</p>
          </div>
        </div>

        {/* ── Shift coverage today ────────────────────────────────────── */}

        {intel.shift_coverage.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Today&apos;s Shift Coverage
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {intel.shift_coverage.map((sc) => (
                <div key={sc.shift_type} className={cn(
                  "rounded-lg border p-2 text-xs flex items-center justify-between",
                  sc.is_covered ? "border-green-200" : "border-red-200 bg-red-50",
                )}>
                  <span className="text-muted-foreground">{sc.shift_label}</span>
                  <Badge className={cn(
                    "text-[10px]",
                    sc.is_covered ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                  )}>
                    {sc.staff_count} staff
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Staff hours (top 4 by hours) ────────────────────────────── */}

        {intel.staff_hours.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Staff Hours (This Week)</p>
            {intel.staff_hours.slice(0, 4).map((sh) => (
              <div key={sh.staff_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="font-medium">{sh.staff_name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "tabular-nums font-bold",
                    sh.exceeds_48h ? "text-red-600" : "text-slate-600",
                  )}>
                    {Math.round(sh.hours_this_week)}h
                  </span>
                  {sh.exceeds_48h && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">&gt;48h</Badge>
                  )}
                  {sh.overtime_this_week > 0 && !sh.exceeds_48h && (
                    <Badge variant="outline" className="text-[10px] tabular-nums">
                      +{Math.round(sh.overtime_this_week)}h OT
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Upcoming gaps ────────────────────────────────────────────── */}

        {intel.upcoming_gaps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Upcoming Gaps
            </p>
            {intel.upcoming_gaps.slice(0, 3).map((gap, i) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs flex items-center justify-between">
                <div>
                  <span className="font-medium">{gap.date}</span>
                  <span className="text-muted-foreground ml-2">{gap.shift_label}</span>
                </div>
                <span className="text-amber-700 text-[10px]">{gap.reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Workforce Alerts
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

        {/* ── ARIA Workforce Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Workforce Intelligence
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
