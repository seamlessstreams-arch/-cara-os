import { describe, it, expect } from "vitest";
import {
  generateParentalContactManagementIntelligence,
  evaluateContactPlanCompliance,
  evaluateContactQuality,
  evaluateRiskManagement,
  evaluateStaffContactReadiness,
  buildChildContactProfiles,
  pct,
  getRating,
  getContactTypeLabel,
  getContactOutcomeLabel,
  getRiskLevelLabel,
  getComplianceStatusLabel,
  getRatingLabel,
} from "../parental-contact-management-engine";
import type {
  ParentalContactPlan,
  ParentalContactSession,
  ContactRiskAssessment,
  StaffContactTraining,
} from "../parental-contact-management-engine";

// -- Helpers ------------------------------------------------------------------

function mkPlan(overrides: Partial<ParentalContactPlan> = {}): ParentalContactPlan {
  return {
    id: "pcp-1",
    childId: "child-1",
    childName: "Alex",
    parentId: "parent-1",
    parentName: "Claire",
    contactType: "face_to_face_supervised",
    frequency: "Monthly",
    riskLevel: "medium",
    courtOrderInPlace: true,
    contactSupervisor: "Sarah Johnson",
    planReviewDate: "2026-06-01",
    planCurrent: true,
    childViewConsidered: true,
    ...overrides,
  };
}

function mkSession(overrides: Partial<ParentalContactSession> = {}): ParentalContactSession {
  return {
    id: "pcs-1",
    childId: "child-1",
    childName: "Alex",
    parentId: "parent-1",
    parentName: "Claire",
    date: "2026-04-15",
    contactType: "face_to_face_supervised",
    duration: 60,
    outcome: "positive",
    supervisedBy: "Sarah Johnson",
    childPrepared: true,
    childDebriefed: true,
    parentCooperative: true,
    safeguardingConcernRaised: false,
    incidentDuringContact: false,
    ...overrides,
  };
}

function mkAssessment(overrides: Partial<ContactRiskAssessment> = {}): ContactRiskAssessment {
  return {
    id: "cra-1",
    childId: "child-1",
    childName: "Alex",
    parentId: "parent-1",
    parentName: "Claire",
    assessmentDate: "2026-03-01",
    assessedBy: "Darren Laville",
    riskLevel: "medium",
    riskFactorsIdentified: ["History of emotional volatility"],
    safeguardingMeasures: ["Supervised contact only"],
    reviewDate: "2026-06-01",
    reviewCurrent: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffContactTraining> = {}): StaffContactTraining {
  return {
    id: "sct-1",
    staffId: "staff-1",
    staffName: "Staff A",
    supervisedContactTrained: true,
    riskAssessmentTrained: true,
    childPrepDebriefTrained: true,
    safeguardingInContact: true,
    managingParentalConflict: true,
    courtOrderAwareness: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds", () => expect(pct(1, 3)).toBe(33));
  it("full", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0/5", () => expect(pct(0, 5)).toBe(0));
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding >= 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding at 100", () => expect(getRating(100)).toBe("outstanding"));
  it("good >= 60", () => expect(getRating(60)).toBe("good"));
  it("good at 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement >= 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement at 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate < 40", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate at 0", () => expect(getRating(0)).toBe("inadequate"));
});

// -- Label functions ----------------------------------------------------------

describe("label functions", () => {
  it("contact type: face_to_face_supervised", () => expect(getContactTypeLabel("face_to_face_supervised")).toBe("Face to Face (Supervised)"));
  it("contact type: face_to_face_unsupervised", () => expect(getContactTypeLabel("face_to_face_unsupervised")).toBe("Face to Face (Unsupervised)"));
  it("contact type: telephone", () => expect(getContactTypeLabel("telephone")).toBe("Telephone"));
  it("contact type: video_call", () => expect(getContactTypeLabel("video_call")).toBe("Video Call"));
  it("contact type: letter", () => expect(getContactTypeLabel("letter")).toBe("Letter"));
  it("contact type: no_contact_order", () => expect(getContactTypeLabel("no_contact_order")).toBe("No Contact Order"));

  it("outcome: positive", () => expect(getContactOutcomeLabel("positive")).toBe("Positive"));
  it("outcome: mixed", () => expect(getContactOutcomeLabel("mixed")).toBe("Mixed"));
  it("outcome: negative", () => expect(getContactOutcomeLabel("negative")).toBe("Negative"));
  it("outcome: cancelled_by_parent", () => expect(getContactOutcomeLabel("cancelled_by_parent")).toBe("Cancelled by Parent"));
  it("outcome: cancelled_by_child", () => expect(getContactOutcomeLabel("cancelled_by_child")).toBe("Cancelled by Child"));
  it("outcome: cancelled_by_authority", () => expect(getContactOutcomeLabel("cancelled_by_authority")).toBe("Cancelled by Authority"));

  it("risk level: low", () => expect(getRiskLevelLabel("low")).toBe("Low"));
  it("risk level: medium", () => expect(getRiskLevelLabel("medium")).toBe("Medium"));
  it("risk level: high", () => expect(getRiskLevelLabel("high")).toBe("High"));
  it("risk level: very_high", () => expect(getRiskLevelLabel("very_high")).toBe("Very High"));

  it("compliance: fully_compliant", () => expect(getComplianceStatusLabel("fully_compliant")).toBe("Fully Compliant"));
  it("compliance: non_compliant", () => expect(getComplianceStatusLabel("non_compliant")).toBe("Non-Compliant"));

  it("rating: outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("rating: inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// -- evaluateContactPlanCompliance --------------------------------------------

describe("evaluateContactPlanCompliance", () => {
  it("returns 0 for empty plans and reports rates as unmeasured", () => {
    const result = evaluateContactPlanCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.planExistsRate).toBeNull();
    expect(result.planCurrentRate).toBeNull();
    expect(result.childViewConsideredRate).toBeNull();
    expect(result.courtOrderCompliantRate).toBeNull();
  });

  it("scores high for fully compliant plans", () => {
    const plans = [mkPlan(), mkPlan({ id: "pcp-2", parentId: "parent-2" })];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.planCurrentRate).toBe(100);
    expect(result.childViewConsideredRate).toBe(100);
  });

  it("counts plan exists excluding no_contact_order", () => {
    const plans = [
      mkPlan({ id: "pcp-1", contactType: "face_to_face_supervised" }),
      mkPlan({ id: "pcp-2", contactType: "no_contact_order", parentId: "parent-2" }),
    ];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.planExistsRate).toBe(50);
  });

  it("scores low when plans not current", () => {
    const plans = [mkPlan({ planCurrent: false })];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.planCurrentRate).toBe(0);
    expect(result.overallScore).toBeLessThan(20);
  });

  it("scores low when child view not considered", () => {
    const plans = [mkPlan({ childViewConsidered: false })];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.childViewConsideredRate).toBe(0);
  });

  it("court order compliant when all court order plans are current", () => {
    const plans = [
      mkPlan({ id: "pcp-1", courtOrderInPlace: true, planCurrent: true }),
      mkPlan({ id: "pcp-2", courtOrderInPlace: true, planCurrent: true, parentId: "parent-2" }),
    ];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.courtOrderCompliantRate).toBe(100);
  });

  it("court order not compliant when court order plan not current", () => {
    const plans = [
      mkPlan({ id: "pcp-1", courtOrderInPlace: true, planCurrent: false }),
    ];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.courtOrderCompliantRate).toBe(0);
  });

  it("court order rate is unmeasured when no plan is court-ordered", () => {
    const plans = [mkPlan({ courtOrderInPlace: false })];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.courtOrderCompliantRate).toBeNull();
  });

  it("handles mixed compliance", () => {
    const plans = [
      mkPlan({ id: "pcp-1", planCurrent: true, childViewConsidered: true }),
      mkPlan({ id: "pcp-2", planCurrent: false, childViewConsidered: false, parentId: "parent-2" }),
    ];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.planCurrentRate).toBe(50);
    expect(result.childViewConsideredRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateContactPlanCompliance([mkPlan()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score minimum is 0", () => {
    const plans = [mkPlan({ planCurrent: false, childViewConsidered: false, courtOrderInPlace: true, contactType: "no_contact_order" })];
    const result = evaluateContactPlanCompliance(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- evaluateContactQuality ---------------------------------------------------

describe("evaluateContactQuality", () => {
  it("returns 0 for empty sessions and reports rates as unmeasured", () => {
    const result = evaluateContactQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.positiveOutcomeRate).toBeNull();
    expect(result.childPreparedRate).toBeNull();
    expect(result.childDebriefedRate).toBeNull();
    expect(result.parentCooperativeRate).toBeNull();
  });

  it("scores high for all positive sessions", () => {
    const sessions = [mkSession(), mkSession({ id: "pcs-2" })];
    const result = evaluateContactQuality(sessions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.childPreparedRate).toBe(100);
    expect(result.childDebriefedRate).toBe(100);
    expect(result.parentCooperativeRate).toBe(100);
  });

  it("scores low for negative sessions with no preparation", () => {
    const sessions = [
      mkSession({ outcome: "negative", childPrepared: false, childDebriefed: false, parentCooperative: false }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.overallScore).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("calculates positive outcome rate correctly", () => {
    const sessions = [
      mkSession({ id: "pcs-1", outcome: "positive" }),
      mkSession({ id: "pcs-2", outcome: "mixed" }),
      mkSession({ id: "pcs-3", outcome: "negative" }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.positiveOutcomeRate).toBe(33);
  });

  it("calculates child prepared rate", () => {
    const sessions = [
      mkSession({ id: "pcs-1", childPrepared: true }),
      mkSession({ id: "pcs-2", childPrepared: false }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.childPreparedRate).toBe(50);
  });

  it("calculates child debriefed rate", () => {
    const sessions = [
      mkSession({ id: "pcs-1", childDebriefed: true }),
      mkSession({ id: "pcs-2", childDebriefed: false }),
      mkSession({ id: "pcs-3", childDebriefed: true }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.childDebriefedRate).toBe(67);
  });

  it("calculates parent cooperative rate", () => {
    const sessions = [
      mkSession({ id: "pcs-1", parentCooperative: true }),
      mkSession({ id: "pcs-2", parentCooperative: false }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.parentCooperativeRate).toBe(50);
  });

  it("handles cancelled sessions", () => {
    const sessions = [
      mkSession({ id: "pcs-1", outcome: "cancelled_by_parent" }),
      mkSession({ id: "pcs-2", outcome: "cancelled_by_child" }),
      mkSession({ id: "pcs-3", outcome: "cancelled_by_authority" }),
    ];
    const result = evaluateContactQuality(sessions);
    expect(result.positiveOutcomeRate).toBe(0);
  });

  it("score capped at 25", () => {
    const result = evaluateContactQuality([mkSession()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("totalSessions matches input length", () => {
    const sessions = [mkSession({ id: "pcs-1" }), mkSession({ id: "pcs-2" }), mkSession({ id: "pcs-3" })];
    const result = evaluateContactQuality(sessions);
    expect(result.totalSessions).toBe(3);
  });
});

// -- evaluateRiskManagement ---------------------------------------------------

describe("evaluateRiskManagement", () => {
  it("returns 25 when no assessments and no sessions", () => {
    const result = evaluateRiskManagement([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalAssessments).toBe(0);
    expect(result.riskAssessedRate).toBeNull();
    expect(result.reviewCurrentRate).toBeNull();
    expect(result.safeguardingMeasuresRate).toBeNull();
    expect(result.incidentRate).toBeNull();
  });

  it("scores well for thorough assessments with no incidents", () => {
    const assessments = [mkAssessment()];
    const sessions = [mkSession()];
    const result = evaluateRiskManagement(assessments, sessions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("penalises when reviews not current", () => {
    const assessments = [mkAssessment({ reviewCurrent: false })];
    const sessions = [mkSession()];
    const result = evaluateRiskManagement(assessments, sessions);
    expect(result.reviewCurrentRate).toBe(0);
    const good = evaluateRiskManagement([mkAssessment({ reviewCurrent: true })], sessions);
    expect(good.overallScore).toBeGreaterThan(result.overallScore);
  });

  it("penalises for incidents during contact", () => {
    const assessments = [mkAssessment()];
    const sessions = [mkSession({ incidentDuringContact: true })];
    const result = evaluateRiskManagement(assessments, sessions);
    expect(result.incidentRate).toBe(100);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("gives bonus for no incidents", () => {
    const assessments = [mkAssessment()];
    const noIncidents = [mkSession({ incidentDuringContact: false })];
    const withIncidents = [mkSession({ incidentDuringContact: true })];
    const resultNoIncident = evaluateRiskManagement(assessments, noIncidents);
    const resultWithIncident = evaluateRiskManagement(assessments, withIncidents);
    expect(resultNoIncident.overallScore).toBeGreaterThan(resultWithIncident.overallScore);
  });

  it("calculates risk assessed rate", () => {
    const assessments = [
      mkAssessment({ id: "cra-1", riskFactorsIdentified: ["Factor A"] }),
      mkAssessment({ id: "cra-2", riskFactorsIdentified: [], parentId: "parent-2" }),
    ];
    const result = evaluateRiskManagement(assessments, []);
    expect(result.riskAssessedRate).toBe(50);
  });

  it("calculates safeguarding measures rate", () => {
    const assessments = [
      mkAssessment({ id: "cra-1", safeguardingMeasures: ["Measure A"] }),
      mkAssessment({ id: "cra-2", safeguardingMeasures: [], parentId: "parent-2" }),
    ];
    const result = evaluateRiskManagement(assessments, []);
    expect(result.safeguardingMeasuresRate).toBe(50);
  });

  it("calculates incident rate across sessions", () => {
    const sessions = [
      mkSession({ id: "pcs-1", incidentDuringContact: false }),
      mkSession({ id: "pcs-2", incidentDuringContact: true }),
      mkSession({ id: "pcs-3", incidentDuringContact: false }),
      mkSession({ id: "pcs-4", incidentDuringContact: true }),
    ];
    const result = evaluateRiskManagement([], sessions);
    expect(result.incidentRate).toBe(50);
  });

  it("gives partial bonus for low incident rate", () => {
    const sessions = Array.from({ length: 20 }, (_, i) =>
      mkSession({ id: `pcs-${i}`, incidentDuringContact: i === 0 }),
    );
    const result = evaluateRiskManagement([], sessions);
    expect(result.incidentRate).toBe(5);
    // Low incident rate should get partial bonus
    expect(result.overallScore).toBeGreaterThan(0);
  });

  it("score capped at 25", () => {
    const result = evaluateRiskManagement([mkAssessment()], [mkSession()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles assessments with no sessions", () => {
    const assessments = [mkAssessment()];
    const result = evaluateRiskManagement(assessments, []);
    expect(result.overallScore).toBeGreaterThan(0);
    // No session took place, so there is no incident rate to report
    expect(result.incidentRate).toBeNull();
  });

  it("handles sessions with no assessments", () => {
    const sessions = [mkSession()];
    const result = evaluateRiskManagement([], sessions);
    // No assessments but sessions exist — should still score for no incidents
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// -- evaluateStaffContactReadiness --------------------------------------------

describe("evaluateStaffContactReadiness", () => {
  it("returns 0 for empty training and reports rates as unmeasured", () => {
    const result = evaluateStaffContactReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.supervisedContactRate).toBeNull();
    expect(result.riskAssessmentRate).toBeNull();
    expect(result.prepDebriefRate).toBeNull();
    expect(result.safeguardingRate).toBeNull();
    expect(result.parentalConflictRate).toBeNull();
    expect(result.courtOrderRate).toBeNull();
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "sct-2", staffId: "s2" })];
    const result = evaluateStaffContactReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.supervisedContactRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [
      mkTraining({
        supervisedContactTrained: false,
        riskAssessmentTrained: false,
        childPrepDebriefTrained: false,
        safeguardingInContact: false,
        managingParentalConflict: false,
        courtOrderAwareness: false,
      }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates supervised contact rate", () => {
    const training = [
      mkTraining({ id: "sct-1", staffId: "s1", supervisedContactTrained: true }),
      mkTraining({ id: "sct-2", staffId: "s2", supervisedContactTrained: false }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.supervisedContactRate).toBe(50);
  });

  it("calculates risk assessment rate", () => {
    const training = [
      mkTraining({ id: "sct-1", staffId: "s1", riskAssessmentTrained: true }),
      mkTraining({ id: "sct-2", staffId: "s2", riskAssessmentTrained: false }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.riskAssessmentRate).toBe(50);
  });

  it("calculates prep/debrief rate", () => {
    const training = [
      mkTraining({ id: "sct-1", staffId: "s1", childPrepDebriefTrained: true }),
      mkTraining({ id: "sct-2", staffId: "s2", childPrepDebriefTrained: false }),
      mkTraining({ id: "sct-3", staffId: "s3", childPrepDebriefTrained: true }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.prepDebriefRate).toBe(67);
  });

  it("calculates safeguarding rate", () => {
    const training = [
      mkTraining({ id: "sct-1", staffId: "s1", safeguardingInContact: true }),
      mkTraining({ id: "sct-2", staffId: "s2", safeguardingInContact: false }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.safeguardingRate).toBe(50);
  });

  it("calculates parental conflict rate", () => {
    const training = [
      mkTraining({ id: "sct-1", staffId: "s1", managingParentalConflict: true }),
      mkTraining({ id: "sct-2", staffId: "s2", managingParentalConflict: false }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.parentalConflictRate).toBe(50);
  });

  it("calculates court order rate", () => {
    const training = [
      mkTraining({ id: "sct-1", staffId: "s1", courtOrderAwareness: true }),
      mkTraining({ id: "sct-2", staffId: "s2", courtOrderAwareness: false }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.courtOrderRate).toBe(50);
  });

  it("handles partially trained staff", () => {
    const training = [
      mkTraining({
        supervisedContactTrained: true,
        riskAssessmentTrained: true,
        childPrepDebriefTrained: false,
        safeguardingInContact: false,
        managingParentalConflict: false,
        courtOrderAwareness: false,
      }),
    ];
    const result = evaluateStaffContactReadiness(training);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffContactReadiness([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("totalStaff matches input length", () => {
    const training = [mkTraining({ id: "sct-1", staffId: "s1" }), mkTraining({ id: "sct-2", staffId: "s2" }), mkTraining({ id: "sct-3", staffId: "s3" })];
    const result = evaluateStaffContactReadiness(training);
    expect(result.totalStaff).toBe(3);
  });
});

// -- buildChildContactProfiles ------------------------------------------------

describe("buildChildContactProfiles", () => {
  it("returns empty for no plans and no sessions", () => {
    expect(buildChildContactProfiles([], [], [])).toEqual([]);
  });

  it("groups by child from plans", () => {
    const plans = [
      mkPlan({ id: "pcp-1", childId: "child-1", childName: "Alex", parentId: "parent-1" }),
      mkPlan({ id: "pcp-2", childId: "child-1", childName: "Alex", parentId: "parent-2" }),
      mkPlan({ id: "pcp-3", childId: "child-2", childName: "Jordan", parentId: "parent-3" }),
    ];
    const profiles = buildChildContactProfiles(plans, [], []);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-1");
    expect(alex!.parentCount).toBe(2);
  });

  it("discovers children from sessions too", () => {
    const sessions = [mkSession({ childId: "child-new", childName: "NewChild" })];
    const profiles = buildChildContactProfiles([], sessions, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childName).toBe("NewChild");
  });

  it("counts sessions in period", () => {
    const plans = [mkPlan()];
    const sessions = [
      mkSession({ id: "pcs-1", childId: "child-1" }),
      mkSession({ id: "pcs-2", childId: "child-1" }),
      mkSession({ id: "pcs-3", childId: "child-1" }),
    ];
    const profiles = buildChildContactProfiles(plans, sessions, []);
    expect(profiles[0].sessionsInPeriod).toBe(3);
  });

  it("calculates positive outcome rate", () => {
    const plans = [mkPlan()];
    const sessions = [
      mkSession({ id: "pcs-1", childId: "child-1", outcome: "positive" }),
      mkSession({ id: "pcs-2", childId: "child-1", outcome: "mixed" }),
    ];
    const profiles = buildChildContactProfiles(plans, sessions, []);
    expect(profiles[0].positiveOutcomeRate).toBe(50);
  });

  it("calculates child prepared rate", () => {
    const plans = [mkPlan()];
    const sessions = [
      mkSession({ id: "pcs-1", childId: "child-1", childPrepared: true }),
      mkSession({ id: "pcs-2", childId: "child-1", childPrepared: false }),
    ];
    const profiles = buildChildContactProfiles(plans, sessions, []);
    expect(profiles[0].childPreparedRate).toBe(50);
  });

  it("marks risk assessed when assessments exist", () => {
    const plans = [mkPlan()];
    const assessments = [mkAssessment({ childId: "child-1" })];
    const profiles = buildChildContactProfiles(plans, [], assessments);
    expect(profiles[0].riskAssessed).toBe(true);
  });

  it("marks risk not assessed when no assessments", () => {
    const plans = [mkPlan()];
    const profiles = buildChildContactProfiles(plans, [], []);
    expect(profiles[0].riskAssessed).toBe(false);
  });

  it("score capped at 10", () => {
    const plans = [mkPlan()];
    const sessions = [mkSession({ childId: "child-1" })];
    const assessments = [mkAssessment({ childId: "child-1" })];
    const profiles = buildChildContactProfiles(plans, sessions, assessments);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score is 0 minimum", () => {
    const plans = [mkPlan({ planCurrent: false, childViewConsidered: false })];
    const sessions = [mkSession({ childId: "child-1", outcome: "negative", childPrepared: false })];
    const profiles = buildChildContactProfiles(plans, sessions, []);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("counts unique parents across plans and sessions", () => {
    const plans = [mkPlan({ parentId: "parent-1" })];
    const sessions = [mkSession({ childId: "child-1", parentId: "parent-2" })];
    const profiles = buildChildContactProfiles(plans, sessions, []);
    expect(profiles[0].parentCount).toBe(2);
  });
});

// -- generateParentalContactManagementIntelligence ----------------------------

describe("generateParentalContactManagementIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateParentalContactManagementIntelligence(
      [mkPlan()], [mkSession()], [mkAssessment()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.contactPlanCompliance.overallScore +
      result.contactQuality.overallScore +
      result.riskManagement.overallScore +
      result.staffContactReadiness.overallScore,
    );
  });

  it("returns inadequate with no data except risk empty bonus", () => {
    const result = generateParentalContactManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    // Empty risk = 25, rest = 0 => 25 => inadequate
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const plans = [mkPlan(), mkPlan({ id: "pcp-2", childId: "child-2", childName: "Jordan", parentId: "parent-2" })];
    const sessions = Array.from({ length: 6 }, (_, i) => mkSession({ id: `pcs-${i}` }));
    const assessments = [mkAssessment()];
    const training = [mkTraining(), mkTraining({ id: "sct-2", staffId: "s2" })];
    const result = generateParentalContactManagementIntelligence(
      plans, sessions, assessments, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateParentalContactManagementIntelligence(
      [mkPlan()], [mkSession()], [mkAssessment()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateParentalContactManagementIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  // -- Strengths --

  it("adds strength for all plans current", () => {
    const plans = [mkPlan({ planCurrent: true })];
    const result = generateParentalContactManagementIntelligence(plans, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("current and up to date"))).toBe(true);
  });

  it("adds strength for child views considered", () => {
    const plans = [mkPlan({ childViewConsidered: true })];
    const result = generateParentalContactManagementIntelligence(plans, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Child's views considered"))).toBe(true);
  });

  it("adds strength for high positive outcome rate", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => mkSession({ id: `pcs-${i}`, outcome: "positive" }));
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Positive outcomes"))).toBe(true);
  });

  it("adds strength for children consistently prepared", () => {
    const sessions = [mkSession({ childPrepared: true })];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("prepared before every"))).toBe(true);
  });

  it("adds strength for children consistently debriefed", () => {
    const sessions = [mkSession({ childDebriefed: true })];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("debriefed after every"))).toBe(true);
  });

  it("adds strength for no incidents", () => {
    const sessions = [mkSession({ incidentDuringContact: false })];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No incidents"))).toBe(true);
  });

  it("adds strength for all risk assessments current", () => {
    const assessments = [mkAssessment({ reviewCurrent: true })];
    const result = generateParentalContactManagementIntelligence([], [], assessments, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("risk assessments are current"))).toBe(true);
  });

  it("adds strength for all staff trained in supervised contact", () => {
    const training = [mkTraining({ supervisedContactTrained: true })];
    const result = generateParentalContactManagementIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("staff trained in supervised"))).toBe(true);
  });

  // -- Areas for improvement --

  it("adds area for no plans documented", () => {
    const result = generateParentalContactManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No parental contact plans documented"))).toBe(true);
  });

  it("adds area for plans not current", () => {
    const plans = [mkPlan({ planCurrent: false })];
    const result = generateParentalContactManagementIntelligence(plans, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("not current"))).toBe(true);
  });

  it("adds area for low child view rate", () => {
    const plans = [
      mkPlan({ id: "pcp-1", childViewConsidered: false }),
      mkPlan({ id: "pcp-2", childViewConsidered: false, parentId: "parent-2" }),
      mkPlan({ id: "pcp-3", childViewConsidered: true, parentId: "parent-3" }),
    ];
    const result = generateParentalContactManagementIntelligence(plans, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Child views considered in only"))).toBe(true);
  });

  it("adds area for low child preparation rate", () => {
    const sessions = [
      mkSession({ id: "pcs-1", childPrepared: false }),
      mkSession({ id: "pcs-2", childPrepared: false }),
      mkSession({ id: "pcs-3", childPrepared: true }),
    ];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Child preparation before contact"))).toBe(true);
  });

  it("adds area for no training records", () => {
    const result = generateParentalContactManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff training records"))).toBe(true);
  });

  it("adds area for no sessions despite active plans", () => {
    const plans = [mkPlan()];
    const result = generateParentalContactManagementIntelligence(plans, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No contact sessions recorded"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for court order plans not current", () => {
    const plans = [mkPlan({ courtOrderInPlace: true, planCurrent: false })];
    const result = generateParentalContactManagementIntelligence(plans, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("court-ordered"))).toBe(true);
  });

  it("adds URGENT for safeguarding concerns raised", () => {
    const sessions = [mkSession({ safeguardingConcernRaised: true })];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("safeguarding concern"))).toBe(true);
  });

  it("adds URGENT for incidents during contact", () => {
    const sessions = [mkSession({ incidentDuringContact: true })];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("incident"))).toBe(true);
  });

  it("adds action for no plans", () => {
    const result = generateParentalContactManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Document parental contact plans"))).toBe(true);
  });

  it("adds action for contact without risk assessment", () => {
    const sessions = [mkSession()];
    const result = generateParentalContactManagementIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Complete contact risk assessments"))).toBe(true);
  });

  it("adds URGENT for high risk assessments without safeguarding measures", () => {
    const assessments = [mkAssessment({ riskLevel: "high", safeguardingMeasures: [] })];
    const result = generateParentalContactManagementIntelligence([], [], assessments, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("high/very-high risk"))).toBe(true);
  });

  it("adds URGENT for very_high risk assessments without safeguarding measures", () => {
    const assessments = [mkAssessment({ riskLevel: "very_high", safeguardingMeasures: [] })];
    const result = generateParentalContactManagementIntelligence([], [], assessments, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("high/very-high risk"))).toBe(true);
  });

  it("does not flag high risk with safeguarding measures", () => {
    const assessments = [mkAssessment({ riskLevel: "high", safeguardingMeasures: ["Supervised only"] })];
    const result = generateParentalContactManagementIntelligence([], [], assessments, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("high/very-high risk") && a.includes("no safeguarding"))).toBe(false);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateParentalContactManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989 s34"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 13"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 9"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 9"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic Chamberlain House scenario", () => {
    const plans = [
      mkPlan({ id: "pcp-1", childId: "child-alex", childName: "Alex", parentId: "parent-alex-mother", contactType: "face_to_face_supervised", riskLevel: "medium", courtOrderInPlace: true }),
      mkPlan({ id: "pcp-2", childId: "child-alex", childName: "Alex", parentId: "parent-alex-father", contactType: "telephone", riskLevel: "low", courtOrderInPlace: false }),
      mkPlan({ id: "pcp-3", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-mother", contactType: "face_to_face_supervised", riskLevel: "high", courtOrderInPlace: true }),
      mkPlan({ id: "pcp-4", childId: "child-jordan", childName: "Jordan", parentId: "parent-jordan-father", contactType: "no_contact_order", riskLevel: "very_high", courtOrderInPlace: true }),
      mkPlan({ id: "pcp-5", childId: "child-morgan", childName: "Morgan", parentId: "parent-morgan-mother", contactType: "face_to_face_unsupervised", riskLevel: "low", courtOrderInPlace: false }),
      mkPlan({ id: "pcp-6", childId: "child-morgan", childName: "Morgan", parentId: "parent-morgan-father", contactType: "video_call", riskLevel: "low", courtOrderInPlace: false }),
    ];
    const sessions = [
      mkSession({ id: "pcs-1", childId: "child-alex", parentId: "parent-alex-mother", outcome: "positive" }),
      mkSession({ id: "pcs-2", childId: "child-alex", parentId: "parent-alex-father", outcome: "positive", contactType: "telephone" }),
      mkSession({ id: "pcs-3", childId: "child-jordan", parentId: "parent-jordan-mother", outcome: "mixed", parentCooperative: false }),
      mkSession({ id: "pcs-4", childId: "child-jordan", parentId: "parent-jordan-mother", outcome: "cancelled_by_parent", parentCooperative: false }),
      mkSession({ id: "pcs-5", childId: "child-morgan", parentId: "parent-morgan-mother", outcome: "positive", contactType: "face_to_face_unsupervised" }),
      mkSession({ id: "pcs-6", childId: "child-morgan", parentId: "parent-morgan-father", outcome: "positive", contactType: "video_call", childDebriefed: false }),
    ];
    const assessments = [
      mkAssessment({ id: "cra-1", childId: "child-alex", riskLevel: "medium" }),
      mkAssessment({ id: "cra-2", childId: "child-jordan", riskLevel: "high", riskFactorsIdentified: ["Substance misuse", "DV history"] }),
      mkAssessment({ id: "cra-3", childId: "child-jordan", parentId: "parent-jordan-father", riskLevel: "very_high" }),
    ];
    const training = [
      mkTraining({ id: "sct-1", staffId: "staff-sarah" }),
      mkTraining({ id: "sct-2", staffId: "staff-tom", managingParentalConflict: false, courtOrderAwareness: false }),
      mkTraining({ id: "sct-3", staffId: "staff-lisa" }),
      mkTraining({ id: "sct-4", staffId: "staff-darren" }),
    ];

    const result = generateParentalContactManagementIntelligence(
      plans, sessions, assessments, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );

    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.contactPlanCompliance.totalPlans).toBe(6);
    expect(result.contactQuality.totalSessions).toBe(6);
    expect(result.riskManagement.totalAssessments).toBe(3);
    expect(result.staffContactReadiness.totalStaff).toBe(4);
  });

  it("child profiles include all three children in mixed scenario", () => {
    const plans = [
      mkPlan({ id: "pcp-1", childId: "child-alex", childName: "Alex" }),
      mkPlan({ id: "pcp-2", childId: "child-jordan", childName: "Jordan", parentId: "parent-2" }),
      mkPlan({ id: "pcp-3", childId: "child-morgan", childName: "Morgan", parentId: "parent-3" }),
    ];
    const result = generateParentalContactManagementIntelligence(
      plans, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(3);
    expect(result.childProfiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan", "Morgan"]);
  });
});
