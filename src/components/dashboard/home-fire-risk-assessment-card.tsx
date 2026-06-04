"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME FIRE RISK ASSESSMENT INTELLIGENCE CARD
// Dashboard card powered by the Emergency Intelligence Engine.
// CHR 2015 Reg 25, Reg 36; Regulatory Reform (Fire Safety) Order 2005.
// SCCIF: Helped & Protected — "The home has robust fire safety measures."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Flame, ChevronRight, AlertTriangle, Brain,
  FileCheck, Timer, Loader2,
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

// ── Component ───────────────────────────────────────────────────────────────

export function HomeFireRiskAssessmentCard() {
  const { data, isLoading } = useEmergencyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand" />
            Fire Risk Assessment
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

  const pc = intel.plan_coverage;
  const fireDrills = intel.drill_types.filter(
    (dt) => dt.scenario_type.toLowerCase().includes("fire")
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Flame className="h-4 w-4 text-brand" />
            Fire Risk Assessment
          </CardTitle>
          <Link href="/emergency-planning" className="text-xs text-brand hover:underline flex items-center gap-1">
            Emergency <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            pc.coverage_rate >= 90 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              pc.coverage_rate >= 90 ? "text-green-600" : "text-amber-600",
            )}>
              {pc.coverage_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Plan Cover</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              {pc.plans_current}
            </p>
            <p className="text-[10px] text-muted-foreground">Current</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            pc.plans_review_due > 0 ? "bg-amber-50" : "bg-green-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              pc.plans_review_due > 0 ? "text-amber-600" : "text-green-600",
            )}>
              {pc.plans_review_due}
            </p>
            <p className="text-[10px] text-muted-foreground">Review Due</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {pc.plans_draft}
            </p>
            <p className="text-[10px] text-muted-foreground">Draft</p>
          </div>
        </div>

        {/* ── Plan coverage details ───────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1">
            <FileCheck className="h-3 w-3 text-blue-500" />
            Plan Coverage
          </p>
          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{pc.plan_types_required}</p>
              <p className="text-[10px] text-muted-foreground">Types Required</p>
            </div>
            <div>
              <p className={cn("font-bold tabular-nums", pc.plan_types_covered >= pc.plan_types_required ? "text-green-600" : "text-amber-600")}>{pc.plan_types_covered}</p>
              <p className="text-[10px] text-muted-foreground">Types Covered</p>
            </div>
          </div>
        </div>

        {/* ── Fire drill types ────────────────────────────────────────── */}

        {fireDrills.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Timer className="h-3 w-3" />
              Fire Drill Status
            </p>
            {fireDrills.map((dt) => (
              <div key={dt.scenario_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{dt.type_label}</span>
                  <span className="text-muted-foreground tabular-nums">{dt.drill_count} drills</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {dt.is_overdue ? (
                    <Badge className="text-[10px] bg-red-100 text-red-700">Overdue</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-green-700 bg-green-50 border-green-200">On track</Badge>
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
              Fire Safety Alerts
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
              ARIA Fire Safety Intelligence
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
