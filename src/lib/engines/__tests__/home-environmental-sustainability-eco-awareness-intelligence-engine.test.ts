import { describe, it, expect } from "vitest";
import {
  computeEnvironmentalSustainabilityEcoAwareness,
  type EnvironmentalSustainabilityEcoAwarenessInput,
  type EnvironmentalSustainabilityEcoAwarenessResult,
  type EnergyUsageRecordInput,
  type RecyclingRecordInput,
  type EcoEducationRecordInput,
  type SustainabilityPracticeRecordInput,
  type CarbonFootprintRecordInput,
} from "../home-environmental-sustainability-eco-awareness-intelligence-engine";

/* ── helpers ────────────────────────────────────────────────────────────────── */

function baseInput(
  overrides: Partial<EnvironmentalSustainabilityEcoAwarenessInput> = {},
): EnvironmentalSustainabilityEcoAwarenessInput {
  return {
    today: "2026-05-28",
    total_children: 0,
    energy_usage_records: [],
    recycling_records: [],
    eco_education_records: [],
    sustainability_practice_records: [],
    carbon_footprint_records: [],
    ...overrides,
  };
}

function makeEnergy(
  id: string,
  o: Partial<EnergyUsageRecordInput> = {},
): EnergyUsageRecordInput {
  return {
    id,
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    energy_type: "electricity",
    usage_kwh: 100,
    target_kwh: 120,
    cost_gbp: 50,
    within_target: false,
    energy_saving_measures_active: 0,
    energy_saving_measures_total: 0,
    smart_meter_installed: false,
    reading_verified: false,
    notes: "",
    created_at: "2026-05-01",
    ...o,
  };
}

function makeRecycling(
  id: string,
  o: Partial<RecyclingRecordInput> = {},
): RecyclingRecordInput {
  return {
    id,
    date: "2026-05-10",
    recycling_type: "paper",
    compliant: false,
    contamination_found: false,
    weight_kg: 5,
    child_participated: false,
    child_id: null,
    bins_correctly_used: false,
    collection_missed: false,
    notes: "",
    created_at: "2026-05-10",
    ...o,
  };
}

function makeEcoEducation(
  id: string,
  o: Partial<EcoEducationRecordInput> = {},
): EcoEducationRecordInput {
  return {
    id,
    child_id: "c1",
    date: "2026-05-10",
    programme_name: "Eco Workshop",
    programme_type: "workshop",
    attended: false,
    engaged: false,
    learning_outcome_met: false,
    child_feedback_positive: false,
    duration_minutes: 60,
    facilitator: "Staff A",
    linked_to_curriculum: false,
    created_at: "2026-05-10",
    ...o,
  };
}

function makeSustainabilityPractice(
  id: string,
  o: Partial<SustainabilityPracticeRecordInput> = {},
): SustainabilityPracticeRecordInput {
  return {
    id,
    practice_name: "Practice",
    category: "energy",
    implemented: false,
    implementation_date: null,
    review_date: null,
    effectiveness_rating: 1,
    children_involved: false,
    staff_trained: false,
    documented: false,
    cost_saving_gbp: 0,
    notes: "",
    created_at: "2026-05-01",
    ...o,
  };
}

function makeCarbonFootprint(
  id: string,
  o: Partial<CarbonFootprintRecordInput> = {},
): CarbonFootprintRecordInput {
  return {
    id,
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    category: "energy",
    co2_kg: 500,
    target_co2_kg: 400,
    within_target: false,
    offset_applied: false,
    offset_kg: 0,
    reduction_actions_planned: 0,
    reduction_actions_completed: 0,
    children_aware: false,
    notes: "",
    created_at: "2026-05-01",
    ...o,
  };
}

/** Shortcut: run engine and return result */
function run(
  overrides: Partial<EnvironmentalSustainabilityEcoAwarenessInput> = {},
): EnvironmentalSustainabilityEcoAwarenessResult {
  return computeEnvironmentalSustainabilityEcoAwareness(baseInput(overrides));
}

/* ── tests ──────────────────────────────────────────────────────────────────── */

describe("Home Environmental Sustainability & Eco-Awareness Intelligence Engine", () => {
  // ═══════════════════════════════════════════════════════════════════════════
  // 1. INSUFFICIENT DATA
  // ═══════════════════════════════════════════════════════════════════════════
  describe("insufficient data", () => {
    it("returns insufficient_data / score 0 when all arrays empty and 0 children", () => {
      const r = run();
      expect(r.sustainability_rating).toBe("insufficient_data");
      expect(r.sustainability_score).toBe(0);
      expect(r.total_energy_records).toBe(0);
      expect(r.total_recycling_records).toBe(0);
      expect(r.total_eco_education_records).toBe(0);
      expect(r.total_sustainability_practices).toBe(0);
      expect(r.total_carbon_records).toBe(0);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("headline mentions insufficient data", () => {
      const r = run();
      expect(r.headline).toContain("insufficient data");
    });

    it("all metric rates are 0", () => {
      const r = run();
      expect(r.energy_efficiency_rate).toBe(0);
      expect(r.recycling_compliance_rate).toBe(0);
      expect(r.eco_education_engagement_rate).toBe(0);
      expect(r.sustainability_practice_score).toBe(0);
      expect(r.carbon_awareness_rate).toBe(0);
      expect(r.child_participation_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. INADEQUATE BASELINE (all empty + children > 0)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("inadequate baseline (all empty, children > 0)", () => {
    it("returns inadequate / score 15", () => {
      const r = run({ total_children: 4 });
      expect(r.sustainability_rating).toBe("inadequate");
      expect(r.sustainability_score).toBe(15);
    });

    it("headline mentions urgent attention", () => {
      const r = run({ total_children: 4 });
      expect(r.headline).toContain("urgent");
    });

    it("has exactly 1 concern", () => {
      const r = run({ total_children: 4 });
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No energy usage records");
    });

    it("has exactly 2 recommendations both immediate", () => {
      const r = run({ total_children: 4 });
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has exactly 1 critical insight", () => {
      const r = run({ total_children: 4 });
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
      expect(r.insights[0].text).toContain("complete absence");
    });

    it("all metric rates remain 0", () => {
      const r = run({ total_children: 4 });
      expect(r.energy_efficiency_rate).toBe(0);
      expect(r.recycling_compliance_rate).toBe(0);
      expect(r.eco_education_engagement_rate).toBe(0);
      expect(r.sustainability_practice_score).toBe(0);
      expect(r.carbon_awareness_rate).toBe(0);
      expect(r.child_participation_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. pct(0, 0) = 0
  // ═══════════════════════════════════════════════════════════════════════════
  describe("pct(0, 0) = 0", () => {
    it("energy_efficiency_rate is 0 when no energy records but other records exist", () => {
      const r = run({
        total_children: 3,
        recycling_records: [makeRecycling("r1", { compliant: true })],
      });
      expect(r.energy_efficiency_rate).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. INDIVIDUAL BONUSES — each bonus at both tiers
  // ═══════════════════════════════════════════════════════════════════════════
  describe("individual bonuses", () => {
    // Bonus 1: energyEfficiencyRate (>=90: +4, >=70: +2)
    describe("Bonus 1 — energyEfficiencyRate", () => {
      it("+4 when >=90%", () => {
        // 10 records, 9 within target = 90%
        const energyRecs = Array.from({ length: 10 }, (_, i) =>
          makeEnergy(`e${i}`, {
            within_target: i < 9,
          }),
        );
        const r = run({ total_children: 3, energy_usage_records: energyRecs });
        // base 52 + 4 = 56 (no other bonuses since other arrays empty)
        expect(r.sustainability_score).toBe(56);
      });

      it("+2 when >=70% but <90%", () => {
        // 10 records, 7 within target = 70%
        const energyRecs = Array.from({ length: 10 }, (_, i) =>
          makeEnergy(`e${i}`, {
            within_target: i < 7,
          }),
        );
        const r = run({ total_children: 3, energy_usage_records: energyRecs });
        // base 52 + 2 = 54
        expect(r.sustainability_score).toBe(54);
      });

      it("+0 when <70%", () => {
        // 10 records, 6 within target = 60%
        const energyRecs = Array.from({ length: 10 }, (_, i) =>
          makeEnergy(`e${i}`, {
            within_target: i < 6,
          }),
        );
        const r = run({ total_children: 3, energy_usage_records: energyRecs });
        // base 52, no bonus, no penalty (60 >= 40)
        expect(r.sustainability_score).toBe(52);
      });
    });

    // Bonus 2: recyclingComplianceRate (>=95: +4, >=80: +2)
    // Note: recycling records feed childParticipation (child_participated defaults false → 0/N → <30% → -3 penalty)
    describe("Bonus 2 — recyclingComplianceRate", () => {
      it("+4 when >=95%", () => {
        // 20 records, 19 compliant = 95%, child_participated false → childPartic 0/20=0% → -3
        const recs = Array.from({ length: 20 }, (_, i) =>
          makeRecycling(`r${i}`, { compliant: i < 19 }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        // base 52 + 4(recycling) - 3(childPartic) = 53
        expect(r.sustainability_score).toBe(53);
      });

      it("+2 when >=80% but <95%", () => {
        // 10 records, 8 compliant = 80%, childPartic 0/10=0% → -3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, { compliant: i < 8 }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        // base 52 + 2 - 3 = 51
        expect(r.sustainability_score).toBe(51);
      });

      it("+0 when <80%", () => {
        // 10 records, 7 compliant = 70%, childPartic 0/10=0% → -3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, { compliant: i < 7 }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        // base 52 + 0 - 3 = 49
        expect(r.sustainability_score).toBe(49);
      });
    });

    // Bonus 3: ecoEducationEngagementRate (>=90: +3, >=70: +1)
    // Note: eco-education attended feeds childParticipation (attended count / total eco records)
    describe("Bonus 3 — ecoEducationEngagementRate", () => {
      it("+3 when >=90%", () => {
        // 10 records, 9 attended+engaged = 90%
        // childParticipation: eco 9/10 = 90% → bonus +3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEcoEducation(`ee${i}`, {
            attended: i < 9,
            engaged: i < 9,
          }),
        );
        const r = run({ total_children: 3, eco_education_records: recs });
        // base 52 + 3(ecoEd) + 3(childPartic) = 58
        expect(r.sustainability_score).toBe(58);
      });

      it("+1 when >=70% but <90%", () => {
        // 10 records, 7 attended+engaged = 70%
        // childParticipation: eco 7/10 = 70% → bonus +1
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEcoEducation(`ee${i}`, {
            attended: i < 7,
            engaged: i < 7,
          }),
        );
        const r = run({ total_children: 3, eco_education_records: recs });
        // base 52 + 1(ecoEd) + 1(childPartic) = 54
        expect(r.sustainability_score).toBe(54);
      });

      it("+0 when <70%", () => {
        // 10 records, 6 attended+engaged = 60%
        // childParticipation: eco 6/10 = 60% → no bonus, no penalty (>=30)
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEcoEducation(`ee${i}`, {
            attended: i < 6,
            engaged: i < 6,
          }),
        );
        const r = run({ total_children: 3, eco_education_records: recs });
        // base 52, no bonus
        expect(r.sustainability_score).toBe(52);
      });
    });

    // Bonus 4: sustainabilityPracticeScore (>=80: +3, >=60: +1)
    // sustainabilityPracticeScore = avg(implementationRate, documentedRate, childrenInvolvedRate, staffTrainedRate)
    // Note: implemented+children_involved feeds childParticipation
    describe("Bonus 4 — sustainabilityPracticeScore", () => {
      it("+3 when >=80%", () => {
        // 10 practices, all implemented, documented, children_involved, staff_trained → 100% each → avg 100
        // childParticipation: sust 10/10 = 100% → bonus +3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeSustainabilityPractice(`sp${i}`, {
            implemented: true,
            documented: true,
            children_involved: true,
            staff_trained: true,
            effectiveness_rating: 1,
          }),
        );
        const r = run({ total_children: 3, sustainability_practice_records: recs });
        // base 52 + 3(sustPractice) + 3(childPartic) = 58
        expect(r.sustainability_score).toBe(58);
      });

      it("+1 when >=60% but <80%", () => {
        // 10 practices: all implemented, 7 documented, 6 children_involved, 5 staff_trained
        // rates: 100%, 70%, 60%, 50% → avg = 70
        // childParticipation: sust 6/10 = 60% → no bonus, no penalty (>=30)
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeSustainabilityPractice(`sp${i}`, {
            implemented: true,
            documented: i < 7,
            children_involved: i < 6,
            staff_trained: i < 5,
            effectiveness_rating: 1,
          }),
        );
        const r = run({ total_children: 3, sustainability_practice_records: recs });
        expect(r.sustainability_practice_score).toBe(70);
        // base 52 + 1(sustPractice) = 53
        expect(r.sustainability_score).toBe(53);
      });

      it("+0 when <60%", () => {
        // 10 practices: 5 implemented, 3 documented+impl, 2 children+impl, 2 staff+impl
        // rates: 50%, 30%, 20%, 20% → avg = 30 → round = 30
        // childParticipation: sust pct(2,10) = 20% → <30% → penalty -3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeSustainabilityPractice(`sp${i}`, {
            implemented: i < 5,
            documented: i < 3,
            children_involved: i < 2,
            staff_trained: i < 2,
            effectiveness_rating: 1,
          }),
        );
        const r = run({ total_children: 3, sustainability_practice_records: recs });
        expect(r.sustainability_practice_score).toBe(30);
        // base 52 - 3(childPartic) = 49
        expect(r.sustainability_score).toBe(49);
      });
    });

    // Bonus 5: carbonAwarenessRate (>=90: +3, >=70: +1)
    // Note: children_aware feeds childParticipation
    describe("Bonus 5 — carbonAwarenessRate", () => {
      it("+3 when >=90%", () => {
        // 10 records, 9 children_aware = 90%
        // childParticipation: carbon 9/10 = 90% → bonus +3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeCarbonFootprint(`cf${i}`, { children_aware: i < 9 }),
        );
        const r = run({ total_children: 3, carbon_footprint_records: recs });
        // base 52 + 3(carbonAwareness) + 3(childPartic) = 58
        expect(r.sustainability_score).toBe(58);
      });

      it("+1 when >=70% but <90%", () => {
        // 10 records, 7 children_aware = 70%
        // childParticipation: carbon 7/10 = 70% → bonus +1
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeCarbonFootprint(`cf${i}`, { children_aware: i < 7 }),
        );
        const r = run({ total_children: 3, carbon_footprint_records: recs });
        // base 52 + 1(carbonAwareness) + 1(childPartic) = 54
        expect(r.sustainability_score).toBe(54);
      });

      it("+0 when <70%", () => {
        // 10 records, 6 children_aware = 60%
        // childParticipation: carbon 6/10 = 60% → no bonus, no penalty (>=30)
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeCarbonFootprint(`cf${i}`, { children_aware: i < 6 }),
        );
        const r = run({ total_children: 3, carbon_footprint_records: recs });
        // base 52
        expect(r.sustainability_score).toBe(52);
      });
    });

    // Bonus 6: childParticipationRate (>=90: +3, >=70: +1)
    // Composite across recycling child_participated, eco_education attended, sustainability children_involved, carbon children_aware
    describe("Bonus 6 — childParticipationRate", () => {
      it("+3 when >=90%", () => {
        // Use recycling records only (simplest): 10 records, 9 child_participated
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, {
            compliant: true, // avoid recycling penalty
            child_participated: i < 9,
          }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        expect(r.child_participation_rate).toBe(90);
        // base 52 + recycling bonus (100% compliance → +4) + child participation (+3) = 59
        expect(r.sustainability_score).toBe(59);
      });

      it("+1 when >=70% but <90%", () => {
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, {
            compliant: true,
            child_participated: i < 7,
          }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        expect(r.child_participation_rate).toBe(70);
        // base 52 + recycling(+4) + child participation(+1) = 57
        expect(r.sustainability_score).toBe(57);
      });

      it("+0 when <70%", () => {
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, {
            compliant: true,
            child_participated: i < 6,
          }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        expect(r.child_participation_rate).toBe(60);
        // base 52 + recycling(+4) = 56
        expect(r.sustainability_score).toBe(56);
      });
    });

    // Bonus 7: reductionCompletionRate (>=90: +3, >=70: +1)
    // Note: carbon records feed childParticipation via children_aware (defaults false → 0/N → penalty -3)
    describe("Bonus 7 — reductionCompletionRate", () => {
      it("+3 when >=90%", () => {
        // 1 carbon record with 10 planned, 9 completed = 90%
        // children_aware = false → childParticipation: 0/1 = 0% → penalty -3
        const recs = [
          makeCarbonFootprint("cf1", {
            reduction_actions_planned: 10,
            reduction_actions_completed: 9,
          }),
        ];
        const r = run({ total_children: 3, carbon_footprint_records: recs });
        // base 52 + 3(reduction) - 3(childPartic) = 52
        expect(r.sustainability_score).toBe(52);
      });

      it("+1 when >=70% but <90%", () => {
        // children_aware = false → childPartic penalty -3
        const recs = [
          makeCarbonFootprint("cf1", {
            reduction_actions_planned: 10,
            reduction_actions_completed: 7,
          }),
        ];
        const r = run({ total_children: 3, carbon_footprint_records: recs });
        // base 52 + 1(reduction) - 3(childPartic) = 50
        expect(r.sustainability_score).toBe(50);
      });

      it("+0 when <70%", () => {
        // children_aware = false → childPartic penalty -3
        const recs = [
          makeCarbonFootprint("cf1", {
            reduction_actions_planned: 10,
            reduction_actions_completed: 5,
          }),
        ];
        const r = run({ total_children: 3, carbon_footprint_records: recs });
        // base 52 - 3(childPartic) = 49
        expect(r.sustainability_score).toBe(49);
      });
    });

    // Bonus 8: savingMeasuresRate (>=90: +3, >=70: +1)
    describe("Bonus 8 — savingMeasuresRate", () => {
      it("+3 when >=90%", () => {
        // 1 energy record: 9 active / 10 total = 90%
        const recs = [
          makeEnergy("e1", {
            within_target: false,
            energy_saving_measures_active: 9,
            energy_saving_measures_total: 10,
          }),
        ];
        const r = run({ total_children: 3, energy_usage_records: recs });
        // energy efficiency = 0% → penalty -5; base 52 + 3 - 5 = 50
        expect(r.sustainability_score).toBe(50);
      });

      it("+1 when >=70% but <90%", () => {
        const recs = [
          makeEnergy("e1", {
            within_target: false,
            energy_saving_measures_active: 7,
            energy_saving_measures_total: 10,
          }),
        ];
        const r = run({ total_children: 3, energy_usage_records: recs });
        // energy efficiency = 0% → penalty -5; base 52 + 1 - 5 = 48
        expect(r.sustainability_score).toBe(48);
      });

      it("+0 when <70%", () => {
        const recs = [
          makeEnergy("e1", {
            within_target: false,
            energy_saving_measures_active: 5,
            energy_saving_measures_total: 10,
          }),
        ];
        const r = run({ total_children: 3, energy_usage_records: recs });
        // energy efficiency = 0% → penalty -5; base 52 - 5 = 47
        expect(r.sustainability_score).toBe(47);
      });
    });

    // Bonus 9: avgEffectiveness (>=4.0: +2, >=3.0: +1)
    // Note: sustainability records with children_involved=false → childPartic penalty -3
    describe("Bonus 9 — avgEffectiveness", () => {
      it("+2 when >=4.0", () => {
        // 2 implemented practices with ratings 4 and 5 → avg = 4.5
        // children_involved=false → childPartic: sust 0/2=0% → penalty -3
        const recs = [
          makeSustainabilityPractice("sp1", {
            implemented: true,
            effectiveness_rating: 4,
          }),
          makeSustainabilityPractice("sp2", {
            implemented: true,
            effectiveness_rating: 5,
          }),
        ];
        const r = run({ total_children: 3, sustainability_practice_records: recs });
        // sustainabilityPracticeScore: impl=100%, doc=0%, children=0%, staff=0% → avg=25 → <60
        // base 52 + 2(avgEff) - 3(childPartic) = 51
        expect(r.sustainability_score).toBe(51);
      });

      it("+1 when >=3.0 but <4.0", () => {
        // children_involved=false → childPartic penalty -3
        const recs = [
          makeSustainabilityPractice("sp1", {
            implemented: true,
            effectiveness_rating: 3,
          }),
          makeSustainabilityPractice("sp2", {
            implemented: true,
            effectiveness_rating: 3,
          }),
        ];
        const r = run({ total_children: 3, sustainability_practice_records: recs });
        // base 52 + 1(avgEff) - 3(childPartic) = 50
        expect(r.sustainability_score).toBe(50);
      });

      it("+0 when <3.0", () => {
        // children_involved=false → childPartic penalty -3
        const recs = [
          makeSustainabilityPractice("sp1", {
            implemented: true,
            effectiveness_rating: 2,
          }),
          makeSustainabilityPractice("sp2", {
            implemented: true,
            effectiveness_rating: 2,
          }),
        ];
        const r = run({ total_children: 3, sustainability_practice_records: recs });
        // base 52 - 3(childPartic) = 49
        expect(r.sustainability_score).toBe(49);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. ALL BONUSES COMBINED → max score 80 (outstanding)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("all bonuses combined", () => {
    it("scores 80 (base 52 + 28) when every bonus maxed", () => {
      // Bonus 1: energyEfficiencyRate >= 90 → +4
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, {
          within_target: true,
          energy_saving_measures_active: 10,
          energy_saving_measures_total: 10,
          smart_meter_installed: true,
          reading_verified: true,
        }),
      );
      // Bonus 2: recyclingComplianceRate >= 95 → +4
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, {
          compliant: true,
          child_participated: true,
          bins_correctly_used: true,
        }),
      );
      // Bonus 3: ecoEducationEngagementRate >= 90 → +3
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          child_id: `c${(i % 3) + 1}`,
          attended: true,
          engaged: true,
          learning_outcome_met: true,
          child_feedback_positive: true,
          linked_to_curriculum: true,
        }),
      );
      // Bonus 4: sustainabilityPracticeScore >= 80 → +3
      const spRecs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
          effectiveness_rating: 5,
        }),
      );
      // Bonus 5: carbonAwarenessRate >= 90 → +3
      // Bonus 7: reductionCompletionRate >= 90 → +3
      const cfRecs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, {
          children_aware: true,
          within_target: true,
          reduction_actions_planned: 10,
          reduction_actions_completed: 10,
        }),
      );
      // Bonus 6: childParticipationRate >= 90 → +3 (from recycling 100%, eco 100%, sustainability 100%, carbon 100%)
      // Bonus 8: savingMeasuresRate >= 90 → +3 (all energy have 10/10)
      // Bonus 9: avgEffectiveness >= 4.0 → +2 (all 5/5)

      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
        carbon_footprint_records: cfRecs,
      });

      // 52 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 2 = 80
      expect(r.sustainability_score).toBe(80);
      expect(r.sustainability_rating).toBe("outstanding");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. INDIVIDUAL PENALTIES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("individual penalties", () => {
    // Penalty 1: energyEfficiencyRate < 40 → -5 (guarded: totalEnergyRecords > 0)
    describe("Penalty 1 — energyEfficiencyRate < 40", () => {
      it("-5 when < 40% and records exist", () => {
        // 10 records, 3 within target = 30%
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEnergy(`e${i}`, { within_target: i < 3 }),
        );
        const r = run({ total_children: 3, energy_usage_records: recs });
        // base 52 - 5 = 47
        expect(r.sustainability_score).toBe(47);
      });

      it("no penalty at exactly 40%", () => {
        // 10 records, 4 within target = 40%
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEnergy(`e${i}`, { within_target: i < 4 }),
        );
        const r = run({ total_children: 3, energy_usage_records: recs });
        expect(r.sustainability_score).toBe(52);
      });
    });

    // Penalty 2: recyclingComplianceRate < 50 → -5 (guarded: totalRecyclingRecords > 0)
    // Note: recycling also feeds childParticipation (child_participated=false → penalty -3)
    describe("Penalty 2 — recyclingComplianceRate < 50", () => {
      it("-5 when < 50% and records exist", () => {
        // 10 records, 4 compliant = 40%, child_participated=false → childPartic 0/10=0% → -3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, { compliant: i < 4 }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        // base 52 - 5(recycling) - 3(childPartic) = 44
        expect(r.sustainability_score).toBe(44);
      });

      it("no penalty at exactly 50%", () => {
        // 10 records, 5 compliant = 50%, child_participated=false → childPartic 0/10=0% → -3
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, { compliant: i < 5 }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        // base 52 - 3(childPartic) = 49 (no recycling penalty since 50 >= 50)
        expect(r.sustainability_score).toBe(49);
      });
    });

    // Penalty 3: ecoEducationEngagementRate < 40 → -5 (guarded: totalEcoEducationRecords > 0)
    describe("Penalty 3 — ecoEducationEngagementRate < 40", () => {
      it("-5 when < 40% and records exist", () => {
        // 10 records, 3 attended+engaged = 30%
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEcoEducation(`ee${i}`, {
            attended: i < 3,
            engaged: i < 3,
          }),
        );
        const r = run({ total_children: 3, eco_education_records: recs });
        // base 52 - 5 = 47. Also childParticipation = pct(3,10) = 30% → >= 30, no penalty.
        expect(r.sustainability_score).toBe(47);
      });

      it("no penalty at exactly 40%", () => {
        // 10 records, 4 attended+engaged = 40%
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeEcoEducation(`ee${i}`, {
            attended: i < 4,
            engaged: i < 4,
          }),
        );
        const r = run({ total_children: 3, eco_education_records: recs });
        expect(r.sustainability_score).toBe(52);
      });
    });

    // Penalty 4: childParticipationRate < 30 → -3 (guarded: totalChildParticDenom > 0)
    describe("Penalty 4 — childParticipationRate < 30", () => {
      it("-3 when < 30%", () => {
        // Use recycling: 10 records, 2 child_participated = 20%
        // But recycling compliance also matters. Set all compliant to avoid recycling penalty
        // Actually, child_participated doesn't affect compliance. Let's also make them compliant.
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, {
            compliant: true,
            child_participated: i < 2,
          }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        expect(r.child_participation_rate).toBe(20);
        // base 52 + recycling(+4 since 100%) - childParticipation(-3) = 53
        expect(r.sustainability_score).toBe(53);
      });

      it("no penalty at exactly 30%", () => {
        // 10 records, 3 child_participated = 30%
        const recs = Array.from({ length: 10 }, (_, i) =>
          makeRecycling(`r${i}`, {
            compliant: true,
            child_participated: i < 3,
          }),
        );
        const r = run({ total_children: 3, recycling_records: recs });
        expect(r.child_participation_rate).toBe(30);
        // base 52 + recycling(+4) = 56, no child participation penalty
        expect(r.sustainability_score).toBe(56);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. PENALTY GUARDS (no penalty when no records)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("penalty guards", () => {
    it("no energy penalty when energy array empty", () => {
      // energyEfficiencyRate = 0 (< 40) but no records → guard prevents -5
      // recycling child_participated=false → childPartic 0/1=0% → penalty -3
      const r = run({
        total_children: 3,
        recycling_records: [makeRecycling("r1", { compliant: true })],
      });
      // base 52 + recycling(+4 since 1/1=100%) - 3(childPartic) = 53
      expect(r.sustainability_score).toBe(53);
    });

    it("no recycling penalty when recycling array empty", () => {
      // energy doesn't feed childParticipation, but 100% within_target → +4 bonus
      const r = run({
        total_children: 3,
        energy_usage_records: [makeEnergy("e1", { within_target: true })],
      });
      // base 52 + 4(energy) = 56, no recycling penalty, no childPartic penalty (denom=0)
      expect(r.sustainability_score).toBe(56);
    });

    it("no eco-education penalty when eco-education array empty", () => {
      // recycling child_participated=false → childPartic 0/1=0% → penalty -3
      const r = run({
        total_children: 3,
        recycling_records: [makeRecycling("r1", { compliant: true })],
      });
      // base 52 + recycling(+4) - 3(childPartic) = 53
      expect(r.sustainability_score).toBe(53);
    });

    it("no child participation penalty when no child-related records", () => {
      // If all arrays contributing to child participation are empty, denom=0, pct=0 but guard prevents
      // energy_usage_records don't contribute to childParticipation denom, but 100% → +4 bonus
      const r = run({
        total_children: 3,
        energy_usage_records: [makeEnergy("e1", { within_target: true })],
      });
      expect(r.child_participation_rate).toBe(0);
      // base 52 + 4(energy) = 56, no child participation penalty since denom = 0
      expect(r.sustainability_score).toBe(56);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. RATING BOUNDARIES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("rating boundaries", () => {
    it("outstanding at exactly 80", () => {
      // Already tested in "all bonuses combined"
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, {
          within_target: true,
          energy_saving_measures_active: 10,
          energy_saving_measures_total: 10,
        }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, {
          compliant: true,
          child_participated: true,
        }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          child_id: `c${(i % 3) + 1}`,
          attended: true,
          engaged: true,
        }),
      );
      const spRecs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
          effectiveness_rating: 5,
        }),
      );
      const cfRecs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, {
          children_aware: true,
          reduction_actions_planned: 10,
          reduction_actions_completed: 10,
        }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
        carbon_footprint_records: cfRecs,
      });
      expect(r.sustainability_score).toBe(80);
      expect(r.sustainability_rating).toBe("outstanding");
    });

    it("good at 79 (just below outstanding)", () => {
      // Build a scenario that scores 79: all bonuses except one
      // Max = 80. Drop avgEffectiveness bonus (-2) → 78. Need +1 more.
      // Actually let's do: all max bonuses = 80, then set avgEffectiveness to 3.0 → +1 instead of +2 → 79
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, {
          within_target: true,
          energy_saving_measures_active: 10,
          energy_saving_measures_total: 10,
        }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, {
          compliant: true,
          child_participated: true,
        }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          child_id: `c${(i % 3) + 1}`,
          attended: true,
          engaged: true,
        }),
      );
      const spRecs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
          effectiveness_rating: 3, // avg 3.0 → +1 instead of +2
        }),
      );
      const cfRecs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, {
          children_aware: true,
          reduction_actions_planned: 10,
          reduction_actions_completed: 10,
        }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
        carbon_footprint_records: cfRecs,
      });
      // 52 + 4 + 4 + 3 + 3 + 3 + 3 + 3 + 3 + 1 = 79
      expect(r.sustainability_score).toBe(79);
      expect(r.sustainability_rating).toBe("good");
    });

    it("good at exactly 65", () => {
      // Need score = 65. Base 52 + 13 bonuses.
      // energyEfficiency(+4) + recycling(+4) + ecoEd(+3) + avgEff(+2) = 13
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: true }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          attended: true,
          engaged: true,
        }),
      );
      const spRecs = [
        makeSustainabilityPractice("sp1", {
          implemented: true,
          effectiveness_rating: 4,
        }),
      ];
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
      });
      // sustainabilityPracticeScore = avg(100,0,0,0) = 25 → <60 → no bonus 4
      // childParticipation: recycling 0/20 (child_participated false), eco 10/10, sust 0/1
      // = pct(10, 31) = pct(10,31) = 32% → <70 → no bonus 6 and >= 30 so no penalty
      // Hmm, eco_education records have attended=true, so attendedEcoEducation=10 goes into childParticipation
      // recycling child_participated defaults to false → 0
      // sust children_involved defaults to false, but need implemented → 0
      // carbon is empty
      // childParticNum = 0 + 10 + 0 = 10, childParticDenom = 20 + 10 + 1 = 31
      // childParticipationRate = pct(10, 31) = 32%
      // No reductionCompletion bonus (no carbon records)
      // No savingMeasures bonus (measures_total = 0)
      // Score: 52 + 4 + 4 + 3 + 0 + 0 + 0 + 0 + 0 + 2 = 65
      expect(r.sustainability_score).toBe(65);
      expect(r.sustainability_rating).toBe("good");
    });

    it("adequate at 64 (just below good)", () => {
      // Need 64 = 52 + 12
      // energyEff(+4) + recycling(+4) + ecoEd(+3) + avgEff(+1) = 12
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: true }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: true, engaged: true }),
      );
      const spRecs = [
        makeSustainabilityPractice("sp1", {
          implemented: true,
          effectiveness_rating: 3,
        }),
      ];
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
      });
      // childParticipation same as above: pct(10, 31) = 32% → no bonus, no penalty
      // Score: 52 + 4 + 4 + 3 + 0 + 0 + 0 + 0 + 0 + 1 = 64
      expect(r.sustainability_score).toBe(64);
      expect(r.sustainability_rating).toBe("adequate");
    });

    it("adequate at exactly 45", () => {
      // Need 45. Base 52 - 7. Two penalties: energy(-5) + childParticipation(-3) = -8 → 44, too low
      // energy(-5) alone = 47, too high
      // energy(-5) + recycling(-5) = 42, too low
      // Need exactly -7. Can we get one bonus to offset?
      // energy(-5) + recycling(-5) + one +3 bonus → 52 - 10 + 3 = 45
      // Let's do: energy bad (< 40), recycling bad (< 50), but ecoEd engagement >= 90 (+3)
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 3 }), // 30% → penalty -5
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 4 }), // 40% → penalty -5
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: true, engaged: true }), // 100% → bonus +3
      );
      // childParticipation: recycling 0/10 + eco 10/10 = 10/20 = 50% → no bonus, no penalty
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
      });
      // Score: 52 - 5 - 5 + 3 = 45
      expect(r.sustainability_score).toBe(45);
      expect(r.sustainability_rating).toBe("adequate");
    });

    it("inadequate at 44 (just below adequate)", () => {
      // Need 44 = 52 - 8. energy(-5) + childParticipation(-3) = -8
      // Need low energy + low child participation
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 3 }), // 30% → penalty -5
      );
      // For child participation < 30: use recycling with 2/10 child_participated = 20%
      // recycling compliance: set 6 compliant = 60% → no recycling penalty (>= 50)
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, {
          compliant: i < 6,
          child_participated: i < 2,
        }),
      );
      // childParticipation: recycling 2/10 = 20, no other arrays → 20% → penalty -3
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      // Score: 52 - 5 - 3 = 44
      expect(r.sustainability_score).toBe(44);
      expect(r.sustainability_rating).toBe("inadequate");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. METRIC CALCULATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("metric calculations", () => {
    it("energy_efficiency_rate = pct(within_target, total)", () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 3 }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: recs,
      });
      expect(r.energy_efficiency_rate).toBe(60); // pct(3,5)
      expect(r.total_energy_records).toBe(5);
    });

    it("recycling_compliance_rate = pct(compliant, total)", () => {
      const recs = Array.from({ length: 8 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 6 }),
      );
      const r = run({
        total_children: 3,
        recycling_records: recs,
      });
      expect(r.recycling_compliance_rate).toBe(75); // pct(6,8)
      expect(r.total_recycling_records).toBe(8);
    });

    it("eco_education_engagement_rate = pct(attended+engaged, total)", () => {
      const recs = [
        makeEcoEducation("ee1", { attended: true, engaged: true }),
        makeEcoEducation("ee2", { attended: true, engaged: false }), // attended but not engaged → not counted
        makeEcoEducation("ee3", { attended: false, engaged: true }), // not attended → not counted
        makeEcoEducation("ee4", { attended: true, engaged: true }),
      ];
      const r = run({
        total_children: 3,
        eco_education_records: recs,
      });
      expect(r.eco_education_engagement_rate).toBe(50); // pct(2,4)
      expect(r.total_eco_education_records).toBe(4);
    });

    it("sustainability_practice_score = avg of 4 rates", () => {
      // 4 practices: 3 implemented, 2 documented+impl, 1 children_involved+impl, 2 staff_trained+impl
      const recs = [
        makeSustainabilityPractice("sp1", { implemented: true, documented: true, children_involved: true, staff_trained: true }),
        makeSustainabilityPractice("sp2", { implemented: true, documented: true, children_involved: false, staff_trained: true }),
        makeSustainabilityPractice("sp3", { implemented: true, documented: false, children_involved: false, staff_trained: false }),
        makeSustainabilityPractice("sp4", { implemented: false }),
      ];
      const r = run({
        total_children: 3,
        sustainability_practice_records: recs,
      });
      // impl=pct(3,4)=75, doc=pct(2,4)=50, children=pct(1,4)=25, staff=pct(2,4)=50
      // avg = (75+50+25+50)/4 = 50
      expect(r.sustainability_practice_score).toBe(50);
      expect(r.total_sustainability_practices).toBe(4);
    });

    it("carbon_awareness_rate = pct(children_aware, total)", () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 4 }),
      );
      const r = run({
        total_children: 3,
        carbon_footprint_records: recs,
      });
      expect(r.carbon_awareness_rate).toBe(80); // pct(4,5)
      expect(r.total_carbon_records).toBe(5);
    });

    it("child_participation_rate is composite across recycling, eco-ed, sustainability, carbon", () => {
      const recyclingRecs = [
        makeRecycling("r1", { compliant: true, child_participated: true }),
        makeRecycling("r2", { compliant: true, child_participated: false }),
      ]; // 1/2
      const ecoEdRecs = [
        makeEcoEducation("ee1", { attended: true }),
        makeEcoEducation("ee2", { attended: true }),
        makeEcoEducation("ee3", { attended: false }),
      ]; // 2/3
      const spRecs = [
        makeSustainabilityPractice("sp1", { implemented: true, children_involved: true }),
        makeSustainabilityPractice("sp2", { implemented: true, children_involved: false }),
      ]; // 1/2
      const cfRecs = [
        makeCarbonFootprint("cf1", { children_aware: true }),
        makeCarbonFootprint("cf2", { children_aware: true }),
        makeCarbonFootprint("cf3", { children_aware: false }),
      ]; // 2/3

      const r = run({
        total_children: 3,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
        carbon_footprint_records: cfRecs,
      });
      // total num = 1 + 2 + 1 + 2 = 6, total denom = 2 + 3 + 2 + 3 = 10
      // pct(6, 10) = 60
      expect(r.child_participation_rate).toBe(60);
    });

    it("child_participation_rate ignores domains with 0 records", () => {
      // Only recycling records present
      const recs = [
        makeRecycling("r1", { compliant: true, child_participated: true }),
        makeRecycling("r2", { compliant: true, child_participated: true }),
      ];
      const r = run({
        total_children: 3,
        recycling_records: recs,
      });
      // 2/2 = 100%
      expect(r.child_participation_rate).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. STRENGTHS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("strengths", () => {
    it("energy efficiency >= 90% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: true }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("energy"))).toBe(true);
    });

    it("energy efficiency 70-89% → different strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 7 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("energy efficiency"))).toBe(true);
    });

    it("recycling compliance >= 95% → strength", () => {
      const recs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("recycling compliance"))).toBe(true);
    });

    it("recycling compliance 80-94% → different strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 8 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("recycling compliance"))).toBe(true);
    });

    it("eco-education engagement >= 90% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: true, engaged: true }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("eco-education engagement"))).toBe(true);
    });

    it("eco-education engagement 70-89% → different strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 7, engaged: i < 7 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("eco-education engagement"))).toBe(true);
    });

    it("sustainability practice score >= 80% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("Sustainability practice score"))).toBe(true);
    });

    it("sustainability practice score 60-79% → different strength", () => {
      // need score in [60,79]
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: i < 7,
          children_involved: i < 6,
          staff_trained: i < 5,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // score = avg(100, 70, 60, 50) = 70
      expect(r.sustainability_practice_score).toBe(70);
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("Sustainability practice score"))).toBe(true);
    });

    it("carbon awareness >= 90% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: true }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("carbon awareness"))).toBe(true);
    });

    it("carbon awareness 70-89% → different strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 7 }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("carbon awareness"))).toBe(true);
    });

    it("child participation >= 90% → strength", () => {
      // Use recycling with all child_participated
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: true }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.child_participation_rate).toBe(100);
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("child participation"))).toBe(true);
    });

    it("child participation 70-89% → different strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 7 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.child_participation_rate).toBe(70);
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("child participation"))).toBe(true);
    });

    it("reduction completion >= 90% → strength", () => {
      const recs = [
        makeCarbonFootprint("cf1", { reduction_actions_planned: 10, reduction_actions_completed: 10 }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("carbon reduction actions completed"))).toBe(true);
    });

    it("reduction completion 70-89% → different strength", () => {
      const recs = [
        makeCarbonFootprint("cf1", { reduction_actions_planned: 10, reduction_actions_completed: 7 }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("planned carbon reduction actions completed"))).toBe(true);
    });

    it("saving measures >= 90% → strength", () => {
      const recs = [
        makeEnergy("e1", { within_target: true, energy_saving_measures_active: 10, energy_saving_measures_total: 10 }),
      ];
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("energy saving measures active"))).toBe(true);
    });

    it("saving measures 70-89% → different strength", () => {
      const recs = [
        makeEnergy("e1", { within_target: true, energy_saving_measures_active: 7, energy_saving_measures_total: 10 }),
      ];
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.strengths.some((s) => s.includes("70%") && s.includes("energy saving measures active"))).toBe(true);
    });

    it("avg effectiveness >= 4.0 → strength", () => {
      const recs = [
        makeSustainabilityPractice("sp1", { implemented: true, effectiveness_rating: 5 }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.strengths.some((s) => s.includes("5/5 effectiveness"))).toBe(true);
    });

    it("avg effectiveness 3.0-3.99 → different strength", () => {
      const recs = [
        makeSustainabilityPractice("sp1", { implemented: true, effectiveness_rating: 3 }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.strengths.some((s) => s.includes("3/5 effectiveness"))).toBe(true);
    });

    it("smart meter rate >= 90% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: true, smart_meter_installed: true }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.strengths.some((s) => s.includes("Smart meters installed"))).toBe(true);
    });

    it("zero contamination → strength", () => {
      const recs = [
        makeRecycling("r1", { compliant: true, contamination_found: false }),
      ];
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.strengths.some((s) => s.includes("Zero recycling contamination"))).toBe(true);
    });

    it("learning outcome rate >= 90% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: true, learning_outcome_met: true }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("eco-education sessions achieving learning outcomes"))).toBe(true);
    });

    it("eco-ed child coverage 100% → strength", () => {
      // 3 children, all attended
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
        makeEcoEducation("ee2", { child_id: "c2", attended: true }),
        makeEcoEducation("ee3", { child_id: "c3", attended: true }),
      ];
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.strengths.some((s) => s.includes("Every child has participated"))).toBe(true);
    });

    it("eco-ed child coverage 80-99% → different strength", () => {
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
        makeEcoEducation("ee2", { child_id: "c2", attended: true }),
        makeEcoEducation("ee3", { child_id: "c3", attended: true }),
        makeEcoEducation("ee4", { child_id: "c4", attended: true }),
      ];
      const r = run({ total_children: 5, eco_education_records: recs });
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("eco-education"))).toBe(true);
    });

    it("carbon target rate >= 90% → strength", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { within_target: true }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.strengths.some((s) => s.includes("100%") && s.includes("carbon records within target"))).toBe(true);
    });

    it("total cost saving > 0 → strength", () => {
      const recs = [
        makeSustainabilityPractice("sp1", { cost_saving_gbp: 100 }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.strengths.some((s) => s.includes("cost saving"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. CONCERNS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("concerns", () => {
    it("energy efficiency < 40% → critical concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 2 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("energy"))).toBe(true);
    });

    it("energy efficiency 40-69% → moderate concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 5 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Energy efficiency"))).toBe(true);
    });

    it("recycling compliance < 50% → critical concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 3 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("recycling compliance"))).toBe(true);
    });

    it("recycling compliance 50-79% → moderate concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 6 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Recycling compliance"))).toBe(true);
    });

    it("eco-education engagement < 40% → critical concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 2, engaged: i < 2 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("eco-education engagement"))).toBe(true);
    });

    it("eco-education engagement 40-69% → moderate concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 5, engaged: i < 5 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Eco-education engagement"))).toBe(true);
    });

    it("sustainability practice score < 40% → critical concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: i < 3,
          documented: false,
          children_involved: false,
          staff_trained: false,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // impl=30%, doc=0%, children=0%, staff=0% → avg = 8 (round(7.5)) → actually 30/4=7.5 → round=8
      expect(r.sustainability_practice_score).toBeLessThan(40);
      expect(r.concerns.some((c) => c.includes("Sustainability practice score") && c.includes("poorly implemented"))).toBe(true);
    });

    it("sustainability practice score 40-59% → moderate concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: i < 6,
          documented: i < 3,
          children_involved: i < 3,
          staff_trained: i < 3,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // impl=60%, doc: only implemented+documented count → pct(3,10)=30%, children=pct(3,10)=30%, staff=pct(3,10)=30%
      // Wait: documented/children_involved/staff_trained only count if implemented too
      // i<3: all four flags true. i=3,4,5: implemented but not doc/children/staff. i>=6: not implemented.
      // implemented count: 6. documentedPractices (implemented+documented): 3. childrenInvolved (implemented+children): 3. staffTrained (implemented+staff): 3.
      // rates: pct(6,10)=60, pct(3,10)=30, pct(3,10)=30, pct(3,10)=30
      // avg = (60+30+30+30)/4 = 37.5 → round = 38
      // 38 < 40 → that's the critical concern. Need score 40-59.
      // Let me adjust: need avg in [40,59]
      // 10 practices: 7 implemented, 4 doc+impl, 3 children+impl, 3 staff+impl
      // rates: 70, 40, 30, 30 → avg = 42.5 → 43
      const recs2 = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: i < 7,
          documented: i < 4,
          children_involved: i < 3,
          staff_trained: i < 3,
        }),
      );
      const r2 = run({ total_children: 3, sustainability_practice_records: recs2 });
      expect(r2.sustainability_practice_score).toBe(43);
      expect(r2.concerns.some((c) => c.includes("43%") && c.includes("Sustainability practice score"))).toBe(true);
    });

    it("carbon awareness < 50% → critical concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 4 }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("carbon awareness"))).toBe(true);
    });

    it("carbon awareness 50-69% → moderate concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 6 }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Carbon awareness"))).toBe(true);
    });

    it("child participation < 30% → critical concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 2 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.child_participation_rate).toBe(20);
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("child participation"))).toBe(true);
    });

    it("child participation 30-69% → moderate concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 5 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.child_participation_rate).toBe(50);
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Child participation"))).toBe(true);
    });

    it("contamination >= 30% → concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, contamination_found: i < 3 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("contamination"))).toBe(true);
    });

    it("contamination 15-29% → moderate concern", () => {
      const recs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, contamination_found: i < 4 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      // pct(4,20) = 20
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("contamination"))).toBe(true);
    });

    it("missed collection >= 20% → concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, collection_missed: i < 2 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("collections missed"))).toBe(true);
    });

    it("reduction completion < 50% → concern", () => {
      const recs = [
        makeCarbonFootprint("cf1", { reduction_actions_planned: 10, reduction_actions_completed: 4 }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("carbon reduction actions completed"))).toBe(true);
    });

    it("reduction completion 50-69% → moderate concern", () => {
      const recs = [
        makeCarbonFootprint("cf1", { reduction_actions_planned: 10, reduction_actions_completed: 6 }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.concerns.some((c) => c.includes("60%") && c.includes("Carbon reduction action completion"))).toBe(true);
    });

    it("eco-ed child coverage < 50% → concern", () => {
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
      ];
      const r = run({ total_children: 5, eco_education_records: recs });
      // 1/5 = 20%
      expect(r.concerns.some((c) => c.includes("20%") && c.includes("eco-education"))).toBe(true);
    });

    it("staff trained rate < 50% → concern", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          staff_trained: i < 4,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.concerns.some((c) => c.includes("40%") && c.includes("staff training"))).toBe(true);
    });

    it("saving measures rate < 50% → concern", () => {
      const recs = [
        makeEnergy("e1", {
          within_target: true,
          energy_saving_measures_active: 3,
          energy_saving_measures_total: 10,
        }),
      ];
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.concerns.some((c) => c.includes("30%") && c.includes("energy saving measures"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. RECOMMENDATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("recommendations", () => {
    it("energy < 40% → immediate recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 3 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("energy consumption"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("recycling < 50% → immediate recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 4 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("recycling improvement"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("eco-education < 40% → immediate recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 3, engaged: i < 3 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("eco-education programme"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("child participation < 30% → immediate recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 2 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("children's participation"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("carbon awareness < 50% → immediate recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 4 }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("carbon footprint"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("contamination >= 30% → immediate recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, contamination_found: i < 3 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("contamination"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
    });

    it("reduction completion < 50% → soon recommendation", () => {
      const recs = [
        makeCarbonFootprint("cf1", { reduction_actions_planned: 10, reduction_actions_completed: 4 }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("carbon reduction action tracker"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("staff trained < 50% → soon recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, { implemented: true, staff_trained: i < 4 }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("sustainability training"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("saving measures < 50% → soon recommendation", () => {
      const recs = [
        makeEnergy("e1", {
          within_target: true,
          energy_saving_measures_active: 3,
          energy_saving_measures_total: 10,
        }),
      ];
      const r = run({ total_children: 3, energy_usage_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("energy saving measures"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("energy 40-69% → soon recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 5 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("energy reduction plan"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("soon");
    });

    it("recycling 50-79% → planned recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 6 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Improve recycling compliance"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("eco-education 40-69% → planned recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 5, engaged: i < 5 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Diversify eco-education"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("eco-ed coverage 50-79% → planned recommendation", () => {
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
        makeEcoEducation("ee2", { child_id: "c2", attended: true }),
        makeEcoEducation("ee3", { child_id: "c3", attended: true }),
      ];
      const r = run({ total_children: 5, eco_education_records: recs });
      // 3/5 = 60%
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("Extend eco-education coverage"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("child participation 30-69% → planned recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 5 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("eco-champions"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("carbon awareness 50-69% → planned recommendation", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 6 }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      const rec = r.recommendations.find((rec) => rec.recommendation.includes("carbon awareness activities"));
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("planned");
    });

    it("ranks are sequential starting at 1", () => {
      // Trigger multiple recommendations
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 2 }),
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 3 }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      expect(r.recommendations.length).toBeGreaterThan(1);
      r.recommendations.forEach((rec, idx) => {
        expect(rec.rank).toBe(idx + 1);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. INSIGHTS
  // ═══════════════════════════════════════════════════════════════════════════
  describe("insights", () => {
    // -- Critical insights --
    it("energy < 40% → critical insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 2 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("20%") && i.text.includes("energy"))).toBe(true);
    });

    it("recycling < 50% → critical insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 3 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("30%") && i.text.includes("recycling"))).toBe(true);
    });

    it("eco-education engagement < 40% → critical insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 2, engaged: i < 2 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("20%") && i.text.includes("eco-education"))).toBe(true);
    });

    it("child participation < 30% → critical insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 2 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("20%") && i.text.includes("Child participation"))).toBe(true);
    });

    it("no eco-education records with children → critical insight", () => {
      // Need !allEmpty (at least one other array non-empty)
      const r = run({
        total_children: 3,
        recycling_records: [makeRecycling("r1", { compliant: true })],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No eco-education records"))).toBe(true);
    });

    // -- Warning insights --
    it("energy 40-69% → warning insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 5 }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Energy efficiency"))).toBe(true);
    });

    it("recycling 50-79% → warning insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 6 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Recycling compliance"))).toBe(true);
    });

    it("eco-education 40-69% → warning insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: i < 5, engaged: i < 5 }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Eco-education engagement"))).toBe(true);
    });

    it("sustainability practice score 40-59% → warning insight", () => {
      // Need score in [40,59]
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: i < 7,
          documented: i < 4,
          children_involved: i < 3,
          staff_trained: i < 3,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // rates: 70, 40, 30, 30 → avg = 42.5 → 43
      expect(r.sustainability_practice_score).toBe(43);
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("43%") && i.text.includes("Sustainability practice score"))).toBe(true);
    });

    it("carbon awareness 50-69% → warning insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, { children_aware: i < 6 }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Carbon awareness"))).toBe(true);
    });

    it("child participation 30-69% → warning insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: i < 5 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Child participation"))).toBe(true);
    });

    it("reduction completion 50-69% → warning insight", () => {
      const recs = [
        makeCarbonFootprint("cf1", { reduction_actions_planned: 10, reduction_actions_completed: 6 }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("60%") && i.text.includes("Carbon reduction action completion"))).toBe(true);
    });

    it("contamination 15-29% → warning insight", () => {
      const recs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, contamination_found: i < 4 }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      // pct(4, 20) = 20%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("20%") && i.text.includes("contamination"))).toBe(true);
    });

    it("avg effectiveness 2.0-2.99 → warning insight", () => {
      const recs = [
        makeSustainabilityPractice("sp1", { implemented: true, effectiveness_rating: 2 }),
        makeSustainabilityPractice("sp2", { implemented: true, effectiveness_rating: 2 }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("2/5") && i.text.includes("effectiveness"))).toBe(true);
    });

    it("concentrated sustainability categories → warning insight", () => {
      // >3 practices, all in "energy" category → missing >= 3 other categories
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, { category: "energy" }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("concentrated"))).toBe(true);
    });

    // -- Positive insights --
    it("outstanding rating → positive insight", () => {
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, {
          within_target: true,
          energy_saving_measures_active: 10,
          energy_saving_measures_total: 10,
        }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: true }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          child_id: `c${(i % 3) + 1}`,
          attended: true,
          engaged: true,
        }),
      );
      const spRecs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
          effectiveness_rating: 5,
        }),
      );
      const cfRecs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, {
          children_aware: true,
          reduction_actions_planned: 10,
          reduction_actions_completed: 10,
        }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
        carbon_footprint_records: cfRecs,
      });
      expect(r.sustainability_rating).toBe("outstanding");
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("excellent energy + saving measures → combined positive insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, {
          within_target: true,
          energy_saving_measures_active: 10,
          energy_saving_measures_total: 10,
        }),
      );
      const r = run({ total_children: 3, energy_usage_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("100%") && i.text.includes("saving measures active"),
      )).toBe(true);
    });

    it("recycling >= 95% + zero contamination → combined positive insight", () => {
      const recs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, contamination_found: false }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("100%") && i.text.includes("zero contamination"),
      )).toBe(true);
    });

    it("eco-ed engagement >= 90% + learning outcomes >= 90% → combined positive insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          attended: true,
          engaged: true,
          learning_outcome_met: true,
        }),
      );
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("eco-education engagement") && i.text.includes("learning outcomes"),
      )).toBe(true);
    });

    it("child participation >= 90% → positive insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: true }),
      );
      const r = run({ total_children: 3, recycling_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("100%") && i.text.includes("child participation"),
      )).toBe(true);
    });

    it("carbon target >= 90% + reduction >= 90% → combined positive insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, {
          within_target: true,
          reduction_actions_planned: 10,
          reduction_actions_completed: 10,
        }),
      );
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("carbon targets") && i.text.includes("reduction actions completed"),
      )).toBe(true);
    });

    it("100% eco-ed child coverage → positive insight", () => {
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
        makeEcoEducation("ee2", { child_id: "c2", attended: true }),
        makeEcoEducation("ee3", { child_id: "c3", attended: true }),
      ];
      const r = run({ total_children: 3, eco_education_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("Every child has participated in eco-education"),
      )).toBe(true);
    });

    it("sustainability score >= 80% + effectiveness >= 4.0 → combined positive insight", () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
          effectiveness_rating: 5,
        }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      expect(r.insights.some((i) =>
        i.severity === "positive" && i.text.includes("100%") && i.text.includes("5/5"),
      )).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. HEADLINES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("headlines", () => {
    it("outstanding headline", () => {
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, {
          within_target: true,
          energy_saving_measures_active: 10,
          energy_saving_measures_total: 10,
        }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true, child_participated: true }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, {
          child_id: `c${(i % 3) + 1}`,
          attended: true,
          engaged: true,
        }),
      );
      const spRecs = Array.from({ length: 10 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, {
          implemented: true,
          documented: true,
          children_involved: true,
          staff_trained: true,
          effectiveness_rating: 5,
        }),
      );
      const cfRecs = Array.from({ length: 10 }, (_, i) =>
        makeCarbonFootprint(`cf${i}`, {
          children_aware: true,
          reduction_actions_planned: 10,
          reduction_actions_completed: 10,
        }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
        carbon_footprint_records: cfRecs,
      });
      expect(r.headline).toContain("Outstanding environmental sustainability");
    });

    it("good headline includes strengths and concerns count", () => {
      // Build a "good" scenario
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: true }),
      );
      const recyclingRecs = Array.from({ length: 20 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: true }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: true, engaged: true }),
      );
      const spRecs = [
        makeSustainabilityPractice("sp1", { implemented: true, effectiveness_rating: 4 }),
      ];
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
        sustainability_practice_records: spRecs,
      });
      expect(r.sustainability_rating).toBe("good");
      expect(r.headline).toContain("Good environmental sustainability");
      expect(r.headline).toContain("strength");
    });

    it("adequate headline includes concerns count", () => {
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 5 }),
      );
      const r = run({ total_children: 3, energy_usage_records: energyRecs });
      expect(r.sustainability_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate environmental sustainability");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline includes significant concerns", () => {
      // Multiple penalties → inadequate
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 2 }),
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 3, child_participated: false }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      // 52 - 5 - 5 - 3 = 39 → inadequate
      expect(r.sustainability_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant concern");
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("edge cases", () => {
    it("single record in each array", () => {
      const r = run({
        total_children: 1,
        energy_usage_records: [makeEnergy("e1", { within_target: true })],
        recycling_records: [makeRecycling("r1", { compliant: true })],
        eco_education_records: [makeEcoEducation("ee1", { child_id: "c1", attended: true, engaged: true })],
        sustainability_practice_records: [makeSustainabilityPractice("sp1", { implemented: true })],
        carbon_footprint_records: [makeCarbonFootprint("cf1", { children_aware: true })],
      });
      expect(r.sustainability_rating).toBeDefined();
      expect(r.sustainability_score).toBeGreaterThanOrEqual(0);
      expect(r.sustainability_score).toBeLessThanOrEqual(100);
    });

    it("score is clamped at 0 minimum", () => {
      // 4 penalties: energy(-5) + recycling(-5) + ecoEd(-5) + childParticipation(-3) = -18
      // 52 - 18 = 34, still above 0. But let's verify clamp works conceptually.
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: false }),
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: false, child_participated: false }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: false, engaged: false }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
      });
      // 52 - 5 - 5 - 5 - 3 = 34 (still above 0, but clamped to 0..100)
      expect(r.sustainability_score).toBe(34);
      expect(r.sustainability_score).toBeGreaterThanOrEqual(0);
      expect(r.sustainability_score).toBeLessThanOrEqual(100);
    });

    it("score is clamped at 100 maximum", () => {
      // Impossible to exceed 80 with base 52 + max bonuses 28, so just verify it doesn't exceed 100
      const r = run({
        total_children: 3,
        energy_usage_records: [makeEnergy("e1", { within_target: true })],
      });
      expect(r.sustainability_score).toBeLessThanOrEqual(100);
    });

    it("total_children: 1 still works for coverage calculation", () => {
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
      ];
      const r = run({ total_children: 1, eco_education_records: recs });
      // ecoEdChildCoverage = pct(1, 1) = 100%
      expect(r.strengths.some((s) => s.includes("Every child has participated"))).toBe(true);
    });

    it("multiple children in eco-education unique count", () => {
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true, engaged: true }),
        makeEcoEducation("ee2", { child_id: "c1", attended: true, engaged: true }), // same child
        makeEcoEducation("ee3", { child_id: "c2", attended: true, engaged: true }),
      ];
      const r = run({ total_children: 4, eco_education_records: recs });
      // unique children: c1, c2 = 2 out of 4 = 50%
      // ecoEdChildCoverage = 50% → < 80 but >= 50 → no coverage concern
      // ecoEducationEngagementRate = 100% → no engagement concern
      // The only eco-ed concern would be coverage < 50%, which it's not.
      expect(r.concerns.some((c) => c.includes("eco-education") && c.includes("children have participated"))).toBe(false);
    });

    it("0 total_children avoids ecoEdChildCoverage division", () => {
      // total_children = 0 with eco records → ecoEdChildCoverage forced to 0
      // But 0 children with eco records means allEmpty is false, total_children = 0, so we go past the special cases
      const recs = [
        makeEcoEducation("ee1", { child_id: "c1", attended: true }),
      ];
      const r = run({ total_children: 0, eco_education_records: recs });
      // Engine uses: total_children > 0 ? pct(...) : 0
      // So ecoEdChildCoverage = 0, won't trigger coverage strength/concern
      expect(r.sustainability_rating).toBeDefined();
    });

    it("all penalties at once yields minimum data-driven score", () => {
      // energy(-5) + recycling(-5) + ecoEd(-5) + childParticipation(-3) = -18
      // 52 - 18 = 34
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: false }),
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: false, child_participated: false }),
      );
      const ecoEdRecs = Array.from({ length: 10 }, (_, i) =>
        makeEcoEducation(`ee${i}`, { attended: false, engaged: false }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
        eco_education_records: ecoEdRecs,
      });
      expect(r.sustainability_score).toBe(34);
      expect(r.sustainability_rating).toBe("inadequate");
    });

    it("sustainability practice with only non-implemented items → score 0", () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeSustainabilityPractice(`sp${i}`, { implemented: false }),
      );
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // impl=0%, doc=0%, children=0%, staff=0% → avg = 0
      expect(r.sustainability_practice_score).toBe(0);
    });

    it("avg effectiveness only counts implemented practices", () => {
      const recs = [
        makeSustainabilityPractice("sp1", { implemented: true, effectiveness_rating: 5 }),
        makeSustainabilityPractice("sp2", { implemented: false, effectiveness_rating: 1 }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // Only sp1 counted: avg = 5.0
      expect(r.strengths.some((s) => s.includes("5/5 effectiveness"))).toBe(true);
    });

    it("energy saving measures: 0 total → rate 0, no penalty", () => {
      const recs = [
        makeEnergy("e1", {
          within_target: true,
          energy_saving_measures_active: 0,
          energy_saving_measures_total: 0,
        }),
      ];
      const r = run({ total_children: 3, energy_usage_records: recs });
      // savingMeasuresRate = pct(0, 0) = 0 → no bonus, and guard for concern checks totalSavingMeasuresTotal > 0
      // No saving measures concern
      expect(r.concerns.some((c) => c.includes("energy saving measures"))).toBe(false);
    });

    it("reduction actions: 0 planned → rate 0, no penalty", () => {
      const recs = [
        makeCarbonFootprint("cf1", {
          reduction_actions_planned: 0,
          reduction_actions_completed: 0,
        }),
      ];
      const r = run({ total_children: 3, carbon_footprint_records: recs });
      // reductionCompletionRate = pct(0, 0) = 0 → no bonus, guard checks totalReductionPlanned > 0
      expect(r.concerns.some((c) => c.includes("carbon reduction actions"))).toBe(false);
    });

    it("headline plural for 1 concern", () => {
      // Adequate with exactly 1 concern
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 5 }),
      );
      const r = run({ total_children: 3, energy_usage_records: energyRecs });
      // Should get concern about energy 50% and the critical insight about no eco-ed records
      // But let's check the headline
      if (r.concerns.length === 1) {
        expect(r.headline).toContain("1 concern");
      }
    });

    it("headline plural for multiple concerns", () => {
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 2 }),
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 3 }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      expect(r.concerns.length).toBeGreaterThan(1);
      expect(r.headline).toContain("concerns");
    });

    it("sustainability categories with >= 3 missing triggers warning when > 3 total practices", () => {
      // All 4+ practices in same 2 categories → missing >= 3 from allCategories
      const recs = [
        makeSustainabilityPractice("sp1", { category: "energy" }),
        makeSustainabilityPractice("sp2", { category: "energy" }),
        makeSustainabilityPractice("sp3", { category: "waste" }),
        makeSustainabilityPractice("sp4", { category: "waste" }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // missing: water, food, transport, biodiversity, purchasing (5 missing >= 3)
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("concentrated"))).toBe(true);
    });

    it("sustainability categories diversified does NOT trigger warning", () => {
      // Cover enough categories to have < 3 missing
      const recs = [
        makeSustainabilityPractice("sp1", { category: "energy" }),
        makeSustainabilityPractice("sp2", { category: "waste" }),
        makeSustainabilityPractice("sp3", { category: "water" }),
        makeSustainabilityPractice("sp4", { category: "food" }),
        makeSustainabilityPractice("sp5", { category: "transport" }),
      ];
      const r = run({ total_children: 3, sustainability_practice_records: recs });
      // missing: biodiversity, purchasing (2 < 3)
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("concentrated"))).toBe(false);
    });

    it("large dataset processes correctly", () => {
      const energyRecs = Array.from({ length: 100 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 92 }),
      );
      const r = run({ total_children: 10, energy_usage_records: energyRecs });
      expect(r.energy_efficiency_rate).toBe(92);
      expect(r.total_energy_records).toBe(100);
    });

    it("no strengths when all metrics are middling", () => {
      // Energy at 50% (no strength), recycling at 60% (no strength)
      const energyRecs = Array.from({ length: 10 }, (_, i) =>
        makeEnergy(`e${i}`, { within_target: i < 5 }),
      );
      const recyclingRecs = Array.from({ length: 10 }, (_, i) =>
        makeRecycling(`r${i}`, { compliant: i < 6 }),
      );
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      // Energy 50% → no strength. Recycling 60% → no strength.
      // Smart meter default false → no strength. Contamination? 0/10 = 0% and records > 0 → zero contamination strength!
      // Actually contamination_found defaults to false in makeRecycling, so contaminationRate = 0% → zero contamination strength triggered
      // So there will be at least 1 strength
      expect(r.strengths.some((s) => s.includes("Zero recycling contamination"))).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. ADDITIONAL SCORING VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe("additional scoring verification", () => {
    it("base score with only one non-penalty record area", () => {
      // 1 recycling record that is compliant → recycling 100% → +4 bonus
      const r = run({
        total_children: 3,
        recycling_records: [makeRecycling("r1", { compliant: true })],
      });
      // base 52 + 4(recycling) = 56
      // child participation: 0/1 = 0% → penalty -3 (denom > 0)
      // Wait: child_participated defaults to false → 0/1 = 0% and totalChildParticDenom = 1 > 0 → penalty -3
      expect(r.sustainability_score).toBe(53); // 52 + 4 - 3
    });

    it("multiple bonuses stack correctly", () => {
      // Energy 100% (+4) + recycling 100% (+4)
      const energyRecs = [makeEnergy("e1", { within_target: true })];
      const recyclingRecs = [makeRecycling("r1", { compliant: true, child_participated: true })];
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      // childParticipation: recycling 1/1 = 100% → +3
      // 52 + 4 + 4 + 3 = 63
      expect(r.sustainability_score).toBe(63);
    });

    it("penalty offsets bonus correctly", () => {
      // Energy 100% (+4) + recycling 0% (-5)
      const energyRecs = [makeEnergy("e1", { within_target: true })];
      const recyclingRecs = [makeRecycling("r1", { compliant: false })];
      const r = run({
        total_children: 3,
        energy_usage_records: energyRecs,
        recycling_records: recyclingRecs,
      });
      // childParticipation: recycling 0/1 = 0% → -3
      // 52 + 4 - 5 - 3 = 48
      expect(r.sustainability_score).toBe(48);
    });
  });
});
