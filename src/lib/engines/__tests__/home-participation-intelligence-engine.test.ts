// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME PARTICIPATION & ENGAGEMENT INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeHomeParticipation,
  type HomeParticipationInput,
  type HouseMeetingInput,
} from "../home-participation-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function makeMeeting(overrides: Partial<HouseMeetingInput> = {}): HouseMeetingInput {
  return {
    id: "hm_1",
    date: "2026-05-19",
    meeting_type: "regular",
    children_present: ["yp_alex", "yp_jordan", "yp_casey"],
    children_absent: [],
    total_agenda_items: 3,
    child_raised_items: 2,
    feedback_count: 3,
    previous_actions_total: 2,
    previous_actions_completed: 2,
    new_actions_count: 3,
    duration_minutes: 30,
    ...overrides,
  };
}

function baseInput(overrides: Partial<HomeParticipationInput> = {}): HomeParticipationInput {
  return {
    today: "2026-05-26",
    total_children: 3,
    child_ids: ["yp_alex", "yp_jordan", "yp_casey"],
    house_meetings: [
      makeMeeting({ id: "h1", date: "2026-05-19" }),
      makeMeeting({ id: "h2", date: "2026-05-12" }),
      makeMeeting({ id: "h3", date: "2026-05-05" }),
      makeMeeting({ id: "h4", date: "2026-04-28" }),
      makeMeeting({ id: "h5", date: "2026-04-21" }),
      makeMeeting({ id: "h6", date: "2026-04-14" }),
      makeMeeting({ id: "h7", date: "2026-04-07" }),
      makeMeeting({ id: "h8", date: "2026-03-31" }),
      makeMeeting({ id: "h9", date: "2026-03-24" }),
      makeMeeting({ id: "h10", date: "2026-03-17" }),
      makeMeeting({ id: "h11", date: "2026-03-10" }),
      makeMeeting({ id: "h12", date: "2026-03-03" }),
    ],
    ...overrides,
  };
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe("Home Participation Intelligence Engine", () => {

  // ── Structure ─────────────────────────────────────────────────────────────

  it("returns a well-shaped result", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r).toHaveProperty("participation_rating");
    expect(r).toHaveProperty("participation_score");
    expect(r).toHaveProperty("headline");
    expect(r).toHaveProperty("meeting_profile");
    expect(r).toHaveProperty("engagement_profile");
    expect(r).toHaveProperty("strengths");
    expect(r).toHaveProperty("concerns");
    expect(r).toHaveProperty("recommendations");
    expect(r).toHaveProperty("insights");
  });

  it("assigns a valid rating", () => {
    const r = computeHomeParticipation(baseInput());
    expect(["outstanding", "good", "adequate", "inadequate", "insufficient_data"]).toContain(r.participation_rating);
  });

  it("scores between 0 and 100", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.participation_score).toBeGreaterThanOrEqual(0);
    expect(r.participation_score).toBeLessThanOrEqual(100);
  });

  // ── Insufficient Data ─────────────────────────────────────────────────────

  it("returns insufficient_data with no meetings", () => {
    const r = computeHomeParticipation(baseInput({ house_meetings: [] }));
    expect(r.participation_rating).toBe("insufficient_data");
    expect(r.participation_score).toBe(0);
  });

  it("returns insufficient_data with meetings older than 90 days", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", date: "2026-02-01" })],
    }));
    expect(r.participation_rating).toBe("insufficient_data");
  });

  it("has concerns and recommendations when no data", () => {
    const r = computeHomeParticipation(baseInput({ house_meetings: [] }));
    expect(r.concerns.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  // ── Meeting Profile ───────────────────────────────────────────────────────

  it("counts meetings in 90-day window", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.meeting_profile.total_meetings_90d).toBe(12);
  });

  it("excludes meetings outside 90 days", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", date: "2026-05-19" }),
        makeMeeting({ id: "h2", date: "2026-01-01" }),
      ],
    }));
    expect(r.meeting_profile.total_meetings_90d).toBe(1);
  });

  it("calculates average attendance rate", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"] }),
      ],
    }));
    // 2/3 = 67%
    expect(r.meeting_profile.avg_attendance_rate).toBe(67);
  });

  it("calculates child-raised rate", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", total_agenda_items: 4, child_raised_items: 2 }),
      ],
    }));
    expect(r.meeting_profile.avg_child_raised_rate).toBe(50);
  });

  it("calculates average feedback per meeting", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", feedback_count: 3 }),
        makeMeeting({ id: "h2", feedback_count: 1 }),
      ],
    }));
    expect(r.meeting_profile.avg_feedback_per_meeting).toBe(2);
  });

  it("calculates action completion rate", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", previous_actions_total: 3, previous_actions_completed: 2 }),
        makeMeeting({ id: "h2", previous_actions_total: 1, previous_actions_completed: 1 }),
      ],
    }));
    // 3/4 = 75%
    expect(r.meeting_profile.action_completion_rate).toBe(75);
  });

  it("calculates average duration", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", duration_minutes: 30 }),
        makeMeeting({ id: "h2", duration_minutes: 40 }),
      ],
    }));
    expect(r.meeting_profile.avg_duration).toBe(35);
  });

  it("detects children who never attended", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
        makeMeeting({ id: "h2", children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"] }),
      ],
    }));
    expect(r.meeting_profile.children_never_attended).toEqual(["yp_casey"]);
  });

  it("calculates meetings per month", () => {
    const r = computeHomeParticipation(baseInput());
    // 12 meetings in 90 days = 12/90*30 = 4
    expect(r.meeting_profile.meetings_per_month).toBe(4);
  });

  // ── Engagement Profile ────────────────────────────────────────────────────

  it("totals agenda items", () => {
    const r = computeHomeParticipation(baseInput());
    // 12 meetings * 3 items each = 36
    expect(r.engagement_profile.total_agenda_items).toBe(36);
  });

  it("totals child-raised items", () => {
    const r = computeHomeParticipation(baseInput());
    // 12 * 2 = 24
    expect(r.engagement_profile.total_child_raised).toBe(24);
  });

  it("totals feedback entries", () => {
    const r = computeHomeParticipation(baseInput());
    // 12 * 3 = 36
    expect(r.engagement_profile.total_feedback).toBe(36);
  });

  it("calculates child voice score", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.engagement_profile.child_voice_score).toBeGreaterThan(0);
    expect(r.engagement_profile.child_voice_score).toBeLessThanOrEqual(100);
  });

  // ── Rating Boundaries ─────────────────────────────────────────────────────

  it("rates outstanding (score >= 80)", () => {
    // 4 weekly meetings, perfect attendance, high child involvement
    const r = computeHomeParticipation(baseInput());
    expect(r.participation_score).toBeGreaterThanOrEqual(80);
    expect(r.participation_rating).toBe("outstanding");
  });

  it("rates good (65 <= score < 80)", () => {
    // Fewer meetings, some absent, lower child-raised
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", date: "2026-05-19", children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"], child_raised_items: 1, feedback_count: 1 }),
        makeMeeting({ id: "h2", date: "2026-05-05", children_present: ["yp_alex", "yp_casey"], children_absent: ["yp_jordan"], child_raised_items: 1, feedback_count: 2 }),
        makeMeeting({ id: "h3", date: "2026-04-21" }),
      ],
    }));
    expect(r.participation_score).toBeGreaterThanOrEqual(65);
    expect(r.participation_score).toBeLessThan(80);
    expect(r.participation_rating).toBe("good");
  });

  it("rates adequate (45 <= score < 65)", () => {
    // Low frequency, moderate attendance, some child involvement
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({
          id: "h1", date: "2026-05-10",
          children_present: ["yp_alex", "yp_jordan"], children_absent: ["yp_casey"],
          child_raised_items: 1, feedback_count: 1,
          previous_actions_total: 2, previous_actions_completed: 1,
        }),
        makeMeeting({
          id: "h2", date: "2026-04-15",
          children_present: ["yp_alex", "yp_casey"], children_absent: ["yp_jordan"],
          child_raised_items: 1, feedback_count: 1,
          previous_actions_total: 1, previous_actions_completed: 1,
        }),
      ],
    }));
    expect(r.participation_score).toBeGreaterThanOrEqual(45);
    expect(r.participation_score).toBeLessThan(65);
    expect(r.participation_rating).toBe("adequate");
  });

  it("rates inadequate (score < 45)", () => {
    // One very poor meeting
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({
          id: "h1", date: "2026-05-20",
          children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"],
          total_agenda_items: 2, child_raised_items: 0,
          feedback_count: 0,
          previous_actions_total: 3, previous_actions_completed: 0,
          new_actions_count: 0, duration_minutes: 8,
        }),
      ],
    }));
    expect(r.participation_score).toBeLessThan(45);
    expect(r.participation_rating).toBe("inadequate");
  });

  // ── Scoring Modifiers ─────────────────────────────────────────────────────

  it("rewards high meeting frequency", () => {
    const frequent = computeHomeParticipation(baseInput());
    const infrequent = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", date: "2026-05-19" })],
    }));
    expect(frequent.participation_score).toBeGreaterThan(infrequent.participation_score!);
  });

  it("rewards high attendance", () => {
    const high = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", children_present: ["yp_alex", "yp_jordan", "yp_casey"], children_absent: [] })],
    }));
    const low = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] })],
    }));
    expect(high.participation_score).toBeGreaterThan(low.participation_score!);
  });

  it("rewards child-raised agenda items", () => {
    const raised = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", total_agenda_items: 4, child_raised_items: 3 })],
    }));
    const notRaised = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", total_agenda_items: 4, child_raised_items: 0 })],
    }));
    expect(raised.participation_score).toBeGreaterThan(notRaised.participation_score!);
  });

  it("penalises low action completion", () => {
    const good = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", previous_actions_total: 3, previous_actions_completed: 3 })],
    }));
    const bad = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", previous_actions_total: 3, previous_actions_completed: 0 })],
    }));
    expect(bad.participation_score).toBeLessThan(good.participation_score!);
  });

  // ── Strengths ─────────────────────────────────────────────────────────────

  it("notes strength for good attendance", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("attendance"))).toBe(true);
  });

  it("notes strength for child-raised items", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("raised by children"))).toBe(true);
  });

  it("notes strength for all children attending", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("all children"))).toBe(true);
  });

  it("notes strength for action completion", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.strengths.some(s => s.toLowerCase().includes("action completion") || s.toLowerCase().includes("follows through"))).toBe(true);
  });

  // ── Concerns ──────────────────────────────────────────────────────────────

  it("raises concern for children never attending", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("never attended"))).toBe(true);
  });

  it("raises concern for low attendance", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("attendance"))).toBe(true);
  });

  it("raises concern for low frequency", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", date: "2026-05-19" })],
    }));
    expect(r.concerns.some(c => c.toLowerCase().includes("month") || c.toLowerCase().includes("regularity"))).toBe(true);
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  it("recommends increasing frequency", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [makeMeeting({ id: "h1", date: "2026-05-19" })],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("frequency") || rec.recommendation.toLowerCase().includes("weekly"))).toBe(true);
  });

  it("recommends engaging missing children", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ],
    }));
    expect(r.recommendations.some(rec => rec.recommendation.toLowerCase().includes("engage") || rec.recommendation.toLowerCase().includes("barriers"))).toBe(true);
  });

  it("recommendations have ranked order", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", date: "2026-05-19", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"], child_raised_items: 0, feedback_count: 0 }),
      ],
    }));
    const ranks = r.recommendations.map(rec => rec.rank);
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1]);
    }
  });

  // ── Insights ──────────────────────────────────────────────────────────────

  it("generates critical insight for missing children", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"] }),
      ],
    }));
    expect(r.insights.some(i => i.severity === "critical")).toBe(true);
  });

  it("generates positive insight for child-led participation", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && i.text.toLowerCase().includes("child"))).toBe(true);
  });

  it("generates positive insight for action completion", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.insights.some(i => i.severity === "positive" && (i.text.toLowerCase().includes("action") || i.text.toLowerCase().includes("follows through")))).toBe(true);
  });

  // ── Headlines ─────────────────────────────────────────────────────────────

  it("outstanding headline mentions outstanding", () => {
    const r = computeHomeParticipation(baseInput());
    expect(r.headline.toLowerCase()).toContain("outstanding");
  });

  it("inadequate headline mentions inadequate", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({
          id: "h1", date: "2026-05-20",
          children_present: ["yp_alex"], children_absent: ["yp_jordan", "yp_casey"],
          total_agenda_items: 2, child_raised_items: 0, feedback_count: 0,
          previous_actions_total: 3, previous_actions_completed: 0,
          duration_minutes: 8,
        }),
      ],
    }));
    expect(r.headline.toLowerCase()).toContain("inadequate");
  });

  // ── Edge Cases ────────────────────────────────────────────────────────────

  it("clamps score to minimum 0", () => {
    const r = computeHomeParticipation(baseInput({
      total_children: 10,
      child_ids: Array.from({ length: 10 }, (_, i) => `yp_${i}`),
      house_meetings: [
        makeMeeting({
          id: "h1", date: "2026-05-20",
          children_present: ["yp_0"], children_absent: Array.from({ length: 9 }, (_, i) => `yp_${i + 1}`),
          total_agenda_items: 1, child_raised_items: 0, feedback_count: 0,
          previous_actions_total: 5, previous_actions_completed: 0,
          duration_minutes: 5,
        }),
      ],
    }));
    expect(r.participation_score).toBeGreaterThanOrEqual(0);
  });

  it("clamps score to maximum 100", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: Array.from({ length: 12 }, (_, i) =>
        makeMeeting({ id: `h${i}`, date: `2026-0${Math.max(3, 5 - Math.floor(i / 4))}-${String(1 + (i % 28)).padStart(2, "0")}` }),
      ),
    }));
    expect(r.participation_score).toBeLessThanOrEqual(100);
  });

  it("handles zero children gracefully", () => {
    const r = computeHomeParticipation(baseInput({
      total_children: 0,
      child_ids: [],
      house_meetings: [],
    }));
    expect(r.participation_rating).toBe("insufficient_data");
  });

  it("handles meetings with no previous actions", () => {
    const r = computeHomeParticipation(baseInput({
      house_meetings: [
        makeMeeting({ id: "h1", previous_actions_total: 0, previous_actions_completed: 0 }),
      ],
    }));
    // 100% default when no previous actions
    expect(r.meeting_profile.action_completion_rate).toBe(100);
  });
});
