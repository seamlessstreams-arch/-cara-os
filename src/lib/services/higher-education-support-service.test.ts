import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateHigherEducationSupport,
  generateCaraInsights,
  type HigherEducationSupportRow,
} from "./higher-education-support-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HigherEducationSupportRow> = {}): HigherEducationSupportRow {
  return {
    id: "row-1",
    home_id: "home-1",
    young_person_name: "Alex",
    record_date: "2026-05-01",
    supporting_staff: "Staff A",
    record_type: "Course Research",
    institution_name: null,
    course_name: null,
    qualification_level: "Other",
    application_status: "Exploring Options",
    student_finance_applied: false,
    bursary_applied: false,
    accommodation_secured: false,
    personal_adviser_involved: true,
    pathway_plan_updated: true,
    social_worker_informed: true,
    young_person_engaged: true,
    mentoring_in_place: false,
    next_milestone_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ───────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeMetrics([]);
    expect(result.total_records).toBe(0);
    expect(result.unique_young_people).toBe(0);
    expect(result.enrolled_count).toBe(0);
    expect(result.offer_rate).toBe(0);
    expect(result.finance_applied_rate).toBe(0);
    expect(result.engagement_rate).toBe(0);
  });

  it("computes correct counts and rates with populated data", () => {
    const rows = [
      makeRow({ young_person_name: "Alex", application_status: "Enrolled", student_finance_applied: true, bursary_applied: true }),
      makeRow({ id: "row-2", young_person_name: "Beth", application_status: "Applying", personal_adviser_involved: false }),
      makeRow({ id: "row-3", young_person_name: "Alex", application_status: "Offer Received — Conditional" }),
    ];
    const result = computeMetrics(rows);
    expect(result.total_records).toBe(3);
    expect(result.unique_young_people).toBe(2);
    expect(result.enrolled_count).toBe(1);
    // finance_applied_rate: 1/3 = 33.3%
    expect(result.finance_applied_rate).toBe(33.3);
    // bursary_rate: 1/3 = 33.3%
    expect(result.bursary_rate).toBe(33.3);
  });

  it("computes offer_rate from applicants only", () => {
    const rows = [
      makeRow({ application_status: "Enrolled" }),
      makeRow({ id: "row-2", application_status: "Applying" }),
      makeRow({ id: "row-3", application_status: "Rejected" }),
      makeRow({ id: "row-4", application_status: "Exploring Options" }),
    ];
    const result = computeMetrics(rows);
    // Applicants (not Exploring or N/A): Enrolled, Applying, Rejected = 3
    // Offers (Enrolled, Conditional, Unconditional, Firm, Deferred): Enrolled = 1
    // 1/3 = 33.3%
    expect(result.offer_rate).toBe(33.3);
  });
});

// ── computeAlerts ────────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toHaveLength(0);
  });

  it("raises critical alert: active application without PA", () => {
    const rows = [
      makeRow({ application_status: "Applying", personal_adviser_involved: false }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "active_application_no_pa");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert: enrolled without finance", () => {
    const rows = [
      makeRow({ application_status: "Enrolled", student_finance_applied: false }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "enrolled_no_finance");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert: enrolled without accommodation", () => {
    const rows = [
      makeRow({ application_status: "Enrolled", accommodation_secured: false }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "enrolled_no_accommodation");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert: active application without pathway plan", () => {
    const rows = [
      makeRow({ application_status: "Firm Choice Made", pathway_plan_updated: false }),
    ];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "application_no_pathway_plan");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert: young person not engaged", () => {
    const rows = [makeRow({ young_person_engaged: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "young_person_disengaged");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises medium alert: enrolled without mentoring", () => {
    const rows = [makeRow({ application_status: "Enrolled", mentoring_in_place: false })];
    const alerts = computeAlerts(rows);
    const match = alerts.filter((a) => a.type === "enrolled_no_mentoring");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });
});

// ── validateHigherEducationSupport ───────────────────────────────────────

describe("validateHigherEducationSupport", () => {
  it("validates a correct input", () => {
    const result = validateHigherEducationSupport({
      youngPersonName: "Alex",
      recordDate: "2025-01-01",
      supportingStaff: "Staff A",
      recordType: "Course Research",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing required fields", () => {
    const result = validateHigherEducationSupport({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects future record date", () => {
    const result = validateHigherEducationSupport({
      youngPersonName: "Alex",
      recordDate: "2099-01-01",
      supportingStaff: "Staff A",
      recordType: "Course Research",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("future"))).toBe(true);
  });

  it("rejects enrolled status without course name", () => {
    const result = validateHigherEducationSupport({
      youngPersonName: "Alex",
      recordDate: "2025-01-01",
      supportingStaff: "Staff A",
      recordType: "Course Research",
      applicationStatus: "Enrolled",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("course name"))).toBe(true);
  });
});

// ── generateCaraInsights ─────────────────────────────────────────────────

describe("generateCaraInsights", () => {
  it("returns 3 insights", () => {
    const rows = [makeRow()];
    const insights = generateCaraInsights(rows);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
  });
});
