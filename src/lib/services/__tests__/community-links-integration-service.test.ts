import { describe, it, expect } from "vitest";
import { _testing, type CommunityLinksIntegrationRecord } from "../community-links-integration-service";
import { todayStr } from "@/lib/utils";

const { computeCommunityLinksMetrics, identifyCommunityLinksAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<CommunityLinksIntegrationRecord>): CommunityLinksIntegrationRecord {
  return {
    id: "a-1", home_id: "home-1",
    activity_type: "sports_club",
    engagement_level: "fully_engaged",
    link_status: "active",
    funding_source: "home_budget",
    start_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
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
    issues_found: [], actions_taken: [],
    recorded_by: "Manager A",
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("community-links-integration-service", () => {
  describe("computeCommunityLinksMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeCommunityLinksMetrics([]);
      expect(m.total_links).toBe(0);;
      expect(m.active_count).toBe(0);
      expect(m.ended_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.waiting_list_count).toBe(0);
      expect(m.safeguarding_checked_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeCommunityLinksMetrics([]);
      expect(m.by_activity_type).toEqual({});
      expect(m.by_engagement_level).toEqual({});
      expect(m.by_link_status).toEqual({});
      expect(m.by_funding_source).toEqual({});
    });
    it("counts active", () => { expect(computeCommunityLinksMetrics([makeRecord()]).active_count).toBe(1); });
    it("counts ended", () => { expect(computeCommunityLinksMetrics([makeRecord({ link_status: "ended" })]).ended_count).toBe(1); });
    it("counts refused from engagement_level", () => { expect(computeCommunityLinksMetrics([makeRecord({ engagement_level: "refused" })]).refused_count).toBe(1); });
    it("counts waiting_list", () => { expect(computeCommunityLinksMetrics([makeRecord({ link_status: "waiting_list" })]).waiting_list_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeCommunityLinksMetrics([makeRecord()]);
      expect(m.safeguarding_checked_rate).toBe(100);
      expect(m.dbs_verified_rate).toBe(100);
      expect(m.risk_assessed_rate).toBe(100);
      expect(m.consent_obtained_rate).toBe(100);
      expect(m.transport_arranged_rate).toBe(100);
      expect(m.child_chose_rate).toBe(100);
      expect(m.feedback_obtained_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.care_plan_linked_rate).toBe(100);
      expect(m.cultural_needs_rate).toBe(100);
      expect(m.inclusive_access_rate).toBe(100);
      expect(m.review_scheduled_rate).toBe(100);
    });
    it("safeguarding_checked_rate 0 when false", () => { expect(computeCommunityLinksMetrics([makeRecord({ safeguarding_checked: false })]).safeguarding_checked_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeCommunityLinksMetrics([makeRecord({ safeguarding_checked: true }), makeRecord({ safeguarding_checked: false }), makeRecord({ safeguarding_checked: true })]); expect(m.safeguarding_checked_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeCommunityLinksMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 activity types", () => { const types = ["sports_club","youth_group","arts_culture","music_lessons","religious_group","volunteering","library_reading","scouts_guides","drama_dance","other"] as const; const records = types.map(t => makeRecord({ activity_type: t })); const m = computeCommunityLinksMetrics(records); for (const t of types) expect(m.by_activity_type[t]).toBe(1); });
    it("counts all 5 engagement levels", () => { const levels = ["fully_engaged","partially_engaged","reluctant","refused","not_assessed"] as const; const records = levels.map(l => makeRecord({ engagement_level: l })); const m = computeCommunityLinksMetrics(records); for (const l of levels) expect(m.by_engagement_level[l]).toBe(1); });
    it("counts all 5 link statuses", () => { const statuses = ["active","paused","ended","waiting_list","trial_period"] as const; const records = statuses.map(s => makeRecord({ link_status: s })); const m = computeCommunityLinksMetrics(records); for (const s of statuses) expect(m.by_link_status[s]).toBe(1); });
    it("counts all 5 funding sources", () => { const sources = ["home_budget","local_authority","charitable_grant","free_provision","self_funded"] as const; const records = sources.map(s => makeRecord({ funding_source: s })); const m = computeCommunityLinksMetrics(records); for (const s of sources) expect(m.by_funding_source[s]).toBe(1); });
    it("total_links counts all", () => { expect(computeCommunityLinksMetrics([makeRecord(), makeRecord(), makeRecord()]).total_links).toBe(3); });
  });

  describe("identifyCommunityLinksAlerts", () => {
    it("returns empty for clean", () => { expect(identifyCommunityLinksAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyCommunityLinksAlerts([])).toEqual([]); });
    it("fires active_no_safeguarding", () => { 
      const a = identifyCommunityLinksAlerts([makeRecord({ link_status: "active", safeguarding_checked: false, child_name: "Jo", activity_name: "Scouts" })]);
      expect(a[0].type).toBe("active_no_safeguarding");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("Scouts");
    });
    it("active_no_safeguarding per-record", () => { const a = identifyCommunityLinksAlerts([makeRecord({ id: "a-1", link_status: "active", safeguarding_checked: false }), makeRecord({ id: "a-2", link_status: "active", safeguarding_checked: false })]); expect(a.filter(x => x.type === "active_no_safeguarding")).toHaveLength(2); });
    it("no alert if active with safeguarding", () => { expect(identifyCommunityLinksAlerts([makeRecord({ link_status: "active", safeguarding_checked: true })]).filter(x => x.type === "active_no_safeguarding")).toHaveLength(0); });
    it("fires no_consent singular", () => { 
      const a = identifyCommunityLinksAlerts([makeRecord({ consent_obtained: false })]);
      const f = a.find(x => x.type === "no_consent");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 community link has");
    });
    it("no_consent plural", () => { const a = identifyCommunityLinksAlerts([makeRecord({ consent_obtained: false }), makeRecord({ consent_obtained: false })]); const f = a.find(x => x.type === "no_consent"); expect(f!.message).toContain("2 community links have"); });
    it("fires dbs_not_verified singular", () => { 
      const a = identifyCommunityLinksAlerts([makeRecord({ dbs_verified: false })]);
      const f = a.find(x => x.type === "dbs_not_verified");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 community link has");
    });
    it("dbs_not_verified plural", () => { const a = identifyCommunityLinksAlerts([makeRecord({ dbs_verified: false }), makeRecord({ dbs_verified: false })]); const f = a.find(x => x.type === "dbs_not_verified"); expect(f!.message).toContain("2 community links have"); });
    it("not_child_chosen not for 1", () => { expect(identifyCommunityLinksAlerts([makeRecord({ child_chose_activity: false })]).find(x => x.type === "not_child_chosen")).toBeUndefined(); });
    it("not_child_chosen fires for 2", () => { const a = identifyCommunityLinksAlerts([makeRecord({ child_chose_activity: false }), makeRecord({ child_chose_activity: false })]); expect(a.find(x => x.type === "not_child_chosen")).toBeDefined(); });
    it("cultural_needs_not_met not for 1", () => { expect(identifyCommunityLinksAlerts([makeRecord({ cultural_needs_met: false })]).find(x => x.type === "cultural_needs_not_met")).toBeUndefined(); });
    it("cultural_needs_not_met fires for 2", () => { const a = identifyCommunityLinksAlerts([makeRecord({ cultural_needs_met: false }), makeRecord({ cultural_needs_met: false })]); expect(a.find(x => x.type === "cultural_needs_not_met")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyCommunityLinksAlerts([makeRecord({ link_status: "active", safeguarding_checked: false, consent_obtained: false, dbs_verified: false, child_chose_activity: false, cultural_needs_met: false }), makeRecord({ child_chose_activity: false, cultural_needs_met: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("active_no_safeguarding");
      expect(types).toContain("no_consent");
      expect(types).toContain("dbs_not_verified");
      expect(types).toContain("not_child_chosen");
      expect(types).toContain("cultural_needs_not_met");
    });
  });
});
