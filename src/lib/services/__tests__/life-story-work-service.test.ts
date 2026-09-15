import { describe, it, expect } from "vitest";
import { _testing, type LifeStoryWorkRecord } from "../life-story-work-service";
import { todayStr } from "@/lib/utils";

const { computeLifeStoryWorkMetrics, identifyLifeStoryWorkAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<LifeStoryWorkRecord>): LifeStoryWorkRecord {
  return {
    id: "a-1", home_id: "home-1",
    session_type: "life_story_book",
    child_engagement: "fully_engaged",
    emotional_response: "positive",
    session_frequency: "weekly",
    session_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : "child-1",
    facilitator_name: "Staff A",
    age_appropriate: true,
    trauma_informed: true,
    child_led: true,
    consent_obtained: true,
    social_worker_aware: true,
    therapist_consulted: true,
    materials_created: true,
    securely_stored: true,
    shared_with_child: true,
    parent_involvement: true,
    cultural_sensitivity: true,
    follow_up_planned: true,
    issues_found: [], actions_taken: [],
    session_duration_minutes: 45,
    next_session_date: "next_session_date" in (overrides ?? {}) ? (overrides!.next_session_date ?? null) : null,
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: now.toISOString(), updated_at: now.toISOString(),
      // Overrides win last: an explicit null stays null — the old
    // `overrides?.x ?? default` fabricated answers inside the factory.
    ...overrides,
  };
}

describe("life-story-work-service", () => {
  describe("computeLifeStoryWorkMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeLifeStoryWorkMetrics([]);
      expect(m.total_sessions).toBe(0);;
      expect(m.fully_engaged_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.distressed_count).toBe(0);
      expect(m.age_appropriate_rate).toBeNull();;
      expect(m.average_session_duration).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeLifeStoryWorkMetrics([]);
      expect(m.by_session_type).toEqual({});
      expect(m.by_child_engagement).toEqual({});
      expect(m.by_emotional_response).toEqual({});
      expect(m.by_session_frequency).toEqual({});
    });
    it("counts fully_engaged", () => { expect(computeLifeStoryWorkMetrics([makeRecord()]).fully_engaged_count).toBe(1); });
    it("counts declined", () => { expect(computeLifeStoryWorkMetrics([makeRecord({ child_engagement: "declined" })]).declined_count).toBe(1); });
    it("counts distressed", () => { expect(computeLifeStoryWorkMetrics([makeRecord({ emotional_response: "distressed" })]).distressed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeLifeStoryWorkMetrics([makeRecord()]);
      expect(m.age_appropriate_rate).toBe(100);
      expect(m.trauma_informed_rate).toBe(100);
      expect(m.child_led_rate).toBe(100);
      expect(m.consent_obtained_rate).toBe(100);
      expect(m.social_worker_aware_rate).toBe(100);
      expect(m.therapist_consulted_rate).toBe(100);
      expect(m.materials_created_rate).toBe(100);
      expect(m.securely_stored_rate).toBe(100);
      expect(m.shared_with_child_rate).toBe(100);
      expect(m.parent_involvement_rate).toBe(100);
      expect(m.cultural_sensitivity_rate).toBe(100);
      expect(m.follow_up_planned_rate).toBe(100);
    });
    it("trauma_informed_rate 0 when false", () => { expect(computeLifeStoryWorkMetrics([makeRecord({ trauma_informed: false })]).trauma_informed_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeLifeStoryWorkMetrics([makeRecord({ trauma_informed: true }), makeRecord({ trauma_informed: false }), makeRecord({ trauma_informed: true })]); expect(m.trauma_informed_rate).toBe(66.7); });
    it("average_session_duration", () => { const m = computeLifeStoryWorkMetrics([makeRecord({ session_duration_minutes: 30 }), makeRecord({ session_duration_minutes: 60 })]); expect(m.average_session_duration).toBe(45); });
    it("unique_children distinct", () => { const m = computeLifeStoryWorkMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 session types", () => { const types = ["life_story_book","memory_box","timeline_work","family_tree","identity_exploration","cultural_heritage","photograph_collation","digital_story","therapeutic_narrative","other"] as const; const records = types.map(t => makeRecord({ session_type: t })); const m = computeLifeStoryWorkMetrics(records); for (const t of types) expect(m.by_session_type[t]).toBe(1); });
    it("counts all 5 engagements", () => { const eng = ["fully_engaged","mostly_engaged","partially_engaged","reluctant","declined"] as const; const records = eng.map(e => makeRecord({ child_engagement: e })); const m = computeLifeStoryWorkMetrics(records); for (const e of eng) expect(m.by_child_engagement[e]).toBe(1); });
    it("counts all 5 responses", () => { const res = ["positive","neutral","mixed","distressed","not_recorded"] as const; const records = res.map(r => makeRecord({ emotional_response: r })); const m = computeLifeStoryWorkMetrics(records); for (const r of res) expect(m.by_emotional_response[r]).toBe(1); });
    it("counts all 5 frequencies", () => { const freqs = ["weekly","fortnightly","monthly","as_needed","one_off"] as const; const records = freqs.map(f => makeRecord({ session_frequency: f })); const m = computeLifeStoryWorkMetrics(records); for (const f of freqs) expect(m.by_session_frequency[f]).toBe(1); });
  });

  describe("identifyLifeStoryWorkAlerts", () => {
    it("returns empty for clean", () => { expect(identifyLifeStoryWorkAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyLifeStoryWorkAlerts([])).toEqual([]); });
    it("fires distressed_no_therapist", () => { 
      const a = identifyLifeStoryWorkAlerts([makeRecord({ emotional_response: "distressed", therapist_consulted: false, child_name: "Jo", session_date: "2026-05-14" })]);
      expect(a[0].type).toBe("distressed_no_therapist");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
    });
    it("distressed_no_therapist per-record", () => { const a = identifyLifeStoryWorkAlerts([makeRecord({ id: "a-1", emotional_response: "distressed", therapist_consulted: false }), makeRecord({ id: "a-2", emotional_response: "distressed", therapist_consulted: false })]); expect(a.filter(x => x.type === "distressed_no_therapist")).toHaveLength(2); });
    it("no distressed alert if therapist consulted", () => { const a = identifyLifeStoryWorkAlerts([makeRecord({ emotional_response: "distressed", therapist_consulted: true })]); expect(a.filter(x => x.type === "distressed_no_therapist")).toHaveLength(0); });
    it("fires not_trauma_informed singular", () => { 
      const a = identifyLifeStoryWorkAlerts([makeRecord({ trauma_informed: false })]);
      const f = a.find(x => x.type === "not_trauma_informed");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session is");
    });
    it("not_trauma_informed plural", () => { const a = identifyLifeStoryWorkAlerts([makeRecord({ trauma_informed: false }), makeRecord({ trauma_informed: false })]); const f = a.find(x => x.type === "not_trauma_informed"); expect(f!.message).toContain("2 sessions are"); });
    it("fires materials_not_secure singular", () => { 
      const a = identifyLifeStoryWorkAlerts([makeRecord({ materials_created: true, securely_stored: false })]);
      const f = a.find(x => x.type === "materials_not_secure");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 session has");
    });
    it("materials_not_secure only when materials created", () => { expect(identifyLifeStoryWorkAlerts([makeRecord({ materials_created: false, securely_stored: false })]).find(x => x.type === "materials_not_secure")).toBeUndefined(); });
    it("consent_not_obtained not for 1", () => { expect(identifyLifeStoryWorkAlerts([makeRecord({ consent_obtained: false })]).find(x => x.type === "consent_not_obtained")).toBeUndefined(); });
    it("consent_not_obtained fires for 2", () => { const a = identifyLifeStoryWorkAlerts([makeRecord({ consent_obtained: false }), makeRecord({ consent_obtained: false })]); expect(a.find(x => x.type === "consent_not_obtained")).toBeDefined(); });
    it("not_culturally_sensitive not for 2", () => { expect(identifyLifeStoryWorkAlerts([makeRecord({ cultural_sensitivity: false }), makeRecord({ cultural_sensitivity: false })]).find(x => x.type === "not_culturally_sensitive")).toBeUndefined(); });
    it("not_culturally_sensitive fires for 3", () => { const a = identifyLifeStoryWorkAlerts([makeRecord({ cultural_sensitivity: false }), makeRecord({ cultural_sensitivity: false }), makeRecord({ cultural_sensitivity: false })]); expect(a.find(x => x.type === "not_culturally_sensitive")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyLifeStoryWorkAlerts([makeRecord({ emotional_response: "distressed", therapist_consulted: false, trauma_informed: false, materials_created: true, securely_stored: false, consent_obtained: false, cultural_sensitivity: false }), makeRecord({ consent_obtained: false, cultural_sensitivity: false }), makeRecord({ cultural_sensitivity: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("distressed_no_therapist");
      expect(types).toContain("not_trauma_informed");
      expect(types).toContain("materials_not_secure");
      expect(types).toContain("consent_not_obtained");
      expect(types).toContain("not_culturally_sensitive");
    });
  });
});

// ── Tri-state: an unanswered question is neither yes nor breach ──
describe("tri-state judgements", () => {
  it("does not count an unrecorded trauma_informed as a failure", () => {
    const alerts = _testing.identifyLifeStoryWorkAlerts([makeRecord({ trauma_informed: null }), makeRecord({ id: "r-2", trauma_informed: null })]);
    expect(alerts.some((a) => a.type === "not_trauma_informed")).toBe(false);
  });
  it("still counts a recorded no", () => {
    const alerts = _testing.identifyLifeStoryWorkAlerts([makeRecord({ trauma_informed: false }), makeRecord({ id: "r-2", trauma_informed: false })]);
    expect(alerts.some((a) => a.type === "not_trauma_informed")).toBe(true);
  });
});
