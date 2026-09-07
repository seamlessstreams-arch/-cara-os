import { describe, it, expect } from "vitest";
import {
  computeVisitorMetrics,
  identifyVisitorAlerts,
  type VisitorRecord,
} from "./visitor-management-service";

// ── Factory ────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<VisitorRecord> = {}): VisitorRecord {
  return {
    id: "rec-1",
    home_id: "home-1",
    visitor_name: "Visitor A",
    visitor_type: "social_worker",
    visit_purpose: "professional_review",
    visit_date: "2025-01-15",
    arrival_time: "10:00",
    departure_time: "11:00",
    child_visited: "Child A",
    dbs_status: "enhanced_verified",
    id_verified: true,
    supervision_level: "supervised",
    safeguarding_check_completed: true,
    signed_in: true,
    signed_out: true,
    visit_approved_by: "Manager A",
    child_informed: true,
    child_consent_given: true,
    notes: overrides.notes ?? null,
    created_at: "2025-01-15T00:00:00Z",
    updated_at: "2025-01-15T00:00:00Z",
      ...overrides,
  };
}

// ── computeVisitorMetrics ──────────────────────────────────────────────

describe("computeVisitorMetrics", () => {
  it("returns zeroes for empty array", () => {
    const m = computeVisitorMetrics([]);
    expect(m.total_visits).toBe(0);
    expect(m.unique_visitors).toBe(0);
    expect(m.family_visits).toBe(0);
    expect(m.professional_visits).toBe(0);
    expect(m.dbs_verified_rate).toBeNull();;
    expect(m.id_verified_rate).toBeNull();;
    expect(m.safeguarding_check_rate).toBeNull();;
    expect(m.signed_in_rate).toBeNull();;
    expect(m.signed_out_rate).toBeNull();;
    expect(m.child_informed_rate).toBeNull();;
    expect(m.unsupervised_count).toBe(0);
    expect(m.dbs_expired_count).toBe(0);
    expect(m.dbs_not_checked_count).toBe(0);
  });

  it("counts family and professional visits correctly", () => {
    const records = [
      makeRecord({ visitor_type: "family_member" }),
      makeRecord({ visitor_type: "friend" }),
      makeRecord({ visitor_type: "social_worker" }),
      makeRecord({ visitor_type: "therapist" }),
      makeRecord({ visitor_type: "maintenance" }),
    ];
    const m = computeVisitorMetrics(records);
    expect(m.family_visits).toBe(2);
    expect(m.professional_visits).toBe(2);
  });

  it("computes DBS verified rate from enhanced and standard", () => {
    const records = [
      makeRecord({ dbs_status: "enhanced_verified" }),
      makeRecord({ dbs_status: "standard_verified" }),
      makeRecord({ dbs_status: "expired" }),
      makeRecord({ dbs_status: "not_checked" }),
    ];
    const m = computeVisitorMetrics(records);
    expect(m.dbs_verified_rate).toBe(50);
    expect(m.dbs_expired_count).toBe(1);
    expect(m.dbs_not_checked_count).toBe(1);
  });

  it("counts unique visitors by name", () => {
    const records = [
      makeRecord({ visitor_name: "Alice" }),
      makeRecord({ visitor_name: "Alice" }),
      makeRecord({ visitor_name: "Bob" }),
    ];
    const m = computeVisitorMetrics(records);
    expect(m.unique_visitors).toBe(2);
  });

  it("computes boolean rates for id, safeguarding, sign-in, sign-out", () => {
    const records = [
      makeRecord({ id_verified: true, safeguarding_check_completed: true, signed_in: true, signed_out: true }),
      makeRecord({ id_verified: false, safeguarding_check_completed: false, signed_in: false, signed_out: false }),
    ];
    const m = computeVisitorMetrics(records);
    expect(m.id_verified_rate).toBe(50);
    expect(m.safeguarding_check_rate).toBe(50);
    expect(m.signed_in_rate).toBe(50);
    expect(m.signed_out_rate).toBe(50);
  });
});

// ── identifyVisitorAlerts ──────────────────────────────────────────────

describe("identifyVisitorAlerts", () => {
  it("returns empty array for empty input", () => {
    expect(identifyVisitorAlerts([])).toEqual([]);
  });

  it("fires critical alert for unsupervised with expired DBS", () => {
    const records = [
      makeRecord({ supervision_level: "unsupervised", dbs_status: "expired" }),
    ];
    const alerts = identifyVisitorAlerts(records);
    const match = alerts.find((a) => a.type === "unsupervised_no_dbs");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires critical alert for unsupervised with not_checked DBS", () => {
    const records = [
      makeRecord({ supervision_level: "unsupervised", dbs_status: "not_checked" }),
    ];
    const alerts = identifyVisitorAlerts(records);
    const match = alerts.find((a) => a.type === "unsupervised_no_dbs");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("critical");
  });

  it("fires high alert for not signed out (>= 1)", () => {
    const records = [makeRecord({ signed_in: true, signed_out: false })];
    const alerts = identifyVisitorAlerts(records);
    const match = alerts.find((a) => a.type === "not_signed_out");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("fires high alert for safeguarding check not completed (>= 2, not restricted)", () => {
    const records = [
      makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
      makeRecord({ safeguarding_check_completed: false, supervision_level: "supervised" }),
    ];
    const alerts = identifyVisitorAlerts(records);
    const match = alerts.find((a) => a.type === "no_safeguarding_check");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("high");
  });

  it("does NOT fire safeguarding check alert for restricted_area_only", () => {
    const records = [
      makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
      makeRecord({ safeguarding_check_completed: false, supervision_level: "restricted_area_only" }),
    ];
    const alerts = identifyVisitorAlerts(records);
    expect(alerts.find((a) => a.type === "no_safeguarding_check")).toBeUndefined();
  });

  it("fires medium alert for child not informed (>= 2 with child_visited)", () => {
    const records = [
      makeRecord({ child_informed: false, child_visited: "Child A" }),
      makeRecord({ child_informed: false, child_visited: "Child B" }),
    ];
    const alerts = identifyVisitorAlerts(records);
    const match = alerts.find((a) => a.type === "child_not_informed");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });

  it("fires medium alert for expired DBS (>= 1)", () => {
    const records = [makeRecord({ dbs_status: "expired" })];
    const alerts = identifyVisitorAlerts(records);
    const match = alerts.find((a) => a.type === "dbs_expired");
    expect(match).toBeDefined();
    expect(match!.severity).toBe("medium");
  });
});
