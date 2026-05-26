// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME RESTRICTIVE PRACTICE INTELLIGENCE API ROUTE
// GET /api/v1/home-restrictive-practice-intelligence
// Synthesises restraint data to assess frequency, proportionality,
// de-escalation quality, debrief completion, review compliance, and training.
// CHR 2015 Reg 19, 20. SCCIF: "Safe", "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeRestrictivePractice,
  type RestraintInput,
} from "@/lib/engines/home-restrictive-practice-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Children ──────────────────────────────────────────────────────────
  const youngPeople = (store.youngPeople ?? []) as any[];
  const totalChildren = youngPeople.length;
  const childIds = youngPeople.map((yp: any) => yp.id as string);

  // ── Restraints ────────────────────────────────────────────────────────
  const restraints: RestraintInput[] = ((store.restraints ?? []) as any[])
    .map((r: any) => {
      const staffArr = (r.staff_involved ?? []) as any[];
      const deEscArr = (r.de_escalation_attempts ?? []) as any[];
      const injuriesArr = (r.injuries ?? []) as any[];

      return {
        id: r.id,
        date: (r.date ?? today).toString().slice(0, 10),
        child_id: r.child_id ?? "",
        duration_minutes: r.duration ?? 0,
        staff_count: staffArr.length,
        all_team_teach_trained: staffArr.length > 0 && staffArr.every((s: any) => !!(s.team_teach_trained)),
        reason: r.reason ?? "other",
        de_escalation_count: deEscArr.length,
        has_justification: !!(r.justification),
        child_debriefed: !!(r.child_debriefed),
        staff_debriefed: !!(r.staff_debriefed),
        review_status: r.review_status === "reviewed" ? "reviewed" : "pending",
        has_injuries: injuriesArr.length > 0,
        body_map_completed: !!(r.body_map_completed),
        medical_check_required: !!(r.medical_check_required),
        medical_check_completed: !!(r.medical_check_completed),
      };
    });

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeRestrictivePractice({
    today,
    total_children: totalChildren,
    child_ids: childIds,
    restraints,
  });

  return NextResponse.json({ data: result });
}
