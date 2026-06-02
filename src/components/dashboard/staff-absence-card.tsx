"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF ABSENCE INTELLIGENCE CARD
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
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Insight styling ──────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
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
            <p className={cn("text-lg font-bold tabular-nums", s.total_sick_days_this_month === 0 ? "text-green-600" : "text-amber-600")}>
              {s.total_sick_days_this_month}
            </p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", s.staff_with_sickness === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", s.staff_with_sickness === 0 ? "text-green-600" : "text-amber-600")}>
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
            <p className={cn("text-lg font-bold tabular-nums", (s.bradford_factor_alerts?.length ?? 0) === 0 ? "text-green-600" : "text-red-600")}>
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
                  <span className={cn("font-semibold tabular-nums", diff > 0 ? "text-red-600" : diff < 0 ? "text-green-600" : "text-blue-600")}>
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
                <div key={alert.staff_id} className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-2 text-xs">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-red-800">{alert.staff_name}</span>
                    <span className="text-red-600 ml-1">
                      {alert.instances} instances, {alert.days} days
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] text-red-700 bg-red-100 border-red-300 shrink-0 ml-2">
                    BF: {alert.factor}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Absence Intelligence
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
