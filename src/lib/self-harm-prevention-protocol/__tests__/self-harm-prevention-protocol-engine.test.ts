import { describe, it, expect } from "vitest";
import {
  generateSelfHarmPreventionProtocolIntelligence,
  evaluateRiskAssessmentQuality,
  evaluateSafetyPlanning,
  evaluateIncidentResponse,
  evaluateStaffCompetence,
  buildChildSelfHarmProfiles,
  pct,
  getRating,
  getRiskLevelLabel,
  getSelfHarmTypeLabel,
  getInterventionOutcomeLabel,
  getSafetyPlanStatusLabel,
  getRatingLabel,
} from "../self-harm-prevention-protocol-engine";
import type {
  ChildRiskProfile,
  SelfHarmIncident,
  EnvironmentalSafetyCheck,
  StaffSelfHarmTraining,
} from "../self-harm-prevention-protocol-engine";

// ── Helpers ───────────────────────────────────────────────────────────────

function mkProfile(overrides: Partial<ChildRiskProfile> = {}): ChildRiskProfile {
  return {
    id: "rp-1",
    childId: "child-1",
    childName: "Alex",
    riskLevel: "low",
    assessmentDate: "2026-04-01",
    assessedBy: "Darren Laville",
    reviewDate: "2026-05-01",
    reviewCurrent: true,
    safetyPlanStatus: "current",
    triggersIdentified: ["anxiety", "peer conflict"],
    copingStrategiesDocumented: ["breathing exercises", "talk to keyworker"],
    emergencyContactsRecorded: true,
    professionalSupportInPlace: true,
    ...overrides,
  };
}

function mkIncident(overrides: Partial<SelfHarmIncident> = {}): SelfHarmIncident {
  return {
    id: "inc-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-04-15",
    selfHarmType: "cutting",
    severity: "low",
    interventionOutcome: "prevented",
    staffResponded: ["Sarah Johnson"],
    immediateActionTaken: true,
    medicalAssessmentCompleted: true,
    parentNotified: true,
    socialWorkerNotified: true,
    debriefCompleted: true,
    safetyPlanUpdated: true,
    ...overrides,
  };
}

function mkCheck(overrides: Partial<EnvironmentalSafetyCheck> = {}): EnvironmentalSafetyCheck {
  return {
    id: "esc-1",
    checkDate: "2026-04-01",
    checkedBy: "Sarah Johnson",
    ligaturePointsAssessed: true,
    sharpObjectsSecured: true,
    medicationSecured: true,
    bathroomProductsSecured: true,
    windowRestrictorsChecked: true,
    overallCompliant: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffSelfHarmTraining> = {}): StaffSelfHarmTraining {
  return {
    id: "sht-1",
    staffId: "staff-1",
    staffName: "Staff A",
    selfHarmAwareness: true,
    riskAssessmentTrained: true,
    safetyPlanningTrained: true,
    crisisInterventionTrained: true,
    postventionTrained: true,
    mentalHealthFirstAid: true,
    ...overrides,
  };
}

// ── pct ───────────────────────────────────────────────────────────────────

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds", () => expect(pct(1, 3)).toBe(33));
  it("full", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0/5", () => expect(pct(0, 5)).toBe(0));
});

// ── getRating ─────────────────────────────────────────────────────────────

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

// ── Label functions ───────────────────────────────────────────────────────

describe("label functions", () => {
  it("risk level labels", () => {
    expect(getRiskLevelLabel("low")).toBe("Low");
    expect(getRiskLevelLabel("medium")).toBe("Medium");
    expect(getRiskLevelLabel("high")).toBe("High");
    expect(getRiskLevelLabel("very_high")).toBe("Very High");
  });
  it("self-harm type labels", () => {
    expect(getSelfHarmTypeLabel("cutting")).toBe("Cutting");
    expect(getSelfHarmTypeLabel("burning")).toBe("Burning");
    expect(getSelfHarmTypeLabel("overdose")).toBe("Overdose");
    expect(getSelfHarmTypeLabel("head_banging")).toBe("Head Banging");
    expect(getSelfHarmTypeLabel("hair_pulling")).toBe("Hair Pulling");
    expect(getSelfHarmTypeLabel("poisoning")).toBe("Poisoning");
    expect(getSelfHarmTypeLabel("ligature")).toBe("Ligature");
    expect(getSelfHarmTypeLabel("other")).toBe("Other");
  });
  it("intervention outcome labels", () => {
    expect(getInterventionOutcomeLabel("prevented")).toBe("Prevented");
    expect(getInterventionOutcomeLabel("interrupted")).toBe("Interrupted");
    expect(getInterventionOutcomeLabel("required_medical")).toBe("Required Medical");
    expect(getInterventionOutcomeLabel("hospitalised")).toBe("Hospitalised");
  });
  it("safety plan status labels", () => {
    expect(getSafetyPlanStatusLabel("current")).toBe("Current");
    expect(getSafetyPlanStatusLabel("overdue")).toBe("Overdue");
    expect(getSafetyPlanStatusLabel("not_in_place")).toBe("Not In Place");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateRiskAssessmentQuality ────────────────────────────────────────

describe("evaluateRiskAssessmentQuality", () => {
  it("returns 0 for empty profiles", () => {
    const result = evaluateRiskAssessmentQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalProfiles).toBe(0);
    expect(result.riskAssessedRate).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
    expect(result.triggersIdentifiedRate).toBe(0);
    expect(result.professionalSupportRate).toBe(0);
  });

  it("scores high for fully compliant profiles", () => {
    const profiles = [mkProfile(), mkProfile({ id: "rp-2", childId: "child-2", childName: "Jordan" })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.riskAssessedRate).toBe(100);
    expect(result.reviewCurrentRate).toBe(100);
    expect(result.triggersIdentifiedRate).toBe(100);
    expect(result.professionalSupportRate).toBe(100);
  });

  it("scores low when reviews not current", () => {
    const profiles = [mkProfile({ reviewCurrent: false })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.reviewCurrentRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores low when no triggers identified", () => {
    const profiles = [mkProfile({ triggersIdentified: [] })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.triggersIdentifiedRate).toBe(0);
  });

  it("scores low when no professional support", () => {
    const profiles = [mkProfile({ professionalSupportInPlace: false })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.professionalSupportRate).toBe(0);
  });

  it("handles partially compliant profiles", () => {
    const profiles = [
      mkProfile({ id: "rp-1", childId: "child-1" }),
      mkProfile({ id: "rp-2", childId: "child-2", childName: "Jordan", reviewCurrent: false, triggersIdentified: [], professionalSupportInPlace: false }),
    ];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.reviewCurrentRate).toBe(50);
    expect(result.triggersIdentifiedRate).toBe(50);
    expect(result.professionalSupportRate).toBe(50);
  });

  it("counts profiles with empty assessedBy as not assessed", () => {
    const profiles = [mkProfile({ assessedBy: "" })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.riskAssessedRate).toBe(0);
  });

  it("counts profiles with empty assessmentDate as not assessed", () => {
    const profiles = [mkProfile({ assessmentDate: "" })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.riskAssessedRate).toBe(0);
  });

  it("score capped at 25", () => {
    const result = evaluateRiskAssessmentQuality([mkProfile()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const profiles = [mkProfile({ reviewCurrent: false, triggersIdentified: [], professionalSupportInPlace: false, assessedBy: "", assessmentDate: "" })];
    const result = evaluateRiskAssessmentQuality(profiles);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── evaluateSafetyPlanning ───────────────────────────────────────────────

describe("evaluateSafetyPlanning", () => {
  it("returns 0 for empty profiles and checks", () => {
    const result = evaluateSafetyPlanning([], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalProfiles).toBe(0);
    expect(result.totalChecks).toBe(0);
    expect(result.safetyPlanInPlaceRate).toBe(0);
    expect(result.copingStrategiesRate).toBe(0);
    expect(result.emergencyContactsRate).toBe(0);
    expect(result.environmentalComplianceRate).toBe(0);
  });

  it("scores high for fully compliant data", () => {
    const profiles = [mkProfile()];
    const checks = [mkCheck()];
    const result = evaluateSafetyPlanning(profiles, checks);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.safetyPlanInPlaceRate).toBe(100);
    expect(result.copingStrategiesRate).toBe(100);
    expect(result.emergencyContactsRate).toBe(100);
    expect(result.environmentalComplianceRate).toBe(100);
  });

  it("scores low when safety plans not in place", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "not_in_place" })];
    const result = evaluateSafetyPlanning(profiles, []);
    expect(result.safetyPlanInPlaceRate).toBe(0);
  });

  it("scores low when safety plans overdue", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "overdue" })];
    const result = evaluateSafetyPlanning(profiles, []);
    expect(result.safetyPlanInPlaceRate).toBe(0);
  });

  it("scores low when no coping strategies", () => {
    const profiles = [mkProfile({ copingStrategiesDocumented: [] })];
    const result = evaluateSafetyPlanning(profiles, []);
    expect(result.copingStrategiesRate).toBe(0);
  });

  it("scores low when no emergency contacts", () => {
    const profiles = [mkProfile({ emergencyContactsRecorded: false })];
    const result = evaluateSafetyPlanning(profiles, []);
    expect(result.emergencyContactsRate).toBe(0);
  });

  it("handles non-compliant environmental checks", () => {
    const checks = [mkCheck({ overallCompliant: false }), mkCheck({ id: "esc-2", overallCompliant: true })];
    const result = evaluateSafetyPlanning([], checks);
    expect(result.environmentalComplianceRate).toBe(50);
  });

  it("handles mixed profiles", () => {
    const profiles = [
      mkProfile({ id: "rp-1", childId: "child-1" }),
      mkProfile({ id: "rp-2", childId: "child-2", childName: "Jordan", safetyPlanStatus: "not_in_place", copingStrategiesDocumented: [], emergencyContactsRecorded: false }),
    ];
    const result = evaluateSafetyPlanning(profiles, []);
    expect(result.safetyPlanInPlaceRate).toBe(50);
    expect(result.copingStrategiesRate).toBe(50);
    expect(result.emergencyContactsRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateSafetyPlanning([mkProfile()], [mkCheck()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "not_in_place", copingStrategiesDocumented: [], emergencyContactsRecorded: false })];
    const checks = [mkCheck({ overallCompliant: false })];
    const result = evaluateSafetyPlanning(profiles, checks);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("works with only checks, no profiles", () => {
    const checks = [mkCheck(), mkCheck({ id: "esc-2" })];
    const result = evaluateSafetyPlanning([], checks);
    expect(result.totalChecks).toBe(2);
    expect(result.environmentalComplianceRate).toBe(100);
  });

  it("works with only profiles, no checks", () => {
    const profiles = [mkProfile()];
    const result = evaluateSafetyPlanning(profiles, []);
    expect(result.totalProfiles).toBe(1);
    expect(result.environmentalComplianceRate).toBe(0);
  });
});

// ── evaluateIncidentResponse ─────────────────────────────────────────────

describe("evaluateIncidentResponse", () => {
  it("returns 25 for empty incidents (no incidents = excellent)", () => {
    const result = evaluateIncidentResponse([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalIncidents).toBe(0);
    expect(result.immediateActionRate).toBe(0);
    expect(result.medicalAssessmentRate).toBe(0);
    expect(result.debriefCompletedRate).toBe(0);
    expect(result.safetyPlanUpdatedRate).toBe(0);
  });

  it("scores high for well-managed incidents", () => {
    const incidents = [mkIncident()];
    const result = evaluateIncidentResponse(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.immediateActionRate).toBe(100);
    expect(result.medicalAssessmentRate).toBe(100);
    expect(result.debriefCompletedRate).toBe(100);
    expect(result.safetyPlanUpdatedRate).toBe(100);
  });

  it("scores low when immediate action not taken", () => {
    const incidents = [mkIncident({ immediateActionTaken: false })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.immediateActionRate).toBe(0);
    expect(result.overallScore).toBeLessThan(25);
  });

  it("scores low when medical assessment not completed", () => {
    const incidents = [mkIncident({ medicalAssessmentCompleted: false })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.medicalAssessmentRate).toBe(0);
  });

  it("scores low when debrief not completed", () => {
    const incidents = [mkIncident({ debriefCompleted: false })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.debriefCompletedRate).toBe(0);
  });

  it("scores low when safety plan not updated", () => {
    const incidents = [mkIncident({ safetyPlanUpdated: false })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.safetyPlanUpdatedRate).toBe(0);
  });

  it("handles mixed incident quality", () => {
    const incidents = [
      mkIncident({ id: "inc-1" }),
      mkIncident({ id: "inc-2", immediateActionTaken: false, debriefCompleted: false }),
    ];
    const result = evaluateIncidentResponse(incidents);
    expect(result.immediateActionRate).toBe(50);
    expect(result.debriefCompletedRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateIncidentResponse([mkIncident()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const incidents = [mkIncident({ immediateActionTaken: false, medicalAssessmentCompleted: false, debriefCompleted: false, safetyPlanUpdated: false })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("all-zero incident scores 0", () => {
    const incidents = [mkIncident({ immediateActionTaken: false, medicalAssessmentCompleted: false, debriefCompleted: false, safetyPlanUpdated: false })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.overallScore).toBe(0);
  });

  it("counts total incidents correctly", () => {
    const incidents = [mkIncident({ id: "inc-1" }), mkIncident({ id: "inc-2" }), mkIncident({ id: "inc-3" })];
    const result = evaluateIncidentResponse(incidents);
    expect(result.totalIncidents).toBe(3);
  });
});

// ── evaluateStaffCompetence ──────────────────────────────────────────────

describe("evaluateStaffCompetence", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffCompetence([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.selfHarmAwarenessRate).toBe(0);
    expect(result.riskAssessmentRate).toBe(0);
    expect(result.crisisInterventionRate).toBe(0);
    expect(result.safetyPlanningRate).toBe(0);
    expect(result.mentalHealthFirstAidRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "sht-2", staffId: "staff-2" })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.selfHarmAwarenessRate).toBe(100);
    expect(result.riskAssessmentRate).toBe(100);
    expect(result.crisisInterventionRate).toBe(100);
    expect(result.safetyPlanningRate).toBe(100);
    expect(result.mentalHealthFirstAidRate).toBe(100);
  });

  it("scores low for untrained staff", () => {
    const training = [mkTraining({
      selfHarmAwareness: false,
      riskAssessmentTrained: false,
      safetyPlanningTrained: false,
      crisisInterventionTrained: false,
      postventionTrained: false,
      mentalHealthFirstAid: false,
    })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial rates", () => {
    const training = [
      mkTraining({ id: "sht-1", staffId: "staff-1" }),
      mkTraining({ id: "sht-2", staffId: "staff-2", selfHarmAwareness: false, mentalHealthFirstAid: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.selfHarmAwarenessRate).toBe(50);
    expect(result.mentalHealthFirstAidRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffCompetence([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const training = [mkTraining({
      selfHarmAwareness: false,
      riskAssessmentTrained: false,
      safetyPlanningTrained: false,
      crisisInterventionTrained: false,
      postventionTrained: false,
      mentalHealthFirstAid: false,
    })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("counts total staff", () => {
    const training = [
      mkTraining({ id: "sht-1", staffId: "staff-1" }),
      mkTraining({ id: "sht-2", staffId: "staff-2" }),
      mkTraining({ id: "sht-3", staffId: "staff-3" }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.totalStaff).toBe(3);
  });

  it("handles single untrained dimension", () => {
    const training = [mkTraining({ crisisInterventionTrained: false })];
    const result = evaluateStaffCompetence(training);
    expect(result.crisisInterventionRate).toBe(0);
    expect(result.selfHarmAwarenessRate).toBe(100);
  });
});

// ── buildChildSelfHarmProfiles ──────────────────────────────────────────

describe("buildChildSelfHarmProfiles", () => {
  it("returns empty for no profiles", () => {
    expect(buildChildSelfHarmProfiles([], [])).toEqual([]);
  });

  it("creates one profile per child", () => {
    const profiles = [
      mkProfile({ id: "rp-1", childId: "child-1", childName: "Alex" }),
      mkProfile({ id: "rp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = buildChildSelfHarmProfiles(profiles, []);
    expect(result).toHaveLength(2);
  });

  it("populates risk level from profile", () => {
    const profiles = [mkProfile({ riskLevel: "high" })];
    const result = buildChildSelfHarmProfiles(profiles, []);
    expect(result[0].riskLevel).toBe("high");
  });

  it("populates safety plan status", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "overdue" })];
    const result = buildChildSelfHarmProfiles(profiles, []);
    expect(result[0].safetyPlanStatus).toBe("overdue");
  });

  it("counts incidents per child", () => {
    const profiles = [mkProfile({ childId: "child-1" })];
    const incidents = [
      mkIncident({ id: "inc-1", childId: "child-1" }),
      mkIncident({ id: "inc-2", childId: "child-1" }),
      mkIncident({ id: "inc-3", childId: "child-2" }),
    ];
    const result = buildChildSelfHarmProfiles(profiles, incidents);
    expect(result[0].incidentsInPeriod).toBe(2);
  });

  it("counts triggers identified", () => {
    const profiles = [mkProfile({ triggersIdentified: ["a", "b", "c"] })];
    const result = buildChildSelfHarmProfiles(profiles, []);
    expect(result[0].triggersIdentified).toBe(3);
  });

  it("counts coping strategies", () => {
    const profiles = [mkProfile({ copingStrategiesDocumented: ["x", "y"] })];
    const result = buildChildSelfHarmProfiles(profiles, []);
    expect(result[0].copingStrategies).toBe(2);
  });

  it("scores higher for current safety plan", () => {
    const current = buildChildSelfHarmProfiles([mkProfile({ safetyPlanStatus: "current" })], []);
    const overdue = buildChildSelfHarmProfiles([mkProfile({ safetyPlanStatus: "overdue" })], []);
    const notInPlace = buildChildSelfHarmProfiles([mkProfile({ safetyPlanStatus: "not_in_place" })], []);
    expect(current[0].overallScore).toBeGreaterThan(overdue[0].overallScore);
    expect(overdue[0].overallScore).toBeGreaterThan(notInPlace[0].overallScore);
  });

  it("scores higher for current review", () => {
    const current = buildChildSelfHarmProfiles([mkProfile({ reviewCurrent: true })], []);
    const notCurrent = buildChildSelfHarmProfiles([mkProfile({ reviewCurrent: false })], []);
    expect(current[0].overallScore).toBeGreaterThan(notCurrent[0].overallScore);
  });

  it("scores higher for more triggers identified", () => {
    const many = buildChildSelfHarmProfiles([mkProfile({ triggersIdentified: ["a", "b", "c"] })], []);
    const few = buildChildSelfHarmProfiles([mkProfile({ triggersIdentified: ["a"] })], []);
    const none = buildChildSelfHarmProfiles([mkProfile({ triggersIdentified: [] })], []);
    expect(many[0].overallScore).toBeGreaterThan(few[0].overallScore);
    expect(few[0].overallScore).toBeGreaterThan(none[0].overallScore);
  });

  it("scores higher for more coping strategies", () => {
    const many = buildChildSelfHarmProfiles([mkProfile({ copingStrategiesDocumented: ["a", "b", "c"] })], []);
    const few = buildChildSelfHarmProfiles([mkProfile({ copingStrategiesDocumented: ["a"] })], []);
    const none = buildChildSelfHarmProfiles([mkProfile({ copingStrategiesDocumented: [] })], []);
    expect(many[0].overallScore).toBeGreaterThan(few[0].overallScore);
    expect(few[0].overallScore).toBeGreaterThan(none[0].overallScore);
  });

  it("gives bonus for no incidents", () => {
    const noIncidents = buildChildSelfHarmProfiles([mkProfile()], []);
    const withUnmanagedIncident = buildChildSelfHarmProfiles(
      [mkProfile()],
      [mkIncident({ childId: "child-1", debriefCompleted: false, safetyPlanUpdated: false })],
    );
    expect(noIncidents[0].overallScore).toBeGreaterThan(withUnmanagedIncident[0].overallScore);
  });

  it("gives bonus for well-managed incidents", () => {
    const managed = buildChildSelfHarmProfiles(
      [mkProfile()],
      [mkIncident({ childId: "child-1", debriefCompleted: true, safetyPlanUpdated: true })],
    );
    const unmanaged = buildChildSelfHarmProfiles(
      [mkProfile()],
      [mkIncident({ childId: "child-1", debriefCompleted: false, safetyPlanUpdated: false })],
    );
    expect(managed[0].overallScore).toBeGreaterThan(unmanaged[0].overallScore);
  });

  it("score capped at 10", () => {
    const profiles = [mkProfile()];
    const result = buildChildSelfHarmProfiles(profiles, []);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("handles child with minimum data", () => {
    const profiles = [mkProfile({
      reviewCurrent: false,
      safetyPlanStatus: "not_in_place",
      triggersIdentified: [],
      copingStrategiesDocumented: [],
    })];
    const result = buildChildSelfHarmProfiles(profiles, [mkIncident({ childId: "child-1", debriefCompleted: false })]);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ── generateSelfHarmPreventionProtocolIntelligence ───────────────────────

describe("generateSelfHarmPreventionProtocolIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence(
      [mkProfile()], [mkIncident()], [mkCheck()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.riskAssessmentQuality.overallScore +
      result.safetyPlanning.overallScore +
      result.incidentResponse.overallScore +
      result.staffCompetence.overallScore,
    );
  });

  it("returns correct rating for all-empty data", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    // Empty: risk=0, safety=0, incident=25, staff=0 → 25 = inadequate
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const profiles = [
      mkProfile({ id: "rp-1", childId: "child-1", childName: "Alex" }),
      mkProfile({ id: "rp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const checks = [mkCheck(), mkCheck({ id: "esc-2" })];
    const training = [mkTraining(), mkTraining({ id: "sht-2", staffId: "staff-2" })];
    const result = generateSelfHarmPreventionProtocolIntelligence(
      profiles, [], checks, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence(
      [mkProfile()], [mkIncident()], [mkCheck()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("score never negative", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("populates homeId and period", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  // ── Strengths ──

  it("adds strength for risk assessments completed", () => {
    const profiles = [mkProfile()];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Risk assessments completed"))).toBe(true);
  });

  it("adds strength for current reviews", () => {
    const profiles = [mkProfile({ reviewCurrent: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("reviews are current"))).toBe(true);
  });

  it("adds strength for triggers identified", () => {
    const profiles = [mkProfile()];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Triggers identified"))).toBe(true);
  });

  it("adds strength for safety plans in place", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "current" })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Safety plans in place"))).toBe(true);
  });

  it("adds strength for no incidents", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No self-harm incidents"))).toBe(true);
  });

  it("adds strength for immediate action in all incidents", () => {
    const incidents = [mkIncident({ immediateActionTaken: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Immediate action taken"))).toBe(true);
  });

  it("adds strength for debrief after every incident", () => {
    const incidents = [mkIncident({ debriefCompleted: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Debrief completed"))).toBe(true);
  });

  it("adds strength for compliant environmental checks", () => {
    const checks = [mkCheck({ overallCompliant: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], checks, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("environmental safety checks fully compliant"))).toBe(true);
  });

  it("adds strength for all staff trained in awareness", () => {
    const training = [mkTraining()];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All staff trained in self-harm awareness"))).toBe(true);
  });

  it("adds strength for all staff trained in crisis intervention", () => {
    const training = [mkTraining()];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All staff trained in crisis intervention"))).toBe(true);
  });

  it("adds strength for mental health first aid", () => {
    const training = [mkTraining()];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("mental health first aid"))).toBe(true);
  });

  it("adds strength for emergency contacts", () => {
    const profiles = [mkProfile({ emergencyContactsRecorded: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Emergency contacts recorded"))).toBe(true);
  });

  it("adds strength for safety plans updated after incidents", () => {
    const incidents = [mkIncident({ safetyPlanUpdated: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Safety plans updated after every incident"))).toBe(true);
  });

  // ── Areas for Improvement ──

  it("adds area for no profiles", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No child risk profiles"))).toBe(true);
  });

  it("adds area for non-current reviews", () => {
    const profiles = [mkProfile({ reviewCurrent: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("reviews are not current"))).toBe(true);
  });

  it("adds area for missing triggers", () => {
    const profiles = [mkProfile({ triggersIdentified: [] })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Triggers not identified"))).toBe(true);
  });

  it("adds area for non-current safety plans", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "overdue" })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Safety plans not current"))).toBe(true);
  });

  it("adds area for no environmental checks", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No environmental safety checks"))).toBe(true);
  });

  it("adds area for no training", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff training records"))).toBe(true);
  });

  it("adds area for incomplete debrief", () => {
    const incidents = [mkIncident({ debriefCompleted: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Debrief not completed"))).toBe(true);
  });

  it("adds area for safety plan not updated after incidents", () => {
    const incidents = [mkIncident({ safetyPlanUpdated: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Safety plan not updated"))).toBe(true);
  });

  it("adds area for incomplete awareness training", () => {
    const training = [mkTraining({ selfHarmAwareness: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Self-harm awareness training incomplete"))).toBe(true);
  });

  it("adds area for incomplete mental health first aid", () => {
    const training = [mkTraining({ mentalHealthFirstAid: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Mental health first aid"))).toBe(true);
  });

  it("adds area for missing coping strategies", () => {
    const profiles = [mkProfile({ copingStrategiesDocumented: [] })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Coping strategies not documented"))).toBe(true);
  });

  it("adds area for non-compliant checks", () => {
    const checks = [mkCheck({ overallCompliant: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], checks, [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("non-compliant"))).toBe(true);
  });

  // ── Actions ──

  it("adds URGENT for no safety plan", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "not_in_place" })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("no safety plan"))).toBe(true);
  });

  it("adds URGENT for overdue safety plans", () => {
    const profiles = [mkProfile({ safetyPlanStatus: "overdue" })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("overdue"))).toBe(true);
  });

  it("adds URGENT for high risk without professional support", () => {
    const profiles = [mkProfile({ riskLevel: "high", professionalSupportInPlace: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("without professional support"))).toBe(true);
  });

  it("adds URGENT for very_high risk without professional support", () => {
    const profiles = [mkProfile({ riskLevel: "very_high", professionalSupportInPlace: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("without professional support"))).toBe(true);
  });

  it("adds URGENT for hospitalisation", () => {
    const incidents = [mkIncident({ interventionOutcome: "hospitalised" })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("hospitalisation"))).toBe(true);
  });

  it("adds action for no profiles", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Complete risk assessments"))).toBe(true);
  });

  it("adds action for outstanding debriefs", () => {
    const incidents = [mkIncident({ debriefCompleted: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence([], incidents, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Complete debrief"))).toBe(true);
  });

  it("adds action for no environmental checks", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("environmental safety checks"))).toBe(true);
  });

  it("adds action for no training", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("self-harm prevention training"))).toBe(true);
  });

  it("adds action for low crisis intervention training", () => {
    const training = [
      mkTraining({ id: "sht-1", staffId: "s1", crisisInterventionTrained: false }),
      mkTraining({ id: "sht-2", staffId: "s2", crisisInterventionTrained: false }),
    ];
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("crisis intervention training"))).toBe(true);
  });

  it("adds action for stale reviews", () => {
    const profiles = [mkProfile({ reviewCurrent: false })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("reviews up to date"))).toBe(true);
  });

  // ── Regulatory links ──

  it("includes all 7 regulatory links", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NICE Self-Harm"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
  });

  // ── Child Profiles ──

  it("builds child profiles from risk profiles", () => {
    const profiles = [
      mkProfile({ id: "rp-1", childId: "child-1", childName: "Alex" }),
      mkProfile({ id: "rp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generateSelfHarmPreventionProtocolIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("returns empty child profiles when no risk profiles", () => {
    const result = generateSelfHarmPreventionProtocolIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(0);
  });

  // ── Integration: Chamberlain House demo scenario ──

  it("handles Chamberlain House demo scenario", () => {
    const profiles = [
      mkProfile({ id: "rp-1", childId: "child-alex", childName: "Alex", riskLevel: "low", safetyPlanStatus: "current", reviewCurrent: true, triggersIdentified: ["anxiety"], copingStrategiesDocumented: ["breathing"], professionalSupportInPlace: true }),
      mkProfile({ id: "rp-2", childId: "child-jordan", childName: "Jordan", riskLevel: "medium", safetyPlanStatus: "current", reviewCurrent: true, triggersIdentified: ["peer conflict", "homesickness"], copingStrategiesDocumented: ["talk to keyworker", "journaling"], professionalSupportInPlace: true }),
      mkProfile({ id: "rp-3", childId: "child-morgan", childName: "Morgan", riskLevel: "low", safetyPlanStatus: "current", reviewCurrent: true, triggersIdentified: ["transitions"], copingStrategiesDocumented: ["music", "drawing"], professionalSupportInPlace: true }),
    ];
    const incidents = [
      mkIncident({ id: "inc-1", childId: "child-jordan", childName: "Jordan", selfHarmType: "cutting", severity: "low", interventionOutcome: "prevented", debriefCompleted: true, safetyPlanUpdated: true }),
    ];
    const checks = [
      mkCheck({ id: "esc-1" }),
      mkCheck({ id: "esc-2", checkDate: "2026-04-15" }),
      mkCheck({ id: "esc-3", checkDate: "2026-05-01" }),
    ];
    const training = [
      mkTraining({ id: "sht-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      mkTraining({ id: "sht-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      mkTraining({ id: "sht-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      mkTraining({ id: "sht-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];
    const result = generateSelfHarmPreventionProtocolIntelligence(
      profiles, incidents, checks, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.riskAssessmentQuality.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.safetyPlanning.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.incidentResponse.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.staffCompetence.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.rating).toBe("outstanding");
  });

  it("does not add URGENT for low-risk with support", () => {
    const profiles = [mkProfile({ riskLevel: "low", professionalSupportInPlace: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("without professional support"))).toBe(false);
  });

  it("does not add URGENT for high-risk with support", () => {
    const profiles = [mkProfile({ riskLevel: "high", professionalSupportInPlace: true })];
    const result = generateSelfHarmPreventionProtocolIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("without professional support"))).toBe(false);
  });
});
