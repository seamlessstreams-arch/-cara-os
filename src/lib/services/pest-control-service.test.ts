import { describe, it, expect } from "vitest";
import {
  computePestControlMetrics,
  identifyPestControlAlerts,
} from "./pest-control-service";
import type { PestControlRecord } from "./pest-control-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PestControlRecord> = {}): PestControlRecord {
  return {
    id: "pc-1",
    home_id: "home-1",
    inspection_type: "routine_inspection",
    inspection_date: "2026-05-01",
    pest_type: "none_found",
    treatment_outcome: "no_treatment_needed",
    risk_level: "no_risk",
    location_in_home: "kitchen",
    contractor_name: "PestCo",
    contractor_certified: true,
    children_informed: true,
    children_relocated: false,
    chemicals_used: false,
    chemical_safety_sheet_obtained: false,
    area_ventilated: true,
    food_areas_affected: false,
    entry_points_sealed: true,
    prevention_measures_implemented: true,
    follow_up_required: false,
    follow_up_date: null,
    follow_up_completed: false,
    environmental_health_notified: false,
    issues_found: [],
    actions_taken: [],
    inspected_by: "staff-1",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePestControlMetrics ------------------------------------------------

describe("computePestControlMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePestControlMetrics([]);
    expect(m.total_inspections).toBe(0);
    expect(m.routine_count).toBe(0);
    expect(m.reactive_count).toBe(0);
    expect(m.emergency_count).toBe(0);
    expect(m.resolved_rate).toBeNull();;
    expect(m.no_pest_found_rate).toBeNull();;
    expect(m.contractor_certified_rate).toBeNull();;
    expect(m.safety_sheet_obtained_rate).toBeNull();;
  });

  it("counts inspection types correctly", () => {
    const records = [
      makeRecord({ id: "1", inspection_type: "routine_inspection" }),
      makeRecord({ id: "2", inspection_type: "routine_inspection" }),
      makeRecord({ id: "3", inspection_type: "reactive_call" }),
      makeRecord({ id: "4", inspection_type: "emergency_treatment" }),
      makeRecord({ id: "5", inspection_type: "follow_up" }),
    ];
    const m = computePestControlMetrics(records);
    expect(m.total_inspections).toBe(5);
    expect(m.routine_count).toBe(2);
    expect(m.reactive_count).toBe(1);
    expect(m.emergency_count).toBe(1);
    expect(m.follow_up_count).toBe(1);
  });

  it("computes resolved rate and no-pest-found rate", () => {
    const records = [
      makeRecord({ id: "1", treatment_outcome: "resolved", pest_type: "none_found" }),
      makeRecord({ id: "2", treatment_outcome: "resolved", pest_type: "rodents" }),
      makeRecord({ id: "3", treatment_outcome: "ongoing", pest_type: "none_found" }),
      makeRecord({ id: "4", treatment_outcome: "partially_resolved", pest_type: "ants" }),
    ];
    const m = computePestControlMetrics(records);
    expect(m.resolved_rate).toBe(50); // 2/4 = 50%
    expect(m.ongoing_count).toBe(1);
    expect(m.no_pest_found_rate).toBe(50); // 2/4 = 50%
  });

  it("computes risk counts", () => {
    const records = [
      makeRecord({ id: "1", risk_level: "high" }),
      makeRecord({ id: "2", risk_level: "critical" }),
      makeRecord({ id: "3", risk_level: "critical" }),
      makeRecord({ id: "4", risk_level: "low" }),
    ];
    const m = computePestControlMetrics(records);
    expect(m.high_risk_count).toBe(1);
    expect(m.critical_risk_count).toBe(2);
  });

  it("computes safety sheet rate based on chemical records only", () => {
    const records = [
      makeRecord({ id: "1", chemicals_used: true, chemical_safety_sheet_obtained: true }),
      makeRecord({ id: "2", chemicals_used: true, chemical_safety_sheet_obtained: false }),
      makeRecord({ id: "3", chemicals_used: false, chemical_safety_sheet_obtained: false }),
    ];
    const m = computePestControlMetrics(records);
    expect(m.chemicals_used_count).toBe(2);
    expect(m.safety_sheet_obtained_rate).toBe(50); // 1/2 chemicals-used records
  });

  it("computes boolean rates and follow-up overdue count", () => {
    const pastDate = "2025-01-01";
    const records = [
      makeRecord({
        id: "1",
        contractor_certified: true,
        children_informed: true,
        entry_points_sealed: true,
        prevention_measures_implemented: true,
        follow_up_required: true,
        follow_up_date: pastDate,
        follow_up_completed: false,
      }),
      makeRecord({
        id: "2",
        contractor_certified: false,
        children_informed: false,
        entry_points_sealed: false,
        prevention_measures_implemented: false,
        follow_up_required: true,
        follow_up_date: "2099-01-01",
        follow_up_completed: false,
      }),
    ];
    const m = computePestControlMetrics(records);
    expect(m.contractor_certified_rate).toBe(50);
    expect(m.children_informed_rate).toBe(50);
    expect(m.entry_points_sealed_rate).toBe(50);
    expect(m.prevention_implemented_rate).toBe(50);
    expect(m.follow_up_required_count).toBe(2);
    expect(m.follow_up_overdue_count).toBe(1);
  });

  it("builds breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", inspection_type: "routine_inspection", pest_type: "rodents", treatment_outcome: "resolved", risk_level: "low" }),
      makeRecord({ id: "2", inspection_type: "routine_inspection", pest_type: "rodents", treatment_outcome: "ongoing", risk_level: "high" }),
    ];
    const m = computePestControlMetrics(records);
    expect(m.by_inspection_type).toEqual({ routine_inspection: 2 });
    expect(m.by_pest_type).toEqual({ rodents: 2 });
    expect(m.by_treatment_outcome).toEqual({ resolved: 1, ongoing: 1 });
    expect(m.by_risk_level).toEqual({ low: 1, high: 1 });
  });
});

// -- identifyPestControlAlerts ------------------------------------------------

describe("identifyPestControlAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyPestControlAlerts([])).toEqual([]);
  });

  it("returns no alerts for clean records", () => {
    const records = [makeRecord()];
    expect(identifyPestControlAlerts(records)).toEqual([]);
  });

  it("fires critical_risk alert for critical risk level", () => {
    const records = [makeRecord({ risk_level: "critical", pest_type: "rodents", location_in_home: "kitchen" })];
    const alerts = identifyPestControlAlerts(records);
    expect(alerts.some((a) => a.type === "critical_risk" && a.severity === "critical")).toBe(true);
  });

  it("fires food_area_affected alert when >= 1 food area affected", () => {
    const records = [makeRecord({ food_areas_affected: true })];
    const alerts = identifyPestControlAlerts(records);
    expect(alerts.some((a) => a.type === "food_area_affected" && a.severity === "high")).toBe(true);
  });

  it("fires ongoing_treatment alert when >= 1 ongoing treatment", () => {
    const records = [makeRecord({ treatment_outcome: "ongoing" })];
    const alerts = identifyPestControlAlerts(records);
    expect(alerts.some((a) => a.type === "ongoing_treatment" && a.severity === "high")).toBe(true);
  });

  it("fires follow_up_overdue when follow-up is overdue", () => {
    const records = [
      makeRecord({ follow_up_required: true, follow_up_date: "2025-01-01", follow_up_completed: false }),
    ];
    const alerts = identifyPestControlAlerts(records);
    expect(alerts.some((a) => a.type === "follow_up_overdue" && a.severity === "high")).toBe(true);
  });

  it("fires no_safety_sheet alert when chemicals used without sheet", () => {
    const records = [makeRecord({ chemicals_used: true, chemical_safety_sheet_obtained: false })];
    const alerts = identifyPestControlAlerts(records);
    expect(alerts.some((a) => a.type === "no_safety_sheet" && a.severity === "medium")).toBe(true);
  });

  it("does not fire follow_up_overdue if follow-up is completed", () => {
    const records = [
      makeRecord({ follow_up_required: true, follow_up_date: "2025-01-01", follow_up_completed: true }),
    ];
    const alerts = identifyPestControlAlerts(records);
    expect(alerts.some((a) => a.type === "follow_up_overdue")).toBe(false);
  });
});
