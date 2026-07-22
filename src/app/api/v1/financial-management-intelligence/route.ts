// ══════════════════════════════════════════════════════════════════════════════
// CARA — FINANCIAL MANAGEMENT INTELLIGENCE API ROUTE
// GET /api/v1/financial-management-intelligence
// Returns expense analysis, spend patterns, approval compliance, category
// distribution, and Cara financial governance insights.
// Reg 40 (financial management), SCCIF governance.
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { dal } from "@/lib/db/dal";
import {
  computeFinancialManagementIntelligence,
  type ExpenseInput,
  type StaffRef,
} from "@/lib/engines/financial-management-intelligence-engine";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function safeList(p: Promise<any[]>): Promise<any[]> {
  try {
    const r = await p;
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const [expenseRecords, staffList] = await Promise.all([
    safeList(dal.expenses.findAll()),
    safeList(dal.staff.findAll()),
  ]);

  // ── Map expenses ──────────────────────────────────────────────────────
  const expenses: ExpenseInput[] = expenseRecords.map((e: any) => ({
    id: e.id,
    submitted_by: e.submitted_by,
    category: e.category,
    description: e.description,
    amount: e.amount,
    receipt_url: e.receipt_url ?? null,
    date: e.date,
    status: e.status,
    approved_by: e.approved_by ?? null,
    approved_at: e.approved_at ?? null,
    linked_child_id: e.linked_child_id ?? null,
    payment_method: e.payment_method ?? null,
    created_at: e.created_at,
  }));

  // ── Map active staff ──────────────────────────────────────────────────
  const staff: StaffRef[] = staffList
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  // ── Run engine ────────────────────────────────────────────────────────
  const result = computeFinancialManagementIntelligence({ expenses, staff });

  return NextResponse.json({ data: result });
}
