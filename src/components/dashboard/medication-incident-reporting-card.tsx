"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION INCIDENT REPORTING CARD
// Dashboard widget for medication refusals, missed doses, alerts, and
// controlled drug tracking.
// Powered by the Medication Intelligence Engine — live data (Reg 23/12).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, AlertTriangle, Brain,
  Loader2, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useMedicationIntelligence } from "@/hooks/use-medication-intelligence";

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

// ── Component ────────────────────────────────────────────────────────────────

export function MedicationIncidentReportingCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-rose-600" />
            Med Incidents
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
    <Card className="overflow-hidden border-rose-200">
      <CardHeader className="pb-3 bg-rose-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-rose-600" />
            <span className="text-rose-900">Med Incidents</span>
          </CardTitle>
          <Link href="/medication" className="text-xs text-rose-600 hover:underline flex items-center gap-1">
            Incidents <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.missed_rate === null ? "bg-gray-50" : o.missed_rate === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.missed_rate === null ? "text-muted-foreground" : o.missed_rate === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {formatRate(o.missed_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Missed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.refusal_rate === null ? "bg-gray-50" : o.refusal_rate === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.refusal_rate === null ? "text-muted-foreground" : o.refusal_rate === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.refusal_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Refused</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", intel.alerts.length === 0 ? "bg-green-50" : "bg-rose-50")}>
            <p className={cn("text-lg font-bold tabular-nums", intel.alerts.length === 0 ? "text-[--cs-success]" : "text-rose-600")}>
              {intel.alerts.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Alerts</p>
          </div>
          <div className="text-center rounded-lg bg-purple-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-purple-600">{o.controlled_drug_count}</p>
            <p className="text-[10px] text-muted-foreground">Controlled</p>
          </div>
        </div>

        {/* ── Alerts (up to 5) ────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Med Incident Alerts
            </p>
            {intel.alerts.slice(0, 5).map((alert, i) => (
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

        {/* ── Children with missed/refused badges ─────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Children with Incidents
            </p>
            {intel.child_profiles
              .filter((p) => p.missed_count_30d > 0 || p.refusal_count_30d > 0)
              .slice(0, 5)
              .map((profile) => (
                <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{profile.child_name}</span>
                    <div className="flex items-center gap-1.5">
                      {profile.missed_count_30d > 0 && (
                        <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                          {profile.missed_count_30d} missed
                        </Badge>
                      )}
                      {profile.refusal_count_30d > 0 && (
                        <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">
                          {profile.refusal_count_30d} refused
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* ── Cara Insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Med Safety Intelligence
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
