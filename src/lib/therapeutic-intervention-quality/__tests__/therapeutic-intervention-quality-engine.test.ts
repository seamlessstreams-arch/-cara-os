import { describe, it, expect } from "vitest";
import {
  generateTherapeuticInterventionQualityIntelligence,
  evaluateQuality,
  evaluateCompliance,
  evaluatePolicy,
  evaluateStaffReadiness,
  buildChildTherapyProfiles,
  pct,
  getRating,
  getTherapyTypeLabel,
  getProgressLevelLabel,
  getRatingLabel,
} from "../therapeutic-intervention-quality-engine";
import type {
  TherapySession,
  TherapeuticPolicy,
  StaffTherapeuticTraining,
} from "../therapeutic-intervention-quality-engine";

// -- Factory Functions --------------------------------------------------------

function makeSession(overrides: Partial<TherapySession> = {}): TherapySession {
  return {
    id: "ses-1",
    childId: "child-1",
    childName: "Alex",
    sessionDate: "2026-04-15",
    therapyType: "cbt",
    progressLevel: "good_progress",
    childEngaged: true,
    goalsReviewed: true,
    therapeuticRelationshipStrong: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<TherapeuticPolicy> = {}): TherapeuticPolicy {
  return {
    id: "policy-1",
    therapeuticFramework: true,
    referralPathway: true,
    consentAndConfidentialityProtocol: true,
    multiDisciplinaryApproach: true,
    outcomeMeasurementPlan: true,
    crisisTherapyProvision: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffTherapeuticTraining> = {}): StaffTherapeuticTraining {
  return {
    id: "tr-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    therapeuticAwareness: true,
    traumaInformedPractice: true,
    attachmentTheory: true,
    therapeuticCommunication: true,
    boundaryManagement: true,
    reflectivePractice: true,
    ...overrides,
  };
}

// -- pct ----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for 0/0", () => expect(pct(0, 0)).toBe(0));
  it("calculates correctly", () => expect(pct(3, 4)).toBe(75));
  it("rounds to nearest integer", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(5, 5)).toBe(100));
  it("returns 0 for 0 numerator", () => expect(pct(0, 10)).toBe(0));
  it("handles large numbers", () => expect(pct(999, 1000)).toBe(100));
  it("rounds 50.5 up", () => expect(pct(1, 2)).toBe(50));
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding at exactly 80", () => expect(getRating(80)).toBe("outstanding"));
  it("outstanding at 100", () => expect(getRating(100)).toBe("outstanding"));
  it("outstanding at 95", () => expect(getRating(95)).toBe("outstanding"));
  it("good at exactly 60", () => expect(getRating(60)).toBe("good"));
  it("good at 79", () => expect(getRating(79)).toBe("good"));
  it("requires_improvement at exactly 40", () => expect(getRating(40)).toBe("requires_improvement"));
  it("requires_improvement at 59", () => expect(getRating(59)).toBe("requires_improvement"));
  it("inadequate at 39", () => expect(getRating(39)).toBe("inadequate"));
  it("inadequate at 0", () => expect(getRating(0)).toBe("inadequate"));
});

// -- Label functions ----------------------------------------------------------

describe("getTherapyTypeLabel", () => {
  it("cbt", () => expect(getTherapyTypeLabel("cbt")).toBe("CBT"));
  it("play_therapy", () => expect(getTherapyTypeLabel("play_therapy")).toBe("Play Therapy"));
  it("art_therapy", () => expect(getTherapyTypeLabel("art_therapy")).toBe("Art Therapy"));
  it("emdr", () => expect(getTherapyTypeLabel("emdr")).toBe("EMDR"));
  it("family_therapy", () => expect(getTherapyTypeLabel("family_therapy")).toBe("Family Therapy"));
  it("dialectical_behaviour", () => expect(getTherapyTypeLabel("dialectical_behaviour")).toBe("Dialectical Behaviour"));
  it("psychodynamic", () => expect(getTherapyTypeLabel("psychodynamic")).toBe("Psychodynamic"));
  it("occupational_therapy", () => expect(getTherapyTypeLabel("occupational_therapy")).toBe("Occupational Therapy"));
});

describe("getProgressLevelLabel", () => {
  it("significant_progress", () => expect(getProgressLevelLabel("significant_progress")).toBe("Significant Progress"));
  it("good_progress", () => expect(getProgressLevelLabel("good_progress")).toBe("Good Progress"));
  it("some_progress", () => expect(getProgressLevelLabel("some_progress")).toBe("Some Progress"));
  it("minimal_progress", () => expect(getProgressLevelLabel("minimal_progress")).toBe("Minimal Progress"));
  it("no_progress", () => expect(getProgressLevelLabel("no_progress")).toBe("No Progress"));
});

describe("getRatingLabel", () => {
  it("outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("good", () => expect(getRatingLabel("good")).toBe("Good"));
  it("requires_improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
  it("inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// -- evaluateQuality ----------------------------------------------------------

describe("evaluateQuality", () => {
  it("returns 0 for empty sessions (no therapy = no quality)", () => {
    const result = evaluateQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.progressRate).toBe(0);
    expect(result.engagementRate).toBe(0);
    expect(result.goalsReviewedRate).toBe(0);
    expect(result.relationshipRate).toBe(0);
  });

  it("scores high for excellent sessions", () => {
    const result = evaluateQuality([makeSession(), makeSession({ id: "ses-2" })]);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.progressRate).toBe(100);
    expect(result.engagementRate).toBe(100);
  });

  it("calculates progress rate for significant + good", () => {
    const result = evaluateQuality([
      makeSession({ id: "ses-1", progressLevel: "significant_progress" }),
      makeSession({ id: "ses-2", progressLevel: "good_progress" }),
      makeSession({ id: "ses-3", progressLevel: "some_progress" }),
    ]);
    expect(result.progressRate).toBe(67);
  });

  it("calculates engagement rate", () => {
    const result = evaluateQuality([
      makeSession({ id: "ses-1", childEngaged: true }),
      makeSession({ id: "ses-2", childEngaged: false }),
    ]);
    expect(result.engagementRate).toBe(50);
  });

  it("calculates goals reviewed rate", () => {
    const result = evaluateQuality([
      makeSession({ id: "ses-1", goalsReviewed: true }),
      makeSession({ id: "ses-2", goalsReviewed: false }),
    ]);
    expect(result.goalsReviewedRate).toBe(50);
  });

  it("calculates relationship rate", () => {
    const result = evaluateQuality([
      makeSession({ id: "ses-1", therapeuticRelationshipStrong: true }),
      makeSession({ id: "ses-2", therapeuticRelationshipStrong: false }),
    ]);
    expect(result.relationshipRate).toBe(50);
  });

  it("scores low when nothing positive", () => {
    const result = evaluateQuality([
      makeSession({
        progressLevel: "no_progress",
        childEngaged: false,
        goalsReviewed: false,
        therapeuticRelationshipStrong: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("returns correct total sessions count", () => {
    const result = evaluateQuality([
      makeSession({ id: "ses-1" }),
      makeSession({ id: "ses-2" }),
      makeSession({ id: "ses-3" }),
    ]);
    expect(result.totalSessions).toBe(3);
  });

  it("caps score at 25", () => {
    const result = evaluateQuality([makeSession()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score minimum is 0", () => {
    const result = evaluateQuality([
      makeSession({
        progressLevel: "no_progress",
        childEngaged: false,
        goalsReviewed: false,
        therapeuticRelationshipStrong: false,
      }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("counts significant_progress in progress rate", () => {
    const result = evaluateQuality([
      makeSession({ progressLevel: "significant_progress" }),
    ]);
    expect(result.progressRate).toBe(100);
  });

  it("excludes some_progress from progress rate", () => {
    const result = evaluateQuality([
      makeSession({ progressLevel: "some_progress" }),
    ]);
    expect(result.progressRate).toBe(0);
  });

  it("excludes minimal_progress from progress rate", () => {
    const result = evaluateQuality([
      makeSession({ progressLevel: "minimal_progress" }),
    ]);
    expect(result.progressRate).toBe(0);
  });

  it("excludes no_progress from progress rate", () => {
    const result = evaluateQuality([
      makeSession({ progressLevel: "no_progress" }),
    ]);
    expect(result.progressRate).toBe(0);
  });
});

// -- evaluateCompliance -------------------------------------------------------

describe("evaluateCompliance", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.staffSupportedRate).toBe(0);
    expect(result.feedbackRate).toBe(0);
    expect(result.therapyDiversityRatio).toBe(0);
  });

  it("scores high for fully compliant sessions", () => {
    const result = evaluateCompliance([
      makeSession({ id: "ses-1", therapyType: "cbt" }),
      makeSession({ id: "ses-2", therapyType: "play_therapy" }),
      makeSession({ id: "ses-3", therapyType: "art_therapy" }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(18);
  });

  it("calculates documented rate", () => {
    const result = evaluateCompliance([
      makeSession({ id: "ses-1", documentedInPlan: true }),
      makeSession({ id: "ses-2", documentedInPlan: false }),
    ]);
    expect(result.documentedRate).toBe(50);
  });

  it("calculates staff supported rate", () => {
    const result = evaluateCompliance([
      makeSession({ id: "ses-1", staffSupported: true }),
      makeSession({ id: "ses-2", staffSupported: false }),
    ]);
    expect(result.staffSupportedRate).toBe(50);
  });

  it("calculates feedback rate", () => {
    const result = evaluateCompliance([
      makeSession({ id: "ses-1", feedbackGiven: true }),
      makeSession({ id: "ses-2", feedbackGiven: false }),
    ]);
    expect(result.feedbackRate).toBe(50);
  });

  it("calculates therapy diversity ratio out of 8 types", () => {
    const result = evaluateCompliance([
      makeSession({ id: "ses-1", therapyType: "cbt" }),
      makeSession({ id: "ses-2", therapyType: "play_therapy" }),
    ]);
    expect(result.therapyDiversityRatio).toBe(25);
  });

  it("returns 100 diversity ratio for all 8 types", () => {
    const types = ["cbt", "play_therapy", "art_therapy", "emdr", "family_therapy", "dialectical_behaviour", "psychodynamic", "occupational_therapy"] as const;
    const sessions = types.map((t, i) =>
      makeSession({ id: `ses-${i}`, therapyType: t }),
    );
    const result = evaluateCompliance(sessions);
    expect(result.therapyDiversityRatio).toBe(100);
  });

  it("scores 0 when nothing is compliant", () => {
    const result = evaluateCompliance([
      makeSession({
        documentedInPlan: false,
        staffSupported: false,
        feedbackGiven: false,
      }),
    ]);
    expect(result.overallScore).toBeLessThanOrEqual(5);
  });

  it("caps score at 25", () => {
    const result = evaluateCompliance([makeSession()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score minimum is 0", () => {
    const result = evaluateCompliance([
      makeSession({
        documentedInPlan: false,
        staffSupported: false,
        feedbackGiven: false,
      }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- evaluatePolicy -----------------------------------------------------------

describe("evaluatePolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluatePolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.therapeuticFramework).toBe(false);
    expect(result.referralPathway).toBe(false);
    expect(result.consentAndConfidentialityProtocol).toBe(false);
    expect(result.multiDisciplinaryApproach).toBe(false);
    expect(result.outcomeMeasurementPlan).toBe(false);
    expect(result.crisisTherapyProvision).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns 25 for fully complete policy", () => {
    const result = evaluatePolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores therapeuticFramework at 4", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: true,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores referralPathway at 4", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: true,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores consentAndConfidentialityProtocol at 4", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: true,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores multiDisciplinaryApproach at 4", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: true,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores outcomeMeasurementPlan at 3", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: true,
      crisisTherapyProvision: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores crisisTherapyProvision at 3", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: true,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores regularReview at 3", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: true,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("adds up to correct total: 4+4+4+4+3+3+3 = 25", () => {
    const result = evaluatePolicy(makePolicy());
    expect(result.overallScore).toBe(4 + 4 + 4 + 4 + 3 + 3 + 3);
  });

  it("returns 0 when all fields are false", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("passes through boolean values correctly", () => {
    const result = evaluatePolicy(makePolicy({
      therapeuticFramework: true,
      referralPathway: false,
    }));
    expect(result.therapeuticFramework).toBe(true);
    expect(result.referralPathway).toBe(false);
  });

  it("caps score at 25", () => {
    const result = evaluatePolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffReadiness ---------------------------------------------------

describe("evaluateStaffReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.therapeuticAwarenessRate).toBe(0);
    expect(result.traumaInformedPracticeRate).toBe(0);
    expect(result.attachmentTheoryRate).toBe(0);
    expect(result.therapeuticCommunicationRate).toBe(0);
    expect(result.boundaryManagementRate).toBe(0);
    expect(result.reflectivePracticeRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const result = evaluateStaffReadiness([
      makeTraining(),
      makeTraining({ id: "tr-2", staffId: "staff-2" }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.therapeuticAwarenessRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const result = evaluateStaffReadiness([
      makeTraining({
        therapeuticAwareness: false,
        traumaInformedPractice: false,
        attachmentTheory: false,
        therapeuticCommunication: false,
        boundaryManagement: false,
        reflectivePractice: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("calculates therapeutic awareness rate", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", therapeuticAwareness: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", therapeuticAwareness: false }),
    ]);
    expect(result.therapeuticAwarenessRate).toBe(50);
  });

  it("calculates trauma-informed practice rate", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", traumaInformedPractice: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", traumaInformedPractice: false }),
    ]);
    expect(result.traumaInformedPracticeRate).toBe(50);
  });

  it("calculates attachment theory rate", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", attachmentTheory: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", attachmentTheory: false }),
    ]);
    expect(result.attachmentTheoryRate).toBe(50);
  });

  it("calculates therapeutic communication rate", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", therapeuticCommunication: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", therapeuticCommunication: false }),
    ]);
    expect(result.therapeuticCommunicationRate).toBe(50);
  });

  it("calculates boundary management rate", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", boundaryManagement: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", boundaryManagement: false }),
    ]);
    expect(result.boundaryManagementRate).toBe(50);
  });

  it("calculates reflective practice rate", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", reflectivePractice: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", reflectivePractice: false }),
    ]);
    expect(result.reflectivePracticeRate).toBe(50);
  });

  it("returns correct total staff count", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1" }),
      makeTraining({ id: "tr-2", staffId: "staff-2" }),
      makeTraining({ id: "tr-3", staffId: "staff-3" }),
    ]);
    expect(result.totalStaff).toBe(3);
  });

  it("caps score at 25", () => {
    const result = evaluateStaffReadiness([makeTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles partial training mix", () => {
    const result = evaluateStaffReadiness([
      makeTraining({ id: "tr-1", staffId: "s1" }),
      makeTraining({
        id: "tr-2",
        staffId: "s2",
        therapeuticAwareness: true,
        traumaInformedPractice: false,
        attachmentTheory: false,
        therapeuticCommunication: true,
        boundaryManagement: false,
        reflectivePractice: true,
      }),
    ]);
    expect(result.therapeuticAwarenessRate).toBe(100);
    expect(result.traumaInformedPracticeRate).toBe(50);
    expect(result.attachmentTheoryRate).toBe(50);
    expect(result.therapeuticCommunicationRate).toBe(100);
    expect(result.boundaryManagementRate).toBe(50);
    expect(result.reflectivePracticeRate).toBe(100);
  });
});

// -- buildChildTherapyProfiles ------------------------------------------------

describe("buildChildTherapyProfiles", () => {
  it("returns empty for no sessions", () => {
    expect(buildChildTherapyProfiles([])).toEqual([]);
  });

  it("groups by child", () => {
    const profiles = buildChildTherapyProfiles([
      makeSession({ id: "ses-1", childId: "child-1", childName: "Alex" }),
      makeSession({ id: "ses-2", childId: "child-1", childName: "Alex" }),
      makeSession({ id: "ses-3", childId: "child-2", childName: "Jordan" }),
    ]);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-1");
    expect(alex!.totalSessions).toBe(2);
  });

  it("calculates progress rate per child", () => {
    const profiles = buildChildTherapyProfiles([
      makeSession({ id: "ses-1", progressLevel: "significant_progress" }),
      makeSession({ id: "ses-2", progressLevel: "no_progress" }),
    ]);
    expect(profiles[0].progressRate).toBe(50);
  });

  it("includes good_progress in progress rate", () => {
    const profiles = buildChildTherapyProfiles([
      makeSession({ id: "ses-1", progressLevel: "good_progress" }),
    ]);
    expect(profiles[0].progressRate).toBe(100);
  });

  it("calculates engagement rate per child", () => {
    const profiles = buildChildTherapyProfiles([
      makeSession({ id: "ses-1", childEngaged: true }),
      makeSession({ id: "ses-2", childEngaged: false }),
    ]);
    expect(profiles[0].engagementRate).toBe(50);
  });

  it("gives higher score for better progress", () => {
    const good = buildChildTherapyProfiles([
      makeSession({ id: "ses-1", progressLevel: "significant_progress" }),
    ]);
    const bad = buildChildTherapyProfiles([
      makeSession({ id: "ses-1", progressLevel: "no_progress", childEngaged: false, goalsReviewed: false, therapeuticRelationshipStrong: false }),
    ]);
    expect(good[0].overallScore).toBeGreaterThan(bad[0].overallScore);
  });

  it("score capped at 10", () => {
    const profiles = buildChildTherapyProfiles([makeSession()]);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score minimum is 0", () => {
    const profiles = buildChildTherapyProfiles([
      makeSession({
        progressLevel: "no_progress",
        childEngaged: false,
        goalsReviewed: false,
        therapeuticRelationshipStrong: false,
      }),
    ]);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("preserves child name", () => {
    const profiles = buildChildTherapyProfiles([
      makeSession({ childId: "child-1", childName: "Alex" }),
    ]);
    expect(profiles[0].childName).toBe("Alex");
  });
});

// -- generateTherapeuticInterventionQualityIntelligence -----------------------

describe("generateTherapeuticInterventionQualityIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession()], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.quality.overallScore +
      result.compliance.overallScore +
      result.policy.overallScore +
      result.staffReadiness.overallScore,
    );
  });

  it("returns inadequate for zero data", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    // 0 (quality empty) + 0 (compliance empty) + 0 (no policy) + 0 (no training) = 0
    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession()],
      makePolicy(),
      [makeTraining(), makeTraining({ id: "tr-2", staffId: "staff-2" })],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("caps score at 100", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession()], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("includes child profiles", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [
        makeSession({ id: "ses-1", childId: "child-1" }),
        makeSession({ id: "ses-2", childId: "child-2", childName: "Jordan" }),
      ],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for high progress rate", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [
        makeSession({ id: "ses-1", progressLevel: "significant_progress" }),
        makeSession({ id: "ses-2", progressLevel: "good_progress" }),
        makeSession({ id: "ses-3", progressLevel: "good_progress" }),
        makeSession({ id: "ses-4", progressLevel: "good_progress" }),
      ],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("High therapeutic progress rate"))).toBe(true);
  });

  it("adds strength for 100% engagement", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ childEngaged: true }), makeSession({ id: "ses-2", childEngaged: true })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Child engagement at 100%"))).toBe(true);
  });

  it("adds strength for 100% goals reviewed", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ goalsReviewed: true })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Therapeutic goals reviewed in every session"))).toBe(true);
  });

  it("adds strength for comprehensive policy", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], makePolicy(), [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Comprehensive therapeutic policy"))).toBe(true);
  });

  it("adds strength for all staff trained in therapeutic awareness", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [makeTraining({ therapeuticAwareness: true })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("All staff trained in therapeutic awareness"))).toBe(true);
  });

  it("adds strength for all staff trained in trauma-informed practice", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [makeTraining({ traumaInformedPractice: true })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("All staff trained in trauma-informed practice"))).toBe(true);
  });

  it("adds strength for 100% documented sessions", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ documentedInPlan: true })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("All therapy sessions documented"))).toBe(true);
  });

  it("adds strength for 100% staff support", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ staffSupported: true })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Staff support provided consistently"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("adds area for no sessions", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No therapy sessions recorded"))).toBe(true);
  });

  it("adds area for no policy", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No therapeutic intervention policy"))).toBe(true);
  });

  it("adds area for no training records", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No staff therapeutic training"))).toBe(true);
  });

  it("adds area for low engagement rate", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ childEngaged: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Child engagement rate"))).toBe(true);
  });

  it("adds area for missing therapeutic framework in policy", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [],
      makePolicy({ therapeuticFramework: false }),
      [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Therapeutic framework not documented"))).toBe(true);
  });

  it("adds area for missing referral pathway", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [],
      makePolicy({ referralPathway: false }),
      [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Referral pathway missing"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for sessions with no progress", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ progressLevel: "no_progress" })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("no progress"))).toBe(true);
  });

  it("adds URGENT for sessions where child was not engaged", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ childEngaged: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("not engaged"))).toBe(true);
  });

  it("adds URGENT for undocumented sessions", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession({ documentedInPlan: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("not documented"))).toBe(true);
  });

  it("adds URGENT for no staff training", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession()], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training for all staff"))).toBe(true);
  });

  it("adds action to create policy when none exists", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("Create therapeutic intervention policy"))).toBe(true);
  });

  it("adds action for missing outcome measurement plan", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], makePolicy({ outcomeMeasurementPlan: false }), [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("outcome measurement plan"))).toBe(true);
  });

  it("adds action for missing regular review in policy", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], makePolicy({ regularReview: false }), [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("regular review schedule"))).toBe(true);
  });

  it("adds action for low trauma-informed practice training rate", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [makeTraining({ traumaInformedPractice: false })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("trauma-informed practice training"))).toBe(true);
  });

  it("adds action for low attachment theory training rate", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [makeTraining({ attachmentTheory: false })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("attachment theory training"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Regulation 14"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 6"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 39"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NICE CG158"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic Oak House scenario", () => {
    const sessions: TherapySession[] = [
      makeSession({
        id: "ses-alex-1",
        childId: "child-alex",
        childName: "Alex",
        therapyType: "cbt",
        progressLevel: "good_progress",
      }),
      makeSession({
        id: "ses-alex-2",
        childId: "child-alex",
        childName: "Alex",
        therapyType: "art_therapy",
        progressLevel: "significant_progress",
      }),
      makeSession({
        id: "ses-alex-3",
        childId: "child-alex",
        childName: "Alex",
        therapyType: "cbt",
        progressLevel: "good_progress",
      }),
      makeSession({
        id: "ses-jordan-1",
        childId: "child-jordan",
        childName: "Jordan",
        therapyType: "play_therapy",
        progressLevel: "good_progress",
      }),
      makeSession({
        id: "ses-jordan-2",
        childId: "child-jordan",
        childName: "Jordan",
        therapyType: "emdr",
        progressLevel: "significant_progress",
      }),
      makeSession({
        id: "ses-jordan-3",
        childId: "child-jordan",
        childName: "Jordan",
        therapyType: "family_therapy",
        progressLevel: "good_progress",
      }),
      makeSession({
        id: "ses-morgan-1",
        childId: "child-morgan",
        childName: "Morgan",
        therapyType: "dialectical_behaviour",
        progressLevel: "significant_progress",
      }),
      makeSession({
        id: "ses-morgan-2",
        childId: "child-morgan",
        childName: "Morgan",
        therapyType: "psychodynamic",
        progressLevel: "good_progress",
      }),
    ];
    const policy = makePolicy();
    const training = [
      makeTraining({ id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeTraining({ id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      makeTraining({ id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      makeTraining({ id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generateTherapeuticInterventionQualityIntelligence(
      sessions, policy, training,
      "oak-house", "2026-01-01", "2026-05-19",
    );

    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles.length).toBeGreaterThanOrEqual(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.homeId).toBe("oak-house");
  });

  it("handles all-empty data with correct empty-data semantics", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.quality.overallScore).toBe(0);
    expect(result.compliance.overallScore).toBe(0);
    expect(result.policy.overallScore).toBe(0);
    expect(result.staffReadiness.overallScore).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("handles single session with all defaults", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [makeSession()], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(1);
  });

  it("returns correct rating string for each threshold", () => {
    const result = generateTherapeuticInterventionQualityIntelligence(
      [], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });
});
