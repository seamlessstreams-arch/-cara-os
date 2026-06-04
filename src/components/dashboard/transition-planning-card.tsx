"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRANSITION PLANNING INTELLIGENCE CARD
// Live data from useLeavingCareIntelligence() — overview, child readiness.
// CHR 2015 Reg 44. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightCircle, ChevronRight, AlertTriangle, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLeavingCareIntelligence } from "@/hooks/use-leaving-care-intelligence";

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

export function TransitionPlanningCard() {
  const { data, isLoading } = useLeavingCareIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-brand" />
            Transition Planning
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

  const { overview, child_readiness } = intel;
  const atRisk = child_readiness.filter((c) => c.readiness_rating === "at_risk").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-brand" />
            Transition Planning
          </CardTitle>
          <Link href="/pathway-plan-16plus" className="text-xs text-brand hover:underline flex items-center gap-1">
            Leaving Care <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{overview.total_eligible_children}</p>
            <p className="text-[10px] text-muted-foreground">Eligible</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.plans_overdue_review === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.plans_overdue_review === 0 ? "text-green-600" : "text-amber-600")}>{overview.plans_overdue_review}</p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.avg_independence_score >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.avg_independence_score >= 70 ? "text-green-600" : "text-amber-600")}>{overview.avg_independence_score}%</p>
            <p className="text-[10px] text-muted-foreground">Avg Score</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", atRisk === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", atRisk === 0 ? "text-green-600" : "text-red-600")}>{atRisk}</p>
            <p className="text-[10px] text-muted-foreground">At Risk</p>
          </div>
        </div>

        {/* ── Child readiness ─────────────────────────────────────────── */}

        {child_readiness.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Readiness Status</p>
            {child_readiness.slice(0, 3).map((c) => (
              <div key={c.child_id} className="flex items-center justify-between rounded border p-2.5 text-xs">
                <span className="font-medium">{c.child_name}</span>
                <Badge className={cn("text-[9px]", c.readiness_rating === "on_track" ? "bg-green-100 text-green-700" : c.readiness_rating === "at_risk" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700")}>
                  {c.readiness_rating.replace(/_/g, " ")}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Transition Alerts
            </p>
            {intel.alerts.slice(0, 2).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Transition Intelligence
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
