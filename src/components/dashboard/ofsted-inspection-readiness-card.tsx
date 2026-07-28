"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — OFSTED INSPECTION READINESS CARD
// Dashboard card powered by the Quality Assurance Intelligence Engine.
// Readiness overview: ratings, completion rates, audit areas, overdue items.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  Star, Target, FileSearch, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { QualityAssuranceIntelligenceResult } from "@/lib/engines/quality-assurance-intelligence-engine";

interface QualityAssuranceIntelligenceResponse {
  data: QualityAssuranceIntelligenceResult;
}

function useQualityAssuranceIntelligence() {
  return useQuery({
    queryKey: ["quality-assurance-intelligence"],
    queryFn: () =>
      api.get<QualityAssuranceIntelligenceResponse>(
        "/quality-assurance-intelligence"
      ),
    refetchInterval: 60_000,
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

const RATING_COLOURS: Record<string, string> = {
  Excellent: "bg-[--cs-success-bg] text-[--cs-success]",
  Good: "bg-[--cs-info-bg] text-[--cs-info]",
  "Requires Improvement": "bg-[--cs-warning-bg] text-[--cs-warning]",
  Inadequate: "bg-[--cs-risk-bg] text-[--cs-risk]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function OfstedInspectionReadinessCard() {
  const { data, isLoading } = useQualityAssuranceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3 bg-blue-50/50">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
            <span className="text-blue-900">Inspection Readiness</span>
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
  const completionRate = o.total_actions > 0
    ? Math.round((o.actions_completed / o.total_actions) * 100)
    : 0;

  return (
    <Card className="overflow-hidden border-blue-200">
      <CardHeader className="pb-3 bg-blue-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-blue-600" />
            <span className="text-blue-900">Inspection Readiness</span>
          </CardTitle>
          <Link href="/audits" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Readiness <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_rating_score >= 3 ? "bg-green-50" : o.avg_rating_score >= 2 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_rating_score >= 3 ? "text-[--cs-success]" : o.avg_rating_score >= 2 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {o.avg_rating_score.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Score</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_audits}
            </p>
            <p className="text-[10px] text-muted-foreground">Audits</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            completionRate >= 80 ? "bg-green-50" : completionRate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              completionRate >= 80 ? "text-[--cs-success]" : completionRate >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {completionRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Actions Done</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.actions_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.actions_overdue === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.actions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
        </div>

        {/* ── Audit areas summary ─────────────────────────────────────── */}

        {intel.audit_areas.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <FileSearch className="h-3 w-3" />
              Audit Areas
            </p>
            {intel.audit_areas.slice(0, 6).map((a) => (
              <div key={a.scope} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1 capitalize">{a.scope.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{a.audit_count}</Badge>
                  <Badge className={cn("text-[10px]", RATING_COLOURS[a.avg_rating] ?? "bg-[--cs-bg] text-[--cs-text-secondary]")}>
                    <Star className="h-2.5 w-2.5 mr-0.5" />
                    {a.avg_rating}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Overdue actions ─────────────────────────────────────────── */}

        {intel.overdue_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Overdue Actions
            </p>
            {intel.overdue_actions.slice(0, 3).map((a, i) => (
              <div key={i} className="rounded border border-[--cs-risk-soft] bg-[--cs-risk-bg] p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[--cs-risk] truncate flex-1">{a.action}</span>
                  <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk] ml-1">{a.days_overdue}d</Badge>
                </div>
                <p className="text-red-700 text-[10px] mt-0.5">
                  {a.audit_title} · Owner: {a.owner}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Readiness Alerts
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
