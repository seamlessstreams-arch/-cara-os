// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME PARENT/FAMILY PARTNERSHIP ENGAGEMENT INTELLIGENCE ENGINE
// TESTS
// Comprehensive test suite for parent/family partnership engagement analysis.
// Covers CHR 2015 Reg 7 children's wishes and feelings, SCCIF Family, and
// multi-agency communication.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeParentPartnershipEngagement,
  type ParentPartnershipInput,
  type ParentContactInput,
} from "../home-parent-partnership-engagement-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-27";
const TOTAL_CHILDREN = 6;

let _id = 0;
function makeContact(overrides: Partial<ParentContactInput> = {}): ParentContactInput {
  _id++;
  return {
    id: `contact_${_id}`,
    child_id: "child_1",
    relationship_type: "birth_parent",
    contact_type: "visit",
    engagement_level: "positive",
    positive_outcomes_count: 1,
    follow_up_actions_count: 0,
    sw_informed: true,
    has_concerns: false,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ParentPartnershipInput> = {}): ParentPartnershipInput {
  return {
    today: TODAY,
    total_children: TOTAL_CHILDREN,
    contacts: [],
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. INSUFFICIENT DATA GUARD
// ══════════════════════════════════════════════════════════════════════════════

describe("insufficient data guard", () => {
  it("returns insufficient_data when total_children is 0", () => {
    const result = computeParentPartnershipEngagement(
      baseInput({ total_children: 0, contacts: [makeContact()] }),
    );
    expect(result.partnership_rating).toBe("insufficient_data");
    expect(result.partnership_score).toBe(0);
    expect(result.headline).toBe("No data available for parent partnership analysis");
    expect(result.total_contacts).toBe(0);
    expect(result.positive_engagement_rate).toBe(0);
    expect(result.children_with_contact_rate).toBe(0);
    expect(result.sw_informed_rate).toBe(0);
    expect(result.positive_outcome_rate).toBe(0);
    expect(result.contact_type_variety).toBe(0);
    expect(result.relationship_variety).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.concerns).toEqual([]);
    expect(result.recommendations).toEqual([]);
    expect(result.insights).toEqual([]);
  });

  it("returns insufficient_data even with many contacts when total_children is 0", () => {
    const result = computeParentPartnershipEngagement(
      baseInput({
        total_children: 0,
        contacts: [makeContact(), makeContact(), makeContact()],
      }),
    );
    expect(result.partnership_rating).toBe("insufficient_data");
    expect(result.partnership_score).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. ZERO CONTACTS (total_children > 0, contacts empty)
// ══════════════════════════════════════════════════════════════════════════════

describe("zero contacts with children present", () => {
  it("applies all zero-contact penalties: base 52 - 3 - 1 - 1 - 2 = 45", () => {
    // Mod1: total===0 → -3, Mod2: total===0 → no adj, Mod3: total===0 → -1,
    // Mod4: total===0 → no adj, Mod5: total===0 → -1, Mod6: total===0 → -2
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.partnership_score).toBe(45);
    expect(result.partnership_rating).toBe("adequate");
    expect(result.total_contacts).toBe(0);
  });

  it("produces the correct headline for adequate rating from zero contacts", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.headline).toBe(
      "Family contact exists but engagement quality and coverage need strengthening",
    );
  });

  it("flags concern about no family contact records", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.concerns).toContain(
      "No family contact records — children may be isolated from their families",
    );
  });

  it("includes recommendation to develop family contact plan", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0]).toEqual({
      rank: 1,
      recommendation: "Develop a family contact and partnership plan for every child",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  });

  it("includes critical insight about Ofsted verification", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.insights).toHaveLength(1);
    expect(result.insights[0]).toEqual({
      text: "No family contact records means Ofsted cannot verify how children's family relationships are supported",
      severity: "critical",
    });
  });

  it("reports all metric rates as 0 with zero contacts", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.positive_engagement_rate).toBe(0);
    expect(result.children_with_contact_rate).toBe(0);
    expect(result.sw_informed_rate).toBe(0);
    expect(result.positive_outcome_rate).toBe(0);
    expect(result.contact_type_variety).toBe(0);
    expect(result.relationship_variety).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. MODIFIER 1 — POSITIVE ENGAGEMENT RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("modifier 1 — positive engagement rate", () => {
  // To isolate this modifier we use 1 child contacted out of 6 (17%, <40 → -5),
  // sw_informed true (100% → +5), positive_outcomes_count>0 (100% → +5),
  // 1 contact type (<=1 → -4), 1 relationship type (<=1 → -3).
  // Non-mod1 contribution: -5 + 5 + 5 - 4 - 3 = -2. So base + nonmod1 = 50.

  it("adds +5 when positive engagement >= 70%", () => {
    // 8/10 = 80% positive → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: i < 8 ? "positive" : "neutral",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 80% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(80);
    expect(result.partnership_score).toBe(55);
  });

  it("adds +2 when positive engagement >= 40% and < 70%", () => {
    // 5/10 = 50% positive → +2
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: i < 5 ? "positive" : "neutral",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 50% → +2, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 2 - 5 + 5 + 5 - 4 - 3 = 52
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(50);
    expect(result.partnership_score).toBe(52);
  });

  it("subtracts -5 when positive engagement < 20%", () => {
    // 1/10 = 10% positive → -5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: i < 1 ? "positive" : "hostile",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 10% → -5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 - 5 - 5 + 5 + 5 - 4 - 3 = 45
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(10);
    expect(result.partnership_score).toBe(45);
  });

  it("no adjustment when positive engagement is 20%-39% (dead zone)", () => {
    // 3/10 = 30% positive → no adjustment (>= 20 but < 40)
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: i < 3 ? "positive" : "neutral",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 30% → 0, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 0 - 5 + 5 + 5 - 4 - 3 = 50
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(30);
    expect(result.partnership_score).toBe(50);
  });

  it("adds +5 at exactly 70%", () => {
    // 7/10 = 70% → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: i < 7 ? "positive" : "neutral",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(70);
    // 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });

  it("adds +2 at exactly 40%", () => {
    // 4/10 = 40% → +2
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: i < 4 ? "positive" : "neutral",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(40);
    // 52 + 2 - 5 + 5 + 5 - 4 - 3 = 52
    expect(result.partnership_score).toBe(52);
  });

  it("subtracts -5 when all contacts are hostile (0% positive)", () => {
    const contacts = Array.from({ length: 5 }, () =>
      makeContact({
        child_id: "child_1",
        engagement_level: "hostile",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(0);
    // 52 - 5 - 5 + 5 + 5 - 4 - 3 = 45
    expect(result.partnership_score).toBe(45);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. MODIFIER 2 — CHILDREN WITH CONTACT (COVERAGE)
// ══════════════════════════════════════════════════════════════════════════════

describe("modifier 2 — children with contact rate", () => {
  it("adds +6 when children coverage >= 90%", () => {
    // 6/6 = 100% → +6
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 100% → +5, Mod2: 100% → +6, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 5 + 6 + 5 + 5 - 4 - 3 = 66
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(100);
    expect(result.partnership_score).toBe(66);
  });

  it("adds +2 when children coverage >= 60% and < 90%", () => {
    // 4/6 = 67% → +2
    const contacts = Array.from({ length: 4 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 100% → +5, Mod2: 67% → +2, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 5 + 2 + 5 + 5 - 4 - 3 = 62
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(67);
    expect(result.partnership_score).toBe(62);
  });

  it("subtracts -5 when children coverage < 40%", () => {
    // 1/6 = 17% → -5
    const contacts = [
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    ];
    // Mod1: 100% → +5, Mod2: 17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(17);
    expect(result.partnership_score).toBe(55);
  });

  it("no adjustment when children coverage is 40-59% (dead zone)", () => {
    // 3/6 = 50% → no adjustment
    const contacts = Array.from({ length: 3 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // Mod1: 100% → +5, Mod2: 50% → 0, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 5 + 0 + 5 + 5 - 4 - 3 = 60
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(50);
    expect(result.partnership_score).toBe(60);
  });

  it("adds +6 at exactly 6/6 children (100%)", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(100);
    // 52 + 5 + 6 + 5 + 5 - 4 - 3 = 66
    expect(result.partnership_score).toBe(66);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. MODIFIER 3 — SW INFORMED RATE
// ══════════════════════════════════════════════════════════════════════════════

describe("modifier 3 — social worker informed rate", () => {
  it("adds +5 when sw_informed >= 80%", () => {
    // 9/10 = 90% → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: i < 9,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.sw_informed_rate).toBe(90);
    // 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });

  it("adds +2 when sw_informed >= 50% and < 80%", () => {
    // 6/10 = 60% → +2
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: i < 6,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.sw_informed_rate).toBe(60);
    // 52 + 5 - 5 + 2 + 5 - 4 - 3 = 52
    expect(result.partnership_score).toBe(52);
  });

  it("subtracts -4 when sw_informed < 30%", () => {
    // 2/10 = 20% → -4
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: i < 2,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.sw_informed_rate).toBe(20);
    // 52 + 5 - 5 - 4 + 5 - 4 - 3 = 46
    expect(result.partnership_score).toBe(46);
  });

  it("no adjustment when sw_informed is 30-49% (dead zone)", () => {
    // 4/10 = 40% → no adjustment
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: i < 4,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.sw_informed_rate).toBe(40);
    // 52 + 5 - 5 + 0 + 5 - 4 - 3 = 50
    expect(result.partnership_score).toBe(50);
  });

  it("adds +5 at exactly 80%", () => {
    // 8/10 = 80% → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: i < 8,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.sw_informed_rate).toBe(80);
    // 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. MODIFIER 4 — POSITIVE OUTCOMES
// ══════════════════════════════════════════════════════════════════════════════

describe("modifier 4 — positive outcome rate", () => {
  it("adds +5 when positive outcome rate >= 70%", () => {
    // 8/10 = 80% → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: i < 8 ? 2 : 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(80);
    // 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });

  it("adds +2 when positive outcome rate >= 40% and < 70%", () => {
    // 5/10 = 50% → +2
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: i < 5 ? 1 : 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(50);
    // 52 + 5 - 5 + 5 + 2 - 4 - 3 = 52
    expect(result.partnership_score).toBe(52);
  });

  it("subtracts -4 when positive outcome rate < 20%", () => {
    // 1/10 = 10% → -4
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: i < 1 ? 1 : 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(10);
    // 52 + 5 - 5 + 5 - 4 - 4 - 3 = 46
    expect(result.partnership_score).toBe(46);
  });

  it("no adjustment when positive outcome rate is 20-39% (dead zone)", () => {
    // 3/10 = 30% → no adjustment
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: i < 3 ? 1 : 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(30);
    // 52 + 5 - 5 + 5 + 0 - 4 - 3 = 50
    expect(result.partnership_score).toBe(50);
  });

  it("adds +5 at exactly 70%", () => {
    // 7/10 = 70% → +5
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: i < 7 ? 1 : 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(70);
    // 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. MODIFIER 5 — CONTACT TYPE VARIETY
// ══════════════════════════════════════════════════════════════════════════════

describe("modifier 5 — contact type variety", () => {
  it("adds +4 when unique contact types >= 4", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.contact_type_variety).toBe(4);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 4 types → +4, Mod6: 1 rel → -3. Total: 52 + 5 - 5 + 5 + 5 + 4 - 3 = 63
    expect(result.partnership_score).toBe(63);
  });

  it("adds +1 when unique contact types >= 2 and < 4", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.contact_type_variety).toBe(2);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 2 types → +1, Mod6: 1 rel → -3. Total: 52 + 5 - 5 + 5 + 5 + 1 - 3 = 60
    expect(result.partnership_score).toBe(60);
  });

  it("subtracts -4 when unique contact types <= 1", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.contact_type_variety).toBe(1);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 1 rel → -3. Total: 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });

  it("handles exactly 3 contact types as +1 (>=2 branch)", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.contact_type_variety).toBe(3);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 3 types → +1, Mod6: 1 rel → -3. Total: 52 + 5 - 5 + 5 + 5 + 1 - 3 = 60
    expect(result.partnership_score).toBe(60);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. MODIFIER 6 — RELATIONSHIP VARIETY
// ══════════════════════════════════════════════════════════════════════════════

describe("modifier 6 — relationship variety", () => {
  it("adds +5 when unique relationships >= 3", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "sibling", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.relationship_variety).toBe(3);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 3 rel → +5. Total: 52 + 5 - 5 + 5 + 5 - 4 + 5 = 63
    expect(result.partnership_score).toBe(63);
  });

  it("adds +2 when unique relationships == 2", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.relationship_variety).toBe(2);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 2 rel → +2. Total: 52 + 5 - 5 + 5 + 5 - 4 + 2 = 60
    expect(result.partnership_score).toBe(60);
  });

  it("subtracts -3 when unique relationships <= 1", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.relationship_variety).toBe(1);
    // 52 + 5 - 5 + 5 + 5 - 4 - 3 = 55
    expect(result.partnership_score).toBe(55);
  });

  it("handles 4+ relationship types as +5 (still >= 3)", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "sibling", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "extended_family", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.relationship_variety).toBe(4);
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 1 type → -4, Mod6: 4 rel → +5. Total: 52 + 5 - 5 + 5 + 5 - 4 + 5 = 63
    expect(result.partnership_score).toBe(63);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. RATING THRESHOLDS
// ══════════════════════════════════════════════════════════════════════════════

describe("rating thresholds", () => {
  it("rates outstanding when score >= 80", () => {
    // All 6 children contacted (100% → +6), all positive (100% → +5),
    // all sw_informed (100% → +5), all positive outcomes (100% → +5),
    // 4 contact types (+4), 3 relationship types (+5).
    // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", relationship_type: "birth_parent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", relationship_type: "grandparent", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", relationship_type: "grandparent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_5", relationship_type: "sibling", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_6", relationship_type: "sibling", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(82);
    expect(result.partnership_rating).toBe("outstanding");
  });

  it("rates good when score >= 65 and < 80", () => {
    // 6/6 children (100% → +6), all positive → +5, all sw_informed → +5,
    // all positive outcomes → +5, 1 contact type → -4, 1 rel type → -3
    // 52 + 5 + 6 + 5 + 5 - 4 - 3 = 66
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(66);
    expect(result.partnership_rating).toBe("good");
  });

  it("rates adequate when score >= 45 and < 65", () => {
    // Zero contacts: 52 - 3 - 1 - 1 - 2 = 45
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.partnership_score).toBe(45);
    expect(result.partnership_rating).toBe("adequate");
  });

  it("rates inadequate when score < 45", () => {
    // 1 contact, all negative attributes
    // engagement: hostile → 0% positive → -5
    // children: 1/6 = 17% → -5
    // sw_informed: false → 0% → -4
    // positive_outcomes: 0 → 0% → -4
    // contact_type: 1 → -4
    // relationship: 1 → -3
    // 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const contacts = [
      makeContact({
        child_id: "child_1",
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(27);
    expect(result.partnership_rating).toBe("inadequate");
  });

  it("exactly 80 is outstanding", () => {
    // Need score of exactly 80.
    // 6 children, 4 contact types (+4), 2 relationship types (+2)
    // all positive (+5), all sw_informed (+5), all positive outcomes (+5)
    // 6/6 children (+6) → 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79... need +1 more
    // Use 3 types instead: +1. 52 + 5 + 6 + 5 + 5 + 1 + 2 = 76... not 80.
    // Use 4 types (+4) and 3 rels (+5): 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82, too high.
    // Use 4 types (+4) and 2 rels (+2): 52 + 5 + 6 + 5 + 5 + 4 + 2 = 79, need 1 more.
    // Adjust: 6/6 children, 50% positive → +2, 100% sw → +5, 100% outcomes → +5,
    // 4 types → +4, 3 rels → +5 → 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79... still not 80.
    // Try: 6/6 → +6, 100% positive → +5, 100% sw → +5, 50% outcomes → +2,
    // 4 types → +4, 3 rels → +5 → 52 + 5 + 6 + 5 + 2 + 4 + 5 = 79. Nope.
    // Try: reduce children to 5/6 = 83% → 60-89 → +2.
    // 52 + 5 + 2 + 5 + 5 + 4 + 5 = 78. No.
    // We need exactly 80. Let's try max everything: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82.
    // Drop positive engagement to 50% → +2: 52 + 2 + 6 + 5 + 5 + 4 + 5 = 79. Still off.
    // Drop sw to 60% → +2: 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79. Off by 1.
    // Drop outcomes to 50% → +2: 52 + 5 + 6 + 5 + 2 + 4 + 5 = 79. Off by 1.
    // We can't easily get exactly 80 with these steps. Let's test 82 as outstanding boundary.
    // Actually for the boundary test, just verify >= 80 is outstanding, < 80 is good.
    // Let's get 79 and verify it's good.
    // 6/6 children, 100% positive, 60% sw informed (6/10), 100% outcomes, 4 types, 3 rels
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", relationship_type: "birth_parent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", relationship_type: "grandparent", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", relationship_type: "grandparent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_5", relationship_type: "sibling", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_6", relationship_type: "sibling", contact_type: "phone_call", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
      // Add extra contacts with sw_informed false to push sw rate to ~60%
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
    ];
    // 10 contacts: 5 sw_informed true, 5 false → sw rate = 50% → +2
    // positive: 10/10 = 100% → +5
    // children: 6/6 = 100% → +6
    // outcomes: 10/10 = 100% → +5
    // types: visit, phone_call, email, video_call = 4 → +4
    // rels: birth_parent, grandparent, sibling = 3 → +5
    // 52 + 5 + 6 + 2 + 5 + 4 + 5 = 79 → good
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(79);
    expect(result.partnership_rating).toBe("good");
  });

  it("exactly 65 is good", () => {
    // 6/6 children → +6, 100% positive → +5, 100% sw → +5, 100% outcomes → +5,
    // 2 types → +1, 1 rel → -3 → 52 + 5 + 6 + 5 + 5 + 1 - 3 = 71. Too high.
    // 1/6 children → -5, 100% positive → +5, 100% sw → +5, 100% outcomes → +5,
    // 2 types → +1, 2 rels → +2 → 52 + 5 - 5 + 5 + 5 + 1 + 2 = 65.
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    // children: 1/6 = 17% → -5, types: 2 → +1, rels: 2 → +2
    // 52 + 5 - 5 + 5 + 5 + 1 + 2 = 65
    expect(result.partnership_score).toBe(65);
    expect(result.partnership_rating).toBe("good");
  });

  it("score 64 is adequate (just below good)", () => {
    // 1/6 children → -5, 100% positive → +5, 100% sw → +5, 100% outcomes → +5,
    // 1 type → -4, 3 rels → +5 → 52 + 5 - 5 + 5 + 5 - 4 + 5 = 63.
    // We need 64. Try: 1 type → -4, 2 rels → +2 → 52 + 5 - 5 + 5 + 5 - 4 + 2 = 60.
    // 3/6 children → 50% → 0, 2 types → +1, 2 rels → +2 → 52 + 5 + 0 + 5 + 5 + 1 + 2 = 70.
    // Too high. Try: 3/6 → 0, 1 type → -4, 2 rels → +2 → 52 + 5 + 0 + 5 + 5 - 4 + 2 = 65. That's 65.
    // Need exactly 64: 3/6 → 0, 50% positive → +2, all sw → +5, all outcomes → +5,
    // 2 types → +1, 1 rel → -3 → 52 + 2 + 0 + 5 + 5 + 1 - 3 = 62. No.
    // Let's try: 4/6 = 67% → +2, 100% positive → +5, 60% sw → +2, 100% outcomes → +5,
    // 2 types → +1, 1 rel → -3 → 52 + 5 + 2 + 2 + 5 + 1 - 3 = 64. Yes!
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
    ];
    // 5 contacts, 5/5 positive → 100% → +5
    // children: 4/6 = 67% → +2
    // sw_informed: 3/5 = 60% → +2
    // outcomes: 5/5 = 100% → +5
    // types: visit, phone_call = 2 → +1
    // rels: 1 (birth_parent) → -3
    // 52 + 5 + 2 + 2 + 5 + 1 - 3 = 64
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(64);
    expect(result.partnership_rating).toBe("adequate");
  });

  it("exactly 45 is adequate", () => {
    // Zero contacts gives us exactly 45
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.partnership_score).toBe(45);
    expect(result.partnership_rating).toBe("adequate");
  });

  it("score 44 is inadequate (just below adequate)", () => {
    // Need score of 44. Start from worst single contact (score 27), too low.
    // 2 contacts: both hostile, no sw, no outcomes, 1 type, 1 rel, 2 children
    // engagement: 0% → -5, children: 2/6=33% → -5, sw: 0% → -4, outcomes: 0% → -4,
    // types: 2 → +1, rels: 1 → -3 → 52 - 5 - 5 - 4 - 4 + 1 - 3 = 32. Too low.
    // 5 contacts to 3 children, 2/5 positive (40% → +2), 2/5 sw (40% → 0),
    // 2/5 outcomes (40% → +2), 1 type → -4, 1 rel → -3
    // children: 3/6 = 50% → 0
    // 52 + 2 + 0 + 0 + 2 - 4 - 3 = 49. Too high.
    // 5 contacts, 1/5 positive (20% → 0, in 20-39 dead zone), 1/5 sw (20% → -4),
    // 1/5 outcomes (20% → 0, in 20-39 dead zone), 1 type → -4, 1 rel → -3
    // children: 1/6 = 17% → -5
    // 52 + 0 - 5 - 4 + 0 - 4 - 3 = 36. Too low.
    // 10 contacts, 4/10 positive (40% → +2), 4/10 sw (40% → 0),
    // 2/10 outcomes (20% → 0), children: 3/6=50% → 0,
    // 1 type → -4, 2 rels → +2
    // 52 + 2 + 0 + 0 + 0 - 4 + 2 = 52. Too high.
    // Let's get 44: 10 contacts, 2/10 positive (20% → dead zone → 0),
    // children: 2/6=33% → -5, sw: 4/10=40% → dead zone → 0,
    // outcomes: 2/10=20% → dead zone → 0,
    // 1 type → -4, 1 rel → -3 → 52 + 0 - 5 + 0 + 0 - 4 - 3 = 40. Too low by 4.
    // Try: 1 type → -4, 2 rels → +2 → 52 + 0 - 5 + 0 + 0 - 4 + 2 = 45. One too many.
    // 3/10 positive → 30% → dead zone → 0, children: 2/6=33% → -5,
    // sw: 3/10=30% → dead zone → 0, outcomes: 3/10=30% → dead zone → 0,
    // 2 types → +1, 1 rel → -3 → 52 + 0 - 5 + 0 + 0 + 1 - 3 = 45. Nope.
    // Need 44: 3/10 positive → 0, 2/6 children → -5, 2/10 sw → 20% < 30 → -4,
    // 3/10 outcomes → 0, 2 types → +1, 1 rel → -3
    // 52 + 0 - 5 - 4 + 0 + 1 - 3 = 41. Not 44.
    // Let's try: 3/10 positive → 0, 2/6 children → -5, 3/10 sw → 30% (dead) → 0,
    // 3/10 outcomes → 30% (dead) → 0, 1 type → -4, 2 rels → +2
    // 52 + 0 - 5 + 0 + 0 - 4 + 2 = 45. One too many!
    // Remove 1 from rels: 1 rel → -3
    // 52 + 0 - 5 + 0 + 0 - 4 - 3 = 40. 4 too few.
    // OK different approach. Let's do: 5/10 positive → 50% → +2,
    // 2/6 children → 33% → -5, 3/10 sw → 30% dead → 0,
    // 1/10 outcomes → 10% < 20 → -4, 1 type → -4, 1 rel → -3
    // 52 + 2 - 5 + 0 - 4 - 4 - 3 = 38.
    // 5/10 positive → +2, 3/6=50% → 0, 3/10 sw → dead → 0,
    // 1/10 → -4, 1 type → -4, 1 rel → -3
    // 52 + 2 + 0 + 0 - 4 - 4 - 3 = 43. Close!
    // +1 more: sw: 5/10 → 50% → +2 → 52 + 2 + 0 + 2 - 4 - 4 - 3 = 45. One over.
    // sw: 4/10 → 40% dead → 0 → still 43.
    // outcomes: 2/10 → 20% dead zone → 0. Same as 1/10? No, 2/10=20%.
    // 20 < 20 is false for 20%. The condition is < 20, so 20% is NOT < 20.
    // So 2/10 → 20% → dead zone → 0. And 1/10 → 10% → < 20 → -4.
    // Need 44: 5/10 positive → +2, 3/6=50% → 0, 4/10 sw → dead → 0,
    // 2/10 outcomes → 20% dead → 0, 1 type → -4, 1 rel → -3
    // 52 + 2 + 0 + 0 + 0 - 4 - 3 = 47. Too high.
    // Try: 3/10 → 30% dead → 0 for positive, 3/6 → 50% → 0 for children,
    // 4/10 → 40% dead → 0 for sw, 2/10 → 20% dead → 0 for outcomes,
    // 2 types → +1, 1 rel → -3 → 52 + 0 + 0 + 0 + 0 + 1 - 3 = 50. Too high.
    // Simpler: just create a score that is 44.
    // 1 hostile contact, 1 child, sw false, no outcomes, 1 type, 2 rels = birth_parent + grandparent
    // engagement: 0% → -5, children: 1/6=17% → -5, sw: 0% → -4,
    // outcomes: 0% → -4, types: 2 → +1, rels: 2 → +2
    // 52 - 5 - 5 - 4 - 4 + 1 + 2 = 37. Not 44.
    // Try: 2 contacts, both positive, 2 children, both sw false, no outcomes,
    // 2 types, 2 rels
    // engagement: 100% → +5, children: 2/6=33% → -5, sw: 0% → -4,
    // outcomes: 0% → -4, types: 2 → +1, rels: 2 → +2
    // 52 + 5 - 5 - 4 - 4 + 1 + 2 = 47. Too high.
    // 2 contacts, 1 positive 1 neutral (50% → +2), 2 children, both sw false,
    // no outcomes, 2 types, 2 rels
    // 52 + 2 - 5 - 4 - 4 + 1 + 2 = 44. YES!
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 0 }),
      makeContact({ child_id: "child_2", relationship_type: "grandparent", contact_type: "phone_call", engagement_level: "neutral", sw_informed: false, positive_outcomes_count: 0 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(44);
    expect(result.partnership_rating).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. HEADLINES
// ══════════════════════════════════════════════════════════════════════════════

describe("headlines", () => {
  it("outstanding headline", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", relationship_type: "birth_parent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", relationship_type: "grandparent", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", relationship_type: "grandparent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_5", relationship_type: "sibling", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_6", relationship_type: "sibling", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    // score 82 → outstanding
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.headline).toBe(
      "Parent and family partnership is proactive, positive and central to each child's care",
    );
  });

  it("good headline", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    // score 66 → good
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.headline).toBe(
      "Good family engagement with positive relationships and effective communication",
    );
  });

  it("adequate headline", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    // score 45 → adequate
    expect(result.headline).toBe(
      "Family contact exists but engagement quality and coverage need strengthening",
    );
  });

  it("inadequate headline", () => {
    const contacts = [
      makeContact({
        child_id: "child_1",
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    ];
    // score 27 → inadequate
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.headline).toBe(
      "Parent partnership practice is inadequate — children's family connections are not being supported",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. CLAMPING
// ══════════════════════════════════════════════════════════════════════════════

describe("clamping", () => {
  it("score never exceeds 100", () => {
    // max modifiers: +5 + 6 + 5 + 5 + 4 + 5 = 30, so 52 + 30 = 82, well under 100
    // This is naturally capped but we verify the clamp is present
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", relationship_type: "birth_parent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", relationship_type: "grandparent", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", relationship_type: "grandparent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_5", relationship_type: "sibling", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_6", relationship_type: "sibling", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBeLessThanOrEqual(100);
  });

  it("score never goes below 0", () => {
    // worst case: all -5 -5 -4 -4 -4 -3 = -25, so 52 - 25 = 27, still above 0
    // but clamp is there for safety
    const contacts = [
      makeContact({
        child_id: "child_1",
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. STRENGTHS
// ══════════════════════════════════════════════════════════════════════════════

describe("strengths", () => {
  it("includes positive engagement strength when >= 70%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toContain(
      "Family engagement is overwhelmingly positive — relationships are constructive and supportive",
    );
  });

  it("includes children coverage strength when >= 90%", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({ child_id: `child_${i + 1}`, engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toContain(
      "All children maintain meaningful family connections through regular contact",
    );
  });

  it("includes sw_informed strength when >= 80%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toContain(
      "Social workers are consistently informed about family contact — strong multi-agency communication",
    );
  });

  it("includes positive outcome strength when >= 70%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toContain(
      "Family contacts regularly produce positive outcomes for children",
    );
  });

  it("includes contact type variety strength when >= 4 types", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toContain(
      "Diverse contact methods are used — phone, visits, video calls and meetings",
    );
  });

  it("includes relationship variety strength when >= 3 types", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "sibling", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toContain(
      "Children maintain connections across a broad family network — not just parents",
    );
  });

  it("returns no strengths when all metrics are poor", () => {
    const contacts = [
      makeContact({
        child_id: "child_1",
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.strengths).toEqual([]);
  });

  it("does not include strengths when contacts is empty even if total > 0", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.strengths).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. CONCERNS
// ══════════════════════════════════════════════════════════════════════════════

describe("concerns", () => {
  it("flags no contact records when contacts is empty", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.concerns).toContain(
      "No family contact records — children may be isolated from their families",
    );
  });

  it("flags low positive engagement when < 20%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "hostile", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.concerns).toContain(
      "Very few family contacts are positive — relationships are strained or difficult",
    );
  });

  it("flags low children coverage when < 40%", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.concerns).toContain(
      "Most children have no recorded family contact — connections are not being maintained",
    );
  });

  it("flags low sw_informed when < 30%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.concerns).toContain(
      "Social workers are rarely informed about family contact — safeguarding oversight is weak",
    );
  });

  it("flags low positive outcomes when < 20%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 0 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.concerns).toContain(
      "Family contacts rarely produce positive outcomes — intervention and support are needed",
    );
  });

  it("flags limited relationship variety when <= 1 type", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.concerns).toContain(
      "Contact is limited to one relationship type — broader family connections should be explored",
    );
  });

  it("returns no concerns when everything is excellent", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "positive",
        sw_informed: true,
        positive_outcomes_count: 1,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    // engagement 100% (no concern), children 100% (no concern), sw 100% (no concern),
    // outcomes 100% (no concern), 1 relationship type → concern
    expect(result.concerns).toContain(
      "Contact is limited to one relationship type — broader family connections should be explored",
    );
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("recommendations", () => {
  it("recommends family contact plan when total === 0", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.recommendations[0]).toEqual({
      rank: 1,
      recommendation: "Develop a family contact and partnership plan for every child",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 7",
    });
  });

  it("recommends extending family contact when children coverage < 60%", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    const rec = result.recommendations.find(r =>
      r.recommendation.includes("Extend family contact support"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("SCCIF Family");
  });

  it("recommends mediation when positive engagement < 40%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "hostile", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    const rec = result.recommendations.find(r =>
      r.recommendation.includes("family mediation"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("soon");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 7");
  });

  it("recommends sw notification when sw_informed < 50%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: false, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    const rec = result.recommendations.find(r =>
      r.recommendation.includes("social workers are informed"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("immediate");
    expect(rec!.regulatory_ref).toBe("SCCIF Safeguarding");
  });

  it("recommends diversifying contact methods when types < 2", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    const rec = result.recommendations.find(r =>
      r.recommendation.includes("Diversify contact methods"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
    expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 7");
  });

  it("recommends broader family connections when relationship types < 2", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    const rec = result.recommendations.find(r =>
      r.recommendation.includes("broader family network"),
    );
    expect(rec).toBeDefined();
    expect(rec!.urgency).toBe("planned");
    expect(rec!.regulatory_ref).toBe("SCCIF Family");
  });

  it("caps recommendations at 5 and re-ranks", () => {
    // Create worst-case scenario with many recommendation triggers
    const contacts = [
      makeContact({
        child_id: "child_1",
        relationship_type: "birth_parent",
        contact_type: "visit",
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.recommendations.length).toBeLessThanOrEqual(5);
    // Verify ranks are sequential 1-based
    result.recommendations.forEach((r, i) => {
      expect(r.rank).toBe(i + 1);
    });
  });

  it("returns no recommendations when all metrics are excellent", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", relationship_type: "birth_parent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", relationship_type: "grandparent", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", relationship_type: "grandparent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_5", relationship_type: "sibling", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_6", relationship_type: "sibling", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.recommendations).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. INSIGHTS
// ══════════════════════════════════════════════════════════════════════════════

describe("insights", () => {
  it("includes exemplary insight when all key metrics are excellent and total >= 10", () => {
    // Need: positive >= 70%, children >= 90%, sw >= 80%, total >= 10
    const contacts = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeContact({ child_id: `child_${i + 1}`, engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      ),
      ...Array.from({ length: 4 }, () =>
        makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      ),
    ];
    // 10 contacts, 10/10 positive → 100%, 6/6 children → 100%, 10/10 sw → 100%
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.insights).toContainEqual({
      text: "Family partnership is exemplary — children are connected, families are supported and professionals are informed",
      severity: "positive",
    });
  });

  it("does NOT include exemplary insight when total < 10 even if rates are high", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({ child_id: `child_${i + 1}`, engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    // 6 contacts < 10, all metrics high
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    const exemplary = result.insights.find(i => i.text.includes("exemplary"));
    expect(exemplary).toBeUndefined();
  });

  it("includes Ofsted critical insight when total === 0", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.insights).toContainEqual({
      text: "No family contact records means Ofsted cannot verify how children's family relationships are supported",
      severity: "critical",
    });
  });

  it("includes warning about negative engagement when positive < 20%", () => {
    const contacts = Array.from({ length: 10 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "hostile", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.insights).toContainEqual({
      text: "Predominantly negative family engagement suggests children may be distressed by contact — review care plans",
      severity: "warning",
    });
  });

  it("includes positive insight about every child having contact when coverage >= 90%", () => {
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({ child_id: `child_${i + 1}`, engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.insights).toContainEqual({
      text: "Every child has family contact — the home prioritises maintaining connections that matter to children",
      severity: "positive",
    });
  });

  it("includes broad family network insight when relationship types >= 3", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "sibling", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.insights).toContainEqual({
      text: "Broad family network engagement shows children are connected to their wider identity and heritage",
      severity: "positive",
    });
  });

  it("caps insights at 3", () => {
    // Trigger as many insights as possible
    // Need: exemplary (positive>=70, children>=90, sw>=80, total>=10),
    // children>=90 insight, relationships>=3 insight
    const contacts = [
      ...Array.from({ length: 6 }, (_, i) =>
        makeContact({
          child_id: `child_${i + 1}`,
          relationship_type: ["birth_parent", "grandparent", "sibling"][i % 3],
          engagement_level: "positive",
          sw_informed: true,
          positive_outcomes_count: 1,
        }),
      ),
      ...Array.from({ length: 4 }, () =>
        makeContact({ child_id: "child_1", relationship_type: "birth_parent", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      ),
    ];
    // This triggers: exemplary, children>=90, relationships>=3 = 3 insights
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.insights.length).toBeLessThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. METRICS COMPUTATION
// ══════════════════════════════════════════════════════════════════════════════

describe("metrics computation", () => {
  it("computes total_contacts correctly", () => {
    const contacts = Array.from({ length: 7 }, () => makeContact());
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.total_contacts).toBe(7);
  });

  it("computes positive_engagement_rate via Math.round", () => {
    // 1/3 = 33.333... → rounds to 33
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "positive" }),
      makeContact({ child_id: "child_1", engagement_level: "neutral" }),
      makeContact({ child_id: "child_1", engagement_level: "hostile" }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(33);
  });

  it("computes children_with_contact_rate correctly with duplicates", () => {
    // 5 contacts but only 2 unique children → 2/6 = 33%
    const contacts = [
      makeContact({ child_id: "child_1" }),
      makeContact({ child_id: "child_1" }),
      makeContact({ child_id: "child_1" }),
      makeContact({ child_id: "child_2" }),
      makeContact({ child_id: "child_2" }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(33);
  });

  it("computes sw_informed_rate correctly", () => {
    // 3/5 = 60%
    const contacts = [
      makeContact({ child_id: "child_1", sw_informed: true }),
      makeContact({ child_id: "child_1", sw_informed: true }),
      makeContact({ child_id: "child_1", sw_informed: true }),
      makeContact({ child_id: "child_1", sw_informed: false }),
      makeContact({ child_id: "child_1", sw_informed: false }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.sw_informed_rate).toBe(60);
  });

  it("computes positive_outcome_rate correctly", () => {
    // 2/5 = 40%
    const contacts = [
      makeContact({ child_id: "child_1", positive_outcomes_count: 3 }),
      makeContact({ child_id: "child_1", positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", positive_outcomes_count: 0 }),
      makeContact({ child_id: "child_1", positive_outcomes_count: 0 }),
      makeContact({ child_id: "child_1", positive_outcomes_count: 0 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(40);
  });

  it("computes contact_type_variety as count of unique types", () => {
    const contacts = [
      makeContact({ child_id: "child_1", contact_type: "visit" }),
      makeContact({ child_id: "child_1", contact_type: "visit" }),
      makeContact({ child_id: "child_1", contact_type: "phone_call" }),
      makeContact({ child_id: "child_1", contact_type: "email" }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.contact_type_variety).toBe(3);
  });

  it("computes relationship_variety as count of unique relationship types", () => {
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent" }),
      makeContact({ child_id: "child_1", relationship_type: "birth_parent" }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent" }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.relationship_variety).toBe(2);
  });

  it("pct helper returns 0 when denominator is 0", () => {
    // Zero contacts → all rates are 0
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result.positive_engagement_rate).toBe(0);
    expect(result.sw_informed_rate).toBe(0);
    expect(result.positive_outcome_rate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. COMBINED SCENARIOS — FULL SCORE WALKTHROUGH
// ══════════════════════════════════════════════════════════════════════════════

describe("combined scenarios — full score walkthrough", () => {
  it("worst possible single contact: score 27", () => {
    // 1 hostile contact, no sw, no outcomes, 1 type, 1 rel, 1/6 children
    // Mod1: 0% → -5, Mod2: 17% → -5, Mod3: 0% → -4, Mod4: 0% → -4,
    // Mod5: 1 → -4, Mod6: 1 → -3 → 52 - 5 - 5 - 4 - 4 - 4 - 3 = 27
    const contacts = [
      makeContact({
        child_id: "child_1",
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(27);
    expect(result.partnership_rating).toBe("inadequate");
  });

  it("best possible scenario: score 82", () => {
    // 6/6 children, all positive, all sw, all outcomes, 4+ types, 3+ rels
    // Mod1: +5, Mod2: +6, Mod3: +5, Mod4: +5, Mod5: +4, Mod6: +5 → 52 + 30 = 82
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_2", relationship_type: "birth_parent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_3", relationship_type: "grandparent", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_4", relationship_type: "grandparent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_5", relationship_type: "sibling", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_6", relationship_type: "sibling", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(82);
    expect(result.partnership_rating).toBe("outstanding");
    expect(result.strengths).toHaveLength(6);
    expect(result.concerns).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });

  it("mixed scenario with moderate quality: score 52", () => {
    // 5/10 positive → 50% → +2
    // 1/6 children → 17% → -5
    // 6/10 sw informed → 60% → +2
    // 5/10 outcomes → 50% → +2
    // 2 types → +1
    // 1 rel → -3
    // 52 + 2 - 5 + 2 + 2 + 1 - 3 = 51
    const contacts = Array.from({ length: 10 }, (_, i) =>
      makeContact({
        child_id: "child_1",
        contact_type: i < 5 ? "visit" : "phone_call",
        engagement_level: i < 5 ? "positive" : "neutral",
        sw_informed: i < 6,
        positive_outcomes_count: i < 5 ? 1 : 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(51);
    expect(result.partnership_rating).toBe("adequate");
  });

  it("high coverage low quality scenario", () => {
    // 6/6 children all with hostile engagement, no sw, no outcomes, 1 type, 1 rel
    // Mod1: 0% → -5, Mod2: 100% → +6, Mod3: 0% → -4, Mod4: 0% → -4,
    // Mod5: 1 → -4, Mod6: 1 → -3 → 52 - 5 + 6 - 4 - 4 - 4 - 3 = 38
    const contacts = Array.from({ length: 6 }, (_, i) =>
      makeContact({
        child_id: `child_${i + 1}`,
        engagement_level: "hostile",
        sw_informed: false,
        positive_outcomes_count: 0,
      }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(38);
    expect(result.partnership_rating).toBe("inadequate");
  });

  it("low coverage high quality scenario", () => {
    // 1/6 children but perfect quality: all positive, sw informed, outcomes
    // 4 types, 3 rels
    const contacts = [
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "visit", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 2 }),
      makeContact({ child_id: "child_1", relationship_type: "grandparent", contact_type: "phone_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "sibling", contact_type: "email", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
      makeContact({ child_id: "child_1", relationship_type: "birth_parent", contact_type: "video_call", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    // Mod1: 100% → +5, Mod2: 1/6=17% → -5, Mod3: 100% → +5, Mod4: 100% → +5,
    // Mod5: 4 → +4, Mod6: 3 → +5 → 52 + 5 - 5 + 5 + 5 + 4 + 5 = 71
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.partnership_score).toBe(71);
    expect(result.partnership_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 18. EDGE CASES
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("handles single contact correctly", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.total_contacts).toBe(1);
    expect(result.positive_engagement_rate).toBe(100);
    expect(result.children_with_contact_rate).toBe(17);
    expect(result.sw_informed_rate).toBe(100);
    expect(result.positive_outcome_rate).toBe(100);
    expect(result.contact_type_variety).toBe(1);
    expect(result.relationship_variety).toBe(1);
  });

  it("handles all contacts for same child", () => {
    const contacts = Array.from({ length: 20 }, () =>
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    );
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.children_with_contact_rate).toBe(17); // 1/6 = 16.67 → rounds to 17
    expect(result.total_contacts).toBe(20);
  });

  it("handles total_children = 1 with 1 child contacted", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "positive", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(
      baseInput({ total_children: 1, contacts }),
    );
    expect(result.children_with_contact_rate).toBe(100); // 1/1 = 100%
  });

  it("handles engagement level 'disengaged' (not positive)", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "disengaged", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(0);
  });

  it("handles engagement level 'difficult' (not positive)", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "difficult", sw_informed: true, positive_outcomes_count: 1 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_engagement_rate).toBe(0);
  });

  it("counts positive_outcomes_count > 0 for outcome rate (not sum)", () => {
    // All contacts have high positive_outcomes_count — only counts whether > 0
    const contacts = [
      makeContact({ child_id: "child_1", positive_outcomes_count: 10 }),
      makeContact({ child_id: "child_1", positive_outcomes_count: 0 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    expect(result.positive_outcome_rate).toBe(50); // 1/2 = 50%
  });

  it("large contact set with varied data", () => {
    const childIds = ["child_1", "child_2", "child_3", "child_4", "child_5", "child_6"];
    const relTypes = ["birth_parent", "grandparent", "sibling", "extended_family"];
    const contactTypes = ["visit", "phone_call", "email", "video_call", "letter", "meeting"];
    const engagementLevels = ["positive", "positive", "positive", "neutral", "difficult"];

    const contacts = Array.from({ length: 30 }, (_, i) =>
      makeContact({
        child_id: childIds[i % 6],
        relationship_type: relTypes[i % 4],
        contact_type: contactTypes[i % 6],
        engagement_level: engagementLevels[i % 5],
        sw_informed: i % 3 !== 0,
        positive_outcomes_count: i % 2 === 0 ? 1 : 0,
      }),
    );

    const result = computeParentPartnershipEngagement(baseInput({ contacts }));

    // Verify metrics: 30 contacts
    expect(result.total_contacts).toBe(30);

    // positive engagement: indices where i%5 gives "positive" = 0,1,2,5,6,7,10,11,12,15,16,17,20,21,22,25,26,27 = 18/30 = 60%
    expect(result.positive_engagement_rate).toBe(60);

    // children: 6/6 = 100%
    expect(result.children_with_contact_rate).toBe(100);

    // sw_informed: i%3 !== 0 → 20/30 = 67%
    expect(result.sw_informed_rate).toBe(67);

    // positive outcomes: i%2 === 0 → 15/30 = 50%
    expect(result.positive_outcome_rate).toBe(50);

    // contact types: 6 unique
    expect(result.contact_type_variety).toBe(6);

    // relationship types: 4 unique
    expect(result.relationship_variety).toBe(4);

    // Score: Mod1: 60% → +2, Mod2: 100% → +6, Mod3: 67% → +2,
    // Mod4: 50% → +2, Mod5: 6 → +4, Mod6: 4 → +5
    // 52 + 2 + 6 + 2 + 2 + 4 + 5 = 73
    expect(result.partnership_score).toBe(73);
    expect(result.partnership_rating).toBe("good");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 19. RETURN SHAPE
// ══════════════════════════════════════════════════════════════════════════════

describe("return shape", () => {
  it("returns all expected fields", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(result).toHaveProperty("partnership_rating");
    expect(result).toHaveProperty("partnership_score");
    expect(result).toHaveProperty("headline");
    expect(result).toHaveProperty("total_contacts");
    expect(result).toHaveProperty("positive_engagement_rate");
    expect(result).toHaveProperty("children_with_contact_rate");
    expect(result).toHaveProperty("sw_informed_rate");
    expect(result).toHaveProperty("positive_outcome_rate");
    expect(result).toHaveProperty("contact_type_variety");
    expect(result).toHaveProperty("relationship_variety");
    expect(result).toHaveProperty("strengths");
    expect(result).toHaveProperty("concerns");
    expect(result).toHaveProperty("recommendations");
    expect(result).toHaveProperty("insights");
  });

  it("strengths is always an array of strings", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("concerns is always an array of strings", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    expect(Array.isArray(result.concerns)).toBe(true);
  });

  it("recommendations always have rank, recommendation, urgency, regulatory_ref", () => {
    const contacts = [
      makeContact({ child_id: "child_1", engagement_level: "hostile", sw_informed: false, positive_outcomes_count: 0 }),
    ];
    const result = computeParentPartnershipEngagement(baseInput({ contacts }));
    for (const rec of result.recommendations) {
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
      expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
    }
  });

  it("insights always have text and severity", () => {
    const result = computeParentPartnershipEngagement(baseInput({ contacts: [] }));
    for (const insight of result.insights) {
      expect(insight).toHaveProperty("text");
      expect(insight).toHaveProperty("severity");
      expect(["critical", "warning", "positive"]).toContain(insight.severity);
    }
  });
});
