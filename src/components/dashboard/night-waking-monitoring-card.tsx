"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — NIGHT WAKING MONITORING CARD
// Dashboard card powered by the Night Monitoring Intelligence Engine.
// CHR 2015 Reg 12/24/25. SCCIF: Overall Experiences — Night care.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Moon, ChevronRight, AlertTriangle, Brain,
  Lock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNightMonitoring } from "@/hooks/use-night-monitoring";

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

// ── Component ───────────────────────────────────────────────────────────────

export function NightWakingMonitoringCard() {
  const { data, isLoading } = useNightMonitoring();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Night Waking Monitoring
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
  const sec = intel.security;
  const disturbed = intel.child_profiles.filter((cp) => cp.sleep_pattern === "disturbed").length;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Moon className="h-4 w-4 text-brand" />
            Night Waking Monitoring
          </CardTitle>
          <Link href="/night-checks" className="text-xs text-brand hover:underline flex items-center gap-1">
            Nights <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.total_rounds_7d}</p>
            <p className="text-[10px] text-muted-foreground">Rounds/7d</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", disturbed === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", disturbed === 0 ? "text-green-600" : "text-red-600")}>{disturbed}</p>
            <p className="text-[10px] text-muted-foreground">Disturbed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", o.concern_count_7d === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", o.concern_count_7d === 0 ? "text-green-600" : "text-amber-600")}>{o.concern_count_7d}</p>
            <p className="text-[10px] text-muted-foreground">Concerns</p>
          </div>
          <div className={cn("text-center rounded-lg p-2.5", sec.overall_compliance_rate >= 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", sec.overall_compliance_rate >= 100 ? "text-green-600" : "text-amber-600")}>{sec.overall_compliance_rate}%</p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
        </div>

        {/* ── Security ────────────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Lock className="h-3 w-3 text-blue-500" />
            Night Security
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Doors locked: {sec.rounds_with_doors_locked}/{sec.total_rounds}</span>
            <span className={sec.rounds_with_doors_locked === sec.total_rounds ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
              {sec.rounds_with_doors_locked === sec.total_rounds ? "All secure" : "Gaps found"}
            </span>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Night Alerts
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

        {/* ── ARIA Intelligence ───────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Night Intelligence
            </p>
            {intel.insights.slice(0, 2).map((insight, i) => (
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
