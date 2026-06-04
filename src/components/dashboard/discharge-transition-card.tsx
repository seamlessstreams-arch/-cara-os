"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DISCHARGE & TRANSITION INTELLIGENCE CARD
// Dashboard widget for discharge planning and transition readiness.
// Shows accommodation, EET, pathway planning, child readiness, and ARIA insights.
// Powered by the Leaving Care Intelligence Engine — live data (Reg 36/37).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRightCircle, ChevronRight, AlertTriangle, Brain,
  Loader2, Users,
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

export function DischargeTransitionCard() {
  const { data, isLoading } = useLeavingCareIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-brand" />
            Discharge & Transition
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
  const sortedByReadiness = [...intel.child_readiness].sort(
    (a, b) => a.readiness_score - b.readiness_score
  );

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowRightCircle className="h-4 w-4 text-brand" />
            Discharge & Transition
          </CardTitle>
          <Link href="/pathway-plan-16plus" className="text-xs text-brand hover:underline flex items-center gap-1">
            Leaving Care <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.accommodation_secured_rate >= 80 ? "bg-green-50" : o.accommodation_secured_rate >= 60 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.accommodation_secured_rate >= 80 ? "text-green-600" : o.accommodation_secured_rate >= 60 ? "text-amber-600" : "text-red-600")}>
              {o.accommodation_secured_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Accommodation</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.education_employment_rate >= 80 ? "bg-green-50" : o.education_employment_rate >= 60 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.education_employment_rate >= 80 ? "text-green-600" : o.education_employment_rate >= 60 ? "text-amber-600" : "text-red-600")}>
              {o.education_employment_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">EET</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.pathway_plan_rate >= 90 ? "bg-green-50" : o.pathway_plan_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.pathway_plan_rate >= 90 ? "text-green-600" : o.pathway_plan_rate >= 70 ? "text-amber-600" : "text-red-600")}>
              {o.pathway_plan_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Pathway Plan</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_eligible}</p>
            <p className="text-[10px] text-muted-foreground">Eligible</p>
          </div>
        </div>

        {/* ── Child readiness (sorted lowest first) ────────────────────── */}

        {sortedByReadiness.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Transition Readiness
            </p>
            {sortedByReadiness.slice(0, 5).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    <span className="text-[10px] text-muted-foreground">Age {child.age}</span>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    child.readiness_score >= 70 ? "bg-green-100 text-green-700" :
                    child.readiness_score >= 50 ? "bg-amber-100 text-amber-700" :
                    "bg-red-100 text-red-700",
                  )}>
                    {child.readiness_score}% ready
                  </Badge>
                </div>
                {(child.key_gaps?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {(child.key_gaps ?? []).slice(0, 4).map((gap, i) => (
                      <Badge key={i} className="text-[9px] bg-red-50 text-red-700 border-red-200">
                        {gap}
                      </Badge>
                    ))}
                  </div>
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
              Transition Alerts
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

        {/* ── ARIA Transition Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Transition Intelligence
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
