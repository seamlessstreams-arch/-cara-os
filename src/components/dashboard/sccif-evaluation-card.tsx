"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — SCCIF SELF-EVALUATION INTELLIGENCE CARD
// Dashboard card powered by the SCCIF Self-Evaluation Intelligence Engine.
// SCCIF judgment areas, evidence coverage, action tracking,
// inspection readiness score, alerts, and Cara inspection intelligence.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { formatRate, meets } from "@/lib/metrics/rate";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList, ChevronRight, AlertTriangle,
  Brain, Target, Star, TrendingUp, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { SCCIFIntelligenceResult } from "@/lib/engines/sccif-intelligence-engine";

interface SCCIFIntelligenceResponse {
  data: SCCIFIntelligenceResult;
}

function useSCCIFIntelligence() {
  return useQuery({
    queryKey: ["sccif-intelligence"],
    queryFn: () => api.get<SCCIFIntelligenceResponse>("/sccif-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

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

const GRADE_STYLES: Record<string, string> = {
  outstanding:          "bg-[--cs-success-bg] text-[--cs-success]",
  good:                 "bg-[--cs-info-bg] text-[--cs-info]",
  requires_improvement: "bg-[--cs-warning-bg] text-[--cs-warning]",
  inadequate:           "bg-[--cs-risk-bg] text-[--cs-risk]",
};

const GRADE_LABELS: Record<string, string> = {
  outstanding:          "Outstanding",
  good:                 "Good",
  requires_improvement: "Requires Improvement",
  inadequate:           "Inadequate",
};

// ── Component ───────────────────────────────────────────────────────────────

export function SCCIFEvaluationCard() {
  const { data, isLoading } = useSCCIFIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-brand" />
            SCCIF Self-Evaluation
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
            <ClipboardList className="h-4 w-4 text-brand" />
            SCCIF Self-Evaluation
          </CardTitle>
          <Link href="/inspection-readiness" className="text-xs text-brand hover:underline flex items-center gap-1">
            SCCIF <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.status === "final" ? "bg-green-50" : o.status === "in_review" ? "bg-blue-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-sm font-bold capitalize",
              o.status === "final" ? "text-[--cs-success]" : o.status === "in_review" ? "text-blue-600" : "text-[--cs-warning]",
            )}>
              {o.status.replace("_", " ")}
            </p>
            <p className="text-[10px] text-muted-foreground">Status</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_evidence}</p>
            <p className="text-[10px] text-muted-foreground">Evidence</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.coverage_rate, 90) ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn("text-lg font-bold tabular-nums", meets(o.coverage_rate, 90) ? "text-[--cs-success]" : "text-[--cs-warning]")}>
              {formatRate(o.coverage_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Coverage</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.inspection_readiness_score, 75) ? "bg-green-50" : meets(o.inspection_readiness_score, 50) ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.inspection_readiness_score, 75) ? "text-[--cs-success]"
                : meets(o.inspection_readiness_score, 50) ? "text-[--cs-warning]"
                : "text-[--cs-risk]",
            )}>
              {o.inspection_readiness_score}
            </p>
            <p className="text-[10px] text-muted-foreground">Readiness</p>
          </div>
        </div>

        {/* ── Judgment summaries ──────────────────────────────────────── */}

        {intel.judgment_summaries.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              SCCIF Judgments
            </p>
            {intel.judgment_summaries.map((j) => {
              const total = j.strengths_count + j.developments_count;
              return (
                <div key={j.area} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium">{j.area_label}</span>
                    <Badge className={cn(
                      "text-[10px]",
                      GRADE_STYLES[j.self_grade] ?? "bg-gray-100 text-gray-700",
                    )}>
                      <Star className="h-2.5 w-2.5 mr-0.5" />
                      {GRADE_LABELS[j.self_grade] ?? j.self_grade}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    {total > 0 && (
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden flex">
                        <div className="h-full bg-green-400" style={{ width: `${(j.strengths_count / total) * 100}%` }} />
                        <div className="h-full bg-red-300" style={{ width: `${(j.developments_count / total) * 100}%` }} />
                      </div>
                    )}
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {j.strengths_count}
                      <TrendingUp className="h-2.5 w-2.5 inline mx-0.5 text-green-500" />
                      {j.developments_count}
                      <AlertTriangle className="h-2.5 w-2.5 inline mx-0.5 text-amber-500" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Action tracker ──────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" />
              Actions
            </p>
            <Badge className={cn(
              "text-[10px]",
              intel.action_tracker.overdue === 0 ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-risk-bg] text-[--cs-risk]",
            )}>
              {intel.action_tracker.overdue} overdue
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${formatRate(intel.action_tracker.completion_rate)}` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
              {formatRate(intel.action_tracker.completion_rate)}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <p className="font-bold text-slate-700 tabular-nums">{intel.action_tracker.total_actions}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            <div>
              <p className="font-bold text-green-600 tabular-nums">{intel.action_tracker.completed}</p>
              <p className="text-[10px] text-muted-foreground">Completed</p>
            </div>
            <div>
              <p className="font-bold text-blue-600 tabular-nums">{intel.action_tracker.in_progress}</p>
              <p className="text-[10px] text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>

        {/* ── Evidence gaps ────────────────────────────────────────────── */}

        {intel.evidence_gaps.length > 0 && (
          <div className="rounded-lg border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-3">
            <p className="text-xs font-medium text-[--cs-warning] mb-1">Evidence Gaps</p>
            <div className="flex flex-wrap gap-1">
              {intel.evidence_gaps.map((gap) => (
                <Badge key={gap} variant="outline" className="text-[10px] border-amber-300 text-amber-700">
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Inspection readiness bar ────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <span className="text-xs font-semibold">Inspection Readiness</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  meets(o.inspection_readiness_score, 75) ? "bg-green-500"
                    : meets(o.inspection_readiness_score, 50) ? "bg-amber-500"
                    : "bg-red-500",
                )}
                style={{ width: `${formatRate(o.inspection_readiness_score)}` }}
              />
            </div>
            <span className={cn(
              "text-sm font-bold tabular-nums",
              meets(o.inspection_readiness_score, 75) ? "text-[--cs-success]"
                : meets(o.inspection_readiness_score, 50) ? "text-[--cs-warning]"
                : "text-[--cs-risk]",
            )}>
              {formatRate(o.inspection_readiness_score)}
            </span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Evaluation Alerts
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

        {/* ── Cara Inspection Intelligence ────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Inspection Intelligence
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
