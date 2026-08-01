import { describe, it, expect } from "vitest";
import {
  computeWhistleblowingMetrics,
  identifyWhistleblowingAlerts,
  type WhistleblowingReport,
  type WhistleblowingPolicyReview,
} from "./whistleblowing-service";

// ── Factories ──────────────────────────────────────────────────────────

function makeReport(overrides: Partial<WhistleblowingReport> = {}): WhistleblowingReport {
  return {
    id: overrides.id ?? "report-1",
    home_id: overrides.home_id ?? "home-1",
    reporter_id: overrides.reporter_id ?? "user-1",
    reporter_name: overrides.reporter_name ?? "Reporter A",
    reporter_role: overrides.reporter_role ?? "Staff",
    is_anonymous: overrides.is_anonymous ?? false,
    disclosure_date: overrides.disclosure_date ?? "2025-01-15",
    received_by: overrides.received_by ?? "Manager A",
    category: overrides.category ?? "safeguarding_concern",
    description: overrides.description ?? "Test disclosure",
    persons_involved: overrides.persons_involved ?? [],
    evidence_provided: overrides.evidence_provided ?? null,
    location: overrides.location ?? null,
    risk_level: overrides.risk_level ?? "medium",
    status: overrides.status ?? "received",
    acknowledged_date: overrides.acknowledged_date ?? null,
    acknowledged_by: overrides.acknowledged_by ?? null,
    investigating_officer: overrides.investigating_officer ?? null,
    investigation_start_date: overrides.investigation_start_date ?? null,
    investigation_end_date: overrides.investigation_end_date ?? null,
    outcome: overrides.outcome ?? null,
    outcome_details: overrides.outcome_details ?? null,
    actions_taken: overrides.actions_taken ?? [],
    referred_to: overrides.referred_to ?? null,
    referral_date: overrides.referral_date ?? null,
    referral_reference: overrides.referral_reference ?? null,
    whistleblower_protected: overrides.whistleblower_protected ?? true,
    detriment_reported: overrides.detriment_reported ?? false,
    detriment_details: overrides.detriment_details ?? null,
    follow_up_date: overrides.follow_up_date ?? null,
    follow_up_completed: overrides.follow_up_completed ?? false,
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
    updated_at: overrides.updated_at ?? "2025-01-15T00:00:00Z",
  };
}

function makePolicyReview(overrides: Partial<WhistleblowingPolicyReview> = {}): WhistleblowingPolicyReview {
  return {
    id: overrides.id ?? "review-1",
    home_id: overrides.home_id ?? "home-1",
    review_date: overrides.review_date ?? "2025-01-15",
    reviewed_by: overrides.reviewed_by ?? "Manager A",
    policy_accessible: overrides.policy_accessible ?? true,
    policy_displayed: overrides.policy_displayed ?? true,
    staff_trained_count: overrides.staff_trained_count ?? 10,
    total_staff_count: overrides.total_staff_count ?? 10,
    external_contacts_displayed: overrides.external_contacts_displayed ?? true,
    children_informed: overrides.children_informed ?? true,
    review_notes: overrides.review_notes ?? null,
    next_review_date: overrides.next_review_date ?? null,
    created_at: overrides.created_at ?? "2025-01-15T00:00:00Z",
    updated_at: overrides.updated_at ?? "2025-01-15T00:00:00Z",
  };
}

// ── computeWhistleblowingMetrics ───────────────────────────────────────

describe("computeWhistleblowingMetrics", () => {
  it("returns zeroes for empty inputs", () => {
    const m = computeWhistleblowingMetrics([], []);
    expect(m.total_reports).toBe(0);
    expect(m.open_reports).toBe(0);
    expect(m.avg_resolution_days).toBeNull();;
    expect(m.external_referrals_count).toBe(0);
    expect(m.detriment_reported_count).toBe(0);
    expect(m.policy_compliance_rate).toBeNull();;
    expect(m.staff_training_rate).toBe(0);
  });

  it("counts open reports from received/acknowledged/under_investigation/referred_externally", () => {
    const reports = [
      makeReport({ status: "received" }),
      makeReport({ status: "acknowledged" }),
      makeReport({ status: "under_investigation" }),
      makeReport({ status: "referred_externally" }),
      makeReport({ status: "resolved" }),
      makeReport({ status: "closed" }),
    ];
    const m = computeWhistleblowingMetrics(reports, []);
    expect(m.open_reports).toBe(4);
    expect(m.total_reports).toBe(6);
  });

  it("computes average resolution days for resolved/closed with investigation dates", () => {
    const reports = [
      makeReport({
        status: "resolved",
        investigation_start_date: "2025-01-01",
        investigation_end_date: "2025-01-11",
      }),
      makeReport({
        status: "closed",
        investigation_start_date: "2025-01-01",
        investigation_end_date: "2025-01-21",
      }),
    ];
    const m = computeWhistleblowingMetrics(reports, []);
    expect(m.avg_resolution_days).toBe(15);
  });

  it("counts external referrals (not none)", () => {
    const reports = [
      makeReport({ referred_to: "ofsted" }),
      makeReport({ referred_to: "lado" }),
      makeReport({ referred_to: "none" }),
      makeReport({ referred_to: null }),
    ];
    const m = computeWhistleblowingMetrics(reports, []);
    expect(m.external_referrals_count).toBe(2);
  });

  it("computes policy compliance rate from accessible AND displayed", () => {
    const reviews = [
      makePolicyReview({ policy_accessible: true, policy_displayed: true }),
      makePolicyReview({ policy_accessible: true, policy_displayed: false }),
    ];
    const m = computeWhistleblowingMetrics([], reviews);
    expect(m.policy_compliance_rate).toBe(50);
  });

  it("computes staff training rate from most recent review", () => {
    const reviews = [
      makePolicyReview({ review_date: "2025-01-01", staff_trained_count: 5, total_staff_count: 10 }),
      makePolicyReview({ review_date: "2025-06-01", staff_trained_count: 8, total_staff_count: 10 }),
    ];
    const m = computeWhistleblowingMetrics([], reviews);
    expect(m.staff_training_rate).toBe(80);
  });
});

// ── identifyWhistleblowingAlerts ───────────────────────────────────────

describe("identifyWhistleblowingAlerts", () => {
  it("fires high alert when no policy reviews exist", () => {
    const alerts = identifyWhistleblowingAlerts([], []);
    const match = alerts.find((a) => a.type === "no_policy_review");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires critical alert for unacknowledged disclosure > 48 hours", () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const reports = [
      makeReport({ status: "received", acknowledged_date: null, disclosure_date: threeDaysAgo }),
    ];
    const alerts = identifyWhistleblowingAlerts(reports, [makePolicyReview()]);
    const match = alerts.find((a) => a.type === "unacknowledged_disclosure");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for high-risk open > 7 days", () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const reports = [
      makeReport({ risk_level: "high", status: "under_investigation", disclosure_date: tenDaysAgo }),
    ];
    const alerts = identifyWhistleblowingAlerts(reports, [makePolicyReview()]);
    const match = alerts.find((a) => a.type === "high_risk_open");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires critical alert for detriment reported on non-closed case", () => {
    const reports = [
      makeReport({ detriment_reported: true, status: "under_investigation" }),
    ];
    const alerts = identifyWhistleblowingAlerts(reports, [makePolicyReview()]);
    const match = alerts.find((a) => a.type === "detriment_reported");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("does NOT fire detriment alert for closed case", () => {
    const reports = [
      makeReport({ detriment_reported: true, status: "closed" }),
    ];
    const alerts = identifyWhistleblowingAlerts(reports, [makePolicyReview()]);
    expect(alerts.find((a) => a.type === "detriment_reported")).toBeUndefined();
  });

  it("fires high alert for follow-up overdue", () => {
    const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const reports = [
      makeReport({ follow_up_date: pastDate, follow_up_completed: false }),
    ];
    const alerts = identifyWhistleblowingAlerts(reports, [makePolicyReview()]);
    const match = alerts.find((a) => a.type === "follow_up_overdue");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for staff training below 90%", () => {
    const reviews = [
      makePolicyReview({ staff_trained_count: 7, total_staff_count: 10 }),
    ];
    const alerts = identifyWhistleblowingAlerts([], reviews);
    const match = alerts.find((a) => a.type === "staff_training_low");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires high alert for external contacts not displayed", () => {
    const reviews = [
      makePolicyReview({ external_contacts_displayed: false }),
    ];
    const alerts = identifyWhistleblowingAlerts([], reviews);
    const match = alerts.find((a) => a.type === "external_contacts_not_displayed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires medium alert for investigation running > 30 days", () => {
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const reports = [
      makeReport({
        status: "under_investigation",
        investigation_start_date: fortyDaysAgo,
        investigation_end_date: null,
      }),
    ];
    const alerts = identifyWhistleblowingAlerts(reports, [makePolicyReview()]);
    const match = alerts.find((a) => a.type === "investigation_prolonged");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
