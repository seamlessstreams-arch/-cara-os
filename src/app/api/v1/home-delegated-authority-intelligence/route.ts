// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME DELEGATED AUTHORITY INTELLIGENCE API ROUTE
// GET /api/v1/home-delegated-authority-intelligence
// Delegated authority completeness, review compliance, category coverage.
// CHR 2015 Reg 22: "Arrangements for the delegation of authority."
// SCCIF: "Staff understand what decisions they can make day to day."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeDelegatedAuthority,
  type DelegatedAuthorityInput,
  type DelegatedAuthorityItemInput,
} from "@/lib/engines/home-delegated-authority-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Delegated Authorities ─────────────────────────────────────────────
  const delegatedAuthorities: DelegatedAuthorityInput[] = (
    (store.delegatedAuthority ?? []) as any[]
  ).map((da: any) => ({
    id: da.id ?? "",
    child_id: da.child_id ?? "",
    last_reviewed: (da.last_reviewed ?? "").toString().slice(0, 10),
    next_review: (da.next_review ?? "").toString().slice(0, 10),
    items: (Array.isArray(da.items) ? da.items : []).map(
      (item: any): DelegatedAuthorityItemInput => ({
        category: (item.category ?? "medical").toString(),
        status: (item.status ?? "pending").toString(),
        detail: (item.detail ?? "").toString(),
        conditions: (item.conditions ?? "").toString(),
        granted_by: (item.granted_by ?? "").toString(),
        granted_date: (item.granted_date ?? "").toString().slice(0, 10),
        review_date: (item.review_date ?? "").toString().slice(0, 10),
      }),
    ),
    notes: (da.notes ?? "").toString(),
  }));

  // ── Total children ────────────────────────────────────────────────────
  const totalChildren = (store.youngPeople ?? []).filter(
    (yp: any) => yp.status === "current",
  ).length;

  const result = computeHomeDelegatedAuthority({
    today,
    delegated_authorities: delegatedAuthorities,
    total_children: totalChildren,
  });

  return NextResponse.json({ data: result });
}
