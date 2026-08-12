// ══════════════════════════════════════════════════════════════════════════════
// CARA — CHILDREN'S MEETINGS SERVICE TESTS
// Pure-function unit tests for children's meeting metrics computation,
// alert identification, constant validation.
// CHR 2015 Reg 7 (children's plan — participation),
// Reg 10 (children's views — group settings),
// Reg 16 (statement of purpose — children's involvement).
//
// Covers: house meetings, children's council, menu planning meetings,
// activity planning meetings, rules review meetings, complaints forums.
//
// SCCIF: Voice of the Child — "Children influence how the home is run."
// "Regular meetings give children a genuine say in their care."
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import { todayStr } from "@/lib/utils";
import {
  _testing,
  MEETING_TYPES,
  PARTICIPATION_LEVELS,
  ACTION_OUTCOMES,
  MEETING_ATMOSPHERES,
} from "../childrens-meetings-service";

import type {
  ChildrensMeetingRecord,
  MeetingType,
  ParticipationLevel,
  ActionOutcome,
  MeetingAtmosphere,
} from "../childrens-meetings-service";

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

function futureDateStr(n: number): string {
  const d = new Date(todayStr());
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Build a minimal ChildrensMeetingRecord with sensible defaults. */
function makeRecord(
  overrides?: Partial<ChildrensMeetingRecord>,
): ChildrensMeetingRecord {
  return {
    id: crypto.randomUUID(),
    home_id: "home-1",
    meeting_type: "house_meeting",
    meeting_date: daysAgo(5),
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
    food_provided: false,
    changes_implemented: true,
    children_feedback_positive: true,
    staff_facilitator: "Staff A",
    topics_discussed: [],
    actions_agreed: [],
    next_meeting_date:
      "next_meeting_date" in (overrides ?? {})
        ? (overrides!.next_meeting_date ?? null)
        : null,
    notes:
      "notes" in (overrides ?? {})
        ? (overrides!.notes ?? null)
        : null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Normalised "today" matching the service's `new Date()` comparison. */
const now = new Date(todayStr());

/** Math.round(value * 1000) / 10 — same rounding the service uses. */
function rate(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 1000) / 10 : 0;
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANTS
// ══════════════════════════════════════════════════════════════════════════════

describe("MEETING_TYPES", () => {
  it("contains exactly 10 entries", () => {
    expect(MEETING_TYPES).toHaveLength(10);
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
      "house_meeting", "childrens_council", "menu_planning",
      "activity_planning", "rules_review", "complaints_forum",
      "welcome_meeting", "goodbye_meeting", "celebration", "other",
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

  it("maps house_meeting to 'House Meeting'", () => {
    const found = MEETING_TYPES.find((t) => t.type === "house_meeting");
    expect(found?.label).toBe("House Meeting");
  });

  it("maps childrens_council to \"Children's Council\"", () => {
    const found = MEETING_TYPES.find((t) => t.type === "childrens_council");
    expect(found?.label).toBe("Children's Council");
  });

  it("maps menu_planning to 'Menu Planning'", () => {
    const found = MEETING_TYPES.find((t) => t.type === "menu_planning");
    expect(found?.label).toBe("Menu Planning");
  });
});

describe("PARTICIPATION_LEVELS", () => {
  it("contains exactly 5 entries", () => {
    expect(PARTICIPATION_LEVELS).toHaveLength(5);
  });

  it("every entry has a non-empty level string", () => {
    for (const p of PARTICIPATION_LEVELS) {
      expect(typeof p.level).toBe("string");
      expect(p.level.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const p of PARTICIPATION_LEVELS) {
      expect(typeof p.label).toBe("string");
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate levels", () => {
    const levels = PARTICIPATION_LEVELS.map((p) => p.level);
    expect(new Set(levels).size).toBe(levels.length);
  });

  it("has no duplicate labels", () => {
    const labels = PARTICIPATION_LEVELS.map((p) => p.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected levels", () => {
    const levels = PARTICIPATION_LEVELS.map((p) => p.level);
    const expected: ParticipationLevel[] = [
      "all_participated", "most_participated", "some_participated",
      "minimal_participation", "no_participation",
    ];
    for (const e of expected) {
      expect(levels).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const p of PARTICIPATION_LEVELS) {
      expect(p.label[0]).toBe(p.label[0].toUpperCase());
    }
  });
});

describe("ACTION_OUTCOMES", () => {
  it("contains exactly 5 entries", () => {
    expect(ACTION_OUTCOMES).toHaveLength(5);
  });

  it("every entry has a non-empty outcome string", () => {
    for (const a of ACTION_OUTCOMES) {
      expect(typeof a.outcome).toBe("string");
      expect(a.outcome.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const a of ACTION_OUTCOMES) {
      expect(typeof a.label).toBe("string");
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate outcomes", () => {
    const outcomes = ACTION_OUTCOMES.map((a) => a.outcome);
    expect(new Set(outcomes).size).toBe(outcomes.length);
  });

  it("has no duplicate labels", () => {
    const labels = ACTION_OUTCOMES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected outcomes", () => {
    const outcomes = ACTION_OUTCOMES.map((a) => a.outcome);
    const expected: ActionOutcome[] = [
      "all_actions_completed", "most_completed", "some_completed",
      "none_completed", "no_actions_needed",
    ];
    for (const e of expected) {
      expect(outcomes).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const a of ACTION_OUTCOMES) {
      expect(a.label[0]).toBe(a.label[0].toUpperCase());
    }
  });
});

describe("MEETING_ATMOSPHERES", () => {
  it("contains exactly 5 entries", () => {
    expect(MEETING_ATMOSPHERES).toHaveLength(5);
  });

  it("every entry has a non-empty atmosphere string", () => {
    for (const a of MEETING_ATMOSPHERES) {
      expect(typeof a.atmosphere).toBe("string");
      expect(a.atmosphere.length).toBeGreaterThan(0);
    }
  });

  it("every entry has a non-empty label string", () => {
    for (const a of MEETING_ATMOSPHERES) {
      expect(typeof a.label).toBe("string");
      expect(a.label.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate atmospheres", () => {
    const atmospheres = MEETING_ATMOSPHERES.map((a) => a.atmosphere);
    expect(new Set(atmospheres).size).toBe(atmospheres.length);
  });

  it("has no duplicate labels", () => {
    const labels = MEETING_ATMOSPHERES.map((a) => a.label);
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("includes all expected atmospheres", () => {
    const atmospheres = MEETING_ATMOSPHERES.map((a) => a.atmosphere);
    const expected: MeetingAtmosphere[] = [
      "very_positive", "positive", "neutral", "tense", "negative",
    ];
    for (const e of expected) {
      expect(atmospheres).toContain(e);
    }
  });

  it("labels are title-cased human-readable strings", () => {
    for (const a of MEETING_ATMOSPHERES) {
      expect(a.label[0]).toBe(a.label[0].toUpperCase());
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeMeetingMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeMeetingMetrics", () => {
  // ── Empty array ────────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns total_meetings = 0", () => {
      expect(computeMeetingMetrics([]).total_meetings).toBe(0);
    });

    it("returns house_meeting_count = 0", () => {
      expect(computeMeetingMetrics([]).house_meeting_count).toBe(0);
    });

    it("returns childrens_council_count = 0", () => {
      expect(computeMeetingMetrics([]).childrens_council_count).toBe(0);
    });

    it("returns menu_planning_count = 0", () => {
      expect(computeMeetingMetrics([]).menu_planning_count).toBe(0);
    });

    it("returns activity_planning_count = 0", () => {
      expect(computeMeetingMetrics([]).activity_planning_count).toBe(0);
    });

    it("returns all_participated_rate = 0", () => {
      expect(computeMeetingMetrics([]).all_participated_rate).toBeNull();;
    });

    it("returns no_participation_count = 0", () => {
      expect(computeMeetingMetrics([]).no_participation_count).toBe(0);
    });

    it("returns attendance_rate = 0", () => {
      expect(computeMeetingMetrics([]).attendance_rate).toBeNull();;
    });

    it("returns agenda_shared_rate = 0", () => {
      expect(computeMeetingMetrics([]).agenda_shared_rate).toBeNull();;
    });

    it("returns children_set_agenda_rate = 0", () => {
      expect(computeMeetingMetrics([]).children_set_agenda_rate).toBeNull();;
    });

    it("returns minutes_recorded_rate = 0", () => {
      expect(computeMeetingMetrics([]).minutes_recorded_rate).toBeNull();;
    });

    it("returns previous_actions_reviewed_rate = 0", () => {
      expect(computeMeetingMetrics([]).previous_actions_reviewed_rate).toBeNull();;
    });

    it("returns child_chair_rate = 0", () => {
      expect(computeMeetingMetrics([]).child_chair_rate).toBeNull();;
    });

    it("returns changes_implemented_rate = 0", () => {
      expect(computeMeetingMetrics([]).changes_implemented_rate).toBeNull();;
    });

    it("returns children_feedback_positive_rate = 0", () => {
      expect(computeMeetingMetrics([]).children_feedback_positive_rate).toBeNull();;
    });

    it("returns all_actions_completed_rate = 0", () => {
      expect(computeMeetingMetrics([]).all_actions_completed_rate).toBeNull();;
    });

    it("returns none_completed_count = 0", () => {
      expect(computeMeetingMetrics([]).none_completed_count).toBe(0);
    });

    it("returns very_positive_atmosphere_rate = 0", () => {
      expect(computeMeetingMetrics([]).very_positive_atmosphere_rate).toBeNull();;
    });

    it("returns negative_atmosphere_count = 0", () => {
      expect(computeMeetingMetrics([]).negative_atmosphere_count).toBe(0);
    });

    it("returns meeting_overdue_count = 0", () => {
      expect(computeMeetingMetrics([]).meeting_overdue_count).toBe(0);
    });

    it("returns empty by_meeting_type", () => {
      expect(computeMeetingMetrics([]).by_meeting_type).toEqual({});
    });

    it("returns empty by_participation_level", () => {
      expect(computeMeetingMetrics([]).by_participation_level).toEqual({});
    });

    it("returns empty by_action_outcome", () => {
      expect(computeMeetingMetrics([]).by_action_outcome).toEqual({});
    });

    it("returns empty by_meeting_atmosphere", () => {
      expect(computeMeetingMetrics([]).by_meeting_atmosphere).toEqual({});
    });
  });

  // ── Single default record ─────────────────────────────────────────────

  describe("single default record", () => {
    const records = [makeRecord()];

    it("returns total_meetings = 1", () => {
      expect(computeMeetingMetrics(records).total_meetings).toBe(1);
    });

    it("returns house_meeting_count = 1", () => {
      expect(computeMeetingMetrics(records).house_meeting_count).toBe(1);
    });

    it("returns all_participated_rate = 100 for all_participated", () => {
      expect(computeMeetingMetrics(records).all_participated_rate).toBe(100);
    });

    it("returns attendance_rate = 100 when all attend", () => {
      expect(computeMeetingMetrics(records).attendance_rate).toBe(100);
    });

    it("returns agenda_shared_rate = 100", () => {
      expect(computeMeetingMetrics(records).agenda_shared_rate).toBe(100);
    });

    it("returns children_set_agenda_rate = 100", () => {
      expect(computeMeetingMetrics(records).children_set_agenda_rate).toBe(100);
    });

    it("returns minutes_recorded_rate = 100", () => {
      expect(computeMeetingMetrics(records).minutes_recorded_rate).toBe(100);
    });

    it("returns previous_actions_reviewed_rate = 100", () => {
      expect(computeMeetingMetrics(records).previous_actions_reviewed_rate).toBe(100);
    });

    it("returns child_chair_rate = 0 (default false)", () => {
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(0);
    });

    it("returns changes_implemented_rate = 100", () => {
      expect(computeMeetingMetrics(records).changes_implemented_rate).toBe(100);
    });

    it("returns children_feedback_positive_rate = 100", () => {
      expect(computeMeetingMetrics(records).children_feedback_positive_rate).toBe(100);
    });

    it("returns all_actions_completed_rate = 100", () => {
      expect(computeMeetingMetrics(records).all_actions_completed_rate).toBe(100);
    });

    it("returns very_positive_atmosphere_rate = 0 (positive not very_positive)", () => {
      expect(computeMeetingMetrics(records).very_positive_atmosphere_rate).toBe(0);
    });

    it("returns by_meeting_type with house_meeting = 1", () => {
      expect(computeMeetingMetrics(records).by_meeting_type).toEqual({ house_meeting: 1 });
    });

    it("returns by_participation_level with all_participated = 1", () => {
      expect(computeMeetingMetrics(records).by_participation_level).toEqual({ all_participated: 1 });
    });

    it("returns by_action_outcome with all_actions_completed = 1", () => {
      expect(computeMeetingMetrics(records).by_action_outcome).toEqual({ all_actions_completed: 1 });
    });

    it("returns by_meeting_atmosphere with positive = 1", () => {
      expect(computeMeetingMetrics(records).by_meeting_atmosphere).toEqual({ positive: 1 });
    });
  });

  // ── Meeting type counts ───────────────────────────────────────────────

  describe("meeting type counts", () => {
    it("counts house_meeting correctly", () => {
      const records = [
        makeRecord({ meeting_type: "house_meeting" }),
        makeRecord({ meeting_type: "house_meeting" }),
        makeRecord({ meeting_type: "childrens_council" }),
      ];
      expect(computeMeetingMetrics(records).house_meeting_count).toBe(2);
    });

    it("counts childrens_council correctly", () => {
      const records = [
        makeRecord({ meeting_type: "childrens_council" }),
        makeRecord({ meeting_type: "childrens_council" }),
        makeRecord({ meeting_type: "childrens_council" }),
      ];
      expect(computeMeetingMetrics(records).childrens_council_count).toBe(3);
    });

    it("counts menu_planning correctly", () => {
      const records = [
        makeRecord({ meeting_type: "menu_planning" }),
        makeRecord({ meeting_type: "house_meeting" }),
      ];
      expect(computeMeetingMetrics(records).menu_planning_count).toBe(1);
    });

    it("counts activity_planning correctly", () => {
      const records = [
        makeRecord({ meeting_type: "activity_planning" }),
        makeRecord({ meeting_type: "activity_planning" }),
      ];
      expect(computeMeetingMetrics(records).activity_planning_count).toBe(2);
    });

    it("returns 0 for types not present", () => {
      const records = [makeRecord({ meeting_type: "celebration" })];
      const m = computeMeetingMetrics(records);
      expect(m.house_meeting_count).toBe(0);
      expect(m.childrens_council_count).toBe(0);
      expect(m.menu_planning_count).toBe(0);
      expect(m.activity_planning_count).toBe(0);
    });
  });

  // ── Participation rates ───────────────────────────────────────────────

  describe("participation rates", () => {
    it("all_participated_rate is 100 when all records have all_participated", () => {
      const records = [makeRecord(), makeRecord()];
      expect(computeMeetingMetrics(records).all_participated_rate).toBe(100);
    });

    it("all_participated_rate is 50 when half have all_participated", () => {
      const records = [
        makeRecord({ participation_level: "all_participated" }),
        makeRecord({ participation_level: "most_participated" }),
      ];
      expect(computeMeetingMetrics(records).all_participated_rate).toBe(50);
    });

    it("all_participated_rate is 0 when none have all_participated", () => {
      const records = [
        makeRecord({ participation_level: "some_participated" }),
        makeRecord({ participation_level: "no_participation" }),
      ];
      expect(computeMeetingMetrics(records).all_participated_rate).toBe(0);
    });

    it("no_participation_count counts correctly", () => {
      const records = [
        makeRecord({ participation_level: "no_participation" }),
        makeRecord({ participation_level: "no_participation" }),
        makeRecord({ participation_level: "all_participated" }),
      ];
      expect(computeMeetingMetrics(records).no_participation_count).toBe(2);
    });

    it("no_participation_count is 0 when none match", () => {
      const records = [makeRecord()];
      expect(computeMeetingMetrics(records).no_participation_count).toBe(0);
    });
  });

  // ── Attendance rate (aggregate sum pattern) ───────────────────────────

  describe("attendance_rate", () => {
    it("returns 100 when all invited attend", () => {
      const records = [
        makeRecord({ children_invited: 5, children_attended: 5 }),
      ];
      expect(computeMeetingMetrics(records).attendance_rate).toBe(100);
    });

    it("returns 50 when half attend", () => {
      const records = [
        makeRecord({ children_invited: 10, children_attended: 5 }),
      ];
      expect(computeMeetingMetrics(records).attendance_rate).toBe(50);
    });

    it("uses aggregate sums across records, not per-record average", () => {
      // Record 1: 2/10 = 20%, Record 2: 8/10 = 80%
      // Per-record average = 50%, aggregate sum = 10/20 = 50%
      const records = [
        makeRecord({ children_invited: 10, children_attended: 2 }),
        makeRecord({ children_invited: 10, children_attended: 8 }),
      ];
      expect(computeMeetingMetrics(records).attendance_rate).toBe(50);
    });

    it("uses aggregate sums — not simple average of per-record rates", () => {
      // Record 1: 1/2 = 50%, Record 2: 9/10 = 90%
      // Per-record average = 70%, aggregate = 10/12 = 83.3%
      const records = [
        makeRecord({ children_invited: 2, children_attended: 1 }),
        makeRecord({ children_invited: 10, children_attended: 9 }),
      ];
      expect(computeMeetingMetrics(records).attendance_rate).toBe(rate(10, 12));
    });

    it("returns 0 when total invited is 0", () => {
      const records = [
        makeRecord({ children_invited: 0, children_attended: 0 }),
      ];
      expect(computeMeetingMetrics(records).attendance_rate).toBeNull();;
    });

    it("handles fractional attendance correctly with rounding", () => {
      // 1/3 = 0.33333... => Math.round(0.33333 * 1000) / 10 = 33.3
      const records = [
        makeRecord({ children_invited: 3, children_attended: 1 }),
      ];
      expect(computeMeetingMetrics(records).attendance_rate).toBe(rate(1, 3));
    });

    it("handles large aggregates correctly", () => {
      const records = Array.from({ length: 20 }, () =>
        makeRecord({ children_invited: 10, children_attended: 7 }),
      );
      // 140/200 = 70
      expect(computeMeetingMetrics(records).attendance_rate).toBe(70);
    });
  });

  // ── Boolean field rates (boolRate) ────────────────────────────────────

  describe("boolean field rates", () => {
    it("agenda_shared_rate is 100 when all true", () => {
      const records = [
        makeRecord({ agenda_shared_beforehand: true }),
        makeRecord({ agenda_shared_beforehand: true }),
      ];
      expect(computeMeetingMetrics(records).agenda_shared_rate).toBe(100);
    });

    it("agenda_shared_rate is 0 when all false", () => {
      const records = [
        makeRecord({ agenda_shared_beforehand: false }),
        makeRecord({ agenda_shared_beforehand: false }),
      ];
      expect(computeMeetingMetrics(records).agenda_shared_rate).toBe(0);
    });

    it("agenda_shared_rate is 50 when half true", () => {
      const records = [
        makeRecord({ agenda_shared_beforehand: true }),
        makeRecord({ agenda_shared_beforehand: false }),
      ];
      expect(computeMeetingMetrics(records).agenda_shared_rate).toBe(50);
    });

    it("children_set_agenda_rate is correct for mixed values", () => {
      const records = [
        makeRecord({ children_set_agenda: true }),
        makeRecord({ children_set_agenda: true }),
        makeRecord({ children_set_agenda: false }),
      ];
      expect(computeMeetingMetrics(records).children_set_agenda_rate).toBe(rate(2, 3));
    });

    it("minutes_recorded_rate is correct", () => {
      const records = [
        makeRecord({ minutes_recorded: false }),
        makeRecord({ minutes_recorded: false }),
        makeRecord({ minutes_recorded: true }),
      ];
      expect(computeMeetingMetrics(records).minutes_recorded_rate).toBe(rate(1, 3));
    });

    it("previous_actions_reviewed_rate with all true", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      expect(computeMeetingMetrics(records).previous_actions_reviewed_rate).toBe(100);
    });

    it("previous_actions_reviewed_rate with all false", () => {
      const records = [
        makeRecord({ actions_from_previous_reviewed: false }),
        makeRecord({ actions_from_previous_reviewed: false }),
      ];
      expect(computeMeetingMetrics(records).previous_actions_reviewed_rate).toBe(0);
    });

    it("child_chair_rate is correct for mixed values", () => {
      const records = [
        makeRecord({ child_chair: true }),
        makeRecord({ child_chair: false }),
        makeRecord({ child_chair: false }),
        makeRecord({ child_chair: false }),
      ];
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(25);
    });

    it("changes_implemented_rate for all false", () => {
      const records = [
        makeRecord({ changes_implemented: false }),
        makeRecord({ changes_implemented: false }),
      ];
      expect(computeMeetingMetrics(records).changes_implemented_rate).toBe(0);
    });

    it("children_feedback_positive_rate for mixed", () => {
      const records = [
        makeRecord({ children_feedback_positive: true }),
        makeRecord({ children_feedback_positive: false }),
      ];
      expect(computeMeetingMetrics(records).children_feedback_positive_rate).toBe(50);
    });

    it("boolRate uses rounding — 1 of 3 = 33.3", () => {
      const records = [
        makeRecord({ child_chair: true }),
        makeRecord({ child_chair: false }),
        makeRecord({ child_chair: false }),
      ];
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(rate(1, 3));
    });

    it("boolRate uses rounding — 2 of 3 = 66.7", () => {
      const records = [
        makeRecord({ child_chair: true }),
        makeRecord({ child_chair: true }),
        makeRecord({ child_chair: false }),
      ];
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(rate(2, 3));
    });
  });

  // ── Action outcome rates ──────────────────────────────────────────────

  describe("action outcome rates", () => {
    it("all_actions_completed_rate is 100 when all completed", () => {
      const records = [
        makeRecord({ action_outcome: "all_actions_completed" }),
        makeRecord({ action_outcome: "all_actions_completed" }),
      ];
      expect(computeMeetingMetrics(records).all_actions_completed_rate).toBe(100);
    });

    it("all_actions_completed_rate is 0 when none completed", () => {
      const records = [
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "some_completed" }),
      ];
      expect(computeMeetingMetrics(records).all_actions_completed_rate).toBe(0);
    });

    it("all_actions_completed_rate with mixed", () => {
      const records = [
        makeRecord({ action_outcome: "all_actions_completed" }),
        makeRecord({ action_outcome: "most_completed" }),
        makeRecord({ action_outcome: "all_actions_completed" }),
      ];
      expect(computeMeetingMetrics(records).all_actions_completed_rate).toBe(rate(2, 3));
    });

    it("none_completed_count is correct", () => {
      const records = [
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "all_actions_completed" }),
      ];
      expect(computeMeetingMetrics(records).none_completed_count).toBe(2);
    });

    it("none_completed_count is 0 when no records have none_completed", () => {
      const records = [makeRecord(), makeRecord()];
      expect(computeMeetingMetrics(records).none_completed_count).toBe(0);
    });

    it("no_actions_needed does not count as all_actions_completed", () => {
      const records = [
        makeRecord({ action_outcome: "no_actions_needed" }),
      ];
      expect(computeMeetingMetrics(records).all_actions_completed_rate).toBe(0);
    });
  });

  // ── Atmosphere rates ──────────────────────────────────────────────────

  describe("atmosphere rates", () => {
    it("very_positive_atmosphere_rate is 100 when all very_positive", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "very_positive" }),
        makeRecord({ meeting_atmosphere: "very_positive" }),
      ];
      expect(computeMeetingMetrics(records).very_positive_atmosphere_rate).toBe(100);
    });

    it("very_positive_atmosphere_rate is 0 when none very_positive", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "positive" }),
        makeRecord({ meeting_atmosphere: "neutral" }),
      ];
      expect(computeMeetingMetrics(records).very_positive_atmosphere_rate).toBe(0);
    });

    it("very_positive_atmosphere_rate for mixed", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "very_positive" }),
        makeRecord({ meeting_atmosphere: "positive" }),
        makeRecord({ meeting_atmosphere: "very_positive" }),
      ];
      expect(computeMeetingMetrics(records).very_positive_atmosphere_rate).toBe(rate(2, 3));
    });

    it("negative_atmosphere_count counts correctly", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "negative" }),
        makeRecord({ meeting_atmosphere: "negative" }),
        makeRecord({ meeting_atmosphere: "positive" }),
      ];
      expect(computeMeetingMetrics(records).negative_atmosphere_count).toBe(2);
    });

    it("negative_atmosphere_count is 0 when none negative", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "tense" }),
        makeRecord({ meeting_atmosphere: "neutral" }),
      ];
      expect(computeMeetingMetrics(records).negative_atmosphere_count).toBe(0);
    });

    it("tense does not count as negative", () => {
      const records = [makeRecord({ meeting_atmosphere: "tense" })];
      expect(computeMeetingMetrics(records).negative_atmosphere_count).toBe(0);
    });
  });

  // ── Meeting overdue ───────────────────────────────────────────────────

  describe("meeting_overdue_count", () => {
    it("counts overdue when next_meeting_date is in the past", () => {
      const records = [
        makeRecord({ next_meeting_date: daysAgo(3) }),
      ];
      expect(computeMeetingMetrics(records).meeting_overdue_count).toBe(1);
    });

    it("does not count when next_meeting_date is in the future", () => {
      const records = [
        makeRecord({ next_meeting_date: futureDateStr(10) }),
      ];
      expect(computeMeetingMetrics(records).meeting_overdue_count).toBe(0);
    });

    it("does not count when next_meeting_date is null", () => {
      const records = [makeRecord({ next_meeting_date: null })];
      expect(computeMeetingMetrics(records).meeting_overdue_count).toBe(0);
    });

    it("counts multiple overdue meetings", () => {
      const records = [
        makeRecord({ next_meeting_date: daysAgo(5) }),
        makeRecord({ next_meeting_date: daysAgo(10) }),
        makeRecord({ next_meeting_date: futureDateStr(5) }),
      ];
      expect(computeMeetingMetrics(records).meeting_overdue_count).toBe(2);
    });

    it("null next_meeting_date is not overdue", () => {
      const records = [makeRecord()]; // defaults to null
      expect(computeMeetingMetrics(records).meeting_overdue_count).toBe(0);
    });
  });

  // ── Breakdowns ────────────────────────────────────────────────────────

  describe("breakdown maps", () => {
    it("by_meeting_type aggregates multiple types", () => {
      const records = [
        makeRecord({ meeting_type: "house_meeting" }),
        makeRecord({ meeting_type: "house_meeting" }),
        makeRecord({ meeting_type: "childrens_council" }),
        makeRecord({ meeting_type: "celebration" }),
      ];
      const m = computeMeetingMetrics(records);
      expect(m.by_meeting_type).toEqual({
        house_meeting: 2,
        childrens_council: 1,
        celebration: 1,
      });
    });

    it("by_participation_level aggregates correctly", () => {
      const records = [
        makeRecord({ participation_level: "all_participated" }),
        makeRecord({ participation_level: "all_participated" }),
        makeRecord({ participation_level: "no_participation" }),
      ];
      const m = computeMeetingMetrics(records);
      expect(m.by_participation_level).toEqual({
        all_participated: 2,
        no_participation: 1,
      });
    });

    it("by_action_outcome aggregates correctly", () => {
      const records = [
        makeRecord({ action_outcome: "all_actions_completed" }),
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "none_completed" }),
      ];
      const m = computeMeetingMetrics(records);
      expect(m.by_action_outcome).toEqual({
        all_actions_completed: 1,
        none_completed: 2,
      });
    });

    it("by_meeting_atmosphere aggregates correctly", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "positive" }),
        makeRecord({ meeting_atmosphere: "positive" }),
        makeRecord({ meeting_atmosphere: "negative" }),
        makeRecord({ meeting_atmosphere: "very_positive" }),
      ];
      const m = computeMeetingMetrics(records);
      expect(m.by_meeting_atmosphere).toEqual({
        positive: 2,
        negative: 1,
        very_positive: 1,
      });
    });

    it("by_meeting_type only includes present types", () => {
      const records = [makeRecord({ meeting_type: "other" })];
      const m = computeMeetingMetrics(records);
      expect(Object.keys(m.by_meeting_type)).toEqual(["other"]);
    });

    it("by_participation_level only includes present levels", () => {
      const records = [makeRecord({ participation_level: "minimal_participation" })];
      const m = computeMeetingMetrics(records);
      expect(Object.keys(m.by_participation_level)).toEqual(["minimal_participation"]);
    });
  });

  // ── Mixed dataset ─────────────────────────────────────────────────────

  describe("mixed dataset", () => {
    const records = [
      makeRecord({
        meeting_type: "house_meeting",
        participation_level: "all_participated",
        action_outcome: "all_actions_completed",
        meeting_atmosphere: "very_positive",
        children_invited: 6,
        children_attended: 6,
        agenda_shared_beforehand: true,
        children_set_agenda: true,
        minutes_recorded: true,
        actions_from_previous_reviewed: true,
        child_chair: true,
        changes_implemented: true,
        children_feedback_positive: true,
      }),
      makeRecord({
        meeting_type: "childrens_council",
        participation_level: "most_participated",
        action_outcome: "most_completed",
        meeting_atmosphere: "positive",
        children_invited: 8,
        children_attended: 6,
        agenda_shared_beforehand: false,
        children_set_agenda: false,
        minutes_recorded: false,
        actions_from_previous_reviewed: false,
        child_chair: false,
        changes_implemented: false,
        children_feedback_positive: false,
      }),
      makeRecord({
        meeting_type: "menu_planning",
        participation_level: "no_participation",
        action_outcome: "none_completed",
        meeting_atmosphere: "negative",
        children_invited: 4,
        children_attended: 0,
        agenda_shared_beforehand: true,
        children_set_agenda: false,
        minutes_recorded: true,
        actions_from_previous_reviewed: true,
        child_chair: false,
        changes_implemented: false,
        children_feedback_positive: false,
      }),
    ];

    it("total_meetings = 3", () => {
      expect(computeMeetingMetrics(records).total_meetings).toBe(3);
    });

    it("house_meeting_count = 1", () => {
      expect(computeMeetingMetrics(records).house_meeting_count).toBe(1);
    });

    it("childrens_council_count = 1", () => {
      expect(computeMeetingMetrics(records).childrens_council_count).toBe(1);
    });

    it("menu_planning_count = 1", () => {
      expect(computeMeetingMetrics(records).menu_planning_count).toBe(1);
    });

    it("all_participated_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).all_participated_rate).toBe(rate(1, 3));
    });

    it("no_participation_count = 1", () => {
      expect(computeMeetingMetrics(records).no_participation_count).toBe(1);
    });

    it("attendance_rate is aggregate sum — 12/18", () => {
      // 6+6+0 = 12 attended, 6+8+4 = 18 invited
      expect(computeMeetingMetrics(records).attendance_rate).toBe(rate(12, 18));
    });

    it("agenda_shared_rate = 66.7 (2 of 3)", () => {
      expect(computeMeetingMetrics(records).agenda_shared_rate).toBe(rate(2, 3));
    });

    it("children_set_agenda_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).children_set_agenda_rate).toBe(rate(1, 3));
    });

    it("minutes_recorded_rate = 66.7 (2 of 3)", () => {
      expect(computeMeetingMetrics(records).minutes_recorded_rate).toBe(rate(2, 3));
    });

    it("previous_actions_reviewed_rate = 66.7 (2 of 3)", () => {
      expect(computeMeetingMetrics(records).previous_actions_reviewed_rate).toBe(rate(2, 3));
    });

    it("child_chair_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(rate(1, 3));
    });

    it("changes_implemented_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).changes_implemented_rate).toBe(rate(1, 3));
    });

    it("children_feedback_positive_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).children_feedback_positive_rate).toBe(rate(1, 3));
    });

    it("all_actions_completed_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).all_actions_completed_rate).toBe(rate(1, 3));
    });

    it("none_completed_count = 1", () => {
      expect(computeMeetingMetrics(records).none_completed_count).toBe(1);
    });

    it("very_positive_atmosphere_rate = 33.3 (1 of 3)", () => {
      expect(computeMeetingMetrics(records).very_positive_atmosphere_rate).toBe(rate(1, 3));
    });

    it("negative_atmosphere_count = 1", () => {
      expect(computeMeetingMetrics(records).negative_atmosphere_count).toBe(1);
    });
  });

  // ── Large dataset ─────────────────────────────────────────────────────

  describe("large dataset", () => {
    const records = Array.from({ length: 50 }, (_, i) =>
      makeRecord({
        meeting_type: i % 5 === 0 ? "childrens_council" : "house_meeting",
        participation_level: i % 10 === 0 ? "no_participation" : "all_participated",
        action_outcome: i % 7 === 0 ? "none_completed" : "all_actions_completed",
        meeting_atmosphere: i % 8 === 0 ? "negative" : "positive",
        children_invited: 10,
        children_attended: i % 4 === 0 ? 5 : 10,
        child_chair: i % 3 === 0,
      }),
    );

    it("total_meetings = 50", () => {
      expect(computeMeetingMetrics(records).total_meetings).toBe(50);
    });

    it("house_meeting_count is correct", () => {
      const expected = records.filter((r) => r.meeting_type === "house_meeting").length;
      expect(computeMeetingMetrics(records).house_meeting_count).toBe(expected);
    });

    it("childrens_council_count is correct", () => {
      const expected = records.filter((r) => r.meeting_type === "childrens_council").length;
      expect(computeMeetingMetrics(records).childrens_council_count).toBe(expected);
    });

    it("no_participation_count is correct", () => {
      const expected = records.filter((r) => r.participation_level === "no_participation").length;
      expect(computeMeetingMetrics(records).no_participation_count).toBe(expected);
    });

    it("attendance_rate uses aggregate sums", () => {
      const totalInvited = records.reduce((a, r) => a + r.children_invited, 0);
      const totalAttended = records.reduce((a, r) => a + r.children_attended, 0);
      expect(computeMeetingMetrics(records).attendance_rate).toBe(rate(totalAttended, totalInvited));
    });

    it("negative_atmosphere_count is correct", () => {
      const expected = records.filter((r) => r.meeting_atmosphere === "negative").length;
      expect(computeMeetingMetrics(records).negative_atmosphere_count).toBe(expected);
    });

    it("child_chair_rate matches expected", () => {
      const trueCount = records.filter((r) => r.child_chair === true).length;
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(rate(trueCount, 50));
    });

    it("by_meeting_type keys match all present types", () => {
      const m = computeMeetingMetrics(records);
      const presentTypes = new Set(records.map((r) => r.meeting_type));
      expect(new Set(Object.keys(m.by_meeting_type))).toEqual(presentTypes);
    });

    it("by_meeting_type values sum to total_meetings", () => {
      const m = computeMeetingMetrics(records);
      const sum = Object.values(m.by_meeting_type).reduce((a, b) => a + b, 0);
      expect(sum).toBe(50);
    });
  });

  // ── food_provided has no dedicated rate (not in boolRate list) ────────

  describe("food_provided field", () => {
    it("food_provided does not appear in metrics output keys", () => {
      const m = computeMeetingMetrics([makeRecord()]);
      expect("food_provided_rate" in m).toBe(false);
    });
  });

  // ── Edge: all booleans false ──────────────────────────────────────────

  describe("all booleans false", () => {
    const records = [
      makeRecord({
        agenda_shared_beforehand: false,
        children_set_agenda: false,
        minutes_recorded: false,
        actions_from_previous_reviewed: false,
        child_chair: false,
        changes_implemented: false,
        children_feedback_positive: false,
      }),
    ];

    it("agenda_shared_rate = 0", () => {
      expect(computeMeetingMetrics(records).agenda_shared_rate).toBe(0);
    });

    it("children_set_agenda_rate = 0", () => {
      expect(computeMeetingMetrics(records).children_set_agenda_rate).toBe(0);
    });

    it("minutes_recorded_rate = 0", () => {
      expect(computeMeetingMetrics(records).minutes_recorded_rate).toBe(0);
    });

    it("previous_actions_reviewed_rate = 0", () => {
      expect(computeMeetingMetrics(records).previous_actions_reviewed_rate).toBe(0);
    });

    it("child_chair_rate = 0", () => {
      expect(computeMeetingMetrics(records).child_chair_rate).toBe(0);
    });

    it("changes_implemented_rate = 0", () => {
      expect(computeMeetingMetrics(records).changes_implemented_rate).toBe(0);
    });

    it("children_feedback_positive_rate = 0", () => {
      expect(computeMeetingMetrics(records).children_feedback_positive_rate).toBe(0);
    });
  });

  // ── Edge: all booleans true ───────────────────────────────────────────

  describe("all booleans true", () => {
    const records = [
      makeRecord({
        agenda_shared_beforehand: true,
        children_set_agenda: true,
        minutes_recorded: true,
        actions_from_previous_reviewed: true,
        child_chair: true,
        changes_implemented: true,
        children_feedback_positive: true,
      }),
    ];

    it("all boolean rates = 100", () => {
      const m = computeMeetingMetrics(records);
      expect(m.agenda_shared_rate).toBe(100);
      expect(m.children_set_agenda_rate).toBe(100);
      expect(m.minutes_recorded_rate).toBe(100);
      expect(m.previous_actions_reviewed_rate).toBe(100);
      expect(m.child_chair_rate).toBe(100);
      expect(m.changes_implemented_rate).toBe(100);
      expect(m.children_feedback_positive_rate).toBe(100);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyMeetingAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyMeetingAlerts", () => {
  // ── Empty records ─────────────────────────────────────────────────────

  describe("empty records", () => {
    it("returns empty array for no records", () => {
      expect(identifyMeetingAlerts([])).toEqual([]);
    });

    it("returns array type", () => {
      expect(Array.isArray(identifyMeetingAlerts([]))).toBe(true);
    });
  });

  // ── No alerts when all is well ────────────────────────────────────────

  describe("no alerts when everything is good", () => {
    it("returns empty for a single well-formed record", () => {
      const records = [makeRecord()];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });

    it("returns empty for multiple healthy records", () => {
      const records = [makeRecord(), makeRecord(), makeRecord()];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });

    it("no alert for most_participated", () => {
      const records = [makeRecord({ participation_level: "most_participated" })];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });

    it("no alert for tense atmosphere (only negative triggers)", () => {
      const records = [makeRecord({ meeting_atmosphere: "tense" })];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });

    it("no alert for some_completed action outcome", () => {
      const records = [makeRecord({ action_outcome: "some_completed" })];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });

    it("no agenda alert when fewer than 3 records lack agenda", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
      ];
      // Only 2 — threshold is 3
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "children_not_setting_agenda")).toHaveLength(0);
    });

    it("no overdue alert when next_meeting_date is in the future", () => {
      const records = [makeRecord({ next_meeting_date: futureDateStr(10) })];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });

    it("no overdue alert when next_meeting_date is null", () => {
      const records = [makeRecord()];
      expect(identifyMeetingAlerts(records)).toHaveLength(0);
    });
  });

  // ── no_participation alert (critical, per-record) ─────────────────────

  describe("no_participation alert", () => {
    it("fires for a single no_participation record", () => {
      const records = [makeRecord({ participation_level: "no_participation" })];
      const alerts = identifyMeetingAlerts(records);
      const np = alerts.filter((a) => a.type === "no_participation");
      expect(np).toHaveLength(1);
    });

    it("has severity critical", () => {
      const records = [makeRecord({ participation_level: "no_participation" })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].severity).toBe("critical");
    });

    it("id matches the record id", () => {
      const r = makeRecord({ participation_level: "no_participation" });
      const alerts = identifyMeetingAlerts([r]);
      expect(alerts[0].id).toBe(r.id);
    });

    it("message includes meeting_type with underscores replaced by spaces", () => {
      const records = [
        makeRecord({
          meeting_type: "house_meeting",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("house meeting");
    });

    it("message includes meeting_date", () => {
      const date = daysAgo(2);
      const records = [
        makeRecord({
          meeting_date: date,
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain(date);
    });

    it("fires for each no_participation record individually", () => {
      const records = [
        makeRecord({ participation_level: "no_participation" }),
        makeRecord({ participation_level: "no_participation" }),
        makeRecord({ participation_level: "all_participated" }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const np = alerts.filter((a) => a.type === "no_participation");
      expect(np).toHaveLength(2);
    });

    it("replaces underscores in childrens_council", () => {
      const records = [
        makeRecord({
          meeting_type: "childrens_council",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("childrens council");
    });

    it("replaces underscores in menu_planning", () => {
      const records = [
        makeRecord({
          meeting_type: "menu_planning",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("menu planning");
    });

    it("does not fire for minimal_participation", () => {
      const records = [makeRecord({ participation_level: "minimal_participation" })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "no_participation")).toHaveLength(0);
    });
  });

  // ── negative_atmosphere alert (high, per-record) ──────────────────────

  describe("negative_atmosphere alert", () => {
    it("fires for a negative atmosphere record", () => {
      const records = [makeRecord({ meeting_atmosphere: "negative" })];
      const alerts = identifyMeetingAlerts(records);
      const neg = alerts.filter((a) => a.type === "negative_atmosphere");
      expect(neg).toHaveLength(1);
    });

    it("has severity high", () => {
      const records = [makeRecord({ meeting_atmosphere: "negative" })];
      const alerts = identifyMeetingAlerts(records);
      const neg = alerts.find((a) => a.type === "negative_atmosphere");
      expect(neg?.severity).toBe("high");
    });

    it("id matches the record id", () => {
      const r = makeRecord({ meeting_atmosphere: "negative" });
      const alerts = identifyMeetingAlerts([r]);
      const neg = alerts.find((a) => a.type === "negative_atmosphere");
      expect(neg?.id).toBe(r.id);
    });

    it("message includes meeting_type with spaces", () => {
      const records = [
        makeRecord({
          meeting_type: "activity_planning",
          meeting_atmosphere: "negative",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const neg = alerts.find((a) => a.type === "negative_atmosphere");
      expect(neg?.message).toContain("activity planning");
    });

    it("message includes meeting_date", () => {
      const date = daysAgo(3);
      const records = [
        makeRecord({
          meeting_date: date,
          meeting_atmosphere: "negative",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const neg = alerts.find((a) => a.type === "negative_atmosphere");
      expect(neg?.message).toContain(date);
    });

    it("fires for each negative record", () => {
      const records = [
        makeRecord({ meeting_atmosphere: "negative" }),
        makeRecord({ meeting_atmosphere: "negative" }),
        makeRecord({ meeting_atmosphere: "positive" }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "negative_atmosphere")).toHaveLength(2);
    });

    it("does not fire for tense atmosphere", () => {
      const records = [makeRecord({ meeting_atmosphere: "tense" })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "negative_atmosphere")).toHaveLength(0);
    });

    it("does not fire for neutral atmosphere", () => {
      const records = [makeRecord({ meeting_atmosphere: "neutral" })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "negative_atmosphere")).toHaveLength(0);
    });
  });

  // ── actions_not_completed alert (high, aggregate) ─────────────────────

  describe("actions_not_completed alert", () => {
    it("fires when 1 meeting has none_completed", () => {
      const records = [makeRecord({ action_outcome: "none_completed" })];
      const alerts = identifyMeetingAlerts(records);
      const anc = alerts.filter((a) => a.type === "actions_not_completed");
      expect(anc).toHaveLength(1);
    });

    it("has severity high", () => {
      const records = [makeRecord({ action_outcome: "none_completed" })];
      const alerts = identifyMeetingAlerts(records);
      const anc = alerts.find((a) => a.type === "actions_not_completed");
      expect(anc?.severity).toBe("high");
    });

    it("id is 'actions_not_completed'", () => {
      const records = [makeRecord({ action_outcome: "none_completed" })];
      const alerts = identifyMeetingAlerts(records);
      const anc = alerts.find((a) => a.type === "actions_not_completed");
      expect(anc?.id).toBe("actions_not_completed");
    });

    it("message uses singular 'meeting has' for count 1", () => {
      const records = [makeRecord({ action_outcome: "none_completed" })];
      const alerts = identifyMeetingAlerts(records);
      const anc = alerts.find((a) => a.type === "actions_not_completed");
      expect(anc?.message).toContain("1 meeting has");
    });

    it("message uses plural 'meetings have' for count 2", () => {
      const records = [
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "none_completed" }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const anc = alerts.find((a) => a.type === "actions_not_completed");
      expect(anc?.message).toContain("2 meetings have");
    });

    it("message uses plural 'meetings have' for count 5", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ action_outcome: "none_completed" }),
      );
      const alerts = identifyMeetingAlerts(records);
      const anc = alerts.find((a) => a.type === "actions_not_completed");
      expect(anc?.message).toContain("5 meetings have");
    });

    it("does not fire for some_completed", () => {
      const records = [makeRecord({ action_outcome: "some_completed" })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "actions_not_completed")).toHaveLength(0);
    });

    it("does not fire for most_completed", () => {
      const records = [makeRecord({ action_outcome: "most_completed" })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "actions_not_completed")).toHaveLength(0);
    });

    it("produces exactly one aggregate alert even with multiple none_completed", () => {
      const records = [
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "none_completed" }),
        makeRecord({ action_outcome: "none_completed" }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "actions_not_completed")).toHaveLength(1);
    });
  });

  // ── children_not_setting_agenda alert (medium, threshold >= 3) ────────

  describe("children_not_setting_agenda alert", () => {
    it("fires when exactly 3 records have children_set_agenda false", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const cna = alerts.filter((a) => a.type === "children_not_setting_agenda");
      expect(cna).toHaveLength(1);
    });

    it("has severity medium", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const cna = alerts.find((a) => a.type === "children_not_setting_agenda");
      expect(cna?.severity).toBe("medium");
    });

    it("id is 'children_not_setting_agenda'", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const cna = alerts.find((a) => a.type === "children_not_setting_agenda");
      expect(cna?.id).toBe("children_not_setting_agenda");
    });

    it("message includes count", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const cna = alerts.find((a) => a.type === "children_not_setting_agenda");
      expect(cna?.message).toContain("4 meetings");
    });

    it("does not fire when only 2 records have false", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: true }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "children_not_setting_agenda")).toHaveLength(0);
    });

    it("does not fire when only 1 record has false", () => {
      const records = [
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: true }),
        makeRecord({ children_set_agenda: true }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "children_not_setting_agenda")).toHaveLength(0);
    });

    it("fires when 5 records have false (above threshold)", () => {
      const records = Array.from({ length: 5 }, () =>
        makeRecord({ children_set_agenda: false }),
      );
      const alerts = identifyMeetingAlerts(records);
      const cna = alerts.filter((a) => a.type === "children_not_setting_agenda");
      expect(cna).toHaveLength(1);
    });

    it("produces exactly one aggregate alert", () => {
      const records = Array.from({ length: 10 }, () =>
        makeRecord({ children_set_agenda: false }),
      );
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "children_not_setting_agenda")).toHaveLength(1);
    });
  });

  // ── meeting_overdue alert (medium, threshold >= 1) ────────────────────

  describe("meeting_overdue alert", () => {
    it("fires when 1 meeting is overdue", () => {
      const records = [makeRecord({ next_meeting_date: daysAgo(5) })];
      const alerts = identifyMeetingAlerts(records);
      const mo = alerts.filter((a) => a.type === "meeting_overdue");
      expect(mo).toHaveLength(1);
    });

    it("has severity medium", () => {
      const records = [makeRecord({ next_meeting_date: daysAgo(5) })];
      const alerts = identifyMeetingAlerts(records);
      const mo = alerts.find((a) => a.type === "meeting_overdue");
      expect(mo?.severity).toBe("medium");
    });

    it("id is 'meeting_overdue'", () => {
      const records = [makeRecord({ next_meeting_date: daysAgo(5) })];
      const alerts = identifyMeetingAlerts(records);
      const mo = alerts.find((a) => a.type === "meeting_overdue");
      expect(mo?.id).toBe("meeting_overdue");
    });

    it("message uses singular 'meeting is' for count 1", () => {
      const records = [makeRecord({ next_meeting_date: daysAgo(5) })];
      const alerts = identifyMeetingAlerts(records);
      const mo = alerts.find((a) => a.type === "meeting_overdue");
      expect(mo?.message).toContain("1 children's meeting is");
    });

    it("message uses plural 'meetings are' for count 2", () => {
      const records = [
        makeRecord({ next_meeting_date: daysAgo(3) }),
        makeRecord({ next_meeting_date: daysAgo(7) }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const mo = alerts.find((a) => a.type === "meeting_overdue");
      expect(mo?.message).toContain("2 children's meetings are");
    });

    it("message uses plural 'meetings are' for count 4", () => {
      const records = Array.from({ length: 4 }, () =>
        makeRecord({ next_meeting_date: daysAgo(2) }),
      );
      const alerts = identifyMeetingAlerts(records);
      const mo = alerts.find((a) => a.type === "meeting_overdue");
      expect(mo?.message).toContain("4 children's meetings are");
    });

    it("does not fire when next_meeting_date is in the future", () => {
      const records = [makeRecord({ next_meeting_date: futureDateStr(10) })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "meeting_overdue")).toHaveLength(0);
    });

    it("does not fire when next_meeting_date is null", () => {
      const records = [makeRecord({ next_meeting_date: null })];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "meeting_overdue")).toHaveLength(0);
    });

    it("produces exactly one aggregate alert even with multiple overdue", () => {
      const records = [
        makeRecord({ next_meeting_date: daysAgo(2) }),
        makeRecord({ next_meeting_date: daysAgo(8) }),
        makeRecord({ next_meeting_date: daysAgo(15) }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "meeting_overdue")).toHaveLength(1);
    });
  });

  // ── Alert ordering ────────────────────────────────────────────────────

  describe("alert ordering", () => {
    it("no_participation alerts appear before negative_atmosphere alerts", () => {
      const records = [
        makeRecord({
          participation_level: "no_participation",
          meeting_atmosphere: "negative",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const npIdx = alerts.findIndex((a) => a.type === "no_participation");
      const naIdx = alerts.findIndex((a) => a.type === "negative_atmosphere");
      expect(npIdx).toBeLessThan(naIdx);
    });

    it("negative_atmosphere alerts appear before actions_not_completed", () => {
      const records = [
        makeRecord({
          meeting_atmosphere: "negative",
          action_outcome: "none_completed",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const naIdx = alerts.findIndex((a) => a.type === "negative_atmosphere");
      const ancIdx = alerts.findIndex((a) => a.type === "actions_not_completed");
      expect(naIdx).toBeLessThan(ancIdx);
    });

    it("actions_not_completed appears before children_not_setting_agenda", () => {
      const records = [
        makeRecord({ action_outcome: "none_completed", children_set_agenda: false }),
        makeRecord({ action_outcome: "none_completed", children_set_agenda: false }),
        makeRecord({ action_outcome: "none_completed", children_set_agenda: false }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const ancIdx = alerts.findIndex((a) => a.type === "actions_not_completed");
      const cnaIdx = alerts.findIndex((a) => a.type === "children_not_setting_agenda");
      expect(ancIdx).toBeLessThan(cnaIdx);
    });

    it("children_not_setting_agenda appears before meeting_overdue", () => {
      const records = [
        makeRecord({ children_set_agenda: false, next_meeting_date: daysAgo(5) }),
        makeRecord({ children_set_agenda: false, next_meeting_date: daysAgo(5) }),
        makeRecord({ children_set_agenda: false, next_meeting_date: daysAgo(5) }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const cnaIdx = alerts.findIndex((a) => a.type === "children_not_setting_agenda");
      const moIdx = alerts.findIndex((a) => a.type === "meeting_overdue");
      expect(cnaIdx).toBeLessThan(moIdx);
    });
  });

  // ── Combined alerts ───────────────────────────────────────────────────

  describe("combined alerts", () => {
    it("can produce all 5 alert types simultaneously", () => {
      const records = [
        makeRecord({
          participation_level: "no_participation",
          meeting_atmosphere: "negative",
          action_outcome: "none_completed",
          children_set_agenda: false,
          next_meeting_date: daysAgo(5),
        }),
        makeRecord({
          children_set_agenda: false,
          next_meeting_date: daysAgo(3),
        }),
        makeRecord({
          children_set_agenda: false,
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const types = alerts.map((a) => a.type);
      expect(types).toContain("no_participation");
      expect(types).toContain("negative_atmosphere");
      expect(types).toContain("actions_not_completed");
      expect(types).toContain("children_not_setting_agenda");
      expect(types).toContain("meeting_overdue");
    });

    it("multiple no_participation records generate multiple alerts", () => {
      const records = [
        makeRecord({ participation_level: "no_participation" }),
        makeRecord({ participation_level: "no_participation" }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts.filter((a) => a.type === "no_participation")).toHaveLength(2);
    });

    it("single record can trigger multiple alert types", () => {
      const records = [
        makeRecord({
          participation_level: "no_participation",
          meeting_atmosphere: "negative",
          action_outcome: "none_completed",
          children_set_agenda: false,
          next_meeting_date: daysAgo(5),
        }),
        makeRecord({ children_set_agenda: false }),
        makeRecord({ children_set_agenda: false }),
      ];
      const alerts = identifyMeetingAlerts(records);
      // At least: no_participation (1), negative_atmosphere (1),
      // actions_not_completed (1), children_not_setting_agenda (1),
      // meeting_overdue (1)
      expect(alerts.length).toBeGreaterThanOrEqual(5);
    });
  });

  // ── Edge: all meeting types underscore replacement ────────────────────

  describe("underscore replacement in alert messages", () => {
    it("rules_review becomes 'rules review'", () => {
      const records = [
        makeRecord({
          meeting_type: "rules_review",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("rules review");
    });

    it("complaints_forum becomes 'complaints forum'", () => {
      const records = [
        makeRecord({
          meeting_type: "complaints_forum",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("complaints forum");
    });

    it("welcome_meeting becomes 'welcome meeting'", () => {
      const records = [
        makeRecord({
          meeting_type: "welcome_meeting",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("welcome meeting");
    });

    it("goodbye_meeting becomes 'goodbye meeting'", () => {
      const records = [
        makeRecord({
          meeting_type: "goodbye_meeting",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("goodbye meeting");
    });

    it("celebration has no underscores so stays as 'celebration'", () => {
      const records = [
        makeRecord({
          meeting_type: "celebration",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("celebration");
    });

    it("other has no underscores so stays as 'other'", () => {
      const records = [
        makeRecord({
          meeting_type: "other",
          participation_level: "no_participation",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      expect(alerts[0].message).toContain("other");
    });

    it("activity_planning becomes 'activity planning' in negative_atmosphere alert", () => {
      const records = [
        makeRecord({
          meeting_type: "activity_planning",
          meeting_atmosphere: "negative",
        }),
      ];
      const alerts = identifyMeetingAlerts(records);
      const neg = alerts.find((a) => a.type === "negative_atmosphere");
      expect(neg?.message).toContain("activity planning");
    });
  });
});
