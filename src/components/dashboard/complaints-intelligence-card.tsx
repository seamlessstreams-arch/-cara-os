"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS INTELLIGENCE CARD
// Dashboard card for complaints handling, theme patterns, satisfaction rates,
// and Reg 39/40 compliance. Powered by live intelligence engine data.
// ══════════════════════════════════════════════════════════════════════════════

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, Brain, Loader2, AlertTriangle, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useComplaintsIntelligence } from "@/hooks/use-complaints-intelligence";

// ── Styling maps ────────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export function ComplaintsIntelligenceCard() {
  const { data, isLoading } = useComplaintsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-brand" />
            Complaints Intelligence
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
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand" />
          Complaints Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{o.total_complaints}</p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", o.open_count > 0 ? "bg-amber-50" : "bg-green-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.open_count > 0 ? "text-amber-600" : "text-green-600")}>
              {o.open_count}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2">
            <p className="text-lg font-bold tabular-nums">{o.avg_response_days}d</p>
            <p className="text-[10px] text-muted-foreground">Avg Response</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", o.satisfaction_rate >= 80 ? "bg-green-50" : o.satisfaction_rate >= 50 ? "bg-amber-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.satisfaction_rate >= 80 ? "text-green-600" : o.satisfaction_rate >= 50 ? "text-amber-600" : "text-red-600")}>
              {o.satisfaction_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Satisfied</p>
          </div>
        </div>

        {/* ── Open complaints list ─────────────────────────────────────── */}

        {intel.open_complaints.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Open Complaints</p>
            {intel.open_complaints.map((c) => (
              <div
                key={c.complaint_id}
                className="flex items-center justify-between rounded-lg border p-2.5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className={cn("h-3.5 w-3.5 shrink-0", c.days_open > 20 ? "text-red-500" : c.days_open > 10 ? "text-amber-500" : "text-gray-400")} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{c.summary}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.theme.replace(/_/g, " ")} &middot; {c.source.replace(/_/g, " ")} &middot; {c.days_open}d open
                    </p>
                  </div>
                </div>
                <Badge className={cn("text-[10px] shrink-0 ml-2", c.days_open > 20 ? "bg-red-100 text-red-700" : c.days_open > 10 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600")}>
                  {c.days_open}d
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* ── Theme breakdown bars ─────────────────────────────────────── */}

        {intel.theme_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Themes</p>
            {intel.theme_breakdown.slice(0, 5).map((t) => (
              <div key={t.theme} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-xs">{t.theme_label}</span>
                  <span className="text-muted-foreground">{t.count} ({t.percentage}%)</span>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${t.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ───────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            {intel.alerts.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded border p-2.5 text-xs leading-relaxed",
                  ALERT_STYLES[alert.severity] ?? ALERT_STYLES.low,
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Complaints Intelligence
            </p>
            {intel.insights.map((insight, i) => (
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
