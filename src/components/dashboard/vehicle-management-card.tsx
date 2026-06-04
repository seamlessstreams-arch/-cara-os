"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VEHICLE MANAGEMENT INTELLIGENCE CARD
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

const STATUS_STYLES: Record<string, string> = {
  available:  "bg-green-100 text-green-700",
  in_use:     "bg-blue-100 text-blue-700",
  restricted: "bg-amber-100 text-amber-700",
  off_road:   "bg-red-100 text-red-700",
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
  const overdue = vehicles.reduce((s, v) => s + v.checks_overdue, 0);

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
            <p className={cn("text-lg font-bold tabular-nums", available === vehicles.length ? "text-green-600" : "text-amber-600")}>{available}</p>
            <p className="text-[10px] text-muted-foreground">Available</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overdue === 0 ? "text-green-600" : "text-red-600")}>{overdue}</p>
            <p className="text-[10px] text-muted-foreground">Checks Due</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", intel.overview.compliance_rate >= 95 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", intel.overview.compliance_rate >= 95 ? "text-green-600" : "text-amber-600")}>{intel.overview.compliance_rate}%</p>
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
                  {v.checks_overdue > 0 && <span className="text-red-600 font-medium">{v.checks_overdue} overdue</span>}
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

        {/* ── ARIA Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Vehicle Intelligence
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
