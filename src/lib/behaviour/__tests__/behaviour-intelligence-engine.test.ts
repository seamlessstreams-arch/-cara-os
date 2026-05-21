import { describe, it, expect } from "vitest";
import {
  evaluateBehaviourIntelligenceQuality,
  evaluateBehaviourIntelligenceCompliance,
  evaluateBehaviourIntelligencePolicy,
  evaluateStaffBehaviourIntelligenceReadiness,
  buildChildBehaviourIntelligenceProfiles,
  generateBehaviourIntelligenceReport,
  pct,
  getRating,
  getBehaviourIntelligenceCategoryLabel,
  getBehaviourIntelligenceOutcomeLabel,
  getBehaviourIntelligenceRatingLabel,
  type BehaviourIntelligenceRecord,
  type BehaviourIntelligencePolicy,
  type StaffBehaviourIntelligenceTraining,
  type BehaviourIntelligenceCategory,
} from "../behaviour-intelligence-engine";

// ── Helpers ──────────────────────────────────────────────────────────────────

function rec(overrides: Partial<BehaviourIntelligenceRecord> = {}): BehaviourIntelligenceRecord {
  return {
    id: "rec-1",
    homeId: "home-oak-house",
    date: "2025-06-15",
    childId: "child-alex",
    childName: "Alex",
    category: "positive_reinforcement",
    outcome: "behaviour_improved",
    childViewIncluded: true,
    deEscalationAttempted: true,
    positiveReinforcementUsed: true,
    supportPlanFollowed: true,
    documentationComplete: true,
    timelyRecording: true,
    ...overrides,
  };
}

function fullPolicy(): BehaviourIntelligencePolicy {
  return {
    behaviourSupportPolicy: true,
    physicalInterventionPolicy: true,
    restorativePracticePolicy: true,
    deEscalationFramework: true,
    rewardAndSanctionsPolicy: true,
    behaviourAnalysisPolicy: true,
    postIncidentLearningPolicy: true,
  };
}

function staff(overrides: Partial<StaffBehaviourIntelligenceTraining> = {}): StaffBehaviourIntelligenceTraining {
  return {
    staffId: "staff-sarah",
    behaviourManagementKnowledge: true,
    deEscalationSkills: true,
    restorativePracticeSkills: true,
    physicalInterventionTraining: true,
    traumaInformedApproach: true,
    behaviourAnalysisSkills: true,
    ...overrides,
  };
}

const ALL_CATEGORIES: BehaviourIntelligenceCategory[] = [
  "positive_reinforcement", "de_escalation", "behaviour_support_plan", "restorative_practice",
  "physical_intervention", "sanctions_review", "reward_system", "behaviour_analysis",
];

// ══════════════════════════════════════════════════════════════════════════════
// pct
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("computes correct percentage", () => { expect(pct(3, 4)).toBe(75); });
  it("returns 0 when den is 0", () => { expect(pct(5, 0)).toBe(0); });
  it("rounds to nearest integer", () => { expect(pct(1, 3)).toBe(33); expect(pct(2, 3)).toBe(67); });
  it("handles 100%", () => { expect(pct(10, 10)).toBe(100); });
  it("handles 0 numerator", () => { expect(pct(0, 10)).toBe(0); });
  it("handles large values", () => { expect(pct(999, 1000)).toBe(100); });
  it("handles 1/1", () => { expect(pct(1, 1)).toBe(100); });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60 and < 80", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40 and < 60", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(0)).toBe("inadequate"); expect(getRating(39)).toBe("inadequate"); });
  it("handles boundary at 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(79)).toBe("good"); });
  it("handles boundary at 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(59)).toBe("requires_improvement"); });
  it("handles boundary at 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(39)).toBe("inadequate"); });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getBehaviourIntelligenceCategoryLabel", () => {
  it("returns label for positive_reinforcement", () => { expect(getBehaviourIntelligenceCategoryLabel("positive_reinforcement")).toBe("Positive Reinforcement"); });
  it("returns label for de_escalation", () => { expect(getBehaviourIntelligenceCategoryLabel("de_escalation")).toBe("De-escalation"); });
  it("returns label for behaviour_support_plan", () => { expect(getBehaviourIntelligenceCategoryLabel("behaviour_support_plan")).toBe("Behaviour Support Plan"); });
  it("returns label for restorative_practice", () => { expect(getBehaviourIntelligenceCategoryLabel("restorative_practice")).toBe("Restorative Practice"); });
  it("returns label for physical_intervention", () => { expect(getBehaviourIntelligenceCategoryLabel("physical_intervention")).toBe("Physical Intervention"); });
  it("returns label for sanctions_review", () => { expect(getBehaviourIntelligenceCategoryLabel("sanctions_review")).toBe("Sanctions Review"); });
  it("returns label for reward_system", () => { expect(getBehaviourIntelligenceCategoryLabel("reward_system")).toBe("Reward System"); });
  it("returns label for behaviour_analysis", () => { expect(getBehaviourIntelligenceCategoryLabel("behaviour_analysis")).toBe("Behaviour Analysis"); });
});

describe("getBehaviourIntelligenceOutcomeLabel", () => {
  it("returns label for behaviour_improved", () => { expect(getBehaviourIntelligenceOutcomeLabel("behaviour_improved")).toBe("Behaviour Improved"); });
  it("returns label for behaviour_maintained", () => { expect(getBehaviourIntelligenceOutcomeLabel("behaviour_maintained")).toBe("Behaviour Maintained"); });
  it("returns label for partial_improvement", () => { expect(getBehaviourIntelligenceOutcomeLabel("partial_improvement")).toBe("Partial Improvement"); });
  it("returns label for no_improvement", () => { expect(getBehaviourIntelligenceOutcomeLabel("no_improvement")).toBe("No Improvement"); });
  it("returns label for not_applicable", () => { expect(getBehaviourIntelligenceOutcomeLabel("not_applicable")).toBe("Not Applicable"); });
});

describe("getBehaviourIntelligenceRatingLabel", () => {
  it("returns Outstanding", () => { expect(getBehaviourIntelligenceRatingLabel("outstanding")).toBe("Outstanding"); });
  it("returns Good", () => { expect(getBehaviourIntelligenceRatingLabel("good")).toBe("Good"); });
  it("returns Requires Improvement", () => { expect(getBehaviourIntelligenceRatingLabel("requires_improvement")).toBe("Requires Improvement"); });
  it("returns Inadequate", () => { expect(getBehaviourIntelligenceRatingLabel("inadequate")).toBe("Inadequate"); });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 1: Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBehaviourIntelligenceQuality", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateBehaviourIntelligenceQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.childViewIncludedRate).toBe(0);
    expect(result.deEscalationAttemptedRate).toBe(0);
    expect(result.positiveReinforcementUsedRate).toBe(0);
    expect(result.supportPlanFollowedRate).toBe(0);
  });

  it("scores max (25) for all-true records", () => {
    const records = [rec(), rec({ id: "rec-2" }), rec({ id: "rec-3" })];
    const result = evaluateBehaviourIntelligenceQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.childViewIncludedRate).toBe(100);
    expect(result.deEscalationAttemptedRate).toBe(100);
    expect(result.positiveReinforcementUsedRate).toBe(100);
    expect(result.supportPlanFollowedRate).toBe(100);
  });

  it("scores 0 for all-false records", () => {
    const records = [rec({ childViewIncluded: false, deEscalationAttempted: false, positiveReinforcementUsed: false, supportPlanFollowed: false })];
    const result = evaluateBehaviourIntelligenceQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(1);
  });

  it("applies weight 7 for childViewIncluded", () => {
    const r = [rec({ deEscalationAttempted: false, positiveReinforcementUsed: false, supportPlanFollowed: false })];
    expect(evaluateBehaviourIntelligenceQuality(r).overallScore).toBe(7);
  });

  it("applies weight 6 for deEscalationAttempted", () => {
    const r = [rec({ childViewIncluded: false, positiveReinforcementUsed: false, supportPlanFollowed: false })];
    expect(evaluateBehaviourIntelligenceQuality(r).overallScore).toBe(6);
  });

  it("applies weight 6 for positiveReinforcementUsed", () => {
    const r = [rec({ childViewIncluded: false, deEscalationAttempted: false, supportPlanFollowed: false })];
    expect(evaluateBehaviourIntelligenceQuality(r).overallScore).toBe(6);
  });

  it("applies weight 6 for supportPlanFollowed", () => {
    const r = [rec({ childViewIncluded: false, deEscalationAttempted: false, positiveReinforcementUsed: false })];
    expect(evaluateBehaviourIntelligenceQuality(r).overallScore).toBe(6);
  });

  it("computes mixed rates correctly (50/50 split)", () => {
    const records = [
      rec({ childViewIncluded: true, deEscalationAttempted: true, positiveReinforcementUsed: false, supportPlanFollowed: false }),
      rec({ id: "r2", childViewIncluded: false, deEscalationAttempted: false, positiveReinforcementUsed: true, supportPlanFollowed: true }),
    ];
    const result = evaluateBehaviourIntelligenceQuality(records);
    expect(result.childViewIncludedRate).toBe(50);
    expect(result.deEscalationAttemptedRate).toBe(50);
    expect(result.positiveReinforcementUsedRate).toBe(50);
    expect(result.supportPlanFollowedRate).toBe(50);
  });

  it("caps at 25", () => {
    const result = evaluateBehaviourIntelligenceQuality([rec()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("correctly counts totalRecords", () => {
    const records = [rec(), rec({ id: "r2" }), rec({ id: "r3" }), rec({ id: "r4" }), rec({ id: "r5" })];
    expect(evaluateBehaviourIntelligenceQuality(records).totalRecords).toBe(5);
  });

  it("handles single record all true", () => {
    const result = evaluateBehaviourIntelligenceQuality([rec()]);
    expect(result.overallScore).toBe(25);
    expect(result.totalRecords).toBe(1);
  });

  it("handles two booleans true (7+6=13)", () => {
    const r = [rec({ positiveReinforcementUsed: false, supportPlanFollowed: false })];
    expect(evaluateBehaviourIntelligenceQuality(r).overallScore).toBe(13);
  });

  it("handles three booleans true (7+6+6=19)", () => {
    const r = [rec({ supportPlanFollowed: false })];
    expect(evaluateBehaviourIntelligenceQuality(r).overallScore).toBe(19);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBehaviourIntelligenceCompliance", () => {
  it("returns all zeros for empty records", () => {
    const result = evaluateBehaviourIntelligenceCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalRecords).toBe(0);
    expect(result.documentationCompleteRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.childViewIncludedRate).toBe(0);
    expect(result.categoryDiversityRatio).toBe(0);
    expect(result.uniqueCategories).toBe(0);
  });

  it("scores high for all-true records with full category diversity", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = evaluateBehaviourIntelligenceCompliance(records);
    expect(result.overallScore).toBe(25);
    expect(result.categoryDiversityRatio).toBe(1);
    expect(result.uniqueCategories).toBe(8);
  });

  it("computes categoryDiversityRatio correctly for 3 categories", () => {
    const records = [
      rec({ id: "r1", category: "positive_reinforcement" }),
      rec({ id: "r2", category: "de_escalation" }),
      rec({ id: "r3", category: "behaviour_support_plan" }),
    ];
    const result = evaluateBehaviourIntelligenceCompliance(records);
    expect(result.uniqueCategories).toBe(3);
    expect(result.categoryDiversityRatio).toBe(Math.round((3 / 8) * 100) / 100);
  });

  it("computes categoryDiversityRatio correctly for 1 category", () => {
    const records = [rec({ id: "r1" }), rec({ id: "r2" })];
    const result = evaluateBehaviourIntelligenceCompliance(records);
    expect(result.uniqueCategories).toBe(1);
    expect(result.categoryDiversityRatio).toBe(Math.round((1 / 8) * 100) / 100);
  });

  it("applies weight 8 for documentationCompleteRate", () => {
    const records = [rec({ timelyRecording: false, childViewIncluded: false })];
    const result = evaluateBehaviourIntelligenceCompliance(records);
    // doc: 100% * 8 = 8, timely: 0, childView: 0, diversity: 1/8*5 = 0.625
    expect(result.overallScore).toBeGreaterThanOrEqual(8);
  });

  it("applies weight 7 for timelyRecordingRate", () => {
    const records = [rec({ documentationComplete: false, childViewIncluded: false })];
    const result = evaluateBehaviourIntelligenceCompliance(records);
    // timely: 100%*7 = 7, diversity: (1/8)*5 = 0.625
    expect(result.overallScore).toBeGreaterThanOrEqual(7);
  });

  it("applies weight 5 for childViewIncludedRate", () => {
    const records = [rec({ documentationComplete: false, timelyRecording: false })];
    const result = evaluateBehaviourIntelligenceCompliance(records);
    // childView: 100%*5 = 5, diversity: (1/8)*5 = 0.625
    expect(result.overallScore).toBeGreaterThanOrEqual(5);
  });

  it("handles all-false compliance booleans", () => {
    const records = [rec({ documentationComplete: false, timelyRecording: false, childViewIncluded: false })];
    const result = evaluateBehaviourIntelligenceCompliance(records);
    // Only diversity contributes: (1/8)*5 = 0.625 → rounded to 0.6
    expect(result.overallScore).toBeLessThan(1);
  });

  it("categoryDiversityRatio for 5 categories", () => {
    const cats = ALL_CATEGORIES.slice(0, 5);
    const records = cats.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = evaluateBehaviourIntelligenceCompliance(records);
    expect(result.categoryDiversityRatio).toBe(Math.round((5 / 8) * 100) / 100);
  });

  it("correctly counts totalRecords for compliance", () => {
    const records = Array.from({ length: 7 }, (_, i) => rec({ id: `r-${i}` }));
    expect(evaluateBehaviourIntelligenceCompliance(records).totalRecords).toBe(7);
  });

  it("full diversity gives ratio of 1", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    expect(evaluateBehaviourIntelligenceCompliance(records).categoryDiversityRatio).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateBehaviourIntelligencePolicy", () => {
  it("returns 0 with all false for null", () => {
    const result = evaluateBehaviourIntelligencePolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.behaviourSupportPolicy).toBe(false);
    expect(result.physicalInterventionPolicy).toBe(false);
    expect(result.restorativePracticePolicy).toBe(false);
    expect(result.deEscalationFramework).toBe(false);
    expect(result.rewardAndSanctionsPolicy).toBe(false);
    expect(result.behaviourAnalysisPolicy).toBe(false);
    expect(result.postIncidentLearningPolicy).toBe(false);
  });

  it("scores max (25) for full policy", () => {
    const result = evaluateBehaviourIntelligencePolicy(fullPolicy());
    expect(result.overallScore).toBe(25);
  });

  it("applies weight 4 for behaviourSupportPolicy", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(4);
  });

  it("applies weight 4 for physicalInterventionPolicy", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), behaviourSupportPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(4);
  });

  it("applies weight 4 for restorativePracticePolicy", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), behaviourSupportPolicy: false, physicalInterventionPolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(4);
  });

  it("applies weight 4 for deEscalationFramework", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(4);
  });

  it("applies weight 3 for rewardAndSanctionsPolicy", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(3);
  });

  it("applies weight 3 for behaviourAnalysisPolicy", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(3);
  });

  it("applies weight 3 for postIncidentLearningPolicy", () => {
    const p: BehaviourIntelligencePolicy = { ...fullPolicy(), behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(3);
  });

  it("sums weights correctly: 4+4+4+4+3+3+3 = 25", () => {
    expect(evaluateBehaviourIntelligencePolicy(fullPolicy()).overallScore).toBe(25);
  });

  it("scores 0 for all-false policy", () => {
    const p: BehaviourIntelligencePolicy = { behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(0);
  });

  it("reflects boolean values in result", () => {
    const p = { ...fullPolicy(), postIncidentLearningPolicy: false };
    const result = evaluateBehaviourIntelligencePolicy(p);
    expect(result.postIncidentLearningPolicy).toBe(false);
    expect(result.behaviourSupportPolicy).toBe(true);
  });

  it("handles partial policy (first 4 true = 16)", () => {
    const p: BehaviourIntelligencePolicy = { behaviourSupportPolicy: true, physicalInterventionPolicy: true, restorativePracticePolicy: true, deEscalationFramework: true, rewardAndSanctionsPolicy: false, behaviourAnalysisPolicy: false, postIncidentLearningPolicy: false };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(16);
  });

  it("handles partial policy (last 3 true = 9)", () => {
    const p: BehaviourIntelligencePolicy = { behaviourSupportPolicy: false, physicalInterventionPolicy: false, restorativePracticePolicy: false, deEscalationFramework: false, rewardAndSanctionsPolicy: true, behaviourAnalysisPolicy: true, postIncidentLearningPolicy: true };
    expect(evaluateBehaviourIntelligencePolicy(p).overallScore).toBe(9);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffBehaviourIntelligenceReadiness", () => {
  it("returns all zeros for empty staff", () => {
    const result = evaluateStaffBehaviourIntelligenceReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.behaviourManagementKnowledgeRate).toBe(0);
    expect(result.deEscalationSkillsRate).toBe(0);
    expect(result.restorativePracticeSkillsRate).toBe(0);
    expect(result.physicalInterventionTrainingRate).toBe(0);
    expect(result.traumaInformedApproachRate).toBe(0);
    expect(result.behaviourAnalysisSkillsRate).toBe(0);
  });

  it("scores max (25) for all-skilled staff", () => {
    const s = [staff(), staff({ staffId: "s2" }), staff({ staffId: "s3" })];
    const result = evaluateStaffBehaviourIntelligenceReadiness(s);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(3);
  });

  it("scores 0 for all-unskilled staff", () => {
    const s = [staff({ behaviourManagementKnowledge: false, deEscalationSkills: false, restorativePracticeSkills: false, physicalInterventionTraining: false, traumaInformedApproach: false, behaviourAnalysisSkills: false })];
    const result = evaluateStaffBehaviourIntelligenceReadiness(s);
    expect(result.overallScore).toBe(0);
  });

  it("applies weight 6 for behaviourManagementKnowledge", () => {
    const s = [staff({ deEscalationSkills: false, restorativePracticeSkills: false, physicalInterventionTraining: false, traumaInformedApproach: false, behaviourAnalysisSkills: false })];
    expect(evaluateStaffBehaviourIntelligenceReadiness(s).overallScore).toBe(6);
  });

  it("applies weight 5 for deEscalationSkills", () => {
    const s = [staff({ behaviourManagementKnowledge: false, restorativePracticeSkills: false, physicalInterventionTraining: false, traumaInformedApproach: false, behaviourAnalysisSkills: false })];
    expect(evaluateStaffBehaviourIntelligenceReadiness(s).overallScore).toBe(5);
  });

  it("applies weight 5 for restorativePracticeSkills", () => {
    const s = [staff({ behaviourManagementKnowledge: false, deEscalationSkills: false, physicalInterventionTraining: false, traumaInformedApproach: false, behaviourAnalysisSkills: false })];
    expect(evaluateStaffBehaviourIntelligenceReadiness(s).overallScore).toBe(5);
  });

  it("applies weight 4 for physicalInterventionTraining", () => {
    const s = [staff({ behaviourManagementKnowledge: false, deEscalationSkills: false, restorativePracticeSkills: false, traumaInformedApproach: false, behaviourAnalysisSkills: false })];
    expect(evaluateStaffBehaviourIntelligenceReadiness(s).overallScore).toBe(4);
  });

  it("applies weight 3 for traumaInformedApproach", () => {
    const s = [staff({ behaviourManagementKnowledge: false, deEscalationSkills: false, restorativePracticeSkills: false, physicalInterventionTraining: false, behaviourAnalysisSkills: false })];
    expect(evaluateStaffBehaviourIntelligenceReadiness(s).overallScore).toBe(3);
  });

  it("applies weight 2 for behaviourAnalysisSkills", () => {
    const s = [staff({ behaviourManagementKnowledge: false, deEscalationSkills: false, restorativePracticeSkills: false, physicalInterventionTraining: false, traumaInformedApproach: false })];
    expect(evaluateStaffBehaviourIntelligenceReadiness(s).overallScore).toBe(2);
  });

  it("sums weights correctly: 6+5+5+4+3+2 = 25", () => {
    expect(evaluateStaffBehaviourIntelligenceReadiness([staff()]).overallScore).toBe(25);
  });

  it("computes mixed rates correctly", () => {
    const s = [
      staff({ behaviourAnalysisSkills: false }),
      staff({ staffId: "s2", behaviourManagementKnowledge: false, behaviourAnalysisSkills: false }),
    ];
    const result = evaluateStaffBehaviourIntelligenceReadiness(s);
    expect(result.behaviourManagementKnowledgeRate).toBe(50);
    expect(result.behaviourAnalysisSkillsRate).toBe(0);
  });

  it("handles single staff member", () => {
    const result = evaluateStaffBehaviourIntelligenceReadiness([staff()]);
    expect(result.totalStaff).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("handles multiple staff with partial skills", () => {
    const s = [
      staff({ physicalInterventionTraining: false, traumaInformedApproach: false, behaviourAnalysisSkills: false }),
      staff({ staffId: "s2", behaviourManagementKnowledge: false, deEscalationSkills: false, restorativePracticeSkills: false }),
    ];
    const result = evaluateStaffBehaviourIntelligenceReadiness(s);
    expect(result.behaviourManagementKnowledgeRate).toBe(50);
    expect(result.physicalInterventionTrainingRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildBehaviourIntelligenceProfiles", () => {
  it("returns empty for no records", () => {
    expect(buildChildBehaviourIntelligenceProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const records = [
      rec({ childId: "child-alex", childName: "Alex" }),
      rec({ id: "r2", childId: "child-jordan", childName: "Jordan" }),
      rec({ id: "r3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    expect(profiles).toHaveLength(2);
    expect(profiles.find((p) => p.childId === "child-alex")?.totalRecords).toBe(2);
    expect(profiles.find((p) => p.childId === "child-jordan")?.totalRecords).toBe(1);
  });

  it("scores frequency: >= 10 gives 2", () => {
    const records = Array.from({ length: 10 }, (_, i) => rec({ id: `r-${i}` }));
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    // freq=2, rate1(childView 100%)=3, rate2(deEsc 100%)=3, diversity(1 cat)=0 → 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores frequency: >= 5 and < 10 gives 1", () => {
    const records = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}` }));
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    // freq=1, rate1=3, rate2=3, div=0 → 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores frequency: < 5 gives 0", () => {
    const records = [rec()];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    // freq=0, rate1=3, rate2=3, div=0 → 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores rate1 (childViewIncluded) tier: >= 80 gives 3", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, childViewIncluded: i < 4 }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].childViewIncludedRate).toBe(80);
  });

  it("scores rate1 (childViewIncluded) tier: >= 60 gives 2", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, childViewIncluded: i < 3 }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].childViewIncludedRate).toBe(60);
  });

  it("scores rate1 (childViewIncluded) tier: >= 40 gives 1", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, childViewIncluded: i < 2 }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].childViewIncludedRate).toBe(40);
  });

  it("scores rate1 (childViewIncluded) tier: < 40 gives 0", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, childViewIncluded: false }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].childViewIncludedRate).toBe(0);
  });

  it("scores rate2 (deEscalationAttempted) tier: >= 80 gives 3", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, deEscalationAttempted: i < 4 }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].deEscalationAttemptedRate).toBe(80);
  });

  it("scores rate2 (deEscalationAttempted) tier: >= 60 gives 2", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, deEscalationAttempted: i < 3 }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].deEscalationAttemptedRate).toBe(60);
  });

  it("scores rate2 (deEscalationAttempted) tier: < 40 gives 0", () => {
    const r = Array.from({ length: 5 }, (_, i) => rec({ id: `r-${i}`, deEscalationAttempted: false }));
    const profiles = buildChildBehaviourIntelligenceProfiles(r);
    expect(profiles[0].deEscalationAttemptedRate).toBe(0);
  });

  it("scores diversity: >= 4 gives 2", () => {
    const records = [
      rec({ id: "r1", category: "positive_reinforcement" }),
      rec({ id: "r2", category: "de_escalation" }),
      rec({ id: "r3", category: "behaviour_support_plan" }),
      rec({ id: "r4", category: "restorative_practice" }),
    ];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(4);
  });

  it("scores diversity: >= 2 and < 4 gives 1", () => {
    const records = [
      rec({ id: "r1", category: "positive_reinforcement" }),
      rec({ id: "r2", category: "de_escalation" }),
    ];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(2);
  });

  it("scores diversity: 1 category gives 0", () => {
    const records = [rec({ id: "r1" }), rec({ id: "r2" })];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    expect(profiles[0].categoriesCovered).toHaveLength(1);
  });

  it("caps at 10", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      rec({ id: `r-${i}`, category: ALL_CATEGORIES[i % 8] }),
    );
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("max score is 10 (freq=2, rate1=3, rate2=3, div=2)", () => {
    const records = Array.from({ length: 12 }, (_, i) =>
      rec({ id: `r-${i}`, category: ALL_CATEGORIES[i % 8] }),
    );
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    // freq=2(12 recs), rate1=3(100%), rate2=3(100%), div=2(8 cats) = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores 0 for all-false record", () => {
    const records = [rec({ childViewIncluded: false, deEscalationAttempted: false })];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    // freq=0, rate1=0(0%), rate2=0(0%), div=0(1) → 0
    expect(profiles[0].overallScore).toBe(0);
  });

  it("preserves childName correctly", () => {
    const records = [rec({ childId: "child-morgan", childName: "Morgan" })];
    const profiles = buildChildBehaviourIntelligenceProfiles(records);
    expect(profiles[0].childName).toBe("Morgan");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator
// ══════════════════════════════════════════════════════════════════════════════

describe("generateBehaviourIntelligenceReport", () => {
  const baseInput = {
    homeId: "home-oak-house",
    periodStart: "2025-01-01",
    periodEnd: "2025-12-31",
  };

  it("produces complete report for full data", () => {
    const records = ALL_CATEGORIES.map((cat, i) =>
      rec({ id: `r-${i}`, category: cat, childId: i < 4 ? "child-alex" : "child-jordan", childName: i < 4 ? "Alex" : "Jordan" }),
    );
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" }), staff({ staffId: "s3" }), staff({ staffId: "s4" })],
    });

    expect(result.homeId).toBe("home-oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
    expect(result.childProfiles).toHaveLength(2);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("handles empty data", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.some((a) => a.includes("No behaviour records"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No behaviour management policy"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("No staff behaviour training"))).toBe(true);
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("filters records by period", () => {
    const records = [
      rec({ id: "r1", date: "2025-06-15" }), // in period
      rec({ id: "r2", date: "2024-06-15" }), // before period
      rec({ id: "r3", date: "2026-06-15" }), // after period
    ];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.behaviourQuality.totalRecords).toBe(1);
  });

  it("overall score is sum of 4 evaluators capped at 100", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" })],
    });
    const expected = Math.min(100, Math.round(
      result.behaviourQuality.overallScore +
      result.behaviourCompliance.overallScore +
      result.behaviourPolicy.overallScore +
      result.staffReadiness.overallScore,
    ));
    expect(result.overallScore).toBe(expected);
  });

  it("rating matches score thresholds", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("generates outstanding strengths", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" }), staff({ staffId: "s3" })],
    });
    expect(result.overallScore).toBe(100);
    expect(result.strengths.some((s) => s.includes("Outstanding"))).toBe(true);
  });

  it("generates actions for low child view", () => {
    const records = [rec({ childViewIncluded: false, deEscalationAttempted: false })];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("Child views included at 0%"))).toBe(true);
  });

  it("generates actions for low de-escalation", () => {
    const records = [rec({ deEscalationAttempted: false, childViewIncluded: false })];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("De-escalation attempted at 0%"))).toBe(true);
  });

  it("generates actions for low documentation", () => {
    const records = [rec({ documentationComplete: false })];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("Documentation rate at 0%"))).toBe(true);
  });

  it("generates no-actions message when all is well", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff(), staff({ staffId: "s2" })],
    });
    expect(result.actions).toContain("No immediate actions required. Behaviour management systems operating within expected standards.");
  });

  it("always includes regulatory links", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 35"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("CHR 2015 Reg 20"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("NMS 12"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((r) => r.includes("Quality Standards 2015"))).toBe(true);
  });

  it("includes low score children in actions", () => {
    const records = [rec({ childViewIncluded: false, deEscalationAttempted: false })];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    // Child score is 0 (all false rates, 1 record, 1 category)
    expect(result.actions.some((a) => a.includes("child(ren) with low behaviour support"))).toBe(true);
  });

  it("includes period dates in result", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.periodStart).toBe("2025-01-01");
    expect(result.periodEnd).toBe("2025-12-31");
  });

  it("includes homeId in result", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [],
      policy: null,
      staff: [],
    });
    expect(result.homeId).toBe("home-oak-house");
  });

  it("generates urgent actions for null policy", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [rec()],
      policy: null,
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("behaviour management policy"))).toBe(true);
  });

  it("generates urgent actions for empty staff", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [rec()],
      policy: fullPolicy(),
      staff: [],
    });
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff behaviour training"))).toBe(true);
  });

  it("generates action for low timely recording", () => {
    const records = [rec({ timelyRecording: false })];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.actions.some((a) => a.includes("Timely recording at 0%"))).toBe(true);
  });

  it("generates action for low staff behaviour management knowledge", () => {
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records: [rec()],
      policy: fullPolicy(),
      staff: [staff({ behaviourManagementKnowledge: false })],
    });
    expect(result.actions.some((a) => a.includes("Behaviour management knowledge at 0%"))).toBe(true);
  });

  it("generates strength for quality >= 20", () => {
    const records = ALL_CATEGORIES.map((cat, i) => rec({ id: `r-${i}`, category: cat }));
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.strengths.some((s) => s.includes("Behaviour quality practices are strong"))).toBe(true);
  });

  it("generates area for improvement when quality < 15", () => {
    const records = [rec({ childViewIncluded: false, deEscalationAttempted: false, positiveReinforcementUsed: false, supportPlanFollowed: false })];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.areasForImprovement.some((a) => a.includes("Behaviour quality practices need improvement"))).toBe(true);
  });

  it("period boundary inclusion works correctly", () => {
    const records = [
      rec({ id: "r1", date: "2025-01-01" }), // exactly on start boundary
      rec({ id: "r2", date: "2025-12-31" }), // exactly on end boundary
    ];
    const result = generateBehaviourIntelligenceReport({
      ...baseInput,
      records,
      policy: fullPolicy(),
      staff: [staff()],
    });
    expect(result.behaviourQuality.totalRecords).toBe(2);
  });
});
