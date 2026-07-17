import { describe, it, expect } from "vitest";
import { assessEscalationQuality, DECISION_WINDOW_HOURS } from "../escalation-quality-engine";
import type { EscalationDecision } from "../types";

// 2.2.11's contract, with the covenant's fairness rules pinned:
//   - a concern waiting past its level's window surfaces (under-escalation);
//   - repeated amend-downs get BOTH readings — engine calibration OR risk
//     minimisation — never a verdict about a person;
//   - alert fatigue needs volume; small numbers are read as small numbers;
//   - timely decisions are named as a positive.

const NOW = new Date("2026-07-17T12:00:00Z");
function hoursAgo(h: number): string {
  return new Date(NOW.getTime() - h * 3_600_000).toISOString();
}

let n = 0;
function decision(over: Partial<EscalationDecision>): EscalationDecision {
  n += 1;
  return {
    id: `esc_${n}`,
    createdAt: hoursAgo(30),
    createdBy: "staff_a",
    childId: "yp_test",
    childName: "Test",
    concernSummary: "Pattern of unexplained absences after contact",
    suggestedLevel: "emerging_concern",
    suggestedAt: hoursAgo(30),
    suggestionEvidence: [],
    engineVersion: "1",
    status: "decided",
    agreement: "confirmed",
    confirmedLevel: "emerging_concern",
    decisionMaker: "staff_rm",
    decisionMakerRole: "registered_manager",
    actionsTriggered: [],
    decidedAt: hoursAgo(28),
    sourceRecords: [],
    auditTrail: [],
    ...over,
  };
}

describe("the windows are the doctrine's timescales", () => {
  it("low 24h · emerging 8h · high 2h · immediate 30min", () => {
    expect(DECISION_WINDOW_HOURS.low_concern).toBe(24);
    expect(DECISION_WINDOW_HOURS.emerging_concern).toBe(8);
    expect(DECISION_WINDOW_HOURS.high_concern).toBe(2);
    expect(DECISION_WINDOW_HOURS.immediate_safeguarding).toBe(0.5);
  });
});

describe("under-escalation — concerns aging while nobody decides", () => {
  it("flags an awaiting decision past its window, with hours and window shown", () => {
    const r = assessEscalationQuality(
      [decision({ status: "awaiting_decision", agreement: undefined, confirmedLevel: undefined, decidedAt: undefined, suggestedAt: hoursAgo(12) })],
      NOW,
    );
    const f = r.findings.find((x) => x.key === "decision_overdue");
    expect(f).toBeTruthy();
    expect(f!.headline).toMatch(/12h/);
    expect(f!.headline).toMatch(/8h/);
    expect(f!.whyShown).toMatch(/risk aging quietly/i);
  });

  it("does not flag an awaiting decision still inside its window", () => {
    const r = assessEscalationQuality(
      [decision({ status: "awaiting_decision", agreement: undefined, confirmedLevel: undefined, decidedAt: undefined, suggestedAt: hoursAgo(3) })],
      NOW,
    );
    expect(r.findings.some((x) => x.key === "decision_overdue")).toBe(false);
  });
});

describe("amend-down fairness — both readings, never a verdict", () => {
  it("states engine calibration AND risk minimisation as live possibilities", () => {
    const r = assessEscalationQuality([
      decision({ agreement: "amended", suggestedLevel: "high_concern", confirmedLevel: "emerging_concern", suggestedAt: hoursAgo(5), decidedAt: hoursAgo(4) }),
      decision({ agreement: "amended", suggestedLevel: "emerging_concern", confirmedLevel: "low_concern", suggestedAt: hoursAgo(7), decidedAt: hoursAgo(6) }),
    ], NOW);
    const f = r.findings.find((x) => x.key === "amend_down_pattern");
    expect(f).toBeTruthy();
    expect(f!.whyShown).toMatch(/over-weighting/i);
    expect(f!.whyShown).toMatch(/minimised/i);
    expect(f!.whyShown).toMatch(/cannot tell them apart/i);
  });

  it("one amend-down alone is not a pattern", () => {
    const r = assessEscalationQuality([
      decision({ agreement: "amended", suggestedLevel: "high_concern", confirmedLevel: "emerging_concern", suggestedAt: hoursAgo(5), decidedAt: hoursAgo(4) }),
    ], NOW);
    expect(r.findings.some((x) => x.key === "amend_down_pattern")).toBe(false);
  });

  it("an amend UP judges against the confirmed (stricter) window", () => {
    // Suggested emerging (8h), amended up to high (2h), decided in 3h → outside.
    const r = assessEscalationQuality([
      decision({ agreement: "amended", suggestedLevel: "emerging_concern", confirmedLevel: "high_concern", suggestedAt: hoursAgo(5), decidedAt: hoursAgo(2) }),
    ], NOW);
    expect(r.reads[0].direction).toBe("amended_up");
    expect(r.reads[0].withinWindow).toBe(false);
  });
});

describe("alert fatigue needs volume", () => {
  const urgent = () => decision({ suggestedLevel: "high_concern", confirmedLevel: "high_concern", suggestedAt: hoursAgo(3), decidedAt: hoursAgo(2.5) });

  it("does not fire on four records however urgent the mix", () => {
    const r = assessEscalationQuality([urgent(), urgent(), urgent(), urgent()], NOW);
    expect(r.findings.some((x) => x.key === "alert_fatigue_risk")).toBe(false);
  });

  it("fires at volume, and allows for a genuinely acute period in its own wording", () => {
    const r = assessEscalationQuality([urgent(), urgent(), urgent(), urgent(), urgent()], NOW);
    const f = r.findings.find((x) => x.key === "alert_fatigue_risk");
    expect(f).toBeTruthy();
    expect(f!.whyShown).toMatch(/genuinely acute period/i);
  });
});

describe("the positive", () => {
  it("names timely, balanced decision-making", () => {
    const r = assessEscalationQuality([
      decision({ suggestedAt: hoursAgo(30), decidedAt: hoursAgo(26) }), // 4h vs 8h ✓
      decision({ suggestedLevel: "low_concern", confirmedLevel: "low_concern", suggestedAt: hoursAgo(30), decidedAt: hoursAgo(20) }), // 10h vs 24h ✓
    ], NOW);
    const f = r.findings.find((x) => x.key === "calibration_healthy");
    expect(f?.tone).toBe("positive");
    expect(f?.whyShown).toMatch(/practice, not luck/i);
  });
});

describe("the rollup numbers", () => {
  it("computes medians per level and honest counts", () => {
    const r = assessEscalationQuality([
      decision({ suggestedAt: hoursAgo(30), decidedAt: hoursAgo(26) }),   // 4h emerging
      decision({ suggestedAt: hoursAgo(20), decidedAt: hoursAgo(14) }),   // 6h emerging
    ], NOW);
    expect(r.medianHoursByLevel.emerging_concern).toBe(5);
    expect(r.medianHoursByLevel.high_concern).toBeUndefined(); // honest null, no invented zero
    expect(r.counts.total).toBe(2);
    expect(r.counts.withinWindow).toBe(2);
  });
});
