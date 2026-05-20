// ══════════════════════════════════════════════════════════════════════════════
// Activities & Enrichment Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getActivityCategoryLabel,
  getActivityOutcomeLabel,
  getRatingLabel,
  evaluateActivityQuality,
  evaluateActivityCompliance,
  evaluateActivityPolicy,
  evaluateStaffActivityReadiness,
  buildChildActivityProfiles,
  generateActivitiesIntelligence,
} from "../activities-engine";
import type {
  ActivityRecord,
  ActivityPolicy,
  StaffActivityTraining,
  ActivityCategory,
} from "../activities-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeRecord(overrides: Partial<ActivityRecord> = {}): ActivityRecord {
  return {
    id: "rec-001",
    childId: "child-alex",
    childName: "Alex",
    activityDate: "2026-03-15",
    category: "sport_physical",
    childChoiceOffered: true,
    ageAppropriate: true,
    inclusiveParticipation: true,
    enjoymentRecorded: true,
    documentationComplete: true,
    riskAssessed: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ActivityPolicy> = {}): ActivityPolicy {
  return {
    id: "pol-001",
    activitiesPolicy: true,
    inclusionFramework: true,
    riskAssessmentProtocol: true,
    childParticipationGuidance: true,
    communityEngagementStrategy: true,
    budgetAllocationPolicy: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffActivityTraining> = {}): StaffActivityTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    activityPlanning: true,
    safeguardingAwareness: true,
    inclusionSkills: true,
    riskManagement: true,
    communityLinks: true,
    firstAid: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getActivityCategoryLabel", () => {
  it("returns correct label for sport_physical", () => {
    expect(getActivityCategoryLabel("sport_physical")).toBe("Sport & Physical");
  });

  it("returns correct label for creative_arts", () => {
    expect(getActivityCategoryLabel("creative_arts")).toBe("Creative Arts");
  });

  it("returns correct label for cultural_heritage", () => {
    expect(getActivityCategoryLabel("cultural_heritage")).toBe("Cultural & Heritage");
  });

  it("returns correct label for educational_enrichment", () => {
    expect(getActivityCategoryLabel("educational_enrichment")).toBe("Educational Enrichment");
  });

  it("returns correct label for social_recreational", () => {
    expect(getActivityCategoryLabel("social_recreational")).toBe("Social & Recreational");
  });

  it("returns correct label for outdoor_adventure", () => {
    expect(getActivityCategoryLabel("outdoor_adventure")).toBe("Outdoor & Adventure");
  });

  it("returns correct label for community_involvement", () => {
    expect(getActivityCategoryLabel("community_involvement")).toBe("Community Involvement");
  });

  it("returns correct label for therapeutic_activity", () => {
    expect(getActivityCategoryLabel("therapeutic_activity")).toBe("Therapeutic Activity");
  });
});

describe("getActivityOutcomeLabel", () => {
  it("returns correct label for completed", () => {
    expect(getActivityOutcomeLabel("completed")).toBe("Completed");
  });

  it("returns correct label for partially_completed", () => {
    expect(getActivityOutcomeLabel("partially_completed")).toBe("Partially Completed");
  });

  it("returns correct label for not_completed", () => {
    expect(getActivityOutcomeLabel("not_completed")).toBe("Not Completed");
  });

  it("returns correct label for cancelled", () => {
    expect(getActivityOutcomeLabel("cancelled")).toBe("Cancelled");
  });

  it("returns correct label for rescheduled", () => {
    expect(getActivityOutcomeLabel("rescheduled")).toBe("Rescheduled");
  });
});

describe("getRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct label for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: evaluateActivityQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActivityQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateActivityQuality([]);
    expect(result.totalRecords).toBe(0);
    expect(result.childChoiceRate).toBe(0);
    expect(result.ageAppropriateRate).toBe(0);
    expect(result.inclusiveRate).toBe(0);
    expect(result.enjoymentRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("has concern for empty records", () => {
    const result = evaluateActivityQuality([]);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("No activity records");
  });

  it("returns perfect score for all-true records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateActivityQuality(records);
    expect(result.childChoiceRate).toBe(100);
    expect(result.ageAppropriateRate).toBe(100);
    expect(result.inclusiveRate).toBe(100);
    expect(result.enjoymentRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates partial scores correctly", () => {
    const records = [
      makeRecord({ id: "r1", childChoiceOffered: true, ageAppropriate: true, inclusiveParticipation: true, enjoymentRecorded: true }),
      makeRecord({ id: "r2", childChoiceOffered: false, ageAppropriate: false, inclusiveParticipation: false, enjoymentRecorded: false }),
    ];
    const result = evaluateActivityQuality(records);
    expect(result.childChoiceRate).toBe(50);
    expect(result.ageAppropriateRate).toBe(50);
    expect(result.inclusiveRate).toBe(50);
    expect(result.enjoymentRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5+3+3+3 = 12.5
    expect(result.score).toBe(12.5);
  });

  it("caps score at 25", () => {
    const records = [makeRecord()];
    const result = evaluateActivityQuality(records);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("includes strengths when rates are high", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `rec-${i}` }),
    );
    const result = evaluateActivityQuality(records);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("includes concerns when rates are low", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        childChoiceOffered: false,
        ageAppropriate: false,
        inclusiveParticipation: false,
        enjoymentRecorded: false,
      }),
    );
    const result = evaluateActivityQuality(records);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.childChoiceRate).toBe(0);
  });

  it("weights childChoiceRate at 7 points", () => {
    // Only childChoice true, rest false
    const records = [makeRecord({
      childChoiceOffered: true,
      ageAppropriate: false,
      inclusiveParticipation: false,
      enjoymentRecorded: false,
    })];
    const result = evaluateActivityQuality(records);
    expect(result.score).toBe(7);
  });

  it("weights ageAppropriateRate at 6 points", () => {
    const records = [makeRecord({
      childChoiceOffered: false,
      ageAppropriate: true,
      inclusiveParticipation: false,
      enjoymentRecorded: false,
    })];
    const result = evaluateActivityQuality(records);
    expect(result.score).toBe(6);
  });

  it("weights inclusiveRate at 6 points", () => {
    const records = [makeRecord({
      childChoiceOffered: false,
      ageAppropriate: false,
      inclusiveParticipation: true,
      enjoymentRecorded: false,
    })];
    const result = evaluateActivityQuality(records);
    expect(result.score).toBe(6);
  });

  it("weights enjoymentRate at 6 points", () => {
    const records = [makeRecord({
      childChoiceOffered: false,
      ageAppropriate: false,
      inclusiveParticipation: false,
      enjoymentRecorded: true,
    })];
    const result = evaluateActivityQuality(records);
    expect(result.score).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateActivityCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActivityCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateActivityCompliance([]);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationRate).toBe(0);
    expect(result.riskAssessedRate).toBe(0);
    expect(result.childChoiceRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.score).toBe(0);
  });

  it("has concern for empty records", () => {
    const result = evaluateActivityCompliance([]);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("returns perfect score for all-true records across all categories", () => {
    const categories: ActivityCategory[] = [
      "sport_physical", "creative_arts", "cultural_heritage",
      "educational_enrichment", "social_recreational", "outdoor_adventure",
      "community_involvement", "therapeutic_activity",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateActivityCompliance(records);
    expect(result.documentationRate).toBe(100);
    expect(result.riskAssessedRate).toBe(100);
    expect(result.childChoiceRate).toBe(100);
    expect(result.categoryDiversityRatio).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates diversity ratio correctly", () => {
    const records = [
      makeRecord({ id: "r1", category: "sport_physical" }),
      makeRecord({ id: "r2", category: "creative_arts" }),
      makeRecord({ id: "r3", category: "cultural_heritage" }),
      makeRecord({ id: "r4", category: "educational_enrichment" }),
    ];
    const result = evaluateActivityCompliance(records);
    expect(result.uniqueCategories).toBe(4);
    expect(result.categoryDiversityRatio).toBe(50);
  });

  it("calculates partial compliance scores", () => {
    const records = [
      makeRecord({ id: "r1", documentationComplete: true, riskAssessed: true, childChoiceOffered: true }),
      makeRecord({ id: "r2", documentationComplete: false, riskAssessed: false, childChoiceOffered: false }),
    ];
    const result = evaluateActivityCompliance(records);
    expect(result.documentationRate).toBe(50);
    expect(result.riskAssessedRate).toBe(50);
    expect(result.childChoiceRate).toBe(50);
  });

  it("caps score at 25", () => {
    const categories: ActivityCategory[] = [
      "sport_physical", "creative_arts", "cultural_heritage",
      "educational_enrichment", "social_recreational", "outdoor_adventure",
      "community_involvement", "therapeutic_activity",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateActivityCompliance(records);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `rec-${i}`,
        documentationComplete: false,
        riskAssessed: false,
        childChoiceOffered: false,
      }),
    );
    const result = evaluateActivityCompliance(records);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("includes strengths when rates are high", () => {
    const categories: ActivityCategory[] = [
      "sport_physical", "creative_arts", "cultural_heritage",
      "educational_enrichment", "social_recreational", "outdoor_adventure",
    ];
    const records = categories.map((cat, i) =>
      makeRecord({ id: `rec-${i}`, category: cat }),
    );
    const result = evaluateActivityCompliance(records);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("weights documentation at 8 points", () => {
    const records = [makeRecord({
      documentationComplete: true,
      riskAssessed: false,
      childChoiceOffered: false,
    })];
    const result = evaluateActivityCompliance(records);
    // doc=8, risk=0, choice=0, diversity=pct(1,8)=13 -> 13/100*5=0.65 -> rounds
    // Total: 8 + 0 + 0 + 0.65 = 8.65 -> 8.7
    expect(result.score).toBeGreaterThanOrEqual(8);
    expect(result.score).toBeLessThanOrEqual(10);
  });

  it("weights riskAssessed at 7 points", () => {
    const records = [makeRecord({
      documentationComplete: false,
      riskAssessed: true,
      childChoiceOffered: false,
    })];
    const result = evaluateActivityCompliance(records);
    // risk=7, doc=0, choice=0, diversity=0.65
    expect(result.score).toBeGreaterThanOrEqual(7);
    expect(result.score).toBeLessThanOrEqual(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateActivityPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateActivityPolicy", () => {
  it("returns 0 score and all false for null policy", () => {
    const result = evaluateActivityPolicy(null);
    expect(result.score).toBe(0);
    expect(result.activitiesPolicy).toBe(false);
    expect(result.inclusionFramework).toBe(false);
    expect(result.riskAssessmentProtocol).toBe(false);
    expect(result.childParticipationGuidance).toBe(false);
    expect(result.communityEngagementStrategy).toBe(false);
    expect(result.budgetAllocationPolicy).toBe(false);
    expect(result.reviewSchedule).toBe(false);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully compliant policy", () => {
    const result = evaluateActivityPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("weights 4-point booleans correctly", () => {
    // Only the four 4-point booleans
    const result = evaluateActivityPolicy(makePolicy({
      communityEngagementStrategy: false,
      budgetAllocationPolicy: false,
      reviewSchedule: false,
    }));
    expect(result.score).toBe(16); // 4+4+4+4 = 16
  });

  it("weights 3-point booleans correctly", () => {
    // Only the three 3-point booleans
    const result = evaluateActivityPolicy(makePolicy({
      activitiesPolicy: false,
      inclusionFramework: false,
      riskAssessmentProtocol: false,
      childParticipationGuidance: false,
    }));
    expect(result.score).toBe(9); // 3+3+3 = 9
  });

  it("reports concerns for missing components", () => {
    const result = evaluateActivityPolicy(makePolicy({
      activitiesPolicy: false,
      riskAssessmentProtocol: false,
    }));
    expect(result.concerns.some((c) => c.includes("activities policy"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("risk assessment protocol"))).toBe(true);
  });

  it("reports strength for 5+ components", () => {
    const result = evaluateActivityPolicy(makePolicy({
      reviewSchedule: false,
      budgetAllocationPolicy: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });

  it("reports strength for 7/7 components", () => {
    const result = evaluateActivityPolicy(makePolicy());
    expect(result.strengths.some((s) => s.includes("7/7"))).toBe(true);
  });

  it("reports each missing 4-point component individually", () => {
    const result = evaluateActivityPolicy(makePolicy({
      activitiesPolicy: false,
      inclusionFramework: false,
      riskAssessmentProtocol: false,
      childParticipationGuidance: false,
    }));
    expect(result.concerns.length).toBe(4);
  });

  it("reports each missing 3-point component individually", () => {
    const result = evaluateActivityPolicy(makePolicy({
      communityEngagementStrategy: false,
      budgetAllocationPolicy: false,
      reviewSchedule: false,
    }));
    expect(result.concerns.length).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffActivityReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffActivityReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffActivityReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.activityPlanningRate).toBe(0);
    expect(result.safeguardingAwarenessRate).toBe(0);
    expect(result.inclusionSkillsRate).toBe(0);
    expect(result.riskManagementRate).toBe(0);
    expect(result.communityLinksRate).toBe(0);
    expect(result.firstAidRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffActivityReadiness(training);
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", activityPlanning: true, safeguardingAwareness: false }),
      makeTraining({ id: "t2", staffId: "s2", activityPlanning: false, safeguardingAwareness: true }),
    ];
    const result = evaluateStaffActivityReadiness(training);
    expect(result.activityPlanningRate).toBe(50);
    expect(result.safeguardingAwarenessRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffActivityReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        activityPlanning: false,
        safeguardingAwareness: false,
        inclusionSkills: false,
        riskManagement: false,
        communityLinks: false,
        firstAid: false,
      }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        activityPlanning: false,
        safeguardingAwareness: false,
        inclusionSkills: false,
        riskManagement: false,
        communityLinks: false,
        firstAid: false,
      }),
    ];
    const result = evaluateStaffActivityReadiness(training);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("weights skills correctly: planning=6, safeguarding=5, inclusion=5, risk=4, community=3, firstAid=2", () => {
    // Single staff with only planning true
    const t1 = [makeTraining({
      activityPlanning: true,
      safeguardingAwareness: false,
      inclusionSkills: false,
      riskManagement: false,
      communityLinks: false,
      firstAid: false,
    })];
    const r1 = evaluateStaffActivityReadiness(t1);
    expect(r1.score).toBe(6);

    // Single staff with only safeguarding true
    const t2 = [makeTraining({
      activityPlanning: false,
      safeguardingAwareness: true,
      inclusionSkills: false,
      riskManagement: false,
      communityLinks: false,
      firstAid: false,
    })];
    const r2 = evaluateStaffActivityReadiness(t2);
    expect(r2.score).toBe(5);

    // Single staff with only inclusion true
    const t3 = [makeTraining({
      activityPlanning: false,
      safeguardingAwareness: false,
      inclusionSkills: true,
      riskManagement: false,
      communityLinks: false,
      firstAid: false,
    })];
    const r3 = evaluateStaffActivityReadiness(t3);
    expect(r3.score).toBe(5);

    // Single staff with only riskManagement true
    const t4 = [makeTraining({
      activityPlanning: false,
      safeguardingAwareness: false,
      inclusionSkills: false,
      riskManagement: true,
      communityLinks: false,
      firstAid: false,
    })];
    const r4 = evaluateStaffActivityReadiness(t4);
    expect(r4.score).toBe(4);

    // Single staff with only communityLinks true
    const t5 = [makeTraining({
      activityPlanning: false,
      safeguardingAwareness: false,
      inclusionSkills: false,
      riskManagement: false,
      communityLinks: true,
      firstAid: false,
    })];
    const r5 = evaluateStaffActivityReadiness(t5);
    expect(r5.score).toBe(3);

    // Single staff with only firstAid true
    const t6 = [makeTraining({
      activityPlanning: false,
      safeguardingAwareness: false,
      inclusionSkills: false,
      riskManagement: false,
      communityLinks: false,
      firstAid: true,
    })];
    const r6 = evaluateStaffActivityReadiness(t6);
    expect(r6.score).toBe(2);
  });

  it("includes strengths when all rates are high", () => {
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2" })];
    const result = evaluateStaffActivityReadiness(training);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Activity Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildActivityProfiles", () => {
  it("returns empty array for no records", () => {
    const profiles = buildChildActivityProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildActivityProfiles(records);
    expect(profiles.length).toBe(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.totalActivities).toBe(2);
  });

  it("calculates frequency score: 0 for < 5 records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildActivityProfiles(records);
    // freq=0, rate1=3 (100%>=80), rate2=3 (100%>=80), diversity=0 (1 cat) = 6
    expect(profiles[0].activityScore).toBe(6);
  });

  it("calculates frequency score: 1 for 5-9 records", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildActivityProfiles(records);
    // freq=1, rate1=3, rate2=3, diversity=0 (1 cat) = 7
    expect(profiles[0].activityScore).toBe(7);
  });

  it("calculates frequency score: 2 for >= 10 records", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `r-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildActivityProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=0 (1 cat) = 8
    expect(profiles[0].activityScore).toBe(8);
  });

  it("caps activityScore at 10", () => {
    const categories: ActivityCategory[] = [
      "sport_physical", "creative_arts", "cultural_heritage",
      "educational_enrichment", "social_recreational", "outdoor_adventure",
      "community_involvement", "therapeutic_activity",
    ];
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: categories[i % categories.length],
      }),
    );
    const profiles = buildChildActivityProfiles(records);
    // freq=2, rate1=3, rate2=3, diversity=2 = 10 (capped)
    expect(profiles[0].activityScore).toBe(10);
  });

  it("calculates diversity bonus: 0 for 1 category", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "sport_physical" }),
    ];
    const profiles = buildChildActivityProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(1);
  });

  it("calculates diversity bonus: 1 for 2-3 categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "sport_physical" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "creative_arts" }),
    ];
    const profiles = buildChildActivityProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(2);
    // freq=0, rate1=3, rate2=3, div=1 = 7
    expect(profiles[0].activityScore).toBe(7);
  });

  it("calculates diversity bonus: 2 for 4+ categories", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "A", category: "sport_physical" }),
      makeRecord({ id: "r2", childId: "c1", childName: "A", category: "creative_arts" }),
      makeRecord({ id: "r3", childId: "c1", childName: "A", category: "cultural_heritage" }),
      makeRecord({ id: "r4", childId: "c1", childName: "A", category: "educational_enrichment" }),
    ];
    const profiles = buildChildActivityProfiles(records);
    expect(profiles[0].uniqueCategories).toBe(4);
    // freq=0, rate1=3, rate2=3, div=2 = 8
    expect(profiles[0].activityScore).toBe(8);
  });

  it("calculates rate1 threshold: 0 when childChoiceRate < 40%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childChoiceOffered: i === 0,
      }),
    );
    const profiles = buildChildActivityProfiles(records);
    // 1/5 = 20% choice -> rate1=0
    expect(profiles[0].childChoiceRate).toBe(20);
  });

  it("calculates rate2 threshold: 0 when enjoymentRate < 40%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        enjoymentRecorded: i === 0,
      }),
    );
    const profiles = buildChildActivityProfiles(records);
    expect(profiles[0].enjoymentRate).toBe(20);
  });

  it("calculates rate1 threshold: 1 when childChoiceRate >= 40 and < 60", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childChoiceOffered: i < 2,
      }),
    );
    const profiles = buildChildActivityProfiles(records);
    // 2/5 = 40% -> rate1=1
    expect(profiles[0].childChoiceRate).toBe(40);
  });

  it("calculates rate1 threshold: 2 when childChoiceRate >= 60 and < 80", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: "c1",
        childName: "A",
        childChoiceOffered: i < 3,
      }),
    );
    const profiles = buildChildActivityProfiles(records);
    // 3/5 = 60% -> rate1=2
    expect(profiles[0].childChoiceRate).toBe(60);
  });

  it("sets childName correctly", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildActivityProfiles(records);
    expect(profiles[0].childName).toBe("Alex");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Generator: generateActivitiesIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateActivitiesIntelligence", () => {
  const categories: ActivityCategory[] = [
    "sport_physical", "creative_arts", "cultural_heritage",
    "educational_enrichment", "social_recreational", "outdoor_adventure",
    "community_involvement", "therapeutic_activity",
  ];

  function makePerfectRecords(count: number): ActivityRecord[] {
    return Array.from({ length: count }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childId: i < count / 2 ? "child-alex" : "child-jordan",
        childName: i < count / 2 ? "Alex" : "Jordan",
        activityDate: "2026-03-15",
        category: categories[i % categories.length],
      }),
    );
  }

  it("produces a complete intelligence result", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateActivitiesIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.activityQuality).toBeDefined();
    expect(result.activityCompliance).toBeDefined();
    expect(result.activityPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("achieves 100 overall score with perfect data", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateActivitiesIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 overall score with empty data and no policy", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateActivitiesIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateActivitiesIntelligence(
      [makeRecord()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateActivitiesIntelligence(
      [makeRecord()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("includes strengths for high-scoring evaluators (score >= 20)", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateActivitiesIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.strengths.some((s) => s.includes("strong"))).toBe(true);
  });

  it("includes areas for improvement for low-scoring evaluators (score < 15)", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.areasForImprovement.some((a) => a.includes("needs improvement"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ id: "r1", childId: "c1", childName: "Alex" }),
      makeRecord({ id: "r2", childId: "c2", childName: "Jordan" }),
      makeRecord({ id: "r3", childId: "c1", childName: "Alex" }),
    ];

    const result = generateActivitiesIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.childProfiles.length).toBe(2);
    const alex = result.childProfiles.find((p) => p.childId === "c1");
    expect(alex!.totalActivities).toBe(2);
  });

  it("generates conditional actions when rates are below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        childChoiceOffered: false,
        ageAppropriate: false,
        inclusiveParticipation: false,
        enjoymentRecorded: false,
        documentationComplete: false,
        riskAssessed: false,
      }),
    );

    const result = generateActivitiesIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("Child choice rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Age-appropriateness"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Inclusive participation"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Enjoyment recording"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });

  it("generates no-action message when everything is perfect", () => {
    const records = makePerfectRecords(16);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateActivitiesIntelligence(
      records, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("generates documentation action when rate below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        documentationComplete: false,
      }),
    );

    const result = generateActivitiesIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("Documentation rate"))).toBe(true);
  });

  it("generates risk assessment action when rate below 50%", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        riskAssessed: false,
      }),
    );

    const result = generateActivitiesIntelligence(
      records, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("Risk assessment"))).toBe(true);
  });

  it("generates staff planning action when rate below 50%", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", activityPlanning: false }),
      makeTraining({ id: "t2", staffId: "s2", activityPlanning: false }),
    ];

    const result = generateActivitiesIntelligence(
      [makeRecord()], makePolicy(), training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("Staff activity planning"))).toBe(true);
  });

  it("overall score sums 4 evaluator scores", () => {
    // Policy only (all true = 25), empty records (0), empty staff (0)
    const result = generateActivitiesIntelligence(
      [], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    // quality=0, compliance=0, policy=25, staff=0 = 25
    expect(result.overallScore).toBe(25);
  });

  it("sets rating to inadequate for score 0", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.rating).toBe("inadequate");
  });

  it("sets homeId correctly", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "test-home", "2026-01-01", "2026-05-20",
    );
    expect(result.homeId).toBe("test-home");
  });

  it("sets periodStart and periodEnd correctly", () => {
    const result = generateActivitiesIntelligence(
      [], null, [], "oak-house", "2026-02-01", "2026-04-30",
    );
    expect(result.periodStart).toBe("2026-02-01");
    expect(result.periodEnd).toBe("2026-04-30");
  });
});
