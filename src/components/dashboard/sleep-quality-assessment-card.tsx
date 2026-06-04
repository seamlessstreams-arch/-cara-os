"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SLEEP QUALITY ASSESSMENT INTELLIGENCE CARD
// Dashboard card powered by the Night Monitoring Engine.
// CHR 2015 Reg 12, Reg 25, Reg 34.
// SCCIF: Helped & Protected — "Children's health and wellbeing needs are met."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BedDouble, ChevronRight, AlertTriangle, Brain,
  Users, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNightMonitoring } from "@/hooks/use-night-monitoring";

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

const PATTERN_BADGES: Record<string, string> = {
  settled:   "text-green-700 bg-green-50 border-green-200",
  variable:  "text-amber-700 bg-amber-50 border-amber-200",
  disturbed: "text-red-700 bg-red-50 border-red-200",
};

// ── Component ───────────────────────────────────────────────────────────────

export function SleepQualityAssessmentCard() {
  const { data, isLoading } = useNightMonitoring();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-brand" />
            Sleep Quality
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
            <BedDouble className="h-4 w-4 text-brand" />
            Sleep Quality
          </CardTitle>
          <Link href="/night-checks" className="text-xs text-brand hover:underline flex items-center gap-1">
            Night Monitoring <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.all_children_checked_rate === 100 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.all_children_checked_rate === 100 ? "text-green-600" : "text-amber-600",
            )}>
              {o.all_children_checked_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Checks</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.concern_count_7d === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.concern_count_7d === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.concern_count_7d}
            </p>
            <p className="text-[10px] text-muted-foreground">Concerns (7d)</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_rounds_7d}
            </p>
            <p className="text-[10px] text-muted-foreground">Rounds (7d)</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.building_secure_rate === 100 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.building_secure_rate === 100 ? "text-green-600" : "text-amber-600",
            )}>
              {o.building_secure_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Secure</p>
          </div>
        </div>

        {/* ── Child sleep profiles ────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Sleep Profiles
            </p>
            {intel.child_profiles.map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    <Badge variant="outline" className={cn("text-[10px]", PATTERN_BADGES[child.sleep_pattern] ?? PATTERN_BADGES.variable)}>
                      {child.sleep_pattern}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-indigo-400 rounded-full"
                      style={{ width: `${child.asleep_rate}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-16 text-right">
                    {child.asleep_rate}% asleep
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${child.awake_rate}%` }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums text-muted-foreground w-16 text-right">
                    {child.awake_rate}% awake
                  </span>
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
              Sleep Alerts
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

        {/* ── ARIA Intelligence ──────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Sleep Intelligence
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
