import { describe, it, expect } from "vitest";
import {
  computeSafeguardingCompliance,
  isReferralOverdue,
  computeChildSafeguardingProfile,
  computeSafeguardingTimeline,
} from "./safeguarding-service";
import type { SafeguardingReferral } from "./safeguarding-service";

// -- Factory ------------------------------------------------------------------

function makeReferral(overrides: Partial<SafeguardingReferral> = {}): SafeguardingReferral {
  return {
    id: "sg-1",
    home_id: "home-1",
    child_id: "child-1",
    referral_type: "mash",
    urgency: "routine",
    title: "Welfare concern",
    description: "General welfare concern",
    referred_to: "Social Services",
    referred_by: "Staff A",
    referral_date: "2026-05-10T00:00:00Z",
    acknowledged_date: "2026-05-11T00:00:00Z",
    outcome: null,
    outcome_date: null,
    status: "acknowledged",
    follow_up_actions: [],
    multi_agency_involved: [],
    ofsted_notified: true,
    ofsted_notification_date: null,
    reg40_notification_sent: true,
    linked_incident_id: null,
    linked_risk_assessment_id: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

// -- computeSafeguardingCompliance -------------------------------------------

describe("computeSafeguardingCompliance", () => {
  it("returns zeroes for empty array", () => {
    const m = computeSafeguardingCompliance([], NOW);
    expect(m.total_referrals).toBe(0);
    expect(m.pending).toBe(0);
    expect(m.overdue_acknowledgement).toBe(0);
    expect(m.notification_compliance_percentage).toBe(100);
    expect(m.average_resolution_days).toBeNull();;
  });

  it("counts pending referrals", () => {
    const referrals = [
      makeReferral({ id: "1", status: "pending" }),
      makeReferral({ id: "2", status: "acknowledged" }),
    ];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.pending).toBe(1);
  });

  it("counts overdue acknowledgements (submitted > 5 days ago, no ack)", () => {
    const referrals = [
      makeReferral({
        id: "1",
        status: "submitted",
        acknowledged_date: null,
        referral_date: "2026-05-01T00:00:00Z", // > 5 days before NOW
      }),
    ];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.overdue_acknowledgement).toBe(1);
  });

  it("does NOT count recently submitted as overdue", () => {
    const referrals = [
      makeReferral({
        id: "1",
        status: "submitted",
        acknowledged_date: null,
        referral_date: "2026-05-20T00:00:00Z", // 1 day ago
      }),
    ];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.overdue_acknowledgement).toBe(0);
  });

  it("computes Ofsted notification compliance", () => {
    // mash type has notification_required=true
    const referrals = [
      makeReferral({ id: "1", referral_type: "mash", ofsted_notified: true }),
      makeReferral({ id: "2", referral_type: "mash", ofsted_notified: false }),
    ];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.ofsted_notifications_required).toBe(2);
    expect(m.ofsted_notifications_sent).toBe(1);
    expect(m.notification_compliance_percentage).toBe(50);
  });

  it("returns 100% compliance when no notifications required", () => {
    // professional_consultation has notification_required=false
    const referrals = [
      makeReferral({ id: "1", referral_type: "professional_consultation", ofsted_notified: false }),
    ];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.ofsted_notifications_required).toBe(0);
    expect(m.notification_compliance_percentage).toBe(100);
  });

  it("computes average resolution days for closed referrals", () => {
    const referrals = [
      makeReferral({
        id: "1",
        status: "closed",
        referral_date: "2026-05-01T00:00:00Z",
        outcome: "NFA",
        outcome_date: "2026-05-11T00:00:00Z", // 10 days
      }),
      makeReferral({
        id: "2",
        status: "closed",
        referral_date: "2026-05-01T00:00:00Z",
        outcome: "NFA",
        outcome_date: "2026-05-21T00:00:00Z", // 20 days
      }),
    ];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.average_resolution_days).toBe(15);
  });

  it("populates by_type and by_status breakdowns", () => {
    const referrals = [makeReferral({ referral_type: "lado", status: "investigating" })];
    const m = computeSafeguardingCompliance(referrals, NOW);
    expect(m.by_type["lado"]).toBe(1);
    expect(m.by_status["investigating"]).toBe(1);
  });
});

// -- isReferralOverdue --------------------------------------------------------

describe("isReferralOverdue", () => {
  it("returns true for pending referral past urgency timeframe", () => {
    // immediate = 1 hour max
    const r = makeReferral({
      status: "pending",
      urgency: "immediate",
      referral_date: "2026-05-21T08:00:00Z",
    });
    const now = new Date("2026-05-21T10:00:00Z"); // 2 hours later
    expect(isReferralOverdue(r, now)).toBe(true);
  });

  it("returns false for pending referral within urgency timeframe", () => {
    const r = makeReferral({
      status: "pending",
      urgency: "within_24h",
      referral_date: "2026-05-21T08:00:00Z",
    });
    const now = new Date("2026-05-21T10:00:00Z"); // only 2 hours
    expect(isReferralOverdue(r, now)).toBe(false);
  });

  it("returns true for submitted referral > 5 days without acknowledgement", () => {
    const r = makeReferral({
      status: "submitted",
      acknowledged_date: null,
      referral_date: "2026-05-01T00:00:00Z",
    });
    expect(isReferralOverdue(r, NOW)).toBe(true);
  });

  it("returns false for acknowledged referral", () => {
    const r = makeReferral({
      status: "acknowledged",
      acknowledged_date: "2026-05-11T00:00:00Z",
    });
    expect(isReferralOverdue(r, NOW)).toBe(false);
  });

  it("returns false for closed referral", () => {
    const r = makeReferral({ status: "closed" });
    expect(isReferralOverdue(r, NOW)).toBe(false);
  });
});

// -- computeChildSafeguardingProfile ------------------------------------------

describe("computeChildSafeguardingProfile", () => {
  it("returns defaults for empty array", () => {
    const p = computeChildSafeguardingProfile([]);
    expect(p.child_id).toBe("");
    expect(p.total_referrals).toBe(0);
    expect(p.active_referrals).toBe(0);
    expect(p.on_child_protection_plan).toBe(false);
    expect(p.risk_indicator).toBe("low");
  });

  it("counts active referrals (pending/submitted/acknowledged/investigating/escalated)", () => {
    const referrals = [
      makeReferral({ id: "1", status: "pending" }),
      makeReferral({ id: "2", status: "investigating" }),
      makeReferral({ id: "3", status: "closed" }),
    ];
    const p = computeChildSafeguardingProfile(referrals);
    expect(p.active_referrals).toBe(2);
  });

  it("detects on_child_protection_plan for active section_47", () => {
    const referrals = [
      makeReferral({ referral_type: "section_47", status: "investigating" }),
    ];
    const p = computeChildSafeguardingProfile(referrals);
    expect(p.on_child_protection_plan).toBe(true);
    expect(p.risk_indicator).toBe("critical");
  });

  it("returns critical risk for immediate urgency active referral", () => {
    const referrals = [
      makeReferral({ urgency: "immediate", status: "pending" }),
    ];
    const p = computeChildSafeguardingProfile(referrals);
    expect(p.risk_indicator).toBe("critical");
  });

  it("returns high risk for within_24h urgency active referral", () => {
    const referrals = [
      makeReferral({ urgency: "within_24h", status: "submitted" }),
    ];
    const p = computeChildSafeguardingProfile(referrals);
    expect(p.risk_indicator).toBe("high");
  });

  it("returns medium risk for single active routine referral", () => {
    const referrals = [
      makeReferral({ urgency: "routine", status: "acknowledged" }),
    ];
    const p = computeChildSafeguardingProfile(referrals);
    expect(p.risk_indicator).toBe("medium");
  });

  it("returns low risk when all referrals are closed", () => {
    const referrals = [
      makeReferral({ status: "closed" }),
    ];
    const p = computeChildSafeguardingProfile(referrals);
    expect(p.risk_indicator).toBe("low");
  });
});

// -- computeSafeguardingTimeline ----------------------------------------------

describe("computeSafeguardingTimeline", () => {
  it("returns empty for empty array", () => {
    expect(computeSafeguardingTimeline([])).toEqual([]);
  });

  it("creates initiation event for each referral", () => {
    const referrals = [makeReferral({ referral_type: "mash", acknowledged_date: null, outcome: null, outcome_date: null })];
    const timeline = computeSafeguardingTimeline(referrals);
    expect(timeline).toHaveLength(1);
    expect(timeline[0].event).toContain("initiated");
  });

  it("includes acknowledged event when present", () => {
    const referrals = [makeReferral({ acknowledged_date: "2026-05-11T00:00:00Z" })];
    const timeline = computeSafeguardingTimeline(referrals);
    const ackEvents = timeline.filter((e) => e.event.includes("acknowledged"));
    expect(ackEvents).toHaveLength(1);
  });

  it("includes outcome event when both outcome and outcome_date present", () => {
    const referrals = [makeReferral({ outcome: "NFA", outcome_date: "2026-05-15T00:00:00Z" })];
    const timeline = computeSafeguardingTimeline(referrals);
    const outcomeEvents = timeline.filter((e) => e.event.includes("outcome"));
    expect(outcomeEvents).toHaveLength(1);
    expect(outcomeEvents[0].outcome).toBe("NFA");
  });

  it("sorts events chronologically", () => {
    const referrals = [
      makeReferral({
        referral_date: "2026-05-10T00:00:00Z",
        acknowledged_date: "2026-05-12T00:00:00Z",
        outcome: "NFA",
        outcome_date: "2026-05-15T00:00:00Z",
      }),
    ];
    const timeline = computeSafeguardingTimeline(referrals);
    expect(timeline).toHaveLength(3);
    expect(new Date(timeline[0].date).getTime()).toBeLessThanOrEqual(new Date(timeline[1].date).getTime());
    expect(new Date(timeline[1].date).getTime()).toBeLessThanOrEqual(new Date(timeline[2].date).getTime());
  });
});
