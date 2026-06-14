import { describe, it, expect } from "vitest";
import {
  computeMetrics,
  computeAlerts,
  generateCaraInsights,
} from "./child-online-safety-monitoring-service";
import type { ChildOnlineSafetyMonitoringRow } from "./child-online-safety-monitoring-service";

// -- Factory ------------------------------------------------------------------

function makeRow(overrides: Partial<ChildOnlineSafetyMonitoringRow> = {}): ChildOnlineSafetyMonitoringRow {
  return {
    id: "osm-1",
    home_id: "home-1",
    check_date: "2026-05-01",
    checker_name: "Checker 1",
    child_name: "Child A",
    check_type: "Device Check",
    risk_level: "No Identified Risk",
    filtering_active: true,
    age_appropriate: true,
    parental_controls: true,
    social_media_reviewed: true,
    harmful_content_found: false,
    online_contact_risk: false,
    cyberbullying_identified: false,
    action_taken: true,
    child_educated: true,
    parent_carer_notified: true,
    next_review_date: null,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computeMetrics -----------------------------------------------------------

describe("computeMetrics (online safety)", () => {
  it("returns zeroes for empty array", () => {
    const m = computeMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.high_risk_count).toBe(0);
    expect(m.critical_count).toBe(0);
    expect(m.harmful_content_count).toBe(0);
    expect(m.cyberbullying_count).toBe(0);
    expect(m.unique_children).toBe(0);
    expect(m.unique_checkers).toBe(0);
  });

  it("counts high and critical risk", () => {
    const rows = [
      makeRow({ id: "1", risk_level: "High" }),
      makeRow({ id: "2", risk_level: "Critical" }),
      makeRow({ id: "3", risk_level: "Low" }),
    ];
    const m = computeMetrics(rows);
    expect(m.high_risk_count).toBe(2);
    expect(m.critical_count).toBe(1);
  });

  it("counts harmful content, cyberbullying, online contact risk", () => {
    const rows = [
      makeRow({ id: "1", harmful_content_found: true, cyberbullying_identified: true, online_contact_risk: false }),
      makeRow({ id: "2", harmful_content_found: false, cyberbullying_identified: false, online_contact_risk: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.harmful_content_count).toBe(1);
    expect(m.cyberbullying_count).toBe(1);
    expect(m.online_contact_risk_count).toBe(1);
  });

  it("calculates boolean rates", () => {
    const rows = [
      makeRow({ id: "1", filtering_active: true, child_educated: false }),
      makeRow({ id: "2", filtering_active: false, child_educated: true }),
    ];
    const m = computeMetrics(rows);
    expect(m.filtering_rate).toBe(50);
    expect(m.child_educated_rate).toBe(50);
  });

  it("counts unique children and checkers", () => {
    const rows = [
      makeRow({ id: "1", child_name: "A", checker_name: "X" }),
      makeRow({ id: "2", child_name: "B", checker_name: "X" }),
    ];
    const m = computeMetrics(rows);
    expect(m.unique_children).toBe(2);
    expect(m.unique_checkers).toBe(1);
  });
});

// -- computeAlerts ------------------------------------------------------------

describe("computeAlerts (online safety)", () => {
  it("returns empty for empty input", () => {
    expect(computeAlerts([])).toEqual([]);
  });

  it("fires critical alert for harmful content found", () => {
    const rows = [makeRow({ harmful_content_found: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "harmful_content_found");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires critical alert for online contact risk", () => {
    const rows = [makeRow({ online_contact_risk: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "online_contact_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("critical");
  });

  it("fires high alert for cyberbullying identified", () => {
    const rows = [makeRow({ cyberbullying_identified: true })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "cyberbullying_identified");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires high alert for filtering not active", () => {
    const rows = [makeRow({ filtering_active: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "filtering_not_active");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("high");
  });

  it("fires medium alert for child not educated after Online Incident", () => {
    const rows = [makeRow({ check_type: "Online Incident", child_educated: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "child_not_educated_after_incident");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });

  it("does NOT fire education alert for non-incident check types", () => {
    const rows = [makeRow({ check_type: "Device Check", child_educated: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "child_not_educated_after_incident");
    expect(found).toBeUndefined();
  });

  it("fires medium alert for parent not notified on High/Critical risk", () => {
    const rows = [makeRow({ risk_level: "High", parent_carer_notified: false })];
    const alerts = computeAlerts(rows);
    const found = alerts.find((a) => a.type === "parent_carer_not_notified_high_risk");
    expect(found).toBeDefined();
    expect(found!.severity).toBe("medium");
  });
});

// -- generateCaraInsights -----------------------------------------------------

describe("generateCaraInsights (online safety)", () => {
  it("returns 3 insights for empty data", () => {
    const insights = generateCaraInsights([]);
    expect(insights).toHaveLength(3);
    expect(insights[0]).toContain("[sky]");
    expect(insights[2]).toContain("[reflect]");
  });

  it("shows critical/high counts when alerts present", () => {
    const rows = [makeRow({ harmful_content_found: true })];
    const insights = generateCaraInsights(rows);
    expect(insights[1]).toContain("critical");
  });
});
