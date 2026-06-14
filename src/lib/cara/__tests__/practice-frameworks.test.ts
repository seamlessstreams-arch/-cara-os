import { describe, expect, it } from "vitest";
import {
  BEHAVIOUR_DRIVERS,
  LADDER_OF_INFERENCE,
  SUPERVISION_TESTS,
  SUPERVISION_REFLECTION_QUESTIONS,
  PROTECTIVE_FACTORS,
  INDEPENDENCE_SKILLS,
  SAFETY_PLAN_SECTIONS,
  STAFF_WELLBEING_RESETS,
  FRAMEWORK_GUIDANCE_BLOCK,
  behaviourDriverQuestions,
  behaviourDriverReflections,
  ladderReflections,
  inferenceDistortions,
  supervisionWarningSigns,
  protectiveFactorNames,
  independenceSkillsForDomain,
} from "../practice-frameworks";

describe("practice-frameworks — structured data is complete & faithful", () => {
  it("has the five R-Domain behaviour drivers, each with indicators + reflective questions", () => {
    expect(BEHAVIOUR_DRIVERS).toHaveLength(5);
    for (const d of BEHAVIOUR_DRIVERS) {
      expect(d.indicators.length).toBeGreaterThan(0);
      expect(d.reflectiveQuestions.length).toBeGreaterThan(0);
      expect(d.insight).toBeTruthy();
    }
    expect(BEHAVIOUR_DRIVERS.map((d) => d.key)).toContain("function_adaptive_benefits");
  });

  it("has the seven-rung ladder of inference in order, with distortions + interruptions", () => {
    expect(LADDER_OF_INFERENCE).toHaveLength(7);
    expect(LADDER_OF_INFERENCE.map((r) => r.step)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(LADDER_OF_INFERENCE[0].name).toBe("Observable information");
    expect(LADDER_OF_INFERENCE[6].name).toBe("Action");
    for (const r of LADDER_OF_INFERENCE) {
      expect(r.distortions.length).toBeGreaterThan(0);
      expect(r.interruption).toBeTruthy();
    }
  });

  it("has four supervision tests (each with a warning sign) and five reflection questions", () => {
    expect(SUPERVISION_TESTS).toHaveLength(4);
    expect(SUPERVISION_TESTS.every((t) => t.warningSign.length > 0)).toBe(true);
    expect(SUPERVISION_REFLECTION_QUESTIONS).toHaveLength(5);
  });

  it("has seven protective factors and twenty-five independence skills", () => {
    expect(PROTECTIVE_FACTORS).toHaveLength(7);
    expect(INDEPENDENCE_SKILLS).toHaveLength(25);
    expect(INDEPENDENCE_SKILLS.map((s) => s.n)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it("has the safety-plan sections and staff wellbeing resets", () => {
    expect(SAFETY_PLAN_SECTIONS.length).toBeGreaterThanOrEqual(8);
    expect(STAFF_WELLBEING_RESETS).toHaveLength(8);
  });
});

describe("practice-frameworks — helpers", () => {
  it("the system-prompt block names the core lenses", () => {
    expect(FRAMEWORK_GUIDANCE_BLOCK).toMatch(/Behaviour is the clue/);
    expect(FRAMEWORK_GUIDANCE_BLOCK).toMatch(/Ladder of Inference/i);
    expect(FRAMEWORK_GUIDANCE_BLOCK).toMatch(/[Pp]rotective factors/);
    expect(FRAMEWORK_GUIDANCE_BLOCK).toMatch(/lived experience/i);
  });

  it("behaviourDriverQuestions returns one question per driver in {domain,question} shape", () => {
    const qs = behaviourDriverQuestions("livers");
    expect(qs).toHaveLength(5);
    expect(qs.every((q) => q.domain === "livers" && q.question.length > 0)).toBe(true);
  });

  it("reflection / distortion / warning-sign helpers return the expected counts", () => {
    expect(behaviourDriverReflections()).toHaveLength(5);
    expect(ladderReflections()).toHaveLength(7);
    expect(inferenceDistortions().length).toBeGreaterThan(15);
    expect(supervisionWarningSigns()).toHaveLength(4);
    expect(protectiveFactorNames()).toHaveLength(7);
  });

  it("maps independence skills to a curriculum domain", () => {
    const health = independenceSkillsForDomain("Health and wellbeing");
    expect(health.length).toBeGreaterThan(0);
    expect(health.some((s) => /self-care|health literacy/i.test(s.skill))).toBe(true);
    expect(independenceSkillsForDomain("No Such Domain")).toHaveLength(0);
  });
});
