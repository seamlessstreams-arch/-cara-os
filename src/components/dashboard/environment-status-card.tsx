"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — ENVIRONMENT STATUS CARD
// Dashboard card powered by the Premises Safety Intelligence Engine.
// CHR 2015 Reg 25 — "The premises used for the children's home are designed,
// furnished and maintained so as to be suitable for the purpose."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2, ChevronRight, Brain, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremisesSafetyIntelligence } from "@/hooks/use-premises-safety-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function EnvironmentStatusCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const d = data?.data;
  const overview = d?.overview;

  if (isLoading || !d || !overview) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-500" />
            Environment
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

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-500" />
            Environment & Premises
          </CardTitle>
          <Link href="/buildings" className="text-xs text-teal-600 hover:underline flex items-center gap-1">
            Premises <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2",
            overview.check_completion_rate >= 90 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              overview.check_completion_rate >= 90 ? "text-green-600" : "text-amber-600",
            )}>
              {overview.check_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2",
            overview.checks_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              overview.checks_overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {overview.checks_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2",
            overview.maintenance_urgent === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              overview.maintenance_urgent === 0 ? "text-green-600" : "text-red-600",
            )}>
              {overview.maintenance_urgent}
            </p>
            <p className="text-[10px] text-muted-foreground">Urgent</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2",
            overview.vehicle_issues === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              overview.vehicle_issues === 0 ? "text-green-600" : "text-amber-600",
            )}>
              {overview.vehicle_issues}
            </p>
            <p className="text-[10px] text-muted-foreground">Vehicle Issues</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {(d.alerts ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Environment Alerts
            </p>
            {(d.alerts ?? []).slice(0, 3).map((alert, i) => (
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

        {/* ── ARIA Intelligence ──────────────────────────────────────── */}

        {(d.insights ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Environment Intelligence
            </p>
            {(d.insights ?? []).slice(0, 2).map((insight, i) => (
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
