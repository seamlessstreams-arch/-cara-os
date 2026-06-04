"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EMERGENCY PLANNING INTELLIGENCE CARD
// Dashboard card powered by the Emergency Intelligence Engine.
// Reg 22 (arrangements), Reg 25 (premises), Reg 40 (notifications).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame, ChevronRight, AlertTriangle, Brain,
  Timer, FileCheck, ShieldAlert, Loader2, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEmergencyIntelligence } from "@/hooks/use-emergency-intelligence";

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

const STATUS_COLOURS: Record<string, string> = {
  current: "bg-green-100 text-green-700",
  due: "bg-amber-100 text-amber-700",
  overdue: "bg-red-100 text-red-700",
};

const OUTCOME_COLOURS: Record<string, string> = {
  satisfactory: "bg-green-100 text-green-700",
  needs_improvement: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
};

// ── Component ───────────────────────────────────────────────────────────────

export function EmergencyCard() {
  const { data, isLoading } = useEmergencyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand" />
            Emergency Planning
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
  const pc = intel.plan_coverage;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand" />
            Emergency Planning
          </CardTitle>
          <Link href="/emergency-planning" className="text-xs text-brand hover:underline flex items-center gap-1">
            Plans <ChevronRight className="h-3 w-3" />
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
            <p className="text-[10px] text-muted-foreground">Drills</p>
          </div>
          <div className="text-center rounded-lg bg-indigo-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-indigo-600">
              {o.avg_response_time_minutes.toFixed(1)}m
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Time</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.protocol_followed_rate >= 95 ? "bg-green-50" : o.protocol_followed_rate >= 80 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.protocol_followed_rate >= 95 ? "text-green-600" : o.protocol_followed_rate >= 80 ? "text-amber-600" : "text-red-600",
            )}>
              {o.protocol_followed_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Protocol</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.expired_plans === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.expired_plans === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.current_plans}
            </p>
            <p className="text-[10px] text-muted-foreground">Active Plans</p>
          </div>
        </div>

        {/* ── Drill types ─────────────────────────────────────────────── */}

        {intel.drill_types.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              Drill Types
            </p>
            {intel.drill_types.slice(0, 7).map((d) => (
              <div key={d.scenario_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{d.type_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{d.drill_count}</Badge>
                  <Badge className={cn("text-[10px]", STATUS_COLOURS[d.status] ?? "bg-gray-100 text-gray-600")}>
                    {d.status === "current" ? "Current" : d.status === "due" ? "Due" : "Overdue"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Recent drills ───────────────────────────────────────────── */}

        {intel.recent_drills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Recent Drills
            </p>
            {intel.recent_drills.slice(0, 3).map((d) => (
              <div key={d.drill_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-muted-foreground">{d.date}</span>
                  <span className="font-medium truncate">{d.type_label}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{d.response_time_minutes}m</Badge>
                  <Badge className={cn("text-[10px]", OUTCOME_COLOURS[d.outcome] ?? "bg-gray-100 text-gray-600")}>
                    {d.outcome === "satisfactory" ? "OK" : d.outcome === "needs_improvement" ? "Improve" : "Failed"}
                  </Badge>
                  {d.issues_count > 0 && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700">{d.issues_count}</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Plan coverage ───────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-green-500" />
            Plan Coverage
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pc.plan_types_covered >= pc.plan_types_required ? "bg-green-500"
                    : pc.plan_types_covered >= 3 ? "bg-amber-500"
                    : "bg-red-500",
                )}
                style={{ width: `${Math.round((pc.plan_types_covered / pc.plan_types_required) * 100)}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-bold tabular-nums",
              pc.plan_types_covered >= pc.plan_types_required ? "text-green-600"
                : pc.plan_types_covered >= 3 ? "text-amber-600"
                : "text-red-600",
            )}>
              {pc.plan_types_covered}/{pc.plan_types_required}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-green-600 tabular-nums">{pc.plans_current}</p>
              <p className="text-[10px] text-muted-foreground">Current</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", pc.plans_review_due > 0 ? "text-amber-600" : "text-slate-700")}>
                {pc.plans_review_due}
              </p>
              <p className="text-[10px] text-muted-foreground">Review Due</p>
            </div>
            <div>
              <p className="font-bold text-slate-700 tabular-nums">{pc.plans_draft}</p>
              <p className="text-[10px] text-muted-foreground">Draft</p>
            </div>
          </div>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded border p-2.5 text-xs">
            <CheckCircle2 className={cn("h-4 w-4 shrink-0", o.satisfactory_rate >= 90 ? "text-green-500" : "text-amber-500")} />
            <div>
              <p className="font-medium">{o.satisfactory_rate}% satisfactory</p>
              <p className="text-[10px] text-muted-foreground">drill outcomes</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded border p-2.5 text-xs">
            <Timer className="h-4 w-4 text-blue-500 shrink-0" />
            <div>
              <p className="font-medium">{o.drills_last_90_days} drills</p>
              <p className="text-[10px] text-muted-foreground">last 90 days</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Emergency Alerts
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

        {/* ── ARIA Emergency Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Emergency Intelligence
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
