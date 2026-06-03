"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILD PRIORITY (UNIFIED RISK) CARD
// One ranked list answering "who needs me most today, across all our
// intelligence — and why?" Fuses placement risk, complaints↔incident
// correlation, and medication-error involvement. Children flagged across
// multiple streams rise to the top. (Reg 12/13 — protection & oversight.)
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ListOrdered, ChevronRight, Brain, Loader2, Layers, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChildPriority } from "@/hooks/use-child-priority";

const BAND_STYLES: Record<string, { bg: string; text: string }> = {
  critical: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-amber-100", text: "text-amber-700" },
  medium: { bg: "bg-blue-100", text: "text-blue-700" },
  low: { bg: "bg-green-100", text: "text-green-700" },
};
const DOMAIN_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  placement: { bg: "bg-amber-50", text: "text-amber-700", label: "Placement" },
  complaints: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Complaints" },
  medication: { bg: "bg-rose-50", text: "text-rose-700", label: "Medication" },
};
const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

export function ChildPriorityCard() {
  const { data, isLoading } = useChildPriority();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-brand" />
            Child Priority — Unified Risk
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
  const insights = intel.insights ?? [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-brand" />
            Child Priority — Unified Risk
          </CardTitle>
          <Link href="/child-priority" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.children_analysed}</p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.critical_count > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.critical_count > 0 ? "text-red-600" : "text-green-600")}>{o.critical_count}</p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.high_count > 0 ? "bg-amber-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.high_count > 0 ? "text-amber-600" : "text-gray-500")}>{o.high_count}</p>
            <p className="text-[10px] text-muted-foreground">High</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.multi_domain_count > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.multi_domain_count > 0 ? "text-red-600" : "text-gray-500")}>{o.multi_domain_count}</p>
            <p className="text-[10px] text-muted-foreground">Multi-stream</p>
          </div>
        </div>

        {/* ── Ranked priority list ─────────────────────────────────────── */}
        {children.length > 0 && (
          <div className="space-y-1.5">
            {children.slice(0, 5).map((c) => {
              const band = BAND_STYLES[c.priority_band] ?? BAND_STYLES.low;
              return (
                <div key={c.child_id} className="rounded-lg border p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cs-navy)] text-white text-[10px] font-bold shrink-0">{c.rank}</span>
                      <span className="font-medium truncate">{c.child_name}</span>
                      {c.multi_domain && <Layers className="h-3 w-3 text-red-500 shrink-0" />}
                      {c.safeguarding && <ShieldAlert className="h-3 w-3 text-red-600 shrink-0" />}
                    </div>
                    <Badge className={cn("text-[10px] shrink-0", band.bg, band.text)}>
                      {c.priority_score} {c.priority_band}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {(c.domains ?? []).map((dm, i) => {
                      const ds = DOMAIN_STYLES[dm.domain] ?? { bg: "bg-gray-50", text: "text-gray-600", label: dm.domain };
                      return (
                        <Badge key={i} className={cn("text-[9px]", ds.bg, ds.text)}>
                          {ds.label} {dm.score}
                        </Badge>
                      );
                    })}
                  </div>
                  {c.top_action && (
                    <p className="text-[10px] text-muted-foreground mt-1.5 truncate">→ {c.top_action.action}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Unified Risk Intelligence
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
