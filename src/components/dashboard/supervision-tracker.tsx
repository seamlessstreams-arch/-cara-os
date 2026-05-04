"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SUPERVISION TRACKER WIDGET
// Dashboard card showing the supervision status for all staff.
// Highlights overdue and upcoming supervisions for management oversight.
// Reg 33 visits require evidence of regular supervision — this makes it visible.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useStaff, type StaffEnriched } from "@/hooks/use-staff";
import { cn, formatRelative } from "@/lib/utils";
import {
  Users, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Loader2, Calendar,
} from "lucide-react";

// ── Staff supervision row ───────────────────────────────────────────────────

function SupervisionRow({ staff }: { staff: StaffEnriched }) {
  const isOverdue = staff.supervision_overdue;
  const daysUntil = staff.supervision_days_until_due;
  const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && !isOverdue;

  let statusColor = "text-emerald-600";
  let statusBg = "bg-emerald-50";
  let statusLabel = "On track";
  let StatusIcon = CheckCircle2;

  if (isOverdue) {
    statusColor = "text-red-600";
    statusBg = "bg-red-50";
    statusLabel = "Overdue";
    StatusIcon = AlertTriangle;
  } else if (isUpcoming) {
    statusColor = "text-amber-600";
    statusBg = "bg-amber-50";
    statusLabel = `Due in ${daysUntil}d`;
    StatusIcon = Clock;
  }

  return (
    <Link
      href={`/staff/${staff.id}`}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-colors group"
    >
      <Avatar name={staff.full_name} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">
          {staff.full_name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-slate-400 truncate">{staff.job_title}</span>
          {staff.next_supervision_due && (
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Calendar className="h-2.5 w-2.5" />
              {formatRelative(staff.next_supervision_due)}
            </span>
          )}
        </div>
      </div>
      <Badge className={cn(
        "text-[10px] rounded-full border-0 shrink-0 flex items-center gap-1",
        statusBg, statusColor,
      )}>
        <StatusIcon className="h-3 w-3" />
        {statusLabel}
      </Badge>
      <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function SupervisionTracker() {
  const { data, isLoading } = useStaff({ status: "active" });
  const staff = data?.data ?? [];

  // Filter to staff who have supervision dates (exclude RI, bank in some cases)
  const supervisable = staff.filter((s) =>
    s.next_supervision_due &&
    s.role !== "responsible_individual" &&
    s.employment_status === "active"
  );

  // Sort: overdue first, then by closest due date
  const sorted = [...supervisable].sort((a, b) => {
    if (a.supervision_overdue && !b.supervision_overdue) return -1;
    if (!a.supervision_overdue && b.supervision_overdue) return 1;
    return (a.supervision_days_until_due ?? 999) - (b.supervision_days_until_due ?? 999);
  });

  const overdueCount = sorted.filter((s) => s.supervision_overdue).length;
  const upcomingCount = sorted.filter((s) => {
    const d = s.supervision_days_until_due;
    return d !== null && d >= 0 && d <= 7 && !s.supervision_overdue;
  }).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Users className="h-4 w-4 text-indigo-500" />
            Supervision Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
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
            <Users className="h-4 w-4 text-indigo-500" />
            Supervision Tracker
          </CardTitle>
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full">
                {overdueCount} overdue
              </Badge>
            )}
            {upcomingCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] rounded-full">
                {upcomingCount} this week
              </Badge>
            )}
            <Link href="/supervision" className="text-[11px] text-blue-600 hover:underline">
              All →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {sorted.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">All supervisions on track</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[320px] overflow-y-auto">
            {sorted.slice(0, 8).map((s) => (
              <SupervisionRow key={s.id} staff={s} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
