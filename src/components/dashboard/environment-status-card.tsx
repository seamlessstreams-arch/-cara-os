"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENVIRONMENT STATUS CARD
// Dashboard widget showing building compliance, maintenance status, and
// vehicle readiness at a glance.
// Reg 25 — "The premises used for the children's home are designed, furnished
// and maintained so as to be suitable for the purpose."
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { useMaintenance } from "@/hooks/use-maintenance";
import { cn } from "@/lib/utils";
import {
  Building2, Loader2, AlertTriangle, CheckCircle2,
  ChevronRight, Wrench, Car, ShieldAlert,
  ClipboardCheck, Clock,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function EnvironmentStatusCard() {
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: maintData, isLoading: maintLoading } = useMaintenance();

  const isLoading = dashLoading || maintLoading;
  const d = dashData?.data;

  const {
    checksDue, checksOverdue, vehicleDefects, vehiclesRestricted,
    maintOpen, maintUrgent, maintScheduled,
    hasIssues,
  } = useMemo(() => {
    if (!d) return {
      checksDue: 0, checksOverdue: 0, vehicleDefects: 0, vehiclesRestricted: 0,
      maintOpen: 0, maintUrgent: 0, maintScheduled: 0,
      hasIssues: false,
    };

    const meta = maintData?.meta ?? { open: 0, urgent: 0, scheduled: 0 };

    return {
      checksDue: d.environment.building_checks_due,
      checksOverdue: d.environment.building_checks_overdue,
      vehicleDefects: d.environment.vehicle_defects,
      vehiclesRestricted: d.environment.vehicles_restricted,
      maintOpen: meta.open,
      maintUrgent: meta.urgent,
      maintScheduled: meta.scheduled,
      hasIssues: d.environment.building_checks_overdue > 0 || d.environment.vehicles_restricted > 0 || meta.urgent > 0,
    };
  }, [d, maintData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Building2 className="h-4 w-4 text-teal-500" />
            Environment
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
    <Card className={cn(hasIssues && "border-amber-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Building2 className="h-4 w-4 text-teal-500" />
            Environment & Premises
          </CardTitle>
          <Link href="/buildings">
            <Badge className="text-[9px] bg-teal-100 text-teal-700 border-0 rounded-full hover:bg-teal-200 cursor-pointer">
              Details
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Three sections: Building, Maintenance, Vehicles */}

        {/* Building Checks */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] p-2.5 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <ClipboardCheck className="h-3 w-3 text-teal-500" />
            <span className="text-[10px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider">Building Checks</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={cn("rounded-lg p-2 text-center", checksOverdue > 0 ? "bg-red-50" : "bg-emerald-50")}>
              <div className={cn("text-sm font-bold tabular-nums", checksOverdue > 0 ? "text-red-700" : "text-emerald-700")}>
                {checksOverdue}
              </div>
              <div className={cn("text-[9px]", checksOverdue > 0 ? "text-red-500" : "text-emerald-500")}>Overdue</div>
            </div>
            <div className={cn("rounded-lg p-2 text-center", checksDue > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
              <div className={cn("text-sm font-bold tabular-nums", checksDue > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>
                {checksDue}
              </div>
              <div className={cn("text-[9px]", checksDue > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Due Soon</div>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-amber-500" />
              <span className="text-[10px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider">Maintenance</span>
            </div>
            <Link href="/maintenance">
              <ChevronRight className="h-3 w-3 text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)]" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className={cn("rounded-lg p-2 text-center", maintUrgent > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]")}>
              <div className={cn("text-sm font-bold tabular-nums", maintUrgent > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>
                {maintUrgent}
              </div>
              <div className={cn("text-[9px]", maintUrgent > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>Urgent</div>
            </div>
            <div className={cn("rounded-lg p-2 text-center", maintOpen > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
              <div className={cn("text-sm font-bold tabular-nums", maintOpen > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>
                {maintOpen}
              </div>
              <div className={cn("text-[9px]", maintOpen > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Open</div>
            </div>
            <div className="rounded-lg bg-[var(--cs-surface)] p-2 text-center">
              <div className="text-sm font-bold text-[var(--cs-text-secondary)] tabular-nums">{maintScheduled}</div>
              <div className="text-[9px] text-[var(--cs-text-muted)]">Scheduled</div>
            </div>
          </div>
        </div>

        {/* Vehicles */}
        <div className="rounded-xl border border-[var(--cs-border-subtle)] p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Car className="h-3 w-3 text-blue-500" />
              <span className="text-[10px] font-semibold text-[var(--cs-text-secondary)] uppercase tracking-wider">Vehicles</span>
            </div>
            <Link href="/vehicles">
              <ChevronRight className="h-3 w-3 text-[var(--cs-text-gentle)] hover:text-[var(--cs-text-muted)]" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={cn("rounded-lg p-2 text-center", vehicleDefects > 0 ? "bg-amber-50" : "bg-emerald-50")}>
              <div className={cn("text-sm font-bold tabular-nums", vehicleDefects > 0 ? "text-amber-700" : "text-emerald-700")}>
                {vehicleDefects}
              </div>
              <div className={cn("text-[9px]", vehicleDefects > 0 ? "text-amber-500" : "text-emerald-500")}>Defects</div>
            </div>
            <div className={cn("rounded-lg p-2 text-center", vehiclesRestricted > 0 ? "bg-red-50" : "bg-emerald-50")}>
              <div className={cn("text-sm font-bold tabular-nums", vehiclesRestricted > 0 ? "text-red-700" : "text-emerald-700")}>
                {vehiclesRestricted}
              </div>
              <div className={cn("text-[9px]", vehiclesRestricted > 0 ? "text-red-500" : "text-emerald-500")}>Restricted</div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {checksOverdue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <ShieldAlert className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {checksOverdue} overdue building check{checksOverdue !== 1 ? "s" : ""}
              </p>
              <p className="text-[10px] text-red-600">
                Reg 25 — premises must be maintained to standard at all times
              </p>
            </div>
          </div>
        )}

        {vehiclesRestricted > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-red-700">
              {vehiclesRestricted} vehicle{vehiclesRestricted !== 1 ? "s" : ""} currently restricted from use
            </p>
          </div>
        )}

        {/* All clear */}
        {!hasIssues && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All environment checks up to date
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
