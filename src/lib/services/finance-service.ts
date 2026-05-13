// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — YOUNG PERSON'S FINANCIAL MANAGEMENT SERVICE
// Manages pocket money, allowances, savings, and expenditure tracking for
// looked-after children (CHR 2015 Reg 39 — financial arrangements).
// All spending must be recorded, receipted, and children consulted.
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ───────────────────────────────────────────────────────────────────

export interface ChildAllowance {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  allowance_type: string;
  amount: number;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  active: boolean;
  approved_by: string;
  created_at: string;
}

export interface FinancialTransaction {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  transaction_type: "credit" | "debit";
  category: string;
  amount: number;
  description: string;
  date: string;
  recorded_by: string;
  receipt_reference?: string | null;
  child_consulted: boolean;
  created_at: string;
}

export interface SavingsAccount {
  id: string;
  home_id: string;
  child_id: string;
  child_name: string;
  account_reference?: string | null;
  balance: number;
  last_updated: string;
  created_at: string;
}

// ── Constants ───────────────────────────────────────────────────────────────

export const ALLOWANCE_TYPES: { type: string; label: string; frequency: string }[] = [
  { type: "pocket_money", label: "Pocket Money", frequency: "weekly" },
  { type: "clothing", label: "Clothing Allowance", frequency: "monthly" },
  { type: "birthday", label: "Birthday Allowance", frequency: "annual" },
  { type: "christmas", label: "Christmas Allowance", frequency: "annual" },
  { type: "festival", label: "Festival Allowance", frequency: "annual" },
  { type: "holiday", label: "Holiday Spending", frequency: "as_needed" },
  { type: "activities", label: "Activities Allowance", frequency: "weekly" },
  { type: "savings", label: "Savings Contribution", frequency: "monthly" },
];

export const TRANSACTION_CATEGORIES: string[] = [
  "pocket_money", "clothing", "toiletries", "entertainment", "food_treats",
  "transport", "phone_credit", "education_supplies", "activities", "gifts",
  "savings_deposit", "savings_withdrawal", "birthday_christmas", "other",
];

export const TRANSACTION_TYPES: string[] = ["credit", "debit"];

// ── Pure functions (no DB) ──────────────────────────────────────────────────

/**
 * Compute a financial summary for a single child: totals, balance,
 * category breakdown, consultation rate, and current-month spending.
 */
export function computeChildFinancialSummary(
  transactions: FinancialTransaction[],
  allowances: ChildAllowance[],
  savings: SavingsAccount | null,
  childId: string,
): {
  total_credits: number;
  total_debits: number;
  balance: number;
  savings_balance: number;
  by_category: Record<string, number>;
  active_allowances: ChildAllowance[];
  child_consultation_rate: number;
  monthly_spending: number;
} {
  const childTx = transactions.filter((t) => t.child_id === childId);

  let totalCredits = 0;
  let totalDebits = 0;
  const byCategory: Record<string, number> = {};
  let debitCount = 0;
  let consultedCount = 0;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let monthlySpending = 0;

  for (const t of childTx) {
    if (t.transaction_type === "credit") {
      totalCredits += t.amount;
    } else {
      totalDebits += t.amount;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + t.amount;
      debitCount++;
      if (t.child_consulted) {
        consultedCount++;
      }

      const txDate = new Date(t.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        monthlySpending += t.amount;
      }
    }
  }

  const balance = totalCredits - totalDebits;
  const savingsBalance = savings?.balance ?? 0;
  const activeAllowances = allowances.filter(
    (a) => a.child_id === childId && a.active,
  );
  const childConsultationRate =
    debitCount > 0
      ? Math.round((consultedCount / debitCount) * 1000) / 10
      : 0;

  return {
    total_credits: totalCredits,
    total_debits: totalDebits,
    balance,
    savings_balance: savingsBalance,
    by_category: byCategory,
    active_allowances: activeAllowances,
    child_consultation_rate: childConsultationRate,
    monthly_spending: monthlySpending,
  };
}

/**
 * Compute a home-wide financial overview: totals across all children,
 * monthly allowance cost, savings, consultation and receipt compliance rates.
 */
export function computeHomeFinancialOverview(
  transactions: FinancialTransaction[],
  allowances: ChildAllowance[],
  savings: SavingsAccount[],
): {
  total_children: number;
  total_allowances_monthly: number;
  total_savings: number;
  total_spending_this_month: number;
  by_child: Record<string, { name: string; spending: number; savings: number }>;
  consultation_rate: number;
  receipt_compliance_rate: number;
} {
  // Unique children from transactions
  const childIds = [...new Set(transactions.map((t) => t.child_id))];
  const totalChildren = childIds.length;

  // Monthly cost of all active allowances
  let totalAllowancesMonthly = 0;
  for (const a of allowances) {
    if (!a.active) continue;
    switch (a.frequency) {
      case "weekly":
        totalAllowancesMonthly += a.amount * 4.33;
        break;
      case "monthly":
        totalAllowancesMonthly += a.amount;
        break;
      case "annual":
        totalAllowancesMonthly += a.amount / 12;
        break;
      // as_needed: not included in recurring cost
    }
  }
  totalAllowancesMonthly = Math.round(totalAllowancesMonthly * 100) / 100;

  // Total savings across all accounts
  let totalSavings = 0;
  for (const s of savings) {
    totalSavings += s.balance;
  }

  // Current month spending
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  let totalSpendingThisMonth = 0;

  // By-child spending and savings
  const byChild: Record<string, { name: string; spending: number; savings: number }> = {};

  let debitCount = 0;
  let consultedCount = 0;
  let receiptCount = 0;

  for (const t of transactions) {
    if (t.transaction_type === "debit") {
      debitCount++;
      if (t.child_consulted) consultedCount++;
      if (t.receipt_reference && t.receipt_reference.trim().length > 0) receiptCount++;

      // By child spending
      if (!byChild[t.child_id]) {
        byChild[t.child_id] = { name: t.child_name, spending: 0, savings: 0 };
      }
      byChild[t.child_id].spending += t.amount;

      // Monthly spending
      const txDate = new Date(t.date);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        totalSpendingThisMonth += t.amount;
      }
    }
  }

  // Add savings to by_child
  for (const s of savings) {
    if (!byChild[s.child_id]) {
      byChild[s.child_id] = { name: s.child_name, spending: 0, savings: 0 };
    }
    byChild[s.child_id].savings = s.balance;
  }

  const consultationRate =
    debitCount > 0
      ? Math.round((consultedCount / debitCount) * 1000) / 10
      : 0;

  const receiptComplianceRate =
    debitCount > 0
      ? Math.round((receiptCount / debitCount) * 1000) / 10
      : 0;

  return {
    total_children: totalChildren,
    total_allowances_monthly: totalAllowancesMonthly,
    total_savings: totalSavings,
    total_spending_this_month: totalSpendingThisMonth,
    by_child: byChild,
    consultation_rate: consultationRate,
    receipt_compliance_rate: receiptComplianceRate,
  };
}

/**
 * Identify financial alerts requiring attention — regulatory compliance,
 * missing accounts, low consultation rates, and spending anomalies.
 */
export function identifyFinancialAlerts(
  transactions: FinancialTransaction[],
  allowances: ChildAllowance[],
  savings: SavingsAccount[],
): { type: string; severity: "high" | "medium" | "low"; message: string; child_name?: string }[] {
  const alerts: { type: string; severity: "high" | "medium" | "low"; message: string; child_name?: string }[] = [];

  // Collect unique children from transactions
  const childMap = new Map<string, string>();
  for (const t of transactions) {
    if (!childMap.has(t.child_id)) {
      childMap.set(t.child_id, t.child_name);
    }
  }

  const savingsChildIds = new Set(savings.map((s) => s.child_id));
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Per-child checks
  for (const [childId, childName] of childMap) {
    // ── no_savings_account → high ──────────────────────────────────────
    if (!savingsChildIds.has(childId)) {
      alerts.push({
        type: "no_savings_account",
        severity: "high",
        message: `${childName} has financial transactions but no savings account on record`,
        child_name: childName,
      });
    }

    // ── low_consultation_rate → medium (below 70%) ─────────────────────
    const childDebits = transactions.filter(
      (t) => t.child_id === childId && t.transaction_type === "debit",
    );
    if (childDebits.length > 0) {
      const consultedCount = childDebits.filter((t) => t.child_consulted).length;
      const rate = (consultedCount / childDebits.length) * 100;
      if (rate < 70) {
        alerts.push({
          type: "low_consultation_rate",
          severity: "medium",
          message: `${childName} has a ${Math.round(rate)}% child consultation rate on spending — below the 70% threshold`,
          child_name: childName,
        });
      }
    }

    // ── no_pocket_money_allowance → medium ─────────────────────────────
    const hasPocketMoney = allowances.some(
      (a) => a.child_id === childId && a.allowance_type === "pocket_money" && a.active,
    );
    if (!hasPocketMoney) {
      alerts.push({
        type: "no_pocket_money_allowance",
        severity: "medium",
        message: `${childName} has financial transactions but no active pocket money allowance`,
        child_name: childName,
      });
    }

    // ── high_spending → medium (monthly debits > 2× average) ──────────
    const childMonthlyDebits = childDebits.filter((t) => {
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
    const childMonthlyTotal = childMonthlyDebits.reduce((sum, t) => sum + t.amount, 0);

    // Calculate average monthly spending across all children this month
    const allDebitsThisMonth = transactions.filter((t) => {
      if (t.transaction_type !== "debit") return false;
      const txDate = new Date(t.date);
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });
    const monthlyByChild: Record<string, number> = {};
    for (const t of allDebitsThisMonth) {
      monthlyByChild[t.child_id] = (monthlyByChild[t.child_id] ?? 0) + t.amount;
    }
    const monthlyTotals = Object.values(monthlyByChild);
    const averageMonthly =
      monthlyTotals.length > 0
        ? monthlyTotals.reduce((a, b) => a + b, 0) / monthlyTotals.length
        : 0;

    if (averageMonthly > 0 && childMonthlyTotal > 2 * averageMonthly) {
      alerts.push({
        type: "high_spending",
        severity: "medium",
        message: `${childName} has spent ${childMonthlyTotal.toFixed(2)} this month — more than double the average of ${averageMonthly.toFixed(2)}`,
        child_name: childName,
      });
    }

    // ── low_receipt_compliance → medium (below 80%) ────────────────────
    if (childDebits.length > 0) {
      const withReceipt = childDebits.filter(
        (t) => t.receipt_reference && t.receipt_reference.trim().length > 0,
      ).length;
      const receiptRate = (withReceipt / childDebits.length) * 100;
      if (receiptRate < 80) {
        alerts.push({
          type: "low_receipt_compliance",
          severity: "medium",
          message: `${childName} has ${Math.round(receiptRate)}% receipt compliance — below the 80% threshold`,
          child_name: childName,
        });
      }
    }
  }

  // ── inactive_allowance → low (end_date past but still active) ──────
  for (const a of allowances) {
    if (a.active && a.end_date) {
      const endDate = new Date(a.end_date);
      if (endDate < now) {
        alerts.push({
          type: "inactive_allowance",
          severity: "low",
          message: `${a.child_name}'s ${a.allowance_type} allowance ended on ${a.end_date} but is still marked as active`,
          child_name: a.child_name,
        });
      }
    }
  }

  return alerts;
}

// ── CRUD — Child Allowances ────────────────────────────────────────────────

export async function listAllowances(
  homeId: string,
  filters?: {
    childId?: string;
    allowanceType?: string;
    active?: boolean;
    limit?: number;
  },
): Promise<ServiceResult<ChildAllowance[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_child_allowances") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.allowanceType) q = q.eq("allowance_type", filters.allowanceType);
  if (filters?.active !== undefined) q = q.eq("active", filters.active);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createAllowance(
  input: Omit<ChildAllowance, "id" | "created_at">,
): Promise<ServiceResult<ChildAllowance>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_allowances") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      allowance_type: input.allowance_type,
      amount: input.amount,
      frequency: input.frequency,
      start_date: input.start_date,
      end_date: input.end_date ?? null,
      active: input.active,
      approved_by: input.approved_by,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateAllowance(
  id: string,
  updates: Partial<ChildAllowance>,
): Promise<ServiceResult<ChildAllowance>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_child_allowances") as SB)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Financial Transactions ──────────────────────────────────────────

export async function listTransactions(
  homeId: string,
  filters?: {
    childId?: string;
    category?: string;
    transactionType?: string;
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
  if (filters?.category) q = q.eq("category", filters.category);
  if (filters?.transactionType) q = q.eq("transaction_type", filters.transactionType);
  if (filters?.dateFrom) q = q.gte("date", filters.dateFrom);
  if (filters?.dateTo) q = q.lte("date", filters.dateTo);
  q = q.order("date", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTransaction(
  input: Omit<FinancialTransaction, "id" | "created_at">,
): Promise<ServiceResult<FinancialTransaction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_financial_transactions") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      transaction_type: input.transaction_type,
      category: input.category,
      amount: input.amount,
      description: input.description,
      date: input.date,
      recorded_by: input.recorded_by,
      receipt_reference: input.receipt_reference ?? null,
      child_consulted: input.child_consulted,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── CRUD — Savings Accounts ────────────────────────────────────────────────

export async function listSavingsAccounts(
  homeId: string,
  filters?: {
    childId?: string;
    limit?: number;
  },
): Promise<ServiceResult<SavingsAccount[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_savings_accounts") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  q = q.order("created_at", { ascending: false }).limit(filters?.limit ?? 100);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createSavingsAccount(
  input: Omit<SavingsAccount, "id" | "created_at" | "last_updated"> & { last_updated?: string },
): Promise<ServiceResult<SavingsAccount>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_savings_accounts") as SB)
    .insert({
      home_id: input.home_id,
      child_id: input.child_id,
      child_name: input.child_name,
      account_reference: input.account_reference ?? null,
      balance: input.balance,
      last_updated: input.last_updated ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateSavingsBalance(
  id: string,
  newBalance: number,
): Promise<ServiceResult<SavingsAccount>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_savings_accounts") as SB)
    .update({ balance: newBalance, last_updated: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ─────────────────────────────────────────────────────────

export const _testing = {
  computeChildFinancialSummary,
  computeHomeFinancialOverview,
  identifyFinancialAlerts,
};
