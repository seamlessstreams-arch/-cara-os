import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateBenefitEntitlementSupport,
  type BenefitEntitlementSupportRow,
} from "./benefit-entitlement-support-service";

function makeRow(overrides: Partial<BenefitEntitlementSupportRow> = {}): BenefitEntitlementSupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    young_person_name: "Young Person A",
    record_date: "2026-05-01",
    supporting_staff: "Staff A",
    entitlement_type: "Universal Credit",
    support_stage: "Ongoing Support",
    amount_awarded: null,
    payment_frequency: null,
    young_person_engaged: true,
    application_successful: null,
    appeal_outcome: null,
    personal_adviser_involved: true,
    social_worker_informed: true,
    pathway_plan_linked: true,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_young_people).toBe(0);
    expect(m.total_awarded).toBe(0);
    expect(m.engagement_rate).toBeNull();; });

  it("computes counts and rates for populated data", () => {
    const rows = [
      makeRow({ id: "1", entitlement_type: "Universal Credit", support_stage: "Decision — Awarded", amount_awarded: 300, application_successful: true }),
      makeRow({ id: "2", entitlement_type: "Housing Benefit", support_stage: "Application Submitted", young_person_engaged: false }),
      makeRow({ id: "3", entitlement_type: "Care Leaver Bursary", support_stage: "Decision — Refused", application_successful: false, pathway_plan_linked: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(3);
    expect(m.total_awarded).toBe(300);
    expect(m.application_success_rate).toBe(50); // 1 out of 2 decided
    expect(m.refused_count).toBe(1);
    expect(m.pending_applications_count).toBe(1);
    expect(m.care_leaver_entitlements_count).toBe(1);
    expect(m.engagement_rate).toBeCloseTo(66.7, 0);
  });

  it("counts overdue reviews", () => {
    const rows = [
      makeRow({ id: "1", next_review_date: "2020-01-01", support_stage: "Ongoing Support" }),
      makeRow({ id: "2", next_review_date: "2099-01-01", support_stage: "Ongoing Support" }),
      makeRow({ id: "3", next_review_date: "2020-01-01", support_stage: "Closed" }), // should not count
    ];
    const m = computeMetrics(rows);
    expect(m.overdue_reviews_count).toBe(1);
  });

  it("computes average award amount", () => {
    const rows = [
      makeRow({ id: "1", support_stage: "Decision — Awarded", amount_awarded: 100 }),
      makeRow({ id: "2", support_stage: "Decision — Awarded", amount_awarded: 200 }),
    ];
    const m = computeMetrics(rows);
    expect(m.average_award_amount).toBe(150);
  });
});

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for overdue review", () => {
    const rows = [makeRow({ id: "r1", next_review_date: "2020-01-01", support_stage: "Ongoing Support" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "overdue_review")).toBeDefined();
    expect(alerts.find((a) => a.type === "overdue_review")!.severity).toBe("critical");
  });

  it("fires critical alert for PA not involved in care leaver entitlement", () => {
    const rows = [makeRow({ id: "r2", entitlement_type: "Care Leaver Bursary", personal_adviser_involved: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "pa_not_involved_care_leaver")).toBeDefined();
  });

  it("fires high alert for UC application without SW informed", () => {
    const rows = [
      makeRow({ id: "r3", entitlement_type: "Universal Credit", support_stage: "Application Submitted", social_worker_informed: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "uc_sw_not_informed")).toBeDefined();
  });

  it("fires high alert for disengaged young person in active stage", () => {
    const rows = [makeRow({ id: "r4", young_person_engaged: false, support_stage: "Application Support" })];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "yp_disengaged")).toBeDefined();
  });
});

describe("validateBenefitEntitlementSupport", () => {
  it("passes for valid input", () => {
    const result = validateBenefitEntitlementSupport({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      entitlementType: "Universal Credit",
      supportStage: "Ongoing Support",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("fails for missing required fields", () => {
    const result = validateBenefitEntitlementSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);
  });

  it("fails for awarded decision without amount", () => {
    const result = validateBenefitEntitlementSupport({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      entitlementType: "Universal Credit",
      supportStage: "Decision — Awarded",
      amountAwarded: null,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Amount awarded"))).toBe(true);
  });

  it("fails for care leaver entitlement without PA involvement", () => {
    const result = validateBenefitEntitlementSupport({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      entitlementType: "Care Leaver Bursary",
      supportStage: "Eligibility Check",
      personalAdviserInvolved: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("personal adviser"))).toBe(true);
  });
});
