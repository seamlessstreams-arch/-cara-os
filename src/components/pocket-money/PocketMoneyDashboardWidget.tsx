// ══════════════════════════════════════════════════════════════════════════════
// PocketMoneyDashboardWidget — Pocket Money & Savings dashboard card
// ══════════════════════════════════════════════════════════════════════════════

"use client";

import { useEffect, useState } from "react";

interface ChildStatus {
  childId: string;
  childName: string;
  age: number;
  financialWellbeingScore: number;
  isCompliant: boolean;
  pocketMoneyOnTime: boolean;
  savingsBalance: number;
  issues: string[];
}

interface RecentTransaction {
  id: string;
  childName: string;
  type: string;
  amount: number;
  date: string;
  receiptRecorded: boolean;
}

interface Metrics {
  overallFinancialScore: number;
  pocketMoneyComplianceRate: number;
  savingsAccountRate: number;
  averageSavingsBalance: number;
  receiptComplianceRate: number;
  clothingAllowanceUtilisation: number;
  literacySessionRate: number;
  totalSpend30Days: number;
}

interface DashboardData {
  metrics: Metrics;
  children: ChildStatus[];
  recentTransactions: RecentTransaction[];
  complianceIssues: string[];
}

interface Props {
  homeId?: string;
}

const TYPE_LABELS: Record<string, string> = {
  pocket_money: "Pocket Money",
  savings_deposit: "Savings",
  clothing_allowance: "Clothing",
  birthday_money: "Birthday",
  festival_money: "Festival",
  activity_money: "Activity",
  travel_money: "Travel",
  personal_purchase: "Purchase",
  educational_expense: "Education",
};

export function PocketMoneyDashboardWidget({ homeId = "home-oak" }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [homeId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/pocket-money?homeId=${homeId}&mode=dashboard`);
      const json = await res.json();
      setData(json);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 animate-pulse">
        <div className="h-4 w-36 bg-muted rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-muted rounded" />
          <div className="h-3 w-3/4 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { metrics, children, recentTransactions, complianceIssues } = data;

  const scoreColor = metrics.overallFinancialScore >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : metrics.overallFinancialScore >= 60
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";

  return (
    <div className="rounded-lg border border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold">Pocket Money</h3>
              <p className="text-xs text-muted-foreground">Savings & allowances</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-lg font-bold ${scoreColor}`}>
              {metrics.overallFinancialScore}%
            </p>
            <p className="text-[10px] text-muted-foreground">score</p>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="p-3 text-center">
          <p className={`text-lg font-bold ${metrics.pocketMoneyComplianceRate === 100 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
            {metrics.pocketMoneyComplianceRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">On time</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold">{metrics.savingsAccountRate}%</p>
          <p className="text-[10px] text-muted-foreground">Savings accts</p>
        </div>
        <div className="p-3 text-center">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.receiptComplianceRate}%
          </p>
          <p className="text-[10px] text-muted-foreground">Receipted</p>
        </div>
      </div>

      {/* Per-child status */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Per Child</p>
        </div>
        <div className="px-4 py-2 space-y-2">
          {children.map(child => (
            <div key={child.childId} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-medium truncate">{child.childName}</span>
                  <span className="text-[9px] text-muted-foreground">({child.age})</span>
                  {!child.pocketMoneyOnTime && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 font-medium">
                      Owed
                    </span>
                  )}
                  {!child.isCompliant && (
                    <span className="text-[9px] px-1 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 font-medium">
                      Issues
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      child.financialWellbeingScore >= 80
                        ? "bg-emerald-500"
                        : child.financialWellbeingScore >= 60
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${child.financialWellbeingScore}%` }}
                  />
                </div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  {child.savingsBalance > 0 ? `£${child.savingsBalance}` : "—"}
                </p>
                <p className="text-[9px] text-muted-foreground">savings</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div className="border-b border-border">
        <div className="px-4 py-2 bg-muted/30">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Recent Transactions</p>
        </div>
        <div className="px-4 py-2 space-y-1">
          {recentTransactions.slice(0, 5).map(txn => (
            <div key={txn.id} className="flex items-center justify-between text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">
                  {new Date(txn.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </span>
                <span className="font-medium truncate max-w-[80px]">{txn.childName}</span>
                <span className="text-muted-foreground">{TYPE_LABELS[txn.type] || txn.type}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium">£{txn.amount}</span>
                {!txn.receiptRecorded && (
                  <span className="text-[8px] text-amber-600">No receipt</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="px-4 py-2.5 border-b border-border">
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Avg savings balance</span>
          <span className="font-medium">£{metrics.averageSavingsBalance}</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Clothing utilisation</span>
          <span className="font-medium">{metrics.clothingAllowanceUtilisation}%</span>
        </div>
        <div className="flex justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">Literacy sessions/child/qtr</span>
          <span className={`font-medium ${metrics.literacySessionRate >= 3 ? "text-emerald-600" : "text-amber-600"}`}>
            {metrics.literacySessionRate}
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-muted-foreground">Total spend (30d)</span>
          <span className="font-medium">£{metrics.totalSpend30Days.toFixed(0)}</span>
        </div>
      </div>

      {/* Compliance issues */}
      {complianceIssues.length > 0 && (
        <div className="px-4 py-2.5 border-b border-border bg-red-50 dark:bg-red-950/20">
          <p className="text-[10px] font-medium text-red-700 dark:text-red-400 mb-1">Compliance Issues</p>
          {complianceIssues.map((issue, i) => (
            <p key={i} className="text-[10px] text-red-600 dark:text-red-400">
              {issue}
            </p>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="p-3 text-center">
        <a href="/pocket-money" className="text-xs text-primary font-medium hover:underline">
          View financial records →
        </a>
      </div>
    </div>
  );
}
