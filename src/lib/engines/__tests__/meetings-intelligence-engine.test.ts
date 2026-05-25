// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — MEETINGS & CHILDREN'S VOICE INTELLIGENCE ENGINE TESTS
// Comprehensive test suite for house meetings and participation analysis.
// Reg 7, Reg 16, SCCIF.
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeMeetingsIntelligence,
  type HouseMeetingInput,
  type ChildRef,
  type StaffRef,
} from "../meetings-intelligence-engine";

const TODAY = "2026-05-25";

// ── Factories ───────────────────────────────────────────────────────────────

const CHILDREN: ChildRef[] = [
  { id: "yp_alex", name: "Alex" },
  { id: "yp_jordan", name: "Jordan" },
  { id: "yp_casey", name: "Casey" },
];

const STAFF: StaffRef[] = [
  { id: "staff_darren", name: "Darren" },
  { id: "staff_anna", name: "Anna" },
  { id: "staff_edward", name: "Edward" },
];

let _id = 0;
function makeMeeting(overrides: Partial<HouseMeetingInput> = {}): HouseMeetingInput {
  _id++;
  return {
    id: `hm_test_${_id}`,
    date: "2026-05-18",
    meeting_type: "regular",
    chair_person: "staff_darren",
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    children_absent: [],
    staff_present: ["staff_darren", "staff_anna"],
    child_feedback: ["Good meeting"],
    actions_from_previous: [
      { action: "Test action", owner: "staff_darren", completed: true },
    ],
    new_actions: [
      { action: "New test action", owner: "staff_anna", due_date: "2026-05-22" },
    ],
    duration: 30,
    ...overrides,
  };
}

function run(meetings: HouseMeetingInput[], opts?: { children?: ChildRef[]; staff?: StaffRef[] }) {
  return computeMeetingsIntelligence({
    meetings,
    children: opts?.children ?? CHILDREN,
    staff: opts?.staff ?? STAFF,
    today: TODAY,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Meetings Intelligence Engine", () => {

  describe("empty state", () => {
    it("returns safe defaults when no meetings provided", () => {
      const result = run([]);
      expect(result.overview.total_meetings).toBe(0);
      expect(result.overview.avg_attendance_rate).toBe(0);
      expect(result.overview.children_never_attended).toBe(3);
      expect(result.type_breakdown).toHaveLength(0);
      expect(result.child_participation).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview calculations", () => {
    it("counts total meetings", () => {
      const result = run([makeMeeting(), makeMeeting()]);
      expect(result.overview.total_meetings).toBe(2);
    });

    it("counts meetings in last 30 days", () => {
      const result = run([
        makeMeeting({ date: "2026-05-18" }),
        makeMeeting({ date: "2026-05-01" }),
        makeMeeting({ date: "2026-04-20" }),
      ]);
      expect(result.overview.meetings_last_30_days).toBe(2);
    });

    it("calculates average attendance rate", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"] }),
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ]);
      // (2+1) / (3+3) = 3/6 = 50%
      expect(result.overview.avg_attendance_rate).toBe(50);
    });

    it("counts total actions and completed", () => {
      const result = run([
        makeMeeting({
          actions_from_previous: [
            { action: "A", owner: "x", completed: true },
            { action: "B", owner: "x", completed: false },
          ],
        }),
        makeMeeting({
          actions_from_previous: [
            { action: "C", owner: "x", completed: true },
          ],
        }),
      ]);
      expect(result.overview.total_actions).toBe(3);
      expect(result.overview.actions_completed).toBe(2);
      expect(result.overview.action_completion_rate).toBe(67);
    });

    it("counts overdue new actions (due_date < today)", () => {
      const result = run([
        makeMeeting({
          new_actions: [
            { action: "A", owner: "x", due_date: "2026-05-20" },
            { action: "B", owner: "x", due_date: "2026-05-30" },
          ],
        }),
      ]);
      expect(result.overview.actions_overdue).toBe(1);
    });

    it("calculates average duration", () => {
      const result = run([
        makeMeeting({ duration: 30 }),
        makeMeeting({ duration: 40 }),
      ]);
      expect(result.overview.avg_duration_minutes).toBe(35);
    });

    it("counts children who never attended", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan"] }),
      ]);
      expect(result.overview.children_never_attended).toBe(2); // jordan (absent but never present) + casey
    });
  });

  describe("type breakdown", () => {
    it("groups meetings by type with counts", () => {
      const result = run([
        makeMeeting({ meeting_type: "regular" }),
        makeMeeting({ meeting_type: "regular" }),
        makeMeeting({ meeting_type: "special" }),
      ]);
      expect(result.type_breakdown).toHaveLength(2);
      expect(result.type_breakdown[0].meeting_type).toBe("regular");
      expect(result.type_breakdown[0].count).toBe(2);
    });

    it("provides human-readable labels", () => {
      const result = run([makeMeeting({ meeting_type: "emergency" })]);
      expect(result.type_breakdown[0].type_label).toBe("Emergency");
    });
  });

  describe("child participation profiles", () => {
    it("tracks attendance per child", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"] }),
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ]);
      const alex = result.child_participation.find((p) => p.child_id === "yp_alex")!;
      expect(alex.meetings_attended).toBe(2);
      expect(alex.meetings_absent).toBe(0);
      expect(alex.attendance_rate).toBe(100);
    });

    it("calculates attendance rate correctly", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_jordan"], children_absent: [] }),
        makeMeeting({ children_present: [], children_absent: ["yp_jordan"] }),
      ]);
      const jordan = result.child_participation.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.attendance_rate).toBe(50);
    });

    it("sorts by meetings attended descending", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex", "yp_casey"], children_absent: ["yp_jordan"] }),
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ]);
      expect(result.child_participation[0].child_id).toBe("yp_alex");
    });

    it("tracks feedback given (meetings with feedback where child present)", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], child_feedback: ["Great!"] }),
        makeMeeting({ children_present: ["yp_alex"], child_feedback: [] }),
      ]);
      const alex = result.child_participation.find((p) => p.child_id === "yp_alex")!;
      expect(alex.feedback_given).toBe(1);
    });
  });

  describe("risk flags", () => {
    it("flags never_attended for children who never attended", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], children_absent: [] }),
      ]);
      const casey = result.child_participation.find((p) => p.child_id === "yp_casey")!;
      expect(casey.risk_flags).toContain("never_attended");
    });

    it("flags low_attendance for <50% rate", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_jordan"], children_absent: [] }),
        makeMeeting({ children_present: [], children_absent: ["yp_jordan"] }),
        makeMeeting({ children_present: [], children_absent: ["yp_jordan"] }),
      ]);
      const jordan = result.child_participation.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.risk_flags).toContain("low_attendance");
    });

    it("flags no_feedback when child never in meetings with feedback", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan"], child_feedback: ["Good"] }),
      ]);
      const jordan = result.child_participation.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.risk_flags).toContain("no_feedback");
    });
  });

  describe("alerts", () => {
    it("generates high alert for children who never attended", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], children_absent: [] }),
      ]);
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high).toHaveLength(1);
      expect(high[0].type).toBe("never_attended");
      expect(high[0].message).toContain("Jordan");
      expect(high[0].message).toContain("Casey");
    });

    it("generates medium alert for overdue actions", () => {
      const result = run([
        makeMeeting({ new_actions: [{ action: "A", owner: "x", due_date: "2026-05-20" }] }),
      ]);
      const medium = result.alerts.filter((a) => a.type === "overdue_actions");
      expect(medium).toHaveLength(1);
    });

    it("generates medium alert for low completion rate (<70%)", () => {
      const result = run([
        makeMeeting({
          actions_from_previous: [
            { action: "A", owner: "x", completed: true },
            { action: "B", owner: "x", completed: false },
            { action: "C", owner: "x", completed: false },
            { action: "D", owner: "x", completed: false },
          ],
        }),
      ]);
      const medium = result.alerts.filter((a) => a.type === "low_completion");
      expect(medium).toHaveLength(1);
    });

    it("generates low alert for no meeting in last 14 days", () => {
      const result = run([
        makeMeeting({ date: "2026-05-01" }),
      ]);
      const low = result.alerts.filter((a) => a.type === "no_recent_meeting");
      expect(low).toHaveLength(1);
    });

    it("does not generate no_recent_meeting when meeting within 14 days", () => {
      const result = run([
        makeMeeting({ date: "2026-05-18" }),
      ]);
      const low = result.alerts.filter((a) => a.type === "no_recent_meeting");
      expect(low).toHaveLength(0);
    });
  });

  describe("ARIA insights", () => {
    it("generates warning for children who never attended", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], children_absent: [] }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("Reg 7"))).toBe(true);
    });

    it("generates warning for low attendance rate (<70%)", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
        makeMeeting({ children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("attendance rate"))).toBe(true);
    });

    it("generates warning for >=3 overdue actions", () => {
      const result = run([
        makeMeeting({
          new_actions: [
            { action: "A", owner: "x", due_date: "2026-05-10" },
            { action: "B", owner: "x", due_date: "2026-05-12" },
            { action: "C", owner: "x", due_date: "2026-05-14" },
          ],
        }),
      ]);
      const warnings = result.insights.filter((i) => i.severity === "warning");
      expect(warnings.some((w) => w.text.includes("3 meeting actions overdue"))).toBe(true);
    });

    it("generates positive insight for high attendance (>=80%)", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex", "yp_jordan", "yp_casey"], children_absent: [] }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("100%") && p.text.includes("Reg 16"))).toBe(true);
    });

    it("generates positive insight when all children attended", () => {
      const result = run([
        makeMeeting({ children_present: ["yp_alex", "yp_jordan", "yp_casey"], children_absent: [] }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 children") && p.text.includes("Reg 7"))).toBe(true);
    });

    it("generates positive insight for high action completion (>=80%)", () => {
      const result = run([
        makeMeeting({
          actions_from_previous: [
            { action: "A", owner: "x", completed: true },
            { action: "B", owner: "x", completed: true },
            { action: "C", owner: "x", completed: true },
            { action: "D", owner: "x", completed: true },
            { action: "E", owner: "x", completed: false },
          ],
        }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("80%") && p.text.includes("action completion"))).toBe(true);
    });

    it("generates positive insight for regular meetings (>=2 in last 30 days)", () => {
      const result = run([
        makeMeeting({ date: "2026-05-18" }),
        makeMeeting({ date: "2026-05-10" }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("2 meetings in the last 30 days"))).toBe(true);
    });

    it("generates positive insight when all meetings have child feedback", () => {
      const result = run([
        makeMeeting({ child_feedback: ["Good"] }),
        makeMeeting({ child_feedback: ["Nice one"] }),
      ]);
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("feedback recorded at all"))).toBe(true);
    });
  });

  describe("Oak House integration", () => {
    function oakHouseMeetings(): HouseMeetingInput[] {
      return [
        {
          id: "hm_001", date: "2026-05-18", meeting_type: "regular",
          chair_person: "staff_darren",
          children_present: ["yp_alex", "yp_jordan", "yp_casey"], children_absent: [],
          staff_present: ["staff_darren", "staff_anna", "staff_edward"],
          child_feedback: ["Good meeting", "Glad we get to choose activities", "Wi-Fi thing was important"],
          actions_from_previous: [
            { action: "Fix garden gate", owner: "staff_edward", completed: true },
            { action: "Get new board games", owner: "staff_anna", completed: true },
          ],
          new_actions: [
            { action: "Book bowling", owner: "staff_darren", due_date: "2026-05-22" },
            { action: "Check Wi-Fi", owner: "staff_edward", due_date: "2026-05-20" },
            { action: "Update menu", owner: "staff_anna", due_date: "2026-05-21" },
          ],
          duration: 35,
        },
        {
          id: "hm_002", date: "2026-05-11", meeting_type: "regular",
          chair_person: "staff_darren",
          children_present: ["yp_alex", "yp_casey"], children_absent: ["yp_jordan"],
          staff_present: ["staff_darren", "staff_chervelle"],
          child_feedback: ["Want Jordan to be here too"],
          actions_from_previous: [
            { action: "Arrange cinema trip", owner: "staff_anna", completed: true },
            { action: "Fix bedroom light", owner: "staff_edward", completed: false },
          ],
          new_actions: [
            { action: "Source paint samples", owner: "staff_darren", due_date: "2026-05-15" },
            { action: "Contact SW re phone time", owner: "staff_chervelle", due_date: "2026-05-13" },
          ],
          duration: 25,
        },
        {
          id: "hm_003", date: "2026-05-04", meeting_type: "regular",
          chair_person: "staff_anna",
          children_present: ["yp_alex", "yp_jordan", "yp_casey"], children_absent: [],
          staff_present: ["staff_anna", "staff_ryan"],
          child_feedback: ["Excited about summer", "Want to go to the beach"],
          actions_from_previous: [
            { action: "Get new TV remote", owner: "staff_ryan", completed: true },
          ],
          new_actions: [
            { action: "Plan summer trips", owner: "staff_anna", due_date: "2026-05-11" },
            { action: "Review pocket money", owner: "staff_ryan", due_date: "2026-05-07" },
          ],
          duration: 30,
        },
        {
          id: "hm_004", date: "2026-04-27", meeting_type: "regular",
          chair_person: "staff_darren",
          children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"],
          staff_present: ["staff_darren", "staff_edward"],
          child_feedback: ["Good idea about the garden"],
          actions_from_previous: [],
          new_actions: [
            { action: "Buy raised bed materials", owner: "staff_edward", due_date: "2026-05-01" },
          ],
          duration: 20,
        },
      ];
    }

    it("calculates correct overview for Oak House data", () => {
      const result = run(oakHouseMeetings());
      expect(result.overview.total_meetings).toBe(4);
      expect(result.overview.meetings_last_30_days).toBe(4);
      expect(result.overview.avg_duration_minutes).toBe(28);
    });

    it("calculates attendance rate (10 present / 12 expected = 83%)", () => {
      const result = run(oakHouseMeetings());
      expect(result.overview.avg_attendance_rate).toBe(83);
    });

    it("all children have attended at least once", () => {
      const result = run(oakHouseMeetings());
      expect(result.overview.children_never_attended).toBe(0);
    });

    it("action completion rate is 80% (4/5)", () => {
      const result = run(oakHouseMeetings());
      expect(result.overview.actions_completed).toBe(4);
      expect(result.overview.total_actions).toBe(5);
      expect(result.overview.action_completion_rate).toBe(80);
    });

    it("counts overdue new actions correctly", () => {
      const result = run(oakHouseMeetings());
      // All new action due_dates are before 2026-05-25
      expect(result.overview.actions_overdue).toBe(8);
    });

    it("Alex has highest attendance (4 meetings)", () => {
      const result = run(oakHouseMeetings());
      const alex = result.child_participation.find((p) => p.child_id === "yp_alex")!;
      expect(alex.meetings_attended).toBe(4);
      expect(alex.attendance_rate).toBe(100);
    });

    it("Jordan missed 1 meeting", () => {
      const result = run(oakHouseMeetings());
      const jordan = result.child_participation.find((p) => p.child_id === "yp_jordan")!;
      expect(jordan.meetings_attended).toBe(3);
      expect(jordan.meetings_absent).toBe(1);
      expect(jordan.attendance_rate).toBe(75);
    });

    it("generates positive insights for good attendance and feedback", () => {
      const result = run(oakHouseMeetings());
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.some((p) => p.text.includes("All 3 children"))).toBe(true);
      expect(positive.some((p) => p.text.includes("4 meetings in the last 30 days"))).toBe(true);
      expect(positive.some((p) => p.text.includes("feedback recorded"))).toBe(true);
    });

    it("only has 'regular' meeting type", () => {
      const result = run(oakHouseMeetings());
      expect(result.type_breakdown).toHaveLength(1);
      expect(result.type_breakdown[0].meeting_type).toBe("regular");
      expect(result.type_breakdown[0].count).toBe(4);
    });
  });
});
