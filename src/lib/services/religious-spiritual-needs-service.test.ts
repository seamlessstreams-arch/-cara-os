import { describe, it, expect } from "vitest";
import {
  computeReligiousSpiritualMetrics,
  identifyReligiousSpiritualAlerts,
  type ReligiousSpiritualNeedsRecord,
} from "./religious-spiritual-needs-service";

function makeRecord(overrides: Partial<ReligiousSpiritualNeedsRecord> = {}): ReligiousSpiritualNeedsRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    faith_background: "christian",
    support_type: "worship_access",
    frequency: "weekly",
    satisfaction_level: "satisfied",
    support_date: "2025-04-01",
    child_name: "Child A",
    child_id: "c1",
    staff_name: "Staff A",
    facilitated: true,
    child_views_sought: true,
    parent_carer_consulted: true,
    culturally_appropriate: true,
    dietary_observance_met: true,
    worship_access_provided: true,
    prayer_space_available: true,
    festival_recognised: true,
    faith_leader_contacted: true,
    careplan_updated: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeReligiousSpiritualMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeReligiousSpiritualMetrics([]);
    expect(m.total_supports).toBe(0);
    expect(m.facilitated_count).toBe(0);
    expect(m.not_facilitated_count).toBe(0);
    expect(m.satisfied_count).toBe(0);
    expect(m.dissatisfied_count).toBe(0);
    expect(m.child_views_sought_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts facilitated and satisfaction", () => {
    const records = [
      makeRecord({ facilitated: true, satisfaction_level: "very_satisfied" }),
      makeRecord({ id: "r2", facilitated: false, satisfaction_level: "dissatisfied" }),
      makeRecord({ id: "r3", facilitated: true, satisfaction_level: "satisfied" }),
    ];
    const m = computeReligiousSpiritualMetrics(records);
    expect(m.facilitated_count).toBe(2);
    expect(m.not_facilitated_count).toBe(1);
    expect(m.satisfied_count).toBe(2); // very_satisfied + satisfied
    expect(m.dissatisfied_count).toBe(1);
  });

  it("calculates boolean rates at 100%", () => {
    const records = [makeRecord(), makeRecord({ id: "r2" })];
    const m = computeReligiousSpiritualMetrics(records);
    expect(m.child_views_sought_rate).toBe(100);
    expect(m.parent_carer_consulted_rate).toBe(100);
    expect(m.culturally_appropriate_rate).toBe(100);
    expect(m.dietary_observance_rate).toBe(100);
    expect(m.worship_access_rate).toBe(100);
    expect(m.prayer_space_rate).toBe(100);
    expect(m.festival_recognised_rate).toBe(100);
    expect(m.faith_leader_contacted_rate).toBe(100);
    expect(m.careplan_updated_rate).toBe(100);
  });

  it("calculates 50% rate for mixed values", () => {
    const records = [
      makeRecord({ child_views_sought: true }),
      makeRecord({ id: "r2", child_views_sought: false }),
    ];
    const m = computeReligiousSpiritualMetrics(records);
    expect(m.child_views_sought_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ id: "r2", child_name: "Alice" }),
      makeRecord({ id: "r3", child_name: "Bob" }),
    ];
    const m = computeReligiousSpiritualMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns correctly", () => {
    const records = [
      makeRecord({ faith_background: "muslim", support_type: "dietary_observance" }),
      makeRecord({ id: "r2", faith_background: "muslim", support_type: "prayer_space" }),
      makeRecord({ id: "r3", faith_background: "christian", support_type: "worship_access" }),
    ];
    const m = computeReligiousSpiritualMetrics(records);
    expect(m.by_faith_background).toEqual({ muslim: 2, christian: 1 });
    expect(m.by_support_type).toEqual({ dietary_observance: 1, prayer_space: 1, worship_access: 1 });
  });
});

describe("identifyReligiousSpiritualAlerts", () => {
  it("returns empty for no data", () => {
    expect(identifyReligiousSpiritualAlerts([])).toEqual([]);
  });

  it("critical alert for dissatisfied + views not sought", () => {
    const records = [makeRecord({ satisfaction_level: "dissatisfied", child_views_sought: false })];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "dissatisfied_views_not_sought" && a.severity === "critical")).toBe(true);
  });

  it("no critical alert when dissatisfied but views were sought", () => {
    const records = [makeRecord({ satisfaction_level: "dissatisfied", child_views_sought: true })];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "dissatisfied_views_not_sought")).toBe(false);
  });

  it("high alert when >= 1 not facilitated", () => {
    const records = [makeRecord({ facilitated: false })];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "not_facilitated" && a.severity === "high")).toBe(true);
  });

  it("high alert when >= 1 careplan not updated", () => {
    const records = [makeRecord({ careplan_updated: false })];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "careplan_not_updated" && a.severity === "high")).toBe(true);
  });

  it("high alert when >= 1 not culturally appropriate", () => {
    const records = [makeRecord({ culturally_appropriate: false })];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "not_culturally_appropriate" && a.severity === "high")).toBe(true);
  });

  it("medium alert when >= 2 dietary observance not met", () => {
    const records = [
      makeRecord({ dietary_observance_met: false }),
      makeRecord({ id: "r2", dietary_observance_met: false }),
    ];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "dietary_not_met" && a.severity === "medium")).toBe(true);
  });

  it("no dietary alert for exactly 1", () => {
    const records = [makeRecord({ dietary_observance_met: false })];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "dietary_not_met")).toBe(false);
  });

  it("medium alert when >= 2 parent not consulted", () => {
    const records = [
      makeRecord({ parent_carer_consulted: false }),
      makeRecord({ id: "r2", parent_carer_consulted: false }),
    ];
    const alerts = identifyReligiousSpiritualAlerts(records);
    expect(alerts.some((a) => a.type === "parent_not_consulted" && a.severity === "medium")).toBe(true);
  });
});
