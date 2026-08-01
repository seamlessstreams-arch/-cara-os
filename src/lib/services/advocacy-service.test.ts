import { describe, it, expect } from "vitest";
import { computeAdvocacyMetrics, identifyAdvocacyAlerts } from "./advocacy-service";
import type { AdvocacyReferral, ChildrensRightsRecord } from "./advocacy-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeReferral(overrides: Partial<AdvocacyReferral> = {}): AdvocacyReferral {
  return {
    id: "ref-1", home_id: "home-1", child_id: "child-1", child_name: "Alex",
    referral_date: "2026-05-10", referral_reason: "child_request",
    advocate_service: "nyas", advocate_name: "Jane Smith",
    advocate_contact: "07700900000", status: "active",
    allocated_date: "2026-05-12", first_visit_date: "2026-05-14",
    last_contact_date: "2026-05-18", outcome: null, outcome_date: null,
    child_satisfied: null, notes: null,
    created_at: "2026-05-10T00:00:00Z", updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

function makeRightsRecord(overrides: Partial<ChildrensRightsRecord> = {}): ChildrensRightsRecord {
  return {
    id: "rr-1", home_id: "home-1", child_id: "child-1", child_name: "Alex",
    record_date: "2026-05-15", recorded_by: "staff-1",
    right_type: "advocacy_access", child_informed: true,
    child_understands: true, child_exercised: true,
    support_provided: null, barriers_identified: null,
    actions_taken: null, review_date: null, notes: null,
    created_at: "2026-05-15T00:00:00Z", updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

describe("computeAdvocacyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeAdvocacyMetrics([], []);
    expect(result.total_referrals).toBe(0);
    expect(result.active_referrals).toBe(0);
    expect(result.avg_days_to_allocation).toBeNull();;
    expect(result.children_with_advocates).toBe(0);
    expect(result.rights_awareness_rate).toBeNull();;
    expect(result.rights_exercise_rate).toBeNull();;
    expect(result.children_with_rights_records).toBe(0);
  });

  it("counts referrals and active referrals", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "active" }),
      makeReferral({ id: "r2", status: "completed" }),
      makeReferral({ id: "r3", status: "referred" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.total_referrals).toBe(3);
    expect(result.active_referrals).toBe(2); // active + referred
  });

  it("counts children with advocates (allocated or active only)", () => {
    const referrals = [
      makeReferral({ id: "r1", child_id: "c1", status: "active" }),
      makeReferral({ id: "r2", child_id: "c2", status: "completed" }),
      makeReferral({ id: "r3", child_id: "c3", status: "allocated" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.children_with_advocates).toBe(2); // c1 + c3
  });

  it("computes avg days to allocation", () => {
    const referrals = [
      makeReferral({ id: "r1", referral_date: "2026-05-01", allocated_date: "2026-05-04" }), // 3 days
      makeReferral({ id: "r2", referral_date: "2026-05-01", allocated_date: "2026-05-06" }), // 5 days
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.avg_days_to_allocation).toBe(4); // (3+5)/2
  });

  it("groups by reason and status", () => {
    const referrals = [
      makeReferral({ id: "r1", referral_reason: "child_request", status: "active" }),
      makeReferral({ id: "r2", referral_reason: "complaint", status: "completed" }),
    ];
    const result = computeAdvocacyMetrics(referrals, []);
    expect(result.by_reason["child_request"]).toBe(1);
    expect(result.by_reason["complaint"]).toBe(1);
    expect(result.by_status["active"]).toBe(1);
    expect(result.by_status["completed"]).toBe(1);
  });

  it("computes rights awareness and exercise rates", () => {
    const rightsRecords = [
      makeRightsRecord({ id: "rr1", child_informed: true, child_exercised: true }),
      makeRightsRecord({ id: "rr2", child_informed: true, child_exercised: false }),
      makeRightsRecord({ id: "rr3", child_informed: false, child_exercised: false }),
    ];
    const result = computeAdvocacyMetrics([], rightsRecords);
    expect(result.rights_awareness_rate).toBeCloseTo(66.7, 0);
    expect(result.rights_exercise_rate).toBeCloseTo(33.3, 0);
  });

  it("counts children with rights records", () => {
    const rightsRecords = [
      makeRightsRecord({ id: "rr1", child_id: "c1" }),
      makeRightsRecord({ id: "rr2", child_id: "c1" }),
      makeRightsRecord({ id: "rr3", child_id: "c2" }),
    ];
    const result = computeAdvocacyMetrics([], rightsRecords);
    expect(result.children_with_rights_records).toBe(2);
  });
});

describe("identifyAdvocacyAlerts", () => {
  it("returns empty array for empty data", () => {
    const result = identifyAdvocacyAlerts([], [], NOW);
    expect(result).toEqual([]);
  });

  it("flags unallocated referral over 5 days", () => {
    const referrals = [
      makeReferral({
        id: "r1", status: "referred",
        referral_date: "2026-05-10", allocated_date: null,
      }),
    ];
    const result = identifyAdvocacyAlerts(referrals, [], NOW);
    const alerts = result.filter((a) => a.category === "unallocated_referral");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("flags no recent contact for active referral (>30 days)", () => {
    const referrals = [
      makeReferral({
        id: "r1", status: "active",
        last_contact_date: "2026-04-01",
      }),
    ];
    const result = identifyAdvocacyAlerts(referrals, [], NOW);
    const alerts = result.filter((a) => a.category === "no_recent_contact");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("medium");
  });

  it("flags dissatisfied child", () => {
    const referrals = [
      makeReferral({ id: "r1", status: "completed", child_satisfied: false }),
    ];
    const result = identifyAdvocacyAlerts(referrals, [], NOW);
    const alerts = result.filter((a) => a.category === "child_dissatisfied");
    expect(alerts.length).toBe(1);
    expect(alerts[0].severity).toBe("high");
  });

  it("does not flag recent allocations", () => {
    const referrals = [
      makeReferral({
        id: "r1", status: "referred",
        referral_date: "2026-05-19", allocated_date: null,
      }),
    ];
    const result = identifyAdvocacyAlerts(referrals, [], NOW);
    const alerts = result.filter((a) => a.category === "unallocated_referral");
    expect(alerts.length).toBe(0); // only 2 days, under 5-day threshold
  });
});
