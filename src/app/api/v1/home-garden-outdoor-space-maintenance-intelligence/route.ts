// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME GARDEN & OUTDOOR SPACE MAINTENANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-garden-outdoor-space-maintenance-intelligence
// Cross-domain composite: gardenConditionRecords + equipmentSafetyRecords +
// spaceUtilisationRecords + childInvolvementRecords + environmentalQualityRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeGardenOutdoorSpaceMaintenance,
  type GardenConditionRecordInput,
  type EquipmentSafetyRecordInput,
  type SpaceUtilisationRecordInput,
  type ChildInvolvementRecordInput,
  type EnvironmentalQualityRecordInput,
} from "@/lib/engines/home-garden-outdoor-space-maintenance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawGardenCondition = (store.gardenConditionRecords ?? []) as any[];
    const garden_condition_records: GardenConditionRecordInput[] = rawGardenCondition.map((g: any) => ({
      id: g.id ?? "",
      date: (g.date ?? today).toString(),
      assessor: g.assessor ?? "",
      area_name: g.area_name ?? "",
      area_type: g.area_type ?? "other",
      condition_rating: g.condition_rating ?? 3,
      cleanliness_rating: g.cleanliness_rating ?? 3,
      safety_hazards_found: !!g.safety_hazards_found,
      hazards_description: g.hazards_description ?? "",
      hazards_resolved: !!g.hazards_resolved,
      maintenance_required: !!g.maintenance_required,
      maintenance_description: g.maintenance_description ?? "",
      maintenance_completed: !!g.maintenance_completed,
      seasonal_tasks_completed: !!g.seasonal_tasks_completed,
      pest_issues_found: !!g.pest_issues_found,
      pest_issues_resolved: !!g.pest_issues_resolved,
      accessibility_adequate: !!g.accessibility_adequate,
      photos_taken: !!g.photos_taken,
      notes: g.notes ?? "",
      created_at: (g.created_at ?? today).toString(),
    }));

    const rawEquipmentSafety = (store.equipmentSafetyRecords ?? []) as any[];
    const equipment_safety_records: EquipmentSafetyRecordInput[] = rawEquipmentSafety.map((e: any) => ({
      id: e.id ?? "",
      date: (e.date ?? today).toString(),
      inspector: e.inspector ?? "",
      equipment_name: e.equipment_name ?? "",
      equipment_type: e.equipment_type ?? "other",
      condition_rating: e.condition_rating ?? 3,
      safety_compliant: !!e.safety_compliant,
      defects_found: !!e.defects_found,
      defects_description: e.defects_description ?? "",
      defects_resolved: !!e.defects_resolved,
      out_of_service: !!e.out_of_service,
      last_professional_inspection: e.last_professional_inspection ?? null,
      age_appropriate: !!e.age_appropriate,
      surface_condition_safe: !!e.surface_condition_safe,
      anchoring_secure: !!e.anchoring_secure,
      wear_and_tear_acceptable: !!e.wear_and_tear_acceptable,
      manufacturer_guidelines_followed: !!e.manufacturer_guidelines_followed,
      notes: e.notes ?? "",
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawSpaceUtilisation = (store.spaceUtilisationRecords ?? []) as any[];
    const space_utilisation_records: SpaceUtilisationRecordInput[] = rawSpaceUtilisation.map((s: any) => ({
      id: s.id ?? "",
      date: (s.date ?? today).toString(),
      recorder: s.recorder ?? "",
      space_name: s.space_name ?? "",
      space_type: s.space_type ?? "garden",
      children_using: s.children_using ?? 0,
      total_children_available: s.total_children_available ?? 0,
      duration_minutes: s.duration_minutes ?? 0,
      activity_type: s.activity_type ?? "free_play",
      weather_suitable: !!s.weather_suitable,
      staff_supervised: !!s.staff_supervised,
      child_initiated: !!s.child_initiated,
      inclusive_access: !!s.inclusive_access,
      enjoyment_observed: !!s.enjoyment_observed,
      notes: s.notes ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawChildInvolvement = (store.childInvolvementRecords ?? []) as any[];
    const child_involvement_records: ChildInvolvementRecordInput[] = rawChildInvolvement.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      date: (c.date ?? today).toString(),
      activity_type: c.activity_type ?? "other",
      duration_minutes: c.duration_minutes ?? 0,
      engaged: !!c.engaged,
      enjoyment_level: c.enjoyment_level ?? 3,
      skills_developed: Array.isArray(c.skills_developed) ? c.skills_developed : [],
      responsibility_taken: !!c.responsibility_taken,
      therapeutic_benefit_noted: !!c.therapeutic_benefit_noted,
      produce_harvested: !!c.produce_harvested,
      child_chose_activity: !!c.child_chose_activity,
      supported_by_staff: !!c.supported_by_staff,
      linked_to_care_plan: !!c.linked_to_care_plan,
      notes: c.notes ?? "",
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawEnvironmentalQuality = (store.environmentalQualityRecords ?? []) as any[];
    const environmental_quality_records: EnvironmentalQualityRecordInput[] = rawEnvironmentalQuality.map((e: any) => ({
      id: e.id ?? "",
      date: (e.date ?? today).toString(),
      assessor: e.assessor ?? "",
      category: e.category ?? "aesthetics",
      rating: e.rating ?? 3,
      meets_standard: !!e.meets_standard,
      improvement_needed: !!e.improvement_needed,
      improvement_description: e.improvement_description ?? "",
      improvement_completed: !!e.improvement_completed,
      children_consulted: !!e.children_consulted,
      sensory_benefit: !!e.sensory_benefit,
      wildlife_observed: !!e.wildlife_observed,
      seasonal_variation_noted: !!e.seasonal_variation_noted,
      external_factors_noted: e.external_factors_noted ?? "",
      notes: e.notes ?? "",
      created_at: (e.created_at ?? today).toString(),
    }));

    const result = computeGardenOutdoorSpaceMaintenance({
      today,
      total_children,
      garden_condition_records,
      equipment_safety_records,
      space_utilisation_records,
      child_involvement_records,
      environmental_quality_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
