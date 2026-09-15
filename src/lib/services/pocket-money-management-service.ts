// ══════════════════════════════════════════════════════════════════════════════
// CARA — POCKET MONEY MANAGEMENT SERVICE
// Tracks pocket money allocation, spending, savings, and financial
// literacy support for children in residential care.
// CHR 2015 Reg 9 (financial competence — managing money),
// Reg 7 (individual child — appropriate independence).
//
// Covers: pocket money amount, spending category, saving behaviour,
// financial literacy support, and age-appropriate independence.
//
// SCCIF: Experiences — "Children learn to manage money appropriately."
// "Financial records are transparent and auditable."
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
  | "weekly_allowance"
  | "birthday_money"
  | "gift_money"
  | "earned_income"
  | "savings_deposit"
  | "savings_withdrawal"
  | "purchase"
  | "charitable_donation"
  | "refund"
  | "other";

export type SpendingCategory =
  | "clothing"
  | "food_treats"
  | "entertainment"
  | "electronics"
  | "hobbies"
  | "toiletries"
  | "transport"
  | "gifts_for_others"
  | "savings"
  | "other";

export type ApprovalStatus =
  | "approved"
  | "pending"
  | "declined"
  | "not_required"
  | "retrospective";

export type FinancialLiteracyLevel =
  | "independent"
  | "supported"
  | "learning"
  | "needs_guidance"
  | "not_assessed";

export interface PocketMoneyManagementRecord {
  id: string;
  home_id: string;
  transaction_type: TransactionType;
  spending_category: SpendingCategory;
  approval_status: ApprovalStatus;
  financial_literacy_level: FinancialLiteracyLevel;
  transaction_date: string;
  child_name: string;
  child_id: string | null;
  recorded_by: string;
  receipt_obtained: boolean | null; // null = not recorded; judgements are tri-state — credit needs === true, breach needs === false
  child_chose_purchase: boolean | null;
  age_appropriate_spend: boolean | null;
  budget_discussed: boolean | null;
  savings_encouraged: boolean | null;
  value_for_money_discussed: boolean | null;
  financial_record_updated: boolean | null;
  balance_reconciled: boolean | null;
  social_worker_informed: boolean;
  parent_informed: boolean;
  care_plan_linked: boolean | null;
  recorded_promptly: boolean | null;
  issues_found: string[];
  actions_taken: string[];
  amount_pence: number;
  running_balance_pence: number;
  next_review_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Constants ────────────────────────────────────────────────────────────

export const TRANSACTION_TYPES: { type: TransactionType; label: string }[] = [
  { type: "weekly_allowance", label: "Weekly Allowance" },
  { type: "birthday_money", label: "Birthday Money" },
  { type: "gift_money", label: "Gift Money" },
  { type: "earned_income", label: "Earned Income" },
  { type: "savings_deposit", label: "Savings Deposit" },
  { type: "savings_withdrawal", label: "Savings Withdrawal" },
  { type: "purchase", label: "Purchase" },
  { type: "charitable_donation", label: "Charitable Donation" },
  { type: "refund", label: "Refund" },
  { type: "other", label: "Other" },
];

export const SPENDING_CATEGORIES: { category: SpendingCategory; label: string }[] = [
  { category: "clothing", label: "Clothing" },
  { category: "food_treats", label: "Food/Treats" },
  { category: "entertainment", label: "Entertainment" },
  { category: "electronics", label: "Electronics" },
  { category: "hobbies", label: "Hobbies" },
  { category: "toiletries", label: "Toiletries" },
  { category: "transport", label: "Transport" },
  { category: "gifts_for_others", label: "Gifts for Others" },
  { category: "savings", label: "Savings" },
  { category: "other", label: "Other" },
];

export const APPROVAL_STATUSES: { status: ApprovalStatus; label: string }[] = [
  { status: "approved", label: "Approved" },
  { status: "pending", label: "Pending" },
  { status: "declined", label: "Declined" },
  { status: "not_required", label: "Not Required" },
  { status: "retrospective", label: "Retrospective" },
];

export const FINANCIAL_LITERACY_LEVELS: { level: FinancialLiteracyLevel; label: string }[] = [
  { level: "independent", label: "Independent" },
  { level: "supported", label: "Supported" },
  { level: "learning", label: "Learning" },
  { level: "needs_guidance", label: "Needs Guidance" },
  { level: "not_assessed", label: "Not Assessed" },
];

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePocketMoneyMetrics(
  records: PocketMoneyManagementRecord[],
): {
  total_transactions: number;
  purchase_count: number;
  savings_deposit_count: number;
  declined_count: number;
  retrospective_count: number;
  receipt_obtained_rate: number | null;
  child_chose_purchase_rate: number | null;
  age_appropriate_rate: number | null;
  budget_discussed_rate: number | null;
  savings_encouraged_rate: number | null;
  value_for_money_rate: number | null;
  financial_record_rate: number | null;
  balance_reconciled_rate: number | null;
  social_worker_informed_rate: number | null;
  parent_informed_rate: number | null;
  care_plan_linked_rate: number | null;
  recorded_promptly_rate: number | null;
  total_amount_pence: number;
  unique_children: number;
  by_transaction_type: Record<string, number>;
  by_spending_category: Record<string, number>;
  by_approval_status: Record<string, number>;
  by_financial_literacy_level: Record<string, number>;
} {
  const purchases = records.filter((r) => r.transaction_type === "purchase").length;
  const savingsDeposits = records.filter((r) => r.transaction_type === "savings_deposit").length;
  const declinedCount = records.filter((r) => r.approval_status === "declined").length;
  const retrospectiveCount = records.filter((r) => r.approval_status === "retrospective").length;

  // Rated over the records where the question was answered either way. With the
  // judgement columns tri-state (null = not recorded), an unrecorded answer in
  // the denominator would score silence as a "no" — the same fabrication the
  // old `?? true` creates made in the other direction. While every field is
  // still a strict boolean this is behaviour-identical.
  const boolRate = (field: keyof PocketMoneyManagementRecord) => {
    const recorded = records.filter((r) => r[field] !== null && r[field] !== undefined);
    const count = recorded.filter((r) => r[field] === true).length;
    return recorded.length > 0
      ? Math.round((count / recorded.length) * 1000) / 10
      : null;
  };

  const totalAmount = records.reduce((sum, r) => sum + r.amount_pence, 0);

  const uniqueChildren = new Set(records.map((r) => r.child_name)).size;

  const byType: Record<string, number> = {};
  for (const r of records) byType[r.transaction_type] = (byType[r.transaction_type] ?? 0) + 1;

  const byCategory: Record<string, number> = {};
  for (const r of records) byCategory[r.spending_category] = (byCategory[r.spending_category] ?? 0) + 1;

  const byApproval: Record<string, number> = {};
  for (const r of records) byApproval[r.approval_status] = (byApproval[r.approval_status] ?? 0) + 1;

  const byLiteracy: Record<string, number> = {};
  for (const r of records) byLiteracy[r.financial_literacy_level] = (byLiteracy[r.financial_literacy_level] ?? 0) + 1;

  return {
    total_transactions: records.length,
    purchase_count: purchases,
    savings_deposit_count: savingsDeposits,
    declined_count: declinedCount,
    retrospective_count: retrospectiveCount,
    receipt_obtained_rate: boolRate("receipt_obtained"),
    child_chose_purchase_rate: boolRate("child_chose_purchase"),
    age_appropriate_rate: boolRate("age_appropriate_spend"),
    budget_discussed_rate: boolRate("budget_discussed"),
    savings_encouraged_rate: boolRate("savings_encouraged"),
    value_for_money_rate: boolRate("value_for_money_discussed"),
    financial_record_rate: boolRate("financial_record_updated"),
    balance_reconciled_rate: boolRate("balance_reconciled"),
    social_worker_informed_rate: boolRate("social_worker_informed"),
    parent_informed_rate: boolRate("parent_informed"),
    care_plan_linked_rate: boolRate("care_plan_linked"),
    recorded_promptly_rate: boolRate("recorded_promptly"),
    total_amount_pence: totalAmount,
    unique_children: uniqueChildren,
    by_transaction_type: byType,
    by_spending_category: byCategory,
    by_approval_status: byApproval,
    by_financial_literacy_level: byLiteracy,
  };
}

export function identifyPocketMoneyAlerts(
  records: PocketMoneyManagementRecord[],
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

  // Retrospective approval without receipt
  for (const r of records) {
    if (r.approval_status === "retrospective" && r.receipt_obtained !== true) {
      alerts.push({
        type: "retrospective_no_receipt",
        severity: "critical",
        message: r.receipt_obtained === false
          ? `${r.child_name} has retrospective ${r.spending_category.replace(/_/g, " ")} transaction without receipt — ensure financial accountability`
          : `${r.child_name} has retrospective ${r.spending_category.replace(/_/g, " ")} transaction with no receipt recorded — obtain or evidence the receipt now`,
        id: r.id,
      });
    }
  }

  // Balance not reconciled
  const notReconciled = records.filter((r) => r.balance_reconciled !== true).length;
  if (notReconciled >= 1) {
    alerts.push({
      type: "balance_not_reconciled",
      severity: "high",
      message: `${notReconciled} ${notReconciled === 1 ? "transaction has" : "transactions have"} no balance reconciliation evidenced — reconcile accounts promptly`,
      id: "balance_not_reconciled",
    });
  }

  // Financial record not updated
  const noFinancialRecord = records.filter((r) => r.financial_record_updated !== true).length;
  if (noFinancialRecord >= 1) {
    alerts.push({
      type: "financial_record_not_updated",
      severity: "high",
      message: `${noFinancialRecord} ${noFinancialRecord === 1 ? "transaction has" : "transactions have"} no financial-record update evidenced — maintain accurate records`,
      id: "financial_record_not_updated",
    });
  }

  // Budget not discussed
  const noBudget = records.filter((r) => r.budget_discussed !== true).length;
  if (noBudget >= 2) {
    alerts.push({
      type: "budget_not_discussed",
      severity: "medium",
      message: `${noBudget} transactions without evidenced budget discussion — strengthen financial literacy support`,
      id: "budget_not_discussed",
    });
  }

  // No receipt obtained
  const noReceipt = records.filter((r) => r.receipt_obtained !== true).length;
  if (noReceipt >= 3) {
    alerts.push({
      type: "receipts_missing",
      severity: "medium",
      message: `${noReceipt} transactions without evidenced receipts — ensure financial transparency`,
      id: "receipts_missing",
    });
  }

  return alerts;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listRecords(
  homeId: string,
  filters?: {
    transactionType?: TransactionType;
    spendingCategory?: SpendingCategory;
    approvalStatus?: ApprovalStatus;
    financialLiteracyLevel?: FinancialLiteracyLevel;
    limit?: number;
  },
): Promise<ServiceResult<PocketMoneyManagementRecord[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const s = sb();
  if (!s) return { ok: true, data: [] };

  let q = (s.from("cs_pocket_money_management") as SB).select("*").eq("home_id", homeId);
  if (filters?.transactionType) q = q.eq("transaction_type", filters.transactionType);
  if (filters?.spendingCategory) q = q.eq("spending_category", filters.spendingCategory);
  if (filters?.approvalStatus) q = q.eq("approval_status", filters.approvalStatus);
  if (filters?.financialLiteracyLevel) q = q.eq("financial_literacy_level", filters.financialLiteracyLevel);
  q = q.order("transaction_date", { ascending: false }).limit(filters?.limit ?? 200);

  const { data, error } = await q;
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createRecord(
  payload: {
    homeId: string;
    transactionType: TransactionType;
    spendingCategory: SpendingCategory;
    approvalStatus: ApprovalStatus;
    financialLiteracyLevel: FinancialLiteracyLevel;
    transactionDate: string;
    childName: string;
    childId?: string | null;
    recordedBy: string;
    receiptObtained?: boolean;
    childChosePurchase?: boolean;
    ageAppropriateSpend?: boolean;
    budgetDiscussed?: boolean;
    savingsEncouraged?: boolean;
    valueForMoneyDiscussed?: boolean;
    financialRecordUpdated?: boolean;
    balanceReconciled?: boolean;
    socialWorkerInformed?: boolean;
    parentInformed?: boolean;
    carePlanLinked?: boolean;
    recordedPromptly?: boolean;
    issuesFound?: string[];
    actionsTaken?: string[];
    amountPence: number;
    runningBalancePence: number;
    nextReviewDate?: string | null;
    notes?: string | null;
  },
): Promise<ServiceResult<PocketMoneyManagementRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (s.from("cs_pocket_money_management") as SB)
    .insert({
      home_id: payload.homeId,
      transaction_type: payload.transactionType,
      spending_category: payload.spendingCategory,
      approval_status: payload.approvalStatus,
      financial_literacy_level: payload.financialLiteracyLevel,
      transaction_date: payload.transactionDate,
      child_name: payload.childName,
      child_id: payload.childId ?? null,
      recorded_by: payload.recordedBy,
      receipt_obtained: payload.receiptObtained ?? null,
      child_chose_purchase: payload.childChosePurchase ?? null,
      age_appropriate_spend: payload.ageAppropriateSpend ?? null,
      budget_discussed: payload.budgetDiscussed ?? null,
      savings_encouraged: payload.savingsEncouraged ?? null,
      value_for_money_discussed: payload.valueForMoneyDiscussed ?? null,
      financial_record_updated: payload.financialRecordUpdated ?? null,
      balance_reconciled: payload.balanceReconciled ?? null,
      social_worker_informed: payload.socialWorkerInformed ?? false,
      parent_informed: payload.parentInformed ?? false,
      care_plan_linked: payload.carePlanLinked ?? null,
      recorded_promptly: payload.recordedPromptly ?? null,
      issues_found: payload.issuesFound ?? [],
      actions_taken: payload.actionsTaken ?? [],
      amount_pence: payload.amountPence,
      running_balance_pence: payload.runningBalancePence,
      next_review_date: payload.nextReviewDate ?? null,
      notes: payload.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function updateRecord(
  id: string,
  updates: Partial<{
    transactionType: TransactionType;
    spendingCategory: SpendingCategory;
    approvalStatus: ApprovalStatus;
    financialLiteracyLevel: FinancialLiteracyLevel;
    transactionDate: string;
    childName: string;
    childId: string | null;
    recordedBy: string;
    receiptObtained: boolean;
    childChosePurchase: boolean;
    ageAppropriateSpend: boolean;
    budgetDiscussed: boolean;
    savingsEncouraged: boolean;
    valueForMoneyDiscussed: boolean;
    financialRecordUpdated: boolean;
    balanceReconciled: boolean;
    socialWorkerInformed: boolean;
    parentInformed: boolean;
    carePlanLinked: boolean;
    recordedPromptly: boolean;
    issuesFound: string[];
    actionsTaken: string[];
    amountPence: number;
    runningBalancePence: number;
    nextReviewDate: string | null;
    notes: string | null;
  }>,
): Promise<ServiceResult<PocketMoneyManagementRecord>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const s = sb();
  if (!s) return { ok: false, error: "Supabase not configured" };

  const mapped: Record<string, unknown> = {};
  if (updates.transactionType !== undefined) mapped.transaction_type = updates.transactionType;
  if (updates.spendingCategory !== undefined) mapped.spending_category = updates.spendingCategory;
  if (updates.approvalStatus !== undefined) mapped.approval_status = updates.approvalStatus;
  if (updates.financialLiteracyLevel !== undefined) mapped.financial_literacy_level = updates.financialLiteracyLevel;
  if (updates.transactionDate !== undefined) mapped.transaction_date = updates.transactionDate;
  if (updates.childName !== undefined) mapped.child_name = updates.childName;
  if (updates.childId !== undefined) mapped.child_id = updates.childId;
  if (updates.recordedBy !== undefined) mapped.recorded_by = updates.recordedBy;
  if (updates.receiptObtained !== undefined) mapped.receipt_obtained = updates.receiptObtained;
  if (updates.childChosePurchase !== undefined) mapped.child_chose_purchase = updates.childChosePurchase;
  if (updates.ageAppropriateSpend !== undefined) mapped.age_appropriate_spend = updates.ageAppropriateSpend;
  if (updates.budgetDiscussed !== undefined) mapped.budget_discussed = updates.budgetDiscussed;
  if (updates.savingsEncouraged !== undefined) mapped.savings_encouraged = updates.savingsEncouraged;
  if (updates.valueForMoneyDiscussed !== undefined) mapped.value_for_money_discussed = updates.valueForMoneyDiscussed;
  if (updates.financialRecordUpdated !== undefined) mapped.financial_record_updated = updates.financialRecordUpdated;
  if (updates.balanceReconciled !== undefined) mapped.balance_reconciled = updates.balanceReconciled;
  if (updates.socialWorkerInformed !== undefined) mapped.social_worker_informed = updates.socialWorkerInformed;
  if (updates.parentInformed !== undefined) mapped.parent_informed = updates.parentInformed;
  if (updates.carePlanLinked !== undefined) mapped.care_plan_linked = updates.carePlanLinked;
  if (updates.recordedPromptly !== undefined) mapped.recorded_promptly = updates.recordedPromptly;
  if (updates.issuesFound !== undefined) mapped.issues_found = updates.issuesFound;
  if (updates.actionsTaken !== undefined) mapped.actions_taken = updates.actionsTaken;
  if (updates.amountPence !== undefined) mapped.amount_pence = updates.amountPence;
  if (updates.runningBalancePence !== undefined) mapped.running_balance_pence = updates.runningBalancePence;
  if (updates.nextReviewDate !== undefined) mapped.next_review_date = updates.nextReviewDate;
  if (updates.notes !== undefined) mapped.notes = updates.notes;

  const { data, error } = await (s.from("cs_pocket_money_management") as SB)
    .update(mapped)
    .eq("id", id)
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePocketMoneyMetrics,
  identifyPocketMoneyAlerts,
};
