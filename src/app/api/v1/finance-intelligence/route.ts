// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — FINANCE INTELLIGENCE API ROUTE
// GET /api/v1/finance-intelligence
// Returns pocket money, savings, and spending intelligence from the engine.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeFinanceIntelligence,
  type PocketMoneyTransactionInput,
  type ClothingAllowanceInput,
  type ChildRef,
  type StaffRef,
} from "@/lib/engines/finance-intelligence-engine";

export async function GET() {
  const store = getStore();

  const transactions: PocketMoneyTransactionInput[] = [
    ...(store.pocketMoneyTransactions ?? []).map((t: any) => ({
      id: t.id,
      child_id: t.child_id,
      date: typeof t.date === "string" ? t.date.slice(0, 10) : t.date,
      type: t.type,
      amount: t.amount,
      description: t.description ?? "",
      category: t.category ?? "other",
      receipt_held: t.receipt_held ?? false,
      approved_by: t.approved_by ?? "",
    })),
    ...(store.pocketMoneyAccounts ?? []).map((a: any) => ({
      id: a.id,
      child_id: a.child_id,
      date: typeof a.date === "string" ? a.date.slice(0, 10) : a.date,
      type: a.transaction_type === "credit" ? "allowance" : "spending",
      amount: a.amount,
      description: a.description ?? "",
      category: a.category ?? "other",
      receipt_held: false,
      approved_by: a.authorised_by ?? "",
    })),
  ];

  const clothing_allowances: ClothingAllowanceInput[] = (store.clothingAllowanceRecords ?? []).map((c: any) => ({
    id: c.id,
    child_id: c.child_id,
    financial_year: c.financial_year,
    annual_budget: c.annual_budget,
    quarterly_allowance: c.quarterly_allowance,
    current_quarter: c.current_quarter,
    quarter_spend: c.quarter_spend,
    ytd_spend: c.ytd_spend,
  }));

  const children: ChildRef[] = (store.youngPeople ?? []).map((yp: any) => ({
    id: yp.id,
    name: yp.preferred_name ?? `${yp.first_name} ${yp.last_name}`,
  }));

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computeFinanceIntelligence({ transactions, clothing_allowances, children, staff });
  return NextResponse.json({ data: result });
}
