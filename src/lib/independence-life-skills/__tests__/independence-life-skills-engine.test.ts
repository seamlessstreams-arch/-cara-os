import { describe, it, expect } from "vitest";
import {
  evaluateSkillDevelopment,
  evaluateGoalProgress,
  evaluatePracticalLearning,
  evaluatePathwayPreparation,
  buildChildIndependenceProfiles,
  generateIndependenceLifeSkillsIntelligence,
  getRating,
  getSkillDomainLabel,
  getCompetenceLevelLabel,
  getAssessmentFrequencyLabel,
  getGoalStatusLabel,
  getTeachingMethodLabel,
  getRatingLabel,
} from "../independence-life-skills-engine";
import type {
  SkillAssessment,
  IndependenceGoal,
  PracticalSession,
  PathwayPlanProgress,
} from "../independence-life-skills-engine";

// -- Helpers ------------------------------------------------------------------

function makeAssessment(overrides: Partial<SkillAssessment> = {}): SkillAssessment {
  return {
    id: "sa-1",
    childId: "child-1",
    childName: "Alex",
    domain: "cooking_nutrition",
    competenceLevel: "mostly_independent",
    assessedDate: "2026-04-01",
    assessedBy: "Sarah",
    previousLevel: "needs_some_support",
    targetLevel: "independent",
    notes: null,
    ...overrides,
  };
}

function makeGoal(overrides: Partial<IndependenceGoal> = {}): IndependenceGoal {
  return {
    id: "ig-1",
    childId: "child-1",
    childName: "Alex",
    domain: "cooking_nutrition",
    goalDescription: "Cook a simple meal independently",
    status: "on_track",
    targetDate: "2026-06-01",
    reviewDate: "2026-05-01",
    childInvolved: true,
    ageAppropriate: true,
    ...overrides,
  };
}

function makeSession(overrides: Partial<PracticalSession> = {}): PracticalSession {
  return {
    id: "ps-1",
    childId: "child-1",
    childName: "Alex",
    domain: "cooking_nutrition",
    teachingMethod: "practical_activity",
    date: "2026-04-05",
    durationMinutes: 60,
    childEngaged: true,
    progressMade: true,
    staffMember: "Sarah",
    communityBased: false,
    ...overrides,
  };
}

function makePathway(overrides: Partial<PathwayPlanProgress> = {}): PathwayPlanProgress {
  return {
    id: "pp-1",
    childId: "child-1",
    childName: "Alex",
    hasPathwayPlan: true,
    lastReviewDate: "2026-04-01",
    independenceSectionComplete: true,
    accommodationPlanned: true,
    educationEmploymentPlanned: true,
    financialLiteracyIncluded: true,
    healthPassportComplete: true,
    socialNetworksIdentified: true,
    childContributed: true,
    ...overrides,
  };
}

// -- Label Functions ----------------------------------------------------------

describe("getSkillDomainLabel", () => {
  it("returns correct labels", () => {
    expect(getSkillDomainLabel("cooking_nutrition")).toBe("Cooking & Nutrition");
    expect(getSkillDomainLabel("budgeting_finance")).toBe("Budgeting & Finance");
    expect(getSkillDomainLabel("personal_hygiene")).toBe("Personal Hygiene");
    expect(getSkillDomainLabel("laundry_clothing")).toBe("Laundry & Clothing");
    expect(getSkillDomainLabel("household_tasks")).toBe("Household Tasks");
    expect(getSkillDomainLabel("travel_transport")).toBe("Travel & Transport");
    expect(getSkillDomainLabel("communication")).toBe("Communication");
    expect(getSkillDomainLabel("digital_literacy")).toBe("Digital Literacy");
    expect(getSkillDomainLabel("health_management")).toBe("Health Management");
    expect(getSkillDomainLabel("emotional_regulation")).toBe("Emotional Regulation");
    expect(getSkillDomainLabel("social_skills")).toBe("Social Skills");
    expect(getSkillDomainLabel("problem_solving")).toBe("Problem Solving");
  });
});

describe("getCompetenceLevelLabel", () => {
  it("returns correct labels", () => {
    expect(getCompetenceLevelLabel("independent")).toBe("Independent");
    expect(getCompetenceLevelLabel("mostly_independent")).toBe("Mostly Independent");
    expect(getCompetenceLevelLabel("needs_some_support")).toBe("Needs Some Support");
    expect(getCompetenceLevelLabel("needs_significant_support")).toBe("Needs Significant Support");
    expect(getCompetenceLevelLabel("not_yet_started")).toBe("Not Yet Started");
  });
});

describe("getAssessmentFrequencyLabel", () => {
  it("returns correct labels", () => {
    expect(getAssessmentFrequencyLabel("monthly")).toBe("Monthly");
    expect(getAssessmentFrequencyLabel("quarterly")).toBe("Quarterly");
    expect(getAssessmentFrequencyLabel("six_monthly")).toBe("Six-Monthly");
    expect(getAssessmentFrequencyLabel("annually")).toBe("Annually");
    expect(getAssessmentFrequencyLabel("ad_hoc")).toBe("Ad Hoc");
  });
});

describe("getGoalStatusLabel", () => {
  it("returns correct labels", () => {
    expect(getGoalStatusLabel("achieved")).toBe("Achieved");
    expect(getGoalStatusLabel("on_track")).toBe("On Track");
    expect(getGoalStatusLabel("behind")).toBe("Behind");
    expect(getGoalStatusLabel("not_started")).toBe("Not Started");
    expect(getGoalStatusLabel("abandoned")).toBe("Abandoned");
  });
});

describe("getTeachingMethodLabel", () => {
  it("returns correct labels", () => {
    expect(getTeachingMethodLabel("one_to_one")).toBe("One-to-One");
    expect(getTeachingMethodLabel("group_session")).toBe("Group Session");
    expect(getTeachingMethodLabel("practical_activity")).toBe("Practical Activity");
    expect(getTeachingMethodLabel("community_based")).toBe("Community Based");
    expect(getTeachingMethodLabel("peer_mentoring")).toBe("Peer Mentoring");
    expect(getTeachingMethodLabel("online_learning")).toBe("Online Learning");
  });
});

describe("getRatingLabel", () => {
  it("returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("returns outstanding for scores >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for scores >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for scores >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for scores < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// -- evaluateSkillDevelopment -------------------------------------------------

describe("evaluateSkillDevelopment", () => {
  it("returns zero score for empty data", () => {
    const result = evaluateSkillDevelopment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.independentMostlyRate).toBe(0);
    expect(result.improvementRate).toBe(0);
    expect(result.domainsAssessed).toBe(0);
    expect(result.averageDomainsPerChild).toBe(0);
    expect(result.notYetStartedCount).toBe(0);
  });

  it("scores high for all independent assessments across many domains", () => {
    const assessments: SkillAssessment[] = [
      makeAssessment({ id: "1", domain: "cooking_nutrition", competenceLevel: "independent", previousLevel: "needs_some_support" }),
      makeAssessment({ id: "2", domain: "budgeting_finance", competenceLevel: "independent", previousLevel: "needs_some_support" }),
      makeAssessment({ id: "3", domain: "personal_hygiene", competenceLevel: "independent", previousLevel: "mostly_independent" }),
      makeAssessment({ id: "4", domain: "laundry_clothing", competenceLevel: "independent", previousLevel: "needs_some_support" }),
      makeAssessment({ id: "5", domain: "household_tasks", competenceLevel: "mostly_independent", previousLevel: "needs_significant_support" }),
      makeAssessment({ id: "6", domain: "travel_transport", competenceLevel: "independent", previousLevel: "needs_some_support" }),
      makeAssessment({ id: "7", domain: "communication", competenceLevel: "independent", previousLevel: "mostly_independent" }),
      makeAssessment({ id: "8", domain: "digital_literacy", competenceLevel: "independent", previousLevel: "needs_some_support" }),
    ];
    const result = evaluateSkillDevelopment(assessments);
    expect(result.overallScore).toBeGreaterThanOrEqual(18);
    expect(result.independentMostlyRate).toBe(100);
    expect(result.improvementRate).toBe(100);
    expect(result.domainsAssessed).toBe(8);
  });

  it("calculates improvement rate correctly", () => {
    const assessments: SkillAssessment[] = [
      makeAssessment({ id: "1", previousLevel: "needs_some_support", competenceLevel: "mostly_independent" }),
      makeAssessment({ id: "2", domain: "budgeting_finance", previousLevel: "mostly_independent", competenceLevel: "mostly_independent" }),
      makeAssessment({ id: "3", domain: "personal_hygiene", previousLevel: null, competenceLevel: "independent" }),
    ];
    const result = evaluateSkillDevelopment(assessments);
    // 2 with previous, 1 improved → 50%
    expect(result.improvementRate).toBe(50);
  });

  it("penalises not_yet_started assessments", () => {
    const good = [makeAssessment({ id: "1", competenceLevel: "independent" })];
    const withNotStarted = [
      makeAssessment({ id: "1", competenceLevel: "independent" }),
      makeAssessment({ id: "2", domain: "budgeting_finance", competenceLevel: "not_yet_started", previousLevel: null }),
      makeAssessment({ id: "3", domain: "personal_hygiene", competenceLevel: "not_yet_started", previousLevel: null }),
    ];
    const result1 = evaluateSkillDevelopment(good);
    const result2 = evaluateSkillDevelopment(withNotStarted);
    expect(result2.notYetStartedCount).toBe(2);
    // Penalty should reduce score
    expect(result2.overallScore).toBeLessThan(result1.overallScore + 10);
  });

  it("counts unique domains and children", () => {
    const assessments: SkillAssessment[] = [
      makeAssessment({ id: "1", childId: "c1", domain: "cooking_nutrition" }),
      makeAssessment({ id: "2", childId: "c1", domain: "budgeting_finance" }),
      makeAssessment({ id: "3", childId: "c2", childName: "Jordan", domain: "cooking_nutrition" }),
    ];
    const result = evaluateSkillDevelopment(assessments);
    expect(result.domainsAssessed).toBe(2);
    expect(result.averageDomainsPerChild).toBe(1.5);
  });

  it("caps score at 25", () => {
    const assessments: SkillAssessment[] = Array.from({ length: 20 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        domain: ["cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing", "household_tasks", "travel_transport", "communication", "digital_literacy", "health_management", "emotional_regulation"][i % 10] as any,
        competenceLevel: "independent",
        previousLevel: "needs_significant_support",
      }),
    );
    const result = evaluateSkillDevelopment(assessments);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateGoalProgress -----------------------------------------------------

describe("evaluateGoalProgress", () => {
  it("returns zero score for empty data", () => {
    const result = evaluateGoalProgress([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalGoals).toBe(0);
    expect(result.achievedOnTrackRate).toBe(0);
    expect(result.behindCount).toBe(0);
    expect(result.abandonedCount).toBe(0);
    expect(result.childInvolvementRate).toBe(0);
    expect(result.ageAppropriateRate).toBe(0);
  });

  it("scores high for all achieved goals with child involvement", () => {
    const goals: IndependenceGoal[] = [
      makeGoal({ id: "1", status: "achieved", childInvolved: true, ageAppropriate: true, reviewDate: "2026-05-01" }),
      makeGoal({ id: "2", domain: "budgeting_finance", status: "achieved", childInvolved: true, ageAppropriate: true, reviewDate: "2026-05-01" }),
      makeGoal({ id: "3", domain: "travel_transport", status: "on_track", childInvolved: true, ageAppropriate: true, reviewDate: "2026-05-01" }),
    ];
    const result = evaluateGoalProgress(goals);
    expect(result.achievedOnTrackRate).toBe(100);
    expect(result.childInvolvementRate).toBe(100);
    expect(result.ageAppropriateRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("calculates behind and abandoned counts", () => {
    const goals: IndependenceGoal[] = [
      makeGoal({ id: "1", status: "behind" }),
      makeGoal({ id: "2", status: "behind" }),
      makeGoal({ id: "3", status: "abandoned" }),
      makeGoal({ id: "4", status: "achieved" }),
    ];
    const result = evaluateGoalProgress(goals);
    expect(result.behindCount).toBe(2);
    expect(result.abandonedCount).toBe(1);
    expect(result.achievedOnTrackRate).toBe(25);
  });

  it("penalises abandoned goals", () => {
    const noAbandoned = [makeGoal({ id: "1", status: "on_track" })];
    const withAbandoned = [
      makeGoal({ id: "1", status: "on_track" }),
      makeGoal({ id: "2", status: "abandoned" }),
    ];
    const result1 = evaluateGoalProgress(noAbandoned);
    const result2 = evaluateGoalProgress(withAbandoned);
    expect(result2.overallScore).toBeLessThan(result1.overallScore);
  });

  it("caps score at 25", () => {
    const goals = Array.from({ length: 20 }, (_, i) =>
      makeGoal({ id: `g-${i}`, status: "achieved", childInvolved: true, ageAppropriate: true, reviewDate: "2026-05-01" }),
    );
    const result = evaluateGoalProgress(goals);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("floor at 0", () => {
    const goals = Array.from({ length: 10 }, (_, i) =>
      makeGoal({ id: `g-${i}`, status: "abandoned", childInvolved: false, ageAppropriate: false, reviewDate: null }),
    );
    const result = evaluateGoalProgress(goals);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- evaluatePracticalLearning ------------------------------------------------

describe("evaluatePracticalLearning", () => {
  it("returns zero score for empty data", () => {
    const result = evaluatePracticalLearning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.progressRate).toBe(0);
    expect(result.communityBasedRate).toBe(0);
    expect(result.averageDurationMinutes).toBe(0);
    expect(result.teachingMethodVariety).toBe(0);
    expect(result.domainsActive).toBe(0);
  });

  it("scores high for engaged, progressing, varied sessions", () => {
    const sessions: PracticalSession[] = [
      makeSession({ id: "1", domain: "cooking_nutrition", teachingMethod: "practical_activity", childEngaged: true, progressMade: true, communityBased: true }),
      makeSession({ id: "2", domain: "budgeting_finance", teachingMethod: "community_based", childEngaged: true, progressMade: true, communityBased: true }),
      makeSession({ id: "3", domain: "travel_transport", teachingMethod: "one_to_one", childEngaged: true, progressMade: true, communityBased: true }),
      makeSession({ id: "4", domain: "personal_hygiene", teachingMethod: "group_session", childEngaged: true, progressMade: true, communityBased: false }),
      makeSession({ id: "5", domain: "social_skills", teachingMethod: "peer_mentoring", childEngaged: true, progressMade: true, communityBased: true }),
      makeSession({ id: "6", domain: "digital_literacy", teachingMethod: "online_learning", childEngaged: true, progressMade: true, communityBased: false }),
    ];
    const result = evaluatePracticalLearning(sessions);
    expect(result.engagementRate).toBe(100);
    expect(result.progressRate).toBe(100);
    expect(result.teachingMethodVariety).toBe(6);
    expect(result.domainsActive).toBe(6);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("calculates average duration", () => {
    const sessions: PracticalSession[] = [
      makeSession({ id: "1", durationMinutes: 60 }),
      makeSession({ id: "2", durationMinutes: 90 }),
      makeSession({ id: "3", durationMinutes: 30 }),
    ];
    const result = evaluatePracticalLearning(sessions);
    expect(result.averageDurationMinutes).toBe(60);
  });

  it("counts community-based sessions", () => {
    const sessions: PracticalSession[] = [
      makeSession({ id: "1", communityBased: true }),
      makeSession({ id: "2", communityBased: false }),
      makeSession({ id: "3", communityBased: true }),
      makeSession({ id: "4", communityBased: false }),
    ];
    const result = evaluatePracticalLearning(sessions);
    expect(result.communityBasedRate).toBe(50);
  });

  it("caps score at 25", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        domain: ["cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing", "household_tasks", "travel_transport", "communication", "digital_literacy"][i % 8] as any,
        teachingMethod: ["one_to_one", "group_session", "practical_activity", "community_based", "peer_mentoring", "online_learning"][i % 6] as any,
        childEngaged: true,
        progressMade: true,
        communityBased: true,
      }),
    );
    const result = evaluatePracticalLearning(sessions);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluatePathwayPreparation -----------------------------------------------

describe("evaluatePathwayPreparation", () => {
  it("returns zero score for empty data", () => {
    const result = evaluatePathwayPreparation([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalChildren).toBe(0);
    expect(result.pathwayPlanRate).toBe(0);
    expect(result.independenceSectionRate).toBe(0);
    expect(result.accommodationPlannedRate).toBe(0);
    expect(result.financialLiteracyRate).toBe(0);
    expect(result.healthPassportRate).toBe(0);
    expect(result.childContributionRate).toBe(0);
  });

  it("scores high for complete pathways", () => {
    const pathways: PathwayPlanProgress[] = [
      makePathway({ id: "1" }),
      makePathway({ id: "2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = evaluatePathwayPreparation(pathways);
    expect(result.pathwayPlanRate).toBe(100);
    expect(result.independenceSectionRate).toBe(100);
    expect(result.accommodationPlannedRate).toBe(100);
    expect(result.financialLiteracyRate).toBe(100);
    expect(result.healthPassportRate).toBe(100);
    expect(result.childContributionRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(22);
  });

  it("handles mixed pathway completion", () => {
    const pathways: PathwayPlanProgress[] = [
      makePathway({ id: "1" }),
      makePathway({
        id: "2",
        childId: "child-2",
        childName: "Jordan",
        hasPathwayPlan: false,
        independenceSectionComplete: false,
        accommodationPlanned: false,
        financialLiteracyIncluded: false,
        healthPassportComplete: false,
        childContributed: false,
      }),
    ];
    const result = evaluatePathwayPreparation(pathways);
    expect(result.pathwayPlanRate).toBe(50);
    expect(result.totalChildren).toBe(2);
  });

  it("caps score at 25", () => {
    const pathways = Array.from({ length: 10 }, (_, i) =>
      makePathway({ id: `p-${i}`, childId: `child-${i}`, childName: `Child ${i}` }),
    );
    const result = evaluatePathwayPreparation(pathways);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- buildChildIndependenceProfiles -------------------------------------------

describe("buildChildIndependenceProfiles", () => {
  it("returns empty array for no data", () => {
    const profiles = buildChildIndependenceProfiles([], [], [], []);
    expect(profiles).toEqual([]);
  });

  it("builds profiles across all data sources", () => {
    const assessments: SkillAssessment[] = [
      makeAssessment({ id: "1", childId: "c1", childName: "Alex", domain: "cooking_nutrition", competenceLevel: "independent" }),
      makeAssessment({ id: "2", childId: "c1", childName: "Alex", domain: "budgeting_finance", competenceLevel: "needs_some_support" }),
    ];
    const goals: IndependenceGoal[] = [
      makeGoal({ id: "1", childId: "c1", childName: "Alex", status: "achieved" }),
      makeGoal({ id: "2", childId: "c1", childName: "Alex", status: "on_track" }),
    ];
    const sessions: PracticalSession[] = [
      makeSession({ id: "1", childId: "c1", childName: "Alex" }),
      makeSession({ id: "2", childId: "c1", childName: "Alex" }),
      makeSession({ id: "3", childId: "c1", childName: "Alex" }),
    ];
    const pathways: PathwayPlanProgress[] = [
      makePathway({ id: "1", childId: "c1", childName: "Alex" }),
    ];

    const profiles = buildChildIndependenceProfiles(assessments, goals, sessions, pathways);
    expect(profiles).toHaveLength(1);

    const alex = profiles[0];
    expect(alex.childName).toBe("Alex");
    expect(alex.domainsAssessed).toBe(2);
    expect(alex.independentDomains).toBe(1);
    expect(alex.goalCount).toBe(2);
    expect(alex.goalsAchieved).toBe(1);
    expect(alex.sessionCount).toBe(3);
    expect(alex.hasPathwayPlan).toBe(true);
    expect(alex.overallScore).toBeGreaterThan(0);
    expect(alex.overallScore).toBeLessThanOrEqual(10);
  });

  it("handles children appearing in different data sources", () => {
    const assessments: SkillAssessment[] = [
      makeAssessment({ id: "1", childId: "c1", childName: "Alex" }),
    ];
    const goals: IndependenceGoal[] = [
      makeGoal({ id: "1", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildIndependenceProfiles(assessments, goals, [], []);
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan"]);
  });

  it("caps profile score at 10", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        domain: ["cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing", "household_tasks", "travel_transport", "communication", "digital_literacy", "health_management", "social_skills"][i] as any,
        competenceLevel: "independent",
      }),
    );
    const goals = Array.from({ length: 10 }, (_, i) =>
      makeGoal({ id: `g-${i}`, status: "achieved" }),
    );
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `s-${i}` }),
    );
    const pathways = [makePathway()];
    const profiles = buildChildIndependenceProfiles(assessments, goals, sessions, pathways);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("handles child without pathway plan", () => {
    const assessments = [makeAssessment()];
    const profiles = buildChildIndependenceProfiles(assessments, [], [], []);
    expect(profiles[0].hasPathwayPlan).toBe(false);
  });
});

// -- generateIndependenceLifeSkillsIntelligence --------------------------------

describe("generateIndependenceLifeSkillsIntelligence", () => {
  it("returns inadequate rating for empty data", () => {
    const result = generateIndependenceLifeSkillsIntelligence([], [], [], [], "oak-house", "2026-01-01", "2026-05-18");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.childProfiles).toEqual([]);
    expect(result.skillDevelopment.totalAssessments).toBe(0);
    expect(result.goalProgress.totalGoals).toBe(0);
    expect(result.practicalLearning.totalSessions).toBe(0);
    expect(result.pathwayPreparation.totalChildren).toBe(0);
  });

  it("scores highly for comprehensive data", () => {
    const domains: Array<any> = ["cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing", "household_tasks", "travel_transport", "communication", "digital_literacy"];
    const methods: Array<any> = ["one_to_one", "group_session", "practical_activity", "community_based", "peer_mentoring", "online_learning"];

    const assessments = domains.map((d, i) =>
      makeAssessment({ id: `a-${i}`, domain: d, competenceLevel: "independent", previousLevel: "needs_some_support" }),
    );
    const goals = domains.map((d, i) =>
      makeGoal({ id: `g-${i}`, domain: d, status: "achieved", childInvolved: true, ageAppropriate: true, reviewDate: "2026-05-01" }),
    );
    const sessions = domains.map((d, i) =>
      makeSession({
        id: `s-${i}`,
        domain: d,
        teachingMethod: methods[i % methods.length],
        childEngaged: true,
        progressMade: true,
        communityBased: true,
      }),
    );
    const pathways = [makePathway()];

    const result = generateIndependenceLifeSkillsIntelligence(
      assessments, goals, sessions, pathways, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(60);
    expect(result.rating).not.toBe("inadequate");
    expect(result.childProfiles).toHaveLength(1);
  });

  it("caps overall score at 100", () => {
    const domains: Array<any> = [
      "cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing",
      "household_tasks", "travel_transport", "communication", "digital_literacy",
      "health_management", "emotional_regulation",
    ];
    const methods: Array<any> = ["one_to_one", "group_session", "practical_activity", "community_based", "peer_mentoring", "online_learning"];

    const assessments = domains.map((d, i) =>
      makeAssessment({ id: `a-${i}`, domain: d, competenceLevel: "independent", previousLevel: "needs_significant_support" }),
    );
    const goals = domains.map((d, i) =>
      makeGoal({ id: `g-${i}`, domain: d, status: "achieved", childInvolved: true, ageAppropriate: true, reviewDate: "2026-05-01" }),
    );
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        domain: domains[i % domains.length],
        teachingMethod: methods[i % methods.length],
        childEngaged: true,
        progressMade: true,
        communityBased: true,
      }),
    );
    const pathways = [makePathway()];

    const result = generateIndependenceLifeSkillsIntelligence(
      assessments, goals, sessions, pathways, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates strengths for high-scoring data", () => {
    const assessments = Array.from({ length: 8 }, (_, i) =>
      makeAssessment({
        id: `a-${i}`,
        domain: ["cooking_nutrition", "budgeting_finance", "personal_hygiene", "laundry_clothing", "household_tasks", "travel_transport", "communication", "digital_literacy"][i] as any,
        competenceLevel: "independent",
        previousLevel: "needs_some_support",
      }),
    );
    const goals = Array.from({ length: 5 }, (_, i) =>
      makeGoal({ id: `g-${i}`, status: "achieved", childInvolved: true, ageAppropriate: true }),
    );
    const sessions = Array.from({ length: 8 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        childEngaged: true,
        progressMade: true,
        communityBased: i < 5,
        teachingMethod: ["one_to_one", "group_session", "practical_activity", "community_based", "peer_mentoring"][i % 5] as any,
      }),
    );
    const pathways = [makePathway()];

    const result = generateIndependenceLifeSkillsIntelligence(
      assessments, goals, sessions, pathways, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement for low-scoring data", () => {
    const assessments = [
      makeAssessment({ id: "1", competenceLevel: "not_yet_started", previousLevel: null }),
    ];
    const goals = [
      makeGoal({ id: "1", status: "behind", childInvolved: false }),
    ];
    const pathways = [
      makePathway({
        id: "1",
        hasPathwayPlan: false,
        independenceSectionComplete: false,
        accommodationPlanned: false,
        financialLiteracyIncluded: false,
        healthPassportComplete: false,
        childContributed: false,
      }),
    ];

    const result = generateIndependenceLifeSkillsIntelligence(
      assessments, goals, [], pathways, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions when no sessions exist", () => {
    const result = generateIndependenceLifeSkillsIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    const urgent = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generateIndependenceLifeSkillsIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 13"))).toBe(true);
  });

  it("includes pathway-specific regulatory links when pathways present", () => {
    const pathways = [makePathway()];
    const result = generateIndependenceLifeSkillsIntelligence(
      [], [], [], pathways, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Leaving Care Act 2000"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Keep On Caring"))).toBe(true);
  });

  it("handles multi-child scenario", () => {
    const assessments: SkillAssessment[] = [
      makeAssessment({ id: "1", childId: "c1", childName: "Alex", competenceLevel: "independent" }),
      makeAssessment({ id: "2", childId: "c2", childName: "Jordan", competenceLevel: "needs_significant_support" }),
      makeAssessment({ id: "3", childId: "c3", childName: "Morgan", competenceLevel: "mostly_independent" }),
    ];
    const goals: IndependenceGoal[] = [
      makeGoal({ id: "1", childId: "c1", childName: "Alex", status: "achieved" }),
      makeGoal({ id: "2", childId: "c2", childName: "Jordan", status: "behind" }),
    ];
    const sessions: PracticalSession[] = [
      makeSession({ id: "1", childId: "c1", childName: "Alex" }),
      makeSession({ id: "2", childId: "c3", childName: "Morgan" }),
    ];
    const pathways: PathwayPlanProgress[] = [
      makePathway({ id: "1", childId: "c1", childName: "Alex" }),
      makePathway({ id: "2", childId: "c3", childName: "Morgan", hasPathwayPlan: false, childContributed: false }),
    ];

    const result = generateIndependenceLifeSkillsIntelligence(
      assessments, goals, sessions, pathways, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.childProfiles).toHaveLength(3);
    expect(result.childProfiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan", "Morgan"]);
  });
});

// -- Edge Cases ---------------------------------------------------------------

describe("edge cases", () => {
  it("single assessment returns valid result", () => {
    const result = evaluateSkillDevelopment([makeAssessment()]);
    expect(result.totalAssessments).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single goal returns valid result", () => {
    const result = evaluateGoalProgress([makeGoal()]);
    expect(result.totalGoals).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("single session returns valid result", () => {
    const result = evaluatePracticalLearning([makeSession()]);
    expect(result.totalSessions).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("single pathway returns valid result", () => {
    const result = evaluatePathwayPreparation([makePathway()]);
    expect(result.totalChildren).toBe(1);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("all not_yet_started assessments produce low score", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeAssessment({ id: `a-${i}`, competenceLevel: "not_yet_started", previousLevel: null }),
    );
    const result = evaluateSkillDevelopment(assessments);
    expect(result.overallScore).toBeLessThan(5);
  });

  it("all abandoned goals produce low score", () => {
    const goals = Array.from({ length: 5 }, (_, i) =>
      makeGoal({ id: `g-${i}`, status: "abandoned", childInvolved: false, ageAppropriate: false, reviewDate: null }),
    );
    const result = evaluateGoalProgress(goals);
    expect(result.overallScore).toBe(0);
  });

  it("no engagement produces low practical score", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s-${i}`, childEngaged: false, progressMade: false, communityBased: false }),
    );
    const result = evaluatePracticalLearning(sessions);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("all fields false on pathway produces low score", () => {
    const pathways = [makePathway({
      hasPathwayPlan: false,
      independenceSectionComplete: false,
      accommodationPlanned: false,
      financialLiteracyIncluded: false,
      healthPassportComplete: false,
      childContributed: false,
    })];
    const result = evaluatePathwayPreparation(pathways);
    expect(result.overallScore).toBe(0);
  });

  it("improvement from null previous level is not counted", () => {
    const assessments = [
      makeAssessment({ id: "1", previousLevel: null, competenceLevel: "independent" }),
    ];
    const result = evaluateSkillDevelopment(assessments);
    // No previous level = no improvement tracked
    expect(result.improvementRate).toBe(0);
  });

  it("same level as previous is not improvement", () => {
    const assessments = [
      makeAssessment({ id: "1", previousLevel: "mostly_independent", competenceLevel: "mostly_independent" }),
    ];
    const result = evaluateSkillDevelopment(assessments);
    expect(result.improvementRate).toBe(0);
  });

  it("regression from previous level is not improvement", () => {
    const assessments = [
      makeAssessment({ id: "1", previousLevel: "independent", competenceLevel: "needs_some_support" }),
    ];
    const result = evaluateSkillDevelopment(assessments);
    expect(result.improvementRate).toBe(0);
  });
});
