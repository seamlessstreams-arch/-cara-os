import { describe, it, expect } from "vitest";
import {
  computeMeetingMetrics,
  identifyMeetingAlerts,
} from "./staff-team-meetings-service";
import type { TeamMeeting } from "./staff-team-meetings-service";

// -- Factory ------------------------------------------------------------------

function makeMeeting(overrides: Partial<TeamMeeting> = {}): TeamMeeting {
  return {
    id: "m-1",
    home_id: "home-1",
    meeting_type: "full_team",
    meeting_date: "2026-05-10",
    meeting_status: "completed",
    chaired_by: "Manager A",
    minutes_status: "distributed",
    attendees_expected: 10,
    attendees_present: 8,
    duration_minutes: 60,
    safeguarding_discussed: true,
    children_discussed: ["child-1"],
    agenda_items: ["item-1"],
    actions_set: 3,
    actions_completed_from_last: 2,
    actions_outstanding_from_last: 1,
    key_decisions: ["decision-1"],
    next_meeting_date: "2026-06-10",
    notes: null,
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-10T00:00:00Z",
    ...overrides,
  };
}

// -- computeMeetingMetrics ----------------------------------------------------

describe("computeMeetingMetrics", () => {
  it("returns zeroes for empty array", () => {
    const r = computeMeetingMetrics([], 10);
    expect(r.total_meetings).toBe(0);
    expect(r.completed_count).toBe(0);
    expect(r.cancelled_count).toBe(0);
    expect(r.attendance_rate).toBeNull();;
    expect(r.average_attendance).toBeNull();;
    expect(r.average_duration).toBeNull();;
    expect(r.safeguarding_discussed_rate).toBeNull();;
    expect(r.minutes_distributed_rate).toBeNull();;
    expect(r.minutes_not_taken_count).toBe(0);
    expect(r.total_actions_set).toBe(0);
    expect(r.action_completion_rate).toBeNull();;
    expect(r.actions_outstanding).toBe(0);
    expect(r.children_discussed_count).toBe(0);
    expect(r.full_team_count).toBe(0);
  });

  it("counts completed and cancelled meetings", () => {
    const meetings = [
      makeMeeting({ id: "m1", meeting_status: "completed" }),
      makeMeeting({ id: "m2", meeting_status: "completed" }),
      makeMeeting({ id: "m3", meeting_status: "cancelled" }),
      makeMeeting({ id: "m4", meeting_status: "scheduled" }),
    ];
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.total_meetings).toBe(4);
    expect(r.completed_count).toBe(2);
    expect(r.cancelled_count).toBe(1);
  });

  it("calculates attendance rate from completed meetings", () => {
    const meetings = [
      makeMeeting({ attendees_expected: 10, attendees_present: 8 }),
      makeMeeting({ id: "m2", attendees_expected: 10, attendees_present: 10 }),
    ];
    // total expected=20, present=18 => 18/20 = 90.0%
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.attendance_rate).toBe(90);
  });

  it("calculates average attendance across completed meetings", () => {
    const meetings = [
      makeMeeting({ attendees_present: 6 }),
      makeMeeting({ id: "m2", attendees_present: 10 }),
    ];
    // (6+10)/2 = 8.0
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.average_attendance).toBe(8);
  });

  it("calculates average duration excluding null durations", () => {
    const meetings = [
      makeMeeting({ duration_minutes: 60 }),
      makeMeeting({ id: "m2", duration_minutes: null }),
      makeMeeting({ id: "m3", duration_minutes: 90 }),
    ];
    // (60+90)/2 = 75.0
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.average_duration).toBe(75);
  });

  it("calculates safeguarding discussed rate", () => {
    const meetings = [
      makeMeeting({ safeguarding_discussed: true }),
      makeMeeting({ id: "m2", safeguarding_discussed: false }),
    ];
    // 1/2 = 50.0%
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.safeguarding_discussed_rate).toBe(50);
  });

  it("calculates minutes distributed rate and not-taken count", () => {
    const meetings = [
      makeMeeting({ minutes_status: "distributed" }),
      makeMeeting({ id: "m2", minutes_status: "not_taken" }),
      makeMeeting({ id: "m3", minutes_status: "approved" }),
    ];
    // distributed: 1/3 = 33.3%
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.minutes_distributed_rate).toBe(33.3);
    expect(r.minutes_not_taken_count).toBe(1);
  });

  it("calculates action metrics", () => {
    const meetings = [
      makeMeeting({ actions_set: 5, actions_completed_from_last: 3, actions_outstanding_from_last: 2 }),
      makeMeeting({ id: "m2", actions_set: 5, actions_completed_from_last: 4, actions_outstanding_from_last: 1 }),
    ];
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.total_actions_set).toBe(10);
    // 7/10 = 70.0%
    expect(r.action_completion_rate).toBe(70);
    expect(r.actions_outstanding).toBe(3);
  });

  it("counts unique children discussed and full_team meetings", () => {
    const meetings = [
      makeMeeting({ children_discussed: ["c1", "c2"], meeting_type: "full_team" }),
      makeMeeting({ id: "m2", children_discussed: ["c2", "c3"], meeting_type: "shift_handover" }),
    ];
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.children_discussed_count).toBe(3); // c1, c2, c3
    expect(r.full_team_count).toBe(1);
  });

  it("populates by_meeting_type, by_meeting_status, by_minutes_status", () => {
    const meetings = [
      makeMeeting({ meeting_type: "full_team", meeting_status: "completed", minutes_status: "distributed" }),
      makeMeeting({ id: "m2", meeting_type: "safeguarding", meeting_status: "cancelled", minutes_status: "not_taken" }),
    ];
    const r = computeMeetingMetrics(meetings, 10);
    expect(r.by_meeting_type).toEqual({ full_team: 1, safeguarding: 1 });
    expect(r.by_meeting_status).toEqual({ completed: 1, cancelled: 1 });
    expect(r.by_minutes_status).toEqual({ distributed: 1, not_taken: 1 });
  });
});

// -- identifyMeetingAlerts ----------------------------------------------------

describe("identifyMeetingAlerts", () => {
  it("returns empty for empty array", () => {
    expect(identifyMeetingAlerts([], 10)).toEqual([]);
  });

  it("fires safeguarding_not_discussed at threshold of 2 full team meetings", () => {
    const meetings = [
      makeMeeting({ id: "m1", meeting_type: "full_team", safeguarding_discussed: false }),
      makeMeeting({ id: "m2", meeting_type: "full_team", safeguarding_discussed: false }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    const sg = alerts.filter((a) => a.type === "safeguarding_not_discussed");
    expect(sg).toHaveLength(1);
    expect(sg[0].severity).toBe("critical");
  });

  it("does NOT fire safeguarding_not_discussed for only 1 meeting", () => {
    const meetings = [
      makeMeeting({ meeting_type: "full_team", safeguarding_discussed: false }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    expect(alerts.filter((a) => a.type === "safeguarding_not_discussed")).toHaveLength(0);
  });

  it("fires poor_attendance when <50% attendance on a completed meeting", () => {
    const meetings = [
      makeMeeting({ attendees_expected: 10, attendees_present: 4 }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    const pa = alerts.filter((a) => a.type === "poor_attendance");
    expect(pa).toHaveLength(1);
    expect(pa[0].severity).toBe("high");
  });

  it("does NOT fire poor_attendance at exactly 50%", () => {
    const meetings = [
      makeMeeting({ attendees_expected: 10, attendees_present: 5 }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    expect(alerts.filter((a) => a.type === "poor_attendance")).toHaveLength(0);
  });

  it("fires minutes_not_taken at threshold of 2", () => {
    const meetings = [
      makeMeeting({ id: "m1", minutes_status: "not_taken" }),
      makeMeeting({ id: "m2", minutes_status: "not_taken" }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    expect(alerts.filter((a) => a.type === "minutes_not_taken")).toHaveLength(1);
  });

  it("fires high_cancellation when >30% of 4+ meetings cancelled", () => {
    const meetings = [
      makeMeeting({ id: "m1", meeting_status: "cancelled" }),
      makeMeeting({ id: "m2", meeting_status: "cancelled" }),
      makeMeeting({ id: "m3", meeting_status: "completed" }),
      makeMeeting({ id: "m4", meeting_status: "completed" }),
    ];
    // 2/4 = 50% > 30%
    const alerts = identifyMeetingAlerts(meetings, 10);
    expect(alerts.filter((a) => a.type === "high_cancellation")).toHaveLength(1);
  });

  it("fires actions_outstanding at threshold of 5", () => {
    const meetings = [
      makeMeeting({ id: "m1", actions_outstanding_from_last: 3 }),
      makeMeeting({ id: "m2", actions_outstanding_from_last: 2 }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(1);
  });

  it("does NOT fire actions_outstanding below 5", () => {
    const meetings = [
      makeMeeting({ actions_outstanding_from_last: 2 }),
      makeMeeting({ id: "m2", actions_outstanding_from_last: 2 }),
    ];
    const alerts = identifyMeetingAlerts(meetings, 10);
    expect(alerts.filter((a) => a.type === "actions_outstanding")).toHaveLength(0);
  });
});
