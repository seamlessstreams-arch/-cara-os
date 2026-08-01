import { describe, it, expect } from "vitest";
import {
  computeSafeguardingReferralMetrics,
  identifySafeguardingReferralAlerts,
} from "./safeguarding-referral-service";
import type { SafeguardingReferralRecord } from "./safeguarding-referral-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<SafeguardingReferralRecord> = {}): SafeguardingReferralRecord {
  return {
    id: "sr-1",
    home_id: "home-1",
    referral_type: "mash_referral",
    referral_outcome: "no_further_action",
    referral_urgency: "routine",
    concern_category: "neglect",
    referral_date: "2026-05-10",
    child_name: "Alex",
    child_id: null,
    referred_to_agency: "Social Services",
    referral_reference: null,
    referral_timely: true,
    consent_obtained: true,
    consent_not_required_reason: null,
    information_shared_appropriately: true,
    manager_informed: true,
    ofsted_notified: true,
    lado_consulted: true,
    strategy_meeting_held: false,
    child_informed: true,
    parents_informed: true,
    outcome_communicated: true,
    follow_up_required: false,
    issues_found: [],
    actions_taken: [],
    referred_by: "Staff A",
    response_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeSafeguardingReferralMetrics ---------------------------------------

describe("computeSafeguardingReferralMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSafeguardingReferralMetrics([]);
    expect(m.total_referrals).toBe(0);
    expect(m.investigation_count).toBe(0);
    expect(m.nfa_count).toBe(0);
    expect(m.pending_count).toBe(0);
    expect(m.immediate_urgency_count).toBe(0);
    expect(m.timely_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts outcome types correctly", () => {
    const records = [
      makeRecord({ id: "1", referral_outcome: "investigation_opened" }),
      makeRecord({ id: "2", referral_outcome: "no_further_action" }),
      makeRecord({ id: "3", referral_outcome: "pending" }),
    ];
    const m = computeSafeguardingReferralMetrics(records);
    expect(m.investigation_count).toBe(1);
    expect(m.nfa_count).toBe(1);
    expect(m.pending_count).toBe(1);
  });

  it("counts immediate urgency", () => {
    const records = [
      makeRecord({ id: "1", referral_urgency: "immediate" }),
      makeRecord({ id: "2", referral_urgency: "routine" }),
    ];
    const m = computeSafeguardingReferralMetrics(records);
    expect(m.immediate_urgency_count).toBe(1);
  });

  it("computes boolean rates as percentages", () => {
    const records = [
      makeRecord({ id: "1", referral_timely: true }),
      makeRecord({ id: "2", referral_timely: true }),
      makeRecord({ id: "3", referral_timely: false }),
    ];
    const m = computeSafeguardingReferralMetrics(records);
    expect(m.timely_rate).toBe(66.7);
  });

  it("counts follow-up required", () => {
    const records = [
      makeRecord({ id: "1", follow_up_required: true }),
      makeRecord({ id: "2", follow_up_required: false }),
    ];
    const m = computeSafeguardingReferralMetrics(records);
    expect(m.follow_up_required_count).toBe(1);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Beth" }),
      makeRecord({ id: "3", child_name: "Alex" }),
    ];
    const m = computeSafeguardingReferralMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown maps", () => {
    const records = [
      makeRecord({ referral_type: "lado_referral", referral_outcome: "investigation_opened", referral_urgency: "within_24_hours", concern_category: "physical_abuse" }),
    ];
    const m = computeSafeguardingReferralMetrics(records);
    expect(m.by_referral_type["lado_referral"]).toBe(1);
    expect(m.by_referral_outcome["investigation_opened"]).toBe(1);
    expect(m.by_referral_urgency["within_24_hours"]).toBe(1);
    expect(m.by_concern_category["physical_abuse"]).toBe(1);
  });
});

// -- identifySafeguardingReferralAlerts ---------------------------------------

describe("identifySafeguardingReferralAlerts", () => {
  it("returns empty for empty array", () => {
    expect(identifySafeguardingReferralAlerts([])).toEqual([]);
  });

  it("fires critical alert for untimely immediate referral", () => {
    const records = [makeRecord({ referral_urgency: "immediate", referral_timely: false })];
    const alerts = identifySafeguardingReferralAlerts(records);
    const hit = alerts.find((a) => a.type === "untimely_immediate_referral");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("does NOT fire untimely alert for timely immediate referral", () => {
    const records = [makeRecord({ referral_urgency: "immediate", referral_timely: true })];
    const alerts = identifySafeguardingReferralAlerts(records);
    expect(alerts.find((a) => a.type === "untimely_immediate_referral")).toBeUndefined();
  });

  it("fires high alert for Ofsted not notified (>= 1)", () => {
    const records = [makeRecord({ ofsted_notified: false })];
    const alerts = identifySafeguardingReferralAlerts(records);
    const hit = alerts.find((a) => a.type === "ofsted_not_notified");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert for LADO not consulted (>= 1)", () => {
    const records = [makeRecord({ lado_consulted: false })];
    const alerts = identifySafeguardingReferralAlerts(records);
    const hit = alerts.find((a) => a.type === "lado_not_consulted");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires medium alert for information not shared (>= 2)", () => {
    const records = [
      makeRecord({ id: "1", information_shared_appropriately: false }),
      makeRecord({ id: "2", information_shared_appropriately: false }),
    ];
    const alerts = identifySafeguardingReferralAlerts(records);
    const hit = alerts.find((a) => a.type === "information_not_shared");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire information_not_shared for only 1 record", () => {
    const records = [makeRecord({ information_shared_appropriately: false })];
    const alerts = identifySafeguardingReferralAlerts(records);
    expect(alerts.find((a) => a.type === "information_not_shared")).toBeUndefined();
  });

  it("fires medium alert for outcome not communicated (>= 3)", () => {
    const records = [
      makeRecord({ id: "1", outcome_communicated: false }),
      makeRecord({ id: "2", outcome_communicated: false }),
      makeRecord({ id: "3", outcome_communicated: false }),
    ];
    const alerts = identifySafeguardingReferralAlerts(records);
    const hit = alerts.find((a) => a.type === "outcome_not_communicated");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire outcome_not_communicated for only 2 records", () => {
    const records = [
      makeRecord({ id: "1", outcome_communicated: false }),
      makeRecord({ id: "2", outcome_communicated: false }),
    ];
    const alerts = identifySafeguardingReferralAlerts(records);
    expect(alerts.find((a) => a.type === "outcome_not_communicated")).toBeUndefined();
  });
});
