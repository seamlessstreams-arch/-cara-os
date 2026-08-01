import { describe, it, expect } from "vitest";
import {
  computeDiversityMetrics,
  identifyDiversityAlerts,
  type WorkforceDiversityRecord,
} from "./workforce-diversity-service";

// ── Factory ────────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<WorkforceDiversityRecord> = {}): WorkforceDiversityRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    staff_name: "Jane Doe",
    staff_id: "staff-1",
    diversity_category: "ethnicity",
    disclosure_status: "disclosed",
    equality_training_status: "completed",
    equality_training_date: "2025-01-15",
    adjustment_status: "no_longer_needed",
    adjustment_details: null,
    eia_outcome: "neutral",
    discrimination_reported: false,
    discrimination_details: null,
    inclusive_practice_rating: 4,
    staff_satisfaction_with_inclusion: 5,
    review_date: null,
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeDiversityMetrics ────────────────────────────────────────────────

describe("computeDiversityMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeDiversityMetrics([], 0);
    expect(m.total_records).toBe(0);
    expect(m.staff_with_records).toBe(0);
    expect(m.diversity_coverage).toBeNull();;
    expect(m.disclosure_rate).toBeNull();;
    expect(m.training_completed_rate).toBeNull();;
    expect(m.training_overdue_count).toBe(0);
    expect(m.adjustments_in_place).toBe(0);
    expect(m.adjustments_requested).toBe(0);
    expect(m.discrimination_reported_count).toBe(0);
    expect(m.average_inclusive_practice).toBeNull();;
    expect(m.average_satisfaction).toBeNull();;
    expect(m.eia_not_assessed_count).toBe(0);
    expect(m.negative_unmitigated_count).toBe(0);
  });

  it("computes coverage from unique staff IDs against total", () => {
    const records = [
      makeRecord({ staff_id: "s1" }),
      makeRecord({ id: "rec-2", staff_id: "s2" }),
      makeRecord({ id: "rec-3", staff_id: "s1" }),
    ];
    const m = computeDiversityMetrics(records, 5);
    expect(m.staff_with_records).toBe(2);
    expect(m.diversity_coverage).toBe(40); // 2/5 * 100 = 40
  });

  it("computes disclosure rate correctly", () => {
    const records = [
      makeRecord({ disclosure_status: "disclosed" }),
      makeRecord({ id: "r2", staff_id: "s2", disclosure_status: "prefer_not_to_say" }),
      makeRecord({ id: "r3", staff_id: "s3", disclosure_status: "disclosed" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.disclosure_rate).toBe(66.7); // 2/3 = 66.666 => round to 66.7
  });

  it("computes training completed rate and overdue count", () => {
    const records = [
      makeRecord({ equality_training_status: "completed" }),
      makeRecord({ id: "r2", staff_id: "s2", equality_training_status: "overdue" }),
      makeRecord({ id: "r3", staff_id: "s3", equality_training_status: "overdue" }),
      makeRecord({ id: "r4", staff_id: "s4", equality_training_status: "completed" }),
    ];
    const m = computeDiversityMetrics(records, 4);
    expect(m.training_completed_count).toBe(2);
    expect(m.training_completed_rate).toBe(50);
    expect(m.training_overdue_count).toBe(2);
  });

  it("counts adjustments in place and requested", () => {
    const records = [
      makeRecord({ adjustment_status: "in_place" }),
      makeRecord({ id: "r2", staff_id: "s2", adjustment_status: "requested" }),
      makeRecord({ id: "r3", staff_id: "s3", adjustment_status: "requested" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.adjustments_in_place).toBe(1);
    expect(m.adjustments_requested).toBe(2);
  });

  it("computes average inclusive practice rating", () => {
    const records = [
      makeRecord({ inclusive_practice_rating: 3 }),
      makeRecord({ id: "r2", staff_id: "s2", inclusive_practice_rating: 5 }),
    ];
    const m = computeDiversityMetrics(records, 2);
    expect(m.average_inclusive_practice).toBe(4); // (3+5)/2
  });

  it("computes average satisfaction ignoring null values", () => {
    const records = [
      makeRecord({ staff_satisfaction_with_inclusion: 3 }),
      makeRecord({ id: "r2", staff_id: "s2", staff_satisfaction_with_inclusion: null }),
      makeRecord({ id: "r3", staff_id: "s3", staff_satisfaction_with_inclusion: 5 }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.average_satisfaction).toBe(4); // (3+5)/2
  });

  it("populates breakdown records", () => {
    const records = [
      makeRecord({ diversity_category: "ethnicity" }),
      makeRecord({ id: "r2", staff_id: "s2", diversity_category: "disability" }),
      makeRecord({ id: "r3", staff_id: "s3", diversity_category: "ethnicity" }),
    ];
    const m = computeDiversityMetrics(records, 3);
    expect(m.by_diversity_category).toEqual({ ethnicity: 2, disability: 1 });
  });
});

// ── identifyDiversityAlerts ────────────────────────────────────────────────

describe("identifyDiversityAlerts", () => {
  it("returns no alerts for empty records with zero total", () => {
    const alerts = identifyDiversityAlerts([], 0);
    expect(alerts).toEqual([]);
  });

  it("flags critical alert for discrimination reported", () => {
    const records = [makeRecord({ discrimination_reported: true, discrimination_details: "Verbal abuse" })];
    const alerts = identifyDiversityAlerts(records, 1);
    const discAlerts = alerts.filter((a) => a.type === "discrimination_reported");
    expect(discAlerts.length).toBe(1);
    expect(discAlerts[0].severity).toBe("critical");
  });

  it("flags high alert for negative unmitigated EIA outcome", () => {
    const records = [makeRecord({ eia_outcome: "negative_impact_unmitigated" })];
    const alerts = identifyDiversityAlerts(records, 1);
    const neg = alerts.filter((a) => a.type === "negative_unmitigated");
    expect(neg.length).toBe(1);
    expect(neg[0].severity).toBe("high");
  });

  it("flags high alert when 2+ staff have overdue training", () => {
    const records = [
      makeRecord({ equality_training_status: "overdue" }),
      makeRecord({ id: "r2", staff_id: "s2", equality_training_status: "overdue" }),
    ];
    const alerts = identifyDiversityAlerts(records, 2);
    const training = alerts.filter((a) => a.type === "training_overdue");
    expect(training.length).toBe(1);
    expect(training[0].severity).toBe("high");
  });

  it("does NOT flag training overdue when only 1 staff overdue", () => {
    const records = [makeRecord({ equality_training_status: "overdue" })];
    const alerts = identifyDiversityAlerts(records, 1);
    const training = alerts.filter((a) => a.type === "training_overdue");
    expect(training.length).toBe(0);
  });

  it("flags medium alert when adjustments are requested", () => {
    const records = [makeRecord({ adjustment_status: "requested" })];
    const alerts = identifyDiversityAlerts(records, 1);
    const adj = alerts.filter((a) => a.type === "adjustments_pending");
    expect(adj.length).toBe(1);
    expect(adj[0].severity).toBe("medium");
  });

  it("flags medium alert for low coverage when totalStaff exceeds covered", () => {
    const records = [makeRecord()];
    const alerts = identifyDiversityAlerts(records, 3);
    const cov = alerts.filter((a) => a.type === "low_coverage");
    expect(cov.length).toBe(1);
    expect(cov[0].severity).toBe("medium");
    expect(cov[0].message).toContain("2 staff members");
  });

  it("does NOT flag low coverage when all staff covered", () => {
    const records = [makeRecord()];
    const alerts = identifyDiversityAlerts(records, 1);
    const cov = alerts.filter((a) => a.type === "low_coverage");
    expect(cov.length).toBe(0);
  });
});
