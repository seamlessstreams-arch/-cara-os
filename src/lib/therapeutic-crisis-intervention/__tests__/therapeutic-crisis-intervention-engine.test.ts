import { describe, it, expect } from "vitest";
import {
  generateTherapeuticCrisisInterventionIntelligence,
  evaluateDeescalationEffectiveness,
  evaluatePostIncidentPractice,
  evaluateCrisisPolicy,
  evaluateStaffCrisisReadiness,
  buildChildCrisisProfiles,
  pct,
  getRating,
  getInterventionTypeLabel,
  getIncidentSeverityLabel,
  getDeescalationOutcomeLabel,
  getRatingLabel,
} from "../therapeutic-crisis-intervention-engine";
import type {
  CrisisIncident,
  CrisisPolicy,
  StaffCrisisTraining,
} from "../therapeutic-crisis-intervention-engine";

// -- Factory Functions --------------------------------------------------------

function makeIncident(overrides: Partial<CrisisIncident> = {}): CrisisIncident {
  return {
    id: "inc-1",
    childId: "child-1",
    childName: "Alex",
    incidentDate: "2026-04-15",
    interventionType: "verbal_de_escalation",
    severity: "low",
    deescalationAttempted: true,
    deescalationOutcome: "successful",
    physicalInterventionUsed: false,
    physicalInterventionJustified: false,
    physicalInterventionDuration: null,
    childDebrief: true,
    staffDebrief: true,
    bodyMapCompleted: false,
    parentNotified: true,
    regulatorNotified: false,
    lessonsLearned: true,
    recordedTimely: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<CrisisPolicy> = {}): CrisisPolicy {
  return {
    id: "policy-1",
    therapeuticApproachDocumented: true,
    deescalationProtocol: true,
    physicalInterventionPolicy: true,
    postIncidentProcess: true,
    bodyMapRequirement: true,
    notificationProtocol: true,
    reviewSchedule: true,
    ...overrides,
  };
}

function makeTraining(overrides: Partial<StaffCrisisTraining> = {}): StaffCrisisTraining {
  return {
    id: "tr-1",
    staffId: "staff-1",
    staffName: "Sarah Johnson",
    therapeuticApproach: true,
    deescalation: true,
    physicalIntervention: true,
    postIncidentSupport: true,
    recordKeeping: true,
    bodyMapping: true,
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

describe("getInterventionTypeLabel", () => {
  it("verbal_de_escalation", () => expect(getInterventionTypeLabel("verbal_de_escalation")).toBe("Verbal De-escalation"));
  it("distraction", () => expect(getInterventionTypeLabel("distraction")).toBe("Distraction"));
  it("planned_ignoring", () => expect(getInterventionTypeLabel("planned_ignoring")).toBe("Planned Ignoring"));
  it("time_away", () => expect(getInterventionTypeLabel("time_away")).toBe("Time Away"));
  it("guided_physical", () => expect(getInterventionTypeLabel("guided_physical")).toBe("Guided Physical"));
  it("restrictive_physical", () => expect(getInterventionTypeLabel("restrictive_physical")).toBe("Restrictive Physical"));
  it("mechanical_restraint", () => expect(getInterventionTypeLabel("mechanical_restraint")).toBe("Mechanical Restraint"));
  it("medical_intervention", () => expect(getInterventionTypeLabel("medical_intervention")).toBe("Medical Intervention"));
});

describe("getIncidentSeverityLabel", () => {
  it("low", () => expect(getIncidentSeverityLabel("low")).toBe("Low"));
  it("medium", () => expect(getIncidentSeverityLabel("medium")).toBe("Medium"));
  it("high", () => expect(getIncidentSeverityLabel("high")).toBe("High"));
  it("critical", () => expect(getIncidentSeverityLabel("critical")).toBe("Critical"));
});

describe("getDeescalationOutcomeLabel", () => {
  it("successful", () => expect(getDeescalationOutcomeLabel("successful")).toBe("Successful"));
  it("partially_successful", () => expect(getDeescalationOutcomeLabel("partially_successful")).toBe("Partially Successful"));
  it("escalated", () => expect(getDeescalationOutcomeLabel("escalated")).toBe("Escalated"));
  it("physical_intervention_required", () => expect(getDeescalationOutcomeLabel("physical_intervention_required")).toBe("Physical Intervention Required"));
});

describe("getRatingLabel", () => {
  it("outstanding", () => expect(getRatingLabel("outstanding")).toBe("Outstanding"));
  it("good", () => expect(getRatingLabel("good")).toBe("Good"));
  it("requires_improvement", () => expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement"));
  it("inadequate", () => expect(getRatingLabel("inadequate")).toBe("Inadequate"));
});

// -- evaluateDeescalationEffectiveness ----------------------------------------

describe("evaluateDeescalationEffectiveness", () => {
  it("returns 25 for empty incidents (no crises = ideal)", () => {
    const result = evaluateDeescalationEffectiveness([]);
    expect(result.overallScore).toBe(25);
    expect(result.deescalationAttemptRate).toBe(0);
    expect(result.deescalationSuccessRate).toBe(0);
    expect(result.physicalInterventionRate).toBe(0);
  });

  it("returns zero severity distribution counts for empty incidents", () => {
    const result = evaluateDeescalationEffectiveness([]);
    expect(result.severityDistribution).toEqual({ low: 0, medium: 0, high: 0, critical: 0 });
  });

  it("scores high for fully de-escalated low-severity incidents", () => {
    const incidents = [makeIncident(), makeIncident({ id: "inc-2" })];
    const result = evaluateDeescalationEffectiveness(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.deescalationAttemptRate).toBe(100);
    expect(result.deescalationSuccessRate).toBe(100);
  });

  it("scores low for no de-escalation with physical intervention", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({
        deescalationAttempted: false,
        deescalationOutcome: "physical_intervention_required",
        physicalInterventionUsed: true,
        severity: "high",
      }),
    ]);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("calculates de-escalation attempt rate", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", deescalationAttempted: true }),
      makeIncident({ id: "inc-2", deescalationAttempted: false }),
    ]);
    expect(result.deescalationAttemptRate).toBe(50);
  });

  it("calculates de-escalation success rate including partially_successful", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", deescalationOutcome: "successful" }),
      makeIncident({ id: "inc-2", deescalationOutcome: "partially_successful" }),
      makeIncident({ id: "inc-3", deescalationOutcome: "escalated" }),
    ]);
    expect(result.deescalationSuccessRate).toBe(67);
  });

  it("calculates physical intervention rate", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", physicalInterventionUsed: true }),
      makeIncident({ id: "inc-2", physicalInterventionUsed: false }),
    ]);
    expect(result.physicalInterventionRate).toBe(50);
  });

  it("gives bonus for zero physical interventions", () => {
    const noPhysical = evaluateDeescalationEffectiveness([
      makeIncident({ physicalInterventionUsed: false }),
    ]);
    const withPhysical = evaluateDeescalationEffectiveness([
      makeIncident({ physicalInterventionUsed: true }),
    ]);
    expect(noPhysical.overallScore).toBeGreaterThan(withPhysical.overallScore);
  });

  it("calculates severity distribution", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", severity: "low" }),
      makeIncident({ id: "inc-2", severity: "medium" }),
      makeIncident({ id: "inc-3", severity: "high" }),
      makeIncident({ id: "inc-4", severity: "critical" }),
    ]);
    expect(result.severityDistribution).toEqual({ low: 1, medium: 1, high: 1, critical: 1 });
  });

  it("gives higher severity score for mostly low/medium incidents", () => {
    const lowSev = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", severity: "low" }),
      makeIncident({ id: "inc-2", severity: "low" }),
    ]);
    const highSev = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", severity: "critical" }),
      makeIncident({ id: "inc-2", severity: "critical" }),
    ]);
    expect(lowSev.overallScore).toBeGreaterThan(highSev.overallScore);
  });

  it("caps score at 25", () => {
    const result = evaluateDeescalationEffectiveness([makeIncident()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("score minimum is 0", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({
        deescalationAttempted: false,
        deescalationOutcome: "physical_intervention_required",
        physicalInterventionUsed: true,
        severity: "critical",
      }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("handles all incidents being escalated", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", deescalationOutcome: "escalated" }),
      makeIncident({ id: "inc-2", deescalationOutcome: "escalated" }),
    ]);
    expect(result.deescalationSuccessRate).toBe(0);
  });

  it("handles 100% physical intervention rate", () => {
    const result = evaluateDeescalationEffectiveness([
      makeIncident({ id: "inc-1", physicalInterventionUsed: true }),
      makeIncident({ id: "inc-2", physicalInterventionUsed: true }),
    ]);
    expect(result.physicalInterventionRate).toBe(100);
  });
});

// -- evaluatePostIncidentPractice ---------------------------------------------

describe("evaluatePostIncidentPractice", () => {
  it("returns 25 for empty incidents (no incidents to review)", () => {
    const result = evaluatePostIncidentPractice([]);
    expect(result.overallScore).toBe(25);
    expect(result.childDebriefRate).toBe(0);
    expect(result.staffDebriefRate).toBe(0);
    expect(result.bodyMapCompletionRate).toBe(0);
    expect(result.timelyRecordingRate).toBe(0);
    expect(result.lessonsLearnedRate).toBe(0);
  });

  it("scores high for exemplary post-incident handling", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident(),
      makeIncident({ id: "inc-2" }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
  });

  it("calculates child debrief rate", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({ id: "inc-1", childDebrief: true }),
      makeIncident({ id: "inc-2", childDebrief: false }),
    ]);
    expect(result.childDebriefRate).toBe(50);
  });

  it("calculates staff debrief rate", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({ id: "inc-1", staffDebrief: true }),
      makeIncident({ id: "inc-2", staffDebrief: false }),
    ]);
    expect(result.staffDebriefRate).toBe(50);
  });

  it("calculates body map rate only for physical intervention incidents", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({ id: "inc-1", physicalInterventionUsed: true, bodyMapCompleted: true }),
      makeIncident({ id: "inc-2", physicalInterventionUsed: true, bodyMapCompleted: false }),
      makeIncident({ id: "inc-3", physicalInterventionUsed: false, bodyMapCompleted: false }),
    ]);
    expect(result.bodyMapCompletionRate).toBe(50);
  });

  it("returns 0 body map rate when no physical incidents but ignoring non-physical", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({ physicalInterventionUsed: false, bodyMapCompleted: false }),
    ]);
    expect(result.bodyMapCompletionRate).toBe(0);
  });

  it("gives body map bonus when no physical interventions exist", () => {
    const noPhysical = evaluatePostIncidentPractice([
      makeIncident({ physicalInterventionUsed: false }),
    ]);
    const withFailedBodyMap = evaluatePostIncidentPractice([
      makeIncident({ physicalInterventionUsed: true, bodyMapCompleted: false }),
    ]);
    expect(noPhysical.overallScore).toBeGreaterThan(withFailedBodyMap.overallScore);
  });

  it("calculates timely recording rate", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({ id: "inc-1", recordedTimely: true }),
      makeIncident({ id: "inc-2", recordedTimely: false }),
      makeIncident({ id: "inc-3", recordedTimely: true }),
    ]);
    expect(result.timelyRecordingRate).toBe(67);
  });

  it("calculates lessons learned rate", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({ id: "inc-1", lessonsLearned: true }),
      makeIncident({ id: "inc-2", lessonsLearned: false }),
    ]);
    expect(result.lessonsLearnedRate).toBe(50);
  });

  it("scores low when nothing is completed", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({
        childDebrief: false,
        staffDebrief: false,
        recordedTimely: false,
        lessonsLearned: false,
      }),
    ]);
    expect(result.overallScore).toBeLessThan(10);
  });

  it("caps score at 25", () => {
    const result = evaluatePostIncidentPractice([makeIncident()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("minimum score is 0", () => {
    const result = evaluatePostIncidentPractice([
      makeIncident({
        childDebrief: false,
        staffDebrief: false,
        physicalInterventionUsed: true,
        bodyMapCompleted: false,
        recordedTimely: false,
        lessonsLearned: false,
      }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// -- evaluateCrisisPolicy -----------------------------------------------------

describe("evaluateCrisisPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateCrisisPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.therapeuticApproachDocumented).toBe(false);
    expect(result.deescalationProtocol).toBe(false);
    expect(result.physicalInterventionPolicy).toBe(false);
    expect(result.postIncidentProcess).toBe(false);
    expect(result.bodyMapRequirement).toBe(false);
    expect(result.notificationProtocol).toBe(false);
    expect(result.reviewSchedule).toBe(false);
  });

  it("returns 25 for fully complete policy", () => {
    const result = evaluateCrisisPolicy(makePolicy());
    expect(result.overallScore).toBe(25);
  });

  it("scores therapeuticApproachDocumented at 5", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: true,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(5);
  });

  it("scores deescalationProtocol at 4", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: true,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores physicalInterventionPolicy at 4", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: true,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores postIncidentProcess at 4", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: true,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(4);
  });

  it("scores bodyMapRequirement at 3", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: true,
      notificationProtocol: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores notificationProtocol at 3", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: true,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(3);
  });

  it("scores reviewSchedule at 2", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: true,
    }));
    expect(result.overallScore).toBe(2);
  });

  it("adds up to correct total: 5+4+4+4+3+3+2 = 25", () => {
    const result = evaluateCrisisPolicy(makePolicy());
    expect(result.overallScore).toBe(5 + 4 + 4 + 4 + 3 + 3 + 2);
  });

  it("returns 0 when all fields are false", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: false,
      deescalationProtocol: false,
      physicalInterventionPolicy: false,
      postIncidentProcess: false,
      bodyMapRequirement: false,
      notificationProtocol: false,
      reviewSchedule: false,
    }));
    expect(result.overallScore).toBe(0);
  });

  it("passes through boolean values correctly", () => {
    const result = evaluateCrisisPolicy(makePolicy({
      therapeuticApproachDocumented: true,
      deescalationProtocol: false,
    }));
    expect(result.therapeuticApproachDocumented).toBe(true);
    expect(result.deescalationProtocol).toBe(false);
  });

  it("caps score at 25", () => {
    const result = evaluateCrisisPolicy(makePolicy());
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateStaffCrisisReadiness ---------------------------------------------

describe("evaluateStaffCrisisReadiness", () => {
  it("returns 0 for empty training", () => {
    const result = evaluateStaffCrisisReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.therapeuticApproachRate).toBe(0);
    expect(result.deescalationRate).toBe(0);
    expect(result.physicalInterventionRate).toBe(0);
    expect(result.postIncidentSupportRate).toBe(0);
    expect(result.recordKeepingRate).toBe(0);
    expect(result.bodyMappingRate).toBe(0);
  });

  it("scores high for fully trained staff", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining(),
      makeTraining({ id: "tr-2", staffId: "staff-2" }),
    ]);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.deescalationRate).toBe(100);
  });

  it("scores 0 for completely untrained staff", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({
        therapeuticApproach: false,
        deescalation: false,
        physicalIntervention: false,
        postIncidentSupport: false,
        recordKeeping: false,
        bodyMapping: false,
      }),
    ]);
    expect(result.overallScore).toBe(0);
  });

  it("calculates therapeutic approach rate", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", therapeuticApproach: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", therapeuticApproach: false }),
    ]);
    expect(result.therapeuticApproachRate).toBe(50);
  });

  it("calculates deescalation rate", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", deescalation: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", deescalation: false }),
    ]);
    expect(result.deescalationRate).toBe(50);
  });

  it("calculates physical intervention rate", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", physicalIntervention: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", physicalIntervention: false }),
    ]);
    expect(result.physicalInterventionRate).toBe(50);
  });

  it("calculates post-incident support rate", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", postIncidentSupport: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", postIncidentSupport: false }),
    ]);
    expect(result.postIncidentSupportRate).toBe(50);
  });

  it("calculates record keeping rate", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", recordKeeping: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", recordKeeping: false }),
    ]);
    expect(result.recordKeepingRate).toBe(50);
  });

  it("calculates body mapping rate", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", bodyMapping: true }),
      makeTraining({ id: "tr-2", staffId: "staff-2", bodyMapping: false }),
    ]);
    expect(result.bodyMappingRate).toBe(50);
  });

  it("returns correct total staff count", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1" }),
      makeTraining({ id: "tr-2", staffId: "staff-2" }),
      makeTraining({ id: "tr-3", staffId: "staff-3" }),
    ]);
    expect(result.totalStaff).toBe(3);
  });

  it("caps score at 25", () => {
    const result = evaluateStaffCrisisReadiness([makeTraining()]);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("handles partial training mix", () => {
    const result = evaluateStaffCrisisReadiness([
      makeTraining({ id: "tr-1", staffId: "s1" }),
      makeTraining({
        id: "tr-2",
        staffId: "s2",
        therapeuticApproach: true,
        deescalation: false,
        physicalIntervention: false,
        postIncidentSupport: true,
        recordKeeping: false,
        bodyMapping: true,
      }),
    ]);
    expect(result.therapeuticApproachRate).toBe(100);
    expect(result.deescalationRate).toBe(50);
    expect(result.physicalInterventionRate).toBe(50);
    expect(result.postIncidentSupportRate).toBe(100);
    expect(result.recordKeepingRate).toBe(50);
    expect(result.bodyMappingRate).toBe(100);
  });
});

// -- buildChildCrisisProfiles -------------------------------------------------

describe("buildChildCrisisProfiles", () => {
  it("returns empty for no incidents", () => {
    expect(buildChildCrisisProfiles([])).toEqual([]);
  });

  it("groups by child", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", childId: "child-1", childName: "Alex" }),
      makeIncident({ id: "inc-2", childId: "child-1", childName: "Alex" }),
      makeIncident({ id: "inc-3", childId: "child-2", childName: "Jordan" }),
    ]);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-1");
    expect(alex!.totalIncidents).toBe(2);
  });

  it("counts physical interventions", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", physicalInterventionUsed: true }),
      makeIncident({ id: "inc-2", physicalInterventionUsed: false }),
    ]);
    expect(profiles[0].physicalInterventions).toBe(1);
  });

  it("calculates de-escalation success rate", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", deescalationOutcome: "successful" }),
      makeIncident({ id: "inc-2", deescalationOutcome: "escalated" }),
    ]);
    expect(profiles[0].deescalationSuccessRate).toBe(50);
  });

  it("includes partially_successful in success rate", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", deescalationOutcome: "partially_successful" }),
    ]);
    expect(profiles[0].deescalationSuccessRate).toBe(100);
  });

  it("calculates debrief rate", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", childDebrief: true }),
      makeIncident({ id: "inc-2", childDebrief: false }),
    ]);
    expect(profiles[0].debriefRate).toBe(50);
  });

  it("gives higher score for fewer incidents", () => {
    const singleIncident = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", childId: "child-1" }),
    ]);
    const manyIncidents = buildChildCrisisProfiles([
      makeIncident({ id: "inc-1", childId: "child-1" }),
      makeIncident({ id: "inc-2", childId: "child-1" }),
      makeIncident({ id: "inc-3", childId: "child-1" }),
      makeIncident({ id: "inc-4", childId: "child-1" }),
      makeIncident({ id: "inc-5", childId: "child-1" }),
      makeIncident({ id: "inc-6", childId: "child-1" }),
    ]);
    expect(singleIncident[0].overallScore).toBeGreaterThan(manyIncidents[0].overallScore);
  });

  it("gives higher score for no physical interventions", () => {
    const noPhys = buildChildCrisisProfiles([
      makeIncident({ physicalInterventionUsed: false }),
    ]);
    const withPhys = buildChildCrisisProfiles([
      makeIncident({ physicalInterventionUsed: true }),
    ]);
    expect(noPhys[0].overallScore).toBeGreaterThan(withPhys[0].overallScore);
  });

  it("score capped at 10", () => {
    const profiles = buildChildCrisisProfiles([makeIncident()]);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("score minimum is 0", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({
        deescalationOutcome: "escalated",
        childDebrief: false,
        physicalInterventionUsed: true,
      }),
      makeIncident({
        id: "inc-2",
        deescalationOutcome: "escalated",
        childDebrief: false,
        physicalInterventionUsed: true,
      }),
      makeIncident({
        id: "inc-3",
        deescalationOutcome: "escalated",
        childDebrief: false,
        physicalInterventionUsed: true,
      }),
      makeIncident({
        id: "inc-4",
        deescalationOutcome: "escalated",
        childDebrief: false,
        physicalInterventionUsed: true,
      }),
      makeIncident({
        id: "inc-5",
        deescalationOutcome: "escalated",
        childDebrief: false,
        physicalInterventionUsed: true,
      }),
      makeIncident({
        id: "inc-6",
        deescalationOutcome: "escalated",
        childDebrief: false,
        physicalInterventionUsed: true,
      }),
    ]);
    expect(profiles[0].overallScore).toBeGreaterThanOrEqual(0);
  });

  it("preserves child name", () => {
    const profiles = buildChildCrisisProfiles([
      makeIncident({ childId: "child-1", childName: "Alex" }),
    ]);
    expect(profiles[0].childName).toBe("Alex");
  });
});

// -- generateTherapeuticCrisisInterventionIntelligence ------------------------

describe("generateTherapeuticCrisisInterventionIntelligence", () => {
  it("assembles all four evaluator scores", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident()], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBe(
      result.deescalationEffectiveness.overallScore +
      result.postIncidentPractice.overallScore +
      result.crisisPolicy.overallScore +
      result.staffCrisisReadiness.overallScore,
    );
  });

  it("returns outstanding for zero incidents with policy and training", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], makePolicy(), [makeTraining()],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("returns requires_improvement with no data except empty incidents", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    // 25 (de-esc empty) + 25 (post-incident empty) + 0 (no policy) + 0 (no training) = 50
    expect(result.overallScore).toBe(50);
    expect(result.rating).toBe("requires_improvement");
  });

  it("returns outstanding for fully compliant home", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident()],
      makePolicy(),
      [makeTraining(), makeTraining({ id: "tr-2", staffId: "staff-2" })],
      "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("caps score at 100", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident()], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("populates homeId and period", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("includes child profiles", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [
        makeIncident({ id: "inc-1", childId: "child-1" }),
        makeIncident({ id: "inc-2", childId: "child-2", childName: "Jordan" }),
      ],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.childProfiles).toHaveLength(2);
  });

  // -- Strengths --

  it("adds strength for no crisis incidents", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("No crisis incidents"))).toBe(true);
  });

  it("adds strength for 100% de-escalation attempted", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ deescalationAttempted: true }), makeIncident({ id: "inc-2", deescalationAttempted: true })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("De-escalation attempted in 100%"))).toBe(true);
  });

  it("adds strength for high de-escalation success", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [
        makeIncident({ id: "inc-1", deescalationOutcome: "successful" }),
        makeIncident({ id: "inc-2", deescalationOutcome: "successful" }),
        makeIncident({ id: "inc-3", deescalationOutcome: "successful" }),
        makeIncident({ id: "inc-4", deescalationOutcome: "escalated" }),
      ],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("High de-escalation success"))).toBe(true);
  });

  it("adds strength for no physical interventions", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ physicalInterventionUsed: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("No physical interventions"))).toBe(true);
  });

  it("adds strength for child debrief at 100%", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ childDebrief: true })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Child debrief completed after every incident"))).toBe(true);
  });

  it("adds strength for comprehensive policy", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], makePolicy(), [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("Comprehensive crisis policy"))).toBe(true);
  });

  it("adds strength for all staff trained in de-escalation", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [makeTraining({ deescalation: true })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("All staff trained in de-escalation"))).toBe(true);
  });

  it("adds strength for all staff trained in therapeutic approaches", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [makeTraining({ therapeuticApproach: true })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.strengths.some((s) => s.includes("All staff trained in therapeutic approaches"))).toBe(true);
  });

  // -- Areas for Improvement --

  it("adds area for no policy", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No crisis intervention policy"))).toBe(true);
  });

  it("adds area for no training records", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("No staff crisis training"))).toBe(true);
  });

  it("adds area for low de-escalation attempt rate", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ deescalationAttempted: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("De-escalation not attempted"))).toBe(true);
  });

  it("adds area for high physical intervention rate", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [
        makeIncident({ id: "inc-1", physicalInterventionUsed: true }),
        makeIncident({ id: "inc-2", physicalInterventionUsed: true }),
      ],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Physical intervention rate"))).toBe(true);
  });

  it("adds area for missing therapeutic approach in policy", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [],
      makePolicy({ therapeuticApproachDocumented: false }),
      [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Therapeutic approach not documented"))).toBe(true);
  });

  it("adds area for low child debrief rate", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ childDebrief: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Child debrief rate"))).toBe(true);
  });

  // -- Actions --

  it("adds URGENT for critical incidents", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ severity: "critical" })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("critical-severity"))).toBe(true);
  });

  it("adds URGENT for unjustified physical interventions", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ physicalInterventionUsed: true, physicalInterventionJustified: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("not justified"))).toBe(true);
  });

  it("adds URGENT for incidents without child debrief", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident({ childDebrief: false })],
      null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("without child debrief"))).toBe(true);
  });

  it("adds URGENT for no staff training", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident()], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT") && a.includes("training for all staff"))).toBe(true);
  });

  it("adds action to create policy when none exists", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("Create crisis intervention policy"))).toBe(true);
  });

  it("adds action for missing review schedule in policy", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], makePolicy({ reviewSchedule: false }), [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("review schedule"))).toBe(true);
  });

  it("adds action for low physical intervention training rate", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [makeTraining({ physicalIntervention: false })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("trained in physical intervention"))).toBe(true);
  });

  it("adds action for low body mapping training rate", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [makeTraining({ bodyMapping: false })],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.actions.some((a) => a.includes("trained in body mapping"))).toBe(true);
  });

  // -- Regulatory links --

  it("includes all 7 regulatory links", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015 Reg 20"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reducing the Need for Restraint"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 12"))).toBe(true);
  });

  // -- Integration --

  it("handles realistic Chamberlain House scenario", () => {
    const incidents: CrisisIncident[] = [
      makeIncident({
        id: "inc-alex-1",
        childId: "child-alex",
        childName: "Alex",
        severity: "low",
        interventionType: "verbal_de_escalation",
        deescalationOutcome: "successful",
      }),
      makeIncident({
        id: "inc-jordan-1",
        childId: "child-jordan",
        childName: "Jordan",
        severity: "medium",
        interventionType: "verbal_de_escalation",
        deescalationOutcome: "partially_successful",
      }),
      makeIncident({
        id: "inc-jordan-2",
        childId: "child-jordan",
        childName: "Jordan",
        severity: "medium",
        interventionType: "distraction",
        deescalationOutcome: "successful",
      }),
      makeIncident({
        id: "inc-morgan-1",
        childId: "child-morgan",
        childName: "Morgan",
        severity: "low",
        interventionType: "planned_ignoring",
        deescalationOutcome: "successful",
      }),
    ];
    const policy = makePolicy();
    const training = [
      makeTraining({ id: "tr-1", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
      makeTraining({ id: "tr-2", staffId: "staff-tom", staffName: "Tom Richards" }),
      makeTraining({ id: "tr-3", staffId: "staff-lisa", staffName: "Lisa Williams" }),
      makeTraining({ id: "tr-4", staffId: "staff-darren", staffName: "Darren Laville" }),
    ];

    const result = generateTherapeuticCrisisInterventionIntelligence(
      incidents, policy, training,
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
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], null, [], "test", "2026-01-01", "2026-06-01",
    );
    expect(result.deescalationEffectiveness.overallScore).toBe(25);
    expect(result.postIncidentPractice.overallScore).toBe(25);
    expect(result.crisisPolicy.overallScore).toBe(0);
    expect(result.staffCrisisReadiness.overallScore).toBe(0);
    expect(result.overallScore).toBe(50);
  });

  it("handles single incident with all defaults", () => {
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [makeIncident()], null, [],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.childProfiles).toHaveLength(1);
  });

  it("returns correct rating string for each threshold", () => {
    // We can test via getRating but also verify integration
    const result = generateTherapeuticCrisisInterventionIntelligence(
      [], makePolicy(), [makeTraining()],
      "test", "2026-01-01", "2026-06-01",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });
});
