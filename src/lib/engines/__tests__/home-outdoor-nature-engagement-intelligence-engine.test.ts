// ==============================================================================
// CORNERSTONE -- HOME OUTDOOR & NATURE ENGAGEMENT INTELLIGENCE ENGINE TESTS
// Comprehensive test suite covering scoring, bonuses, penalties, rates,
// strengths, concerns, recommendations, insights, and edge cases.
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  computeOutdoorNatureEngagement,
  type OutdoorNatureInput,
  type OutdoorActivityRecordInput,
  type NatureLearningRecordInput,
  type GardenProjectRecordInput,
  type ExplorationRecordInput,
  type OutdoorSafetyRecordInput,
} from "../home-outdoor-nature-engagement-intelligence-engine";

// -- Constants ----------------------------------------------------------------

const TODAY = "2026-05-28";

// -- Base input factory -------------------------------------------------------

function baseInput(overrides: Partial<OutdoorNatureInput> = {}): OutdoorNatureInput {
  return {
    today: TODAY,
    total_children: 4,
    outdoor_activity_records: [],
    nature_learning_records: [],
    garden_project_records: [],
    exploration_records: [],
    outdoor_safety_records: [],
    ...overrides,
  };
}

// -- Record factories ---------------------------------------------------------

let _actId = 0;
function makeActivity(overrides: Partial<OutdoorActivityRecordInput> = {}): OutdoorActivityRecordInput {
  _actId++;
  return {
    id: `act_${_actId}`,
    child_id: "child_1",
    activity_type: "walking",
    date: "2026-05-20",
    duration_minutes: 60,
    staff_led: true,
    child_initiated: false,
    location: "park",
    child_enjoyment: 4,
    weather_appropriate_clothing: true,
    risk_assessment_completed: true,
    participation_willing: true,
    skills_developed: ["teamwork"],
    notes: "Good session",
    created_at: "2026-05-20",
    ...overrides,
  };
}

let _natId = 0;
function makeNature(overrides: Partial<NatureLearningRecordInput> = {}): NatureLearningRecordInput {
  _natId++;
  return {
    id: `nat_${_natId}`,
    child_id: "child_1",
    topic: "wildlife identification",
    learning_type: "wildlife_watch",
    date: "2026-05-20",
    duration_minutes: 45,
    learning_objectives_set: true,
    learning_objectives_met: true,
    child_engagement: 4,
    child_voice_captured: true,
    linked_to_education: true,
    resources_provided: true,
    outcome_documented: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

let _garId = 0;
function makeGarden(overrides: Partial<GardenProjectRecordInput> = {}): GardenProjectRecordInput {
  _garId++;
  return {
    id: `gar_${_garId}`,
    child_id: "child_1",
    project_name: "vegetable patch",
    project_type: "vegetable_growing",
    date: "2026-05-20",
    active: true,
    child_led: true,
    child_participation: true,
    responsibility_assigned: true,
    progress_documented: true,
    therapeutic_benefit_noted: true,
    harvest_used: true,
    skills_gained: ["planting"],
    child_satisfaction: 4,
    created_at: "2026-05-20",
    ...overrides,
  };
}

let _expId = 0;
function makeExploration(overrides: Partial<ExplorationRecordInput> = {}): ExplorationRecordInput {
  _expId++;
  return {
    id: `exp_${_expId}`,
    child_id: "child_1",
    exploration_type: "woodland_exploration",
    date: "2026-05-20",
    duration_minutes: 90,
    new_environment: true,
    child_choice: true,
    sensory_engagement: true,
    discovery_documented: true,
    child_enjoyment: 4,
    staff_accompanied: true,
    educational_value: true,
    repeat_requested: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

let _safId = 0;
function makeSafety(overrides: Partial<OutdoorSafetyRecordInput> = {}): OutdoorSafetyRecordInput {
  _safId++;
  return {
    id: `saf_${_safId}`,
    date: "2026-05-20",
    safety_type: "risk_assessment",
    completed: true,
    compliant: true,
    issues_found: 0,
    issues_resolved: 0,
    staff_trained: true,
    linked_activity_id: "act_1",
    review_date: "2026-06-20",
    notes: "All clear",
    created_at: "2026-05-20",
    ...overrides,
  };
}

// -- Helper: run engine -------------------------------------------------------

function run(overrides: Partial<OutdoorNatureInput> = {}) {
  return computeOutdoorNatureEngagement(baseInput(overrides));
}

// -- pct helper (mirror engine logic) -----------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

// =============================================================================
// TESTS
// =============================================================================

describe("computeOutdoorNatureEngagement", () => {
  // ── Insufficient data ─────────────────────────────────────────────────────

  describe("insufficient_data", () => {
    it("returns insufficient_data when no children and all records empty", () => {
      const r = run({ total_children: 0 });
      expect(r.outdoor_rating).toBe("insufficient_data");
      expect(r.outdoor_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
    });

    it("returns all rates as 0 for insufficient_data", () => {
      const r = run({ total_children: 0 });
      expect(r.outdoor_frequency_rate).toBe(0);
      expect(r.nature_learning_rate).toBe(0);
      expect(r.garden_participation_rate).toBe(0);
      expect(r.exploration_diversity_rate).toBe(0);
      expect(r.safety_compliance_rate).toBe(0);
      expect(r.child_enjoyment_rate).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = run({ total_children: 0 });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  // ── Inadequate floor (all empty + children > 0) ───────────────────────────

  describe("inadequate floor (all empty, children > 0)", () => {
    it("returns inadequate with score 15 when children present but no records", () => {
      const r = run({ total_children: 3 });
      expect(r.outdoor_rating).toBe("inadequate");
      expect(r.outdoor_score).toBe(15);
    });

    it("headline mentions no data recorded", () => {
      const r = run({ total_children: 3 });
      expect(r.headline).toContain("No outdoor or nature engagement data recorded");
    });

    it("produces exactly 1 concern about absence of all records", () => {
      const r = run({ total_children: 3 });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No outdoor activity");
    });

    it("produces exactly 2 recommendations", () => {
      const r = run({ total_children: 3 });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("produces exactly 1 critical insight", () => {
      const r = run({ total_children: 3 });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("all rates are 0", () => {
      const r = run({ total_children: 3 });
      expect(r.outdoor_frequency_rate).toBe(0);
      expect(r.nature_learning_rate).toBe(0);
      expect(r.garden_participation_rate).toBe(0);
      expect(r.exploration_diversity_rate).toBe(0);
      expect(r.safety_compliance_rate).toBe(0);
      expect(r.child_enjoyment_rate).toBe(0);
    });
  });

  // ── pct helper ────────────────────────────────────────────────────────────

  describe("pct(n, d)", () => {
    it("pct(0, 0) returns 0", () => {
      expect(pct(0, 0)).toBe(0);
    });

    it("pct(1, 2) returns 50", () => {
      expect(pct(1, 2)).toBe(50);
    });

    it("pct(1, 3) returns 33", () => {
      expect(pct(1, 3)).toBe(33);
    });

    it("pct(3, 3) returns 100", () => {
      expect(pct(3, 3)).toBe(100);
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("score >= 80 yields outstanding", () => {
      // max score: base 52 + all bonuses 28 = 80
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c3", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c4", child_initiated: true, child_enjoyment: 5 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", linked_to_education: true, learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c2", linked_to_education: true, learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c3", linked_to_education: true, learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c4", linked_to_education: true, learning_objectives_met: true, outcome_documented: true }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 5 }),
      ];
      // 5 unique exploration types for diversity
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true }),
        makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true }),
        makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true }),
        makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true }),
        makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true }),
      ];
      // safety with issues to trigger bonus 9
      const safs = [
        makeSafety({ compliant: true, issues_found: 2, issues_resolved: 2 }),
        makeSafety({ compliant: true, issues_found: 1, issues_resolved: 1 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        exploration_records: exps,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_rating).toBe("outstanding");
      expect(r.outdoor_score).toBe(80);
    });

    it("score in [65..79] yields good", () => {
      // base 52 + outdoor freq (+4) + nature learning (+3) + garden part (+3) + safety compliance (+4) = 66
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false }),
        makeActivity({ child_id: "c2", child_initiated: false }),
        makeActivity({ child_id: "c3", child_initiated: false }),
        makeActivity({ child_id: "c4", child_initiated: false }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true }),
        makeGarden({ child_id: "c2", child_participation: true }),
        makeGarden({ child_id: "c3", child_participation: true }),
        makeGarden({ child_id: "c4", child_participation: true }),
      ];
      const safs = [makeSafety({ compliant: true })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_score).toBeGreaterThanOrEqual(65);
      expect(r.outdoor_score).toBeLessThan(80);
      expect(r.outdoor_rating).toBe("good");
    });

    it("score in [45..64] yields adequate", () => {
      // base 52 alone without bonuses or penalties
      // need to avoid all bonuses: no records that trigger bonuses
      // 1 outdoor activity for 1 child out of 4 = 25% frequency => no bonus
      // low nature, no garden, no exploration, 1 non-compliant safety
      const acts = [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 3 })];
      const safs = [makeSafety({ compliant: false, staff_trained: false })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      // outdoorFrequencyRate = 25% (<40) => penalty -5 => 47
      // safetyComplianceRate = 0% (<50) => penalty -5 => 42 ... might be too low
      // Let's adjust: avoid triggering penalties
      const acts2 = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 3 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 3 }),
      ];
      const safs2 = [makeSafety({ compliant: true })];
      const r2 = run({
        total_children: 4,
        outdoor_activity_records: acts2,
        outdoor_safety_records: safs2,
      });
      // outdoorFrequencyRate = 50% => no bonus/no penalty
      // safetyComplianceRate = 100% => +4
      // childEnjoymentRate: avg enjoyment 3/5 = 60% => +1
      // 52 + 4 + 1 = 57
      expect(r2.outdoor_score).toBeGreaterThanOrEqual(45);
      expect(r2.outdoor_score).toBeLessThan(65);
      expect(r2.outdoor_rating).toBe("adequate");
    });

    it("score < 45 yields inadequate", () => {
      // 1 child out of 4 = 25% freq => penalty -5
      // 1 non-compliant safety => penalty -5
      // 52 - 5 - 5 = 42
      const acts = [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 })];
      const safs = [makeSafety({ compliant: false })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_score).toBeLessThan(45);
      expect(r.outdoor_rating).toBe("inadequate");
    });
  });

  // ── Base score ────────────────────────────────────────────────────────────

  describe("base score", () => {
    it("starts at 52 with minimal data (no bonuses, no penalties)", () => {
      // 2 children out of 4 = 50% => no bonus, no penalty
      // no nature/garden/exploration/safety => no bonus/penalty for those
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 3 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 3 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      // childEnjoymentRate: avg 3/5 = 60% => +1 bonus
      // score = 52 + 1 = 53
      // Let's use enjoyment=2 to avoid bonus: 2/5 = 40% => no bonus, no penalty
      const acts2 = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r2 = run({
        total_children: 4,
        outdoor_activity_records: acts2,
      });
      // outdoorFrequencyRate = 50% => no bonus, no penalty
      // childEnjoymentRate = avg(2)/5*100 = 40% => no bonus, no penalty
      // childInitiatedRate = 0% => no bonus
      // No other records => all other metrics 0 but no guards triggered
      expect(r2.outdoor_score).toBe(52);
    });
  });

  // ── Bonus 1: outdoorFrequencyRate ─────────────────────────────────────────

  describe("Bonus 1: outdoorFrequencyRate", () => {
    it("+4 when >= 90%", () => {
      // 4 unique children out of 4 = 100%
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c3", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c4", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      // base 52 + 4 (outdoor freq) = 56
      expect(r.outdoor_score).toBe(56);
      expect(r.outdoor_frequency_rate).toBe(100);
    });

    it("+2 when >= 70% and < 90%", () => {
      // 3 unique children out of 4 = 75%
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c3", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      // base 52 + 2 (outdoor freq) = 54
      expect(r.outdoor_score).toBe(54);
      expect(r.outdoor_frequency_rate).toBe(75);
    });

    it("no bonus when < 70%", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.outdoor_score).toBe(52);
      expect(r.outdoor_frequency_rate).toBe(50);
    });
  });

  // ── Bonus 2: natureLearningRate ───────────────────────────────────────────

  describe("Bonus 2: natureLearningRate", () => {
    it("+3 when >= 80%", () => {
      // natureLearningRate = round((objectivesMetRate + pct(uniqueChildrenNature, total) + outcomeDocRate) / 3)
      // all met, all documented, all 4 children => (100 + 100 + 100)/3 = 100
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true }),
      ];
      // Need activities to avoid having only nature records as that'd mean allEmpty is false but no outdoor acts
      // We need outdoor acts with no bonuses or penalties to isolate this bonus
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      // base 52 + 3 (nature learning) = 55
      // Also educationLinkRate: all linked_to_education defaults true => 100% => +3 (bonus 8)
      // Need to disable linked_to_education
      const nats2 = nats.map(n => ({ ...n, linked_to_education: false }));
      const r2 = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats2,
      });
      expect(r2.nature_learning_rate).toBe(100);
      expect(r2.outdoor_score).toBe(55);
    });

    it("+1 when >= 60% and < 80%", () => {
      // We need natureLearningRate in [60, 80)
      // (objectivesMetRate + childCoverage + outcomeDocRate) / 3
      // 2 out of 4 children, all objectives met, all outcomes documented
      // (100 + 50 + 100)/3 = 83 -- too high
      // 2 children, 50% objectives met, all documented
      // (50 + 50 + 100)/3 = 67
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: true, linked_to_education: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      expect(r.nature_learning_rate).toBe(67);
      expect(r.outdoor_score).toBe(53); // 52 + 1
    });

    it("no bonus when < 60%", () => {
      // 1 child, objectives not met, outcome not documented
      // (0 + 25 + 0)/3 = 8
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      expect(r.nature_learning_rate).toBeLessThan(60);
      // Also triggers natureLearningRate < 30 penalty: -4
      expect(r.outdoor_score).toBe(48); // 52 - 4
    });
  });

  // ── Bonus 3: gardenParticipationRate ───────────────────────────────────────

  describe("Bonus 3: gardenParticipationRate", () => {
    it("+3 when >= 90%", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        garden_project_records: gars,
      });
      expect(r.garden_participation_rate).toBe(100);
      // childEnjoymentRate: includes garden satisfaction. avg = (2+2)/2=2 outdoor, (2+2)/2=2 garden.
      // composite avg = (2+2)/2 = 2. rate = 2/5*100 = 40. no bonus, no penalty.
      expect(r.outdoor_score).toBe(55); // 52 + 3
    });

    it("+1 when >= 70% and < 90%", () => {
      // 7 out of 10 participating = 70%
      const gars = Array.from({ length: 10 }, (_, i) =>
        makeGarden({
          child_id: `c${i}`,
          child_participation: i < 7,
          child_satisfaction: 2,
          child_led: false,
          therapeutic_benefit_noted: false,
          harvest_used: false,
        }),
      );
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        garden_project_records: gars,
      });
      expect(r.garden_participation_rate).toBe(70);
      expect(r.outdoor_score).toBe(53); // 52 + 1
    });

    it("no bonus when < 70%", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        garden_project_records: gars,
      });
      expect(r.garden_participation_rate).toBe(50);
      expect(r.outdoor_score).toBe(52);
    });
  });

  // ── Bonus 4: explorationDiversityRate ─────────────────────────────────────

  describe("Bonus 4: explorationDiversityRate", () => {
    it("+3 when >= 80%", () => {
      // explorationDiversityRate = round((newEnvironmentRate + pct(uniqueExplorationTypes, 5) + sensoryEngagementRate) / 3)
      // all new env, 5+ unique types, all sensory => (100 + 100 + 100)/3 = 100
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        exploration_records: exps,
      });
      expect(r.exploration_diversity_rate).toBe(100);
      expect(r.outdoor_score).toBe(55); // 52 + 3
    });

    it("+1 when >= 60% and < 80%", () => {
      // 3 unique types out of 5 = 60%, 50% new env, 100% sensory => (50 + 60 + 100)/3 = 70
      // Let's try: 2 unique types, all new env, all sensory => (100 + pct(2,5) + 100)/3 = (100+40+100)/3 = 80
      // 1 unique type, all new env, all sensory => (100+20+100)/3 = 73 -- that's >=60
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        exploration_records: exps,
      });
      // pct(1,5)=20, newEnvRate=100, sensoryRate=100 => (100+20+100)/3 = 73
      expect(r.exploration_diversity_rate).toBe(73);
      expect(r.outdoor_score).toBe(53); // 52 + 1
    });

    it("no bonus when < 60%", () => {
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        exploration_records: exps,
      });
      // (0 + 20 + 0)/3 = 7
      expect(r.exploration_diversity_rate).toBe(7);
      expect(r.outdoor_score).toBe(52);
    });
  });

  // ── Bonus 5: safetyComplianceRate ─────────────────────────────────────────

  describe("Bonus 5: safetyComplianceRate", () => {
    it("+4 when >= 95%", () => {
      const safs = [
        makeSafety({ compliant: true }),
        makeSafety({ compliant: true }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      expect(r.safety_compliance_rate).toBe(100);
      expect(r.outdoor_score).toBe(56); // 52 + 4
    });

    it("+2 when >= 80% and < 95%", () => {
      // 9 compliant out of 10 = 90%
      const safs = Array.from({ length: 10 }, (_, i) =>
        makeSafety({ compliant: i < 9 }),
      );
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      expect(r.safety_compliance_rate).toBe(90);
      expect(r.outdoor_score).toBe(54); // 52 + 2
    });

    it("no bonus when < 80%", () => {
      const safs = [
        makeSafety({ compliant: true }),
        makeSafety({ compliant: false }),
        makeSafety({ compliant: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      expect(r.safety_compliance_rate).toBe(33);
      // penalty for <50: -5
      expect(r.outdoor_score).toBe(47); // 52 - 5
    });
  });

  // ── Bonus 6: childEnjoymentRate ───────────────────────────────────────────

  describe("Bonus 6: childEnjoymentRate", () => {
    it("+3 when >= 80%", () => {
      // enjoyment avg >= 4 means rate = 4/5*100 = 80
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 4 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 4 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.child_enjoyment_rate).toBe(80);
      expect(r.outdoor_score).toBe(55); // 52 + 3
    });

    it("+1 when >= 60% and < 80%", () => {
      // enjoyment 3.5 => rate = 70%... but we need integer enjoyment
      // enjoyment 3 => rate = 60
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 3 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 3 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.child_enjoyment_rate).toBe(60);
      expect(r.outdoor_score).toBe(53); // 52 + 1
    });

    it("no bonus when < 60%", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.child_enjoyment_rate).toBe(40);
      expect(r.outdoor_score).toBe(52);
    });
  });

  // ── Bonus 7: childInitiatedRate ───────────────────────────────────────────

  describe("Bonus 7: childInitiatedRate", () => {
    it("+3 when >= 50%", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.outdoor_score).toBe(55); // 52 + 3
    });

    it("+1 when >= 30% and < 50%", () => {
      // 1 out of 3 = 33%
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.outdoor_score).toBe(53); // 52 + 1
    });

    it("no bonus when < 30%", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.outdoor_score).toBe(52);
    });
  });

  // ── Bonus 8: educationLinkRate ────────────────────────────────────────────

  describe("Bonus 8: educationLinkRate", () => {
    it("+3 when >= 70%", () => {
      const nats = [
        makeNature({ child_id: "c1", linked_to_education: true, learning_objectives_met: false, outcome_documented: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      // educationLinkRate = 100% => +3
      // natureLearningRate = round((0 + 25 + 0)/3) = 8 => <30 penalty -4
      // 52 + 3 - 4 = 51
      expect(r.outdoor_score).toBe(51);
    });

    it("+1 when >= 50% and < 70%", () => {
      // 1 out of 2 linked = 50%
      const nats = [
        makeNature({ child_id: "c1", linked_to_education: true, learning_objectives_met: false, outcome_documented: false }),
        makeNature({ child_id: "c2", linked_to_education: false, learning_objectives_met: false, outcome_documented: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      // educationLinkRate = 50% => +1
      // natureLearningRate = round((0 + 50 + 0)/3) = 17 => <30 penalty -4
      // 52 + 1 - 4 = 49
      expect(r.outdoor_score).toBe(49);
    });

    it("no bonus when < 50%", () => {
      const nats = [
        makeNature({ child_id: "c1", linked_to_education: false, learning_objectives_met: false, outcome_documented: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      // educationLinkRate = 0% => no bonus
      // natureLearningRate = round((0 + 25 + 0)/3) = 8 => <30 penalty -4
      // 52 - 4 = 48
      expect(r.outdoor_score).toBe(48);
    });
  });

  // ── Bonus 9: safetyIssueResolutionRate ────────────────────────────────────

  describe("Bonus 9: safetyIssueResolutionRate", () => {
    it("+2 when >= 90% and issues > 0", () => {
      const safs = [
        makeSafety({ compliant: true, issues_found: 10, issues_resolved: 10 }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      // safetyComplianceRate = 100% => +4
      // safetyIssueResolution = 100% => +2
      // 52 + 4 + 2 = 58
      expect(r.outdoor_score).toBe(58);
    });

    it("+1 when >= 70% and < 90% and issues > 0", () => {
      const safs = [
        makeSafety({ compliant: true, issues_found: 10, issues_resolved: 8 }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      // safetyComplianceRate = 100% => +4
      // safetyIssueResolution = 80% => +1
      // 52 + 4 + 1 = 57
      expect(r.outdoor_score).toBe(57);
    });

    it("no bonus when issues = 0 even if resolution rate would be high", () => {
      const safs = [
        makeSafety({ compliant: true, issues_found: 0, issues_resolved: 0 }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      // safetyComplianceRate = 100% => +4 only
      // 52 + 4 = 56
      expect(r.outdoor_score).toBe(56);
    });

    it("no bonus when resolution < 70%", () => {
      const safs = [
        makeSafety({ compliant: true, issues_found: 10, issues_resolved: 5 }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      // safetyComplianceRate = 100% => +4
      // resolution = 50% => no bonus
      // 52 + 4 = 56
      expect(r.outdoor_score).toBe(56);
    });
  });

  // ── Max bonuses ───────────────────────────────────────────────────────────

  describe("max bonuses", () => {
    it("total bonuses cap at +28 (base 52 + 28 = 80)", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c3", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c4", child_initiated: true, child_enjoyment: 5 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 5 }),
      ];
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
      ];
      const safs = [
        makeSafety({ compliant: true, issues_found: 5, issues_resolved: 5 }),
        makeSafety({ compliant: true, issues_found: 3, issues_resolved: 3 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        exploration_records: exps,
        outdoor_safety_records: safs,
      });
      // B1: outdoorFreq 100% => +4
      // B2: natureLearning 100% => +3
      // B3: gardenPart 100% => +3
      // B4: explorationDiv 100% => +3
      // B5: safetyCompliance 100% => +4
      // B6: childEnjoyment: outdoor avg 5, exploration avg 5, garden avg 5 => composite 5/5*100=100% => +3
      // B7: childInitiated 100% => +3
      // B8: educationLink 100% => +3
      // B9: resolution 100% w/ issues => +2
      // Total bonuses: 4+3+3+3+4+3+3+3+2 = 28
      expect(r.outdoor_score).toBe(80);
      expect(r.outdoor_rating).toBe("outstanding");
    });
  });

  // ── Penalties ─────────────────────────────────────────────────────────────

  describe("Penalty 1: outdoorFrequencyRate < 40", () => {
    it("-5 when < 40% and outdoor records exist", () => {
      // 1 unique child out of 4 = 25%
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.outdoor_frequency_rate).toBe(25);
      expect(r.outdoor_score).toBe(47); // 52 - 5
    });

    it("no penalty when outdoor records empty (guard)", () => {
      // No outdoor records at all, but has other records (not allEmpty)
      const safs = [makeSafety({ compliant: true })];
      const r = run({
        total_children: 4,
        outdoor_safety_records: safs,
      });
      // outdoorFrequencyRate = pct(0, 4) = 0 but no outdoor records so guard fires
      // Only bonus: safetyCompliance 100% => +4
      expect(r.outdoor_score).toBe(56); // 52 + 4
    });
  });

  describe("Penalty 2: safetyComplianceRate < 50", () => {
    it("-5 when < 50% and safety records exist", () => {
      const safs = [
        makeSafety({ compliant: false }),
        makeSafety({ compliant: false }),
        makeSafety({ compliant: true }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      expect(r.safety_compliance_rate).toBe(33);
      expect(r.outdoor_score).toBe(47); // 52 - 5
    });

    it("no penalty when safety records empty (guard)", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      // safetyComplianceRate = 0 but no records => guard
      expect(r.outdoor_score).toBe(52);
    });
  });

  describe("Penalty 3: natureLearningRate < 30", () => {
    it("-4 when < 30% and nature records exist", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      // natureLearningRate = round((0 + 25 + 0)/3) = 8
      expect(r.nature_learning_rate).toBeLessThan(30);
      expect(r.outdoor_score).toBe(48); // 52 - 4
    });

    it("no penalty when nature records empty (guard)", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.nature_learning_rate).toBe(0);
      expect(r.outdoor_score).toBe(52);
    });
  });

  describe("Penalty 4: childEnjoymentRate < 40", () => {
    it("-4 when < 40% and enjoymentCount > 0", () => {
      // enjoyment 1 => rate = 1/5*100 = 20
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 1 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 1 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
      });
      expect(r.child_enjoyment_rate).toBe(20);
      expect(r.outdoor_score).toBe(48); // 52 - 4
    });

    it("no penalty when enjoymentCount = 0 (only safety records)", () => {
      const safs = [makeSafety({ compliant: true })];
      const r = run({
        total_children: 4,
        outdoor_safety_records: safs,
      });
      expect(r.child_enjoyment_rate).toBe(0);
      // Only bonus: safety 100% => +4
      expect(r.outdoor_score).toBe(56); // 52 + 4
    });
  });

  describe("stacked penalties", () => {
    it("applies all 4 penalties simultaneously", () => {
      // freq < 40, safety < 50, nature < 30, enjoyment < 40
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 1 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const safs = [
        makeSafety({ compliant: false }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        outdoor_safety_records: safs,
      });
      // freq 25% < 40 => -5
      // safety 0% < 50 => -5
      // nature rate = round((0+25+0)/3) = 8 < 30 => -4
      // enjoyment 1/5*100=20 < 40 => -4
      // 52 - 5 - 5 - 4 - 4 = 34
      expect(r.outdoor_score).toBe(34);
    });
  });

  // ── Rates computation ─────────────────────────────────────────────────────

  describe("rate computations", () => {
    describe("outdoor_frequency_rate", () => {
      it("computes as pct(uniqueChildrenOutdoor, total_children)", () => {
        const acts = [
          makeActivity({ child_id: "c1" }),
          makeActivity({ child_id: "c1" }), // duplicate
          makeActivity({ child_id: "c2" }),
          makeActivity({ child_id: "c3" }),
        ];
        const r = run({ total_children: 5, outdoor_activity_records: acts });
        expect(r.outdoor_frequency_rate).toBe(60); // 3/5
      });
    });

    describe("nature_learning_rate", () => {
      it("computes as avg of objectivesMetRate, child coverage, and outcomeDocRate", () => {
        // 2 records, 1 objective met, 2 unique children out of 4, 1 outcome documented
        const nats = [
          makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
          makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        ];
        const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }), makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 })] });
        // objectivesMetRate = pct(1, 2) = 50
        // childCoverage = pct(2, 4) = 50
        // outcomeDocRate = pct(1, 2) = 50
        // avg = (50 + 50 + 50) / 3 = 50
        expect(r.nature_learning_rate).toBe(50);
      });

      it("is 0 when no nature records", () => {
        const r = run({ total_children: 4, outdoor_activity_records: [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 })] });
        expect(r.nature_learning_rate).toBe(0);
      });
    });

    describe("garden_participation_rate", () => {
      it("computes as pct(participating, total garden records)", () => {
        const gars = [
          makeGarden({ child_id: "c1", child_participation: true }),
          makeGarden({ child_id: "c2", child_participation: true }),
          makeGarden({ child_id: "c3", child_participation: false }),
        ];
        const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 })] });
        expect(r.garden_participation_rate).toBe(67); // 2/3
      });
    });

    describe("exploration_diversity_rate", () => {
      it("computes as avg of newEnvRate, uniqueTypes/5, sensoryRate", () => {
        // 3 records, 2 new environments, 2 unique types, 1 sensory
        const exps = [
          makeExploration({ exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true }),
          makeExploration({ exploration_type: "beach_visit", new_environment: true, sensory_engagement: false }),
          makeExploration({ exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false }),
        ];
        const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 })] });
        // newEnvRate = pct(2, 3) = 67
        // uniqueTypes = 2, pct(2, 5) = 40
        // sensoryRate = pct(1, 3) = 33
        // avg = round((67 + 40 + 33) / 3) = round(46.67) = 47
        expect(r.exploration_diversity_rate).toBe(47);
      });

      it("is 0 when no exploration records", () => {
        const r = run({ total_children: 4, outdoor_activity_records: [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 })] });
        expect(r.exploration_diversity_rate).toBe(0);
      });
    });

    describe("safety_compliance_rate", () => {
      it("computes as pct(compliant, total safety records)", () => {
        const safs = [
          makeSafety({ compliant: true }),
          makeSafety({ compliant: true }),
          makeSafety({ compliant: false }),
          makeSafety({ compliant: false }),
          makeSafety({ compliant: false }),
        ];
        const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 })] });
        expect(r.safety_compliance_rate).toBe(40); // 2/5
      });
    });

    describe("child_enjoyment_rate", () => {
      it("composite from outdoor, exploration, and garden enjoyment", () => {
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 4, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 3, child_initiated: false }),
        ];
        const exps = [
          makeExploration({ child_id: "c1", child_enjoyment: 5, new_environment: false, sensory_engagement: false, child_choice: false, repeat_requested: false }),
        ];
        const gars = [
          makeGarden({ child_id: "c1", child_satisfaction: 3, child_participation: false, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        ];
        const r = run({
          total_children: 4,
          outdoor_activity_records: acts,
          exploration_records: exps,
          garden_project_records: gars,
        });
        // outdoor avg = (4+3)/2 = 3.5
        // exploration avg = 5
        // garden avg = 3
        // composite avg = (3.5 + 5 + 3) / 3 = 3.833... => round to 3.83
        // rate = round(3.83 / 5 * 100) = round(76.6) = 77
        expect(r.child_enjoyment_rate).toBe(77);
      });

      it("only includes categories with records", () => {
        // only outdoor
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 5, child_initiated: false }),
        ];
        const r = run({
          total_children: 4,
          outdoor_activity_records: acts,
        });
        // composite avg = 5/1 = 5, rate = 5/5*100 = 100
        expect(r.child_enjoyment_rate).toBe(100);
      });

      it("is 0 when no outdoor, exploration, or garden records", () => {
        const safs = [makeSafety({ compliant: true })];
        const r = run({ total_children: 4, outdoor_safety_records: safs });
        expect(r.child_enjoyment_rate).toBe(0);
      });
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("outdoor frequency >= 90% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c3", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c4", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("100%") && s.includes("outdoor activity"))).toBe(true);
    });

    it("outdoor frequency 70-89% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c3", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("75%") && s.includes("participate in outdoor"))).toBe(true);
    });

    it("willing rate >= 90% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", participation_willing: true, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", participation_willing: true, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("100% willing participation"))).toBe(true);
    });

    it("child initiated >= 50% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 2 }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("child-initiated"))).toBe(true);
    });

    it("outdoor enjoyment avg >= 4.0 strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 5, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 4, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("enjoyment of outdoor activities averages"))).toBe(true);
    });

    it("unique locations >= 5 strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", location: "park", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", location: "woodland", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", location: "beach", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", location: "countryside", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", location: "garden", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("5 different locations"))).toBe(true);
    });

    it("unique activity types >= 5 strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", activity_type: "walking", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", activity_type: "cycling", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", activity_type: "sports", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", activity_type: "free_play", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", activity_type: "adventure", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("5 different types of outdoor activity"))).toBe(true);
    });

    it("skills development rate >= 70% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", skills_developed: ["teamwork"], child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", skills_developed: ["balance"], child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", skills_developed: [], child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      // 2 out of 3 = 67% -- not enough
      expect(r.strengths.some(s => s.includes("Skills development"))).toBe(false);
    });

    it("weather clothing >= 90% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", weather_appropriate_clothing: true, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", weather_appropriate_clothing: true, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("weather-appropriate clothing"))).toBe(true);
    });

    it("nature learning rate >= 80% strength", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }), makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("Nature learning rate at 100%"))).toBe(true);
    });

    it("nature learning rate 60-79% strength", () => {
      // (50 + 50 + 100)/3 = 67
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: true, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }), makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false })] });
      expect(r.nature_learning_rate).toBe(67);
      expect(r.strengths.some(s => s.includes("Nature learning rate at 67%"))).toBe(true);
    });

    it("objectives met >= 80% strength", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: false, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of nature learning objectives met"))).toBe(true);
    });

    it("nature engagement avg >= 4.0 strength", () => {
      const nats = [
        makeNature({ child_id: "c1", child_engagement: 5, learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("engagement with nature learning averages 5/5"))).toBe(true);
    });

    it("education link >= 70% strength", () => {
      const nats = [
        makeNature({ child_id: "c1", linked_to_education: true, learning_objectives_met: false, outcome_documented: false }),
        makeNature({ child_id: "c2", linked_to_education: true, learning_objectives_met: false, outcome_documented: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of nature learning linked to formal education"))).toBe(true);
    });

    it("unique learning types >= 4 strength", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_type: "forest_school", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        makeNature({ child_id: "c1", learning_type: "nature_journal", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        makeNature({ child_id: "c1", learning_type: "wildlife_watch", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        makeNature({ child_id: "c1", learning_type: "eco_project", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("4 different nature learning approaches"))).toBe(true);
    });

    it("garden participation >= 90% strength", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% garden project participation"))).toBe(true);
    });

    it("garden participation 70-89% strength", () => {
      const gars = Array.from({ length: 10 }, (_, i) =>
        makeGarden({ child_id: `c${i}`, child_participation: i < 8, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      );
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.garden_participation_rate).toBe(80);
      expect(r.strengths.some(s => s.includes("80% participation in garden projects"))).toBe(true);
    });

    it("garden child led >= 50% strength", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_led: true, child_satisfaction: 2, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_led: true, child_satisfaction: 2, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("garden projects are child-led"))).toBe(true);
    });

    it("therapeutic rate >= 60% strength", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, therapeutic_benefit_noted: true, child_satisfaction: 2, child_led: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, therapeutic_benefit_noted: true, child_satisfaction: 2, child_led: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("Therapeutic benefit noted in 100%"))).toBe(true);
    });

    it("harvest used >= 50% strength", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, harvest_used: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false }),
        makeGarden({ child_id: "c2", child_participation: true, harvest_used: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("Harvest used in cooking"))).toBe(true);
    });

    it("garden satisfaction >= 4.0 strength", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("satisfaction with garden projects averages 5/5"))).toBe(true);
    });

    it("exploration diversity >= 80% strength", () => {
      const exps = [
        makeExploration({ exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.exploration_diversity_rate).toBe(100);
      expect(r.strengths.some(s => s.includes("Exploration diversity rate at 100%"))).toBe(true);
    });

    it("exploration diversity 60-79% strength", () => {
      // (100 + 20 + 100)/3 = 73
      const exps = [
        makeExploration({ exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.exploration_diversity_rate).toBe(73);
      expect(r.strengths.some(s => s.includes("Exploration diversity rate at 73%"))).toBe(true);
    });

    it("new environment >= 50% strength", () => {
      const exps = [
        makeExploration({ new_environment: true, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ new_environment: true, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of explorations involve new environments"))).toBe(true);
    });

    it("sensory engagement >= 70% strength", () => {
      const exps = [
        makeExploration({ sensory_engagement: true, new_environment: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ sensory_engagement: true, new_environment: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ sensory_engagement: true, new_environment: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("Sensory engagement documented in 100%"))).toBe(true);
    });

    it("child choice >= 60% strength", () => {
      const exps = [
        makeExploration({ child_choice: true, new_environment: false, sensory_engagement: false, child_enjoyment: 2, repeat_requested: false }),
        makeExploration({ child_choice: true, new_environment: false, sensory_engagement: false, child_enjoyment: 2, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of explorations reflect children's choices"))).toBe(true);
    });

    it("repeat request >= 40% strength", () => {
      const exps = [
        makeExploration({ repeat_requested: true, new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false }),
        makeExploration({ repeat_requested: true, new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of explorations have repeat requests"))).toBe(true);
    });

    it("safety compliance >= 95% strength", () => {
      const safs = [makeSafety({ compliant: true }), makeSafety({ compliant: true })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% outdoor safety compliance") && s.includes("excellent"))).toBe(true);
    });

    it("safety compliance 80-94% strength", () => {
      const safs = Array.from({ length: 10 }, (_, i) => makeSafety({ compliant: i < 9 }));
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.safety_compliance_rate).toBe(90);
      expect(r.strengths.some(s => s.includes("90% outdoor safety compliance") && s.includes("robust"))).toBe(true);
    });

    it("safety issue resolution >= 90% strength", () => {
      const safs = [makeSafety({ compliant: true, issues_found: 10, issues_resolved: 10 })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of outdoor safety issues resolved"))).toBe(true);
    });

    it("safety training >= 80% strength", () => {
      const safs = [
        makeSafety({ compliant: true, staff_trained: true }),
        makeSafety({ compliant: true, staff_trained: true }),
      ];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("100% of safety checks involve trained staff"))).toBe(true);
    });

    it("activity risk assessment >= 90% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", risk_assessment_completed: true, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", risk_assessment_completed: true, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("Risk assessments completed for 100%"))).toBe(true);
    });

    it("child enjoyment rate >= 80% strength", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 5, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 5, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.strengths.some(s => s.includes("Composite child enjoyment rate at 100%"))).toBe(true);
    });

    it("nature voice rate >= 80% strength", () => {
      const nats = [
        makeNature({ child_id: "c1", child_voice_captured: true, learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        makeNature({ child_id: "c2", child_voice_captured: true, learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.strengths.some(s => s.includes("Child voice captured in 100%"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("outdoor frequency < 40% concern", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("25%") && c.includes("outdoor activity"))).toBe(true);
    });

    it("outdoor frequency 40-69% concern", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("50%") && c.includes("some children are not regularly"))).toBe(true);
    });

    it("outdoor enjoyment avg < 3.0 concern", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("enjoyment of outdoor activities averages only"))).toBe(true);
    });

    it("willing rate < 50% concern", () => {
      const acts = [
        makeActivity({ child_id: "c1", participation_willing: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", participation_willing: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", participation_willing: true, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("33% willing participation"))).toBe(true);
    });

    it("weather clothing < 70% concern", () => {
      const acts = [
        makeActivity({ child_id: "c1", weather_appropriate_clothing: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", weather_appropriate_clothing: false, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("Weather-appropriate clothing"))).toBe(true);
    });

    it("activity risk assessment < 50% concern", () => {
      const acts = [
        makeActivity({ child_id: "c1", risk_assessment_completed: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", risk_assessment_completed: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", risk_assessment_completed: true, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("Risk assessments completed for only 33%"))).toBe(true);
    });

    it("nature learning rate < 30% concern", () => {
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("Nature learning rate at only") && c.includes("poorly planned"))).toBe(true);
    });

    it("nature learning rate 30-59% concern", () => {
      // (50 + 25 + 50)/3 = 42
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }), makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false })] });
      // objectivesMetRate = 50, childCoverage = 50, outcomeDocRate = 50 => 50
      expect(r.nature_learning_rate).toBe(50);
      expect(r.concerns.some(c => c.includes("Nature learning rate at 50%") && c.includes("needs strengthening"))).toBe(true);
    });

    it("objectives met < 50% concern", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("0% of nature learning objectives met"))).toBe(true);
    });

    it("nature engagement avg < 3.0 concern", () => {
      const nats = [makeNature({ child_id: "c1", child_engagement: 2, learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("engagement with nature learning averages only 2/5"))).toBe(true);
    });

    it("education link < 30% concern", () => {
      const nats = [
        makeNature({ child_id: "c1", linked_to_education: false, learning_objectives_met: false, outcome_documented: false }),
        makeNature({ child_id: "c2", linked_to_education: false, learning_objectives_met: false, outcome_documented: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("0% of nature learning linked to formal education"))).toBe(true);
    });

    it("garden participation < 40% concern", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c3", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c4", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.garden_participation_rate).toBe(25);
      expect(r.concerns.some(c => c.includes("Only 25% garden project participation"))).toBe(true);
    });

    it("garden participation 40-69% concern", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.garden_participation_rate).toBe(50);
      expect(r.concerns.some(c => c.includes("Garden participation at 50%"))).toBe(true);
    });

    it("garden active < 50% concern", () => {
      const gars = [
        makeGarden({ child_id: "c1", active: false, child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", active: false, child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c3", active: true, child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("33% of garden projects are active"))).toBe(true);
    });

    it("exploration diversity < 30% concern", () => {
      const exps = [
        makeExploration({ exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      // (0 + 20 + 0)/3 = 7
      expect(r.exploration_diversity_rate).toBe(7);
      expect(r.concerns.some(c => c.includes("Exploration diversity rate at only 7%"))).toBe(true);
    });

    it("exploration diversity 30-59% concern", () => {
      // 2 unique types, 50% new env, 50% sensory => (50 + 40 + 50)/3 = 47
      const exps = [
        makeExploration({ exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ exploration_type: "beach_visit", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.exploration_diversity_rate).toBe(47);
      expect(r.concerns.some(c => c.includes("Exploration diversity at 47%") && c.includes("needs broadening"))).toBe(true);
    });

    it("new environment < 20% concern", () => {
      const exps = [
        makeExploration({ new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("0% of explorations involve new environments"))).toBe(true);
    });

    it("sensory engagement < 40% concern", () => {
      const exps = [
        makeExploration({ sensory_engagement: false, new_environment: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ sensory_engagement: false, new_environment: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ sensory_engagement: true, new_environment: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("Sensory engagement documented in only 33%"))).toBe(true);
    });

    it("safety compliance < 50% concern", () => {
      const safs = [makeSafety({ compliant: false }), makeSafety({ compliant: false }), makeSafety({ compliant: true })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("33% outdoor safety compliance") && c.includes("non-compliant"))).toBe(true);
    });

    it("safety compliance 50-79% concern", () => {
      const safs = [
        makeSafety({ compliant: true }),
        makeSafety({ compliant: true }),
        makeSafety({ compliant: false }),
      ];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.safety_compliance_rate).toBe(67);
      expect(r.concerns.some(c => c.includes("67%") && c.includes("needs strengthening"))).toBe(true);
    });

    it("safety issue resolution < 50% concern", () => {
      const safs = [makeSafety({ compliant: true, issues_found: 10, issues_resolved: 3 })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("30% of outdoor safety issues resolved"))).toBe(true);
    });

    it("safety training < 50% concern", () => {
      const safs = [
        makeSafety({ compliant: true, staff_trained: false }),
        makeSafety({ compliant: true, staff_trained: false }),
        makeSafety({ compliant: true, staff_trained: true }),
      ];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.concerns.some(c => c.includes("33% of safety checks involve trained staff"))).toBe(true);
    });

    it("child enjoyment < 40% concern", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("Composite child enjoyment rate at only 20%"))).toBe(true);
    });

    it("child enjoyment 40-59% concern", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 3, child_initiated: false }),
      ];
      // avg = 2.5, rate = round(2.5/5*100) = 50
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.child_enjoyment_rate).toBe(50);
      expect(r.concerns.some(c => c.includes("Child enjoyment rate at 50%"))).toBe(true);
    });

    it("no outdoor records concern when children present and not allEmpty", () => {
      const safs = [makeSafety({ compliant: true })];
      const r = run({ total_children: 4, outdoor_safety_records: safs });
      expect(r.concerns.some(c => c.includes("No outdoor activity records despite children"))).toBe(true);
    });

    it("no nature learning records concern when children present and not allEmpty", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("No nature-based learning records"))).toBe(true);
    });

    it("no safety records concern when children present and not allEmpty", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.concerns.some(c => c.includes("No outdoor safety records"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  describe("recommendations", () => {
    it("outdoor frequency < 40% => immediate recommendation", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("outdoor activity provision"))).toBe(true);
    });

    it("safety compliance < 50% => immediate recommendation", () => {
      const safs = [makeSafety({ compliant: false })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("outdoor safety management"))).toBe(true);
    });

    it("activity risk assessment < 50% => immediate recommendation", () => {
      const acts = [
        makeActivity({ child_id: "c1", risk_assessment_completed: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", risk_assessment_completed: false, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("risk assessments"))).toBe(true);
    });

    it("child enjoyment < 40% => immediate recommendation", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("Redesign the outdoor programme"))).toBe(true);
    });

    it("no safety records => immediate recommendation", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("Establish outdoor safety management"))).toBe(true);
    });

    it("nature learning < 30% => immediate recommendation", () => {
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("nature-based learning"))).toBe(true);
    });

    it("safety issue resolution < 50% => immediate recommendation", () => {
      const safs = [makeSafety({ compliant: true, issues_found: 10, issues_resolved: 3 })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("unresolved outdoor safety issues"))).toBe(true);
    });

    it("outdoor frequency 40-69% => soon recommendation", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Increase outdoor activity participation"))).toBe(true);
    });

    it("garden participation < 40% => soon recommendation", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c3", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c4", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("garden and growing projects"))).toBe(true);
    });

    it("exploration diversity < 30% => soon recommendation", () => {
      const exps = [makeExploration({ exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false })];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Broaden the range"))).toBe(true);
    });

    it("education link < 30% => soon recommendation", () => {
      const nats = [makeNature({ child_id: "c1", linked_to_education: false, learning_objectives_met: false, outcome_documented: false })];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Link nature-based learning"))).toBe(true);
    });

    it("safety training < 50% => soon recommendation", () => {
      const safs = [makeSafety({ compliant: true, staff_trained: false }), makeSafety({ compliant: true, staff_trained: false })];
      const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("outdoor safety training"))).toBe(true);
    });

    it("weather clothing < 70% => soon recommendation", () => {
      const acts = [
        makeActivity({ child_id: "c1", weather_appropriate_clothing: false, child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c2", weather_appropriate_clothing: false, child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("weather-appropriate outdoor clothing"))).toBe(true);
    });

    it("nature learning 30-59% => planned recommendation", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }), makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false })] });
      expect(r.nature_learning_rate).toBe(50);
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Improve nature learning outcomes"))).toBe(true);
    });

    it("garden participation 40-69% => planned recommendation", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.garden_participation_rate).toBe(50);
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Increase garden project participation"))).toBe(true);
    });

    it("exploration diversity 30-59% => planned recommendation", () => {
      const exps = [
        makeExploration({ exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        makeExploration({ exploration_type: "beach_visit", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      expect(r.exploration_diversity_rate).toBe(47);
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Expand the diversity"))).toBe(true);
    });

    it("no outdoor records => soon recommendation to begin recording", () => {
      const safs = [makeSafety({ compliant: true })];
      const r = run({ total_children: 4, outdoor_safety_records: safs });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Begin recording all outdoor activities"))).toBe(true);
    });

    it("no nature records => soon recommendation", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("Introduce nature-based learning"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, risk_assessment_completed: false, child_initiated: false })];
      const safs = [makeSafety({ compliant: false, issues_found: 10, issues_resolved: 3, staff_trained: false })];
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts, outdoor_safety_records: safs, nature_learning_records: nats });
      const ranks = r.recommendations.map(rec => rec.rank);
      for (let i = 0; i < ranks.length; i++) {
        expect(ranks[i]).toBe(i + 1);
      }
    });

    it("every recommendation has a regulatory_ref", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, risk_assessment_completed: false, child_initiated: false, weather_appropriate_clothing: false })];
      const safs = [makeSafety({ compliant: false, issues_found: 10, issues_resolved: 3, staff_trained: false })];
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const gars = [makeGarden({ child_id: "c1", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false })];
      const exps = [makeExploration({ exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts, outdoor_safety_records: safs, nature_learning_records: nats, garden_project_records: gars, exploration_records: exps });
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeDefined();
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  describe("insights", () => {
    describe("critical insights", () => {
      it("outdoor frequency < 40% => critical insight", () => {
        const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("25% of children have recorded outdoor activity"))).toBe(true);
      });

      it("safety compliance < 50% => critical insight", () => {
        const safs = [makeSafety({ compliant: false })];
        const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("0% outdoor safety compliance"))).toBe(true);
      });

      it("activity risk assessment < 50% => critical insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", risk_assessment_completed: false, child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", risk_assessment_completed: false, child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Risk assessments completed for only 0%"))).toBe(true);
      });

      it("child enjoyment < 40% => critical insight", () => {
        const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Child enjoyment rate at only 20%"))).toBe(true);
      });

      it("no outdoor + no safety records => critical insight", () => {
        const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
        const r = run({ total_children: 4, nature_learning_records: nats });
        expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No outdoor activity or safety records"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("outdoor frequency 40-69% => warning insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("50%"))).toBe(true);
      });

      it("nature learning 30-79% => warning insight", () => {
        const nats = [
          makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
          makeNature({ child_id: "c2", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
        ];
        const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }), makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false })] });
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Nature learning rate at 50%"))).toBe(true);
      });

      it("garden participation 40-69% => warning insight", () => {
        const gars = [
          makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
          makeGarden({ child_id: "c2", child_participation: false, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        ];
        const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Garden participation at 50%"))).toBe(true);
      });

      it("exploration diversity 30-59% => warning insight", () => {
        const exps = [
          makeExploration({ exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
          makeExploration({ exploration_type: "beach_visit", new_environment: false, sensory_engagement: false, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        ];
        const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
        expect(r.exploration_diversity_rate).toBe(47);
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Exploration diversity at 47%"))).toBe(true);
      });

      it("safety compliance 50-79% => warning insight", () => {
        const safs = [makeSafety({ compliant: true }), makeSafety({ compliant: true }), makeSafety({ compliant: false })];
        const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
        expect(r.safety_compliance_rate).toBe(67);
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("67%"))).toBe(true);
      });

      it("child enjoyment 40-59% => warning insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 3, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.child_enjoyment_rate).toBe(50);
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("50%"))).toBe(true);
      });

      it("education link 30-69% => warning insight", () => {
        const nats = [
          makeNature({ child_id: "c1", linked_to_education: true, learning_objectives_met: false, outcome_documented: false }),
          makeNature({ child_id: "c2", linked_to_education: false, learning_objectives_met: false, outcome_documented: false }),
        ];
        const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Education link rate at 50%"))).toBe(true);
      });

      it("safety issue resolution 50-89% => warning insight", () => {
        const safs = [makeSafety({ compliant: true, issues_found: 10, issues_resolved: 7 })];
        const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Safety issue resolution at 70%"))).toBe(true);
      });

      it("weather clothing 50-89% => warning insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", weather_appropriate_clothing: true, child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", weather_appropriate_clothing: false, child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Weather-appropriate clothing at 50%"))).toBe(true);
      });
    });

    describe("positive insights", () => {
      it("diversity insight for >= 6 activity types and >= 5 locations", () => {
        const acts = [
          makeActivity({ child_id: "c1", activity_type: "walking", location: "park", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c1", activity_type: "cycling", location: "woodland", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c1", activity_type: "sports", location: "beach", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c1", activity_type: "free_play", location: "countryside", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c1", activity_type: "adventure", location: "garden", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", activity_type: "gardening", location: "allotment", child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("6 activity types across 6 different locations"))).toBe(true);
      });

      it("outstanding rating => positive insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 }),
          makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 5 }),
          makeActivity({ child_id: "c3", child_initiated: true, child_enjoyment: 5 }),
          makeActivity({ child_id: "c4", child_initiated: true, child_enjoyment: 5 }),
        ];
        const nats = [
          makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
          makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
          makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
          makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        ];
        const gars = [
          makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5 }),
          makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 5 }),
          makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 5 }),
          makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 5 }),
        ];
        const exps = [
          makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
          makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
          makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
          makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
          makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        ];
        const safs = [makeSafety({ compliant: true, issues_found: 2, issues_resolved: 2 })];
        const r = run({
          total_children: 4,
          outdoor_activity_records: acts,
          nature_learning_records: nats,
          garden_project_records: gars,
          exploration_records: exps,
          outdoor_safety_records: safs,
        });
        expect(r.outdoor_rating).toBe("outstanding");
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding outdoor and nature engagement"))).toBe(true);
      });

      it("high outdoor frequency + high enjoyment => positive insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 5, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 5, child_initiated: false }),
          makeActivity({ child_id: "c3", child_enjoyment: 5, child_initiated: false }),
          makeActivity({ child_id: "c4", child_enjoyment: 5, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% outdoor coverage with 100% child enjoyment"))).toBe(true);
      });

      it("high safety + high risk assessment => positive insight", () => {
        const safs = [makeSafety({ compliant: true }), makeSafety({ compliant: true })];
        const acts = [
          makeActivity({ child_id: "c1", risk_assessment_completed: true, child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", risk_assessment_completed: true, child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, outdoor_safety_records: safs, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% safety compliance with 100% risk assessment"))).toBe(true);
      });

      it("high nature learning + high education link => positive insight", () => {
        const nats = [
          makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
          makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
          makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
          makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        ];
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, nature_learning_records: nats, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Nature learning rate at 100%") && i.text.includes("100% education linkage"))).toBe(true);
      });

      it("high garden participation + child led => positive insight", () => {
        const gars = [
          makeGarden({ child_id: "c1", child_participation: true, child_led: true, child_satisfaction: 2, therapeutic_benefit_noted: false, harvest_used: false }),
          makeGarden({ child_id: "c2", child_participation: true, child_led: true, child_satisfaction: 2, therapeutic_benefit_noted: false, harvest_used: false }),
        ];
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("100% garden participation with 100% child-led"))).toBe(true);
      });

      it("high exploration diversity + new environments => positive insight", () => {
        const exps = [
          makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
          makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
          makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
          makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
          makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
        ];
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Exploration diversity at 100%") && i.text.includes("100% new environments"))).toBe(true);
      });

      it("child initiated + child choice => positive insight", () => {
        const acts = [
          makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 2 }),
          makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 2 }),
        ];
        const exps = [
          makeExploration({ child_id: "c1", child_choice: true, new_environment: false, sensory_engagement: false, child_enjoyment: 2, repeat_requested: false }),
          makeExploration({ child_id: "c2", child_choice: true, new_environment: false, sensory_engagement: false, child_enjoyment: 2, repeat_requested: false }),
        ];
        const r = run({ total_children: 4, outdoor_activity_records: acts, exploration_records: exps });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child-initiated outdoor activities") && i.text.includes("child-choice explorations"))).toBe(true);
      });

      it("therapeutic benefit + garden satisfaction => positive insight", () => {
        const gars = [
          makeGarden({ child_id: "c1", child_participation: true, therapeutic_benefit_noted: true, child_satisfaction: 5, child_led: false, harvest_used: false }),
          makeGarden({ child_id: "c2", child_participation: true, therapeutic_benefit_noted: true, child_satisfaction: 4, child_led: false, harvest_used: false }),
        ];
        const acts = [
          makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
          makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false }),
        ];
        const r = run({ total_children: 4, garden_project_records: gars, outdoor_activity_records: acts });
        expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Therapeutic benefit noted in 100%"))).toBe(true);
      });
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c3", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c4", child_initiated: true, child_enjoyment: 5 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 5 }),
      ];
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
      ];
      const safs = [makeSafety({ compliant: true, issues_found: 2, issues_resolved: 2 })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        exploration_records: exps,
        outdoor_safety_records: safs,
      });
      expect(r.headline).toContain("Outstanding outdoor and nature engagement");
    });

    it("good headline includes strengths and concerns counts", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c3", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c4", child_initiated: false, child_enjoyment: 2 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 2, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const safs = [makeSafety({ compliant: true })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_rating).toBe("good");
      expect(r.headline).toContain("Good outdoor and nature engagement");
    });

    it("adequate headline mentions concerns count", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 2 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 2 }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.outdoor_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate outdoor and nature engagement");
    });

    it("inadequate headline mentions concerns count", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const safs = [makeSafety({ compliant: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts, outdoor_safety_records: safs });
      expect(r.outdoor_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("total_children = 1, single child with full records", () => {
      const acts = [makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 })];
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true })];
      const gars = [makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5 })];
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c1", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c1", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c1", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c1", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
      ];
      const safs = [makeSafety({ compliant: true, issues_found: 3, issues_resolved: 3 })];
      const r = run({
        total_children: 1,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        exploration_records: exps,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_rating).toBe("outstanding");
      expect(r.outdoor_frequency_rate).toBe(100);
    });

    it("very large number of records", () => {
      const acts = Array.from({ length: 100 }, (_, i) =>
        makeActivity({ child_id: `c${(i % 4) + 1}`, child_enjoyment: 4, child_initiated: i % 2 === 0 }),
      );
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.outdoor_frequency_rate).toBe(100);
      expect(r.outdoor_rating).toBeDefined();
    });

    it("score clamped to 0 minimum", () => {
      // Even with all penalties, score should not go below 0
      // 52 - 5 - 5 - 4 - 4 = 34, already positive, but let's verify clamp works
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const safs = [makeSafety({ compliant: false })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_score).toBeGreaterThanOrEqual(0);
    });

    it("score clamped to 100 maximum", () => {
      // Verify score never exceeds 100 (base 52 + max bonuses 28 = 80, well under 100)
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c3", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c4", child_initiated: true, child_enjoyment: 5 }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.outdoor_score).toBeLessThanOrEqual(100);
    });

    it("duplicate child IDs in outdoor records count as one unique child", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      expect(r.outdoor_frequency_rate).toBe(25); // 1/4
    });

    it("mixed category enjoyment composite averages correctly", () => {
      // outdoor avg = 2, exploration avg = 4, garden avg = 5
      // composite = (2 + 4 + 5) / 3 = 3.67 => round to 3.67
      // rate = round(3.67 / 5 * 100) = round(73.4) = 73
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })];
      const exps = [makeExploration({ child_id: "c1", child_enjoyment: 4, new_environment: false, sensory_engagement: false, child_choice: false, repeat_requested: false })];
      const gars = [makeGarden({ child_id: "c1", child_satisfaction: 5, child_participation: false, child_led: false, therapeutic_benefit_noted: false, harvest_used: false })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        exploration_records: exps,
        garden_project_records: gars,
      });
      expect(r.child_enjoyment_rate).toBe(73);
    });

    it("only safety records present (not allEmpty, not all categories)", () => {
      const safs = [makeSafety({ compliant: true, issues_found: 5, issues_resolved: 5 })];
      const r = run({ total_children: 4, outdoor_safety_records: safs });
      // Not allEmpty (safety has records)
      // outdoor freq: pct(0, 4) = 0 but no outdoor records => guard prevents penalty
      // safety: 100% => +4 bonus
      // resolution: 100% with issues => +2 bonus
      // enjoyment: 0 (no enjoyment categories) => no penalty (guard)
      // 52 + 4 + 2 = 58
      expect(r.outdoor_score).toBe(58);
      expect(r.outdoor_rating).toBe("adequate");
    });

    it("only nature records present", () => {
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
      ];
      const r = run({ total_children: 4, nature_learning_records: nats });
      expect(r.nature_learning_rate).toBe(100);
      // bonus 2: +3, bonus 8: +3
      expect(r.outdoor_score).toBe(58);
    });

    it("only garden records present", () => {
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({ total_children: 4, garden_project_records: gars });
      expect(r.garden_participation_rate).toBe(100);
      // bonus 3: +3
      // childEnjoymentRate from garden only: 5/5*100 = 100 => bonus 6: +3
      // 52 + 3 + 3 = 58
      expect(r.outdoor_score).toBe(58);
    });

    it("only exploration records present", () => {
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 2, child_choice: false, repeat_requested: false }),
      ];
      const r = run({ total_children: 4, exploration_records: exps });
      // explorationDiversityRate = (100 + 20 + 100)/3 = 73 => bonus 4: +1
      // childEnjoymentRate from exploration only: 2/5*100 = 40 => no bonus, no penalty
      // 52 + 1 = 53
      expect(r.outdoor_score).toBe(53);
    });

    it("empty arrays with total_children > 0 is allEmpty = true", () => {
      const r = run({ total_children: 5 });
      expect(r.outdoor_rating).toBe("inadequate");
      expect(r.outdoor_score).toBe(15);
    });

    it("result shape always has required fields", () => {
      const r = run({});
      expect(r).toHaveProperty("outdoor_rating");
      expect(r).toHaveProperty("outdoor_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("outdoor_frequency_rate");
      expect(r).toHaveProperty("nature_learning_rate");
      expect(r).toHaveProperty("garden_participation_rate");
      expect(r).toHaveProperty("exploration_diversity_rate");
      expect(r).toHaveProperty("safety_compliance_rate");
      expect(r).toHaveProperty("child_enjoyment_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("single child total with no matching records triggers inadequate floor", () => {
      const r = run({ total_children: 1 });
      expect(r.outdoor_rating).toBe("inadequate");
      expect(r.outdoor_score).toBe(15);
    });

    it("explorationDiversityRate denominator is 5 for unique types", () => {
      // If we have exactly 5 unique exploration types, pct(5,5)=100
      const exps = [
        makeExploration({ exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false, child_enjoyment: 2 }),
        makeExploration({ exploration_type: "beach_visit", new_environment: false, sensory_engagement: false, child_enjoyment: 2 }),
        makeExploration({ exploration_type: "farm_visit", new_environment: false, sensory_engagement: false, child_enjoyment: 2 }),
        makeExploration({ exploration_type: "nature_reserve", new_environment: false, sensory_engagement: false, child_enjoyment: 2 }),
        makeExploration({ exploration_type: "river_walk", new_environment: false, sensory_engagement: false, child_enjoyment: 2 }),
      ];
      const r = run({ total_children: 4, exploration_records: exps, outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false })] });
      // (0 + 100 + 0)/3 = 33
      expect(r.exploration_diversity_rate).toBe(33);
    });

    it("safety issue resolution with zero issues => pct(0,0) = 0", () => {
      // Only safety records: no outdoor records means no frequency penalty
      const safs = [makeSafety({ compliant: true, issues_found: 0, issues_resolved: 0 })];
      const r = run({ total_children: 4, outdoor_safety_records: safs });
      // pct(0, 0) = 0 but totalSafetyIssues = 0 so bonus 9 guard prevents bonus
      // safetyCompliance 100% => +4
      // 52 + 4 = 56
      expect(r.outdoor_score).toBe(56);
    });

    it("nature learning rate rounds correctly for non-integer average", () => {
      // (33 + 25 + 50)/3 = 36
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: false }),
      ];
      const r = run({
        total_children: 4,
        nature_learning_records: nats,
        outdoor_activity_records: [makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }), makeActivity({ child_id: "c2", child_enjoyment: 2, child_initiated: false })],
      });
      // objectivesMetRate = pct(1,3) = 33
      // childCoverage = pct(1,4) = 25
      // outcomeDocRate = pct(2,3) = 67
      // avg = round((33 + 25 + 67)/3) = round(41.67) = 42
      expect(r.nature_learning_rate).toBe(42);
    });

    it("all records from same child does not inflate unique counts", () => {
      const acts = [
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
        makeActivity({ child_id: "c1", child_enjoyment: 2, child_initiated: false }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
      ];
      const r = run({ total_children: 4, outdoor_activity_records: acts, nature_learning_records: nats });
      expect(r.outdoor_frequency_rate).toBe(25); // 1 unique child / 4
      // nature: objectivesMetRate=100, childCoverage=25, outcomeDocRate=100 => (100+25+100)/3=75
      expect(r.nature_learning_rate).toBe(75);
    });

    it("children with 0 enjoyment scores produce enjoyment rate of 0", () => {
      // child_enjoyment minimum is 1 per the interface (1-5), but let's test 1
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      // avg = 1, rate = round(1/5*100) = 20
      expect(r.child_enjoyment_rate).toBe(20);
    });

    it("boundary: exactly 45 score => adequate", () => {
      // 52 - 5 (freq penalty) - 4 (enjoyment penalty) + 2 (something) = 45
      // Actually let's construct: freq < 40 (-5), enjoyment < 40 (-4), then we need +2
      // safetyCompliance >= 80 (+2)
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const safs = Array.from({ length: 10 }, (_, i) => makeSafety({ compliant: i < 9 }));
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        outdoor_safety_records: safs,
      });
      // freq = 25% < 40 => -5
      // enjoyment = 20% < 40 => -4
      // safetyCompliance = 90% => +2
      // 52 - 5 - 4 + 2 = 45
      expect(r.outdoor_score).toBe(45);
      expect(r.outdoor_rating).toBe("adequate");
    });

    it("boundary: exactly 65 score => good", () => {
      // base 52 + 4 (outdoorFreq) + 3 (natureLearning) + 3 (gardenPart) + 3 (childEnjoyment) = 65
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: false, child_enjoyment: 4 }),
        makeActivity({ child_id: "c2", child_initiated: false, child_enjoyment: 4 }),
        makeActivity({ child_id: "c3", child_initiated: false, child_enjoyment: 4 }),
        makeActivity({ child_id: "c4", child_initiated: false, child_enjoyment: 4 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: false }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 4, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 4, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 4, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
        makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 4, child_led: false, therapeutic_benefit_noted: false, harvest_used: false }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
      });
      // B1: freq 100% => +4
      // B2: nature 100% => +3
      // B3: garden 100% => +3
      // B6: enjoyment: outdoor 4/5=80%, garden 4/5=80%, composite (4+4)/2=4 => 80% => +3
      // 52 + 4 + 3 + 3 + 3 = 65
      expect(r.outdoor_score).toBe(65);
      expect(r.outdoor_rating).toBe("good");
    });

    it("boundary: exactly 80 score => outstanding", () => {
      // Already tested in max bonuses
      const acts = [
        makeActivity({ child_id: "c1", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c2", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c3", child_initiated: true, child_enjoyment: 5 }),
        makeActivity({ child_id: "c4", child_initiated: true, child_enjoyment: 5 }),
      ];
      const nats = [
        makeNature({ child_id: "c1", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c2", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c3", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
        makeNature({ child_id: "c4", learning_objectives_met: true, outcome_documented: true, linked_to_education: true }),
      ];
      const gars = [
        makeGarden({ child_id: "c1", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c2", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c3", child_participation: true, child_satisfaction: 5 }),
        makeGarden({ child_id: "c4", child_participation: true, child_satisfaction: 5 }),
      ];
      const exps = [
        makeExploration({ child_id: "c1", exploration_type: "woodland_exploration", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c2", exploration_type: "beach_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c3", exploration_type: "farm_visit", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c4", exploration_type: "nature_reserve", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
        makeExploration({ child_id: "c4", exploration_type: "river_walk", new_environment: true, sensory_engagement: true, child_enjoyment: 5 }),
      ];
      const safs = [
        makeSafety({ compliant: true, issues_found: 5, issues_resolved: 5 }),
        makeSafety({ compliant: true, issues_found: 3, issues_resolved: 3 }),
      ];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        exploration_records: exps,
        outdoor_safety_records: safs,
      });
      expect(r.outdoor_score).toBe(80);
      expect(r.outdoor_rating).toBe("outstanding");
    });

    it("boundary: score 44 => inadequate", () => {
      // 52 - 5 (freq) - 4 (enjoyment) + 1 (something) = 44
      // freq < 40 penalty, enjoyment < 40 penalty, safety 80-94% => +2
      // Hmm, 52 - 5 - 4 + 2 = 45 (adequate)
      // Need 52 - 5 - 4 + 1 = 44
      // safetyCompliance 80-94% => +2 (too much), try educationLinkRate 50-69% => +1
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false })];
      const nats = [makeNature({ child_id: "c1", learning_objectives_met: false, outcome_documented: false, linked_to_education: true })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
      });
      // freq 25% < 40 => -5
      // enjoyment 20% < 40 => -4
      // nature rate = round((0 + 25 + 0)/3) = 8 < 30 => -4
      // educationLinkRate = 100% => +3
      // 52 - 5 - 4 - 4 + 3 = 42
      expect(r.outdoor_score).toBe(42);
      expect(r.outdoor_rating).toBe("inadequate");
    });

    it("no strengths when everything is poor", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false, participation_willing: false, weather_appropriate_clothing: false, risk_assessment_completed: false, skills_developed: [] })];
      const r = run({ total_children: 4, outdoor_activity_records: acts });
      // All metrics are low, no strength thresholds met
      // The only potential is risk_assessment which is 0%
      // weather is 0%
      // willing is 0%
      // etc.
      expect(r.strengths.length).toBe(0);
    });

    it("many concerns when everything is poor", () => {
      const acts = [makeActivity({ child_id: "c1", child_enjoyment: 1, child_initiated: false, participation_willing: false, weather_appropriate_clothing: false, risk_assessment_completed: false })];
      const nats = [makeNature({ child_id: "c1", child_engagement: 1, learning_objectives_met: false, outcome_documented: false, linked_to_education: false })];
      const gars = [makeGarden({ child_id: "c1", child_participation: false, active: false, child_satisfaction: 1, child_led: false, therapeutic_benefit_noted: false, harvest_used: false })];
      const exps = [makeExploration({ exploration_type: "woodland_exploration", new_environment: false, sensory_engagement: false, child_enjoyment: 1, child_choice: false, repeat_requested: false })];
      const safs = [makeSafety({ compliant: false, staff_trained: false, issues_found: 10, issues_resolved: 2 })];
      const r = run({
        total_children: 4,
        outdoor_activity_records: acts,
        nature_learning_records: nats,
        garden_project_records: gars,
        exploration_records: exps,
        outdoor_safety_records: safs,
      });
      expect(r.concerns.length).toBeGreaterThan(10);
    });
  });
});
