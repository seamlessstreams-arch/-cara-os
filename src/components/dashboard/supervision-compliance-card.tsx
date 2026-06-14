"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUPERVISION COMPLIANCE CARD
// Dashboard widget showing supervision completion rate, overdue sessions,
// upcoming schedule, and wellbeing trends.
// Reg 33 — Staff must receive regular supervision appropriate to their role.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSupervisions } from "@/hooks/use-supervision";
import { useStaff } from "@/hooks/use-staff";
import { getStaffName } from "@/lib/seed-data";
import { cn, formatRelative } from "@/lib/utils";
import {
  MessageSquare, Loader2, AlertTriangle, CheckCircle2,
  Clock, Users, Heart, Calendar,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function SupervisionComplianceCard() {
  const supQuery = useSupervisions();
  const staffQuery = useStaff();
  const supervisions = supQuery.data?.data ?? [];
  const meta = supQuery.data?.meta;
  const allStaff = (staffQuery.data?.data ?? []).filter((s) => s.is_active);

  const {
    overdue, dueSoon, completedCount, scheduledCount,
    compliancePct, overdueStaff, avgWellbeing, hasAlert,
  } = useMemo(() => {
    const overdue = meta?.overdue ?? 0;
    const dueSoon = meta?.due_soon ?? 0;
    const completedCount = meta?.completed ?? 0;
    const scheduledCount = meta?.scheduled ?? 0;
    const total = meta?.total ?? 0;

    const compliancePct = total > 0 ? Math.round(((total - overdue) / total) * 100) : 100;

    // Find staff who are overdue
    const overdueStaff = allStaff
      .filter((s) => s.supervision_overdue)
      .map((s) => ({ id: s.id, name: s.full_name, daysDue: s.supervision_days_until_due }))
      .sort((a, b) => (a.daysDue ?? 0) - (b.daysDue ?? 0))
      .slice(0, 4);

    // Average wellbeing from recent supervisions
    const recentWithWellbeing = supervisions
      .filter((s) => s.status === "completed" && s.wellbeing_score !== null)
      .slice(0, 10);
    const avgWellbeing = recentWithWellbeing.length > 0
      ? Math.round(recentWithWellbeing.reduce((sum, s) => sum + (s.wellbeing_score ?? 0), 0) / recentWithWellbeing.length * 10) / 10
      : null;

    return {
      overdue, dueSoon, completedCount, scheduledCount,
      compliancePct, overdueStaff, avgWellbeing,
      hasAlert: overdue > 0,
    };
  }, [meta, allStaff, supervisions]);

  if (supQuery.isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <MessageSquare className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Supervision
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
    <Card className={cn(hasAlert && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <MessageSquare className="h-4 w-4 text-[var(--cs-cara-gold)]" />
            Supervision
          </CardTitle>
          <Link href="/supervision">
            <Badge className="text-[9px] bg-[var(--cs-cara-gold-bg)] text-[var(--cs-cara-gold)] border-0 rounded-full hover:bg-[var(--cs-cara-gold-soft)] cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl p-2 text-center", overdue > 0 ? "bg-red-50" : "bg-emerald-50")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", overdue > 0 ? "text-red-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", overdue > 0 ? "text-red-700" : "text-emerald-700")}>{overdue}</div>
            <div className={cn("text-[9px]", overdue > 0 ? "text-red-500" : "text-emerald-500")}>Overdue</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", dueSoon > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", dueSoon > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", dueSoon > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{dueSoon}</div>
            <div className={cn("text-[9px]", dueSoon > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Due Soon</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700 tabular-nums">{completedCount}</div>
            <div className="text-[9px] text-emerald-500">Completed</div>
          </div>
        </div>

        {/* Compliance bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="text-[var(--cs-text-muted)]">Compliance</span>
            <span className={cn(
              "font-bold tabular-nums",
              compliancePct >= 90 ? "text-emerald-600" : compliancePct >= 75 ? "text-amber-600" : "text-red-600",
            )}>
              {compliancePct}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--cs-surface)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                compliancePct >= 90 ? "bg-emerald-500" : compliancePct >= 75 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${compliancePct}%` }}
            />
          </div>
        </div>

        {/* Wellbeing score */}
        {avgWellbeing !== null && (
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="flex items-center gap-1 text-[var(--cs-text-muted)]">
              <Heart className="h-3 w-3" /> Avg wellbeing
            </span>
            <span className={cn(
              "font-bold tabular-nums",
              avgWellbeing >= 4 ? "text-emerald-600" : avgWellbeing >= 3 ? "text-amber-600" : "text-red-600",
            )}>
              {avgWellbeing}/5
            </span>
          </div>
        )}

        {/* Overdue alert */}
        {overdue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {overdue} supervision{overdue !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-[10px] text-red-600">
                Reg 33 requires regular supervision for all staff
              </p>
            </div>
          </div>
        )}

        {/* Overdue staff list */}
        {overdueStaff.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-[var(--cs-text-muted)] px-1">Overdue Staff</span>
            {overdueStaff.map((s) => (
              <Link key={s.id} href={`/staff/${s.id}`}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--cs-surface)] transition-colors bg-red-50/50">
                  <Users className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                    {s.name}
                  </span>
                  <span className="text-[9px] text-red-500 font-semibold tabular-nums shrink-0">
                    {s.daysDue !== null && s.daysDue < 0 ? `${Math.abs(s.daysDue)}d overdue` : "due"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All clear */}
        {overdue === 0 && dueSoon === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All supervisions on track
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
