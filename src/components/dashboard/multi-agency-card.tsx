"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MULTI-AGENCY WORKING INTELLIGENCE CARD
// Dashboard card powered by the Multi-Agency Intelligence Engine.
// Reg 5 (engagement), Reg 13 (leadership),
// Working Together to Safeguard Children 2018.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Network, ChevronRight, AlertTriangle, Brain,
  Users, Calendar, FileText, CheckCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { MultiAgencyIntelligenceResult } from "@/lib/engines/multi-agency-intelligence-engine";

interface MultiAgencyIntelligenceResponse {
  data: MultiAgencyIntelligenceResult;
}

function useMultiAgencyIntelligence() {
  return useQuery({
    queryKey: ["multi-agency-intelligence"],
    queryFn: () => api.get<MultiAgencyIntelligenceResponse>("/multi-agency-intelligence"),
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

export function MultiAgencyCard() {
  const { data, isLoading } = useMultiAgencyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Network className="h-4 w-4 text-brand" />
            Multi-Agency Working
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
            <Network className="h-4 w-4 text-brand" />
            Multi-Agency Working
          </CardTitle>
          <Link href="/multi-agency-meetings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Contacts <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.children_with_social_worker === o.total_children ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.children_with_social_worker === o.total_children ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.children_with_social_worker}/{o.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Have SW</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_professionals}</p>
            <p className="text-[10px] text-muted-foreground">Contacts</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.child_participation_rate >= 90 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.child_participation_rate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.child_participation_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Participation</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.overdue_contacts === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.overdue_contacts === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.overdue_contacts}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Upcoming LAC reviews ────────────────────────────────────── */}

        {intel.upcoming_reviews.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Upcoming LAC Reviews
            </p>
            {intel.upcoming_reviews.slice(0, 3).map((r) => (
              <div key={r.review_id} className="rounded border p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.child_name}</span>
                  <Badge variant="outline" className="text-[10px]">{r.review_type}</Badge>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{new Date(r.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} — IRO: {r.iro_name}</span>
                  <Badge className={cn(
                    "text-[10px]",
                    r.home_report_submitted ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-risk-bg] text-[--cs-risk]",
                  )}>
                    <FileText className="h-2.5 w-2.5 mr-0.5" />
                    {r.home_report_submitted ? "Report sent" : "Report due"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Meeting types ───────────────────────────────────────────── */}

        {intel.meeting_types.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Meetings ({o.meetings_this_quarter})
            </p>
            {intel.meeting_types.map((mt) => (
              <div key={mt.meeting_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{mt.type_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{mt.count}</Badge>
                  <Badge className={cn(
                    "text-[10px]",
                    mt.actions_completion_rate >= 90 ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-warning-bg] text-[--cs-warning]",
                  )}>
                    {mt.actions_completion_rate}% done
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Compliance ─────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-blue-500" />
            Compliance
          </p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className={cn("font-bold tabular-nums", o.home_report_rate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {o.home_report_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Reports</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", o.child_participation_rate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {o.child_participation_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Participation</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", o.follow_up_completion_rate >= 90 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
                {o.follow_up_completion_rate}%
              </p>
              <p className="text-[10px] text-muted-foreground">Follow-ups</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Multi-Agency Alerts
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

        {/* ── Cara Multi-Agency Intelligence ──────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Multi-Agency Intelligence
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
