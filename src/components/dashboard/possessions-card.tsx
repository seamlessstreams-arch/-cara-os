"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POSSESSIONS & PROPERTY INTELLIGENCE CARD
// Dashboard card powered by the Possessions Intelligence Engine.
// Reg 20 (children's belongings), Reg 36 (records), SCCIF Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package, ChevronRight, AlertTriangle, Brain,
  ShieldCheck, Archive, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePossessionsIntelligence } from "@/hooks/use-possessions-intelligence";

// ���─ Styling ─────────────────────────────────────────────────────────────────

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

export function PossessionsCard() {
  const { data, isLoading } = usePossessionsIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="h-4 w-4 text-brand" />
            Possessions & Property
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
            <Package className="h-4 w-4 text-brand" />
            Possessions & Property
          </CardTitle>
          <Link href="/personal-belongings" className="text-xs text-brand hover:underline flex items-center gap-1">
            Inventory <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              {o.total_items}
            </p>
            <p className="text-[10px] text-muted-foreground">Items</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.photo_compliance_rate >= 90 ? "bg-green-50" : o.photo_compliance_rate >= 70 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.photo_compliance_rate >= 90 ? "text-green-600" : o.photo_compliance_rate >= 70 ? "text-amber-600" : "text-red-600",
            )}>
              {o.photo_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Photos</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.missing_items === 0 ? "bg-green-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.missing_items === 0 ? "text-green-600" : "text-red-600",
            )}>
              {o.missing_items}
            </p>
            <p className="text-[10px] text-muted-foreground">Missing</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              £{o.total_value_estimate.toLocaleString()}
            </p>
            <p className="text-[10px] text-muted-foreground">Value</p>
          </div>
        </div>

        {/* ── Category breakdown ──────────────────────────────────────── */}

        {intel.category_breakdown.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Archive className="h-3 w-3" />
              By Category
            </p>
            {intel.category_breakdown.map((c) => (
              <div key={c.category} className="flex items-center justify-between rounded border p-2 text-xs">
                <span className="truncate flex-1">{c.category_label}</span>
                <div className="flex items-center gap-1.5 ml-2">
                  <Badge variant="outline" className="text-[10px] tabular-nums">{c.count}</Badge>
                  {c.missing_count > 0 && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">{c.missing_count} missing</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Child inventories ───────────────────────────────────────── */}

        {intel.child_inventories.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Child Inventories
            </p>
            {intel.child_inventories.map((ci) => (
              <div key={ci.child_id} className="flex items-center justify-between rounded border p-2 text-xs">
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium truncate">{ci.child_name}</span>
                  <span className="text-muted-foreground">({ci.total_items} items)</span>
                </div>
                <div className="flex items-center gap-1.5 ml-2">
                  {ci.missing_count > 0 && (
                    <Badge className="text-[10px] bg-red-100 text-red-700">{ci.missing_count} missing</Badge>
                  )}
                  <Badge className={cn(
                    "text-[10px]",
                    ci.items_with_photos === ci.total_items ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                  )}>
                    {ci.items_with_photos}/{ci.total_items} photos
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Key metrics ─────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="font-bold text-slate-700 tabular-nums">{o.avg_items_per_child.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Avg/Child</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.damaged_items > 0 ? "text-amber-600" : "text-green-600")}>
              {o.damaged_items}
            </p>
            <p className="text-[10px] text-muted-foreground">Damaged</p>
          </div>
          <div>
            <p className={cn("font-bold tabular-nums", o.insurance_rate >= 50 ? "text-green-600" : "text-amber-600")}>
              {o.insurance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Insured</p>
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Property Alerts
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

        {/* ── ARIA Possessions Intelligence ───────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Possessions Intelligence
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
