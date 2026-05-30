// ==============================================================================
// CORNERSTONE -- HOME SHARPS DISPOSAL & HAZARDOUS WASTE INTELLIGENCE API ROUTE
// GET /api/v1/home-sharps-disposal-hazardous-waste-intelligence
// Cross-domain composite: sharpsBinRecords + hazardousWasteRecords +
// coshhRecords + clinicalWasteRecords + childSafetyRecords
// ==============================================================================

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeSharpsDisposalHazardousWaste,
  type SharpsBinRecordInput,
  type HazardousWasteRecordInput,
  type CoshhRecordInput,
  type ClinicalWasteRecordInput,
  type ChildSafetyRecordInput,
} from "@/lib/engines/home-sharps-disposal-hazardous-waste-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawSharpsBin = (store.sharpsBinRecords ?? []) as any[];
    const sharps_bin_records: SharpsBinRecordInput[] = rawSharpsBin.map((r: any) => ({
      id: r.id ?? "",
      location: r.location ?? "",
      bin_type: r.bin_type ?? "standard",
      is_locked: !!r.is_locked,
      is_labelled: !!r.is_labelled,
      fill_level: r.fill_level ?? "empty",
      last_inspection_date: (r.last_inspection_date ?? today).toString(),
      inspection_passed: !!r.inspection_passed,
      disposal_date: r.disposal_date ?? null,
      disposal_method: r.disposal_method ?? "unknown",
      disposal_documented: !!r.disposal_documented,
      tamper_evident_seal: !!r.tamper_evident_seal,
      accessible_to_children: !!r.accessible_to_children,
      staff_member_responsible: r.staff_member_responsible ?? "",
      issues_found: Array.isArray(r.issues_found) ? r.issues_found : [],
      corrective_action_taken: !!r.corrective_action_taken,
      next_collection_date: r.next_collection_date ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawHazardousWaste = (store.hazardousWasteRecords ?? []) as any[];
    const hazardous_waste_records: HazardousWasteRecordInput[] = rawHazardousWaste.map((r: any) => ({
      id: r.id ?? "",
      waste_type: r.waste_type ?? "other",
      substance_name: r.substance_name ?? "",
      quantity: r.quantity ?? "",
      storage_location: r.storage_location ?? "",
      storage_compliant: !!r.storage_compliant,
      labelling_correct: !!r.labelling_correct,
      containment_intact: !!r.containment_intact,
      disposal_date: r.disposal_date ?? null,
      disposal_method: r.disposal_method ?? "pending",
      disposal_documented: !!r.disposal_documented,
      consignment_note_present: !!r.consignment_note_present,
      risk_assessment_completed: !!r.risk_assessment_completed,
      staff_handling_trained: !!r.staff_handling_trained,
      spill_kit_available: !!r.spill_kit_available,
      ppe_available: !!r.ppe_available,
      incidents_reported: r.incidents_reported ?? 0,
      incidents_resolved: r.incidents_resolved ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawCoshh = (store.coshhRecords ?? []) as any[];
    const coshh_records: CoshhRecordInput[] = rawCoshh.map((r: any) => ({
      id: r.id ?? "",
      substance_name: r.substance_name ?? "",
      substance_category: r.substance_category ?? "other",
      coshh_assessment_completed: !!r.coshh_assessment_completed,
      coshh_assessment_date: r.coshh_assessment_date ?? null,
      coshh_assessment_review_date: r.coshh_assessment_review_date ?? null,
      data_sheet_available: !!r.data_sheet_available,
      storage_locked: !!r.storage_locked,
      storage_location_appropriate: !!r.storage_location_appropriate,
      labelling_compliant: !!r.labelling_compliant,
      first_aid_measures_documented: !!r.first_aid_measures_documented,
      ppe_requirements_documented: !!r.ppe_requirements_documented,
      ppe_available: !!r.ppe_available,
      staff_trained: !!r.staff_trained,
      accessible_to_children: !!r.accessible_to_children,
      risk_level: r.risk_level ?? "low",
      incidents_reported: r.incidents_reported ?? 0,
      incidents_resolved: r.incidents_resolved ?? 0,
      last_audit_date: r.last_audit_date ?? null,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawClinicalWaste = (store.clinicalWasteRecords ?? []) as any[];
    const clinical_waste_records: ClinicalWasteRecordInput[] = rawClinicalWaste.map((r: any) => ({
      id: r.id ?? "",
      waste_category: r.waste_category ?? "other",
      waste_stream_colour: r.waste_stream_colour ?? "other",
      segregation_correct: !!r.segregation_correct,
      container_type_correct: !!r.container_type_correct,
      container_sealed: !!r.container_sealed,
      labelling_correct: !!r.labelling_correct,
      storage_location_secure: !!r.storage_location_secure,
      storage_temperature_compliant: !!r.storage_temperature_compliant,
      collection_frequency: r.collection_frequency ?? "unknown",
      collection_on_schedule: !!r.collection_on_schedule,
      contractor_licensed: !!r.contractor_licensed,
      duty_of_care_transfer_note: !!r.duty_of_care_transfer_note,
      weight_recorded: !!r.weight_recorded,
      disposed_quantity: r.disposed_quantity ?? "",
      staff_handling_trained: !!r.staff_handling_trained,
      ppe_worn: !!r.ppe_worn,
      spillage_incidents: r.spillage_incidents ?? 0,
      spillage_incidents_managed: r.spillage_incidents_managed ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawChildSafety = (store.childSafetyRecords ?? []) as any[];
    const child_safety_records: ChildSafetyRecordInput[] = rawChildSafety.map((r: any) => ({
      id: r.id ?? "",
      child_id: r.child_id ?? "",
      awareness_session_date: r.awareness_session_date ?? null,
      awareness_topic: r.awareness_topic ?? "general_hazard",
      session_completed: !!r.session_completed,
      child_understood: !!r.child_understood,
      age_appropriate_materials: !!r.age_appropriate_materials,
      follow_up_planned: !!r.follow_up_planned,
      follow_up_completed: !!r.follow_up_completed,
      hazard_reported_by_child: !!r.hazard_reported_by_child,
      child_knows_reporting_process: !!r.child_knows_reporting_process,
      risk_assessment_includes_child: !!r.risk_assessment_includes_child,
      incidents_involving_child: r.incidents_involving_child ?? 0,
      incidents_resolved: r.incidents_resolved ?? 0,
      near_misses_reported: r.near_misses_reported ?? 0,
      safeguarding_concerns_raised: r.safeguarding_concerns_raised ?? 0,
      created_at: (r.created_at ?? today).toString(),
    }));

    const result = computeSharpsDisposalHazardousWaste({
      today,
      total_children,
      sharps_bin_records,
      hazardous_waste_records,
      coshh_records,
      clinical_waste_records,
      child_safety_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
