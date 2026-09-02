"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — WHISTLEBLOWING INTELLIGENCE CARD
// Dashboard card powered by the Whistleblowing Intelligence Engine.
// Reg 41 (whistleblowing), Public Interest Disclosure Act 1998 (PIDA).
// ══════════════════════════════════════════════════════════════════════════════

import { formatRate } from "@/lib/metrics/rate";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, ChevronRight, AlertTriangle, Brain,
  Shield, Eye, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { WhistleblowingIntelligenceResult } from "@/lib/engines/whistleblowing-intelligence-engine";

interface WhistleblowingIntelligenceResponse {
  data: WhistleblowingIntelligenceResult;
}

function useWhistleblowingIntelligence() {
  return useQuery({
    queryKey: ["whistleblowing-intelligence"],
    queryFn: () => api.get<WhistleblowingIntelligenceResponse>("/whistleblowing-intelligence"),
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

export function WhistleblowingCard() {
  const { data, isLoading } = useWhistleblowingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-brand" />
            Whistleblowing
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
            <Megaphone className="h-4 w-4 text-brand" />
            Whistleblowing
          </CardTitle>
          <Link href="/whistleblowing" className="text-xs text-brand hover:underline flex items-center gap-1">
            Register <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_reports}
            </p>
            <p className="text-[10px] text-muted-foreground">Reports</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.open_reports === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.open_reports === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.open_reports}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.avg_resolution_days}d
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Resolve</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            (o.protection_measures_rate ?? 0) >= 90 ? "bg-green-50" : (o.protection_measures_rate ?? 0) >= 70 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              (o.protection_measures_rate ?? 0) >= 90 ? "text-[--cs-success]" : (o.protection_measures_rate ?? 0) >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.protection_measures_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Protected</p>
          </div>
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Disclosures by Category
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
              Active Investigations
            </p>
            {intel.open_cases.slice(0, 3).map((c) => (
              <div key={c.case_id} className="rounded border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[--cs-warning]">{c.category_label}</span>
                  <Badge className={cn(
                    "text-[10px]",
                    c.severity === "critical" || c.severity === "high"
                      ? "bg-[--cs-risk-bg] text-[--cs-risk]"
                      : "bg-[--cs-warning-bg] text-[--cs-warning]",
                  )}>
                    {c.severity}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-amber-700">
                  <span>Ref: {c.reference}</span>
                  <span className="font-medium">{c.days_open} days</span>
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
              <p className={cn(
                "font-bold tabular-nums",
                (o.lessons_recorded_rate ?? 0) >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]",
              )}>
                {formatRate(o.lessons_recorded_rate)}
              </p>
              <p className="text-[10px] text-muted-foreground">Lessons</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{o.external_referral_count}</p>
              <p className="text-[10px] text-muted-foreground">External</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 tabular-nums">{o.anonymous_count}</p>
              <p className="text-[10px] text-muted-foreground">Anonymous</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Whistleblowing Alerts
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

        {/* ── Cara Whistleblowing Intelligence ────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Whistleblowing Intelligence
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
