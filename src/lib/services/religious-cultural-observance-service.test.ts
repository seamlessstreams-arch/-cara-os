import { describe, it, expect } from "vitest";
import {
  computeReligiousCulturalMetrics,
  identifyReligiousCulturalAlerts,
  type ReligiousCulturalObservanceRecord,
} from "./religious-cultural-observance-service";

function makeRecord(overrides: Partial<ReligiousCulturalObservanceRecord> = {}): ReligiousCulturalObservanceRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    observance_type: "religious_festival",
    accommodation_level: "fully_accommodated",
    cultural_sensitivity: "good",
    staff_competence: "competent",
    observance_date: "2025-04-01",
    child_name: "Child A",
    child_id: "c1",
    supported_by: "Staff A",
    child_views_sought: true,
    family_consulted: true,
    dietary_needs_met: true,
    resources_provided: true,
    community_links_used: true,
    staff_trained: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    respectful_approach: true,
    celebration_supported: true,
    discrimination_addressed: true,
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

describe("computeReligiousCulturalMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeReligiousCulturalMetrics([]);
    expect(m.total_observances).toBe(0);
    expect(m.not_accommodated_count).toBe(0);
    expect(m.poorly_accommodated_count).toBe(0);
    expect(m.poor_sensitivity_count).toBe(0);
    expect(m.unaware_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts accommodation and sensitivity issues", () => {
    const records = [
      makeRecord({ accommodation_level: "not_accommodated", cultural_sensitivity: "unaware" }),
      makeRecord({ id: "r2", accommodation_level: "poorly_accommodated", cultural_sensitivity: "poor" }),
      makeRecord({ id: "r3", accommodation_level: "fully_accommodated", cultural_sensitivity: "good" }),
    ];
    const m = computeReligiousCulturalMetrics(records);
    expect(m.not_accommodated_count).toBe(1);
    expect(m.poorly_accommodated_count).toBe(1);
    expect(m.poor_sensitivity_count).toBe(1);
    expect(m.unaware_count).toBe(1);
  });

  it("calculates boolean rates at 100% when all true", () => {
    const records = [makeRecord(), makeRecord({ id: "r2" })];
    const m = computeReligiousCulturalMetrics(records);
    expect(m.child_views_rate).toBe(100);
    expect(m.family_consulted_rate).toBe(100);
    expect(m.dietary_needs_rate).toBe(100);
    expect(m.staff_trained_rate).toBe(100);
    expect(m.community_links_rate).toBe(100);
  });

  it("calculates 50% rates with mixed values", () => {
    const records = [
      makeRecord({ child_views_sought: true }),
      makeRecord({ id: "r2", child_views_sought: false }),
    ];
    const m = computeReligiousCulturalMetrics(records);
    expect(m.child_views_rate).toBe(50);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ id: "r2", child_name: "Alice" }),
      makeRecord({ id: "r3", child_name: "Bob" }),
    ];
    const m = computeReligiousCulturalMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("builds breakdowns correctly", () => {
    const records = [
      makeRecord({ observance_type: "daily_prayer" }),
      makeRecord({ id: "r2", observance_type: "daily_prayer" }),
      makeRecord({ id: "r3", observance_type: "dietary_requirement" }),
    ];
    const m = computeReligiousCulturalMetrics(records);
    expect(m.by_observance_type).toEqual({ daily_prayer: 2, dietary_requirement: 1 });
  });
});

describe("identifyReligiousCulturalAlerts", () => {
  it("returns empty for no data", () => {
    expect(identifyReligiousCulturalAlerts([])).toEqual([]);
  });

  it("critical alert for not_accommodated + unaware", () => {
    const records = [makeRecord({ accommodation_level: "not_accommodated", cultural_sensitivity: "unaware" })];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "not_accommodated_unaware" && a.severity === "critical")).toBe(true);
  });

  it("no critical alert when only one condition met", () => {
    const records = [makeRecord({ accommodation_level: "not_accommodated", cultural_sensitivity: "good" })];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "not_accommodated_unaware")).toBe(false);
  });

  it("high alert when >= 1 dietary needs not met", () => {
    const records = [makeRecord({ dietary_needs_met: false })];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "dietary_needs_not_met" && a.severity === "high")).toBe(true);
  });

  it("high alert when >= 1 family not consulted", () => {
    const records = [makeRecord({ family_consulted: false })];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "family_not_consulted" && a.severity === "high")).toBe(true);
  });

  it("medium alert when >= 2 staff not trained", () => {
    const records = [
      makeRecord({ staff_trained: false }),
      makeRecord({ id: "r2", staff_trained: false }),
    ];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "staff_not_trained" && a.severity === "medium")).toBe(true);
  });

  it("no staff_not_trained alert for exactly 1", () => {
    const records = [makeRecord({ staff_trained: false })];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "staff_not_trained")).toBe(false);
  });

  it("medium alert when >= 2 community links not used", () => {
    const records = [
      makeRecord({ community_links_used: false }),
      makeRecord({ id: "r2", community_links_used: false }),
    ];
    const alerts = identifyReligiousCulturalAlerts(records);
    expect(alerts.some((a) => a.type === "community_links_not_used" && a.severity === "medium")).toBe(true);
  });
});
