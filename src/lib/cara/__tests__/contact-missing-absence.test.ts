// ══════════════════════════════════════════════════════════════════════════════
// Tests — absence is not assurance (contact plans, missing-episode notifications)
//
// `contactPlanReviewed` and `childConsultedOnPlan` defaulted to `true`, so the
// IRO Handbook contact-review flag read "met" for a child whose contact config
// row did not exist. `socialWorkerNotified` defaulted to `true` on every
// missing episode, while the police and Ofsted notifications beside it
// defaulted to false — the odd one out was the bug.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { analyseContact, type ContactInput } from "../contact-intelligence";
import { analyseMissingEpisodes, type MissingInput, type MissingEpisode } from "../missing-episodes-intelligence";

function contactInput(overrides: Partial<ContactInput> = {}): ContactInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    contactSessions: [],
    arrangements: [],
    contactPlanReviewed: null,
    childConsultedOnPlan: null,
    advocateAvailableForContact: null,
    lifestoryWorkStarted: false,
    siblingPlacementConsidered: null,
    letterboxContactAvailable: false,
    ...overrides,
  };
}

const iroFlag = (a: ReturnType<typeof analyseContact>) =>
  a.regulatoryFlags.find(f => f.regulation === "IRO Handbook");

describe("an unrecorded contact review is not a completed one", () => {
  it("does not report the IRO contact review as met", () => {
    const flag = iroFlag(analyseContact(contactInput()));
    expect(flag?.status).toBe("not_evidenced");
    expect(flag?.detail).toMatch(/no record/i);
  });

  it("reports the gap without asserting the review was skipped", () => {
    const { concerns } = analyseContact(contactInput());
    expect(concerns.some(c => /is not recorded/i.test(c.description))).toBe(true);
    expect(concerns.some(c => c.description.startsWith("Contact plan not reviewed —"))).toBe(false);
  });

  it("still reports met when the review was recorded, and not_met when it was recorded as missed", () => {
    expect(iroFlag(analyseContact(contactInput({ contactPlanReviewed: true })))?.status).toBe("met");
    expect(iroFlag(analyseContact(contactInput({ contactPlanReviewed: false })))?.status).toBe("not_met");
  });

  it("still raises the child-voice concern when consultation was recorded as absent", () => {
    const { concerns } = analyseContact(contactInput({ childConsultedOnPlan: false }));
    expect(concerns.some(c => c.description === "Child not consulted on contact arrangements")).toBe(true);
  });
});

describe("an unrecorded social-worker notification is not a notification", () => {
  const episode = (socialWorkerNotified: boolean | null): MissingEpisode => ({
    id: "e_1",
    date: "2026-05-01",
    startTime: "18:00",
    endDate: "2026-05-01",
    endTime: "22:00",
    category: "missing",
    outcome: "returned_self",
    policeNotified: true,
    socialWorkerNotified,
    returnHomeInterview: { offered: true, completed: true, within72Hours: true },
  });

  const run = (v: boolean | null): ReturnType<typeof analyseMissingEpisodes> => {
    const input: MissingInput = {
      childId: "child_1",
      childName: "Jordan",
      age: 15,
      episodes: [episode(v)],
      hasRiskAssessment: true,
      riskAssessmentUpToDate: true,
      hasMissingProtocol: true,
      knownCSERisk: false,
      knownCCERisk: false,
      knownGangAssociation: false,
      placementType: "childrens_home",
    };
    return analyseMissingEpisodes(input);
  };

  it("does not penalise an episode for a notification nobody recorded", () => {
    // A recorded failure to notify costs the episode 20 points; an unrecorded
    // one must not be scored as though the notification had happened, nor as
    // though it had been missed.
    expect(run(null).responseScore).toBe(run(true).responseScore);
  });

  it("still penalises a recorded failure to notify", () => {
    expect(run(false).responseScore!).toBeLessThan(run(true).responseScore!);
  });
});
