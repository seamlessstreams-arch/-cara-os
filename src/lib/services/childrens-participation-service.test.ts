import { describe, it, expect } from "vitest";
import {
  computeParticipationMetrics,
  identifyParticipationAlerts,
} from "./childrens-participation-service";
import type {
  ParticipationMeeting,
  ChildConsultation,
} from "./childrens-participation-service";

// -- Factory Functions --------------------------------------------------------

function makeMeeting(overrides: Partial<ParticipationMeeting> = {}): ParticipationMeeting {
  return {
    id: "pm-1",
    home_id: "home-1",
    meeting_type: "house_meeting",
    meeting_date: "2026-05-10",
    scheduled_time: "14:00",
    duration_minutes: 30,
    facilitator: "staff-1",
    children_invited: ["c1", "c2", "c3", "c4"],
    children_attended: ["c1", "c2", "c3"],
    staff_present: ["staff-1"],
    topics: [
      { category: "food_menus", description: "Menu review", raised_by: "c1", discussion_summary: "Discussed menus" },
    ],
    decisions_made: ["New menu items added"],
    actions: [
      { action: "Update menu", assigned_to: "staff-1", due_date: "2026-05-20", status: "implemented", feedback_to_children: "Done" },
    ],
    child_satisfaction_collected: true,
    overall_engagement: "high",
    status: "completed",
    notes: null,
    created_at: "2026-05-10T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

function makeConsultation(overrides: Partial<ChildConsultation> = {}): ChildConsultation {
  return {
    id: "con-1",
    home_id: "home-1",
    child_id: "c1",
    child_name: "Alex",
    consultation_date: "2026-05-12",
    consulted_by: "staff-1",
    topic: "daily_routines",
    context: "Bedtime routine discussion",
    child_views: "Wants later bedtime",
    child_preferences: "10pm",
    outcome: "Agreed to trial 9:30pm",
    action_taken: "Trial period set",
    child_informed_of_outcome: true,
    child_satisfied_with_response: true,
    notes: null,
    created_at: "2026-05-12T00:00:00Z",
    ...overrides,
  };
}

const NOW = new Date("2026-05-21T12:00:00Z");

/** A date n days ago, but returns today if that would leave the current calendar
 *  quarter — so "this quarter" fixtures stay in-quarter at a quarter boundary.
 *  (computeParticipationMetrics uses the real current date for its quarter maths.) */
function daysAgoInQuarter(n: number): string {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const target = new Date();
  target.setDate(target.getDate() - n);
  const sameQuarter = target.getFullYear() === now.getFullYear() && Math.floor(target.getMonth() / 3) === q;
  return (sameQuarter ? target : now).toISOString().split("T")[0];
}

// -- computeParticipationMetrics ----------------------------------------------

describe("computeParticipationMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeParticipationMetrics([], [], 4);
    expect(m.meetings_this_quarter).toBe(0);
    expect(m.avg_attendance_rate).toBe(0);
    expect(m.unique_children_participating).toBe(0);
    expect(m.participation_rate).toBe(0);
    expect(m.actions_implemented_rate).toBe(0);
    expect(m.topics_raised).toBe(0);
    expect(m.satisfaction_rate).toBe(0);
    expect(m.consultations_this_quarter).toBe(0);
  });

  it("computes populated metrics correctly", () => {
    const meetings = [
      makeMeeting(),
      makeMeeting({
        id: "pm-2",
        meeting_type: "childrens_council",
        children_invited: ["c1", "c2"],
        children_attended: ["c1", "c2"],
        actions: [
          { action: "Pending item", assigned_to: "staff-1", due_date: "2026-06-01", status: "pending", feedback_to_children: "" },
        ],
      }),
    ];
    const consultations = [
      makeConsultation({ child_id: "c4" }),
    ];
    const m = computeParticipationMetrics(meetings, consultations, 4);

    expect(m.unique_children_participating).toBe(4); // c1,c2,c3 from meetings + c4 from consultation
    expect(m.participation_rate).toBe(100);
    // 6 invited, 5 attended = 83.3%
    expect(m.avg_attendance_rate).toBe(83.3);
    // 1 implemented out of 2 actions = 50%
    expect(m.actions_implemented_rate).toBe(50);
    expect(m.topics_raised).toBe(2);
    expect(m.by_meeting_type).toEqual({ house_meeting: 1, childrens_council: 1 });
    expect(m.satisfaction_rate).toBe(100);
  });

  it("counts consultations this quarter", () => {
    const consultations = [
      makeConsultation({ consultation_date: daysAgoInQuarter(1) }),
      makeConsultation({ id: "con-2", consultation_date: "2025-01-01", child_id: "c2" }),
    ];
    const m = computeParticipationMetrics([], consultations, 4);
    expect(m.consultations_this_quarter).toBe(1);
  });
});

// -- identifyParticipationAlerts ----------------------------------------------

describe("identifyParticipationAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyParticipationAlerts([], [], 0, NOW);
    expect(alerts).toHaveLength(0);
  });

  it("fires no_recent_house_meeting when last house meeting > 30 days ago", () => {
    const meetings = [
      makeMeeting({ meeting_date: "2026-03-01", meeting_type: "house_meeting" }),
    ];
    const alerts = identifyParticipationAlerts(meetings, [], 0, NOW);
    expect(alerts.some((a) => a.type === "no_recent_house_meeting" && a.severity === "high")).toBe(true);
  });

  it("fires no_house_meetings when no house meetings exist", () => {
    const meetings = [
      makeMeeting({ meeting_type: "childrens_council" }),
    ];
    const alerts = identifyParticipationAlerts(meetings, [], 0, NOW);
    expect(alerts.some((a) => a.type === "no_house_meetings")).toBe(true);
  });

  it("fires low_attendance for recent meetings with < 50% attendance", () => {
    const meetings = [
      makeMeeting({
        meeting_date: "2026-05-18",
        children_invited: ["c1", "c2", "c3", "c4"],
        children_attended: ["c1"],
      }),
    ];
    const alerts = identifyParticipationAlerts(meetings, [], 4, NOW);
    expect(alerts.some((a) => a.type === "low_attendance" && a.severity === "medium")).toBe(true);
  });

  it("fires children_not_participating when totalChildren > participating children", () => {
    const meetings = [makeMeeting({ children_attended: ["c1"] })];
    const alerts = identifyParticipationAlerts(meetings, [], 4, NOW);
    expect(alerts.some((a) => a.type === "children_not_participating" && a.severity === "high")).toBe(true);
  });

  it("fires no_feedback_to_children for completed actions without feedback", () => {
    const meetings = [
      makeMeeting({
        actions: [
          { action: "Fix door", assigned_to: "staff-1", due_date: "2026-05-01", status: "implemented", feedback_to_children: "" },
        ],
      }),
    ];
    const alerts = identifyParticipationAlerts(meetings, [], 0, NOW);
    expect(alerts.some((a) => a.type === "no_feedback_to_children")).toBe(true);
  });

  it("fires child_not_informed when consultation outcome not shared", () => {
    const consultations = [
      makeConsultation({ outcome: "Agreed", child_informed_of_outcome: false }),
    ];
    const alerts = identifyParticipationAlerts([], consultations, 0, NOW);
    expect(alerts.some((a) => a.type === "child_not_informed" && a.severity === "medium")).toBe(true);
  });

  it("fires child_dissatisfied when child is dissatisfied", () => {
    const consultations = [
      makeConsultation({ child_satisfied_with_response: false }),
    ];
    const alerts = identifyParticipationAlerts([], consultations, 0, NOW);
    expect(alerts.some((a) => a.type === "child_dissatisfied")).toBe(true);
  });

  it("fires safety_concern_no_action when safety topic raised with no actions", () => {
    const meetings = [
      makeMeeting({
        topics: [{ category: "safety_concerns", description: "Broken window", raised_by: "c1", discussion_summary: "Discussed" }],
        actions: [],
      }),
    ];
    const alerts = identifyParticipationAlerts(meetings, [], 0, NOW);
    expect(alerts.some((a) => a.type === "safety_concern_no_action" && a.severity === "critical")).toBe(true);
  });
});
