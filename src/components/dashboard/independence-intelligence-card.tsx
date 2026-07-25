"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — INDEPENDENCE & PATHWAY PLANNING INTELLIGENCE CARD
// Dashboard widget for leaving care readiness, pathway planning rates,
// independence scores, education/employment status, and Cara insights.
// Powered by the Leaving Care Intelligence Engine — live data (Reg 5/6/7).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Compass, ChevronRight, AlertTriangle, Brain,
  Loader2, Users, Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { LeavingCareIntelligenceResult } from "@/lib/engines/leaving-care-intelligence-engine";

// ── inlined from @/hooks/use-leaving-care-intelligence ──────────────────────

interface LeavingCareIntelligenceResponse {
  data: LeavingCareIntelligenceResult;
}

function useLeavingCareIntelligence() {
  return useQuery({
    queryKey: ["leaving-care-intelligence"],
    queryFn: () => api.get<LeavingCareIntelligenceResponse>("/leaving-care-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

// ── Styling ─────────────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export function IndependenceIntelligenceCard() {
  const { data, isLoading } = useLeavingCareIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Compass className="h-4 w-4 text-brand" />
            Independence & Pathway Planning
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
            <Compass className="h-4 w-4 text-brand" />
            Independence & Pathway Planning
          </CardTitle>
          <Link href="/pathway-plan-16plus" className="text-xs text-brand hover:underline flex items-center gap-1">
            Leaving Care <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_eligible}</p>
            <p className="text-[10px] text-muted-foreground">Eligible</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.pathway_plan_rate >= 90 ? "bg-green-50" : o.pathway_plan_rate >= 70 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.pathway_plan_rate >= 90 ? "text-[--cs-success]" : o.pathway_plan_rate >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {o.pathway_plan_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Pathway Plan</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.independent_living_score >= 70 ? "bg-green-50" : o.independent_living_score >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.independent_living_score >= 70 ? "text-[--cs-success]" : o.independent_living_score >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {o.independent_living_score}%
            </p>
            <p className="text-[10px] text-muted-foreground">Independence</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.education_employment_rate >= 80 ? "bg-green-50" : o.education_employment_rate >= 60 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.education_employment_rate >= 80 ? "text-[--cs-success]" : o.education_employment_rate >= 60 ? "text-[--cs-warning]" : "text-[--cs-risk]")}>
              {o.education_employment_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">EET</p>
          </div>
        </div>

        {/* ── Child readiness profiles ─────────────────────────────────── */}

        {intel.child_readiness.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              Child Readiness
            </p>
            {intel.child_readiness.slice(0, 5).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{child.child_name}</span>
                    <span className="text-[10px] text-muted-foreground">Age {child.age}</span>
                  </div>
                  <Badge className={cn(
                    "text-[10px]",
                    child.independence_score >= 70 ? "bg-[--cs-success-bg] text-[--cs-success]" :
                    child.independence_score >= 50 ? "bg-[--cs-warning-bg] text-[--cs-warning]" :
                    "bg-[--cs-risk-bg] text-[--cs-risk]",
                  )}>
                    {child.independence_score}% ready
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <span className="text-[10px] capitalize">{child.plan_status.replace(/_/g, " ")}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Skills summary ───────────────────────────────────────────── */}

        {intel.skills_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Skills Summary
            </p>
            {intel.skills_summary.slice(0, 5).map((skill, i) => {
              const assessed = skill.independent_count + skill.competent_count + skill.developing_count + skill.not_started_count;
              const competentPct = assessed > 0
                ? Math.round(((skill.independent_count + skill.competent_count) / assessed) * 100)
                : 0;
              const notCompetent = skill.developing_count + skill.not_started_count;
              return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-28 truncate">{skill.skill_label}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      competentPct >= 70 ? "bg-green-400" : competentPct >= 50 ? "bg-amber-400" : "bg-red-400",
                    )}
                    style={{ width: `${competentPct}%` }}
                  />
                </div>
                <span className={cn(
                  "w-8 text-right tabular-nums font-medium",
                  competentPct >= 70 ? "text-[--cs-success]" : competentPct >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]",
                )}>
                  {competentPct}%
                </span>
                {notCompetent > 0 && (
                  <Badge className="text-[9px] bg-red-50 text-red-700 border-red-200">
                    {notCompetent} below
                  </Badge>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Leaving Care Alerts
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

        {/* ── Cara Leaving Care Intelligence ───────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Leaving Care Intelligence
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
