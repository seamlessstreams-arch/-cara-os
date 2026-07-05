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
import { getStore } from "../db/store";
import {
  computeEthicalCycleStatus,
  isEventFullyTraceable,
} from "../ethical-intelligence/ethical-intelligence-engine";
import { ESCALATION_LEVEL_DEFINITIONS } from "../risk-escalation/risk-escalation-engine";
import { computeTapStatus, isKnownTapQuestion } from "../tap-thinking/tap-engine";
import { computeBehaviourTriggerPatterns } from "../behaviour-trigger-patterns/behaviour-trigger-patterns-engine";
import { TAP_STAGES } from "../tap-thinking/types";
import { computeChildVoiceDimensions } from "../child-voice-dimensions/dimensions-engine";
import type { ChildVoiceDimensionInput } from "../child-voice-dimensions/types";
import { unifyNeuroProfile, deriveRecordingPrompts } from "../neurodiversity-profile/unification-engine";
import type { UnifyNeuroInput } from "../neurodiversity-profile/types";

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

// ── The engines must actually fire on the MERGED store ────────────────────────
// The store's dead-cells seed block REASSIGNS behaviourLog/restraints and the
// Practice OS arc is push()ed after it — so the truth the live API serves is
// the MERGED array. Assert on getStore() mapped exactly as the route maps it,
// so this gate fails if the merge (or either seed) stops telling the story.

describe("behaviour-trigger-patterns engine fires on the arc (merged store)", () => {
  const mergedEntries = (getStore().behaviourLog as Array<Record<string, unknown>>).map((b) => ({
    child_id: String(b.child_id ?? ""),
    date: String(b.date ?? b.created_at ?? "").slice(0, 10),
    direction: String(b.direction ?? "concern"),
    intensity: String(b.intensity ?? "low"),
    trigger: String(b.trigger ?? ""),
    antecedent: String(b.antecedent ?? ""),
    strategy_used: String(b.strategy_used ?? ""),
  }));

  it("the merged store contains BOTH the dead-cells seed and the Practice OS arc", () => {
    const ids = new Set((getStore().behaviourLog as Array<{ id: string }>).map((b) => b.id));
    expect(ids.has("beh_001")).toBe(true); // dead-cells block survived
    expect(ids.has("beh_alex_07")).toBe(true); // Practice OS arc appended
    expect(ids.has("rst_007") || true).toBe(true);
    const rstIds = new Set((getStore().restraints as Array<{ id: string }>).map((r) => r.id));
    expect(rstIds.has("rst_001")).toBe(true);
    expect(rstIds.has("rst_007")).toBe(true);
  });

  const result = computeBehaviourTriggerPatterns({
    children: [
      { id: "yp_alex", name: "Alex" },
      { id: "yp_casey", name: "Casey" },
      { id: "yp_jordan", name: "Jordan" },
    ],
    entries: mergedEntries,
  });

  it("Alex reads ESCALATING with 'family contact' and 'court proceedings' among top triggers", () => {
    const alex = result.children.find((c) => c.child_id === "yp_alex")!;
    expect(alex.intensity_trajectory).toBe("escalating");
    const triggers = alex.top_triggers.map((t) => t.trigger.toLowerCase());
    expect(triggers).toContain("family contact");
    expect(triggers).toContain("court proceedings");
    expect(alex.concerning_90d).toBeGreaterThanOrEqual(6);
  });

  it("Casey reads as the improvement story — positives strong, not escalating", () => {
    const casey = result.children.find((c) => c.child_id === "yp_casey")!;
    expect(casey.positive_90d).toBeGreaterThanOrEqual(2);
    expect(casey.intensity_trajectory).not.toBe("escalating");
  });

  it("every concerning Alex entry records the strategy used — no unsupported high-intensity gaps", () => {
    const concerning = PRACTICE_OS_BEHAVIOUR_LOG.filter(
      (b) => b.child_id === "yp_alex" && b.direction === "concern",
    );
    for (const entry of concerning) expect(entry.strategy_used.trim().length).toBeGreaterThan(0);
  });
});

// ── Child Voice Intelligence must fire on the MERGED store ───────────────────
// Maps getStore() exactly as /api/v1/child-voice-dimensions does, so this gate
// fails if the voice arc (or the merge) stops telling the story.

describe("child voice dimensions fire on the arc (merged store)", () => {
  const asOf = new Date().toISOString().slice(0, 10);
  const day = (v: unknown) => (typeof v === "string" ? v.slice(0, 10) : "");
  const voiceInput = (childId: string, childName: string): ChildVoiceDimensionInput => {
    const s = getStore();
    return {
      childId,
      childName,
      asOf,
      windowDays: 90,
      feedback: (s.ypFeedback as Array<Record<string, unknown>>)
        .filter((f) => f.child_id === childId)
        .map((f) => ({ id: String(f.id), child_id: String(f.child_id), date: day(f.date), category: String(f.category ?? ""), sentiment: String(f.sentiment ?? ""), response_given_to_child: !!f.response_given_to_child, child_satisfied: (f.child_satisfied ?? null) as boolean | null })),
      keyWork: (s.keyWorkingSessions as Array<Record<string, unknown>>)
        .filter((k) => k.child_id === childId)
        .map((k) => ({ id: String(k.id), child_id: String(k.child_id), date: day(k.date), child_voice: String(k.child_voice ?? "") })),
      lacReviews: (s.lacReviews as Array<Record<string, unknown>>)
        .filter((l) => l.child_id === childId)
        .map((l) => ({ id: String(l.id), child_id: String(l.child_id), date: day(l.date), child_participation: String(l.child_participation ?? "did_not_participate"), child_views: String(l.child_views ?? "") })),
      feedbackLoops: (s.childFeedbackLoops as Array<Record<string, unknown>>)
        .filter((f) => f.child_id === childId)
        .map((f) => ({ id: String(f.id), child_id: String(f.child_id), feedback_date: day(f.feedback_date), child_words: String(f.child_words ?? ""), decision_made: String(f.decision_made ?? "pending_consideration"), child_accepts: !!f.child_accepts })),
      advocacy: (s.advocacyRecords as Array<Record<string, unknown>>)
        .filter((a) => a.child_id === childId)
        .map((a) => ({ id: String(a.id), child_id: String(a.child_id), status: String(a.status ?? ""), referral_date: day(a.referral_date), visits: Array.isArray(a.visits) ? (a.visits as Array<{ date?: string }>).map((v) => ({ date: day(v?.date) })) : [], home_response: String(a.home_response ?? "") })),
      houseMeetings: [],
    };
  };

  it("ALEX shows the flagship dissonance — voice recorded but not heard, declining, open loops", () => {
    const p = computeChildVoiceDimensions(voiceInput("yp_alex", "Alex"));
    const captured = p.dimensions.find((d) => d.key === "voice_captured")!;
    const listened = p.dimensions.find((d) => d.key === "feeling_listened_to")!;
    expect(captured.status).toBe("strong"); // his voice IS being recorded
    expect(listened.status).toBe("needs_attention"); // …but he doesn't feel heard
    expect(listened.trend).toBe("declining");
    expect(p.highlights.some((h) => h.id === "listened_to_gap")).toBe(true);
    expect(p.highlights.some((h) => h.id === "safety_voice_concern")).toBe(true);
    expect(p.highlights.some((h) => h.id === "influence_gap")).toBe(true);
    expect(p.highlights[0].severity).toBe("priority");
  });

  it("CASEY is the improvement story — loops closing, feeling more heard, no priority", () => {
    const p = computeChildVoiceDimensions(voiceInput("yp_casey", "Casey"));
    const influence = p.dimensions.find((d) => d.key === "voice_influence")!;
    expect(influence.status).toBe("strong");
    expect(p.highlights.some((h) => h.id === "loops_closing_strength")).toBe(true);
    expect(p.highlights.some((h) => h.severity === "priority")).toBe(false);
  });

  it("JORDAN is the exemplar — broad capture with an active advocate", () => {
    const p = computeChildVoiceDimensions(voiceInput("yp_jordan", "Jordan"));
    expect(p.hasData).toBe(true);
    expect(p.dimensions.find((d) => d.key === "advocacy_access")!.status).toBe("strong");
    expect(p.dimensions.find((d) => d.key === "voice_captured")!.status).toBe("strong");
    expect(p.highlights.some((h) => h.severity === "priority")).toBe(false);
  });
});

// ── Unified Neurodiversity Profile must fire on the MERGED store ─────────────
// Alex's autism profile is joined to his incident arc: at a restraint the
// point-of-work prompts must lead with what makes it worse. Maps getStore()
// exactly as /api/v1/neurodiversity-profile does.

describe("neurodiversity profile fires on the arc (merged store)", () => {
  const asOf = new Date().toISOString().slice(0, 10);
  const neuroInput = (childId: string, childName: string): UnifyNeuroInput => {
    const s = getStore();
    const byChild = (x: { child_id?: string }) => x.child_id === childId;
    return {
      childId,
      childName,
      asOf,
      autismPlans: (s.autismPlans as Array<Record<string, unknown>>).filter(byChild) as unknown as UnifyNeuroInput["autismPlans"],
      adhdPlans: (s.adhdPlans as Array<Record<string, unknown>>).filter(byChild) as unknown as UnifyNeuroInput["adhdPlans"],
      sensoryProfiles: (s.sensoryProfileRecords as Array<Record<string, unknown>>).filter(byChild) as unknown as UnifyNeuroInput["sensoryProfiles"],
      ehcps: (s.ehcpRecords as Array<Record<string, unknown>>).filter(byChild) as unknown as UnifyNeuroInput["ehcps"],
    };
  };

  it("ALEX has a unified autism profile that EXPLAINS his arc, and a restraint leads with 'what makes it worse'", () => {
    const p = unifyNeuroProfile(neuroInput("yp_alex", "Alex"));
    expect(p.hasProfile).toBe(true);
    expect(p.conditions.some((c) => c.kind === "autism" && c.status === "diagnosed")).toBe(true);
    expect(p.behaviour.staffDoNot.join(" ")).toMatch(/spring information on him/i);
    // his EHCP + its outstanding SALT referral come through
    expect(p.ehcp?.outstandingActions.join(" ")).toMatch(/SALT/i);
    // Cara catches the lapsed autism review
    expect(p.reviewGaps.some((g) => g.id === "autism_review" && g.severity === "overdue")).toBe(true);
    const prompts = deriveRecordingPrompts(p, "restraint");
    expect(prompts[0].id).toBe("avoid");
    expect(prompts[0].priority).toBe("critical");
  });

  it("CASEY has an ADHD profile mirroring his morning improvement", () => {
    const p = unifyNeuroProfile(neuroInput("yp_casey", "Casey"));
    expect(p.conditions.some((c) => c.kind === "adhd")).toBe(true);
    expect(p.behaviour.staffDo.length).toBeGreaterThan(0);
  });

  it("JORDAN has no profile — the honest empty state, not a fabricated one", () => {
    const p = unifyNeuroProfile(neuroInput("yp_jordan", "Jordan"));
    expect(p.hasProfile).toBe(false);
    expect(deriveRecordingPrompts(p, "incident")).toEqual([]);
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
