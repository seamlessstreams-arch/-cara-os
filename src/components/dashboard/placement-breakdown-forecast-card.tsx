"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PLACEMENT BREAKDOWN FORECAST CARD
// Forward-looking early-warning widget: per-child breakdown risk, trajectory,
// and projected days-to-critical. Powered by the Placement Breakdown Forecast
// Engine — live data (Reg 11 placement stability / Reg 12 / Reg 8).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, AlertTriangle, Brain,
  Loader2, TrendingUp, TrendingDown, Minus, CalendarClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePlacementBreakdownForecast } from "@/hooks/use-placement-breakdown-forecast";

// ── Styling ────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const BAND_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  elevated: { bg: "bg-amber-100", text: "text-amber-700" },
  watch: { bg: "bg-blue-100", text: "text-blue-700" },
  stable: { bg: "bg-green-100", text: "text-green-700" },
};

const TREND_ICON: Record<string, React.ReactNode> = {
  escalating: <TrendingUp className="h-3 w-3 text-red-500" />,
  improving: <TrendingDown className="h-3 w-3 text-green-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
};

// ── Component ────────────────────────────────────────────────────────────────

export function PlacementBreakdownForecastCard() {
  const { data, isLoading } = usePlacementBreakdownForecast();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Placement Breakdown Forecast
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

  const o = intel.overview;
  const forecasts = intel.child_forecasts ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Placement Breakdown Forecast
          </CardTitle>
          <Link href="/placement-breakdown-forecast" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Placements</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.critical_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.critical_count > 0 ? "text-red-600" : "text-green-600")}>
              {o.critical_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.escalating_count > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.escalating_count > 0 ? "text-amber-600" : "text-gray-500")}>
              {o.escalating_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Rising</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.earliest_projected_days != null ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.earliest_projected_days != null ? "text-red-600" : "text-gray-400")}>
              {o.earliest_projected_days != null ? `${o.earliest_projected_days}d` : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">Soonest</p>
          </div>
        </div>

        {/* ── Per-child forecasts ──────────────────────────────────────── */}

        {forecasts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Children at Risk
            </p>
            {forecasts.slice(0, 4).map((f) => {
              const band = BAND_STYLES[f.risk_band] ?? BAND_STYLES.stable;
              const topFactor = (f.contributing_factors ?? [])[0];
              return (
                <div key={f.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{f.child_name}</span>
                      <span className="text-[10px] text-muted-foreground">Age {f.age}</span>
                      {TREND_ICON[f.trend]}
                    </div>
                    <Badge className={cn("text-[10px]", band.bg, band.text)}>
                      {f.risk_score}/100 {f.risk_band}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-muted-foreground flex-wrap">
                    {f.projected_days_to_critical != null && (
                      <span className="text-[10px] flex items-center gap-0.5 text-red-600 font-medium">
                        <CalendarClock className="h-3 w-3" />
                        {f.projected_days_to_critical === 0
                          ? "at critical now"
                          : `~${f.projected_days_to_critical}d to critical`}
                      </span>
                    )}
                    {f.trend === "escalating" && (
                      <span className="text-[10px]">+{f.velocity_per_week}/wk</span>
                    )}
                    {topFactor && (
                      <span className="text-[10px] truncate">Driver: {topFactor.factor}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Early-Warning Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Placement Stability Intelligence ────────────────────── */}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Placement Stability Intelligence
            </p>
            {insights.slice(0, 3).map((insight, i) => (
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
