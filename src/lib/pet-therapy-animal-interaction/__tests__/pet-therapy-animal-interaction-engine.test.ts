// ==============================================================================
// Tests — Pet Therapy & Animal Interaction Intelligence Engine
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateSessionQuality,
  evaluateAnimalWelfare,
  evaluateRiskManagement,
  evaluateStaffAnimalReadiness,
  buildChildAnimalProfiles,
  generatePetTherapyAnimalInteractionIntelligence,
  pct,
  getRating,
  getAnimalTypeLabel,
  getSessionTypeLabel,
  getTherapeuticBenefitLabel,
  getWelfareStatusLabel,
  getRatingLabel,
} from "../pet-therapy-animal-interaction-engine";
import type {
  AnimalSession,
  AnimalWelfareCheck,
  AnimalRiskAssessment,
  StaffAnimalTraining,
} from "../pet-therapy-animal-interaction-engine";

// -- Factories ----------------------------------------------------------------

function makeSession(overrides: Partial<AnimalSession> = {}): AnimalSession {
  return {
    id: "as-1",
    childId: "child-1",
    childName: "Alex",
    sessionDate: "2026-03-01",
    animalType: "dog",
    sessionType: "structured_therapy",
    facilitatedBy: "Sarah Johnson",
    therapeuticBenefit: "significant",
    childEngaged: true,
    riskAssessmentCompleted: true,
    supervisedThroughout: true,
    hygieneProtocolFollowed: true,
    ...overrides,
  };
}

function makeWelfareCheck(overrides: Partial<AnimalWelfareCheck> = {}): AnimalWelfareCheck {
  return {
    id: "aw-1",
    animalType: "dog",
    animalName: "Buddy",
    checkDate: "2026-04-01",
    checkedBy: "Tom Richards",
    welfareStatus: "excellent",
    veterinaryUpToDate: true,
    vaccinationsCurrentt: true,
    livingConditionsAdequate: true,
    dietAppropriate: true,
    exerciseProvided: true,
    ...overrides,
  };
}

function makeRiskAssessment(overrides: Partial<AnimalRiskAssessment> = {}): AnimalRiskAssessment {
  return {
    id: "ar-1",
    assessmentDate: "2026-01-15",
    assessedBy: "Darren Laville",
    allergyScreeningCompleted: true,
    zoonoticRiskAssessed: true,
    biteRiskAssessed: true,
    hygieneProtocolInPlace: true,
    insuranceCurrent: true,
    emergencyPlanInPlace: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffAnimalTraining> = {}): StaffAnimalTraining {
  return {
    id: "at-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    animalHandling: true,
    therapeuticAnimalUse: true,
    animalWelfare: true,
    riskAssessment: true,
    hygieneProtocols: true,
    allergyAwareness: true,
    ...overrides,
  };
}

// =============================================================================
// pct helper
// =============================================================================

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates correct percentage", () => {
    expect(pct(3, 4)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("returns 100 for equal values", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 0 for numerator 0", () => {
    expect(pct(0, 10)).toBe(0);
  });
});

// =============================================================================
// getRating
// =============================================================================

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
  });
});

// =============================================================================
// Label getters
// =============================================================================

describe("getAnimalTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getAnimalTypeLabel("dog")).toBe("Dog");
    expect(getAnimalTypeLabel("cat")).toBe("Cat");
    expect(getAnimalTypeLabel("horse")).toBe("Horse");
    expect(getAnimalTypeLabel("rabbit")).toBe("Rabbit");
    expect(getAnimalTypeLabel("guinea_pig")).toBe("Guinea Pig");
    expect(getAnimalTypeLabel("fish")).toBe("Fish");
    expect(getAnimalTypeLabel("bird")).toBe("Bird");
    expect(getAnimalTypeLabel("farm_animal")).toBe("Farm Animal");
    expect(getAnimalTypeLabel("other")).toBe("Other");
  });
});

describe("getSessionTypeLabel", () => {
  it("returns correct labels", () => {
    expect(getSessionTypeLabel("structured_therapy")).toBe("Structured Therapy");
    expect(getSessionTypeLabel("informal_interaction")).toBe("Informal Interaction");
    expect(getSessionTypeLabel("equine_therapy")).toBe("Equine Therapy");
    expect(getSessionTypeLabel("animal_assisted_learning")).toBe("Animal Assisted Learning");
    expect(getSessionTypeLabel("care_responsibility")).toBe("Care Responsibility");
    expect(getSessionTypeLabel("visiting_animal")).toBe("Visiting Animal");
    expect(getSessionTypeLabel("other")).toBe("Other");
  });
});

describe("getTherapeuticBenefitLabel", () => {
  it("returns correct labels", () => {
    expect(getTherapeuticBenefitLabel("significant")).toBe("Significant");
    expect(getTherapeuticBenefitLabel("moderate")).toBe("Moderate");
    expect(getTherapeuticBenefitLabel("some")).toBe("Some");
    expect(getTherapeuticBenefitLabel("minimal")).toBe("Minimal");
    expect(getTherapeuticBenefitLabel("not_assessed")).toBe("Not Assessed");
  });
});

describe("getWelfareStatusLabel", () => {
  it("returns correct labels", () => {
    expect(getWelfareStatusLabel("excellent")).toBe("Excellent");
    expect(getWelfareStatusLabel("good")).toBe("Good");
    expect(getWelfareStatusLabel("adequate")).toBe("Adequate");
    expect(getWelfareStatusLabel("poor")).toBe("Poor");
    expect(getWelfareStatusLabel("concern_raised")).toBe("Concern Raised");
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

// =============================================================================
// evaluateSessionQuality
// =============================================================================

describe("evaluateSessionQuality", () => {
  it("returns all zeros for empty sessions", () => {
    const result = evaluateSessionQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.therapeuticBenefitRate).toBe(0);
    expect(result.childEngagementRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.supervisionRate).toBe(0);
    expect(result.hygieneRate).toBe(0);
  });

  it("gives maximum score for all-perfect sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const result = evaluateSessionQuality(sessions);
    // therapeuticBenefit=100% → 7, engagement=100% → 6, riskAssessment=100% → 6, combined safety=100% → 6 = 25
    expect(result.overallScore).toBe(25);
    expect(result.totalSessions).toBe(10);
    expect(result.therapeuticBenefitRate).toBe(100);
    expect(result.childEngagementRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
    expect(result.supervisionRate).toBe(100);
    expect(result.hygieneRate).toBe(100);
  });

  it("gives 1 point for very low therapeutic benefit rate", () => {
    // 1 of 10 sessions beneficial → 10% → score 1
    const sessions = [
      makeSession({ id: "as-1", therapeuticBenefit: "significant" }),
      ...Array.from({ length: 9 }, (_, i) =>
        makeSession({ id: `as-${i + 2}`, therapeuticBenefit: "minimal" }),
      ),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.therapeuticBenefitRate).toBe(10);
    // score: 1 (benefit) + 6 (engagement) + 6 (risk) + 6 (safety) = 19
    expect(result.overallScore).toBe(19);
  });

  it("scores therapeutic benefit at tier boundaries", () => {
    // 40% beneficial → score 3 for that dimension
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: i < 4 ? "significant" : "minimal",
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.therapeuticBenefitRate).toBe(40);
    // 3 + 6 + 6 + 6 = 21
    expect(result.overallScore).toBe(21);
  });

  it("scores therapeutic benefit 60% tier → 5 points", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: i < 6 ? "moderate" : "minimal",
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.therapeuticBenefitRate).toBe(60);
    // 5 + 6 + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("counts moderate as therapeutic benefit positive", () => {
    const sessions = [makeSession({ therapeuticBenefit: "moderate" })];
    const result = evaluateSessionQuality(sessions);
    expect(result.therapeuticBenefitRate).toBe(100);
  });

  it("excludes some/minimal/not_assessed from therapeutic benefit", () => {
    const sessions = [
      makeSession({ id: "as-1", therapeuticBenefit: "some" }),
      makeSession({ id: "as-2", therapeuticBenefit: "minimal" }),
      makeSession({ id: "as-3", therapeuticBenefit: "not_assessed" }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.therapeuticBenefitRate).toBe(0);
  });

  it("scores child engagement at tier boundaries", () => {
    // 70% engaged → 4 points
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        childEngaged: i < 7,
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.childEngagementRate).toBe(70);
    // 7 (benefit 100%) + 4 (engagement 70%) + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores child engagement 50% → 3 points", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}`, childEngaged: i < 5 }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.childEngagementRate).toBe(50);
    // 7 + 3 + 6 + 6 = 22
    expect(result.overallScore).toBe(22);
  });

  it("scores child engagement low → 1 point", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}`, childEngaged: i < 1 }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.childEngagementRate).toBe(10);
    // 7 + 1 + 6 + 6 = 20
    expect(result.overallScore).toBe(20);
  });

  it("scores risk assessment at tier boundaries", () => {
    // 50% assessed → 3 points
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}`, riskAssessmentCompleted: i < 5 }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.riskAssessmentRate).toBe(50);
    // 7 + 6 + 3 + 6 = 22
    expect(result.overallScore).toBe(22);
  });

  it("handles combined safety rate calculation", () => {
    // 50% supervision + 50% hygiene → combined 50% → 3 pts
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        supervisedThroughout: i < 5,
        hygieneProtocolFollowed: i < 5,
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.supervisionRate).toBe(50);
    expect(result.hygieneRate).toBe(50);
    // 7 + 6 + 6 + 3 = 22
    expect(result.overallScore).toBe(22);
  });

  it("handles mixed supervision and hygiene", () => {
    // supervision 100%, hygiene 0% → combined 50% → 3
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        supervisedThroughout: true,
        hygieneProtocolFollowed: false,
      }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.supervisionRate).toBe(100);
    expect(result.hygieneRate).toBe(0);
    // combined = (100 + 0) / 2 = 50 → 3
    // 7 + 6 + 6 + 3 = 22
    expect(result.overallScore).toBe(22);
  });

  it("scores all dimensions at zero engagement", () => {
    const sessions = [
      makeSession({
        childEngaged: false,
        riskAssessmentCompleted: false,
        supervisedThroughout: false,
        hygieneProtocolFollowed: false,
        therapeuticBenefit: "minimal",
      }),
    ];
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBe(0);
    expect(result.childEngagementRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.supervisionRate).toBe(0);
    expect(result.hygieneRate).toBe(0);
    expect(result.therapeuticBenefitRate).toBe(0);
  });

  it("caps score at 25", () => {
    // With perfect data, score should be exactly 25, not more
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const result = evaluateSessionQuality(sessions);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluateAnimalWelfare
// =============================================================================

describe("evaluateAnimalWelfare", () => {
  it("returns all zeros for empty checks", () => {
    const result = evaluateAnimalWelfare([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalChecks).toBe(0);
    expect(result.welfareGoodRate).toBe(0);
    expect(result.veterinaryRate).toBe(0);
    expect(result.vaccinationRate).toBe(0);
    expect(result.livingConditionsRate).toBe(0);
  });

  it("gives maximum score for all-perfect checks", () => {
    const checks = Array.from({ length: 5 }, (_, i) =>
      makeWelfareCheck({ id: `aw-${i}` }),
    );
    const result = evaluateAnimalWelfare(checks);
    // 7 + 6 + 6 + 6 = 25
    expect(result.overallScore).toBe(25);
    expect(result.totalChecks).toBe(5);
    expect(result.welfareGoodRate).toBe(100);
    expect(result.veterinaryRate).toBe(100);
    expect(result.vaccinationRate).toBe(100);
    expect(result.livingConditionsRate).toBe(100);
  });

  it("counts excellent + good as welfare good rate", () => {
    const checks = [
      makeWelfareCheck({ id: "aw-1", welfareStatus: "excellent" }),
      makeWelfareCheck({ id: "aw-2", welfareStatus: "good" }),
    ];
    const result = evaluateAnimalWelfare(checks);
    expect(result.welfareGoodRate).toBe(100);
  });

  it("excludes adequate/poor/concern_raised from welfare good rate", () => {
    const checks = [
      makeWelfareCheck({ id: "aw-1", welfareStatus: "adequate" }),
      makeWelfareCheck({ id: "aw-2", welfareStatus: "poor" }),
      makeWelfareCheck({ id: "aw-3", welfareStatus: "concern_raised" }),
    ];
    const result = evaluateAnimalWelfare(checks);
    expect(result.welfareGoodRate).toBe(0);
  });

  it("scores welfare good rate at 70% → 5 points", () => {
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({
        id: `aw-${i}`,
        welfareStatus: i < 7 ? "good" : "adequate",
      }),
    );
    const result = evaluateAnimalWelfare(checks);
    expect(result.welfareGoodRate).toBe(70);
    // 5 + 6 + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores welfare good rate at 50% → 3 points", () => {
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({
        id: `aw-${i}`,
        welfareStatus: i < 5 ? "good" : "poor",
      }),
    );
    const result = evaluateAnimalWelfare(checks);
    expect(result.welfareGoodRate).toBe(50);
    // 3 + 6 + 6 + 6 = 21
    expect(result.overallScore).toBe(21);
  });

  it("scores welfare good rate low → 1 point", () => {
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({
        id: `aw-${i}`,
        welfareStatus: i < 1 ? "good" : "poor",
      }),
    );
    const result = evaluateAnimalWelfare(checks);
    expect(result.welfareGoodRate).toBe(10);
    // 1 + 6 + 6 + 6 = 19
    expect(result.overallScore).toBe(19);
  });

  it("scores veterinary at tier boundaries", () => {
    // 70% vet → 4 points
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({ id: `aw-${i}`, veterinaryUpToDate: i < 7 }),
    );
    const result = evaluateAnimalWelfare(checks);
    expect(result.veterinaryRate).toBe(70);
    // 7 + 4 + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("uses vaccinationsCurrentt field (double t typo)", () => {
    const checks = [
      makeWelfareCheck({ id: "aw-1", vaccinationsCurrentt: true }),
      makeWelfareCheck({ id: "aw-2", vaccinationsCurrentt: false }),
    ];
    const result = evaluateAnimalWelfare(checks);
    expect(result.vaccinationRate).toBe(50);
  });

  it("scores living conditions at tier boundaries", () => {
    // 50% → 3 points
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({ id: `aw-${i}`, livingConditionsAdequate: i < 5 }),
    );
    const result = evaluateAnimalWelfare(checks);
    expect(result.livingConditionsRate).toBe(50);
  });

  it("scores all zeros when everything fails", () => {
    const checks = [
      makeWelfareCheck({
        welfareStatus: "poor",
        veterinaryUpToDate: false,
        vaccinationsCurrentt: false,
        livingConditionsAdequate: false,
      }),
    ];
    const result = evaluateAnimalWelfare(checks);
    expect(result.welfareGoodRate).toBe(0);
    expect(result.veterinaryRate).toBe(0);
    expect(result.vaccinationRate).toBe(0);
    expect(result.livingConditionsRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const checks = Array.from({ length: 50 }, (_, i) =>
      makeWelfareCheck({ id: `aw-${i}` }),
    );
    const result = evaluateAnimalWelfare(checks);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluateRiskManagement
// =============================================================================

describe("evaluateRiskManagement", () => {
  it("returns all zeros for empty assessments", () => {
    const result = evaluateRiskManagement([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.allergyScreeningRate).toBe(0);
    expect(result.zoonoticRiskRate).toBe(0);
    expect(result.hygieneProtocolRate).toBe(0);
    expect(result.insuranceRate).toBe(0);
    expect(result.emergencyPlanRate).toBe(0);
  });

  it("gives maximum score for all-perfect assessments", () => {
    const assessments = Array.from({ length: 5 }, (_, i) =>
      makeRiskAssessment({ id: `ar-${i}` }),
    );
    const result = evaluateRiskManagement(assessments);
    // 7 + 6 + 6 + 6 = 25
    expect(result.overallScore).toBe(25);
    expect(result.totalAssessments).toBe(5);
    expect(result.allergyScreeningRate).toBe(100);
    expect(result.zoonoticRiskRate).toBe(100);
    expect(result.hygieneProtocolRate).toBe(100);
    expect(result.insuranceRate).toBe(100);
    expect(result.emergencyPlanRate).toBe(100);
  });

  it("scores allergy screening at tier boundaries", () => {
    // 70% → 5 points
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        allergyScreeningCompleted: i < 7,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.allergyScreeningRate).toBe(70);
    // 5 + 6 + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores allergy screening at 50% → 3 points", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        allergyScreeningCompleted: i < 5,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.allergyScreeningRate).toBe(50);
    // 3 + 6 + 6 + 6 = 21
    expect(result.overallScore).toBe(21);
  });

  it("scores allergy screening low → 1 point", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        allergyScreeningCompleted: i < 1,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.allergyScreeningRate).toBe(10);
    // 1 + 6 + 6 + 6 = 19
    expect(result.overallScore).toBe(19);
  });

  it("scores zoonotic risk at tier boundaries", () => {
    // 50% → 3 points
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        zoonoticRiskAssessed: i < 5,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.zoonoticRiskRate).toBe(50);
  });

  it("scores zoonotic risk at 70% → 4 points", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        zoonoticRiskAssessed: i < 7,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.zoonoticRiskRate).toBe(70);
    // 7 + 4 + 6 + 6 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores hygiene protocol at tier boundaries", () => {
    // 70% → 4 points
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        hygieneProtocolInPlace: i < 7,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.hygieneProtocolRate).toBe(70);
  });

  it("handles combined insurance + emergency plan scoring", () => {
    // insurance 100%, emergency 0% → combined 50% → 3 pts
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        insuranceCurrent: true,
        emergencyPlanInPlace: false,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.insuranceRate).toBe(100);
    expect(result.emergencyPlanRate).toBe(0);
    // combined = 50% → 3, total: 7 + 6 + 6 + 3 = 22
    expect(result.overallScore).toBe(22);
  });

  it("handles combined insurance + emergency at 70% each → 4 pts", () => {
    const assessments = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        insuranceCurrent: i < 7,
        emergencyPlanInPlace: i < 7,
      }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.insuranceRate).toBe(70);
    expect(result.emergencyPlanRate).toBe(70);
    // combined = 70% → 4
    // 7 + 6 + 6 + 4 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores all zeros when everything fails", () => {
    const assessments = [
      makeRiskAssessment({
        allergyScreeningCompleted: false,
        zoonoticRiskAssessed: false,
        hygieneProtocolInPlace: false,
        insuranceCurrent: false,
        emergencyPlanInPlace: false,
      }),
    ];
    const result = evaluateRiskManagement(assessments);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 50 }, (_, i) =>
      makeRiskAssessment({ id: `ar-${i}` }),
    );
    const result = evaluateRiskManagement(assessments);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// evaluateStaffAnimalReadiness
// =============================================================================

describe("evaluateStaffAnimalReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffAnimalReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.animalHandlingRate).toBe(0);
    expect(result.therapeuticUseRate).toBe(0);
    expect(result.animalWelfareRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.hygieneRate).toBe(0);
    expect(result.allergyRate).toBe(0);
  });

  it("gives maximum score for all-perfect training", () => {
    const training = Array.from({ length: 5 }, (_, i) =>
      makeTraining({ id: `at-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    // 6 + 5 + 5 + 4 + 3 + 2 = 25
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(5);
    expect(result.animalHandlingRate).toBe(100);
    expect(result.therapeuticUseRate).toBe(100);
    expect(result.animalWelfareRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
    expect(result.hygieneRate).toBe(100);
    expect(result.allergyRate).toBe(100);
  });

  it("scores animal handling at tier boundaries", () => {
    // 70% → 4 points
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        animalHandling: i < 7,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.animalHandlingRate).toBe(70);
    // 4 + 5 + 5 + 4 + 3 + 2 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores animal handling at 50% → 3 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        animalHandling: i < 5,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.animalHandlingRate).toBe(50);
  });

  it("scores animal handling low → 1 point", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        animalHandling: i < 1,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.animalHandlingRate).toBe(10);
  });

  it("scores therapeutic use at 70% → 3 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        therapeuticAnimalUse: i < 7,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.therapeuticUseRate).toBe(70);
    // 6 + 3 + 5 + 4 + 3 + 2 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores therapeutic use at 50% → 2 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        therapeuticAnimalUse: i < 5,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.therapeuticUseRate).toBe(50);
  });

  it("scores animal welfare awareness at 70% → 3 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        animalWelfare: i < 7,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.animalWelfareRate).toBe(70);
  });

  it("scores risk assessment at 70% → 3 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        riskAssessment: i < 7,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.riskAssessmentRate).toBe(70);
    // 6 + 5 + 5 + 3 + 3 + 2 = 24
    expect(result.overallScore).toBe(24);
  });

  it("scores hygiene at 70% → 2 points", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        hygieneProtocols: i < 7,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.hygieneRate).toBe(70);
    // 6 + 5 + 5 + 4 + 2 + 2 = 24
    expect(result.overallScore).toBe(24);
  });

  it("scores hygiene at 50% → 1 point", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        hygieneProtocols: i < 5,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.hygieneRate).toBe(50);
    // 6 + 5 + 5 + 4 + 1 + 2 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores hygiene at low → 0 points (no tier below 50)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        hygieneProtocols: i < 1,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.hygieneRate).toBe(10);
    // 6 + 5 + 5 + 4 + 0 + 2 = 22
    expect(result.overallScore).toBe(22);
  });

  it("scores allergy at 70% → 1 point", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        allergyAwareness: i < 7,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.allergyRate).toBe(70);
    // 6 + 5 + 5 + 4 + 3 + 1 = 24
    expect(result.overallScore).toBe(24);
  });

  it("scores allergy low → 0 points (no tier below 70)", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        allergyAwareness: i < 5,
      }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.allergyRate).toBe(50);
    // 6 + 5 + 5 + 4 + 3 + 0 = 23
    expect(result.overallScore).toBe(23);
  });

  it("scores all zeros when nobody trained", () => {
    const training = [
      makeTraining({
        animalHandling: false,
        therapeuticAnimalUse: false,
        animalWelfare: false,
        riskAssessment: false,
        hygieneProtocols: false,
        allergyAwareness: false,
      }),
    ];
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `at-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffAnimalReadiness(training);
    expect(result.overallScore).toBe(25);
  });
});

// =============================================================================
// buildChildAnimalProfiles
// =============================================================================

describe("buildChildAnimalProfiles", () => {
  it("returns empty array for no sessions", () => {
    const profiles = buildChildAnimalProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("builds a single child profile correctly", () => {
    const sessions = [
      makeSession({ id: "as-1", childId: "child-1", childName: "Alex" }),
      makeSession({ id: "as-2", childId: "child-1", childName: "Alex" }),
    ];
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-1");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].totalSessions).toBe(2);
    expect(profiles[0].engagementRate).toBe(100);
    expect(profiles[0].therapeuticBenefitPositive).toBe(true);
  });

  it("groups sessions by childId", () => {
    const sessions = [
      makeSession({ id: "as-1", childId: "child-1", childName: "Alex" }),
      makeSession({ id: "as-2", childId: "child-2", childName: "Jordan" }),
      makeSession({ id: "as-3", childId: "child-1", childName: "Alex" }),
    ];
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].totalSessions).toBe(2);
    expect(profiles[1].totalSessions).toBe(1);
  });

  it("scores sessions attended: 1 session → 1 point", () => {
    const sessions = [makeSession({ id: "as-1" })];
    const profiles = buildChildAnimalProfiles(sessions);
    // 1 session → 1, benefit 100% → 3, engagement 100% → 2, safety 100% → 2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores sessions attended: 3 sessions → 2 points", () => {
    const sessions = Array.from({ length: 3 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const profiles = buildChildAnimalProfiles(sessions);
    // 3 sessions → 2, benefit 100% → 3, engagement 100% → 2, safety 100% → 2 = 9
    expect(profiles[0].overallScore).toBe(9);
  });

  it("scores sessions attended: 5+ sessions → 3 points", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const profiles = buildChildAnimalProfiles(sessions);
    // 5 sessions → 3, benefit 100% → 3, engagement 100% → 2, safety 100% → 2 = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores therapeutic benefit: 80%+ → 3 points", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: i < 4 ? "significant" : "minimal",
      }),
    );
    // 80% beneficial → 3
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].therapeuticBenefitPositive).toBe(true);
    // 3 + 3 + 2 + 2 = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores therapeutic benefit: 50%-79% → 2 points", () => {
    const sessions = Array.from({ length: 4 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: i < 2 ? "moderate" : "minimal",
      }),
    );
    // 50% beneficial → 2
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].therapeuticBenefitPositive).toBe(true);
    // 2 (3 sessions) + 2 (benefit) + 2 (engagement) + 2 (safety) = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores therapeutic benefit: < 50% → 1 point, benefitPositive false", () => {
    const sessions = Array.from({ length: 4 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: i < 1 ? "moderate" : "minimal",
      }),
    );
    // 25% beneficial → 1 point
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].therapeuticBenefitPositive).toBe(false);
    // 2 + 1 + 2 + 2 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores therapeutic benefit: 0% → 0 points", () => {
    const sessions = Array.from({ length: 3 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: "minimal",
      }),
    );
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].therapeuticBenefitPositive).toBe(false);
    // 2 + 0 + 2 + 2 = 6
    expect(profiles[0].overallScore).toBe(6);
  });

  it("scores engagement: 80%+ → 2 points", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `as-${i}`, childEngaged: i < 4 }),
    );
    // 80% → 2
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].engagementRate).toBe(80);
    // 3 + 3 + 2 + 2 = 10
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores engagement: 50%-79% → 1 point", () => {
    const sessions = Array.from({ length: 4 }, (_, i) =>
      makeSession({ id: `as-${i}`, childEngaged: i < 2 }),
    );
    // 50% → 1
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].engagementRate).toBe(50);
    // 2 + 3 + 1 + 2 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("scores engagement: < 50% → 0 points", () => {
    const sessions = Array.from({ length: 4 }, (_, i) =>
      makeSession({ id: `as-${i}`, childEngaged: i < 1 }),
    );
    // 25% → 0
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].engagementRate).toBe(25);
    // 2 + 3 + 0 + 2 = 7
    expect(profiles[0].overallScore).toBe(7);
  });

  it("scores safety: 90%+ all three → 2 points", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const profiles = buildChildAnimalProfiles(sessions);
    // safety 100% → 2
    expect(profiles[0].overallScore).toBe(10);
  });

  it("scores safety: 50%-89% → 1 point", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        riskAssessmentCompleted: i < 6,
        supervisedThroughout: true,
        hygieneProtocolFollowed: true,
      }),
    );
    // Only 6 of 10 have all three → 60% safe → 1 point
    const profiles = buildChildAnimalProfiles(sessions);
    // 3 (10 sessions ≥ 5) + 3 (benefit) + 2 (engagement) + 1 (safety) = 9
    expect(profiles[0].overallScore).toBe(9);
  });

  it("scores safety: < 50% → 0 points", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        riskAssessmentCompleted: i < 4,
        supervisedThroughout: true,
        hygieneProtocolFollowed: true,
      }),
    );
    // 4 of 10 safe → 40% → 0
    const profiles = buildChildAnimalProfiles(sessions);
    // 3 + 3 + 2 + 0 = 8
    expect(profiles[0].overallScore).toBe(8);
  });

  it("caps profile score at 10", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const profiles = buildChildAnimalProfiles(sessions);
    expect(profiles[0].overallScore).toBe(10);
  });

  it("clamps profile score minimum at 0", () => {
    // Even with minimal data, score stays at 0+
    const sessions = [
      makeSession({
        therapeuticBenefit: "minimal",
        childEngaged: false,
        riskAssessmentCompleted: false,
        supervisedThroughout: false,
        hygieneProtocolFollowed: false,
      }),
    ];
    const profiles = buildChildAnimalProfiles(sessions);
    // 1 session → 1, benefit 0% → 0, engagement 0% → 0, safety 0% → 0 = 1
    expect(profiles[0].overallScore).toBe(1);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// =============================================================================
// generatePetTherapyAnimalInteractionIntelligence
// =============================================================================

describe("generatePetTherapyAnimalInteractionIntelligence", () => {
  it("returns correct structure with all empty inputs", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "test-home", "2026-01-01", "2026-06-01",
    );
    expect(result.homeId).toBe("test-home");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-06-01");
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.sessionQuality.overallScore).toBe(0);
    expect(result.animalWelfare.overallScore).toBe(0);
    expect(result.riskManagement.overallScore).toBe(0);
    expect(result.staffAnimalReadiness.overallScore).toBe(0);
    expect(result.childProfiles).toEqual([]);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("sums all four evaluator scores", () => {
    const sessions = [makeSession()];
    const checks = [makeWelfareCheck()];
    const risks = [makeRiskAssessment()];
    const training = [makeTraining()];

    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, checks, risks, training, "oak-house", "2026-01-01", "2026-06-01",
    );

    const expected =
      result.sessionQuality.overallScore +
      result.animalWelfare.overallScore +
      result.riskManagement.overallScore +
      result.staffAnimalReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(expected, 100));
  });

  it("caps overall score at 100", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => makeSession({ id: `as-${i}` }));
    const checks = Array.from({ length: 10 }, (_, i) => makeWelfareCheck({ id: `aw-${i}` }));
    const risks = Array.from({ length: 10 }, (_, i) => makeRiskAssessment({ id: `ar-${i}` }));
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `at-${i}`, staffId: `staff-${i}` }),
    );

    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, checks, risks, training, "oak-house", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("assigns correct rating based on total score", () => {
    // All zeros → 0 → inadequate
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.rating).toBe("inadequate");
  });

  it("builds child profiles from sessions", () => {
    const sessions = [
      makeSession({ id: "as-1", childId: "child-1", childName: "Alex" }),
      makeSession({ id: "as-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles[0].childName).toBe("Alex");
    expect(result.childProfiles[1].childName).toBe("Jordan");
  });

  // -- Strengths ---------------------------------------------------------------

  it("adds therapeutic benefit strength when rate >= 80%", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Strong therapeutic benefit from animal-assisted sessions — children benefiting significantly",
    );
  });

  it("does NOT add therapeutic benefit strength with empty sessions", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).not.toContain(
      "Strong therapeutic benefit from animal-assisted sessions — children benefiting significantly",
    );
  });

  it("adds child engagement strength when rate >= 90%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Excellent child engagement with animal therapy sessions",
    );
  });

  it("adds welfare strength when welfareGoodRate >= 90%", () => {
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({ id: `aw-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], checks, [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Animal welfare standards consistently excellent or good",
    );
  });

  it("adds veterinary strength when rate >= 90%", () => {
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({ id: `aw-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], checks, [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Veterinary care consistently up to date for all animals",
    );
  });

  it("adds allergy screening strength when rate >= 90%", () => {
    const risks = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({ id: `ar-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], risks, [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Comprehensive allergy screening completed for all animal interactions",
    );
  });

  it("adds staff handling strength when rate >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `at-${i}`, staffId: `staff-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], training, "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Staff team fully trained in safe animal handling",
    );
  });

  it("adds therapeutic use staff strength when rate >= 90%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `at-${i}`, staffId: `staff-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], training, "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Staff team trained in therapeutic animal-assisted interventions",
    );
  });

  it("adds risk assessment completion strength when rate >= 90%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({ id: `as-${i}` }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toContain(
      "Risk assessments consistently completed before animal sessions",
    );
  });

  // -- Areas for improvement ---------------------------------------------------

  it("adds therapeutic benefit area when rate < 60%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        therapeuticBenefit: i < 5 ? "significant" : "minimal",
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Therapeutic benefit from animal sessions below expected standard — review session structure",
    );
  });

  it("does NOT add therapeutic benefit area when empty sessions", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).not.toContain(
      "Therapeutic benefit from animal sessions below expected standard — review session structure",
    );
  });

  it("adds risk assessment area when rate < 70%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        riskAssessmentCompleted: i < 6,
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Risk assessments not consistently completed before animal sessions",
    );
  });

  it("adds welfare area when welfareGoodRate < 70%", () => {
    const checks = Array.from({ length: 10 }, (_, i) =>
      makeWelfareCheck({
        id: `aw-${i}`,
        welfareStatus: i < 6 ? "good" : "poor",
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], checks, [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Animal welfare standards below expected level — review animal care practices",
    );
  });

  it("adds hygiene protocol area when rate < 70%", () => {
    const risks = Array.from({ length: 10 }, (_, i) =>
      makeRiskAssessment({
        id: `ar-${i}`,
        hygieneProtocolInPlace: i < 6,
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], risks, [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Hygiene protocols not consistently in place for animal interactions",
    );
  });

  it("adds therapeutic use training area when rate < 70%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        therapeuticAnimalUse: i < 6,
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], training, "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Staff training in therapeutic animal use needs strengthening",
    );
  });

  it("adds allergy awareness training area when rate < 70%", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `at-${i}`,
        staffId: `staff-${i}`,
        allergyAwareness: i < 6,
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], training, "home", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement).toContain(
      "Staff allergy awareness training needs improvement",
    );
  });

  // -- Actions -----------------------------------------------------------------

  it("adds no-sessions action when sessions empty", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "No animal interaction sessions recorded — consider implementing animal-assisted therapy programme",
    );
  });

  it("adds URGENT welfare action when checks empty but sessions exist", () => {
    const sessions = [makeSession()];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: No animal welfare checks recorded — implement welfare monitoring immediately",
    );
  });

  it("does NOT add welfare action when sessions also empty", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).not.toContain(
      "URGENT: No animal welfare checks recorded — implement welfare monitoring immediately",
    );
  });

  it("adds URGENT risk action when assessments empty but sessions exist", () => {
    const sessions = [makeSession()];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: No risk assessments recorded — complete before any further animal interactions",
    );
  });

  it("adds URGENT training action when training empty", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: No staff animal handling training records — deliver training before animal interactions continue",
    );
  });

  it("adds URGENT welfare concern action for poor/concern_raised checks", () => {
    const checks = [
      makeWelfareCheck({ id: "aw-1", welfareStatus: "poor" }),
      makeWelfareCheck({ id: "aw-2", welfareStatus: "concern_raised" }),
    ];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], checks, [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: 2 animal welfare concern(s) identified — review animal care arrangements immediately",
    );
  });

  it("counts only poor and concern_raised in welfare concerns", () => {
    const checks = [
      makeWelfareCheck({ id: "aw-1", welfareStatus: "poor" }),
      makeWelfareCheck({ id: "aw-2", welfareStatus: "adequate" }),
      makeWelfareCheck({ id: "aw-3", welfareStatus: "good" }),
    ];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], checks, [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "URGENT: 1 animal welfare concern(s) identified — review animal care arrangements immediately",
    );
  });

  it("adds insurance action when rate < 100%", () => {
    const risks = [
      makeRiskAssessment({ id: "ar-1", insuranceCurrent: true }),
      makeRiskAssessment({ id: "ar-2", insuranceCurrent: false }),
    ];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], risks, [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "Ensure insurance cover is current for all animal interactions",
    );
  });

  it("does NOT add insurance action when rate = 100%", () => {
    const risks = [makeRiskAssessment()];
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], risks, [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).not.toContain(
      "Ensure insurance cover is current for all animal interactions",
    );
  });

  it("adds hygiene action when session hygiene rate < 70%", () => {
    const sessions = Array.from({ length: 10 }, (_, i) =>
      makeSession({
        id: `as-${i}`,
        hygieneProtocolFollowed: i < 6,
      }),
    );
    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.actions).toContain(
      "Improve hygiene protocol compliance during animal sessions",
    );
  });

  // -- Regulatory links -------------------------------------------------------

  it("always includes all 7 regulatory links", () => {
    const result = generatePetTherapyAnimalInteractionIntelligence(
      [], [], [], [], "home", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 10 — The health and wellbeing standard");
    expect(result.regulatoryLinks).toContain("CHR 2015 Reg 12 — The positive relationships standard");
    expect(result.regulatoryLinks).toContain("SCCIF — Social Care Common Inspection Framework (therapeutic provision)");
    expect(result.regulatoryLinks).toContain("Animal Welfare Act 2006 — Duty of care to animals");
    expect(result.regulatoryLinks).toContain("NMS 3 — National Minimum Standards (positive behaviour and therapeutic care)");
    expect(result.regulatoryLinks).toContain("Health and Safety at Work Act 1974 — Risk assessment and safe practices");
    expect(result.regulatoryLinks).toContain("NICE CG170 — Autism spectrum disorder in children (animal-assisted therapy evidence)");
  });

  // -- Full Chamberlain House demo scenario -------------------------------------------

  it("scores Chamberlain House demo data correctly", () => {
    const sessions: AnimalSession[] = [
      makeSession({ id: "as-1", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-01", animalType: "dog", sessionType: "structured_therapy", facilitatedBy: "Sarah Johnson", therapeuticBenefit: "significant" }),
      makeSession({ id: "as-2", childId: "child-alex", childName: "Alex", sessionDate: "2026-03-15", animalType: "dog", sessionType: "informal_interaction", facilitatedBy: "Tom Richards", therapeuticBenefit: "moderate" }),
      makeSession({ id: "as-3", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-03-05", animalType: "horse", sessionType: "equine_therapy", facilitatedBy: "Lisa Williams", therapeuticBenefit: "significant" }),
      makeSession({ id: "as-4", childId: "child-jordan", childName: "Jordan", sessionDate: "2026-04-02", animalType: "horse", sessionType: "equine_therapy", facilitatedBy: "Lisa Williams", therapeuticBenefit: "significant" }),
      makeSession({ id: "as-5", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-03-10", animalType: "rabbit", sessionType: "care_responsibility", facilitatedBy: "Sarah Johnson", therapeuticBenefit: "moderate" }),
      makeSession({ id: "as-6", childId: "child-morgan", childName: "Morgan", sessionDate: "2026-04-10", animalType: "dog", sessionType: "structured_therapy", facilitatedBy: "Darren Laville", therapeuticBenefit: "moderate" }),
    ];
    const checks: AnimalWelfareCheck[] = [
      makeWelfareCheck({ id: "aw-1", animalType: "dog", animalName: "Buddy", welfareStatus: "excellent" }),
      makeWelfareCheck({ id: "aw-2", animalType: "rabbit", animalName: "Flopsy", welfareStatus: "good" }),
    ];
    const risks: AnimalRiskAssessment[] = [
      makeRiskAssessment({ id: "ar-1", assessmentDate: "2026-01-15" }),
      makeRiskAssessment({ id: "ar-2", assessmentDate: "2026-04-01", assessedBy: "Sarah Johnson" }),
    ];
    const training: StaffAnimalTraining[] = [
      makeTraining({ id: "at-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeTraining({ id: "at-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      makeTraining({ id: "at-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      makeTraining({ id: "at-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generatePetTherapyAnimalInteractionIntelligence(
      sessions, checks, risks, training, "oak-house", "2026-01-01", "2026-05-19",
    );

    // All sessions have 100% benefit, engagement, risk, supervision, hygiene → session quality = 25
    expect(result.sessionQuality.overallScore).toBe(25);
    // All welfare checks good+ → 25
    expect(result.animalWelfare.overallScore).toBe(25);
    // All risk assessments perfect → 25
    expect(result.riskManagement.overallScore).toBe(25);
    // All staff fully trained → 25
    expect(result.staffAnimalReadiness.overallScore).toBe(25);
    // Total = 100
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    // 3 children
    expect(result.childProfiles).toHaveLength(3);

    // Strengths should be populated
    expect(result.strengths.length).toBeGreaterThan(0);
    // No areas for improvement for perfect data
    expect(result.areasForImprovement).toHaveLength(0);
  });
});
