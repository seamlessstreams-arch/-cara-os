import { describe, it, expect } from "vitest";
import {
  computeCelebrationMilestonesMetrics,
  identifyCelebrationMilestonesAlerts,
  type CelebrationMilestonesRecord,
} from "./celebration-milestones-service";

function makeRecord(overrides: Partial<CelebrationMilestonesRecord> = {}): CelebrationMilestonesRecord {
  return {
    id: "cm-1",
    home_id: "home-1",
    celebration_type: "birthday",
    recognition_quality: "good",
    child_response: "happy",
    participation_breadth: "whole_home",
    event_date: "2026-04-10",
    child_name: "Lily Adams",
    child_id: "child-1",
    organised_by: "Staff A",
    child_chose_celebration: true,
    culturally_sensitive: true,
    age_appropriate: true,
    photos_consent_obtained: true,
    family_included: true,
    peers_involved: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    budget_approved: true,
    memories_preserved: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-10T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
    ...overrides,
  };
}

describe("computeCelebrationMilestonesMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeCelebrationMilestonesMetrics([]);
    expect(m.total_events).toBe(0);
    expect(m.missed_count).toBe(0);
    expect(m.poor_quality_count).toBe(0);
    expect(m.uncomfortable_count).toBe(0);
    expect(m.child_chose_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts missed and poor quality correctly", () => {
    const records = [
      makeRecord({ id: "1", recognition_quality: "missed" }),
      makeRecord({ id: "2", recognition_quality: "poor" }),
      makeRecord({ id: "3", recognition_quality: "good" }),
    ];
    const m = computeCelebrationMilestonesMetrics(records);
    expect(m.missed_count).toBe(1);
    expect(m.poor_quality_count).toBe(2); // poor + missed
  });

  it("counts uncomfortable responses", () => {
    const records = [
      makeRecord({ id: "1", child_response: "uncomfortable" }),
      makeRecord({ id: "2", child_response: "upset" }),
      makeRecord({ id: "3", child_response: "happy" }),
    ];
    const m = computeCelebrationMilestonesMetrics(records);
    expect(m.uncomfortable_count).toBe(2);
  });

  it("calculates boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "1", child_chose_celebration: true, memories_preserved: true }),
      makeRecord({ id: "2", child_chose_celebration: false, memories_preserved: false }),
    ];
    const m = computeCelebrationMilestonesMetrics(records);
    expect(m.child_chose_rate).toBe(50);
    expect(m.memories_preserved_rate).toBe(50);
  });

  it("builds breakdown records by type, quality, response, breadth", () => {
    const records = [
      makeRecord({ id: "1", celebration_type: "birthday", recognition_quality: "good" }),
      makeRecord({ id: "2", celebration_type: "birthday", recognition_quality: "poor" }),
      makeRecord({ id: "3", celebration_type: "academic_achievement", recognition_quality: "good" }),
    ];
    const m = computeCelebrationMilestonesMetrics(records);
    expect(m.by_celebration_type["birthday"]).toBe(2);
    expect(m.by_celebration_type["academic_achievement"]).toBe(1);
    expect(m.by_recognition_quality["good"]).toBe(2);
    expect(m.by_recognition_quality["poor"]).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Lily" }),
      makeRecord({ id: "2", child_name: "Lily" }),
      makeRecord({ id: "3", child_name: "Sam" }),
    ];
    const m = computeCelebrationMilestonesMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

describe("identifyCelebrationMilestonesAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyCelebrationMilestonesAlerts([])).toEqual([]);
  });

  it("fires critical alert for missed + upset", () => {
    const records = [makeRecord({ recognition_quality: "missed", child_response: "upset" })];
    const alerts = identifyCelebrationMilestonesAlerts(records);
    const mu = alerts.filter((a) => a.type === "missed_upset");
    expect(mu.length).toBe(1);
    expect(mu[0].severity).toBe("critical");
  });

  it("fires high alert for no child choice >= 1", () => {
    const records = [makeRecord({ child_chose_celebration: false })];
    const alerts = identifyCelebrationMilestonesAlerts(records);
    const nc = alerts.filter((a) => a.type === "no_child_choice");
    expect(nc.length).toBe(1);
    expect(nc[0].severity).toBe("high");
  });

  it("fires high alert for not culturally sensitive >= 1", () => {
    const records = [makeRecord({ culturally_sensitive: false })];
    const alerts = identifyCelebrationMilestonesAlerts(records);
    const ncs = alerts.filter((a) => a.type === "not_culturally_sensitive");
    expect(ncs.length).toBe(1);
    expect(ncs[0].severity).toBe("high");
  });

  it("fires medium alert for no memories preserved >= 2", () => {
    const records = [
      makeRecord({ id: "1", memories_preserved: false }),
      makeRecord({ id: "2", memories_preserved: false }),
    ];
    const alerts = identifyCelebrationMilestonesAlerts(records);
    const nm = alerts.filter((a) => a.type === "no_memories_preserved");
    expect(nm.length).toBe(1);
    expect(nm[0].severity).toBe("medium");
  });

  it("does NOT fire no_memories_preserved for only 1 record", () => {
    const records = [makeRecord({ memories_preserved: false })];
    const alerts = identifyCelebrationMilestonesAlerts(records);
    expect(alerts.filter((a) => a.type === "no_memories_preserved").length).toBe(0);
  });

  it("fires medium alert for no family included >= 2", () => {
    const records = [
      makeRecord({ id: "1", family_included: false }),
      makeRecord({ id: "2", family_included: false }),
    ];
    const alerts = identifyCelebrationMilestonesAlerts(records);
    const nf = alerts.filter((a) => a.type === "no_family_included");
    expect(nf.length).toBe(1);
    expect(nf[0].severity).toBe("medium");
  });
});
