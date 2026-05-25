"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — QUALITY ASSURANCE INTELLIGENCE CARD
// Dashboard card powered by the Quality Assurance Intelligence Engine.
// Reg 45 (quality of care review), SCCIF Leadership & Management.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  Star, Target, TrendingUp, FileSearch, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQualityAssuranceIntelligence } from "@/hooks/use-quality-assurance-intelligence";

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

const RATING_COLOURS: Record<string, string> = {
  Excellent: "bg-green-100 text-green-700",
  Good: "bg-blue-100 text-blue-700",
  "Requires Improvement": "bg-amber-100 text-amber-700",
  Inadequate: "bg-red-100 text-red-700",
};

// ── Component ───────────────────────────────────────────────────────────────

export function QualityAssuranceCard() {
  const { data, isLoading } = useQualityAssuranceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Quality Assurance
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
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Quality Assurance
          </CardTitle>
          <Link href="/quality-assurance" className="text-xs text-brand hover:underline flex items-center gap-1">
            QA <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_audits}
            </p>
            <p className="text-[10px] text-muted-foreground">Audits</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.avg_rating_score >= 3 ? "bg-green-50" : o.avg_rating_score >= 2 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.avg_rating_score >= 3 ? "text-green-600" : o.avg_rating_score >= 2 ? "text-amber-600" : "text-red-600",
            )}>
              {o.avg_rating_score.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Rating</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.actions_overdue === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.actions_overdue === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.actions_overdue}
            </p>
            <p className="text-[10px] text-muted-foreground">Overdue</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.recommendation_completion_rate >= 80 ? "bg-green-50" : o.recommendation_completion_rate >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.recommendation_completion_rate >= 80 ? "text-green-600" : o.recommendation_completion_rate >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.recommendation_completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Recs Done</p>
          </div>
        </div>

        {/* ── Audit areas ─────────────────────────────────────────────── */}

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
                  <Badge className={cn("text-[10px]", RATING_COLOURS[a.avg_rating] ?? "bg-gray-100 text-gray-600")}>
                    <Star className="h-2.5 w-2.5 mr-0.5" />
                    {a.avg_rating}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Recommendations tracker ──────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Recommendations
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total</span>
            <span className="font-bold tabular-nums">{o.total_actions}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-bold text-green-600 tabular-nums">{o.actions_completed}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Overdue</span>
            <span className={cn("font-bold tabular-nums", o.actions_overdue > 0 ? "text-red-600" : "text-green-600")}>
              {o.actions_overdue}
            </span>
          </div>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.audits_last_90_days}</p>
            <p className="text-[10px] text-muted-foreground">Last 90d</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.strengths_count}</p>
            <p className="text-[10px] text-muted-foreground">Strengths</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.improvements_count > o.strengths_count ? "text-amber-600" : "text-slate-700",
            )}>
              {o.improvements_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Improvements</p>
          </div>
        </div>

        {/* ── Overdue actions ─────────────────────────────────────────── */}

        {intel.overdue_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Overdue Actions
            </p>
            {intel.overdue_actions.slice(0, 3).map((a, i) => (
              <div key={i} className="rounded border border-red-200 bg-red-50 p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-red-800 truncate flex-1">{a.action}</span>
                  <Badge className="text-[10px] bg-red-100 text-red-700 ml-1">{a.days_overdue}d</Badge>
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
              QA Alerts
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

        {/* ── ARIA Quality Intelligence ───────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Quality Intelligence
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
