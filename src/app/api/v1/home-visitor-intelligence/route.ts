// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME VISITOR & ACCESS INTELLIGENCE API ROUTE
// GET /api/v1/home-visitor-intelligence
// Synthesises visitor records to assess DBS compliance, ID verification,
// sign-in/out completion, safeguarding oversight, and multi-agency engagement.
// CHR 2015 Reg 12, 22. SCCIF: "Safe."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeVisitor,
  type VisitorInput,
} from "@/lib/engines/home-visitor-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;

  // ── Visitor Records ───────────────────────────────────────────────────
  const visitors: VisitorInput[] = ((store.visitors ?? []) as any[])
    .map((v: any) => ({
      id: v.id ?? "",
      date: (v.date ?? today).toString().slice(0, 10),
      category: v.category ?? "other",
      dbs_checked: !!(v.dbs_checked),
      id_verified: !!(v.id_verified),
      has_sign_in: !!(v.sign_in_time),
      has_sign_out: !!(v.sign_out_time),
      children_seen_count: Array.isArray(v.children_seen) ? v.children_seen.length : 0,
      has_notes: !!(v.notes),
      host_staff_id: v.host_staff_id ?? "",
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeVisitor({
    today,
    total_children: totalChildren,
    visitors,
  });

  return NextResponse.json({ data: result });
}
