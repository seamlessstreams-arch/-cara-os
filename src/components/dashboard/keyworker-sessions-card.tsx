"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEYWORKER SESSIONS INTELLIGENCE CARD
// Dashboard widget for keyworking session frequency, quality, child-led rates,
// documentation compliance, follow-up tracking, and Cara keyworking intelligence.
// Powered by the Keyworking Intelligence Engine — live data (Reg 22).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useKeyworkingIntelligence } from "@/hooks/use-keyworking-intelligence";
import { NO_SESSION_RECORDED } from "@/lib/engines/keyworking-intelligence-engine";

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

export function KeyworkerSessionsCard() {
  const { data, isLoading } = useKeyworkingIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Keyworker Sessions
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
            <Heart className="h-4 w-4 text-brand" />
            Keyworker Sessions
          </CardTitle>
          <Link href="/key-working" className="text-xs text-brand hover:underline flex items-center gap-1">
            Keyworking <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.avg_sessions_per_child_30d.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg/Child</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.child_voice_rate === null ? "bg-muted" : meets(o.child_voice_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.child_voice_rate === null ? "text-muted-foreground" : meets(o.child_voice_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.child_voice_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Child Voice</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.follow_up_completion_rate === null ? "bg-muted" : meets(o.follow_up_completion_rate, 95) ? "bg-green-50" : meets(o.follow_up_completion_rate, 80) ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.follow_up_completion_rate === null ? "text-muted-foreground" : meets(o.follow_up_completion_rate, 95) ? "text-[--cs-success]" : meets(o.follow_up_completion_rate, 80) ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {formatRate(o.follow_up_completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Follow-Up</p>
          </div>
        </div>

        {/* ── Child profiles ───────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              By Young Person
            </p>
            {intel.child_profiles.slice(0, 5).map((profile) => (
              <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{profile.child_name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {profile.sessions_30d} session{profile.sessions_30d !== 1 ? "s" : ""} (30d)
                    </span>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    profile.last_session_days_ago <= 7 ? "bg-[--cs-success-bg] text-[--cs-success]" :
                    profile.last_session_days_ago <= 14 ? "bg-[--cs-warning-bg] text-[--cs-warning]" :
                    "bg-[--cs-risk-bg] text-[--cs-risk]",
                  )}>
                    {profile.last_session_days_ago === NO_SESSION_RECORDED
                      ? "none recorded"
                      : `${profile.last_session_days_ago}d ago`}
                  </Badge>
                </div>
                {(profile.session_types?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(profile.session_types ?? []).slice(0, 4).map((type, i) => (
                      <Badge key={i} className="text-[9px] bg-gray-100 text-gray-700 border-gray-200 capitalize">
                        {type.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Session type breakdown ──────────────────────────────────── */}

        {intel.session_type_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Session Types (30d)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {intel.session_type_breakdown.map((st, i) => (
                <Badge key={i} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                  {st.label} ({st.count_30d})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Follow-up compliance ────────────────────────────────────── */}

        {intel.follow_up_compliance.total_due > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-xs font-medium">Follow-Up Compliance</p>
                <p className="text-[10px] text-muted-foreground">
                  {intel.follow_up_compliance.completed}/{intel.follow_up_compliance.total_due} completed
                  {intel.follow_up_compliance.overdue > 0 && (
                    <span className="text-[--cs-risk]"> ({intel.follow_up_compliance.overdue} overdue)</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-sm font-bold tabular-nums",
                intel.follow_up_compliance.completion_rate === null ? "text-muted-foreground" :
                meets(intel.follow_up_compliance.completion_rate, 90) ? "text-[--cs-success]" :
                meets(intel.follow_up_compliance.completion_rate, 70) ? "text-[--cs-warning]" : "text-[--cs-risk]",
              )}>
                {formatRate(intel.follow_up_compliance.completion_rate)}
              </p>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Session Alerts
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

        {/* ── Cara Keyworking Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Keyworking Intelligence
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
