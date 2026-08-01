import { describe, it, expect } from "vitest";
import {
  computeNotificationMetrics,
  identifyNotificationAlerts,
  type NotificationRecord,
} from "./notifications-register-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeRecord(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: "nr-1",
    home_id: "home-1",
    notification_type: "serious_injury",
    event_date: "2026-05-19",
    notification_date: "2026-05-19",
    notified_bodies: ["ofsted", "local_authority"],
    notification_status: "submitted",
    timeliness_met: "within_24_hours",
    child_name: "Alex Taylor",
    child_id: "child-1",
    staff_name: null,
    ofsted_reference: "REF-001",
    description: "Fall from trampoline",
    outcome: "Recovered",
    follow_up_required: false,
    follow_up_date: null,
    follow_up_completed: false,
    evidence_attached: true,
    reg40_applicable: true,
    reg41_applicable: true,
    submitted_by: "Manager",
    approved_by: "RI",
    issues_found: [],
    actions_taken: [],
    notes: null,
    created_at: "2026-05-19T10:00:00Z",
    updated_at: "2026-05-19T10:00:00Z",
    ...overrides,
  };
}

// ── computeNotificationMetrics ─────────────────────────────────────────

describe("computeNotificationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeNotificationMetrics([]);
    expect(m.total_notifications).toBe(0);
    expect(m.submitted_rate).toBeNull();;
    expect(m.within_24_hours_rate).toBeNull();;
    expect(m.evidence_attached_rate).toBeNull();;
    expect(m.unique_children).toBe(0);
  });

  it("computes counts and rates for populated data", () => {
    const records = [
      makeRecord({ id: "nr-1", notification_type: "serious_injury", timeliness_met: "within_24_hours", notification_status: "submitted", evidence_attached: true }),
      makeRecord({ id: "nr-2", notification_type: "missing_child", timeliness_met: "late", notification_status: "draft", evidence_attached: false }),
      makeRecord({ id: "nr-3", notification_type: "restraint", timeliness_met: "significantly_late", notification_status: "acknowledged", evidence_attached: true }),
    ];
    const m = computeNotificationMetrics(records);
    expect(m.total_notifications).toBe(3);
    expect(m.serious_injury_count).toBe(1);
    expect(m.missing_child_count).toBe(1);
    expect(m.restraint_count).toBe(1);
    expect(m.draft_count).toBe(1);
    expect(m.acknowledged_count).toBe(1);
    expect(m.late_count).toBe(1);
    expect(m.significantly_late_count).toBe(1);
    // 2 of 3 submitted (non-draft)
    expect(m.submitted_rate).toBe(66.7);
    // 1 of 3 within_24_hours
    expect(m.within_24_hours_rate).toBe(33.3);
    // 2 of 3 evidence attached
    expect(m.evidence_attached_rate).toBe(66.7);
  });

  it("counts follow-up overdue", () => {
    const records = [
      makeRecord({
        id: "nr-1",
        follow_up_required: true,
        follow_up_date: "2026-04-01", // past
        follow_up_completed: false,
      }),
      makeRecord({
        id: "nr-2",
        follow_up_required: true,
        follow_up_date: "2027-01-01", // future
        follow_up_completed: false,
      }),
    ];
    const m = computeNotificationMetrics(records);
    expect(m.follow_up_overdue_count).toBe(1);
  });

  it("counts reg40 and reg41 records", () => {
    const records = [
      makeRecord({ id: "nr-1", reg40_applicable: true, reg41_applicable: false }),
      makeRecord({ id: "nr-2", reg40_applicable: false, reg41_applicable: true }),
    ];
    const m = computeNotificationMetrics(records);
    expect(m.reg40_count).toBe(1);
    expect(m.reg41_count).toBe(1);
  });
});

// ── identifyNotificationAlerts ─────────────────────────────────────────

describe("identifyNotificationAlerts", () => {
  it("returns no alerts for empty data", () => {
    expect(identifyNotificationAlerts([])).toHaveLength(0);
  });

  it("flags significantly_late (critical)", () => {
    const records = [makeRecord({ timeliness_met: "significantly_late" })];
    const alerts = identifyNotificationAlerts(records);
    const found = alerts.filter((a) => a.type === "significantly_late");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("critical");
  });

  it("flags draft_not_submitted (high) when >= 1 draft", () => {
    const records = [makeRecord({ notification_status: "draft" })];
    const alerts = identifyNotificationAlerts(records);
    const found = alerts.filter((a) => a.type === "draft_not_submitted");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags late_notification (high) when >= 1 late", () => {
    const records = [makeRecord({ timeliness_met: "late" })];
    const alerts = identifyNotificationAlerts(records);
    const found = alerts.filter((a) => a.type === "late_notification");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags follow_up_overdue (high) when follow-up date passed and not completed", () => {
    const records = [
      makeRecord({
        follow_up_required: true,
        follow_up_date: "2026-04-01",
        follow_up_completed: false,
      }),
    ];
    const alerts = identifyNotificationAlerts(records);
    const found = alerts.filter((a) => a.type === "follow_up_overdue");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("high");
  });

  it("flags no_evidence (medium) when >= 2 submitted notifications without evidence", () => {
    const records = [
      makeRecord({ id: "nr-1", notification_status: "submitted", evidence_attached: false }),
      makeRecord({ id: "nr-2", notification_status: "acknowledged", evidence_attached: false }),
    ];
    const alerts = identifyNotificationAlerts(records);
    const found = alerts.filter((a) => a.type === "no_evidence");
    expect(found.length).toBe(1);
    expect(found[0].severity).toBe("medium");
  });

  it("does NOT flag no_evidence when only 1 submitted without evidence", () => {
    const records = [
      makeRecord({ id: "nr-1", notification_status: "submitted", evidence_attached: false }),
    ];
    const alerts = identifyNotificationAlerts(records);
    const found = alerts.filter((a) => a.type === "no_evidence");
    expect(found).toHaveLength(0);
  });
});
