"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH APPOINTMENTS INTELLIGENCE CARD
// Dashboard card powered by the Health & Wellbeing Intelligence Engine.
// Tracks medical, dental, optician, and CAMHS appointments. Reg 23/33.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar, ChevronRight, AlertTriangle, Brain,
  Users, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { HealthWellbeingResult } from "@/lib/engines/health-wellbeing-engine";

interface HealthWellbeingResponse { data: HealthWellbeingResult; }

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

export function HealthAppointmentsCard() {
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
            <Calendar className="h-4 w-4 text-brand" />
            Health Appointments
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

  const a = intel.appointments;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4 text-brand" />
            Health Appointments
          </CardTitle>
          <Link href="/health" className="text-xs text-brand hover:underline flex items-center gap-1">
            Health <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{a.attended}</p>
            <p className="text-[10px] text-muted-foreground">Attended</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", a.missed === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", a.missed === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{a.missed}</p>
            <p className="text-[10px] text-muted-foreground">Missed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", a.dna_rate === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", a.dna_rate === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{a.dna_rate}%</p>
            <p className="text-[10px] text-muted-foreground">DNA Rate</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{a.upcoming_7d}</p>
            <p className="text-[10px] text-muted-foreground">Next 7d</p>
          </div>
        </div>

        {/* ── Compliance overview ──────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold">Health Compliance</p>
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div>
              <p className={cn("font-bold tabular-nums", intel.compliance.health_assessment_current === intel.compliance.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {intel.compliance.health_assessment_current}/{intel.compliance.total_children}
              </p>
              <p className="text-[10px] text-muted-foreground">RHA</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", intel.compliance.dental_up_to_date === intel.compliance.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {intel.compliance.dental_up_to_date}/{intel.compliance.total_children}
              </p>
              <p className="text-[10px] text-muted-foreground">Dental</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", intel.compliance.optician_up_to_date === intel.compliance.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {intel.compliance.optician_up_to_date}/{intel.compliance.total_children}
              </p>
              <p className="text-[10px] text-muted-foreground">Optician</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", intel.compliance.immunisation_up_to_date === intel.compliance.total_children ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {intel.compliance.immunisation_up_to_date}/{intel.compliance.total_children}
              </p>
              <p className="text-[10px] text-muted-foreground">Immuns</p>
            </div>
          </div>
        </div>

        {/* ── Child gaps ──────────────────────────────────────────────── */}

        {intel.child_profiles.filter((cp) => !cp.dental_up_to_date || !cp.optician_up_to_date).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Outstanding
            </p>
            {intel.child_profiles.filter((cp) => !cp.dental_up_to_date || !cp.optician_up_to_date).slice(0, 4).map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{cp.child_name}</span>
                <div className="flex items-center gap-1">
                  {!cp.dental_up_to_date && <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">dental</Badge>}
                  {!cp.optician_up_to_date && <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">optician</Badge>}
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

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Health Intelligence
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
