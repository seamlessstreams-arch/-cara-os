"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — REG 44 INDEPENDENT VISITOR INTELLIGENCE CARD
// Dashboard widget for visit compliance, recommendation follow-through,
// Ofsted reporting, and Cara independent scrutiny intelligence.
// Powered by the Reg 44 Intelligence Engine — live data (Reg 44).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Loader2, Clock, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { meets, formatRate } from "@/lib/metrics/rate";
import { useReg44Intelligence } from "@/hooks/use-reg44-intelligence";

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

export function Reg44IndependentVisitorCard() {
  const { data, isLoading } = useReg44Intelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Reg 44 Visits
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
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Reg 44 Visits
          </CardTitle>
          <Link href="/ri/reg44" className="text-xs text-brand hover:underline flex items-center gap-1">
            Reports <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_visits_12m}</p>
            <p className="text-[10px] text-muted-foreground">Visits (12m)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.visits_on_schedule ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.visits_on_schedule ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {o.visits_on_schedule ? "Yes" : "No"}
            </p>
            <p className="text-[10px] text-muted-foreground">On Schedule</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.completion_rate === null ? "bg-slate-50" : meets(o.completion_rate, 80) ? "bg-green-50" : meets(o.completion_rate, 60) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.completion_rate === null ? "text-muted-foreground" : meets(o.completion_rate, 80) ? "text-[--cs-success]" : meets(o.completion_rate, 60) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {formatRate(o.completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Recs Done</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(o.ofsted_reporting_compliance, 100) ? "bg-green-50" : o.ofsted_reporting_compliance === null ? "bg-slate-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(o.ofsted_reporting_compliance, 100) ? "text-[--cs-success]" : o.ofsted_reporting_compliance === null ? "text-muted-foreground" : "text-[--cs-warning]")}>
              {formatRate(o.ofsted_reporting_compliance)}
            </p>
            <p className="text-[10px] text-muted-foreground">Reported</p>
          </div>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <div>
                <p className="text-xs font-medium">{o.avg_days_between_visits === null ? "—" : `${o.avg_days_between_visits}d`}</p>
                <p className="text-[10px] text-muted-foreground">Avg Gap</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-green-500" />
              <div>
                <p className="text-xs font-medium">{formatRate(o.children_participation_rate)}</p>
                <p className="text-[10px] text-muted-foreground">YP Spoken</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-purple-500" />
              <div>
                <p className="text-xs font-medium">{o.avg_duration_hours === null ? "—" : `${o.avg_duration_hours}h`}</p>
                <p className="text-[10px] text-muted-foreground">Avg Visit</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Recommendation status ───────────────────────────────────── */}

        {o.total_recommendations > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Recommendations ({o.total_recommendations})
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {o.recommendations_completed > 0 && (
                  <div
                    className="h-full bg-green-400"
                    style={{ width: `${(o.recommendations_completed / o.total_recommendations) * 100}%` }}
                  />
                )}
                {o.recommendations_in_progress > 0 && (
                  <div
                    className="h-full bg-amber-400"
                    style={{ width: `${(o.recommendations_in_progress / o.total_recommendations) * 100}%` }}
                  />
                )}
                {o.recommendations_pending > 0 && (
                  <div
                    className="h-full bg-red-400"
                    style={{ width: `${(o.recommendations_pending / o.total_recommendations) * 100}%` }}
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {o.recommendations_completed} complete
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {o.recommendations_in_progress} in progress
              </span>
              {o.recommendations_pending > 0 && (
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  {o.recommendations_pending} pending
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Recent visits ────────────────────────────────────────────── */}

        {intel.visit_profiles.length > 0 && (
          <div className="space-y-1.5">
            {intel.visit_profiles.slice(-3).reverse().map((visit) => (
              <div key={visit.visit_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{visit.visit_date}</span>
                  <div className="flex items-center gap-1.5">
                    {visit.on_schedule ? (
                      <Badge className="text-[9px] bg-[--cs-success-bg] text-[--cs-success]">on time</Badge>
                    ) : (
                      <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">late</Badge>
                    )}
                    {visit.report_sent_timely && (
                      <Badge className="text-[9px] bg-[--cs-info-bg] text-[--cs-info]">reported</Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{visit.visitor}</span>
                  <span className="text-[10px]">{formatRate(visit.children_spoken_rate)} YP spoken</span>
                  <span className="text-[10px]">{visit.recommendations_count} recs</span>
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
              Reg 44 Alerts
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

        {/* ── Cara Reg 44 Intelligence ─────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Governance Intelligence
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
