import { describe, it, expect } from "vitest";
import {
  computeHomeKeyworker,
  type HomeKeyworkerInput,
  type KeyworkerSessionInput,
} from "../home-keyworker-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2026-05-26";

function makeSession(overrides?: Partial<KeyworkerSessionInput>): KeyworkerSessionInput {
  return {
    id: "s1",
    child_id: "c1",
    session_date: "2026-05-01",
    duration_minutes: 30,
    child_chose_format: true,
    themes_count: 3,
    mood_before: 3,
    mood_after: 4,
    child_brought_up: true,
    agreed_actions_child_count: 2,
    child_satisfaction: 4,
    follow_up_date: "2026-06-15",
    flags_raised_count: 0,
    ...overrides,
  };
}

function baseInput(overrides?: Partial<HomeKeyworkerInput>): HomeKeyworkerInput {
  return {
    today: TODAY,
    sessions: [],
    total_children: 4,
    lookback_days: 90,
    ...overrides,
  };
}

/** Generate multiple sessions for a child, spaced weekly from a start date */
function childSessions(
  childId: string,
  count: number,
  startDate: string,
  overrides?: Partial<KeyworkerSessionInput>,
): KeyworkerSessionInput[] {
  const result: KeyworkerSessionInput[] = [];
  const start = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i * 7);
    result.push(makeSession({
      id: `${childId}_s${i + 1}`,
      child_id: childId,
      session_date: d.toISOString().slice(0, 10),
      ...overrides,
    }));
  }
  return result;
}

/**
 * Outstanding session set — 4 children × 5 sessions each (20 total).
 * All max bonuses: coverage 100%, avg 5/child, duration ≥20, satisfaction 4+,
 * mood improvement, child chose format, follow-ups set & not overdue, themes ≥3.
 */
function outstandingSessions(): KeyworkerSessionInput[] {
  return [
    ...childSessions("c1", 5, "2026-03-15"),
    ...childSessions("c2", 5, "2026-03-15"),
    ...childSessions("c3", 5, "2026-03-15"),
    ...childSessions("c4", 5, "2026-03-15"),
  ];
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("computeHomeKeyworker", () => {

  // ─── Insufficient Data ───────────────────────────────────────────

  describe("insufficient data", () => {
    it("returns insufficient_data when no sessions provided", () => {
      const r = computeHomeKeyworker(baseInput());
      expect(r.keyworker_rating).toBe("insufficient_data");
      expect(r.keyworker_score).toBe(0);
    });

    it("returns insufficient_data when all sessions are outside the lookback window", () => {
      const sessions = [makeSession({ session_date: "2025-01-01" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.keyworker_rating).toBe("insufficient_data");
    });

    it("returns empty profiles with correct structure on insufficient data", () => {
      const r = computeHomeKeyworker(baseInput());
      expect(r.coverage_profile.total_sessions).toBe(0);
      expect(r.quality_profile.avg_duration).toBe(0);
      expect(r.engagement_profile.child_chose_format_rate).toBe(0);
      expect(r.therapeutic_profile.mood_improvement_rate).toBe(0);
      expect(r.follow_up_profile.follow_up_set_rate).toBe(0);
    });

    it("returns concern, recommendation and critical insight on insufficient data", () => {
      const r = computeHomeKeyworker(baseInput());
      expect(r.concerns.length).toBeGreaterThan(0);
      expect(r.recommendations.length).toBe(1);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].regulatory_ref).toBe("Reg 44");
      expect(r.insights[0].severity).toBe("critical");
    });
  });

  // ─── Rating Classifications ──────────────────────────────────────

  describe("rating classifications", () => {
    it("rates outstanding when all modifiers maximised — score 80", () => {
      // 4 children × 5 sessions each = 20 sessions
      // coverage 100% → +5 | avg 5/child → +4 | duration 100% ≥20 → +3
      // satisfaction 4.0 → +4 | mood improvement 100% → +3 | format 100% → +3
      // follow-up 0% overdue → +3 | themes 3.0 → +3
      // = 52 + 28 = 80
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.keyworker_score).toBe(80);
      expect(r.keyworker_rating).toBe("outstanding");
    });

    it("rates good with solid but imperfect practice — score 70", () => {
      // 3 out of 4 children covered → coverage 75% → +3 (≥80? No, 75<80 → ≥50 → +1)
      // Hmm, let me recalculate. 3/4 = 75% → ≥50 → +1
      // Let me use 4 children but lower frequency/quality
      // 4 children × 3 sessions each = 12 sessions
      // coverage 100% → +5 | avg 3/child → +2 (≥2) | duration 100% → +3
      // satisfaction 4.0 → +4 | mood 100% → +3 | format 100% → +3
      // follow-up 0% overdue → +3 | themes 3.0 → +3
      // = 52 + 26 = 78... too high
      // Let me reduce satisfaction and format choice
      // coverage 100% → +5 | avg 3/child → +2 | duration 100% → +3
      // satisfaction 3.5 → +2 (≥3.0) | mood 100% → +3 | format 60% → +1 (≥50)
      // follow-up 100% set, 0% overdue → +3 | themes 2.5 → +1 (≥2)
      // = 52 + 20 = 72
      const sessions = [
        ...childSessions("c1", 3, "2026-03-15", { child_satisfaction: 3, child_chose_format: false, themes_count: 2 }),
        ...childSessions("c2", 3, "2026-03-15", { child_satisfaction: 4, child_chose_format: true, themes_count: 3 }),
        ...childSessions("c3", 3, "2026-03-15", { child_satisfaction: 4, child_chose_format: true, themes_count: 3 }),
        ...childSessions("c4", 3, "2026-03-15", { child_satisfaction: 3, child_chose_format: false, themes_count: 2 }),
      ];
      // satisfaction avg: (3*3 + 4*3 + 4*3 + 3*3)/12 = (9+12+12+9)/12 = 42/12 = 3.5 → +2
      // format: 6/12 chose → 50% → +1 (≥50)
      // themes: (2*3 + 3*3 + 3*3 + 2*3)/12 = (6+9+9+6)/12 = 30/12 = 2.5 → +1 (≥2)
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.keyworker_score).toBe(72);
      expect(r.keyworker_rating).toBe("good");
    });

    it("rates adequate with mixed practice — score 55", () => {
      // 2 out of 4 children → 50% coverage → +1
      // avg 2/child → +2 (≥2) | duration 50%≥20 → -2 (<70)
      // satisfaction 3.0 → +2 (≥3.0) | no mood improvement → -2 (<50)
      // format 25% → -2 (<50) | no follow-ups → +1 | themes 1.5 → -2 (<2)
      // = 52 + 1 + 2 - 2 + 2 - 2 - 2 + 1 - 2 = 50
      const sessions = [
        ...childSessions("c1", 2, "2026-04-15", {
          duration_minutes: 15, child_chose_format: false,
          themes_count: 1, mood_before: 3, mood_after: 3,
          child_satisfaction: 3, follow_up_date: "",
        }),
        ...childSessions("c2", 2, "2026-04-15", {
          duration_minutes: 25, child_chose_format: false,
          themes_count: 2, mood_before: 3, mood_after: 3,
          child_satisfaction: 3, follow_up_date: "",
        }),
      ];
      // coverage: 2/4 = 50% → +1
      // avg per child: 4 sessions / 2 children = 2.0 → +2
      // duration: 2 sessions < 20, 2 ≥ 20 → 50% → -2
      // satisfaction: (3+3+3+3)/4 = 3.0 → +2
      // mood: all 3→3, no improvement → 0% → -2
      // format: 0/4 chose → 0% → -2
      // follow-up: none set → +1
      // themes: (1+1+2+2)/4 = 1.5 → -2
      // = 52 +1 +2 -2 +2 -2 -2 +1 -2 = 50
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.keyworker_score).toBe(50);
      expect(r.keyworker_rating).toBe("adequate");
    });

    it("rates inadequate with poor practice — score 30", () => {
      // 1 out of 4 children → 25% → -4 (<50)
      // avg 1/child → +0 (≥1) | duration 0% ≥20 → -2 | satisfaction 1.5 → -3 (<2.0)
      // mood: 3→2, decline → 0% improvement → -2 | format 0% → -2
      // follow-up: overdue → -2 (>30%) | themes 1 → -2 (<2)
      // = 52 -4 +0 -2 -3 -2 -2 -2 -2 = 35
      // Hmm that's 35. Let me make it worse.
      // Actually 35 is fine for inadequate (< 45).
      const sessions = [
        makeSession({
          child_id: "c1", session_date: "2026-05-01",
          duration_minutes: 10, child_chose_format: false,
          themes_count: 1, mood_before: 3, mood_after: 2,
          child_satisfaction: 2, follow_up_date: "2026-05-10",
          flags_raised_count: 1,
        }),
      ];
      // coverage: 1/4 = 25% → -4
      // avg per child: 1 → +0
      // duration: 0% ≥ 20 → -2
      // satisfaction: 2.0 → +0 (≥2.0)
      // mood: 0% improve → -2
      // format: 0% → -2
      // follow-up: 1 overdue of 1 = 100% → -2
      // themes: 1.0 → -2
      // = 52 -4 +0 -2 +0 -2 -2 -2 -2 = 38
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.keyworker_score).toBe(38);
      expect(r.keyworker_rating).toBe("inadequate");
    });
  });

  // ─── Coverage Profile ────────────────────────────────────────────

  describe("coverage profile", () => {
    it("calculates coverage rate as percentage of total children", () => {
      const sessions = [
        makeSession({ id: "s1", child_id: "c1", session_date: "2026-05-01" }),
        makeSession({ id: "s2", child_id: "c2", session_date: "2026-05-10" }),
        makeSession({ id: "s3", child_id: "c1", session_date: "2026-05-15" }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions, total_children: 4 }));
      expect(r.coverage_profile.children_with_sessions).toBe(2);
      expect(r.coverage_profile.coverage_rate).toBe(50); // 2/4
    });

    it("counts total sessions correctly", () => {
      const sessions = outstandingSessions();
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.coverage_profile.total_sessions).toBe(20);
    });

    it("computes per-child session statistics", () => {
      const sessions = [
        ...childSessions("c1", 3, "2026-04-01"),
        ...childSessions("c2", 5, "2026-04-01"),
        ...childSessions("c3", 1, "2026-05-01"),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions, total_children: 3 }));
      expect(r.coverage_profile.avg_sessions_per_child).toBe(3);
      expect(r.coverage_profile.min_sessions_per_child).toBe(1);
      expect(r.coverage_profile.max_sessions_per_child).toBe(5);
    });

    it("returns 100% coverage when total_children is 0 but sessions exist", () => {
      const sessions = [makeSession({ session_date: "2026-05-01" })];
      const r = computeHomeKeyworker(baseInput({ sessions, total_children: 0 }));
      expect(r.coverage_profile.coverage_rate).toBe(100);
    });
  });

  // ─── Quality Profile ─────────────────────────────────────────────

  describe("quality profile", () => {
    it("calculates average duration", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", duration_minutes: 20 }),
        makeSession({ id: "s2", session_date: "2026-05-10", duration_minutes: 40 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.quality_profile.avg_duration).toBe(30);
    });

    it("calculates average satisfaction", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", child_satisfaction: 4 }),
        makeSession({ id: "s2", session_date: "2026-05-10", child_satisfaction: 5 }),
        makeSession({ id: "s3", session_date: "2026-05-20", child_satisfaction: 3 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.quality_profile.avg_satisfaction).toBe(4);
    });

    it("calculates adequate duration rate", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", duration_minutes: 10 }),
        makeSession({ id: "s2", session_date: "2026-05-10", duration_minutes: 25 }),
        makeSession({ id: "s3", session_date: "2026-05-20", duration_minutes: 30 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 2 out of 3 ≥ 20 → pct(2,3) = 67
      expect(r.quality_profile.adequate_duration_rate).toBe(67);
    });

    it("calculates average themes covered", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", themes_count: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", themes_count: 4 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.quality_profile.avg_themes).toBe(3);
    });
  });

  // ─── Engagement Profile ──────────────────────────────────────────

  describe("engagement profile", () => {
    it("calculates child-chose-format rate", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", child_chose_format: true }),
        makeSession({ id: "s2", session_date: "2026-05-10", child_chose_format: false }),
        makeSession({ id: "s3", session_date: "2026-05-20", child_chose_format: true }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.engagement_profile.child_chose_format_rate).toBe(67);
    });

    it("calculates child-brought-up rate", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", child_brought_up: true }),
        makeSession({ id: "s2", session_date: "2026-05-10", child_brought_up: false }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.engagement_profile.child_brought_up_rate).toBe(50);
    });

    it("calculates child actions rate", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", agreed_actions_child_count: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", agreed_actions_child_count: 0 }),
        makeSession({ id: "s3", session_date: "2026-05-20", agreed_actions_child_count: 1 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 2 out of 3 have child actions → 67%
      expect(r.engagement_profile.child_actions_rate).toBe(67);
    });
  });

  // ─── Therapeutic Profile ─────────────────────────────────────────

  describe("therapeutic profile", () => {
    it("calculates mood improvement rate for valid sessions", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", mood_before: 2, mood_after: 4 }),
        makeSession({ id: "s2", session_date: "2026-05-10", mood_before: 3, mood_after: 3 }),
        makeSession({ id: "s3", session_date: "2026-05-20", mood_before: 3, mood_after: 4 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 2 improved out of 3 → pct(2,3) = 67
      expect(r.therapeutic_profile.mood_improvement_rate).toBe(67);
      expect(r.therapeutic_profile.sessions_with_improvement).toBe(2);
    });

    it("excludes sessions with mood 0 from mood calculations", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", mood_before: 0, mood_after: 0 }),
        makeSession({ id: "s2", session_date: "2026-05-10", mood_before: 2, mood_after: 4 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // Only 1 valid mood session, that one improved → 100%
      expect(r.therapeutic_profile.mood_improvement_rate).toBe(100);
      expect(r.therapeutic_profile.sessions_with_improvement).toBe(1);
    });

    it("mood_improvement_rate is unmeasured when there is no valid mood data", () => {
      const sessions = [
        makeSession({ session_date: "2026-05-01", mood_before: 0, mood_after: 0 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.therapeutic_profile.mood_improvement_rate).toBeNull();
    });

    it("computes average mood before and after", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", mood_before: 2, mood_after: 4 }),
        makeSession({ id: "s2", session_date: "2026-05-10", mood_before: 3, mood_after: 5 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.therapeutic_profile.avg_mood_before).toBe(2.5);
      expect(r.therapeutic_profile.avg_mood_after).toBe(4.5);
    });
  });

  // ─── Follow-Up Profile ───────────────────────────────────────────

  describe("follow-up profile", () => {
    it("calculates follow-up set rate", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", follow_up_date: "2026-06-01" }),
        makeSession({ id: "s2", session_date: "2026-05-10", follow_up_date: "" }),
        makeSession({ id: "s3", session_date: "2026-05-20", follow_up_date: "2026-06-10" }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 2 out of 3 have follow-up set → 67%
      expect(r.follow_up_profile.follow_up_set_rate).toBe(67);
    });

    it("counts overdue follow-ups", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-04-01", follow_up_date: "2026-04-15" }),
        makeSession({ id: "s2", session_date: "2026-05-01", follow_up_date: "2026-06-01" }),
        makeSession({ id: "s3", session_date: "2026-05-10", follow_up_date: "2026-05-20" }),
      ];
      // today = May 26. Apr 15 < May 26 → overdue. Jun 1 >= May 26 → not overdue. May 20 < May 26 → overdue
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.follow_up_profile.overdue_follow_ups).toBe(2);
    });

    it("sums flags raised across sessions", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", flags_raised_count: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", flags_raised_count: 0 }),
        makeSession({ id: "s3", session_date: "2026-05-20", flags_raised_count: 1 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.follow_up_profile.flags_raised_total).toBe(3);
    });
  });

  // ─── Scoring Modifiers ──────────────────────────────────────────

  describe("scoring modifiers", () => {
    it("modifier 1: coverage 80–99% gives +3", () => {
      // 3 out of 4 children = 75% → actually ≥50 → +1 not +3
      // Need exactly 4/5 = 80% → 4 children with sessions out of 5 total
      const sessions = outstandingSessions(); // covers c1-c4
      const r = computeHomeKeyworker(baseInput({ sessions, total_children: 5 }));
      // coverage = 4/5 = 80% → +3
      // all other modifiers stay max: +4 +3 +4 +3 +3 +3 +3 = +23
      // = 52 + 3 + 23 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 2: frequency 2–3 per child gives +2", () => {
      // 4 children × 3 sessions = avg 3/child → ≥2 → +2
      // Outstanding but fewer sessions
      const sessions = [
        ...childSessions("c1", 3, "2026-04-01"),
        ...childSessions("c2", 3, "2026-04-01"),
        ...childSessions("c3", 3, "2026-04-01"),
        ...childSessions("c4", 3, "2026-04-01"),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // coverage 100% → +5, freq 3/child → +2, dur 100% → +3, sat 4.0 → +4,
      // mood 100% → +3, format 100% → +3, follow-up 0% overdue → +3, themes 3.0 → +3
      // = 52 + 5 + 2 + 3 + 4 + 3 + 3 + 3 + 3 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 3: duration 70–89% adequate gives +1", () => {
      // Outstanding sessions but 3 out of 20 have short duration → 17/20 = 85% → +1
      const sessions = outstandingSessions().map((s, i) => ({
        ...s,
        duration_minutes: i < 3 ? 10 : 30,
      }));
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 52 +5 +4 +1 +4 +3 +3 +3 +3 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 4: satisfaction 3.0–3.9 gives +2", () => {
      const sessions = outstandingSessions().map(s => ({
        ...s,
        child_satisfaction: 3,
      }));
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 52 +5 +4 +3 +2 +3 +3 +3 +3 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 5: no mood data gives +1 bonus", () => {
      const sessions = outstandingSessions().map(s => ({
        ...s,
        mood_before: 0,
        mood_after: 0,
      }));
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 52 +5 +4 +3 +4 +1(no mood) +3 +3 +3 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 6: format choice 50–79% gives +1", () => {
      // 12 out of 20 chose format → 60% → +1
      const sessions = outstandingSessions().map((s, i) => ({
        ...s,
        child_chose_format: i < 12,
      }));
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 52 +5 +4 +3 +4 +3 +1 +3 +3 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 7: no follow-ups set gives +1 bonus", () => {
      const sessions = outstandingSessions().map(s => ({
        ...s,
        follow_up_date: "",
      }));
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 52 +5 +4 +3 +4 +3 +3 +1 +3 = 78
      expect(r.keyworker_score).toBe(78);
    });

    it("modifier 8: themes 2.0–2.9 gives +1", () => {
      const sessions = outstandingSessions().map(s => ({
        ...s,
        themes_count: 2,
      }));
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 52 +5 +4 +3 +4 +3 +3 +3 +1 = 78
      expect(r.keyworker_score).toBe(78);
    });
  });

  // ─── Strengths ──────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes coverage strength when 100%", () => {
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.strengths.some(s => s.includes("full coverage"))).toBe(true);
    });

    it("includes satisfaction strength when ≥ 4.0", () => {
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.strengths.some(s => s.includes("satisfaction"))).toBe(true);
    });

    it("includes mood improvement strength when ≥ 70%", () => {
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.strengths.some(s => s.includes("mood improvement"))).toBe(true);
    });

    it("includes format choice strength when ≥ 80%", () => {
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.strengths.some(s => s.includes("child-centred"))).toBe(true);
    });
  });

  // ─── Concerns ───────────────────────────────────────────────────

  describe("concerns", () => {
    it("flags low coverage as a concern", () => {
      const sessions = [makeSession({ session_date: "2026-05-01" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 1/4 = 25% < 50%
      expect(r.concerns.some(c => c.includes("children are not being reached"))).toBe(true);
    });

    it("flags low satisfaction as a concern", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", child_satisfaction: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", child_satisfaction: 1 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("satisfaction"))).toBe(true);
    });

    it("flags low mood improvement as a concern", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", mood_before: 3, mood_after: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", mood_before: 3, mood_after: 3 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.concerns.some(c => c.includes("mood improvement"))).toBe(true);
    });

    it("flags low format choice as a concern", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", child_chose_format: false }),
        makeSession({ id: "s2", session_date: "2026-05-10", child_chose_format: false }),
        makeSession({ id: "s3", session_date: "2026-05-20", child_chose_format: true }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      // 1/3 = 33% < 50%
      expect(r.concerns.some(c => c.includes("format"))).toBe(true);
    });
  });

  // ─── Recommendations ────────────────────────────────────────────

  describe("recommendations", () => {
    it("recommends coverage improvement when < 50%", () => {
      const sessions = [makeSession({ session_date: "2026-05-01" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.recommendations.some(rec =>
        rec.recommendation.includes("keyworker") && rec.urgency === "immediate",
      )).toBe(true);
    });

    it("recommends increasing duration when < 70% adequate", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", duration_minutes: 10 }),
        makeSession({ id: "s2", session_date: "2026-05-10", duration_minutes: 15 }),
        makeSession({ id: "s3", session_date: "2026-05-20", duration_minutes: 25 }),
      ];
      // 1/3 = 33% adequate → < 70%
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.recommendations.some(rec => rec.recommendation.includes("duration"))).toBe(true);
    });

    it("all recommendations reference Reg 44", () => {
      const sessions = [
        makeSession({
          session_date: "2026-05-01",
          child_satisfaction: 1, duration_minutes: 10,
          child_chose_format: false,
        }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.recommendations.length).toBeGreaterThan(0);
      r.recommendations.forEach(rec => {
        expect(rec.regulatory_ref).toBe("Reg 44");
      });
    });
  });

  // ─── Insights ───────────────────────────────────────────────────

  describe("insights", () => {
    it("generates exemplary positive insight when all conditions met", () => {
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.insights.some(i => i.severity === "positive" && i.text.includes("exemplary"))).toBe(true);
    });

    it("generates critical insight for low coverage", () => {
      const sessions = [makeSession({ session_date: "2026-05-01" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.insights.some(i => i.severity === "critical")).toBe(true);
    });

    it("generates warning insight for poor mood improvement", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", mood_before: 3, mood_after: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", mood_before: 3, mood_after: 3 }),
        makeSession({ id: "s3", session_date: "2026-05-20", mood_before: 4, mood_after: 3 }),
      ];
      // 0 improved out of 3 → 0% < 50%
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("mood"))).toBe(true);
    });

    it("generates warning insight for low satisfaction", () => {
      const sessions = [
        makeSession({ id: "s1", session_date: "2026-05-01", child_satisfaction: 2 }),
        makeSession({ id: "s2", session_date: "2026-05-10", child_satisfaction: 1 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.insights.some(i => i.severity === "warning" && i.text.includes("satisfaction"))).toBe(true);
    });
  });

  // ─── Headlines ──────────────────────────────────────────────────

  describe("headlines", () => {
    it("outstanding headline includes session count and metrics", () => {
      const r = computeHomeKeyworker(baseInput({ sessions: outstandingSessions() }));
      expect(r.headline).toContain("Outstanding");
      expect(r.headline).toContain("20 sessions");
    });

    it("good headline", () => {
      const sessions = [
        ...childSessions("c1", 3, "2026-03-15", { child_satisfaction: 3, child_chose_format: false, themes_count: 2 }),
        ...childSessions("c2", 3, "2026-03-15", { child_satisfaction: 4, child_chose_format: true, themes_count: 3 }),
        ...childSessions("c3", 3, "2026-03-15", { child_satisfaction: 4, child_chose_format: true, themes_count: 3 }),
        ...childSessions("c4", 3, "2026-03-15", { child_satisfaction: 3, child_chose_format: false, themes_count: 2 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.headline).toContain("Good");
    });

    it("adequate headline", () => {
      const sessions = [
        ...childSessions("c1", 2, "2026-04-15", { duration_minutes: 15, child_chose_format: false, themes_count: 1, mood_before: 3, mood_after: 3, child_satisfaction: 3, follow_up_date: "" }),
        ...childSessions("c2", 2, "2026-04-15", { duration_minutes: 25, child_chose_format: false, themes_count: 2, mood_before: 3, mood_after: 3, child_satisfaction: 3, follow_up_date: "" }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.headline).toContain("Adequate");
    });

    it("inadequate headline", () => {
      const sessions = [
        makeSession({ child_id: "c1", session_date: "2026-05-01", duration_minutes: 10, child_chose_format: false, themes_count: 1, mood_before: 3, mood_after: 2, child_satisfaction: 2, follow_up_date: "2026-05-10", flags_raised_count: 1 }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.headline).toContain("inadequate");
    });

    it("insufficient data headline", () => {
      const r = computeHomeKeyworker(baseInput());
      expect(r.headline).toContain("No keyworker sessions");
    });
  });

  // ─── Edge Cases ─────────────────────────────────────────────────

  describe("edge cases", () => {
    it("respects custom lookback_days", () => {
      const sessions = [makeSession({ session_date: "2026-05-10" })];
      const r7 = computeHomeKeyworker(baseInput({ sessions, lookback_days: 7 }));
      const r30 = computeHomeKeyworker(baseInput({ sessions, lookback_days: 30 }));
      expect(r7.keyworker_rating).toBe("insufficient_data");
      expect(r30.keyworker_rating).not.toBe("insufficient_data");
    });

    it("includes session exactly on the cutoff date", () => {
      // Cutoff = May 26 - 90 = Feb 25
      const sessions = [makeSession({ session_date: "2026-02-25" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.coverage_profile.total_sessions).toBe(1);
    });

    it("includes session exactly on today", () => {
      const sessions = [makeSession({ session_date: TODAY })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.coverage_profile.total_sessions).toBe(1);
    });

    it("excludes session before cutoff date", () => {
      const sessions = [makeSession({ session_date: "2026-02-24" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.keyworker_rating).toBe("insufficient_data");
    });

    it("score stays within 0–100 bounds", () => {
      const sessions = [
        makeSession({
          session_date: "2026-05-01",
          duration_minutes: 5, child_chose_format: false,
          themes_count: 0, mood_before: 5, mood_after: 1,
          child_satisfaction: 1, follow_up_date: "2026-04-01",
          flags_raised_count: 3,
        }),
      ];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.keyworker_score).toBeGreaterThanOrEqual(0);
      expect(r.keyworker_score).toBeLessThanOrEqual(100);
    });

    it("handles single session with all data", () => {
      const sessions = [makeSession({ session_date: "2026-05-01" })];
      const r = computeHomeKeyworker(baseInput({ sessions }));
      expect(r.coverage_profile.total_sessions).toBe(1);
      expect(r.quality_profile.avg_duration).toBe(30);
      expect(r.therapeutic_profile.sessions_with_improvement).toBe(1);
    });
  });
});
