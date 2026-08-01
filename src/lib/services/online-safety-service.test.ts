import { describe, it, expect } from "vitest";
import {
  computeOnlineSafetyMetrics,
  identifyOnlineSafetyAlerts,
  type OnlineSafetyIncident,
  type DeviceAgreement,
} from "./online-safety-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeIncident(overrides: Partial<OnlineSafetyIncident> = {}): OnlineSafetyIncident {
  return {
    id: "inc-1",
    home_id: "home-1",
    child_name: "Alex Taylor",
    child_id: "child-1",
    incident_date: "2026-05-15",
    risk_category: "cyberbullying",
    severity: "medium",
    description: "Received abusive messages",
    platform_involved: "Instagram",
    device_type: "smartphone",
    action_taken: "Blocked sender, reported to platform",
    parent_carer_informed: true,
    social_worker_informed: true,
    police_involved: false,
    safeguarding_referral: false,
    outcome: "Resolved",
    staff_recording: "Staff A",
    created_at: "2026-05-15T10:00:00Z",
    updated_at: "2026-05-15T10:00:00Z",
    ...overrides,
  };
}

function makeAgreement(overrides: Partial<DeviceAgreement> = {}): DeviceAgreement {
  return {
    id: "ag-1",
    home_id: "home-1",
    child_name: "Alex Taylor",
    child_id: "child-1",
    device_types: ["smartphone", "laptop"],
    agreement_date: "2026-01-01",
    review_date: "2026-07-01",
    status: "active",
    filtering_enabled: true,
    monitoring_enabled: true,
    agreed_usage_hours: 3,
    restrictions: ["No social media after 9pm"],
    last_safety_check: "2026-04-01",
    last_check_result: "compliant",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeOnlineSafetyMetrics ─────────────────────────────────────────

describe("computeOnlineSafetyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeOnlineSafetyMetrics([], [], 4, NOW);
    expect(m.total_incidents).toBe(0);
    expect(m.incidents_this_month).toBe(0);
    expect(m.critical_incidents).toBe(0);
    expect(m.total_agreements).toBe(0);
    expect(m.active_agreements).toBe(0);
    expect(m.agreement_coverage).toBe(0);
    expect(m.filtering_enabled_rate).toBeNull();;
  });

  it("computes incident metrics", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "critical", safeguarding_referral: true, police_involved: true }),
      makeIncident({ id: "inc-2", severity: "medium", incident_date: "2026-05-20" }),
      makeIncident({ id: "inc-3", severity: "low", incident_date: "2026-03-01" }), // outside 30 days
    ];
    const m = computeOnlineSafetyMetrics(incidents, [], 4, NOW);
    expect(m.total_incidents).toBe(3);
    expect(m.incidents_this_month).toBe(2); // inc-1 and inc-2 within 30 days
    expect(m.critical_incidents).toBe(1);
    expect(m.safeguarding_referrals).toBe(1);
    expect(m.police_involved_count).toBe(1);
    expect(m.by_severity["critical"]).toBe(1);
    expect(m.by_severity["medium"]).toBe(1);
  });

  it("computes agreement metrics", () => {
    const agreements = [
      makeAgreement({ id: "ag-1", child_id: "child-1", status: "active", filtering_enabled: true, monitoring_enabled: true }),
      makeAgreement({ id: "ag-2", child_id: "child-2", status: "active", filtering_enabled: false, monitoring_enabled: true }),
      makeAgreement({ id: "ag-3", child_id: "child-3", status: "suspended", filtering_enabled: true, monitoring_enabled: true }),
    ];
    const m = computeOnlineSafetyMetrics([], agreements, 4, NOW);
    expect(m.total_agreements).toBe(3);
    expect(m.active_agreements).toBe(2);
    // coverage: 2 unique active children / 4 total = 50%
    expect(m.agreement_coverage).toBe(50);
    // filtering: 1 of 2 active = 50%
    expect(m.filtering_enabled_rate).toBe(50);
    // monitoring: 2 of 2 active = 100%
    expect(m.monitoring_enabled_rate).toBe(100);
  });

  it("counts checks overdue and issues found", () => {
    const agreements = [
      makeAgreement({ id: "ag-1", status: "active", review_date: "2026-04-01", last_check_result: "action_required" }),
      makeAgreement({ id: "ag-2", status: "active", review_date: "2026-07-01", last_check_result: "issues_found" }),
    ];
    const m = computeOnlineSafetyMetrics([], agreements, 4, NOW);
    expect(m.checks_overdue).toBe(1); // ag-1 review_date past
    expect(m.issues_found).toBe(2); // both have issues
  });
});

// ── identifyOnlineSafetyAlerts ─────────────────────────────────────────

describe("identifyOnlineSafetyAlerts", () => {
  it("returns no alerts for empty data with 0 children", () => {
    expect(identifyOnlineSafetyAlerts([], [], 0, NOW)).toHaveLength(0);
  });

  it("flags safeguarding_not_referred (critical) for grooming without referral", () => {
    const incidents = [
      makeIncident({ severity: "critical", risk_category: "grooming", safeguarding_referral: false }),
    ];
    const alerts = identifyOnlineSafetyAlerts(incidents, [], 4, NOW);
    const found = alerts.filter((a) => a.type === "safeguarding_not_referred");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags safeguarding_not_referred (critical) for online_exploitation without referral", () => {
    const incidents = [
      makeIncident({ severity: "high", risk_category: "online_exploitation", safeguarding_referral: false }),
    ];
    const alerts = identifyOnlineSafetyAlerts(incidents, [], 4, NOW);
    const found = alerts.filter((a) => a.type === "safeguarding_not_referred");
    expect(found.length).toBe(1);
  });

  it("flags no_agreement (high) when children without agreements", () => {
    // 4 total children but only 2 have agreements
    const agreements = [
      makeAgreement({ id: "ag-1", child_id: "child-1", status: "active" }),
      makeAgreement({ id: "ag-2", child_id: "child-2", status: "active" }),
    ];
    const alerts = identifyOnlineSafetyAlerts([], agreements, 4, NOW);
    const found = alerts.filter((a) => a.type === "no_agreement");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
    expect(found[0].message).toContain("2");
  });

  it("flags review_overdue (medium) when active agreement past review date", () => {
    const agreements = [
      makeAgreement({ status: "active", review_date: "2026-04-01" }),
    ];
    const alerts = identifyOnlineSafetyAlerts([], agreements, 4, NOW);
    const found = alerts.filter((a) => a.type === "review_overdue");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("flags safety_controls_missing (high) when filtering or monitoring disabled", () => {
    const agreements = [
      makeAgreement({ id: "ag-1", status: "active", filtering_enabled: false, monitoring_enabled: true }),
    ];
    const alerts = identifyOnlineSafetyAlerts([], agreements, 4, NOW);
    const found = alerts.filter((a) => a.type === "safety_controls_missing");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
    expect(found[0].message).toContain("Filtering");
  });

  it("flags check_action_required (high) when last check result needs action", () => {
    const agreements = [
      makeAgreement({ last_check_result: "action_required" }),
    ];
    const alerts = identifyOnlineSafetyAlerts([], agreements, 4, NOW);
    const found = alerts.filter((a) => a.type === "check_action_required");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });
});
