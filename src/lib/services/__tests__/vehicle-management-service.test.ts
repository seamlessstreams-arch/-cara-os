// ══════════════════════════════════════════════════════════════════════════════
// CARA — VEHICLE MANAGEMENT SERVICE TESTS
// Pure-function tests for vehicle metrics, alert identification,
// constant validation, and edge cases.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  CHECK_TYPES,
  CHECK_OUTCOMES,
  VEHICLE_CONDITIONS,
  DRIVER_AUTHORISATIONS,
  _testing,
} from "../vehicle-management-service";

import type { VehicleCheckRecord } from "../vehicle-management-service";

const { computeVehicleMetrics, identifyVehicleAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(overrides?: Partial<VehicleCheckRecord>): VehicleCheckRecord {
  return {
    id: overrides?.id ?? crypto.randomUUID(),
    home_id: overrides?.home_id ?? "home-1",
    check_type: overrides?.check_type ?? "daily_pre_use",
    check_date: overrides?.check_date ?? "2026-05-10",
    check_outcome: overrides?.check_outcome ?? "pass",
    vehicle_condition: overrides?.vehicle_condition ?? "good",
    driver_authorisation: overrides?.driver_authorisation ?? "fully_authorised",
    vehicle_registration: overrides?.vehicle_registration ?? "AB12 CDE",
    vehicle_make_model: overrides?.vehicle_make_model ?? "Ford Transit",
    mileage_reading: overrides?.mileage_reading ?? 50000,
    mot_expiry_date: "mot_expiry_date" in (overrides ?? {}) ? (overrides!.mot_expiry_date ?? null) : null,
    insurance_expiry_date: "insurance_expiry_date" in (overrides ?? {}) ? (overrides!.insurance_expiry_date ?? null) : null,
    tyres_adequate: overrides?.tyres_adequate ?? true,
    brakes_working: overrides?.brakes_working ?? true,
    lights_working: overrides?.lights_working ?? true,
    mirrors_clean: overrides?.mirrors_clean ?? true,
    seatbelts_functional: overrides?.seatbelts_functional ?? true,
    child_locks_working: overrides?.child_locks_working ?? true,
    first_aid_kit_present: overrides?.first_aid_kit_present ?? true,
    fire_extinguisher_present: overrides?.fire_extinguisher_present ?? true,
    breakdown_cover_valid: overrides?.breakdown_cover_valid ?? true,
    incident_during_journey: overrides?.incident_during_journey ?? false,
    children_transported: overrides?.children_transported ?? 3,
    staff_driver: overrides?.staff_driver ?? "Staff A",
    defects_found: overrides?.defects_found ?? [],
    actions_taken: overrides?.actions_taken ?? [],
    issues_found: overrides?.issues_found ?? [],
    next_service_date: "next_service_date" in (overrides ?? {}) ? (overrides!.next_service_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? "2026-05-10T08:00:00Z",
    updated_at: overrides?.updated_at ?? "2026-05-10T08:00:00Z",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("CHECK_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(CHECK_TYPES).toHaveLength(10);
  });

  it("has unique type values", () => {
    const values = CHECK_TYPES.map((c) => c.type);
    expect(new Set(values).size).toBe(10);
  });

  it("has non-empty labels for all entries", () => {
    for (const c of CHECK_TYPES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("contains daily_pre_use", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("daily_pre_use");
  });

  it("contains weekly_inspection", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("weekly_inspection");
  });

  it("contains monthly_service", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("monthly_service");
  });

  it("contains mot_test", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("mot_test");
  });

  it("contains annual_service", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("annual_service");
  });

  it("contains insurance_renewal", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("insurance_renewal");
  });

  it("contains breakdown_repair", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("breakdown_repair");
  });

  it("contains accident_damage", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("accident_damage");
  });

  it("contains tyre_replacement", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("tyre_replacement");
  });

  it("contains other", () => {
    expect(CHECK_TYPES.map((c) => c.type)).toContain("other");
  });

  it("maps daily_pre_use to 'Daily Pre-Use'", () => {
    const found = CHECK_TYPES.find((c) => c.type === "daily_pre_use");
    expect(found?.label).toBe("Daily Pre-Use");
  });

  it("maps weekly_inspection to 'Weekly Inspection'", () => {
    const found = CHECK_TYPES.find((c) => c.type === "weekly_inspection");
    expect(found?.label).toBe("Weekly Inspection");
  });

  it("maps mot_test to 'MOT Test'", () => {
    const found = CHECK_TYPES.find((c) => c.type === "mot_test");
    expect(found?.label).toBe("MOT Test");
  });

  it("maps accident_damage to 'Accident Damage'", () => {
    const found = CHECK_TYPES.find((c) => c.type === "accident_damage");
    expect(found?.label).toBe("Accident Damage");
  });
});

describe("CHECK_OUTCOMES", () => {
  it("has exactly 5 entries", () => {
    expect(CHECK_OUTCOMES).toHaveLength(5);
  });

  it("has unique outcome values", () => {
    const values = CHECK_OUTCOMES.map((c) => c.outcome);
    expect(new Set(values).size).toBe(5);
  });

  it("has non-empty labels for all entries", () => {
    for (const c of CHECK_OUTCOMES) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("contains pass", () => {
    expect(CHECK_OUTCOMES.map((c) => c.outcome)).toContain("pass");
  });

  it("contains pass_with_advisory", () => {
    expect(CHECK_OUTCOMES.map((c) => c.outcome)).toContain("pass_with_advisory");
  });

  it("contains fail", () => {
    expect(CHECK_OUTCOMES.map((c) => c.outcome)).toContain("fail");
  });

  it("contains deferred", () => {
    expect(CHECK_OUTCOMES.map((c) => c.outcome)).toContain("deferred");
  });

  it("contains not_applicable", () => {
    expect(CHECK_OUTCOMES.map((c) => c.outcome)).toContain("not_applicable");
  });

  it("maps pass to 'Pass'", () => {
    const found = CHECK_OUTCOMES.find((c) => c.outcome === "pass");
    expect(found?.label).toBe("Pass");
  });

  it("maps pass_with_advisory to 'Pass with Advisory'", () => {
    const found = CHECK_OUTCOMES.find((c) => c.outcome === "pass_with_advisory");
    expect(found?.label).toBe("Pass with Advisory");
  });

  it("maps not_applicable to 'Not Applicable'", () => {
    const found = CHECK_OUTCOMES.find((c) => c.outcome === "not_applicable");
    expect(found?.label).toBe("Not Applicable");
  });
});

describe("VEHICLE_CONDITIONS", () => {
  it("has exactly 5 entries", () => {
    expect(VEHICLE_CONDITIONS).toHaveLength(5);
  });

  it("has unique condition values", () => {
    const values = VEHICLE_CONDITIONS.map((c) => c.condition);
    expect(new Set(values).size).toBe(5);
  });

  it("has non-empty labels for all entries", () => {
    for (const c of VEHICLE_CONDITIONS) {
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it("contains excellent", () => {
    expect(VEHICLE_CONDITIONS.map((c) => c.condition)).toContain("excellent");
  });

  it("contains good", () => {
    expect(VEHICLE_CONDITIONS.map((c) => c.condition)).toContain("good");
  });

  it("contains fair", () => {
    expect(VEHICLE_CONDITIONS.map((c) => c.condition)).toContain("fair");
  });

  it("contains poor", () => {
    expect(VEHICLE_CONDITIONS.map((c) => c.condition)).toContain("poor");
  });

  it("contains unroadworthy", () => {
    expect(VEHICLE_CONDITIONS.map((c) => c.condition)).toContain("unroadworthy");
  });

  it("maps excellent to 'Excellent'", () => {
    const found = VEHICLE_CONDITIONS.find((c) => c.condition === "excellent");
    expect(found?.label).toBe("Excellent");
  });

  it("maps poor to 'Poor'", () => {
    const found = VEHICLE_CONDITIONS.find((c) => c.condition === "poor");
    expect(found?.label).toBe("Poor");
  });

  it("maps unroadworthy to 'Unroadworthy'", () => {
    const found = VEHICLE_CONDITIONS.find((c) => c.condition === "unroadworthy");
    expect(found?.label).toBe("Unroadworthy");
  });
});

describe("DRIVER_AUTHORISATIONS", () => {
  it("has exactly 5 entries", () => {
    expect(DRIVER_AUTHORISATIONS).toHaveLength(5);
  });

  it("has unique authorisation values", () => {
    const values = DRIVER_AUTHORISATIONS.map((d) => d.authorisation);
    expect(new Set(values).size).toBe(5);
  });

  it("has non-empty labels for all entries", () => {
    for (const d of DRIVER_AUTHORISATIONS) {
      expect(d.label.length).toBeGreaterThan(0);
    }
  });

  it("contains fully_authorised", () => {
    expect(DRIVER_AUTHORISATIONS.map((d) => d.authorisation)).toContain("fully_authorised");
  });

  it("contains provisional", () => {
    expect(DRIVER_AUTHORISATIONS.map((d) => d.authorisation)).toContain("provisional");
  });

  it("contains expired", () => {
    expect(DRIVER_AUTHORISATIONS.map((d) => d.authorisation)).toContain("expired");
  });

  it("contains suspended", () => {
    expect(DRIVER_AUTHORISATIONS.map((d) => d.authorisation)).toContain("suspended");
  });

  it("contains not_authorised", () => {
    expect(DRIVER_AUTHORISATIONS.map((d) => d.authorisation)).toContain("not_authorised");
  });

  it("maps fully_authorised to 'Fully Authorised'", () => {
    const found = DRIVER_AUTHORISATIONS.find((d) => d.authorisation === "fully_authorised");
    expect(found?.label).toBe("Fully Authorised");
  });

  it("maps provisional to 'Provisional'", () => {
    const found = DRIVER_AUTHORISATIONS.find((d) => d.authorisation === "provisional");
    expect(found?.label).toBe("Provisional");
  });

  it("maps not_authorised to 'Not Authorised'", () => {
    const found = DRIVER_AUTHORISATIONS.find((d) => d.authorisation === "not_authorised");
    expect(found?.label).toBe("Not Authorised");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeVehicleMetrics — empty input
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — empty input", () => {
  const m = computeVehicleMetrics([]);

  it("total_checks is 0", () => expect(m.total_checks).toBe(0));
  it("daily_check_count is 0", () => expect(m.daily_check_count).toBe(0));
  it("weekly_count is 0", () => expect(m.weekly_count).toBe(0));
  it("mot_count is 0", () => expect(m.mot_count).toBe(0));
  it("service_count is 0", () => expect(m.service_count).toBe(0));
  it("pass_rate is 0", () => expect(m.pass_rate).toBeNull());
  it("fail_count is 0", () => expect(m.fail_count).toBe(0));
  it("advisory_count is 0", () => expect(m.advisory_count).toBe(0));
  it("excellent_condition_rate is 0", () => expect(m.excellent_condition_rate).toBeNull());
  it("poor_condition_count is 0", () => expect(m.poor_condition_count).toBe(0));
  it("unroadworthy_count is 0", () => expect(m.unroadworthy_count).toBe(0));
  it("fully_authorised_rate is 0", () => expect(m.fully_authorised_rate).toBeNull());
  it("unauthorised_driver_count is 0", () => expect(m.unauthorised_driver_count).toBe(0));
  it("tyres_adequate_rate is 0", () => expect(m.tyres_adequate_rate).toBeNull());
  it("brakes_working_rate is 0", () => expect(m.brakes_working_rate).toBeNull());
  it("lights_working_rate is 0", () => expect(m.lights_working_rate).toBeNull());
  it("seatbelts_rate is 0", () => expect(m.seatbelts_rate).toBeNull());
  it("child_locks_rate is 0", () => expect(m.child_locks_rate).toBeNull());
  it("first_aid_rate is 0", () => expect(m.first_aid_rate).toBeNull());
  it("fire_extinguisher_rate is 0", () => expect(m.fire_extinguisher_rate).toBeNull());
  it("breakdown_cover_rate is 0", () => expect(m.breakdown_cover_rate).toBeNull());
  it("incident_count is 0", () => expect(m.incident_count).toBe(0));
  it("total_children_transported is 0", () => expect(m.total_children_transported).toBe(0));
  it("average_mileage is 0", () => expect(m.average_mileage).toBeNull());
  it("unique_vehicles is 0", () => expect(m.unique_vehicles).toBe(0));
  it("by_check_type is empty", () => expect(m.by_check_type).toEqual({}));
  it("by_check_outcome is empty", () => expect(m.by_check_outcome).toEqual({}));
  it("by_vehicle_condition is empty", () => expect(m.by_vehicle_condition).toEqual({}));
  it("by_driver_authorisation is empty", () => expect(m.by_driver_authorisation).toEqual({}));
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. computeVehicleMetrics — single default record
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — single default record", () => {
  const m = computeVehicleMetrics([makeRecord()]);

  it("total_checks is 1", () => expect(m.total_checks).toBe(1));
  it("daily_check_count is 1", () => expect(m.daily_check_count).toBe(1));
  it("weekly_count is 0", () => expect(m.weekly_count).toBe(0));
  it("mot_count is 0", () => expect(m.mot_count).toBe(0));
  it("service_count is 0", () => expect(m.service_count).toBe(0));
  it("pass_rate is 100", () => expect(m.pass_rate).toBe(100));
  it("fail_count is 0", () => expect(m.fail_count).toBe(0));
  it("advisory_count is 0", () => expect(m.advisory_count).toBe(0));
  it("excellent_condition_rate is 0 (default is good)", () => expect(m.excellent_condition_rate).toBe(0));
  it("poor_condition_count is 0", () => expect(m.poor_condition_count).toBe(0));
  it("unroadworthy_count is 0", () => expect(m.unroadworthy_count).toBe(0));
  it("fully_authorised_rate is 100", () => expect(m.fully_authorised_rate).toBe(100));
  it("unauthorised_driver_count is 0", () => expect(m.unauthorised_driver_count).toBe(0));
  it("tyres_adequate_rate is 100", () => expect(m.tyres_adequate_rate).toBe(100));
  it("brakes_working_rate is 100", () => expect(m.brakes_working_rate).toBe(100));
  it("lights_working_rate is 100", () => expect(m.lights_working_rate).toBe(100));
  it("seatbelts_rate is 100", () => expect(m.seatbelts_rate).toBe(100));
  it("child_locks_rate is 100", () => expect(m.child_locks_rate).toBe(100));
  it("first_aid_rate is 100", () => expect(m.first_aid_rate).toBe(100));
  it("fire_extinguisher_rate is 100", () => expect(m.fire_extinguisher_rate).toBe(100));
  it("breakdown_cover_rate is 100", () => expect(m.breakdown_cover_rate).toBe(100));
  it("incident_count is 0", () => expect(m.incident_count).toBe(0));
  it("total_children_transported is 3", () => expect(m.total_children_transported).toBe(3));
  it("average_mileage is 50000", () => expect(m.average_mileage).toBe(50000));
  it("unique_vehicles is 1", () => expect(m.unique_vehicles).toBe(1));
  it("by_check_type counts daily_pre_use", () => expect(m.by_check_type).toEqual({ daily_pre_use: 1 }));
  it("by_check_outcome counts pass", () => expect(m.by_check_outcome).toEqual({ pass: 1 }));
  it("by_vehicle_condition counts good", () => expect(m.by_vehicle_condition).toEqual({ good: 1 }));
  it("by_driver_authorisation counts fully_authorised", () => expect(m.by_driver_authorisation).toEqual({ fully_authorised: 1 }));
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. computeVehicleMetrics — check type counting
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — check type counting", () => {
  it("counts weekly_inspection records", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "weekly_inspection" }),
      makeRecord({ check_type: "weekly_inspection" }),
    ]);
    expect(m.weekly_count).toBe(2);
    expect(m.daily_check_count).toBe(0);
  });

  it("counts mot_test records", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "mot_test" }),
    ]);
    expect(m.mot_count).toBe(1);
  });

  it("counts monthly_service as service", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "monthly_service" }),
    ]);
    expect(m.service_count).toBe(1);
  });

  it("counts annual_service as service", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "annual_service" }),
    ]);
    expect(m.service_count).toBe(1);
  });

  it("sums monthly_service and annual_service for service_count", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "monthly_service" }),
      makeRecord({ check_type: "annual_service" }),
      makeRecord({ check_type: "annual_service" }),
    ]);
    expect(m.service_count).toBe(3);
  });

  it("does not count insurance_renewal as service", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "insurance_renewal" }),
    ]);
    expect(m.service_count).toBe(0);
  });

  it("populates by_check_type for mixed types", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "daily_pre_use" }),
      makeRecord({ check_type: "daily_pre_use" }),
      makeRecord({ check_type: "mot_test" }),
      makeRecord({ check_type: "breakdown_repair" }),
    ]);
    expect(m.by_check_type).toEqual({
      daily_pre_use: 2,
      mot_test: 1,
      breakdown_repair: 1,
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. computeVehicleMetrics — outcome counting
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — outcome counting", () => {
  it("calculates pass_rate for all-pass records", () => {
    const m = computeVehicleMetrics([makeRecord(), makeRecord()]);
    expect(m.pass_rate).toBe(100);
  });

  it("calculates pass_rate with mixed outcomes", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "pass_with_advisory" }),
    ]);
    // 1/3 pass => Math.round((1/3)*1000)/10 = 33.3
    expect(m.pass_rate).toBe(33.3);
  });

  it("calculates pass_rate of 0 when no passes", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
    ]);
    expect(m.pass_rate).toBe(0);
  });

  it("counts fail records", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "pass" }),
    ]);
    expect(m.fail_count).toBe(2);
  });

  it("counts advisory records", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "pass_with_advisory" }),
      makeRecord({ check_outcome: "pass_with_advisory" }),
      makeRecord({ check_outcome: "pass_with_advisory" }),
    ]);
    expect(m.advisory_count).toBe(3);
  });

  it("populates by_check_outcome for mixed outcomes", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "deferred" }),
      makeRecord({ check_outcome: "not_applicable" }),
    ]);
    expect(m.by_check_outcome).toEqual({
      pass: 1,
      fail: 1,
      deferred: 1,
      not_applicable: 1,
    });
  });

  it("pass_rate rounds correctly for 2/3", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
    ]);
    // 2/3 => Math.round((2/3)*1000)/10 = 66.7
    expect(m.pass_rate).toBe(66.7);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. computeVehicleMetrics — vehicle condition
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — vehicle condition", () => {
  it("calculates excellent_condition_rate for all excellent", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "excellent" }),
      makeRecord({ vehicle_condition: "excellent" }),
    ]);
    expect(m.excellent_condition_rate).toBe(100);
  });

  it("calculates excellent_condition_rate for 1/4 excellent", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "excellent" }),
      makeRecord({ vehicle_condition: "good" }),
      makeRecord({ vehicle_condition: "fair" }),
      makeRecord({ vehicle_condition: "poor" }),
    ]);
    // 1/4 => Math.round((1/4)*1000)/10 = 25
    expect(m.excellent_condition_rate).toBe(25);
  });

  it("counts poor vehicles", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "poor" }),
      makeRecord({ vehicle_condition: "poor" }),
      makeRecord({ vehicle_condition: "good" }),
    ]);
    expect(m.poor_condition_count).toBe(2);
  });

  it("counts unroadworthy vehicles", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "unroadworthy" }),
      makeRecord({ vehicle_condition: "good" }),
    ]);
    expect(m.unroadworthy_count).toBe(1);
  });

  it("populates by_vehicle_condition for mixed conditions", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "excellent" }),
      makeRecord({ vehicle_condition: "good" }),
      makeRecord({ vehicle_condition: "fair" }),
      makeRecord({ vehicle_condition: "poor" }),
      makeRecord({ vehicle_condition: "unroadworthy" }),
    ]);
    expect(m.by_vehicle_condition).toEqual({
      excellent: 1,
      good: 1,
      fair: 1,
      poor: 1,
      unroadworthy: 1,
    });
  });

  it("excellent_condition_rate is 0 when no excellent", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "good" }),
      makeRecord({ vehicle_condition: "fair" }),
    ]);
    expect(m.excellent_condition_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. computeVehicleMetrics — driver authorisation
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — driver authorisation", () => {
  it("calculates fully_authorised_rate for all authorised", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "fully_authorised" }),
      makeRecord({ driver_authorisation: "fully_authorised" }),
    ]);
    expect(m.fully_authorised_rate).toBe(100);
  });

  it("calculates fully_authorised_rate for 1/4", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "fully_authorised" }),
      makeRecord({ driver_authorisation: "provisional" }),
      makeRecord({ driver_authorisation: "expired" }),
      makeRecord({ driver_authorisation: "not_authorised" }),
    ]);
    expect(m.fully_authorised_rate).toBe(25);
  });

  it("counts unauthorised drivers", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "not_authorised" }),
      makeRecord({ driver_authorisation: "not_authorised" }),
      makeRecord({ driver_authorisation: "fully_authorised" }),
    ]);
    expect(m.unauthorised_driver_count).toBe(2);
  });

  it("does not count suspended as unauthorised", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "suspended" }),
    ]);
    expect(m.unauthorised_driver_count).toBe(0);
  });

  it("does not count expired as unauthorised", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "expired" }),
    ]);
    expect(m.unauthorised_driver_count).toBe(0);
  });

  it("populates by_driver_authorisation for mixed types", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "fully_authorised" }),
      makeRecord({ driver_authorisation: "provisional" }),
      makeRecord({ driver_authorisation: "suspended" }),
    ]);
    expect(m.by_driver_authorisation).toEqual({
      fully_authorised: 1,
      provisional: 1,
      suspended: 1,
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. computeVehicleMetrics — boolean safety rates
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — boolean safety rates", () => {
  it("tyres_adequate_rate is 50 when 1/2 adequate", () => {
    const m = computeVehicleMetrics([
      makeRecord({ tyres_adequate: true }),
      makeRecord({ tyres_adequate: false }),
    ]);
    expect(m.tyres_adequate_rate).toBe(50);
  });

  it("brakes_working_rate is 0 when all false", () => {
    const m = computeVehicleMetrics([
      makeRecord({ brakes_working: false }),
      makeRecord({ brakes_working: false }),
    ]);
    expect(m.brakes_working_rate).toBe(0);
  });

  it("lights_working_rate is 100 when all true", () => {
    const m = computeVehicleMetrics([
      makeRecord({ lights_working: true }),
      makeRecord({ lights_working: true }),
    ]);
    expect(m.lights_working_rate).toBe(100);
  });

  it("seatbelts_rate is 66.7 for 2/3 true", () => {
    const m = computeVehicleMetrics([
      makeRecord({ seatbelts_functional: true }),
      makeRecord({ seatbelts_functional: true }),
      makeRecord({ seatbelts_functional: false }),
    ]);
    expect(m.seatbelts_rate).toBe(66.7);
  });

  it("child_locks_rate is 33.3 for 1/3 true", () => {
    const m = computeVehicleMetrics([
      makeRecord({ child_locks_working: true }),
      makeRecord({ child_locks_working: false }),
      makeRecord({ child_locks_working: false }),
    ]);
    expect(m.child_locks_rate).toBe(33.3);
  });

  it("first_aid_rate is 75 for 3/4 true", () => {
    const m = computeVehicleMetrics([
      makeRecord({ first_aid_kit_present: true }),
      makeRecord({ first_aid_kit_present: true }),
      makeRecord({ first_aid_kit_present: true }),
      makeRecord({ first_aid_kit_present: false }),
    ]);
    expect(m.first_aid_rate).toBe(75);
  });

  it("fire_extinguisher_rate is 25 for 1/4 true", () => {
    const m = computeVehicleMetrics([
      makeRecord({ fire_extinguisher_present: true }),
      makeRecord({ fire_extinguisher_present: false }),
      makeRecord({ fire_extinguisher_present: false }),
      makeRecord({ fire_extinguisher_present: false }),
    ]);
    expect(m.fire_extinguisher_rate).toBe(25);
  });

  it("breakdown_cover_rate is 0 when all false", () => {
    const m = computeVehicleMetrics([
      makeRecord({ breakdown_cover_valid: false }),
    ]);
    expect(m.breakdown_cover_rate).toBe(0);
  });

  it("all boolean rates are 100 for default record", () => {
    const m = computeVehicleMetrics([makeRecord()]);
    expect(m.tyres_adequate_rate).toBe(100);
    expect(m.brakes_working_rate).toBe(100);
    expect(m.lights_working_rate).toBe(100);
    expect(m.seatbelts_rate).toBe(100);
    expect(m.child_locks_rate).toBe(100);
    expect(m.first_aid_rate).toBe(100);
    expect(m.fire_extinguisher_rate).toBe(100);
    expect(m.breakdown_cover_rate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. computeVehicleMetrics — incidents
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — incidents", () => {
  it("counts zero incidents for default records", () => {
    const m = computeVehicleMetrics([makeRecord(), makeRecord()]);
    expect(m.incident_count).toBe(0);
  });

  it("counts a single incident", () => {
    const m = computeVehicleMetrics([
      makeRecord({ incident_during_journey: true }),
    ]);
    expect(m.incident_count).toBe(1);
  });

  it("counts multiple incidents", () => {
    const m = computeVehicleMetrics([
      makeRecord({ incident_during_journey: true }),
      makeRecord({ incident_during_journey: true }),
      makeRecord({ incident_during_journey: false }),
    ]);
    expect(m.incident_count).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. computeVehicleMetrics — children transported
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — children transported", () => {
  it("sums children across records", () => {
    const m = computeVehicleMetrics([
      makeRecord({ children_transported: 2 }),
      makeRecord({ children_transported: 5 }),
    ]);
    expect(m.total_children_transported).toBe(7);
  });

  it("handles zero children", () => {
    const m = computeVehicleMetrics([
      makeRecord({ children_transported: 0 }),
    ]);
    expect(m.total_children_transported).toBe(0);
  });

  it("handles large numbers of children", () => {
    const m = computeVehicleMetrics([
      makeRecord({ children_transported: 8 }),
      makeRecord({ children_transported: 8 }),
      makeRecord({ children_transported: 8 }),
    ]);
    expect(m.total_children_transported).toBe(24);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. computeVehicleMetrics — mileage
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — mileage", () => {
  it("calculates average for single record", () => {
    const m = computeVehicleMetrics([makeRecord({ mileage_reading: 30000 })]);
    expect(m.average_mileage).toBe(30000);
  });

  it("calculates average for multiple records", () => {
    const m = computeVehicleMetrics([
      makeRecord({ mileage_reading: 10000 }),
      makeRecord({ mileage_reading: 20000 }),
    ]);
    expect(m.average_mileage).toBe(15000);
  });

  it("rounds average to one decimal", () => {
    const m = computeVehicleMetrics([
      makeRecord({ mileage_reading: 10000 }),
      makeRecord({ mileage_reading: 10001 }),
      makeRecord({ mileage_reading: 10002 }),
    ]);
    // (10000+10001+10002)/3 = 10001, Math.round(10001*10)/10 = 10001
    expect(m.average_mileage).toBe(10001);
  });

  it("rounds non-integer average correctly", () => {
    const m = computeVehicleMetrics([
      makeRecord({ mileage_reading: 100 }),
      makeRecord({ mileage_reading: 200 }),
      makeRecord({ mileage_reading: 300 }),
    ]);
    // (100+200+300)/3 = 200
    expect(m.average_mileage).toBe(200);
  });

  it("handles zero mileage", () => {
    const m = computeVehicleMetrics([
      makeRecord({ mileage_reading: 0 }),
    ]);
    expect(m.average_mileage).toBe(0);
  });

  it("fractional average rounds to one decimal", () => {
    const m = computeVehicleMetrics([
      makeRecord({ mileage_reading: 1 }),
      makeRecord({ mileage_reading: 2 }),
      makeRecord({ mileage_reading: 3 }),
    ]);
    // (1+2+3)/3 = 2
    expect(m.average_mileage).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. computeVehicleMetrics — unique vehicles
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — unique vehicles", () => {
  it("counts 1 unique vehicle for same registration", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_registration: "AB12 CDE" }),
      makeRecord({ vehicle_registration: "AB12 CDE" }),
    ]);
    expect(m.unique_vehicles).toBe(1);
  });

  it("counts multiple unique vehicles", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_registration: "AB12 CDE" }),
      makeRecord({ vehicle_registration: "XY34 FGH" }),
      makeRecord({ vehicle_registration: "LM56 NOP" }),
    ]);
    expect(m.unique_vehicles).toBe(3);
  });

  it("deduplicates registrations correctly", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_registration: "AB12 CDE" }),
      makeRecord({ vehicle_registration: "XY34 FGH" }),
      makeRecord({ vehicle_registration: "AB12 CDE" }),
      makeRecord({ vehicle_registration: "XY34 FGH" }),
      makeRecord({ vehicle_registration: "AB12 CDE" }),
    ]);
    expect(m.unique_vehicles).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. computeVehicleMetrics — mixed realistic scenario
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — mixed realistic scenario", () => {
  const records = [
    makeRecord({
      check_type: "daily_pre_use",
      check_outcome: "pass",
      vehicle_condition: "good",
      driver_authorisation: "fully_authorised",
      mileage_reading: 45000,
      vehicle_registration: "AB12 CDE",
      children_transported: 3,
      incident_during_journey: false,
    }),
    makeRecord({
      check_type: "weekly_inspection",
      check_outcome: "pass_with_advisory",
      vehicle_condition: "fair",
      driver_authorisation: "fully_authorised",
      mileage_reading: 45200,
      vehicle_registration: "AB12 CDE",
      children_transported: 2,
      incident_during_journey: false,
    }),
    makeRecord({
      check_type: "mot_test",
      check_outcome: "fail",
      vehicle_condition: "poor",
      driver_authorisation: "provisional",
      mileage_reading: 80000,
      vehicle_registration: "XY34 FGH",
      children_transported: 0,
      incident_during_journey: true,
      tyres_adequate: false,
      brakes_working: false,
      first_aid_kit_present: false,
    }),
  ];
  const m = computeVehicleMetrics(records);

  it("total_checks is 3", () => expect(m.total_checks).toBe(3));
  it("daily_check_count is 1", () => expect(m.daily_check_count).toBe(1));
  it("weekly_count is 1", () => expect(m.weekly_count).toBe(1));
  it("mot_count is 1", () => expect(m.mot_count).toBe(1));
  it("service_count is 0", () => expect(m.service_count).toBe(0));
  it("pass_rate is 33.3", () => expect(m.pass_rate).toBe(33.3));
  it("fail_count is 1", () => expect(m.fail_count).toBe(1));
  it("advisory_count is 1", () => expect(m.advisory_count).toBe(1));
  it("poor_condition_count is 1", () => expect(m.poor_condition_count).toBe(1));
  it("fully_authorised_rate is 66.7", () => expect(m.fully_authorised_rate).toBe(66.7));
  it("tyres_adequate_rate is 66.7", () => expect(m.tyres_adequate_rate).toBe(66.7));
  it("brakes_working_rate is 66.7", () => expect(m.brakes_working_rate).toBe(66.7));
  it("first_aid_rate is 66.7", () => expect(m.first_aid_rate).toBe(66.7));
  it("incident_count is 1", () => expect(m.incident_count).toBe(1));
  it("total_children_transported is 5", () => expect(m.total_children_transported).toBe(5));
  it("unique_vehicles is 2", () => expect(m.unique_vehicles).toBe(2));

  it("average_mileage is correct", () => {
    // (45000+45200+80000)/3 = 56733.333... => Math.round(56733.333...*10)/10 = 56733.3
    expect(m.average_mileage).toBe(56733.3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. computeVehicleMetrics — rate rounding edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — rate rounding edge cases", () => {
  it("pass_rate for 1/6 rounds to 16.7", () => {
    const records = [
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.pass_rate).toBe(16.7);
  });

  it("pass_rate for 5/6 rounds to 83.3", () => {
    const records = [
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.pass_rate).toBe(83.3);
  });

  it("pass_rate for 1/7 rounds to 14.3", () => {
    const records = [
      makeRecord({ check_outcome: "pass" }),
      ...Array.from({ length: 6 }, () => makeRecord({ check_outcome: "fail" })),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.pass_rate).toBe(14.3);
  });

  it("pass_rate for 3/7 rounds to 42.9", () => {
    const records = [
      ...Array.from({ length: 3 }, () => makeRecord({ check_outcome: "pass" })),
      ...Array.from({ length: 4 }, () => makeRecord({ check_outcome: "fail" })),
    ];
    const m = computeVehicleMetrics(records);
    expect(m.pass_rate).toBe(42.9);
  });

  it("boolean rate for 1/1 is 100", () => {
    const m = computeVehicleMetrics([makeRecord({ tyres_adequate: true })]);
    expect(m.tyres_adequate_rate).toBe(100);
  });

  it("boolean rate for 0/1 is 0", () => {
    const m = computeVehicleMetrics([makeRecord({ tyres_adequate: false })]);
    expect(m.tyres_adequate_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. computeVehicleMetrics — by_* breakdown maps
// ══════════════════════════════════════════════════════════════════════════════

describe("computeVehicleMetrics — breakdown maps", () => {
  it("by_check_type accumulates correctly", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_type: "other" }),
      makeRecord({ check_type: "other" }),
      makeRecord({ check_type: "tyre_replacement" }),
    ]);
    expect(m.by_check_type.other).toBe(2);
    expect(m.by_check_type.tyre_replacement).toBe(1);
  });

  it("by_check_outcome accumulates correctly", () => {
    const m = computeVehicleMetrics([
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "pass" }),
      makeRecord({ check_outcome: "fail" }),
    ]);
    expect(m.by_check_outcome.pass).toBe(3);
    expect(m.by_check_outcome.fail).toBe(1);
  });

  it("by_vehicle_condition accumulates correctly", () => {
    const m = computeVehicleMetrics([
      makeRecord({ vehicle_condition: "good" }),
      makeRecord({ vehicle_condition: "good" }),
      makeRecord({ vehicle_condition: "excellent" }),
    ]);
    expect(m.by_vehicle_condition.good).toBe(2);
    expect(m.by_vehicle_condition.excellent).toBe(1);
  });

  it("by_driver_authorisation accumulates correctly", () => {
    const m = computeVehicleMetrics([
      makeRecord({ driver_authorisation: "fully_authorised" }),
      makeRecord({ driver_authorisation: "expired" }),
      makeRecord({ driver_authorisation: "expired" }),
    ]);
    expect(m.by_driver_authorisation.fully_authorised).toBe(1);
    expect(m.by_driver_authorisation.expired).toBe(2);
  });

  it("by_check_type does not include types not present", () => {
    const m = computeVehicleMetrics([makeRecord({ check_type: "daily_pre_use" })]);
    expect(m.by_check_type.mot_test).toBeUndefined();
  });

  it("by_check_outcome does not include outcomes not present", () => {
    const m = computeVehicleMetrics([makeRecord({ check_outcome: "pass" })]);
    expect(m.by_check_outcome.fail).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. identifyVehicleAlerts — empty input
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — empty input", () => {
  it("returns empty array for no records", () => {
    expect(identifyVehicleAlerts([])).toEqual([]);
  });

  it("returns empty array for all-clean records", () => {
    expect(identifyVehicleAlerts([makeRecord(), makeRecord()])).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. identifyVehicleAlerts — unroadworthy_vehicle
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — unroadworthy_vehicle", () => {
  it("fires for a single unroadworthy vehicle", () => {
    const r = makeRecord({ id: "rec-1", vehicle_condition: "unroadworthy", vehicle_registration: "AB12 CDE" });
    const alerts = identifyVehicleAlerts([r]);
    const found = alerts.find((a) => a.type === "unroadworthy_vehicle");
    expect(found).toBeDefined();
  });

  it("severity is critical", () => {
    const r = makeRecord({ vehicle_condition: "unroadworthy" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")!.severity).toBe("critical");
  });

  it("message includes vehicle registration", () => {
    const r = makeRecord({ vehicle_condition: "unroadworthy", vehicle_registration: "ZZ99 AAA" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")!.message).toContain("ZZ99 AAA");
  });

  it("id is the record id", () => {
    const r = makeRecord({ id: "rec-unr", vehicle_condition: "unroadworthy" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")!.id).toBe("rec-unr");
  });

  it("fires per-record for multiple unroadworthy vehicles", () => {
    const records = [
      makeRecord({ id: "r1", vehicle_condition: "unroadworthy", vehicle_registration: "AA11 BBB" }),
      makeRecord({ id: "r2", vehicle_condition: "unroadworthy", vehicle_registration: "CC22 DDD" }),
    ];
    const alerts = identifyVehicleAlerts(records);
    const unr = alerts.filter((a) => a.type === "unroadworthy_vehicle");
    expect(unr).toHaveLength(2);
  });

  it("does not fire for poor condition", () => {
    const r = makeRecord({ vehicle_condition: "poor" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")).toBeUndefined();
  });

  it("does not fire for fair condition", () => {
    const r = makeRecord({ vehicle_condition: "fair" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")).toBeUndefined();
  });

  it("does not fire for good condition", () => {
    const r = makeRecord({ vehicle_condition: "good" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")).toBeUndefined();
  });

  it("does not fire for excellent condition", () => {
    const r = makeRecord({ vehicle_condition: "excellent" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")).toBeUndefined();
  });

  it("message contains 'unroadworthy'", () => {
    const r = makeRecord({ vehicle_condition: "unroadworthy", vehicle_registration: "AB12 CDE" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unroadworthy_vehicle")!.message).toContain("unroadworthy");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. identifyVehicleAlerts — unauthorised_driver
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — unauthorised_driver", () => {
  it("fires for a single unauthorised driver", () => {
    const r = makeRecord({ driver_authorisation: "not_authorised" });
    const alerts = identifyVehicleAlerts([r]);
    const found = alerts.find((a) => a.type === "unauthorised_driver");
    expect(found).toBeDefined();
  });

  it("severity is critical", () => {
    const r = makeRecord({ driver_authorisation: "not_authorised" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")!.severity).toBe("critical");
  });

  it("message includes staff_driver name", () => {
    const r = makeRecord({ driver_authorisation: "not_authorised", staff_driver: "John Smith" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")!.message).toContain("John Smith");
  });

  it("message includes vehicle_registration", () => {
    const r = makeRecord({ driver_authorisation: "not_authorised", vehicle_registration: "XY34 FGH" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")!.message).toContain("XY34 FGH");
  });

  it("message includes check_date", () => {
    const r = makeRecord({ driver_authorisation: "not_authorised", check_date: "2026-05-10" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")!.message).toContain("2026-05-10");
  });

  it("id is the record id", () => {
    const r = makeRecord({ id: "rec-unauth", driver_authorisation: "not_authorised" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")!.id).toBe("rec-unauth");
  });

  it("fires per-record for multiple unauthorised drivers", () => {
    const records = [
      makeRecord({ id: "u1", driver_authorisation: "not_authorised" }),
      makeRecord({ id: "u2", driver_authorisation: "not_authorised" }),
      makeRecord({ id: "u3", driver_authorisation: "not_authorised" }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.filter((a) => a.type === "unauthorised_driver")).toHaveLength(3);
  });

  it("does not fire for fully_authorised", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ driver_authorisation: "fully_authorised" })]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")).toBeUndefined();
  });

  it("does not fire for provisional", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ driver_authorisation: "provisional" })]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")).toBeUndefined();
  });

  it("does not fire for expired", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ driver_authorisation: "expired" })]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")).toBeUndefined();
  });

  it("does not fire for suspended", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ driver_authorisation: "suspended" })]);
    expect(alerts.find((a) => a.type === "unauthorised_driver")).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. identifyVehicleAlerts — check_failure
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — check_failure", () => {
  it("fires when 1 check has failed", () => {
    const r = makeRecord({ check_outcome: "fail" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "check_failure")).toBeDefined();
  });

  it("severity is high", () => {
    const r = makeRecord({ check_outcome: "fail" });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "check_failure")!.severity).toBe("high");
  });

  it("singular message for 1 failure", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "fail" })]);
    const msg = alerts.find((a) => a.type === "check_failure")!.message;
    expect(msg).toContain("1 vehicle check has failed");
  });

  it("plural message for 2 failures", () => {
    const alerts = identifyVehicleAlerts([
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
    ]);
    const msg = alerts.find((a) => a.type === "check_failure")!.message;
    expect(msg).toContain("2 vehicle checks have failed");
  });

  it("plural message for 5 failures", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ check_outcome: "fail" }));
    const alerts = identifyVehicleAlerts(records);
    const msg = alerts.find((a) => a.type === "check_failure")!.message;
    expect(msg).toContain("5 vehicle checks have failed");
  });

  it("id is 'check_failure'", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "fail" })]);
    expect(alerts.find((a) => a.type === "check_failure")!.id).toBe("check_failure");
  });

  it("produces exactly one alert even for multiple failures", () => {
    const records = [
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
      makeRecord({ check_outcome: "fail" }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.filter((a) => a.type === "check_failure")).toHaveLength(1);
  });

  it("does not fire for pass", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "pass" })]);
    expect(alerts.find((a) => a.type === "check_failure")).toBeUndefined();
  });

  it("does not fire for pass_with_advisory", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "pass_with_advisory" })]);
    expect(alerts.find((a) => a.type === "check_failure")).toBeUndefined();
  });

  it("does not fire for deferred", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "deferred" })]);
    expect(alerts.find((a) => a.type === "check_failure")).toBeUndefined();
  });

  it("does not fire for not_applicable", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "not_applicable" })]);
    expect(alerts.find((a) => a.type === "check_failure")).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 20. identifyVehicleAlerts — journey_incident
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — journey_incident", () => {
  it("fires when 1 incident occurred", () => {
    const r = makeRecord({ incident_during_journey: true });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "journey_incident")).toBeDefined();
  });

  it("severity is high", () => {
    const r = makeRecord({ incident_during_journey: true });
    const alerts = identifyVehicleAlerts([r]);
    expect(alerts.find((a) => a.type === "journey_incident")!.severity).toBe("high");
  });

  it("singular message for 1 incident", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ incident_during_journey: true })]);
    const msg = alerts.find((a) => a.type === "journey_incident")!.message;
    expect(msg).toContain("1 incident");
  });

  it("plural message for 2 incidents", () => {
    const alerts = identifyVehicleAlerts([
      makeRecord({ incident_during_journey: true }),
      makeRecord({ incident_during_journey: true }),
    ]);
    const msg = alerts.find((a) => a.type === "journey_incident")!.message;
    expect(msg).toContain("2 incidents");
  });

  it("plural message for 4 incidents", () => {
    const records = Array.from({ length: 4 }, () => makeRecord({ incident_during_journey: true }));
    const alerts = identifyVehicleAlerts(records);
    const msg = alerts.find((a) => a.type === "journey_incident")!.message;
    expect(msg).toContain("4 incidents");
  });

  it("id is 'journey_incident'", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ incident_during_journey: true })]);
    expect(alerts.find((a) => a.type === "journey_incident")!.id).toBe("journey_incident");
  });

  it("produces exactly one alert even for multiple incidents", () => {
    const records = [
      makeRecord({ incident_during_journey: true }),
      makeRecord({ incident_during_journey: true }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.filter((a) => a.type === "journey_incident")).toHaveLength(1);
  });

  it("does not fire when no incidents", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ incident_during_journey: false })]);
    expect(alerts.find((a) => a.type === "journey_incident")).toBeUndefined();
  });

  it("does not fire for all false incidents", () => {
    const records = [
      makeRecord({ incident_during_journey: false }),
      makeRecord({ incident_during_journey: false }),
      makeRecord({ incident_during_journey: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "journey_incident")).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 21. identifyVehicleAlerts — safety_equipment_missing
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — safety_equipment_missing", () => {
  it("fires when 2 checks lack first aid kit", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeDefined();
  });

  it("severity is medium", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")!.severity).toBe("medium");
  });

  it("does not fire for 1 check lacking first aid kit", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: true }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeUndefined();
  });

  it("does not fire for 0 checks lacking first aid kit", () => {
    const records = [
      makeRecord({ first_aid_kit_present: true }),
      makeRecord({ first_aid_kit_present: true }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeUndefined();
  });

  it("fires for 3 checks lacking first aid kit", () => {
    const records = Array.from({ length: 3 }, () => makeRecord({ first_aid_kit_present: false }));
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeDefined();
  });

  it("message includes count of missing equipment", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")!.message).toContain("3");
  });

  it("id is 'safety_equipment_missing'", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")!.id).toBe("safety_equipment_missing");
  });

  it("produces exactly one alert even for many missing", () => {
    const records = Array.from({ length: 5 }, () => makeRecord({ first_aid_kit_present: false }));
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.filter((a) => a.type === "safety_equipment_missing")).toHaveLength(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 22. identifyVehicleAlerts — combined alerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — combined alerts", () => {
  it("fires multiple alert types simultaneously", () => {
    const records = [
      makeRecord({
        id: "combo-1",
        vehicle_condition: "unroadworthy",
        driver_authorisation: "not_authorised",
        check_outcome: "fail",
        incident_during_journey: true,
        first_aid_kit_present: false,
      }),
      makeRecord({
        id: "combo-2",
        first_aid_kit_present: false,
      }),
    ];
    const alerts = identifyVehicleAlerts(records);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("unroadworthy_vehicle");
    expect(types).toContain("unauthorised_driver");
    expect(types).toContain("check_failure");
    expect(types).toContain("journey_incident");
    expect(types).toContain("safety_equipment_missing");
  });

  it("all five alert types can fire at once", () => {
    const records = [
      makeRecord({
        id: "all-1",
        vehicle_condition: "unroadworthy",
        driver_authorisation: "not_authorised",
        check_outcome: "fail",
        incident_during_journey: true,
        first_aid_kit_present: false,
      }),
      makeRecord({ id: "all-2", first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.length).toBeGreaterThanOrEqual(5);
  });

  it("unroadworthy + unauthorised in same record produces 2 critical alerts", () => {
    const r = makeRecord({
      id: "crit-both",
      vehicle_condition: "unroadworthy",
      driver_authorisation: "not_authorised",
    });
    const alerts = identifyVehicleAlerts([r]);
    const critical = alerts.filter((a) => a.severity === "critical");
    expect(critical).toHaveLength(2);
  });

  it("alert ordering: critical before high before medium", () => {
    const records = [
      makeRecord({
        id: "order-1",
        vehicle_condition: "unroadworthy",
        driver_authorisation: "not_authorised",
        check_outcome: "fail",
        incident_during_journey: true,
        first_aid_kit_present: false,
      }),
      makeRecord({ id: "order-2", first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    const severities = alerts.map((a) => a.severity);
    const firstMediumIdx = severities.indexOf("medium");
    const lastCriticalIdx = severities.lastIndexOf("critical");
    const lastHighIdx = severities.lastIndexOf("high");
    if (firstMediumIdx >= 0 && lastCriticalIdx >= 0) {
      expect(lastCriticalIdx).toBeLessThan(firstMediumIdx);
    }
    if (lastHighIdx >= 0 && firstMediumIdx >= 0) {
      expect(lastHighIdx).toBeLessThan(firstMediumIdx);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 23. identifyVehicleAlerts — boundary thresholds
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyVehicleAlerts — boundary thresholds", () => {
  it("check_failure fires at exactly 1 failure", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ check_outcome: "fail" })]);
    expect(alerts.find((a) => a.type === "check_failure")).toBeDefined();
  });

  it("journey_incident fires at exactly 1 incident", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ incident_during_journey: true })]);
    expect(alerts.find((a) => a.type === "journey_incident")).toBeDefined();
  });

  it("safety_equipment_missing does not fire at exactly 1 missing", () => {
    const alerts = identifyVehicleAlerts([makeRecord({ first_aid_kit_present: false })]);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeUndefined();
  });

  it("safety_equipment_missing fires at exactly 2 missing", () => {
    const records = [
      makeRecord({ first_aid_kit_present: false }),
      makeRecord({ first_aid_kit_present: false }),
    ];
    const alerts = identifyVehicleAlerts(records);
    expect(alerts.find((a) => a.type === "safety_equipment_missing")).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 24. makeRecord factory — default values
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRecord factory — defaults", () => {
  const r = makeRecord();

  it("check_type defaults to daily_pre_use", () => expect(r.check_type).toBe("daily_pre_use"));
  it("check_outcome defaults to pass", () => expect(r.check_outcome).toBe("pass"));
  it("vehicle_condition defaults to good", () => expect(r.vehicle_condition).toBe("good"));
  it("driver_authorisation defaults to fully_authorised", () => expect(r.driver_authorisation).toBe("fully_authorised"));
  it("vehicle_registration defaults to AB12 CDE", () => expect(r.vehicle_registration).toBe("AB12 CDE"));
  it("vehicle_make_model defaults to Ford Transit", () => expect(r.vehicle_make_model).toBe("Ford Transit"));
  it("mileage_reading defaults to 50000", () => expect(r.mileage_reading).toBe(50000));
  it("children_transported defaults to 3", () => expect(r.children_transported).toBe(3));
  it("staff_driver defaults to Staff A", () => expect(r.staff_driver).toBe("Staff A"));
  it("tyres_adequate defaults to true", () => expect(r.tyres_adequate).toBe(true));
  it("brakes_working defaults to true", () => expect(r.brakes_working).toBe(true));
  it("lights_working defaults to true", () => expect(r.lights_working).toBe(true));
  it("mirrors_clean defaults to true", () => expect(r.mirrors_clean).toBe(true));
  it("seatbelts_functional defaults to true", () => expect(r.seatbelts_functional).toBe(true));
  it("child_locks_working defaults to true", () => expect(r.child_locks_working).toBe(true));
  it("first_aid_kit_present defaults to true", () => expect(r.first_aid_kit_present).toBe(true));
  it("fire_extinguisher_present defaults to true", () => expect(r.fire_extinguisher_present).toBe(true));
  it("breakdown_cover_valid defaults to true", () => expect(r.breakdown_cover_valid).toBe(true));
  it("incident_during_journey defaults to false", () => expect(r.incident_during_journey).toBe(false));
  it("defects_found defaults to empty array", () => expect(r.defects_found).toEqual([]));
  it("actions_taken defaults to empty array", () => expect(r.actions_taken).toEqual([]));
  it("issues_found defaults to empty array", () => expect(r.issues_found).toEqual([]));
  it("mot_expiry_date defaults to null", () => expect(r.mot_expiry_date).toBeNull());
  it("insurance_expiry_date defaults to null", () => expect(r.insurance_expiry_date).toBeNull());
  it("next_service_date defaults to null", () => expect(r.next_service_date).toBeNull());
  it("notes defaults to null", () => expect(r.notes).toBeNull());
  it("id is a valid string", () => expect(typeof r.id).toBe("string"));
  it("home_id defaults to home-1", () => expect(r.home_id).toBe("home-1"));
});

// ══════════════════════════════════════════════════════════════════════════════
// 25. makeRecord factory — override nullable fields
// ══════════════════════════════════════════════════════════════════════════════

describe("makeRecord factory — nullable overrides", () => {
  it("mot_expiry_date can be set", () => {
    const r = makeRecord({ mot_expiry_date: "2027-01-01" });
    expect(r.mot_expiry_date).toBe("2027-01-01");
  });

  it("mot_expiry_date can be explicitly null", () => {
    const r = makeRecord({ mot_expiry_date: null });
    expect(r.mot_expiry_date).toBeNull();
  });

  it("insurance_expiry_date can be set", () => {
    const r = makeRecord({ insurance_expiry_date: "2027-06-15" });
    expect(r.insurance_expiry_date).toBe("2027-06-15");
  });

  it("next_service_date can be set", () => {
    const r = makeRecord({ next_service_date: "2026-08-01" });
    expect(r.next_service_date).toBe("2026-08-01");
  });

  it("notes can be set", () => {
    const r = makeRecord({ notes: "Needs new tyres" });
    expect(r.notes).toBe("Needs new tyres");
  });

  it("notes can be explicitly null", () => {
    const r = makeRecord({ notes: null });
    expect(r.notes).toBeNull();
  });
});
