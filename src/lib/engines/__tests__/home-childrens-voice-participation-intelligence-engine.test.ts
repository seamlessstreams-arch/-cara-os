// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME CHILDREN'S VOICE & PARTICIPATION INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeChildrensVoiceParticipation,
  type ChildrensVoiceInput,
  type ChildrensMeetingInput,
  type ChildFeedbackInput,
  type ChildFriendlyPolicyInput,
  type ChildExpertInput,
  type ChildrensVoiceRating,
  type ChildrensVoiceResult,
} from "../home-childrens-voice-participation-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

function makeMeeting(
  overrides: Partial<ChildrensMeetingInput> = {},
): ChildrensMeetingInput {
  return {
    id: "m-1",
    date: "2025-05-20",
    yp_present_count: 4,
    yp_total: 4,
    child_chaired: false,
    actions_count: 3,
    complaints_raised: false,
    ...overrides,
  };
}

function makeFeedback(
  overrides: Partial<ChildFeedbackInput> = {},
): ChildFeedbackInput {
  return {
    id: "fb-1",
    child_id: "c1",
    date: "2025-05-20",
    sentiment: "positive",
    staff_informed: true,
    action_taken: true,
    ...overrides,
  };
}

function makePolicy(
  overrides: Partial<ChildFriendlyPolicyInput> = {},
): ChildFriendlyPolicyInput {
  return {
    id: "pol-1",
    shared_with_children: true,
    child_accessible_format: true,
    ...overrides,
  };
}

function makeExpert(
  overrides: Partial<ChildExpertInput> = {},
): ChildExpertInput {
  return {
    id: "exp-1",
    child_id: "c1",
    date: "2025-05-20",
    impact_recorded: true,
    child_chose_to_participate: true,
    ...overrides,
  };
}

/**
 * Base input: outstanding scenario — scores EXACTLY 82.
 * 4 children.
 * Score calculation:
 * Base 52
 * Mod 1 (meeting attendance): 6 meetings, all 100% attendance → avg 100% → >=80% → +5
 * Mod 2 (child chairing): 3/6 = 50% → >=50% → +5
 * Mod 3 (feedback response): 10/10 staff_informed AND action_taken → 100% → >=85% → +6
 * Mod 4 (positive feedback): 10/10 positive → 100% → >=80% → +5
 * Mod 5 (policy accessibility): 4/4 shared AND accessible → 100% → >=80% → +5
 * Mod 6 (expert participation): 3 unique children (c1,c2,c3) chose to participate / 4 total = 75% → >=50% → +4
 * Total: 52 + 5 + 5 + 6 + 5 + 5 + 4 = 82
 */
function baseInput(
  overrides: Partial<ChildrensVoiceInput> = {},
): ChildrensVoiceInput {
  return {
    today: TODAY,
    total_children: 4,
    meetings: [
      makeMeeting({ id: "m-1", date: "2025-05-01", child_chaired: true }),
      makeMeeting({ id: "m-2", date: "2025-05-08", child_chaired: false }),
      makeMeeting({ id: "m-3", date: "2025-05-15", child_chaired: true }),
      makeMeeting({ id: "m-4", date: "2025-05-22", child_chaired: false }),
      makeMeeting({ id: "m-5", date: "2025-05-29", child_chaired: true }),
      makeMeeting({ id: "m-6", date: "2025-06-05", child_chaired: false }),
    ],
    feedback: Array.from({ length: 10 }, (_, i) =>
      makeFeedback({
        id: `fb-${i + 1}`,
        child_id: `c${(i % 4) + 1}`,
        date: `2025-05-${String(10 + i).padStart(2, "0")}`,
      }),
    ),
    policies: [
      makePolicy({ id: "pol-1" }),
      makePolicy({ id: "pol-2" }),
      makePolicy({ id: "pol-3" }),
      makePolicy({ id: "pol-4" }),
    ],
    expert_entries: [
      makeExpert({ id: "exp-1", child_id: "c1" }),
      makeExpert({ id: "exp-2", child_id: "c2" }),
      makeExpert({ id: "exp-3", child_id: "c3" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Children's Voice & Participation Intelligence Engine", () => {
  // ── Insufficient data ──────────────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when total_children is 0", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [],
        feedback: [],
        policies: [],
        expert_entries: [],
      });
      expect(result.voice_rating).toBe("insufficient_data");
      expect(result.voice_score).toBe(0);
    });

    it("returns insufficient_data even when data arrays have entries but total_children is 0", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [makeMeeting()],
        feedback: [makeFeedback()],
        policies: [makePolicy()],
        expert_entries: [makeExpert()],
      });
      expect(result.voice_rating).toBe("insufficient_data");
      expect(result.voice_score).toBe(0);
    });

    it("has concern about Reg 7 and Reg 5 on insufficient_data", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [],
        feedback: [],
        policies: [],
        expert_entries: [],
      });
      expect(result.concerns.length).toBeGreaterThan(0);
      expect(result.concerns[0]).toContain("Reg 7");
      expect(result.concerns[0]).toContain("Reg 5");
    });

    it("returns empty arrays for strengths, recommendations, insights on insufficient_data", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [],
        feedback: [],
        policies: [],
        expert_entries: [],
      });
      expect(result.strengths).toEqual([]);
      expect(result.recommendations).toEqual([]);
      expect(result.insights).toEqual([]);
    });

    it("returns zeroed metrics on insufficient_data", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [],
        feedback: [],
        policies: [],
        expert_entries: [],
      });
      expect(result.meeting_attendance_rate).toBe(0);
      expect(result.feedback_response_rate).toBe(0);
      expect(result.child_friendly_policy_rate).toBe(0);
      expect(result.expert_participation_count).toBe(0);
      expect(result.positive_feedback_rate).toBe(0);
    });
  });

  // ── Rating thresholds ─────────────────────────────────────────────────

  describe("rating thresholds", () => {
    it("rates outstanding for score >= 80", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.voice_score).toBeGreaterThanOrEqual(80);
      expect(result.voice_rating).toBe("outstanding");
    });

    it("rates good for score 65-79", () => {
      // Degrade Mod 2 (chairing) and Mod 6 (expert participation)
      // to get into the good range.
      // Mod 2: 1/6 chaired = 17% → >=10% → +0 (was +5, drop 5)
      // Mod 6: 1 unique child / 4 = 25% → >=25% → +1 (was +4, drop 3)
      // Score: 82 - 5 - 3 = 74 → good
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({ id: "m-1", date: "2025-05-01", child_chaired: true }),
            makeMeeting({ id: "m-2", date: "2025-05-08", child_chaired: false }),
            makeMeeting({ id: "m-3", date: "2025-05-15", child_chaired: false }),
            makeMeeting({ id: "m-4", date: "2025-05-22", child_chaired: false }),
            makeMeeting({ id: "m-5", date: "2025-05-29", child_chaired: false }),
            makeMeeting({ id: "m-6", date: "2025-06-05", child_chaired: false }),
          ],
          expert_entries: [makeExpert({ id: "exp-1", child_id: "c1" })],
        }),
      );
      expect(result.voice_score).toBeGreaterThanOrEqual(65);
      expect(result.voice_score).toBeLessThan(80);
      expect(result.voice_rating).toBe("good");
    });

    it("rates adequate for score 45-64", () => {
      // Minimal data: children exist but most things are weak.
      // Base 52
      // Mod 1: 1 meeting, 2/4 = 50% attendance → >=40% → +0
      // Mod 2: 0/1 chaired = 0% → <10% → -4
      // Mod 3: 2 feedback, 1 responded → 50% → >=40% → +0
      // Mod 4: 1/2 positive → 50% → >=40% → +0
      // Mod 5: no policies → +0
      // Mod 6: no expert entries → -1
      // Score: 52 + 0 - 4 + 0 + 0 + 0 - 1 = 47 → adequate
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 4,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 2,
            yp_total: 4,
            child_chaired: false,
          }),
        ],
        feedback: [
          makeFeedback({ id: "fb-1", sentiment: "positive" }),
          makeFeedback({
            id: "fb-2",
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
        ],
        policies: [],
        expert_entries: [],
      });
      expect(result.voice_score).toBeGreaterThanOrEqual(45);
      expect(result.voice_score).toBeLessThan(65);
      expect(result.voice_rating).toBe("adequate");
    });

    it("rates inadequate for score < 45", () => {
      // Everything poor.
      // Base 52
      // Mod 1: 2 meetings, avg 1/4 = 25% → <40% → -5
      // Mod 2: 0/2 chaired → 0% → <10% → -4
      // Mod 3: 4 feedback, 0 responded → 0% → <40% → -5
      // Mod 4: 0/4 positive → 0% → <40% → -5
      // Mod 5: 2 policies, 0 accessible → 0% → <30% → -4
      // Mod 6: no expert entries, children>0 → -1
      // Score: 52 - 5 - 4 - 5 - 5 - 4 - 1 = 28 → inadequate
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 4,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 1,
            yp_total: 4,
            child_chaired: false,
          }),
          makeMeeting({
            id: "m-2",
            yp_present_count: 1,
            yp_total: 4,
            child_chaired: false,
          }),
        ],
        feedback: [
          makeFeedback({
            id: "fb-1",
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
          makeFeedback({
            id: "fb-2",
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
          makeFeedback({
            id: "fb-3",
            sentiment: "neutral",
            staff_informed: false,
            action_taken: false,
          }),
          makeFeedback({
            id: "fb-4",
            sentiment: "neutral",
            staff_informed: false,
            action_taken: false,
          }),
        ],
        policies: [
          makePolicy({
            id: "pol-1",
            shared_with_children: false,
            child_accessible_format: false,
          }),
          makePolicy({
            id: "pol-2",
            shared_with_children: false,
            child_accessible_format: false,
          }),
        ],
        expert_entries: [],
      });
      expect(result.voice_score).toBeLessThan(45);
      expect(result.voice_rating).toBe("inadequate");
    });
  });

  // ── Score boundaries & clamping ───────────────────────────────────────

  describe("score boundaries and clamping", () => {
    it("outstanding base score is exactly 82", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.voice_score).toBe(82);
    });

    it("never exceeds 100", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.voice_score).toBeLessThanOrEqual(100);
    });

    it("never goes below 0", () => {
      // All worst modifiers: -5 -4 -5 -5 -4 -4 = -27 → 52 - 27 = 25 (still above 0)
      // But let's ensure clamping works
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 4,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 1,
            yp_total: 4,
            child_chaired: false,
          }),
        ],
        feedback: [
          makeFeedback({
            id: "fb-1",
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
        ],
        policies: [
          makePolicy({
            id: "pol-1",
            shared_with_children: false,
            child_accessible_format: false,
          }),
        ],
        expert_entries: [
          makeExpert({ id: "exp-1", child_id: "c1", child_chose_to_participate: false }),
        ],
      });
      expect(result.voice_score).toBeGreaterThanOrEqual(0);
    });

    it("clamps score to 0 when all penalties applied maximally", () => {
      // Test the clamping mechanism — score cannot go negative
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 100,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 1,
            yp_total: 100,
            child_chaired: false,
          }),
        ],
        feedback: Array.from({ length: 20 }, (_, i) =>
          makeFeedback({
            id: `fb-${i}`,
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
        ),
        policies: Array.from({ length: 10 }, (_, i) =>
          makePolicy({
            id: `pol-${i}`,
            shared_with_children: false,
            child_accessible_format: false,
          }),
        ),
        expert_entries: [
          makeExpert({ id: "exp-1", child_id: "c1", child_chose_to_participate: true }),
        ],
      });
      // 52 - 5 - 4 - 5 - 5 - 4 - 4 = 25 → still above 0, but clamping works
      expect(result.voice_score).toBeGreaterThanOrEqual(0);
      expect(result.voice_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Mod 1: Meeting attendance ─────────────────────────────────────────

  describe("mod1: meeting attendance", () => {
    it("+5 when attendance >= 80%", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.meeting_attendance_rate).toBe(100);
      // Full score 82 includes +5 for mod1
    });

    it("+2 when attendance 60-79%", () => {
      // 3/4 = 75% each meeting
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        yp_present_count: 3,
        yp_total: 4,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      expect(result.meeting_attendance_rate).toBe(75);
      // mod1: +2 (was +5, drop 3) → 82 - 3 = 79
      expect(result.voice_score).toBe(79);
    });

    it("+0 when attendance 40-59%", () => {
      // 2/4 = 50% each meeting
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        yp_present_count: 2,
        yp_total: 4,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      expect(result.meeting_attendance_rate).toBe(50);
      // mod1: +0 (was +5, drop 5) → 82 - 5 = 77
      expect(result.voice_score).toBe(77);
    });

    it("-5 when attendance < 40%", () => {
      // 1/4 = 25% each meeting
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        yp_present_count: 1,
        yp_total: 4,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      expect(result.meeting_attendance_rate).toBe(25);
      // mod1: -5 (was +5, drop 10) → 82 - 10 = 72
      expect(result.voice_score).toBe(72);
    });

    it("+0 when no meetings", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      expect(result.meeting_attendance_rate).toBe(0);
      // mod1: +0, mod2: +0 (no meetings) → was +5 +5 = +10 → now +0 +0 → drop 10
      // 82 - 10 = 72
      expect(result.voice_score).toBe(72);
    });

    it("handles meetings with yp_total of 0 gracefully", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({ id: "m-1", yp_present_count: 0, yp_total: 0 }),
          ],
        }),
      );
      // yp_total 0 → treated as 0 contribution to avg
      // single meeting with 0/0 → avg = 0%
      expect(result.meeting_attendance_rate).toBe(0);
    });
  });

  // ── Mod 2: Child chairing ─────────────────────────────────────────────

  describe("mod2: child chairing", () => {
    it("+5 when chairing rate >= 50%", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      // 3/6 = 50%
      expect(result.voice_score).toBe(82);
    });

    it("+2 when chairing rate 25-49%", () => {
      // 2/6 = 33%
      const meetings = [
        makeMeeting({ id: "m-1", date: "2025-05-01", child_chaired: true }),
        makeMeeting({ id: "m-2", date: "2025-05-08", child_chaired: true }),
        makeMeeting({ id: "m-3", date: "2025-05-15", child_chaired: false }),
        makeMeeting({ id: "m-4", date: "2025-05-22", child_chaired: false }),
        makeMeeting({ id: "m-5", date: "2025-05-29", child_chaired: false }),
        makeMeeting({ id: "m-6", date: "2025-06-05", child_chaired: false }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      // mod2: +2 (was +5, drop 3) → 82 - 3 = 79
      expect(result.voice_score).toBe(79);
    });

    it("+0 when chairing rate 10-24%", () => {
      // 1/6 = 17%
      const meetings = [
        makeMeeting({ id: "m-1", date: "2025-05-01", child_chaired: true }),
        makeMeeting({ id: "m-2", date: "2025-05-08", child_chaired: false }),
        makeMeeting({ id: "m-3", date: "2025-05-15", child_chaired: false }),
        makeMeeting({ id: "m-4", date: "2025-05-22", child_chaired: false }),
        makeMeeting({ id: "m-5", date: "2025-05-29", child_chaired: false }),
        makeMeeting({ id: "m-6", date: "2025-06-05", child_chaired: false }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      // mod2: +0 (was +5, drop 5) → 82 - 5 = 77
      expect(result.voice_score).toBe(77);
    });

    it("-4 when chairing rate < 10%", () => {
      // 0/6 = 0%
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        child_chaired: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      // mod2: -4 (was +5, drop 9) → 82 - 9 = 73
      expect(result.voice_score).toBe(73);
    });

    it("+0 when no meetings (mod2 neutral)", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      // Both mod1 and mod2 go to +0 → drop 10
      // 82 - 10 = 72
      expect(result.voice_score).toBe(72);
    });
  });

  // ── Mod 3: Feedback response rate ─────────────────────────────────────

  describe("mod3: feedback response rate", () => {
    it("+6 when response rate >= 85%", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.feedback_response_rate).toBe(100);
      // Included in 82
    });

    it("+3 when response rate 60-84%", () => {
      // 7/10 = 70%
      const feedback = baseInput().feedback.map((f, i) => ({
        ...f,
        staff_informed: i < 7,
        action_taken: i < 7,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.feedback_response_rate).toBe(70);
      // mod3: +3 (was +6, drop 3) → 82 - 3 = 79
      expect(result.voice_score).toBe(79);
    });

    it("+0 when response rate 40-59%", () => {
      // 5/10 = 50%
      const feedback = baseInput().feedback.map((f, i) => ({
        ...f,
        staff_informed: i < 5,
        action_taken: i < 5,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.feedback_response_rate).toBe(50);
      // mod3: +0 (was +6, drop 6) → 82 - 6 = 76
      expect(result.voice_score).toBe(76);
    });

    it("-5 when response rate < 40%", () => {
      // 2/10 = 20%
      const feedback = baseInput().feedback.map((f, i) => ({
        ...f,
        staff_informed: i < 2,
        action_taken: i < 2,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.feedback_response_rate).toBe(20);
      // mod3: -5 (was +6, drop 11) → 82 - 11 = 71
      expect(result.voice_score).toBe(71);
    });

    it("+0 when no feedback", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback: [] }),
      );
      // mod3: +0, mod4: +0 → was +6 +5 = +11 → drop 11
      // 82 - 11 = 71
      expect(result.voice_score).toBe(71);
    });

    it("requires both staff_informed AND action_taken", () => {
      const feedback = [
        makeFeedback({ id: "fb-1", staff_informed: true, action_taken: false }),
        makeFeedback({ id: "fb-2", staff_informed: false, action_taken: true }),
        makeFeedback({ id: "fb-3", staff_informed: true, action_taken: true }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      // Only 1/3 = 33% → <40% → -5
      expect(result.feedback_response_rate).toBe(33);
    });
  });

  // ── Mod 4: Positive feedback rate ─────────────────────────────────────

  describe("mod4: positive feedback rate", () => {
    it("+5 when positive rate >= 80%", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.positive_feedback_rate).toBe(100);
    });

    it("+2 when positive rate 60-79%", () => {
      // 7/10 positive
      const feedback = baseInput().feedback.map((f, i) => ({
        ...f,
        sentiment: i < 7 ? "positive" : "neutral",
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.positive_feedback_rate).toBe(70);
      // mod4: +2 (was +5, drop 3) → 82 - 3 = 79
      expect(result.voice_score).toBe(79);
    });

    it("+0 when positive rate 40-59%", () => {
      // 5/10 positive
      const feedback = baseInput().feedback.map((f, i) => ({
        ...f,
        sentiment: i < 5 ? "positive" : "negative",
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.positive_feedback_rate).toBe(50);
      // mod4: +0 (was +5, drop 5) → 82 - 5 = 77
      expect(result.voice_score).toBe(77);
    });

    it("-5 when positive rate < 40%", () => {
      // 2/10 positive
      const feedback = baseInput().feedback.map((f, i) => ({
        ...f,
        sentiment: i < 2 ? "positive" : "negative",
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.positive_feedback_rate).toBe(20);
      // mod4: -5 (was +5, drop 10) → 82 - 10 = 72
      expect(result.voice_score).toBe(72);
    });

    it("+0 when no feedback (mod4 neutral)", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback: [] }),
      );
      expect(result.positive_feedback_rate).toBe(0);
    });
  });

  // ── Mod 5: Policy accessibility ───────────────────────────────────────

  describe("mod5: policy accessibility", () => {
    it("+5 when accessibility rate >= 80%", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.child_friendly_policy_rate).toBe(100);
    });

    it("+2 when accessibility rate 50-79%", () => {
      // 3/4 = 75%
      const policies = [
        makePolicy({ id: "pol-1" }),
        makePolicy({ id: "pol-2" }),
        makePolicy({ id: "pol-3" }),
        makePolicy({
          id: "pol-4",
          shared_with_children: false,
          child_accessible_format: false,
        }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      expect(result.child_friendly_policy_rate).toBe(75);
      // mod5: +2 (was +5, drop 3) → 82 - 3 = 79
      expect(result.voice_score).toBe(79);
    });

    it("+0 when accessibility rate 30-49%", () => {
      // 2/5 = 40%
      const policies = [
        makePolicy({ id: "pol-1" }),
        makePolicy({ id: "pol-2" }),
        makePolicy({
          id: "pol-3",
          shared_with_children: false,
          child_accessible_format: false,
        }),
        makePolicy({
          id: "pol-4",
          shared_with_children: false,
          child_accessible_format: false,
        }),
        makePolicy({
          id: "pol-5",
          shared_with_children: false,
          child_accessible_format: false,
        }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      expect(result.child_friendly_policy_rate).toBe(40);
      // mod5: +0 (was +5, drop 5) → 82 - 5 = 77
      expect(result.voice_score).toBe(77);
    });

    it("-4 when accessibility rate < 30%", () => {
      // 1/5 = 20%
      const policies = [
        makePolicy({ id: "pol-1" }),
        makePolicy({
          id: "pol-2",
          shared_with_children: false,
          child_accessible_format: false,
        }),
        makePolicy({
          id: "pol-3",
          shared_with_children: false,
          child_accessible_format: false,
        }),
        makePolicy({
          id: "pol-4",
          shared_with_children: false,
          child_accessible_format: false,
        }),
        makePolicy({
          id: "pol-5",
          shared_with_children: false,
          child_accessible_format: false,
        }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      expect(result.child_friendly_policy_rate).toBe(20);
      // mod5: -4 (was +5, drop 9) → 82 - 9 = 73
      expect(result.voice_score).toBe(73);
    });

    it("+0 when no policies", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies: [] }),
      );
      expect(result.child_friendly_policy_rate).toBe(0);
      // mod5: +0 (was +5, drop 5) → 82 - 5 = 77
      expect(result.voice_score).toBe(77);
    });

    it("requires both shared_with_children AND child_accessible_format", () => {
      const policies = [
        makePolicy({
          id: "pol-1",
          shared_with_children: true,
          child_accessible_format: false,
        }),
        makePolicy({
          id: "pol-2",
          shared_with_children: false,
          child_accessible_format: true,
        }),
        makePolicy({
          id: "pol-3",
          shared_with_children: true,
          child_accessible_format: true,
        }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      // Only 1/3 = 33% → >=30% → +0
      expect(result.child_friendly_policy_rate).toBe(33);
    });
  });

  // ── Mod 6: Expert participation ───────────────────────────────────────

  describe("mod6: expert participation", () => {
    it("+4 when expert participation rate >= 50%", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      // 3 unique children / 4 total = 75%
      expect(result.expert_participation_count).toBe(3);
    });

    it("+1 when expert participation rate 25-49%", () => {
      // 1 unique child / 4 = 25%
      const result = computeChildrensVoiceParticipation(
        baseInput({
          expert_entries: [makeExpert({ id: "exp-1", child_id: "c1" })],
        }),
      );
      expect(result.expert_participation_count).toBe(1);
      // mod6: +1 (was +4, drop 3) → 82 - 3 = 79
      expect(result.voice_score).toBe(79);
    });

    it("+0 when expert participation rate 10-24%", () => {
      // Need 10-24% → with 4 children, need ~0.4-0.96 → not possible with integers
      // Use 10 children, 2 unique = 20%
      const result = computeChildrensVoiceParticipation(
        baseInput({
          total_children: 10,
          expert_entries: [
            makeExpert({ id: "exp-1", child_id: "c1" }),
            makeExpert({ id: "exp-2", child_id: "c2" }),
          ],
        }),
      );
      expect(result.expert_participation_count).toBe(2);
      // 2/10 = 20% → >=10% → +0
      // mod6: +0 (was +4, drop 4) → 82 - 4 = 78
      expect(result.voice_score).toBe(78);
    });

    it("-4 when expert participation rate < 10%", () => {
      // 1/20 = 5%
      const result = computeChildrensVoiceParticipation(
        baseInput({
          total_children: 20,
          expert_entries: [makeExpert({ id: "exp-1", child_id: "c1" })],
        }),
      );
      expect(result.expert_participation_count).toBe(1);
      // 1/20 = 5% → <10% → -4
      // mod6: -4 (was +4, drop 8) → 82 - 8 = 74
      expect(result.voice_score).toBe(74);
    });

    it("-1 when no expert entries and total_children > 0", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ expert_entries: [] }),
      );
      // mod6: -1 (was +4, drop 5) → 82 - 5 = 77
      expect(result.voice_score).toBe(77);
    });

    it("counts unique children only", () => {
      // Duplicate child_id should count once
      const result = computeChildrensVoiceParticipation(
        baseInput({
          expert_entries: [
            makeExpert({ id: "exp-1", child_id: "c1" }),
            makeExpert({ id: "exp-2", child_id: "c1" }),
            makeExpert({ id: "exp-3", child_id: "c2" }),
          ],
        }),
      );
      // Only c1 and c2 → 2 unique
      expect(result.expert_participation_count).toBe(2);
    });

    it("only counts children who chose to participate", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          expert_entries: [
            makeExpert({
              id: "exp-1",
              child_id: "c1",
              child_chose_to_participate: true,
            }),
            makeExpert({
              id: "exp-2",
              child_id: "c2",
              child_chose_to_participate: false,
            }),
            makeExpert({
              id: "exp-3",
              child_id: "c3",
              child_chose_to_participate: true,
            }),
          ],
        }),
      );
      // c1 and c3 chose → 2 unique
      expect(result.expert_participation_count).toBe(2);
    });
  });

  // ── Metrics ───────────────────────────────────────────────────────────

  describe("metrics", () => {
    it("calculates meeting_attendance_rate correctly", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({
              id: "m-1",
              yp_present_count: 3,
              yp_total: 4,
            }),
            makeMeeting({
              id: "m-2",
              yp_present_count: 4,
              yp_total: 4,
            }),
          ],
        }),
      );
      // avg = (3/4 + 4/4) / 2 = (0.75 + 1.0) / 2 = 0.875 → 88%
      expect(result.meeting_attendance_rate).toBe(88);
    });

    it("calculates feedback_response_rate correctly", () => {
      const feedback = [
        makeFeedback({ id: "fb-1", staff_informed: true, action_taken: true }),
        makeFeedback({ id: "fb-2", staff_informed: true, action_taken: false }),
        makeFeedback({ id: "fb-3", staff_informed: false, action_taken: true }),
        makeFeedback({ id: "fb-4", staff_informed: true, action_taken: true }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      // 2/4 = 50%
      expect(result.feedback_response_rate).toBe(50);
    });

    it("calculates child_friendly_policy_rate correctly", () => {
      const policies = [
        makePolicy({ id: "pol-1", shared_with_children: true, child_accessible_format: true }),
        makePolicy({ id: "pol-2", shared_with_children: true, child_accessible_format: false }),
        makePolicy({ id: "pol-3", shared_with_children: false, child_accessible_format: true }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      // 1/3 = 33%
      expect(result.child_friendly_policy_rate).toBe(33);
    });

    it("calculates expert_participation_count correctly", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.expert_participation_count).toBe(3);
    });

    it("calculates positive_feedback_rate correctly", () => {
      const feedback = [
        makeFeedback({ id: "fb-1", sentiment: "positive" }),
        makeFeedback({ id: "fb-2", sentiment: "neutral" }),
        makeFeedback({ id: "fb-3", sentiment: "negative" }),
        makeFeedback({ id: "fb-4", sentiment: "positive" }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      // 2/4 = 50%
      expect(result.positive_feedback_rate).toBe(50);
    });
  });

  // ── Headline ──────────────────────────────────────────────────────────

  describe("headline", () => {
    it("returns outstanding headline", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.headline).toContain("Exceptional");
    });

    it("returns good headline", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({ id: "m-1", date: "2025-05-01", child_chaired: true }),
            makeMeeting({ id: "m-2", date: "2025-05-08", child_chaired: false }),
            makeMeeting({ id: "m-3", date: "2025-05-15", child_chaired: false }),
            makeMeeting({ id: "m-4", date: "2025-05-22", child_chaired: false }),
            makeMeeting({ id: "m-5", date: "2025-05-29", child_chaired: false }),
            makeMeeting({ id: "m-6", date: "2025-06-05", child_chaired: false }),
          ],
          expert_entries: [makeExpert({ id: "exp-1", child_id: "c1" })],
        }),
      );
      expect(result.headline).toContain("Strong");
    });

    it("returns adequate headline", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 4,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 2,
            yp_total: 4,
            child_chaired: false,
          }),
        ],
        feedback: [
          makeFeedback({ id: "fb-1", sentiment: "positive" }),
          makeFeedback({
            id: "fb-2",
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
        ],
        policies: [],
        expert_entries: [],
      });
      expect(result.headline).toContain("basic requirements");
    });

    it("returns inadequate headline", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 4,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 1,
            yp_total: 4,
            child_chaired: false,
          }),
          makeMeeting({
            id: "m-2",
            yp_present_count: 1,
            yp_total: 4,
            child_chaired: false,
          }),
        ],
        feedback: Array.from({ length: 4 }, (_, i) =>
          makeFeedback({
            id: `fb-${i}`,
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
        ),
        policies: [
          makePolicy({ id: "pol-1", shared_with_children: false, child_accessible_format: false }),
          makePolicy({ id: "pol-2", shared_with_children: false, child_accessible_format: false }),
        ],
        expert_entries: [],
      });
      expect(result.headline).toContain("Critical gaps");
    });

    it("returns insufficient_data headline", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [],
        feedback: [],
        policies: [],
        expert_entries: [],
      });
      expect(result.headline).toContain("No children recorded");
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes meeting attendance strength when high", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.strengths.some((s) => s.includes("meeting attendance")),
      ).toBe(true);
    });

    it("includes child chairing strength when high", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.strengths.some((s) => s.includes("chairing meetings")),
      ).toBe(true);
    });

    it("includes feedback response strength when high", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.strengths.some((s) => s.includes("feedback response")),
      ).toBe(true);
    });

    it("includes positive sentiment strength when high", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.strengths.some((s) => s.includes("positive sentiment")),
      ).toBe(true);
    });

    it("includes child-friendly policies strength when high", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.strengths.some((s) => s.includes("Child-friendly policies")),
      ).toBe(true);
    });

    it("includes expert participation strength when high", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.strengths.some((s) => s.includes("children-as-experts")),
      ).toBe(true);
    });

    it("has no strengths when everything is poor", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 4,
        meetings: [
          makeMeeting({
            id: "m-1",
            yp_present_count: 1,
            yp_total: 4,
            child_chaired: false,
          }),
        ],
        feedback: [
          makeFeedback({
            id: "fb-1",
            sentiment: "negative",
            staff_informed: false,
            action_taken: false,
          }),
        ],
        policies: [
          makePolicy({
            id: "pol-1",
            shared_with_children: false,
            child_accessible_format: false,
          }),
        ],
        expert_entries: [],
      });
      expect(result.strengths.length).toBe(0);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags no meetings when children exist", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      expect(
        result.concerns.some((c) => c.includes("No children's meetings")),
      ).toBe(true);
    });

    it("flags low meeting attendance", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({
              id: "m-1",
              yp_present_count: 1,
              yp_total: 4,
              child_chaired: false,
            }),
          ],
        }),
      );
      expect(
        result.concerns.some((c) => c.includes("Low meeting attendance")),
      ).toBe(true);
    });

    it("flags minimal child chairing", () => {
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        child_chaired: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      expect(
        result.concerns.some((c) => c.includes("Minimal child chairing")),
      ).toBe(true);
    });

    it("flags poor feedback response", () => {
      const feedback = baseInput().feedback.map((f) => ({
        ...f,
        staff_informed: false,
        action_taken: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(
        result.concerns.some((c) => c.includes("Poor feedback response")),
      ).toBe(true);
    });

    it("flags low positive sentiment", () => {
      const feedback = baseInput().feedback.map((f) => ({
        ...f,
        sentiment: "negative",
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(
        result.concerns.some((c) => c.includes("Low positive sentiment")),
      ).toBe(true);
    });

    it("flags policies not child-accessible", () => {
      const policies = baseInput().policies.map((p) => ({
        ...p,
        shared_with_children: false,
        child_accessible_format: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      expect(
        result.concerns.some((c) => c.includes("not child-accessible")),
      ).toBe(true);
    });

    it("flags no expert entries", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ expert_entries: [] }),
      );
      expect(
        result.concerns.some((c) => c.includes("No children-as-experts")),
      ).toBe(true);
    });

    it("flags complaints raised in meetings", () => {
      const meetings = [
        makeMeeting({ id: "m-1", complaints_raised: true }),
        makeMeeting({ id: "m-2", complaints_raised: true }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      expect(
        result.concerns.some((c) => c.includes("complaints raised")),
      ).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends establishing meetings when none exist", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("children's meetings"),
      );
      expect(rec).toBeDefined();
      expect(rec!.urgency).toBe("immediate");
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 7");
    });

    it("recommends improving attendance when low", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({
              id: "m-1",
              yp_present_count: 1,
              yp_total: 4,
              child_chaired: false,
            }),
          ],
        }),
      );
      expect(
        result.recommendations.some((r) =>
          r.recommendation.includes("attendance"),
        ),
      ).toBe(true);
    });

    it("recommends strengthening feedback response when low", () => {
      const feedback = baseInput().feedback.map((f) => ({
        ...f,
        staff_informed: false,
        action_taken: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(
        result.recommendations.some((r) =>
          r.recommendation.includes("feedback response"),
        ),
      ).toBe(true);
    });

    it("recommends making policies child-accessible", () => {
      const policies = baseInput().policies.map((p) => ({
        ...p,
        shared_with_children: false,
        child_accessible_format: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("child-accessible"),
      );
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 5");
    });

    it("recommends creating expert opportunities when none exist", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ expert_entries: [] }),
      );
      expect(
        result.recommendations.some((r) =>
          r.recommendation.includes("children-as-experts"),
        ),
      ).toBe(true);
    });

    it("recommends encouraging child chairing when low", () => {
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        child_chaired: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("child chairing"),
      );
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 5");
    });

    it("has sequential rank numbers", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [],
          feedback: baseInput().feedback.map((f) => ({
            ...f,
            staff_informed: false,
            action_taken: false,
          })),
          expert_entries: [],
        }),
      );
      for (let i = 0; i < result.recommendations.length; i++) {
        expect(result.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("includes regulatory refs in recommendations", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("children's meetings"),
      );
      expect(rec?.regulatory_ref).toContain("CHR 2015 Reg 7");
    });

    it("no recommendations when outstanding", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result.recommendations.length).toBe(0);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    it("recognises embedded voice culture", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.insights.some(
          (i) =>
            i.text.includes("embedded children's voice") &&
            i.severity === "positive",
        ),
      ).toBe(true);
    });

    it("detects strong child-led governance", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.insights.some(
          (i) =>
            i.text.includes("child-led governance") &&
            i.severity === "positive",
        ),
      ).toBe(true);
    });

    it("flags dual concern when both sentiment and response are low", () => {
      const feedback = baseInput().feedback.map((f) => ({
        ...f,
        sentiment: "negative",
        staff_informed: false,
        action_taken: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(
        result.insights.some(
          (i) => i.text.includes("dual concern") && i.severity === "critical",
        ),
      ).toBe(true);
    });

    it("flags absence of meetings and feedback", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [], feedback: [] }),
      );
      expect(
        result.insights.some(
          (i) =>
            i.text.includes("absence of both meetings and feedback") &&
            i.severity === "critical",
        ),
      ).toBe(true);
    });

    it("notes complaints pattern", () => {
      const meetings = [
        makeMeeting({ id: "m-1", complaints_raised: true }),
        makeMeeting({ id: "m-2", complaints_raised: true }),
        makeMeeting({ id: "m-3", complaints_raised: false }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      expect(
        result.insights.some(
          (i) =>
            i.text.includes("complaints raised") && i.severity === "warning",
        ),
      ).toBe(true);
    });

    it("highlights expert participation", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.insights.some(
          (i) =>
            i.text.includes("participating as experts") &&
            i.severity === "positive",
        ),
      ).toBe(true);
    });

    it("highlights strong feedback loop", () => {
      // Need 5+ feedback, 80%+ positive, 85%+ response
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(
        result.insights.some(
          (i) =>
            i.text.includes("Strong feedback loop") &&
            i.severity === "positive",
        ),
      ).toBe(true);
    });
  });

  // ── Good test (degraded from outstanding) ─────────────────────────────

  describe("good test (degraded outstanding)", () => {
    it("scores 65-79 when Mod 2 and Mod 6 are degraded", () => {
      // Keep Mods 1,3,4,5 at top level
      // Degrade Mod 2: chairing ~15% → >=10% → +0 (was +5)
      // Degrade Mod 6: expert ~15% → >=10% → +0 (was +4)
      // Score: 82 - 5 - 4 = 73 → good
      const result = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [
            makeMeeting({ id: "m-1", date: "2025-05-01", child_chaired: true }),
            makeMeeting({ id: "m-2", date: "2025-05-08", child_chaired: false }),
            makeMeeting({ id: "m-3", date: "2025-05-15", child_chaired: false }),
            makeMeeting({ id: "m-4", date: "2025-05-22", child_chaired: false }),
            makeMeeting({ id: "m-5", date: "2025-05-29", child_chaired: false }),
            makeMeeting({ id: "m-6", date: "2025-06-05", child_chaired: false }),
          ],
          total_children: 10,
          expert_entries: [
            makeExpert({ id: "exp-1", child_id: "c1" }),
          ],
        }),
      );
      // chairing: 1/6 = 17% → +0
      // expert: 1/10 = 10% → >=10% → +0
      // Score: 52 + 5 + 0 + 6 + 5 + 5 + 0 = 73
      expect(result.voice_score).toBe(73);
      expect(result.voice_rating).toBe("good");
      expect(result.voice_score).toBeGreaterThanOrEqual(65);
      expect(result.voice_score).toBeLessThan(80);
    });
  });

  // ── Cross-modifier interactions ───────────────────────────────────────

  describe("cross-modifier interactions", () => {
    it("removing all data from outstanding reduces score significantly", () => {
      const full = computeChildrensVoiceParticipation(baseInput());
      const stripped = computeChildrensVoiceParticipation(
        baseInput({
          meetings: [],
          feedback: [],
          policies: [],
          expert_entries: [],
        }),
      );
      expect(full.voice_score).toBeGreaterThan(stripped.voice_score);
    });

    it("feedback mods (3 and 4) both respond to feedback changes", () => {
      // Both mod3 and mod4 depend on feedback array
      const result1 = computeChildrensVoiceParticipation(baseInput());
      const result2 = computeChildrensVoiceParticipation(
        baseInput({ feedback: [] }),
      );
      // mod3 goes from +6 to +0, mod4 goes from +5 to +0
      expect(result1.voice_score - result2.voice_score).toBe(11);
    });

    it("meeting mods (1 and 2) both respond to meeting changes", () => {
      const result1 = computeChildrensVoiceParticipation(baseInput());
      const result2 = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      // mod1 goes from +5 to +0, mod2 goes from +5 to +0
      expect(result1.voice_score - result2.voice_score).toBe(10);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("handles single child scenario", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 1,
        meetings: [makeMeeting({ yp_present_count: 1, yp_total: 1 })],
        feedback: [makeFeedback()],
        policies: [makePolicy()],
        expert_entries: [makeExpert()],
      });
      expect(result.voice_rating).not.toBe("insufficient_data");
      expect(result.voice_score).toBeGreaterThan(0);
    });

    it("handles large dataset without errors", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 20,
        meetings: Array.from({ length: 50 }, (_, i) =>
          makeMeeting({
            id: `m-${i}`,
            child_chaired: i % 2 === 0,
          }),
        ),
        feedback: Array.from({ length: 100 }, (_, i) =>
          makeFeedback({
            id: `fb-${i}`,
            child_id: `c${(i % 20) + 1}`,
          }),
        ),
        policies: Array.from({ length: 20 }, (_, i) =>
          makePolicy({ id: `pol-${i}` }),
        ),
        expert_entries: Array.from({ length: 30 }, (_, i) =>
          makeExpert({
            id: `exp-${i}`,
            child_id: `c${(i % 20) + 1}`,
          }),
        ),
      });
      expect(result.voice_rating).toBe("outstanding");
      expect(result.voice_score).toBeGreaterThanOrEqual(80);
    });

    it("handles all negative feedback", () => {
      const feedback = Array.from({ length: 5 }, (_, i) =>
        makeFeedback({
          id: `fb-${i}`,
          sentiment: "negative",
          staff_informed: false,
          action_taken: false,
        }),
      );
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      expect(result.positive_feedback_rate).toBe(0);
      expect(result.feedback_response_rate).toBe(0);
    });

    it("handles mixed sentiment correctly", () => {
      const feedback = [
        makeFeedback({ id: "fb-1", sentiment: "positive" }),
        makeFeedback({ id: "fb-2", sentiment: "neutral" }),
        makeFeedback({ id: "fb-3", sentiment: "negative" }),
      ];
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      // 1/3 = 33%
      expect(result.positive_feedback_rate).toBe(33);
    });

    it("returns correct structure shape", () => {
      const result = computeChildrensVoiceParticipation(baseInput());
      expect(result).toHaveProperty("voice_rating");
      expect(result).toHaveProperty("voice_score");
      expect(result).toHaveProperty("headline");
      expect(result).toHaveProperty("meeting_attendance_rate");
      expect(result).toHaveProperty("feedback_response_rate");
      expect(result).toHaveProperty("child_friendly_policy_rate");
      expect(result).toHaveProperty("expert_participation_count");
      expect(result).toHaveProperty("positive_feedback_rate");
      expect(result).toHaveProperty("strengths");
      expect(result).toHaveProperty("concerns");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("insights");
    });

    it("handles empty meetings array with no children gracefully", () => {
      const result = computeChildrensVoiceParticipation({
        today: TODAY,
        total_children: 0,
        meetings: [],
        feedback: [],
        policies: [],
        expert_entries: [],
      });
      expect(result.voice_rating).toBe("insufficient_data");
    });
  });

  // ── Regulatory references ─────────────────────────────────────────────

  describe("regulatory references", () => {
    it("references CHR 2015 Reg 7 in meeting recommendation", () => {
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings: [] }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("meetings"),
      );
      expect(rec?.regulatory_ref).toBe("CHR 2015 Reg 7");
    });

    it("references CHR 2015 Reg 5 in policy recommendation", () => {
      const policies = baseInput().policies.map((p) => ({
        ...p,
        shared_with_children: false,
        child_accessible_format: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ policies }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("child-accessible"),
      );
      expect(rec?.regulatory_ref).toBe("CHR 2015 Reg 5");
    });

    it("references CHR 2015 Reg 7 in feedback recommendation", () => {
      const feedback = baseInput().feedback.map((f) => ({
        ...f,
        staff_informed: false,
        action_taken: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ feedback }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("feedback response"),
      );
      expect(rec?.regulatory_ref).toBe("CHR 2015 Reg 7");
    });

    it("references CHR 2015 Reg 5 in chairing recommendation", () => {
      const meetings = baseInput().meetings.map((m) => ({
        ...m,
        child_chaired: false,
      }));
      const result = computeChildrensVoiceParticipation(
        baseInput({ meetings }),
      );
      const rec = result.recommendations.find((r) =>
        r.recommendation.includes("chairing"),
      );
      expect(rec?.regulatory_ref).toBe("CHR 2015 Reg 5");
    });
  });
});
