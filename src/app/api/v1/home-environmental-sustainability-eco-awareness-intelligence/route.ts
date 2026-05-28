// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ENVIRONMENTAL SUSTAINABILITY & ECO-AWARENESS INTELLIGENCE API ROUTE
// GET /api/v1/home-environmental-sustainability-eco-awareness-intelligence
// Cross-domain composite: energyUsageRecords + recyclingRecords +
// ecoEducationRecords + sustainabilityPracticeRecords + carbonFootprintRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeEnvironmentalSustainabilityEcoAwareness,
  type EnergyUsageRecordInput,
  type RecyclingRecordInput,
  type EcoEducationRecordInput,
  type SustainabilityPracticeRecordInput,
  type CarbonFootprintRecordInput,
} from "@/lib/engines/home-environmental-sustainability-eco-awareness-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawEnergyUsage = (store.energyUsageRecords ?? []) as any[];
    const energy_usage_records: EnergyUsageRecordInput[] = rawEnergyUsage.map((e: any) => ({
      id: e.id ?? "",
      period_start: (e.period_start ?? today).toString(),
      period_end: (e.period_end ?? today).toString(),
      energy_type: e.energy_type ?? "electricity",
      usage_kwh: e.usage_kwh ?? 0,
      target_kwh: e.target_kwh ?? 0,
      cost_gbp: e.cost_gbp ?? 0,
      within_target: !!e.within_target,
      energy_saving_measures_active: e.energy_saving_measures_active ?? 0,
      energy_saving_measures_total: e.energy_saving_measures_total ?? 0,
      smart_meter_installed: !!e.smart_meter_installed,
      reading_verified: !!e.reading_verified,
      notes: e.notes ?? "",
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawRecycling = (store.recyclingRecords ?? []) as any[];
    const recycling_records: RecyclingRecordInput[] = rawRecycling.map((r: any) => ({
      id: r.id ?? "",
      date: (r.date ?? today).toString(),
      recycling_type: r.recycling_type ?? "general",
      compliant: !!r.compliant,
      contamination_found: !!r.contamination_found,
      weight_kg: r.weight_kg ?? 0,
      child_participated: !!r.child_participated,
      child_id: r.child_id ?? null,
      bins_correctly_used: !!r.bins_correctly_used,
      collection_missed: !!r.collection_missed,
      notes: r.notes ?? "",
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawEcoEducation = (store.ecoEducationRecords ?? []) as any[];
    const eco_education_records: EcoEducationRecordInput[] = rawEcoEducation.map((e: any) => ({
      id: e.id ?? "",
      child_id: e.child_id ?? "",
      date: (e.date ?? today).toString(),
      programme_name: e.programme_name ?? "",
      programme_type: e.programme_type ?? "workshop",
      attended: !!e.attended,
      engaged: !!e.engaged,
      learning_outcome_met: !!e.learning_outcome_met,
      child_feedback_positive: !!e.child_feedback_positive,
      duration_minutes: e.duration_minutes ?? 0,
      facilitator: e.facilitator ?? "",
      linked_to_curriculum: !!e.linked_to_curriculum,
      created_at: (e.created_at ?? today).toString(),
    }));

    const rawSustainability = (store.sustainabilityPracticeRecords ?? []) as any[];
    const sustainability_practice_records: SustainabilityPracticeRecordInput[] = rawSustainability.map((p: any) => ({
      id: p.id ?? "",
      practice_name: p.practice_name ?? "",
      category: p.category ?? "energy",
      implemented: !!p.implemented,
      implementation_date: p.implementation_date ?? null,
      review_date: p.review_date ?? null,
      effectiveness_rating: p.effectiveness_rating ?? 3,
      children_involved: !!p.children_involved,
      staff_trained: !!p.staff_trained,
      documented: !!p.documented,
      cost_saving_gbp: p.cost_saving_gbp ?? 0,
      notes: p.notes ?? "",
      created_at: (p.created_at ?? today).toString(),
    }));

    const rawCarbon = (store.carbonFootprintRecords ?? []) as any[];
    const carbon_footprint_records: CarbonFootprintRecordInput[] = rawCarbon.map((c: any) => ({
      id: c.id ?? "",
      period_start: (c.period_start ?? today).toString(),
      period_end: (c.period_end ?? today).toString(),
      category: c.category ?? "energy",
      co2_kg: c.co2_kg ?? 0,
      target_co2_kg: c.target_co2_kg ?? 0,
      within_target: !!c.within_target,
      offset_applied: !!c.offset_applied,
      offset_kg: c.offset_kg ?? 0,
      reduction_actions_planned: c.reduction_actions_planned ?? 0,
      reduction_actions_completed: c.reduction_actions_completed ?? 0,
      children_aware: !!c.children_aware,
      notes: c.notes ?? "",
      created_at: (c.created_at ?? today).toString(),
    }));

    const result = computeEnvironmentalSustainabilityEcoAwareness({
      today,
      total_children,
      energy_usage_records,
      recycling_records,
      eco_education_records,
      sustainability_practice_records,
      carbon_footprint_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
