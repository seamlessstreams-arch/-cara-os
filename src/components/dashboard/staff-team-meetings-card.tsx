"use client";

// ══════════���═══════════════════════════════════════════════════════════════════
// CARA — STAFF TEAM MEETINGS CARD
// Live data from useSupervisionIntelligence() — overview, wellbeing, training.
// ════════════════════════════════════════════════════════���═════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useSupervisionIntelligence } from "@/hooks/use-supervision-intelligence";

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

export function StaffTeamMeetingsCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Team Meetings
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

  const { overview, wellbeing, training_compliance } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Team Meetings
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{overview.total_staff}</p>
            <p className="text-[10px] text-muted-foreground">Staff</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{overview.supervisions_completed_90d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions/90d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(overview.action_completion_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(overview.action_completion_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(overview.action_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(overview.avg_wellbeing_score, 7) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(overview.avg_wellbeing_score, 7) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{overview.avg_wellbeing_score?.toFixed(1) ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">Avg WB</p>
          </div>
        </div>

        {/* ── Training summary ────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold">Training Compliance</p>
          <div className="flex flex-wrap gap-1">
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">{training_compliance.compliant} compliant</Badge>
            {training_compliance.expiring_soon > 0 && (
              <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">{training_compliance.expiring_soon} expiring</Badge>
            )}
            {training_compliance.expired > 0 && (
              <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">{training_compliance.expired} expired</Badge>
            )}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Meeting Intelligence
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
