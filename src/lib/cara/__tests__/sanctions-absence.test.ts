// ══════════════════════════════════════════════════════════════════════════════
// Tests — an unanswered question is not a yes
//
// The read path defaulted `proportionate`, `childInformed`, `childUnderstood`
// and `linkedToBehaviour` to `true`, so sanctions nobody had reviewed were
// assessed as proportionate — earning the strength "All sanctions recorded as
// proportionate" and satisfying CHR 2015 Reg 19.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseSanctionsRewards,
  type SanctionsRewardsInput,
  type SanctionRecord,
} from "../sanctions-rewards-intelligence";

/** A sanction with none of the four judgements answered. */
function unreviewed(overrides: Partial<SanctionRecord> = {}): SanctionRecord {
  return {
    id: "s_1",
    date: "2026-05-01",
    type: "loss_of_privilege",
    reason: "Late return from school",
    proportionate: null,
    childInformed: null,
    childUnderstood: null,
    linkedToBehaviour: null,
    staffMember: "Staff A",
    followedUp: true,
    effectivenessRating: 3,
    ...overrides,
  };
}

function input(overrides: Partial<SanctionsRewardsInput> = {}): SanctionsRewardsInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    sanctions: [],
    rewards: [],
    hasBehaviourSupportPlan: true,
    bspUpToDate: true,
    childParticipatedInBSP: true,
    sanctionPolicyExplainedToChild: null,
    appealsProcessExplained: null,
    ...overrides,
  };
}

const reg19 = (a: ReturnType<typeof analyseSanctionsRewards>) =>
  a.regulatoryFlags.find(f => f.regulation === "CHR 2015 Reg 19");

describe("unreviewed sanctions are not proportionate sanctions", () => {
  const unreviewedSet = input({ sanctions: [unreviewed(), unreviewed({ id: "s_2" })] });

  it("does not claim all sanctions were recorded as proportionate", () => {
    const { strengths } = analyseSanctionsRewards(unreviewedSet);
    expect(strengths.some(s => s.description === "All sanctions recorded as proportionate")).toBe(false);
  });

  it("does not report Regulation 19 as met", () => {
    expect(reg19(analyseSanctionsRewards(unreviewedSet))?.status).toBe("not_evidenced");
    expect(reg19(analyseSanctionsRewards(unreviewedSet))?.detail).toMatch(/not recorded/i);
  });

  it("returns a null proportionality score rather than a perfect one", () => {
    expect(analyseSanctionsRewards(unreviewedSet).proportionalityScore).toBeNull();
  });

  it("does not report them as disproportionate either — absence is not a breach", () => {
    const { concerns } = analyseSanctionsRewards(unreviewedSet);
    expect(concerns.some(c => /disproportionate/i.test(c.description))).toBe(false);
    expect(concerns.some(c => /did not understand/i.test(c.description))).toBe(false);
  });

  it("gives no compliance credit for an unrecorded policy explanation", () => {
    const unrecorded = analyseSanctionsRewards(input());
    const recorded = analyseSanctionsRewards(input({
      sanctionPolicyExplainedToChild: true,
      appealsProcessExplained: true,
    }));
    expect(unrecorded.complianceScore).toBeLessThan(recorded.complianceScore);
  });
});

describe("recorded judgements still drive the assessment", () => {
  const reviewed = (v: boolean) => input({
    sanctions: [unreviewed({
      proportionate: v, childInformed: v, childUnderstood: v, linkedToBehaviour: v,
    })],
    sanctionPolicyExplainedToChild: v,
    appealsProcessExplained: v,
  });

  it("still claims the strength when proportionality was recorded", () => {
    const { strengths } = analyseSanctionsRewards(reviewed(true));
    expect(strengths.some(s => s.description === "All sanctions recorded as proportionate")).toBe(true);
    expect(analyseSanctionsRewards(reviewed(true)).proportionalityScore).toBe(100);
  });

  it("still raises the concern when a sanction was recorded as disproportionate", () => {
    const { concerns } = analyseSanctionsRewards(reviewed(false));
    expect(concerns.some(c => /disproportionate/i.test(c.description))).toBe(true);
    expect(analyseSanctionsRewards(reviewed(false)).proportionalityScore).toBe(0);
  });

  it("scores proportionality over the judgements actually answered", () => {
    // One of four answered, and answered yes: 100% of what is known.
    const partial = input({ sanctions: [unreviewed({ proportionate: true })] });
    expect(analyseSanctionsRewards(partial).proportionalityScore).toBe(100);
    // Answered no: nothing else was asked, so it forfeits everything known.
    const partialNo = input({ sanctions: [unreviewed({ proportionate: false })] });
    expect(analyseSanctionsRewards(partialNo).proportionalityScore).toBe(0);
  });
});
