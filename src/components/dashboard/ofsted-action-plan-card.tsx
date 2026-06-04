"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — OFSTED ACTION PLAN CARD
// Dashboard card powered by the Quality Assurance Intelligence Engine.
// Tracks action plan progress, completion rates, and overdue items.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, ChevronRight, AlertTriangle, Brain,
  Target, TrendingUp, Loader2,
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

// ── Component ───────────────────────────────────────────────────────────────

export function OfstedActionPlanCard() {
  const { data, isLoading } = useQualityAssuranceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Ofsted Action Plan
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
  const completionPct = o.total_actions > 0
    ? Math.round((o.actions_completed / o.total_actions) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand" />
            Ofsted Action Plan
          </CardTitle>
          <Link href="/audits" className="text-xs text-brand hover:underline flex items-center gap-1">
            Actions <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_actions}
            </p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.actions_completed > 0 ? "bg-green-50" : "bg-gray-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.actions_completed > 0 ? "text-green-600" : "text-gray-600",
            )}>
              {o.actions_completed}
            </p>
            <p className="text-[10px] text-muted-foreground">Done</p>
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
            o.improvement_rate >= 80 ? "bg-green-50" : o.improvement_rate >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.improvement_rate >= 80 ? "text-green-600" : o.improvement_rate >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.improvement_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Improved</p>
          </div>
        </div>

        {/* ── Action completion progress ──────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-500" />
            Action Completion
          </p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Completed</span>
            <span className="font-bold text-green-600 tabular-nums">{o.actions_completed} / {o.total_actions}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                completionPct >= 80 ? "bg-green-500" : completionPct >= 50 ? "bg-amber-500" : "bg-red-500",
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right tabular-nums">{completionPct}% complete</p>
        </div>

        {/* ── Overdue actions ─────────────────────────────────────────── */}

        {intel.overdue_actions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Target className="h-3 w-3" />
              Overdue Actions
            </p>
            {intel.overdue_actions.slice(0, 4).map((a, i) => (
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
              Ofsted Alerts
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

        {/* ── ARIA Ofsted Intelligence ────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Ofsted Intelligence
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
