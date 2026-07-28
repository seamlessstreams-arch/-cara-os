"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF LONE WORKING RISK CARD
// Live data from useWorkforceIntelligence() — staffing, DBS, profile.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WorkforceIntelligenceResult } from "@/lib/engines/workforce-intelligence-engine";

interface WorkforceIntelligenceResponse {
  data: WorkforceIntelligenceResult;
}

function useWorkforceIntelligence() {
  return useQuery({
    queryKey: ["workforce-intelligence"],
    queryFn: () => api.get<WorkforceIntelligenceResponse>("/workforce-intelligence"),
    refetchInterval: 60_000, // 60 second refresh (workforce data changes less frequently)
  });
}

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function StaffLoneWorkingRiskCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-brand" />
            Lone Working Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { staffing, dbs, profile } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-brand" />
            Lone Working Risk
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", staffing.shifts_unfilled === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.shifts_unfilled === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{staffing.shifts_unfilled}</p>
            <p className="text-[10px] text-muted-foreground">Unfilled</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", staffing.no_shows_this_month === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.no_shows_this_month === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{staffing.no_shows_this_month}</p>
            <p className="text-[10px] text-muted-foreground">No Shows</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", dbs.expired_or_missing === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", dbs.expired_or_missing === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{dbs.expired_or_missing}</p>
            <p className="text-[10px] text-muted-foreground">DBS Gap</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile.staff_on_leave_today}</p>
            <p className="text-[10px] text-muted-foreground">On Leave</p>
          </div>
        </div>

        {/* ── Risk indicators ─────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold">Risk Indicators</p>
          <div className="space-y-1">
            {staffing.shifts_unfilled > 0 && (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk] mr-1">{staffing.shifts_unfilled} unfilled shifts</Badge>
            )}
            {staffing.no_shows_this_month > 0 && (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk] mr-1">{staffing.no_shows_this_month} no-shows this month</Badge>
            )}
            {dbs.expired_or_missing > 0 && (
              <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning] mr-1">{dbs.expired_or_missing} DBS expired/missing</Badge>
            )}
            {staffing.shifts_unfilled === 0 && staffing.no_shows_this_month === 0 && dbs.expired_or_missing === 0 && (
              <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">All clear — low risk</Badge>
            )}
          </div>
        </div>

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Risk Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
