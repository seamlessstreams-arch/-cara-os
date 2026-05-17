// ══════════════════════════════════════════════════════════════════════════════
// Behaviour & Positive Relationships Engine — Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  analyseChildBehaviour,
  calculateHomeBehaviourMetrics,
  getSeverityLabel,
  getBehaviourTypeLabel,
  getInterventionLabel,
} from "../behaviour-engine";
import type {
  BehaviourIncident,
  PositiveEvent,
  BehaviourSupportPlan,
} from "../behaviour-engine";

// ── Fixtures ──────────────────────────────────────────────────────────────

const NOW = "2026-05-17T12:00:00Z";

function makeIncident(overrides: Partial<BehaviourIncident> = {}): BehaviourIncident {
  return {
    id: "inc-001",
    childId: "child-001",
    childName: "Jordan Williams",
    homeId: "home-oak",
    date: "2026-05-10T14:00:00Z",
    time: "14:00",
    severity: "medium",
    type: "verbal_aggression",
    description: "Raised voice at staff during transition",
    antecedent: "Asked to turn off game console for dinner",
    behaviour: "Shouting, swearing",
    consequence: "Given space, calmed within 10 minutes",
    interventionsUsed: ["verbal_reassurance", "offer_space"],
    deEscalationAttempted: true,
    deEscalationSuccessful: true,
    restraintUsed: false,
    injuryOccurred: false,
    triggers: ["transitions", "screen_time_limit"],
    staffInvolved: ["staff-sw-01"],
    witnesses: [],
    followUpActions: ["Discuss in keywork session"],
    recordedBy: "staff-sw-01",
    recordedAt: "2026-05-10T14:30:00Z",
    ...overrides,
  };
}

function makePositiveEvent(overrides: Partial<PositiveEvent> = {}): PositiveEvent {
  return {
    id: "pos-001",
    childId: "child-001",
    childName: "Jordan Williams",
    homeId: "home-oak",
    date: "2026-05-10T16:00:00Z",
    type: "prosocial_behaviour",
    description: "Helped younger child with homework",
    acknowledgedBy: "staff-sw-01",
    sharedWithTeam: true,
    recordedBy: "staff-sw-01",
    ...overrides,
  };
}

function makePlan(overrides: Partial<BehaviourSupportPlan> = {}): BehaviourSupportPlan {
  return {
    id: "bsp-001",
    childId: "child-001",
    childName: "Jordan Williams",
    homeId: "home-oak",
    createdAt: "2026-03-01T00:00:00Z",
    reviewDate: "2026-06-01T00:00:00Z",
    lastReviewedAt: "2026-04-15T00:00:00Z",
    isActive: true,
    knownTriggers: ["transitions", "screen_time_limit", "peer_conflict"],
    earlyWarningSignals: ["Pacing", "Clenched fists", "Short answers"],
    deEscalationStrategies: ["Offer space", "Countdown breathing", "Named adult support"],
    preferredInterventions: ["verbal_reassurance", "offer_space", "distraction"],
    rewardTargets: ["Managing transitions calmly", "Asking for help when frustrated"],
    restrictedPracticeThreshold: "Only if risk to self or others, after all de-escalation attempts exhausted",
    childContributed: true,
    socialWorkerAgreed: true,
    parentCarerInformed: true,
    ...overrides,
  };
}

// ���═════════════════════════════════════════════════════════════════════════════
// Individual Child Analysis Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("analyseChildBehaviour", () => {
  it("produces basic analysis with correct counts", () => {
    const incidents = [makeIncident(), makeIncident({ id: "inc-002", date: "2026-05-08T10:00:00Z" })];
    const positives = [makePositiveEvent(), makePositiveEvent({ id: "pos-002" })];
    const plans = [makePlan()];

    const result = analyseChildBehaviour(incidents, positives, plans, "child-001", NOW);

    expect(result.totalIncidents).toBe(2);
    expect(result.positiveEventsCount).toBe(2);
    expect(result.hasSupportPlan).toBe(true);
    expect(result.supportPlanCurrent).toBe(true);
  });

  it("calculates de-escalation rate", () => {
    const incidents = [
      makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
      makeIncident({ id: "i2", deEscalationAttempted: true, deEscalationSuccessful: true }),
      makeIncident({ id: "i3", deEscalationAttempted: true, deEscalationSuccessful: false }),
    ];
    const result = analyseChildBehaviour(incidents, [], [makePlan()], "child-001", NOW);
    expect(result.deEscalationRate).toBe(67);
  });

  it("counts restraints", () => {
    const incidents = [
      makeIncident({ restraintUsed: false }),
      makeIncident({ id: "i2", restraintUsed: true, restraintType: "standing", restraintDuration: 3 }),
      makeIncident({ id: "i3", restraintUsed: true, restraintType: "ground", restraintDuration: 2 }),
    ];
    const result = analyseChildBehaviour(incidents, [], [makePlan()], "child-001", NOW);
    expect(result.restraintCount).toBe(2);
  });

  it("detects increasing incident trend", () => {
    // 6 in last 30 days, 1 in previous 30 days
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-01T10:00:00Z" }),
      makeIncident({ id: "i2", date: "2026-05-03T10:00:00Z" }),
      makeIncident({ id: "i3", date: "2026-05-05T10:00:00Z" }),
      makeIncident({ id: "i4", date: "2026-05-08T10:00:00Z" }),
      makeIncident({ id: "i5", date: "2026-05-10T10:00:00Z" }),
      makeIncident({ id: "i6", date: "2026-05-12T10:00:00Z" }),
      makeIncident({ id: "i7", date: "2026-04-10T10:00:00Z" }), // previous 30d
    ];
    const result = analyseChildBehaviour(incidents, [], [makePlan()], "child-001", NOW);
    expect(result.incidentTrend).toBe("increasing");
  });

  it("detects decreasing incident trend", () => {
    // 1 in last 30 days, 5 in previous 30 days
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-15T10:00:00Z" }),
      makeIncident({ id: "i2", date: "2026-04-05T10:00:00Z" }),
      makeIncident({ id: "i3", date: "2026-04-08T10:00:00Z" }),
      makeIncident({ id: "i4", date: "2026-04-10T10:00:00Z" }),
      makeIncident({ id: "i5", date: "2026-04-12T10:00:00Z" }),
      makeIncident({ id: "i6", date: "2026-04-15T10:00:00Z" }),
    ];
    const result = analyseChildBehaviour(incidents, [], [makePlan()], "child-001", NOW);
    expect(result.incidentTrend).toBe("decreasing");
  });

  it("flags missing support plan", () => {
    const result = analyseChildBehaviour([makeIncident()], [], [], "child-001", NOW);
    expect(result.hasSupportPlan).toBe(false);
    expect(result.issues.some(i => i.includes("No active behaviour support plan"))).toBe(true);
  });

  it("flags overdue support plan review", () => {
    const plan = makePlan({
      reviewDate: "2026-02-01T00:00:00Z", // past
      lastReviewedAt: "2026-01-01T00:00:00Z", // > 90 days ago
    });
    const result = analyseChildBehaviour([makeIncident()], [], [plan], "child-001", NOW);
    expect(result.supportPlanCurrent).toBe(false);
    expect(result.issues.some(i => i.includes("overdue for review"))).toBe(true);
  });

  it("calculates positive to negative ratio", () => {
    const incidents = [makeIncident({ date: "2026-05-10T10:00:00Z" })];
    const positives = [
      makePositiveEvent({ id: "p1", date: "2026-05-05T10:00:00Z" }),
      makePositiveEvent({ id: "p2", date: "2026-05-07T10:00:00Z" }),
      makePositiveEvent({ id: "p3", date: "2026-05-09T10:00:00Z" }),
    ];
    const result = analyseChildBehaviour(incidents, positives, [makePlan()], "child-001", NOW);
    expect(result.positiveToNegativeRatio).toBe(3); // 3 positive : 1 negative
  });

  it("recommends improving ratio when below target", () => {
    const incidents = [
      makeIncident({ id: "i1", date: "2026-05-10T10:00:00Z" }),
      makeIncident({ id: "i2", date: "2026-05-12T10:00:00Z" }),
    ];
    const positives = [makePositiveEvent({ date: "2026-05-11T10:00:00Z" })];
    const result = analyseChildBehaviour(incidents, positives, [makePlan()], "child-001", NOW);
    expect(result.recommendations.some(r => r.includes("positive interactions"))).toBe(true);
  });

  it("flags high incident count", () => {
    const incidents = Array.from({ length: 7 }, (_, i) =>
      makeIncident({ id: `i${i}`, date: `2026-05-${String(i + 5).padStart(2, "0")}T10:00:00Z` })
    );
    const result = analyseChildBehaviour(incidents, [], [makePlan()], "child-001", NOW);
    expect(result.issues.some(i => i.includes("incidents in 30 days"))).toBe(true);
  });

  it("identifies common triggers", () => {
    const incidents = [
      makeIncident({ id: "i1", triggers: ["transitions", "hunger"] }),
      makeIncident({ id: "i2", triggers: ["transitions", "peer_conflict"] }),
      makeIncident({ id: "i3", triggers: ["transitions"] }),
    ];
    const result = analyseChildBehaviour(incidents, [], [makePlan()], "child-001", NOW);
    expect(result.commonTriggers[0]).toBe("transitions");
  });

  it("detects child voice in support plan", () => {
    const plan = makePlan({ childContributed: true });
    const result = analyseChildBehaviour([makeIncident()], [], [plan], "child-001", NOW);
    expect(result.supportPlanChildVoice).toBe(true);
  });

  it("recommends including child voice when missing", () => {
    const plan = makePlan({ childContributed: false });
    const result = analyseChildBehaviour([makeIncident()], [], [plan], "child-001", NOW);
    expect(result.recommendations.some(r => r.includes("child's voice"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Home Metrics Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("calculateHomeBehaviourMetrics", () => {
  it("calculates basic metrics", () => {
    const incidents = [makeIncident(), makeIncident({ id: "i2", childId: "child-002", childName: "Aisha" })];
    const positives = [makePositiveEvent()];
    const plans = [makePlan()];
    const result = calculateHomeBehaviourMetrics(incidents, positives, plans, "home-oak", NOW);

    expect(result.totalIncidents).toBe(2);
    expect(result.childCount).toBe(2);
    expect(result.totalPositiveEvents).toBe(1);
  });

  it("calculates de-escalation success rate", () => {
    const incidents = [
      makeIncident({ deEscalationAttempted: true, deEscalationSuccessful: true }),
      makeIncident({ id: "i2", deEscalationAttempted: true, deEscalationSuccessful: false }),
      makeIncident({ id: "i3", deEscalationAttempted: true, deEscalationSuccessful: true }),
      makeIncident({ id: "i4", deEscalationAttempted: false }),
    ];
    const result = calculateHomeBehaviourMetrics(incidents, [], [], "home-oak", NOW);
    expect(result.deEscalationSuccessRate).toBe(67); // 2/3
  });

  it("calculates restraint debrief compliance", () => {
    const incidents = [
      makeIncident({ restraintUsed: true, restraintDebriefChild: true, restraintDebriefStaff: true }),
      makeIncident({ id: "i2", restraintUsed: true, restraintDebriefChild: true, restraintDebriefStaff: true }),
      makeIncident({ id: "i3", restraintUsed: true, restraintDebriefChild: false, restraintDebriefStaff: true }),
    ];
    const result = calculateHomeBehaviourMetrics(incidents, [], [], "home-oak", NOW);
    expect(result.debriefComplianceRate).toBe(67);
  });

  it("identifies children of concern", () => {
    const incidents = Array.from({ length: 7 }, (_, i) =>
      makeIncident({ id: `i${i}`, date: `2026-05-${String(i + 5).padStart(2, "0")}T10:00:00Z` })
    );
    const result = calculateHomeBehaviourMetrics(incidents, [], [], "home-oak", NOW);
    expect(result.childrenOfConcern.length).toBeGreaterThanOrEqual(1);
    expect(result.childrenOfConcern[0].childName).toBe("Jordan Williams");
  });

  it("calculates support plan compliance", () => {
    const plans = [
      makePlan({ childId: "child-001", isActive: true, reviewDate: "2026-06-01T00:00:00Z" }),
      makePlan({ id: "bsp-002", childId: "child-002", isActive: true, reviewDate: "2026-02-01T00:00:00Z", lastReviewedAt: "2026-01-01T00:00:00Z" }),
    ];
    const result = calculateHomeBehaviourMetrics([], [], plans, "home-oak", NOW);
    expect(result.supportPlanComplianceRate).toBe(50); // 1 of 2 current
  });

  it("calculates child voice in plans", () => {
    const plans = [
      makePlan({ childContributed: true }),
      makePlan({ id: "bsp-002", childId: "child-002", childContributed: false }),
      makePlan({ id: "bsp-003", childId: "child-003", childContributed: true }),
    ];
    const result = calculateHomeBehaviourMetrics([], [], plans, "home-oak", NOW);
    expect(result.childVoiceInPlans).toBe(67);
  });

  it("filters by homeId", () => {
    const incidents = [
      makeIncident({ homeId: "home-oak" }),
      makeIncident({ id: "i2", homeId: "home-other" }),
    ];
    const result = calculateHomeBehaviourMetrics(incidents, [], [], "home-oak", NOW);
    expect(result.totalIncidents).toBe(1);
  });

  it("identifies common triggers across home", () => {
    const incidents = [
      makeIncident({ id: "i1", triggers: ["transitions", "hunger"] }),
      makeIncident({ id: "i2", triggers: ["transitions", "tiredness"] }),
      makeIncident({ id: "i3", triggers: ["peer_conflict", "transitions"] }),
    ];
    const result = calculateHomeBehaviourMetrics(incidents, [], [], "home-oak", NOW);
    expect(result.commonTriggers[0]).toBe("transitions");
  });

  it("tracks top interventions used", () => {
    const incidents = [
      makeIncident({ id: "i1", interventionsUsed: ["verbal_reassurance", "offer_space"] }),
      makeIncident({ id: "i2", interventionsUsed: ["verbal_reassurance", "distraction"] }),
      makeIncident({ id: "i3", interventionsUsed: ["offer_space", "verbal_reassurance"] }),
    ];
    const result = calculateHomeBehaviourMetrics(incidents, [], [], "home-oak", NOW);
    expect(result.topInterventions[0].type).toBe("verbal_reassurance");
    expect(result.topInterventions[0].count).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Helper Tests
// ══════════════════════════════════════════════════════════════════════════════

describe("Helper functions", () => {
  it("getSeverityLabel returns readable labels", () => {
    expect(getSeverityLabel("low")).toBe("Low");
    expect(getSeverityLabel("critical")).toBe("Critical");
  });

  it("getBehaviourTypeLabel returns readable labels", () => {
    expect(getBehaviourTypeLabel("verbal_aggression")).toBe("Verbal Aggression");
    expect(getBehaviourTypeLabel("self_harm")).toBe("Self-Harm");
  });

  it("getInterventionLabel returns readable labels", () => {
    expect(getInterventionLabel("de_escalation_script")).toBe("De-escalation Script");
    expect(getInterventionLabel("repair_conversation")).toBe("Repair Conversation");
  });
});
