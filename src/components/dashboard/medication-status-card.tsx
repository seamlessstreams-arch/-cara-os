"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION STATUS CARD
// Dashboard widget showing medication administration status.
// Powered by the Medication Intelligence Engine — live data (Reg 23/12).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, CheckCircle2, AlertTriangle,
  Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useMedicationIntelligence } from "@/hooks/use-medication-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const COMPLIANCE_STYLES: Record<string, string> = {
  excellent: "bg-[--cs-success-bg] text-[--cs-success]",
  good:      "bg-[--cs-info-bg] text-[--cs-info]",
  concerns:  "bg-[--cs-warning-bg] text-[--cs-warning]",
  critical:  "bg-[--cs-risk-bg] text-[--cs-risk]",
  not_measured: "bg-gray-100 text-gray-600",
};

// ── Component ───────────────────────────────────────────────────────────────

export function MedicationStatusCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Medication Status
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
  const hasConcern = meets(o.missed_rate, 1) || meets(o.refusal_rate, 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className={cn("h-4 w-4", hasConcern ? "text-red-500" : "text-brand")} />
            Medication Status
          </CardTitle>
          <Link href="/medication" className="text-xs text-brand hover:underline flex items-center gap-1">
            MAR <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.adherence_rate === null ? "bg-gray-50" : meets(o.adherence_rate, 95) ? "bg-green-50" : meets(o.adherence_rate, 80) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.adherence_rate === null ? "text-muted-foreground" : meets(o.adherence_rate, 95) ? "text-[--cs-success]" : meets(o.adherence_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{formatRate(o.adherence_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Given</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.missed_rate === null ? "bg-gray-50" : o.missed_rate === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.missed_rate === null ? "text-muted-foreground" : o.missed_rate === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{formatRate(o.missed_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Missed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.refusal_rate === null ? "bg-gray-50" : o.refusal_rate === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.refusal_rate === null ? "text-muted-foreground" : o.refusal_rate === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(o.refusal_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Refused</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_administrations_30d}</p>
            <p className="text-[10px] text-muted-foreground">Doses/30d</p>
          </div>
        </div>

        {/* ── Child compliance overview ────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  <span className="text-[10px] text-muted-foreground">{cp.active_medications} med{cp.active_medications !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {cp.missed_count_30d > 0 && (
                    <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">{cp.missed_count_30d} missed</Badge>
                  )}
                  {cp.refusal_count_30d > 0 && (
                    <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">{cp.refusal_count_30d} refused</Badge>
                  )}
                  <Badge className={cn("text-[10px]", COMPLIANCE_STYLES[cp.compliance_status] ?? COMPLIANCE_STYLES.not_measured)}>
                    {formatRate(cp.adherence_rate)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── All clear ───────────────────────────────────────────────── */}

        {!hasConcern && meets(o.adherence_rate, 95) && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs text-green-700">All medications administered on schedule. Full adherence.</span>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {hasConcern && intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Medication Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high" ? "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]" : "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Medication Status
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
