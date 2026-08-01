import { describe, it, expect } from "vitest";
import {
  computeAchievementMetrics,
  identifyAchievementAlerts,
} from "./childrens-achievements-service";
import type { Achievement } from "./childrens-achievements-service";

// -- Factory -------------------------------------------------------------------

function makeRecord(overrides: Partial<Achievement> = {}): Achievement {
  return {
    id: "ach-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    achievement_date: "2026-05-20",
    category: "academic",
    title: "Maths award",
    description: "Achieved top marks in maths",
    significance: "notable",
    celebrations: ["verbal_praise", "certificate"],
    recorded_by: "Staff A",
    child_views: "I felt proud",
    child_proud: true,
    shared_with_family: true,
    shared_with_social_worker: true,
    added_to_life_story: true,
    photograph_taken: true,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeAchievementMetrics -------------------------------------------------

describe("computeAchievementMetrics", () => {
  it("returns zeroed metrics for empty data", () => {
    const m = computeAchievementMetrics([], 5);
    expect(m.total_achievements).toBe(0);
    expect(m.children_with_achievements).toBe(0);
    expect(m.achievement_coverage).toBe(0);
    expect(m.average_per_child).toBeNull();; });

  it("counts significance levels", () => {
    const rows = [
      makeRecord({ id: "1", significance: "exceptional" }),
      makeRecord({ id: "2", significance: "significant" }),
      makeRecord({ id: "3", significance: "notable" }),
      makeRecord({ id: "4", significance: "everyday" }),
    ];
    const m = computeAchievementMetrics(rows, 4);
    expect(m.exceptional_count).toBe(1);
    expect(m.significant_count).toBe(1);
    expect(m.notable_count).toBe(1);
    expect(m.everyday_count).toBe(1);
  });

  it("calculates achievement coverage", () => {
    const rows = [
      makeRecord({ id: "1", child_id: "c1" }),
      makeRecord({ id: "2", child_id: "c2" }),
    ];
    const m = computeAchievementMetrics(rows, 4);
    expect(m.children_with_achievements).toBe(2);
    expect(m.achievement_coverage).toBe(50);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRecord({ id: "1", shared_with_family: true, photograph_taken: true }),
      makeRecord({ id: "2", shared_with_family: false, photograph_taken: false }),
    ];
    const m = computeAchievementMetrics(rows, 2);
    expect(m.shared_with_family_rate).toBe(50);
    expect(m.photograph_rate).toBe(50);
  });

  it("calculates child_views_rate based on non-null values", () => {
    const rows = [
      makeRecord({ id: "1", child_views: "Great!" }),
      makeRecord({ id: "2", child_views: null }),
    ];
    const m = computeAchievementMetrics(rows, 2);
    expect(m.child_views_rate).toBe(50);
  });

  it("calculates average per child", () => {
    const rows = [
      makeRecord({ id: "1", child_id: "c1" }),
      makeRecord({ id: "2", child_id: "c1" }),
      makeRecord({ id: "3", child_id: "c2" }),
    ];
    const m = computeAchievementMetrics(rows, 2);
    expect(m.average_per_child).toBe(1.5);
  });

  it("builds by_celebration breakdown from arrays", () => {
    const rows = [
      makeRecord({ id: "1", celebrations: ["verbal_praise", "certificate"] }),
      makeRecord({ id: "2", celebrations: ["verbal_praise"] }),
    ];
    const m = computeAchievementMetrics(rows, 2);
    expect(m.by_celebration).toEqual({ verbal_praise: 2, certificate: 1 });
  });
});

// -- identifyAchievementAlerts -------------------------------------------------

describe("identifyAchievementAlerts", () => {
  it("returns no alerts for empty data with zero total children", () => {
    expect(identifyAchievementAlerts([], 0)).toEqual([]);
  });

  it("high: children with no achievements recorded", () => {
    const rows = [makeRecord({ id: "1", child_id: "c1" })];
    const alerts = identifyAchievementAlerts(rows, 3);
    const matched = alerts.filter((a) => a.type === "no_achievements");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("high");
    expect(matched[0].message).toContain("2 children have no achievements");
  });

  it("medium: notable achievements not shared with family (threshold >= 3)", () => {
    // significance must not be "everyday" for this alert
    const rows = [
      makeRecord({ id: "1", shared_with_family: false, significance: "notable" }),
      makeRecord({ id: "2", shared_with_family: false, significance: "significant" }),
      makeRecord({ id: "3", shared_with_family: false, significance: "exceptional" }),
    ];
    const alerts = identifyAchievementAlerts(rows, 3);
    const matched = alerts.filter((a) => a.type === "not_shared_family");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("medium: significant achievements not in life story (threshold >= 2)", () => {
    const rows = [
      makeRecord({ id: "1", added_to_life_story: false, significance: "exceptional" }),
      makeRecord({ id: "2", added_to_life_story: false, significance: "significant" }),
    ];
    const alerts = identifyAchievementAlerts(rows, 2);
    const matched = alerts.filter((a) => a.type === "not_in_life_story");
    expect(matched).toHaveLength(1);
    expect(matched[0].severity).toBe("medium");
  });

  it("medium: low recording for a specific child (1 achievement when total > 5)", () => {
    const rows = [
      makeRecord({ id: "1", child_name: "Alex", child_id: "c1" }),
      makeRecord({ id: "2", child_name: "Jordan", child_id: "c2" }),
      makeRecord({ id: "3", child_name: "Jordan", child_id: "c2" }),
      makeRecord({ id: "4", child_name: "Jordan", child_id: "c2" }),
      makeRecord({ id: "5", child_name: "Jordan", child_id: "c2" }),
      makeRecord({ id: "6", child_name: "Jordan", child_id: "c2" }),
    ];
    const alerts = identifyAchievementAlerts(rows, 2);
    const matched = alerts.filter((a) => a.type === "low_recording");
    expect(matched).toHaveLength(1);
    expect(matched[0].message).toContain("Alex");
  });

  it("no low_recording alert when total achievements <= 5", () => {
    const rows = [
      makeRecord({ id: "1", child_name: "Alex", child_id: "c1" }),
      makeRecord({ id: "2", child_name: "Jordan", child_id: "c2" }),
    ];
    const alerts = identifyAchievementAlerts(rows, 2);
    expect(alerts.filter((a) => a.type === "low_recording")).toHaveLength(0);
  });
});
