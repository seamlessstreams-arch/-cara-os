// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME EDUCATION ACHIEVEMENT INTELLIGENCE API ROUTE
// GET /api/v1/home-education-achievement-intelligence
// Synthesises education records across all children to produce an overall
// education engagement and achievement intelligence score.
// CHR 2015 Reg 8, 29. SCCIF: "Education", "Experiences and progress."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeEducation,
  type EducationRecordInput,
} from "@/lib/engines/home-education-achievement-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Education Records ─────────────────────────────────────────────────
  const education_records: EducationRecordInput[] = ((store.educationRecords ?? []) as any[])
    .map((r: any) => ({
      id: r.id,
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString().slice(0, 10),
      record_type: r.record_type ?? "attendance",
      attendance_status: r.attendance_status ?? null,
      linked_pep: !!r.linked_pep,
      has_outcome: !!(r.outcome),
      has_follow_up: !!(r.follow_up_date),
      status: r.status ?? "open",
    }));

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeEducation({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    education_records,
  });

  return NextResponse.json({ data: result });
}
