import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateSelfHarmPreventionPlan,
} from "./self-harm-prevention-planning-service";
import type { SelfHarmPreventionPlanRow } from "./self-harm-prevention-planning-service";

// -- Factory Function ---------------------------------------------------------

function makeRow(overrides: Partial<SelfHarmPreventionPlanRow> = {}): SelfHarmPreventionPlanRow {
  return {
    id: "shpp-1",
    home_id: "home-1",
    child_name: "Alex",
    plan_date: "2026-04-01",
    lead_professional: "Dr Jones",
    review_date: "2026-06-01",
    triggers_identified: "Family contact, peer conflict",
    warning_signs: "Withdrawal, not eating",
    coping_strategies: "Art, music, walks",
    safe_environment_actions: "Sharps locked, bathroom checks",
    professional_support: "CAMHS weekly",
    emergency_contacts: "CAMHS crisis: 0800 123456",
    young_person_contributed: true,
    risk_level: "Medium",
    last_incident_date: "2026-03-15",
    frequency_category: "Occasional",
    method_awareness: true,
    night_supervision_level: "Standard",
    sharps_management: "Locked Storage",
    medication_management: "Supervised",
    camhs_engaged: true,
    school_aware: true,
    social_worker_informed: true,
    plan_shared_with_child: true,
    status: "Active",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_plans).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.critical_count).toBe(0);
    expect(m.camhs_engagement_rate).toBeNull();;
    expect(m.child_contribution_rate).toBeNull();;
    expect(m.overdue_review_count).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.enhanced_supervision_count).toBe(0);
    expect(m.restricted_sharps_count).toBe(0);
  });

  it("counts status categories correctly", () => {
    const rows = [
      makeRow({ id: "r1", status: "Active" }),
      makeRow({ id: "r2", status: "Active" }),
      makeRow({ id: "r3", status: "Under Review" }),
      makeRow({ id: "r4", status: "Archived" }),
    ];
    const m = computeMetrics(rows);
    expect(m.active_count).toBe(2);
    expect(m.under_review_count).toBe(1);
    expect(m.archived_count).toBe(1);
  });

  it("counts risk levels correctly", () => {
    const rows = [
      makeRow({ id: "r1", risk_level: "High" }),
      makeRow({ id: "r2", risk_level: "Critical" }),
      makeRow({ id: "r3", risk_level: "Low" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_count).toBe(1);
    expect(m.critical_count).toBe(1);
    expect(m.by_risk_level["High"]).toBe(1);
    expect(m.by_risk_level["Critical"]).toBe(1);
    expect(m.by_risk_level["Low"]).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "r1", camhs_engaged: true, young_person_contributed: true }),
      makeRow({ id: "r2", camhs_engaged: false, young_person_contributed: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.camhs_engagement_rate).toBe(50);
    expect(m.child_contribution_rate).toBe(50);
  });

  it("counts overdue reviews for active plans only", () => {
    const rows = [
      makeRow({ id: "r1", status: "Active", review_date: "2020-01-01" }), // overdue
      makeRow({ id: "r2", status: "Archived", review_date: "2020-01-01" }), // archived, not counted
      makeRow({ id: "r3", status: "Active", review_date: "2030-01-01" }), // future
    ];
    const m = computeMetrics(rows);
    expect(m.overdue_review_count).toBe(1);
  });

  it("counts enhanced supervision (Enhanced, 1-to-1, Waking Night)", () => {
    const rows = [
      makeRow({ id: "r1", night_supervision_level: "Enhanced" }),
      makeRow({ id: "r2", night_supervision_level: "1-to-1" }),
      makeRow({ id: "r3", night_supervision_level: "Waking Night" }),
      makeRow({ id: "r4", night_supervision_level: "Standard" }),
    ];
    const m = computeMetrics(rows);
    expect(m.enhanced_supervision_count).toBe(3);
  });

  it("counts restricted sharps (Locked Storage, Supervised Access, Full Restriction)", () => {
    const rows = [
      makeRow({ id: "r1", sharps_management: "Locked Storage" }),
      makeRow({ id: "r2", sharps_management: "Supervised Access" }),
      makeRow({ id: "r3", sharps_management: "Full Restriction" }),
      makeRow({ id: "r4", sharps_management: "Not Required" }),
    ];
    const m = computeMetrics(rows);
    expect(m.restricted_sharps_count).toBe(3);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty array for empty rows", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("flags critical risk without CAMHS as critical", () => {
    const rows = [makeRow({ risk_level: "Critical", camhs_engaged: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const noCamhs = alerts.filter((a) => a.type === "critical_no_camhs");
    expect(noCamhs).toHaveLength(1);
    expect(noCamhs[0].severity).toBe("critical");
  });

  it("flags daily frequency with standard supervision as critical", () => {
    const rows = [makeRow({ frequency_category: "Daily", night_supervision_level: "Standard", status: "Active" })];
    const alerts = computeAlerts(rows);
    const daily = alerts.filter((a) => a.type === "daily_standard_supervision");
    expect(daily).toHaveLength(1);
    expect(daily[0].severity).toBe("critical");
  });

  it("flags critical risk with self-administered medication as critical", () => {
    const rows = [makeRow({ risk_level: "Critical", medication_management: "Self-Administered", status: "Active" })];
    const alerts = computeAlerts(rows);
    const meds = alerts.filter((a) => a.type === "critical_self_administered_meds");
    expect(meds).toHaveLength(1);
    expect(meds[0].severity).toBe("critical");
  });

  it("flags high/critical risk without SW informed as high", () => {
    const rows = [makeRow({ risk_level: "High", social_worker_informed: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const sw = alerts.filter((a) => a.type === "high_risk_sw_not_informed");
    expect(sw).toHaveLength(1);
    expect(sw[0].severity).toBe("high");
  });

  it("flags plan not shared when child contributed as high", () => {
    const rows = [makeRow({ young_person_contributed: true, plan_shared_with_child: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const notShared = alerts.filter((a) => a.type === "plan_not_shared");
    expect(notShared).toHaveLength(1);
    expect(notShared[0].severity).toBe("high");
  });

  it("flags high/critical risk with no sharps management as high", () => {
    const rows = [makeRow({ risk_level: "High", sharps_management: "Not Required", status: "Active" })];
    const alerts = computeAlerts(rows);
    const noSharps = alerts.filter((a) => a.type === "high_risk_no_sharps_management");
    expect(noSharps).toHaveLength(1);
    expect(noSharps[0].severity).toBe("high");
  });

  it("flags overdue review as medium", () => {
    const rows = [makeRow({ status: "Active", review_date: "2020-01-01" })];
    const alerts = computeAlerts(rows);
    const overdue = alerts.filter((a) => a.type === "overdue_review");
    expect(overdue).toHaveLength(1);
    expect(overdue[0].severity).toBe("medium");
  });

  it("flags young person not contributing as medium", () => {
    const rows = [makeRow({ young_person_contributed: false, status: "Active" })];
    const alerts = computeAlerts(rows);
    const noYP = alerts.filter((a) => a.type === "no_yp_contribution");
    expect(noYP).toHaveLength(1);
    expect(noYP[0].severity).toBe("medium");
  });

  it("only checks active plans for alerts", () => {
    const rows = [makeRow({ risk_level: "Critical", camhs_engaged: false, status: "Archived" })];
    const alerts = computeAlerts(rows);
    const noCamhs = alerts.filter((a) => a.type === "critical_no_camhs");
    expect(noCamhs).toHaveLength(0);
  });
});

// -- validateSelfHarmPreventionPlan -------------------------------------------

describe("validateSelfHarmPreventionPlan", () => {
  it("passes with valid complete input", () => {
    const r = validateSelfHarmPreventionPlan({
      childName: "Alex",
      planDate: "2026-04-01",
      leadProfessional: "Dr Jones",
      triggersIdentified: "Family contact",
      warningSigns: "Withdrawal",
      copingStrategies: "Art, music",
      safeEnvironmentActions: "Sharps locked",
      professionalSupport: "CAMHS",
      emergencyContacts: "Crisis line",
      riskLevel: "Medium",
      frequencyCategory: "Occasional",
      nightSupervisionLevel: "Standard",
      sharpsManagement: "Locked Storage",
      medicationManagement: "Supervised",
    });
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("fails when required fields are missing", () => {
    const r = validateSelfHarmPreventionPlan({});
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Child name"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Plan date"))).toBe(true);
    expect(r.errors.some((e) => e.includes("Lead professional"))).toBe(true);
  });

  it("rejects review date before plan date", () => {
    const r = validateSelfHarmPreventionPlan({
      childName: "Alex",
      planDate: "2026-04-01",
      leadProfessional: "Dr Jones",
      reviewDate: "2026-03-01",
      triggersIdentified: "x",
      warningSigns: "x",
      copingStrategies: "x",
      safeEnvironmentActions: "x",
      professionalSupport: "x",
      emergencyContacts: "x",
      riskLevel: "Medium",
      frequencyCategory: "Occasional",
      nightSupervisionLevel: "Standard",
      sharpsManagement: "Locked Storage",
      medicationManagement: "Supervised",
    });
    expect(r.errors.some((e) => e.includes("Review date must be after plan date"))).toBe(true);
  });

  it("warns on high/critical review date beyond 4 weeks", () => {
    const r = validateSelfHarmPreventionPlan({
      childName: "Alex",
      planDate: "2026-04-01",
      leadProfessional: "Dr Jones",
      reviewDate: "2026-06-01", // ~60 days
      triggersIdentified: "x",
      warningSigns: "x",
      copingStrategies: "x",
      safeEnvironmentActions: "x",
      professionalSupport: "x",
      emergencyContacts: "x",
      riskLevel: "Critical",
      frequencyCategory: "Daily",
      nightSupervisionLevel: "Waking Night",
      sharpsManagement: "Full Restriction",
      medicationManagement: "Controlled",
    });
    expect(r.errors.some((e) => e.includes("4 weeks"))).toBe(true);
  });
});
