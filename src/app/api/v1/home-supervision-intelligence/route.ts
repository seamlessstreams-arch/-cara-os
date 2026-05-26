// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SUPERVISION INTELLIGENCE API ROUTE
// GET /api/v1/home-supervision-intelligence
// Synthesises supervision, practice observation, and appraisal data to
// produce workforce development quality, frequency, and compliance intelligence.
// CHR 2015 Reg 33. SCCIF: "Well-led and managed."
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeHomeSupervision,
  type SupervisionInput,
  type ObservationInput,
  type AppraisalInput,
} from "@/lib/engines/home-supervision-intelligence-engine";

export async function GET() {
  const store = getStore();
  const today = new Date().toISOString().slice(0, 10);

  // ── Staff ─────────────────────────────────────────────────────────────
  const staffArr = (store.staff ?? []) as any[];
  const totalStaff = staffArr.length;
  const staffIds = staffArr.map((s: any) => s.id as string);

  // ── Supervisions ──────────────────────────────────────────────────────
  const supervisions: SupervisionInput[] = ((store.supervisions ?? []) as any[])
    .map((s: any) => {
      const actions = (s.actions_agreed ?? []) as any[];
      const completedActions = actions.filter((a: any) => a.status === "completed").length;

      return {
        id: s.id,
        date: (s.actual_date ?? s.scheduled_date ?? today).toString().slice(0, 10),
        staff_id: s.staff_id ?? "",
        type: s.type ?? "formal",
        status: s.status ?? "scheduled",
        duration_minutes: s.duration_minutes ?? 0,
        actions_total: actions.length,
        actions_completed: completedActions,
        wellbeing_score: s.wellbeing_score ?? null,
        both_signatures: !!(s.staff_signature) && !!(s.supervisor_signature),
      };
    });

  // ── Practice Observations ─────────────────────────────────────────────
  const observations: ObservationInput[] = ((store.practiceObservations ?? []) as any[])
    .map((o: any) => {
      const strengths = (o.strengths_noted ?? []) as any[];
      const devAreas = (o.areas_for_development ?? []) as any[];
      const domains = (o.domains_observed ?? []) as any[];

      return {
        id: o.id,
        date: (o.observation_date ?? today).toString().slice(0, 10),
        staff_id: o.staff_id ?? "",
        outcome: o.outcome ?? "developing",
        domains_count: domains.length,
        strengths_count: strengths.length,
        development_areas_count: devAreas.length,
        signed_off: !!(o.signed_off_by_staff),
      };
    });

  // ── Appraisals ────────────────────────────────────────────────────────
  const appraisals: AppraisalInput[] = ((store.appraisals ?? []) as any[])
    .map((a: any) => {
      const scores = (a.competency_scores ?? {}) as Record<string, number>;
      const scoreValues = Object.values(scores).filter((v: any) => typeof v === "number" && v > 0);
      const avgScore = scoreValues.length > 0
        ? Math.round((scoreValues.reduce((sum: number, v: number) => sum + v, 0) / scoreValues.length) * 10) / 10
        : 0;

      return {
        id: a.id,
        date: (a.appraisal_date ?? today).toString().slice(0, 10),
        staff_id: a.staff_id ?? "",
        status: a.status ?? "scheduled",
        overall_rating: a.overall_rating ?? null,
        avg_competency_score: avgScore,
        signed: !!(a.signed_by_staff),
        next_review_date: a.next_review_date ? a.next_review_date.toString().slice(0, 10) : null,
      };
    });

  // ── Compute ───────────────────────────────────────────────────────────
  const result = computeHomeSupervision({
    today,
    staff_ids: staffIds,
    total_staff: totalStaff,
    supervisions,
    observations,
    appraisals,
  });

  return NextResponse.json({ data: result });
}
