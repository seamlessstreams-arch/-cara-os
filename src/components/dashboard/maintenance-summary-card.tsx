"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MAINTENANCE SUMMARY CARD
// Dashboard widget showing property maintenance status at a glance.
// Reg 25 — premises must be designed, furnished and maintained to standard.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMaintenance } from "@/hooks/use-maintenance";
import { cn } from "@/lib/utils";
import {
  Wrench, Loader2, AlertTriangle, CheckCircle2,
  Clock, CircleDot, CalendarClock,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function MaintenanceSummaryCard() {
  const { data, isPending } = useMaintenance();
  const meta = data?.meta;
  const items = data?.data ?? [];

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Wrench className="h-4 w-4 text-amber-500" />
            Maintenance
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

  if (!meta) return null;

  const hasAlert = meta.urgent > 0;
  const overdueItems = items.filter(
    (i) => i.status === "open" && new Date(i.due_date) < new Date()
  );

  return (
    <Card className={cn(hasAlert && "border-amber-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Wrench className="h-4 w-4 text-amber-500" />
            Maintenance
          </CardTitle>
          <Link href="/maintenance">
            <Badge className="text-[9px] bg-amber-100 text-amber-700 border-0 rounded-full hover:bg-amber-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl p-2 text-center", meta.urgent > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", meta.urgent > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.urgent > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>{meta.urgent}</div>
            <div className={cn("text-[9px]", meta.urgent > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>Urgent</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", meta.open > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
            <CircleDot className={cn("h-3 w-3 mx-auto mb-0.5", meta.open > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.open > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{meta.open}</div>
            <div className={cn("text-[9px]", meta.open > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Open</div>
          </div>
          <div className="rounded-xl bg-[var(--cs-surface)] p-2 text-center">
            <CalendarClock className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-blue-700 tabular-nums">{meta.scheduled}</div>
            <div className="text-[9px] text-blue-500">Scheduled</div>
          </div>
        </div>

        {/* Completed */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)] flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
          <span className="font-bold text-emerald-600 tabular-nums">{meta.completed}</span>
        </div>

        {/* Total */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)]">Total items</span>
          <span className="font-bold text-[var(--cs-text-secondary)] tabular-nums">{meta.total}</span>
        </div>

        {/* Overdue alert */}
        {overdueItems.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <Clock className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {overdueItems.length} item{overdueItems.length !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-[10px] text-red-600">
                Reg 25 — premises must be maintained to standard
              </p>
            </div>
          </div>
        )}

        {/* Urgent alert */}
        {meta.urgent > 0 && overdueItems.length === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-amber-700">
              {meta.urgent} urgent repair{meta.urgent !== 1 ? "s" : ""} require attention
            </p>
          </div>
        )}

        {/* All clear */}
        {meta.urgent === 0 && meta.open === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All maintenance up to date
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
