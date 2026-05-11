"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFFING COVERAGE CARD
// Dashboard widget showing today's shift coverage, open shifts, and
// staff-to-child ratio at a glance. Understaffing is a safeguarding risk —
// Reg 31 requires adequate staffing at all times.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { getStaffName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  Users, Loader2, AlertTriangle, CheckCircle2,
  ChevronRight, Clock, CalendarDays, Moon,
  UserX, UserCheck, ShieldAlert,
} from "lucide-react";
import type { Shift } from "@/types";

// ── Shift type labels ────────────────────────────────────────────────────────

const SHIFT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  day:        { label: "Day",        color: "bg-blue-100 text-blue-700",    icon: Users },
  long_day:   { label: "Long Day",   color: "bg-indigo-100 text-indigo-700",icon: Users },
  night:      { label: "Night",      color: "bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)]",icon: Moon },
  sleep_in:   { label: "Sleep-In",   color: "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]",  icon: Moon },
  on_call:    { label: "On-Call",    color: "bg-amber-100 text-amber-700",  icon: Clock },
  half_day:   { label: "Half Day",   color: "bg-teal-100 text-teal-700",    icon: Clock },
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffingCoverageCard() {
  const { data: dashData, isLoading } = useDashboard();

  const d = dashData?.data;

  const {
    onShift, openShifts, onLeave,
    todayShifts, supervisionOverdue,
    childCount, ratio, hasGaps,
  } = useMemo(() => {
    if (!d) return {
      onShift: 0, openShifts: 0, onLeave: 0,
      todayShifts: [] as Shift[], supervisionOverdue: 0,
      childCount: 0, ratio: "—", hasGaps: false,
    };

    const shifts = d.staffing.today_shifts ?? [];
    const activeShifts = shifts.filter((s) =>
      s.status === "scheduled" || s.status === "confirmed" || s.status === "in_progress"
    );
    const children = d.young_people?.current?.length ?? 0;
    const staff = d.staffing.on_shift;
    const ratioStr = children > 0 && staff > 0
      ? `1:${(children / staff).toFixed(1)}`
      : "—";

    return {
      onShift: d.staffing.on_shift,
      openShifts: d.staffing.open_shifts,
      onLeave: d.staffing.on_leave,
      todayShifts: activeShifts,
      supervisionOverdue: d.staffing.supervision_overdue,
      childCount: children,
      ratio: ratioStr,
      hasGaps: d.staffing.open_shifts > 0,
    };
  }, [d]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Users className="h-4 w-4 text-blue-500" />
            Staffing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(hasGaps && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Users className="h-4 w-4 text-blue-500" />
            Staffing Coverage
          </CardTitle>
          <Link href="/rota">
            <Badge className="text-[9px] bg-blue-100 text-blue-700 border-0 rounded-full hover:bg-blue-200 cursor-pointer">
              View rota
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-xl bg-blue-50 p-2 text-center">
            <UserCheck className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-blue-700 tabular-nums">{onShift}</div>
            <div className="text-[9px] text-blue-500">On Shift</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", openShifts > 0 ? "bg-red-50" : "bg-emerald-50")}>
            <UserX className={cn("h-3 w-3 mx-auto mb-0.5", openShifts > 0 ? "text-red-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", openShifts > 0 ? "text-red-700" : "text-emerald-700")}>{openShifts}</div>
            <div className={cn("text-[9px]", openShifts > 0 ? "text-red-500" : "text-emerald-500")}>Open Shifts</div>
          </div>
          <div className="rounded-xl bg-amber-50 p-2 text-center">
            <CalendarDays className="h-3 w-3 text-amber-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-amber-700 tabular-nums">{onLeave}</div>
            <div className="text-[9px] text-amber-500">On Leave</div>
          </div>
          <div className="rounded-xl bg-[var(--cs-surface)] p-2 text-center">
            <Users className="h-3 w-3 text-[var(--cs-text-muted)] mx-auto mb-0.5" />
            <div className="text-sm font-bold text-[var(--cs-text-secondary)] tabular-nums">{ratio}</div>
            <div className="text-[9px] text-[var(--cs-text-muted)]">Staff:Child</div>
          </div>
        </div>

        {/* Open shifts warning */}
        {openShifts > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <ShieldAlert className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {openShifts} unfilled shift{openShifts !== 1 ? "s" : ""} today
              </p>
              <p className="text-[10px] text-red-600">
                Reg 31 requires adequate staffing at all times
              </p>
            </div>
          </div>
        )}

        {/* No gaps celebration */}
        {!hasGaps && onShift > 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              Full shift coverage today
            </span>
          </div>
        )}

        {/* Today's shift list */}
        {todayShifts.length > 0 && (
          <div className="space-y-1">
            {todayShifts.slice(0, 6).map((shift) => {
              const config = SHIFT_TYPE_CONFIG[shift.shift_type] ?? {
                label: shift.shift_type, color: "bg-[var(--cs-surface)] text-[var(--cs-text-secondary)]", icon: Users,
              };
              return (
                <div key={shift.id} className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[var(--cs-surface)] transition-colors">
                  <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <config.icon className="h-2.5 w-2.5 text-blue-600" />
                  </div>
                  <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                    {getStaffName(shift.staff_id)}
                  </span>
                  <span className="text-[9px] text-[var(--cs-text-muted)] tabular-nums">
                    {shift.start_time}–{shift.end_time}
                  </span>
                  <Badge className={cn("text-[8px] px-1.5 py-0 rounded-full border-0", config.color)}>
                    {config.label}
                  </Badge>
                </div>
              );
            })}
            {todayShifts.length > 6 && (
              <Link href="/rota">
                <p className="text-[10px] text-blue-600 hover:underline px-2">
                  +{todayShifts.length - 6} more shifts
                </p>
              </Link>
            )}
          </div>
        )}

        {/* Supervision overdue */}
        {supervisionOverdue > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-center gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
            <p className="text-[10px] text-amber-700">
              <span className="font-semibold">{supervisionOverdue}</span> staff with supervision overdue
            </p>
            <Link href="/supervision" className="ml-auto">
              <ChevronRight className="h-3 w-3 text-amber-400" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
