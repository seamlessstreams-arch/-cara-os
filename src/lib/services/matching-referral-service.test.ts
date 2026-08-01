import { describe, it, expect } from "vitest";
import {
  computeReferralMetrics,
  identifyReferralAlerts,
  type Referral,
} from "./matching-referral-service";

function makeReferral(
  overrides: Partial<Referral> = {},
): Referral {
  return {
    id: "ref-1",
    home_id: "home-1",
    child_name: "Child A",
    child_age: 12,
    placing_authority: "LA North",
    social_worker_name: "SW Jones",
    referral_date: "2026-05-01",
    status: "under_assessment",
    decline_reason: null,
    matching_criteria_met: ["age_range", "gender"],
    matching_criteria_concerns: [],
    impact_on_existing: "neutral",
    impact_assessment_completed: true,
    existing_children_consulted: true,
    staff_views_sought: true,
    trial_visit_completed: false,
    decision_date: null,
    decision_by: null,
    admission_date: null,
    notes: null,
    created_at: "2026-05-01T10:00:00Z",
    updated_at: "2026-05-01T10:00:00Z",
    ...overrides,
  };
}

describe("computeReferralMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeReferralMetrics([]);
    expect(m.total_referrals).toBe(0);
    expect(m.acceptance_rate).toBeNull();;
    expect(m.impact_assessment_rate).toBeNull();;
  });

  it("computes correct counts for populated data", () => {
    const referrals = [
      makeReferral({ id: "1", status: "accepted", placing_authority: "LA North" }),
      makeReferral({ id: "2", status: "declined", decline_reason: "no_vacancy", placing_authority: "LA South" }),
      makeReferral({ id: "3", status: "admitted", placing_authority: "LA North" }),
      makeReferral({ id: "4", status: "received", placing_authority: "LA East" }),
      makeReferral({ id: "5", status: "withdrawn", placing_authority: "LA West" }),
    ];
    const m = computeReferralMetrics(referrals);
    expect(m.total_referrals).toBe(5);
    expect(m.received_count).toBe(1);
    expect(m.accepted_count).toBe(2); // accepted + admitted
    expect(m.declined_count).toBe(1);
    expect(m.withdrawn_count).toBe(1);
    expect(m.admitted_count).toBe(1);
    // acceptance_rate: accepted(2) / (accepted(2) + declined(1)) = 66.7%
    expect(m.acceptance_rate).toBe(66.7);
    expect(m.by_status["accepted"]).toBe(1);
    expect(m.by_status["admitted"]).toBe(1);
    expect(m.by_decline_reason["no_vacancy"]).toBe(1);
    expect(m.by_placing_authority["LA North"]).toBe(2);
  });

  it("computes matching concerns count", () => {
    const referrals = [
      makeReferral({ id: "1", matching_criteria_concerns: ["peer_dynamics"] }),
      makeReferral({ id: "2", matching_criteria_concerns: [] }),
    ];
    const m = computeReferralMetrics(referrals);
    expect(m.matching_concerns_count).toBe(1);
  });
});

describe("identifyReferralAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyReferralAlerts([])).toHaveLength(0);
  });

  it("triggers no_impact_assessment (critical) when accepted/admitted without impact assessment", () => {
    const referrals = [
      makeReferral({ id: "a1", status: "accepted", impact_assessment_completed: false }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    const a = alerts.find((x) => x.type === "no_impact_assessment");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("critical");
  });

  it("triggers significant_concern_accepted (high) when admitted with significant_concern impact", () => {
    const referrals = [
      makeReferral({ id: "a2", status: "admitted", impact_on_existing: "significant_concern" }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    const a = alerts.find((x) => x.type === "significant_concern_accepted");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("triggers referral_pending (medium) for status=received", () => {
    const referrals = [
      makeReferral({ id: "a3", status: "received" }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    const a = alerts.find((x) => x.type === "referral_pending");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("triggers matching_concerns (high) when matching_criteria_concerns not empty and not declined", () => {
    const referrals = [
      makeReferral({ id: "a4", matching_criteria_concerns: ["peer_dynamics", "risk_compatibility"], status: "under_assessment" }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    const a = alerts.find((x) => x.type === "matching_concerns");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("high");
  });

  it("does NOT trigger matching_concerns when status is declined", () => {
    const referrals = [
      makeReferral({ id: "a5", matching_criteria_concerns: ["peer_dynamics"], status: "declined" }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    expect(alerts.find((x) => x.type === "matching_concerns")).toBeUndefined();
  });

  it("triggers children_not_consulted (medium) when accepted but existing children not consulted", () => {
    const referrals = [
      makeReferral({ id: "a6", status: "accepted", existing_children_consulted: false }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    const a = alerts.find((x) => x.type === "children_not_consulted");
    expect(a).toBeDefined();
    expect(a!.severity).toBe("medium");
  });

  it("does NOT trigger children_not_consulted for non-accepted statuses", () => {
    const referrals = [
      makeReferral({ id: "a7", status: "under_assessment", existing_children_consulted: false }),
    ];
    const alerts = identifyReferralAlerts(referrals);
    expect(alerts.find((x) => x.type === "children_not_consulted")).toBeUndefined();
  });
});
