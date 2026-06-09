// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — PREMISES & SAFETY INTELLIGENCE ENGINE · TEST SUITE
//
// 60+ tests covering overview, building profiles, check type analysis,
// maintenance analysis, vehicle profiles, alerts, ARIA insights, and
// Chamberlain House integration.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computePremisesSafetyIntelligence,
  daysUntil,
  daysSince,
  type BuildingInput,
  type BuildingCheckInput,
  type MaintenanceInput,
  type VehicleInput,
  type VehicleCheckInput,
  type PremisesSafetyIntelligenceInput,
  type CheckStatus,
  type CheckResult,
  type RiskLevel,
  type MaintenancePriority,
  type MaintenanceStatus,
  type VehicleStatus,
  type VehicleCheckResult,
} from "../premises-safety-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factory Functions ─────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `prem_${++_id}`;
}

function makeBuilding(overrides: Partial<BuildingInput> = {}): BuildingInput {
  return {
    id: uid(),
    name: "Test Building",
    type: "residential",
    status: "operational",
    gas_cert_expiry: "2027-01-01",
    electrical_cert_expiry: "2027-06-01",
    fire_risk_assessment_date: "2026-02-01",
    epc_rating: "C",
    last_full_inspection: "2026-01-01",
    next_inspection_due: "2027-01-01",
    ...overrides,
  };
}

function makeBuildingCheck(
  building_id: string,
  overrides: Partial<Omit<BuildingCheckInput, "building_id">> = {},
): BuildingCheckInput {
  return {
    id: uid(),
    building_id,
    area: "whole_home",
    check_type: "daily_walkround",
    check_date: TODAY,
    due_date: TODAY,
    responsible_person: "staff_test",
    status: "completed",
    result: "pass",
    risk_level: "low",
    notes: null,
    action_required: null,
    action_due: null,
    manager_oversight: false,
    ...overrides,
  };
}

function makeMaintenance(
  overrides: Partial<MaintenanceInput> = {},
): MaintenanceInput {
  return {
    id: uid(),
    title: "Test Maintenance",
    category: "general",
    priority: "medium",
    status: "open",
    due_date: "2026-06-01",
    assigned_to: null,
    recurring: false,
    ...overrides,
  };
}

function makeVehicle(
  overrides: Partial<VehicleInput> = {},
): VehicleInput {
  return {
    id: uid(),
    registration: "AB21 CDE",
    make: "Ford",
    model: "Transit",
    status: "available",
    mot_expiry: "2027-01-01",
    insurance_expiry: "2027-01-01",
    tax_expiry: "2027-01-01",
    next_service_due: "2026-10-01",
    mileage: 20000,
    ...overrides,
  };
}

function makeVehicleCheck(
  vehicle_id: string,
  overrides: Partial<Omit<VehicleCheckInput, "vehicle_id">> = {},
): VehicleCheckInput {
  return {
    id: uid(),
    vehicle_id,
    check_type: "daily_safety",
    check_date: TODAY,
    driver: "staff_test",
    overall_result: "pass",
    defects: null,
    ...overrides,
  };
}

function run(
  overrides: Partial<PremisesSafetyIntelligenceInput> = {},
): ReturnType<typeof computePremisesSafetyIntelligence> {
  return computePremisesSafetyIntelligence({
    buildings: [],
    building_checks: [],
    maintenance: [],
    vehicles: [],
    vehicle_checks: [],
    today: TODAY,
    ...overrides,
  });
}

// ── Helper Tests ──────────────────────────────────────────────────────────

describe("helpers", () => {
  it("daysUntil returns positive for future dates", () => {
    expect(daysUntil("2026-05-25", "2026-06-24")).toBe(30);
  });

  it("daysUntil returns negative for past dates", () => {
    expect(daysUntil("2026-05-25", "2026-04-25")).toBe(-30);
  });

  it("daysSince returns positive for past-to-present", () => {
    expect(daysSince("2026-01-01", "2026-05-25")).toBe(144);
  });
});

// ── Empty State ───────────────────────────────────────────────────────────

describe("empty state", () => {
  it("returns sensible defaults when no data provided", () => {
    const r = run();
    expect(r.overview.total_buildings).toBe(0);
    expect(r.overview.total_checks).toBe(0);
    expect(r.overview.check_completion_rate).toBe(100);
    expect(r.overview.fire_safety_compliant).toBe(true);
    expect(r.overview.total_vehicles).toBe(0);
    expect(r.building_profiles).toHaveLength(0);
    expect(r.check_analysis).toHaveLength(0);
    expect(r.maintenance_analysis).toHaveLength(0);
    expect(r.vehicle_profiles).toHaveLength(0);
    expect(r.alerts).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });
});

// ── Overview ──────────────────────────────────────────────────────────────

describe("overview", () => {
  it("counts buildings correctly", () => {
    const b1 = makeBuilding({ status: "operational" });
    const b2 = makeBuilding({ status: "closed" });
    const r = run({ buildings: [b1, b2] });
    expect(r.overview.total_buildings).toBe(2);
    expect(r.overview.operational_buildings).toBe(1);
  });

  it("counts checks by status", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { status: "completed", result: "pass" });
    const c2 = makeBuildingCheck(b.id, { status: "overdue" });
    const c3 = makeBuildingCheck(b.id, { status: "completed", result: "fail" });
    const c4 = makeBuildingCheck(b.id, { status: "due" });
    const r = run({ buildings: [b], building_checks: [c1, c2, c3, c4] });
    expect(r.overview.total_checks).toBe(4);
    expect(r.overview.checks_completed).toBe(2);
    expect(r.overview.checks_overdue).toBe(1);
    expect(r.overview.checks_failed).toBe(1);
  });

  it("calculates check completion rate excluding waived", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { status: "completed" });
    const c2 = makeBuildingCheck(b.id, { status: "due" });
    const c3 = makeBuildingCheck(b.id, { status: "waived" });
    const r = run({ buildings: [b], building_checks: [c1, c2, c3] });
    // 1 completed out of 2 non-waived = 50%
    expect(r.overview.check_completion_rate).toBe(50);
  });

  it("counts certifications expiring within 90 days", () => {
    const b = makeBuilding({
      gas_cert_expiry: "2026-07-01", // 37 days — within 90
      electrical_cert_expiry: "2027-06-01", // well past 90
    });
    const r = run({ buildings: [b] });
    expect(r.overview.certifications_expiring_soon).toBe(1);
    expect(r.overview.certifications_expired).toBe(0);
  });

  it("counts expired certifications", () => {
    const b = makeBuilding({
      gas_cert_expiry: "2026-04-01", // expired
      electrical_cert_expiry: "2026-03-01", // expired
    });
    const r = run({ buildings: [b] });
    expect(r.overview.certifications_expired).toBe(2);
  });

  it("treats missing cert on operational building as expired", () => {
    const b = makeBuilding({ gas_cert_expiry: null, electrical_cert_expiry: null });
    const r = run({ buildings: [b] });
    expect(r.overview.certifications_expired).toBe(2);
  });

  it("does NOT count cert expiry on closed buildings", () => {
    const b = makeBuilding({ status: "closed", gas_cert_expiry: "2025-01-01" });
    const r = run({ buildings: [b] });
    expect(r.overview.certifications_expired).toBe(0);
  });

  it("fire safety is false when gas cert expired", () => {
    const b = makeBuilding({ gas_cert_expiry: "2026-01-01" }); // expired
    const r = run({ buildings: [b] });
    expect(r.overview.fire_safety_compliant).toBe(false);
  });

  it("fire safety is false when no fire risk assessment", () => {
    const b = makeBuilding({ fire_risk_assessment_date: null });
    const r = run({ buildings: [b] });
    expect(r.overview.fire_safety_compliant).toBe(false);
  });

  it("fire safety is false when fire risk assessment >12 months old", () => {
    const b = makeBuilding({ fire_risk_assessment_date: "2025-01-01" }); // >365 days ago from 2026-05-25
    const r = run({ buildings: [b] });
    expect(r.overview.fire_safety_compliant).toBe(false);
  });

  it("fire safety is true when all criteria met", () => {
    const b = makeBuilding({
      gas_cert_expiry: "2027-01-01",
      fire_risk_assessment_date: "2026-02-01", // 113 days ago, within 365
    });
    const r = run({ buildings: [b] });
    expect(r.overview.fire_safety_compliant).toBe(true);
  });

  it("counts maintenance correctly", () => {
    const m1 = makeMaintenance({ status: "open", priority: "urgent", due_date: "2026-05-20" }); // overdue
    const m2 = makeMaintenance({ status: "open", priority: "medium" });
    const m3 = makeMaintenance({ status: "completed", priority: "urgent" });
    const r = run({ maintenance: [m1, m2, m3] });
    expect(r.overview.maintenance_open).toBe(2);
    expect(r.overview.maintenance_urgent).toBe(1); // m1 only, m3 is completed
    expect(r.overview.maintenance_overdue).toBe(1); // m1 past due_date
  });

  it("counts vehicles and roadworthiness", () => {
    const v1 = makeVehicle(); // all docs valid
    const v2 = makeVehicle({ mot_expiry: "2026-01-01" }); // expired MOT
    const vc1 = makeVehicleCheck(v1.id);
    const vc2 = makeVehicleCheck(v2.id);
    const r = run({ vehicles: [v1, v2], vehicle_checks: [vc1, vc2] });
    expect(r.overview.total_vehicles).toBe(2);
    expect(r.overview.vehicles_roadworthy).toBe(1);
  });

  it("counts vehicle checks today", () => {
    const v = makeVehicle();
    const vc1 = makeVehicleCheck(v.id, { check_date: TODAY });
    const vc2 = makeVehicleCheck(v.id, { check_date: "2026-05-20" });
    const r = run({ vehicles: [v], vehicle_checks: [vc1, vc2] });
    expect(r.overview.vehicle_checks_today).toBe(1);
  });

  it("counts vehicle issues (fail or advisory)", () => {
    const v1 = makeVehicle();
    const v2 = makeVehicle();
    const vc1 = makeVehicleCheck(v1.id, { overall_result: "advisory" });
    const vc2 = makeVehicleCheck(v2.id, { overall_result: "fail" });
    const r = run({ vehicles: [v1, v2], vehicle_checks: [vc1, vc2] });
    expect(r.overview.vehicle_issues).toBe(2);
  });
});

// ── Building Profiles ─────────────────────────────────────────────────────

describe("building profiles", () => {
  it("calculates check counts per building", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { status: "completed", result: "pass" });
    const c2 = makeBuildingCheck(b.id, { status: "overdue" });
    const c3 = makeBuildingCheck(b.id, { status: "completed", result: "fail" });
    const r = run({ buildings: [b], building_checks: [c1, c2, c3] });
    const bp = r.building_profiles[0];
    expect(bp.checks_total).toBe(3);
    expect(bp.checks_completed).toBe(2);
    expect(bp.checks_overdue).toBe(1);
    expect(bp.checks_failed).toBe(1);
  });

  it("calculates certification days until expiry", () => {
    const b = makeBuilding({
      gas_cert_expiry: "2026-07-01",
      electrical_cert_expiry: "2026-08-25",
    });
    const r = run({ buildings: [b] });
    const bp = r.building_profiles[0];
    expect(bp.gas_cert_days_until_expiry).toBe(37);
    expect(bp.electrical_cert_days_until_expiry).toBe(92);
  });

  it("calculates fire risk assessment age in days", () => {
    const b = makeBuilding({ fire_risk_assessment_date: "2026-01-01" });
    const r = run({ buildings: [b] });
    expect(r.building_profiles[0].fire_risk_assessment_age_days).toBe(144);
  });

  it("returns null days for missing values", () => {
    const b = makeBuilding({
      gas_cert_expiry: null,
      electrical_cert_expiry: null,
      fire_risk_assessment_date: null,
      next_inspection_due: null,
    });
    const r = run({ buildings: [b] });
    const bp = r.building_profiles[0];
    expect(bp.gas_cert_days_until_expiry).toBeNull();
    expect(bp.electrical_cert_days_until_expiry).toBeNull();
    expect(bp.fire_risk_assessment_age_days).toBeNull();
    expect(bp.next_inspection_days).toBeNull();
  });

  it("flags expired gas certificate", () => {
    const b = makeBuilding({ gas_cert_expiry: "2026-01-01" });
    const r = run({ buildings: [b] });
    expect(r.building_profiles[0].risk_flags).toContain("Gas certificate expired");
  });

  it("flags missing gas cert on operational building", () => {
    const b = makeBuilding({ gas_cert_expiry: null });
    const r = run({ buildings: [b] });
    expect(r.building_profiles[0].risk_flags).toContain("No gas certificate");
  });

  it("flags fire risk assessment overdue (>12 months)", () => {
    const b = makeBuilding({ fire_risk_assessment_date: "2024-12-01" });
    const r = run({ buildings: [b] });
    expect(r.building_profiles[0].risk_flags).toContain("Fire risk assessment overdue (>12 months)");
  });

  it("flags overdue and failed checks", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { status: "overdue" });
    const c2 = makeBuildingCheck(b.id, { status: "overdue" });
    const c3 = makeBuildingCheck(b.id, { status: "completed", result: "fail" });
    const r = run({ buildings: [b], building_checks: [c1, c2, c3] });
    expect(r.building_profiles[0].risk_flags).toContain("2 overdue check(s)");
    expect(r.building_profiles[0].risk_flags).toContain("1 failed check(s)");
  });

  it("flags full inspection overdue", () => {
    const b = makeBuilding({ next_inspection_due: "2026-03-01" }); // past
    const r = run({ buildings: [b] });
    expect(r.building_profiles[0].risk_flags).toContain("Full inspection overdue");
  });
});

// ── Check Type Analysis ───────────────────────────────────────────────────

describe("check type analysis", () => {
  it("groups checks by type and calculates pass rate", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { check_type: "fire_alarm_test", status: "completed", result: "pass" });
    const c2 = makeBuildingCheck(b.id, { check_type: "fire_alarm_test", status: "completed", result: "fail" });
    const c3 = makeBuildingCheck(b.id, { check_type: "daily_walkround", status: "completed", result: "pass" });
    const r = run({ buildings: [b], building_checks: [c1, c2, c3] });
    const fire = r.check_analysis.find((ca) => ca.check_type === "fire_alarm_test")!;
    expect(fire.total).toBe(2);
    expect(fire.completed).toBe(2);
    expect(fire.pass_rate).toBe(50);
    const walk = r.check_analysis.find((ca) => ca.check_type === "daily_walkround")!;
    expect(walk.pass_rate).toBe(100);
  });

  it("sorts by worst pass rate first", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { check_type: "alpha", status: "completed", result: "pass" });
    const c2 = makeBuildingCheck(b.id, { check_type: "beta", status: "completed", result: "fail" });
    const r = run({ buildings: [b], building_checks: [c1, c2] });
    expect(r.check_analysis[0].check_type).toBe("beta");
  });

  it("counts overdue per type", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { check_type: "emergency_lighting", status: "overdue" });
    const r = run({ buildings: [b], building_checks: [c1] });
    const el = r.check_analysis.find((ca) => ca.check_type === "emergency_lighting")!;
    expect(el.overdue).toBe(1);
  });
});

// ── Maintenance Analysis ──────────────────────────────────────────────────

describe("maintenance analysis", () => {
  it("groups maintenance by category", () => {
    const m1 = makeMaintenance({ category: "fire_safety", status: "completed" });
    const m2 = makeMaintenance({ category: "fire_safety", status: "open", priority: "urgent" });
    const m3 = makeMaintenance({ category: "plumbing", status: "open" });
    const r = run({ maintenance: [m1, m2, m3] });
    expect(r.maintenance_analysis).toHaveLength(2);
    const fire = r.maintenance_analysis.find((ma) => ma.category === "fire_safety")!;
    expect(fire.total).toBe(2);
    expect(fire.open).toBe(1);
    expect(fire.completed).toBe(1);
    expect(fire.urgent_count).toBe(1);
  });

  it("counts overdue maintenance per category", () => {
    const m1 = makeMaintenance({ category: "security", status: "open", due_date: "2026-05-20" }); // past
    const m2 = makeMaintenance({ category: "security", status: "open", due_date: "2026-06-20" }); // future
    const r = run({ maintenance: [m1, m2] });
    const sec = r.maintenance_analysis.find((ma) => ma.category === "security")!;
    expect(sec.overdue_count).toBe(1);
  });

  it("sorts categories by urgent count then overdue count", () => {
    const m1 = makeMaintenance({ category: "alpha", priority: "low", status: "open" });
    const m2 = makeMaintenance({ category: "beta", priority: "urgent", status: "open" });
    const r = run({ maintenance: [m1, m2] });
    expect(r.maintenance_analysis[0].category).toBe("beta");
  });
});

// ── Vehicle Profiles ──────────────────────────────────────────────────────

describe("vehicle profiles", () => {
  it("calculates days until document expiry", () => {
    const v = makeVehicle({
      mot_expiry: "2026-08-25", // 92 days from TODAY
      insurance_expiry: "2026-07-01", // 37 days
      tax_expiry: "2026-06-24", // 30 days
    });
    const r = run({ vehicles: [v] });
    const vp = r.vehicle_profiles[0];
    expect(vp.mot_days_until_expiry).toBe(92);
    expect(vp.insurance_days_until_expiry).toBe(37);
    expect(vp.tax_days_until_expiry).toBe(30);
  });

  it("flags expired MOT", () => {
    const v = makeVehicle({ mot_expiry: "2026-04-01" });
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("MOT expired");
  });

  it("flags MOT expiring soon (<=30 days)", () => {
    const v = makeVehicle({ mot_expiry: "2026-06-20" }); // 26 days
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("MOT expiring soon");
  });

  it("does NOT flag MOT when more than 30 days", () => {
    const v = makeVehicle({ mot_expiry: "2026-07-01" }); // 37 days
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].risk_flags).not.toContain("MOT expiring soon");
    expect(r.vehicle_profiles[0].risk_flags).not.toContain("MOT expired");
  });

  it("flags expired insurance", () => {
    const v = makeVehicle({ insurance_expiry: "2026-03-01" });
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("Insurance expired");
  });

  it("flags expired tax", () => {
    const v = makeVehicle({ tax_expiry: "2026-01-01" });
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("Tax expired");
  });

  it("flags service overdue", () => {
    const v = makeVehicle({ next_service_due: "2026-04-01" });
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("Service overdue");
  });

  it("flags last check failed", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "fail" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("Last check failed");
  });

  it("flags advisory on last check", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "advisory" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    expect(r.vehicle_profiles[0].risk_flags).toContain("Advisory on last check");
  });

  it("picks the latest check by date", () => {
    const v = makeVehicle();
    const vc1 = makeVehicleCheck(v.id, { check_date: "2026-05-20", overall_result: "fail" });
    const vc2 = makeVehicleCheck(v.id, { check_date: "2026-05-24", overall_result: "pass" });
    const r = run({ vehicles: [v], vehicle_checks: [vc1, vc2] });
    expect(r.vehicle_profiles[0].latest_check_result).toBe("pass");
    expect(r.vehicle_profiles[0].latest_check_date).toBe("2026-05-24");
  });

  it("not roadworthy when latest check fails", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "fail" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    expect(r.overview.vehicles_roadworthy).toBe(0);
  });

  it("not roadworthy when disposed", () => {
    const v = makeVehicle({ status: "disposed" });
    const vc = makeVehicleCheck(v.id);
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    expect(r.overview.vehicles_roadworthy).toBe(0);
  });

  it("roadworthy when docs valid and check passes", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "pass" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    expect(r.overview.vehicles_roadworthy).toBe(1);
  });

  it("sets label as make + model", () => {
    const v = makeVehicle({ make: "Ford", model: "Transit Custom" });
    const r = run({ vehicles: [v] });
    expect(r.vehicle_profiles[0].label).toBe("Ford Transit Custom");
  });
});

// ── Alerts ────────────────────────────────────────────────────────────────

describe("alerts", () => {
  it("critical: expired certifications", () => {
    const b = makeBuilding({ gas_cert_expiry: "2026-01-01" });
    const r = run({ buildings: [b] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("expired"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Reg 25");
  });

  it("critical: fire safety non-compliance", () => {
    const b = makeBuilding({ fire_risk_assessment_date: null });
    const r = run({ buildings: [b] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("Fire safety"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Fire Safety");
  });

  it("critical: failed checks with high risk", () => {
    const b = makeBuilding();
    const c = makeBuildingCheck(b.id, { status: "completed", result: "fail", risk_level: "high" });
    const r = run({ buildings: [b], building_checks: [c] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("failed with high/critical"));
    expect(alert).toBeDefined();
  });

  it("no critical failure alert for low-risk fails", () => {
    const b = makeBuilding();
    const c = makeBuildingCheck(b.id, { status: "completed", result: "fail", risk_level: "low" });
    const r = run({ buildings: [b], building_checks: [c] });
    const alert = r.alerts.find((a) => a.severity === "critical" && a.message.includes("failed with high/critical"));
    expect(alert).toBeUndefined();
  });

  it("high: overdue building checks", () => {
    const b = makeBuilding();
    const c = makeBuildingCheck(b.id, { status: "overdue", check_type: "emergency_lighting" });
    const r = run({ buildings: [b], building_checks: [c] });
    const alert = r.alerts.find((a) => a.severity === "high" && a.message.includes("overdue"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("emergency lighting");
  });

  it("high: expired vehicle documents", () => {
    const v = makeVehicle({ mot_expiry: "2026-01-01", registration: "XX99 YYY" });
    const r = run({ vehicles: [v] });
    const alert = r.alerts.find((a) => a.severity === "high" && a.message.includes("expired documentation"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("XX99 YYY");
  });

  it("medium: urgent open maintenance", () => {
    const m = makeMaintenance({ priority: "urgent", status: "open", title: "Gate lock faulty" });
    const r = run({ maintenance: [m] });
    const alert = r.alerts.find((a) => a.severity === "medium" && a.message.includes("urgent maintenance"));
    expect(alert).toBeDefined();
    expect(alert!.message).toContain("Gate lock faulty");
  });

  it("medium: certifications expiring soon", () => {
    const b = makeBuilding({ gas_cert_expiry: "2026-07-01" }); // 37 days
    const r = run({ buildings: [b] });
    const alert = r.alerts.find((a) => a.severity === "medium" && a.message.includes("expiring within 90"));
    expect(alert).toBeDefined();
  });

  it("medium: vehicle advisories", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "advisory" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    const alert = r.alerts.find((a) => a.severity === "medium" && a.message.includes("advisory"));
    expect(alert).toBeDefined();
  });

  it("low: overdue non-urgent maintenance", () => {
    const m = makeMaintenance({ priority: "low", status: "open", due_date: "2026-05-01" }); // overdue
    const r = run({ maintenance: [m] });
    const alert = r.alerts.find((a) => a.severity === "low" && a.message.includes("non-urgent maintenance"));
    expect(alert).toBeDefined();
  });

  it("no low maintenance alert when urgent items exist", () => {
    const m1 = makeMaintenance({ priority: "urgent", status: "open", due_date: "2026-05-20" });
    const m2 = makeMaintenance({ priority: "low", status: "open", due_date: "2026-05-01" });
    const r = run({ maintenance: [m1, m2] });
    const low = r.alerts.find((a) => a.severity === "low" && a.message.includes("non-urgent maintenance"));
    expect(low).toBeUndefined();
  });
});

// ── ARIA Insights ─────────────────────────────────────────────────────────

describe("ARIA insights", () => {
  it("critical: expired certifications", () => {
    const b = makeBuilding({ gas_cert_expiry: "2026-01-01" });
    const r = run({ buildings: [b] });
    const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("expired certification"));
    expect(insight).toBeDefined();
  });

  it("critical: fire safety non-compliance", () => {
    const b = makeBuilding({ fire_risk_assessment_date: null });
    const r = run({ buildings: [b] });
    const insight = r.insights.find((i) => i.severity === "critical" && i.text.includes("fire safety"));
    expect(insight).toBeDefined();
    expect(insight!.text).toContain("SCCIF");
  });

  it("warning: low check completion rate", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { status: "completed" });
    const c2 = makeBuildingCheck(b.id, { status: "due" });
    const c3 = makeBuildingCheck(b.id, { status: "due" });
    const c4 = makeBuildingCheck(b.id, { status: "due" });
    const r = run({ buildings: [b], building_checks: [c1, c2, c3, c4] });
    // 1/4 = 25%
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("25%"));
    expect(insight).toBeDefined();
  });

  it("warning: failed checks", () => {
    const b = makeBuilding();
    const c = makeBuildingCheck(b.id, { status: "completed", result: "fail" });
    const r = run({ buildings: [b], building_checks: [c] });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("fail"));
    expect(insight).toBeDefined();
  });

  it("warning: vehicle fleet issues", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "advisory" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    const insight = r.insights.find((i) => i.severity === "warning" && i.text.includes("vehicles have issues"));
    expect(insight).toBeDefined();
  });

  it("positive: 100% check completion", () => {
    const b = makeBuilding();
    const c1 = makeBuildingCheck(b.id, { status: "completed" });
    const c2 = makeBuildingCheck(b.id, { status: "completed" });
    const r = run({ buildings: [b], building_checks: [c1, c2] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("All 2 building checks"));
    expect(insight).toBeDefined();
  });

  it("positive: fire safety compliant", () => {
    const b = makeBuilding(); // defaults have valid certs
    const r = run({ buildings: [b] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("Fire safety compliance confirmed"));
    expect(insight).toBeDefined();
  });

  it("positive: all vehicles roadworthy", () => {
    const v = makeVehicle();
    const vc = makeVehicleCheck(v.id, { overall_result: "pass" });
    const r = run({ vehicles: [v], vehicle_checks: [vc] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("roadworthy"));
    expect(insight).toBeDefined();
  });

  it("positive: no overdue maintenance", () => {
    const m = makeMaintenance({ status: "completed" });
    const r = run({ maintenance: [m] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("No overdue maintenance"));
    expect(insight).toBeDefined();
  });

  it("positive: all certifications current", () => {
    const b = makeBuilding(); // defaults are valid and well in future
    const r = run({ buildings: [b] });
    const insight = r.insights.find((i) => i.severity === "positive" && i.text.includes("certifications are current"));
    expect(insight).toBeDefined();
  });
});

// ── Chamberlain House Integration ────────────────────────────────────────────────

describe("Chamberlain House integration scenario", () => {
  it("processes a realistic Chamberlain House premises dataset correctly", () => {
    const oakHouse: BuildingInput = {
      id: "bld_001",
      name: "Chamberlain House — Main Building",
      type: "residential",
      status: "operational",
      gas_cert_expiry: "2026-12-01",
      electrical_cert_expiry: "2027-03-01",
      fire_risk_assessment_date: "2026-01-15", // ~130 days ago, within 365
      epc_rating: "C",
      last_full_inspection: "2026-01-15",
      next_inspection_due: "2027-01-15",
    };

    const buildingChecks: BuildingCheckInput[] = [
      makeBuildingCheck("bld_001", { check_type: "daily_walkround", status: "due", result: null, risk_level: null }),
      makeBuildingCheck("bld_001", { check_type: "medication_room_security", status: "completed", result: "pass", risk_level: "low" }),
      makeBuildingCheck("bld_001", { check_type: "food_hygiene", status: "completed", result: "pass", risk_level: "low" }),
      makeBuildingCheck("bld_001", { check_type: "fire_alarm_test", status: "completed", result: "pass", risk_level: "low", check_date: "2026-04-14" }),
      makeBuildingCheck("bld_001", { check_type: "external_security", status: "completed", result: "fail", risk_level: "medium", action_required: "Replace rear gate latch" }),
      makeBuildingCheck("bld_001", { check_type: "emergency_lighting", status: "overdue", result: null, risk_level: "high", action_required: "Emergency lighting test overdue" }),
    ];

    const maintenanceItems: MaintenanceInput[] = [
      makeMaintenance({ title: "Boiler annual service", category: "hvac", priority: "high", status: "scheduled", due_date: "2026-06-08" }),
      makeMaintenance({ title: "Fire alarm weekly test", category: "fire_safety", priority: "urgent", status: "completed", due_date: "2026-05-24" }),
      makeMaintenance({ title: "Bathroom tap dripping", category: "plumbing", priority: "medium", status: "open", due_date: "2026-05-28" }),
      makeMaintenance({ title: "External gate lock faulty", category: "security", priority: "urgent", status: "open", due_date: "2026-05-26" }),
      makeMaintenance({ title: "PAT testing", category: "electrical", priority: "medium", status: "open", due_date: "2026-06-24" }),
      makeMaintenance({ title: "Deep clean — kitchen", category: "cleaning", priority: "low", status: "completed", due_date: "2026-05-18" }),
    ];

    const vehicleList: VehicleInput[] = [
      {
        id: "veh_001", registration: "AB21 CDE", make: "Ford", model: "Transit Custom",
        status: "available", mot_expiry: "2026-08-15", insurance_expiry: "2026-09-01",
        tax_expiry: "2026-07-01", next_service_due: "2026-10-20", mileage: 34800,
      },
      {
        id: "veh_002", registration: "FG23 HIJ", make: "Vauxhall", model: "Vivaro",
        status: "available", mot_expiry: "2026-05-10", insurance_expiry: "2026-09-01",
        tax_expiry: "2026-08-01", next_service_due: "2026-08-10", mileage: 18200,
      },
    ];

    const vehicleCheckList: VehicleCheckInput[] = [
      makeVehicleCheck("veh_001", { check_date: TODAY, overall_result: "pass" }),
      makeVehicleCheck("veh_002", { check_date: "2026-04-15", overall_result: "advisory", defects: "Nearside front tyre borderline" }),
    ];

    const r = run({
      buildings: [oakHouse],
      building_checks: buildingChecks,
      maintenance: maintenanceItems,
      vehicles: vehicleList,
      vehicle_checks: vehicleCheckList,
    });

    // ── Overview ──────────────────────────────────────────────────────
    expect(r.overview.total_buildings).toBe(1);
    expect(r.overview.operational_buildings).toBe(1);
    expect(r.overview.total_checks).toBe(6);
    expect(r.overview.checks_completed).toBe(4);
    expect(r.overview.checks_overdue).toBe(1);
    expect(r.overview.checks_failed).toBe(1);
    expect(r.overview.fire_safety_compliant).toBe(true);
    expect(r.overview.total_vehicles).toBe(2);
    expect(r.overview.vehicle_checks_today).toBe(1);

    // Veh_002 MOT expired (2026-05-10 < 2026-05-25) — not roadworthy
    // Veh_001 is fine → 1 roadworthy
    expect(r.overview.vehicles_roadworthy).toBe(1);
    expect(r.overview.vehicle_issues).toBe(1); // veh_002 advisory

    // Maintenance
    expect(r.overview.maintenance_open).toBe(3); // bathroom, gate, PAT
    expect(r.overview.maintenance_urgent).toBe(1); // gate lock (fire alarm is completed)

    // ── Building profile ──────────────────────────────────────────────
    const bp = r.building_profiles[0];
    expect(bp.building_name).toBe("Chamberlain House — Main Building");
    expect(bp.checks_overdue).toBe(1);
    expect(bp.checks_failed).toBe(1);
    expect(bp.risk_flags).toContain("1 overdue check(s)");
    expect(bp.risk_flags).toContain("1 failed check(s)");

    // Gas cert: 2026-12-01 is 190 days from TODAY — within 90 is false
    expect(bp.gas_cert_days_until_expiry).toBe(190);

    // ── Vehicle profiles ──────────────────────────────────────────────
    const veh002 = r.vehicle_profiles.find((vp) => vp.vehicle_id === "veh_002")!;
    expect(veh002.risk_flags).toContain("MOT expired");
    expect(veh002.latest_check_result).toBe("advisory");

    const veh001 = r.vehicle_profiles.find((vp) => vp.vehicle_id === "veh_001")!;
    expect(veh001.risk_flags).toHaveLength(0);

    // ── Alerts ────────────────────────────────────────────────────────
    // High: overdue emergency lighting
    expect(r.alerts.some((a) => a.severity === "high" && a.message.includes("overdue"))).toBe(true);

    // High: veh_002 expired MOT
    expect(r.alerts.some((a) => a.severity === "high" && a.message.includes("FG23 HIJ"))).toBe(true);

    // Medium: urgent gate lock maintenance
    expect(r.alerts.some((a) => a.severity === "medium" && a.message.includes("gate lock"))).toBe(true);

    // ── ARIA Insights ─────────────────────────────────────────────────
    // Fire safety compliant → positive
    expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Fire safety compliance confirmed"))).toBe(true);

    // Failed check → warning
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("fail"))).toBe(true);

    // Vehicle issues → warning
    expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("vehicles have issues"))).toBe(true);
  });
});
