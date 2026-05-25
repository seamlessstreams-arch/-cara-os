"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHRONOLOGY INTELLIGENCE CARD
// Dashboard card showing children's chronology patterns, event timelines,
// category coverage, recording gaps, and ARIA chronology insights.
// Powered by the Chronology Intelligence Engine — live data (Reg 36).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen, ChevronRight, AlertTriangle, Brain,
  Loader2, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChronologyIntelligence } from "@/hooks/use-chronology-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const SIGNIFICANCE_BADGES: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  significant: "bg-amber-100 text-amber-700",
  routine: "bg-gray-100 text-gray-600",
};

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

const CATEGORY_COLOURS: Record<string, string> = {
  placement: "bg-blue-100 text-blue-700",
  education: "bg-green-100 text-green-700",
  health: "bg-purple-100 text-purple-700",
  safeguarding: "bg-red-100 text-red-700",
  missing: "bg-orange-100 text-orange-700",
  behaviour: "bg-amber-100 text-amber-700",
  review: "bg-indigo-100 text-indigo-700",
  contact: "bg-cyan-100 text-cyan-700",
  achievement: "bg-emerald-100 text-emerald-700",
  legal: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-600",
};

// ── Component ────────────────────────────────────────────────────────────────

export function SignificantEventsCard() {
  const { data, isLoading } = useChronologyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            Chronology Intelligence
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-brand" />
            Chronology Intelligence
          </CardTitle>
          <Link href="/chronology" className="text-xs text-brand hover:underline flex items-center gap-1">
            Timeline <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_events}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.critical_events_total > 0 ? "bg-red-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.critical_events_total > 0 ? "text-red-600" : "text-green-600")}>
              {o.critical_events_total}
            </p>
            <p className="text-[10px] text-muted-foreground">Critical</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.events_30d}</p>
            <p className="text-[10px] text-muted-foreground">30 Days</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{o.category_coverage}</p>
            <p className="text-[10px] text-muted-foreground">Categories</p>
          </div>
        </div>

        {/* ── Category breakdown ───────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Event Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {intel.category_breakdown.slice(0, 6).map((cat) => (
                <Badge key={cat.category} className={cn("text-[10px] capitalize", CATEGORY_COLOURS[cat.category] ?? CATEGORY_COLOURS.other)}>
                  {cat.category.replace("_", " ")} ({cat.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Child Chronology Profiles ─────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Child Chronologies
            </p>
            {intel.child_profiles.map((profile) => (
              <div key={profile.child_id} className="rounded-lg border p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{profile.child_name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] tabular-nums font-medium">{profile.total_events} events</span>
                    {profile.critical_count > 0 && (
                      <Badge className="text-[9px] bg-red-100 text-red-700">{profile.critical_count} critical</Badge>
                    )}
                    {profile.has_gap && (
                      <Badge className="text-[9px] bg-amber-100 text-amber-700">
                        <Clock className="h-2.5 w-2.5 mr-0.5" />{profile.days_since_last_entry}d gap
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-1 text-muted-foreground">
                  <span className="text-[10px]">{profile.placement_duration_days}d placed</span>
                  <span className="text-[10px]">{profile.recording_rate}/month</span>
                  <span className="text-[10px]">{profile.categories_covered.length} categories</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline ─────────────────────────────────────────────────── */}

        {intel.timeline.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Monthly Timeline</p>
            <div className="flex items-end gap-1">
              {[...intel.timeline].reverse().map((t) => {
                const maxCount = Math.max(...intel.timeline.map((p) => p.count), 1);
                const height = Math.max(12, (t.count / maxCount) * 40);
                return (
                  <div key={t.period} className="flex-1 flex flex-col items-center gap-0.5">
                    <span className="text-[9px] font-bold tabular-nums">{t.count}</span>
                    <div
                      className={cn("w-full rounded-sm", t.critical > 0 ? "bg-red-400" : "bg-blue-400")}
                      style={{ height: `${height}px` }}
                    />
                    <span className="text-[8px] text-muted-foreground">{t.period.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Chronology Alerts
            </p>
            {intel.alerts.slice(0, 3).map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.medium,
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA Chronology Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Chronology Intelligence
            </p>
            {intel.insights.slice(0, 3).map((insight, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  INSIGHT_STYLES[insight.severity] ?? INSIGHT_STYLES.positive,
                )}
              >
                {insight.text}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
