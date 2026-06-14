import { describe, expect, it } from "vitest";
import { analyzePACE } from "../paceAnalyzer";
import { buildPACESupervisionInsight } from "../paceSupervisionEngine";
import { buildPACEReflection } from "../paceReflectionEngine";
import { getPACETrainingModules, getPACETrainingForContext, getPACETrainingModule } from "../paceTrainingEngine";

describe("PACE supervision engine", () => {
  it("surfaces recurring patterns and recommends manager review for poor practice", () => {
    const poor = "He was naughty and manipulative, kicked off for no reason. I lost my temper and sanctioned him.";
    const analyses = [
      analyzePACE({ text: poor, context: "DAILY_LOG" }),
      analyzePACE({ text: poor, context: "DAILY_LOG" }),
      analyzePACE({ text: poor, context: "DAILY_LOG" }),
    ];
    const ins = buildPACESupervisionInsight("staff_1", analyses);
    expect(ins.recordsReviewed).toBe(3);
    expect(ins.averageScore).toBeLessThan(55);
    expect(ins.patterns.length).toBeGreaterThan(0);
    expect(ins.patterns.some((p) => p.flag === "SHAMING_LANGUAGE" || p.flag === "ADULT_TRIGGER")).toBe(true);
    expect(ins.supervisionQuestions.length).toBeGreaterThan(0);
    expect(ins.managerReviewRecommended).toBe(true);
  });

  it("recognises strengths in consistent good practice", () => {
    const good = "When Mia became upset I stayed calm and gave her space. I said it makes sense that this felt hard, and that she didn't have to manage that feeling on her own. She told me she felt ignored. We kept everyone safe and later reconnected.";
    const analyses = [analyzePACE({ text: good, context: "DAILY_LOG" }), analyzePACE({ text: good, context: "DAILY_LOG" })];
    const ins = buildPACESupervisionInsight("staff_2", analyses);
    expect(ins.strengths.length).toBeGreaterThan(0);
    expect(ins.managerReviewRecommended).toBe(false);
  });
});

describe("PACE reflection engine", () => {
  it("builds a non-blaming reflection with repair focus and self-regulation note where relevant", () => {
    const a = analyzePACE({ text: "I was angry and lost my temper. He kicked off during the incident and self-harmed.", context: "INCIDENT" });
    const r = buildPACEReflection(a);
    expect(r.whatWentWell.length).toBeGreaterThan(0); // always strengths-based, never punitive
    expect(r.repairFocus).toBeTruthy();
    expect(r.selfRegulationNote).toBeTruthy(); // adult trigger present
    expect(r.reflectiveQuestions.length).toBeGreaterThan(0);
  });
});

describe("PACE training engine", () => {
  it("provides the nine micro-learning modules, each fully formed", () => {
    const mods = getPACETrainingModules();
    expect(mods.length).toBe(9);
    for (const m of mods) {
      expect(m.explanation && m.scenario && m.goodResponse && m.poorResponse && m.reflectionQuestion && m.managerDiscussionPrompt).toBeTruthy();
    }
  });
  it("selects modules by context and by id", () => {
    expect(getPACETrainingForContext("PHYSICAL_INTERVENTION").length).toBeGreaterThan(0);
    expect(getPACETrainingModule("pace-101")?.title).toBe("What is PACE?");
    expect(getPACETrainingModule("nope")).toBeNull();
  });
});
