// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Consent & Rights Literacy Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeConsentRightsIntelligence,
  type ConsentRightsInput,
  type ConsentRecordInput,
  type RightsLiteracyInput,
  type ParentalResponsibilityInput,
} from "../home-consent-rights-literacy-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeConsent(
  id: string,
  childId: string,
  overrides: Partial<ConsentRecordInput> = {},
): ConsentRecordInput {
  return {
    id,
    child_id: childId,
    category: "medical",
    status: "granted",
    date_decided: "2026-04-01",
    expiry_date: "2027-04-01",
    review_date: "2026-10-01",
    ...overrides,
  };
}

function makeRights(
  id: string,
  childId: string,
  overrides: Partial<RightsLiteracyInput> = {},
): RightsLiteracyInput {
  return {
    id,
    child_id: childId,
    recorded_date: "2026-04-01",
    knows_how_to_complain: true,
    knows_advocate: true,
    knows_ofsted_contact: true,
    knows_right_to_records: true,
    knows_right_to_refuse_contact: true,
    rights_used_count: 1,
    ...overrides,
  };
}

function makePR(
  id: string,
  childId: string,
  overrides: Partial<ParentalResponsibilityInput> = {},
): ParentalResponsibilityInput {
  return {
    id,
    child_id: childId,
    pr_documented: true,
    delegated_authorities_clear: true,
    reviewed_recently: true,
    signed_off_by_la: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<ConsentRightsInput> = {}): ConsentRightsInput {
  return {
    today: "2026-05-15",
    total_children: 4,
    consent_records: [
      makeConsent("c1", "child_1"),
      makeConsent("c2", "child_2"),
      makeConsent("c3", "child_3"),
      makeConsent("c4", "child_4"),
    ],
    rights_literacy: [
      makeRights("r1", "child_1"),
      makeRights("r2", "child_2"),
      makeRights("r3", "child_3"),
      makeRights("r4", "child_4"),
    ],
    parental_responsibility: [
      makePR("p1", "child_1"),
      makePR("p2", "child_2"),
      makePR("p3", "child_3"),
      makePR("p4", "child_4"),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Consent & Rights Literacy Intelligence Engine", () => {

  // ── Rating: insufficient_data ──────────────────────────────────────────

  it("returns insufficient_data when there are 0 children", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      total_children: 0,
      consent_records: [],
      rights_literacy: [],
      parental_responsibility: [],
    }));
    expect(r.consent_rights_rating).toBe("insufficient_data");
    expect(r.consent_rights_score).toBe(0);
    expect(r.strengths).toHaveLength(0);
    expect(r.concerns).toHaveLength(0);
    expect(r.recommendations).toHaveLength(0);
    expect(r.insights).toHaveLength(0);
  });

  // ── Rating: outstanding ────────────────────────────────────────────────

  it("rates outstanding with all-clean baseInput", () => {
    const r = computeConsentRightsIntelligence(baseInput());
    expect(r.consent_rights_rating).toBe("outstanding");
    expect(r.consent_rights_score).toBeGreaterThanOrEqual(80);
    // 52 + 6 + 5 + 6 + 4 + 5 + 4 = 82
    expect(r.consent_rights_score).toBe(82);
  });

  // ── Rating: good (65-79) ───────────────────────────────────────────────

  it("rates good when a few areas are slightly degraded", () => {
    // Degrade: 1 child's rights knowledge (3/4 literate = 75% → +3 instead of +6)
    // Degrade: 1 PR not signed off by LA (3/4 reviewed = 75% → +2 instead of +4)
    // Keep everything else at top tier.
    // Expected: 52 + 6 + 5 + 3 + 4 + 5 + 2 = 77 → good
    const r = computeConsentRightsIntelligence(baseInput({
      rights_literacy: [
        makeRights("r1", "child_1"),
        makeRights("r2", "child_2"),
        makeRights("r3", "child_3"),
        makeRights("r4", "child_4", {
          knows_how_to_complain: false,
          knows_advocate: false,
        }),
      ],
      parental_responsibility: [
        makePR("p1", "child_1"),
        makePR("p2", "child_2"),
        makePR("p3", "child_3"),
        makePR("p4", "child_4", { signed_off_by_la: false }),
      ],
    }));
    expect(r.consent_rights_score).toBeGreaterThanOrEqual(65);
    expect(r.consent_rights_score).toBeLessThan(80);
    expect(r.consent_rights_rating).toBe("good");
  });

  // ── Rating: adequate (45-64) ───────────────────────────────────────────

  it("rates adequate with moderate degradation", () => {
    // 2/4 children with consent coverage = 50% → +0
    // 2 expired out of 4 = 50% expired rate → -5
    // 2/4 literate = 50% → +0
    // 2/4 exercised out of 4 records = 50% → +4
    // 3/4 PR documented = 75% → but pct(3,4)=75 → prRate ≥60 → +0 ... wait prRate >= 80 → +3
    // Actually prRate = pct(prDocumented, total_children). Let me make 3/4 pr_documented → 75% → +3
    // reviewedRate: 2/4 = 50% → +0
    // Score: 52 + 0 + (-5) + 0 + 4 + 3 + 0 = 54 → adequate
    const r = computeConsentRightsIntelligence(baseInput({
      consent_records: [
        makeConsent("c1", "child_1"),
        makeConsent("c2", "child_2"),
        makeConsent("c3", "child_3", { status: "expired" }),
        makeConsent("c4", "child_4", { status: "expired" }),
      ],
      rights_literacy: [
        makeRights("r1", "child_1"),
        makeRights("r2", "child_2"),
        makeRights("r3", "child_3", {
          knows_how_to_complain: false,
          knows_advocate: false,
          knows_ofsted_contact: false,
          rights_used_count: 0,
        }),
        makeRights("r4", "child_4", {
          knows_how_to_complain: false,
          knows_advocate: false,
          knows_ofsted_contact: false,
          rights_used_count: 0,
        }),
      ],
      parental_responsibility: [
        makePR("p1", "child_1"),
        makePR("p2", "child_2"),
        makePR("p3", "child_3"),
        makePR("p4", "child_4", { pr_documented: false }),
      ],
    }));
    expect(r.consent_rights_score).toBeGreaterThanOrEqual(45);
    expect(r.consent_rights_score).toBeLessThan(65);
    expect(r.consent_rights_rating).toBe("adequate");
  });

  // ── Rating: inadequate (<45) ───────────────────────────────────────────

  it("rates inadequate with severe degradation across all areas", () => {
    // No consents for children 3 & 4, all expired for 1 & 2
    // coverageRate = 0% → -6
    // expiredRate = 100% → -5
    // rightsRate = 0% → -6
    // exerciseRate = 0% → -4
    // prRate = 0% → -5
    // reviewedRate = 0% → -4
    // Score: 52 - 6 - 5 - 6 - 4 - 5 - 4 = 22
    const r = computeConsentRightsIntelligence(baseInput({
      consent_records: [
        makeConsent("c1", "child_1", { status: "expired" }),
        makeConsent("c2", "child_2", { status: "expired" }),
      ],
      rights_literacy: [
        makeRights("r1", "child_1", {
          knows_how_to_complain: false,
          knows_advocate: false,
          knows_ofsted_contact: false,
          knows_right_to_records: false,
          knows_right_to_refuse_contact: false,
          rights_used_count: 0,
        }),
        makeRights("r2", "child_2", {
          knows_how_to_complain: false,
          knows_advocate: false,
          knows_ofsted_contact: false,
          knows_right_to_records: false,
          knows_right_to_refuse_contact: false,
          rights_used_count: 0,
        }),
      ],
      parental_responsibility: [
        makePR("p1", "child_1", { pr_documented: false, delegated_authorities_clear: false, reviewed_recently: false, signed_off_by_la: false }),
        makePR("p2", "child_2", { pr_documented: false, delegated_authorities_clear: false, reviewed_recently: false, signed_off_by_la: false }),
      ],
    }));
    expect(r.consent_rights_score).toBeLessThan(45);
    expect(r.consent_rights_rating).toBe("inadequate");
  });

  // ── Metrics ────────────────────────────────────────────────────────────

  it("counts active and expired consents correctly", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      consent_records: [
        makeConsent("c1", "child_1", { status: "granted" }),
        makeConsent("c2", "child_2", { status: "refused" }),
        makeConsent("c3", "child_3", { status: "expired" }),
        makeConsent("c4", "child_4", { status: "pending" }),
      ],
    }));
    expect(r.active_consents).toBe(2);   // granted + refused
    expect(r.expired_consents).toBe(1);  // expired only
  });

  it("calculates children_rights_assessed from rights_literacy records", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      rights_literacy: [
        makeRights("r1", "child_1"),
        makeRights("r2", "child_2"),
      ],
    }));
    expect(r.children_rights_assessed).toBe(2);
  });

  it("calculates rights_knowledge_rate correctly", () => {
    // 3 out of 4 children literate (know >= 4/5)
    const r = computeConsentRightsIntelligence(baseInput({
      rights_literacy: [
        makeRights("r1", "child_1"),
        makeRights("r2", "child_2"),
        makeRights("r3", "child_3"),
        makeRights("r4", "child_4", {
          knows_how_to_complain: false,
          knows_advocate: false,
        }),
      ],
    }));
    expect(r.rights_knowledge_rate).toBe(75); // pct(3, 4) = 75
  });

  it("calculates pr_documentation_rate correctly", () => {
    // 3 out of 4 with both pr_documented and delegated_authorities_clear
    const r = computeConsentRightsIntelligence(baseInput({
      parental_responsibility: [
        makePR("p1", "child_1"),
        makePR("p2", "child_2"),
        makePR("p3", "child_3"),
        makePR("p4", "child_4", { pr_documented: false }),
      ],
    }));
    expect(r.pr_documentation_rate).toBe(75); // pct(3, 4) = 75
  });

  // ── Strengths ──────────────────────────────────────────────────────────

  it("includes all strengths when all metrics are top-tier", () => {
    const r = computeConsentRightsIntelligence(baseInput());
    expect(r.strengths).toContain("Consent records in place for over 90% of children — decisions are properly documented.");
    expect(r.strengths).toContain("Over 90% of children understand their key rights — children are empowered.");
    expect(r.strengths).toContain("Less than 5% of consents expired — proactive consent management.");
    expect(r.strengths).toContain("Parental responsibility documentation is comprehensive — delegated authority is clear.");
    expect(r.strengths).toContain("Children are actively exercising their rights — voice is lived, not theoretical.");
    expect(r.strengths).toHaveLength(5);
  });

  // ── Concerns ───────────────────────────────────────────────────────────

  it("flags expired consents concern when more than 3 expired", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      consent_records: [
        makeConsent("c1", "child_1", { status: "expired" }),
        makeConsent("c2", "child_2", { status: "expired" }),
        makeConsent("c3", "child_3", { status: "expired" }),
        makeConsent("c4", "child_4", { status: "expired" }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("4 expired consents need renewal"))).toBe(true);
  });

  it("flags low rights literacy concern when rightsRate < 50", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      rights_literacy: [
        makeRights("r1", "child_1", {
          knows_how_to_complain: false,
          knows_advocate: false,
          knows_ofsted_contact: false,
        }),
      ],
    }));
    expect(r.concerns.some((c) => c.includes("Under 50% of children know their key rights"))).toBe(true);
  });

  // ── Recommendations ────────────────────────────────────────────────────

  it("recommends rights literacy and PR documentation when both below threshold", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      rights_literacy: [
        makeRights("r1", "child_1"),
        makeRights("r2", "child_2", {
          knows_how_to_complain: false,
          knows_advocate: false,
        }),
      ],
      parental_responsibility: [
        makePR("p1", "child_1"),
        makePR("p2", "child_2"),
        makePR("p3", "child_3", { pr_documented: false }),
        makePR("p4", "child_4", { pr_documented: false }),
      ],
    }));
    // rightsRate = 25% → rights literacy recommendation with Reg 7
    expect(r.recommendations.some((rec) =>
      rec.recommendation.includes("rights literacy programme") && rec.regulatory_ref === "Reg 7"
    )).toBe(true);
    // prRate = 50% → PR documentation recommendation with immediate urgency
    expect(r.recommendations.some((rec) =>
      rec.recommendation.includes("parental responsibility documentation") && rec.urgency === "immediate"
    )).toBe(true);
  });

  // ── Insights ───────────────────────────────────────────────────────────

  it("generates positive insight for outstanding rating", () => {
    const r = computeConsentRightsIntelligence(baseInput());
    expect(r.insights.some((i) =>
      i.severity === "positive" && i.text.includes("outstanding")
    )).toBe(true);
  });

  it("generates critical insight for inadequate rating", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      consent_records: [
        makeConsent("c1", "child_1", { status: "expired" }),
        makeConsent("c2", "child_2", { status: "expired" }),
      ],
      rights_literacy: [],
      parental_responsibility: [],
    }));
    expect(r.consent_rights_rating).toBe("inadequate");
    expect(r.insights.some((i) =>
      i.severity === "critical" && i.text.includes("inadequate")
    )).toBe(true);
  });

  it("generates rights-respecting culture insight when exercise >= 50 and rights >= 80", () => {
    const r = computeConsentRightsIntelligence(baseInput());
    // Default: all literate (100%) and all exercised (100%)
    expect(r.insights.some((i) =>
      i.text.includes("genuinely rights-respecting culture")
    )).toBe(true);
  });

  // ── Headline ───────────────────────────────────────────────────────────

  it("headline contains Outstanding for outstanding rating", () => {
    const r = computeConsentRightsIntelligence(baseInput());
    expect(r.headline).toContain("Outstanding");
  });

  it("headline contains Good for good rating", () => {
    const r = computeConsentRightsIntelligence(baseInput({
      rights_literacy: [
        makeRights("r1", "child_1"),
        makeRights("r2", "child_2"),
        makeRights("r3", "child_3"),
        makeRights("r4", "child_4", {
          knows_how_to_complain: false,
          knows_advocate: false,
        }),
      ],
      parental_responsibility: [
        makePR("p1", "child_1"),
        makePR("p2", "child_2"),
        makePR("p3", "child_3"),
        makePR("p4", "child_4", { signed_off_by_la: false }),
      ],
    }));
    expect(r.headline).toContain("Good");
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  it("handles children with no records at all", () => {
    const r = computeConsentRightsIntelligence({
      today: "2026-05-15",
      total_children: 3,
      consent_records: [],
      rights_literacy: [],
      parental_responsibility: [],
    });
    expect(r.consent_rights_rating).not.toBe("insufficient_data");
    expect(r.consent_rights_score).toBeGreaterThanOrEqual(0);
    expect(r.consent_rights_score).toBeLessThanOrEqual(100);
    expect(r.active_consents).toBe(0);
    expect(r.expired_consents).toBe(0);
  });

  it("clamps score to 0-100 range", () => {
    // Even with maximum penalties, score should not go below 0
    const r = computeConsentRightsIntelligence(baseInput({
      consent_records: [
        makeConsent("c1", "child_1", { status: "expired" }),
        makeConsent("c2", "child_2", { status: "expired" }),
      ],
      rights_literacy: [
        makeRights("r1", "child_1", {
          knows_how_to_complain: false,
          knows_advocate: false,
          knows_ofsted_contact: false,
          knows_right_to_records: false,
          knows_right_to_refuse_contact: false,
          rights_used_count: 0,
        }),
      ],
      parental_responsibility: [
        makePR("p1", "child_1", {
          pr_documented: false,
          delegated_authorities_clear: false,
          reviewed_recently: false,
          signed_off_by_la: false,
        }),
      ],
    }));
    expect(r.consent_rights_score).toBeGreaterThanOrEqual(0);
    expect(r.consent_rights_score).toBeLessThanOrEqual(100);
  });

});
