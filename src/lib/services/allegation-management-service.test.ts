import { describe, it, expect } from "vitest";
import { computeAllegationMetrics, identifyAllegationAlerts } from "./allegation-management-service";
import type { AllegationRecord } from "./allegation-management-service";

function makeRecord(overrides: Partial<AllegationRecord> = {}): AllegationRecord {
  return {
    id: "rec-1", home_id: "home-1", allegation_date: "2026-05-10",
    allegation_type: "inappropriate_behaviour", allegation_source: "child",
    investigation_stage: "investigation_ongoing", allegation_outcome: "pending",
    subject_name: "John Doe", subject_role: "Residential Worker",
    child_involved: "child-1", lado_referral_made: true,
    lado_referral_date: "2026-05-10", lado_response_within_1_day: true,
    police_informed: false, ofsted_notified: true,
    dbs_referral_made: false, subject_suspended: false,
    risk_assessment_completed: true, child_safe_and_supported: true,
    support_for_subject: true, investigation_officer: "Officer Smith",
    days_to_resolution: null, learning_identified: false,
    learning_details: null, notes: null,
    created_at: "2026-05-10T00:00:00Z", updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

describe("computeAllegationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeAllegationMetrics([]);
    expect(result.total_allegations).toBe(0);
    expect(result.open_allegations).toBe(0);
    expect(result.substantiated_count).toBe(0);
    expect(result.lado_referral_rate).toBeNull();;
    expect(result.average_days_to_resolution).toBeNull();;
  });

  it("counts total and open allegations", () => {
    const records = [
      makeRecord({ id: "r1", investigation_stage: "investigation_ongoing" }),
      makeRecord({ id: "r2", investigation_stage: "closed" }),
      makeRecord({ id: "r3", investigation_stage: "withdrawn" }),
      makeRecord({ id: "r4", investigation_stage: "received" }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.total_allegations).toBe(4);
    expect(result.open_allegations).toBe(2); // ongoing + received
  });

  it("counts substantiated and unsubstantiated", () => {
    const records = [
      makeRecord({ id: "r1", allegation_outcome: "substantiated" }),
      makeRecord({ id: "r2", allegation_outcome: "substantiated" }),
      makeRecord({ id: "r3", allegation_outcome: "unsubstantiated" }),
      makeRecord({ id: "r4", allegation_outcome: "pending" }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.substantiated_count).toBe(2);
    expect(result.unsubstantiated_count).toBe(1);
  });

  it("computes LADO referral rate", () => {
    const records = [
      makeRecord({ id: "r1", lado_referral_made: true }),
      makeRecord({ id: "r2", lado_referral_made: false }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.lado_referral_rate).toBe(50);
  });

  it("computes LADO response within 1 day rate (excludes nulls)", () => {
    const records = [
      makeRecord({ id: "r1", lado_response_within_1_day: true }),
      makeRecord({ id: "r2", lado_response_within_1_day: false }),
      makeRecord({ id: "r3", lado_response_within_1_day: null }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.lado_response_within_1_day_rate).toBe(50); // 1/2 (null excluded)
  });

  it("computes average days to resolution", () => {
    const records = [
      makeRecord({ id: "r1", days_to_resolution: 10 }),
      makeRecord({ id: "r2", days_to_resolution: 20 }),
      makeRecord({ id: "r3", days_to_resolution: null }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.average_days_to_resolution).toBe(15);
  });

  it("counts DBS referrals and suspensions", () => {
    const records = [
      makeRecord({ id: "r1", dbs_referral_made: true, subject_suspended: true }),
      makeRecord({ id: "r2", dbs_referral_made: false, subject_suspended: false }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.dbs_referral_count).toBe(1);
    expect(result.suspension_count).toBe(1);
  });

  it("groups by type, source, stage, outcome", () => {
    const records = [
      makeRecord({ id: "r1", allegation_type: "physical_abuse", allegation_source: "child" }),
      makeRecord({ id: "r2", allegation_type: "neglect", allegation_source: "social_worker" }),
    ];
    const result = computeAllegationMetrics(records);
    expect(result.by_allegation_type["physical_abuse"]).toBe(1);
    expect(result.by_allegation_type["neglect"]).toBe(1);
    expect(result.by_allegation_source["child"]).toBe(1);
    expect(result.by_allegation_source["social_worker"]).toBe(1);
  });
});

describe("identifyAllegationAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = identifyAllegationAlerts([]);
    expect(result).toEqual([]);
  });

  it("flags active sexual abuse allegation as critical", () => {
    const records = [
      makeRecord({ id: "r1", allegation_type: "sexual_abuse", investigation_stage: "investigation_ongoing" }),
    ];
    const result = identifyAllegationAlerts(records);
    const alerts = result.filter((a) => a.type === "sexual_abuse_allegation");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags no LADO referral as critical", () => {
    const records = [
      makeRecord({ id: "r1", lado_referral_made: false, investigation_stage: "received" }),
    ];
    const result = identifyAllegationAlerts(records);
    const alerts = result.filter((a) => a.type === "no_lado_referral");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("flags child not safe and supported", () => {
    const records = [
      makeRecord({ id: "r1", child_safe_and_supported: false, child_involved: "child-1", investigation_stage: "investigation_ongoing" }),
    ];
    const result = identifyAllegationAlerts(records);
    const alerts = result.filter((a) => a.type === "child_not_safe");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags no risk assessment", () => {
    const records = [
      makeRecord({ id: "r1", risk_assessment_completed: false, investigation_stage: "received" }),
    ];
    const result = identifyAllegationAlerts(records);
    const alerts = result.filter((a) => a.type === "no_risk_assessment");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags Ofsted not notified", () => {
    const records = [
      makeRecord({ id: "r1", ofsted_notified: false, investigation_stage: "received" }),
    ];
    const result = identifyAllegationAlerts(records);
    const alerts = result.filter((a) => a.type === "ofsted_not_notified");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("does not flag closed/withdrawn allegations for child safety", () => {
    const records = [
      makeRecord({ id: "r1", child_safe_and_supported: false, child_involved: "child-1", investigation_stage: "closed" }),
    ];
    const result = identifyAllegationAlerts(records);
    const safeAlerts = result.filter((a) => a.type === "child_not_safe");
    expect(safeAlerts.length).toBe(0);
  });
});
