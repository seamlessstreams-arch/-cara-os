"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INCIDENT TRENDS CARD
// Dashboard widget showing incident volume, severity distribution,
// oversight queue, and pattern indicators.
// Critical for RM situational awareness — Reg 40 requires swift incident
// management and patterns to be identified and acted upon.
// ══════════════════════════════════════════════════════════════════════════════

import React, { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import { useIncidents } from "@/hooks/use-incidents";
import { getStaffName, getYPName } from "@/lib/seed-data";
import { cn, formatRelative } from "@/lib/utils";
import {
  Flame, Loader2, AlertTriangle, ChevronRight,
  Eye, ShieldAlert, TrendingUp, Clock,
  TriangleAlert, CheckCircle2,
} from "lucide-react";

// ── Severity config ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG: Record<string, { label: string; colour: string }> = {
  critical: { label: "Critical", colour: "bg-red-500" },
  high:     { label: "High",     colour: "bg-orange-400" },
  medium:   { label: "Medium",   colour: "bg-amber-400" },
  low:      { label: "Low",      colour: "bg-blue-400" },
};

// ── Component ───────────────────────────────────────────────────────────────

export function IncidentTrendsCard() {
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: incData, isLoading: incLoading } = useIncidents();

  const isLoading = dashLoading || incLoading;
  const d = dashData?.data;

  const {
    open, critical, awaitingOversight, thisWeek,
    severityBreakdown, recentIncidents,
    hasUrgent,
  } = useMemo(() => {
    if (!d) return {
      open: 0, critical: 0, awaitingOversight: 0, thisWeek: 0,
      severityBreakdown: {} as Record<string, number>,
      recentIncidents: [] as typeof incidents,
      hasUrgent: false,
    };

    const incidents = incData?.data ?? [];
    const openIncidents = incidents.filter((i) =>
      i.status === "open" || i.status === "under_review",
    );

    // Severity breakdown of open incidents
    const breakdown: Record<string, number> = {};
    openIncidents.forEach((i) => {
      breakdown[i.severity] = (breakdown[i.severity] ?? 0) + 1;
    });

    // Most recent incidents (last 5)
    const sorted = [...incidents].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return {
      open: d.incidents.open,
      critical: d.incidents.critical,
      awaitingOversight: d.incidents.awaiting_oversight,
      thisWeek: d.incidents.this_week,
      severityBreakdown: breakdown,
      recentIncidents: sorted.slice(0, 5),
      hasUrgent: d.incidents.critical > 0 || d.incidents.awaiting_oversight > 0,
    };
  }, [d, incData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Flame className="h-4 w-4 text-orange-500" />
            Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalBreakdown = Object.values(severityBreakdown).reduce((s, n) => s + n, 0);

  return (
    <Card className={cn(hasUrgent && "border-orange-200")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-[13px]">
            <Flame className="h-4 w-4 text-orange-500" />
            Incident Overview
          </CardTitle>
          <Link href="/incidents">
            <Badge className="text-[9px] bg-orange-100 text-orange-700 border-0 rounded-full hover:bg-orange-200 cursor-pointer">
              View all
            </Badge>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2.5">
        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className={cn("rounded-xl p-2 text-center", open > 0 ? "bg-orange-50" : "bg-emerald-50")}>
            <Flame className={cn("h-3 w-3 mx-auto mb-0.5", open > 0 ? "text-orange-500" : "text-emerald-500")} />
            <div className={cn("text-sm font-bold tabular-nums", open > 0 ? "text-orange-700" : "text-emerald-700")}>{open}</div>
            <div className={cn("text-[9px]", open > 0 ? "text-orange-500" : "text-emerald-500")}>Open</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", critical > 0 ? "bg-red-50" : "bg-slate-50")}>
            <TriangleAlert className={cn("h-3 w-3 mx-auto mb-0.5", critical > 0 ? "text-red-500" : "text-slate-400")} />
            <div className={cn("text-sm font-bold tabular-nums", critical > 0 ? "text-red-700" : "text-slate-400")}>{critical}</div>
            <div className={cn("text-[9px]", critical > 0 ? "text-red-500" : "text-slate-400")}>Critical</div>
          </div>
          <div className={cn("rounded-xl p-2 text-center", awaitingOversight > 0 ? "bg-violet-50" : "bg-slate-50")}>
            <Eye className={cn("h-3 w-3 mx-auto mb-0.5", awaitingOversight > 0 ? "text-violet-500" : "text-slate-400")} />
            <div className={cn("text-sm font-bold tabular-nums", awaitingOversight > 0 ? "text-violet-700" : "text-slate-400")}>{awaitingOversight}</div>
            <div className={cn("text-[9px]", awaitingOversight > 0 ? "text-violet-500" : "text-slate-400")}>Oversight</div>
          </div>
          <div className="rounded-xl bg-slate-50 p-2 text-center">
            <TrendingUp className="h-3 w-3 text-slate-400 mx-auto mb-0.5" />
            <div className="text-sm font-bold text-slate-700 tabular-nums">{thisWeek}</div>
            <div className="text-[9px] text-slate-400">This Week</div>
          </div>
        </div>

        {/* Severity distribution bar */}
        {totalBreakdown > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-slate-500">Open by Severity</span>
              <span className="text-[10px] text-slate-400">{totalBreakdown} total</span>
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const count = severityBreakdown[sev] ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={sev}
                    className={cn("h-full", SEVERITY_CONFIG[sev].colour)}
                    style={{ width: `${(count / totalBreakdown) * 100}%` }}
                    title={`${SEVERITY_CONFIG[sev].label}: ${count}`}
                  />
                );
              })}
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["critical", "high", "medium", "low"] as const).map((sev) => {
                const count = severityBreakdown[sev] ?? 0;
                if (count === 0) return null;
                return (
                  <div key={sev} className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", SEVERITY_CONFIG[sev].colour)} />
                    <span className="text-[9px] text-slate-500">{SEVERITY_CONFIG[sev].label} {count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Awaiting oversight warning */}
        {awaitingOversight > 0 && (
          <div className="rounded-lg bg-violet-50 border border-violet-100 p-2 flex items-start gap-2">
            <Eye className="h-3 w-3 text-violet-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-violet-700">
                {awaitingOversight} incident{awaitingOversight !== 1 ? "s" : ""} awaiting RM oversight
              </p>
              <p className="text-[10px] text-violet-600">
                Reg 40 requires managers to review and sign off all incidents
              </p>
            </div>
          </div>
        )}

        {/* Critical alert */}
        {critical > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-100 p-2 flex items-start gap-2">
            <ShieldAlert className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-red-700">
                {critical} critical incident{critical !== 1 ? "s" : ""} active
              </p>
              <p className="text-[10px] text-red-600">
                Review and escalate immediately — may require Ofsted notification
              </p>
            </div>
          </div>
        )}

        {/* No incidents celebration */}
        {open === 0 && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span className="text-[11px] font-medium text-emerald-700">
              No open incidents
            </span>
          </div>
        )}

        {/* Recent incidents list */}
        {recentIncidents.length > 0 && (
          <div className="space-y-1">
            {recentIncidents.slice(0, 4).map((incident) => {
              const sevConfig = SEVERITY_CONFIG[incident.severity] ?? {
                label: incident.severity, colour: "bg-slate-400",
              };
              return (
                <Link key={incident.id} href={`/incidents/${incident.id}`}>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <span className={cn("w-2 h-2 rounded-full shrink-0", sevConfig.colour)} />
                    <span className="text-[11px] font-medium text-slate-700 flex-1 truncate">
                      {incident.type.replace(/_/g, " ")} — {incident.reference}
                    </span>
                    <span className="text-[9px] text-slate-400 tabular-nums shrink-0">
                      {formatRelative(incident.created_at)}
                    </span>
                    <Badge className={cn(
                      "text-[8px] px-1.5 py-0 rounded-full border-0",
                      incident.status === "open" ? "bg-orange-100 text-orange-700"
                      : incident.status === "under_review" ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500",
                    )}>
                      {incident.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </Link>
              );
            })}
            {recentIncidents.length > 4 && (
              <Link href="/incidents">
                <p className="text-[10px] text-orange-600 hover:underline px-2">
                  +{recentIncidents.length - 4} more
                </p>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
