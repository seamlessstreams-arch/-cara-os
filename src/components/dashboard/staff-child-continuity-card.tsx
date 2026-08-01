"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF–CHILD CONTINUITY OF CARE CARD
// Relational continuity per child: is an active key worker assigned and actually
// delivering the sessions? Powered by the Staff–Child Continuity Engine
// (Reg 11 — positive relationships).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake, ChevronRight, AlertTriangle, Brain, Loader2, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { StaffChildContinuityResult } from "@/lib/staff-child-continuity/staff-child-continuity-engine";

interface StaffChildContinuityResponse {
  data: StaffChildContinuityResult;
}

function useStaffChildContinuity() {
  return useQuery({
    queryKey: ["staff-child-continuity"],
    queryFn: () => api.get<StaffChildContinuityResponse>("/staff-child-continuity"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

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
const BAND_STYLES: Record<string, { bg: string; text: string }> = {
  strong: { bg: "bg-green-100", text: "text-green-700" },
  adequate: { bg: "bg-blue-100", text: "text-blue-700" },
  fragmented: { bg: "bg-amber-100", text: "text-amber-700" },
  critical: { bg: "bg-red-100", text: "text-red-700" },
};

export function StaffChildContinuityCard() {
  const { data, isLoading } = useStaffChildContinuity();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Staff–Child Continuity of Care
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
  const children = intel.children ?? [];
  const alerts = intel.alerts ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-brand" />
            Staff–Child Continuity of Care
          </CardTitle>
          <Link href="/staff-child-continuity" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("text-center rounded-lg p-2.5", (o.avg_continuity_index ?? 0) >= 75 ? "bg-green-50" : (o.avg_continuity_index ?? 0) >= 55 ? "bg-blue-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (o.avg_continuity_index ?? 0) >= 75 ? "text-[--cs-success]" : (o.avg_continuity_index ?? 0) >= 55 ? "text-blue-600" : "text-[--cs-warning]")}>{o.avg_continuity_index}</p>
            <p className="text-[10px] text-muted-foreground">Avg index</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.fragmented_count > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.fragmented_count > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{o.fragmented_count}</p>
            <p className="text-[10px] text-muted-foreground">Fragmented</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.no_key_worker_count > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.no_key_worker_count > 0 ? "text-[--cs-risk]" : "text-gray-500")}>{o.no_key_worker_count}</p>
            <p className="text-[10px] text-muted-foreground">No KW</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.inactive_key_worker_count > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.inactive_key_worker_count > 0 ? "text-[--cs-risk]" : "text-gray-500")}>{o.inactive_key_worker_count}</p>
            <p className="text-[10px] text-muted-foreground">KW left</p>
          </div>
        </div>

        {/* ── Per-child continuity (weakest first) ─────────────────────── */}
        {children.length > 0 && (
          <div className="space-y-1.5">
            {children.slice(0, 5).map((c) => {
              const band = BAND_STYLES[c.band] ?? BAND_STYLES.adequate;
              return (
                <div key={c.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium truncate">{c.child_name}</span>
                      {(!c.key_worker_id || !c.key_worker_active) && <UserX className="h-3 w-3 text-red-500 shrink-0" />}
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", band.bg, band.text)}>{c.continuity_index} {c.band}</Badge>
                  </div>
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    KW: {c.key_worker_name ?? "—"}{c.key_worker_id && !c.key_worker_active ? " (inactive)" : ""} · {c.key_worker_share}% of sessions · {c.distinct_staff} staff
                  </div>
                  {c.flags[0] && <p className="text-[10px] text-amber-700 mt-0.5 truncate">⚠ {c.flags[0]}</p>}
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
              Continuity Alerts
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
              Cara Relationship Continuity Intelligence
            </p>
            {insights.slice(0, 2).map((insight, i) => (
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
