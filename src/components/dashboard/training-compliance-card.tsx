"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRAINING COMPLIANCE CARD
// Dashboard widget showing mandatory training compliance across the team.
// Highlights expired and expiring-soon certifications that must be renewed
// before the next Ofsted inspection or Reg 44 visit.
//
// Reg 32 (Staff qualifications) & Standard 6 (Workforce) require that staff
// hold current mandatory training in safeguarding, first aid, medication
// administration, fire safety, restraint, and more.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { useStaff, type StaffEnriched } from "@/hooks/use-staff";
import { cn } from "@/lib/utils";
import {
  GraduationCap, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Loader2, ShieldAlert,
} from "lucide-react";

// ── Staff training row ─────────────────────────────────────────────────────

function TrainingRow({ staff }: { staff: StaffEnriched }) {
  const expired = staff.training_expired_count ?? 0;
  const expiring = staff.training_expiring_count ?? 0;
  const total = staff.training_total_count ?? 0;
  const compliant = Math.max(0, total - expired - expiring);
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 100;

  let statusColor = "text-emerald-600";
  let statusBg = "bg-emerald-50";
  let statusLabel = "Compliant";
  let StatusIcon = CheckCircle2;

  if (expired > 0) {
    statusColor = "text-red-600";
    statusBg = "bg-red-50";
    statusLabel = `${expired} expired`;
    StatusIcon = AlertTriangle;
  } else if (expiring > 0) {
    statusColor = "text-amber-600";
    statusBg = "bg-amber-50";
    statusLabel = `${expiring} expiring`;
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
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="text-emerald-600 font-medium">{compliant}</span>
            {expired > 0 && <span className="text-red-600 font-medium">/{expired} exp</span>}
            {expiring > 0 && <span className="text-amber-600 font-medium">/{expiring} soon</span>}
          </div>
        </div>
      </div>
      <div className="w-16 shrink-0">
        <Progress
          value={pct}
          className="h-1.5"
          color={pct === 100 ? "bg-emerald-500" : pct >= 80 ? "bg-amber-500" : "bg-red-500"}
        />
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

export function TrainingComplianceCard() {
  const { data, isLoading } = useStaff({ status: "active" });
  const staff = data?.data ?? [];

  // Filter to staff who should have training (exclude RI)
  const trainable = useMemo(
    () => staff.filter((s) =>
      s.role !== "responsible_individual" &&
      s.employment_status === "active" &&
      s.training_total_count > 0
    ),
    [staff]
  );

  // Sort: expired first, then expiring, then compliant
  const sorted = useMemo(
    () => [...trainable].sort((a, b) => {
      const aScore = (a.training_expired_count ?? 0) * 1000 + (a.training_expiring_count ?? 0);
      const bScore = (b.training_expired_count ?? 0) * 1000 + (b.training_expiring_count ?? 0);
      return bScore - aScore;
    }),
    [trainable]
  );

  const expiredCount = useMemo(
    () => sorted.filter((s) => (s.training_expired_count ?? 0) > 0).length,
    [sorted]
  );
  const expiringCount = useMemo(
    () => sorted.filter((s) => (s.training_expiring_count ?? 0) > 0 && (s.training_expired_count ?? 0) === 0).length,
    [sorted]
  );

  // Overall team compliance rate
  const teamStats = useMemo(() => {
    const totalItems = trainable.reduce((a, s) => a + (s.training_total_count ?? 0), 0);
    const expiredItems = trainable.reduce((a, s) => a + (s.training_expired_count ?? 0), 0);
    const expiringItems = trainable.reduce((a, s) => a + (s.training_expiring_count ?? 0), 0);
    const compliantItems = Math.max(0, totalItems - expiredItems - expiringItems);
    const rate = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100;
    return { totalItems, expiredItems, expiringItems, compliantItems, rate };
  }, [trainable]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <GraduationCap className="h-4 w-4 text-sky-500" />
            Training Compliance
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
    <Card className={cn(
      expiredCount > 0 && "border-red-200",
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <GraduationCap className={cn(
              "h-4 w-4",
              expiredCount > 0 ? "text-red-500" : "text-sky-500",
            )} />
            Training Compliance
          </CardTitle>
          <div className="flex items-center gap-2">
            {expiredCount > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full">
                {expiredCount} non-compliant
              </Badge>
            )}
            {expiringCount > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] rounded-full">
                {expiringCount} expiring
              </Badge>
            )}
            <Link href="/workforce/training-matrix" className="text-[11px] text-blue-600 hover:underline">
              Matrix →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Team compliance summary */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-slate-500">Team Compliance Rate</span>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              teamStats.rate >= 90 ? "text-emerald-600" :
              teamStats.rate >= 70 ? "text-amber-600" : "text-red-600",
            )}>
              {teamStats.rate}%
            </span>
          </div>
          <Progress
            value={teamStats.rate}
            className="h-2"
            color={teamStats.rate >= 90 ? "bg-emerald-500" : teamStats.rate >= 70 ? "bg-amber-500" : "bg-red-500"}
          />
          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
            <span>{teamStats.compliantItems} current</span>
            {teamStats.expiringItems > 0 && (
              <span className="text-amber-600">{teamStats.expiringItems} expiring</span>
            )}
            {teamStats.expiredItems > 0 && (
              <span className="text-red-600">{teamStats.expiredItems} expired</span>
            )}
          </div>
        </div>

        {/* Urgent alert */}
        {expiredCount > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 mb-3 flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-red-600 shrink-0" />
            <p className="text-[11px] text-red-700 font-medium">
              {teamStats.expiredItems} expired certification{teamStats.expiredItems > 1 ? "s" : ""} across {expiredCount} staff — action required for Reg 32 compliance.
            </p>
          </div>
        )}

        {/* Staff list */}
        {sorted.length === 0 ? (
          <div className="py-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-emerald-700">All training up to date</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[280px] overflow-y-auto">
            {sorted.slice(0, 8).map((s) => (
              <TrainingRow key={s.id} staff={s} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
