// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EXPENSE GOVERNANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-expense-governance-intelligence
// Financial stewardship: expense approval, receipt compliance, oversight.
// CHR 2015 Reg 36. SCCIF: "The arrangements for the financial management."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeExpenseGovernance,
  type ExpenseInput,
} from "@/lib/engines/home-expense-governance-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Expenses ──────────────────────────────────────────────────────────
  const expenses: ExpenseInput[] = (
    (store.expenses ?? []) as any[]
  ).map((e: any) => ({
    id: e.id ?? "",
    submitted_by: e.submitted_by ?? "",
    category: (e.category ?? "").toString(),
    amount: typeof e.amount === "number" ? e.amount : 0,
    has_receipt: !!(e.receipt_url),
    date: (e.date ?? "").toString().slice(0, 10),
    status: (e.status ?? "draft").toString(),
    approved_by: e.approved_by ?? null,
    approved_at: e.approved_at ? e.approved_at.toString().slice(0, 10) : null,
    created_at: (e.created_at ?? "").toString().slice(0, 10),
    linked_child_id: e.linked_child_id ?? null,
    payment_method: (e.payment_method ?? "").toString(),
  }));

  // ── Total staff ───────────────────────────────────────────────────────
  const totalStaff = (store.staff ?? []).filter(
    (s: any) => s.is_active,
  ).length;

  const result = computeHomeExpenseGovernance({
    today,
    expenses,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
