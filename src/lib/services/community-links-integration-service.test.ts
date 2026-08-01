import { describe, it, expect } from "vitest";
import {
  computeCommunityLinksMetrics,
  identifyCommunityLinksAlerts,
  type CommunityLinksIntegrationRecord,
} from "./community-links-integration-service";

function makeRecord(overrides: Partial<CommunityLinksIntegrationRecord> = {}): CommunityLinksIntegrationRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    activity_type: "sports_club",
    engagement_level: "fully_engaged",
    link_status: "active",
    funding_source: "home_budget",
    start_date: "2026-04-01",
    child_name: "Alex Smith",
    child_id: "child-1",
    activity_name: "Football Club",
    provider_name: "Local FC",
    safeguarding_checked: true,
    dbs_verified: true,
    risk_assessed: true,
    consent_obtained: true,
    transport_arranged: true,
    child_chose_activity: true,
    feedback_obtained: true,
    social_worker_informed: true,
    care_plan_linked: true,
    cultural_needs_met: true,
    inclusive_access: true,
    review_scheduled: true,
    issues_found: [],
    actions_taken: [],
    recorded_by: "staff-1",
    next_review_date: "2026-07-01",
    notes: null,
    created_at: "2026-04-01T08:00:00Z",
    updated_at: "2026-04-01T08:00:00Z",
    ...overrides,
  };
}

describe("computeCommunityLinksMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeCommunityLinksMetrics([]);
    expect(m.total_links).toBe(0);
    expect(m.active_count).toBe(0);
    expect(m.safeguarding_checked_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts statuses and engagement levels", () => {
    const records = [
      makeRecord({ id: "r1", link_status: "active", engagement_level: "fully_engaged" }),
      makeRecord({ id: "r2", link_status: "ended", engagement_level: "refused", child_name: "Beth Jones" }),
      makeRecord({ id: "r3", link_status: "waiting_list", engagement_level: "reluctant", child_name: "Chris Lee" }),
    ];
    const m = computeCommunityLinksMetrics(records);
    expect(m.total_links).toBe(3);
    expect(m.active_count).toBe(1);
    expect(m.ended_count).toBe(1);
    expect(m.refused_count).toBe(1);
    expect(m.waiting_list_count).toBe(1);
    expect(m.unique_children).toBe(3);
    expect(m.by_engagement_level.fully_engaged).toBe(1);
    expect(m.by_engagement_level.refused).toBe(1);
  });

  it("computes boolean rates correctly", () => {
    const records = [
      makeRecord({ id: "r1", safeguarding_checked: true, consent_obtained: true }),
      makeRecord({ id: "r2", safeguarding_checked: false, consent_obtained: false }),
    ];
    const m = computeCommunityLinksMetrics(records);
    expect(m.safeguarding_checked_rate).toBe(50);
    expect(m.consent_obtained_rate).toBe(50);
  });

  it("counts by activity type and funding source", () => {
    const records = [
      makeRecord({ id: "r1", activity_type: "sports_club", funding_source: "home_budget" }),
      makeRecord({ id: "r2", activity_type: "sports_club", funding_source: "free_provision" }),
      makeRecord({ id: "r3", activity_type: "music_lessons", funding_source: "home_budget" }),
    ];
    const m = computeCommunityLinksMetrics(records);
    expect(m.by_activity_type.sports_club).toBe(2);
    expect(m.by_activity_type.music_lessons).toBe(1);
    expect(m.by_funding_source.home_budget).toBe(2);
    expect(m.by_funding_source.free_provision).toBe(1);
  });
});

describe("identifyCommunityLinksAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyCommunityLinksAlerts([]);
    expect(alerts).toEqual([]);
  });

  it("flags active link without safeguarding check", () => {
    const records = [makeRecord({ link_status: "active", safeguarding_checked: false })];
    const alerts = identifyCommunityLinksAlerts(records);
    const sgAlerts = alerts.filter((a) => a.type === "active_no_safeguarding");
    expect(sgAlerts).toHaveLength(1);
    expect(sgAlerts[0].severity).toBe("critical");
  });

  it("flags no consent obtained (>=1)", () => {
    const records = [makeRecord({ consent_obtained: false })];
    const alerts = identifyCommunityLinksAlerts(records);
    const consentAlerts = alerts.filter((a) => a.type === "no_consent");
    expect(consentAlerts).toHaveLength(1);
    expect(consentAlerts[0].severity).toBe("high");
  });

  it("flags DBS not verified (>=1)", () => {
    const records = [makeRecord({ dbs_verified: false })];
    const alerts = identifyCommunityLinksAlerts(records);
    const dbsAlerts = alerts.filter((a) => a.type === "dbs_not_verified");
    expect(dbsAlerts).toHaveLength(1);
    expect(dbsAlerts[0].severity).toBe("high");
  });

  it("flags not child chosen (>=2)", () => {
    const records = [
      makeRecord({ id: "r1", child_chose_activity: false }),
      makeRecord({ id: "r2", child_chose_activity: false }),
    ];
    const alerts = identifyCommunityLinksAlerts(records);
    const chosenAlerts = alerts.filter((a) => a.type === "not_child_chosen");
    expect(chosenAlerts).toHaveLength(1);
    expect(chosenAlerts[0].severity).toBe("medium");
  });

  it("does not flag not child chosen with only 1 record", () => {
    const records = [makeRecord({ child_chose_activity: false })];
    const alerts = identifyCommunityLinksAlerts(records);
    const chosenAlerts = alerts.filter((a) => a.type === "not_child_chosen");
    expect(chosenAlerts).toHaveLength(0);
  });

  it("flags cultural needs not met (>=2)", () => {
    const records = [
      makeRecord({ id: "r1", cultural_needs_met: false }),
      makeRecord({ id: "r2", cultural_needs_met: false }),
    ];
    const alerts = identifyCommunityLinksAlerts(records);
    const culturalAlerts = alerts.filter((a) => a.type === "cultural_needs_not_met");
    expect(culturalAlerts).toHaveLength(1);
    expect(culturalAlerts[0].severity).toBe("medium");
  });
});
