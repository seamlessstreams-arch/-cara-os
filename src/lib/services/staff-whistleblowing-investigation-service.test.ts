import { describe, it, expect } from "vitest";
import {
  computeStaffWhistleblowingMetrics,
  computeStaffWhistleblowingAlerts,
} from "./staff-whistleblowing-investigation-service";
import type { StaffWhistleblowingInvestigationRow } from "./staff-whistleblowing-investigation-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffWhistleblowingInvestigationRow> = {}): StaffWhistleblowingInvestigationRow {
  return {
    id: "inv-1",
    home_id: "home-1",
    staff_name: "Staff A",
    staff_id: "s-1",
    disclosure_date: "2026-04-01",
    concern_category: "safeguarding_practice",
    investigation_outcome: "substantiated",
    investigation_status: "concluded",
    whistleblower_protection: "full_anonymity",
    investigating_officer: "Officer A",
    whistleblower_supported: true,
    no_detriment_confirmed: true,
    regulatory_body_notified: true,
    organisational_learning_identified: true,
    learning_shared_with_team: true,
    policy_change_required: false,
    completion_date: "2026-04-20",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-20T00:00:00Z",
    ...overrides,
  };
}

// -- computeStaffWhistleblowingMetrics ----------------------------------------

describe("computeStaffWhistleblowingMetrics", () => {
  it("returns zeroes for empty array", () => {
    const r = computeStaffWhistleblowingMetrics([]);
    expect(r.total_investigations).toBe(0);
    expect(r.substantiated_count).toBe(0);
    expect(r.ongoing_count).toBe(0);
    expect(r.escalated_count).toBe(0);
    expect(r.policy_change_count).toBe(0);
    expect(r.whistleblower_supported_rate).toBeNull();;
    expect(r.no_detriment_rate).toBeNull();;
    expect(r.regulatory_notified_rate).toBeNull();;
    expect(r.learning_identified_rate).toBeNull();;
    expect(r.learning_shared_rate).toBeNull();;
    expect(r.unique_staff).toBe(0);
  });

  it("counts substantiated, ongoing, escalated, policy_change", () => {
    const rows = [
      makeRow({ id: "1", investigation_outcome: "substantiated", investigation_status: "concluded", policy_change_required: true }),
      makeRow({ id: "2", investigation_outcome: "ongoing", investigation_status: "escalated", policy_change_required: false }),
      makeRow({ id: "3", investigation_outcome: "unsubstantiated", investigation_status: "closed", policy_change_required: false }),
    ];
    const r = computeStaffWhistleblowingMetrics(rows);
    expect(r.total_investigations).toBe(3);
    expect(r.substantiated_count).toBe(1);
    expect(r.ongoing_count).toBe(1);
    expect(r.escalated_count).toBe(1);
    expect(r.policy_change_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", whistleblower_supported: true, no_detriment_confirmed: true, regulatory_body_notified: true }),
      makeRow({ id: "2", whistleblower_supported: false, no_detriment_confirmed: false, regulatory_body_notified: false }),
    ];
    const r = computeStaffWhistleblowingMetrics(rows);
    expect(r.whistleblower_supported_rate).toBe(50);
    expect(r.no_detriment_rate).toBe(50);
    expect(r.regulatory_notified_rate).toBe(50);
  });

  it("counts unique staff and populates breakdowns", () => {
    const rows = [
      makeRow({ id: "1", staff_name: "Alice", concern_category: "safeguarding_practice", investigation_outcome: "substantiated" }),
      makeRow({ id: "2", staff_name: "Bob", concern_category: "medication_error", investigation_outcome: "ongoing" }),
      makeRow({ id: "3", staff_name: "Alice", concern_category: "safeguarding_practice", investigation_outcome: "substantiated" }),
    ];
    const r = computeStaffWhistleblowingMetrics(rows);
    expect(r.unique_staff).toBe(2);
    expect(r.category_breakdown).toEqual({ safeguarding_practice: 2, medication_error: 1 });
    expect(r.outcome_breakdown).toEqual({ substantiated: 2, ongoing: 1 });
  });
});

// -- computeStaffWhistleblowingAlerts -----------------------------------------

describe("computeStaffWhistleblowingAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeStaffWhistleblowingAlerts([])).toEqual([]);
  });

  it("fires substantiated_not_notified when substantiated + not notified", () => {
    const rows = [
      makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: false }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const a = alerts.filter((x) => x.type === "substantiated_not_notified");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("does NOT fire substantiated_not_notified when notified", () => {
    const rows = [
      makeRow({ investigation_outcome: "substantiated", regulatory_body_notified: true }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    expect(alerts.filter((x) => x.type === "substantiated_not_notified")).toHaveLength(0);
  });

  it("fires whistleblower_protection_gap when not supported or no detriment not confirmed", () => {
    const rows = [
      makeRow({ whistleblower_supported: false, no_detriment_confirmed: true }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const a = alerts.filter((x) => x.type === "whistleblower_protection_gap");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("fires multiple_ongoing_investigations at threshold of 2", () => {
    const rows = [
      makeRow({ id: "1", investigation_status: "under_investigation" }),
      makeRow({ id: "2", investigation_status: "received" }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    expect(alerts.filter((x) => x.type === "multiple_ongoing_investigations")).toHaveLength(1);
  });

  it("does NOT fire multiple_ongoing_investigations for only 1 ongoing", () => {
    const rows = [
      makeRow({ investigation_status: "under_investigation" }),
      makeRow({ id: "2", investigation_status: "concluded" }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    expect(alerts.filter((x) => x.type === "multiple_ongoing_investigations")).toHaveLength(0);
  });

  it("fires learning_not_shared when learning identified but not shared", () => {
    const rows = [
      makeRow({ organisational_learning_identified: true, learning_shared_with_team: false }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    const a = alerts.filter((x) => x.type === "learning_not_shared");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("does NOT fire learning_not_shared when learning is shared", () => {
    const rows = [
      makeRow({ organisational_learning_identified: true, learning_shared_with_team: true }),
    ];
    const alerts = computeStaffWhistleblowingAlerts(rows);
    expect(alerts.filter((x) => x.type === "learning_not_shared")).toHaveLength(0);
  });
});
