import { describe, it, expect } from "vitest";
import { _testing, type ContactSupervisionRecord } from "../contact-supervision-service";
import { todayStr } from "@/lib/utils";

const { computeContactSupervisionMetrics, identifyContactSupervisionAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<ContactSupervisionRecord>): ContactSupervisionRecord {
  return {
    id: "a-1", home_id: overrides?.home_id ?? "home-1",
    contact_type: "face_to_face",
    supervision_level: "full_supervision",
    child_response: "positive",
    contact_outcome: "completed_as_planned",
    contact_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    supervised_by: "Staff A",
    risk_assessment_current: true,
    child_prepared: true,
    child_debriefed: true,
    court_order_complied: true,
    safeguarding_concerns: false,
    transport_arranged: true,
    venue_appropriate: true,
    social_worker_informed: true,
    care_plan_linked: true,
    child_views_sought: true,
    recorded_within_24h: true,
    recorded_promptly: true,
    issues_found: [], actions_taken: overrides?.actions_taken ?? [],
    contact_duration_minutes: 60,
    next_review_date: "next_review_date" in (overrides ?? {}) ? (overrides!.next_review_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: overrides?.updated_at ?? now.toISOString(),
    // Overrides win LAST — an explicit null must stay null; the old
    // `overrides?.x ?? default` converted null back into the default,
    // fabricating answers inside the test factory itself.
    ...overrides,
  };
}

describe("contact-supervision-service", () => {
  describe("computeContactSupervisionMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeContactSupervisionMetrics([]);
      expect(m.total_contacts).toBe(0);;
      expect(m.distressed_count).toBe(0);
      expect(m.refused_count).toBe(0);
      expect(m.cancelled_count).toBe(0);
      expect(m.safeguarding_concerns_count).toBe(0);
      expect(m.risk_assessment_rate).toBeNull();;
      expect(m.average_duration).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeContactSupervisionMetrics([]);
      expect(m.by_contact_type).toEqual({});
      expect(m.by_supervision_level).toEqual({});
      expect(m.by_child_response).toEqual({});
      expect(m.by_contact_outcome).toEqual({});
    });
    it("total_contacts counts records", () => { expect(computeContactSupervisionMetrics([makeRecord(), makeRecord()]).total_contacts).toBe(2); });
    it("counts distressed", () => { expect(computeContactSupervisionMetrics([makeRecord({ child_response: "distressed" })]).distressed_count).toBe(1); });
    it("counts refused", () => { expect(computeContactSupervisionMetrics([makeRecord({ child_response: "refused" })]).refused_count).toBe(1); });
    it("counts cancelled_by_family", () => { expect(computeContactSupervisionMetrics([makeRecord({ contact_outcome: "cancelled_by_family" })]).cancelled_count).toBe(1); });
    it("counts cancelled_by_child", () => { expect(computeContactSupervisionMetrics([makeRecord({ contact_outcome: "cancelled_by_child" })]).cancelled_count).toBe(1); });
    it("cancelled_count combines both types", () => { const m = computeContactSupervisionMetrics([makeRecord({ contact_outcome: "cancelled_by_family" }), makeRecord({ contact_outcome: "cancelled_by_child" })]); expect(m.cancelled_count).toBe(2); });
    it("counts safeguarding_concerns true", () => { expect(computeContactSupervisionMetrics([makeRecord({ safeguarding_concerns: true })]).safeguarding_concerns_count).toBe(1); });
    it("safeguarding_concerns false not counted", () => { expect(computeContactSupervisionMetrics([makeRecord({ safeguarding_concerns: false })]).safeguarding_concerns_count).toBe(0); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeContactSupervisionMetrics([makeRecord()]);
      expect(m.risk_assessment_rate).toBe(100);
      expect(m.child_prepared_rate).toBe(100);
      expect(m.child_debriefed_rate).toBe(100);
      expect(m.court_order_rate).toBe(100);
      expect(m.transport_arranged_rate).toBe(100);
      expect(m.venue_appropriate_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.care_plan_linked_rate).toBe(100);
      expect(m.child_views_rate).toBe(100);
      expect(m.recorded_within_24h_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("risk_assessment_rate 0 when false", () => { expect(computeContactSupervisionMetrics([makeRecord({ risk_assessment_current: false })]).risk_assessment_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeContactSupervisionMetrics([makeRecord({ child_debriefed: true }), makeRecord({ child_debriefed: false }), makeRecord({ child_debriefed: true })]); expect(m.child_debriefed_rate).toBe(66.7); });
    it("average_duration correct", () => { const m = computeContactSupervisionMetrics([makeRecord({ contact_duration_minutes: 30 }), makeRecord({ contact_duration_minutes: 90 })]); expect(m.average_duration).toBe(60); });
    it("average_duration rounds to 1 decimal", () => { const m = computeContactSupervisionMetrics([makeRecord({ contact_duration_minutes: 10 }), makeRecord({ contact_duration_minutes: 20 }), makeRecord({ contact_duration_minutes: 30 })]); expect(m.average_duration).toBe(20); });
    it("unique_children distinct", () => { const m = computeContactSupervisionMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 contact types", () => { const types = ["face_to_face","phone_call","video_call","letter","supervised_visit","unsupervised_visit","community_contact","overnight_stay","indirect_contact","other"] as const; const records = types.map(t => makeRecord({ contact_type: t })); const m = computeContactSupervisionMetrics(records); for (const t of types) expect(m.by_contact_type[t]).toBe(1); });
    it("counts all 5 supervision levels", () => { const levels = ["full_supervision","partial_supervision","monitored","unsupervised","no_contact_order"] as const; const records = levels.map(l => makeRecord({ supervision_level: l })); const m = computeContactSupervisionMetrics(records); for (const l of levels) expect(m.by_supervision_level[l]).toBe(1); });
    it("counts all 5 child responses", () => { const responses = ["positive","mixed","neutral","distressed","refused"] as const; const records = responses.map(r => makeRecord({ child_response: r })); const m = computeContactSupervisionMetrics(records); for (const r of responses) expect(m.by_child_response[r]).toBe(1); });
    it("counts all 5 contact outcomes", () => { const outcomes = ["completed_as_planned","shortened","extended","cancelled_by_family","cancelled_by_child"] as const; const records = outcomes.map(o => makeRecord({ contact_outcome: o })); const m = computeContactSupervisionMetrics(records); for (const o of outcomes) expect(m.by_contact_outcome[o]).toBe(1); });
  });

  describe("identifyContactSupervisionAlerts", () => {
    it("returns empty for clean", () => { expect(identifyContactSupervisionAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyContactSupervisionAlerts([])).toEqual([]); });
    it("fires safeguarding_during_contact", () => { 
      const a = identifyContactSupervisionAlerts([makeRecord({ safeguarding_concerns: true, child_name: "Jo", contact_type: "supervised_visit" })]);
      expect(a[0].type).toBe("safeguarding_during_contact");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("supervised visit");
    });
    it("safeguarding_during_contact per-record", () => { const a = identifyContactSupervisionAlerts([makeRecord({ id: "a-1", safeguarding_concerns: true }), makeRecord({ id: "a-2", safeguarding_concerns: true })]); expect(a.filter(x => x.type === "safeguarding_during_contact")).toHaveLength(2); });
    it("fires child_not_debriefed singular", () => { 
      const a = identifyContactSupervisionAlerts([makeRecord({ child_debriefed: false })]);
      const f = a.find(x => x.type === "child_not_debriefed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 contact has");
    });
    it("child_not_debriefed plural", () => { const a = identifyContactSupervisionAlerts([makeRecord({ child_debriefed: false }), makeRecord({ child_debriefed: false })]); const f = a.find(x => x.type === "child_not_debriefed"); expect(f!.message).toContain("2 contacts have"); });
    it("fires risk_assessment_outdated singular", () => { 
      const a = identifyContactSupervisionAlerts([makeRecord({ risk_assessment_current: false })]);
      const f = a.find(x => x.type === "risk_assessment_outdated");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 contact has");
    });
    it("risk_assessment_outdated plural", () => { const a = identifyContactSupervisionAlerts([makeRecord({ risk_assessment_current: false }), makeRecord({ risk_assessment_current: false })]); const f = a.find(x => x.type === "risk_assessment_outdated"); expect(f!.message).toContain("2 contacts have"); });
    it("child_not_prepared not for 1", () => { expect(identifyContactSupervisionAlerts([makeRecord({ child_prepared: false })]).find(x => x.type === "child_not_prepared")).toBeUndefined(); });
    it("child_not_prepared fires for 2", () => { const a = identifyContactSupervisionAlerts([makeRecord({ child_prepared: false }), makeRecord({ child_prepared: false })]); expect(a.find(x => x.type === "child_not_prepared")).toBeDefined(); expect(a.find(x => x.type === "child_not_prepared")!.severity).toBe("medium"); });
    it("venue_not_appropriate not for 1", () => { expect(identifyContactSupervisionAlerts([makeRecord({ venue_appropriate: false })]).find(x => x.type === "venue_not_appropriate")).toBeUndefined(); });
    it("venue_not_appropriate fires for 2", () => { const a = identifyContactSupervisionAlerts([makeRecord({ venue_appropriate: false }), makeRecord({ venue_appropriate: false })]); expect(a.find(x => x.type === "venue_not_appropriate")).toBeDefined(); expect(a.find(x => x.type === "venue_not_appropriate")!.severity).toBe("medium"); });
    it("fires all applicable", () => { 
      const a = identifyContactSupervisionAlerts([makeRecord({ safeguarding_concerns: true, child_debriefed: false, risk_assessment_current: false, child_prepared: false, venue_appropriate: false }), makeRecord({ child_prepared: false, venue_appropriate: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("safeguarding_during_contact");
      expect(types).toContain("child_not_debriefed");
      expect(types).toContain("risk_assessment_outdated");
      expect(types).toContain("child_not_prepared");
      expect(types).toContain("venue_not_appropriate");
    });
  });
});

// ── Tri-state: an unanswered question is neither a yes nor a breach ──────────
describe("tri-state judgements (promotion kit 200)", () => {
  it("does not count an unrecorded debrief as a missed one", () => {
    const rows = [
      makeRecord({ child_debriefed: null, risk_assessment_current: null }),
      makeRecord({ child_debriefed: true, risk_assessment_current: true }),
    ];
    const alerts = _testing.identifyContactSupervisionAlerts(rows);
    expect(alerts.some((a) => /debrief/i.test(a.message))).toBe(false);
    expect(alerts.some((a) => /risk assessment/i.test(a.message))).toBe(false);
  });

  it("still counts a recorded failure", () => {
    const rows = [makeRecord({ child_debriefed: false })];
    const alerts = _testing.identifyContactSupervisionAlerts(rows);
    expect(alerts.some((a) => /debrief/i.test(a.message))).toBe(true);
  });

  // The recorded-subset rate behaviour is pinned on
  // fix/padded-boolrate-denominators (social-skills template tests); asserting
  // it here would fail until that branch merges and belongs to it, not this.
});;
