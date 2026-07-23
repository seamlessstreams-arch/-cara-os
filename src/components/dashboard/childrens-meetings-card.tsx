"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S MEETINGS INTELLIGENCE CARD
// Dashboard card for house meetings, children's council, and participation.
// Powered by the Contact Engagement Intelligence Engine — live data.
// CHR 2015 Reg 7, Reg 10, Reg 16.
// SCCIF: Voice of the Child — "Children influence how the home is run."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useContactEngagement } from "@/hooks/use-contact-engagement";

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

export function ChildrensMeetingsCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Children&apos;s Meetings
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

  const c = intel.compliance;
  const ft = intel.family_time;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Children&apos;s Meetings
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Meetings <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.total_sessions_90d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (90d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(c.overall_completion_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(c.overall_completion_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(c.overall_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.avg_sessions_per_child_30d ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">Per Child</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", c.plans_overdue_review === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.plans_overdue_review === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{c.plans_overdue_review}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Presentation breakdown ─────────────────────────────────── */}

        {(ft.presentation_breakdown?.length ?? 0) > 0 && (
          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Meeting Presentation</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {(ft.presentation_breakdown ?? []).slice(0, 3).map((pb) => (
                <div key={pb.presentation}>
                  <p className="font-bold tabular-nums text-blue-600">{pb.count}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{pb.presentation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Child profiles ─────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Meeting Participation
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  {cp.predominant_presentation && (
                    <span className="text-[10px] text-muted-foreground capitalize">{cp.predominant_presentation}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold tabular-nums">{cp.sessions_30d}</span>
                  <span className="text-muted-foreground text-[10px]">/ 30d</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Contact plan status ─────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Heart className={cn("h-4 w-4", c.plans_overdue_review > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Meeting Plans</p>
              <p className="text-[10px] text-muted-foreground">
                {c.active_plans}/{c.total_children} active
              </p>
            </div>
          </div>
          {c.plans_overdue_review > 0 ? (
            <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">
              {c.plans_overdue_review} review overdue
            </Badge>
          ) : c.active_plans > 0 ? (
            <Badge className="text-[10px] bg-[--cs-success-bg] text-[--cs-success]">All current</Badge>
          ) : (
            <Badge className="text-[10px] bg-[--cs-bg] text-[--cs-text-secondary]">None active</Badge>
          )}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Meeting Alerts
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

        {/* ── Cara Meeting Intelligence ───────────────────────────────── */}

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
