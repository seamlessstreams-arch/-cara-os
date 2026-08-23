// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S FUND MANAGEMENT SERVICE
// Tracks personal funds held for children in care, pocket money,
// savings, birthday/festival allowances, and financial accounting.
// CHR 2015 Reg 34 (money — financial management),
// Reg 9 (children's plans — financial provisions),
// Reg 45 (review — financial accountability).
//
// Covers: fund deposits, withdrawals, pocket money, savings accounts,
// financial audits, and money management education.
//
// SCCIF: Overall Experiences — "Children's money is managed safely
// and transparently." "Children learn financial skills."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient, isSupabaseEnabled } from "@/lib/supabase/server";
import type { ServiceResult } from "@/types/operations";
import type { SB } from "@/lib/supabase/loose-client";

function sb(): SB | null {
  if (!isSupabaseEnabled()) return null;
  return createServerClient() as unknown as SB;
}

// ── Types ──────────────────────────────────────────────────────────────────

export type TransactionType =
  | "pocket_money"
  | "birthday_allowance"
  | "festival_allowance"
  | "savings_deposit"
  | "savings_withdrawal"
  | "clothing_allowance"
  | "gift_received"
  | "earnings"
  | "refund"
  | "other_credit"
  | "purchase"
  | "activity_expense"
  | "other_debit";

export type FundCategory =
  | "pocket_money"
  | "savings"
  | "clothing"
  | "birthday_festival"
  | "personal_expenses"
  | "educational"
  | "other";

export type AuthorisationStatus =
  | "authorised"
  | "pending_authorisation"
  | "declined"
  | "auto_approved"
  | "retrospective";

export type AuditResult =
  | "balanced"
  | "discrepancy_found"
  | "not_audited"
  | "under_investigation";

export interface FundTransaction {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  fund_category: FundCategory;
  amount: number;
  is_credit: boolean;
  running_balance: number;
  authorisation_status: AuthorisationStatus;
  authorised_by: string;
  receipt_attached: boolean;
  child_signed: boolean;
  staff_signed: boolean;
  second_signatory: boolean;
  purpose: string;
  audit_result: AuditResult;
  audit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRANSACTION_TYPES: { type: TransactionType; label: string }[] = [
  { type: "pocket_money", label: "Pocket Money" },
  { type: "birthday_allowance", label: "Birthday Allowance" },
  { type: "festival_allowance", label: "Festival Allowance" },
  { type: "savings_deposit", label: "Savings Deposit" },
  { type: "savings_withdrawal", label: "Savings Withdrawal" },
  { type: "clothing_allowance", label: "Clothing Allowance" },
  { type: "gift_received", label: "Gift Received" },
  { type: "earnings", label: "Earnings" },
  { type: "refund", label: "Refund" },
  { type: "other_credit", label: "Other Credit" },
  { type: "purchase", label: "Purchase" },
  { type: "activity_expense", label: "Activity Expense" },
  { type: "other_debit", label: "Other Debit" },
];

export const FUND_CATEGORIES: { category: FundCategory; label: string }[] = [
  { category: "pocket_money", label: "Pocket Money" },
  { category: "savings", label: "Savings" },
  { category: "clothing", label: "Clothing" },
  { category: "birthday_festival", label: "Birthday/Festival" },
  { category: "personal_expenses", label: "Personal Expenses" },
  { category: "educational", label: "Educational" },
  { category: "other", label: "Other" },
];

export const AUTHORISATION_STATUSES: { status: AuthorisationStatus; label: string }[] = [
  { status: "authorised", label: "Authorised" },
  { status: "pending_authorisation", label: "Pending Authorisation" },
  { status: "declined", label: "Declined" },
  { status: "auto_approved", label: "Auto Approved" },
  { status: "retrospective", label: "Retrospective" },
];

export const AUDIT_RESULTS: { result: AuditResult; label: string }[] = [
  { result: "balanced", label: "Balanced" },
  { result: "discrepancy_found", label: "Discrepancy Found" },
  { result: "not_audited", label: "Not Audited" },
  { result: "under_investigation", label: "Under Investigation" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computeFundMetrics(
  transactions: FundTransaction[],
): {
  total_transactions: number;
  total_credits: number;
  total_debits: number;
  total_credit_amount: number;
  total_debit_amount: number;
  net_balance: number;
  unique_children: number;
  receipt_attached_rate: number | null;
  child_signed_rate: number | null;
  staff_signed_rate: number | null;
  second_signatory_rate: number | null;
  authorised_rate: number | null;
  pending_authorisation_count: number;
  discrepancy_count: number;
  not_audited_count: number;
  by_transaction_type: Record<string, number>;
  by_fund_category: Record<string, number>;
  by_authorisation_status: Record<string, number>;
  by_audit_result: Record<string, number>;
} {
  const credits = transactions.filter((t) => t.is_credit);
  const debits = transactions.filter((t) => !t.is_credit);

  const totalCreditAmount = credits.reduce((sum, t) => sum + t.amount, 0);
  const totalDebitAmount = debits.reduce((sum, t) => sum + t.amount, 0);
  const netBalance = Math.round((totalCreditAmount - totalDebitAmount) * 100) / 100;

  const uniqueChildren = new Set(transactions.map((t) => t.child_id)).size;

  const receiptAttached = transactions.filter((t) => t.receipt_attached).length;
  const receiptRate =
    transactions.length > 0
      ? Math.round((receiptAttached / transactions.length) * 1000) / 10
      : null;

  const childSigned = transactions.filter((t) => t.child_signed).length;
  const childRate =
    transactions.length > 0
      ? Math.round((childSigned / transactions.length) * 1000) / 10
      : null;

  const staffSigned = transactions.filter((t) => t.staff_signed).length;
  const staffRate =
    transactions.length > 0
      ? Math.round((staffSigned / transactions.length) * 1000) / 10
      : null;

  const secondSig = transactions.filter((t) => t.second_signatory).length;
  const secondRate =
    transactions.length > 0
      ? Math.round((secondSig / transactions.length) * 1000) / 10
      : null;

  const authorised = transactions.filter((t) => t.authorisation_status === "authorised" || t.authorisation_status === "auto_approved").length;
  const authorisedRate =
    transactions.length > 0
      ? Math.round((authorised / transactions.length) * 1000) / 10
      : null;

  const pendingAuth = transactions.filter((t) => t.authorisation_status === "pending_authorisation").length;
  const discrepancy = transactions.filter((t) => t.audit_result === "discrepancy_found").length;
  const notAudited = transactions.filter((t) => t.audit_result === "not_audited").length;

  const byType: Record<string, number> = {};
  for (const t of transactions) byType[t.transaction_type] = (byType[t.transaction_type] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const t of transactions) byCategory[t.fund_category] = (byCategory[t.fund_category] ?? 0) + 1;

  const byAuth: Record<string, number> = {};
  for (const t of transactions) byAuth[t.authorisation_status] = (byAuth[t.authorisation_status] ?? 0) + 1;

  const byAudit: Record<string, number> = {};
  for (const t of transactions) byAudit[t.audit_result] = (byAudit[t.audit_result] ?? 0) + 1;

  return {
    total_transactions: transactions.length,
    total_credits: credits.length,
    total_debits: debits.length,
    total_credit_amount: Math.round(totalCreditAmount * 100) / 100,
    total_debit_amount: Math.round(totalDebitAmount * 100) / 100,
    net_balance: netBalance,
    unique_children: uniqueChildren,
    receipt_attached_rate: receiptRate,
    child_signed_rate: childRate,
    staff_signed_rate: staffRate,
    second_signatory_rate: secondRate,
    authorised_rate: authorisedRate,
    pending_authorisation_count: pendingAuth,
    discrepancy_count: discrepancy,
    not_audited_count: notAudited,
    by_transaction_type: byType,
    by_fund_category: byCategory,
    by_authorisation_status: byAuth,
    by_audit_result: byAudit,
  };
}

export function identifyFundAlerts(
  transactions: FundTransaction[],
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

  // Discrepancy found
  for (const t of transactions) {
    if (t.audit_result === "discrepancy_found") {
      alerts.push({
        type: "discrepancy_found",
        severity: "critical",
        message: `Financial discrepancy found for ${t.child_name} on ${t.transaction_date} — investigate immediately`,
        id: t.id,
      });
    }
  }

  // Under investigation
  for (const t of transactions) {
    if (t.audit_result === "under_investigation") {
      alerts.push({
        type: "under_investigation",
        severity: "high",
        message: `Transaction for ${t.child_name} on ${t.transaction_date} under investigation — £${t.amount.toFixed(2)}`,
        id: t.id,
      });
    }
  }

  // Pending authorisation
  const pending = transactions.filter((t) => t.authorisation_status === "pending_authorisation").length;
  if (pending >= 1) {
    alerts.push({
      type: "pending_authorisation",
      severity: "high",
      message: `${pending} ${pending === 1 ? "transaction" : "transactions"} pending authorisation — review and approve promptly`,
      id: "pending_authorisation",
    });
  }

  // No receipt for debits
  const noReceipt = transactions.filter((t) => !t.is_credit && !t.receipt_attached).length;
  if (noReceipt >= 3) {
    alerts.push({
      type: "no_receipt",
      severity: "medium",
      message: `${noReceipt} debit transactions without receipts attached — ensure financial accountability`,
      id: "no_receipt",
    });
  }

  // Not audited
  const notAudited = transactions.filter((t) => t.audit_result === "not_audited").length;
  if (notAudited >= 5) {
    alerts.push({
      type: "not_audited",
      severity: "medium",
      message: `${notAudited} transactions not yet audited — schedule financial audit`,
      id: "not_audited",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listTransactions(
  homeId: string,
  filters?: {
    childId?: string;
    transactionType?: TransactionType;
    fundCategory?: FundCategory;
    limit?: number;
  },
): Promise<ServiceResult<FundTransaction[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_fund_transactions") as SB).select("*").eq("home_id", homeId);
  if (filters?.childId) q = q.eq("child_id", filters.childId);
  if (filters?.transactionType) q = q.eq("transaction_type", filters.transactionType);
  if (filters?.fundCategory) q = q.eq("fund_category", filters.fundCategory);
  q = q.order("transaction_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createTransaction(
  input: {
    homeId: string;
    childName: string;
    childId: string;
    transactionDate: string;
    transactionType: TransactionType;
    fundCategory: FundCategory;
    amount: number;
    isCredit: boolean;
    runningBalance: number;
    authorisationStatus: AuthorisationStatus;
    authorisedBy: string;
    receiptAttached: boolean;
    childSigned: boolean;
    staffSigned: boolean;
    secondSignatory: boolean;
    purpose: string;
    auditResult: AuditResult;
    auditDate?: string;
    notes?: string;
  },
): Promise<ServiceResult<FundTransaction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_fund_transactions") as SB)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId,
      transaction_date: input.transactionDate,
      transaction_type: input.transactionType,
      fund_category: input.fundCategory,
      amount: input.amount,
      is_credit: input.isCredit,
      running_balance: input.runningBalance,
      authorisation_status: input.authorisationStatus,
      authorised_by: input.authorisedBy,
      receipt_attached: input.receiptAttached,
      child_signed: input.childSigned,
      staff_signed: input.staffSigned,
      second_signatory: input.secondSignatory,
      purpose: input.purpose,
      audit_result: input.auditResult,
      audit_date: input.auditDate ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateTransaction(
  id: string,
  updates: Partial<Record<string, unknown>>,
): Promise<ServiceResult<FundTransaction>> {
  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_fund_transactions") as SB)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computeFundMetrics,
  identifyFundAlerts,
};
