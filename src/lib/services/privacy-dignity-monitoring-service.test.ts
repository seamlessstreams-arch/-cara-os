import { describe, it, expect } from "vitest";
import {
  computePrivacyDignityMetrics,
  identifyPrivacyDignityAlerts,
} from "./privacy-dignity-monitoring-service";
import type { PrivacyDignityMonitoringRecord } from "./privacy-dignity-monitoring-service";

// -- Factory ------------------------------------------------------------------

function makeRecord(overrides: Partial<PrivacyDignityMonitoringRecord> = {}): PrivacyDignityMonitoringRecord {
  return {
    id: "pdm-1",
    home_id: "home-1",
    privacy_area: "bedroom_privacy",
    dignity_rating: "good",
    intrusion_type: "none",
    response_quality: "good",
    monitoring_date: "2026-05-01",
    child_name: "Alex",
    child_id: "child-1",
    monitored_by: "Staff A",
    child_views_sought: true,
    knock_before_entry: true,
    personal_space_respected: true,
    confidentiality_maintained: true,
    complaints_process_explained: true,
    staff_awareness_adequate: true,
    care_plan_reflects: true,
    social_worker_informed: true,
    intimate_care_policy_followed: true,
    cctv_compliant: true,
    dignity_in_language: true,
    recorded_promptly: true,
    issues_found: [],
    actions_taken: [],
    next_review_date: null,
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

// -- computePrivacyDignityMetrics ---------------------------------------------

describe("computePrivacyDignityMetrics", () => {
  it("returns zeroes for empty records", () => {
    const m = computePrivacyDignityMetrics([]);
    expect(m.total_checks).toBe(0);
    expect(m.poor_dignity_count).toBe(0);
    expect(m.unacceptable_count).toBe(0);
    expect(m.intrusion_count).toBe(0);
    expect(m.no_response_count).toBe(0);
    expect(m.child_views_rate).toBeNull();;
    expect(m.knock_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("counts poor and unacceptable dignity ratings", () => {
    const records = [
      makeRecord({ id: "1", dignity_rating: "poor" }),
      makeRecord({ id: "2", dignity_rating: "unacceptable" }),
      makeRecord({ id: "3", dignity_rating: "good" }),
    ];
    const m = computePrivacyDignityMetrics(records);
    expect(m.poor_dignity_count).toBe(1);
    expect(m.unacceptable_count).toBe(1);
  });

  it("counts intrusions (anything other than none)", () => {
    const records = [
      makeRecord({ id: "1", intrusion_type: "room_entry_without_knock" }),
      makeRecord({ id: "2", intrusion_type: "none" }),
      makeRecord({ id: "3", intrusion_type: "mail_opened" }),
    ];
    const m = computePrivacyDignityMetrics(records);
    expect(m.intrusion_count).toBe(2);
  });

  it("counts no_response entries", () => {
    const records = [
      makeRecord({ id: "1", response_quality: "no_response" }),
      makeRecord({ id: "2", response_quality: "good" }),
    ];
    const m = computePrivacyDignityMetrics(records);
    expect(m.no_response_count).toBe(1);
  });

  it("computes boolean rates correctly at 50%", () => {
    const records = [
      makeRecord({ id: "1", knock_before_entry: true }),
      makeRecord({ id: "2", knock_before_entry: false }),
    ];
    const m = computePrivacyDignityMetrics(records);
    expect(m.knock_rate).toBe(50);
  });

  it("computes 100% rates when all booleans are true", () => {
    const records = [makeRecord(), makeRecord({ id: "2" })];
    const m = computePrivacyDignityMetrics(records);
    expect(m.child_views_rate).toBe(100);
    expect(m.confidentiality_rate).toBe(100);
    expect(m.staff_awareness_rate).toBe(100);
    expect(m.intimate_care_rate).toBe(100);
    expect(m.cctv_rate).toBe(100);
    expect(m.dignity_language_rate).toBe(100);
    expect(m.recorded_promptly_rate).toBe(100);
  });

  it("counts unique children", () => {
    const records = [
      makeRecord({ id: "1", child_name: "Alex" }),
      makeRecord({ id: "2", child_name: "Alex" }),
      makeRecord({ id: "3", child_name: "Beth" }),
    ];
    const m = computePrivacyDignityMetrics(records);
    expect(m.unique_children).toBe(2);
  });

  it("populates breakdown records", () => {
    const records = [
      makeRecord({ id: "1", privacy_area: "bedroom_privacy", dignity_rating: "good" }),
      makeRecord({ id: "2", privacy_area: "bathroom_privacy", dignity_rating: "poor" }),
    ];
    const m = computePrivacyDignityMetrics(records);
    expect(m.by_privacy_area).toEqual({ bedroom_privacy: 1, bathroom_privacy: 1 });
    expect(m.by_dignity_rating).toEqual({ good: 1, poor: 1 });
  });
});

// -- identifyPrivacyDignityAlerts ---------------------------------------------

describe("identifyPrivacyDignityAlerts", () => {
  it("returns empty alerts for empty records", () => {
    expect(identifyPrivacyDignityAlerts([])).toHaveLength(0);
  });

  it("returns empty alerts for fully compliant records", () => {
    expect(identifyPrivacyDignityAlerts([makeRecord()])).toHaveLength(0);
  });

  it("fires critical alert for unacceptable dignity with intrusion", () => {
    const records = [
      makeRecord({ dignity_rating: "unacceptable", intrusion_type: "room_entry_without_knock" }),
    ];
    const alerts = identifyPrivacyDignityAlerts(records);
    const critical = alerts.filter((a) => a.type === "unacceptable_with_intrusion");
    expect(critical).toHaveLength(1);
    expect(critical[0].severity).toBe("critical");
  });

  it("does NOT fire critical for unacceptable dignity without intrusion", () => {
    const records = [
      makeRecord({ dignity_rating: "unacceptable", intrusion_type: "none" }),
    ];
    const alerts = identifyPrivacyDignityAlerts(records);
    expect(alerts.filter((a) => a.type === "unacceptable_with_intrusion")).toHaveLength(0);
  });

  it("fires high alert when 1 record has confidentiality not maintained (threshold >= 1)", () => {
    const records = [makeRecord({ confidentiality_maintained: false })];
    const alerts = identifyPrivacyDignityAlerts(records);
    expect(alerts.filter((a) => a.type === "confidentiality_breach")).toHaveLength(1);
    expect(alerts.find((a) => a.type === "confidentiality_breach")!.severity).toBe("high");
  });

  it("fires high alert when 1 record has no knock before entry (threshold >= 1)", () => {
    const records = [makeRecord({ knock_before_entry: false })];
    const alerts = identifyPrivacyDignityAlerts(records);
    expect(alerts.filter((a) => a.type === "no_knock_before_entry")).toHaveLength(1);
  });

  it("fires medium alert for staff awareness lacking at threshold of 2", () => {
    const alerts1 = identifyPrivacyDignityAlerts([makeRecord({ staff_awareness_adequate: false })]);
    expect(alerts1.filter((a) => a.type === "staff_awareness_lacking")).toHaveLength(0);

    const alerts2 = identifyPrivacyDignityAlerts([
      makeRecord({ id: "1", staff_awareness_adequate: false }),
      makeRecord({ id: "2", staff_awareness_adequate: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "staff_awareness_lacking")).toHaveLength(1);
    expect(alerts2.find((a) => a.type === "staff_awareness_lacking")!.severity).toBe("medium");
  });

  it("fires medium alert for intimate care policy breach at threshold of 2", () => {
    const alerts1 = identifyPrivacyDignityAlerts([makeRecord({ intimate_care_policy_followed: false })]);
    expect(alerts1.filter((a) => a.type === "intimate_care_policy_breach")).toHaveLength(0);

    const alerts2 = identifyPrivacyDignityAlerts([
      makeRecord({ id: "1", intimate_care_policy_followed: false }),
      makeRecord({ id: "2", intimate_care_policy_followed: false }),
    ]);
    expect(alerts2.filter((a) => a.type === "intimate_care_policy_breach")).toHaveLength(1);
  });
});
