import { describe, it, expect } from "vitest";
import {
  getRating,
  getConflictTypeLabel,
  getResolutionOutcomeLabel,
  getRatingLabel,
  evaluateConflictQuality,
  evaluateConflictCompliance,
  evaluateConflictPolicy,
  evaluateStaffConflictReadiness,
  buildChildConflictProfiles,
  generateConflictResolutionManagementIntelligence,
} from "../conflict-resolution-management-engine";
import type {
  ConflictIncident,
  ConflictResolutionPolicy,
  StaffConflictResolutionTraining,
  ConflictType,
} from "../conflict-resolution-management-engine";

// ── Factories ────────────────────────────────────────────────────────────────

let _iid = 0;
function makeIncident(overrides: Partial<ConflictIncident> = {}): ConflictIncident {
  _iid++;
  return {
    id: `i-${_iid}`,
    childId: "child-1",
    childName: "Alex",
    incidentDate: "2026-03-01",
    conflictType: "peer_disagreement",
    resolutionOutcome: "fully_resolved",
    deEscalationUsed: true,
    childVoiceHeard: true,
    restorativePractice: true,
    documentedInPlan: true,
    staffSupported: true,
    feedbackGiven: true,
    ...overrides,
  };
}

function makePolicy(overrides: Partial<ConflictResolutionPolicy> = {}): ConflictResolutionPolicy {
  return {
    id: "p-1",
    behaviourManagementStrategy: true,
    deEscalationProtocol: true,
    restorativePracticeFramework: true,
    antibullyingPolicy: true,
    physicalInterventionGuidance: true,
    childParticipationInResolution: true,
    regularReview: true,
    ...overrides,
  };
}

let _tid = 0;
function makeTraining(overrides: Partial<StaffConflictResolutionTraining> = {}): StaffConflictResolutionTraining {
  _tid++;
  return {
    id: `t-${_tid}`,
    staffId: `staff-${_tid}`,
    staffName: `Staff ${_tid}`,
    deEscalationTechniques: true,
    restorativePractice: true,
    conflictMediation: true,
    traumaInformedResponse: true,
    physicalInterventionCertified: true,
    reflectiveDebrief: true,
    ...overrides,
  };
}

// ── pct ──────────────────────────────────────────────────────────────────────


// ── getRating ────────────────────────────────────────────────────────────────

describe("getRating", () => {
  it("returns outstanding for >= 80", () => { expect(getRating(80)).toBe("outstanding"); expect(getRating(100)).toBe("outstanding"); });
  it("returns good for >= 60", () => { expect(getRating(60)).toBe("good"); expect(getRating(79)).toBe("good"); });
  it("returns requires_improvement for >= 40", () => { expect(getRating(40)).toBe("requires_improvement"); expect(getRating(59)).toBe("requires_improvement"); });
  it("returns inadequate for < 40", () => { expect(getRating(39)).toBe("inadequate"); expect(getRating(0)).toBe("inadequate"); });
});

// ── Label functions ──────────────────────────────────────────────────────────

describe("label functions", () => {
  it("getConflictTypeLabel returns all 8 labels", () => {
    expect(getConflictTypeLabel("peer_disagreement")).toBe("Peer Disagreement");
    expect(getConflictTypeLabel("staff_child_conflict")).toBe("Staff–Child Conflict");
    expect(getConflictTypeLabel("bullying_incident")).toBe("Bullying Incident");
    expect(getConflictTypeLabel("property_dispute")).toBe("Property Dispute");
    expect(getConflictTypeLabel("boundary_challenge")).toBe("Boundary Challenge");
    expect(getConflictTypeLabel("group_tension")).toBe("Group Tension");
    expect(getConflictTypeLabel("verbal_altercation")).toBe("Verbal Altercation");
    expect(getConflictTypeLabel("physical_altercation")).toBe("Physical Altercation");
  });

  it("getResolutionOutcomeLabel returns all 5 labels", () => {
    expect(getResolutionOutcomeLabel("fully_resolved")).toBe("Fully Resolved");
    expect(getResolutionOutcomeLabel("partially_resolved")).toBe("Partially Resolved");
    expect(getResolutionOutcomeLabel("ongoing_management")).toBe("Ongoing Management");
    expect(getResolutionOutcomeLabel("escalated")).toBe("Escalated");
    expect(getResolutionOutcomeLabel("unresolved")).toBe("Unresolved");
  });

  it("getRatingLabel returns all 4 labels", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ── evaluateConflictQuality ──────────────────────────────────────────────────

describe("evaluateConflictQuality", () => {
  it("returns all zeros for empty array", () => {
    const r = evaluateConflictQuality([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalIncidents).toBe(0);
    expect(r.resolutionRate).toBeNull();
  });

  it("scores max 25 with perfect data", () => {
    const incidents = Array.from({ length: 10 }, () => makeIncident());
    const r = evaluateConflictQuality(incidents);
    expect(r.overallScore).toBe(25);
    expect(r.resolutionRate).toBe(100);
    expect(r.deEscalationRate).toBe(100);
    expect(r.childVoiceRate).toBe(100);
    expect(r.restorativeRate).toBe(100);
  });

  it("counts fully_resolved and partially_resolved as resolved", () => {
    const incidents = [
      makeIncident({ resolutionOutcome: "fully_resolved" }),
      makeIncident({ resolutionOutcome: "partially_resolved" }),
      makeIncident({ resolutionOutcome: "escalated" }),
      makeIncident({ resolutionOutcome: "unresolved" }),
    ];
    const r = evaluateConflictQuality(incidents);
    expect(r.resolutionRate).toBe(50);
  });

  it("calculates individual boolean rates", () => {
    const incidents = [
      makeIncident({ deEscalationUsed: true, childVoiceHeard: false, restorativePractice: false }),
      makeIncident({ deEscalationUsed: false, childVoiceHeard: true, restorativePractice: false }),
      makeIncident({ deEscalationUsed: false, childVoiceHeard: false, restorativePractice: true }),
      makeIncident({ deEscalationUsed: false, childVoiceHeard: false, restorativePractice: false }),
    ];
    const r = evaluateConflictQuality(incidents);
    expect(r.deEscalationRate).toBe(25);
    expect(r.childVoiceRate).toBe(25);
    expect(r.restorativeRate).toBe(25);
  });

  it("caps at 25", () => {
    const incidents = Array.from({ length: 20 }, () => makeIncident());
    expect(evaluateConflictQuality(incidents).overallScore).toBeLessThanOrEqual(25);
  });
});

// ── evaluateConflictCompliance ───────────────────────────────────────────────

describe("evaluateConflictCompliance", () => {
  it("returns all zeros for empty array", () => {
    const r = evaluateConflictCompliance([]);
    expect(r.overallScore).toBe(0);
    expect(r.documentedRate).toBeNull();
  });

  it("scores max 25 with full compliance and diversity", () => {
    const types: ConflictType[] = ["peer_disagreement", "staff_child_conflict", "bullying_incident", "property_dispute", "boundary_challenge", "group_tension", "verbal_altercation", "physical_altercation"];
    const incidents = types.map((t) => makeIncident({ conflictType: t }));
    const r = evaluateConflictCompliance(incidents);
    expect(r.overallScore).toBe(25);
    expect(r.conflictTypeDiversityRatio).toBe(100);
  });

  it("calculates documentation rate", () => {
    const incidents = [
      makeIncident({ documentedInPlan: true }),
      makeIncident({ documentedInPlan: true }),
      makeIncident({ documentedInPlan: false }),
      makeIncident({ documentedInPlan: false }),
    ];
    expect(evaluateConflictCompliance(incidents).documentedRate).toBe(50);
  });

  it("calculates diversity from unique conflict types", () => {
    const incidents = [
      makeIncident({ conflictType: "peer_disagreement" }),
      makeIncident({ conflictType: "bullying_incident" }),
      makeIncident({ conflictType: "peer_disagreement" }),
    ];
    expect(evaluateConflictCompliance(incidents).conflictTypeDiversityRatio).toBe(25); // 2/8
  });
});

// ── evaluateConflictPolicy ───────────────────────────────────────────────────

describe("evaluateConflictPolicy", () => {
  it("returns all zeros/false for null", () => {
    const r = evaluateConflictPolicy(null);
    expect(r.overallScore).toBe(0);
    expect(r.behaviourManagementStrategy).toBe(false);
    expect(r.regularReview).toBe(false);
  });

  it("scores 25 with all true", () => {
    expect(evaluateConflictPolicy(makePolicy()).overallScore).toBe(25);
  });

  it("weights first 4 at 4 points each", () => {
    const r = evaluateConflictPolicy(makePolicy({ deEscalationProtocol: false, restorativePracticeFramework: false, antibullyingPolicy: false, physicalInterventionGuidance: false, childParticipationInResolution: false, regularReview: false }));
    expect(r.overallScore).toBe(4);
  });

  it("weights last 3 at 3 points each", () => {
    const r = evaluateConflictPolicy(makePolicy({ behaviourManagementStrategy: false, deEscalationProtocol: false, restorativePracticeFramework: false, antibullyingPolicy: false }));
    expect(r.overallScore).toBe(9);
  });

  it("all false yields 0", () => {
    const r = evaluateConflictPolicy(makePolicy({
      behaviourManagementStrategy: false, deEscalationProtocol: false, restorativePracticeFramework: false,
      antibullyingPolicy: false, physicalInterventionGuidance: false, childParticipationInResolution: false, regularReview: false,
    }));
    expect(r.overallScore).toBe(0);
  });

  it("mirrors boolean values", () => {
    const r = evaluateConflictPolicy(makePolicy({ behaviourManagementStrategy: false }));
    expect(r.behaviourManagementStrategy).toBe(false);
    expect(r.deEscalationProtocol).toBe(true);
  });
});

// ── evaluateStaffConflictReadiness ───────────────────────────────────────────

describe("evaluateStaffConflictReadiness", () => {
  it("returns all zeros for empty array", () => {
    const r = evaluateStaffConflictReadiness([]);
    expect(r.overallScore).toBe(0);
    expect(r.totalStaff).toBe(0);
  });

  it("scores 25 with fully trained staff", () => {
    const r = evaluateStaffConflictReadiness([makeTraining(), makeTraining()]);
    expect(r.overallScore).toBe(25);
    expect(r.totalStaff).toBe(2);
  });

  it("weights 6+5+5+4+3+2=25", () => {
    expect(evaluateStaffConflictReadiness([makeTraining()]).overallScore).toBe(25);
  });

  it("handles partial training", () => {
    const t = makeTraining({ deEscalationTechniques: true, restorativePractice: false, conflictMediation: false, traumaInformedResponse: false, physicalInterventionCertified: false, reflectiveDebrief: false });
    const r = evaluateStaffConflictReadiness([t]);
    expect(r.deEscalationTechniquesRate).toBe(100);
    expect(r.restorativePracticeRate).toBe(0);
    expect(r.overallScore).toBe(6);
  });

  it("calculates mixed rates", () => {
    const t1 = makeTraining({ deEscalationTechniques: true, restorativePractice: false, conflictMediation: false, traumaInformedResponse: false, physicalInterventionCertified: false, reflectiveDebrief: false });
    const t2 = makeTraining({ deEscalationTechniques: false, restorativePractice: true, conflictMediation: false, traumaInformedResponse: false, physicalInterventionCertified: false, reflectiveDebrief: false });
    const r = evaluateStaffConflictReadiness([t1, t2]);
    expect(r.deEscalationTechniquesRate).toBe(50);
    expect(r.restorativePracticeRate).toBe(50);
  });
});

// ── buildChildConflictProfiles ───────────────────────────────────────────────

describe("buildChildConflictProfiles", () => {
  it("returns empty for empty incidents", () => {
    expect(buildChildConflictProfiles([])).toEqual([]);
  });

  it("groups by childId", () => {
    const incidents = [
      makeIncident({ childId: "c1", childName: "Alex" }),
      makeIncident({ childId: "c1", childName: "Alex" }),
      makeIncident({ childId: "c2", childName: "Jordan" }),
    ];
    const profiles = buildChildConflictProfiles(incidents);
    expect(profiles).toHaveLength(2);
    expect(profiles[0].totalIncidents).toBe(2);
    expect(profiles[1].totalIncidents).toBe(1);
  });

  it("caps profile score at 10", () => {
    const types: ConflictType[] = ["peer_disagreement", "bullying_incident", "property_dispute", "boundary_challenge", "group_tension"];
    const incidents = Array.from({ length: 12 }, (_, i) =>
      makeIncident({ childId: "c1", childName: "Alex", conflictType: types[i % types.length] }),
    );
    const profiles = buildChildConflictProfiles(incidents);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(10);
  });

  it("frequency scoring: <5=0, 5-9=1, 10+=2", () => {
    const make = (n: number) => Array.from({ length: n }, () => makeIncident({
      childId: "cx", childName: "X", resolutionOutcome: "unresolved", childVoiceHeard: false, conflictType: "peer_disagreement",
    }));
    expect(buildChildConflictProfiles(make(3))[0].overallScore).toBe(0);
    expect(buildChildConflictProfiles(make(5))[0].overallScore).toBe(1);
    expect(buildChildConflictProfiles(make(10))[0].overallScore).toBe(2);
  });
});

// ── generateConflictResolutionManagementIntelligence ─────────────────────────

describe("generateConflictResolutionManagementIntelligence", () => {
  it("produces complete result with all data", () => {
    const types: ConflictType[] = ["peer_disagreement", "staff_child_conflict", "bullying_incident", "property_dispute", "boundary_challenge", "group_tension", "verbal_altercation", "physical_altercation"];
    const incidents = types.map((t, i) =>
      makeIncident({ childId: i < 4 ? "c1" : "c2", childName: i < 4 ? "Alex" : "Jordan", conflictType: t }),
    );
    const r = generateConflictResolutionManagementIntelligence(incidents, makePolicy(), [makeTraining(), makeTraining()], "oak-house", "2026-01-01", "2026-05-20");
    expect(r.homeId).toBe("oak-house");
    expect(r.overallScore).toBeGreaterThan(0);
    expect(r.overallScore).toBeLessThanOrEqual(100);
    expect(r.childProfiles.length).toBeGreaterThan(0);
    expect(r.regulatoryLinks).toHaveLength(7);
  });

  it("returns 100 with perfect data", () => {
    const types: ConflictType[] = ["peer_disagreement", "staff_child_conflict", "bullying_incident", "property_dispute", "boundary_challenge", "group_tension", "verbal_altercation", "physical_altercation"];
    const incidents = types.map((t) => makeIncident({ conflictType: t }));
    const r = generateConflictResolutionManagementIntelligence(incidents, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(100);
    expect(r.rating).toBe("outstanding");
  });

  it("returns 0 with no data", () => {
    const r = generateConflictResolutionManagementIntelligence([], null, [], "h1", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBe(0);
    expect(r.rating).toBe("inadequate");
  });

  it("generates URGENT actions for missing policy and training", () => {
    const r = generateConflictResolutionManagementIntelligence([], null, [], "h1", "2026-01-01", "2026-06-01");
    const urgent = r.actions.filter((a) => a.startsWith("URGENT"));
    expect(urgent.length).toBe(2);
  });

  it("generates strengths when rates >= 80", () => {
    const types: ConflictType[] = ["peer_disagreement", "staff_child_conflict", "bullying_incident", "property_dispute", "boundary_challenge", "group_tension", "verbal_altercation", "physical_altercation"];
    const incidents = types.map((t) => makeIncident({ conflictType: t }));
    const r = generateConflictResolutionManagementIntelligence(incidents, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.strengths.length).toBeGreaterThan(0);
  });

  it("generates areas for improvement when rates < 60", () => {
    const incidents = [
      makeIncident({ resolutionOutcome: "unresolved", deEscalationUsed: false, childVoiceHeard: false, restorativePractice: false, staffSupported: false }),
      makeIncident({ resolutionOutcome: "escalated", deEscalationUsed: false, childVoiceHeard: false, restorativePractice: false, staffSupported: false }),
    ];
    const r = generateConflictResolutionManagementIntelligence(incidents, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("caps overall score at 100", () => {
    const types: ConflictType[] = ["peer_disagreement", "staff_child_conflict", "bullying_incident", "property_dispute", "boundary_challenge", "group_tension", "verbal_altercation", "physical_altercation"];
    const incidents = types.map((t) => makeIncident({ conflictType: t }));
    const r = generateConflictResolutionManagementIntelligence(incidents, makePolicy(), [makeTraining()], "h1", "2026-01-01", "2026-06-01");
    expect(r.overallScore).toBeLessThanOrEqual(100);
  });
});
