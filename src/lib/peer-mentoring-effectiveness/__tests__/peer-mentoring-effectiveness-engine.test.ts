import { describe, it, expect } from "vitest";
import {
  generatePeerMentoringEffectivenessIntelligence,
  evaluatePairingQuality,
  evaluateSessionEffectiveness,
  evaluateRelationshipSafeguarding,
  evaluateStaffSupport,
  buildChildMentoringProfiles,
  pct,
  getRating,
  getMentoringRoleLabel,
  getSessionOutcomeLabel,
  getPairingStatusLabel,
  getSafeguardingConcernLabel,
  getRatingLabel,
} from "../peer-mentoring-effectiveness-engine";
import type {
  PeerPairing,
  MentoringSession,
  RelationshipReview,
  StaffMentoringTraining,
} from "../peer-mentoring-effectiveness-engine";

// -- Test Helpers -------------------------------------------------------------

function mkPairing(overrides: Partial<PeerPairing> = {}): PeerPairing {
  return {
    id: "pp-1",
    mentorId: "child-morgan",
    mentorName: "Morgan",
    menteeId: "child-jordan",
    menteeName: "Jordan",
    startDate: "2026-02-01",
    status: "active",
    consentObtained: true,
    riskAssessed: true,
    matchCriteria: ["age_appropriate", "shared_interests"],
    staffSupervisor: "Sarah Johnson",
    ...overrides,
  };
}

function mkSession(overrides: Partial<MentoringSession> = {}): MentoringSession {
  return {
    id: "ms-1",
    pairingId: "pp-1",
    date: "2026-03-01",
    duration: 45,
    facilitatedBy: "Sarah Johnson",
    outcome: "positive",
    mentorFeedback: "Good session",
    menteeFeedback: "Helpful",
    goalsDiscussed: true,
    progressMade: true,
    staffObservation: "Positive interaction observed",
    ...overrides,
  };
}

function mkReview(overrides: Partial<RelationshipReview> = {}): RelationshipReview {
  return {
    id: "rr-1",
    pairingId: "pp-1",
    reviewDate: "2026-03-15",
    reviewedBy: "Darren Laville",
    relationshipHealthy: true,
    boundariesRespected: true,
    safeguardingConcern: "none",
    actionTaken: "",
    mentorBenefiting: true,
    menteeBenefiting: true,
    ...overrides,
  };
}

function mkTraining(overrides: Partial<StaffMentoringTraining> = {}): StaffMentoringTraining {
  return {
    id: "smt-1",
    staffId: "staff-1",
    staffName: "Staff A",
    peerMentoringTrained: true,
    safeguardingInPeerRelationships: true,
    conflictResolution: true,
    boundarySetting: true,
    supportingYoungMentors: true,
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
  it("handles large numerator", () => expect(pct(999, 1000)).toBe(100));
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
  it("mentoring role labels", () => {
    expect(getMentoringRoleLabel("mentor")).toBe("Mentor");
    expect(getMentoringRoleLabel("mentee")).toBe("Mentee");
    expect(getMentoringRoleLabel("peer_buddy")).toBe("Peer Buddy");
    expect(getMentoringRoleLabel("welcome_buddy")).toBe("Welcome Buddy");
  });
  it("session outcome labels", () => {
    expect(getSessionOutcomeLabel("positive")).toBe("Positive");
    expect(getSessionOutcomeLabel("mixed")).toBe("Mixed");
    expect(getSessionOutcomeLabel("negative")).toBe("Negative");
    expect(getSessionOutcomeLabel("cancelled")).toBe("Cancelled");
  });
  it("pairing status labels", () => {
    expect(getPairingStatusLabel("active")).toBe("Active");
    expect(getPairingStatusLabel("completed")).toBe("Completed");
    expect(getPairingStatusLabel("paused")).toBe("Paused");
    expect(getPairingStatusLabel("ended_early")).toBe("Ended Early");
  });
  it("safeguarding concern labels", () => {
    expect(getSafeguardingConcernLabel("none")).toBe("None");
    expect(getSafeguardingConcernLabel("power_imbalance")).toBe("Power Imbalance");
    expect(getSafeguardingConcernLabel("bullying_risk")).toBe("Bullying Risk");
    expect(getSafeguardingConcernLabel("emotional_dependency")).toBe("Emotional Dependency");
    expect(getSafeguardingConcernLabel("boundary_issue")).toBe("Boundary Issue");
    expect(getSafeguardingConcernLabel("exploitation_risk")).toBe("Exploitation Risk");
  });
  it("rating labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluatePairingQuality ---------------------------------------------------

describe("evaluatePairingQuality", () => {
  it("returns 0 for empty pairings", () => {
    const result = evaluatePairingQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalPairings).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.riskAssessedRate).toBe(0);
    expect(result.matchCriteriaDefinedRate).toBe(0);
    expect(result.activePairingRate).toBe(0);
  });

  it("scores high for fully compliant pairings", () => {
    const pairings = [mkPairing(), mkPairing({ id: "pp-2", menteeId: "child-alex", menteeName: "Alex" })];
    const result = evaluatePairingQuality(pairings);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.consentRate).toBe(100);
    expect(result.riskAssessedRate).toBe(100);
    expect(result.matchCriteriaDefinedRate).toBe(100);
  });

  it("scores low for non-compliant pairings", () => {
    const pairings = [mkPairing({
      consentObtained: false,
      riskAssessed: false,
      matchCriteria: [],
      status: "ended_early",
    })];
    const result = evaluatePairingQuality(pairings);
    expect(result.overallScore).toBe(0);
    expect(result.consentRate).toBe(0);
    expect(result.riskAssessedRate).toBe(0);
  });

  it("calculates consent rate correctly", () => {
    const pairings = [
      mkPairing({ id: "pp-1", consentObtained: true }),
      mkPairing({ id: "pp-2", consentObtained: false, menteeId: "child-2" }),
    ];
    const result = evaluatePairingQuality(pairings);
    expect(result.consentRate).toBe(50);
  });

  it("calculates risk assessed rate correctly", () => {
    const pairings = [
      mkPairing({ id: "pp-1", riskAssessed: true }),
      mkPairing({ id: "pp-2", riskAssessed: false, menteeId: "child-2" }),
      mkPairing({ id: "pp-3", riskAssessed: false, menteeId: "child-3" }),
    ];
    const result = evaluatePairingQuality(pairings);
    expect(result.riskAssessedRate).toBe(33);
  });

  it("counts match criteria defined rate", () => {
    const pairings = [
      mkPairing({ id: "pp-1", matchCriteria: ["age"] }),
      mkPairing({ id: "pp-2", matchCriteria: [], menteeId: "child-2" }),
    ];
    const result = evaluatePairingQuality(pairings);
    expect(result.matchCriteriaDefinedRate).toBe(50);
  });

  it("counts active pairing rate", () => {
    const pairings = [
      mkPairing({ id: "pp-1", status: "active" }),
      mkPairing({ id: "pp-2", status: "completed", menteeId: "child-2" }),
    ];
    const result = evaluatePairingQuality(pairings);
    expect(result.activePairingRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluatePairingQuality([mkPairing()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("totalPairings matches input length", () => {
    const pairings = [mkPairing({ id: "pp-1" }), mkPairing({ id: "pp-2", menteeId: "c2" }), mkPairing({ id: "pp-3", menteeId: "c3" })];
    const result = evaluatePairingQuality(pairings);
    expect(result.totalPairings).toBe(3);
  });
});

// -- evaluateSessionEffectiveness ---------------------------------------------

describe("evaluateSessionEffectiveness", () => {
  it("returns 0 for empty sessions", () => {
    const result = evaluateSessionEffectiveness([], []);
    expect(result.overallScore).toBe(0);
    expect(result.totalSessions).toBe(0);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.goalsDiscussedRate).toBe(0);
    expect(result.progressMadeRate).toBe(0);
    expect(result.regularSessionRate).toBe(0);
  });

  it("scores high for all positive sessions with goals and progress", () => {
    const pairings = [mkPairing()];
    const sessions = [mkSession({ id: "ms-1" }), mkSession({ id: "ms-2" })];
    const result = evaluateSessionEffectiveness(sessions, pairings);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.positiveOutcomeRate).toBe(100);
    expect(result.goalsDiscussedRate).toBe(100);
    expect(result.progressMadeRate).toBe(100);
  });

  it("scores low for negative sessions without goals", () => {
    const pairings = [mkPairing()];
    const sessions = [mkSession({
      outcome: "negative",
      goalsDiscussed: false,
      progressMade: false,
    })];
    const result = evaluateSessionEffectiveness(sessions, pairings);
    expect(result.overallScore).toBeLessThan(10);
    expect(result.positiveOutcomeRate).toBe(0);
    expect(result.goalsDiscussedRate).toBe(0);
  });

  it("calculates positive outcome rate", () => {
    const pairings = [mkPairing()];
    const sessions = [
      mkSession({ id: "ms-1", outcome: "positive" }),
      mkSession({ id: "ms-2", outcome: "mixed" }),
      mkSession({ id: "ms-3", outcome: "negative" }),
      mkSession({ id: "ms-4", outcome: "positive" }),
    ];
    const result = evaluateSessionEffectiveness(sessions, pairings);
    expect(result.positiveOutcomeRate).toBe(50);
  });

  it("calculates goals discussed rate", () => {
    const sessions = [
      mkSession({ id: "ms-1", goalsDiscussed: true }),
      mkSession({ id: "ms-2", goalsDiscussed: false }),
    ];
    const result = evaluateSessionEffectiveness(sessions, [mkPairing()]);
    expect(result.goalsDiscussedRate).toBe(50);
  });

  it("calculates progress made rate", () => {
    const sessions = [
      mkSession({ id: "ms-1", progressMade: true }),
      mkSession({ id: "ms-2", progressMade: false }),
      mkSession({ id: "ms-3", progressMade: true }),
    ];
    const result = evaluateSessionEffectiveness(sessions, [mkPairing()]);
    expect(result.progressMadeRate).toBe(67);
  });

  it("calculates regular session rate for active pairings", () => {
    const pairings = [
      mkPairing({ id: "pp-1", status: "active" }),
      mkPairing({ id: "pp-2", status: "active", menteeId: "child-alex", menteeName: "Alex" }),
    ];
    const sessions = [
      mkSession({ id: "ms-1", pairingId: "pp-1" }),
      mkSession({ id: "ms-2", pairingId: "pp-1" }),
      // pp-2 has only 1 session — not regular
      mkSession({ id: "ms-3", pairingId: "pp-2" }),
    ];
    const result = evaluateSessionEffectiveness(sessions, pairings);
    expect(result.regularSessionRate).toBe(50);
  });

  it("regular session rate is 0 when no active pairings", () => {
    const pairings = [mkPairing({ status: "completed" })];
    const sessions = [mkSession()];
    const result = evaluateSessionEffectiveness(sessions, pairings);
    expect(result.regularSessionRate).toBe(0);
  });

  it("handles cancelled sessions", () => {
    const sessions = [
      mkSession({ id: "ms-1", outcome: "cancelled" }),
      mkSession({ id: "ms-2", outcome: "positive" }),
    ];
    const result = evaluateSessionEffectiveness(sessions, [mkPairing()]);
    expect(result.positiveOutcomeRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateSessionEffectiveness([mkSession(), mkSession({ id: "ms-2" })], [mkPairing()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("totalSessions matches input", () => {
    const sessions = [mkSession({ id: "ms-1" }), mkSession({ id: "ms-2" }), mkSession({ id: "ms-3" })];
    const result = evaluateSessionEffectiveness(sessions, [mkPairing()]);
    expect(result.totalSessions).toBe(3);
  });
});

// -- evaluateRelationshipSafeguarding -----------------------------------------

describe("evaluateRelationshipSafeguarding", () => {
  it("returns 25 when no pairings exist (nothing to safeguard)", () => {
    const result = evaluateRelationshipSafeguarding([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalReviews).toBe(0);
  });

  it("returns 0 when pairings exist but no reviews done", () => {
    const result = evaluateRelationshipSafeguarding([], [mkPairing()]);
    expect(result.overallScore).toBe(0);
    expect(result.totalReviews).toBe(0);
  });

  it("scores high for all healthy reviews with no concerns", () => {
    const reviews = [mkReview(), mkReview({ id: "rr-2", pairingId: "pp-2" })];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.healthyRelationshipRate).toBe(100);
    expect(result.boundariesRespectedRate).toBe(100);
    expect(result.noSafeguardingConcernRate).toBe(100);
    expect(result.bothBenefitingRate).toBe(100);
  });

  it("scores low for unhealthy reviews with concerns", () => {
    const reviews = [mkReview({
      relationshipHealthy: false,
      boundariesRespected: false,
      safeguardingConcern: "bullying_risk",
      mentorBenefiting: false,
      menteeBenefiting: false,
    })];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.overallScore).toBe(0);
    expect(result.healthyRelationshipRate).toBe(0);
    expect(result.noSafeguardingConcernRate).toBe(0);
  });

  it("calculates healthy relationship rate", () => {
    const reviews = [
      mkReview({ id: "rr-1", relationshipHealthy: true }),
      mkReview({ id: "rr-2", relationshipHealthy: false }),
    ];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.healthyRelationshipRate).toBe(50);
  });

  it("calculates boundaries respected rate", () => {
    const reviews = [
      mkReview({ id: "rr-1", boundariesRespected: true }),
      mkReview({ id: "rr-2", boundariesRespected: false }),
      mkReview({ id: "rr-3", boundariesRespected: true }),
    ];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.boundariesRespectedRate).toBe(67);
  });

  it("calculates no safeguarding concern rate", () => {
    const reviews = [
      mkReview({ id: "rr-1", safeguardingConcern: "none" }),
      mkReview({ id: "rr-2", safeguardingConcern: "power_imbalance" }),
    ];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.noSafeguardingConcernRate).toBe(50);
  });

  it("calculates both benefiting rate", () => {
    const reviews = [
      mkReview({ id: "rr-1", mentorBenefiting: true, menteeBenefiting: true }),
      mkReview({ id: "rr-2", mentorBenefiting: true, menteeBenefiting: false }),
      mkReview({ id: "rr-3", mentorBenefiting: false, menteeBenefiting: true }),
    ];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.bothBenefitingRate).toBe(33);
  });

  it("score capped at 25", () => {
    const result = evaluateRelationshipSafeguarding([mkReview()], [mkPairing()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("totalReviews matches input when pairings exist", () => {
    const reviews = [mkReview({ id: "rr-1" }), mkReview({ id: "rr-2" })];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.totalReviews).toBe(2);
  });

  it("handles exploitation risk correctly", () => {
    const reviews = [mkReview({ safeguardingConcern: "exploitation_risk" })];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.noSafeguardingConcernRate).toBe(0);
  });

  it("handles emotional dependency correctly", () => {
    const reviews = [mkReview({ safeguardingConcern: "emotional_dependency" })];
    const result = evaluateRelationshipSafeguarding(reviews, [mkPairing()]);
    expect(result.noSafeguardingConcernRate).toBe(0);
  });
});

// -- evaluateStaffSupport -----------------------------------------------------

describe("evaluateStaffSupport", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffSupport([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.peerMentoringTrainedRate).toBe(0);
    expect(result.safeguardingInPeerRate).toBe(0);
    expect(result.conflictResolutionRate).toBe(0);
    expect(result.boundarySettingRate).toBe(0);
    expect(result.supportingMentorsRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const training = [mkTraining(), mkTraining({ id: "smt-2", staffId: "s2" })];
    const result = evaluateStaffSupport(training);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.peerMentoringTrainedRate).toBe(100);
    expect(result.safeguardingInPeerRate).toBe(100);
  });

  it("scores 0 for untrained staff", () => {
    const training = [mkTraining({
      peerMentoringTrained: false,
      safeguardingInPeerRelationships: false,
      conflictResolution: false,
      boundarySetting: false,
      supportingYoungMentors: false,
    })];
    const result = evaluateStaffSupport(training);
    expect(result.overallScore).toBe(0);
  });

  it("calculates peer mentoring trained rate", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", peerMentoringTrained: true }),
      mkTraining({ id: "smt-2", staffId: "s2", peerMentoringTrained: false }),
    ];
    const result = evaluateStaffSupport(training);
    expect(result.peerMentoringTrainedRate).toBe(50);
  });

  it("calculates safeguarding in peer rate", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", safeguardingInPeerRelationships: true }),
      mkTraining({ id: "smt-2", staffId: "s2", safeguardingInPeerRelationships: false }),
      mkTraining({ id: "smt-3", staffId: "s3", safeguardingInPeerRelationships: true }),
    ];
    const result = evaluateStaffSupport(training);
    expect(result.safeguardingInPeerRate).toBe(67);
  });

  it("calculates conflict resolution rate", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", conflictResolution: true }),
      mkTraining({ id: "smt-2", staffId: "s2", conflictResolution: false }),
    ];
    const result = evaluateStaffSupport(training);
    expect(result.conflictResolutionRate).toBe(50);
  });

  it("calculates boundary setting rate", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", boundarySetting: true }),
      mkTraining({ id: "smt-2", staffId: "s2", boundarySetting: false }),
    ];
    const result = evaluateStaffSupport(training);
    expect(result.boundarySettingRate).toBe(50);
  });

  it("calculates supporting mentors rate", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", supportingYoungMentors: true }),
      mkTraining({ id: "smt-2", staffId: "s2", supportingYoungMentors: false }),
    ];
    const result = evaluateStaffSupport(training);
    expect(result.supportingMentorsRate).toBe(50);
  });

  it("score capped at 25", () => {
    const result = evaluateStaffSupport([mkTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("totalStaff matches input", () => {
    const training = [mkTraining({ id: "smt-1", staffId: "s1" }), mkTraining({ id: "smt-2", staffId: "s2" }), mkTraining({ id: "smt-3", staffId: "s3" })];
    const result = evaluateStaffSupport(training);
    expect(result.totalStaff).toBe(3);
  });

  it("handles partial training across multiple staff", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", conflictResolution: false, supportingYoungMentors: false }),
      mkTraining({ id: "smt-2", staffId: "s2" }),
    ];
    const result = evaluateStaffSupport(training);
    expect(result.conflictResolutionRate).toBe(50);
    expect(result.supportingMentorsRate).toBe(50);
    expect(result.peerMentoringTrainedRate).toBe(100);
  });
});

// -- buildChildMentoringProfiles ----------------------------------------------

describe("buildChildMentoringProfiles", () => {
  it("returns empty for no pairings", () => {
    expect(buildChildMentoringProfiles([], [], [])).toEqual([]);
  });

  it("creates profiles for both mentor and mentee", () => {
    const pairings = [mkPairing()];
    const profiles = buildChildMentoringProfiles(pairings, [], []);
    expect(profiles).toHaveLength(2);
    expect(profiles.some((p) => p.childId === "child-morgan")).toBe(true);
    expect(profiles.some((p) => p.childId === "child-jordan")).toBe(true);
  });

  it("assigns correct roles", () => {
    const pairings = [mkPairing()];
    const profiles = buildChildMentoringProfiles(pairings, [], []);
    const mentor = profiles.find((p) => p.childId === "child-morgan");
    const mentee = profiles.find((p) => p.childId === "child-jordan");
    expect(mentor!.roles).toContain("mentor");
    expect(mentee!.roles).toContain("mentee");
  });

  it("child with both roles gets both", () => {
    const pairings = [
      mkPairing({ id: "pp-1", mentorId: "child-a", mentorName: "A", menteeId: "child-b", menteeName: "B" }),
      mkPairing({ id: "pp-2", mentorId: "child-b", mentorName: "B", menteeId: "child-c", menteeName: "C" }),
    ];
    const profiles = buildChildMentoringProfiles(pairings, [], []);
    const b = profiles.find((p) => p.childId === "child-b");
    expect(b!.roles).toContain("mentor");
    expect(b!.roles).toContain("mentee");
  });

  it("counts pairings per child", () => {
    const pairings = [
      mkPairing({ id: "pp-1", mentorId: "child-a", mentorName: "A", menteeId: "child-b", menteeName: "B" }),
      mkPairing({ id: "pp-2", mentorId: "child-a", mentorName: "A", menteeId: "child-c", menteeName: "C" }),
    ];
    const profiles = buildChildMentoringProfiles(pairings, [], []);
    const a = profiles.find((p) => p.childId === "child-a");
    expect(a!.pairingsCount).toBe(2);
  });

  it("counts sessions for child's pairings", () => {
    const pairings = [mkPairing({ id: "pp-1" })];
    const sessions = [
      mkSession({ id: "ms-1", pairingId: "pp-1" }),
      mkSession({ id: "ms-2", pairingId: "pp-1" }),
      mkSession({ id: "ms-3", pairingId: "pp-other" }), // different pairing
    ];
    const profiles = buildChildMentoringProfiles(pairings, sessions, []);
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.sessionsInPeriod).toBe(2);
  });

  it("calculates positive outcome rate", () => {
    const pairings = [mkPairing({ id: "pp-1" })];
    const sessions = [
      mkSession({ id: "ms-1", pairingId: "pp-1", outcome: "positive" }),
      mkSession({ id: "ms-2", pairingId: "pp-1", outcome: "mixed" }),
    ];
    const profiles = buildChildMentoringProfiles(pairings, sessions, []);
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.positiveOutcomeRate).toBe(50);
  });

  it("counts safeguarding concerns", () => {
    const pairings = [mkPairing({ id: "pp-1" })];
    const reviews = [
      mkReview({ id: "rr-1", pairingId: "pp-1", safeguardingConcern: "bullying_risk" }),
      mkReview({ id: "rr-2", pairingId: "pp-1", safeguardingConcern: "none" }),
    ];
    const profiles = buildChildMentoringProfiles(pairings, [], reviews);
    const morgan = profiles.find((p) => p.childId === "child-morgan");
    expect(morgan!.safeguardingConcerns).toBe(1);
  });

  it("score capped at 10", () => {
    const pairings = [mkPairing()];
    const sessions = [mkSession({ pairingId: "pp-1" }), mkSession({ id: "ms-2", pairingId: "pp-1" })];
    const reviews = [mkReview({ pairingId: "pp-1" })];
    const profiles = buildChildMentoringProfiles(pairings, sessions, reviews);
    for (const p of profiles) {
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("child with no sessions scores lower than child with sessions", () => {
    const pairings = [
      mkPairing({ id: "pp-1", mentorId: "child-a", mentorName: "A", menteeId: "child-b", menteeName: "B" }),
    ];
    const sessions = [mkSession({ pairingId: "pp-1", outcome: "positive" })];
    const reviews = [mkReview({ pairingId: "pp-1" })];
    const withSessions = buildChildMentoringProfiles(pairings, sessions, reviews);
    const withoutSessions = buildChildMentoringProfiles(pairings, [], reviews);
    const aWith = withSessions.find((p) => p.childId === "child-a")!;
    const aWithout = withoutSessions.find((p) => p.childId === "child-a")!;
    expect(aWith.overallScore).toBeGreaterThan(aWithout.overallScore);
  });

  it("consent and risk contribute to score", () => {
    const consented = [mkPairing({ id: "pp-1", consentObtained: true, riskAssessed: true })];
    const notConsented = [mkPairing({ id: "pp-1", consentObtained: false, riskAssessed: false })];
    const profilesA = buildChildMentoringProfiles(consented, [], []);
    const profilesB = buildChildMentoringProfiles(notConsented, [], []);
    const mA = profilesA.find((p) => p.childId === "child-morgan")!;
    const mB = profilesB.find((p) => p.childId === "child-morgan")!;
    expect(mA.overallScore).toBeGreaterThan(mB.overallScore);
  });

  it("does not duplicate roles", () => {
    const pairings = [
      mkPairing({ id: "pp-1", mentorId: "child-a", mentorName: "A", menteeId: "child-b", menteeName: "B" }),
      mkPairing({ id: "pp-2", mentorId: "child-a", mentorName: "A", menteeId: "child-c", menteeName: "C" }),
    ];
    const profiles = buildChildMentoringProfiles(pairings, [], []);
    const a = profiles.find((p) => p.childId === "child-a");
    expect(a!.roles.filter((r) => r === "mentor")).toHaveLength(1);
  });
});

// -- generatePeerMentoringEffectivenessIntelligence ---------------------------

describe("generatePeerMentoringEffectivenessIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generatePeerMentoringEffectivenessIntelligence(
      [mkPairing()], [mkSession(), mkSession({ id: "ms-2" })], [mkReview()], [mkTraining()],
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.overallScore).toBe(
      result.pairingQuality.overallScore +
      result.sessionEffectiveness.overallScore +
      result.relationshipSafeguarding.overallScore +
      result.staffSupport.overallScore,
    );
  });

  it("returns inadequate with no data except safeguarding baseline", () => {
    const result = generatePeerMentoringEffectivenessIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    // No pairings so safeguarding = 25, everything else 0
    expect(result.overallScore).toBe(25);
    expect(result.rating).toBe("inadequate");
  });

  it("returns outstanding for fully compliant home", () => {
    const pairings = [mkPairing(), mkPairing({ id: "pp-2", menteeId: "child-alex", menteeName: "Alex" })];
    const sessions = [
      mkSession({ id: "ms-1", pairingId: "pp-1" }),
      mkSession({ id: "ms-2", pairingId: "pp-1" }),
      mkSession({ id: "ms-3", pairingId: "pp-2" }),
      mkSession({ id: "ms-4", pairingId: "pp-2" }),
    ];
    const reviews = [mkReview(), mkReview({ id: "rr-2", pairingId: "pp-2" })];
    const training = [mkTraining(), mkTraining({ id: "smt-2", staffId: "s2" })];
    const result = generatePeerMentoringEffectivenessIntelligence(
      pairings, sessions, reviews, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBe("outstanding");
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
  });

  it("score capped at 100", () => {
    const result = generatePeerMentoringEffectivenessIntelligence(
      [mkPairing()], [mkSession(), mkSession({ id: "ms-2" })], [mkReview()], [mkTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generatePeerMentoringEffectivenessIntelligence(
      [], [], [], [], "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  // -- Strengths --

  it("adds strength for consent obtained", () => {
    const pairings = [mkPairing({ consentObtained: true })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Consent obtained"))).toBe(true);
  });

  it("adds strength for risk assessments", () => {
    const pairings = [mkPairing({ riskAssessed: true })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Risk assessments"))).toBe(true);
  });

  it("adds strength for match criteria", () => {
    const pairings = [mkPairing({ matchCriteria: ["age_appropriate"] })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Match criteria"))).toBe(true);
  });

  it("adds strength for positive outcomes", () => {
    const sessions = Array.from({ length: 5 }, (_, i) => mkSession({ id: `ms-${i}`, outcome: "positive" }));
    const result = generatePeerMentoringEffectivenessIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Positive outcomes"))).toBe(true);
  });

  it("adds strength for goals discussed", () => {
    const sessions = Array.from({ length: 3 }, (_, i) => mkSession({ id: `ms-${i}`, goalsDiscussed: true }));
    const result = generatePeerMentoringEffectivenessIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Goals discussed"))).toBe(true);
  });

  it("adds strength for no safeguarding concerns", () => {
    const reviews = [mkReview({ safeguardingConcern: "none" })];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("No safeguarding concerns"))).toBe(true);
  });

  it("adds strength for healthy relationships", () => {
    const reviews = [mkReview({ relationshipHealthy: true })];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("healthy"))).toBe(true);
  });

  it("adds strength for both benefiting", () => {
    const reviews = [mkReview({ mentorBenefiting: true, menteeBenefiting: true })];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("Both mentor and mentee benefiting"))).toBe(true);
  });

  it("adds strength for all staff trained", () => {
    const training = [mkTraining()];
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.strengths.some((s) => s.includes("All staff trained"))).toBe(true);
  });

  // -- Areas for improvement --

  it("adds area for no pairings", () => {
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No peer mentoring pairings"))).toBe(true);
  });

  it("adds area for missing consent", () => {
    const pairings = [mkPairing({ consentObtained: false })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Consent not obtained"))).toBe(true);
  });

  it("adds area for missing risk assessments", () => {
    const pairings = [mkPairing({ riskAssessed: false })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Risk assessments missing"))).toBe(true);
  });

  it("adds area for no sessions despite pairings", () => {
    const pairings = [mkPairing()];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No mentoring sessions recorded"))).toBe(true);
  });

  it("adds area for no reviews despite pairings", () => {
    const pairings = [mkPairing()];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No relationship reviews completed"))).toBe(true);
  });

  it("adds area for low positive outcome rate", () => {
    const sessions = [
      mkSession({ id: "ms-1", outcome: "negative" }),
      mkSession({ id: "ms-2", outcome: "negative" }),
      mkSession({ id: "ms-3", outcome: "mixed" }),
    ];
    const result = generatePeerMentoringEffectivenessIntelligence([], sessions, [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Low positive outcome rate"))).toBe(true);
  });

  it("adds area for no training records", () => {
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("No staff training records"))).toBe(true);
  });

  it("adds area for safeguarding concerns in reviews", () => {
    const reviews = [
      mkReview({ id: "rr-1", safeguardingConcern: "power_imbalance" }),
      mkReview({ id: "rr-2", safeguardingConcern: "none" }),
      mkReview({ id: "rr-3", safeguardingConcern: "boundary_issue" }),
    ];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("Safeguarding concerns identified"))).toBe(true);
  });

  it("adds area for low safeguarding in peer training", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", safeguardingInPeerRelationships: false }),
      mkTraining({ id: "smt-2", staffId: "s2", safeguardingInPeerRelationships: false }),
      mkTraining({ id: "smt-3", staffId: "s3", safeguardingInPeerRelationships: true }),
    ];
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.areasForImprovement.some((a) => a.includes("safeguarding within peer relationships"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for ended early pairings", () => {
    const pairings = [mkPairing({ status: "ended_early" })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("ended early"))).toBe(true);
  });

  it("adds URGENT for exploitation or bullying", () => {
    const reviews = [mkReview({ safeguardingConcern: "exploitation_risk" })];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("exploitation risk or bullying"))).toBe(true);
  });

  it("adds URGENT for bullying risk", () => {
    const reviews = [mkReview({ safeguardingConcern: "bullying_risk" })];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("exploitation risk or bullying"))).toBe(true);
  });

  it("adds action for non-urgent safeguarding concerns", () => {
    const reviews = [mkReview({ safeguardingConcern: "power_imbalance" })];
    const result = generatePeerMentoringEffectivenessIntelligence([mkPairing()], [], reviews, [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("safeguarding concern(s)"))).toBe(true);
  });

  it("adds URGENT for missing consent", () => {
    const pairings = [mkPairing({ consentObtained: false })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("consent"))).toBe(true);
  });

  it("adds action for missing risk assessments", () => {
    const pairings = [mkPairing({ riskAssessed: false })];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("risk assessments"))).toBe(true);
  });

  it("adds action to consider establishing scheme when no pairings", () => {
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Consider establishing"))).toBe(true);
  });

  it("adds action for scheduling reviews when none exist", () => {
    const pairings = [mkPairing()];
    const result = generatePeerMentoringEffectivenessIntelligence(pairings, [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("Schedule relationship reviews"))).toBe(true);
  });

  it("adds action for low conflict resolution training", () => {
    const training = [
      mkTraining({ id: "smt-1", staffId: "s1", conflictResolution: false }),
      mkTraining({ id: "smt-2", staffId: "s2", conflictResolution: false }),
      mkTraining({ id: "smt-3", staffId: "s3", conflictResolution: false }),
      mkTraining({ id: "smt-4", staffId: "s4", conflictResolution: true }),
    ];
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], training, "test", "2026-01-01", "2026-06-01");
    expect(result.actions.some((a) => a.includes("conflict resolution training"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generatePeerMentoringEffectivenessIntelligence([], [], [], [], "test", "2026-01-01", "2026-06-01");
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 11"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 15"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Peer Support Guidelines (DfE)"))).toBe(true);
  });

  // -- Integration --

  it("handles Chamberlain House realistic scenario", () => {
    const pairings: PeerPairing[] = [
      mkPairing({ id: "pp-1", mentorId: "child-morgan", mentorName: "Morgan", menteeId: "child-jordan", menteeName: "Jordan", status: "active", consentObtained: true, riskAssessed: true, matchCriteria: ["age_appropriate", "shared_interests", "personality_compatibility"] }),
      mkPairing({ id: "pp-2", mentorId: "child-alex", mentorName: "Alex", menteeId: "child-riley", menteeName: "Riley", status: "completed", consentObtained: true, riskAssessed: true, matchCriteria: ["welcome_buddy", "similar_age"] }),
    ];
    const sessions: MentoringSession[] = [
      mkSession({ id: "ms-1", pairingId: "pp-1", outcome: "positive", goalsDiscussed: true, progressMade: true }),
      mkSession({ id: "ms-2", pairingId: "pp-1", outcome: "positive", goalsDiscussed: true, progressMade: true }),
      mkSession({ id: "ms-3", pairingId: "pp-1", outcome: "mixed", goalsDiscussed: true, progressMade: false }),
      mkSession({ id: "ms-4", pairingId: "pp-2", outcome: "positive", goalsDiscussed: false, progressMade: true }),
    ];
    const reviews: RelationshipReview[] = [
      mkReview({ id: "rr-1", pairingId: "pp-1", safeguardingConcern: "none" }),
      mkReview({ id: "rr-2", pairingId: "pp-2", safeguardingConcern: "none" }),
    ];
    const training: StaffMentoringTraining[] = [
      mkTraining({ id: "smt-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      mkTraining({ id: "smt-2", staffId: "staff-tom", staffName: "Tom Richards", supportingYoungMentors: false }),
      mkTraining({ id: "smt-3", staffId: "staff-lisa", staffName: "Lisa Williams", conflictResolution: false }),
      mkTraining({ id: "smt-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];
    const result = generatePeerMentoringEffectivenessIntelligence(
      pairings, sessions, reviews, training,
      "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(result.rating).toBeDefined();
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles.length).toBeGreaterThanOrEqual(3);
    expect(result.regulatoryLinks).toHaveLength(7);
  });

  it("child profiles reflect both mentor and mentee", () => {
    const pairings = [mkPairing()];
    const result = generatePeerMentoringEffectivenessIntelligence(
      pairings, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  it("no strengths when nothing good present", () => {
    const pairings = [mkPairing({ consentObtained: false, riskAssessed: false, matchCriteria: [] })];
    const result = generatePeerMentoringEffectivenessIntelligence(
      pairings, [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths).toHaveLength(0);
  });

  it("handles empty child profiles gracefully when no pairings", () => {
    const result = generatePeerMentoringEffectivenessIntelligence(
      [], [], [], [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(0);
  });
});
