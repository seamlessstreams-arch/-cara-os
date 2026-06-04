"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRANSPORT SAFETY INTELLIGENCE CARD
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
          <div className={cn("text-center rounded-lg p-2.5", intel.overview.compliance_rate >= 95 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", intel.overview.compliance_rate >= 95 ? "text-green-600" : "text-amber-600")}>{intel.overview.compliance_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", motExpiring === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", motExpiring === 0 ? "text-green-600" : "text-red-600")}>{motExpiring}</p>
            <p className="text-[10px] text-muted-foreground">MOT Due</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", insExpiring === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", insExpiring === 0 ? "text-green-600" : "text-amber-600")}>{insExpiring}</p>
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
                    <Badge className="text-[9px] bg-red-100 text-red-700">MOT {v.mot_days_until_expiry}d</Badge>
                  )}
                  {v.checks_overdue > 0 && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">{v.checks_overdue} overdue</Badge>
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

        {/* ── ARIA Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Transport Intelligence
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
