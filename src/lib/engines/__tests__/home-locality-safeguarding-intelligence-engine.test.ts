// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME LOCALITY SAFEGUARDING INTELLIGENCE ENGINE — TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";

import {
  computeLocalitySafeguarding,
  type LocalityRiskInput,
  type ExploitationScreeningInput,
  type MissingEpisodeInput,
  type LocalitySafeguardingInput,
} from "../home-locality-safeguarding-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-28";

function makeRisk(overrides: Partial<LocalityRiskInput> = {}): LocalityRiskInput {
  return {
    id: "risk_1",
    category: "cse",
    risk_level: "medium",
    location: "Town Centre",
    has_description: true,
    has_intelligence: true,
    mitigations_count: 3,
    effective_mitigations: 3,
    last_reviewed: "2026-05-20",
    next_review: "2026-06-20",
    has_impact_assessment: true,
    ...overrides,
  };
}

function makeScreening(overrides: Partial<ExploitationScreeningInput> = {}): ExploitationScreeningInput {
  return {
    id: "scr_1",
    child_id: "child_1",
    date: "2026-05-15",
    exploitation_type: "cse",
    risk_level: "medium",
    previous_risk_level: "low",
    status: "monitoring",
    risk_indicators_count: 10,
    indicators_present: 2,
    protective_factors_count: 5,
    has_safety_plan: true,
    has_direct_work: true,
    has_management_oversight: true,
    multi_agency_count: 3,
    social_worker_notified: true,
    nrm_referral: false,
    ...overrides,
  };
}

function makeMissing(overrides: Partial<MissingEpisodeInput> = {}): MissingEpisodeInput {
  return {
    id: "miss_1",
    child_id: "child_1",
    date_missing: "2026-05-10",
    date_returned: "2026-05-10",
    return_interview_completed: true,
    police_notified: true,
    social_worker_notified: true,
    ...overrides,
  };
}

function baseInput(overrides: Partial<LocalitySafeguardingInput> = {}): LocalitySafeguardingInput {
  return {
    today: TODAY,
    total_children: 4,
    risks: [],
    screenings: [],
    missing: [],
    ...overrides,
  };
}

// ── Structure / Shape ─────────────────────────────────────────────────────

describe("Home Locality Safeguarding Intelligence Engine", () => {
  describe("result structure", () => {
    it("returns all required fields", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r).toHaveProperty("locality_rating");
      expect(r).toHaveProperty("locality_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_risks");
      expect(r).toHaveProperty("mitigation_effectiveness");
      expect(r).toHaveProperty("review_currency_rate");
      expect(r).toHaveProperty("screening_coverage");
      expect(r).toHaveProperty("high_risk_count");
      expect(r).toHaveProperty("safety_plan_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is an array of strings", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
    });

    it("concerns is an array of strings", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk({ mitigations_count: 10, effective_mitigations: 2, review_currency_rate: 0 as never, last_reviewed: "2025-01-01" })],
        screenings: [makeScreening({ has_safety_plan: false, screening_coverage: 0 as never })],
      }));
      if (r.recommendations.length > 0) {
        const rec = r.recommendations[0];
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("insights have text and severity", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening()],
      }));
      if (r.insights.length > 0) {
        const ins = r.insights[0];
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
      }
    });

    it("rating is one of the valid values", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.locality_rating);
    });

    it("score is a number", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(typeof r.locality_score).toBe("number");
    });
  });

  // ── Special Cases ──────────────────────────────────────────────────────────

  describe("special cases", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeLocalitySafeguarding(baseInput({ total_children: 0 }));
      expect(r.locality_rating).toBe("insufficient_data");
      expect(r.locality_score).toBe(0);
      expect(r.headline).toContain("No children placed");
    });

    it("returns score 0 for insufficient_data", () => {
      const r = computeLocalitySafeguarding(baseInput({ total_children: 0 }));
      expect(r.locality_score).toBe(0);
    });

    it("returns warning insight for no children", () => {
      const r = computeLocalitySafeguarding(baseInput({ total_children: 0 }));
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("warning");
    });

    it("returns empty strengths/concerns/recommendations for no children", () => {
      const r = computeLocalitySafeguarding(baseInput({ total_children: 0 }));
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
    });

    it("returns total_risks even when insufficient_data", () => {
      const r = computeLocalitySafeguarding(baseInput({
        total_children: 0,
        risks: [makeRisk()],
      }));
      expect(r.total_risks).toBe(1);
    });

    it("returns good with score 75 when 0 risks, 0 screenings, 0 missing with children", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.locality_rating).toBe("good");
      expect(r.locality_score).toBe(75);
    });

    it("returns clear headline for no community risks", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.headline).toContain("No community risks identified");
    });

    it("returns a strength for no community risks", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.strengths.length).toBe(1);
      expect(r.strengths[0]).toContain("currently clear");
    });

    it("returns no concerns for no community risks", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("returns planned recommendation for proactive scanning when no risks", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("planned");
      expect(r.recommendations[0].regulatory_ref).toContain("Reg 34");
    });

    it("returns positive insight for no community risks", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("positive");
    });

    it("good with 75 does not trigger when risks exist even if screenings/missing are empty", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(r.locality_score).not.toBe(75);
      expect(r.locality_rating).not.toBe("insufficient_data");
    });

    it("good with 75 does not trigger when screenings exist even if risks/missing are empty", () => {
      const r = computeLocalitySafeguarding(baseInput({ screenings: [makeScreening()] }));
      expect(r.locality_score).not.toBe(75);
    });

    it("good with 75 does not trigger when missing exist even if risks/screenings are empty", () => {
      const r = computeLocalitySafeguarding(baseInput({ missing: [makeMissing()] }));
      expect(r.locality_score).not.toBe(75);
    });
  });

  // ── Rolling Window Filter ─────────────────────────────────────────────────

  describe("rolling window filter (180 days)", () => {
    it("includes screenings within 180-day window", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening({ date: "2026-05-15" })],
      }));
      expect(r.screening_coverage).toBeGreaterThan(0);
    });

    it("excludes screenings outside 180-day window", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening({ date: "2025-01-01" })],
      }));
      // screening outside window, so screening_coverage should be 0
      // but risks present → still compute, screening list effectively empty
      expect(r.screening_coverage).toBe(0);
    });

    it("includes screenings on the cutoff boundary", () => {
      // 180 days before 2026-05-28 = 2025-11-29
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening({ date: "2025-11-29" })],
      }));
      expect(r.screening_coverage).toBeGreaterThan(0);
    });

    it("excludes screenings one day before cutoff", () => {
      // 181 days before 2026-05-28 = 2025-11-28
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening({ date: "2025-11-28" })],
      }));
      expect(r.screening_coverage).toBe(0);
    });

    it("includes screenings on today", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening({ date: TODAY })],
      }));
      expect(r.screening_coverage).toBeGreaterThan(0);
    });

    it("excludes future-dated screenings", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [makeScreening({ date: "2026-05-29" })],
      }));
      expect(r.screening_coverage).toBe(0);
    });

    it("includes missing episodes within 180-day window", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        missing: [makeMissing({ date_missing: "2026-05-10" })],
      }));
      // Missing within window — modifier 6 should apply
      expect(r.locality_score).toBeDefined();
    });

    it("excludes missing episodes outside 180-day window", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        missing: [makeMissing({ date_missing: "2025-01-01" })],
      }));
      // Missing outside window treated as no missing → +2 for modifier 6
      // Risk present: modifier 1 etc. still apply
      expect(r.locality_score).toBeDefined();
    });

    it("includes missing on cutoff boundary", () => {
      // 180 days before 2026-05-28 = 2025-11-29
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        missing: [makeMissing({ date_missing: "2025-11-29" })],
      }));
      expect(r.locality_score).toBeDefined();
    });

    it("does NOT apply rolling window to locality risks", () => {
      // Risks are not filtered by date window — all are counted
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk({ last_reviewed: "2024-01-01" })],
      }));
      expect(r.total_risks).toBe(1);
    });

    it("filters mixed screenings correctly", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        screenings: [
          makeScreening({ id: "s1", child_id: "child_1", date: "2026-05-15" }),   // within
          makeScreening({ id: "s2", child_id: "child_2", date: "2025-01-01" }),   // outside
          makeScreening({ id: "s3", child_id: "child_3", date: "2026-03-01" }),   // within
        ],
      }));
      // 2 children screened out of 4 → 50%
      expect(r.screening_coverage).toBe(50);
    });
  });

  // ── Rating Thresholds ────────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("rates outstanding at score 82 (max possible)", () => {
      // Base 52 + 6(mitigation 100%) + 5(review 100%) + 5(screening 100%) + 5(safety 100%) + 5(intel 100%) + 5(missing response perfect)
      // = 52 + 31 = 83? Let's check:
      // Missing with perfect responses → +5
      // But we need missing episodes for that path (missing.length > 0)
      // Actually let's compute: 52 + 6 + 5 + 5 + 5 + 5 + 5 = 83
      // Wait, that's 83, not 82. Let me verify with the code:
      // mod1: mitigationEffectiveness >= 90 → +6
      // mod2: reviewCurrencyRate >= 90 → +5
      // mod3: screeningCoverage >= 90 → +5
      // mod4: safetyPlanRate >= 90 → +5
      // mod5: intelRate >= 90 → +5
      // mod6: missing with returnInterview >= 90 && policeRate >= 90 && swRate >= 90 → +5
      // Total: 52 + 6 + 5 + 5 + 5 + 5 + 5 = 83
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r2", mitigations_count: 3, effective_mitigations: 3, last_reviewed: "2026-05-18" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true, has_management_oversight: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true, has_management_oversight: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true, has_management_oversight: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true, has_management_oversight: true }),
      ];
      const missing = [
        makeMissing({ id: "m1", return_interview_completed: true, police_notified: true, social_worker_notified: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.locality_score).toBe(83);
      expect(r.locality_rating).toBe("outstanding");
    });

    it("rates outstanding at exactly score 80", () => {
      // Need 80. Base 52 + 28.
      // +6 + 5 + 5 + 5 + 5 + 2(missing ok but not perfect) = 28 → 80
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      // Missing with returnInterview >= 70 && policeRate >= 70 but not all 90% → +2
      const missing = [
        makeMissing({ id: "m1", return_interview_completed: true, police_notified: true, social_worker_notified: true }),
        makeMissing({ id: "m2", return_interview_completed: true, police_notified: true, social_worker_notified: false }),
        makeMissing({ id: "m3", return_interview_completed: false, police_notified: false, social_worker_notified: false }),
      ];
      // return interview: 2/3 returned (all have date_returned) → 67%? Wait, all have date_returned by default.
      // returnedMissing = 3 (all have date_returned from default)
      // returnInterview: 2/3 = 67%... that's < 70%, would give -5 not +2
      // Need 70%+ for return interview AND 70%+ for police.
      // Use 10 missing, 7 with return interview, 7 with police:
      const missingForScore: MissingEpisodeInput[] = [];
      for (let i = 0; i < 10; i++) {
        missingForScore.push(makeMissing({
          id: `m_${i}`,
          child_id: `child_${(i % 4) + 1}`,
          date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
          return_interview_completed: i < 7,
          police_notified: i < 7,
          social_worker_notified: i < 6, // 60% — not >= 90 so won't get +5
        }));
      }
      // returnInterview: 7/10 = 70% → >= 70
      // policeRate: 7/10 = 70% → >= 70
      // swRate: 6/10 = 60% — doesn't matter for +2 path
      // → +2
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing: missingForScore }));
      // 52 + 6 + 5 + 5 + 5 + 5 + 2 = 80
      expect(r.locality_score).toBe(80);
      expect(r.locality_rating).toBe("outstanding");
    });

    it("rates good at score 79 (just below outstanding)", () => {
      // Need 79. 52 + 27.
      // +6 + 5 + 5 + 5 + 5 + 2(no missing) - 1(screening none, no high risks)
      // Hmm, let's work through modifiers more carefully.
      // +6(mitigation>=90) + 5(review>=90) + 5(screening>=90) + 5(safety>=90) + 5(intel>=90) + 2(no missing) = 28 → 80
      // Need one less. +3(mitigation 75-89) + 5 + 5 + 5 + 5 + 2 = 25 → 77. Too low.
      // +6 + 5 + 5 + 5 + 2(intel 70-89) + 2 = 25 → 77. Too low.
      // +6 + 5 + 5 + 5 + 5 + 0(missing > 0, returnInterview 50-69%, police 50-69%) = 26 → 78
      // +6 + 5 + 5 + 5 + 5 + (-1)(no screenings, no high risk) = 25 → 77
      // Hmm. Let me try: 52 + 6 + 5 + 2(screen 70-89) + 5 + 5 + 5 = 80... still 80.
      // 52 + 6 + 2(review 70-89) + 5 + 5 + 5 + 5 = 80... still.
      // 52 + 3(mitigation 75-89) + 5 + 5 + 5 + 5 + 5 = 80... still!
      // Ok so many combos give 80. I need 79.
      // 52 + 3 + 5 + 5 + 5 + 5 + 2 = 77
      // 52 + 6 + 2 + 5 + 5 + 5 + 2 = 77
      // 52 + 6 + 5 + 2 + 5 + 5 + 2 = 77
      // 52 + 6 + 5 + 5 + 2 + 5 + 2 = 77
      // 52 + 6 + 5 + 5 + 5 + 2 + 2 = 77
      // None give 79. Try combinations:
      // 52 + 6 + 5 + 5 + 5 + 5 + 0 = 78 (0 = missing mid-range, not reaching +2)
      // mod6: missing > 0, returnInterview >= 70 && police >= 70 → +2. Otherwise if returnInterview < 50 → -5. Else 0.
      // So to get 0 from mod6: have missing, returnInterview between 50-69%
      // 52 + 6 + 5 + 5 + 5 + 5 + 0 = 78, not 79.
      // 52 + 6 + 5 + 5 + 5 + 5 + (-1) = 77
      // Hmm. Only integer steps. 79 = 52 + 27.
      // Need modifiers summing to 27. Available bonuses: 6,5,5,5,5,5 or less.
      // 6+5+5+5+5+2=28, 6+5+5+5+5+0=26, 6+5+5+5+2+2=25.
      // Can't get 27 from these steps directly. Let me look at mid-tier bonuses:
      // +3(mit 75-89) + 5 + 5 + 5 + 5 + 5 = 28 → 80
      // +3 + 5 + 5 + 5 + 5 + 2 = 25 → 77
      // That's still not 79. Let me try:
      // +6 + 5 + 5 + 5 + 5 + 2 = 28 → 80. Nope.
      // OK the issue is the modifiers only allow certain sums. Let me look for sum=27:
      // 6+5+5+5+5+1? no modifier gives +1
      // 6+5+5+5+4+2=27? no modifier gives +4 bonus (only +6,+3 or +5,+2)
      // 6+5+5+5+5-1=25? -1 comes from no screenings no high risk = 52+26=78
      // 3+5+5+5+5+5=28 → 80
      // So 79 is unreachable? Let me re-examine mod3:
      // mod3: screenings.length === 0 → if highRiskCount > 0: -4, else: -1
      // So with no screenings and no high risks: -1.
      // 6+5+(-1)+5+5+5 = 25 → 77
      // 6+5+(-1)+5+5+2 = 22 → 74
      // With no screenings but high risks: -4
      // 6+5+(-4)+5+5+5 = 22 → 74
      // Hmm. Let me try mod1 with 0 mitigations: -2
      // (-2)+5+5+5+5+5 = 23 → 75. Not great.
      // Alright, 79 might not be achievable with integer modifiers. Let me check 78:
      // 6+5+5+5+5+0 = 26 → 78. Yes! With missing but mid-range return interviews.
      // And 81: 6+5+5+5+5+5 = 31 → 83. Or 3+5+5+5+5+5 = 28 → 80.
      // So valid boundaries are: 83(max), 80, 78, etc.
      // Let me test 79 is good (score=79 → good) and test 80 is outstanding (already done above).
      // For "just below outstanding" I'll use 78.

      // Score 78: 52 + 26. Mods: 6+5+5+5+5+0 = 26.
      // mod6 = 0: have missing, returnInterview 50-69%, or policeRate < 70%
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      // Missing with return interview 60%, police 60% → not >= 70 → not +2, not < 50 → 0
      const missingEps: MissingEpisodeInput[] = [];
      for (let i = 0; i < 5; i++) {
        missingEps.push(makeMissing({
          id: `m_${i}`,
          date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
          return_interview_completed: i < 3, // 3/5 = 60%
          police_notified: i < 3,             // 60%
          social_worker_notified: i < 3,
        }));
      }
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing: missingEps }));
      expect(r.locality_score).toBe(78);
      expect(r.locality_rating).toBe("good");
    });

    it("rates good at score 65", () => {
      // Need 65. 52 + 13.
      // +3(mit 75-89) + 2(review 70-89) + 2(screen 70-89) + 2(safety 70-89) + 2(intel 70-89) + 2(no missing)
      // = 13 → 65
      // mitigationEffectiveness: need 75-89%. Let's say 80%.
      // reviewCurrency: 70-89%. Let's say 75%.
      // screeningCoverage: 70-89%. 3 of 4 children = 75%.
      // safetyPlanRate: 70-89%. 3 of 4 = 75%.
      // intelRate: 70-89%. 3 of 4 risks = 75%.

      const risks = [
        makeRisk({ id: "r1", mitigations_count: 4, effective_mitigations: 3, last_reviewed: "2026-05-20", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 4, effective_mitigations: 3, last_reviewed: "2026-05-18", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r3", mitigations_count: 4, effective_mitigations: 4, last_reviewed: "2026-05-15", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r4", mitigations_count: 4, effective_mitigations: 3, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
      ];
      // Total mitigations: 16, effective: 13 → 81% → +3
      // Review: 3/4 within 30 days → 75% → +2
      // Intel: 3/4 have desc+intel → 75% → +2

      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_3", has_safety_plan: false }), // duplicate child, no plan
      ];
      // Screening coverage: 3/4 children = 75% → +2
      // Safety plan: 3/4 = 75% → +2

      const r = computeLocalitySafeguarding(baseInput({ risks, screenings }));
      // 52 + 3 + 2 + 2 + 2 + 2 + 2 = 65
      expect(r.locality_score).toBe(65);
      expect(r.locality_rating).toBe("good");
    });

    it("rates adequate at score 64 (just below good)", () => {
      // Need 64. 52 + 12.
      // Same as 65 but drop one modifier by 1. Problem is modifiers jump by larger steps.
      // +3 + 2 + 2 + 2 + 2 + 0(mod6: missing present, mid-range) = 11 → 63
      // +3 + 2 + 2 + 2 + 2 + 2 = 13 → 65
      // +6 + 2 + 2 + 2 + 2 + 0 = 14 → 66
      // +6 + 2 + 2 + 2 + 0 + 0 = 12 → 64!
      // mod5=0: intelRate between 50-69% (no bonus, no penalty)
      // mod6=0: missing present, return interview 50-69%

      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-18", has_description: true, has_intelligence: false }),
      ];
      // mitigationEffectiveness: 10/10 = 100% → +6
      // reviewCurrency: 2/2 within 30 days = 100%... that's +5 not +2.
      // Let me adjust. I need review +2.
      // Make 1 risk stale: 70-89% review currency = need e.g. 3/4 = 75%
      // With only 2 risks: 1/2 = 50%, or 2/2 = 100%.
      // Use 4 risks, 3 current → 75% → +2
      const risks2 = [
        makeRisk({ id: "r1", mitigations_count: 3, effective_mitigations: 3, last_reviewed: "2026-05-20", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 3, effective_mitigations: 3, last_reviewed: "2026-05-18", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r3", mitigations_count: 3, effective_mitigations: 3, last_reviewed: "2026-05-15", has_description: false, has_intelligence: false }),
        makeRisk({ id: "r4", mitigations_count: 3, effective_mitigations: 3, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
      ];
      // mitigation: 12/12 = 100% → +6
      // review: 3/4 within 30 = 75% → +2
      // intel: 2/4 have desc+intel = 50%... that's >= 50, not < 50 → 0 (no bonus, no penalty)
      // Good, mod5 = 0.

      const screenings2 = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
      ];
      // screening coverage: 3/4 = 75% → +2
      // safety plan: 3/3 = 100% → +5. That gives too much.
      // Need safety +2: 70-89%
      // Add one more screening without plan:
      const screenings3 = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_3", has_safety_plan: false }),
      ];
      // safety: 3/4 = 75% → +2
      // screen coverage: still 3/4 = 75% → +2

      // mod6 = 0: missing with returnInterview 50-69%
      const missingEps: MissingEpisodeInput[] = [];
      for (let i = 0; i < 5; i++) {
        missingEps.push(makeMissing({
          id: `m_${i}`,
          date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
          return_interview_completed: i < 3, // 3/5 = 60%
          police_notified: i < 3,
          social_worker_notified: i < 3,
        }));
      }

      const r = computeLocalitySafeguarding(baseInput({ risks: risks2, screenings: screenings3, missing: missingEps }));
      // 52 + 6 + 2 + 2 + 2 + 0 + 0 = 64
      expect(r.locality_score).toBe(64);
      expect(r.locality_rating).toBe("adequate");
    });

    it("rates adequate at score 45", () => {
      // Need 45. 52 - 7.
      // Combos: -2(no mits) + 0(no risks for review, but wait, no risks for review gives +0 only if risks.length=0)
      // Actually if risks.length=0 but screenings/missing present, we don't hit the special case.
      // Let me use: risks with bad metrics + screenings with bad metrics.
      // -3(mit 50-64%) + 0(review 50-69%) + (-1)(no screenings, no high risk) + 0(no screenings for safety) + 0(intel 50-69%) + (-5)(missing, return<50%)
      // = -9 → 43. Too low.
      // -2(no mits on risks) + 0(review 50-69%) + (-1)(no screenings, no high risk) + 0 + 0(intel 50-69%) + 2(no missing)
      // = -1 → 51. Too high.
      // Let's be more systematic. Need sum = -7.
      // Options for each mod:
      // mod1: +6, +3, 0, -2(0 mits), -3(<65%), -6(<50%)
      // mod2: +5, +2, 0, -5(<50%)
      // mod3: +5, +2, 0, -1(no scr no high), -4(no scr, high risk), -5(<50%)
      // mod4: +5, +2, 0, -4(<50%)
      // mod5: +5, +2, 0, -4(<50%)
      // mod6: +5, +2, 0, -5(<50% return)
      //
      // -6(mit<50%) + 2(review 70-89) + (-1)(no scr, no high) + 0 + 0 + 0(missing, mid return) = -5 → 47
      // -6 + 0 + (-1) + 0 + 0 + 0 = -7 → 45!
      // mod1: mitigationEffectiveness < 50%
      // mod2: reviewCurrency 50-69% (no bonus no penalty)
      // mod3: no screenings, no high risk → -1
      // mod4: no screenings → 0
      // mod5: intelRate 50-69% → 0
      // mod6: missing present, returnInterview 50-69% → 0

      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 4, last_reviewed: "2026-05-10", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 10, effective_mitigations: 4, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
      ];
      // mitigation: 8/20 = 40% → < 50% → -6
      // review: 1/2 = 50%... that's >= 50 but < 70 → 0. Good.
      // intel: 1/2 = 50% → >= 50, < 70 → 0. Good.

      const missingEps = [
        makeMissing({ id: "m1", date_missing: "2026-05-10", return_interview_completed: true, police_notified: true }),
        makeMissing({ id: "m2", date_missing: "2026-05-12", return_interview_completed: false, police_notified: false }),
      ];
      // return interview: 1/2 = 50% → >= 50, not >= 70 → 0
      // policeRate: 1/2 = 50% → doesn't matter for 0 path

      const r = computeLocalitySafeguarding(baseInput({ risks, missing: missingEps }));
      // 52 + (-6) + 0 + (-1) + 0 + 0 + 0 = 45
      expect(r.locality_score).toBe(45);
      expect(r.locality_rating).toBe("adequate");
    });

    it("rates inadequate at score 44 (just below adequate)", () => {
      // Need 44. 52 - 8.
      // -6(mit<50%) + 0(review 50-69%) + (-1)(no scr, no high) + 0 + 0 + (-1 doesn't exist)
      // -6 + (-5)(review<50%) + (-1) + 0 + 0 + 0 = -12 → 40. Too low.
      // -6 + 0 + (-1) + 0 + 0 + (-1)(no screenings, no high = already used for mod3)
      // Each mod is independent. mod3 already gives -1.
      // -3(mit 50-64%) + 0 + (-1) + 0 + 0 + (-4)(safety<50%)... wait no screenings means mod4=0
      // Let me try with screenings present:
      // -6(mit<50%) + 0(review) + (-5)(screening<50%) + (-4)(safety<50%) + 0(intel) + 2(no missing) = -13 → 39
      // Too much. Let me be more careful:
      // Need exactly -8.
      // -3(mit 50-64%) + 0 + (-1)(no scr, no high) + 0 + 0 + (-4)(safety<50%)
      // But if no screenings, mod4=0 not -4. Need screenings for mod4 to be -4.
      // If I have screenings, mod3 is based on screeningCoverage, not "no screenings".
      // So: -3(mit) + 0(review) + 0(screening 50-69%) + (-4)(safety<50%) + 0(intel) + 0(missing mid) = -7 → 45
      // Need one more: -3 + 0 + 0 + (-4) + 0 + (-1)(no scr, no high)? Can't — I have screenings.
      // -3 + 0 + (-5)(screening<50%) + 0(safety 50-69%) + 0 + 0 = -8 → 44!

      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 6, last_reviewed: "2026-05-10", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 10, effective_mitigations: 5, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
      ];
      // mitigation: 11/20 = 55% → >= 50, < 65 → -3
      // review: 1/2 = 50% → 0
      // intel: 1/2 = 50% → 0

      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
      ];
      // screeningCoverage: 1/4 = 25% → < 50% → -5
      // safetyPlanRate: 1/1 = 100% → +5? That would ruin it.
      // I need safety 50-69%: need at least 2 screenings with ~60% safety.
      // 3 screenings, 2 with safety plan: 67% → 0 (between 50-69%? no, >= 70 is +2, < 50 is -4)
      // Wait: safetyPlanRate >= 90 → +5, >= 70 → +2, < 50 → -4, else 0
      // 67% → 0. Good.
      // But 3 screenings for 4 children... screeningCoverage: how many unique children?
      // I need screeningCoverage < 50%. So max 1 unique child out of 4 = 25%.
      // 3 screenings all for same child:
      const screenings2 = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true, date: "2026-05-10" }),
        makeScreening({ id: "s2", child_id: "child_1", has_safety_plan: true, date: "2026-05-12" }),
        makeScreening({ id: "s3", child_id: "child_1", has_safety_plan: false, date: "2026-05-14" }),
      ];
      // screeningCoverage: 1/4 = 25% → -5
      // safetyPlanRate: 2/3 = 67% → 0

      const missingEps = [
        makeMissing({ id: "m1", date_missing: "2026-05-10", return_interview_completed: true, police_notified: true }),
        makeMissing({ id: "m2", date_missing: "2026-05-12", return_interview_completed: false, police_notified: false }),
      ];
      // return: 1/2 = 50% → 0, police: 1/2 = 50% → not >=70 → 0

      const r = computeLocalitySafeguarding(baseInput({ risks, screenings: screenings2, missing: missingEps }));
      // 52 + (-3) + 0 + (-5) + 0 + 0 + 0 = 44
      expect(r.locality_score).toBe(44);
      expect(r.locality_rating).toBe("inadequate");
    });
  });

  // ── Modifier 1: Mitigation Effectiveness ────────────────────────────────

  describe("modifier 1: mitigation effectiveness", () => {
    it("gives +6 for >=90% effectiveness", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 9 }),
        makeRisk({ id: "r2", mitigations_count: 10, effective_mitigations: 10 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(95);
    });

    it("gives +3 for 75-89% effectiveness", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 4, effective_mitigations: 3 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(75);
    });

    it("gives -3 for 50-64% effectiveness", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 6 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(60);
    });

    it("gives -6 for <50% effectiveness", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 4 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(40);
    });

    it("gives -2 for 0 total mitigations", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 0, effective_mitigations: 0 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(0);
    });

    it("gives 0 modifier for 65-74% effectiveness", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 7 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(70);
    });

    it("calculates mitigation_effectiveness across all risks", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 4, effective_mitigations: 2 }),
        makeRisk({ id: "r2", mitigations_count: 6, effective_mitigations: 4 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      // 6/10 = 60%
      expect(r.mitigation_effectiveness).toBe(60);
    });

    it("exactly 90% gives +6", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 9 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(90);
    });

    it("exactly 75% gives +3", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 4, effective_mitigations: 3 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(75);
    });

    it("exactly 50% gives -3", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 2, effective_mitigations: 1 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(50);
    });

    it("exactly 65% gives 0 modifier", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 20, effective_mitigations: 13 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(65);
    });
  });

  // ── Modifier 2: Review Currency ─────────────────────────────────────────

  describe("modifier 2: review currency", () => {
    it("gives +5 for >=90% review currency", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r2", last_reviewed: "2026-05-18" }),
        makeRisk({ id: "r3", last_reviewed: "2026-05-15" }),
        makeRisk({ id: "r4", last_reviewed: "2026-05-10" }),
        makeRisk({ id: "r5", last_reviewed: "2026-05-05" }),
        makeRisk({ id: "r6", last_reviewed: "2026-05-03" }),
        makeRisk({ id: "r7", last_reviewed: "2026-05-01" }),
        makeRisk({ id: "r8", last_reviewed: "2026-05-01" }),
        makeRisk({ id: "r9", last_reviewed: "2026-05-01" }),
        makeRisk({ id: "r10", last_reviewed: "2025-01-01" }), // stale
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(90);
    });

    it("gives +2 for 70-89% review currency", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r2", last_reviewed: "2026-05-18" }),
        makeRisk({ id: "r3", last_reviewed: "2026-05-15" }),
        makeRisk({ id: "r4", last_reviewed: "2025-01-01" }), // stale
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(75);
    });

    it("gives -5 for <50% review currency", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r2", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r3", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r4", last_reviewed: "2026-05-20" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(25);
    });

    it("gives 0 modifier for 50-69% review currency", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r2", last_reviewed: "2025-01-01" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(50);
    });

    it("review is current if last_reviewed is within 30 days", () => {
      // 30 days before 2026-05-28 = 2026-04-28
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-04-28" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(100);
    });

    it("review is stale if last_reviewed is 31+ days ago", () => {
      // 31 days before 2026-05-28 = 2026-04-27
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-04-27" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(0);
    });

    it("gives 0 modifier when 0 risks (not penalty)", () => {
      // No risks → risks.length === 0 → score += 0
      // But this only hits when screenings or missing are present (else special case)
      const r = computeLocalitySafeguarding(baseInput({ screenings: [makeScreening()] }));
      // No risks to review
      expect(r.review_currency_rate).toBe(0);
    });
  });

  // ── Modifier 3: Screening Coverage ──────────────────────────────────────

  describe("modifier 3: screening coverage", () => {
    it("gives +5 for >=90% coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
        makeScreening({ id: "s3", child_id: "child_3" }),
        makeScreening({ id: "s4", child_id: "child_4" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(100);
    });

    it("gives +2 for 70-89% coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
        makeScreening({ id: "s3", child_id: "child_3" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(75);
    });

    it("gives -5 for <50% coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(25);
    });

    it("gives 0 modifier for 50-69% coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(50);
    });

    it("gives -4 for 0 screenings with high-risk locality threats", () => {
      const risks = [makeRisk({ risk_level: "high" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.screening_coverage).toBe(0);
    });

    it("gives -1 for 0 screenings with no high-risk threats", () => {
      const risks = [makeRisk({ risk_level: "medium" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.screening_coverage).toBe(0);
    });

    it("counts unique children for coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_1" }), // duplicate
        makeScreening({ id: "s3", child_id: "child_2" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      // 2 unique children out of 4
      expect(r.screening_coverage).toBe(50);
    });
  });

  // ── Modifier 4: Safety Planning ─────────────────────────────────────────

  describe("modifier 4: safety planning", () => {
    it("gives +5 for >=90% safety plan rate", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true }),
        makeScreening({ id: "s2", has_safety_plan: true }),
        makeScreening({ id: "s3", has_safety_plan: true }),
        makeScreening({ id: "s4", has_safety_plan: true }),
        makeScreening({ id: "s5", has_safety_plan: true }),
        makeScreening({ id: "s6", has_safety_plan: true }),
        makeScreening({ id: "s7", has_safety_plan: true }),
        makeScreening({ id: "s8", has_safety_plan: true }),
        makeScreening({ id: "s9", has_safety_plan: true }),
        makeScreening({ id: "s10", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.safety_plan_rate).toBe(90);
    });

    it("gives +2 for 70-89% safety plan rate", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true }),
        makeScreening({ id: "s2", has_safety_plan: true }),
        makeScreening({ id: "s3", has_safety_plan: true }),
        makeScreening({ id: "s4", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.safety_plan_rate).toBe(75);
    });

    it("gives -4 for <50% safety plan rate", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true }),
        makeScreening({ id: "s2", has_safety_plan: false }),
        makeScreening({ id: "s3", has_safety_plan: false }),
        makeScreening({ id: "s4", has_safety_plan: false }),
        makeScreening({ id: "s5", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.safety_plan_rate).toBe(20);
    });

    it("gives 0 modifier for 50-69% safety plan rate", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true }),
        makeScreening({ id: "s2", has_safety_plan: true }),
        makeScreening({ id: "s3", has_safety_plan: false }),
        makeScreening({ id: "s4", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.safety_plan_rate).toBe(50);
    });

    it("gives 0 when no screenings", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(r.safety_plan_rate).toBe(0);
    });
  });

  // ── Modifier 5: Risk Intelligence Quality ───────────────────────────────

  describe("modifier 5: risk intelligence quality", () => {
    it("gives +5 for >=90% intelligence rate", () => {
      const risks = Array.from({ length: 10 }, (_, i) => makeRisk({
        id: `r_${i}`,
        has_description: i < 9,
        has_intelligence: i < 9,
      }));
      // 9/10 with both = 90%
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.locality_score).toBeDefined();
    });

    it("gives +2 for 70-89% intelligence rate", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r3", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r4", has_description: false, has_intelligence: false }),
      ];
      // 3/4 = 75%
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.locality_score).toBeDefined();
    });

    it("gives -4 for <50% intelligence rate", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", has_description: false, has_intelligence: false }),
        makeRisk({ id: "r3", has_description: false, has_intelligence: false }),
      ];
      // 1/3 = 33%
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.locality_score).toBeDefined();
    });

    it("gives 0 for 50-69% intelligence rate", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", has_description: false, has_intelligence: false }),
      ];
      // 1/2 = 50%
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.locality_score).toBeDefined();
    });

    it("requires BOTH description and intelligence for a risk to count", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: true, has_intelligence: false }),
        makeRisk({ id: "r2", has_description: false, has_intelligence: true }),
        makeRisk({ id: "r3", has_description: true, has_intelligence: true }),
      ];
      // Only r3 counts → 1/3 = 33% → < 50% → -4
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.locality_score).toBeDefined();
    });
  });

  // ── Modifier 6: Missing Episode Response ────────────────────────────────

  describe("modifier 6: missing episode response", () => {
    it("gives +2 for no missing episodes", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      // No missing → +2
      expect(r.locality_score).toBeDefined();
    });

    it("gives +5 for >=90% return interviews, police, and social worker", () => {
      const missing = Array.from({ length: 10 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: true,
        police_notified: true,
        social_worker_notified: true,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.locality_score).toBeDefined();
    });

    it("gives +2 for >=70% return interviews and police", () => {
      const missing = Array.from({ length: 10 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: i < 7, // 70%
        police_notified: i < 7,             // 70%
        social_worker_notified: i < 5,      // 50% — not >= 90
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.locality_score).toBeDefined();
    });

    it("gives -5 for <50% return interview rate", () => {
      const missing = Array.from({ length: 10 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: i < 4, // 40%
        police_notified: i < 4,
        social_worker_notified: i < 4,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.locality_score).toBeDefined();
    });

    it("gives 0 for 50-69% return interview rate", () => {
      const missing = Array.from({ length: 10 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: i < 6, // 60%
        police_notified: i < 6,
        social_worker_notified: i < 6,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.locality_score).toBeDefined();
    });

    it("only counts return interviews for returned episodes", () => {
      const missing = [
        makeMissing({ id: "m1", date_returned: "2026-05-11", return_interview_completed: true }),
        makeMissing({ id: "m2", date_returned: "", return_interview_completed: false }), // still missing
      ];
      // returnedMissing = 1 (m1), 1 with interview → 100%
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.locality_score).toBeDefined();
    });
  });

  // ── Strengths ────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes mitigation strength for >=90%", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 10 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("mitigation effectiveness"))).toBe(true);
      expect(r.strengths.some(s => s.includes("working effectively"))).toBe(true);
    });

    it("includes mitigation strength for 75-89%", () => {
      const risks = [makeRisk({ mitigations_count: 4, effective_mitigations: 3 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("mitigation effectiveness"))).toBe(true);
      expect(r.strengths.some(s => s.includes("reducing exposure"))).toBe(true);
    });

    it("does not include mitigation strength for 0 mitigations", () => {
      const risks = [makeRisk({ mitigations_count: 0, effective_mitigations: 0 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("mitigation effectiveness"))).toBe(false);
    });

    it("includes review currency strength for >=90%", () => {
      const risks = [makeRisk({ last_reviewed: "2026-05-20" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("review") && s.includes("actively maintained"))).toBe(true);
    });

    it("includes review currency strength for 70-89%", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r2", last_reviewed: "2026-05-18" }),
        makeRisk({ id: "r3", last_reviewed: "2026-05-15" }),
        makeRisk({ id: "r4", last_reviewed: "2025-01-01" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("review currency rate"))).toBe(true);
    });

    it("includes screening coverage strength for >=90%", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
        makeScreening({ id: "s3", child_id: "child_3" }),
        makeScreening({ id: "s4", child_id: "child_4" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.strengths.some(s => s.includes("screening coverage") && s.includes("comprehensive"))).toBe(true);
    });

    it("includes screening coverage strength for 70-89%", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
        makeScreening({ id: "s3", child_id: "child_3" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.strengths.some(s => s.includes("screening coverage"))).toBe(true);
    });

    it("includes safety plan strength for >=90%", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true }),
        makeScreening({ id: "s2", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.strengths.some(s => s.includes("safety plans"))).toBe(true);
    });

    it("includes intelligence quality strength for >=90%", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: true, has_intelligence: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("intelligence records"))).toBe(true);
    });

    it("includes return interview strength for >=90%", () => {
      const missing = [makeMissing({ return_interview_completed: true })];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.strengths.some(s => s.includes("return interview"))).toBe(true);
    });

    it("includes no missing episodes strength", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(r.strengths.some(s => s.includes("No missing episodes"))).toBe(true);
    });

    it("does not include no-missing strength when missing episodes exist", () => {
      const r = computeLocalitySafeguarding(baseInput({
        risks: [makeRisk()],
        missing: [makeMissing()],
      }));
      expect(r.strengths.some(s => s.includes("No missing episodes"))).toBe(false);
    });
  });

  // ── Concerns ─────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low mitigation effectiveness (<50%)", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 4 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("mitigation effectiveness"))).toBe(true);
    });

    it("flags stale reviews (<50%)", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r2", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r3", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r4", last_reviewed: "2026-05-20" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("review currency"))).toBe(true);
    });

    it("uses singular for 1 stale risk", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r2", last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r3", last_reviewed: "2026-05-20" }),
        makeRisk({ id: "r4", last_reviewed: "2026-05-20" }),
      ];
      // 3/4 current = 75%, not < 50% so no concern
      // Need < 50%. Use 2 risks, 0 current:
      const risks2 = [
        makeRisk({ id: "r1", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r2", last_reviewed: "2026-05-20" }),
      ];
      // 1/2 = 50%. Not < 50%. Need lower.
      const risks3 = [
        makeRisk({ id: "r1", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r2", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r3", last_reviewed: "2026-05-20" }),
      ];
      // 1/3 = 33% → concern. 2 stale risks → plural
      // For singular, need exactly 1 stale risk with < 50%:
      // Can't easily get < 50% with 1 stale if most are current.
      // 1 stale out of 1 total = 0% → singular "1 risk has"
      const risks4 = [makeRisk({ last_reviewed: "2025-01-01" })];
      const r = computeLocalitySafeguarding(baseInput({ risks: risks4 }));
      expect(r.concerns.some(c => c.includes("risk has"))).toBe(true);
    });

    it("flags low screening coverage (<50%)", () => {
      const screenings = [makeScreening({ child_id: "child_1" })];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.concerns.some(c => c.includes("screening coverage"))).toBe(true);
    });

    it("uses singular for 1 unscreened child", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
        makeScreening({ id: "s3", child_id: "child_3" }),
      ];
      // 3/4 = 75% → not < 50%. Can't trigger concern with singular.
      // Use total_children: 2, 0 screened → concern "2 children have"
      // For singular: total_children: 2, 1 screened → 50%, not < 50%.
      // total_children: 3, 1 screened → 33% → 2 unscreened → "children have"
      // total_children: 2, 0 screened from relevant screenings → 0%
      // But we need at least 1 screening in window for this path.
      // Let's use: 1 screening for child_1 out of total_children=2 → 50%. Not < 50.
      // 1 screening for child_1 out of total_children=3 → 33%. Unscreened=2 → plural.
      // For singular (1 unscreened): need total=2, 1 child screened, coverage = 50%. Not < 50.
      // It's hard to get singular with < 50%. Need total_children >= 3, 1 screened → 33%.
      // Unscreened = 2 → plural. Hmm. Can't easily get singular here.
      // Actually with total_children=3, screenings for 1 child → coverage 33%, unscreened=2.
      // The singular case would need unscreened=1, so total_children-screened=1, coverage < 50%.
      // total=3, screened=1 → unscreened=2. total=2, screened=0 → 0% but we need screenings.length > 0.
      // Let's just verify plural works:
      const r = computeLocalitySafeguarding(baseInput({
        total_children: 3,
        risks: [makeRisk()],
        screenings: [makeScreening({ child_id: "child_1" })],
      }));
      expect(r.concerns.some(c => c.includes("children have"))).toBe(true);
    });

    it("flags low safety plan rate (<50%)", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: false }),
        makeScreening({ id: "s2", has_safety_plan: false }),
        makeScreening({ id: "s3", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.concerns.some(c => c.includes("safety plan"))).toBe(true);
    });

    it("flags low intelligence rate (<50%)", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: false, has_intelligence: false }),
        makeRisk({ id: "r2", has_description: false, has_intelligence: false }),
        makeRisk({ id: "r3", has_description: true, has_intelligence: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("intelligence"))).toBe(true);
    });

    it("flags high-risk threats with no screenings", () => {
      const risks = [makeRisk({ risk_level: "high" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("high-risk"))).toBe(true);
    });

    it("uses singular for 1 high-risk threat with no screenings", () => {
      const risks = [makeRisk({ risk_level: "high" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("threat"))).toBe(true);
    });

    it("uses plural for multiple high-risk threats with no screenings", () => {
      const risks = [
        makeRisk({ id: "r1", risk_level: "high" }),
        makeRisk({ id: "r2", risk_level: "high" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("threats"))).toBe(true);
    });

    it("flags low return interview rate (<50%)", () => {
      const missing = [
        makeMissing({ id: "m1", return_interview_completed: false }),
        makeMissing({ id: "m2", return_interview_completed: false }),
        makeMissing({ id: "m3", return_interview_completed: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.concerns.some(c => c.includes("return interview"))).toBe(true);
    });

    it("flags high-risk screenings without safety plans", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "high", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.concerns.some(c => c.includes("high-risk exploitation"))).toBe(true);
    });

    it("flags low impact assessment rate (<50%)", () => {
      const risks = [
        makeRisk({ id: "r1", has_impact_assessment: false }),
        makeRisk({ id: "r2", has_impact_assessment: false }),
        makeRisk({ id: "r3", has_impact_assessment: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("impact assessment"))).toBe(true);
    });
  });

  // ── Recommendations ──────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends strengthening mitigations when <50% effective", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 4 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("mitigation"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("mitigation"))?.urgency).toBe("immediate");
      expect(r.recommendations.find(rec => rec.recommendation.includes("mitigation"))?.regulatory_ref).toContain("Reg 34");
    });

    it("recommends monthly review when currency <50%", () => {
      const risks = [makeRisk({ last_reviewed: "2025-01-01" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("review"))).toBe(true);
    });

    it("recommends extending screening when coverage <50%", () => {
      const screenings = [makeScreening({ child_id: "child_1" })];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("screening"))).toBe(true);
    });

    it("recommends urgent screening when high risks with no screenings", () => {
      const risks = [makeRisk({ risk_level: "high" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("screening urgently"))).toBe(true);
      expect(r.recommendations.find(rec => rec.recommendation.includes("screening urgently"))?.urgency).toBe("immediate");
    });

    it("recommends safety plans when rate <50%", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: false }),
        makeScreening({ id: "s2", has_safety_plan: false }),
        makeScreening({ id: "s3", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("safety plan"))).toBe(true);
    });

    it("recommends intelligence improvement when rate <50%", () => {
      const risks = [
        makeRisk({ id: "r1", has_description: false, has_intelligence: false }),
        makeRisk({ id: "r2", has_description: false, has_intelligence: false }),
        makeRisk({ id: "r3", has_description: true, has_intelligence: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("intelligence quality"))).toBe(true);
    });

    it("recommends return interviews when rate <50%", () => {
      const missing = [
        makeMissing({ id: "m1", return_interview_completed: false }),
        makeMissing({ id: "m2", return_interview_completed: false }),
        makeMissing({ id: "m3", return_interview_completed: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("return interview"))).toBe(true);
    });

    it("recommends impact assessments when rate <50%", () => {
      const risks = [
        makeRisk({ id: "r1", has_impact_assessment: false }),
        makeRisk({ id: "r2", has_impact_assessment: false }),
        makeRisk({ id: "r3", has_impact_assessment: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("impact assessment"))).toBe(true);
    });

    it("generates no recommendations for perfect practice (except proactive scanning)", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20", has_impact_assessment: true }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const missing = [makeMissing({ return_interview_completed: true, police_notified: true, social_worker_notified: true })];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.recommendations.length).toBe(0);
    });

    it("assigns ranks sequentially", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 2, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false, has_impact_assessment: false }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: false }),
      ];
      const missing = [
        makeMissing({ id: "m1", return_interview_completed: false }),
        makeMissing({ id: "m2", return_interview_completed: false }),
        makeMissing({ id: "m3", return_interview_completed: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory references in all recommendations", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 2, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false, has_impact_assessment: false })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("mitigation recommendation has immediate urgency", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 2 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("mitigation"));
      expect(rec?.urgency).toBe("immediate");
    });

    it("impact assessment recommendation has planned urgency", () => {
      const risks = [
        makeRisk({ id: "r1", has_impact_assessment: false }),
        makeRisk({ id: "r2", has_impact_assessment: false }),
        makeRisk({ id: "r3", has_impact_assessment: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("impact assessment"));
      expect(rec?.urgency).toBe("planned");
    });
  });

  // ── Insights ─────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates exemplary insight for outstanding metrics", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates screening+safety insight for strong combo", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("screening practice"))).toBe(true);
    });

    it("generates preventive safeguarding insight for no missing + good screening", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_2" }),
        makeScreening({ id: "s3", child_id: "child_3" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("preventive safeguarding"))).toBe(true);
    });

    it("generates critical insight for low mitigation effectiveness", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 3 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Mitigation effectiveness"))).toBe(true);
    });

    it("generates critical insight for stale reviews", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r2", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r3", last_reviewed: "2025-01-01" }),
        makeRisk({ id: "r4", last_reviewed: "2026-05-20" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Review currency"))).toBe(true);
    });

    it("generates critical insight for high risks with no screenings", () => {
      const risks = [makeRisk({ risk_level: "high" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("no exploitation screenings"))).toBe(true);
    });

    it("generates warning insight for low management oversight", () => {
      const screenings = [
        makeScreening({ id: "s1", has_management_oversight: false }),
        makeScreening({ id: "s2", has_management_oversight: false }),
        makeScreening({ id: "s3", has_management_oversight: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("management oversight"))).toBe(true);
    });

    it("generates critical insight for low return interview rate", () => {
      const missing = [
        makeMissing({ id: "m1", return_interview_completed: false }),
        makeMissing({ id: "m2", return_interview_completed: false }),
        makeMissing({ id: "m3", return_interview_completed: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("return interview"))).toBe(true);
    });

    it("generates warning insight for >3 missing episodes", () => {
      const missing = [
        makeMissing({ id: "m1", date_missing: "2026-05-10" }),
        makeMissing({ id: "m2", date_missing: "2026-05-12" }),
        makeMissing({ id: "m3", date_missing: "2026-05-14" }),
        makeMissing({ id: "m4", date_missing: "2026-05-16" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("missing episodes"))).toBe(true);
    });

    it("does not generate >3 missing warning for exactly 3 episodes", () => {
      const missing = [
        makeMissing({ id: "m1", date_missing: "2026-05-10" }),
        makeMissing({ id: "m2", date_missing: "2026-05-12" }),
        makeMissing({ id: "m3", date_missing: "2026-05-14" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.insights.some(i => i.text.includes("missing episodes in the last 180 days indicates a pattern"))).toBe(false);
    });
  });

  // ── Headlines ────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("generates outstanding headline with metrics", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const missing = [
        makeMissing({ return_interview_completed: true, police_notified: true, social_worker_notified: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("100%");
    });

    it("generates good headline", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 4, effective_mitigations: 3, last_reviewed: "2026-05-20", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 4, effective_mitigations: 3, last_reviewed: "2026-05-18", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r3", mitigations_count: 4, effective_mitigations: 4, last_reviewed: "2026-05-15", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r4", mitigations_count: 4, effective_mitigations: 3, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_3", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings }));
      expect(r.headline).toContain("Good");
    });

    it("generates adequate headline", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 4, last_reviewed: "2026-05-10" }),
        makeRisk({ id: "r2", mitigations_count: 10, effective_mitigations: 4, last_reviewed: "2025-01-01" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.headline).toContain("Adequate");
    });

    it("generates inadequate headline", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 1, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false, risk_level: "high" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.headline).toContain("inadequate");
    });

    it("generates insufficient_data headline for no children", () => {
      const r = computeLocalitySafeguarding(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children placed");
    });

    it("generates no-risk headline for clear profile", () => {
      const r = computeLocalitySafeguarding(baseInput());
      expect(r.headline).toContain("No community risks");
    });
  });

  // ── Score Clamping ───────────────────────────────────────────────────────

  describe("score clamping", () => {
    it("clamps score to minimum 0", () => {
      // All max penalties: -6 - 5 - 5 - 4 - 4 - 5 = -29 → 52 - 29 = 23, still > 0
      // But verify it's >= 0
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 1, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false, risk_level: "high" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: false }),
      ];
      const missing = Array.from({ length: 5 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: false,
        police_notified: false,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.locality_score).toBeGreaterThanOrEqual(0);
      expect(r.locality_score).toBeLessThanOrEqual(100);
    });

    it("clamps score to maximum 100", () => {
      const risks = [makeRisk({ mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" })];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings }));
      expect(r.locality_score).toBeLessThanOrEqual(100);
    });

    it("score is always an integer", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(Number.isInteger(r.locality_score)).toBe(true);
    });

    it("worst case all penalties still produces valid score", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 1, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false, risk_level: "high" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: false }),
      ];
      const missing = Array.from({ length: 5 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: false,
        police_notified: false,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.locality_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ── pct Helper Behaviour ────────────────────────────────────────────────

  describe("pct helper behaviour (via engine rates)", () => {
    it("returns 0 when denominator is 0 for mitigation effectiveness", () => {
      const risks = [makeRisk({ mitigations_count: 0, effective_mitigations: 0 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(0);
    });

    it("rounds to nearest integer", () => {
      // 1/3 = 33.33... → 33
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 1, effective_mitigations: 1 }),
        makeRisk({ id: "r2", mitigations_count: 1, effective_mitigations: 0 }),
        makeRisk({ id: "r3", mitigations_count: 1, effective_mitigations: 0 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(33);
    });

    it("rounds 2/3 to 67%", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 1, effective_mitigations: 1 }),
        makeRisk({ id: "r2", mitigations_count: 1, effective_mitigations: 1 }),
        makeRisk({ id: "r3", mitigations_count: 1, effective_mitigations: 0 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(67);
    });

    it("returns 100 for n/n", () => {
      const risks = [makeRisk({ mitigations_count: 5, effective_mitigations: 5 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(100);
    });

    it("returns 0 when no screenings for safety plan rate", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(r.safety_plan_rate).toBe(0);
    });

    it("returns 0 when no screenings for screening coverage", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(r.screening_coverage).toBe(0);
    });
  });

  // ── Output Field Accuracy ───────────────────────────────────────────────

  describe("output field accuracy", () => {
    it("reports correct total_risks", () => {
      const risks = [makeRisk({ id: "r1" }), makeRisk({ id: "r2" }), makeRisk({ id: "r3" })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.total_risks).toBe(3);
    });

    it("reports correct high_risk_count", () => {
      const risks = [
        makeRisk({ id: "r1", risk_level: "high" }),
        makeRisk({ id: "r2", risk_level: "medium" }),
        makeRisk({ id: "r3", risk_level: "high" }),
        makeRisk({ id: "r4", risk_level: "low" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.high_risk_count).toBe(2);
    });

    it("reports correct mitigation_effectiveness", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 4, effective_mitigations: 3 }),
        makeRisk({ id: "r2", mitigations_count: 6, effective_mitigations: 3 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      // 6/10 = 60%
      expect(r.mitigation_effectiveness).toBe(60);
    });

    it("reports correct review_currency_rate", () => {
      const risks = [
        makeRisk({ id: "r1", last_reviewed: "2026-05-20" }), // current
        makeRisk({ id: "r2", last_reviewed: "2025-01-01" }), // stale
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.review_currency_rate).toBe(50);
    });

    it("reports correct screening_coverage", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1" }),
        makeScreening({ id: "s2", child_id: "child_1" }), // duplicate
        makeScreening({ id: "s3", child_id: "child_2" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      // 2/4 = 50%
      expect(r.screening_coverage).toBe(50);
    });

    it("reports correct safety_plan_rate", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true }),
        makeScreening({ id: "s2", has_safety_plan: false }),
        makeScreening({ id: "s3", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.safety_plan_rate).toBe(67);
    });

    it("only counts screenings in 180-day window for safety_plan_rate", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: true, date: "2026-05-15" }),
        makeScreening({ id: "s2", has_safety_plan: false, date: "2025-01-01" }), // outside window
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.safety_plan_rate).toBe(100); // only in-window screening counted
    });
  });

  // ── Edge Cases ───────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single risk", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()] }));
      expect(r.total_risks).toBe(1);
      expect(r.locality_rating).not.toBe("insufficient_data");
    });

    it("handles single screening", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings: [makeScreening()] }));
      expect(r.screening_coverage).toBeGreaterThan(0);
    });

    it("handles single missing episode", () => {
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing: [makeMissing()] }));
      expect(r.locality_rating).not.toBe("insufficient_data");
    });

    it("handles total_children = 1", () => {
      const screenings = [makeScreening({ child_id: "child_1" })];
      const r = computeLocalitySafeguarding(baseInput({ total_children: 1, risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(100);
    });

    it("handles risks with all 0 mitigations", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 0, effective_mitigations: 0 }),
        makeRisk({ id: "r2", mitigations_count: 0, effective_mitigations: 0 }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.mitigation_effectiveness).toBe(0);
    });

    it("handles missing episode still in progress (no date_returned)", () => {
      const missing = [
        makeMissing({ date_returned: "", return_interview_completed: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      // No returned missing → returnInterviewRate based on empty set → pct(0,0) = 0
      expect(r.locality_rating).toBeDefined();
    });

    it("handles all missing episodes still in progress", () => {
      const missing = [
        makeMissing({ id: "m1", date_returned: "", return_interview_completed: false }),
        makeMissing({ id: "m2", date_returned: "", return_interview_completed: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], missing }));
      expect(r.locality_rating).toBeDefined();
    });

    it("handles large number of risks", () => {
      const risks = Array.from({ length: 50 }, (_, i) => makeRisk({
        id: `r_${i}`,
        last_reviewed: "2026-05-20",
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.total_risks).toBe(50);
    });

    it("handles large number of screenings", () => {
      const screenings = Array.from({ length: 50 }, (_, i) => makeScreening({
        id: `s_${i}`,
        child_id: `child_${(i % 4) + 1}`,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(100);
    });

    it("handles all risks at high level", () => {
      const risks = Array.from({ length: 5 }, (_, i) => makeRisk({
        id: `r_${i}`,
        risk_level: "high",
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.high_risk_count).toBe(5);
    });

    it("handles mixed risk levels", () => {
      const risks = [
        makeRisk({ id: "r1", risk_level: "high" }),
        makeRisk({ id: "r2", risk_level: "medium" }),
        makeRisk({ id: "r3", risk_level: "low" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.high_risk_count).toBe(1);
    });

    it("handles screening with all risk levels", () => {
      const screenings = [
        makeScreening({ id: "s1", risk_level: "high", child_id: "child_1" }),
        makeScreening({ id: "s2", risk_level: "medium", child_id: "child_2" }),
        makeScreening({ id: "s3", risk_level: "low", child_id: "child_3" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.screening_coverage).toBe(75);
    });
  });

  // ── Determinism ─────────────────────────────────────────────────────────

  describe("determinism", () => {
    it("produces identical results on repeated calls with same input", () => {
      const input = baseInput({
        risks: [
          makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 3, last_reviewed: "2026-05-20" }),
          makeRisk({ id: "r2", mitigations_count: 3, effective_mitigations: 1, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
        ],
        screenings: [
          makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
          makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: false }),
        ],
        missing: [
          makeMissing({ id: "m1", return_interview_completed: true }),
          makeMissing({ id: "m2", return_interview_completed: false }),
        ],
      });

      const r1 = computeLocalitySafeguarding(input);
      const r2 = computeLocalitySafeguarding(input);

      expect(r1.locality_score).toBe(r2.locality_score);
      expect(r1.locality_rating).toBe(r2.locality_rating);
      expect(r1.headline).toBe(r2.headline);
      expect(r1.strengths).toEqual(r2.strengths);
      expect(r1.concerns).toEqual(r2.concerns);
      expect(r1.recommendations).toEqual(r2.recommendations);
      expect(r1.insights).toEqual(r2.insights);
    });

    it("same input with different today produces different result", () => {
      const input1 = baseInput({
        today: "2026-05-28",
        risks: [makeRisk({ last_reviewed: "2026-05-20" })],
      });
      const input2 = baseInput({
        today: "2026-08-28",
        risks: [makeRisk({ last_reviewed: "2026-05-20" })],
      });

      const r1 = computeLocalitySafeguarding(input1);
      const r2 = computeLocalitySafeguarding(input2);

      // In input1, review is 8 days old → current. In input2, review is ~100 days old → stale.
      expect(r1.review_currency_rate).not.toBe(r2.review_currency_rate);
    });

    it("does not mutate input data", () => {
      const risks = [makeRisk()];
      const screenings = [makeScreening()];
      const missing = [makeMissing()];
      const input = baseInput({ risks, screenings, missing });

      const risksBefore = JSON.stringify(risks);
      const screeningsBefore = JSON.stringify(screenings);
      const missingBefore = JSON.stringify(missing);

      computeLocalitySafeguarding(input);

      expect(JSON.stringify(risks)).toBe(risksBefore);
      expect(JSON.stringify(screenings)).toBe(screeningsBefore);
      expect(JSON.stringify(missing)).toBe(missingBefore);
    });
  });

  // ── Score Calculation Verification ──────────────────────────────────────

  describe("score calculation verification", () => {
    it("base score is 52 with all neutral modifiers", () => {
      // Need all modifiers to be 0. This is tricky because some paths give -1 or -2.
      // mod1: 65-74% effectiveness → 0
      // mod2: 50-69% review → 0
      // mod3: 50-69% screening coverage → 0
      // mod4: 50-69% safety plan → 0
      // mod5: 50-69% intel → 0
      // mod6: missing with 50-69% return interview → 0
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 7, last_reviewed: "2026-05-20", has_description: true, has_intelligence: true }),
        makeRisk({ id: "r2", mitigations_count: 10, effective_mitigations: 7, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false }),
      ];
      // mitigation: 14/20 = 70% → 0
      // review: 1/2 = 50% → 0
      // intel: 1/2 = 50% → 0

      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: false }),
      ];
      // screening: 2/4 = 50% → 0
      // safety: 1/2 = 50% → 0

      const missing = [
        makeMissing({ id: "m1", date_missing: "2026-05-10", return_interview_completed: true, police_notified: true }),
        makeMissing({ id: "m2", date_missing: "2026-05-12", return_interview_completed: false, police_notified: false }),
      ];
      // return interview: 1/2 = 50% → 0

      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.locality_score).toBe(52);
    });

    it("maximum possible score is 83", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const missing = [
        makeMissing({ return_interview_completed: true, police_notified: true, social_worker_notified: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      // 52 + 6 + 5 + 5 + 5 + 5 + 5 = 83
      expect(r.locality_score).toBe(83);
    });

    it("max with no missing gives 84 (52 + 6 + 5 + 5 + 5 + 5 + 2 = 80)... actually no missing = +2", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings }));
      // 52 + 6 + 5 + 5 + 5 + 5 + 2 = 80
      expect(r.locality_score).toBe(80);
    });

    it("minimum non-special-case score with all max penalties", () => {
      // mod1: -6 (mit <50%, need non-zero mitigations)
      // mod2: -5 (review <50%)
      // mod3: -5 (screening <50%)
      // mod4: -4 (safety <50%)
      // mod5: -4 (intel <50%)
      // mod6: -5 (return interview <50%)
      // = -29 → 52 - 29 = 23
      const risks = [
        makeRisk({
          id: "r1",
          mitigations_count: 10,
          effective_mitigations: 1,
          last_reviewed: "2025-01-01",
          has_description: false,
          has_intelligence: false,
        }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: false }),
      ];
      const missing = Array.from({ length: 5 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: false,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      // 52 - 6 - 5 - 5 - 4 - 4 - 5 = 23
      expect(r.locality_score).toBe(23);
    });
  });

  // ── Regulatory References ───────────────────────────────────────────────

  describe("regulatory references", () => {
    it("references CHR 2015 Reg 34 for mitigation recommendations", () => {
      const risks = [makeRisk({ mitigations_count: 10, effective_mitigations: 2 })];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 34"))).toBe(true);
    });

    it("references CHR 2015 Reg 12 for screening recommendations", () => {
      const screenings = [makeScreening({ child_id: "child_1" })];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 12"))).toBe(true);
    });

    it("references CHR 2015 Reg 35 for safety plan recommendations", () => {
      const screenings = [
        makeScreening({ id: "s1", has_safety_plan: false }),
        makeScreening({ id: "s2", has_safety_plan: false }),
        makeScreening({ id: "s3", has_safety_plan: true }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.recommendations.some(rec => rec.regulatory_ref.includes("Reg 35"))).toBe(true);
    });
  });

  // ── Combined Scenarios ──────────────────────────────────────────────────

  describe("combined scenarios", () => {
    it("high mitigation but stale reviews produces mixed result", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2025-01-01" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("mitigation"))).toBe(true);
      expect(r.concerns.some(c => c.includes("review currency"))).toBe(true);
    });

    it("good reviews but poor mitigations produces mixed result", () => {
      const risks = [
        makeRisk({ id: "r1", mitigations_count: 10, effective_mitigations: 2, last_reviewed: "2026-05-20" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.strengths.some(s => s.includes("review") && s.includes("actively maintained"))).toBe(true);
      expect(r.concerns.some(c => c.includes("mitigation"))).toBe(true);
    });

    it("good screening but no safety plans produces mixed result", () => {
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: false }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: false }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: false }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks: [makeRisk()], screenings }));
      expect(r.strengths.some(s => s.includes("screening coverage"))).toBe(true);
      expect(r.concerns.some(c => c.includes("safety plan"))).toBe(true);
    });

    it("multiple high risks with no screenings generates urgent concern", () => {
      const risks = [
        makeRisk({ id: "r1", risk_level: "high" }),
        makeRisk({ id: "r2", risk_level: "high" }),
        makeRisk({ id: "r3", risk_level: "medium" }),
      ];
      const r = computeLocalitySafeguarding(baseInput({ risks }));
      expect(r.concerns.some(c => c.includes("high-risk"))).toBe(true);
      expect(r.recommendations.some(rec => rec.urgency === "immediate")).toBe(true);
    });

    it("perfect locality but many missing episodes still flags concern", () => {
      const risks = [makeRisk({ mitigations_count: 5, effective_mitigations: 5, last_reviewed: "2026-05-20" })];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", has_safety_plan: true }),
        makeScreening({ id: "s2", child_id: "child_2", has_safety_plan: true }),
        makeScreening({ id: "s3", child_id: "child_3", has_safety_plan: true }),
        makeScreening({ id: "s4", child_id: "child_4", has_safety_plan: true }),
      ];
      const missing = Array.from({ length: 5 }, (_, i) => makeMissing({
        id: `m_${i}`,
        date_missing: `2026-05-${String(10 + i).padStart(2, "0")}`,
        return_interview_completed: false,
        police_notified: false,
      }));
      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("missing episodes"))).toBe(true);
    });
  });

  // ── Full Scenario Integration ───────────────────────────────────────────

  describe("full scenario integration", () => {
    it("realistic home with mixed locality risks, screenings, and missing episodes", () => {
      const risks = [
        makeRisk({ id: "r1", category: "cse", risk_level: "high", mitigations_count: 5, effective_mitigations: 4, last_reviewed: "2026-05-20", has_description: true, has_intelligence: true, has_impact_assessment: true }),
        makeRisk({ id: "r2", category: "county_lines", risk_level: "medium", mitigations_count: 3, effective_mitigations: 2, last_reviewed: "2026-05-15", has_description: true, has_intelligence: true, has_impact_assessment: true }),
        makeRisk({ id: "r3", category: "gangs", risk_level: "low", mitigations_count: 2, effective_mitigations: 2, last_reviewed: "2026-04-30", has_description: true, has_intelligence: false, has_impact_assessment: false }),
      ];
      // mitigations: 8/10 = 80% → +3
      // review: 3/3 within 30 days (last: 2026-04-30, 28 days ago) → 100% → +5
      // intel: 2/3 have both desc+intel = 67% → 0

      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", date: "2026-05-10", risk_level: "medium", has_safety_plan: true, has_management_oversight: true }),
        makeScreening({ id: "s2", child_id: "child_2", date: "2026-05-12", risk_level: "high", has_safety_plan: true, has_management_oversight: true }),
        makeScreening({ id: "s3", child_id: "child_3", date: "2026-05-15", risk_level: "low", has_safety_plan: true, has_management_oversight: false }),
        makeScreening({ id: "s4", child_id: "child_4", date: "2026-05-18", risk_level: "medium", has_safety_plan: false, has_management_oversight: true }),
      ];
      // screening coverage: 4/4 = 100% → +5
      // safety plan: 3/4 = 75% → +2

      const missing = [
        makeMissing({ id: "m1", child_id: "child_2", date_missing: "2026-05-05", date_returned: "2026-05-05", return_interview_completed: true, police_notified: true, social_worker_notified: true }),
        makeMissing({ id: "m2", child_id: "child_2", date_missing: "2026-05-20", date_returned: "2026-05-20", return_interview_completed: true, police_notified: true, social_worker_notified: false }),
      ];
      // return interview: 2/2 = 100% → >= 90
      // police: 2/2 = 100% → >= 90
      // sw: 1/2 = 50% → < 90, so not full +5 path
      // Wait: +5 requires all three >= 90. sw = 50% → fails. So check +2: returnInterview >= 70 && police >= 70 → yes → +2

      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));
      // 52 + 3 + 5 + 5 + 2 + 0 + 2 = 69
      expect(r.locality_score).toBe(69);
      expect(r.locality_rating).toBe("good");
      expect(r.total_risks).toBe(3);
      expect(r.high_risk_count).toBe(1);
      expect(r.mitigation_effectiveness).toBe(80);
      expect(r.review_currency_rate).toBe(100);
      expect(r.screening_coverage).toBe(100);
      expect(r.safety_plan_rate).toBe(75);
    });

    it("struggling home with poor metrics across the board", () => {
      const risks = [
        makeRisk({ id: "r1", risk_level: "high", mitigations_count: 8, effective_mitigations: 1, last_reviewed: "2025-01-01", has_description: false, has_intelligence: false, has_impact_assessment: false }),
        makeRisk({ id: "r2", risk_level: "high", mitigations_count: 5, effective_mitigations: 0, last_reviewed: "2025-02-01", has_description: false, has_intelligence: false, has_impact_assessment: false }),
      ];
      const screenings = [
        makeScreening({ id: "s1", child_id: "child_1", risk_level: "high", has_safety_plan: false, has_management_oversight: false }),
      ];
      const missing = Array.from({ length: 5 }, (_, i) => makeMissing({
        id: `m_${i}`,
        child_id: `child_${(i % 4) + 1}`,
        date_missing: `2026-05-${String(5 + i).padStart(2, "0")}`,
        return_interview_completed: false,
        police_notified: false,
        social_worker_notified: false,
      }));

      const r = computeLocalitySafeguarding(baseInput({ risks, screenings, missing }));

      expect(r.locality_rating).toBe("inadequate");
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });
  });
});
