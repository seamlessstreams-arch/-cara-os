// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S POCKET MONEY AUDIT SERVICE
// Manages audit trail of pocket money transactions, receipt management,
// balance reconciliation, spending oversight, and Ofsted financial
// compliance for looked-after children.
// CHR 2015 Reg 34 (money — financial management),
// Reg 9 (children's plans — financial provisions),
// Reg 45 (review — financial accountability).
//
// Covers: transaction auditing, receipt verification, balance reconciliation,
// spending oversight, dual-signature compliance, and child consultation.
//
// SCCIF: Experiences — "Children's money is managed safely and transparently."
// "Financial records are accurate, auditable, and compliant."
// ══════════════════════════════════════════════════════════════════════════════

import { createServerClient } from "@/lib/supabase/server";
import { isSupabaseEnabled } from "@/lib/supabase/server";

type SB = ReturnType<typeof createServerClient> extends Promise<infer R> ? R : never;

export type ServiceResult<T> = { ok: boolean; data?: T; error?: string };

// ── Enums (const arrays + types) ─────────────────────────────────────────

export const TRANSACTION_TYPES = [
  "weekly_allowance",
  "birthday_gift",
  "savings_deposit",
  "savings_withdrawal",
  "clothing_allowance",
  "activity_money",
  "pocket_money_top_up",
  "refund",
  "charitable_donation",
  "miscellaneous",
] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const AUDIT_OUTCOMES = [
  "compliant",
  "minor_discrepancy",
  "significant_discrepancy",
  "fraud_suspected",
  "not_audited",
] as const;
export type AuditOutcome = (typeof AUDIT_OUTCOMES)[number];

export const RECONCILIATION_STATUSES = [
  "reconciled",
  "pending",
  "discrepancy_found",
  "under_review",
  "escalated",
] as const;
export type ReconciliationStatus = (typeof RECONCILIATION_STATUSES)[number];

export const SPENDING_CATEGORIES = [
  "food_treats",
  "clothing",
  "toiletries",
  "entertainment",
  "hobbies",
  "savings",
  "gifts_for_others",
  "transport",
  "educational",
  "personal_items",
] as const;
export type SpendingCategory = (typeof SPENDING_CATEGORIES)[number];

// ── Row type ─────────────────────────────────────────────────────────────

export interface ChildrensPocketMoneyAuditRow {
  id: string;
  home_id: string;
  child_name: string;
  child_id: string | null;
  audit_date: string;
  transaction_type: TransactionType;
  audit_outcome: AuditOutcome;
  reconciliation_status: ReconciliationStatus;
  spending_category: SpendingCategory;
  amount: number;
  running_balance: number;
  receipt_obtained: boolean;
  child_signed: boolean;
  staff_witnessed: boolean;
  two_signatures_present: boolean;
  balance_matches_record: boolean;
  child_consulted_on_spending: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── CRUD ─────────────────────────────────────────────────────────────────

export async function listChildrensPocketMoneyAudits(
  homeId: string,
): Promise<ServiceResult<ChildrensPocketMoneyAuditRow[]>> {
  if (!isSupabaseEnabled()) return { ok: true, data: [] };

  const sb = await createServerClient();
  if (!sb) return { ok: true, data: [] };

  const { data, error } = await (sb.from("cs_childrens_pocket_money_audits") as any)
    .select("*")
    .eq("home_id", homeId)
    .order("audit_date", { ascending: false });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ?? [] };
}

export async function createChildrensPocketMoneyAudit(input: {
  homeId: string;
  childName: string;
  childId?: string | null;
  auditDate: string;
  transactionType: TransactionType;
  auditOutcome: AuditOutcome;
  reconciliationStatus: ReconciliationStatus;
  spendingCategory: SpendingCategory;
  amount: number;
  runningBalance: number;
  receiptObtained: boolean;
  childSigned: boolean;
  staffWitnessed: boolean;
  twoSignaturesPresent: boolean;
  balanceMatchesRecord: boolean;
  childConsultedOnSpending: boolean;
  notes?: string | null;
}): Promise<ServiceResult<ChildrensPocketMoneyAuditRow>> {
  if (!isSupabaseEnabled()) return { ok: false, error: "Supabase not configured" };

  const sb = await createServerClient();
  if (!sb) return { ok: false, error: "Supabase not configured" };

  const { data, error } = await (sb.from("cs_childrens_pocket_money_audits") as any)
    .insert({
      home_id: input.homeId,
      child_name: input.childName,
      child_id: input.childId ?? null,
      audit_date: input.auditDate,
      transaction_type: input.transactionType,
      audit_outcome: input.auditOutcome,
      reconciliation_status: input.reconciliationStatus,
      spending_category: input.spendingCategory,
      amount: input.amount,
      running_balance: input.runningBalance,
      receipt_obtained: input.receiptObtained,
      child_signed: input.childSigned,
      staff_witnessed: input.staffWitnessed,
      two_signatures_present: input.twoSignaturesPresent,
      balance_matches_record: input.balanceMatchesRecord,
      child_consulted_on_spending: input.childConsultedOnSpending,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

// ── Pure functions (no DB) ───────────────────────────────────────────────

export function computePocketMoneyAuditMetrics(
  rows: ChildrensPocketMoneyAuditRow[],
): {
  total_audits: number;
  significant_discrepancy_count: number;
  fraud_suspected_count: number;
  discrepancy_found_count: number;
  not_audited_count: number;
  receipt_rate: number;
  child_signed_rate: number;
  staff_witnessed_rate: number;
  two_signatures_rate: number;
  balance_matches_rate: number;
  transaction_type_breakdown: Record<string, number>;
  outcome_breakdown: Record<string, number>;
  unique_children: number;
} {
  const total = rows.length;

  const significantDiscrepancy = rows.filter((r) => r.audit_outcome === "significant_discrepancy").length;
  const fraudSuspected = rows.filter((r) => r.audit_outcome === "fraud_suspected").length;
  const discrepancyFound = rows.filter((r) => r.reconciliation_status === "discrepancy_found").length;
  const notAudited = rows.filter((r) => r.audit_outcome === "not_audited").length;

  const boolRate = (field: keyof ChildrensPocketMoneyAuditRow) => {
    const count = rows.filter((r) => r[field] === true).length;
    return total > 0
      ? Math.round((count / total) * 1000) / 10
      : 0;
  };

  const transactionTypeBreakdown: Record<string, number> = {};
  for (const r of rows) transactionTypeBreakdown[r.transaction_type] = (transactionTypeBreakdown[r.transaction_type] ?? 0) + 1;

  const outcomeBreakdown: Record<string, number> = {};
  for (const r of rows) outcomeBreakdown[r.audit_outcome] = (outcomeBreakdown[r.audit_outcome] ?? 0) + 1;

  const uniqueChildren = new Set(rows.map((r) => r.child_name)).size;

  return {
    total_audits: total,
    significant_discrepancy_count: significantDiscrepancy,
    fraud_suspected_count: fraudSuspected,
    discrepancy_found_count: discrepancyFound,
    not_audited_count: notAudited,
    receipt_rate: boolRate("receipt_obtained"),
    child_signed_rate: boolRate("child_signed"),
    staff_witnessed_rate: boolRate("staff_witnessed"),
    two_signatures_rate: boolRate("two_signatures_present"),
    balance_matches_rate: boolRate("balance_matches_record"),
    transaction_type_breakdown: transactionTypeBreakdown,
    outcome_breakdown: outcomeBreakdown,
    unique_children: uniqueChildren,
  };
}

export function computePocketMoneyAuditAlerts(
  rows: ChildrensPocketMoneyAuditRow[],
): { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] {
  const alerts: { type: string; severity: "critical" | "high" | "medium"; message: string; record_id?: string }[] = [];

  // Critical: fraud suspected
  for (const r of rows) {
    if (r.audit_outcome === "fraud_suspected") {
      alerts.push({
        type: "fraud_suspected",
        severity: "critical",
        message: `Fraud suspected for ${r.child_name} on ${r.audit_date} — ${r.spending_category.replace(/_/g, " ")} transaction of £${r.amount.toFixed(2)} requires immediate investigation`,
        record_id: r.id,
      });
    }
  }

  // High: significant discrepancy + balance not matching
  for (const r of rows) {
    if (r.audit_outcome === "significant_discrepancy" && !r.balance_matches_record) {
      alerts.push({
        type: "significant_discrepancy_balance_mismatch",
        severity: "high",
        message: `Significant discrepancy for ${r.child_name} with balance not matching record — reconcile and investigate promptly`,
        record_id: r.id,
      });
    }
  }

  // High: two signatures missing for multiple transactions
  const noTwoSigs = rows.filter((r) => !r.two_signatures_present).length;
  if (noTwoSigs >= 2) {
    alerts.push({
      type: "two_signatures_missing",
      severity: "high",
      message: `${noTwoSigs} transactions without two signatures present — ensure dual-signature compliance for financial accountability`,
    });
  }

  // Medium: child not consulted on spending for multiple transactions
  const notConsulted = rows.filter((r) => !r.child_consulted_on_spending).length;
  if (notConsulted >= 2) {
    alerts.push({
      type: "child_not_consulted",
      severity: "medium",
      message: `${notConsulted} transactions where child was not consulted on spending — children must be involved in decisions about their money`,
    });
  }

  return alerts;
}

export function generatePocketMoneyAuditCaraInsights(
  metrics: ReturnType<typeof computePocketMoneyAuditMetrics>,
  alerts: ReturnType<typeof computePocketMoneyAuditAlerts>,
): string[] {
  const insights: string[] = [];

  // Insight 1: Summary stats (cyan-themed)
  insights.push(
    `[cyan] ${metrics.total_audits} pocket money audits recorded across ${metrics.unique_children} ${metrics.unique_children === 1 ? "child" : "children"}. ` +
      `Receipt rate ${metrics.receipt_rate}%, child signed ${metrics.child_signed_rate}%, ` +
      `staff witnessed ${metrics.staff_witnessed_rate}%, two signatures ${metrics.two_signatures_rate}%.`,
  );

  // Insight 2: Priority concerns (amber-themed)
  const criticalAlerts = alerts.filter((a) => a.severity === "critical");
  const highAlerts = alerts.filter((a) => a.severity === "high");
  if (criticalAlerts.length > 0 || highAlerts.length > 0) {
    insights.push(
      `[amber] ${criticalAlerts.length} critical and ${highAlerts.length} high-priority alerts identified. ` +
        `${metrics.fraud_suspected_count} fraud suspected, ${metrics.significant_discrepancy_count} significant discrepancies, ` +
        `and ${metrics.discrepancy_found_count} reconciliation discrepancies found.`,
    );
  } else {
    insights.push(
      `[amber] No critical or high-priority alerts currently active. ` +
        `${metrics.not_audited_count} audits marked as not audited. ` +
        `Continue regular pocket money auditing to maintain Ofsted financial compliance.`,
    );
  }

  // Insight 3: Reflective question about financial oversight and children's involvement
  if (metrics.fraud_suspected_count > 0) {
    insights.push(
      `[reflect] ${metrics.fraud_suspected_count} ${metrics.fraud_suspected_count === 1 ? "audit has" : "audits have"} flagged suspected fraud. ` +
        `What safeguards can be strengthened to protect children's money, and are reporting procedures ` +
        `being followed to ensure full transparency and accountability?`,
    );
  } else if (metrics.balance_matches_rate < 100) {
    insights.push(
      `[reflect] Balance matches record in ${metrics.balance_matches_rate}% of audits. ` +
        `How can the home improve reconciliation processes to ensure every child's pocket money balance ` +
        `is accurate, and are children being given clear explanations of their financial records?`,
    );
  } else {
    insights.push(
      `[reflect] All audits show balances matching records and no fraud has been suspected. ` +
        `How can the home build on this strong financial governance to further empower children ` +
        `in understanding and managing their own money with age-appropriate independence?`,
    );
  }

  return insights;
}

// ── Testing exports ──────────────────────────────────────────────────────

export const _testing = {
  computePocketMoneyAuditMetrics,
  computePocketMoneyAuditAlerts,
  generatePocketMoneyAuditCaraInsights,
};
