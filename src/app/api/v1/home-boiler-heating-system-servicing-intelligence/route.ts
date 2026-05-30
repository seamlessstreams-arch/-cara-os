// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME BOILER & HEATING SYSTEM SERVICING INTELLIGENCE API ROUTE
// GET /api/v1/home-boiler-heating-system-servicing-intelligence
// Cross-domain composite: boilerServiceRecords + heatingCheckRecords +
// radiatorRecords + thermostatRecords + energyRecords
// ══════════════════════════════════════════════════════════════════════════════

export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getStore } from "@/lib/db/store";
import {
  computeBoilerHeatingSystemServicing,
  type BoilerServiceInput,
  type HeatingCheckInput,
  type RadiatorRecordInput,
  type ThermostatRecordInput,
  type EnergyRecordInput,
} from "@/lib/engines/home-boiler-heating-system-servicing-intelligence-engine";

export async function GET() {
  try {
    const store = getStore();
    const today = new Date().toISOString().slice(0, 10);

    const yp = (store.youngPeople ?? []) as any[];
    const total_children = yp.filter((c: any) => c.status === "current").length;

    const rawBoilerServices = (store.boilerServiceRecords ?? []) as any[];
    const boiler_service_records: BoilerServiceInput[] = rawBoilerServices.map((s: any) => ({
      id: s.id ?? "",
      boiler_id: s.boiler_id ?? "",
      service_date: (s.service_date ?? today).toString(),
      engineer_name: s.engineer_name ?? "",
      engineer_gas_safe_registered: !!s.engineer_gas_safe_registered,
      service_type: s.service_type ?? "annual",
      gas_safety_certificate_issued: !!s.gas_safety_certificate_issued,
      cp12_certificate_valid: !!s.cp12_certificate_valid,
      faults_found: s.faults_found ?? 0,
      faults_resolved: s.faults_resolved ?? 0,
      carbon_monoxide_test_passed: !!s.carbon_monoxide_test_passed,
      flue_inspection_passed: !!s.flue_inspection_passed,
      pressure_test_passed: !!s.pressure_test_passed,
      next_service_due: (s.next_service_due ?? today).toString(),
      service_overdue: !!s.service_overdue,
      boiler_age_years: s.boiler_age_years ?? 0,
      boiler_condition: s.boiler_condition ?? "good",
      notes_recorded: !!s.notes_recorded,
      created_at: (s.created_at ?? today).toString(),
    }));

    const rawHeatingChecks = (store.heatingCheckRecords ?? []) as any[];
    const heating_check_records: HeatingCheckInput[] = rawHeatingChecks.map((c: any) => ({
      id: c.id ?? "",
      check_date: (c.check_date ?? today).toString(),
      checker_name: c.checker_name ?? "",
      check_type: c.check_type ?? "routine",
      system_type: c.system_type ?? "central_heating",
      all_zones_heating: !!c.all_zones_heating,
      hot_water_functional: !!c.hot_water_functional,
      timer_programmer_working: !!c.timer_programmer_working,
      pipe_insulation_adequate: !!c.pipe_insulation_adequate,
      expansion_vessel_ok: !!c.expansion_vessel_ok,
      pump_functional: !!c.pump_functional,
      water_pressure_normal: !!c.water_pressure_normal,
      leaks_detected: !!c.leaks_detected,
      issues_found: c.issues_found ?? 0,
      issues_resolved: c.issues_resolved ?? 0,
      next_check_due: (c.next_check_due ?? today).toString(),
      check_overdue: !!c.check_overdue,
      notes_recorded: !!c.notes_recorded,
      created_at: (c.created_at ?? today).toString(),
    }));

    const rawRadiators = (store.radiatorRecords ?? []) as any[];
    const radiator_records: RadiatorRecordInput[] = rawRadiators.map((r: any) => ({
      id: r.id ?? "",
      location: r.location ?? "",
      radiator_type: r.radiator_type ?? "panel",
      last_bleed_date: r.last_bleed_date ?? null,
      bleed_due_date: r.bleed_due_date ?? null,
      bleed_overdue: !!r.bleed_overdue,
      heating_evenly: !!r.heating_evenly,
      thermostat_valve_working: !!r.thermostat_valve_working,
      condition: r.condition ?? "good",
      child_safety_cover_fitted: !!r.child_safety_cover_fitted,
      temperature_appropriate: !!r.temperature_appropriate,
      last_inspection_date: r.last_inspection_date ?? null,
      inspection_overdue: !!r.inspection_overdue,
      in_child_area: !!r.in_child_area,
      notes_recorded: !!r.notes_recorded,
      created_at: (r.created_at ?? today).toString(),
    }));

    const rawThermostats = (store.thermostatRecords ?? []) as any[];
    const thermostat_records: ThermostatRecordInput[] = rawThermostats.map((t: any) => ({
      id: t.id ?? "",
      location: t.location ?? "",
      thermostat_type: t.thermostat_type ?? "room",
      last_calibration_date: t.last_calibration_date ?? null,
      calibration_due_date: t.calibration_due_date ?? null,
      calibration_overdue: !!t.calibration_overdue,
      reading_accurate: !!t.reading_accurate,
      temperature_variance_celsius: t.temperature_variance_celsius ?? 0,
      battery_status: t.battery_status ?? "good",
      child_accessible: !!t.child_accessible,
      tamper_proof: !!t.tamper_proof,
      set_temperature_celsius: t.set_temperature_celsius ?? 0,
      actual_temperature_celsius: t.actual_temperature_celsius ?? 0,
      programming_correct: !!t.programming_correct,
      last_check_date: t.last_check_date ?? null,
      check_overdue: !!t.check_overdue,
      notes_recorded: !!t.notes_recorded,
      created_at: (t.created_at ?? today).toString(),
    }));

    const rawEnergy = (store.energyRecords ?? []) as any[];
    const energy_records: EnergyRecordInput[] = rawEnergy.map((e: any) => ({
      id: e.id ?? "",
      record_date: (e.record_date ?? today).toString(),
      record_type: e.record_type ?? "assessment",
      epc_rating: e.epc_rating ?? null,
      energy_consumption_kwh: e.energy_consumption_kwh ?? null,
      cost_gbp: e.cost_gbp ?? null,
      efficiency_measure_type: e.efficiency_measure_type ?? null,
      efficiency_measure_implemented: !!e.efficiency_measure_implemented,
      improvement_description: e.improvement_description ?? null,
      estimated_saving_percent: e.estimated_saving_percent ?? null,
      actual_saving_percent: e.actual_saving_percent ?? null,
      insulation_adequate: !!e.insulation_adequate,
      draught_proofing_adequate: !!e.draught_proofing_adequate,
      window_condition: e.window_condition ?? null,
      heating_controls_optimised: !!e.heating_controls_optimised,
      notes_recorded: !!e.notes_recorded,
      created_at: (e.created_at ?? today).toString(),
    }));

    const result = computeBoilerHeatingSystemServicing({
      today,
      total_children,
      boiler_service_records,
      heating_check_records,
      radiator_records,
      thermostat_records,
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
