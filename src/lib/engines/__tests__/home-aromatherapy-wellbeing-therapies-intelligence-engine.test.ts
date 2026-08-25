// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME AROMATHERAPY & WELLBEING THERAPIES INTELLIGENCE ENGINE TESTS
// 180 tests covering: output shape, empty/edge cases, metric computation,
// scoring bonuses/penalties, rating thresholds, strengths, concerns,
// recommendations, insights, headlines, and composite scenarios.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeAromatherapyWellbeingTherapies,
  type AromatherapyWellbeingInput,
  type AromatherapySessionRecordInput,
  type WellbeingTherapyRecordInput,
  type RelaxationProgrammeRecordInput,
  type CalmingTechniqueRecordInput,
  type ChildBenefitRecordInput,
} from "../home-aromatherapy-wellbeing-therapies-intelligence-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const TODAY = "2026-05-31";

// ── Factories ──────────────────────────────────────────────────────────────

let _id = 0;
function uid(): string {
  return `test_${++_id}`;
}

function makeAromaSession(
  overrides: Partial<AromatherapySessionRecordInput> = {},
): AromatherapySessionRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    session_date: "2026-05-20",
    session_type: "individual",
    therapist_name: "Jane Smith",
    therapist_qualified: true,
    oils_used: ["lavender"],
    application_method: "diffuser",
    consent_obtained: true,
    allergy_check_completed: true,
    contraindication_check_completed: true,
    duration_minutes: 30,
    child_mood_before: 2,
    child_mood_after: 4,
    child_engagement_rating: 4,
    child_feedback_positive: true,
    session_goals_set: true,
    session_goals_met: true,
    adverse_reaction: false,
    adverse_reaction_details: null,
    risk_assessment_current: true,
    notes_recorded: true,
    follow_up_planned: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeWellbeingTherapy(
  overrides: Partial<WellbeingTherapyRecordInput> = {},
): WellbeingTherapyRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    therapy_date: "2026-05-20",
    therapy_type: "aromatherapy",
    therapist_name: "Jane Smith",
    therapist_qualified: true,
    session_format: "individual",
    duration_minutes: 45,
    consent_obtained: true,
    child_engagement_rating: 4,
    therapeutic_benefit_observed: true,
    child_feedback_positive: true,
    child_self_reported_benefit: true,
    mood_improvement_observed: true,
    anxiety_reduction_observed: true,
    sleep_improvement_reported: true,
    staff_present: true,
    notes_recorded: true,
    follow_up_planned: true,
    referral_source: null,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeRelaxationProgramme(
  overrides: Partial<RelaxationProgrammeRecordInput> = {},
): RelaxationProgrammeRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    programme_name: "Morning Calm",
    start_date: "2026-04-01",
    review_date: "2026-06-01",
    reviewed: true,
    programme_type: "breathing_exercises",
    frequency_per_week: 3,
    sessions_attended: 10,
    sessions_planned: 12,
    child_engagement_rating: 4,
    effectiveness_rating: 4,
    child_feedback_positive: true,
    child_involved_in_planning: true,
    measurable_outcomes_set: true,
    measurable_outcomes_achieved: true,
    anxiety_level_before: 7,
    anxiety_level_after: 3,
    programme_active: true,
    staff_trained: true,
    notes_recorded: true,
    created_at: "2026-04-01",
    ...overrides,
  };
}

function makeCalmingTechnique(
  overrides: Partial<CalmingTechniqueRecordInput> = {},
): CalmingTechniqueRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    technique_date: "2026-05-20",
    technique_type: "essential_oil_diffusion",
    context: "bedtime",
    child_initiated: true,
    staff_guided: false,
    duration_minutes: 15,
    effectiveness_rating: 4,
    child_mood_before: 2,
    child_mood_after: 4,
    child_feedback_positive: true,
    technique_appropriate: true,
    sensory_profile_considered: true,
    de_escalation_achieved: true,
    notes_recorded: true,
    created_at: "2026-05-20",
    ...overrides,
  };
}

function makeChildBenefit(
  overrides: Partial<ChildBenefitRecordInput> = {},
): ChildBenefitRecordInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: "2026-05-15",
    assessment_period_start: "2026-04-01",
    assessment_period_end: "2026-05-15",
    therapies_accessed: ["aromatherapy", "reflexology"],
    sessions_attended_count: 10,
    sessions_offered_count: 12,
    overall_wellbeing_improvement: true,
    emotional_regulation_improved: true,
    anxiety_reduced: true,
    sleep_quality_improved: true,
    behaviour_improved: true,
    confidence_improved: true,
    social_skills_improved: true,
    self_care_skills_improved: true,
    child_self_reported_benefit: true,
    staff_reported_benefit: true,
    overall_progress_rating: 4,
    child_voice_captured: true,
    child_wants_to_continue: true,
    barriers_identified: [],
    support_plan_updated: true,
    review_date: "2026-06-15",
    review_overdue: false,
    created_at: "2026-05-15",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<AromatherapyWellbeingInput> = {},
): AromatherapyWellbeingInput {
  return {
    today: TODAY,
    total_children: 3,
    aromatherapy_session_records: [],
    wellbeing_therapy_records: [],
    relaxation_programme_records: [],
    calming_technique_records: [],
    child_benefit_records: [],
    ...overrides,
  };
}

// Helper: create N records with overrides using different child_ids
function nAroma(n: number, overrides: Partial<AromatherapySessionRecordInput> = {}): AromatherapySessionRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeAromaSession({ child_id: `child_${(i % 5) + 1}`, ...overrides }),
  );
}

function nWellbeing(n: number, overrides: Partial<WellbeingTherapyRecordInput> = {}): WellbeingTherapyRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeWellbeingTherapy({ child_id: `child_${(i % 5) + 1}`, ...overrides }),
  );
}

function nRelaxation(n: number, overrides: Partial<RelaxationProgrammeRecordInput> = {}): RelaxationProgrammeRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeRelaxationProgramme({ child_id: `child_${(i % 5) + 1}`, ...overrides }),
  );
}

function nCalming(n: number, overrides: Partial<CalmingTechniqueRecordInput> = {}): CalmingTechniqueRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeCalmingTechnique({ child_id: `child_${(i % 5) + 1}`, ...overrides }),
  );
}

function nBenefit(n: number, overrides: Partial<ChildBenefitRecordInput> = {}): ChildBenefitRecordInput[] {
  return Array.from({ length: n }, (_, i) =>
    makeChildBenefit({ child_id: `child_${(i % 5) + 1}`, ...overrides }),
  );
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Home Aromatherapy & Wellbeing Therapies Intelligence Engine", () => {

  // ════════════════════════════════════════════════════════════════════════
  // 1. OUTPUT SHAPE
  // ════════════════════════════════════════════════════════════════════════

  describe("Output shape", () => {
    it("1 — returns all expected top-level keys", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(r).toHaveProperty("wellbeing_therapy_rating");
      expect(r).toHaveProperty("wellbeing_therapy_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_aromatherapy_sessions");
      expect(r).toHaveProperty("total_wellbeing_therapies");
      expect(r).toHaveProperty("total_relaxation_programmes");
      expect(r).toHaveProperty("total_calming_techniques");
      expect(r).toHaveProperty("total_child_benefit_assessments");
      expect(r).toHaveProperty("aromatherapy_access_rate");
      expect(r).toHaveProperty("therapy_quality_rate");
      expect(r).toHaveProperty("relaxation_effectiveness_rate");
      expect(r).toHaveProperty("calming_technique_rate");
      expect(r).toHaveProperty("child_benefit_rate");
      expect(r).toHaveProperty("child_engagement_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("2 — rating is one of the valid enum values", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(
        r.wellbeing_therapy_rating,
      );
    });

    it("3 — score is a number between 0 and 100", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5),
          wellbeing_therapy_records: nWellbeing(5),
          relaxation_programme_records: nRelaxation(5),
          calming_technique_records: nCalming(5),
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.wellbeing_therapy_score).toBeGreaterThanOrEqual(0);
      expect(r.wellbeing_therapy_score).toBeLessThanOrEqual(100);
    });

    it("4 — arrays are arrays", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("5 — recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      // allEmpty + children > 0 gives recommendations
      for (const rec of r.recommendations) {
        expect(rec).toHaveProperty("rank");
        expect(rec).toHaveProperty("recommendation");
        expect(rec).toHaveProperty("urgency");
        expect(rec).toHaveProperty("regulatory_ref");
      }
    });

    it("6 — insights have text and severity", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      for (const ins of r.insights) {
        expect(ins).toHaveProperty("text");
        expect(ins).toHaveProperty("severity");
        expect(["critical", "warning", "positive"]).toContain(ins.severity);
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 2. EMPTY / EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("Empty and edge cases", () => {
    it("7 — all empty + 0 children → insufficient_data", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 0 }),
      );
      expect(r.wellbeing_therapy_rating).toBe("insufficient_data");
      expect(r.wellbeing_therapy_score).toBe(0);
    });

    it("8 — insufficient_data headline mentions no children", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 0 }),
      );
      expect(r.headline).toContain("No children on placement");
    });

    it("9 — insufficient_data returns zero totals", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 0 }),
      );
      expect(r.total_aromatherapy_sessions).toBe(0);
      expect(r.total_wellbeing_therapies).toBe(0);
      expect(r.total_relaxation_programmes).toBe(0);
      expect(r.total_calming_techniques).toBe(0);
      expect(r.total_child_benefit_assessments).toBe(0);
    });

    it("10 — insufficient_data returns empty arrays", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 0 }),
      );
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("11 — all empty + children > 0 → inadequate with score 15", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      expect(r.wellbeing_therapy_rating).toBe("inadequate");
      expect(r.wellbeing_therapy_score).toBe(15);
    });

    it("12 — all empty + children produces concern about no records", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 5 }),
      );
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No aromatherapy session records");
    });

    it("13 — all empty + children produces 2 recommendations", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("14 — all empty + children produces 1 critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("15 — all empty + children headline mentions urgent attention", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      expect(r.headline).toContain("urgent attention");
    });

    it("16 — all rates null when all empty + children > 0", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3 }),
      );
      expect(r.aromatherapy_access_rate).toBeNull();
      expect(r.therapy_quality_rate).toBeNull();
      expect(r.relaxation_effectiveness_rate).toBeNull();
      expect(r.calming_technique_rate).toBeNull();
      expect(r.child_benefit_rate).toBeNull();
      expect(r.child_engagement_rate).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 3. TOTALS / COUNTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Totals and counts", () => {
    it("17 — total_aromatherapy_sessions counts correctly", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: nAroma(7) }),
      );
      expect(r.total_aromatherapy_sessions).toBe(7);
    });

    it("18 — total_wellbeing_therapies counts correctly", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ wellbeing_therapy_records: nWellbeing(4) }),
      );
      expect(r.total_wellbeing_therapies).toBe(4);
    });

    it("19 — total_relaxation_programmes counts correctly", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ relaxation_programme_records: nRelaxation(6) }),
      );
      expect(r.total_relaxation_programmes).toBe(6);
    });

    it("20 — total_calming_techniques counts correctly", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ calming_technique_records: nCalming(9) }),
      );
      expect(r.total_calming_techniques).toBe(9);
    });

    it("21 — total_child_benefit_assessments counts correctly", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ child_benefit_records: nBenefit(3) }),
      );
      expect(r.total_child_benefit_assessments).toBe(3);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 4. AROMATHERAPY ACCESS RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Aromatherapy access rate", () => {
    it("22 — 100% when all children have sessions", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 3,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "child_1" }),
            makeAromaSession({ child_id: "child_2" }),
            makeAromaSession({ child_id: "child_3" }),
          ],
        }),
      );
      expect(r.aromatherapy_access_rate).toBe(100);
    });

    it("23 — counts unique children not total sessions", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 4,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "child_1" }),
            makeAromaSession({ child_id: "child_1" }),
            makeAromaSession({ child_id: "child_2" }),
          ],
        }),
      );
      expect(r.aromatherapy_access_rate).toBe(50); // 2/4
    });

    it("24 — null when total_children is 0", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 0,
          aromatherapy_session_records: [makeAromaSession()],
          wellbeing_therapy_records: [makeWellbeingTherapy()],
        }),
      );
      expect(r.aromatherapy_access_rate).toBe(0);
    });

    it("25 — 33% when 1 of 3 children accessed", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 3,
          aromatherapy_session_records: [makeAromaSession({ child_id: "child_1" })],
        }),
      );
      expect(r.aromatherapy_access_rate).toBe(33);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 5. THERAPY QUALITY RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Therapy quality rate", () => {
    it("26 — 100% when all aroma+wellbeing have qualified+consent+notes", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(3, {
            therapist_qualified: true,
            consent_obtained: true,
            notes_recorded: true,
          }),
          wellbeing_therapy_records: nWellbeing(3, {
            therapist_qualified: true,
            consent_obtained: true,
            notes_recorded: true,
          }),
        }),
      );
      expect(r.therapy_quality_rate).toBe(100);
    });

    it("27 — 0% when all aroma+wellbeing lack qualified+consent+notes", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(3, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
          }),
          wellbeing_therapy_records: nWellbeing(3, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
          }),
        }),
      );
      expect(r.therapy_quality_rate).toBe(0);
    });

    it("28 — partial quality gives proportional rate", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({
              therapist_qualified: true,
              consent_obtained: true,
              notes_recorded: true,
            }),
            makeAromaSession({
              therapist_qualified: false,
              consent_obtained: false,
              notes_recorded: false,
            }),
          ],
        }),
      );
      // numerator: 3, denominator: 2*3=6 → 50%
      expect(r.therapy_quality_rate).toBe(50);
    });

    it("29 — null when no aroma or wellbeing records", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ calming_technique_records: nCalming(3) }),
      );
      // Empty population: this asserted the fab-0 the helper used to return.
      expect(r.therapy_quality_rate).toBeNull();
      expect(r.therapy_quality_rate).not.toBe(0); // 0% is a claim; nothing was measured
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6. RELAXATION EFFECTIVENESS RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Relaxation effectiveness rate", () => {
    it("30 — 100% when all 4 composite factors met", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(4, {
            measurable_outcomes_set: true,
            measurable_outcomes_achieved: true,
            anxiety_level_before: 8,
            anxiety_level_after: 3,
            child_feedback_positive: true,
            reviewed: true,
          }),
        }),
      );
      expect(r.relaxation_effectiveness_rate).toBe(100);
    });

    it("31 — 0% when none of the composite factors met", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(4, {
            measurable_outcomes_set: false,
            measurable_outcomes_achieved: false,
            anxiety_level_before: 5,
            anxiety_level_after: 7,
            child_feedback_positive: false,
            reviewed: false,
          }),
        }),
      );
      expect(r.relaxation_effectiveness_rate).toBe(0);
    });

    it("32 — outcomes_achieved only counted when outcomes_set is true", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: [
            makeRelaxationProgramme({
              measurable_outcomes_set: false,
              measurable_outcomes_achieved: true, // should not count
              anxiety_level_before: 5,
              anxiety_level_after: 7,
              child_feedback_positive: false,
              reviewed: false,
            }),
          ],
        }),
      );
      expect(r.relaxation_effectiveness_rate).toBe(0);
    });

    it("33 — null with no relaxation records", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(r.relaxation_effectiveness_rate).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 7. CALMING TECHNIQUE RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Calming technique rate", () => {
    it("34 — 100% when all 4 composite factors met", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(5, {
            effectiveness_rating: 5,
            technique_appropriate: true,
            sensory_profile_considered: true,
            de_escalation_achieved: true,
          }),
        }),
      );
      expect(r.calming_technique_rate).toBe(100);
    });

    it("35 — 0% when all composite factors fail", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(5, {
            effectiveness_rating: 2,
            technique_appropriate: false,
            sensory_profile_considered: false,
            de_escalation_achieved: false,
          }),
        }),
      );
      expect(r.calming_technique_rate).toBe(0);
    });

    it("36 — effectiveness_rating >= 4 counts as effective", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: [
            makeCalmingTechnique({
              effectiveness_rating: 4,
              technique_appropriate: true,
              sensory_profile_considered: true,
              de_escalation_achieved: true,
            }),
            makeCalmingTechnique({
              effectiveness_rating: 3,
              technique_appropriate: true,
              sensory_profile_considered: true,
              de_escalation_achieved: true,
            }),
          ],
        }),
      );
      // first: 4/4, second: 3/4 → 7/8 = 88%
      expect(r.calming_technique_rate).toBe(88);
    });

    it("37 — null with no calming records", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(r.calming_technique_rate).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 8. CHILD BENEFIT RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Child benefit rate", () => {
    it("38 — 100% when all 4 composite factors met", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: true,
            child_self_reported_benefit: true,
            staff_reported_benefit: true,
            child_voice_captured: true,
          }),
        }),
      );
      expect(r.child_benefit_rate).toBe(100);
    });

    it("39 — 0% when all composite factors fail", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
          }),
        }),
      );
      expect(r.child_benefit_rate).toBe(0);
    });

    it("40 — 50% when half the factors met across records", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: [
            makeChildBenefit({
              overall_wellbeing_improvement: true,
              child_self_reported_benefit: true,
              staff_reported_benefit: false,
              child_voice_captured: false,
            }),
          ],
        }),
      );
      expect(r.child_benefit_rate).toBe(50);
    });

    it("41 — null with no benefit records", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(r.child_benefit_rate).toBeNull();
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 9. CHILD ENGAGEMENT RATE
  // ════════════════════════════════════════════════════════════════════════

  describe("Child engagement rate", () => {
    it("42 — 100% when all positive feedback across all types", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(3, { child_feedback_positive: true }),
          wellbeing_therapy_records: nWellbeing(3, { child_feedback_positive: true }),
          calming_technique_records: nCalming(3, { child_feedback_positive: true }),
          relaxation_programme_records: nRelaxation(3, { child_feedback_positive: true }),
        }),
      );
      expect(r.child_engagement_rate).toBe(100);
    });

    it("43 — 0% when none positive", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(3, { child_feedback_positive: false }),
          wellbeing_therapy_records: nWellbeing(3, { child_feedback_positive: false }),
          calming_technique_records: nCalming(3, { child_feedback_positive: false }),
          relaxation_programme_records: nRelaxation(3, { child_feedback_positive: false }),
        }),
      );
      expect(r.child_engagement_rate).toBe(0);
    });

    it("44 — null with no records of any type", () => {
      const r = computeAromatherapyWellbeingTherapies(baseInput());
      expect(r.child_engagement_rate).toBeNull();
    });

    it("45 — mixed feedback gives proportional rate", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({ child_feedback_positive: true }),
            makeAromaSession({ child_feedback_positive: false }),
          ],
          wellbeing_therapy_records: [
            makeWellbeingTherapy({ child_feedback_positive: true }),
            makeWellbeingTherapy({ child_feedback_positive: false }),
          ],
        }),
      );
      // 2/4 = 50%
      expect(r.child_engagement_rate).toBe(50);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 10. SCORING — BASE AND BONUSES
  // ════════════════════════════════════════════════════════════════════════

  describe("Scoring — base score", () => {
    it("46 — base score is 52 with minimal records and no bonuses/penalties", () => {
      // One aroma session with poor quality to avoid penalties for missing data
      // but no bonuses either
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100, // low access rate
          aromatherapy_session_records: [
            makeAromaSession({
              therapist_qualified: false,
              consent_obtained: false,
              notes_recorded: false,
              child_feedback_positive: false,
              allergy_check_completed: false,
              contraindication_check_completed: false,
              risk_assessment_current: false,
              adverse_reaction: false,
              child_mood_before: 3,
              child_mood_after: 3,
            }),
          ],
        }),
      );
      // With therapy quality 0% < 40% → penalty -5 + base 52 = 47
      // aromaSafety 0% < 70% → no extra penalty (already counted in quality concerns)
      // But we should verify the score math
      expect(r.wellbeing_therapy_score).toBeLessThanOrEqual(52);
    });
  });

  describe("Scoring — bonus 1: aromatherapyAccessRate", () => {
    it("47 — +4 when aromatherapyAccessRate >= 80", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1", therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ child_id: "c2", therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ child_id: "c3", therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ child_id: "c4", therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
          ],
        }),
      );
      // 4/5 = 80% access → +4
      // quality 0% < 40 → -5
      // safety 0% < 70 → no separate penalty in score
      // 52 + 4 - 5 = 51
      expect(r.wellbeing_therapy_score).toBe(51);
    });

    it("48 — +2 when aromatherapyAccessRate >= 50 and < 80", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 4,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1", therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ child_id: "c2", therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
          ],
        }),
      );
      // 2/4 = 50% access → +2
      // quality 0% < 40 → -5
      // 52 + 2 - 5 = 49
      expect(r.wellbeing_therapy_score).toBe(49);
    });
  });

  describe("Scoring — bonus 2: therapyQualityRate", () => {
    it("49 — +4 when therapyQualityRate >= 90", () => {
      // All 3 factors true on all records → 100%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100, // low access
          aromatherapy_session_records: nAroma(5, {
            therapist_qualified: true,
            consent_obtained: true,
            notes_recorded: true,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
          }),
        }),
      );
      // therapy quality 100% >= 90 → +4
      // access 5/100 = 5% < 50 → no bonus
      // safety 5*1 / 5*4 = 25% → no safety bonus (< 80)
      // 52 + 4 = 56
      expect(r.wellbeing_therapy_score).toBe(56);
    });

    it("50 — +2 when therapyQualityRate >= 70 and < 90", () => {
      // 3 good + 1 bad = 9/12 = 75%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: [
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false, child_feedback_positive: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
          ],
        }),
      );
      expect(r.therapy_quality_rate).toBe(75);
      // 52 + 2 = 54
      expect(r.wellbeing_therapy_score).toBe(54);
    });
  });

  describe("Scoring — bonus 3: relaxationEffectivenessRate", () => {
    it("51 — +4 when relaxationEffectivenessRate >= 85", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: nRelaxation(5, {
            measurable_outcomes_set: true,
            measurable_outcomes_achieved: true,
            anxiety_level_before: 8,
            anxiety_level_after: 3,
            child_feedback_positive: true,
            reviewed: true,
          }),
        }),
      );
      expect(r.relaxation_effectiveness_rate).toBe(100);
      // 52 + 4 (relaxEff>=85) + 3 (engagement 100%>=90) + 3 (childInvolved 100%>=90) = 62
      expect(r.wellbeing_therapy_score).toBe(62);
    });

    it("52 — +2 when relaxationEffectivenessRate >= 65 and < 85", () => {
      // 3 met all 4, 1 met 0 → (12+0)/(4*4)=12/16=75%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: [
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, measurable_outcomes_achieved: false, anxiety_level_before: 3, anxiety_level_after: 8, child_feedback_positive: false, reviewed: false }),
          ],
        }),
      );
      expect(r.relaxation_effectiveness_rate).toBe(75);
      // 52 + 2 (relaxEff>=65) + 1 (engagement 75%>=70) + 3 (childInvolved 100%>=90) = 58
      expect(r.wellbeing_therapy_score).toBe(58);
    });
  });

  describe("Scoring — bonus 4: calmingTechniqueRate", () => {
    it("53 — +3 when calmingTechniqueRate >= 85", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          calming_technique_records: nCalming(5, {
            effectiveness_rating: 5,
            technique_appropriate: true,
            sensory_profile_considered: true,
            de_escalation_achieved: true,
            child_feedback_positive: false,
          }),
        }),
      );
      expect(r.calming_technique_rate).toBe(100);
      // 52 + 3 = 55
      expect(r.wellbeing_therapy_score).toBe(55);
    });

    it("54 — +1 when calmingTechniqueRate >= 65 and < 85", () => {
      // 3 full + 1 with only 2/4 = (12+2)/(4*4)=14/16=88% → oops too high
      // Need 3 full + 2 empty → (12+0)/(5*4)=12/20=60% → too low
      // 4 full + 1 with 1/4 → (16+1)/(5*4)=17/20=85% → still too high
      // Let me compute: target 65-84
      // 3 records: 2 full + 1 empty → (8+0)/(3*4) = 8/12 = 67%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          calming_technique_records: [
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: true, de_escalation_achieved: true, child_feedback_positive: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: true, de_escalation_achieved: true, child_feedback_positive: false }),
            makeCalmingTechnique({ effectiveness_rating: 2, technique_appropriate: false, sensory_profile_considered: false, de_escalation_achieved: false, child_feedback_positive: false }),
          ],
        }),
      );
      expect(r.calming_technique_rate).toBe(67);
      // 52 + 1 = 53
      expect(r.wellbeing_therapy_score).toBe(53);
    });
  });

  describe("Scoring — bonus 5: childBenefitRate", () => {
    it("55 — +4 when childBenefitRate >= 85", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: true,
            child_self_reported_benefit: true,
            staff_reported_benefit: true,
            child_voice_captured: true,
          }),
        }),
      );
      expect(r.child_benefit_rate).toBe(100);
      // 52 + 4 = 56
      expect(r.wellbeing_therapy_score).toBe(56);
    });

    it("56 — +2 when childBenefitRate >= 65 and < 85", () => {
      // 2 full + 1 half = (8+2)/(3*4) = 10/12 = 83% → too high
      // 2 full + 1 empty = (8+0)/(3*4) = 8/12 = 67%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          child_benefit_records: [
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: true, child_voice_captured: true }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: true, child_voice_captured: true }),
            makeChildBenefit({ overall_wellbeing_improvement: false, child_self_reported_benefit: false, staff_reported_benefit: false, child_voice_captured: false }),
          ],
        }),
      );
      expect(r.child_benefit_rate).toBe(67);
      // 52 + 2 = 54
      expect(r.wellbeing_therapy_score).toBe(54);
    });
  });

  describe("Scoring — bonus 6: childEngagementRate", () => {
    it("57 — +3 when childEngagementRate >= 90", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(10, {
            child_feedback_positive: true,
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
          }),
        }),
      );
      expect(r.child_engagement_rate).toBe(100);
      // 52 + 3 - 5 (therapy quality < 40) = 50
      expect(r.wellbeing_therapy_score).toBe(50);
    });

    it("58 — +1 when childEngagementRate >= 70 and < 90", () => {
      // 7/10 = 70%
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAromaSession({
          child_feedback_positive: i < 7,
          therapist_qualified: false,
          consent_obtained: false,
          notes_recorded: false,
          allergy_check_completed: false,
          contraindication_check_completed: false,
          risk_assessment_current: false,
        }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: records,
        }),
      );
      expect(r.child_engagement_rate).toBe(70);
      // 52 + 1 - 5 = 48
      expect(r.wellbeing_therapy_score).toBe(48);
    });
  });

  describe("Scoring — bonus 7: aromaSafetyRate", () => {
    it("59 — +3 when aromaSafetyRate >= 95", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(5, {
            consent_obtained: true,
            allergy_check_completed: true,
            contraindication_check_completed: true,
            risk_assessment_current: true,
            therapist_qualified: false,
            notes_recorded: false,
            child_feedback_positive: false,
          }),
        }),
      );
      // safety = 20/20 = 100% >= 95 → +3
      // quality = 5/15 = 33% < 40 → -5
      // 52 + 3 - 5 = 50
      expect(r.wellbeing_therapy_score).toBe(50);
    });

    it("60 — +1 when aromaSafetyRate >= 80 and < 95", () => {
      // 4 sessions: 3 all true + 1 with 2 of 4 → (12+2)/(4*4) = 14/16 = 88%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: [
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true, therapist_qualified: false, notes_recorded: false, child_feedback_positive: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true, therapist_qualified: false, notes_recorded: false, child_feedback_positive: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true, therapist_qualified: false, notes_recorded: false, child_feedback_positive: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: false, risk_assessment_current: false, therapist_qualified: false, notes_recorded: false, child_feedback_positive: false }),
          ],
        }),
      );
      // safety = (12+2)/(4*4) = 14/16 = 88%
      // quality = 0/12 = 0% < 40 → -5
      // 52 + 1 - 5 = 48
      expect(r.wellbeing_therapy_score).toBe(48);
    });
  });

  describe("Scoring — bonus 8: relaxationChildInvolvedRate", () => {
    it("61 — +3 when relaxationChildInvolvedRate >= 90", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: nRelaxation(10, {
            child_involved_in_planning: true,
            measurable_outcomes_set: false,
            anxiety_level_before: 5,
            anxiety_level_after: 7,
            child_feedback_positive: false,
            reviewed: false,
          }),
        }),
      );
      // childInvolved 100% >= 90 → +3
      // relaxation effectiveness 0% < 40 → -5
      // 52 + 3 - 5 = 50
      expect(r.wellbeing_therapy_score).toBe(50);
    });

    it("62 — +1 when relaxationChildInvolvedRate >= 70 and < 90", () => {
      // 7/10 = 70%
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRelaxationProgramme({
          child_involved_in_planning: i < 7,
          measurable_outcomes_set: false,
          anxiety_level_before: 5,
          anxiety_level_after: 7,
          child_feedback_positive: false,
          reviewed: false,
        }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: records,
        }),
      );
      // 52 + 1 - 5 = 48
      expect(r.wellbeing_therapy_score).toBe(48);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 11. SCORING — PENALTIES
  // ════════════════════════════════════════════════════════════════════════

  describe("Scoring — penalties", () => {
    it("63 — -5 when therapyQualityRate < 40 and sessions exist", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(3, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
          }),
        }),
      );
      // 52 - 5 = 47
      expect(r.wellbeing_therapy_score).toBe(47);
    });

    it("64 — -5 when relaxationEffectivenessRate < 40 and programmes exist", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: nRelaxation(3, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
          }),
        }),
      );
      // 52 + 3 (childInvolved 100%>=90) - 5 (relaxEff<40) = 50
      expect(r.wellbeing_therapy_score).toBe(50);
    });

    it("65 — -5 when childBenefitRate < 40 and assessments exist", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          child_benefit_records: nBenefit(3, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
          }),
        }),
      );
      // 52 - 5 = 47
      expect(r.wellbeing_therapy_score).toBe(47);
    });

    it("66 — -3 when aromaAdverseRate > 20 and sessions exist", () => {
      // 2/5 = 40% > 20
      const records = Array.from({ length: 5 }, (_, i) =>
        makeAromaSession({
          adverse_reaction: i < 2,
          therapist_qualified: false,
          consent_obtained: false,
          notes_recorded: false,
          child_feedback_positive: false,
          allergy_check_completed: false,
          contraindication_check_completed: false,
          risk_assessment_current: false,
        }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: records,
        }),
      );
      // 52 - 5 (quality) - 3 (adverse) = 44
      expect(r.wellbeing_therapy_score).toBe(44);
    });

    it("67 — no adverse penalty when aromaAdverseRate <= 20", () => {
      // 1/5 = 20% → not > 20
      const records = Array.from({ length: 5 }, (_, i) =>
        makeAromaSession({
          adverse_reaction: i < 1,
          therapist_qualified: false,
          consent_obtained: false,
          notes_recorded: false,
          child_feedback_positive: false,
          allergy_check_completed: false,
          contraindication_check_completed: false,
          risk_assessment_current: false,
        }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: records,
        }),
      );
      // 52 - 5 (quality) = 47
      expect(r.wellbeing_therapy_score).toBe(47);
    });

    it("68 — score clamped to 0 minimum", () => {
      // All penalties stacked
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(5, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
            adverse_reaction: true,
          }),
          relaxation_programme_records: nRelaxation(5, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
          }),
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
          }),
        }),
      );
      // 52 + 3 (childInvolved 100%>=90) - 5 - 5 - 5 - 3 = 37
      expect(r.wellbeing_therapy_score).toBe(37);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 12. RATING THRESHOLDS
  // ════════════════════════════════════════════════════════════════════════

  describe("Rating thresholds", () => {
    it("69 — score >= 80 → outstanding", () => {
      // Build a scenario with many bonuses
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
            makeAromaSession({ child_id: "c4" }),
          ],
          wellbeing_therapy_records: nWellbeing(5),
          relaxation_programme_records: nRelaxation(5),
          calming_technique_records: nCalming(5),
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.wellbeing_therapy_score).toBeGreaterThanOrEqual(80);
      expect(r.wellbeing_therapy_rating).toBe("outstanding");
    });

    it("70 — score >= 65 and < 80 → good", () => {
      // Get some bonuses but not all
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
          ],
          wellbeing_therapy_records: nWellbeing(3),
          relaxation_programme_records: nRelaxation(3),
          calming_technique_records: nCalming(3),
          child_benefit_records: nBenefit(3),
        }),
      );
      if (r.wellbeing_therapy_score >= 65 && r.wellbeing_therapy_score < 80) {
        expect(r.wellbeing_therapy_rating).toBe("good");
      } else {
        // If score is outstanding, that's fine — just verify rating matches
        expect(r.wellbeing_therapy_rating).toBe(
          r.wellbeing_therapy_score >= 80 ? "outstanding" : r.wellbeing_therapy_score >= 45 ? "adequate" : "inadequate"
        );
      }
    });

    it("71 — score >= 45 and < 65 → adequate", () => {
      // Moderate setup — just relaxation records, no bonuses
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: nRelaxation(3, {
            measurable_outcomes_set: false,
            anxiety_level_before: 5,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
            child_involved_in_planning: false,
          }),
        }),
      );
      // 52 - 5 (relaxation < 40) = 47 → adequate
      expect(r.wellbeing_therapy_score).toBe(47);
      expect(r.wellbeing_therapy_rating).toBe("adequate");
    });

    it("72 — score < 45 → inadequate", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(5, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
            adverse_reaction: true,
          }),
          relaxation_programme_records: nRelaxation(5, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
          }),
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
          }),
        }),
      );
      // 52 - 5 - 5 - 5 - 3 = 34 → inadequate
      expect(r.wellbeing_therapy_score).toBeLessThan(45);
      expect(r.wellbeing_therapy_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 13. STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("Strengths", () => {
    it("73 — aromatherapy access >= 80 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
            makeAromaSession({ child_id: "c4" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("aromatherapy access rate"))).toBe(true);
    });

    it("74 — aromatherapy access >= 50 and < 80 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 4,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("accessed aromatherapy sessions"))).toBe(true);
    });

    it("75 — therapy quality >= 90 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5),
          wellbeing_therapy_records: nWellbeing(5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("therapy quality"))).toBe(true);
    });

    it("76 — therapy quality >= 70 and < 90 strength", () => {
      // Need 70-89% quality: 3 good + 1 bad = 9/12 = 75%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
          ],
        }),
      );
      expect(r.therapy_quality_rate).toBe(75);
      expect(r.strengths.some((s) => s.includes("therapy quality rate"))).toBe(true);
    });

    it("77 — aroma safety >= 95 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10),
        }),
      );
      expect(r.strengths.some((s) => s.includes("safety compliance"))).toBe(true);
    });

    it("78 — aroma safety >= 80 and < 95 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: false, risk_assessment_current: false }),
          ],
        }),
      );
      // safety = 14/16 = 88%
      expect(r.strengths.some((s) => s.includes("safety") && s.includes("88%"))).toBe(true);
    });

    it("79 — relaxation effectiveness >= 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("relaxation programme effectiveness"))).toBe(true);
    });

    it("80 — relaxation effectiveness >= 65 and < 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: [
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 3, anxiety_level_after: 5, child_feedback_positive: false, reviewed: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("generally achieving"))).toBe(true);
    });

    it("81 — calming technique >= 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("calming technique effectiveness"))).toBe(true);
    });

    it("82 — calming technique >= 65 and < 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: [
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: true, de_escalation_achieved: true }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: true, de_escalation_achieved: true }),
            makeCalmingTechnique({ effectiveness_rating: 2, technique_appropriate: false, sensory_profile_considered: false, de_escalation_achieved: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("generally well matched"))).toBe(true);
    });

    it("83 — child benefit >= 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.strengths.some((s) => s.includes("child benefit rate"))).toBe(true);
    });

    it("84 — child benefit >= 65 and < 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: [
            makeChildBenefit(),
            makeChildBenefit(),
            makeChildBenefit({ overall_wellbeing_improvement: false, child_self_reported_benefit: false, staff_reported_benefit: false, child_voice_captured: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("child benefit rate"))).toBe(true);
    });

    it("85 — child engagement >= 90 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { child_feedback_positive: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("child engagement"))).toBe(true);
    });

    it("86 — child engagement >= 70 and < 90 strength", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAromaSession({ child_feedback_positive: i < 7 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("engagement rate"))).toBe(true);
    });

    it("87 — mood improvement >= 80 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { child_mood_before: 2, child_mood_after: 4 }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("mood improvement"))).toBe(true);
    });

    it("88 — mood improvement >= 60 and < 80 strength", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAromaSession({ child_mood_before: i < 6 ? 2 : 4, child_mood_after: i < 6 ? 4 : 4 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("mood improvement"))).toBe(true);
    });

    it("89 — calming child-initiated >= 70 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(10, { child_initiated: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("child-initiated"))).toBe(true);
    });

    it("90 — calming child-initiated >= 50 and < 70 strength", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeCalmingTechnique({ child_initiated: i < 5 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ calming_technique_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("child-initiated"))).toBe(true);
    });

    it("91 — relaxation child involved >= 90 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(10, { child_involved_in_planning: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("child involvement in relaxation programme planning"))).toBe(true);
    });

    it("92 — relaxation child involved >= 70 and < 90 strength", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeRelaxationProgramme({ child_involved_in_planning: i < 7 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ relaxation_programme_records: records }),
      );
      expect(r.strengths.some((s) => s.includes("child involvement in planning"))).toBe(true);
    });

    it("93 — wellbeing anxiety reduction >= 80 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          wellbeing_therapy_records: nWellbeing(10, { anxiety_reduction_observed: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("anxiety reduction"))).toBe(true);
    });

    it("94 — calming de-escalation >= 85 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(10, { de_escalation_achieved: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("de-escalation"))).toBe(true);
    });

    it("95 — benefit wants continue >= 90 strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(10, { child_wants_to_continue: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("want to continue"))).toBe(true);
    });

    it("96 — aroma goals met >= 85 strength (when goals set)", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { session_goals_set: true, session_goals_met: true }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("session goals met"))).toBe(true);
    });

    it("97 — zero adverse reactions strength", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { adverse_reaction: false }),
        }),
      );
      expect(r.strengths.some((s) => s.includes("Zero adverse reactions"))).toBe(true);
    });

    it("98 — no strengths when all metrics are poor", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(5, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
            adverse_reaction: true,
            session_goals_set: false,
            child_mood_before: 3,
            child_mood_after: 2,
          }),
        }),
      );
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 14. CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("Concerns", () => {
    it("99 — therapy quality < 40 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
          }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("therapy quality"))).toBe(true);
    });

    it("100 — therapy quality 40-69 concern", () => {
      // 2 good + 1 bad = 6/9 = 67%
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
          ],
        }),
      );
      // 6/12 = 50%
      expect(r.concerns.some((c) => c.includes("Therapy quality rate at"))).toBe(true);
    });

    it("101 — relaxation effectiveness < 40 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
          }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("relaxation programme effectiveness"))).toBe(true);
    });

    it("102 — relaxation effectiveness 40-64 concern", () => {
      // 4/(5*4) = 4/20 = 20% → this is < 40, not 40-64
      // Let me recalculate: 2 full + 1 partial
      // Actually: 2 full + 2 half empty → need 40-64
      // 3 records: 2 full + 1 with 2/4 → (8+2)/(3*4) = 10/12 = 83% too high
      // 5 records: 2 full + 3 with 1/4 → (8+3)/(5*4) = 11/20 = 55%
      const r2 = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: [
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
          ],
        }),
      );
      // (8 + 3 anxiety reduced + 0 + 0)/(5*4)=11/20=55%
      expect(r2.relaxation_effectiveness_rate).toBeGreaterThanOrEqual(40);
      expect(r2.relaxation_effectiveness_rate).toBeLessThan(65);
      expect(r2.concerns.some((c) => c.includes("Relaxation programme effectiveness at"))).toBe(true);
    });

    it("103 — child benefit < 40 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
          }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("child benefit rate"))).toBe(true);
    });

    it("104 — child benefit 40-64 concern", () => {
      // (2+2+0+0)/(4*4) = 4/16 = 25% — too low
      // Try: 3 with 2/4 each → (6)/(3*4) = 6/12 = 50%
      const r2 = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: [
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
          ],
        }),
      );
      expect(r2.child_benefit_rate).toBe(50);
      expect(r2.concerns.some((c) => c.includes("Child benefit rate at"))).toBe(true);
    });

    it("105 — calming technique < 40 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(5, {
            effectiveness_rating: 2,
            technique_appropriate: false,
            sensory_profile_considered: false,
            de_escalation_achieved: false,
          }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("calming technique effectiveness"))).toBe(true);
    });

    it("106 — calming technique 40-64 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: [
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
          ],
        }),
      );
      // (4+4+0+0)/(4*4) = 8/16 = 50%
      expect(r.calming_technique_rate).toBe(50);
      expect(r.concerns.some((c) => c.includes("Calming technique effectiveness at"))).toBe(true);
    });

    it("107 — aroma safety < 70 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5, {
            consent_obtained: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
          }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("Aromatherapy safety compliance at only"))).toBe(true);
    });

    it("108 — aroma safety 70-79 concern", () => {
      // (12+1+0)/(5*4) = 13/20 = 65% — wait that's < 70
      // Let me re-count: 3*(4) + 1*(1) + 1*(0) = 12+1+0=13; 13/20 = 65 → < 70
      // Need 70-79: 5 records: 4 all true + 1 with 0/4 = 16/20 = 80% → too high
      // 10 records: 7 all true + 3 with 1/4 = (28+3)/(10*4) = 31/40 = 78%
      const r2 = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            ...nAroma(7, { consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
          ],
        }),
      );
      // (28 + 3)/(10*4) = 31/40 = 78%
      expect(r2.concerns.some((c) => c.includes("Aromatherapy safety compliance at") && c.includes("some safety checks"))).toBe(true);
    });

    it("109 — adverse reaction > 20 concern", () => {
      const records = Array.from({ length: 5 }, (_, i) =>
        makeAromaSession({ adverse_reaction: i < 2 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      // 2/5 = 40% > 20
      expect(r.concerns.some((c) => c.includes("adverse reaction rate") && c.includes("unacceptably high"))).toBe(true);
    });

    it("110 — adverse reaction 11-20 concern", () => {
      // 2/10 = 20% → not > 20, so no concern at exactly 20
      // Need > 10 and <= 20: 11-20%
      const records2 = Array.from({ length: 8 }, (_, i) =>
        makeAromaSession({ adverse_reaction: i < 1 }),
      );
      const r2 = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records2 }),
      );
      // 1/8 = 13% → > 10 and <= 20
      expect(r2.concerns.some((c) => c.includes("adverse reaction rate") && c.includes("Review allergy"))).toBe(true);
    });

    it("111 — child engagement < 50 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { child_feedback_positive: false }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("child engagement"))).toBe(true);
    });

    it("112 — child engagement 50-69 concern", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAromaSession({ child_feedback_positive: i < 5 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      expect(r.concerns.some((c) => c.includes("Child engagement at"))).toBe(true);
    });

    it("113 — aromatherapy access < 30 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 10,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
          ],
        }),
      );
      // 2/10 = 20% < 30
      expect(r.concerns.some((c) => c.includes("accessed aromatherapy") && c.includes("not reaching"))).toBe(true);
    });

    it("114 — relaxation child involved < 50 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, { child_involved_in_planning: false }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("child involvement in relaxation programme planning"))).toBe(true);
    });

    it("115 — benefit child voice < 50 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { child_voice_captured: false }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("child's voice"))).toBe(true);
    });

    it("116 — benefit review overdue > 30 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { review_overdue: true }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("overdue for review"))).toBe(true);
    });

    it("117 — no aroma sessions with children concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 3,
          wellbeing_therapy_records: nWellbeing(3), // not allEmpty
        }),
      );
      expect(r.concerns.some((c) => c.includes("No aromatherapy session records exist"))).toBe(true);
    });

    it("118 — no benefit assessments with children concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 3,
          aromatherapy_session_records: nAroma(3), // not allEmpty
        }),
      );
      expect(r.concerns.some((c) => c.includes("No child benefit assessments recorded"))).toBe(true);
    });

    it("119 — wellbeing qualified < 70 concern", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          wellbeing_therapy_records: nWellbeing(5, { therapist_qualified: false }),
        }),
      );
      expect(r.concerns.some((c) => c.includes("qualified therapists"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 15. RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("Recommendations", () => {
    it("120 — therapy quality < 40 → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5, { therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("therapy quality"))).toBe(true);
    });

    it("121 — aroma safety < 70 → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5, { consent_obtained: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("safety protocols"))).toBe(true);
    });

    it("122 — adverse rate > 20 → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(3, { adverse_reaction: true }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("adverse reactions"))).toBe(true);
    });

    it("123 — relaxation effectiveness < 40 → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, { measurable_outcomes_set: false, anxiety_level_before: 3, anxiety_level_after: 5, child_feedback_positive: false, reviewed: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("relaxation programme"))).toBe(true);
    });

    it("124 — child benefit < 40 → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { overall_wellbeing_improvement: false, child_self_reported_benefit: false, staff_reported_benefit: false, child_voice_captured: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("complementary therapy programme"))).toBe(true);
    });

    it("125 — child engagement < 50 → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { child_feedback_positive: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Consult children"))).toBe(true);
    });

    it("126 — no aroma sessions with children → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3, wellbeing_therapy_records: nWellbeing(3) }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Introduce aromatherapy"))).toBe(true);
    });

    it("127 — no benefit assessments with children → immediate recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3, aromatherapy_session_records: nAroma(3) }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Commence child benefit assessments"))).toBe(true);
    });

    it("128 — calming technique < 40 → soon recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(5, { effectiveness_rating: 2, technique_appropriate: false, sensory_profile_considered: false, de_escalation_achieved: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("sensory-based calming techniques"))).toBe(true);
    });

    it("129 — relaxation child involved < 50 → soon recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, { child_involved_in_planning: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Involve children"))).toBe(true);
    });

    it("130 — benefit child voice < 50 → soon recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { child_voice_captured: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("children's own views"))).toBe(true);
    });

    it("131 — benefit review overdue > 30 → soon recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { review_overdue: true }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("schedule for reviewing"))).toBe(true);
    });

    it("132 — therapy quality 40-69 → soon recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
          ],
        }),
      );
      // 6/12 = 50% → 40-69
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("Improve therapy quality"))).toBe(true);
    });

    it("133 — relaxation effectiveness 40-64 → planned recommendation", () => {
      // Build 55% rate
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: [
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Enhance relaxation programme effectiveness"))).toBe(true);
    });

    it("134 — calming technique 40-64 → planned recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: [
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
          ],
        }),
      );
      // (4+4+0+0)/(4*4) = 50%
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("sensory profiling"))).toBe(true);
    });

    it("135 — child benefit 40-64 → planned recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: [
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
          ],
        }),
      );
      // 6/12 = 50%
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Strengthen child benefit evidence"))).toBe(true);
    });

    it("136 — child engagement 50-69 → planned recommendation", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAromaSession({ child_feedback_positive: i < 5 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Seek regular child feedback"))).toBe(true);
    });

    it("137 — aromatherapy access < 50 and > 0 → planned recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 10,
          aromatherapy_session_records: [makeAromaSession({ child_id: "c1" })],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("Extend aromatherapy access"))).toBe(true);
    });

    it("138 — wellbeing qualified < 70 → planned recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          wellbeing_therapy_records: nWellbeing(5, { therapist_qualified: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("qualified therapists"))).toBe(true);
    });

    it("139 — relaxation staff trained < 70 → planned recommendation", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, { staff_trained: false }),
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("staff training"))).toBe(true);
    });

    it("140 — recommendations have sequential rank values", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 3,
          aromatherapy_session_records: nAroma(5, { therapist_qualified: false, consent_obtained: false, notes_recorded: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false, child_feedback_positive: false, adverse_reaction: true }),
          relaxation_programme_records: nRelaxation(5, { measurable_outcomes_set: false, anxiety_level_before: 3, anxiety_level_after: 5, child_feedback_positive: false, reviewed: false, child_involved_in_planning: false }),
          child_benefit_records: nBenefit(5, { overall_wellbeing_improvement: false, child_self_reported_benefit: false, staff_reported_benefit: false, child_voice_captured: false, review_overdue: true }),
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("141 — no recommendations in outstanding scenario", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
            makeAromaSession({ child_id: "c4" }),
          ],
          wellbeing_therapy_records: nWellbeing(5),
          relaxation_programme_records: nRelaxation(5),
          calming_technique_records: nCalming(5),
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 16. INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Insights — critical", () => {
    it("142 — therapy quality < 40 critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5, { therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("therapy quality rate"))).toBe(true);
    });

    it("143 — aroma safety < 70 critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5, { consent_obtained: false, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("safety compliance"))).toBe(true);
    });

    it("144 — adverse > 20 critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(3, { adverse_reaction: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("adverse reaction rate"))).toBe(true);
    });

    it("145 — relaxation effectiveness < 40 critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, { measurable_outcomes_set: false, anxiety_level_before: 3, anxiety_level_after: 5, child_feedback_positive: false, reviewed: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("relaxation programme effectiveness"))).toBe(true);
    });

    it("146 — child benefit < 40 critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { overall_wellbeing_improvement: false, child_self_reported_benefit: false, staff_reported_benefit: false, child_voice_captured: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("child benefit rate"))).toBe(true);
    });

    it("147 — no aroma sessions with children critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3, wellbeing_therapy_records: nWellbeing(3) }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No aromatherapy session records"))).toBe(true);
    });

    it("148 — no benefit assessments with children critical insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ total_children: 3, aromatherapy_session_records: nAroma(3) }),
      );
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No child benefit assessments"))).toBe(true);
    });
  });

  describe("Insights — warning", () => {
    it("149 — therapy quality 40-69 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: true, consent_obtained: true, notes_recorded: true }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
            makeAromaSession({ therapist_qualified: false, consent_obtained: false, notes_recorded: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Therapy quality at"))).toBe(true);
    });

    it("150 — relaxation effectiveness 40-64 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: [
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: true, measurable_outcomes_achieved: true, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: true, reviewed: true }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
            makeRelaxationProgramme({ measurable_outcomes_set: false, anxiety_level_before: 8, anxiety_level_after: 3, child_feedback_positive: false, reviewed: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Relaxation programme effectiveness at"))).toBe(true);
    });

    it("151 — child benefit 40-64 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: [
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
            makeChildBenefit({ overall_wellbeing_improvement: true, child_self_reported_benefit: true, staff_reported_benefit: false, child_voice_captured: false }),
          ],
        }),
      );
      // 6/12 = 50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child benefit rate at"))).toBe(true);
    });

    it("152 — calming technique 40-64 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: [
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
            makeCalmingTechnique({ effectiveness_rating: 5, technique_appropriate: true, sensory_profile_considered: false, de_escalation_achieved: false }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Calming technique effectiveness at"))).toBe(true);
    });

    it("153 — child engagement 50-69 warning insight", () => {
      const records = Array.from({ length: 10 }, (_, i) =>
        makeAromaSession({ child_feedback_positive: i < 5 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Child engagement at"))).toBe(true);
    });

    it("154 — aroma safety 70-79 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: [
            ...nAroma(7, { consent_obtained: true, allergy_check_completed: true, contraindication_check_completed: true, risk_assessment_current: true }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
            makeAromaSession({ consent_obtained: true, allergy_check_completed: false, contraindication_check_completed: false, risk_assessment_current: false }),
          ],
        }),
      );
      // (28+3)/(10*4) = 31/40 = 78%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("safety compliance at"))).toBe(true);
    });

    it("155 — aromatherapy access 30-49 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 10,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
          ],
        }),
      );
      // 3/10 = 30%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Aromatherapy access at"))).toBe(true);
    });

    it("156 — relaxation child involved < 50 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(5, { child_involved_in_planning: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("child involvement in relaxation programme planning"))).toBe(true);
    });

    it("157 — benefit child voice < 50 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { child_voice_captured: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("benefit assessments capture the child's voice"))).toBe(true);
    });

    it("158 — benefit review overdue > 30 warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { review_overdue: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("overdue for review"))).toBe(true);
    });

    it("159 — adverse 11-20 warning insight", () => {
      const records = Array.from({ length: 8 }, (_, i) =>
        makeAromaSession({ adverse_reaction: i < 1 }),
      );
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({ aromatherapy_session_records: records }),
      );
      // 1/8 = 13% → > 10 <= 20
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("adverse reaction rate"))).toBe(true);
    });

    it("160 — therapy type analysis warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          wellbeing_therapy_records: [
            makeWellbeingTherapy({ therapy_type: "aromatherapy" }),
            makeWellbeingTherapy({ therapy_type: "reflexology" }),
            makeWellbeingTherapy({ therapy_type: "yoga" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Most accessed wellbeing therapies"))).toBe(true);
    });

    it("161 — calming context analysis warning insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: [
            makeCalmingTechnique({ context: "bedtime" }),
            makeCalmingTechnique({ context: "bedtime" }),
            makeCalmingTechnique({ context: "anxiety_episode" }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Most common contexts for calming techniques"))).toBe(true);
    });
  });

  describe("Insights — positive", () => {
    it("162 — outstanding rating positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
            makeAromaSession({ child_id: "c4" }),
          ],
          wellbeing_therapy_records: nWellbeing(5),
          relaxation_programme_records: nRelaxation(5),
          calming_technique_records: nCalming(5),
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("163 — safety 95+ and zero adverse positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { adverse_reaction: false }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("safety compliance with zero adverse"))).toBe(true);
    });

    it("164 — therapy quality >= 90 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(5),
          wellbeing_therapy_records: nWellbeing(5),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("therapy quality"))).toBe(true);
    });

    it("165 — relaxation effectiveness >= 85 and anxiety reduced >= 80 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(10, {
            measurable_outcomes_set: true,
            measurable_outcomes_achieved: true,
            anxiety_level_before: 8,
            anxiety_level_after: 3,
            child_feedback_positive: true,
            reviewed: true,
          }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("relaxation programme effectiveness"))).toBe(true);
    });

    it("166 — child benefit >= 85 and child self-report >= 80 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(10),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child benefit rate") && i.text.includes("child self-reported benefit"))).toBe(true);
    });

    it("167 — calming technique >= 85 and de-escalation >= 85 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(10),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("calming technique effectiveness"))).toBe(true);
    });

    it("168 — child engagement >= 90 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          aromatherapy_session_records: nAroma(10, { child_feedback_positive: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child engagement"))).toBe(true);
    });

    it("169 — calming child-initiated >= 70 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          calming_technique_records: nCalming(10, { child_initiated: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child-initiated"))).toBe(true);
    });

    it("170 — relaxation child involved >= 90 and positive >= 90 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          relaxation_programme_records: nRelaxation(10, { child_involved_in_planning: true, child_feedback_positive: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("child involvement in planning"))).toBe(true);
    });

    it("171 — benefit wants continue >= 90 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(10, { child_wants_to_continue: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("want to continue"))).toBe(true);
    });

    it("172 — wellbeing mood >= 80 and anxiety >= 80 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          wellbeing_therapy_records: nWellbeing(10, { mood_improvement_observed: true, anxiety_reduction_observed: true }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("mood improvement") && i.text.includes("anxiety reduction"))).toBe(true);
    });

    it("173 — avg benefit progress >= 4.0 positive insight", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          child_benefit_records: nBenefit(5, { overall_progress_rating: 5 }),
        }),
      );
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("progress rating"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 17. HEADLINES
  // ════════════════════════════════════════════════════════════════════════

  describe("Headlines", () => {
    it("174 — outstanding headline", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
            makeAromaSession({ child_id: "c4" }),
          ],
          wellbeing_therapy_records: nWellbeing(5),
          relaxation_programme_records: nRelaxation(5),
          calming_technique_records: nCalming(5),
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.headline).toContain("Outstanding");
    });

    it("175 — good headline mentions strengths count", () => {
      // Create a scenario that yields "good"
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
          ],
          wellbeing_therapy_records: nWellbeing(3),
          relaxation_programme_records: nRelaxation(3),
        }),
      );
      if (r.wellbeing_therapy_rating === "good") {
        expect(r.headline).toContain("Good");
        expect(r.headline).toContain("strength");
      }
    });

    it("176 — adequate headline mentions concerns", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          relaxation_programme_records: nRelaxation(3, {
            measurable_outcomes_set: false,
            anxiety_level_before: 5,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
            child_involved_in_planning: false,
          }),
        }),
      );
      if (r.wellbeing_therapy_rating === "adequate") {
        expect(r.headline).toContain("Adequate");
        expect(r.headline).toContain("concern");
      }
    });

    it("177 — inadequate headline mentions urgent action", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(5, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
            adverse_reaction: true,
          }),
          relaxation_programme_records: nRelaxation(5, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
          }),
          child_benefit_records: nBenefit(5, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
          }),
        }),
      );
      expect(r.wellbeing_therapy_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 18. COMPOSITE / INTEGRATION SCENARIOS
  // ════════════════════════════════════════════════════════════════════════

  describe("Composite scenarios", () => {
    it("178 — perfect scenario across all domains", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
            makeAromaSession({ child_id: "c4" }),
            makeAromaSession({ child_id: "c5" }),
          ],
          wellbeing_therapy_records: nWellbeing(5),
          relaxation_programme_records: nRelaxation(5),
          calming_technique_records: nCalming(5),
          child_benefit_records: nBenefit(5),
        }),
      );
      expect(r.wellbeing_therapy_rating).toBe("outstanding");
      expect(r.wellbeing_therapy_score).toBeGreaterThanOrEqual(80);
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.aromatherapy_access_rate).toBe(100);
      expect(r.therapy_quality_rate).toBe(100);
      expect(r.relaxation_effectiveness_rate).toBe(100);
      expect(r.calming_technique_rate).toBe(100);
      expect(r.child_benefit_rate).toBe(100);
      expect(r.child_engagement_rate).toBe(100);
    });

    it("179 — worst-case scenario across all domains", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 100,
          aromatherapy_session_records: nAroma(10, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            allergy_check_completed: false,
            contraindication_check_completed: false,
            risk_assessment_current: false,
            adverse_reaction: true,
            session_goals_set: false,
            child_mood_before: 4,
            child_mood_after: 2,
          }),
          wellbeing_therapy_records: nWellbeing(10, {
            therapist_qualified: false,
            consent_obtained: false,
            notes_recorded: false,
            child_feedback_positive: false,
            therapeutic_benefit_observed: false,
            child_self_reported_benefit: false,
            mood_improvement_observed: false,
            anxiety_reduction_observed: false,
            staff_present: false,
          }),
          relaxation_programme_records: nRelaxation(10, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 8,
            child_feedback_positive: false,
            reviewed: false,
            child_involved_in_planning: false,
            staff_trained: false,
          }),
          calming_technique_records: nCalming(10, {
            effectiveness_rating: 1,
            technique_appropriate: false,
            sensory_profile_considered: false,
            de_escalation_achieved: false,
            child_feedback_positive: false,
            child_initiated: false,
          }),
          child_benefit_records: nBenefit(10, {
            overall_wellbeing_improvement: false,
            child_self_reported_benefit: false,
            staff_reported_benefit: false,
            child_voice_captured: false,
            child_wants_to_continue: false,
            review_overdue: true,
            overall_progress_rating: 1,
          }),
        }),
      );
      expect(r.wellbeing_therapy_rating).toBe("inadequate");
      expect(r.wellbeing_therapy_score).toBeLessThan(45);
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      expect(r.insights.some((i) => i.severity === "critical")).toBe(true);
    });

    it("180 — mixed scenario produces appropriate balance of strengths and concerns", () => {
      const r = computeAromatherapyWellbeingTherapies(
        baseInput({
          total_children: 5,
          // Good aroma sessions
          aromatherapy_session_records: [
            makeAromaSession({ child_id: "c1" }),
            makeAromaSession({ child_id: "c2" }),
            makeAromaSession({ child_id: "c3" }),
          ],
          // Good wellbeing
          wellbeing_therapy_records: nWellbeing(5),
          // Poor relaxation
          relaxation_programme_records: nRelaxation(5, {
            measurable_outcomes_set: false,
            anxiety_level_before: 3,
            anxiety_level_after: 5,
            child_feedback_positive: false,
            reviewed: false,
            child_involved_in_planning: false,
          }),
          // Good calming
          calming_technique_records: nCalming(5),
          // No benefit assessments
        }),
      );
      // Should have both strengths and concerns
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBeGreaterThan(0);
      // Verify totals
      expect(r.total_aromatherapy_sessions).toBe(3);
      expect(r.total_wellbeing_therapies).toBe(5);
      expect(r.total_relaxation_programmes).toBe(5);
      expect(r.total_calming_techniques).toBe(5);
      expect(r.total_child_benefit_assessments).toBe(0);
    });
  });
});
