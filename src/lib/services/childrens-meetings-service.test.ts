import { describe, it, expect } from "vitest";
import {
  computeMeetingMetrics,
  identifyMeetingAlerts,
} from "./childrens-meetings-service";
import type { ChildrensMeetingRecord } from "./childrens-meetings-service";

// -- Factory Function ---------------------------------------------------------

function makeRecord(overrides: Partial<ChildrensMeetingRecord> = {}): ChildrensMeetingRecord {
  return {
    id: "meet-1",
    home_id: "home-1",
    meeting_type: "house_meeting",
    meeting_date: "2026-05-15",
    participation_level: "all_participated",
    action_outcome: "all_actions_completed",
    meeting_atmosphere: "positive",
    children_invited: 4,
    children_attended: 4,
    agenda_shared_beforehand: true,
    children_set_agenda: true,
    minutes_recorded: true,
    actions_from_previous_reviewed: true,
    child_chair: false,
    food_provided: true,
    changes_implemented: true,
    children_feedback_positive: true,
    staff_facilitator: "staff-1",
    topics_discussed: ["activities", "menus"],
    actions_agreed: ["New activity schedule"],
    next_meeting_date: "2026-06-15",
    notes: null,
    created_at: "2026-05-15T00:00:00Z",
    updated_at: "2026-05-15T00:00:00Z",
    ...overrides,
  };
}

// -- computeMeetingMetrics ----------------------------------------------------

describe("computeMeetingMetrics", () => {
  it("returns zeroes for empty data", () => {
    const m = computeMeetingMetrics([]);
    expect(m.total_meetings).toBe(0);
    expect(m.house_meeting_count).toBe(0);
    expect(m.attendance_rate).toBeNull();;
    expect(m.all_participated_rate).toBeNull();;
    expect(m.agenda_shared_rate).toBeNull();;
  });

  it("computes populated metrics correctly", () => {
    const records = [
      makeRecord({ meeting_type: "house_meeting", children_invited: 4, children_attended: 3 }),
      makeRecord({
        id: "meet-2",
        meeting_type: "childrens_council",
        children_invited: 4,
        children_attended: 4,
        participation_level: "most_participated",
        action_outcome: "none_completed",
        meeting_atmosphere: "negative",
        agenda_shared_beforehand: false,
        children_set_agenda: false,
        child_chair: true,
      }),
      makeRecord({
        id: "meet-3",
        meeting_type: "menu_planning",
        children_invited: 4,
        children_attended: 2,
        participation_level: "no_participation",
        meeting_atmosphere: "very_positive",
      }),
    ];
    const m = computeMeetingMetrics(records);

    expect(m.total_meetings).toBe(3);
    expect(m.house_meeting_count).toBe(1);
    expect(m.childrens_council_count).toBe(1);
    expect(m.menu_planning_count).toBe(1);
    // 9/12 attended = 75%
    expect(m.attendance_rate).toBe(75);
    // 1/3 all_participated = 33.3%
    expect(m.all_participated_rate).toBe(33.3);
    expect(m.no_participation_count).toBe(1);
    expect(m.none_completed_count).toBe(1);
    expect(m.negative_atmosphere_count).toBe(1);
    // 1/3 very positive
    expect(m.very_positive_atmosphere_rate).toBe(33.3);
    // 1/3 child_chair
    expect(m.child_chair_rate).toBe(33.3);
    expect(m.by_meeting_type).toEqual({
      house_meeting: 1,
      childrens_council: 1,
      menu_planning: 1,
    });
  });

  it("counts overdue meetings based on next_meeting_date in the past", () => {
    const records = [
      makeRecord({ next_meeting_date: "2025-01-01" }),
      makeRecord({ id: "m2", next_meeting_date: null }),
    ];
    const m = computeMeetingMetrics(records);
    expect(m.meeting_overdue_count).toBe(1);
  });
});

// -- identifyMeetingAlerts ----------------------------------------------------

describe("identifyMeetingAlerts", () => {
  it("returns no alerts for empty data", () => {
    const alerts = identifyMeetingAlerts([]);
    expect(alerts).toHaveLength(0);
  });

  it("fires no_participation for meeting with no_participation", () => {
    const records = [makeRecord({ participation_level: "no_participation" })];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "no_participation" && a.severity === "critical")).toBe(true);
  });

  it("fires negative_atmosphere for negative meeting", () => {
    const records = [makeRecord({ meeting_atmosphere: "negative" })];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "negative_atmosphere" && a.severity === "high")).toBe(true);
  });

  it("fires actions_not_completed when >= 1 meeting has none_completed", () => {
    const records = [makeRecord({ action_outcome: "none_completed" })];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "actions_not_completed")).toBe(true);
  });

  it("fires children_not_setting_agenda when >= 3 meetings without child agenda", () => {
    const records = [
      makeRecord({ id: "m1", children_set_agenda: false }),
      makeRecord({ id: "m2", children_set_agenda: false }),
      makeRecord({ id: "m3", children_set_agenda: false }),
    ];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "children_not_setting_agenda" && a.severity === "medium")).toBe(true);
  });

  it("fires meeting_overdue when next_meeting_date is past", () => {
    const records = [makeRecord({ next_meeting_date: "2025-01-01" })];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "meeting_overdue" && a.severity === "medium")).toBe(true);
  });

  it("does NOT fire children_not_setting_agenda when only 2 meetings without child agenda", () => {
    const records = [
      makeRecord({ id: "m1", children_set_agenda: false }),
      makeRecord({ id: "m2", children_set_agenda: false }),
    ];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "children_not_setting_agenda")).toBe(false);
  });

  it("does NOT fire meeting_overdue when next_meeting_date is in the future", () => {
    const records = [makeRecord({ next_meeting_date: "2099-01-01" })];
    const alerts = identifyMeetingAlerts(records);
    expect(alerts.some((a) => a.type === "meeting_overdue")).toBe(false);
  });
});
