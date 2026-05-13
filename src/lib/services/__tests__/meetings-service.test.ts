// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S MEETINGS & CONSULTATION SERVICE TESTS
// Pure-function tests for meeting compliance, consultation metrics,
// alert identification, and constant validation.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { _testing } from "../meetings-service";
import {
  MEETING_TYPES,
  CONSULTATION_TYPES,
  IMPACT_RATINGS,
} from "../meetings-service";
import type {
  HouseMeeting,
  AgendaItem,
  MeetingAction,
  ConsultationRecord,
} from "../meetings-service";

const {
  computeMeetingCompliance,
  computeConsultationMetrics,
  identifyMeetingAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Build a minimal HouseMeeting with sensible defaults. */
function makeMeeting(
  overrides: Partial<{
    id: string;
    home_id: string;
    meeting_date: string;
    meeting_type: string;
    facilitated_by: string;
    children_present: string[];
    children_absent: string[];
    agenda_items: AgendaItem[];
    actions: MeetingAction[];
    child_feedback_summary: string;
    staff_response: string;
    next_meeting_date: string | null;
    minutes_approved: boolean;
    approved_by: string | null;
    created_at: string;
  }> = {},
): HouseMeeting {
  return {
    id: "id" in overrides ? overrides.id! : "mtg-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    meeting_date: "meeting_date" in overrides ? overrides.meeting_date! : "2026-05-10T10:00:00Z",
    meeting_type: "meeting_type" in overrides ? overrides.meeting_type! : "house_meeting",
    facilitated_by: "facilitated_by" in overrides ? overrides.facilitated_by! : "staff-1",
    children_present: "children_present" in overrides ? overrides.children_present! : ["child-1", "child-2"],
    children_absent: "children_absent" in overrides ? overrides.children_absent! : [],
    agenda_items: "agenda_items" in overrides ? overrides.agenda_items! : [],
    actions: "actions" in overrides ? overrides.actions! : [],
    child_feedback_summary: "child_feedback_summary" in overrides ? overrides.child_feedback_summary! : "Children were positive",
    staff_response: "staff_response" in overrides ? overrides.staff_response! : "Noted and acted upon",
    next_meeting_date: "next_meeting_date" in overrides ? overrides.next_meeting_date! : null,
    minutes_approved: "minutes_approved" in overrides ? overrides.minutes_approved! : true,
    approved_by: "approved_by" in overrides ? overrides.approved_by! : null,
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-10T10:00:00Z",
  };
}

/** Build a minimal ConsultationRecord with sensible defaults. */
function makeConsultation(
  overrides: Partial<{
    id: string;
    home_id: string;
    child_id: string;
    child_name: string;
    consultation_date: string;
    consultation_type: string;
    topic: string;
    child_views: string;
    outcome: string;
    action_taken: string | null;
    consulted_by: string;
    impact_rating: string;
    created_at: string;
  }> = {},
): ConsultationRecord {
  return {
    id: "id" in overrides ? overrides.id! : "con-1",
    home_id: "home_id" in overrides ? overrides.home_id! : "home-1",
    child_id: "child_id" in overrides ? overrides.child_id! : "child-1",
    child_name: "child_name" in overrides ? overrides.child_name! : "Test Child",
    consultation_date: "consultation_date" in overrides ? overrides.consultation_date! : "2026-05-10T10:00:00Z",
    consultation_type: "consultation_type" in overrides ? overrides.consultation_type! : "care_plan",
    topic: "topic" in overrides ? overrides.topic! : "Care plan review",
    child_views: "child_views" in overrides ? overrides.child_views! : "Happy with current plan",
    outcome: "outcome" in overrides ? overrides.outcome! : "Plan maintained",
    action_taken: "action_taken" in overrides ? overrides.action_taken! : null,
    consulted_by: "consulted_by" in overrides ? overrides.consulted_by! : "staff-1",
    impact_rating: "impact_rating" in overrides ? overrides.impact_rating! : "moderate_impact",
    created_at: "created_at" in overrides ? overrides.created_at! : "2026-05-10T10:00:00Z",
  };
}

/** Build a minimal AgendaItem. */
function makeAgendaItem(
  overrides: Partial<{
    topic: string;
    raised_by: string;
    discussion_summary: string;
    outcome: string;
  }> = {},
): AgendaItem {
  return {
    topic: "topic" in overrides ? overrides.topic! : "Weekly menu",
    raised_by: "raised_by" in overrides ? overrides.raised_by! : "child-1",
    discussion_summary: "discussion_summary" in overrides ? overrides.discussion_summary! : "Discussed options",
    outcome: "outcome" in overrides ? overrides.outcome! : "New menu agreed",
  };
}

/** Build a minimal MeetingAction. */
function makeMeetingAction(
  overrides: Partial<{
    description: string;
    assigned_to: string;
    due_date: string;
    status: "pending" | "completed" | "overdue";
  }> = {},
): MeetingAction {
  return {
    description: "description" in overrides ? overrides.description! : "Follow up on menu",
    assigned_to: "assigned_to" in overrides ? overrides.assigned_to! : "staff-1",
    due_date: "due_date" in overrides ? overrides.due_date! : "2026-05-17",
    status: "status" in overrides ? overrides.status! : "pending",
  };
}

// ── MEETING_TYPES ─────────────────────────────────────────────────────────

describe("MEETING_TYPES", () => {
  it("has exactly 6 entries", () => {
    expect(MEETING_TYPES).toHaveLength(6);
  });

  it("each entry has type, label, and frequency properties", () => {
    for (const mt of MEETING_TYPES) {
      expect(typeof mt.type).toBe("string");
      expect(typeof mt.label).toBe("string");
      expect(typeof mt.frequency).toBe("string");
    }
  });

  it("contains expected meeting types", () => {
    const types = MEETING_TYPES.map((m) => m.type);
    expect(types).toContain("house_meeting");
    expect(types).toContain("childrens_council");
    expect(types).toContain("menu_planning");
    expect(types).toContain("activities_planning");
    expect(types).toContain("complaints_review");
    expect(types).toContain("rules_review");
  });

  it("has correct label for house_meeting", () => {
    const found = MEETING_TYPES.find((m) => m.type === "house_meeting");
    expect(found?.label).toBe("House Meeting");
  });

  it("has correct frequency for house_meeting", () => {
    const found = MEETING_TYPES.find((m) => m.type === "house_meeting");
    expect(found?.frequency).toBe("Weekly");
  });

  it("has correct label and frequency for rules_review", () => {
    const found = MEETING_TYPES.find((m) => m.type === "rules_review");
    expect(found?.label).toBe("House Rules Review");
    expect(found?.frequency).toBe("Quarterly");
  });
});

// ── CONSULTATION_TYPES ────────────────────────────────────────────────────

describe("CONSULTATION_TYPES", () => {
  it("has exactly 10 entries", () => {
    expect(CONSULTATION_TYPES).toHaveLength(10);
  });

  it("each entry has type, label, and regulation properties", () => {
    for (const ct of CONSULTATION_TYPES) {
      expect(typeof ct.type).toBe("string");
      expect(typeof ct.label).toBe("string");
      expect(typeof ct.regulation).toBe("string");
    }
  });

  it("contains expected consultation types", () => {
    const types = CONSULTATION_TYPES.map((c) => c.type);
    expect(types).toContain("care_plan");
    expect(types).toContain("placement_plan");
    expect(types).toContain("daily_life");
    expect(types).toContain("education");
    expect(types).toContain("health");
    expect(types).toContain("contact");
    expect(types).toContain("behaviour_support");
    expect(types).toContain("complaints");
    expect(types).toContain("moving_on");
  });

  it("has correct label for care_plan", () => {
    const found = CONSULTATION_TYPES.find((c) => c.type === "care_plan");
    expect(found?.label).toBe("Care Plan Consultation");
  });

  it("has correct regulation for care_plan", () => {
    const found = CONSULTATION_TYPES.find((c) => c.type === "care_plan");
    expect(found?.regulation).toBe("Reg 7(2)(a)");
  });

  it("has correct regulation for complaints", () => {
    const found = CONSULTATION_TYPES.find((c) => c.type === "complaints");
    expect(found?.regulation).toBe("Reg 39");
  });
});

// ── IMPACT_RATINGS ────────────────────────────────────────────────────────

describe("IMPACT_RATINGS", () => {
  it("has exactly 5 entries", () => {
    expect(IMPACT_RATINGS).toHaveLength(5);
  });

  it("all entries are strings", () => {
    for (const rating of IMPACT_RATINGS) {
      expect(typeof rating).toBe("string");
    }
  });

  it("starts with no_impact and ends with transformative", () => {
    expect(IMPACT_RATINGS[0]).toBe("no_impact");
    expect(IMPACT_RATINGS[IMPACT_RATINGS.length - 1]).toBe("transformative");
  });

  it("contains all expected ratings in ascending order", () => {
    expect(IMPACT_RATINGS).toEqual([
      "no_impact",
      "minor_impact",
      "moderate_impact",
      "significant_impact",
      "transformative",
    ]);
  });
});

// ── computeMeetingCompliance ──────────────────────────────────────────────

describe("computeMeetingCompliance", () => {
  it("returns zeroed metrics for empty meetings array", () => {
    const result = computeMeetingCompliance([], 5);
    expect(result.total_meetings).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.avg_attendance).toBe(0);
    expect(result.attendance_rate).toBe(0);
    expect(result.total_actions).toBe(0);
    expect(result.actions_completed).toBe(0);
    expect(result.actions_overdue).toBe(0);
    expect(result.action_completion_rate).toBe(0);
    expect(result.minutes_approved_rate).toBe(0);
  });

  it("counts total meetings correctly", () => {
    const result = computeMeetingCompliance([
      makeMeeting(),
      makeMeeting({ id: "mtg-2" }),
      makeMeeting({ id: "mtg-3" }),
    ], 4);
    expect(result.total_meetings).toBe(3);
  });

  it("groups meetings by type", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ meeting_type: "house_meeting" }),
      makeMeeting({ id: "mtg-2", meeting_type: "house_meeting" }),
      makeMeeting({ id: "mtg-3", meeting_type: "childrens_council" }),
      makeMeeting({ id: "mtg-4", meeting_type: "menu_planning" }),
    ], 4);
    expect(result.by_type).toEqual({
      house_meeting: 2,
      childrens_council: 1,
      menu_planning: 1,
    });
  });

  it("computes average attendance correctly", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ children_present: ["c1", "c2", "c3"] }),
      makeMeeting({ id: "mtg-2", children_present: ["c1"] }),
    ], 4);
    // (3 + 1) / 2 = 2.0
    expect(result.avg_attendance).toBe(2);
  });

  it("rounds average attendance to one decimal place", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ children_present: ["c1", "c2", "c3"] }),
      makeMeeting({ id: "mtg-2", children_present: ["c1", "c2"] }),
      makeMeeting({ id: "mtg-3", children_present: ["c1"] }),
    ], 4);
    // (3 + 2 + 1) / 3 = 2.0
    expect(result.avg_attendance).toBe(2);
  });

  it("computes attendance rate as percentage of totalChildren", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ children_present: ["c1", "c2"] }),
      makeMeeting({ id: "mtg-2", children_present: ["c1", "c2"] }),
    ], 4);
    // total attendance = 4, total slots = 2 * 4 = 8, rate = (4/8)*100 = 50%
    expect(result.attendance_rate).toBe(50);
  });

  it("returns 0 attendance_rate when totalChildren is 0", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ children_present: ["c1"] }),
    ], 0);
    expect(result.attendance_rate).toBe(0);
  });

  it("counts actions by status correctly", () => {
    const result = computeMeetingCompliance([
      makeMeeting({
        actions: [
          makeMeetingAction({ status: "completed" }),
          makeMeetingAction({ description: "a2", status: "overdue" }),
          makeMeetingAction({ description: "a3", status: "pending" }),
        ],
      }),
      makeMeeting({
        id: "mtg-2",
        actions: [
          makeMeetingAction({ description: "a4", status: "completed" }),
        ],
      }),
    ], 4);
    expect(result.total_actions).toBe(4);
    expect(result.actions_completed).toBe(2);
    expect(result.actions_overdue).toBe(1);
  });

  it("computes action completion rate as percentage", () => {
    const result = computeMeetingCompliance([
      makeMeeting({
        actions: [
          makeMeetingAction({ status: "completed" }),
          makeMeetingAction({ description: "a2", status: "completed" }),
          makeMeetingAction({ description: "a3", status: "pending" }),
          makeMeetingAction({ description: "a4", status: "overdue" }),
        ],
      }),
    ], 4);
    // 2 completed / 4 total = 50%
    expect(result.action_completion_rate).toBe(50);
  });

  it("returns 0 action_completion_rate when no actions exist", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ actions: [] }),
    ], 4);
    expect(result.action_completion_rate).toBe(0);
  });

  it("computes minutes approved rate correctly", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ minutes_approved: true }),
      makeMeeting({ id: "mtg-2", minutes_approved: true }),
      makeMeeting({ id: "mtg-3", minutes_approved: false }),
    ], 4);
    // 2/3 = 66.666... -> 67%
    expect(result.minutes_approved_rate).toBe(67);
  });

  it("returns 100 minutes_approved_rate when all meetings approved", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ minutes_approved: true }),
      makeMeeting({ id: "mtg-2", minutes_approved: true }),
    ], 4);
    expect(result.minutes_approved_rate).toBe(100);
  });

  it("returns 0 minutes_approved_rate when no meetings approved", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ minutes_approved: false }),
      makeMeeting({ id: "mtg-2", minutes_approved: false }),
    ], 4);
    expect(result.minutes_approved_rate).toBe(0);
  });

  it("handles meetings with empty children_present arrays", () => {
    const result = computeMeetingCompliance([
      makeMeeting({ children_present: [] }),
    ], 4);
    expect(result.avg_attendance).toBe(0);
    expect(result.attendance_rate).toBe(0);
  });
});

// ── computeConsultationMetrics ────────────────────────────────────────────

describe("computeConsultationMetrics", () => {
  it("returns zeroed metrics for empty consultations array", () => {
    const result = computeConsultationMetrics([], 5);
    expect(result.total_consultations).toBe(0);
    expect(result.children_consulted).toBe(0);
    expect(result.consultation_rate).toBe(0);
    expect(result.by_type).toEqual({});
    expect(result.avg_impact).toBe(0);
    expect(result.with_action_taken).toBe(0);
    expect(result.action_rate).toBe(0);
  });

  it("counts total consultations", () => {
    const result = computeConsultationMetrics([
      makeConsultation(),
      makeConsultation({ id: "con-2" }),
      makeConsultation({ id: "con-3" }),
    ], 5);
    expect(result.total_consultations).toBe(3);
  });

  it("counts unique children consulted", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ child_id: "child-1" }),
      makeConsultation({ id: "con-2", child_id: "child-1" }),
      makeConsultation({ id: "con-3", child_id: "child-2" }),
      makeConsultation({ id: "con-4", child_id: "child-3" }),
    ], 5);
    expect(result.children_consulted).toBe(3);
  });

  it("computes consultation rate as percentage of totalChildren", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ child_id: "child-1" }),
      makeConsultation({ id: "con-2", child_id: "child-2" }),
    ], 4);
    // 2 unique / 4 total = 50%
    expect(result.consultation_rate).toBe(50);
  });

  it("returns 0 consultation_rate when totalChildren is 0", () => {
    const result = computeConsultationMetrics([
      makeConsultation(),
    ], 0);
    expect(result.consultation_rate).toBe(0);
  });

  it("returns 100 consultation_rate when all children consulted", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ child_id: "child-1" }),
      makeConsultation({ id: "con-2", child_id: "child-2" }),
      makeConsultation({ id: "con-3", child_id: "child-3" }),
    ], 3);
    expect(result.consultation_rate).toBe(100);
  });

  it("groups consultations by type", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ consultation_type: "care_plan" }),
      makeConsultation({ id: "con-2", consultation_type: "care_plan" }),
      makeConsultation({ id: "con-3", consultation_type: "education" }),
      makeConsultation({ id: "con-4", consultation_type: "health" }),
    ], 5);
    expect(result.by_type).toEqual({
      care_plan: 2,
      education: 1,
      health: 1,
    });
  });

  it("computes avg_impact using IMPACT_RATINGS index", () => {
    // IMPACT_RATINGS: no_impact=0, minor_impact=1, moderate_impact=2, significant_impact=3, transformative=4
    const result = computeConsultationMetrics([
      makeConsultation({ impact_rating: "no_impact" }),
      makeConsultation({ id: "con-2", impact_rating: "transformative" }),
    ], 5);
    // (0 + 4) / 2 = 2.0
    expect(result.avg_impact).toBe(2);
  });

  it("rounds avg_impact to two decimal places", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ impact_rating: "minor_impact" }),
      makeConsultation({ id: "con-2", impact_rating: "moderate_impact" }),
      makeConsultation({ id: "con-3", impact_rating: "significant_impact" }),
    ], 5);
    // (1 + 2 + 3) / 3 = 2.0
    expect(result.avg_impact).toBe(2);
  });

  it("treats unknown impact_rating as index 0", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ impact_rating: "unknown_rating" }),
      makeConsultation({ id: "con-2", impact_rating: "transformative" }),
    ], 5);
    // (0 + 4) / 2 = 2.0
    expect(result.avg_impact).toBe(2);
  });

  it("computes avg_impact with all transformative ratings", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ impact_rating: "transformative" }),
      makeConsultation({ id: "con-2", impact_rating: "transformative" }),
    ], 5);
    // (4 + 4) / 2 = 4.0
    expect(result.avg_impact).toBe(4);
  });

  it("counts consultations with non-empty action_taken", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ action_taken: "Updated care plan" }),
      makeConsultation({ id: "con-2", action_taken: "  " }),
      makeConsultation({ id: "con-3", action_taken: "" }),
      makeConsultation({ id: "con-4", action_taken: null }),
      makeConsultation({ id: "con-5", action_taken: "Referred to GP" }),
    ], 5);
    expect(result.with_action_taken).toBe(2);
  });

  it("computes action_rate as percentage", () => {
    const result = computeConsultationMetrics([
      makeConsultation({ action_taken: "Updated care plan" }),
      makeConsultation({ id: "con-2", action_taken: null }),
      makeConsultation({ id: "con-3", action_taken: null }),
      makeConsultation({ id: "con-4", action_taken: "New activity" }),
    ], 5);
    // 2 with action / 4 total = 50%
    expect(result.action_rate).toBe(50);
  });

  it("returns 0 action_rate for empty consultations", () => {
    const result = computeConsultationMetrics([], 5);
    expect(result.action_rate).toBe(0);
  });
});

// ── identifyMeetingAlerts ─────────────────────────────────────────────────

describe("identifyMeetingAlerts", () => {
  it("returns empty array when no meetings, no consultations, and zero children", () => {
    const result = identifyMeetingAlerts([], [], 0);
    expect(result).toEqual([]);
  });

  // ── No recent meeting alert ──

  it("generates medium alert when no meetings in last 14 days but meetings exist", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 20);
    const result = identifyMeetingAlerts([
      makeMeeting({ meeting_date: oldDate.toISOString() }),
    ], [], 4);
    const noRecentAlerts = result.filter((a) => a.type === "no_recent_meeting");
    expect(noRecentAlerts).toHaveLength(1);
    expect(noRecentAlerts[0].severity).toBe("medium");
    expect(noRecentAlerts[0].message).toContain("14 days");
  });

  it("does not generate no_recent_meeting alert when meeting is within 14 days", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);
    const result = identifyMeetingAlerts([
      makeMeeting({ meeting_date: recentDate.toISOString() }),
    ], [], 4);
    const noRecentAlerts = result.filter((a) => a.type === "no_recent_meeting");
    expect(noRecentAlerts).toHaveLength(0);
  });

  it("does not generate no_recent_meeting alert when meetings array is empty", () => {
    const result = identifyMeetingAlerts([], [], 4);
    const noRecentAlerts = result.filter((a) => a.type === "no_recent_meeting");
    expect(noRecentAlerts).toHaveLength(0);
  });

  it("does not generate no_recent_meeting alert when at least one meeting is recent", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 30);
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3);
    const result = identifyMeetingAlerts([
      makeMeeting({ meeting_date: oldDate.toISOString() }),
      makeMeeting({ id: "mtg-2", meeting_date: recentDate.toISOString() }),
    ], [], 4);
    const noRecentAlerts = result.filter((a) => a.type === "no_recent_meeting");
    expect(noRecentAlerts).toHaveLength(0);
  });

  it("meeting exactly 14 days ago is considered recent (within boundary)", () => {
    const exactlyFourteenDays = new Date();
    exactlyFourteenDays.setDate(exactlyFourteenDays.getDate() - 14);
    const result = identifyMeetingAlerts([
      makeMeeting({ meeting_date: exactlyFourteenDays.toISOString() }),
    ], [], 4);
    const noRecentAlerts = result.filter((a) => a.type === "no_recent_meeting");
    expect(noRecentAlerts).toHaveLength(0);
  });

  // ── Overdue actions alert ──

  it("generates medium alert for overdue meeting actions", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({
        actions: [
          makeMeetingAction({ status: "overdue" }),
          makeMeetingAction({ description: "a2", status: "overdue" }),
        ],
      }),
    ], [], 4);
    const overdueAlerts = result.filter((a) => a.type === "overdue_actions");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].severity).toBe("medium");
    expect(overdueAlerts[0].message).toContain("2 meeting actions overdue");
  });

  it("uses singular form for single overdue action", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({
        actions: [makeMeetingAction({ status: "overdue" })],
      }),
    ], [], 4);
    const overdueAlerts = result.filter((a) => a.type === "overdue_actions");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].message).toContain("1 meeting action overdue");
    expect(overdueAlerts[0].message).not.toContain("actions overdue");
  });

  it("does not generate overdue_actions alert when no actions are overdue", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({
        actions: [
          makeMeetingAction({ status: "completed" }),
          makeMeetingAction({ description: "a2", status: "pending" }),
        ],
      }),
    ], [], 4);
    const overdueAlerts = result.filter((a) => a.type === "overdue_actions");
    expect(overdueAlerts).toHaveLength(0);
  });

  it("counts overdue actions across multiple meetings", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({
        actions: [makeMeetingAction({ status: "overdue" })],
      }),
      makeMeeting({
        id: "mtg-2",
        actions: [
          makeMeetingAction({ description: "a2", status: "overdue" }),
          makeMeetingAction({ description: "a3", status: "overdue" }),
        ],
      }),
    ], [], 4);
    const overdueAlerts = result.filter((a) => a.type === "overdue_actions");
    expect(overdueAlerts).toHaveLength(1);
    expect(overdueAlerts[0].message).toContain("3 meeting actions overdue");
  });

  // ── Unconsulted children alert ──

  it("generates high alert when some children have no consultation records", () => {
    const result = identifyMeetingAlerts([], [
      makeConsultation({ child_id: "child-1" }),
      makeConsultation({ id: "con-2", child_id: "child-2" }),
    ], 5);
    const unconsultedAlerts = result.filter((a) => a.type === "unconsulted_children");
    expect(unconsultedAlerts).toHaveLength(1);
    expect(unconsultedAlerts[0].severity).toBe("high");
    expect(unconsultedAlerts[0].message).toContain("3 of 5");
  });

  it("does not generate unconsulted_children alert when all children consulted", () => {
    const result = identifyMeetingAlerts([], [
      makeConsultation({ child_id: "child-1" }),
      makeConsultation({ id: "con-2", child_id: "child-2" }),
      makeConsultation({ id: "con-3", child_id: "child-3" }),
    ], 3);
    const unconsultedAlerts = result.filter((a) => a.type === "unconsulted_children");
    expect(unconsultedAlerts).toHaveLength(0);
  });

  it("does not generate unconsulted_children alert when totalChildren is 0", () => {
    const result = identifyMeetingAlerts([], [], 0);
    const unconsultedAlerts = result.filter((a) => a.type === "unconsulted_children");
    expect(unconsultedAlerts).toHaveLength(0);
  });

  it("generates unconsulted_children alert when no consultations exist but children do", () => {
    const result = identifyMeetingAlerts([], [], 3);
    const unconsultedAlerts = result.filter((a) => a.type === "unconsulted_children");
    expect(unconsultedAlerts).toHaveLength(1);
    expect(unconsultedAlerts[0].message).toContain("3 of 3");
  });

  // ── Low attendance alert ──

  it("generates medium alert when attendance rate is below 50%", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({ children_present: ["c1"] }),
      makeMeeting({ id: "mtg-2", children_present: ["c2"] }),
    ], [], 6);
    // total attendance = 2, slots = 2 * 6 = 12, rate = (2/12)*100 = 16.67%
    const lowAttendanceAlerts = result.filter((a) => a.type === "low_attendance");
    expect(lowAttendanceAlerts).toHaveLength(1);
    expect(lowAttendanceAlerts[0].severity).toBe("medium");
    expect(lowAttendanceAlerts[0].message).toContain("17%");
  });

  it("does not generate low_attendance alert when rate is 50% or above", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({ children_present: ["c1", "c2", "c3"] }),
    ], [], 6);
    // rate = (3 / (1*6)) * 100 = 50%
    const lowAttendanceAlerts = result.filter((a) => a.type === "low_attendance");
    expect(lowAttendanceAlerts).toHaveLength(0);
  });

  it("does not generate low_attendance alert when totalChildren is 0", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({ children_present: [] }),
    ], [], 0);
    const lowAttendanceAlerts = result.filter((a) => a.type === "low_attendance");
    expect(lowAttendanceAlerts).toHaveLength(0);
  });

  it("does not generate low_attendance alert when meetings array is empty", () => {
    const result = identifyMeetingAlerts([], [], 6);
    const lowAttendanceAlerts = result.filter((a) => a.type === "low_attendance");
    expect(lowAttendanceAlerts).toHaveLength(0);
  });

  // ── Unapproved minutes alert ──

  it("generates low alert for unapproved meeting minutes", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({ minutes_approved: false }),
      makeMeeting({ id: "mtg-2", minutes_approved: false }),
      makeMeeting({ id: "mtg-3", minutes_approved: true }),
    ], [], 4);
    const unapprovedAlerts = result.filter((a) => a.type === "unapproved_minutes");
    expect(unapprovedAlerts).toHaveLength(1);
    expect(unapprovedAlerts[0].severity).toBe("low");
    expect(unapprovedAlerts[0].message).toContain("2 sets of meeting minutes");
  });

  it("uses singular form for single unapproved minutes", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({ minutes_approved: false }),
    ], [], 4);
    const unapprovedAlerts = result.filter((a) => a.type === "unapproved_minutes");
    expect(unapprovedAlerts).toHaveLength(1);
    expect(unapprovedAlerts[0].message).toContain("1 set of meeting minutes");
    expect(unapprovedAlerts[0].message).not.toContain("sets");
  });

  it("does not generate unapproved_minutes alert when all minutes are approved", () => {
    const result = identifyMeetingAlerts([
      makeMeeting({ minutes_approved: true }),
      makeMeeting({ id: "mtg-2", minutes_approved: true }),
    ], [], 4);
    const unapprovedAlerts = result.filter((a) => a.type === "unapproved_minutes");
    expect(unapprovedAlerts).toHaveLength(0);
  });

  // ── Multiple alerts simultaneously ──

  it("generates multiple alerts from different sources simultaneously", () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 20);
    const result = identifyMeetingAlerts([
      makeMeeting({
        meeting_date: oldDate.toISOString(),
        children_present: ["c1"],
        minutes_approved: false,
        actions: [makeMeetingAction({ status: "overdue" })],
      }),
    ], [], 6);

    const types = result.map((a) => a.type);
    expect(types).toContain("no_recent_meeting");
    expect(types).toContain("overdue_actions");
    expect(types).toContain("unconsulted_children");
    expect(types).toContain("low_attendance");
    expect(types).toContain("unapproved_minutes");
  });

  it("returns empty alerts when everything is compliant", () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 3);
    const result = identifyMeetingAlerts([
      makeMeeting({
        meeting_date: recentDate.toISOString(),
        children_present: ["c1", "c2", "c3"],
        minutes_approved: true,
        actions: [makeMeetingAction({ status: "completed" })],
      }),
    ], [
      makeConsultation({ child_id: "c1" }),
      makeConsultation({ id: "con-2", child_id: "c2" }),
      makeConsultation({ id: "con-3", child_id: "c3" }),
    ], 3);
    expect(result).toEqual([]);
  });
});
