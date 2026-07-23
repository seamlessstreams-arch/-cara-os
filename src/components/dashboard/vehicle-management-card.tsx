"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — VEHICLE MANAGEMENT INTELLIGENCE CARD
// Dashboard card powered by the Premises & Safety Intelligence Engine.
// Tracks vehicle checks, MOT, insurance, and fleet status.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Car, ChevronRight, AlertTriangle, Brain,
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

const STATUS_STYLES: Record<string, string> = {
  available:  "bg-[--cs-success-bg] text-[--cs-success]",
  in_use:     "bg-[--cs-info-bg] text-[--cs-info]",
  restricted: "bg-[--cs-warning-bg] text-[--cs-warning]",
  off_road:   "bg-[--cs-risk-bg] text-[--cs-risk]",
  disposed:   "bg-gray-100 text-gray-700",
};

// ── Component ───────────────────────────────────────────────────────────────

export function VehicleManagementCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4 text-brand" />
            Vehicle Management
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
  const available = vehicles.filter((v) => v.status === "available" || v.status === "in_use").length;
  const flagged = vehicles.reduce((s, v) => s + v.risk_flags.length, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Car className="h-4 w-4 text-brand" />
            Vehicle Management
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
            <p className="text-[10px] text-muted-foreground">Fleet</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", available === vehicles.length ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", available === vehicles.length ? "text-[--cs-success]" : "text-[--cs-warning]")}>{available}</p>
            <p className="text-[10px] text-muted-foreground">Available</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", flagged === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", flagged === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{flagged}</p>
            <p className="text-[10px] text-muted-foreground">Flags</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(intel.overview.check_completion_rate, 95) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(intel.overview.check_completion_rate, 95) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(intel.overview.check_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
        </div>

        {/* ── Vehicle profiles ─────────────────────────────────────────── */}

        {vehicles.length > 0 && (
          <div className="space-y-1.5">
            {vehicles.map((v) => (
              <div key={v.vehicle_id} className="rounded border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{v.registration}</span>
                    <span className="text-[10px] text-muted-foreground">{v.label}</span>
                  </div>
                  <Badge className={cn("text-[10px]", STATUS_STYLES[v.status] ?? STATUS_STYLES.restricted)}>
                    {v.status.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                  {v.mot_days_until_expiry !== null && (
                    <span className={v.mot_days_until_expiry <= 30 ? "text-red-600 font-medium" : ""}>
                      MOT: {v.mot_days_until_expiry}d
                    </span>
                  )}
                  {v.insurance_days_until_expiry !== null && (
                    <span className={v.insurance_days_until_expiry <= 30 ? "text-red-600 font-medium" : ""}>
                      Ins: {v.insurance_days_until_expiry}d
                    </span>
                  )}
                  {v.risk_flags.length > 0 && <span className="text-red-600 font-medium">{v.risk_flags.length} flag{v.risk_flags.length === 1 ? "" : "s"}</span>}
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
              Vehicle Alerts
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

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Vehicle Intelligence
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
