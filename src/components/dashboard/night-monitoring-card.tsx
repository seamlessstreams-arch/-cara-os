"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT MONITORING INTELLIGENCE CARD
// Dashboard widget for welfare check compliance, sleep patterns, security,
// night staffing, and ARIA night care intelligence.
// Powered by the Night Monitoring Engine — live data (Reg 12/25/34).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, ChevronRight, AlertTriangle, Brain,
  Shield, Users, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNightMonitoring } from "@/hooks/use-night-monitoring";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high: "border-red-200 bg-red-50 text-red-800",
  medium: "border-amber-200 bg-amber-50 text-amber-800",
  low: "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const PATTERN_STYLES: Record<string, string> = {
  settled: "text-green-600",
  variable: "text-amber-600",
  disrupted: "text-red-600",
};

// ── Component ────────────────────────────────────────────────────────────────

export function NightMonitoringCard() {
  const { data, isLoading } = useNightMonitoring();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Night Monitoring
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
            <Moon className="h-4 w-4 text-brand" />
            Night Monitoring
          </CardTitle>
          <Link href="/night-checks" className="text-xs text-brand hover:underline flex items-center gap-1">
            Welfare <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_rounds_7d}</p>
            <p className="text-[10px] text-muted-foreground">Rounds (7d)</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.all_children_checked_rate === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.all_children_checked_rate === 100 ? "text-green-600" : "text-amber-600")}>
              {o.all_children_checked_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Complete</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.building_secure_rate === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.building_secure_rate === 100 ? "text-green-600" : "text-amber-600")}>
              {o.building_secure_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Secure</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.concern_count_7d === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.concern_count_7d === 0 ? "text-green-600" : "text-red-600")}>
              {o.concern_count_7d}
            </p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
        </div>

        {/* ── Per-child sleep profiles ─────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Sleep Patterns
            </p>
            {intel.child_profiles.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    <span className={cn("text-[10px] font-medium", PATTERN_STYLES[child.sleep_pattern])}>
                      {child.sleep_pattern}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tabular-nums">{child.asleep_rate}%</span>
                    <span className="text-muted-foreground text-[10px]">asleep</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{child.checks_7d} checks</span>
                  {child.avg_settled_time && (
                    <span className="text-[10px]">Settles by {child.avg_settled_time}</span>
                  )}
                  {child.concern_count_7d > 0 && (
                    <Badge className="text-[9px] bg-red-100 text-red-700">
                      {child.concern_count_7d} concern
                    </Badge>
                  )}
                  {child.not_in_room_count_7d > 0 && (
                    <Badge className="text-[9px] bg-red-100 text-red-700">
                      not in room
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Security compliance ──────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Shield className={cn("h-4 w-4", intel.security.overall_compliance_rate === 100 ? "text-green-500" : "text-amber-500")} />
            <div>
              <p className="text-xs font-medium">Building Security</p>
              <p className="text-[10px] text-muted-foreground">
                {intel.staffing.unique_staff_7d} staff · {intel.staffing.total_nights_7d} nights · {o.avg_rounds_per_night}/night
              </p>
            </div>
          </div>
          {intel.security.overall_compliance_rate === 100 ? (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              100% secure
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              {intel.security.overall_compliance_rate}% compliance
            </Badge>
          )}
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Night Alerts
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

        {/* ── ARIA Night Intelligence ──────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Night Intelligence
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
