"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ROTA & WORKFORCE INTELLIGENCE CARD
// Dashboard card for staffing levels, shift coverage, agency usage,
// absence tracking, and ARIA workforce intelligence (Reg 16/33).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Clock, UserX, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_SUMMARY = {
  totalStaffToday: 6,
  dayShiftStaff: 4,
  nightShiftStaff: 2,
  agencyCount: 1,
  agencyPercentage: 16.7,
  totalHoursWeek: 312,
  overtimeHoursWeek: 28,
  complianceRate: 85.7,
};

const SHIFT_COVERAGE = [
  { shift: "Early (7am-3pm)", staff: 2, min: 2, ok: true },
  { shift: "Late (2pm-10pm)", staff: 2, min: 2, ok: true },
  { shift: "Waking Night", staff: 1, min: 1, ok: true },
  { shift: "Sleep-In", staff: 1, min: 1, ok: true },
];

const ABSENCE_SUMMARY = {
  currentAbsences: 1,
  sickDaysThisMonth: 8,
  returnToWorkRate: 75,
  annualLeaveToday: 1,
};

const UPCOMING_GAPS = [
  { date: "2026-05-15", shift: "Late", reason: "Annual leave — no replacement yet" },
  { date: "2026-05-18", shift: "Waking Night", reason: "Vacancy — agency requested" },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "unfilled_shift", severity: "high", message: "Unfilled late shift on 15 May — Sarah J on annual leave, no cover arranged." },
  { type: "high_sickness", severity: "medium", message: "Mark T has 12 sick days this quarter — consider welfare meeting and referral to occupational health." },
];

const ARIA_INSIGHTS = [
  "Staffing compliance at 85.7% this week — 1 day below minimum due to short-notice sickness. Agency reliance at 16.7% which is within the 25% target. Reg 16 staffing requirements broadly met.",
  "Overtime hours (28h) are 40% above average. 3 staff members have worked more than 48 hours this week. Review working time compliance and consider additional recruitment.",
  "Positive: All waking night shifts covered this month. Return-to-work interviews completed for 75% of sickness absences. Sleep-in cover stable with no gaps. Reg 33 employment standards evidenced.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function RotaIntelligenceCard() {
  const s = DEMO_SUMMARY;
  const abs = ABSENCE_SUMMARY;

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
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {s.totalStaffToday}
            </p>
            <p className="text-[10px] text-muted-foreground">Staff Today</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: s.complianceRate >= 90 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", s.complianceRate >= 90 ? "text-green-600" : "text-amber-600")}>
              {s.complianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", s.agencyPercentage <= 25 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", s.agencyPercentage <= 25 ? "text-green-600" : "text-amber-600")}>
              {s.agencyPercentage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Agency</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", abs.currentAbsences > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", abs.currentAbsences > 0 ? "text-amber-600" : "text-green-600")}>
              {abs.currentAbsences}
            </p>
            <p className="text-[10px] text-muted-foreground">Absent</p>
          </div>
        </div>

        {/* ── Shift coverage ──────────────────────────────────────────── */}

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Today&apos;s Shift Coverage
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {SHIFT_COVERAGE.map((sc) => (
              <div key={sc.shift} className={cn(
                "rounded-lg border p-2 text-xs flex items-center justify-between",
                sc.ok ? "border-green-200" : "border-red-200 bg-red-50",
              )}>
                <span className="text-muted-foreground">{sc.shift}</span>
                <Badge className={cn("text-[10px]", sc.ok ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                  {sc.staff}/{sc.min}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* ── Absence summary ──────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <UserX className={cn("h-4 w-4", abs.sickDaysThisMonth > 10 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Absences</p>
              <p className="text-[10px] text-muted-foreground">
                {abs.sickDaysThisMonth} sick days · {abs.annualLeaveToday} on leave · {abs.returnToWorkRate}% RTW rate
              </p>
            </div>
          </div>
          {abs.currentAbsences > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              {abs.currentAbsences} absent today
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Full team
            </Badge>
          )}
        </div>

        {/* ── Upcoming gaps ────────────────────────────────────────────── */}

        {UPCOMING_GAPS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              Upcoming Gaps
            </p>
            {UPCOMING_GAPS.map((gap, i) => (
              <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs flex items-center justify-between">
                <div>
                  <span className="font-medium">{gap.date}</span>
                  <span className="text-muted-foreground ml-2">{gap.shift}</span>
                </div>
                <span className="text-amber-700 text-[10px]">{gap.reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Workforce Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA Workforce Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
