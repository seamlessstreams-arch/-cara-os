import { describe, it, expect } from "vitest";
import {
  computeMultiAgencyMetrics,
  identifyMultiAgencyAlerts,
  type ProfessionalContact,
  type LACReview,
  type ProfessionalMeeting,
} from "./multi-agency-service";

const NOW = new Date("2026-05-21T12:00:00Z");

function makeContact(overrides: Partial<ProfessionalContact> = {}): ProfessionalContact {
  return {
    id: "c-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Taylor",
    professional_name: "Dr Smith",
    role: "social_worker",
    organisation: "LA Services",
    email: "dr.smith@la.gov.uk",
    phone: "01onal",
    is_primary_contact: true,
    relationship_start_date: "2025-01-01",
    last_contact_date: "2026-05-01",
    next_contact_due: "2026-06-01",
    status: "active",
    notes: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

function makeReview(overrides: Partial<LACReview> = {}): LACReview {
  return {
    id: "r-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Taylor",
    review_date: "2026-03-15",
    review_type: "subsequent",
    chaired_by: "IRO Jones",
    venue: "Office",
    child_attended: true,
    child_contributed: true,
    contribution_method: "attended_in_person",
    care_plan_agreed: true,
    placement_confirmed: true,
    key_decisions: [],
    actions: [],
    next_review_date: "2026-09-15",
    next_review_type: "subsequent",
    home_report_submitted: true,
    home_report_submitted_date: "2026-03-10",
    status: "completed",
    notes: null,
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-16T00:00:00Z",
    ...overrides,
  };
}

function makeMeeting(overrides: Partial<ProfessionalMeeting> = {}): ProfessionalMeeting {
  return {
    id: "m-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alex Taylor",
    meeting_date: "2026-05-01",
    meeting_type: "professionals_meeting",
    purpose: "Review care plan",
    location: "Home",
    attendees: [],
    apologies: [],
    home_representative: "Jane Doe",
    key_decisions: [],
    actions: [],
    follow_up_date: "2026-06-01",
    follow_up_completed: true,
    status: "completed",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-02T00:00:00Z",
    ...overrides,
  };
}

// ── computeMultiAgencyMetrics ──────────────────────────────────────────

describe("computeMultiAgencyMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMultiAgencyMetrics([], [], []);
    expect(m.total_contacts).toBe(0);
    expect(m.active_contacts).toBe(0);
    expect(m.children_with_social_worker).toBe(0);
    expect(m.overdue_contacts).toBe(0);
    expect(m.child_participation_rate).toBeNull();;
    expect(m.care_plan_agreement_rate).toBeNull();;
    expect(m.home_report_submission_rate).toBeNull();;
    expect(m.follow_up_completion_rate).toBeNull();;
    expect(m.by_meeting_type).toEqual({});
  });

  it("counts contacts, active contacts, and children with social worker", () => {
    const contacts = [
      makeContact({ id: "c-1", child_id: "child-1", role: "social_worker", status: "active" }),
      makeContact({ id: "c-2", child_id: "child-2", role: "gp", status: "active" }),
      makeContact({ id: "c-3", child_id: "child-1", role: "teacher", status: "inactive" }),
    ];
    const m = computeMultiAgencyMetrics(contacts, [], []);
    expect(m.total_contacts).toBe(3);
    expect(m.active_contacts).toBe(2);
    expect(m.children_with_social_worker).toBe(1);
  });

  it("computes review rates correctly", () => {
    const reviews = [
      makeReview({ id: "r-1", child_contributed: true, care_plan_agreed: true, home_report_submitted: true }),
      makeReview({ id: "r-2", child_contributed: false, care_plan_agreed: false, home_report_submitted: false }),
    ];
    const m = computeMultiAgencyMetrics([], reviews, []);
    expect(m.child_participation_rate).toBe(50);
    expect(m.care_plan_agreement_rate).toBe(50);
    expect(m.home_report_submission_rate).toBe(50);
  });

  it("computes meeting metrics and follow-up rate", () => {
    const meetings = [
      makeMeeting({ id: "m-1", meeting_type: "pep_meeting", follow_up_date: "2026-06-01", follow_up_completed: true }),
      makeMeeting({ id: "m-2", meeting_type: "pep_meeting", follow_up_date: "2026-06-01", follow_up_completed: false }),
      makeMeeting({ id: "m-3", meeting_type: "strategy_meeting", follow_up_date: null, follow_up_completed: false }),
    ];
    const m = computeMultiAgencyMetrics([], [], meetings);
    expect(m.by_meeting_type).toEqual({ pep_meeting: 2, strategy_meeting: 1 });
    // 2 meetings with follow_up_date, 1 completed => 50%
    expect(m.follow_up_completion_rate).toBe(50);
  });
});

// ── identifyMultiAgencyAlerts ──────────────────────────────────────────

describe("identifyMultiAgencyAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyMultiAgencyAlerts([], [], [], NOW);
    expect(alerts).toHaveLength(0);
  });

  it("flags missing_social_worker (critical) when child has no active SW", () => {
    const reviews = [makeReview({ child_id: "child-1", child_name: "Alex Taylor" })];
    const alerts = identifyMultiAgencyAlerts([], reviews, [], NOW);
    const swAlerts = alerts.filter((a) => a.type === "missing_social_worker");
    expect(swAlerts.length).toBeGreaterThanOrEqual(1);
    expect(swAlerts[0].severity).toBe("critical");
  });

  it("flags sw_contact_overdue (high) when overdue > 14 days", () => {
    // next_contact_due 20 days ago
    const twentyDaysAgo = new Date(NOW.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const contacts = [
      makeContact({ role: "social_worker", next_contact_due: twentyDaysAgo, status: "active" }),
    ];
    const alerts = identifyMultiAgencyAlerts(contacts, [], [], NOW);
    const overdueAlerts = alerts.filter((a) => a.type === "sw_contact_overdue");
    expect(overdueAlerts.length).toBe(1);
    expect(overdueAlerts[0].severity).toBe("high");
  });

  it("does NOT flag sw_contact_overdue when overdue <= 14 days", () => {
    // next_contact_due 10 days ago
    const tenDaysAgo = new Date(NOW.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const contacts = [
      makeContact({ role: "social_worker", next_contact_due: tenDaysAgo, status: "active" }),
    ];
    const alerts = identifyMultiAgencyAlerts(contacts, [], [], NOW);
    const overdueAlerts = alerts.filter((a) => a.type === "sw_contact_overdue");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("flags lac_review_overdue (critical) for scheduled review in the past", () => {
    const reviews = [
      makeReview({ status: "scheduled", review_date: "2026-04-01" }),
    ];
    // Provide a contact with active SW so we don't also get missing_social_worker
    const contacts = [makeContact({ child_id: "child-1", role: "social_worker", status: "active" })];
    const alerts = identifyMultiAgencyAlerts(contacts, reviews, [], NOW);
    const overdueAlerts = alerts.filter((a) => a.type === "lac_review_overdue");
    expect(overdueAlerts.length).toBe(1);
    expect(overdueAlerts[0].severity).toBe("critical");
  });

  it("flags home_report_not_submitted (high) within 7 days of review", () => {
    // Review scheduled in 3 days, home report not submitted
    const threeDaysLater = new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const reviews = [
      makeReview({ status: "scheduled", review_date: threeDaysLater, home_report_submitted: false }),
    ];
    const contacts = [makeContact({ child_id: "child-1", role: "social_worker", status: "active" })];
    const alerts = identifyMultiAgencyAlerts(contacts, reviews, [], NOW);
    const reportAlerts = alerts.filter((a) => a.type === "home_report_not_submitted");
    expect(reportAlerts.length).toBe(1);
    expect(reportAlerts[0].severity).toBe("high");
  });

  it("flags child_not_participating (medium) for completed review without contribution", () => {
    const reviews = [
      makeReview({ status: "completed", child_contributed: false }),
    ];
    const contacts = [makeContact({ child_id: "child-1", role: "social_worker", status: "active" })];
    const alerts = identifyMultiAgencyAlerts(contacts, reviews, [], NOW);
    const participationAlerts = alerts.filter((a) => a.type === "child_not_participating");
    expect(participationAlerts.length).toBe(1);
    expect(participationAlerts[0].severity).toBe("medium");
  });

  it("flags follow_up_overdue (high) when meeting follow-up not completed and date passed", () => {
    const meetings = [
      makeMeeting({
        status: "completed",
        follow_up_date: "2026-04-01",
        follow_up_completed: false,
      }),
    ];
    const contacts = [makeContact({ child_id: "child-1", role: "social_worker", status: "active" })];
    const alerts = identifyMultiAgencyAlerts(contacts, [], meetings, NOW);
    const followUpAlerts = alerts.filter((a) => a.type === "follow_up_overdue");
    expect(followUpAlerts.length).toBe(1);
    expect(followUpAlerts[0].severity).toBe("high");
  });

  it("flags meeting_cancelled_no_reschedule (medium) when cancelled without replacement", () => {
    const meetings = [
      makeMeeting({
        id: "m-1",
        status: "cancelled",
        child_id: "child-1",
        meeting_type: "strategy_meeting",
        meeting_date: "2026-05-01",
      }),
    ];
    const contacts = [makeContact({ child_id: "child-1", role: "social_worker", status: "active" })];
    const alerts = identifyMultiAgencyAlerts(contacts, [], meetings, NOW);
    const cancelAlerts = alerts.filter((a) => a.type === "meeting_cancelled_no_reschedule");
    expect(cancelAlerts.length).toBe(1);
    expect(cancelAlerts[0].severity).toBe("medium");
  });
});
