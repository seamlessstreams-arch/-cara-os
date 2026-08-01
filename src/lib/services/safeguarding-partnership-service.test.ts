import { describe, it, expect } from "vitest";
import {
  computeSafeguardingPartnershipMetrics,
  computeSafeguardingPartnershipAlerts,
} from "./safeguarding-partnership-service";
import type { SafeguardingPartnershipRow } from "./safeguarding-partnership-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<SafeguardingPartnershipRow> = {}): SafeguardingPartnershipRow {
  return {
    id: "sp-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: null,
    referral_date: "2026-05-10",
    referral_type: "mash_referral",
    referral_outcome: "no_further_action",
    partner_agency: "social_services",
    urgency_level: "routine",
    lead_professional: null,
    strategy_discussion_held: true,
    child_seen_alone: true,
    child_views_recorded: true,
    home_contributed_to_assessment: true,
    outcome_shared_with_home: true,
    follow_up_actions_agreed: true,
    next_review_date: null,
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeSafeguardingPartnershipMetrics ------------------------------------

describe("computeSafeguardingPartnershipMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSafeguardingPartnershipMetrics([]);
    expect(m.total_referrals).toBe(0);
    expect(m.substantiated_count).toBe(0);
    expect(m.ongoing_count).toBe(0);
    expect(m.emergency_count).toBe(0);
    expect(m.escalated_count).toBe(0);
    expect(m.child_seen_alone_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts outcomes correctly", () => {
    const rows = [
      makeRow({ id: "1", referral_outcome: "substantiated" }),
      makeRow({ id: "2", referral_outcome: "ongoing_investigation" }),
      makeRow({ id: "3", referral_outcome: "escalated" }),
    ];
    const m = computeSafeguardingPartnershipMetrics(rows);
    expect(m.substantiated_count).toBe(1);
    expect(m.ongoing_count).toBe(1);
    expect(m.escalated_count).toBe(1);
  });

  it("counts emergency and immediate_risk urgency", () => {
    const rows = [
      makeRow({ id: "1", urgency_level: "emergency" }),
      makeRow({ id: "2", urgency_level: "immediate_risk" }),
      makeRow({ id: "3", urgency_level: "routine" }),
    ];
    const m = computeSafeguardingPartnershipMetrics(rows);
    expect(m.emergency_count).toBe(2);
  });

  it("computes boolean rates as percentages", () => {
    const rows = [
      makeRow({ id: "1", child_seen_alone: true }),
      makeRow({ id: "2", child_seen_alone: false }),
    ];
    const m = computeSafeguardingPartnershipMetrics(rows);
    expect(m.child_seen_alone_rate).toBe(50);
  });

  it("counts unique children", () => {
    const rows = [
      makeRow({ id: "1", child_name: "Alex" }),
      makeRow({ id: "2", child_name: "Beth" }),
      makeRow({ id: "3", child_name: "Alex" }),
    ];
    const m = computeSafeguardingPartnershipMetrics(rows);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdowns", () => {
    const rows = [makeRow({ referral_type: "section_47_enquiry", referral_outcome: "substantiated" })];
    const m = computeSafeguardingPartnershipMetrics(rows);
    expect(m.referral_type_breakdown["section_47_enquiry"]).toBe(1);
    expect(m.outcome_breakdown["substantiated"]).toBe(1);
  });
});

// -- computeSafeguardingPartnershipAlerts -------------------------------------

describe("computeSafeguardingPartnershipAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeSafeguardingPartnershipAlerts([])).toEqual([]);
  });

  it("fires critical alert for emergency child not seen alone", () => {
    const rows = [makeRow({ urgency_level: "emergency", child_seen_alone: false })];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const hit = alerts.find((a) => a.type === "emergency_child_not_seen_alone");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires critical alert for immediate_risk child not seen alone", () => {
    const rows = [makeRow({ urgency_level: "immediate_risk", child_seen_alone: false })];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const hit = alerts.find((a) => a.type === "emergency_child_not_seen_alone");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("critical");
  });

  it("fires high alert for substantiated outcome not shared (1 record)", () => {
    const rows = [makeRow({ referral_outcome: "substantiated", outcome_shared_with_home: false })];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const hit = alerts.find((a) => a.type === "substantiated_outcome_not_shared");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("fires high alert for child views not recorded (>= 2)", () => {
    const rows = [
      makeRow({ id: "1", child_views_recorded: false }),
      makeRow({ id: "2", child_views_recorded: false }),
    ];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const hit = alerts.find((a) => a.type === "child_views_not_recorded");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("high");
  });

  it("does NOT fire child_views alert for only 1 record", () => {
    const rows = [makeRow({ child_views_recorded: false })];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    expect(alerts.find((a) => a.type === "child_views_not_recorded")).toBeUndefined();
  });

  it("fires medium alert for follow-up not agreed (>= 2)", () => {
    const rows = [
      makeRow({ id: "1", follow_up_actions_agreed: false }),
      makeRow({ id: "2", follow_up_actions_agreed: false }),
    ];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    const hit = alerts.find((a) => a.type === "follow_up_not_agreed");
    expect(hit).toBeDefined();
    expect(hit!.severity).toBe("medium");
  });

  it("does NOT fire follow_up_not_agreed for only 1 record", () => {
    const rows = [makeRow({ follow_up_actions_agreed: false })];
    const alerts = computeSafeguardingPartnershipAlerts(rows);
    expect(alerts.find((a) => a.type === "follow_up_not_agreed")).toBeUndefined();
  });
});
