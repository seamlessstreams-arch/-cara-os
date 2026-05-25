"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HEALTH INTELLIGENCE CARD
// Dashboard widget for physical health compliance, appointments, child health
// profiles, CAMHS engagement, and ARIA health intelligence.
// Powered by the Health & Wellbeing Intelligence Engine — live data (Reg 23/7).
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, AlertTriangle, Brain, Loader2,
  Users, Calendar, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHealthWellbeing } from "@/hooks/use-health-wellbeing";

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

// ── Compliance bar sub-component ────────────────────────────────────────────

function ComplianceBar({ label, value }: { label: string; value: number }) {
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
        value >= 90 ? "text-green-600" : value >= 70 ? "text-amber-600" : "text-red-600",
      )}>
        {value}%
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function HealthIntelligenceCard() {
  const { data, isLoading } = useHealthWellbeing();
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
            <p className={cn("text-lg font-bold tabular-nums", healthAssessRate >= 90 ? "text-green-600" : healthAssessRate >= 70 ? "text-amber-600" : "text-red-600")}>
              {healthAssessRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Health Assess.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", dentalRate >= 90 ? "bg-green-50" : dentalRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", dentalRate >= 90 ? "text-green-600" : dentalRate >= 70 ? "text-amber-600" : "text-red-600")}>
              {dentalRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Dental</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", opticalRate >= 90 ? "bg-green-50" : opticalRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", opticalRate >= 90 ? "text-green-600" : opticalRate >= 70 ? "text-amber-600" : "text-red-600")}>
              {opticalRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Optical</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", immunRate >= 90 ? "bg-green-50" : immunRate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", immunRate >= 90 ? "text-green-600" : immunRate >= 70 ? "text-amber-600" : "text-red-600")}>
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
              appointments.dna_rate <= 5 ? "text-green-600" : appointments.dna_rate <= 15 ? "text-amber-600" : "text-red-600",
            )}>
              {appointments.dna_rate}%
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
              const allCurrent = profile.health_assessment_current && profile.dental_up_to_date &&
                profile.optician_up_to_date && profile.immunisation_up_to_date;
              return (
                <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{profile.child_name}</span>
                    {allCurrent ? (
                      <Badge className="text-[10px] bg-green-100 text-green-700">All current</Badge>
                    ) : (
                      <Badge className="text-[10px] bg-amber-100 text-amber-700">Gaps</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {!profile.health_assessment_current && (
                      <Badge className="text-[9px] bg-red-100 text-red-700">RHA overdue</Badge>
                    )}
                    {!profile.dental_up_to_date && (
                      <Badge className="text-[9px] bg-amber-100 text-amber-700">Dental</Badge>
                    )}
                    {!profile.optician_up_to_date && (
                      <Badge className="text-[9px] bg-amber-100 text-amber-700">Optical</Badge>
                    )}
                    {!profile.immunisation_up_to_date && (
                      <Badge className="text-[9px] bg-red-100 text-red-700">Immun.</Badge>
                    )}
                    {profile.camhs_status && (
                      <Badge className="text-[9px] bg-purple-100 text-purple-700">
                        CAMHS: {profile.camhs_status.replace(/_/g, " ")}
                      </Badge>
                    )}
                    {profile.appointments_missed_90d > 0 && (
                      <span className="text-[10px] text-muted-foreground">
                        {profile.appointments_missed_90d} missed appt{profile.appointments_missed_90d > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CAMHS summary ───────────────────────────────────────────── */}

        {camhs.active_referrals > 0 && (
          <div className="rounded-lg border p-3 text-xs space-y-1">
            <p className="font-semibold text-muted-foreground">CAMHS Summary</p>
            <div className="flex items-center gap-3 flex-wrap">
              <span>{camhs.active_referrals} active referral{camhs.active_referrals > 1 ? "s" : ""}</span>
              {camhs.waiting_list > 0 && (
                <Badge className="text-[9px] bg-amber-100 text-amber-700">
                  {camhs.waiting_list} waiting (avg {camhs.avg_waiting_weeks}wk)
                </Badge>
              )}
              {camhs.disengaged_count > 0 && (
                <Badge className="text-[9px] bg-red-100 text-red-700">
                  {camhs.disengaged_count} disengaged
                </Badge>
              )}
              <span className="text-muted-foreground">{camhs.total_sessions_held} sessions held</span>
            </div>
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

        {/* ── ARIA Health Intelligence ─────────────────────────────────── */}

        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Health Intelligence
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
