import { describe, it, expect } from "vitest";
import { _testing, type CulturalIdentitySupportRecord } from "../cultural-identity-support-service";
import { todayStr } from "@/lib/utils";

const { computeCulturalIdentityMetrics, identifyCulturalIdentityAlerts } = _testing;

const now = new Date(todayStr());

function makeRecord(overrides?: Partial<CulturalIdentitySupportRecord>): CulturalIdentitySupportRecord {
  return {
    id: "a-1", home_id: "home-1",
    identity_area: "cultural_heritage",
    support_type: "cultural_activity",
    engagement_level: "engaged",
    cultural_competency: "competent",
    support_date: todayStr(),
    child_name: "Child A",
    child_id: "child_id" in (overrides ?? {}) ? (overrides!.child_id ?? null) : null,
    staff_name: "Staff A",
    child_views_sought: true,
    culturally_appropriate: true,
    family_consulted: true,
    identity_celebrated: true,
    resources_available: true,
    staff_trained: true,
    care_plan_reflects_identity: true,
    social_worker_informed: true,
    community_links_made: true,
    dietary_needs_met: true,
    language_supported: true,
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

describe("cultural-identity-support-service", () => {
  describe("computeCulturalIdentityMetrics", () => {
    it("returns zeros for empty", () => { 
      const m = computeCulturalIdentityMetrics([]);
      expect(m.total_supports).toBe(0);;
      expect(m.enthusiastic_count).toBe(0);
      expect(m.declined_count).toBe(0);
      expect(m.needs_training_count).toBe(0);
      expect(m.not_assessed_count).toBe(0);
      expect(m.child_views_sought_rate).toBeNull();;
      expect(m.unique_children).toBe(0);
    });
    it("returns empty breakdowns", () => { 
      const m = computeCulturalIdentityMetrics([]);
      expect(m.by_identity_area).toEqual({});
      expect(m.by_support_type).toEqual({});
      expect(m.by_engagement_level).toEqual({});
      expect(m.by_cultural_competency).toEqual({});
    });
    it("counts enthusiastic", () => { expect(computeCulturalIdentityMetrics([makeRecord({ engagement_level: "enthusiastic" })]).enthusiastic_count).toBe(1); });
    it("counts declined", () => { expect(computeCulturalIdentityMetrics([makeRecord({ engagement_level: "declined" })]).declined_count).toBe(1); });
    it("counts needs_training", () => { expect(computeCulturalIdentityMetrics([makeRecord({ cultural_competency: "needs_training" })]).needs_training_count).toBe(1); });
    it("counts not_assessed", () => { expect(computeCulturalIdentityMetrics([makeRecord({ cultural_competency: "not_assessed" })]).not_assessed_count).toBe(1); });
    it("returns 100% boolean rates with defaults", () => { 
      const m = computeCulturalIdentityMetrics([makeRecord()]);
      expect(m.child_views_sought_rate).toBe(100);
      expect(m.culturally_appropriate_rate).toBe(100);
      expect(m.family_consulted_rate).toBe(100);
      expect(m.identity_celebrated_rate).toBe(100);
      expect(m.resources_available_rate).toBe(100);
      expect(m.staff_trained_rate).toBe(100);
      expect(m.care_plan_reflects_rate).toBe(100);
      expect(m.social_worker_informed_rate).toBe(100);
      expect(m.community_links_rate).toBe(100);
      expect(m.dietary_needs_rate).toBe(100);
      expect(m.language_supported_rate).toBe(100);
      expect(m.recorded_promptly_rate).toBe(100);
    });
    it("child_views_sought_rate 0 when false", () => { expect(computeCulturalIdentityMetrics([makeRecord({ child_views_sought: false })]).child_views_sought_rate).toBe(0); });
    it("mixed boolean rate", () => { const m = computeCulturalIdentityMetrics([makeRecord({ child_views_sought: true }), makeRecord({ child_views_sought: false }), makeRecord({ child_views_sought: true })]); expect(m.child_views_sought_rate).toBe(66.7); });
    it("unique_children distinct", () => { const m = computeCulturalIdentityMetrics([makeRecord({ child_name: "A" }), makeRecord({ child_name: "B" }), makeRecord({ child_name: "A" })]); expect(m.unique_children).toBe(2); });
    it("counts all 10 identity areas", () => { const areas = ["cultural_heritage","religious_faith","language","ethnicity","gender_identity","sexuality","disability_identity","family_history","nationality","other"] as const; const records = areas.map(a => makeRecord({ identity_area: a })); const m = computeCulturalIdentityMetrics(records); for (const a of areas) expect(m.by_identity_area[a]).toBe(1); });
    it("counts all 10 support types", () => { const types = ["cultural_activity","religious_observance","language_support","food_dietary","celebration_festival","community_connection","identity_discussion","specialist_referral","resource_provision","other"] as const; const records = types.map(t => makeRecord({ support_type: t })); const m = computeCulturalIdentityMetrics(records); for (const t of types) expect(m.by_support_type[t]).toBe(1); });
    it("counts all 5 engagement levels", () => { const levels = ["enthusiastic","engaged","neutral","reluctant","declined"] as const; const records = levels.map(l => makeRecord({ engagement_level: l })); const m = computeCulturalIdentityMetrics(records); for (const l of levels) expect(m.by_engagement_level[l]).toBe(1); });
    it("counts all 5 cultural competencies", () => { const comps = ["highly_competent","competent","developing","needs_training","not_assessed"] as const; const records = comps.map(c => makeRecord({ cultural_competency: c })); const m = computeCulturalIdentityMetrics(records); for (const c of comps) expect(m.by_cultural_competency[c]).toBe(1); });
  });

  describe("identifyCulturalIdentityAlerts", () => {
    it("returns empty for clean", () => { expect(identifyCulturalIdentityAlerts([makeRecord()])).toEqual([]); });
    it("returns empty for empty", () => { expect(identifyCulturalIdentityAlerts([])).toEqual([]); });
    it("fires declined_views_not_sought", () => { 
      const a = identifyCulturalIdentityAlerts([makeRecord({ engagement_level: "declined", child_views_sought: false, child_name: "Jo", identity_area: "gender_identity" })]);
      expect(a[0].type).toBe("declined_views_not_sought");
      expect(a[0].severity).toBe("critical");
      expect(a[0].message).toContain("Jo");
      expect(a[0].message).toContain("gender identity");
    });
    it("declined_views_not_sought per-record", () => { const a = identifyCulturalIdentityAlerts([makeRecord({ id: "a-1", engagement_level: "declined", child_views_sought: false }), makeRecord({ id: "a-2", engagement_level: "declined", child_views_sought: false })]); expect(a.filter(x => x.type === "declined_views_not_sought")).toHaveLength(2); });
    it("no alert if declined but views sought", () => { expect(identifyCulturalIdentityAlerts([makeRecord({ engagement_level: "declined", child_views_sought: true })]).filter(x => x.type === "declined_views_not_sought")).toHaveLength(0); });
    it("fires care_plan_not_reflecting singular", () => { 
      const a = identifyCulturalIdentityAlerts([makeRecord({ care_plan_reflects_identity: false })]);
      const f = a.find(x => x.type === "care_plan_not_reflecting");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 record shows");
    });
    it("care_plan_not_reflecting plural", () => { const a = identifyCulturalIdentityAlerts([makeRecord({ care_plan_reflects_identity: false }), makeRecord({ care_plan_reflects_identity: false })]); const f = a.find(x => x.type === "care_plan_not_reflecting"); expect(f!.message).toContain("2 records show"); });
    it("fires not_culturally_appropriate singular", () => { 
      const a = identifyCulturalIdentityAlerts([makeRecord({ culturally_appropriate: false })]);
      const f = a.find(x => x.type === "not_culturally_appropriate");
      expect(f).toBeDefined();
      expect(f!.severity).toBe("high");
      expect(f!.message).toContain("1 support session was");
    });
    it("not_culturally_appropriate plural", () => { const a = identifyCulturalIdentityAlerts([makeRecord({ culturally_appropriate: false }), makeRecord({ culturally_appropriate: false })]); const f = a.find(x => x.type === "not_culturally_appropriate"); expect(f!.message).toContain("2 support sessions were"); });
    it("staff_not_trained not for 1", () => { expect(identifyCulturalIdentityAlerts([makeRecord({ staff_trained: false })]).find(x => x.type === "staff_not_trained")).toBeUndefined(); });
    it("staff_not_trained fires for 2", () => { const a = identifyCulturalIdentityAlerts([makeRecord({ staff_trained: false }), makeRecord({ staff_trained: false })]); expect(a.find(x => x.type === "staff_not_trained")).toBeDefined(); });
    it("family_not_consulted not for 1", () => { expect(identifyCulturalIdentityAlerts([makeRecord({ family_consulted: false })]).find(x => x.type === "family_not_consulted")).toBeUndefined(); });
    it("family_not_consulted fires for 2", () => { const a = identifyCulturalIdentityAlerts([makeRecord({ family_consulted: false }), makeRecord({ family_consulted: false })]); expect(a.find(x => x.type === "family_not_consulted")).toBeDefined(); });
    it("fires all applicable", () => { 
      const a = identifyCulturalIdentityAlerts([makeRecord({ engagement_level: "declined", child_views_sought: false, care_plan_reflects_identity: false, culturally_appropriate: false, staff_trained: false, family_consulted: false }), makeRecord({ staff_trained: false, family_consulted: false })]);
      const types = a.map(x => x.type);
      expect(types).toContain("declined_views_not_sought");
      expect(types).toContain("care_plan_not_reflecting");
      expect(types).toContain("not_culturally_appropriate");
      expect(types).toContain("staff_not_trained");
      expect(types).toContain("family_not_consulted");
    });
  });
});

describe("tri-state judgements", () => {
  it("splits the declined-support critical between recorded not-sought and unrecorded", () => {
    const nullAlert = identifyCulturalIdentityAlerts([
      makeRecord({ engagement_level: "declined", child_views_sought: null }),
    ]).find((a) => a.type === "declined_views_not_sought");
    const falseAlert = identifyCulturalIdentityAlerts([
      makeRecord({ engagement_level: "declined", child_views_sought: false }),
    ]).find((a) => a.type === "declined_views_not_sought");
    expect(nullAlert).toBeTruthy();
    expect(falseAlert).toBeTruthy();
    expect(nullAlert!.message).not.toBe(falseAlert!.message);
  });
  it("raises no critical when views are recorded as sought", () => {
    const alerts = identifyCulturalIdentityAlerts([
      makeRecord({ engagement_level: "declined", child_views_sought: true }),
    ]);
    expect(alerts.some((a) => a.type === "declined_views_not_sought")).toBe(false);
  });
  it("does not dilute the staff-trained rate with unrecorded rows", () => {
    const rows = [true, null, null, null].map((v, i) => makeRecord({ id: `r-${i}`, staff_trained: v }));
    expect(computeCulturalIdentityMetrics(rows).staff_trained_rate).toBe(100);
  });
});
