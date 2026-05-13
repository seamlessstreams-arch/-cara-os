"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSSESSIONS & PROPERTY INTELLIGENCE CARD
// Dashboard card for children's personal belongings, money management,
// inventory compliance, and ARIA possession intelligence.
// CHR 2015 Reg 21 (privacy & access), Reg 36 (records), SCCIF Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, ChevronRight, AlertTriangle, Brain,
  PoundSterling, ShieldCheck, Pen, Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_POSSESSION_METRICS = {
  total_items: 47,
  items_with_child: 38,
  items_in_safe: 5,
  items_lost_damaged: 2,
  items_returned: 2,
  signing_compliance: 72,
  total_estimated_value: 3245.5,
  children_with_records: 4,
  total_children: 5,
  money_children_count: 3,
  total_money_held: 87.5,
};

const DEMO_CATEGORY_BREAKDOWN = [
  { category: "Electronics & Devices", count: 8, value: 1850 },
  { category: "Clothing & Shoes", count: 14, value: 420 },
  { category: "Sentimental Items", count: 5, value: 0 },
  { category: "Toys & Games", count: 7, value: 185 },
  { category: "Books & Media", count: 6, value: 95 },
  { category: "Documents & ID", count: 3, value: 0 },
  { category: "Other Items", count: 4, value: 695.5 },
];

const DEMO_MONEY_BALANCES = [
  { child: "Child A", balance: 32.5 },
  { child: "Child B", balance: 45.0 },
  { child: "Child C", balance: 10.0 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "no_possession_record", severity: "high", message: "1 of 5 children has no possession records. An inventory must be completed on admission (Reg 21)." },
  { type: "unsigned_records", severity: "medium", message: "13 possession records missing signatures — Reg 21 requires proper documentation with child and staff sign-off." },
  { type: "lost_items", severity: "medium", message: "2 items recorded as lost. Investigate and document resolution." },
];

const ARIA_INSIGHTS = [
  "1 child has no possession records at all — Reg 21 requires an inventory on admission. Prioritise completing this before the next Reg 44 visit. Missing records are a common area of Ofsted scrutiny.",
  "Signing compliance at 72% is below the recommended 90% threshold. 13 records lack child and/or staff signatures. Schedule a session with each child to review and sign outstanding records. This demonstrates respect for personal property.",
  "Overall: 47 items tracked across 4 children. Total estimated value: £3,245.50. Electronics are the highest-value category (£1,850). 5 items in safe storage. 3 children have money held (£87.50 total). Money management records are up to date with regular reconciliation.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function PossessionsCard() {
  const p = DEMO_POSSESSION_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-brand" />
            Possessions & Property
          </CardTitle>
          <Link href="/possessions" className="text-xs text-brand hover:underline flex items-center gap-1">
            Inventory <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {p.total_items}
            </p>
            <p className="text-[10px] text-muted-foreground">Total Items</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", p.signing_compliance >= 90 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.signing_compliance >= 90 ? "text-green-600" : "text-amber-600")}>
              {p.signing_compliance}%
            </p>
            <p className="text-[10px] text-muted-foreground">Signed</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", p.items_lost_damaged === 0 ? "bg-green-50" : "bg-red-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.items_lost_damaged === 0 ? "text-green-600" : "text-red-600")}>
              {p.items_lost_damaged}
            </p>
            <p className="text-[10px] text-muted-foreground">Lost/Damaged</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", p.children_with_records === p.total_children ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", p.children_with_records === p.total_children ? "text-green-600" : "text-amber-600")}>
              {p.children_with_records}/{p.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* ── Status breakdown ────────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Archive className="h-3 w-3" />
            Item Status
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-blue-600">{p.items_with_child}</p>
              <p className="text-[10px] text-muted-foreground">With Child</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-indigo-600">{p.items_in_safe}</p>
              <p className="text-[10px] text-muted-foreground">In Safe</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-green-600">{p.items_returned}</p>
              <p className="text-[10px] text-muted-foreground">Returned</p>
            </div>
            <div className="text-center rounded border p-2">
              <p className="text-sm font-bold tabular-nums text-amber-600">
                £{p.total_estimated_value.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">Total Value</p>
            </div>
          </div>
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            By Category
          </p>
          {DEMO_CATEGORY_BREAKDOWN.map((c) => (
            <div key={c.category} className="flex items-center justify-between rounded border p-2 text-xs">
              <span className="truncate flex-1">{c.category}</span>
              <div className="flex items-center gap-1.5 ml-2">
                <Badge variant="outline" className="text-[10px] tabular-nums">{c.count}</Badge>
                {c.value > 0 && (
                  <Badge className="text-[10px] bg-slate-100 text-slate-600 tabular-nums">
                    £{c.value.toLocaleString()}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Money management ────────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <PoundSterling className="h-3 w-3 text-green-600" />
            Money Held
          </p>
          {DEMO_MONEY_BALANCES.map((m) => (
            <div key={m.child} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{m.child}</span>
              <span className="font-bold tabular-nums">£{m.balance.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between text-xs border-t pt-1.5 mt-1">
            <span className="font-semibold">Total held</span>
            <span className="font-bold tabular-nums text-green-600">
              £{p.total_money_held.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ── Signing compliance bar ──────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Pen className="h-3 w-3 text-blue-500" />
            Signing Compliance
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  p.signing_compliance >= 90 ? "bg-green-500" : p.signing_compliance >= 70 ? "bg-amber-500" : "bg-red-500",
                )}
                style={{ width: `${p.signing_compliance}%` }}
              />
            </div>
            <span className={cn(
              "text-xs font-bold tabular-nums",
              p.signing_compliance >= 90 ? "text-green-600" : p.signing_compliance >= 70 ? "text-amber-600" : "text-red-600",
            )}>
              {p.signing_compliance}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Both child and staff signatures recorded
          </p>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Possession Alerts
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
            ARIA Possessions Intelligence
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
