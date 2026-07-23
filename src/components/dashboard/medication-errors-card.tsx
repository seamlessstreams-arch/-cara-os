"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ERRORS INTELLIGENCE CARD
// Dashboard card for medication error tracking and investigation.
// CHR 2015 Reg 23, Reg 40. Duty of Candour.
// SCCIF: Helped & Protected — "Medication is managed safely."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, AlertTriangle, Brain,
  User, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useMedicationIntelligence } from "@/hooks/use-medication-intelligence";

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

export function MedicationErrorsCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Medication Errors
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

  // Calculate total missed/refusal counts from child profiles
  const totalRefusals = intel.child_profiles.reduce((sum, cp) => sum + cp.refusal_count_30d, 0);
  const totalMissed = intel.child_profiles.reduce((sum, cp) => sum + cp.missed_count_30d, 0);

  // Sort children by combined refusal + missed count (highest first)
  const childrenWithIssues = [...intel.child_profiles]
    .filter((cp) => cp.refusal_count_30d > 0 || cp.missed_count_30d > 0)
    .sort((a, b) => (b.refusal_count_30d + b.missed_count_30d) - (a.refusal_count_30d + a.missed_count_30d));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Medication Errors
          </CardTitle>
          <Link href="/medication" className="text-xs text-brand hover:underline flex items-center gap-1">
            Errors <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.missed_rate === null ? "bg-gray-50" : o.missed_rate === 0 ? "bg-green-50" : o.missed_rate <= 3 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.missed_rate === null ? "text-muted-foreground" : o.missed_rate === 0 ? "text-[--cs-success]" : o.missed_rate <= 3 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.missed_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Missed</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.refusal_rate === null ? "bg-gray-50" : o.refusal_rate === 0 ? "bg-green-50" : o.refusal_rate <= 5 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.refusal_rate === null ? "text-muted-foreground" : o.refusal_rate === 0 ? "text-[--cs-success]" : o.refusal_rate <= 5 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.refusal_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Refusal</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            totalMissed === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              totalMissed === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {totalMissed}
            </p>
            <p className="text-[10px] text-muted-foreground">Missed (30d)</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            totalRefusals === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              totalRefusals === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {totalRefusals}
            </p>
            <p className="text-[10px] text-muted-foreground">Refusals (30d)</p>
          </div>
        </div>

        {/* ── Children with refusals/missed ───────────────────────────── */}

        {childrenWithIssues.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Children with Refusals / Missed
            </p>
            <div className="space-y-1">
              {childrenWithIssues.slice(0, 6).map((cp) => (
                <div key={cp.child_id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <User className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium truncate">{cp.child_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    {cp.refusal_count_30d > 0 && (
                      <Badge variant="outline" className="text-[10px] text-red-700 bg-red-50 border-red-200">
                        {cp.refusal_count_30d} refused
                      </Badge>
                    )}
                    {cp.missed_count_30d > 0 && (
                      <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                        {cp.missed_count_30d} missed
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Error Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
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

        {/* ── Cara Medication Safety Intelligence ─────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Medication Safety Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
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
