"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF WELLBEING INTELLIGENCE CARD
// Live data from useWorkforceIntelligence() — sickness, supervision, staffing.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, Brain, Loader2,
  TrendingUp, TrendingDown, Minus,
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

export function StaffWellbeingCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Staff Wellbeing
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

  const { sickness, supervision, staffing, profile } = intel;
  const supervisionRate = supervision.total_staff_requiring > 0
    ? Math.round((supervision.up_to_date / supervision.total_staff_requiring) * 100)
    : 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Staff Wellbeing
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", sickness.total_sick_days_this_month <= 3 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.total_sick_days_this_month <= 3 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{sickness.total_sick_days_this_month}</p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", sickness.staff_with_sickness === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.staff_with_sickness === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{sickness.staff_with_sickness}</p>
            <p className="text-[10px] text-muted-foreground">Staff Sick</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", supervisionRate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", supervisionRate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{supervisionRate}%</p>
            <p className="text-[10px] text-muted-foreground">Supervision</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile.staff_on_shift_today}</p>
            <p className="text-[10px] text-muted-foreground">On Shift</p>
          </div>
        </div>

        {/* ── Sickness trend ──────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold flex items-center gap-1">
            {sickness.trend === "decreasing" && <TrendingDown className="h-3 w-3 text-green-500" />}
            {sickness.trend === "increasing" && <TrendingUp className="h-3 w-3 text-red-500" />}
            {sickness.trend === "stable" && <Minus className="h-3 w-3 text-blue-500" />}
            Sickness Trend
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>This month: {sickness.total_sick_days_this_month}d</span>
            <span>Last month: {sickness.total_sick_days_last_month}d</span>
          </div>
          <Badge className={cn("text-[10px]", sickness.trend === "decreasing" ? "bg-[--cs-success-bg] text-[--cs-success]" : sickness.trend === "increasing" ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-info-bg] text-[--cs-info]")}>
            {sickness.trend}
          </Badge>
        </div>

        {/* ── Bradford alerts ─────────────────────────────────────────── */}

        {(sickness.bradford_factor_alerts?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Bradford Factor Alerts</p>
            {sickness.bradford_factor_alerts.slice(0, 3).map((a) => (
              <div key={a.staff_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{a.staff_name}</span>
                <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">BF: {a.factor}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Wellbeing Intelligence
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
