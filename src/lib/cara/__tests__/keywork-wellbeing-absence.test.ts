// ══════════════════════════════════════════════════════════════════════════════
// Tests — an unrecorded session is not a session that happened
//
// Keyworking defaulted `occurred` to `true`, so a keywork session nobody had
// written up counted toward the statutory frequency compliance rate, and
// `reg44VisitsCurrent ?? true` reported the Regulation 44 independent-visitor
// standard as met for a home with no keywork config row.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseKeyworking,
  type KeyworkingInput,
  type KeyworkSession,
} from "../keyworking-intelligence";

function session(occurred: boolean | null, id = "s1"): KeyworkSession {
  return {
    id,
    date: "2026-05-01",
    keyworkerName: "Staff A",
    plannedDuration: 60,
    actualDuration: 60,
    occurred,
    topicsCovered: ["wellbeing"],
    childLed: true,
    wishesAndFeelingsRecorded: true,
    actionsAgreed: 1,
    actionsCompleted: 1,
    childEngagement: "high",
    privateTime: true,
    location: "in_home",
  };
}

function input(overrides: Partial<KeyworkingInput> = {}): KeyworkingInput {
  return {
    childId: "child_1",
    childName: "Jordan",
    age: 15,
    sessions: [],
    expectedFrequency: "weekly",
    expectedFrequencyPerMonth: 4,
    currentKeyworkerName: "Staff A",
    keyworkerChangesLast12Months: 0,
    keyworkerRelationshipMonths: 12,
    childCanChooseTopics: null,
    childKnowsKeyworker: null,
    keyworkPolicyInPlace: null,
    reg44VisitorMeetsChild: null,
    reg44VisitsCurrent: null,
    ...overrides,
  };
}

const reg44 = (a: ReturnType<typeof analyseKeyworking>) =>
  a.regulatoryFlags.find(f => /44/.test(f.regulation) || /visitor/i.test(f.area));

describe("an unrecorded keywork session", () => {
  it("does not count toward frequency compliance", () => {
    const unrecorded = analyseKeyworking(input({ sessions: [session(null), session(null, "s2")] }));
    const held = analyseKeyworking(input({ sessions: [session(true), session(true, "s2")] }));
    expect(unrecorded.occurredSessions).toBeLessThan(held.occurredSessions);
    expect(unrecorded.occurredSessions).toBe(0);
  });

  it("is not counted as a staff cancellation either", () => {
    const { concerns } = analyseKeyworking(input({ sessions: [session(null), session(null, "s2")] }));
    expect(concerns.some(c => /cancelled/i.test(c.description))).toBe(false);
  });
});

describe("Regulation 44 independent visits", () => {
  it("are not reported as current when nothing was recorded", () => {
    expect(reg44(analyseKeyworking(input()))?.status).toBe("not_evidenced");
  });

  it("are still reported as met when recorded", () => {
    expect(reg44(analyseKeyworking(input({ reg44VisitsCurrent: true })))?.status).toBe("met");
  });

  it("are still reported as not met when recorded as absent", () => {
    expect(reg44(analyseKeyworking(input({ reg44VisitsCurrent: false })))?.status).toBe("not_met");
  });

  it("claim no strength when the visitor meeting the child was never recorded", () => {
    const { strengths } = analyseKeyworking(input());
    expect(strengths.some(s => /44|independent/i.test(s.description))).toBe(false);
  });

  it("does not recommend action on a visit schedule nobody recorded", () => {
    const { recommendations } = analyseKeyworking(input());
    expect(recommendations.some(r => /Regulation 44|Reg 44/i.test(r))).toBe(false);
    expect(analyseKeyworking(input({ reg44VisitsCurrent: false })).recommendations
      .some(r => /Regulation 44|Reg 44/i.test(r))).toBe(true);
  });
});
