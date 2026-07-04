// ══════════════════════════════════════════════════════════════════════════════
// CARA — TAP THINKING MODE TESTS
//
// Pins: the five stages and their fifteen questions (verbatim), traceability
// refusal, attributed answers, honest completion (unanswered questions require
// a recorded reason), and the ethical-spine wiring on completion.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { getStore } from "@/lib/db/store";
import { computeTapStatus, TAP_STAGE_DEFINITIONS } from "../tap-engine";
import {
  answerTapQuestions,
  completeTapSession,
  createTapSession,
  getTapSession,
  listTapSessions,
} from "../session-service";
import { TAP_STAGES } from "../types";

const SRC = [{ recordType: "riskAssessments", recordId: "ra_1" }];

function makeSession() {
  const result = createTapSession({
    createdBy: "staff_test",
    childId: "yp_test",
    childName: "Jordan",
    context: "risk_review",
    purpose: "Quarterly risk review ahead of the LAC review.",
    sourceRecords: SRC,
  });
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

function answerAllOf(sessionId: string, stage: (typeof TAP_STAGES)[number]) {
  const answers = TAP_STAGE_DEFINITIONS[stage].questions.map((q) => ({
    question: q,
    answer: `Considered: ${q}`,
  }));
  const result = answerTapQuestions(sessionId, "staff_test", stage, answers);
  if (!result.ok) throw new Error(result.reason);
}

beforeEach(() => {
  getStore().tapSessions.length = 0;
  getStore().ethicalIntelligenceEvents.length = 0;
});

// ── The scaffold itself ───────────────────────────────────────────────────────

describe("TAP stage definitions (per spec)", () => {
  it("has five stages, three questions each, in order", () => {
    expect(TAP_STAGES).toEqual(["see_clearly", "think_deeply", "work_relationally", "act_with_purpose", "sustain_practice"]);
    for (const stage of TAP_STAGES) {
      expect(TAP_STAGE_DEFINITIONS[stage].questions).toHaveLength(3);
    }
  });

  it("keeps the spec's signature questions verbatim", () => {
    expect(TAP_STAGE_DEFINITIONS.see_clearly.questions).toContain("What is the child's lived experience?");
    expect(TAP_STAGE_DEFINITIONS.think_deeply.questions).toContain("What alternative explanations should be considered?");
    expect(TAP_STAGE_DEFINITIONS.work_relationally.questions).toContain("Whose voice is missing?");
    expect(TAP_STAGE_DEFINITIONS.act_with_purpose.questions).toContain("What actions will make a meaningful difference?");
    expect(TAP_STAGE_DEFINITIONS.sustain_practice.questions).toContain("What will we do if it is not working?");
  });
});

// ── Creation + traceability ───────────────────────────────────────────────────

describe("createTapSession", () => {
  it("refuses an untraced session", () => {
    const result = createTapSession({
      createdBy: "staff_test",
      context: "care_planning",
      purpose: "Planning",
      sourceRecords: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cannot trace it/i);
  });

  it("opens in_progress with empty answers and an audit entry", () => {
    const session = makeSession();
    expect(session.status).toBe("in_progress");
    expect(computeTapStatus(session).stagesComplete).toBe(0);
    expect(session.auditTrail).toHaveLength(1);
  });
});

// ── Answering ─────────────────────────────────────────────────────────────────

describe("answerTapQuestions", () => {
  it("rejects a question that is not part of the stage", () => {
    const session = makeSession();
    const result = answerTapQuestions(session.id, "staff_test", "see_clearly", [
      { question: "Made-up question?", answer: "x" },
    ]);
    expect(result.ok).toBe(false);
  });

  it("latest answer per question wins; stage completes when all three are answered", () => {
    const session = makeSession();
    answerTapQuestions(session.id, "staff_test", "see_clearly", [
      { question: "What is the child's lived experience?", answer: "First take." },
    ]);
    answerTapQuestions(session.id, "staff_test", "see_clearly", [
      { question: "What is the child's lived experience?", answer: "Refined after discussion." },
    ]);
    const s1 = getTapSession(session.id)!;
    expect(s1.answers.see_clearly.filter((a) => a.question === "What is the child's lived experience?")).toHaveLength(1);
    expect(s1.answers.see_clearly[0].answer).toBe("Refined after discussion.");

    answerAllOf(session.id, "see_clearly");
    const status = computeTapStatus(getTapSession(session.id)!);
    expect(status.stages.find((s) => s.stage === "see_clearly")?.complete).toBe(true);
    expect(status.nextQuestion).toBe("What does this information mean?");
  });
});

// ── Honest completion ─────────────────────────────────────────────────────────

describe("completeTapSession", () => {
  it("refuses completion with unanswered questions and no honest reason", () => {
    const session = makeSession();
    const result = completeTapSession(session.id, "staff_test");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/unanswered questions/i);
  });

  it("completes with an honest incompleteReason, recorded on the session", () => {
    const session = makeSession();
    answerAllOf(session.id, "see_clearly");
    const result = completeTapSession(session.id, "staff_test", {
      incompleteReason: "Meeting cut short by an incident — reconvening Thursday with the social worker.",
    });
    expect(result.ok).toBe(true);
    const stored = getTapSession(session.id)!;
    expect(stored.status).toBe("complete");
    expect(stored.incompleteReason).toMatch(/reconvening Thursday/);
  });

  it("completes cleanly when all five stages are answered", () => {
    const session = makeSession();
    for (const stage of TAP_STAGES) answerAllOf(session.id, stage);
    const result = completeTapSession(session.id, "manager_test");
    expect(result.ok).toBe(true);
    expect(getTapSession(session.id)!.incompleteReason).toBeUndefined();
    expect(computeTapStatus(getTapSession(session.id)!).allStagesComplete).toBe(true);
  });

  it("a complete session cannot be answered or completed again", () => {
    const session = makeSession();
    for (const stage of TAP_STAGES) answerAllOf(session.id, stage);
    completeTapSession(session.id, "manager_test");
    expect(answerTapQuestions(session.id, "x", "see_clearly", [{ question: "What is the child's lived experience?", answer: "y" }]).ok).toBe(false);
    expect(completeTapSession(session.id, "x").ok).toBe(false);
  });

  it("records the Think-Deeply answers as an INSIGHT on a linked ethical event", async () => {
    const { createEthicalEvent } = await import("@/lib/ethical-intelligence/capture-service");
    const event = createEthicalEvent({
      createdBy: "staff_test",
      trigger: { recordType: "riskAssessments", recordId: "ra_1" },
      triggerSummary: "Risk review",
      whatHappened: "Quarterly risk review held.",
    });
    if (!event.ok) throw new Error(event.reason);

    const session = makeSession();
    for (const stage of TAP_STAGES) answerAllOf(session.id, stage);
    const result = completeTapSession(session.id, "manager_test", { ethicalEventId: event.value.id });
    expect(result.ok).toBe(true);
    expect(event.value.insights).toHaveLength(1);
    expect(event.value.insights[0].interpretation).toMatch(/What does this information mean/);
    expect(event.value.insights[0].sourceRecords.some((s) => s.recordType === "tapSessions")).toBe(true);
    expect(getTapSession(session.id)!.auditTrail.some((a) => a.action === "ethical_cycle_recorded")).toBe(true);
  });
});

// ── Reads ─────────────────────────────────────────────────────────────────────

describe("listTapSessions", () => {
  it("filters by child, context and status", () => {
    const a = makeSession();
    createTapSession({
      createdBy: "staff_test",
      childId: "yp_other",
      context: "management_oversight",
      purpose: "Oversight thinking",
      sourceRecords: SRC,
    });
    for (const stage of TAP_STAGES) answerAllOf(a.id, stage);
    completeTapSession(a.id, "manager_test");

    expect(listTapSessions()).toHaveLength(2);
    expect(listTapSessions({ status: "complete" })).toHaveLength(1);
    expect(listTapSessions({ context: "management_oversight" })).toHaveLength(1);
    expect(listTapSessions({ childId: "yp_test" })).toHaveLength(1);
  });
});
