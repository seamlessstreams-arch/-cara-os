// ══════════════════════════════════════════════════════════════════════════════
// CARA — NOTIFICATIONS REGISTER SERVICE TESTS
// Pure-function unit tests for notification metrics computation, alert
// identification, and constant validation.
// CHR 2015 Reg 40 (notification of serious events),
// Reg 41 (notification to local authority),
// Reg 44 (independent person — notification requirements),
// Reg 45 (review of quality of care — notification evidence).
//
// Covers: notification submission, timeliness tracking, follow-up monitoring,
// evidence attachment, regulatory body notification, and alert generation.
//
// SCCIF: Leadership — "Notifications are made promptly and accurately."
// "The home notifies the appropriate authorities without delay."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import crypto from "crypto";

import {
  _testing,
  NOTIFICATION_TYPES,
  NOTIFIED_BODIES,
  NOTIFICATION_STATUSES,
  TIMELINESS_OPTIONS,
} from "../notifications-register-service";

import type { NotificationRecord } from "../notifications-register-service";

const { computeNotificationMetrics, identifyNotificationAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function makeRecord(
  overrides: Partial<NotificationRecord> = {},
): NotificationRecord {
  return {
    id: "id" in overrides ? overrides.id! : crypto.randomUUID(),
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    notification_type:
      "notification_type" in overrides
        ? overrides.notification_type!
        : "significant_event",
    event_date:
      "event_date" in overrides ? overrides.event_date! : "2026-04-10",
    notification_date:
      "notification_date" in overrides
        ? overrides.notification_date!
        : "2026-04-11",
    notified_bodies:
      "notified_bodies" in overrides
        ? overrides.notified_bodies!
        : ["ofsted"],
    notification_status:
      "notification_status" in overrides
        ? overrides.notification_status!
        : "submitted",
    timeliness_met:
      "timeliness_met" in overrides
        ? overrides.timeliness_met!
        : "within_24_hours",
    child_name:
      "child_name" in (overrides ?? {})
        ? (overrides!.child_name ?? null)
        : null,
    child_id:
      "child_id" in (overrides ?? {})
        ? (overrides!.child_id ?? null)
        : null,
    staff_name:
      "staff_name" in (overrides ?? {})
        ? (overrides!.staff_name ?? null)
        : null,
    ofsted_reference:
      "ofsted_reference" in (overrides ?? {})
        ? (overrides!.ofsted_reference ?? null)
        : null,
    description:
      "description" in overrides
        ? overrides.description!
        : "Test notification",
    outcome:
      "outcome" in (overrides ?? {})
        ? (overrides!.outcome ?? null)
        : null,
    follow_up_required:
      "follow_up_required" in overrides
        ? overrides.follow_up_required!
        : false,
    follow_up_date:
      "follow_up_date" in (overrides ?? {})
        ? (overrides!.follow_up_date ?? null)
        : null,
    follow_up_completed:
      "follow_up_completed" in overrides
        ? overrides.follow_up_completed!
        : false,
    evidence_attached:
      "evidence_attached" in overrides
        ? overrides.evidence_attached!
        : true,
    reg40_applicable:
      "reg40_applicable" in overrides
        ? overrides.reg40_applicable!
        : false,
    reg41_applicable:
      "reg41_applicable" in overrides
        ? overrides.reg41_applicable!
        : false,
    submitted_by:
      "submitted_by" in overrides ? overrides.submitted_by! : "staff-1",
    approved_by:
      "approved_by" in (overrides ?? {})
        ? (overrides!.approved_by ?? null)
        : null,
    issues_found:
      "issues_found" in overrides ? overrides.issues_found! : [],
    actions_taken:
      "actions_taken" in overrides ? overrides.actions_taken! : [],
    notes:
      "notes" in (overrides ?? {})
        ? (overrides!.notes ?? null)
        : null,
    created_at:
      "created_at" in overrides
        ? overrides.created_at!
        : "2026-04-11T10:00:00Z",
    updated_at:
      "updated_at" in overrides
        ? overrides.updated_at!
        : "2026-04-11T10:00:00Z",
  };
}

/** A date string safely in the past. */
const PAST_DATE = "2024-01-01";

/** A date string safely in the future. */
const FUTURE_DATE = "2099-12-31";

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("NOTIFICATION_TYPES", () => {
  it("contains 13 notification types", () => {
    expect(NOTIFICATION_TYPES).toHaveLength(13);
  });

  it("includes serious_injury", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "serious_injury")).toBeTruthy();
  });

  it("includes death", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "death")).toBeTruthy();
  });

  it("includes missing_child", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "missing_child")).toBeTruthy();
  });

  it("includes police_involvement", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "police_involvement")).toBeTruthy();
  });

  it("includes restraint", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "restraint")).toBeTruthy();
  });

  it("includes child_protection", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "child_protection")).toBeTruthy();
  });

  it("includes deprivation_of_liberty", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "deprivation_of_liberty")).toBeTruthy();
  });

  it("includes allegation_against_staff", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "allegation_against_staff")).toBeTruthy();
  });

  it("includes absconding", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "absconding")).toBeTruthy();
  });

  it("includes serious_illness", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "serious_illness")).toBeTruthy();
  });

  it("includes outbreak", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "outbreak")).toBeTruthy();
  });

  it("includes significant_event", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "significant_event")).toBeTruthy();
  });

  it("includes other", () => {
    expect(NOTIFICATION_TYPES.find((t) => t.type === "other")).toBeTruthy();
  });

  it("has human-readable labels for every type", () => {
    for (const entry of NOTIFICATION_TYPES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("NOTIFIED_BODIES", () => {
  it("contains 8 notified bodies", () => {
    expect(NOTIFIED_BODIES).toHaveLength(8);
  });

  it("includes ofsted", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "ofsted")).toBeTruthy();
  });

  it("includes local_authority", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "local_authority")).toBeTruthy();
  });

  it("includes lado", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "lado")).toBeTruthy();
  });

  it("includes police", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "police")).toBeTruthy();
  });

  it("includes placing_authority", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "placing_authority")).toBeTruthy();
  });

  it("includes parent_carer", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "parent_carer")).toBeTruthy();
  });

  it("includes dfe", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "dfe")).toBeTruthy();
  });

  it("includes other", () => {
    expect(NOTIFIED_BODIES.find((b) => b.body === "other")).toBeTruthy();
  });

  it("has human-readable labels for every body", () => {
    for (const entry of NOTIFIED_BODIES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("NOTIFICATION_STATUSES", () => {
  it("contains 5 statuses", () => {
    expect(NOTIFICATION_STATUSES).toHaveLength(5);
  });

  it("includes draft", () => {
    expect(NOTIFICATION_STATUSES.find((s) => s.status === "draft")).toBeTruthy();
  });

  it("includes submitted", () => {
    expect(NOTIFICATION_STATUSES.find((s) => s.status === "submitted")).toBeTruthy();
  });

  it("includes acknowledged", () => {
    expect(NOTIFICATION_STATUSES.find((s) => s.status === "acknowledged")).toBeTruthy();
  });

  it("includes follow_up_requested", () => {
    expect(NOTIFICATION_STATUSES.find((s) => s.status === "follow_up_requested")).toBeTruthy();
  });

  it("includes closed", () => {
    expect(NOTIFICATION_STATUSES.find((s) => s.status === "closed")).toBeTruthy();
  });

  it("has human-readable labels for every status", () => {
    for (const entry of NOTIFICATION_STATUSES) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

describe("TIMELINESS_OPTIONS", () => {
  it("contains 5 options", () => {
    expect(TIMELINESS_OPTIONS).toHaveLength(5);
  });

  it("includes within_24_hours", () => {
    expect(TIMELINESS_OPTIONS.find((o) => o.timeliness === "within_24_hours")).toBeTruthy();
  });

  it("includes within_48_hours", () => {
    expect(TIMELINESS_OPTIONS.find((o) => o.timeliness === "within_48_hours")).toBeTruthy();
  });

  it("includes late", () => {
    expect(TIMELINESS_OPTIONS.find((o) => o.timeliness === "late")).toBeTruthy();
  });

  it("includes significantly_late", () => {
    expect(TIMELINESS_OPTIONS.find((o) => o.timeliness === "significantly_late")).toBeTruthy();
  });

  it("includes not_assessed", () => {
    expect(TIMELINESS_OPTIONS.find((o) => o.timeliness === "not_assessed")).toBeTruthy();
  });

  it("has human-readable labels for every option", () => {
    for (const entry of TIMELINESS_OPTIONS) {
      expect(entry.label.length).toBeGreaterThan(0);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeNotificationMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeNotificationMetrics", () => {
  // ── Empty input ────────────────────────────────────────────────────────

  it("returns zero total_notifications for empty array", () => {
    expect(computeNotificationMetrics([]).total_notifications).toBe(0);
  });

  it("returns zero serious_injury_count for empty array", () => {
    expect(computeNotificationMetrics([]).serious_injury_count).toBe(0);
  });

  it("returns zero missing_child_count for empty array", () => {
    expect(computeNotificationMetrics([]).missing_child_count).toBe(0);
  });

  it("returns zero restraint_count for empty array", () => {
    expect(computeNotificationMetrics([]).restraint_count).toBe(0);
  });

  it("returns zero allegation_count for empty array", () => {
    expect(computeNotificationMetrics([]).allegation_count).toBe(0);
  });

  it("returns zero police_involvement_count for empty array", () => {
    expect(computeNotificationMetrics([]).police_involvement_count).toBe(0);
  });

  it("returns zero submitted_rate for empty array", () => {
    expect(computeNotificationMetrics([]).submitted_rate).toBeNull();;
  });

  it("returns zero draft_count for empty array", () => {
    expect(computeNotificationMetrics([]).draft_count).toBe(0);
  });

  it("returns zero acknowledged_count for empty array", () => {
    expect(computeNotificationMetrics([]).acknowledged_count).toBe(0);
  });

  it("returns zero follow_up_pending_count for empty array", () => {
    expect(computeNotificationMetrics([]).follow_up_pending_count).toBe(0);
  });

  it("returns zero within_24_hours_rate for empty array", () => {
    expect(computeNotificationMetrics([]).within_24_hours_rate).toBeNull();;
  });

  it("returns zero late_count for empty array", () => {
    expect(computeNotificationMetrics([]).late_count).toBe(0);
  });

  it("returns zero significantly_late_count for empty array", () => {
    expect(computeNotificationMetrics([]).significantly_late_count).toBe(0);
  });

  it("returns zero evidence_attached_rate for empty array", () => {
    expect(computeNotificationMetrics([]).evidence_attached_rate).toBeNull();;
  });

  it("returns zero reg40_count for empty array", () => {
    expect(computeNotificationMetrics([]).reg40_count).toBe(0);
  });

  it("returns zero reg41_count for empty array", () => {
    expect(computeNotificationMetrics([]).reg41_count).toBe(0);
  });

  it("returns zero follow_up_overdue_count for empty array", () => {
    expect(computeNotificationMetrics([]).follow_up_overdue_count).toBe(0);
  });

  it("returns zero unique_children for empty array", () => {
    expect(computeNotificationMetrics([]).unique_children).toBe(0);
  });

  it("returns empty by_notification_type for empty array", () => {
    expect(computeNotificationMetrics([]).by_notification_type).toEqual({});
  });

  it("returns empty by_notification_status for empty array", () => {
    expect(computeNotificationMetrics([]).by_notification_status).toEqual({});
  });

  it("returns empty by_timeliness for empty array", () => {
    expect(computeNotificationMetrics([]).by_timeliness).toEqual({});
  });

  it("returns empty by_notified_body for empty array", () => {
    expect(computeNotificationMetrics([]).by_notified_body).toEqual({});
  });

  // ── total_notifications ────────────────────────────────────────────────

  it("counts a single record", () => {
    expect(computeNotificationMetrics([makeRecord()]).total_notifications).toBe(1);
  });

  it("counts multiple records", () => {
    const records = [makeRecord(), makeRecord(), makeRecord()];
    expect(computeNotificationMetrics(records).total_notifications).toBe(3);
  });

  // ── Type-specific counts ──────────────────────────────────────────────

  it("counts serious_injury records", () => {
    const records = [
      makeRecord({ notification_type: "serious_injury" }),
      makeRecord({ notification_type: "serious_injury" }),
      makeRecord({ notification_type: "missing_child" }),
    ];
    expect(computeNotificationMetrics(records).serious_injury_count).toBe(2);
  });

  it("counts missing_child records", () => {
    const records = [
      makeRecord({ notification_type: "missing_child" }),
      makeRecord({ notification_type: "restraint" }),
    ];
    expect(computeNotificationMetrics(records).missing_child_count).toBe(1);
  });

  it("counts restraint records", () => {
    const records = [
      makeRecord({ notification_type: "restraint" }),
      makeRecord({ notification_type: "restraint" }),
      makeRecord({ notification_type: "restraint" }),
    ];
    expect(computeNotificationMetrics(records).restraint_count).toBe(3);
  });

  it("counts allegation_against_staff records", () => {
    const records = [
      makeRecord({ notification_type: "allegation_against_staff" }),
    ];
    expect(computeNotificationMetrics(records).allegation_count).toBe(1);
  });

  it("counts police_involvement records", () => {
    const records = [
      makeRecord({ notification_type: "police_involvement" }),
      makeRecord({ notification_type: "police_involvement" }),
    ];
    expect(computeNotificationMetrics(records).police_involvement_count).toBe(2);
  });

  it("returns zero for type counts when no matching types exist", () => {
    const records = [makeRecord({ notification_type: "outbreak" })];
    const m = computeNotificationMetrics(records);
    expect(m.serious_injury_count).toBe(0);
    expect(m.missing_child_count).toBe(0);
    expect(m.restraint_count).toBe(0);
    expect(m.allegation_count).toBe(0);
    expect(m.police_involvement_count).toBe(0);
  });

  // ── submitted_rate ────────────────────────────────────────────────────

  it("returns 100% submitted_rate when all are submitted", () => {
    const records = [
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "acknowledged" }),
    ];
    expect(computeNotificationMetrics(records).submitted_rate).toBe(100);
  });

  it("returns 0% submitted_rate when all are drafts", () => {
    const records = [
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "draft" }),
    ];
    expect(computeNotificationMetrics(records).submitted_rate).toBe(0);
  });

  it("calculates submitted_rate for mixed statuses", () => {
    const records = [
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "acknowledged" }),
    ];
    // 2 non-draft out of 3 = 66.7%
    expect(computeNotificationMetrics(records).submitted_rate).toBe(
      Math.round((2 / 3) * 1000) / 10,
    );
  });

  it("treats closed status as submitted (non-draft)", () => {
    const records = [makeRecord({ notification_status: "closed" })];
    expect(computeNotificationMetrics(records).submitted_rate).toBe(100);
  });

  it("treats follow_up_requested as submitted (non-draft)", () => {
    const records = [makeRecord({ notification_status: "follow_up_requested" })];
    expect(computeNotificationMetrics(records).submitted_rate).toBe(100);
  });

  // ── draft_count ───────────────────────────────────────────────────────

  it("counts draft notifications", () => {
    const records = [
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "submitted" }),
    ];
    expect(computeNotificationMetrics(records).draft_count).toBe(2);
  });

  it("returns zero draft_count when no drafts", () => {
    const records = [makeRecord({ notification_status: "submitted" })];
    expect(computeNotificationMetrics(records).draft_count).toBe(0);
  });

  // ── acknowledged_count ────────────────────────────────────────────────

  it("counts acknowledged notifications", () => {
    const records = [
      makeRecord({ notification_status: "acknowledged" }),
      makeRecord({ notification_status: "acknowledged" }),
      makeRecord({ notification_status: "submitted" }),
    ];
    expect(computeNotificationMetrics(records).acknowledged_count).toBe(2);
  });

  it("returns zero acknowledged_count when none acknowledged", () => {
    const records = [makeRecord({ notification_status: "submitted" })];
    expect(computeNotificationMetrics(records).acknowledged_count).toBe(0);
  });

  // ── follow_up_pending_count ───────────────────────────────────────────

  it("counts follow-up pending (required but not completed)", () => {
    const records = [
      makeRecord({ follow_up_required: true, follow_up_completed: false }),
      makeRecord({ follow_up_required: true, follow_up_completed: false }),
    ];
    expect(computeNotificationMetrics(records).follow_up_pending_count).toBe(2);
  });

  it("excludes completed follow-ups from pending count", () => {
    const records = [
      makeRecord({ follow_up_required: true, follow_up_completed: true }),
    ];
    expect(computeNotificationMetrics(records).follow_up_pending_count).toBe(0);
  });

  it("excludes records with no follow-up required from pending", () => {
    const records = [
      makeRecord({ follow_up_required: false, follow_up_completed: false }),
    ];
    expect(computeNotificationMetrics(records).follow_up_pending_count).toBe(0);
  });

  // ── within_24_hours_rate ──────────────────────────────────────────────

  it("returns 100% within_24_hours_rate when all within 24h", () => {
    const records = [
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "within_24_hours" }),
    ];
    expect(computeNotificationMetrics(records).within_24_hours_rate).toBe(100);
  });

  it("returns 0% within_24_hours_rate when none within 24h", () => {
    const records = [
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "significantly_late" }),
    ];
    expect(computeNotificationMetrics(records).within_24_hours_rate).toBe(0);
  });

  it("calculates within_24_hours_rate for mixed timeliness", () => {
    const records = [
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "within_48_hours" }),
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "within_24_hours" }),
    ];
    // 2 out of 4 = 50%
    expect(computeNotificationMetrics(records).within_24_hours_rate).toBe(50);
  });

  // ── late_count ────────────────────────────────────────────────────────

  it("counts late notifications", () => {
    const records = [
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "within_24_hours" }),
    ];
    expect(computeNotificationMetrics(records).late_count).toBe(2);
  });

  it("returns zero late_count when none late", () => {
    const records = [makeRecord({ timeliness_met: "within_24_hours" })];
    expect(computeNotificationMetrics(records).late_count).toBe(0);
  });

  // ── significantly_late_count ──────────────────────────────────────────

  it("counts significantly late notifications", () => {
    const records = [
      makeRecord({ timeliness_met: "significantly_late" }),
      makeRecord({ timeliness_met: "significantly_late" }),
    ];
    expect(computeNotificationMetrics(records).significantly_late_count).toBe(2);
  });

  it("does not confuse late with significantly_late", () => {
    const records = [
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "late" }),
    ];
    expect(computeNotificationMetrics(records).significantly_late_count).toBe(0);
  });

  // ── evidence_attached_rate ────────────────────────────────────────────

  it("returns 100% evidence_attached_rate when all have evidence", () => {
    const records = [
      makeRecord({ evidence_attached: true }),
      makeRecord({ evidence_attached: true }),
    ];
    expect(computeNotificationMetrics(records).evidence_attached_rate).toBe(100);
  });

  it("returns 0% evidence_attached_rate when none have evidence", () => {
    const records = [
      makeRecord({ evidence_attached: false }),
      makeRecord({ evidence_attached: false }),
    ];
    expect(computeNotificationMetrics(records).evidence_attached_rate).toBe(0);
  });

  it("calculates evidence_attached_rate for mixed evidence", () => {
    const records = [
      makeRecord({ evidence_attached: true }),
      makeRecord({ evidence_attached: false }),
      makeRecord({ evidence_attached: true }),
    ];
    // 2 out of 3 = 66.7%
    expect(computeNotificationMetrics(records).evidence_attached_rate).toBe(
      Math.round((2 / 3) * 1000) / 10,
    );
  });

  // ── reg40_count ───────────────────────────────────────────────────────

  it("counts Reg 40 applicable records", () => {
    const records = [
      makeRecord({ reg40_applicable: true }),
      makeRecord({ reg40_applicable: true }),
      makeRecord({ reg40_applicable: false }),
    ];
    expect(computeNotificationMetrics(records).reg40_count).toBe(2);
  });

  it("returns zero reg40_count when none applicable", () => {
    const records = [makeRecord({ reg40_applicable: false })];
    expect(computeNotificationMetrics(records).reg40_count).toBe(0);
  });

  // ── reg41_count ───────────────────────────────────────────────────────

  it("counts Reg 41 applicable records", () => {
    const records = [
      makeRecord({ reg41_applicable: true }),
      makeRecord({ reg41_applicable: false }),
    ];
    expect(computeNotificationMetrics(records).reg41_count).toBe(1);
  });

  it("returns zero reg41_count when none applicable", () => {
    const records = [makeRecord({ reg41_applicable: false })];
    expect(computeNotificationMetrics(records).reg41_count).toBe(0);
  });

  // ── follow_up_overdue_count ───────────────────────────────────────────

  it("counts overdue follow-ups (past date, not completed)", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
    ];
    expect(computeNotificationMetrics(records).follow_up_overdue_count).toBe(1);
  });

  it("excludes completed follow-ups from overdue count", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: PAST_DATE,
        follow_up_completed: true,
      }),
    ];
    expect(computeNotificationMetrics(records).follow_up_overdue_count).toBe(0);
  });

  it("excludes future follow-up dates from overdue count", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: FUTURE_DATE,
        follow_up_completed: false,
      }),
    ];
    expect(computeNotificationMetrics(records).follow_up_overdue_count).toBe(0);
  });

  it("excludes records with null follow_up_date from overdue count", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    expect(computeNotificationMetrics(records).follow_up_overdue_count).toBe(0);
  });

  it("counts multiple overdue follow-ups", () => {
    const records = [
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: true }),
    ];
    expect(computeNotificationMetrics(records).follow_up_overdue_count).toBe(2);
  });

  // ── unique_children ───────────────────────────────────────────────────

  it("counts unique children from child_name", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: "Bob" }),
      makeRecord({ child_name: "Alice" }),
    ];
    expect(computeNotificationMetrics(records).unique_children).toBe(2);
  });

  it("returns zero unique_children when all child_name are null", () => {
    const records = [makeRecord(), makeRecord()];
    expect(computeNotificationMetrics(records).unique_children).toBe(0);
  });

  it("excludes null child_name from unique set", () => {
    const records = [
      makeRecord({ child_name: "Alice" }),
      makeRecord({ child_name: null }),
    ];
    expect(computeNotificationMetrics(records).unique_children).toBe(1);
  });

  it("counts single child as 1 unique", () => {
    const records = [
      makeRecord({ child_name: "Zara" }),
      makeRecord({ child_name: "Zara" }),
      makeRecord({ child_name: "Zara" }),
    ];
    expect(computeNotificationMetrics(records).unique_children).toBe(1);
  });

  // ── by_notification_type ──────────────────────────────────────────────

  it("groups records by notification_type", () => {
    const records = [
      makeRecord({ notification_type: "serious_injury" }),
      makeRecord({ notification_type: "serious_injury" }),
      makeRecord({ notification_type: "restraint" }),
    ];
    const result = computeNotificationMetrics(records).by_notification_type;
    expect(result["serious_injury"]).toBe(2);
    expect(result["restraint"]).toBe(1);
  });

  it("creates one key per type in by_notification_type", () => {
    const records = [
      makeRecord({ notification_type: "death" }),
      makeRecord({ notification_type: "outbreak" }),
    ];
    const result = computeNotificationMetrics(records).by_notification_type;
    expect(Object.keys(result)).toHaveLength(2);
    expect(result["death"]).toBe(1);
    expect(result["outbreak"]).toBe(1);
  });

  it("does not include types with zero records in by_notification_type", () => {
    const records = [makeRecord({ notification_type: "restraint" })];
    const result = computeNotificationMetrics(records).by_notification_type;
    expect(result["serious_injury"]).toBeUndefined();
  });

  // ── by_notification_status ────────────────────────────────────────────

  it("groups records by notification_status", () => {
    const records = [
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "draft" }),
    ];
    const result = computeNotificationMetrics(records).by_notification_status;
    expect(result["submitted"]).toBe(2);
    expect(result["draft"]).toBe(1);
  });

  it("handles all five statuses in by_notification_status", () => {
    const records = [
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "acknowledged" }),
      makeRecord({ notification_status: "follow_up_requested" }),
      makeRecord({ notification_status: "closed" }),
    ];
    const result = computeNotificationMetrics(records).by_notification_status;
    expect(Object.keys(result)).toHaveLength(5);
  });

  // ── by_timeliness ────────────────────────────────────────────────────

  it("groups records by timeliness_met", () => {
    const records = [
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "late" }),
    ];
    const result = computeNotificationMetrics(records).by_timeliness;
    expect(result["within_24_hours"]).toBe(2);
    expect(result["late"]).toBe(1);
  });

  it("handles all five timeliness options in by_timeliness", () => {
    const records = [
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "within_48_hours" }),
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "significantly_late" }),
      makeRecord({ timeliness_met: "not_assessed" }),
    ];
    const result = computeNotificationMetrics(records).by_timeliness;
    expect(Object.keys(result)).toHaveLength(5);
  });

  // ── by_notified_body ──────────────────────────────────────────────────

  it("groups records by notified_bodies (array iteration)", () => {
    const records = [
      makeRecord({ notified_bodies: ["ofsted", "police"] }),
      makeRecord({ notified_bodies: ["ofsted"] }),
    ];
    const result = computeNotificationMetrics(records).by_notified_body;
    expect(result["ofsted"]).toBe(2);
    expect(result["police"]).toBe(1);
  });

  it("counts each body in multi-body notifications", () => {
    const records = [
      makeRecord({ notified_bodies: ["ofsted", "local_authority", "lado"] }),
    ];
    const result = computeNotificationMetrics(records).by_notified_body;
    expect(result["ofsted"]).toBe(1);
    expect(result["local_authority"]).toBe(1);
    expect(result["lado"]).toBe(1);
  });

  it("handles empty notified_bodies array", () => {
    const records = [makeRecord({ notified_bodies: [] })];
    const result = computeNotificationMetrics(records).by_notified_body;
    expect(result).toEqual({});
  });

  it("accumulates body counts across many records", () => {
    const records = [
      makeRecord({ notified_bodies: ["ofsted", "police"] }),
      makeRecord({ notified_bodies: ["police", "local_authority"] }),
      makeRecord({ notified_bodies: ["ofsted", "police"] }),
    ];
    const result = computeNotificationMetrics(records).by_notified_body;
    expect(result["ofsted"]).toBe(2);
    expect(result["police"]).toBe(3);
    expect(result["local_authority"]).toBe(1);
  });

  // ── Rate calculation precision ────────────────────────────────────────

  it("applies Math.round(value * 1000) / 10 for submitted_rate", () => {
    // 1 non-draft out of 3 = 33.333... → 33.3
    const records = [
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "draft" }),
    ];
    expect(computeNotificationMetrics(records).submitted_rate).toBe(
      Math.round((1 / 3) * 1000) / 10,
    );
  });

  it("applies Math.round(value * 1000) / 10 for within_24_hours_rate", () => {
    // 1 within_24h out of 3
    const records = [
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "late" }),
    ];
    expect(computeNotificationMetrics(records).within_24_hours_rate).toBe(
      Math.round((1 / 3) * 1000) / 10,
    );
  });

  it("applies Math.round(value * 1000) / 10 for evidence_attached_rate", () => {
    // 1 with evidence out of 3
    const records = [
      makeRecord({ evidence_attached: true }),
      makeRecord({ evidence_attached: false }),
      makeRecord({ evidence_attached: false }),
    ];
    expect(computeNotificationMetrics(records).evidence_attached_rate).toBe(
      Math.round((1 / 3) * 1000) / 10,
    );
  });

  // ── Mixed / comprehensive dataset ────────────────────────────────────

  it("computes all fields correctly for a mixed dataset", () => {
    const records = [
      makeRecord({
        notification_type: "serious_injury",
        notification_status: "submitted",
        timeliness_met: "within_24_hours",
        evidence_attached: true,
        reg40_applicable: true,
        reg41_applicable: false,
        follow_up_required: true,
        follow_up_completed: false,
        follow_up_date: PAST_DATE,
        child_name: "Alice",
        notified_bodies: ["ofsted", "local_authority"],
      }),
      makeRecord({
        notification_type: "missing_child",
        notification_status: "draft",
        timeliness_met: "late",
        evidence_attached: false,
        reg40_applicable: false,
        reg41_applicable: true,
        follow_up_required: false,
        child_name: "Bob",
        notified_bodies: ["police"],
      }),
      makeRecord({
        notification_type: "serious_injury",
        notification_status: "acknowledged",
        timeliness_met: "significantly_late",
        evidence_attached: true,
        reg40_applicable: true,
        reg41_applicable: true,
        follow_up_required: true,
        follow_up_completed: true,
        follow_up_date: PAST_DATE,
        child_name: "Alice",
        notified_bodies: ["ofsted"],
      }),
    ];

    const m = computeNotificationMetrics(records);

    expect(m.total_notifications).toBe(3);
    expect(m.serious_injury_count).toBe(2);
    expect(m.missing_child_count).toBe(1);
    expect(m.restraint_count).toBe(0);
    expect(m.allegation_count).toBe(0);
    expect(m.police_involvement_count).toBe(0);
    // 2 non-draft out of 3
    expect(m.submitted_rate).toBe(Math.round((2 / 3) * 1000) / 10);
    expect(m.draft_count).toBe(1);
    expect(m.acknowledged_count).toBe(1);
    // 1 pending (required + not completed)
    expect(m.follow_up_pending_count).toBe(1);
    // 1 within_24h out of 3
    expect(m.within_24_hours_rate).toBe(Math.round((1 / 3) * 1000) / 10);
    expect(m.late_count).toBe(1);
    expect(m.significantly_late_count).toBe(1);
    // 2 with evidence out of 3
    expect(m.evidence_attached_rate).toBe(Math.round((2 / 3) * 1000) / 10);
    expect(m.reg40_count).toBe(2);
    expect(m.reg41_count).toBe(2);
    // 1 overdue (past date, not completed)
    expect(m.follow_up_overdue_count).toBe(1);
    // Alice and Bob
    expect(m.unique_children).toBe(2);
    expect(m.by_notification_type).toEqual({
      serious_injury: 2,
      missing_child: 1,
    });
    expect(m.by_notification_status).toEqual({
      submitted: 1,
      draft: 1,
      acknowledged: 1,
    });
    expect(m.by_timeliness).toEqual({
      within_24_hours: 1,
      late: 1,
      significantly_late: 1,
    });
    expect(m.by_notified_body).toEqual({
      ofsted: 2,
      local_authority: 1,
      police: 1,
    });
  });

  // ── Large dataset ─────────────────────────────────────────────────────

  it("handles a large dataset of 100 records", () => {
    const records: NotificationRecord[] = [];
    for (let i = 0; i < 100; i++) {
      records.push(
        makeRecord({
          notification_type: i < 30 ? "restraint" : "significant_event",
          notification_status: i < 10 ? "draft" : "submitted",
          timeliness_met: i < 50 ? "within_24_hours" : "late",
          evidence_attached: i < 80,
          child_name: `Child-${i % 5}`,
        }),
      );
    }
    const m = computeNotificationMetrics(records);
    expect(m.total_notifications).toBe(100);
    expect(m.restraint_count).toBe(30);
    expect(m.draft_count).toBe(10);
    expect(m.submitted_rate).toBe(90);
    expect(m.within_24_hours_rate).toBe(50);
    expect(m.late_count).toBe(50);
    expect(m.evidence_attached_rate).toBe(80);
    expect(m.unique_children).toBe(5);
  });

  // ── Single record with all fields ─────────────────────────────────────

  it("computes metrics for a single fully-populated record", () => {
    const record = makeRecord({
      notification_type: "death",
      notification_status: "closed",
      timeliness_met: "within_48_hours",
      evidence_attached: true,
      reg40_applicable: true,
      reg41_applicable: true,
      follow_up_required: true,
      follow_up_completed: true,
      follow_up_date: PAST_DATE,
      child_name: "Zara",
      notified_bodies: ["ofsted", "police", "dfe"],
    });
    const m = computeNotificationMetrics([record]);
    expect(m.total_notifications).toBe(1);
    expect(m.submitted_rate).toBe(100);
    expect(m.within_24_hours_rate).toBe(0);
    expect(m.evidence_attached_rate).toBe(100);
    expect(m.reg40_count).toBe(1);
    expect(m.reg41_count).toBe(1);
    expect(m.follow_up_overdue_count).toBe(0);
    expect(m.unique_children).toBe(1);
    expect(m.by_notified_body).toEqual({ ofsted: 1, police: 1, dfe: 1 });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyNotificationAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyNotificationAlerts", () => {
  // ── No alerts ─────────────────────────────────────────────────────────

  it("returns empty alerts for empty records", () => {
    expect(identifyNotificationAlerts([])).toEqual([]);
  });

  it("returns empty alerts for fully compliant records", () => {
    const records = [
      makeRecord({
        notification_status: "submitted",
        timeliness_met: "within_24_hours",
        evidence_attached: true,
        follow_up_required: false,
      }),
    ];
    expect(identifyNotificationAlerts(records)).toEqual([]);
  });

  // ── significantly_late (critical, per-record) ─────────────────────────

  it("generates critical alert for a significantly late notification", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_type: "serious_injury",
        notification_date: "2026-04-15",
      }),
    ];
    const alerts = identifyNotificationAlerts(records);
    const sigLate = alerts.filter((a) => a.type === "significantly_late");
    expect(sigLate).toHaveLength(1);
    expect(sigLate[0].severity).toBe("critical");
  });

  it("includes notification_type in significantly_late message", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_type: "missing_child",
        notification_date: "2026-05-01",
      }),
    ];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "significantly_late",
    )!;
    expect(alert.message).toContain("missing child");
  });

  it("includes notification_date in significantly_late message", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_date: "2026-03-20",
      }),
    ];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "significantly_late",
    )!;
    expect(alert.message).toContain("2026-03-20");
  });

  it("replaces underscores with spaces in notification_type in message", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_type: "allegation_against_staff",
        notification_date: "2026-04-01",
      }),
    ];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "significantly_late",
    )!;
    expect(alert.message).toContain("allegation against staff");
  });

  it("uses the record id for significantly_late alert id", () => {
    const records = [
      makeRecord({
        id: "my-unique-id",
        timeliness_met: "significantly_late",
      }),
    ];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "significantly_late",
    )!;
    expect(alert.id).toBe("my-unique-id");
  });

  it("generates separate alerts for each significantly late record", () => {
    const records = [
      makeRecord({ timeliness_met: "significantly_late", id: "a" }),
      makeRecord({ timeliness_met: "significantly_late", id: "b" }),
      makeRecord({ timeliness_met: "significantly_late", id: "c" }),
    ];
    const sigLate = identifyNotificationAlerts(records).filter(
      (a) => a.type === "significantly_late",
    );
    expect(sigLate).toHaveLength(3);
    expect(sigLate.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });

  it("does not generate significantly_late alert for late timeliness", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const sigLate = identifyNotificationAlerts(records).filter(
      (a) => a.type === "significantly_late",
    );
    expect(sigLate).toHaveLength(0);
  });

  it("does not generate significantly_late alert for within_24_hours", () => {
    const records = [makeRecord({ timeliness_met: "within_24_hours" })];
    const sigLate = identifyNotificationAlerts(records).filter(
      (a) => a.type === "significantly_late",
    );
    expect(sigLate).toHaveLength(0);
  });

  it("does not generate significantly_late alert for within_48_hours", () => {
    const records = [makeRecord({ timeliness_met: "within_48_hours" })];
    const sigLate = identifyNotificationAlerts(records).filter(
      (a) => a.type === "significantly_late",
    );
    expect(sigLate).toHaveLength(0);
  });

  it("does not generate significantly_late alert for not_assessed", () => {
    const records = [makeRecord({ timeliness_met: "not_assessed" })];
    const sigLate = identifyNotificationAlerts(records).filter(
      (a) => a.type === "significantly_late",
    );
    expect(sigLate).toHaveLength(0);
  });

  // ── draft_not_submitted (high, aggregate) ─────────────────────────────

  it("generates high alert for 1 draft notification", () => {
    const records = [makeRecord({ notification_status: "draft" })];
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    );
    expect(draft).toBeDefined();
    expect(draft!.severity).toBe("high");
  });

  it("uses singular wording for 1 draft", () => {
    const records = [makeRecord({ notification_status: "draft" })];
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    )!;
    expect(draft.message).toContain("1 notification is");
  });

  it("uses plural wording for 2 drafts", () => {
    const records = [
      makeRecord({ notification_status: "draft" }),
      makeRecord({ notification_status: "draft" }),
    ];
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    )!;
    expect(draft.message).toContain("2 notifications are");
  });

  it("uses plural wording for 5 drafts", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ notification_status: "draft" }),
    );
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    )!;
    expect(draft.message).toContain("5 notifications are");
  });

  it("includes 'still in draft' in draft alert message", () => {
    const records = [makeRecord({ notification_status: "draft" })];
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    )!;
    expect(draft.message).toContain("still in draft");
  });

  it("uses 'draft_not_submitted' as alert id for draft alerts", () => {
    const records = [makeRecord({ notification_status: "draft" })];
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    )!;
    expect(draft.id).toBe("draft_not_submitted");
  });

  it("does not generate draft alert when no drafts exist", () => {
    const records = [
      makeRecord({ notification_status: "submitted" }),
      makeRecord({ notification_status: "acknowledged" }),
    ];
    const draft = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    );
    expect(draft).toBeUndefined();
  });

  it("generates exactly one draft alert regardless of draft count", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ notification_status: "draft" }),
    );
    const drafts = identifyNotificationAlerts(records).filter(
      (a) => a.type === "draft_not_submitted",
    );
    expect(drafts).toHaveLength(1);
  });

  // ── late_notification (high, aggregate) ───────────────────────────────

  it("generates high alert for 1 late notification", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    );
    expect(late).toBeDefined();
    expect(late!.severity).toBe("high");
  });

  it("uses singular wording for 1 late notification", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    )!;
    expect(late.message).toContain("1 notification was");
  });

  it("uses plural wording for 2 late notifications", () => {
    const records = [
      makeRecord({ timeliness_met: "late" }),
      makeRecord({ timeliness_met: "late" }),
    ];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    )!;
    expect(late.message).toContain("2 notifications were");
  });

  it("uses plural wording for 7 late notifications", () => {
    const records = Array.from({ length: 7 }, () =>
      makeRecord({ timeliness_met: "late" }),
    );
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    )!;
    expect(late.message).toContain("7 notifications were");
  });

  it("includes 'submitted late' in late notification message", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    )!;
    expect(late.message).toContain("submitted late");
  });

  it("uses 'late_notification' as alert id", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    )!;
    expect(late.id).toBe("late_notification");
  });

  it("does not generate late alert when no late notifications", () => {
    const records = [
      makeRecord({ timeliness_met: "within_24_hours" }),
      makeRecord({ timeliness_met: "within_48_hours" }),
    ];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    );
    expect(late).toBeUndefined();
  });

  it("does not count significantly_late as late for this alert", () => {
    const records = [makeRecord({ timeliness_met: "significantly_late" })];
    const late = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    );
    expect(late).toBeUndefined();
  });

  it("generates exactly one late_notification alert regardless of count", () => {
    const records = Array.from({ length: 8 }, () =>
      makeRecord({ timeliness_met: "late" }),
    );
    const lates = identifyNotificationAlerts(records).filter(
      (a) => a.type === "late_notification",
    );
    expect(lates).toHaveLength(1);
  });

  // ── follow_up_overdue (high, aggregate) ───────────────────────────────

  it("generates high alert for 1 overdue follow-up", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    );
    expect(fu).toBeDefined();
    expect(fu!.severity).toBe("high");
  });

  it("uses singular wording for 1 overdue follow-up", () => {
    const records = [
      makeRecord({
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(fu.message).toContain("1 notification follow-up is");
  });

  it("uses plural wording for 2 overdue follow-ups", () => {
    const records = [
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(fu.message).toContain("2 notification follow-ups are");
  });

  it("uses plural wording for 4 overdue follow-ups", () => {
    const records = Array.from({ length: 4 }, () =>
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    );
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(fu.message).toContain("4 notification follow-ups are");
  });

  it("includes 'overdue' in follow-up overdue message", () => {
    const records = [
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(fu.message).toContain("overdue");
  });

  it("uses 'follow_up_overdue' as alert id", () => {
    const records = [
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(fu.id).toBe("follow_up_overdue");
  });

  it("excludes completed follow-ups from overdue alert", () => {
    const records = [
      makeRecord({
        follow_up_date: PAST_DATE,
        follow_up_completed: true,
      }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    );
    expect(fu).toBeUndefined();
  });

  it("excludes future follow-up dates from overdue alert", () => {
    const records = [
      makeRecord({
        follow_up_date: FUTURE_DATE,
        follow_up_completed: false,
      }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    );
    expect(fu).toBeUndefined();
  });

  it("excludes null follow_up_date from overdue alert", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: null,
        follow_up_completed: false,
      }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    );
    expect(fu).toBeUndefined();
  });

  it("generates exactly one follow_up_overdue alert regardless of count", () => {
    const records = Array.from({ length: 6 }, () =>
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    );
    const fus = identifyNotificationAlerts(records).filter(
      (a) => a.type === "follow_up_overdue",
    );
    expect(fus).toHaveLength(1);
  });

  // ── no_evidence (medium, threshold ≥ 2, excludes drafts) ─────────────

  it("generates medium alert when 2 submitted notifications lack evidence", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "acknowledged",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    );
    expect(noEv).toBeDefined();
    expect(noEv!.severity).toBe("medium");
  });

  it("does not generate no_evidence alert for only 1 missing evidence", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    );
    expect(noEv).toBeUndefined();
  });

  it("excludes drafts from no_evidence count", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "draft",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "draft",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    );
    expect(noEv).toBeUndefined();
  });

  it("counts only non-draft records without evidence", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "draft",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "acknowledged",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    )!;
    // 2 non-draft without evidence
    expect(noEv.message).toContain("2 submitted notifications");
  });

  it("includes correct count in no_evidence message", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
    );
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    )!;
    expect(noEv.message).toContain("5 submitted notifications");
  });

  it("includes 'without evidence attached' in no_evidence message", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "closed",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    )!;
    expect(noEv.message).toContain("without evidence attached");
  });

  it("uses 'no_evidence' as alert id", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    )!;
    expect(noEv.id).toBe("no_evidence");
  });

  it("does not generate no_evidence alert when all have evidence", () => {
    const records = [
      makeRecord({ evidence_attached: true, notification_status: "submitted" }),
      makeRecord({ evidence_attached: true, notification_status: "submitted" }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    );
    expect(noEv).toBeUndefined();
  });

  it("generates exactly one no_evidence alert regardless of count", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
    );
    const noEvs = identifyNotificationAlerts(records).filter(
      (a) => a.type === "no_evidence",
    );
    expect(noEvs).toHaveLength(1);
  });

  // ── Alert ordering ────────────────────────────────────────────────────

  it("places significantly_late alerts before other alerts", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_status: "draft",
      }),
    ];
    const alerts = identifyNotificationAlerts(records);
    expect(alerts[0].type).toBe("significantly_late");
  });

  it("places draft_not_submitted after significantly_late", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_status: "draft",
      }),
    ];
    const alerts = identifyNotificationAlerts(records);
    const types = alerts.map((a) => a.type);
    const sigIdx = types.indexOf("significantly_late");
    const draftIdx = types.indexOf("draft_not_submitted");
    expect(sigIdx).toBeLessThan(draftIdx);
  });

  // ── Combined alert scenarios ──────────────────────────────────────────

  it("generates multiple alert types simultaneously", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_status: "draft",
        evidence_attached: false,
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
      makeRecord({
        timeliness_met: "late",
        notification_status: "submitted",
        evidence_attached: false,
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
      makeRecord({
        timeliness_met: "within_24_hours",
        notification_status: "submitted",
        evidence_attached: false,
        follow_up_date: FUTURE_DATE,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyNotificationAlerts(records);
    const types = alerts.map((a) => a.type);
    expect(types).toContain("significantly_late");
    expect(types).toContain("draft_not_submitted");
    expect(types).toContain("late_notification");
    expect(types).toContain("follow_up_overdue");
    expect(types).toContain("no_evidence");
  });

  it("generates all five alert types with correct severities", () => {
    const records = [
      makeRecord({
        timeliness_met: "significantly_late",
        notification_status: "draft",
        evidence_attached: false,
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
      makeRecord({
        timeliness_met: "late",
        notification_status: "submitted",
        evidence_attached: false,
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
      makeRecord({
        timeliness_met: "within_24_hours",
        notification_status: "submitted",
        evidence_attached: false,
        follow_up_date: FUTURE_DATE,
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyNotificationAlerts(records);

    const sigLate = alerts.find((a) => a.type === "significantly_late");
    const draftAlert = alerts.find((a) => a.type === "draft_not_submitted");
    const lateAlert = alerts.find((a) => a.type === "late_notification");
    const fuAlert = alerts.find((a) => a.type === "follow_up_overdue");
    const noEvAlert = alerts.find((a) => a.type === "no_evidence");

    expect(sigLate!.severity).toBe("critical");
    expect(draftAlert!.severity).toBe("high");
    expect(lateAlert!.severity).toBe("high");
    expect(fuAlert!.severity).toBe("high");
    expect(noEvAlert!.severity).toBe("medium");
  });

  it("does not generate any alerts for a fully compliant dataset", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({
        notification_status: "acknowledged",
        timeliness_met: "within_24_hours",
        evidence_attached: true,
        follow_up_required: false,
      }),
    );
    expect(identifyNotificationAlerts(records)).toEqual([]);
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  it("handles record with empty notified_bodies for alerts", () => {
    const records = [makeRecord({ notified_bodies: [] })];
    // Should not crash; no alerts for compliant record
    expect(() => identifyNotificationAlerts(records)).not.toThrow();
  });

  it("handles records mixing null and non-null follow_up_date", () => {
    const records = [
      makeRecord({
        follow_up_date: null,
        follow_up_completed: false,
      }),
      makeRecord({
        follow_up_date: PAST_DATE,
        follow_up_completed: false,
      }),
    ];
    const fu = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(fu.message).toContain("1 notification follow-up is");
  });

  it("threshold: 1 non-draft without evidence does not trigger no_evidence", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: true,
        notification_status: "submitted",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    );
    expect(noEv).toBeUndefined();
  });

  it("threshold: exactly 2 non-draft without evidence triggers no_evidence", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "closed",
      }),
    ];
    const noEv = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    );
    expect(noEv).toBeDefined();
  });

  it("handles large dataset with many alert conditions", () => {
    const records: NotificationRecord[] = [];
    // 5 significantly late
    for (let i = 0; i < 5; i++) {
      records.push(
        makeRecord({
          timeliness_met: "significantly_late",
          notification_status: "submitted",
          evidence_attached: false,
        }),
      );
    }
    // 3 drafts
    for (let i = 0; i < 3; i++) {
      records.push(makeRecord({ notification_status: "draft" }));
    }
    // 4 late
    for (let i = 0; i < 4; i++) {
      records.push(
        makeRecord({
          timeliness_met: "late",
          notification_status: "submitted",
        }),
      );
    }
    // 2 overdue follow-ups
    records.push(
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    );
    records.push(
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    );

    const alerts = identifyNotificationAlerts(records);

    const sigLates = alerts.filter((a) => a.type === "significantly_late");
    expect(sigLates).toHaveLength(5);

    const drafts = alerts.filter((a) => a.type === "draft_not_submitted");
    expect(drafts).toHaveLength(1);
    expect(drafts[0].message).toContain("3 notifications are");

    const lates = alerts.filter((a) => a.type === "late_notification");
    expect(lates).toHaveLength(1);
    expect(lates[0].message).toContain("4 notifications were");

    const fus = alerts.filter((a) => a.type === "follow_up_overdue");
    expect(fus).toHaveLength(1);
    expect(fus[0].message).toContain("2 notification follow-ups are");

    // 5 significantly_late non-draft without evidence = triggers no_evidence
    const noEvs = alerts.filter((a) => a.type === "no_evidence");
    expect(noEvs).toHaveLength(1);
  });

  it("message includes 'review notification procedures' for significantly_late", () => {
    const records = [makeRecord({ timeliness_met: "significantly_late" })];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "significantly_late",
    )!;
    expect(alert.message).toContain("review notification procedures");
  });

  it("message includes 'submit without delay' for draft_not_submitted", () => {
    const records = [makeRecord({ notification_status: "draft" })];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "draft_not_submitted",
    )!;
    expect(alert.message).toContain("submit without delay");
  });

  it("message includes 'improve timeliness' for late_notification", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "late_notification",
    )!;
    expect(alert.message).toContain("improve timeliness");
  });

  it("message includes 'complete promptly' for follow_up_overdue", () => {
    const records = [
      makeRecord({ follow_up_date: PAST_DATE, follow_up_completed: false }),
    ];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "follow_up_overdue",
    )!;
    expect(alert.message).toContain("complete promptly");
  });

  it("message includes 'gather and attach documentation' for no_evidence", () => {
    const records = [
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
      makeRecord({
        evidence_attached: false,
        notification_status: "submitted",
      }),
    ];
    const alert = identifyNotificationAlerts(records).find(
      (a) => a.type === "no_evidence",
    )!;
    expect(alert.message).toContain("gather and attach documentation");
  });
});
