// ══════════════════════════════════════════════════════════════════════════════
// Restraint Intelligence Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  pct,
  getRating,
  getRestraintTypeLabel,
  getRestraintOutcomeLabel,
  getRatingLabel,
  evaluateRestraintQuality,
  evaluateRestraintCompliance,
  evaluateRestraintPolicy,
  evaluateStaffRestraintReadiness,
  buildChildRestraintProfiles,
  generateRestraintIntelligence,
} from "../restraint-engine";
import type {
  RestraintIncident,
  RestraintPolicy,
  StaffRestraintTraining,
} from "../restraint-engine";

// ── Factory Functions ─────────────────────────────────────────────────────

function makeIncident(overrides: Partial<RestraintIncident> = {}): RestraintIncident {
  return {
    id: "inc-001",
    childId: "child-alex",
    childName: "Alex",
    incidentDate: "2026-03-15",
    restraintType: "physical_hold",
    outcome: "restraint_applied",
    deEscalationAttempted: true,
    proportionateResponse: true,
    injuryOccurred: false,
    bodyMapCompleted: true,
    parentNotified: true,
    ofstedNotified: true,
    debriefCompleted: true,
    childViewsRecorded: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<RestraintPolicy> = {}): RestraintPolicy {
  return {
    id: "pol-001",
    restraintReductionStrategy: true,
    approvedTechniquesOnly: true,
    deEscalationFirstPolicy: true,
    incidentReportingProtocol: true,
    bodyMapProtocol: true,
    notificationProcedure: true,
    regularReview: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffRestraintTraining> = {}): StaffRestraintTraining {
  return {
    id: "tr-001",
    staffId: "staff-sarah",
    staffName: "Sarah Johnson",
    approvedTechniquesCertified: true,
    deEscalationSkills: true,
    proportionalityUnderstanding: true,
    incidentReporting: true,
    childRightsAwareness: true,
    postIncidentSupport: true,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct helper
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when both are 0", () => {
    expect(pct(0, 0)).toBe(0);
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
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getRestraintTypeLabel", () => {
  it("returns correct label for physical_hold", () => {
    expect(getRestraintTypeLabel("physical_hold")).toBe("Physical Hold");
  });

  it("returns correct label for guided_away", () => {
    expect(getRestraintTypeLabel("guided_away")).toBe("Guided Away");
  });

  it("returns correct label for seated_hold", () => {
    expect(getRestraintTypeLabel("seated_hold")).toBe("Seated Hold");
  });

  it("returns correct label for standing_hold", () => {
    expect(getRestraintTypeLabel("standing_hold")).toBe("Standing Hold");
  });

  it("returns correct label for supine_hold", () => {
    expect(getRestraintTypeLabel("supine_hold")).toBe("Supine Hold");
  });

  it("returns correct label for prone_hold", () => {
    expect(getRestraintTypeLabel("prone_hold")).toBe("Prone Hold");
  });

  it("returns correct label for mechanical", () => {
    expect(getRestraintTypeLabel("mechanical")).toBe("Mechanical");
  });

  it("returns correct label for environmental_restriction", () => {
    expect(getRestraintTypeLabel("environmental_restriction")).toBe("Environmental Restriction");
  });
});

describe("getRestraintOutcomeLabel", () => {
  it("returns correct label for de_escalation_successful", () => {
    expect(getRestraintOutcomeLabel("de_escalation_successful")).toBe("De-escalation Successful");
  });

  it("returns correct label for restraint_applied", () => {
    expect(getRestraintOutcomeLabel("restraint_applied")).toBe("Restraint Applied");
  });

  it("returns correct label for self_resolved", () => {
    expect(getRestraintOutcomeLabel("self_resolved")).toBe("Self Resolved");
  });

  it("returns correct label for external_support", () => {
    expect(getRestraintOutcomeLabel("external_support")).toBe("External Support");
  });

  it("returns correct label for not_recorded", () => {
    expect(getRestraintOutcomeLabel("not_recorded")).toBe("Not Recorded");
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
// Evaluator 1: evaluateRestraintQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRestraintQuality", () => {
  it("returns all zeros for empty incidents", () => {
    const result = evaluateRestraintQuality([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.deEscalationRate).toBe(0);
    expect(result.proportionateRate).toBe(0);
    expect(result.noInjuryRate).toBe(0);
    expect(result.childViewsRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true incidents", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateRestraintQuality(incidents);
    expect(result.deEscalationRate).toBe(100);
    expect(result.proportionateRate).toBe(100);
    expect(result.noInjuryRate).toBe(100);
    expect(result.childViewsRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates partial scores correctly", () => {
    const incidents = [
      makeIncident({ id: "i1", deEscalationAttempted: true, proportionateResponse: true, injuryOccurred: false, childViewsRecorded: true }),
      makeIncident({ id: "i2", deEscalationAttempted: false, proportionateResponse: false, injuryOccurred: true, childViewsRecorded: false }),
    ];
    const result = evaluateRestraintQuality(incidents);
    expect(result.deEscalationRate).toBe(50);
    expect(result.proportionateRate).toBe(50);
    expect(result.noInjuryRate).toBe(50);
    expect(result.childViewsRate).toBe(50);
    // (50/100)*7 + (50/100)*6 + (50/100)*6 + (50/100)*6 = 3.5+3+3+3 = 12.5
    expect(result.score).toBe(12.5);
  });

  it("caps score at 25", () => {
    const incidents = [makeIncident()];
    const result = evaluateRestraintQuality(incidents);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.score).toBe(25);
  });

  it("includes strengths when rates are high", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateRestraintQuality(incidents);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("includes concerns when rates are low", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        deEscalationAttempted: false,
        proportionateResponse: false,
        injuryOccurred: true,
        childViewsRecorded: false,
      }),
    );
    const result = evaluateRestraintQuality(incidents);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.deEscalationRate).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 2: evaluateRestraintCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRestraintCompliance", () => {
  it("returns all zeros for empty incidents", () => {
    const result = evaluateRestraintCompliance([]);
    expect(result.totalIncidents).toBe(0);
    expect(result.bodyMapRate).toBe(0);
    expect(result.parentNotifiedRate).toBe(0);
    expect(result.ofstedNotifiedRate).toBe(0);
    expect(result.debriefRate).toBe(0);
    expect(result.score).toBe(0);
  });

  it("returns perfect score for all-true incidents", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateRestraintCompliance(incidents);
    expect(result.bodyMapRate).toBe(100);
    expect(result.parentNotifiedRate).toBe(100);
    expect(result.ofstedNotifiedRate).toBe(100);
    expect(result.debriefRate).toBe(100);
    expect(result.score).toBe(25);
  });

  it("calculates partial compliance scores", () => {
    const incidents = [
      makeIncident({ id: "i1", bodyMapCompleted: true, parentNotified: true, ofstedNotified: true, debriefCompleted: true }),
      makeIncident({ id: "i2", bodyMapCompleted: false, parentNotified: false, ofstedNotified: false, debriefCompleted: false }),
    ];
    const result = evaluateRestraintCompliance(incidents);
    expect(result.bodyMapRate).toBe(50);
    expect(result.parentNotifiedRate).toBe(50);
    expect(result.ofstedNotifiedRate).toBe(50);
    expect(result.debriefRate).toBe(50);
  });

  it("caps score at 25", () => {
    const incidents = [makeIncident()];
    const result = evaluateRestraintCompliance(incidents);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        bodyMapCompleted: false,
        parentNotified: false,
        ofstedNotified: false,
        debriefCompleted: false,
      }),
    );
    const result = evaluateRestraintCompliance(incidents);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("includes strengths when rates are high", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = evaluateRestraintCompliance(incidents);
    expect(result.strengths.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 3: evaluateRestraintPolicy
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateRestraintPolicy", () => {
  it("returns 0 score and all false for null policy", () => {
    const result = evaluateRestraintPolicy(null);
    expect(result.score).toBe(0);
    expect(result.restraintReductionStrategy).toBe(false);
    expect(result.approvedTechniquesOnly).toBe(false);
    expect(result.deEscalationFirstPolicy).toBe(false);
    expect(result.incidentReportingProtocol).toBe(false);
    expect(result.bodyMapProtocol).toBe(false);
    expect(result.notificationProcedure).toBe(false);
    expect(result.regularReview).toBe(false);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully compliant policy", () => {
    const result = evaluateRestraintPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.concerns.length).toBe(0);
  });

  it("weights 4-point booleans correctly", () => {
    // Only the four 4-point booleans
    const result = evaluateRestraintPolicy(makePolicy({
      bodyMapProtocol: false,
      notificationProcedure: false,
      regularReview: false,
    }));
    expect(result.score).toBe(16); // 4+4+4+4 = 16
  });

  it("weights 3-point booleans correctly", () => {
    // Only the three 3-point booleans
    const result = evaluateRestraintPolicy(makePolicy({
      restraintReductionStrategy: false,
      approvedTechniquesOnly: false,
      deEscalationFirstPolicy: false,
      incidentReportingProtocol: false,
    }));
    expect(result.score).toBe(9); // 3+3+3 = 9
  });

  it("reports concerns for missing components", () => {
    const result = evaluateRestraintPolicy(makePolicy({
      restraintReductionStrategy: false,
      deEscalationFirstPolicy: false,
    }));
    expect(result.concerns.some((c) => c.includes("restraint reduction strategy"))).toBe(true);
    expect(result.concerns.some((c) => c.includes("de-escalation first policy"))).toBe(true);
  });

  it("reports strength for 5+ components", () => {
    const result = evaluateRestraintPolicy(makePolicy({
      regularReview: false,
      notificationProcedure: false,
    }));
    expect(result.strengths.some((s) => s.includes("5/7"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Evaluator 4: evaluateStaffRestraintReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffRestraintReadiness", () => {
  it("returns all zeros for empty training", () => {
    const result = evaluateStaffRestraintReadiness([]);
    expect(result.totalStaff).toBe(0);
    expect(result.approvedTechniquesCertifiedRate).toBe(0);
    expect(result.deEscalationSkillsRate).toBe(0);
    expect(result.proportionalityUnderstandingRate).toBe(0);
    expect(result.incidentReportingRate).toBe(0);
    expect(result.childRightsAwarenessRate).toBe(0);
    expect(result.postIncidentSupportRate).toBe(0);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
    expect(result.concerns[0]).toContain("URGENT");
  });

  it("returns perfect 25 for fully trained staff", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1" }),
      makeTraining({ id: "t2", staffId: "s2" }),
    ];
    const result = evaluateStaffRestraintReadiness(training);
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      makeTraining({ id: "t1", staffId: "s1", approvedTechniquesCertified: true, deEscalationSkills: false }),
      makeTraining({ id: "t2", staffId: "s2", approvedTechniquesCertified: false, deEscalationSkills: true }),
    ];
    const result = evaluateStaffRestraintReadiness(training);
    expect(result.approvedTechniquesCertifiedRate).toBe(50);
    expect(result.deEscalationSkillsRate).toBe(50);
  });

  it("caps score at 25", () => {
    const training = [makeTraining()];
    const result = evaluateStaffRestraintReadiness(training);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("includes concerns when rates are low", () => {
    const training = [
      makeTraining({
        id: "t1",
        staffId: "s1",
        approvedTechniquesCertified: false,
        deEscalationSkills: false,
        proportionalityUnderstanding: false,
        incidentReporting: false,
        childRightsAwareness: false,
        postIncidentSupport: false,
      }),
      makeTraining({
        id: "t2",
        staffId: "s2",
        approvedTechniquesCertified: false,
        deEscalationSkills: false,
        proportionalityUnderstanding: false,
        incidentReporting: false,
        childRightsAwareness: false,
        postIncidentSupport: false,
      }),
    ];
    const result = evaluateStaffRestraintReadiness(training);
    expect(result.score).toBe(0);
    expect(result.concerns.length).toBeGreaterThan(0);
  });

  it("weights skills correctly: certified=6, deEsc=5, proportionality=5, reporting=4, rights=3, support=2", () => {
    // Single staff with only certified true
    const t1 = [makeTraining({
      approvedTechniquesCertified: true,
      deEscalationSkills: false,
      proportionalityUnderstanding: false,
      incidentReporting: false,
      childRightsAwareness: false,
      postIncidentSupport: false,
    })];
    const r1 = evaluateStaffRestraintReadiness(t1);
    expect(r1.score).toBe(6);

    // Single staff with only deEscalation true
    const t2 = [makeTraining({
      approvedTechniquesCertified: false,
      deEscalationSkills: true,
      proportionalityUnderstanding: false,
      incidentReporting: false,
      childRightsAwareness: false,
      postIncidentSupport: false,
    })];
    const r2 = evaluateStaffRestraintReadiness(t2);
    expect(r2.score).toBe(5);

    // Single staff with only postIncidentSupport true
    const t3 = [makeTraining({
      approvedTechniquesCertified: false,
      deEscalationSkills: false,
      proportionalityUnderstanding: false,
      incidentReporting: false,
      childRightsAwareness: false,
      postIncidentSupport: true,
    })];
    const r3 = evaluateStaffRestraintReadiness(t3);
    expect(r3.score).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Child Restraint Profiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildRestraintProfiles", () => {
  it("returns empty array for no incidents", () => {
    const profiles = buildChildRestraintProfiles([]);
    expect(profiles).toEqual([]);
  });

  it("groups incidents by childId", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "i2", childId: "child-jordan", childName: "Jordan" }),
      makeIncident({ id: "i3", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildRestraintProfiles(incidents);
    expect(profiles.length).toBe(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex!.totalIncidents).toBe(2);
  });

  it("calculates freq score: 3 for <=1 incident (fewer = better)", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=3, rate1=3 (100%>=80), rate2=3 (100%>=80), noInjury=1 = 10 (capped)
    expect(profiles[0].restraintScore).toBe(10);
  });

  it("calculates freq score: 2 for 2-3 incidents", () => {
    const incidents = Array.from({ length: 2 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=2, rate1=3, rate2=3, noInjury=1 = 9
    expect(profiles[0].restraintScore).toBe(9);
  });

  it("calculates freq score: 1 for 4-5 incidents", () => {
    const incidents = Array.from({ length: 4 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=1, rate1=3, rate2=3, noInjury=1 = 8
    expect(profiles[0].restraintScore).toBe(8);
  });

  it("calculates freq score: 0 for >5 incidents", () => {
    const incidents = Array.from({ length: 6 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=0, rate1=3, rate2=3, noInjury=1 = 7
    expect(profiles[0].restraintScore).toBe(7);
  });

  it("caps restraintScore at 10", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=3, rate1=3, rate2=3, noInjury=1 = 10 (max)
    expect(profiles[0].restraintScore).toBe(10);
    expect(profiles[0].restraintScore).toBeLessThanOrEqual(10);
  });

  it("gives noInjury bonus 1 when no injuries", () => {
    const incidents = Array.from({ length: 6 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: "child-alex", childName: "Alex", injuryOccurred: false }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=0, rate1=3, rate2=3, noInjury=1 = 7
    expect(profiles[0].restraintScore).toBe(7);
  });

  it("gives noInjury bonus 0 when injuries occurred", () => {
    const incidents = Array.from({ length: 6 }, (_, i) =>
      makeIncident({ id: `i-${i}`, childId: "child-alex", childName: "Alex", injuryOccurred: i === 0 }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    // freq=0, rate1=3, rate2=3, noInjury=0 = 6
    expect(profiles[0].restraintScore).toBe(6);
    expect(profiles[0].injuryCount).toBe(1);
  });

  it("calculates rate1 threshold: 0 when deEscalationRate < 40%", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `i-${i}`,
        childId: "c1",
        childName: "A",
        deEscalationAttempted: i === 0,
      }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    // 1/5 = 20% -> rate1=0
    expect(profiles[0].deEscalationRate).toBe(20);
  });

  it("calculates rate2 threshold: 0 when proportionateRate < 40%", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `i-${i}`,
        childId: "c1",
        childName: "A",
        proportionateResponse: i === 0,
      }),
    );
    const profiles = buildChildRestraintProfiles(incidents);
    expect(profiles[0].proportionateRate).toBe(20);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Generator: generateRestraintIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateRestraintIntelligence", () => {
  function makePerfectIncidents(count: number): RestraintIncident[] {
    return Array.from({ length: count }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        childId: i < count / 2 ? "child-alex" : "child-jordan",
        childName: i < count / 2 ? "Alex" : "Jordan",
        incidentDate: "2026-03-15",
      }),
    );
  }

  it("produces a complete intelligence result", () => {
    const incidents = makePerfectIncidents(6);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateRestraintIntelligence(
      incidents, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-20");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.rating).toBeDefined();
    expect(result.restraintQuality).toBeDefined();
    expect(result.restraintCompliance).toBeDefined();
    expect(result.restraintPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("achieves 100 overall score with perfect data", () => {
    const incidents = makePerfectIncidents(6);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateRestraintIntelligence(
      incidents, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("returns 0 overall score with empty data and no policy", () => {
    const result = generateRestraintIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
  });

  it("caps overall score at 100", () => {
    const incidents = makePerfectIncidents(6);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateRestraintIntelligence(
      incidents, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates URGENT actions when policy is null", () => {
    const result = generateRestraintIntelligence(
      [makeIncident()], null, [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("policy"))).toBe(true);
  });

  it("generates URGENT actions when no staff training", () => {
    const result = generateRestraintIntelligence(
      [makeIncident()], makePolicy(), [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("staff"))).toBe(true);
  });

  it("generates URGENT actions when injuries occurred", () => {
    const incidents = [
      makeIncident({ id: "i1", incidentDate: "2026-03-15", injuryOccurred: true }),
    ];
    const result = generateRestraintIntelligence(
      incidents, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("injury"))).toBe(true);
  });

  it("includes strengths for high-scoring evaluators (score >= 20)", () => {
    const incidents = makePerfectIncidents(6);
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateRestraintIntelligence(
      incidents, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.strengths.some((s) => s.includes("strong"))).toBe(true);
  });

  it("includes areas for improvement for low-scoring evaluators (score < 15)", () => {
    const result = generateRestraintIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.areasForImprovement.some((a) => a.includes("needs improvement"))).toBe(true);
  });

  it("returns exactly 7 regulatory links", () => {
    const result = generateRestraintIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("filters incidents to period", () => {
    const incidents = [
      makeIncident({ id: "i1", incidentDate: "2025-12-01" }), // before period
      makeIncident({ id: "i2", incidentDate: "2026-03-15" }), // in period
      makeIncident({ id: "i3", incidentDate: "2026-06-01" }), // after period
    ];

    const result = generateRestraintIntelligence(
      incidents, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.restraintQuality.totalIncidents).toBe(1);
  });

  it("builds child profiles from period-filtered incidents", () => {
    const incidents = [
      makeIncident({ id: "i1", childId: "c1", childName: "Alex", incidentDate: "2026-03-15" }),
      makeIncident({ id: "i2", childId: "c2", childName: "Jordan", incidentDate: "2026-03-15" }),
      makeIncident({ id: "i3", childId: "c1", childName: "Alex", incidentDate: "2025-06-01" }), // outside period
    ];

    const result = generateRestraintIntelligence(
      incidents, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.childProfiles.length).toBe(2);
    const alex = result.childProfiles.find((p) => p.childId === "c1");
    expect(alex!.totalIncidents).toBe(1);
  });

  it("generates conditional actions when rates are below 50%", () => {
    const incidents = Array.from({ length: 5 }, (_, i) =>
      makeIncident({
        id: `i-${i}`,
        incidentDate: "2026-03-15",
        deEscalationAttempted: false,
        proportionateResponse: false,
        bodyMapCompleted: false,
        parentNotified: false,
        childViewsRecorded: false,
        debriefCompleted: false,
      }),
    );

    const result = generateRestraintIntelligence(
      incidents, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("De-escalation rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Proportionate response rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Body map completion rate"))).toBe(true);
    expect(result.actions.some((a) => a.includes("Parent notification rate"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateRestraintIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-20",
    );
    expect(result.assessedAt).toBeDefined();
    expect(typeof result.assessedAt).toBe("string");
  });

  it("generates no-action message when everything is perfect", () => {
    const incidents = makePerfectIncidents(6);
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining({ id: "t2", staffId: "s2", staffName: "Tom" })];

    const result = generateRestraintIntelligence(
      incidents, policy, training, "oak-house", "2026-01-01", "2026-05-20",
    );

    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });
});
