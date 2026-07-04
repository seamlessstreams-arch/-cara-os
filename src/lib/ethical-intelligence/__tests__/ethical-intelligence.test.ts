// ══════════════════════════════════════════════════════════════════════════════
// CARA — ETHICAL INTELLIGENCE SPINE TESTS
//
// Pins the two safety-critical rules:
//  1. TRACEABILITY — "If Cara cannot trace it, Cara cannot claim it": every
//     stage append without a source record is REFUSED.
//  2. HUMAN DECISIONS — a decision without a named human decision-maker is
//     REFUSED (Cara never makes the decision).
// Plus the cycle engine: stage completion, integration questions, next step.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  computeEthicalCycleStatus,
  emptyIntegrationChecklist,
  isEventFullyTraceable,
  isTraceable,
  openIntegrationQuestions,
} from "../ethical-intelligence-engine";
import {
  createEthicalEvent,
  getEthicalEvent,
  listEthicalEvents,
  markOversightCompleted,
  recordAction,
  recordDecision,
  recordInsight,
  recordLearning,
  recordOutcome,
  updateIntegration,
} from "../capture-service";
import type { EthicalIntelligenceEvent, EthicalSourceRef } from "../types";

const SRC: EthicalSourceRef[] = [{ recordType: "incidents", recordId: "inc_test_1" }];

function makeEvent() {
  const result = createEthicalEvent({
    createdBy: "staff_test",
    childId: "yp_test",
    childName: "Jordan",
    trigger: { recordType: "incidents", recordId: "inc_test_1" },
    triggerSummary: "Incident during community time",
    whatHappened: "Jordan left the group during community time and returned 40 minutes later.",
    childExperience: "Jordan said they felt crowded and needed space.",
    staffObserved: "Jordan appeared calm on return and accepted a check-in.",
  });
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

beforeEach(() => {
  // Isolate: clear the spine collection between tests.
  getStore().ethicalIntelligenceEvents.length = 0;
});

// ── Traceability (the core rule) ──────────────────────────────────────────────

describe("traceability — if Cara cannot trace it, Cara cannot claim it", () => {
  it("isTraceable requires at least one well-formed source ref", () => {
    expect(isTraceable(undefined)).toBe(false);
    expect(isTraceable([])).toBe(false);
    expect(isTraceable([{ recordType: "", recordId: "x" }])).toBe(false);
    expect(isTraceable([{ recordType: "incidents", recordId: "" }])).toBe(false);
    expect(isTraceable(SRC)).toBe(true);
  });

  it("refuses to create an event with no trigger record", () => {
    const result = createEthicalEvent({
      createdBy: "staff_test",
      trigger: { recordType: "", recordId: "" },
      triggerSummary: "untraced",
      whatHappened: "Something happened.",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cannot trace it/i);
  });

  it.each([
    ["insight", (id: string) => recordInsight(id, "staff_test", { informationKnown: ["x"], interpretation: "y", alternativeExplanations: [], sourceRecords: [] })],
    ["decision", (id: string) => recordDecision(id, { decisionSummary: "d", decisionMaker: "RM", evidence: ["e"], sourceRecords: [] })],
    ["action", (id: string) => recordAction(id, "staff_test", { actionTaken: "a", followUpRequired: [], sourceRecords: [] })],
    ["outcome", (id: string) => recordOutcome(id, "staff_test", { whatChanged: "w", direction: "too_early_to_say", sourceRecords: [] })],
    ["learning", (id: string) => recordLearning(id, "staff_test", { whatWasLearned: "l", toEmbedInPractice: [], embedTargets: [], embedded: false, sourceRecords: [] })],
  ])("refuses an untraced %s", (_stage, append) => {
    const event = makeEvent();
    const result = append(event.id);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cannot trace it/i);
  });

  it("isEventFullyTraceable is true only when every stage record cites a source", () => {
    const event = makeEvent();
    expect(isEventFullyTraceable(event)).toBe(true);
    recordInsight(event.id, "staff_test", { informationKnown: ["known"], interpretation: "meaning", alternativeExplanations: ["alt"], sourceRecords: SRC });
    expect(isEventFullyTraceable(getEthicalEvent(event.id)!)).toBe(true);
  });
});

// ── Human decisions ───────────────────────────────────────────────────────────

describe("decisions are made by named humans, never Cara", () => {
  it("refuses a decision without a decision maker", () => {
    const event = makeEvent();
    const result = recordDecision(event.id, {
      decisionSummary: "Increase support",
      decisionMaker: "",
      evidence: ["risk assessment"],
      sourceRecords: SRC,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/never makes the decision/i);
  });

  it("accepts and persists a named human decision, appending the audit trail", () => {
    const event = makeEvent();
    const result = recordDecision(event.id, {
      decisionSummary: "Increase to 2:1 for community time",
      decisionMaker: "Registered Manager",
      decisionMakerRole: "registered_manager",
      evidence: ["Missing-from-care records", "Risk assessment"],
      sourceRecords: SRC,
    });
    expect(result.ok).toBe(true);
    const stored = getEthicalEvent(event.id)!;
    expect(stored.decisions).toHaveLength(1);
    expect(stored.auditTrail.some((a) => a.action === "decision_recorded")).toBe(true);
  });
});

// ── Cycle status ──────────────────────────────────────────────────────────────

describe("computeEthicalCycleStatus", () => {
  it("a fresh event completes Experience only, with the child-voice prompt kept visible", () => {
    const event = makeEvent();
    const status = computeEthicalCycleStatus(event);
    expect(status.stages.find((s) => s.stage === "experience")?.complete).toBe(true);
    expect(status.stagesComplete).toBe(1);
    expect(status.cycleComplete).toBe(false);
    expect(status.nextStep).toBeTruthy();
  });

  it("progresses through the full cycle to completion", () => {
    const event = makeEvent();
    recordInsight(event.id, "staff_test", { informationKnown: ["Two prior episodes"], interpretation: "Community time is the pressure point", alternativeExplanations: ["Peer conflict", "Contact-related distress"], sourceRecords: SRC });
    recordDecision(event.id, { decisionSummary: "2:1 support", decisionMaker: "RM", evidence: ["risk assessment"], sourceRecords: SRC });
    recordAction(event.id, "staff_test", { actionTaken: "Rostered 2:1 for community time", followUpRequired: ["Weekly review with Jordan"], sourceRecords: SRC });
    recordOutcome(event.id, "staff_test", { whatChanged: "No further episodes in two weeks", direction: "improved", reviewedAt: "2026-07-04", reviewedBy: "RM", sourceRecords: SRC });
    recordLearning(event.id, "staff_test", { whatWasLearned: "Jordan regulates better with a named adult nearby", toEmbedInPractice: ["Update community-time plan"], embedTargets: ["care plan"], embedded: true, sourceRecords: SRC });
    updateIntegration(event.id, "RM", {
      childVoiceHeard: true,
      childPlanUpdated: true,
      riskAssessmentUpdated: true,
      behaviourSupportPlanUpdated: true,
      managementOversightCompleted: true,
      workflowFullyCompleted: true,
      // outcomeReviewed was stamped by recordOutcome (reviewedBy present)
    });

    const status = computeEthicalCycleStatus(getEthicalEvent(event.id)!);
    expect(status.stagesComplete).toBe(6);
    expect(status.cycleComplete).toBe(true);
    expect(status.nextStep).toBeNull();
    expect(status.fullyTraceable).toBe(true);
  });

  it("impact requires an outcome, not just an action — intent is not impact", () => {
    const event = makeEvent();
    recordAction(event.id, "staff_test", { actionTaken: "Did the thing", followUpRequired: [], sourceRecords: SRC });
    const status = computeEthicalCycleStatus(getEthicalEvent(event.id)!);
    expect(status.stages.find((s) => s.stage === "impact")?.complete).toBe(false);
  });

  it("integration answered NO stays open and is reported honestly", () => {
    const checklist = emptyIntegrationChecklist();
    checklist.childVoiceHeard = false;
    const open = openIntegrationQuestions(checklist);
    expect(open.some((q) => /voice.*recorded as NO/i.test(q))).toBe(true);
    expect(open).toHaveLength(7);
  });
});

// ── Integration + oversight stamp ─────────────────────────────────────────────

describe("integration checklist", () => {
  it("markOversightCompleted stamps the cycle from the sign-off path", () => {
    const event = makeEvent();
    const result = markOversightCompleted(event.id, "manager_test");
    expect(result.ok).toBe(true);
    expect(getEthicalEvent(event.id)!.integration.managementOversightCompleted).toBe(true);
    expect(getEthicalEvent(event.id)!.auditTrail.some((a) => a.action === "integration_updated")).toBe(true);
  });

  it("rejects non-tri-state integration answers", () => {
    const event = makeEvent();
    const result = updateIntegration(event.id, "x", { childVoiceHeard: "yes" as unknown as boolean });
    expect(result.ok).toBe(false);
  });
});

// ── Reads ─────────────────────────────────────────────────────────────────────

describe("listEthicalEvents", () => {
  it("filters by child and by trigger record", () => {
    makeEvent();
    createEthicalEvent({
      createdBy: "staff_test",
      childId: "yp_other",
      trigger: { recordType: "dailyLog", recordId: "dl_9" },
      triggerSummary: "Daily log entry",
      whatHappened: "A settled evening after a difficult call.",
    });
    expect(listEthicalEvents()).toHaveLength(2);
    expect(listEthicalEvents({ childId: "yp_test" })).toHaveLength(1);
    expect(listEthicalEvents({ triggerRecordId: "dl_9" })).toHaveLength(1);
  });
});
