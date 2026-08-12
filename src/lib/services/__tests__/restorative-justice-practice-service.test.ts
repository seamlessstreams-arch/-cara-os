import { describe, it, expect } from "vitest";
import { _testing, type RestorativeJusticePracticeRecord } from "../restorative-justice-practice-service";
import { todayStr } from "@/lib/utils";

const { computeRestorativeJusticeMetrics, identifyRestorativeJusticeAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<RestorativeJusticePracticeRecord>): RestorativeJusticePracticeRecord {
  return {
    id: overrides?.id ?? "a-1", home_id: overrides?.home_id ?? "home-1",
    practice_type: overrides?.practice_type ?? "restorative_conversation",
    outcome_level: overrides?.outcome_level ?? "fully_resolved",
    participation_willingness: overrides?.participation_willingness ?? "fully_willing",
    relationship_impact: overrides?.relationship_impact ?? "improved",
    session_date: overrides?.session_date ?? todayStr(),
    child_name: overrides?.child_name ?? "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    facilitated_by: overrides?.facilitated_by ?? "Staff A",
    child_voice_heard: overrides?.child_voice_heard ?? true,
    victim_supported: overrides?.victim_supported ?? true,
    voluntary_participation: overrides?.voluntary_participation ?? true,
    agreement_reached: overrides?.agreement_reached ?? true,
    follow_up_planned: overrides?.follow_up_planned ?? true,
    empathy_demonstrated: overrides?.empathy_demonstrated ?? true,
    care_plan_reflects: overrides?.care_plan_reflects ?? true,
    social_worker_informed: overrides?.social_worker_informed ?? true,
    parent_informed: overrides?.parent_informed ?? true,
    staff_trained: overrides?.staff_trained ?? true,
    safeguarding_considered: overrides?.safeguarding_considered ?? true,
    recorded_promptly: overrides?.recorded_promptly ?? true,
    issues_found: overrides?.issues_found ?? [], actions_taken: overrides?.actions_taken ?? [],
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: overrides?.created_at ?? now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
  };
}

describe("restorative-justice-practice-service", () => {
  describe("computeRestorativeJusticeMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeRestorativeJusticeMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.escalated_count).toBe(0);
      expect(m.unresolved_count).toBe(0);
      expect(m.coerced_count).toBe(0);
      expect(m.worsened_count).toBe(0);
      expect(m.child_voice_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeRestorativeJusticeMetrics([]);
      expect(m.by_practice_type).toEqual({});
      expect(m.by_outcome_level).toEqual({});
      expect(m.by_participation_willingness).toEqual({});
      expect(m.by_relationship_impact).toEqual({});
    });
    it("total_sessions counts records", () => { expect(computeRestorativeJusticeMetrics([makeRecord(), makeRecord()]).total_sessions).toBe(2); });
    it("counts escalated", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ outcome_level: "escalated" })]).escalated_count).toBe(1); });
    it("counts unresolved", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ outcome_level: "unresolved" })]).unresolved_count).toBe(1); });
    it("does not count partially_resolved as unresolved", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ outcome_level: "partially_resolved" })]).unresolved_count).toBe(0); });
    it("counts coerced", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ participation_willingness: "coerced" })]).coerced_count).toBe(1); });
    it("does not count reluctant as coerced", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ participation_willingness: "reluctant" })]).coerced_count).toBe(0); });
    it("counts worsened for worsened", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ relationship_impact: "worsened" })]).worsened_count).toBe(1); });
    it("counts worsened for significantly_worsened", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ relationship_impact: "significantly_worsened" })]).worsened_count).toBe(1); });
    it("does not count no_change as worsened", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ relationship_impact: "no_change" })]).worsened_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeRestorativeJusticeMetrics([makeRecord()]);
      expect(m.child_voice_rate).toBe(100);
      expect(m.victim_supported_rate).toBe(100);
      expect(m.voluntary_rate).toBe(100);
      expect(m.agreement_rate).toBe(100);
      expect(m.follow_up_rate).toBe(100);
      expect(m.empathy_rate).toBe(100);
      expect(m.care_plan_rate).toBe(100);
      expect(m.social_worker_rate).toBe(100);
      expect(m.parent_informed_rate).toBe(100);
      expect(m.staff_trained_rate).toBe(100);
      expect(m.safeguarding_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_voice_rate 0 when false", () => { expect(computeRestorativeJusticeMetrics([makeRecord({ child_voice_heard: false })]).child_voice_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeRestorativeJusticeMetrics([makeRecord({ staff_trained: true }), makeRecord({ staff_trained: false }), makeRecord({ staff_trained: true })]); expect(m.staff_trained_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeRestorativeJusticeMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 practice types", () => { const types = ["restorative_conversation","peer_mediation","community_conference","circle_time","shuttle_mediation","family_group_conference","written_apology","reparation_activity","relationship_repair","other"] as const; const records = types.map(t => makeRecord({ practice_type: t })); const m = computeRestorativeJusticeMetrics(records); for (const t of types) expect(m.by_practice_type[t]).toBe(1); });
    it("counts all 5 outcome levels", () => { const levels = ["fully_resolved","mostly_resolved","partially_resolved","unresolved","escalated"] as const; const records = levels.map(l => makeRecord({ outcome_level: l })); const m = computeRestorativeJusticeMetrics(records); for (const l of levels) expect(m.by_outcome_level[l]).toBe(1); });
    it("counts all 5 participation willingness", () => { const willingness = ["fully_willing","mostly_willing","reluctant","coerced","refused"] as const; const records = willingness.map(w => makeRecord({ participation_willingness: w })); const m = computeRestorativeJusticeMetrics(records); for (const w of willingness) expect(m.by_participation_willingness[w]).toBe(1); });
    it("counts all 5 relationship impacts", () => { const impacts = ["significantly_improved","improved","no_change","worsened","significantly_worsened"] as const; const records = impacts.map(i => makeRecord({ relationship_impact: i })); const m = computeRestorativeJusticeMetrics(records); for (const i of impacts) expect(m.by_relationship_impact[i]).toBe(1); });
  });

  describe("identifyRestorativeJusticeAlerts", () => {
    it("returns empty for clean", () => { expect(identifyRestorativeJusticeAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyRestorativeJusticeAlerts([])).toEqual([]); });
    it("fires coerced_worsened", () => { 
      const a = identifyRestorativeJusticeAlerts([makeRecord({ participation_willingness: "coerced", relationship_impact: "worsened", child_name: "Jo" })]);
      expect(a[0].type).toBe("coerced_worsened");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("coerced_worsened for significantly_worsened too", () => { const a = identifyRestorativeJusticeAlerts([makeRecord({ participation_willingness: "coerced", relationship_impact: "significantly_worsened" })]); expect(a.filter(x => x.type === "coerced_worsened")).toHaveLength(1); });
    it("coerced_worsened per-record", () => { const a = identifyRestorativeJusticeAlerts([makeRecord({ id: "a-1", participation_willingness: "coerced", relationship_impact: "worsened" }), makeRecord({ id: "a-2", participation_willingness: "coerced", relationship_impact: "significantly_worsened" })]); expect(a.filter(x => x.type === "coerced_worsened")).toHaveLength(2); });
    it("coerced with improved no critical", () => { expect(identifyRestorativeJusticeAlerts([makeRecord({ participation_willingness: "coerced", relationship_impact: "improved" })]).find(x => x.type === "coerced_worsened")).toBeUndefined(); });
    it("willing with worsened no critical", () => { expect(identifyRestorativeJusticeAlerts([makeRecord({ participation_willingness: "fully_willing", relationship_impact: "worsened" })]).find(x => x.type === "coerced_worsened")).toBeUndefined(); });
    it("fires child_voice_not_heard singular", () => { 
      const a = identifyRestorativeJusticeAlerts([makeRecord({ child_voice_heard: false })]);
      const f = a.find(x => x.type === "child_voice_not_heard");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("child_voice_not_heard plural", () => { const a = identifyRestorativeJusticeAlerts([makeRecord({ child_voice_heard: false }), makeRecord({ child_voice_heard: false })]); const f = a.find(x => x.type === "child_voice_not_heard"); expect(f!.message).toContain("2 sessions have"); });
    it("fires victim_not_supported singular", () => { 
      const a = identifyRestorativeJusticeAlerts([makeRecord({ victim_supported: false })]);
      const f = a.find(x => x.type === "victim_not_supported");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("staff_not_trained not for 1", () => { expect(identifyRestorativeJusticeAlerts([makeRecord({ staff_trained: false })]).find(x => x.type === "staff_not_trained")).toBeUndefined(); });
    it("staff_not_trained fires for 2", () => { const a = identifyRestorativeJusticeAlerts([makeRecord({ staff_trained: false }), makeRecord({ staff_trained: false })]); expect(a.find(x => x.type === "staff_not_trained")).toBeDefined(); expect(a.find(x => x.type === "staff_not_trained")!.severity).toBe("medium"); });
    it("no_follow_up not for 1", () => { expect(identifyRestorativeJusticeAlerts([makeRecord({ follow_up_planned: false })]).find(x => x.type === "no_follow_up")).toBeUndefined(); });
    it("no_follow_up fires for 2", () => { const a = identifyRestorativeJusticeAlerts([makeRecord({ follow_up_planned: false }), makeRecord({ follow_up_planned: false })]); expect(a.find(x => x.type === "no_follow_up")).toBeDefined(); expect(a.find(x => x.type === "no_follow_up")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyRestorativeJusticeAlerts([makeRecord({ participation_willingness: "coerced", relationship_impact: "worsened", child_voice_heard: false, victim_supported: false, staff_trained: false, follow_up_planned: false }), makeRecord({ child_voice_heard: false, victim_supported: false, staff_trained: false, follow_up_planned: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("coerced_worsened");
      expect(types).toContain("child_voice_not_heard");
      expect(types).toContain("victim_not_supported");
      expect(types).toContain("staff_not_trained");
      expect(types).toContain("no_follow_up");
    });
  });
});
