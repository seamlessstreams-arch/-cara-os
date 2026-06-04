"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S FEEDBACK INTELLIGENCE CARD
// Dashboard card for feedback, satisfaction, and response tracking.
// Powered by the Contact Engagement Intelligence Engine — live data.
// CHR 2015 Reg 7, Reg 10, Reg 45.
// SCCIF: Overall Experiences — "Children's views are actively sought."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareHeart, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContactEngagement } from "@/hooks/use-contact-engagement";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ChildrensFeedbackCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquareHeart className="h-4 w-4 text-brand" />
            Children&apos;s Feedback
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

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardHeader className="pb-3 bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquareHeart className="h-4 w-4 text-brand" />
            Children&apos;s Feedback
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Feedback <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", c.overall_completion_rate >= 80 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.overall_completion_rate >= 80 ? "text-green-600" : "text-amber-600")}>{c.overall_completion_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.completed_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions (30d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", c.plans_overdue_review === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.plans_overdue_review === 0 ? "text-green-600" : "text-amber-600")}>{c.plans_overdue_review}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* ── Mood impact ─────────────────────────────────────────────── */}

        {mi.children_with_data > 0 && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-brand" />
              <div>
                <p className="text-xs font-medium">Feedback Mood Impact</p>
                <p className="text-[10px] text-muted-foreground">
                  Contact days avg {mi.avg_mood_contact_days}/10 vs {mi.avg_mood_non_contact_days}/10
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mi.positive_impact_children > 0 && (
                <Badge className="text-[9px] bg-green-100 text-green-700">
                  {mi.positive_impact_children} positive
                </Badge>
              )}
              {mi.negative_impact_children > 0 && (
                <Badge className="text-[9px] bg-red-100 text-red-700">
                  {mi.negative_impact_children} negative
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* ── Child profiles ─────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Feedback by Child
            </p>
            {intel.child_profiles.slice(0, 4).map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  <span className="text-[10px] text-muted-foreground">{cp.sessions_30d} / 30d</span>
                </div>
                <div className="flex items-center gap-1">
                  {cp.concern_sessions_90d > 0 && (
                    <Badge className="text-[9px] bg-amber-100 text-amber-700">
                      {cp.concern_sessions_90d} concerns
                    </Badge>
                  )}
                  {cp.has_active_plan && (
                    <Badge className="text-[9px] bg-green-100 text-green-700">plan</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Feedback Alerts
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

        {/* ── ARIA Feedback Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Feedback Intelligence
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
