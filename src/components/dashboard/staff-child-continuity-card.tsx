"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — STAFF–CHILD CONTINUITY OF CARE CARD
// Relational continuity per child: is an active key worker assigned and actually
// delivering the sessions? Powered by the Staff–Child Continuity Engine
// (Reg 11 — positive relationships).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  HeartHandshake, ChevronRight, AlertTriangle, Brain, Loader2, UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffChildContinuity } from "@/hooks/use-staff-child-continuity";

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
          <div className={cn("text-center rounded-lg p-2.5", o.avg_continuity_index >= 75 ? "bg-green-50" : o.avg_continuity_index >= 55 ? "bg-blue-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.avg_continuity_index >= 75 ? "text-green-600" : o.avg_continuity_index >= 55 ? "text-blue-600" : "text-amber-600")}>{o.avg_continuity_index}</p>
            <p className="text-[10px] text-muted-foreground">Avg index</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.fragmented_count > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.fragmented_count > 0 ? "text-amber-600" : "text-green-600")}>{o.fragmented_count}</p>
            <p className="text-[10px] text-muted-foreground">Fragmented</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.no_key_worker_count > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.no_key_worker_count > 0 ? "text-red-600" : "text-gray-500")}>{o.no_key_worker_count}</p>
            <p className="text-[10px] text-muted-foreground">No KW</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.inactive_key_worker_count > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.inactive_key_worker_count > 0 ? "text-red-600" : "text-gray-500")}>{o.inactive_key_worker_count}</p>
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Relationship Continuity Intelligence
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
