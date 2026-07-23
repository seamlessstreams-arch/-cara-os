"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — ALLEGATION MANAGEMENT INTELLIGENCE CARD
// Live data from safeguarding intelligence engine.
// CHR 2015 Reg 12, Reg 33; Working Together 2023.
// SCCIF: Helped & Protected — "Allegations are managed swiftly."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRate } from "@/lib/metrics/rate";
import { useSafeguardingIntelligence } from "@/hooks/use-safeguarding-intelligence";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function AllegationManagementCard() {
  const { data, isLoading } = useSafeguardingIntelligence();

  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const d = data?.data;
  const profile = d?.profile;
  const restraints = d?.restraints;
  const notifiable = d?.notifiable_events;
  const insights = d?.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-brand" />
            Allegation Management
          </CardTitle>
          <Link href="/safeguarding" className="text-xs text-brand hover:underline flex items-center gap-1">
            Safeguarding <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary strip */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{profile?.total_incidents_90d ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Incidents 90d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (profile?.open_incidents ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (profile?.open_incidents ?? 0) > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{profile?.open_incidents ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (profile?.incidents_needing_oversight ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (profile?.incidents_needing_oversight ?? 0) > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{profile?.incidents_needing_oversight ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Oversight</p>
          </div>
          <div className="text-center rounded-lg bg-emerald-50 p-2">
            <p className="text-lg font-bold tabular-nums text-emerald-600">{profile?.safeguarding_incidents_90d ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Safeguarding 90d</p>
          </div>
        </div>

        {/* Restraint & Notifiable detail */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Restraint / Notifiable Detail</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Restraints 90d:</span>{" "}
              <span className="font-semibold">{restraints?.total_restraints_90d ?? 0}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Debrief rate:</span>{" "}
              <span className="font-semibold">{formatRate(restraints?.debrief_completion_rate)}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Notifiable events:</span>{" "}
              <span className="font-semibold">{notifiable?.total_events ?? 0}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Notified on time:</span>{" "}
              <span className="font-semibold">{notifiable?.notified_on_time ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Cara insights */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Allegation Intelligence
            </p>
            {insights.map((insight, i) => (
              <div key={i} className={cn("rounded border p-2.5 text-xs leading-relaxed", INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.warning)}>
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
