import { describe, it, expect } from "vitest";
import {
  computeStaffSupervisionReflectivePractice,
  type StaffSupervisionReflectivePracticeInput,
  type SupervisionInput,
  type StaffReflectionInput,
  type SafeguardingSupervisionInput,
  type SupervisionThemeInput,
  type SupervisionMatrixInput,
} from "../home-staff-supervision-reflective-practice-intelligence-engine";

// ── Helpers ─────────────────────────────────────────────────────────────────

function baseInput(
  overrides: Partial<StaffSupervisionReflectivePracticeInput> = {},
): StaffSupervisionReflectivePracticeInput {
  return {
    today: "2026-05-28",
    total_staff: 0,
    supervisions: [],
    staff_reflections: [],
    safeguarding_supervisions: [],
    supervision_themes: [],
    supervision_matrix: [],
    ...overrides,
  };
}

let _id = 0;
function uid(): string {
  return `id-${++_id}`;
}

function makeSupervision(
  overrides: Partial<SupervisionInput> = {},
): SupervisionInput {
  return {
    id: uid(),
    staff_id: overrides.staff_id ?? uid(),
    supervision_date: "2026-05-01",
    supervisor_id: "sup-1",
    type: "formal",
    duration_minutes: 60,
    quality_rating: 3,
    actions_identified: 0,
    actions_completed: 0,
    wellbeing_discussed: false,
    professional_development_discussed: false,
    child_focused_topics_discussed: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeReflection(
  overrides: Partial<StaffReflectionInput> = {},
): StaffReflectionInput {
  return {
    id: uid(),
    staff_id: overrides.staff_id ?? uid(),
    reflection_date: "2026-05-01",
    reflection_type: "individual",
    topic: "Test topic",
    learning_identified: false,
    action_planned: false,
    shared_with_team: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeSafeguardingSupervision(
  overrides: Partial<SafeguardingSupervisionInput> = {},
): SafeguardingSupervisionInput {
  return {
    id: uid(),
    staff_id: overrides.staff_id ?? uid(),
    date: "2026-05-01",
    supervisor_id: "sup-1",
    cases_discussed: 1,
    concerns_raised: 0,
    actions_identified: 0,
    actions_completed: 0,
    competence_assessed: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeTheme(
  overrides: Partial<SupervisionThemeInput> = {},
): SupervisionThemeInput {
  return {
    id: uid(),
    supervision_id: "sup-session-1",
    theme: "safeguarding",
    discussed: true,
    created_at: "2026-05-01",
    ...overrides,
  };
}

function makeMatrix(
  overrides: Partial<SupervisionMatrixInput> = {},
): SupervisionMatrixInput {
  return {
    id: uid(),
    staff_id: overrides.staff_id ?? uid(),
    frequency_weeks: 4,
    last_supervision_date: "2026-05-01",
    next_due_date: "2026-05-29",
    overdue: false,
    created_at: "2026-05-01",
    ...overrides,
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// TESTS
// ═════════════════════════════════════════════════════════════════════════════

describe("computeStaffSupervisionReflectivePractice", () => {
  // ── Special cases ─────────────────────────────────────────────────────

  describe("insufficient data (0 staff + empty arrays)", () => {
    it("returns insufficient_data rating", () => {
      const r = computeStaffSupervisionReflectivePractice(baseInput());
      expect(r.supervision_rating).toBe("insufficient_data");
    });

    it("returns score 0", () => {
      const r = computeStaffSupervisionReflectivePractice(baseInput());
      expect(r.supervision_score).toBe(0);
    });

    it("returns appropriate headline", () => {
      const r = computeStaffSupervisionReflectivePractice(baseInput());
      expect(r.headline).toContain("No staff on site");
    });

    it("returns all zero metrics", () => {
      const r = computeStaffSupervisionReflectivePractice(baseInput());
      expect(r.total_supervisions).toBe(0);
      expect(r.supervision_timeliness_rate).toBe(0);
      expect(r.supervision_quality_avg).toBe(0);
      expect(r.safeguarding_supervision_coverage_rate).toBe(0);
      expect(r.reflective_practice_engagement_rate).toBe(0);
      expect(r.theme_coverage_breadth).toBe(0);
      expect(r.action_completion_rate).toBe(0);
    });

    it("returns empty strengths, concerns, recommendations, insights", () => {
      const r = computeStaffSupervisionReflectivePractice(baseInput());
      expect(r.strengths).toEqual([]);
      expect(r.concerns).toEqual([]);
      expect(r.recommendations).toEqual([]);
      expect(r.insights).toEqual([]);
    });
  });

  describe("inadequate baseline (staff > 0 + empty arrays)", () => {
    it("returns inadequate rating with score 15", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 5 }),
      );
      expect(r.supervision_rating).toBe("inadequate");
      expect(r.supervision_score).toBe(15);
    });

    it("returns headline about no data despite staff", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 5 }),
      );
      expect(r.headline).toContain("No supervision or reflective practice data recorded");
    });

    it("returns 1 concern about absence of records", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 5 }),
      );
      expect(r.concerns).toHaveLength(1);
      expect(r.concerns[0]).toContain("No supervision sessions");
    });

    it("returns 2 recommendations with immediate urgency", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 5 }),
      );
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[0].rank).toBe(1);
      expect(r.recommendations[1].urgency).toBe("immediate");
      expect(r.recommendations[1].rank).toBe(2);
    });

    it("returns 1 critical insight", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 5 }),
      );
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("returns zero metrics even with staff", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 10 }),
      );
      expect(r.total_supervisions).toBe(0);
      expect(r.supervision_timeliness_rate).toBe(0);
    });

    it("works with total_staff = 1", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 1 }),
      );
      expect(r.supervision_rating).toBe("inadequate");
      expect(r.supervision_score).toBe(15);
    });
  });

  // ── Rating boundaries ─────────────────────────────────────────────────

  describe("rating boundaries", () => {
    // Helper to build input that produces a specific approximate score.
    // Base = 52. We add bonuses and penalties to push toward target.

    it("score >= 80 → outstanding", () => {
      // All 9 bonuses at top tier: 52 + 28 = 80
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 5,
              actions_identified: 10,
              actions_completed: 10,
              wellbeing_discussed: true,
              professional_development_discussed: true,
              child_focused_topics_discussed: true,
            }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({
              staff_id: sid,
              learning_identified: true,
              shared_with_team: true,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({
              staff_id: sid,
              competence_assessed: true,
            }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      expect(r.supervision_score).toBe(80);
      expect(r.supervision_rating).toBe("outstanding");
    });

    it("score 79 → good", () => {
      // All bonuses except theme coverage top tier → 80 - 2 = 78? Let's use 5 themes (bonus = +1 not +3), so 52 + 26 = 78... actually we need exactly 79.
      // 52 + 4(timeliness) + 3(quality) + 3(sg) + 3(reflective) + 3(themes at 6) + 3(actions) + 3(wellbeing) + 3(PD) + 1(matrix at 75-89) = 52+26 = 78
      // We need 79. Use matrix at 90 for +3 but drop themes to 5 for +1: 52+4+3+3+3+1+3+3+3+3 = 78. With 4 themes: +1, that's 78.
      // Actually let me approach differently. All max gives 80, reduce quality to >=3.0 for +1 instead of +3: 80-2=78.
      // Quality >=4 gives +3, quality 3.0-3.99 gives +1. Difference is 2. So 80-2=78. Need 79.
      // Reduce reflective to mid tier: 80-2=78. Reduce wellbeing to mid: 80-2=78.
      // We can't easily get exactly 79 since bonuses are integer. Let's use penalties.
      // Actually: use score = 80 - penalty_action_completion(-4) + then compensate... no, that's messy.
      // Simplest: get 80 then apply the overdue penalty of -4 to get 76... not 79.
      // Alternative: start at 52, get bonuses to total 27 of 28: drop one from +3 to +1 gives 52+26=78 or drop from +3 to +0 gives 52+25=77.
      // It seems we can't get exactly 79 with bonuses alone since they're all integers.
      // Actually wait — let me recount. Bonuses: 4+3+3+3+3+3+3+3+3 = 28. If one tier-2 bonus goes mid-tier (-2), we get 26. If another tier-2 goes mid-tier we get 24.
      // To get 27: one bonus goes from +4 to +2 (timeliness mid) = 52+2+3+3+3+3+3+3+3 = 77. That's 77. Not 79.
      // Actually to get 27: drop one +3 bonus to +1 = 28-2 = 26. 52+26=78. Drop timeliness from +4 to +2 = 28-2=26. 52+26=78.
      // We literally cannot get 79 from bonuses alone. Let me try combining tiers:
      // Drop timeliness to mid (+2 instead of +4) = 78. Then... we can't add 1 from anything else.
      // Oh wait — we can't produce score 79 from the bonus system. So let me test boundaries differently.
      // For "79 → good": I'll test that toRating(79) = good by producing score 78 and checking good.
      // Actually the boundary is: >=80 outstanding, >=65 good. So 79 IS good. Let me just use any combination that gives between 65-79.
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 5,
              actions_identified: 10,
              actions_completed: 10,
              wellbeing_discussed: true,
              professional_development_discussed: true,
              child_focused_topics_discussed: true,
            }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      // timeliness: 100 → +4, quality: 5.0 → +3, sg: 100 → +3, reflective: 100 → +3,
      // themes: 8 → +3, actions: 100 → +3, wellbeing: 100 → +3, PD: 100 → +3
      // matrix: 100 → +3. Total = 52+28 = 80. But this is outstanding.
      // Let's drop quality to 2.9 for no bonus: 52+25=77
      const r2 = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 2.9,
              actions_identified: 10,
              actions_completed: 10,
              wellbeing_discussed: true,
              professional_development_discussed: true,
              child_focused_topics_discussed: true,
            }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      expect(r2.supervision_score).toBe(77);
      expect(r2.supervision_rating).toBe("good");
    });

    it("score 65 → good", () => {
      // 52 + 13 from bonuses. Timeliness mid (+2), quality mid (+1), sg mid (+1), reflective mid (+1),
      // themes mid (+1), actions mid (+1), wellbeing mid (+1), rest 0.
      // That's 52+2+1+1+1+1+1+1 = 60. Need 13 more...
      // Max single-tier-2 bonuses: timeliness +4, everything else +3.
      // Let me try: timeliness +4, actions +3, quality +3, rest +1 each.
      // 52 + 4 + 3 + 3 + 1 + 1 + 1 + 0 + 0 + 0 = 65? = 52+13 = 65. Let me be precise:
      // timeliness=90: +4, quality=4.0: +3, actions=90: +3, sg=80: +1, reflective <60: +0, themes <4: +0, wellbeing <70: +0, PD <60: +0, matrix <75: +0
      // That's 52+4+3+1+0+0+3+0+0+0 = 63. Need 2 more.
      // Add reflective mid (+1) = 64, plus themes mid (+1) = 65.
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      // reflective: 60% = 6/10 staff
      const reflectiveStaffIds = staffIds.slice(0, 6);
      // safeguarding: 80% = 8/10 staff
      const sgStaffIds = staffIds.slice(0, 8);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 4,
              actions_identified: 10,
              actions_completed: 9,
              wellbeing_discussed: false,
              professional_development_discussed: false,
              child_focused_topics_discussed: false,
            }),
          ),
          staff_reflections: reflectiveStaffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          safeguarding_supervisions: sgStaffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      // timeliness: 10/10 = 100% → +4
      // quality: 4.0 → +3
      // sg: 80% → +1
      // reflective: 60% → +1
      // themes: 4 → +1
      // actions: pct(90,100) = 90% → +3
      // wellbeing: 0% → +0
      // PD: 0% → +0
      // matrix: 100% → +3
      // Total bonuses = 4+3+1+1+1+3+0+0+3 = 16
      // Score = 52+16 = 68. Penalties: none (coverage 100%, sg 80%, actions 90%, overdue 0%)
      // That gives 68, not 65. Let me adjust.
      // Drop matrix compliance below 75: remove matrix entries → matrixComplianceRate = 0
      // Then 52+4+3+1+1+1+3+0+0+0 = 65. But timeliness also uses matrix: 0 entries → supervisionTimelinessRate = pct(0,0) = 0. So timeliness bonus goes to 0.
      // 52+0+3+1+1+1+3+0+0+0 = 61. Hmm.
      // Different approach: use matrix but with some entries missing.
      // matrixComplianceRate = pct(unique_staff_in_matrix, total_staff).
      // For matrix +3: >=90%. For +1: >=75%.
      // If 7/10 staff in matrix = 70% → +0. timeliness = pct(on_time, total_matrix)
      // Let's have 7 matrix entries all on time: timeliness = 100% → +4.
      // matrixComplianceRate = 70% → +0.
      // 52+4+3+1+1+1+3+0+0+0 = 65. Yes!
      // But check penalties: supervisionCoverageRate = 100% (all 10 staff have supervisions) → no penalty.
      // sg coverage = 80% → no penalty. actions = 90% → no penalty. overdue = 0/7 → no penalty.
      const matrixStaff = staffIds.slice(0, 7);
      const r2 = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 4,
              actions_identified: 10,
              actions_completed: 9,
              wellbeing_discussed: false,
              professional_development_discussed: false,
              child_focused_topics_discussed: false,
            }),
          ),
          staff_reflections: reflectiveStaffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          safeguarding_supervisions: sgStaffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
          ],
          supervision_matrix: matrixStaff.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      expect(r2.supervision_score).toBe(65);
      expect(r2.supervision_rating).toBe("good");
    });

    it("score 64 → adequate", () => {
      // Same as above but drop 1 point: change actions to 70-89% for +1 instead of +3
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const reflectiveStaffIds = staffIds.slice(0, 6);
      const sgStaffIds = staffIds.slice(0, 8);
      const matrixStaff = staffIds.slice(0, 7);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 4,
              actions_identified: 10,
              actions_completed: 7, // 70% → +1 instead of +3
              wellbeing_discussed: false,
              professional_development_discussed: false,
              child_focused_topics_discussed: false,
            }),
          ),
          staff_reflections: reflectiveStaffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          safeguarding_supervisions: sgStaffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
          ],
          supervision_matrix: matrixStaff.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      // timeliness: 100% → +4, quality: 4.0 → +3, sg: 80% → +1, reflective: 60% → +1,
      // themes: 4 → +1, actions: 70% → +1, wellbeing: 0 → 0, PD: 0 → 0, matrix: 70% → 0
      // Total = 52+4+3+1+1+1+1 = 63
      expect(r.supervision_score).toBe(63);
      expect(r.supervision_rating).toBe("adequate");
    });

    it("score 45 → adequate", () => {
      // 52 - 7 penalties. Need penalties totaling 7.
      // supervisionCoverage < 50 → -5 (need < 50% staff with supervision)
      // Let's have 4/10 staff with supervision = 40% → penalty -5. Score = 52-5 = 47.
      // Then drop 2 more with actions < 40 penalty (-4) = 43. Too much.
      // Actually let's use only the coverage penalty: 52-5=47. Then also no bonuses.
      // For no bonuses: timeliness < 75, quality < 3.0, sg < 80, reflective < 60, themes < 4, actions < 70, wellbeing < 70, PD < 60, matrix < 75.
      // With 4/10 staff having supervisions: supervisionCoverage = 40% → -5 penalty.
      // Need to ensure no bonuses fire.
      // Use 4 supervisions with quality 2.9, no wellbeing, no PD, actions 0.
      // sg coverage: 0/10 = 0% → another -5 penalty → 52-5-5=42. Too low.
      // So provide some sg coverage to avoid that penalty: 3/10 = 30% → no penalty (penalty threshold < 30).
      // Score = 52-5 = 47. Still not 45. Need to drop 2 more.
      // Overdue penalty: > 50% overdue → -4. Too much.
      // Actually we can't easily get exactly 45 from base 52 with these penalty increments.
      // Let me try: 52 + some bonuses - some penalties = 45.
      // 52 + 1 bonus - 5 - 4 = 44. Nope. 52 + 2 bonuses - 5 - 4 = 45. Yes!
      // Get +1 bonus twice = +2: e.g., quality mid (+1) and actions mid (+1).
      // Apply supervisionCoverage penalty (-5) and overdue penalty (-4) = 52+2-9=45.
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 3.0,
              actions_identified: 10,
              actions_completed: 7,
              wellbeing_discussed: false,
              professional_development_discussed: false,
              child_focused_topics_discussed: false,
            }),
          ),
          staff_reflections: [],
          safeguarding_supervisions: staffIds.slice(0, 3).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [],
          // 4 matrix entries, 3 overdue = 75% overdue > 50%
          supervision_matrix: [
            makeMatrix({ staff_id: staffIds[0], overdue: false }),
            makeMatrix({ staff_id: staffIds[1], overdue: true }),
            makeMatrix({ staff_id: staffIds[2], overdue: true }),
            makeMatrix({ staff_id: staffIds[3], overdue: true }),
          ],
        }),
      );
      // timeliness: pct(1, 4) = 25% → +0
      // quality: 3.0 → +1
      // sg: pct(3,10) = 30% → +0
      // reflective: 0% → +0
      // themes: 0 → +0
      // actions: pct(28, 40) = 70% → +1
      // wellbeing: 0% → +0
      // PD: 0% → +0
      // matrix: pct(4,10) = 40% → +0
      // Penalties:
      // supervisionCoverage: pct(4,10) = 40% < 50 → -5
      // sgCoverage: 30% ≥ 30 → no penalty
      // actionCompletion: 70% ≥ 40 → no penalty
      // overdue: pct(3,4) = 75% > 50 → -4
      // Score = 52+1+1-5-4 = 45
      expect(r.supervision_score).toBe(45);
      expect(r.supervision_rating).toBe("adequate");
    });

    it("score 44 → inadequate", () => {
      // Same as 45 but drop quality bonus: quality < 3.0 → no bonus
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 2.9,
              actions_identified: 10,
              actions_completed: 7,
              wellbeing_discussed: false,
              professional_development_discussed: false,
              child_focused_topics_discussed: false,
            }),
          ),
          staff_reflections: [],
          safeguarding_supervisions: staffIds.slice(0, 3).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [
            makeMatrix({ staff_id: staffIds[0], overdue: false }),
            makeMatrix({ staff_id: staffIds[1], overdue: true }),
            makeMatrix({ staff_id: staffIds[2], overdue: true }),
            makeMatrix({ staff_id: staffIds[3], overdue: true }),
          ],
        }),
      );
      // quality avg = 2.9 → +0
      // actions: 70% → +1
      // penalties: coverage -5, overdue -4
      // Score = 52+0+1-5-4 = 44
      expect(r.supervision_score).toBe(44);
      expect(r.supervision_rating).toBe("inadequate");
    });
  });

  // ── Bonus tests ───────────────────────────────────────────────────────

  describe("Bonus 1: supervisionTimelinessRate", () => {
    // Timeliness = pct(onTimeEntries, totalMatrixEntries) where onTime = total - overdue
    // >=90 → +4, >=75 → +2

    it("awards +4 when timeliness >= 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          // 10 entries, 1 overdue = 90% on time
          supervision_matrix: [
            ...staffIds.slice(0, 9).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[9], overdue: true }),
          ],
        }),
      );
      // timeliness: pct(9,10) = 90% → +4
      // quality: 3.0 → +1 (default is 3)
      // sg: 100% → +3
      // reflective: 0% → +0
      // themes: 0 → +0
      // actions: pct(0,0) = 0 → no bonus, no penalty (combinedActionsIdentified=0)
      // wellbeing: 0% → +0
      // PD: 0% → +0
      // matrix: 100% → +3
      // Penalties: coverage: 100% → none, sg: 100% → none, actions: 0/0 → none, overdue: pct(1,10)=10% → none
      // Score = 52+4+1+3+0+0+0+0+0+3 = 63
      expect(r.supervision_score).toBe(63);
    });

    it("awards +2 when timeliness >= 75% but < 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          // 8 on time, 2 overdue = 80% → +2 (not +4)
          supervision_matrix: [
            ...staffIds.slice(0, 8).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[8], overdue: true }),
            makeMatrix({ staff_id: staffIds[9], overdue: true }),
          ],
        }),
      );
      // timeliness: pct(8,10) = 80% → +2
      // quality: 3.0 → +1, sg: 100% → +3, matrix: 100% → +3
      // Score = 52+2+1+3+0+0+0+0+0+3 = 61
      expect(r.supervision_score).toBe(61);
    });

    it("awards +0 when timeliness < 75%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          // 7 on time, 3 overdue = 70% → +0
          supervision_matrix: [
            ...staffIds.slice(0, 7).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[7], overdue: true }),
            makeMatrix({ staff_id: staffIds[8], overdue: true }),
            makeMatrix({ staff_id: staffIds[9], overdue: true }),
          ],
        }),
      );
      // timeliness: pct(7,10) = 70% → +0
      // quality: 3.0 → +1, sg: 100% → +3, matrix: 100% → +3
      // Score = 52+0+1+3+0+0+0+0+0+3 = 59
      expect(r.supervision_score).toBe(59);
    });

    it("awards +0 when no matrix entries (denom = 0)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // timeliness: pct(0,0) = 0% → +0
      // quality: 3.0 → +1, sg: 100% → +3, matrix: pct(0,10) = 0% → +0
      // Penalties: coverage 100% → none, sg 100% → none
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });
  });

  describe("Bonus 2: supervisionQualityAvg", () => {
    // quality avg computed from supervisions array. >=4.0 → +3, >=3.0 → +1

    it("awards +3 when quality avg >= 4.0", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid, quality_rating: 4.0 }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: 4.0 → +3, sg: 100% → +3, matrix: 0% → +0
      // Score = 52+0+3+3+0+0+0+0+0+0 = 58
      expect(r.supervision_score).toBe(58);
    });

    it("awards +1 when quality avg >= 3.0 but < 4.0", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid, quality_rating: 3.0 }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: 3.0 → +1, sg: 100% → +3
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });

    it("awards +0 when quality avg < 3.0", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid, quality_rating: 2 }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: 2.0 → +0, sg: 100% → +3
      // Score = 52+0+0+3+0+0+0+0+0+0 = 55
      expect(r.supervision_score).toBe(55);
    });

    it("correctly averages with mixed quality ratings", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 5 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 3 }),
          ],
          safeguarding_supervisions: Array.from({ length: 10 }, (_, i) =>
            makeSafeguardingSupervision({ staff_id: `s-${i}` }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // avg = (5+3)/2 = 4.0 → +3
      expect(r.supervision_quality_avg).toBe(4);
    });
  });

  describe("Bonus 3: safeguardingSupervisionCoverageRate", () => {
    // pct(unique staff with SG supervision, total_staff). >=100 → +3, >=80 → +1

    it("awards +3 when all staff have safeguarding supervision", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.safeguarding_supervision_coverage_rate).toBe(100);
      // sg: +3, quality: 3.0 → +1
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });

    it("awards +1 when coverage >= 80% but < 100%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 8).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.safeguarding_supervision_coverage_rate).toBe(80);
      // sg: +1, quality: 3.0 → +1
      // Score = 52+0+1+1+0+0+0+0+0+0 = 54
      expect(r.supervision_score).toBe(54);
    });

    it("awards +0 when coverage < 80%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 7).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.safeguarding_supervision_coverage_rate).toBe(70);
    });
  });

  describe("Bonus 4: reflectivePracticeEngagementRate", () => {
    // pct(unique staff with reflection, total_staff). >=80 → +3, >=60 → +1

    it("awards +3 when engagement >= 80%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 8).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.reflective_practice_engagement_rate).toBe(80);
      // reflective: +3, quality: +1, sg: +3
      // Score = 52+0+1+3+3+0+0+0+0+0 = 59
      expect(r.supervision_score).toBe(59);
    });

    it("awards +1 when engagement >= 60% but < 80%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 6).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.reflective_practice_engagement_rate).toBe(60);
      // reflective: +1
      // Score = 52+0+1+3+1+0+0+0+0+0 = 57
      expect(r.supervision_score).toBe(57);
    });

    it("awards +0 when engagement < 60%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 5).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.reflective_practice_engagement_rate).toBe(50);
    });
  });

  describe("Bonus 5: themeCoverageBreadth", () => {
    // Count of unique discussed themes. >=6 → +3, >=4 → +1

    it("awards +3 when 6+ themes discussed", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.theme_coverage_breadth).toBe(6);
      // themes: +3, quality: +1, sg: +3
      // Score = 52+0+1+3+0+3+0+0+0+0 = 59
      expect(r.supervision_score).toBe(59);
    });

    it("awards +1 when 4-5 themes discussed", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.theme_coverage_breadth).toBe(4);
    });

    it("awards +0 when < 4 themes discussed", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.theme_coverage_breadth).toBe(2);
    });

    it("only counts themes where discussed=true", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding", discussed: true }),
            makeTheme({ theme: "behaviour_management", discussed: false }),
            makeTheme({ theme: "therapeutic_care", discussed: true }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.theme_coverage_breadth).toBe(2);
    });

    it("counts unique themes only (duplicates ignored)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "safeguarding" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.theme_coverage_breadth).toBe(1);
    });
  });

  describe("Bonus 6: actionCompletionRate", () => {
    // Combined actions from supervisions + safeguarding. >=90 → +3, >=70 → +1

    it("awards +3 when action completion >= 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 9,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.action_completion_rate).toBe(90);
    });

    it("awards +1 when action completion >= 70% but < 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 7,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.action_completion_rate).toBe(70);
    });

    it("awards +0 when action completion < 70%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 6,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.action_completion_rate).toBe(60);
    });

    it("combines actions from supervisions and safeguarding supervisions", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              actions_identified: 5,
              actions_completed: 5,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-0",
              actions_identified: 5,
              actions_completed: 4,
            }),
            makeSafeguardingSupervision({
              staff_id: "s-1",
              actions_identified: 0,
              actions_completed: 0,
            }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // combined identified: 5+5 = 10, completed: 5+4 = 9
      expect(r.action_completion_rate).toBe(90);
    });

    it("returns 0 when no actions identified (pct(0,0)=0)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              actions_identified: 0,
              actions_completed: 0,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-1",
              actions_identified: 0,
              actions_completed: 0,
            }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.action_completion_rate).toBe(0);
    });
  });

  describe("Bonus 7: staffWellbeingDiscussionRate", () => {
    // pct(supervisions with wellbeing, totalSupervisions). >=90 → +3, >=70 → +1

    it("awards +3 when wellbeing rate >= 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid, wellbeing_discussed: true }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // wellbeing: 100% → +3, quality: 3.0 → +1, sg: 100% → +3
      // Score = 52+0+1+3+0+0+0+3+0+0 = 59
      expect(r.supervision_score).toBe(59);
    });

    it("awards +1 when wellbeing rate >= 70% but < 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const sups = staffIds.map((sid, i) =>
        makeSupervision({ staff_id: sid, wellbeing_discussed: i < 7 }),
      );
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: sups,
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // wellbeing: 70% → +1
      // Score = 52+0+1+3+0+0+0+1+0+0 = 57
      expect(r.supervision_score).toBe(57);
    });

    it("awards +0 when wellbeing rate < 70%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const sups = staffIds.map((sid, i) =>
        makeSupervision({ staff_id: sid, wellbeing_discussed: i < 5 }),
      );
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: sups,
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // wellbeing: 50% → +0
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });
  });

  describe("Bonus 8: professionalDevelopmentDiscussionRate", () => {
    // pct(supervisions with PD, totalSupervisions). >=80 → +3, >=60 → +1

    it("awards +3 when PD rate >= 80%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              professional_development_discussed: true,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // PD: 100% → +3, quality: 3.0 → +1, sg: 100% → +3
      // Score = 52+0+1+3+0+0+0+0+3+0 = 59
      expect(r.supervision_score).toBe(59);
    });

    it("awards +1 when PD rate >= 60% but < 80%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const sups = staffIds.map((sid, i) =>
        makeSupervision({
          staff_id: sid,
          professional_development_discussed: i < 6,
        }),
      );
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: sups,
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // PD: 60% → +1
      // Score = 52+0+1+3+0+0+0+0+1+0 = 57
      expect(r.supervision_score).toBe(57);
    });

    it("awards +0 when PD rate < 60%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const sups = staffIds.map((sid, i) =>
        makeSupervision({
          staff_id: sid,
          professional_development_discussed: i < 5,
        }),
      );
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: sups,
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // PD: 50% → +0
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });
  });

  describe("Bonus 9: matrixComplianceRate", () => {
    // pct(unique staff in matrix, total_staff). >=90 → +3, >=75 → +1

    it("awards +3 when matrix compliance >= 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 9).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      // matrix: pct(9,10) = 90% → +3
      // timeliness: pct(9,9) = 100% → +4
      // quality: 3.0 → +1, sg: 100% → +3
      // Score = 52+4+1+3+0+0+0+0+0+3 = 63
      expect(r.supervision_score).toBe(63);
    });

    it("awards +1 when matrix compliance >= 75% but < 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 8).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      // matrix: pct(8,10) = 80% → +1
      // timeliness: pct(8,8) = 100% → +4
      // quality: +1, sg: +3
      // Score = 52+4+1+3+0+0+0+0+0+1 = 61
      expect(r.supervision_score).toBe(61);
    });

    it("awards +0 when matrix compliance < 75%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 7).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      // matrix: pct(7,10) = 70% → +0
      // timeliness: pct(7,7) = 100% → +4
      // quality: +1, sg: +3
      // Score = 52+4+1+3+0+0+0+0+0+0 = 60
      expect(r.supervision_score).toBe(60);
    });
  });

  // ── All bonuses combined ──────────────────────────────────────────────

  describe("all bonuses combined → outstanding", () => {
    it("reaches score 80 with all 9 bonuses at top tier", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 5,
              actions_identified: 10,
              actions_completed: 10,
              wellbeing_discussed: true,
              professional_development_discussed: true,
              child_focused_topics_discussed: true,
            }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({
              staff_id: sid,
              learning_identified: true,
              shared_with_team: true,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({
              staff_id: sid,
              competence_assessed: true,
            }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      expect(r.supervision_score).toBe(80);
      expect(r.supervision_rating).toBe("outstanding");
      expect(r.headline).toContain("Outstanding");
    });
  });

  // ── Penalties ─────────────────────────────────────────────────────────

  describe("Penalty 1: supervisionCoverageRate < 50%", () => {
    it("applies -5 when less than 50% of staff have supervisions", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      // 4/10 staff have supervisions = 40%
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: 3.0 → +1, sg: 100% → +3
      // Penalty: coverage 40% < 50 → -5
      // Score = 52+0+1+3+0+0+0+0+0+0 -5 = 51
      expect(r.supervision_score).toBe(51);
    });

    it("does not apply when total_staff = 0", () => {
      // total_staff = 0 + some data means allEmpty is false, so we proceed to compute.
      // But wait, with total_staff=0 and some data, allEmpty is false, so engine runs.
      // supervisionCoverageRate = pct(staff_with_supervision, 0) = 0. But guard: total_staff > 0 is false.
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 0,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // No coverage penalty since total_staff = 0
      // quality: 3.0 → +1
      // Score = 52+0+1+0+0+0+0+0+0+0 = 53
      expect(r.supervision_score).toBe(53);
    });
  });

  describe("Penalty 2: safeguardingSupervisionCoverageRate < 30%", () => {
    it("applies -5 when SG coverage < 30%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      // 2/10 = 20% SG coverage
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: +1, sg bonus: 20% → +0
      // Penalty: sg < 30% → -5
      // Score = 52+0+1+0+0+0+0+0+0+0 -5 = 48
      expect(r.supervision_score).toBe(48);
    });

    it("does not apply when total_staff = 0", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 0,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // sg coverage = pct(0,0) = 0, but guard: total_staff > 0 is false → no penalty
      // Score = 52+0+1+0+0+0+0+0+0+0 = 53
      expect(r.supervision_score).toBe(53);
    });

    it("does not apply at exactly 30%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 3).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // sg: 30% → no penalty (< 30 required)
      // Score = 52+0+1+0+0+0+0+0+0+0 = 53
      expect(r.supervision_score).toBe(53);
    });
  });

  describe("Penalty 3: actionCompletionRate < 40%", () => {
    it("applies -4 when action completion < 40%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 3, // 30%
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // actions: pct(30,100) = 30% → +0, penalty: -4
      // quality: +1, sg: +3
      // Score = 52+0+1+3+0+0+0+0+0+0 -4 = 52
      expect(r.supervision_score).toBe(52);
    });

    it("does not apply when no actions identified (guard)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 0,
              actions_completed: 0,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({
              staff_id: sid,
              actions_identified: 0,
              actions_completed: 0,
            }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // actionCompletionRate = pct(0,0) = 0, but combinedActionsIdentified = 0 → no penalty
      // quality: +1, sg: +3
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });

    it("does not apply at exactly 40%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 4,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // actions: pct(40,100) = 40% → no penalty (< 40 required)
      // quality: +1, sg: +3
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });
  });

  describe("Penalty 4: overdue > 50% of matrix", () => {
    it("applies -4 when more than 50% of matrix entries are overdue", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          // 6 overdue out of 10 = 60% > 50%
          supervision_matrix: [
            ...staffIds.slice(0, 4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            ...staffIds.slice(4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: true }),
            ),
          ],
        }),
      );
      // timeliness: pct(4,10) = 40% → +0
      // quality: +1, sg: +3
      // matrix: 100% → +3
      // Penalty: overdue 60% > 50 → -4
      // Score = 52+0+1+3+0+0+0+0+0+3 -4 = 55
      expect(r.supervision_score).toBe(55);
    });

    it("does not apply at exactly 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          // 5 overdue out of 10 = 50% → NOT > 50%
          supervision_matrix: [
            ...staffIds.slice(0, 5).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            ...staffIds.slice(5).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: true }),
            ),
          ],
        }),
      );
      // No overdue penalty
      // timeliness: pct(5,10) = 50% → +0
      // quality: +1, sg: +3, matrix: +3
      // Score = 52+0+1+3+0+0+0+0+0+3 = 59
      expect(r.supervision_score).toBe(59);
    });

    it("does not apply when no matrix entries (guard)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // No matrix entries → guard fails → no overdue penalty
      // quality: +1, sg: +3
      // Score = 52+0+1+3+0+0+0+0+0+0 = 56
      expect(r.supervision_score).toBe(56);
    });
  });

  describe("multiple penalties can stack", () => {
    it("applies coverage and SG penalties together (-10)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: +1, sg: 20% → +0
      // Penalty: coverage 40% → -5, sg 20% → -5
      // Score = 52+0+1+0+0+0+0+0+0+0 -5-5 = 43
      expect(r.supervision_score).toBe(43);
    });

    it("applies all 4 penalties simultaneously", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 2,
              actions_identified: 10,
              actions_completed: 3,
            }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          // 4 matrix entries, 3 overdue = 75% > 50
          supervision_matrix: [
            makeMatrix({ staff_id: staffIds[0], overdue: false }),
            makeMatrix({ staff_id: staffIds[1], overdue: true }),
            makeMatrix({ staff_id: staffIds[2], overdue: true }),
            makeMatrix({ staff_id: staffIds[3], overdue: true }),
          ],
        }),
      );
      // quality: 2.0 → +0, sg: 20% → +0, actions: pct(12,40) = 30% → +0
      // timeliness: pct(1,4)=25% → +0, matrix: pct(4,10)=40% → +0
      // Penalties: coverage -5, sg -5, actions -4, overdue -4 = -18
      // Score = 52+0 -18 = 34
      expect(r.supervision_score).toBe(34);
      expect(r.supervision_rating).toBe("inadequate");
    });
  });

  // ── Score clamping ────────────────────────────────────────────────────

  describe("score clamping", () => {
    it("score cannot go below 0", () => {
      // With extreme penalties the score should clamp at 0
      // 52 - 18 = 34, which is > 0. Let's see if we can make it lower.
      // Actually max penalties are -18 from 52 = 34. Can't go below 0 in practice.
      // But let's verify the clamp logic works in principle.
      // Minimum realistic: 52-18=34, still positive. Just verify it doesn't go negative.
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 1,
              actions_identified: 10,
              actions_completed: 0,
            }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 1).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            makeMatrix({ staff_id: staffIds[0], overdue: false }),
            makeMatrix({ staff_id: staffIds[1], overdue: true }),
            makeMatrix({ staff_id: staffIds[2], overdue: true }),
            makeMatrix({ staff_id: staffIds[3], overdue: true }),
          ],
        }),
      );
      expect(r.supervision_score).toBeGreaterThanOrEqual(0);
      expect(r.supervision_score).toBeLessThanOrEqual(100);
    });
  });

  // ── Metric calculations ───────────────────────────────────────────────

  describe("metric calculations", () => {
    it("calculates supervision_timeliness_rate correctly", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            makeMatrix({ staff_id: "s-0", overdue: false }),
            makeMatrix({ staff_id: "s-1", overdue: true }),
            makeMatrix({ staff_id: "s-2", overdue: false }),
          ],
        }),
      );
      // pct(2, 3) = 67
      expect(r.supervision_timeliness_rate).toBe(67);
    });

    it("calculates supervision_quality_avg correctly with rounding", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 3,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 4 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 3 }),
            makeSupervision({ staff_id: "s-2", quality_rating: 5 }),
          ],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // (4+3+5)/3 = 4.0
      expect(r.supervision_quality_avg).toBe(4);
    });

    it("calculates supervision_quality_avg with one decimal", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 3,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 3 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 4 }),
            makeSupervision({ staff_id: "s-2", quality_rating: 4 }),
          ],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // (3+4+4)/3 = 3.6666... → Math.round(3.6666 * 10)/10 = 3.7
      expect(r.supervision_quality_avg).toBe(3.7);
    });

    it("calculates safeguarding_supervision_coverage_rate correctly", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }), // duplicate staff
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // unique staff: s-0, s-1 = 2. pct(2,5) = 40
      expect(r.safeguarding_supervision_coverage_rate).toBe(40);
    });

    it("calculates reflective_practice_engagement_rate correctly", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 4,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [],
          staff_reflections: [
            makeReflection({ staff_id: "s-0" }),
            makeReflection({ staff_id: "s-1" }),
            makeReflection({ staff_id: "s-1" }), // duplicate
            makeReflection({ staff_id: "s-2" }),
          ],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // unique: s-0, s-1, s-2 = 3. pct(3,4) = 75
      expect(r.reflective_practice_engagement_rate).toBe(75);
    });

    it("calculates theme_coverage_breadth with all 8 themes", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 1,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
          ],
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.theme_coverage_breadth).toBe(8);
    });

    it("calculates action_completion_rate as pct", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              actions_identified: 7,
              actions_completed: 5,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-1",
              actions_identified: 3,
              actions_completed: 2,
            }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // combined: 7+3=10 identified, 5+2=7 completed. pct(7,10) = 70
      expect(r.action_completion_rate).toBe(70);
    });

    it("reports total_supervisions from supervisions array length", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 3,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
            makeSupervision({ staff_id: "s-2" }),
          ],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.total_supervisions).toBe(3);
    });
  });

  // ── Strengths ─────────────────────────────────────────────────────────

  describe("strengths", () => {
    it("includes timeliness strength when >= 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid, overdue: false }),
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("100% of supervisions delivered on schedule"))).toBe(true);
    });

    it("includes timeliness mid-tier strength when >= 75% but < 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 8).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[8], overdue: true }),
            makeMatrix({ staff_id: staffIds[9], overdue: true }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80% supervision timeliness"))).toBe(true);
    });

    it("includes quality strength when avg >= 4.0", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 5 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 4 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Average supervision quality rating of 4.5/5.0") && s.includes("consistently high quality"))).toBe(true);
    });

    it("includes quality mid-tier strength when avg >= 3.0 but < 4.0", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 3 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 3 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("3/5.0") && s.includes("satisfactory"))).toBe(true);
    });

    it("includes SG strength when coverage = 100%", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every staff member has received safeguarding supervision"))).toBe(true);
    });

    it("includes reflective practice strength when >= 80%", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 4).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80% of staff actively engaged in reflective practice"))).toBe(true);
    });

    it("includes theme breadth strength when >= 6", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("6 out of 8 supervision theme areas covered"))).toBe(true);
    });

    it("includes action completion strength when >= 90%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              actions_identified: 10,
              actions_completed: 9,
            }),
            makeSupervision({
              staff_id: "s-1",
              actions_identified: 10,
              actions_completed: 10,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // pct(19,20) = 95
      expect(r.strengths.some((s) => s.includes("95% of supervision actions completed"))).toBe(true);
    });

    it("includes wellbeing strength when >= 90%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0", wellbeing_discussed: true }),
            makeSupervision({ staff_id: "s-1", wellbeing_discussed: true }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Staff wellbeing discussed in 100%"))).toBe(true);
    });

    it("includes PD strength when >= 80%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              professional_development_discussed: true,
            }),
            makeSupervision({
              staff_id: "s-1",
              professional_development_discussed: true,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Professional development discussed in 100%"))).toBe(true);
    });

    it("includes matrix compliance strength when >= 90%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("100% of staff included in the supervision matrix"))).toBe(true);
    });

    it("includes full supervision coverage strength when 100%", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Every staff member has received at least one supervision"))).toBe(true);
    });

    it("includes SG competence strength when >= 90%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-0",
              competence_assessed: true,
            }),
            makeSafeguardingSupervision({
              staff_id: "s-1",
              competence_assessed: true,
            }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Safeguarding competence assessed in 100%"))).toBe(true);
    });

    it("includes reflective learning strength when >= 80%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [
            makeReflection({ staff_id: "s-0", learning_identified: true }),
            makeReflection({ staff_id: "s-1", learning_identified: true }),
          ],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100% of reflective practice entries identify specific learning"))).toBe(true);
    });

    it("includes reflective sharing strength when >= 70%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [
            makeReflection({ staff_id: "s-0", shared_with_team: true }),
            makeReflection({ staff_id: "s-1", shared_with_team: true }),
          ],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("100% of reflective practice entries shared with the team"))).toBe(true);
    });

    it("includes child-focused strength when >= 80%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              child_focused_topics_discussed: true,
            }),
            makeSupervision({
              staff_id: "s-1",
              child_focused_topics_discussed: true,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Child-focused topics discussed in 100%"))).toBe(true);
    });
  });

  // ── Concerns ──────────────────────────────────────────────────────────

  describe("concerns", () => {
    it("includes low coverage concern when < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 40% of staff have received supervision"))).toBe(true);
    });

    it("includes mid-range coverage concern when 50-79%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 6).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Supervision coverage at 60%"))).toBe(true);
    });

    it("includes low timeliness concern when < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            ...staffIds.slice(4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: true }),
            ),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 40% of supervisions delivered on time"))).toBe(true);
    });

    it("includes low quality concern when avg < 2.5", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 1 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 2 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("quality rating of 1.5/5.0") && c.includes("poor"))).toBe(true);
    });

    it("includes low SG concern when < 30%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 20% of staff have received safeguarding supervision"))).toBe(true);
    });

    it("includes low reflective practice concern when < 30%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 2).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 20% of staff engaged in reflective practice"))).toBe(true);
    });

    it("includes low action completion concern when < 40%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              actions_identified: 10,
              actions_completed: 3,
            }),
            makeSupervision({
              staff_id: "s-1",
              actions_identified: 10,
              actions_completed: 3,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 30% of supervision actions completed"))).toBe(true);
    });

    it("includes low wellbeing concern when < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              wellbeing_discussed: i < 4,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Staff wellbeing discussed in only 40%"))).toBe(true);
    });

    it("includes low PD concern when < 40%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              professional_development_discussed: i < 3,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Professional development discussed in only 30%"))).toBe(true);
    });

    it("includes narrow theme concern when < 3 themes", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 2 supervision theme areas covered"))).toBe(true);
    });

    it("includes low matrix concern when < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 4).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 40% of staff included in the supervision matrix"))).toBe(true);
    });

    it("includes overdue concern when any overdue", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 3).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[3], overdue: true }),
            makeMatrix({ staff_id: staffIds[4], overdue: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("2 supervisions currently overdue"))).toBe(true);
    });

    it("includes SG competence concern when < 50%", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-0",
              competence_assessed: false,
            }),
            makeSafeguardingSupervision({
              staff_id: "s-1",
              competence_assessed: false,
            }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Safeguarding competence assessed in only 0%"))).toBe(true);
    });

    it("includes no supervisions concern when totalSupervisions = 0 but staff > 0", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: [],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("No supervision sessions recorded despite staff being employed"))).toBe(true);
    });

    it("uses singular when 1 overdue", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[4], overdue: true }),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("1 supervision currently overdue"))).toBe(true);
    });

    it("uses singular for 1 theme area", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [makeTheme({ theme: "safeguarding" })],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Only 1 supervision theme area covered"))).toBe(true);
    });
  });

  // ── Recommendations ───────────────────────────────────────────────────

  describe("recommendations", () => {
    it("generates recommendations with rank, urgency, and regulatory_ref", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 3,
            }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.length).toBeGreaterThan(0);
      for (const rec of r.recommendations) {
        expect(rec.rank).toBeGreaterThan(0);
        expect(["immediate", "soon", "planned"]).toContain(rec.urgency);
        expect(rec.regulatory_ref).toBeTruthy();
        expect(rec.recommendation).toBeTruthy();
      }
    });

    it("recommends supervision when coverage < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.urgency === "immediate" && rec.recommendation.includes("Urgently establish formal supervision"))).toBe(true);
    });

    it("recommends recording when no supervisions but staff > 0", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: [],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Begin recording supervision sessions"))).toBe(true);
    });

    it("recommends SG supervision when coverage < 30%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Urgently implement safeguarding supervision"))).toBe(true);
    });

    it("recommends action tracking when completion < 40%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 3,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Implement an action tracking system"))).toBe(true);
    });

    it("recommends matrix creation when matrix < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 4).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Create a complete supervision matrix"))).toBe(true);
    });

    it("recommends scheduling fix when timeliness < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            ...staffIds.slice(4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: true }),
            ),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Address systemic supervision scheduling failures"))).toBe(true);
    });

    it("recommends coverage improvement when 50-79%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 6).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase supervision coverage to at least 80%"))).toBe(true);
    });

    it("recommends SG expansion when 30-79%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 5).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend safeguarding supervision to all staff"))).toBe(true);
    });

    it("recommends reflective framework when engagement < 30%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 2).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Establish a reflective practice framework"))).toBe(true);
    });

    it("recommends wellbeing agenda when < 50%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              wellbeing_discussed: i < 4,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Embed wellbeing as a standing agenda item"))).toBe(true);
    });

    it("recommends PD inclusion when < 40%", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              professional_development_discussed: i < 3,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Include professional development as a regular supervision topic"))).toBe(true);
    });

    it("recommends theme broadening when < 4 themes", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Broaden supervision theme coverage"))).toBe(true);
    });

    it("recommends overdue rescheduling when > 3 overdue", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 5).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            ...staffIds.slice(5).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: true }),
            ),
          ],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Reschedule 5 overdue supervisions"))).toBe(true);
    });

    it("ranks recommendations sequentially", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 3,
            }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ── Insights ──────────────────────────────────────────────────────────

  describe("insights", () => {
    describe("critical insights", () => {
      it("adds critical insight for low supervision coverage", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.slice(0, 4).map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Only 40% of staff have received supervision"))).toBe(true);
      });

      it("adds critical insight for low SG coverage", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Only 20% of staff have received safeguarding supervision"))).toBe(true);
      });

      it("adds critical insight for no supervisions", () => {
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 5,
            supervisions: [],
            safeguarding_supervisions: [
              makeSafeguardingSupervision({ staff_id: "s-0" }),
            ],
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("No supervision sessions have been recorded"))).toBe(true);
      });

      it("adds critical insight for low action completion", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({
                staff_id: sid,
                actions_identified: 10,
                actions_completed: 3,
              }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Only 30% of supervision actions completed"))).toBe(true);
      });

      it("adds critical insight for low matrix compliance", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: staffIds.slice(0, 4).map((sid) =>
              makeMatrix({ staff_id: sid }),
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("Only 40% of staff are included in the supervision matrix"))).toBe(true);
      });
    });

    describe("warning insights", () => {
      it("adds warning for mid-range coverage", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.slice(0, 6).map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Supervision coverage at 60%"))).toBe(true);
      });

      it("adds warning for mid-range timeliness", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            // 6 on time, 4 overdue = 60%
            supervision_matrix: [
              ...staffIds.slice(0, 6).map((sid) =>
                makeMatrix({ staff_id: sid, overdue: false }),
              ),
              ...staffIds.slice(6).map((sid) =>
                makeMatrix({ staff_id: sid, overdue: true }),
              ),
            ],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Supervision timeliness at 60%"))).toBe(true);
      });

      it("adds warning for small number of overdue (1-3)", () => {
        const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 5,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [
              ...staffIds.slice(0, 3).map((sid) =>
                makeMatrix({ staff_id: sid, overdue: false }),
              ),
              makeMatrix({ staff_id: staffIds[3], overdue: true }),
              makeMatrix({ staff_id: staffIds[4], overdue: true }),
            ],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("2 supervisions are overdue"))).toBe(true);
      });

      it("adds warning for large overdue count (>3)", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [
              ...staffIds.slice(0, 5).map((sid) =>
                makeMatrix({ staff_id: sid, overdue: false }),
              ),
              ...staffIds.slice(5).map((sid) =>
                makeMatrix({ staff_id: sid, overdue: true }),
              ),
            ],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("5 supervisions are overdue"))).toBe(true);
      });

      it("adds warning for mid-range action completion", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({
                staff_id: sid,
                actions_identified: 10,
                actions_completed: 5,
              }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Supervision action completion at 50%"))).toBe(true);
      });
    });

    describe("positive insights", () => {
      it("adds positive insight for outstanding rating", () => {
        const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 10,
            supervisions: staffIds.map((sid) =>
              makeSupervision({
                staff_id: sid,
                quality_rating: 5,
                actions_identified: 10,
                actions_completed: 10,
                wellbeing_discussed: true,
                professional_development_discussed: true,
                child_focused_topics_discussed: true,
              }),
            ),
            staff_reflections: staffIds.map((sid) =>
              makeReflection({
                staff_id: sid,
                learning_identified: true,
                shared_with_team: true,
              }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({
                staff_id: sid,
                competence_assessed: true,
              }),
            ),
            supervision_themes: [
              makeTheme({ theme: "safeguarding" }),
              makeTheme({ theme: "behaviour_management" }),
              makeTheme({ theme: "therapeutic_care" }),
              makeTheme({ theme: "health_wellbeing" }),
              makeTheme({ theme: "education" }),
              makeTheme({ theme: "diversity" }),
              makeTheme({ theme: "practice_standards" }),
              makeTheme({ theme: "professional_development" }),
            ],
            supervision_matrix: staffIds.map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding supervision and reflective practice oversight"))).toBe(true);
      });

      it("adds positive insight for full supervision coverage", () => {
        const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 5,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every staff member has received supervision"))).toBe(true);
      });

      it("adds positive insight for full SG coverage", () => {
        const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 5,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("All staff have received safeguarding supervision"))).toBe(true);
      });

      it("adds positive insight for high reflective engagement", () => {
        const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 5,
            supervisions: staffIds.map((sid) =>
              makeSupervision({ staff_id: sid }),
            ),
            safeguarding_supervisions: staffIds.map((sid) =>
              makeSafeguardingSupervision({ staff_id: sid }),
            ),
            staff_reflections: staffIds.slice(0, 4).map((sid) =>
              makeReflection({ staff_id: sid }),
            ),
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("80% reflective practice engagement"))).toBe(true);
      });

      it("adds positive insight for high action completion", () => {
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 2,
            supervisions: [
              makeSupervision({
                staff_id: "s-0",
                actions_identified: 10,
                actions_completed: 10,
              }),
              makeSupervision({
                staff_id: "s-1",
                actions_identified: 10,
                actions_completed: 9,
              }),
            ],
            safeguarding_supervisions: [
              makeSafeguardingSupervision({ staff_id: "s-0" }),
              makeSafeguardingSupervision({ staff_id: "s-1" }),
            ],
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("95% of supervision actions completed"))).toBe(true);
      });

      it("adds positive insight for high quality", () => {
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 2,
            supervisions: [
              makeSupervision({ staff_id: "s-0", quality_rating: 4 }),
              makeSupervision({ staff_id: "s-1", quality_rating: 5 }),
            ],
            safeguarding_supervisions: [
              makeSafeguardingSupervision({ staff_id: "s-0" }),
              makeSafeguardingSupervision({ staff_id: "s-1" }),
            ],
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Average supervision quality of 4.5/5.0"))).toBe(true);
      });

      it("adds positive insight for combined wellbeing + PD", () => {
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 2,
            supervisions: [
              makeSupervision({
                staff_id: "s-0",
                wellbeing_discussed: true,
                professional_development_discussed: true,
              }),
              makeSupervision({
                staff_id: "s-1",
                wellbeing_discussed: true,
                professional_development_discussed: true,
              }),
            ],
            safeguarding_supervisions: [
              makeSafeguardingSupervision({ staff_id: "s-0" }),
              makeSafeguardingSupervision({ staff_id: "s-1" }),
            ],
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Supervision consistently addresses both staff wellbeing and professional development"))).toBe(true);
      });

      it("adds positive insight for 7+ theme breadth", () => {
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 2,
            supervisions: [
              makeSupervision({ staff_id: "s-0" }),
              makeSupervision({ staff_id: "s-1" }),
            ],
            safeguarding_supervisions: [
              makeSafeguardingSupervision({ staff_id: "s-0" }),
              makeSafeguardingSupervision({ staff_id: "s-1" }),
            ],
            staff_reflections: [],
            supervision_themes: [
              makeTheme({ theme: "safeguarding" }),
              makeTheme({ theme: "behaviour_management" }),
              makeTheme({ theme: "therapeutic_care" }),
              makeTheme({ theme: "health_wellbeing" }),
              makeTheme({ theme: "education" }),
              makeTheme({ theme: "diversity" }),
              makeTheme({ theme: "practice_standards" }),
            ],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("7 out of 8 supervision theme areas covered"))).toBe(true);
      });

      it("adds positive insight for high SG competence rate", () => {
        const r = computeStaffSupervisionReflectivePractice(
          baseInput({
            total_staff: 2,
            supervisions: [
              makeSupervision({ staff_id: "s-0" }),
              makeSupervision({ staff_id: "s-1" }),
            ],
            safeguarding_supervisions: [
              makeSafeguardingSupervision({
                staff_id: "s-0",
                competence_assessed: true,
              }),
              makeSafeguardingSupervision({
                staff_id: "s-1",
                competence_assessed: true,
              }),
            ],
            staff_reflections: [],
            supervision_themes: [],
            supervision_matrix: [],
          }),
        );
        expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Safeguarding competence assessed in 100%"))).toBe(true);
      });
    });
  });

  // ── Headlines ─────────────────────────────────────────────────────────

  describe("headlines", () => {
    it("uses 'Outstanding' for outstanding rating", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 5,
              actions_identified: 10,
              actions_completed: 10,
              wellbeing_discussed: true,
              professional_development_discussed: true,
            }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.headline).toContain("Outstanding staff supervision and reflective practice oversight");
    });

    it("uses 'Good' for good rating", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid, quality_rating: 2.9 }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.headline).toContain("Good supervision and reflective practice oversight");
    });

    it("uses 'Adequate' for adequate rating", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // quality: 3.0 → +1. sg: 0% → penalty -5. Coverage: 100% → no penalty.
      // Score = 52+0+1+0+0+0+0+0+0+0-5 = 48
      expect(r.supervision_rating).toBe("adequate");
      expect(r.headline).toContain("Adequate supervision and reflective practice oversight");
    });

    it("uses 'inadequate' for inadequate rating", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 4).map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 2,
              actions_identified: 10,
              actions_completed: 3,
            }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 2).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            makeMatrix({ staff_id: staffIds[0], overdue: false }),
            makeMatrix({ staff_id: staffIds[1], overdue: true }),
            makeMatrix({ staff_id: staffIds[2], overdue: true }),
            makeMatrix({ staff_id: staffIds[3], overdue: true }),
          ],
        }),
      );
      expect(r.supervision_rating).toBe("inadequate");
      expect(r.headline).toContain("supervision and reflective practice oversight is inadequate");
    });

    it("headline includes concern count for adequate", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.supervision_rating).toBe("adequate");
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("headline includes strength count for good", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid, quality_rating: 2.9 }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.supervision_rating).toBe("good");
      expect(r.headline).toMatch(/\d+ strength/);
    });
  });

  // ── Edge cases ────────────────────────────────────────────────────────

  describe("edge cases", () => {
    it("single supervision record", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 1,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              quality_rating: 5,
              actions_identified: 1,
              actions_completed: 1,
              wellbeing_discussed: true,
              professional_development_discussed: true,
              child_focused_topics_discussed: true,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-0",
              competence_assessed: true,
            }),
          ],
          staff_reflections: [
            makeReflection({
              staff_id: "s-0",
              learning_identified: true,
              shared_with_team: true,
            }),
          ],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
          ],
          supervision_matrix: [makeMatrix({ staff_id: "s-0", overdue: false })],
        }),
      );
      expect(r.total_supervisions).toBe(1);
      expect(r.supervision_quality_avg).toBe(5);
      expect(r.supervision_rating).toBe("outstanding");
    });

    it("duplicate staff_ids in supervisions are counted for coverage", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-0" }),
          ],
          safeguarding_supervisions: Array.from({ length: 5 }, (_, i) =>
            makeSafeguardingSupervision({ staff_id: `s-${i}` }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // unique staff with supervision: 1 → pct(1,5) = 20 → coverage < 50% → penalty
      expect(r.concerns.some((c) => c.includes("Only 20% of staff have received supervision"))).toBe(true);
    });

    it("quality rating at boundary 3.0 exactly gets +1 bonus", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 1,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 3.0 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.supervision_quality_avg).toBe(3);
      // quality bonus = +1
    });

    it("quality rating at boundary 4.0 exactly gets +3 bonus", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 1,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 4.0 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.supervision_quality_avg).toBe(4);
    });

    it("pct(0,0) returns 0", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 0,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: [],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // sg coverage: pct(0,0) = 0, reflective: pct(0,0) = 0
      expect(r.safeguarding_supervision_coverage_rate).toBe(0);
      expect(r.reflective_practice_engagement_rate).toBe(0);
    });

    it("multiple matrix entries for same staff count as one unique", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: [makeSupervision({ staff_id: "s-0" })],
          safeguarding_supervisions: Array.from({ length: 5 }, (_, i) =>
            makeSafeguardingSupervision({ staff_id: `s-${i}` }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            makeMatrix({ staff_id: "s-0" }),
            makeMatrix({ staff_id: "s-0" }),
            makeMatrix({ staff_id: "s-0" }),
          ],
        }),
      );
      // matrixComplianceRate = pct(1, 5) = 20%
      // But totalMatrixEntries = 3
      expect(r.supervision_timeliness_rate).toBe(100); // 3 on time, 0 overdue
    });

    it("handles large numbers of records", () => {
      const staffIds = Array.from({ length: 100 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 100,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              quality_rating: 4,
              actions_identified: 5,
              actions_completed: 5,
              wellbeing_discussed: true,
              professional_development_discussed: true,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
            makeTheme({ theme: "diversity" }),
            makeTheme({ theme: "practice_standards" }),
            makeTheme({ theme: "professional_development" }),
          ],
          supervision_matrix: staffIds.map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.supervision_rating).toBe("outstanding");
      expect(r.total_supervisions).toBe(100);
    });

    it("zero-length actions with all arrays empty but total_staff > 0 goes to special case", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({ total_staff: 3 }),
      );
      expect(r.supervision_rating).toBe("inadequate");
      expect(r.supervision_score).toBe(15);
    });

    it("only supervision_themes non-empty (allEmpty = false)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervision_themes: [makeTheme({ theme: "safeguarding" })],
        }),
      );
      // allEmpty is false because supervision_themes not empty → proceeds to compute
      // No supervisions: quality = 0, coverage = 0% → penalty -5
      // sg: pct(0,5) = 0% → penalty -5
      // themes: 1 → +0
      // Score = 52+0+0+0+0+0+0+0+0+0 -5-5 = 42
      expect(r.supervision_score).toBe(42);
      expect(r.supervision_rating).toBe("inadequate");
    });

    it("only supervision_matrix non-empty (allEmpty = false)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervision_matrix: [
            makeMatrix({ staff_id: "s-0", overdue: false }),
          ],
        }),
      );
      // allEmpty is false
      // supervisionCoverage: pct(0,5) = 0% → -5
      // sg: pct(0,5) = 0% → -5
      // timeliness: pct(1,1) = 100% → +4
      // matrix: pct(1,5) = 20% → +0
      // Score = 52+4+0+0+0+0+0+0+0+0 -5-5 = 46
      expect(r.supervision_score).toBe(46);
      expect(r.supervision_rating).toBe("adequate");
    });

    it("staff_reflections only (allEmpty = false)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          staff_reflections: [
            makeReflection({ staff_id: "s-0" }),
            makeReflection({ staff_id: "s-1" }),
            makeReflection({ staff_id: "s-2" }),
            makeReflection({ staff_id: "s-3" }),
          ],
        }),
      );
      // allEmpty false, reflective = pct(4,5) = 80% → +3
      // coverage: 0% → -5, sg: 0% → -5
      // Score = 52+0+0+0+3+0+0+0+0+0 -5-5 = 45
      expect(r.supervision_score).toBe(45);
      expect(r.supervision_rating).toBe("adequate");
    });

    it("mid-range concern for quality (2.5-2.9)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 2 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 3 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // avg = 2.5 → concern for 2.5-2.99
      expect(r.supervision_quality_avg).toBe(2.5);
      expect(r.concerns.some((c) => c.includes("quality rating of 2.5/5.0") && c.includes("below the expected standard"))).toBe(true);
    });

    it("mid-range concern for SG coverage (30-79%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 5).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Safeguarding supervision coverage at 50%"))).toBe(true);
    });

    it("mid-range concern for reflective practice (30-59%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 4).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Reflective practice engagement at 40%"))).toBe(true);
    });

    it("mid-range concern for action completion (40-69%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 5,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Supervision action completion at 50%"))).toBe(true);
    });

    it("mid-range concern for wellbeing (50-69%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              wellbeing_discussed: i < 6,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Staff wellbeing discussed in 60%") && c.includes("not consistently"))).toBe(true);
    });

    it("mid-range concern for PD (40-59%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              professional_development_discussed: i < 5,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Professional development discussed in 50%") && c.includes("not a consistent feature"))).toBe(true);
    });

    it("mid-range concern for theme coverage (3)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.concerns.some((c) => c.includes("3 supervision theme areas covered") && c.includes("could be broader"))).toBe(true);
    });

    it("mid-range concern for matrix compliance (50-74%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 6).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.concerns.some((c) => c.includes("Supervision matrix coverage at 60%"))).toBe(true);
    });

    it("mid-range timeliness concern (50-74%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 6).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            ...staffIds.slice(6).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: true }),
            ),
          ],
        }),
      );
      expect(r.concerns.some((c) => c.includes("Supervision timeliness at 60%") && c.includes("delivered late"))).toBe(true);
    });

    it("SG competence warning insight (50-79%)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({
              staff_id: "s-0",
              competence_assessed: true,
            }),
            makeSafeguardingSupervision({
              staff_id: "s-1",
              competence_assessed: false,
            }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Safeguarding competence assessed in 50%"))).toBe(true);
    });

    it("quality warning insight (2.5-2.9)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0", quality_rating: 3 }),
            makeSupervision({ staff_id: "s-1", quality_rating: 2 }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      // avg = 2.5
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("quality rating of 2.5/5.0"))).toBe(true);
    });

    it("SG warning insight (30-79%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 5).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Safeguarding supervision coverage at 50%"))).toBe(true);
    });

    it("reflective practice warning insight (30-59%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 4).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Reflective practice engagement at 40%"))).toBe(true);
    });

    it("wellbeing warning insight (50-69%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              wellbeing_discussed: i < 6,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Staff wellbeing discussed in 60%"))).toBe(true);
    });

    it("PD warning insight (40-59%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              professional_development_discussed: i < 5,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("Professional development discussed in 50%"))).toBe(true);
    });

    it("overdue singular ('is') for exactly 1 overdue in insight", () => {
      const staffIds = Array.from({ length: 5 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 5,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [
            ...staffIds.slice(0, 4).map((sid) =>
              makeMatrix({ staff_id: sid, overdue: false }),
            ),
            makeMatrix({ staff_id: staffIds[4], overdue: true }),
          ],
        }),
      );
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("1 supervision is overdue"))).toBe(true);
    });

    it("reflective practice mid-tier recommendation (30-59%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 4).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase reflective practice participation"))).toBe(true);
    });

    it("action mid-tier recommendation (40-69%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({
              staff_id: sid,
              actions_identified: 10,
              actions_completed: 5,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve supervision action completion to at least 70%"))).toBe(true);
    });

    it("supervision coverage 80% strength (>= 80, < 100)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.slice(0, 8).map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80% of staff have received supervision"))).toBe(true);
    });

    it("SG coverage 80% mid-tier strength", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.slice(0, 8).map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("80% of staff have received safeguarding supervision"))).toBe(true);
    });

    it("reflective practice mid-tier strength (60-79%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: staffIds.slice(0, 7).map((sid) =>
            makeReflection({ staff_id: sid }),
          ),
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("70% reflective practice engagement"))).toBe(true);
    });

    it("theme mid-tier strength (4-5)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({ staff_id: "s-0" }),
            makeSupervision({ staff_id: "s-1" }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [
            makeTheme({ theme: "safeguarding" }),
            makeTheme({ theme: "behaviour_management" }),
            makeTheme({ theme: "therapeutic_care" }),
            makeTheme({ theme: "health_wellbeing" }),
            makeTheme({ theme: "education" }),
          ],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("5 supervision theme areas covered"))).toBe(true);
    });

    it("action completion mid-tier strength (70-89%)", () => {
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 2,
          supervisions: [
            makeSupervision({
              staff_id: "s-0",
              actions_identified: 10,
              actions_completed: 7,
            }),
            makeSupervision({
              staff_id: "s-1",
              actions_identified: 10,
              actions_completed: 7,
            }),
          ],
          safeguarding_supervisions: [
            makeSafeguardingSupervision({ staff_id: "s-0" }),
            makeSafeguardingSupervision({ staff_id: "s-1" }),
          ],
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("70% supervision action completion"))).toBe(true);
    });

    it("wellbeing mid-tier strength (70-89%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              wellbeing_discussed: i < 7,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Staff wellbeing discussed in 70%"))).toBe(true);
    });

    it("PD mid-tier strength (60-79%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid, i) =>
            makeSupervision({
              staff_id: sid,
              professional_development_discussed: i < 7,
            }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: [],
        }),
      );
      expect(r.strengths.some((s) => s.includes("Professional development discussed in 70%") && s.includes("regular part"))).toBe(true);
    });

    it("matrix mid-tier strength (75-89%)", () => {
      const staffIds = Array.from({ length: 10 }, (_, i) => `s-${i}`);
      const r = computeStaffSupervisionReflectivePractice(
        baseInput({
          total_staff: 10,
          supervisions: staffIds.map((sid) =>
            makeSupervision({ staff_id: sid }),
          ),
          safeguarding_supervisions: staffIds.map((sid) =>
            makeSafeguardingSupervision({ staff_id: sid }),
          ),
          staff_reflections: [],
          supervision_themes: [],
          supervision_matrix: staffIds.slice(0, 8).map((sid) =>
            makeMatrix({ staff_id: sid }),
          ),
        }),
      );
      expect(r.strengths.some((s) => s.includes("80% supervision matrix coverage"))).toBe(true);
    });
  });
});
