// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME STAFF PERFORMANCE COMPOSITE INTELLIGENCE API ROUTE
// GET /api/v1/home-staff-performance-composite-intelligence
// Synthesises appraisals, supervisions, and training to assess staff
// competency, supervision regularity, training compliance, and development.
// CHR 2015 Reg 32, 33, 34. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeStaffPerformanceComposite,
  type AppraisalInput,
  type SupervisionInput,
  type TrainingInput,
} from "@/lib/engines/home-staff-performance-composite-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const staff = (store.staff ?? []) as any[];
    const total_staff = staff.filter((s: any) => s.is_active !== false).length;

    // Appraisals
    const rawAppraisals = (store.appraisals ?? []) as any[];
    const appraisals: AppraisalInput[] = rawAppraisals.map((a: any) => {
      const scores = a.competency_scores ?? {};
      const vals = Object.values(scores).filter((v): v is number => typeof v === "number");
      const avgScore = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      const objSet = a.objectives_set ?? (Array.isArray(a.objectives) ? a.objectives.length : 0);
      const objMet = a.objectives_met ?? (Array.isArray(a.objectives) ? a.objectives.filter((o: any) => o.status === "met" || o.status === "completed").length : 0);
      return {
        id: a.id ?? "",
        staff_id: a.staff_id ?? "",
        date: (a.appraisal_date ?? today).toString().slice(0, 10),
        status: a.status ?? "scheduled",
        overall_rating: a.overall_rating ?? "requires_improvement",
        average_competency_score: Math.round(avgScore * 10) / 10,
        objectives_set: objSet,
        objectives_met: objMet,
        has_development_plan: !!(Array.isArray(a.development_areas) && a.development_areas.length > 0) || a.has_development_plan === true,
      };
    });

    // Supervisions
    const rawSupervisions = (store.supervisions ?? []) as any[];
    const supervisions: SupervisionInput[] = rawSupervisions.map((s: any) => ({
      id: s.id ?? "",
      staff_id: s.supervisee_id ?? s.staff_id ?? "",
      date: (s.date ?? today).toString().slice(0, 10),
      status: s.status ?? "scheduled",
      safeguarding_discussed: s.safeguarding_discussed ?? false,
      actions_agreed: s.actions_agreed ?? (Array.isArray(s.actions) ? s.actions.length : 0),
      actions_completed: s.actions_completed ?? (Array.isArray(s.actions) ? s.actions.filter((a: any) => a.status === "completed").length : 0),
      wellbeing_check: s.wellbeing_check ?? false,
    }));

    // Training
    const rawTraining = (store.trainingRecords ?? []) as any[];
    const training: TrainingInput[] = rawTraining.map((t: any) => {
      const expiryDate = t.expiry_date ? t.expiry_date.toString().slice(0, 10) : null;
      const isExpired = expiryDate ? expiryDate < today : false;
      const daysUntilExpiry = expiryDate
        ? Math.round((new Date(expiryDate).getTime() - new Date(today).getTime()) / 86_400_000)
        : 999;
      return {
        id: t.id ?? "",
        staff_id: t.staff_id ?? "",
        category: t.category ?? "",
        status: t.status ?? "not_started",
        is_mandatory: t.mandatory ?? false,
        is_expired: isExpired,
        days_until_expiry: daysUntilExpiry,
      };
    });

    const result = computeStaffPerformanceComposite({
      today, total_staff, appraisals, supervisions, training,
    });
    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
