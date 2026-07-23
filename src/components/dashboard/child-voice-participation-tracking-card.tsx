"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILD VOICE & PARTICIPATION TRACKING INTELLIGENCE CARD
// Dashboard card for children's voice, participation, and engagement.
// Powered by the Contact Engagement Intelligence Engine — live data.
// CHR 2015 Reg 7. SCCIF: Voice of the Child.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, CheckCircle2,
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

export function ChildVoiceParticipationTrackingCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Child Voice
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
  const mi = intel.mood_impact;
  const childrenWithConcerns = intel.child_profiles.filter((cp) => cp.concern_sessions_90d > 0).length;
  const childrenWithPlans = intel.child_profiles.filter((cp) => cp.has_active_plan).length;

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-brand" />
            Child Voice
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Participation <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(c.overall_completion_rate, 80) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(c.overall_completion_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(c.overall_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", childrenWithConcerns === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", childrenWithConcerns === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{childrenWithConcerns}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{childrenWithPlans}</p>
            <p className="text-[10px] text-muted-foreground">Plans</p>
          </div>
        </div>

        {/* ── Child participation profiles ────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Participation
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  <span className="text-[10px] text-muted-foreground">{cp.sessions_30d} sessions/30d</span>
                </div>
                <div className="flex items-center gap-1">
                  {cp.has_active_plan && (
                    <Badge className="text-[9px] bg-[--cs-success-bg] text-[--cs-success]">
                      <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                      plan
                    </Badge>
                  )}
                  {!cp.plan_review_current && (
                    <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">review due</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mood impact ─────────────────────────────────────────────── */}

        {mi.children_with_data > 0 && (
          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Voice Impact on Mood</p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="font-bold tabular-nums text-green-600">{mi.positive_impact_children}</p>
                <p className="text-[10px] text-muted-foreground">Positive</p>
              </div>
              <div>
                <p className="font-bold tabular-nums text-blue-600">{mi.neutral_impact_children}</p>
                <p className="text-[10px] text-muted-foreground">Neutral</p>
              </div>
              <div>
                <p className={cn("font-bold tabular-nums", mi.negative_impact_children === 0 ? "text-[--cs-success]" : "text-[--cs-risk]")}>{mi.negative_impact_children}</p>
                <p className="text-[10px] text-muted-foreground">Negative</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Voice Alerts
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

        {/* ── Cara Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Voice Intelligence
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
