"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — RECORDING QUALITY INTELLIGENCE CARD
// Dashboard card powered by the Recording Quality Intelligence Engine.
// Reg 36 (records), SCCIF (evidence of day-to-day experiences).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PenLine, ChevronRight, AlertTriangle, Brain,
  FileText, TrendingUp, CheckCircle2, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecordingQualityIntelligence } from "@/hooks/use-recording-quality-intelligence";

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

const QUALITY_BAR_COLOURS: Record<string, string> = {
  excellent: "bg-green-500",
  good: "bg-blue-400",
  adequate: "bg-amber-400",
  poor: "bg-red-400",
};

const TREND_CONFIG: Record<string, { icon: typeof TrendingUp; colour: string }> = {
  improving: { icon: TrendingUp, colour: "text-green-600" },
  stable: { icon: CheckCircle2, colour: "text-gray-500" },
  declining: { icon: AlertTriangle, colour: "text-red-600" },
};

// ── Component ───────────────────────────────────────────────────────────────

export function RecordingQualityCard() {
  const { data, isLoading } = useRecordingQualityIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenLine className="h-4 w-4 text-brand" />
            Recording Quality
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
  const qb = intel.quality_breakdown;
  const maxQuality = Math.max(qb.excellent, qb.good, qb.adequate, qb.poor, 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PenLine className="h-4 w-4 text-brand" />
            Recording Quality
          </CardTitle>
          <Link href="/daily-log" className="text-xs text-brand hover:underline flex items-center gap-1">
            Daily Records <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_entries}
            </p>
            <p className="text-[10px] text-muted-foreground">Entries</p>
          </div>
          <div className="text-center rounded-lg bg-indigo-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-indigo-600">
              {o.entries_last_7_days}
            </p>
            <p className="text-[10px] text-muted-foreground">Last 7d</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.mood_capture_rate >= 80 ? "bg-green-50" : o.mood_capture_rate >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.mood_capture_rate >= 80 ? "text-green-600" : o.mood_capture_rate >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.mood_capture_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Mood</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.entry_type_coverage >= 80 ? "bg-green-50" : o.entry_type_coverage >= 60 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.entry_type_coverage >= 80 ? "text-green-600" : o.entry_type_coverage >= 60 ? "text-amber-600" : "text-red-600",
            )}>
              {o.entry_type_coverage}%
            </p>
            <p className="text-[10px] text-muted-foreground">Type Cov</p>
          </div>
        </div>

        {/* ── Quality distribution ─────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Quality Distribution</p>
          {(["excellent", "good", "adequate", "poor"] as const).map((level) => {
            const count = qb[level];
            const pct = (count / maxQuality) * 100;
            return (
              <div key={level} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 text-right capitalize">{level}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={cn("h-full rounded-full", QUALITY_BAR_COLOURS[level])} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        {/* ── Staff profiles ───────────────────────────────────────────── */}

        {intel.staff_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Staff Recording Profiles
            </p>
            {intel.staff_profiles.slice(0, 5).map((sp) => {
              const trend = TREND_CONFIG[sp.trend] ?? TREND_CONFIG.stable;
              const TIcon = trend.icon;
              return (
                <div key={sp.staff_id} className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <TIcon className={cn("h-3 w-3 flex-shrink-0", trend.colour)} />
                    <span className="font-medium truncate">{sp.staff_name}</span>
                    <span className="text-muted-foreground">({sp.total_records})</span>
                  </div>
                  <Badge className={cn(
                    "text-[10px] flex-shrink-0",
                    sp.quality_label === "Excellent" ? "bg-green-100 text-green-700"
                      : sp.quality_label === "Good" ? "bg-blue-100 text-blue-700"
                      : sp.quality_label === "Adequate" ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700",
                  )}>
                    {sp.quality_label}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Child coverage ──────────────────────────────────────────── */}

        {intel.child_coverage.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Child Coverage (7d)
            </p>
            {intel.child_coverage.map((cc) => (
              <div key={cc.child_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{cc.child_name}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{cc.entries_last_7_days} entries</Badge>
                  {cc.days_without_entry > 2 && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">{cc.days_without_entry}d gap</Badge>
                  )}
                  {cc.has_entry_today && (
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.avg_entries_per_day.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Avg/Day</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.avg_content_length}</p>
            <p className="text-[10px] text-muted-foreground">Avg Words</p>
          </div>
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.significant_events_count}</p>
            <p className="text-[10px] text-muted-foreground">Significant</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Recording Alerts
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

        {/* ── ARIA Recording Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Recording Intelligence
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
