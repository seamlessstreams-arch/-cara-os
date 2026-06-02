"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RETURN TO WORK INTERVIEW CARD
// Live data from useWorkforceIntelligence() — sickness, bradford, trend.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BriefcaseMedical, ChevronRight, Brain, Loader2, TrendingDown, TrendingUp, Minus, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const TREND_CONFIG = {
  increasing: { icon: TrendingUp, color: "text-red-600", label: "Increasing" },
  stable: { icon: Minus, color: "text-blue-600", label: "Stable" },
  decreasing: { icon: TrendingDown, color: "text-green-600", label: "Decreasing" },
};

export function StaffReturnToWorkInterviewCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-cyan-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { sickness } = d;
  const trend = TREND_CONFIG[sickness.trend];
  const TrendIcon = trend.icon;
  const bradfordCount = (sickness.bradford_factor_alerts?.length ?? 0);

  return (
    <Card className="overflow-hidden border-cyan-200">
      <CardHeader className="pb-3 bg-cyan-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BriefcaseMedical className="h-4 w-4 text-cyan-600" />
            <span className="text-cyan-900">Return to Work</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-cyan-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", sickness.total_sick_days_this_month > 10 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.total_sick_days_this_month > 10 ? "text-red-600" : "text-green-600")}>{sickness.total_sick_days_this_month}</p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", sickness.staff_with_sickness > 3 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.staff_with_sickness > 3 ? "text-amber-600" : "text-green-600")}>{sickness.staff_with_sickness}</p>
            <p className="text-[10px] text-muted-foreground">Staff Sick</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", bradfordCount > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", bradfordCount > 0 ? "text-red-600" : "text-green-600")}>{bradfordCount}</p>
            <p className="text-[10px] text-muted-foreground">Bradford</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-cyan-50">
            <p className={cn("text-lg font-bold tabular-nums flex items-center justify-center gap-1", trend.color)}>
              <TrendIcon className="h-3.5 w-3.5" />
            </p>
            <p className="text-[10px] text-muted-foreground">{trend.label}</p>
          </div>
        </div>

        {/* ── Sickness data ───────────────────────────────────────────── */}
        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <UserCheck className="h-3 w-3" />Sickness Overview
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">This Month</span>
              <span className={cn("font-bold tabular-nums", sickness.total_sick_days_this_month > 10 ? "text-red-600" : "text-green-600")}>{sickness.total_sick_days_this_month}d</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Last Month</span>
              <span className="font-bold tabular-nums">{sickness.total_sick_days_last_month}d</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Staff Affected</span>
              <span className="font-bold tabular-nums">{sickness.staff_with_sickness}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Trend</span>
              <span className={cn("font-bold tabular-nums", trend.color)}>{trend.label}</span>
            </div>
          </div>
        </div>

        {/* ── ARIA insights ──────────────────────────────────────────── */}
        {d.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />ARIA Insights
            </p>
            {d.insights.map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity])}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
