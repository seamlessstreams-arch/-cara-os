// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FINANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine — no DB calls, no side effects, no LLM calls.
// Analyses pocket money, clothing allowances, savings, and spending patterns
// for children in residential care.
//
// Regulatory context:
//   Reg 39 — Financial management of children's money
//   Children must be consulted about spending decisions
//   Receipts must be kept for all transactions
//   Savings should be encouraged
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface PocketMoneyTransactionInput {
  id: string;
  child_id: string;
  date: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  receipt_held: boolean;
  approved_by: string;
}

export interface ClothingAllowanceInput {
  id: string;
  child_id: string;
  financial_year: string;
  annual_budget: number;
  quarterly_allowance: number;
  current_quarter: number;
  quarter_spend: number;
  ytd_spend: number;
}

export interface ChildRef {
  id: string;
  name: string;
}

export interface StaffRef {
  id: string;
  name: string;
}

// ── Output Types ────────────────────────────────────────────────────────────

export interface FinanceIntelligenceResult {
  overview: FinanceOverview;
  child_spending: ChildSpendingProfile[];
  spending_categories: SpendingCategoryBreakdown[];
  alerts: FinanceAlert[];
  insights: AriaFinanceInsight[];
}

export interface FinanceOverview {
  total_children: number;
  total_allowances_monthly: number;
  total_savings: number;
  total_spending_this_period: number;
  receipt_compliance_rate: number;
  avg_spending_per_child: number;
}

export interface ChildSpendingProfile {
  child_id: string;
  child_name: string;
  total_spending: number;
  total_savings: number;
  monthly_allowance: number;
  spending_above_average: boolean;
  receipt_rate: number;
  transaction_count: number;
}

export interface SpendingCategoryBreakdown {
  category: string;
  total_amount: number;
  transaction_count: number;
  percentage: number;
}

export interface FinanceAlert {
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

export interface AriaFinanceInsight {
  severity: "critical" | "warning" | "positive";
  text: string;
}

// ── Engine Input ────────────────────────────────────────────────────────────

export interface FinanceEngineInput {
  transactions: PocketMoneyTransactionInput[];
  clothing_allowances: ClothingAllowanceInput[];
  children: ChildRef[];
  staff: StaffRef[];
  today?: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isInPeriod(date: string, today: string): boolean {
  const txDate = new Date(date);
  const endDate = new Date(today);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 30);
  return txDate >= startDate && txDate <= endDate;
}

function childName(childId: string, children: ChildRef[]): string {
  const child = children.find((c) => c.id === childId);
  return child?.name ?? childId;
}

// ── Main Engine ─────────────────────────────────────────────────────────────

export function computeFinanceIntelligence(input: FinanceEngineInput): FinanceIntelligenceResult {
  const today = input.today ?? new Date().toISOString().slice(0, 10);
  const { transactions, clothing_allowances, children, staff } = input;

  const periodTransactions = transactions.filter((t) => isInPeriod(t.date, today));
  const spendingTransactions = periodTransactions.filter((t) => t.type === "spending");
  const totalSpending = spendingTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalAllowances = periodTransactions.filter((t) => t.type === "allowance").reduce((sum, t) => sum + t.amount, 0);
  const totalSavingsDeposits = periodTransactions.filter((t) => t.type === "savings_deposit").reduce((sum, t) => sum + t.amount, 0);
  const totalSavingsWithdrawals = periodTransactions.filter((t) => t.type === "savings_withdrawal").reduce((sum, t) => sum + t.amount, 0);
  const totalSavings = totalSavingsDeposits - totalSavingsWithdrawals;

  const receiptsHeld = spendingTransactions.filter((t) => t.receipt_held).length;
  const receiptComplianceRate = spendingTransactions.length > 0 ? Math.round((receiptsHeld / spendingTransactions.length) * 100) : 100;

  const totalChildren = children.length;
  const avgSpendingPerChild = totalChildren > 0 ? Math.round((totalSpending / totalChildren) * 100) / 100 : 0;

  // ── Overview ──────────────────────────────────────────────────────────
  const overview: FinanceOverview = {
    total_children: totalChildren,
    total_allowances_monthly: totalAllowances,
    total_savings: totalSavings,
    total_spending_this_period: totalSpending,
    receipt_compliance_rate: receiptComplianceRate,
    avg_spending_per_child: avgSpendingPerChild,
  };

  // ── Child Spending Profiles ───────────────────────────────────────────
  const child_spending: ChildSpendingProfile[] = children.map((child) => {
    const childPeriodTx = periodTransactions.filter((t) => t.child_id === child.id);
    const childSpending = childPeriodTx.filter((t) => t.type === "spending");
    const childSpendingTotal = childSpending.reduce((sum, t) => sum + t.amount, 0);
    const childSavingsDeposits = childPeriodTx.filter((t) => t.type === "savings_deposit").reduce((sum, t) => sum + t.amount, 0);
    const childSavingsWithdrawals = childPeriodTx.filter((t) => t.type === "savings_withdrawal").reduce((sum, t) => sum + t.amount, 0);
    const childSavings = childSavingsDeposits - childSavingsWithdrawals;
    const childAllowance = childPeriodTx.filter((t) => t.type === "allowance").reduce((sum, t) => sum + t.amount, 0);
    const childReceiptsHeld = childSpending.filter((t) => t.receipt_held).length;
    const childReceiptRate = childSpending.length > 0 ? Math.round((childReceiptsHeld / childSpending.length) * 100) : 100;

    return {
      child_id: child.id,
      child_name: child.name,
      total_spending: childSpendingTotal,
      total_savings: childSavings,
      monthly_allowance: childAllowance,
      spending_above_average: childSpendingTotal > avgSpendingPerChild * 1.15,
      receipt_rate: childReceiptRate,
      transaction_count: childPeriodTx.length,
    };
  });

  // ── Spending Category Breakdown ───────────────────────────────────────
  const categoryMap = new Map<string, { total: number; count: number }>();
  for (const t of spendingTransactions) {
    const existing = categoryMap.get(t.category) ?? { total: 0, count: 0 };
    existing.total += t.amount;
    existing.count += 1;
    categoryMap.set(t.category, existing);
  }

  const spending_categories: SpendingCategoryBreakdown[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total_amount: data.total,
      transaction_count: data.count,
      percentage: totalSpending > 0 ? Math.round((data.total / totalSpending) * 100) : 0,
    }))
    .sort((a, b) => b.total_amount - a.total_amount);

  // ── Alerts ────────────────────────────────────────────────────────────
  const alerts: FinanceAlert[] = [];

  for (const profile of child_spending) {
    if (avgSpendingPerChild > 0 && profile.total_spending > avgSpendingPerChild * 2) {
      alerts.push({
        severity: "high",
        message: `High spending alert: ${profile.child_name} spent £${profile.total_spending.toFixed(2)}, more than double the average`,
      });
    }
  }

  if (receiptComplianceRate < 80) {
    alerts.push({
      severity: "medium",
      message: `Receipt compliance at ${receiptComplianceRate}% — below 80% target`,
    });
  }

  for (const child of children) {
    const childAllowanceTx = periodTransactions.filter((t) => t.child_id === child.id && t.type === "allowance");
    if (childAllowanceTx.length === 0) {
      alerts.push({
        severity: "medium",
        message: `No allowance recorded for ${child.name} in the last 30 days`,
      });
    }
  }

  for (const ca of clothing_allowances) {
    if (ca.ytd_spend > ca.annual_budget * 0.9) {
      const name = childName(ca.child_id, children);
      const pct = Math.round((ca.ytd_spend / ca.annual_budget) * 100);
      const currentMonth = new Date(today).getMonth() + 1;
      const monthsRemaining = 12 - currentMonth;
      alerts.push({
        severity: "medium",
        message: `Clothing budget for ${name} is ${pct}% spent with ${monthsRemaining} months remaining`,
      });
    }
  }

  for (const profile of child_spending) {
    if (profile.transaction_count > 0 && profile.total_spending === 0) {
      alerts.push({
        severity: "low",
        message: `${profile.child_name} has no spending transactions — may indicate restricted access to funds`,
      });
    }
  }

  // ── Insights ──────────────────────────────────────────────────────────
  const insights: AriaFinanceInsight[] = [];

  const childrenWithNoTransactions = children.filter((child) => {
    const childTx = periodTransactions.filter((t) => t.child_id === child.id);
    return childTx.length === 0;
  });
  for (const child of childrenWithNoTransactions) {
    insights.push({
      severity: "critical",
      text: `${child.name} has no financial transactions in the last 30 days — requires immediate review`,
    });
  }

  if (receiptComplianceRate < 80) {
    insights.push({
      severity: "warning",
      text: `Receipt compliance is ${receiptComplianceRate}%, below the 80% regulatory target under Reg 39`,
    });
  }

  for (const profile of child_spending) {
    if (avgSpendingPerChild > 0 && profile.total_spending > avgSpendingPerChild * 2) {
      insights.push({
        severity: "warning",
        text: `${profile.child_name} is spending significantly above average — review spending consultation records`,
      });
    }
  }

  for (const ca of clothing_allowances) {
    if (ca.ytd_spend > ca.annual_budget * 0.9) {
      const name = childName(ca.child_id, children);
      insights.push({
        severity: "warning",
        text: `Clothing budget for ${name} is nearly exhausted — plan remaining quarter carefully`,
      });
    }
  }

  const allChildrenHaveSavings = child_spending.length > 0 && child_spending.every((p) => p.total_savings > 0);
  if (allChildrenHaveSavings) {
    insights.push({
      severity: "positive",
      text: "All children are actively saving — excellent practice in line with Reg 39 guidance",
    });
  }

  if (receiptComplianceRate >= 90) {
    insights.push({
      severity: "positive",
      text: `Receipt compliance at ${receiptComplianceRate}% — exceeds regulatory expectations`,
    });
  }

  const allAllowancesPaid = children.every((child) => {
    const childAllowanceTx = periodTransactions.filter((t) => t.child_id === child.id && t.type === "allowance");
    return childAllowanceTx.length > 0;
  });
  if (allAllowancesPaid && children.length > 0) {
    insights.push({
      severity: "positive",
      text: "All children have received their allowances this period — consistent financial support",
    });
  }

  if (child_spending.length > 1) {
    const spendingValues = child_spending.map((p) => p.total_spending).filter((v) => v > 0);
    if (spendingValues.length > 1) {
      const max = Math.max(...spendingValues);
      const min = Math.min(...spendingValues);
      if (max > 0 && min >= max * 0.5) {
        insights.push({
          severity: "positive",
          text: "Spending is balanced across children — no child is significantly under- or over-spending",
        });
      }
    }
  }

  return { overview, child_spending, spending_categories, alerts, insights };
}
