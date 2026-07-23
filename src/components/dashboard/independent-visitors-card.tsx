"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — INDEPENDENT VISITORS INTELLIGENCE CARD
// Dashboard card for IV assignments, visit tracking, child engagement,
// and Cara independent visitor intelligence.
// Children Act 1989 s23ZB, CHR 2015 Reg 44, IRO Handbook 2010.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus, ChevronRight, AlertTriangle, Brain,
  Shield, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useVisitorsIntelligence } from "@/hooks/use-visitors-intelligence";

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

export function IndependentVisitorsCard() {
  const { data, isLoading } = useVisitorsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand" />
            Independent Visitors
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
  const avgVisitsPerChild =
    intel.child_profiles.length > 0
      ? Math.round((o.total_visits / intel.child_profiles.length) * 10) / 10
      : 0;
  const professionalRate =
    o.total_visits > 0
      ? Math.round((o.professional_visits / o.total_visits) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-brand" />
            Independent Visitors
          </CardTitle>
          <Link href="/visitor-log" className="text-xs text-brand hover:underline flex items-center gap-1">
            Visitors <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {avgVisitsPerChild}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg/Child</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.dbs_compliance_rate === null ? "bg-muted" : meets(o.dbs_compliance_rate, 100) ? "bg-green-50" : meets(o.dbs_compliance_rate, 90) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.dbs_compliance_rate === null ? "text-muted-foreground" : meets(o.dbs_compliance_rate, 100) ? "text-[--cs-success]" : meets(o.dbs_compliance_rate, 90) ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {formatRate(o.dbs_compliance_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className="text-center rounded-lg bg-emerald-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-emerald-600">
              {professionalRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Professional</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.unique_visitors}
            </p>
            <p className="text-[10px] text-muted-foreground">Unique</p>
          </div>
        </div>

        {/* ── Child profiles ───────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Child Contact
            </p>
            {intel.child_profiles.slice(0, 5).map((c) => (
              <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.child_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-600">{c.total_visits} visits</span>
                    <span className="text-green-600 tabular-nums">{c.professional_visits}P</span>
                    <span className="text-blue-600 tabular-nums">{c.family_visits}F</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {c.days_since_last_visit === 0
                      ? "Today"
                      : `${c.days_since_last_visit}d ago`}
                  </span>
                  {c.days_since_last_visit > 14 && (
                    <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
                      {c.days_since_last_visit}d since visit
                    </Badge>
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
              IV Alerts
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

        {/* ── Cara insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara IV Intelligence
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
