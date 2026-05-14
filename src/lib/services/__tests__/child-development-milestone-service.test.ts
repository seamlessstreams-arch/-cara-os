import { describe, it, expect } from "vitest";
import { _testing, type ChildDevelopmentMilestoneRecord } from "../child-development-milestone-service";

const { computeChildDevelopmentMetrics, identifyChildDevelopmentAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<ChildDevelopmentMilestoneRecord>): ChildDevelopmentMilestoneRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    developmental_domain: overrides?.developmental_domain ?? "cognitive",
    achievement_status: overrides?.achievement_status ?? "met",
    support_level: overrides?.support_level ?? "minimal_support",
    progress_rating: overrides?.progress_rating ?? "good_progress",
    assessment_date: overrides?.assessment_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    assessed_by: overrides?.assessed_by ?? "Staff A",
    child_views_included: overrides?.child_views_included ?? true,
    age_appropriate_targets: overrides?.age_appropriate_targets ?? true,
    care_plan_linked: overrides?.care_plan_linked ?? true,
    school_input_obtained: overrides?.school_input_obtained ?? true,
    specialist_input_obtained: overrides?.specialist_input_obtained ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    celebration_of_achievement: overrides?.celebration_of_achievement ?? true,
    next_steps_identified: overrides?.next_steps_identified ?? true,
    resources_in_place: overrides?.resources_in_place ?? true,
    multi_agency_coordinated: overrides?.multi_agency_coordinated ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("child-development-milestone-service", () => {
  describe("computeChildDevelopmentMetrics", () => {
    it("returns zeros for empty", () => { const m = computeChildDevelopmentMetrics([]); expect(m.total_milestones).toBe(0); expect(m.not_met_count).toBe(0); expect(m.regressed_count).toBe(0); expect(m.intensive_support_count).toBe(0); expect(m.no_progress_count).toBe(0); expect(m.child_views_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeChildDevelopmentMetrics([]); expect(m.by_developmental_domain).toEqual({}); expect(m.by_achievement_status).toEqual({}); expect(m.by_support_level).toEqual({}); expect(m.by_progress_rating).toEqual({}); });
    it("total_milestones counts records", () => { expect(computeChildDevelopmentMetrics([makeRecord(), makeRecord()]).total_milestones).toBe(2); });
    it("counts not_met", () => { expect(computeChildDevelopmentMetrics([makeRecord({ achievement_status: "not_met" })]).not_met_count).toBe(1); });
    it("counts regressed", () => { expect(computeChildDevelopmentMetrics([makeRecord({ achievement_status: "regressed" })]).regressed_count).toBe(1); });
    it("does not count progressing as not_met", () => { expect(computeChildDevelopmentMetrics([makeRecord({ achievement_status: "progressing" })]).not_met_count).toBe(0); });
    it("counts intensive_support", () => { expect(computeChildDevelopmentMetrics([makeRecord({ support_level: "intensive_support" })]).intensive_support_count).toBe(1); });
    it("counts no_progress", () => { expect(computeChildDevelopmentMetrics([makeRecord({ progress_rating: "no_progress" })]).no_progress_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeChildDevelopmentMetrics([makeRecord()]); expect(m.child_views_rate).toBe(100); expect(m.age_appropriate_rate).toBe(100); expect(m.care_plan_linked_rate).toBe(100); expect(m.school_input_rate).toBe(100); expect(m.specialist_input_rate).toBe(100); expect(m.parent_informed_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.celebration_rate).toBe(100); expect(m.next_steps_rate).toBe(100); expect(m.resources_rate).toBe(100); expect(m.multi_agency_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_views_rate 0 when false", () => { expect(computeChildDevelopmentMetrics([makeRecord({ child_views_included: false })]).child_views_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeChildDevelopmentMetrics([makeRecord({ celebration_of_achievement: true }), makeRecord({ celebration_of_achievement: false }), makeRecord({ celebration_of_achievement: true })]); expect(m.celebration_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeChildDevelopmentMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 developmental domains", () => { const domains = ["cognitive","language_communication","physical_motor","social_emotional","self_care","play_creativity","moral_spiritual","identity_belonging","resilience","other"] as const; const records = domains.map(d => makeRecord({ developmental_domain: d })); const m = computeChildDevelopmentMetrics(records); for (const d of domains) expect(m.by_developmental_domain[d]).toBe(1); });
    it("counts all 5 achievement statuses", () => { const statuses = ["exceeded","met","progressing","not_met","regressed"] as const; const records = statuses.map(s => makeRecord({ achievement_status: s })); const m = computeChildDevelopmentMetrics(records); for (const s of statuses) expect(m.by_achievement_status[s]).toBe(1); });
    it("counts all 5 support levels", () => { const levels = ["independent","minimal_support","moderate_support","significant_support","intensive_support"] as const; const records = levels.map(l => makeRecord({ support_level: l })); const m = computeChildDevelopmentMetrics(records); for (const l of levels) expect(m.by_support_level[l]).toBe(1); });
    it("counts all 5 progress ratings", () => { const ratings = ["excellent_progress","good_progress","steady_progress","limited_progress","no_progress"] as const; const records = ratings.map(r => makeRecord({ progress_rating: r })); const m = computeChildDevelopmentMetrics(records); for (const r of ratings) expect(m.by_progress_rating[r]).toBe(1); });
  });

  describe("identifyChildDevelopmentAlerts", () => {
    it("returns empty for clean", () => { expect(identifyChildDevelopmentAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyChildDevelopmentAlerts([])).toEqual([]); });
    it("fires regressed_no_specialist", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ achievement_status: "regressed", specialist_input_obtained: false, child_name: "Jo", developmental_domain: "cognitive" })]); expect(a[0].type).toBe("regressed_no_specialist"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); expect(a[0].message).toContain("cognitive"); });
    it("regressed_no_specialist per-record", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ id: "a-1", achievement_status: "regressed", specialist_input_obtained: false }), makeRecord({ id: "a-2", achievement_status: "regressed", specialist_input_obtained: false })]); expect(a.filter(x => x.type === "regressed_no_specialist")).toHaveLength(2); });
    it("regressed with specialist no critical alert", () => { expect(identifyChildDevelopmentAlerts([makeRecord({ achievement_status: "regressed", specialist_input_obtained: true })]).find(x => x.type === "regressed_no_specialist")).toBeUndefined(); });
    it("not_met without specialist no critical alert", () => { expect(identifyChildDevelopmentAlerts([makeRecord({ achievement_status: "not_met", specialist_input_obtained: false })]).find(x => x.type === "regressed_no_specialist")).toBeUndefined(); });
    it("fires no_progress singular", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ progress_rating: "no_progress" })]); const f = a.find(x => x.type === "no_progress"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 milestone shows"); });
    it("no_progress plural", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ progress_rating: "no_progress" }), makeRecord({ progress_rating: "no_progress" })]); const f = a.find(x => x.type === "no_progress"); expect(f!.message).toContain("2 milestones show"); });
    it("fires no_next_steps singular", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ next_steps_identified: false })]); const f = a.find(x => x.type === "no_next_steps"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 milestone has"); });
    it("no_next_steps plural", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ next_steps_identified: false }), makeRecord({ next_steps_identified: false })]); const f = a.find(x => x.type === "no_next_steps"); expect(f!.message).toContain("2 milestones have"); });
    it("achievement_not_celebrated not for 1", () => { expect(identifyChildDevelopmentAlerts([makeRecord({ celebration_of_achievement: false })]).find(x => x.type === "achievement_not_celebrated")).toBeUndefined(); });
    it("achievement_not_celebrated fires for 2", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ celebration_of_achievement: false }), makeRecord({ celebration_of_achievement: false })]); expect(a.find(x => x.type === "achievement_not_celebrated")).toBeDefined(); expect(a.find(x => x.type === "achievement_not_celebrated")!.severity).toBe("medium"); });
    it("resources_not_in_place not for 1", () => { expect(identifyChildDevelopmentAlerts([makeRecord({ resources_in_place: false })]).find(x => x.type === "resources_not_in_place")).toBeUndefined(); });
    it("resources_not_in_place fires for 2", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ resources_in_place: false }), makeRecord({ resources_in_place: false })]); expect(a.find(x => x.type === "resources_not_in_place")).toBeDefined(); expect(a.find(x => x.type === "resources_not_in_place")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyChildDevelopmentAlerts([makeRecord({ achievement_status: "regressed", specialist_input_obtained: false, progress_rating: "no_progress", next_steps_identified: false, celebration_of_achievement: false, resources_in_place: false }), makeRecord({ next_steps_identified: false, celebration_of_achievement: false, resources_in_place: false })]); const types = a.map(x => x.type); expect(types).toContain("regressed_no_specialist"); expect(types).toContain("no_progress"); expect(types).toContain("no_next_steps"); expect(types).toContain("achievement_not_celebrated"); expect(types).toContain("resources_not_in_place"); });
  });
});
