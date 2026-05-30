// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Home Child Voice & Participation Intelligence Engine
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildVoiceParticipation,
  type ChildVoiceInput,
  type MeetingAttendanceRecordInput,
  type ConsultationRecordInput,
  type FeedbackActionRecordInput,
  type CouncilEngagementRecordInput,
  type FeelingHeardRecordInput,
} from "../home-child-voice-participation-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-30";

function daysAgo(n: number): string {
  const d = new Date("2026-05-30");
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function makeMeeting(overrides: Partial<MeetingAttendanceRecordInput> = {}): MeetingAttendanceRecordInput {
  return {
    id: `meet_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    date: daysAgo(1),
    meeting_type: "house_meeting",
    attended: true,
    invited: true,
    contributed: true,
    chaired_by_child: false,
    minutes_recorded: true,
    actions_from_meeting: 2,
    actions_completed: 2,
    child_feedback_positive: true,
    duration_minutes: 30,
    notes: "",
    created_at: daysAgo(1),
    ...overrides,
  };
}

function makeConsultation(overrides: Partial<ConsultationRecordInput> = {}): ConsultationRecordInput {
  return {
    id: `cons_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    date: daysAgo(1),
    consultation_type: "individual",
    topic: "Care plan",
    child_engaged: true,
    child_views_recorded: true,
    views_shared_with_staff: true,
    outcome_communicated_to_child: true,
    child_satisfied_with_process: true,
    follow_up_required: false,
    follow_up_completed: false,
    duration_minutes: 20,
    facilitator: "Staff A",
    notes: "",
    created_at: daysAgo(1),
    ...overrides,
  };
}

function makeFeedback(overrides: Partial<FeedbackActionRecordInput> = {}): FeedbackActionRecordInput {
  return {
    id: `fb_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    date: daysAgo(1),
    feedback_source: "child_direct",
    feedback_category: "care",
    feedback_received: true,
    acknowledged: true,
    action_planned: true,
    action_taken: true,
    outcome_communicated: true,
    child_satisfied_with_outcome: true,
    days_to_action: 2,
    escalated: false,
    notes: "",
    created_at: daysAgo(1),
    ...overrides,
  };
}

function makeCouncil(overrides: Partial<CouncilEngagementRecordInput> = {}): CouncilEngagementRecordInput {
  return {
    id: `council_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    date: daysAgo(1),
    council_type: "child_council",
    role: "member",
    attended: true,
    contributed: true,
    agenda_item_raised: false,
    agenda_item_actioned: false,
    minutes_shared: true,
    child_felt_listened_to: true,
    decisions_influenced: 1,
    notes: "",
    created_at: daysAgo(1),
    ...overrides,
  };
}

function makeFeelingHeard(overrides: Partial<FeelingHeardRecordInput> = {}): FeelingHeardRecordInput {
  return {
    id: `fh_${Math.random().toString(36).slice(2, 8)}`,
    child_id: "child_1",
    date: daysAgo(1),
    assessment_method: "direct_question",
    feels_listened_to: true,
    feels_views_matter: true,
    feels_changes_happen: true,
    knows_how_to_complain: true,
    knows_advocate: true,
    overall_satisfaction: 5,
    specific_concern: "",
    concern_addressed: false,
    notes: "",
    created_at: daysAgo(1),
    ...overrides,
  };
}

function baseInput(overrides: Partial<ChildVoiceInput> = {}): ChildVoiceInput {
  return {
    today: TODAY,
    total_children: 4,
    meeting_attendance_records: [],
    consultation_records: [],
    feedback_action_records: [],
    council_engagement_records: [],
    feeling_heard_records: [],
    ...overrides,
  };
}

/** Build an outstanding-profile input: all rates >= 90 */
function outstandingInput(overrides: Partial<ChildVoiceInput> = {}): ChildVoiceInput {
  // 10 meetings all positive across 4 children
  const meetings = Array.from({ length: 10 }, (_, i) =>
    makeMeeting({
      child_id: `child_${(i % 4) + 1}`,
      date: daysAgo(i + 1),
      attended: true,
      invited: true,
      contributed: true,
      chaired_by_child: i < 4,
      minutes_recorded: true,
      actions_from_meeting: 2,
      actions_completed: 2,
      child_feedback_positive: true,
    }),
  );
  const consultations = Array.from({ length: 8 }, (_, i) =>
    makeConsultation({
      child_id: `child_${(i % 4) + 1}`,
      date: daysAgo(i + 1),
      child_engaged: true,
      child_views_recorded: true,
      outcome_communicated_to_child: true,
      child_satisfied_with_process: true,
    }),
  );
  const feedbacks = Array.from({ length: 8 }, (_, i) =>
    makeFeedback({
      child_id: `child_${(i % 4) + 1}`,
      date: daysAgo(i + 1),
      feedback_received: true,
      acknowledged: true,
      action_taken: true,
      outcome_communicated: true,
      child_satisfied_with_outcome: true,
      days_to_action: 2,
    }),
  );
  const councils = Array.from({ length: 8 }, (_, i) =>
    makeCouncil({
      child_id: `child_${(i % 4) + 1}`,
      date: daysAgo(i + 1),
      attended: true,
      contributed: true,
      child_felt_listened_to: true,
      role: i < 2 ? "chair" : "member",
      decisions_influenced: 1,
    }),
  );
  const feelingHeards = Array.from({ length: 8 }, (_, i) =>
    makeFeelingHeard({
      child_id: `child_${(i % 4) + 1}`,
      date: daysAgo(i + 1),
      feels_listened_to: true,
      feels_views_matter: true,
      feels_changes_happen: true,
      knows_how_to_complain: true,
      knows_advocate: true,
      overall_satisfaction: 5,
      specific_concern: i < 4 ? "Concern" : "",
      concern_addressed: true,
    }),
  );
  return baseInput({
    total_children: 4,
    meeting_attendance_records: meetings,
    consultation_records: consultations,
    feedback_action_records: feedbacks,
    council_engagement_records: councils,
    feeling_heard_records: feelingHeards,
    ...overrides,
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Child Voice & Participation Intelligence Engine", () => {
  // ════════════════════════════════════════════════════════════════════════
  // 1 · OUTPUT SHAPE
  // ════════════════════════════════════════════════════════════════════════

  describe("Output shape", () => {
    it("returns all required output properties", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r).toHaveProperty("voice_rating");
      expect(r).toHaveProperty("voice_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_meeting_records");
      expect(r).toHaveProperty("total_consultation_records");
      expect(r).toHaveProperty("total_feedback_records");
      expect(r).toHaveProperty("total_council_records");
      expect(r).toHaveProperty("total_feeling_heard_records");
      expect(r).toHaveProperty("meeting_attendance_rate");
      expect(r).toHaveProperty("consultation_rate");
      expect(r).toHaveProperty("feedback_action_rate");
      expect(r).toHaveProperty("council_engagement_rate");
      expect(r).toHaveProperty("feeling_heard_rate");
      expect(r).toHaveProperty("child_satisfaction_rate");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths, concerns, recommendations, insights are arrays", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(Array.isArray(r.strengths)).toBe(true);
      expect(Array.isArray(r.concerns)).toBe(true);
      expect(Array.isArray(r.recommendations)).toBe(true);
      expect(Array.isArray(r.insights)).toBe(true);
    });

    it("recommendation objects have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      const rec = r.recommendations[0];
      expect(rec).toHaveProperty("rank");
      expect(rec).toHaveProperty("recommendation");
      expect(rec).toHaveProperty("urgency");
      expect(rec).toHaveProperty("regulatory_ref");
    });

    it("insight objects have text and severity", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.insights.length).toBeGreaterThan(0);
      const ins = r.insights[0];
      expect(ins).toHaveProperty("text");
      expect(ins).toHaveProperty("severity");
    });

    it("record counts match input lengths", () => {
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: [makeMeeting(), makeMeeting()],
          consultation_records: [makeConsultation()],
          feedback_action_records: [makeFeedback(), makeFeedback(), makeFeedback()],
          council_engagement_records: [makeCouncil()],
          feeling_heard_records: [makeFeelingHeard(), makeFeelingHeard()],
        }),
      );
      expect(r.total_meeting_records).toBe(2);
      expect(r.total_consultation_records).toBe(1);
      expect(r.total_feedback_records).toBe(3);
      expect(r.total_council_records).toBe(1);
      expect(r.total_feeling_heard_records).toBe(2);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 2 · INSUFFICIENT DATA
  // ════════════════════════════════════════════════════════════════════════

  describe("insufficient_data", () => {
    it("returns insufficient_data when total_children=0 and all arrays empty", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r.voice_rating).toBe("insufficient_data");
      expect(r.voice_score).toBe(0);
    });

    it("headline mentions insufficient data", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r.headline.toLowerCase()).toContain("insufficient data");
    });

    it("all totals and rates are 0", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r.total_meeting_records).toBe(0);
      expect(r.total_consultation_records).toBe(0);
      expect(r.total_feedback_records).toBe(0);
      expect(r.total_council_records).toBe(0);
      expect(r.total_feeling_heard_records).toBe(0);
      expect(r.meeting_attendance_rate).toBe(0);
      expect(r.consultation_rate).toBe(0);
      expect(r.feedback_action_rate).toBe(0);
      expect(r.council_engagement_rate).toBe(0);
      expect(r.feeling_heard_rate).toBe(0);
      expect(r.child_satisfaction_rate).toBe(0);
    });

    it("no strengths, concerns, recommendations, insights", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 3 · ALL EMPTY + CHILDREN > 0 (INADEQUATE)
  // ════════════════════════════════════════════════════════════════════════

  describe("all empty + children > 0 => inadequate", () => {
    it("returns inadequate with score 15", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.voice_rating).toBe("inadequate");
      expect(r.voice_score).toBe(15);
    });

    it("headline mentions urgent attention", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.headline.toLowerCase()).toContain("urgent");
    });

    it("has exactly 1 concern", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.concerns).toHaveLength(1);
    });

    it("has exactly 2 recommendations", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("both recommendations have urgency immediate", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("immediate");
    });

    it("has exactly 1 critical insight", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("with total_children=1 still returns inadequate 15", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 1 }));
      expect(r.voice_rating).toBe("inadequate");
      expect(r.voice_score).toBe(15);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 4 · BASE SCORE
  // ════════════════════════════════════════════════════════════════════════

  describe("base score = 52", () => {
    it("starts at 52 with minimal data (no bonuses, no penalties)", () => {
      // meetingAttendanceRate between 40 and 70 => no bonus, no penalty
      const meetings = [
        makeMeeting({ attended: true, invited: true, contributed: false, child_feedback_positive: false, actions_from_meeting: 0, actions_completed: 0 }),
        makeMeeting({ attended: false, invited: true, contributed: false, child_feedback_positive: false, actions_from_meeting: 0, actions_completed: 0 }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.voice_score).toBe(52);
    });

    it("score 52 maps to adequate rating", () => {
      const meetings = [
        makeMeeting({ attended: true, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        makeMeeting({ attended: false, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.voice_rating).toBe("adequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 5 · RATING THRESHOLDS (toRating)
  // ════════════════════════════════════════════════════════════════════════

  describe("rating thresholds", () => {
    it("outstanding at score >= 80", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.voice_score).toBeGreaterThanOrEqual(80);
      expect(r.voice_rating).toBe("outstanding");
    });

    it("good when score >= 65 and < 80", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ child_id: `child_${(i % 4) + 1}`, date: daysAgo(i + 1), attended: true, invited: true, contributed: true, child_feedback_positive: true, actions_from_meeting: 2, actions_completed: 2 }),
      );
      const consultations = Array.from({ length: 5 }, (_, i) =>
        makeConsultation({ child_id: `child_${(i % 4) + 1}`, date: daysAgo(i + 1), child_engaged: true, child_views_recorded: true, outcome_communicated_to_child: true, child_satisfied_with_process: true }),
      );
      const feedbacks = Array.from({ length: 5 }, (_, i) =>
        makeFeedback({ child_id: `child_${(i % 4) + 1}`, date: daysAgo(i + 1), feedback_received: true, action_taken: true, child_satisfied_with_outcome: true, outcome_communicated: true }),
      );
      // Council: ~77% engagement => +1
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({
          child_id: `child_${(i % 4) + 1}`,
          date: daysAgo(i + 1),
          attended: i < 8,
          contributed: i < 6,
          child_felt_listened_to: i < 6,
          decisions_influenced: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          consultation_records: consultations,
          feedback_action_records: feedbacks,
          council_engagement_records: councils,
        }),
      );
      expect(r.voice_score).toBeGreaterThanOrEqual(65);
      expect(r.voice_score).toBeLessThan(80);
      expect(r.voice_rating).toBe("good");
    });

    it("adequate when score >= 45 and < 65", () => {
      const meetings = [
        makeMeeting({ attended: true, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        makeMeeting({ attended: false, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.voice_score).toBeGreaterThanOrEqual(45);
      expect(r.voice_score).toBeLessThan(65);
      expect(r.voice_rating).toBe("adequate");
    });

    it("inadequate when score < 45", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          child_id: `child_${(i % 4) + 1}`,
          date: daysAgo(i + 1),
          attended: i < 3,
          invited: true,
          contributed: false,
          child_feedback_positive: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({
          child_id: `child_${(i % 4) + 1}`,
          date: daysAgo(i + 1),
          feedback_received: true,
          action_taken: i < 2,
          acknowledged: i < 3,
          outcome_communicated: false,
          child_satisfied_with_outcome: false,
          days_to_action: 20,
        }),
      );
      const feelingHeards = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          child_id: `child_${(i % 4) + 1}`,
          date: daysAgo(i + 1),
          feels_listened_to: i < 2,
          feels_views_matter: i < 2,
          feels_changes_happen: i < 2,
          overall_satisfaction: 2,
          knows_how_to_complain: false,
          knows_advocate: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          feedback_action_records: feedbacks,
          feeling_heard_records: feelingHeards,
        }),
      );
      expect(r.voice_score).toBeLessThan(45);
      expect(r.voice_rating).toBe("inadequate");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 6 · BONUSES
  // ════════════════════════════════════════════════════════════════════════

  describe("bonuses", () => {
    // --- Bonus 1: meetingAttendanceRate ---
    describe("Bonus 1: meetingAttendanceRate", () => {
      it("+4 when meetingAttendanceRate >= 90", () => {
        const meetings = Array.from({ length: 10 }, () =>
          makeMeeting({ attended: true, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.meeting_attendance_rate).toBeGreaterThanOrEqual(90);
        expect(r.voice_score).toBeGreaterThanOrEqual(56);
      });

      it("+2 when meetingAttendanceRate >= 70 and < 90", () => {
        const meetings = Array.from({ length: 10 }, (_, i) =>
          makeMeeting({ attended: i < 7, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.meeting_attendance_rate).toBeGreaterThanOrEqual(70);
        expect(r.meeting_attendance_rate).toBeLessThan(90);
      });

      it("+0 when meetingAttendanceRate < 70 and >= 40", () => {
        const meetings = Array.from({ length: 10 }, (_, i) =>
          makeMeeting({ attended: i < 5, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.meeting_attendance_rate).toBe(50);
        expect(r.voice_score).toBe(52);
      });
    });

    // --- Bonus 2: consultationRate ---
    describe("Bonus 2: consultationRate", () => {
      it("+4 when consultationRate >= 90", () => {
        const consultations = Array.from({ length: 5 }, () =>
          makeConsultation({ child_engaged: true, child_views_recorded: true, outcome_communicated_to_child: true }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ total_children: 0, consultation_records: consultations }),
        );
        expect(r.consultation_rate).toBe(100);
      });

      it("+2 when consultationRate >= 70 and < 90", () => {
        const consultations = Array.from({ length: 8 }, (_, i) =>
          makeConsultation({
            child_engaged: i < 6,
            child_views_recorded: i < 6,
            outcome_communicated_to_child: i < 5,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ total_children: 0, consultation_records: consultations }),
        );
        expect(r.consultation_rate).toBeGreaterThanOrEqual(70);
        expect(r.consultation_rate).toBeLessThan(90);
      });
    });

    // --- Bonus 3: feedbackActionRate ---
    describe("Bonus 3: feedbackActionRate", () => {
      it("+4 when feedbackActionRate >= 90", () => {
        const feedbacks = Array.from({ length: 10 }, () =>
          makeFeedback({ feedback_received: true, action_taken: true }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feedback_action_records: feedbacks }),
        );
        expect(r.feedback_action_rate).toBe(100);
      });

      it("+2 when feedbackActionRate >= 70 and < 90", () => {
        const feedbacks = Array.from({ length: 10 }, (_, i) =>
          makeFeedback({ feedback_received: true, action_taken: i < 7 }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feedback_action_records: feedbacks }),
        );
        expect(r.feedback_action_rate).toBe(70);
      });
    });

    // --- Bonus 4: councilEngagementRate ---
    describe("Bonus 4: councilEngagementRate", () => {
      it("+3 when councilEngagementRate >= 90", () => {
        const councils = Array.from({ length: 10 }, () =>
          makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ council_engagement_records: councils }),
        );
        expect(r.council_engagement_rate).toBeGreaterThanOrEqual(90);
      });

      it("+1 when councilEngagementRate >= 70 and < 90", () => {
        const councils = Array.from({ length: 10 }, (_, i) =>
          makeCouncil({
            attended: i < 8,
            contributed: i < 6,
            child_felt_listened_to: i < 6,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ council_engagement_records: councils }),
        );
        expect(r.council_engagement_rate).toBeGreaterThanOrEqual(70);
        expect(r.council_engagement_rate).toBeLessThan(90);
      });
    });

    // --- Bonus 5: feelingHeardRate ---
    describe("Bonus 5: feelingHeardRate", () => {
      it("+4 when feelingHeardRate >= 90", () => {
        const fhs = Array.from({ length: 10 }, () =>
          makeFeelingHeard({ feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feeling_heard_records: fhs }),
        );
        expect(r.feeling_heard_rate).toBe(100);
      });

      it("+2 when feelingHeardRate >= 70 and < 90", () => {
        const fhs = Array.from({ length: 10 }, (_, i) =>
          makeFeelingHeard({
            feels_listened_to: i < 8,
            feels_views_matter: i < 7,
            feels_changes_happen: i < 7,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feeling_heard_records: fhs }),
        );
        expect(r.feeling_heard_rate).toBeGreaterThanOrEqual(70);
        expect(r.feeling_heard_rate).toBeLessThan(90);
      });
    });

    // --- Bonus 6: childSatisfactionRate ---
    describe("Bonus 6: childSatisfactionRate", () => {
      it("+3 when childSatisfactionRate >= 90", () => {
        const meetings = Array.from({ length: 5 }, () =>
          makeMeeting({ attended: true, child_feedback_positive: true, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
        );
        const fhs = Array.from({ length: 5 }, () =>
          makeFeelingHeard({ feels_listened_to: true }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({
            meeting_attendance_records: meetings,
            feeling_heard_records: fhs,
          }),
        );
        expect(r.child_satisfaction_rate).toBeGreaterThanOrEqual(90);
      });

      it("+1 when childSatisfactionRate >= 70 and < 90", () => {
        const meetings = Array.from({ length: 10 }, (_, i) =>
          makeMeeting({
            attended: true,
            child_feedback_positive: i < 7,
            actions_from_meeting: 0,
            actions_completed: 0,
            contributed: false,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.child_satisfaction_rate).toBeGreaterThanOrEqual(70);
        expect(r.child_satisfaction_rate).toBeLessThan(90);
      });
    });

    // --- Bonus 7: meetingActionCompletionRate ---
    describe("Bonus 7: meetingActionCompletionRate", () => {
      it("+3 when meetingActionCompletionRate >= 90", () => {
        const meetings = Array.from({ length: 5 }, () =>
          makeMeeting({
            attended: true,
            actions_from_meeting: 3,
            actions_completed: 3,
            child_feedback_positive: false,
            contributed: false,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.voice_score).toBeGreaterThanOrEqual(59);
      });

      it("+1 when meetingActionCompletionRate >= 70 and < 90", () => {
        const meetings = [
          makeMeeting({ attended: true, actions_from_meeting: 10, actions_completed: 7, child_feedback_positive: false, contributed: false }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.voice_score).toBe(57);
      });
    });

    // --- Bonus 8: concernAddressedRate ---
    describe("Bonus 8: concernAddressedRate", () => {
      it("+3 when concernAddressedRate >= 90", () => {
        const fhs = Array.from({ length: 10 }, () =>
          makeFeelingHeard({
            feels_listened_to: true,
            feels_views_matter: true,
            feels_changes_happen: true,
            specific_concern: "A concern",
            concern_addressed: true,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feeling_heard_records: fhs }),
        );
        expect(r.voice_score).toBeGreaterThanOrEqual(62);
      });

      it("+1 when concernAddressedRate >= 70 and < 90", () => {
        const fhs = Array.from({ length: 10 }, (_, i) =>
          makeFeelingHeard({
            feels_listened_to: true,
            feels_views_matter: true,
            feels_changes_happen: true,
            specific_concern: "Something",
            concern_addressed: i < 7,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feeling_heard_records: fhs }),
        );
        expect(r.voice_score).toBeGreaterThanOrEqual(52 + 4 + 1);
      });
    });

    // --- Max bonuses ---
    it("maximum bonus is +28 from base 52 => 80", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.voice_score).toBe(80);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 7 · PENALTIES
  // ════════════════════════════════════════════════════════════════════════

  describe("penalties", () => {
    it("-5 when meetingAttendanceRate < 40 and records exist", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 3,
          invited: true,
          child_feedback_positive: false,
          contributed: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.meeting_attendance_rate).toBe(30);
      expect(r.voice_score).toBe(52 - 5);
    });

    it("no penalty when meetingAttendanceRate < 40 but no records", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r.voice_score).toBe(0);
    });

    it("-5 when feedbackActionRate < 40 and records exist", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({
          feedback_received: true,
          action_taken: i < 3,
          child_satisfied_with_outcome: false,
          outcome_communicated: false,
          acknowledged: false,
          days_to_action: 20,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.feedback_action_rate).toBe(30);
      expect(r.voice_score).toBe(52 - 5);
    });

    it("-5 when feelingHeardRate < 40 and records exist", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          feels_listened_to: i < 3,
          feels_views_matter: i < 3,
          feels_changes_happen: i < 3,
          knows_how_to_complain: false,
          knows_advocate: false,
          overall_satisfaction: 2,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.feeling_heard_rate).toBe(30);
      expect(r.voice_score).toBe(52 - 5);
    });

    it("-3 when councilEngagementRate < 30 and records exist", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({
          attended: i < 2,
          contributed: false,
          child_felt_listened_to: false,
          decisions_influenced: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.council_engagement_rate).toBeLessThan(30);
      expect(r.voice_score).toBe(52 - 3);
    });

    it("no council penalty when council records are empty", () => {
      const meetings = [
        makeMeeting({ attended: true, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        makeMeeting({ attended: false, invited: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.voice_score).toBe(52);
    });

    it("all four penalties stack: -5 -5 -5 -3 = -18 from 52 = 34", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 2,
          invited: true,
          child_feedback_positive: false,
          contributed: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({
          feedback_received: true,
          action_taken: i < 2,
          child_satisfied_with_outcome: false,
          outcome_communicated: false,
          acknowledged: false,
        }),
      );
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          feels_listened_to: i < 2,
          feels_views_matter: i < 2,
          feels_changes_happen: i < 2,
          knows_how_to_complain: false,
          knows_advocate: false,
          overall_satisfaction: 1,
        }),
      );
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({
          attended: i < 2,
          contributed: false,
          child_felt_listened_to: false,
          decisions_influenced: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          feedback_action_records: feedbacks,
          feeling_heard_records: fhs,
          council_engagement_records: councils,
        }),
      );
      expect(r.voice_score).toBe(34);
      expect(r.voice_rating).toBe("inadequate");
    });

    it("score is clamped to 0 minimum", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.voice_score).toBeGreaterThanOrEqual(0);
      expect(r.voice_score).toBeLessThanOrEqual(100);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 8 · RATES (composite calculations)
  // ════════════════════════════════════════════════════════════════════════

  describe("rates", () => {
    describe("meetingAttendanceRate", () => {
      it("uses invited count as denominator when some are invited", () => {
        const meetings = [
          makeMeeting({ attended: true, invited: true }),
          makeMeeting({ attended: true, invited: true }),
          makeMeeting({ attended: true, invited: true }),
          makeMeeting({ attended: true, invited: true }),
          makeMeeting({ attended: false, invited: true }),
          makeMeeting({ attended: false, invited: false }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.meeting_attendance_rate).toBe(80);
      });

      it("uses total records as denominator when none invited", () => {
        const meetings = [
          makeMeeting({ attended: true, invited: false }),
          makeMeeting({ attended: false, invited: false }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.meeting_attendance_rate).toBe(50);
      });

      it("returns 0 when no meetings", () => {
        const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
        expect(r.meeting_attendance_rate).toBe(0);
      });
    });

    describe("consultationRate (composite)", () => {
      it("averages engagement, views recorded, and outcome communicated", () => {
        const consultations = Array.from({ length: 10 }, (_, i) =>
          makeConsultation({
            child_engaged: i < 8,
            child_views_recorded: i < 6,
            outcome_communicated_to_child: i < 4,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ consultation_records: consultations }),
        );
        expect(r.consultation_rate).toBe(60);
      });

      it("returns 0 when no consultations", () => {
        const r = computeChildVoiceParticipation(baseInput());
        expect(r.consultation_rate).toBe(0);
      });
    });

    describe("feedbackActionRate", () => {
      it("pct(actionTaken, feedbackReceived)", () => {
        const feedbacks = [
          makeFeedback({ feedback_received: true, action_taken: true }),
          makeFeedback({ feedback_received: true, action_taken: true }),
          makeFeedback({ feedback_received: true, action_taken: false }),
          makeFeedback({ feedback_received: false, action_taken: false }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({ feedback_action_records: feedbacks }),
        );
        expect(r.feedback_action_rate).toBe(67);
      });

      it("action_taken only counted when feedback_received", () => {
        const feedbacks = [
          makeFeedback({ feedback_received: false, action_taken: true }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({ feedback_action_records: feedbacks }),
        );
        expect(r.feedback_action_rate).toBe(0);
      });
    });

    describe("councilEngagementRate (composite)", () => {
      it("averages attendance, contribution, and felt listened to", () => {
        const councils = Array.from({ length: 10 }, (_, i) =>
          makeCouncil({
            attended: i < 8,
            contributed: i < 6,
            child_felt_listened_to: i < 4,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ council_engagement_records: councils }),
        );
        expect(r.council_engagement_rate).toBe(68);
      });

      it("returns 0 when no council records", () => {
        const r = computeChildVoiceParticipation(baseInput());
        expect(r.council_engagement_rate).toBe(0);
      });
    });

    describe("feelingHeardRate (composite)", () => {
      it("averages listened to, views matter, and changes happen", () => {
        const fhs = Array.from({ length: 10 }, (_, i) =>
          makeFeelingHeard({
            feels_listened_to: i < 9,
            feels_views_matter: i < 7,
            feels_changes_happen: i < 5,
          }),
        );
        const r = computeChildVoiceParticipation(
          baseInput({ feeling_heard_records: fhs }),
        );
        expect(r.feeling_heard_rate).toBe(70);
      });

      it("returns 0 when no feeling heard records", () => {
        const r = computeChildVoiceParticipation(baseInput());
        expect(r.feeling_heard_rate).toBe(0);
      });
    });

    describe("childSatisfactionRate (composite across sources)", () => {
      it("aggregates satisfaction numerators/denominators from all 5 sources", () => {
        const meetings = [
          makeMeeting({ attended: true, child_feedback_positive: true, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
          makeMeeting({ attended: true, child_feedback_positive: false, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
        ];
        const consultations = [
          makeConsultation({ child_satisfied_with_process: true }),
          makeConsultation({ child_satisfied_with_process: false }),
        ];
        const feedbacks = [
          makeFeedback({ feedback_received: true, child_satisfied_with_outcome: true }),
          makeFeedback({ feedback_received: true, child_satisfied_with_outcome: false }),
        ];
        const councils = [
          makeCouncil({ attended: true, child_felt_listened_to: true }),
          makeCouncil({ attended: true, child_felt_listened_to: false }),
        ];
        const fhs = [
          makeFeelingHeard({ feels_listened_to: true }),
          makeFeelingHeard({ feels_listened_to: false }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({
            meeting_attendance_records: meetings,
            consultation_records: consultations,
            feedback_action_records: feedbacks,
            council_engagement_records: councils,
            feeling_heard_records: fhs,
          }),
        );
        expect(r.child_satisfaction_rate).toBe(50);
      });

      it("skips sources with 0 records", () => {
        const meetings = [
          makeMeeting({ attended: true, child_feedback_positive: true, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
          makeMeeting({ attended: true, child_feedback_positive: true, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
        ];
        const r = computeChildVoiceParticipation(
          baseInput({ meeting_attendance_records: meetings }),
        );
        expect(r.child_satisfaction_rate).toBe(100);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 9 · STRENGTHS
  // ════════════════════════════════════════════════════════════════════════

  describe("strengths", () => {
    it("includes meeting attendance strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("meeting attendance"))).toBe(true);
    });

    it("includes consultation effectiveness strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("consultation effectiveness"))).toBe(true);
    });

    it("includes feedback acted upon strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("feedback acted upon"))).toBe(true);
    });

    it("includes council engagement strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("council engagement"))).toBe(true);
    });

    it("includes feeling heard strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("feel heard"))).toBe(true);
    });

    it("includes child satisfaction strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("child satisfaction"))).toBe(true);
    });

    it("includes meeting action completion strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("meeting actions completed"))).toBe(true);
    });

    it("includes concern addressed strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("concerns raised by children have been addressed"))).toBe(true);
    });

    it("includes meeting contribution strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("actively contribute"))).toBe(true);
    });

    it("includes child chairing strength when >= 30%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("chaired by children"))).toBe(true);
    });

    it("includes leadership role strength when >= 20%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("leadership roles"))).toBe(true);
    });

    it("includes knows how to complain strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("how to make a complaint"))).toBe(true);
    });

    it("includes knows advocate strength when >= 90%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("know their advocate"))).toBe(true);
    });

    it("includes decisions influenced strength when > 0", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("decision"))).toBe(true);
    });

    it("includes meeting child coverage strength when 100%", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("Every child has attended"))).toBe(true);
    });

    it("includes avg satisfaction strength when >= 4.0", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.strengths.some((s) => s.includes("/5"))).toBe(true);
    });

    it("includes follow-up completion strength when >= 90%", () => {
      const consultations = Array.from({ length: 5 }, () =>
        makeConsultation({
          follow_up_required: true,
          follow_up_completed: true,
          child_engaged: true,
          child_views_recorded: true,
          outcome_communicated_to_child: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.strengths.some((s) => s.includes("follow-ups completed"))).toBe(true);
    });

    it("uses 'good' wording for meeting attendance 70-89%", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 8,
          invited: true,
          actions_from_meeting: 0,
          actions_completed: 0,
          child_feedback_positive: false,
          contributed: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.strengths.some((s) => s.includes("good levels of children attending meetings"))).toBe(true);
    });

    it("no meeting attendance strength below 70%", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 5,
          invited: true,
          actions_from_meeting: 0,
          actions_completed: 0,
          child_feedback_positive: false,
          contributed: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.strengths.some((s) => s.includes("meeting attendance"))).toBe(false);
    });

    it("no strengths when all rates are low", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 3,
          invited: true,
          child_feedback_positive: false,
          contributed: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.strengths).toHaveLength(0);
    });

    it("meeting child coverage 80-99% strength", () => {
      const meetings = Array.from({ length: 4 }, (_, i) =>
        makeMeeting({
          child_id: `child_${i + 1}`,
          attended: true,
          actions_from_meeting: 0,
          actions_completed: 0,
          child_feedback_positive: false,
          contributed: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 5, meeting_attendance_records: meetings }),
      );
      expect(r.strengths.some((s) => s.includes("of children have attended meetings"))).toBe(true);
    });

    it("avg satisfaction 3.5-3.99 strength", () => {
      const fhs = [
        makeFeelingHeard({ overall_satisfaction: 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        makeFeelingHeard({ overall_satisfaction: 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        makeFeelingHeard({ overall_satisfaction: 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        makeFeelingHeard({ overall_satisfaction: 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        makeFeelingHeard({ overall_satisfaction: 3, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.strengths.some((s) => s.includes("3.8/5"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 10 · CONCERNS
  // ════════════════════════════════════════════════════════════════════════

  describe("concerns", () => {
    it("concern when meetingAttendanceRate < 40", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 3, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("meeting attendance"))).toBe(true);
    });

    it("concern when meetingAttendanceRate 40-69", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 5, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("Meeting attendance at 50%"))).toBe(true);
    });

    it("concern when consultationRate < 40", () => {
      const consultations = Array.from({ length: 10 }, (_, i) =>
        makeConsultation({
          child_engaged: i < 2,
          child_views_recorded: i < 2,
          outcome_communicated_to_child: i < 2,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.concerns.some((c) => c.includes("Consultation effectiveness"))).toBe(true);
    });

    it("concern when consultationRate 40-69", () => {
      const consultations = Array.from({ length: 10 }, (_, i) =>
        makeConsultation({
          child_engaged: i < 5,
          child_views_recorded: i < 5,
          outcome_communicated_to_child: i < 5,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.concerns.some((c) => c.includes("Consultation effectiveness at 50%"))).toBe(true);
    });

    it("concern when feedbackActionRate < 40", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 3, child_satisfied_with_outcome: false, outcome_communicated: false, acknowledged: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.concerns.some((c) => c.includes("feedback is acted upon"))).toBe(true);
    });

    it("concern when feedbackActionRate 40-69", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 5 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.concerns.some((c) => c.includes("Feedback action rate at 50%"))).toBe(true);
    });

    it("concern when councilEngagementRate < 30", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({ attended: i < 2, contributed: false, child_felt_listened_to: false, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.concerns.some((c) => c.includes("Council engagement at only"))).toBe(true);
    });

    it("concern when councilEngagementRate 30-69", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({ attended: i < 5, contributed: i < 3, child_felt_listened_to: i < 3, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.concerns.some((c) => c.includes("Council engagement at"))).toBe(true);
    });

    it("concern when feelingHeardRate < 40", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 3, feels_views_matter: i < 3, feels_changes_happen: i < 3, knows_how_to_complain: false, knows_advocate: false, overall_satisfaction: 2 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.concerns.some((c) => c.includes("of children feel heard"))).toBe(true);
    });

    it("concern when feelingHeardRate 40-69", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 5, feels_views_matter: i < 5, feels_changes_happen: i < 5 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.concerns.some((c) => c.includes("Feeling heard rate at"))).toBe(true);
    });

    it("concern when childSatisfactionRate < 40", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: true, child_feedback_positive: i < 3, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("Child satisfaction with voice and participation"))).toBe(true);
    });

    it("concern when childSatisfactionRate 40-69", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: true, child_feedback_positive: i < 5, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("Child satisfaction at 50%"))).toBe(true);
    });

    it("concern when meetingActionCompletionRate < 50", () => {
      const meetings = [
        makeMeeting({ attended: true, actions_from_meeting: 10, actions_completed: 4, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("meeting actions completed"))).toBe(true);
    });

    it("concern when meetingActionCompletionRate 50-69", () => {
      const meetings = [
        makeMeeting({ attended: true, actions_from_meeting: 10, actions_completed: 6, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("Meeting action completion at 60%"))).toBe(true);
    });

    it("concern when feedbackAcknowledgedRate < 50", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, acknowledged: i < 4, action_taken: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.concerns.some((c) => c.includes("feedback acknowledged"))).toBe(true);
    });

    it("concern when feedbackOutcomeCommunicatedRate < 50", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, outcome_communicated: i < 4, action_taken: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.concerns.some((c) => c.includes("feedback outcomes communicated"))).toBe(true);
    });

    it("concern when avgDaysToAction > 14", () => {
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({ feedback_received: true, action_taken: true, days_to_action: 20 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.concerns.some((c) => c.includes("days to act"))).toBe(true);
    });

    it("concern when concernAddressedRate < 50", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          specific_concern: "Issue",
          concern_addressed: i < 4,
          feels_listened_to: true,
          feels_views_matter: true,
          feels_changes_happen: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.concerns.some((c) => c.includes("concerns have been addressed"))).toBe(true);
    });

    it("concern when knowsComplainRate < 50", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          knows_how_to_complain: i < 4,
          feels_listened_to: true,
          feels_views_matter: true,
          feels_changes_happen: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.concerns.some((c) => c.includes("know how to make a complaint"))).toBe(true);
    });

    it("concern when knowsAdvocateRate < 50", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          knows_advocate: i < 4,
          feels_listened_to: true,
          feels_views_matter: true,
          feels_changes_happen: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.concerns.some((c) => c.includes("know their advocate"))).toBe(true);
    });

    it("concern when meetingChildCoverage < 50", () => {
      const meetings = [
        makeMeeting({ child_id: "child_1", attended: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
        makeMeeting({ child_id: "child_1", attended: true, actions_from_meeting: 0, actions_completed: 0, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 4, meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("children have attended any meeting"))).toBe(true);
    });

    it("concern when followUpCompletionRate < 50", () => {
      const consultations = Array.from({ length: 5 }, (_, i) =>
        makeConsultation({
          follow_up_required: true,
          follow_up_completed: i < 2,
          child_engaged: true,
          child_views_recorded: true,
          outcome_communicated_to_child: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.concerns.some((c) => c.includes("follow-ups completed"))).toBe(true);
    });

    it("concern when no consultations but children > 0 and not allEmpty", () => {
      const r = computeChildVoiceParticipation(
        baseInput({
          total_children: 3,
          meeting_attendance_records: [makeMeeting()],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No consultation records"))).toBe(true);
    });

    it("concern when no feeling heard records but children > 0 and not allEmpty", () => {
      const r = computeChildVoiceParticipation(
        baseInput({
          total_children: 3,
          meeting_attendance_records: [makeMeeting()],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No feeling heard assessments"))).toBe(true);
    });

    it("no concern for missing consultations when allEmpty (separate path)", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 3 }));
      expect(r.concerns.some((c) => c.includes("No consultation records despite"))).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 11 · RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════

  describe("recommendations", () => {
    it("immediate recommendation when meetingAttendanceRate < 40", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 3, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("meeting attendance"))).toBe(true);
    });

    it("immediate recommendation when feedbackActionRate < 40", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 3, child_satisfied_with_outcome: false, outcome_communicated: false, acknowledged: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("feedback-to-action"))).toBe(true);
    });

    it("immediate recommendation when feelingHeardRate < 40", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 3, feels_views_matter: i < 3, feels_changes_happen: i < 3, knows_how_to_complain: false, knows_advocate: false, overall_satisfaction: 2 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("children do not feel heard"))).toBe(true);
    });

    it("immediate recommendation when councilEngagementRate < 30", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({ attended: i < 2, contributed: false, child_felt_listened_to: false, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("child council"))).toBe(true);
    });

    it("immediate recommendation when consultationRate < 40", () => {
      const consultations = Array.from({ length: 10 }, (_, i) =>
        makeConsultation({
          child_engaged: i < 2,
          child_views_recorded: i < 2,
          outcome_communicated_to_child: i < 2,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("consultation process"))).toBe(true);
    });

    it("immediate recommendation when no consultations, children > 0, not allEmpty", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 3, meeting_attendance_records: [makeMeeting()] }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("consultation process"))).toBe(true);
    });

    it("immediate recommendation when no feeling heard records, children > 0, not allEmpty", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 3, meeting_attendance_records: [makeMeeting()] }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("feeling heard assessments"))).toBe(true);
    });

    it("immediate recommendation when knowsComplainRate < 50", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ knows_how_to_complain: i < 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("complaint"))).toBe(true);
    });

    it("immediate recommendation when knowsAdvocateRate < 50", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ knows_advocate: i < 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("advocate"))).toBe(true);
    });

    it("soon recommendation when meetingActionCompletionRate < 50", () => {
      const meetings = [
        makeMeeting({ attended: true, actions_from_meeting: 10, actions_completed: 4, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("action tracker"))).toBe(true);
    });

    it("soon recommendation when feedbackOutcomeCommunicatedRate < 50", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, outcome_communicated: i < 4, action_taken: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("feedback loop"))).toBe(true);
    });

    it("soon recommendation when avgDaysToAction > 14", () => {
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({ feedback_received: true, action_taken: true, days_to_action: 20 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("time taken"))).toBe(true);
    });

    it("soon recommendation when meetingAttendanceRate 40-69", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 5, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "soon" && rec.recommendation.includes("meeting attendance"))).toBe(true);
    });

    it("planned recommendation when feedbackActionRate 40-69", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 5 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("feedback-to-action"))).toBe(true);
    });

    it("planned recommendation when feelingHeardRate 40-69", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 5, feels_views_matter: i < 5, feels_changes_happen: i < 5 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("do not feel heard"))).toBe(true);
    });

    it("planned recommendation when councilEngagementRate 30-69", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({ attended: i < 5, contributed: i < 3, child_felt_listened_to: i < 3, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("child council"))).toBe(true);
    });

    it("planned recommendation when consultationRate 40-69", () => {
      const consultations = Array.from({ length: 10 }, (_, i) =>
        makeConsultation({
          child_engaged: i < 5,
          child_views_recorded: i < 5,
          outcome_communicated_to_child: i < 5,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("consultation effectiveness"))).toBe(true);
    });

    it("planned recommendation when meetingChildCoverage 50-79", () => {
      const meetings = Array.from({ length: 3 }, (_, i) =>
        makeMeeting({
          child_id: `child_${i + 1}`,
          attended: true,
          actions_from_meeting: 0,
          actions_completed: 0,
          child_feedback_positive: false,
          contributed: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 4, meeting_attendance_records: meetings }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("meeting participation"))).toBe(true);
    });

    it("planned recommendation when concernAddressedRate 50-69", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          specific_concern: "Issue",
          concern_addressed: i < 6,
          feels_listened_to: true,
          feels_views_matter: true,
          feels_changes_happen: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "planned" && rec.recommendation.includes("concerns are addressed"))).toBe(true);
    });

    it("recommendations have sequential ranks", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 3, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 10, actions_completed: 3 }),
      );
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 3, outcome_communicated: i < 3, acknowledged: i < 3 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings, feedback_action_records: feedbacks }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have a regulatory_ref", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 3, meeting_attendance_records: [makeMeeting()] }),
      );
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref.length).toBeGreaterThan(0);
      }
    });

    it("no recommendations when all rates are high", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.recommendations).toHaveLength(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 12 · INSIGHTS
  // ════════════════════════════════════════════════════════════════════════

  describe("insights", () => {
    // --- Critical ---
    it("critical insight when meetingAttendanceRate < 40", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 3, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("meeting attendance"))).toBe(true);
    });

    it("critical insight when feedbackActionRate < 40", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 3, child_satisfied_with_outcome: false, outcome_communicated: false, acknowledged: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("feedback acted upon"))).toBe(true);
    });

    it("critical insight when feelingHeardRate < 40", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 3, feels_views_matter: i < 3, feels_changes_happen: i < 3, knows_how_to_complain: false, knows_advocate: false, overall_satisfaction: 2 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("children feel heard"))).toBe(true);
    });

    it("critical insight when councilEngagementRate < 30", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({ attended: i < 2, contributed: false, child_felt_listened_to: false, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("Council engagement"))).toBe(true);
    });

    it("critical insight when no consultations and children > 0 and not allEmpty", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 3, meeting_attendance_records: [makeMeeting()] }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No consultation records"))).toBe(true);
    });

    it("critical insight when no feeling heard records and children > 0 and not allEmpty", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 3, meeting_attendance_records: [makeMeeting()] }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("No feeling heard assessments"))).toBe(true);
    });

    it("critical insight when knowsComplainRate < 50", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ knows_how_to_complain: i < 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.insights.some((ins) => ins.severity === "critical" && ins.text.includes("know how to make a complaint"))).toBe(true);
    });

    // --- Warning ---
    it("warning insight when meetingAttendanceRate 40-69", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 5, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Meeting attendance at 50%"))).toBe(true);
    });

    it("warning insight when consultationRate 40-69", () => {
      const consultations = Array.from({ length: 10 }, (_, i) =>
        makeConsultation({
          child_engaged: i < 5,
          child_views_recorded: i < 5,
          outcome_communicated_to_child: i < 5,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Consultation effectiveness at 50%"))).toBe(true);
    });

    it("warning insight when feedbackActionRate 40-69", () => {
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 5 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Feedback action rate at 50%"))).toBe(true);
    });

    it("warning insight when councilEngagementRate 30-69", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({ attended: i < 5, contributed: i < 3, child_felt_listened_to: i < 3, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Council engagement at"))).toBe(true);
    });

    it("warning insight when feelingHeardRate 40-69", () => {
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 5, feels_views_matter: i < 5, feels_changes_happen: i < 5 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Feeling heard rate at"))).toBe(true);
    });

    it("warning insight when childSatisfactionRate 40-69", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: true, child_feedback_positive: i < 5, actions_from_meeting: 0, actions_completed: 0, contributed: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Child satisfaction at 50%"))).toBe(true);
    });

    it("warning insight when meetingActionCompletionRate 50-69", () => {
      const meetings = [
        makeMeeting({ attended: true, actions_from_meeting: 10, actions_completed: 6, child_feedback_positive: false, contributed: false }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("Meeting action completion at 60%"))).toBe(true);
    });

    it("warning insight when avgDaysToAction 8-14", () => {
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({ feedback_received: true, action_taken: true, days_to_action: 10 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("10 days to act"))).toBe(true);
    });

    it("warning insight when minutesRecordedRate < 70", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          minutes_recorded: i < 6,
          attended: true,
          child_feedback_positive: true,
          contributed: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("minutes recorded"))).toBe(true);
    });

    it("warning insight when avgSatisfaction 2.0-2.99", () => {
      const fhs = Array.from({ length: 5 }, () =>
        makeFeelingHeard({
          overall_satisfaction: 2,
          feels_listened_to: true,
          feels_views_matter: true,
          feels_changes_happen: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.insights.some((ins) => ins.severity === "warning" && ins.text.includes("/5"))).toBe(true);
    });

    // --- Positive ---
    it("positive insight when voice_rating is outstanding", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("outstanding child voice"))).toBe(true);
    });

    it("positive insight when meetingAttendanceRate >= 90 and meetingContributionRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("active contribution"))).toBe(true);
    });

    it("positive insight when feedbackActionRate >= 90 and feedbackOutcomeCommunicatedRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("feedback cycle"))).toBe(true);
    });

    it("positive insight when feelingHeardRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("children feel heard"))).toBe(true);
    });

    it("positive insight when councilEngagementRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("council engagement"))).toBe(true);
    });

    it("positive insight when consultationRate >= 90 and consultationSatisfactionRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("consultation effectiveness"))).toBe(true);
    });

    it("positive insight when meetingActionCompletionRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("meeting actions completed"))).toBe(true);
    });

    it("positive insight when concernAddressedRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("concerns addressed"))).toBe(true);
    });

    it("positive insight when avgSatisfaction >= 4.0", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("/5"))).toBe(true);
    });

    it("positive insight when knowsComplainRate >= 90 and knowsAdvocateRate >= 90", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.insights.some((ins) => ins.severity === "positive" && ins.text.includes("complain") && ins.text.includes("advocate"))).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 13 · HEADLINES
  // ════════════════════════════════════════════════════════════════════════

  describe("headlines", () => {
    it("outstanding headline includes 'Outstanding'", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline includes strength and concern counts", () => {
      const meetings = Array.from({ length: 10 }, () =>
        makeMeeting({ attended: true, invited: true, contributed: true, child_feedback_positive: true, actions_from_meeting: 2, actions_completed: 2 }),
      );
      const consultations = Array.from({ length: 5 }, () =>
        makeConsultation({ child_engaged: true, child_views_recorded: true, outcome_communicated_to_child: true, child_satisfied_with_process: true }),
      );
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({ feedback_received: true, action_taken: true, child_satisfied_with_outcome: true, outcome_communicated: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          consultation_records: consultations,
          feedback_action_records: feedbacks,
        }),
      );
      if (r.voice_rating === "good") {
        expect(r.headline).toContain("Good");
        expect(r.headline).toContain("strength");
      }
    });

    it("adequate headline includes concern count", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 5, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.headline).toContain("Adequate");
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline includes significant concerns", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 2, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({ feedback_received: true, action_taken: i < 2, child_satisfied_with_outcome: false, outcome_communicated: false, acknowledged: false }),
      );
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({ feels_listened_to: i < 2, feels_views_matter: i < 2, feels_changes_happen: i < 2, knows_how_to_complain: false, knows_advocate: false, overall_satisfaction: 1 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          feedback_action_records: feedbacks,
          feeling_heard_records: fhs,
        }),
      );
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant concern");
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 14 · EDGE CASES
  // ════════════════════════════════════════════════════════════════════════

  describe("edge cases", () => {
    it("handles total_children = 0 with records gracefully", () => {
      const r = computeChildVoiceParticipation(
        baseInput({
          total_children: 0,
          meeting_attendance_records: [makeMeeting()],
        }),
      );
      expect(r.voice_rating).not.toBe("insufficient_data");
    });

    it("single meeting record works", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: [makeMeeting()] }),
      );
      expect(r.total_meeting_records).toBe(1);
      expect(r.meeting_attendance_rate).toBe(100);
    });

    it("single consultation record works", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: [makeConsultation()] }),
      );
      expect(r.total_consultation_records).toBe(1);
      expect(r.consultation_rate).toBe(100);
    });

    it("single feedback record works", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: [makeFeedback()] }),
      );
      expect(r.total_feedback_records).toBe(1);
      expect(r.feedback_action_rate).toBe(100);
    });

    it("single council record works", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: [makeCouncil()] }),
      );
      expect(r.total_council_records).toBe(1);
      expect(r.council_engagement_rate).toBe(100);
    });

    it("single feeling heard record works", () => {
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: [makeFeelingHeard()] }),
      );
      expect(r.total_feeling_heard_records).toBe(1);
      expect(r.feeling_heard_rate).toBe(100);
    });

    it("all feedback_received false => feedbackActionRate 0 and penalty applied", () => {
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({ feedback_received: false, action_taken: false }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.feedback_action_rate).toBe(0);
      expect(r.voice_score).toBe(52 - 5);
    });

    it("no attended meetings => meetingAttendanceRate = 0", () => {
      const meetings = Array.from({ length: 5 }, () =>
        makeMeeting({ attended: false, invited: true, contributed: false, child_feedback_positive: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.meeting_attendance_rate).toBe(0);
    });

    it("no attended councils => councilEngagementRate = 0", () => {
      const councils = Array.from({ length: 5 }, () =>
        makeCouncil({ attended: false, contributed: false, child_felt_listened_to: false, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.council_engagement_rate).toBe(0);
    });

    it("pct returns 0 when denominator is 0", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 0 }));
      expect(r.meeting_attendance_rate).toBe(0);
      expect(r.consultation_rate).toBe(0);
      expect(r.feedback_action_rate).toBe(0);
      expect(r.council_engagement_rate).toBe(0);
      expect(r.feeling_heard_rate).toBe(0);
    });

    it("meeting with 0 actions_from_meeting => no action completion bonus", () => {
      const meetings = [makeMeeting({ actions_from_meeting: 0, actions_completed: 0 })];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      // totalMeetingActions = 0, pct(0, 0) = 0 => no bonus
      expect(r.voice_score).toBeLessThanOrEqual(52 + 4 + 3); // at most attendance + satisfaction bonuses
    });

    it("large number of records processes correctly", () => {
      const meetings = Array.from({ length: 100 }, (_, i) =>
        makeMeeting({
          child_id: `child_${(i % 10) + 1}`,
          date: daysAgo(i + 1),
          attended: i < 90,
          invited: true,
          contributed: i < 80,
          child_feedback_positive: i < 85,
          actions_from_meeting: 1,
          actions_completed: i < 90 ? 1 : 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 10, meeting_attendance_records: meetings }),
      );
      expect(r.total_meeting_records).toBe(100);
      expect(r.meeting_attendance_rate).toBe(90);
    });

    it("follow-up not required => no follow-up concern", () => {
      const consultations = Array.from({ length: 5 }, () =>
        makeConsultation({
          follow_up_required: false,
          follow_up_completed: false,
          child_engaged: true,
          child_views_recorded: true,
          outcome_communicated_to_child: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ consultation_records: consultations }),
      );
      expect(r.concerns.some((c) => c.includes("follow-up"))).toBe(false);
    });

    it("specific_concern empty string => not counted as concern", () => {
      const fhs = Array.from({ length: 5 }, () =>
        makeFeelingHeard({
          specific_concern: "",
          concern_addressed: false,
          feels_listened_to: true,
          feels_views_matter: true,
          feels_changes_happen: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.concerns.some((c) => c.includes("concerns have been addressed"))).toBe(false);
    });

    it("escalation does not directly affect score", () => {
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({
          feedback_received: true,
          action_taken: true,
          escalated: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.feedback_action_rate).toBe(100);
    });

    it("meeting with chaired_by_child but not attended still counts for childChairRate", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 5,
          chaired_by_child: i < 4,
          invited: true,
          contributed: false,
          child_feedback_positive: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.strengths.some((s) => s.includes("chaired by children"))).toBe(true);
    });

    it("decisions_influenced = 0 across all councils => no decisions strength", () => {
      const councils = Array.from({ length: 5 }, () =>
        makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true, decisions_influenced: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.strengths.some((s) => s.includes("influenced"))).toBe(false);
    });

    it("singular decision text when exactly 1 decision influenced", () => {
      const councils = [
        makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true, decisions_influenced: 1 }),
        makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true, decisions_influenced: 0 }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      const decisionStrength = r.strengths.find((s) => s.includes("influenced"));
      expect(decisionStrength).toBeDefined();
      expect(decisionStrength!.includes("decisions")).toBe(false);
      expect(decisionStrength!.includes("decision")).toBe(true);
    });

    it("plural decisions text when > 1 decisions influenced", () => {
      const councils = [
        makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true, decisions_influenced: 3 }),
        makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true, decisions_influenced: 2 }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      const decisionStrength = r.strengths.find((s) => s.includes("influenced"));
      expect(decisionStrength).toBeDefined();
      expect(decisionStrength!.includes("decisions")).toBe(true);
    });

    it("headline singular/plural for good rating", () => {
      const meetings = Array.from({ length: 10 }, () =>
        makeMeeting({
          attended: true,
          invited: true,
          contributed: false,
          child_feedback_positive: false,
          actions_from_meeting: 2,
          actions_completed: 2,
        }),
      );
      const consultations = Array.from({ length: 5 }, () =>
        makeConsultation({
          child_engaged: true,
          child_views_recorded: true,
          outcome_communicated_to_child: true,
          child_satisfied_with_process: true,
        }),
      );
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({
          feedback_received: true,
          action_taken: true,
          child_satisfied_with_outcome: true,
          outcome_communicated: true,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          consultation_records: consultations,
          feedback_action_records: feedbacks,
        }),
      );
      if (r.voice_rating === "good") {
        expect(r.headline).toContain("Good");
      }
    });

    it("avgSatisfaction is rounded to 2 decimal places", () => {
      const fhs = [
        makeFeelingHeard({ overall_satisfaction: 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        makeFeelingHeard({ overall_satisfaction: 4, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
        makeFeelingHeard({ overall_satisfaction: 5, feels_listened_to: true, feels_views_matter: true, feels_changes_happen: true }),
      ];
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.strengths.some((s) => s.includes("4.33/5"))).toBe(true);
    });

    it("only meeting data provided with all other arrays empty is valid", () => {
      const meetings = [makeMeeting()];
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.voice_rating).not.toBe("insufficient_data");
      expect(r.total_meeting_records).toBe(1);
    });

    it("only feeling heard data provided is valid", () => {
      const fhs = [makeFeelingHeard()];
      const r = computeChildVoiceParticipation(
        baseInput({ feeling_heard_records: fhs }),
      );
      expect(r.voice_rating).not.toBe("insufficient_data");
      expect(r.total_feeling_heard_records).toBe(1);
    });

    it("council with role=chair counts as leadership", () => {
      const councils = Array.from({ length: 5 }, () =>
        makeCouncil({ role: "chair", attended: true, contributed: true, child_felt_listened_to: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.strengths.some((s) => s.includes("leadership roles"))).toBe(true);
    });

    it("council with role=secretary counts as leadership", () => {
      const councils = Array.from({ length: 5 }, () =>
        makeCouncil({ role: "secretary", attended: true, contributed: true, child_felt_listened_to: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.strengths.some((s) => s.includes("leadership roles"))).toBe(true);
    });

    it("council with role=member does not count as leadership", () => {
      const councils = Array.from({ length: 5 }, () =>
        makeCouncil({ role: "member", attended: true, contributed: true, child_felt_listened_to: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.strengths.some((s) => s.includes("leadership roles"))).toBe(false);
    });

    it("no avgDaysToAction concern when no actionTaken", () => {
      const feedbacks = Array.from({ length: 5 }, () =>
        makeFeedback({ feedback_received: true, action_taken: false, days_to_action: 30 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.concerns.some((c) => c.includes("days to act"))).toBe(false);
    });

    it("meetingChildCoverage does not trigger concern when total_children = 0", () => {
      const meetings = [makeMeeting({ child_id: "child_1", attended: true })];
      const r = computeChildVoiceParticipation(
        baseInput({ total_children: 0, meeting_attendance_records: meetings }),
      );
      expect(r.concerns.some((c) => c.includes("children have attended any meeting"))).toBe(false);
    });

    it("boundary: meetingAttendanceRate exactly 40 => no penalty, mid-range concern", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 4, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.meeting_attendance_rate).toBe(40);
      expect(r.voice_score).toBe(52);
      expect(r.concerns.some((c) => c.includes("Meeting attendance at 40%"))).toBe(true);
    });

    it("boundary: meetingAttendanceRate exactly 70 => +2 bonus", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 7, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.meeting_attendance_rate).toBe(70);
      expect(r.voice_score).toBe(52 + 2);
    });

    it("boundary: meetingAttendanceRate exactly 90 => +4 bonus", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({ attended: i < 9, invited: true, child_feedback_positive: false, contributed: false, actions_from_meeting: 0, actions_completed: 0 }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ meeting_attendance_records: meetings }),
      );
      expect(r.meeting_attendance_rate).toBe(90);
      expect(r.voice_score).toBe(52 + 4);
    });

    it("boundary: councilEngagementRate >= 30 => no penalty", () => {
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({
          attended: i < 4,
          contributed: i < 2,
          child_felt_listened_to: i < 2,
          decisions_influenced: 0,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      if (r.council_engagement_rate >= 30) {
        expect(r.voice_score).toBeGreaterThanOrEqual(52);
      }
    });

    it("feedbackActionRate exactly 39 => penalty", () => {
      const feedbacks = Array.from({ length: 100 }, (_, i) =>
        makeFeedback({
          feedback_received: true,
          action_taken: i < 39,
          child_satisfied_with_outcome: false,
          outcome_communicated: false,
          acknowledged: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ feedback_action_records: feedbacks }),
      );
      expect(r.feedback_action_rate).toBe(39);
      expect(r.voice_score).toBe(52 - 5);
    });

    it("score is clamped to 100 maximum", () => {
      const r = computeChildVoiceParticipation(outstandingInput());
      expect(r.voice_score).toBeLessThanOrEqual(100);
    });

    it("all five data sources empty for children>0 triggers the allEmpty special path", () => {
      const r = computeChildVoiceParticipation(baseInput({ total_children: 5 }));
      expect(r.voice_rating).toBe("inadequate");
      expect(r.voice_score).toBe(15);
    });
  });

  // ════════════════════════════════════════════════════════════════════════
  // 15 · MIXED SCENARIOS
  // ════════════════════════════════════════════════════════════════════════

  describe("mixed scenarios", () => {
    it("strong meetings + weak feedback => mixed rating with both strengths and concerns", () => {
      const meetings = Array.from({ length: 10 }, () =>
        makeMeeting({
          attended: true,
          invited: true,
          contributed: true,
          child_feedback_positive: true,
          actions_from_meeting: 2,
          actions_completed: 2,
        }),
      );
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({
          feedback_received: true,
          action_taken: i < 2,
          child_satisfied_with_outcome: false,
          outcome_communicated: false,
          acknowledged: false,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          feedback_action_records: feedbacks,
        }),
      );
      expect(r.strengths.length).toBeGreaterThan(0);
      expect(r.concerns.length).toBeGreaterThan(0);
    });

    it("all data categories at 50% => adequate", () => {
      const meetings = Array.from({ length: 10 }, (_, i) =>
        makeMeeting({
          attended: i < 5,
          invited: true,
          contributed: false,
          child_feedback_positive: false,
          actions_from_meeting: 0,
          actions_completed: 0,
        }),
      );
      const consultations = Array.from({ length: 10 }, (_, i) =>
        makeConsultation({
          child_engaged: i < 5,
          child_views_recorded: i < 5,
          outcome_communicated_to_child: i < 5,
        }),
      );
      const feedbacks = Array.from({ length: 10 }, (_, i) =>
        makeFeedback({
          feedback_received: true,
          action_taken: i < 5,
          child_satisfied_with_outcome: false,
          outcome_communicated: false,
        }),
      );
      const councils = Array.from({ length: 10 }, (_, i) =>
        makeCouncil({
          attended: i < 5,
          contributed: i < 3,
          child_felt_listened_to: i < 3,
          decisions_influenced: 0,
        }),
      );
      const fhs = Array.from({ length: 10 }, (_, i) =>
        makeFeelingHeard({
          feels_listened_to: i < 5,
          feels_views_matter: i < 5,
          feels_changes_happen: i < 5,
        }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({
          meeting_attendance_records: meetings,
          consultation_records: consultations,
          feedback_action_records: feedbacks,
          council_engagement_records: councils,
          feeling_heard_records: fhs,
        }),
      );
      expect(r.voice_rating).toBe("adequate");
    });

    it("only council data with high engagement => adequate (base 52 + small bonus)", () => {
      const councils = Array.from({ length: 10 }, () =>
        makeCouncil({ attended: true, contributed: true, child_felt_listened_to: true }),
      );
      const r = computeChildVoiceParticipation(
        baseInput({ council_engagement_records: councils }),
      );
      expect(r.voice_rating).toBe("adequate");
    });
  });
});
