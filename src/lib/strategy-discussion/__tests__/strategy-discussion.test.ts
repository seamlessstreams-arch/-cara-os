// ══════════════════════════════════════════════════════════════════════════════
// CARA — STRATEGY DISCUSSION REASONING TESTS
//
// Pins: the eight sections + the Seven Threshold Reasoning Questions VERBATIM;
// deterministic evidence classification (direct/reported/observed/pattern),
// each item citing its records; honest unknowns (never papered over);
// human-attributed editing; and the manager judgement — named human, mandatory
// reasoning EITHER WAY, Cara never decides.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { getStore } from "@/lib/db/store";
import { assembleStrategyDraft, computeStrategyDraftStatus } from "../assembly-engine";
import {
  answerThresholdQuestion,
  createStrategyRequest,
  getStrategyRequest,
  recordManagerDecision,
  recordThinking,
  updateStrategySection,
} from "../request-service";
import {
  SEVEN_THRESHOLD_QUESTIONS,
  STRATEGY_SECTION_ORDER,
  type StrategyAssemblyInput,
} from "../types";

const SRC = [{ recordType: "incidents", recordId: "inc_1" }];

const assembly = (overrides: Partial<StrategyAssemblyInput> = {}): StrategyAssemblyInput => ({
  childId: "yp_test",
  childName: "Alex",
  concernSummary: "New older contacts and unexplained money after weekend leave.",
  raisedBy: "staff_test",
  incidents: [
    { id: "inc_1", date: "2026-07-01", type: "safeguarding_concern", severity: "critical", description: "Alex disclosed an older peer asking them to carry items.", immediateAction: "1:1 support; social worker contacted." },
    { id: "inc_2", date: "2026-06-20", type: "missing_from_care", severity: "high", description: "Returned 90 minutes late from community time.", immediateAction: "Welfare check on return." },
  ],
  behaviourEntries: [
    { id: "b1", date: "2026-06-10", direction: "concern", intensity: "high", trigger: "family contact", behaviour: "Escalated after call." },
    { id: "b2", date: "2026-06-17", direction: "concern", intensity: "moderate", trigger: "family contact", behaviour: "Agitated before call." },
    { id: "b3", date: "2026-06-24", direction: "concern", intensity: "critical", trigger: "family contact", behaviour: "Alex said \"you can't stop me seeing them\" and left." },
  ],
  escalationDecisions: [
    { id: "e1", suggestedLevel: "immediate_safeguarding", confirmedLevel: "immediate_safeguarding", status: "decided", concernSummary: "Disclosure" },
  ],
  childQuotes: [{ recordId: "b3", recordType: "behaviourLog", quote: "you can't stop me seeing them" }],
  currentPlans: [{ id: "bsp_1", recordType: "behaviourSupportPlans", summary: "Behaviour support plan (active)" }],
  ...overrides,
});

beforeEach(() => {
  getStore().strategyDiscussionRequests.length = 0;
  getStore().ethicalIntelligenceEvents.length = 0;
});

// ── The scaffold ──────────────────────────────────────────────────────────────

describe("the scaffold (per spec)", () => {
  it("has the eight sections in order and the Seven Questions verbatim", () => {
    expect(STRATEGY_SECTION_ORDER).toHaveLength(8);
    expect(SEVEN_THRESHOLD_QUESTIONS).toHaveLength(7);
    expect(SEVEN_THRESHOLD_QUESTIONS[0]).toBe("What information has brought me here?");
    expect(SEVEN_THRESHOLD_QUESTIONS[3]).toBe("Why does significant harm remain a reasonable explanation?");
    expect(SEVEN_THRESHOLD_QUESTIONS[5]).toMatch(/power, inequality, culture, disability, trauma, race, gender, sexuality, language, poverty or neurodiversity/);
    expect(SEVEN_THRESHOLD_QUESTIONS[6]).toBe("Why is a multi-agency response required now?");
  });
});

// ── Assembly ──────────────────────────────────────────────────────────────────

describe("assembleStrategyDraft", () => {
  const draft = assembleStrategyDraft(assembly());

  it("classifies evidence by kind — direct, reported, observed, pattern", () => {
    const kinds = new Set(draft.evidence.map((e) => e.kind));
    expect(kinds.has("direct")).toBe(true); // the child's quoted words
    expect(kinds.has("reported")).toBe(true); // the disclosure incident
    expect(kinds.has("observed")).toBe(true); // the missing episode
    expect(kinds.has("pattern")).toBe(true); // family-contact recurrence ×3
  });

  it("every evidence item cites the records it came from", () => {
    for (const e of draft.evidence) {
      expect(e.sourceRecords.length).toBeGreaterThan(0);
    }
  });

  it("keeps interpretation apart from evidence — assembly adds none of its own", () => {
    expect(draft.professionalInterpretation).toEqual([]);
    expect(draft.alternativeExplanations).toEqual([]);
  });

  it("never names the type of harm itself — a human does", () => {
    expect(draft.sections.type_of_harm).toBe("");
  });

  it("reads urgency from the confirmed escalation decision", () => {
    expect(draft.sections.immediacy).toMatch(/confirmed the escalation level "immediate safeguarding"/i);
  });

  it("states unknowns honestly when the records cannot carry the answer", () => {
    const bare = assembleStrategyDraft(assembly({ childQuotes: [], currentPlans: [] }));
    expect(bare.unknowns.some((u) => /own words.*not yet in the records/i.test(u))).toBe(true);
    expect(bare.unknowns.some((u) => /No current plan summaries/i.test(u))).toBe(true);
    expect(bare.sections.child_impact).toMatch(/capture their voice|record why that is not possible/i);
  });
});

// ── The service ───────────────────────────────────────────────────────────────

function makeRequest() {
  const result = createStrategyRequest(assembly(), SRC);
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

describe("createStrategyRequest", () => {
  it("refuses an untraced request", () => {
    const result = createStrategyRequest(assembly(), []);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cannot trace it/i);
  });

  it("persists a draft with the assembled evidence and an audit entry", () => {
    const request = makeRequest();
    expect(request.status).toBe("draft");
    expect(request.evidence.length).toBeGreaterThan(3);
    expect(request.auditTrail).toHaveLength(1);
  });
});

describe("editing and answering", () => {
  it("rejects a question outside the Seven", () => {
    const request = makeRequest();
    expect(answerThresholdQuestion(request.id, "staff_test", "Made up?", "x").ok).toBe(false);
  });

  it("latest answer per question wins; alternatives question feeds the alternatives set", () => {
    const request = makeRequest();
    answerThresholdQuestion(request.id, "staff_test", "What else could explain this information?", "A misread favour between friends.");
    const stored = getStrategyRequest(request.id)!;
    expect(stored.alternativeExplanations).toContain("A misread favour between friends.");
    expect(stored.thresholdAnswers).toHaveLength(1);
  });

  it("draft status counts sections, questions and evidence kinds honestly", () => {
    const request = makeRequest();
    const status = computeStrategyDraftStatus(request);
    expect(status.sectionsTotal).toBe(8);
    expect(status.questionsTotal).toBe(7);
    expect(status.readyForManager).toBe(false); // type_of_harm + purpose + questions open
    expect(status.outstanding.some((o) => /Type of Harm/i.test(o))).toBe(true);
    expect(status.evidenceByKind.pattern).toBeGreaterThan(0);
  });
});

describe("recordManagerDecision — the judgement is human", () => {
  it("refuses an unnamed decision", () => {
    const request = makeRequest();
    const result = recordManagerDecision(request.id, { decidedBy: "", requestDiscussion: true, reasoning: "r" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Cara does not decide/i);
  });

  it("requires reasoning EITHER WAY — including when not pursuing", () => {
    const request = makeRequest();
    const result = recordManagerDecision(request.id, { decidedBy: "RM", requestDiscussion: false, reasoning: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/reasoning is required either way/i);
  });

  it("approves with reasoning, freezes the request, and blocks further edits", () => {
    const request = makeRequest();
    const result = recordManagerDecision(request.id, {
      decidedBy: "Olivia Hayes",
      decidedByRole: "registered_manager",
      requestDiscussion: true,
      reasoning: "Pattern + disclosure together meet the threshold; multi-agency information is needed now.",
    });
    expect(result.ok).toBe(true);
    const stored = getStrategyRequest(request.id)!;
    expect(stored.status).toBe("manager_approved");
    expect(updateStrategySection(request.id, "x", "headline_concern", "y").ok).toBe(false);
    expect(recordManagerDecision(request.id, { decidedBy: "RM", requestDiscussion: true, reasoning: "again" }).ok).toBe(false);
  });

  it("records 'not pursued' as a first-class outcome with its reasoning", () => {
    const request = makeRequest();
    const result = recordManagerDecision(request.id, {
      decidedBy: "Olivia Hayes",
      requestDiscussion: false,
      reasoning: "Discussed with the social worker — single-agency response is sufficient at this point; review in two weeks.",
    });
    expect(result.ok).toBe(true);
    expect(getStrategyRequest(request.id)!.status).toBe("not_pursued");
  });

  it("writes the judgement onto a linked Ethical Intelligence event", async () => {
    const { createEthicalEvent } = await import("@/lib/ethical-intelligence/capture-service");
    const event = createEthicalEvent({
      createdBy: "staff_test",
      trigger: { recordType: "incidents", recordId: "inc_1" },
      triggerSummary: "Disclosure",
      whatHappened: "Alex disclosed an older peer asking them to carry items.",
    });
    if (!event.ok) throw new Error(event.reason);

    const request = makeRequest();
    recordThinking(request.id, "staff_test", { interpretation: "Consistent with early-stage grooming." });
    const result = recordManagerDecision(request.id, {
      decidedBy: "Olivia Hayes",
      requestDiscussion: true,
      reasoning: "Threshold met.",
      ethicalEventId: event.value.id,
    });
    expect(result.ok).toBe(true);
    expect(event.value.decisions).toHaveLength(1);
    expect(event.value.decisions[0].sourceRecords.some((s) => s.recordType === "strategyDiscussionRequests")).toBe(true);
  });
});
