import { describe, it, expect } from "vitest";
import {
  computeHealthScreeningMetrics,
  identifyHealthScreeningAlerts,
  type HealthScreeningImmunisationRecord,
} from "./health-screening-immunisation-service";

function makeRecord(overrides: Partial<HealthScreeningImmunisationRecord> = {}): HealthScreeningImmunisationRecord {
  return {
    id: "scr-1",
    home_id: "home-1",
    screening_type: "immunisation",
    screening_outcome: "all_clear",
    immunisation_status: "fully_up_to_date",
    health_risk: "low",
    screening_date: "2026-05-21",
    child_name: "Alex",
    child_id: "child-1",
    conducted_by: "Nurse A",
    child_consented: true,
    age_appropriate_explanation: true,
    parent_informed: true,
    gp_notified: true,
    follow_up_arranged: true,
    referral_made: false,
    care_plan_reflects: true,
    social_worker_informed: true,
    school_aware: true,
    records_updated: true,
    confidentiality_maintained: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeHealthScreeningMetrics ───────────────────────────────────────

describe("computeHealthScreeningMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeHealthScreeningMetrics([]);
    expect(result.total_screenings).toBe(0);
    expect(result.treatment_required_count).toBe(0);
    expect(result.referral_needed_count).toBe(0);
    expect(result.behind_immunisation_count).toBe(0);
    expect(result.high_risk_count).toBe(0);
    expect(result.child_consented_rate).toBeNull();;
    expect(result.unique_children).toBe(0);
  });

  it("computes counts and rates correctly", () => {
    const records = [
      makeRecord({ id: "s1", screening_outcome: "treatment_required", immunisation_status: "significantly_behind", health_risk: "high", child_consented: true, gp_notified: true, child_name: "Alex" }),
      makeRecord({ id: "s2", screening_outcome: "referral_needed", immunisation_status: "fully_up_to_date", health_risk: "critical", child_consented: false, gp_notified: false, child_name: "Ben" }),
      makeRecord({ id: "s3", screening_outcome: "all_clear", immunisation_status: "fully_up_to_date", health_risk: "low", child_consented: true, gp_notified: true, child_name: "Alex" }),
    ];
    const result = computeHealthScreeningMetrics(records);

    expect(result.total_screenings).toBe(3);
    expect(result.treatment_required_count).toBe(1);
    expect(result.referral_needed_count).toBe(1);
    expect(result.behind_immunisation_count).toBe(1);
    // high + critical = 2
    expect(result.high_risk_count).toBe(2);
    // 2/3 consented = 66.7%
    expect(result.child_consented_rate).toBe(66.7);
    // 2/3 gp_notified = 66.7%
    expect(result.gp_notified_rate).toBe(66.7);
    expect(result.unique_children).toBe(2);
    expect(result.by_screening_outcome).toEqual({
      treatment_required: 1,
      referral_needed: 1,
      all_clear: 1,
    });
  });
});

// ── identifyHealthScreeningAlerts ───────────────────────────────────────

describe("identifyHealthScreeningAlerts", () => {
  it("returns empty alerts for empty data", () => {
    expect(identifyHealthScreeningAlerts([])).toEqual([]);
  });

  it("triggers high_risk_no_followup critical alert", () => {
    const records = [makeRecord({ health_risk: "high", follow_up_arranged: false })];
    const alerts = identifyHealthScreeningAlerts(records);
    const a = alerts.find((x) => x.type === "high_risk_no_followup");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers high_risk_no_followup for critical risk too", () => {
    const records = [makeRecord({ health_risk: "critical", follow_up_arranged: false })];
    const alerts = identifyHealthScreeningAlerts(records);
    const a = alerts.find((x) => x.type === "high_risk_no_followup");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers immunisation_behind high alert when >= 1 significantly behind", () => {
    const records = [makeRecord({ immunisation_status: "significantly_behind" })];
    const alerts = identifyHealthScreeningAlerts(records);
    const a = alerts.find((x) => x.type === "immunisation_behind");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers gp_not_notified high alert when >= 1", () => {
    const records = [makeRecord({ gp_notified: false })];
    const alerts = identifyHealthScreeningAlerts(records);
    const a = alerts.find((x) => x.type === "gp_not_notified");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers confidentiality_breach medium alert when >= 2", () => {
    const records = [
      makeRecord({ id: "s1", confidentiality_maintained: false }),
      makeRecord({ id: "s2", confidentiality_maintained: false }),
    ];
    const alerts = identifyHealthScreeningAlerts(records);
    const a = alerts.find((x) => x.type === "confidentiality_breach");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers records_not_updated medium alert when >= 2", () => {
    const records = [
      makeRecord({ id: "s1", records_updated: false }),
      makeRecord({ id: "s2", records_updated: false }),
    ];
    const alerts = identifyHealthScreeningAlerts(records);
    const a = alerts.find((x) => x.type === "records_not_updated");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger confidentiality_breach when only 1 record", () => {
    const records = [makeRecord({ confidentiality_maintained: false })];
    const alerts = identifyHealthScreeningAlerts(records);
    expect(alerts.find((x) => x.type === "confidentiality_breach")).toBeUndefined();
  });

  it("does NOT trigger high_risk_no_followup when follow-up is arranged", () => {
    const records = [makeRecord({ health_risk: "high", follow_up_arranged: true })];
    const alerts = identifyHealthScreeningAlerts(records);
    expect(alerts.find((x) => x.type === "high_risk_no_followup")).toBeUndefined();
  });
});
