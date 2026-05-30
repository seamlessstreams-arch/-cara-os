// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME TEETH BRUSHING & ORAL ROUTINE INTELLIGENCE API ROUTE
// GET /api/v1/home-teeth-brushing-oral-routine-intelligence
// Cross-domain composite: brushingScheduleRecords + fluorideUseRecords +
// supervisionRecords + toothbrushReplacementRecords + independenceRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeTeethBrushingOralRoutine,
  type BrushingScheduleRecordInput,
  type FluorideUseRecordInput,
  type SupervisionRecordInput,
  type ToothbrushReplacementRecordInput,
  type IndependenceRecordInput,
} from "@/lib/engines/home-teeth-brushing-oral-routine-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawBrushing = (store.brushingScheduleRecords ?? []) as any[];
    const brushing_schedule_records: BrushingScheduleRecordInput[] = rawBrushing.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      morning_brushing_completed: !!r.morning_brushing_completed,
      evening_brushing_completed: !!r.evening_brushing_completed,
      brushing_duration_morning_seconds: r.brushing_duration_morning_seconds ?? 0,
      brushing_duration_evening_seconds: r.brushing_duration_evening_seconds ?? 0,
      morning_time_recorded: r.morning_time_recorded ?? null,
      evening_time_recorded: r.evening_time_recorded ?? null,
      brushing_technique_correct: !!r.brushing_technique_correct,
      child_reminded: !!r.child_reminded,
      child_refused: !!r.child_refused,
      refusal_reason: r.refusal_reason ?? null,
      alternative_offered: !!r.alternative_offered,
      teeth_areas_covered: r.teeth_areas_covered ?? "none",
      tongue_cleaned: !!r.tongue_cleaned,
      mouthwash_used: !!r.mouthwash_used,
      flossing_completed: !!r.flossing_completed,
      child_engaged: !!r.child_engaged,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawFluoride = (store.fluorideUseRecords ?? []) as any[];
    const fluoride_use_records: FluorideUseRecordInput[] = rawFluoride.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      fluoride_toothpaste_used: !!r.fluoride_toothpaste_used,
      fluoride_concentration_ppm: r.fluoride_concentration_ppm ?? 0,
      fluoride_concentration_appropriate: !!r.fluoride_concentration_appropriate,
      fluoride_mouthwash_used: !!r.fluoride_mouthwash_used,
      fluoride_varnish_applied: !!r.fluoride_varnish_applied,
      varnish_applied_by: r.varnish_applied_by ?? null,
      fluoride_supplement_given: !!r.fluoride_supplement_given,
      supplement_prescribed: !!r.supplement_prescribed,
      child_age_appropriate_product: !!r.child_age_appropriate_product,
      child_spits_not_swallows: !!r.child_spits_not_swallows,
      staff_supervised_application: !!r.staff_supervised_application,
      product_in_date: r.product_in_date !== false,
      product_brand: r.product_brand ?? null,
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawSupervision = (store.brushingSupervisionRecords ?? []) as any[];
    const supervision_records: SupervisionRecordInput[] = rawSupervision.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      session_type: r.session_type ?? "both",
      staff_present_during_brushing: !!r.staff_present_during_brushing,
      staff_guided_technique: !!r.staff_guided_technique,
      staff_timed_brushing: !!r.staff_timed_brushing,
      child_age: r.child_age ?? 0,
      supervision_level: r.supervision_level ?? "none",
      supervision_appropriate_for_age: !!r.supervision_appropriate_for_age,
      positive_reinforcement_given: !!r.positive_reinforcement_given,
      correction_needed: !!r.correction_needed,
      correction_accepted: !!r.correction_accepted,
      handwashing_before_brushing: !!r.handwashing_before_brushing,
      oral_health_discussion: !!r.oral_health_discussion,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawReplacement = (store.toothbrushReplacementRecords ?? []) as any[];
    const toothbrush_replacement_records: ToothbrushReplacementRecordInput[] = rawReplacement.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      replacement_date: (r.replacement_date ?? today).toString(),
      previous_brush_start_date: r.previous_brush_start_date ?? null,
      days_since_last_replacement: r.days_since_last_replacement ?? 0,
      replacement_reason: r.replacement_reason ?? "scheduled",
      brush_type: r.brush_type ?? "manual",
      brush_age_appropriate: !!r.brush_age_appropriate,
      brush_condition_at_replacement: r.brush_condition_at_replacement ?? "good",
      child_chose_own_brush: !!r.child_chose_own_brush,
      child_chose_own_toothpaste: !!r.child_chose_own_toothpaste,
      personal_brush_storage_correct: !!r.personal_brush_storage_correct,
      brush_labelled: !!r.brush_labelled,
      cost_covered: r.cost_covered !== false,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawIndependence = (store.oralCareIndependenceRecords ?? []) as any[];
    const independence_records: IndependenceRecordInput[] = rawIndependence.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      child_age: r.child_age ?? 0,
      brushes_independently: !!r.brushes_independently,
      applies_toothpaste_independently: !!r.applies_toothpaste_independently,
      selects_own_products: !!r.selects_own_products,
      initiates_brushing_without_prompt: !!r.initiates_brushing_without_prompt,
      completes_full_routine_independently: !!r.completes_full_routine_independently,
      understands_importance_of_oral_care: !!r.understands_importance_of_oral_care,
      can_explain_brushing_technique: !!r.can_explain_brushing_technique,
      manages_own_toothbrush_replacement: !!r.manages_own_toothbrush_replacement,
      requests_dental_products_when_needed: !!r.requests_dental_products_when_needed,
      independence_goal_set: !!r.independence_goal_set,
      independence_goal_met: !!r.independence_goal_met,
      progress_since_last_assessment: r.progress_since_last_assessment ?? "first_assessment",
      independence_plan_in_place: !!r.independence_plan_in_place,
      staff_member: r.staff_member ?? "",
      notes: r.notes ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeTeethBrushingOralRoutine({
      today,
      total_children,
      brushing_schedule_records,
      fluoride_use_records,
      supervision_records,
      toothbrush_replacement_records,
      independence_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
