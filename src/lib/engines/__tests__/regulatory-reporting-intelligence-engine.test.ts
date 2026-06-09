// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — REGULATORY REPORTING INTELLIGENCE ENGINE — TEST SUITE
// Reg 44 visit schedule, Reg 45 quality of care reviews, Reg 40 notifications,
// recommendation tracking, overall compliance score, alerts, and insights.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeRegulatoryReportingIntelligence,
  daysBetween,
  daysUntil,
  isWithinLast12Months,
  type Reg44ReportInput,
  type Reg45ReportInput,
  type NotificationInput,
  type StaffRef,
  type RegulatoryReportingIntelligenceInput,
} from "../regulatory-reporting-intelligence-engine";

// ── Factories ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-25";

function makeReg44Report(overrides: Partial<Reg44ReportInput> = {}): Reg44ReportInput {
  return {
    id: "r44_1",
    visit_date: "2026-05-18",
    visitor_name: "Margaret Thompson",
    status: "completed",
    submitted_date: "2026-05-20",
    recommendations_count: 3,
    recommendations_completed: 2,
    overall_rating: "good",
    next_visit_due: "2026-06-18",
    ...overrides,
  };
}

function makeReg45Report(overrides: Partial<Reg45ReportInput> = {}): Reg45ReportInput {
  return {
    id: "r45_1",
    period_start: "2026-01-01",
    period_end: "2026-06-30",
    author: "Darren Laville",
    status: "in_progress",
    submitted_date: null,
    next_due: "2026-07-27",
    progress_percentage: 58,
    ...overrides,
  };
}

function makeNotification(overrides: Partial<NotificationInput> = {}): NotificationInput {
  return {
    id: "ne_1",
    event_type: "serious_injury",
    event_date: "2026-05-10",
    notified_date: "2026-05-10",
    notified_within_24h: true,
    ofsted_reference: "OFS-2026-1234",
    status: "notified",
    ...overrides,
  };
}

function makeStaff(overrides: Partial<StaffRef> = {}): StaffRef {
  return {
    id: "staff_darren",
    name: "Darren Laville",
    ...overrides,
  };
}

function makeInput(overrides: Partial<RegulatoryReportingIntelligenceInput> = {}): RegulatoryReportingIntelligenceInput {
  return {
    reg44Reports: [],
    reg45Reports: [],
    notifications: [],
    staff: [makeStaff()],
    today: TODAY,
    ...overrides,
  };
}

/**
 * Generate N monthly Reg 44 reports going backwards from today.
 * daysAgo controls the most recent visit offset.
 */
function generateMonthlyReg44(count: number, options?: {
  daysAgoStart?: number;
  spacing?: number;
  rating?: string;
  recsCount?: number;
  recsCompleted?: number;
}): Reg44ReportInput[] {
  const start = options?.daysAgoStart ?? 3;
  const spacing = options?.spacing ?? 30;
  const rating = options?.rating ?? "good";
  const recsCount = options?.recsCount ?? 2;
  const recsCompleted = options?.recsCompleted ?? 2;

  const reports: Reg44ReportInput[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = start + i * spacing;
    const dt = new Date(new Date(TODAY + "T00:00:00Z").getTime() - daysAgo * 86_400_000);
    const visitDate = dt.toISOString().slice(0, 10);
    const nextDue = new Date(dt.getTime() + 30 * 86_400_000).toISOString().slice(0, 10);
    reports.push(
      makeReg44Report({
        id: `r44_gen_${i}`,
        visit_date: visitDate,
        status: "completed",
        submitted_date: visitDate,
        recommendations_count: recsCount,
        recommendations_completed: recsCompleted,
        overall_rating: rating,
        next_visit_due: nextDue,
      })
    );
  }
  return reports;
}

// ── Unit Tests: Helpers ───────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same day", () => {
    expect(daysBetween("2026-05-25", "2026-05-25")).toBe(0);
  });

  it("returns correct positive days", () => {
    expect(daysBetween("2026-05-18", "2026-05-25")).toBe(7);
  });

  it("is symmetric", () => {
    expect(daysBetween("2026-05-25", "2026-05-18")).toBe(7);
  });

  it("handles month boundaries", () => {
    expect(daysBetween("2026-04-30", "2026-05-01")).toBe(1);
  });

  it("handles year boundaries", () => {
    expect(daysBetween("2025-12-31", "2026-01-01")).toBe(1);
  });
});

describe("daysUntil", () => {
  it("returns positive for future date", () => {
    expect(daysUntil("2026-05-25", "2026-06-01")).toBe(7);
  });

  it("returns negative for past date", () => {
    expect(daysUntil("2026-05-25", "2026-05-18")).toBe(-7);
  });

  it("returns 0 for same day", () => {
    expect(daysUntil("2026-05-25", "2026-05-25")).toBe(0);
  });
});

describe("isWithinLast12Months", () => {
  it("returns true for date within 365 days", () => {
    expect(isWithinLast12Months("2026-05-01", TODAY)).toBe(true);
  });

  it("returns true for date exactly 365 days ago", () => {
    expect(isWithinLast12Months("2025-05-25", TODAY)).toBe(true);
  });

  it("returns false for date more than 365 days ago", () => {
    expect(isWithinLast12Months("2025-05-24", TODAY)).toBe(false);
  });

  it("returns true for today", () => {
    expect(isWithinLast12Months(TODAY, TODAY)).toBe(true);
  });
});

// ── Integration Tests ─────────────────────────────────────────────────────────

describe("computeRegulatoryReportingIntelligence", () => {

  // ── Empty State ─────────────────────────────────────────────────────────────

  describe("empty state", () => {
    it("handles no data gracefully", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.overview.overall_compliance_score).toBe(40);
      expect(result.overview.reg44_visits_last_12_months).toBe(0);
      expect(result.overview.reg44_compliant).toBe(false);
      expect(result.overview.reg45_compliant).toBe(false);
      expect(result.overview.notifications_on_time_rate).toBe(100);
      expect(result.overview.outstanding_recommendations).toBe(0);
    });

    it("returns null dates when no reports exist", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.reg44_status.last_visit_date).toBeNull();
      expect(result.reg44_status.next_visit_due).toBeNull();
      expect(result.reg44_status.days_until_due).toBeNull();
      expect(result.reg45_status.last_submitted).toBeNull();
      expect(result.reg45_status.next_due).toBeNull();
    });

    it("returns on_track status when no deadlines exist", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.reg44_status.status).toBe("on_track");
      expect(result.reg45_status.status).toBe("on_track");
    });

    it("returns empty alerts and insights for clean state", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      // No reg44 data means no low alert (requires > 0 visits but < 12)
      expect(result.alerts).toHaveLength(0);
    });

    it("returns 100% completion rate for no recommendations", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.recommendation_tracker.total_recommendations).toBe(0);
      expect(result.recommendation_tracker.completion_rate).toBe(100);
    });

    it("returns 100% notification rate for no notifications", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.notification_compliance.on_time_rate).toBe(100);
      expect(result.notification_compliance.total_notifications).toBe(0);
    });
  });

  // ── Reg 44 Status ───────────────────────────────────────────────────────────

  describe("Reg 44 status", () => {
    it("detects last visit date correctly", () => {
      const reports = [
        makeReg44Report({ id: "a", visit_date: "2026-05-18" }),
        makeReg44Report({ id: "b", visit_date: "2026-04-18" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.last_visit_date).toBe("2026-05-18");
    });

    it("counts visits in last 12 months only", () => {
      const reports = [
        makeReg44Report({ id: "a", visit_date: "2026-05-01" }),
        makeReg44Report({ id: "b", visit_date: "2025-05-24" }), // 366 days ago, out of range
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.visits_last_12_months).toBe(1);
    });

    it("marks status as overdue when next_visit_due is past", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-05-20" }), // 5 days ago
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.status).toBe("overdue");
      expect(result.reg44_status.days_until_due).toBe(-5);
    });

    it("marks status as due_soon when within 7 days", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-05-27" }), // 2 days
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.status).toBe("due_soon");
      expect(result.reg44_status.days_until_due).toBe(2);
    });

    it("marks status as on_track when more than 7 days away", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-06-18" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.status).toBe("on_track");
    });

    it("counts only completed reports", () => {
      const reports = [
        makeReg44Report({ id: "a", status: "completed" }),
        makeReg44Report({ id: "b", status: "in_progress" }),
        makeReg44Report({ id: "c", status: "draft" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.reports_completed).toBe(1);
    });

    it("computes average rating as good", () => {
      const reports = [
        makeReg44Report({ id: "a", overall_rating: "good" }),
        makeReg44Report({ id: "b", overall_rating: "good" }),
        makeReg44Report({ id: "c", overall_rating: "satisfactory" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.average_rating).toBe("good");
    });

    it("computes average rating as satisfactory", () => {
      const reports = [
        makeReg44Report({ id: "a", overall_rating: "satisfactory" }),
        makeReg44Report({ id: "b", overall_rating: "requires_improvement" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.average_rating).toBe("satisfactory");
    });

    it("computes average rating as requires_improvement", () => {
      const reports = [
        makeReg44Report({ id: "a", overall_rating: "requires_improvement" }),
        makeReg44Report({ id: "b", overall_rating: "requires_improvement" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.average_rating).toBe("requires_improvement");
    });

    it("returns none for average rating with no completed reports", () => {
      const reports = [
        makeReg44Report({ id: "a", status: "in_progress", overall_rating: "good" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.average_rating).toBe("none");
    });

    it("marks reg44_compliant as true with 12 visits", () => {
      const reports = generateMonthlyReg44(12);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.overview.reg44_compliant).toBe(true);
    });

    it("marks reg44_compliant as false with 11 visits", () => {
      const reports = generateMonthlyReg44(11);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.overview.reg44_compliant).toBe(false);
    });

    it("handles due_soon at exactly 7 days", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-06-01" }), // 7 days
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.status).toBe("due_soon");
    });

    it("handles on_track at exactly 8 days", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-06-02" }), // 8 days
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.status).toBe("on_track");
    });

    it("uses the earliest future due date when multiple reports exist", () => {
      const reports = [
        makeReg44Report({ id: "a", next_visit_due: "2026-06-18" }),
        makeReg44Report({ id: "b", next_visit_due: "2026-06-05" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.next_visit_due).toBe("2026-06-05");
    });
  });

  // ── Reg 45 Status ───────────────────────────────────────────────────────────

  describe("Reg 45 status", () => {
    it("detects last submitted date from completed reports", () => {
      const reports = [
        makeReg45Report({ id: "a", status: "completed", submitted_date: "2026-01-20" }),
        makeReg45Report({ id: "b", status: "in_progress", submitted_date: null }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.last_submitted).toBe("2026-01-20");
    });

    it("marks status as overdue when next_due is past", () => {
      const reports = [
        makeReg45Report({ next_due: "2026-05-20", status: "not_started", progress_percentage: 0 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.status).toBe("overdue");
    });

    it("marks status as in_progress when report has progress", () => {
      const reports = [
        makeReg45Report({ status: "in_progress", progress_percentage: 58, next_due: "2026-07-27" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.status).toBe("in_progress");
      expect(result.reg45_status.current_progress).toBe(58);
    });

    it("marks status as due_soon when within 30 days and not in progress", () => {
      const reports = [
        makeReg45Report({ status: "not_started", progress_percentage: 0, next_due: "2026-06-15" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.status).toBe("due_soon");
    });

    it("marks status as on_track when more than 30 days away", () => {
      const reports = [
        makeReg45Report({ status: "not_started", progress_percentage: 0, next_due: "2026-08-01" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.status).toBe("on_track");
    });

    it("reg45 compliant when submitted within 183 days", () => {
      const reports = [
        makeReg45Report({ status: "completed", submitted_date: "2026-01-25", next_due: "2026-07-25" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.overview.reg45_compliant).toBe(true);
    });

    it("reg45 not compliant when last submission > 183 days ago", () => {
      const reports = [
        makeReg45Report({ status: "completed", submitted_date: "2025-11-01", next_due: "2026-06-01" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.overview.reg45_compliant).toBe(false);
    });

    it("reg45 not compliant when no completed reports", () => {
      const reports = [
        makeReg45Report({ status: "in_progress", submitted_date: null }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.overview.reg45_compliant).toBe(false);
    });

    it("counts completed reports in last 12 months", () => {
      const reports = [
        makeReg45Report({ id: "a", status: "completed", submitted_date: "2026-01-20", next_due: "2026-07-20" }),
        makeReg45Report({ id: "b", status: "completed", submitted_date: "2025-07-15", next_due: "2026-01-15" }),
        makeReg45Report({ id: "c", status: "completed", submitted_date: "2025-01-01", next_due: "2025-07-01" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.reports_last_12_months).toBe(2);
    });

    it("handles due_soon at exactly 30 days", () => {
      const reports = [
        makeReg45Report({ status: "not_started", progress_percentage: 0, next_due: "2026-06-24" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.status).toBe("due_soon");
    });

    it("picks highest progress from multiple in-progress reports", () => {
      const reports = [
        makeReg45Report({ id: "a", status: "in_progress", progress_percentage: 30, next_due: "2026-07-20" }),
        makeReg45Report({ id: "b", status: "in_progress", progress_percentage: 58, next_due: "2026-07-27" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports: reports })
      );

      expect(result.reg45_status.current_progress).toBe(58);
    });
  });

  // ── Notification Compliance ─────────────────────────────────────────────────

  describe("notification compliance", () => {
    it("computes on_time_rate correctly", () => {
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: true }),
        makeNotification({ id: "b", notified_within_24h: true }),
        makeNotification({ id: "c", notified_within_24h: false }),
        makeNotification({ id: "d", notified_within_24h: true }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.total_notifications).toBe(4);
      expect(result.notification_compliance.notified_on_time).toBe(3);
      expect(result.notification_compliance.on_time_rate).toBe(75);
    });

    it("counts pending notifications", () => {
      const notifications = [
        makeNotification({ id: "a", status: "pending" }),
        makeNotification({ id: "b", status: "notified" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.pending_notifications).toBe(1);
    });

    it("counts overdue notifications", () => {
      const notifications = [
        makeNotification({ id: "a", status: "overdue" }),
        makeNotification({ id: "b", status: "overdue" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.overdue_notifications).toBe(2);
    });

    it("returns 100% for empty notifications", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.notification_compliance.on_time_rate).toBe(100);
    });

    it("returns 0% when all late", () => {
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: false }),
        makeNotification({ id: "b", notified_within_24h: false }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.on_time_rate).toBe(0);
    });

    it("returns 100% when all on time", () => {
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: true }),
        makeNotification({ id: "b", notified_within_24h: true }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.on_time_rate).toBe(100);
    });
  });

  // ── Recommendation Tracker ──────────────────────────────────────────────────

  describe("recommendation tracker", () => {
    it("sums recommendations across reports", () => {
      const reports = [
        makeReg44Report({ id: "a", recommendations_count: 3, recommendations_completed: 2 }),
        makeReg44Report({ id: "b", recommendations_count: 4, recommendations_completed: 4 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.recommendation_tracker.total_recommendations).toBe(7);
      expect(result.recommendation_tracker.completed).toBe(6);
      expect(result.recommendation_tracker.outstanding).toBe(1);
    });

    it("computes completion rate correctly", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 10, recommendations_completed: 8 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.recommendation_tracker.completion_rate).toBe(80);
    });

    it("returns 100% for zero recommendations", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 0, recommendations_completed: 0 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.recommendation_tracker.completion_rate).toBe(100);
    });

    it("handles all completed", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 5, recommendations_completed: 5 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.recommendation_tracker.outstanding).toBe(0);
      expect(result.recommendation_tracker.completion_rate).toBe(100);
    });
  });

  // ── Overall Compliance Score ────────────────────────────────────────────────

  describe("overall compliance score", () => {
    it("returns 100 when everything is fully compliant", () => {
      const reg44Reports = generateMonthlyReg44(12);
      const reg45Reports = [
        makeReg45Report({ status: "completed", submitted_date: "2026-03-01", next_due: "2026-09-01" }),
      ];
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: true }),
        makeNotification({ id: "b", notified_within_24h: true }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports, reg45Reports, notifications })
      );

      expect(result.overview.overall_compliance_score).toBe(100);
    });

    it("returns 0 when nothing is compliant and no notifications", () => {
      // reg44 not compliant (0 visits), reg45 not compliant, no notifications (defaults to 100), no recs (defaults to 100)
      // Actually: 0 + 0 + 20 (100% of 20 for notification) + 20 (100% of 20 for recs) = 40
      const result = computeRegulatoryReportingIntelligence(makeInput());

      expect(result.overview.overall_compliance_score).toBe(40);
    });

    it("computes weighted score correctly with mixed compliance", () => {
      // reg44 compliant (30), reg45 not compliant (0), 50% notifications (10), 80% recs (16) = 56
      const reg44Reports = generateMonthlyReg44(12, { recsCount: 5, recsCompleted: 4 });
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: true }),
        makeNotification({ id: "b", notified_within_24h: false }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports, notifications })
      );

      // reg44: 30, reg45: 0, notifications: 50% -> 10, recs: 48/60 = 80% -> 16 = 56
      expect(result.overview.overall_compliance_score).toBe(56);
    });

    it("handles reg44 compliant but reg45 not compliant", () => {
      const reg44Reports = generateMonthlyReg44(12);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports })
      );

      // reg44: 30, reg45: 0, notifications: 20 (100%), recs: 20 (100%) = 70
      expect(result.overview.overall_compliance_score).toBe(70);
    });

    it("handles reg45 compliant but reg44 not compliant", () => {
      const reg45Reports = [
        makeReg45Report({ status: "completed", submitted_date: "2026-03-01", next_due: "2026-09-01" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports })
      );

      // reg44: 0, reg45: 30, notifications: 20, recs: 20 = 70
      expect(result.overview.overall_compliance_score).toBe(70);
    });
  });

  // ── Alerts ──────────────────────────────────────────────────────────────────

  describe("alerts", () => {
    it("raises critical alert when Reg 44 visit is overdue", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-05-20" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBeGreaterThanOrEqual(1);
      expect(critical.some((a) => a.message.includes("Reg 44 visit is overdue"))).toBe(true);
    });

    it("raises critical alert for pending notifications", () => {
      const notifications = [
        makeNotification({ id: "a", status: "pending", notified_within_24h: false }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.some((a) => a.message.includes("not been reported to Ofsted"))).toBe(true);
    });

    it("raises critical alert for overdue notifications", () => {
      const notifications = [
        makeNotification({ id: "a", status: "overdue", notified_within_24h: false }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.some((a) => a.message.includes("not been reported to Ofsted"))).toBe(true);
    });

    it("raises high alert when Reg 45 is overdue", () => {
      const reg45Reports = [
        makeReg45Report({ next_due: "2026-05-20", status: "not_started", progress_percentage: 0 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports })
      );

      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("Reg 45 quality of care review is overdue"))).toBe(true);
    });

    it("raises high alert when Reg 44 due within 3 days", () => {
      const reports = [
        makeReg44Report({ next_visit_due: "2026-05-27" }), // 2 days
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("due in 2 day"))).toBe(true);
    });

    it("raises high alert when Reg 44 due today (0 days)", () => {
      const reports = [
        makeReg44Report({ next_visit_due: TODAY }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("due in 0 day"))).toBe(true);
    });

    it("raises medium alert when outstanding recommendations > 5", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 10, recommendations_completed: 3 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("7 outstanding recommendations"))).toBe(true);
    });

    it("does NOT raise medium alert when outstanding recommendations = 5", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 10, recommendations_completed: 5 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("outstanding recommendations"));
      expect(medium).toHaveLength(0);
    });

    it("raises medium alert when Reg 45 progress below 50% within 30 days", () => {
      const reg45Reports = [
        makeReg45Report({ status: "in_progress", progress_percentage: 30, next_due: "2026-06-15" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports })
      );

      const medium = result.alerts.filter((a) => a.severity === "medium");
      expect(medium.some((a) => a.message.includes("30% complete"))).toBe(true);
    });

    it("does NOT raise medium alert when progress >= 50%", () => {
      const reg45Reports = [
        makeReg45Report({ status: "in_progress", progress_percentage: 50, next_due: "2026-06-15" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports })
      );

      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("% complete"));
      expect(medium).toHaveLength(0);
    });

    it("raises low alert when visits < 12 but > 0", () => {
      const reports = generateMonthlyReg44(8);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const low = result.alerts.filter((a) => a.severity === "low");
      expect(low.some((a) => a.message.includes("8 Reg 44 visit"))).toBe(true);
    });

    it("does NOT raise low alert when visits = 12", () => {
      const reports = generateMonthlyReg44(12);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const low = result.alerts.filter((a) => a.severity === "low" && a.message.includes("Reg 44 visit"));
      expect(low).toHaveLength(0);
    });

    it("does NOT raise low alert when visits = 0", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      const low = result.alerts.filter((a) => a.severity === "low" && a.message.includes("Reg 44 visit"));
      expect(low).toHaveLength(0);
    });

    it("handles plural correctly for 1 notification", () => {
      const notifications = [
        makeNotification({ id: "a", status: "pending", notified_within_24h: false }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      const critical = result.alerts.find((a) => a.message.includes("not been reported"));
      expect(critical?.message).toContain("1 notifiable event has");
    });

    it("handles plural correctly for multiple notifications", () => {
      const notifications = [
        makeNotification({ id: "a", status: "pending", notified_within_24h: false }),
        makeNotification({ id: "b", status: "overdue", notified_within_24h: false }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      const critical = result.alerts.find((a) => a.message.includes("not been reported"));
      expect(critical?.message).toContain("2 notifiable events have");
    });
  });

  // ── Insights ────────────────────────────────────────────────────────────────

  describe("insights", () => {
    it("generates critical insight for late notifications", () => {
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: false, status: "notified" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("not sent to Ofsted within 24 hours"))).toBe(true);
    });

    it("generates warning insight when reg44 compliance is at risk", () => {
      const reports = generateMonthlyReg44(10);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("Reg 44 compliance is at risk"))).toBe(true);
    });

    it("generates warning for outstanding recommendations > 3", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 8, recommendations_completed: 3 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((i) => i.text.includes("5 outstanding recommendations"))).toBe(true);
    });

    it("generates positive insight for full reg44 compliance", () => {
      const reports = generateMonthlyReg44(12);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("Full Reg 44 compliance achieved"))).toBe(true);
    });

    it("generates positive insight for all notifications on time", () => {
      const notifications = [
        makeNotification({ id: "a", notified_within_24h: true }),
        makeNotification({ id: "b", notified_within_24h: true }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("All notifiable events have been reported"))).toBe(true);
    });

    it("generates positive insight when last report recommendations all completed", () => {
      const reports = [
        makeReg44Report({
          id: "latest",
          visit_date: "2026-05-20",
          recommendations_count: 3,
          recommendations_completed: 3,
        }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("All recommendations from the most recent"))).toBe(true);
    });

    it("does NOT generate positive insight when last report has outstanding recs", () => {
      const reports = [
        makeReg44Report({
          id: "latest",
          visit_date: "2026-05-20",
          recommendations_count: 3,
          recommendations_completed: 2,
        }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const positive = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("All recommendations from the most recent")
      );
      expect(positive).toHaveLength(0);
    });

    it("does NOT generate all-on-time insight when no notifications exist", () => {
      const result = computeRegulatoryReportingIntelligence(makeInput());

      const positive = result.insights.filter(
        (i) => i.severity === "positive" && i.text.includes("All notifiable events")
      );
      expect(positive).toHaveLength(0);
    });

    it("does NOT generate compliance-at-risk warning for fewer than 9 visits", () => {
      const reports = generateMonthlyReg44(8);
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const warnings = result.insights.filter(
        (i) => i.severity === "warning" && i.text.includes("Reg 44 compliance is at risk")
      );
      expect(warnings).toHaveLength(0);
    });

    it("does NOT generate outstanding-recs warning for 3 or fewer", () => {
      const reports = [
        makeReg44Report({ recommendations_count: 5, recommendations_completed: 2 }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      const warnings = result.insights.filter(
        (i) => i.severity === "warning" && i.text.includes("outstanding recommendations")
      );
      expect(warnings).toHaveLength(0);
    });
  });

  // ── Chamberlain House Scenario ──────────────────────────────────────────────────────

  describe("Chamberlain House test data scenario", () => {
    function buildOakHouseInput(): RegulatoryReportingIntelligenceInput {
      // 11 completed reports (1 per month for the last 11 months) + 1 in_progress
      const completedReports: Reg44ReportInput[] = [];
      for (let i = 0; i < 11; i++) {
        const daysAgo = 28 + i * 30; // starting 28 days ago
        const dt = new Date(new Date(TODAY + "T00:00:00Z").getTime() - daysAgo * 86_400_000);
        const visitDate = dt.toISOString().slice(0, 10);
        completedReports.push(
          makeReg44Report({
            id: `r44_oak_${i}`,
            visit_date: visitDate,
            status: "completed",
            submitted_date: visitDate,
            recommendations_count: i === 0 ? 3 : 2,
            recommendations_completed: i === 0 ? 2 : 2,
            overall_rating: "good",
            next_visit_due: new Date(dt.getTime() + 30 * 86_400_000).toISOString().slice(0, 10),
          })
        );
      }

      // Current month: in_progress, visit 3 days ago
      const inProgress = makeReg44Report({
        id: "r44_oak_current",
        visit_date: "2026-05-22",
        status: "in_progress",
        submitted_date: null,
        recommendations_count: 0,
        recommendations_completed: 0,
        overall_rating: "good",
        next_visit_due: "2026-05-27", // 2 days from today
      });

      const reg44Reports = [inProgress, ...completedReports];

      // Reg 45: last submitted 4 months ago, current in progress at 58%
      const reg45Reports = [
        makeReg45Report({
          id: "r45_oak_last",
          status: "completed",
          submitted_date: "2026-01-25",
          period_start: "2025-07-01",
          period_end: "2025-12-31",
          next_due: "2026-07-27",
        }),
        makeReg45Report({
          id: "r45_oak_current",
          status: "in_progress",
          submitted_date: null,
          period_start: "2026-01-01",
          period_end: "2026-06-30",
          progress_percentage: 58,
          next_due: "2026-07-27",
        }),
      ];

      // Notifications: 4 total, 3 on time, 1 late (allegation)
      const notifications: NotificationInput[] = [
        makeNotification({ id: "ne_oak_1", event_type: "serious_injury", notified_within_24h: true, status: "notified", event_date: "2026-03-10" }),
        makeNotification({ id: "ne_oak_2", event_type: "allegation", notified_within_24h: false, status: "notified", event_date: "2026-02-15", notified_date: "2026-02-17" }),
        makeNotification({ id: "ne_oak_3", event_type: "police_involvement", notified_within_24h: true, status: "notified", event_date: "2026-04-05" }),
        makeNotification({ id: "ne_oak_4", event_type: "absconder", notified_within_24h: true, status: "notified", event_date: "2026-01-20" }),
      ];

      return {
        reg44Reports,
        reg45Reports,
        notifications,
        staff: [makeStaff()],
        today: TODAY,
      };
    }

    it("computes 12 visits in last 12 months", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.reg44_status.visits_last_12_months).toBe(12);
    });

    it("computes 11 completed reports", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.reg44_status.reports_completed).toBe(11);
    });

    it("shows next visit due in 2 days", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.reg44_status.next_visit_due).toBe("2026-05-27");
      expect(result.reg44_status.days_until_due).toBe(2);
    });

    it("marks reg44 as due_soon", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.reg44_status.status).toBe("due_soon");
    });

    it("marks reg44 as compliant (12 visits)", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.overview.reg44_compliant).toBe(true);
    });

    it("marks reg45 as in_progress", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.reg45_status.status).toBe("in_progress");
      expect(result.reg45_status.current_progress).toBe(58);
    });

    it("marks reg45 as compliant (submitted 4 months ago)", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.overview.reg45_compliant).toBe(true);
    });

    it("computes 75% notification on-time rate", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.notification_compliance.on_time_rate).toBe(75);
      expect(result.notification_compliance.notified_on_time).toBe(3);
    });

    it("has 0 pending/overdue notifications", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.notification_compliance.pending_notifications).toBe(0);
      expect(result.notification_compliance.overdue_notifications).toBe(0);
    });

    it("tracks 1 outstanding recommendation", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      expect(result.recommendation_tracker.outstanding).toBe(1);
    });

    it("generates high alert for due_soon visit within 3 days", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.some((a) => a.message.includes("due in 2 day"))).toBe(true);
    });

    it("generates critical insight for the late allegation notification", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.some((i) => i.text.includes("not sent to Ofsted within 24 hours"))).toBe(true);
    });

    it("generates positive insight for full reg44 compliance", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((i) => i.text.includes("Full Reg 44 compliance achieved"))).toBe(true);
    });

    it("computes a realistic overall compliance score", () => {
      const result = computeRegulatoryReportingIntelligence(buildOakHouseInput());
      // reg44: 30 (compliant), reg45: 30 (compliant), notifications: 75% -> 15, recs: high% -> ~19
      expect(result.overview.overall_compliance_score).toBeGreaterThan(70);
      expect(result.overview.overall_compliance_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("defaults today to current date when not provided", () => {
      const result = computeRegulatoryReportingIntelligence({
        reg44Reports: [],
        reg45Reports: [],
        notifications: [],
        staff: [],
      });

      // Should not throw, and should produce valid output
      expect(result.overview).toBeDefined();
      expect(result.alerts).toBeInstanceOf(Array);
    });

    it("handles reports with visit_date equal to today", () => {
      const reports = [
        makeReg44Report({ visit_date: TODAY, next_visit_due: "2026-06-25" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.last_visit_date).toBe(TODAY);
    });

    it("handles single visit that is both last visit and only data", () => {
      const reports = [
        makeReg44Report({ visit_date: "2026-05-01", next_visit_due: "2026-06-01" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.visits_last_12_months).toBe(1);
      expect(result.reg44_status.last_visit_date).toBe("2026-05-01");
    });

    it("handles notification with no notified_date", () => {
      const notifications = [
        makeNotification({ notified_date: null, notified_within_24h: false, status: "pending" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.pending_notifications).toBe(1);
    });

    it("handles reg45 with 0% progress and far-future due date", () => {
      const reg45Reports = [
        makeReg45Report({ status: "not_started", progress_percentage: 0, next_due: "2027-01-01" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg45Reports })
      );

      expect(result.reg45_status.status).toBe("on_track");
      expect(result.reg45_status.current_progress).toBe(0);
    });

    it("handles many notifications of mixed types", () => {
      const types = ["serious_injury", "death", "allegation", "absconder", "police_involvement", "restrictive_intervention", "other"];
      const notifications = types.map((t, i) =>
        makeNotification({
          id: `ne_${i}`,
          event_type: t,
          notified_within_24h: i % 2 === 0,
        })
      );
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ notifications })
      );

      expect(result.notification_compliance.total_notifications).toBe(7);
      expect(result.notification_compliance.notified_on_time).toBe(4);
    });

    it("handles all reg44 reports as draft/overdue", () => {
      const reports = [
        makeReg44Report({ id: "a", status: "draft", next_visit_due: "2026-06-01" }),
        makeReg44Report({ id: "b", status: "overdue", next_visit_due: "2026-05-15" }),
      ];
      const result = computeRegulatoryReportingIntelligence(
        makeInput({ reg44Reports: reports })
      );

      expect(result.reg44_status.reports_completed).toBe(0);
      expect(result.reg44_status.average_rating).toBe("none");
    });
  });
});
