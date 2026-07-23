"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BEDROOM AUDIT CARD
// Dashboard card powered by the Premises Safety Intelligence Engine.
// CHR 2015 Reg 36, Reg 6, Reg 10.
// SCCIF: Overall Experiences — "Children have personalised bedrooms."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BedDouble, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { usePremisesSafetyIntelligence } from "@/hooks/use-premises-safety-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high:     "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium:   "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low:      "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function BedroomAuditCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const d = data?.data;
  const overview = d?.overview;
  const alerts = d?.alerts ?? [];
  const insights = d?.insights ?? [];

  if (isLoading || !overview) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-brand" />
            Bedroom Audits
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
            <BedDouble className="h-4 w-4 text-brand" />
            Bedroom Audits
          </CardTitle>
          <Link href="/bedroom-personalisation" className="text-xs text-brand hover:underline flex items-center gap-1">
            Audits <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {overview.total_checks}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Checks</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            overview.checks_completed > 0 ? "bg-green-50" : "bg-slate-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              overview.checks_completed > 0 ? "text-[--cs-success]" : "text-slate-600",
            )}>
              {overview.checks_completed}
            </p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            overview.checks_overdue === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              overview.checks_overdue === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {overview.checks_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(overview.check_completion_rate, 90) ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(overview.check_completion_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {formatRate(overview.check_completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Rate</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Bedroom Alerts
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

        {/* ── Cara Intelligence ──────────────────────────────────────── */}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Bedroom Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
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
