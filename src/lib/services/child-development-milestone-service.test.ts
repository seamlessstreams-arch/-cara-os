import { describe, it, expect } from "vitest";
import {
  computeChildDevelopmentMetrics,
  identifyChildDevelopmentAlerts,
  type ChildDevelopmentMilestoneRecord,
} from "./child-development-milestone-service";

function makeRecord(overrides: Partial<ChildDevelopmentMilestoneRecord> = {}): ChildDevelopmentMilestoneRecord {
  return {
    id: "dev-1",
    home_id: "home-1",
    developmental_domain: "cognitive",
    achievement_status: "met",
    support_level: "minimal_support",
    progress_rating: "good_progress",
    assessment_date: "2026-04-01",
    child_name: "Rosie Clark",
    child_id: "child-1",
    assessed_by: "Staff A",
    child_views_included: true,
    age_appropriate_targets: true,
    care_plan_linked: true,
    school_input_obtained: true,
    specialist_input_obtained: false,
    parent_informed: true,
    social_worker_informed: true,
    celebration_of_achievement: true,
    next_steps_identified: true,
    resources_in_place: true,
    multi_agency_coordinated: false,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

describe("computeChildDevelopmentMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computeChildDevelopmentMetrics([]);
    expect(m.total_milestones).toBe(0);
    expect(m.not_met_count).toBe(0);
    expect(m.regressed_count).toBe(0);
    expect(m.intensive_support_count).toBe(0);
    expect(m.no_progress_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts status fields correctly", () => {
    const records = [
      makeRecord({ id: "1", achievement_status: "not_met", support_level: "intensive_support", progress_rating: "no_progress" }),
      makeRecord({ id: "2", achievement_status: "regressed" }),
      makeRecord({ id: "3", achievement_status: "met" }),
    ];
    const m = computeChildDevelopmentMetrics(records);
    expect(m.not_met_count).toBe(1);
    expect(m.regressed_count).toBe(1);
    expect(m.intensive_support_count).toBe(1);
    expect(m.no_progress_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const records = [
      makeRecord({ id: "1", child_views_included: true, next_steps_identified: true }),
      makeRecord({ id: "2", child_views_included: false, next_steps_identified: false }),
    ];
    const m = computeChildDevelopmentMetrics(records);
    expect(m.child_views_rate).toBe(50);
    expect(m.next_steps_rate).toBe(50);
  });

  it("builds breakdown records", () => {
    const records = [
      makeRecord({ id: "1", developmental_domain: "cognitive", achievement_status: "met" }),
      makeRecord({ id: "2", developmental_domain: "cognitive", achievement_status: "not_met" }),
      makeRecord({ id: "3", developmental_domain: "social_emotional", achievement_status: "met" }),
    ];
    const m = computeChildDevelopmentMetrics(records);
    expect(m.by_developmental_domain["cognitive"]).toBe(2);
    expect(m.by_developmental_domain["social_emotional"]).toBe(1);
    expect(m.by_achievement_status["met"]).toBe(2);
    expect(m.by_achievement_status["not_met"]).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Rosie" }),
      makeRecord({ id: "2", child_name: "Rosie" }),
      makeRecord({ id: "3", child_name: "Tom" }),
    ];
    const m = computeChildDevelopmentMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

describe("identifyChildDevelopmentAlerts", () => {
  it("returns no alerts for empty records", () => {
    expect(identifyChildDevelopmentAlerts([])).toEqual([]);
  });

  it("fires critical alert for regressed without specialist input", () => {
    const records = [makeRecord({ achievement_status: "regressed", specialist_input_obtained: false })];
    const alerts = identifyChildDevelopmentAlerts(records);
    const rns = alerts.filter((a) => a.type === "regressed_no_specialist");
    expect(rns.length).toBe(1);
    expect(rns[0].severity).toBe("critical");
  });

  it("does NOT fire regressed_no_specialist when specialist input obtained", () => {
    const records = [makeRecord({ achievement_status: "regressed", specialist_input_obtained: true })];
    const alerts = identifyChildDevelopmentAlerts(records);
    expect(alerts.filter((a) => a.type === "regressed_no_specialist").length).toBe(0);
  });

  it("fires high alert for no progress >= 1", () => {
    const records = [makeRecord({ progress_rating: "no_progress" })];
    const alerts = identifyChildDevelopmentAlerts(records);
    const np = alerts.filter((a) => a.type === "no_progress");
    expect(np.length).toBe(1);
    expect(np[0].severity).toBe("high");
  });

  it("fires high alert for no next steps >= 1", () => {
    const records = [makeRecord({ next_steps_identified: false })];
    const alerts = identifyChildDevelopmentAlerts(records);
    const nns = alerts.filter((a) => a.type === "no_next_steps");
    expect(nns.length).toBe(1);
    expect(nns[0].severity).toBe("high");
  });

  it("fires medium alert for achievement not celebrated >= 2", () => {
    const records = [
      makeRecord({ id: "1", celebration_of_achievement: false }),
      makeRecord({ id: "2", celebration_of_achievement: false }),
    ];
    const alerts = identifyChildDevelopmentAlerts(records);
    const anc = alerts.filter((a) => a.type === "achievement_not_celebrated");
    expect(anc.length).toBe(1);
    expect(anc[0].severity).toBe("medium");
  });

  it("does NOT fire achievement_not_celebrated for only 1 record", () => {
    const records = [makeRecord({ celebration_of_achievement: false })];
    const alerts = identifyChildDevelopmentAlerts(records);
    expect(alerts.filter((a) => a.type === "achievement_not_celebrated").length).toBe(0);
  });

  it("fires medium alert for resources not in place >= 2", () => {
    const records = [
      makeRecord({ id: "1", resources_in_place: false }),
      makeRecord({ id: "2", resources_in_place: false }),
    ];
    const alerts = identifyChildDevelopmentAlerts(records);
    const rnip = alerts.filter((a) => a.type === "resources_not_in_place");
    expect(rnip.length).toBe(1);
    expect(rnip[0].severity).toBe("medium");
  });
});
