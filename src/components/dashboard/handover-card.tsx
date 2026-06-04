"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — SHIFT HANDOVER INTELLIGENCE CARD
// Dashboard card powered by the Handover Continuity Intelligence Engine.
// CHR 2015 Reg 12, 13, 34 — care continuity, leadership, staffing records.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeftRight, ChevronRight, AlertTriangle,
  Brain, ClipboardCheck, ShieldAlert, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useHandoverContinuityIntelligence } from "@/hooks/use-handover-continuity-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  high:     "border-red-200 bg-red-50 text-red-800",
  medium:   "border-amber-200 bg-amber-50 text-amber-800",
  low:      "border-blue-200 bg-blue-50 text-blue-800",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning:  "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Quality bar helper ──────────────────────────────────────────────────────

function QualityBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-24 truncate">{label}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full",
            value >= 90 ? "bg-green-400" : value >= 75 ? "bg-amber-400" : "bg-red-400",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn(
        "w-8 text-right tabular-nums font-medium",
        value >= 90 ? "text-green-600" : value >= 75 ? "text-amber-600" : "text-red-600",
      )}>
        {value}%
      </span>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

export function HandoverCard() {
  const { data, isLoading } = useHandoverContinuityIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4 text-brand" />
            Shift Handovers
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
            <ArrowLeftRight className="h-4 w-4 text-brand" />
            Shift Handovers
          </CardTitle>
          <Link href="/handover" className="text-xs text-brand hover:underline flex items-center gap-1">
            Handovers <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.completion_rate >= 95 ? "bg-green-50" : o.completion_rate >= 80 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.completion_rate >= 95 ? "text-green-600" : o.completion_rate >= 80 ? "text-amber-600" : "text-red-600",
            )}>
              {o.completion_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Completed</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_handovers}
            </p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.sign_off_rate >= 90 ? "bg-green-50" : o.sign_off_rate >= 70 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.sign_off_rate >= 90 ? "text-green-600" : o.sign_off_rate >= 70 ? "text-amber-600" : "text-red-600",
            )}>
              {o.sign_off_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Signed Off</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-slate-600">
              {o.children_covered}
            </p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* ── Handover profiles ────────────────────────────────────────── */}

        {intel.handover_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" />
              Recent Handovers
            </p>
            {intel.handover_profiles.slice(0, 3).map((h) => (
              <div key={h.handover_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{h.shift_label}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge className={cn(
                      "text-[10px]",
                      h.is_completed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700",
                    )}>
                      {h.is_completed ? "Complete" : "Incomplete"}
                    </Badge>
                    {h.flag_count > 0 && (
                      <Badge className="text-[10px] bg-red-100 text-red-700">
                        {h.flag_count} flags
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {h.shift_date} · {h.child_update_count} child updates · {h.sign_off_count}/{h.incoming_count} signed
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Child mood summary ───────────────────────────────────────── */}

        {intel.child_mood_summary.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Child Mood Scores</p>
            {intel.child_mood_summary.slice(0, 4).map((c) => (
              <div key={c.child_id} className="flex items-center justify-between text-xs rounded border p-2">
                <span className="font-medium">{c.child_name}</span>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "tabular-nums font-bold",
                    c.avg_mood >= 7 ? "text-green-600" : c.avg_mood >= 5 ? "text-amber-600" : "text-red-600",
                  )}>
                    {c.avg_mood.toFixed(1)}
                  </span>
                  {c.total_alerts > 0 && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700">
                      {c.total_alerts} alerts
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Key indicators ──────────────────────────────────────────── */}

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded border p-2.5 text-xs">
            <ShieldAlert className={cn("h-4 w-4 shrink-0", o.total_flags > 0 ? "text-red-500" : "text-green-500")} />
            <div>
              <p className="font-medium">{o.total_flags} flags</p>
              <p className="text-[10px] text-muted-foreground">safeguarding/care</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded border p-2.5 text-xs">
            <Clock className="h-4 w-4 text-blue-500 shrink-0" />
            <div>
              <p className="font-medium">{o.total_incident_links} incidents</p>
              <p className="text-[10px] text-muted-foreground">linked to handovers</p>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Handover Alerts
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

        {/* ── ARIA Handover Intelligence ──────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Handover Intelligence
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
