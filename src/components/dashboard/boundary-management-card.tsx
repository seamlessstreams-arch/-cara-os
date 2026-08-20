"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — BOUNDARY MANAGEMENT INTELLIGENCE CARD
// Live data from safeguarding intelligence engine.
// CHR 2015 Reg 12/34. SCCIF: Safety.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck, ChevronRight, Brain, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/hooks/use-api";
import type { SafeguardingIntelligenceResult } from "@/lib/engines/safeguarding-intelligence-engine";

interface SafeguardingIntelligenceResponse {
  data: SafeguardingIntelligenceResult;
}

function useSafeguardingIntelligence() {
  return useQuery({
    queryKey: ["safeguarding-intelligence"],
    queryFn: () => api.get<SafeguardingIntelligenceResponse>("/safeguarding-intelligence"),
    refetchInterval: 30_000, // 30 second refresh (safeguarding data is critical)
  });
}

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function BoundaryManagementCard() {
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
  const insights = d?.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" />
            Boundaries
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
          <div className={cn("text-center rounded-lg p-2", (profile?.safeguarding_incidents_90d ?? 0) > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (profile?.safeguarding_incidents_90d ?? 0) > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{profile?.safeguarding_incidents_90d ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Safeguarding</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", (profile?.incidents_needing_oversight ?? 0) > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", (profile?.incidents_needing_oversight ?? 0) > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{profile?.incidents_needing_oversight ?? 0}</p>
            <p className="text-[10px] text-muted-foreground">Oversight</p>
          </div>
        </div>

        {/* Incident overview */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground">Incident Overview</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Open incidents:</span>{" "}
              <span className="font-semibold">{profile?.open_incidents ?? 0}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Needing oversight:</span>{" "}
              <span className="font-semibold">{profile?.incidents_needing_oversight ?? 0}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Safeguarding 90d:</span>{" "}
              <span className="font-semibold">{profile?.safeguarding_incidents_90d ?? 0}</span>
            </div>
            <div className="rounded border p-2">
              <span className="text-muted-foreground">Incident trend:</span>{" "}
              <span className="font-semibold capitalize">{profile?.incident_trend ?? "stable"}</span>
            </div>
          </div>
        </div>

        {/* Cara insights */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Boundary Intelligence
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
