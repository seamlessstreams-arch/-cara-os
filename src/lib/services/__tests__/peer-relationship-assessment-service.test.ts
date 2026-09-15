import { describe, it, expect } from "vitest";
import { _testing, type PeerRelationshipAssessmentRecord } from "../peer-relationship-assessment-service";
import { todayStr } from "@/lib/utils";

const { computePeerRelationshipMetrics, identifyPeerRelationshipAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<PeerRelationshipAssessmentRecord>): PeerRelationshipAssessmentRecord {
  return {
    id: "a-1", home_id: "home-1",
    relationship_quality: "good",
    social_skill_level: "age_appropriate",
    conflict_style: "collaborative",
    friendship_stability: "stable",
    assessment_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
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
    issues_found: [], actions_taken: [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("peer-relationship-assessment-service", () => {
  describe("computePeerRelationshipMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computePeerRelationshipMetrics([]);
      expect(m.total_assessments).toBe(0);;
      expect(m.poor_quality_count).toBe(0);
      expect(m.concerning_quality_count).toBe(0);
      expect(m.no_friendships_count).toBe(0);
      expect(m.aggressive_conflict_count).toBe(0);
      expect(m.child_views_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computePeerRelationshipMetrics([]);
      expect(m.by_relationship_quality).toEqual({});
      expect(m.by_social_skill_level).toEqual({});
      expect(m.by_conflict_style).toEqual({});
      expect(m.by_friendship_stability).toEqual({});
    });
    it("total_assessments counts records", () => { expect(computePeerRelationshipMetrics([makeRecord(), makeRecord()]).total_assessments).toBe(2); });
    it("counts poor_quality", () => { expect(computePeerRelationshipMetrics([makeRecord({ relationship_quality: "poor" })]).poor_quality_count).toBe(1); });
    it("counts concerning_quality", () => { expect(computePeerRelationshipMetrics([makeRecord({ relationship_quality: "concerning" })]).concerning_quality_count).toBe(1); });
    it("does not count developing as poor", () => { expect(computePeerRelationshipMetrics([makeRecord({ relationship_quality: "developing" })]).poor_quality_count).toBe(0); });
    it("counts no_friendships", () => { expect(computePeerRelationshipMetrics([makeRecord({ friendship_stability: "no_friendships" })]).no_friendships_count).toBe(1); });
    it("counts aggressive_conflict", () => { expect(computePeerRelationshipMetrics([makeRecord({ conflict_style: "aggressive" })]).aggressive_conflict_count).toBe(1); });
    it("does not count escalating as aggressive", () => { expect(computePeerRelationshipMetrics([makeRecord({ conflict_style: "escalating" })]).aggressive_conflict_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computePeerRelationshipMetrics([makeRecord()]);
      expect(m.child_views_rate).toBe(100);
      expect(m.positive_interactions_rate).toBe(100);
      expect(m.bullying_screened_rate).toBe(100);
      expect(m.social_skills_rate).toBe(100);
      expect(m.group_activities_rate).toBe(100);
      expect(m.conflict_resolution_rate).toBe(100);
      expect(m.peer_mentoring_rate).toBe(100);
      expect(m.care_plan_reflects_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.school_liaison_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_views_rate 0 when false", () => { expect(computePeerRelationshipMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computePeerRelationshipMetrics([makeRecord({ bullying_screened: true }), makeRecord({ bullying_screened: false }), makeRecord({ bullying_screened: true })]); expect(m.bullying_screened_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computePeerRelationshipMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 5 relationship qualities", () => { const qualities = ["excellent","good","developing","poor","concerning"] as const; const records = qualities.map(q => makeRecord({ relationship_quality: q })); const m = computePeerRelationshipMetrics(records); for (const q of qualities) expect(m.by_relationship_quality[q]).toBe(1); });
    it("counts all 5 social skill levels", () => { const levels = ["advanced","age_appropriate","developing","below_expected","not_assessed"] as const; const records = levels.map(l => makeRecord({ social_skill_level: l })); const m = computePeerRelationshipMetrics(records); for (const l of levels) expect(m.by_social_skill_level[l]).toBe(1); });
    it("counts all 10 conflict styles", () => { const styles = ["collaborative","compromising","avoidant","aggressive","passive","assertive","manipulative","withdrawn","escalating","other"] as const; const records = styles.map(s => makeRecord({ conflict_style: s })); const m = computePeerRelationshipMetrics(records); for (const s of styles) expect(m.by_conflict_style[s]).toBe(1); });
    it("counts all 5 friendship stabilities", () => { const stabilities = ["very_stable","stable","fluctuating","unstable","no_friendships"] as const; const records = stabilities.map(s => makeRecord({ friendship_stability: s })); const m = computePeerRelationshipMetrics(records); for (const s of stabilities) expect(m.by_friendship_stability[s]).toBe(1); });
  });

  describe("identifyPeerRelationshipAlerts", () => {
    it("returns empty for clean", () => { expect(identifyPeerRelationshipAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyPeerRelationshipAlerts([])).toEqual([]); });
    it("fires concerning_no_bullying_screen", () => { 
      const a = identifyPeerRelationshipAlerts([makeRecord({ relationship_quality: "concerning", bullying_screened: false, child_name: "Jo" })]);
      expect(a[0].type).toBe("concerning_no_bullying_screen");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("concerning_no_bullying_screen per-record", () => { const a = identifyPeerRelationshipAlerts([makeRecord({ id: "a-1", relationship_quality: "concerning", bullying_screened: false }), makeRecord({ id: "a-2", relationship_quality: "concerning", bullying_screened: false })]); expect(a.filter(x => x.type === "concerning_no_bullying_screen")).toHaveLength(2); });
    it("concerning with bullying screened no critical alert", () => { expect(identifyPeerRelationshipAlerts([makeRecord({ relationship_quality: "concerning", bullying_screened: true })]).find(x => x.type === "concerning_no_bullying_screen")).toBeUndefined(); });
    it("poor without screening no critical alert", () => { expect(identifyPeerRelationshipAlerts([makeRecord({ relationship_quality: "poor", bullying_screened: false })]).find(x => x.type === "concerning_no_bullying_screen")).toBeUndefined(); });
    it("fires no_friendships singular", () => { 
      const a = identifyPeerRelationshipAlerts([makeRecord({ friendship_stability: "no_friendships" })]);
      const f = a.find(x => x.type === "no_friendships");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment shows");
    });
    it("no_friendships plural", () => { const a = identifyPeerRelationshipAlerts([makeRecord({ friendship_stability: "no_friendships" }), makeRecord({ friendship_stability: "no_friendships" })]); const f = a.find(x => x.type === "no_friendships"); expect(f!.message).toContain("2 assessments show"); });
    it("fires social_skills_not_supported singular", () => { 
      const a = identifyPeerRelationshipAlerts([makeRecord({ social_skills_supported: false })]);
      const f = a.find(x => x.type === "social_skills_not_supported");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 assessment has");
    });
    it("social_skills_not_supported plural", () => { const a = identifyPeerRelationshipAlerts([makeRecord({ social_skills_supported: false }), makeRecord({ social_skills_supported: false })]); const f = a.find(x => x.type === "social_skills_not_supported"); expect(f!.message).toContain("2 assessments have"); });
    it("conflict_resolution_not_taught not for 1", () => { expect(identifyPeerRelationshipAlerts([makeRecord({ conflict_resolution_taught: false })]).find(x => x.type === "conflict_resolution_not_taught")).toBeUndefined(); });
    it("conflict_resolution_not_taught fires for 2", () => { const a = identifyPeerRelationshipAlerts([makeRecord({ conflict_resolution_taught: false }), makeRecord({ conflict_resolution_taught: false })]); expect(a.find(x => x.type === "conflict_resolution_not_taught")).toBeDefined(); expect(a.find(x => x.type === "conflict_resolution_not_taught")!.severity).toBe("medium"); });
    it("group_activities_not_encouraged not for 1", () => { expect(identifyPeerRelationshipAlerts([makeRecord({ group_activities_encouraged: false })]).find(x => x.type === "group_activities_not_encouraged")).toBeUndefined(); });
    it("group_activities_not_encouraged fires for 2", () => { const a = identifyPeerRelationshipAlerts([makeRecord({ group_activities_encouraged: false }), makeRecord({ group_activities_encouraged: false })]); expect(a.find(x => x.type === "group_activities_not_encouraged")).toBeDefined(); expect(a.find(x => x.type === "group_activities_not_encouraged")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyPeerRelationshipAlerts([makeRecord({ relationship_quality: "concerning", bullying_screened: false, friendship_stability: "no_friendships", social_skills_supported: false, conflict_resolution_taught: false, group_activities_encouraged: false }), makeRecord({ social_skills_supported: false, conflict_resolution_taught: false, group_activities_encouraged: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("concerning_no_bullying_screen");
      expect(types).toContain("no_friendships");
      expect(types).toContain("social_skills_not_supported");
      expect(types).toContain("conflict_resolution_not_taught");
      expect(types).toContain("group_activities_not_encouraged");
    });
  });
});

describe("tri-state judgements", () => {
  it("splits the concerning-relationships critical between recorded no-screen and unrecorded", () => {
    const nullAlert = identifyPeerRelationshipAlerts([
      makeRecord({ relationship_quality: "concerning", bullying_screened: null }),
    ]).find((a) => a.type === "concerning_no_bullying_screen");
    const falseAlert = identifyPeerRelationshipAlerts([
      makeRecord({ relationship_quality: "concerning", bullying_screened: false }),
    ]).find((a) => a.type === "concerning_no_bullying_screen");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });
  it("raises no bullying critical when screening is recorded as done", () => {
    const alerts = identifyPeerRelationshipAlerts([
      makeRecord({ relationship_quality: "concerning", bullying_screened: true }),
    ]);
    expect(alerts.some((a) => a.type === "concerning_no_bullying_screen")).toBe(false);
  });
  it("does not dilute the bullying-screened rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `r-${i}`, bullying_screened: v }));
    expect(computePeerRelationshipMetrics(rows).bullying_screened_rate).toBe(100);
  });
});
