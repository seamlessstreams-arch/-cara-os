"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CARE PLAN COMPLIANCE CARD
// Dashboard widget surfacing care plan health: RAG distribution, goal status,
// LAC review deadlines, and attention-needed alerts.
// Children's Homes Quality Standard 1 — Care and Support.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCarePlans } from "@/hooks/use-care-plans";
import { getYPName } from "@/lib/seed-data";
import { cn } from "@/lib/utils";
import {
  ClipboardList, Loader2, AlertTriangle, CheckCircle2,
  ChevronRight, Calendar, Target, Flame, Clock,
} from "lucide-react";
import type { CarePlan } from "@/types/extended";

// ── Helpers ─────────────────────────────────────────────────────────────────

function lacDaysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function overallRAG(plan: CarePlan): "green" | "amber" | "red" {
  const attention = plan.goals.filter((g) => g.status === "attention_needed").length;
  const notStarted = plan.goals.filter((g) => g.status === "not_started").length;
  if (attention >= 2 || (attention >= 1 && notStarted >= 2)) return "red";
  if (attention >= 1 || notStarted >= 1) return "amber";
  return "green";
}

// ── Component ───────────────────────────────────────────────────────────────

export function CarePlanComplianceCard() {
  const plansQuery = useCarePlans({ homeId: "home_oak" });
  const plans = plansQuery.data?.data ?? [];

  const {
    total, redCount, amberCount, greenCount,
    totalGoals, attentionGoals, achievedGoals,
    lacOverdue, lacDueSoon, lacItems, hasAlert,
  } = useMemo(() => {
    if (plans.length === 0) return {
      total: 0, redCount: 0, amberCount: 0, greenCount: 0,
      totalGoals: 0, attentionGoals: 0, achievedGoals: 0,
      lacOverdue: 0, lacDueSoon: 0,
      lacItems: [] as { childId: string; days: number }[],
      hasAlert: false,
    };

    const redCount = plans.filter((p) => overallRAG(p) === "red").length;
    const amberCount = plans.filter((p) => overallRAG(p) === "amber").length;
    const greenCount = plans.filter((p) => overallRAG(p) === "green").length;

    const totalGoals = plans.reduce((n, p) => n + p.goals.length, 0);
    const attentionGoals = plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "attention_needed").length, 0);
    const achievedGoals = plans.reduce((n, p) => n + p.goals.filter((g) => g.status === "achieved").length, 0);

    const lacItems: { childId: string; days: number }[] = [];
    let lacOverdue = 0;
    let lacDueSoon = 0;
    for (const p of plans) {
      const d = lacDaysUntil(p.next_lac_review);
      if (d !== null) {
        if (d < 0) { lacOverdue++; lacItems.push({ childId: p.child_id, days: d }); }
        else if (d <= 30) { lacDueSoon++; lacItems.push({ childId: p.child_id, days: d }); }
      }
    }
    lacItems.sort((a, b) => a.days - b.days);

    return {
      total: plans.length, redCount, amberCount, greenCount,
      totalGoals, attentionGoals, achievedGoals,
      lacOverdue, lacDueSoon, lacItems: lacItems.slice(0, 4),
      hasAlert: redCount > 0 || lacOverdue > 0,
    };
  }, [plans]);

  if (plansQuery.isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardList className="h-4 w-4 text-teal-500" />
            Care Plans
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
            <ClipboardList className="h-4 w-4 text-teal-500" />
            Care Plans
          </CardTitle>
          <Link href="/care-plans">
            <Badge className="text-[9px] bg-teal-100 text-teal-700 border-0 rounded-full hover:bg-teal-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* RAG distribution */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl p-2 text-center", redCount > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", redCount > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", redCount > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>{redCount}</div>
            <div className={cn("text-[9px]", redCount > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>At Risk</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", amberCount > 0 ? "bg-amber-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", amberCount > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", amberCount > 0 ? "text-amber-700" : "text-[var(--cs-text-muted)]")}>{amberCount}</div>
            <div className={cn("text-[9px]", amberCount > 0 ? "text-amber-500" : "text-[var(--cs-text-muted)]")}>Review</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 text-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700 tabular-nums">{greenCount}</div>
            <div className="text-[9px] text-emerald-500">On Track</div>
          </div>
        </div>

        {/* Goal metrics */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[var(--cs-text-secondary)]">
              <Target className="h-3 w-3" /> {totalGoals} goals
            </span>
            {achievedGoals > 0 && (
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> {achievedGoals} achieved
              </span>
            )}
          </div>
          {attentionGoals > 0 && (
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <Flame className="h-3 w-3" /> {attentionGoals} attention
            </span>
          )}
        </div>

        {/* LAC overdue alert */}
        {lacOverdue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {lacOverdue} LAC review{lacOverdue !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-[10px] text-red-600">
                Statutory deadline missed — escalate to IRO
              </p>
            </div>
          </div>
        )}

        {/* LAC review due alert */}
        {lacDueSoon > 0 && lacOverdue === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <Calendar className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-amber-700">
                {lacDueSoon} LAC review{lacDueSoon !== 1 ? "s" : ""} due within 30 days
              </p>
            </div>
          </div>
        )}

        {/* Upcoming LAC reviews */}
        {lacItems.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-medium text-[var(--cs-text-muted)] px-1">LAC Reviews</span>
            {lacItems.map((item) => {
              const isOverdue = item.days < 0;
              return (
                <Link key={item.childId} href={`/young-people/${item.childId}`}>
                  <div className={cn(
                    "flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--cs-surface)] transition-colors",
                    isOverdue && "bg-red-50/50",
                  )}>
                    <Calendar className={cn("h-3 w-3 shrink-0", isOverdue ? "text-red-500" : "text-amber-500")} />
                    <span className="text-[11px] font-medium text-[var(--cs-text-secondary)] flex-1 truncate">
                      {getYPName(item.childId)}
                    </span>
                    <span className={cn(
                      "text-[9px] tabular-nums shrink-0 font-medium",
                      isOverdue ? "text-red-600" : item.days <= 14 ? "text-amber-600" : "text-[var(--cs-text-muted)]",
                    )}>
                      {isOverdue ? `${Math.abs(item.days)}d overdue` : item.days === 0 ? "today" : `in ${item.days}d`}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* All clear */}
        {total > 0 && redCount === 0 && amberCount === 0 && lacOverdue === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All care plans on track
            </span>
          </div>
        )}

        {total === 0 && (
          <div className="text-center py-4 text-[var(--cs-text-muted)]">
            <ClipboardList className="h-5 w-5 mx-auto mb-1 text-[var(--cs-text-gentle)]" />
            <p className="text-[10px]">No care plans loaded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
