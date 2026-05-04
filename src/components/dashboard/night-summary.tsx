"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT SUMMARY WIDGET
// Dashboard card showing last night's welfare check results at a glance.
// Critical for morning handover — staff arriving for day shift need to
// immediately see how the night went.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWelfareChecks } from "@/hooks/use-welfare-checks";
import { getYPName, getStaffName } from "@/lib/seed-data";
import { cn, daysFromNow } from "@/lib/utils";
import {
  Moon, CheckCircle2, AlertTriangle, Eye, Loader2,
  Shield, BedDouble, Sun, Clock,
} from "lucide-react";
import type { WelfareCheckRound, WelfareCheckStatus } from "@/types/extended";

const STATUS_EMOJI: Record<WelfareCheckStatus, { icon: React.ElementType; color: string }> = {
  ok:          { icon: CheckCircle2,  color: "text-emerald-500" },
  concern:     { icon: AlertTriangle, color: "text-red-500" },
  asleep:      { icon: Moon,          color: "text-indigo-500" },
  awake:       { icon: Sun,           color: "text-amber-500" },
  not_in_room: { icon: AlertTriangle, color: "text-red-500" },
  refused:     { icon: AlertTriangle, color: "text-orange-500" },
};

export function NightSummary() {
  const yesterday = daysFromNow(-1);
  const { data, isLoading } = useWelfareChecks({ date: yesterday });

  const rounds = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Moon className="h-4 w-4 text-indigo-500" />
            Last Night
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

  // Aggregate child statuses across all rounds
  const childSummary: Record<string, {
    name: string;
    checks: number;
    lastStatus: WelfareCheckStatus;
    hadConcern: boolean;
    moods: string[];
  }> = {};

  rounds.forEach((round) => {
    round.checks.forEach((check) => {
      if (!childSummary[check.child_id]) {
        childSummary[check.child_id] = {
          name: getYPName(check.child_id),
          checks: 0,
          lastStatus: check.status,
          hadConcern: false,
          moods: [],
        };
      }
      const cs = childSummary[check.child_id];
      cs.checks++;
      cs.lastStatus = check.status;
      if (check.status === "concern" || check.status === "not_in_room") {
        cs.hadConcern = true;
      }
      if (check.mood && !cs.moods.includes(check.mood)) {
        cs.moods.push(check.mood);
      }
    });
  });

  const sleepInStaff = rounds.length > 0 ? getStaffName(rounds[0].staff_id) : null;
  const hasConcerns = Object.values(childSummary).some((c) => c.hadConcern);
  const allSecure = rounds.every((r) => r.building_secure && r.external_doors_locked);

  return (
    <Card className={cn(hasConcerns && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Moon className="h-4 w-4 text-indigo-500" />
            Last Night
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasConcerns && (
              <Badge className="bg-red-100 text-red-700 border-0 text-[10px] rounded-full">
                Concerns
              </Badge>
            )}
            <Link href="/welfare-checks" className="text-[11px] text-blue-600 hover:underline">
              All checks →
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rounds.length === 0 ? (
          <div className="py-4 text-center">
            <Moon className="h-6 w-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-500">No welfare checks recorded last night</p>
            <Link href="/welfare-checks" className="text-[10px] text-blue-600 hover:underline mt-1 inline-block">
              Start a check →
            </Link>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="flex items-center gap-4 mb-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3 text-indigo-500" />
                {rounds.length} rounds
              </span>
              {sleepInStaff && (
                <span className="flex items-center gap-1">
                  <BedDouble className="h-3 w-3 text-slate-400" />
                  {sleepInStaff.split(" ")[0]}
                </span>
              )}
              <span className={cn(
                "flex items-center gap-1",
                allSecure ? "text-emerald-600" : "text-red-600",
              )}>
                <Shield className="h-3 w-3" />
                {allSecure ? "Secure" : "Issue"}
              </span>
            </div>

            {/* Child summaries */}
            <div className="space-y-1.5">
              {Object.entries(childSummary).map(([childId, cs]) => {
                const StatusIcon = STATUS_EMOJI[cs.lastStatus]?.icon ?? CheckCircle2;
                const statusColor = STATUS_EMOJI[cs.lastStatus]?.color ?? "text-slate-400";

                return (
                  <div key={childId} className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2",
                    cs.hadConcern ? "bg-red-50" : "bg-slate-50",
                  )}>
                    <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusColor)} />
                    <span className="text-[11px] font-medium text-slate-700 flex-1 truncate">
                      {cs.name}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {cs.checks} checks
                    </span>
                    {cs.moods.length > 0 && (
                      <span className="text-[10px] text-slate-400 shrink-0 capitalize">
                        {cs.moods[cs.moods.length - 1]}
                      </span>
                    )}
                    {cs.hadConcern && (
                      <Badge className="bg-red-100 text-red-700 border-0 text-[9px] rounded-full shrink-0">
                        Concern
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Round times */}
            <div className="flex gap-1 mt-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex-1 text-center rounded-lg bg-indigo-50 border border-indigo-100 py-1.5"
                >
                  <Clock className="h-2.5 w-2.5 mx-auto mb-0.5 text-indigo-400" />
                  <span className="text-[10px] font-medium text-indigo-700 tabular-nums">
                    {round.round_time}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
