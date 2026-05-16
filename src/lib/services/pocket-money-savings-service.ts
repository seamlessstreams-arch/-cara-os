// ==============================================================================
// CORNERSTONE -- POCKET MONEY & SAVINGS MANAGEMENT SERVICE
// Tracks pocket money transactions, savings, Junior ISA contributions, and
// financial literacy support for looked-after children. Records transaction
// types including weekly/monthly pocket money, birthday/Christmas money,
// clothing allowance, holiday spending, savings deposits/withdrawals, Junior
// ISA contributions, gifts received, prize/award money, work experience
// earnings, chore payments, and special occasion spending.
//
// Covers: Running balance tracking, savings balance monitoring, Junior ISA
// balance management, receipt retention, child choice in spending, budgeting
// discussions, age-appropriate spending, parental consent for larger amounts,
// social worker awareness for significant financial matters, income vs
// expenditure analysis, savings rate calculation, and per-child financial
// overview.
//
// UK Regulatory Framework:
// CHR 2015 Reg 5 (independence — financial management),
// CHR 2015 Reg 9 (quality of care),
// SCCIF: Experiences & progress — "Children are supported to manage money."
// DfE guidance on looked-after children's savings,
// Junior ISA for looked-after children (DfE scheme).
// ==============================================================================

"use client";

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// -- Enums (const arrays + types) ---------------------------------------------

export const TRANSACTION_TYPES = [
  "Pocket Money — Weekly",
  "Pocket Money — Monthly",
  "Birthday Money",
  "Christmas Money",
  "Clothing Allowance",
  "Holiday Spending",
  "Savings Deposit",
  "Savings Withdrawal",
  "Junior ISA Contribution",
  "Gift Received",
  "Prize/Award Money",
  "Work Experience Earnings",
  "Chore Payment",
  "Special Occasion",
  "Other",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

// -- Derived enum subsets for domain logic ------------------------------------

export const INCOME_TYPES: TransactionType[] = [
  "Pocket Money — Weekly",
  "Pocket Money — Monthly",
  "Birthday Money",
  "Christmas Money",
  "Clothing Allowance",
  "Gift Received",
  "Prize/Award Money",
  "Work Experience Earnings",
  "Chore Payment",
];

export const SPENDING_TYPES: TransactionType[] = [
  "Holiday Spending",
  "Special Occasion",
];

export const SAVINGS_TYPES: TransactionType[] = [
  "Savings Deposit",
  "Junior ISA Contribution",
];

export const WITHDRAWAL_TYPES: TransactionType[] = [
  "Savings Withdrawal",
];

export const POCKET_MONEY_TYPES: TransactionType[] = [
  "Pocket Money — Weekly",
  "Pocket Money — Monthly",
];

export const EARNED_INCOME_TYPES: TransactionType[] = [
  "Work Experience Earnings",
  "Chore Payment",
  "Prize/Award Money",
];

export const CONSENT_REQUIRED_TYPES: TransactionType[] = [
  "Junior ISA Contribution",
  "Savings Withdrawal",
];

// -- Label maps ---------------------------------------------------------------

export const TRANSACTION_TYPE_LABELS: { type: TransactionType; label: string }[] = [
  { type: "Pocket Money — Weekly", label: "Pocket Money (Weekly)" },
  { type: "Pocket Money — Monthly", label: "Pocket Money (Monthly)" },
  { type: "Birthday Money", label: "Birthday Money" },
  { type: "Christmas Money", label: "Christmas Money" },
  { type: "Clothing Allowance", label: "Clothing Allowance" },
  { type: "Holiday Spending", label: "Holiday Spending" },
  { type: "Savings Deposit", label: "Savings Deposit" },
  { type: "Savings Withdrawal", label: "Savings Withdrawal" },
  { type: "Junior ISA Contribution", label: "Junior ISA Contribution" },
  { type: "Gift Received", label: "Gift Received" },
  { type: "Prize/Award Money", label: "Prize / Award Money" },
  { type: "Work Experience Earnings", label: "Work Experience Earnings" },
  { type: "Chore Payment", label: "Chore Payment" },
  { type: "Special Occasion", label: "Special Occasion" },
  { type: "Other", label: "Other" },
];

// -- Row type -----------------------------------------------------------------

export interface PocketMoneySavingsRow {
  id: string;
  home_id: string;
  child_name: string;
  transaction_date: string;
  recorded_by: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  balance_after: number | null;
  savings_balance: number | null;
  junior_isa_balance: number | null;
  receipt_kept: boolean;
  child_choice: boolean;
  budgeting_discussion: boolean;
  age_appropriate: boolean;
  parental_consent: boolean | null;
  social_worker_aware: boolean | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// -- Validation ---------------------------------------------------------------

export function validatePocketMoneySavings(input: {
  childName?: string;
  transactionDate?: string;
  recordedBy?: string;
  transactionType?: string;
  amount?: number;
  currency?: string;
  ageAppropriate?: boolean;
  parentalConsent?: boolean | null;
  socialWorkerAware?: boolean | null;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.childName || input.childName.trim().length === 0) {
    errors.push("Child name is required");
  }

  if (!input.transactionDate) {
    errors.push("Transaction date is required");
  } else {
    const dateObj = new Date(input.transactionDate);
    if (isNaN(dateObj.getTime())) {
      errors.push("Transaction date must be a valid date");
    } else if (dateObj > new Date()) {
      errors.push("Transaction date cannot be in the future");
    }
  }

  if (!input.recordedBy || input.recordedBy.trim().length === 0) {
    errors.push("Recorded by (staff member) is required");
  }

  if (
    !input.transactionType ||
    !(TRANSACTION_TYPES as readonly string[]).includes(input.transactionType)
  ) {
    errors.push(`Transaction type must be one of: ${TRANSACTION_TYPES.join(", ")}`);
  }

  if (input.amount === undefined || input.amount === null) {
    errors.push("Amount is required");
  } else if (input.amount < 0) {
    errors.push("Amount cannot be negative — use Savings Withdrawal or Holiday Spending transaction types for outgoing funds");
  } else if (input.amount > 10000) {
    errors.push("Amount exceeds £10,000 — verify this is correct and ensure social worker is informed for significant financial matters");
  }

  if (input.currency && input.currency.trim().length !== 3) {
    errors.push("Currency must be a valid 3-letter ISO code (e.g. GBP)");
  }

  // Business rule: Age-appropriate spending must be confirmed
  if (input.ageAppropriate === false) {
    errors.push("Transaction flagged as not age-appropriate — CHR 2015 Reg 9 requires that care is age-appropriate. Staff must discuss with the child and consider whether to proceed");
  }

  // Business rule: Parental consent for Junior ISA and larger withdrawals
  if (
    input.transactionType &&
    (CONSENT_REQUIRED_TYPES as string[]).includes(input.transactionType) &&
    (input.parentalConsent === null || input.parentalConsent === undefined)
  ) {
    errors.push(`${input.transactionType} requires parental/LA consent status to be recorded — check placement plan for delegated authority on financial decisions`);
  }

  // Business rule: Social worker should be aware of significant amounts
  if (
    input.amount !== undefined &&
    input.amount > 100 &&
    (input.socialWorkerAware === null || input.socialWorkerAware === undefined)
  ) {
    errors.push("Social worker awareness should be recorded for transactions over £100 — significant financial matters for looked-after children should be communicated to the social worker");
  }

  // Business rule: Junior ISA contributions should have consent
  if (
    input.transactionType === "Junior ISA Contribution" &&
    input.parentalConsent === false
  ) {
    errors.push("Junior ISA contributions require consent from the person with parental responsibility — DfE guidance on the Junior ISA scheme for looked-after children requires LA approval");
  }

  // Business rule: Savings withdrawals need justification
  if (
    input.transactionType === "Savings Withdrawal" &&
    input.parentalConsent === false
  ) {
    errors.push("Savings withdrawals should have parental/LA consent — withdrawing from a child's savings without proper authority may breach the LA's duties under the Children Act 1989");
  }

  return { valid: errors.length === 0, errors };
}

// -- Pure functions (no DB) ---------------------------------------------------

export function computeMetrics(
  rows: PocketMoneySavingsRow[],
): {
  total_transactions: number;
  total_income: number;
  total_spending: number;
  total_savings_deposits: number;
  total_savings_withdrawals: number;
  net_savings: number;
  average_pocket_money: number;
  savings_rate: number;
  junior_isa_total: number;
  child_choice_rate: number;
  receipt_rate: number;
  budgeting_discussion_rate: number;
  by_transaction_type: Record<string, number>;
  unique_children: number;
  average_balance: number;
  earned_income_total: number;
  age_appropriate_rate: number;
  consent_recorded_rate: number;
  social_worker_aware_rate: number;
} {
  const total = rows.length;

  // Unique children
  const uniqueChildren = new Set(rows.map((r) => r.child_name.toLowerCase().trim()));

  // Transaction type breakdown
  const byTransactionType: Record<string, number> = {};
  for (const tt of TRANSACTION_TYPES) byTransactionType[tt] = 0;
  for (const r of rows)
    byTransactionType[r.transaction_type] = (byTransactionType[r.transaction_type] || 0) + 1;

  // Income total (pocket money, gifts, earnings, allowances)
  const incomeRows = rows.filter((r) =>
    (INCOME_TYPES as string[]).includes(r.transaction_type),
  );
  const totalIncome = incomeRows.reduce((sum, r) => sum + Number(r.amount), 0);

  // Spending total
  const spendingRows = rows.filter((r) =>
    (SPENDING_TYPES as string[]).includes(r.transaction_type) ||
    r.transaction_type === "Other",
  );
  const totalSpending = spendingRows.reduce((sum, r) => sum + Number(r.amount), 0);

  // Savings deposits
  const savingsDepositRows = rows.filter((r) =>
    (SAVINGS_TYPES as string[]).includes(r.transaction_type),
  );
  const totalSavingsDeposits = savingsDepositRows.reduce((sum, r) => sum + Number(r.amount), 0);

  // Savings withdrawals
  const withdrawalRows = rows.filter((r) =>
    (WITHDRAWAL_TYPES as string[]).includes(r.transaction_type),
  );
  const totalSavingsWithdrawals = withdrawalRows.reduce((sum, r) => sum + Number(r.amount), 0);

  // Net savings
  const netSavings = totalSavingsDeposits - totalSavingsWithdrawals;

  // Average pocket money
  const pocketMoneyRows = rows.filter((r) =>
    (POCKET_MONEY_TYPES as string[]).includes(r.transaction_type),
  );
  const averagePocketMoney = pocketMoneyRows.length > 0
    ? Math.round((pocketMoneyRows.reduce((sum, r) => sum + Number(r.amount), 0) / pocketMoneyRows.length) * 100) / 100
    : 0;

  // Savings rate (savings deposits as % of total income)
  const savingsRate = totalIncome > 0
    ? Math.round((totalSavingsDeposits / totalIncome) * 1000) / 10
    : 0;

  // Junior ISA total
  const juniorIsaTotal = rows
    .filter((r) => r.transaction_type === "Junior ISA Contribution")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  // Boolean rates
  const childChoiceRate = total > 0
    ? Math.round((rows.filter((r) => r.child_choice).length / total) * 1000) / 10
    : 0;

  const receiptRate = total > 0
    ? Math.round((rows.filter((r) => r.receipt_kept).length / total) * 1000) / 10
    : 0;

  const budgetingDiscussionRate = total > 0
    ? Math.round((rows.filter((r) => r.budgeting_discussion).length / total) * 1000) / 10
    : 0;

  // Average balance (from rows with balance_after recorded)
  const balanceRows = rows.filter((r) => r.balance_after !== null);
  const averageBalance = balanceRows.length > 0
    ? Math.round((balanceRows.reduce((sum, r) => sum + Number(r.balance_after), 0) / balanceRows.length) * 100) / 100
    : 0;

  // Earned income total
  const earnedIncomeTotal = rows
    .filter((r) => (EARNED_INCOME_TYPES as string[]).includes(r.transaction_type))
    .reduce((sum, r) => sum + Number(r.amount), 0);

  // Age-appropriate rate
  const ageAppropriateRate = total > 0
    ? Math.round((rows.filter((r) => r.age_appropriate).length / total) * 1000) / 10
    : 0;

  // Consent recorded rate (only for applicable types)
  const consentApplicableRows = rows.filter((r) => r.parental_consent !== null);
  const consentRecordedRate = consentApplicableRows.length > 0
    ? Math.round((consentApplicableRows.filter((r) => r.parental_consent === true).length / consentApplicableRows.length) * 1000) / 10
    : 0;

  // Social worker aware rate (only where applicable)
  const swApplicableRows = rows.filter((r) => r.social_worker_aware !== null);
  const socialWorkerAwareRate = swApplicableRows.length > 0
    ? Math.round((swApplicableRows.filter((r) => r.social_worker_aware === true).length / swApplicableRows.length) * 1000) / 10
    : 0;

  return {
    total_transactions: total,
    total_income: Math.round(totalIncome * 100) / 100,
    total_spending: Math.round(totalSpending * 100) / 100,
    total_savings_deposits: Math.round(totalSavingsDeposits * 100) / 100,
    total_savings_withdrawals: Math.round(totalSavingsWithdrawals * 100) / 100,
    net_savings: Math.round(netSavings * 100) / 100,
    average_pocket_money: averagePocketMoney,
    savings_rate: savingsRate,
    junior_isa_total: Math.round(juniorIsaTotal * 100) / 100,
    child_choice_rate: childChoiceRate,
    receipt_rate: receiptRate,
    budgeting_discussion_rate: budgetingDiscussionRate,
    by_transaction_type: byTransactionType,
    unique_children: uniqueChildren.size,
    average_balance: averageBalance,
    earned_income_total: Math.round(earnedIncomeTotal * 100) / 100,
    age_appropriate_rate: ageAppropriateRate,
    consent_recorded_rate: consentRecordedRate,
    social_worker_aware_rate: socialWorkerAwareRate,
  };
}

export function computeAlerts(
  rows: PocketMoneySavingsRow[],
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  record_id?: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    record_id?: string;
  }[] = [];

  // Critical: Junior ISA contribution without consent
  for (const r of rows) {
    if (r.transaction_type === "Junior ISA Contribution" && r.parental_consent === false) {
      alerts.push({
        type: "isa_no_consent",
        severity: "critical",
        message: `Junior ISA contribution of £${Number(r.amount).toFixed(2)} for ${r.child_name} on ${r.transaction_date} was made without parental/LA consent — DfE guidance on the Junior ISA scheme for looked-after children requires LA approval for contributions. This may need to be reversed`,
        record_id: r.id,
      });
    }
  }

  // Critical: Savings withdrawal without consent
  for (const r of rows) {
    if (r.transaction_type === "Savings Withdrawal" && r.parental_consent === false) {
      alerts.push({
        type: "withdrawal_no_consent",
        severity: "critical",
        message: `Savings withdrawal of £${Number(r.amount).toFixed(2)} for ${r.child_name} on ${r.transaction_date} was made without parental/LA consent — withdrawals from a looked-after child's savings require proper authority. Review under Children Act 1989 duties`,
        record_id: r.id,
      });
    }
  }

  // Critical: Large transaction without social worker awareness
  for (const r of rows) {
    if (Number(r.amount) > 200 && r.social_worker_aware === false) {
      alerts.push({
        type: "large_amount_sw_unaware",
        severity: "critical",
        message: `Transaction of £${Number(r.amount).toFixed(2)} (${r.transaction_type}) for ${r.child_name} on ${r.transaction_date} — social worker was not informed. Significant financial matters for looked-after children must be communicated to the allocated social worker`,
        record_id: r.id,
      });
    }
  }

  // Critical: Not age-appropriate transaction
  for (const r of rows) {
    if (!r.age_appropriate) {
      alerts.push({
        type: "not_age_appropriate",
        severity: "critical",
        message: `Transaction for ${r.child_name} on ${r.transaction_date} (${r.transaction_type}, £${Number(r.amount).toFixed(2)}) was flagged as not age-appropriate — CHR 2015 Reg 9 requires care to be age-appropriate. Review what the money was used for and whether safeguarding concerns arise`,
        record_id: r.id,
      });
    }
  }

  // High: No budgeting discussions happening
  const budgetingCount = rows.filter((r) => r.budgeting_discussion).length;
  if (rows.length >= 10 && budgetingCount / rows.length < 0.1) {
    alerts.push({
      type: "low_budgeting_discussions",
      severity: "high",
      message: `Budgeting discussions recorded in only ${Math.round((budgetingCount / rows.length) * 100)}% of transactions — CHR 2015 Reg 5 requires the home to prepare children for independence, including financial management. Regular budgeting discussions should accompany pocket money and spending to build financial literacy`,
    });
  }

  // High: No savings activity for any child
  const savingsCount = rows.filter((r) =>
    (SAVINGS_TYPES as string[]).includes(r.transaction_type),
  ).length;
  if (rows.length >= 10 && savingsCount === 0) {
    alerts.push({
      type: "no_savings_activity",
      severity: "high",
      message: "No savings deposits or Junior ISA contributions have been recorded — DfE guidance encourages looked-after children to build savings. The Junior ISA scheme provides government contributions for eligible children. Savings habits are a key independence skill under CHR 2015 Reg 5",
    });
  }

  // High: Low child choice rate
  const childChoiceCount = rows.filter((r) => r.child_choice).length;
  if (rows.length >= 5 && childChoiceCount / rows.length < 0.4) {
    alerts.push({
      type: "low_child_choice",
      severity: "high",
      message: `Only ${Math.round((childChoiceCount / rows.length) * 100)}% of transactions involved the child's choice — CHR 2015 Reg 9 emphasises that children should be supported to make decisions. Financial autonomy, within safe boundaries, is crucial for independence preparation`,
    });
  }

  // High: Receipt keeping rate very low
  const receiptCount = rows.filter((r) => r.receipt_kept).length;
  if (rows.length >= 10 && receiptCount / rows.length < 0.2) {
    alerts.push({
      type: "low_receipt_rate",
      severity: "high",
      message: `Receipts kept for only ${Math.round((receiptCount / rows.length) * 100)}% of transactions — maintaining receipts demonstrates accountability in managing children's money. Poor receipt keeping may raise concerns at inspection about how children's funds are being managed`,
    });
  }

  // High: Repeated large withdrawals from same child
  const childWithdrawals = new Map<string, PocketMoneySavingsRow[]>();
  for (const r of rows) {
    if (r.transaction_type === "Savings Withdrawal") {
      const key = r.child_name.toLowerCase().trim();
      if (!childWithdrawals.has(key)) childWithdrawals.set(key, []);
      childWithdrawals.get(key)!.push(r);
    }
  }
  for (const [, childRows] of childWithdrawals) {
    if (childRows.length >= 3) {
      const totalWithdrawn = childRows.reduce((sum, r) => sum + Number(r.amount), 0);
      alerts.push({
        type: "repeated_withdrawals",
        severity: "high",
        message: `${childRows[0].child_name} has made ${childRows.length} savings withdrawals totalling £${totalWithdrawn.toFixed(2)} — frequent withdrawals may indicate the child is under financial pressure, being exploited, or not being provided with adequate pocket money. Review under CHR 2015 Reg 12 (protection)`,
      });
    }
  }

  // Medium: No Junior ISA contributions
  const isaCount = rows.filter((r) => r.transaction_type === "Junior ISA Contribution").length;
  if (rows.length >= 15 && isaCount === 0) {
    alerts.push({
      type: "no_junior_isa",
      severity: "medium",
      message: "No Junior ISA contributions have been recorded — the DfE Junior ISA scheme for looked-after children provides government contributions. Eligible children should be enrolled and regular contributions considered. This is a key financial entitlement for children in care",
    });
  }

  // Medium: No earned income (work experience, chores)
  const earnedCount = rows.filter((r) =>
    (EARNED_INCOME_TYPES as string[]).includes(r.transaction_type),
  ).length;
  if (rows.length >= 15 && earnedCount === 0) {
    alerts.push({
      type: "no_earned_income",
      severity: "medium",
      message: "No work experience earnings, chore payments, or prize money recorded — earning money through chores and work experience teaches financial responsibility and the value of money. CHR 2015 Reg 5 (independence) supports age-appropriate earning opportunities",
    });
  }

  // Medium: Single child dominates transactions
  const childTxCounts = new Map<string, number>();
  for (const r of rows) {
    const key = r.child_name.toLowerCase().trim();
    childTxCounts.set(key, (childTxCounts.get(key) || 0) + 1);
  }
  const uniqueChildren = childTxCounts.size;
  if (uniqueChildren >= 2 && rows.length >= 10) {
    for (const [, count] of childTxCounts) {
      if (count / rows.length > 0.8) {
        alerts.push({
          type: "uneven_financial_attention",
          severity: "medium",
          message: "One child accounts for over 80% of financial transactions — ensure all children in the home are receiving equal financial support, budgeting discussions, and savings opportunities. Equity in financial support is expected under CHR 2015 Reg 9",
        });
        break;
      }
    }
  }

  // Medium: Spending significantly exceeds income
  const totalIncome = rows
    .filter((r) => (INCOME_TYPES as string[]).includes(r.transaction_type))
    .reduce((sum, r) => sum + Number(r.amount), 0);
  const totalSpending = rows
    .filter((r) => (SPENDING_TYPES as string[]).includes(r.transaction_type) || r.transaction_type === "Other")
    .reduce((sum, r) => sum + Number(r.amount), 0);
  if (totalIncome > 0 && totalSpending > totalIncome * 1.5) {
    alerts.push({
      type: "spending_exceeds_income",
      severity: "medium",
      message: `Total spending (£${totalSpending.toFixed(2)}) significantly exceeds total income (£${totalIncome.toFixed(2)}) — review whether the child is supplementing funds from unknown sources, which could indicate exploitation or other safeguarding concerns`,
    });
  }

  return alerts;
}

export function generateAriaInsights(
  rows: PocketMoneySavingsRow[],
): string[] {
  const metrics = computeMetrics(rows);
  const alerts = computeAlerts(rows);
  const insights: string[] = [];

  // Insight 1: Summary overview
  const typeBreakdown = Object.entries(metrics.by_transaction_type)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");

  insights.push(
    `[sky] ${metrics.total_transactions} financial ${metrics.total_transactions === 1 ? "transaction" : "transactions"} ` +
      `for ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Total income: £${metrics.total_income.toFixed(2)}. ` +
      `Total spending: £${metrics.total_spending.toFixed(2)}. ` +
      `Net savings: £${metrics.net_savings.toFixed(2)}. ` +
      `Junior ISA total: £${metrics.junior_isa_total.toFixed(2)}. ` +
      `Average pocket money: £${metrics.average_pocket_money.toFixed(2)}. ` +
      `Savings rate: ${metrics.savings_rate}%. ` +
      `Earned income: £${metrics.earned_income_total.toFixed(2)}. ` +
      `Breakdown: ${typeBreakdown || "none recorded"}.`,
  );

  // Insight 2: Quality indicators and alerts
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");

  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Receipt keeping rate: ${metrics.receipt_rate}%. ` +
        `Budgeting discussion rate: ${metrics.budgeting_discussion_rate}%. ` +
        `Age-appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Consent recorded: ${metrics.consent_recorded_rate}%. ` +
        `Social worker aware: ${metrics.social_worker_aware_rate}%. ` +
        `Average balance: £${metrics.average_balance.toFixed(2)}.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority financial management alerts. ` +
        `Child choice rate: ${metrics.child_choice_rate}%. ` +
        `Receipt keeping rate: ${metrics.receipt_rate}%. ` +
        `Budgeting discussion rate: ${metrics.budgeting_discussion_rate}%. ` +
        `Age-appropriate rate: ${metrics.age_appropriate_rate}%. ` +
        `Consent recorded: ${metrics.consent_recorded_rate}%. ` +
        `Social worker aware: ${metrics.social_worker_aware_rate}%. ` +
        `Continue supporting financial literacy per CHR 2015 Reg 5.`,
    );
  }

  // Insight 3: Reflective question
  if (metrics.savings_rate < 5 && metrics.total_transactions > 10) {
    insights.push(
      `[reflect] The savings rate is only ${metrics.savings_rate}% of total income. Are children ` +
        `being actively encouraged to save? CHR 2015 Reg 5 requires the home to prepare ` +
        `children for independence, and financial management is a key life skill. The DfE ` +
        `Junior ISA scheme provides government contributions for looked-after children — ` +
        `are all eligible children enrolled? Are budgeting discussions happening regularly, ` +
        `or only when money is being spent? SCCIF inspectors will look for evidence that ` +
        `children understand the value of money and can manage their finances ` +
        `age-appropriately.`,
    );
  } else if (metrics.budgeting_discussion_rate < 20 && metrics.total_transactions > 5) {
    insights.push(
      `[reflect] Budgeting discussions accompany only ${metrics.budgeting_discussion_rate}% of ` +
        `transactions. Every pocket money payment and spending decision is an opportunity ` +
        `to build financial literacy. Are staff using these moments to teach budgeting, ` +
        `saving, and value-for-money concepts? For older children approaching independence, ` +
        `these skills are particularly important — can they read a bank statement, set up ` +
        `a standing order, or create a weekly budget? CHR 2015 Reg 5 expects the home ` +
        `to develop these capabilities progressively.`,
    );
  } else if (metrics.child_choice_rate < 50 && metrics.total_transactions > 5) {
    insights.push(
      `[reflect] Children chose how to spend or save in only ${metrics.child_choice_rate}% of ` +
        `transactions. Financial autonomy, within safe and age-appropriate boundaries, is ` +
        `essential for independence. Are staff making spending decisions for children rather ` +
        `than with them? CHR 2015 Reg 9 requires that children's wishes and feelings are ` +
        `taken into account. Learning to make financial decisions — including occasional ` +
        `mistakes — is how children develop financial competence. Is the home striking the ` +
        `right balance between guidance and autonomy?`,
    );
  } else {
    insights.push(
      `[reflect] How does the home ensure equitable financial support across all children? ` +
        `Are pocket money rates fair and age-appropriate? Do all children have access to ` +
        `savings accounts and Junior ISAs? Are children who receive birthday or Christmas ` +
        `money from family being supported to manage it wisely? For children approaching ` +
        `independence, are financial skills being actively taught — opening bank accounts, ` +
        `understanding bills, avoiding debt? SCCIF inspectors expect to see that the home ` +
        `supports children to manage money as part of a rich programme of independence ` +
        `preparation.`,
    );
  }

  return insights;
}

// -- CRUD ---------------------------------------------------------------------

export async function listRecords(
  homeId: string,
  filters?: {
    transactionType?: TransactionType;
    childName?: string;
    limit?: number;
  },
): Promise<ServiceResult<PocketMoneySavingsRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const client = await createServerClient();
  if (!client) return { ok: true, data: [] };

  let q = (client.from("cs_pocket_money_savings") as SB)
    .select("*")
    .eq("home_id", homeId);

  if (filters?.transactionType) q = q.eq("transaction_type", filters.transactionType);
  if (filters?.childName) q = q.ilike("child_name", `%${filters.childName}%`);

  q = q.order("transaction_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function getRecord(
  id: string,
): Promise<ServiceResult<PocketMoneySavingsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_pocket_money_savings") as SB)
    .select("*")
    .eq("id", id)
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function createRecord(input: {
  homeId: string;
  childName: string;
  transactionDate: string;
  recordedBy: string;
  transactionType: TransactionType;
  amount: number;
  currency?: string;
  balanceAfter?: number | null;
  savingsBalance?: number | null;
  juniorIsaBalance?: number | null;
  receiptKept?: boolean;
  childChoice?: boolean;
  budgetingDiscussion?: boolean;
  ageAppropriate?: boolean;
  parentalConsent?: boolean | null;
  socialWorkerAware?: boolean | null;
  notes?: string | null;
}): Promise<ServiceResult<PocketMoneySavingsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const validation = validatePocketMoneySavings({
    childName: input.childName,
    transactionDate: input.transactionDate,
    recordedBy: input.recordedBy,
    transactionType: input.transactionType,
    amount: input.amount,
    currency: input.currency,
    ageAppropriate: input.ageAppropriate,
    parentalConsent: input.parentalConsent,
    socialWorkerAware: input.socialWorkerAware,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.errors.join("; ") };
  }

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (client.from("cs_pocket_money_savings") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      transaction_date: input.transactionDate,
      recorded_by: input.recordedBy,
      transaction_type: input.transactionType,
      amount: input.amount,
      currency: input.currency ?? "GBP",
      balance_after: input.balanceAfter ?? null,
      savings_balance: input.savingsBalance ?? null,
      junior_isa_balance: input.juniorIsaBalance ?? null,
      receipt_kept: input.receiptKept ?? false,
      child_choice: input.childChoice ?? true,
      budgeting_discussion: input.budgetingDiscussion ?? false,
      age_appropriate: input.ageAppropriate ?? true,
      parental_consent: input.parentalConsent ?? null,
      social_worker_aware: input.socialWorkerAware ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    childName: string;
    transactionDate: string;
    recordedBy: string;
    transactionType: TransactionType;
    amount: number;
    currency: string;
    balanceAfter: number | null;
    savingsBalance: number | null;
    juniorIsaBalance: number | null;
    receiptKept: boolean;
    childChoice: boolean;
    budgetingDiscussion: boolean;
    ageAppropriate: boolean;
    parentalConsent: boolean | null;
    socialWorkerAware: boolean | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PocketMoneySavingsRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.transactionDate !== undefined) mapped.transaction_date = updates.transactionDate;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.transactionType !== undefined) mapped.transaction_type = updates.transactionType;
  if (updates.amount !== undefined) mapped.amount = updates.amount;
  if (updates.currency !== undefined) mapped.currency = updates.currency;
  if (updates.balanceAfter !== undefined) mapped.balance_after = updates.balanceAfter;
  if (updates.savingsBalance !== undefined) mapped.savings_balance = updates.savingsBalance;
  if (updates.juniorIsaBalance !== undefined) mapped.junior_isa_balance = updates.juniorIsaBalance;
  if (updates.receiptKept !== undefined) mapped.receipt_kept = updates.receiptKept;
  if (updates.childChoice !== undefined) mapped.child_choice = updates.childChoice;
  if (updates.budgetingDiscussion !== undefined) mapped.budgeting_discussion = updates.budgetingDiscussion;
  if (updates.ageAppropriate !== undefined) mapped.age_appropriate = updates.ageAppropriate;
  if (updates.parentalConsent !== undefined) mapped.parental_consent = updates.parentalConsent;
  if (updates.socialWorkerAware !== undefined) mapped.social_worker_aware = updates.socialWorkerAware;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (client.from("cs_pocket_money_savings") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function deleteRecord(
  id: string,
): Promise<ServiceResult<null>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const client = await createServerClient();
  if (!client) return { ok: false, error: "Supabase not configured" };

  const { error } = await (client.from("cs_pocket_money_savings") as SB)
    .delete()
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: null };
}
