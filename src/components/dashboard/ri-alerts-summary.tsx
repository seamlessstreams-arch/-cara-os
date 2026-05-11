"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RI ALERTS SUMMARY WIDGET
// Dashboard card showing active governance/compliance alerts at a glance.
// Highlights critical alerts requiring immediate attention.
// ══════════════════════════════════════════════════════════════════════════════

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRiAlerts } from "@/hooks/use-ri-learning";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2,
  Loader2, ChevronRight, Flame, Clock,
} from "lucide-react";
import type { RiAlert, RiAlertSeverity } from "@/types/extended";

const SEV_DOT: Record<RiAlertSeverity, string> = {
  critical: "bg-red-500",
  high:     "bg-orange-500",
  medium:   "bg-amber-400",
  low:      "bg-[var(--cs-text-gentle)]",
};
const SEV_TEXT: Record<RiAlertSeverity, string> = {
  critical: "text-red-700",
  high:     "text-orange-700",
  medium:   "text-amber-700",
  low:      "text-[var(--cs-text-muted)]",
};

export function RiAlertsSummary() {
  const { currentUser } = useAuthContext();
  const homeId = currentUser?.home_id ?? "home_oak";
  const { data, isLoading } = useRiAlerts({ homeId });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            RI Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--cs-text-muted)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const alerts   = data?.data ?? [];
  const meta     = data?.meta as Record<string, unknown> | undefined;
  const active   = alerts.filter((a: RiAlert) => !a.is_resolved);
  const critical = active.filter((a: RiAlert) => a.severity === "critical");
  const high     = active.filter((a: RiAlert) => a.severity === "high");
  const hasCritical = critical.length > 0;

  return (
    <Card className={cn(hasCritical && "border-red-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <ShieldCheck className={cn("h-4 w-4", hasCritical ? "text-red-500" : "text-indigo-500")} />
            RI Alerts
          </CardTitle>
          <Link href="/ri/alerts">
            <Badge className={cn(
              "text-[9px] border-0 rounded-full cursor-pointer",
              hasCritical
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
            )}>
              {active.length} active
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* Severity summary counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldAlert className={cn("h-3 w-3", critical.length > 0 ? "text-red-500" : "text-[var(--cs-text-gentle)]")} />
            <span className={cn("font-semibold", critical.length > 0 ? "text-red-700" : "text-[var(--cs-text-muted)]")}>
              {critical.length}
            </span>
            <span className="text-[var(--cs-text-muted)]">crit</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <AlertTriangle className={cn("h-3 w-3", high.length > 0 ? "text-orange-500" : "text-[var(--cs-text-gentle)]")} />
            <span className={cn("font-semibold", high.length > 0 ? "text-orange-700" : "text-[var(--cs-text-muted)]")}>
              {high.length}
            </span>
            <span className="text-[var(--cs-text-muted)]">high</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] ml-auto">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            <span className="font-semibold text-emerald-700">
              {alerts.length - active.length}
            </span>
            <span className="text-[var(--cs-text-muted)]">resolved</span>
          </div>
        </div>

        {/* Severity distribution bar */}
        {active.length > 0 && (
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--cs-surface)]">
            {(["critical", "high", "medium", "low"] as RiAlertSeverity[]).map((sev) => {
              const count = active.filter((a: RiAlert) => a.severity === sev).length;
              if (count === 0) return null;
              const pct = (count / active.length) * 100;
              const barCol: Record<string, string> = {
                critical: "bg-red-500", high: "bg-orange-400", medium: "bg-amber-300", low: "bg-[var(--cs-surface)]",
              };
              return <div key={sev} className={barCol[sev]} style={{ width: `${pct}%` }} />;
            })}
          </div>
        )}

        {/* Top alerts list */}
        {active.slice(0, 4).map((alert: RiAlert) => {
          const daysOpen = Math.round((Date.now() - new Date(alert.created_at).getTime()) / 86400000);
          return (
            <Link key={alert.id} href="/ri/alerts">
              <div className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--cs-surface)] transition-colors">
                <div className={cn("w-2 h-2 rounded-full shrink-0", SEV_DOT[alert.severity])} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-[var(--cs-text-secondary)] truncate">{alert.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn("text-[9px] font-semibold uppercase", SEV_TEXT[alert.severity])}>
                      {alert.severity}
                    </span>
                    <span className="text-[9px] text-[var(--cs-text-muted)] flex items-center gap-0.5">
                      <Clock className="h-2 w-2" />
                      {daysOpen}d
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-[var(--cs-text-gentle)] shrink-0" />
              </div>
            </Link>
          );
        })}

        {/* Critical alert callout */}
        {hasCritical && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Flame className="h-3 w-3 text-red-500" />
              <p className="text-[10px] font-semibold text-red-700">
                {critical.length} critical alert{critical.length > 1 ? "s" : ""} requiring immediate action
              </p>
            </div>
            {critical.slice(0, 2).map((a: RiAlert) => (
              <p key={a.id} className="text-[10px] text-red-600 ml-4 truncate">
                {a.title}
              </p>
            ))}
          </div>
        )}

        {/* All clear state */}
        {active.length === 0 && (
          <div className="text-center py-3">
            <ShieldCheck className="h-6 w-6 text-emerald-400 mx-auto mb-1" />
            <p className="text-[11px] text-emerald-600 font-medium">All clear — no active alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
