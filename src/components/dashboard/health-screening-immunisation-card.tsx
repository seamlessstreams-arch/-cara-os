"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — HEALTH SCREENING & IMMUNISATION CARD
// Dashboard card powered by the Health & Wellbeing Intelligence Engine.
// CHR 2015 Reg 23/33. SCCIF: Health & Wellbeing.
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Syringe, ChevronRight, AlertTriangle, Brain,
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

export function HealthScreeningImmunisationCard() {
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
            <Syringe className="h-4 w-4 text-brand" />
            Health Screening & Immunisation
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
  const immunPct = c.total_children > 0 ? Math.round((c.immunisation_up_to_date / c.total_children) * 100) : 100;
  const healthPct = c.total_children > 0 ? Math.round((c.health_assessment_current / c.total_children) * 100) : 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Syringe className="h-4 w-4 text-brand" />
            Health Screening & Immunisation
          </CardTitle>
          <Link href="/health" className="text-xs text-brand hover:underline flex items-center gap-1">
            Health <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", immunPct >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", immunPct >= 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{immunPct}%</p>
            <p className="text-[10px] text-muted-foreground">Immunisation</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", healthPct >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", healthPct >= 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{healthPct}%</p>
            <p className="text-[10px] text-muted-foreground">RHA Current</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", (c.overall_compliance_rate ?? 0) >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (c.overall_compliance_rate ?? 0) >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(c.overall_compliance_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Overall</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* ── Child screening status ──────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Screening Status
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{cp.child_name}</span>
                <div className="flex items-center gap-1">
                  {!cp.dental_up_to_date && <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">dental</Badge>}
                  {!cp.optician_up_to_date && <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">optical</Badge>}
                  {cp.dental_up_to_date && cp.optician_up_to_date && (
                    <Badge className="text-[9px] bg-[--cs-success-bg] text-[--cs-success]">up to date</Badge>
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
              Cara Screening Intelligence
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
