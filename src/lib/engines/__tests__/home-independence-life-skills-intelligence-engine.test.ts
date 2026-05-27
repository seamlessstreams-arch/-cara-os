import { describe, it, expect } from "vitest";
import {
  computeHomeIndependenceLifeSkills,
  type HomeIndependenceLifeSkillsInput,
  type IndependenceAssessmentInput,
  type CookingInput,
  type LaundryInput,
  type MoneyInput,
  type HouseholdTaskInput,
} from "../home-independence-life-skills-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeIA(overrides: Partial<IndependenceAssessmentInput> = {}): IndependenceAssessmentInput {
  return {
    id: "ia1", child_id: "c1", assessment_date: "2025-05-01",
    next_assessment_due: "2025-09-01",
    overall_readiness: "competent", child_agreed: true,
    domain_assessment_count: 6, child_aspirations_present: true,
    child_worries_count: 2, priority_skills_count: 3,
    resources_allocated_count: 2,
    ...overrides,
  };
}

function makeCK(overrides: Partial<CookingInput> = {}): CookingInput {
  return {
    id: "ck1", child_id: "c1", recorded_date: "2025-05-10",
    review_date: "2025-09-10",
    competency_level: "independent", hygiene_certificate: true,
    led_family_meal: true, child_voice_present: true,
    recipes_attempted_count: 3,
    cuisines_explored: ["british", "italian"],
    ...overrides,
  };
}

function makeLY(overrides: Partial<LaundryInput> = {}): LaundryInput {
  return {
    id: "ly1", child_id: "c1", recorded_date: "2025-05-15",
    review_date: "2025-09-15",
    overall_stage: "independent", owns_basket: true,
    knows_care_symbols: true, iron_competent: true,
    child_voice_present: true,
    ...overrides,
  };
}

function makeMN(overrides: Partial<MoneyInput> = {}): MoneyInput {
  return {
    id: "mn1", child_id: "c1", recorded_date: "2025-05-20",
    review_date: "2025-09-20",
    competency: "confident", real_world_application_count: 3,
    child_voice_present: true,
    ...overrides,
  };
}

function makeHT(overrides: Partial<HouseholdTaskInput> = {}): HouseholdTaskInput {
  return {
    id: "ht1", child_id: "c1", reviewed_date: "2025-06-01",
    support_level: "independent", child_chose: true,
    completion_recent: 90, child_voice_present: true,
    ...overrides,
  };
}

/**
 * baseInput produces score = 80 (outstanding)
 * 52 base + 5 (mod1) + 4 (mod2) + 3 (mod3) + 4 (mod4) + 3 (mod5) + 3 (mod6) + 3 (mod7) + 3 (mod8) = 80
 */
function baseInput(overrides: Partial<HomeIndependenceLifeSkillsInput> = {}): HomeIndependenceLifeSkillsInput {
  return {
    today: TODAY,
    independence_assessments: [
      makeIA({ id: "ia1", child_id: "c1" }),
      makeIA({ id: "ia2", child_id: "c2" }),
      makeIA({ id: "ia3", child_id: "c3" }),
      makeIA({ id: "ia4", child_id: "c4" }),
      makeIA({ id: "ia5", child_id: "c5" }),
    ],
    cooking_records: [
      makeCK({ id: "ck1", child_id: "c1", cuisines_explored: ["british", "italian"] }),
      makeCK({ id: "ck2", child_id: "c2", cuisines_explored: ["chinese", "indian"] }),
      makeCK({ id: "ck3", child_id: "c3", cuisines_explored: ["british", "mexican"] }),
      makeCK({ id: "ck4", child_id: "c4", cuisines_explored: ["italian", "thai"] }),
      makeCK({ id: "ck5", child_id: "c5", cuisines_explored: ["british"] }),
    ],
    laundry_records: [
      makeLY({ id: "ly1", child_id: "c1" }),
      makeLY({ id: "ly2", child_id: "c2" }),
      makeLY({ id: "ly3", child_id: "c3" }),
      makeLY({ id: "ly4", child_id: "c4" }),
      makeLY({ id: "ly5", child_id: "c5" }),
    ],
    money_records: [
      makeMN({ id: "mn1", child_id: "c1" }),
      makeMN({ id: "mn2", child_id: "c2" }),
      makeMN({ id: "mn3", child_id: "c3" }),
      makeMN({ id: "mn4", child_id: "c4" }),
      makeMN({ id: "mn5", child_id: "c5" }),
    ],
    household_tasks: [
      makeHT({ id: "ht1", child_id: "c1" }),
      makeHT({ id: "ht2", child_id: "c2" }),
      makeHT({ id: "ht3", child_id: "c3" }),
      makeHT({ id: "ht4", child_id: "c4" }),
      makeHT({ id: "ht5", child_id: "c5" }),
    ],
    total_children: 5,
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("computeHomeIndependenceLifeSkills", () => {
  // ── Insufficient data ──────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when no data at all", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY, independence_assessments: [], cooking_records: [],
        laundry_records: [], money_records: [], household_tasks: [],
        total_children: 0,
      });
      expect(r.independence_rating).toBe("insufficient_data");
      expect(r.independence_score).toBe(0);
    });

    it("returns empty arrays for narrative on insufficient data", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY, independence_assessments: [], cooking_records: [],
        laundry_records: [], money_records: [], household_tasks: [],
        total_children: 0,
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("does NOT return insufficient_data when total_children > 0", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY, independence_assessments: [], cooking_records: [],
        laundry_records: [], money_records: [], household_tasks: [],
        total_children: 3,
      });
      expect(r.independence_rating).not.toBe("insufficient_data");
    });

    it("returns correct headline for insufficient data", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY, independence_assessments: [], cooking_records: [],
        laundry_records: [], money_records: [], household_tasks: [],
        total_children: 0,
      });
      expect(r.headline).toContain("No independence");
    });
  });

  // ── Rating thresholds ──────────────────────────────────────────────
  describe("rating thresholds", () => {
    it("baseInput scores exactly 80 (outstanding)", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.independence_score).toBe(80);
      expect(r.independence_rating).toBe("outstanding");
    });

    it("good range: 65–79", () => {
      // Remove cooking records → mod2=-2, mod8 loses cuisines+recipes (-2), mod6 loses a voice source
      const r = computeHomeIndependenceLifeSkills(baseInput({
        cooking_records: [],
      }));
      // mod2: no cooking, total_children>=2 → -2
      // mod6: 4 voice sources (ia,ly,mn,ht) all 100% → avg 100 → +3 (unchanged)
      // mod7: fewer reviewable items but all 0 overdue → +3 (unchanged)
      // mod8: domainsWithData=4 (<5, >2) → 0, cuisines=0 (no cooking→no penalty since length=0), recipes=0 (no cooking→no penalty) → 0
      // Total: 52+5+(-2)+3+4+3+3+3+0 = 71
      expect(r.independence_rating).toBe("good");
      expect(r.independence_score).toBeGreaterThanOrEqual(65);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("adequate range: 45–64", () => {
      // 3 of 5 children covered, mixed quality, some voice
      // mod1: coverage 60%>=50(+1), readiness 33%<60 not<20(0), agreed 67%<80 not<40(0), overdue 0(+1) = +2
      // mod2: coverage 60%>=40 not>=80(0), competency 33%<60 not<20(0), hygiene 33%<60 not<20(0), meal 33%<50 not<10(0) = 0
      // mod3: coverage 60%>=40 not>=80(0), stage 33%<60 not<20(0), knowledge: basket 67%>=60(1)+care 33%<60(0)+iron 33%<60(0)=1<2 not=0(0) = 0
      // mod4: coverage 60%>=40 not>=80(0), competency 33%<60 not<20(0), real_world 67%<80 not<30(0), voice 67%<80 not<30(0) = 0
      // mod5: completion 60 >=40 not>=80(0), chose 67%<70 not<30(0), indep 33%<60 not<20(0) = 0
      // mod6: ia=67, ck=67, ly=67, mn=67, ht=67. avg=67 >=50(+1)
      // mod7: 0 overdue, totalReviewable=15 → +3
      // mod8: domains=5(+1), cuisines: british+italian=2<4 not=0(0), recipes=3+3+3=9<10 with cooking→no penalty(0) = +1
      // Total: 52 + 2 + 0 + 0 + 0 + 0 + 1 + 3 + 1 = 59
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [
          makeIA({ id: "ia1", child_id: "c1", overall_readiness: "competent", child_agreed: true }),
          makeIA({ id: "ia2", child_id: "c2", overall_readiness: "developing", child_agreed: true }),
          makeIA({ id: "ia3", child_id: "c3", overall_readiness: "emerging", child_agreed: false }),
        ],
        cooking_records: [
          makeCK({ id: "ck1", child_id: "c1", competency_level: "independent", hygiene_certificate: true, led_family_meal: true, child_voice_present: true }),
          makeCK({ id: "ck2", child_id: "c2", competency_level: "supervised", hygiene_certificate: false, led_family_meal: false, child_voice_present: true }),
          makeCK({ id: "ck3", child_id: "c3", competency_level: "assisted", hygiene_certificate: false, led_family_meal: false, child_voice_present: false }),
        ],
        laundry_records: [
          makeLY({ id: "ly1", child_id: "c1", overall_stage: "independent", owns_basket: true, knows_care_symbols: true, iron_competent: true, child_voice_present: true }),
          makeLY({ id: "ly2", child_id: "c2", overall_stage: "supervised", owns_basket: true, knows_care_symbols: false, iron_competent: false, child_voice_present: true }),
          makeLY({ id: "ly3", child_id: "c3", overall_stage: "learning_steps", owns_basket: false, knows_care_symbols: false, iron_competent: false, child_voice_present: false }),
        ],
        money_records: [
          makeMN({ id: "mn1", child_id: "c1", competency: "confident", real_world_application_count: 3, child_voice_present: true }),
          makeMN({ id: "mn2", child_id: "c2", competency: "practising", real_world_application_count: 1, child_voice_present: true }),
          makeMN({ id: "mn3", child_id: "c3", competency: "learning", real_world_application_count: 0, child_voice_present: false }),
        ],
        household_tasks: [
          makeHT({ id: "ht1", child_id: "c1", support_level: "independent", child_chose: true, completion_recent: 85, child_voice_present: true }),
          makeHT({ id: "ht2", child_id: "c2", support_level: "light_support", child_chose: true, completion_recent: 55, child_voice_present: true }),
          makeHT({ id: "ht3", child_id: "c3", support_level: "moderate_support", child_chose: false, completion_recent: 40, child_voice_present: false }),
        ],
      }));
      expect(r.independence_rating).toBe("adequate");
      expect(r.independence_score).toBeGreaterThanOrEqual(45);
      expect(r.independence_score).toBeLessThan(65);
    });

    it("inadequate: below 45", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY,
        independence_assessments: [],
        cooking_records: [],
        laundry_records: [],
        money_records: [],
        household_tasks: [],
        total_children: 5,
      });
      // 52 - 3(mod1) - 2(mod2) - 1(mod3) - 2(mod4) - 1(mod5) + 0(mod6) + 0(mod7) + 0(mod8) = 43
      // mod1: no assessments, children>=3 → -3
      // mod2: no cooking, children>=2 → -2
      // mod3: no laundry, children>=2 → -1
      // mod4: no money, children>=2 → -2
      // mod5: no tasks, children>=2 → -1
      // mod6: no voice sources → 0
      // mod7: totalReviewable=0 → 0
      // mod8: domainsWithData=0<=2 → -1, no cooking → no cuisine/recipe penalty → -1
      expect(r.independence_rating).toBe("inadequate");
      expect(r.independence_score).toBeLessThan(45);
    });

    it("score at boundary 80 is outstanding", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.independence_score).toBe(80);
      expect(r.independence_rating).toBe("outstanding");
    });

    it("score at 79 is good", () => {
      // Drop one modifier by 1 point: make one assessment overdue
      // mod1: coverage 80%+ → +2, competent → +1, agreed → +1, iaOverdue=1 (not 0 → no +1, not >=3 → no -2) → +4 instead of +5
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [
          makeIA({ id: "ia1", child_id: "c1" }),
          makeIA({ id: "ia2", child_id: "c2" }),
          makeIA({ id: "ia3", child_id: "c3" }),
          makeIA({ id: "ia4", child_id: "c4" }),
          makeIA({ id: "ia5", child_id: "c5", next_assessment_due: "2025-06-01" }),
        ],
      }));
      // mod1 drops from +5 to +4, mod7: 1 overdue total → overdueCount=1<=2 → +1 instead of +3
      // Total: 52+4+4+3+4+3+3+1+3 = 77
      expect(r.independence_score).toBeLessThan(80);
      expect(r.independence_rating).toBe("good");
    });
  });

  // ── Mod 1: Independence Assessment Coverage & Quality (±5) ────────
  describe("mod1: independence assessments", () => {
    it("+5 with full coverage, competent readiness, child agreed, no overdue", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.assessments.child_coverage).toBe(100);
      expect(r.assessments.competent_or_independent_rate).toBe(100);
      expect(r.assessments.child_agreed_rate).toBe(100);
      expect(r.assessments.overdue_assessments).toBe(0);
    });

    it("penalises low coverage", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [makeIA({ id: "ia1", child_id: "c1" })],
      }));
      expect(r.assessments.child_coverage).toBe(20);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises low readiness levels", () => {
      const assessments = baseInput().independence_assessments.map(a => ({
        ...a, overall_readiness: "not_ready",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: assessments }));
      expect(r.assessments.competent_or_independent_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises low child agreement", () => {
      const assessments = baseInput().independence_assessments.map(a => ({
        ...a, child_agreed: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: assessments }));
      expect(r.assessments.child_agreed_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises overdue assessments", () => {
      const assessments = baseInput().independence_assessments.map(a => ({
        ...a, next_assessment_due: "2025-01-01",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: assessments }));
      expect(r.assessments.overdue_assessments).toBe(5);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no assessments with 3+ children", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: [] }));
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Mod 2: Cooking & Baking Skills (±4) ───────────────────────────
  describe("mod2: cooking & baking", () => {
    it("+4 with full coverage, independent, certificates, family meals", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.cooking.child_coverage).toBe(100);
      expect(r.cooking.independent_or_teaching_rate).toBe(100);
      expect(r.cooking.hygiene_certificate_rate).toBe(100);
      expect(r.cooking.led_family_meal_rate).toBe(100);
    });

    it("penalises observer-only competency", () => {
      const records = baseInput().cooking_records.map(r => ({
        ...r, competency_level: "observer",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: records }));
      expect(r.cooking.independent_or_teaching_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no hygiene certificates", () => {
      const records = baseInput().cooking_records.map(r => ({
        ...r, hygiene_certificate: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: records }));
      expect(r.cooking.hygiene_certificate_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no family meals", () => {
      const records = baseInput().cooking_records.map(r => ({
        ...r, led_family_meal: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: records }));
      expect(r.cooking.led_family_meal_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no cooking records with 2+ children", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: [] }));
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Mod 3: Laundry & Self-Care Progress (±3) ──────────────────────
  describe("mod3: laundry & self-care", () => {
    it("+3 with full coverage, independent, all knowledge markers", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.laundry.child_coverage).toBe(100);
      expect(r.laundry.independent_or_mastered_rate).toBe(100);
      expect(r.laundry.owns_basket_rate).toBe(100);
      expect(r.laundry.knows_care_symbols_rate).toBe(100);
      expect(r.laundry.iron_competent_rate).toBe(100);
    });

    it("penalises full_support stage", () => {
      const records = baseInput().laundry_records.map(r => ({
        ...r, overall_stage: "full_support",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ laundry_records: records }));
      expect(r.laundry.independent_or_mastered_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no knowledge markers", () => {
      const records = baseInput().laundry_records.map(r => ({
        ...r, owns_basket: false, knows_care_symbols: false, iron_competent: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ laundry_records: records }));
      expect(r.independence_score).toBeLessThan(80);
    });

    it("partial knowledge markers still give bonus if 2+ present", () => {
      const records = baseInput().laundry_records.map(r => ({
        ...r, iron_competent: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ laundry_records: records }));
      // basket=100%>=60(1), careSymbols=100%>=60(1), iron=0%<60(0) = 2 >= 2 → still +1
      expect(r.laundry.iron_competent_rate).toBe(0);
      // Score should still be 80 since knowledge score = 2 >= 2
      expect(r.independence_score).toBe(80);
    });

    it("penalises no laundry records with 2+ children", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ laundry_records: [] }));
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Mod 4: Money Management Skills (±4) ───────────────────────────
  describe("mod4: money management", () => {
    it("+4 with full coverage, confident, real-world, child voice", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.money.child_coverage).toBe(100);
      expect(r.money.confident_or_independent_rate).toBe(100);
      expect(r.money.real_world_application_rate).toBe(100);
      expect(r.money.child_voice_rate).toBe(100);
    });

    it("penalises not_started competency", () => {
      const records = baseInput().money_records.map(r => ({
        ...r, competency: "not_started",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ money_records: records }));
      expect(r.money.confident_or_independent_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no real-world application", () => {
      const records = baseInput().money_records.map(r => ({
        ...r, real_world_application_count: 0,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ money_records: records }));
      expect(r.money.real_world_application_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no child voice in money", () => {
      const records = baseInput().money_records.map(r => ({
        ...r, child_voice_present: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ money_records: records }));
      expect(r.money.child_voice_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no money records with 2+ children", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ money_records: [] }));
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Mod 5: Household Task Engagement (±3) ─────────────────────────
  describe("mod5: household tasks", () => {
    it("+3 with high completion, child-chosen, independent", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.household.avg_completion).toBe(90);
      expect(r.household.child_chose_rate).toBe(100);
      expect(r.household.independent_or_role_model_rate).toBe(100);
    });

    it("penalises low completion", () => {
      const tasks = baseInput().household_tasks.map(t => ({
        ...t, completion_recent: 20,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ household_tasks: tasks }));
      expect(r.household.avg_completion).toBe(20);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises not child-chosen", () => {
      const tasks = baseInput().household_tasks.map(t => ({
        ...t, child_chose: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ household_tasks: tasks }));
      expect(r.household.child_chose_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises full_support level", () => {
      const tasks = baseInput().household_tasks.map(t => ({
        ...t, support_level: "full_support",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ household_tasks: tasks }));
      expect(r.household.independent_or_role_model_rate).toBe(0);
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no tasks with 2+ children", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ household_tasks: [] }));
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Mod 6: Child Voice Across Life Skills (±3) ────────────────────
  describe("mod6: child voice", () => {
    it("+3 when voice rate is 90%+ across all domains", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.independence_score).toBe(80);
    });

    it("penalises low voice across all domains", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: baseInput().independence_assessments.map(a => ({ ...a, child_agreed: false })),
        cooking_records: baseInput().cooking_records.map(c => ({ ...c, child_voice_present: false })),
        laundry_records: baseInput().laundry_records.map(l => ({ ...l, child_voice_present: false })),
        money_records: baseInput().money_records.map(m => ({ ...m, child_voice_present: false })),
        household_tasks: baseInput().household_tasks.map(h => ({ ...h, child_voice_present: false })),
      }));
      // avgVoice = 0 < 30 → -2, also drops mod1 (agreed 0%), mod4 (voice 0%)
      expect(r.independence_score).toBeLessThan(80);
    });

    it("mid-range voice gives partial bonus", () => {
      // 3 of 5 assessments agreed (60%), all other voice 100%
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [
          makeIA({ id: "ia1", child_id: "c1", child_agreed: true }),
          makeIA({ id: "ia2", child_id: "c2", child_agreed: true }),
          makeIA({ id: "ia3", child_id: "c3", child_agreed: true }),
          makeIA({ id: "ia4", child_id: "c4", child_agreed: false }),
          makeIA({ id: "ia5", child_id: "c5", child_agreed: false }),
        ],
      }));
      // iaAgreedRate = 60%, other 4 sources = 100%. avg = (60+100+100+100+100)/5 = 92 → +3
      // But mod1 loses child_agreed bonus: 60% < 80% → no +1, not <40% → no -1
      // mod1: +2(coverage) +1(readiness) +0(agreed) +1(no overdue) = +4
      // Score: 52+4+4+3+4+3+3+3+3 = 79
      expect(r.independence_score).toBe(79);
    });
  });

  // ── Mod 7: Review Compliance (±3) ─────────────────────────────────
  describe("mod7: review compliance", () => {
    it("+3 when all reviews current", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.independence_score).toBe(80);
    });

    it("penalises many overdue reviews", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: baseInput().independence_assessments.map(a => ({ ...a, next_assessment_due: "2025-01-01" })),
        cooking_records: baseInput().cooking_records.map(c => ({ ...c, review_date: "2025-01-01" })),
      }));
      // iaOverdue=5, ckOverdue=5 → total 10 >=5 → mod7=-3
      // Also mod1 overdue: iaOverdue=5>=3 → -2 instead of +1 on overdue term
      expect(r.independence_score).toBeLessThan(80);
    });

    it("1–2 overdue gives partial bonus", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [
          makeIA({ id: "ia1", child_id: "c1" }),
          makeIA({ id: "ia2", child_id: "c2" }),
          makeIA({ id: "ia3", child_id: "c3" }),
          makeIA({ id: "ia4", child_id: "c4" }),
          makeIA({ id: "ia5", child_id: "c5", next_assessment_due: "2025-06-01" }),
        ],
      }));
      // 1 overdue total → mod7: +1 instead of +3
      // mod1: iaOverdue=1 → no +1 → +4
      // Total: 52+4+4+3+4+3+3+1+3 = 77
      expect(r.independence_score).toBe(77);
    });

    it("household tasks overdue if reviewed_date > 90 days ago", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        household_tasks: baseInput().household_tasks.map(t => ({ ...t, reviewed_date: "2025-01-01" })),
      }));
      // daysBetween("2025-01-01", "2025-06-15") = 165 > 90 → all 5 overdue
      // mod7: overdueCount=5 >=5 → -3
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Mod 8: Skill Breadth & Diversity (±3) ─────────────────────────
  describe("mod8: skill breadth & diversity", () => {
    it("+3 with all 5 domains, diverse cuisines, many recipes", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      // Cuisines: british, italian, chinese, indian, mexican, thai = 6 >= 4 → +1
      // Recipes: 5 * 3 = 15 >= 10 → +1
      // Domains: 5 >= 5 → +1
      expect(r.independence_score).toBe(80);
    });

    it("penalises few domains with data", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        cooking_records: [],
        laundry_records: [],
        money_records: [],
      }));
      // domainsWithData = 2 (assessments + household) → <=2 → -1
      // Also loses mod2,3,4 bonuses
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no cuisines explored despite cooking records", () => {
      const records = baseInput().cooking_records.map(r => ({
        ...r, cuisines_explored: [],
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: records }));
      // cuisines = 0, cooking exists → -1 on cuisines
      // recipes still 15 >= 10 → +1
      // domains still 5 → +1
      // mod8: +1-1+1 = +1 instead of +3
      expect(r.independence_score).toBeLessThan(80);
    });

    it("penalises no recipes despite cooking records", () => {
      const records = baseInput().cooking_records.map(r => ({
        ...r, recipes_attempted_count: 0,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: records }));
      // recipes = 0, cooking exists → -1
      expect(r.independence_score).toBeLessThan(80);
    });
  });

  // ── Cross-modifier interactions ───────────────────────────────────
  describe("cross-modifier interactions", () => {
    it("removing one child reduces coverage across all domains", () => {
      // Remove c5 from everything
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: baseInput().independence_assessments.filter(a => a.child_id !== "c5"),
        cooking_records: baseInput().cooking_records.filter(c => c.child_id !== "c5"),
        laundry_records: baseInput().laundry_records.filter(l => l.child_id !== "c5"),
        money_records: baseInput().money_records.filter(m => m.child_id !== "c5"),
        household_tasks: baseInput().household_tasks.filter(h => h.child_id !== "c5"),
      }));
      // 4/5 = 80% coverage everywhere — still meets 80% threshold
      expect(r.assessments.child_coverage).toBe(80);
      expect(r.cooking.child_coverage).toBe(80);
    });

    it("overdue assessments affect both mod1 and mod7", () => {
      const overdue = baseInput().independence_assessments.map(a => ({
        ...a, next_assessment_due: "2025-01-01",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: overdue }));
      // mod1: +2+1+1-2=+2 (overdue >= 3 → -2), mod7: overdueCount=5 >= 5 → -3
      // 52+2+4+3+4+3+3-3+3 = 71
      expect(r.independence_score).toBe(71);
    });

    it("child voice affects both individual domain mods and mod6", () => {
      // Remove voice from money only
      const records = baseInput().money_records.map(r => ({
        ...r, child_voice_present: false,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ money_records: records }));
      // mod4: voice 0% <30 → -1, so +1+1+1-1 = +2
      // mod6: ia=100, ck=100, ly=100, mn=0, ht=100. avg=(100+100+100+0+100)/5=80 → >=70 → +2
      // 52+5+4+3+2+3+2+3+3 = 77
      expect(r.independence_score).toBe(77);
    });

    it("empty cooking affects mod2, mod6, and mod8", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        cooking_records: [],
      }));
      // mod2: -2 (no cooking, children>=2)
      // mod6: 4 sources all 100% → avg 100 → +3
      // mod7: fewer items but 0 overdue → +3
      // mod8: domains=4 (<5 but >2) → 0, no cooking → no cuisine penalty, no recipe penalty → 0
      // 52+5-2+3+4+3+3+3+0 = 71
      expect(r.independence_score).toBe(71);
    });
  });

  // ── Profile calculations ──────────────────────────────────────────
  describe("profile calculations", () => {
    it("correctly calculates assessment summary", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.assessments.total_assessments).toBe(5);
      expect(r.assessments.child_coverage).toBe(100);
      expect(r.assessments.competent_or_independent_rate).toBe(100);
      expect(r.assessments.child_agreed_rate).toBe(100);
      expect(r.assessments.overdue_assessments).toBe(0);
    });

    it("correctly calculates cooking summary", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.cooking.total_records).toBe(5);
      expect(r.cooking.child_coverage).toBe(100);
      expect(r.cooking.independent_or_teaching_rate).toBe(100);
      expect(r.cooking.hygiene_certificate_rate).toBe(100);
      expect(r.cooking.led_family_meal_rate).toBe(100);
      expect(r.cooking.child_voice_rate).toBe(100);
    });

    it("correctly calculates laundry summary", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.laundry.total_records).toBe(5);
      expect(r.laundry.child_coverage).toBe(100);
      expect(r.laundry.independent_or_mastered_rate).toBe(100);
      expect(r.laundry.owns_basket_rate).toBe(100);
      expect(r.laundry.knows_care_symbols_rate).toBe(100);
      expect(r.laundry.iron_competent_rate).toBe(100);
    });

    it("correctly calculates money summary", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.money.total_records).toBe(5);
      expect(r.money.child_coverage).toBe(100);
      expect(r.money.confident_or_independent_rate).toBe(100);
      expect(r.money.real_world_application_rate).toBe(100);
      expect(r.money.child_voice_rate).toBe(100);
    });

    it("correctly calculates household summary", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.household.total_tasks).toBe(5);
      expect(r.household.child_coverage).toBe(100);
      expect(r.household.avg_completion).toBe(90);
      expect(r.household.child_chose_rate).toBe(100);
      expect(r.household.independent_or_role_model_rate).toBe(100);
    });
  });

  // ── Strengths & concerns ──────────────────────────────────────────
  describe("narrative: strengths", () => {
    it("generates strengths for outstanding baseInput", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.strengths.length).toBeGreaterThan(0);
    });

    it("includes assessment coverage strength", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.strengths.some(s => s.includes("independence assessment"))).toBe(true);
    });

    it("includes cooking competency strength", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.strengths.some(s => s.includes("cooking"))).toBe(true);
    });

    it("includes child participation strength", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.strengths.some(s => s.includes("child participation"))).toBe(true);
    });

    it("includes household task engagement strength", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.strengths.some(s => s.includes("household task"))).toBe(true);
    });
  });

  describe("narrative: concerns", () => {
    it("no concerns for perfect baseInput", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.concerns.length).toBe(0);
    });

    it("generates concern for missing assessments", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: [] }));
      expect(r.concerns.some(c => c.includes("independence assessment"))).toBe(true);
    });

    it("generates concern for missing cooking records", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: [] }));
      expect(r.concerns.some(c => c.includes("cooking"))).toBe(true);
    });

    it("generates concern for missing money records", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ money_records: [] }));
      expect(r.concerns.some(c => c.includes("money management"))).toBe(true);
    });

    it("generates concern for low completion", () => {
      const tasks = baseInput().household_tasks.map(t => ({
        ...t, completion_recent: 20,
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ household_tasks: tasks }));
      expect(r.concerns.some(c => c.includes("household task completion") || c.includes("completion"))).toBe(true);
    });

    it("generates concern for overdue assessments", () => {
      const assessments = baseInput().independence_assessments.map(a => ({
        ...a, next_assessment_due: "2025-01-01",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: assessments }));
      expect(r.concerns.some(c => c.includes("overdue"))).toBe(true);
    });
  });

  describe("narrative: recommendations", () => {
    it("no recommendations for perfect baseInput", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.recommendations.length).toBe(0);
    });

    it("generates recommendations with regulatory refs", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: [] }));
      const recsWithRef = r.recommendations.filter(rec => rec.regulatory_ref !== null);
      expect(recsWithRef.length).toBeGreaterThan(0);
      expect(recsWithRef[0].regulatory_ref).toBe("CHR 2015 Reg 12");
    });

    it("recommendations have sequential rank numbers", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [],
        cooking_records: [],
        money_records: [],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── ARIA Insights ─────────────────────────────────────────────────
  describe("ARIA insights", () => {
    it("flags high not_ready rate", () => {
      const assessments = baseInput().independence_assessments.map(a => ({
        ...a, overall_readiness: "not_ready",
      }));
      const r = computeHomeIndependenceLifeSkills(baseInput({ independence_assessments: assessments }));
      expect(r.insights.some(i => i.text.includes("not ready") && i.severity === "warning")).toBe(true);
    });

    it("positive insight for family meals and hygiene", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("family meals"))).toBe(true);
    });

    it("positive insight for diverse cuisines", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      // baseInput has 6 unique cuisines
      expect(r.insights.some(i => i.text.includes("cuisines"))).toBe(true);
    });

    it("positive insight for strong money management", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.insights.some(i => i.text.includes("money management") || i.text.includes("financial"))).toBe(true);
    });

    it("positive insight for household task ownership", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.insights.some(i => i.text.includes("household tasks") || i.text.includes("daily living"))).toBe(true);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────
  describe("headline", () => {
    it("outstanding headline", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.headline).toContain("comprehensive");
    });

    it("good headline", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({ cooking_records: [] }));
      expect(r.headline).toContain("Good");
    });

    it("inadequate headline", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY, independence_assessments: [], cooking_records: [],
        laundry_records: [], money_records: [], household_tasks: [],
        total_children: 5,
      });
      expect(r.headline).toContain("gaps");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single child home", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY,
        independence_assessments: [makeIA({ child_id: "c1" })],
        cooking_records: [makeCK({ child_id: "c1" })],
        laundry_records: [makeLY({ child_id: "c1" })],
        money_records: [makeMN({ child_id: "c1" })],
        household_tasks: [makeHT({ child_id: "c1" })],
        total_children: 1,
      });
      expect(r.independence_rating).not.toBe("insufficient_data");
      expect(r.assessments.child_coverage).toBe(100);
    });

    it("score never exceeds 100", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput());
      expect(r.independence_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      const r = computeHomeIndependenceLifeSkills({
        today: TODAY, independence_assessments: [], cooking_records: [],
        laundry_records: [], money_records: [], household_tasks: [],
        total_children: 10,
      });
      expect(r.independence_score).toBeGreaterThanOrEqual(0);
    });

    it("handles duplicate child_ids in same collection", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        cooking_records: [
          makeCK({ id: "ck1", child_id: "c1" }),
          makeCK({ id: "ck2", child_id: "c1" }),
        ],
      }));
      expect(r.cooking.child_coverage).toBe(20);
    });

    it("future review dates are not overdue", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        independence_assessments: [makeIA({ next_assessment_due: "2026-01-01" })],
      }));
      expect(r.assessments.overdue_assessments).toBe(0);
    });

    it("avg_completion rounds correctly", () => {
      const r = computeHomeIndependenceLifeSkills(baseInput({
        household_tasks: [
          makeHT({ id: "ht1", child_id: "c1", completion_recent: 75 }),
          makeHT({ id: "ht2", child_id: "c2", completion_recent: 76 }),
        ],
      }));
      // (75 + 76) / 2 = 75.5 → Math.round → 76
      expect(r.household.avg_completion).toBe(76);
    });
  });
});
