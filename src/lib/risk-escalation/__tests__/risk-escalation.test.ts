// ══════════════════════════════════════════════════════════════════════════════
// CARA — RISK ESCALATION DECISION WORKFLOW TESTS
//
// Pins the safety rules:
//  • the ladder is safeguarding-first (one immediate flag outranks everything);
//  • Cara only SUGGESTS — nothing has effect until a NAMED manager decides;
//  • amend requires a different level + reason; reject requires a reason;
//  • the confirmed level's required actions are frozen onto the record;
//  • traceability: an assessment without source records is refused.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect, beforeEach } from "vitest";
import { getStore } from "@/lib/db/store";
import {
  ESCALATION_LEVEL_DEFINITIONS,
  suggestEscalationLevel,
} from "../risk-escalation-engine";
import {
  createEscalationSuggestion,
  getEscalationDecision,
  listEscalationDecisions,
  recordManagerDecision,
} from "../decision-service";
import type { EscalationEvidenceInput } from "../types";

const SRC = [{ recordType: "incidents", recordId: "inc_1" }];

const base = (overrides: Partial<EscalationEvidenceInput> = {}): EscalationEvidenceInput => ({
  childId: "yp_test",
  summary: "Concern raised after this evening's incident.",
  sourceRecords: SRC,
  ...overrides,
});

beforeEach(() => {
  getStore().escalationDecisions.length = 0;
  getStore().ethicalIntelligenceEvents.length = 0;
});

// ── The four levels ───────────────────────────────────────────────────────────

describe("level definitions (per spec)", () => {
  it("defines all four levels with the spec's timeframes", () => {
    expect(ESCALATION_LEVEL_DEFINITIONS.low_concern.timeframe).toBe("Within 24 hours");
    expect(ESCALATION_LEVEL_DEFINITIONS.emerging_concern.timeframe).toBe("Same day");
    expect(ESCALATION_LEVEL_DEFINITIONS.high_concern.timeframe).toBe("Within 2 hours");
    expect(ESCALATION_LEVEL_DEFINITIONS.immediate_safeguarding.timeframe).toBe("Immediate");
  });

  it("immediate safeguarding requires police/emergency contact among its actions", () => {
    expect(ESCALATION_LEVEL_DEFINITIONS.immediate_safeguarding.requiredActions.join(" ")).toMatch(/police\/emergency/i);
  });
});

// ── The suggester ladder ──────────────────────────────────────────────────────

describe("suggestEscalationLevel", () => {
  it("suggests IMMEDIATE for a disclosure of abuse", () => {
    const s = suggestEscalationLevel(base({ disclosureOfAbuse: true }));
    expect(s.level).toBe("immediate_safeguarding");
    expect(s.evidence.some((e) => e.rule === "disclosure_of_abuse")).toBe(true);
  });

  it("missing + whereabouts unknown → IMMEDIATE; missing with known whereabouts → HIGH", () => {
    expect(suggestEscalationLevel(base({ missingNow: true, whereaboutsUnknown: true })).level).toBe("immediate_safeguarding");
    expect(suggestEscalationLevel(base({ missingNow: true, whereaboutsUnknown: false })).level).toBe("high_concern");
  });

  it("one immediate flag outranks any number of lower flags (safeguarding-first)", () => {
    const s = suggestEscalationLevel(
      base({ immediateDanger: true, patternDeveloping: true, riskFactorsIncreasing: true, exploitationIndicators: true }),
    );
    expect(s.level).toBe("immediate_safeguarding");
  });

  it("exploitation indicators → HIGH; presentation changes → EMERGING; 3+ incidents in 30d → EMERGING", () => {
    expect(suggestEscalationLevel(base({ exploitationIndicators: true })).level).toBe("high_concern");
    expect(suggestEscalationLevel(base({ presentationChanges: true })).level).toBe("emerging_concern");
    expect(suggestEscalationLevel(base({ recentIncidentCount30d: 3 })).level).toBe("emerging_concern");
  });

  it("no elevated indicators → LOW with an honest caveat", () => {
    const s = suggestEscalationLevel(base({ childCurrentlySafe: true }));
    expect(s.level).toBe("low_concern");
    expect(s.caveat).toMatch(/amend the level/i);
  });
});

// ── Traceability + creation ───────────────────────────────────────────────────

describe("createEscalationSuggestion", () => {
  it("refuses an assessment with no source records", () => {
    const result = createEscalationSuggestion("staff_test", base({ sourceRecords: [] }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/cannot trace it/i);
  });

  it("creates an awaiting_decision record with the frozen suggestion", () => {
    const result = createEscalationSuggestion("staff_test", base({ exploitationIndicators: true }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("awaiting_decision");
      expect(result.value.suggestedLevel).toBe("high_concern");
      expect(result.value.actionsTriggered).toEqual([]); // nothing triggers until a human decides
      expect(result.value.auditTrail).toHaveLength(1);
    }
  });
});

// ── The manager decision ──────────────────────────────────────────────────────

function suggested(overrides: Partial<EscalationEvidenceInput> = {}) {
  const result = createEscalationSuggestion("staff_test", base({ exploitationIndicators: true, ...overrides }));
  if (!result.ok) throw new Error(result.reason);
  return result.value;
}

describe("recordManagerDecision", () => {
  it("refuses a decision without a named decision maker", () => {
    const d = suggested();
    const result = recordManagerDecision(d.id, { decisionMaker: "", agreement: "confirmed" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/never escalates on its own/i);
  });

  it("confirm freezes the suggested level's required actions onto the record", () => {
    const d = suggested();
    const result = recordManagerDecision(d.id, { decisionMaker: "RM Darren", agreement: "confirmed" });
    expect(result.ok).toBe(true);
    const stored = getEscalationDecision(d.id)!;
    expect(stored.status).toBe("decided");
    expect(stored.confirmedLevel).toBe("high_concern");
    expect(stored.actionsTriggered).toEqual(ESCALATION_LEVEL_DEFINITIONS.high_concern.requiredActions);
    expect(stored.decidedAt).toBeTruthy();
  });

  it("amend requires a DIFFERENT level and a reason", () => {
    const d1 = suggested();
    expect(recordManagerDecision(d1.id, { decisionMaker: "RM", agreement: "amended", amendedLevel: "high_concern", reason: "same" }).ok).toBe(false);
    const d2 = suggested();
    expect(recordManagerDecision(d2.id, { decisionMaker: "RM", agreement: "amended", amendedLevel: "immediate_safeguarding" }).ok).toBe(false);
    const d3 = suggested();
    const ok = recordManagerDecision(d3.id, {
      decisionMaker: "RM",
      agreement: "amended",
      amendedLevel: "immediate_safeguarding",
      reason: "New information: the child has just disclosed further harm to the key worker.",
    });
    expect(ok.ok).toBe(true);
    expect(getEscalationDecision(d3.id)!.actionsTriggered).toEqual(
      ESCALATION_LEVEL_DEFINITIONS.immediate_safeguarding.requiredActions,
    );
  });

  it("reject requires a reason and triggers no actions", () => {
    const d1 = suggested();
    expect(recordManagerDecision(d1.id, { decisionMaker: "RM", agreement: "rejected" }).ok).toBe(false);
    const d2 = suggested();
    const ok = recordManagerDecision(d2.id, {
      decisionMaker: "RM",
      agreement: "rejected",
      reason: "Assessed with the social worker — the pattern read is explained by a planned family-time change.",
    });
    expect(ok.ok).toBe(true);
    const stored = getEscalationDecision(d2.id)!;
    expect(stored.confirmedLevel).toBeUndefined();
    expect(stored.actionsTriggered).toEqual([]);
    expect(stored.auditTrail.some((a) => a.action === "decision_rejected")).toBe(true);
  });

  it("a decided escalation cannot be decided twice", () => {
    const d = suggested();
    recordManagerDecision(d.id, { decisionMaker: "RM", agreement: "confirmed" });
    const again = recordManagerDecision(d.id, { decisionMaker: "RM", agreement: "confirmed" });
    expect(again.ok).toBe(false);
  });

  it("writes the decision onto a linked Ethical Intelligence event when supplied", async () => {
    const { createEthicalEvent } = await import("@/lib/ethical-intelligence/capture-service");
    const event = createEthicalEvent({
      createdBy: "staff_test",
      trigger: { recordType: "incidents", recordId: "inc_1" },
      triggerSummary: "Incident",
      whatHappened: "Something significant happened.",
    });
    if (!event.ok) throw new Error(event.reason);

    const d = suggested();
    const result = recordManagerDecision(d.id, {
      decisionMaker: "RM Darren",
      agreement: "confirmed",
      ethicalEventId: event.value.id,
    });
    expect(result.ok).toBe(true);
    expect(event.value.decisions).toHaveLength(1);
    expect(event.value.decisions[0].decisionMaker).toBe("RM Darren");
    expect(getEscalationDecision(d.id)!.auditTrail.some((a) => a.action === "ethical_cycle_recorded")).toBe(true);
  });
});

// ── Reads ─────────────────────────────────────────────────────────────────────

describe("listEscalationDecisions", () => {
  it("filters by status and child", () => {
    const a = suggested();
    suggested({ childId: "yp_other" });
    recordManagerDecision(a.id, { decisionMaker: "RM", agreement: "confirmed" });
    expect(listEscalationDecisions()).toHaveLength(2);
    expect(listEscalationDecisions({ status: "decided" })).toHaveLength(1);
    expect(listEscalationDecisions({ childId: "yp_other" })).toHaveLength(1);
  });
});
