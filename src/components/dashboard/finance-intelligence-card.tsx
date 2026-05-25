"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FINANCIAL MANAGEMENT INTELLIGENCE CARD
// Dashboard card powered by the Finance Intelligence Engine.
// Reg 39 — financial management of children's money.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, ChevronRight, AlertTriangle,
  Brain, PiggyBank, Receipt, TrendingUp, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFinanceIntelligence } from "@/hooks/use-finance-intelligence";

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

export function FinanceIntelligenceCard() {
  const { data, isLoading } = useFinanceIntelligence();
  const intel = data?.data;

  if (isLoading || !intel) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand" />
            Financial Management
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
            <Wallet className="h-4 w-4 text-brand" />
            Financial Management
          </CardTitle>
          <Link href="/finance" className="text-xs text-brand hover:underline flex items-center gap-1">
            Finance <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              £{o.total_allowances_monthly}
            </p>
            <p className="text-[10px] text-muted-foreground">Monthly</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-green-600">
              £{Math.round(o.total_savings)}
            </p>
            <p className="text-[10px] text-muted-foreground">Savings</p>
          </div>
          <div className={cn(
            "text-center rounded-lg p-2.5",
            o.receipt_compliance_rate >= 90 ? "bg-green-50" : o.receipt_compliance_rate >= 80 ? "bg-amber-50" : "bg-red-50",
          )}>
            <p className={cn(
              "text-lg font-bold tabular-nums",
              o.receipt_compliance_rate >= 90 ? "text-green-600" : o.receipt_compliance_rate >= 80 ? "text-amber-600" : "text-red-600",
            )}>
              {o.receipt_compliance_rate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Receipts</p>
          </div>
          <div className="text-center rounded-lg bg-slate-50 p-2.5">
            <p className="text-lg font-bold tabular-nums text-slate-600">
              {o.total_children}
            </p>
            <p className="text-[10px] text-muted-foreground">Children</p>
          </div>
        </div>

        {/* ── Child spending & savings ──────────────────────────────────── */}

        {intel.child_spending.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Spending by Child (30 Days)
            </p>
            {intel.child_spending.slice(0, 4).map((child) => (
              <div key={child.child_id} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{child.child_name}</span>
                  <span className="text-muted-foreground">£{child.total_spending.toFixed(2)} spent</span>
                  {child.spending_above_average && (
                    <Badge className="text-[10px] bg-amber-100 text-amber-700">Above avg</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className="text-[10px] bg-green-100 text-green-700">
                    <PiggyBank className="h-2.5 w-2.5 mr-0.5" />
                    £{Math.round(child.total_savings)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    <Receipt className="h-2.5 w-2.5 mr-0.5" />
                    {child.receipt_rate}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Spending categories ──────────────────────────────────────── */}

        {intel.spending_categories.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Receipt className="h-3 w-3" />
              Spending Categories
            </p>
            <div className="space-y-1">
              {intel.spending_categories.slice(0, 6).map((cat) => (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-muted-foreground truncate capitalize">{cat.category.replace(/_/g, " ")}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${cat.percentage}%` }} />
                  </div>
                  <span className="w-14 text-right tabular-nums font-medium">£{Math.round(cat.total_amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {intel.alerts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Financial Alerts
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

        {/* ── ARIA Financial Intelligence ─────────────────────────────── */}

        {intel.insights.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold flex items-center gap-1 text-purple-700">
              <Brain className="h-3 w-3" />
              ARIA Financial Intelligence
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
