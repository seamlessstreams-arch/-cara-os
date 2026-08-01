import { describe, it, expect } from "vitest";
import {
  computeDelegatedAuthorityMetrics,
  identifyDelegatedAuthorityAlerts,
  DelegatedAuthority,
} from "./delegated-authority-service";

function makeRecord(overrides: Partial<DelegatedAuthority> = {}): DelegatedAuthority {
  return {
    id: "da-1",
    home_id: "home-1",
    child_name: "Alice",
    child_id: "child-1",
    decision_area: "sleepovers",
    authority_level: "home_staff",
    agreement_status: "agreed",
    agreed_by: "Social Worker",
    agreed_date: "2026-01-15",
    review_date: null,
    specific_conditions: null,
    child_views_sought: true,
    child_agrees: true,
    social_worker_approved: true,
    documented_in_care_plan: true,
    notes: null,
    created_at: "2026-01-15T09:00:00Z",
    updated_at: "2026-01-15T09:00:00Z",
    ...overrides,
  };
}

// ── computeDelegatedAuthorityMetrics ───────────────────────────────────

describe("computeDelegatedAuthorityMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeDelegatedAuthorityMetrics([], 4);
    expect(m.total_records).toBe(0);
    expect(m.children_covered).toBe(0);
    expect(m.coverage_rate).toBe(0);
    expect(m.agreed_count).toBe(0);
    expect(m.child_views_sought_rate).toBeNull();; expect(m.average_per_child).toBeNull();; });

  it("calculates correct metrics for populated data", () => {
    const records = [
      makeRecord({ child_id: "child-1", agreement_status: "agreed", child_views_sought: true, social_worker_approved: true, documented_in_care_plan: true }),
      makeRecord({ id: "da-2", child_id: "child-2", child_name: "Bob", agreement_status: "pending", child_views_sought: false, social_worker_approved: false, documented_in_care_plan: false }),
      makeRecord({ id: "da-3", child_id: "child-1", agreement_status: "disputed" }),
    ];
    const m = computeDelegatedAuthorityMetrics(records, 4);
    expect(m.total_records).toBe(3);
    expect(m.children_covered).toBe(2);
    expect(m.coverage_rate).toBe(50);
    expect(m.agreed_count).toBe(1);
    expect(m.pending_count).toBe(1);
    expect(m.disputed_count).toBe(1);
    expect(m.child_views_sought_rate).toBe(66.7);
    expect(m.average_per_child).toBe(1.5);
  });

  it("counts authority levels correctly", () => {
    const records = [
      makeRecord({ authority_level: "home_staff" }),
      makeRecord({ id: "da-2", authority_level: "local_authority" }),
      makeRecord({ id: "da-3", authority_level: "not_delegated" }),
    ];
    const m = computeDelegatedAuthorityMetrics(records, 4);
    expect(m.decisions_by_home_staff).toBe(1);
    expect(m.decisions_needing_escalation).toBe(1);
    expect(m.not_delegated_count).toBe(1);
  });
});

// ── identifyDelegatedAuthorityAlerts ──────────────────────────────────

describe("identifyDelegatedAuthorityAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyDelegatedAuthorityAlerts([], 0);
    expect(alerts).toEqual([]);
  });

  it("alerts high when children have no delegation records", () => {
    const records = [makeRecord({ child_id: "child-1" })];
    const alerts = identifyDelegatedAuthorityAlerts(records, 3);
    const gap = alerts.find((a) => a.type === "no_delegation");
    expect(gap).toBeDefined();
    expect(gap!.severity).toBe("high");
    expect(gap!.message).toContain("2 children have");
  });

  it("alerts high for each disputed authority", () => {
    const records = [
      makeRecord({ agreement_status: "disputed", decision_area: "sleepovers", child_name: "Alice" }),
    ];
    const alerts = identifyDelegatedAuthorityAlerts(records, 1);
    const disputed = alerts.find((a) => a.type === "disputed_authority");
    expect(disputed).toBeDefined();
    expect(disputed!.severity).toBe("high");
  });

  it("alerts medium for >=3 decisions without child views sought", () => {
    const records = [
      makeRecord({ child_views_sought: false }),
      makeRecord({ id: "da-2", child_views_sought: false }),
      makeRecord({ id: "da-3", child_views_sought: false }),
    ];
    const alerts = identifyDelegatedAuthorityAlerts(records, 1);
    expect(alerts.find((a) => a.type === "child_views_missing")).toBeDefined();
  });

  it("alerts high for >=2 expired agreements", () => {
    const records = [
      makeRecord({ agreement_status: "expired" }),
      makeRecord({ id: "da-2", agreement_status: "expired" }),
    ];
    const alerts = identifyDelegatedAuthorityAlerts(records, 1);
    const expired = alerts.find((a) => a.type === "expired_agreements");
    expect(expired).toBeDefined();
    expect(expired!.severity).toBe("high");
  });

  it("alerts medium for >=2 agreed decisions not documented in care plan", () => {
    const records = [
      makeRecord({ agreement_status: "agreed", documented_in_care_plan: false }),
      makeRecord({ id: "da-2", agreement_status: "agreed", documented_in_care_plan: false }),
    ];
    const alerts = identifyDelegatedAuthorityAlerts(records, 1);
    expect(alerts.find((a) => a.type === "not_documented")).toBeDefined();
  });
});
