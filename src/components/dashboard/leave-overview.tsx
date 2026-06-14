"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — LEAVE OVERVIEW WIDGET
// Compact dashboard card showing staff absences and upcoming leave.
// Essential for managers to maintain safe staffing levels.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useLeave } from "@/hooks/use-leave";
import { getStaffName } from "@/lib/seed-data";
import { cn, formatRelative, todayStr } from "@/lib/utils";
import {
  CalendarOff, Loader2, CheckCircle2, Palmtree, Stethoscope,
  BookOpen, Clock, ChevronRight,
} from "lucide-react";

// ── Leave type config ───────────────────────────────────────────────────────

const LEAVE_TYPE_CONFIG: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  label: string;
}> = {
  annual:     { icon: Palmtree,     color: "text-emerald-600", bgColor: "bg-emerald-100", label: "Annual" },
  sick:       { icon: Stethoscope,  color: "text-red-600",     bgColor: "bg-red-100",     label: "Sick" },
  compassionate: { icon: Clock,     color: "text-[var(--cs-cara-gold)]",  bgColor: "bg-[var(--cs-cara-gold-bg)]",  label: "Compassionate" },
  training:   { icon: BookOpen,     color: "text-blue-600",    bgColor: "bg-blue-100",    label: "Training" },
  unpaid:     { icon: CalendarOff,  color: "text-[var(--cs-text-secondary)]",   bgColor: "bg-[var(--cs-surface)]",   label: "Unpaid" },
  toil:       { icon: Clock,        color: "text-amber-600",   bgColor: "bg-amber-100",   label: "TOIL" },
  maternity:  { icon: Clock,        color: "text-pink-600",    bgColor: "bg-pink-100",    label: "Maternity" },
  paternity:  { icon: Clock,        color: "text-sky-600",     bgColor: "bg-sky-100",     label: "Paternity" },
};

export function LeaveOverview() {
  const { data, isLoading } = useLeave();
  const today = todayStr();
  const requests = data?.data ?? [];

  // Current leave (today falls between start and end)
  const onLeaveToday = requests.filter(
    (r) => r.status === "approved" && r.start_date <= today && r.end_date >= today,
  );

  // Upcoming approved leave (next 14 days)
  const upcoming = requests.filter((r) => {
    if (r.status !== "approved") return false;
    if (r.start_date <= today) return false;
    const diff = (new Date(r.start_date).getTime() - Date.now()) / 86400000;
    return diff <= 14;
  }).sort((a, b) => a.start_date.localeCompare(b.start_date));

  // Pending requests
  const pending = requests.filter((r) => r.status === "pending");

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <CalendarOff className="h-4 w-4 text-orange-500" />
            Staff Leave
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <CalendarOff className="h-4 w-4 text-orange-500" />
            Staff Leave
          </CardTitle>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] rounded-full">
                {pending.length} pending
              </Badge>
            )}
            <Link href="/leave" className="text-[11px] text-blue-600 hover:underline">
              All →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Off today */}
        {onLeaveToday.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
              Off today
            </p>
            <div className="space-y-1.5">
              {onLeaveToday.map((r) => {
                const name = getStaffName(r.staff_id);
                const config = LEAVE_TYPE_CONFIG[r.leave_type] ?? LEAVE_TYPE_CONFIG.annual;
                return (
                  <div key={r.id} className="flex items-center gap-2 rounded-xl bg-[var(--cs-surface)] px-3 py-2">
                    <Avatar name={name} size="xs" />
                    <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                      {name}
                    </span>
                    <Badge className={cn("text-[9px] rounded-full border-0 shrink-0", config.bgColor, config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No one off */}
        {onLeaveToday.length === 0 && upcoming.length === 0 && pending.length === 0 && (
          <div className="py-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-xs font-medium text-emerald-700">Full team available</p>
          </div>
        )}

        {/* Upcoming leave */}
        {upcoming.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-[var(--cs-text-muted)] uppercase tracking-wider mb-2">
              Coming up
            </p>
            <div className="space-y-1">
              {upcoming.slice(0, 4).map((r) => {
                const name = getStaffName(r.staff_id);
                const config = LEAVE_TYPE_CONFIG[r.leave_type] ?? LEAVE_TYPE_CONFIG.annual;
                return (
                  <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 text-[11px]">
                    <config.icon className={cn("h-3 w-3 shrink-0", config.color)} />
                    <span className="text-[var(--cs-text-secondary)] truncate flex-1">{name.split(" ")[0]}</span>
                    <span className="text-[10px] text-[var(--cs-text-muted)] shrink-0">
                      {formatRelative(r.start_date)} · {r.total_days}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider mb-2">
              Awaiting approval
            </p>
            {pending.slice(0, 3).map((r) => {
              const name = getStaffName(r.staff_id);
              return (
                <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 text-[11px]">
                  <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="text-[var(--cs-text-secondary)] truncate flex-1">{name.split(" ")[0]}</span>
                  <span className="text-[10px] text-amber-600 shrink-0">
                    {r.total_days}d from {formatRelative(r.start_date)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
