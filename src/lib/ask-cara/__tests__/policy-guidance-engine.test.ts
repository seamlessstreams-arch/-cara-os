// ══════════════════════════════════════════════════════════════════════════════
// CARA — Policy guidance engine tests (prompt 1 §12)
//
// Pins: answers only from approved policies; found/partial/none confidence;
// steps come from the policy's key points; NO approved answer → honest escalate,
// never a guess; draft/retired policies excluded; due-review flagged.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { answerPolicyQuestion, type PolicyDoc } from "../policy-guidance-engine";

const POLICIES: PolicyDoc[] = [
  {
    id: "pol_missing",
    title: "Missing from Care",
    category: "missing_from_care",
    description: "What to do when a child goes missing from the home.",
    keyPoints: ["Report to police without delay", "Notify the social worker and placing authority", "Complete a return home interview"],
    statutoryBasis: "Children's Homes Regs 2015 Reg 34",
    linkedStandard: "Protection of children",
    status: "current",
    lastReviewed: "2026-03-01",
  },
  {
    id: "pol_meds",
    title: "Medication",
    category: "medication",
    keyPoints: ["Two-staff administration", "Record on the MAR sheet"],
    status: "current",
    lastReviewed: "2026-02-01",
  },
  {
    id: "pol_old",
    title: "Retired Restraint Policy",
    category: "physical_intervention",
    keyPoints: ["Old guidance"],
    status: "retired",
  },
];

describe("answerPolicyQuestion", () => {
  it("finds the relevant approved policy and returns its key points as steps", () => {
    const r = answerPolicyQuestion("what does our policy say about a child missing from care?", POLICIES);
    expect(r.status).toBe("found");
    expect(r.source?.id).toBe("pol_missing");
    expect(r.steps).toContain("Complete a return home interview");
    expect(r.source?.statutoryBasis).toMatch(/Reg 34/);
  });

  it("escalates honestly when no approved policy covers the question", () => {
    const r = answerPolicyQuestion("what is our policy on cryptocurrency trading?", POLICIES);
    expect(r.status).toBe("none");
    expect(r.answer).toMatch(/can't find an approved|manager or the policy owner/i);
    expect(r.steps).toEqual([]);
    expect(r.source).toBeUndefined();
  });

  it("excludes retired/draft policies from the answer", () => {
    const r = answerPolicyQuestion("what does the restraint policy say?", POLICIES);
    // pol_old is retired → not eligible; "restraint" matches nothing current → none.
    expect(r.source?.id).not.toBe("pol_old");
  });

  it("flags a policy that is due for review", () => {
    const due: PolicyDoc[] = [{ id: "p", title: "Complaints", category: "complaints", keyPoints: ["Acknowledge within 24h", "Record the outcome"], status: "due_review", lastReviewed: "2025-01-01" }];
    const r = answerPolicyQuestion("what does our complaints policy say?", due);
    expect(r.source?.reviewDue).toBe(true);
    expect(r.answer).toMatch(/flagged for review/i);
  });

  it("returns none for an empty policy library", () => {
    expect(answerPolicyQuestion("anything?", []).status).toBe("none");
  });
});
