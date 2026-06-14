import { describe, it, expect } from "vitest";
import {
  computeCctvComplianceMetrics,
  identifyCctvComplianceAlerts,
  generateCctvComplianceCaraInsights,
  type HomeCctvComplianceRow,
} from "./home-cctv-compliance-service";

// ── Factory ──────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HomeCctvComplianceRow> = {}): HomeCctvComplianceRow {
  return {
    id: "row-1",
    home_id: "home-1",
    review_date: "2026-05-01",
    reviewer_name: "Reviewer A",
    camera_location: "Front Door",
    camera_purpose: "Security",
    dpia_completed: true,
    signage_in_place: true,
    retention_period_days: 30,
    retention_compliant: true,
    data_protection_registered: true,
    footage_accessible: true,
    footage_encrypted: true,
    access_log_maintained: true,
    sar_received: false,
    sar_responded_in_time: null,
    children_informed: true,
    staff_informed: true,
    privacy_zones_set: true,
    compliance_status: "Compliant",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// ── computeCctvComplianceMetrics ─────────────────────────────────────────

describe("computeCctvComplianceMetrics", () => {
  it("returns zeroes for empty data", () => {
    const result = computeCctvComplianceMetrics([]);
    expect(result.total_reviews).toBe(0);
    expect(result.non_compliant_count).toBe(0);
    expect(result.action_required_count).toBe(0);
    expect(result.dpia_rate).toBe(0);
    expect(result.signage_rate).toBe(0);
    expect(result.encryption_rate).toBe(0);
    expect(result.sar_count).toBe(0);
    expect(result.sar_response_rate).toBe(0);
    expect(result.avg_retention_days).toBe(0);
    expect(result.unique_locations).toBe(0);
    expect(result.unique_reviewers).toBe(0);
  });

  it("computes correct counts with populated data", () => {
    const rows = [
      makeRow({ compliance_status: "Non-Compliant", dpia_completed: false, footage_encrypted: false }),
      makeRow({ id: "row-2", compliance_status: "Action Required", camera_location: "Back Garden", retention_period_days: 60, sar_received: true, sar_responded_in_time: true }),
      makeRow({ id: "row-3", reviewer_name: "Reviewer B", camera_location: "Hallway", retention_period_days: 90, sar_received: true, sar_responded_in_time: false }),
    ];
    const result = computeCctvComplianceMetrics(rows);
    expect(result.total_reviews).toBe(3);
    expect(result.non_compliant_count).toBe(1);
    expect(result.action_required_count).toBe(1);
    // dpia: 2/3 = 66.7%
    expect(result.dpia_rate).toBe(66.7);
    // encryption: 2/3 = 66.7%
    expect(result.encryption_rate).toBe(66.7);
    expect(result.sar_count).toBe(2);
    // sar_response_rate: 1 out of 2 SAR-with-response = 50%
    expect(result.sar_response_rate).toBe(50);
    // avg_retention: (30 + 60 + 90) / 3 = 60
    expect(result.avg_retention_days).toBe(60);
    expect(result.unique_locations).toBe(3);
    expect(result.unique_reviewers).toBe(2);
  });

  it("computes boolean rates at 100% when all true", () => {
    const rows = [makeRow(), makeRow({ id: "row-2" })];
    const result = computeCctvComplianceMetrics(rows);
    expect(result.dpia_rate).toBe(100);
    expect(result.signage_rate).toBe(100);
    expect(result.retention_compliant_rate).toBe(100);
    expect(result.encryption_rate).toBe(100);
    expect(result.access_log_rate).toBe(100);
    expect(result.children_informed_rate).toBe(100);
    expect(result.staff_informed_rate).toBe(100);
    expect(result.privacy_zones_rate).toBe(100);
  });
});

// ── identifyCctvComplianceAlerts ─────────────────────────────────────────

describe("identifyCctvComplianceAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyCctvComplianceAlerts([])).toHaveLength(0);
  });

  it("raises critical alert for no DPIA", () => {
    const rows = [makeRow({ dpia_completed: false })];
    const alerts = identifyCctvComplianceAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_dpia");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises critical alert for children not informed", () => {
    const rows = [makeRow({ children_informed: false })];
    const alerts = identifyCctvComplianceAlerts(rows);
    const match = alerts.filter((a) => a.type === "children_not_informed");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("critical");
  });

  it("raises high alert for no signage", () => {
    const rows = [makeRow({ signage_in_place: false })];
    const alerts = identifyCctvComplianceAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_signage");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises high alert for Non-Compliant status", () => {
    const rows = [makeRow({ compliance_status: "Non-Compliant" })];
    const alerts = identifyCctvComplianceAlerts(rows);
    const match = alerts.filter((a) => a.type === "non_compliant_status");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("high");
  });

  it("raises medium alert for no encryption", () => {
    const rows = [makeRow({ footage_encrypted: false })];
    const alerts = identifyCctvComplianceAlerts(rows);
    const match = alerts.filter((a) => a.type === "no_encryption");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });

  it("raises medium alert for SAR not responded in time", () => {
    const rows = [makeRow({ sar_received: true, sar_responded_in_time: false })];
    const alerts = identifyCctvComplianceAlerts(rows);
    const match = alerts.filter((a) => a.type === "sar_not_responded");
    expect(match).toHaveLength(1);
    expect(match[0].severity).toBe("medium");
  });

  it("does NOT raise SAR alert when sar_responded_in_time is true", () => {
    const rows = [makeRow({ sar_received: true, sar_responded_in_time: true })];
    const alerts = identifyCctvComplianceAlerts(rows);
    expect(alerts.filter((a) => a.type === "sar_not_responded")).toHaveLength(0);
  });
});

// ── generateCctvComplianceCaraInsights ───────────────────────────────────

describe("generateCctvComplianceCaraInsights", () => {
  it("returns 3 insights", () => {
    const insights = generateCctvComplianceCaraInsights([makeRow()]);
    expect(insights).toHaveLength(3);
  });

  it("returns 3 insights for empty data", () => {
    const insights = generateCctvComplianceCaraInsights([]);
    expect(insights).toHaveLength(3);
  });
});
