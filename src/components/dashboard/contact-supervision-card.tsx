"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT SUPERVISION INTELLIGENCE CARD
// Dashboard widget for supervision completion, overdue tracking, staff
// wellbeing, and Cara intelligence insights.
// Powered by the Supervision Intelligence Engine — live data (Reg 33).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PhoneCall, ChevronRight, AlertTriangle, Brain,
  Users, Loader2, Heart, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSupervisionIntelligence } from "@/hooks/use-supervision-intelligence";

// ── Styling ──────────────────────────────────────────────────────────────────

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

export function ContactSupervisionCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-brand" />
            Contact Supervision
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
  const completionRate = o.total_staff > 0
    ? Math.round((o.supervisions_completed_90d / (o.total_staff * 3)) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-brand" />
            Contact Supervision
          </CardTitle>
          <Link href="/supervision" className="text-xs text-brand hover:underline flex items-center gap-1">
            Supervision <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", completionRate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", completionRate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {completionRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.supervisions_overdue === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.supervisions_overdue === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {o.supervisions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.avg_days_between_supervisions === null ? "—" : `${o.avg_days_between_supervisions}d`}</p>
            <p className="text-[10px] text-muted-foreground">Avg Gap</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_staff}</p>
            <p className="text-[10px] text-muted-foreground">Staff</p>
          </div>
        </div>

        {/* ── Staff profiles ───────────────────────────────────────────── */}

        {intel.staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Staff Supervision Status
            </p>
            <div className="space-y-1">
              {intel.staff_profiles.slice(0, 5).map((profile) => (
                <div key={profile.staff_id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Users className="h-3 w-3 text-cyan-500 shrink-0" />
                    <span className="font-medium">{profile.staff_name}</span>
                    <span className="text-muted-foreground truncate">{profile.role}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {profile.compliance_status === "overdue" && (
                      <Badge variant="outline" className="text-[10px] shrink-0 text-red-700 bg-red-50 border-red-200">
                        Overdue
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {profile.last_supervision_days_ago}d ago
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Wellbeing section ────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3 text-pink-500" />
            Wellbeing
          </p>
          <div className="flex items-center gap-4 rounded-lg border p-3 text-xs">
            <div>
              <p className="font-medium">{intel.wellbeing.avg_score}/10</p>
              <p className="text-[10px] text-muted-foreground">Avg Score</p>
            </div>
            {intel.wellbeing.staff_below_threshold > 0 && (
              <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                {intel.wellbeing.staff_below_threshold} below threshold
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] capitalize">
              {intel.wellbeing.trend}
            </Badge>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Supervision Alerts
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

        {/* ── Cara Supervision Intelligence ────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Supervision Intelligence
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
