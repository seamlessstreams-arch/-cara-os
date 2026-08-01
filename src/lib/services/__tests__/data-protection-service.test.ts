// ══════════════════════════════════════════════════════════════════════════════
// CARA — DATA PROTECTION SERVICE TESTS
// Pure-function unit tests for data protection metrics computation,
// alert identification, and constant validation.
// CHR 2015 Reg 37 (privacy and confidentiality),
// UK GDPR / Data Protection Act 2018,
// ICO guidance on children's data.
//
// Covers: DSARs, data breach notifications, retention schedules,
// privacy impact assessments, consent records, and data audits.
//
// SCCIF: Leadership — "Data is handled lawfully and securely."
// "Children's information is protected and shared appropriately."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../data-protection-service";
import type { DataProtectionRecord } from "../data-protection-service";
import {
  DATA_EVENT_TYPES,
  COMPLIANCE_STATUSES,
  BREACH_SEVERITIES,
  RESPONSE_TIMELINESS_OPTIONS,
} from "../data-protection-service";

const { computeDataProtectionMetrics, identifyDataProtectionAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

const now = new Date(new Date().toISOString().split("T")[0]);

function daysAgo(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

let _id = 0;
function makeRecord(
  overrides: Partial<DataProtectionRecord> = {},
): DataProtectionRecord {
  _id += 1;
  return {
    id: `dp-${_id}`,
    home_id: "home-1",
    event_type: "data_audit",
    event_date: daysAgo(5),
    compliance_status: "compliant",
    breach_severity: "not_applicable",
    response_timeliness: "within_deadline",
    requester_name: null,
    child_involved: false,
    staff_involved: false,
    ico_notified: false,
    dpo_consulted: true,
    deadline_date: null,
    completed_date: null,
    data_categories_affected: [],
    remedial_actions: [],
    issues_found: [],
    actions_taken: [],
    handled_by: "DPO Smith",
    approved_by: null,
    notes: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

describe("DATA_EVENT_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(DATA_EVENT_TYPES).toHaveLength(10);
  });

  it("contains unique type values", () => {
    const types = DATA_EVENT_TYPES.map((e) => e.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("contains unique labels", () => {
    const labels = DATA_EVENT_TYPES.map((e) => e.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const e of DATA_EVENT_TYPES) {
      expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it("includes dsar_received", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "dsar_received")).toBeTruthy();
  });

  it("includes dsar_completed", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "dsar_completed")).toBeTruthy();
  });

  it("includes data_breach", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "data_breach")).toBeTruthy();
  });

  it("includes privacy_impact_assessment", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "privacy_impact_assessment")).toBeTruthy();
  });

  it("includes retention_review", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "retention_review")).toBeTruthy();
  });

  it("includes consent_review", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "consent_review")).toBeTruthy();
  });

  it("includes data_audit", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "data_audit")).toBeTruthy();
  });

  it("includes ico_notification", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "ico_notification")).toBeTruthy();
  });

  it("includes training_completed", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "training_completed")).toBeTruthy();
  });

  it("includes other", () => {
    expect(DATA_EVENT_TYPES.find((e) => e.type === "other")).toBeTruthy();
  });
});

describe("COMPLIANCE_STATUSES", () => {
  it("has exactly 5 entries", () => {
    expect(COMPLIANCE_STATUSES).toHaveLength(5);
  });

  it("contains unique status values", () => {
    const statuses = COMPLIANCE_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("contains unique labels", () => {
    const labels = COMPLIANCE_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const s of COMPLIANCE_STATUSES) {
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("includes compliant", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "compliant")).toBeTruthy();
  });

  it("includes partially_compliant", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "partially_compliant")).toBeTruthy();
  });

  it("includes non_compliant", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "non_compliant")).toBeTruthy();
  });

  it("includes under_review", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "under_review")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(COMPLIANCE_STATUSES.find((s) => s.status === "not_assessed")).toBeTruthy();
  });
});

describe("BREACH_SEVERITIES", () => {
  it("has exactly 4 entries", () => {
    expect(BREACH_SEVERITIES).toHaveLength(4);
  });

  it("contains unique severity values", () => {
    const severities = BREACH_SEVERITIES.map((b) => b.severity);
    expect(new Set(severities).size).toBe(severities.length);
  });

  it("contains unique labels", () => {
    const labels = BREACH_SEVERITIES.map((b) => b.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const b of BREACH_SEVERITIES) {
      expect(b.label.length).toBeGreaterThan(0);
    }
  });

  it("includes high", () => {
    expect(BREACH_SEVERITIES.find((b) => b.severity === "high")).toBeTruthy();
  });

  it("includes medium", () => {
    expect(BREACH_SEVERITIES.find((b) => b.severity === "medium")).toBeTruthy();
  });

  it("includes low", () => {
    expect(BREACH_SEVERITIES.find((b) => b.severity === "low")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(BREACH_SEVERITIES.find((b) => b.severity === "not_applicable")).toBeTruthy();
  });
});

describe("RESPONSE_TIMELINESS_OPTIONS", () => {
  it("has exactly 5 entries", () => {
    expect(RESPONSE_TIMELINESS_OPTIONS).toHaveLength(5);
  });

  it("contains unique timeliness values", () => {
    const values = RESPONSE_TIMELINESS_OPTIONS.map((t) => t.timeliness);
    expect(new Set(values).size).toBe(values.length);
  });

  it("contains unique labels", () => {
    const labels = RESPONSE_TIMELINESS_OPTIONS.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("each entry has a non-empty label", () => {
    for (const t of RESPONSE_TIMELINESS_OPTIONS) {
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("includes within_deadline", () => {
    expect(RESPONSE_TIMELINESS_OPTIONS.find((t) => t.timeliness === "within_deadline")).toBeTruthy();
  });

  it("includes near_deadline", () => {
    expect(RESPONSE_TIMELINESS_OPTIONS.find((t) => t.timeliness === "near_deadline")).toBeTruthy();
  });

  it("includes overdue", () => {
    expect(RESPONSE_TIMELINESS_OPTIONS.find((t) => t.timeliness === "overdue")).toBeTruthy();
  });

  it("includes significantly_overdue", () => {
    expect(RESPONSE_TIMELINESS_OPTIONS.find((t) => t.timeliness === "significantly_overdue")).toBeTruthy();
  });

  it("includes not_applicable", () => {
    expect(RESPONSE_TIMELINESS_OPTIONS.find((t) => t.timeliness === "not_applicable")).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. computeDataProtectionMetrics
// ═══════════════════════════════════════════════════════════════════════════

describe("computeDataProtectionMetrics", () => {
  // ── Empty array ─────────────────────────────────────────────────────────

  describe("empty records", () => {
    const m = computeDataProtectionMetrics([]);

    it("total_events is 0", () => {
      expect(m.total_events).toBe(0);
    });

    it("dsar_received_count is 0", () => {
      expect(m.dsar_received_count).toBe(0);
    });

    it("dsar_completed_count is 0", () => {
      expect(m.dsar_completed_count).toBe(0);
    });

    it("data_breach_count is 0", () => {
      expect(m.data_breach_count).toBe(0);
    });

    it("privacy_impact_count is 0", () => {
      expect(m.privacy_impact_count).toBe(0);
    });

    it("retention_review_count is 0", () => {
      expect(m.retention_review_count).toBe(0);
    });

    it("compliant_rate is 0", () => {
      expect(m.compliant_rate).toBeNull();;
    });

    it("non_compliant_count is 0", () => {
      expect(m.non_compliant_count).toBe(0);
    });

    it("under_review_count is 0", () => {
      expect(m.under_review_count).toBe(0);
    });

    it("high_breach_count is 0", () => {
      expect(m.high_breach_count).toBe(0);
    });

    it("medium_breach_count is 0", () => {
      expect(m.medium_breach_count).toBe(0);
    });

    it("within_deadline_rate is 0", () => {
      expect(m.within_deadline_rate).toBeNull();;
    });

    it("overdue_count is 0", () => {
      expect(m.overdue_count).toBe(0);
    });

    it("significantly_overdue_count is 0", () => {
      expect(m.significantly_overdue_count).toBe(0);
    });

    it("ico_notified_count is 0", () => {
      expect(m.ico_notified_count).toBe(0);
    });

    it("dpo_consulted_rate is 0", () => {
      expect(m.dpo_consulted_rate).toBeNull();;
    });

    it("child_involved_count is 0", () => {
      expect(m.child_involved_count).toBe(0);
    });

    it("staff_involved_count is 0", () => {
      expect(m.staff_involved_count).toBe(0);
    });

    it("deadline_overdue_count is 0", () => {
      expect(m.deadline_overdue_count).toBe(0);
    });

    it("by_event_type is empty", () => {
      expect(m.by_event_type).toEqual({});
    });

    it("by_compliance_status is empty", () => {
      expect(m.by_compliance_status).toEqual({});
    });

    it("by_breach_severity is empty", () => {
      expect(m.by_breach_severity).toEqual({});
    });

    it("by_response_timeliness is empty", () => {
      expect(m.by_response_timeliness).toEqual({});
    });
  });

  // ── Single record defaults ──────────────────────────────────────────────

  describe("single default record", () => {
    const m = computeDataProtectionMetrics([makeRecord()]);

    it("total_events is 1", () => {
      expect(m.total_events).toBe(1);
    });

    it("compliant_rate is 100", () => {
      expect(m.compliant_rate).toBe(100);
    });

    it("within_deadline_rate is 100", () => {
      expect(m.within_deadline_rate).toBe(100);
    });

    it("dpo_consulted_rate is 100", () => {
      expect(m.dpo_consulted_rate).toBe(100);
    });

    it("by_event_type contains data_audit", () => {
      expect(m.by_event_type).toEqual({ data_audit: 1 });
    });

    it("by_compliance_status contains compliant", () => {
      expect(m.by_compliance_status).toEqual({ compliant: 1 });
    });

    it("by_breach_severity contains not_applicable", () => {
      expect(m.by_breach_severity).toEqual({ not_applicable: 1 });
    });

    it("by_response_timeliness contains within_deadline", () => {
      expect(m.by_response_timeliness).toEqual({ within_deadline: 1 });
    });
  });

  // ── Event type counts ───────────────────────────────────────────────────

  describe("event type counts", () => {
    it("counts dsar_received correctly", () => {
      const records = [
        makeRecord({ event_type: "dsar_received" }),
        makeRecord({ event_type: "dsar_received" }),
        makeRecord({ event_type: "data_audit" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dsar_received_count).toBe(2);
    });

    it("counts dsar_completed correctly", () => {
      const records = [
        makeRecord({ event_type: "dsar_completed" }),
        makeRecord({ event_type: "dsar_completed" }),
        makeRecord({ event_type: "dsar_completed" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dsar_completed_count).toBe(3);
    });

    it("counts data_breach correctly", () => {
      const records = [
        makeRecord({ event_type: "data_breach" }),
        makeRecord({ event_type: "data_audit" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.data_breach_count).toBe(1);
    });

    it("counts privacy_impact_assessment correctly", () => {
      const records = [
        makeRecord({ event_type: "privacy_impact_assessment" }),
        makeRecord({ event_type: "privacy_impact_assessment" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.privacy_impact_count).toBe(2);
    });

    it("counts retention_review correctly", () => {
      const records = [
        makeRecord({ event_type: "retention_review" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.retention_review_count).toBe(1);
    });

    it("does not count other event types as dsar_received", () => {
      const records = [
        makeRecord({ event_type: "consent_review" }),
        makeRecord({ event_type: "ico_notification" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dsar_received_count).toBe(0);
    });
  });

  // ── Compliance counts and rate ──────────────────────────────────────────

  describe("compliance metrics", () => {
    it("compliant_rate is 50 for 1 of 2 compliant", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.compliant_rate).toBe(50);
    });

    it("compliant_rate is 33.3 for 1 of 3 compliant", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "under_review" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.compliant_rate).toBe(33.3);
    });

    it("compliant_rate rounds to one decimal place", () => {
      // 2/3 = 0.666... => 66.7
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.compliant_rate).toBe(66.7);
    });

    it("non_compliant_count counts correctly", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "compliant" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.non_compliant_count).toBe(2);
    });

    it("under_review_count counts correctly", () => {
      const records = [
        makeRecord({ compliance_status: "under_review" }),
        makeRecord({ compliance_status: "under_review" }),
        makeRecord({ compliance_status: "under_review" }),
        makeRecord({ compliance_status: "compliant" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.under_review_count).toBe(3);
    });

    it("compliant_rate is 0 when none are compliant", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "under_review" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.compliant_rate).toBe(0);
    });

    it("compliant_rate is 100 when all are compliant", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "compliant" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.compliant_rate).toBe(100);
    });
  });

  // ── Breach severity counts ─────────────────────────────────────────────

  describe("breach severity counts", () => {
    it("high_breach_count counts correctly", () => {
      const records = [
        makeRecord({ breach_severity: "high" }),
        makeRecord({ breach_severity: "high" }),
        makeRecord({ breach_severity: "low" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.high_breach_count).toBe(2);
    });

    it("medium_breach_count counts correctly", () => {
      const records = [
        makeRecord({ breach_severity: "medium" }),
        makeRecord({ breach_severity: "medium" }),
        makeRecord({ breach_severity: "medium" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.medium_breach_count).toBe(3);
    });

    it("high_breach_count is 0 when no high breaches", () => {
      const records = [
        makeRecord({ breach_severity: "low" }),
        makeRecord({ breach_severity: "not_applicable" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.high_breach_count).toBe(0);
    });

    it("medium_breach_count is 0 when no medium breaches", () => {
      const records = [
        makeRecord({ breach_severity: "high" }),
        makeRecord({ breach_severity: "not_applicable" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.medium_breach_count).toBe(0);
    });
  });

  // ── Response timeliness ─────────────────────────────────────────────────

  describe("response timeliness", () => {
    it("within_deadline_rate is 50 for 1 of 2 within deadline", () => {
      const records = [
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "overdue" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.within_deadline_rate).toBe(50);
    });

    it("within_deadline_rate rounds to one decimal place", () => {
      // 1/3 = 33.333... => 33.3
      const records = [
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "overdue" }),
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.within_deadline_rate).toBe(33.3);
    });

    it("overdue_count counts correctly", () => {
      const records = [
        makeRecord({ response_timeliness: "overdue" }),
        makeRecord({ response_timeliness: "overdue" }),
        makeRecord({ response_timeliness: "within_deadline" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.overdue_count).toBe(2);
    });

    it("significantly_overdue_count counts correctly", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.significantly_overdue_count).toBe(2);
    });

    it("overdue_count is 0 when none overdue", () => {
      const records = [
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "near_deadline" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.overdue_count).toBe(0);
    });

    it("within_deadline_rate is 0 when none within deadline", () => {
      const records = [
        makeRecord({ response_timeliness: "overdue" }),
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.within_deadline_rate).toBe(0);
    });

    it("within_deadline_rate is 100 when all within deadline", () => {
      const records = [
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "within_deadline" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.within_deadline_rate).toBe(100);
    });
  });

  // ── ICO notified ────────────────────────────────────────────────────────

  describe("ico_notified_count", () => {
    it("counts records where ico_notified is true", () => {
      const records = [
        makeRecord({ ico_notified: true }),
        makeRecord({ ico_notified: true }),
        makeRecord({ ico_notified: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.ico_notified_count).toBe(2);
    });

    it("is 0 when none notified", () => {
      const records = [
        makeRecord({ ico_notified: false }),
        makeRecord({ ico_notified: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.ico_notified_count).toBe(0);
    });

    it("counts all when all notified", () => {
      const records = [
        makeRecord({ ico_notified: true }),
        makeRecord({ ico_notified: true }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.ico_notified_count).toBe(2);
    });
  });

  // ── DPO consulted rate ──────────────────────────────────────────────────

  describe("dpo_consulted_rate", () => {
    it("is 50 for 1 of 2 consulted", () => {
      const records = [
        makeRecord({ dpo_consulted: true }),
        makeRecord({ dpo_consulted: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dpo_consulted_rate).toBe(50);
    });

    it("rounds to one decimal place", () => {
      // 2/3 = 66.666... => 66.7
      const records = [
        makeRecord({ dpo_consulted: true }),
        makeRecord({ dpo_consulted: true }),
        makeRecord({ dpo_consulted: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dpo_consulted_rate).toBe(66.7);
    });

    it("is 0 when none consulted", () => {
      const records = [
        makeRecord({ dpo_consulted: false }),
        makeRecord({ dpo_consulted: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dpo_consulted_rate).toBe(0);
    });

    it("is 100 when all consulted", () => {
      const records = [
        makeRecord({ dpo_consulted: true }),
        makeRecord({ dpo_consulted: true }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dpo_consulted_rate).toBe(100);
    });
  });

  // ── Child and staff involved counts ─────────────────────────────────────

  describe("child_involved_count", () => {
    it("counts records where child_involved is true", () => {
      const records = [
        makeRecord({ child_involved: true }),
        makeRecord({ child_involved: true }),
        makeRecord({ child_involved: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.child_involved_count).toBe(2);
    });

    it("is 0 when no children involved", () => {
      const records = [makeRecord({ child_involved: false })];
      const m = computeDataProtectionMetrics(records);
      expect(m.child_involved_count).toBe(0);
    });
  });

  describe("staff_involved_count", () => {
    it("counts records where staff_involved is true", () => {
      const records = [
        makeRecord({ staff_involved: true }),
        makeRecord({ staff_involved: true }),
        makeRecord({ staff_involved: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.staff_involved_count).toBe(2);
    });

    it("is 0 when no staff involved", () => {
      const records = [makeRecord({ staff_involved: false })];
      const m = computeDataProtectionMetrics(records);
      expect(m.staff_involved_count).toBe(0);
    });
  });

  // ── Deadline overdue count ──────────────────────────────────────────────

  describe("deadline_overdue_count", () => {
    it("counts records with past deadline and no completed_date", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
        makeRecord({ deadline_date: daysAgo(7), completed_date: null }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.deadline_overdue_count).toBe(2);
    });

    it("excludes records with a completed_date", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: daysAgo(1) }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.deadline_overdue_count).toBe(0);
    });

    it("excludes records with no deadline_date", () => {
      const records = [
        makeRecord({ deadline_date: null, completed_date: null }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.deadline_overdue_count).toBe(0);
    });

    it("excludes records with future deadline", () => {
      const records = [
        makeRecord({ deadline_date: daysFromNow(5), completed_date: null }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.deadline_overdue_count).toBe(0);
    });

    it("mixes overdue and non-overdue correctly", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),      // overdue
        makeRecord({ deadline_date: daysAgo(5), completed_date: daysAgo(2) }),  // completed
        makeRecord({ deadline_date: daysFromNow(10), completed_date: null }),   // future
        makeRecord({ deadline_date: null }),                                    // no deadline
        makeRecord({ deadline_date: daysAgo(1), completed_date: null }),      // overdue
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.deadline_overdue_count).toBe(2);
    });
  });

  // ── Breakdown maps ──────────────────────────────────────────────────────

  describe("by_event_type", () => {
    it("groups multiple event types correctly", () => {
      const records = [
        makeRecord({ event_type: "dsar_received" }),
        makeRecord({ event_type: "dsar_received" }),
        makeRecord({ event_type: "data_breach" }),
        makeRecord({ event_type: "data_audit" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.by_event_type).toEqual({
        dsar_received: 2,
        data_breach: 1,
        data_audit: 1,
      });
    });

    it("handles a single event type", () => {
      const records = [makeRecord({ event_type: "ico_notification" })];
      const m = computeDataProtectionMetrics(records);
      expect(m.by_event_type).toEqual({ ico_notification: 1 });
    });
  });

  describe("by_compliance_status", () => {
    it("groups multiple statuses correctly", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "under_review" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.by_compliance_status).toEqual({
        compliant: 2,
        non_compliant: 1,
        under_review: 1,
      });
    });
  });

  describe("by_breach_severity", () => {
    it("groups multiple severities correctly", () => {
      const records = [
        makeRecord({ breach_severity: "high" }),
        makeRecord({ breach_severity: "medium" }),
        makeRecord({ breach_severity: "low" }),
        makeRecord({ breach_severity: "not_applicable" }),
        makeRecord({ breach_severity: "not_applicable" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.by_breach_severity).toEqual({
        high: 1,
        medium: 1,
        low: 1,
        not_applicable: 2,
      });
    });
  });

  describe("by_response_timeliness", () => {
    it("groups multiple timeliness values correctly", () => {
      const records = [
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "overdue" }),
        makeRecord({ response_timeliness: "significantly_overdue" }),
        makeRecord({ response_timeliness: "near_deadline" }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.by_response_timeliness).toEqual({
        within_deadline: 2,
        overdue: 1,
        significantly_overdue: 1,
        near_deadline: 1,
      });
    });
  });

  // ── Rate computation precision ──────────────────────────────────────────

  describe("rate computation precision", () => {
    it("compliant_rate for 1/7 is 14.3", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        ...Array.from({ length: 6 }, () =>
          makeRecord({ compliance_status: "non_compliant" }),
        ),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.compliant_rate).toBe(14.3);
    });

    it("within_deadline_rate for 3/7 is 42.9", () => {
      const records = [
        ...Array.from({ length: 3 }, () =>
          makeRecord({ response_timeliness: "within_deadline" }),
        ),
        ...Array.from({ length: 4 }, () =>
          makeRecord({ response_timeliness: "overdue" }),
        ),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.within_deadline_rate).toBe(42.9);
    });

    it("dpo_consulted_rate for 5/6 is 83.3", () => {
      const records = [
        ...Array.from({ length: 5 }, () =>
          makeRecord({ dpo_consulted: true }),
        ),
        makeRecord({ dpo_consulted: false }),
      ];
      const m = computeDataProtectionMetrics(records);
      expect(m.dpo_consulted_rate).toBe(83.3);
    });
  });

  // ── Mixed scenario ──────────────────────────────────────────────────────

  describe("mixed scenario with diverse records", () => {
    const records = [
      makeRecord({
        event_type: "dsar_received",
        compliance_status: "compliant",
        breach_severity: "not_applicable",
        response_timeliness: "within_deadline",
        ico_notified: false,
        dpo_consulted: true,
        child_involved: true,
        staff_involved: false,
      }),
      makeRecord({
        event_type: "data_breach",
        compliance_status: "non_compliant",
        breach_severity: "high",
        response_timeliness: "significantly_overdue",
        ico_notified: true,
        dpo_consulted: true,
        child_involved: true,
        staff_involved: true,
      }),
      makeRecord({
        event_type: "retention_review",
        compliance_status: "under_review",
        breach_severity: "not_applicable",
        response_timeliness: "overdue",
        ico_notified: false,
        dpo_consulted: false,
        child_involved: false,
        staff_involved: true,
      }),
      makeRecord({
        event_type: "dsar_completed",
        compliance_status: "compliant",
        breach_severity: "not_applicable",
        response_timeliness: "within_deadline",
        ico_notified: false,
        dpo_consulted: true,
        child_involved: false,
        staff_involved: false,
      }),
    ];
    const m = computeDataProtectionMetrics(records);

    it("total_events is 4", () => {
      expect(m.total_events).toBe(4);
    });

    it("dsar_received_count is 1", () => {
      expect(m.dsar_received_count).toBe(1);
    });

    it("dsar_completed_count is 1", () => {
      expect(m.dsar_completed_count).toBe(1);
    });

    it("data_breach_count is 1", () => {
      expect(m.data_breach_count).toBe(1);
    });

    it("retention_review_count is 1", () => {
      expect(m.retention_review_count).toBe(1);
    });

    it("privacy_impact_count is 0", () => {
      expect(m.privacy_impact_count).toBe(0);
    });

    it("compliant_rate is 50", () => {
      expect(m.compliant_rate).toBe(50);
    });

    it("non_compliant_count is 1", () => {
      expect(m.non_compliant_count).toBe(1);
    });

    it("under_review_count is 1", () => {
      expect(m.under_review_count).toBe(1);
    });

    it("high_breach_count is 1", () => {
      expect(m.high_breach_count).toBe(1);
    });

    it("within_deadline_rate is 50", () => {
      expect(m.within_deadline_rate).toBe(50);
    });

    it("overdue_count is 1", () => {
      expect(m.overdue_count).toBe(1);
    });

    it("significantly_overdue_count is 1", () => {
      expect(m.significantly_overdue_count).toBe(1);
    });

    it("ico_notified_count is 1", () => {
      expect(m.ico_notified_count).toBe(1);
    });

    it("dpo_consulted_rate is 75", () => {
      expect(m.dpo_consulted_rate).toBe(75);
    });

    it("child_involved_count is 2", () => {
      expect(m.child_involved_count).toBe(2);
    });

    it("staff_involved_count is 2", () => {
      expect(m.staff_involved_count).toBe(2);
    });
  });

  // ── All event types counted ─────────────────────────────────────────────

  describe("all event types in by_event_type", () => {
    it("counts all 10 event types when each appears once", () => {
      const allTypes = [
        "dsar_received", "dsar_completed", "data_breach",
        "privacy_impact_assessment", "retention_review", "consent_review",
        "data_audit", "ico_notification", "training_completed", "other",
      ] as const;
      const records = allTypes.map((t) => makeRecord({ event_type: t }));
      const m = computeDataProtectionMetrics(records);
      expect(m.total_events).toBe(10);
      for (const t of allTypes) {
        expect(m.by_event_type[t]).toBe(1);
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. identifyDataProtectionAlerts
// ═══════════════════════════════════════════════════════════════════════════

describe("identifyDataProtectionAlerts", () => {
  // ── No alerts ───────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array for no records", () => {
      const alerts = identifyDataProtectionAlerts([]);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for all-clean records", () => {
      const records = [
        makeRecord(),
        makeRecord(),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts).toEqual([]);
    });

    it("returns empty when only compliant records exist", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ compliance_status: "compliant", dpo_consulted: true }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts).toEqual([]);
    });
  });

  // ── high_severity_breach ────────────────────────────────────────────────

  describe("high_severity_breach alert", () => {
    it("fires for data_breach with high breach_severity", () => {
      const records = [
        makeRecord({
          event_type: "data_breach",
          breach_severity: "high",
          event_date: "2024-06-15",
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "high_severity_breach");
      expect(a).toBeDefined();
    });

    it("has severity critical", () => {
      const r = makeRecord({
        event_type: "data_breach",
        breach_severity: "high",
        event_date: "2024-06-15",
      });
      const alerts = identifyDataProtectionAlerts([r]);
      const a = alerts.find((x) => x.type === "high_severity_breach")!;
      expect(a.severity).toBe("critical");
    });

    it("message includes the event_date", () => {
      const r = makeRecord({
        event_type: "data_breach",
        breach_severity: "high",
        event_date: "2024-06-15",
      });
      const alerts = identifyDataProtectionAlerts([r]);
      const a = alerts.find((x) => x.type === "high_severity_breach")!;
      expect(a.message).toContain("2024-06-15");
    });

    it("message mentions ICO and 72 hours", () => {
      const r = makeRecord({
        event_type: "data_breach",
        breach_severity: "high",
        event_date: "2024-06-15",
      });
      const alerts = identifyDataProtectionAlerts([r]);
      const a = alerts.find((x) => x.type === "high_severity_breach")!;
      expect(a.message).toContain("ICO");
      expect(a.message).toContain("72 hours");
    });

    it("id is the record id (per-record alert)", () => {
      const r = makeRecord({
        id: "breach-42",
        event_type: "data_breach",
        breach_severity: "high",
        event_date: "2024-06-15",
      });
      const alerts = identifyDataProtectionAlerts([r]);
      const a = alerts.find((x) => x.type === "high_severity_breach")!;
      expect(a.id).toBe("breach-42");
    });

    it("does not fire for data_breach with medium severity", () => {
      const records = [
        makeRecord({ event_type: "data_breach", breach_severity: "medium" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "high_severity_breach")).toBeUndefined();
    });

    it("does not fire for data_breach with low severity", () => {
      const records = [
        makeRecord({ event_type: "data_breach", breach_severity: "low" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "high_severity_breach")).toBeUndefined();
    });

    it("does not fire for non-breach with high severity", () => {
      const records = [
        makeRecord({ event_type: "data_audit", breach_severity: "high" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "high_severity_breach")).toBeUndefined();
    });

    it("fires once per matching record", () => {
      const records = [
        makeRecord({ id: "b1", event_type: "data_breach", breach_severity: "high", event_date: "2024-01-01" }),
        makeRecord({ id: "b2", event_type: "data_breach", breach_severity: "high", event_date: "2024-02-01" }),
        makeRecord({ id: "b3", event_type: "data_breach", breach_severity: "high", event_date: "2024-03-01" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const breachAlerts = alerts.filter((x) => x.type === "high_severity_breach");
      expect(breachAlerts).toHaveLength(3);
    });

    it("each per-record alert has the correct record id", () => {
      const records = [
        makeRecord({ id: "b1", event_type: "data_breach", breach_severity: "high", event_date: "2024-01-01" }),
        makeRecord({ id: "b2", event_type: "data_breach", breach_severity: "high", event_date: "2024-02-01" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const breachAlerts = alerts.filter((x) => x.type === "high_severity_breach");
      expect(breachAlerts.map((a) => a.id).sort()).toEqual(["b1", "b2"]);
    });

    it("does not fire for data_breach with not_applicable severity", () => {
      const records = [
        makeRecord({ event_type: "data_breach", breach_severity: "not_applicable" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "high_severity_breach")).toBeUndefined();
    });
  });

  // ── non_compliant ──────────────────────────────────────────────────────

  describe("non_compliant alert", () => {
    it("fires when 1 record is non_compliant", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant");
      expect(a).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.severity).toBe("high");
    });

    it("id is non_compliant", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.id).toBe("non_compliant");
    });

    it("message uses singular 'event is' for 1 non-compliant", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.message).toContain("event is");
    });

    it("message uses plural 'events are' for 2 non-compliant", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.message).toContain("events are");
    });

    it("message uses plural 'events are' for 5 non-compliant", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ compliance_status: "non_compliant" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.message).toContain("events are");
    });

    it("message includes the count", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.message).toContain("3");
    });

    it("message mentions rectify", () => {
      const records = [
        makeRecord({ compliance_status: "non_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "non_compliant")!;
      expect(a.message).toContain("rectify");
    });

    it("does not fire when no non-compliant records", () => {
      const records = [
        makeRecord({ compliance_status: "compliant" }),
        makeRecord({ compliance_status: "under_review" }),
        makeRecord({ compliance_status: "partially_compliant" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "non_compliant")).toBeUndefined();
    });
  });

  // ── significantly_overdue ──────────────────────────────────────────────

  describe("significantly_overdue alert", () => {
    it("fires when 1 record is significantly_overdue", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue");
      expect(a).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.severity).toBe("high");
    });

    it("id is significantly_overdue", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.id).toBe("significantly_overdue");
    });

    it("message uses singular 'response is' for 1", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.message).toContain("response is");
    });

    it("message uses plural 'responses are' for 2", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.message).toContain("responses are");
    });

    it("message uses plural 'responses are' for 4", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({ response_timeliness: "significantly_overdue" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.message).toContain("responses are");
    });

    it("message includes the count", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({ response_timeliness: "significantly_overdue" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.message).toContain("3");
    });

    it("message mentions DPO", () => {
      const records = [
        makeRecord({ response_timeliness: "significantly_overdue" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "significantly_overdue")!;
      expect(a.message).toContain("DPO");
    });

    it("does not fire when none significantly overdue", () => {
      const records = [
        makeRecord({ response_timeliness: "overdue" }),
        makeRecord({ response_timeliness: "within_deadline" }),
        makeRecord({ response_timeliness: "near_deadline" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "significantly_overdue")).toBeUndefined();
    });
  });

  // ── deadline_overdue ───────────────────────────────────────────────────

  describe("deadline_overdue alert", () => {
    it("fires when 1 record has past deadline and no completed_date", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue");
      expect(a).toBeDefined();
    });

    it("has severity high", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.severity).toBe("high");
    });

    it("id is deadline_overdue", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.id).toBe("deadline_overdue");
    });

    it("message uses singular 'deadline is' for 1", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.message).toContain("deadline is");
    });

    it("message uses plural 'deadlines are' for 2", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
        makeRecord({ deadline_date: daysAgo(7), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.message).toContain("deadlines are");
    });

    it("message uses plural 'deadlines are' for 5", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ deadline_date: daysAgo(10), completed_date: null }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.message).toContain("deadlines are");
    });

    it("message includes the count", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({ deadline_date: daysAgo(5), completed_date: null }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.message).toContain("3");
    });

    it("message mentions action urgently", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.message).toContain("urgently");
    });

    it("excludes records with completed_date", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: daysAgo(1) }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "deadline_overdue")).toBeUndefined();
    });

    it("excludes records with no deadline_date", () => {
      const records = [
        makeRecord({ deadline_date: null, completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "deadline_overdue")).toBeUndefined();
    });

    it("excludes records with future deadline", () => {
      const records = [
        makeRecord({ deadline_date: daysFromNow(5), completed_date: null }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "deadline_overdue")).toBeUndefined();
    });

    it("counts only non-completed past-deadline records", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null }),     // counts
        makeRecord({ deadline_date: daysAgo(5), completed_date: daysAgo(2) }), // excluded
        makeRecord({ deadline_date: daysFromNow(5), completed_date: null }),   // excluded
        makeRecord({ deadline_date: daysAgo(1), completed_date: null }),     // counts
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "deadline_overdue")!;
      expect(a.message).toContain("2");
    });
  });

  // ── dpo_not_consulted ──────────────────────────────────────────────────

  describe("dpo_not_consulted alert", () => {
    it("fires when 3 records have dpo_consulted false (non-training)", () => {
      const records = [
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
        makeRecord({ dpo_consulted: false, event_type: "dsar_received" }),
        makeRecord({ dpo_consulted: false, event_type: "data_breach" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "dpo_not_consulted");
      expect(a).toBeDefined();
    });

    it("has severity medium", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "dpo_not_consulted")!;
      expect(a.severity).toBe("medium");
    });

    it("id is dpo_not_consulted", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "dpo_not_consulted")!;
      expect(a.id).toBe("dpo_not_consulted");
    });

    it("message includes the count", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "dpo_not_consulted")!;
      expect(a.message).toContain("4");
    });

    it("message mentions data protection officer", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "dpo_not_consulted")!;
      expect(a.message).toContain("data protection officer");
    });

    it("does not fire for fewer than 3 non-consulted", () => {
      const records = [
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
        makeRecord({ dpo_consulted: false, event_type: "dsar_received" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "dpo_not_consulted")).toBeUndefined();
    });

    it("does not fire for 0 non-consulted", () => {
      const records = [
        makeRecord({ dpo_consulted: true }),
        makeRecord({ dpo_consulted: true }),
        makeRecord({ dpo_consulted: true }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "dpo_not_consulted")).toBeUndefined();
    });

    it("excludes training_completed from the count", () => {
      const records = [
        makeRecord({ dpo_consulted: false, event_type: "training_completed" }),
        makeRecord({ dpo_consulted: false, event_type: "training_completed" }),
        makeRecord({ dpo_consulted: false, event_type: "training_completed" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "dpo_not_consulted")).toBeUndefined();
    });

    it("excludes training_completed but counts other types", () => {
      const records = [
        makeRecord({ dpo_consulted: false, event_type: "training_completed" }),
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
        makeRecord({ dpo_consulted: false, event_type: "dsar_received" }),
        makeRecord({ dpo_consulted: false, event_type: "retention_review" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const a = alerts.find((x) => x.type === "dpo_not_consulted")!;
      expect(a).toBeDefined();
      expect(a.message).toContain("3");
    });

    it("fires at exactly 3 threshold", () => {
      const records = Array.from({ length: 3 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "consent_review" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "dpo_not_consulted")).toBeDefined();
    });

    it("does not fire at 2 (below threshold)", () => {
      const records = Array.from({ length: 2 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "consent_review" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((x) => x.type === "dpo_not_consulted")).toBeUndefined();
    });
  });

  // ── Combined alert scenarios ────────────────────────────────────────────

  describe("combined alert scenarios", () => {
    it("fires multiple alert types simultaneously", () => {
      const records = [
        makeRecord({
          id: "breach-1",
          event_type: "data_breach",
          breach_severity: "high",
          event_date: "2024-06-15",
          compliance_status: "non_compliant",
          response_timeliness: "significantly_overdue",
          dpo_consulted: false,
          deadline_date: daysAgo(5),
          completed_date: null,
        }),
        makeRecord({
          compliance_status: "non_compliant",
          dpo_consulted: false,
        }),
        makeRecord({
          dpo_consulted: false,
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("high_severity_breach");
      expect(types).toContain("non_compliant");
      expect(types).toContain("significantly_overdue");
      expect(types).toContain("deadline_overdue");
      expect(types).toContain("dpo_not_consulted");
    });

    it("breach alert and non_compliant can coexist", () => {
      const records = [
        makeRecord({
          id: "b-1",
          event_type: "data_breach",
          breach_severity: "high",
          event_date: "2024-01-01",
          compliance_status: "non_compliant",
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("high_severity_breach");
      expect(types).toContain("non_compliant");
    });

    it("deadline_overdue and significantly_overdue are independent", () => {
      const records = [
        makeRecord({
          response_timeliness: "significantly_overdue",
          deadline_date: daysFromNow(10),
          completed_date: null,
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("significantly_overdue");
      expect(types).not.toContain("deadline_overdue");
    });

    it("only dpo_not_consulted fires when threshold met but others clean", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({
          compliance_status: "compliant",
          response_timeliness: "within_deadline",
          dpo_consulted: false,
          event_type: "data_audit",
        }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe("dpo_not_consulted");
    });
  });

  // ── Alert ordering ──────────────────────────────────────────────────────

  describe("alert ordering", () => {
    it("high_severity_breach alerts come before non_compliant", () => {
      const records = [
        makeRecord({
          id: "br-1",
          event_type: "data_breach",
          breach_severity: "high",
          event_date: "2024-01-01",
          compliance_status: "non_compliant",
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const breachIdx = alerts.findIndex((a) => a.type === "high_severity_breach");
      const ncIdx = alerts.findIndex((a) => a.type === "non_compliant");
      expect(breachIdx).toBeLessThan(ncIdx);
    });

    it("non_compliant comes before significantly_overdue", () => {
      const records = [
        makeRecord({
          compliance_status: "non_compliant",
          response_timeliness: "significantly_overdue",
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const ncIdx = alerts.findIndex((a) => a.type === "non_compliant");
      const soIdx = alerts.findIndex((a) => a.type === "significantly_overdue");
      expect(ncIdx).toBeLessThan(soIdx);
    });

    it("significantly_overdue comes before deadline_overdue", () => {
      const records = [
        makeRecord({
          response_timeliness: "significantly_overdue",
          deadline_date: daysAgo(5),
          completed_date: null,
        }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const soIdx = alerts.findIndex((a) => a.type === "significantly_overdue");
      const doIdx = alerts.findIndex((a) => a.type === "deadline_overdue");
      expect(soIdx).toBeLessThan(doIdx);
    });

    it("deadline_overdue comes before dpo_not_consulted", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(3), completed_date: null, dpo_consulted: false }),
        makeRecord({ dpo_consulted: false, event_type: "data_audit" }),
        makeRecord({ dpo_consulted: false, event_type: "dsar_received" }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      const doIdx = alerts.findIndex((a) => a.type === "deadline_overdue");
      const dpoIdx = alerts.findIndex((a) => a.type === "dpo_not_consulted");
      expect(doIdx).toBeLessThan(dpoIdx);
    });
  });

  // ── Edge cases ──────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("single record with all clean fields produces no alerts", () => {
      const records = [makeRecord()];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts).toHaveLength(0);
    });

    it("training_completed with dpo_consulted false does not count toward dpo alert alone", () => {
      const records = Array.from({ length: 10 }, () =>
        makeRecord({ dpo_consulted: false, event_type: "training_completed" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((a) => a.type === "dpo_not_consulted")).toBeUndefined();
    });

    it("partially_compliant does not trigger non_compliant alert", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ compliance_status: "partially_compliant" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("overdue response_timeliness does not trigger significantly_overdue alert", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ response_timeliness: "overdue" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((a) => a.type === "significantly_overdue")).toBeUndefined();
    });

    it("not_assessed compliance does not trigger non_compliant alert", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ compliance_status: "not_assessed" }),
      );
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((a) => a.type === "non_compliant")).toBeUndefined();
    });

    it("completed record with past deadline does not trigger deadline_overdue", () => {
      const records = [
        makeRecord({ deadline_date: daysAgo(10), completed_date: daysAgo(5) }),
        makeRecord({ deadline_date: daysAgo(20), completed_date: daysAgo(15) }),
        makeRecord({ deadline_date: daysAgo(30), completed_date: daysAgo(25) }),
      ];
      const alerts = identifyDataProtectionAlerts(records);
      expect(alerts.find((a) => a.type === "deadline_overdue")).toBeUndefined();
    });
  });
});
