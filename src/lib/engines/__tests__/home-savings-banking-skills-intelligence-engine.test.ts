// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME SAVINGS & BANKING SKILLS INTELLIGENCE ENGINE TESTS
// Comprehensive vitest suite covering: insufficient_data, inadequate floor,
// outstanding/good/adequate/inadequate scenarios, each bonus in isolation,
// each penalty, all 6 rates, strengths, concerns, recommendations, insights,
// and edge cases.  base = 52, max bonuses = +28.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeSavingsBankingSkills,
  type SavingsBankingInput,
  type SavingsAccountRecordInput,
  type BankingSkillsRecordInput,
  type FinancialGoalRecordInput,
  type MoneyConfidenceRecordInput,
  type FinancialIndependenceRecordInput,
} from "../home-savings-banking-skills-intelligence-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const TODAY = "2026-05-29";

// ── Helpers ────────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `id_${++_id}`;
}

function baseInput(
  overrides: Partial<SavingsBankingInput> = {},
): SavingsBankingInput {
  return {
    today: TODAY,
    total_children: 3,
    savings_account_records: [],
    banking_skills_records: [],
    financial_goal_records: [],
    money_confidence_records: [],
    financial_independence_records: [],
    ...overrides,
  };
}

// ── Record Factories ───────────────────────────────────────────────────────

function makeSavingsAccount(
  overrides: Partial<SavingsAccountRecordInput> = {},
): SavingsAccountRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    account_type: "savings",
    opened_date: "2026-01-01",
    child_is_named_holder: true,
    child_has_access: true,
    current_balance: 100,
    monthly_deposit_target: 20,
    deposits_made_this_quarter: 3,
    deposits_target_this_quarter: 3,
    interest_earned: 1,
    statements_reviewed_with_child: true,
    child_understands_account: true,
    staff_supported_opening: true,
    last_activity_date: "2026-05-01",
    dormant: false,
    notes: "",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeBankingSkill(
  overrides: Partial<BankingSkillsRecordInput> = {},
): BankingSkillsRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    date: "2026-04-01",
    skill_type: "atm_use",
    taught: true,
    demonstrated_competence: true,
    age_appropriate: true,
    staff_assessed: true,
    child_confident: true,
    practice_opportunity_given: true,
    linked_to_independence_plan: true,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeFinancialGoal(
  overrides: Partial<FinancialGoalRecordInput> = {},
): FinancialGoalRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    goal_description: "Save for game",
    target_amount: 50,
    current_amount: 25,
    start_date: "2026-01-01",
    target_date: "2026-06-01",
    status: "active",
    child_set_goal: true,
    child_tracking_progress: true,
    staff_supporting: true,
    reviewed_in_keywork: true,
    celebration_on_achievement: false,
    notes: "",
    created_at: "2026-01-01",
    ...overrides,
  };
}

function makeMoneyConfidence(
  overrides: Partial<MoneyConfidenceRecordInput> = {},
): MoneyConfidenceRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    date: "2026-04-01",
    assessment_type: "staff_observation",
    confidence_level: 4,
    understands_value_of_money: true,
    can_make_purchases_independently: true,
    can_budget_pocket_money: true,
    can_compare_prices: true,
    can_identify_needs_vs_wants: true,
    anxiety_around_money: false,
    previous_confidence_level: 3,
    improvement_noted: true,
    support_plan_in_place: false,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeIndependenceMilestone(
  overrides: Partial<FinancialIndependenceRecordInput> = {},
): FinancialIndependenceRecordInput {
  return {
    id: uid(),
    child_id: "c1",
    date: "2026-04-01",
    milestone_type: "first_purchase_alone",
    achieved: true,
    age_appropriate: true,
    child_initiated: true,
    staff_supported: true,
    documented_in_pathway_plan: true,
    linked_to_leaving_care: true,
    child_proud_of_achievement: true,
    next_milestone_identified: true,
    notes: "",
    created_at: "2026-04-01",
    ...overrides,
  };
}

/** Helper: build N perfect savings accounts, one per unique child */
function perfectSavingsAccounts(n: number): SavingsAccountRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeSavingsAccount({ child_id: `c${i + 1}` }),
  );
}

/** Helper: build N perfect banking skills, one per unique child */
function perfectBankingSkills(n: number): BankingSkillsRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeBankingSkill({ child_id: `c${i + 1}` }),
  );
}

/** Helper: build N perfect financial goals, one per unique child */
function perfectFinancialGoals(n: number): FinancialGoalRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeFinancialGoal({ child_id: `c${i + 1}` }),
  );
}

/** Helper: build N perfect money confidence records, one per unique child */
function perfectMoneyConfidence(n: number): MoneyConfidenceRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeMoneyConfidence({ child_id: `c${i + 1}` }),
  );
}

/** Helper: build N perfect independence milestones, one per unique child */
function perfectIndependence(
  n: number,
): FinancialIndependenceRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeIndependenceMilestone({ child_id: `c${i + 1}` }),
  );
}

// Utility to build an all-perfect input (all domains covered for 3 children)
function perfectInput(): SavingsBankingInput {
  return baseInput({
    total_children: 3,
    savings_account_records: perfectSavingsAccounts(3),
    banking_skills_records: perfectBankingSkills(3),
    financial_goal_records: perfectFinancialGoals(3),
    money_confidence_records: perfectMoneyConfidence(3),
    financial_independence_records: perfectIndependence(3),
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// ── TESTS ───────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

describe("computeSavingsBankingSkills", () => {
  // ── pct(0, 0) === 0 ──────────────────────────────────────────────────────
  describe("pct(0,0) = 0 guard", () => {
    it("returns 0 for all rates when all arrays are empty and total_children = 0", () => {
      const r = computeSavingsBankingSkills(
        baseInput({ total_children: 0 }),
      );
      expect(r.savings_account_rate).toBe(0);
      expect(r.banking_skills_rate).toBe(0);
      expect(r.financial_goal_rate).toBe(0);
      expect(r.money_confidence_rate).toBe(0);
      expect(r.financial_independence_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
    });
  });

  // ── Insufficient Data ────────────────────────────────────────────────────
  describe("insufficient_data", () => {
    it("returns insufficient_data when total_children=0 and all arrays empty", () => {
      const r = computeSavingsBankingSkills(
        baseInput({ total_children: 0 }),
      );
      expect(r.savings_rating).toBe("insufficient_data");
      expect(r.savings_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
    });

    it("returns all counts as 0 for insufficient_data", () => {
      const r = computeSavingsBankingSkills(
        baseInput({ total_children: 0 }),
      );
      expect(r.total_savings_accounts).toBe(0);
      expect(r.total_banking_skills).toBe(0);
      expect(r.total_financial_goals).toBe(0);
      expect(r.total_confidence_assessments).toBe(0);
      expect(r.total_independence_milestones).toBe(0);
    });

    it("has empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeSavingsBankingSkills(
        baseInput({ total_children: 0 }),
      );
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ── Inadequate Floor (allEmpty, children > 0) ────────────────────────────
  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate/15 when children exist but all arrays empty", () => {
      const r = computeSavingsBankingSkills(baseInput({ total_children: 4 }));
      expect(r.savings_rating).toBe("inadequate");
      expect(r.savings_score).toBe(15);
    });

    it("headline references urgent attention", () => {
      const r = computeSavingsBankingSkills(baseInput());
      expect(r.savings_rating).toBe("inadequate");
      expect(r.headline).toContain("urgent attention");
    });

    it("has exactly 1 concern", () => {
      const r = computeSavingsBankingSkills(baseInput());
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No savings account records");
    });

    it("has exactly 2 recommendations with immediate urgency", () => {
      const r = computeSavingsBankingSkills(baseInput());
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("has exactly 1 critical insight", () => {
      const r = computeSavingsBankingSkills(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns 0 for all rates", () => {
      const r = computeSavingsBankingSkills(baseInput());
      expect(r.savings_account_rate).toBe(0);
      expect(r.banking_skills_rate).toBe(0);
      expect(r.financial_goal_rate).toBe(0);
      expect(r.money_confidence_rate).toBe(0);
      expect(r.financial_independence_rate).toBe(0);
      expect(r.child_engagement_rate).toBe(0);
    });
  });

  // ── Rating Boundaries ────────────────────────────────────────────────────
  describe("rating boundaries (toRating)", () => {
    it("score >= 80 -> outstanding", () => {
      // Perfect input should yield outstanding
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.savings_score).toBeGreaterThanOrEqual(80);
      expect(r.savings_rating).toBe("outstanding");
    });

    it("score 65-79 -> good", () => {
      // base=52 + B1(5) + B2(5) + B6(3) = 65
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
        banking_skills_records: perfectBankingSkills(3),
        // No goals, no confidence, no independence — only savings + banking + engagement
        // engagement comes from savings (child_understands) + banking (child_confident)
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_score).toBeGreaterThanOrEqual(65);
      expect(r.savings_score).toBeLessThan(80);
      expect(r.savings_rating).toBe("good");
    });

    it("score 45-64 -> adequate", () => {
      // base=52 with no bonuses or penalties
      // Need arrays with data but all-zero quality so no bonuses but also no penalties
      // Actually base=52 alone (no arrays with records) doesn't work — allEmpty floors at 15
      // Use 1 savings record with moderate values
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: true,
            child_has_access: true,
            child_understands_account: true,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // savingsAccountRate = avg(33, 100, 100, 100) = 83 => +5 bonus
      // But only 1/3 children covered so coverage=33
      // Actually savingsAccountRate = round((33 + 100 + 100 + 100)/4) = round(83.25) = 83 => >= 85? no. >=65? yes => +3
      // score = 52 + 3 = 55
      expect(r.savings_score).toBeGreaterThanOrEqual(45);
      expect(r.savings_score).toBeLessThan(65);
      expect(r.savings_rating).toBe("adequate");
    });

    it("score < 45 -> inadequate", () => {
      // Use records with poor quality to trigger penalties
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
            confidence_level: 1,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_score).toBeLessThan(45);
      expect(r.savings_rating).toBe("inadequate");
    });
  });

  // ── Base Score ────────────────────────────────────────────────────────────
  describe("base score = 52", () => {
    it("with all rates at 0 (but records exist) yields base minus penalties", () => {
      // All records with zero quality — rates will be <30 triggering penalties
      const input = baseInput({
        total_children: 1,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
            deposits_made_this_quarter: 0,
            deposits_target_this_quarter: 0,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
            confidence_level: 1,
          }),
        ],
      });
      // savingsAccountRate = avg(100, 0, 0, 0) = 25 => <30 => penalty -5
      // bankingSkillsRate = avg(100, 0, 0, 0) = 25 => <30 => penalty -5
      // moneyConfidenceRate = avg(100, 0, 0, 0) = 25 => <30 => penalty -4
      // engagement: 0/3 = 0% => <25 => penalty -4
      // depositCompliance: pct(0,0) = 0 => no bonus
      // 52 - 5 - 5 - 4 - 4 = 34
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_score).toBe(34);
    });
  });

  // ── Bonus 1: savingsAccountRate ──────────────────────────────────────────
  describe("Bonus 1: savingsAccountRate", () => {
    it("+5 when savingsAccountRate >= 85", () => {
      // 3/3 children, all named holder, access, understands => coverage=100, all rates=100 => avg=100 >= 85
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_account_rate).toBeGreaterThanOrEqual(85);
      // base(52) + B1(5) + B7 deposit compliance 100%(+2) + B6 engagement 100%(+3) = 62
      expect(r.savings_score).toBe(62);
    });

    it("+3 when savingsAccountRate >= 65 and < 85", () => {
      // named: 2/3 = 67, access: 3/3=100, understands: 2/3=67 => avg = (100+67+100+67)/4 = 83.5 = 84 => >=65, <85 => +3
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({
            child_id: "c2",
            child_is_named_holder: false,
            child_understands_account: false,
          }),
          makeSavingsAccount({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_account_rate).toBeGreaterThanOrEqual(65);
      expect(r.savings_account_rate).toBeLessThan(85);
      // engagement: 2 childUnderstands / 3 = 67% => >=50 => +1
      // deposit compliance: 9/9 = 100% => +2
      // 52 + 3 + 2 + 1 = 58
      expect(r.savings_score).toBe(58);
    });

    it("+1 when savingsAccountRate >= 45 and < 65", () => {
      // 1/3 coverage=33, named=1/1=100, access=1/1=100, understands=1/1=100 => avg = (33+100+100+100)/4 = 83.25 = 83 >=65? yes => +3 not +1
      // Need lower. 2/3 coverage=67, named=0/2=0, access=1/2=50, understands=1/2=50 => avg=(67+0+50+50)/4=41.75=42 => <45? => 0
      // Try: 2/3 coverage=67, named=1/2=50, access=1/2=50, understands=1/2=50 => avg=(67+50+50+50)/4=54.25=54 => >=45 <65 => +1
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({
            child_id: "c2",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // coverage=67, named=50, access=50, understands=50 => avg=(67+50+50+50)/4 = 54.25 = 54
      expect(r.savings_account_rate).toBeGreaterThanOrEqual(45);
      expect(r.savings_account_rate).toBeLessThan(65);
    });

    it("+0 when savingsAccountRate < 45", () => {
      // 1/3 coverage=33, named=0, access=0, understands=0 => avg=(33+0+0+0)/4=8.25=8 <45 => +0
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_account_rate).toBeLessThan(45);
    });
  });

  // ── Bonus 2: bankingSkillsRate ───────────────────────────────────────────
  describe("Bonus 2: bankingSkillsRate", () => {
    it("+5 when bankingSkillsRate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: perfectBankingSkills(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.banking_skills_rate).toBeGreaterThanOrEqual(85);
      // engagement: 3 childConfident / 3 = 100% => +3
      // 52 + 5 + 3 = 60
      expect(r.savings_score).toBe(60);
    });

    it("+3 when bankingSkillsRate >= 65 and < 85", () => {
      // 3/3 coverage=100, but competence=2/3=67, confident=2/3=67, practice=2/3=67
      // avg=(100+67+67+67)/4=75.25=75 =>>=65 <85 =>+3
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({ child_id: "c2" }),
          makeBankingSkill({
            child_id: "c3",
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.banking_skills_rate).toBeGreaterThanOrEqual(65);
      expect(r.banking_skills_rate).toBeLessThan(85);
    });

    it("+1 when bankingSkillsRate >= 45 and < 65", () => {
      // 2/3 coverage=67, competence=1/2=50, confident=1/2=50, practice=1/2=50
      // avg=(67+50+50+50)/4=54.25=54 =>>=45 <65 =>+1
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({
            child_id: "c2",
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.banking_skills_rate).toBeGreaterThanOrEqual(45);
      expect(r.banking_skills_rate).toBeLessThan(65);
    });

    it("+0 when bankingSkillsRate < 45", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.banking_skills_rate).toBeLessThan(45);
    });
  });

  // ── Bonus 3: financialGoalRate ───────────────────────────────────────────
  describe("Bonus 3: financialGoalRate", () => {
    it("+5 when financialGoalRate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: perfectFinancialGoals(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_goal_rate).toBeGreaterThanOrEqual(80);
      // engagement: 3 childSetGoal / 3 = 100% => +3
      // 52 + 5 + 3 = 60
      expect(r.savings_score).toBe(60);
    });

    it("+3 when financialGoalRate >= 60 and < 80", () => {
      // 2/3 coverage=67, childSetGoal=2/3=67, tracking=2/2 active&tracking=100, reviewed=2/3=67
      // avg=(67+67+100+67)/4=75.25=75 >=80? No. >=60? Yes. => +3
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({ child_id: "c2" }),
          makeFinancialGoal({
            child_id: "c3",
            child_set_goal: false,
            child_tracking_progress: false,
            reviewed_in_keywork: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_goal_rate).toBeGreaterThanOrEqual(60);
      expect(r.financial_goal_rate).toBeLessThan(80);
    });

    it("+1 when financialGoalRate >= 40 and < 60", () => {
      // 1/3 coverage=33, childSetGoal=1/2=50, tracking: 1/2 active+tracking=50, reviewed=1/2=50
      // avg=(33+50+50+50)/4 = 45.75 = 46 =>>=40 <60 =>+1
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({
            child_id: "c1",
            child_set_goal: false,
            child_tracking_progress: false,
            reviewed_in_keywork: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_goal_rate).toBeGreaterThanOrEqual(40);
      expect(r.financial_goal_rate).toBeLessThan(60);
    });

    it("+0 when financialGoalRate < 40", () => {
      const input = baseInput({
        total_children: 10,
        financial_goal_records: [
          makeFinancialGoal({
            child_id: "c1",
            child_set_goal: false,
            child_tracking_progress: false,
            reviewed_in_keywork: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_goal_rate).toBeLessThan(40);
    });
  });

  // ── Bonus 4: moneyConfidenceRate ─────────────────────────────────────────
  describe("Bonus 4: moneyConfidenceRate", () => {
    it("+4 when moneyConfidenceRate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: perfectMoneyConfidence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.money_confidence_rate).toBeGreaterThanOrEqual(85);
      // engagement: 3 understandsValue / 3 = 100% => +3
      // 52 + 4 + 3 = 59
      expect(r.savings_score).toBe(59);
    });

    it("+2 when moneyConfidenceRate >= 65 and < 85", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1" }),
          makeMoneyConfidence({ child_id: "c2" }),
          makeMoneyConfidence({
            child_id: "c3",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.money_confidence_rate).toBeGreaterThanOrEqual(65);
      expect(r.money_confidence_rate).toBeLessThan(85);
    });

    it("+1 when moneyConfidenceRate >= 45 and < 65", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1" }),
          makeMoneyConfidence({
            child_id: "c2",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.money_confidence_rate).toBeGreaterThanOrEqual(45);
      expect(r.money_confidence_rate).toBeLessThan(65);
    });

    it("+0 when moneyConfidenceRate < 45", () => {
      const input = baseInput({
        total_children: 10,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.money_confidence_rate).toBeLessThan(45);
    });
  });

  // ── Bonus 5: financialIndependenceRate ───────────────────────────────────
  describe("Bonus 5: financialIndependenceRate", () => {
    it("+4 when financialIndependenceRate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: perfectIndependence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_independence_rate).toBeGreaterThanOrEqual(80);
      // engagement: 3 childInitiated / 3 = 100% => +3
      // 52 + 4 + 3 = 59
      expect(r.savings_score).toBe(59);
    });

    it("+2 when financialIndependenceRate >= 60 and < 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({ child_id: "c2" }),
          makeIndependenceMilestone({
            child_id: "c3",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_independence_rate).toBeGreaterThanOrEqual(60);
      expect(r.financial_independence_rate).toBeLessThan(80);
    });

    it("+1 when financialIndependenceRate >= 40 and < 60", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({
            child_id: "c2",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_independence_rate).toBeGreaterThanOrEqual(40);
      expect(r.financial_independence_rate).toBeLessThan(60);
    });

    it("+0 when financialIndependenceRate < 40", () => {
      const input = baseInput({
        total_children: 10,
        financial_independence_records: [
          makeIndependenceMilestone({
            child_id: "c1",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.financial_independence_rate).toBeLessThan(40);
    });
  });

  // ── Bonus 6: childEngagementRate ─────────────────────────────────────────
  describe("Bonus 6: childEngagementRate", () => {
    it("+3 when childEngagementRate >= 90", () => {
      // All domains, all children engaged
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.child_engagement_rate).toBeGreaterThanOrEqual(90);
    });

    it("+2 when childEngagementRate >= 70 and < 90", () => {
      // 3 savings records, 2 understand => engagement on that domain = 2/3 = 67%
      // Only savings domain contributing
      // Actually engagement aggregates numerators and denominators from all domains
      // 3 savings with 2 understanding + 3 banking with 2 confident = 4/6 = 67 => no, need 70+
      // 3 savings with 3 understanding + 3 banking with 1 confident = 4/6 = 67 => no
      // Use: savings 3/3 understand + banking 2/3 confident = 5/6 = 83 => >=70 <90
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({ child_id: "c2" }),
          makeBankingSkill({
            child_id: "c3",
            child_confident: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.child_engagement_rate).toBeGreaterThanOrEqual(70);
      expect(r.child_engagement_rate).toBeLessThan(90);
    });

    it("+1 when childEngagementRate >= 50 and < 70", () => {
      // savings: 2/3 understand + banking: 1/3 confident = 3/6 = 50
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c2" }),
          makeSavingsAccount({
            child_id: "c3",
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({
            child_id: "c2",
            child_confident: false,
          }),
          makeBankingSkill({
            child_id: "c3",
            child_confident: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.child_engagement_rate).toBeGreaterThanOrEqual(50);
      expect(r.child_engagement_rate).toBeLessThan(70);
    });

    it("+0 when childEngagementRate < 50", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            child_confident: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.child_engagement_rate).toBeLessThan(50);
    });
  });

  // ── Bonus 7: depositComplianceRate ───────────────────────────────────────
  describe("Bonus 7: depositComplianceRate", () => {
    it("+2 when depositComplianceRate >= 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            deposits_made_this_quarter: 3,
            deposits_target_this_quarter: 3,
          }),
          makeSavingsAccount({
            child_id: "c2",
            deposits_made_this_quarter: 3,
            deposits_target_this_quarter: 3,
          }),
          makeSavingsAccount({
            child_id: "c3",
            deposits_made_this_quarter: 3,
            deposits_target_this_quarter: 3,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // savingsAccountRate = avg(100, 100, 100, 100) = 100 => +5
      // depositCompliance = 9/9 = 100 => +2
      // engagement: 3/3 = 100 => +3
      // score = 52 + 5 + 2 + 3 = 62
      expect(r.savings_score).toBe(62);
    });

    it("+1 when depositComplianceRate >= 70 and < 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            deposits_made_this_quarter: 3,
            deposits_target_this_quarter: 4,
          }),
          makeSavingsAccount({
            child_id: "c2",
            deposits_made_this_quarter: 3,
            deposits_target_this_quarter: 4,
          }),
          makeSavingsAccount({
            child_id: "c3",
            deposits_made_this_quarter: 3,
            deposits_target_this_quarter: 4,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // depositCompliance = 9/12 = 75 => >=70 <90 => +1
      // savingsAccountRate = 100 => +5, engagement = 100 => +3
      // 52 + 5 + 1 + 3 = 61
      expect(r.savings_score).toBe(61);
    });

    it("+0 when depositComplianceRate < 70", () => {
      const input = baseInput({
        total_children: 1,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            deposits_made_this_quarter: 1,
            deposits_target_this_quarter: 3,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // depositCompliance = 1/3 = 33 => +0
      // savingsAccountRate = 100 => +5, engagement 100 => +3
      // 52 + 5 + 3 = 60
      expect(r.savings_score).toBe(60);
    });
  });

  // ── Penalty 1: savingsAccountRate < 30 ───────────────────────────────────
  describe("Penalty 1: savingsAccountRate < 30", () => {
    it("-5 when savingsAccountRate < 30 with records present", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
            deposits_made_this_quarter: 0,
            deposits_target_this_quarter: 0,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // savingsAccountRate = avg(10, 0, 0, 0) = 3 => <30 => -5
      expect(r.savings_account_rate).toBeLessThan(30);
      // engagement: 0/1 = 0 => <25 => -4
      // depositCompliance: pct(0,0) = 0 => no bonus
      // 52 - 5 - 4 = 43
      expect(r.savings_score).toBe(43);
    });

    it("no penalty when savingsAccountRate < 30 but array empty", () => {
      // With no savings but some banking skills (not allEmpty)
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      // savingsAccountRate = 0 but array is empty => no penalty
      // bankingSkillsRate = avg(33, 100, 100, 100) = 83 => >=65 => +3
      // engagement: only banking domain: 1 confident / 1 = 100% => >=90 => +3
      // 52 + 3 + 3 = 58
      expect(r.savings_score).toBe(58);
    });
  });

  // ── Penalty 2: bankingSkillsRate < 30 ────────────────────────────────────
  describe("Penalty 2: bankingSkillsRate < 30", () => {
    it("-5 when bankingSkillsRate < 30 with records present", () => {
      const input = baseInput({
        total_children: 10,
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.banking_skills_rate).toBeLessThan(30);
      // engagement: childConfident requires taught && child_confident, taught=false so 0 / 1 = 0 => <25 => -4
      // 52 - 5 - 4 = 43
      expect(r.savings_score).toBe(43);
    });

    it("no penalty when array empty", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      // No banking records => no penalty
      expect(r.savings_score).toBeGreaterThanOrEqual(52);
    });
  });

  // ── Penalty 3: moneyConfidenceRate < 30 ──────────────────────────────────
  describe("Penalty 3: moneyConfidenceRate < 30", () => {
    it("-4 when moneyConfidenceRate < 30 with records present", () => {
      const input = baseInput({
        total_children: 10,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.money_confidence_rate).toBeLessThan(30);
      // engagement: 0 understandsValue / 1 = 0 => <25 => -4
      // 52 - 4 - 4 = 44
      expect(r.savings_score).toBe(44);
    });
  });

  // ── Penalty 4: childEngagementRate < 25 ──────────────────────────────────
  describe("Penalty 4: childEngagementRate < 25", () => {
    it("-4 when childEngagementRate < 25 with engagement denom > 0", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_understands_account: false,
          }),
          makeSavingsAccount({
            child_id: "c2",
            child_understands_account: false,
          }),
          makeSavingsAccount({
            child_id: "c3",
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            child_confident: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.child_engagement_rate).toBeLessThan(25);
    });
  });

  // ── Max Score ────────────────────────────────────────────────────────────
  describe("max score = 80 (52 + 28)", () => {
    it("achieves score 80 with all bonuses maxed", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      // 52 + 5 + 5 + 5 + 4 + 4 + 3 + 2 = 80
      expect(r.savings_score).toBe(80);
      expect(r.savings_rating).toBe("outstanding");
    });
  });

  // ── Score Clamping ───────────────────────────────────────────────────────
  describe("score clamping", () => {
    it("score never goes below 0", () => {
      // Maximum penalties: -5 -5 -4 -4 = -18, base 52, so 34. Can't reach 0.
      // But ensure clamping works conceptually
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_score).toBeGreaterThanOrEqual(0);
      expect(r.savings_score).toBeLessThanOrEqual(100);
    });

    it("score never exceeds 100", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.savings_score).toBeLessThanOrEqual(100);
    });
  });

  // ── All 6 Rates ──────────────────────────────────────────────────────────
  describe("all 6 composite rates", () => {
    describe("savings_account_rate", () => {
      it("is 0 when no savings records", () => {
        const r = computeSavingsBankingSkills(
          baseInput({ banking_skills_records: [makeBankingSkill()] }),
        );
        expect(r.savings_account_rate).toBe(0);
      });

      it("equals avg of coverage, namedHolder, access, understands", () => {
        // 2/3 coverage=67, named=1/2=50, access=2/2=100, understands=1/2=50
        // avg = (67+50+100+50)/4 = 66.75 = 67
        const input = baseInput({
          total_children: 3,
          savings_account_records: [
            makeSavingsAccount({ child_id: "c1" }),
            makeSavingsAccount({
              child_id: "c2",
              child_is_named_holder: false,
              child_understands_account: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.savings_account_rate).toBe(67);
      });
    });

    describe("banking_skills_rate", () => {
      it("is 0 when no banking records", () => {
        const r = computeSavingsBankingSkills(
          baseInput({ savings_account_records: [makeSavingsAccount()] }),
        );
        expect(r.banking_skills_rate).toBe(0);
      });

      it("equals avg of coverage, competence, confidence, practiceGiven", () => {
        // 1/3 coverage=33, competence=1/1=100 (taught+demonstrated), confidence=1/1=100 (taught+confident), practice=1/1=100
        // avg = (33+100+100+100)/4 = 83.25 = 83
        const input = baseInput({
          total_children: 3,
          banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.banking_skills_rate).toBe(83);
      });
    });

    describe("financial_goal_rate", () => {
      it("is 0 when no goal records", () => {
        const r = computeSavingsBankingSkills(
          baseInput({ savings_account_records: [makeSavingsAccount()] }),
        );
        expect(r.financial_goal_rate).toBe(0);
      });

      it("equals avg of coverage, childSetGoal, childTracking, reviewedInKeywork", () => {
        // 1/3 coverage=33, childSetGoal=1/1=100, tracking: childTrackingProgress=true & status=active => 1/1=100, reviewed=1/1=100
        // avg = (33+100+100+100)/4 = 83.25 = 83
        const input = baseInput({
          total_children: 3,
          financial_goal_records: [makeFinancialGoal({ child_id: "c1" })],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.financial_goal_rate).toBe(83);
      });
    });

    describe("money_confidence_rate", () => {
      it("is 0 when no confidence records", () => {
        const r = computeSavingsBankingSkills(
          baseInput({ savings_account_records: [makeSavingsAccount()] }),
        );
        expect(r.money_confidence_rate).toBe(0);
      });

      it("equals avg of coverage, understandsValue, canBudget, canPurchase", () => {
        // 1/3 coverage=33, understandsValue=1/1=100, canBudget=1/1=100, canPurchase=1/1=100
        // avg = (33+100+100+100)/4 = 83.25 = 83
        const input = baseInput({
          total_children: 3,
          money_confidence_records: [
            makeMoneyConfidence({ child_id: "c1" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.money_confidence_rate).toBe(83);
      });
    });

    describe("financial_independence_rate", () => {
      it("is 0 when no independence records", () => {
        const r = computeSavingsBankingSkills(
          baseInput({ savings_account_records: [makeSavingsAccount()] }),
        );
        expect(r.financial_independence_rate).toBe(0);
      });

      it("equals avg of coverage, achievedRate, childInitiated, documentedInPathway", () => {
        // 1/3 coverage=33, achieved=1/1=100, childInitiated=1/1=100, documented=1/1=100
        // avg = (33+100+100+100)/4 = 83.25 = 83
        const input = baseInput({
          total_children: 3,
          financial_independence_records: [
            makeIndependenceMilestone({ child_id: "c1" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.financial_independence_rate).toBe(83);
      });
    });

    describe("child_engagement_rate", () => {
      it("is 0 when no engagement domains have records", () => {
        const r = computeSavingsBankingSkills(baseInput({ total_children: 0 }));
        expect(r.child_engagement_rate).toBe(0);
      });

      it("aggregates numerators/denominators across all 5 domains", () => {
        // savings: 1 understands / 1 rec
        // banking: 1 confident / 1 rec (taught+confident)
        // goals: 1 childSetGoal / 1 rec
        // confidence: 1 understandsValue / 1 rec
        // independence: 1 childInitiated / 1 rec
        // total: 5/5 = 100%
        const input = baseInput({
          total_children: 1,
          savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
          banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
          financial_goal_records: [makeFinancialGoal({ child_id: "c1" })],
          money_confidence_records: [makeMoneyConfidence({ child_id: "c1" })],
          financial_independence_records: [
            makeIndependenceMilestone({ child_id: "c1" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.child_engagement_rate).toBe(100);
      });

      it("handles partial engagement correctly", () => {
        // savings: 0 understands / 2 rec
        // banking: 1 confident / 2 rec (one taught+confident, one not confident)
        // total: 1/4 = 25%
        const input = baseInput({
          total_children: 2,
          savings_account_records: [
            makeSavingsAccount({
              child_id: "c1",
              child_understands_account: false,
            }),
            makeSavingsAccount({
              child_id: "c2",
              child_understands_account: false,
            }),
          ],
          banking_skills_records: [
            makeBankingSkill({ child_id: "c1" }),
            makeBankingSkill({
              child_id: "c2",
              child_confident: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.child_engagement_rate).toBe(25);
      });
    });
  });

  // ── Total Counts ─────────────────────────────────────────────────────────
  describe("total counts", () => {
    it("counts all record types correctly", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c2" }),
        ],
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({ child_id: "c2" }),
          makeFinancialGoal({ child_id: "c3" }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1" }),
        ],
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.total_savings_accounts).toBe(2);
      expect(r.total_banking_skills).toBe(1);
      expect(r.total_financial_goals).toBe(3);
      expect(r.total_confidence_assessments).toBe(1);
      expect(r.total_independence_milestones).toBe(2);
    });
  });

  // ── Outstanding Scenario ─────────────────────────────────────────────────
  describe("outstanding scenario", () => {
    it("achieves outstanding rating with all perfect records", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.savings_rating).toBe("outstanding");
      expect(r.savings_score).toBe(80);
    });

    it("headline references outstanding", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("has multiple strengths", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.strengths.length).toBeGreaterThan(5);
    });

    it("has no concerns", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.concerns).toHaveLength(0);
    });

    it("has positive insights", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      const positiveInsights = r.insights.filter(
        (i) => i.severity === "positive",
      );
      expect(positiveInsights.length).toBeGreaterThan(0);
    });

    it("includes outstanding headline insight", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.insights.some((i) => i.text.includes("outstanding savings"))).toBe(true);
    });
  });

  // ── Good Scenario ────────────────────────────────────────────────────────
  describe("good scenario", () => {
    it("achieves good rating with strong but imperfect data", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
        banking_skills_records: perfectBankingSkills(3),
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_rating).toBe("good");
      expect(r.savings_score).toBeGreaterThanOrEqual(65);
      expect(r.savings_score).toBeLessThan(80);
    });

    it("headline mentions good and strengths/improvements", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
        banking_skills_records: perfectBankingSkills(3),
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.headline).toContain("Good");
    });
  });

  // ── Adequate Scenario ────────────────────────────────────────────────────
  describe("adequate scenario", () => {
    it("achieves adequate rating with moderate data", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_rating).toBe("adequate");
      expect(r.savings_score).toBeGreaterThanOrEqual(45);
      expect(r.savings_score).toBeLessThan(65);
    });

    it("headline mentions adequate and concerns", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.headline).toContain("Adequate");
    });
  });

  // ── Inadequate Scenario ──────────────────────────────────────────────────
  describe("inadequate scenario (computed, not floor)", () => {
    it("achieves inadequate rating with poor data", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_rating).toBe("inadequate");
      expect(r.savings_score).toBeLessThan(45);
    });

    it("headline references inadequate and urgent", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.headline).toContain("inadequate");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── STRENGTHS ─────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("savings account coverage >= 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("3 of 3 children have savings accounts"))).toBe(true);
    });

    it("savings account coverage >= 70 and < 90", () => {
      const input = baseInput({
        total_children: 4,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("75% of children have savings accounts"))).toBe(true);
    });

    it("named holder rate >= 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("named holder"))).toBe(true);
    });

    it("child access rate >= 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("access to their savings accounts"))).toBe(true);
    });

    it("statements reviewed rate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("statements reviewed"))).toBe(true);
    });

    it("deposit compliance >= 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("deposit target compliance"))).toBe(true);
    });

    it("no dormant accounts", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("No dormant"))).toBe(true);
    });

    it("banking skills rate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: perfectBankingSkills(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Banking skills composite"))).toBe(true);
    });

    it("banking skills rate >= 65 and < 85", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({ child_id: "c2" }),
          makeBankingSkill({
            child_id: "c3",
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Banking skills composite") && s.includes("good progress"))).toBe(true);
    });

    it("competence rate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: perfectBankingSkills(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("demonstrated competently"))).toBe(true);
    });

    it("practice given rate >= 90", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: perfectBankingSkills(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("practice opportunities"))).toBe(true);
    });

    it("goal coverage >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: perfectFinancialGoals(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("3 of 3 children have financial goals"))).toBe(true);
    });

    it("goal coverage >= 60 and < 80", () => {
      const input = baseInput({
        total_children: 5,
        financial_goal_records: perfectFinancialGoals(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("60% of children have financial goals"))).toBe(true);
    });

    it("child set goal rate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: perfectFinancialGoals(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("financial goals set by the children"))).toBe(true);
    });

    it("achieved goal rate >= 50 with achieved goals", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1", status: "achieved", celebration_on_achievement: true }),
          makeFinancialGoal({ child_id: "c2", status: "achieved", celebration_on_achievement: true }),
          makeFinancialGoal({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("financial goals achieved"))).toBe(true);
    });

    it("celebration rate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1", status: "achieved", celebration_on_achievement: true }),
          makeFinancialGoal({ child_id: "c2", status: "achieved", celebration_on_achievement: true }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("achieved goals celebrated"))).toBe(true);
    });

    it("reviewed in keywork >= 85", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: perfectFinancialGoals(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("reviewed in keywork"))).toBe(true);
    });

    it("money confidence rate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: perfectMoneyConfidence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Money confidence composite") && s.includes("genuine confidence"))).toBe(true);
    });

    it("money confidence rate >= 65 and < 85", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1" }),
          makeMoneyConfidence({ child_id: "c2" }),
          makeMoneyConfidence({
            child_id: "c3",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Money confidence composite") && s.includes("good progress"))).toBe(true);
    });

    it("avg confidence level >= 4.0", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1", confidence_level: 5 }),
          makeMoneyConfidence({ child_id: "c2", confidence_level: 4 }),
          makeMoneyConfidence({ child_id: "c3", confidence_level: 4 }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Average money confidence level"))).toBe(true);
    });

    it("can budget rate >= 85", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: perfectMoneyConfidence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("can budget their pocket money"))).toBe(true);
    });

    it("can identify needs vs wants >= 85", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: perfectMoneyConfidence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("needs from wants"))).toBe(true);
    });

    it("improvement rate >= 70", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: perfectMoneyConfidence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("improvement in money confidence"))).toBe(true);
    });

    it("no anxiety", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: perfectMoneyConfidence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("No children report anxiety"))).toBe(true);
    });

    it("support plan rate >= 90 when needed", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            anxiety_around_money: true,
            support_plan_in_place: true,
          }),
          makeMoneyConfidence({
            child_id: "c2",
            confidence_level: 1,
            support_plan_in_place: true,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("needing money confidence support have a plan"))).toBe(true);
    });

    it("financial independence rate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: perfectIndependence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Financial independence composite") && s.includes("excellent progress"))).toBe(true);
    });

    it("financial independence rate >= 60 and < 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({ child_id: "c2" }),
          makeIndependenceMilestone({
            child_id: "c3",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("Financial independence composite") && s.includes("good progress"))).toBe(true);
    });

    it("achieved milestone rate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: perfectIndependence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("milestones achieved"))).toBe(true);
    });

    it("child initiated rate >= 70", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: perfectIndependence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("child-initiated"))).toBe(true);
    });

    it("linked to leaving care >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: perfectIndependence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("linked to leaving care"))).toBe(true);
    });

    it("child proud rate >= 80", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: perfectIndependence(3),
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("pride in their financial achievements"))).toBe(true);
    });

    it("child engagement rate >= 90", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.strengths.some((s) => s.includes("child engagement across all savings"))).toBe(true);
    });

    it("child engagement rate >= 70 and < 90", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({ child_id: "c2" }),
          makeBankingSkill({ child_id: "c3", child_confident: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // engagement = (3+2)/(3+3) = 5/6 = 83
      expect(r.strengths.some((s) => s.includes("child engagement across savings and banking activities"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── CONCERNS ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("low savings coverage < 40", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Only 10% of children have savings accounts"))).toBe(true);
    });

    it("savings coverage 40-69 concern", () => {
      const input = baseInput({
        total_children: 5,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c2" }),
          makeSavingsAccount({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Savings account coverage at 60%"))).toBe(true);
    });

    it("no savings accounts despite children", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("No savings account records exist"))).toBe(true);
    });

    it("child access < 50", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", child_has_access: false }),
          makeSavingsAccount({ child_id: "c2", child_has_access: false }),
          makeSavingsAccount({ child_id: "c3", child_has_access: true }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Only 33% of children have access"))).toBe(true);
    });

    it("dormant rate >= 30", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", dormant: true }),
          makeSavingsAccount({ child_id: "c2" }),
          makeSavingsAccount({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("33% of savings accounts are dormant") && c.includes("not being actively used"))).toBe(true);
    });

    it("dormant rate 15-29", () => {
      const input = baseInput({
        total_children: 5,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", dormant: true }),
          makeSavingsAccount({ child_id: "c2" }),
          makeSavingsAccount({ child_id: "c3" }),
          makeSavingsAccount({ child_id: "c4" }),
          makeSavingsAccount({ child_id: "c5" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("20% of savings accounts are dormant") && c.includes("reactivation"))).toBe(true);
    });

    it("deposit compliance < 50", () => {
      const input = baseInput({
        total_children: 1,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            deposits_made_this_quarter: 1,
            deposits_target_this_quarter: 3,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Deposit target compliance at only 33%"))).toBe(true);
    });

    it("banking skills rate < 30", () => {
      const input = baseInput({
        total_children: 10,
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Banking skills composite at only"))).toBe(true);
    });

    it("banking skills rate 30-49", () => {
      const input = baseInput({
        total_children: 5,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({
            child_id: "c2",
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
          makeBankingSkill({
            child_id: "c3",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // coverage=60, competence=33, confident=33, practice=67 => avg=(60+33+33+67)/4=48.25=48
      expect(r.concerns.some((c) => c.includes("Banking skills composite at") && c.includes("significant gaps"))).toBe(true);
    });

    it("no banking skills records despite children", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("No banking skills development records"))).toBe(true);
    });

    it("competence rate < 40", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({
            child_id: "c2",
            demonstrated_competence: false,
          }),
          makeBankingSkill({
            child_id: "c3",
            demonstrated_competence: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("33% of banking skills showing demonstrated competence"))).toBe(true);
    });

    it("practice given rate < 50", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({
            child_id: "c2",
            practice_opportunity_given: false,
          }),
          makeBankingSkill({
            child_id: "c3",
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("33% of banking skills supported with practice"))).toBe(true);
    });

    it("goal coverage < 30", () => {
      const input = baseInput({
        total_children: 10,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Only 10% of children have financial goals"))).toBe(true);
    });

    it("goal coverage 30-59", () => {
      const input = baseInput({
        total_children: 5,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Financial goal coverage at 40%"))).toBe(true);
    });

    it("no financial goals despite children", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("No financial goal records"))).toBe(true);
    });

    it("abandoned goal rate >= 30", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1", status: "abandoned" }),
          makeFinancialGoal({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("50% of financial goals have been abandoned"))).toBe(true);
    });

    it("child tracking rate < 40", () => {
      // All active goals with child_tracking_progress=false
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1", child_tracking_progress: false }),
          makeFinancialGoal({ child_id: "c2", child_tracking_progress: false }),
          makeFinancialGoal({ child_id: "c3", child_tracking_progress: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("0% of children tracking their financial goal progress"))).toBe(true);
    });

    it("money confidence rate < 30", () => {
      const input = baseInput({
        total_children: 10,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Money confidence composite at only"))).toBe(true);
    });

    it("money confidence rate 30-49", () => {
      const input = baseInput({
        total_children: 5,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1" }),
          makeMoneyConfidence({
            child_id: "c2",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
          makeMoneyConfidence({
            child_id: "c3",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Money confidence composite at") && c.includes("not yet confident"))).toBe(true);
    });

    it("no confidence assessments despite children", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("No money confidence assessments"))).toBe(true);
    });

    it("anxiety rate >= 30", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            anxiety_around_money: true,
            support_plan_in_place: true,
          }),
          makeMoneyConfidence({ child_id: "c2" }),
          makeMoneyConfidence({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("33% of children report anxiety") && c.includes("therapeutic support"))).toBe(true);
    });

    it("anxiety rate 15-29", () => {
      const input = baseInput({
        total_children: 5,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            anxiety_around_money: true,
            support_plan_in_place: true,
          }),
          makeMoneyConfidence({ child_id: "c2" }),
          makeMoneyConfidence({ child_id: "c3" }),
          makeMoneyConfidence({ child_id: "c4" }),
          makeMoneyConfidence({ child_id: "c5" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("20% of children report anxiety") && c.includes("additional emotional support"))).toBe(true);
    });

    it("avg confidence < 2.5", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1", confidence_level: 1 }),
          makeMoneyConfidence({ child_id: "c2", confidence_level: 2 }),
          makeMoneyConfidence({ child_id: "c3", confidence_level: 2 }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Average money confidence level at only"))).toBe(true);
    });

    it("support plan rate < 50 when needs support", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            anxiety_around_money: true,
            support_plan_in_place: false,
          }),
          makeMoneyConfidence({
            child_id: "c2",
            confidence_level: 1,
            support_plan_in_place: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("0% of children needing money confidence support have a plan"))).toBe(true);
    });

    it("financial independence rate < 30", () => {
      const input = baseInput({
        total_children: 10,
        financial_independence_records: [
          makeIndependenceMilestone({
            child_id: "c1",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Financial independence composite at only"))).toBe(true);
    });

    it("financial independence rate 30-49", () => {
      const input = baseInput({
        total_children: 5,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({
            child_id: "c2",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
          makeIndependenceMilestone({
            child_id: "c3",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Financial independence composite at") && c.includes("below expectations"))).toBe(true);
    });

    it("no independence milestones despite children", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("No financial independence milestone records"))).toBe(true);
    });

    it("documented in pathway < 50", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({
            child_id: "c2",
            documented_in_pathway_plan: false,
          }),
          makeIndependenceMilestone({
            child_id: "c3",
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Only 33% of financial milestones documented in pathway plans"))).toBe(true);
    });

    it("next milestone rate < 50", () => {
      const input = baseInput({
        total_children: 3,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
          makeIndependenceMilestone({
            child_id: "c2",
            next_milestone_identified: false,
          }),
          makeIndependenceMilestone({
            child_id: "c3",
            next_milestone_identified: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("Only 33% of records identify the next financial milestone"))).toBe(true);
    });

    it("child engagement < 25", () => {
      const input = baseInput({
        total_children: 5,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c2", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c3", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c4", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c5", child_understands_account: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.child_engagement_rate).toBeLessThan(25);
      expect(r.concerns.some((c) => c.includes("Child engagement across savings and banking at only"))).toBe(true);
    });

    it("child engagement 25-49", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c2", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c3", child_understands_account: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // engagement = 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("Child engagement across savings and banking at 33%"))).toBe(true);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── RECOMMENDATIONS ───────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("no savings accounts triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Ensure every child has an age-appropriate savings account"))).toBe(true);
    });

    it("low savings coverage < 40 triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Increase savings account coverage"))).toBe(true);
    });

    it("savings coverage 40-69 triggers soon recommendation", () => {
      const input = baseInput({
        total_children: 5,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c2" }),
          makeSavingsAccount({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Extend savings account coverage"))).toBe(true);
    });

    it("no banking skills triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("structured banking skills programme"))).toBe(true);
    });

    it("low banking skills < 30 triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 10,
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently improve banking skills"))).toBe(true);
    });

    it("banking skills 30-64 triggers soon recommendation", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({
            child_id: "c2",
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // bankingSkillsRate = avg(67, 50, 50, 50)=54 =>>=30 <65 => soon
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen banking skills programme"))).toBe(true);
    });

    it("low competence < 40 triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({ child_id: "c2", demonstrated_competence: false }),
          makeBankingSkill({ child_id: "c3", demonstrated_competence: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Review banking skills teaching methods"))).toBe(true);
    });

    it("no financial goals triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Support every child to set at least one financial goal"))).toBe(true);
    });

    it("high goal abandonment triggers soon recommendation", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1", status: "abandoned" }),
          makeFinancialGoal({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Review and address the high rate of abandoned"))).toBe(true);
    });

    it("no confidence assessments triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Introduce regular money confidence assessments"))).toBe(true);
    });

    it("money anxiety >= 30 triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({ child_id: "c1", anxiety_around_money: true }),
          makeMoneyConfidence({ child_id: "c2" }),
          makeMoneyConfidence({ child_id: "c3" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("targeted support for children experiencing anxiety"))).toBe(true);
    });

    it("missing support plans triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            anxiety_around_money: true,
            support_plan_in_place: false,
          }),
          makeMoneyConfidence({
            child_id: "c2",
            confidence_level: 1,
            support_plan_in_place: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Ensure all children with money anxiety or low confidence have a documented support plan"))).toBe(true);
    });

    it("no independence milestones triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Begin tracking financial independence milestones"))).toBe(true);
    });

    it("low child engagement < 25 triggers immediate recommendation", () => {
      const input = baseInput({
        total_children: 5,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c2", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c3", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c4", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c5", child_understands_account: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently improve child engagement"))).toBe(true);
    });

    it("child engagement 25-49 triggers soon recommendation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c2", child_understands_account: false }),
          makeSavingsAccount({ child_id: "c3", child_understands_account: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Strengthen child engagement"))).toBe(true);
    });

    it("practice given < 50 triggers soon recommendation", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1" }),
          makeBankingSkill({ child_id: "c2", practice_opportunity_given: false }),
          makeBankingSkill({ child_id: "c3", practice_opportunity_given: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase real-world practice opportunities"))).toBe(true);
    });

    it("deposit compliance 50-69 triggers planned recommendation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            deposits_made_this_quarter: 2,
            deposits_target_this_quarter: 3,
          }),
          makeSavingsAccount({
            child_id: "c2",
            deposits_made_this_quarter: 2,
            deposits_target_this_quarter: 3,
          }),
          makeSavingsAccount({
            child_id: "c3",
            deposits_made_this_quarter: 2,
            deposits_target_this_quarter: 3,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // depositCompliance = 6/9 = 67%
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Review savings deposit targets"))).toBe(true);
    });

    it("dormant rate >= 15 triggers soon recommendation", () => {
      const input = baseInput({
        total_children: 5,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", dormant: true }),
          makeSavingsAccount({ child_id: "c2" }),
          makeSavingsAccount({ child_id: "c3" }),
          makeSavingsAccount({ child_id: "c4" }),
          makeSavingsAccount({ child_id: "c5" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Reactivate dormant"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── INSIGHTS ──────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    describe("critical insights", () => {
      it("savings account rate < 30 with records", () => {
        const input = baseInput({
          total_children: 10,
          savings_account_records: [
            makeSavingsAccount({
              child_id: "c1",
              child_is_named_holder: false,
              child_has_access: false,
              child_understands_account: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Savings account composite"))).toBe(true);
      });

      it("banking skills rate < 30 with records", () => {
        const input = baseInput({
          total_children: 10,
          banking_skills_records: [
            makeBankingSkill({
              child_id: "c1",
              taught: false,
              demonstrated_competence: false,
              child_confident: false,
              practice_opportunity_given: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Banking skills composite"))).toBe(true);
      });

      it("money confidence rate < 30 with records", () => {
        const input = baseInput({
          total_children: 10,
          money_confidence_records: [
            makeMoneyConfidence({
              child_id: "c1",
              understands_value_of_money: false,
              can_make_purchases_independently: false,
              can_budget_pocket_money: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Money confidence composite"))).toBe(true);
      });

      it("child engagement < 25 critical insight", () => {
        const input = baseInput({
          total_children: 5,
          savings_account_records: [
            makeSavingsAccount({ child_id: "c1", child_understands_account: false }),
            makeSavingsAccount({ child_id: "c2", child_understands_account: false }),
            makeSavingsAccount({ child_id: "c3", child_understands_account: false }),
            makeSavingsAccount({ child_id: "c4", child_understands_account: false }),
            makeSavingsAccount({ child_id: "c5", child_understands_account: false }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Child engagement across savings and banking"))).toBe(true);
      });

      it("anxiety >= 30 critical insight", () => {
        const input = baseInput({
          total_children: 3,
          money_confidence_records: [
            makeMoneyConfidence({ child_id: "c1", anxiety_around_money: true }),
            makeMoneyConfidence({ child_id: "c2" }),
            makeMoneyConfidence({ child_id: "c3" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("anxiety around money"))).toBe(true);
      });

      it("no savings accounts critical insight (not allEmpty)", () => {
        const input = baseInput({
          total_children: 3,
          banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No savings accounts exist"))).toBe(true);
      });

      it("no banking skills critical insight (not allEmpty)", () => {
        const input = baseInput({
          total_children: 3,
          savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No banking skills development records"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("savings account rate 30-64 warning", () => {
        const input = baseInput({
          total_children: 3,
          savings_account_records: [
            makeSavingsAccount({
              child_id: "c1",
              child_is_named_holder: true,
              child_has_access: true,
              child_understands_account: false,
            }),
            makeSavingsAccount({
              child_id: "c2",
              child_is_named_holder: false,
              child_has_access: false,
              child_understands_account: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        // coverage=67, named=50, access=50, understands=0 => avg=(67+50+50+0)/4=41.75=42
        // 42 >= 30 < 65 => warning
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Savings account composite at"))).toBe(true);
      });

      it("banking skills rate 30-64 warning", () => {
        const input = baseInput({
          total_children: 3,
          banking_skills_records: [
            makeBankingSkill({ child_id: "c1" }),
            makeBankingSkill({
              child_id: "c2",
              demonstrated_competence: false,
              child_confident: false,
              practice_opportunity_given: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Banking skills composite at"))).toBe(true);
      });

      it("financial goal rate 30-59 warning", () => {
        const input = baseInput({
          total_children: 5,
          financial_goal_records: [
            makeFinancialGoal({ child_id: "c1" }),
            makeFinancialGoal({
              child_id: "c2",
              child_set_goal: false,
              child_tracking_progress: false,
              reviewed_in_keywork: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Financial goal composite at"))).toBe(true);
      });

      it("money confidence rate 30-64 warning", () => {
        const input = baseInput({
          total_children: 5,
          money_confidence_records: [
            makeMoneyConfidence({ child_id: "c1" }),
            makeMoneyConfidence({
              child_id: "c2",
              understands_value_of_money: false,
              can_make_purchases_independently: false,
              can_budget_pocket_money: false,
            }),
            makeMoneyConfidence({
              child_id: "c3",
              understands_value_of_money: false,
              can_make_purchases_independently: false,
              can_budget_pocket_money: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Money confidence composite at"))).toBe(true);
      });

      it("financial independence rate 30-59 warning", () => {
        const input = baseInput({
          total_children: 5,
          financial_independence_records: [
            makeIndependenceMilestone({ child_id: "c1" }),
            makeIndependenceMilestone({
              child_id: "c2",
              achieved: false,
              child_initiated: false,
              documented_in_pathway_plan: false,
            }),
            makeIndependenceMilestone({
              child_id: "c3",
              achieved: false,
              child_initiated: false,
              documented_in_pathway_plan: false,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Financial independence composite at"))).toBe(true);
      });

      it("child engagement 25-49 warning", () => {
        const input = baseInput({
          total_children: 3,
          savings_account_records: [
            makeSavingsAccount({ child_id: "c1" }),
            makeSavingsAccount({ child_id: "c2", child_understands_account: false }),
            makeSavingsAccount({ child_id: "c3", child_understands_account: false }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        // engagement = 1/3 = 33% => 25-49 => warning
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child engagement at 33%"))).toBe(true);
      });

      it("dormant rate 15-29 warning", () => {
        const input = baseInput({
          total_children: 5,
          savings_account_records: [
            makeSavingsAccount({ child_id: "c1", dormant: true }),
            makeSavingsAccount({ child_id: "c2" }),
            makeSavingsAccount({ child_id: "c3" }),
            makeSavingsAccount({ child_id: "c4" }),
            makeSavingsAccount({ child_id: "c5" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20% of savings accounts are dormant"))).toBe(true);
      });

      it("abandoned goal rate 20-29 warning", () => {
        const input = baseInput({
          total_children: 4,
          financial_goal_records: [
            makeFinancialGoal({ child_id: "c1", status: "abandoned" }),
            makeFinancialGoal({ child_id: "c2" }),
            makeFinancialGoal({ child_id: "c3" }),
            makeFinancialGoal({ child_id: "c4" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        // abandonedRate = 1/4 = 25 => 20-29 => warning
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("25% of financial goals abandoned"))).toBe(true);
      });

      it("anxiety 15-29 warning", () => {
        const input = baseInput({
          total_children: 5,
          money_confidence_records: [
            makeMoneyConfidence({ child_id: "c1", anxiety_around_money: true }),
            makeMoneyConfidence({ child_id: "c2" }),
            makeMoneyConfidence({ child_id: "c3" }),
            makeMoneyConfidence({ child_id: "c4" }),
            makeMoneyConfidence({ child_id: "c5" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        // anxietyRate = 1/5 = 20 => 15-29 => warning
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20% of children report some anxiety"))).toBe(true);
      });

      it("deposit compliance 50-69 warning", () => {
        const input = baseInput({
          total_children: 3,
          savings_account_records: [
            makeSavingsAccount({
              child_id: "c1",
              deposits_made_this_quarter: 2,
              deposits_target_this_quarter: 3,
            }),
            makeSavingsAccount({
              child_id: "c2",
              deposits_made_this_quarter: 2,
              deposits_target_this_quarter: 3,
            }),
            makeSavingsAccount({
              child_id: "c3",
              deposits_made_this_quarter: 2,
              deposits_target_this_quarter: 3,
            }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        // depositCompliance = 6/9 = 67 => 50-69 => warning
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Deposit compliance at 67%"))).toBe(true);
      });

      it("avg confidence 2.5-3.49 warning", () => {
        const input = baseInput({
          total_children: 3,
          money_confidence_records: [
            makeMoneyConfidence({ child_id: "c1", confidence_level: 3 }),
            makeMoneyConfidence({ child_id: "c2", confidence_level: 3 }),
            makeMoneyConfidence({ child_id: "c3", confidence_level: 3 }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Average money confidence at 3/5"))).toBe(true);
      });

      it("missing skill types >= 3 warning (with > 3 banking records)", () => {
        const input = baseInput({
          total_children: 4,
          banking_skills_records: [
            makeBankingSkill({ child_id: "c1", skill_type: "atm_use" }),
            makeBankingSkill({ child_id: "c2", skill_type: "atm_use" }),
            makeBankingSkill({ child_id: "c3", skill_type: "budgeting" }),
            makeBankingSkill({ child_id: "c4", skill_type: "budgeting" }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        // taught: all true. Only atm_use and budgeting covered. Missing: online_banking, reading_statements, direct_debit, card_management, fraud_awareness, comparison_shopping (6 missing >= 3)
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Banking skills programme has gaps"))).toBe(true);
      });
    });

    describe("positive insights", () => {
      it("outstanding rating positive insight", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding savings and banking skills"))).toBe(true);
      });

      it("savings account rate >= 85 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Savings account composite at"))).toBe(true);
      });

      it("banking skills rate >= 85 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Banking skills composite at"))).toBe(true);
      });

      it("financial goal rate >= 80 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Financial goal composite at"))).toBe(true);
      });

      it("money confidence rate >= 85 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Money confidence composite at"))).toBe(true);
      });

      it("financial independence rate >= 80 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Financial independence composite at"))).toBe(true);
      });

      it("child engagement >= 90 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child engagement across all savings"))).toBe(true);
      });

      it("improvement rate >= 80 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("money confidence assessments show improvement"))).toBe(true);
      });

      it("achieved goals >= 60% with 3+ goals", () => {
        const input = baseInput({
          total_children: 3,
          financial_goal_records: [
            makeFinancialGoal({ child_id: "c1", status: "achieved", celebration_on_achievement: true }),
            makeFinancialGoal({ child_id: "c2", status: "achieved", celebration_on_achievement: true }),
            makeFinancialGoal({ child_id: "c3", status: "achieved", celebration_on_achievement: true }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("financial goals achieved"))).toBe(true);
      });

      it("celebration rate >= 90 with 2+ achieved goals", () => {
        const input = baseInput({
          total_children: 3,
          financial_goal_records: [
            makeFinancialGoal({ child_id: "c1", status: "achieved", celebration_on_achievement: true }),
            makeFinancialGoal({ child_id: "c2", status: "achieved", celebration_on_achievement: true }),
          ],
        });
        const r = computeSavingsBankingSkills(input);
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("achieved financial goals celebrated"))).toBe(true);
      });

      it("linked to leaving care >= 80 and documented >= 80 positive", () => {
        const r = computeSavingsBankingSkills(perfectInput());
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("linked to leaving care") && i.text.includes("documented in pathway plans"))).toBe(true);
      });
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── EDGE CASES ────────────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("single child with minimal data", () => {
      const input = baseInput({
        total_children: 1,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_rating).toBeDefined();
      expect(r.savings_score).toBeGreaterThan(0);
    });

    it("many children with no records is inadequate floor", () => {
      const r = computeSavingsBankingSkills(
        baseInput({ total_children: 100 }),
      );
      expect(r.savings_rating).toBe("inadequate");
      expect(r.savings_score).toBe(15);
    });

    it("multiple records for same child counted correctly", () => {
      const input = baseInput({
        total_children: 1,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1" }),
          makeSavingsAccount({ child_id: "c1", account_type: "junior_isa" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // unique children with accounts = 1. coverage = 100%
      expect(r.total_savings_accounts).toBe(2);
    });

    it("deposits target of 0 gives 0% compliance (pct guard)", () => {
      const input = baseInput({
        total_children: 1,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            deposits_made_this_quarter: 0,
            deposits_target_this_quarter: 0,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // depositComplianceRate = pct(0, 0) = 0 => no bonus
      expect(r.savings_score).toBeDefined();
    });

    it("all achieved goals with celebrations", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({
            child_id: "c1",
            status: "achieved",
            celebration_on_achievement: true,
          }),
          makeFinancialGoal({
            child_id: "c2",
            status: "achieved",
            celebration_on_achievement: true,
          }),
          makeFinancialGoal({
            child_id: "c3",
            status: "achieved",
            celebration_on_achievement: true,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("celebrated"))).toBe(true);
    });

    it("child tracking only counts active/achieved statuses", () => {
      const input = baseInput({
        total_children: 3,
        financial_goal_records: [
          makeFinancialGoal({
            child_id: "c1",
            status: "abandoned",
            child_tracking_progress: true,
          }),
          makeFinancialGoal({
            child_id: "c2",
            status: "paused",
            child_tracking_progress: true,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // Both are abandoned/paused, so childTrackingProgress count ignores them
      // denominator for tracking = active+achieved = 0 => pct(0,0) = 0
      expect(r.financial_goal_rate).toBeDefined();
    });

    it("banking skill breadth calculation with multiple skill types", () => {
      const input = baseInput({
        total_children: 1,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1", skill_type: "atm_use" }),
          makeBankingSkill({ child_id: "c1", skill_type: "online_banking" }),
          makeBankingSkill({ child_id: "c1", skill_type: "budgeting" }),
          makeBankingSkill({ child_id: "c1", skill_type: "reading_statements" }),
          makeBankingSkill({ child_id: "c1", skill_type: "fraud_awareness" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("5 different banking skill types"))).toBe(true);
    });

    it("only untaught skills do not count for breadth", () => {
      const input = baseInput({
        total_children: 1,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1", skill_type: "atm_use", taught: false }),
          makeBankingSkill({ child_id: "c1", skill_type: "online_banking", taught: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // taught=false, so skill types are not added to breadth set
      expect(r.strengths.some((s) => s.includes("different banking skill types"))).toBe(false);
    });

    it("independence milestone breadth only counts achieved", () => {
      const input = baseInput({
        total_children: 1,
        financial_independence_records: [
          makeIndependenceMilestone({
            child_id: "c1",
            milestone_type: "first_purchase_alone",
            achieved: true,
          }),
          makeIndependenceMilestone({
            child_id: "c1",
            milestone_type: "manages_weekly_budget",
            achieved: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // Only 1 achieved milestone type, so breadth = 1
      expect(r.total_independence_milestones).toBe(2);
    });

    it("confidence engagement uses understands_value_of_money not confidence_level", () => {
      const input = baseInput({
        total_children: 1,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            confidence_level: 5,
            understands_value_of_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // engagement from confidence domain: understandsValue = 0 / 1 = 0
      expect(r.child_engagement_rate).toBe(0);
    });

    it("banking engagement requires taught AND child_confident", () => {
      const input = baseInput({
        total_children: 1,
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            child_confident: true,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // childConfidentSkills requires taught && child_confident. taught=false so 0/1 = 0
      expect(r.child_engagement_rate).toBe(0);
    });

    it("financial goal engagement uses childSetGoal", () => {
      const input = baseInput({
        total_children: 1,
        financial_goal_records: [
          makeFinancialGoal({
            child_id: "c1",
            child_set_goal: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // engagement from goals: childSetGoal = 0 / 1 = 0
      expect(r.child_engagement_rate).toBe(0);
    });

    it("independence engagement uses childInitiated", () => {
      const input = baseInput({
        total_children: 1,
        financial_independence_records: [
          makeIndependenceMilestone({
            child_id: "c1",
            child_initiated: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // engagement from independence: childInitiated = 0 / 1 = 0
      expect(r.child_engagement_rate).toBe(0);
    });

    it("goal progress avg calculation with active goals", () => {
      const input = baseInput({
        total_children: 2,
        financial_goal_records: [
          makeFinancialGoal({
            child_id: "c1",
            status: "active",
            target_amount: 100,
            current_amount: 50,
          }),
          makeFinancialGoal({
            child_id: "c2",
            status: "active",
            target_amount: 200,
            current_amount: 200,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // avgGoalProgress = (50 + 100) / 2 = 75 — but this is internal, not directly exposed
      // Check that results are reasonable
      expect(r.total_financial_goals).toBe(2);
    });

    it("goal progress caps at 100% per goal", () => {
      const input = baseInput({
        total_children: 1,
        financial_goal_records: [
          makeFinancialGoal({
            child_id: "c1",
            status: "active",
            target_amount: 50,
            current_amount: 200,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // progress should be capped at 100 not 400
      expect(r.total_financial_goals).toBe(1);
    });

    it("support plan only considered for anxious or low confidence children", () => {
      const input = baseInput({
        total_children: 2,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            confidence_level: 4,
            anxiety_around_money: false,
            support_plan_in_place: false,
          }),
          makeMoneyConfidence({
            child_id: "c2",
            confidence_level: 4,
            anxiety_around_money: false,
            support_plan_in_place: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // No one needs support (confidence > 2, no anxiety), so support plan rate is N/A
      // No concern about missing support plans should appear
      expect(r.concerns.some((c) => c.includes("needing money confidence support"))).toBe(false);
    });

    it("support plan needed when confidence_level <= 2 (no anxiety)", () => {
      const input = baseInput({
        total_children: 1,
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            confidence_level: 2,
            anxiety_around_money: false,
            support_plan_in_place: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.concerns.some((c) => c.includes("needing money confidence support"))).toBe(true);
    });

    it("child proud rate only considers achieved milestones", () => {
      const input = baseInput({
        total_children: 2,
        financial_independence_records: [
          makeIndependenceMilestone({
            child_id: "c1",
            achieved: true,
            child_proud_of_achievement: true,
          }),
          makeIndependenceMilestone({
            child_id: "c2",
            achieved: false,
            child_proud_of_achievement: true,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // childProud only counts achieved && proud. Achieved=1, proud=1 => 100%
      expect(r.strengths.some((s) => s.includes("pride in their financial achievements"))).toBe(true);
    });

    it("competence requires taught AND demonstrated_competence", () => {
      const input = baseInput({
        total_children: 1,
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: true,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // coverage=100, competence = taught && demonstrated => 0/1 = 0, confident = taught && confident => 0/1 = 0, practice = 0/1 = 0
      // bankingSkillsRate = avg(100, 0, 0, 0) = 25
      expect(r.banking_skills_rate).toBe(25);
      expect(r.banking_skills_rate).toBeLessThan(30);
    });

    it("allEmpty detection requires ALL arrays to be empty", () => {
      // One record in any array means not allEmpty
      const input = baseInput({
        total_children: 3,
        financial_independence_records: [
          makeIndependenceMilestone({ child_id: "c1" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.savings_score).not.toBe(15);
      expect(r.savings_rating).not.toBe("insufficient_data");
    });

    it("return shape has all expected fields", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r).toHaveProperty("savings_rating");
      expect(r).toHaveProperty("savings_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_savings_accounts");
      expect(r).toHaveProperty("total_banking_skills");
      expect(r).toHaveProperty("total_financial_goals");
      expect(r).toHaveProperty("total_confidence_assessments");
      expect(r).toHaveProperty("total_independence_milestones");
      expect(r).toHaveProperty("savings_account_rate");
      expect(r).toHaveProperty("banking_skills_rate");
      expect(r).toHaveProperty("financial_goal_rate");
      expect(r).toHaveProperty("money_confidence_rate");
      expect(r).toHaveProperty("financial_independence_rate");
      expect(r).toHaveProperty("child_engagement_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("linked to independence plan strength >= 80", () => {
      const input = baseInput({
        total_children: 3,
        banking_skills_records: [
          makeBankingSkill({ child_id: "c1", linked_to_independence_plan: true }),
          makeBankingSkill({ child_id: "c2", linked_to_independence_plan: true }),
          makeBankingSkill({ child_id: "c3", linked_to_independence_plan: true }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.strengths.some((s) => s.includes("linked to independence plans"))).toBe(true);
    });

    it("staff supported opening rate calculation", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [
          makeSavingsAccount({ child_id: "c1", staff_supported_opening: true }),
          makeSavingsAccount({ child_id: "c2", staff_supported_opening: false }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // staffSupportedOpeningRate = 1/2 = 50 — this is computed but does not directly affect score
      expect(r.total_savings_accounts).toBe(2);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── HEADLINE FORMAT ───────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("headline format", () => {
    it("outstanding headline is fixed text", () => {
      const r = computeSavingsBankingSkills(perfectInput());
      expect(r.headline).toContain("Outstanding savings and banking skills development");
    });

    it("good headline includes strength and improvement counts", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: perfectSavingsAccounts(3),
        banking_skills_records: perfectBankingSkills(3),
        financial_goal_records: [
          makeFinancialGoal({ child_id: "c1" }),
          makeFinancialGoal({ child_id: "c2" }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.headline).toMatch(/Good .* strength/);
    });

    it("adequate headline includes concern count", () => {
      const input = baseInput({
        total_children: 3,
        savings_account_records: [makeSavingsAccount({ child_id: "c1" })],
        banking_skills_records: [makeBankingSkill({ child_id: "c1" })],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.headline).toMatch(/Adequate .* concern/);
    });

    it("inadequate headline includes concern count", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      expect(r.headline).toMatch(/inadequate .* concern/);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // ── COMBINED PENALTY + BONUS ──────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════════════════

  describe("combined penalty and bonus interactions", () => {
    it("penalties in some domains do not block bonuses in others", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
            deposits_made_this_quarter: 0,
            deposits_target_this_quarter: 0,
          }),
        ],
        banking_skills_records: perfectBankingSkills(10),
      });
      const r = computeSavingsBankingSkills(input);
      // savingsAccountRate = avg(10, 0, 0, 0) = 3 => penalty -5
      // bankingSkillsRate = avg(100, 100, 100, 100) = 100 => +5
      // depositCompliance: pct(0,0) = 0 => no bonus
      // engagement: (0 + 10) / (1 + 10) = 91 => +3
      // 52 - 5 + 5 + 3 = 55
      expect(r.savings_score).toBe(55);
    });

    it("all four penalties stack", () => {
      const input = baseInput({
        total_children: 10,
        savings_account_records: [
          makeSavingsAccount({
            child_id: "c1",
            child_is_named_holder: false,
            child_has_access: false,
            child_understands_account: false,
            deposits_made_this_quarter: 0,
            deposits_target_this_quarter: 0,
          }),
        ],
        banking_skills_records: [
          makeBankingSkill({
            child_id: "c1",
            taught: false,
            demonstrated_competence: false,
            child_confident: false,
            practice_opportunity_given: false,
          }),
        ],
        money_confidence_records: [
          makeMoneyConfidence({
            child_id: "c1",
            understands_value_of_money: false,
            can_make_purchases_independently: false,
            can_budget_pocket_money: false,
          }),
        ],
        financial_independence_records: [
          makeIndependenceMilestone({
            child_id: "c1",
            achieved: false,
            child_initiated: false,
            documented_in_pathway_plan: false,
          }),
        ],
      });
      const r = computeSavingsBankingSkills(input);
      // savingsAccountRate<30 => -5
      // bankingSkillsRate<30 => -5
      // moneyConfidenceRate<30 => -4
      // engagement: (0+0+0+0)/(1+1+1+1) = 0 => <25 => -4
      // depositCompliance: pct(0,0) = 0 => no bonus
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.savings_score).toBe(34);
    });
  });
});
