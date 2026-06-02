"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF BURNOUT INDICATOR CARD
// Live data from useWorkforceIntelligence() — bradford alerts, sickness, overtime.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, ChevronRight, Brain, Loader2, Flame, TrendingDown, TrendingUp, Minus } from "lucide-react";
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

export function StaffBurnoutIndicatorCard() {
  const { data, isLoading } = useWorkforceIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-purple-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const { sickness, staffing } = d;
  const trend = TREND_CONFIG[sickness.trend];
  const TrendIcon = trend.icon;
  const bradfordCount = (sickness.bradford_factor_alerts?.length ?? 0);

  return (
    <Card className="overflow-hidden border-purple-200">
      <CardHeader className="pb-3 bg-purple-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-purple-600" />
            <span className="text-purple-900">Burnout Indicators</span>
          </CardTitle>
          <Link href="/workforce" className="text-xs text-purple-600 hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ── Summary strip ──────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", bradfordCount > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", bradfordCount > 0 ? "text-red-600" : "text-green-600")}>{bradfordCount}</p>
            <p className="text-[10px] text-muted-foreground">Bradford</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", sickness.total_sick_days_this_month > 10 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sickness.total_sick_days_this_month > 10 ? "text-amber-600" : "text-green-600")}>{sickness.total_sick_days_this_month}</p>
            <p className="text-[10px] text-muted-foreground">Sick Days</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", staffing.overtime_hours_this_month > 20 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", staffing.overtime_hours_this_month > 20 ? "text-amber-600" : "text-green-600")}>{staffing.overtime_hours_this_month}h</p>
            <p className="text-[10px] text-muted-foreground">Overtime</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-purple-50">
            <p className={cn("text-lg font-bold tabular-nums flex items-center justify-center gap-1", trend.color)}>
              <TrendIcon className="h-3.5 w-3.5" />
            </p>
            <p className="text-[10px] text-muted-foreground">{trend.label}</p>
          </div>
        </div>

        {/* ── Bradford factor list ────────────────────────────────────── */}
        {(sickness.bradford_factor_alerts?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Flame className="h-3 w-3" />Bradford Factor Alerts
            </p>
            <div className="space-y-1">
              {sickness.bradford_factor_alerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Flame className="h-3 w-3 text-orange-500 shrink-0" />
                    <span className="font-medium">{alert.staff_name}</span>
                    <span className="text-muted-foreground truncate">{alert.instances} instances · {alert.days}d</span>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", alert.factor >= 200 ? "text-red-700 bg-red-50 border-red-200" : "text-amber-700 bg-amber-50 border-amber-200")}>
                    BF: {alert.factor}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

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
