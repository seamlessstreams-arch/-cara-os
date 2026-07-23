"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BUILDING SECURITY INTELLIGENCE CARD
// Dashboard card powered by the Premises Safety Intelligence Engine.
// CHR 2015 Reg 36, Reg 25, Reg 12.
// SCCIF: Helped & Protected — "The home is secure."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck, ChevronRight, AlertTriangle, Brain,
  Building2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { usePremisesSafetyIntelligence } from "@/hooks/use-premises-safety-intelligence";

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

const STATUS_STYLES: Record<string, string> = {
  operational: "text-green-700 bg-green-50 border-green-200",
  restricted:  "text-amber-700 bg-amber-50 border-amber-200",
  closed:      "text-red-700 bg-red-50 border-red-200",
};

// ── Component ───────────────────────────────────────────────────────────────

export function BuildingSecurityCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Building Security
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
            <ShieldCheck className="h-4 w-4 text-brand" />
            Building Security
          </CardTitle>
          <Link href="/buildings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Premises <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.check_completion_rate, 90) ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.check_completion_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {formatRate(o.check_completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.checks_overdue === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.checks_overdue === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.checks_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.operational_buildings}
            </p>
            <p className="text-[10px] text-muted-foreground">Operational</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.maintenance_urgent === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.maintenance_urgent === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.maintenance_urgent}
            </p>
            <p className="text-[10px] text-muted-foreground">Urgent</p>
          </div>
        </div>

        {/* ── Building profiles ───────────────────────────────────────── */}

        {intel.building_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Building Profiles
            </p>
            {intel.building_profiles.map((b) => (
              <div key={b.building_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{b.building_name}</span>
                  <span className="text-muted-foreground">
                    {b.checks_total > 0 ? Math.round((b.checks_completed / b.checks_total) * 100) : 100}%
                  </span>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", STATUS_STYLES[b.status] ?? STATUS_STYLES.operational)}>
                  {b.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Check analysis ─────────────────────────────────────────── */}

        {intel.check_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Check Analysis
            </p>
            {intel.check_analysis.map((c) => (
              <div key={c.check_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{c.check_type}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{c.completed}/{c.total}</Badge>
                  {c.overdue > 0 && (
                    <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">{c.overdue} overdue</Badge>
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
              Security Alerts
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

        {/* ── Cara Intelligence ──────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Security Intelligence
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
