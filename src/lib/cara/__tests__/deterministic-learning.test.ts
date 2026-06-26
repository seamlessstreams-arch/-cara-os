import { describe, it, expect } from "vitest";
import { buildDeterministicLearning, DETERMINISTIC_LEARNING_MODES } from "../deterministic-learning";

// Fields the consuming Learning Studio pages map over WITHOUT a guard — these
// must always be non-empty arrays or the page would crash / render blank.
const REQUIRED_ARRAY_FIELDS: Record<string, string[]> = {
  learning_flashcards: ["cards"],
  learning_quiz: ["questions"],
  learning_workshop_plan: ["learning_objectives", "key_messages", "evaluation_questions", "main_content_sections"],
  learning_guidance_note: ["practical_examples", "common_mistakes", "reflection_questions", "key_definitions"],
  training_needs_analysis: ["needs", "knowledge_gaps", "immediate_actions"],
  curriculum_builder: ["learning_outcomes", "modules"],
  learning_session_plan: ["learning_outcomes", "main_activities", "reflection_prompts"],
  learning_worksheet: ["sections", "reflection_questions", "key_messages"],
  learning_safety_plan: ["warning_signs", "coping_strategies", "people_who_can_help", "things_to_remember"],
  learning_micro_learning: [],
};

describe("buildDeterministicLearning", () => {
  it("covers exactly the 10 learning modes", () => {
    expect(DETERMINISTIC_LEARNING_MODES).toHaveLength(10);
  });

  it("returns null for an unknown / non-learning mode", () => {
    expect(buildDeterministicLearning("assist")).toBeNull();
    expect(buildDeterministicLearning("ri_reg45_generate")).toBeNull();
    expect(buildDeterministicLearning("")).toBeNull();
  });

  for (const mode of Object.keys(REQUIRED_ARRAY_FIELDS)) {
    it(`${mode} returns a non-null object (with a valid pathway when present)`, () => {
      const out = buildDeterministicLearning(mode) as Record<string, unknown>;
      expect(out).not.toBeNull();
      expect(typeof out).toBe("object");
      // training_needs_analysis has no pathway field; others do.
      if (out.pathway !== undefined) {
        expect(["child", "staff", "mixed"]).toContain(out.pathway);
      }
    });

    it(`${mode} populates its unguarded array fields with non-empty arrays`, () => {
      const out = buildDeterministicLearning(mode) as Record<string, unknown>;
      for (const field of REQUIRED_ARRAY_FIELDS[mode]) {
        expect(Array.isArray(out[field]), `${mode}.${field} should be an array`).toBe(true);
        expect((out[field] as unknown[]).length, `${mode}.${field} should be non-empty`).toBeGreaterThan(0);
      }
    });
  }

  it("flashcards have the fields the page renders per card", () => {
    const out = buildDeterministicLearning("learning_flashcards") as { cards: Array<Record<string, unknown>> };
    for (const card of out.cards) {
      expect(card.question).toBeTruthy();
      expect(card.answer).toBeTruthy();
      expect(["easy", "medium", "hard"]).toContain(card.difficulty);
    }
  });

  it("quiz questions carry a valid type and marks", () => {
    const out = buildDeterministicLearning("learning_quiz") as { questions: Array<Record<string, unknown>>; total_marks: number };
    for (const q of out.questions) {
      expect(["multiple_choice", "true_false", "short_answer"]).toContain(q.type);
      expect(typeof q.marks).toBe("number");
    }
    expect(out.total_marks).toBeGreaterThan(0);
  });
});
