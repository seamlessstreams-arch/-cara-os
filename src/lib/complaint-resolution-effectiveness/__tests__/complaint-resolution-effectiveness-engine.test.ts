// ==============================================================================
// TESTS -- Complaint Resolution Effectiveness Intelligence Engine
//
// Demo: Oak House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//        Lisa Williams (Senior RSW), Darren Laville (RM/DSL)
// ==============================================================================

import { describe, it, expect } from "vitest";
import {
  evaluateResolutionQuality,
  evaluateComplaintCompliance,
  evaluateComplaintPolicy,
  evaluateStaffComplaintReadiness,
  buildChildComplaintProfiles,
  generateComplaintResolutionEffectivenessIntelligence,
  getComplaintSourceLabel,
  getResolutionOutcomeLabel,
  getRatingLabel,
  getRating,
  pct,
} from "../complaint-resolution-effectiveness-engine";
import type {
  ComplaintRecord,
  ComplaintPolicy,
  StaffComplaintTraining,
} from "../complaint-resolution-effectiveness-engine";

// -- Factory Functions --------------------------------------------------------

let recordCounter = 0;
function makeRecord(overrides: Partial<ComplaintRecord> = {}): ComplaintRecord {
  recordCounter++;
  return {
    id: `complaint-${recordCounter}`,
    childId: "child-alex",
    childName: "Alex",
    complaintDate: "2026-03-15",
    complaintSource: "child",
    resolutionOutcome: "fully_resolved",
    resolvedWithinTimescale: true,
    childInformed: true,
    lessonsLearned: true,
    actionsTaken: true,
    documentedInRecord: true,
    complainantSatisfied: true,
    ...overrides,
  };
}

let policyCounter = 0;
function makePolicy(overrides: Partial<ComplaintPolicy> = {}): ComplaintPolicy {
  policyCounter++;
  return {
    id: `policy-${policyCounter}`,
    complaintsProcedure: true,
    timescaleStandards: true,
    childFriendlyProcess: true,
    independentAdvocacy: true,
    escalationPathway: true,
    learningFromComplaints: true,
    regularReview: true,
    ...overrides,
  };
}

let trainingCounter = 0;
function makeTraining(overrides: Partial<StaffComplaintTraining> = {}): StaffComplaintTraining {
  trainingCounter++;
  return {
    id: `training-${trainingCounter}`,
    staffId: `staff-${trainingCounter}`,
    staffName: `Staff Member ${trainingCounter}`,
    complaintHandling: true,
    childFocusedResolution: true,
    conflictResolution: true,
    documentationSkills: true,
    advocacyAwareness: true,
    regulatoryRequirements: true,
    ...overrides,
  };
}

// -- pct helper ---------------------------------------------------------------

describe("pct", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates percentage correctly", () => {
    expect(pct(3, 4)).toBe(75);
    expect(pct(1, 3)).toBe(33);
    expect(pct(10, 10)).toBe(100);
    expect(pct(0, 10)).toBe(0);
  });
});

// -- getRating ----------------------------------------------------------------

describe("getRating", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("returns good for score >= 60", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("returns requires_improvement for score >= 40", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });
});

// -- Label functions ----------------------------------------------------------

describe("label functions", () => {
  it("getComplaintSourceLabel returns correct labels", () => {
    expect(getComplaintSourceLabel("child")).toBe("Child");
    expect(getComplaintSourceLabel("parent_carer")).toBe("Parent/Carer");
    expect(getComplaintSourceLabel("professional")).toBe("Professional");
    expect(getComplaintSourceLabel("advocate")).toBe("Advocate");
    expect(getComplaintSourceLabel("staff")).toBe("Staff");
    expect(getComplaintSourceLabel("visitor")).toBe("Visitor");
    expect(getComplaintSourceLabel("anonymous")).toBe("Anonymous");
    expect(getComplaintSourceLabel("regulator")).toBe("Regulator");
  });

  it("getResolutionOutcomeLabel returns correct labels", () => {
    expect(getResolutionOutcomeLabel("fully_resolved")).toBe("Fully Resolved");
    expect(getResolutionOutcomeLabel("partially_resolved")).toBe("Partially Resolved");
    expect(getResolutionOutcomeLabel("unresolved")).toBe("Unresolved");
    expect(getResolutionOutcomeLabel("escalated")).toBe("Escalated");
    expect(getResolutionOutcomeLabel("withdrawn")).toBe("Withdrawn");
  });

  it("getRatingLabel returns correct labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// -- evaluateResolutionQuality ------------------------------------------------

describe("evaluateResolutionQuality", () => {
  it("returns 0 for empty records (PRESENCE pattern)", () => {
    const result = evaluateResolutionQuality([]);
    expect(result.overallScore).toBe(0);
    expect(result.resolutionRate).toBe(0);
    expect(result.childInformedRate).toBe(0);
    expect(result.lessonsLearnedRate).toBe(0);
    expect(result.actionsTakenRate).toBe(0);
  });

  it("scores maximum 25 when all records are fully positive", () => {
    const records = [
      makeRecord(),
      makeRecord({ childId: "child-jordan", childName: "Jordan" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan" }),
    ];
    const result = evaluateResolutionQuality(records);
    expect(result.overallScore).toBe(25);
    expect(result.resolutionRate).toBe(100);
    expect(result.childInformedRate).toBe(100);
    expect(result.lessonsLearnedRate).toBe(100);
    expect(result.actionsTakenRate).toBe(100);
  });

  it("calculates partial scores correctly", () => {
    const records = [
      makeRecord({ resolutionOutcome: "fully_resolved", childInformed: true, lessonsLearned: true, actionsTaken: true }),
      makeRecord({ resolutionOutcome: "unresolved", childInformed: false, lessonsLearned: false, actionsTaken: false }),
    ];
    const result = evaluateResolutionQuality(records);
    expect(result.resolutionRate).toBe(50);
    expect(result.childInformedRate).toBe(50);
    expect(result.lessonsLearnedRate).toBe(50);
    expect(result.actionsTakenRate).toBe(50);
    // Sub-scores: round(50/100 * 7) + round(50/100 * 6) + round(50/100 * 6) + round(50/100 * 6)
    // = round(3.5) + round(3) + round(3) + round(3) = 4 + 3 + 3 + 3 = 13
    expect(result.overallScore).toBe(13);
  });

  it("counts partially_resolved towards resolution rate", () => {
    const records = [
      makeRecord({ resolutionOutcome: "partially_resolved" }),
      makeRecord({ resolutionOutcome: "unresolved" }),
    ];
    const result = evaluateResolutionQuality(records);
    expect(result.resolutionRate).toBe(50);
  });

  it("scores 0 when all records negative", () => {
    const records = [
      makeRecord({
        resolutionOutcome: "unresolved",
        childInformed: false,
        lessonsLearned: false,
        actionsTaken: false,
      }),
    ];
    const result = evaluateResolutionQuality(records);
    expect(result.overallScore).toBe(0);
    expect(result.resolutionRate).toBe(0);
  });

  it("is capped at 25", () => {
    // Even with perfect scores, the max is 25
    const records = Array.from({ length: 20 }, () => makeRecord());
    const result = evaluateResolutionQuality(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateComplaintCompliance ----------------------------------------------

describe("evaluateComplaintCompliance", () => {
  it("returns 0 for empty records (PRESENCE pattern)", () => {
    const result = evaluateComplaintCompliance([]);
    expect(result.overallScore).toBe(0);
    expect(result.resolvedWithinTimescaleRate).toBe(0);
    expect(result.documentedRate).toBe(0);
    expect(result.complainantSatisfiedRate).toBe(0);
    expect(result.sourceDiversity).toBe(0);
  });

  it("scores maximum when all compliance fields are positive and diverse sources", () => {
    const sources = [
      "child", "parent_carer", "professional", "advocate",
      "staff", "visitor", "anonymous", "regulator",
    ] as const;
    const records = sources.map((s) =>
      makeRecord({ complaintSource: s }),
    );
    const result = evaluateComplaintCompliance(records);
    expect(result.resolvedWithinTimescaleRate).toBe(100);
    expect(result.documentedRate).toBe(100);
    expect(result.complainantSatisfiedRate).toBe(100);
    expect(result.sourceDiversity).toBe(1);
    expect(result.overallScore).toBe(25);
  });

  it("calculates source diversity correctly", () => {
    const records = [
      makeRecord({ complaintSource: "child" }),
      makeRecord({ complaintSource: "child" }),
      makeRecord({ complaintSource: "parent_carer" }),
    ];
    const result = evaluateComplaintCompliance(records);
    expect(result.sourceDiversity).toBe(2 / 8);
  });

  it("calculates partial timescale compliance", () => {
    const records = [
      makeRecord({ resolvedWithinTimescale: true }),
      makeRecord({ resolvedWithinTimescale: false }),
      makeRecord({ resolvedWithinTimescale: true }),
    ];
    const result = evaluateComplaintCompliance(records);
    expect(result.resolvedWithinTimescaleRate).toBe(67);
  });

  it("is capped at 25", () => {
    const records = Array.from({ length: 20 }, () => makeRecord());
    const result = evaluateComplaintCompliance(records);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- evaluateComplaintPolicy --------------------------------------------------

describe("evaluateComplaintPolicy", () => {
  it("returns 0 for null policy", () => {
    const result = evaluateComplaintPolicy(null);
    expect(result.overallScore).toBe(0);
    expect(result.complaintsProcedure).toBe(false);
    expect(result.timescaleStandards).toBe(false);
    expect(result.childFriendlyProcess).toBe(false);
    expect(result.independentAdvocacy).toBe(false);
    expect(result.escalationPathway).toBe(false);
    expect(result.learningFromComplaints).toBe(false);
    expect(result.regularReview).toBe(false);
  });

  it("returns 25 when all booleans are true", () => {
    const policy = makePolicy();
    const result = evaluateComplaintPolicy(policy);
    expect(result.overallScore).toBe(25);
  });

  it("weights correctly: 4+4+4+4+3+3+3 = 25", () => {
    // Only first 4 high-weight booleans true: 4+4+4+4 = 16
    const policy = makePolicy({
      escalationPathway: false,
      learningFromComplaints: false,
      regularReview: false,
    });
    const result = evaluateComplaintPolicy(policy);
    expect(result.overallScore).toBe(16);
  });

  it("weights lower-priority booleans at 3 each", () => {
    // Only last 3 low-weight booleans true: 3+3+3 = 9
    const policy = makePolicy({
      complaintsProcedure: false,
      timescaleStandards: false,
      childFriendlyProcess: false,
      independentAdvocacy: false,
    });
    const result = evaluateComplaintPolicy(policy);
    expect(result.overallScore).toBe(9);
  });

  it("returns 0 when all booleans are false", () => {
    const policy = makePolicy({
      complaintsProcedure: false,
      timescaleStandards: false,
      childFriendlyProcess: false,
      independentAdvocacy: false,
      escalationPathway: false,
      learningFromComplaints: false,
      regularReview: false,
    });
    const result = evaluateComplaintPolicy(policy);
    expect(result.overallScore).toBe(0);
  });

  it("reflects individual boolean values in result", () => {
    const policy = makePolicy({
      complaintsProcedure: true,
      timescaleStandards: false,
      childFriendlyProcess: true,
      independentAdvocacy: false,
      escalationPathway: true,
      learningFromComplaints: false,
      regularReview: true,
    });
    const result = evaluateComplaintPolicy(policy);
    expect(result.complaintsProcedure).toBe(true);
    expect(result.timescaleStandards).toBe(false);
    expect(result.childFriendlyProcess).toBe(true);
    expect(result.independentAdvocacy).toBe(false);
    expect(result.escalationPathway).toBe(true);
    expect(result.learningFromComplaints).toBe(false);
    expect(result.regularReview).toBe(true);
    // 4 + 0 + 4 + 0 + 3 + 0 + 3 = 14
    expect(result.overallScore).toBe(14);
  });
});

// -- evaluateStaffComplaintReadiness ------------------------------------------

describe("evaluateStaffComplaintReadiness", () => {
  it("returns 0 for empty training (PRESENCE pattern)", () => {
    const result = evaluateStaffComplaintReadiness([]);
    expect(result.overallScore).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.complaintHandlingRate).toBe(0);
    expect(result.childFocusedResolutionRate).toBe(0);
    expect(result.conflictResolutionRate).toBe(0);
    expect(result.documentationSkillsRate).toBe(0);
    expect(result.advocacyAwarenessRate).toBe(0);
    expect(result.regulatoryRequirementsRate).toBe(0);
  });

  it("returns 25 when all staff have all skills", () => {
    const training = [makeTraining(), makeTraining(), makeTraining()];
    const result = evaluateStaffComplaintReadiness(training);
    expect(result.overallScore).toBe(25);
    expect(result.totalStaff).toBe(3);
    expect(result.complaintHandlingRate).toBe(100);
  });

  it("weights skills correctly: 6+5+5+4+3+2 = 25", () => {
    // 1 staff, all skills true = full marks
    const training = [makeTraining()];
    const result = evaluateStaffComplaintReadiness(training);
    expect(result.overallScore).toBe(25);
  });

  it("calculates partial rates correctly", () => {
    const training = [
      makeTraining({ complaintHandling: true, childFocusedResolution: true, conflictResolution: false, documentationSkills: false, advocacyAwareness: false, regulatoryRequirements: false }),
      makeTraining({ complaintHandling: true, childFocusedResolution: false, conflictResolution: false, documentationSkills: false, advocacyAwareness: false, regulatoryRequirements: false }),
    ];
    const result = evaluateStaffComplaintReadiness(training);
    expect(result.totalStaff).toBe(2);
    expect(result.complaintHandlingRate).toBe(100); // 2/2
    expect(result.childFocusedResolutionRate).toBe(50); // 1/2
    expect(result.conflictResolutionRate).toBe(0); // 0/2
    // Scores: round(100/100*6) + round(50/100*5) + round(0/100*5) + round(0/100*4) + round(0/100*3) + round(0/100*2)
    // = 6 + 3 + 0 + 0 + 0 + 0 = 9
    expect(result.overallScore).toBe(9);
  });

  it("handles mixed training across 4 staff", () => {
    const training = [
      makeTraining({ staffName: "Sarah Johnson" }),
      makeTraining({ staffName: "Tom Richards", advocacyAwareness: false }),
      makeTraining({ staffName: "Lisa Williams", conflictResolution: false, regulatoryRequirements: false }),
      makeTraining({ staffName: "Darren Laville" }),
    ];
    const result = evaluateStaffComplaintReadiness(training);
    expect(result.totalStaff).toBe(4);
    expect(result.complaintHandlingRate).toBe(100);
    expect(result.advocacyAwarenessRate).toBe(75); // 3/4
    expect(result.conflictResolutionRate).toBe(75); // 3/4
    expect(result.regulatoryRequirementsRate).toBe(75); // 3/4
  });

  it("is capped at 25", () => {
    const training = Array.from({ length: 10 }, () => makeTraining());
    const result = evaluateStaffComplaintReadiness(training);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });
});

// -- buildChildComplaintProfiles ----------------------------------------------

describe("buildChildComplaintProfiles", () => {
  it("returns empty array for empty records", () => {
    const profiles = buildChildComplaintProfiles([]);
    expect(profiles).toHaveLength(0);
  });

  it("groups records by childId", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildComplaintProfiles(records);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.complaintCount).toBe(2);
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(jordan?.complaintCount).toBe(1);
  });

  it("calculates frequency score: >= 10 -> 2", () => {
    const records = Array.from({ length: 10 }, () =>
      makeRecord({ childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildComplaintProfiles(records);
    expect(profiles[0].complaintCount).toBe(10);
    // frequency=2, resolution=3 (100%), informed=3 (100%), diversity=0 (1 source)
    expect(profiles[0].overallScore).toBe(8);
  });

  it("calculates frequency score: >= 5 -> 1", () => {
    const records = Array.from({ length: 5 }, () =>
      makeRecord({ childId: "child-alex", childName: "Alex" }),
    );
    const profiles = buildChildComplaintProfiles(records);
    // frequency=1, resolution=3 (100%), informed=3 (100%), diversity=0 (1 source)
    expect(profiles[0].overallScore).toBe(7);
  });

  it("calculates frequency score: < 5 -> 0", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-alex", childName: "Alex" }),
    ];
    const profiles = buildChildComplaintProfiles(records);
    // frequency=0, resolution=3 (100%), informed=3 (100%), diversity=0 (1 source)
    expect(profiles[0].overallScore).toBe(6);
  });

  it("calculates resolution score tiers correctly", () => {
    // 80% resolution rate -> 3
    const records80 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        childId: "child-alex",
        childName: "Alex",
        resolutionOutcome: i < 4 ? "fully_resolved" : "unresolved",
      }),
    );
    const profiles80 = buildChildComplaintProfiles(records80);
    expect(profiles80[0].resolutionRate).toBe(80);

    // 60% -> 2
    const records60 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        childId: "child-alex",
        childName: "Alex",
        resolutionOutcome: i < 3 ? "fully_resolved" : "unresolved",
      }),
    );
    const profiles60 = buildChildComplaintProfiles(records60);
    expect(profiles60[0].resolutionRate).toBe(60);

    // 20% -> 0
    const records20 = Array.from({ length: 5 }, (_, i) =>
      makeRecord({
        childId: "child-alex",
        childName: "Alex",
        resolutionOutcome: i < 1 ? "fully_resolved" : "unresolved",
      }),
    );
    const profiles20 = buildChildComplaintProfiles(records20);
    expect(profiles20[0].resolutionRate).toBe(20);
  });

  it("calculates diversity score: >= 4 sources -> 2", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "child" }),
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "parent_carer" }),
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "professional" }),
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "advocate" }),
    ];
    const profiles = buildChildComplaintProfiles(records);
    expect(profiles[0].sourceDiversity).toBe(4);
    // frequency=0, resolution=3 (100%), informed=3 (100%), diversity=2
    expect(profiles[0].overallScore).toBe(8);
  });

  it("calculates diversity score: >= 2 sources -> 1", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "child" }),
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "parent_carer" }),
    ];
    const profiles = buildChildComplaintProfiles(records);
    expect(profiles[0].sourceDiversity).toBe(2);
    // frequency=0, resolution=3 (100%), informed=3 (100%), diversity=1
    expect(profiles[0].overallScore).toBe(7);
  });

  it("caps profile score at 10", () => {
    // Max possible: frequency(2) + resolution(3) + informed(3) + diversity(2) = 10
    const sources = ["child", "parent_carer", "professional", "advocate", "staff", "visitor", "anonymous", "regulator", "child", "child"] as const;
    const records = sources.map((s) =>
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: s }),
    );
    const profiles = buildChildComplaintProfiles(records);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });
});

// -- generateComplaintResolutionEffectivenessIntelligence ----------------------

describe("generateComplaintResolutionEffectivenessIntelligence", () => {
  it("sums 4 evaluator scores and caps at 100", () => {
    const records = [makeRecord(), makeRecord({ childId: "child-jordan", childName: "Jordan" })];
    const policy = makePolicy();
    const training = [makeTraining(), makeTraining()];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    // All perfect: 25+25+25+25 = 100, capped at 100
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.overallScore).toBe(
      result.resolutionQuality.overallScore +
        result.complaintCompliance.overallScore +
        result.complaintPolicy.overallScore +
        result.staffComplaintReadiness.overallScore,
    );
  });

  it("returns correct rating based on overall score", () => {
    const records = [makeRecord()];
    const policy = makePolicy();
    const training = [makeTraining()];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("includes strength when resolution rate >= 80", () => {
    const records = [
      makeRecord({ resolutionOutcome: "fully_resolved" }),
      makeRecord({ resolutionOutcome: "fully_resolved" }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.strengths).toContain(
      "Strong complaint resolution rate demonstrates effective handling of concerns raised",
    );
  });

  it("includes strength when childInformedRate >= 80", () => {
    const records = [
      makeRecord({ childInformed: true }),
      makeRecord({ childInformed: true }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.strengths).toContain(
      "Children consistently informed of complaint outcomes, supporting their right to be heard",
    );
  });

  it("includes strength when lessonsLearnedRate >= 80", () => {
    const records = [
      makeRecord({ lessonsLearned: true }),
      makeRecord({ lessonsLearned: true }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.strengths).toContain(
      "Good learning from complaints culture with lessons identified and applied",
    );
  });

  it("includes strength when documentedRate >= 80", () => {
    const records = [
      makeRecord({ documentedInRecord: true }),
      makeRecord({ documentedInRecord: true }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.strengths).toContain(
      "Excellent documentation of complaints ensures accountability and transparency",
    );
  });

  it("generates action for empty records", () => {
    const result = generateComplaintResolutionEffectivenessIntelligence(
      [],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.actions).toContain(
      "No complaint records found -- ensure complaints process is accessible and records are maintained",
    );
  });

  it("generates URGENT action for null policy", () => {
    const result = generateComplaintResolutionEffectivenessIntelligence(
      [makeRecord()],
      null,
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.actions).toContain(
      "URGENT: Develop and implement a comprehensive complaints policy covering all regulatory requirements",
    );
  });

  it("generates URGENT action for empty training", () => {
    const result = generateComplaintResolutionEffectivenessIntelligence(
      [makeRecord()],
      makePolicy(),
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.actions).toContain(
      "URGENT: Provide complaint handling training to all staff to ensure effective resolution of concerns",
    );
  });

  it("generates action for low timescale compliance", () => {
    const records = [
      makeRecord({ resolvedWithinTimescale: false }),
      makeRecord({ resolvedWithinTimescale: false }),
      makeRecord({ resolvedWithinTimescale: true }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.actions).toContain(
      "Improve resolution timescales by implementing tracking systems and escalation triggers",
    );
  });

  it("generates action for low satisfaction", () => {
    const records = [
      makeRecord({ complainantSatisfied: false }),
      makeRecord({ complainantSatisfied: false }),
      makeRecord({ complainantSatisfied: true }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.actions).toContain(
      "Address complainant satisfaction through improved communication and follow-up during resolution",
    );
  });

  it("includes exactly 7 regulatory links", () => {
    const result = generateComplaintResolutionEffectivenessIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks[0]).toContain("CHR 2015 Regulation 39");
    expect(result.regulatoryLinks[1]).toContain("CHR 2015 Regulation 40");
    expect(result.regulatoryLinks[2]).toContain("SCCIF");
    expect(result.regulatoryLinks[3]).toContain("NMS 14");
    expect(result.regulatoryLinks[4]).toContain("Children Act 1989");
    expect(result.regulatoryLinks[5]).toContain("Ofsted");
    expect(result.regulatoryLinks[6]).toContain("Children's Commissioner");
  });

  it("preserves homeId and period dates", () => {
    const result = generateComplaintResolutionEffectivenessIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("builds child profiles from records", () => {
    const records = [
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-alex", childName: "Alex" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan" }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.childProfiles).toHaveLength(2);
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    expect(alex?.complaintCount).toBe(2);
  });

  it("handles all-empty inputs gracefully", () => {
    const result = generateComplaintResolutionEffectivenessIntelligence(
      [],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.overallScore).toBe(0);
    expect(result.rating).toBe("inadequate");
    expect(result.childProfiles).toHaveLength(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates full Oak House demo scenario", () => {
    const records: ComplaintRecord[] = [
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "child", resolutionOutcome: "fully_resolved" }),
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "parent_carer", resolutionOutcome: "fully_resolved" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", complaintSource: "professional", resolutionOutcome: "fully_resolved" }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", complaintSource: "child", resolutionOutcome: "partially_resolved" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", complaintSource: "advocate", resolutionOutcome: "fully_resolved" }),
      makeRecord({ childId: "child-morgan", childName: "Morgan", complaintSource: "staff", resolutionOutcome: "fully_resolved", complainantSatisfied: false }),
      makeRecord({ childId: "child-alex", childName: "Alex", complaintSource: "regulator", resolutionOutcome: "escalated", resolvedWithinTimescale: false, childInformed: false }),
      makeRecord({ childId: "child-jordan", childName: "Jordan", complaintSource: "anonymous", resolutionOutcome: "unresolved", resolvedWithinTimescale: false, lessonsLearned: false, complainantSatisfied: false }),
    ];

    const policy = makePolicy();
    const training = [
      makeTraining({ staffName: "Sarah Johnson" }),
      makeTraining({ staffName: "Tom Richards" }),
      makeTraining({ staffName: "Lisa Williams", advocacyAwareness: false }),
      makeTraining({ staffName: "Darren Laville" }),
    ];

    const result = generateComplaintResolutionEffectivenessIntelligence(
      records,
      policy,
      training,
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );

    expect(result.homeId).toBe("oak-house");
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.childProfiles).toHaveLength(3);
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });
});
