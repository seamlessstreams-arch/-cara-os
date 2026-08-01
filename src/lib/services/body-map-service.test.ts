import { describe, it, expect } from "vitest";
import {
  computeBodyMapMetrics,
  identifyBodyMapAlerts,
  type BodyMapRecord,
} from "./body-map-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<BodyMapRecord> = {}): BodyMapRecord {
  return {
    id: "bm-1",
    home_id: "home-1",
    child_name: "Child A",
    child_id: "child-1",
    observation_date: "2026-05-15",
    observed_by: "Staff A",
    mark_type: "bruise",
    body_location: "left_arm",
    description: "Small bruise",
    size_cm: "2",
    colour: "purple",
    explanation: "Fell playing football",
    explanation_source: "child",
    explanation_consistent: true,
    actions_taken: ["recorded_only"],
    safeguarding_referral_made: false,
    photograph_taken: true,
    manager_informed: true,
    social_worker_informed: true,
    follow_up_required: false,
    follow_up_date: null,
    follow_up_completed: false,
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeBodyMapMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeBodyMapMetrics([], 5, NOW);
    expect(m.total_records).toBe(0);
    expect(m.records_this_month).toBe(0);
    expect(m.children_with_records).toBe(0);
    expect(m.manager_informed_rate).toBeNull();;
  });

  it("computes counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", manager_informed: true, social_worker_informed: true, safeguarding_referral_made: true }),
      makeRecord({ id: "2", child_id: "c2", manager_informed: false, social_worker_informed: false, safeguarding_referral_made: false }),
    ];
    const m = computeBodyMapMetrics(records, 5, NOW);
    expect(m.total_records).toBe(2);
    expect(m.children_with_records).toBe(2);
    expect(m.safeguarding_referrals).toBe(1);
    expect(m.manager_informed_rate).toBe(50);
    expect(m.social_worker_informed_rate).toBe(50);
  });

  it("counts records this month within 30-day window", () => {
    const records = [
      makeRecord({ id: "1", observation_date: "2026-05-15" }), // within 30 days of NOW
      makeRecord({ id: "2", observation_date: "2026-01-01" }), // outside 30 days
    ];
    const m = computeBodyMapMetrics(records, 5, NOW);
    expect(m.records_this_month).toBe(1);
  });

  it("counts unexplained and inconsistent marks", () => {
    const records = [
      makeRecord({ id: "1", explanation_source: "unknown" }),
      makeRecord({ id: "2", explanation_source: "none_given" }),
      makeRecord({ id: "3", explanation_source: "inconsistent" }),
      makeRecord({ id: "4", explanation_source: "child", explanation_consistent: false }),
    ];
    const m = computeBodyMapMetrics(records, 5, NOW);
    expect(m.unexplained_marks).toBe(2);
    expect(m.inconsistent_explanations).toBe(2); // "inconsistent" source + false consistent
  });

  it("counts self-harm marks and follow-ups pending", () => {
    const records = [
      makeRecord({ id: "1", mark_type: "self_harm" }),
      makeRecord({ id: "2", mark_type: "self_harm" }),
      makeRecord({ id: "3", follow_up_required: true, follow_up_completed: false }),
    ];
    const m = computeBodyMapMetrics(records, 5, NOW);
    expect(m.self_harm_marks).toBe(2);
    expect(m.follow_ups_pending).toBe(1);
  });

  it("builds by_child breakdown", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alice" }),
      makeRecord({ id: "2", child_name: "Alice" }),
      makeRecord({ id: "3", child_name: "Bob" }),
    ];
    const m = computeBodyMapMetrics(records, 5, NOW);
    expect(m.by_child).toEqual({ Alice: 2, Bob: 1 });
  });
});

describe("identifyBodyMapAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyBodyMapAlerts([], 5, NOW)).toEqual([]);
  });

  it("fires critical alert for inconsistent explanation", () => {
    const records = [makeRecord({ id: "bm1", explanation_source: "inconsistent" })];
    const alerts = identifyBodyMapAlerts(records, 5, NOW);
    const a = alerts.find((a) => a.type === "inconsistent_explanation");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("fires critical alert for explanation_consistent === false", () => {
    const records = [makeRecord({ id: "bm2", explanation_source: "child", explanation_consistent: false })];
    const alerts = identifyBodyMapAlerts(records, 5, NOW);
    expect(alerts.find((a) => a.type === "inconsistent_explanation")).toBeDefined();
  });

  it("fires high alert when manager not informed", () => {
    const records = [makeRecord({ id: "bm3", manager_informed: false })];
    const alerts = identifyBodyMapAlerts(records, 5, NOW);
    expect(alerts.find((a) => a.type === "manager_not_informed")).toBeDefined();
  });

  it("fires critical alert for self-harm marks", () => {
    const records = [makeRecord({ id: "bm4", mark_type: "self_harm" })];
    const alerts = identifyBodyMapAlerts(records, 5, NOW);
    expect(alerts.find((a) => a.type === "self_harm")).toBeDefined();
    expect(alerts.find((a) => a.type === "self_harm")!.severity).toBe("critical");
  });

  it("fires high alert for overdue follow-up", () => {
    const records = [makeRecord({ id: "bm5", follow_up_required: true, follow_up_completed: false, follow_up_date: "2025-01-01" })];
    const alerts = identifyBodyMapAlerts(records, 5, NOW);
    expect(alerts.find((a) => a.type === "follow_up_overdue")).toBeDefined();
  });

  it("fires critical alert for repeated marks (>= 3 in 30 days)", () => {
    const records = [
      makeRecord({ id: "1", child_id: "c1", child_name: "Alice", observation_date: "2026-05-10" }),
      makeRecord({ id: "2", child_id: "c1", child_name: "Alice", observation_date: "2026-05-12" }),
      makeRecord({ id: "3", child_id: "c1", child_name: "Alice", observation_date: "2026-05-14" }),
    ];
    const alerts = identifyBodyMapAlerts(records, 5, NOW);
    expect(alerts.find((a) => a.type === "repeated_marks")).toBeDefined();
    expect(alerts.find((a) => a.type === "repeated_marks")!.severity).toBe("critical");
  });
});
