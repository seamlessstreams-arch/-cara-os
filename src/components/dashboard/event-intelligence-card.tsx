"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — EVENT INTELLIGENCE CARD (stream-native analytics)
// Cross-domain risk radar, approval backlog and compliance register — all derived
// from the canonical CornerstoneEvent stream. "Capture once → analytics."
// ══════════════════════════════════════════════════════════════════════════════

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Radar, ChevronRight, Loader2, Brain, ShieldCheck, AlertTriangle,
  TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/hooks/use-api";
import type { EventIntelligenceResult } from "@/lib/event-intelligence/event-intelligence-engine";

// ── useEventIntelligence (inlined from deleted src/hooks/use-event-intelligence.ts) ─
// Also used, byte-identical, in app/(platform)/event-intelligence/page.tsx.

interface EventIntelligenceResponse {
  data: EventIntelligenceResult;
}

function useEventIntelligence() {
  return useQuery({
    queryKey: ["event-intelligence"],
    queryFn: () => api.get<EventIntelligenceResponse>("/event-intelligence"),
    refetchInterval: 60_000, // 60 second refresh
  });
}

const TREND_ICON: Record<string, React.ReactNode> = {
  escalating: <TrendingUp className="h-3 w-3 text-red-500" />,
  improving: <TrendingDown className="h-3 w-3 text-green-500" />,
  stable: <Minus className="h-3 w-3 text-gray-400" />,
};
function riskTone(score: number): { bg: string; text: string } {
  if (score >= 70) return { bg: "bg-red-100", text: "text-red-700" };
  if (score >= 45) return { bg: "bg-amber-100", text: "text-amber-700" };
  if (score >= 20) return { bg: "bg-blue-100", text: "text-blue-700" };
  return { bg: "bg-green-100", text: "text-green-700" };
}
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning: "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

export function EventIntelligenceCard() {
  const { data, isLoading } = useEventIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radar className="h-4 w-4 text-brand" />
            Event Intelligence
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
  const radar = intel.child_radar ?? [];
  const backlog = intel.approval_backlog ?? [];
  const register = intel.compliance_register ?? [];
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Radar className="h-4 w-4 text-brand" />
            Event Intelligence
          </CardTitle>
          <Link href="/event-intelligence" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_events}</p>
            <p className="text-[10px] text-muted-foreground">Events 90d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.escalating_children > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.escalating_children > 0 ? "text-[--cs-risk]" : "text-[--cs-success]")}>{o.escalating_children}</p>
            <p className="text-[10px] text-muted-foreground">Escalating</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.pending_approvals > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.pending_approvals > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{o.pending_approvals}</p>
            <p className="text-[10px] text-muted-foreground">Approvals</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.open_compliance_flags > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.open_compliance_flags > 0 ? "text-[--cs-warning]" : "text-[--cs-success]")}>{o.open_compliance_flags}</p>
            <p className="text-[10px] text-muted-foreground">Flags</p>
          </div>
        </div>

        {/* ── Risk radar (top children) ────────────────────────────────── */}
        {radar.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Cross-domain risk radar</p>
            {radar.slice(0, 3).map((c) => {
              const tone = riskTone(c.risk_score);
              return (
                <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-medium truncate">{c.child_name}</span>
                      {TREND_ICON[c.trend]}
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", tone.bg, tone.text)}>{c.risk_score}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {c.events_90d} events · {c.top_event_types.slice(0, 3).map((t) => t.type).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Approval backlog + compliance register ───────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border p-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1"><ShieldCheck className="h-3 w-3" /> Approval backlog</p>
            {backlog.length === 0 && <p className="text-[10px] text-green-700">All clear</p>}
            {backlog.slice(0, 3).map((b, i) => (
              <p key={i} className="text-[10px] text-[var(--cs-text-secondary)] capitalize">{b.count} · {b.approvalLevel.replace("_", " ")}</p>
            ))}
          </div>
          <div className="rounded-lg border p-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Compliance register</p>
            {register.length === 0 && <p className="text-[10px] text-green-700">No open flags</p>}
            {register.slice(0, 2).map((f, i) => (
              <p key={i} className="text-[10px] text-[var(--cs-text-secondary)] truncate">{f.count}× {f.flag}</p>
            ))}
          </div>
        </div>

        {/* ── Cara insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara Event Intelligence
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
