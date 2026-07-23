"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF REFLECTIVE PRACTICE CARD
// Live data from useSupervisionIntelligence() — overview, training, staff.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets, rate } from "@/lib/metrics/rate";
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

export function StaffReflectivePracticeCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            Reflective Practice
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

  const { overview, training_compliance, staff_profiles } = intel;
  const mandatoryRate = rate(training_compliance.mandatory_compliant, training_compliance.mandatory_total);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            Reflective Practice
          </CardTitle>
          <Link href="/workforce" className="text-xs text-brand hover:underline flex items-center gap-1">
            Workforce <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{overview.supervisions_completed_90d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(overview.action_completion_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(overview.action_completion_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(overview.action_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(mandatoryRate, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(mandatoryRate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(mandatoryRate)}</p>
            <p className="text-[10px] text-muted-foreground">Mandatory</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", training_compliance.expired === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", training_compliance.expired === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{training_compliance.expired}</p>
            <p className="text-[10px] text-muted-foreground">Expired</p>
          </div>
        </div>

        {/* ── Staff non-compliant ─────────────────────────────────────── */}

        {staff_profiles.filter((s) => s.training_status === "non_compliant").length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Non-Compliant Staff</p>
            {staff_profiles.filter((s) => s.training_status === "non_compliant").slice(0, 3).map((s) => (
              <div key={s.staff_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{s.staff_name}</span>
                <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">{s.actions_overdue} actions overdue</Badge>
              </div>
            ))}
          </div>
        )}

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
              Cara Reflective Intelligence
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
