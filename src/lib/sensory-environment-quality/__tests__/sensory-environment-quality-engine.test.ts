// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Sensory Environment Quality Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateSensoryQuality,
  evaluateSensoryCompliance,
  evaluateSensoryPolicy,
  evaluateStaffSensoryReadiness,
  buildChildSensoryProfiles,
  generateSensoryEnvironmentQualityIntelligence,
  getSensoryAreaLabel,
  getEffectivenessLevelLabel,
  getRatingLabel,
  pct,
  getRating,
} from "../sensory-environment-quality-engine";
import type {
  SensoryAssessment,
  SensoryPolicy,
  StaffSensoryTraining,
  SensoryArea,
  EffectivenessLevel,
  Rating,
} from "../sensory-environment-quality-engine";

// ── Factory Functions ──────────────────────────────────────────────────────

let assessmentIdCounter = 0;
function makeAssessment(
  overrides: Partial<SensoryAssessment> = {},
): SensoryAssessment {
  assessmentIdCounter++;
  return {
    id: `sa-${assessmentIdCounter}`,
    childId: "child-alex",
    childName: "Alex",
    assessmentDate: "2026-03-01",
    sensoryArea: "lighting_adaptation",
    effectivenessLevel: "effective",
    childFeedbackPositive: true,
    occupationalTherapistInvolved: true,
    documentedInPlan: true,
    staffImplemented: true,
    environmentAdapted: true,
    reviewScheduled: true,
    ...overrides,
  };
}

let policyIdCounter = 0;
function makePolicy(
  overrides: Partial<SensoryPolicy> = {},
): SensoryPolicy {
  policyIdCounter++;
  return {
    id: `sp-${policyIdCounter}`,
    sensoryEnvironmentPolicy: true,
    sensoryAssessmentProcess: true,
    calmSpaceProvision: true,
    sensoryDietGuidance: true,
    staffTrainingRequirement: true,
    occupationalTherapyLink: true,
    regularReview: true,
    ...overrides,
  };
}

let trainingIdCounter = 0;
function makeTraining(
  overrides: Partial<StaffSensoryTraining> = {},
): StaffSensoryTraining {
  trainingIdCounter++;
  return {
    id: `st-${trainingIdCounter}`,
    staffId: `staff-${trainingIdCounter}`,
    staffName: `Staff ${trainingIdCounter}`,
    sensoryProcessing: true,
    autismAwareness: true,
    calmSpaceManagement: true,
    sensoryDietImplementation: true,
    occupationalTherapySupport: true,
    documentationSkills: true,
    ...overrides,
  };
}

// ── Test Constants ─────────────────────────────────────────────────────────

const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-05-19";
const HOME_ID = "oak-house";

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
  });

  it("returns 100 for equal numerator and denominator", () => {
    expect(pct(5, 5)).toBe(100);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getter Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("getSensoryAreaLabel", () => {
  it("returns correct label for lighting_adaptation", () => {
    expect(getSensoryAreaLabel("lighting_adaptation")).toBe("Lighting Adaptation");
  });

  it("returns correct label for noise_management", () => {
    expect(getSensoryAreaLabel("noise_management")).toBe("Noise Management");
  });

  it("returns correct label for tactile_provision", () => {
    expect(getSensoryAreaLabel("tactile_provision")).toBe("Tactile Provision");
  });

  it("returns correct label for visual_supports", () => {
    expect(getSensoryAreaLabel("visual_supports")).toBe("Visual Supports");
  });

  it("returns correct label for calm_space", () => {
    expect(getSensoryAreaLabel("calm_space")).toBe("Calm Space");
  });

  it("returns correct label for sensory_diet", () => {
    expect(getSensoryAreaLabel("sensory_diet")).toBe("Sensory Diet");
  });

  it("returns correct label for proprioceptive_input", () => {
    expect(getSensoryAreaLabel("proprioceptive_input")).toBe("Proprioceptive Input");
  });

  it("returns correct label for vestibular_activity", () => {
    expect(getSensoryAreaLabel("vestibular_activity")).toBe("Vestibular Activity");
  });
});

describe("getEffectivenessLevelLabel", () => {
  it("returns correct label for highly_effective", () => {
    expect(getEffectivenessLevelLabel("highly_effective")).toBe("Highly Effective");
  });

  it("returns correct label for effective", () => {
    expect(getEffectivenessLevelLabel("effective")).toBe("Effective");
  });

  it("returns correct label for partially_effective", () => {
    expect(getEffectivenessLevelLabel("partially_effective")).toBe("Partially Effective");
  });

  it("returns correct label for ineffective", () => {
    expect(getEffectivenessLevelLabel("ineffective")).toBe("Ineffective");
  });

  it("returns correct label for not_implemented", () => {
    expect(getEffectivenessLevelLabel("not_implemented")).toBe("Not Implemented");
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
// Evaluator 1: Sensory Quality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSensoryQuality", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateSensoryQuality([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.effectivenessRate).toBe(0);
    expect(result.childFeedbackRate).toBe(0);
    expect(result.occupationalTherapistRate).toBe(0);
    expect(result.environmentAdaptedRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates correct totals", () => {
    const assessments = [makeAssessment(), makeAssessment(), makeAssessment()];
    const result = evaluateSensoryQuality(assessments);
    expect(result.totalAssessments).toBe(3);
  });

  it("calculates effectiveness rate correctly", () => {
    const assessments = [
      makeAssessment({ effectivenessLevel: "highly_effective" }),
      makeAssessment({ effectivenessLevel: "effective" }),
      makeAssessment({ effectivenessLevel: "ineffective" }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.effectivenessRate).toBe(67);
  });

  it("counts highly_effective as effective", () => {
    const assessments = [
      makeAssessment({ effectivenessLevel: "highly_effective" }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.effectivenessRate).toBe(100);
  });

  it("does not count partially_effective as effective", () => {
    const assessments = [
      makeAssessment({ effectivenessLevel: "partially_effective" }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.effectivenessRate).toBe(0);
  });

  it("calculates child feedback rate correctly", () => {
    const assessments = [
      makeAssessment({ childFeedbackPositive: true }),
      makeAssessment({ childFeedbackPositive: true }),
      makeAssessment({ childFeedbackPositive: false }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.childFeedbackRate).toBe(67);
  });

  it("calculates occupational therapist rate correctly", () => {
    const assessments = [
      makeAssessment({ occupationalTherapistInvolved: true }),
      makeAssessment({ occupationalTherapistInvolved: false }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.occupationalTherapistRate).toBe(50);
  });

  it("calculates environment adapted rate correctly", () => {
    const assessments = [
      makeAssessment({ environmentAdapted: true }),
      makeAssessment({ environmentAdapted: true }),
      makeAssessment({ environmentAdapted: false }),
      makeAssessment({ environmentAdapted: false }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.environmentAdaptedRate).toBe(50);
  });

  it("produces score between 0 and 25", () => {
    const assessments = [makeAssessment(), makeAssessment()];
    const result = evaluateSensoryQuality(assessments);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives maximum score for perfect assessments", () => {
    const assessments = [makeAssessment()];
    const result = evaluateSensoryQuality(assessments);
    expect(result.score).toBe(25);
  });

  it("gives zero score when all booleans are false and ineffective", () => {
    const assessments = [
      makeAssessment({
        effectivenessLevel: "ineffective",
        childFeedbackPositive: false,
        occupationalTherapistInvolved: false,
        environmentAdapted: false,
      }),
    ];
    const result = evaluateSensoryQuality(assessments);
    expect(result.score).toBe(0);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 10 }, () => makeAssessment());
    const result = evaluateSensoryQuality(assessments);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: Sensory Compliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSensoryCompliance", () => {
  it("returns zero scores for empty assessments", () => {
    const result = evaluateSensoryCompliance([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffImplementedRate).toBe(0);
    expect(result.reviewScheduledRate).toBe(0);
    expect(result.areaDiversity).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates documented rate correctly", () => {
    const assessments = [
      makeAssessment({ documentedInPlan: true }),
      makeAssessment({ documentedInPlan: true }),
      makeAssessment({ documentedInPlan: false }),
    ];
    const result = evaluateSensoryCompliance(assessments);
    expect(result.documentedRate).toBe(67);
  });

  it("calculates staff implemented rate correctly", () => {
    const assessments = [
      makeAssessment({ staffImplemented: true }),
      makeAssessment({ staffImplemented: false }),
    ];
    const result = evaluateSensoryCompliance(assessments);
    expect(result.staffImplementedRate).toBe(50);
  });

  it("calculates review scheduled rate correctly", () => {
    const assessments = [
      makeAssessment({ reviewScheduled: true }),
      makeAssessment({ reviewScheduled: true }),
      makeAssessment({ reviewScheduled: false }),
      makeAssessment({ reviewScheduled: false }),
    ];
    const result = evaluateSensoryCompliance(assessments);
    expect(result.reviewScheduledRate).toBe(50);
  });

  it("calculates area diversity correctly", () => {
    const assessments = [
      makeAssessment({ sensoryArea: "lighting_adaptation" }),
      makeAssessment({ sensoryArea: "noise_management" }),
      makeAssessment({ sensoryArea: "calm_space" }),
      makeAssessment({ sensoryArea: "lighting_adaptation" }),
    ];
    const result = evaluateSensoryCompliance(assessments);
    expect(result.areaDiversity).toBe(3);
  });

  it("gives maximum diversity for all 8 areas", () => {
    const areas: SensoryArea[] = [
      "lighting_adaptation",
      "noise_management",
      "tactile_provision",
      "visual_supports",
      "calm_space",
      "sensory_diet",
      "proprioceptive_input",
      "vestibular_activity",
    ];
    const assessments = areas.map((area) => makeAssessment({ sensoryArea: area }));
    const result = evaluateSensoryCompliance(assessments);
    expect(result.areaDiversity).toBe(8);
  });

  it("produces score between 0 and 25", () => {
    const assessments = [makeAssessment(), makeAssessment()];
    const result = evaluateSensoryCompliance(assessments);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives zero score when all booleans false and single area", () => {
    const assessments = [
      makeAssessment({
        documentedInPlan: false,
        staffImplemented: false,
        reviewScheduled: false,
        sensoryArea: "lighting_adaptation",
      }),
    ];
    const result = evaluateSensoryCompliance(assessments);
    // diversity score: Math.round((1/8)*5) = 1
    expect(result.score).toBe(1);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 10 }, () => makeAssessment());
    const result = evaluateSensoryCompliance(assessments);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: Sensory Policy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSensoryPolicy", () => {
  it("returns zero score for null policy", () => {
    const result = evaluateSensoryPolicy(null);
    expect(result.score).toBe(0);
    expect(result.sensoryEnvironmentPolicy).toBe(false);
    expect(result.sensoryAssessmentProcess).toBe(false);
    expect(result.calmSpaceProvision).toBe(false);
    expect(result.sensoryDietGuidance).toBe(false);
    expect(result.staffTrainingRequirement).toBe(false);
    expect(result.occupationalTherapyLink).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns max score when all fields are true", () => {
    const result = evaluateSensoryPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns zero when all fields are false", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: false,
        sensoryDietGuidance: false,
        staffTrainingRequirement: false,
        occupationalTherapyLink: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(0);
  });

  it("scores sensoryEnvironmentPolicy as 4 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: true,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: false,
        sensoryDietGuidance: false,
        staffTrainingRequirement: false,
        occupationalTherapyLink: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("scores sensoryAssessmentProcess as 4 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: true,
        calmSpaceProvision: false,
        sensoryDietGuidance: false,
        staffTrainingRequirement: false,
        occupationalTherapyLink: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("scores calmSpaceProvision as 4 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: true,
        sensoryDietGuidance: false,
        staffTrainingRequirement: false,
        occupationalTherapyLink: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("scores sensoryDietGuidance as 4 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: false,
        sensoryDietGuidance: true,
        staffTrainingRequirement: false,
        occupationalTherapyLink: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("scores staffTrainingRequirement as 3 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: false,
        sensoryDietGuidance: false,
        staffTrainingRequirement: true,
        occupationalTherapyLink: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("scores occupationalTherapyLink as 3 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: false,
        sensoryDietGuidance: false,
        staffTrainingRequirement: false,
        occupationalTherapyLink: true,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("scores regularReview as 3 pts", () => {
    const result = evaluateSensoryPolicy(
      makePolicy({
        sensoryEnvironmentPolicy: false,
        sensoryAssessmentProcess: false,
        calmSpaceProvision: false,
        sensoryDietGuidance: false,
        staffTrainingRequirement: false,
        occupationalTherapyLink: false,
        regularReview: true,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("correctly reflects each boolean field", () => {
    const policy = makePolicy({
      sensoryEnvironmentPolicy: true,
      sensoryAssessmentProcess: false,
      calmSpaceProvision: true,
      sensoryDietGuidance: false,
      staffTrainingRequirement: true,
      occupationalTherapyLink: false,
      regularReview: true,
    });
    const result = evaluateSensoryPolicy(policy);
    expect(result.sensoryEnvironmentPolicy).toBe(true);
    expect(result.sensoryAssessmentProcess).toBe(false);
    expect(result.calmSpaceProvision).toBe(true);
    expect(result.sensoryDietGuidance).toBe(false);
    expect(result.staffTrainingRequirement).toBe(true);
    expect(result.occupationalTherapyLink).toBe(false);
    expect(result.regularReview).toBe(true);
    // 4+0+4+0+3+0+3 = 14
    expect(result.score).toBe(14);
  });

  it("caps score at 25", () => {
    const result = evaluateSensoryPolicy(makePolicy());
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: Staff Sensory Readiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffSensoryReadiness", () => {
  it("returns zero scores for empty training", () => {
    const result = evaluateStaffSensoryReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.averageCompetencyRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("calculates correct staff count", () => {
    const training = [makeTraining(), makeTraining(), makeTraining()];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("calculates sensory processing rate correctly", () => {
    const training = [
      makeTraining({ sensoryProcessing: true }),
      makeTraining({ sensoryProcessing: true }),
      makeTraining({ sensoryProcessing: false }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.sensoryProcessingRate).toBe(67);
  });

  it("calculates autism awareness rate correctly", () => {
    const training = [
      makeTraining({ autismAwareness: true }),
      makeTraining({ autismAwareness: false }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.autismAwarenessRate).toBe(50);
  });

  it("calculates calm space management rate correctly", () => {
    const training = [
      makeTraining({ calmSpaceManagement: true }),
      makeTraining({ calmSpaceManagement: true }),
      makeTraining({ calmSpaceManagement: true }),
      makeTraining({ calmSpaceManagement: false }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.calmSpaceManagementRate).toBe(75);
  });

  it("calculates sensory diet implementation rate correctly", () => {
    const training = [
      makeTraining({ sensoryDietImplementation: true }),
      makeTraining({ sensoryDietImplementation: false }),
      makeTraining({ sensoryDietImplementation: false }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.sensoryDietImplementationRate).toBe(33);
  });

  it("calculates occupational therapy support rate correctly", () => {
    const training = [
      makeTraining({ occupationalTherapySupport: true }),
      makeTraining({ occupationalTherapySupport: true }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.occupationalTherapySupportRate).toBe(100);
  });

  it("calculates documentation skills rate correctly", () => {
    const training = [
      makeTraining({ documentationSkills: false }),
      makeTraining({ documentationSkills: false }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.documentationSkillsRate).toBe(0);
  });

  it("produces score between 0 and 25", () => {
    const training = [makeTraining(), makeTraining()];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("gives maximum score for fully trained staff", () => {
    const training = [makeTraining()];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.score).toBe(25);
  });

  it("gives zero score for completely untrained staff", () => {
    const training = [
      makeTraining({
        sensoryProcessing: false,
        autismAwareness: false,
        calmSpaceManagement: false,
        sensoryDietImplementation: false,
        occupationalTherapySupport: false,
        documentationSkills: false,
      }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.score).toBe(0);
    expect(result.averageCompetencyRate).toBe(0);
  });

  it("calculates average competency rate correctly", () => {
    const training = [
      makeTraining(), // 6/6
      makeTraining({
        sensoryProcessing: true,
        autismAwareness: true,
        calmSpaceManagement: true,
        sensoryDietImplementation: false,
        occupationalTherapySupport: false,
        documentationSkills: false,
      }), // 3/6
    ];
    const result = evaluateStaffSensoryReadiness(training);
    // 9 out of 12 = 75
    expect(result.averageCompetencyRate).toBe(75);
  });

  it("weights sensory processing highest in scoring", () => {
    const training = [
      makeTraining({
        sensoryProcessing: true,
        autismAwareness: false,
        calmSpaceManagement: false,
        sensoryDietImplementation: false,
        occupationalTherapySupport: false,
        documentationSkills: false,
      }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.score).toBe(6);
  });

  it("weights documentation skills lowest in scoring", () => {
    const training = [
      makeTraining({
        sensoryProcessing: false,
        autismAwareness: false,
        calmSpaceManagement: false,
        sensoryDietImplementation: false,
        occupationalTherapySupport: false,
        documentationSkills: true,
      }),
    ];
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.score).toBe(2);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 10 }, () => makeTraining());
    const result = evaluateStaffSensoryReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Build Child Sensory Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildSensoryProfiles", () => {
  it("returns empty array for no assessments", () => {
    const profiles = buildChildSensoryProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups by childId correctly", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex", childName: "Alex" }),
      makeAssessment({ childId: "child-alex", childName: "Alex" }),
      makeAssessment({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    expect(profiles).toHaveLength(2);
  });

  it("assigns correct child names", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex", childName: "Alex" }),
      makeAssessment({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(alex?.childName).toBe("Alex");
    expect(jordan?.childName).toBe("Jordan");
  });

  it("counts assessments per child correctly", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex" }),
      makeAssessment({ childId: "child-alex" }),
      makeAssessment({ childId: "child-alex" }),
      makeAssessment({ childId: "child-jordan" }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.assessmentCount).toBe(3);
  });

  it("calculates effectiveness rate per child", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex", effectivenessLevel: "highly_effective" }),
      makeAssessment({ childId: "child-alex", effectivenessLevel: "effective" }),
      makeAssessment({ childId: "child-alex", effectivenessLevel: "ineffective" }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.effectivenessRate).toBe(67);
  });

  it("calculates child feedback rate per child", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex", childFeedbackPositive: true }),
      makeAssessment({ childId: "child-alex", childFeedbackPositive: false }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.childFeedbackRate).toBe(50);
  });

  it("calculates area diversity per child", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex", sensoryArea: "lighting_adaptation" }),
      makeAssessment({ childId: "child-alex", sensoryArea: "noise_management" }),
      makeAssessment({ childId: "child-alex", sensoryArea: "calm_space" }),
      makeAssessment({ childId: "child-alex", sensoryArea: "lighting_adaptation" }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.areaDiversity).toBe(3);
  });

  it("produces scores between 0 and 10", () => {
    const assessments = [
      makeAssessment({ childId: "child-alex" }),
      makeAssessment({ childId: "child-alex" }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    for (const p of profiles) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("gives frequency points for >=10 assessments", () => {
    const assessments = Array.from({ length: 10 }, () =>
      makeAssessment({
        childId: "child-alex",
        sensoryArea: "lighting_adaptation",
        effectivenessLevel: "ineffective",
        childFeedbackPositive: false,
      }),
    );
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    // frequency=2, effectiveness=0, feedback=0, diversity=0 (1 area < 2)
    expect(alex?.overallScore).toBe(2);
  });

  it("gives frequency points for >=5 assessments", () => {
    const assessments = Array.from({ length: 5 }, () =>
      makeAssessment({
        childId: "child-alex",
        sensoryArea: "lighting_adaptation",
        effectivenessLevel: "ineffective",
        childFeedbackPositive: false,
      }),
    );
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    // frequency=1, effectiveness=0, feedback=0, diversity=0
    expect(alex?.overallScore).toBe(1);
  });

  it("gives diversity points for >=4 unique areas", () => {
    const areas: SensoryArea[] = [
      "lighting_adaptation",
      "noise_management",
      "tactile_provision",
      "visual_supports",
    ];
    const assessments = areas.map((area) =>
      makeAssessment({
        childId: "child-alex",
        sensoryArea: area,
        effectivenessLevel: "ineffective",
        childFeedbackPositive: false,
      }),
    );
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    // frequency=0, effectiveness=0, feedback=0, diversity=2
    expect(alex?.overallScore).toBe(2);
  });

  it("gives diversity 1 point for >=2 areas but <4", () => {
    const assessments = [
      makeAssessment({
        childId: "child-alex",
        sensoryArea: "lighting_adaptation",
        effectivenessLevel: "ineffective",
        childFeedbackPositive: false,
      }),
      makeAssessment({
        childId: "child-alex",
        sensoryArea: "noise_management",
        effectivenessLevel: "ineffective",
        childFeedbackPositive: false,
      }),
    ];
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    // frequency=0, effectiveness=0, feedback=0, diversity=1
    expect(alex?.overallScore).toBe(1);
  });

  it("caps score at 10", () => {
    // Max possible: frequency=2 (10+ assessments), effectiveness=3 (>=80%), feedback=3 (>=80%), diversity=2 (>=4 areas) = 10
    const areas: SensoryArea[] = [
      "lighting_adaptation",
      "noise_management",
      "tactile_provision",
      "visual_supports",
    ];
    const assessments: SensoryAssessment[] = [];
    for (let i = 0; i < 12; i++) {
      assessments.push(
        makeAssessment({
          childId: "child-alex",
          sensoryArea: areas[i % 4],
          effectivenessLevel: "highly_effective",
          childFeedbackPositive: true,
        }),
      );
    }
    const profiles = buildChildSensoryProfiles(assessments);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.overallScore).toBe(10);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Orchestrator: generateSensoryEnvironmentQualityIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSensoryEnvironmentQualityIntelligence", () => {
  const demoAssessments: SensoryAssessment[] = [
    makeAssessment({ childId: "child-alex", childName: "Alex", sensoryArea: "lighting_adaptation" }),
    makeAssessment({ childId: "child-alex", childName: "Alex", sensoryArea: "noise_management" }),
    makeAssessment({ childId: "child-jordan", childName: "Jordan", sensoryArea: "tactile_provision" }),
    makeAssessment({ childId: "child-jordan", childName: "Jordan", sensoryArea: "visual_supports" }),
    makeAssessment({ childId: "child-morgan", childName: "Morgan", sensoryArea: "calm_space" }),
    makeAssessment({ childId: "child-morgan", childName: "Morgan", sensoryArea: "sensory_diet" }),
    makeAssessment({ childId: "child-alex", childName: "Alex", sensoryArea: "proprioceptive_input" }),
    makeAssessment({ childId: "child-jordan", childName: "Jordan", sensoryArea: "vestibular_activity" }),
  ];
  const demoPolicy = makePolicy();
  const demoTraining = [
    makeTraining({ staffName: "Sarah Johnson" }),
    makeTraining({ staffName: "Tom Richards" }),
    makeTraining({ staffName: "Lisa Williams" }),
    makeTraining({ staffName: "Darren Laville" }),
  ];

  const result = generateSensoryEnvironmentQualityIntelligence(
    demoAssessments,
    demoPolicy,
    demoTraining,
    HOME_ID,
    PERIOD_START,
    PERIOD_END,
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("produces overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    const validRatings: Rating[] = [
      "outstanding",
      "good",
      "requires_improvement",
      "inadequate",
    ];
    expect(validRatings).toContain(result.rating);
  });

  it("rating matches score threshold", () => {
    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40)
      expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });

  it("includes sensoryQuality result", () => {
    expect(result.sensoryQuality).toBeDefined();
    expect(result.sensoryQuality.score).toBeGreaterThanOrEqual(0);
    expect(result.sensoryQuality.score).toBeLessThanOrEqual(25);
  });

  it("includes sensoryCompliance result", () => {
    expect(result.sensoryCompliance).toBeDefined();
    expect(result.sensoryCompliance.score).toBeGreaterThanOrEqual(0);
    expect(result.sensoryCompliance.score).toBeLessThanOrEqual(25);
  });

  it("includes sensoryPolicy result", () => {
    expect(result.sensoryPolicy).toBeDefined();
    expect(result.sensoryPolicy.score).toBeGreaterThanOrEqual(0);
    expect(result.sensoryPolicy.score).toBeLessThanOrEqual(25);
  });

  it("includes staffReadiness result", () => {
    expect(result.staffReadiness).toBeDefined();
    expect(result.staffReadiness.score).toBeGreaterThanOrEqual(0);
    expect(result.staffReadiness.score).toBeLessThanOrEqual(25);
  });

  it("overall score equals sum of evaluator scores capped at 100", () => {
    const expected = Math.min(
      100,
      result.sensoryQuality.score +
        result.sensoryCompliance.score +
        result.sensoryPolicy.score +
        result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(expected);
  });

  it("includes child profiles", () => {
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("generates strengths array", () => {
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
  });

  it("includes regulatory links", () => {
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("references CHR 2015 Regulation 6 in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 6")),
    ).toBe(true);
  });

  it("references CHR 2015 Regulation 9 in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 9")),
    ).toBe(true);
  });

  it("references SCCIF in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("SCCIF")),
    ).toBe(true);
  });

  it("references NMS 10 in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("NMS 10")),
    ).toBe(true);
  });

  it("references Equality Act 2010 in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("Equality Act 2010")),
    ).toBe(true);
  });

  it("references NICE sensory processing guidance in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("NICE sensory processing")),
    ).toBe(true);
  });

  it("references Autism Act 2009 in regulatory links", () => {
    expect(
      result.regulatoryLinks.some((l) => l.includes("Autism Act 2009")),
    ).toBe(true);
  });

  // ── Strengths Logic ────────────────────────────────────────────────────

  it("generates strength for high effectiveness rate", () => {
    // All factory defaults have effective effectiveness, all booleans true
    expect(
      result.strengths.some((s) => s.includes("Strong sensory environment effectiveness")),
    ).toBe(true);
  });

  it("generates strength for high child feedback rate", () => {
    expect(
      result.strengths.some((s) => s.includes("Children consistently report positive")),
    ).toBe(true);
  });

  it("generates strength for high OT involvement", () => {
    expect(
      result.strengths.some((s) => s.includes("Good occupational therapy involvement")),
    ).toBe(true);
  });

  it("generates strength for high documented rate", () => {
    expect(
      result.strengths.some((s) => s.includes("Excellent sensory documentation")),
    ).toBe(true);
  });

  // ── Actions Logic ─────────────────────────────────────────────────────

  it("generates action when assessments are empty", () => {
    const emptyResult = generateSensoryEnvironmentQualityIntelligence(
      [],
      demoPolicy,
      demoTraining,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      emptyResult.actions.some((a) => a.includes("No sensory assessment records found")),
    ).toBe(true);
  });

  it("generates URGENT action when policy is null", () => {
    const noPolicyResult = generateSensoryEnvironmentQualityIntelligence(
      demoAssessments,
      null,
      demoTraining,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      noPolicyResult.actions.some((a) => a.startsWith("URGENT") && a.includes("policy")),
    ).toBe(true);
  });

  it("generates URGENT action when training is empty", () => {
    const noTrainingResult = generateSensoryEnvironmentQualityIntelligence(
      demoAssessments,
      demoPolicy,
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      noTrainingResult.actions.some((a) => a.startsWith("URGENT") && a.includes("training")),
    ).toBe(true);
  });

  it("generates action for low review scheduled rate", () => {
    const lowReviewAssessments = [
      makeAssessment({ reviewScheduled: false }),
      makeAssessment({ reviewScheduled: false }),
      makeAssessment({ reviewScheduled: false }),
    ];
    const lowResult = generateSensoryEnvironmentQualityIntelligence(
      lowReviewAssessments,
      demoPolicy,
      demoTraining,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      lowResult.actions.some((a) => a.includes("review scheduling")),
    ).toBe(true);
  });

  it("generates action for low staff implemented rate", () => {
    const lowStaffAssessments = [
      makeAssessment({ staffImplemented: false }),
      makeAssessment({ staffImplemented: false }),
      makeAssessment({ staffImplemented: false }),
    ];
    const lowResult = generateSensoryEnvironmentQualityIntelligence(
      lowStaffAssessments,
      demoPolicy,
      demoTraining,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      lowResult.actions.some((a) => a.includes("staff implementation")),
    ).toBe(true);
  });

  // ── Edge Cases ─────────────────────────────────────────────────────────

  it("handles all empty inputs gracefully", () => {
    const emptyResult = generateSensoryEnvironmentQualityIntelligence(
      [],
      null,
      [],
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(emptyResult.overallScore).toBe(0);
    expect(emptyResult.rating).toBe("inadequate");
    expect(emptyResult.childProfiles).toHaveLength(0);
  });

  it("does not generate low review action when no assessments", () => {
    const emptyResult = generateSensoryEnvironmentQualityIntelligence(
      [],
      demoPolicy,
      demoTraining,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      emptyResult.actions.some((a) => a.includes("review scheduling")),
    ).toBe(false);
  });

  it("does not generate low staff implementation action when no assessments", () => {
    const emptyResult = generateSensoryEnvironmentQualityIntelligence(
      [],
      demoPolicy,
      demoTraining,
      HOME_ID,
      PERIOD_START,
      PERIOD_END,
    );
    expect(
      emptyResult.actions.some((a) => a.includes("staff implementation")),
    ).toBe(false);
  });
});
