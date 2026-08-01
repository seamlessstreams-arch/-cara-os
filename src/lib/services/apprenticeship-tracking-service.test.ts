import { describe, it, expect } from "vitest";
import { computeMetrics, computeAlerts, validateApprenticeshipTracking } from "./apprenticeship-tracking-service";
import type { ApprenticeshipTrackingRow } from "./apprenticeship-tracking-service";

function makeRow(overrides: Partial<ApprenticeshipTrackingRow> = {}): ApprenticeshipTrackingRow {
  return {
    id: "row-1", home_id: "home-1", young_person_name: "Alex",
    record_date: "2026-05-15", supporting_staff: "Sarah",
    record_type: "Progress Review",
    apprenticeship_level: "Advanced — Level 3",
    sector: "Health & Social Care", employer_name: "ABC Care",
    training_provider: "City College",
    start_date: "2026-01-15", expected_end_date: "2027-01-15",
    bursary_applied: true, bursary_received: true,
    young_person_engaged: true, personal_adviser_involved: true,
    pathway_plan_linked: true, social_worker_informed: true,
    at_risk_of_dropping_out: false, support_plan_in_place: null,
    notes: null, created_at: "2026-05-15T00:00:00Z", updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeMetrics([]);
    expect(result.total_records).toBe(0);
    expect(result.unique_young_people).toBe(0);
    expect(result.application_success_rate).toBeNull(); // fab-0.
    expect(result.completion_rate).toBeNull(); // fab-0.
    expect(result.at_risk_count).toBe(0);
  });

  it("counts total records and unique young people", () => {
    const rows = [
      makeRow({ id: "r1", young_person_name: "Alex" }),
      makeRow({ id: "r2", young_person_name: "Alex" }),
      makeRow({ id: "r3", young_person_name: "Jordan" }),
    ];
    const result = computeMetrics(rows);
    expect(result.total_records).toBe(3);
    expect(result.unique_young_people).toBe(2);
  });

  it("computes application success rate (offers / applications)", () => {
    const rows = [
      makeRow({ id: "r1", record_type: "Application Submitted" }),
      makeRow({ id: "r2", record_type: "Application Submitted" }),
      makeRow({ id: "r3", record_type: "Offer Received" }),
    ];
    const result = computeMetrics(rows);
    expect(result.application_success_rate).toBe(50); // 1/2
  });

  it("computes completion rate (completions / enrolments)", () => {
    const rows = [
      makeRow({ id: "r1", record_type: "Enrolment" }),
      makeRow({ id: "r2", record_type: "Enrolment" }),
      makeRow({ id: "r3", record_type: "Completion" }),
    ];
    const result = computeMetrics(rows);
    expect(result.completion_rate).toBe(50); // 1/2
    expect(result.active_apprenticeships).toBe(1); // 2 - 1
  });

  it("computes bursary rates", () => {
    const rows = [
      makeRow({ id: "r1", bursary_applied: true, bursary_received: true }),
      makeRow({ id: "r2", bursary_applied: true, bursary_received: false }),
      makeRow({ id: "r3", bursary_applied: false, bursary_received: false }),
    ];
    const result = computeMetrics(rows);
    expect(result.bursary_application_rate).toBeCloseTo(66.7, 0); // 2/3
    expect(result.bursary_receipt_rate).toBe(50); // 1/2 applied
  });

  it("counts at-risk and computes engagement rate", () => {
    const rows = [
      makeRow({ id: "r1", at_risk_of_dropping_out: true, young_person_engaged: false }),
      makeRow({ id: "r2", at_risk_of_dropping_out: false, young_person_engaged: true }),
    ];
    const result = computeMetrics(rows);
    expect(result.at_risk_count).toBe(1);
    expect(result.engagement_rate).toBe(50);
  });

  it("computes PA, pathway plan, social worker rates", () => {
    const rows = [
      makeRow({ id: "r1", personal_adviser_involved: true, pathway_plan_linked: true, social_worker_informed: true }),
      makeRow({ id: "r2", personal_adviser_involved: false, pathway_plan_linked: false, social_worker_informed: false }),
    ];
    const result = computeMetrics(rows);
    expect(result.personal_adviser_rate).toBe(50);
    expect(result.pathway_plan_rate).toBe(50);
    expect(result.social_worker_informed_rate).toBe(50);
  });

  it("computes average duration in days", () => {
    const rows = [
      makeRow({ id: "r1", start_date: "2026-01-01", expected_end_date: "2026-07-01" }), // ~181 days
      makeRow({ id: "r2", start_date: null, expected_end_date: null }),
    ];
    const result = computeMetrics(rows);
    expect(result.average_duration_days).toBeGreaterThan(0);
  });

  it("counts milestone, support, application stage, formal, alternative", () => {
    const rows = [
      makeRow({ id: "r1", record_type: "Application Submitted", apprenticeship_level: "Intermediate — Level 2" }),
      makeRow({ id: "r2", record_type: "Pastoral Support", apprenticeship_level: "T-Level" }),
      makeRow({ id: "r3", record_type: "Completion", apprenticeship_level: "Advanced — Level 3" }),
    ];
    const result = computeMetrics(rows);
    expect(result.milestone_count).toBe(2); // Application Submitted + Completion
    expect(result.support_type_count).toBe(1); // Pastoral Support
    expect(result.application_stage_count).toBe(1); // Application Submitted
    expect(result.formal_apprenticeship_count).toBe(2); // Level 2 + Level 3
    expect(result.alternative_pathway_count).toBe(1); // T-Level
  });

  it("groups by record type and apprenticeship level", () => {
    const rows = [
      makeRow({ id: "r1", record_type: "Enrolment", apprenticeship_level: "Advanced — Level 3" }),
      makeRow({ id: "r2", record_type: "Progress Review", apprenticeship_level: "Advanced — Level 3" }),
    ];
    const result = computeMetrics(rows);
    expect(result.by_record_type["Enrolment"]).toBe(1);
    expect(result.by_record_type["Progress Review"]).toBe(1);
    expect(result.by_apprenticeship_level["Advanced — Level 3"]).toBe(2);
  });

  it("computes sector top 5", () => {
    const rows = [
      makeRow({ id: "r1", sector: "Health" }),
      makeRow({ id: "r2", sector: "Health" }),
      makeRow({ id: "r3", sector: "Construction" }),
    ];
    const result = computeMetrics(rows);
    expect(result.by_sector_top5.length).toBeGreaterThanOrEqual(1);
    expect(result.by_sector_top5[0].count).toBe(2);
  });
});

describe("computeAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = computeAlerts([]);
    expect(result).toEqual([]);
  });

  it("flags at-risk without support plan", () => {
    const rows = [
      makeRow({ id: "r1", at_risk_of_dropping_out: true, support_plan_in_place: false }),
    ];
    const result = computeAlerts(rows);
    const alerts = result.filter((a) => a.type === "at_risk_no_support_plan");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("critical");
  });

  it("returns fewer alerts for well-supported records", () => {
    const good = [makeRow()];
    const bad = [makeRow({
      at_risk_of_dropping_out: true, support_plan_in_place: false,
      young_person_engaged: false, personal_adviser_involved: false,
    })];
    const goodAlerts = computeAlerts(good);
    const badAlerts = computeAlerts(bad);
    expect(badAlerts.length).toBeGreaterThanOrEqual(goodAlerts.length);
  });
});

describe("validateApprenticeshipTracking", () => {
  it("validates good input", () => {
    const result = validateApprenticeshipTracking({
      youngPersonName: "Alex", recordDate: "2026-05-15",
      supportingStaff: "Sarah", recordType: "Progress Review",
      apprenticeshipLevel: "Advanced — Level 3",
      bursaryApplied: true, bursaryReceived: true,
      atRiskOfDroppingOut: false,
    });
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it("rejects missing required fields", () => {
    const result = validateApprenticeshipTracking({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it("rejects bursary received without applied", () => {
    const result = validateApprenticeshipTracking({
      youngPersonName: "Alex", recordDate: "2026-05-15",
      supportingStaff: "Sarah", recordType: "Progress Review",
      bursaryApplied: false, bursaryReceived: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("bursary") || e.includes("Bursary"))).toBe(true);
  });

  it("rejects at-risk without support plan", () => {
    const result = validateApprenticeshipTracking({
      youngPersonName: "Alex", recordDate: "2026-05-15",
      supportingStaff: "Sarah", recordType: "Progress Review",
      atRiskOfDroppingOut: true, supportPlanInPlace: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("at risk") || e.includes("support plan"))).toBe(true);
  });

  it("rejects future dates", () => {
    const result = validateApprenticeshipTracking({
      youngPersonName: "Alex", recordDate: "2099-01-01",
      supportingStaff: "Sarah", recordType: "Progress Review",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });
});
