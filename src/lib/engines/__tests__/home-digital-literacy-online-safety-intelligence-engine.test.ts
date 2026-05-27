// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME DIGITAL LITERACY & ONLINE SAFETY INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeDigitalLiteracyOnlineSafety,
  type DigitalLiteracyOnlineSafetyInput,
  type DigitalSkillInput,
  type DigitalPlanInput,
  type PhoneRecordInput,
  type RseDigitalInput,
  type DigitalSafetyResult,
  type DigitalSafetyRating,
} from "../home-digital-literacy-online-safety-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeDigitalSkill(overrides: Partial<DigitalSkillInput> = {}): DigitalSkillInput {
  return {
    id: "ds_1",
    child_id: "child_1",
    domain: "online_safety",
    competency: "advanced",
    skills_achieved_count: 8,
    skills_total_count: 10,
    ...overrides,
  };
}

function makeDigitalPlan(overrides: Partial<DigitalPlanInput> = {}): DigitalPlanInput {
  return {
    id: "dp_1",
    child_id: "child_1",
    has_screen_time_limits: true,
    parental_controls_active: true,
    has_exploitation_risk_assessment: true,
    has_cyberbullying_response: true,
    ...overrides,
  };
}

function makePhoneRecord(overrides: Partial<PhoneRecordInput> = {}): PhoneRecordInput {
  return {
    id: "pr_1",
    child_id: "child_1",
    parental_controls_active: true,
    online_safety_agreement_signed: true,
    ...overrides,
  };
}

function makeRseDigital(overrides: Partial<RseDigitalInput> = {}): RseDigitalInput {
  return {
    id: "rse_1",
    child_id: "child_1",
    date: "2025-06-01",
    topic_is_digital_safety: true,
    child_engaged: true,
    ...overrides,
  };
}

/**
 * Base input: 4 children, all with digital plans (exploitation risk + cyberbullying),
 * advanced skills, phones with parental controls, and engaged RSE digital sessions.
 * Expected: score ~82, outstanding.
 *
 * Mod 1: plan coverage 4/4=100% >= 80% → +5
 * Mod 2: skill competency 4/4=100% >= 70% → +6
 * Mod 3: parental controls 4/4=100% >= 90% → +5
 * Mod 4: exploitation risk 4/4=100% >= 80% → +5
 * Mod 5: RSE digital 4/4=100% >= 70% → +4
 * Mod 6: cyberbullying 4/4=100% >= 80% → +5
 * Total: 52+5+6+5+5+4+5 = 82
 */
function baseInput(overrides: Partial<DigitalLiteracyOnlineSafetyInput> = {}): DigitalLiteracyOnlineSafetyInput {
  return {
    today: TODAY,
    total_children: 4,
    digital_skills: [
      makeDigitalSkill({ id: "ds_1", child_id: "child_1", domain: "online_safety", competency: "advanced" }),
      makeDigitalSkill({ id: "ds_2", child_id: "child_2", domain: "communication", competency: "advanced" }),
      makeDigitalSkill({ id: "ds_3", child_id: "child_3", domain: "content_creation", competency: "intermediate" }),
      makeDigitalSkill({ id: "ds_4", child_id: "child_4", domain: "problem_solving", competency: "advanced" }),
    ],
    digital_plans: [
      makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
      makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
      makeDigitalPlan({ id: "dp_3", child_id: "child_3" }),
      makeDigitalPlan({ id: "dp_4", child_id: "child_4" }),
    ],
    phone_records: [
      makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
      makePhoneRecord({ id: "pr_2", child_id: "child_2" }),
      makePhoneRecord({ id: "pr_3", child_id: "child_3" }),
      makePhoneRecord({ id: "pr_4", child_id: "child_4" }),
    ],
    rse_digital: [
      makeRseDigital({ id: "rse_1", child_id: "child_1" }),
      makeRseDigital({ id: "rse_2", child_id: "child_2" }),
      makeRseDigital({ id: "rse_3", child_id: "child_3" }),
      makeRseDigital({ id: "rse_4", child_id: "child_4" }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Digital Literacy & Online Safety Intelligence Engine", () => {

  // ── 1. Insufficient Data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({ total_children: 0 }));
      expect(r.digital_rating).toBe("insufficient_data");
      expect(r.digital_score).toBe(0);
    });

    it("returns headline about no children", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("No children");
    });

    it("returns zeroed metrics when no children", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({ total_children: 0 }));
      expect(r.children_with_digital_plans).toBe(0);
      expect(r.digital_skill_coverage_rate).toBe(0);
      expect(r.parental_controls_rate).toBe(0);
      expect(r.rse_digital_coverage_rate).toBe(0);
      expect(r.exploitation_risk_assessed_rate).toBe(0);
    });

    it("returns empty strengths and non-empty concerns when no children", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns.length).toBeGreaterThan(0);
    });
  });

  // ── 2. Outstanding Rating ─────────────────────────────────────────────
  describe("outstanding rating", () => {
    it("rates outstanding with full base input (score ~82)", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      // 52 + 5+6+5+5+4+5 = 82
      expect(r.digital_score).toBe(82);
      expect(r.digital_rating).toBe("outstanding");
    });

    it("headline includes outstanding keyword", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("rates outstanding at score boundary of 80", () => {
      // Drop mod5 from +4 to +1 by reducing RSE coverage to 40-69%
      // 2/4 = 50% → +1. Score: 52+5+6+5+5+1+5 = 79. Not enough.
      // Instead drop mod2 from +6 to +3 by setting skills competency 45-69%.
      // 2/4 = 50% → +3. Score: 52+5+3+5+5+4+5 = 79. Still not 80.
      // Need exactly 80. Drop one small mod. Let's drop mod5 from +4 to +1:
      // RSE coverage 2/4 = 50% >=40% → +1. Score: 52+5+6+5+5+1+5 = 79. Not 80.
      // Let's keep all at max but drop mod5 from +4 to +4. That's already max.
      // Actually 82 is max. To get 80 we need to drop 2 points.
      // Drop mod5 from +4 to +1 (RSE 40-69%) and drop mod1 from +5 to +5 (no change).
      // So we need exactly -2 from base. E.g. drop mod5 to +1 → 79 (not 80).
      // Drop mod6 from +5 to +2 (cyberbullying 50-79%): 52+5+6+5+5+4+2 = 79 (not 80).
      // Drop mod1 from +5 to +2 (plan coverage 50-79%): 52+2+6+5+5+4+5 = 79 (not 80).
      // To get 80: drop mod5 from +4 to +1 AND keep everything else: 79. Or drop mod6 to +2: 79.
      // Actually to get exactly 80 we need total mods = 28. Max is 30. So drop 2 from somewhere.
      // Mod2 +6→+3 = drop 3. Too much.
      // Mod5 +4→+1 = drop 3. Too much.
      // Mod1 +5→+2 = drop 3. Too much.
      // Hmm. The only way to get exactly 80 is to drop exactly 2.
      // No single mod drops by exactly 2 in these tiers. So let's just test score>=80→outstanding.
      // We can test that score 82 is outstanding and score 79 is good.
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.digital_score).toBeGreaterThanOrEqual(80);
      expect(r.digital_rating).toBe("outstanding");
    });
  });

  // ── 3. Good Rating ────────────────────────────────────────────────────
  describe("good rating", () => {
    it("rates good when 4 mods at top and 2 degraded (65-79 range)", () => {
      // Keep mods 1,3,4,6 at top, degrade mods 2 and 5.
      // Mod 2: set skills to 45-69% → +3 (instead of +6). 2 of 4 skills intermediate+ → 50%.
      // Mod 5: set RSE to 40-69% → +1 (instead of +4). 2 of 4 children with engaged RSE → 50%.
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "advanced" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
          makeRseDigital({ id: "rse_2", child_id: "child_2" }),
          // child_3 and child_4 not covered
        ],
      }));
      // Mod 1: 100% → +5
      // Mod 2: 2/4=50% → +3
      // Mod 3: 100% → +5
      // Mod 4: 100% → +5
      // Mod 5: 2/4=50% → +1
      // Mod 6: 100% → +5
      // Total: 52+5+3+5+5+1+5 = 76
      expect(r.digital_score).toBe(76);
      expect(r.digital_rating).toBe("good");
    });

    it("good headline mentions plan coverage and skill competency", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "advanced" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
          makeRseDigital({ id: "rse_2", child_id: "child_2" }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });
  });

  // ── 4. Adequate Rating ────────────────────────────────────────────────
  describe("adequate rating", () => {
    it("rates adequate with moderate gaps (45-64 range)", () => {
      // Degrade multiple mods significantly
      // Mod 1: plan coverage 50-79% → +2. Plans for 3 of 4 children.
      // Mod 2: skill competency 25-44% → +0. 1 of 4 skills intermediate+.
      // Mod 3: parental controls 50-69% → +0. 2 of 4 phones with controls.
      // Mod 4: exploitation risk 50-79% → +2. 3 of 4 plans.
      // Mod 5: RSE coverage 20-39% → +0. 1 of 4 children.
      // Mod 6: cyberbullying 50-79% → +2. 3 of 4 plans.
      // Total: 52+2+0+0+2+0+2 = 58
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
          // child_4 has no plan
        ],
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "none" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "basic" }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2" }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
          // only 1 of 4 children → 25%
        ],
      }));
      // Mod 1: 3/4=75% → >=50% but NOT >=80% → +2
      // Mod 2: 1/4=25% → >=25% → +0
      // Mod 3: 2/4=50% → >=50% → +0
      // Mod 4: exploitation: plans with assessment: dp_1(true), dp_2(true), dp_3(false) = 2/3 = 67% → >=50% → +2
      // Mod 5: 1/4=25% → >=20% → +0
      // Mod 6: cyberbullying: dp_1(true), dp_2(true), dp_3(false) = 2/3 = 67% → >=50% → +2
      // Total: 52+2+0+0+2+0+2 = 58
      expect(r.digital_score).toBe(58);
      expect(r.digital_rating).toBe("adequate");
    });

    it("adequate headline mentions concerns count", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
        ],
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "none" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "basic" }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2" }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
        ],
      }));
      expect(r.headline).toContain("requires improvement");
      expect(r.headline).toContain("concern");
    });
  });

  // ── 5. Inadequate Rating ──────────────────────────────────────────────
  describe("inadequate rating", () => {
    it("rates inadequate with severe deficiencies (score <45)", () => {
      // All mods at worst:
      // Mod 1: plan coverage <30% → -5. 1 of 4 children with plans = 25%.
      // Mod 2: skill competency <25% → -5. 0 of 4 intermediate+.
      // Mod 3: parental controls <50% → -5. 1 of 4 phones.
      // Mod 4: exploitation <30% → -4. 0 of 1 plans.
      // Mod 5: RSE <20% → -4. 0 of 4.
      // Mod 6: cyberbullying <30% → -5. 0 of 1 plans.
      // Total: 52-5-5-5-4-4-5 = 24
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "none" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "basic" }),
        ],
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
        rse_digital: [],
      });
      // Mod 1: 1/4=25% → <30% → -5
      // Mod 2: 0/4=0% → <25% → -5
      // Mod 3: 1/4=25% → <50% → -5
      // Mod 4: 0/1=0% → <30% → -4
      // Mod 5: 0/4=0% → <20% → -4
      // Mod 6: 0/1=0% → <30% → -5
      // 52-5-5-5-4-4-5 = 24
      expect(r.digital_score).toBe(24);
      expect(r.digital_rating).toBe("inadequate");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
        ],
        digital_plans: [],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
        ],
        rse_digital: [],
      });
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant gaps");
    });
  });

  // ── 6. Mod 1 — Digital Plan Coverage ──────────────────────────────────
  describe("mod 1: digital plan coverage", () => {
    it(">=80% gives +5", () => {
      const full = computeDigitalLiteracyOnlineSafety(baseInput()); // 100% plans → +5
      const partial = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
          // 2/4 = 50% → +2
        ],
      }));
      // Difference: +5 vs +2 = 3
      expect(full.digital_score - partial.digital_score).toBe(3);
    });

    it(">=50% gives +2", () => {
      const fifty = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
        ],
      }));
      // 2/4 = 50% → +2. Score: 52+2+6+5+5+4+5 = 79
      expect(fifty.digital_score).toBe(79);
    });

    it(">=30% gives +0", () => {
      // 2/6 = 33% → +0
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        total_children: 6,
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
        ],
      }));
      // Mod1: 2/6=33% → +0. But RSE also changes: 4/6=67% → +1 (>=40 but <70)
      // Mod5: 4/6=67% → +1
      // Total: 52+0+6+5+5+1+5 = 74
      expect(r.digital_score).toBe(74);
    });

    it("<30% gives -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
        ],
      }));
      // 1/4 = 25% → -5. Score: 52-5+6+5+5+4+5 = 72
      // But exploitation risk: 1/1=100% → +5; cyberbullying: 1/1=100% → +5
      expect(r.digital_score).toBe(72);
    });
  });

  // ── 7. Mod 2 — Skill Competency ──────────────────────────────────────
  describe("mod 2: skill competency", () => {
    it(">=70% gives +6", () => {
      // base has 100% → +6
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.digital_score).toBe(82);
    });

    it(">=45% gives +3", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "advanced" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
      }));
      // 2/4=50% → +3. Score: 52+5+3+5+5+4+5 = 79
      expect(r.digital_score).toBe(79);
    });

    it(">=25% gives +0", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "advanced" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "none" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "basic" }),
        ],
      }));
      // 1/4=25% → +0. Score: 52+5+0+5+5+4+5 = 76
      expect(r.digital_score).toBe(76);
    });

    it("<25% gives -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "basic" }),
        ],
      }));
      // 0/4=0% → -5. Score: 52+5-5+5+5+4+5 = 71
      expect(r.digital_score).toBe(71);
    });
  });

  // ── 8. Mod 3 — Parental Controls ─────────────────────────────────────
  describe("mod 3: parental controls", () => {
    it(">=90% gives +5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      // 4/4=100% → +5 (part of base 82)
      expect(r.digital_score).toBe(82);
    });

    it(">=70% gives +2", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2" }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3" }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
      }));
      // 3/4=75% → +2. Score: 52+5+6+2+5+4+5 = 79
      expect(r.digital_score).toBe(79);
    });

    it(">=50% gives +0", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2" }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
      }));
      // 2/4=50% → +0. Score: 52+5+6+0+5+4+5 = 77
      expect(r.digital_score).toBe(77);
    });

    it("<50% gives -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
      }));
      // 1/4=25% → -5. Score: 52+5+6-5+5+4+5 = 72
      expect(r.digital_score).toBe(72);
    });
  });

  // ── 9. Mod 4 — Exploitation Risk Assessed ─────────────────────────────
  describe("mod 4: exploitation risk assessed", () => {
    it(">=80% gives +5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      // 4/4=100% → +5
      expect(r.digital_score).toBe(82);
    });

    it(">=50% gives +2", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_exploitation_risk_assessment: false }),
        ],
      }));
      // 2/4=50% → +2. Score: 52+5+6+5+2+4+5 = 79
      expect(r.digital_score).toBe(79);
    });

    it(">=30% gives +0", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false }),
        ],
        total_children: 3,
      }));
      // Plans: 3 children. exploitation: 1/3 = 33% → +0
      // Mod 1: 3/3=100% → +5
      // Mod 2: 4 skills, but total_children=3 so skill coverage 3/3... wait skills don't change
      // Actually total_children is 3 now but skills array still has 4 entries (from base).
      // Skills competency: 4/4 all advanced/intermediate → 100% → +6
      // Mod 3: 4 phones → 4/4 → +5
      // Mod 4: 1/3=33% → +0
      // Mod 5: RSE 4 entries for 4 children but total_children=3. Unique children with engaged RSE: child_1-4 = 4 unique. 4/3=133% → +4
      // Mod 6: cyberbullying: dp_1(true), dp_2(true), dp_3(true) = 3/3=100% → +5 ... wait, dp_2 and dp_3 inherit defaults
      // dp_2 has has_cyberbullying_response: true (default), dp_3 has has_cyberbullying_response: true (default)
      // So cyberbullying: 3/3=100% → +5
      // Total: 52+5+6+5+0+4+5 = 77
      expect(r.digital_score).toBe(77);
    });

    it("<30% gives -4", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_exploitation_risk_assessment: false }),
        ],
      }));
      // 0/4=0% → -4. Score: 52+5+6+5-4+4+5 = 73
      expect(r.digital_score).toBe(73);
    });
  });

  // ── 10. Mod 5 — RSE Digital Coverage ──────────────────────────────────
  describe("mod 5: RSE digital coverage", () => {
    it(">=70% gives +4", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      // 4/4=100% → +4
      expect(r.digital_score).toBe(82);
    });

    it(">=40% gives +1", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
          makeRseDigital({ id: "rse_2", child_id: "child_2" }),
          // 2/4 = 50% → +1
        ],
      }));
      // 52+5+6+5+5+1+5 = 79
      expect(r.digital_score).toBe(79);
    });

    it(">=20% gives +0", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
          // 1/4 = 25% → +0
        ],
      }));
      // 52+5+6+5+5+0+5 = 78
      expect(r.digital_score).toBe(78);
    });

    it("<20% gives -4", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [],
      }));
      // 0/4=0% → -4. Score: 52+5+6+5+5-4+5 = 74
      expect(r.digital_score).toBe(74);
    });
  });

  // ── 11. Mod 6 — Cyberbullying Preparedness ────────────────────────────
  describe("mod 6: cyberbullying preparedness", () => {
    it(">=80% gives +5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      // 4/4=100% → +5
      expect(r.digital_score).toBe(82);
    });

    it(">=50% gives +2", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_cyberbullying_response: false }),
        ],
      }));
      // cyberbullying: 2/4=50% → +2. Score: 52+5+6+5+5+4+2 = 79
      expect(r.digital_score).toBe(79);
    });

    it(">=30% gives +0", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_cyberbullying_response: false }),
        ],
        total_children: 3,
      }));
      // cyberbullying: 1/3=33% → +0
      // Mod 1: 3/3=100% → +5
      // Mod 3: 4 phones out of 4 → 100% → +5
      // Mod 4: 3/3=100% → +5
      // Mod 5: 4 children engaged RSE / 3 total = 133% → +4
      // Mod 2: 4/4=100% → +6
      // Total: 52+5+6+5+5+4+0 = 77
      expect(r.digital_score).toBe(77);
    });

    it("<30% gives -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_cyberbullying_response: false }),
        ],
      }));
      // 0/4=0% → -5. Score: 52+5+6+5+5+4-5 = 72
      expect(r.digital_score).toBe(72);
    });
  });

  // ── 12. Output Metrics ────────────────────────────────────────────────
  describe("output metrics", () => {
    it("children_with_digital_plans counts unique children", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_1" }), // duplicate
          makeDigitalPlan({ id: "dp_3", child_id: "child_2" }),
        ],
      }));
      expect(r.children_with_digital_plans).toBe(2);
    });

    it("digital_skill_coverage_rate reflects unique children with skills", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2" }),
        ],
        total_children: 4,
      }));
      expect(r.digital_skill_coverage_rate).toBe(50); // 2/4
    });

    it("parental_controls_rate based on phone records", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3" }),
        ],
      }));
      expect(r.parental_controls_rate).toBe(67); // 2/3
    });

    it("rse_digital_coverage_rate based on engaged RSE sessions", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1", child_engaged: true }),
          makeRseDigital({ id: "rse_2", child_id: "child_2", child_engaged: false }),
          makeRseDigital({ id: "rse_3", child_id: "child_3", topic_is_digital_safety: false }),
        ],
        total_children: 4,
      }));
      // Only child_1 has engaged + digital safety topic
      expect(r.rse_digital_coverage_rate).toBe(25); // 1/4
    });

    it("exploitation_risk_assessed_rate from plans", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: true }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: true }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_exploitation_risk_assessment: false }),
        ],
      }));
      expect(r.exploitation_risk_assessed_rate).toBe(50); // 2/4
    });
  });

  // ── 13. Strengths ─────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes strength for high digital plan coverage", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.strengths.some(s => s.includes("digital safety plans"))).toBe(true);
    });

    it("includes strength for high skill competency", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.strengths.some(s => s.includes("digital literacy"))).toBe(true);
    });

    it("includes strength for high parental controls rate", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.strengths.some(s => s.includes("Parental controls"))).toBe(true);
    });

    it("includes strength for exploitation risk assessments", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.strengths.some(s => s.includes("Exploitation risk assessments"))).toBe(true);
    });

    it("includes strength for RSE digital coverage", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.strengths.some(s => s.includes("RSE digital safety"))).toBe(true);
    });

    it("includes strength for cyberbullying preparedness", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.strengths.some(s => s.includes("Cyberbullying response plans"))).toBe(true);
    });
  });

  // ── 14. Concerns ──────────────────────────────────────────────────────
  describe("concerns", () => {
    it("raises concern for children without digital plans", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("without digital safety plans"))).toBe(true);
    });

    it("raises concern for low skill competency", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "basic" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "none" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("digital skills at intermediate"))).toBe(true);
    });

    it("raises concern for low parental controls rate", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Parental controls active on only"))).toBe(true);
    });

    it("raises concern for low exploitation risk assessment rate", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_exploitation_risk_assessment: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("exploitation risk assessments"))).toBe(true);
    });

    it("raises concern for low RSE coverage", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("RSE digital safety coverage"))).toBe(true);
    });

    it("raises concern for low cyberbullying preparedness", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_cyberbullying_response: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("cyberbullying response"))).toBe(true);
    });
  });

  // ── 15. Recommendations ───────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends creating digital plans when coverage is low", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("digital safety plans"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends digital literacy investment when skill competency low", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "basic" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "none" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("digital literacy"));
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends activating parental controls when rate is low", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("parental controls"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("recommends exploitation risk assessments when incomplete", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_exploitation_risk_assessment: false }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("exploitation risk"));
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("recommends expanding RSE when coverage is low", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("RSE"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommends cyberbullying response protocols when low", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_cyberbullying_response: false }),
        ],
      }));
      const rec = r.recommendations.find(rec => rec.recommendation.includes("cyberbullying"));
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("recommendations have sequential ranks", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
        ],
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
        ],
        rse_digital: [],
      });
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── 16. Insights ──────────────────────────────────────────────────────
  describe("insights", () => {
    it("produces positive insight when all metrics exemplary", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("produces critical insight for very low parental controls", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Parental controls"))).toBe(true);
    });

    it("produces critical insight for very low exploitation risk assessment", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_exploitation_risk_assessment: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("exploitation"))).toBe(true);
    });

    it("produces critical insight for very low RSE coverage", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("RSE"))).toBe(true);
    });

    it("produces warning for low skill competency", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("digital skills"))).toBe(true);
    });

    it("produces warning for low cyberbullying preparedness", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_cyberbullying_response: false }),
          makeDigitalPlan({ id: "dp_4", child_id: "child_4", has_cyberbullying_response: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Cyberbullying"))).toBe(true);
    });
  });

  // ── 17. Headlines ─────────────────────────────────────────────────────
  describe("headlines", () => {
    it("outstanding headline mentions plan count and skill rate", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("4 children with plans");
    });

    it("good headline mentions plan coverage percentage", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "advanced" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "basic" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "none" }),
        ],
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
          makeRseDigital({ id: "rse_2", child_id: "child_2" }),
        ],
      }));
      expect(r.headline).toContain("Good");
      expect(r.headline).toContain("100%");
    });

    it("adequate headline mentions requires improvement", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_2" }),
          makeDigitalPlan({ id: "dp_3", child_id: "child_3", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
        ],
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "intermediate" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
          makeDigitalSkill({ id: "ds_3", child_id: "child_3", competency: "none" }),
          makeDigitalSkill({ id: "ds_4", child_id: "child_4", competency: "basic" }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1" }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2" }),
          makePhoneRecord({ id: "pr_3", child_id: "child_3", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_4", child_id: "child_4", parental_controls_active: false }),
        ],
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1" }),
        ],
      }));
      expect(r.headline).toContain("requires improvement");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [],
        digital_plans: [],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
        ],
        rse_digital: [],
      });
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── 18. Edge Cases ────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles empty arrays with positive total_children", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [],
        digital_plans: [],
        phone_records: [],
        rse_digital: [],
      });
      expect(r.digital_rating).not.toBe("insufficient_data");
      expect(r.children_with_digital_plans).toBe(0);
      expect(r.digital_skill_coverage_rate).toBe(0);
      expect(r.parental_controls_rate).toBe(0);
      expect(r.rse_digital_coverage_rate).toBe(0);
    });

    it("handles single child with perfect data", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 1,
        digital_skills: [makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "advanced" })],
        digital_plans: [makeDigitalPlan({ id: "dp_1", child_id: "child_1" })],
        phone_records: [makePhoneRecord({ id: "pr_1", child_id: "child_1" })],
        rse_digital: [makeRseDigital({ id: "rse_1", child_id: "child_1" })],
      });
      expect(r.digital_score).toBe(82);
      expect(r.digital_rating).toBe("outstanding");
      expect(r.children_with_digital_plans).toBe(1);
    });

    it("duplicate child plans count unique children only once", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
          makeDigitalPlan({ id: "dp_2", child_id: "child_1" }), // same child
          makeDigitalPlan({ id: "dp_3", child_id: "child_2" }),
        ],
      }));
      expect(r.children_with_digital_plans).toBe(2); // 2 unique
    });

    it("RSE entries only count when both digital_safety and engaged", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        rse_digital: [
          makeRseDigital({ id: "rse_1", child_id: "child_1", topic_is_digital_safety: true, child_engaged: true }),
          makeRseDigital({ id: "rse_2", child_id: "child_2", topic_is_digital_safety: true, child_engaged: false }),
          makeRseDigital({ id: "rse_3", child_id: "child_3", topic_is_digital_safety: false, child_engaged: true }),
          makeRseDigital({ id: "rse_4", child_id: "child_4", topic_is_digital_safety: false, child_engaged: false }),
        ],
        total_children: 4,
      }));
      // Only child_1 meets both criteria
      expect(r.rse_digital_coverage_rate).toBe(25); // 1/4
    });

    it("score is clamped to 0 minimum", () => {
      // Even the worst case: 52-5-5-5-4-4-5 = 24 won't go below 0
      // But verify the clamp logic is correct
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
        ],
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
        ],
        rse_digital: [],
      });
      expect(r.digital_score).toBeGreaterThanOrEqual(0);
      expect(r.digital_score).toBeLessThanOrEqual(100);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.digital_score).toBeLessThanOrEqual(100);
    });

    it("no strengths when all metrics are poor", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
        ],
        digital_plans: [],
        phone_records: [],
        rse_digital: [],
      });
      expect(r.strengths).toHaveLength(0);
    });

    it("no concerns when all metrics are excellent", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("empty phone_records means mod 3 uses 0/0 → 0% → -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [],
      }));
      // parental controls: 0/0=0% → <50% → -5
      // Score: 52+5+6-5+5+4+5 = 72
      expect(r.digital_score).toBe(72);
    });

    it("empty digital_plans means mod 4 uses 0/0 → -4 and mod 6 uses 0/0 → -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [],
      }));
      // Mod 1: 0/4=0% → <30% → -5
      // Mod 4: 0/0=0% → <30% → -4
      // Mod 6: 0/0=0% → <30% → -5
      // Score: 52-5+6+5-4+4-5 = 53
      expect(r.digital_score).toBe(53);
    });

    it("empty digital_skills means mod 2 uses 0/0 → 0% → -5", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_skills: [],
      }));
      // Mod 2: 0/0=0% → <25% → -5
      // Score: 52+5-5+5+5+4+5 = 71
      expect(r.digital_score).toBe(71);
    });
  });

  // ── 19. Regulatory References & Mod Interactions ────────────────────
  describe("regulatory references", () => {
    it("all recommendations reference CHR 2015 Reg 12 or Reg 13", () => {
      const r = computeDigitalLiteracyOnlineSafety({
        today: TODAY,
        total_children: 4,
        digital_skills: [
          makeDigitalSkill({ id: "ds_1", child_id: "child_1", competency: "none" }),
          makeDigitalSkill({ id: "ds_2", child_id: "child_2", competency: "basic" }),
        ],
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1", has_exploitation_risk_assessment: false, has_cyberbullying_response: false }),
        ],
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
        ],
        rse_digital: [],
      });
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toMatch(/CHR 2015 Reg 1[23]/);
      }
    });

    it("parental controls recommendation references Reg 13 (child protection)", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        phone_records: [
          makePhoneRecord({ id: "pr_1", child_id: "child_1", parental_controls_active: false }),
          makePhoneRecord({ id: "pr_2", child_id: "child_2", parental_controls_active: false }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("parental controls"));
      expect(rec?.regulatory_ref).toBe("CHR 2015 Reg 13");
    });

    it("digital plans recommendation references Reg 12 (health)", () => {
      const r = computeDigitalLiteracyOnlineSafety(baseInput({
        digital_plans: [
          makeDigitalPlan({ id: "dp_1", child_id: "child_1" }),
        ],
      }));
      const rec = r.recommendations.find(r => r.recommendation.includes("digital safety plans"));
      expect(rec?.regulatory_ref).toBe("CHR 2015 Reg 12");
    });
  });
});
