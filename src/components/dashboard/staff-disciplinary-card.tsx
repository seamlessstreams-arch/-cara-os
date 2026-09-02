"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DISCIPLINARY INTELLIGENCE CARD
// Dashboard card powered by the Staff Disciplinary Intelligence Engine.
// Reg 33 (fitness of staff), Reg 34 (employment), Reg 40 (notifications),
// SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Scale, ChevronRight, AlertTriangle, Brain,
  FileWarning, Clock, Shield, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { StaffDisciplinaryIntelligenceResult } from "@/lib/engines/staff-disciplinary-intelligence-engine";

// ── data hook (inlined from use-staff-disciplinary-intelligence) ────────────

interface StaffDisciplinaryIntelligenceResponse {
  data: StaffDisciplinaryIntelligenceResult;
}

function useStaffDisciplinaryIntelligence() {
  return useQuery({
    queryKey: ["staff-disciplinary-intelligence"],
    queryFn: () => api.get<StaffDisciplinaryIntelligenceResponse>("/staff-disciplinary-intelligence"),
    refetchInterval: 60_000,
  });
}

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

export function StaffDisciplinaryCard() {
  const { data, isLoading } = useStaffDisciplinaryIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Staff Disciplinary
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
            <Scale className="h-4 w-4 text-brand" />
            Staff Disciplinary
          </CardTitle>
          <Link href="/staff-disciplinary" className="text-xs text-brand hover:underline flex items-center gap-1">
            Cases <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.open_cases === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.open_cases === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.open_cases}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.concluded_cases}
            </p>
            <p className="text-[10px] text-muted-foreground">Concluded</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.avg_days_to_resolution}d
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Resolve</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.suspensions_active === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.suspensions_active === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.suspensions_active}
            </p>
            <p className="text-[10px] text-muted-foreground">Suspended</p>
          </div>
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <FileWarning className="h-3 w-3" />
              By Category
            </p>
            {intel.category_breakdown.map((c) => (
              <div key={c.category} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{c.category_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{c.count}</Badge>
                  {c.open_count > 0 && (
                    <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">{c.open_count} open</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Open cases ─────────────────────────────────────────────── */}

        {intel.open_cases.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Active Cases
            </p>
            {intel.open_cases.slice(0, 3).map((c) => (
              <div key={c.case_id} className="rounded border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[--cs-warning]">{c.staff_name}</span>
                  <Badge className={cn(
                    "text-[10px]",
                    c.lado_referral ? "bg-[--cs-risk-bg] text-[--cs-risk]" : "bg-[--cs-warning-bg] text-[--cs-warning]",
                  )}>
                    {c.category_label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-amber-700">
                  <span>{c.status}</span>
                  <span className="font-medium">{c.days_open}d open</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Compliance ──────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Shield className="h-3 w-3 text-blue-500" />
            Compliance
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className={cn("font-bold tabular-nums", (o.support_offered_rate ?? 0) >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {formatRate(o.support_offered_rate)}
              </p>
              <p className="text-[10px] text-muted-foreground">Support</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 tabular-nums">{o.lado_referrals}</p>
              <p className="text-[10px] text-muted-foreground">LADO</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 tabular-nums">{o.cases_last_90_days}</p>
              <p className="text-[10px] text-muted-foreground">Last 90d</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Disciplinary Alerts
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

        {/* ── Cara Disciplinary Intelligence ──────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Disciplinary Intelligence
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
