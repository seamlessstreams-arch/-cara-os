import { describe, it, expect } from "vitest";
import {
  computeReferralMetrics,
  identifyReferralAlerts,
  type PlacementReferral,
  type OccupancyRecord,
} from "./commissioning-referrals-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeReferral(overrides: Partial<PlacementReferral> = {}): PlacementReferral {
  return {
    id: "ref-1",
    home_id: "home-1",
    child_name: "Alex Smith",
    child_age: 12,
    child_gender: "male",
    referring_authority: "County LA",
    social_worker_name: "Jane Doe",
    social_worker_email: "jane@example.com",
    referral_date: "2026-05-10",
    urgency: "standard",
    status: "received",
    presenting_needs: ["emotional"],
    risk_factors: [],
    decline_reason: null,
    decline_notes: null,
    decision_date: null,
    decision_by: null,
    matching_score: null,
    placement_start_date: null,
    created_at: "2026-05-10T08:00:00Z",
    updated_at: "2026-05-10T08:00:00Z",
    ...overrides,
  };
}

function makeOccupancy(overrides: Partial<OccupancyRecord> = {}): OccupancyRecord {
  return {
    id: "occ-1",
    home_id: "home-1",
    record_date: "2026-05-20",
    registered_places: 4,
    children_in_placement: 3,
    occupancy_rate: 75,
    referrals_in_progress: 1,
    planned_admissions: 0,
    planned_departures: 0,
    commentary: null,
    recorded_by: "manager",
    created_at: "2026-05-20T08:00:00Z",
    ...overrides,
  };
}

describe("computeReferralMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeReferralMetrics([], []);
    expect(m.total_referrals).toBe(0);
    expect(m.active_referrals).toBe(0);
    expect(m.accepted).toBe(0);
    expect(m.declined).toBe(0);
    expect(m.acceptance_rate).toBeNull();;
    expect(m.avg_decision_days).toBe(0);
    expect(m.current_occupancy_rate).toBe(0);
    expect(m.available_places).toBe(0);
  });

  it("counts statuses and urgencies correctly", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "received", urgency: "emergency" }),
      makeReferral({ id: "r2", status: "under_review", urgency: "urgent" }),
      makeReferral({ id: "r3", status: "accepted", urgency: "planned" }),
      makeReferral({ id: "r4", status: "declined", urgency: "standard", decline_reason: "needs_mismatch" }),
      makeReferral({ id: "r5", status: "placed", urgency: "standard" }),
      makeReferral({ id: "r6", status: "withdrawn", urgency: "standard" }),
    ];
    const m = computeReferralMetrics(referrals, []);
    expect(m.total_referrals).toBe(6);
    expect(m.active_referrals).toBe(2);
    // accepted includes "accepted" + "placed"
    expect(m.accepted).toBe(2);
    expect(m.declined).toBe(1);
    expect(m.withdrawn).toBe(1);
    expect(m.placed).toBe(1);
    expect(m.emergency_referrals).toBe(1);
    expect(m.by_status.received).toBe(1);
    expect(m.by_urgency.emergency).toBe(1);
    expect(m.by_decline_reason.needs_mismatch).toBe(1);
  });

  it("calculates acceptance rate from resolved referrals", () => {
    // resolved = accepted + declined = 2 + 1 = 3; acceptance_rate = 2/3 = 66.7
    const referrals = [
      makeReferral({ id: "r1", status: "accepted" }),
      makeReferral({ id: "r2", status: "placed" }),
      makeReferral({ id: "r3", status: "declined" }),
    ];
    const m = computeReferralMetrics(referrals, []);
    expect(m.acceptance_rate).toBe(66.7);
  });

  it("calculates avg decision days", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        status: "accepted",
        referral_date: "2026-05-01",
        decision_date: "2026-05-04",
      }),
      makeReferral({
        id: "r2",
        status: "declined",
        referral_date: "2026-05-01",
        decision_date: "2026-05-06",
      }),
    ];
    const m = computeReferralMetrics(referrals, []);
    // r1: 3 days, r2: 5 days => avg = 4
    expect(m.avg_decision_days).toBe(4);
  });

  it("reads latest occupancy record", () => {
    const occupancy = [
      makeOccupancy({ id: "o1", record_date: "2026-05-18", occupancy_rate: 50, registered_places: 4, children_in_placement: 2 }),
      makeOccupancy({ id: "o2", record_date: "2026-05-20", occupancy_rate: 75, registered_places: 4, children_in_placement: 3 }),
    ];
    const m = computeReferralMetrics([], occupancy);
    expect(m.current_occupancy_rate).toBe(75);
    expect(m.available_places).toBe(1);
  });

  it("tracks referrals by referring authority", () => {
    const referrals = [
      makeReferral({ id: "r1", referring_authority: "Borough A" }),
      makeReferral({ id: "r2", referring_authority: "Borough A" }),
      makeReferral({ id: "r3", referring_authority: "Borough B" }),
    ];
    const m = computeReferralMetrics(referrals, []);
    expect(m.by_authority["Borough A"]).toBe(2);
    expect(m.by_authority["Borough B"]).toBe(1);
  });
});

describe("identifyReferralAlerts", () => {
  it("returns empty alerts for empty data", () => {
    const alerts = identifyReferralAlerts([], [], NOW);
    expect(alerts).toEqual([]);
  });

  it("flags emergency referrals pending", () => {
    const referrals = [
      makeReferral({ id: "r1", urgency: "emergency", status: "received" }),
    ];
    const alerts = identifyReferralAlerts(referrals, [], NOW);
    const emergencyAlerts = alerts.filter((a) => a.type === "emergency_pending");
    expect(emergencyAlerts).toHaveLength(1);
    expect(emergencyAlerts[0].severity).toBe("critical");
  });

  it("flags urgent referrals overdue (>2 days)", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        urgency: "urgent",
        status: "received",
        referral_date: "2026-05-18",
      }),
    ];
    const alerts = identifyReferralAlerts(referrals, [], NOW);
    const urgentAlerts = alerts.filter((a) => a.type === "urgent_overdue");
    expect(urgentAlerts).toHaveLength(1);
    expect(urgentAlerts[0].severity).toBe("high");
  });

  it("does not flag urgent referral within 2 days", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        urgency: "urgent",
        status: "received",
        referral_date: "2026-05-20",
      }),
    ];
    const alerts = identifyReferralAlerts(referrals, [], NOW);
    const urgentAlerts = alerts.filter((a) => a.type === "urgent_overdue");
    expect(urgentAlerts).toHaveLength(0);
  });

  it("flags stale referrals (>7 days)", () => {
    const referrals = [
      makeReferral({
        id: "r1",
        urgency: "standard",
        status: "received",
        referral_date: "2026-05-10",
      }),
    ];
    const alerts = identifyReferralAlerts(referrals, [], NOW);
    const staleAlerts = alerts.filter((a) => a.type === "stale_referral");
    expect(staleAlerts).toHaveLength(1);
    expect(staleAlerts[0].severity).toBe("medium");
  });

  it("flags full occupancy", () => {
    const occupancy = [
      makeOccupancy({ registered_places: 4, children_in_placement: 4 }),
    ];
    const alerts = identifyReferralAlerts([], occupancy, NOW);
    const fullAlerts = alerts.filter((a) => a.type === "full_occupancy");
    expect(fullAlerts).toHaveLength(1);
    expect(fullAlerts[0].severity).toBe("high");
  });

  it("flags high decline rate (>50% of 5+ resolved)", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "declined" }),
      makeReferral({ id: "r2", status: "declined" }),
      makeReferral({ id: "r3", status: "declined" }),
      makeReferral({ id: "r4", status: "accepted" }),
      makeReferral({ id: "r5", status: "placed" }),
    ];
    // resolved: accepted(1)+placed(1)+declined(3) = 5; declined/resolved = 3/5 = 60% > 50%
    const alerts = identifyReferralAlerts(referrals, [], NOW);
    const declineAlerts = alerts.filter((a) => a.type === "high_decline_rate");
    expect(declineAlerts).toHaveLength(1);
    expect(declineAlerts[0].severity).toBe("medium");
  });
});
