// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME POCKET MONEY & FINANCIAL LITERACY INTELLIGENCE API ROUTE
// GET /api/v1/home-pocket-money-financial-literacy-intelligence
// Cross-domain composite: pocketMoneyTransactions + ypSavingsAccountRecords +
// moneyRecords + childBankAccounts + independenceSkillsRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePocketMoneyFinancialLiteracy,
  type PocketMoneyRecordInput,
  type SavingsProgrammeRecordInput,
  type FinancialEducationRecordInput,
  type BudgetingRecordInput,
  type MoneyHandlingRecordInput,
} from "@/lib/engines/home-pocket-money-financial-literacy-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawPocketMoney = (store.pocketMoneyTransactions ?? []) as any[];
    const pocket_money_records: PocketMoneyRecordInput[] = rawPocketMoney.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      week_start: (r.week_start ?? today).toString(),
      amount_due: r.amount_due ?? 0,
      amount_paid: r.amount_paid ?? 0,
      paid_on_time: !!r.paid_on_time,
      receipt_signed: !!r.receipt_signed,
      payment_method: r.payment_method ?? "cash",
      notes: r.notes ?? null,
      recorded_by: r.recorded_by ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSavings = (store.ypSavingsAccountRecords ?? []) as any[];
    const savings_programme_records: SavingsProgrammeRecordInput[] = rawSavings.map((s: any) => ({
      id: s.id ?? "",
      child_id: s.child_id ?? "",
      programme_name: s.programme_name ?? "",
      start_date: (s.start_date ?? today).toString(),
      active: s.active !== false,
      target_amount: s.target_amount ?? 0,
      current_balance: s.current_balance ?? 0,
      deposits_count: s.deposits_count ?? 0,
      withdrawals_count: s.withdrawals_count ?? 0,
      last_deposit_date: s.last_deposit_date ?? null,
      child_initiated: !!s.child_initiated,
      staff_supported: s.staff_supported !== false,
      review_date: s.review_date ?? null,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawEducation = (store.moneyRecords ?? []) as any[];
    const financial_education_records: FinancialEducationRecordInput[] = rawEducation.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      session_date: (e.session_date ?? today).toString(),
      topic: e.topic ?? "value_of_money",
      age_appropriate: e.age_appropriate !== false,
      child_engaged: !!e.child_engaged,
      learning_evidenced: !!e.learning_evidenced,
      delivered_by: e.delivered_by ?? "",
      duration_minutes: e.duration_minutes ?? 0,
      resources_used: e.resources_used ?? null,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawBudgeting = (store.childBankAccounts ?? []) as any[];
    const budgeting_records: BudgetingRecordInput[] = rawBudgeting.map((b: any) => ({
      id: b.id ?? "",
      child_id: b.child_id ?? "",
      period_start: (b.period_start ?? today).toString(),
      period_end: (b.period_end ?? today).toString(),
      budget_category: b.budget_category ?? "other",
      budgeted_amount: b.budgeted_amount ?? 0,
      actual_spent: b.actual_spent ?? 0,
      child_led: !!b.child_led,
      within_budget: !!b.within_budget,
      review_completed: !!b.review_completed,
      review_date: b.review_date ?? null,
      created_at: (b.created_at ?? today).toString(),
    }));

    const rawMoneyHandling = (store.independenceSkillsRecords ?? []) as any[];
    const money_handling_records: MoneyHandlingRecordInput[] = rawMoneyHandling.map((m: any) => ({
      id: m.id ?? "",
      child_id: m.child_id ?? "",
      date: (m.date ?? today).toString(),
      transaction_type: m.transaction_type ?? "receipt",
      amount: m.amount ?? 0,
      receipt_present: !!m.receipt_present,
      dual_signed: !!m.dual_signed,
      reconciled: !!m.reconciled,
      discrepancy_amount: m.discrepancy_amount ?? 0,
      discrepancy_resolved: !!m.discrepancy_resolved,
      audited: !!m.audited,
      created_at: (m.created_at ?? today).toString(),
    }));

    const result = computePocketMoneyFinancialLiteracy({
      today,
      total_children,
      pocket_money_records,
      savings_programme_records,
      financial_education_records,
      budgeting_records,
      money_handling_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
