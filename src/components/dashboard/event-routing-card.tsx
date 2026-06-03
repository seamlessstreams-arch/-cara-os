"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — EVENT ROUTING CARD
// Where each event flows (the "link intelligently" layer) — and the safety-gated
// queue of external notifications (Ofsted / Police / LADO) that are planned but
// never auto-sent. Powered by the Event Routing Engine.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, ChevronRight, Loader2, Brain, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEventRouting } from "@/hooks/use-event-routing";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function EventRoutingCard() {
  const { data, isLoading } = useEventRouting();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4 text-brand" />
            Event Routing
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
  const insights = intel.insights ?? [];
  const topDestinations = Object.entries(o.destination_counts ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const externalApis = Object.entries(o.external_api_counts ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Route className="h-4 w-4 text-brand" />
            Event Routing
          </CardTitle>
          <Link href="/event-routing" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_events}</p>
            <p className="text-[10px] text-muted-foreground">Events</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">{o.auto_routed}</p>
            <p className="text-[10px] text-muted-foreground">Auto-routed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.pending_approval > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.pending_approval > 0 ? "text-amber-600" : "text-gray-500")}>{o.pending_approval}</p>
            <p className="text-[10px] text-muted-foreground">Pending</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.external_notifications_pending > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.external_notifications_pending > 0 ? "text-red-600" : "text-green-600")}>{o.external_notifications_pending}</p>
            <p className="text-[10px] text-muted-foreground">External</p>
          </div>
        </div>

        {/* ── External notification queue (gated) ──────────────────────── */}
        {externalApis.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50/50 p-2.5 space-y-1">
            <p className="text-[10px] font-semibold text-red-700 flex items-center gap-1"><Send className="h-3 w-3" /> External notifications — awaiting approval (never auto-sent)</p>
            <div className="flex flex-wrap gap-1.5">
              {externalApis.map(([api, count], i) => (
                <Badge key={i} className="text-[10px] bg-red-100 text-red-700 border-red-200">{api} ×{count}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Routing matrix (top destinations) ────────────────────────── */}
        {topDestinations.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Top destinations</p>
            {topDestinations.map(([dest, count], i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-32 truncate text-[var(--cs-text-secondary)]">{dest}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-brand/60" style={{ width: `${Math.min(100, (count / (o.total_events || 1)) * 100)}%` }} />
                </div>
                <span className="w-6 text-right tabular-nums text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Routing Intelligence
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
