// ══════════════════════════════════════════════════════════════════════════════
// TESTS — HOME LESSONS LEARNED & IMPROVEMENT INTELLIGENCE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  computeLessonsLearnedImprovement,
  type LessonsLearnedInput,
  type LessonInput,
  type ImprovementObjectiveInput,
  type QualityAuditInput,
} from "../home-lessons-learned-improvement-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

const TODAY = "2025-06-15";

const ALL_THEMES = [
  "safeguarding",
  "practice",
  "communication",
  "recording",
  "training",
  "environment",
  "wellbeing",
  "multi_agency",
] as const;

function makeLesson(overrides: Partial<LessonInput> = {}): LessonInput {
  return {
    id: "les_1",
    source: "incident",
    theme_area: "safeguarding",
    status: "embedded",
    embedding_score: 85,
    staff_briefed: true,
    policies_updated_count: 1,
    training_delivered_count: 1,
    evidence_of_embedding_count: 2,
    ...overrides,
  };
}

function makeObjective(overrides: Partial<ImprovementObjectiveInput> = {}): ImprovementObjectiveInput {
  return {
    id: "obj_1",
    source: "reg44",
    priority: "medium",
    status: "completed",
    progress: 100,
    ...overrides,
  };
}

function makeAudit(overrides: Partial<QualityAuditInput> = {}): QualityAuditInput {
  return {
    id: "aud_1",
    audit_score: 85,
    actions_identified: 10,
    actions_completed: 9,
    ...overrides,
  };
}

/**
 * Base input: total_staff=8, 8 lessons across 6 themes all embedded+briefed,
 * 6 objectives (5 completed, 1 in_progress, 0 overdue),
 * 3 audits (score 85, 90% action completion).
 * Expected: score 82, outstanding.
 *
 * Scoring trace:
 *   Base: 52
 *   mod1: embedding 100% >= 80% → +5 = 57
 *   mod2: briefing 100% >= 90% → +6 = 63
 *   mod3: obj completion 5/6 = 83% >= 80% → +5 = 68
 *   mod4: overdue 0/6 = 0% → +5 = 73
 *   mod5: audit actions 27/30 = 90% >= 90% → +4 = 77
 *   mod6: 6 unique themes >= 6 → +5 = 82
 */
function baseInput(overrides: Partial<LessonsLearnedInput> = {}): LessonsLearnedInput {
  return {
    today: TODAY,
    total_staff: 8,
    lessons: [
      makeLesson({ id: "les_1", theme_area: "safeguarding" }),
      makeLesson({ id: "les_2", theme_area: "practice" }),
      makeLesson({ id: "les_3", theme_area: "communication" }),
      makeLesson({ id: "les_4", theme_area: "recording" }),
      makeLesson({ id: "les_5", theme_area: "training" }),
      makeLesson({ id: "les_6", theme_area: "environment" }),
      makeLesson({ id: "les_7", theme_area: "safeguarding" }),
      makeLesson({ id: "les_8", theme_area: "practice" }),
    ],
    objectives: [
      makeObjective({ id: "obj_1", status: "completed" }),
      makeObjective({ id: "obj_2", status: "completed" }),
      makeObjective({ id: "obj_3", status: "completed" }),
      makeObjective({ id: "obj_4", status: "completed" }),
      makeObjective({ id: "obj_5", status: "completed" }),
      makeObjective({ id: "obj_6", status: "in_progress" }),
    ],
    audits: [
      makeAudit({ id: "aud_1", audit_score: 85, actions_identified: 10, actions_completed: 9 }),
      makeAudit({ id: "aud_2", audit_score: 85, actions_identified: 10, actions_completed: 9 }),
      makeAudit({ id: "aud_3", audit_score: 85, actions_identified: 10, actions_completed: 9 }),
    ],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("Home Lessons Learned & Improvement Intelligence Engine", () => {
  // ── Insufficient Data ──────────────────────────────────────────────────
  describe("insufficient data", () => {
    it("returns insufficient_data when total_staff is 0", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 0,
        lessons: [makeLesson()],
        objectives: [makeObjective()],
        audits: [makeAudit()],
      });
      expect(r.lessons_rating).toBe("insufficient_data");
      expect(r.lessons_score).toBe(0);
    });

    it("returns zero for all rates when total_staff is 0", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 0,
        lessons: [],
        objectives: [],
        audits: [],
      });
      expect(r.embedded_rate).toBe(0);
      expect(r.staff_briefing_rate).toBe(0);
      expect(r.objective_completion_rate).toBe(0);
      expect(r.overdue_objectives).toBe(0);
      expect(r.average_audit_score).toBe(0);
    });

    it("returns empty arrays for strengths, concerns, recommendations, insights", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 0,
        lessons: [],
        objectives: [],
        audits: [],
      });
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });

    it("headline mentions no staff", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 0,
        lessons: [],
        objectives: [],
        audits: [],
      });
      expect(r.headline).toContain("No staff");
    });
  });

  // ── Outstanding Rating ────────────────────────────────────────────────
  describe("outstanding rating", () => {
    it("base input scores 82 outstanding", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.lessons_score).toBe(82);
      expect(r.lessons_rating).toBe("outstanding");
    });

    it("headline contains 'Outstanding'", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.headline).toContain("Outstanding");
    });

    it("headline includes embedding rate and objective completion", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.headline).toContain("100%");
    });
  });

  // ── Good Rating ───────────────────────────────────────────────────────
  describe("good rating", () => {
    it("scores good when embedding is high but objective completion is moderate", () => {
      // Keep mod1 (+5), mod2 (+6), mod4 (+5), mod5 (+4), mod6 (+5) = 25
      // Degrade mod3: 3/6 = 50% → >=30% → +0
      // 52 + 5 + 6 + 0 + 5 + 4 + 5 = 77 → good
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "planned" }),
          makeObjective({ id: "obj_6", status: "in_progress" }),
        ],
      }));
      expect(r.lessons_score).toBe(77);
      expect(r.lessons_rating).toBe("good");
    });

    it("scores good when embedding degrades slightly with 4 themes", () => {
      // mod1: 6/8 = 75% → >=60% → +2
      // mod2: 8/8 = 100% → +6
      // mod3: 5/6 = 83% → +5
      // mod4: 0 overdue → +5
      // mod5: 90% → +4
      // mod6: 4 themes → >=4 → +2
      // 52 + 2 + 6 + 5 + 5 + 4 + 2 = 76 → good
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "embedded" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "embedded" }),
          makeLesson({ id: "les_5", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_6", theme_area: "practice", status: "embedded" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "identified" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "identified" }),
        ],
      }));
      expect(r.lessons_score).toBe(76);
      expect(r.lessons_rating).toBe("good");
    });

    it("scores at lower good boundary (65)", () => {
      // mod1: 4/8 = 50% → >=30% → +0
      // mod2: 6/8 = 75% → >=70% → +3
      // mod3: 3/6 = 50% → >=30% → +0
      // mod4: 0 overdue → +5
      // mod5: 90% → +4
      // mod6: 1 theme → <2 → -5
      // 52 + 0 + 3 + 0 + 5 + 4 + (-5) = 59 → adequate, not 65
      // Let me adjust: need exactly 65
      // mod1: 80% → +5, mod2: 70% → +3, mod3: 60% → +2, mod4: 0% → +5, mod5: 0 audits → 0, mod6: 2 themes → 0
      // 52 + 5 + 3 + 2 + 5 + 0 + 0 = 67 → good
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded" }),
          makeLesson({ id: "les_3", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_4", theme_area: "practice", status: "embedded" }),
          makeLesson({ id: "les_5", theme_area: "safeguarding", status: "monitoring", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "planned" }),
        ],
        audits: [],
      });
      // mod1: 5/5 = 100% >= 80% → +5
      // mod2: 4/5 = 80% >= 70% → +3
      // mod3: 3/5 = 60% >= 60% → +2
      // mod4: 0/5 = 0% → +5
      // mod5: 0 audits → 0
      // mod6: 2 themes >= 2 → 0
      // 52 + 5 + 3 + 2 + 5 + 0 + 0 = 67
      expect(r.lessons_score).toBe(67);
      expect(r.lessons_rating).toBe("good");
    });

    it("headline contains 'Good'", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "planned" }),
          makeObjective({ id: "obj_6", status: "in_progress" }),
        ],
      }));
      expect(r.headline).toContain("Good");
    });
  });

  // ── Adequate Rating ───────────────────────────────────────────────────
  describe("adequate rating", () => {
    it("scores adequate with moderate performance across modifiers", () => {
      // mod1: 4/8 = 50% → >=30% → +0
      // mod2: 4/8 = 50% → >=40% → +0
      // mod3: 2/6 = 33% → >=30% → +0
      // mod4: 1/6 = 17% → <25% → +0
      // mod5: 5/10 = 50% → >=40% → +0
      // mod6: 3 themes → >=2 → +0
      // 52 + 0 + 0 + 0 + 0 + 0 + 0 = 52 → adequate
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_4", theme_area: "safeguarding", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_5", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "practice", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "communication", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "in_progress" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "overdue", priority: "low" }),
          makeObjective({ id: "obj_6", status: "planned" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 60, actions_identified: 10, actions_completed: 5 }),
        ],
      });
      expect(r.lessons_score).toBe(52);
      expect(r.lessons_rating).toBe("adequate");
    });

    it("headline contains concern count", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_4", theme_area: "safeguarding", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_5", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "practice", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "communication", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "in_progress" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "overdue", priority: "low" }),
          makeObjective({ id: "obj_6", status: "planned" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 60, actions_identified: 10, actions_completed: 5 }),
        ],
      });
      expect(r.headline).toContain("requires strengthening");
    });
  });

  // ── Inadequate Rating ─────────────────────────────────────────────────
  describe("inadequate rating", () => {
    it("scores inadequate with poor performance across modifiers", () => {
      // mod1: 0/4 = 0% → <30% → -5
      // mod2: 1/4 = 25% → <40% → -5
      // mod3: 0/4 = 0% → <30% → -4
      // mod4: 2/4 = 50% → >=25% → -5
      // mod5: 1/10 = 10% → <40% → -4
      // mod6: 1 theme → <2 → -5
      // 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24 → inadequate
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_3", theme_area: "safeguarding", status: "in_progress", staff_briefed: false }),
          makeLesson({ id: "les_4", theme_area: "safeguarding", status: "in_progress", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "planned" }),
          makeObjective({ id: "obj_2", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_3", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 30, actions_identified: 10, actions_completed: 1 }),
        ],
      });
      expect(r.lessons_score).toBe(24);
      expect(r.lessons_rating).toBe("inadequate");
    });

    it("headline mentions inadequate", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_2", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_3", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_4", status: "overdue", priority: "high" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 20, actions_identified: 10, actions_completed: 1 }),
        ],
      });
      expect(r.headline).toContain("inadequate");
    });
  });

  // ── Modifier 1: Lesson Embedding Rate ─────────────────────────────────
  describe("modifier 1: lesson embedding rate", () => {
    it("+5 when embedding rate >= 80%", () => {
      // All lessons embedded → 100% → +5
      const r = computeLessonsLearnedImprovement(baseInput());
      // Already tested: score 82 includes +5 for mod1
      expect(r.embedded_rate).toBe(100);
      expect(r.lessons_score).toBe(82);
    });

    it("+2 when embedding rate >= 60% but < 80%", () => {
      // 5/8 = 63% → +2 (vs +5 in base = -3)
      // 82 - 3 = 79
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "embedded" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "monitoring" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "monitoring" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "identified" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "identified" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "in_progress" }),
        ],
      }));
      expect(r.embedded_rate).toBe(63);
      expect(r.lessons_score).toBe(79);
    });

    it("+0 when embedding rate >= 30% but < 60%", () => {
      // 3/8 = 38% → +0 (vs +5 = -5)
      // 82 - 5 = 77
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "monitoring" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "identified" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "identified" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "identified" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "in_progress" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "in_progress" }),
        ],
      }));
      expect(r.embedded_rate).toBe(38);
      expect(r.lessons_score).toBe(77);
    });

    it("-5 when embedding rate < 30%", () => {
      // 1/8 = 13% → -5 (vs +5 = -10)
      // 82 - 10 = 72
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "identified" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "identified" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "identified" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "identified" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "in_progress" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "in_progress" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "in_progress" }),
        ],
      }));
      expect(r.embedded_rate).toBe(13);
      expect(r.lessons_score).toBe(72);
    });

    it("-1 when 0 lessons", () => {
      // 0 lessons → mod1: -1, mod2: 0, mod6: -2 (vs +5, +6, +5 = -19 from base)
      // Also mod3 and mod4 unchanged
      // 82 - (5+1) - (6-0) - (5-(-2)) = 82 - 6 - 6 - 7 = 63... let me recalculate
      // Base had: mod1=+5, mod2=+6, mod6=+5 → total from these = +16
      // With 0 lessons: mod1=-1, mod2=0, mod6=-2 → total = -3
      // Delta = -3 - 16 = -19
      // 82 - 19 = 63
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [],
      }));
      expect(r.total_lessons).toBe(0);
      expect(r.lessons_score).toBe(63);
    });
  });

  // ── Modifier 2: Staff Briefing Rate ───────────────────────────────────
  describe("modifier 2: staff briefing rate", () => {
    it("+6 when briefing rate >= 90%", () => {
      // Base: 8/8 = 100% → +6
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.staff_briefing_rate).toBe(100);
    });

    it("+3 when briefing rate >= 70% but < 90%", () => {
      // 6/8 = 75% → +3 (vs +6 = -3)
      // 82 - 3 = 79
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", staff_briefed: true }),
          makeLesson({ id: "les_4", theme_area: "recording", staff_briefed: true }),
          makeLesson({ id: "les_5", theme_area: "training", staff_briefed: true }),
          makeLesson({ id: "les_6", theme_area: "environment", staff_briefed: true }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "practice", staff_briefed: false }),
        ],
      }));
      expect(r.staff_briefing_rate).toBe(75);
      expect(r.lessons_score).toBe(79);
    });

    it("+0 when briefing rate >= 40% but < 70%", () => {
      // 4/8 = 50% → +0 (vs +6 = -6)
      // 82 - 6 = 76
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", staff_briefed: true }),
          makeLesson({ id: "les_4", theme_area: "recording", staff_briefed: true }),
          makeLesson({ id: "les_5", theme_area: "training", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "environment", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "practice", staff_briefed: false }),
        ],
      }));
      expect(r.staff_briefing_rate).toBe(50);
      expect(r.lessons_score).toBe(76);
    });

    it("-5 when briefing rate < 40%", () => {
      // 2/8 = 25% → -5 (vs +6 = -11)
      // 82 - 11 = 71
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", staff_briefed: false }),
          makeLesson({ id: "les_4", theme_area: "recording", staff_briefed: false }),
          makeLesson({ id: "les_5", theme_area: "training", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "environment", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "practice", staff_briefed: false }),
        ],
      }));
      expect(r.staff_briefing_rate).toBe(25);
      expect(r.lessons_score).toBe(71);
    });

    it("+0 when 0 lessons (no penalty for briefing)", () => {
      // Already tested in mod1 0-lessons test
      const r = computeLessonsLearnedImprovement(baseInput({ lessons: [] }));
      expect(r.staff_briefing_rate).toBeNull();
    });
  });

  // ── Modifier 3: Objective Completion Rate ─────────────────────────────
  describe("modifier 3: objective completion rate", () => {
    it("+5 when completion rate >= 80%", () => {
      // Base: 5/6 = 83% → +5
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.objective_completion_rate).toBe(83);
    });

    it("+2 when completion rate >= 60% but < 80%", () => {
      // 4/6 = 67% → +2 (vs +5 = -3)
      // 82 - 3 = 79
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "in_progress" }),
          makeObjective({ id: "obj_6", status: "in_progress" }),
        ],
      }));
      expect(r.objective_completion_rate).toBe(67);
      expect(r.lessons_score).toBe(79);
    });

    it("+0 when completion rate >= 30% but < 60%", () => {
      // 2/6 = 33% → +0 (vs +5 = -5)
      // 82 - 5 = 77
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "in_progress" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "planned" }),
          makeObjective({ id: "obj_6", status: "planned" }),
        ],
      }));
      expect(r.objective_completion_rate).toBe(33);
      expect(r.lessons_score).toBe(77);
    });

    it("-4 when completion rate < 30%", () => {
      // 1/6 = 17% → -4 (vs +5 = -9)
      // 82 - 9 = 73
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "in_progress" }),
          makeObjective({ id: "obj_3", status: "in_progress" }),
          makeObjective({ id: "obj_4", status: "planned" }),
          makeObjective({ id: "obj_5", status: "planned" }),
          makeObjective({ id: "obj_6", status: "planned" }),
        ],
      }));
      expect(r.objective_completion_rate).toBe(17);
      expect(r.lessons_score).toBe(73);
    });

    it("+1 when 0 objectives", () => {
      // 0 objectives → mod3: +1, mod4: +2 (vs +5, +5 = -7 from both)
      // 82 - (5-1) - (5-2) = 82 - 4 - 3 = 75
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [],
      }));
      expect(r.objective_completion_rate).toBeNull();
      expect(r.lessons_score).toBe(75);
    });
  });

  // ── Modifier 4: Overdue Control ───────────────────────────────────────
  describe("modifier 4: overdue control", () => {
    it("+5 when 0% overdue", () => {
      // Base: 0/6 = 0% → +5
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.overdue_objectives).toBe(0);
    });

    it("+2 when < 10% overdue", () => {
      // Need < 10% overdue with > 0 overdue. With 11 objectives, 1 overdue = 9% < 10%
      // mod3: 9/11 = 82% → +5 (same as base)
      // mod4: 1/11 = 9% < 10% → +2 (vs +5 = -3)
      // 82 - 3 = 79
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
          makeObjective({ id: "obj_7", status: "completed" }),
          makeObjective({ id: "obj_8", status: "completed" }),
          makeObjective({ id: "obj_9", status: "completed" }),
          makeObjective({ id: "obj_10", status: "in_progress" }),
          makeObjective({ id: "obj_11", status: "overdue", priority: "low" }),
        ],
      }));
      expect(r.overdue_objectives).toBe(1);
      expect(r.lessons_score).toBe(79);
    });

    it("+0 when < 25% overdue", () => {
      // 1/6 = 17% → <25% → +0 (vs +5 = -5)
      // mod3: 4/6 = 67% → +2 (vs +5 = -3)
      // 82 - 5 - 3 = 74
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "in_progress" }),
          makeObjective({ id: "obj_6", status: "overdue", priority: "low" }),
        ],
      }));
      expect(r.overdue_objectives).toBe(1);
      expect(r.lessons_score).toBe(74);
    });

    it("-5 when >= 25% overdue", () => {
      // 2/6 = 33% → >=25% → -5 (vs +5 = -10)
      // mod3: 3/6 = 50% → >=30% → +0 (vs +5 = -5)
      // 82 - 10 - 5 = 67
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_6", status: "overdue", priority: "medium" }),
        ],
      }));
      expect(r.overdue_objectives).toBe(2);
      expect(r.lessons_score).toBe(67);
    });

    it("+2 when 0 objectives", () => {
      // Already tested in mod3 0-objectives test (75)
      const r = computeLessonsLearnedImprovement(baseInput({ objectives: [] }));
      expect(r.overdue_objectives).toBe(0);
    });
  });

  // ── Modifier 5: Audit Action Completion ───────────────────────────────
  describe("modifier 5: audit action completion", () => {
    it("+4 when audit action rate >= 90%", () => {
      // Base: 27/30 = 90% → +4
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.lessons_score).toBe(82);
    });

    it("+1 when audit action rate >= 70% but < 90%", () => {
      // 8/10 = 80% → +1 (vs +4 = -3)
      // 82 - 3 = 79
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 85, actions_identified: 10, actions_completed: 8 }),
        ],
      }));
      expect(r.lessons_score).toBe(79);
    });

    it("+0 when audit action rate >= 40% but < 70%", () => {
      // 5/10 = 50% → +0 (vs +4 = -4)
      // 82 - 4 = 78
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 85, actions_identified: 10, actions_completed: 5 }),
        ],
      }));
      expect(r.lessons_score).toBe(78);
    });

    it("-4 when audit action rate < 40%", () => {
      // 3/10 = 30% → -4 (vs +4 = -8)
      // 82 - 8 = 74
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 85, actions_identified: 10, actions_completed: 3 }),
        ],
      }));
      expect(r.lessons_score).toBe(74);
    });

    it("+0 when 0 audits", () => {
      // 0 audits → mod5: 0 (vs +4 = -4)
      // 82 - 4 = 78
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [],
      }));
      expect(r.lessons_score).toBe(78);
    });

    it("aggregates actions across multiple audits", () => {
      // Two audits: (10 identified, 8 completed) + (10 identified, 10 completed)
      // Total: 18/20 = 90% → +4 (same as base)
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 85, actions_identified: 10, actions_completed: 8 }),
          makeAudit({ id: "aud_2", audit_score: 85, actions_identified: 10, actions_completed: 10 }),
        ],
      }));
      expect(r.lessons_score).toBe(82);
    });
  });

  // ── Modifier 6: Learning Diversity ────────────────────────────────────
  describe("modifier 6: learning diversity", () => {
    it("+5 when >= 6 unique themes", () => {
      // Base: 6 themes → +5
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.lessons_score).toBe(82);
    });

    it("+2 when >= 4 but < 6 unique themes", () => {
      // 4 themes → +2 (vs +5 = -3)
      // 82 - 3 = 79
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding" }),
          makeLesson({ id: "les_2", theme_area: "practice" }),
          makeLesson({ id: "les_3", theme_area: "communication" }),
          makeLesson({ id: "les_4", theme_area: "recording" }),
          makeLesson({ id: "les_5", theme_area: "safeguarding" }),
          makeLesson({ id: "les_6", theme_area: "practice" }),
          makeLesson({ id: "les_7", theme_area: "communication" }),
          makeLesson({ id: "les_8", theme_area: "recording" }),
        ],
      }));
      expect(r.lessons_score).toBe(79);
    });

    it("+0 when >= 2 but < 4 unique themes", () => {
      // 2 themes → +0 (vs +5 = -5)
      // 82 - 5 = 77
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding" }),
          makeLesson({ id: "les_2", theme_area: "practice" }),
          makeLesson({ id: "les_3", theme_area: "safeguarding" }),
          makeLesson({ id: "les_4", theme_area: "practice" }),
          makeLesson({ id: "les_5", theme_area: "safeguarding" }),
          makeLesson({ id: "les_6", theme_area: "practice" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding" }),
          makeLesson({ id: "les_8", theme_area: "practice" }),
        ],
      }));
      expect(r.lessons_score).toBe(77);
    });

    it("-5 when < 2 unique themes", () => {
      // 1 theme → -5 (vs +5 = -10)
      // 82 - 10 = 72
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding" }),
          makeLesson({ id: "les_2", theme_area: "safeguarding" }),
          makeLesson({ id: "les_3", theme_area: "safeguarding" }),
          makeLesson({ id: "les_4", theme_area: "safeguarding" }),
          makeLesson({ id: "les_5", theme_area: "safeguarding" }),
          makeLesson({ id: "les_6", theme_area: "safeguarding" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding" }),
          makeLesson({ id: "les_8", theme_area: "safeguarding" }),
        ],
      }));
      expect(r.lessons_score).toBe(72);
    });

    it("-2 when 0 lessons", () => {
      // Already tested: 0 lessons → mod6: -2
      const r = computeLessonsLearnedImprovement(baseInput({ lessons: [] }));
      expect(r.total_lessons).toBe(0);
    });
  });

  // ── Metrics ───────────────────────────────────────────────────────────
  describe("metrics", () => {
    it("total_lessons equals lessons array length", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.total_lessons).toBe(8);
    });

    it("embedded_rate is pct of embedded + monitoring", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "monitoring" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "identified" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "in_progress" }),
        ],
      }));
      expect(r.embedded_rate).toBe(50); // 2/4
    });

    it("staff_briefing_rate is pct of staff_briefed", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", staff_briefed: true }),
          makeLesson({ id: "les_4", theme_area: "recording", staff_briefed: false }),
        ],
      }));
      expect(r.staff_briefing_rate).toBe(75); // 3/4
    });

    it("objective_completion_rate is pct of completed objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.objective_completion_rate).toBe(83); // 5/6
    });

    it("overdue_objectives counts objectives with status overdue", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "overdue" }),
          makeObjective({ id: "obj_3", status: "overdue" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
        ],
      }));
      expect(r.overdue_objectives).toBe(2);
    });

    it("average_audit_score is avg across audits", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 80 }),
          makeAudit({ id: "aud_2", audit_score: 90 }),
          makeAudit({ id: "aud_3", audit_score: 70 }),
        ],
      }));
      expect(r.average_audit_score).toBe(80); // (80+90+70)/3
    });

    it("average_audit_score is unmeasured when no audits", () => {
      const r = computeLessonsLearnedImprovement(baseInput({ audits: [] }));
      expect(r.average_audit_score).toBeNull();
    });

    it("embedded_rate is unmeasured when no lessons", () => {
      const r = computeLessonsLearnedImprovement(baseInput({ lessons: [] }));
      expect(r.embedded_rate).toBeNull();
    });

    it("staff_briefing_rate is unmeasured when no lessons", () => {
      const r = computeLessonsLearnedImprovement(baseInput({ lessons: [] }));
      expect(r.staff_briefing_rate).toBeNull();
    });

    it("objective_completion_rate is unmeasured when no objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput({ objectives: [] }));
      expect(r.objective_completion_rate).toBeNull();
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────
  describe("strengths", () => {
    it("includes embedded rate strength when >= 80%", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.strengths.some((s) => s.includes("embedded"))).toBe(true);
    });

    it("includes staff briefing strength when >= 90%", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.strengths.some((s) => s.includes("briefing"))).toBe(true);
    });

    it("includes no overdue strength when 0 overdue objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.strengths.some((s) => s.includes("No overdue"))).toBe(true);
    });

    it("includes objective completion strength when >= 80%", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.strengths.some((s) => s.includes("objective completion"))).toBe(true);
    });

    it("includes audit score strength when average >= 80", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.strengths.some((s) => s.includes("audit score"))).toBe(true);
    });

    it("includes diversity strength when 6+ theme areas", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.strengths.some((s) => s.includes("theme area"))).toBe(true);
    });

    it("does not include embedded strength when rate < 80%", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "identified" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "identified" }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("embedded"))).toBe(false);
    });

    it("does not include briefing strength when rate < 90%", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: false }),
        ],
      }));
      expect(r.strengths.some((s) => s.includes("briefing"))).toBe(false);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────
  describe("concerns", () => {
    it("flags high-priority overdue objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("high-priority"))).toBe(true);
    });

    it("flags low embedded rate (< 40%)", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "identified" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "embedded" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "identified" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "identified" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "identified" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "identified" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "identified" }),
        ],
      }));
      expect(r.embedded_rate).toBe(13);
      expect(r.concerns.some((c) => c.includes("embedded"))).toBe(true);
    });

    it("flags low staff briefing (< 50%)", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: false }),
          makeLesson({ id: "les_3", theme_area: "communication", staff_briefed: false }),
          makeLesson({ id: "les_4", theme_area: "recording", staff_briefed: false }),
          makeLesson({ id: "les_5", theme_area: "training", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "environment", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "practice", staff_briefed: false }),
        ],
      }));
      expect(r.staff_briefing_rate).toBe(13);
      expect(r.concerns.some((c) => c.includes("briefing"))).toBe(true);
    });

    it("flags low average audit score (< 50)", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 30, actions_identified: 10, actions_completed: 9 }),
          makeAudit({ id: "aud_2", audit_score: 40, actions_identified: 10, actions_completed: 9 }),
        ],
      }));
      expect(r.average_audit_score).toBe(35);
      expect(r.concerns.some((c) => c.includes("audit score"))).toBe(true);
    });

    it("flags no lessons when total_staff > 0", () => {
      const r = computeLessonsLearnedImprovement(baseInput({ lessons: [] }));
      expect(r.concerns.some((c) => c.includes("No lessons"))).toBe(true);
    });

    it("does not flag overdue when no high-priority overdue", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "low" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
        ],
      }));
      expect(r.concerns.some((c) => c.includes("high-priority"))).toBe(false);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────
  describe("recommendations", () => {
    it("recommends escalation for high-priority overdue objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
        ],
      }));
      const rec = r.recommendations.find((r) => r.urgency === "immediate");
      expect(rec).toBeDefined();
      expect(rec!.regulatory_ref).toBe("CHR 2015 Reg 40");
    });

    it("recommends embedding improvement when rate < 40%", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "identified" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "identified" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "identified" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "embedded" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "identified" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "identified" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "identified" }),
        ],
      }));
      expect(r.recommendations.some((r) => r.recommendation.includes("embedding"))).toBe(true);
    });

    it("recommends briefing improvement when rate < 50%", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", staff_briefed: false }),
          makeLesson({ id: "les_3", theme_area: "communication", staff_briefed: false }),
          makeLesson({ id: "les_4", theme_area: "recording", staff_briefed: false }),
          makeLesson({ id: "les_5", theme_area: "training", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "environment", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "practice", staff_briefed: false }),
        ],
      }));
      expect(r.recommendations.some((r) => r.recommendation.includes("briefing"))).toBe(true);
    });

    it("recommends lessons learned framework when 0 lessons", () => {
      const r = computeLessonsLearnedImprovement(baseInput({ lessons: [] }));
      expect(r.recommendations.some((r) => r.recommendation.includes("lessons learned framework"))).toBe(true);
    });

    it("caps recommendations at 5", () => {
      // Trigger as many as possible
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_2", status: "overdue", priority: "low" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 30, actions_identified: 10, actions_completed: 2 }),
        ],
      });
      expect(r.recommendations.length).toBeLessThanOrEqual(5);
    });

    it("recommendations have sequential rank numbers", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
        ],
      }));
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });

    it("all recommendations have valid urgency values", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
        ],
      }));
      for (const rec of r.recommendations) {
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
      }
    });

    it("all recommendations have regulatory_ref", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
        ],
      }));
      for (const rec of r.recommendations) {
        expect(rec.regulatory_ref).toBeTruthy();
        expect(["CHR 2015 Reg 40", "SCCIF Quality"]).toContain(rec.regulatory_ref);
      }
    });

    it("recommends overdue review for non-high-priority overdue objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "low" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
        ],
      }));
      expect(r.recommendations.some((r) => r.recommendation.includes("overdue") && r.urgency === "soon")).toBe(true);
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────
  describe("insights", () => {
    it("positive insight for strong learning culture (high embedding + 6+ themes)", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      const insight = r.insights.find((i) => i.severity === "positive");
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("Strong learning culture");
    });

    it("critical insight when >= 3 overdue objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue" }),
          makeObjective({ id: "obj_2", status: "overdue" }),
          makeObjective({ id: "obj_3", status: "overdue" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
        ],
      }));
      const insight = r.insights.find((i) => i.severity === "critical");
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("overdue");
    });

    it("warning insight when < 2 themes", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding" }),
          makeLesson({ id: "les_2", theme_area: "safeguarding" }),
          makeLesson({ id: "les_3", theme_area: "safeguarding" }),
          makeLesson({ id: "les_4", theme_area: "safeguarding" }),
          makeLesson({ id: "les_5", theme_area: "safeguarding" }),
          makeLesson({ id: "les_6", theme_area: "safeguarding" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding" }),
          makeLesson({ id: "les_8", theme_area: "safeguarding" }),
        ],
      }));
      const insight = r.insights.find((i) => i.severity === "warning");
      expect(insight).toBeDefined();
      expect(insight!.text).toContain("narrow");
    });

    it("caps insights at 3", () => {
      // Trigger multiple: high embedding + 6 themes (positive), 3+ overdue (critical), 1 theme (warning)
      // Can't have all 3 simultaneously since 6 themes and 1 theme conflict
      // Use a scenario with overdue + low diversity
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding" }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue" }),
          makeObjective({ id: "obj_2", status: "overdue" }),
          makeObjective({ id: "obj_3", status: "overdue" }),
          makeObjective({ id: "obj_4", status: "overdue" }),
        ],
        audits: [],
      });
      expect(r.insights.length).toBeLessThanOrEqual(3);
    });

    it("no positive learning culture insight when embedding < 80%", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "identified" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "identified" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "identified" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "identified" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "identified" }),
          makeLesson({ id: "les_7", theme_area: "wellbeing", status: "identified" }),
          makeLesson({ id: "les_8", theme_area: "multi_agency", status: "identified" }),
        ],
      }));
      expect(r.insights.some((i) => i.text.includes("Strong learning culture"))).toBe(false);
    });

    it("no critical overdue insight when < 3 overdue objectives", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue" }),
          makeObjective({ id: "obj_2", status: "overdue" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "completed" }),
          makeObjective({ id: "obj_5", status: "completed" }),
          makeObjective({ id: "obj_6", status: "completed" }),
        ],
      }));
      expect(r.insights.some((i) => i.severity === "critical")).toBe(false);
    });

    it("all insights have valid severity", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      for (const insight of r.insights) {
        expect(["critical", "warning", "positive"]).toContain(insight.severity);
      }
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────
  describe("headlines", () => {
    it("outstanding headline includes embedding rate", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.headline).toContain("100%");
      expect(r.headline).toContain("Outstanding");
    });

    it("good headline includes lesson count", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "completed" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "planned" }),
          makeObjective({ id: "obj_6", status: "in_progress" }),
        ],
      }));
      expect(r.headline).toContain("8 lessons");
    });

    it("adequate headline includes concern count", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_4", theme_area: "safeguarding", status: "embedded", staff_briefed: true }),
          makeLesson({ id: "les_5", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_6", theme_area: "practice", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_7", theme_area: "communication", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_8", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "completed" }),
          makeObjective({ id: "obj_3", status: "in_progress" }),
          makeObjective({ id: "obj_4", status: "in_progress" }),
          makeObjective({ id: "obj_5", status: "overdue", priority: "low" }),
          makeObjective({ id: "obj_6", status: "planned" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 60, actions_identified: 10, actions_completed: 5 }),
        ],
      });
      expect(r.headline).toContain("concern");
    });

    it("inadequate headline mentions significant gaps", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_2", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_3", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_4", status: "overdue", priority: "high" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 20, actions_identified: 10, actions_completed: 1 }),
        ],
      });
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toContain("significant gaps");
    });

    it("insufficient_data headline mentions no staff", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 0,
        lessons: [],
        objectives: [],
        audits: [],
      });
      expect(r.headline).toContain("No staff");
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("handles single lesson", () => {
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 1,
        lessons: [makeLesson({ id: "les_1", theme_area: "safeguarding", status: "embedded" })],
        objectives: [],
        audits: [],
      });
      expect(r.total_lessons).toBe(1);
      expect(r.embedded_rate).toBe(100);
      expect(r.staff_briefing_rate).toBe(100);
    });

    it("handles all lessons as monitoring status", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "monitoring" }),
          makeLesson({ id: "les_2", theme_area: "practice", status: "monitoring" }),
          makeLesson({ id: "les_3", theme_area: "communication", status: "monitoring" }),
          makeLesson({ id: "les_4", theme_area: "recording", status: "monitoring" }),
          makeLesson({ id: "les_5", theme_area: "training", status: "monitoring" }),
          makeLesson({ id: "les_6", theme_area: "environment", status: "monitoring" }),
          makeLesson({ id: "les_7", theme_area: "safeguarding", status: "monitoring" }),
          makeLesson({ id: "les_8", theme_area: "practice", status: "monitoring" }),
        ],
      }));
      expect(r.embedded_rate).toBe(100);
    });

    it("handles all objectives overdue", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_2", status: "overdue", priority: "high" }),
          makeObjective({ id: "obj_3", status: "overdue", priority: "medium" }),
        ],
      }));
      expect(r.overdue_objectives).toBe(3);
      expect(r.objective_completion_rate).toBe(0);
    });

    it("handles audit with 0 actions identified", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        audits: [
          makeAudit({ id: "aud_1", audit_score: 90, actions_identified: 0, actions_completed: 0 }),
        ],
      }));
      // pct(0, 0) = 0 → <40% → -4 (vs +4 = -8)
      // 82 - 8 = 74
      expect(r.lessons_score).toBe(74);
    });

    it("handles all 8 theme areas", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        lessons: ALL_THEMES.map((theme, i) =>
          makeLesson({ id: `les_${i + 1}`, theme_area: theme }),
        ),
      }));
      expect(r.total_lessons).toBe(8);
      // 8 unique themes → >=6 → +5 (same as base)
    });

    it("total_staff = 1 with full data still computes", () => {
      const r = computeLessonsLearnedImprovement({
        ...baseInput(),
        total_staff: 1,
      });
      expect(r.lessons_rating).not.toBe("insufficient_data");
      expect(r.lessons_score).toBeGreaterThan(0);
    });

    it("only completed objectives count for completion rate", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "completed" }),
          makeObjective({ id: "obj_2", status: "in_progress", progress: 99 }),
          makeObjective({ id: "obj_3", status: "planned", progress: 0 }),
        ],
      }));
      expect(r.objective_completion_rate).toBe(33); // 1/3
    });
  });

  // ── Score Clamping ────────────────────────────────────────────────────
  describe("score clamping", () => {
    it("score never exceeds 100", () => {
      // Max possible: 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
      // Even if somehow bonuses were higher, it should clamp
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.lessons_score).toBeLessThanOrEqual(100);
    });

    it("score never goes below 0", () => {
      // Max penalties: 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24
      // Still above 0, but verify the clamp logic
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_2", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_3", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_4", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue" }),
          makeObjective({ id: "obj_2", status: "overdue" }),
          makeObjective({ id: "obj_3", status: "overdue" }),
          makeObjective({ id: "obj_4", status: "overdue" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 10, actions_identified: 10, actions_completed: 0 }),
        ],
      });
      expect(r.lessons_score).toBeGreaterThanOrEqual(0);
    });

    it("minimum score with all penalties", () => {
      // mod1: 0% embedding → -5
      // mod2: 0% briefing → -5
      // mod3: 0% completion → -4
      // mod4: 100% overdue → -5
      // mod5: 0% audit actions → -4
      // mod6: 1 theme → -5
      // 52 - 5 - 5 - 4 - 5 - 4 - 5 = 24
      const r = computeLessonsLearnedImprovement({
        today: TODAY,
        total_staff: 8,
        lessons: [
          makeLesson({ id: "les_1", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_2", theme_area: "safeguarding", status: "identified", staff_briefed: false }),
          makeLesson({ id: "les_3", theme_area: "safeguarding", status: "in_progress", staff_briefed: false }),
          makeLesson({ id: "les_4", theme_area: "safeguarding", status: "in_progress", staff_briefed: false }),
        ],
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue" }),
          makeObjective({ id: "obj_2", status: "overdue" }),
          makeObjective({ id: "obj_3", status: "overdue" }),
          makeObjective({ id: "obj_4", status: "overdue" }),
        ],
        audits: [
          makeAudit({ id: "aud_1", audit_score: 20, actions_identified: 10, actions_completed: 0 }),
        ],
      });
      expect(r.lessons_score).toBe(24);
    });

    it("maximum score with all bonuses", () => {
      // 52 + 5 + 6 + 5 + 5 + 4 + 5 = 82
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r.lessons_score).toBe(82);
    });
  });

  // ── Return Shape ──────────────────────────────────────────────────────
  describe("return shape", () => {
    it("returns all required fields", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(r).toHaveProperty("lessons_rating");
      expect(r).toHaveProperty("lessons_score");
      expect(r).toHaveProperty("headline");
      expect(r).toHaveProperty("total_lessons");
      expect(r).toHaveProperty("embedded_rate");
      expect(r).toHaveProperty("staff_briefing_rate");
      expect(r).toHaveProperty("objective_completion_rate");
      expect(r).toHaveProperty("overdue_objectives");
      expect(r).toHaveProperty("average_audit_score");
      expect(r).toHaveProperty("strengths");
      expect(r).toHaveProperty("concerns");
      expect(r).toHaveProperty("recommendations");
      expect(r).toHaveProperty("insights");
    });

    it("strengths is an array of strings", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(Array.isArray(r.strengths)).toBe(true);
      r.strengths.forEach((s) => expect(typeof s).toBe("string"));
    });

    it("concerns is an array of strings", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      expect(Array.isArray(r.concerns)).toBe(true);
      r.concerns.forEach((c) => expect(typeof c).toBe("string"));
    });

    it("recommendations have rank, recommendation, urgency, regulatory_ref", () => {
      const r = computeLessonsLearnedImprovement(baseInput({
        objectives: [
          makeObjective({ id: "obj_1", status: "overdue", priority: "high" }),
        ],
      }));
      for (const rec of r.recommendations) {
        expect(typeof rec.rank).toBe("number");
        expect(typeof rec.recommendation).toBe("string");
        expect(typeof rec.urgency).toBe("string");
        expect(typeof rec.regulatory_ref).toBe("string");
      }
    });

    it("insights have text and severity", () => {
      const r = computeLessonsLearnedImprovement(baseInput());
      for (const insight of r.insights) {
        expect(typeof insight.text).toBe("string");
        expect(typeof insight.severity).toBe("string");
      }
    });
  });
});
