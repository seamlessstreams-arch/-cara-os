// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — COMPLAINTS & NOTIFICATIONS SERVICE TESTS
// Pure-function tests for complaint summaries, Reg 40 notification compliance,
// complaint trends, alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../complaints-service";
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_SOURCES,
  REG40_NOTIFICATION_TYPES,
  COMPLAINT_STAGES,
} from "../complaints-service";
import type { Complaint, Reg40Notification } from "../complaints-service";

const {
  computeComplaintsSummary,
  computeNotificationCompliance,
  computeComplaintTrends,
  identifyComplaintAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal complaint with sensible defaults. */
function complaint(
  overrides: Partial<{
    id: string;
    home_id: string;
    complaint_category: string;
    source: string;
    complainant_name: string;
    child_id: string | null;
    staff_id: string | null;
    date_received: string;
    date_acknowledged: string | null;
    date_responded: string | null;
    stage: string;
    description: string;
    desired_outcome: string | null;
    investigation_notes: string | null;
    outcome: string | null;
    actions_taken: string[];
    lessons_learned: string | null;
    complainant_satisfied: boolean | null;
    advocacy_offered: boolean;
    status: string;
    created_at: string;
    updated_at: string;
  }> = {},
): Complaint {
  return {
    id: "id" in overrides ? overrides.id! : "comp-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    complaint_category: "complaint_category" in overrides ? overrides.complaint_category! : "care_quality",
    source: "source" in overrides ? overrides.source! : "parent",
    complainant_name: "complainant_name" in overrides ? overrides.complainant_name! : "Jane Smith",
    child_id: "child_id" in overrides ? overrides.child_id! : null,
    staff_id: "staff_id" in overrides ? overrides.staff_id! : null,
    date_received: "date_received" in overrides ? overrides.date_received! : "2026-05-01T10:00:00Z",
    date_acknowledged: "date_acknowledged" in overrides ? overrides.date_acknowledged! : null,
    date_responded: "date_responded" in overrides ? overrides.date_responded! : null,
    stage: "stage" in overrides ? overrides.stage! : "informal",
    description: "description" in overrides ? overrides.description! : "Test complaint",
    desired_outcome: "desired_outcome" in overrides ? overrides.desired_outcome! : null,
    investigation_notes: "investigation_notes" in overrides ? overrides.investigation_notes! : null,
    outcome: "outcome" in overrides ? overrides.outcome! : null,
    actions_taken: "actions_taken" in overrides ? overrides.actions_taken! : [],
    lessons_learned: "lessons_learned" in overrides ? overrides.lessons_learned! : null,
    complainant_satisfied: "complainant_satisfied" in overrides ? overrides.complainant_satisfied! : null,
    advocacy_offered: "advocacy_offered" in overrides ? overrides.advocacy_offered! : false,
    status: "status" in overrides ? overrides.status! : "open",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

/** Build a minimal Reg 40 notification with sensible defaults. */
function notification(
  overrides: Partial<{
    id: string;
    home_id: string;
    notification_type: string;
    child_id: string | null;
    staff_id: string | null;
    linked_incident_id: string | null;
    linked_complaint_id: string | null;
    event_date: string;
    notification_date: string | null;
    sent_by: string | null;
    ofsted_reference: string | null;
    description: string;
    status: string;
    created_at: string;
    updated_at: string;
  }> = {},
): Reg40Notification {
  return {
    id: "id" in overrides ? overrides.id! : "notif-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    notification_type: "notification_type" in overrides ? overrides.notification_type! : "missing",
    child_id: "child_id" in overrides ? overrides.child_id! : null,
    staff_id: "staff_id" in overrides ? overrides.staff_id! : null,
    linked_incident_id: "linked_incident_id" in overrides ? overrides.linked_incident_id! : null,
    linked_complaint_id: "linked_complaint_id" in overrides ? overrides.linked_complaint_id! : null,
    event_date: "event_date" in overrides ? overrides.event_date! : "2026-05-01T10:00:00Z",
    notification_date: "notification_date" in overrides ? overrides.notification_date! : null,
    sent_by: "sent_by" in overrides ? overrides.sent_by! : null,
    ofsted_reference: "ofsted_reference" in overrides ? overrides.ofsted_reference! : null,
    description: "description" in overrides ? overrides.description! : "Test notification",
    status: "status" in overrides ? overrides.status! : "pending",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-01T10:00:00Z",
    updated_at: "updated_at" in overrides ? overrides.updated_at! : "2026-05-01T10:00:00Z",
  };
}

// ── COMPLAINT_CATEGORIES ──────────────────────────────────────────────────

describe("COMPLAINT_CATEGORIES", () => {
  it("has exactly 15 entries", () => {
    expect(COMPLAINT_CATEGORIES).toHaveLength(15);
  });

  it("each entry has category and label properties", () => {
    for (const cc of COMPLAINT_CATEGORIES) {
      expect(typeof cc.category).toBe("string");
      expect(typeof cc.label).toBe("string");
    }
  });

  it("contains expected categories", () => {
    const categories = COMPLAINT_CATEGORIES.map((c) => c.category);
    expect(categories).toContain("care_quality");
    expect(categories).toContain("staff_conduct");
    expect(categories).toContain("bullying");
    expect(categories).toContain("privacy_dignity");
    expect(categories).toContain("discrimination");
    expect(categories).toContain("other");
  });

  it("has correct label for care_quality", () => {
    const found = COMPLAINT_CATEGORIES.find((c) => c.category === "care_quality");
    expect(found?.label).toBe("Quality of Care");
  });

  it("has correct label for food_nutrition", () => {
    const found = COMPLAINT_CATEGORIES.find((c) => c.category === "food_nutrition");
    expect(found?.label).toBe("Food & Nutrition");
  });
});

// ── COMPLAINT_SOURCES ─────────────────────────────────────────────────────

describe("COMPLAINT_SOURCES", () => {
  it("has exactly 8 sources", () => {
    expect(COMPLAINT_SOURCES).toHaveLength(8);
  });

  it("contains expected sources", () => {
    expect(COMPLAINT_SOURCES).toContain("child");
    expect(COMPLAINT_SOURCES).toContain("parent");
    expect(COMPLAINT_SOURCES).toContain("placing_authority");
    expect(COMPLAINT_SOURCES).toContain("advocate");
    expect(COMPLAINT_SOURCES).toContain("staff");
    expect(COMPLAINT_SOURCES).toContain("anonymous");
  });

  it("all entries are strings", () => {
    for (const source of COMPLAINT_SOURCES) {
      expect(typeof source).toBe("string");
    }
  });
});

// ── REG40_NOTIFICATION_TYPES ──────────────────────────────────────────────

describe("REG40_NOTIFICATION_TYPES", () => {
  it("has exactly 11 notification types", () => {
    expect(REG40_NOTIFICATION_TYPES).toHaveLength(11);
  });

  it("each entry has type, deadline_hours, and label", () => {
    for (const nt of REG40_NOTIFICATION_TYPES) {
      expect(typeof nt.type).toBe("string");
      expect(typeof nt.deadline_hours).toBe("number");
      expect(typeof nt.label).toBe("string");
    }
  });

  it("death notification has 0-hour deadline", () => {
    const death = REG40_NOTIFICATION_TYPES.find((t) => t.type === "death");
    expect(death?.deadline_hours).toBe(0);
    expect(death?.label).toBe("Death of a Child");
  });

  it("missing notification has 24-hour deadline", () => {
    const missing = REG40_NOTIFICATION_TYPES.find((t) => t.type === "missing");
    expect(missing?.deadline_hours).toBe(24);
    expect(missing?.label).toBe("Missing from Care");
  });

  it("contains expected types", () => {
    const types = REG40_NOTIFICATION_TYPES.map((t) => t.type);
    expect(types).toContain("death");
    expect(types).toContain("serious_injury");
    expect(types).toContain("missing");
    expect(types).toContain("police_involvement");
    expect(types).toContain("allegation_against_staff");
    expect(types).toContain("absconding");
  });
});

// ── COMPLAINT_STAGES ──────────────────────────────────────────────────────

describe("COMPLAINT_STAGES", () => {
  it("has exactly 5 stages", () => {
    expect(COMPLAINT_STAGES).toHaveLength(5);
  });

  it("starts with informal and ends with ombudsman", () => {
    expect(COMPLAINT_STAGES[0]).toBe("informal");
    expect(COMPLAINT_STAGES[COMPLAINT_STAGES.length - 1]).toBe("ombudsman");
  });

  it("contains all expected stages in escalation order", () => {
    expect(COMPLAINT_STAGES).toEqual([
      "informal",
      "formal_stage1",
      "formal_stage2",
      "independent_review",
      "ombudsman",
    ]);
  });

  it("all entries are strings", () => {
    for (const stage of COMPLAINT_STAGES) {
      expect(typeof stage).toBe("string");
    }
  });
});

// ── computeComplaintsSummary ──────────────────────────────────────────────

describe("computeComplaintsSummary", () => {
  it("returns zeroed metrics for empty array", () => {
    const result = computeComplaintsSummary([]);
    expect(result.total).toBe(0);
    expect(result.open).toBe(0);
    expect(result.investigating).toBe(0);
    expect(result.responded).toBe(0);
    expect(result.closed).toBe(0);
    expect(result.escalated).toBe(0);
    expect(result.by_category).toEqual({});
    expect(result.by_source).toEqual({});
    expect(result.avg_response_days).toBe(0);
    expect(result.acknowledged_within_2_days).toBe(0);
    expect(result.acknowledged_total).toBe(0);
    expect(result.satisfaction_rate).toBe(0);
    expect(result.advocacy_offered_rate).toBe(0);
  });

  it("counts total complaints", () => {
    const result = computeComplaintsSummary([
      complaint(),
      complaint({ id: "comp-2" }),
      complaint({ id: "comp-3" }),
    ]);
    expect(result.total).toBe(3);
  });

  it("counts complaints by status", () => {
    const result = computeComplaintsSummary([
      complaint({ status: "open" }),
      complaint({ id: "comp-2", status: "open" }),
      complaint({ id: "comp-3", status: "investigating" }),
      complaint({ id: "comp-4", status: "responded" }),
      complaint({ id: "comp-5", status: "closed" }),
      complaint({ id: "comp-6", status: "escalated" }),
    ]);
    expect(result.open).toBe(2);
    expect(result.investigating).toBe(1);
    expect(result.responded).toBe(1);
    expect(result.closed).toBe(1);
    expect(result.escalated).toBe(1);
  });

  it("ignores unrecognised status values in status counts", () => {
    const result = computeComplaintsSummary([
      complaint({ status: "unknown_status" }),
    ]);
    expect(result.total).toBe(1);
    expect(result.open).toBe(0);
    expect(result.investigating).toBe(0);
    expect(result.responded).toBe(0);
    expect(result.closed).toBe(0);
    expect(result.escalated).toBe(0);
  });

  it("groups complaints by category", () => {
    const result = computeComplaintsSummary([
      complaint({ complaint_category: "bullying" }),
      complaint({ id: "comp-2", complaint_category: "bullying" }),
      complaint({ id: "comp-3", complaint_category: "food_nutrition" }),
    ]);
    expect(result.by_category).toEqual({ bullying: 2, food_nutrition: 1 });
  });

  it("groups complaints by source", () => {
    const result = computeComplaintsSummary([
      complaint({ source: "child" }),
      complaint({ id: "comp-2", source: "child" }),
      complaint({ id: "comp-3", source: "parent" }),
    ]);
    expect(result.by_source).toEqual({ child: 2, parent: 1 });
  });

  it("computes average response days for responded/closed complaints with date_responded", () => {
    const result = computeComplaintsSummary([
      complaint({
        status: "responded",
        date_received: "2026-05-01T00:00:00Z",
        date_responded: "2026-05-11T00:00:00Z",
      }),
      complaint({
        id: "comp-2",
        status: "closed",
        date_received: "2026-05-01T00:00:00Z",
        date_responded: "2026-05-21T00:00:00Z",
      }),
    ]);
    // 10 days + 20 days = 30, / 2 = 15.0
    expect(result.avg_response_days).toBe(15);
  });

  it("returns 0 avg_response_days when no responded/closed complaints have date_responded", () => {
    const result = computeComplaintsSummary([
      complaint({ status: "open" }),
      complaint({ id: "comp-2", status: "responded", date_responded: null }),
    ]);
    expect(result.avg_response_days).toBe(0);
  });

  it("ignores open complaints for avg_response_days even if date_responded is set", () => {
    const result = computeComplaintsSummary([
      complaint({
        status: "open",
        date_received: "2026-05-01T00:00:00Z",
        date_responded: "2026-05-05T00:00:00Z",
      }),
    ]);
    expect(result.avg_response_days).toBe(0);
  });

  it("counts acknowledgements within 2 days", () => {
    const result = computeComplaintsSummary([
      complaint({
        date_received: "2026-05-01T00:00:00Z",
        date_acknowledged: "2026-05-02T00:00:00Z",
      }),
      complaint({
        id: "comp-2",
        date_received: "2026-05-01T00:00:00Z",
        date_acknowledged: "2026-05-03T00:00:00Z",
      }),
      complaint({
        id: "comp-3",
        date_received: "2026-05-01T00:00:00Z",
        date_acknowledged: "2026-05-05T00:00:00Z",
      }),
    ]);
    // comp-1: 1 day <= 2 -> within
    // comp-2: 2 days <= 2 -> within
    // comp-3: 4 days > 2 -> not within
    expect(result.acknowledged_within_2_days).toBe(2);
    expect(result.acknowledged_total).toBe(3);
  });

  it("does not count unacknowledged complaints toward acknowledged_total", () => {
    const result = computeComplaintsSummary([
      complaint({ date_acknowledged: null }),
    ]);
    expect(result.acknowledged_total).toBe(0);
    expect(result.acknowledged_within_2_days).toBe(0);
  });

  it("computes satisfaction rate from true/false values only, ignoring null", () => {
    const result = computeComplaintsSummary([
      complaint({ complainant_satisfied: true }),
      complaint({ id: "comp-2", complainant_satisfied: true }),
      complaint({ id: "comp-3", complainant_satisfied: false }),
      complaint({ id: "comp-4", complainant_satisfied: null }),
    ]);
    // 2 satisfied out of 3 with boolean value = 66.7%
    expect(result.satisfaction_rate).toBe(66.7);
  });

  it("returns 0 satisfaction rate when all complainant_satisfied are null", () => {
    const result = computeComplaintsSummary([
      complaint({ complainant_satisfied: null }),
    ]);
    expect(result.satisfaction_rate).toBe(0);
  });

  it("returns 100 satisfaction rate when all are satisfied", () => {
    const result = computeComplaintsSummary([
      complaint({ complainant_satisfied: true }),
      complaint({ id: "comp-2", complainant_satisfied: true }),
    ]);
    expect(result.satisfaction_rate).toBe(100);
  });

  it("computes advocacy offered rate", () => {
    const result = computeComplaintsSummary([
      complaint({ advocacy_offered: true }),
      complaint({ id: "comp-2", advocacy_offered: false }),
      complaint({ id: "comp-3", advocacy_offered: true }),
      complaint({ id: "comp-4", advocacy_offered: false }),
    ]);
    // 2/4 = 50%
    expect(result.advocacy_offered_rate).toBe(50);
  });

  it("returns 0 advocacy_offered_rate when total is 0 (empty array)", () => {
    const result = computeComplaintsSummary([]);
    expect(result.advocacy_offered_rate).toBe(0);
  });
});

// ── computeNotificationCompliance ─────────────────────────────────────────

describe("computeNotificationCompliance", () => {
  it("returns zeroed metrics for empty array with 100% compliance", () => {
    const result = computeNotificationCompliance([]);
    expect(result.total).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.sent_on_time).toBe(0);
    expect(result.sent_late).toBe(0);
    expect(result.overdue).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.compliance_rate).toBe(100);
  });

  it("counts total notifications", () => {
    const result = computeNotificationCompliance([
      notification(),
      notification({ id: "notif-2" }),
    ]);
    expect(result.total).toBe(2);
  });

  it("groups notifications by type", () => {
    const result = computeNotificationCompliance([
      notification({ notification_type: "missing" }),
      notification({ id: "notif-2", notification_type: "missing" }),
      notification({ id: "notif-3", notification_type: "death" }),
    ]);
    expect(result.by_type).toEqual({ missing: 2, death: 1 });
  });

  it("counts sent-on-time notification when sent within deadline", () => {
    const result = computeNotificationCompliance([
      notification({
        notification_type: "missing",
        status: "sent",
        event_date: "2026-05-01T10:00:00Z",
        notification_date: "2026-05-02T08:00:00Z",
      }),
    ]);
    // 22 hours <= 24 hour deadline for "missing"
    expect(result.sent_on_time).toBe(1);
    expect(result.sent_late).toBe(0);
  });

  it("counts sent-late notification when sent after deadline", () => {
    const result = computeNotificationCompliance([
      notification({
        notification_type: "missing",
        status: "sent",
        event_date: "2026-05-01T10:00:00Z",
        notification_date: "2026-05-03T12:00:00Z",
      }),
    ]);
    // 50 hours > 24 hour deadline
    expect(result.sent_on_time).toBe(0);
    expect(result.sent_late).toBe(1);
  });

  it("treats acknowledged status the same as sent for compliance", () => {
    const result = computeNotificationCompliance([
      notification({
        notification_type: "serious_injury",
        status: "acknowledged",
        event_date: "2026-05-01T10:00:00Z",
        notification_date: "2026-05-02T06:00:00Z",
      }),
    ]);
    // 20 hours <= 24 hour deadline
    expect(result.sent_on_time).toBe(1);
  });

  it("treats sent status without notification_date as sent on time", () => {
    const result = computeNotificationCompliance([
      notification({
        status: "sent",
        notification_date: null,
      }),
    ]);
    expect(result.sent_on_time).toBe(1);
    expect(result.sent_late).toBe(0);
  });

  it("counts pending notification within deadline as pending", () => {
    // Use a very recent event_date to ensure it's within the 24h deadline
    const recentDate = new Date();
    recentDate.setMinutes(recentDate.getMinutes() - 30);
    const result = computeNotificationCompliance([
      notification({
        notification_type: "missing",
        status: "pending",
        event_date: recentDate.toISOString(),
      }),
    ]);
    // 30 minutes < 24 hour deadline
    expect(result.pending).toBe(1);
    expect(result.overdue).toBe(0);
  });

  it("counts pending notification past deadline as overdue", () => {
    const result = computeNotificationCompliance([
      notification({
        notification_type: "missing",
        status: "pending",
        event_date: "2020-01-01T00:00:00Z",
      }),
    ]);
    // Well past 24 hour deadline
    expect(result.overdue).toBe(1);
    expect(result.pending).toBe(0);
  });

  it("counts notification with overdue status directly as overdue", () => {
    const result = computeNotificationCompliance([
      notification({ status: "overdue" }),
    ]);
    expect(result.overdue).toBe(1);
  });

  it("uses type-specific deadline hours (death = 0h)", () => {
    // Even 1 minute after event should be overdue for death notification
    const recentDate = new Date();
    recentDate.setMinutes(recentDate.getMinutes() - 5);
    const result = computeNotificationCompliance([
      notification({
        notification_type: "death",
        status: "pending",
        event_date: recentDate.toISOString(),
      }),
    ]);
    // 5 minutes > 0 hour deadline
    expect(result.overdue).toBe(1);
  });

  it("computes compliance rate correctly", () => {
    const result = computeNotificationCompliance([
      notification({
        notification_type: "missing",
        status: "sent",
        event_date: "2026-05-01T10:00:00Z",
        notification_date: "2026-05-01T20:00:00Z",
      }),
      notification({
        id: "notif-2",
        notification_type: "serious_injury",
        status: "sent",
        event_date: "2026-05-01T10:00:00Z",
        notification_date: "2026-05-05T10:00:00Z",
      }),
      notification({
        id: "notif-3",
        status: "overdue",
      }),
    ]);
    // sent_on_time = 1 (10 hours <= 24), sent_late = 1 (96h > 24), overdue = 1
    // complianceDenominator = 1 + 1 + 1 = 3
    // rate = (1/3) * 100 = 33.3%
    expect(result.compliance_rate).toBe(33.3);
  });

  it("returns 100% compliance when only pending notifications exist (no sent/late/overdue)", () => {
    const recentDate = new Date();
    recentDate.setMinutes(recentDate.getMinutes() - 5);
    const result = computeNotificationCompliance([
      notification({
        notification_type: "missing",
        status: "pending",
        event_date: recentDate.toISOString(),
      }),
    ]);
    // complianceDenominator = 0 (no sent_on_time, sent_late, or overdue)
    expect(result.compliance_rate).toBe(100);
  });

  it("falls back to 24h deadline for unknown notification type", () => {
    const result = computeNotificationCompliance([
      notification({
        notification_type: "unknown_type",
        status: "sent",
        event_date: "2026-05-01T10:00:00Z",
        notification_date: "2026-05-02T12:00:00Z",
      }),
    ]);
    // 26 hours > 24 hour fallback deadline
    expect(result.sent_late).toBe(1);
  });
});

// ── computeComplaintTrends ────────────────────────────────────────────────

describe("computeComplaintTrends", () => {
  it("returns 6 monthly_counts buckets for empty array", () => {
    const result = computeComplaintTrends([]);
    expect(result.monthly_counts).toHaveLength(6);
    for (const mc of result.monthly_counts) {
      expect(mc.count).toBe(0);
    }
  });

  it("returns empty arrays/zero counts for empty input", () => {
    const result = computeComplaintTrends([]);
    expect(result.top_categories).toEqual([]);
    expect(result.repeat_complainants).toEqual([]);
    expect(result.child_complaints_count).toBe(0);
    expect(result.lessons_identified).toBe(0);
  });

  it("monthly_counts months are formatted as YYYY-MM", () => {
    const result = computeComplaintTrends([]);
    for (const mc of result.monthly_counts) {
      expect(mc.month).toMatch(/^\d{4}-\d{2}$/);
    }
  });

  it("buckets complaints into the correct month", () => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const result = computeComplaintTrends([
      complaint({
        date_received: new Date(now.getFullYear(), now.getMonth(), 5).toISOString(),
      }),
      complaint({
        id: "comp-2",
        date_received: new Date(now.getFullYear(), now.getMonth(), 15).toISOString(),
      }),
    ]);
    const currentEntry = result.monthly_counts.find((mc) => mc.month === currentMonth);
    expect(currentEntry?.count).toBe(2);
  });

  it("does not count complaints outside the 6-month window", () => {
    const result = computeComplaintTrends([
      complaint({
        date_received: "2020-01-15T00:00:00Z",
      }),
    ]);
    const totalCount = result.monthly_counts.reduce((sum, mc) => sum + mc.count, 0);
    expect(totalCount).toBe(0);
  });

  it("returns top 5 categories sorted by count descending", () => {
    const complaints = [
      complaint({ complaint_category: "bullying" }),
      complaint({ id: "c2", complaint_category: "bullying" }),
      complaint({ id: "c3", complaint_category: "bullying" }),
      complaint({ id: "c4", complaint_category: "food_nutrition" }),
      complaint({ id: "c5", complaint_category: "food_nutrition" }),
      complaint({ id: "c6", complaint_category: "care_quality" }),
      complaint({ id: "c7", complaint_category: "staff_conduct" }),
      complaint({ id: "c8", complaint_category: "privacy_dignity" }),
      complaint({ id: "c9", complaint_category: "education" }),
    ];
    const result = computeComplaintTrends(complaints);
    expect(result.top_categories).toHaveLength(5);
    expect(result.top_categories[0]).toEqual({ category: "bullying", count: 3 });
    expect(result.top_categories[1]).toEqual({ category: "food_nutrition", count: 2 });
    // Remaining 4 categories each have 1, but only 3 more slots
    expect(result.top_categories.length).toBeLessThanOrEqual(5);
  });

  it("returns fewer than 5 top_categories when there are fewer categories", () => {
    const result = computeComplaintTrends([
      complaint({ complaint_category: "bullying" }),
      complaint({ id: "c2", complaint_category: "food_nutrition" }),
    ]);
    expect(result.top_categories).toHaveLength(2);
  });

  it("detects repeat complainants (2+ complaints, case-insensitive)", () => {
    const result = computeComplaintTrends([
      complaint({ complainant_name: "Jane Smith" }),
      complaint({ id: "c2", complainant_name: "jane smith" }),
      complaint({ id: "c3", complainant_name: "Bob Jones" }),
    ]);
    expect(result.repeat_complainants).toHaveLength(1);
    expect(result.repeat_complainants[0].name).toBe("jane smith");
    expect(result.repeat_complainants[0].count).toBe(2);
  });

  it("does not include single-occurrence complainants in repeat list", () => {
    const result = computeComplaintTrends([
      complaint({ complainant_name: "Alice" }),
      complaint({ id: "c2", complainant_name: "Bob" }),
    ]);
    expect(result.repeat_complainants).toHaveLength(0);
  });

  it("sorts repeat complainants by count descending", () => {
    const result = computeComplaintTrends([
      complaint({ complainant_name: "Alice" }),
      complaint({ id: "c2", complainant_name: "Alice" }),
      complaint({ id: "c3", complainant_name: "Bob" }),
      complaint({ id: "c4", complainant_name: "Bob" }),
      complaint({ id: "c5", complainant_name: "Bob" }),
    ]);
    expect(result.repeat_complainants).toHaveLength(2);
    expect(result.repeat_complainants[0].name).toBe("bob");
    expect(result.repeat_complainants[0].count).toBe(3);
    expect(result.repeat_complainants[1].name).toBe("alice");
    expect(result.repeat_complainants[1].count).toBe(2);
  });

  it("counts child_complaints_count by source=child", () => {
    const result = computeComplaintTrends([
      complaint({ source: "child" }),
      complaint({ id: "c2", source: "child" }),
      complaint({ id: "c3", source: "parent" }),
    ]);
    expect(result.child_complaints_count).toBe(2);
  });

  it("counts lessons_identified for complaints with non-empty lessons_learned", () => {
    const result = computeComplaintTrends([
      complaint({ lessons_learned: "Need more training" }),
      complaint({ id: "c2", lessons_learned: "" }),
      complaint({ id: "c3", lessons_learned: "   " }),
      complaint({ id: "c4", lessons_learned: null }),
      complaint({ id: "c5", lessons_learned: "Review policy" }),
    ]);
    // Only c1 and c5 have non-empty trimmed lessons_learned
    expect(result.lessons_identified).toBe(2);
  });
});

// ── identifyComplaintAlerts ───────────────────────────────────────────────

describe("identifyComplaintAlerts", () => {
  it("returns empty array when no complaints and no notifications", () => {
    const result = identifyComplaintAlerts([], []);
    expect(result).toEqual([]);
  });

  // ── Notification overdue alerts ──

  it("generates critical alert for overdue pending notification", () => {
    const result = identifyComplaintAlerts([], [
      notification({
        notification_type: "missing",
        status: "pending",
        event_date: "2020-01-01T00:00:00Z",
      }),
    ]);
    const overdueAlerts = result.filter((a) => a.type === "notification_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("critical");
    expect(overdueAlerts[0].message).toContain("Missing from Care");
    expect(overdueAlerts[0].id).toBe("notif-1");
  });

  it("generates critical alert for notification with overdue status", () => {
    const result = identifyComplaintAlerts([], [
      notification({
        status: "overdue",
        event_date: "2020-01-01T00:00:00Z",
      }),
    ]);
    const overdueAlerts = result.filter((a) => a.type === "notification_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("critical");
  });

  it("does not generate alert for sent notification", () => {
    const result = identifyComplaintAlerts([], [
      notification({
        status: "sent",
        event_date: "2020-01-01T00:00:00Z",
        notification_date: "2020-01-05T00:00:00Z",
      }),
    ]);
    const overdueAlerts = result.filter((a) => a.type === "notification_overdue");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("does not generate alert for pending notification still within deadline", () => {
    const recentDate = new Date();
    recentDate.setMinutes(recentDate.getMinutes() - 5);
    const result = identifyComplaintAlerts([], [
      notification({
        notification_type: "missing",
        status: "pending",
        event_date: recentDate.toISOString(),
      }),
    ]);
    const overdueAlerts = result.filter((a) => a.type === "notification_overdue");
    expect(overdueAlerts).toHaveLength(0);
  });

  // ── Response overdue alerts ──

  it("generates high alert for open complaint without response after 20 days", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 25);
    const result = identifyComplaintAlerts([
      complaint({
        status: "open",
        date_received: oldDate.toISOString(),
        date_responded: null,
        complainant_name: "John Doe",
      }),
    ], []);
    const responseAlerts = result.filter((a) => a.type === "response_overdue");
    expect(responseAlerts).toHaveLength(1);
    expect(responseAlerts[0].severity).toBe("high");
    expect(responseAlerts[0].message).toContain("John Doe");
    expect(responseAlerts[0].message).toContain("25 days");
  });

  it("generates high alert for investigating complaint without response after 20 days", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const result = identifyComplaintAlerts([
      complaint({
        status: "investigating",
        date_received: oldDate.toISOString(),
        date_responded: null,
      }),
    ], []);
    const responseAlerts = result.filter((a) => a.type === "response_overdue");
    expect(responseAlerts).toHaveLength(1);
    expect(responseAlerts[0].severity).toBe("high");
  });

  it("does not generate response_overdue for complaint within 20 days", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    const result = identifyComplaintAlerts([
      complaint({
        status: "open",
        date_received: recentDate.toISOString(),
        date_responded: null,
      }),
    ], []);
    const responseAlerts = result.filter((a) => a.type === "response_overdue");
    expect(responseAlerts).toHaveLength(0);
  });

  it("does not generate response_overdue for closed complaint", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const result = identifyComplaintAlerts([
      complaint({
        status: "closed",
        date_received: oldDate.toISOString(),
        date_responded: null,
      }),
    ], []);
    const responseAlerts = result.filter((a) => a.type === "response_overdue");
    expect(responseAlerts).toHaveLength(0);
  });

  // ── Acknowledgement overdue alerts ──

  it("generates medium alert for unacknowledged complaint after 2 days", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5);
    const result = identifyComplaintAlerts([
      complaint({
        date_received: oldDate.toISOString(),
        date_acknowledged: null,
        complainant_name: "Sarah Brown",
      }),
    ], []);
    const ackAlerts = result.filter((a) => a.type === "acknowledgement_overdue");
    expect(ackAlerts).toHaveLength(1);
    expect(ackAlerts[0].severity).toBe("medium");
    expect(ackAlerts[0].message).toContain("Sarah Brown");
  });

  it("does not generate acknowledgement alert for recently received complaint", () => {
    const recentDate = new Date();
    recentDate.setHours(recentDate.getHours() - 12);
    const result = identifyComplaintAlerts([
      complaint({
        date_received: recentDate.toISOString(),
        date_acknowledged: null,
      }),
    ], []);
    const ackAlerts = result.filter((a) => a.type === "acknowledgement_overdue");
    expect(ackAlerts).toHaveLength(0);
  });

  it("does not generate acknowledgement alert when complaint is acknowledged", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const result = identifyComplaintAlerts([
      complaint({
        date_received: oldDate.toISOString(),
        date_acknowledged: oldDate.toISOString(),
      }),
    ], []);
    const ackAlerts = result.filter((a) => a.type === "acknowledgement_overdue");
    expect(ackAlerts).toHaveLength(0);
  });

  // ── Escalated complaint alerts ──

  it("generates high alert for formal_stage2 complaint", () => {
    const result = identifyComplaintAlerts([
      complaint({
        stage: "formal_stage2",
        complainant_name: "Mike Wilson",
      }),
    ], []);
    const escalatedAlerts = result.filter((a) => a.type === "escalated_complaint");
    expect(escalatedAlerts).toHaveLength(1);
    expect(escalatedAlerts[0].severity).toBe("high");
    expect(escalatedAlerts[0].message).toContain("Mike Wilson");
    expect(escalatedAlerts[0].message).toContain("formal stage2");
  });

  it("generates high alert for independent_review complaint", () => {
    const result = identifyComplaintAlerts([
      complaint({ stage: "independent_review" }),
    ], []);
    const escalatedAlerts = result.filter((a) => a.type === "escalated_complaint");
    expect(escalatedAlerts).toHaveLength(1);
    expect(escalatedAlerts[0].message).toContain("independent review");
  });

  it("generates high alert for ombudsman complaint", () => {
    const result = identifyComplaintAlerts([
      complaint({ stage: "ombudsman" }),
    ], []);
    const escalatedAlerts = result.filter((a) => a.type === "escalated_complaint");
    expect(escalatedAlerts).toHaveLength(1);
  });

  it("does not generate escalated alert for informal or formal_stage1", () => {
    const result = identifyComplaintAlerts([
      complaint({ stage: "informal" }),
      complaint({ id: "c2", stage: "formal_stage1" }),
    ], []);
    const escalatedAlerts = result.filter((a) => a.type === "escalated_complaint");
    expect(escalatedAlerts).toHaveLength(0);
  });

  // ── Pattern detection alerts ──

  it("generates medium alert when 3+ complaints in same category within 30 days", () => {
    const now = new Date();
    const recentDate1 = new Date(now);
    recentDate1.setDate(now.getDate() - 5);
    const recentDate2 = new Date(now);
    recentDate2.setDate(now.getDate() - 10);
    const recentDate3 = new Date(now);
    recentDate3.setDate(now.getDate() - 15);

    const result = identifyComplaintAlerts([
      complaint({
        complaint_category: "bullying",
        date_received: recentDate1.toISOString(),
      }),
      complaint({
        id: "c2",
        complaint_category: "bullying",
        date_received: recentDate2.toISOString(),
      }),
      complaint({
        id: "c3",
        complaint_category: "bullying",
        date_received: recentDate3.toISOString(),
      }),
    ], []);
    const patternAlerts = result.filter((a) => a.type === "pattern_detected");
    expect(patternAlerts).toHaveLength(1);
    expect(patternAlerts[0].severity).toBe("medium");
    expect(patternAlerts[0].message).toContain("3 complaints");
    expect(patternAlerts[0].message).toContain("Bullying");
  });

  it("does not generate pattern alert for fewer than 3 complaints in same category", () => {
    const now = new Date();
    const recentDate = new Date(now);
    recentDate.setDate(now.getDate() - 5);

    const result = identifyComplaintAlerts([
      complaint({
        complaint_category: "bullying",
        date_received: recentDate.toISOString(),
      }),
      complaint({
        id: "c2",
        complaint_category: "bullying",
        date_received: recentDate.toISOString(),
      }),
    ], []);
    const patternAlerts = result.filter((a) => a.type === "pattern_detected");
    expect(patternAlerts).toHaveLength(0);
  });

  it("does not generate pattern alert for complaints older than 30 days", () => {
    const result = identifyComplaintAlerts([
      complaint({
        complaint_category: "bullying",
        date_received: "2020-01-01T00:00:00Z",
      }),
      complaint({
        id: "c2",
        complaint_category: "bullying",
        date_received: "2020-01-05T00:00:00Z",
      }),
      complaint({
        id: "c3",
        complaint_category: "bullying",
        date_received: "2020-01-10T00:00:00Z",
      }),
    ], []);
    const patternAlerts = result.filter((a) => a.type === "pattern_detected");
    expect(patternAlerts).toHaveLength(0);
  });

  it("generates multiple alerts from different sources simultaneously", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 25);

    const result = identifyComplaintAlerts([
      complaint({
        status: "open",
        stage: "formal_stage2",
        date_received: oldDate.toISOString(),
        date_acknowledged: null,
        date_responded: null,
      }),
    ], [
      notification({
        status: "overdue",
        event_date: "2020-01-01T00:00:00Z",
      }),
    ]);

    const types = result.map((a) => a.type);
    expect(types).toContain("notification_overdue");
    expect(types).toContain("response_overdue");
    expect(types).toContain("acknowledgement_overdue");
    expect(types).toContain("escalated_complaint");
  });

  it("uses fallback label for unknown notification type in alert message", () => {
    const result = identifyComplaintAlerts([], [
      notification({
        notification_type: "custom_event",
        status: "pending",
        event_date: "2020-01-01T00:00:00Z",
      }),
    ]);
    const overdueAlerts = result.filter((a) => a.type === "notification_overdue");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].message).toContain("custom_event");
  });

  it("uses fallback category label for unknown category in pattern alert", () => {
    const now = new Date();
    const recentDate = new Date(now);
    recentDate.setDate(now.getDate() - 5);

    const result = identifyComplaintAlerts([
      complaint({
        complaint_category: "unknown_cat",
        date_received: recentDate.toISOString(),
      }),
      complaint({
        id: "c2",
        complaint_category: "unknown_cat",
        date_received: recentDate.toISOString(),
      }),
      complaint({
        id: "c3",
        complaint_category: "unknown_cat",
        date_received: recentDate.toISOString(),
      }),
    ], []);
    const patternAlerts = result.filter((a) => a.type === "pattern_detected");
    expect(patternAlerts).toHaveLength(1);
    expect(patternAlerts[0].message).toContain("unknown_cat");
  });
});
