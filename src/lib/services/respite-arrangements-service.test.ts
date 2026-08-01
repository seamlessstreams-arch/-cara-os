import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateRespiteArrangement,
  type RespiteArrangementRow,
} from "./respite-arrangements-service";

function makeRow(overrides: Partial<RespiteArrangementRow> = {}): RespiteArrangementRow {
  return {
    id: "row-1",
    home_id: "home-1",
    child_name: "Child A",
    break_date: "2025-04-01",
    return_date: "2025-04-03",
    arrangement_type: "Planned Respite",
    provider_name: "Provider A",
    provider_type: "Foster Carer",
    risk_assessment_completed: true,
    care_plan_shared: true,
    medication_plan_shared: true,
    dietary_needs_shared: true,
    emergency_contacts_provided: true,
    child_prepared: true,
    child_views_obtained: true,
    social_worker_approved: true,
    parental_consent: true,
    handover_completed: true,
    return_debrief: true,
    child_experience_rating: "Positive",
    concerns_raised: false,
    concern_details: null,
    next_break_date: "2025-05-01",
    notes: null,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-03T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty rows", () => {
    const m = computeMetrics([]);
    expect(m.total_arrangements).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.risk_assessment_rate).toBeNull();
    expect(m.positive_experience_rate).toBeNull();
    expect(m.planned_count).toBe(0);
    expect(m.emergency_count).toBe(0);
    expect(m.average_per_child).toBeNull();; expect(m.average_break_duration_days).toBeNull();; });

  it("counts arrangement and provider type breakdowns", () => {
    const rows = [
      makeRow({ arrangement_type: "Planned Respite" }),
      makeRow({ id: "r2", arrangement_type: "Emergency Respite" }),
      makeRow({ id: "r3", arrangement_type: "Specialist Break" }),
    ];
    const m = computeMetrics(rows);
    expect(m.planned_count).toBe(1);
    expect(m.emergency_count).toBe(1);
    expect(m.specialist_count).toBe(1);
    expect(m.by_arrangement_type["Planned Respite"]).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ risk_assessment_completed: true, care_plan_shared: true }),
      makeRow({ id: "r2", risk_assessment_completed: false, care_plan_shared: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.risk_assessment_rate).toBe(50);
    expect(m.care_plan_shared_rate).toBe(50);
  });

  it("calculates experience rates from rated rows only", () => {
    const rows = [
      makeRow({ child_experience_rating: "Very Positive" }),
      makeRow({ id: "r2", child_experience_rating: "Negative" }),
      makeRow({ id: "r3", child_experience_rating: null }),
    ];
    const m = computeMetrics(rows);
    expect(m.positive_experience_rate).toBe(50);
    expect(m.negative_experience_rate).toBe(50);
  });

  it("calculates average break duration in days", () => {
    const rows = [
      makeRow({ break_date: "2025-04-01", return_date: "2025-04-03" }), // 2 days
      makeRow({ id: "r2", break_date: "2025-04-01", return_date: "2025-04-05" }), // 4 days
    ];
    const m = computeMetrics(rows);
    expect(m.average_break_duration_days).toBe(3);
  });

  it("counts unique children case-insensitively", () => {
    const rows = [
      makeRow({ child_name: "Alice" }),
      makeRow({ id: "r2", child_name: "alice" }),
      makeRow({ id: "r3", child_name: "Bob" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
  });
});

describe("computeAlerts", () => {
  it("returns empty for no data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("critical alert when concerns raised", () => {
    const rows = [makeRow({ concerns_raised: true, concern_details: "Bruise noted" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "concerns_raised" && a.severity === "critical")).toBe(true);
  });

  it("critical alert for no risk assessment", () => {
    const rows = [makeRow({ risk_assessment_completed: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "no_risk_assessment" && a.severity === "critical")).toBe(true);
  });

  it("critical alert for care plan not shared", () => {
    const rows = [makeRow({ care_plan_shared: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "care_plan_not_shared" && a.severity === "critical")).toBe(true);
  });

  it("critical alert for social worker not approved", () => {
    const rows = [makeRow({ social_worker_approved: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "sw_not_approved" && a.severity === "critical")).toBe(true);
  });

  it("high alert for child not prepared for planned break", () => {
    const rows = [makeRow({ child_prepared: false, arrangement_type: "Planned Respite" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "child_not_prepared" && a.severity === "high")).toBe(true);
  });

  it("no child_not_prepared alert for emergency break", () => {
    const rows = [makeRow({ child_prepared: false, arrangement_type: "Emergency Respite" })];
    const alerts = computeAlerts(rows);
    expect(alerts.some((a) => a.type === "child_not_prepared")).toBe(false);
  });
});

describe("validateRespiteArrangement", () => {
  it("valid with all required fields", () => {
    const result = validateRespiteArrangement({
      childName: "Alice",
      breakDate: "2025-04-01",
      returnDate: "2025-04-03",
      arrangementType: "Planned Respite",
      providerName: "Provider A",
      providerType: "Foster Carer",
      riskAssessmentCompleted: true,
      carePlanShared: true,
      childViewsObtained: true,
      socialWorkerApproved: true,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("invalid when child name is missing", () => {
    const result = validateRespiteArrangement({ childName: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Child name"))).toBe(true);
  });

  it("invalid when return date before break date", () => {
    const result = validateRespiteArrangement({
      childName: "Alice",
      breakDate: "2025-04-05",
      returnDate: "2025-04-01",
      arrangementType: "Planned Respite",
      providerName: "Provider A",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Return date cannot be before break date"))).toBe(true);
  });

  it("invalid when risk assessment not completed", () => {
    const result = validateRespiteArrangement({
      childName: "Alice",
      breakDate: "2025-04-01",
      returnDate: "2025-04-03",
      arrangementType: "Planned Respite",
      providerName: "Provider A",
      riskAssessmentCompleted: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Risk assessment not completed"))).toBe(true);
  });

  it("invalid when concerns raised but no details", () => {
    const result = validateRespiteArrangement({
      childName: "Alice",
      breakDate: "2025-04-01",
      returnDate: "2025-04-03",
      arrangementType: "Planned Respite",
      providerName: "Provider A",
      concernsRaised: true,
      concernDetails: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Concerns raised during respite but no details"))).toBe(true);
  });

  it("invalid when external provider handover not completed", () => {
    const result = validateRespiteArrangement({
      childName: "Alice",
      breakDate: "2025-04-01",
      returnDate: "2025-04-03",
      arrangementType: "Planned Respite",
      providerName: "Provider A",
      providerType: "Foster Carer",
      handoverCompleted: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Handover not completed"))).toBe(true);
  });
});
