"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — VISITOR MANAGEMENT INTELLIGENCE CARD
// Dashboard card for visitor logs, DBS verification, and safeguarding checks.
// CHR 2015 Reg 22, Reg 12, Reg 36.
// SCCIF: Helped & Protected — "Visitors are appropriately vetted."
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck, ChevronRight, AlertTriangle, Brain,
  Shield, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisitorsIntelligence } from "@/hooks/use-visitors-intelligence";

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

export function VisitorManagementCard() {
  const { data, isLoading } = useVisitorsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-brand" />
            Visitor Management
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
  const professionalRate =
    o.total_visits > 0
      ? Math.round((o.professional_visits / o.total_visits) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-brand" />
            Visitor Management
          </CardTitle>
          <Link href="/visitor-log" className="text-xs text-brand hover:underline flex items-center gap-1">
            Visitors <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.currently_signed_in === 0 ? "bg-green-50" : "bg-blue-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.currently_signed_in === 0 ? "text-green-600" : "text-blue-600",
            )}>
              {o.currently_signed_in}
            </p>
            <p className="text-[10px] text-muted-foreground">Signed In</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_visits}
            </p>
            <p className="text-[10px] text-muted-foreground">Total</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.dbs_compliance_rate === 100 ? "bg-green-50" : o.dbs_compliance_rate >= 90 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.dbs_compliance_rate === 100 ? "text-green-600" : o.dbs_compliance_rate >= 90 ? "text-amber-600" : "text-red-600",
            )}>
              {o.dbs_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">DBS</p>
          </div>
          <div className="text-center rounded-lg bg-emerald-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-emerald-600">
              {professionalRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Professional</p>
          </div>
        </div>

        {/* ── Category breakdown ───────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Visitor Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {intel.category_breakdown.map((cat) => (
                <Badge key={cat.category} variant="outline" className="text-[10px]">
                  {cat.category_label} ({cat.count})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* ── Child profiles ───────────────────────────────────────────── */}

        {intel.child_profiles.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Child Contact
            </p>
            {intel.child_profiles.slice(0, 5).map((c) => (
              <div key={c.child_id} className="rounded-lg border p-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{c.child_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-600">{c.total_visits} visits</span>
                    <span className="text-green-600 tabular-nums">{c.professional_visits}P</span>
                    <span className="text-blue-600 tabular-nums">{c.family_visits}F</span>
                  </div>
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
              Visitor Alerts
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

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Visitor Intelligence
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
