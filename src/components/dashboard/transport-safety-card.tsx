"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — TRANSPORT SAFETY INTELLIGENCE CARD
// Dashboard card powered by the Premises & Safety Intelligence Engine.
// Vehicle checks, compliance, and fleet status.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bus, ChevronRight, AlertTriangle, Brain,
  Loader2,
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

export function TransportSafetyCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bus className="h-4 w-4 text-brand" />
            Transport Safety
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

  const vehicles = intel.vehicle_profiles;
  const motExpiring = vehicles.filter((v) => v.mot_days_until_expiry !== null && v.mot_days_until_expiry <= 30).length;
  const insExpiring = vehicles.filter((v) => v.insurance_days_until_expiry !== null && v.insurance_days_until_expiry <= 30).length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bus className="h-4 w-4 text-brand" />
            Transport Safety
          </CardTitle>
          <Link href="/buildings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Premises <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{vehicles.length}</p>
            <p className="text-[10px] text-muted-foreground">Vehicles</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(intel.overview.check_completion_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(intel.overview.check_completion_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(intel.overview.check_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", motExpiring === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", motExpiring === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{motExpiring}</p>
            <p className="text-[10px] text-muted-foreground">MOT Due</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", insExpiring === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", insExpiring === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{insExpiring}</p>
            <p className="text-[10px] text-muted-foreground">Ins Due</p>
          </div>
        </div>

        {/* ── Vehicle list ─────────────────────────────────────────────── */}

        {vehicles.length > 0 && (
          <div className="space-y-1.5">
            {vehicles.map((v) => (
              <div key={v.vehicle_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{v.registration}</span>
                  <span className="text-[10px] text-muted-foreground">{v.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {v.mot_days_until_expiry !== null && v.mot_days_until_expiry <= 30 && (
                    <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">MOT {v.mot_days_until_expiry}d</Badge>
                  )}
                  {v.risk_flags.length > 0 && (
                    <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">{v.risk_flags.length} flag{v.risk_flags.length === 1 ? "" : "s"}</Badge>
                  )}
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
              Transport Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
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

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Transport Intelligence
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
