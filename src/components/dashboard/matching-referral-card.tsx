"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — MATCHING & REFERRAL INTELLIGENCE CARD
// Dashboard card for referral pipeline, impact assessment compliance,
// decision analytics, and Cara admission intelligence.
// Powered by the Admission & Referral Intelligence Engine — live data (Reg 11/12).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest, ChevronRight, AlertTriangle, Brain,
  UserPlus, CheckCircle2, XCircle, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";

// ── Styling ─────────────────────────────────────────────────────────────────

const STATUS_BADGES: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  new: { label: "New", color: "text-blue-700 bg-blue-50 border-blue-200", icon: Clock },
  under_assessment: { label: "Assessing", color: "text-amber-700 bg-amber-50 border-amber-200", icon: Clock },
  impact_assessment: { label: "Impact", color: "text-purple-700 bg-purple-50 border-purple-200", icon: Clock },
  panel: { label: "Panel", color: "text-indigo-700 bg-indigo-50 border-indigo-200", icon: Clock },
  accepted: { label: "Accepted", color: "text-green-700 bg-green-50 border-green-200", icon: CheckCircle2 },
  declined: { label: "Declined", color: "text-red-700 bg-red-50 border-red-200", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: "text-gray-700 bg-gray-50 border-gray-200", icon: XCircle },
};

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

const URGENCY_STYLES: Record<string, string> = {
  critical: "bg-[--cs-risk-bg] text-[--cs-risk]",
  high: "bg-[--cs-warning-bg] text-[--cs-warning]",
  standard: "bg-[--cs-bg] text-[--cs-text-secondary]",
};

// ── Component ────────────────────────────────────────────────────────────────

export function MatchingReferralCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admission-referral-intelligence"],
    queryFn: () => api.get("/admission-referral-intelligence"),
    refetchInterval: 60_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <GitPullRequest className="h-4 w-4 text-brand" />
            Matching & Referrals
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
            <GitPullRequest className="h-4 w-4 text-brand" />
            Matching & Referrals
          </CardTitle>
          <Link href="/matching-referrals" className="text-xs text-brand hover:underline flex items-center gap-1">
            Referrals <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.active_referrals > 0 ? "bg-blue-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.active_referrals > 0 ? "text-blue-600" : "text-[--cs-success]")}>
              {o.active_referrals}
            </p>
            <p className="text-[10px] text-muted-foreground">Active</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.impact_assessment_completion_rate === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.impact_assessment_completion_rate === 100 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {o.impact_assessment_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">IA Done</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.occupancy_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Occupied</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.available_beds > 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.available_beds > 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>
              {o.available_beds}
            </p>
            <p className="text-[10px] text-muted-foreground">Beds</p>
          </div>
        </div>

        {/* ── Decision metrics ──────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs font-medium">{o.total_referrals}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="text-xs font-medium text-green-600">{o.accepted_count}</p>
              <p className="text-[10px] text-muted-foreground">Accepted</p>
            </div>
            <div>
              <p className="text-xs font-medium text-red-600">{o.declined_count}</p>
              <p className="text-[10px] text-muted-foreground">Declined</p>
            </div>
            <div>
              <p className="text-xs font-medium">{o.avg_days_to_decision}d</p>
              <p className="text-[10px] text-muted-foreground">Avg Decision</p>
            </div>
          </div>
        </div>

        {/* ── Referral Pipeline ─────────────────────────────────────────── */}

        {intel.referral_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <UserPlus className="h-3 w-3" />
              Referral Pipeline
            </p>
            {intel.referral_profiles.slice(0, 5).map((ref) => {
              const badge = STATUS_BADGES[ref.status] ?? STATUS_BADGES.new;
              const StatusIcon = badge.icon;
              return (
                <div key={ref.id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusIcon className={cn("h-3 w-3 shrink-0", ref.status === "accepted" ? "text-green-500" : ref.status === "declined" || ref.status === "withdrawn" ? "text-red-500" : "text-blue-500")} />
                    <span className="font-medium">{ref.child_name}</span>
                    <span className="text-muted-foreground truncate">Age {ref.age} — {ref.local_authority}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    {ref.urgency !== "standard" && (
                      <Badge className={cn("text-[9px]", URGENCY_STYLES[ref.urgency])}>
                        {ref.urgency}
                      </Badge>
                    )}
                    <Badge variant="outline" className={cn("text-[10px]", badge.color)}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Admission Alerts
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

        {/* ── Cara Admission Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Matching Intelligence
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
