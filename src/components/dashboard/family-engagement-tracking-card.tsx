"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FAMILY ENGAGEMENT TRACKING CARD
// Dashboard card powered by the Contact Engagement Intelligence Engine.
// CHR 2015 Reg 8/9. SCCIF: Overall Experiences — Contact & relationships.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake, ChevronRight, AlertTriangle, Brain,
  Loader2,
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

export function FamilyEngagementTrackingCard() {
  const { data, isLoading } = useContactEngagement();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Family Engagement Tracking
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
  const mi = intel.mood_impact;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Family Engagement Tracking
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
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.total_sessions_30d}</p>
            <p className="text-[10px] text-muted-foreground">Sessions/30d</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{c.active_plans}</p>
            <p className="text-[10px] text-muted-foreground">Plans</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", c.plans_overdue_review === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", c.plans_overdue_review === 0 ? "text-green-600" : "text-amber-600")}>{c.plans_overdue_review}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{ft.avg_duration_minutes}m</p>
            <p className="text-[10px] text-muted-foreground">Avg Length</p>
          </div>
        </div>

        {/* ── Mood impact ─────────────────────────────────────────────── */}

        {mi.children_with_data > 0 && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-semibold">Mood Impact of Contact</p>
            <div className="flex items-center gap-3 text-xs">
              <Badge className="text-[10px] bg-green-100 text-green-700">{mi.positive_impact_children} positive</Badge>
              <Badge className="text-[10px] bg-blue-100 text-blue-700">{mi.neutral_impact_children} neutral</Badge>
              {mi.negative_impact_children > 0 && (
                <Badge className="text-[10px] bg-red-100 text-red-700">{mi.negative_impact_children} negative</Badge>
              )}
            </div>
          </div>
        )}

        {/* ── Supervision levels ──────────────────────────────────────── */}

        {(ft.supervision_breakdown?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1">
            {(ft.supervision_breakdown ?? []).map((sb) => (
              <Badge key={sb.level} variant="outline" className="text-[10px] capitalize">
                {sb.level.replace(/_/g, " ")} ({sb.count})
              </Badge>
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

        {/* ── ARIA Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Engagement Intelligence
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
