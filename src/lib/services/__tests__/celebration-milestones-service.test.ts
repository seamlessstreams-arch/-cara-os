import { describe, it, expect } from "vitest";
import { _testing, type CelebrationMilestonesRecord } from "../celebration-milestones-service";

const { computeCelebrationMilestonesMetrics, identifyCelebrationMilestonesAlerts } = _testing;

const now = new Date(new Date().toISOString().split("T")[0]);

function makeRecord(overrides?: Partial<CelebrationMilestonesRecord>): CelebrationMilestonesRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    celebration_type: overrides?.celebration_type ?? "birthday",
    recognition_quality: overrides?.recognition_quality ?? "good",
    child_response: overrides?.child_response ?? "happy",
    participation_breadth: overrides?.participation_breadth ?? "whole_home",
    event_date: overrides?.event_date ?? now.toISOString().split("T")[0],
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    organised_by: overrides?.organised_by ?? "Staff A",
    child_chose_celebration: overrides?.child_chose_celebration ?? true,
    culturally_sensitive: overrides?.culturally_sensitive ?? true,
    age_appropriate: overrides?.age_appropriate ?? true,
    photos_consent_obtained: overrides?.photos_consent_obtained ?? true,
    family_included: overrides?.family_included ?? true,
    peers_involved: overrides?.peers_involved ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    budget_approved: overrides?.budget_approved ?? true,
    memories_preserved: overrides?.memories_preserved ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("celebration-milestones-service", () => {
  describe("computeCelebrationMilestonesMetrics", () => {
    it("returns zeros for empty", () => { const m = computeCelebrationMilestonesMetrics([]); expect(m.total_events).toBe(0); expect(m.missed_count).toBe(0); expect(m.poor_quality_count).toBe(0); expect(m.uncomfortable_count).toBe(0); expect(m.no_family_count).toBe(0); expect(m.child_chose_rate).toBe(0); expect(m.unique_children).toBe(0); });
    it("returns empty breakdowns", () => { const m = computeCelebrationMilestonesMetrics([]); expect(m.by_celebration_type).toEqual({}); expect(m.by_recognition_quality).toEqual({}); expect(m.by_child_response).toEqual({}); expect(m.by_participation_breadth).toEqual({}); });
    it("total_events counts records", () => { expect(computeCelebrationMilestonesMetrics([makeRecord(), makeRecord()]).total_events).toBe(2); });
    it("counts missed", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ recognition_quality: "missed" })]).missed_count).toBe(1); });
    it("counts poor_quality for poor", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ recognition_quality: "poor" })]).poor_quality_count).toBe(1); });
    it("counts poor_quality for missed", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ recognition_quality: "missed" })]).poor_quality_count).toBe(1); });
    it("does not count adequate as poor_quality", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ recognition_quality: "adequate" })]).poor_quality_count).toBe(0); });
    it("counts uncomfortable for uncomfortable", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ child_response: "uncomfortable" })]).uncomfortable_count).toBe(1); });
    it("counts uncomfortable for upset", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ child_response: "upset" })]).uncomfortable_count).toBe(1); });
    it("does not count neutral as uncomfortable", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ child_response: "neutral" })]).uncomfortable_count).toBe(0); });
    it("counts no_family", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ family_included: false })]).no_family_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { const m = computeCelebrationMilestonesMetrics([makeRecord()]); expect(m.child_chose_rate).toBe(100); expect(m.culturally_sensitive_rate).toBe(100); expect(m.age_appropriate_rate).toBe(100); expect(m.photos_consent_rate).toBe(100); expect(m.family_included_rate).toBe(100); expect(m.peers_involved_rate).toBe(100); expect(m.care_plan_rate).toBe(100); expect(m.social_worker_rate).toBe(100); expect(m.parent_informed_rate).toBe(100); expect(m.budget_approved_rate).toBe(100); expect(m.memories_preserved_rate).toBe(100); expect(m.recorded_promptly_rate).toBe(100); });
    it("child_chose_rate 0 when false", () => { expect(computeCelebrationMilestonesMetrics([makeRecord({ child_chose_celebration: false })]).child_chose_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeCelebrationMilestonesMetrics([makeRecord({ memories_preserved: true }), makeRecord({ memories_preserved: false }), makeRecord({ memories_preserved: true })]); expect(m.memories_preserved_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeCelebrationMilestonesMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 celebration types", () => { const types = ["birthday","academic_achievement","behavioural_milestone","cultural_festival","religious_celebration","sporting_achievement","personal_milestone","transition_event","community_recognition","other"] as const; const records = types.map(t => makeRecord({ celebration_type: t })); const m = computeCelebrationMilestonesMetrics(records); for (const t of types) expect(m.by_celebration_type[t]).toBe(1); });
    it("counts all 5 recognition qualities", () => { const qualities = ["exceptional","good","adequate","poor","missed"] as const; const records = qualities.map(q => makeRecord({ recognition_quality: q })); const m = computeCelebrationMilestonesMetrics(records); for (const q of qualities) expect(m.by_recognition_quality[q]).toBe(1); });
    it("counts all 5 child responses", () => { const responses = ["delighted","happy","neutral","uncomfortable","upset"] as const; const records = responses.map(r => makeRecord({ child_response: r })); const m = computeCelebrationMilestonesMetrics(records); for (const r of responses) expect(m.by_child_response[r]).toBe(1); });
    it("counts all 5 participation breadths", () => { const breadths = ["whole_home","peer_group","staff_and_child","individual","none"] as const; const records = breadths.map(b => makeRecord({ participation_breadth: b })); const m = computeCelebrationMilestonesMetrics(records); for (const b of breadths) expect(m.by_participation_breadth[b]).toBe(1); });
  });

  describe("identifyCelebrationMilestonesAlerts", () => {
    it("returns empty for clean", () => { expect(identifyCelebrationMilestonesAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyCelebrationMilestonesAlerts([])).toEqual([]); });
    it("fires missed_upset", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ recognition_quality: "missed", child_response: "upset", child_name: "Jo" })]); expect(a[0].type).toBe("missed_upset"); expect(a[0].severity).toBe("critical"); expect(a[0].message).toContain("Jo"); });
    it("missed_upset for uncomfortable too", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ recognition_quality: "missed", child_response: "uncomfortable" })]); expect(a.filter(x => x.type === "missed_upset")).toHaveLength(1); });
    it("missed_upset per-record", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ id: "a-1", recognition_quality: "missed", child_response: "upset" }), makeRecord({ id: "a-2", recognition_quality: "missed", child_response: "uncomfortable" })]); expect(a.filter(x => x.type === "missed_upset")).toHaveLength(2); });
    it("missed with happy no critical", () => { expect(identifyCelebrationMilestonesAlerts([makeRecord({ recognition_quality: "missed", child_response: "happy" })]).find(x => x.type === "missed_upset")).toBeUndefined(); });
    it("poor with upset no critical", () => { expect(identifyCelebrationMilestonesAlerts([makeRecord({ recognition_quality: "poor", child_response: "upset" })]).find(x => x.type === "missed_upset")).toBeUndefined(); });
    it("fires no_child_choice singular", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ child_chose_celebration: false })]); const f = a.find(x => x.type === "no_child_choice"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 celebration has"); });
    it("fires not_culturally_sensitive singular", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ culturally_sensitive: false })]); const f = a.find(x => x.type === "not_culturally_sensitive"); expect(f).toBeDefined(); expect(f!.severity).toBe("high"); expect(f!.message).toContain("1 event is"); });
    it("no_memories_preserved not for 1", () => { expect(identifyCelebrationMilestonesAlerts([makeRecord({ memories_preserved: false })]).find(x => x.type === "no_memories_preserved")).toBeUndefined(); });
    it("no_memories_preserved fires for 2", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ memories_preserved: false }), makeRecord({ memories_preserved: false })]); expect(a.find(x => x.type === "no_memories_preserved")).toBeDefined(); expect(a.find(x => x.type === "no_memories_preserved")!.severity).toBe("medium"); });
    it("no_family_included not for 1", () => { expect(identifyCelebrationMilestonesAlerts([makeRecord({ family_included: false })]).find(x => x.type === "no_family_included")).toBeUndefined(); });
    it("no_family_included fires for 2", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ family_included: false }), makeRecord({ family_included: false })]); expect(a.find(x => x.type === "no_family_included")).toBeDefined(); expect(a.find(x => x.type === "no_family_included")!.severity).toBe("medium"); });
    it("fires all applicable", () => { const a = identifyCelebrationMilestonesAlerts([makeRecord({ recognition_quality: "missed", child_response: "upset", child_chose_celebration: false, culturally_sensitive: false, memories_preserved: false, family_included: false }), makeRecord({ child_chose_celebration: false, culturally_sensitive: false, memories_preserved: false, family_included: false })]); const types = a.map(x => x.type); expect(types).toContain("missed_upset"); expect(types).toContain("no_child_choice"); expect(types).toContain("not_culturally_sensitive"); expect(types).toContain("no_memories_preserved"); expect(types).toContain("no_family_included"); });
  });
});
