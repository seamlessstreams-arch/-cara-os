"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — COMPLAINTS ↔ INCIDENT CORRELATION CARD
// Cross-dataset early warning: where complaints preceded or converge with
// incidents, and where incidents occur with no complaint (a voice gap).
// Powered by the Complaints↔Incident Correlation Engine (Reg 22 / 12 / 7).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Link2, ChevronRight, AlertTriangle, Brain, Loader2, MessageSquareWarning,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComplaintsIncidentCorrelationResult } from "@/lib/complaints-incident-correlation/complaints-incident-correlation-engine";
import { api } from "@/hooks/use-api";

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
const TYPE_META: Record<string, { label: string; bg: string; text: string }> = {
  leading_indicator: { label: "leading indicator", bg: "bg-red-100", text: "text-red-700" },
  convergent: { label: "convergent", bg: "bg-amber-100", text: "text-amber-700" },
  emerging_watch: { label: "emerging watch", bg: "bg-blue-100", text: "text-blue-700" },
  incidents_only: { label: "voice gap", bg: "bg-indigo-100", text: "text-indigo-700" },
  complaints_only: { label: "handled", bg: "bg-green-100", text: "text-green-700" },
  none: { label: "—", bg: "bg-gray-100", text: "text-gray-600" },
};

export function ComplaintsIncidentCorrelationCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["complaints-incident-correlation"],
    queryFn: () =>
      api.get<{ data: ComplaintsIncidentCorrelationResult }>("/complaints-incident-correlation"),
    refetchInterval: 60_000,
  });
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4 text-brand" />
            Complaints ↔ Incident Correlation
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
  const rows = intel.child_correlations ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Link2 className="h-4 w-4 text-brand" />
            Complaints ↔ Incident Correlation
          </CardTitle>
          <Link href="/complaints-incident-correlation" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", o.leading_indicator_count > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.leading_indicator_count > 0 ? "text-[--cs-risk]" : "text-gray-500")}>{o.leading_indicator_count}</p>
            <p className="text-[10px] text-muted-foreground">Leading</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.convergent_count > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.convergent_count > 0 ? "text-[--cs-warning]" : "text-gray-500")}>{o.convergent_count}</p>
            <p className="text-[10px] text-muted-foreground">Convergent</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.incidents_only_count > 0 ? "bg-indigo-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.incidents_only_count > 0 ? "text-indigo-600" : "text-gray-500")}>{o.incidents_only_count}</p>
            <p className="text-[10px] text-muted-foreground">Voice Gaps</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_complaints_90}<span className="text-muted-foreground">/</span>{o.total_incidents_90}</p>
            <p className="text-[10px] text-muted-foreground">Cmp/Inc 90d</p>
          </div>
        </div>

        {/* ── Per-child correlations ───────────────────────────────────── */}
        {rows.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <MessageSquareWarning className="h-3 w-3" />
              Correlated Children
            </p>
            {rows.slice(0, 4).map((r) => {
              const meta = TYPE_META[r.correlation_type] ?? TYPE_META.none;
              const signal = (r.signals ?? [])[0];
              return (
                <div key={r.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium">{r.child_name}</span>
                      {r.safeguarding_overlap && (
                        <Badge className="text-[9px] bg-red-50 text-red-700 border-red-200">safeguarding</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge className={cn("text-[10px]", meta.bg, meta.text)}>{meta.label}</Badge>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{r.correlation_score}</span>
                    </div>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    <span className="tabular-nums">{r.complaints_90} complaint{r.complaints_90 === 1 ? "" : "s"} · {r.incidents_90} incident{r.incidents_90 === 1 ? "" : "s"}</span>
                    {signal && <span className="block truncate mt-0.5">{signal}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}
        {alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Early-Warning Alerts
            </p>
            {alerts.slice(0, 3).map((alert, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium)}>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── Cara insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Voice & Protection Intelligence
            </p>
            {insights.slice(0, 3).map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
