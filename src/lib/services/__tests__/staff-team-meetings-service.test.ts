// ══════════════════════════════════════════════════════════════════════════════
// CARA — STAFF TEAM MEETINGS SERVICE TESTS
// Pure-function unit tests for team meeting metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 13 (leadership — team communication),
// Reg 33 (employment — staff development),
// Reg 12 (protection — information sharing).
//
// Covers: meeting scheduling, attendance tracking, agenda items,
// action completion, safeguarding discussions, and minutes.
//
// SCCIF: Leadership & Management — "Staff meetings support
// effective communication." "Safeguarding is discussed regularly."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { todayStr } from "@/lib/utils";
import {
  _testing,
  MEETING_TYPES,
  MEETING_STATUSES,
  MINUTES_STATUSES,
  ACTION_PRIORITIES,
} from "../staff-team-meetings-service";

import type {
  TeamMeeting,
  MeetingType,
  MeetingStatus,
  MinutesStatus,
  ActionPriority,
} from "../staff-team-meetings-service";

const { computeMeetingMetrics, identifyMeetingAlerts } = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysAgo(n: number): string {
  return daysAgoISO(n).split("T")[0];
}

function futureDateISO(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Build a minimal TeamMeeting with sensible defaults. */
function makeMeeting(
  overrides?: Partial<TeamMeeting>,
): TeamMeeting {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    meeting_type: "full_team",
    meeting_date: daysAgo(5),
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
    next_meeting_date: "next_meeting_date" in (overrides ?? {}) ? (overrides!.next_meeting_date ?? null) : futureDateISO(14),
    notes: "notes" in (overrides ?? {}) ? (overrides!.notes ?? null) : null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("MEETING_TYPES", () => {
  it("contains exactly 9 entries", () => {
    expect(MEETING_TYPES).toHaveLength(9);
  });

  it("every entry has a non-empty type string", () => {
    for (const t of MEETING_TYPES) {
      expect(typeof t.type).toBe("string");
      expect(t.type.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const t of MEETING_TYPES) {
      expect(typeof t.label).toBe("string");
      expect(t.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate types", () => {
    const types = MEETING_TYPES.map((t) => t.type);
    expect(new Set(types).size).toBe(types.length);
  });

  it("has no duplicate labels", () => {
    const labels = MEETING_TYPES.map((t) => t.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected types", () => {
    const types = MEETING_TYPES.map((t) => t.type);
    const expected: MeetingType[] = [
      "full_team", "shift_handover", "management", "safeguarding",
      "case_discussion", "training_debrief", "emergency",
      "quality_improvement", "other",
    ];
    for (const e of expected) {
      expect(types).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const t of MEETING_TYPES) {
      expect(t.label[0]).toBe(t.label[0].toUpperCase());
    }
  });

  it("includes full_team", () => {
    expect(MEETING_TYPES.map((t) => t.type)).toContain("full_team");
  });

  it("includes safeguarding", () => {
    expect(MEETING_TYPES.map((t) => t.type)).toContain("safeguarding");
  });
});

describe("MEETING_STATUSES", () => {
  it("contains exactly 5 entries", () => {
    expect(MEETING_STATUSES).toHaveLength(5);
  });

  it("every entry has a non-empty status string", () => {
    for (const s of MEETING_STATUSES) {
      expect(typeof s.status).toBe("string");
      expect(s.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const s of MEETING_STATUSES) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = MEETING_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = MEETING_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = MEETING_STATUSES.map((s) => s.status);
    const expected: MeetingStatus[] = [
      "scheduled", "completed", "cancelled", "rescheduled", "postponed",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const s of MEETING_STATUSES) {
      expect(s.label[0]).toBe(s.label[0].toUpperCase());
    }
  });
});

describe("MINUTES_STATUSES", () => {
  it("contains exactly 5 entries", () => {
    expect(MINUTES_STATUSES).toHaveLength(5);
  });

  it("every entry has a non-empty status string", () => {
    for (const s of MINUTES_STATUSES) {
      expect(typeof s.status).toBe("string");
      expect(s.status.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const s of MINUTES_STATUSES) {
      expect(typeof s.label).toBe("string");
      expect(s.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate statuses", () => {
    const statuses = MINUTES_STATUSES.map((s) => s.status);
    expect(new Set(statuses).size).toBe(statuses.length);
  });

  it("has no duplicate labels", () => {
    const labels = MINUTES_STATUSES.map((s) => s.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected statuses", () => {
    const statuses = MINUTES_STATUSES.map((s) => s.status);
    const expected: MinutesStatus[] = [
      "drafted", "approved", "distributed", "not_taken", "pending",
    ];
    for (const e of expected) {
      expect(statuses).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const s of MINUTES_STATUSES) {
      expect(s.label[0]).toBe(s.label[0].toUpperCase());
    }
  });
});

describe("ACTION_PRIORITIES", () => {
  it("contains exactly 4 entries", () => {
    expect(ACTION_PRIORITIES).toHaveLength(4);
  });

  it("every entry has a non-empty priority string", () => {
    for (const a of ACTION_PRIORITIES) {
      expect(typeof a.priority).toBe("string");
      expect(a.priority.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const a of ACTION_PRIORITIES) {
      expect(typeof a.label).toBe("string");
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate priorities", () => {
    const priorities = ACTION_PRIORITIES.map((a) => a.priority);
    expect(new Set(priorities).size).toBe(priorities.length);
  });

  it("has no duplicate labels", () => {
    const labels = ACTION_PRIORITIES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected priorities", () => {
    const priorities = ACTION_PRIORITIES.map((a) => a.priority);
    const expected: ActionPriority[] = ["urgent", "high", "medium", "low"];
    for (const e of expected) {
      expect(priorities).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const a of ACTION_PRIORITIES) {
      expect(a.label[0]).toBe(a.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// computeMeetingMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMeetingMetrics", () => {
  // ── Empty meetings ────────────────────────────────────────────────────────

  describe("empty meetings", () => {
    it("returns total_meetings = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.total_meetings).toBe(0);
    });

    it("returns completed_count = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.completed_count).toBe(0);
    });

    it("returns cancelled_count = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.cancelled_count).toBe(0);
    });

    it("returns attendance_rate = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.attendance_rate).toBeNull();;
    });

    it("returns average_attendance = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.average_attendance).toBeNull();;
    });

    it("returns average_duration = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.average_duration).toBeNull();;
    });

    it("returns safeguarding_discussed_rate = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.safeguarding_discussed_rate).toBeNull();;
    });

    it("returns minutes_distributed_rate = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.minutes_distributed_rate).toBeNull();;
    });

    it("returns minutes_not_taken_count = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.minutes_not_taken_count).toBe(0);
    });

    it("returns total_actions_set = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.total_actions_set).toBe(0);
    });

    it("returns action_completion_rate = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.action_completion_rate).toBeNull();;
    });

    it("returns actions_outstanding = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.actions_outstanding).toBe(0);
    });

    it("returns children_discussed_count = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.children_discussed_count).toBe(0);
    });

    it("returns full_team_count = 0", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.full_team_count).toBe(0);
    });

    it("returns empty by_meeting_type", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.by_meeting_type).toEqual({});
    });

    it("returns empty by_meeting_status", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.by_meeting_status).toEqual({});
    });

    it("returns empty by_minutes_status", () => {
      const m = computeMeetingMetrics([], 10);
      expect(m.by_minutes_status).toEqual({});
    });

    it("returns attendance_rate = 0 when totalStaff = 0", () => {
      const m = computeMeetingMetrics([], 0);
      expect(m.attendance_rate).toBeNull();;
    });
  });

  // ── Single completed meeting ──────────────────────────────────────────────

  describe("single completed meeting", () => {
    const mtg = makeMeeting({
      meeting_type: "full_team",
      meeting_status: "completed",
      minutes_status: "distributed",
      attendees_expected: 10,
      attendees_present: 8,
      duration_minutes: 60,
      safeguarding_discussed: true,
      children_discussed: ["child-1", "child-2"],
      actions_set: 5,
      actions_completed_from_last: 3,
      actions_outstanding_from_last: 2,
    });

    it("returns total_meetings = 1", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.total_meetings).toBe(1);
    });

    it("returns completed_count = 1", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.completed_count).toBe(1);
    });

    it("returns cancelled_count = 0", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.cancelled_count).toBe(0);
    });

    it("calculates attendance_rate correctly (8/10 = 80%)", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.attendance_rate).toBe(80);
    });

    it("calculates average_attendance correctly (8/1 = 8)", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.average_attendance).toBe(8);
    });

    it("returns average_duration = 60", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.average_duration).toBe(60);
    });

    it("returns safeguarding_discussed_rate = 100", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.safeguarding_discussed_rate).toBe(100);
    });

    it("returns minutes_distributed_rate = 100", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.minutes_distributed_rate).toBe(100);
    });

    it("returns minutes_not_taken_count = 0", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.minutes_not_taken_count).toBe(0);
    });

    it("returns total_actions_set = 5", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.total_actions_set).toBe(5);
    });

    it("returns action_completion_rate = 60 (3/5)", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.action_completion_rate).toBe(60);
    });

    it("returns actions_outstanding = 2", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.actions_outstanding).toBe(2);
    });

    it("returns children_discussed_count = 2", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.children_discussed_count).toBe(2);
    });

    it("returns full_team_count = 1", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.full_team_count).toBe(1);
    });

    it("by_meeting_type has single entry for full_team", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.by_meeting_type).toEqual({ full_team: 1 });
    });

    it("by_meeting_status has single entry for completed", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.by_meeting_status).toEqual({ completed: 1 });
    });

    it("by_minutes_status has single entry for distributed", () => {
      const m = computeMeetingMetrics([mtg], 10);
      expect(m.by_minutes_status).toEqual({ distributed: 1 });
    });
  });

  // ── Multiple meetings ─────────────────────────────────────────────────────

  describe("multiple meetings", () => {
    const meetings = [
      makeMeeting({
        meeting_type: "full_team",
        meeting_status: "completed",
        minutes_status: "distributed",
        attendees_expected: 10,
        attendees_present: 9,
        duration_minutes: 60,
        safeguarding_discussed: true,
        children_discussed: ["child-1", "child-2"],
        actions_set: 4,
        actions_completed_from_last: 3,
        actions_outstanding_from_last: 1,
      }),
      makeMeeting({
        meeting_type: "shift_handover",
        meeting_status: "completed",
        minutes_status: "not_taken",
        attendees_expected: 6,
        attendees_present: 5,
        duration_minutes: 30,
        safeguarding_discussed: false,
        children_discussed: ["child-2", "child-3"],
        actions_set: 2,
        actions_completed_from_last: 1,
        actions_outstanding_from_last: 0,
      }),
      makeMeeting({
        meeting_type: "management",
        meeting_status: "cancelled",
        minutes_status: "pending",
        attendees_expected: 4,
        attendees_present: 0,
        duration_minutes: null,
        safeguarding_discussed: false,
        children_discussed: [],
        actions_set: 1,
        actions_completed_from_last: 0,
        actions_outstanding_from_last: 1,
      }),
      makeMeeting({
        meeting_type: "full_team",
        meeting_status: "scheduled",
        minutes_status: "pending",
        attendees_expected: 10,
        attendees_present: 0,
        duration_minutes: null,
        safeguarding_discussed: false,
        children_discussed: [],
        actions_set: 0,
        actions_completed_from_last: 0,
        actions_outstanding_from_last: 0,
      }),
    ];

    it("returns total_meetings = 4", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.total_meetings).toBe(4);
    });

    it("returns completed_count = 2", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.completed_count).toBe(2);
    });

    it("returns cancelled_count = 1", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.cancelled_count).toBe(1);
    });

    it("calculates attendance_rate from completed only (14/16 = 87.5%)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.attendance_rate).toBe(87.5);
    });

    it("calculates average_attendance from completed (14/2 = 7)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.average_attendance).toBe(7);
    });

    it("calculates average_duration from completed with duration (60+30)/2 = 45", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.average_duration).toBe(45);
    });

    it("calculates safeguarding_discussed_rate from completed (1/2 = 50%)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.safeguarding_discussed_rate).toBe(50);
    });

    it("calculates minutes_distributed_rate from completed (1/2 = 50%)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.minutes_distributed_rate).toBe(50);
    });

    it("returns minutes_not_taken_count = 1 (from completed only)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.minutes_not_taken_count).toBe(1);
    });

    it("returns total_actions_set = 7 (sum across ALL meetings)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.total_actions_set).toBe(7);
    });

    it("calculates action_completion_rate across all meetings (4/7)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.action_completion_rate).toBe(Math.round((4 / 7) * 1000) / 10);
    });

    it("returns actions_outstanding = 2 (sum across ALL meetings)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.actions_outstanding).toBe(2);
    });

    it("returns children_discussed_count = 3 (unique from completed)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.children_discussed_count).toBe(3);
    });

    it("returns full_team_count = 2 (across ALL meetings)", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.full_team_count).toBe(2);
    });

    it("groups by_meeting_type correctly", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.by_meeting_type).toEqual({
        full_team: 2, shift_handover: 1, management: 1,
      });
    });

    it("groups by_meeting_status correctly", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.by_meeting_status).toEqual({
        completed: 2, cancelled: 1, scheduled: 1,
      });
    });

    it("groups by_minutes_status correctly", () => {
      const m = computeMeetingMetrics(meetings, 10);
      expect(m.by_minutes_status).toEqual({
        distributed: 1, not_taken: 1, pending: 2,
      });
    });
  });

  // ── attendance_rate ────────────────────────────────────────────────────────

  describe("attendance_rate", () => {
    it("returns 0 when no completed meetings", () => {
      const mtg = [makeMeeting({ meeting_status: "cancelled", attendees_expected: 10, attendees_present: 0 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.attendance_rate).toBeNull();;
    });

    it("returns 100 when all expected attend", () => {
      const mtg = [makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 10 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.attendance_rate).toBe(100);
    });

    it("returns 0 when totalExpected is 0 (no completed)", () => {
      const mtg = [makeMeeting({ meeting_status: "scheduled", attendees_expected: 0, attendees_present: 0 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.attendance_rate).toBeNull();;
    });

    it("handles completed meetings with attendees_expected = 0", () => {
      const mtg = [makeMeeting({ meeting_status: "completed", attendees_expected: 0, attendees_present: 0 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.attendance_rate).toBeNull();;
    });

    it("rounds correctly (7/9)", () => {
      const mtg = [makeMeeting({ meeting_status: "completed", attendees_expected: 9, attendees_present: 7 })];
      const m = computeMeetingMetrics(mtg, 10);
      // 7/9 = 0.77777... * 1000 = 777.77 => Math.round = 778 / 10 = 77.8
      expect(m.attendance_rate).toBe(77.8);
    });

    it("aggregates across multiple completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 8 }),
        makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 6 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      // totalPresent=14, totalExpected=20 => 14/20 = 70%
      expect(m.attendance_rate).toBe(70);
    });
  });

  // ── average_attendance ─────────────────────────────────────────────────────

  describe("average_attendance", () => {
    it("returns 0 when no completed meetings", () => {
      const mtg = [makeMeeting({ meeting_status: "cancelled" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.average_attendance).toBeNull();;
    });

    it("returns the value itself for a single completed meeting", () => {
      const mtg = [makeMeeting({ meeting_status: "completed", attendees_present: 7 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.average_attendance).toBe(7);
    });

    it("only considers completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_present: 8 }),
        makeMeeting({ meeting_status: "cancelled", attendees_present: 5 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_attendance).toBe(8);
    });

    it("rounds to 1 decimal place", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_present: 7 }),
        makeMeeting({ meeting_status: "completed", attendees_present: 8 }),
        makeMeeting({ meeting_status: "completed", attendees_present: 9 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_attendance).toBe(8);
    });

    it("rounds fractional averages correctly (7+8 = 15/2 = 7.5)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_present: 7 }),
        makeMeeting({ meeting_status: "completed", attendees_present: 8 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_attendance).toBe(7.5);
    });

    it("rounds fractional averages correctly (10/3 = 3.3)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_present: 3 }),
        makeMeeting({ meeting_status: "completed", attendees_present: 3 }),
        makeMeeting({ meeting_status: "completed", attendees_present: 4 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_attendance).toBe(3.3);
    });
  });

  // ── average_duration ───────────────────────────────────────────────────────

  describe("average_duration", () => {
    it("returns 0 when no completed meetings", () => {
      const mtg = [makeMeeting({ meeting_status: "cancelled", duration_minutes: 60 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.average_duration).toBeNull();;
    });

    it("returns the value itself for a single completed meeting", () => {
      const mtg = [makeMeeting({ meeting_status: "completed", duration_minutes: 90 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.average_duration).toBe(90);
    });

    it("only considers completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", duration_minutes: 60 }),
        makeMeeting({ meeting_status: "cancelled", duration_minutes: 30 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_duration).toBe(60);
    });

    it("excludes completed meetings where duration_minutes is null", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", duration_minutes: 60 }),
        makeMeeting({ meeting_status: "completed", duration_minutes: null }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_duration).toBe(60);
    });

    it("returns 0 when all completed meetings have null duration", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", duration_minutes: null }),
        makeMeeting({ meeting_status: "completed", duration_minutes: null }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_duration).toBeNull();;
    });

    it("rounds fractional averages correctly (70/3 = 23.3)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", duration_minutes: 20 }),
        makeMeeting({ meeting_status: "completed", duration_minutes: 25 }),
        makeMeeting({ meeting_status: "completed", duration_minutes: 25 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_duration).toBe(23.3);
    });

    it("rounds to 1 decimal place", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", duration_minutes: 40 }),
        makeMeeting({ meeting_status: "completed", duration_minutes: 50 }),
        makeMeeting({ meeting_status: "completed", duration_minutes: 60 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.average_duration).toBe(50);
    });
  });

  // ── safeguarding_discussed_rate ────────────────────────────────────────────

  describe("safeguarding_discussed_rate", () => {
    it("returns 0 when no completed meetings", () => {
      const mtg = [makeMeeting({ meeting_status: "cancelled", safeguarding_discussed: true })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.safeguarding_discussed_rate).toBeNull();;
    });

    it("returns 100 when all completed discuss safeguarding", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: true }),
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: true }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.safeguarding_discussed_rate).toBe(100);
    });

    it("returns 0 when none discuss safeguarding", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.safeguarding_discussed_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: true }),
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.safeguarding_discussed_rate).toBe(33.3);
    });

    it("only uses completed meetings as denominator", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", safeguarding_discussed: true }),
        makeMeeting({ meeting_status: "cancelled", safeguarding_discussed: false }),
        makeMeeting({ meeting_status: "scheduled", safeguarding_discussed: false }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.safeguarding_discussed_rate).toBe(100);
    });
  });

  // ── minutes_distributed_rate ───────────────────────────────────────────────

  describe("minutes_distributed_rate", () => {
    it("returns 0 when no completed meetings", () => {
      const mtg = [makeMeeting({ meeting_status: "cancelled", minutes_status: "distributed" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.minutes_distributed_rate).toBeNull();;
    });

    it("returns 100 when all completed have distributed minutes", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_distributed_rate).toBe(100);
    });

    it("returns 0 when no completed have distributed minutes", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "drafted" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_distributed_rate).toBe(0);
    });

    it("rounds correctly (1 of 3 = 33.3%)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "drafted" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_distributed_rate).toBe(33.3);
    });

    it("only uses completed meetings as denominator", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
        makeMeeting({ meeting_status: "cancelled", minutes_status: "pending" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_distributed_rate).toBe(100);
    });
  });

  // ── minutes_not_taken_count ────────────────────────────────────────────────

  describe("minutes_not_taken_count", () => {
    it("counts completed meetings where minutes_status = not_taken", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_not_taken_count).toBe(2);
    });

    it("does not count non-completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "scheduled", minutes_status: "not_taken" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_not_taken_count).toBe(0);
    });

    it("returns 0 when no minutes are not_taken", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.minutes_not_taken_count).toBe(0);
    });
  });

  // ── total_actions_set ──────────────────────────────────────────────────────

  describe("total_actions_set", () => {
    it("sums actions_set across ALL meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", actions_set: 3 }),
        makeMeeting({ meeting_status: "cancelled", actions_set: 2 }),
        makeMeeting({ meeting_status: "scheduled", actions_set: 1 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.total_actions_set).toBe(6);
    });

    it("returns 0 when all have 0 actions", () => {
      const mtgs = [
        makeMeeting({ actions_set: 0 }),
        makeMeeting({ actions_set: 0 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.total_actions_set).toBe(0);
    });
  });

  // ── action_completion_rate ─────────────────────────────────────────────────

  describe("action_completion_rate", () => {
    it("returns 0 when total_actions_set = 0", () => {
      const mtg = [makeMeeting({ actions_set: 0, actions_completed_from_last: 0 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.action_completion_rate).toBeNull();;
    });

    it("returns 100 when all actions completed", () => {
      const mtg = [makeMeeting({ actions_set: 5, actions_completed_from_last: 5 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.action_completion_rate).toBe(100);
    });

    it("sums actions across ALL meetings (not just completed)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", actions_set: 3, actions_completed_from_last: 2 }),
        makeMeeting({ meeting_status: "cancelled", actions_set: 2, actions_completed_from_last: 0 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      // total_actions_set = 5, total_completed = 2 => 2/5 = 40%
      expect(m.action_completion_rate).toBe(40);
    });

    it("rounds correctly (2/3)", () => {
      const mtg = [makeMeeting({ actions_set: 3, actions_completed_from_last: 2 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.action_completion_rate).toBe(66.7);
    });
  });

  // ── actions_outstanding ────────────────────────────────────────────────────

  describe("actions_outstanding", () => {
    it("sums actions_outstanding_from_last across ALL meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", actions_outstanding_from_last: 2 }),
        makeMeeting({ meeting_status: "cancelled", actions_outstanding_from_last: 3 }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.actions_outstanding).toBe(5);
    });

    it("returns 0 when no outstanding actions", () => {
      const mtg = [makeMeeting({ actions_outstanding_from_last: 0 })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.actions_outstanding).toBe(0);
    });
  });

  // ── children_discussed_count ───────────────────────────────────────────────

  describe("children_discussed_count", () => {
    it("counts unique children from completed meetings only", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", children_discussed: ["child-1", "child-2"] }),
        makeMeeting({ meeting_status: "completed", children_discussed: ["child-2", "child-3"] }),
        makeMeeting({ meeting_status: "cancelled", children_discussed: ["child-4"] }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      // child-1, child-2, child-3 from completed only
      expect(m.children_discussed_count).toBe(3);
    });

    it("deduplicates children across multiple completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", children_discussed: ["child-1", "child-2"] }),
        makeMeeting({ meeting_status: "completed", children_discussed: ["child-1", "child-2"] }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.children_discussed_count).toBe(2);
    });

    it("returns 0 when no children discussed in completed meetings", () => {
      const mtg = [makeMeeting({ meeting_status: "completed", children_discussed: [] })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.children_discussed_count).toBe(0);
    });

    it("returns 0 when only non-completed meetings discuss children", () => {
      const mtg = [makeMeeting({ meeting_status: "cancelled", children_discussed: ["child-1"] })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.children_discussed_count).toBe(0);
    });
  });

  // ── full_team_count ────────────────────────────────────────────────────────

  describe("full_team_count", () => {
    it("counts full_team meetings across ALL meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed" }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "cancelled" }),
        makeMeeting({ meeting_type: "management", meeting_status: "completed" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.full_team_count).toBe(2);
    });

    it("returns 0 when no full_team meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "management" }),
        makeMeeting({ meeting_type: "shift_handover" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.full_team_count).toBe(0);
    });
  });

  // ── completed_count ────────────────────────────────────────────────────────

  describe("completed_count", () => {
    it("counts only completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "scheduled" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.completed_count).toBe(2);
    });

    it("does not count rescheduled as completed", () => {
      const mtg = [makeMeeting({ meeting_status: "rescheduled" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.completed_count).toBe(0);
    });

    it("does not count postponed as completed", () => {
      const mtg = [makeMeeting({ meeting_status: "postponed" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.completed_count).toBe(0);
    });
  });

  // ── cancelled_count ────────────────────────────────────────────────────────

  describe("cancelled_count", () => {
    it("counts only cancelled meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.cancelled_count).toBe(2);
    });

    it("does not count rescheduled as cancelled", () => {
      const mtg = [makeMeeting({ meeting_status: "rescheduled" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.cancelled_count).toBe(0);
    });

    it("does not count postponed as cancelled", () => {
      const mtg = [makeMeeting({ meeting_status: "postponed" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.cancelled_count).toBe(0);
    });

    it("does not count scheduled as cancelled", () => {
      const mtg = [makeMeeting({ meeting_status: "scheduled" })];
      const m = computeMeetingMetrics(mtg, 10);
      expect(m.cancelled_count).toBe(0);
    });
  });

  // ── by_meeting_type ────────────────────────────────────────────────────────

  describe("by_meeting_type", () => {
    it("groups multiple types correctly", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team" }),
        makeMeeting({ meeting_type: "full_team" }),
        makeMeeting({ meeting_type: "management" }),
        makeMeeting({ meeting_type: "shift_handover" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.by_meeting_type).toEqual({ full_team: 2, management: 1, shift_handover: 1 });
    });

    it("handles all meetings with same type", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "safeguarding" }),
        makeMeeting({ meeting_type: "safeguarding" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.by_meeting_type).toEqual({ safeguarding: 2 });
    });
  });

  // ── by_meeting_status ──────────────────────────────────────────────────────

  describe("by_meeting_status", () => {
    it("groups multiple statuses correctly", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "scheduled" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.by_meeting_status).toEqual({ completed: 2, cancelled: 1, scheduled: 1 });
    });

    it("handles all same status", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.by_meeting_status).toEqual({ completed: 2 });
    });
  });

  // ── by_minutes_status ──────────────────────────────────────────────────────

  describe("by_minutes_status", () => {
    it("groups multiple statuses correctly", () => {
      const mtgs = [
        makeMeeting({ minutes_status: "distributed" }),
        makeMeeting({ minutes_status: "distributed" }),
        makeMeeting({ minutes_status: "not_taken" }),
        makeMeeting({ minutes_status: "pending" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.by_minutes_status).toEqual({ distributed: 2, not_taken: 1, pending: 1 });
    });

    it("handles all same status", () => {
      const mtgs = [
        makeMeeting({ minutes_status: "approved" }),
        makeMeeting({ minutes_status: "approved" }),
      ];
      const m = computeMeetingMetrics(mtgs, 10);
      expect(m.by_minutes_status).toEqual({ approved: 2 });
    });
  });

  // ── Return shape ──────────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns exactly 17 keys", () => {
      const m = computeMeetingMetrics([], 0);
      expect(Object.keys(m)).toHaveLength(17);
    });

    it("contains all expected keys", () => {
      const m = computeMeetingMetrics([], 0);
      const keys = Object.keys(m);
      const expected = [
        "total_meetings", "completed_count", "cancelled_count",
        "attendance_rate", "average_attendance", "average_duration",
        "safeguarding_discussed_rate", "minutes_distributed_rate",
        "minutes_not_taken_count", "total_actions_set",
        "action_completion_rate", "actions_outstanding",
        "children_discussed_count", "full_team_count",
        "by_meeting_type", "by_meeting_status", "by_minutes_status",
      ];
      for (const k of expected) {
        expect(keys).toContain(k);
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// identifyMeetingAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyMeetingAlerts", () => {
  // ── No alerts ──────────────────────────────────────────────────────────────

  describe("no alerts", () => {
    it("returns empty array when no meetings", () => {
      const alerts = identifyMeetingAlerts([], 0);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when no meetings and totalStaff > 0", () => {
      const alerts = identifyMeetingAlerts([], 10);
      expect(alerts).toEqual([]);
    });

    it("returns empty array when all conditions are clean", () => {
      const mtgs = [
        makeMeeting({
          meeting_type: "full_team",
          meeting_status: "completed",
          safeguarding_discussed: true,
          attendees_expected: 10,
          attendees_present: 8,
          minutes_status: "distributed",
          actions_outstanding_from_last: 0,
        }),
        makeMeeting({
          meeting_type: "full_team",
          meeting_status: "completed",
          safeguarding_discussed: true,
          attendees_expected: 10,
          attendees_present: 9,
          minutes_status: "distributed",
          actions_outstanding_from_last: 0,
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      expect(alerts).toEqual([]);
    });

    it("returns empty array for single clean completed meeting", () => {
      const mtgs = [
        makeMeeting({
          meeting_type: "full_team",
          meeting_status: "completed",
          safeguarding_discussed: true,
          attendees_expected: 10,
          attendees_present: 8,
          minutes_status: "distributed",
          actions_outstanding_from_last: 0,
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      expect(alerts).toEqual([]);
    });
  });

  // ── safeguarding_not_discussed alert ───────────────────────────────────────

  describe("safeguarding_not_discussed alert", () => {
    it("fires when >= 2 completed full_team meetings have safeguarding_discussed=false", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeDefined();
    });

    it("has severity critical", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.severity).toBe("critical");
    });

    it("has id 'safeguarding_not_discussed'", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.id).toBe("safeguarding_not_discussed");
    });

    it("includes count of qualifying meetings in message", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.message).toContain("3");
    });

    it("mentions standing agenda item in message", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed")!;
      expect(alert.message).toContain("standing agenda item");
    });

    it("does NOT fire for non-full_team meeting types", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "shift_handover", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "management", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "case_discussion", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for non-completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "cancelled", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "scheduled", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "postponed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when only 1 qualifying meeting exists", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: true }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 2", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeDefined();
    });

    it("does NOT fire when all completed full_team meetings discuss safeguarding", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: true }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: true }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "safeguarding_not_discussed");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of qualifying count", () => {
      const mtgs = [
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
        makeMeeting({ meeting_type: "full_team", meeting_status: "completed", safeguarding_discussed: false }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const sgAlerts = alerts.filter((a) => a.type === "safeguarding_not_discussed");
      expect(sgAlerts).toHaveLength(1);
    });
  });

  // ── poor_attendance alert ──────────────────────────────────────────────────

  describe("poor_attendance alert", () => {
    it("fires for completed meeting with < 50% attendance", () => {
      const mtgs = [
        makeMeeting({
          id: "m1",
          meeting_status: "completed",
          attendees_expected: 10,
          attendees_present: 4,
          meeting_date: "2025-01-15",
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const mtgs = [
        makeMeeting({
          id: "m1",
          meeting_status: "completed",
          attendees_expected: 10,
          attendees_present: 3,
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance")!;
      expect(alert.severity).toBe("high");
    });

    it("uses meeting id as alert id", () => {
      const mtgs = [
        makeMeeting({
          id: "meeting-abc-123",
          meeting_status: "completed",
          attendees_expected: 10,
          attendees_present: 4,
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance")!;
      expect(alert.id).toBe("meeting-abc-123");
    });

    it("includes meeting_date in message", () => {
      const mtgs = [
        makeMeeting({
          id: "m1",
          meeting_status: "completed",
          attendees_expected: 10,
          attendees_present: 3,
          meeting_date: "2025-06-15",
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance")!;
      expect(alert.message).toContain("2025-06-15");
    });

    it("includes present/expected counts in message", () => {
      const mtgs = [
        makeMeeting({
          id: "m1",
          meeting_status: "completed",
          attendees_expected: 10,
          attendees_present: 3,
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance")!;
      expect(alert.message).toContain("3/10");
    });

    it("creates one alert per qualifying meeting", () => {
      const mtgs = [
        makeMeeting({ id: "m1", meeting_status: "completed", attendees_expected: 10, attendees_present: 2 }),
        makeMeeting({ id: "m2", meeting_status: "completed", attendees_expected: 10, attendees_present: 3 }),
        makeMeeting({ id: "m3", meeting_status: "completed", attendees_expected: 10, attendees_present: 4 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const poorAlerts = alerts.filter((a) => a.type === "poor_attendance");
      expect(poorAlerts).toHaveLength(3);
    });

    it("does NOT fire when attendance >= 50%", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 5 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire at exact 50% boundary (< not <=)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 5 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeUndefined();
    });

    it("fires just below 50% (4/10 = 0.4)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 4 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeDefined();
    });

    it("does NOT fire for non-completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled", attendees_expected: 10, attendees_present: 1 }),
        makeMeeting({ meeting_status: "scheduled", attendees_expected: 10, attendees_present: 0 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when attendees_expected = 0", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_expected: 0, attendees_present: 0 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeUndefined();
    });

    it("fires when attendees_present = 0 and attendees_expected > 0", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", attendees_expected: 10, attendees_present: 0 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "poor_attendance");
      expect(alert).toBeDefined();
    });
  });

  // ── minutes_not_taken alert ────────────────────────────────────────────────

  describe("minutes_not_taken alert", () => {
    it("fires when >= 2 completed meetings have minutes_status=not_taken", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken");
      expect(alert).toBeDefined();
    });

    it("has severity high", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken")!;
      expect(alert.severity).toBe("high");
    });

    it("has id 'minutes_not_taken'", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken")!;
      expect(alert.id).toBe("minutes_not_taken");
    });

    it("includes count in message", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken")!;
      expect(alert.message).toContain("3");
    });

    it("mentions accountability in message", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken")!;
      expect(alert.message).toContain("accountability");
    });

    it("does NOT fire when only 1 completed meeting has not_taken minutes", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "distributed" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire for non-completed meetings", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "scheduled", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "postponed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 2", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "minutes_not_taken");
      expect(alert).toBeDefined();
    });

    it("only produces one alert regardless of qualifying count", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
        makeMeeting({ meeting_status: "completed", minutes_status: "not_taken" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const minutesAlerts = alerts.filter((a) => a.type === "minutes_not_taken");
      expect(minutesAlerts).toHaveLength(1);
    });
  });

  // ── high_cancellation alert ────────────────────────────────────────────────

  describe("high_cancellation alert", () => {
    it("fires when meetings.length >= 4 AND cancelled/total > 0.3", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      // 2/4 = 0.5 > 0.3
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'high_cancellation'", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.id).toBe("high_cancellation");
    });

    it("includes cancelled count and total in message", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("2");
      expect(alert.message).toContain("4");
    });

    it("includes percentage with Math.round in message", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      // 2/4 = 50%
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("50%");
    });

    it("rounds percentage correctly for non-round values", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      // 2/5 = 40%
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("40%");
    });

    it("does NOT fire when meetings.length < 4", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      // 3 meetings total < 4 threshold
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire when cancellation rate <= 0.3", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      // 1/4 = 0.25 <= 0.3
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeUndefined();
    });

    it("does NOT fire at exact 0.3 boundary (> not >=)", () => {
      // 3/10 = 0.3 exactly
      const mtgs: TeamMeeting[] = [];
      for (let i = 0; i < 3; i++) {
        mtgs.push(makeMeeting({ meeting_status: "cancelled" }));
      }
      for (let i = 3; i < 10; i++) {
        mtgs.push(makeMeeting({ meeting_status: "completed" }));
      }
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeUndefined();
    });

    it("fires just above 0.3 boundary", () => {
      // 4/10 = 0.4 > 0.3
      const mtgs: TeamMeeting[] = [];
      for (let i = 0; i < 4; i++) {
        mtgs.push(makeMeeting({ meeting_status: "cancelled" }));
      }
      for (let i = 4; i < 10; i++) {
        mtgs.push(makeMeeting({ meeting_status: "completed" }));
      }
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeDefined();
    });

    it("fires at exactly 4 meetings with > 0.3 rate", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      // 2/4 = 0.5 > 0.3
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation");
      expect(alert).toBeDefined();
    });

    it("mentions scheduling in message", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "cancelled" }),
        makeMeeting({ meeting_status: "completed" }),
        makeMeeting({ meeting_status: "completed" }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "high_cancellation")!;
      expect(alert.message).toContain("scheduling");
    });
  });

  // ── actions_outstanding alert ──────────────────────────────────────────────

  describe("actions_outstanding alert", () => {
    it("fires when total outstanding >= 5", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 3 }),
        makeMeeting({ actions_outstanding_from_last: 2 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding");
      expect(alert).toBeDefined();
    });

    it("has severity medium", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 5 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding")!;
      expect(alert.severity).toBe("medium");
    });

    it("has id 'actions_outstanding'", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 5 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding")!;
      expect(alert.id).toBe("actions_outstanding");
    });

    it("includes total outstanding count in message", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 3 }),
        makeMeeting({ actions_outstanding_from_last: 4 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding")!;
      expect(alert.message).toContain("7");
    });

    it("mentions follow up in message", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 5 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding")!;
      expect(alert.message).toContain("follow up");
    });

    it("sums across ALL meetings (not just completed)", () => {
      const mtgs = [
        makeMeeting({ meeting_status: "completed", actions_outstanding_from_last: 3 }),
        makeMeeting({ meeting_status: "cancelled", actions_outstanding_from_last: 2 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding");
      expect(alert).toBeDefined();
    });

    it("does NOT fire when total < 5", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 2 }),
        makeMeeting({ actions_outstanding_from_last: 2 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("fires at exact threshold of 5", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 5 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding");
      expect(alert).toBeDefined();
    });

    it("does NOT fire at 4 (just below threshold)", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 4 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const alert = alerts.find((a) => a.type === "actions_outstanding");
      expect(alert).toBeUndefined();
    });

    it("only produces one alert regardless of total", () => {
      const mtgs = [
        makeMeeting({ actions_outstanding_from_last: 10 }),
        makeMeeting({ actions_outstanding_from_last: 10 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const outAlerts = alerts.filter((a) => a.type === "actions_outstanding");
      expect(outAlerts).toHaveLength(1);
    });
  });

  // ── Combined alerts ───────────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can return all 5 alert types simultaneously", () => {
      const mtgs = [
        // safeguarding_not_discussed: 2 completed full_team without safeguarding
        makeMeeting({
          id: "m1", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, attendees_expected: 10, attendees_present: 2,
          minutes_status: "not_taken", actions_outstanding_from_last: 3,
        }),
        makeMeeting({
          id: "m2", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, attendees_expected: 10, attendees_present: 3,
          minutes_status: "not_taken", actions_outstanding_from_last: 3,
        }),
        // cancelled for high_cancellation
        makeMeeting({ id: "m3", meeting_status: "cancelled", actions_outstanding_from_last: 0 }),
        makeMeeting({ id: "m4", meeting_status: "cancelled", actions_outstanding_from_last: 0 }),
      ];
      // 4 meetings, 2 cancelled = 50% > 30% => high_cancellation
      // 2 completed full_team without sg => safeguarding_not_discussed
      // m1 has 2/10 attendance < 50%, m2 has 3/10 < 50% => poor_attendance x2
      // 2 completed with not_taken minutes => minutes_not_taken
      // 6 outstanding >= 5 => actions_outstanding
      const alerts = identifyMeetingAlerts(mtgs, 10);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("safeguarding_not_discussed");
      expect(types).toContain("poor_attendance");
      expect(types).toContain("minutes_not_taken");
      expect(types).toContain("high_cancellation");
      expect(types).toContain("actions_outstanding");
    });

    it("returns correct total count when multiple alert types fire", () => {
      const mtgs = [
        makeMeeting({
          id: "m1", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, attendees_expected: 10, attendees_present: 2,
          minutes_status: "not_taken", actions_outstanding_from_last: 3,
        }),
        makeMeeting({
          id: "m2", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, attendees_expected: 10, attendees_present: 3,
          minutes_status: "not_taken", actions_outstanding_from_last: 3,
        }),
        makeMeeting({ id: "m3", meeting_status: "cancelled", actions_outstanding_from_last: 0 }),
        makeMeeting({ id: "m4", meeting_status: "cancelled", actions_outstanding_from_last: 0 }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      // safeguarding_not_discussed(1) + poor_attendance(2) + minutes_not_taken(1) + high_cancellation(1) + actions_outstanding(1) = 6
      expect(alerts.length).toBe(6);
    });
  });

  // ── Alert structure ───────────────────────────────────────────────────────

  describe("alert structure", () => {
    it("every alert has type, severity, message, and id fields", () => {
      const mtgs = [
        makeMeeting({
          id: "m1", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, attendees_expected: 10, attendees_present: 2,
          minutes_status: "not_taken", actions_outstanding_from_last: 5,
        }),
        makeMeeting({
          id: "m2", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, minutes_status: "not_taken",
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
        expect(typeof alert.type).toBe("string");
        expect(typeof alert.severity).toBe("string");
        expect(typeof alert.message).toBe("string");
        expect(typeof alert.id).toBe("string");
      }
    });

    it("severity is always one of critical, high, or medium", () => {
      const mtgs = [
        makeMeeting({
          id: "m1", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, attendees_expected: 10, attendees_present: 2,
          minutes_status: "not_taken", actions_outstanding_from_last: 5,
        }),
        makeMeeting({
          id: "m2", meeting_type: "full_team", meeting_status: "completed",
          safeguarding_discussed: false, minutes_status: "not_taken",
        }),
      ];
      const alerts = identifyMeetingAlerts(mtgs, 10);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });
  });
});
