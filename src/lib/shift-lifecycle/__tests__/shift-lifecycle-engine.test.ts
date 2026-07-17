import { describe, it, expect } from "vitest";
import { reviewTone } from "@/lib/philosophy/covenant";
import {
  LIFECYCLE_CHECKS,
  buildShiftLifecycle,
  assessSignOff,
  validateSignOff,
  checksForStage,
  type CheckEvidence,
  type CheckId,
  type ShiftLifecycleInput,
} from "../shift-lifecycle-engine";

const SHIFT = {
  id: "shift_1",
  staff_id: "staff_olivia",
  date: "2026-07-17",
  shift_type: "day",
  start_time: "08:00",
  end_time: "20:00",
};

const seen = (found: string[], outstanding: string[] = []): CheckEvidence => ({
  visible: true,
  found,
  outstanding,
});
const blind: CheckEvidence = { visible: false, found: [], outstanding: [] };

const build = (
  evidence: Partial<Record<CheckId, CheckEvidence>>,
  attested: string[] = [],
  extra: Partial<ShiftLifecycleInput> = {},
) => buildShiftLifecycle({ shift: SHIFT, evidence, attested, ...extra });

const byId = (lc: ReturnType<typeof build>, id: CheckId) =>
  lc.checks.find((c) => c.id === id)!;

describe("the honesty rule — Cara only counts what it can see", () => {
  it("reports a check with NO source records as not_visible, never as outstanding", () => {
    // store.handovers is [] in this repo: a naive engine would derive
    // "handover missing" on every shift in the home. That is the false
    // accusation this rule exists to prevent.
    const lc = build({ handover_written: blind });
    const check = byId(lc, "handover_written");
    expect(check.status).toBe("not_visible");
    expect(check.status).not.toBe("outstanding");
    expect(check.reason).toMatch(/gap in what Cara can see, not a finding/i);
  });

  it("does NOT block sign-off on something it cannot see", () => {
    const lc = build({ handover_written: blind, records_complete: blind });
    expect(lc.signOff.clear).toBe(true);
    expect(lc.signOff.blockers).toHaveLength(0);
    expect(validateSignOff(lc.signOff, null)).toBeNull();
  });

  it("DOES surface an outstanding item once records of that kind demonstrably exist", () => {
    const lc = build({
      records_complete: seen(["Jordan — logged 19:40"], ["Casey — no entry today"]),
    });
    const check = byId(lc, "records_complete");
    expect(check.status).toBe("outstanding");
    expect(check.outstanding).toEqual(["Casey — no entry today"]);
    expect(lc.signOff.clear).toBe(false);
  });

  it("counts an unanswered attestation as awaiting, not as a failure", () => {
    const lc = build({}, []);
    const check = byId(lc, "medication_keys_equipment");
    expect(check.status).toBe("awaiting");
    expect(check.status).not.toBe("outstanding");
    expect(lc.counts.outstanding).toBe(0);
  });

  it("never dresses a human's tick up as evidence", () => {
    const lc = build({}, ["home_safe_prepared"]);
    const check = byId(lc, "home_safe_prepared");
    expect(check.status).toBe("confirmed");
    expect(check.reason).toMatch(/takes your word for it/i);
  });
});

describe("the sign-off gate is soft", () => {
  const outstanding = () =>
    build({ records_complete: seen([], ["Casey — no entry today"]) });

  it("asks for a reason rather than refusing", () => {
    const lc = outstanding();
    expect(lc.signOff.requiresReason).toBe(true);
    expect(lc.signOff.message).toMatch(/you can still sign off/i);
  });

  it("ALLOWS sign-off with blockers outstanding when a real reason is given", () => {
    const lc = outstanding();
    const err = validateSignOff(
      lc.signOff,
      "Casey's log outstanding — Priya is writing it up on the night shift.",
    );
    expect(err).toBeNull(); // soft, not hard: a leader is never trapped
  });

  it("asks for the reason when none is given, in practice language", () => {
    const lc = outstanding();
    const err = validateSignOff(lc.signOff, null);
    expect(err).toMatch(/story of this shift/i);
    expect(err).not.toMatch(/denied|forbidden|non-compliance|failed/i);
  });

  it("asks for more than a shrug", () => {
    const lc = outstanding();
    expect(validateSignOff(lc.signOff, "busy")).toMatch(/a little more/i);
  });

  it("needs no reason when nothing visible is outstanding", () => {
    const lc = build({ records_complete: seen(["all logged"]) });
    expect(lc.signOff.clear).toBe(true);
    expect(validateSignOff(lc.signOff, null)).toBeNull();
  });
});

describe("safeguarding is never gated", () => {
  it("has no safeguarding check that can block a sign-off", () => {
    const safeguarding = LIFECYCLE_CHECKS.filter((c) => c.id === "safeguarding_prompt");
    expect(safeguarding).toHaveLength(1);
    expect(safeguarding[0].blocksSignOff).toBe(false);
    expect(safeguarding[0].why).toMatch(/never a gate/i);
  });

  it("leaves sign-off clear even with the safeguarding prompt unanswered", () => {
    const lc = build({});
    expect(byId(lc, "safeguarding_prompt").status).toBe("awaiting");
    expect(lc.signOff.clear).toBe(true);
  });
});

describe("only handover and records may hold up a sign-off (doctrine 2.1.1)", () => {
  it("blocks on exactly those two, and nothing else", () => {
    const blocking = LIFECYCLE_CHECKS.filter((c) => c.blocksSignOff).map((c) => c.id);
    expect(blocking.sort()).toEqual(["handover_written", "records_complete"]);
  });

  it("does not block on open actions, which are a prompt", () => {
    const lc = build({ outstanding_actions: seen([], ["Chase Jordan's dental referral"]) });
    expect(byId(lc, "outstanding_actions").status).toBe("outstanding");
    expect(lc.signOff.clear).toBe(true); // visible, surfaced — but never a barrier
  });

  it("never blocks on an attestation, however important", () => {
    const attestations = LIFECYCLE_CHECKS.filter((c) => c.kind === "attested");
    expect(attestations.every((c) => !c.blocksSignOff)).toBe(true);
  });
});

describe("a stance is not a checkbox", () => {
  it("does not ask anyone to tick that they led by example or were visible", () => {
    // Doctrine 1.7 lists these as real discipline. A tickbox for a stance
    // produces a tick, not the stance — so they stay out of the checklist.
    const labels = LIFECYCLE_CHECKS.map((c) => c.label.toLowerCase()).join(" | ");
    for (const stance of [
      "lead by example",
      "be visible",
      "solution-focused",
      "be available",
    ]) {
      expect(labels).not.toContain(stance);
    }
  });

  it("keeps the checklist to concrete acts and derivable evidence", () => {
    expect(LIFECYCLE_CHECKS.length).toBeLessThanOrEqual(14);
    expect(LIFECYCLE_CHECKS.every((c) => c.label.length > 0 && c.why.length > 0)).toBe(true);
  });
});

describe("the shipped copy honours the language covenant", () => {
  it("carries no deficit, accusatory or blaming language", () => {
    for (const c of LIFECYCLE_CHECKS) {
      expect(reviewTone(c.label, "to_staff")).toEqual([]);
      expect(reviewTone(c.why, "to_staff")).toEqual([]);
    }
  });

  it("frames the soft gate as an invitation, not an accusation", () => {
    const lc = build({ records_complete: seen([], ["Casey — no entry today"]) });
    expect(reviewTone(lc.signOff.message, "to_staff")).toEqual([]);
    expect(reviewTone(validateSignOff(lc.signOff, null) ?? "", "to_staff")).toEqual([]);
  });
});

describe("shape", () => {
  it("groups the discipline into the doctrine's stages", () => {
    const lc = build({});
    expect(checksForStage(lc, "before").length).toBeGreaterThan(0);
    expect(checksForStage(lc, "end").length).toBeGreaterThan(0);
    expect(checksForStage(lc, "end").some((c) => c.blocksSignOff)).toBe(true);
  });

  it("says plainly when a sign-off carried a recorded reason", () => {
    const lc = build({ records_complete: seen([], ["Casey — no entry"]) }, [], {
      signedOffAt: "2026-07-17T20:10:00.000Z",
      overrideReason: "Priya picking up Casey's log overnight.",
    });
    expect(lc.summary).toMatch(/reason is recorded/i);
  });

  it("counts every check exactly once", () => {
    const lc = build({ records_complete: seen([], ["x"]), handover_written: blind });
    const { confirmed, outstanding, notVisible, awaiting } = lc.counts;
    expect(confirmed + outstanding + notVisible + awaiting).toBe(LIFECYCLE_CHECKS.length);
  });

  it("assessSignOff is pure over the checks it is given", () => {
    const lc = build({});
    expect(assessSignOff(lc.checks).clear).toBe(true);
  });
});
