"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — TRANSITION PLANNING READINESS CARD
// Live data from useLeavingCareIntelligence() — overview, skills, readiness.
// CHR 2015 Reg 44. SCCIF: Overall Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Target, ChevronRight, AlertTriangle, Brain, Loader2,
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

export function TransitionPlanningReadinessCard() {
  const { data, isLoading } = useLeavingCareIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-brand" />
            Transition Readiness
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

  const { overview, child_readiness, skills_summary } = intel;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4 text-brand" />
            Transition Readiness
          </CardTitle>
          <Link href="/pathway-plan-16plus" className="text-xs text-brand hover:underline flex items-center gap-1">
            Leaving Care <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", overview.avg_skills_competency_rate >= 70 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.avg_skills_competency_rate >= 70 ? "text-green-600" : "text-amber-600")}>{overview.avg_skills_competency_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Skills</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", overview.accommodation_secured_count > 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", overview.accommodation_secured_count > 0 ? "text-green-600" : "text-amber-600")}>{overview.accommodation_secured_count}</p>
            <p className="text-[10px] text-muted-foreground">Housing</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{overview.eet_confirmed_count}</p>
            <p className="text-[10px] text-muted-foreground">EET</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{overview.support_network_complete}</p>
            <p className="text-[10px] text-muted-foreground">Network</p>
          </div>
        </div>

        {/* ── Skills breakdown ────────────────────────────────────────── */}

        {skills_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Skills Competency</p>
            <div className="flex flex-wrap gap-1">
              {skills_summary.map((s) => {
                const total = s.independent_count + s.competent_count + s.developing_count + s.not_started_count;
                const pct = total > 0 ? Math.round(((s.independent_count + s.competent_count) / total) * 100) : 0;
                return (
                  <Badge key={s.skill_area} variant="outline" className={cn("text-[10px]", pct >= 70 ? "text-green-700 border-green-200" : pct >= 50 ? "text-amber-700 border-amber-200" : "text-red-700 border-red-200")}>
                    {s.skill_label} {pct}%
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Readiness Alerts
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
              ARIA Readiness Intelligence
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
