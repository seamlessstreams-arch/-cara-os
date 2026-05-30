// ==============================================================================
// CORNERSTONE -- HOME SLIPS, TRIPS & FALLS PREVENTION INTELLIGENCE API ROUTE
// GET /api/v1/home-slips-trips-falls-prevention-intelligence
// Cross-domain composite: slipTripRiskAssessmentRecords +
// flooringConditionRecords + wetFloorProtocolRecords +
// stairwaySafetyRecords + slipTripFallIncidentRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSlipsTripsFallsPrevention,
  type SlipTripRiskAssessmentRecordInput,
  type FlooringConditionRecordInput,
  type WetFloorProtocolRecordInput,
  type StairwaySafetyRecordInput,
  type SlipTripFallIncidentRecordInput,
} from "@/lib/engines/home-slips-trips-falls-prevention-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawRiskAssessments = (store.slipTripRiskAssessmentRecords ?? []) as any[];
    const risk_assessment_records: SlipTripRiskAssessmentRecordInput[] = rawRiskAssessments.map((r: any) => ({
      id: r.id ?? "",
      area_name: r.area_name ?? "",
      assessment_date: (r.assessment_date ?? today).toString(),
      assessor_name: r.assessor_name ?? "",
      risk_level: r.risk_level ?? "medium",
      hazards_identified: Array.isArray(r.hazards_identified) ? r.hazards_identified : [],
      controls_in_place: !!r.controls_in_place,
      controls_adequate: !!r.controls_adequate,
      review_date: r.review_date ?? null,
      review_overdue: !!r.review_overdue,
      actions_required: r.actions_required ?? 0,
      actions_completed: r.actions_completed ?? 0,
      children_consulted: !!r.children_consulted,
      environment_type: r.environment_type ?? "indoor",
      weather_considerations_documented: !!r.weather_considerations_documented,
      signed_off: !!r.signed_off,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawFlooringCondition = (store.flooringConditionRecords ?? []) as any[];
    const flooring_condition_records: FlooringConditionRecordInput[] = rawFlooringCondition.map((r: any) => ({
      id: r.id ?? "",
      area_name: r.area_name ?? "",
      flooring_type: r.flooring_type ?? "other",
      inspection_date: (r.inspection_date ?? today).toString(),
      condition: r.condition ?? "fair",
      issues_found: Array.isArray(r.issues_found) ? r.issues_found : [],
      slip_resistance_adequate: !!r.slip_resistance_adequate,
      trip_hazards_present: !!r.trip_hazards_present,
      repair_needed: !!r.repair_needed,
      repair_completed: !!r.repair_completed,
      repair_date: r.repair_date ?? null,
      mat_secured: !!r.mat_secured,
      threshold_safe: !!r.threshold_safe,
      inspector_name: r.inspector_name ?? "",
      next_inspection_due: r.next_inspection_due ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawWetFloorProtocol = (store.wetFloorProtocolRecords ?? []) as any[];
    const wet_floor_records: WetFloorProtocolRecordInput[] = rawWetFloorProtocol.map((r: any) => ({
      id: r.id ?? "",
      area_name: r.area_name ?? "",
      date: (r.date ?? today).toString(),
      signage_deployed: !!r.signage_deployed,
      signage_timely: !!r.signage_timely,
      cleaning_schedule_followed: !!r.cleaning_schedule_followed,
      spill_response_within_target: !!r.spill_response_within_target,
      response_time_minutes: r.response_time_minutes ?? 0,
      barrier_used: !!r.barrier_used,
      staff_trained: !!r.staff_trained,
      children_warned: !!r.children_warned,
      protocol_documented: !!r.protocol_documented,
      incident_resulted: !!r.incident_resulted,
      weather_related: !!r.weather_related,
      entrance_matting_adequate: !!r.entrance_matting_adequate,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawStairwaySafety = (store.stairwaySafetyRecords ?? []) as any[];
    const stairway_safety_records: StairwaySafetyRecordInput[] = rawStairwaySafety.map((r: any) => ({
      id: r.id ?? "",
      stairway_location: r.stairway_location ?? "",
      inspection_date: (r.inspection_date ?? today).toString(),
      handrail_secure: !!r.handrail_secure,
      handrail_both_sides: !!r.handrail_both_sides,
      treads_non_slip: !!r.treads_non_slip,
      nosings_visible: !!r.nosings_visible,
      lighting_adequate: !!r.lighting_adequate,
      clutter_free: !!r.clutter_free,
      gate_fitted: !!r.gate_fitted,
      gate_functional: !!r.gate_functional,
      carpet_secure: !!r.carpet_secure,
      width_adequate: !!r.width_adequate,
      defects_found: Array.isArray(r.defects_found) ? r.defects_found : [],
      defects_rectified: !!r.defects_rectified,
      rectification_date: r.rectification_date ?? null,
      inspector_name: r.inspector_name ?? "",
      child_specific_risks_assessed: !!r.child_specific_risks_assessed,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawIncidents = (store.slipTripFallIncidentRecords ?? []) as any[];
    const incident_records: SlipTripFallIncidentRecordInput[] = rawIncidents.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      date: (r.date ?? today).toString(),
      location: r.location ?? "",
      incident_type: r.incident_type ?? "slip",
      severity: r.severity ?? "minor",
      cause: r.cause ?? "",
      surface_condition: r.surface_condition ?? "dry",
      footwear_appropriate: !!r.footwear_appropriate,
      lighting_adequate: !!r.lighting_adequate,
      injury_sustained: !!r.injury_sustained,
      injury_description: r.injury_description ?? "",
      first_aid_given: !!r.first_aid_given,
      medical_attention_required: !!r.medical_attention_required,
      parent_carer_notified: !!r.parent_carer_notified,
      social_worker_notified: !!r.social_worker_notified,
      investigation_completed: !!r.investigation_completed,
      root_cause_identified: !!r.root_cause_identified,
      corrective_actions_taken: Array.isArray(r.corrective_actions_taken) ? r.corrective_actions_taken : [],
      lessons_learned_documented: !!r.lessons_learned_documented,
      lessons_shared_with_staff: !!r.lessons_shared_with_staff,
      risk_assessment_updated: !!r.risk_assessment_updated,
      recurrence: !!r.recurrence,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeSlipsTripsFallsPrevention({
      today,
      total_children,
      risk_assessment_records,
      flooring_condition_records,
      wet_floor_records,
      stairway_safety_records,
      incident_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
