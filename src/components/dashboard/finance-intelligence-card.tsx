"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FINANCIAL MANAGEMENT INTELLIGENCE CARD
// Dashboard card for young person pocket money, allowances, savings,
// spending patterns, and ARIA financial intelligence (Reg 39).
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wallet, ChevronRight, AlertTriangle, CheckCircle2,
  Brain, PiggyBank, Receipt, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_OVERVIEW = {
  totalChildren: 4,
  totalAllowancesMonthly: 680,
  totalSavings: 1245.50,
  totalSpendingThisMonth: 412.30,
  consultationRate: 82.5,
  receiptComplianceRate: 91.2,
};

const CHILD_SPENDING = [
  { name: "Alex W", spending: 128.50, savings: 340.00, allowance: 170 },
  { name: "Tyler R", spending: 142.80, savings: 285.50, allowance: 170 },
  { name: "Jordan M", spending: 78.00, savings: 420.00, allowance: 170 },
  { name: "Casey L", spending: 63.00, savings: 200.00, allowance: 170 },
];

const SPENDING_CATEGORIES = [
  { category: "Clothing", amount: 124.50 },
  { category: "Entertainment", amount: 98.00 },
  { category: "Food/Treats", amount: 72.30 },
  { category: "Phone Credit", amount: 60.00 },
  { category: "Activities", amount: 42.50 },
  { category: "Transport", amount: 15.00 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "high_spending", severity: "medium", message: "Tyler R spending 16% above average this month (£142.80 vs avg £103.08). Review with key worker." },
  { type: "low_consultation", severity: "medium", message: "Child consultation rate 82.5% — below 90% target. Ensure children are involved in spending decisions." },
];

const ARIA_INSIGHTS = [
  "All 4 children have active pocket money and savings arrangements. Total monthly allowances of £680 are within budget. Savings balances range from £200 to £420 — all children building savings appropriately. Reg 39 financial management evidenced.",
  "Receipt compliance at 91.2% exceeds the 80% target. Child consultation rate at 82.5% — improve by recording child preferences before purchases. Tyler R's higher spending is mainly on clothing (seasonal wardrobe refresh).",
  "Positive: All children have savings accounts with regular contributions. No child has a zero savings balance. Financial records are auditable with 91.2% receipt coverage. Pocket money is distributed weekly as agreed in care plans.",
];

// ── Component ────────────────────────────────────────────────────────────────

export function FinanceIntelligenceCard() {
  const o = DEMO_OVERVIEW;

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
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">
              £{o.totalAllowancesMonthly}
            </p>
            <p className="text-[10px] text-muted-foreground">Monthly</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">
              £{o.totalSavings.toFixed(0)}
            </p>
            <p className="text-[10px] text-muted-foreground">Savings</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: o.consultationRate >= 90 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", o.consultationRate >= 90 ? "text-green-600" : "text-amber-600")}>
              {o.consultationRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Consulted</p>
          </div>
          <div className="text-center rounded-lg p-2" style={{ background: o.receiptComplianceRate >= 80 ? "hsl(var(--chart-2) / 0.1)" : "hsl(var(--destructive) / 0.08)" }}>
            <p className={cn("text-lg font-bold tabular-nums", o.receiptComplianceRate >= 80 ? "text-green-600" : "text-amber-600")}>
              {o.receiptComplianceRate}%
            </p>
            <p className="text-[10px] text-muted-foreground">Receipts</p>
          </div>
        </div>

        {/* ── Child spending & savings ──────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Spending by Child (This Month)
          </p>
          {CHILD_SPENDING.map((child) => (
            <div key={child.name} className="rounded-lg border p-2.5 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{child.name}</span>
                <span className="text-muted-foreground">£{child.spending.toFixed(2)} spent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Badge className="text-[10px] bg-green-100 text-green-700">
                  <PiggyBank className="h-2.5 w-2.5 mr-0.5" />
                  £{child.savings.toFixed(0)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* ── Spending categories ──────────────────────────────────────── */}

        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Receipt className="h-3 w-3" />
            Spending Categories
          </p>
          <div className="space-y-1">
            {SPENDING_CATEGORIES.map((cat) => {
              const pct = Math.round((cat.amount / o.totalSpendingThisMonth) * 100);
              return (
                <div key={cat.category} className="flex items-center gap-2 text-xs">
                  <span className="w-24 text-muted-foreground">{cat.category}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-14 text-right tabular-nums font-medium">£{cat.amount.toFixed(0)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Alerts ──────────────────────────────────────────────────── */}

        {DEMO_ALERTS.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Financial Alerts
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
            ARIA Financial Intelligence
          </p>
          {ARIA_INSIGHTS.map((insight, i) => (
            <div
              key={i}
              className={cn(
                "rounded border p-2.5 text-xs leading-relaxed",
                i === 0 ? "border-blue-200 bg-blue-50 text-blue-800"
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
