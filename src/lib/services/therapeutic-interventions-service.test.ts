import { describe, it, expect } from "vitest";
import {
  computeTherapyMetrics,
  identifyTherapyAlerts,
  type TherapyReferral,
  type TherapySession,
} from "./therapeutic-interventions-service";

// ── Factories ────────────────────────────────────────────────────────────

function makeReferral(overrides: Partial<TherapyReferral> = {}): TherapyReferral {
  return {
    id: "ref1",
    home_id: "h1",
    child_id: "c1",
    child_name: "Alex",
    therapy_type: "cbt",
    provider_name: "Provider A",
    therapist_name: "Dr Smith",
    referral_date: "2025-01-01",
    referral_reason: "Anxiety",
    status: "active",
    date_started: "2025-01-15",
    date_ended: null,
    frequency: "weekly",
    session_count: 4,
    goals: ["Reduce anxiety"],
    outcomes: [],
    waiting_time_days: null,
    created_at: "2025-01-01",
    updated_at: "2025-01-01",
    ...overrides,
  };
}

function makeSession(overrides: Partial<TherapySession> = {}): TherapySession {
  return {
    id: "ses1",
    home_id: "h1",
    child_id: "c1",
    child_name: "Alex",
    referral_id: "ref1",
    therapy_type: "cbt",
    session_date: "2025-03-01",
    session_number: 1,
    status: "attended",
    engagement_level: "fully_engaged",
    progress_rating: "some_progress",
    session_notes: null,
    goals_addressed: ["Reduce anxiety"],
    home_actions: [],
    therapist_recommendations: null,
    staff_attended: null,
    created_at: "2025-03-01",
    ...overrides,
  };
}

// ── computeTherapyMetrics ────────────────────────────────────────────────

describe("computeTherapyMetrics", () => {
  it("returns zeroes for empty inputs", () => {
    const m = computeTherapyMetrics([], [], 0);
    expect(m.active_referrals).toBe(0);
    expect(m.children_in_therapy).toBe(0);
    expect(m.children_waiting).toBe(0);
    expect(m.total_sessions).toBe(0);
    expect(m.sessions_attended).toBe(0);
    expect(m.attendance_rate).toBeNull();;
    expect(m.avg_engagement).toBe(0);
    expect(m.children_progressing).toBe(0);
    expect(m.children_regressing).toBe(0);
    expect(m.avg_waiting_days).toBe(0);
  });

  it("counts active referrals and children in therapy", () => {
    const referrals = [
      makeReferral({ child_id: "c1", status: "active" }),
      makeReferral({ id: "ref2", child_id: "c2", status: "active" }),
      makeReferral({ id: "ref3", child_id: "c3", status: "waitlisted" }),
    ];
    const m = computeTherapyMetrics(referrals, [], 5);
    expect(m.active_referrals).toBe(2);
    expect(m.children_in_therapy).toBe(2);
    expect(m.children_waiting).toBe(1);
  });

  it("calculates attendance rate from attended/dna/cancelled_child", () => {
    const sessions = [
      makeSession({ status: "attended" }),
      makeSession({ id: "ses2", status: "dna" }),
      makeSession({ id: "ses3", status: "attended" }),
    ];
    const m = computeTherapyMetrics([], sessions, 1);
    // 2 attended out of 3 countable sessions = 66.7%
    expect(m.attendance_rate).toBe(66.7);
  });

  it("calculates average engagement for attended sessions", () => {
    const sessions = [
      makeSession({ engagement_level: "fully_engaged" }), // 5
      makeSession({ id: "ses2", engagement_level: "partially_engaged" }), // 4
    ];
    const m = computeTherapyMetrics([], sessions, 1);
    // (5+4)/2 = 4.5
    expect(m.avg_engagement).toBe(4.5);
  });

  it("counts progressing and regressing children by latest session", () => {
    const sessions = [
      makeSession({ child_id: "c1", session_date: "2025-03-01", progress_rating: "some_progress" }),
      makeSession({ id: "ses2", child_id: "c1", session_date: "2025-04-01", progress_rating: "significant_progress" }),
      makeSession({ id: "ses3", child_id: "c2", child_name: "Jordan", session_date: "2025-03-01", progress_rating: "significant_regression" }),
    ];
    const m = computeTherapyMetrics([], sessions, 2);
    expect(m.children_progressing).toBe(1); // c1 latest = significant_progress
    expect(m.children_regressing).toBe(1); // c2 = significant_regression
  });

  it("calculates average waiting days", () => {
    const referrals = [
      makeReferral({ waiting_time_days: 30 }),
      makeReferral({ id: "ref2", waiting_time_days: 60 }),
    ];
    const m = computeTherapyMetrics(referrals, [], 2);
    expect(m.avg_waiting_days).toBe(45);
  });
});

// ── identifyTherapyAlerts ────────────────────────────────────────────────

describe("identifyTherapyAlerts", () => {
  it("returns empty array for empty inputs", () => {
    expect(identifyTherapyAlerts([], [], 0)).toEqual([]);
  });

  it("triggers critical alert for wait > 56 days", () => {
    const referrals = [
      makeReferral({ status: "waitlisted", waiting_time_days: 60 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.some((a) => a.type === "long_wait" && a.severity === "critical")).toBe(true);
  });

  it("triggers high alert for wait > 28 and <= 56 days", () => {
    const referrals = [
      makeReferral({ status: "referred", waiting_time_days: 35 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.some((a) => a.type === "long_wait" && a.severity === "high")).toBe(true);
  });

  it("does not trigger wait alert for wait <= 28 days", () => {
    const referrals = [
      makeReferral({ status: "waitlisted", waiting_time_days: 20 }),
    ];
    const alerts = identifyTherapyAlerts(referrals, [], 1);
    expect(alerts.some((a) => a.type === "long_wait")).toBe(false);
  });

  it("triggers high alert for significant regression", () => {
    const sessions = [
      makeSession({ progress_rating: "significant_regression" }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.some((a) => a.type === "significant_regression" && a.severity === "high")).toBe(true);
  });

  it("triggers medium alert for some regression", () => {
    const sessions = [
      makeSession({ progress_rating: "some_regression" }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.some((a) => a.type === "some_regression" && a.severity === "medium")).toBe(true);
  });

  it("triggers high alert for refused engagement", () => {
    const sessions = [
      makeSession({ engagement_level: "refused" }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.some((a) => a.type === "engagement_refused" && a.severity === "high")).toBe(true);
  });

  it("triggers high alert for 2+ DNA sessions for same child", () => {
    const sessions = [
      makeSession({ status: "dna", child_id: "c1" }),
      makeSession({ id: "ses2", status: "dna", child_id: "c1" }),
    ];
    const alerts = identifyTherapyAlerts([], sessions, 1);
    expect(alerts.some((a) => a.type === "repeated_dna" && a.severity === "high")).toBe(true);
  });
});
