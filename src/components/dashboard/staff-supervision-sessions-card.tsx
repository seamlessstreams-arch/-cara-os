"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF SUPERVISION SESSIONS INTELLIGENCE CARD
// Dashboard widget for supervision session counts, staff wellbeing,
// pending actions, and Cara intelligence insights.
// Powered by the Supervision Intelligence Engine — live data (Reg 33/16).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardPen, ChevronRight, AlertTriangle, Brain,
  Users, Loader2, Heart, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { meets } from "@/lib/metrics/rate";
import { useSupervisionIntelligence } from "@/hooks/use-supervision-intelligence";

// ── Styling ──────────────────────────────────────────────────────────────────

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

const TREND_BADGE: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  improving: { label: "Improving", color: "text-green-700 bg-green-50 border-green-200", icon: <TrendingUp className="h-3 w-3" /> },
  stable: { label: "Stable", color: "text-gray-700 bg-gray-50 border-gray-200", icon: <Minus className="h-3 w-3" /> },
  declining: { label: "Declining", color: "text-red-700 bg-red-50 border-red-200", icon: <TrendingDown className="h-3 w-3" /> },
  insufficient_data: { label: "No Data", color: "text-gray-500 bg-gray-50 border-gray-200", icon: <Minus className="h-3 w-3" /> },
};

// ── Component ────────────────────────────────────────────────────────────────

export function StaffSupervisionSessionsCard() {
  const { data, isLoading } = useSupervisionIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardPen className="h-4 w-4 text-brand" />
            Supervision Sessions
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
  const totalActionsPending = intel.staff_profiles.reduce((sum, p) => sum + p.actions_pending, 0);
  const trend = TREND_BADGE[intel.wellbeing.trend] ?? TREND_BADGE.insufficient_data;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardPen className="h-4 w-4 text-brand" />
            Supervision Sessions
          </CardTitle>
          <Link href="/supervision" className="text-xs text-brand hover:underline flex items-center gap-1">
            Sessions <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.supervisions_completed_90d}</p>
            <p className="text-[10px] text-muted-foreground">Done (90d)</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_staff}</p>
            <p className="text-[10px] text-muted-foreground">Staff</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", meets(o.avg_wellbeing_score, 7) ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", meets(o.avg_wellbeing_score, 7) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {o.avg_wellbeing_score === null ? "—" : `${o.avg_wellbeing_score}/10`}
            </p>
            <p className="text-[10px] text-muted-foreground">Wellbeing</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", totalActionsPending > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", totalActionsPending > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>
              {totalActionsPending}
            </p>
            <p className="text-[10px] text-muted-foreground">Actions</p>
          </div>
        </div>

        {/* ── Staff profiles ───────────────────────────────────────────── */}

        {intel.staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Staff Sessions
            </p>
            <div className="space-y-1">
              {intel.staff_profiles.slice(0, 5).map((profile) => (
                <div key={profile.staff_id} className="flex items-center justify-between rounded border p-2 text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Users className="h-3 w-3 text-blue-500 shrink-0" />
                    <span className="font-medium">{profile.staff_name}</span>
                    <span className="text-muted-foreground truncate">{profile.supervisions_90d} sessions</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", meets(profile.avg_wellbeing, 7) ? "text-green-700 bg-green-50 border-green-200" : "text-amber-700 bg-amber-50 border-amber-200")}>
                      {profile.avg_wellbeing === null ? "—" : `${profile.avg_wellbeing}/10`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Wellbeing trend ──────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Heart className="h-3 w-3 text-pink-500" />
            Wellbeing Trend
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[10px] flex items-center gap-1", trend.color)}>
              {trend.icon}
              {trend.label}
            </Badge>
            {intel.wellbeing.staff_below_threshold > 0 && (
              <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                {intel.wellbeing.staff_below_threshold} below threshold
              </Badge>
            )}
          </div>
        </div>

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
