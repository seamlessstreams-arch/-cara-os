"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH INTELLIGENCE CARD
// Dashboard widget for physical health compliance, appointments, child health
// profiles, CAMHS engagement, and Cara health intelligence.
// Powered by the Health & Wellbeing Intelligence Engine — live data (Reg 23/7).
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, AlertTriangle, Brain, Loader2,
  Users, Calendar, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { HealthWellbeingResult } from "@/lib/engines/health-wellbeing-engine";

interface HealthWellbeingResponse { data: HealthWellbeingResult; }

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

// ── Compliance bar sub-component ────────────────────────────────────────────

function ComplianceBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-24 truncate">{label}</span>
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden" />
        <span className="w-8 text-right tabular-nums font-medium text-gray-400">—</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 90 ? "bg-green-400" : value >= 70 ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn(
        "w-8 text-right tabular-nums font-medium",
        value >= 90 ? "text-[--cs-success]" : value >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]",
      )}>
        {value}%
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function HealthIntelligenceCard() {
  const { data, isLoading } = useQuery<HealthWellbeingResponse>({
    queryKey: ["health-wellbeing"],
    queryFn: () => api.get<HealthWellbeingResponse>("/health-wellbeing"),
    refetchInterval: 45_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-brand" />
            Health Intelligence
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

  const { compliance, appointments, child_profiles, camhs, alerts, insights } = intel;

  // Compute percentage rates from compliance counts
  const total = compliance.total_children || 1;
  const healthAssessRate = Math.round((compliance.health_assessment_current / total) * 100);
  const dentalRate = Math.round((compliance.dental_up_to_date / total) * 100);
  const opticalRate = Math.round((compliance.optician_up_to_date / total) * 100);
  const immunRate = Math.round((compliance.immunisation_up_to_date / total) * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-brand" />
          Health Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", healthAssessRate >= 90 ? "bg-green-50" : healthAssessRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", healthAssessRate >= 90 ? "text-[--cs-success]" : healthAssessRate >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {healthAssessRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Health Assess.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", dentalRate >= 90 ? "bg-green-50" : dentalRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", dentalRate >= 90 ? "text-[--cs-success]" : dentalRate >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {dentalRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Dental</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", opticalRate >= 90 ? "bg-green-50" : opticalRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", opticalRate >= 90 ? "text-[--cs-success]" : opticalRate >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {opticalRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Optical</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", immunRate >= 90 ? "bg-green-50" : immunRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", immunRate >= 90 ? "text-[--cs-success]" : immunRate >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {immunRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Immunisation</p>
          </div>
        </div>

        {/* ── Compliance bars ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <ComplianceBar label="Overall" value={compliance.overall_compliance_rate} />
        </div>

        {/* ── Appointments ─────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs font-medium">Appointments (90d)</p>
              <p className="text-[10px] text-muted-foreground">
                {appointments.attended} attended, {appointments.missed} missed, {appointments.cancelled} cancelled
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-sm font-bold tabular-nums",
              (appointments.dna_rate ?? 0) <= 5 ? "text-[--cs-success]" : (appointments.dna_rate ?? 0) <= 15 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(appointments.dna_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">DNA rate</p>
          </div>
        </div>

        {appointments.upcoming_7d > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{appointments.upcoming_7d} upcoming appointment{appointments.upcoming_7d > 1 ? "s" : ""} (next 7 days)</span>
          </div>
        )}

        {/* ── Child health profiles ───────────────────────────────────── */}

        {child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Health Profiles
            </p>
            {child_profiles.slice(0, 4).map((profile) => {
              const gaps = [
                !profile.health_assessment_current,
                !profile.dental_up_to_date,
                !profile.optician_up_to_date,
                !profile.immunisation_up_to_date,
              ].filter(Boolean).length;
              const gapMeta = [
                !profile.health_assessment_current && "RHA",
                !profile.dental_up_to_date && "Dental",
                !profile.optician_up_to_date && "Optical",
                !profile.immunisation_up_to_date && "Immun.",
              ].filter(Boolean).join(" · ");
              return (
                <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{profile.child_name}</span>
                    {gaps === 0 ? (
                      <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />All current
                      </Badge>
                    ) : (
                      <Badge className={cn("text-[10px]", gaps >= 3 ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-warning-bg] text-[--cs-warning]")}>
                        {gaps} gap{gaps > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  {(gapMeta || profile.camhs_status || profile.appointments_missed_90d > 0) && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {gapMeta}
                      {gapMeta && profile.camhs_status ? " · " : ""}
                      {profile.camhs_status ? `CAMHS: ${profile.camhs_status.replace(/_/g, " ")}` : ""}
                      {profile.appointments_missed_90d > 0 ? ` · ${profile.appointments_missed_90d} missed appt${profile.appointments_missed_90d > 1 ? "s" : ""}` : ""}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── CAMHS summary ───────────────────────────────────────────── */}

        {camhs.active_referrals > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3 text-xs">
            <div>
              <p className="font-semibold text-muted-foreground">CAMHS</p>
              <p className="text-muted-foreground">
                {camhs.active_referrals} referral{camhs.active_referrals > 1 ? "s" : ""} · {camhs.total_sessions_held} sessions
                {camhs.waiting_list > 0 ? ` · ${camhs.waiting_list} waiting (avg ${camhs.avg_waiting_weeks}wk)` : ""}
                {camhs.disengaged_count > 0 ? ` · ${camhs.disengaged_count} disengaged` : ""}
              </p>
            </div>
            {camhs.disengaged_count > 0 ? (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                {camhs.disengaged_count} disengaged
              </Badge>
            ) : camhs.waiting_list > 0 ? (
              <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
                {camhs.waiting_list} waiting
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">
                Active
              </Badge>
            )}
          </div>
        )}

        {/* ── All clear ───────────────────────────────────────────────── */}

        {alerts.length === 0 && insights.every((i) => i.severity === "positive") && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">
              All health assessments current. Compliance on track.
            </span>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Health Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                <span className="font-medium">{alert.child_name}:</span> {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara Health Intelligence ─────────────────────────────────── */}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Health Intelligence
            </p>
            {insights.slice(0, 3).map((insight, i) => (
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
