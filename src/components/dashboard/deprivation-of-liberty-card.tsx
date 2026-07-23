"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CARA — DEPRIVATION OF LIBERTY INTELLIGENCE CARD
// Dashboard card powered by the DoL Intelligence Engine.
// Reg 20 (restraint & DoL), Reg 21 (privacy & access),
// SCCIF Helped & Protected, Children Act 1989.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock, ChevronRight, AlertTriangle, Brain,
  Scale, Eye, MessageSquare, Clock, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { meets, formatRate } from "@/lib/metrics/rate";
import { useDoLIntelligence } from "@/hooks/use-dol-intelligence";

// ── Styling ─────────────────────────────────────────────────────────────────

const ALERT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  high:     "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  medium:   "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  low:      "border-[--cs-info-soft] bg-[--cs-info-bg] text-[--cs-info]",
};

const INSIGHT_STYLES: Record<string, string> = {
  critical: "border-[--cs-risk-soft] bg-[--cs-risk-bg] text-[--cs-risk]",
  warning:  "border-[--cs-warning-soft] bg-[--cs-warning-bg] text-[--cs-warning]",
  positive: "border-[--cs-success-soft] bg-[--cs-success-bg] text-[--cs-success]",
};

// ── Component ───────────────────────────────────────────────────────────────

export function DeprivationOfLibertyCard() {
  const { data, isLoading } = useDoLIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4 text-brand" />
            DoL & Restrictions
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
            <Lock className="h-4 w-4 text-brand" />
            DoL & Restrictions
          </CardTitle>
          <Link href="/deprivation-of-liberty" className="text-xs text-brand hover:underline flex items-center gap-1">
            Register <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.active_orders === 0 ? "bg-green-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.active_orders === 0 ? "text-[--cs-success]" : "text-[--cs-warning]",
            )}>
              {o.active_orders}
            </p>
            <p className="text-[10px] text-muted-foreground">DoL Orders</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">{o.active_restrictions}</p>
            <p className="text-[10px] text-muted-foreground">Restrictions</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            meets(o.proportionality_rate, 90) ? "bg-green-50" : o.proportionality_rate === null ? "bg-slate-50" : "bg-amber-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              meets(o.proportionality_rate, 90) ? "text-[--cs-success]" : o.proportionality_rate === null ? "text-muted-foreground" : "text-[--cs-warning]",
            )}>
              {formatRate(o.proportionality_rate)}
            </p>
            <p className="text-[10px] text-muted-foreground">Proportionate</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.overdue_reviews === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.overdue_reviews === 0 ? "text-[--cs-success]" : "text-[--cs-risk]",
            )}>
              {o.overdue_reviews}
            </p>
            <p className="text-[10px] text-muted-foreground">Reviews Due</p>
          </div>
        </div>

        {/* ── Active DoL orders ────────────────────────────────────────── */}

        {intel.active_orders.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Active DoL Orders
            </p>
            {intel.active_orders.map((order) => (
              <div key={order.order_id} className="rounded border border-[--cs-warning-soft] bg-[--cs-warning-bg] p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[--cs-warning]">{order.child_name}</span>
                  <Badge className="text-[10px] bg-[--cs-warning-bg] text-[--cs-warning]">{order.type_label}</Badge>
                </div>
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-3 w-3" />
                  <span>Expires {new Date(order.expiry_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="font-medium">({order.days_until_expiry}d)</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Restrictions by type ────────────────────────────────────── */}

        {intel.restriction_types.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Restrictions by Type
            </p>
            {intel.restriction_types.map((r) => (
              <div key={r.restriction_type} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{r.type_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{r.count}</Badge>
                  <Badge className={cn(
                    "text-[10px]",
                    r.overdue_count === 0 ? "bg-[--cs-success-bg] text-[--cs-success]" : "bg-[--cs-warning-bg] text-[--cs-warning]",
                  )}>
                    {r.reviewed_on_time}/{r.count} reviewed
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Compliance metrics ──────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-2">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Eye className="h-3 w-3 text-blue-500" />
            Compliance
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Child consulted
              </span>
              <span className={cn("font-bold tabular-nums", meets(o.child_consultation_rate, 90) ? "text-[--cs-success]" : o.child_consultation_rate === null ? "text-muted-foreground" : "text-[--cs-warning]")}>
                {formatRate(o.child_consultation_rate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", meets(o.child_consultation_rate, 90) ? "bg-green-500" : "bg-amber-500")}
                  style={{ width: `${o.child_consultation_rate ?? 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Social worker informed</span>
              <span className={cn("font-bold tabular-nums", meets(o.social_worker_informed_rate, 90) ? "text-[--cs-success]" : o.social_worker_informed_rate === null ? "text-muted-foreground" : "text-[--cs-warning]")}>
                {formatRate(o.social_worker_informed_rate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", meets(o.social_worker_informed_rate, 90) ? "bg-green-500" : "bg-amber-500")}
                  style={{ width: `${o.social_worker_informed_rate ?? 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              DoL Alerts
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

        {/* ── Cara DoL Intelligence ──────────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              Cara DoL Intelligence
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
