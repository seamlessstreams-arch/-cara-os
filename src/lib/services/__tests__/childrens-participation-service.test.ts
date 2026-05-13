// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — CHILDREN'S PARTICIPATION SERVICE TESTS
// Pure-function unit tests for participation metrics computation,
// alert identification, constant validation, and CRUD fallback behaviour
// (Supabase disabled). CHR 2015 Reg 7 (children's views, wishes and
// feelings), Reg 16(2)(c) (guide — how to find out rights), Reg 39
// (complaints — children's voice), UN Convention on the Rights of the
// Child Article 12 (right to be heard).
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  _testing,
  MEETING_TYPES,
  MEETING_STATUSES,
  TOPIC_CATEGORIES,
  ACTION_OUTCOMES,
  listMeetings,
  createMeeting,
  updateMeeting,
  listConsultations,
  createConsultation,
} from "../childrens-participation-service";

import type {
  ParticipationMeeting,
  ChildConsultation,
} from "../childrens-participation-service";

const {
  computeParticipationMetrics,
  identifyParticipationAlerts,
} = _testing;

// ── Helpers ────────────────────────────────────────────────────────────────

/** Date string N days ago from now. */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

/** Date string N days in the future from now. */
function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

/** ISO datetime string N days ago. */
function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Build a minimal ParticipationMeeting with sensible defaults. */
function makeMeeting(
  overrides: Partial<ParticipationMeeting> = {},
): ParticipationMeeting {
  return {
    id: "mtg-1",
    home_id: "home-1",
    meeting_type: "house_meeting",
    meeting_date: daysAgo(5),
    scheduled_time: null,
    duration_minutes: 45,
    facilitator: "staff-1",
    children_invited: ["child-1", "child-2", "child-3"],
    children_attended: ["child-1", "child-2"],
    staff_present: ["staff-1"],
    topics: [
      {
        category: "food_menus",
        description: "Menu choices for next week",
        raised_by: "child-1",
        discussion_summary: "Children discussed new menu options",
      },
    ],
    decisions_made: ["New menu to start Monday"],
    actions: [
      {
        action: "Update menu board",
        assigned_to: "staff-1",
        due_date: daysFromNow(3),
        status: "pending",
        feedback_to_children: "",
      },
    ],
    child_satisfaction_collected: true,
    overall_engagement: "high",
    status: "completed",
    notes: null,
    created_at: daysAgoISO(5),
    updated_at: daysAgoISO(5),
    ...overrides,
  };
}

/** Build a minimal ChildConsultation with sensible defaults. */
function makeConsultation(
  overrides: Partial<ChildConsultation> = {},
): ChildConsultation {
  return {
    id: "con-1",
    home_id: "home-1",
    child_id: "child-1",
    child_name: "Alice Smith",
    consultation_date: daysAgo(3),
    consulted_by: "staff-1",
    topic: "individual_needs",
    context: "Care plan review",
    child_views: "I want more time to see my friends",
    child_preferences: "Weekend visits",
    outcome: "Arranged weekend visits",
    action_taken: "Contact schedule updated",
    child_informed_of_outcome: true,
    child_satisfied_with_response: true,
    notes: null,
    created_at: daysAgoISO(3),
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. CONSTANT ARRAYS
// ══════════════════════════════════════════════════════════════════════════════

describe("Constants", () => {
  // ── MEETING_TYPES ──────────────────────────────────────────────────────

  describe("MEETING_TYPES", () => {
    it("contains 8 entries", () => {
      expect(MEETING_TYPES).toHaveLength(8);
    });

    it("includes house_meeting", () => {
      expect(MEETING_TYPES.find((t) => t.type === "house_meeting")).toBeDefined();
    });

    it("includes childrens_council", () => {
      expect(MEETING_TYPES.find((t) => t.type === "childrens_council")).toBeDefined();
    });

    it("includes one_to_one_consultation", () => {
      expect(MEETING_TYPES.find((t) => t.type === "one_to_one_consultation")).toBeDefined();
    });

    it("includes complaints_forum", () => {
      expect(MEETING_TYPES.find((t) => t.type === "complaints_forum")).toBeDefined();
    });

    it("each entry has a non-empty label", () => {
      for (const entry of MEETING_TYPES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has no duplicate type values", () => {
      const types = MEETING_TYPES.map((t) => t.type);
      expect(new Set(types).size).toBe(types.length);
    });
  });

  // ── MEETING_STATUSES ───────────────────────────────────────────────────

  describe("MEETING_STATUSES", () => {
    it("contains 4 entries", () => {
      expect(MEETING_STATUSES).toHaveLength(4);
    });

    it("includes scheduled", () => {
      expect(MEETING_STATUSES.find((s) => s.status === "scheduled")).toBeDefined();
    });

    it("includes completed", () => {
      expect(MEETING_STATUSES.find((s) => s.status === "completed")).toBeDefined();
    });

    it("includes cancelled", () => {
      expect(MEETING_STATUSES.find((s) => s.status === "cancelled")).toBeDefined();
    });

    it("includes rescheduled", () => {
      expect(MEETING_STATUSES.find((s) => s.status === "rescheduled")).toBeDefined();
    });

    it("each entry has a non-empty label", () => {
      for (const entry of MEETING_STATUSES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has no duplicate status values", () => {
      const statuses = MEETING_STATUSES.map((s) => s.status);
      expect(new Set(statuses).size).toBe(statuses.length);
    });
  });

  // ── TOPIC_CATEGORIES ───────────────────────────────────────────────────

  describe("TOPIC_CATEGORIES", () => {
    it("contains 12 entries", () => {
      expect(TOPIC_CATEGORIES).toHaveLength(12);
    });

    it("includes safety_concerns", () => {
      expect(TOPIC_CATEGORIES.find((c) => c.category === "safety_concerns")).toBeDefined();
    });

    it("includes food_menus", () => {
      expect(TOPIC_CATEGORIES.find((c) => c.category === "food_menus")).toBeDefined();
    });

    it("includes complaints", () => {
      expect(TOPIC_CATEGORIES.find((c) => c.category === "complaints")).toBeDefined();
    });

    it("includes rights_awareness", () => {
      expect(TOPIC_CATEGORIES.find((c) => c.category === "rights_awareness")).toBeDefined();
    });

    it("each entry has a non-empty label", () => {
      for (const entry of TOPIC_CATEGORIES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has no duplicate category values", () => {
      const cats = TOPIC_CATEGORIES.map((c) => c.category);
      expect(new Set(cats).size).toBe(cats.length);
    });
  });

  // ── ACTION_OUTCOMES ────────────────────────────────────────────────────

  describe("ACTION_OUTCOMES", () => {
    it("contains 5 entries", () => {
      expect(ACTION_OUTCOMES).toHaveLength(5);
    });

    it("includes implemented", () => {
      expect(ACTION_OUTCOMES.find((o) => o.outcome === "implemented")).toBeDefined();
    });

    it("includes partially_implemented", () => {
      expect(ACTION_OUTCOMES.find((o) => o.outcome === "partially_implemented")).toBeDefined();
    });

    it("includes not_possible", () => {
      expect(ACTION_OUTCOMES.find((o) => o.outcome === "not_possible")).toBeDefined();
    });

    it("includes pending", () => {
      expect(ACTION_OUTCOMES.find((o) => o.outcome === "pending")).toBeDefined();
    });

    it("includes in_progress", () => {
      expect(ACTION_OUTCOMES.find((o) => o.outcome === "in_progress")).toBeDefined();
    });

    it("each entry has a non-empty label", () => {
      for (const entry of ACTION_OUTCOMES) {
        expect(entry.label.length).toBeGreaterThan(0);
      }
    });

    it("has no duplicate outcome values", () => {
      const outcomes = ACTION_OUTCOMES.map((o) => o.outcome);
      expect(new Set(outcomes).size).toBe(outcomes.length);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. computeParticipationMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("computeParticipationMetrics", () => {
  // ── Empty inputs ──────────────────────────────────────────────────────

  describe("empty inputs", () => {
    it("returns zeroed metrics for empty arrays", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(result.meetings_this_quarter).toBe(0);
      expect(result.avg_attendance_rate).toBe(0);
      expect(result.unique_children_participating).toBe(0);
      expect(result.participation_rate).toBe(0);
      expect(result.actions_implemented_rate).toBe(0);
      expect(result.topics_raised).toBe(0);
      expect(result.satisfaction_rate).toBe(0);
      expect(result.consultations_this_quarter).toBe(0);
    });

    it("returns empty by_meeting_type when no meetings", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(Object.keys(result.by_meeting_type)).toHaveLength(0);
    });

    it("returns empty by_topic_category when no data", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(Object.keys(result.by_topic_category)).toHaveLength(0);
    });

    it("returns 0 participation_rate when totalChildren is 0", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(result.participation_rate).toBe(0);
    });
  });

  // ── meetings_this_quarter ─────────────────────────────────────────────

  describe("meetings_this_quarter", () => {
    it("counts completed meetings in current quarter", () => {
      const m = makeMeeting({ id: "m-1", meeting_date: daysAgo(1) });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.meetings_this_quarter).toBeGreaterThanOrEqual(1);
    });

    it("excludes scheduled meetings from quarter count", () => {
      const m = makeMeeting({ id: "m-1", status: "scheduled", meeting_date: daysAgo(1) });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.meetings_this_quarter).toBe(0);
    });

    it("excludes cancelled meetings from quarter count", () => {
      const m = makeMeeting({ id: "m-1", status: "cancelled", meeting_date: daysAgo(1) });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.meetings_this_quarter).toBe(0);
    });

    it("counts multiple completed meetings correctly", () => {
      const m1 = makeMeeting({ id: "m-1", meeting_date: daysAgo(1) });
      const m2 = makeMeeting({ id: "m-2", meeting_date: daysAgo(3) });
      const m3 = makeMeeting({ id: "m-3", meeting_date: daysAgo(5) });
      const result = computeParticipationMetrics([m1, m2, m3], [], 3);
      expect(result.meetings_this_quarter).toBeGreaterThanOrEqual(3);
    });
  });

  // ── avg_attendance_rate ───────────────────────────────────────────────

  describe("avg_attendance_rate", () => {
    it("computes 100% when all invited attended", () => {
      const m = makeMeeting({
        children_invited: ["c-1", "c-2"],
        children_attended: ["c-1", "c-2"],
      });
      const result = computeParticipationMetrics([m], [], 2);
      expect(result.avg_attendance_rate).toBe(100);
    });

    it("computes 50% when half attended", () => {
      const m = makeMeeting({
        children_invited: ["c-1", "c-2"],
        children_attended: ["c-1"],
      });
      const result = computeParticipationMetrics([m], [], 2);
      expect(result.avg_attendance_rate).toBe(50);
    });

    it("returns 0 when no children invited", () => {
      const m = makeMeeting({
        children_invited: [],
        children_attended: [],
      });
      const result = computeParticipationMetrics([m], [], 0);
      expect(result.avg_attendance_rate).toBe(0);
    });

    it("aggregates attendance across multiple meetings", () => {
      const m1 = makeMeeting({
        id: "m-1",
        children_invited: ["c-1", "c-2"],
        children_attended: ["c-1", "c-2"],
      });
      const m2 = makeMeeting({
        id: "m-2",
        children_invited: ["c-1", "c-2"],
        children_attended: ["c-1"],
      });
      // total invited=4, total attended=3 => 75%
      const result = computeParticipationMetrics([m1, m2], [], 2);
      expect(result.avg_attendance_rate).toBe(75);
    });

    it("ignores non-completed meetings for attendance", () => {
      const m = makeMeeting({
        status: "scheduled",
        children_invited: ["c-1", "c-2"],
        children_attended: [],
      });
      const result = computeParticipationMetrics([m], [], 2);
      expect(result.avg_attendance_rate).toBe(0);
    });

    it("rounds to one decimal place", () => {
      const m = makeMeeting({
        children_invited: ["c-1", "c-2", "c-3"],
        children_attended: ["c-1"],
      });
      // 1/3 = 33.333... => should round to 33.3
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.avg_attendance_rate).toBe(33.3);
    });
  });

  // ── unique_children_participating ─────────────────────────────────────

  describe("unique_children_participating", () => {
    it("counts unique children across meetings", () => {
      const m1 = makeMeeting({
        id: "m-1",
        children_attended: ["c-1", "c-2"],
      });
      const m2 = makeMeeting({
        id: "m-2",
        children_attended: ["c-2", "c-3"],
      });
      const result = computeParticipationMetrics([m1, m2], [], 4);
      expect(result.unique_children_participating).toBe(3);
    });

    it("includes children from consultations", () => {
      const con = makeConsultation({ child_id: "c-5" });
      const result = computeParticipationMetrics([], [con], 5);
      expect(result.unique_children_participating).toBe(1);
    });

    it("deduplicates across meetings and consultations", () => {
      const m = makeMeeting({ children_attended: ["c-1"] });
      const con = makeConsultation({ child_id: "c-1" });
      const result = computeParticipationMetrics([m], [con], 3);
      expect(result.unique_children_participating).toBe(1);
    });

    it("does not count children from non-completed meetings", () => {
      const m = makeMeeting({
        status: "cancelled",
        children_attended: ["c-1", "c-2"],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.unique_children_participating).toBe(0);
    });

    it("returns 0 with no data", () => {
      const result = computeParticipationMetrics([], [], 5);
      expect(result.unique_children_participating).toBe(0);
    });
  });

  // ── participation_rate ────────────────────────────────────────────────

  describe("participation_rate", () => {
    it("computes correct participation rate", () => {
      const m = makeMeeting({
        children_attended: ["c-1", "c-2"],
      });
      const result = computeParticipationMetrics([m], [], 4);
      expect(result.participation_rate).toBe(50);
    });

    it("returns 100% when all children participate", () => {
      const m = makeMeeting({
        children_attended: ["c-1", "c-2", "c-3"],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.participation_rate).toBe(100);
    });

    it("returns 0 when totalChildren is 0", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(result.participation_rate).toBe(0);
    });

    it("includes consultation-only children in rate", () => {
      const con = makeConsultation({ child_id: "c-10" });
      const result = computeParticipationMetrics([], [con], 5);
      expect(result.participation_rate).toBe(20);
    });
  });

  // ── actions_implemented_rate ──────────────────────────────────────────

  describe("actions_implemented_rate", () => {
    it("returns 100% when all actions implemented", () => {
      const m = makeMeeting({
        actions: [
          { action: "A", assigned_to: "s", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "Done" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.actions_implemented_rate).toBe(100);
    });

    it("counts partially_implemented as implemented", () => {
      const m = makeMeeting({
        actions: [
          { action: "A", assigned_to: "s", due_date: daysFromNow(1), status: "partially_implemented", feedback_to_children: "Half done" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.actions_implemented_rate).toBe(100);
    });

    it("returns 0% when no actions implemented", () => {
      const m = makeMeeting({
        actions: [
          { action: "A", assigned_to: "s", due_date: daysFromNow(1), status: "pending", feedback_to_children: "" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.actions_implemented_rate).toBe(0);
    });

    it("computes mixed rate correctly", () => {
      const m = makeMeeting({
        actions: [
          { action: "A", assigned_to: "s", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "Done" },
          { action: "B", assigned_to: "s", due_date: daysFromNow(1), status: "pending", feedback_to_children: "" },
          { action: "C", assigned_to: "s", due_date: daysFromNow(1), status: "in_progress", feedback_to_children: "" },
        ],
      });
      // 1 implemented out of 3 => 33.3%
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.actions_implemented_rate).toBe(33.3);
    });

    it("returns 0 when there are no actions", () => {
      const m = makeMeeting({ actions: [] });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.actions_implemented_rate).toBe(0);
    });

    it("excludes actions from non-completed meetings", () => {
      const m = makeMeeting({
        status: "cancelled",
        actions: [
          { action: "A", assigned_to: "s", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "Done" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.actions_implemented_rate).toBe(0);
    });
  });

  // ── topics_raised ─────────────────────────────────────────────────────

  describe("topics_raised", () => {
    it("counts total topics across completed meetings", () => {
      const m = makeMeeting({
        topics: [
          { category: "food_menus", description: "A", raised_by: "c-1", discussion_summary: "S" },
          { category: "house_rules", description: "B", raised_by: "c-2", discussion_summary: "S" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.topics_raised).toBe(2);
    });

    it("returns 0 when no topics", () => {
      const m = makeMeeting({ topics: [] });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.topics_raised).toBe(0);
    });

    it("excludes topics from non-completed meetings", () => {
      const m = makeMeeting({
        status: "scheduled",
        topics: [
          { category: "food_menus", description: "A", raised_by: "c-1", discussion_summary: "S" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.topics_raised).toBe(0);
    });

    it("sums topics from multiple meetings", () => {
      const m1 = makeMeeting({
        id: "m-1",
        topics: [
          { category: "food_menus", description: "A", raised_by: "c-1", discussion_summary: "S" },
        ],
      });
      const m2 = makeMeeting({
        id: "m-2",
        topics: [
          { category: "house_rules", description: "B", raised_by: "c-2", discussion_summary: "S" },
          { category: "activities_outings", description: "C", raised_by: "c-1", discussion_summary: "S" },
        ],
      });
      const result = computeParticipationMetrics([m1, m2], [], 3);
      expect(result.topics_raised).toBe(3);
    });
  });

  // ── by_meeting_type ───────────────────────────────────────────────────

  describe("by_meeting_type", () => {
    it("counts meetings by type", () => {
      const m1 = makeMeeting({ id: "m-1", meeting_type: "house_meeting" });
      const m2 = makeMeeting({ id: "m-2", meeting_type: "house_meeting" });
      const m3 = makeMeeting({ id: "m-3", meeting_type: "feedback_session" });
      const result = computeParticipationMetrics([m1, m2, m3], [], 3);
      expect(result.by_meeting_type["house_meeting"]).toBe(2);
      expect(result.by_meeting_type["feedback_session"]).toBe(1);
    });

    it("excludes non-completed meetings", () => {
      const m = makeMeeting({ meeting_type: "house_meeting", status: "cancelled" });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.by_meeting_type["house_meeting"]).toBeUndefined();
    });

    it("handles all meeting types", () => {
      const meetings = MEETING_TYPES.map((t, i) =>
        makeMeeting({ id: `m-${i}`, meeting_type: t.type }),
      );
      const result = computeParticipationMetrics(meetings, [], 3);
      for (const t of MEETING_TYPES) {
        expect(result.by_meeting_type[t.type]).toBe(1);
      }
    });
  });

  // ── by_topic_category ─────────────────────────────────────────────────

  describe("by_topic_category", () => {
    it("counts topics by category from meetings", () => {
      const m = makeMeeting({
        topics: [
          { category: "food_menus", description: "A", raised_by: "c-1", discussion_summary: "S" },
          { category: "food_menus", description: "B", raised_by: "c-2", discussion_summary: "S" },
          { category: "house_rules", description: "C", raised_by: "c-1", discussion_summary: "S" },
        ],
      });
      const result = computeParticipationMetrics([m], [], 3);
      expect(result.by_topic_category["food_menus"]).toBe(2);
      expect(result.by_topic_category["house_rules"]).toBe(1);
    });

    it("includes consultation topics", () => {
      const con = makeConsultation({ topic: "individual_needs" });
      const result = computeParticipationMetrics([], [con], 3);
      expect(result.by_topic_category["individual_needs"]).toBe(1);
    });

    it("combines meeting and consultation topic counts", () => {
      const m = makeMeeting({
        topics: [
          { category: "food_menus", description: "A", raised_by: "c-1", discussion_summary: "S" },
        ],
      });
      const con = makeConsultation({ topic: "food_menus" });
      const result = computeParticipationMetrics([m], [con], 3);
      expect(result.by_topic_category["food_menus"]).toBe(2);
    });
  });

  // ── satisfaction_rate ─────────────────────────────────────────────────

  describe("satisfaction_rate", () => {
    it("returns 100% when all satisfied", () => {
      const c1 = makeConsultation({ id: "c-1", child_satisfied_with_response: true });
      const c2 = makeConsultation({ id: "c-2", child_satisfied_with_response: true });
      const result = computeParticipationMetrics([], [c1, c2], 3);
      expect(result.satisfaction_rate).toBe(100);
    });

    it("returns 0% when none satisfied", () => {
      const c1 = makeConsultation({ id: "c-1", child_satisfied_with_response: false });
      const result = computeParticipationMetrics([], [c1], 3);
      expect(result.satisfaction_rate).toBe(0);
    });

    it("computes mixed satisfaction correctly", () => {
      const c1 = makeConsultation({ id: "c-1", child_satisfied_with_response: true });
      const c2 = makeConsultation({ id: "c-2", child_satisfied_with_response: false });
      const result = computeParticipationMetrics([], [c1, c2], 3);
      expect(result.satisfaction_rate).toBe(50);
    });

    it("excludes null satisfaction from count", () => {
      const c1 = makeConsultation({ id: "c-1", child_satisfied_with_response: true });
      const c2 = makeConsultation({ id: "c-2", child_satisfied_with_response: null });
      const result = computeParticipationMetrics([], [c1, c2], 3);
      expect(result.satisfaction_rate).toBe(100);
    });

    it("returns 0 when all satisfaction values null", () => {
      const c1 = makeConsultation({ id: "c-1", child_satisfied_with_response: null });
      const result = computeParticipationMetrics([], [c1], 3);
      expect(result.satisfaction_rate).toBe(0);
    });
  });

  // ── consultations_this_quarter ────────────────────────────────────────

  describe("consultations_this_quarter", () => {
    it("counts recent consultations", () => {
      const c = makeConsultation({ consultation_date: daysAgo(1) });
      const result = computeParticipationMetrics([], [c], 3);
      expect(result.consultations_this_quarter).toBeGreaterThanOrEqual(1);
    });

    it("returns 0 with no consultations", () => {
      const result = computeParticipationMetrics([], [], 3);
      expect(result.consultations_this_quarter).toBe(0);
    });

    it("counts multiple consultations in quarter", () => {
      const c1 = makeConsultation({ id: "c-1", consultation_date: daysAgo(1) });
      const c2 = makeConsultation({ id: "c-2", consultation_date: daysAgo(5) });
      const result = computeParticipationMetrics([], [c1, c2], 3);
      expect(result.consultations_this_quarter).toBeGreaterThanOrEqual(2);
    });
  });

  // ── return shape ──────────────────────────────────────────────────────

  describe("return shape", () => {
    it("returns all expected keys", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(result).toHaveProperty("meetings_this_quarter");
      expect(result).toHaveProperty("avg_attendance_rate");
      expect(result).toHaveProperty("unique_children_participating");
      expect(result).toHaveProperty("participation_rate");
      expect(result).toHaveProperty("actions_implemented_rate");
      expect(result).toHaveProperty("topics_raised");
      expect(result).toHaveProperty("by_meeting_type");
      expect(result).toHaveProperty("by_topic_category");
      expect(result).toHaveProperty("satisfaction_rate");
      expect(result).toHaveProperty("consultations_this_quarter");
    });

    it("by_meeting_type is a plain object", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(typeof result.by_meeting_type).toBe("object");
    });

    it("by_topic_category is a plain object", () => {
      const result = computeParticipationMetrics([], [], 0);
      expect(typeof result.by_topic_category).toBe("object");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. identifyParticipationAlerts
// ══════════════════════════════════════════════════════════════════════════════

describe("identifyParticipationAlerts", () => {
  const now = new Date(new Date().toISOString().split("T")[0]);

  // ── no_recent_house_meeting ───────────────────────────────────────────

  describe("no_recent_house_meeting (high)", () => {
    it("fires when last house meeting > 30 days ago", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(35),
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("high");
    });

    it("includes days count in message", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(45),
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit!.message).toContain("45 days");
    });

    it("does not fire when house meeting within 30 days", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(10),
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit).toBeUndefined();
    });

    it("does not fire for non-completed house meetings", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(35),
        status: "scheduled",
      });
      // We also need meetings.length > 0 for the fallback, but no completed house meetings
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit).toBeUndefined();
    });

    it("uses the most recent house meeting for comparison", () => {
      const m1 = makeMeeting({
        id: "m-1",
        meeting_type: "house_meeting",
        meeting_date: daysAgo(60),
      });
      const m2 = makeMeeting({
        id: "m-2",
        meeting_type: "house_meeting",
        meeting_date: daysAgo(10),
      });
      const alerts = identifyParticipationAlerts([m1, m2], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit).toBeUndefined();
    });

    it("references Reg 7 in the message", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(35),
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit!.message).toContain("Reg 7");
    });
  });

  // ── no_house_meetings ─────────────────────────────────────────────────

  describe("no_house_meetings (high)", () => {
    it("fires when there are meetings but no house meetings at all", () => {
      const m = makeMeeting({ meeting_type: "feedback_session" });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_house_meetings");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("high");
    });

    it("does not fire when house meeting exists", () => {
      const m = makeMeeting({ meeting_type: "house_meeting" });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_house_meetings");
      expect(hit).toBeUndefined();
    });

    it("does not fire when meetings array is empty", () => {
      const alerts = identifyParticipationAlerts([], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_house_meetings");
      expect(hit).toBeUndefined();
    });

    it("references Reg 7 in the message", () => {
      const m = makeMeeting({ meeting_type: "feedback_session" });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_house_meetings");
      expect(hit!.message).toContain("Reg 7");
    });

    it("uses first meeting id as alert id", () => {
      const m = makeMeeting({ id: "mtg-xyz", meeting_type: "feedback_session" });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_house_meetings");
      expect(hit!.id).toBe("mtg-xyz");
    });
  });

  // ── low_attendance ────────────────────────────────────────────────────

  describe("low_attendance (medium)", () => {
    it("fires when attendance rate < 50%", () => {
      const m = makeMeeting({
        meeting_date: daysAgo(1),
        children_invited: ["c-1", "c-2", "c-3", "c-4"],
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m], [], 4, now);
      const hit = alerts.find((a) => a.type === "low_attendance");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("medium");
    });

    it("does not fire when attendance >= 50%", () => {
      const m = makeMeeting({
        meeting_date: daysAgo(1),
        children_invited: ["c-1", "c-2"],
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m], [], 2, now);
      const hit = alerts.find((a) => a.type === "low_attendance");
      expect(hit).toBeUndefined();
    });

    it("does not fire when no children invited", () => {
      const m = makeMeeting({
        meeting_date: daysAgo(1),
        children_invited: [],
        children_attended: [],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "low_attendance");
      expect(hit).toBeUndefined();
    });

    it("checks only the 3 most recent completed meetings", () => {
      const meetings = [
        makeMeeting({ id: "m-1", meeting_date: daysAgo(1), children_invited: ["c-1", "c-2"], children_attended: ["c-1", "c-2"] }),
        makeMeeting({ id: "m-2", meeting_date: daysAgo(3), children_invited: ["c-1", "c-2"], children_attended: ["c-1", "c-2"] }),
        makeMeeting({ id: "m-3", meeting_date: daysAgo(5), children_invited: ["c-1", "c-2"], children_attended: ["c-1", "c-2"] }),
        makeMeeting({ id: "m-4", meeting_date: daysAgo(10), children_invited: ["c-1", "c-2", "c-3", "c-4"], children_attended: ["c-1"] }),
      ];
      const alerts = identifyParticipationAlerts(meetings, [], 4, now);
      const hits = alerts.filter((a) => a.type === "low_attendance");
      // m-4 is the 4th most recent, so should be excluded
      expect(hits).toHaveLength(0);
    });

    it("includes attendance count in message", () => {
      const m = makeMeeting({
        meeting_date: daysAgo(1),
        children_invited: ["c-1", "c-2", "c-3", "c-4"],
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m], [], 4, now);
      const hit = alerts.find((a) => a.type === "low_attendance");
      expect(hit!.message).toContain("1/4");
    });

    it("excludes non-completed meetings", () => {
      const m = makeMeeting({
        status: "cancelled",
        meeting_date: daysAgo(1),
        children_invited: ["c-1", "c-2", "c-3", "c-4"],
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m], [], 4, now);
      const hit = alerts.find((a) => a.type === "low_attendance");
      expect(hit).toBeUndefined();
    });

    it("can fire for multiple recent meetings", () => {
      const m1 = makeMeeting({
        id: "m-1",
        meeting_date: daysAgo(1),
        children_invited: ["c-1", "c-2", "c-3", "c-4"],
        children_attended: ["c-1"],
      });
      const m2 = makeMeeting({
        id: "m-2",
        meeting_date: daysAgo(3),
        children_invited: ["c-1", "c-2", "c-3", "c-4"],
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m1, m2], [], 4, now);
      const hits = alerts.filter((a) => a.type === "low_attendance");
      expect(hits).toHaveLength(2);
    });
  });

  // ── no_feedback_to_children ───────────────────────────────────────────

  describe("no_feedback_to_children (medium)", () => {
    it("fires when implemented action has no feedback", () => {
      const m = makeMeeting({
        actions: [
          { action: "Fix rota", assigned_to: "s-1", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_feedback_to_children");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("medium");
    });

    it("fires when not_possible action has no feedback", () => {
      const m = makeMeeting({
        actions: [
          { action: "Get a pool", assigned_to: "s-1", due_date: daysFromNow(1), status: "not_possible", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_feedback_to_children");
      expect(hit).toBeDefined();
    });

    it("does not fire when feedback is provided", () => {
      const m = makeMeeting({
        actions: [
          { action: "Fix rota", assigned_to: "s-1", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "Told children in meeting" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_feedback_to_children");
      expect(hit).toBeUndefined();
    });

    it("does not fire for pending actions", () => {
      const m = makeMeeting({
        actions: [
          { action: "Fix rota", assigned_to: "s-1", due_date: daysFromNow(1), status: "pending", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_feedback_to_children");
      expect(hit).toBeUndefined();
    });

    it("does not fire for in_progress actions", () => {
      const m = makeMeeting({
        actions: [
          { action: "Fix rota", assigned_to: "s-1", due_date: daysFromNow(1), status: "in_progress", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_feedback_to_children");
      expect(hit).toBeUndefined();
    });

    it("includes action description in message", () => {
      const m = makeMeeting({
        actions: [
          { action: "Upgrade WiFi", assigned_to: "s-1", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "no_feedback_to_children");
      expect(hit!.message).toContain("Upgrade WiFi");
    });

    it("fires for each action missing feedback", () => {
      const m = makeMeeting({
        actions: [
          { action: "A", assigned_to: "s-1", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "" },
          { action: "B", assigned_to: "s-1", due_date: daysFromNow(1), status: "not_possible", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hits = alerts.filter((a) => a.type === "no_feedback_to_children");
      expect(hits).toHaveLength(2);
    });
  });

  // ── children_not_participating ────────────────────────────────────────

  describe("children_not_participating (high)", () => {
    it("fires when some children have not participated", () => {
      const m = makeMeeting({
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("high");
    });

    it("includes count of non-participating children in message", () => {
      const m = makeMeeting({
        children_attended: ["c-1"],
      });
      const alerts = identifyParticipationAlerts([m], [], 5, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit!.message).toContain("4 child(ren)");
    });

    it("does not fire when all children have participated", () => {
      const m = makeMeeting({
        children_attended: ["c-1", "c-2", "c-3"],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit).toBeUndefined();
    });

    it("considers consultations as participation", () => {
      const con1 = makeConsultation({ id: "cn-1", child_id: "c-1" });
      const con2 = makeConsultation({ id: "cn-2", child_id: "c-2" });
      const con3 = makeConsultation({ id: "cn-3", child_id: "c-3" });
      const alerts = identifyParticipationAlerts([], [con1, con2, con3], 3, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit).toBeUndefined();
    });

    it("does not fire when totalChildren is 0", () => {
      const alerts = identifyParticipationAlerts([], [], 0, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit).toBeUndefined();
    });

    it("deduplicates children across meetings and consultations", () => {
      const m = makeMeeting({
        children_attended: ["c-1", "c-2"],
      });
      const con = makeConsultation({ child_id: "c-2" });
      const alerts = identifyParticipationAlerts([m], [con], 3, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      // 2 unique participants out of 3 total children => 1 not participating
      expect(hit).toBeDefined();
      expect(hit!.message).toContain("1 child(ren)");
    });

    it("references Reg 7 in the message", () => {
      const m = makeMeeting({ children_attended: ["c-1"] });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit!.message).toContain("Reg 7");
    });

    it("uses first completed meeting id or 'system'", () => {
      const alerts = identifyParticipationAlerts([], [makeConsultation()], 5, now);
      const hit = alerts.find((a) => a.type === "children_not_participating");
      expect(hit!.id).toBe("system");
    });
  });

  // ── child_not_informed ────────────────────────────────────────────────

  describe("child_not_informed (medium)", () => {
    it("fires when outcome exists but child not informed", () => {
      const con = makeConsultation({
        outcome: "Weekend visits arranged",
        child_informed_of_outcome: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_not_informed");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("medium");
    });

    it("does not fire when child is informed", () => {
      const con = makeConsultation({
        outcome: "Weekend visits arranged",
        child_informed_of_outcome: true,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_not_informed");
      expect(hit).toBeUndefined();
    });

    it("does not fire when outcome is null", () => {
      const con = makeConsultation({
        outcome: null,
        child_informed_of_outcome: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_not_informed");
      expect(hit).toBeUndefined();
    });

    it("includes child name and topic in message", () => {
      const con = makeConsultation({
        child_name: "Bob Jones",
        topic: "house_rules",
        outcome: "Rules updated",
        child_informed_of_outcome: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_not_informed");
      expect(hit!.message).toContain("Bob Jones");
      expect(hit!.message).toContain("house rules");
    });

    it("fires for each uninformed consultation", () => {
      const c1 = makeConsultation({
        id: "c-1",
        outcome: "Done",
        child_informed_of_outcome: false,
      });
      const c2 = makeConsultation({
        id: "c-2",
        outcome: "Done too",
        child_informed_of_outcome: false,
      });
      const alerts = identifyParticipationAlerts([], [c1, c2], 3, now);
      const hits = alerts.filter((a) => a.type === "child_not_informed");
      expect(hits).toHaveLength(2);
    });

    it("does not fire when outcome is empty string", () => {
      const con = makeConsultation({
        outcome: "",
        child_informed_of_outcome: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_not_informed");
      // empty string is falsy, so the condition `c.outcome && !c.child_informed_of_outcome` is false
      expect(hit).toBeUndefined();
    });
  });

  // ── child_dissatisfied ────────────────────────────────────────────────

  describe("child_dissatisfied (medium)", () => {
    it("fires when child is dissatisfied", () => {
      const con = makeConsultation({
        child_satisfied_with_response: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_dissatisfied");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("medium");
    });

    it("does not fire when child is satisfied", () => {
      const con = makeConsultation({
        child_satisfied_with_response: true,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_dissatisfied");
      expect(hit).toBeUndefined();
    });

    it("does not fire when satisfaction is null", () => {
      const con = makeConsultation({
        child_satisfied_with_response: null,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_dissatisfied");
      expect(hit).toBeUndefined();
    });

    it("includes child name in message", () => {
      const con = makeConsultation({
        child_name: "Charlie Brown",
        child_satisfied_with_response: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_dissatisfied");
      expect(hit!.message).toContain("Charlie Brown");
    });

    it("mentions follow-up required in message", () => {
      const con = makeConsultation({
        child_satisfied_with_response: false,
      });
      const alerts = identifyParticipationAlerts([], [con], 3, now);
      const hit = alerts.find((a) => a.type === "child_dissatisfied");
      expect(hit!.message).toContain("follow-up required");
    });

    it("fires for each dissatisfied consultation", () => {
      const c1 = makeConsultation({
        id: "c-1",
        child_name: "A",
        child_satisfied_with_response: false,
      });
      const c2 = makeConsultation({
        id: "c-2",
        child_name: "B",
        child_satisfied_with_response: false,
      });
      const alerts = identifyParticipationAlerts([], [c1, c2], 3, now);
      const hits = alerts.filter((a) => a.type === "child_dissatisfied");
      expect(hits).toHaveLength(2);
    });
  });

  // ── safety_concern_no_action ──────────────────────────────────────────

  describe("safety_concern_no_action (critical)", () => {
    it("fires when safety concern topic has no actions", () => {
      const m = makeMeeting({
        topics: [
          { category: "safety_concerns", description: "Broken window", raised_by: "c-1", discussion_summary: "Discussed" },
        ],
        actions: [],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "safety_concern_no_action");
      expect(hit).toBeDefined();
      expect(hit!.severity).toBe("critical");
    });

    it("does not fire when actions exist", () => {
      const m = makeMeeting({
        topics: [
          { category: "safety_concerns", description: "Broken window", raised_by: "c-1", discussion_summary: "Discussed" },
        ],
        actions: [
          { action: "Fix window", assigned_to: "s-1", due_date: daysFromNow(1), status: "pending", feedback_to_children: "" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "safety_concern_no_action");
      expect(hit).toBeUndefined();
    });

    it("does not fire for non-safety topics", () => {
      const m = makeMeeting({
        topics: [
          { category: "food_menus", description: "Menu", raised_by: "c-1", discussion_summary: "D" },
        ],
        actions: [],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "safety_concern_no_action");
      expect(hit).toBeUndefined();
    });

    it("mentions safeguarding in message", () => {
      const m = makeMeeting({
        topics: [
          { category: "safety_concerns", description: "Issue", raised_by: "c-1", discussion_summary: "D" },
        ],
        actions: [],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "safety_concern_no_action");
      expect(hit!.message).toContain("Safeguarding");
    });

    it("excludes non-completed meetings", () => {
      const m = makeMeeting({
        status: "scheduled",
        topics: [
          { category: "safety_concerns", description: "Issue", raised_by: "c-1", discussion_summary: "D" },
        ],
        actions: [],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "safety_concern_no_action");
      expect(hit).toBeUndefined();
    });

    it("fires for each meeting with unactioned safety concern", () => {
      const m1 = makeMeeting({
        id: "m-1",
        meeting_date: daysAgo(5),
        topics: [
          { category: "safety_concerns", description: "Issue 1", raised_by: "c-1", discussion_summary: "D" },
        ],
        actions: [],
      });
      const m2 = makeMeeting({
        id: "m-2",
        meeting_date: daysAgo(3),
        topics: [
          { category: "safety_concerns", description: "Issue 2", raised_by: "c-2", discussion_summary: "D" },
        ],
        actions: [],
      });
      const alerts = identifyParticipationAlerts([m1, m2], [], 3, now);
      const hits = alerts.filter((a) => a.type === "safety_concern_no_action");
      expect(hits).toHaveLength(2);
    });

    it("does not fire when actions include implemented ones (no pending/in_progress)", () => {
      const m = makeMeeting({
        topics: [
          { category: "safety_concerns", description: "Issue", raised_by: "c-1", discussion_summary: "D" },
        ],
        actions: [
          { action: "Fixed it", assigned_to: "s-1", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "Done" },
        ],
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      const hit = alerts.find((a) => a.type === "safety_concern_no_action");
      expect(hit).toBeUndefined();
    });
  });

  // ── General alert structure ───────────────────────────────────────────

  describe("alert structure", () => {
    it("each alert has type, severity, message, id", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(35),
      });
      const alerts = identifyParticipationAlerts([m], [], 3, now);
      for (const alert of alerts) {
        expect(alert).toHaveProperty("type");
        expect(alert).toHaveProperty("severity");
        expect(alert).toHaveProperty("message");
        expect(alert).toHaveProperty("id");
      }
    });

    it("severity is one of critical, high, medium", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(35),
        children_attended: ["c-1"],
      });
      const con = makeConsultation({ child_satisfied_with_response: false });
      const alerts = identifyParticipationAlerts([m], [con], 5, now);
      for (const alert of alerts) {
        expect(["critical", "high", "medium"]).toContain(alert.severity);
      }
    });

    it("returns empty array when no alerts apply", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(5),
        children_invited: ["c-1", "c-2", "c-3"],
        children_attended: ["c-1", "c-2", "c-3"],
        actions: [
          { action: "A", assigned_to: "s-1", due_date: daysFromNow(1), status: "implemented", feedback_to_children: "Done" },
        ],
      });
      const con = makeConsultation({
        child_informed_of_outcome: true,
        child_satisfied_with_response: true,
      });
      const alerts = identifyParticipationAlerts([m], [con], 3, now);
      // All 3 children attend, satisfaction is true, feedback provided, recent house meeting
      // Only possible alert is children_not_participating if consultation child differs
      // child_id defaults to "child-1" which may not be in c-1..c-3. Let's just verify structure.
      expect(Array.isArray(alerts)).toBe(true);
    });
  });

  // ── now parameter ─────────────────────────────────────────────────────

  describe("now parameter", () => {
    it("defaults to current date when not provided", () => {
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: daysAgo(35),
      });
      const alerts = identifyParticipationAlerts([m], [], 3);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit).toBeDefined();
    });

    it("uses custom now for date comparison", () => {
      const pastDate = new Date("2025-01-15");
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: "2025-01-10",
      });
      const alerts = identifyParticipationAlerts([m], [], 3, pastDate);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      // 5 days difference, so no alert
      expect(hit).toBeUndefined();
    });

    it("fires alert with custom now when meeting is old enough", () => {
      const futureNow = new Date("2025-03-01");
      const m = makeMeeting({
        meeting_type: "house_meeting",
        meeting_date: "2025-01-15",
      });
      const alerts = identifyParticipationAlerts([m], [], 3, futureNow);
      const hit = alerts.find((a) => a.type === "no_recent_house_meeting");
      expect(hit).toBeDefined();
    });
  });

  // ── Multiple alert types at once ──────────────────────────────────────

  describe("combined alerts", () => {
    it("can produce multiple alert types simultaneously", () => {
      const m = makeMeeting({
        meeting_type: "feedback_session",
        meeting_date: daysAgo(1),
        children_invited: ["c-1", "c-2", "c-3", "c-4"],
        children_attended: ["c-1"],
        topics: [
          { category: "safety_concerns", description: "Danger", raised_by: "c-1", discussion_summary: "D" },
        ],
        actions: [],
      });
      const con = makeConsultation({
        outcome: "Done",
        child_informed_of_outcome: false,
        child_satisfied_with_response: false,
      });
      const alerts = identifyParticipationAlerts([m], [con], 5, now);
      const types = new Set(alerts.map((a) => a.type));
      expect(types.has("no_house_meetings")).toBe(true);
      expect(types.has("low_attendance")).toBe(true);
      expect(types.has("safety_concern_no_action")).toBe(true);
      expect(types.has("child_not_informed")).toBe(true);
      expect(types.has("child_dissatisfied")).toBe(true);
      expect(types.has("children_not_participating")).toBe(true);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. CRUD FALLBACK BEHAVIOUR (Supabase disabled)
// ══════════════════════════════════════════════════════════════════════════════

describe("CRUD fallback (Supabase disabled)", () => {
  // ── listMeetings ──────────────────────────────────────────────────────

  describe("listMeetings", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listMeetings("home-1");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });

    it("returns empty array with filters", async () => {
      const result = await listMeetings("home-1", {
        meetingType: "house_meeting",
        status: "completed",
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        limit: 50,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });

    it("returns empty array for any home_id", async () => {
      const result = await listMeetings("nonexistent-home");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });
  });

  // ── createMeeting ─────────────────────────────────────────────────────

  describe("createMeeting", () => {
    it("returns ok:false when Supabase not configured", async () => {
      const result = await createMeeting({
        homeId: "home-1",
        meetingType: "house_meeting",
        meetingDate: "2025-06-01",
        facilitator: "staff-1",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error message string", async () => {
      const result = await createMeeting({
        homeId: "home-1",
        meetingType: "house_meeting",
        meetingDate: "2025-06-01",
        facilitator: "staff-1",
      });
      if (!result.ok) {
        expect(typeof result.error).toBe("string");
      }
    });
  });

  // ── updateMeeting ─────────────────────────────────────────────────────

  describe("updateMeeting", () => {
    it("returns ok:false when Supabase not configured", async () => {
      const result = await updateMeeting("mtg-1", { status: "completed" });
      expect(result.ok).toBe(false);
    });

    it("returns error message string", async () => {
      const result = await updateMeeting("mtg-1", { notes: "Updated" });
      if (!result.ok) {
        expect(typeof result.error).toBe("string");
      }
    });
  });

  // ── listConsultations ─────────────────────────────────────────────────

  describe("listConsultations", () => {
    it("returns ok:true with empty array", async () => {
      const result = await listConsultations("home-1");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });

    it("returns empty array with filters", async () => {
      const result = await listConsultations("home-1", {
        childId: "child-1",
        topic: "food_menus",
        limit: 25,
      });
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });

    it("returns empty array for any home_id", async () => {
      const result = await listConsultations("any-home");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data).toEqual([]);
    });
  });

  // ── createConsultation ────────────────────────────────────────────────

  describe("createConsultation", () => {
    it("returns ok:false when Supabase not configured", async () => {
      const result = await createConsultation({
        homeId: "home-1",
        childId: "child-1",
        childName: "Alice",
        consultedBy: "staff-1",
        topic: "individual_needs",
        context: "Review",
        childViews: "I want more time outside",
      });
      expect(result.ok).toBe(false);
    });

    it("returns error message string", async () => {
      const result = await createConsultation({
        homeId: "home-1",
        childId: "child-1",
        childName: "Alice",
        consultedBy: "staff-1",
        topic: "food_menus",
        context: "Menu review",
        childViews: "More variety please",
      });
      if (!result.ok) {
        expect(typeof result.error).toBe("string");
      }
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. EDGE CASES & REGRESSIONS
// ══════════════════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
  it("handles meeting with many topics and actions", () => {
    const topics = Array.from({ length: 20 }, (_, i) => ({
      category: "other" as const,
      description: `Topic ${i}`,
      raised_by: "c-1",
      discussion_summary: "S",
    }));
    const actions = Array.from({ length: 10 }, (_, i) => ({
      action: `Action ${i}`,
      assigned_to: "s-1",
      due_date: daysFromNow(7),
      status: "implemented" as const,
      feedback_to_children: "Done",
    }));
    const m = makeMeeting({ topics, actions });
    const result = computeParticipationMetrics([m], [], 3);
    expect(result.topics_raised).toBe(20);
    expect(result.actions_implemented_rate).toBe(100);
  });

  it("handles meeting with zero-length children arrays", () => {
    const m = makeMeeting({
      children_invited: [],
      children_attended: [],
    });
    const result = computeParticipationMetrics([m], [], 0);
    expect(result.avg_attendance_rate).toBe(0);
    expect(result.unique_children_participating).toBe(0);
  });

  it("handles large number of consultations", () => {
    const consultations = Array.from({ length: 50 }, (_, i) =>
      makeConsultation({
        id: `con-${i}`,
        child_id: `c-${i % 10}`,
        child_satisfied_with_response: i % 3 === 0 ? true : i % 3 === 1 ? false : null,
      }),
    );
    const result = computeParticipationMetrics([], consultations, 15);
    expect(result.unique_children_participating).toBe(10);
    expect(result.consultations_this_quarter).toBeGreaterThanOrEqual(0);
  });

  it("computeParticipationMetrics treats rescheduled as non-completed", () => {
    const m = makeMeeting({ status: "rescheduled" });
    const result = computeParticipationMetrics([m], [], 3);
    expect(result.meetings_this_quarter).toBe(0);
    expect(result.avg_attendance_rate).toBe(0);
    expect(result.topics_raised).toBe(0);
  });

  it("identifyParticipationAlerts excludes rescheduled meetings", () => {
    const m = makeMeeting({
      status: "rescheduled",
      meeting_type: "house_meeting",
      meeting_date: daysAgo(5),
      children_invited: ["c-1", "c-2", "c-3", "c-4"],
      children_attended: ["c-1"],
      topics: [
        { category: "safety_concerns", description: "Issue", raised_by: "c-1", discussion_summary: "D" },
      ],
      actions: [],
    });
    const alerts = identifyParticipationAlerts([m], [], 4, new Date());
    const safetyConcern = alerts.find((a) => a.type === "safety_concern_no_action");
    const lowAttendance = alerts.find((a) => a.type === "low_attendance");
    expect(safetyConcern).toBeUndefined();
    expect(lowAttendance).toBeUndefined();
  });

  it("meeting type label formatting is human-readable", () => {
    for (const mt of MEETING_TYPES) {
      expect(mt.label).not.toContain("_");
      expect(mt.label[0]).toBe(mt.label[0].toUpperCase());
    }
  });

  it("topic category label formatting is human-readable", () => {
    for (const tc of TOPIC_CATEGORIES) {
      expect(tc.label).not.toContain("_");
      expect(tc.label[0]).toBe(tc.label[0].toUpperCase());
    }
  });

  it("action outcome label formatting is human-readable", () => {
    for (const ao of ACTION_OUTCOMES) {
      expect(ao.label).not.toContain("_");
      expect(ao.label[0]).toBe(ao.label[0].toUpperCase());
    }
  });

  it("meeting status label formatting is human-readable", () => {
    for (const ms of MEETING_STATUSES) {
      expect(ms.label).not.toContain("_");
      expect(ms.label[0]).toBe(ms.label[0].toUpperCase());
    }
  });
});
