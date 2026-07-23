"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MEDICATION INTELLIGENCE CARD
// Dashboard widget for medication adherence, refusals, witnessing compliance,
// PRN usage, stock management, and Cara medication intelligence.
// Powered by the Medication Intelligence Engine — live data (Reg 23/12).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pill, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Loader2, Users, Activity,
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

const COMPLIANCE_STYLES: Record<string, { bg: string; text: string }> = {
  excellent: { bg: "bg-green-100", text: "text-green-700" },
  good: { bg: "bg-blue-100", text: "text-blue-700" },
  concerns: { bg: "bg-amber-100", text: "text-amber-700" },
  critical: { bg: "bg-red-100", text: "text-red-700" },
  not_measured: { bg: "bg-gray-100", text: "text-gray-600" },
};

// ── Compliance bar sub-component ────────────────────────────────────────────

function ComplianceBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            value === null ? "bg-gray-300" : meets(value, 95) ? "bg-green-400" : meets(value, 80) ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ width: `${value ?? 0}%` }}
        />
      </div>
      <span className={cn(
        "w-8 text-right tabular-nums font-medium",
        value === null ? "text-muted-foreground" : meets(value, 95) ? "text-[--cs-success]" : meets(value, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]",
      )}>
        {formatRate(value)}
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function MedicationIntelligenceCard() {
  const { data, isLoading } = useMedicationIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pill className="h-4 w-4 text-brand" />
            Medication Intelligence
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
            <Pill className="h-4 w-4 text-brand" />
            Medication Intelligence
          </CardTitle>
          <Link href="/medication" className="text-xs text-brand hover:underline flex items-center gap-1">
            MAR <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.adherence_rate === null ? "bg-gray-50" : meets(o.adherence_rate, 95) ? "bg-green-50" : meets(o.adherence_rate, 80) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.adherence_rate === null ? "text-muted-foreground" : meets(o.adherence_rate, 95) ? "text-[--cs-success]" : meets(o.adherence_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {formatRate(o.adherence_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Adherence</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_administrations_30d}</p>
            <p className="text-[10px] text-muted-foreground">Doses (30d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.refusal_rate === null ? "bg-gray-50" : o.refusal_rate === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.refusal_rate === null ? "text-muted-foreground" : o.refusal_rate === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.refusal_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Refused</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.missed_rate === null ? "bg-gray-50" : o.missed_rate === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.missed_rate === null ? "text-muted-foreground" : o.missed_rate === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {formatRate(o.missed_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Missed</p>
          </div>
        </div>

        {/* ── Compliance bars ─────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <ComplianceBar label="Witnessing" value={o.witnessing_rate} />
          <ComplianceBar label="Stock checks" value={o.stock_check_compliance} />
          {o.controlled_drug_count > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="w-24 text-muted-foreground">Controlled</span>
              <Badge className="text-[10px] bg-[--cs-oversight-bg] text-[--cs-oversight]">
                {o.controlled_drug_count} active
              </Badge>
            </div>
          )}
        </div>

        {/* ── Per-child profiles ───────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              By Young Person
            </p>
            {intel.child_profiles.slice(0, 4).map((profile) => {
              const cStyle = COMPLIANCE_STYLES[profile.compliance_status];
              return (
                <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{profile.child_name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {profile.active_medications} med{profile.active_medications > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Badge className={cn("text-[10px]", cStyle.bg, cStyle.text)}>
                      {profile.compliance_status === "not_measured" ? "no records yet" : profile.compliance_status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                    <span className="text-[10px]">
                      {profile.adherence_rate === null ? "No doses recorded (30d)" : `${profile.adherence_rate}% adherence`}
                    </span>
                    {profile.refusal_count_30d > 0 && (
                      <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">
                        {profile.refusal_count_30d} refused
                      </Badge>
                    )}
                    {profile.missed_count_30d > 0 && (
                      <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        {profile.missed_count_30d} missed
                      </Badge>
                    )}
                    {profile.prn_uses_30d > 0 && (
                      <span className="text-[10px]">{profile.prn_uses_30d} PRN</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── PRN analysis ─────────────────────────────────────────────── */}

        {intel.prn_analysis.total_prn_30d > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium">PRN Usage (30d)</p>
                <p className="text-[10px] text-muted-foreground">
                  {intel.prn_analysis.by_medication.map((m) => `${m.name} (${m.count})`).join(", ")}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold tabular-nums">{intel.prn_analysis.total_prn_30d}</p>
              <p className="text-[10px] text-muted-foreground">{formatRate(intel.prn_analysis.effectiveness_rate)} documented</p>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Medication Alerts
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

        {/* ── Cara Medication Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Medication Intelligence
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
