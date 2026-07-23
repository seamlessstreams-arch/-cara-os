"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION SIDE EFFECTS CARD
// Dashboard widget for PRN analysis, refusals (side-effect proxy),
// effectiveness tracking, and medication safety alerts.
// Powered by the Medication Intelligence Engine — live data (Reg 23/12).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, AlertTriangle, Brain,
  Loader2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useMedicationIntelligence } from "@/hooks/use-medication-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function MedicationSideEffectsCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Side Effects
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
  const prn = intel.prn_analysis;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Side Effects
          </CardTitle>
          <Link href="/medication" className="text-xs text-brand hover:underline flex items-center gap-1">
            Reports <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.prn_administrations_30d}</p>
            <p className="text-[10px] text-muted-foreground">PRN (30d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", prn.effectiveness_rate === null ? "bg-gray-50" : meets(prn.effectiveness_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", prn.effectiveness_rate === null ? "text-muted-foreground" : meets(prn.effectiveness_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(prn.effectiveness_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Effect.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.refusal_rate === null ? "bg-gray-50" : o.refusal_rate === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.refusal_rate === null ? "text-muted-foreground" : o.refusal_rate === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.refusal_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Refused</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.adherence_rate === null ? "bg-gray-50" : meets(o.adherence_rate, 95) ? "bg-green-50" : meets(o.adherence_rate, 80) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.adherence_rate === null ? "text-muted-foreground" : meets(o.adherence_rate, 95) ? "text-[--cs-success]" : meets(o.adherence_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {formatRate(o.adherence_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Adherence</p>
          </div>
        </div>

        {/* ── PRN breakdown by medication ──────────────────────────────── */}

        {prn.by_medication.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Activity className="h-3 w-3" />
              PRN Breakdown
            </p>
            {(prn.by_medication ?? []).slice(0, 5).map((med, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                <span className="font-medium">{med.name}</span>
                <div className="flex items-center gap-2">
                  <Badge className="text-[10px] bg-[--cs-info-bg] text-[--cs-info]">
                    {med.count} uses
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Side Effect Alerts
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

        {/* ── Cara Insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Medication Intelligence
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
