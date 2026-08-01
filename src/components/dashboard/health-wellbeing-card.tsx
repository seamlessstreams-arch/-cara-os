"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH & WELLBEING INTELLIGENCE CARD
// Dashboard widget for health compliance, appointment tracking, wellbeing
// trends, SDQ analysis, CAMHS engagement, and Cara health intelligence.
// Powered by the Health & Wellbeing Engine — live data (Reg 23).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartPulse, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, Stethoscope, SmilePlus, TrendingUp, TrendingDown,
  Minus, Loader2, Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { HealthWellbeingResult } from "@/lib/engines/health-wellbeing-engine";

interface HealthWellbeingResponse { data: HealthWellbeingResult; }

// ── Styling maps ────────────────────────────────────────────────────────────

const SDQ_COLOURS: Record<string, string> = {
  normal: "bg-[--cs-success-bg] text-[--cs-success]",
  borderline: "bg-[--cs-warning-bg] text-[--cs-warning]",
  abnormal: "bg-[--cs-risk-bg] text-[--cs-risk]",
};

const TREND_ICON = {
  improving: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
  unknown: Minus,
};

const TREND_COLOUR = {
  improving: "text-green-500",
  stable: "text-gray-400",
  declining: "text-red-500",
  unknown: "text-gray-300",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function HealthWellbeingCard() {
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
            <HeartPulse className="h-4 w-4 text-brand" />
            Health & Wellbeing
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

  const c = intel.compliance;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-brand" />
            Health & Wellbeing
          </CardTitle>
          <Link href="/health" className="text-xs text-brand hover:underline flex items-center gap-1">
            Health <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2", c.immunisation_up_to_date === c.total_children ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.immunisation_up_to_date === c.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {c.immunisation_up_to_date}/{c.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Immunised</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", c.dental_up_to_date === c.total_children ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.dental_up_to_date === c.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {c.dental_up_to_date}/{c.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Dental</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", c.health_assessment_current === c.total_children ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.health_assessment_current === c.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {c.health_assessment_current}/{c.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Health Assess.</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (intel.appointments.dna_rate ?? 0) <= 10 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (intel.appointments.dna_rate ?? 0) <= 10 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {intel.appointments.dna_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DNA Rate</p>
          </div>
        </div>

        {/* ── Appointments overview ────────────────────────────────────── */}

        {intel.appointments.upcoming_7d > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-brand" />
              <div>
                <p className="text-xs font-medium">Upcoming Appointments</p>
                <p className="text-[10px] text-muted-foreground">
                  {intel.appointments.attended} attended, {intel.appointments.missed} missed (90d)
                </p>
              </div>
            </div>
            <Badge className="text-[10px] bg-[--cs-info-bg] text-[--cs-info]">
              {intel.appointments.upcoming_7d} this week
            </Badge>
          </div>
        )}

        {/* ── Children's health profiles ──────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Stethoscope className="h-3 w-3" />
              Children&apos;s Health
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => {
              const TIcon = TREND_ICON[child.wellbeing_trend];
              // ONE dominant badge: SDQ abnormal > CAMHS disengaged > SDQ borderline > CAMHS active > none
              const dominantBadge = child.sdq_band === "abnormal" ? (
                <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">SDQ abnormal</Badge>
              ) : (child.camhs_status && child.camhs_status !== "discharged") ? (
                <Badge className={cn("text-[10px]",
                  child.camhs_status === "active_engagement" ? "bg-[--cs-oversight-bg] text-[--cs-oversight]" : "bg-[--cs-warning-bg] text-[--cs-warning]"
                )}>
                  CAMHS {child.camhs_status === "active_engagement" ? "active" : child.camhs_status === "on_waiting_list" ? "waiting" : child.camhs_status.replace(/_/g, " ")}
                </Badge>
              ) : child.sdq_band && child.sdq_band !== "normal" ? (
                <Badge className={cn("text-[10px]", SDQ_COLOURS[child.sdq_band])}>
                  SDQ {child.sdq_band}
                </Badge>
              ) : null;
              return (
                <div key={child.child_id} className="rounded-lg border p-3 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{child.child_name}</span>
                      {dominantBadge}
                    </div>
                    {child.wellbeing_score !== null && (
                      <div className="flex items-center gap-1.5">
                        <SmilePlus className={cn("h-3 w-3",
                          child.wellbeing_score >= 7 ? "text-green-500" : child.wellbeing_score >= 5 ? "text-amber-500" : "text-red-500"
                        )} />
                        <span className="tabular-nums font-medium">{child.wellbeing_score}/10</span>
                        <TIcon className={cn("h-3 w-3", TREND_COLOUR[child.wellbeing_trend])} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className={child.dental_up_to_date ? "text-[--cs-success]" : "text-[--cs-warning]"}>
                      {child.dental_up_to_date ? "✓" : "✗"} Dental
                    </span>
                    <span className={child.optician_up_to_date ? "text-[--cs-success]" : "text-[--cs-warning]"}>
                      {child.optician_up_to_date ? "✓" : "✗"} Optician
                    </span>
                    <span className={child.immunisation_up_to_date ? "text-[--cs-success]" : "text-[--cs-warning]"}>
                      {child.immunisation_up_to_date ? "✓" : "✗"} Immunised
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── CAMHS Summary ──────────────────────────────────────────── */}

        {(intel.camhs.active_referrals > 0 || intel.camhs.waiting_list > 0) && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs font-medium">CAMHS Engagement</p>
                <p className="text-[10px] text-muted-foreground">
                  {intel.camhs.active_referrals} active · {intel.camhs.waiting_list} waiting · {intel.camhs.total_sessions_held} sessions
                  {intel.camhs.disengaged_count > 0 ? ` · ${intel.camhs.disengaged_count} disengaged` : ""}
                </p>
              </div>
            </div>
            {intel.camhs.disengaged_count > 0 ? (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                {intel.camhs.disengaged_count} disengaged
              </Badge>
            ) : intel.camhs.waiting_list > 0 ? (
              <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
                {intel.camhs.waiting_list} waiting
              </Badge>
            ) : (
              <Badge className="text-[10px] bg-[--cs-oversight-bg] text-[--cs-oversight]">
                {intel.camhs.active_referrals} active
              </Badge>
            )}
          </div>
        )}

        {/* ── Health Alerts ──────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Health Alerts
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

        {/* ── All clear ───────────────────────────────────────────────── */}

        {intel.alerts.length === 0 && intel.insights.every((i) => i.severity === "positive") && (
          <div className="flex items-center gap-2 rounded-lg bg-[--cs-success-bg] border border-[--cs-success-soft] p-2.5">
            <CheckCircle2 className="h-4 w-4 text-[--cs-success]" />
            <span className="text-xs text-[--cs-success]">
              Health compliance on track.
            </span>
          </div>
        )}

        {/* ── Cara Health Intelligence ────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Health Intelligence
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
