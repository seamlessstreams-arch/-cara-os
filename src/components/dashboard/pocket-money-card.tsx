"use client";

// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POCKET MONEY & SAVINGS INTELLIGENCE CARD
// Dashboard card for children's finances, pocket money, savings,
// spending patterns, and ARIA financial intelligence.
// CHR 2015 Reg 37 (children's money), Reg 7 (children's views),
// Reg 14 (care planning — financial provisions).
// SCCIF: Children's Experiences.
// ══════════════════════════════════════════════════════════════════════════════

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PiggyBank, ChevronRight, AlertTriangle, Brain,
  Wallet, TrendingUp, ClipboardCheck, Coins,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_METRICS = {
  children_with_profiles: 5,
  total_children: 5,
  total_pocket_money_balance: 67.50,
  total_savings_balance: 342.80,
  avg_weekly_pocket_money: 8.50,
  transactions_this_month: 34,
  audit_compliance: 100,
  children_with_bank_accounts: 3,
};

const DEMO_CHILDREN = [
  { name: "Child A", pocketMoney: 15.00, savings: 120.00, weeklyRate: 10.00, literacy: "competent" },
  { name: "Child B", pocketMoney: 22.50, savings: 85.50, weeklyRate: 8.00, literacy: "developing" },
  { name: "Child C", pocketMoney: 8.00, savings: 67.30, weeklyRate: 8.00, literacy: "developing" },
  { name: "Child D", pocketMoney: 12.00, savings: 45.00, weeklyRate: 7.50, literacy: "emerging" },
  { name: "Child E", pocketMoney: 10.00, savings: 25.00, weeklyRate: 9.00, literacy: "emerging" },
];

const DEMO_SPENDING = [
  { category: "Entertainment", amount: 42.50, pct: 32 },
  { category: "Food & Drink", amount: 28.00, pct: 21 },
  { category: "Clothing", amount: 22.00, pct: 17 },
  { category: "Technology", amount: 18.50, pct: 14 },
  { category: "Other", amount: 21.00, pct: 16 },
];

const DEMO_ALERTS: { type: string; severity: "critical" | "high" | "medium" | "low"; message: string }[] = [
  { type: "savings_goal", severity: "medium", message: "Child A is £30 away from their savings goal of £150 for a new bike — consider discussing at next key work session." },
];

const ARIA_INSIGHTS = [
  "All 5 children have financial profiles with weekly pocket money ranging from £7.50 to £10.00. Total savings across the home: £342.80. 3 children have bank accounts. 34 transactions this month — all properly authorised and witnessed. Financial audit: 100% compliant.",
  "Spending patterns: entertainment is the top category (32%), followed by food & drink (21%). Child B is the most active saver, depositing £5/week consistently. Child A is close to their savings goal (£120/£150). Financial literacy: 1 competent, 2 developing, 2 emerging — age-appropriate progression.",
  "Trend: children's financial autonomy is increasing. Child A now manages their own weekly budget independently. Child B and C are learning to compare prices when shopping. All pocket money paid on time — no missed weeks this quarter. Strong Reg 37 compliance — transparent records, regular audits, and children's views on their finances are actively sought.",
];

const literacyColor: Record<string, string> = {
  not_assessed: "bg-gray-100 text-gray-700",
  emerging: "bg-amber-100 text-amber-700",
  developing: "bg-blue-100 text-blue-700",
  competent: "bg-green-100 text-green-700",
  independent: "bg-purple-100 text-purple-700",
};

// ── Component ────────────────────────────────────────────────────────────────

export function PocketMoneyCard() {
  const m = DEMO_METRICS;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <PiggyBank className="h-4 w-4 text-brand" />
            Pocket Money &amp; Savings
          </CardTitle>
          <Link href="/pocket-money" className="text-xs text-brand hover:underline flex items-center gap-1">
            Finances <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">

        {/* ── Summary strip ────────────────────────────────────────────── */}

        <div className="grid grid-cols-4 gap-2">
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">£{m.total_pocket_money_balance.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Pocket Money</p>
          </div>
          <div className="text-center rounded-lg bg-green-50 p-2">
            <p className="text-lg font-bold tabular-nums text-green-600">£{m.total_savings_balance.toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground">Savings</p>
          </div>
          <div className="text-center rounded-lg bg-blue-50 p-2">
            <p className="text-lg font-bold tabular-nums text-blue-600">{m.transactions_this_month}</p>
            <p className="text-[10px] text-muted-foreground">Transactions</p>
          </div>
          <div className={cn("text-center rounded-lg p-2", m.audit_compliance === 100 ? "bg-green-50" : "bg-amber-50")}>
            <p className={cn("text-lg font-bold tabular-nums", m.audit_compliance === 100 ? "text-green-600" : "text-amber-600")}>
              {m.audit_compliance}%
            </p>
            <p className="text-[10px] text-muted-foreground">Audit</p>
          </div>
        </div>

        {/* ── Children's balances ─────────────────────────────────────── */}

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
            <Wallet className="h-3 w-3" />
            Children&apos;s Finances
          </p>
          {DEMO_CHILDREN.map((c) => (
            <div key={c.name} className="flex items-center justify-between rounded border p-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">{c.name}</span>
                <Badge className={cn("text-[10px]", literacyColor[c.literacy])}>
                  {c.literacy}
                </Badge>
              </div>
              <div className="flex items-center gap-2 tabular-nums">
                <span className="text-muted-foreground">£{c.pocketMoney.toFixed(2)}</span>
                <span className="text-green-600 font-semibold">£{c.savings.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Spending breakdown ──────────────────────────────────────── */}

        <div className="rounded-lg border p-3 space-y-1.5">
          <p className="text-xs font-semibold flex items-center gap-1">
            <Coins className="h-3 w-3 text-blue-500" />
            Spending This Month
          </p>
          <div className="space-y-1">
            {DEMO_SPENDING.map((s) => (
              <div key={s.category} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate">{s.category}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
                <span className="tabular-nums font-medium w-12 text-right">£{s.amount.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Key stats ───────────────────────────────────────────────── */}

        <div className="grid grid-cols-3 gap-2">
          <div className="text-center rounded border p-2">
            <p className="text-sm font-bold tabular-nums text-blue-600">£{m.avg_weekly_pocket_money.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Weekly</p>
          </div>
          <div className="text-center rounded border p-2">
            <p className="text-sm font-bold tabular-nums text-green-600">{m.children_with_bank_accounts}/{m.total_children}</p>
            <p className="text-[10px] text-muted-foreground">Bank Accounts</p>
          </div>
          <div className="text-center rounded border p-2">
            <TrendingUp className="h-4 w-4 mx-auto text-green-500" />
            <p className="text-[10px] text-muted-foreground">Savings Up</p>
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

        {/* ── ARIA insights ───────────────────────────────────────────── */}

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
