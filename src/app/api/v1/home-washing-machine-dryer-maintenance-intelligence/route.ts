// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME WASHING MACHINE & DRYER MAINTENANCE INTELLIGENCE API ROUTE
// GET /api/v1/home-washing-machine-dryer-maintenance-intelligence
// Cross-domain composite: servicingRecords + breakdownRecords +
// childAccessRecords + hygieneCycleRecords + energyRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeWashingMachineDryerMaintenance,
  type ServicingRecordInput,
  type BreakdownRecordInput,
  type ChildAccessRecordInput,
  type HygieneCycleRecordInput,
  type EnergyRecordInput,
} from "@/lib/engines/home-washing-machine-dryer-maintenance-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawServicing = (store.washingMachineDryerServicingRecords ?? []) as any[];
    const servicing_records: ServicingRecordInput[] = rawServicing.map((s: any) => ({
      id: s.id ?? "",
      appliance_id: s.appliance_id ?? "",
      appliance_type: s.appliance_type ?? "washing_machine",
      appliance_location: s.appliance_location ?? "",
      service_type: s.service_type ?? "annual_service",
      service_date: (s.service_date ?? today).toString(),
      next_service_due: s.next_service_due ?? null,
      service_overdue: !!s.service_overdue,
      engineer_name: s.engineer_name ?? "",
      engineer_qualified: !!s.engineer_qualified,
      parts_replaced: !!s.parts_replaced,
      parts_description: s.parts_description ?? "",
      passed_safety_check: !!s.passed_safety_check,
      certificate_on_file: !!s.certificate_on_file,
      cost_gbp: s.cost_gbp ?? 0,
      notes: s.notes ?? "",
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawBreakdowns = (store.washingMachineDryerBreakdownRecords ?? []) as any[];
    const breakdown_records: BreakdownRecordInput[] = rawBreakdowns.map((b: any) => ({
      id: b.id ?? "",
      appliance_id: b.appliance_id ?? "",
      appliance_type: b.appliance_type ?? "washing_machine",
      reported_date: (b.reported_date ?? today).toString(),
      reported_by: b.reported_by ?? "staff",
      fault_description: b.fault_description ?? "",
      severity: b.severity ?? "minor",
      response_date: b.response_date ?? null,
      resolved_date: b.resolved_date ?? null,
      resolved: !!b.resolved,
      response_within_24h: !!b.response_within_24h,
      response_within_48h: !!b.response_within_48h,
      temporary_arrangement_provided: !!b.temporary_arrangement_provided,
      impact_on_children: b.impact_on_children ?? "none",
      root_cause: b.root_cause ?? "",
      preventable: !!b.preventable,
      repeat_fault: !!b.repeat_fault,
      created_at: (b.created_at ?? today).toString(),
    }));

    const rawChildAccess = (store.washingMachineDryerChildAccessRecords ?? []) as any[];
    const child_access_records: ChildAccessRecordInput[] = rawChildAccess.map((c: any) => ({
      id: c.id ?? "",
      child_id: c.child_id ?? "",
      child_age: c.child_age ?? 0,
      access_type: c.access_type ?? "supervised",
      can_use_washing_machine: !!c.can_use_washing_machine,
      can_use_dryer: !!c.can_use_dryer,
      trained_on_appliance_use: !!c.trained_on_appliance_use,
      training_date: c.training_date ?? null,
      risk_assessment_completed: !!c.risk_assessment_completed,
      risk_assessment_date: c.risk_assessment_date ?? null,
      child_preference_respected: !!c.child_preference_respected,
      laundry_schedule_agreed: !!c.laundry_schedule_agreed,
      personal_items_separated: !!c.personal_items_separated,
      child_satisfaction_rating: c.child_satisfaction_rating ?? 3,
      barriers_to_access: Array.isArray(c.barriers_to_access) ? c.barriers_to_access : [],
      independence_goal_set: !!c.independence_goal_set,
      independence_goal_met: !!c.independence_goal_met,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawHygieneCycles = (store.washingMachineDryerHygieneCycleRecords ?? []) as any[];
    const hygiene_cycle_records: HygieneCycleRecordInput[] = rawHygieneCycles.map((h: any) => ({
      id: h.id ?? "",
      appliance_id: h.appliance_id ?? "",
      appliance_type: h.appliance_type ?? "washing_machine",
      cycle_type: h.cycle_type ?? "hot_wash_60",
      scheduled_date: (h.scheduled_date ?? today).toString(),
      completed_date: h.completed_date ?? null,
      completed: !!h.completed,
      completed_on_time: !!h.completed_on_time,
      temperature_verified: !!h.temperature_verified,
      detergent_type: h.detergent_type ?? "standard",
      infection_control_compliant: !!h.infection_control_compliant,
      recorded_by: h.recorded_by ?? "",
      notes: h.notes ?? "",
      created_at: (h.created_at ?? today).toString(),
    }));

    const rawEnergy = (store.washingMachineDryerEnergyRecords ?? []) as any[];
    const energy_records: EnergyRecordInput[] = rawEnergy.map((e: any) => ({
      id: e.id ?? "",
      appliance_id: e.appliance_id ?? "",
      appliance_type: e.appliance_type ?? "washing_machine",
      energy_rating: e.energy_rating ?? "unknown",
      age_years: e.age_years ?? 0,
      average_cycles_per_week: e.average_cycles_per_week ?? 0,
      eco_mode_available: !!e.eco_mode_available,
      eco_mode_used_percentage: e.eco_mode_used_percentage ?? 0,
      water_consumption_litres_per_cycle: e.water_consumption_litres_per_cycle ?? 0,
      energy_kwh_per_cycle: e.energy_kwh_per_cycle ?? 0,
      last_efficiency_check_date: e.last_efficiency_check_date ?? null,
      efficiency_check_overdue: !!e.efficiency_check_overdue,
      replacement_recommended: !!e.replacement_recommended,
      replacement_reason: e.replacement_reason ?? "",
      annual_cost_estimate_gbp: e.annual_cost_estimate_gbp ?? 0,
      created_at: (e.created_at ?? today).toString(),
    }));

    const result = computeWashingMachineDryerMaintenance({
      today,
      total_children,
      servicing_records,
      breakdown_records,
      child_access_records,
      hygiene_cycle_records,
      energy_records,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Internal server error" },
      { status: 500 },
    );
  }
}
