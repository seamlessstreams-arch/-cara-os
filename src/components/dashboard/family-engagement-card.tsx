"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — FAMILY ENGAGEMENT INTELLIGENCE CARD
// Dashboard card powered by the Contact Engagement Intelligence Engine.
// CHR 2015 Reg 8/9. SCCIF: Overall Experiences — Contact & relationships.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart, ChevronRight, AlertTriangle, Brain,
  Users, Loader2,
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

export function FamilyEngagementCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Family Engagement
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

  const ft = intel.family_time;
  const c = intel.compliance;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Heart className="h-4 w-4 text-brand" />
            Family Engagement
          </CardTitle>
          <Link href="/contact-directory" className="text-xs text-brand hover:underline flex items-center gap-1">
            Contact <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.family_contact_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Family</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.sibling_contact_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Sibling</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(c.overall_completion_rate, 90) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(c.overall_completion_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>{formatRate(c.overall_completion_rate)}</p>
            <p className="text-[10px] text-muted-foreground">Completion</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", ft.concern_sessions === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", ft.concern_sessions === 0 ? "text-[--cs-success]" : "text-[--cs-warning]")}>{ft.concern_sessions}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
        </div>

        {/* ── Presentation breakdown ──────────────────────────────────── */}

        {(ft.presentation_breakdown?.length ?? 0) > 0 && (
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold">Child Presentation</p>
            <div className="flex flex-wrap gap-1">
              {(ft.presentation_breakdown ?? []).map((p) => (
                <Badge key={p.presentation} variant="outline" className="text-[10px] capitalize">
                  {p.presentation.replace(/_/g, " ")} ({p.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Child profiles ──────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              By Young Person
            </p>
            {intel.child_profiles.map((cp) => (
              <div key={cp.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cp.child_name}</span>
                  <span className="text-[10px] text-muted-foreground">{cp.sessions_30d} sessions/30d</span>
                </div>
                <div className="flex items-center gap-1">
                  {!cp.has_active_plan && <Badge className="text-[9px] bg-[--cs-risk-bg] text-[--cs-risk]">no plan</Badge>}
                  {!cp.plan_review_current && cp.has_active_plan && <Badge className="text-[9px] bg-[--cs-warning-bg] text-[--cs-warning]">review due</Badge>}
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
              Engagement Alerts
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
              Cara Engagement Intelligence
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
