import { describe, it, expect } from "vitest";
import {
  computeHomeMeetingGovernance,
  type HomeMeetingGovernanceInput,
  type HouseMeetingInput,
} from "../home-meeting-governance-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeMeeting(overrides?: Partial<HouseMeetingInput>): HouseMeetingInput {
  return {
    id: "m1",
    date: "2026-05-01",
    meeting_type: "regular",
    children_present_count: 4,
    children_absent_count: 0,
    staff_present_count: 2,
    agenda_item_count: 4,
    child_raised_count: 2,
    feedback_count: 3,
    actions_from_previous: [
      { completed: true },
      { completed: true },
      { completed: true },
    ],
    new_actions_count: 2,
    has_general_comments: true,
    duration_minutes: 30,
    ...overrides,
  };
}

function baseInput(overrides?: Partial<HomeMeetingGovernanceInput>): HomeMeetingGovernanceInput {
  return {
    today: TODAY,
    meetings: [],
    total_children: 4,
    lookback_days: 90,
    ...overrides,
  };
}

/** Generate evenly spaced meetings from a start date */
function spacedMeetings(
  count: number,
  startDate: string,
  intervalDays: number,
  meetingOverrides?: Partial<HouseMeetingInput>,
): HouseMeetingInput[] {
  const result: HouseMeetingInput[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * intervalDays);
    result.push(makeMeeting({ id: `m${i + 1}`, date: d.toISOString().slice(0, 10), ...meetingOverrides }));
  }
  return result;
}

/**
 * 10 meetings every 9 days from Mar 1 — all bonuses maxed for outstanding.
 * Dates: Mar1, Mar10, Mar19, Mar28, Apr6, Apr15, Apr24, May3, May12, May21
 * Max gap between meetings = 9 days; gap to today (May 26) = 5 days.
 */
function outstandingMeetings(): HouseMeetingInput[] {
  return spacedMeetings(10, "2026-03-01", 9, {
    children_present_count: 4,
    children_absent_count: 0,
    staff_present_count: 2,
    agenda_item_count: 4,
    child_raised_count: 2,
    feedback_count: 3,
    actions_from_previous: [{ completed: true }, { completed: true }, { completed: true }],
    new_actions_count: 2,
    has_general_comments: true,
    duration_minutes: 30,
  });
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeHomeMeetingGovernance", () => {

  // ─── Insufficient Data ───────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when no meetings provided", () => {
      const r = computeHomeMeetingGovernance(baseInput());
      expect(r.meeting_rating).toBe("insufficient_data");
      expect(r.meeting_score).toBe(0);
    });

    it("returns insufficient_data when all meetings are outside the lookback window", () => {
      const meetings = [makeMeeting({ date: "2025-01-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_rating).toBe("insufficient_data");
      expect(r.meeting_score).toBe(0);
    });

    it("returns empty profiles with correct structure on insufficient data", () => {
      const r = computeHomeMeetingGovernance(baseInput());
      expect(r.regularity_profile.total_meetings).toBe(0);
      expect(r.regularity_profile.meetings_per_month).toBe(0);
      expect(r.attendance_profile.avg_child_attendance_rate).toBe(0);
      expect(r.attendance_profile.full_attendance_count).toBe(0);
      expect(r.action_profile.total_previous_actions).toBe(0);
      expect(r.action_profile.completion_rate).toBe(0);
      expect(r.engagement_profile.avg_agenda_items).toBe(0);
      expect(r.engagement_profile.avg_duration).toBe(0);
    });

    it("returns concern, recommendation and critical insight on insufficient data", () => {
      const r = computeHomeMeetingGovernance(baseInput());
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toBe("Reg 45");
      expect(r.insights.length).toBe(1);
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ─── Rating Classifications ──────────────────────────────────────

  describe("rating classifications", () => {
    it("rates outstanding when all modifiers maximised — score 80", () => {
      // 10 meetings, 3.3/month → +5 | attendance 100% → +4 | completion 100% → +3
      // childRaised 50% → +4 | feedback 100% → +3 | maxGap 9 → +3 | dur 30 → +3 | comments 100% → +3
      // = 52 + 28 = 80
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.meeting_score).toBe(80);
      expect(r.meeting_rating).toBe("outstanding");
    });

    it("rates good with solid but imperfect practice — score 72", () => {
      // 6 meetings every 14 days from Mar 5
      // 2.0/mo → +3 | 75% attend → +2 | 100% actions → +3
      // 33% childRaised → +2 | 100% feedback → +3 | maxGap 14 → +1 | dur 30 → +3 | 100% comments → +3
      // = 52 + 20 = 72
      const meetings = spacedMeetings(6, "2026-03-05", 14, {
        children_present_count: 3,
        children_absent_count: 1,
        agenda_item_count: 3,
        child_raised_count: 1,
        feedback_count: 2,
        actions_from_previous: [{ completed: true }, { completed: true }],
      });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(72);
      expect(r.meeting_rating).toBe("good");
    });

    it("rates adequate with mixed practice — score 57", () => {
      // 3 meetings: Apr 15, May 5, May 20
      // 1.0/mo → +1 | 75% attend → +2 | 50% actions → +1
      // 33% childRaised → +2 | 67% feedback → +1 | maxGap 20 → -1 | dur 20 → +1 | 33% comments → -2
      // = 52 + 5 = 57
      const meetings: HouseMeetingInput[] = [
        makeMeeting({
          id: "m1", date: "2026-04-15",
          children_present_count: 3, children_absent_count: 1,
          agenda_item_count: 3, child_raised_count: 1,
          feedback_count: 2,
          actions_from_previous: [{ completed: true }, { completed: false }],
          has_general_comments: false, duration_minutes: 20,
        }),
        makeMeeting({
          id: "m2", date: "2026-05-05",
          children_present_count: 3, children_absent_count: 1,
          agenda_item_count: 3, child_raised_count: 1,
          feedback_count: 1,
          actions_from_previous: [{ completed: false }, { completed: true }],
          has_general_comments: false, duration_minutes: 20,
        }),
        makeMeeting({
          id: "m3", date: "2026-05-20",
          children_present_count: 3, children_absent_count: 1,
          agenda_item_count: 3, child_raised_count: 1,
          feedback_count: 0,
          actions_from_previous: [{ completed: true }, { completed: false }],
          has_general_comments: true, duration_minutes: 20,
        }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(57);
      expect(r.meeting_rating).toBe("adequate");
    });

    it("rates inadequate with poor governance — score 32", () => {
      // 1 meeting on Mar 1
      // 0.3/mo → -4 | 25% attend → -3 | 0% actions → -2
      // 0% childRaised → -2 | 0% feedback → -2 | maxGap 86 → -3 | dur 10 → -2 | 0% comments → -2
      // = 52 - 20 = 32
      const meetings = [
        makeMeeting({
          date: "2026-03-01",
          children_present_count: 1, children_absent_count: 3,
          agenda_item_count: 2, child_raised_count: 0,
          feedback_count: 0,
          actions_from_previous: [{ completed: false }, { completed: false }],
          has_general_comments: false, duration_minutes: 10,
        }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(32);
      expect(r.meeting_rating).toBe("inadequate");
    });
  });

  // ─── Regularity Profile ──────────────────────────────────────────

  describe("regularity profile", () => {
    it("calculates correct meeting count and frequency", () => {
      const meetings = outstandingMeetings();
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.total_meetings).toBe(10);
      expect(r.regularity_profile.meetings_per_month).toBe(3.3);
    });

    it("computes avg_days_between for multiple meetings", () => {
      // 3 meetings 14 days apart → avg = 14
      const meetings = spacedMeetings(3, "2026-03-01", 14);
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.avg_days_between).toBe(14);
    });

    it("avg_days_between is unmeasured for a single meeting", () => {
      const meetings = [makeMeeting({ date: "2026-05-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.avg_days_between).toBeNull();
    });

    it("includes gap from last meeting to today in max_gap calculation", () => {
      // Single meeting on Mar 1, today May 26 → gap = 86 days
      const meetings = [makeMeeting({ date: "2026-03-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.max_gap_days).toBe(86);
    });

    it("separates regular and extraordinary meeting types", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", meeting_type: "regular" }),
        makeMeeting({ id: "m2", date: "2026-05-10", meeting_type: "extraordinary" }),
        makeMeeting({ id: "m3", date: "2026-05-15", meeting_type: "emergency" }),
        makeMeeting({ id: "m4", date: "2026-05-20", meeting_type: "regular" }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.regular_count).toBe(2);
      expect(r.regularity_profile.extraordinary_count).toBe(2);
    });

    it("uses between-meeting gap when larger than gap-to-today", () => {
      // Two meetings far apart but last one is close to today
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-03-01" }),
        makeMeeting({ id: "m2", date: "2026-05-24" }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      // Gap between: 84 days. Gap to today: 2 days. Max = 84
      expect(r.regularity_profile.max_gap_days).toBe(84);
    });
  });

  // ─── Attendance Profile ──────────────────────────────────────────

  describe("attendance profile", () => {
    it("calculates average child attendance rate", () => {
      // 3 meetings: 100%, 75%, 50% → avg = (100+75+50)/3 = 75
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", children_present_count: 4, children_absent_count: 0 }),
        makeMeeting({ id: "m2", date: "2026-05-10", children_present_count: 3, children_absent_count: 1 }),
        makeMeeting({ id: "m3", date: "2026-05-20", children_present_count: 2, children_absent_count: 2 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.attendance_profile.avg_child_attendance_rate).toBe(75);
    });

    it("counts meetings with full attendance", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", children_absent_count: 0 }),
        makeMeeting({ id: "m2", date: "2026-05-10", children_absent_count: 1 }),
        makeMeeting({ id: "m3", date: "2026-05-20", children_absent_count: 0 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.attendance_profile.full_attendance_count).toBe(2);
    });

    it("computes lowest attendance rate", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", children_present_count: 4, children_absent_count: 0 }),
        makeMeeting({ id: "m2", date: "2026-05-10", children_present_count: 1, children_absent_count: 3 }),
        makeMeeting({ id: "m3", date: "2026-05-20", children_present_count: 3, children_absent_count: 1 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.attendance_profile.lowest_attendance_rate).toBe(25);
    });

    it("leaves attendance unmeasured for a meeting with 0 children present and 0 absent", () => {
      // A meeting nobody was expected at is not evidence of 100% attendance —
      // that used to be a fabricated pass for exactly the population this
      // guard exists to catch. There is nothing to measure, so the rate is
      // null rather than defaulting either way.
      const meetings = [
        makeMeeting({ date: "2026-05-01", children_present_count: 0, children_absent_count: 0 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.attendance_profile.avg_child_attendance_rate).toBeNull();
    });

    it("computes average staff present", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", staff_present_count: 3 }),
        makeMeeting({ id: "m2", date: "2026-05-10", staff_present_count: 2 }),
        makeMeeting({ id: "m3", date: "2026-05-20", staff_present_count: 4 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      // (3+2+4)/3 = 3.0
      expect(r.attendance_profile.avg_staff_present).toBe(3);
    });
  });

  // ─── Action Profile ──────────────────────────────────────────────

  describe("action profile", () => {
    it("calculates action completion rate across all meetings", () => {
      const meetings = [
        makeMeeting({
          id: "m1", date: "2026-05-01",
          actions_from_previous: [{ completed: true }, { completed: false }],
        }),
        makeMeeting({
          id: "m2", date: "2026-05-15",
          actions_from_previous: [{ completed: true }, { completed: true }, { completed: false }],
        }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      // 3 completed out of 5 → pct(3,5) = 60
      expect(r.action_profile.total_previous_actions).toBe(5);
      expect(r.action_profile.completed_count).toBe(3);
      expect(r.action_profile.completion_rate).toBe(60);
    });

    it("completion_rate is unmeasured when no previous actions exist", () => {
      const meetings = [
        makeMeeting({ date: "2026-05-01", actions_from_previous: [] }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.action_profile.total_previous_actions).toBe(0);
      expect(r.action_profile.completion_rate).toBeNull();
    });

    it("tracks new actions and average per meeting", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", new_actions_count: 3 }),
        makeMeeting({ id: "m2", date: "2026-05-15", new_actions_count: 5 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.action_profile.total_new_actions).toBe(8);
      expect(r.action_profile.avg_new_per_meeting).toBe(4);
    });
  });

  // ─── Engagement Profile ──────────────────────────────────────────

  describe("engagement profile", () => {
    it("calculates child-raised rate as percentage of total agenda items", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", agenda_item_count: 5, child_raised_count: 2 }),
        makeMeeting({ id: "m2", date: "2026-05-15", agenda_item_count: 3, child_raised_count: 1 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      // total agenda = 8, child raised = 3, pct(3,8) = 38
      expect(r.engagement_profile.child_raised_rate).toBe(38);
    });

    it("counts meetings with feedback and average feedback count", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", feedback_count: 3 }),
        makeMeeting({ id: "m2", date: "2026-05-10", feedback_count: 0 }),
        makeMeeting({ id: "m3", date: "2026-05-20", feedback_count: 1 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.engagement_profile.meetings_with_feedback).toBe(2);
      // (3+0+1)/3 = 1.33 → round((4/3)*10)/10 = round(13.33)/10 = 1.3
      expect(r.engagement_profile.avg_feedback_count).toBe(1.3);
    });

    it("computes average duration", () => {
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01", duration_minutes: 25 }),
        makeMeeting({ id: "m2", date: "2026-05-10", duration_minutes: 35 }),
        makeMeeting({ id: "m3", date: "2026-05-20", duration_minutes: 30 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.engagement_profile.avg_duration).toBe(30);
    });

    it("child_raised_rate is unmeasured when no agenda items exist", () => {
      const meetings = [
        makeMeeting({ date: "2026-05-01", agenda_item_count: 0, child_raised_count: 0 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.engagement_profile.child_raised_rate).toBeNull();
    });
  });

  // ─── Scoring Modifiers ──────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("modifier 1: frequency ≥ 2/month gives +3 instead of +5", () => {
      // 6 meetings every 14d with all other bonuses maxed
      // maxGap = 14 → +1 instead of +3 (gap diff = -2)
      // 52 +3 +4 +3 +4 +3 +1 +3 +3 = 76
      const meetings = spacedMeetings(6, "2026-03-05", 14, {
        children_present_count: 4, children_absent_count: 0,
        agenda_item_count: 4, child_raised_count: 2,
        feedback_count: 3, has_general_comments: true,
        actions_from_previous: [{ completed: true }, { completed: true }, { completed: true }],
        duration_minutes: 30,
      });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(76);
    });

    it("modifier 2: attendance 50–69% gives -1", () => {
      // Outstanding base but present=2, absent=2 → pct(2,4)=50 → -1
      // 52 +5 -1 +3 +4 +3 +3 +3 +3 = 75
      const meetings = outstandingMeetings().map(m => ({
        ...m,
        children_present_count: 2,
        children_absent_count: 2,
      }));
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(75);
    });

    it("modifier 3: no previous actions gives +1 bonus", () => {
      // Outstanding base but actions_from_previous=[] → +1 instead of +3
      // 52 +5 +4 +1 +4 +3 +3 +3 +3 = 78
      const meetings = outstandingMeetings().map(m => ({
        ...m,
        actions_from_previous: [] as { completed: boolean }[],
      }));
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(78);
    });

    it("modifier 4: child-raised rate < 10% gives -2", () => {
      // Outstanding base but child_raised_count=0 → pct(0,40)=0% < 10% → -2
      // 52 +5 +4 +3 -2 +3 +3 +3 +3 = 74
      const meetings = outstandingMeetings().map(m => ({
        ...m,
        child_raised_count: 0,
      }));
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(74);
    });

    it("modifier 5: feedback rate < 50% gives -2", () => {
      // Outstanding base but only 4/10 meetings have feedback → pct(4,10)=40 < 50 → -2
      // 52 +5 +4 +3 +4 -2 +3 +3 +3 = 75
      const meetings = outstandingMeetings().map((m, i) => ({
        ...m,
        feedback_count: i < 4 ? 3 : 0,
      }));
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(75);
    });

    it("modifier 6: max gap 15–21 days gives -1", () => {
      // 2 meetings: May 1 and May 19 → gap between = 18, gap to today = 7 → max = 18 → -1
      // meetingsPerMonth = round((2/3)*10)/10 = 0.7 → -4
      // 52 -4 +4 +3 +4 +3 -1 +3 +3 = 67
      const meetings = [
        makeMeeting({ id: "m1", date: "2026-05-01" }),
        makeMeeting({ id: "m2", date: "2026-05-19" }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(67);
    });

    it("modifier 7: duration < 15 gives -2", () => {
      // Outstanding base but duration=10 → avg=10 < 15 → -2
      // 52 +5 +4 +3 +4 +3 +3 -2 +3 = 75
      const meetings = outstandingMeetings().map(m => ({
        ...m,
        duration_minutes: 10,
      }));
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(75);
    });

    it("modifier 8: comments rate 50–79% gives +1", () => {
      // Outstanding base but only 6/10 have comments → pct(6,10)=60 → +1
      // 52 +5 +4 +3 +4 +3 +3 +3 +1 = 78
      const meetings = outstandingMeetings().map((m, i) => ({
        ...m,
        has_general_comments: i < 6,
      }));
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBe(78);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes frequency strength when ≥ 3/month", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.strengths.some(s => s.includes("meetings per month"))).toBe(true);
    });

    it("includes attendance strength when ≥ 90%", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.strengths.some(s => s.includes("attendance"))).toBe(true);
    });

    it("includes action completion strength when ≥ 80% with actions", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.strengths.some(s => s.includes("action completion"))).toBe(true);
    });

    it("includes child-led governance strength when child-raised ≥ 50%", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.strengths.some(s => s.includes("child-led"))).toBe(true);
    });

    it("includes feedback strength when recorded at every meeting", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.strengths.some(s => s.includes("feedback"))).toBe(true);
    });

    it("includes gap strength when no gap exceeds 10 days", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.strengths.some(s => s.includes("10 days"))).toBe(true);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low frequency (< 1/month) as a concern", () => {
      const meetings = [makeMeeting({ date: "2026-05-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.concerns.some(c => c.includes("meetings per month"))).toBe(true);
    });

    it("flags low attendance (< 70%) as a concern", () => {
      const meetings = [
        makeMeeting({ date: "2026-05-01", children_present_count: 1, children_absent_count: 3 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.concerns.some(c => c.includes("attendance"))).toBe(true);
    });

    it("flags poor action completion (< 50%) as a concern", () => {
      const meetings = [
        makeMeeting({
          date: "2026-05-01",
          actions_from_previous: [
            { completed: false }, { completed: false },
            { completed: false }, { completed: true },
          ],
        }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.concerns.some(c => c.includes("actions completed"))).toBe(true);
    });

    it("flags large gap (> 21 days) as a concern", () => {
      const meetings = [makeMeeting({ date: "2026-03-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.concerns.some(c => c.includes("gap"))).toBe(true);
    });

    it("flags no feedback at any meeting as a concern", () => {
      const meetings = [makeMeeting({ date: "2026-05-01", feedback_count: 0 })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.concerns.some(c => c.includes("feedback"))).toBe(true);
    });

    it("flags low child engagement (< 10% of items raised by children) as a concern", () => {
      const meetings = [
        makeMeeting({ date: "2026-05-01", agenda_item_count: 5, child_raised_count: 0 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.concerns.some(c => c.includes("raised by children"))).toBe(true);
    });
  });

  // ─── Recommendations ────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends increasing frequency when < 1/month", () => {
      const meetings = [makeMeeting({ date: "2026-05-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.recommendations.some(rec =>
        rec.recommendation.includes("frequency") && rec.urgency === "immediate",
      )).toBe(true);
    });

    it("recommends improving action follow-through when < 50%", () => {
      const meetings = spacedMeetings(4, "2026-04-01", 14, {
        actions_from_previous: [{ completed: false }, { completed: false }, { completed: true }],
      });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      // pct(4, 12) = 33% < 50%
      expect(r.recommendations.some(rec =>
        rec.recommendation.includes("action") && rec.urgency === "soon",
      )).toBe(true);
    });

    it("recommends capturing feedback when none recorded", () => {
      const meetings = spacedMeetings(4, "2026-04-01", 14, { feedback_count: 0 });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.recommendations.some(rec =>
        rec.recommendation.includes("feedback") && rec.urgency === "soon",
      )).toBe(true);
    });

    it("all recommendations reference Reg 45", () => {
      const meetings = [
        makeMeeting({
          date: "2026-05-01",
          children_present_count: 1, children_absent_count: 3,
          feedback_count: 0,
          actions_from_previous: [{ completed: false }],
        }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      r.recommendations.forEach(rec => {
        expect(rec.regulatory_ref).toBe("Reg 45");
      });
    });
  });

  // ─── Insights ───────────────────────────────────────────────────

  describe("insights", () => {
    it("generates exemplary positive insight when all three conditions met", () => {
      // meetingsPerMonth ≥ 3 && avgAttendance ≥ 90 && child_raised_rate ≥ 50
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for low meeting frequency", () => {
      const meetings = [makeMeeting({ date: "2026-05-01" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.insights.some(i =>
        i.severity === "critical" && i.text.includes("meetings per month"),
      )).toBe(true);
    });

    it("generates warning insight for poor action completion", () => {
      const meetings = spacedMeetings(4, "2026-04-01", 14, {
        actions_from_previous: [{ completed: false }, { completed: false }],
      });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("actions"))).toBe(true);
    });

    it("generates warning insight for low attendance", () => {
      const meetings = spacedMeetings(4, "2026-04-01", 14, {
        children_present_count: 1, children_absent_count: 3,
      });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("attendance"))).toBe(true);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline includes meeting count and metrics", () => {
      const r = computeHomeMeetingGovernance(baseInput({ meetings: outstandingMeetings() }));
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("10 meetings");
    });

    it("good headline", () => {
      const meetings = spacedMeetings(6, "2026-03-05", 14, {
        children_present_count: 3, children_absent_count: 1,
        agenda_item_count: 3, child_raised_count: 1,
        feedback_count: 2,
        actions_from_previous: [{ completed: true }, { completed: true }],
      });
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.headline).toContain("Good");
    });

    it("adequate headline", () => {
      const meetings: HouseMeetingInput[] = [
        makeMeeting({ id: "m1", date: "2026-04-15", children_present_count: 3, children_absent_count: 1, agenda_item_count: 3, child_raised_count: 1, feedback_count: 2, actions_from_previous: [{ completed: true }, { completed: false }], has_general_comments: false, duration_minutes: 20 }),
        makeMeeting({ id: "m2", date: "2026-05-05", children_present_count: 3, children_absent_count: 1, agenda_item_count: 3, child_raised_count: 1, feedback_count: 1, actions_from_previous: [{ completed: false }, { completed: true }], has_general_comments: false, duration_minutes: 20 }),
        makeMeeting({ id: "m3", date: "2026-05-20", children_present_count: 3, children_absent_count: 1, agenda_item_count: 3, child_raised_count: 1, feedback_count: 0, actions_from_previous: [{ completed: true }, { completed: false }], has_general_comments: true, duration_minutes: 20 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline", () => {
      const meetings = [
        makeMeeting({ date: "2026-03-01", children_present_count: 1, children_absent_count: 3, agenda_item_count: 2, child_raised_count: 0, feedback_count: 0, actions_from_previous: [{ completed: false }, { completed: false }], has_general_comments: false, duration_minutes: 10 }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.headline).toContain("inadequate");
    });

    it("insufficient data headline", () => {
      const r = computeHomeMeetingGovernance(baseInput());
      expect(r.headline).toContain("No house meetings");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("respects custom lookback_days", () => {
      // Meeting on May 10 — within 30-day lookback but outside 7-day lookback
      const meetings = [makeMeeting({ date: "2026-05-10" })];
      const r7 = computeHomeMeetingGovernance(baseInput({ meetings, lookback_days: 7 }));
      const r30 = computeHomeMeetingGovernance(baseInput({ meetings, lookback_days: 30 }));
      expect(r7.meeting_rating).toBe("insufficient_data");
      expect(r30.meeting_rating).not.toBe("insufficient_data");
    });

    it("includes meeting exactly on the cutoff date", () => {
      // Cutoff = May 26 - 90 = Feb 25
      const meetings = [makeMeeting({ date: "2026-02-25" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.total_meetings).toBe(1);
    });

    it("includes meeting exactly on today", () => {
      const meetings = [makeMeeting({ date: TODAY })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.regularity_profile.total_meetings).toBe(1);
    });

    it("excludes meeting one day before cutoff", () => {
      // Feb 24 < Feb 25 cutoff
      const meetings = [makeMeeting({ date: "2026-02-24" })];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_rating).toBe("insufficient_data");
    });

    it("score stays within 0–100 bounds", () => {
      // Worst-case scenario: 1 meeting with every penalty
      const meetings = [
        makeMeeting({
          date: "2026-03-01",
          children_present_count: 0, children_absent_count: 4,
          agenda_item_count: 0, child_raised_count: 0,
          feedback_count: 0,
          actions_from_previous: Array.from({ length: 5 }, () => ({ completed: false })),
          has_general_comments: false, duration_minutes: 5,
        }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      expect(r.meeting_score).toBeGreaterThanOrEqual(0);
      expect(r.meeting_score).toBeLessThanOrEqual(100);
    });

    it("handles meetings in unsorted order", () => {
      const meetings = [
        makeMeeting({ id: "m3", date: "2026-05-20" }),
        makeMeeting({ id: "m1", date: "2026-04-15" }),
        makeMeeting({ id: "m2", date: "2026-05-05" }),
      ];
      const r = computeHomeMeetingGovernance(baseInput({ meetings }));
      // Sorts internally: Apr15 → May5 (20d) → May20 (15d) → May26 (6d). Max = 20
      expect(r.regularity_profile.max_gap_days).toBe(20);
    });
  });
});
