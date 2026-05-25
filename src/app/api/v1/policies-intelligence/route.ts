// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — POLICIES INTELLIGENCE API ROUTE
// GET /api/v1/policies-intelligence
// Returns policy register coverage analysis: review compliance,
// acknowledgement rates, category coverage, and ARIA intelligence.
// Reg 38: policies and procedures — Reg 13: leadership and management
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computePoliciesIntelligence,
  type PolicyInput,
  type StaffRef,
} from "@/lib/engines/policies-intelligence-engine";

export async function GET() {
  const store = getStore();

  const policies: PolicyInput[] = (store.homePolicies ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    status: p.status,
    owner_id: p.owner_id ?? "",
    next_review_date: typeof p.next_review_date === "string" ? p.next_review_date.slice(0, 10) : p.next_review_date,
    last_reviewed: p.last_reviewed ? (typeof p.last_reviewed === "string" ? p.last_reviewed.slice(0, 10) : p.last_reviewed) : null,
    acknowledgement_count: (p.read_acknowledgements ?? []).length,
    total_staff_required: p.total_staff_required ?? 8,
    statutory_basis: p.statutory_basis ?? "",
  }));

  const staff: StaffRef[] = (store.staff ?? [])
    .filter((s: any) => s.is_active)
    .map((s: any) => ({
      id: s.id,
      name: s.full_name ?? `${s.first_name} ${s.last_name}`,
    }));

  const result = computePoliciesIntelligence({ policies, staff });
  return NextResponse.json({ data: result });
}
