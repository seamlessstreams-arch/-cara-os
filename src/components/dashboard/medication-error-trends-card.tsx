"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEDICATION ERROR TRENDS CARD
// Temporal + repeat-pattern early-warning for medication safety. Powered by the
// Medication Error Trend Engine — live data (Reg 23 medicines / Reg 13 learning).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, AlertTriangle, Brain, Loader2,
  TrendingUp, TrendingDown, Minus, Repeat, GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMedicationErrorTrends } from "@/hooks/use-medication-error-trends";

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

const GAP_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
};

const TREND_ICON: Record<string, React.ReactNode> = {
  rising: <TrendingUp className="h-3 w-3 text-red-500" />,
  falling: <TrendingDown className="h-3 w-3 text-green-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
};

const DIMENSION_LABEL: Record<string, string> = {
  medication: "Medication",
  child: "Child",
  error_type: "Error type",
  time_of_day: "Time",
};

export function MedicationErrorTrendsCard() {
  const { data, isLoading } = useMedicationErrorTrends();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Medication Error Trends
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
  const patterns = intel.repeat_patterns ?? [];
  const gaps = intel.learning_gaps ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Medication Error Trends
          </CardTitle>
          <Link href="/medication-error-trends" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_errors_90d}</p>
            <p className="text-[10px] text-muted-foreground">Errors (90d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.trend_direction === "rising" ? "bg-red-50" : o.trend_direction === "falling" ? "bg-green-50" : "bg-gray-50")}>
            <p className="text-lg font-bold tabular-nums flex items-center justify-center gap-0.5">
              {TREND_ICON[o.trend_direction]}
              <span className="text-xs capitalize">{o.trend_direction}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{intel.trend.recent_30d} vs {intel.trend.prior_30d}</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.repeat_pattern_count > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.repeat_pattern_count > 0 ? "text-amber-600" : "text-gray-500")}>{o.repeat_pattern_count}</p>
            <p className="text-[10px] text-muted-foreground">Repeats</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.harm_events > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.harm_events > 0 ? "text-red-600" : "text-green-600")}>{o.harm_events}</p>
            <p className="text-[10px] text-muted-foreground">Harm</p>
          </div>
        </div>

        {/* ── Repeat patterns ──────────────────────────────────────────── */}
        {patterns.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              Repeat Patterns
            </p>
            {patterns.slice(0, 4).map((p, i) => (
              <div key={i} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[9px] uppercase text-muted-foreground">{DIMENSION_LABEL[p.dimension] ?? p.dimension}</span>
                    <p className="font-medium truncate">{p.key}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {p.recurred_after_lesson && (
                      <Badge className="text-[9px] bg-red-50 text-red-700 border-red-200">recurred after lesson</Badge>
                    )}
                    <Badge className="text-[10px] bg-amber-100 text-amber-700">×{p.count}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Learning gaps ────────────────────────────────────────────── */}
        {gaps.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Learning-Loop Gaps
            </p>
            {gaps.slice(0, 3).map((g, i) => {
              const s = GAP_STYLES[g.severity] ?? GAP_STYLES.medium;
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge className={cn("text-[9px] shrink-0", s.bg, s.text)}>{g.severity}</Badge>
                  <span className="text-muted-foreground truncate">{g.detail}</span>
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
              Safety Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Medication Safety Intelligence ──────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Medication Safety Intelligence
            </p>
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
