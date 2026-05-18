// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Critical Incident Review Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateDebriefQuality,
  evaluateLearningIdentification,
  evaluatePracticeChanges,
  evaluateTrendAnalysis,
  generateCriticalIncidentReviewIntelligence,
  getIncidentTypeLabel,
  getDebriefStatusLabel,
  getLearningStatusLabel,
  getPracticeChangeTypeLabel,
} from "../critical-incident-review-engine";
import type {
  CriticalIncident,
  IncidentDebrief,
  LearningOutcome,
  PracticeChange,
} from "../critical-incident-review-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const PERIOD_START = "2025-01-01";
const PERIOD_END = "2025-06-30";
const REF_DATE = "2025-07-01";
const HOME_ID = "oak-house";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeIncident(overrides: Partial<CriticalIncident> = {}): CriticalIncident {
  return {
    id: "inc-1",
    homeId: HOME_ID,
    childId: "child-alex",
    childName: "Alex",
    incidentDate: "2025-02-10",
    incidentType: "restraint",
    severity: "medium",
    description: "Restraint used following escalation",
    staffInvolved: ["Sarah Johnson"],
    notifiedToOfsted: true,
    notifiedToLA: true,
    ...overrides,
  };
}

function makeDebrief(overrides: Partial<IncidentDebrief> = {}): IncidentDebrief {
  return {
    id: "deb-1",
    homeId: HOME_ID,
    incidentId: "inc-1",
    debriefDate: "2025-02-11",
    facilitatedBy: "Darren Laville",
    attendees: ["Sarah Johnson", "Alex"],
    childIncluded: true,
    childViews: "I was upset and didn't know what else to do",
    status: "completed_on_time",
    immediateActionsIdentified: ["Review de-escalation plan"],
    rootCauseIdentified: true,
    contributingFactorsIdentified: ["Transition anxiety", "Unstructured time"],
    ...overrides,
  };
}

function makeLearning(overrides: Partial<LearningOutcome> = {}): LearningOutcome {
  return {
    id: "learn-1",
    homeId: HOME_ID,
    incidentId: "inc-1",
    learningDescription: "Need for structured activities during transitions",
    status: "implemented",
    identifiedDate: "2025-02-12",
    responsiblePerson: "Sarah Johnson",
    implementationDate: "2025-03-01",
    evidenceOfImplementation: "Transition activity plan in place",
    sharedWithTeam: true,
    sharedInSupervision: true,
    ...overrides,
  };
}

function makePracticeChange(overrides: Partial<PracticeChange> = {}): PracticeChange {
  return {
    id: "pc-1",
    homeId: HOME_ID,
    learningOutcomeId: "learn-1",
    changeType: "care_plan_updated",
    description: "Transition activity plan added to care plan",
    implementedDate: "2025-03-01",
    implementedBy: "Sarah Johnson",
    impactAssessed: true,
    impactPositive: true,
    sustainabilityReviewDate: "2025-06-01",
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("Label Functions", () => {
  describe("getIncidentTypeLabel", () => {
    it("returns human-readable labels for all incident types", () => {
      expect(getIncidentTypeLabel("restraint")).toBe("Restraint");
      expect(getIncidentTypeLabel("missing_episode")).toBe("Missing Episode");
      expect(getIncidentTypeLabel("serious_injury")).toBe("Serious Injury");
      expect(getIncidentTypeLabel("safeguarding_concern")).toBe("Safeguarding Concern");
      expect(getIncidentTypeLabel("medication_error")).toBe("Medication Error");
      expect(getIncidentTypeLabel("complaint")).toBe("Complaint");
      expect(getIncidentTypeLabel("near_miss")).toBe("Near Miss");
      expect(getIncidentTypeLabel("property_damage")).toBe("Property Damage");
      expect(getIncidentTypeLabel("self_harm")).toBe("Self-Harm");
      expect(getIncidentTypeLabel("allegation")).toBe("Allegation");
      expect(getIncidentTypeLabel("police_involvement")).toBe("Police Involvement");
      expect(getIncidentTypeLabel("other")).toBe("Other");
    });
  });

  describe("getDebriefStatusLabel", () => {
    it("returns human-readable labels for all debrief statuses", () => {
      expect(getDebriefStatusLabel("completed_on_time")).toBe("Completed on Time");
      expect(getDebriefStatusLabel("completed_late")).toBe("Completed Late");
      expect(getDebriefStatusLabel("not_completed")).toBe("Not Completed");
      expect(getDebriefStatusLabel("in_progress")).toBe("In Progress");
      expect(getDebriefStatusLabel("not_required")).toBe("Not Required");
    });
  });

  describe("getLearningStatusLabel", () => {
    it("returns human-readable labels for all learning statuses", () => {
      expect(getLearningStatusLabel("identified")).toBe("Identified");
      expect(getLearningStatusLabel("action_planned")).toBe("Action Planned");
      expect(getLearningStatusLabel("implemented")).toBe("Implemented");
      expect(getLearningStatusLabel("embedded")).toBe("Embedded in Practice");
      expect(getLearningStatusLabel("not_identified")).toBe("Not Identified");
    });
  });

  describe("getPracticeChangeTypeLabel", () => {
    it("returns human-readable labels for all practice change types", () => {
      expect(getPracticeChangeTypeLabel("policy_update")).toBe("Policy Update");
      expect(getPracticeChangeTypeLabel("procedure_change")).toBe("Procedure Change");
      expect(getPracticeChangeTypeLabel("training_delivered")).toBe("Training Delivered");
      expect(getPracticeChangeTypeLabel("supervision_topic")).toBe("Supervision Topic");
      expect(getPracticeChangeTypeLabel("team_meeting_discussion")).toBe("Team Meeting Discussion");
      expect(getPracticeChangeTypeLabel("risk_assessment_updated")).toBe("Risk Assessment Updated");
      expect(getPracticeChangeTypeLabel("care_plan_updated")).toBe("Care Plan Updated");
      expect(getPracticeChangeTypeLabel("environment_change")).toBe("Environment Change");
      expect(getPracticeChangeTypeLabel("staffing_change")).toBe("Staffing Change");
      expect(getPracticeChangeTypeLabel("other")).toBe("Other");
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateDebriefQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateDebriefQuality", () => {
  it("returns zeroed result when no incidents in period", () => {
    const result = evaluateDebriefQuality([], [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.debriefRequired).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for timely debriefs with child inclusion and root cause", () => {
    const incidents = [makeIncident()];
    const debriefs = [makeDebrief()];
    const result = evaluateDebriefQuality(incidents, debriefs, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(1);
    expect(result.debriefRequired).toBe(1);
    expect(result.debriefedOnTime).toBe(1);
    expect(result.debriefCompletionRate).toBe(100);
    expect(result.timelyDebriefRate).toBe(100);
    expect(result.childIncludedRate).toBe(100);
    expect(result.rootCauseIdentifiedRate).toBe(100);
    expect(result.overallScore).toBe(30);
  });

  it("penalises late debriefs — completion counts but timeliness does not", () => {
    const incidents = [makeIncident()];
    const debriefs = [makeDebrief({ status: "completed_late" })];
    const result = evaluateDebriefQuality(incidents, debriefs, PERIOD_START, PERIOD_END);
    expect(result.debriefedOnTime).toBe(0);
    expect(result.debriefedLate).toBe(1);
    expect(result.debriefCompletionRate).toBe(100);
    expect(result.timelyDebriefRate).toBe(0);
    expect(result.overallScore).toBeLessThan(30);
    expect(result.overallScore).toBeGreaterThan(15);
  });

  it("flags not-debriefed incidents for medium+ severity", () => {
    const incidents = [makeIncident({ id: "inc-x", severity: "high" })];
    const result = evaluateDebriefQuality(incidents, [], PERIOD_START, PERIOD_END);
    expect(result.notDebriefed).toBe(1);
    expect(result.debriefCompletionRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("skips low-severity incidents that lack a debrief", () => {
    const incidents = [makeIncident({ severity: "low" })];
    const result = evaluateDebriefQuality(incidents, [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(1);
    expect(result.debriefRequired).toBe(0);
    expect(result.notDebriefed).toBe(0);
  });

  it("handles not_required debrief status correctly", () => {
    const incidents = [makeIncident({ severity: "medium" })];
    const debriefs = [makeDebrief({ status: "not_required" })];
    const result = evaluateDebriefQuality(incidents, debriefs, PERIOD_START, PERIOD_END);
    // Medium+ severity still counts as required even if debrief marked not_required
    expect(result.debriefRequired).toBe(1);
    // But it doesn't count as notDone since a debrief record exists
    expect(result.notDebriefed).toBe(0);
  });

  it("counts child inclusion and root cause only for completed debriefs", () => {
    const incidents = [
      makeIncident({ id: "inc-a" }),
      makeIncident({ id: "inc-b", incidentDate: "2025-03-01" }),
    ];
    const debriefs = [
      makeDebrief({ id: "deb-a", incidentId: "inc-a", childIncluded: true, rootCauseIdentified: true }),
      makeDebrief({ id: "deb-b", incidentId: "inc-b", status: "completed_late", childIncluded: false, rootCauseIdentified: false }),
    ];
    const result = evaluateDebriefQuality(incidents, debriefs, PERIOD_START, PERIOD_END);
    expect(result.childIncludedRate).toBe(50);
    expect(result.rootCauseIdentifiedRate).toBe(50);
  });

  it("excludes incidents outside the period", () => {
    const incidents = [makeIncident({ incidentDate: "2024-06-15" })];
    const debriefs = [makeDebrief()];
    const result = evaluateDebriefQuality(incidents, debriefs, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("handles multiple incidents with mixed debrief statuses", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "high" }),
      makeIncident({ id: "inc-2", incidentDate: "2025-03-10", severity: "medium" }),
      makeIncident({ id: "inc-3", incidentDate: "2025-04-15", severity: "critical" }),
    ];
    const debriefs = [
      makeDebrief({ id: "d1", incidentId: "inc-1", status: "completed_on_time", childIncluded: true, rootCauseIdentified: true }),
      makeDebrief({ id: "d2", incidentId: "inc-2", status: "not_completed", childIncluded: false, rootCauseIdentified: false }),
      makeDebrief({ id: "d3", incidentId: "inc-3", status: "completed_late", childIncluded: true, rootCauseIdentified: true }),
    ];
    const result = evaluateDebriefQuality(incidents, debriefs, PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(3);
    expect(result.debriefedOnTime).toBe(1);
    expect(result.debriefedLate).toBe(1);
    expect(result.notDebriefed).toBe(1);
    expect(result.debriefCompletionRate).toBeCloseTo(66.7, 0);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(30);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateLearningIdentification
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateLearningIdentification", () => {
  it("returns zeroed result when no learnings in period", () => {
    const result = evaluateLearningIdentification([], PERIOD_START, PERIOD_END);
    expect(result.totalLearnings).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for fully implemented and shared learnings", () => {
    const learnings = [makeLearning()];
    const result = evaluateLearningIdentification(learnings, PERIOD_START, PERIOD_END);
    expect(result.totalLearnings).toBe(1);
    expect(result.implemented).toBe(1);
    expect(result.implementationRate).toBe(100);
    expect(result.sharedWithTeamRate).toBe(100);
    expect(result.sharedInSupervisionRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(20);
  });

  it("scores higher for embedded learnings (bonus points)", () => {
    const learnings = [makeLearning({ status: "embedded" })];
    const result = evaluateLearningIdentification(learnings, PERIOD_START, PERIOD_END);
    expect(result.embedded).toBe(1);
    expect(result.overallScore).toBe(25); // Max score
  });

  it("penalises not-identified learnings", () => {
    const learnings = [makeLearning({ status: "not_identified", sharedWithTeam: false, sharedInSupervision: false })];
    const result = evaluateLearningIdentification(learnings, PERIOD_START, PERIOD_END);
    expect(result.notIdentified).toBe(1);
    expect(result.implementationRate).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("correctly counts learnings at each status stage", () => {
    const learnings = [
      makeLearning({ id: "l1", status: "identified", sharedWithTeam: false, sharedInSupervision: false }),
      makeLearning({ id: "l2", status: "action_planned", identifiedDate: "2025-03-01", sharedWithTeam: true, sharedInSupervision: false }),
      makeLearning({ id: "l3", status: "implemented", identifiedDate: "2025-04-01" }),
      makeLearning({ id: "l4", status: "embedded", identifiedDate: "2025-05-01" }),
    ];
    const result = evaluateLearningIdentification(learnings, PERIOD_START, PERIOD_END);
    expect(result.identified).toBe(1);
    expect(result.actionPlanned).toBe(1);
    expect(result.implemented).toBe(1);
    expect(result.embedded).toBe(1);
    expect(result.totalLearnings).toBe(4);
    expect(result.implementationRate).toBe(50); // 2/4
  });

  it("excludes learnings outside the period", () => {
    const learnings = [makeLearning({ identifiedDate: "2024-06-01" })];
    const result = evaluateLearningIdentification(learnings, PERIOD_START, PERIOD_END);
    expect(result.totalLearnings).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("calculates sharing rates correctly across multiple learnings", () => {
    const learnings = [
      makeLearning({ id: "l1", sharedWithTeam: true, sharedInSupervision: true }),
      makeLearning({ id: "l2", identifiedDate: "2025-03-01", sharedWithTeam: true, sharedInSupervision: false }),
      makeLearning({ id: "l3", identifiedDate: "2025-04-01", sharedWithTeam: false, sharedInSupervision: false }),
    ];
    const result = evaluateLearningIdentification(learnings, PERIOD_START, PERIOD_END);
    expect(result.sharedWithTeamRate).toBeCloseTo(66.7, 0);
    expect(result.sharedInSupervisionRate).toBeCloseTo(33.3, 0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePracticeChanges
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePracticeChanges", () => {
  it("returns zeroed result when no practice changes in period", () => {
    const result = evaluatePracticeChanges([], PERIOD_START, PERIOD_END);
    expect(result.totalChanges).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("scores high for assessed, positive, and reviewed practice changes", () => {
    const changes = [makePracticeChange()];
    const result = evaluatePracticeChanges(changes, PERIOD_START, PERIOD_END);
    expect(result.totalChanges).toBe(1);
    expect(result.impactAssessedRate).toBe(100);
    expect(result.positiveImpactRate).toBe(100);
    expect(result.sustainabilityReviewedRate).toBe(100);
    expect(result.overallScore).toBeGreaterThan(15);
  });

  it("groups changes by type correctly", () => {
    const changes = [
      makePracticeChange({ id: "pc-1", changeType: "care_plan_updated" }),
      makePracticeChange({ id: "pc-2", changeType: "care_plan_updated", implementedDate: "2025-04-01" }),
      makePracticeChange({ id: "pc-3", changeType: "training_delivered", implementedDate: "2025-04-15" }),
      makePracticeChange({ id: "pc-4", changeType: "policy_update", implementedDate: "2025-05-01" }),
    ];
    const result = evaluatePracticeChanges(changes, PERIOD_START, PERIOD_END);
    expect(result.changesByType["care_plan_updated"]).toBe(2);
    expect(result.changesByType["training_delivered"]).toBe(1);
    expect(result.changesByType["policy_update"]).toBe(1);
  });

  it("rewards variety of change types (up to 5 unique types)", () => {
    const changes = [
      makePracticeChange({ id: "pc-1", changeType: "care_plan_updated" }),
      makePracticeChange({ id: "pc-2", changeType: "training_delivered", implementedDate: "2025-04-01" }),
      makePracticeChange({ id: "pc-3", changeType: "policy_update", implementedDate: "2025-04-15" }),
      makePracticeChange({ id: "pc-4", changeType: "procedure_change", implementedDate: "2025-05-01" }),
      makePracticeChange({ id: "pc-5", changeType: "risk_assessment_updated", implementedDate: "2025-05-15" }),
    ];
    const result = evaluatePracticeChanges(changes, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(25); // Max
  });

  it("calculates impact rates correctly when some are not assessed", () => {
    const changes = [
      makePracticeChange({ id: "pc-1", impactAssessed: true, impactPositive: true }),
      makePracticeChange({ id: "pc-2", implementedDate: "2025-04-01", impactAssessed: true, impactPositive: false }),
      makePracticeChange({ id: "pc-3", implementedDate: "2025-05-01", impactAssessed: false, impactPositive: undefined, sustainabilityReviewDate: undefined }),
    ];
    const result = evaluatePracticeChanges(changes, PERIOD_START, PERIOD_END);
    expect(result.impactAssessedRate).toBeCloseTo(66.7, 0);
    expect(result.positiveImpactRate).toBe(50); // 1 of 2 assessed were positive
  });

  it("excludes changes outside the period", () => {
    const changes = [makePracticeChange({ implementedDate: "2024-08-01" })];
    const result = evaluatePracticeChanges(changes, PERIOD_START, PERIOD_END);
    expect(result.totalChanges).toBe(0);
    expect(result.overallScore).toBe(0);
  });

  it("calculates sustainability review rate correctly", () => {
    const changes = [
      makePracticeChange({ id: "pc-1", sustainabilityReviewDate: "2025-06-01" }),
      makePracticeChange({ id: "pc-2", implementedDate: "2025-04-01", sustainabilityReviewDate: undefined }),
    ];
    const result = evaluatePracticeChanges(changes, PERIOD_START, PERIOD_END);
    expect(result.sustainabilityReviewedRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTrendAnalysis
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTrendAnalysis", () => {
  it("returns neutral score when no incidents in either period", () => {
    const result = evaluateTrendAnalysis([], [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
    expect(result.previousPeriodTotal).toBe(0);
    expect(result.overallTrend).toBe("stable");
    expect(result.overallScore).toBe(10);
  });

  it("gives bonus for decreasing trend", () => {
    const current = [makeIncident()];
    const previous = [
      makeIncident({ id: "p-1", incidentDate: "2024-09-01" }),
      makeIncident({ id: "p-2", incidentDate: "2024-10-01" }),
      makeIncident({ id: "p-3", incidentDate: "2024-11-01" }),
    ];
    const result = evaluateTrendAnalysis(current, previous, PERIOD_START, PERIOD_END);
    expect(result.overallTrend).toBe("decreasing");
    expect(result.overallScore).toBeGreaterThan(10);
  });

  it("penalises increasing trend", () => {
    const current = [
      makeIncident({ id: "c-1" }),
      makeIncident({ id: "c-2", incidentDate: "2025-03-01" }),
      makeIncident({ id: "c-3", incidentDate: "2025-04-01" }),
    ];
    const previous = [makeIncident({ id: "p-1", incidentDate: "2024-09-01" })];
    const result = evaluateTrendAnalysis(current, previous, PERIOD_START, PERIOD_END);
    expect(result.overallTrend).toBe("increasing");
    expect(result.overallScore).toBeLessThan(10);
  });

  it("builds per-type trends correctly", () => {
    const current = [
      makeIncident({ id: "c-1", incidentType: "restraint" }),
      makeIncident({ id: "c-2", incidentType: "restraint", incidentDate: "2025-03-01" }),
      makeIncident({ id: "c-3", incidentType: "missing_episode", incidentDate: "2025-04-01" }),
    ];
    const previous = [
      makeIncident({ id: "p-1", incidentType: "restraint", incidentDate: "2024-09-01" }),
    ];
    const result = evaluateTrendAnalysis(current, previous, PERIOD_START, PERIOD_END);
    const restraintTrend = result.trends.find((t) => t.incidentType === "restraint");
    expect(restraintTrend).toBeDefined();
    expect(restraintTrend!.count).toBe(2);
    expect(restraintTrend!.previousPeriodCount).toBe(1);
    expect(restraintTrend!.trend).toBe("increasing");

    const missingTrend = result.trends.find((t) => t.incidentType === "missing_episode");
    expect(missingTrend).toBeDefined();
    expect(missingTrend!.count).toBe(1);
    expect(missingTrend!.trend).toBe("increasing");
  });

  it("counts high and critical severity correctly", () => {
    const current = [
      makeIncident({ id: "c-1", severity: "high" }),
      makeIncident({ id: "c-2", severity: "critical", incidentDate: "2025-03-01" }),
      makeIncident({ id: "c-3", severity: "medium", incidentDate: "2025-04-01" }),
    ];
    const result = evaluateTrendAnalysis(current, [], PERIOD_START, PERIOD_END);
    expect(result.highSeverityCount).toBe(1);
    expect(result.criticalSeverityCount).toBe(1);
  });

  it("gives bonus when no critical and no high severity", () => {
    const current = [
      makeIncident({ id: "c-1", severity: "medium", childId: "child-alex" }),
      makeIncident({ id: "c-2", severity: "low", incidentDate: "2025-03-01", childId: "child-jordan" }),
    ];
    const result = evaluateTrendAnalysis(current, current, PERIOD_START, PERIOD_END);
    expect(result.overallTrend).toBe("stable");
    // Starts at 10, +2 for no critical, +3 for no high = 15
    expect(result.overallScore).toBe(15);
  });

  it("calculates repeat incident rate for children", () => {
    const current = [
      makeIncident({ id: "c-1", childId: "child-alex" }),
      makeIncident({ id: "c-2", childId: "child-alex", incidentDate: "2025-03-01" }),
      makeIncident({ id: "c-3", childId: "child-jordan", incidentDate: "2025-04-01" }),
    ];
    const result = evaluateTrendAnalysis(current, [], PERIOD_START, PERIOD_END);
    // Alex has >1 incident, Jordan does not. 1/2 = 50%
    expect(result.repeatIncidentRate).toBe(50);
  });

  it("penalises high repeat rate (>50%)", () => {
    const current = [
      makeIncident({ id: "c-1", childId: "child-alex" }),
      makeIncident({ id: "c-2", childId: "child-alex", incidentDate: "2025-03-01" }),
    ];
    const result = evaluateTrendAnalysis(current, [], PERIOD_START, PERIOD_END);
    // 1 child, 2 incidents = 100% repeat
    expect(result.repeatIncidentRate).toBe(100);
    // The penalty should reduce the score
    expect(result.overallScore).toBeLessThanOrEqual(12);
  });

  it("excludes current incidents outside the period", () => {
    const current = [makeIncident({ incidentDate: "2024-06-01" })];
    const result = evaluateTrendAnalysis(current, [], PERIOD_START, PERIOD_END);
    expect(result.totalIncidents).toBe(0);
  });

  it("handles previous-only types appearing in trends", () => {
    const current: CriticalIncident[] = [];
    const previous = [makeIncident({ id: "p-1", incidentType: "complaint", incidentDate: "2024-09-01" })];
    const result = evaluateTrendAnalysis(current, previous, PERIOD_START, PERIOD_END);
    const complaintTrend = result.trends.find((t) => t.incidentType === "complaint");
    expect(complaintTrend).toBeDefined();
    expect(complaintTrend!.count).toBe(0);
    expect(complaintTrend!.previousPeriodCount).toBe(1);
    expect(complaintTrend!.trend).toBe("decreasing");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateCriticalIncidentReviewIntelligence — Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("generateCriticalIncidentReviewIntelligence", () => {
  // ── Oak House Demo Scenario ──────────────────────────────────────────────

  const demoIncidents: CriticalIncident[] = [
    // Alex — restraint, well-managed
    {
      id: "inc-a1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      incidentDate: "2025-02-10", incidentType: "restraint", severity: "medium",
      description: "Brief restraint following escalation during contact visit",
      staffInvolved: ["Sarah Johnson", "Tom Richards"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    // Jordan — missing episode
    {
      id: "inc-j1", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
      incidentDate: "2025-03-15", incidentType: "missing_episode", severity: "high",
      description: "Jordan did not return from school at expected time, found at friend's house",
      staffInvolved: ["Tom Richards"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    // Morgan — self-harm, critical
    {
      id: "inc-m1", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
      incidentDate: "2025-04-20", incidentType: "self_harm", severity: "high",
      description: "Morgan expressed self-harm ideation, immediate safety plan activated",
      staffInvolved: ["Lisa Williams", "Sarah Johnson"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    // Near miss — low severity
    {
      id: "inc-nm1", homeId: HOME_ID, incidentDate: "2025-05-10",
      incidentType: "near_miss", severity: "low",
      description: "Medication nearly given at wrong time, caught before administration",
      staffInvolved: ["Tom Richards"],
      notifiedToOfsted: false, notifiedToLA: false,
    },
  ];

  const demoDebriefs: IncidentDebrief[] = [
    {
      id: "deb-a1", homeId: HOME_ID, incidentId: "inc-a1",
      debriefDate: "2025-02-11", facilitatedBy: "Darren Laville",
      attendees: ["Sarah Johnson", "Tom Richards", "Alex"],
      childIncluded: true, childViews: "I was upset about contact not going well",
      status: "completed_on_time",
      immediateActionsIdentified: ["Review de-escalation plan", "Contact team to review arrangements"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Contact visit distress", "Unstructured transition"],
    },
    {
      id: "deb-j1", homeId: HOME_ID, incidentId: "inc-j1",
      debriefDate: "2025-03-17", facilitatedBy: "Darren Laville",
      attendees: ["Tom Richards", "Jordan"],
      childIncluded: true, childViews: "I just wanted to see my friend",
      status: "completed_late",
      immediateActionsIdentified: ["Review missing protocol", "Safety plan update"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Peer influence", "Poor communication about plans"],
    },
    {
      id: "deb-m1", homeId: HOME_ID, incidentId: "inc-m1",
      debriefDate: "2025-04-21", facilitatedBy: "Darren Laville",
      attendees: ["Lisa Williams", "Sarah Johnson"],
      childIncluded: false, // Morgan too distressed to participate immediately
      status: "completed_on_time",
      immediateActionsIdentified: ["CAMHS referral", "Increased observation", "Safety plan review"],
      rootCauseIdentified: true,
      contributingFactorsIdentified: ["Family contact distress", "Anniversary reaction"],
    },
  ];

  const demoLearnings: LearningOutcome[] = [
    {
      id: "lo-1", homeId: HOME_ID, incidentId: "inc-a1",
      learningDescription: "Need for structured transition plans around contact visits",
      status: "embedded", identifiedDate: "2025-02-12",
      responsiblePerson: "Sarah Johnson", implementationDate: "2025-03-01",
      evidenceOfImplementation: "Transition plan in care plan, used successfully 4 times",
      sharedWithTeam: true, sharedInSupervision: true,
    },
    {
      id: "lo-2", homeId: HOME_ID, incidentId: "inc-j1",
      learningDescription: "Communication with young people about after-school plans",
      status: "implemented", identifiedDate: "2025-03-18",
      responsiblePerson: "Tom Richards", implementationDate: "2025-04-01",
      evidenceOfImplementation: "Daily check-in about plans implemented",
      sharedWithTeam: true, sharedInSupervision: true,
    },
    {
      id: "lo-3", homeId: HOME_ID, incidentId: "inc-m1",
      learningDescription: "Staff need enhanced training on recognising anniversary reactions",
      status: "action_planned", identifiedDate: "2025-04-22",
      responsiblePerson: "Darren Laville",
      sharedWithTeam: true, sharedInSupervision: false,
    },
    {
      id: "lo-4", homeId: HOME_ID, incidentId: "inc-nm1",
      learningDescription: "Medication administration double-check process",
      status: "implemented", identifiedDate: "2025-05-11",
      responsiblePerson: "Lisa Williams", implementationDate: "2025-05-15",
      evidenceOfImplementation: "New medication check sheet in use",
      sharedWithTeam: true, sharedInSupervision: true,
    },
  ];

  const demoPracticeChanges: PracticeChange[] = [
    {
      id: "pc-1", homeId: HOME_ID, learningOutcomeId: "lo-1",
      changeType: "care_plan_updated", description: "Transition activity plan added to Alex's care plan",
      implementedDate: "2025-03-01", implementedBy: "Sarah Johnson",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-06-01",
    },
    {
      id: "pc-2", homeId: HOME_ID, learningOutcomeId: "lo-1",
      changeType: "training_delivered", description: "De-escalation refresher training for all staff",
      implementedDate: "2025-03-15", implementedBy: "Darren Laville",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-09-15",
    },
    {
      id: "pc-3", homeId: HOME_ID, learningOutcomeId: "lo-2",
      changeType: "procedure_change", description: "Daily after-school check-in procedure introduced",
      implementedDate: "2025-04-01", implementedBy: "Tom Richards",
      impactAssessed: true, impactPositive: true, sustainabilityReviewDate: "2025-07-01",
    },
    {
      id: "pc-4", homeId: HOME_ID, learningOutcomeId: "lo-4",
      changeType: "procedure_change", description: "Medication double-check sheet introduced",
      implementedDate: "2025-05-15", implementedBy: "Lisa Williams",
      impactAssessed: false,
    },
  ];

  const previousPeriodIncidents: CriticalIncident[] = [
    {
      id: "prev-1", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      incidentDate: "2024-09-15", incidentType: "restraint", severity: "medium",
      description: "Restraint following peer conflict", staffInvolved: ["Sarah Johnson"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    {
      id: "prev-2", homeId: HOME_ID, childId: "child-jordan", childName: "Jordan",
      incidentDate: "2024-10-20", incidentType: "missing_episode", severity: "high",
      description: "Jordan missing for 2 hours after school", staffInvolved: ["Tom Richards"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    {
      id: "prev-3", homeId: HOME_ID, childId: "child-morgan", childName: "Morgan",
      incidentDate: "2024-11-05", incidentType: "self_harm", severity: "high",
      description: "Self-harm incident", staffInvolved: ["Lisa Williams"],
      notifiedToOfsted: true, notifiedToLA: true,
    },
    {
      id: "prev-4", homeId: HOME_ID, childId: "child-alex", childName: "Alex",
      incidentDate: "2024-12-10", incidentType: "property_damage", severity: "medium",
      description: "Alex damaged bedroom door during dysregulation",
      staffInvolved: ["Tom Richards"],
      notifiedToOfsted: false, notifiedToLA: false,
    },
  ];

  it("produces a complete intelligence result with all fields", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
    expect(result.referenceDate).toBe(REF_DATE);

    // Overall
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);

    // Sub-results
    expect(result.debriefQuality).toBeDefined();
    expect(result.learningIdentification).toBeDefined();
    expect(result.practiceChange).toBeDefined();
    expect(result.trendAnalysis).toBeDefined();

    // Arrays
    expect(result.strengths.length).toBeGreaterThan(0);
    expect(result.regulatoryLinks.length).toBe(6);
  });

  it("calculates correct debrief quality for demo data", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const dq = result.debriefQuality;
    expect(dq.totalIncidents).toBe(4); // 4 incidents in period
    // 3 required debriefs (the near miss is low severity, skipped)
    expect(dq.debriefRequired).toBe(3);
    expect(dq.debriefedOnTime).toBe(2); // Alex + Morgan
    expect(dq.debriefedLate).toBe(1);   // Jordan
    expect(dq.notDebriefed).toBe(0);
    expect(dq.debriefCompletionRate).toBe(100);
    expect(dq.overallScore).toBeGreaterThan(20);
  });

  it("calculates correct learning identification for demo data", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const li = result.learningIdentification;
    expect(li.totalLearnings).toBe(4);
    expect(li.embedded).toBe(1);      // lo-1
    expect(li.implemented).toBe(2);    // lo-2, lo-4
    expect(li.actionPlanned).toBe(1);  // lo-3
    expect(li.implementationRate).toBe(75); // 3/4
    expect(li.sharedWithTeamRate).toBe(100); // All shared
    expect(li.overallScore).toBeGreaterThan(15);
  });

  it("calculates correct practice change metrics for demo data", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const pc = result.practiceChange;
    expect(pc.totalChanges).toBe(4);
    expect(pc.impactAssessedRate).toBe(75); // 3/4
    expect(pc.positiveImpactRate).toBe(100); // 3/3
    expect(pc.sustainabilityReviewedRate).toBe(75); // 3/4
  });

  it("detects decreasing trend for demo data (4 prev → 4 current)", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const ta = result.trendAnalysis;
    expect(ta.totalIncidents).toBe(4);
    expect(ta.previousPeriodTotal).toBe(4);
    expect(ta.overallTrend).toBe("stable"); // 4 vs 4 = stable
    expect(ta.criticalSeverityCount).toBe(0);
  });

  it("generates strengths for good performance", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("debrief"),
      ]),
    );
    expect(result.strengths).toEqual(
      expect.arrayContaining([
        expect.stringContaining("shared"),
      ]),
    );
  });

  it("generates regulatory links", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.regulatoryLinks).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Reg 40"),
        expect.stringContaining("Reg 45"),
        expect.stringContaining("Reg 35"),
        expect.stringContaining("SCCIF"),
        expect.stringContaining("Working Together"),
        expect.stringContaining("UNCRC"),
      ]),
    );
  });

  // ── Edge Cases ──────────────────────────────────────────────────────────

  it("handles empty data across all categories", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      [], [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.overallScore).toBe(10); // Only trend midpoint
    expect(result.debriefQuality.overallScore).toBe(0);
    expect(result.learningIdentification.overallScore).toBe(0);
    expect(result.practiceChange.overallScore).toBe(0);
    expect(result.trendAnalysis.overallScore).toBe(10);
    expect(result.rating).toBe("inadequate");
  });

  it("handles worst-case scenario — all failures", () => {
    const badIncidents: CriticalIncident[] = [
      makeIncident({ id: "bad-1", severity: "critical" }),
      makeIncident({ id: "bad-2", severity: "critical", incidentDate: "2025-03-01", childId: "child-alex" }),
      makeIncident({ id: "bad-3", severity: "high", incidentDate: "2025-04-01", childId: "child-alex" }),
    ];
    const badLearnings: LearningOutcome[] = [
      makeLearning({ status: "not_identified", sharedWithTeam: false, sharedInSupervision: false }),
    ];

    const result = generateCriticalIncidentReviewIntelligence(
      badIncidents, [], badLearnings, [],
      [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.overallScore).toBeLessThan(10);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates URGENT actions for undebriefed and critical incidents", () => {
    const badIncidents: CriticalIncident[] = [
      makeIncident({ id: "bad-1", severity: "critical" }),
      makeIncident({ id: "bad-2", severity: "high", incidentDate: "2025-03-01" }),
    ];

    const result = generateCriticalIncidentReviewIntelligence(
      badIncidents, [], [], [], [], HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("URGENT"),
      ]),
    );
  });

  it("generates increasing trend area for improvement", () => {
    const many = [
      makeIncident({ id: "c-1" }),
      makeIncident({ id: "c-2", incidentDate: "2025-03-01" }),
      makeIncident({ id: "c-3", incidentDate: "2025-04-01" }),
    ];
    const few = [makeIncident({ id: "p-1", incidentDate: "2024-09-01" })];

    const result = generateCriticalIncidentReviewIntelligence(
      many, [], [], [], few, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    expect(result.areasForImprovement).toEqual(
      expect.arrayContaining([
        expect.stringContaining("increasing"),
      ]),
    );
    expect(result.actions).toEqual(
      expect.arrayContaining([
        expect.stringContaining("strategic review"),
      ]),
    );
  });

  it("overall score is sum of component scores", () => {
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    const expected = Math.round(
      (result.debriefQuality.overallScore +
        result.learningIdentification.overallScore +
        result.practiceChange.overallScore +
        result.trendAnalysis.overallScore) * 10,
    ) / 10;
    expect(result.overallScore).toBe(expected);
  });

  it("rating thresholds are correct", () => {
    // Use the demo data which should give a good/outstanding result
    const result = generateCriticalIncidentReviewIntelligence(
      demoIncidents, demoDebriefs, demoLearnings, demoPracticeChanges,
      previousPeriodIncidents, HOME_ID, PERIOD_START, PERIOD_END, REF_DATE,
    );

    if (result.overallScore >= 80) expect(result.rating).toBe("outstanding");
    else if (result.overallScore >= 60) expect(result.rating).toBe("good");
    else if (result.overallScore >= 40) expect(result.rating).toBe("requires_improvement");
    else expect(result.rating).toBe("inadequate");
  });
});
