"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SUPERVISION INTELLIGENCE CARD
// Dashboard widget for supervision compliance, staff wellbeing, training
// status, and Cara staff development intelligence.
// Powered by the Supervision Intelligence Engine — live data (Reg 33/32/29).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, ChevronRight, AlertTriangle, Brain,
  CheckCircle2, Loader2, TrendingUp, TrendingDown,
  Minus, BookOpen, Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useSupervisionIntelligence } from "@/hooks/use-supervision-intelligence";

// ── Styling ────────────────────────────────────────────────────────────────��

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

const COMPLIANCE_STYLES: Record<string, { bg: string; text: string }> = {
  on_track: { bg: "bg-green-100", text: "text-green-700" },
  due_soon: { bg: "bg-amber-100", text: "text-amber-700" },
  overdue: { bg: "bg-red-100", text: "text-red-700" },
};

const TRAINING_STYLES: Record<string, { bg: string; text: string }> = {
  compliant: { bg: "bg-green-100", text: "text-green-700" },
  expiring: { bg: "bg-amber-100", text: "text-amber-700" },
  non_compliant: { bg: "bg-red-100", text: "text-red-700" },
};

const TREND_ICON: Record<string, React.ReactNode> = {
  improving: <TrendingUp className="h-3 w-3 text-green-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
  declining: <TrendingDown className="h-3 w-3 text-red-500" />,
  insufficient_data: <Minus className="h-3 w-3 text-gray-300" />,
};

// ── Component ────────────────────────────────────────────────────────────────

export function SupervisionIntelligenceCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Supervision Intelligence
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
  const onTrack = intel.staff_profiles.filter((p) => p.compliance_status === "on_track").length;
  const dueSoon = intel.staff_profiles.filter((p) => p.compliance_status === "due_soon").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Supervision Intelligence
          </CardTitle>
          <Link href="/supervision" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_staff}</p>
            <p className="text-[10px] text-muted-foreground">Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", onTrack > 0 ? "bg-green-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", onTrack > 0 ? "text-[--cs-success]" : "text-gray-500")}>{onTrack}</p>
            <p className="text-[10px] text-muted-foreground">On Track</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.supervisions_overdue > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.supervisions_overdue > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>
              {o.supervisions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.supervisions_completed_90d}</p>
            <p className="text-[10px] text-muted-foreground">Done (90d)</p>
          </div>
        </div>

        {/* ── Wellbeing & training bar ──────────────────���───────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-pink-500" />
              <div>
                <p className="text-xs font-medium">{o.avg_wellbeing_score === null ? "—" : `${o.avg_wellbeing_score}/10`}</p>
                <p className="text-[10px] text-muted-foreground">Wellbeing</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" />
              <div>
                <p className="text-xs font-medium">{formatRate(o.mandatory_training_compliance)}</p>
                <p className="text-[10px] text-muted-foreground">Training</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              <div>
                <p className="text-xs font-medium">{formatRate(o.action_completion_rate)}</p>
                <p className="text-[10px] text-muted-foreground">Actions</p>
              </div>
            </div>
          </div>
          {intel.wellbeing.trend !== "insufficient_data" && (
            <div className="flex items-center gap-1">
              {TREND_ICON[intel.wellbeing.trend]}
              <span className="text-[10px] text-muted-foreground capitalize">{intel.wellbeing.trend}</span>
            </div>
          )}
        </div>

        {/* ── Per-staff profiles ────────────────────────────────────────── */}

        {intel.staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Staff Supervision Status
            </p>
            {intel.staff_profiles.slice(0, 5).map((profile) => {
              const cStyle = COMPLIANCE_STYLES[profile.compliance_status];
              const tStyle = TRAINING_STYLES[profile.training_status];
              return (
                <div key={profile.staff_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{profile.staff_name}</span>
                      <span className="text-[10px] text-muted-foreground">{profile.role}</span>
                    </div>
                    <Badge className={cn("text-[10px]", cStyle.bg, cStyle.text)}>
                      {profile.compliance_status === "on_track" ? "on track" : profile.compliance_status === "due_soon" ? "due soon" : "overdue"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-muted-foreground">
                    <span className="text-[10px] flex items-center gap-0.5">
                      {TREND_ICON[profile.wellbeing_trend]}
                      {profile.avg_wellbeing !== null ? `${profile.avg_wellbeing}/10` : "—"}
                    </span>
                    <Badge className={cn("text-[9px]", tStyle.bg, tStyle.text)}>
                      {profile.training_status === "non_compliant" ? "training gap" : profile.training_status}
                    </Badge>
                    {profile.actions_overdue > 0 && (
                      <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        {profile.actions_overdue} action{profile.actions_overdue > 1 ? "s" : ""} overdue
                      </Badge>
                    )}
                    {profile.last_supervision_date && (
                      <span className="text-[10px]">Last: {profile.last_supervision_days_ago}d ago</span>
                    )}
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
