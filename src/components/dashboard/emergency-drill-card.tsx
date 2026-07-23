"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EMERGENCY DRILL INTELLIGENCE CARD
// Dashboard card powered by the Emergency Intelligence Engine.
// CHR 2015 Reg 25, Reg 36, Regulatory Reform (Fire Safety) Order 2005.
// SCCIF: Helped & Protected — "Children know what to do in an emergency."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Siren, ChevronRight, AlertTriangle, Brain,
  Clock, Timer, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useEmergencyIntelligence } from "@/hooks/use-emergency-intelligence";

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

const OUTCOME_STYLES: Record<string, string> = {
  satisfactory:     "text-green-700 bg-green-50 border-green-200",
  unsatisfactory:   "text-red-700 bg-red-50 border-red-200",
  partial:          "text-amber-700 bg-amber-50 border-amber-200",
};

// ── Component ───────────────────────────────────────────────────────────────

export function EmergencyDrillCard() {
  const { data, isLoading } = useEmergencyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Siren className="h-4 w-4 text-brand" />
            Emergency Drills
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
            <Siren className="h-4 w-4 text-brand" />
            Emergency Drills
          </CardTitle>
          <Link href="/emergency-planning" className="text-xs text-brand hover:underline flex items-center gap-1">
            Emergency <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_drills}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Drills</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.avg_response_time_minutes === null ? "—" : `${o.avg_response_time_minutes}m`}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Response</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.protocol_followed_rate, 90) ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.protocol_followed_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {formatRate(o.protocol_followed_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Protocol</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.satisfactory_rate, 90) ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.satisfactory_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {formatRate(o.satisfactory_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Satisfactory</p>
          </div>
        </div>

        {/* ── Recent drills ───────────────────────────────────────────── */}

        {intel.recent_drills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Recent Drills
            </p>
            {intel.recent_drills.map((d) => (
              <div key={d.drill_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Timer className="h-3 w-3 text-orange-500 shrink-0" />
                  <span className="font-medium truncate">{d.type_label}</span>
                  <span className="text-muted-foreground truncate">{d.date} · {d.response_time_minutes}m</span>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", OUTCOME_STYLES[d.outcome] ?? OUTCOME_STYLES.partial)}>
                  {d.outcome}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Drill type status ───────────────────────────────────────── */}

        {intel.drill_types.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Siren className="h-3 w-3" />
              Drill Type Status
            </p>
            {intel.drill_types.map((dt) => (
              <div key={dt.scenario_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{dt.type_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{dt.drill_count}</Badge>
                  {dt.status === "overdue" && (
                    <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">Overdue</Badge>
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
              Drill Alerts
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

        {/* ── Cara Intelligence ──────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Drill Intelligence
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
