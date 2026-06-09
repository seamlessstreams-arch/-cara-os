import { describe, it, expect } from "vitest";
import {
  generateLanguageCommunicationSupportIntelligence,
  evaluateNeedsAssessment,
  evaluateSupportProvision,
  evaluateEnvironmentAccessibility,
  evaluateStaffCompetence,
  buildChildCommunicationProfiles,
  pct,
  getRating,
  getCommunicationNeedLabel,
  getSupportTypeLabel,
  getSupportQualityLabel,
  getReviewStatusLabel,
  getRatingLabel,
} from "../language-communication-support-engine";
import type {
  ChildCommunicationProfile,
  CommunicationSupportSession,
  CommunicationAudit,
  StaffCommunicationTraining,
} from "../language-communication-support-engine";

// -- Test Helpers -------------------------------------------------------------

function mkProfile(overrides: Partial<ChildCommunicationProfile> = {}): ChildCommunicationProfile {
  return {
    id: "cp-1",
    childId: "child-1",
    childName: "Alex",
    communicationNeed: "autism_spectrum",
    communicationPlanExists: true,
    planReviewStatus: "current",
    preferredCommunicationMethod: "AAC device",
    interpreterRequired: false,
    interpreterAvailable: false,
    augmentativeDeviceNeeded: true,
    augmentativeDeviceProvided: true,
    ...overrides,
  };
}

function mkSession(overrides: Partial<CommunicationSupportSession> = {}): CommunicationSupportSession {
  return {
    id: "cs-1",
    childId: "child-1",
    childName: "Alex",
    date: "2026-04-15",
    supportType: "augmentative_device",
    quality: "good",
    childEngaged: true,
    childProgressNoted: true,
    facilitatedBy: "Sarah Johnson",
    duration: 45,
    ...overrides,
  };
}

function mkAudit(overrides: Partial<CommunicationAudit> = {}): CommunicationAudit {
  return {
    id: "ca-1",
    auditDate: "2026-04-01",
    auditedBy: "Darren Laville",
    easyReadMaterialsAvailable: true,
    visualAidsPresent: true,
    signageAccessible: true,
    staffCommunicationAwareness: true,
    childViewsSoughtAccessibly: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffCommunicationTraining> = {}): StaffCommunicationTraining {
  return {
    id: "ct-1",
    staffId: "staff-1",
    staffName: "Staff A",
    communicationNeedsAwareness: true,
    signLanguageBasics: true,
    augmentativeDeviceTrained: true,
    easyReadTrained: true,
    autismCommunication: true,
    interpreterWorkingTrained: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds correctly", () => expect(pct(1, 3)).toBe(33));
  it("full percentage", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0/n", () => expect(pct(0, 10)).toBe(0));
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
  it("communication need labels", () => {
    expect(getCommunicationNeedLabel("speech_delay")).toBe("Speech Delay");
    expect(getCommunicationNeedLabel("english_additional_language")).toBe("English as Additional Language");
    expect(getCommunicationNeedLabel("hearing_impairment")).toBe("Hearing Impairment");
    expect(getCommunicationNeedLabel("autism_spectrum")).toBe("Autism Spectrum");
    expect(getCommunicationNeedLabel("selective_mutism")).toBe("Selective Mutism");
    expect(getCommunicationNeedLabel("learning_disability")).toBe("Learning Disability");
    expect(getCommunicationNeedLabel("visual_impairment")).toBe("Visual Impairment");
    expect(getCommunicationNeedLabel("none")).toBe("None");
  });

  it("support type labels", () => {
    expect(getSupportTypeLabel("speech_therapy")).toBe("Speech Therapy");
    expect(getSupportTypeLabel("interpreter")).toBe("Interpreter");
    expect(getSupportTypeLabel("augmentative_device")).toBe("Augmentative Device");
    expect(getSupportTypeLabel("visual_aids")).toBe("Visual Aids");
    expect(getSupportTypeLabel("sign_language")).toBe("Sign Language");
    expect(getSupportTypeLabel("easy_read")).toBe("Easy Read");
    expect(getSupportTypeLabel("social_stories")).toBe("Social Stories");
    expect(getSupportTypeLabel("communication_passport")).toBe("Communication Passport");
  });

  it("support quality labels", () => {
    expect(getSupportQualityLabel("excellent")).toBe("Excellent");
    expect(getSupportQualityLabel("good")).toBe("Good");
    expect(getSupportQualityLabel("adequate")).toBe("Adequate");
    expect(getSupportQualityLabel("poor")).toBe("Poor");
  });

  it("review status labels", () => {
    expect(getReviewStatusLabel("current")).toBe("Current");
    expect(getReviewStatusLabel("overdue")).toBe("Overdue");
    expect(getReviewStatusLabel("not_applicable")).toBe("Not Applicable");
  });

  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateNeedsAssessment --------------------------------------------------

describe("evaluateNeedsAssessment", () => {
  it("returns 0 for empty profiles", () => {
    const result = evaluateNeedsAssessment([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalProfiles).toBe(0);
    expect(result.communicationPlanRate).toBe(0);
    expect(result.planCurrentRate).toBe(0);
    expect(result.interpreterAvailableRate).toBe(0);
    expect(result.deviceProvidedRate).toBe(0);
  });

  it("scores high for all plans in place and current", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1" }),
      mkProfile({ id: "cp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.overallScore).toBeGreaterThanOrEqual(10);
    expect(result.communicationPlanRate).toBe(100);
    expect(result.planCurrentRate).toBe(100);
  });

  it("scores low when no plans exist", () => {
    const profiles = [mkProfile({ communicationPlanExists: false, planReviewStatus: "overdue" })];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.communicationPlanRate).toBe(0);
    expect(result.overallScore).toBeLessThan(15);
  });

  it("tracks interpreter availability rate", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", interpreterRequired: true, interpreterAvailable: true }),
      mkProfile({ id: "cp-2", childId: "child-2", interpreterRequired: true, interpreterAvailable: false }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.interpreterAvailableRate).toBe(50);
  });

  it("returns 0 interpreter rate when none required", () => {
    const profiles = [mkProfile({ interpreterRequired: false, interpreterAvailable: false })];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.interpreterAvailableRate).toBe(0);
  });

  it("tracks device provision rate", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", augmentativeDeviceNeeded: true, augmentativeDeviceProvided: true }),
      mkProfile({ id: "cp-2", childId: "child-2", augmentativeDeviceNeeded: true, augmentativeDeviceProvided: false }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.deviceProvidedRate).toBe(50);
  });

  it("returns 0 device rate when none needed", () => {
    const profiles = [mkProfile({ augmentativeDeviceNeeded: false, augmentativeDeviceProvided: false })];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.deviceProvidedRate).toBe(0);
  });

  it("handles mix of needs and no-needs children", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", communicationNeed: "none", communicationPlanExists: false, planReviewStatus: "not_applicable" }),
      mkProfile({ id: "cp-2", childId: "child-2", communicationNeed: "autism_spectrum", communicationPlanExists: true }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.totalProfiles).toBe(2);
    expect(result.communicationPlanRate).toBe(100); // 1 plan for 1 child with needs
  });

  it("handles overdue plan reviews", () => {
    const profiles = [mkProfile({ planReviewStatus: "overdue" })];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.planCurrentRate).toBe(0);
  });

  it("score capped at 25", () => {
    const profiles = [mkProfile({ interpreterRequired: true, interpreterAvailable: true })];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("full interpreter and device availability gives max related score", () => {
    const profiles = [
      mkProfile({
        interpreterRequired: true,
        interpreterAvailable: true,
        augmentativeDeviceNeeded: true,
        augmentativeDeviceProvided: true,
      }),
    ];
    const result = evaluateNeedsAssessment(profiles);
    expect(result.interpreterAvailableRate).toBe(100);
    expect(result.deviceProvidedRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });
});

// -- evaluateSupportProvision -------------------------------------------------

describe("evaluateSupportProvision", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateSupportProvision([], 2);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.qualityGoodPlusRate).toBe(0);
    expect(result.childEngagedRate).toBe(0);
    expect(result.progressNotedRate).toBe(0);
    expect(result.averageSessionsPerChild).toBe(0);
  });

  it("scores high for all good+ quality sessions", () => {
    const sessions = [
      mkSession({ id: "cs-1", quality: "excellent" }),
      mkSession({ id: "cs-2", quality: "good" }),
    ];
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.qualityGoodPlusRate).toBe(100);
    expect(result.overallScore).toBeGreaterThanOrEqual(15);
  });

  it("scores low for poor quality sessions", () => {
    const sessions = [
      mkSession({ quality: "poor", childEngaged: false, childProgressNoted: false }),
    ];
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.qualityGoodPlusRate).toBe(0);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("tracks child engagement rate", () => {
    const sessions = [
      mkSession({ id: "cs-1", childEngaged: true }),
      mkSession({ id: "cs-2", childEngaged: false }),
    ];
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.childEngagedRate).toBe(50);
  });

  it("tracks progress noted rate", () => {
    const sessions = [
      mkSession({ id: "cs-1", childProgressNoted: true }),
      mkSession({ id: "cs-2", childProgressNoted: false }),
      mkSession({ id: "cs-3", childProgressNoted: true }),
    ];
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.progressNotedRate).toBe(67);
  });

  it("calculates average sessions per child", () => {
    const sessions = [
      mkSession({ id: "cs-1", childId: "child-1" }),
      mkSession({ id: "cs-2", childId: "child-1" }),
      mkSession({ id: "cs-3", childId: "child-2" }),
      mkSession({ id: "cs-4", childId: "child-2" }),
    ];
    const result = evaluateSupportProvision(sessions, 2);
    expect(result.averageSessionsPerChild).toBe(2);
  });

  it("gives higher score for more sessions per child", () => {
    const fewSessions = [mkSession({ id: "cs-1" })];
    const manySessions = Array.from({ length: 8 }, (_, i) => mkSession({ id: `cs-${i}` }));
    const fewResult = evaluateSupportProvision(fewSessions, 2);
    const manyResult = evaluateSupportProvision(manySessions, 2);
    expect(manyResult.overallScore).toBeGreaterThan(fewResult.overallScore);
  });

  it("returns 0 average sessions when profileCount is 0", () => {
    const sessions = [mkSession()];
    const result = evaluateSupportProvision(sessions, 0);
    expect(result.averageSessionsPerChild).toBe(0);
  });

  it("score capped at 25", () => {
    const sessions = Array.from({ length: 20 }, (_, i) => mkSession({ id: `cs-${i}` }));
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles adequate quality separately", () => {
    const sessions = [mkSession({ quality: "adequate" })];
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.qualityGoodPlusRate).toBe(0);
  });

  it("counts excellent as good+", () => {
    const sessions = [mkSession({ quality: "excellent" })];
    const result = evaluateSupportProvision(sessions, 1);
    expect(result.qualityGoodPlusRate).toBe(100);
  });
});

// -- evaluateEnvironmentAccessibility -----------------------------------------

describe("evaluateEnvironmentAccessibility", () => {
  it("returns 0 for empty audits", () => {
    const result = evaluateEnvironmentAccessibility([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
    expect(result.easyReadRate).toBe(0);
    expect(result.visualAidsRate).toBe(0);
    expect(result.signageAccessibleRate).toBe(0);
    expect(result.childViewsAccessibleRate).toBe(0);
  });

  it("scores high for fully accessible environment", () => {
    const audits = [mkAudit(), mkAudit({ id: "ca-2" })];
    const result = evaluateEnvironmentAccessibility(audits);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.easyReadRate).toBe(100);
    expect(result.visualAidsRate).toBe(100);
    expect(result.signageAccessibleRate).toBe(100);
    expect(result.childViewsAccessibleRate).toBe(100);
  });

  it("scores low for non-accessible environment", () => {
    const audits = [mkAudit({
      easyReadMaterialsAvailable: false,
      visualAidsPresent: false,
      signageAccessible: false,
      childViewsSoughtAccessibly: false,
    })];
    const result = evaluateEnvironmentAccessibility(audits);
    expect(result.overallScore).toBe(0);
  });

  it("handles mixed audit results", () => {
    const audits = [
      mkAudit({ id: "ca-1" }),
      mkAudit({ id: "ca-2", easyReadMaterialsAvailable: false, visualAidsPresent: false }),
    ];
    const result = evaluateEnvironmentAccessibility(audits);
    expect(result.easyReadRate).toBe(50);
    expect(result.visualAidsRate).toBe(50);
    expect(result.signageAccessibleRate).toBe(100);
    expect(result.childViewsAccessibleRate).toBe(100);
  });

  it("calculates easy read rate correctly", () => {
    const audits = [
      mkAudit({ id: "ca-1", easyReadMaterialsAvailable: true }),
      mkAudit({ id: "ca-2", easyReadMaterialsAvailable: false }),
      mkAudit({ id: "ca-3", easyReadMaterialsAvailable: true }),
    ];
    const result = evaluateEnvironmentAccessibility(audits);
    expect(result.easyReadRate).toBe(67);
  });

  it("score capped at 25", () => {
    const result = evaluateEnvironmentAccessibility([mkAudit()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total audits", () => {
    const audits = [mkAudit({ id: "ca-1" }), mkAudit({ id: "ca-2" }), mkAudit({ id: "ca-3" })];
    const result = evaluateEnvironmentAccessibility(audits);
    expect(result.totalAudits).toBe(3);
  });
});

// -- evaluateStaffCompetence --------------------------------------------------

describe("evaluateStaffCompetence", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffCompetence([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.awarenessRate).toBe(0);
    expect(result.signLanguageRate).toBe(0);
    expect(result.augmentativeDeviceRate).toBe(0);
    expect(result.easyReadRate).toBe(0);
    expect(result.autismCommunicationRate).toBe(0);
    expect(result.interpreterWorkingRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "ct-2", staffId: "s2" })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.awarenessRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const training = [mkTraining({
      communicationNeedsAwareness: false,
      signLanguageBasics: false,
      augmentativeDeviceTrained: false,
      easyReadTrained: false,
      autismCommunication: false,
      interpreterWorkingTrained: false,
    })];
    const result = evaluateStaffCompetence(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates partial awareness rate", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1" }),
      mkTraining({ id: "ct-2", staffId: "s2", communicationNeedsAwareness: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.awarenessRate).toBe(50);
  });

  it("calculates sign language rate", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", signLanguageBasics: true }),
      mkTraining({ id: "ct-2", staffId: "s2", signLanguageBasics: false }),
      mkTraining({ id: "ct-3", staffId: "s3", signLanguageBasics: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.signLanguageRate).toBe(33);
  });

  it("calculates augmentative device training rate", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", augmentativeDeviceTrained: true }),
      mkTraining({ id: "ct-2", staffId: "s2", augmentativeDeviceTrained: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.augmentativeDeviceRate).toBe(50);
  });

  it("calculates easy read rate", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", easyReadTrained: true }),
      mkTraining({ id: "ct-2", staffId: "s2", easyReadTrained: true }),
      mkTraining({ id: "ct-3", staffId: "s3", easyReadTrained: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.easyReadRate).toBe(67);
  });

  it("calculates autism communication rate", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", autismCommunication: true }),
      mkTraining({ id: "ct-2", staffId: "s2", autismCommunication: false }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.autismCommunicationRate).toBe(50);
  });

  it("calculates interpreter working rate", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", interpreterWorkingTrained: true }),
      mkTraining({ id: "ct-2", staffId: "s2", interpreterWorkingTrained: false }),
      mkTraining({ id: "ct-3", staffId: "s3", interpreterWorkingTrained: false }),
      mkTraining({ id: "ct-4", staffId: "s4", interpreterWorkingTrained: true }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.interpreterWorkingRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffCompetence([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts total staff", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1" }),
      mkTraining({ id: "ct-2", staffId: "s2" }),
      mkTraining({ id: "ct-3", staffId: "s3" }),
    ];
    const result = evaluateStaffCompetence(training);
    expect(result.totalStaff).toBe(3);
  });
});

// -- buildChildCommunicationProfiles ------------------------------------------

describe("buildChildCommunicationProfiles", () => {
  it("returns empty for no profiles", () => {
    expect(buildChildCommunicationProfiles([], [])).toEqual([]);
  });

  it("creates profile for each child", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", childName: "Alex" }),
      mkProfile({ id: "cp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = buildChildCommunicationProfiles(profiles, []);
    expect(result).toHaveLength(2);
    expect(result[0].childName).toBe("Alex");
    expect(result[1].childName).toBe("Jordan");
  });

  it("tracks communication need", () => {
    const profiles = [mkProfile({ communicationNeed: "hearing_impairment" })];
    const result = buildChildCommunicationProfiles(profiles, []);
    expect(result[0].communicationNeed).toBe("hearing_impairment");
  });

  it("tracks plan existence", () => {
    const withPlan = [mkProfile({ communicationPlanExists: true })];
    const withoutPlan = [mkProfile({ communicationPlanExists: false })];
    expect(buildChildCommunicationProfiles(withPlan, [])[0].hasPlan).toBe(true);
    expect(buildChildCommunicationProfiles(withoutPlan, [])[0].hasPlan).toBe(false);
  });

  it("tracks plan currency", () => {
    const current = [mkProfile({ planReviewStatus: "current" })];
    const overdue = [mkProfile({ planReviewStatus: "overdue" })];
    expect(buildChildCommunicationProfiles(current, [])[0].planCurrent).toBe(true);
    expect(buildChildCommunicationProfiles(overdue, [])[0].planCurrent).toBe(false);
  });

  it("tracks interpreter needs met", () => {
    const met = [mkProfile({ interpreterRequired: true, interpreterAvailable: true })];
    const unmet = [mkProfile({ interpreterRequired: true, interpreterAvailable: false })];
    const notNeeded = [mkProfile({ interpreterRequired: false, interpreterAvailable: false })];
    expect(buildChildCommunicationProfiles(met, [])[0].interpreterMet).toBe(true);
    expect(buildChildCommunicationProfiles(unmet, [])[0].interpreterMet).toBe(false);
    expect(buildChildCommunicationProfiles(notNeeded, [])[0].interpreterMet).toBe(true);
  });

  it("tracks device needs met", () => {
    const met = [mkProfile({ augmentativeDeviceNeeded: true, augmentativeDeviceProvided: true })];
    const unmet = [mkProfile({ augmentativeDeviceNeeded: true, augmentativeDeviceProvided: false })];
    const notNeeded = [mkProfile({ augmentativeDeviceNeeded: false, augmentativeDeviceProvided: false })];
    expect(buildChildCommunicationProfiles(met, [])[0].deviceMet).toBe(true);
    expect(buildChildCommunicationProfiles(unmet, [])[0].deviceMet).toBe(false);
    expect(buildChildCommunicationProfiles(notNeeded, [])[0].deviceMet).toBe(true);
  });

  it("counts sessions in period per child", () => {
    const profiles = [mkProfile({ childId: "child-1" })];
    const sessions = [
      mkSession({ id: "cs-1", childId: "child-1" }),
      mkSession({ id: "cs-2", childId: "child-1" }),
      mkSession({ id: "cs-3", childId: "child-2" }),
    ];
    const result = buildChildCommunicationProfiles(profiles, sessions);
    expect(result[0].sessionsInPeriod).toBe(2);
  });

  it("gives higher score for children with no communication needs", () => {
    const noNeeds = [mkProfile({ communicationNeed: "none", communicationPlanExists: false, planReviewStatus: "not_applicable", augmentativeDeviceNeeded: false, augmentativeDeviceProvided: false })];
    const result = buildChildCommunicationProfiles(noNeeds, []);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(5);
  });

  it("gives lower score for unmet needs", () => {
    const unmet = [mkProfile({
      communicationPlanExists: false,
      planReviewStatus: "overdue",
      augmentativeDeviceNeeded: true,
      augmentativeDeviceProvided: false,
    })];
    const met = [mkProfile({
      communicationPlanExists: true,
      planReviewStatus: "current",
      augmentativeDeviceNeeded: true,
      augmentativeDeviceProvided: true,
    })];
    const unmetResult = buildChildCommunicationProfiles(unmet, []);
    const metResult = buildChildCommunicationProfiles(met, []);
    expect(metResult[0].overallScore).toBeGreaterThan(unmetResult[0].overallScore);
  });

  it("score capped at 10", () => {
    const profiles = [mkProfile()];
    const sessions = Array.from({ length: 10 }, (_, i) => mkSession({ id: `cs-${i}`, childId: "child-1" }));
    const result = buildChildCommunicationProfiles(profiles, sessions);
    expect(result[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("accounts for session engagement in score", () => {
    const profiles = [mkProfile()];
    const engaged = [mkSession({ id: "cs-1", childId: "child-1", childEngaged: true })];
    const notEngaged = [mkSession({ id: "cs-1", childId: "child-1", childEngaged: false })];
    const engagedResult = buildChildCommunicationProfiles(profiles, engaged);
    const notEngagedResult = buildChildCommunicationProfiles(profiles, notEngaged);
    expect(engagedResult[0].overallScore).toBeGreaterThanOrEqual(notEngagedResult[0].overallScore);
  });

  it("accounts for session quality in score", () => {
    const profiles = [mkProfile()];
    const excellent = [mkSession({ id: "cs-1", childId: "child-1", quality: "excellent" })];
    const poor = [mkSession({ id: "cs-1", childId: "child-1", quality: "poor" })];
    const excellentResult = buildChildCommunicationProfiles(profiles, excellent);
    const poorResult = buildChildCommunicationProfiles(profiles, poor);
    expect(excellentResult[0].overallScore).toBeGreaterThanOrEqual(poorResult[0].overallScore);
  });
});

// -- generateLanguageCommunicationSupportIntelligence -------------------------

describe("generateLanguageCommunicationSupportIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateLanguageCommunicationSupportIntelligence(
      [mkProfile()], [mkSession()], [mkAudit()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.needsAssessment.overallScore +
      result.supportProvision.overallScore +
      result.environmentAccessibility.overallScore +
      result.staffCompetence.overallScore,
    );
  });

  it("returns inadequate with no data", () => {
    const result = generateLanguageCommunicationSupportIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", interpreterRequired: true, interpreterAvailable: true }),
      mkProfile({ id: "cp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const sessions = Array.from({ length: 10 }, (_, i) => mkSession({ id: `cs-${i}` }));
    const audits = [mkAudit(), mkAudit({ id: "ca-2" })];
    const training = [mkTraining(), mkTraining({ id: "ct-2", staffId: "s2" })];
    const result = generateLanguageCommunicationSupportIntelligence(
      profiles, sessions, audits, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generateLanguageCommunicationSupportIntelligence(
      [mkProfile()], [mkSession()], [mkAudit()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateLanguageCommunicationSupportIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  it("builds child profiles", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", childName: "Alex" }),
      mkProfile({ id: "cp-2", childId: "child-2", childName: "Jordan" }),
    ];
    const result = generateLanguageCommunicationSupportIntelligence(
      profiles, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for communication plans in place", () => {
    const profiles = [mkProfile({ communicationNeed: "autism_spectrum", communicationPlanExists: true })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Communication plans in place"))).toBe(true);
  });

  it("adds strength for plans current", () => {
    const profiles = [mkProfile({ communicationNeed: "autism_spectrum", communicationPlanExists: true, planReviewStatus: "current" })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("current and up to date"))).toBe(true);
  });

  it("adds strength for interpreter access", () => {
    const profiles = [mkProfile({ interpreterRequired: true, interpreterAvailable: true })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Interpreter access"))).toBe(true);
  });

  it("adds strength for augmentative devices", () => {
    const profiles = [mkProfile({ augmentativeDeviceNeeded: true, augmentativeDeviceProvided: true })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Augmentative communication devices"))).toBe(true);
  });

  it("adds strength for high quality sessions", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => mkSession({ id: `cs-${i}`, quality: "excellent" }));
    const result = generateLanguageCommunicationSupportIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("High quality communication support"))).toBe(true);
  });

  it("adds strength for child engagement", () => {
    const sessions = Array.from({ length: 10 }, (_, i) => mkSession({ id: `cs-${i}`, childEngaged: true }));
    const result = generateLanguageCommunicationSupportIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Strong child engagement"))).toBe(true);
  });

  it("adds strength for easy read materials", () => {
    const audits = [mkAudit({ easyReadMaterialsAvailable: true })];
    const result = generateLanguageCommunicationSupportIntelligence([], [], audits, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Easy read materials"))).toBe(true);
  });

  it("adds strength for staff awareness", () => {
    const training = [mkTraining({ communicationNeedsAwareness: true })];
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All staff trained in communication needs"))).toBe(true);
  });

  it("adds strength for accessible child views", () => {
    const audits = [mkAudit({ childViewsSoughtAccessibly: true })];
    const result = generateLanguageCommunicationSupportIntelligence([], [], audits, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Children's views consistently sought"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("adds area for no profiles documented", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No communication profiles documented"))).toBe(true);
  });

  it("adds area for no training records", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff communication training"))).toBe(true);
  });

  it("adds area for no audits", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No communication environment audits"))).toBe(true);
  });

  it("adds area for missing communication plans", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", communicationNeed: "autism_spectrum", communicationPlanExists: true }),
      mkProfile({ id: "cp-2", childId: "child-2", communicationNeed: "hearing_impairment", communicationPlanExists: false }),
    ];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Communication plans missing"))).toBe(true);
  });

  it("adds area for no sessions with identified needs", () => {
    const profiles = [mkProfile({ communicationNeed: "autism_spectrum" })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No communication support sessions"))).toBe(true);
  });

  it("adds area for low staff awareness", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", communicationNeedsAwareness: true }),
      mkTraining({ id: "ct-2", staffId: "s2", communicationNeedsAwareness: false }),
      mkTraining({ id: "ct-3", staffId: "s3", communicationNeedsAwareness: false }),
      mkTraining({ id: "ct-4", staffId: "s4", communicationNeedsAwareness: false }),
    ];
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("communication needs awareness training"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for unmet interpreter needs", () => {
    const profiles = [mkProfile({ interpreterRequired: true, interpreterAvailable: false })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("interpreter"))).toBe(true);
  });

  it("adds URGENT for unmet device needs", () => {
    const profiles = [mkProfile({ augmentativeDeviceNeeded: true, augmentativeDeviceProvided: false })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("augmentative communication devices"))).toBe(true);
  });

  it("adds URGENT for overdue plan reviews", () => {
    const profiles = [mkProfile({ planReviewStatus: "overdue" })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("overdue for review"))).toBe(true);
  });

  it("adds URGENT for needs without plans", () => {
    const profiles = [mkProfile({ communicationNeed: "autism_spectrum", communicationPlanExists: false })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("no communication plan"))).toBe(true);
  });

  it("adds action for no profiles", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Assess communication needs"))).toBe(true);
  });

  it("adds action for no sessions with needs", () => {
    const profiles = [mkProfile({ communicationNeed: "autism_spectrum" })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Arrange communication support sessions"))).toBe(true);
  });

  it("adds action for no audits", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Schedule communication environment"))).toBe(true);
  });

  it("adds action for no training", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Arrange communication awareness training"))).toBe(true);
  });

  it("adds action for low autism communication training", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", autismCommunication: true }),
      mkTraining({ id: "ct-2", staffId: "s2", autismCommunication: false }),
      mkTraining({ id: "ct-3", staffId: "s3", autismCommunication: false }),
      mkTraining({ id: "ct-4", staffId: "s4", autismCommunication: false }),
    ];
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("autism communication training"))).toBe(true);
  });

  it("adds action for low sign language training", () => {
    const training = [
      mkTraining({ id: "ct-1", staffId: "s1", signLanguageBasics: false }),
      mkTraining({ id: "ct-2", staffId: "s2", signLanguageBasics: false }),
      mkTraining({ id: "ct-3", staffId: "s3", signLanguageBasics: false }),
    ];
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("sign language training"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 10"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 4"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SEND Code of Practice 2015"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 13"))).toBe(true);
  });

  // -- Integration / Chamberlain House demo --

  it("handles realistic Chamberlain House scenario", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-alex", childName: "Alex", communicationNeed: "none", communicationPlanExists: false, planReviewStatus: "not_applicable", augmentativeDeviceNeeded: false, augmentativeDeviceProvided: false }),
      mkProfile({ id: "cp-2", childId: "child-jordan", childName: "Jordan", communicationNeed: "english_additional_language", communicationPlanExists: true, planReviewStatus: "current", interpreterRequired: true, interpreterAvailable: true, augmentativeDeviceNeeded: false, augmentativeDeviceProvided: false }),
      mkProfile({ id: "cp-3", childId: "child-morgan", childName: "Morgan", communicationNeed: "autism_spectrum", communicationPlanExists: true, planReviewStatus: "current", augmentativeDeviceNeeded: true, augmentativeDeviceProvided: true }),
    ];
    const sessions = [
      mkSession({ id: "cs-1", childId: "child-jordan", supportType: "interpreter", quality: "excellent" }),
      mkSession({ id: "cs-2", childId: "child-jordan", supportType: "easy_read", quality: "good" }),
      mkSession({ id: "cs-3", childId: "child-morgan", supportType: "augmentative_device", quality: "good" }),
      mkSession({ id: "cs-4", childId: "child-morgan", supportType: "social_stories", quality: "excellent" }),
    ];
    const audits = [mkAudit({ id: "ca-1" }), mkAudit({ id: "ca-2" })];
    const training = [
      mkTraining({ id: "ct-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      mkTraining({ id: "ct-2", staffId: "staff-tom", staffName: "Tom Richards", interpreterWorkingTrained: false }),
      mkTraining({ id: "ct-3", staffId: "staff-lisa", staffName: "Lisa Williams", signLanguageBasics: false, augmentativeDeviceTrained: false }),
      mkTraining({ id: "ct-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generateLanguageCommunicationSupportIntelligence(
      profiles, sessions, audits, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.needsAssessment.totalProfiles).toBe(3);
    expect(result.supportProvision.totalSessions).toBe(4);
    expect(result.environmentAccessibility.totalAudits).toBe(2);
    expect(result.staffCompetence.totalStaff).toBe(4);
  });

  it("does not add no-profiles area when profiles exist", () => {
    const profiles = [mkProfile()];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No communication profiles documented"))).toBe(false);
  });

  it("does not add no-training area when training exists", () => {
    const training = [mkTraining()];
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff communication training"))).toBe(false);
  });

  it("score minimum is 0", () => {
    const result = generateLanguageCommunicationSupportIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("no URGENT actions when all needs met", () => {
    const profiles = [mkProfile({
      communicationPlanExists: true,
      planReviewStatus: "current",
      interpreterRequired: true,
      interpreterAvailable: true,
      augmentativeDeviceNeeded: true,
      augmentativeDeviceProvided: true,
    })];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [mkSession()], [mkAudit()], [mkTraining()], "test", "2026-01-01", "2026-06-01");
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions).toHaveLength(0);
  });

  it("multiple URGENT actions for multiple unmet needs", () => {
    const profiles = [
      mkProfile({ id: "cp-1", childId: "child-1", interpreterRequired: true, interpreterAvailable: false, augmentativeDeviceNeeded: true, augmentativeDeviceProvided: false, planReviewStatus: "overdue", communicationPlanExists: false }),
    ];
    const result = generateLanguageCommunicationSupportIntelligence(profiles, [], [], [], "test", "2026-01-01", "2026-06-01");
    const urgentActions = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgentActions.length).toBeGreaterThanOrEqual(3);
  });
});
