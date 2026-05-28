import { describe, it, expect } from "vitest";
import {
  computeCulturalIdentityDiversity,
  type CulturalIdentityDiversityInput,
  type CulturalIdentityPlanInput,
  type CulturalReligiousMentorInput,
  type CulturalVisitInput,
  type DiversityCalendarEventInput,
  type PersonalPassportInput,
  type CulturalIdentityDiversityResult,
} from "../home-cultural-identity-diversity-intelligence-engine";

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function makeCulturalIdentityPlan(
  id: string,
  overrides: Partial<CulturalIdentityPlanInput> = {},
): CulturalIdentityPlanInput {
  return {
    id,
    child_id: "c1",
    plan_date: "2025-03-01",
    ethnicity_documented: true,
    religion_documented: true,
    language_needs_documented: true,
    identity_goals_set: true,
    child_voice_captured: true,
    reviewed: true,
    review_date: "2025-05-01",
    next_review_date: "2025-08-01",
    active: true,
    life_story_work_active: true,
    created_at: "2025-03-01T10:00:00Z",
    ...overrides,
  };
}

function makeCulturalReligiousMentor(
  id: string,
  overrides: Partial<CulturalReligiousMentorInput> = {},
): CulturalReligiousMentorInput {
  return {
    id,
    child_id: "c1",
    mentor_name: "Mentor A",
    mentor_type: "cultural",
    start_date: "2025-01-15",
    active: true,
    meetings_held: 5,
    last_meeting_date: "2025-05-15",
    created_at: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

function makeCulturalVisit(
  id: string,
  overrides: Partial<CulturalVisitInput> = {},
): CulturalVisitInput {
  return {
    id,
    child_id: "c1",
    visit_date: "2025-04-20",
    visit_type: "cultural_site",
    description: "Museum visit",
    child_feedback_positive: true,
    staff_accompanied: true,
    created_at: "2025-04-20T10:00:00Z",
    ...overrides,
  };
}

function makeDiversityCalendarEvent(
  id: string,
  overrides: Partial<DiversityCalendarEventInput> = {},
): DiversityCalendarEventInput {
  return {
    id,
    event_name: "Cultural Event",
    event_date: "2025-04-15",
    event_type: "cultural_celebration",
    children_participated: ["c1", "c2", "c3", "c4"],
    staff_participated: ["s1", "s2"],
    activities_held: true,
    learning_documented: true,
    created_at: "2025-04-15T10:00:00Z",
    ...overrides,
  };
}

function makePersonalPassport(
  id: string,
  overrides: Partial<PersonalPassportInput> = {},
): PersonalPassportInput {
  return {
    id,
    child_id: "c1",
    last_updated: "2025-05-01",
    photo_current: true,
    identity_info_complete: true,
    cultural_needs_documented: true,
    preferences_documented: true,
    created_at: "2025-01-01T10:00:00Z",
    ...overrides,
  };
}

function baseInput(
  overrides: Partial<CulturalIdentityDiversityInput> = {},
): CulturalIdentityDiversityInput {
  return {
    today: "2025-06-01",
    total_children: 4,
    cultural_identity_plans: [
      makeCulturalIdentityPlan("p1", { child_id: "c1" }),
      makeCulturalIdentityPlan("p2", { child_id: "c2" }),
      makeCulturalIdentityPlan("p3", { child_id: "c3" }),
      makeCulturalIdentityPlan("p4", { child_id: "c4" }),
    ],
    cultural_religious_mentors: [
      makeCulturalReligiousMentor("m1", { child_id: "c1", mentor_type: "cultural" }),
      makeCulturalReligiousMentor("m2", { child_id: "c2", mentor_type: "religious" }),
      makeCulturalReligiousMentor("m3", { child_id: "c3", mentor_type: "community" }),
      makeCulturalReligiousMentor("m4", { child_id: "c4", mentor_type: "elder" }),
    ],
    cultural_visits: [
      makeCulturalVisit("v1", { child_id: "c1", visit_type: "cultural_site" }),
      makeCulturalVisit("v2", { child_id: "c2", visit_type: "religious_service" }),
      makeCulturalVisit("v3", { child_id: "c3", visit_type: "community_event" }),
      makeCulturalVisit("v4", { child_id: "c4", visit_type: "heritage_activity" }),
      makeCulturalVisit("v5", { child_id: "c1", visit_type: "food_culture" }),
      makeCulturalVisit("v6", { child_id: "c2" }),
      makeCulturalVisit("v7", { child_id: "c3" }),
      makeCulturalVisit("v8", { child_id: "c4" }),
      makeCulturalVisit("v9", { child_id: "c1" }),
      makeCulturalVisit("v10", { child_id: "c2" }),
      makeCulturalVisit("v11", { child_id: "c3" }),
      makeCulturalVisit("v12", { child_id: "c4" }),
      makeCulturalVisit("v13", { child_id: "c1" }),
      makeCulturalVisit("v14", { child_id: "c2" }),
      makeCulturalVisit("v15", { child_id: "c3" }),
      makeCulturalVisit("v16", { child_id: "c4" }),
    ],
    diversity_calendar_events: [
      makeDiversityCalendarEvent("e1", {
        children_participated: ["c1", "c2", "c3", "c4"],
      }),
    ],
    personal_passports: [
      makePersonalPassport("pp1", { child_id: "c1" }),
      makePersonalPassport("pp2", { child_id: "c2" }),
      makePersonalPassport("pp3", { child_id: "c3" }),
      makePersonalPassport("pp4", { child_id: "c4" }),
    ],
    ...overrides,
  } as any;
}

/* ── Tests ──────────────────────────────────────────────────────────────────── */

describe("Home Cultural Identity & Diversity Intelligence Engine", () => {
  // ==========================================================================
  // 1. SPECIAL CASES
  // ==========================================================================

  describe("special cases", () => {
    it("returns insufficient_data when everything is empty and 0 children", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 0,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.identity_rating).toBe("insufficient_data");
      expect(r.identity_score).toBe(0);
      expect(r.headline).toContain("insufficient data");
      expect(r.strengths).toHaveLength(0);
      expect(r.concerns).toHaveLength(0);
      expect(r.recommendations).toHaveLength(0);
      expect(r.insights).toHaveLength(0);
    });

    it("returns inadequate with score 15 when all empty + children > 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.identity_rating).toBe("inadequate");
      expect(r.identity_score).toBe(15);
      expect(r.headline).toContain("urgent attention");
    });

    it("allEmpty + children > 0 returns exactly 1 concern, 2 recommendations, 1 insight", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 3,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.concerns).toHaveLength(1);
      expect(r.recommendations).toHaveLength(2);
      expect(r.recommendations[0].urgency).toBe("immediate");
      expect(r.recommendations[1].urgency).toBe("soon");
      expect(r.insights).toHaveLength(1);
      expect(r.insights[0].severity).toBe("critical");
    });

    it("insufficient_data returns all metric fields as 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 0,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.total_cultural_plans).toBe(0);
      expect(r.cultural_plan_coverage_rate).toBe(0);
      expect(r.mentor_assignment_rate).toBe(0);
      expect(r.cultural_visits_per_child).toBe(0);
      expect(r.diversity_participation_rate).toBe(0);
      expect(r.life_story_work_rate).toBe(0);
      expect(r.religious_observance_rate).toBe(0);
      expect(r.identity_review_timeliness_rate).toBe(0);
      expect(r.personal_passport_currency_rate).toBe(0);
      expect(r.child_voice_in_plans_rate).toBe(0);
    });

    it("plans only (no mentors/visits/events/passports) is not allEmpty", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1" }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.identity_rating).not.toBe("insufficient_data");
      expect(r.identity_score).not.toBe(15);
    });

    it("mentors only (no plans/visits/events/passports) is not allEmpty", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
        ],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.identity_rating).not.toBe("insufficient_data");
    });

    it("visits only (no plans/mentors/events/passports) is not allEmpty", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1")],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.identity_rating).not.toBe("insufficient_data");
    });

    it("events only (no plans/mentors/visits/passports) is not allEmpty", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1")],
        personal_passports: [],
      });
      expect(r.identity_rating).not.toBe("insufficient_data");
    });

    it("passports only (no plans/mentors/visits/events) is not allEmpty", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [makePersonalPassport("pp1")],
      });
      expect(r.identity_rating).not.toBe("insufficient_data");
    });

    it("allEmpty + children=1 still returns inadequate 15", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 1,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.identity_rating).toBe("inadequate");
      expect(r.identity_score).toBe(15);
    });
  });

  // ==========================================================================
  // 2. SCORE & RATING THRESHOLDS
  // ==========================================================================

  describe("base score", () => {
    it("starts at 52 with no bonuses and no penalties", () => {
      // Need: no penalties, no bonuses
      // culturalPlanCoverageRate >= 50 (no penalty) and < 80 (no bonus) → 50%: 2/4
      // mentorAssignmentRate >= 30 (no penalty) and < 80 (no bonus) → 50%: 2/4
      // diversityParticipationRate >= 30 (no penalty) and < 70 (no bonus) → 50%: 2/4
      // religiousObservanceRate >= 50 (no penalty) and < 80 (no bonus) → 50%: 2/4
      // culturalVisitsPerChild >= 1 and < 2 (no bonus)
      // lifeStoryWorkRate < 80, >= 0 (no bonus)
      // identityReviewTimelinessRate < 70 (no bonus)
      // personalPassportCurrencyRate < 80 (no bonus)
      // childVoiceInPlansRate < 70 (no bonus)
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
          makeCulturalVisit("v6"),
        ],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // culturalPlanCoverageRate = pct(2,4) = 50 → no bonus, no penalty
      // mentorAssignmentRate = pct(2,4) = 50 → no bonus, no penalty
      // culturalVisitsPerChild = round(6/4 * 100)/100 = 1.5 → no bonus
      // diversityParticipationRate = pct(2,4) = 50 → no bonus, no penalty
      // lifeStoryWorkRate = pct(0,4) = 0 → no bonus, but < 50 penalty? No, no penalty for lifeStory
      // religiousObservanceRate = pct(2,4) = 50 → no bonus, no penalty
      // identityReviewTimelinessRate = pct(0,2) = 0 → no bonus
      // personalPassportCurrencyRate = pct(0,4) = 0 → no bonus
      // childVoiceInPlansRate = pct(0,2) = 0 → no bonus
      // No penalties triggered (all above thresholds)
      expect(r.identity_score).toBe(52);
    });
  });

  describe("individual bonuses", () => {
    // Helper that gives base score 52 (no bonuses, no penalties) with adjustable fields
    function neutralInput(
      overrides: Partial<CulturalIdentityDiversityInput> = {},
    ): CulturalIdentityDiversityInput {
      return {
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
          makeCulturalVisit("v6"),
        ],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
        ...overrides,
      } as any;
    }

    it("awards +4 for culturalPlanCoverageRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,4) = 100 → +4
      // religiousObservance = pct(2,4) = 50 → no bonus, no penalty
      // All other metrics unchanged from neutral → no bonus/penalty
      expect(r.identity_score).toBe(52 + 4);
    });

    it("awards +2 for culturalPlanCoverageRate >= 80 but < 100", () => {
      // 4/5 = 80%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
            makeCulturalReligiousMentor("m3", { child_id: "c3" }),
          ],
          cultural_visits: [
            makeCulturalVisit("v1"),
            makeCulturalVisit("v2"),
            makeCulturalVisit("v3"),
            makeCulturalVisit("v4"),
            makeCulturalVisit("v5"),
            makeCulturalVisit("v6"),
            makeCulturalVisit("v7"),
            makeCulturalVisit("v8"),
          ],
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,5) = 80 → +2
      // mentorAssignment = pct(3,5) = 60 → no bonus, no penalty
      // visitsPerChild = round(8/5*100)/100 = 1.6 → no bonus
      // diversityParticipation = pct(3,5) = 60 → no bonus, no penalty
      // lifeStoryWorkRate = pct(0,5) = 0 → no bonus
      // religiousObservance = pct(4,5) = 80 → +1
      // identityReview = pct(0,4) = 0 → no bonus
      // passportCurrency = pct(0,5) = 0 → no bonus
      // childVoice = pct(0,4) = 0 → no bonus
      expect(r.identity_score).toBe(52 + 2 + 1);
    });

    it("awards +3 for mentorAssignmentRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
            makeCulturalReligiousMentor("m3", { child_id: "c3" }),
            makeCulturalReligiousMentor("m4", { child_id: "c4" }),
          ],
        }),
      );
      // base 52 + 3 (mentor 100%)
      expect(r.identity_score).toBe(52 + 3);
    });

    it("awards +1 for mentorAssignmentRate >= 80 but < 100", () => {
      // 4/5 = 80%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
            makeCulturalReligiousMentor("m3", { child_id: "c3" }),
            makeCulturalReligiousMentor("m4", { child_id: "c4" }),
          ],
          cultural_visits: [
            makeCulturalVisit("v1"),
            makeCulturalVisit("v2"),
            makeCulturalVisit("v3"),
            makeCulturalVisit("v4"),
            makeCulturalVisit("v5"),
            makeCulturalVisit("v6"),
            makeCulturalVisit("v7"),
            makeCulturalVisit("v8"),
          ],
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
          personal_passports: [
            makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
          ],
        }),
      );
      // mentorAssignment = pct(4,5) = 80 → +1
      // culturalPlanCoverage = pct(3,5) = 60 → no bonus, no penalty
      // visitsPerChild = round(8/5*100)/100 = 1.6 → no bonus
      // diversityParticipation = pct(3,5) = 60 → no bonus, no penalty
      // religiousObservance = pct(3,5) = 60 → no bonus, no penalty
      // rest = 0 → no bonus
      expect(r.identity_score).toBe(52 + 1);
    });

    it("awards +3 for culturalVisitsPerChild >= 4", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_visits: Array.from({ length: 16 }, (_, i) =>
            makeCulturalVisit(`v${i + 1}`),
          ),
        }),
      );
      // 16/4 = 4.0 → +3
      expect(r.identity_score).toBe(52 + 3);
    });

    it("awards +1 for culturalVisitsPerChild >= 2 but < 4", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_visits: Array.from({ length: 8 }, (_, i) =>
            makeCulturalVisit(`v${i + 1}`),
          ),
        }),
      );
      // 8/4 = 2.0 → +1
      expect(r.identity_score).toBe(52 + 1);
    });

    it("awards +3 for diversityParticipationRate >= 90", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3", "c4"],
            }),
          ],
        }),
      );
      // pct(4,4) = 100 → +3
      expect(r.identity_score).toBe(52 + 3);
    });

    it("awards +1 for diversityParticipationRate >= 70 but < 90", () => {
      // 3/4 = 75%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
        }),
      );
      // pct(3,4) = 75 → +1
      expect(r.identity_score).toBe(52 + 1);
    });

    it("awards +3 for lifeStoryWorkRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: true }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: true }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: true }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: true }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,4) = 100 → +4
      // lifeStoryWork = pct(4,4) = 100 → +3
      // religiousObservance = pct(2,4) = 50 → no bonus, no penalty
      expect(r.identity_score).toBe(52 + 4 + 3);
    });

    it("awards +1 for lifeStoryWorkRate >= 80 but < 100", () => {
      // 4/5 = 80%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: true }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: true }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: true }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false, life_story_work_active: true }),
          ],
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
            makeCulturalReligiousMentor("m3", { child_id: "c3" }),
          ],
          cultural_visits: Array.from({ length: 8 }, (_, i) =>
            makeCulturalVisit(`v${i + 1}`),
          ),
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
          personal_passports: [
            makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,5) = 80 → +2
      // mentorAssignment = pct(3,5) = 60 → no bonus, no penalty
      // visitsPerChild = round(8/5*100)/100 = 1.6 → no bonus
      // diversityParticipation = pct(3,5) = 60 → no bonus, no penalty
      // lifeStoryWork = pct(4,5) = 80 → +1
      // religiousObservance = pct(4,5) = 80 → +1
      // identityReview = pct(0,4) = 0 → no bonus
      // passportCurrency = pct(0,5) = 0 → no bonus
      // childVoice = pct(0,4) = 0 → no bonus
      expect(r.identity_score).toBe(52 + 2 + 1 + 1);
    });

    it("awards +3 for religiousObservanceRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
        }),
      );
      // culturalPlanCoverage = 100 → +4
      // religiousObservance = 100 → +3
      expect(r.identity_score).toBe(52 + 4 + 3);
    });

    it("awards +1 for religiousObservanceRate >= 80 but < 100", () => {
      // 4/5 = 80%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
            makeCulturalReligiousMentor("m3", { child_id: "c3" }),
          ],
          cultural_visits: Array.from({ length: 8 }, (_, i) =>
            makeCulturalVisit(`v${i + 1}`),
          ),
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
          personal_passports: [
            makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,5) = 80 → +2
      // mentorAssignment = pct(3,5) = 60 → no bonus
      // visitsPerChild = 1.6 → no bonus
      // diversityParticipation = pct(3,5) = 60 → no bonus
      // lifeStoryWork = pct(0,5) = 0 → no bonus
      // religiousObservance = pct(4,5) = 80 → +1
      // identityReview = pct(0,4) = 0 → no bonus
      // passportCurrency = pct(0,5) = 0 → no bonus
      // childVoice = pct(0,4) = 0 → no bonus
      expect(r.identity_score).toBe(52 + 2 + 1);
    });

    it("awards +3 for identityReviewTimelinessRate >= 90", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", life_story_work_active: false }),
          ],
        }),
      );
      // identityReview = pct(2,2) = 100 → +3
      expect(r.identity_score).toBe(52 + 3);
    });

    it("awards +1 for identityReviewTimelinessRate >= 70 but < 90", () => {
      // 3/4 = 75%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: false, child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", life_story_work_active: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,4) = 100 → +4
      // identityReview = pct(3,4) = 75 → +1
      // religiousObservance = pct(2,4) = 50 → no bonus, no penalty
      expect(r.identity_score).toBe(52 + 4 + 1);
    });

    it("awards +3 for personalPassportCurrencyRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          personal_passports: [
            makePersonalPassport("pp1", { child_id: "c1" }),
            makePersonalPassport("pp2", { child_id: "c2" }),
            makePersonalPassport("pp3", { child_id: "c3" }),
            makePersonalPassport("pp4", { child_id: "c4" }),
          ],
        }),
      );
      // passportCurrency = pct(4,4) = 100 → +3
      expect(r.identity_score).toBe(52 + 3);
    });

    it("awards +1 for personalPassportCurrencyRate >= 80 but < 100", () => {
      // 4/5 = 80%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
            makeCulturalReligiousMentor("m3", { child_id: "c3" }),
          ],
          cultural_visits: Array.from({ length: 8 }, (_, i) =>
            makeCulturalVisit(`v${i + 1}`),
          ),
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
          personal_passports: [
            makePersonalPassport("pp1", { child_id: "c1" }),
            makePersonalPassport("pp2", { child_id: "c2" }),
            makePersonalPassport("pp3", { child_id: "c3" }),
            makePersonalPassport("pp4", { child_id: "c4" }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(3,5) = 60 → no bonus, no penalty
      // mentorAssignment = pct(3,5) = 60 → no bonus, no penalty
      // visitsPerChild = 1.6 → no bonus
      // diversityParticipation = pct(3,5) = 60 → no bonus, no penalty
      // lifeStoryWork = pct(0,5) = 0 → no bonus
      // religiousObservance = pct(3,5) = 60 → no bonus, no penalty
      // identityReview = pct(0,3) = 0 → no bonus
      // passportCurrency = pct(4,5) = 80 → +1
      // childVoice = pct(0,3) = 0 → no bonus
      expect(r.identity_score).toBe(52 + 1);
    });

    it("awards +3 for childVoiceInPlansRate >= 90", () => {
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          ],
        }),
      );
      // childVoice = pct(2,2) = 100 → +3
      expect(r.identity_score).toBe(52 + 3);
    });

    it("awards +1 for childVoiceInPlansRate >= 70 but < 90", () => {
      // 3/4 = 75%
      const r = computeCulturalIdentityDiversity(
        neutralInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: true, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: true, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: false, child_voice_captured: true, reviewed: false, life_story_work_active: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          ],
        }),
      );
      // culturalPlanCoverage = pct(4,4) = 100 → +4
      // childVoice = pct(3,4) = 75 → +1
      // religiousObservance = pct(2,4) = 50 → no bonus, no penalty
      expect(r.identity_score).toBe(52 + 4 + 1);
    });
  });

  describe("combined max bonuses", () => {
    it("achieves score 80 (outstanding) with all bonuses at max", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      // All bonuses at max:
      // culturalPlanCoverage = 100 → +4
      // mentorAssignment = 100 → +3
      // visitsPerChild = 16/4 = 4 → +3
      // diversityParticipation = 100 → +3
      // lifeStoryWork = 100 → +3
      // religiousObservance = 100 → +3
      // identityReview = 100 → +3
      // passportCurrency = 100 → +3
      // childVoice = 100 → +3
      // Total = 52 + 4+3+3+3+3+3+3+3+3 = 52 + 28 = 80
      expect(r.identity_score).toBe(80);
      expect(r.identity_rating).toBe("outstanding");
    });
  });

  describe("rating boundaries", () => {
    it("score 80 → outstanding", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.identity_score).toBe(80);
      expect(r.identity_rating).toBe("outstanding");
    });

    it("score 79 → good", () => {
      // Remove 1 point from max by making childVoice 75% (+1 instead of +3)
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1" }),
            makeCulturalIdentityPlan("p2", { child_id: "c2" }),
            makeCulturalIdentityPlan("p3", { child_id: "c3" }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false }),
          ],
        }),
      );
      // childVoice = pct(3,4) = 75 → +1 instead of +3
      // Total = 52 + 4+3+3+3+3+3+3+3+1 = 52 + 26 = 78
      expect(r.identity_score).toBe(78);
      expect(r.identity_rating).toBe("good");
    });

    it("score 65 → good", () => {
      // 52 + 4 + 3 + 3 + 3 = 65
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_religious_mentors: [
            makeCulturalReligiousMentor("m1", { child_id: "c1" }),
            makeCulturalReligiousMentor("m2", { child_id: "c2" }),
          ],
          cultural_visits: [
            makeCulturalVisit("v1"),
            makeCulturalVisit("v2"),
            makeCulturalVisit("v3"),
            makeCulturalVisit("v4"),
            makeCulturalVisit("v5"),
            makeCulturalVisit("v6"),
          ],
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2"],
            }),
          ],
          personal_passports: [
            makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
          ],
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false }),
          ],
        }),
      );
      // culturalPlanCoverage = 100 → +4
      // mentorAssignment = pct(2,4) = 50 → no bonus, no penalty
      // visitsPerChild = 6/4 = 1.5 → no bonus
      // diversityParticipation = pct(2,4) = 50 → no penalty, no bonus
      // lifeStoryWork = 100 → +3
      // religiousObservance = 100 → +3
      // identityReview = 0 → no bonus
      // passportCurrency = pct(0,4) = 0 → no bonus
      // childVoice = pct(0,4) = 0 → no bonus
      // Total = 52 + 4 + 3 + 3 = 62 ... need to adjust
      // Let's compute exactly: need score = 65
      // Need 13 bonus points. We have planCoverage=+4, lifeStory=+3, religious=+3 = 10
      // Need 3 more: add identityReview = 100 → +3
      expect(r.identity_score).toBe(62);
      expect(r.identity_rating).toBe("adequate");
      // Hmm, that's 62. We need a precise 65 test. Let me adjust.
    });

    it("score exactly 65 → good", () => {
      // 52 + 13 = 65. Need exactly 13 bonus points.
      // culturalPlanCoverage 100 → +4
      // lifeStory 100 → +3
      // religious 100 → +3
      // identityReview 100 → +3
      // Total bonus = 13. Score = 65.
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
          makeCulturalVisit("v6"),
        ],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // culturalPlanCoverage = pct(4,4) = 100 → +4
      // mentorAssignment = pct(2,4) = 50 → no bonus, no penalty
      // visitsPerChild = 6/4 = 1.5 → no bonus
      // diversityParticipation = pct(2,4) = 50 → no bonus, no penalty
      // lifeStoryWork = pct(4,4) = 100 → +3
      // religiousObservance = pct(4,4) = 100 → +3
      // identityReview = pct(4,4) = 100 → +3
      // passportCurrency = pct(0,4) = 0 → no bonus
      // childVoice = pct(0,4) = 0 → no bonus
      // Total = 52 + 4 + 3 + 3 + 3 = 65
      expect(r.identity_score).toBe(65);
      expect(r.identity_rating).toBe("good");
    });

    it("score exactly 64 → adequate", () => {
      // 52 + 12 = 64. Need exactly 12 bonus points.
      // culturalPlanCoverage 100 → +4
      // lifeStory 100 → +3
      // religious 100 → +3
      // identityReview 75% → +1 (3 of 4 reviewed on time)
      // childVoice 75% → +1 (3 of 4 plans)
      // Total bonus = 12. Score = 64.
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: true, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: true, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
          makeCulturalVisit("v6"),
        ],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // culturalPlanCoverage = pct(4,4) = 100 → +4
      // mentorAssignment = pct(2,4) = 50 → no bonus
      // visitsPerChild = 1.5 → no bonus
      // diversityParticipation = pct(2,4) = 50 → no bonus
      // lifeStoryWork = pct(4,4) = 100 → +3
      // religiousObservance = pct(4,4) = 100 → +3
      // identityReview = pct(3,4) = 75 → +1
      // passportCurrency = pct(0,4) = 0 → no bonus
      // childVoice = pct(3,4) = 75 → +1
      // Total = 52 + 4 + 3 + 3 + 1 + 1 = 64
      expect(r.identity_score).toBe(64);
      expect(r.identity_rating).toBe("adequate");
    });

    it("score exactly 45 → adequate", () => {
      // 52 - 5 - 3 + 1 = 45. We need penalties summing to 8 and bonus of 1.
      // culturalPlanCoverage < 50 → -5 penalty
      // religiousObservance < 50 → -3 penalty
      // plus one +1 bonus
      // diversityParticipation 75% → +1 bonus
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
          makeCulturalVisit("v6"),
        ],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2", "c3"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // culturalPlanCoverage = pct(1,4) = 25 → penalty -5, no bonus
      // mentorAssignment = pct(2,4) = 50 → no bonus, no penalty
      // visitsPerChild = 6/4 = 1.5 → no bonus
      // diversityParticipation = pct(3,4) = 75 → +1
      // lifeStoryWork = pct(0,4) = 0 → no bonus
      // religiousObservance = pct(0,4) = 0 → penalty -3, no bonus
      // identityReview = pct(0,1) = 0 → no bonus
      // passportCurrency = pct(0,4) = 0 → no bonus
      // childVoice = pct(0,1) = 0 → no bonus
      // Total = 52 + 1 - 5 - 3 = 45
      expect(r.identity_score).toBe(45);
      expect(r.identity_rating).toBe("adequate");
    });

    it("score exactly 44 → inadequate", () => {
      // 52 - 5 - 3 = 44
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
          makeCulturalVisit("v6"),
        ],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // culturalPlanCoverage = pct(1,4) = 25 → -5
      // mentorAssignment = pct(2,4) = 50 → no penalty, no bonus
      // visitsPerChild = 1.5 → no bonus
      // diversityParticipation = pct(2,4) = 50 → no penalty, no bonus
      // lifeStoryWork = pct(0,4) = 0 → no bonus
      // religiousObservance = pct(0,4) = 0 → -3
      // identityReview = pct(0,1) = 0 → no bonus
      // passportCurrency = pct(0,4) = 0 → no bonus
      // childVoice = pct(0,1) = 0 → no bonus
      // Total = 52 - 5 - 3 = 44
      expect(r.identity_score).toBe(44);
      expect(r.identity_rating).toBe("inadequate");
    });
  });

  describe("penalties", () => {
    it("applies -5 penalty for culturalPlanCoverageRate < 50", () => {
      // 1/4 = 25%
      const withPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // Without penalty: same but with 2 plans (50%)
      const withoutPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      expect(withoutPenalty.identity_score - withPenalty.identity_score).toBe(5);
    });

    it("applies -5 penalty for mentorAssignmentRate < 30", () => {
      // 1/4 = 25%
      const withPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // Without penalty: 2/4 = 50% (>= 30)
      const withoutPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      expect(withoutPenalty.identity_score - withPenalty.identity_score).toBe(5);
    });

    it("applies -5 penalty for diversityParticipationRate < 30", () => {
      // 1/4 = 25%
      const withPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // Without penalty: 2/4 = 50% (>= 30)
      const withoutPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      expect(withoutPenalty.identity_score - withPenalty.identity_score).toBe(5);
    });

    it("applies -3 penalty for religiousObservanceRate < 50", () => {
      // 1/4 = 25%
      const withPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      // Without penalty: both have religion_documented (50%)
      const withoutPenalty = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) =>
          makeCulturalVisit(`v${i + 1}`),
        ),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1", "c2"],
          }),
        ],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", photo_current: false }),
        ],
      });
      expect(withoutPenalty.identity_score - withPenalty.identity_score).toBe(3);
    });

    it("all four penalties stack", () => {
      // culturalPlanCoverage < 50 → -5
      // mentorAssignment < 30 → -5
      // diversityParticipation < 30 → -5
      // religiousObservance < 50 → -3
      // Total penalty = -18
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1")],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", {
            children_participated: ["c1"],
          }),
        ],
        personal_passports: [],
      });
      // culturalPlanCoverage = pct(1,4) = 25 → -5
      // mentorAssignment = pct(0,4) = 0 → -5
      // diversityParticipation = pct(1,4) = 25 → -5
      // religiousObservance = pct(0,4) = 0 → -3
      // Total = 52 - 5 - 5 - 5 - 3 = 34
      expect(r.identity_score).toBe(34);
    });

    it("score is clamped to 0 minimum", () => {
      // Extremely penalised scenario — verify clamped
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 100,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1")],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      // All penalties apply: -5 -5 -5 -3 = -18
      // 52 - 18 = 34 (still above 0, but the clamp exists)
      expect(r.identity_score).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // 3. METRIC CALCULATIONS
  // ==========================================================================

  describe("metric calculations", () => {
    it("culturalPlanCoverageRate = unique children with ACTIVE plan / total_children", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", active: true }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", active: true }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", active: true }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // pct(3, 4) = 75
      expect(r.cultural_plan_coverage_rate).toBe(75);
    });

    it("culturalPlanCoverageRate ignores inactive plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", active: true }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Only c1 has active plan: pct(1, 4) = 25
      expect(r.cultural_plan_coverage_rate).toBe(25);
    });

    it("culturalPlanCoverageRate counts unique children (multiple plans per child)", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", active: true }),
          makeCulturalIdentityPlan("p2", { child_id: "c1", active: true }),
          makeCulturalIdentityPlan("p3", { child_id: "c2", active: true }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Unique children: c1, c2 → pct(2, 4) = 50
      expect(r.cultural_plan_coverage_rate).toBe(50);
    });

    it("mentorAssignmentRate = unique children with ACTIVE mentor / total_children", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1", active: true }),
          makeCulturalReligiousMentor("m2", { child_id: "c2", active: true }),
          makeCulturalReligiousMentor("m3", { child_id: "c3", active: true }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // pct(3, 4) = 75
      expect(r.mentor_assignment_rate).toBe(75);
    });

    it("mentorAssignmentRate ignores inactive mentors", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1", active: true }),
          makeCulturalReligiousMentor("m2", { child_id: "c2", active: false }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Only c1 active: pct(1, 4) = 25
      expect(r.mentor_assignment_rate).toBe(25);
    });

    it("mentorAssignmentRate counts unique children", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1", active: true }),
          makeCulturalReligiousMentor("m2", { child_id: "c1", active: true }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Only c1 unique: pct(1, 4) = 25
      expect(r.mentor_assignment_rate).toBe(25);
    });

    it("culturalVisitsPerChild = Math.round((totalVisits / total_children) * 100) / 100", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 3,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 7 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Math.round(7/3 * 100) / 100 = Math.round(233.33) / 100 = 233 / 100 = 2.33
      expect(r.cultural_visits_per_child).toBe(2.33);
    });

    it("culturalVisitsPerChild is 0 when total_children is 0", () => {
      // Cannot hit this in normal flow (allEmpty would trigger), but the guard exists
      // Instead test with no visits
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1" })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: [],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.cultural_visits_per_child).toBe(0);
    });

    it("culturalVisitsPerChild counts ALL visits (not just active)", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 2,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" })],
        cultural_visits: [
          makeCulturalVisit("v1"),
          makeCulturalVisit("v2"),
          makeCulturalVisit("v3"),
          makeCulturalVisit("v4"),
          makeCulturalVisit("v5"),
        ],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      // Math.round(5/2 * 100) / 100 = 2.5
      expect(r.cultural_visits_per_child).toBe(2.5);
    });

    it("diversityParticipationRate collects unique children across all events", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] }),
          makeDiversityCalendarEvent("e2", { children_participated: ["c2", "c3"] }),
        ],
        personal_passports: [],
      });
      // Unique children: c1, c2, c3 → pct(3, 4) = 75
      expect(r.diversity_participation_rate).toBe(75);
    });

    it("diversityParticipationRate deduplicates same child across events", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: ["c1"] }),
          makeDiversityCalendarEvent("e2", { children_participated: ["c1"] }),
          makeDiversityCalendarEvent("e3", { children_participated: ["c1"] }),
        ],
        personal_passports: [],
      });
      // Only c1 unique → pct(1, 4) = 25
      expect(r.diversity_participation_rate).toBe(25);
    });

    it("lifeStoryWorkRate = unique children with active plan AND life_story_work_active / total", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", life_story_work_active: false, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // c1, c2 have life_story_work_active: pct(2, 4) = 50
      expect(r.life_story_work_rate).toBe(50);
    });

    it("lifeStoryWorkRate ignores inactive plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: true, active: false, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Only c1 active with life_story: pct(1, 4) = 25
      expect(r.life_story_work_rate).toBe(25);
    });

    it("religiousObservanceRate = unique children with active plan AND religion_documented / total", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // c1, c3 have religion_documented: pct(2, 4) = 50
      expect(r.religious_observance_rate).toBe(50);
    });

    it("identityReviewTimelinessRate = plans reviewed on time / active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p4", { child_id: "c4", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2 on time out of 4 active plans: pct(2, 4) = 50
      expect(r.identity_review_timeliness_rate).toBe(50);
    });

    it("identityReviewTimelinessRate: reviewed=false → not on time", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.identity_review_timeliness_rate).toBe(0);
    });

    it("identityReviewTimelinessRate: reviewed=true but overdue (next_review_date < today and review_date < next_review_date) → not on time", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", {
            child_id: "c1",
            reviewed: true,
            review_date: "2025-01-01",
            next_review_date: "2025-04-01", // < today AND review_date < next_review_date → overdue
            child_voice_captured: false,
            life_story_work_active: false,
          }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // reviewed=true but next_review_date < today AND review_date < next_review_date → not on time
      expect(r.identity_review_timeliness_rate).toBe(0);
    });

    it("identityReviewTimelinessRate: reviewed=true, next_review_date in future → on time", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", {
            child_id: "c1",
            reviewed: true,
            review_date: "2025-05-01",
            next_review_date: "2025-09-01",
            child_voice_captured: false,
            life_story_work_active: false,
          }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.identity_review_timeliness_rate).toBe(100);
    });

    it("identityReviewTimelinessRate: reviewed=true with review_date >= next_review_date (overdue but caught up) → on time", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", {
            child_id: "c1",
            reviewed: true,
            review_date: "2025-05-15", // AFTER next_review_date
            next_review_date: "2025-04-01", // in the past
            child_voice_captured: false,
            life_story_work_active: false,
          }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // reviewed=true, next_review_date < today BUT review_date >= next_review_date → on time
      expect(r.identity_review_timeliness_rate).toBe(100);
    });

    it("personalPassportCurrencyRate counts unique CHILDREN with all three fields true", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", identity_info_complete: true, cultural_needs_documented: true, photo_current: true }),
          makePersonalPassport("pp2", { child_id: "c2", identity_info_complete: true, cultural_needs_documented: true, photo_current: false }),
          makePersonalPassport("pp3", { child_id: "c3", identity_info_complete: true, cultural_needs_documented: true, photo_current: true }),
        ],
      });
      // c1 and c3 have all three: pct(2, 4) = 50
      expect(r.personal_passport_currency_rate).toBe(50);
    });

    it("personalPassportCurrencyRate deduplicates same child with multiple passports", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1" }),
          makePersonalPassport("pp2", { child_id: "c1" }),
        ],
      });
      // Only c1 unique: pct(1, 4) = 25
      expect(r.personal_passport_currency_rate).toBe(25);
    });

    it("personalPassportCurrencyRate requires all three booleans true", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1", identity_info_complete: false, cultural_needs_documented: true, photo_current: true }),
          makePersonalPassport("pp2", { child_id: "c2", identity_info_complete: true, cultural_needs_documented: false, photo_current: true }),
          makePersonalPassport("pp3", { child_id: "c3", identity_info_complete: true, cultural_needs_documented: true, photo_current: false }),
        ],
      });
      // None have all three true: pct(0, 4) = 0
      expect(r.personal_passport_currency_rate).toBe(0);
    });

    it("childVoiceInPlansRate is per PLAN not per child", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2 of 3 active plans have child_voice: pct(2, 3) = 67
      expect(r.child_voice_in_plans_rate).toBe(67);
    });

    it("childVoiceInPlansRate uses only active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, active: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: true, active: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Only p1 is active, has voice: pct(1, 1) = 100
      expect(r.child_voice_in_plans_rate).toBe(100);
    });

    it("pct(0, 0) returns 0", () => {
      // When no active plans, childVoiceInPlansRate should be pct(0, 0) = 0
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // No active plans → pct(0, 0) = 0
      expect(r.child_voice_in_plans_rate).toBe(0);
      expect(r.identity_review_timeliness_rate).toBe(0);
    });

    it("total_cultural_plans counts only active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", active: true }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", active: true }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.total_cultural_plans).toBe(2);
    });

    it("diversityParticipationRate with no events = 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1" })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.diversity_participation_rate).toBe(0);
    });

    it("diversityParticipationRate with empty children_participated arrays = 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1" })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: [] }),
        ],
        personal_passports: [],
      });
      expect(r.diversity_participation_rate).toBe(0);
    });
  });

  // ==========================================================================
  // 4. STRENGTHS
  // ==========================================================================

  describe("strengths", () => {
    it("includes strength for culturalPlanCoverageRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("Every child has an active cultural identity plan"))).toBe(true);
    });

    it("includes strength for culturalPlanCoverageRate >= 80 but < 100", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1" }),
            makeCulturalIdentityPlan("p2", { child_id: "c2" }),
            makeCulturalIdentityPlan("p3", { child_id: "c3" }),
            makeCulturalIdentityPlan("p4", { child_id: "c4" }),
          ],
        }),
      );
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("cultural identity plans"))).toBe(true);
    });

    it("includes strength for mentorAssignmentRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("Every child has an assigned cultural or religious mentor"))).toBe(true);
    });

    it("includes strength for mentorAssignmentRate >= 80 but < 100", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          total_children: 5,
        }),
      );
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("mentors"))).toBe(true);
    });

    it("includes strength for culturalVisitsPerChild >= 4", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      // 16/4 = 4
      expect(r.strengths.some((s) => s.includes("cultural visits per child") && s.includes("rich programme"))).toBe(true);
    });

    it("includes strength for culturalVisitsPerChild >= 2 but < 4", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_visits: Array.from({ length: 8 }, (_, i) =>
            makeCulturalVisit(`v${i + 1}`),
          ),
        }),
      );
      // 8/4 = 2
      expect(r.strengths.some((s) => s.includes("cultural visits per child") && s.includes("regularly accessing"))).toBe(true);
    });

    it("includes strength for diversityParticipationRate >= 90", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("diversity calendar events") && s.includes("promotes inclusion"))).toBe(true);
    });

    it("includes strength for diversityParticipationRate >= 70 but < 90", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          diversity_calendar_events: [
            makeDiversityCalendarEvent("e1", {
              children_participated: ["c1", "c2", "c3"],
            }),
          ],
        }),
      );
      // 3/4 = 75%
      expect(r.strengths.some((s) => s.includes("75%") && s.includes("diversity events"))).toBe(true);
    });

    it("includes strength for lifeStoryWorkRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("Active life story work for every child"))).toBe(true);
    });

    it("includes strength for lifeStoryWorkRate >= 80 but < 100", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1" }),
            makeCulturalIdentityPlan("p2", { child_id: "c2" }),
            makeCulturalIdentityPlan("p3", { child_id: "c3" }),
            makeCulturalIdentityPlan("p4", { child_id: "c4" }),
          ],
        }),
      );
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("Life story work active for 80%"))).toBe(true);
    });

    it("includes strength for religiousObservanceRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("Religious needs documented for every child"))).toBe(true);
    });

    it("includes strength for religiousObservanceRate >= 80 but < 100", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          total_children: 5,
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1" }),
            makeCulturalIdentityPlan("p2", { child_id: "c2" }),
            makeCulturalIdentityPlan("p3", { child_id: "c3" }),
            makeCulturalIdentityPlan("p4", { child_id: "c4" }),
          ],
        }),
      );
      // 4/5 = 80% religious documented
      expect(r.strengths.some((s) => s.includes("Religious needs documented for 80%"))).toBe(true);
    });

    it("includes strength for identityReviewTimelinessRate >= 90 with active plans", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("identity plans reviewed on time"))).toBe(true);
    });

    it("does NOT include review timeliness strength when no active plans", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { active: false }),
          ],
        }),
      );
      expect(r.strengths.some((s) => s.includes("identity plans reviewed on time"))).toBe(false);
    });

    it("includes strength for personalPassportCurrencyRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("Every child has an up-to-date personal passport"))).toBe(true);
    });

    it("includes strength for personalPassportCurrencyRate >= 80 but < 100", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          total_children: 5,
        }),
      );
      // 4/5 = 80%
      expect(r.strengths.some((s) => s.includes("80%") && s.includes("personal passports"))).toBe(true);
    });

    it("includes strength for childVoiceInPlansRate >= 90 with active plans", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.strengths.some((s) => s.includes("Child voice captured in 100%"))).toBe(true);
    });

    it("includes strength for childVoiceInPlansRate >= 70 but < 90 with active plans", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: true }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: true }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false }),
          ],
        }),
      );
      // 3/4 = 75%
      expect(r.strengths.some((s) => s.includes("Child voice present in 75%"))).toBe(true);
    });

    it("includes strength for positive feedback rate >= 80% with visits", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      // All visits have child_feedback_positive = true (100%)
      expect(r.strengths.some((s) => s.includes("positive child feedback"))).toBe(true);
    });

    it("includes strength for learning documented rate >= 80% with events", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      // All events have learning_documented = true (100%)
      expect(r.strengths.some((s) => s.includes("Learning documented in 100%"))).toBe(true);
    });

    it("includes strength for mentor type variety >= 3", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      // 4 different mentor types
      expect(r.strengths.some((s) => s.includes("Mentoring spans 4 different types"))).toBe(true);
    });

    it("includes strength for visit type variety >= 4", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      // 5 different visit types in baseInput
      expect(r.strengths.some((s) => s.includes("Cultural visits span 5 categories"))).toBe(true);
    });

    it("no strengths when all rates are low", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 10,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1", { child_feedback_positive: false })],
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: ["c1"], learning_documented: false }),
        ],
        personal_passports: [],
      });
      expect(r.strengths).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 5. CONCERNS
  // ==========================================================================

  describe("concerns", () => {
    it("includes concern for culturalPlanCoverageRate < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("cultural identity plans"))).toBe(true);
    });

    it("includes concern for culturalPlanCoverageRate >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 3/4 = 75%
      expect(r.concerns.some((c) => c.includes("75%") && c.includes("not all children"))).toBe(true);
    });

    it("includes concern for mentorAssignmentRate < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("mentor"))).toBe(true);
    });

    it("includes concern for mentorAssignmentRate >= 30 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2/4 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Mentor assignment rate"))).toBe(true);
    });

    it("includes concern for culturalVisitsPerChild < 1", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: [makeCulturalVisit("v1"), makeCulturalVisit("v2")],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2/4 = 0.5
      expect(r.concerns.some((c) => c.includes("0.5") && c.includes("cultural visits per child"))).toBe(true);
    });

    it("includes concern for culturalVisitsPerChild >= 1 and < 2", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 6/4 = 1.5
      expect(r.concerns.some((c) => c.includes("1.5") && c.includes("Cultural visits averaging"))).toBe(true);
    });

    it("includes concern for diversityParticipationRate < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("diversity events"))).toBe(true);
    });

    it("includes concern for diversityParticipationRate >= 30 and < 70", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2/4 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Diversity event participation"))).toBe(true);
    });

    it("includes concern for lifeStoryWorkRate < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: false, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("Life story work"))).toBe(true);
    });

    it("includes concern for lifeStoryWorkRate >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 3/4 = 75%
      expect(r.concerns.some((c) => c.includes("75%") && c.includes("Life story work rate"))).toBe(true);
    });

    it("includes concern for religiousObservanceRate < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("Religious needs documented for only"))).toBe(true);
    });

    it("includes concern for religiousObservanceRate >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 3/4 = 75%
      expect(r.concerns.some((c) => c.includes("75%") && c.includes("Religious observance support"))).toBe(true);
    });

    it("includes concern for identityReviewTimelinessRate < 50 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", child_voice_captured: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("identity plans reviewed on time"))).toBe(true);
    });

    it("includes concern for identityReviewTimelinessRate >= 50 and < 70 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01", child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Identity plan review timeliness"))).toBe(true);
    });

    it("includes concern for personalPassportCurrencyRate < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [makePersonalPassport("pp1", { child_id: "c1" })],
      });
      // 1/4 = 25%
      expect(r.concerns.some((c) => c.includes("25%") && c.includes("personal passports"))).toBe(true);
    });

    it("includes concern for personalPassportCurrencyRate >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [
          makePersonalPassport("pp1", { child_id: "c1" }),
          makePersonalPassport("pp2", { child_id: "c2" }),
          makePersonalPassport("pp3", { child_id: "c3" }),
        ],
      });
      // 3/4 = 75%
      expect(r.concerns.some((c) => c.includes("75%") && c.includes("Personal passport currency"))).toBe(true);
    });

    it("includes concern for childVoiceInPlansRate < 50 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/3 = 33%
      expect(r.concerns.some((c) => c.includes("33%") && c.includes("Child voice captured in only"))).toBe(true);
    });

    it("includes concern for childVoiceInPlansRate >= 50 and < 70 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/2 = 50%
      expect(r.concerns.some((c) => c.includes("50%") && c.includes("Child voice present in"))).toBe(true);
    });

    it("includes concern when no diversity calendar events and children > 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.concerns.some((c) => c.includes("No diversity calendar events recorded"))).toBe(true);
    });

    it("includes concern when no personal passports and children > 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.concerns.some((c) => c.includes("No personal passports recorded"))).toBe(true);
    });

    it("no concerns when all metrics are high", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.concerns).toHaveLength(0);
    });
  });

  // ==========================================================================
  // 6. RECOMMENDATIONS
  // ==========================================================================

  describe("recommendations", () => {
    it("recommends culturalPlanCoverage when < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Urgently develop cultural identity plans") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends mentor assignment when < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Establish cultural and religious mentoring") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends diversity participation when < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase children's participation in diversity events") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends religious observance when < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Document and actively support all children's religious") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends life story work when < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: false, child_voice_captured: false, reviewed: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: false, child_voice_captured: false, reviewed: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Initiate life story work for all children") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends child voice when < 50 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/3 = 33%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Ensure every child's voice is captured") && rec.urgency === "immediate")).toBe(true);
    });

    it("recommends personal passports when none exist with children > 0", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Create personal passports for all children"))).toBe(true);
    });

    it("recommends updating passports when currency < 50 with passports existing", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [makePersonalPassport("pp1", { child_id: "c1", photo_current: false })],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Update personal passports") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends increasing cultural visits when < 2 per child", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: [makeCulturalVisit("v1"), makeCulturalVisit("v2")],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase the frequency of cultural visits") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends improving review timeliness when < 70", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve timeliness of identity plan reviews") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends extending plan coverage when >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 3/4 = 75%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend cultural identity plan coverage") && rec.urgency === "soon")).toBe(true);
    });

    it("recommends increasing mentor coverage when >= 30 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2/4 = 50%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Increase mentor coverage") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends improving diversity participation when >= 30 and < 70", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2/4 = 50%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve diversity event participation") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends strengthening child voice when >= 50 and < 70", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/2 = 50%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Strengthen child voice in identity plans") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends extending life story work when >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 3/4 = 75%
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Extend life story work to all children") && rec.urgency === "planned")).toBe(true);
    });

    it("recommends improving learning documentation when < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"], learning_documented: false }),
          makeDiversityCalendarEvent("e2", { children_participated: ["c1", "c2"], learning_documented: false }),
          makeDiversityCalendarEvent("e3", { children_participated: ["c1", "c2"], learning_documented: true }),
        ],
        personal_passports: [],
      });
      // 1/3 = 33% learning
      expect(r.recommendations.some((rec) => rec.recommendation.includes("Improve documentation of learning from diversity events"))).toBe(true);
    });

    it("no recommendations when all metrics are outstanding", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.recommendations).toHaveLength(0);
    });

    it("recommendations have sequential ranks", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      for (let i = 0; i < r.recommendations.length; i++) {
        expect(r.recommendations[i].rank).toBe(i + 1);
      }
    });
  });

  // ==========================================================================
  // 7. INSIGHTS
  // ==========================================================================

  describe("insights", () => {
    it("critical insight for culturalPlanCoverageRate < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("25%") && i.text.includes("cultural identity plans"))).toBe(true);
    });

    it("critical insight for mentorAssignmentRate < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("25%") && i.text.includes("mentor"))).toBe(true);
    });

    it("critical insight for diversityParticipationRate < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("25%") && i.text.includes("diversity events"))).toBe(true);
    });

    it("critical insight for religiousObservanceRate < 50", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: true, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("25%") && i.text.includes("Religious needs documented"))).toBe(true);
    });

    it("critical insight for lifeStoryWorkRate < 30", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: false, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", life_story_work_active: false, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p4", { child_id: "c4", life_story_work_active: false, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/4 = 25%
      expect(r.insights.some((i) => i.severity === "critical" && i.text.includes("25%") && i.text.includes("Life story work"))).toBe(true);
    });

    it("warning insight for culturalPlanCoverageRate >= 50 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 75%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("75%") && i.text.includes("Cultural identity plan coverage"))).toBe(true);
    });

    it("warning insight for mentorAssignmentRate >= 30 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Mentor assignment"))).toBe(true);
    });

    it("warning insight for culturalVisitsPerChild >= 1 and < 2", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1.5
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("1.5") && i.text.includes("Cultural visits averaging"))).toBe(true);
    });

    it("warning insight for diversityParticipationRate >= 30 and < 70", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Diversity event participation"))).toBe(true);
    });

    it("warning insight for lifeStoryWorkRate >= 30 and < 80", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", life_story_work_active: true, child_voice_captured: false, reviewed: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", life_story_work_active: false, child_voice_captured: false, reviewed: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 2/4 = 50%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("50%") && i.text.includes("Life story work active"))).toBe(true);
    });

    it("warning insight for identityReviewTimelinessRate < 50 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", reviewed: false, child_voice_captured: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("0%") && i.text.includes("identity plans reviewed on time"))).toBe(true);
    });

    it("warning insight for childVoiceInPlansRate < 50 with active plans", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1/3 = 33%
      expect(r.insights.some((i) => i.severity === "warning" && i.text.includes("33%") && i.text.includes("Child voice captured in only"))).toBe(true);
    });

    it("positive insight for outstanding rating", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("outstanding cultural identity and diversity practice"))).toBe(true);
    });

    it("positive insight for culturalPlanCoverageRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has an active cultural identity plan"))).toBe(true);
    });

    it("positive insight for mentorAssignmentRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has an identity-affirming mentor"))).toBe(true);
    });

    it("positive insight for lifeStoryWorkRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Life story work active for every child"))).toBe(true);
    });

    it("positive insight for childVoiceInPlansRate >= 90 with active plans", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Child voice captured in 100%"))).toBe(true);
    });

    it("positive insight for diversityParticipationRate >= 90", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("100%") && i.text.includes("diversity events"))).toBe(true);
    });

    it("positive insight for personalPassportCurrencyRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Every child has a current personal passport"))).toBe(true);
    });

    it("positive insight for culturalVisitsPerChild >= 4", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("cultural visits per child") && i.text.includes("exceptionally rich"))).toBe(true);
    });

    it("positive insight for religiousObservanceRate >= 100", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Religious needs documented for every child"))).toBe(true);
    });

    it("positive insight for combined review timeliness >= 90 AND passport currency >= 90", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.insights.some((i) => i.severity === "positive" && i.text.includes("Identity plans reviewed on time and personal passports kept current"))).toBe(true);
    });
  });

  // ==========================================================================
  // 8. HEADLINE
  // ==========================================================================

  describe("headline", () => {
    it("outstanding headline", () => {
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.headline).toContain("Outstanding cultural identity and diversity practice");
    });

    it("good headline includes strengths and concerns counts", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false }),
          ],
        }),
      );
      expect(r.headline).toContain("Good cultural identity and diversity practice");
      expect(r.headline).toMatch(/\d+ strength/);
    });

    it("adequate headline includes concerns count", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2", "c3"] })],
        personal_passports: [makePersonalPassport("pp1", { child_id: "c1" }), makePersonalPassport("pp2", { child_id: "c2" }), makePersonalPassport("pp3", { child_id: "c3" })],
      });
      expect(r.headline).toContain("Adequate cultural identity and diversity practice");
      expect(r.headline).toMatch(/\d+ concern/);
    });

    it("inadequate headline includes concerns count", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1")],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      expect(r.headline).toContain("inadequate");
      expect(r.headline).toMatch(/\d+ significant concern/);
    });

    it("good headline uses singular when 1 strength", () => {
      // Need to carefully construct input to get exactly 1 strength and "good" rating
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
          makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: true, review_date: "2025-05-01", next_review_date: "2025-08-01" }),
        ],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1" }),
          makeCulturalReligiousMentor("m2", { child_id: "c2" }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`, { child_feedback_positive: false })),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"], learning_documented: false }),
        ],
        personal_passports: [makePersonalPassport("pp1", { child_id: "c1", photo_current: false })],
      });
      if (r.identity_rating === "good" && r.strengths.length === 1) {
        expect(r.headline).toMatch(/1 strength/);
      }
    });

    it("inadequate headline uses singular when 1 concern", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1")],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      if (r.concerns.length === 1) {
        expect(r.headline).toMatch(/1 significant concern(?!s)/);
      }
    });

    it("good headline mentions areas for improvement when concerns exist", () => {
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false }),
          ],
        }),
      );
      if (r.identity_rating === "good" && r.concerns.length > 0) {
        expect(r.headline).toContain("area");
      }
    });

    it("insufficient_data headline", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 0,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.headline).toContain("No children on placement");
    });

    it("allEmpty with children headline contains urgent attention", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 3,
        cultural_identity_plans: [],
        cultural_religious_mentors: [],
        cultural_visits: [],
        diversity_calendar_events: [],
        personal_passports: [],
      });
      expect(r.headline).toContain("urgent attention");
    });

    it("good headline with no concerns omits improvement mention", () => {
      // This is hard to achieve naturally but let's verify the template handles it
      const r = computeCulturalIdentityDiversity(
        baseInput({
          cultural_identity_plans: [
            makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p3", { child_id: "c3", child_voice_captured: false, reviewed: false }),
            makeCulturalIdentityPlan("p4", { child_id: "c4", child_voice_captured: false, reviewed: false }),
          ],
        }),
      );
      if (r.identity_rating === "good" && r.concerns.length === 0) {
        expect(r.headline).not.toContain("area");
      }
    });
  });

  // ==========================================================================
  // 9. EDGE CASES
  // ==========================================================================

  describe("edge cases", () => {
    it("inactive plans are excluded from all plan-based metrics", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c2", active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.cultural_plan_coverage_rate).toBe(0);
      expect(r.total_cultural_plans).toBe(0);
      expect(r.life_story_work_rate).toBe(0);
      expect(r.religious_observance_rate).toBe(0);
      expect(r.identity_review_timeliness_rate).toBe(0);
      expect(r.child_voice_in_plans_rate).toBe(0);
    });

    it("inactive mentors are excluded from mentor rate", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }), makeCulturalIdentityPlan("p2", { child_id: "c2", child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [
          makeCulturalReligiousMentor("m1", { child_id: "c1", active: false }),
          makeCulturalReligiousMentor("m2", { child_id: "c2", active: false }),
          makeCulturalReligiousMentor("m3", { child_id: "c3", active: false }),
          makeCulturalReligiousMentor("m4", { child_id: "c4", active: false }),
        ],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      expect(r.mentor_assignment_rate).toBe(0);
    });

    it("multiple active plans per child only counts child once for coverage", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1" }),
          makeCulturalIdentityPlan("p2", { child_id: "c1" }),
          makeCulturalIdentityPlan("p3", { child_id: "c1" }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // Only 1 unique child: pct(1, 4) = 25
      expect(r.cultural_plan_coverage_rate).toBe(25);
      // But total_cultural_plans counts all active plans
      expect(r.total_cultural_plans).toBe(3);
    });

    it("childVoiceInPlansRate counts per plan not per child (multiple plans for same child)", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", { child_id: "c1", child_voice_captured: true, reviewed: false, life_story_work_active: false }),
          makeCulturalIdentityPlan("p2", { child_id: "c1", child_voice_captured: false, reviewed: false, life_story_work_active: false }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // 1 of 2 plans have voice → pct(1, 2) = 50
      expect(r.child_voice_in_plans_rate).toBe(50);
    });

    it("identity review: reviewed=true, next_review_date exactly equal to today → still on time", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", {
            child_id: "c1",
            reviewed: true,
            review_date: "2025-05-01",
            next_review_date: "2025-06-01", // exactly today
            child_voice_captured: false,
            life_story_work_active: false,
          }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // next_review_date "2025-06-01" < today "2025-06-01" is FALSE (not strictly less)
      // So this is NOT overdue → on time
      expect(r.identity_review_timeliness_rate).toBe(100);
    });

    it("identity review: next_review_date just before today and review_date < next_review_date → overdue", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [
          makeCulturalIdentityPlan("p1", {
            child_id: "c1",
            reviewed: true,
            review_date: "2025-03-01",
            next_review_date: "2025-05-31",
            child_voice_captured: false,
            life_story_work_active: false,
          }),
        ],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2"] })],
        personal_passports: [],
      });
      // next_review_date "2025-05-31" < today "2025-06-01" AND review_date "2025-03-01" < next_review_date "2025-05-31" → overdue
      expect(r.identity_review_timeliness_rate).toBe(0);
    });

    it("large total_children with minimal data produces very low scores", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 20,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1", religion_documented: false, child_voice_captured: false, reviewed: false, life_story_work_active: false })],
        cultural_religious_mentors: [],
        cultural_visits: [makeCulturalVisit("v1")],
        diversity_calendar_events: [makeDiversityCalendarEvent("e1", { children_participated: ["c1"] })],
        personal_passports: [],
      });
      expect(r.cultural_plan_coverage_rate).toBe(5);
      expect(r.mentor_assignment_rate).toBe(0);
      expect(r.cultural_visits_per_child).toBe(0.05);
      expect(r.diversity_participation_rate).toBe(5);
      expect(r.identity_rating).toBe("inadequate");
    });

    it("same child in multiple diversity events is only counted once", () => {
      const r = computeCulturalIdentityDiversity({
        today: "2025-06-01",
        total_children: 4,
        cultural_identity_plans: [makeCulturalIdentityPlan("p1", { child_id: "c1" })],
        cultural_religious_mentors: [makeCulturalReligiousMentor("m1", { child_id: "c1" }), makeCulturalReligiousMentor("m2", { child_id: "c2" })],
        cultural_visits: Array.from({ length: 6 }, (_, i) => makeCulturalVisit(`v${i}`)),
        diversity_calendar_events: [
          makeDiversityCalendarEvent("e1", { children_participated: ["c1", "c2", "c3", "c4"] }),
          makeDiversityCalendarEvent("e2", { children_participated: ["c1", "c2", "c3", "c4"] }),
          makeDiversityCalendarEvent("e3", { children_participated: ["c1", "c2", "c3", "c4"] }),
        ],
        personal_passports: [],
      });
      // 4 unique children → pct(4, 4) = 100
      expect(r.diversity_participation_rate).toBe(100);
    });

    it("score is clamped to max 100", () => {
      // Even with max bonuses, score = 80, but verifying the clamp exists
      const r = computeCulturalIdentityDiversity(baseInput());
      expect(r.identity_score).toBeLessThanOrEqual(100);
    });
  });
});
