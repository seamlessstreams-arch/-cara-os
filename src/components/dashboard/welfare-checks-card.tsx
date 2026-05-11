"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — WELFARE CHECKS CARD
// Dashboard widget showing today's welfare check round completion,
// consecutive-day streak, and any flagged concerns.
// Reg 34 — Staff must safeguard children and promote their welfare.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWelfareChecks } from "@/hooks/use-welfare-checks";
import { cn } from "@/lib/utils";
import {
  Eye, Loader2, AlertTriangle, CheckCircle2,
  Clock, Shield, Flame,
} from "lucide-react";

// ── Component ───────────────────────────────────────────────────────────────

export function WelfareChecksCard() {
  const { data, isPending } = useWelfareChecks();
  const meta = data?.meta;
  const rounds = data?.data ?? [];
  const checks = data?.checks ?? [];

  const {
    todayRounds, totalChecks, concernsFlagged, streak,
    hasAlert, latestRoundTime, completionPct,
  } = useMemo(() => {
    const todayRounds = meta?.today_rounds ?? 0;
    const totalChecks = meta?.total_checks ?? 0;
    const concernsFlagged = meta?.concerns_flagged ?? 0;
    const streak = meta?.consecutive_days ?? 0;

    // Today's checks with concerns
    const todayConcerns = checks.filter((c) => c.concern_details);

    // Latest round time
    const todayRoundsList = rounds.filter((r) => {
      const today = new Date().toISOString().split("T")[0];
      return r.round_date === today;
    });
    const latestRoundTime = todayRoundsList.length > 0
      ? todayRoundsList[todayRoundsList.length - 1]?.round_time ?? null
      : null;

    // Completion: target 3 rounds per day (minimum recommended)
    const TARGET_ROUNDS = 3;
    const completionPct = Math.min(100, Math.round((todayRounds / TARGET_ROUNDS) * 100));

    return {
      todayRounds,
      totalChecks,
      concernsFlagged,
      streak,
      hasAlert: concernsFlagged > 0,
      latestRoundTime,
      completionPct,
    };
  }, [meta, rounds, checks]);

  if (isPending) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Eye className="h-4 w-4 text-cyan-500" />
            Welfare Checks
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
    <Card className={cn(hasAlert && "border-amber-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Eye className="h-4 w-4 text-cyan-500" />
            Welfare Checks
          </CardTitle>
          <Link href="/welfare-checks">
            <Badge className="text-[9px] bg-cyan-100 text-cyan-700 border-0 rounded-full hover:bg-cyan-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className={cn("rounded-xl p-2 text-center", todayRounds > 0 ? "bg-cyan-50" : "bg-[var(--cs-surface)]")}>
            <Eye className={cn("h-3 w-3 mx-auto mb-0.5", todayRounds > 0 ? "text-cyan-500" : "text-[var(--cs-text-muted)]")} />
            <div className={cn("text-sm font-bold tabular-nums", todayRounds > 0 ? "text-cyan-700" : "text-[var(--cs-text-muted)]")}>{todayRounds}</div>
            <div className={cn("text-[9px]", todayRounds > 0 ? "text-cyan-500" : "text-[var(--cs-text-muted)]")}>Today</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", concernsFlagged > 0 ? "bg-amber-50" : "bg-emerald-50")}>
            <AlertTriangle className={cn("h-3 w-3 mx-auto mb-0.5", concernsFlagged > 0 ? "text-amber-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", concernsFlagged > 0 ? "text-amber-700" : "text-emerald-700")}>{concernsFlagged}</div>
            <div className={cn("text-[9px]", concernsFlagged > 0 ? "text-amber-500" : "text-emerald-500")}>Concerns</div>
          </div>
          <div className="rounded-xl bg-[var(--cs-aria-gold-bg)] p-2 text-center">
            <Flame className="h-3 w-3 text-[var(--cs-aria-gold)] mx-auto mb-0.5" />
            <div className="text-sm font-bold text-[var(--cs-aria-gold)] tabular-nums">{streak}</div>
            <div className="text-[9px] text-[var(--cs-aria-gold)]">Day Streak</div>
          </div>
        </div>

        {/* Today's progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="text-[var(--cs-text-muted)]">Today&apos;s Rounds</span>
            <span className={cn(
              "font-bold tabular-nums",
              completionPct >= 100 ? "text-emerald-600" : completionPct >= 66 ? "text-cyan-600" : "text-amber-600",
            )}>
              {todayRounds}/3 target
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--cs-surface)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completionPct >= 100 ? "bg-emerald-500" : completionPct >= 66 ? "bg-cyan-500" : "bg-amber-500",
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Latest round time */}
        {latestRoundTime && (
          <div className="flex items-center justify-between text-[10px] px-1">
            <span className="flex items-center gap-1 text-[var(--cs-text-muted)]">
              <Clock className="h-3 w-3" /> Last round
            </span>
            <span className="font-medium text-[var(--cs-text-secondary)]">{latestRoundTime}</span>
          </div>
        )}

        {/* Concerns alert */}
        {concernsFlagged > 0 && (
          <div className="rounded-lg bg-amber-50 border border-amber-100 p-2 flex items-start gap-2">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-amber-700">
                {concernsFlagged} concern{concernsFlagged !== 1 ? "s" : ""} flagged
              </p>
              <p className="text-[10px] text-amber-600">
                Review welfare concerns and record follow-up actions
              </p>
            </div>
          </div>
        )}

        {/* No rounds alert */}
        {todayRounds === 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <Shield className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                No welfare checks recorded today
              </p>
              <p className="text-[10px] text-red-600">
                Reg 34 — Staff must conduct regular welfare checks
              </p>
            </div>
          </div>
        )}

        {/* All good */}
        {todayRounds > 0 && concernsFlagged === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              All checks clear — no concerns
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
