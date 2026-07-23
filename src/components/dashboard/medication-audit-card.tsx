"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION AUDIT INTELLIGENCE CARD
// Dashboard card for controlled drug counts, storage audits, fridge checks.
// CHR 2015 Reg 23, Reg 12, Reg 40.
// SCCIF: Safety — "Medication is stored and managed safely."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  Loader2, User,
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

const COMPLIANCE_BADGES: Record<string, { label: string; color: string }> = {
  excellent: { label: "Excellent", color: "text-green-700 bg-green-50 border-green-200" },
  good:      { label: "Good", color: "text-blue-700 bg-blue-50 border-blue-200" },
  concerns:  { label: "Concerns", color: "text-amber-700 bg-amber-50 border-amber-200" },
  critical:  { label: "Critical", color: "text-red-700 bg-red-50 border-red-200" },
  not_measured: { label: "No records", color: "text-gray-600 bg-gray-50 border-gray-200" },
};

// ── Component ───────────────────────────────────────────────────────────────

export function MedicationAuditCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Medication Audit
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
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Medication Audit
          </CardTitle>
          <Link href="/medication" className="text-xs text-brand hover:underline flex items-center gap-1">
            Audits <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.stock_check_compliance === null ? "bg-gray-50" : meets(o.stock_check_compliance, 90) ? "bg-green-50" : meets(o.stock_check_compliance, 75) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.stock_check_compliance === null ? "text-muted-foreground" : meets(o.stock_check_compliance, 90) ? "text-[--cs-success]" : meets(o.stock_check_compliance, 75) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.stock_check_compliance)}
            </p>
            <p className="text-[10px] text-muted-foreground">Stock Check</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.witnessing_rate === null ? "bg-gray-50" : meets(o.witnessing_rate, 95) ? "bg-green-50" : meets(o.witnessing_rate, 80) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.witnessing_rate === null ? "text-muted-foreground" : meets(o.witnessing_rate, 95) ? "text-[--cs-success]" : meets(o.witnessing_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.witnessing_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Witnessing</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">
              {o.controlled_drug_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Controlled</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_active_medications}
            </p>
            <p className="text-[10px] text-muted-foreground">Active Meds</p>
          </div>
        </div>

        {/* ── Child compliance overview ───────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <User className="h-3 w-3" />
              Child Compliance
            </p>
            <div className="space-y-1">
              {intel.child_profiles.slice(0, 6).map((cp) => {
                const badge = COMPLIANCE_BADGES[cp.compliance_status] ?? COMPLIANCE_BADGES.not_measured;
                return (
                  <div key={cp.child_id} className="flex items-center justify-between rounded border p-2 text-xs">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <User className="h-3 w-3 text-blue-500 shrink-0" />
                      <span className="font-medium truncate">{cp.child_name}</span>
                      <span className="text-muted-foreground">{cp.active_medications} meds · {formatRate(cp.adherence_rate)}</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", badge.color)}>
                      {badge.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Medication Audit Alerts
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

        {/* ── Cara Medication Audit Intelligence ──────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Medication Audit Intelligence
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
