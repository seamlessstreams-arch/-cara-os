"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF ABSENCE INTELLIGENCE CARD
// Dashboard card for sickness monitoring, Bradford factor alerts, and trends.
// Powered by the Workforce Intelligence Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserMinus, ChevronRight, Brain, Loader2,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Activity,
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

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Trend icon helper ────────────────────────────────────────────────────────

function TrendIcon({ trend }: { trend: "increasing" | "stable" | "decreasing" }) {
  if (trend === "increasing") return <TrendingUp className="h-3 w-3" />;
  if (trend === "decreasing") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

// ── Component ────────────────────────────────────────────────────────────────

export function StaffAbsenceCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-brand" />
            Staff Absence
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

  const s = intel.sickness;

  const trendColor =
    s.trend === "increasing" ? "text-red-600 bg-red-50 border-red-200"
    : s.trend === "decreasing" ? "text-green-600 bg-green-50 border-green-200"
    : "text-blue-600 bg-blue-50 border-blue-200";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserMinus className="h-4 w-4 text-brand" />
            Staff Absence
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", s.total_sick_days_this_month === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", s.total_sick_days_this_month === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {s.total_sick_days_this_month}
            </p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", s.staff_with_sickness === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", s.staff_with_sickness === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {s.staff_with_sickness}
            </p>
            <p className="text-[10px] text-muted-foreground">Staff Sick</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-blue-50">
            <Badge variant="outline" className={cn("text-[10px] gap-0.5", trendColor)}>
              <TrendIcon trend={s.trend} />
              {s.trend}
            </Badge>
            <p className="text-[10px] text-muted-foreground mt-1">Trend</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (s.bradford_factor_alerts?.length ?? 0) === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (s.bradford_factor_alerts?.length ?? 0) === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {(s.bradford_factor_alerts?.length ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Bradford</p>
          </div>
        </div>

        {/* ── Sickness trend comparison ───────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Activity className="h-3 w-3" />
            Monthly Comparison
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">This month</span>
            <span className="font-semibold tabular-nums">{s.total_sick_days_this_month} days</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Last month</span>
            <span className="font-semibold tabular-nums">{s.total_sick_days_last_month} days</span>
          </div>
          {s.total_sick_days_last_month > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Change</span>
              {(() => {
                const diff = s.total_sick_days_this_month - s.total_sick_days_last_month;
                const pct = Math.round((diff / s.total_sick_days_last_month) * 100);
                return (
                  <span className={cn("font-semibold tabular-nums", diff > 0 ? "text-[--cs-risk]" : diff < 0 ? "text-[--cs-success]" : "text-blue-600")}>
                    {diff > 0 ? "+" : ""}{diff} ({pct > 0 ? "+" : ""}{pct}%)
                  </span>
                );
              })()}
            </div>
          )}
        </div>

        {/* ── Bradford factor alerts ──────────────────────────────────── */}

        {(s.bradford_factor_alerts?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bradford Factor Alerts
            </p>
            <div className="space-y-1">
              {(s.bradford_factor_alerts ?? []).map((alert) => (
                <div key={alert.staff_id} className="flex items-center justify-between rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-[--cs-risk]">{alert.staff_name}</span>
                    <span className="text-red-600 ml-1">
                      {alert.instances} instances, {alert.days} days
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk] border-red-300 shrink-0 ml-2">
                    BF: {alert.factor}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Absence Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
