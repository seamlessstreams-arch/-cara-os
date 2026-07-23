// ══════════════════════════════════════════════════════════════════════════════
// Cara Incidents & Restraint — Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateIncidentCompliance,
  analyzeRestraints,
  calculateIncidentMetrics,
  getSeverityLabel,
  getCategoryLabel,
  getRestraintTypeLabel,
} from "../incident-engine";
import type {
  Incident,
  RestraintRecord,
  IncidentSeverity,
  IncidentCategory,
  RestraintType,
} from "../incident-engine";

// ── Constants ──────────────────────────────────────────────────────────────

const FIXED_NOW = "2026-05-16T12:00:00Z";

// ── Factories ──────────────────────────────────────────────────────────────

function makeRestraint(overrides: Partial<RestraintRecord> = {}): RestraintRecord {
  return {
    type: "standing_hold",
    startTime: "2026-05-10T18:30:00Z",
    endTime: "2026-05-10T18:37:00Z",
    durationMinutes: 7,
    reason: "Immediate danger of harm to self and others",
    staffApplyingRestraint: ["staff-001", "staff-002"],
    approvedTechnique: true,
    trainingProvider: "PRICE",
    childDebriefed: true,
    childDebriefDate: "2026-05-10T19:00:00Z",
    staffDebriefed: true,
    staffDebriefDate: "2026-05-10T20:00:00Z",
    ...overrides,
  };
}

function makeIncident(overrides: Partial<Incident> = {}): Incident {
  return {
    id: "inc-001",
    childId: "child-jordan",
    childName: "Jordan Williams",
    homeId: "home-oak",
    category: "physical_intervention",
    severity: 3,

    occurredAt: "2026-05-10T18:25:00Z",
    reportedAt: "2026-05-10T19:30:00Z",
    location: "Lounge area",

    description: "Child became physically aggressive towards peer during disagreement over TV remote.",
    antecedent: "Disagreement with peer about TV programme choice. Staff attempted de-escalation.",
    behaviour: "Punching towards peer, then turned aggression to staff when intervened.",
    consequence: "Physical intervention applied. Child calmed after 7 minutes. Separated and debriefed.",

    staffInvolved: ["staff-001", "staff-002"],
    staffWitnesses: ["staff-003"],
    childrenAffected: ["child-alex"],

    restraint: makeRestraint(),

    deEscalationAttempted: true,
    deEscalationTechniques: ["verbal_reassurance", "offering_choices", "change_of_environment"],

    postIncidentActions: [
      "child_debrief",
      "staff_debrief",
      "medical_check",
      "parent_notified",
      "social_worker_notified",
      "rm_notified",
      "risk_assessment_updated",
    ],
    injuries: [],
    notifications: [
      { recipient: "RM — Sarah Mitchell", type: "rm_notified", notifiedAt: "2026-05-10T19:45:00Z", method: "phone" },
      { recipient: "SW — Jane Peters", type: "social_worker_notified", notifiedAt: "2026-05-10T20:00:00Z", method: "email" },
    ],

    completedWithin24h: true,
    signedOffBy: "staff-rm-001",
    signedOffAt: "2026-05-11T09:00:00Z",

    loggedBy: "staff-001",
    loggedAt: "2026-05-10T19:30:00Z",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIncidentCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentCompliance", () => {
  it("returns fully compliant for well-managed incident", () => {
    const incident = makeIncident();
    const result = evaluateIncidentCompliance(incident);
    expect(result.isCompliant).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.restraintCompliant).toBe(true);
    expect(result.deEscalationDocumented).toBe(true);
    expect(result.notificationsComplete).toBe(true);
    expect(result.recordedWithin24h).toBe(true);
    expect(result.postIncidentComplete).toBe(true);
  });

  it("flags incident reported after 24 hours", () => {
    const incident = makeIncident({
      occurredAt: "2026-05-08T18:00:00Z",
      reportedAt: "2026-05-10T19:30:00Z", // ~49h later
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.recordedWithin24h).toBe(false);
    expect(result.isCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("after occurrence"))).toBe(true);
  });

  it("flags missing de-escalation for physical intervention", () => {
    const incident = makeIncident({
      deEscalationAttempted: false,
      deEscalationTechniques: [],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.deEscalationDocumented).toBe(false);
    expect(result.issues.some(i => i.includes("de-escalation"))).toBe(true);
  });

  it("does not flag de-escalation for non-PI categories", () => {
    const incident = makeIncident({
      category: "property_damage",
      restraint: undefined,
      deEscalationAttempted: false,
      deEscalationTechniques: [],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.issues.filter(i => i.includes("de-escalation"))).toHaveLength(0);
  });

  it("flags unapproved restraint technique", () => {
    const incident = makeIncident({
      restraint: makeRestraint({ approvedTechnique: false }),
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.restraintCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("not from approved"))).toBe(true);
  });

  it("flags excessive restraint duration (>20 min)", () => {
    const incident = makeIncident({
      restraint: makeRestraint({ durationMinutes: 25 }),
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.restraintCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("25 minutes"))).toBe(true);
  });

  it("flags child not debriefed after restraint", () => {
    const incident = makeIncident({
      restraint: makeRestraint({ childDebriefed: false }),
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.restraintCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Child not debriefed"))).toBe(true);
  });

  it("flags staff not debriefed after restraint", () => {
    const incident = makeIncident({
      restraint: makeRestraint({ staffDebriefed: false }),
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.restraintCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("Staff not debriefed"))).toBe(true);
  });

  it("flags no staff identified for restraint", () => {
    const incident = makeIncident({
      restraint: makeRestraint({ staffApplyingRestraint: [] }),
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.restraintCompliant).toBe(false);
    expect(result.issues.some(i => i.includes("No staff identified"))).toBe(true);
  });

  it("returns null for restraintCompliant when no restraint", () => {
    const incident = makeIncident({
      category: "verbal_aggression",
      restraint: undefined,
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.restraintCompliant).toBeNull();
  });

  it("flags missing RM notification for severity 3+", () => {
    const incident = makeIncident({
      severity: 3,
      postIncidentActions: ["child_debrief", "staff_debrief", "parent_notified", "social_worker_notified"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.notificationsComplete).toBe(false);
    expect(result.issues.some(i => i.includes("Registered Manager"))).toBe(true);
  });

  it("flags missing Ofsted notification for severity 4+", () => {
    const incident = makeIncident({
      severity: 4,
      postIncidentActions: ["child_debrief", "staff_debrief", "parent_notified", "social_worker_notified", "rm_notified"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.notificationsComplete).toBe(false);
    expect(result.issues.some(i => i.includes("Ofsted"))).toBe(true);
  });

  it("does not require Ofsted for severity 3", () => {
    const incident = makeIncident({ severity: 3 });
    const result = evaluateIncidentCompliance(incident);
    expect(result.issues.filter(i => i.includes("Ofsted"))).toHaveLength(0);
  });

  it("flags missing parent notification", () => {
    const incident = makeIncident({
      severity: 2,
      postIncidentActions: ["child_debrief", "staff_debrief"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.issues.some(i => i.includes("Parent/carer"))).toBe(true);
  });

  it("flags missing child debrief", () => {
    const incident = makeIncident({
      postIncidentActions: ["staff_debrief", "parent_notified", "social_worker_notified", "rm_notified"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.postIncidentComplete).toBe(false);
    expect(result.issues.some(i => i.includes("Child debrief"))).toBe(true);
  });

  it("flags missing staff debrief for PI", () => {
    const incident = makeIncident({
      postIncidentActions: ["child_debrief", "parent_notified", "social_worker_notified", "rm_notified"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.postIncidentComplete).toBe(false);
    expect(result.issues.some(i => i.includes("Staff debrief"))).toBe(true);
  });

  it("flags missing medical check when injuries exist", () => {
    const incident = makeIncident({
      injuries: [
        { person: "Jordan Williams", personType: "child", description: "Red mark on arm", bodyMapCompleted: true, medicalAttentionRequired: false, medicalAttentionProvided: false, hospitalAttendance: false },
      ],
      postIncidentActions: ["child_debrief", "staff_debrief", "parent_notified", "social_worker_notified", "rm_notified"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.issues.some(i => i.includes("Medical check"))).toBe(true);
  });

  it("flags incomplete body map for child injuries", () => {
    const incident = makeIncident({
      injuries: [
        { person: "Jordan Williams", personType: "child", description: "Red mark on arm", bodyMapCompleted: false, medicalAttentionRequired: false, medicalAttentionProvided: false, hospitalAttendance: false },
      ],
      postIncidentActions: ["child_debrief", "staff_debrief", "parent_notified", "social_worker_notified", "rm_notified", "medical_check"],
    });
    const result = evaluateIncidentCompliance(incident);
    expect(result.issues.some(i => i.includes("Body map"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// analyzeRestraints
// ══════════════════════════════════════════════════════════════════════════════

describe("analyzeRestraints", () => {
  function makeRestraintIncident(id: string, overrides: Partial<Incident> = {}): Incident {
    return makeIncident({
      id,
      category: "physical_intervention",
      restraint: makeRestraint(),
      ...overrides,
    });
  }

  it("counts total restraints for home", () => {
    const incidents = [
      makeRestraintIncident("inc-1"),
      makeRestraintIncident("inc-2"),
      makeIncident({ id: "inc-3", category: "verbal_aggression", restraint: undefined }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.totalRestraints).toBe(2);
  });

  it("counts restraints this month", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { occurredAt: "2026-05-10T18:00:00Z" }),
      makeRestraintIncident("inc-2", { occurredAt: "2026-05-03T18:00:00Z" }),
      makeRestraintIncident("inc-3", { occurredAt: "2026-04-20T18:00:00Z" }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.restraintsThisMonth).toBe(2);
  });

  it("calculates average duration", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { restraint: makeRestraint({ durationMinutes: 5 }) }),
      makeRestraintIncident("inc-2", { restraint: makeRestraint({ durationMinutes: 15 }) }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.averageDurationMinutes).toBe(10);
    expect(result.longestDurationMinutes).toBe(15);
  });

  it("calculates approved technique rate", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { restraint: makeRestraint({ approvedTechnique: true }) }),
      makeRestraintIncident("inc-2", { restraint: makeRestraint({ approvedTechnique: true }) }),
      makeRestraintIncident("inc-3", { restraint: makeRestraint({ approvedTechnique: false }) }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.approvedTechniqueRate).toBe(67); // 2/3
  });

  it("calculates de-escalation attempted rate", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { deEscalationAttempted: true }),
      makeRestraintIncident("inc-2", { deEscalationAttempted: false }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.deEscalationAttemptedRate).toBe(50);
  });

  it("calculates child and staff debrief rates", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { restraint: makeRestraint({ childDebriefed: true, staffDebriefed: true }) }),
      makeRestraintIncident("inc-2", { restraint: makeRestraint({ childDebriefed: false, staffDebriefed: false }) }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.childDebriefRate).toBe(50);
    expect(result.staffDebriefRate).toBe(50);
  });

  it("calculates injury rate", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { injuries: [{ person: "Jordan", personType: "child", description: "Mark", bodyMapCompleted: true, medicalAttentionRequired: false, medicalAttentionProvided: false, hospitalAttendance: false }] }),
      makeRestraintIncident("inc-2"),
      makeRestraintIncident("inc-3"),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.injuryRate).toBe(33); // 1/3
  });

  it("detects increasing trend", () => {
    const incidents = [
      // 3 recent (within 90 days)
      makeRestraintIncident("inc-1", { occurredAt: "2026-05-10T18:00:00Z" }),
      makeRestraintIncident("inc-2", { occurredAt: "2026-04-15T18:00:00Z" }),
      makeRestraintIncident("inc-3", { occurredAt: "2026-03-20T18:00:00Z" }),
      // 1 older
      makeRestraintIncident("inc-4", { occurredAt: "2026-01-10T18:00:00Z" }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.trend).toBe("increasing");
  });

  it("groups by child", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { childId: "child-jordan", childName: "Jordan Williams" }),
      makeRestraintIncident("inc-2", { childId: "child-jordan", childName: "Jordan Williams" }),
      makeRestraintIncident("inc-3", { childId: "child-alex", childName: "Alex Reeves" }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.byChild[0].childId).toBe("child-jordan");
    expect(result.byChild[0].count).toBe(2);
  });

  it("groups by time of day", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { occurredAt: "2026-05-10T18:00:00Z" }), // evening
      makeRestraintIncident("inc-2", { occurredAt: "2026-05-09T19:00:00Z" }), // evening
      makeRestraintIncident("inc-3", { occurredAt: "2026-05-08T09:00:00Z" }), // morning
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.byTimeOfDay[0].period).toBe("evening");
    expect(result.byTimeOfDay[0].count).toBe(2);
  });

  it("leaves restraint rates unmeasured for empty incidents", () => {
    const result = analyzeRestraints([], "home-oak", FIXED_NOW);
    expect(result.totalRestraints).toBe(0);
    expect(result.averageDurationMinutes).toBe(0);
    expect(result.approvedTechniqueRate).toBeNull();
    expect(result.injuryRate).toBeNull();
  });

  it("filters to correct home", () => {
    const incidents = [
      makeRestraintIncident("inc-1", { homeId: "home-oak" }),
      makeRestraintIncident("inc-2", { homeId: "home-elm" }),
    ];
    const result = analyzeRestraints(incidents, "home-oak", FIXED_NOW);
    expect(result.totalRestraints).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// calculateIncidentMetrics
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateIncidentMetrics", () => {
  it("counts total incidents for home", () => {
    const incidents = [
      makeIncident({ id: "inc-1" }),
      makeIncident({ id: "inc-2" }),
      makeIncident({ id: "inc-3", homeId: "home-elm" }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.totalIncidents).toBe(2);
  });

  it("counts incidents this month and quarter", () => {
    const incidents = [
      makeIncident({ id: "inc-1", occurredAt: "2026-05-10T18:00:00Z" }),
      makeIncident({ id: "inc-2", occurredAt: "2026-04-15T18:00:00Z" }),
      makeIncident({ id: "inc-3", occurredAt: "2026-02-01T18:00:00Z" }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.incidentsThisMonth).toBe(1);
    expect(result.incidentsThisQuarter).toBe(2); // Apr+May = Q2
  });

  it("breaks down by severity", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: 2 }),
      makeIncident({ id: "inc-2", severity: 3 }),
      makeIncident({ id: "inc-3", severity: 3 }),
      makeIncident({ id: "inc-4", severity: 5 }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.bySeverity.find(s => s.severity === 3)?.count).toBe(2);
    expect(result.bySeverity.find(s => s.severity === 5)?.count).toBe(1);
    expect(result.bySeverity.find(s => s.severity === 1)?.count).toBe(0);
  });

  it("breaks down by category", () => {
    const incidents = [
      makeIncident({ id: "inc-1", category: "physical_intervention" }),
      makeIncident({ id: "inc-2", category: "verbal_aggression", restraint: undefined }),
      makeIncident({ id: "inc-3", category: "verbal_aggression", restraint: undefined }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.byCategory[0].category).toBe("verbal_aggression");
    expect(result.byCategory[0].count).toBe(2);
  });

  it("calculates compliance rate", () => {
    const incidents = [
      makeIncident({ id: "inc-1" }), // compliant
      makeIncident({ id: "inc-2", postIncidentActions: [] }), // non-compliant (missing debrief etc)
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.complianceRate).toBe(50);
  });

  it("calculates average response time", () => {
    const incidents = [
      makeIncident({ id: "inc-1", occurredAt: "2026-05-10T18:00:00Z", reportedAt: "2026-05-10T18:30:00Z" }), // 30 min
      makeIncident({ id: "inc-2", occurredAt: "2026-05-09T18:00:00Z", reportedAt: "2026-05-09T19:30:00Z" }), // 90 min
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.averageResponseMinutes).toBe(60); // (30+90)/2
  });

  it("counts unique children involved", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-jordan" }),
      makeIncident({ id: "inc-2", childId: "child-jordan" }),
      makeIncident({ id: "inc-3", childId: "child-alex" }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.childrenInvolved).toBe(2);
  });

  it("identifies repeat patterns (3+ incidents per child)", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-jordan", childName: "Jordan Williams" }),
      makeIncident({ id: "inc-2", childId: "child-jordan", childName: "Jordan Williams" }),
      makeIncident({ id: "inc-3", childId: "child-jordan", childName: "Jordan Williams" }),
      makeIncident({ id: "inc-4", childId: "child-alex", childName: "Alex Reeves" }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.repeatPatterns).toHaveLength(1);
    expect(result.repeatPatterns[0].childId).toBe("child-jordan");
    expect(result.repeatPatterns[0].count).toBe(3);
  });

  it("counts Ofsted-notifiable incidents (severity 4+)", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: 3 }),
      makeIncident({ id: "inc-2", severity: 4 }),
      makeIncident({ id: "inc-3", severity: 5 }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.requiresOfstedNotification).toBe(2);
  });

  it("includes restraint sub-metrics", () => {
    const incidents = [
      makeIncident({ id: "inc-1" }), // has restraint
      makeIncident({ id: "inc-2", category: "verbal_aggression", restraint: undefined }),
    ];
    const result = calculateIncidentMetrics(incidents, "home-oak", FIXED_NOW);
    expect(result.restraintMetrics).toBeDefined();
    expect(result.restraintMetrics.totalRestraints).toBe(1);
  });

  it("leaves metrics unmeasured for empty incidents", () => {
    const result = calculateIncidentMetrics([], "home-oak", FIXED_NOW);
    expect(result.totalIncidents).toBe(0);
    expect(result.complianceRate).toBeNull();
    expect(result.averageResponseMinutes).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper functions
// ══════════════════════════════════════════════════════════════════════════════

describe("helper functions", () => {
  it("getSeverityLabel returns correct labels", () => {
    expect(getSeverityLabel(1)).toBe("Minor");
    expect(getSeverityLabel(3)).toBe("Moderate");
    expect(getSeverityLabel(5)).toBe("Critical");
  });

  it("getCategoryLabel returns correct labels", () => {
    expect(getCategoryLabel("physical_intervention")).toBe("Physical Intervention");
    expect(getCategoryLabel("self_harm")).toBe("Self-Harm");
    expect(getCategoryLabel("substance_use")).toBe("Substance Use");
  });

  it("getRestraintTypeLabel returns correct labels", () => {
    expect(getRestraintTypeLabel("standing_hold")).toBe("Standing Hold");
    expect(getRestraintTypeLabel("ground_hold")).toBe("Ground Hold");
    expect(getRestraintTypeLabel("wrap")).toBe("Therapeutic Wrap");
  });
});
