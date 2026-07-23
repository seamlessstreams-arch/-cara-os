"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — CONTACT & ENGAGEMENT INTELLIGENCE CARD
// Dashboard card for contact compliance, family time, child profiles,
// mood impact, and Cara contact intelligence.
// Powered by the Contact Engagement Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users, Brain, AlertTriangle, Loader2,
  Heart, Calendar, Smile, Frown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useContactEngagement } from "@/hooks/use-contact-engagement";

// ── Colour maps ────────────────────────────────────────────────────────────

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

export function ContactIntelligenceCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-brand" />
            Contact & Engagement
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
  const mood = intel.mood_impact;

  // Derived rates from real engine fields (no engine produces these directly).
  const planRate = c.total_children > 0 ? Math.round((c.active_plans / c.total_children) * 100) : 0;
  const moodImprovementRate = mood.children_with_data > 0
    ? Math.round((mood.positive_impact_children / mood.children_with_data) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-brand" />
          Contact & Engagement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg p-2" style={{ background: planRate >= 80 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", planRate >= 80 ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {planRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Plan Rate</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: meets(c.overall_completion_rate, 80) ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", meets(c.overall_completion_rate, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(c.overall_completion_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className="text-center rounded-lg p-2 bg-[var(--cs-surface-2)]">
            <p className="text-lg font-bold tabular-nums text-[var(--cs-navy)]">
              {c.total_sessions_90d}
            </p>
            <p className="text-[10px] text-muted-foreground">Sessions 90d</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: meets(ft.safe_sessions_pct, 80) ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", meets(ft.safe_sessions_pct, 80) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(ft.safe_sessions_pct)}
            </p>
            <p className="text-[10px] text-muted-foreground">Safe</p>
          </div>
        </div>

        {/* ── Family time stats ────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3" />
            Family Time (30 days)
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border p-2">
              <p className="text-sm font-bold tabular-nums text-[var(--cs-navy)]">{ft.total_sessions_30d}</p>
              <p className="text-[10px] text-muted-foreground">Sessions</p>
            </div>
            <div className="rounded-lg border p-2">
              <p className="text-sm font-bold tabular-nums text-[var(--cs-navy)]">
                {ft.family_contact_sessions}/{ft.sibling_contact_sessions}
              </p>
              <p className="text-[10px] text-muted-foreground">Family / Sibling</p>
            </div>
            <div className="rounded-lg border p-2">
              <p className={cn("text-sm font-bold tabular-nums", ft.concern_sessions > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
                {ft.concern_sessions}
              </p>
              <p className="text-[10px] text-muted-foreground">With Concerns</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-2.5 mt-2">
            <div className="flex items-center gap-2">
              <Smile className={cn("h-4 w-4", meets(ft.safe_sessions_pct, 75) ? "text-green-500" : "text-amber-500")} />
              <div>
                <p className="text-xs font-medium">Session Safety</p>
                <p className="text-[10px] text-muted-foreground">
                  {formatRate(ft.safe_sessions_pct)} safe · avg {ft.avg_duration_minutes ?? "—"} min
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Child contact profiles ──────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Child Contact Profiles
            </p>
            {intel.child_profiles.map((child) => (
              <div key={child.child_id} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{child.child_name}</span>
                  <Badge className={cn("text-[10px]", child.has_active_plan ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-gray-100 text-gray-700")}>
                    {child.has_active_plan ? "Plan active" : "No plan"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{child.sessions_30d} sessions</span>
                  {child.predominant_presentation && (
                    <Badge className="text-[10px] bg-[--cs-info-bg] text-[--cs-info]">
                      {child.predominant_presentation}
                    </Badge>
                  )}
                  {child.concern_sessions_90d > 0 && (
                    <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                      {child.concern_sessions_90d} concern{child.concern_sessions_90d !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Mood impact ──────────────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            {moodImprovementRate >= 50 ? (
              <Smile className="h-4 w-4 text-green-500" />
            ) : (
              <Frown className="h-4 w-4 text-amber-500" />
            )}
            <div>
              <p className="text-xs font-medium">Mood Impact</p>
              <p className="text-[10px] text-muted-foreground">
                Non-contact days: {mood.avg_mood_non_contact_days?.toFixed(1) ?? "—"} · Contact days: {mood.avg_mood_contact_days?.toFixed(1) ?? "—"}
              </p>
            </div>
          </div>
          <Badge className={cn("text-[10px]", moodImprovementRate >= 50 ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-warning-bg] text-[--cs-warning]")}>
            {moodImprovementRate}% improved
          </Badge>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Contact Alerts
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

        {/* ── Cara insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Contact Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
