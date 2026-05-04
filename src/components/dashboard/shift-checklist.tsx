"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHIFT CHECKLIST
// End-of-shift completion checklist ensuring all critical tasks are done
// before handover. Tracks medication rounds, welfare checks, daily logs,
// and handover notes completion.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/hooks/use-dashboard";
import { useDailyLog } from "@/hooks/use-daily-log";
import { useWelfareChecks } from "@/hooks/use-welfare-checks";
import { useAuthContext } from "@/contexts/auth-context";
import { cn, todayStr } from "@/lib/utils";
import {
  ClipboardCheck, CheckCircle2, Circle, Loader2,
  Pill, BookOpen, Moon, ArrowRightLeft, Shield,
  AlertTriangle, ChevronRight,
} from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  href: string;
  completed: boolean;
  critical: boolean;
}

export function ShiftChecklist() {
  const { currentUser } = useAuthContext();
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: logData, isLoading: logLoading } = useDailyLog({ days: 1 });
  const { data: wcData, isLoading: wcLoading } = useWelfareChecks();

  const isLoading = dashLoading || logLoading || wcLoading;
  const today = todayStr();

  const dashboard = dashData?.data;
  const dailyLogs = logData?.data ?? [];
  const welfareRounds = wcData?.data ?? [];

  // Determine shift context
  const todayShifts = dashboard?.staffing?.today_shifts ?? [];
  const myShift = todayShifts[0];
  const isNightShift = myShift?.shift_type === "sleep_in" || myShift?.shift_type === "waking_night";

  // Build checklist items
  const items = useMemo<ChecklistItem[]>(() => {
    const todayLogs = dailyLogs.filter((l) => l.date === today);
    const todayWelfare = welfareRounds.filter((r) => r.round_date === today);

    const list: ChecklistItem[] = [
      {
        id: "daily_log",
        label: "Daily log entries",
        description: "At least one log entry per child today",
        icon: BookOpen,
        href: "/daily-log",
        completed: todayLogs.length >= 3, // 3 children = 3 logs minimum
        critical: true,
      },
      {
        id: "medication",
        label: "Medication round",
        description: "All scheduled medications administered",
        icon: Pill,
        href: "/medication",
        completed: (dashboard?.medication?.missed_today ?? 0) === 0,
        critical: true,
      },
      {
        id: "handover",
        label: "Handover notes",
        description: "Complete handover for the next shift",
        icon: ArrowRightLeft,
        href: "/handover",
        completed: false, // Check handover submissions
        critical: true,
      },
    ];

    // Night-specific checks
    if (isNightShift) {
      list.push({
        id: "welfare_22",
        label: "22:00 welfare check",
        description: "All children checked at lights out",
        icon: Moon,
        href: "/welfare-checks",
        completed: todayWelfare.some((r) => r.round_time === "22:00"),
        critical: true,
      });
      list.push({
        id: "building_secure",
        label: "Building security",
        description: "All doors locked, alarm set, fire exits clear",
        icon: Shield,
        href: "/welfare-checks",
        completed: todayWelfare.some((r) => r.building_secure && r.external_doors_locked),
        critical: true,
      });
    }

    // Always-present checks
    list.push({
      id: "incidents",
      label: "Incident reports",
      description: "All incidents logged and awaiting oversight",
      icon: AlertTriangle,
      href: "/incidents",
      completed: (dashboard?.incidents?.open ?? 0) === 0,
      critical: false,
    });

    return list;
  }, [dashboard, dailyLogs, welfareRounds, today, isNightShift]);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;
  const criticalMissing = items.filter((i) => i.critical && !i.completed);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardCheck className="h-4 w-4 text-blue-500" />
            Shift Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Don't show if not on shift
  if (!myShift) return null;

  return (
    <Card className={cn(
      criticalMissing.length > 0 && "border-amber-200",
      allDone && "border-emerald-200",
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardCheck className={cn(
              "h-4 w-4",
              allDone ? "text-emerald-500" : "text-blue-500",
            )} />
            Shift Checklist
          </CardTitle>
          <Badge className={cn(
            "text-[10px] rounded-full border-0",
            allDone
              ? "bg-emerald-100 text-emerald-700"
              : criticalMissing.length > 0
              ? "bg-amber-100 text-amber-700"
              : "bg-blue-100 text-blue-700",
          )}>
            {completedCount}/{totalCount}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Progress bar */}
        <div className="mb-3">
          <Progress value={pct} className="h-1.5" />
        </div>

        {/* Checklist items */}
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.href}>
                <div className={cn(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-slate-50 transition-colors",
                  item.completed && "opacity-60",
                )}>
                  {item.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className={cn(
                      "h-4 w-4 shrink-0",
                      item.critical ? "text-amber-400" : "text-slate-300",
                    )} />
                  )}
                  <Icon className={cn(
                    "h-3 w-3 shrink-0",
                    item.completed ? "text-emerald-400" : "text-slate-400",
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-[11px] font-medium",
                      item.completed ? "text-emerald-700 line-through" : "text-slate-700",
                    )}>
                      {item.label}
                    </p>
                  </div>
                  {!item.completed && item.critical && (
                    <Badge className="bg-amber-100 text-amber-600 border-0 text-[8px] rounded-full shrink-0">
                      Required
                    </Badge>
                  )}
                  <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* All done message */}
        {allDone && (
          <div className="mt-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-0.5" />
            <p className="text-[10px] font-medium text-emerald-700">All checks complete — ready for handover</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
