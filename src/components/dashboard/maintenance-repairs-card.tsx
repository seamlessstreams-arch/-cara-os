"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MAINTENANCE & REPAIRS INTELLIGENCE CARD
// Dashboard card powered by the Premises Safety Intelligence Engine.
// CHR 2015 Reg 36, Reg 25, Reg 13.
// SCCIF: Helped & Protected — "Premises are well maintained."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench, ChevronRight, AlertTriangle, Brain,
  HardHat, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePremisesSafetyIntelligence } from "@/hooks/use-premises-safety-intelligence";

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

export function MaintenanceRepairsCard() {
  const { data, isLoading } = usePremisesSafetyIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wrench className="h-4 w-4 text-brand" />
            Maintenance & Repairs
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
            <Wrench className="h-4 w-4 text-brand" />
            Maintenance & Repairs
          </CardTitle>
          <Link href="/buildings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Premises <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.maintenance_open === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.maintenance_open === 0 ? "text-green-600" : "text-amber-600",
            )}>
              {o.maintenance_open}
            </p>
            <p className="text-[10px] text-muted-foreground">Open</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.maintenance_urgent === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.maintenance_urgent === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.maintenance_urgent}
            </p>
            <p className="text-[10px] text-muted-foreground">Urgent</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_checks}
            </p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.compliance_rate >= 90 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.compliance_rate >= 90 ? "text-green-600" : "text-amber-600",
            )}>
              {o.compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Compliance</p>
          </div>
        </div>

        {/* ── Maintenance analysis by category ───────────────────────── */}

        {intel.maintenance_analysis.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <HardHat className="h-3 w-3" />
              Maintenance by Category
            </p>
            {intel.maintenance_analysis.map((m) => (
              <div key={m.category} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium truncate">{m.category}</span>
                  <span className="text-muted-foreground tabular-nums">{m.completed}/{m.total}</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {m.open > 0 && (
                    <Badge variant="outline" className="text-[10px] tabular-nums">{m.open} open</Badge>
                  )}
                  {m.urgent_count > 0 && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">{m.urgent_count} urgent</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Maintenance Alerts
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

        {/* ── ARIA Intelligence ──────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Maintenance Intelligence
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
