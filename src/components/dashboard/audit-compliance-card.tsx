"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — AUDIT COMPLIANCE CARD
// Dashboard widget showing quality assurance audit status.
// Reg 45 — quality of care reviews must be systematic and ongoing.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAudits } from "@/hooks/use-audits";
import { cn } from "@/lib/utils";
import {
  ClipboardCheck, Loader2, AlertTriangle, CheckCircle2,
  Clock, BarChart3, Star,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function AuditComplianceCard() {
  const { data, isPending } = useAudits();
  const meta = data?.meta;
  const audits = data?.data ?? [];

  const stats = useMemo(() => {
    if (!audits.length) return { avgScore: 0, lowScoreCount: 0, totalFindings: 0, totalActions: 0 };

    const completed = audits.filter((a) => a.status === "completed" && a.max_score > 0);
    const avgScore = completed.length > 0
      ? Math.round(completed.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / completed.length)
      : 0;
    const lowScoreCount = completed.filter((a) => (a.score / a.max_score) * 100 < 70).length;
    const totalFindings = audits.reduce((sum, a) => sum + a.findings, 0);
    const totalActions = audits.reduce((sum, a) => sum + a.actions, 0);

    return { avgScore, lowScoreCount, totalFindings, totalActions };
  }, [audits]);

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardCheck className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Audit Compliance
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

  const hasAlert = meta.overdue > 0 || stats.lowScoreCount > 0;

  return (
    <Card className={cn(hasAlert && "border-[var(--cs-aria-gold-soft)]")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ClipboardCheck className="h-4 w-4 text-[var(--cs-aria-gold)]" />
            Audit Compliance
          </CardTitle>
          <Link href="/audits">
            <Badge className="text-[9px] bg-[var(--cs-aria-gold-bg)] text-[var(--cs-aria-gold)] border-0 rounded-full hover:bg-[var(--cs-aria-gold-soft)] cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-emerald-50 p-2 text-center">
            <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-emerald-700 tabular-nums">{meta.completed}</div>
            <div className="text-[9px] text-emerald-500">Completed</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", meta.overdue > 0 ? "bg-red-50" : "bg-[var(--cs-surface)]")}>
            <Clock className={cn("h-3 w-3 mx-auto mb-0.5", meta.overdue > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", meta.overdue > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>{meta.overdue}</div>
            <div className={cn("text-[9px]", meta.overdue > 0 ? "text-red-500" : "text-[var(--cs-text-muted)]")}>Overdue</div>
          </div>
          <div className="rounded-xl bg-blue-50 p-2 text-center">
            <BarChart3 className="h-3 w-3 text-blue-500 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-blue-700 tabular-nums">{meta.in_progress}</div>
            <div className="text-[9px] text-blue-500">In Progress</div>
          </div>
        </div>

        {/* Average score */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)] flex items-center gap-1">
            <Star className="h-3 w-3" /> Average score
          </span>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-16 rounded-full bg-[var(--cs-surface)] overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  stats.avgScore >= 80 ? "bg-emerald-500" : stats.avgScore >= 60 ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${Math.min(100, stats.avgScore)}%` }}
              />
            </div>
            <span className={cn(
              "font-bold tabular-nums",
              stats.avgScore >= 80 ? "text-emerald-600" : stats.avgScore >= 60 ? "text-amber-600" : "text-red-600"
            )}>
              {stats.avgScore}%
            </span>
          </div>
        </div>

        {/* Findings & Actions */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)]">Total findings</span>
          <span className="font-bold text-[var(--cs-text-secondary)] tabular-nums">{stats.totalFindings}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)]">Open actions</span>
          <span className={cn("font-bold tabular-nums", stats.totalActions > 0 ? "text-amber-600" : "text-[var(--cs-text-muted)]")}>
            {stats.totalActions}
          </span>
        </div>

        {/* Scheduled */}
        <div className="flex items-center justify-between text-[10px] px-1">
          <span className="text-[var(--cs-text-muted)]">Scheduled</span>
          <span className="font-bold text-blue-600 tabular-nums">{meta.scheduled}</span>
        </div>

        {/* Overdue alert */}
        {meta.overdue > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {meta.overdue} audit{meta.overdue !== 1 ? "s" : ""} overdue
              </p>
              <p className="text-[10px] text-red-600">
                Reg 45 — quality of care reviews must not lapse
              </p>
            </div>
          </div>
        )}

        {/* Low-score alert */}
        {stats.lowScoreCount > 0 && meta.overdue === 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] font-semibold text-amber-700">
              {stats.lowScoreCount} audit{stats.lowScoreCount !== 1 ? "s" : ""} scored below 70%
            </p>
          </div>
        )}

        {/* All clear */}
        {meta.overdue === 0 && stats.lowScoreCount === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All audits on track
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
