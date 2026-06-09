import { describe, it, expect } from "vitest";
import {
  generateExclusionDisruptionManagementIntelligence,
  evaluatePreventionEffectiveness,
  evaluateEducationContinuity,
  evaluatePreventionPlanning,
  evaluateStaffReadiness,
  buildChildExclusionProfiles,
  pct,
  getRating,
  getExclusionTypeLabel,
  getDisruptionTypeLabel,
  getPreventionStrategyLabel,
  getReintegrationStatusLabel,
  getRatingLabel,
} from "../exclusion-disruption-management-engine";
import type {
  ExclusionRecord,
  DisruptionEpisode,
  PreventionPlan,
  StaffExclusionTraining,
} from "../exclusion-disruption-management-engine";

// -- Test Helpers -------------------------------------------------------------

function mkExclusion(overrides: Partial<ExclusionRecord> = {}): ExclusionRecord {
  return {
    id: "exc-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-04-10",
    exclusionType: "fixed_term",
    durationDays: 2,
    reason: "Disruptive behaviour",
    schoolName: "Riverside Academy",
    alternativeProvisionArranged: true,
    educationContinuityMaintained: true,
    reintegrationStatus: "successful",
    parentNotified: true,
    socialWorkerNotified: true,
    pepReviewed: true,
    ...overrides,
  };
}

function mkDisruption(overrides: Partial<DisruptionEpisode> = {}): DisruptionEpisode {
  return {
    id: "dis-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-03-25",
    disruptionType: "placement_at_risk",
    preventionStrategiesUsed: ["early_warning_meeting", "pep_review"],
    multiAgencyInvolved: true,
    outcomeResolved: true,
    lessonsIdentified: true,
    planUpdated: true,
    ...overrides,
  };
}

function mkPlan(overrides: Partial<PreventionPlan> = {}): PreventionPlan {
  return {
    id: "pp-1",
    childId: "child-1",
    childName: "Alex",
    planDate: "2026-02-15",
    earlyWarningSignsDocumented: true,
    triggersIdentified: true,
    strategiesAgreed: ["therapeutic_intervention", "restorative_practice"],
    schoolEngaged: true,
    reviewDate: "2026-05-15",
    reviewCurrent: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffExclusionTraining> = {}): StaffExclusionTraining {
  return {
    id: "set-1",
    staffId: "staff-1",
    staffName: "Staff A",
    exclusionGuidanceTrained: true,
    educationAdvocacy: true,
    alternativeProvision: true,
    reintegrationSupport: true,
    multiAgencyWorking: true,
    traumaInformedBehaviour: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds", () => expect(pct(1, 3)).toBe(33));
  it("full", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0/n", () => expect(pct(0, 10)).toBe(0));
  it("handles large values", () => expect(pct(999, 1000)).toBe(100));
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
  it("exclusion type labels", () => {
    expect(getExclusionTypeLabel("fixed_term")).toBe("Fixed Term");
    expect(getExclusionTypeLabel("permanent")).toBe("Permanent");
    expect(getExclusionTypeLabel("internal")).toBe("Internal");
    expect(getExclusionTypeLabel("informal")).toBe("Informal");
    expect(getExclusionTypeLabel("managed_move")).toBe("Managed Move");
  });

  it("disruption type labels", () => {
    expect(getDisruptionTypeLabel("school_exclusion")).toBe("School Exclusion");
    expect(getDisruptionTypeLabel("placement_at_risk")).toBe("Placement at Risk");
    expect(getDisruptionTypeLabel("unplanned_move")).toBe("Unplanned Move");
    expect(getDisruptionTypeLabel("emergency_placement")).toBe("Emergency Placement");
    expect(getDisruptionTypeLabel("placement_breakdown")).toBe("Placement Breakdown");
  });

  it("prevention strategy labels", () => {
    expect(getPreventionStrategyLabel("early_warning_meeting")).toBe("Early Warning Meeting");
    expect(getPreventionStrategyLabel("pep_review")).toBe("PEP Review");
    expect(getPreventionStrategyLabel("behaviour_support_plan")).toBe("Behaviour Support Plan");
    expect(getPreventionStrategyLabel("therapeutic_intervention")).toBe("Therapeutic Intervention");
    expect(getPreventionStrategyLabel("mediation")).toBe("Mediation");
    expect(getPreventionStrategyLabel("restorative_practice")).toBe("Restorative Practice");
    expect(getPreventionStrategyLabel("alternative_provision")).toBe("Alternative Provision");
  });

  it("reintegration status labels", () => {
    expect(getReintegrationStatusLabel("successful")).toBe("Successful");
    expect(getReintegrationStatusLabel("in_progress")).toBe("In Progress");
    expect(getReintegrationStatusLabel("failed")).toBe("Failed");
    expect(getReintegrationStatusLabel("not_applicable")).toBe("Not Applicable");
  });

  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluatePreventionEffectiveness ------------------------------------------

describe("evaluatePreventionEffectiveness", () => {
  it("returns 25 for no exclusions and no disruptions", () => {
    const result = evaluatePreventionEffectiveness([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalDisruptions).toBe(0);
    expect(result.totalExclusions).toBe(0);
  });

  it("scores well when disruptions are well-managed", () => {
    const disruptions = [mkDisruption()];
    const result = evaluatePreventionEffectiveness([], disruptions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.preventionStrategiesUsedRate).toBe(100);
    expect(result.multiAgencyInvolvedRate).toBe(100);
    expect(result.outcomesResolvedRate).toBe(100);
    expect(result.lessonsIdentifiedRate).toBe(100);
  });

  it("scores low when disruptions are poorly managed", () => {
    const disruptions = [
      mkDisruption({
        preventionStrategiesUsed: [],
        multiAgencyInvolved: false,
        outcomeResolved: false,
        lessonsIdentified: false,
      }),
    ];
    const result = evaluatePreventionEffectiveness([], disruptions);
    expect(result.overallScore).toBe(0);
  });

  it("counts exclusions", () => {
    const exclusions = [mkExclusion(), mkExclusion({ id: "exc-2" })];
    const result = evaluatePreventionEffectiveness(exclusions, []);
    expect(result.totalExclusions).toBe(2);
  });

  it("counts disruptions", () => {
    const disruptions = [mkDisruption(), mkDisruption({ id: "dis-2" }), mkDisruption({ id: "dis-3" })];
    const result = evaluatePreventionEffectiveness([], disruptions);
    expect(result.totalDisruptions).toBe(3);
  });

  it("handles mixed managed and unmanaged disruptions", () => {
    const disruptions = [
      mkDisruption({ id: "dis-1" }),
      mkDisruption({ id: "dis-2", preventionStrategiesUsed: [], multiAgencyInvolved: false, outcomeResolved: false, lessonsIdentified: false }),
    ];
    const result = evaluatePreventionEffectiveness([], disruptions);
    expect(result.preventionStrategiesUsedRate).toBe(50);
    expect(result.multiAgencyInvolvedRate).toBe(50);
    expect(result.outcomesResolvedRate).toBe(50);
    expect(result.lessonsIdentifiedRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluatePreventionEffectiveness([], [mkDisruption()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const disruptions = [mkDisruption({ preventionStrategiesUsed: [], multiAgencyInvolved: false, outcomeResolved: false, lessonsIdentified: false })];
    const result = evaluatePreventionEffectiveness([], disruptions);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("exclusions with no disruptions still score based on absence of disruptions", () => {
    const exclusions = [mkExclusion()];
    const result = evaluatePreventionEffectiveness(exclusions, []);
    // Has exclusions and no disruptions, so not the "clean" 25 path
    expect(result.overallScore).toBe(0);
    expect(result.totalExclusions).toBe(1);
  });
});

// -- evaluateEducationContinuity ----------------------------------------------

describe("evaluateEducationContinuity", () => {
  it("returns 25 for no exclusions", () => {
    const result = evaluateEducationContinuity([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalExclusions).toBe(0);
  });

  it("scores high for well-managed exclusions", () => {
    const exclusions = [mkExclusion()];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.alternativeProvisionRate).toBe(100);
    expect(result.educationContinuityRate).toBe(100);
    expect(result.pepReviewedRate).toBe(100);
    expect(result.reintegrationSuccessRate).toBe(100);
  });

  it("scores low for poorly-managed exclusions", () => {
    const exclusions = [
      mkExclusion({
        alternativeProvisionArranged: false,
        educationContinuityMaintained: false,
        pepReviewed: false,
        reintegrationStatus: "failed",
      }),
    ];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.overallScore).toBeLessThan(5);
    expect(result.alternativeProvisionRate).toBe(0);
    expect(result.educationContinuityRate).toBe(0);
  });

  it("handles not_applicable reintegration", () => {
    const exclusions = [mkExclusion({ reintegrationStatus: "not_applicable" })];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.reintegrationSuccessRate).toBe(0); // 0/0 = 0 via pct
  });

  it("calculates mixed exclusion rates", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", alternativeProvisionArranged: true, educationContinuityMaintained: true }),
      mkExclusion({ id: "exc-2", alternativeProvisionArranged: false, educationContinuityMaintained: false }),
    ];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.alternativeProvisionRate).toBe(50);
    expect(result.educationContinuityRate).toBe(50);
  });

  it("counts total exclusions", () => {
    const exclusions = [mkExclusion(), mkExclusion({ id: "exc-2" }), mkExclusion({ id: "exc-3" })];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.totalExclusions).toBe(3);
  });

  it("score capped at 25", () => {
    const result = evaluateEducationContinuity([mkExclusion()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("calculates reintegration rate excluding not_applicable", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", reintegrationStatus: "successful" }),
      mkExclusion({ id: "exc-2", reintegrationStatus: "not_applicable" }),
    ];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.reintegrationSuccessRate).toBe(100); // 1 success out of 1 applicable
  });

  it("reintegration in_progress not counted as success", () => {
    const exclusions = [mkExclusion({ reintegrationStatus: "in_progress" })];
    const result = evaluateEducationContinuity(exclusions);
    expect(result.reintegrationSuccessRate).toBe(0);
  });
});

// -- evaluatePreventionPlanning -----------------------------------------------

describe("evaluatePreventionPlanning", () => {
  it("returns 0 for no plans", () => {
    const result = evaluatePreventionPlanning([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPlans).toBe(0);
  });

  it("scores high for comprehensive plans", () => {
    const plans = [mkPlan()];
    const result = evaluatePreventionPlanning(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.plansExistRate).toBe(100);
    expect(result.triggersIdentifiedRate).toBe(100);
    expect(result.schoolEngagedRate).toBe(100);
    expect(result.reviewCurrentRate).toBe(100);
  });

  it("scores low for poor plans", () => {
    const plans = [
      mkPlan({
        triggersIdentified: false,
        schoolEngaged: false,
        reviewCurrent: false,
      }),
    ];
    const result = evaluatePreventionPlanning(plans);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.triggersIdentifiedRate).toBe(0);
    expect(result.schoolEngagedRate).toBe(0);
    expect(result.reviewCurrentRate).toBe(0);
  });

  it("calculates mixed plan rates", () => {
    const plans = [
      mkPlan({ id: "pp-1", triggersIdentified: true, schoolEngaged: true, reviewCurrent: true }),
      mkPlan({ id: "pp-2", triggersIdentified: false, schoolEngaged: false, reviewCurrent: false }),
    ];
    const result = evaluatePreventionPlanning(plans);
    expect(result.triggersIdentifiedRate).toBe(50);
    expect(result.schoolEngagedRate).toBe(50);
    expect(result.reviewCurrentRate).toBe(50);
  });

  it("counts total plans", () => {
    const plans = [mkPlan(), mkPlan({ id: "pp-2" }), mkPlan({ id: "pp-3" })];
    const result = evaluatePreventionPlanning(plans);
    expect(result.totalPlans).toBe(3);
  });

  it("plansExistRate is always 100 when plans exist", () => {
    const plans = [mkPlan({ triggersIdentified: false, schoolEngaged: false, reviewCurrent: false })];
    const result = evaluatePreventionPlanning(plans);
    expect(result.plansExistRate).toBe(100);
  });

  it("score capped at 25", () => {
    const result = evaluatePreventionPlanning([mkPlan()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const plans = [mkPlan({ triggersIdentified: false, schoolEngaged: false, reviewCurrent: false })];
    const result = evaluatePreventionPlanning(plans);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- evaluateStaffReadiness ---------------------------------------------------

describe("evaluateStaffReadiness", () => {
  it("returns 0 for no training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "set-2", staffId: "s2" })];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.exclusionGuidanceRate).toBe(100);
    expect(result.educationAdvocacyRate).toBe(100);
    expect(result.alternativeProvisionRate).toBe(100);
    expect(result.reintegrationRate).toBe(100);
    expect(result.multiAgencyRate).toBe(100);
    expect(result.traumaInformedRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [
      mkTraining({
        exclusionGuidanceTrained: false,
        educationAdvocacy: false,
        alternativeProvision: false,
        reintegrationSupport: false,
        multiAgencyWorking: false,
        traumaInformedBehaviour: false,
      }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial training rates", () => {
    const training = [
      mkTraining({ id: "set-1", staffId: "s1" }),
      mkTraining({ id: "set-2", staffId: "s2", exclusionGuidanceTrained: false, traumaInformedBehaviour: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.exclusionGuidanceRate).toBe(50);
    expect(result.traumaInformedRate).toBe(50);
    expect(result.educationAdvocacyRate).toBe(100);
  });

  it("counts total staff", () => {
    const training = [mkTraining(), mkTraining({ id: "set-2", staffId: "s2" }), mkTraining({ id: "set-3", staffId: "s3" })];
    const result = evaluateStaffReadiness(training);
    expect(result.totalStaff).toBe(3);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffReadiness([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score never negative", () => {
    const training = [mkTraining({ exclusionGuidanceTrained: false, educationAdvocacy: false, alternativeProvision: false, reintegrationSupport: false, multiAgencyWorking: false, traumaInformedBehaviour: false })];
    const result = evaluateStaffReadiness(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles single training dimension enabled", () => {
    const training = [
      mkTraining({
        exclusionGuidanceTrained: true,
        educationAdvocacy: false,
        alternativeProvision: false,
        reintegrationSupport: false,
        multiAgencyWorking: false,
        traumaInformedBehaviour: false,
      }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.exclusionGuidanceRate).toBe(100);
    expect(result.educationAdvocacyRate).toBe(0);
    expect(result.overallScore).toBeGreaterThan(0);
  });
});

// -- buildChildExclusionProfiles ----------------------------------------------

describe("buildChildExclusionProfiles", () => {
  it("returns empty for no exclusions and no plans", () => {
    expect(buildChildExclusionProfiles([], [])).toEqual([]);
  });

  it("creates profile from exclusion data", () => {
    const exclusions = [mkExclusion({ childId: "child-1", childName: "Alex" })];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-1");
    expect(profiles[0].childName).toBe("Alex");
    expect(profiles[0].exclusionCount).toBe(1);
  });

  it("creates profile from plan data alone", () => {
    const plans = [mkPlan({ childId: "child-1", childName: "Alex" })];
    const profiles = buildChildExclusionProfiles([], plans);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].childId).toBe("child-1");
    expect(profiles[0].exclusionCount).toBe(0);
    expect(profiles[0].hasPreventionPlan).toBe(true);
  });

  it("merges exclusion and plan data for same child", () => {
    const exclusions = [mkExclusion({ childId: "child-1", childName: "Alex" })];
    const plans = [mkPlan({ childId: "child-1", childName: "Alex" })];
    const profiles = buildChildExclusionProfiles(exclusions, plans);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].exclusionCount).toBe(1);
    expect(profiles[0].hasPreventionPlan).toBe(true);
  });

  it("groups multiple exclusions per child", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", childId: "child-1", durationDays: 2 }),
      mkExclusion({ id: "exc-2", childId: "child-1", durationDays: 3 }),
    ];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].exclusionCount).toBe(2);
    expect(profiles[0].totalExclusionDays).toBe(5);
  });

  it("counts total exclusion days", () => {
    const exclusions = [mkExclusion({ durationDays: 5 })];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles[0].totalExclusionDays).toBe(5);
  });

  it("detects prevention plan existence", () => {
    const plans = [mkPlan({ childId: "child-1" })];
    const profiles = buildChildExclusionProfiles([], plans);
    expect(profiles[0].hasPreventionPlan).toBe(true);
  });

  it("detects no prevention plan", () => {
    const exclusions = [mkExclusion({ childId: "child-1" })];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles[0].hasPreventionPlan).toBe(false);
  });

  it("detects prevention plan currency", () => {
    const plans = [mkPlan({ childId: "child-1", reviewCurrent: true })];
    const profiles = buildChildExclusionProfiles([], plans);
    expect(profiles[0].preventionPlanCurrent).toBe(true);
  });

  it("detects expired prevention plan", () => {
    const plans = [mkPlan({ childId: "child-1", reviewCurrent: false })];
    const profiles = buildChildExclusionProfiles([], plans);
    expect(profiles[0].preventionPlanCurrent).toBe(false);
  });

  it("returns latest reintegration status", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", childId: "child-1", date: "2026-03-01", reintegrationStatus: "successful" }),
      mkExclusion({ id: "exc-2", childId: "child-1", date: "2026-04-15", reintegrationStatus: "in_progress" }),
    ];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles[0].reintegrationStatus).toBe("in_progress");
  });

  it("returns null reintegration for no exclusions", () => {
    const plans = [mkPlan({ childId: "child-1" })];
    const profiles = buildChildExclusionProfiles([], plans);
    expect(profiles[0].reintegrationStatus).toBeNull();
  });

  it("creates separate profiles for multiple children", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", childId: "child-1", childName: "Alex" }),
      mkExclusion({ id: "exc-2", childId: "child-2", childName: "Jordan" }),
    ];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles).toHaveLength(2);
    expect(profiles.map((p) => p.childName).sort()).toEqual(["Alex", "Jordan"]);
  });

  it("gives higher score for zero exclusions with plan", () => {
    const plans = [mkPlan({ childId: "child-1", reviewCurrent: true })];
    const profilesWithPlan = buildChildExclusionProfiles([], plans);
    const exclusions = [mkExclusion({ childId: "child-2", childName: "Jordan", reintegrationStatus: "failed" })];
    const profilesWithExclusion = buildChildExclusionProfiles(exclusions, []);
    expect(profilesWithPlan[0].overallScore).toBeGreaterThan(profilesWithExclusion[0].overallScore);
  });

  it("score capped at 10", () => {
    const plans = [mkPlan({ childId: "child-1", reviewCurrent: true })];
    const profiles = buildChildExclusionProfiles([], plans);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score never negative", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", childId: "child-1", reintegrationStatus: "failed", educationContinuityMaintained: false }),
      mkExclusion({ id: "exc-2", childId: "child-1", reintegrationStatus: "failed", educationContinuityMaintained: false }),
      mkExclusion({ id: "exc-3", childId: "child-1", reintegrationStatus: "failed", educationContinuityMaintained: false }),
    ];
    const profiles = buildChildExclusionProfiles(exclusions, []);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- generateExclusionDisruptionManagementIntelligence -------------------------

describe("generateExclusionDisruptionManagementIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateExclusionDisruptionManagementIntelligence(
      [mkExclusion()], [mkDisruption()], [mkPlan()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.preventionEffectiveness.overallScore +
      result.educationContinuity.overallScore +
      result.preventionPlanning.overallScore +
      result.staffReadiness.overallScore,
    );
  });

  it("returns correct rating for zero data", () => {
    const result = generateExclusionDisruptionManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    // No exclusions/disruptions = 25+25 from prevention+continuity, but 0 plans + 0 training = 0+0
    expect(result.overallScore).toBe(50);
    expect(result.rating).toBe("requires_improvement");
  });

  it("returns outstanding for fully compliant home with no exclusions", () => {
    const plans = [mkPlan(), mkPlan({ id: "pp-2", childId: "child-2", childName: "Jordan" })];
    const training = [mkTraining(), mkTraining({ id: "set-2", staffId: "s2" })];
    const result = generateExclusionDisruptionManagementIntelligence(
      [], [], plans, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateExclusionDisruptionManagementIntelligence(
      [], [], [mkPlan()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateExclusionDisruptionManagementIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  it("builds child profiles", () => {
    const exclusions = [mkExclusion({ childId: "child-1", childName: "Alex" })];
    const plans = [mkPlan({ childId: "child-2", childName: "Jordan" })];
    const result = generateExclusionDisruptionManagementIntelligence(
      exclusions, [], plans, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for no exclusions or disruptions", () => {
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No exclusions or disruption episodes"))).toBe(true);
  });

  it("adds strength for no exclusions despite disruptions", () => {
    const disruptions = [mkDisruption()];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No school exclusions despite disruption episodes"))).toBe(true);
  });

  it("adds strength for all disruptions resolved", () => {
    const disruptions = [mkDisruption({ outcomeResolved: true })];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All disruption episodes resolved"))).toBe(true);
  });

  it("adds strength for multi-agency in all disruptions", () => {
    const disruptions = [mkDisruption({ multiAgencyInvolved: true })];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Multi-agency involvement"))).toBe(true);
  });

  it("adds strength for all plans current", () => {
    const plans = [mkPlan({ reviewCurrent: true })];
    const result = generateExclusionDisruptionManagementIntelligence([], [], plans, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All prevention plans are current"))).toBe(true);
  });

  it("adds strength for all staff trained in exclusion guidance", () => {
    const training = [mkTraining({ exclusionGuidanceTrained: true })];
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All staff trained in exclusion guidance"))).toBe(true);
  });

  it("adds strength for all staff trauma-informed", () => {
    const training = [mkTraining({ traumaInformedBehaviour: true })];
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("trauma-informed behaviour"))).toBe(true);
  });

  it("adds strength for alternative provision in all exclusions", () => {
    const exclusions = [mkExclusion({ alternativeProvisionArranged: true })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Alternative provision arranged for all exclusions"))).toBe(true);
  });

  it("adds strength for education continuity in all exclusions", () => {
    const exclusions = [mkExclusion({ educationContinuityMaintained: true })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Education continuity maintained"))).toBe(true);
  });

  it("adds strength for PEP reviewed in all exclusions", () => {
    const exclusions = [mkExclusion({ pepReviewed: true })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("PEP reviewed for all exclusion episodes"))).toBe(true);
  });

  it("adds strength for school engaged in all plans", () => {
    const plans = [mkPlan({ schoolEngaged: true })];
    const result = generateExclusionDisruptionManagementIntelligence([], [], plans, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("School engaged in all prevention plans"))).toBe(true);
  });

  it("adds strength for prevention strategies in all disruptions", () => {
    const disruptions = [mkDisruption({ preventionStrategiesUsed: ["pep_review"] })];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Prevention strategies used in all disruption"))).toBe(true);
  });

  // -- Areas for improvement --

  it("adds area for no prevention plans", () => {
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No prevention plans documented"))).toBe(true);
  });

  it("adds area for no staff training", () => {
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff training records"))).toBe(true);
  });

  it("adds area for alternative provision gaps", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", alternativeProvisionArranged: true }),
      mkExclusion({ id: "exc-2", alternativeProvisionArranged: false }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Alternative provision not arranged"))).toBe(true);
  });

  it("adds area for PEP review gaps", () => {
    const exclusions = [
      mkExclusion({ id: "exc-1", pepReviewed: true }),
      mkExclusion({ id: "exc-2", pepReviewed: false }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("PEP not reviewed"))).toBe(true);
  });

  it("adds area for low multi-agency involvement", () => {
    const disruptions = [
      mkDisruption({ id: "dis-1", multiAgencyInvolved: true }),
      mkDisruption({ id: "dis-2", multiAgencyInvolved: false }),
      mkDisruption({ id: "dis-3", multiAgencyInvolved: false }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Multi-agency involvement"))).toBe(true);
  });

  it("adds area for overdue prevention plan reviews", () => {
    const plans = [
      mkPlan({ id: "pp-1", reviewCurrent: true }),
      mkPlan({ id: "pp-2", reviewCurrent: false }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence([], [], plans, [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("overdue for review"))).toBe(true);
  });

  it("adds area for low trauma-informed training", () => {
    const training = [
      mkTraining({ id: "set-1", staffId: "s1", traumaInformedBehaviour: false }),
      mkTraining({ id: "set-2", staffId: "s2", traumaInformedBehaviour: false }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("trauma-informed behaviour"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for permanent exclusions", () => {
    const exclusions = [mkExclusion({ exclusionType: "permanent" })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("permanent exclusion"))).toBe(true);
  });

  it("adds URGENT for unresolved disruptions", () => {
    const disruptions = [mkDisruption({ outcomeResolved: false })];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("unresolved disruption"))).toBe(true);
  });

  it("adds URGENT for failed reintegrations", () => {
    const exclusions = [mkExclusion({ reintegrationStatus: "failed" })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("failed reintegration"))).toBe(true);
  });

  it("adds URGENT for unnotified social worker", () => {
    const exclusions = [mkExclusion({ socialWorkerNotified: false })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("Social worker not notified"))).toBe(true);
  });

  it("adds action for no prevention plans", () => {
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Develop prevention plans"))).toBe(true);
  });

  it("adds action for missing alternative provision", () => {
    const exclusions = [mkExclusion({ alternativeProvisionArranged: false })];
    const result = generateExclusionDisruptionManagementIntelligence(exclusions, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Arrange alternative provision"))).toBe(true);
  });

  it("adds action for low exclusion guidance training", () => {
    const training = [
      mkTraining({ id: "set-1", staffId: "s1", exclusionGuidanceTrained: false }),
      mkTraining({ id: "set-2", staffId: "s2", exclusionGuidanceTrained: false }),
      mkTraining({ id: "set-3", staffId: "s3", exclusionGuidanceTrained: true }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("exclusion guidance training"))).toBe(true);
  });

  it("adds action for lessons not identified", () => {
    const disruptions = [mkDisruption({ lessonsIdentified: false })];
    const result = generateExclusionDisruptionManagementIntelligence([], disruptions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("lessons are identified"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateExclusionDisruptionManagementIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("Education Act 2002"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 8"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Virtual School Head"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SEN Code of Practice 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 28"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 29"))).toBe(true);
  });

  // -- Integration --

  it("handles Chamberlain House demo scenario", () => {
    const exclusions: ExclusionRecord[] = [
      mkExclusion({
        id: "exc-1",
        childId: "child-jordan",
        childName: "Jordan",
        date: "2026-04-10",
        exclusionType: "fixed_term",
        durationDays: 2,
        reason: "Persistent disruptive behaviour",
        schoolName: "Riverside Academy",
        alternativeProvisionArranged: true,
        educationContinuityMaintained: true,
        reintegrationStatus: "in_progress",
        parentNotified: true,
        socialWorkerNotified: true,
        pepReviewed: true,
      }),
    ];
    const disruptions: DisruptionEpisode[] = [
      mkDisruption({
        id: "dis-1",
        childId: "child-jordan",
        childName: "Jordan",
        date: "2026-03-25",
        disruptionType: "placement_at_risk",
        preventionStrategiesUsed: ["early_warning_meeting", "pep_review", "behaviour_support_plan"],
        multiAgencyInvolved: true,
        outcomeResolved: true,
        lessonsIdentified: true,
        planUpdated: true,
      }),
    ];
    const plans: PreventionPlan[] = [
      mkPlan({ id: "pp-1", childId: "child-alex", childName: "Alex", schoolEngaged: true, reviewCurrent: true }),
      mkPlan({ id: "pp-2", childId: "child-jordan", childName: "Jordan", schoolEngaged: true, reviewCurrent: true }),
      mkPlan({ id: "pp-3", childId: "child-morgan", childName: "Morgan", schoolEngaged: true, reviewCurrent: true }),
    ];
    const training: StaffExclusionTraining[] = [
      mkTraining({ id: "set-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      mkTraining({ id: "set-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      mkTraining({ id: "set-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      mkTraining({ id: "set-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];
    const result = generateExclusionDisruptionManagementIntelligence(
      exclusions, disruptions, plans, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.homeId).toBe("oak-house");
  });

  it("handles all empty arrays gracefully", () => {
    const result = generateExclusionDisruptionManagementIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toEqual([]);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.rating).toBeDefined();
  });

  it("handles many exclusions scenario", () => {
    const exclusions = Array.from({ length: 10 }, (_, i) =>
      mkExclusion({
        id: `exc-${i}`,
        childId: `child-${i % 3}`,
        childName: ["Alex", "Jordan", "Morgan"][i % 3],
        exclusionType: i === 0 ? "permanent" : "fixed_term",
        reintegrationStatus: i === 0 ? "failed" : "successful",
        socialWorkerNotified: i !== 1,
      }),
    );
    const result = generateExclusionDisruptionManagementIntelligence(
      exclusions, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("permanent"))).toBe(true);
    expect(result.actions.some((a) => a.includes("failed reintegration"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Social worker not notified"))).toBe(true);
  });
});
