import { describe, it, expect } from "vitest";
import { validateRmRiBriefing, type RmRiBriefing } from "../rm-ri-briefing";

function briefing(overrides: Partial<RmRiBriefing> = {}): RmRiBriefing {
  return {
    homeRef: "OAK",
    month: "2026-10",
    homeThisMonth: { summary: "Stable month; two new admissions." },
    risksNeedingChallenge: [{ description: "Agency staffing high", challenge: "Reduce agency use by December." }],
    decisionsNeeded: [
      {
        ref: "d1",
        description: "Fund an extra waking-night post",
        options: ["Recruit permanent", "Continue agency"],
        cost: "£42k/yr",
        consequenceOfDelay: "Continued reliance on agency; rota instability.",
      },
    ],
    riResponse: {
      respondedBy: "RI Name",
      respondedAt: "2026-10-28",
      decisions: [{ decisionRef: "d1", outcome: "agreed" }],
      followUp: [{ decisionRef: "d1", whatHappened: "Post advertised; two candidates shortlisted." }],
    },
    ...overrides,
  };
}

describe("validateRmRiBriefing", () => {
  it("passes a complete two-way briefing", () => {
    const r = validateRmRiBriefing(briefing());
    expect(r.complete).toBe(true);
    expect(r.findings).toHaveLength(0);
  });

  it("flags a one-directional briefing with no RI response (eval case)", () => {
    const r = validateRmRiBriefing(briefing({ riResponse: null }));
    expect(r.complete).toBe(false);
    expect(r.findings.some((f) => f.code === "no_ri_response")).toBe(true);
  });

  it("flags a disagreement with no escalation recorded (red)", () => {
    const r = validateRmRiBriefing(
      briefing({
        riResponse: {
          respondedBy: "RI",
          decisions: [{ decisionRef: "d1", outcome: "declined", disagreement: "RM disagrees — risk to rota." }],
          followUp: [],
        },
      }),
    );
    expect(r.complete).toBe(false);
    expect(r.findings.some((f) => f.code === "disagreement_without_escalation")).toBe(true);
  });

  it("is complete when a disagreement DOES record its escalation", () => {
    const r = validateRmRiBriefing(
      briefing({
        riResponse: {
          respondedBy: "RI",
          decisions: [
            { decisionRef: "d1", outcome: "declined", disagreement: "RM disagrees — risk to rota.", escalation: "Raised to board; review in 4 weeks." },
          ],
          followUp: [{ decisionRef: "d1", whatHappened: "Board review scheduled." }],
        },
      }),
    );
    expect(r.complete).toBe(true);
  });

  it("flags an agreed decision with no follow-up (what happened next?)", () => {
    const r = validateRmRiBriefing(
      briefing({
        riResponse: {
          respondedBy: "RI",
          decisions: [{ decisionRef: "d1", outcome: "agreed" }],
          followUp: [],
        },
      }),
    );
    expect(r.findings.some((f) => f.code === "decision_without_follow_up")).toBe(true);
  });

  it("flags a decision the RI never responded to", () => {
    const r = validateRmRiBriefing(
      briefing({
        decisionsNeeded: [
          { ref: "d1", description: "Fund post", options: ["a"], consequenceOfDelay: "x" },
          { ref: "d2", description: "Approve training budget", options: ["a"], consequenceOfDelay: "y" },
        ],
      }),
    );
    expect(r.findings.some((f) => f.code === "decision_without_ri_outcome")).toBe(true);
  });
});
