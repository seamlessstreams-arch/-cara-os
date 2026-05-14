import { describe, it, expect } from "vitest";
import { _testing, type FamilyEngagementTrackingRecord } from "../family-engagement-tracking-service";

const { computeFamilyEngagementMetrics, identifyFamilyEngagementAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<FamilyEngagementTrackingRecord>): FamilyEngagementTrackingRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    engagement_type: overrides?.engagement_type ?? "phone_contact",
    family_response: overrides?.family_response ?? "engaged",
    participation_level: overrides?.participation_level ?? "full_participation",
    relationship_quality: overrides?.relationship_quality ?? "good",
    engagement_date: overrides?.engagement_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    family_member_name: overrides?.family_member_name ?? "Mum A",
    facilitated_by: overrides?.facilitated_by ?? "Staff A",
    child_views_sought: overrides?.child_views_sought ?? true,
    child_prepared: overrides?.child_prepared ?? true,
    family_supported: overrides?.family_supported ?? true,
    barriers_identified: overrides?.barriers_identified ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    care_plan_updated: overrides?.care_plan_updated ?? true,
    risk_assessment_current: overrides?.risk_assessment_current ?? true,
    outcome_recorded: overrides?.outcome_recorded ?? true,
    follow_up_planned: overrides?.follow_up_planned ?? true,
    safeguarding_considered: overrides?.safeguarding_considered ?? true,
    court_order_complied: overrides?.court_order_complied ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("family-engagement-tracking-service", () => {
  describe("computeFamilyEngagementMetrics", () => {
    it("returns zeros for empty", () => { const m = computeFamilyEngagementMetrics([]); expect(m.total_engagements).toBe(0); expect(m.disengaged_count).toBe(0); expect(m.hostile_count).toBe(0); expect(m.no_participation_count).toBe(0); expect(m.broken_down_count).toBe(0); expect(m.child_views_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeFamilyEngagementMetrics([]); expect(m.by_engagement_type).toEqual({}); expect(m.by_family_response).toEqual({}); expect(m.by_participation_level).toEqual({}); expect(m.by_relationship_quality).toEqual({}); });
    it("total_engagements counts records", () => { expect(computeFamilyEngagementMetrics([makeRecord(), makeRecord()]).total_engagements).toBe(2); });
    it("counts disengaged", () => { expect(computeFamilyEngagementMetrics([makeRecord({ family_response: "disengaged" })]).disengaged_count).toBe(1); });
    it("counts hostile", () => { expect(computeFamilyEngagementMetrics([makeRecord({ family_response: "hostile" })]).hostile_count).toBe(1); });
    it("does not count variable as disengaged", () => { expect(computeFamilyEngagementMetrics([makeRecord({ family_response: "variable" })]).disengaged_count).toBe(0); });
    it("counts no_participation", () => { expect(computeFamilyEngagementMetrics([makeRecord({ participation_level: "no_participation" })]).no_participation_count).toBe(1); });
    it("counts broken_down", () => { expect(computeFamilyEngagementMetrics([makeRecord({ relationship_quality: "broken_down" })]).broken_down_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeFamilyEngagementMetrics([makeRecord()]); expect(m.child_views_rate).toBe(100); expect(m.child_prepared_rate).toBe(100); expect(m.family_supported_rate).toBe(100); expect(m.barriers_identified_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.risk_assessment_rate).toBe(100); expect(m.outcome_recorded_rate).toBe(100); expect(m.follow_up_rate).toBe(100); expect(m.safeguarding_rate).toBe(100); expect(m.court_order_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_views_rate 0 when false", () => { expect(computeFamilyEngagementMetrics([makeRecord({ child_views_sought: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeFamilyEngagementMetrics([makeRecord({ follow_up_planned: true }), makeRecord({ follow_up_planned: false }), makeRecord({ follow_up_planned: true })]); expect(m.follow_up_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeFamilyEngagementMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 engagement types", () => { const types = ["review_attendance","phone_contact","visit_participation","event_attendance","care_plan_input","email_correspondence","family_meeting","therapeutic_session","informal_contact","other"] as const; const records = types.map(t => makeRecord({ engagement_type: t })); const m = computeFamilyEngagementMetrics(records); for (const t of types) expect(m.by_engagement_type[t]).toBe(1); });
    it("counts all 5 family responses", () => { const responses = ["very_engaged","engaged","variable","disengaged","hostile"] as const; const records = responses.map(r => makeRecord({ family_response: r })); const m = computeFamilyEngagementMetrics(records); for (const r of responses) expect(m.by_family_response[r]).toBe(1); });
    it("counts all 5 participation levels", () => { const levels = ["full_participation","partial_participation","minimal_participation","no_participation","not_applicable"] as const; const records = levels.map(l => makeRecord({ participation_level: l })); const m = computeFamilyEngagementMetrics(records); for (const l of levels) expect(m.by_participation_level[l]).toBe(1); });
    it("counts all 5 relationship qualities", () => { const qualities = ["excellent","good","developing","strained","broken_down"] as const; const records = qualities.map(q => makeRecord({ relationship_quality: q })); const m = computeFamilyEngagementMetrics(records); for (const q of qualities) expect(m.by_relationship_quality[q]).toBe(1); });
  });

  describe("identifyFamilyEngagementAlerts", () => {
    it("returns empty for clean", () => { expect(identifyFamilyEngagementAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyFamilyEngagementAlerts([])).toEqual([]); });
    it("fires hostile_no_safeguarding", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ family_response: "hostile", safeguarding_considered: false, child_name: "Jo", family_member_name: "Dad" })]); expect(a[0].type).toBe("hostile_no_safeguarding"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("Dad"); });
    it("hostile_no_safeguarding per-record", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ id: "a-1", family_response: "hostile", safeguarding_considered: false }), makeRecord({ id: "a-2", family_response: "hostile", safeguarding_considered: false })]); expect(a.filter(x => x.type === "hostile_no_safeguarding")).toHaveLength(2); });
    it("hostile with safeguarding no critical alert", () => { expect(identifyFamilyEngagementAlerts([makeRecord({ family_response: "hostile", safeguarding_considered: true })]).find(x => x.type === "hostile_no_safeguarding")).toBeUndefined(); });
    it("disengaged without safeguarding no critical alert", () => { expect(identifyFamilyEngagementAlerts([makeRecord({ family_response: "disengaged", safeguarding_considered: false })]).find(x => x.type === "hostile_no_safeguarding")).toBeUndefined(); });
    it("fires no_participation singular", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ participation_level: "no_participation" })]); const f = a.find(x => x.type === "no_participation"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 engagement has"); });
    it("no_participation plural", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ participation_level: "no_participation" }), makeRecord({ participation_level: "no_participation" })]); const f = a.find(x => x.type === "no_participation"); expect(f!.message).toContain("2 engagements have"); });
    it("fires child_not_prepared singular", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ child_prepared: false })]); const f = a.find(x => x.type === "child_not_prepared"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 engagement has"); });
    it("follow_up_not_planned not for 1", () => { expect(identifyFamilyEngagementAlerts([makeRecord({ follow_up_planned: false })]).find(x => x.type === "follow_up_not_planned")).toBeUndefined(); });
    it("follow_up_not_planned fires for 2", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ follow_up_planned: false }), makeRecord({ follow_up_planned: false })]); expect(a.find(x => x.type === "follow_up_not_planned")).toBeDefined(); expect(a.find(x => x.type === "follow_up_not_planned")!.severity).toBe("medium"); });
    it("outcome_not_recorded not for 1", () => { expect(identifyFamilyEngagementAlerts([makeRecord({ outcome_recorded: false })]).find(x => x.type === "outcome_not_recorded")).toBeUndefined(); });
    it("outcome_not_recorded fires for 2", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ outcome_recorded: false }), makeRecord({ outcome_recorded: false })]); expect(a.find(x => x.type === "outcome_not_recorded")).toBeDefined(); expect(a.find(x => x.type === "outcome_not_recorded")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyFamilyEngagementAlerts([makeRecord({ family_response: "hostile", safeguarding_considered: false, participation_level: "no_participation", child_prepared: false, follow_up_planned: false, outcome_recorded: false }), makeRecord({ participation_level: "no_participation", child_prepared: false, follow_up_planned: false, outcome_recorded: false })]); const types = a.map(x => x.type); expect(types).toContain("hostile_no_safeguarding"); expect(types).toContain("no_participation"); expect(types).toContain("child_not_prepared"); expect(types).toContain("follow_up_not_planned"); expect(types).toContain("outcome_not_recorded"); });
  });
});
