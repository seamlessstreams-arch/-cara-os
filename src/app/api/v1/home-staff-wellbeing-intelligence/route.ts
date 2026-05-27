// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF WELLBEING INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-wellbeing-intelligence
// Staff wellbeing checks, morale, stressors, support responsiveness.
// CHR 2015 Reg 33. SCCIF: "Leadership supports staff wellbeing."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeStaffWellbeing,
  type WellbeingCheckInput,
} from "@/lib/engines/home-staff-wellbeing-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Wellbeing Checks ──────────────────────────────────────────────────
  const wellbeingChecks: WellbeingCheckInput[] = (
    (store.staffWellbeingRecords ?? []) as any[]
  ).map((w: any) => ({
    id: w.id ?? "",
    staff_id: w.staff_id ?? "",
    date: (w.date ?? "").toString().slice(0, 10),
    type: (w.type ?? "monthly_checkin").toString(),
    overall_score: typeof w.overall_score === "number" ? w.overall_score : 5,
    workload_score: typeof w.workload_score === "number" ? w.workload_score : 5,
    support_score: typeof w.support_score === "number" ? w.support_score : 5,
    moral_score: typeof w.moral_score === "number" ? w.moral_score : 5,
    stressors: Array.isArray(w.stressors) ? w.stressors : [],
    positives: Array.isArray(w.positives) ? w.positives : [],
    support_needed: (w.support_needed ?? "").toString(),
    action_agreed: (w.action_agreed ?? "").toString(),
    follow_up_date: w.follow_up_date ? w.follow_up_date.toString().slice(0, 10) : null,
    conducted_by: w.conducted_by ?? "",
    confidential: !!(w.confidential),
  }));

  // ── Total staff ───────────────────────────────────────────────────────
  const totalStaff = (store.staff ?? []).filter(
    (s: any) => s.status === "active" || s.employment_status === "active",
  ).length;

  const result = computeHomeStaffWellbeing({
    today,
    wellbeing_checks: wellbeingChecks,
    total_staff: totalStaff,
  });

  return NextResponse.json({ data: result });
}
