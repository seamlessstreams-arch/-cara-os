"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — INCIDENT ANALYTICS CARD
// Dashboard widget showing incident trends, severity breakdown, category
// analysis, per-child profiles, oversight compliance, and ARIA intelligence.
// Powered by the Incident Analytics Engine — live data.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity, ChevronRight, TrendingDown, TrendingUp,
  Minus, Brain, Bell, Shield, AlertTriangle, CheckCircle2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIncidentAnalytics } from "@/hooks/use-incident-analytics";

// ── Styling maps ────────────────────────────────────────────────────────────

const SEVERITY_BAR: Record<string, string> = {
  critical: "bg-red-600",
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-green-400",
};

const TREND_COLOUR: Record<string, { text: string; bg: string; icon: typeof TrendingUp }> = {
  increasing: { text: "text-red-600", bg: "bg-red-50", icon: TrendingUp },
  stable: { text: "text-gray-600", bg: "bg-gray-50", icon: Minus },
  decreasing: { text: "text-green-600", bg: "bg-green-50", icon: TrendingDown },
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  positive: "border-green-200 bg-green-50 text-green-800",
};

// ── Component ────────────────────────────────────────────────────────────────

export function IncidentAnalyticsCard() {
  const { data, isLoading } = useIncidentAnalytics();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Incident Analytics
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

  const s = intel.summary;
  const tColour = TREND_COLOUR[s.trend_direction] ?? TREND_COLOUR.stable;
  const TrendIcon = tColour.icon;
  const maxSev = Math.max(intel.severity.critical, intel.severity.high, intel.severity.medium, intel.severity.low, 1);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand" />
            Incident Analytics
          </CardTitle>
          <Link href="/incidents" className="text-xs text-brand hover:underline flex items-center gap-1">
            All Incidents <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Headline strip ───────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{s.total_30d}</p>
            <p className="text-[10px] text-muted-foreground">This Month</p>
          </div>
          <div className="text-center rounded-lg bg-gray-50 p-2.5">
            <p className="text-lg font-bold tabular-nums">{s.average_per_week_30d}</p>
            <p className="text-[10px] text-muted-foreground">Per Week</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", tColour.bg)}>
            <div className="flex items-center justify-center gap-1">
              <TrendIcon className={cn("h-4 w-4", tColour.text)} />
              <span className={cn("text-sm font-bold", tColour.text)}>
                {Math.abs(s.percentage_change)}%
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground capitalize">{s.trend_direction}</p>
          </div>
        </div>

        {/* ── Severity breakdown ───────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">Severity (90 days)</p>
          {(["critical", "high", "medium", "low"] as const).map((sev) => {
            const count = intel.severity[sev];
            const pct = (count / maxSev) * 100;
            return (
              <div key={sev} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 text-right capitalize">{sev}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", SEVERITY_BAR[sev])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums w-4 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        {/* ── Top categories ───────────────────────────────────────────── */}

        {intel.categories.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Top Categories</p>
            {intel.categories.slice(0, 4).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs px-1">
                <span>{cat.label}</span>
                <span className="font-bold tabular-nums">{cat.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Per-child breakdown ─────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="rounded-lg border p-3 space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1">
              <Shield className="h-3 w-3 text-brand" />
              Per-Child (90 days)
            </p>
            <div className="space-y-1">
              {intel.child_profiles.slice(0, 4).map((cp) => (
                <div key={cp.child_id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cp.child_name}</span>
                    <span className="text-[10px] text-muted-foreground">{cp.top_type}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold tabular-nums">{cp.count_90d}</span>
                    <Badge className={cn(
                      "text-[9px]",
                      cp.highest_severity === "critical" ? "bg-red-100 text-red-700"
                        : cp.highest_severity === "high" ? "bg-orange-100 text-orange-700"
                        : "bg-gray-100 text-gray-600",
                    )}>
                      {cp.highest_severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Oversight compliance ──────────────────────────────────────── */}

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <Bell className={cn("h-4 w-4", intel.oversight.oversight_pending > 0 ? "text-amber-500" : "text-green-500")} />
            <div>
              <p className="text-xs font-medium">Management Oversight</p>
              <p className="text-[10px] text-muted-foreground">
                {intel.oversight.oversight_completed}/{intel.oversight.total_requiring_oversight} reviewed
              </p>
            </div>
          </div>
          {intel.oversight.oversight_pending > 0 ? (
            <Badge className="text-[10px] bg-amber-100 text-amber-700">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              {intel.oversight.oversight_pending} pending
            </Badge>
          ) : intel.oversight.total_requiring_oversight > 0 ? (
            <Badge className="text-[10px] bg-green-100 text-green-700">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              All reviewed
            </Badge>
          ) : (
            <Badge className="text-[10px] bg-gray-100 text-gray-600">
              None required
            </Badge>
          )}
        </div>

        {/* ── ARIA insights ───────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Pattern Intelligence
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
