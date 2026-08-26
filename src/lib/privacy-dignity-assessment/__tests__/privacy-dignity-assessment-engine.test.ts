import { describe, it, expect } from "vitest";
import {
  getRating,
  getPrivacyDomainLabel,
  getComplianceStatusLabel,
  getAuditOutcomeLabel,
  getChildFeedbackRatingLabel,
  getIncidentTypeLabel,
  getRatingLabel,
  evaluatePersonalPrivacy,
  evaluateCommunicationPrivacy,
  evaluateConfidentialityCompliance,
  evaluateStaffPrivacyReadiness,
  buildChildPrivacyProfiles,
  generatePrivacyDignityIntelligence,
} from "../privacy-dignity-assessment-engine";
import type {
  PrivacyAudit,
  ChildPrivacyFeedback,
  PrivacyIncident,
  StaffPrivacyTraining,
} from "../privacy-dignity-assessment-engine";

// -- Helpers -------------------------------------------------------------------

function makeAudit(overrides: Partial<PrivacyAudit> = {}): PrivacyAudit {
  return {
    id: "aud-1",
    auditDate: "2026-04-01",
    auditedBy: "Darren Laville",
    domain: "bedroom",
    complianceStatus: "fully_compliant",
    auditOutcome: "passed",
    knockingPolicyObserved: true,
    lockableStorageProvided: true,
    personalSpaceRespected: true,
    findingsNotes: "",
    ...overrides,
  };
}

function makeFeedback(
  overrides: Partial<ChildPrivacyFeedback> = {},
): ChildPrivacyFeedback {
  return {
    id: "fb-1",
    childId: "child-alex",
    childName: "Alex",
    feedbackDate: "2026-04-15",
    domain: "bedroom",
    rating: "very_positive",
    feelsPrivacyRespected: true,
    feelsBedroomIsOwn: true,
    canMakePrivateCalls: true,
    belongingsSafe: true,
    comments: "",
    ...overrides,
  };
}

function makeIncident(
  overrides: Partial<PrivacyIncident> = {},
): PrivacyIncident {
  return {
    id: "inc-1",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-04-20",
    incidentType: "unauthorised_room_entry",
    description: "Staff entered without knocking",
    reportedBy: "Alex",
    investigationCompleted: true,
    actionTaken: true,
    childInformed: true,
    preventiveMeasuresImplemented: true,
    ...overrides,
  };
}

function makeTraining(
  overrides: Partial<StaffPrivacyTraining> = {},
): StaffPrivacyTraining {
  return {
    id: "tr-1",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    privacyRightsAwareness: true,
    knockingPolicyTrained: true,
    confidentialityTrained: true,
    dataProtectionTrained: true,
    bodyAutonomyTrained: true,
    digitalPrivacyTrained: true,
    ...overrides,
  };
}

// -- pct -----------------------------------------------------------------------

// -- getRating -----------------------------------------------------------------

describe("getRating", () => {
  it("returns outstanding for 80+", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });
  it("returns good for 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });
  it("returns requires_improvement for 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });
  it("returns inadequate for <40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// -- Label functions -----------------------------------------------------------

describe("label functions", () => {
  it("getPrivacyDomainLabel returns correct labels", () => {
    expect(getPrivacyDomainLabel("bedroom")).toBe("Bedroom Privacy");
    expect(getPrivacyDomainLabel("digital_privacy")).toBe("Digital Privacy");
    expect(getPrivacyDomainLabel("mail_correspondence")).toBe(
      "Mail & Correspondence",
    );
  });
  it("getComplianceStatusLabel returns correct labels", () => {
    expect(getComplianceStatusLabel("fully_compliant")).toBe(
      "Fully Compliant",
    );
    expect(getComplianceStatusLabel("non_compliant")).toBe("Non-Compliant");
  });
  it("getAuditOutcomeLabel returns correct labels", () => {
    expect(getAuditOutcomeLabel("passed")).toBe("Passed");
    expect(getAuditOutcomeLabel("major_findings")).toBe("Major Findings");
  });
  it("getChildFeedbackRatingLabel returns correct labels", () => {
    expect(getChildFeedbackRatingLabel("very_positive")).toBe("Very Positive");
    expect(getChildFeedbackRatingLabel("very_negative")).toBe("Very Negative");
  });
  it("getIncidentTypeLabel returns correct labels", () => {
    expect(getIncidentTypeLabel("unauthorised_room_entry")).toBe(
      "Unauthorised Room Entry",
    );
    expect(getIncidentTypeLabel("digital_privacy_breach")).toBe(
      "Digital Privacy Breach",
    );
  });
  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluatePersonalPrivacy ---------------------------------------------------

describe("evaluatePersonalPrivacy", () => {
  it("returns 0 for empty audits", () => {
    const result = evaluatePersonalPrivacy([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalAudits).toBe(0);
  });

  it("returns max score for all-compliant audits", () => {
    const audits = Array.from({ length: 10 }, (_, i) =>
      makeAudit({ id: `aud-${i}` }),
    );
    const result = evaluatePersonalPrivacy(audits);
    expect(result.overallScore).toBe(25);
    expect(result.fullyCompliantRate).toBe(100);
    expect(result.knockingObservedRate).toBe(100);
    expect(result.lockableStorageRate).toBe(100);
    expect(result.personalSpaceRate).toBe(100);
    expect(result.passedRate).toBe(100);
  });

  it("returns low score for non-compliant audits", () => {
    const audits = Array.from({ length: 10 }, (_, i) =>
      makeAudit({
        id: `aud-${i}`,
        complianceStatus: "non_compliant",
        auditOutcome: "failed",
        knockingPolicyObserved: false,
        lockableStorageProvided: false,
        personalSpaceRespected: false,
      }),
    );
    const result = evaluatePersonalPrivacy(audits);
    expect(result.overallScore).toBe(0);
    expect(result.fullyCompliantRate).toBe(0);
  });

  it("handles mixed compliance levels", () => {
    const audits = [
      makeAudit({ id: "a1" }),
      makeAudit({ id: "a2" }),
      makeAudit({
        id: "a3",
        complianceStatus: "mostly_compliant",
        auditOutcome: "minor_findings",
        knockingPolicyObserved: false,
        lockableStorageProvided: false,
        personalSpaceRespected: false,
      }),
    ];
    const result = evaluatePersonalPrivacy(audits);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
    expect(result.fullyCompliantRate).toBe(67);
    expect(result.totalAudits).toBe(3);
  });

  it("caps score at 25", () => {
    const audits = Array.from({ length: 100 }, (_, i) =>
      makeAudit({ id: `aud-${i}` }),
    );
    const result = evaluatePersonalPrivacy(audits);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("single audit with partial compliance scores mid-range", () => {
    const audits = [
      makeAudit({
        complianceStatus: "fully_compliant",
        knockingPolicyObserved: true,
        lockableStorageProvided: false,
        personalSpaceRespected: true,
        auditOutcome: "minor_findings",
      }),
    ];
    const result = evaluatePersonalPrivacy(audits);
    // fullyCompliant=100→7, knocking=100→6, lockable=0→0, space=100→4, passed=0→0
    expect(result.overallScore).toBe(17);
  });

  it("correctly calculates lockable storage rate", () => {
    const audits = [
      makeAudit({ id: "a1", lockableStorageProvided: true }),
      makeAudit({ id: "a2", lockableStorageProvided: false }),
    ];
    const result = evaluatePersonalPrivacy(audits);
    expect(result.lockableStorageRate).toBe(50);
  });
});

// -- evaluateCommunicationPrivacy ----------------------------------------------

describe("evaluateCommunicationPrivacy", () => {
  it("returns 0 for empty feedback", () => {
    const result = evaluateCommunicationPrivacy([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalFeedback).toBe(0);
  });

  it("returns max score for all-positive feedback", () => {
    const feedback = Array.from({ length: 10 }, (_, i) =>
      makeFeedback({ id: `fb-${i}` }),
    );
    const result = evaluateCommunicationPrivacy(feedback);
    expect(result.overallScore).toBe(25);
    expect(result.feelsPrivacyRespectedRate).toBe(100);
    expect(result.canMakePrivateCallsRate).toBe(100);
    expect(result.belongingsSafeRate).toBe(100);
    expect(result.feelsBedroomIsOwnRate).toBe(100);
    expect(result.positiveRatingRate).toBe(100);
  });

  it("returns low score for all-negative feedback", () => {
    const feedback = Array.from({ length: 10 }, (_, i) =>
      makeFeedback({
        id: `fb-${i}`,
        rating: "very_negative",
        feelsPrivacyRespected: false,
        feelsBedroomIsOwn: false,
        canMakePrivateCalls: false,
        belongingsSafe: false,
      }),
    );
    const result = evaluateCommunicationPrivacy(feedback);
    expect(result.overallScore).toBe(0);
    expect(result.positiveRatingRate).toBe(0);
  });

  it("handles mixed feedback", () => {
    const feedback = [
      makeFeedback({ id: "fb1" }),
      makeFeedback({
        id: "fb2",
        rating: "negative",
        feelsPrivacyRespected: false,
        canMakePrivateCalls: false,
        belongingsSafe: false,
        feelsBedroomIsOwn: false,
      }),
    ];
    const result = evaluateCommunicationPrivacy(feedback);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
    expect(result.feelsPrivacyRespectedRate).toBe(50);
  });

  it("caps score at 25", () => {
    const feedback = Array.from({ length: 50 }, (_, i) =>
      makeFeedback({ id: `fb-${i}` }),
    );
    const result = evaluateCommunicationPrivacy(feedback);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("counts positive and very_positive as positive", () => {
    const feedback = [
      makeFeedback({ id: "fb1", rating: "positive" }),
      makeFeedback({ id: "fb2", rating: "very_positive" }),
      makeFeedback({ id: "fb3", rating: "neutral" }),
    ];
    const result = evaluateCommunicationPrivacy(feedback);
    expect(result.positiveRatingRate).toBe(67);
  });

  it("correctly reports feelsBedroomIsOwnRate", () => {
    const feedback = [
      makeFeedback({ id: "fb1", feelsBedroomIsOwn: true }),
      makeFeedback({ id: "fb2", feelsBedroomIsOwn: false }),
      makeFeedback({ id: "fb3", feelsBedroomIsOwn: true }),
    ];
    const result = evaluateCommunicationPrivacy(feedback);
    expect(result.feelsBedroomIsOwnRate).toBe(67);
  });
});

// -- evaluateConfidentialityCompliance -----------------------------------------

describe("evaluateConfidentialityCompliance", () => {
  it("returns 25 for empty incidents (no breaches)", () => {
    const result = evaluateConfidentialityCompliance([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalIncidents).toBe(0);
  });

  it("returns max score for fully-handled incidents", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateConfidentialityCompliance(incidents);
    expect(result.overallScore).toBe(25);
    expect(result.investigationCompletedRate).toBe(100);
    expect(result.actionTakenRate).toBe(100);
    expect(result.childInformedRate).toBe(100);
    expect(result.preventiveMeasuresRate).toBe(100);
  });

  it("returns 0 for unhandled incidents", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        investigationCompleted: false,
        actionTaken: false,
        childInformed: false,
        preventiveMeasuresImplemented: false,
      }),
    );
    const result = evaluateConfidentialityCompliance(incidents);
    expect(result.overallScore).toBe(0);
  });

  it("handles partially investigated incidents", () => {
    const incidents = [
      makeIncident({ id: "inc1" }),
      makeIncident({
        id: "inc2",
        investigationCompleted: false,
        actionTaken: false,
        childInformed: false,
        preventiveMeasuresImplemented: false,
      }),
    ];
    const result = evaluateConfidentialityCompliance(incidents);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThan(25);
    expect(result.investigationCompletedRate).toBe(50);
  });

  it("caps score at 25", () => {
    const incidents = Array.from({ length: 50 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateConfidentialityCompliance(incidents);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("reports correct action taken rate", () => {
    const incidents = [
      makeIncident({ id: "i1", actionTaken: true }),
      makeIncident({ id: "i2", actionTaken: true }),
      makeIncident({ id: "i3", actionTaken: false }),
    ];
    const result = evaluateConfidentialityCompliance(incidents);
    expect(result.actionTakenRate).toBe(67);
  });
});

// -- evaluateStaffPrivacyReadiness ---------------------------------------------

describe("evaluateStaffPrivacyReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffPrivacyReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffPrivacyReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.privacyRightsRate).toBe(100);
    expect(result.knockingPolicyRate).toBe(100);
    expect(result.confidentialityRate).toBe(100);
    expect(result.dataProtectionRate).toBe(100);
    expect(result.bodyAutonomyRate).toBe(100);
    expect(result.digitalPrivacyRate).toBe(100);
  });

  it("returns 0 for completely untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `tr-${i}`,
        staffId: `staff-${i}`,
        privacyRightsAwareness: false,
        knockingPolicyTrained: false,
        confidentialityTrained: false,
        dataProtectionTrained: false,
        bodyAutonomyTrained: false,
        digitalPrivacyTrained: false,
      }),
    );
    const result = evaluateStaffPrivacyReadiness(training);
    expect(result.overallScore).toBe(0);
  });

  it("handles partially trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        digitalPrivacyTrained: false,
        bodyAutonomyTrained: false,
      }),
    ];
    const result = evaluateStaffPrivacyReadiness(training);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.digitalPrivacyRate).toBe(50);
    expect(result.bodyAutonomyRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `tr-${i}`, staffId: `staff-${i}` }),
    );
    const result = evaluateStaffPrivacyReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("one fully trained staff scores max", () => {
    const training = [makeTraining()];
    const result = evaluateStaffPrivacyReadiness(training);
    // 100% on all metrics → 6+5+5+4+3+2 = 25
    expect(result.overallScore).toBe(25);
  });

  it("reports correct individual rates", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", dataProtectionTrained: false }),
      makeTraining({ id: "t2", staffId: "s2", dataProtectionTrained: true }),
      makeTraining({ id: "t3", staffId: "s3", dataProtectionTrained: false }),
    ];
    const result = evaluateStaffPrivacyReadiness(training);
    expect(result.dataProtectionRate).toBe(33);
  });
});

// -- buildChildPrivacyProfiles -------------------------------------------------

describe("buildChildPrivacyProfiles", () => {
  it("returns empty for no data", () => {
    const profiles = buildChildPrivacyProfiles([], []);
    expect(profiles).toHaveLength(0);
  });

  it("creates profiles from feedback only", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "c1", childName: "Alex" }),
      makeFeedback({ id: "fb2", childId: "c1", childName: "Alex" }),
      makeFeedback({ id: "fb3", childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildPrivacyProfiles(feedback, []);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "c1")!;
    expect(alex.feedbackCount).toBe(2);
    expect(alex.incidentCount).toBe(0);
  });

  it("creates profiles from incidents only", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildPrivacyProfiles([], incidents);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].feedbackCount).toBe(0);
    expect(profiles[0].incidentCount).toBe(1);
  });

  it("merges feedback and incidents for same child", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "c1", childName: "Alex" }),
    ];
    const incidents = [
      makeIncident({ id: "i1", childId: "c1", childName: "Alex" }),
    ];
    const profiles = buildChildPrivacyProfiles(feedback, incidents);
    expect(profiles).toHaveLength(1);
    expect(profiles[0].feedbackCount).toBe(1);
    expect(profiles[0].incidentCount).toBe(1);
  });

  it("calculates correct positive rate", () => {
    const feedback = [
      makeFeedback({ id: "fb1", childId: "c1", rating: "very_positive" }),
      makeFeedback({ id: "fb2", childId: "c1", rating: "positive" }),
      makeFeedback({ id: "fb3", childId: "c1", rating: "negative" }),
    ];
    const profiles = buildChildPrivacyProfiles(feedback, []);
    expect(profiles[0].positiveRate).toBe(67);
  });

  it("assigns feelsRespected true when all feedback says respected", () => {
    const feedback = [
      makeFeedback({
        id: "fb1",
        childId: "c1",
        feelsPrivacyRespected: true,
      }),
      makeFeedback({
        id: "fb2",
        childId: "c1",
        feelsPrivacyRespected: true,
      }),
    ];
    const profiles = buildChildPrivacyProfiles(feedback, []);
    expect(profiles[0].feelsRespected).toBe(true);
  });

  it("assigns feelsRespected false when any feedback says not respected", () => {
    const feedback = [
      makeFeedback({
        id: "fb1",
        childId: "c1",
        feelsPrivacyRespected: true,
      }),
      makeFeedback({
        id: "fb2",
        childId: "c1",
        feelsPrivacyRespected: false,
      }),
    ];
    const profiles = buildChildPrivacyProfiles(feedback, []);
    expect(profiles[0].feelsRespected).toBe(false);
  });

  it("gives bonus score of 3 for no incidents", () => {
    const feedback = [
      makeFeedback({
        id: "fb1",
        childId: "c1",
        rating: "very_positive",
        feelsPrivacyRespected: true,
      }),
    ];
    const withIncidents = buildChildPrivacyProfiles(feedback, [
      makeIncident({ id: "i1", childId: "c1" }),
    ]);
    const withoutIncidents = buildChildPrivacyProfiles(feedback, []);
    expect(withoutIncidents[0].overallScore).toBeGreaterThan(
      withIncidents[0].overallScore,
    );
  });

  it("caps child score at 10", () => {
    const feedback = Array.from({ length: 20 }, (_, i) =>
      makeFeedback({ id: `fb-${i}`, childId: "c1" }),
    );
    const profiles = buildChildPrivacyProfiles(feedback, []);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("does not go below 0", () => {
    const incidents = Array.from({ length: 10 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: "c1" }),
    );
    const profiles = buildChildPrivacyProfiles([], incidents);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- generatePrivacyDignityIntelligence ----------------------------------------

describe("generatePrivacyDignityIntelligence", () => {
  const demoAudits: PrivacyAudit[] = [
    makeAudit({ id: "aud1", domain: "bedroom" }),
    makeAudit({ id: "aud2", domain: "bathroom" }),
    makeAudit({ id: "aud3", domain: "communication" }),
    makeAudit({ id: "aud4", domain: "personal_belongings" }),
    makeAudit({ id: "aud5", domain: "digital_privacy" }),
  ];

  const demoFeedback: ChildPrivacyFeedback[] = [
    makeFeedback({ id: "fb1", childId: "child-alex", childName: "Alex" }),
    makeFeedback({ id: "fb2", childId: "child-jordan", childName: "Jordan" }),
    makeFeedback({ id: "fb3", childId: "child-morgan", childName: "Morgan" }),
  ];

  const demoTraining: StaffPrivacyTraining[] = [
    makeTraining({ id: "t1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
    makeTraining({ id: "t2", staffId: "staff-tom", staffName: "Tom Richards" }),
    makeTraining({ id: "t3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
    makeTraining({ id: "t4", staffId: "staff-darren", staffName: "Darren Laville" }),
  ];

  it("returns complete intelligence with all sections", () => {
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.rating).toBeDefined();
    expect(result.personalPrivacy).toBeDefined();
    expect(result.communicationPrivacy).toBeDefined();
    expect(result.confidentialityCompliance).toBeDefined();
    expect(result.staffPrivacyReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeInstanceOf(Array);
    expect(result.areasForImprovement).toBeInstanceOf(Array);
    expect(result.actions).toBeInstanceOf(Array);
    expect(result.regulatoryLinks).toBeInstanceOf(Array);
  });

  it("sums evaluator scores correctly", () => {
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    const sum =
      result.personalPrivacy.overallScore +
      result.communicationPrivacy.overallScore +
      result.confidentialityCompliance.overallScore +
      result.staffPrivacyReadiness.overallScore;
    expect(result.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for high-performing home", () => {
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns inadequate for all-empty inputs", () => {
    const result = generatePrivacyDignityIntelligence(
      [],
      [],
      [],
      [],
      "empty-home",
      "2026-01-01",
      "2026-05-18",
    );
    // personalPrivacy=0, communication=0, confidentiality=25, staff=0 → 25
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT actions for empty inputs", () => {
    const result = generatePrivacyDignityIntelligence(
      [],
      [],
      [],
      [],
      "empty-home",
      "2026-01-01",
      "2026-05-18",
    );
    const urgent = result.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(3);
  });

  it("caps overall score at 100", () => {
    // All evaluators max → 25+25+25+25 = 100
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles for children in feedback", () => {
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.childProfiles.length).toBe(3);
    const names = result.childProfiles.map((p) => p.childName);
    expect(names).toContain("Alex");
    expect(names).toContain("Jordan");
    expect(names).toContain("Morgan");
  });

  it("includes correct regulatory links count", () => {
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("regulatory links include CHR 2015 Reg 10", () => {
    const result = generatePrivacyDignityIntelligence(
      [],
      [],
      [],
      [],
      "x",
      "2026-01-01",
      "2026-05-18",
    );
    expect(
      result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 10")),
    ).toBe(true);
  });

  it("regulatory links include UNCRC Article 16", () => {
    const result = generatePrivacyDignityIntelligence(
      [],
      [],
      [],
      [],
      "x",
      "2026-01-01",
      "2026-05-18",
    );
    expect(
      result.regulatoryLinks.some((l) => l.includes("UNCRC Article 16")),
    ).toBe(true);
  });

  it("regulatory links include Human Rights Act 1998", () => {
    const result = generatePrivacyDignityIntelligence(
      [],
      [],
      [],
      [],
      "x",
      "2026-01-01",
      "2026-05-18",
    );
    expect(
      result.regulatoryLinks.some((l) =>
        l.includes("Human Rights Act 1998"),
      ),
    ).toBe(true);
  });

  it("regulatory links include Data Protection Act 2018", () => {
    const result = generatePrivacyDignityIntelligence(
      [],
      [],
      [],
      [],
      "x",
      "2026-01-01",
      "2026-05-18",
    );
    expect(
      result.regulatoryLinks.some((l) =>
        l.includes("Data Protection Act 2018"),
      ),
    ).toBe(true);
  });

  it("generates strengths for outstanding home", () => {
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      [],
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement when compliance is low", () => {
    const poorAudits = Array.from({ length: 5 }, (_, i) =>
      makeAudit({
        id: `aud-${i}`,
        complianceStatus: "non_compliant",
        auditOutcome: "failed",
        knockingPolicyObserved: false,
        lockableStorageProvided: false,
        personalSpaceRespected: false,
      }),
    );
    const result = generatePrivacyDignityIntelligence(
      poorAudits,
      [],
      [],
      [],
      "poor-home",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("handles incidents reducing confidentiality score", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        investigationCompleted: false,
        actionTaken: false,
        childInformed: false,
        preventiveMeasuresImplemented: false,
      }),
    );
    const result = generatePrivacyDignityIntelligence(
      demoAudits,
      demoFeedback,
      incidents,
      demoTraining,
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.confidentialityCompliance.overallScore).toBe(0);
    expect(result.overallScore).toBeLessThan(100);
  });

  it("child profiles show incidents from privacy breaches", () => {
    const incidents = [
      makeIncident({
        id: "inc1",
        childId: "child-alex",
        childName: "Alex",
      }),
      makeIncident({
        id: "inc2",
        childId: "child-alex",
        childName: "Alex",
      }),
    ];
    const result = generatePrivacyDignityIntelligence(
      [],
      demoFeedback,
      incidents,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-18",
    );
    const alex = result.childProfiles.find(
      (p) => p.childId === "child-alex",
    )!;
    expect(alex.incidentCount).toBe(2);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("single audit scores correctly", () => {
    const result = evaluatePersonalPrivacy([makeAudit()]);
    expect(result.totalAudits).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("single feedback scores correctly", () => {
    const result = evaluateCommunicationPrivacy([makeFeedback()]);
    expect(result.totalFeedback).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("single incident fully handled scores max", () => {
    const result = evaluateConfidentialityCompliance([makeIncident()]);
    expect(result.overallScore).toBe(25);
  });

  it("single untrained staff scores 0", () => {
    const result = evaluateStaffPrivacyReadiness([
      makeTraining({
        privacyRightsAwareness: false,
        knockingPolicyTrained: false,
        confidentialityTrained: false,
        dataProtectionTrained: false,
        bodyAutonomyTrained: false,
        digitalPrivacyTrained: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("large dataset completes without error", () => {
    const audits = Array.from({ length: 500 }, (_, i) =>
      makeAudit({ id: `a-${i}` }),
    );
    const feedback = Array.from({ length: 500 }, (_, i) =>
      makeFeedback({ id: `f-${i}`, childId: `c-${i % 50}` }),
    );
    const incidents = Array.from({ length: 100 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: `c-${i % 50}` }),
    );
    const training = Array.from({ length: 50 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const result = generatePrivacyDignityIntelligence(
      audits,
      feedback,
      incidents,
      training,
      "big-home",
      "2026-01-01",
      "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("evaluator scores never exceed 25", () => {
    const audits = Array.from({ length: 100 }, (_, i) =>
      makeAudit({ id: `a-${i}` }),
    );
    const feedback = Array.from({ length: 100 }, (_, i) =>
      makeFeedback({ id: `f-${i}` }),
    );
    const training = Array.from({ length: 100 }, (_, i) =>
      makeTraining({ id: `t-${i}`, staffId: `s-${i}` }),
    );
    const r1 = evaluatePersonalPrivacy(audits);
    const r2 = evaluateCommunicationPrivacy(feedback);
    const r3 = evaluateConfidentialityCompliance([]);
    const r4 = evaluateStaffPrivacyReadiness(training);
    expect(r1.overallScore).toBeLessThanOrEqual(25);
    expect(r2.overallScore).toBeLessThanOrEqual(25);
    expect(r3.overallScore).toBeLessThanOrEqual(25);
    expect(r4.overallScore).toBeLessThanOrEqual(25);
  });
});
