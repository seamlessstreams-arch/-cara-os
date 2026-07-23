// ══════════════════════════════════════════════════════════════════════════════
// CARA — KEYWORKING INTELLIGENCE ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeKeyworkingIntelligence,
  daysBetween,
  average,
  mostFrequent,
  computeCompliance,
  type ChildInput,
  type KeyworkSessionInput,
  type SessionType,
} from "../keyworking-intelligence-engine";

// ── Factories ───────────────────────────────────────────────────────────────

const TODAY = "2026-05-24";

function makeChild(id: string, name: string): ChildInput {
  return { id, name };
}

function makeSession(overrides: Partial<KeyworkSessionInput> = {}): KeyworkSessionInput {
  return {
    id: "kw_test",
    child_id: "yp_1",
    staff_id: "staff_1",
    date: "2026-05-20",
    type: "one_to_one" as SessionType,
    duration_minutes: 45,
    topics: ["wellbeing", "goals"],
    has_child_voice: true,
    mood_before: 3,
    mood_after: 4,
    follow_up_date: "2026-05-27",
    follow_up_completed: false,
    actions_agreed_count: 2,
    linked_goals_count: 1,
    ...overrides,
  };
}

function daysFromToday(n: number): string {
  const d = new Date("2026-05-24");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── Unit Tests: Helpers ─────────────────────────────────────────────────────

describe("daysBetween", () => {
  it("returns 0 for same date", () => {
    expect(daysBetween("2026-05-24", "2026-05-24")).toBe(0);
  });
  it("returns correct day difference", () => {
    expect(daysBetween("2026-05-01", "2026-05-24")).toBe(23);
  });
  it("is order-independent", () => {
    expect(daysBetween("2026-05-24", "2026-05-01")).toBe(23);
  });
});

describe("average", () => {
  it("returns 0 for empty array", () => {
    expect(average([])).toBe(0);
  });
  it("returns correct average", () => {
    expect(average([30, 45, 60])).toBe(45);
  });
});

describe("mostFrequent", () => {
  it("returns null for empty array", () => {
    expect(mostFrequent([])).toBeNull();
  });
  it("returns most common value", () => {
    expect(mostFrequent(["a", "b", "a", "c", "a"])).toBe("a");
  });
});

describe("computeCompliance", () => {
  it("returns on_track with 4+ sessions and recent session", () => {
    expect(computeCompliance(4, 3)).toBe("on_track");
  });
  it("returns below_target with fewer than 3 sessions in 30d", () => {
    expect(computeCompliance(2, 5)).toBe("below_target");
  });
  it("returns overdue when no session in 14+ days", () => {
    expect(computeCompliance(4, 15)).toBe("overdue");
  });
  it("overdue takes precedence over good session count", () => {
    expect(computeCompliance(5, 16)).toBe("overdue");
  });
});

// ── Integration Tests ───────────────────────────────────────────────────────

describe("computeKeyworkingIntelligence", () => {
  describe("empty state", () => {
    it("returns safe defaults with no data", () => {
      const result = computeKeyworkingIntelligence({
        children: [],
        sessions: [],
        today: TODAY,
      });
      expect(result.overview.total_sessions_30d).toBe(0);
      expect(result.overview.avg_sessions_per_child_30d).toBe(0);
      expect(result.overview.child_voice_rate).toBeNull();
      expect(result.overview.mood_improvement_rate).toBeNull();
      expect(result.overview.follow_up_completion_rate).toBeNull();
      expect(result.child_profiles).toHaveLength(0);
      expect(result.topic_analysis).toHaveLength(0);
      expect(result.alerts).toHaveLength(0);
      expect(result.insights).toHaveLength(0);
    });
  });

  describe("overview", () => {
    it("counts sessions within 30 and 90 days", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5) }),   // 30d
          makeSession({ id: "s2", date: daysFromToday(-25) }),  // 30d
          makeSession({ id: "s3", date: daysFromToday(-60) }),  // 90d only
          makeSession({ id: "s4", date: daysFromToday(-100) }), // outside
        ],
        today: TODAY,
      });
      expect(result.overview.total_sessions_30d).toBe(2);
      expect(result.overview.total_sessions_90d).toBe(3);
    });

    it("calculates average sessions per child", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-5) }),
          makeSession({ id: "s2", child_id: "yp_1", date: daysFromToday(-10) }),
          makeSession({ id: "s3", child_id: "yp_2", date: daysFromToday(-7) }),
        ],
        today: TODAY,
      });
      // 3 sessions / 2 children = 1.5
      expect(result.overview.avg_sessions_per_child_30d).toBe(1.5);
    });

    it("calculates child voice rate", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), has_child_voice: true }),
          makeSession({ id: "s2", date: daysFromToday(-10), has_child_voice: true }),
          makeSession({ id: "s3", date: daysFromToday(-15), has_child_voice: false }),
        ],
        today: TODAY,
      });
      // 2/3 = 67%
      expect(result.overview.child_voice_rate).toBe(67);
    });

    it("calculates mood improvement rate", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), mood_before: 2, mood_after: 4 }), // improved
          makeSession({ id: "s2", date: daysFromToday(-10), mood_before: 3, mood_after: 3 }), // same
          makeSession({ id: "s3", date: daysFromToday(-15), mood_before: 4, mood_after: 3 }), // declined
          makeSession({ id: "s4", date: daysFromToday(-20), mood_before: 2, mood_after: 3 }), // improved
        ],
        today: TODAY,
      });
      // 2/4 = 50%
      expect(result.overview.mood_improvement_rate).toBe(50);
    });

    it("calculates follow-up completion rate (due follow-ups only)", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-10), follow_up_date: daysFromToday(-5), follow_up_completed: true }),
          makeSession({ id: "s2", date: daysFromToday(-15), follow_up_date: daysFromToday(-8), follow_up_completed: false }),
          makeSession({ id: "s3", date: daysFromToday(-3), follow_up_date: daysFromToday(5), follow_up_completed: false }), // not yet due
        ],
        today: TODAY,
      });
      // Only s1 and s2 have passed follow_up_dates — 1/2 = 50%
      expect(result.overview.follow_up_completion_rate).toBe(50);
    });

    it("counts therapeutic sessions", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), type: "therapeutic" }),
          makeSession({ id: "s2", date: daysFromToday(-10), type: "one_to_one" }),
          makeSession({ id: "s3", date: daysFromToday(-15), type: "therapeutic" }),
        ],
        today: TODAY,
      });
      expect(result.overview.therapeutic_sessions_30d).toBe(2);
    });
  });

  describe("child profiles", () => {
    it("calculates per-child session stats", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", staff_id: "staff_a", date: daysFromToday(-2), duration_minutes: 40, mood_before: 2, mood_after: 4 }),
          makeSession({ id: "s2", child_id: "yp_1", staff_id: "staff_a", date: daysFromToday(-8), duration_minutes: 30, mood_before: 3, mood_after: 4 }),
          makeSession({ id: "s3", child_id: "yp_1", staff_id: "staff_b", date: daysFromToday(-14), duration_minutes: 50, mood_before: 2, mood_after: 3 }),
          makeSession({ id: "s4", child_id: "yp_2", staff_id: "staff_c", date: daysFromToday(-5), duration_minutes: 45, mood_before: 3, mood_after: 4 }),
        ],
        today: TODAY,
      });

      const alex = result.child_profiles.find((c) => c.child_id === "yp_1")!;
      expect(alex.sessions_30d).toBe(3);
      expect(alex.primary_worker).toBe("staff_a"); // 2 sessions vs 1
      expect(alex.avg_duration).toBe(40); // (40+30+50)/3
      expect(alex.avg_mood_improvement).toBe(1.3); // avg(2, 1, 1) = 1.33 → 1.3
      expect(alex.last_session_days_ago).toBe(2);
      expect(alex.compliance).toBe("on_track");

      const jordan = result.child_profiles.find((c) => c.child_id === "yp_2")!;
      expect(jordan.sessions_30d).toBe(1);
      expect(jordan.compliance).toBe("below_target"); // <3 sessions
    });

    it("marks child as overdue when no session in 14+ days", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-20) }),
        ],
        today: TODAY,
      });
      expect(result.child_profiles[0].compliance).toBe("overdue");
      expect(result.child_profiles[0].last_session_days_ago).toBe(20);
    });

    it("returns unique session types used", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-5), type: "one_to_one" }),
          makeSession({ id: "s2", child_id: "yp_1", date: daysFromToday(-10), type: "therapeutic" }),
          makeSession({ id: "s3", child_id: "yp_1", date: daysFromToday(-15), type: "one_to_one" }),
        ],
        today: TODAY,
      });
      const types = result.child_profiles[0].session_types;
      expect(types).toContain("one_to_one");
      expect(types).toContain("therapeutic");
      expect(types.length).toBe(2);
    });
  });

  describe("topic analysis", () => {
    it("counts topics across sessions and children", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-5), topics: ["School", "Wellbeing"] }),
          makeSession({ id: "s2", child_id: "yp_1", date: daysFromToday(-10), topics: ["School", "Family"] }),
          makeSession({ id: "s3", child_id: "yp_2", date: daysFromToday(-7), topics: ["school", "Goals"] }),
        ],
        today: TODAY,
      });

      const school = result.topic_analysis.find((t) => t.topic === "school");
      expect(school).toBeDefined();
      expect(school!.session_count).toBe(3); // case-insensitive
      expect(school!.children_count).toBe(2);
    });

    it("sorts by frequency and limits to 10", () => {
      const sessions = Array.from({ length: 15 }, (_, i) =>
        makeSession({ id: `s${i}`, date: daysFromToday(-5), topics: [`topic_${i}`] }),
      );
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions,
        today: TODAY,
      });
      expect(result.topic_analysis.length).toBeLessThanOrEqual(10);
    });
  });

  describe("session type breakdown", () => {
    it("groups sessions by type with mood change", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), type: "therapeutic", mood_before: 2, mood_after: 4 }),
          makeSession({ id: "s2", date: daysFromToday(-10), type: "therapeutic", mood_before: 3, mood_after: 5 }),
          makeSession({ id: "s3", date: daysFromToday(-15), type: "one_to_one", mood_before: 3, mood_after: 4 }),
        ],
        today: TODAY,
      });

      const therapeutic = result.session_type_breakdown.find((b) => b.type === "therapeutic");
      expect(therapeutic).toBeDefined();
      expect(therapeutic!.count_30d).toBe(2);
      expect(therapeutic!.avg_mood_change).toBe(2); // avg(2, 2) = 2

      const oneToOne = result.session_type_breakdown.find((b) => b.type === "one_to_one");
      expect(oneToOne).toBeDefined();
      expect(oneToOne!.count_30d).toBe(1);
      expect(oneToOne!.avg_mood_change).toBe(1);
    });
  });

  describe("follow-up compliance", () => {
    it("tracks overdue vs completed follow-ups", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-20), follow_up_date: daysFromToday(-15), follow_up_completed: true }),
          makeSession({ id: "s2", date: daysFromToday(-15), follow_up_date: daysFromToday(-10), follow_up_completed: true }),
          makeSession({ id: "s3", date: daysFromToday(-10), follow_up_date: daysFromToday(-3), follow_up_completed: false }),
        ],
        today: TODAY,
      });
      expect(result.follow_up_compliance.total_due).toBe(3);
      expect(result.follow_up_compliance.completed).toBe(2);
      expect(result.follow_up_compliance.overdue).toBe(1);
      expect(result.follow_up_compliance.completion_rate).toBe(67);
    });

    it("reports no completion rate when no follow-ups are due", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), follow_up_date: daysFromToday(5), follow_up_completed: false }),
        ],
        today: TODAY,
      });
      expect(result.follow_up_compliance.completion_rate).toBeNull();
    });
  });

  describe("alerts", () => {
    it("generates critical alert when child overdue for session", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-18) }),
        ],
        today: TODAY,
      });
      const critical = result.alerts.filter((a) => a.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].message).toContain("Alex");
      expect(critical[0].message).toContain("18 days");
    });

    it("generates high alert for low follow-up completion", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-20), follow_up_date: daysFromToday(-15), follow_up_completed: false }),
          makeSession({ id: "s2", date: daysFromToday(-15), follow_up_date: daysFromToday(-10), follow_up_completed: false }),
          makeSession({ id: "s3", date: daysFromToday(-10), follow_up_date: daysFromToday(-5), follow_up_completed: true }),
        ],
        today: TODAY,
      });
      const high = result.alerts.filter((a) => a.severity === "high");
      expect(high.length).toBe(1);
      expect(high[0].message).toContain("33%");
    });

    it("generates medium alert for below-target children", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-5) }),
          makeSession({ id: "s2", child_id: "yp_1", date: daysFromToday(-10) }),
        ],
        today: TODAY,
      });
      const medium = result.alerts.filter((a) => a.severity === "medium" && a.message.includes("below target"));
      expect(medium.length).toBe(1);
    });

    it("generates medium alert for low child voice rate", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), has_child_voice: false }),
          makeSession({ id: "s2", date: daysFromToday(-10), has_child_voice: false }),
          makeSession({ id: "s3", date: daysFromToday(-15), has_child_voice: true }),
          makeSession({ id: "s4", date: daysFromToday(-20), has_child_voice: false }),
        ],
        today: TODAY,
      });
      const voice = result.alerts.filter((a) => a.message.includes("voice"));
      expect(voice.length).toBe(1);
      expect(voice[0].message).toContain("25%");
    });

    it("generates low alert when sessions lack linked goals", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-5), linked_goals_count: 0 }),
          makeSession({ id: "s2", date: daysFromToday(-10), linked_goals_count: 0 }),
          makeSession({ id: "s3", date: daysFromToday(-15), linked_goals_count: 1 }),
        ],
        today: TODAY,
      });
      const low = result.alerts.filter((a) => a.severity === "low" && a.message.includes("linked"));
      expect(low.length).toBe(1);
    });
  });

  describe("Cara insights", () => {
    it("generates critical insight for overdue children", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-20) }),
        ],
        today: TODAY,
      });
      const critical = result.insights.filter((i) => i.severity === "critical");
      expect(critical.length).toBe(1);
      expect(critical[0].text).toContain("Alex");
    });

    it("generates warning for low mood improvement", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-3), mood_before: 3, mood_after: 3 }),
          makeSession({ id: "s2", date: daysFromToday(-7), mood_before: 4, mood_after: 3 }),
          makeSession({ id: "s3", date: daysFromToday(-12), mood_before: 3, mood_after: 3 }),
          makeSession({ id: "s4", date: daysFromToday(-18), mood_before: 3, mood_after: 4 }),
        ],
        today: TODAY,
      });
      // only 1/4 = 25% improved
      const warning = result.insights.filter((i) => i.severity === "warning" && i.text.includes("mood improvement"));
      expect(warning.length).toBe(1);
    });

    it("generates positive insight for high mood improvement", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-3), mood_before: 2, mood_after: 4 }),
          makeSession({ id: "s2", date: daysFromToday(-7), mood_before: 3, mood_after: 4 }),
          makeSession({ id: "s3", date: daysFromToday(-12), mood_before: 2, mood_after: 3 }),
          makeSession({ id: "s4", date: daysFromToday(-18), mood_before: 3, mood_after: 3 }),
        ],
        today: TODAY,
      });
      // 3/4 = 75% improved
      const positive = result.insights.filter((i) => i.severity === "positive" && i.text.includes("mood improvement"));
      expect(positive.length).toBe(1);
    });

    it("generates positive insight for high voice capture", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex")],
        sessions: [
          makeSession({ id: "s1", date: daysFromToday(-3), has_child_voice: true }),
          makeSession({ id: "s2", date: daysFromToday(-7), has_child_voice: true }),
          makeSession({ id: "s3", date: daysFromToday(-12), has_child_voice: true }),
          makeSession({ id: "s4", date: daysFromToday(-18), has_child_voice: true }),
        ],
        today: TODAY,
      });
      const positive = result.insights.filter((i) => i.text.includes("voice captured"));
      expect(positive.length).toBe(1);
    });

    it("generates positive insight when all children on track", () => {
      const result = computeKeyworkingIntelligence({
        children: [makeChild("yp_1", "Alex"), makeChild("yp_2", "Jordan")],
        sessions: [
          // Alex: 4 sessions in 30d, last 2 days ago
          makeSession({ id: "s1", child_id: "yp_1", date: daysFromToday(-2) }),
          makeSession({ id: "s2", child_id: "yp_1", date: daysFromToday(-9) }),
          makeSession({ id: "s3", child_id: "yp_1", date: daysFromToday(-16) }),
          makeSession({ id: "s4", child_id: "yp_1", date: daysFromToday(-23) }),
          // Jordan: 3 sessions in 30d, last 5 days ago
          makeSession({ id: "s5", child_id: "yp_2", date: daysFromToday(-5) }),
          makeSession({ id: "s6", child_id: "yp_2", date: daysFromToday(-12) }),
          makeSession({ id: "s7", child_id: "yp_2", date: daysFromToday(-20) }),
        ],
        today: TODAY,
      });
      const onTrack = result.insights.filter((i) => i.text.includes("on track for keywork frequency"));
      expect(onTrack.length).toBe(1);
    });
  });

  describe("full Chamberlain House integration", () => {
    it("produces comprehensive output for 3 children with 8 sessions", () => {
      const children: ChildInput[] = [
        makeChild("yp_alex", "Alex"),
        makeChild("yp_jordan", "Jordan"),
        makeChild("yp_casey", "Casey"),
      ];

      const sessions: KeyworkSessionInput[] = [
        // Alex: 3 sessions (1d, 8d, 14d ago)
        makeSession({ id: "kw_001", child_id: "yp_alex", staff_id: "staff_darren", date: daysFromToday(-1), type: "one_to_one", duration_minutes: 45, topics: ["college application", "anxiety", "weekend plans"], mood_before: 2, mood_after: 4, follow_up_date: daysFromToday(2), follow_up_completed: false, actions_agreed_count: 3, linked_goals_count: 1 }),
        makeSession({ id: "kw_002", child_id: "yp_alex", staff_id: "staff_darren", date: daysFromToday(-8), type: "goal_setting", duration_minutes: 30, topics: ["cooking", "meal planning", "budgeting"], mood_before: 3, mood_after: 5, follow_up_date: daysFromToday(-3), follow_up_completed: true, actions_agreed_count: 3, linked_goals_count: 1 }),
        makeSession({ id: "kw_007", child_id: "yp_alex", staff_id: "staff_darren", date: daysFromToday(-14), type: "therapeutic", duration_minutes: 50, topics: ["anger management", "coping techniques"], mood_before: 4, mood_after: 5, follow_up_date: daysFromToday(-10), follow_up_completed: true, actions_agreed_count: 3, linked_goals_count: 1 }),
        // Jordan: 3 sessions (2d, 5d, 12d ago)
        makeSession({ id: "kw_003", child_id: "yp_jordan", staff_id: "staff_anna", date: daysFromToday(-2), type: "wellbeing_check", duration_minutes: 20, topics: ["sleep", "contact", "football"], mood_before: 2, mood_after: 3, follow_up_date: daysFromToday(1), follow_up_completed: false, actions_agreed_count: 3, linked_goals_count: 1 }),
        makeSession({ id: "kw_004", child_id: "yp_jordan", staff_id: "staff_ryan", date: daysFromToday(-5), type: "review", duration_minutes: 40, topics: ["pathway plan", "housing", "leaving care"], mood_before: 2, mood_after: 3, follow_up_date: daysFromToday(-1), follow_up_completed: true, actions_agreed_count: 3, linked_goals_count: 1 }),
        makeSession({ id: "kw_008", child_id: "yp_jordan", staff_id: "staff_anna", date: daysFromToday(-12), type: "informal", duration_minutes: 15, topics: ["weekend activities", "family memories"], mood_before: 3, mood_after: 4, follow_up_date: "", follow_up_completed: false, actions_agreed_count: 2, linked_goals_count: 0 }),
        // Casey: 2 sessions (3d, 10d ago)
        makeSession({ id: "kw_005", child_id: "yp_casey", staff_id: "staff_chervelle", date: daysFromToday(-3), type: "one_to_one", duration_minutes: 35, topics: ["friendships", "identity", "creative writing"], mood_before: 3, mood_after: 4, follow_up_date: daysFromToday(4), follow_up_completed: false, actions_agreed_count: 3, linked_goals_count: 1 }),
        makeSession({ id: "kw_006", child_id: "yp_casey", staff_id: "staff_chervelle", date: daysFromToday(-10), type: "life_skills", duration_minutes: 60, topics: ["laundry", "cleaning", "personal hygiene"], mood_before: 3, mood_after: 5, follow_up_date: daysFromToday(-3), follow_up_completed: true, actions_agreed_count: 3, linked_goals_count: 1 }),
      ];

      const result = computeKeyworkingIntelligence({ children, sessions, today: TODAY });

      // Overview
      expect(result.overview.total_sessions_30d).toBe(8);
      expect(result.overview.avg_sessions_per_child_30d).toBe(2.7); // 8/3
      expect(result.overview.child_voice_rate).toBe(100); // all have child voice
      expect(result.overview.mood_improvement_rate).toBe(100); // all improved
      expect(result.overview.therapeutic_sessions_30d).toBe(1);
      expect(result.overview.avg_duration_minutes).toBe(37); // avg of all

      // Child profiles
      expect(result.child_profiles).toHaveLength(3);
      const alex = result.child_profiles.find((c) => c.child_id === "yp_alex")!;
      expect(alex.sessions_30d).toBe(3);
      expect(alex.primary_worker).toBe("staff_darren");
      expect(alex.compliance).toBe("on_track");

      const jordan = result.child_profiles.find((c) => c.child_id === "yp_jordan")!;
      expect(jordan.sessions_30d).toBe(3);
      expect(jordan.compliance).toBe("on_track");

      const casey = result.child_profiles.find((c) => c.child_id === "yp_casey")!;
      expect(casey.sessions_30d).toBe(2);
      expect(casey.compliance).toBe("below_target"); // <3 sessions

      // Topic analysis
      expect(result.topic_analysis.length).toBeGreaterThan(0);

      // Session type breakdown
      expect(result.session_type_breakdown.length).toBeGreaterThan(0);
      const oneToOne = result.session_type_breakdown.find((b) => b.type === "one_to_one");
      expect(oneToOne).toBeDefined();
      expect(oneToOne!.count_30d).toBe(2);

      // Follow-up compliance (3 due: kw_002, kw_007, kw_004 — all completed; kw_006 completed)
      // Due = follow_up_date <= today && follow_up_date !== ""
      expect(result.follow_up_compliance.completed).toBeGreaterThanOrEqual(3);

      // Insights — positive mood improvement should fire
      const positive = result.insights.filter((i) => i.severity === "positive");
      expect(positive.length).toBeGreaterThanOrEqual(1);
    });
  });
});
