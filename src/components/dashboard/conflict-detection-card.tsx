"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CONFLICT DETECTION CARD
// The complement to duplicate detection: records that DISAGREE about the same
// child, time or situation — surfaced for human reconciliation, never auto-resolved.
// Powered by the Conflict Detection Engine.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, ChevronRight, Loader2, Brain, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConflictDetection } from "@/hooks/use-conflict-detection";

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

const SEV_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const CATEGORY_LABEL: Record<string, string> = {
  present_while_missing: "Care logged during missing episode",
  injury_contradiction: "Injury recorded then denied",
  conflicting_severity: "Same event graded differently",
  staff_unavailable_conflict: "Working while on leave",
};

export function ConflictDetectionCard() {
  const { data, isLoading } = useConflictDetection();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Conflict Detection
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
  const top = (intel.conflicts ?? []).slice(0, 4);
  const clean = o.conflicts_found === 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand" />
            Conflict Detection
          </CardTitle>
          <Link href="/conflict-detection" className="text-xs text-brand hover:underline flex items-center gap-1">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── KPI grid ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.total_events}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Events</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", clean ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", clean ? "text-green-600" : "text-amber-600")}>{o.conflicts_found}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">Conflicts</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.critical_or_high > 0 ? "bg-red-50" : "bg-gray-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.critical_or_high > 0 ? "text-red-600" : "text-gray-500")}>{o.critical_or_high}</p>
            <p className="text-[10px] text-[var(--cs-text-muted)]">High/Critical</p>
          </div>
        </div>

        {/* ── Top conflicts ─────────────────────────────────────────────── */}
        {top.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-[var(--cs-text-muted)] flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Records that disagree
            </p>
            {top.map((c) => (
              <div key={c.id} className="rounded-lg border p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--cs-text-secondary)] font-medium">{CATEGORY_LABEL[c.category] ?? c.category}</span>
                  <Badge className={cn("text-[9px] shrink-0 border", SEV_BADGE[c.severity])}>{c.severity}</Badge>
                </div>
                <p className="text-[11px] text-[var(--cs-text-muted)]">
                  {c.subject_name} — <span className="font-mono">{c.event_a.event_type}</span> vs <span className="font-mono">{c.event_b.event_type}</span>; needs human reconciliation.
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50/50 p-2.5 text-xs text-green-700 flex items-start gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            No contradictions — the record is internally consistent.
          </div>
        )}

        {/* ── ARIA insights ─────────────────────────────────────────────── */}
        {insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Conflict Intelligence
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
