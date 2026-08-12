import { describe, it, expect } from "vitest";
import {
  computePrMetrics,
  identifyPrAlerts,
} from "./parental-responsibility-service";
import type { ParentalResponsibilityRecord } from "./parental-responsibility-service";
import { daysFromNow } from "@/lib/utils";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<ParentalResponsibilityRecord> = {}): ParentalResponsibilityRecord {
  return {
    id: "pr-1",
    home_id: "home-1",
    child_name: "Alex",
    child_id: "child-1",
    care_order_type: "full_care_order",
    care_order_date: "2025-01-01",
    care_order_expiry: null,
    pr_holder: "local_authority",
    pr_holder_name: "Anytown Council",
    pr_status: "active",
    consent_arrangement: "la_consent_required",
    contact_with_pr_holder: true,
    pr_holder_involved_in_decisions: true,
    pr_holder_informed_of_placement: true,
    conflict_between_pr_holders: false,
    conflict_details: null,
    legal_representation: false,
    social_worker_name: "SW Jones",
    review_date: "2027-01-01",
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePrMetrics ---------------------------------------------------------

describe("computePrMetrics", () => {
  it("returns zeroes for empty records with zero children", () => {
    const m = computePrMetrics([], 0);
    expect(m.total_records).toBe(0);
    expect(m.children_covered).toBe(0);
    expect(m.coverage_rate).toBeNull();;
    expect(m.active_pr_count).toBe(0);
    expect(m.conflict_count).toBe(0);
    expect(m.review_overdue_count).toBe(0);
  });

  it("calculates coverage rate against totalChildren", () => {
    const records = [
      makeRecord({ child_id: "child-1" }),
      makeRecord({ id: "pr-2", child_id: "child-2" }),
    ];
    const m = computePrMetrics(records, 4);
    expect(m.children_covered).toBe(2);
    expect(m.coverage_rate).toBe(50);
  });

  it("counts PR statuses", () => {
    const records = [
      makeRecord({ id: "1", pr_status: "active" }),
      makeRecord({ id: "2", pr_status: "shared" }),
      makeRecord({ id: "3", pr_status: "restricted" }),
      makeRecord({ id: "4", pr_status: "suspended" }),
    ];
    const m = computePrMetrics(records, 4);
    expect(m.active_pr_count).toBe(1);
    expect(m.shared_pr_count).toBe(1);
    expect(m.restricted_pr_count).toBe(1);
    expect(m.suspended_pr_count).toBe(1);
  });

  it("counts care order types", () => {
    const records = [
      makeRecord({ id: "1", care_order_type: "section_20" }),
      makeRecord({ id: "2", care_order_type: "full_care_order" }),
      makeRecord({ id: "3", care_order_type: "interim_care_order" }),
    ];
    const m = computePrMetrics(records, 3);
    expect(m.section_20_count).toBe(1);
    expect(m.full_care_order_count).toBe(1);
    expect(m.interim_care_order_count).toBe(1);
  });

  it("calculates boolean rates at 100%", () => {
    const records = [makeRecord(), makeRecord({ id: "pr-2" })];
    const m = computePrMetrics(records, 2);
    expect(m.contact_with_pr_holder_rate).toBe(100);
    expect(m.pr_holder_involved_rate).toBe(100);
    expect(m.pr_holder_informed_rate).toBe(100);
  });

  it("counts conflicts", () => {
    const records = [
      makeRecord({ id: "1", conflict_between_pr_holders: true }),
      makeRecord({ id: "2", conflict_between_pr_holders: true }),
      makeRecord({ id: "3", conflict_between_pr_holders: false }),
    ];
    const m = computePrMetrics(records, 3);
    expect(m.conflict_count).toBe(2);
  });

  it("counts review overdue (past review_date + non-terminated status)", () => {
    const records = [
      makeRecord({ id: "1", review_date: "2020-01-01", pr_status: "active" }),
      makeRecord({ id: "2", review_date: "2020-01-01", pr_status: "terminated" }),
      makeRecord({ id: "3", review_date: "2099-01-01", pr_status: "active" }),
    ];
    const m = computePrMetrics(records, 3);
    expect(m.review_overdue_count).toBe(1);
  });
});

// -- identifyPrAlerts ---------------------------------------------------------

describe("identifyPrAlerts", () => {
  it("returns empty array when all children covered and no issues", () => {
    const records = [makeRecord({ child_id: "child-1" })];
    const alerts = identifyPrAlerts(records, 1);
    expect(alerts).toEqual([]);
  });

  it("flags critical no_pr_record when children not covered", () => {
    const records = [makeRecord({ child_id: "child-1" })];
    const alerts = identifyPrAlerts(records, 3);
    const gap = alerts.filter((a) => a.type === "no_pr_record");
    expect(gap.length).toBe(1);
    expect(gap[0].severity).toBe("critical");
    expect(gap[0].message).toContain("2");
  });

  it("flags high pr_holder_not_informed for active non-terminated holder", () => {
    const records = [
      makeRecord({ pr_holder_informed_of_placement: false, pr_status: "active" }),
    ];
    const alerts = identifyPrAlerts(records, 1);
    const ni = alerts.filter((a) => a.type === "pr_holder_not_informed");
    expect(ni.length).toBe(1);
    expect(ni[0].severity).toBe("high");
  });

  it("does not flag pr_holder_not_informed when status is terminated", () => {
    const records = [
      makeRecord({ pr_holder_informed_of_placement: false, pr_status: "terminated" }),
    ];
    const alerts = identifyPrAlerts(records, 1);
    const ni = alerts.filter((a) => a.type === "pr_holder_not_informed");
    expect(ni.length).toBe(0);
  });

  it("flags high pr_conflict when conflict exists", () => {
    const records = [makeRecord({ conflict_between_pr_holders: true, conflict_details: "Disagreement over education" })];
    const alerts = identifyPrAlerts(records, 1);
    const conf = alerts.filter((a) => a.type === "pr_conflict");
    expect(conf.length).toBe(1);
    expect(conf[0].severity).toBe("high");
  });

  it("flags high care_order_expiring within 30 days", () => {
    const soon = daysFromNow(15);
    const records = [makeRecord({ care_order_expiry: soon })];
    const alerts = identifyPrAlerts(records, 1);
    const exp = alerts.filter((a) => a.type === "care_order_expiring");
    expect(exp.length).toBe(1);
    expect(exp[0].severity).toBe("high");
  });

  it("does not flag care_order_expiring when > 30 days away", () => {
    const far = daysFromNow(60);
    const records = [makeRecord({ care_order_expiry: far })];
    const alerts = identifyPrAlerts(records, 1);
    const exp = alerts.filter((a) => a.type === "care_order_expiring");
    expect(exp.length).toBe(0);
  });

  it("flags medium section_20_notice for active s20 records", () => {
    const records = [
      makeRecord({ care_order_type: "section_20", pr_status: "active" }),
    ];
    const alerts = identifyPrAlerts(records, 1);
    const s20 = alerts.filter((a) => a.type === "section_20_notice");
    expect(s20.length).toBe(1);
    expect(s20[0].severity).toBe("medium");
  });
});
