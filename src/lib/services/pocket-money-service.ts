// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POCKET MONEY & SAVINGS SERVICE
// Manages children's pocket money, savings accounts, spending records,
// and financial literacy tracking.
// CHR 2015 Reg 37 (children's money — pocket money, savings, and
// personal allowances), Reg 7 (children's views — financial choices),
// Reg 14 (care planning — financial provisions).
//
// Tracks weekly pocket money allowances, savings balances, spending
// records, receipts, financial literacy progress, and ensures transparent
// and accountable management of children's finances.
//
// SCCIF: Children's Experiences — "Children receive their pocket money
// and are supported to manage their finances." "Children are helped to
// develop financial skills appropriate to their age."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TransactionType =
  | "pocket_money"
  | "savings_deposit"
  | "savings_withdrawal"
  | "birthday_money"
  | "gift_money"
  | "earnings"
  | "expense"
  | "clothing_allowance"
  | "travel_allowance"
  | "other_income"
  | "other_expense";

export type SpendingCategory =
  | "food_drink"
  | "clothing"
  | "entertainment"
  | "personal_care"
  | "technology"
  | "hobbies"
  | "travel"
  | "savings"
  | "gifts"
  | "education"
  | "other";

export type AccountType =
  | "pocket_money"
  | "savings"
  | "clothing_allowance"
  | "birthday_fund";

export type FinancialLiteracyLevel =
  | "not_assessed"
  | "emerging"
  | "developing"
  | "competent"
  | "independent";

export type AuditStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "discrepancy_found";

export interface ChildFinancialProfile {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  weekly_pocket_money: number;
  clothing_allowance_monthly: number;
  savings_balance: number;
  pocket_money_balance: number;
  financial_literacy_level: FinancialLiteracyLevel;
  has_bank_account: boolean;
  bank_account_type: string | null;
  savings_goal: string | null;
  savings_target: number | null;
  financial_skills_notes: string | null;
  last_audit_date: string | null;
  next_audit_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinancialTransaction {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  transaction_date: string;
  transaction_type: TransactionType;
  account_type: AccountType;
  amount: number;
  description: string;
  spending_category: SpendingCategory | null;
  receipt_reference: string | null;
  authorised_by: string;
  witnessed_by: string | null;
  child_present: boolean;
  balance_after: number | null;
  notes: string | null;
  created_at: string;
}

export interface FinancialAudit {
  id: string;
  home_id: string;
  audit_date: string;
  audited_by: string;
  status: AuditStatus;
  children_audited: string[];
  expected_total: number;
  actual_total: number;
  discrepancy_amount: number;
  discrepancy_explanation: string | null;
  corrective_action: string | null;
  notes: string | null;
  created_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRANSACTION_TYPES: { type: TransactionType; label: string }[] = [
  { type: "pocket_money", label: "Pocket Money" },
  { type: "savings_deposit", label: "Savings Deposit" },
  { type: "savings_withdrawal", label: "Savings Withdrawal" },
  { type: "birthday_money", label: "Birthday Money" },
  { type: "gift_money", label: "Gift Money" },
  { type: "earnings", label: "Earnings" },
  { type: "expense", label: "Expense" },
  { type: "clothing_allowance", label: "Clothing Allowance" },
  { type: "travel_allowance", label: "Travel Allowance" },
  { type: "other_income", label: "Other Income" },
  { type: "other_expense", label: "Other Expense" },
];

export const SPENDING_CATEGORIES: { category: SpendingCategory; label: string }[] = [
  { category: "food_drink", label: "Food & Drink" },
  { category: "clothing", label: "Clothing" },
  { category: "entertainment", label: "Entertainment" },
  { category: "personal_care", label: "Personal Care" },
  { category: "technology", label: "Technology" },
  { category: "hobbies", label: "Hobbies" },
  { category: "travel", label: "Travel" },
  { category: "savings", label: "Savings" },
  { category: "gifts", label: "Gifts" },
  { category: "education", label: "Education" },
  { category: "other", label: "Other" },
];

export const ACCOUNT_TYPES: { type: AccountType; label: string }[] = [
  { type: "pocket_money", label: "Pocket Money" },
  { type: "savings", label: "Savings" },
  { type: "clothing_allowance", label: "Clothing Allowance" },
  { type: "birthday_fund", label: "Birthday Fund" },
];

export const FINANCIAL_LITERACY_LEVELS: { level: FinancialLiteracyLevel; label: string }[] = [
  { level: "not_assessed", label: "Not Assessed" },
  { level: "emerging", label: "Emerging" },
  { level: "developing", label: "Developing" },
  { level: "competent", label: "Competent" },
  { level: "independent", label: "Independent" },
];

export const AUDIT_STATUSES: { status: AuditStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "in_progress", label: "In Progress" },
  { status: "completed", label: "Completed" },
  { status: "discrepancy_found", label: "Discrepancy Found" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

/**
 * Compute pocket money and financial metrics.
 */
export function computeFinancialMetrics(
  profiles: ChildFinancialProfile[],
  transactions: FinancialTransaction[],
  audits: FinancialAudit[],
  totalChildren: number,
): {
  children_with_profiles: number;
  total_pocket_money_balance: number;
  total_savings_balance: number;
  avg_weekly_pocket_money: number;
  transactions_this_month: number;
  by_transaction_type: Record<string, number>;
  by_spending_category: Record<string, number>;
  savings_goal_progress: number;
  audit_compliance_rate: number;
  overdue_audits: number;
  children_with_bank_accounts: number;
  financial_literacy_distribution: Record<string, number>;
} {
  const now = new Date();
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  // Children with profiles
  const childrenWithProfiles = profiles.length;

  // Balances
  let totalPocketMoney = 0;
  let totalSavings = 0;
  let totalWeekly = 0;
  let bankAccounts = 0;

  for (const p of profiles) {
    totalPocketMoney += p.pocket_money_balance;
    totalSavings += p.savings_balance;
    totalWeekly += p.weekly_pocket_money;
    if (p.has_bank_account) bankAccounts++;
  }

  const avgWeeklyPocketMoney =
    profiles.length > 0
      ? Math.round((totalWeekly / profiles.length) * 100) / 100
      : 0;

  // Transactions this month
  const transactionsThisMonth = transactions.filter(
    (t) => new Date(t.transaction_date) >= monthAgo,
  ).length;

  // By transaction type
  const byTransactionType: Record<string, number> = {};
  for (const t of transactions) {
    byTransactionType[t.transaction_type] =
      (byTransactionType[t.transaction_type] ?? 0) + 1;
  }

  // By spending category
  const bySpendingCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.spending_category) {
      bySpendingCategory[t.spending_category] =
        (bySpendingCategory[t.spending_category] ?? 0) + 1;
    }
  }

  // Savings goal progress (children with targets who've reached them)
  let withTarget = 0;
  let reachedTarget = 0;
  for (const p of profiles) {
    if (p.savings_target && p.savings_target > 0) {
      withTarget++;
      if (p.savings_balance >= p.savings_target) reachedTarget++;
    }
  }
  const savingsGoalProgress =
    withTarget > 0
      ? Math.round((reachedTarget / withTarget) * 1000) / 10
      : 0;

  // Audit compliance
  let completedAudits = 0;
  for (const a of audits) {
    if (a.status === "completed") completedAudits++;
  }
  const auditComplianceRate =
    audits.length > 0
      ? Math.round((completedAudits / audits.length) * 1000) / 10
      : 0;

  // Overdue audits
  let overdueAudits = 0;
  for (const p of profiles) {
    if (p.next_audit_date && new Date(p.next_audit_date) < now) {
      overdueAudits++;
    }
  }

  // Financial literacy distribution
  const financialLiteracyDist: Record<string, number> = {};
  for (const p of profiles) {
    financialLiteracyDist[p.financial_literacy_level] =
      (financialLiteracyDist[p.financial_literacy_level] ?? 0) + 1;
  }

  return {
    children_with_profiles: childrenWithProfiles,
    total_pocket_money_balance: Math.round(totalPocketMoney * 100) / 100,
    total_savings_balance: Math.round(totalSavings * 100) / 100,
    avg_weekly_pocket_money: avgWeeklyPocketMoney,
    transactions_this_month: transactionsThisMonth,
    by_transaction_type: byTransactionType,
    by_spending_category: bySpendingCategory,
    savings_goal_progress: savingsGoalProgress,
    audit_compliance_rate: auditComplianceRate,
    overdue_audits: overdueAudits,
    children_with_bank_accounts: bankAccounts,
    financial_literacy_distribution: financialLiteracyDist,
  };
}

/**
 * Identify pocket money and financial alerts.
 */
export function identifyFinancialAlerts(
  profiles: ChildFinancialProfile[],
  transactions: FinancialTransaction[],
  audits: FinancialAudit[],
  totalChildren: number,
  now: Date = new Date(),
): {
  type: string;
  severity: "critical" | "high" | "medium";
  message: string;
  id: string;
}[] {
  const alerts: {
    type: string;
    severity: "critical" | "high" | "medium";
    message: string;
    id: string;
  }[] = [];

  // ── Profile alerts ───────────────────────────────────────────────────

  // Children without financial profiles
  if (totalChildren > 0 && profiles.length < totalChildren) {
    const missing = totalChildren - profiles.length;
    alerts.push({
      type: "missing_financial_profile",
      severity: "high",
      message: `${missing} child(ren) without a financial profile — Reg 37 requires transparent management of children's money`,
      id: profiles.length > 0 ? profiles[0].id : "system",
    });
  }

  for (const p of profiles) {
    // Audit overdue
    if (p.next_audit_date && new Date(p.next_audit_date) < now) {
      const daysOverdue = Math.round(
        (now.getTime() - new Date(p.next_audit_date).getTime()) / 86400000,
      );
      alerts.push({
        type: "audit_overdue",
        severity: "medium",
        message: `Financial audit for ${p.child_name} is ${daysOverdue} days overdue`,
        id: p.id,
      });
    }

    // Negative balance
    if (p.pocket_money_balance < 0) {
      alerts.push({
        type: "negative_balance",
        severity: "high",
        message: `${p.child_name} has a negative pocket money balance (£${Math.abs(p.pocket_money_balance).toFixed(2)}) — investigate and rectify`,
        id: p.id,
      });
    }

    // No pocket money paid in last 14 days
    const recentPocketMoney = transactions.filter(
      (t) =>
        t.child_id === p.child_id &&
        t.transaction_type === "pocket_money" &&
        new Date(t.transaction_date) >= new Date(now.getTime() - 14 * 86400000),
    );
    if (recentPocketMoney.length === 0 && p.weekly_pocket_money > 0) {
      alerts.push({
        type: "pocket_money_not_paid",
        severity: "medium",
        message: `${p.child_name} has not received pocket money in the last 14 days — weekly amount is £${p.weekly_pocket_money.toFixed(2)}`,
        id: p.id,
      });
    }
  }

  // ── Audit alerts ────────────────────────────────────────────────────

  for (const a of audits) {
    if (a.status === "discrepancy_found" && a.discrepancy_amount !== 0) {
      alerts.push({
        type: "audit_discrepancy",
        severity: "critical",
        message: `Financial audit on ${a.audit_date} found a discrepancy of £${Math.abs(a.discrepancy_amount).toFixed(2)} — corrective action required`,
        id: a.id,
      });
    }
  }

  // ── Transaction alerts ──────────────────────────────────────────────

  // Large single transaction (> £50)
  for (const t of transactions) {
    if (t.amount > 50 && !t.witnessed_by) {
      alerts.push({
        type: "large_transaction_unwitnessed",
        severity: "medium",
        message: `Transaction of £${t.amount.toFixed(2)} for ${t.child_name} on ${t.transaction_date} was not witnessed — ensure all significant transactions are witnessed`,
        id: t.id,
      });
    }
  }

  return alerts;
}

// ── CRUD — Financial Profiles ───────────────────────────────────────────

export async function listProfiles(
  homeId: string,
  filters?: {
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<ChildFinancialProfile[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_financial_profiles") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("child_name", { ascending: true }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createProfile(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    weeklyPocketMoney?: number;
    clothingAllowanceMonthly?: number;
    savingsBalance?: number;
    pocketMoneyBalance?: number;
    financialLiteracyLevel?: FinancialLiteracyLevel;
    hasBankAccount?: boolean;
    bankAccountType?: string;
    savingsGoal?: string;
    savingsTarget?: number;
    financialSkillsNotes?: string;
    nextAuditDate?: string;
  },
): Promise<ServiceResult<ChildFinancialProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_financial_profiles") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      weekly_pocket_money: input.weeklyPocketMoney ?? 0,
      clothing_allowance_monthly: input.clothingAllowanceMonthly ?? 0,
      savings_balance: input.savingsBalance ?? 0,
      pocket_money_balance: input.pocketMoneyBalance ?? 0,
      financial_literacy_level: input.financialLiteracyLevel ?? "not_assessed",
      has_bank_account: input.hasBankAccount ?? false,
      bank_account_type: input.bankAccountType ?? null,
      savings_goal: input.savingsGoal ?? null,
      savings_target: input.savingsTarget ?? null,
      financial_skills_notes: input.financialSkillsNotes ?? null,
      last_audit_date: null,
      next_audit_date: input.nextAuditDate ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateProfile(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<ChildFinancialProfile>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_financial_profiles") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Transactions ─────────────────────────────────────────────────

export async function listTransactions(
  homeId: string,
  filters?: {
    childId?: string;
    transactionType?: TransactionType;
    accountType?: AccountType;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<FinancialTransaction[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_financial_transactions") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.transactionType) q = q.eq("transaction_type", filters.transactionType);
  if (filters?.accountType) q = q.eq("account_type", filters.accountType);
  if (filters?.dateFrom) q = q.gte("transaction_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("transaction_date", filters.dateTo);
  q = q.order("transaction_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTransaction(
  input: {
    homeId: string;
    childId: string;
    childName: string;
    transactionDate: string;
    transactionType: TransactionType;
    accountType: AccountType;
    amount: number;
    description: string;
    spendingCategory?: SpendingCategory;
    receiptReference?: string;
    authorisedBy: string;
    witnessedBy?: string;
    childPresent?: boolean;
    balanceAfter?: number;
    notes?: string;
  },
): Promise<ServiceResult<FinancialTransaction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_financial_transactions") as SB)
    .insert({
      home_id: input.homeId,
      child_id: input.childId,
      child_name: input.childName,
      transaction_date: input.transactionDate,
      transaction_type: input.transactionType,
      account_type: input.accountType,
      amount: input.amount,
      description: input.description,
      spending_category: input.spendingCategory ?? null,
      receipt_reference: input.receiptReference ?? null,
      authorised_by: input.authorisedBy,
      witnessed_by: input.witnessedBy ?? null,
      child_present: input.childPresent ?? true,
      balance_after: input.balanceAfter ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Audits ───────────────────────────────────────────────────────

export async function listAudits(
  homeId: string,
  filters?: {
    status?: AuditStatus;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  },
): Promise<ServiceResult<FinancialAudit[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_financial_audits") as SB).select("*").eq("home_id", homeId);
  if (filters?.status) q = q.eq("status", filters.status);
  if (filters?.dateFrom) q = q.gte("audit_date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("audit_date", filters.dateTo);
  q = q.order("audit_date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAudit(
  input: {
    homeId: string;
    auditDate: string;
    auditedBy: string;
    status?: AuditStatus;
    childrenAudited?: string[];
    expectedTotal?: number;
    actualTotal?: number;
    discrepancyAmount?: number;
    discrepancyExplanation?: string;
    correctiveAction?: string;
    notes?: string;
  },
): Promise<ServiceResult<FinancialAudit>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_financial_audits") as SB)
    .insert({
      home_id: input.homeId,
      audit_date: input.auditDate,
      audited_by: input.auditedBy,
      status: input.status ?? "pending",
      children_audited: input.childrenAudited ?? [],
      expected_total: input.expectedTotal ?? 0,
      actual_total: input.actualTotal ?? 0,
      discrepancy_amount: input.discrepancyAmount ?? 0,
      discrepancy_explanation: input.discrepancyExplanation ?? null,
      corrective_action: input.correctiveAction ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeFinancialMetrics,
  identifyFinancialAlerts,
};
