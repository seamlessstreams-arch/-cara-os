"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — DEPRIVATION OF LIBERTY INTELLIGENCE CARD
// Dashboard card for DoL orders, restrictions register, proportionality
// tracking, child consultation, and ARIA DoL intelligence.
// CHR 2015 Reg 20 (restraint & DoL), Reg 21 (privacy & access),
// SCCIF Helped & Protected, Children Act 1989.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock, ChevronRight, AlertTriangle, Brain,
  Scale, Eye, MessageSquare, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_DOL_METRICS = {
  active_orders: 1,
  pending_orders: 0,
  active_restrictions: 6,
  children_with_restrictions: 3,
  proportionality_rate: 83,
  child_consultation_rate: 67,
  social_worker_informed_rate: 83,
  overdue_reviews: 2,
};

const DEMO_ACTIVE_ORDERS = [
  { child: "Child B", type: "Inherent Jurisdiction", expiry: "2026-08-15", status: "active" },
];

const DEMO_RESTRICTION_TYPES = [
  { type: "Internet Access", count: 3, reviewed: 2 },
  { type: "Leave Home Unaccompanied", count: 2, reviewed: 1 },
  { type: "Mobile Phone", count: 2, reviewed: 2 },
  { type: "Contact with Person", count: 1, reviewed: 1 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "overdue_reviews", severity: "high", message: "2 restrictions have overdue reviews. All restrictions must be regularly reviewed for ongoing necessity and proportionality." },
  { type: "child_not_consulted", severity: "medium", message: "2 of 6 active restrictions have not recorded the child being consulted. Reg 21 requires the child's views to be sought." },
];

const ARIA_INSIGHTS = [
  "2 restriction reviews overdue — both for Child A (internet access and leave home unaccompanied). These restrictions were imposed 6 weeks ago. Review whether they remain necessary and proportionate. Document the child's views at the review.",
  "Active DoL order for Child B (Inherent Jurisdiction) — expires 15 Aug 2026. Next court review in 8 weeks. Conditions include supervised contact only and no overnight stays. IRM and Ofsted notified. Legal representative engaged.",
  "Overall: 6 active restrictions across 3 children. 83% proportionality rate, 67% child consultation rate. Internet restrictions most common (3). All restrictions have documented justification. Social workers informed for 5 of 6 restrictions. Improve child consultation rate — target 100%.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function DeprivationOfLibertyCard() {
  const d = DEMO_DOL_METRICS;

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
          <div className={cn("text-center rounded-lg p-2", d.active_orders === 0 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.active_orders === 0 ? "text-green-600" : "text-amber-600")}>
              {d.active_orders}
            </p>
            <p className="text-[10px] text-muted-foreground">DoL Orders</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{d.active_restrictions}</p>
            <p className="text-[10px] text-muted-foreground">Restrictions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", d.proportionality_rate >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.proportionality_rate >= 90 ? "text-green-600" : "text-amber-600")}>
              {d.proportionality_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Proportionate</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", d.overdue_reviews === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", d.overdue_reviews === 0 ? "text-green-600" : "text-red-600")}>
              {d.overdue_reviews}
            </p>
            <p className="text-[10px] text-muted-foreground">Reviews Due</p>
          </div>
        </div>

        {/* ── Active DoL orders ────────────────────────────────────────── */}

        {DEMO_ACTIVE_ORDERS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Scale className="h-3 w-3" />
              Active DoL Orders
            </p>
            {DEMO_ACTIVE_ORDERS.map((o, i) => (
              <div key={i} className="rounded border border-amber-200 bg-amber-50 p-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-800">{o.child}</span>
                  <Badge className="text-[10px] bg-amber-100 text-amber-700">{o.type}</Badge>
                </div>
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock className="h-3 w-3" />
                  <span>Expires {new Date(o.expiry).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Restrictions by type ────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Restrictions by Type
          </p>
          {DEMO_RESTRICTION_TYPES.map((r) => (
            <div key={r.type} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate flex-1">{r.type}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{r.count}</Badge>
                <Badge className={cn(
                  "text-[10px]",
                  r.reviewed === r.count ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                )}>
                  {r.reviewed}/{r.count} reviewed
                </Badge>
              </div>
            </div>
          ))}
        </div>

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
              <span className={cn("font-bold tabular-nums", d.child_consultation_rate >= 90 ? "text-green-600" : "text-amber-600")}>
                {d.child_consultation_rate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", d.child_consultation_rate >= 90 ? "bg-green-500" : "bg-amber-500")}
                  style={{ width: `${d.child_consultation_rate}%` }}
                />
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Social worker informed</span>
              <span className={cn("font-bold tabular-nums", d.social_worker_informed_rate >= 90 ? "text-green-600" : "text-amber-600")}>
                {d.social_worker_informed_rate}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn("h-full rounded-full", d.social_worker_informed_rate >= 90 ? "bg-green-500" : "bg-amber-500")}
                  style={{ width: `${d.social_worker_informed_rate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              DoL Alerts
            </p>
            {DEMO_ALERTS.map((alert, i) => (
              <div
                key={i}
                className={cn(
                  "rounded border p-2.5 text-xs leading-relaxed",
                  alert.severity === "critical" || alert.severity === "high"
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800",
                )}
              >
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* ── ARIA insights ────────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
            <Brain className="h-3 w-3" />
            ARIA DoL Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-red-200 bg-red-50 text-red-800"
                  : i === 1 ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-green-200 bg-green-50 text-green-800",
              )}
            >
              {insight}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
