"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & SAFETY INTELLIGENCE CARD
// Dashboard card powered by the Premises & Safety Intelligence Engine — live data.
// Reg 25 (premises and safety), Reg 24 (accommodation), Schedule 5,
// SCCIF: "Is the home safe?" Regulatory Reform (Fire Safety) Order 2005.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building, ChevronRight, AlertTriangle, Brain, Loader2,
  Flame, Wrench, Car, ShieldCheck, FileWarning, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremisesSafetyIntelligence } from "@/hooks/use-premises-safety-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

function formatCheckType(ct: string): string {
  return ct.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Component ────────────────────────────────────────────────────────────────

export function PremisesIntelligenceCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-4 w-4 text-brand" />
            Premises & Safety
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
            <Building className="h-4 w-4 text-brand" />
            Premises & Safety
          </CardTitle>
          <Link href="/premises" className="text-xs text-brand hover:underline flex items-center gap-1">
            Full View <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.check_completion_rate >= 80 ? "bg-green-50" : o.check_completion_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.check_completion_rate >= 80 ? "text-green-600" : o.check_completion_rate >= 50 ? "text-amber-600" : "text-red-600",
            )}>
              {o.check_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Checks Done</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.checks_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.checks_overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.checks_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.maintenance_urgent === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.maintenance_urgent === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.maintenance_urgent}
            </p>
            <p className="text-[10px] text-muted-foreground">Urgent Jobs</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.fire_safety_compliant ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.fire_safety_compliant ? "text-green-600" : "text-red-600",
            )}>
              {o.fire_safety_compliant ? (
                <Flame className="h-5 w-5 mx-auto" />
              ) : (
                <Flame className="h-5 w-5 mx-auto" />
              )}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Fire {o.fire_safety_compliant ? "OK" : "Gap"}
            </p>
          </div>
        </div>

        {/* ── Key metrics bar ──────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className={cn("font-bold tabular-nums", o.maintenance_open > 5 ? "text-amber-600" : "text-slate-700")}>
              {o.maintenance_open}
            </p>
            <p className="text-[10px] text-muted-foreground">Open Jobs</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.certifications_expired > 0 ? "text-red-600" : o.certifications_expiring_soon > 0 ? "text-amber-600" : "text-green-600")}>
              {o.certifications_expired > 0 ? `${o.certifications_expired} expired` : o.certifications_expiring_soon > 0 ? `${o.certifications_expiring_soon} expiring` : "Current"}
            </p>
            <p className="text-[10px] text-muted-foreground">Certs</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.vehicles_roadworthy === o.total_vehicles ? "text-green-600" : "text-amber-600")}>
              {o.vehicles_roadworthy}/{o.total_vehicles}
            </p>
            <p className="text-[10px] text-muted-foreground">Fleet Ready</p>
          </div>
        </div>

        {/* ── Check completion by type ─────────────────────────────────── */}

        {intel.check_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Check Completion
            </p>
            {intel.check_analysis.slice(0, 5).map((ca) => (
              <div key={ca.check_type} className="flex items-center gap-2 text-xs">
                <span className="w-28 text-right text-muted-foreground truncate">
                  {formatCheckType(ca.check_type)}
                </span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      ca.pass_rate >= 80 ? "bg-green-400" : ca.pass_rate >= 50 ? "bg-amber-400" : "bg-red-400",
                    )}
                    style={{ width: `${Math.max(4, ca.pass_rate)}%` }}
                  />
                </div>
                <span className="w-8 text-right font-medium tabular-nums">{ca.pass_rate}%</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Building profiles ────────────────────────────────────────── */}

        {intel.building_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Buildings ({intel.building_profiles.length})
            </p>
            {intel.building_profiles.map((bp) => (
              <div key={bp.building_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bp.building_name}</span>
                  <Badge className={cn(
                    "text-[9px]",
                    bp.status === "operational" ? "bg-green-100 text-green-700"
                      : bp.status === "restricted" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600",
                  )}>
                    {bp.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{bp.checks_completed}/{bp.checks_total} checks done</span>
                  {bp.gas_cert_days_until_expiry !== null && (
                    <span className="text-[10px]">Gas: {bp.gas_cert_days_until_expiry}d</span>
                  )}
                  {bp.electrical_cert_days_until_expiry !== null && (
                    <span className="text-[10px]">Elec: {bp.electrical_cert_days_until_expiry}d</span>
                  )}
                </div>
                {bp.risk_flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {bp.risk_flags.map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />{flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Vehicle fleet ───────────────────────────────────────────── */}

        {intel.vehicle_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Car className="h-3 w-3" />
              Fleet ({intel.vehicle_profiles.length})
            </p>
            {intel.vehicle_profiles.map((vp) => (
              <div key={vp.vehicle_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{vp.registration} — {vp.label}</span>
                  <div className="flex items-center gap-1.5">
                    {vp.latest_check_result && (
                      <Badge className={cn(
                        "text-[9px]",
                        vp.latest_check_result === "pass" ? "bg-green-100 text-green-700"
                          : vp.latest_check_result === "advisory" ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700",
                      )}>
                        {vp.latest_check_result}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  {vp.mot_days_until_expiry !== null && (
                    <span className="text-[10px]">MOT: {vp.mot_days_until_expiry}d</span>
                  )}
                  {vp.insurance_days_until_expiry !== null && (
                    <span className="text-[10px]">Ins: {vp.insurance_days_until_expiry}d</span>
                  )}
                  <span className="text-[10px]">{vp.mileage.toLocaleString()} mi</span>
                </div>
                {vp.risk_flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {vp.risk_flags.map((flag, i) => (
                      <Badge key={i} className="text-[9px] bg-red-100 text-red-700">
                        <FileWarning className="h-2.5 w-2.5 mr-0.5" />{flag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Maintenance by category ─────────────────────────────────── */}

        {intel.maintenance_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Maintenance
            </p>
            {intel.maintenance_analysis.map((ma) => (
              <div key={ma.category} className="flex items-center justify-between text-xs rounded border p-2">
                <span className="capitalize text-muted-foreground">{ma.category.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  {ma.urgent_count > 0 && (
                    <Badge className="text-[9px] bg-red-100 text-red-700">
                      {ma.urgent_count} urgent
                    </Badge>
                  )}
                  <span className="text-[10px] tabular-nums">
                    {ma.open} open / {ma.completed} done
                  </span>
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
              Premises Alerts
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

        {/* ── ARIA Premises Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Premises Intelligence
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
