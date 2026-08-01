import { describe, it, expect } from "vitest";
import {
  computePeerRelationshipMetrics,
  identifyPeerRelationshipAlerts,
} from "./peer-relationship-assessment-service";
import type { PeerRelationshipAssessmentRecord } from "./peer-relationship-assessment-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PeerRelationshipAssessmentRecord> = {}): PeerRelationshipAssessmentRecord {
  return {
    id: "pra-1",
    home_id: "home-1",
    relationship_quality: "good",
    social_skill_level: "age_appropriate",
    conflict_style: "collaborative",
    friendship_stability: "stable",
    assessment_date: "2026-05-10",
    child_name: "Alex",
    child_id: "child-1",
    assessed_by: "Staff A",
    child_views_sought: true,
    positive_interactions_observed: true,
    bullying_screened: true,
    social_skills_supported: true,
    group_activities_encouraged: true,
    conflict_resolution_taught: true,
    peer_mentoring_available: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    parent_informed: true,
    school_liaison: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computePeerRelationshipMetrics -------------------------------------------

describe("computePeerRelationshipMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePeerRelationshipMetrics([]);
    expect(m.total_assessments).toBe(0);
    expect(m.poor_quality_count).toBe(0);
    expect(m.concerning_quality_count).toBe(0);
    expect(m.no_friendships_count).toBe(0);
    expect(m.aggressive_conflict_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts poor, concerning quality and no friendships", () => {
    const records = [
      makeRecord({ id: "1", relationship_quality: "poor" }),
      makeRecord({ id: "2", relationship_quality: "concerning" }),
      makeRecord({ id: "3", friendship_stability: "no_friendships" }),
      makeRecord({ id: "4", conflict_style: "aggressive" }),
    ];
    const m = computePeerRelationshipMetrics(records);
    expect(m.poor_quality_count).toBe(1);
    expect(m.concerning_quality_count).toBe(1);
    expect(m.no_friendships_count).toBe(1);
    expect(m.aggressive_conflict_count).toBe(1);
  });

  it("calculates boolean rates at 100% when all true", () => {
    const records = [makeRecord({ id: "1" }), makeRecord({ id: "2" })];
    const m = computePeerRelationshipMetrics(records);
    expect(m.child_views_rate).toBe(100);
    expect(m.positive_interactions_rate).toBe(100);
    expect(m.bullying_screened_rate).toBe(100);
    expect(m.social_skills_rate).toBe(100);
    expect(m.conflict_resolution_rate).toBe(100);
  });

  it("calculates rates at 50% when half true", () => {
    const records = [
      makeRecord({ id: "1", child_views_sought: true }),
      makeRecord({ id: "2", child_views_sought: false }),
    ];
    const m = computePeerRelationshipMetrics(records);
    expect(m.child_views_rate).toBe(50);
  });

  it("populates breakdown maps", () => {
    const records = [
      makeRecord({ id: "1", relationship_quality: "good", conflict_style: "collaborative" }),
      makeRecord({ id: "2", relationship_quality: "poor", conflict_style: "aggressive" }),
    ];
    const m = computePeerRelationshipMetrics(records);
    expect(m.by_relationship_quality.good).toBe(1);
    expect(m.by_relationship_quality.poor).toBe(1);
    expect(m.by_conflict_style.collaborative).toBe(1);
    expect(m.by_conflict_style.aggressive).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePeerRelationshipMetrics(records);
    expect(m.unique_children).toBe(2);
  });
});

// -- identifyPeerRelationshipAlerts -------------------------------------------

describe("identifyPeerRelationshipAlerts", () => {
  it("returns empty array when no issues", () => {
    const alerts = identifyPeerRelationshipAlerts([makeRecord()]);
    expect(alerts).toEqual([]);
  });

  it("flags critical concerning_no_bullying_screen", () => {
    const records = [makeRecord({ relationship_quality: "concerning", bullying_screened: false })];
    const alerts = identifyPeerRelationshipAlerts(records);
    const cb = alerts.filter((a) => a.type === "concerning_no_bullying_screen");
    expect(cb.length).toBe(1);
    expect(cb[0].severity).toBe("critical");
  });

  it("does not flag concerning_no_bullying_screen when bullying IS screened", () => {
    const records = [makeRecord({ relationship_quality: "concerning", bullying_screened: true })];
    const alerts = identifyPeerRelationshipAlerts(records);
    const cb = alerts.filter((a) => a.type === "concerning_no_bullying_screen");
    expect(cb.length).toBe(0);
  });

  it("flags high no_friendships when >= 1", () => {
    const records = [makeRecord({ friendship_stability: "no_friendships" })];
    const alerts = identifyPeerRelationshipAlerts(records);
    const nf = alerts.filter((a) => a.type === "no_friendships");
    expect(nf.length).toBe(1);
    expect(nf[0].severity).toBe("high");
  });

  it("flags high social_skills_not_supported when >= 1", () => {
    const records = [makeRecord({ social_skills_supported: false })];
    const alerts = identifyPeerRelationshipAlerts(records);
    const ss = alerts.filter((a) => a.type === "social_skills_not_supported");
    expect(ss.length).toBe(1);
    expect(ss[0].severity).toBe("high");
  });

  it("flags medium conflict_resolution_not_taught when >= 2", () => {
    const records = [
      makeRecord({ id: "1", conflict_resolution_taught: false }),
      makeRecord({ id: "2", conflict_resolution_taught: false }),
    ];
    const alerts = identifyPeerRelationshipAlerts(records);
    const cr = alerts.filter((a) => a.type === "conflict_resolution_not_taught");
    expect(cr.length).toBe(1);
    expect(cr[0].severity).toBe("medium");
  });

  it("does not flag conflict_resolution_not_taught when only 1", () => {
    const records = [makeRecord({ conflict_resolution_taught: false })];
    const alerts = identifyPeerRelationshipAlerts(records);
    const cr = alerts.filter((a) => a.type === "conflict_resolution_not_taught");
    expect(cr.length).toBe(0);
  });

  it("flags medium group_activities_not_encouraged when >= 2", () => {
    const records = [
      makeRecord({ id: "1", group_activities_encouraged: false }),
      makeRecord({ id: "2", group_activities_encouraged: false }),
    ];
    const alerts = identifyPeerRelationshipAlerts(records);
    const ga = alerts.filter((a) => a.type === "group_activities_not_encouraged");
    expect(ga.length).toBe(1);
    expect(ga[0].severity).toBe("medium");
  });
});
