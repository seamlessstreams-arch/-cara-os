// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Emotional Literacy & Feelings Expression Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeEmotionalLiteracyFeelingsExpression,
  type EmotionalLiteracyInput,
  type EmotionIdentificationInput,
  type FeelingsVocabularyInput,
  type ExpressionToolInput,
  type TherapeuticJournalInput,
  type StaffAttunementInput,
} from "../home-emotional-literacy-feelings-expression-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-29";

function daysAgo(n: number): string {
  const d = new Date("2026-05-29");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

let _seq = 0;
function uid(): string { return `id_${++_seq}`; }

function makeIdentification(overrides: Partial<EmotionIdentificationInput> = {}): EmotionIdentificationInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: daysAgo(5),
    assessor_id: "staff_1",
    emotions_presented: 10,
    emotions_correctly_identified: 8,
    baseline_score: 5,
    current_score: 7,
    method: "visual_cards",
    child_engaged: true,
    child_enjoyed: true,
    nuanced_emotions_identified: true,
    context_understanding: true,
    self_recognition: true,
    empathy_demonstrated: true,
    progress_since_last: "improved",
    created_at: daysAgo(5),
    ...overrides,
  };
}

function makeVocabulary(overrides: Partial<FeelingsVocabularyInput> = {}): FeelingsVocabularyInput {
  return {
    id: uid(),
    child_id: "child_1",
    assessment_date: daysAgo(5),
    assessor_id: "staff_1",
    total_feeling_words_known: 25,
    new_words_since_last: 5,
    vocabulary_tier: "advanced",
    can_differentiate_similar: true,
    uses_feelings_spontaneously: true,
    applies_in_context: true,
    multilingual_expression: false,
    creative_expression: true,
    age_appropriate: true,
    progress_since_last: "improved",
    created_at: daysAgo(5),
    ...overrides,
  };
}

function makeExpressionTool(overrides: Partial<ExpressionToolInput> = {}): ExpressionToolInput {
  return {
    id: uid(),
    child_id: "child_1",
    tool_type: "emotion_wheel",
    date_introduced: daysAgo(30),
    date_last_used: daysAgo(1),
    times_used: 10,
    child_initiated_use: 6,
    effectiveness_rating: 4,
    child_preference_rating: 4,
    staff_confidence_using: true,
    accessible_to_child: true,
    culturally_appropriate: true,
    adapted_for_needs: true,
    created_at: daysAgo(30),
    ...overrides,
  };
}

function makeJournal(overrides: Partial<TherapeuticJournalInput> = {}): TherapeuticJournalInput {
  return {
    id: uid(),
    child_id: "child_1",
    entry_date: daysAgo(3),
    journal_type: "written",
    emotions_expressed: ["happy", "anxious"],
    depth_rating: 4,
    child_initiated: true,
    staff_supported: true,
    staff_responded: true,
    response_timely: true,
    therapeutic_value_rating: 4,
    child_found_helpful: true,
    confidentiality_maintained: true,
    linked_to_keywork: true,
    created_at: daysAgo(3),
    ...overrides,
  };
}

function makeAttunement(overrides: Partial<StaffAttunementInput> = {}): StaffAttunementInput {
  return {
    id: uid(),
    staff_id: "staff_1",
    child_id: "child_1",
    observation_date: daysAgo(3),
    observer_id: "observer_1",
    recognised_emotional_state: true,
    responded_appropriately: true,
    used_emotional_language: true,
    validated_feelings: true,
    offered_coping_strategy: true,
    followed_individual_plan: true,
    co_regulation_effective: true,
    missed_emotional_cues: false,
    repair_attempted_after_rupture: true,
    training_completed: true,
    confidence_rating: 5,
    created_at: daysAgo(3),
    ...overrides,
  };
}

function baseInput(overrides: Partial<EmotionalLiteracyInput> = {}): EmotionalLiteracyInput {
  return {
    today: TODAY,
    total_children: 4,
    emotion_identification_records: [],
    feelings_vocabulary_records: [],
    expression_tool_records: [],
    therapeutic_journal_records: [],
    staff_attunement_records: [],
    ...overrides,
  };
}

/** Generate N records for distinct children. */
function childIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `child_${i + 1}`);
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Emotional Literacy & Feelings Expression Intelligence Engine", () => {

  // ════════════════════════════════════════════════════════════════════════
  // OUTPUT SHAPE
  // ════════════════════════════════════════════════════════════════════════

  describe("output shape", () => {
    it("returns all expected fields", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({ total_children: 0 }));
      const expectedKeys = [
        "emotional_literacy_rating", "emotional_literacy_score", "headline",
        "emotion_identification_rate", "vocabulary_breadth_rate", "expression_tool_rate",
        "journal_engagement_rate", "staff_attunement_rate", "child_progress_rate",
        "total_assessments", "children_assessed", "avg_identification_score",
        "nuanced_emotion_rate", "self_recognition_rate", "empathy_rate", "context_understanding_rate",
        "avg_vocabulary_words", "spontaneous_use_rate", "creative_expression_rate", "vocabulary_progress_rate",
        "total_tools_available", "unique_tool_types", "child_initiated_tool_use_rate",
        "tool_accessibility_rate", "avg_tool_effectiveness",
        "total_journal_entries", "children_journaling", "child_initiated_journal_rate",
        "staff_response_rate", "avg_journal_depth", "journal_keywork_link_rate",
        "total_attunement_observations", "emotional_recognition_rate", "appropriate_response_rate",
        "validation_rate", "co_regulation_rate", "missed_cues_rate", "repair_rate", "staff_training_rate",
        "strengths", "concerns", "recommendations", "insights",
      ];
      for (const k of expectedKeys) {
        expect(r).toHaveProperty(k);
      }
    });

    it("strengths/concerns/recommendations/insights are arrays", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({ total_children: 0 }));
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSUFFICIENT DATA
  // ════════════════════════════════════════════════════════════════════════

  describe("insufficient_data", () => {
    it("returns insufficient_data when 0 children and all arrays empty", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({ total_children: 0 }));
      expect(r.emotional_literacy_rating).toBe("insufficient_data");
      expect(r.emotional_literacy_score).toBe(0);
    });

    it("sets correct headline for insufficient data", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({ total_children: 0 }));
      expect(r.headline).toContain("insufficient data");
    });

    it("all rates are 0 for insufficient data", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({ total_children: 0 }));
      expect(r.emotion_identification_rate).toBe(0);
      expect(r.vocabulary_breadth_rate).toBe(0);
      expect(r.expression_tool_rate).toBe(0);
      expect(r.journal_engagement_rate).toBe(0);
      expect(r.staff_attunement_rate).toBe(0);
      expect(r.child_progress_rate).toBe(0);
    });

    it("empty strengths/concerns/recommendations/insights for insufficient data", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INADEQUATE FLOOR (children present, all arrays empty)
  // ════════════════════════════════════════════════════════════════════════

  describe("inadequate floor — children present but no records", () => {
    it("returns inadequate / score 15 when children > 0 and all arrays empty", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput());
      expect(r.emotional_literacy_rating).toBe("inadequate");
      expect(r.emotional_literacy_score).toBe(15);
    });

    it("headline mentions urgent attention", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput());
      expect(r.headline).toContain("urgent attention");
    });

    it("has 2 concerns", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput());
      expect(r.concerns).toHaveLength(2);
    });

    it("has 3 recommendations", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput());
      expect(r.recommendations).toHaveLength(3);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
    });

    it("has 1 critical insight", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput());
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("all rates are 0", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput());
      expect(r.emotion_identification_rate).toBe(0);
      expect(r.staff_attunement_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PCT HELPER EDGE CASE: pct(0, 0) = 0
  // ════════════════════════════════════════════════════════════════════════

  describe("pct(0,0) = 0", () => {
    it("emotion_identification_rate is 0 when total_children = 0 but records exist", () => {
      // Not the allEmpty path since we have records, but total_children=0
      // doesn't actually hit allEmpty guard if some records exist
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 0,
        emotion_identification_records: [makeIdentification()],
      }));
      // pct(1, 0) = 0 since denominator=0
      expect(r.emotion_identification_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RATING THRESHOLDS
  // ════════════════════════════════════════════════════════════════════════

  describe("rating thresholds", () => {
    it("outstanding when score >= 80", () => {
      // Build max-bonus scenario: base 52 + 28 bonuses = 80 exactly
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: true, empathy_demonstrated: true, nuanced_emotions_identified: true, context_understanding: true }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, uses_feelings_spontaneously: true }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 6, accessible_to_child: true, staff_confidence_using: true }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_initiated: true, child_found_helpful: true, staff_responded: true, linked_to_keywork: true, confidentiality_maintained: true }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({ child_id: c, recognised_emotional_state: true, responded_appropriately: true, validated_feelings: true, co_regulation_effective: true, used_emotional_language: true, missed_emotional_cues: false, training_completed: true }),
        ),
      }));
      expect(r.emotional_literacy_score).toBeGreaterThanOrEqual(80);
      expect(r.emotional_literacy_rating).toBe("outstanding");
    });

    it("good when score >= 65 and < 80", () => {
      // base 52 + some bonuses to hit 65-79
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, uses_feelings_spontaneously: false, progress_since_last: "first_assessment" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 3 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_initiated: false, child_found_helpful: false }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({ child_id: c, validated_feelings: true, co_regulation_effective: true, used_emotional_language: true }),
        ),
      }));
      expect(r.emotional_literacy_score).toBeGreaterThanOrEqual(65);
      expect(r.emotional_literacy_score).toBeLessThan(80);
      expect(r.emotional_literacy_rating).toBe("good");
    });

    it("adequate when score >= 45 and < 65", () => {
      // base 52 + minimal bonuses, no penalties
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: true,
            co_regulation_effective: false,
            used_emotional_language: false,
          }),
        ],
      }));
      expect(r.emotional_literacy_score).toBeGreaterThanOrEqual(45);
      expect(r.emotional_literacy_score).toBeLessThan(65);
      expect(r.emotional_literacy_rating).toBe("adequate");
    });

    it("inadequate when score < 45", () => {
      // base 52 minus penalties
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
            missed_emotional_cues: true,
            training_completed: false,
          }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
        ],
      }));
      // Penalty1: idRate=10%<40 → -6
      // Penalty2: staffAttunement=0<50 → -6
      // Penalty3: missedCues=100>30 → -4
      // Penalty4: toolRate=10%<30 → -4
      // 52-6-6-4-4 = 32
      expect(r.emotional_literacy_score).toBeLessThan(45);
      expect(r.emotional_literacy_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // BASE SCORE
  // ════════════════════════════════════════════════════════════════════════

  describe("base score = 52", () => {
    it("returns 52 when no bonuses or penalties apply", () => {
      // Provide records that don't qualify for any bonus or penalty
      // idRate = 50% (2/4) — no bonus B1, no penalty P1
      // vocabRate = 50% — no bonus B2
      // toolRate = 50% — no bonus B3, no penalty P4
      // journalRate = 50% — no bonus B4
      // attunement between 50-70 — no bonus B5, no penalty P2
      // progress < 60 — no bonus B6
      // selfRec < 60 and empathy < 60 — no bonus B7
      // missedCues <= 30 — no penalty P3
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          // Attunement composite: 0.25*100 + 0.25*100 + 0.2*0 + 0.15*0 + 0.15*100 = 65
          // That's >= 50 but < 70, no bonus B5, no penalty P2
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      }));
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // BONUS ISOLATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Bonus 1 — Emotion Identification Coverage", () => {
    // To isolate: override all domains to no-bonus, no-penalty state.
    // idRate = children with id / total = varies
    // All other domains: 50% coverage, no bonuses, no penalties

    function bonusBase(idRecords: EmotionIdentificationInput[]): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: idRecords,
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      });
    }

    it("+5 when emotionIdentificationRate >= 90", () => {
      // 4/4 = 100%
      const ids = childIds(4).map(c => makeIdentification({
        child_id: c,
        self_recognition: false,
        empathy_demonstrated: false,
        progress_since_last: "first_assessment",
      }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.emotional_literacy_score).toBe(52 + 5);
    });

    it("+3 when emotionIdentificationRate >= 70 and < 90", () => {
      // 3/4 = 75%
      const ids = childIds(3).map(c => makeIdentification({
        child_id: c,
        self_recognition: false,
        empathy_demonstrated: false,
        progress_since_last: "first_assessment",
      }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.emotional_literacy_score).toBe(52 + 3);
    });

    it("+0 when emotionIdentificationRate < 70 (50%)", () => {
      const ids = childIds(2).map(c => makeIdentification({
        child_id: c,
        self_recognition: false,
        empathy_demonstrated: false,
        progress_since_last: "first_assessment",
      }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Bonus 2 — Vocabulary Breadth Coverage", () => {
    function bonusBase(vocabRecords: FeelingsVocabularyInput[]): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: vocabRecords,
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      });
    }

    it("+4 when vocabularyBreadthRate >= 90", () => {
      const vocs = childIds(4).map(c => makeVocabulary({ child_id: c, progress_since_last: "first_assessment" }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(vocs));
      expect(r.emotional_literacy_score).toBe(52 + 4);
    });

    it("+2 when vocabularyBreadthRate >= 70 and < 90", () => {
      const vocs = childIds(3).map(c => makeVocabulary({ child_id: c, progress_since_last: "first_assessment" }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(vocs));
      expect(r.emotional_literacy_score).toBe(52 + 2);
    });

    it("+0 when vocabularyBreadthRate < 70", () => {
      const vocs = childIds(2).map(c => makeVocabulary({ child_id: c, progress_since_last: "first_assessment" }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(vocs));
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Bonus 3 — Expression Tool Provision", () => {
    function bonusBase(toolRecords: ExpressionToolInput[]): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: toolRecords,
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      });
    }

    it("+4 when expressionToolRate >= 90", () => {
      const tools = childIds(4).map(c => makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 3 }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(tools));
      expect(r.emotional_literacy_score).toBe(52 + 4);
    });

    it("+2 when expressionToolRate >= 70 and < 90", () => {
      const tools = childIds(3).map(c => makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 3 }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(tools));
      expect(r.emotional_literacy_score).toBe(52 + 2);
    });

    it("+0 when expressionToolRate < 70", () => {
      const tools = childIds(2).map(c => makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 3 }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(tools));
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Bonus 4 — Journal Engagement", () => {
    function bonusBase(journalRecords: TherapeuticJournalInput[]): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: journalRecords,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      });
    }

    it("+4 when journalEngagementRate >= 80", () => {
      // 4/4 = 100% children journaling
      // child_found_helpful = false so helpfulRate = 0, won't boost childProgressRate
      const journals = childIds(4).map(c => makeJournal({ child_id: c, child_found_helpful: false, child_initiated: false }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(journals));
      expect(r.emotional_literacy_score).toBe(52 + 4);
    });

    it("+2 when journalEngagementRate >= 60 and < 80", () => {
      // 3/4 = 75%... that's >= 60 and < 80
      const journals = childIds(3).map(c => makeJournal({ child_id: c, child_found_helpful: false, child_initiated: false }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(journals));
      expect(r.emotional_literacy_score).toBe(52 + 2);
    });

    it("+0 when journalEngagementRate < 60", () => {
      // 2/4 = 50%
      const journals = childIds(2).map(c => makeJournal({ child_id: c, child_found_helpful: false, child_initiated: false }));
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(journals));
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Bonus 5 — Staff Attunement", () => {
    function bonusBase(attRecords: StaffAttunementInput[]): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: attRecords,
      });
    }

    it("+5 when staffAttunementRate >= 85", () => {
      // All true: 0.25*100 + 0.25*100 + 0.2*100 + 0.15*100 + 0.15*100 = 100
      const att = [makeAttunement({
        recognised_emotional_state: true,
        responded_appropriately: true,
        validated_feelings: true,
        co_regulation_effective: true,
        used_emotional_language: true,
        missed_emotional_cues: false,
      })];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(att));
      expect(r.staff_attunement_rate).toBe(100);
      expect(r.emotional_literacy_score).toBe(52 + 5);
    });

    it("+3 when staffAttunementRate >= 70 and < 85", () => {
      // recognised=true(25), responded=true(25), validated=true(20), coReg=false(0), lang=false(0) = 70
      const att = [makeAttunement({
        recognised_emotional_state: true,
        responded_appropriately: true,
        validated_feelings: true,
        co_regulation_effective: false,
        used_emotional_language: false,
        missed_emotional_cues: false,
      })];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(att));
      expect(r.staff_attunement_rate).toBe(70);
      expect(r.emotional_literacy_score).toBe(52 + 3);
    });

    it("+0 when staffAttunementRate < 70 but >= 50 (no penalty either)", () => {
      // recognised=true(25), responded=true(25), validated=false(0), coReg=false(0), lang=true(15) = 65
      const att = [makeAttunement({
        recognised_emotional_state: true,
        responded_appropriately: true,
        validated_feelings: false,
        co_regulation_effective: false,
        used_emotional_language: true,
        missed_emotional_cues: false,
      })];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(att));
      expect(r.staff_attunement_rate).toBe(65);
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Bonus 6 — Child Progress Rate", () => {
    function bonusBase(overrides: Partial<EmotionalLiteracyInput> = {}): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
        ...overrides,
      });
    }

    it("+3 when childProgressRate >= 80", () => {
      // progress depends on: idProgressRate (of idNonFirst), vocabProgressRate (of vocabNonFirst), childInitiatedToolRate, helpfulRate
      // Make all progress indicators high:
      // idProgressRate: all improved → 100%
      // vocabProgressRate: all improved → 100%
      // childInitiatedToolRate: 80%+ → 100 (6/10 = 60 not enough, use 9/10)
      // helpfulRate: all helpful → 100%
      // avg = (100+100+90+100)/4 = 98 → rounded to 98
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase({
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "improved" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "improved" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "improved" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "improved" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 9 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 9 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: true, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: true, child_initiated: false }),
        ],
      }));
      expect(r.child_progress_rate).toBeGreaterThanOrEqual(80);
      expect(r.emotional_literacy_score).toBe(52 + 3);
    });

    it("+1 when childProgressRate >= 60 and < 80", () => {
      // idProgressRate=100 (1 improved, 1 maintained but both non-first → 50% actually since improved=1/2)
      // Wait let me recalculate. Need exactly one domain pushing to 60-79.
      // Use only toolRecords so progressIndicators = [childInitiatedToolRate]
      // childInitiatedToolRate = pct(7, 10) = 70 → progress = 70 → +1
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase({
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 7 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 7 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: true, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
      }));
      // childInitiatedToolRate = pct(14, 20) = 70
      // helpfulRate = pct(1, 2) = 50
      // progressIndicators = [70, 50] → avg = 60
      expect(r.child_progress_rate).toBeGreaterThanOrEqual(60);
      expect(r.child_progress_rate).toBeLessThan(80);
      expect(r.emotional_literacy_score).toBe(52 + 1);
    });
  });

  describe("Bonus 7 — Self-Recognition & Empathy", () => {
    function bonusBase(idRecords: EmotionIdentificationInput[]): EmotionalLiteracyInput {
      return baseInput({
        total_children: 4,
        emotion_identification_records: idRecords,
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      });
    }

    it("+3 when selfRecognitionRate >= 80 AND empathyRate >= 80", () => {
      // Both 100%
      const ids = [
        makeIdentification({ child_id: "child_1", self_recognition: true, empathy_demonstrated: true, progress_since_last: "first_assessment" }),
        makeIdentification({ child_id: "child_2", self_recognition: true, empathy_demonstrated: true, progress_since_last: "first_assessment" }),
      ];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.self_recognition_rate).toBe(100);
      expect(r.empathy_rate).toBe(100);
      expect(r.emotional_literacy_score).toBe(52 + 3);
    });

    it("+1 when selfRecognitionRate >= 60 (but empathy < 80)", () => {
      // selfRec 100%, empathy 0%
      const ids = [
        makeIdentification({ child_id: "child_1", self_recognition: true, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        makeIdentification({ child_id: "child_2", self_recognition: true, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
      ];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.self_recognition_rate).toBe(100);
      expect(r.empathy_rate).toBe(0);
      expect(r.emotional_literacy_score).toBe(52 + 1);
    });

    it("+1 when empathyRate >= 60 (but selfRecognition < 60)", () => {
      // selfRec 0%, empathy 100%
      const ids = [
        makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: true, progress_since_last: "first_assessment" }),
        makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: true, progress_since_last: "first_assessment" }),
      ];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.empathy_rate).toBe(100);
      expect(r.self_recognition_rate).toBe(0);
      expect(r.emotional_literacy_score).toBe(52 + 1);
    });

    it("+0 when both selfRecognitionRate < 60 AND empathyRate < 60", () => {
      const ids = [
        makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
      ];
      const r = computeEmotionalLiteracyFeelingsExpression(bonusBase(ids));
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("max bonuses = 28", () => {
    it("52 + 28 = 80 with all bonuses maxed", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: true, empathy_demonstrated: true, progress_since_last: "improved" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, progress_since_last: "improved" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 9 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_found_helpful: true }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({
            child_id: c,
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: true,
            co_regulation_effective: true,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ),
      }));
      expect(r.emotional_literacy_score).toBe(80);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // PENALTY ISOLATION TESTS
  // ════════════════════════════════════════════════════════════════════════

  describe("Penalty 1 — Low Identification Coverage (-6)", () => {
    it("applies -6 when idRecords > 0 and emotionIdentificationRate < 40", () => {
      // 1/10 = 10% < 40
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_3", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_4", times_used: 10, child_initiated_use: 3 }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
        ],
      }));
      // idRate = 10% → penalty -6 (and no bonus1)
      // attunement=65 → no bonus5, no penalty2
      // toolRate = 40% → no bonus3, no penalty4
      // vocabRate = 10% → no bonus2
      // journalRate = 10% → no bonus4
      // progress: no idNonFirst, no vocabNonFirst → indicators = [childInitToolRate, helpfulRate]
      //   childInitToolRate = pct(12, 40) = 30, helpfulRate = 0 → avg = 15 → no bonus6
      // selfRec=0, empathy=0 → no bonus7
      expect(r.emotional_literacy_score).toBe(52 - 6);
    });

    it("does not apply when idRecords is empty", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        feelings_vocabulary_records: [makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" })],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_3", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_4", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false })],
      }));
      // No idRecords → no penalty1
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Penalty 2 — Low Staff Attunement (-6)", () => {
    it("applies -6 when staffAttunementRate < 50 and records exist", () => {
      // recognised=false(0), responded=false(0), validated=false(0), coReg=false(0), lang=false(0) = 0%
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
            missed_emotional_cues: false,
          }),
        ],
      }));
      expect(r.staff_attunement_rate).toBe(0);
      // penalty2 = -6, missedCues=0% no penalty3
      expect(r.emotional_literacy_score).toBe(52 - 6);
    });

    it("does not apply when no attunement records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
      }));
      // No attunement records → staffAttunement=0 but guard prevents penalty
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Penalty 3 — High Missed Cues (-4)", () => {
    it("applies -4 when missedCuesRate > 30", () => {
      // 2/2 missed = 100% > 30
      // attunement: recognised=true(25), responded=true(25), validated=true(20), coReg=true(15), lang=true(15) = 100
      // But we need missedCues=true for penalty3 only, not penalty2
      // Actually penalty3 is independent — just need missedCuesRate > 30 and records exist
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: true,
            co_regulation_effective: true,
            used_emotional_language: true,
            missed_emotional_cues: true,
          }),
        ],
      }));
      expect(r.missed_cues_rate).toBe(100);
      // staffAttunement = 100 → bonus5 = +5
      // penalty3 = -4
      expect(r.emotional_literacy_score).toBe(52 + 5 - 4);
    });

    it("does not apply when missedCuesRate <= 30", () => {
      // 0/1 = 0%
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
          makeVocabulary({ child_id: "child_2", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
          makeJournal({ child_id: "child_2", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      }));
      expect(r.missed_cues_rate).toBe(0);
      expect(r.emotional_literacy_score).toBe(52);
    });
  });

  describe("Penalty 4 — Low Expression Tool Coverage (-4)", () => {
    it("applies -4 when toolRecords > 0 and expressionToolRate < 30", () => {
      // 1/10 = 10% < 30
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      }));
      expect(r.expression_tool_rate).toBe(10);
      // penalty1: idRate=10% → -6
      // penalty4: toolRate=10% → -4
      // 52 - 6 - 4 = 42
      expect(r.emotional_literacy_score).toBe(52 - 6 - 4);
    });

    it("does not apply when tool rate >= 30", () => {
      // 4/10 = 40% >= 30
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: childIds(4).map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 3 }),
        ),
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ],
      }));
      expect(r.expression_tool_rate).toBe(40);
      // penalty1: idRate=10% → -6
      // no penalty4
      expect(r.emotional_literacy_score).toBe(52 - 6);
    });
  });

  describe("all penalties combined", () => {
    it("applies all 4 penalties: -6 -6 -4 -4 = -20, score = 32", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false, child_initiated: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
            missed_emotional_cues: true,
          }),
        ],
      }));
      // P1: idRate=10%<40 → -6
      // P2: attunement=0<50 → -6
      // P3: missedCues=100>30 → -4
      // P4: toolRate=10%<30 → -4
      // 52 - 20 = 32
      expect(r.emotional_literacy_score).toBe(32);
    });
  });

  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      // Already max is 80, but let's confirm clamping
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: true, empathy_demonstrated: true, progress_since_last: "improved" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, progress_since_last: "improved" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 9 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_found_helpful: true }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({
            child_id: c,
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: true,
            co_regulation_effective: true,
            used_emotional_language: true,
            missed_emotional_cues: false,
          }),
        ),
      }));
      expect(r.emotional_literacy_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      // Can't actually go below 0 with base=52 and max penalties=20, but let's verify clamp
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
            missed_emotional_cues: true,
          }),
        ],
      }));
      expect(r.emotional_literacy_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6 CORE RATES
  // ════════════════════════════════════════════════════════════════════════

  describe("6 core rates", () => {
    it("emotion_identification_rate = pct(children with id, total_children)", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 5,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_2" }),
          makeIdentification({ child_id: "child_1" }), // duplicate child
        ],
      }));
      expect(r.emotion_identification_rate).toBe(40); // 2/5
    });

    it("vocabulary_breadth_rate = pct(children with vocab, total_children)", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 5,
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1" }),
          makeVocabulary({ child_id: "child_2" }),
          makeVocabulary({ child_id: "child_3" }),
        ],
      }));
      expect(r.vocabulary_breadth_rate).toBe(60); // 3/5
    });

    it("expression_tool_rate = pct(children with tools, total_children)", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 5,
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1" }),
          makeExpressionTool({ child_id: "child_1" }), // same child, different tool
          makeExpressionTool({ child_id: "child_2" }),
        ],
      }));
      expect(r.expression_tool_rate).toBe(40); // 2/5
    });

    it("journal_engagement_rate = pct(children journaling, total_children)", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1" }),
          makeJournal({ child_id: "child_2" }),
          makeJournal({ child_id: "child_3" }),
        ],
      }));
      expect(r.journal_engagement_rate).toBe(75); // 3/4
    });

    it("staff_attunement_rate is composite weighted average", () => {
      // 0.25*100 + 0.25*0 + 0.2*100 + 0.15*0 + 0.15*100 = 25+0+20+0+15 = 60
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: false,
            validated_feelings: true,
            co_regulation_effective: false,
            used_emotional_language: true,
          }),
        ],
      }));
      expect(r.staff_attunement_rate).toBe(60);
    });

    it("staff_attunement_rate is 0 when no records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.staff_attunement_rate).toBe(0);
    });

    it("child_progress_rate averages progress indicators", () => {
      // idProgressRate: 1 improved / 2 non-first = 50
      // vocabProgressRate: 1 improved / 1 non-first = 100
      // childInitiatedToolRate: pct(5, 10) = 50
      // helpfulRate: pct(1, 2) = 50
      // avg = (50+100+50+50)/4 = 62.5 → 63
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", progress_since_last: "improved" }),
          makeIdentification({ child_id: "child_2", progress_since_last: "maintained" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "improved" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 5 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: true }),
          makeJournal({ child_id: "child_2", child_found_helpful: false }),
        ],
      }));
      expect(r.child_progress_rate).toBe(63);
    });

    it("child_progress_rate is 0 when no progress indicators", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        // No tools, no journals → only id/vocab with first_assessment → 0 progressIndicators
      }));
      expect(r.child_progress_rate).toBe(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // SUPPLEMENTARY METRICS
  // ════════════════════════════════════════════════════════════════════════

  describe("supplementary metrics — Emotion Identification", () => {
    it("total_assessments counts id records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification(), makeIdentification(), makeIdentification()],
      }));
      expect(r.total_assessments).toBe(3);
    });

    it("children_assessed counts unique children", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_2" }),
        ],
      }));
      expect(r.children_assessed).toBe(2);
    });

    it("avg_identification_score averages current_score", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ current_score: 6 }),
          makeIdentification({ current_score: 8 }),
        ],
      }));
      expect(r.avg_identification_score).toBe(7);
    });

    it("nuanced_emotion_rate counts nuanced identifications", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ nuanced_emotions_identified: true }),
          makeIdentification({ nuanced_emotions_identified: false }),
        ],
      }));
      expect(r.nuanced_emotion_rate).toBe(50);
    });

    it("self_recognition_rate counts self_recognition", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ self_recognition: true }),
          makeIdentification({ self_recognition: true }),
          makeIdentification({ self_recognition: false }),
        ],
      }));
      expect(r.self_recognition_rate).toBe(67); // 2/3 = 66.66 → 67
    });

    it("empathy_rate counts empathy_demonstrated", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ empathy_demonstrated: true }),
          makeIdentification({ empathy_demonstrated: false }),
          makeIdentification({ empathy_demonstrated: false }),
        ],
      }));
      expect(r.empathy_rate).toBe(33); // 1/3
    });

    it("context_understanding_rate counts context_understanding", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ context_understanding: true }),
          makeIdentification({ context_understanding: true }),
        ],
      }));
      expect(r.context_understanding_rate).toBe(100);
    });
  });

  describe("supplementary metrics — Vocabulary", () => {
    it("avg_vocabulary_words averages total_feeling_words_known", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ total_feeling_words_known: 20 }),
          makeVocabulary({ total_feeling_words_known: 30 }),
        ],
      }));
      expect(r.avg_vocabulary_words).toBe(25);
    });

    it("spontaneous_use_rate counts uses_feelings_spontaneously", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ uses_feelings_spontaneously: true }),
          makeVocabulary({ uses_feelings_spontaneously: false }),
        ],
      }));
      expect(r.spontaneous_use_rate).toBe(50);
    });

    it("creative_expression_rate counts creative_expression", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ creative_expression: true }),
          makeVocabulary({ creative_expression: true }),
          makeVocabulary({ creative_expression: false }),
        ],
      }));
      expect(r.creative_expression_rate).toBe(67);
    });

    it("vocabulary_progress_rate counts improved among non-first", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ progress_since_last: "improved" }),
          makeVocabulary({ progress_since_last: "maintained" }),
          makeVocabulary({ progress_since_last: "first_assessment" }),
        ],
      }));
      expect(r.vocabulary_progress_rate).toBe(50); // 1/2 non-first improved
    });
  });

  describe("supplementary metrics — Expression Tools", () => {
    it("total_tools_available counts records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [makeExpressionTool(), makeExpressionTool()],
      }));
      expect(r.total_tools_available).toBe(2);
    });

    it("unique_tool_types counts distinct tool types", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ tool_type: "emotion_wheel" }),
          makeExpressionTool({ tool_type: "emotion_wheel" }),
          makeExpressionTool({ tool_type: "calm_corner" }),
          makeExpressionTool({ tool_type: "mood_tracker" }),
        ],
      }));
      expect(r.unique_tool_types).toBe(3);
    });

    it("child_initiated_tool_use_rate is pct of child_initiated / times_used", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ times_used: 10, child_initiated_use: 7 }),
        ],
      }));
      expect(r.child_initiated_tool_use_rate).toBe(50); // 10/20
    });

    it("tool_accessibility_rate counts accessible tools", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ accessible_to_child: true }),
          makeExpressionTool({ accessible_to_child: false }),
        ],
      }));
      expect(r.tool_accessibility_rate).toBe(50);
    });

    it("avg_tool_effectiveness averages effectiveness_rating", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ effectiveness_rating: 3 }),
          makeExpressionTool({ effectiveness_rating: 5 }),
        ],
      }));
      expect(r.avg_tool_effectiveness).toBe(4);
    });
  });

  describe("supplementary metrics — Journaling", () => {
    it("total_journal_entries counts journal records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [makeJournal(), makeJournal(), makeJournal()],
      }));
      expect(r.total_journal_entries).toBe(3);
    });

    it("children_journaling counts unique children", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1" }),
          makeJournal({ child_id: "child_1" }),
          makeJournal({ child_id: "child_2" }),
        ],
      }));
      expect(r.children_journaling).toBe(2);
    });

    it("child_initiated_journal_rate counts child_initiated", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ child_initiated: true }),
          makeJournal({ child_initiated: false }),
          makeJournal({ child_initiated: true }),
        ],
      }));
      expect(r.child_initiated_journal_rate).toBe(67);
    });

    it("staff_response_rate counts staff_responded", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ staff_responded: true }),
          makeJournal({ staff_responded: true }),
          makeJournal({ staff_responded: false }),
        ],
      }));
      expect(r.staff_response_rate).toBe(67);
    });

    it("avg_journal_depth averages depth_rating", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ depth_rating: 3 }),
          makeJournal({ depth_rating: 5 }),
        ],
      }));
      expect(r.avg_journal_depth).toBe(4);
    });

    it("journal_keywork_link_rate counts linked_to_keywork", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ linked_to_keywork: true }),
          makeJournal({ linked_to_keywork: false }),
          makeJournal({ linked_to_keywork: true }),
        ],
      }));
      expect(r.journal_keywork_link_rate).toBe(67);
    });
  });

  describe("supplementary metrics — Staff Attunement", () => {
    it("total_attunement_observations counts records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [makeAttunement(), makeAttunement()],
      }));
      expect(r.total_attunement_observations).toBe(2);
    });

    it("emotional_recognition_rate counts recognised_emotional_state", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ recognised_emotional_state: true }),
          makeAttunement({ recognised_emotional_state: false }),
        ],
      }));
      expect(r.emotional_recognition_rate).toBe(50);
    });

    it("appropriate_response_rate counts responded_appropriately", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ responded_appropriately: true }),
          makeAttunement({ responded_appropriately: true }),
          makeAttunement({ responded_appropriately: false }),
        ],
      }));
      expect(r.appropriate_response_rate).toBe(67);
    });

    it("validation_rate counts validated_feelings", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ validated_feelings: true }),
          makeAttunement({ validated_feelings: false }),
        ],
      }));
      expect(r.validation_rate).toBe(50);
    });

    it("co_regulation_rate counts co_regulation_effective", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ co_regulation_effective: true }),
          makeAttunement({ co_regulation_effective: false }),
        ],
      }));
      expect(r.co_regulation_rate).toBe(50);
    });

    it("missed_cues_rate counts missed_emotional_cues", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ missed_emotional_cues: true }),
          makeAttunement({ missed_emotional_cues: false }),
          makeAttunement({ missed_emotional_cues: false }),
        ],
      }));
      expect(r.missed_cues_rate).toBe(33);
    });

    it("repair_rate counts repair_attempted_after_rupture", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ repair_attempted_after_rupture: true }),
          makeAttunement({ repair_attempted_after_rupture: false }),
        ],
      }));
      expect(r.repair_rate).toBe(50);
    });

    it("staff_training_rate counts training_completed", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ training_completed: true }),
          makeAttunement({ training_completed: true }),
          makeAttunement({ training_completed: false }),
        ],
      }));
      expect(r.staff_training_rate).toBe(67);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes emotion identification >= 90 strength", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c => makeIdentification({ child_id: c })),
      }));
      expect(r.strengths.some(s => s.includes("100%") && s.includes("emotion identification"))).toBe(true);
    });

    it("includes emotion identification >= 70 (lower tier) strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: childIds(3).map(c => makeIdentification({ child_id: c })),
      }));
      expect(r.strengths.some(s => s.includes("75%") && s.includes("emotion identification"))).toBe(true);
    });

    it("includes nuanced rate >= 70 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ nuanced_emotions_identified: true }),
          makeIdentification({ nuanced_emotions_identified: true }),
          makeIdentification({ nuanced_emotions_identified: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("nuanced emotion recognition"))).toBe(true);
    });

    it("includes self-recognition >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ self_recognition: true }),
          makeIdentification({ self_recognition: true }),
          makeIdentification({ self_recognition: true }),
          makeIdentification({ self_recognition: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("self-recognition rate"))).toBe(true);
    });

    it("includes empathy >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ empathy_demonstrated: true }),
          makeIdentification({ empathy_demonstrated: true }),
          makeIdentification({ empathy_demonstrated: true }),
          makeIdentification({ empathy_demonstrated: true }),
          makeIdentification({ empathy_demonstrated: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("empathy demonstration rate"))).toBe(true);
    });

    it("includes context understanding >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ context_understanding: true }),
          makeIdentification({ context_understanding: true }),
          makeIdentification({ context_understanding: true }),
          makeIdentification({ context_understanding: true }),
          makeIdentification({ context_understanding: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("context understanding rate"))).toBe(true);
    });

    it("includes engagement >= 90 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: Array.from({ length: 10 }, () => makeIdentification({ child_engaged: true })),
      }));
      expect(r.strengths.some(s => s.includes("engagement in emotion identification"))).toBe(true);
    });

    it("includes vocabulary breadth >= 90 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: childIds(4).map(c => makeVocabulary({ child_id: c })),
      }));
      expect(r.strengths.some(s => s.includes("feelings vocabulary assessments"))).toBe(true);
    });

    it("includes spontaneous use >= 70 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ uses_feelings_spontaneously: true }),
          makeVocabulary({ uses_feelings_spontaneously: true }),
          makeVocabulary({ uses_feelings_spontaneously: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("spontaneously"))).toBe(true);
    });

    it("includes advanced vocab >= 50 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ vocabulary_tier: "advanced" }),
          makeVocabulary({ vocabulary_tier: "nuanced" }),
          makeVocabulary({ vocabulary_tier: "basic" }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("advanced or nuanced vocabulary"))).toBe(true);
    });

    it("includes differentiate >= 70 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ can_differentiate_similar: true }),
          makeVocabulary({ can_differentiate_similar: true }),
          makeVocabulary({ can_differentiate_similar: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("differentiate similar emotions"))).toBe(true);
    });

    it("includes creative expression >= 60 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ creative_expression: true }),
          makeVocabulary({ creative_expression: true }),
          makeVocabulary({ creative_expression: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("creative expression"))).toBe(true);
    });

    it("includes multilingual > 0 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ multilingual_expression: true }),
          makeVocabulary({ multilingual_expression: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("heritage language"))).toBe(true);
    });

    it("includes expression tool >= 90 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: childIds(4).map(c => makeExpressionTool({ child_id: c })),
      }));
      expect(r.strengths.some(s => s.includes("expression tools"))).toBe(true);
    });

    it("includes unique tool types >= 5 strength", () => {
      const types: ExpressionToolInput["tool_type"][] = ["emotion_wheel", "calm_corner", "mood_tracker", "worry_box", "art_therapy"];
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: types.map(t => makeExpressionTool({ tool_type: t })),
      }));
      expect(r.strengths.some(s => s.includes("different expression tool types"))).toBe(true);
    });

    it("includes child-initiated tool use >= 50 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [makeExpressionTool({ times_used: 10, child_initiated_use: 6 })],
      }));
      expect(r.strengths.some(s => s.includes("child-initiated"))).toBe(true);
    });

    it("includes tool accessibility >= 90 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: Array.from({ length: 10 }, () => makeExpressionTool({ accessible_to_child: true })),
      }));
      expect(r.strengths.some(s => s.includes("tool accessibility rate"))).toBe(true);
    });

    it("includes avg tool effectiveness >= 4.0 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ effectiveness_rating: 4 }),
          makeExpressionTool({ effectiveness_rating: 5 }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("tool effectiveness rating"))).toBe(true);
    });

    it("includes staff tool confidence >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: Array.from({ length: 5 }, () => makeExpressionTool({ staff_confidence_using: true })),
      }));
      expect(r.strengths.some(s => s.includes("staff confidence"))).toBe(true);
    });

    it("includes journal engagement >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: childIds(4).map(c => makeJournal({ child_id: c })),
      }));
      expect(r.strengths.some(s => s.includes("therapeutic journaling"))).toBe(true);
    });

    it("includes child-initiated journal >= 50 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ child_initiated: true }),
          makeJournal({ child_initiated: true }),
          makeJournal({ child_initiated: false }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("child-initiated"))).toBe(true);
    });

    it("includes staff response >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: Array.from({ length: 5 }, () => makeJournal({ staff_responded: true })),
      }));
      expect(r.strengths.some(s => s.includes("staff response rate"))).toBe(true);
    });

    it("includes journal depth >= 4.0 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ depth_rating: 4 }),
          makeJournal({ depth_rating: 5 }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("journal depth rating"))).toBe(true);
    });

    it("includes keywork link >= 70 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ linked_to_keywork: true }),
          makeJournal({ linked_to_keywork: true }),
          makeJournal({ linked_to_keywork: true }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("keywork sessions"))).toBe(true);
    });

    it("includes confidentiality >= 95 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: Array.from({ length: 20 }, () => makeJournal({ confidentiality_maintained: true })),
      }));
      expect(r.strengths.some(s => s.includes("Confidentiality maintained"))).toBe(true);
    });

    it("includes journal types >= 4 strength", () => {
      const types: TherapeuticJournalInput["journal_type"][] = ["written", "drawn", "digital", "audio"];
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: types.map(t => makeJournal({ journal_type: t })),
      }));
      expect(r.strengths.some(s => s.includes("journaling formats"))).toBe(true);
    });

    it("includes staff attunement >= 85 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [makeAttunement()],
      }));
      expect(r.strengths.some(s => s.includes("staff attunement rate"))).toBe(true);
    });

    it("includes emotional recognition >= 90 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 10 }, () => makeAttunement({ recognised_emotional_state: true })),
      }));
      expect(r.strengths.some(s => s.includes("emotional state recognition rate"))).toBe(true);
    });

    it("includes validation >= 85 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 10 }, () => makeAttunement({ validated_feelings: true })),
      }));
      expect(r.strengths.some(s => s.includes("feelings validation rate"))).toBe(true);
    });

    it("includes co-regulation >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 5 }, () => makeAttunement({ co_regulation_effective: true })),
      }));
      expect(r.strengths.some(s => s.includes("co-regulation rate"))).toBe(true);
    });

    it("includes missed cues <= 10 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 10 }, () => makeAttunement({ missed_emotional_cues: false })),
      }));
      expect(r.strengths.some(s => s.includes("missed emotional cues"))).toBe(true);
    });

    it("includes emotional language >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 5 }, () => makeAttunement({ used_emotional_language: true })),
      }));
      expect(r.strengths.some(s => s.includes("model emotional language"))).toBe(true);
    });

    it("includes staff training >= 90 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 10 }, () => makeAttunement({ training_completed: true })),
      }));
      expect(r.strengths.some(s => s.includes("emotional literacy training"))).toBe(true);
    });

    it("includes repair rate >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 5 }, () => makeAttunement({ repair_attempted_after_rupture: true })),
      }));
      expect(r.strengths.some(s => s.includes("repair attempt rate"))).toBe(true);
    });

    it("includes child progress >= 80 strength", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c => makeIdentification({ child_id: c, progress_since_last: "improved" })),
        feelings_vocabulary_records: ids.map(c => makeVocabulary({ child_id: c, progress_since_last: "improved" })),
        expression_tool_records: ids.map(c => makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 9 })),
        therapeutic_journal_records: ids.map(c => makeJournal({ child_id: c, child_found_helpful: true })),
      }));
      expect(r.child_progress_rate).toBeGreaterThanOrEqual(80);
      expect(r.strengths.some(s => s.includes("child progress rate"))).toBe(true);
    });

    it("includes idProgressRate >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ progress_since_last: "improved" }),
          makeIdentification({ progress_since_last: "improved" }),
          makeIdentification({ progress_since_last: "improved" }),
          makeIdentification({ progress_since_last: "improved" }),
          makeIdentification({ progress_since_last: "maintained" }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("improvement in emotion identification"))).toBe(true);
    });

    it("includes vocabProgressRate >= 80 strength", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ progress_since_last: "improved" }),
          makeVocabulary({ progress_since_last: "improved" }),
          makeVocabulary({ progress_since_last: "improved" }),
          makeVocabulary({ progress_since_last: "improved" }),
          makeVocabulary({ progress_since_last: "maintained" }),
        ],
      }));
      expect(r.strengths.some(s => s.includes("expanding their feelings vocabulary"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("includes low identification coverage < 40 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [makeIdentification({ child_id: "child_1" })],
      }));
      expect(r.concerns.some(c => c.includes("10%") && c.includes("emotion identification"))).toBe(true);
    });

    it("includes moderate identification coverage 40-69 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_2" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("50%") && c.includes("emotion identification"))).toBe(true);
    });

    it("includes no id records concern when children present", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [makeVocabulary()],
      }));
      expect(r.concerns.some(c => c.includes("No emotion identification assessments recorded"))).toBe(true);
    });

    it("includes self-recognition < 40 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("self-recognition rate"))).toBe(true);
    });

    it("includes declined assessments concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ progress_since_last: "declined" }),
          makeIdentification({ progress_since_last: "declined" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("declined"))).toBe(true);
    });

    it("includes low vocab breadth < 40 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        feelings_vocabulary_records: [makeVocabulary({ child_id: "child_1" })],
      }));
      expect(r.concerns.some(c => c.includes("feelings vocabulary assessments"))).toBe(true);
    });

    it("includes no vocab records concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.concerns.some(c => c.includes("No feelings vocabulary assessments"))).toBe(true);
    });

    it("includes spontaneous use < 30 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ uses_feelings_spontaneously: false }),
          makeVocabulary({ uses_feelings_spontaneously: false }),
          makeVocabulary({ uses_feelings_spontaneously: false }),
          makeVocabulary({ uses_feelings_spontaneously: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("spontaneously"))).toBe(true);
    });

    it("includes age-appropriate < 60 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ age_appropriate: true }),
          makeVocabulary({ age_appropriate: false }),
          makeVocabulary({ age_appropriate: false }),
          makeVocabulary({ age_appropriate: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("age-appropriate vocabulary"))).toBe(true);
    });

    it("includes low expression tool < 30 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        expression_tool_records: [makeExpressionTool({ child_id: "child_1" })],
      }));
      expect(r.concerns.some(c => c.includes("expression tools"))).toBe(true);
    });

    it("includes moderate expression tool 30-59 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1" }),
          makeExpressionTool({ child_id: "child_2" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("expression tool coverage"))).toBe(true);
    });

    it("includes no tools concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.concerns.some(c => c.includes("No expression tools recorded"))).toBe(true);
    });

    it("includes low tool accessibility < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ accessible_to_child: false }),
          makeExpressionTool({ accessible_to_child: false }),
          makeExpressionTool({ accessible_to_child: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("accessible"))).toBe(true);
    });

    it("includes low tool effectiveness < 2.5 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ effectiveness_rating: 1 }),
          makeExpressionTool({ effectiveness_rating: 2 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("tool effectiveness"))).toBe(true);
    });

    it("includes low staff tool confidence < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ staff_confidence_using: false }),
          makeExpressionTool({ staff_confidence_using: false }),
          makeExpressionTool({ staff_confidence_using: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("staff confidence"))).toBe(true);
    });

    it("includes low journal engagement < 30 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        therapeutic_journal_records: [makeJournal({ child_id: "child_1" })],
      }));
      expect(r.concerns.some(c => c.includes("therapeutic journaling"))).toBe(true);
    });

    it("includes no journal records concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.concerns.some(c => c.includes("No therapeutic journal entries"))).toBe(true);
    });

    it("includes low staff response < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ staff_responded: false }),
          makeJournal({ staff_responded: false }),
          makeJournal({ staff_responded: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("staff response rate"))).toBe(true);
    });

    it("includes confidentiality < 90 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ confidentiality_maintained: false }),
          makeJournal({ confidentiality_maintained: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("Confidentiality"))).toBe(true);
    });

    it("includes low journal depth < 2.5 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ depth_rating: 1 }),
          makeJournal({ depth_rating: 2 }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("journal depth"))).toBe(true);
    });

    it("includes low attunement < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
          }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("staff attunement rate"))).toBe(true);
    });

    it("includes moderate attunement 50-69 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: false,
            validated_feelings: true,
            co_regulation_effective: false,
            used_emotional_language: true,
          }),
        ],
      }));
      // 0.25*100 + 0.25*0 + 0.2*100 + 0.15*0 + 0.15*100 = 60
      expect(r.concerns.some(c => c.includes("Staff attunement rate at 60%"))).toBe(true);
    });

    it("includes no attunement records concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.concerns.some(c => c.includes("No staff attunement observations"))).toBe(true);
    });

    it("includes high missed cues > 30 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ missed_emotional_cues: true }),
          makeAttunement({ missed_emotional_cues: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("missed emotional cues") && c.includes("100%"))).toBe(true);
    });

    it("includes moderate missed cues 16-30 concern", () => {
      // Need 16-30% missed cues. 1 of 4 = 25%
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ missed_emotional_cues: true }),
          makeAttunement({ missed_emotional_cues: false }),
          makeAttunement({ missed_emotional_cues: false }),
          makeAttunement({ missed_emotional_cues: false }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("25%") && c.includes("missed emotional cues"))).toBe(true);
    });

    it("includes low validation < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ validated_feelings: false }),
          makeAttunement({ validated_feelings: false }),
          makeAttunement({ validated_feelings: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("validation rate"))).toBe(true);
    });

    it("includes low co-regulation < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ co_regulation_effective: false }),
          makeAttunement({ co_regulation_effective: false }),
          makeAttunement({ co_regulation_effective: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("co-regulation"))).toBe(true);
    });

    it("includes low staff training < 50 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ training_completed: false }),
          makeAttunement({ training_completed: false }),
          makeAttunement({ training_completed: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("emotional literacy training"))).toBe(true);
    });

    it("includes low repair < 40 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ repair_attempted_after_rupture: false }),
          makeAttunement({ repair_attempted_after_rupture: false }),
          makeAttunement({ repair_attempted_after_rupture: true }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("repair attempt rate"))).toBe(true);
    });

    it("includes low child progress < 30 concern", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ progress_since_last: "maintained" }),
          makeIdentification({ progress_since_last: "maintained" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ times_used: 10, child_initiated_use: 1 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_found_helpful: false }),
        ],
      }));
      // idProgress = 0/2 = 0%, childInitTool = 10%, helpful = 0%
      // avg = (0+10+0)/3 = 3
      expect(r.child_progress_rate).toBeLessThan(30);
      expect(r.child_progress_rate).toBeGreaterThan(0);
      expect(r.concerns.some(c => c.includes("child progress rate"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("includes immediate rec when no id records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [makeVocabulary()],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("emotion identification"))).toBe(true);
    });

    it("includes immediate rec when low id coverage < 40", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [makeIdentification({ child_id: "child_1" })],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("extend emotion identification"))).toBe(true);
    });

    it("includes immediate rec when low attunement < 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
          }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("attunement"))).toBe(true);
    });

    it("includes immediate rec when no attunement records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("attunement"))).toBe(true);
    });

    it("includes immediate rec when high missed cues > 30", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ missed_emotional_cues: true }),
          makeAttunement({ missed_emotional_cues: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("missed emotional cues"))).toBe(true);
    });

    it("includes immediate rec when no tools", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("expression tool"))).toBe(true);
    });

    it("includes immediate rec when low tool coverage < 30", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        expression_tool_records: [makeExpressionTool({ child_id: "child_1" })],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("expression tool coverage"))).toBe(true);
    });

    it("includes immediate rec when low validation < 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ validated_feelings: false }),
          makeAttunement({ validated_feelings: false }),
          makeAttunement({ validated_feelings: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "immediate" && rec.recommendation.includes("validation"))).toBe(true);
    });

    it("includes soon rec when no vocab records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("vocabulary"))).toBe(true);
    });

    it("includes soon rec when low vocab breadth < 40", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        feelings_vocabulary_records: [makeVocabulary({ child_id: "child_1" })],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("vocabulary"))).toBe(true);
    });

    it("includes soon rec when low spontaneous use < 30", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ uses_feelings_spontaneously: false }),
          makeVocabulary({ uses_feelings_spontaneously: false }),
          makeVocabulary({ uses_feelings_spontaneously: false }),
          makeVocabulary({ uses_feelings_spontaneously: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("spontaneous"))).toBe(true);
    });

    it("includes soon rec when no journal records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("journaling"))).toBe(true);
    });

    it("includes soon rec when low staff response < 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ staff_responded: false }),
          makeJournal({ staff_responded: false }),
          makeJournal({ staff_responded: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("staff response rate"))).toBe(true);
    });

    it("includes soon rec when low self-recognition < 40", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "soon" && rec.recommendation.includes("self-recognition"))).toBe(true);
    });

    it("includes planned rec when moderate id coverage 40-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_2" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("emotion identification coverage"))).toBe(true);
    });

    it("includes planned rec when moderate vocab 40-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1" }),
          makeVocabulary({ child_id: "child_2" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("vocabulary assessment coverage"))).toBe(true);
    });

    it("includes planned rec when moderate journal engagement 30-59", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1" }),
          makeJournal({ child_id: "child_2" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("journaling engagement"))).toBe(true);
    });

    it("includes planned rec when low keywork link < 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ linked_to_keywork: false }),
          makeJournal({ linked_to_keywork: false }),
          makeJournal({ linked_to_keywork: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("keywork"))).toBe(true);
    });

    it("includes planned rec when moderate tool coverage 30-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1" }),
          makeExpressionTool({ child_id: "child_2" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("expression tool access"))).toBe(true);
    });

    it("includes planned rec when few tool types < 4", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ tool_type: "emotion_wheel" }),
          makeExpressionTool({ tool_type: "calm_corner" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("Diversify"))).toBe(true);
    });

    it("includes planned rec when moderate attunement 50-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: false,
            validated_feelings: true,
            co_regulation_effective: false,
            used_emotional_language: true,
          }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("attunement improvement plan"))).toBe(true);
    });

    it("includes planned rec when low emotional language < 60", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ used_emotional_language: false }),
          makeAttunement({ used_emotional_language: false }),
          makeAttunement({ used_emotional_language: true }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.urgency === "planned" && rec.recommendation.includes("emotional language"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      if (r.recommendations.length > 1) {
        for (let i = 1; i < r.recommendations.length; i++) {
          expect(r.recommendations[i].rank).toBe(r.recommendations[i - 1].rank + 1);
        }
      }
    });

    it("all recommendations have a regulatory_ref", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [makeIdentification()],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
      }
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    it("includes critical insight when no id records", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [makeVocabulary()],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("No emotion identification"))).toBe(true);
    });

    it("includes critical insight when low id coverage < 40", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [makeIdentification({ child_id: "child_1" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("10%"))).toBe(true);
    });

    it("includes critical insight when low attunement < 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
          }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("attunement"))).toBe(true);
    });

    it("includes critical insight when high missed cues > 30", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ missed_emotional_cues: true }),
          makeAttunement({ missed_emotional_cues: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("miss emotional cues"))).toBe(true);
    });

    it("includes critical insight when low tool coverage < 30", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        expression_tool_records: [makeExpressionTool({ child_id: "child_1" })],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("expression tools"))).toBe(true);
    });

    it("includes critical insight when low validation < 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ validated_feelings: false }),
          makeAttunement({ validated_feelings: false }),
          makeAttunement({ validated_feelings: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("validation rate"))).toBe(true);
    });

    it("includes critical insight when confidentiality < 80", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ confidentiality_maintained: false }),
          makeJournal({ confidentiality_maintained: false }),
          makeJournal({ confidentiality_maintained: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "critical" && i.text.includes("Confidentiality"))).toBe(true);
    });

    it("includes warning insight when moderate id coverage 40-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_2" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("50%"))).toBe(true);
    });

    it("includes warning insight when selfRecognition 40-59", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ self_recognition: true }),
          makeIdentification({ self_recognition: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Self-recognition at 50%"))).toBe(true);
    });

    it("includes warning insight when selfRecognition < 40", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: false }),
          makeIdentification({ self_recognition: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("25%"))).toBe(true);
    });

    it("includes warning insight when spontaneous 30-59", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ uses_feelings_spontaneously: true }),
          makeVocabulary({ uses_feelings_spontaneously: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("spontaneous"))).toBe(true);
    });

    it("includes warning insight when moderate vocab breadth 40-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1" }),
          makeVocabulary({ child_id: "child_2" }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Vocabulary assessment coverage"))).toBe(true);
    });

    it("includes warning insight when moderate attunement 50-69", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: false,
            validated_feelings: true,
            co_regulation_effective: false,
            used_emotional_language: true,
          }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("Staff attunement at 60%"))).toBe(true);
    });

    it("includes warning insight when moderate missed cues 16-30", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({ missed_emotional_cues: true }),
          makeAttunement({ missed_emotional_cues: false }),
          makeAttunement({ missed_emotional_cues: false }),
          makeAttunement({ missed_emotional_cues: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("25%") && i.text.includes("missed emotional cues"))).toBe(true);
    });

    it("includes positive insight for outstanding rating", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: true, empathy_demonstrated: true, progress_since_last: "improved" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, progress_since_last: "improved" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 9 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_found_helpful: true }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({ child_id: c }),
        ),
      }));
      expect(r.emotional_literacy_rating).toBe("outstanding");
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("outstanding"))).toBe(true);
    });

    it("includes positive insight when high id coverage + nuanced", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, nuanced_emotions_identified: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("nuanced recognition"))).toBe(true);
    });

    it("includes positive insight when high selfRec + empathy both >= 80", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: Array.from({ length: 5 }, () =>
          makeIdentification({ self_recognition: true, empathy_demonstrated: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("self-recognition") && i.text.includes("empathy"))).toBe(true);
    });

    it("includes positive insight when staff attunement >= 85", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [makeAttunement()],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("attunement"))).toBe(true);
    });

    it("includes positive insight when high validation + co-regulation", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 10 }, () =>
          makeAttunement({ validated_feelings: true, co_regulation_effective: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("validation") && i.text.includes("co-regulation"))).toBe(true);
    });

    it("includes positive insight when high spontaneous use >= 70", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ uses_feelings_spontaneously: true }),
          makeVocabulary({ uses_feelings_spontaneously: true }),
          makeVocabulary({ uses_feelings_spontaneously: true }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("spontaneous"))).toBe(true);
    });

    it("includes positive insight when child-initiated tool+journal >= 50", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [makeExpressionTool({ times_used: 10, child_initiated_use: 6 })],
        therapeutic_journal_records: [
          makeJournal({ child_initiated: true }),
          makeJournal({ child_initiated: true }),
          makeJournal({ child_initiated: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("initiate"))).toBe(true);
    });

    it("includes positive insight when deep + helpful journals", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: Array.from({ length: 5 }, () =>
          makeJournal({ depth_rating: 5, child_found_helpful: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("Journal depth"))).toBe(true);
    });

    it("includes positive insight when high staff response + keywork link", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: Array.from({ length: 10 }, () =>
          makeJournal({ staff_responded: true, linked_to_keywork: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("staff response rate") && i.text.includes("keywork"))).toBe(true);
    });

    it("includes positive insight when child progress >= 80", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, progress_since_last: "improved" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, progress_since_last: "improved" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 9 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_found_helpful: true }),
        ),
      }));
      expect(r.child_progress_rate).toBeGreaterThanOrEqual(80);
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("child progress rate"))).toBe(true);
    });

    it("includes positive insight when high emotional language >= 80", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 5 }, () =>
          makeAttunement({ used_emotional_language: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("model emotional language"))).toBe(true);
    });

    it("includes positive insight when high repair >= 80", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: Array.from({ length: 5 }, () =>
          makeAttunement({ repair_attempted_after_rupture: true }),
        ),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("repair rate"))).toBe(true);
    });

    it("includes positive insight when diverse + accessible tools", () => {
      const types: ExpressionToolInput["tool_type"][] = ["emotion_wheel", "calm_corner", "mood_tracker", "worry_box", "art_therapy"];
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: types.map(t => makeExpressionTool({ tool_type: t, accessible_to_child: true })),
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("tool types") && i.text.includes("accessibility"))).toBe(true);
    });

    it("includes positive insight when creative + multilingual", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ creative_expression: true, multilingual_expression: true }),
          makeVocabulary({ creative_expression: true, multilingual_expression: true }),
          makeVocabulary({ creative_expression: true, multilingual_expression: false }),
        ],
      }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("creative expression") && i.text.includes("multilingual"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // HEADLINES
  // ════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("outstanding headline says 'Outstanding emotional literacy'", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: true, empathy_demonstrated: true, progress_since_last: "improved" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, progress_since_last: "improved" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 9 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_found_helpful: true }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({ child_id: c }),
        ),
      }));
      expect(r.headline).toContain("Outstanding emotional literacy");
    });

    it("good headline mentions strengths and areas for improvement", () => {
      const ids = childIds(4);
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: ids.map(c =>
          makeIdentification({ child_id: c, self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ),
        feelings_vocabulary_records: ids.map(c =>
          makeVocabulary({ child_id: c, uses_feelings_spontaneously: false, progress_since_last: "first_assessment" }),
        ),
        expression_tool_records: ids.map(c =>
          makeExpressionTool({ child_id: c, times_used: 10, child_initiated_use: 3 }),
        ),
        therapeutic_journal_records: ids.map(c =>
          makeJournal({ child_id: c, child_initiated: false, child_found_helpful: false }),
        ),
        staff_attunement_records: ids.map(c =>
          makeAttunement({ child_id: c, validated_feelings: true, co_regulation_effective: true, used_emotional_language: true }),
        ),
      }));
      expect(r.emotional_literacy_rating).toBe("good");
      expect(r.headline).toContain("Good emotional literacy");
    });

    it("adequate headline mentions concerns", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
          makeIdentification({ child_id: "child_2", self_recognition: false, empathy_demonstrated: false, progress_since_last: "first_assessment" }),
        ],
        feelings_vocabulary_records: [
          makeVocabulary({ child_id: "child_1", progress_since_last: "first_assessment" }),
        ],
        expression_tool_records: [
          makeExpressionTool({ child_id: "child_1", times_used: 10, child_initiated_use: 3 }),
          makeExpressionTool({ child_id: "child_2", times_used: 10, child_initiated_use: 3 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_id: "child_1", child_found_helpful: false }),
        ],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: true,
            co_regulation_effective: false,
            used_emotional_language: false,
          }),
        ],
      }));
      expect(r.emotional_literacy_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate emotional literacy");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline mentions urgent action", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [makeIdentification({ child_id: "child_1" })],
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
            missed_emotional_cues: true,
          }),
        ],
        expression_tool_records: [makeExpressionTool({ child_id: "child_1" })],
      }));
      expect(r.emotional_literacy_rating).toBe("inadequate");
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("urgent action");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("handles 1 child with all domains populated", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 1,
        emotion_identification_records: [makeIdentification({ child_id: "child_1" })],
        feelings_vocabulary_records: [makeVocabulary({ child_id: "child_1" })],
        expression_tool_records: [makeExpressionTool({ child_id: "child_1" })],
        therapeutic_journal_records: [makeJournal({ child_id: "child_1" })],
        staff_attunement_records: [makeAttunement({ child_id: "child_1" })],
      }));
      expect(r.emotion_identification_rate).toBe(100);
      expect(r.vocabulary_breadth_rate).toBe(100);
      expect(r.expression_tool_rate).toBe(100);
      expect(r.journal_engagement_rate).toBe(100);
    });

    it("handles many children with sparse data", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 100,
        emotion_identification_records: [makeIdentification({ child_id: "child_1" })],
      }));
      expect(r.emotion_identification_rate).toBe(1);
    });

    it("duplicate child_id in same domain only counted once for coverage", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 2,
        emotion_identification_records: [
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_1" }),
          makeIdentification({ child_id: "child_1" }),
        ],
      }));
      expect(r.children_assessed).toBe(1);
      expect(r.emotion_identification_rate).toBe(50);
    });

    it("handles 0 emotions_presented without division error", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ emotions_presented: 0, emotions_correctly_identified: 0 }),
        ],
      }));
      // pct(0, 0) = 0
      expect(r).toBeDefined();
    });

    it("handles 0 times_used in expression tools", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ times_used: 0, child_initiated_use: 0 }),
        ],
      }));
      expect(r.child_initiated_tool_use_rate).toBe(0);
    });

    it("handles empty emotions_expressed arrays in journals", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        therapeutic_journal_records: [
          makeJournal({ emotions_expressed: [] }),
        ],
      }));
      expect(r).toBeDefined();
    });

    it("counts single declined assessment correctly", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ progress_since_last: "declined" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("1 assessment shows declined"))).toBe(true);
    });

    it("counts multiple declined assessments with correct plural", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ progress_since_last: "declined" }),
          makeIdentification({ progress_since_last: "declined" }),
          makeIdentification({ progress_since_last: "declined" }),
        ],
      }));
      expect(r.concerns.some(c => c.includes("3 assessments show declined"))).toBe(true);
    });

    it("single tool type pluralization in recommendation", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ tool_type: "emotion_wheel" }),
        ],
      }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("1 type available"))).toBe(true);
    });

    it("handles very large input arrays", () => {
      const records = Array.from({ length: 200 }, (_, i) =>
        makeIdentification({ child_id: `child_${i % 10}` }),
      );
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: records,
      }));
      expect(r.total_assessments).toBe(200);
      expect(r.children_assessed).toBe(10);
    });

    it("only first_assessment progress yields 0 progress indicators for that domain", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        emotion_identification_records: [
          makeIdentification({ progress_since_last: "first_assessment" }),
        ],
      }));
      // idNonFirst = 0, so no progress indicator added
      expect(r.child_progress_rate).toBe(0);
    });

    it("partial domains still contribute to progress", () => {
      // Only tools and journals, no id/vocab non-first
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        expression_tool_records: [
          makeExpressionTool({ times_used: 10, child_initiated_use: 8 }),
        ],
        therapeutic_journal_records: [
          makeJournal({ child_found_helpful: true }),
        ],
      }));
      // childInitiatedToolRate = 80%, helpfulRate = 100%
      // progressIndicators = [80, 100] → avg = 90
      expect(r.child_progress_rate).toBe(90);
    });

    it("mixed attunement records compute composite correctly", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        staff_attunement_records: [
          makeAttunement({
            recognised_emotional_state: true,
            responded_appropriately: true,
            validated_feelings: true,
            co_regulation_effective: true,
            used_emotional_language: true,
          }),
          makeAttunement({
            recognised_emotional_state: false,
            responded_appropriately: false,
            validated_feelings: false,
            co_regulation_effective: false,
            used_emotional_language: false,
          }),
        ],
      }));
      // 0.25*50 + 0.25*50 + 0.2*50 + 0.15*50 + 0.15*50 = 50
      expect(r.staff_attunement_rate).toBe(50);
    });

    it("vocab progress with all maintained yields 0 progress rate", () => {
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 4,
        feelings_vocabulary_records: [
          makeVocabulary({ progress_since_last: "maintained" }),
          makeVocabulary({ progress_since_last: "maintained" }),
        ],
      }));
      expect(r.vocabulary_progress_rate).toBe(0);
    });

    it("no strengths when nothing exceeds thresholds", () => {
      // Minimal partial data that triggers no strength
      const r = computeEmotionalLiteracyFeelingsExpression(baseInput({
        total_children: 10,
        emotion_identification_records: [
          makeIdentification({
            child_id: "child_1",
            self_recognition: false,
            empathy_demonstrated: false,
            nuanced_emotions_identified: false,
            context_understanding: false,
            child_engaged: false,
            progress_since_last: "first_assessment",
          }),
        ],
      }));
      // idRate = 10%, nuanced=0, selfRec=0, empathy=0, context=0, engagement=0
      // No other domains, no progress (first_assessment)
      expect(r.strengths).toHaveLength(0);
    });
  });
});
