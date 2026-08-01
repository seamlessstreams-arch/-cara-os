import { describe, it, expect } from "vitest";
import {
  computePeerMetrics,
  identifyPeerAlerts,
} from "./peer-mentoring-service";
import type { PeerPairing } from "./peer-mentoring-service";

// -- Factory ------------------------------------------------------------------

function makePairing(overrides: Partial<PeerPairing> = {}): PeerPairing {
  return {
    id: "pp-1",
    home_id: "home-1",
    mentor_name: "Alex",
    mentor_id: "child-1",
    mentee_name: "Beth",
    mentee_id: "child-2",
    pairing_type: "buddy_system",
    pairing_status: "active",
    start_date: "2026-04-01",
    end_date: null,
    goals: ["Build confidence", "Study support"],
    sessions_completed: 5,
    last_session_date: "2026-05-15",
    last_session_outcome: "positive",
    safeguarding_flag: "none",
    mentor_feedback: "Going well",
    mentee_feedback: "Really helpful",
    staff_observations: null,
    reviewed_by: null,
    review_date: null,
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computePeerMetrics -------------------------------------------------------

describe("computePeerMetrics", () => {
  it("returns zeroes for empty pairings with zero children", () => {
    const m = computePeerMetrics([], 0);
    expect(m.total_pairings).toBe(0);
    expect(m.active_pairings).toBe(0);
    expect(m.children_involved).toBe(0);
    expect(m.participation_rate).toBeNull();; expect(m.total_sessions).toBe(0);
    expect(m.average_sessions_per_pairing).toBeNull();; expect(m.positive_outcome_rate).toBeNull();; expect(m.safeguarding_concerns).toBe(0);
  });

  it("counts active, completed, and ended_early pairings", () => {
    const pairings = [
      makePairing({ id: "1", pairing_status: "active" }),
      makePairing({ id: "2", pairing_status: "completed" }),
      makePairing({ id: "3", pairing_status: "ended_early" }),
      makePairing({ id: "4", pairing_status: "active" }),
    ];
    const m = computePeerMetrics(pairings, 8);
    expect(m.active_pairings).toBe(2);
    expect(m.completed_pairings).toBe(1);
    expect(m.ended_early_count).toBe(1);
  });

  it("calculates children_involved as unique mentor + mentee ids", () => {
    const pairings = [
      makePairing({ id: "1", mentor_id: "a", mentee_id: "b" }),
      makePairing({ id: "2", mentor_id: "a", mentee_id: "c" }),
    ];
    const m = computePeerMetrics(pairings, 5);
    expect(m.children_involved).toBe(3); // a, b, c
    expect(m.participation_rate).toBe(60); // 3/5 = 60%
  });

  it("calculates total and average sessions", () => {
    const pairings = [
      makePairing({ id: "1", sessions_completed: 10 }),
      makePairing({ id: "2", sessions_completed: 6 }),
    ];
    const m = computePeerMetrics(pairings, 4);
    expect(m.total_sessions).toBe(16);
    expect(m.average_sessions_per_pairing).toBe(8);
  });

  it("calculates positive outcome rate from pairings with last_session_outcome", () => {
    const pairings = [
      makePairing({ id: "1", last_session_outcome: "very_positive" }),
      makePairing({ id: "2", last_session_outcome: "positive" }),
      makePairing({ id: "3", last_session_outcome: "negative" }),
      makePairing({ id: "4", last_session_outcome: null }),
    ];
    const m = computePeerMetrics(pairings, 8);
    // 2 of 3 with outcomes = 66.7%
    expect(m.positive_outcome_rate).toBe(66.7);
  });

  it("counts safeguarding concerns (flag !== none)", () => {
    const pairings = [
      makePairing({ id: "1", safeguarding_flag: "none" }),
      makePairing({ id: "2", safeguarding_flag: "power_imbalance" }),
      makePairing({ id: "3", safeguarding_flag: "escalated" }),
    ];
    const m = computePeerMetrics(pairings, 6);
    expect(m.safeguarding_concerns).toBe(2);
  });

  it("calculates feedback rates", () => {
    const pairings = [
      makePairing({ id: "1", mentor_feedback: "Good", mentee_feedback: "Thanks" }),
      makePairing({ id: "2", mentor_feedback: null, mentee_feedback: null }),
    ];
    const m = computePeerMetrics(pairings, 4);
    expect(m.mentor_feedback_rate).toBe(50);
    expect(m.mentee_feedback_rate).toBe(50);
  });
});

// -- identifyPeerAlerts -------------------------------------------------------

describe("identifyPeerAlerts", () => {
  it("returns empty array when no issues", () => {
    const alerts = identifyPeerAlerts([makePairing()]);
    expect(alerts).toEqual([]);
  });

  it("flags critical safeguarding_escalated", () => {
    const pairings = [makePairing({ safeguarding_flag: "escalated" })];
    const alerts = identifyPeerAlerts(pairings);
    const esc = alerts.filter((a) => a.type === "safeguarding_escalated");
    expect(esc.length).toBe(1);
    expect(esc[0].severity).toBe("critical");
  });

  it("flags high safeguarding_concern for non-none, non-escalated flags", () => {
    const pairings = [makePairing({ safeguarding_flag: "bullying_concern" })];
    const alerts = identifyPeerAlerts(pairings);
    const sc = alerts.filter((a) => a.type === "safeguarding_concern");
    expect(sc.length).toBe(1);
    expect(sc[0].severity).toBe("high");
  });

  it("flags medium negative_outcome for active pairing with negative last session", () => {
    const pairings = [makePairing({ pairing_status: "active", last_session_outcome: "negative" })];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.filter((a) => a.type === "negative_outcome");
    expect(neg.length).toBe(1);
    expect(neg[0].severity).toBe("medium");
  });

  it("does not flag negative_outcome for completed pairing", () => {
    const pairings = [makePairing({ pairing_status: "completed", last_session_outcome: "negative" })];
    const alerts = identifyPeerAlerts(pairings);
    const neg = alerts.filter((a) => a.type === "negative_outcome");
    expect(neg.length).toBe(0);
  });

  it("flags medium review_needed for pending_review pairings", () => {
    const pairings = [makePairing({ pairing_status: "pending_review" })];
    const alerts = identifyPeerAlerts(pairings);
    const rn = alerts.filter((a) => a.type === "review_needed");
    expect(rn.length).toBe(1);
    expect(rn[0].severity).toBe("medium");
  });

  it("flags medium no_sessions for active pairing with 0 sessions", () => {
    const pairings = [makePairing({ pairing_status: "active", sessions_completed: 0 })];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.filter((a) => a.type === "no_sessions");
    expect(ns.length).toBe(1);
    expect(ns[0].severity).toBe("medium");
  });

  it("does not flag no_sessions when sessions > 0", () => {
    const pairings = [makePairing({ pairing_status: "active", sessions_completed: 1 })];
    const alerts = identifyPeerAlerts(pairings);
    const ns = alerts.filter((a) => a.type === "no_sessions");
    expect(ns.length).toBe(0);
  });
});
