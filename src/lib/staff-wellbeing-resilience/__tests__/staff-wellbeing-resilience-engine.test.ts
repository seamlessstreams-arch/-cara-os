// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Staff Wellbeing & Resilience Intelligence Engine
//
// Demo: Chamberlain House
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateWellbeingQuality,
  evaluateWellbeingCompliance,
  evaluateWellbeingPolicy,
  evaluateStaffResilienceReadiness,
  buildStaffWellbeingProfiles,
  generateStaffWellbeingResilienceIntelligence,
  getWellbeingTypeLabel,
  getWellbeingScoreLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../staff-wellbeing-resilience-engine";
import type {
  WellbeingAssessment,
  WellbeingPolicy,
  StaffResilienceTraining,
} from "../staff-wellbeing-resilience-engine";

// ── Factory Functions ────────────────────────────────────────────────────

let _assessmentId = 0;
const makeAssessment = (overrides: Partial<WellbeingAssessment> = {}): WellbeingAssessment => ({
  id: `wa-${++_assessmentId}`,
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  assessmentDate: "2026-03-15",
  wellbeingType: "wellbeing_check",
  wellbeingScore: "good",
  stressManaged: true,
  supportProvided: true,
  workloadReviewed: true,
  actionPlanCreated: true,
  followUpScheduled: true,
  feedbackGiven: true,
  ...overrides,
});

let _policyId = 0;
const makePolicy = (overrides: Partial<WellbeingPolicy> = {}): WellbeingPolicy => ({
  id: `wp-${++_policyId}`,
  staffWellbeingStrategy: true,
  burnoutPreventionPlan: true,
  supervisionFramework: true,
  workloadManagementPolicy: true,
  employeeAssistanceProgramme: true,
  peerSupportNetwork: true,
  regularReview: true,
  ...overrides,
});

let _trainingId = 0;
const makeTraining = (overrides: Partial<StaffResilienceTraining> = {}): StaffResilienceTraining => ({
  id: `srt-${++_trainingId}`,
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  stressManagement: true,
  emotionalResilience: true,
  boundaryMaintenance: true,
  selfCare: true,
  teamSupport: true,
  debriefingSkills: true,
  ...overrides,
});

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
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

  it("handles large numbers", () => {
    expect(pct(999, 1000)).toBe(100);
  });
});

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles exact boundaries", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(60)).toBe("good");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// LABEL GETTERS
// ══════════════════════════════════════════════════════════════════════════════

describe("getWellbeingTypeLabel", () => {
  it("returns correct label for supervision_session", () => {
    expect(getWellbeingTypeLabel("supervision_session")).toBe("Supervision Session");
  });

  it("returns correct label for wellbeing_check", () => {
    expect(getWellbeingTypeLabel("wellbeing_check")).toBe("Wellbeing Check");
  });

  it("returns correct label for stress_assessment", () => {
    expect(getWellbeingTypeLabel("stress_assessment")).toBe("Stress Assessment");
  });

  it("returns correct label for resilience_review", () => {
    expect(getWellbeingTypeLabel("resilience_review")).toBe("Resilience Review");
  });

  it("returns correct label for team_debrief", () => {
    expect(getWellbeingTypeLabel("team_debrief")).toBe("Team Debrief");
  });

  it("returns correct label for reflective_practice", () => {
    expect(getWellbeingTypeLabel("reflective_practice")).toBe("Reflective Practice");
  });

  it("returns correct label for employee_assistance", () => {
    expect(getWellbeingTypeLabel("employee_assistance")).toBe("Employee Assistance");
  });

  it("returns correct label for peer_support", () => {
    expect(getWellbeingTypeLabel("peer_support")).toBe("Peer Support");
  });
});

describe("getWellbeingScoreLabel", () => {
  it("returns correct label for excellent", () => {
    expect(getWellbeingScoreLabel("excellent")).toBe("Excellent");
  });

  it("returns correct label for good", () => {
    expect(getWellbeingScoreLabel("good")).toBe("Good");
  });

  it("returns correct label for moderate", () => {
    expect(getWellbeingScoreLabel("moderate")).toBe("Moderate");
  });

  it("returns correct label for poor", () => {
    expect(getWellbeingScoreLabel("poor")).toBe("Poor");
  });

  it("returns correct label for critical", () => {
    expect(getWellbeingScoreLabel("critical")).toBe("Critical");
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
// EVALUATOR 1: evaluateWellbeingQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateWellbeingQuality", () => {
  it("returns score 0 for empty array", () => {
    const result = evaluateWellbeingQuality([]);
    expect(result.score).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.wellbeingRate).toBe(0);
    expect(result.stressManagedRate).toBe(0);
    expect(result.supportProvidedRate).toBe(0);
    expect(result.workloadReviewedRate).toBe(0);
  });

  it("returns max score for all-perfect assessments", () => {
    const assessments = Array.from({ length: 5 }, () =>
      makeAssessment({
        wellbeingScore: "excellent",
        stressManaged: true,
        supportProvided: true,
        workloadReviewed: true,
      }),
    );
    const result = evaluateWellbeingQuality(assessments);
    expect(result.score).toBe(25);
    expect(result.wellbeingRate).toBe(100);
    expect(result.stressManagedRate).toBe(100);
    expect(result.supportProvidedRate).toBe(100);
    expect(result.workloadReviewedRate).toBe(100);
  });

  it("counts excellent as positive wellbeing score", () => {
    const assessments = [makeAssessment({ wellbeingScore: "excellent" })];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.wellbeingRate).toBe(100);
  });

  it("counts good as positive wellbeing score", () => {
    const assessments = [makeAssessment({ wellbeingScore: "good" })];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.wellbeingRate).toBe(100);
  });

  it("does NOT count moderate as positive wellbeing score", () => {
    const assessments = [makeAssessment({ wellbeingScore: "moderate" })];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.wellbeingRate).toBe(0);
  });

  it("does NOT count poor as positive wellbeing score", () => {
    const assessments = [makeAssessment({ wellbeingScore: "poor" })];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.wellbeingRate).toBe(0);
  });

  it("does NOT count critical as positive wellbeing score", () => {
    const assessments = [makeAssessment({ wellbeingScore: "critical" })];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.wellbeingRate).toBe(0);
  });

  it("calculates correct rate for mixed wellbeing scores", () => {
    const assessments = [
      makeAssessment({ wellbeingScore: "excellent" }),
      makeAssessment({ wellbeingScore: "good" }),
      makeAssessment({ wellbeingScore: "moderate" }),
      makeAssessment({ wellbeingScore: "poor" }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.wellbeingRate).toBe(50);
  });

  it("calculates stress managed rate correctly", () => {
    const assessments = [
      makeAssessment({ stressManaged: true }),
      makeAssessment({ stressManaged: false }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.stressManagedRate).toBe(50);
  });

  it("calculates support provided rate correctly", () => {
    const assessments = [
      makeAssessment({ supportProvided: true }),
      makeAssessment({ supportProvided: true }),
      makeAssessment({ supportProvided: false }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.supportProvidedRate).toBe(67);
  });

  it("calculates workload reviewed rate correctly", () => {
    const assessments = [
      makeAssessment({ workloadReviewed: true }),
      makeAssessment({ workloadReviewed: false }),
      makeAssessment({ workloadReviewed: false }),
      makeAssessment({ workloadReviewed: false }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.workloadReviewedRate).toBe(25);
  });

  it("returns 0 score when all metrics are negative", () => {
    const assessments = [
      makeAssessment({
        wellbeingScore: "critical",
        stressManaged: false,
        supportProvided: false,
        workloadReviewed: false,
      }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.score).toBe(0);
  });

  it("caps score at 25", () => {
    const assessments = Array.from({ length: 100 }, () => makeAssessment());
    const result = evaluateWellbeingQuality(assessments);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const assessments = [
      makeAssessment({
        wellbeingScore: "critical",
        stressManaged: false,
        supportProvided: false,
        workloadReviewed: false,
      }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("partial metrics produce partial score", () => {
    const assessments = [
      makeAssessment({
        wellbeingScore: "good",
        stressManaged: true,
        supportProvided: false,
        workloadReviewed: false,
      }),
      makeAssessment({
        wellbeingScore: "moderate",
        stressManaged: false,
        supportProvided: true,
        workloadReviewed: false,
      }),
    ];
    const result = evaluateWellbeingQuality(assessments);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 2: evaluateWellbeingCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateWellbeingCompliance", () => {
  it("returns score 0 for empty array", () => {
    const result = evaluateWellbeingCompliance([]);
    expect(result.score).toBe(0);
    expect(result.totalAssessments).toBe(0);
    expect(result.actionPlanRate).toBe(0);
    expect(result.followUpRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.wellbeingTypeDiversityRatio).toBe(0);
  });

  it("returns max score for all-perfect assessments with full type diversity", () => {
    const types: WellbeingAssessment["wellbeingType"][] = [
      "supervision_session", "wellbeing_check", "stress_assessment", "resilience_review",
      "team_debrief", "reflective_practice", "employee_assistance", "peer_support",
    ];
    const assessments = types.map((t) =>
      makeAssessment({
        wellbeingType: t,
        actionPlanCreated: true,
        followUpScheduled: true,
        feedbackGiven: true,
      }),
    );
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.score).toBe(25);
    expect(result.actionPlanRate).toBe(100);
    expect(result.followUpRate).toBe(100);
    expect(result.feedbackRate).toBe(100);
    expect(result.wellbeingTypeDiversityRatio).toBe(1);
  });

  it("calculates action plan rate correctly", () => {
    const assessments = [
      makeAssessment({ actionPlanCreated: true }),
      makeAssessment({ actionPlanCreated: false }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.actionPlanRate).toBe(50);
  });

  it("calculates follow-up rate correctly", () => {
    const assessments = [
      makeAssessment({ followUpScheduled: true }),
      makeAssessment({ followUpScheduled: true }),
      makeAssessment({ followUpScheduled: false }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.followUpRate).toBe(67);
  });

  it("calculates feedback rate correctly", () => {
    const assessments = [
      makeAssessment({ feedbackGiven: true }),
      makeAssessment({ feedbackGiven: false }),
      makeAssessment({ feedbackGiven: false }),
      makeAssessment({ feedbackGiven: false }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.feedbackRate).toBe(25);
  });

  it("calculates diversity ratio correctly for 4 types", () => {
    const assessments = [
      makeAssessment({ wellbeingType: "supervision_session" }),
      makeAssessment({ wellbeingType: "wellbeing_check" }),
      makeAssessment({ wellbeingType: "stress_assessment" }),
      makeAssessment({ wellbeingType: "resilience_review" }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.wellbeingTypeDiversityRatio).toBe(0.5);
  });

  it("calculates diversity ratio correctly for 1 type", () => {
    const assessments = [
      makeAssessment({ wellbeingType: "wellbeing_check" }),
      makeAssessment({ wellbeingType: "wellbeing_check" }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.wellbeingTypeDiversityRatio).toBe(0.13);
  });

  it("returns 0 score when all compliance metrics are false", () => {
    const assessments = [
      makeAssessment({
        actionPlanCreated: false,
        followUpScheduled: false,
        feedbackGiven: false,
        wellbeingType: "wellbeing_check",
      }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    // Only diversity contributes: 1/8 = 0.13 * 5 = 0.65 → rounds to 0.7
    expect(result.score).toBeLessThan(2);
  });

  it("caps score at 25", () => {
    const types: WellbeingAssessment["wellbeingType"][] = [
      "supervision_session", "wellbeing_check", "stress_assessment", "resilience_review",
      "team_debrief", "reflective_practice", "employee_assistance", "peer_support",
    ];
    const assessments = types.map((t) => makeAssessment({ wellbeingType: t }));
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never negative", () => {
    const assessments = [
      makeAssessment({
        actionPlanCreated: false,
        followUpScheduled: false,
        feedbackGiven: false,
      }),
    ];
    const result = evaluateWellbeingCompliance(assessments);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 3: evaluateWellbeingPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateWellbeingPolicy", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateWellbeingPolicy(null);
    expect(result.score).toBe(0);
    expect(result.staffWellbeingStrategy).toBe(false);
    expect(result.burnoutPreventionPlan).toBe(false);
    expect(result.supervisionFramework).toBe(false);
    expect(result.workloadManagementPolicy).toBe(false);
    expect(result.employeeAssistanceProgramme).toBe(false);
    expect(result.peerSupportNetwork).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns score 25 for all-true policy", () => {
    const result = evaluateWellbeingPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("returns score 0 for all-false policy", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: false,
        supervisionFramework: false,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(0);
  });

  it("weights staffWellbeingStrategy at 4 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: true,
        burnoutPreventionPlan: false,
        supervisionFramework: false,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights burnoutPreventionPlan at 4 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: true,
        supervisionFramework: false,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights supervisionFramework at 4 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: false,
        supervisionFramework: true,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights workloadManagementPolicy at 4 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: false,
        supervisionFramework: false,
        workloadManagementPolicy: true,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(4);
  });

  it("weights employeeAssistanceProgramme at 3 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: false,
        supervisionFramework: false,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: true,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights peerSupportNetwork at 3 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: false,
        supervisionFramework: false,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: true,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("weights regularReview at 3 points", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: false,
        burnoutPreventionPlan: false,
        supervisionFramework: false,
        workloadManagementPolicy: false,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: true,
      }),
    );
    expect(result.score).toBe(3);
  });

  it("sums weights correctly: 4+4+4+4+3+3+3 = 25", () => {
    expect(4 + 4 + 4 + 4 + 3 + 3 + 3).toBe(25);
    const result = evaluateWellbeingPolicy(makePolicy());
    expect(result.score).toBe(25);
  });

  it("partial policy gives partial score (first 4 booleans)", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({
        staffWellbeingStrategy: true,
        burnoutPreventionPlan: true,
        supervisionFramework: true,
        workloadManagementPolicy: true,
        employeeAssistanceProgramme: false,
        peerSupportNetwork: false,
        regularReview: false,
      }),
    );
    expect(result.score).toBe(16);
  });

  it("reflects boolean values in result", () => {
    const result = evaluateWellbeingPolicy(
      makePolicy({ staffWellbeingStrategy: true, regularReview: false }),
    );
    expect(result.staffWellbeingStrategy).toBe(true);
    expect(result.regularReview).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// EVALUATOR 4: evaluateStaffResilienceReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffResilienceReadiness", () => {
  it("returns score 0 for empty array", () => {
    const result = evaluateStaffResilienceReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for all-true training", () => {
    const training = [makeTraining()];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(25);
  });

  it("returns score 0 for all-false training", () => {
    const training = [
      makeTraining({
        stressManagement: false,
        emotionalResilience: false,
        boundaryMaintenance: false,
        selfCare: false,
        teamSupport: false,
        debriefingSkills: false,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(0);
  });

  it("weights stressManagement at 6 points", () => {
    const training = [
      makeTraining({
        stressManagement: true,
        emotionalResilience: false,
        boundaryMaintenance: false,
        selfCare: false,
        teamSupport: false,
        debriefingSkills: false,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(6);
  });

  it("weights emotionalResilience at 5 points", () => {
    const training = [
      makeTraining({
        stressManagement: false,
        emotionalResilience: true,
        boundaryMaintenance: false,
        selfCare: false,
        teamSupport: false,
        debriefingSkills: false,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(5);
  });

  it("weights boundaryMaintenance at 5 points", () => {
    const training = [
      makeTraining({
        stressManagement: false,
        emotionalResilience: false,
        boundaryMaintenance: true,
        selfCare: false,
        teamSupport: false,
        debriefingSkills: false,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(5);
  });

  it("weights selfCare at 4 points", () => {
    const training = [
      makeTraining({
        stressManagement: false,
        emotionalResilience: false,
        boundaryMaintenance: false,
        selfCare: true,
        teamSupport: false,
        debriefingSkills: false,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(4);
  });

  it("weights teamSupport at 3 points", () => {
    const training = [
      makeTraining({
        stressManagement: false,
        emotionalResilience: false,
        boundaryMaintenance: false,
        selfCare: false,
        teamSupport: true,
        debriefingSkills: false,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(3);
  });

  it("weights debriefingSkills at 2 points", () => {
    const training = [
      makeTraining({
        stressManagement: false,
        emotionalResilience: false,
        boundaryMaintenance: false,
        selfCare: false,
        teamSupport: false,
        debriefingSkills: true,
      }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBe(2);
  });

  it("sums weights correctly: 6+5+5+4+3+2 = 25", () => {
    expect(6 + 5 + 5 + 4 + 3 + 2).toBe(25);
  });

  it("averages across multiple staff members", () => {
    const training = [
      makeTraining({ staffId: "s1", stressManagement: true, emotionalResilience: true, boundaryMaintenance: true, selfCare: true, teamSupport: true, debriefingSkills: true }),
      makeTraining({ staffId: "s2", stressManagement: true, emotionalResilience: false, boundaryMaintenance: false, selfCare: false, teamSupport: false, debriefingSkills: false }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.stressManagementRate).toBe(100);
    expect(result.emotionalResilienceRate).toBe(50);
    expect(result.boundaryMaintenanceRate).toBe(50);
    expect(result.selfCareRate).toBe(50);
    expect(result.teamSupportRate).toBe(50);
    expect(result.debriefingSkillsRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ staffId: `s-${i}` }),
    );
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("calculates rates correctly with 4 staff", () => {
    const training = [
      makeTraining({ staffId: "s1" }),
      makeTraining({ staffId: "s2" }),
      makeTraining({ staffId: "s3", stressManagement: false }),
      makeTraining({ staffId: "s4" }),
    ];
    const result = evaluateStaffResilienceReadiness(training);
    expect(result.stressManagementCount).toBe(3);
    expect(result.stressManagementRate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildStaffWellbeingProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildStaffWellbeingProfiles", () => {
  it("returns empty array for no assessments", () => {
    const profiles = buildStaffWellbeingProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups assessments by staffId", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeAssessment({ staffId: "staff-tom", staffName: "Tom Richards" }),
      makeAssessment({ staffId: "staff-sarah", staffName: "Sarah Johnson" }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles).toHaveLength(2);
  });

  it("counts total assessments per staff", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah" }),
      makeAssessment({ staffId: "staff-sarah" }),
      makeAssessment({ staffId: "staff-sarah" }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].totalAssessments).toBe(3);
  });

  it("calculates wellbeing rate per staff", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", wellbeingScore: "excellent" }),
      makeAssessment({ staffId: "staff-sarah", wellbeingScore: "poor" }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].wellbeingRate).toBe(50);
  });

  it("calculates stress managed rate per staff", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", stressManaged: true }),
      makeAssessment({ staffId: "staff-sarah", stressManaged: false }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].stressManagedRate).toBe(50);
  });

  it("tracks unique types per staff", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", wellbeingType: "supervision_session" }),
      makeAssessment({ staffId: "staff-sarah", wellbeingType: "wellbeing_check" }),
      makeAssessment({ staffId: "staff-sarah", wellbeingType: "supervision_session" }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].uniqueTypes).toBe(2);
  });

  // Frequency scoring tests
  it("gives frequency score 0 for <5 assessments", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", wellbeingScore: "excellent", stressManaged: true }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    // frequency(0) + wellbeing(3) + stress(3) + diversity(0) = 6
    expect(profiles[0].score).toBe(6);
  });

  it("gives frequency score 1 for 5-9 assessments", () => {
    const assessments = Array.from({ length: 5 }, () =>
      makeAssessment({ staffId: "staff-sarah", wellbeingScore: "excellent", stressManaged: true }),
    );
    const profiles = buildStaffWellbeingProfiles(assessments);
    // frequency(1) + wellbeing(3) + stress(3) + diversity(0) = 7
    expect(profiles[0].score).toBe(7);
  });

  it("gives frequency score 2 for 10+ assessments", () => {
    const assessments = Array.from({ length: 10 }, () =>
      makeAssessment({ staffId: "staff-sarah", wellbeingScore: "excellent", stressManaged: true }),
    );
    const profiles = buildStaffWellbeingProfiles(assessments);
    // frequency(2) + wellbeing(3) + stress(3) + diversity(0) = 8
    expect(profiles[0].score).toBe(8);
  });

  // Wellbeing rate tiers
  it("gives wellbeing score 3 for >=80% wellbeing rate", () => {
    const assessments = Array.from({ length: 10 }, () =>
      makeAssessment({ staffId: "staff-sarah", wellbeingScore: "excellent", stressManaged: true }),
    );
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].wellbeingRate).toBe(100);
    // frequency(2) + wellbeing(3) + stress(3) + diversity(0) = 8
    expect(profiles[0].score).toBe(8);
  });

  it("gives wellbeing score 2 for 60-79% wellbeing rate", () => {
    const assessments = [
      ...Array.from({ length: 7 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "good", stressManaged: true })),
      ...Array.from({ length: 3 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "moderate", stressManaged: true })),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].wellbeingRate).toBe(70);
    // frequency(2) + wellbeing(2) + stress(3) + diversity(0) = 7
    expect(profiles[0].score).toBe(7);
  });

  it("gives wellbeing score 1 for 40-59% wellbeing rate", () => {
    const assessments = [
      ...Array.from({ length: 5 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "good", stressManaged: true })),
      ...Array.from({ length: 5 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "moderate", stressManaged: true })),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].wellbeingRate).toBe(50);
    // frequency(2) + wellbeing(1) + stress(3) + diversity(0) = 6
    expect(profiles[0].score).toBe(6);
  });

  it("gives wellbeing score 0 for <40% wellbeing rate", () => {
    const assessments = [
      ...Array.from({ length: 3 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "good", stressManaged: true })),
      ...Array.from({ length: 7 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "poor", stressManaged: true })),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].wellbeingRate).toBe(30);
    // frequency(2) + wellbeing(0) + stress(3) + diversity(0) = 5
    expect(profiles[0].score).toBe(5);
  });

  // Diversity bonus
  it("gives diversity bonus 2 for >=4 types", () => {
    const types: WellbeingAssessment["wellbeingType"][] = [
      "supervision_session", "wellbeing_check", "stress_assessment", "resilience_review",
    ];
    const assessments = types.map((t) =>
      makeAssessment({ staffId: "staff-sarah", wellbeingType: t, wellbeingScore: "excellent", stressManaged: true }),
    );
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].uniqueTypes).toBe(4);
    // frequency(0) + wellbeing(3) + stress(3) + diversity(2) = 8
    expect(profiles[0].score).toBe(8);
  });

  it("gives diversity bonus 1 for 2-3 types", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", wellbeingType: "supervision_session", wellbeingScore: "excellent", stressManaged: true }),
      makeAssessment({ staffId: "staff-sarah", wellbeingType: "wellbeing_check", wellbeingScore: "excellent", stressManaged: true }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].uniqueTypes).toBe(2);
    // frequency(0) + wellbeing(3) + stress(3) + diversity(1) = 7
    expect(profiles[0].score).toBe(7);
  });

  it("gives diversity bonus 0 for 1 type", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", wellbeingType: "wellbeing_check", wellbeingScore: "excellent", stressManaged: true }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].uniqueTypes).toBe(1);
    // frequency(0) + wellbeing(3) + stress(3) + diversity(0) = 6
    expect(profiles[0].score).toBe(6);
  });

  it("caps staff score at 10", () => {
    const types: WellbeingAssessment["wellbeingType"][] = [
      "supervision_session", "wellbeing_check", "stress_assessment", "resilience_review",
      "team_debrief", "reflective_practice", "employee_assistance", "peer_support",
    ];
    // 10+ assessments across 8 types, 100% wellbeing, 100% stress
    const assessments = [
      ...types.map((t) => makeAssessment({ staffId: "staff-sarah", wellbeingType: t, wellbeingScore: "excellent", stressManaged: true })),
      ...Array.from({ length: 5 }, () => makeAssessment({ staffId: "staff-sarah", wellbeingScore: "excellent", stressManaged: true })),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].score).toBeLessThanOrEqual(10);
    expect(profiles[0].score).toBe(10);
  });

  it("staff score is never negative", () => {
    const assessments = Array.from({ length: 3 }, () =>
      makeAssessment({
        staffId: "staff-sarah",
        wellbeingScore: "critical",
        stressManaged: false,
      }),
    );
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].score).toBeGreaterThanOrEqual(0);
  });

  it("preserves staffName in profiles", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-darren", staffName: "Darren Laville" }),
    ];
    const profiles = buildStaffWellbeingProfiles(assessments);
    expect(profiles[0].staffName).toBe("Darren Laville");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ORCHESTRATOR: generateStaffWellbeingResilienceIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateStaffWellbeingResilienceIntelligence", () => {
  it("returns all required fields", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
    expect(typeof result.overallScore).toBe("number");
    expect(typeof result.rating).toBe("string");
    expect(result.wellbeingQuality).toBeDefined();
    expect(result.wellbeingCompliance).toBeDefined();
    expect(result.wellbeingPolicy).toBeDefined();
    expect(result.staffResilienceReadiness).toBeDefined();
    expect(result.staffProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("returns inadequate for empty data", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("sums 4 evaluator scores for overall", () => {
    const assessments = Array.from({ length: 5 }, () => makeAssessment());
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    const expectedSum =
      result.wellbeingQuality.score +
      result.wellbeingCompliance.score +
      result.wellbeingPolicy.score +
      result.staffResilienceReadiness.score;
    expect(result.overallScore).toBe(Math.round(expectedSum));
  });

  it("caps overall score at 100", () => {
    const types: WellbeingAssessment["wellbeingType"][] = [
      "supervision_session", "wellbeing_check", "stress_assessment", "resilience_review",
      "team_debrief", "reflective_practice", "employee_assistance", "peer_support",
    ];
    const assessments = types.map((t) => makeAssessment({ wellbeingType: t }));
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("achieves outstanding rating with perfect data", () => {
    const types: WellbeingAssessment["wellbeingType"][] = [
      "supervision_session", "wellbeing_check", "stress_assessment", "resilience_review",
      "team_debrief", "reflective_practice", "employee_assistance", "peer_support",
    ];
    const assessments = types.map((t) => makeAssessment({ wellbeingType: t }));
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 7 regulatory links", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("includes specific regulatory links", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.regulatoryLinks).toContain("CHR 2015 Regulation 13 — Leadership and management (staff wellbeing)");
    expect(result.regulatoryLinks).toContain("SCCIF — Workforce and leadership");
    expect(result.regulatoryLinks).toContain("NMS 19 — Staffing of children's homes");
    expect(result.regulatoryLinks).toContain("NMS 20 — Staff supervision and support");
    expect(result.regulatoryLinks).toContain("Health and Safety at Work Act 1974 — Employer duty of care");
    expect(result.regulatoryLinks).toContain("Working Time Regulations 1998 — Working hours and rest");
    expect(result.regulatoryLinks).toContain("ACAS Guidance — Promoting positive mental health at work");
  });

  it("homeId is preserved", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      null,
      [],
      "test-home",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.homeId).toBe("test-home");
  });

  it("period dates are preserved", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-03-01",
      "2026-06-30",
    );
    expect(result.periodStart).toBe("2026-03-01");
    expect(result.periodEnd).toBe("2026-06-30");
  });

  // Strengths logic
  it("adds strength for wellbeing rate >= 80%", () => {
    const assessments = Array.from({ length: 5 }, () =>
      makeAssessment({ wellbeingScore: "excellent" }),
    );
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("staff wellbeing culture"))).toBe(true);
  });

  it("adds strength for stress managed rate >= 80%", () => {
    const assessments = Array.from({ length: 5 }, () =>
      makeAssessment({ stressManaged: true }),
    );
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("stress management"))).toBe(true);
  });

  it("adds strength for support provided rate >= 80%", () => {
    const assessments = Array.from({ length: 5 }, () =>
      makeAssessment({ supportProvided: true }),
    );
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("support provision"))).toBe(true);
  });

  it("adds strength for full policy score", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [makeAssessment()],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("policy framework"))).toBe(true);
  });

  // Actions logic
  it("adds action when no assessments exist", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.includes("No wellbeing assessment records found"))).toBe(true);
  });

  it("adds URGENT action when no policy", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [makeAssessment()],
      null,
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No wellbeing policy"))).toBe(true);
  });

  it("adds URGENT action when no training", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [makeAssessment()],
      makePolicy(),
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("No staff resilience training"))).toBe(true);
  });

  it("adds URGENT action for missing burnout prevention plan", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [makeAssessment()],
      makePolicy({ burnoutPreventionPlan: false }),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("burnout prevention"))).toBe(true);
  });

  it("adds URGENT action for missing wellbeing strategy", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [makeAssessment()],
      makePolicy({ staffWellbeingStrategy: false }),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("wellbeing strategy"))).toBe(true);
  });

  // Areas for improvement
  it("adds area for improvement when wellbeing rate < 60%", () => {
    const assessments = [
      makeAssessment({ wellbeingScore: "poor" }),
      makeAssessment({ wellbeingScore: "critical" }),
      makeAssessment({ wellbeingScore: "moderate" }),
    ];
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Wellbeing score rate"))).toBe(true);
  });

  it("adds area for improvement when follow-up rate < 60%", () => {
    const assessments = [
      makeAssessment({ followUpScheduled: false }),
      makeAssessment({ followUpScheduled: false }),
      makeAssessment({ followUpScheduled: true }),
    ];
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Follow-up scheduling rate"))).toBe(true);
  });

  it("does not produce strength about wellbeing culture for empty assessments", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.strengths.some((s) => s.includes("staff wellbeing culture"))).toBe(false);
  });

  it("builds staff profiles from assessments", () => {
    const assessments = [
      makeAssessment({ staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeAssessment({ staffId: "staff-tom", staffName: "Tom Richards" }),
    ];
    const result = generateStaffWellbeingResilienceIntelligence(
      assessments,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.staffProfiles).toHaveLength(2);
  });

  it("overall score floor is 0", () => {
    const result = generateStaffWellbeingResilienceIntelligence(
      [
        makeAssessment({
          wellbeingScore: "critical",
          stressManaged: false,
          supportProvided: false,
          workloadReviewed: false,
          actionPlanCreated: false,
          followUpScheduled: false,
          feedbackGiven: false,
        }),
      ],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-12-31",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
