"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS & NOTIFICATIONS INTELLIGENCE CARD
// Dashboard card powered by the Complaints Intelligence Engine.
// Reg 39 complaints procedure, Reg 40 notification compliance.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquareWarning, ChevronRight, AlertTriangle,
  Brain, Clock, Send, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplaintsIntelligenceResult } from "@/lib/engines/complaints-intelligence-engine";
import { api } from "@/hooks/use-api";

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

const SOURCE_COLOURS: Record<string, string> = {
  child: "bg-pink-100 text-pink-700",
  parent_carer: "bg-[--cs-info-bg] text-[--cs-info]",
  social_worker: "bg-[--cs-oversight-bg] text-[--cs-oversight]",
  professional: "bg-indigo-100 text-indigo-700",
  staff: "bg-[--cs-warning-bg] text-[--cs-warning]",
  anonymous: "bg-[--cs-bg] text-[--cs-text-secondary]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function ComplaintsNotificationsCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["complaints-intelligence"],
    queryFn: () => api.get<{ data: ComplaintsIntelligenceResult }>("/complaints-intelligence"),
    refetchInterval: 60_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquareWarning className="h-4 w-4 text-brand" />
            Complaints & Notifications
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
            <MessageSquareWarning className="h-4 w-4 text-brand" />
            Complaints & Notifications
          </CardTitle>
          <Link href="/complaints" className="text-xs text-brand hover:underline flex items-center gap-1">
            Complaints <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.open_count > 0 ? "bg-amber-50" : "bg-green-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.open_count > 0 ? "text-[--cs-warning]" : "text-[--cs-success]",
            )}>
              {o.open_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-slate-600">
              {o.avg_response_days}d
            </p>
            <p className="text-[10px] text-muted-foreground">Avg Response</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.satisfaction_rate >= 75 ? "bg-green-50" : o.satisfaction_rate >= 50 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.satisfaction_rate >= 75 ? "text-[--cs-success]" : o.satisfaction_rate >= 50 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {o.satisfaction_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Satisfied</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.lessons_recorded_rate >= 90 ? "bg-green-50" : o.lessons_recorded_rate >= 70 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.lessons_recorded_rate >= 90 ? "text-[--cs-success]" : o.lessons_recorded_rate >= 70 ? "text-[--cs-warning]" : "text-[--cs-risk]",
            )}>
              {o.lessons_recorded_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Lessons</p>
          </div>
        </div>

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.total_complaints}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div>
            <p className={cn(
              "font-bold tabular-nums",
              o.upheld_rate > 50 ? "text-[--cs-warning]" : "text-slate-700",
            )}>
              {o.upheld_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Upheld Rate</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.child_complaints}</p>
            <p className="text-[10px] text-muted-foreground">From Children</p>
          </div>
        </div>

        {/* ── Open complaints ─────────────────────────────────────────── */}

        {intel.open_complaints.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Open Complaints
            </p>
            {intel.open_complaints.slice(0, 3).map((cmp) => (
              <div key={cmp.complaint_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={cn("text-[10px]", SOURCE_COLOURS[cmp.source] ?? "bg-[--cs-bg] text-[--cs-text-secondary]")}>
                      {cmp.source.replace(/_/g, " ")}
                    </Badge>
                    <span className="font-medium capitalize">{cmp.theme.replace(/_/g, " ")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cmp.days_open > 20 && (
                      <Badge className="text-[10px] bg-[--cs-risk-bg] text-[--cs-risk]">
                        <Send className="h-2.5 w-2.5 mr-0.5" />
                        Overdue
                      </Badge>
                    )}
                    <span className={cn(
                      "tabular-nums",
                      cmp.days_open > 20 ? "text-red-600 font-medium" : "text-muted-foreground",
                    )}>
                      {cmp.days_open}d
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground mt-1 truncate">
                  From: {cmp.complainant}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── Theme breakdown ─────────────────────────────────────────── */}

        {intel.theme_breakdown.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">By Theme</p>
            <div className="grid grid-cols-2 gap-1.5">
              {intel.theme_breakdown.slice(0, 4).map((t) => (
                <div key={t.theme} className="flex items-center justify-between rounded border p-2 text-xs">
                  <span className="truncate">{t.theme_label}</span>
                  <Badge variant="outline" className="text-[10px] tabular-nums ml-1">{t.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Complaints Alerts
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

        {/* ── Cara Complaints Intelligence ────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Complaints Intelligence
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
