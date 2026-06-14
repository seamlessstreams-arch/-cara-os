import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getCaraLearningCategoryLabel,
  getCaraLearningOutcomeLabel,
  getRatingLabel,
  evaluateCaraLearningQuality,
  evaluateCaraLearningCompliance,
  evaluateCaraLearningPolicy,
  evaluateStaffCaraLearningReadiness,
  buildChildCaraLearningProfiles,
  generateCaraLearningIntelligence,
} from "../cara-learning-intelligence-engine";
import type {
  CaraLearningRecord,
  CaraLearningPolicy,
  StaffCaraLearningTraining,
} from "../cara-learning-intelligence-engine";

/* ── helpers ─────────────────────────────────────────────────── */

function makeRecord(overrides: Partial<CaraLearningRecord> = {}): CaraLearningRecord {
  return {
    id: "al-001",
    homeId: "home-oak",
    date: "2026-03-01",
    childId: "child-alex",
    childName: "Alex",
    category: "agent_task_completion",
    outcome: "meets_target",
    taskCompletedAccurately: true,
    costEfficiencyMaintained: true,
    learningDocumented: true,
    qualityAssurancePassed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function allTruePolicy(): CaraLearningPolicy {
  return {
    agentLearningPolicy: true,
    costReductionFramework: true,
    qualityAssurancePolicy: true,
    dataProtectionForAgents: true,
    performanceBenchmarkingPolicy: true,
    humanOversightPolicy: true,
    agentCapabilityReviewPolicy: true,
  };
}

function allFalsePolicy(): CaraLearningPolicy {
  return {
    agentLearningPolicy: false,
    costReductionFramework: false,
    qualityAssurancePolicy: false,
    dataProtectionForAgents: false,
    performanceBenchmarkingPolicy: false,
    humanOversightPolicy: false,
    agentCapabilityReviewPolicy: false,
  };
}

function fullStaff(): StaffCaraLearningTraining {
  return {
    staffId: "staff-sarah",
    agentManagementKnowledge: true,
    costAnalysisSkills: true,
    qualityAssuranceSkills: true,
    dataInterpretationSkills: true,
    performanceMonitoringSkills: true,
    humanOversightCapability: true,
  };
}

/* ── pct() ───────────────────────────────────────────────────── */

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(0, 0)).toBe(0);
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(1, 2)).toBe(50);
    expect(pct(3, 4)).toBe(75);
    expect(pct(10, 10)).toBe(100);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

/* ── getRating() ─────────────────────────────────────────────── */

describe("getRating()", () => {
  it("returns outstanding for >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

/* ── Label functions ─────────────────────────────────────────── */

describe("label functions", () => {
  it("getCaraLearningCategoryLabel returns string for all categories", () => {
    const categories = [
      "agent_task_completion", "cost_reduction_analysis", "learning_pattern_identification",
      "knowledge_base_update", "agent_capability_assessment", "resolution_tier_evaluation",
      "replacement_readiness_review", "performance_benchmark",
    ] as const;
    for (const c of categories) {
      expect(typeof getCaraLearningCategoryLabel(c)).toBe("string");
      expect(getCaraLearningCategoryLabel(c).length).toBeGreaterThan(0);
    }
  });

  it("getCaraLearningOutcomeLabel returns string for all outcomes", () => {
    const outcomes = ["exceeds_target", "meets_target", "approaching_target", "below_target", "not_applicable"] as const;
    for (const o of outcomes) {
      expect(typeof getCaraLearningOutcomeLabel(o)).toBe("string");
      expect(getCaraLearningOutcomeLabel(o).length).toBeGreaterThan(0);
    }
  });

  it("getRatingLabel returns string for all ratings", () => {
    const ratings = ["outstanding", "good", "requires_improvement", "inadequate"] as const;
    for (const r of ratings) {
      expect(typeof getRatingLabel(r)).toBe("string");
      expect(getRatingLabel(r).length).toBeGreaterThan(0);
    }
  });
});

/* ── evaluateCaraLearningQuality() ───────────────────────────── */

describe("evaluateCaraLearningQuality()", () => {
  it("returns 0 score for empty records", () => {
    const result = evaluateCaraLearningQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.taskCompletedAccuratelyRate).toBe(0);
    expect(result.costEfficiencyMaintainedRate).toBe(0);
    expect(result.learningDocumentedRate).toBe(0);
    expect(result.qualityAssurancePassedRate).toBe(0);
  });

  it("returns max score (25) for all-true records", () => {
    const records = [makeRecord(), makeRecord({ id: "al-002" })];
    const result = evaluateCaraLearningQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(2);
    expect(result.taskCompletedAccuratelyRate).toBe(100);
    expect(result.costEfficiencyMaintainedRate).toBe(100);
    expect(result.learningDocumentedRate).toBe(100);
    expect(result.qualityAssurancePassedRate).toBe(100);
  });

  it("calculates mixed records correctly", () => {
    const records = [
      makeRecord(),
      makeRecord({ id: "al-002", taskCompletedAccurately: false, costEfficiencyMaintained: false }),
    ];
    const result = evaluateCaraLearningQuality(records);
    expect(result.taskCompletedAccuratelyRate).toBe(50);
    expect(result.costEfficiencyMaintainedRate).toBe(50);
    expect(result.learningDocumentedRate).toBe(100);
    expect(result.qualityAssurancePassedRate).toBe(100);
    // (50/100)*7 + (50/100)*6 + (100/100)*6 + (100/100)*6 = 3.5 + 3 + 6 + 6 = 18.5
    expect(result.overallScore).toBe(18.5);
  });

  it("handles single record", () => {
    const result = evaluateCaraLearningQuality([makeRecord()]);
    expect(result.totalRecords).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("scores 0 when all quality booleans false", () => {
    const records = [makeRecord({
      taskCompletedAccurately: false,
      costEfficiencyMaintained: false,
      learningDocumented: false,
      qualityAssurancePassed: false,
    })];
    const result = evaluateCaraLearningQuality(records);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const result = evaluateCaraLearningQuality([makeRecord()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

/* ── evaluateCaraLearningCompliance() ────────────────────────── */

describe("evaluateCaraLearningCompliance()", () => {
  it("returns 0 score for empty records", () => {
    const result = evaluateCaraLearningCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.taskCompletedAccuratelyRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("returns high score for full compliance", () => {
    const records = [
      makeRecord({ category: "agent_task_completion" }),
      makeRecord({ id: "al-002", category: "cost_reduction_analysis" }),
      makeRecord({ id: "al-003", category: "learning_pattern_identification" }),
      makeRecord({ id: "al-004", category: "knowledge_base_update" }),
      makeRecord({ id: "al-005", category: "agent_capability_assessment" }),
      makeRecord({ id: "al-006", category: "resolution_tier_evaluation" }),
      makeRecord({ id: "al-007", category: "replacement_readiness_review" }),
      makeRecord({ id: "al-008", category: "performance_benchmark" }),
    ];
    const result = evaluateCaraLearningCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.uniqueCategories).toBe(8);
    expect(result.categoryDiversityRatio).toBe(1);
  });

  it("calculates partial compliance", () => {
    const records = [
      makeRecord({ timelyRecording: false }),
      makeRecord({ id: "al-002", documentationComplete: false }),
    ];
    const result = evaluateCaraLearningCompliance(records);
    expect(result.documentationCompleteRate).toBe(50);
    expect(result.timelyRecordingRate).toBe(50);
    expect(result.uniqueCategories).toBe(1);
  });

  it("calculates category diversity ratio correctly", () => {
    const records = [
      makeRecord({ category: "agent_task_completion" }),
      makeRecord({ id: "al-002", category: "cost_reduction_analysis" }),
    ];
    const result = evaluateCaraLearningCompliance(records);
    expect(result.uniqueCategories).toBe(2);
    expect(result.categoryDiversityRatio).toBe(0.25);
  });

  it("caps score at 25", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({ id: `al-${i}`, category: ["agent_task_completion", "cost_reduction_analysis", "learning_pattern_identification", "knowledge_base_update", "agent_capability_assessment", "resolution_tier_evaluation", "replacement_readiness_review", "performance_benchmark"][i] as CaraLearningRecord["category"] })
    );
    const result = evaluateCaraLearningCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

/* ── evaluateCaraLearningPolicy() ────────────────────────────── */

describe("evaluateCaraLearningPolicy()", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateCaraLearningPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.agentLearningPolicy).toBe(false);
    expect(result.costReductionFramework).toBe(false);
    expect(result.qualityAssurancePolicy).toBe(false);
    expect(result.dataProtectionForAgents).toBe(false);
    expect(result.performanceBenchmarkingPolicy).toBe(false);
    expect(result.humanOversightPolicy).toBe(false);
    expect(result.agentCapabilityReviewPolicy).toBe(false);
  });

  it("returns 25 for all true", () => {
    const result = evaluateCaraLearningPolicy(allTruePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("returns 0 for all false", () => {
    const result = evaluateCaraLearningPolicy(allFalsePolicy());
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial policy correctly", () => {
    const policy = { ...allFalsePolicy(), agentLearningPolicy: true, costReductionFramework: true };
    const result = evaluateCaraLearningPolicy(policy);
    expect(result.overallScore).toBe(8); // 4 + 4
    expect(result.agentLearningPolicy).toBe(true);
    expect(result.costReductionFramework).toBe(true);
    expect(result.qualityAssurancePolicy).toBe(false);
  });

  it("weights first 4 policies at 4 points each", () => {
    const p1 = { ...allFalsePolicy(), agentLearningPolicy: true };
    expect(evaluateCaraLearningPolicy(p1).overallScore).toBe(4);

    const p2 = { ...allFalsePolicy(), costReductionFramework: true };
    expect(evaluateCaraLearningPolicy(p2).overallScore).toBe(4);

    const p3 = { ...allFalsePolicy(), qualityAssurancePolicy: true };
    expect(evaluateCaraLearningPolicy(p3).overallScore).toBe(4);

    const p4 = { ...allFalsePolicy(), dataProtectionForAgents: true };
    expect(evaluateCaraLearningPolicy(p4).overallScore).toBe(4);
  });

  it("weights last 3 policies at 3 points each", () => {
    const p1 = { ...allFalsePolicy(), performanceBenchmarkingPolicy: true };
    expect(evaluateCaraLearningPolicy(p1).overallScore).toBe(3);

    const p2 = { ...allFalsePolicy(), humanOversightPolicy: true };
    expect(evaluateCaraLearningPolicy(p2).overallScore).toBe(3);

    const p3 = { ...allFalsePolicy(), agentCapabilityReviewPolicy: true };
    expect(evaluateCaraLearningPolicy(p3).overallScore).toBe(3);
  });
});

/* ── evaluateStaffCaraLearningReadiness() ────────────────────── */

describe("evaluateStaffCaraLearningReadiness()", () => {
  it("returns 0 for empty staff array", () => {
    const result = evaluateStaffCaraLearningReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.agentManagementKnowledgeRate).toBe(0);
    expect(result.costAnalysisSkillsRate).toBe(0);
    expect(result.qualityAssuranceSkillsRate).toBe(0);
    expect(result.dataInterpretationSkillsRate).toBe(0);
    expect(result.performanceMonitoringSkillsRate).toBe(0);
    expect(result.humanOversightCapabilityRate).toBe(0);
  });

  it("returns 25 for fully trained staff", () => {
    const result = evaluateStaffCaraLearningReadiness([fullStaff()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(1);
    expect(result.agentManagementKnowledgeRate).toBe(100);
  });

  it("calculates partial training correctly", () => {
    const staff: StaffCaraLearningTraining[] = [
      fullStaff(),
      { ...fullStaff(), staffId: "staff-tom", agentManagementKnowledge: false, humanOversightCapability: false },
    ];
    const result = evaluateStaffCaraLearningReadiness(staff);
    expect(result.totalStaff).toBe(2);
    expect(result.agentManagementKnowledgeRate).toBe(50);
    expect(result.humanOversightCapabilityRate).toBe(50);
    expect(result.costAnalysisSkillsRate).toBe(100);
  });

  it("handles staff with no training at all", () => {
    const staff: StaffCaraLearningTraining[] = [{
      staffId: "staff-none",
      agentManagementKnowledge: false,
      costAnalysisSkills: false,
      qualityAssuranceSkills: false,
      dataInterpretationSkills: false,
      performanceMonitoringSkills: false,
      humanOversightCapability: false,
    }];
    const result = evaluateStaffCaraLearningReadiness(staff);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const result = evaluateStaffCaraLearningReadiness([fullStaff()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

/* ── buildChildCaraLearningProfiles() ────────────────────────── */

describe("buildChildCaraLearningProfiles()", () => {
  it("returns empty array for empty records", () => {
    expect(buildChildCaraLearningProfiles([])).toEqual([]);
  });

  it("builds profile for single child", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "agent_task_completion" }),
      makeRecord({ id: "al-002", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis" }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-alex");
    expect(profiles[0].totalRecords).toBe(2);
    expect(profiles[0].taskCompletedAccuratelyRate).toBe(100);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("builds profiles for multiple children", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ id: "al-002", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    expect(profiles).toHaveLength(2);
  });

  it("scores frequency: < 5 records = 0", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "agent_task_completion" }),
      makeRecord({ id: "al-002", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis" }),
      makeRecord({ id: "al-003", childId: "child-alex", childName: "Alex", category: "learning_pattern_identification" }),
      makeRecord({ id: "al-004", childId: "child-alex", childName: "Alex", category: "knowledge_base_update" }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=0, rate1=3(100%), rate2=3(100%), diversity=2(4 cats) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores frequency: >= 5 records = 1", () => {
    const records = Array.from({ length: 5 }, (_, i) =>
      makeRecord({ id: `al-${i}`, childId: "child-alex", childName: "Alex", category: "agent_task_completion" })
    );
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=1, rate1=3(100%), rate2=3(100%), diversity=0(1 cat) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores frequency: >= 10 records = 2", () => {
    const records = Array.from({ length: 10 }, (_, i) =>
      makeRecord({ id: `al-${i}`, childId: "child-alex", childName: "Alex", category: "agent_task_completion" })
    );
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=2, rate1=3(100%), rate2=3(100%), diversity=0(1 cat) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores rate1 bands correctly", () => {
    // 3/4 = 75% → rate1Score = 2
    const records = [
      makeRecord({ id: "al-1", childId: "child-alex", childName: "Alex", category: "agent_task_completion" }),
      makeRecord({ id: "al-2", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis" }),
      makeRecord({ id: "al-3", childId: "child-alex", childName: "Alex", category: "learning_pattern_identification" }),
      makeRecord({ id: "al-4", childId: "child-alex", childName: "Alex", category: "knowledge_base_update", taskCompletedAccurately: false }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=0, rate1=2(75%), rate2=3(100%), diversity=2(4 cats) = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores rate2 bands correctly", () => {
    // 2/4 = 50% → rate2Score = 1
    const records = [
      makeRecord({ id: "al-1", childId: "child-alex", childName: "Alex", category: "agent_task_completion" }),
      makeRecord({ id: "al-2", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis" }),
      makeRecord({ id: "al-3", childId: "child-alex", childName: "Alex", category: "learning_pattern_identification", costEfficiencyMaintained: false }),
      makeRecord({ id: "al-4", childId: "child-alex", childName: "Alex", category: "knowledge_base_update", costEfficiencyMaintained: false }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=0, rate1=3(100%), rate2=1(50%), diversity=2(4 cats) = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores diversity: 1 category = 0", () => {
    const records = [makeRecord({ childId: "child-alex", childName: "Alex" })];
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=0 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores diversity: 2 categories = 1", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "agent_task_completion" }),
      makeRecord({ id: "al-2", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis" }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=1 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores diversity: >= 4 categories = 2", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", category: "agent_task_completion" }),
      makeRecord({ id: "al-2", childId: "child-alex", childName: "Alex", category: "cost_reduction_analysis" }),
      makeRecord({ id: "al-3", childId: "child-alex", childName: "Alex", category: "learning_pattern_identification" }),
      makeRecord({ id: "al-4", childId: "child-alex", childName: "Alex", category: "knowledge_base_update" }),
    ];
    const profiles = buildChildCaraLearningProfiles(records);
    // freq=0, rate1=3, rate2=3, diversity=2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("caps child score at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      makeRecord({
        id: `al-${i}`,
        childId: "child-alex",
        childName: "Alex",
        category: ["agent_task_completion", "cost_reduction_analysis", "learning_pattern_identification", "knowledge_base_update"][i % 4] as CaraLearningRecord["category"],
      })
    );
    const profiles = buildChildCaraLearningProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
    // freq=2(12), rate1=3(100%), rate2=3(100%), diversity=2(4 cats) = 10
    expect(profiles[0].overallScore).toBe(10);
  });
});

/* ── generateCaraLearningIntelligence() ──────────────────────── */

describe("generateCaraLearningIntelligence()", () => {
  it("orchestrates full intelligence generation", () => {
    const records = [
      makeRecord({ category: "agent_task_completion" }),
      makeRecord({ id: "al-002", category: "cost_reduction_analysis" }),
      makeRecord({ id: "al-003", category: "learning_pattern_identification" }),
      makeRecord({ id: "al-004", category: "knowledge_base_update" }),
    ];
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: allTruePolicy(),
      staff: [fullStaff()],
    });

    expect(result.homeId).toBe("home-oak");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-12-31");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.caraLearningQuality.totalRecords).toBe(4);
    expect(result.caraLearningCompliance.totalRecords).toBe(4);
    expect(result.caraLearningPolicy.overallScore).toBe(25);
    expect(result.staffReadiness.overallScore).toBe(25);
    expect(result.childProfiles.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("returns inadequate with empty records", () => {
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toEqual([]);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("handles null policy gracefully", () => {
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [makeRecord()],
      policy: null,
      staff: [fullStaff()],
    });

    expect(result.caraLearningPolicy.overallScore).toBe(0);
    expect(result.areasForImprovement.some((a) => a.includes("No Cara learning policy"))).toBe(true);
  });

  it("filters records by date range", () => {
    const records = [
      makeRecord({ date: "2025-12-31" }), // outside range
      makeRecord({ id: "al-002", date: "2026-03-15" }), // inside
      makeRecord({ id: "al-003", date: "2026-07-01" }), // inside
      makeRecord({ id: "al-004", date: "2027-01-01" }), // outside
    ];
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: allTruePolicy(),
      staff: [fullStaff()],
    });

    expect(result.caraLearningQuality.totalRecords).toBe(2);
  });

  it("caps overall score at 100", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `al-${i}`,
        category: ["agent_task_completion", "cost_reduction_analysis", "learning_pattern_identification", "knowledge_base_update", "agent_capability_assessment", "resolution_tier_evaluation", "replacement_readiness_review", "performance_benchmark"][i] as CaraLearningRecord["category"],
      })
    );
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: allTruePolicy(),
      staff: [fullStaff()],
    });

    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("generates strengths for high scores", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `al-${i}`,
        category: ["agent_task_completion", "cost_reduction_analysis", "learning_pattern_identification", "knowledge_base_update", "agent_capability_assessment", "resolution_tier_evaluation", "replacement_readiness_review", "performance_benchmark"][i] as CaraLearningRecord["category"],
      })
    );
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: allTruePolicy(),
      staff: [fullStaff()],
    });

    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates actions for low scores", () => {
    const records = [
      makeRecord({
        taskCompletedAccurately: false,
        costEfficiencyMaintained: false,
        learningDocumented: false,
        qualityAssurancePassed: false,
        documentationComplete: false,
        timelyRecording: false,
      }),
    ];
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: null,
      staff: [],
    });

    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates default action when no issues", () => {
    const records = Array.from({ length: 8 }, (_, i) =>
      makeRecord({
        id: `al-${i}`,
        category: ["agent_task_completion", "cost_reduction_analysis", "learning_pattern_identification", "knowledge_base_update", "agent_capability_assessment", "resolution_tier_evaluation", "replacement_readiness_review", "performance_benchmark"][i] as CaraLearningRecord["category"],
      })
    );
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records,
      policy: allTruePolicy(),
      staff: [fullStaff()],
    });

    expect(result.actions).toContain("No immediate actions required. Cara learning systems operating within expected standards.");
  });

  it("includes regulatory links", () => {
    const result = generateCaraLearningIntelligence({
      homeId: "home-oak",
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      records: [],
      policy: null,
      staff: [],
    });

    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 13 — Leadership and management");
    expect(result.regulatoryLinks).toContain("Data Protection Act 2018 — AI data handling");
    expect(result.regulatoryLinks.length).toBe(7);
  });
});
