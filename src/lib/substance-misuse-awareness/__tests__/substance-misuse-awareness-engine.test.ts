import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getSubstanceTypeLabel,
  getRiskLevelLabel,
  getScreeningOutcomeLabel,
  getSessionTypeLabel,
  getInterventionOutcomeLabel,
  getRatingLabel,
  evaluateRiskScreening,
  evaluateEducationPrevention,
  evaluateInterventionSupport,
  evaluateStaffSubstanceReadiness,
  buildChildSubstanceSummaries,
  generateSubstanceMisuseAwarenessIntelligence,
} from "../substance-misuse-awareness-engine";
import type {
  ChildSubstanceProfile,
  AwarenessSession,
  SubstanceIntervention,
  StaffSubstanceTraining,
} from "../substance-misuse-awareness-engine";

// -- Helpers -------------------------------------------------------------------

function makeProfile(overrides: Partial<ChildSubstanceProfile> = {}): ChildSubstanceProfile {
  return {
    id: "p-1", childId: "child-alex", childName: "Alex", riskLevel: "no_concerns",
    screeningDate: "2026-04-01", screenedBy: "Darren Laville", screeningOutcome: "no_concerns",
    substancesOfConcern: ["none"], reviewDate: "2026-07-01", reviewCurrent: true,
    harmReductionPlanInPlace: false, professionalReferralMade: false,
    ...overrides,
  };
}

function makeSession(overrides: Partial<AwarenessSession> = {}): AwarenessSession {
  return {
    id: "s-1", date: "2026-04-15", sessionType: "group_education", facilitatedBy: "Sarah Johnson",
    childrenAttended: ["child-alex", "child-jordan", "child-morgan"],
    topicsCovered: ["alcohol awareness"], childEngagement: "high", resourcesProvided: true,
    ...overrides,
  };
}

function makeIntervention(overrides: Partial<SubstanceIntervention> = {}): SubstanceIntervention {
  return {
    id: "i-1", childId: "child-jordan", childName: "Jordan", date: "2026-04-20",
    substanceType: "vaping", referralService: "Youth Substance Service",
    interventionOutcome: "engaged", recoveryPlanInPlace: true, parentNotified: true,
    socialWorkerNotified: true, followUpScheduled: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffSubstanceTraining> = {}): StaffSubstanceTraining {
  return {
    id: "t-1", staffId: "staff-sarah", staffName: "Sarah Johnson",
    substanceAwareness: true, riskScreeningTrained: true, harmReductionTrained: true,
    motivationalInterviewing: true, referralPathwayKnowledge: true, emergencyResponseTrained: true,
    ...overrides,
  };
}

// -- pct -----------------------------------------------------------------------

describe("pct", () => {
  it("returns 0 for zero denominator", () => expect(pct(5, 0)).toBe(0));
  it("rounds correctly", () => expect(pct(1, 3)).toBe(33));
  it("returns 100 for equal values", () => expect(pct(10, 10)).toBe(100));
  it("returns 50 for half", () => expect(pct(5, 10)).toBe(50));
});

// -- getRating -----------------------------------------------------------------

describe("getRating", () => {
  it("outstanding for 80+", () => expect(getRating(80)).toBe("outstanding"));
  it("good for 60-79", () => expect(getRating(60)).toBe("good"));
  it("requires_improvement for 40-59", () => expect(getRating(40)).toBe("requires_improvement"));
  it("inadequate for <40", () => expect(getRating(39)).toBe("inadequate"));
});

// -- Label functions -----------------------------------------------------------

describe("label functions", () => {
  it("getSubstanceTypeLabel", () => {
    expect(getSubstanceTypeLabel("alcohol")).toBe("Alcohol");
    expect(getSubstanceTypeLabel("nps")).toBe("New Psychoactive Substances");
  });
  it("getRiskLevelLabel", () => {
    expect(getRiskLevelLabel("no_concerns")).toBe("No Concerns");
    expect(getRiskLevelLabel("active_use")).toBe("Active Use");
  });
  it("getScreeningOutcomeLabel", () => {
    expect(getScreeningOutcomeLabel("no_concerns")).toBe("No Concerns");
    expect(getScreeningOutcomeLabel("intervention_active")).toBe("Intervention Active");
  });
  it("getSessionTypeLabel", () => {
    expect(getSessionTypeLabel("group_education")).toBe("Group Education");
    expect(getSessionTypeLabel("harm_reduction")).toBe("Harm Reduction");
  });
  it("getInterventionOutcomeLabel", () => {
    expect(getInterventionOutcomeLabel("engaged")).toBe("Engaged");
    expect(getInterventionOutcomeLabel("declined")).toBe("Declined");
  });
  it("getRatingLabel", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateRiskScreening -----------------------------------------------------

describe("evaluateRiskScreening", () => {
  it("returns 0 for empty profiles", () => {
    const r = evaluateRiskScreening([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalProfiles).toBe(0);
  });

  it("returns max score for all-screened no-concern profiles", () => {
    const profiles = Array.from({ length: 5 }, (_, i) => makeProfile({ id: `p-${i}`, childId: `c-${i}` }));
    const r = evaluateRiskScreening(profiles);
    expect(r.overallScore).toBe(25);
    expect(r.screenedRate).toBe(100);
    expect(r.reviewCurrentRate).toBe(100);
  });

  it("scores lower for overdue reviews", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", reviewCurrent: false }),
      makeProfile({ id: "p2", childId: "c2", reviewCurrent: false }),
    ];
    const r = evaluateRiskScreening(profiles);
    expect(r.reviewCurrentRate).toBe(0);
    expect(r.overallScore).toBeLessThan(25);
  });

  it("checks harm reduction for at-risk children", () => {
    const profiles = [
      makeProfile({ id: "p1", childId: "c1", riskLevel: "medium", harmReductionPlanInPlace: true, professionalReferralMade: true }),
      makeProfile({ id: "p2", childId: "c2", riskLevel: "medium", harmReductionPlanInPlace: false, professionalReferralMade: false }),
    ];
    const r = evaluateRiskScreening(profiles);
    expect(r.harmReductionRate).toBe(50);
    expect(r.referralMadeRate).toBe(50);
  });

  it("leaves harm reduction and referral unmeasured when no concerns", () => {
    const profiles = [makeProfile()];
    const r = evaluateRiskScreening(profiles);
    // Nobody is at risk, so there is nothing to plan for or refer
    expect(r.harmReductionRate).toBeNull();
    expect(r.referralMadeRate).toBeNull();
  });

  it("caps at 25", () => {
    const profiles = Array.from({ length: 50 }, (_, i) => makeProfile({ id: `p-${i}`, childId: `c-${i}` }));
    expect(evaluateRiskScreening(profiles).overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateEducationPrevention -----------------------------------------------

describe("evaluateEducationPrevention", () => {
  it("returns 0 for empty sessions", () => {
    const r = evaluateEducationPrevention([], 3);
    expect(r.overallScore).toBe(0);
    expect(r.totalSessions).toBe(0);
  });

  it("returns high score for diverse engaged sessions", () => {
    const sessions = [
      makeSession({ id: "s1", sessionType: "group_education" }),
      makeSession({ id: "s2", sessionType: "individual_awareness" }),
      makeSession({ id: "s3", sessionType: "peer_education" }),
      makeSession({ id: "s4", sessionType: "external_speaker" }),
    ];
    const r = evaluateEducationPrevention(sessions, 3);
    expect(r.overallScore).toBeGreaterThanOrEqual(20);
    expect(r.sessionTypeVariety).toBe(4);
  });

  it("penalises low engagement", () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `s-${i}`, childEngagement: "low", resourcesProvided: false }),
    );
    const r = evaluateEducationPrevention(sessions, 3);
    expect(r.highEngagementRate).toBe(0);
    expect(r.overallScore).toBeLessThan(20);
  });

  it("calculates children reached correctly", () => {
    const sessions = [
      makeSession({ id: "s1", childrenAttended: ["c1", "c2"] }),
      makeSession({ id: "s2", childrenAttended: ["c2", "c3"] }),
    ];
    const r = evaluateEducationPrevention(sessions, 4);
    expect(r.childrenReachedRate).toBe(75);
  });

  it("caps at 25", () => {
    const sessions = Array.from({ length: 50 }, (_, i) => makeSession({ id: `s-${i}` }));
    expect(evaluateEducationPrevention(sessions, 3).overallScore).toBeLessThanOrEqual(25);
  });

  it("reports resources provided rate", () => {
    const sessions = [
      makeSession({ id: "s1", resourcesProvided: true }),
      makeSession({ id: "s2", resourcesProvided: false }),
    ];
    expect(evaluateEducationPrevention(sessions, 3).resourcesProvidedRate).toBe(50);
  });
});

// -- evaluateInterventionSupport -----------------------------------------------

describe("evaluateInterventionSupport", () => {
  it("returns 25 for no interventions needed", () => {
    const r = evaluateInterventionSupport([]);
    expect(r.overallScore).toBe(25);
    expect(r.totalInterventions).toBe(0);
  });

  it("returns max score for well-managed interventions", () => {
    const interventions = Array.from({ length: 5 }, (_, i) => makeIntervention({ id: `i-${i}` }));
    const r = evaluateInterventionSupport(interventions);
    expect(r.overallScore).toBe(25);
    expect(r.engagedRate).toBe(100);
    expect(r.recoveryPlanRate).toBe(100);
  });

  it("returns 0 for all-declined unmanaged interventions", () => {
    const interventions = Array.from({ length: 5 }, (_, i) =>
      makeIntervention({
        id: `i-${i}`, interventionOutcome: "declined",
        recoveryPlanInPlace: false, followUpScheduled: false, parentNotified: false,
      }),
    );
    const r = evaluateInterventionSupport(interventions);
    expect(r.overallScore).toBe(0);
  });

  it("counts ongoing as engaged", () => {
    const interventions = [makeIntervention({ interventionOutcome: "ongoing" })];
    expect(evaluateInterventionSupport(interventions).engagedRate).toBe(100);
  });

  it("counts completed as engaged", () => {
    const interventions = [makeIntervention({ interventionOutcome: "completed" })];
    expect(evaluateInterventionSupport(interventions).engagedRate).toBe(100);
  });

  it("caps at 25", () => {
    const interventions = Array.from({ length: 50 }, (_, i) => makeIntervention({ id: `i-${i}` }));
    expect(evaluateInterventionSupport(interventions).overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffSubstanceReadiness -------------------------------------------

describe("evaluateStaffSubstanceReadiness", () => {
  it("returns 0 for empty training", () => {
    const r = evaluateStaffSubstanceReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });

  it("returns max score for fully trained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = evaluateStaffSubstanceReadiness(training);
    expect(r.overallScore).toBe(25);
  });

  it("returns 0 for untrained staff", () => {
    const training = Array.from({ length: 10 }, (_, i) =>
      makeTraining({
        id: `t-${i}`, staffId: `s-${i}`,
        substanceAwareness: false, riskScreeningTrained: false, harmReductionTrained: false,
        motivationalInterviewing: false, referralPathwayKnowledge: false, emergencyResponseTrained: false,
      }),
    );
    expect(evaluateStaffSubstanceReadiness(training).overallScore).toBe(0);
  });

  it("handles partial training", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2", motivationalInterviewing: false, emergencyResponseTrained: false }),
    ];
    const r = evaluateStaffSubstanceReadiness(training);
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.motivationalRate).toBe(50);
  });

  it("caps at 25", () => {
    const training = Array.from({ length: 50 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateStaffSubstanceReadiness(training).overallScore).toBeLessThanOrEqual(25);
  });

  it("single fully trained staff scores max", () => {
    expect(evaluateStaffSubstanceReadiness([makeTraining()]).overallScore).toBe(25);
  });
});

// -- buildChildSubstanceSummaries ----------------------------------------------

describe("buildChildSubstanceSummaries", () => {
  it("returns empty for no profiles", () => {
    expect(buildChildSubstanceSummaries([], [])).toHaveLength(0);
  });

  it("creates summaries from profiles", () => {
    const profiles = [makeProfile({ childId: "c1" }), makeProfile({ id: "p2", childId: "c2", childName: "Jordan" })];
    const summaries = buildChildSubstanceSummaries(profiles, []);
    expect(summaries).toHaveLength(2);
  });

  it("counts sessions attended", () => {
    const profiles = [makeProfile({ childId: "child-alex" })];
    const sessions = [
      makeSession({ id: "s1", childrenAttended: ["child-alex", "child-jordan"] }),
      makeSession({ id: "s2", childrenAttended: ["child-alex"] }),
    ];
    const summaries = buildChildSubstanceSummaries(profiles, sessions);
    expect(summaries[0].sessionsAttended).toBe(2);
  });

  it("counts substances of concern excluding none", () => {
    const profiles = [makeProfile({ substancesOfConcern: ["alcohol", "vaping"] })];
    const summaries = buildChildSubstanceSummaries(profiles, []);
    expect(summaries[0].substancesConcern).toBe(2);
  });

  it("gives higher score for no-concern children", () => {
    const noConcern = buildChildSubstanceSummaries([makeProfile({ riskLevel: "no_concerns" })], []);
    const highRisk = buildChildSubstanceSummaries([makeProfile({ riskLevel: "high" })], []);
    expect(noConcern[0].overallScore).toBeGreaterThan(highRisk[0].overallScore);
  });

  it("gives bonus for harm reduction plan when at risk", () => {
    const withPlan = buildChildSubstanceSummaries(
      [makeProfile({ riskLevel: "medium", harmReductionPlanInPlace: true })], [],
    );
    const withoutPlan = buildChildSubstanceSummaries(
      [makeProfile({ riskLevel: "medium", harmReductionPlanInPlace: false })], [],
    );
    expect(withPlan[0].overallScore).toBeGreaterThan(withoutPlan[0].overallScore);
  });

  it("caps child score at 10", () => {
    const profiles = [makeProfile()];
    const sessions = Array.from({ length: 20 }, (_, i) =>
      makeSession({ id: `s-${i}`, childrenAttended: ["child-alex"] }),
    );
    const summaries = buildChildSubstanceSummaries(profiles, sessions);
    expect(summaries[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("does not go below 0", () => {
    const profiles = [makeProfile({ riskLevel: "active_use", reviewCurrent: false, harmReductionPlanInPlace: false })];
    const summaries = buildChildSubstanceSummaries(profiles, []);
    expect(summaries[0].overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- generateSubstanceMisuseAwarenessIntelligence ------------------------------

describe("generateSubstanceMisuseAwarenessIntelligence", () => {
  const demoProfiles = [
    makeProfile({ id: "p1", childId: "child-alex", childName: "Alex" }),
    makeProfile({ id: "p2", childId: "child-jordan", childName: "Jordan", riskLevel: "low", screeningOutcome: "monitoring", substancesOfConcern: ["vaping"], harmReductionPlanInPlace: true }),
    makeProfile({ id: "p3", childId: "child-morgan", childName: "Morgan" }),
  ];

  const demoSessions = [
    makeSession({ id: "s1" }),
    makeSession({ id: "s2", sessionType: "individual_awareness" }),
  ];

  const demoTraining = [
    makeTraining({ id: "t1", staffId: "s1" }),
    makeTraining({ id: "t2", staffId: "s2" }),
    makeTraining({ id: "t3", staffId: "s3" }),
    makeTraining({ id: "t4", staffId: "s4" }),
  ];

  it("returns complete intelligence", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      demoProfiles, demoSessions, [], demoTraining, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.homeId).toBe("oak-house");
    expect(r.periodStart).toBe("2026-01-01");
    expect(r.periodEnd).toBe("2026-05-18");
    expect(r.overallScore).toBeGreaterThanOrEqual(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.rating).toBeDefined();
  });

  it("sums evaluator scores correctly", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      demoProfiles, demoSessions, [], demoTraining, "oak-house", "2026-01-01", "2026-05-18",
    );
    const sum = r.riskScreening.overallScore + r.educationPrevention.overallScore +
      r.interventionSupport.overallScore + r.staffSubstanceReadiness.overallScore;
    expect(r.overallScore).toBe(Math.min(sum, 100));
  });

  it("rates outstanding for well-performing home", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      demoProfiles, demoSessions, [], demoTraining, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeGreaterThanOrEqual(80);
    expect(r.rating).toBe("outstanding");
  });

  it("returns inadequate-range for all-empty inputs", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      [], [], [], [], "empty", "2026-01-01", "2026-05-18",
    );
    // screening=0, education=0, intervention=25, staff=0 → 25
    expect(r.overallScore).toBe(25);
    expect(r.rating).toBe("inadequate");
  });

  it("generates URGENT actions for empty inputs", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      [], [], [], [], "empty", "2026-01-01", "2026-05-18",
    );
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBeGreaterThanOrEqual(3);
  });

  it("caps overall score at 100", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      demoProfiles, demoSessions, [], demoTraining, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });

  it("includes child profiles", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      demoProfiles, demoSessions, [], demoTraining, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.childProfiles.length).toBe(3);
  });

  it("has 7 regulatory links", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      [], [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("includes UNCRC Article 33", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      [], [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.regulatoryLinks.some((l) => l.includes("UNCRC Article 33"))).toBe(true);
  });

  it("generates strengths for high-performing home", () => {
    const r = generateSubstanceMisuseAwarenessIntelligence(
      demoProfiles, demoSessions, [], demoTraining, "oak-house", "2026-01-01", "2026-05-18",
    );
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates URGENT for active use children", () => {
    const profiles = [makeProfile({ riskLevel: "active_use" })];
    const r = generateSubstanceMisuseAwarenessIntelligence(
      profiles, [], [], [], "x", "2026-01-01", "2026-05-18",
    );
    expect(r.actions.some((a) => a.includes("active substance use"))).toBe(true);
  });
});

// -- Edge cases ----------------------------------------------------------------

describe("Edge cases", () => {
  it("evaluator scores never exceed 25", () => {
    const profiles = Array.from({ length: 100 }, (_, i) => makeProfile({ id: `p-${i}`, childId: `c-${i}` }));
    const sessions = Array.from({ length: 100 }, (_, i) => makeSession({ id: `s-${i}` }));
    const training = Array.from({ length: 100 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    expect(evaluateRiskScreening(profiles).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateEducationPrevention(sessions, 100).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateInterventionSupport([]).overallScore).toBeLessThanOrEqual(25);
    expect(evaluateStaffSubstanceReadiness(training).overallScore).toBeLessThanOrEqual(25);
  });

  it("large dataset runs without error", () => {
    const profiles = Array.from({ length: 200 }, (_, i) => makeProfile({ id: `p-${i}`, childId: `c-${i % 20}` }));
    const sessions = Array.from({ length: 50 }, (_, i) => makeSession({ id: `s-${i}` }));
    const interventions = Array.from({ length: 20 }, (_, i) => makeIntervention({ id: `i-${i}` }));
    const training = Array.from({ length: 20 }, (_, i) => makeTraining({ id: `t-${i}`, staffId: `s-${i}` }));
    const r = generateSubstanceMisuseAwarenessIntelligence(
      profiles, sessions, interventions, training, "big", "2026-01-01", "2026-05-18",
    );
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
});
