"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION STATUS CARD
// Dashboard widget showing today's medication administration status.
// Shows which medications have been given, missed, or refused with a
// real-time progress tracker. Critical for Ofsted under Standard 3
// (Health & Wellbeing) and Reg 23 (Health of Children).
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useDashboard } from "@/hooks/use-dashboard";
import { cn } from "@/lib/utils";
import {
  Pill, CheckCircle2, AlertTriangle, Clock,
  ChevronRight, Loader2, XCircle,
} from "lucide-react";

export function MedicationStatusCard() {
  const { data, isLoading } = useDashboard();
  const med = data?.data?.medication;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Pill className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Medication Today
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

  if (!med) return null;

  const scheduled = med.scheduled_today ?? 0;
  const missed = med.missed_today ?? 0;
  const given = Math.max(0, scheduled - missed);
  const exceptions = med.exceptions_this_week ?? 0;
  const oversight = med.oversight_needed ?? 0;
  const stockAlerts = med.stock_alerts ?? 0;
  const pct = scheduled > 0 ? Math.round((given / scheduled) * 100) : 100;
  const hasConcern = missed > 0 || oversight > 0;

  return (
    <Card className={cn(
      missed > 0 && "border-red-200",
      oversight > 0 && !missed && "border-amber-200",
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Pill className={cn(
              "h-4 w-4",
              hasConcern ? "text-red-500" : "text-[var(--cs-aria-gold)]",
            )} />
            Medication Today
          </CardTitle>
          <div className="flex items-center gap-2">
            {missed > 0 && (
              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full flex items-center gap-0.5">
                <XCircle className="h-2.5 w-2.5" />{missed} missed
              </Badge>
            )}
            {oversight > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px] rounded-full">
                {oversight} need oversight
              </Badge>
            )}
            <Link href="/medication" className="text-[11px] text-blue-600 hover:underline">
              MAR →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-medium text-[var(--cs-text-muted)]">Administration Progress</span>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              pct === 100 ? "text-emerald-600" :
              pct >= 70 ? "text-blue-600" : "text-amber-600",
            )}>
              {given}/{scheduled}
            </span>
          </div>
          <Progress
            value={pct}
            className="h-2"
            color={pct === 100 ? "bg-emerald-500" : hasConcern ? "bg-red-500" : "bg-[var(--cs-aria-gold-bg)]0"}
          />
        </div>

        {/* Status breakdown */}
        <div className="grid grid-cols-4 gap-2">
          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-center">
            <div className="text-lg font-bold text-emerald-600 tabular-nums">{given}</div>
            <div className="text-[9px] text-emerald-500 font-medium">Given</div>
          </div>
          <div className={cn(
            "rounded-lg border p-2 text-center",
            missed > 0 ? "bg-red-50 border-red-100" : "bg-[var(--cs-surface)] border-[var(--cs-border-subtle)]",
          )}>
            <div className={cn("text-lg font-bold tabular-nums", missed > 0 ? "text-red-600" : "text-[var(--cs-text-gentle)]")}>{missed}</div>
            <div className={cn("text-[9px] font-medium", missed > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>Missed</div>
          </div>
          <div className={cn(
            "rounded-lg border p-2 text-center",
            exceptions > 0 ? "bg-orange-50 border-orange-100" : "bg-[var(--cs-surface)] border-[var(--cs-border-subtle)]",
          )}>
            <div className={cn("text-lg font-bold tabular-nums", exceptions > 0 ? "text-orange-600" : "text-[var(--cs-text-gentle)]")}>{exceptions}</div>
            <div className={cn("text-[9px] font-medium", exceptions > 0 ? "text-orange-500" : "text-[var(--cs-text-muted)]")}>Exceptions</div>
          </div>
          <div className={cn(
            "rounded-lg border p-2 text-center",
            stockAlerts > 0 ? "bg-amber-50 border-amber-100" : "bg-[var(--cs-surface)] border-[var(--cs-border-subtle)]",
          )}>
            <div className={cn("text-lg font-bold tabular-nums", stockAlerts > 0 ? "text-amber-600" : "text-[var(--cs-text-gentle)]")}>{stockAlerts}</div>
            <div className={cn("text-[9px] font-medium", stockAlerts > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Stock</div>
          </div>
        </div>

        {/* Alert for missed medications */}
        {missed > 0 && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
            <p className="text-[11px] text-red-700 font-medium">
              Missed medications require a body map check and incident log — Reg 23 compliance.
            </p>
          </div>
        )}

        {/* All done state */}
        {pct === 100 && !hasConcern && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-center">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-0.5" />
            <p className="text-[10px] font-medium text-emerald-700">All medications administered</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
