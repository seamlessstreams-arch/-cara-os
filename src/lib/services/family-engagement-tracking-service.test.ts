import { describe, it, expect } from "vitest";
import {
  computeFamilyEngagementMetrics,
  identifyFamilyEngagementAlerts,
  type FamilyEngagementTrackingRecord,
} from "./family-engagement-tracking-service";

function makeRecord(overrides: Partial<FamilyEngagementTrackingRecord> = {}): FamilyEngagementTrackingRecord {
  return {
    id: "fet-1",
    home_id: "home-1",
    engagement_type: "review_attendance",
    family_response: "engaged",
    participation_level: "full_participation",
    relationship_quality: "good",
    engagement_date: "2026-05-01",
    child_name: "Child A",
    child_id: "child-1",
    family_member_name: "Parent A",
    facilitated_by: "Staff A",
    child_views_sought: true,
    child_prepared: true,
    family_supported: true,
    barriers_identified: false,
    social_worker_informed: true,
    care_plan_updated: true,
    risk_assessment_current: true,
    outcome_recorded: true,
    follow_up_planned: true,
    safeguarding_considered: true,
    court_order_complied: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeFamilyEngagementMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeFamilyEngagementMetrics([]);
    expect(m.total_engagements).toBe(0);
    expect(m.disengaged_count).toBe(0);
    expect(m.hostile_count).toBe(0);
    expect(m.no_participation_count).toBe(0);
    expect(m.broken_down_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.child_prepared_rate).toBeNull();;
    expect(m.family_supported_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes correct counts and rates for populated data", () => {
    const records: FamilyEngagementTrackingRecord[] = [
      makeRecord({ id: "r1", family_response: "hostile", safeguarding_considered: false, child_prepared: false }),
      makeRecord({ id: "r2", family_response: "disengaged", participation_level: "no_participation", relationship_quality: "broken_down", child_name: "Child B" }),
      makeRecord({ id: "r3", family_response: "engaged", outcome_recorded: false, follow_up_planned: false }),
      makeRecord({ id: "r4", child_views_sought: false }),
    ];
    const m = computeFamilyEngagementMetrics(records);
    expect(m.total_engagements).toBe(4);
    expect(m.disengaged_count).toBe(1);
    expect(m.hostile_count).toBe(1);
    expect(m.no_participation_count).toBe(1);
    expect(m.broken_down_count).toBe(1);
    // child_views_rate: 3/4 = 75%
    expect(m.child_views_rate).toBe(75);
    // child_prepared: 3/4 = 75%
    expect(m.child_prepared_rate).toBe(75);
    // family_supported: 4/4 = 100%
    expect(m.family_supported_rate).toBe(100);
    // outcome_recorded: 3/4 = 75%
    expect(m.outcome_recorded_rate).toBe(75);
    // follow_up: 3/4 = 75%
    expect(m.follow_up_rate).toBe(75);
    // unique children: Child A, Child B
    expect(m.unique_children).toBe(2);
    // breakdowns
    expect(m.by_family_response["hostile"]).toBe(1);
    expect(m.by_family_response["disengaged"]).toBe(1);
    expect(m.by_participation_level["no_participation"]).toBe(1);
    expect(m.by_relationship_quality["broken_down"]).toBe(1);
  });
});

describe("identifyFamilyEngagementAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyFamilyEngagementAlerts([])).toEqual([]);
  });

  it("generates critical alert for hostile family without safeguarding consideration", () => {
    const records = [makeRecord({ family_response: "hostile", safeguarding_considered: false })];
    const alerts = identifyFamilyEngagementAlerts(records);
    const hostile = alerts.filter((a) => a.type === "hostile_no_safeguarding");
    expect(hostile).toHaveLength(1);
    expect(hostile[0].severity).toBe("critical");
    expect(hostile[0].message).toContain("Child A");
  });

  it("generates high alert when >= 1 engagement has no participation", () => {
    const records = [makeRecord({ participation_level: "no_participation" })];
    const alerts = identifyFamilyEngagementAlerts(records);
    const noPart = alerts.filter((a) => a.type === "no_participation");
    expect(noPart).toHaveLength(1);
    expect(noPart[0].severity).toBe("high");
  });

  it("generates high alert when >= 1 engagement has child not prepared", () => {
    const records = [makeRecord({ child_prepared: false })];
    const alerts = identifyFamilyEngagementAlerts(records);
    const notPrep = alerts.filter((a) => a.type === "child_not_prepared");
    expect(notPrep).toHaveLength(1);
    expect(notPrep[0].severity).toBe("high");
  });

  it("generates medium alert when >= 2 engagements without follow-up planned", () => {
    const records = [
      makeRecord({ id: "r1", follow_up_planned: false }),
      makeRecord({ id: "r2", follow_up_planned: false }),
    ];
    const alerts = identifyFamilyEngagementAlerts(records);
    const noFollowUp = alerts.filter((a) => a.type === "follow_up_not_planned");
    expect(noFollowUp).toHaveLength(1);
    expect(noFollowUp[0].severity).toBe("medium");
  });

  it("generates medium alert when >= 2 engagements without outcome recorded", () => {
    const records = [
      makeRecord({ id: "r1", outcome_recorded: false }),
      makeRecord({ id: "r2", outcome_recorded: false }),
    ];
    const alerts = identifyFamilyEngagementAlerts(records);
    const noOutcome = alerts.filter((a) => a.type === "outcome_not_recorded");
    expect(noOutcome).toHaveLength(1);
    expect(noOutcome[0].severity).toBe("medium");
  });

  it("does not trigger medium alerts when only 1 lacks follow-up", () => {
    const records = [
      makeRecord({ id: "r1", follow_up_planned: false }),
      makeRecord({ id: "r2", follow_up_planned: true }),
    ];
    const alerts = identifyFamilyEngagementAlerts(records);
    expect(alerts.filter((a) => a.type === "follow_up_not_planned")).toHaveLength(0);
  });
});
