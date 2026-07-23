"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF DEBRIEF & SUPPORT CARD
// Live data from useSupervisionIntelligence() — overview, wellbeing, staff.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

export function StaffDebriefSupportCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Debrief & Support
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

  const { overview, wellbeing, staff_profiles } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Debrief & Support
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
            <p className="text-[10px] text-muted-foreground">Sessions/90d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", wellbeing.avg_score === null ? "bg-slate-50" : wellbeing.avg_score >= 7 ? "bg-green-50" : wellbeing.avg_score >= 5 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", wellbeing.avg_score === null ? "text-[var(--cs-text-muted)]" : wellbeing.avg_score >= 7 ? "text-[--cs-success]" : wellbeing.avg_score >= 5 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>{wellbeing.avg_score === null ? "—" : wellbeing.avg_score.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Wellbeing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", wellbeing.staff_below_threshold === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", wellbeing.staff_below_threshold === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{wellbeing.staff_below_threshold}</p>
            <p className="text-[10px] text-muted-foreground">Low WB</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.supervisions_overdue === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.supervisions_overdue === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{overview.supervisions_overdue}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Staff needing support ───────────────────────────────────── */}

        {staff_profiles.filter((s) => s.wellbeing_trend === "declining").length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Declining Wellbeing</p>
            {staff_profiles.filter((s) => s.wellbeing_trend === "declining").slice(0, 3).map((s) => (
              <div key={s.staff_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{s.staff_name}</span>
                <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">WB: {s.avg_wellbeing?.toFixed(1) ?? "—"}</Badge>
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
              Cara Support Intelligence
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
