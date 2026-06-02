"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF SICKNESS MANAGEMENT CARD
// Dashboard card powered by the Workforce Intelligence Engine.
// Tracks sickness patterns, Bradford factor, and trends.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Thermometer, ChevronRight, Brain, AlertTriangle,
  TrendingUp, TrendingDown, Minus, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkforceIntelligence } from "@/hooks/use-workforce-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const TREND_ICON = { increasing: TrendingUp, stable: Minus, decreasing: TrendingDown };
const TREND_COLOUR = { increasing: "text-red-600", stable: "text-blue-600", decreasing: "text-green-600" };

// ── Component ───────────────────────────────────────────────────────────────

export function StaffSicknessManagementCard() {
  const { data, isLoading } = useWorkforceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-brand" />
            Sickness Management
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
  const TrendIcon = TREND_ICON[s.trend] ?? Minus;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-brand" />
            Sickness Management
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", s.total_sick_days_this_month === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", s.total_sick_days_this_month === 0 ? "text-green-600" : "text-amber-600")}>{s.total_sick_days_this_month}</p>
            <p className="text-[10px] text-muted-foreground">Days/Month</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{s.staff_with_sickness}</p>
            <p className="text-[10px] text-muted-foreground">Staff Sick</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (s.bradford_factor_alerts?.length ?? 0) === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (s.bradford_factor_alerts?.length ?? 0) === 0 ? "text-green-600" : "text-red-600")}>{(s.bradford_factor_alerts?.length ?? 0)}</p>
            <p className="text-[10px] text-muted-foreground">Bradford</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <TrendIcon className={cn("h-5 w-5 mx-auto", TREND_COLOUR[s.trend] ?? "text-blue-600")} />
            <p className="text-[10px] text-muted-foreground capitalize">{s.trend}</p>
          </div>
        </div>

        {/* ── Month comparison ─────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold">Sickness Trend</p>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div>
              <p className="font-bold tabular-nums text-slate-700">{s.total_sick_days_this_month}</p>
              <p className="text-[10px] text-muted-foreground">This month</p>
            </div>
            <div>
              <p className="font-bold tabular-nums text-slate-700">{s.total_sick_days_last_month}</p>
              <p className="text-[10px] text-muted-foreground">Last month</p>
            </div>
          </div>
        </div>

        {/* ── Bradford factor alerts ──────────────────────────────────── */}

        {(s.bradford_factor_alerts?.length ?? 0) > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bradford Factor Alerts
            </p>
            {(s.bradford_factor_alerts ?? []).slice(0, 4).map((bf) => (
              <div key={bf.staff_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{bf.staff_name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{bf.instances} instances · {bf.days}d</span>
                  <Badge className={cn("text-[10px]", bf.factor >= 500 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                    BF: {bf.factor}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Sickness Intelligence
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
