"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTEXTUAL SAFEGUARDING INTELLIGENCE CARD
// Dashboard card powered by the Contextual Safeguarding Intelligence Engine.
// Reg 12 (protection from harm), Reg 13, Reg 34, SCCIF Helped & Protected.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, AlertTriangle, Brain,
  MapPin, Eye, Users, Radio, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/hooks/use-api";
import type { ContextualSafeguardingIntelligenceResult } from "@/lib/engines/contextual-safeguarding-intelligence-engine";

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

const RISK_LEVEL_STYLES: Record<string, string> = {
  high: "bg-[--cs-risk-bg] text-[--cs-risk]",
  medium: "bg-[--cs-warning-bg] text-[--cs-warning]",
  low: "bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ContextualSafeguardingCard() {
  interface ContextualSafeguardingIntelligenceResponse {
    data: ContextualSafeguardingIntelligenceResult;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["contextual-safeguarding-intelligence"],
    queryFn: () => apiFetch<ContextualSafeguardingIntelligenceResponse>("/contextual-safeguarding-intelligence"),
    refetchInterval: 60_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Contextual Safeguarding
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
            <ShieldAlert className="h-4 w-4 text-brand" />
            Contextual Safeguarding
          </CardTitle>
          <Link href="/contextual-safeguarding" className="text-xs text-brand hover:underline flex items-center gap-1">
            Screenings <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.children_screened === o.total_children ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.children_screened === o.total_children ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.children_screened}/{o.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Screened</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.high_risk_children === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.high_risk_children === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.high_risk_children}
            </p>
            <p className="text-[10px] text-muted-foreground">High Risk</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.referrals_made}</p>
            <p className="text-[10px] text-muted-foreground">Referrals</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.overdue_screenings === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.overdue_screenings === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.overdue_screenings}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Screening coverage ──────────────────────────────────────── */}

        {intel.screening_coverage.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Screening Coverage
            </p>
            {intel.screening_coverage.map((s) => (
              <div key={s.screening_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{s.type_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{s.children_screened}</Badge>
                  {s.high_risk_count > 0 && (
                    <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                      <Radio className="h-2.5 w-2.5 mr-0.5" />
                      {s.high_risk_count} high
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Locality risks ──────────────────────────────────────────── */}

        {intel.locality_risks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Locality Risks ({o.locality_risks_total})
            </p>
            {intel.locality_risks.slice(0, 3).map((l) => (
              <div key={l.location_name} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-medium truncate">{l.location_name}</span>
                </div>
                <Badge className={cn(
                  "text-[10px]",
                  RISK_LEVEL_STYLES[l.risk_level] ?? "bg-[--cs-warning-bg] text-[--cs-warning]",
                )}>
                  {l.risk_level}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Active response ─────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Users className="h-3 w-3 text-indigo-500" />
            Active Response
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{o.active_safety_plans}</p>
              <p className="text-[10px] text-muted-foreground">Safety Plans</p>
            </div>
            <div>
              <p className="font-bold text-indigo-600 tabular-nums">{o.referrals_made}</p>
              <p className="text-[10px] text-muted-foreground">Referrals</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{o.high_risk_locations}</p>
              <p className="text-[10px] text-muted-foreground">High Locations</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Exploitation Alerts
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

        {/* ── Cara Exploitation Intelligence ──────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Exploitation Intelligence
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
