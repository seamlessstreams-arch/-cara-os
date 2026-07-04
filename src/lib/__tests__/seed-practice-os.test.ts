// ══════════════════════════════════════════════════════════════════════════════
// CARA — PRACTICE OS DEMO SEED: QUALITY GATE
//
// The seed is a DESIGNED arc — these tests pin that it keeps lighting the
// engines it was built to demonstrate, and that it never breaks the honesty
// rules (traceability, no fabricated references, no overstated improvement).
// If an engine evolves and the arc goes dark, this file fails loudly.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  PRACTICE_OS_BEHAVIOUR_LOG,
  PRACTICE_OS_DEBRIEFS,
  PRACTICE_OS_ESCALATION_DECISIONS,
  PRACTICE_OS_ETHICAL_EVENTS,
  PRACTICE_OS_RESTRAINTS,
  PRACTICE_OS_TAP_SESSIONS,
} from "../seed-practice-os";
import { INCIDENTS } from "../seed-data";
import {
  computeEthicalCycleStatus,
  isEventFullyTraceable,
} from "../ethical-intelligence/ethical-intelligence-engine";
import { ESCALATION_LEVEL_DEFINITIONS } from "../risk-escalation/risk-escalation-engine";
import { computeTapStatus, isKnownTapQuestion } from "../tap-thinking/tap-engine";
import { computeBehaviourTriggerPatterns } from "../behaviour-trigger-patterns/behaviour-trigger-patterns-engine";
import { TAP_STAGES } from "../tap-thinking/types";

// ── Referential integrity: every trace points at a record that exists ─────────

const KNOWN_IDS = new Set<string>([
  ...INCIDENTS.map((i) => i.id),
  ...PRACTICE_OS_BEHAVIOUR_LOG.map((b) => b.id),
  ...PRACTICE_OS_RESTRAINTS.map((r) => r.id),
  ...PRACTICE_OS_DEBRIEFS.map((d) => d.id),
]);

function allSourceRefs(): Array<{ recordType: string; recordId: string }> {
  return [
    ...PRACTICE_OS_ETHICAL_EVENTS.flatMap((e) => [
      e.trigger,
      ...e.insights.flatMap((s) => s.sourceRecords),
      ...e.decisions.flatMap((s) => s.sourceRecords),
      ...e.actions.flatMap((s) => s.sourceRecords),
      ...e.outcomes.flatMap((s) => s.sourceRecords),
      ...e.learning.flatMap((s) => s.sourceRecords),
    ]),
    ...PRACTICE_OS_ESCALATION_DECISIONS.flatMap((d) => d.sourceRecords),
    ...PRACTICE_OS_TAP_SESSIONS.flatMap((s) => s.sourceRecords),
  ];
}

describe("traceability & referential integrity", () => {
  it("every spine source reference points at a record that actually exists in the seeds", () => {
    const dangling = allSourceRefs().filter((r) => !KNOWN_IDS.has(r.recordId));
    expect(dangling).toEqual([]);
  });

  it("every ethical seed event is fully traceable", () => {
    for (const event of PRACTICE_OS_ETHICAL_EVENTS) {
      expect(isEventFullyTraceable(event)).toBe(true);
    }
  });

  it("restraints match their incidents by child and recency ordering", () => {
    expect(PRACTICE_OS_RESTRAINTS.map((r) => r.id)).toEqual(["rst_005", "rst_006", "rst_007"]);
    for (const r of PRACTICE_OS_RESTRAINTS) expect(r.child_id).toBe("yp_alex");
  });
});

// ── The stories the arc must keep telling ─────────────────────────────────────

describe("ethical intelligence cycles", () => {
  it("inc_005's cycle is COMPLETE (6/6) — the closed learning loop", () => {
    const complete = PRACTICE_OS_ETHICAL_EVENTS.find((e) => e.id === "eie_seed_inc005")!;
    const status = computeEthicalCycleStatus(complete);
    expect(status.cycleComplete).toBe(true);
    expect(status.stagesComplete).toBe(6);
    expect(status.fullyTraceable).toBe(true);
  });

  it("inc_004's cycle is OPEN at 3/6 with a truthful next step", () => {
    const open = PRACTICE_OS_ETHICAL_EVENTS.find((e) => e.id === "eie_seed_inc004")!;
    const status = computeEthicalCycleStatus(open);
    expect(status.stagesComplete).toBe(3);
    expect(status.cycleComplete).toBe(false);
    expect(status.nextStep).toBeTruthy();
  });
});

describe("escalation decisions", () => {
  it("the decided seed froze exactly the IMMEDIATE level's required actions", () => {
    const decided = PRACTICE_OS_ESCALATION_DECISIONS.find((d) => d.id === "escd_seed_1")!;
    expect(decided.status).toBe("decided");
    expect(decided.agreement).toBe("confirmed");
    expect(decided.actionsTriggered).toEqual(
      ESCALATION_LEVEL_DEFINITIONS.immediate_safeguarding.requiredActions,
    );
    expect(decided.decisionMaker).toBe("Olivia Hayes");
  });

  it("the awaiting seed has no actions triggered — nothing escalates until a human decides", () => {
    const awaiting = PRACTICE_OS_ESCALATION_DECISIONS.find((d) => d.id === "escd_seed_2")!;
    expect(awaiting.status).toBe("awaiting_decision");
    expect(awaiting.actionsTriggered).toEqual([]);
    expect(awaiting.confirmedLevel).toBeUndefined();
  });
});

describe("TAP session", () => {
  it("seeded answers only use the scaffold's own questions", () => {
    for (const session of PRACTICE_OS_TAP_SESSIONS) {
      for (const stage of TAP_STAGES) {
        for (const a of session.answers[stage]) {
          expect(isKnownTapQuestion(stage, a.question)).toBe(true);
        }
      }
    }
  });

  it("the oversight session sits mid-thinking: See Clearly complete, Think Deeply 2/3", () => {
    const session = PRACTICE_OS_TAP_SESSIONS[0];
    const status = computeTapStatus(session);
    expect(session.status).toBe("in_progress");
    expect(status.stages.find((s) => s.stage === "see_clearly")?.complete).toBe(true);
    expect(status.stages.find((s) => s.stage === "think_deeply")?.answered).toBe(2);
    expect(status.allStagesComplete).toBe(false);
  });
});

describe("repair-cycle gap (rst_007)", () => {
  it("inc_005 has a completed child debrief; inc_007 deliberately does NOT", () => {
    const r5 = PRACTICE_OS_RESTRAINTS.find((r) => r.id === "rst_005")!;
    const r7 = PRACTICE_OS_RESTRAINTS.find((r) => r.id === "rst_007")!;
    expect(r5.child_debriefed).toBe(true);
    expect(r7.child_debriefed).toBe(false);
    expect(PRACTICE_OS_DEBRIEFS.some((d) => d.linked_incident_id === "inc_005")).toBe(true);
    expect(PRACTICE_OS_DEBRIEFS.some((d) => d.linked_incident_id === "inc_007")).toBe(false);
  });
});

// ── The engines must actually fire on this arc ────────────────────────────────

describe("behaviour-trigger-patterns engine fires on the arc", () => {
  const result = computeBehaviourTriggerPatterns({
    children: [
      { id: "yp_alex", name: "Alex" },
      { id: "yp_casey", name: "Casey" },
      { id: "yp_jordan", name: "Jordan" },
    ],
    entries: PRACTICE_OS_BEHAVIOUR_LOG,
  });

  it("Alex reads ESCALATING with 'family contact' and 'court proceedings' among top triggers", () => {
    const alex = result.children.find((c) => c.child_id === "yp_alex")!;
    expect(alex.intensity_trajectory).toBe("escalating");
    const triggers = alex.top_triggers.map((t) => t.trigger.toLowerCase());
    expect(triggers).toContain("family contact");
    expect(triggers).toContain("court proceedings");
    expect(alex.concerning_90d).toBeGreaterThanOrEqual(6);
  });

  it("Casey reads as the improvement story — positives outweigh recent concern", () => {
    const casey = result.children.find((c) => c.child_id === "yp_casey")!;
    expect(casey.positive_90d).toBeGreaterThanOrEqual(2);
    // No concerning entries in Casey's recent 30 days at all — the trigger faded.
    expect(casey.intensity_trajectory).not.toBe("escalating");
  });

  it("every concerning Alex entry records the strategy used — no unsupported high-intensity gaps", () => {
    const concerning = PRACTICE_OS_BEHAVIOUR_LOG.filter(
      (b) => b.child_id === "yp_alex" && b.direction === "concern",
    );
    for (const entry of concerning) expect(entry.strategy_used.trim().length).toBeGreaterThan(0);
  });
});

// ── Honesty: the improvement is evidenced, never overstated ──────────────────

describe("honesty rules", () => {
  it("no seeded outcome claims certainty the records can't carry", () => {
    const outcomes = PRACTICE_OS_ETHICAL_EVENTS.flatMap((e) => e.outcomes);
    for (const o of outcomes) {
      expect(["improved", "no_change", "worsened", "too_early_to_say"]).toContain(o.direction);
      expect(o.whatChanged.trim().length).toBeGreaterThan(0);
      expect(o.sourceRecords.length).toBeGreaterThan(0);
    }
  });

  it("the open cycle's integration questions are honestly unanswered (null), not defaulted", () => {
    const open = PRACTICE_OS_ETHICAL_EVENTS.find((e) => e.id === "eie_seed_inc004")!;
    expect(open.integration.childPlanUpdated).toBeNull();
    expect(open.integration.outcomeReviewed).toBeNull();
    expect(open.integration.childVoiceHeard).toBe(true); // the one genuinely done
  });
});
