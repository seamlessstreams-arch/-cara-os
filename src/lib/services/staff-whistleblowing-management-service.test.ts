import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
} from "./staff-whistleblowing-management-service";
import type { StaffWhistleblowingDisclosureRow } from "./staff-whistleblowing-management-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<StaffWhistleblowingDisclosureRow> = {}): StaffWhistleblowingDisclosureRow {
  return {
    id: "d-1",
    home_id: "home-1",
    disclosure_date: "2026-04-01",
    handler_name: "Handler A",
    discloser_name: "Discloser A",
    disclosure_type: "Safeguarding Concern",
    disclosure_method: "Internal",
    investigation_opened: true,
    investigation_outcome: null,
    action_taken: true,
    whistleblower_protected: true,
    anonymity_maintained: true,
    detriment_reported: false,
    feedback_provided: true,
    regulator_notified: false,
    compliance_status: "Closed",
    notes: null,
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics", () => {
  it("returns zeroes for empty array", () => {
    const r = computeMetrics([]);
    expect(r.total_disclosures).toBe(0);
    expect(r.open_count).toBe(0);
    expect(r.under_investigation_count).toBe(0);
    expect(r.closed_count).toBe(0);
    expect(r.escalated_count).toBe(0);
    expect(r.investigation_opened_rate).toBeNull();;
    expect(r.substantiated_count).toBe(0);
    expect(r.whistleblower_protected_rate).toBeNull();;
    expect(r.anonymity_rate).toBeNull();;
    expect(r.detriment_count).toBe(0);
    expect(r.feedback_rate).toBeNull();;
    expect(r.regulator_notified_rate).toBeNull();;
    expect(r.action_taken_rate).toBeNull();;
    expect(r.unique_disclosers).toBe(0);
    expect(r.unique_handlers).toBe(0);
  });

  it("counts compliance status categories", () => {
    const rows = [
      makeRow({ id: "1", compliance_status: "Open" }),
      makeRow({ id: "2", compliance_status: "Under Investigation" }),
      makeRow({ id: "3", compliance_status: "Closed" }),
      makeRow({ id: "4", compliance_status: "Escalated" }),
    ];
    const r = computeMetrics(rows);
    expect(r.open_count).toBe(1);
    expect(r.under_investigation_count).toBe(1);
    expect(r.closed_count).toBe(1);
    expect(r.escalated_count).toBe(1);
  });

  it("calculates boolean rates correctly", () => {
    const rows = [
      makeRow({ id: "1", investigation_opened: true, whistleblower_protected: true, anonymity_maintained: true, feedback_provided: true, action_taken: true }),
      makeRow({ id: "2", investigation_opened: false, whistleblower_protected: false, anonymity_maintained: false, feedback_provided: false, action_taken: false }),
    ];
    const r = computeMetrics(rows);
    expect(r.investigation_opened_rate).toBe(50);
    expect(r.whistleblower_protected_rate).toBe(50);
    expect(r.anonymity_rate).toBe(50);
    expect(r.feedback_rate).toBe(50);
    expect(r.action_taken_rate).toBe(50);
  });

  it("counts substantiated and detriment", () => {
    const rows = [
      makeRow({ id: "1", investigation_outcome: "Substantiated", detriment_reported: true }),
      makeRow({ id: "2", investigation_outcome: "Unsubstantiated", detriment_reported: false }),
    ];
    const r = computeMetrics(rows);
    expect(r.substantiated_count).toBe(1);
    expect(r.detriment_count).toBe(1);
  });

  it("counts unique disclosers and handlers", () => {
    const rows = [
      makeRow({ id: "1", discloser_name: "Alice", handler_name: "Manager X" }),
      makeRow({ id: "2", discloser_name: "Bob", handler_name: "Manager X" }),
      makeRow({ id: "3", discloser_name: "Alice", handler_name: "Manager Y" }),
    ];
    const r = computeMetrics(rows);
    expect(r.unique_disclosers).toBe(2);
    expect(r.unique_handlers).toBe(2);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts", () => {
  it("returns empty for empty array", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires detriment_reported (critical)", () => {
    const rows = [makeRow({ detriment_reported: true })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "detriment_reported");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires safeguarding_not_investigated for safeguarding concern without investigation", () => {
    const rows = [makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "safeguarding_not_investigated");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("critical");
  });

  it("fires no_investigation for non-safeguarding concern without investigation", () => {
    const rows = [makeRow({ disclosure_type: "Health & Safety", investigation_opened: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "no_investigation");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("does NOT fire no_investigation for safeguarding concerns (uses separate alert)", () => {
    const rows = [makeRow({ disclosure_type: "Safeguarding Concern", investigation_opened: false })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "no_investigation")).toHaveLength(0);
  });

  it("fires escalated_no_regulator for escalated status without regulator notification", () => {
    const rows = [makeRow({ compliance_status: "Escalated", regulator_notified: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "escalated_no_regulator");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("high");
  });

  it("fires feedback_not_provided (medium)", () => {
    const rows = [makeRow({ feedback_provided: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "feedback_not_provided");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("fires anonymity_not_maintained (medium)", () => {
    const rows = [makeRow({ anonymity_maintained: false })];
    const alerts = computeAlerts(rows);
    const a = alerts.filter((x) => x.type === "anonymity_not_maintained");
    expect(a).toHaveLength(1);
    expect(a[0].severity).toBe("medium");
  });

  it("does NOT fire feedback_not_provided when feedback provided", () => {
    const rows = [makeRow({ feedback_provided: true })];
    const alerts = computeAlerts(rows);
    expect(alerts.filter((x) => x.type === "feedback_not_provided")).toHaveLength(0);
  });
});
