"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INDEPENDENCE PREPARATION INTELLIGENCE CARD
// Dashboard widget for practical life skills assessment and readiness tracking.
// Shows independence score, skills summary, pathway plan compliance, and alerts.
// Powered by the Leaving Care Intelligence Engine — live data (Reg 5/6/7).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Rocket, ChevronRight, AlertTriangle, Brain,
  Loader2, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeavingCareIntelligence } from "@/hooks/use-leaving-care-intelligence";

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

// ── Component ────────────────────────────────────────────────────────────────

export function IndependencePreparationCard() {
  const { data, isLoading } = useLeavingCareIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-brand" />
            Independence Preparation
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
  const belowThresholdCount = intel.skills_summary.reduce(
    (sum, s) => sum + s.children_below_threshold, 0
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Rocket className="h-4 w-4 text-brand" />
            Independence Preparation
          </CardTitle>
          <Link href="/pathway-plan-16plus" className="text-xs text-brand hover:underline flex items-center gap-1">
            Leaving Care <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.independent_living_score >= 70 ? "bg-green-50" : o.independent_living_score >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.independent_living_score >= 70 ? "text-green-600" : o.independent_living_score >= 50 ? "text-amber-600" : "text-red-600")}>
              {o.independent_living_score}%
            </p>
            <p className="text-[10px] text-muted-foreground">Independence</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", belowThresholdCount === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", belowThresholdCount === 0 ? "text-green-600" : "text-amber-600")}>
              {belowThresholdCount}
            </p>
            <p className="text-[10px] text-muted-foreground">Below Threshold</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.pathway_plan_rate >= 90 ? "bg-green-50" : o.pathway_plan_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.pathway_plan_rate >= 90 ? "text-green-600" : o.pathway_plan_rate >= 70 ? "text-amber-600" : "text-red-600")}>
              {o.pathway_plan_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Pathway Plan</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.accommodation_secured_rate >= 80 ? "bg-green-50" : o.accommodation_secured_rate >= 60 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.accommodation_secured_rate >= 80 ? "text-green-600" : o.accommodation_secured_rate >= 60 ? "text-amber-600" : "text-red-600")}>
              {o.accommodation_secured_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Accommodation</p>
          </div>
        </div>

        {/* ── Skills summary bars ──────────────────────────────────────── */}

        {intel.skills_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Skills Assessment
            </p>
            {intel.skills_summary.map((skill, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate">{skill.skill}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      skill.average_score >= 70 ? "bg-green-400" : skill.average_score >= 50 ? "bg-amber-400" : "bg-red-400",
                    )}
                    style={{ width: `${skill.average_score}%` }}
                  />
                </div>
                <span className={cn(
                  "w-8 text-right tabular-nums font-medium",
                  skill.average_score >= 70 ? "text-green-600" : skill.average_score >= 50 ? "text-amber-600" : "text-red-600",
                )}>
                  {skill.average_score}%
                </span>
                {skill.children_below_threshold > 0 && (
                  <Badge className="text-[9px] bg-red-50 text-red-700 border-red-200">
                    {skill.children_below_threshold} below
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Independence Alerts
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

        {/* ── ARIA Independence Intelligence ───────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Independence Intelligence
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
