import { describe, it, expect } from "vitest";
import {
  computeVehicleMetrics,
  identifyVehicleAlerts,
  type VehicleCheckRecord,
} from "./vehicle-management-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<VehicleCheckRecord> = {}): VehicleCheckRecord {
  return {
    id: overrides.id ?? "rec-1",
    home_id: overrides.home_id ?? "home-1",
    check_type: overrides.check_type ?? "daily_pre_use",
    check_date: overrides.check_date ?? "2025-01-15",
    check_outcome: overrides.check_outcome ?? "pass",
    vehicle_condition: overrides.vehicle_condition ?? "good",
    driver_authorisation: overrides.driver_authorisation ?? "fully_authorised",
    vehicle_registration: overrides.vehicle_registration ?? "AB12 CDE",
    vehicle_make_model: overrides.vehicle_make_model ?? "Ford Transit",
    mileage_reading: overrides.mileage_reading ?? 50000,
    mot_expiry_date: overrides.mot_expiry_date ?? null,
    insurance_expiry_date: overrides.insurance_expiry_date ?? null,
    tyres_adequate: overrides.tyres_adequate ?? true,
    brakes_working: overrides.brakes_working ?? true,
    lights_working: overrides.lights_working ?? true,
    mirrors_clean: overrides.mirrors_clean ?? true,
    seatbelts_functional: overrides.seatbelts_functional ?? true,
    child_locks_working: overrides.child_locks_working ?? true,
    first_aid_kit_present: overrides.first_aid_kit_present ?? true,
    fire_extinguisher_present: overrides.fire_extinguisher_present ?? true,
    breakdown_cover_valid: overrides.breakdown_cover_valid ?? true,
    incident_during_journey: overrides.incident_during_journey ?? false,
    children_transported: overrides.children_transported ?? 2,
    staff_driver: overrides.staff_driver ?? "Driver A",
    defects_found: overrides.defects_found ?? [],
    actions_taken: overrides.actions_taken ?? [],
    issues_found: overrides.issues_found ?? [],
    next_service_date: overrides.next_service_date ?? null,
    notes: overrides.notes ?? null,
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
    updated_at: overrides.updated_at ?? "2025-01-15T00:00:00Z",
  };
}

// ── computeVehicleMetrics ──────────────────────────────────────────────

describe("computeVehicleMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeVehicleMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.daily_check_count).toBe(0);
    expect(m.pass_rate).toBeNull();;
    expect(m.fail_count).toBe(0);
    expect(m.incident_count).toBe(0);
    expect(m.total_children_transported).toBe(0);
    expect(m.average_mileage).toBeNull();;
    expect(m.unique_vehicles).toBe(0);
  });

  it("counts check types correctly", () => {
    const records = [
      makeRecord({ check_type: "daily_pre_use" }),
      makeRecord({ check_type: "daily_pre_use" }),
      makeRecord({ check_type: "weekly_inspection" }),
      makeRecord({ check_type: "mot_test" }),
      makeRecord({ check_type: "monthly_service" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.daily_check_count).toBe(2);
    expect(m.weekly_count).toBe(1);
    expect(m.mot_count).toBe(1);
    expect(m.service_count).toBe(1);
  });

  it("computes pass rate and fail/advisory counts", () => {
    const records = [
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "pass_with_advisory" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.pass_rate).toBe(50);
    expect(m.fail_count).toBe(1);
    expect(m.advisory_count).toBe(1);
  });

  it("computes condition rates and counts", () => {
    const records = [
      makeRecord({ vehicle_condition: "excellent" }),
      makeRecord({ vehicle_condition: "excellent" }),
      makeRecord({ vehicle_condition: "poor" }),
      makeRecord({ vehicle_condition: "unroadworthy" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.excellent_condition_rate).toBe(50);
    expect(m.poor_condition_count).toBe(1);
    expect(m.unroadworthy_count).toBe(1);
  });

  it("computes authorisation rates", () => {
    const records = [
      makeRecord({ driver_authorisation: "fully_authorised" }),
      makeRecord({ driver_authorisation: "not_authorised" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.fully_authorised_rate).toBe(50);
    expect(m.unauthorised_driver_count).toBe(1);
  });

  it("sums children transported and computes average mileage", () => {
    const records = [
      makeRecord({ children_transported: 3, mileage_reading: 10000 }),
      makeRecord({ children_transported: 2, mileage_reading: 20000 }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.total_children_transported).toBe(5);
    expect(m.average_mileage).toBe(15000);
  });

  it("counts unique vehicles", () => {
    const records = [
      makeRecord({ vehicle_registration: "AA11 BBB" }),
      makeRecord({ vehicle_registration: "AA11 BBB" }),
      makeRecord({ vehicle_registration: "CC22 DDD" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.unique_vehicles).toBe(2);
  });
});

// ── identifyVehicleAlerts ──────────────────────────────────────────────

describe("identifyVehicleAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyVehicleAlerts([])).toEqual([]);
  });

  it("fires critical alert for unroadworthy vehicle", () => {
    const records = [makeRecord({ vehicle_condition: "unroadworthy" })];
    const alerts = identifyVehicleAlerts(records);
    const match = alerts.find((a) => a.type === "unroadworthy_vehicle");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for unauthorised driver", () => {
    const records = [makeRecord({ driver_authorisation: "not_authorised" })];
    const alerts = identifyVehicleAlerts(records);
    const match = alerts.find((a) => a.type === "unauthorised_driver");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for check failures (>= 1)", () => {
    const records = [makeRecord({ check_outcome: "fail" })];
    const alerts = identifyVehicleAlerts(records);
    const match = alerts.find((a) => a.type === "check_failure");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for journey incidents (>= 1)", () => {
    const records = [makeRecord({ incident_during_journey: true })];
    const alerts = identifyVehicleAlerts(records);
    const match = alerts.find((a) => a.type === "journey_incident");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for safety equipment missing (>= 2 without first aid)", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    const match = alerts.find((a) => a.type === "safety_equipment_missing");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("does NOT fire safety equipment alert for only 1 missing", () => {
    const records = [makeRecord({ first_aid_kit_present: false })];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeUndefined();
  });
});
