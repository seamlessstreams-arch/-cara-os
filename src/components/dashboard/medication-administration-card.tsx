"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION ADMINISTRATION INTELLIGENCE CARD
// Dashboard card for medication rounds, MAR compliance, and safety.
// CHR 2015 Reg 23, Reg 6.
// SCCIF: Helped & Protected — "Children's medication is managed
// safely and effectively."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Syringe, ChevronRight, AlertTriangle, Brain,
  Pill, Loader2,
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

export function MedicationAdministrationCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Syringe className="h-4 w-4 text-brand" />
            Medication Administration
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Syringe className="h-4 w-4 text-brand" />
            Medication Administration
          </CardTitle>
          <Link href="/medication" className="text-xs text-brand hover:underline flex items-center gap-1">
            MAR <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.adherence_rate === null ? "bg-gray-50" : meets(o.adherence_rate, 90) ? "bg-green-50" : meets(o.adherence_rate, 75) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.adherence_rate === null ? "text-muted-foreground" : meets(o.adherence_rate, 90) ? "text-[--cs-success]" : meets(o.adherence_rate, 75) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.adherence_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Adherence</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_administrations_30d}
            </p>
            <p className="text-[10px] text-muted-foreground">Doses (30d)</p>
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
        </div>

        {/* ── Medication details ──────────────────────────────────────── */}

        {intel.medication_details.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Pill className="h-3 w-3" />
              Medication Details
            </p>
            <div className="space-y-1">
              {intel.medication_details.slice(0, 6).map((med) => (
                <div key={med.medication_id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Pill className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium truncate">{med.medication_name}</span>
                    <span className="text-muted-foreground truncate">{med.child_name} · {med.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    <Badge variant="outline" className={cn(
                      "text-[10px] shrink-0",
                      med.adherence_rate === null ? "text-gray-600 bg-gray-50 border-gray-200" :
                      meets(med.adherence_rate, 90) ? "text-green-700 bg-green-50 border-green-200" :
                      meets(med.adherence_rate, 75) ? "text-amber-700 bg-amber-50 border-amber-200" :
                      "text-red-700 bg-red-50 border-red-200",
                    )}>
                      {formatRate(med.adherence_rate)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {med.administrations_30d} dose{med.administrations_30d !== 1 ? "s" : ""}
                    </span>
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
              Medication Alerts
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

        {/* ── Cara Medication Intelligence ────────────────────────────── */}

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
