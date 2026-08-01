import { describe, it, expect } from "vitest";
import {
  computeDiversityMetrics,
  identifyDiversityAlerts,
  DiversityRecord,
} from "./diversity-inclusion-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<DiversityRecord> = {}): DiversityRecord {
  return {
    id: "div-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    protected_characteristic: "race_ethnicity",
    characteristic_detail: "Afro-Caribbean heritage",
    support_category: "cultural_activity",
    support_description: "Access to community events",
    support_status: "in_place",
    review_outcome: "fully_effective",
    reviewed_date: "2026-05-01",
    next_review_date: null,
    child_views: "Alice is happy with current support",
    child_satisfied: true,
    staff_aware: true,
    staff_trained: true,
    external_support: null,
    equality_impact_assessed: true,
    notes: null,
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
    ...overrides,
  };
}

// ── computeDiversityMetrics ────────────────────────────────────────────

describe("computeDiversityMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeDiversityMetrics([], 4);
    expect(m.total_records).toBe(0);
    expect(m.children_with_records).toBe(0);
    expect(m.children_coverage).toBe(0);
    expect(m.in_place_count).toBe(0);
    expect(m.staff_aware_rate).toBeNull();; expect(m.child_views_rate).toBeNull();; });

  it("calculates correct metrics for populated data", () => {
    const records = [
      makeRecord({ child_id: "child-1", support_status: "in_place", staff_aware: true, staff_trained: true, equality_impact_assessed: true }),
      makeRecord({ id: "div-2", child_id: "child-2", child_name: "Bob", support_status: "not_met", review_outcome: "not_effective", staff_aware: false, staff_trained: false, child_views: null, child_satisfied: null, equality_impact_assessed: false }),
    ];
    const m = computeDiversityMetrics(records, 4);
    expect(m.total_records).toBe(2);
    expect(m.children_with_records).toBe(2);
    expect(m.children_coverage).toBe(50);
    expect(m.in_place_count).toBe(1);
    expect(m.not_met_count).toBe(1);
    expect(m.not_effective_count).toBe(1);
    expect(m.staff_aware_rate).toBe(50);
    expect(m.staff_trained_rate).toBe(50);
    expect(m.equality_impact_rate).toBe(50);
    // child_views: only first has child_views set => 1/2 = 50%
    expect(m.child_views_rate).toBe(50);
    // child_satisfied: only 1 record with non-null child_satisfied and it's true => 100%
    expect(m.child_satisfied_rate).toBe(100);
  });

  it("produces correct breakdown maps", () => {
    const records = [
      makeRecord({ protected_characteristic: "race_ethnicity" }),
      makeRecord({ id: "div-2", protected_characteristic: "disability" }),
    ];
    const m = computeDiversityMetrics(records, 4);
    expect(m.by_characteristic["race_ethnicity"]).toBe(1);
    expect(m.by_characteristic["disability"]).toBe(1);
  });
});

// ── identifyDiversityAlerts ────────────────────────────────────────────

describe("identifyDiversityAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyDiversityAlerts([], 0, NOW)).toEqual([]);
  });

  it("alerts critical for support_status not_met", () => {
    const records = [makeRecord({ support_status: "not_met" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    const needNotMet = alerts.find((a) => a.type === "need_not_met");
    expect(needNotMet).toBeDefined();
    expect(needNotMet!.severity).toBe("critical");
  });

  it("alerts high when staff not aware of diversity needs", () => {
    const records = [makeRecord({ staff_aware: false, support_status: "in_place" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    expect(alerts.find((a) => a.type === "staff_not_aware")).toBeDefined();
  });

  it("does not alert staff_not_aware for not_applicable support", () => {
    const records = [makeRecord({ staff_aware: false, support_status: "not_applicable" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    expect(alerts.find((a) => a.type === "staff_not_aware")).toBeUndefined();
  });

  it("alerts high for review outcome not_effective", () => {
    const records = [makeRecord({ review_outcome: "not_effective" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    expect(alerts.find((a) => a.type === "support_not_effective")).toBeDefined();
  });

  it("alerts medium for overdue review date", () => {
    const records = [makeRecord({ next_review_date: "2026-01-01" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeDefined();
  });

  it("does not alert review_overdue if date is in the future", () => {
    const records = [makeRecord({ next_review_date: "2027-01-01" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    expect(alerts.find((a) => a.type === "review_overdue")).toBeUndefined();
  });

  it("alerts medium for no equality impact assessment (non not_applicable)", () => {
    const records = [makeRecord({ equality_impact_assessed: false, support_status: "in_place" })];
    const alerts = identifyDiversityAlerts(records, 1, NOW);
    expect(alerts.find((a) => a.type === "no_eia")).toBeDefined();
  });
});
