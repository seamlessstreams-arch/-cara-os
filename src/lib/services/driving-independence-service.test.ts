import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  validateDrivingIndependence,
  generateCaraInsights,
  DrivingIndependenceRow,
} from "./driving-independence-service";

function makeRow(overrides: Partial<DrivingIndependenceRow> = {}): DrivingIndependenceRow {
  return {
    id: "di-1",
    home_id: "home-1",
    young_person_name: "Alice",
    record_date: "2026-05-21",
    supporting_staff: "Staff A",
    activity_type: "Driving Lesson",
    provider_name: "Pass Plus Driving School",
    lesson_number: 5,
    total_lessons_funded: 20,
    funding_source: "Local Authority",
    cost_per_lesson: 35,
    total_spent: 175,
    young_person_engaged: true,
    personal_adviser_involved: true,
    pathway_plan_linked: true,
    social_worker_informed: true,
    next_milestone: "Theory test",
    next_date: "2026-06-01",
    notes: null,
    created_at: "2026-05-21T10:00:00Z",
    updated_at: "2026-05-21T10:00:00Z",
    ...overrides,
  };
}

// ── computeMetrics ─────────────────────────────────────────────────────

describe("computeMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMetrics([]);
    expect(m.total_records).toBe(0);
    expect(m.unique_young_people).toBe(0);
    expect(m.total_spent).toBe(0);
    expect(m.theory_pass_rate).toBe(0);
    expect(m.practical_pass_rate).toBe(0);
    expect(m.engagement_rate).toBe(0);
    expect(m.driving_lesson_count).toBe(0);
  });

  it("calculates pass rates and counts for populated data", () => {
    const rows = [
      makeRow({ activity_type: "Theory Test — Passed" }),
      makeRow({ id: "di-2", activity_type: "Theory Test — Failed" }),
      makeRow({ id: "di-3", activity_type: "Practical Test — Passed" }),
      makeRow({ id: "di-4", activity_type: "Driving Lesson", total_spent: 35 }),
      makeRow({ id: "di-5", activity_type: "CBT — Moped/Scooter" }),
      makeRow({ id: "di-6", activity_type: "Bus/Train Journey Planning", young_person_name: "Bob" }),
    ];
    const m = computeMetrics(rows);
    expect(m.total_records).toBe(6);
    expect(m.unique_young_people).toBe(2);
    // Theory: 1 pass / 2 attempts = 50%
    expect(m.theory_pass_rate).toBe(50);
    expect(m.theory_attempts).toBe(2);
    // Practical: 1 pass / 1 attempt = 100%
    expect(m.practical_pass_rate).toBe(100);
    expect(m.practical_attempts).toBe(1);
    expect(m.cbt_count).toBe(1);
    expect(m.driving_lesson_count).toBe(1);
    expect(m.public_transport_count).toBe(1);
    expect(m.licence_achieved_count).toBe(1);
  });

  it("computes engagement rate correctly", () => {
    const rows = [
      makeRow({ young_person_engaged: true }),
      makeRow({ id: "di-2", young_person_engaged: false }),
    ];
    const m = computeMetrics(rows);
    expect(m.engagement_rate).toBe(50);
  });
});

// ── computeAlerts ──────────────────────────────────────────────────────

describe("computeAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("alerts critical when lessons running out without test booked", () => {
    const rows = [
      makeRow({ lesson_number: 19, total_lessons_funded: 20, activity_type: "Driving Lesson" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "lessons_running_out_no_test")).toBeDefined();
  });

  it("does not alert lessons_running_out if practical test is booked", () => {
    const rows = [
      makeRow({ lesson_number: 19, total_lessons_funded: 20, activity_type: "Driving Lesson" }),
      makeRow({ id: "di-2", activity_type: "Practical Test — Booked" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "lessons_running_out_no_test")).toBeUndefined();
  });

  it("alerts critical for >=2 theory test failures for same young person", () => {
    const rows = [
      makeRow({ activity_type: "Theory Test — Failed" }),
      makeRow({ id: "di-2", activity_type: "Theory Test — Failed" }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "repeated_theory_failure")).toBeDefined();
  });

  it("alerts high for milestone activity without PA involvement", () => {
    const rows = [
      makeRow({ activity_type: "Provisional Licence Application", personal_adviser_involved: false }),
    ];
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "no_pa_milestone")).toBeDefined();
  });

  it("alerts high for low engagement (<40%) with >=5 records", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `di-${i}`, young_person_engaged: i < 1 }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "low_engagement")).toBeDefined();
  });

  it("alerts medium when no alternative transport activities with >=5 records", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      makeRow({ id: `di-${i}`, activity_type: "Driving Lesson" }),
    );
    const alerts = computeAlerts(rows);
    expect(alerts.find((a) => a.type === "no_alternative_transport")).toBeDefined();
  });
});

// ── validateDrivingIndependence ─────────────────────────────────────────

describe("validateDrivingIndependence", () => {
  it("returns valid for correct input", () => {
    const result = validateDrivingIndependence({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      activityType: "Driving Lesson",
      fundingSource: "Local Authority",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("returns errors for missing required fields", () => {
    const result = validateDrivingIndependence({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });

  it("rejects negative lesson number", () => {
    const result = validateDrivingIndependence({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      activityType: "Driving Lesson",
      lessonNumber: -1,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("Lesson number must be a positive integer"))).toBe(true);
  });

  it("rejects lesson number exceeding total funded", () => {
    const result = validateDrivingIndependence({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      activityType: "Driving Lesson",
      lessonNumber: 25,
      totalLessonsFunded: 20,
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes("exceeds total lessons funded"))).toBe(true);
  });

  it("rejects negative cost", () => {
    const result = validateDrivingIndependence({
      youngPersonName: "Alice",
      recordDate: "2026-05-01",
      supportingStaff: "Staff A",
      activityType: "Driving Lesson",
      costPerLesson: -10,
    });
    expect(result.valid).toBe(false);
  });
});

// ── generateCaraInsights ───────────────────────────────────────────────

describe("generateCaraInsights", () => {
  it("returns 3 insights for populated data", () => {
    const rows = [makeRow()];
    const insights = generateCaraInsights(rows);
    expect(insights.length).toBe(3);
    expect(insights[0]).toContain("[sky]");
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights.length).toBe(3);
  });
});
