// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Incident Pattern Analysis Intelligence Engine Tests
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateIncidentResponse,
  evaluateNotificationCompliance,
  evaluatePatternAnalysis,
  evaluatePostIncident,
  buildChildIncidentProfiles,
  generateIncidentPatternAnalysisIntelligence,
  getRating,
  pct,
  getIncidentCategoryLabel,
  getIncidentSeverityLabel,
  getResponseQualityLabel,
  getNotificationStatusLabel,
  getDeEscalationOutcomeLabel,
  getPostIncidentActionLabel,
  getRatingLabel,
} from "../incident-pattern-analysis-engine";
import type {
  IncidentRecord,
  IncidentTrend,
  StaffResponse,
  PatternIndicator,
  IncidentCategory,
} from "../incident-pattern-analysis-engine";

// ── Shared Constants ───────────────────────────────────────────────────────

const HOME_ID = "oak-house";
const PERIOD_START = "2026-01-01";
const PERIOD_END = "2026-06-30";

// ── Factory Helpers ────────────────────────────────────────────────────────

function makeIncident(overrides: Partial<IncidentRecord> = {}): IncidentRecord {
  return {
    id: "inc-1",
    childId: "child-alex",
    childName: "Alex",
    date: "2026-03-10",
    time: "14:30",
    category: "verbal_aggression",
    severity: "minor",
    description: "Verbal outburst during homework",
    staffPresent: ["Sarah Johnson"],
    responseQuality: "appropriate",
    deEscalationAttempted: true,
    deEscalationOutcome: "successful",
    restraintUsed: false,
    restraintDurationMinutes: null,
    injuryOccurred: false,
    injuryDetails: null,
    notificationStatus: "timely_and_complete",
    postIncidentActions: ["debrief_completed", "support_plan_updated"],
    childDebriefed: true,
    lessonsIdentified: true,
    managersInformed: true,
    ...overrides,
  };
}

function makeTrend(overrides: Partial<IncidentTrend> = {}): IncidentTrend {
  return {
    id: "trend-1",
    childId: "child-alex",
    childName: "Alex",
    periodStart: PERIOD_START,
    periodEnd: PERIOD_END,
    incidentCount: 3,
    predominantCategory: "verbal_aggression",
    escalating: false,
    triggerPatterns: ["transitions", "homework"],
    ...overrides,
  };
}

function makeStaffResponse(overrides: Partial<StaffResponse> = {}): StaffResponse {
  return {
    id: "sr-1",
    incidentId: "inc-1",
    staffId: "staff-001",
    staffName: "Sarah Johnson",
    responseTimeMins: 2,
    appropriateForce: true,
    bodyWornCameraUsed: false,
    reportCompletedTimely: true,
    debriedParticipated: true,
    ...overrides,
  };
}

function makePattern(overrides: Partial<PatternIndicator> = {}): PatternIndicator {
  return {
    id: "pat-1",
    homeId: HOME_ID,
    category: "verbal_aggression",
    frequency: "weekly",
    peakTime: "afternoon",
    environmentalTrigger: "After school transitions",
    seasonalPattern: false,
    ...overrides,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// pct()
// ══════════════════════════════════════════════════════════════════════════════

describe("pct", () => {
  it("should return 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("should return 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("should return 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("should return 50 for half", () => {
    expect(pct(5, 10)).toBe(50);
  });

  it("should round to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating()
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating", () => {
  it("should return outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(90)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
  });

  it("should return good for score >= 60 and < 80", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(70)).toBe("good");
    expect(getRating(79)).toBe("good");
  });

  it("should return requires_improvement for score >= 40 and < 60", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("should return inadequate for score < 40", () => {
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
    expect(getRating(39)).toBe("inadequate");
  });

  it("should handle boundary values exactly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getIncidentCategoryLabel", () => {
  it("should return correct labels for all categories", () => {
    expect(getIncidentCategoryLabel("physical_aggression")).toBe("Physical Aggression");
    expect(getIncidentCategoryLabel("verbal_aggression")).toBe("Verbal Aggression");
    expect(getIncidentCategoryLabel("self_harm")).toBe("Self-Harm");
    expect(getIncidentCategoryLabel("absconding")).toBe("Absconding");
    expect(getIncidentCategoryLabel("property_damage")).toBe("Property Damage");
    expect(getIncidentCategoryLabel("substance_misuse")).toBe("Substance Misuse");
    expect(getIncidentCategoryLabel("sexual_behaviour")).toBe("Sexual Behaviour");
    expect(getIncidentCategoryLabel("online_safety")).toBe("Online Safety");
    expect(getIncidentCategoryLabel("bullying")).toBe("Bullying");
    expect(getIncidentCategoryLabel("criminal_activity")).toBe("Criminal Activity");
  });
});

describe("getIncidentSeverityLabel", () => {
  it("should return correct labels for all severities", () => {
    expect(getIncidentSeverityLabel("critical")).toBe("Critical");
    expect(getIncidentSeverityLabel("major")).toBe("Major");
    expect(getIncidentSeverityLabel("moderate")).toBe("Moderate");
    expect(getIncidentSeverityLabel("minor")).toBe("Minor");
  });
});

describe("getResponseQualityLabel", () => {
  it("should return correct labels for all qualities", () => {
    expect(getResponseQualityLabel("exemplary")).toBe("Exemplary");
    expect(getResponseQualityLabel("appropriate")).toBe("Appropriate");
    expect(getResponseQualityLabel("partially_appropriate")).toBe("Partially Appropriate");
    expect(getResponseQualityLabel("inadequate")).toBe("Inadequate");
  });
});

describe("getNotificationStatusLabel", () => {
  it("should return correct labels for all statuses", () => {
    expect(getNotificationStatusLabel("timely_and_complete")).toBe("Timely & Complete");
    expect(getNotificationStatusLabel("timely_incomplete")).toBe("Timely but Incomplete");
    expect(getNotificationStatusLabel("late")).toBe("Late");
    expect(getNotificationStatusLabel("not_notified")).toBe("Not Notified");
  });
});

describe("getDeEscalationOutcomeLabel", () => {
  it("should return correct labels for all outcomes", () => {
    expect(getDeEscalationOutcomeLabel("successful")).toBe("Successful");
    expect(getDeEscalationOutcomeLabel("partially_successful")).toBe("Partially Successful");
    expect(getDeEscalationOutcomeLabel("unsuccessful")).toBe("Unsuccessful");
    expect(getDeEscalationOutcomeLabel("not_attempted")).toBe("Not Attempted");
  });
});

describe("getPostIncidentActionLabel", () => {
  it("should return correct labels for all actions", () => {
    expect(getPostIncidentActionLabel("debrief_completed")).toBe("Debrief Completed");
    expect(getPostIncidentActionLabel("support_plan_updated")).toBe("Support Plan Updated");
    expect(getPostIncidentActionLabel("medical_attention")).toBe("Medical Attention");
    expect(getPostIncidentActionLabel("external_referral")).toBe("External Referral");
    expect(getPostIncidentActionLabel("no_action")).toBe("No Action Taken");
    expect(getPostIncidentActionLabel("pending")).toBe("Pending");
  });
});

describe("getRatingLabel", () => {
  it("should return correct labels for all ratings", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
    expect(getRatingLabel("good")).toBe("Good");
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateIncidentResponse()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentResponse", () => {
  it("should return max score 25 with empty data", () => {
    const result = evaluateIncidentResponse([], []);
    expect(result.overallScore).toBe(25);
    expect(result.totalIncidents).toBe(0);
    expect(result.criticalIncidentCount).toBe(0);
    expect(result.majorIncidentCount).toBe(0);
    expect(result.responseQualityRate).toBe(0);
    expect(result.deEscalationSuccessRate).toBe(0);
    expect(result.childDebriefRate).toBe(0);
    expect(result.restraintRate).toBe(0);
    expect(result.averageResponseTimeMins).toBe(0);
  });

  it("should score well for a single perfect incident", () => {
    const incidents = [makeIncident()];
    const staffResponses = [makeStaffResponse()];
    const result = evaluateIncidentResponse(incidents, staffResponses);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.totalIncidents).toBe(1);
    expect(result.criticalIncidentCount).toBe(0);
    expect(result.responseQualityRate).toBe(100);
    expect(result.deEscalationSuccessRate).toBe(100);
    expect(result.childDebriefRate).toBe(100);
    expect(result.restraintRate).toBe(0);
    expect(result.averageResponseTimeMins).toBe(2);
  });

  it("should count critical and major incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "critical" }),
      makeIncident({ id: "inc-2", severity: "major" }),
      makeIncident({ id: "inc-3", severity: "moderate" }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.criticalIncidentCount).toBe(1);
    expect(result.majorIncidentCount).toBe(1);
  });

  it("should penalise for critical incidents", () => {
    const baseIncident = makeIncident();
    const criticalIncident = makeIncident({ id: "inc-2", severity: "critical" });
    const baseResult = evaluateIncidentResponse([baseIncident], []);
    const critResult = evaluateIncidentResponse([criticalIncident], []);
    expect(critResult.overallScore).toBeLessThan(baseResult.overallScore);
  });

  it("should penalise for major incidents", () => {
    const baseIncident = makeIncident();
    const majorIncident = makeIncident({ id: "inc-2", severity: "major" });
    const baseResult = evaluateIncidentResponse([baseIncident], []);
    const majorResult = evaluateIncidentResponse([majorIncident], []);
    expect(majorResult.overallScore).toBeLessThan(baseResult.overallScore);
  });

  it("should calculate response quality rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", responseQuality: "exemplary" }),
      makeIncident({ id: "inc-2", responseQuality: "appropriate" }),
      makeIncident({ id: "inc-3", responseQuality: "inadequate" }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.responseQualityRate).toBe(67);
  });

  it("should calculate de-escalation success rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", deEscalationAttempted: true, deEscalationOutcome: "successful" }),
      makeIncident({ id: "inc-2", deEscalationAttempted: true, deEscalationOutcome: "unsuccessful" }),
      makeIncident({ id: "inc-3", deEscalationAttempted: false, deEscalationOutcome: "not_attempted" }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.deEscalationSuccessRate).toBe(50);
  });

  it("should include partially_successful in de-escalation success", () => {
    const incidents = [
      makeIncident({ id: "inc-1", deEscalationAttempted: true, deEscalationOutcome: "partially_successful" }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.deEscalationSuccessRate).toBe(100);
  });

  it("should calculate child debrief rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childDebriefed: true }),
      makeIncident({ id: "inc-2", childDebriefed: false }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.childDebriefRate).toBe(50);
  });

  it("should calculate restraint rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", restraintUsed: true, restraintDurationMinutes: 5 }),
      makeIncident({ id: "inc-2", restraintUsed: false }),
      makeIncident({ id: "inc-3", restraintUsed: false }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.restraintRate).toBe(33);
  });

  it("should calculate average response time from staff responses", () => {
    const staffResponses = [
      makeStaffResponse({ id: "sr-1", responseTimeMins: 2 }),
      makeStaffResponse({ id: "sr-2", responseTimeMins: 6 }),
    ];
    const result = evaluateIncidentResponse([makeIncident()], staffResponses);
    expect(result.averageResponseTimeMins).toBe(4);
  });

  it("should cap score at 25", () => {
    const incidents = [makeIncident()];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("should not go below 0", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "critical", responseQuality: "inadequate", deEscalationAttempted: false, childDebriefed: false, restraintUsed: true }),
      makeIncident({ id: "inc-2", severity: "critical", responseQuality: "inadequate", deEscalationAttempted: false, childDebriefed: false, restraintUsed: true }),
      makeIncident({ id: "inc-3", severity: "critical", responseQuality: "inadequate", deEscalationAttempted: false, childDebriefed: false, restraintUsed: true }),
      makeIncident({ id: "inc-4", severity: "critical", responseQuality: "inadequate", deEscalationAttempted: false, childDebriefed: false, restraintUsed: true }),
      makeIncident({ id: "inc-5", severity: "critical", responseQuality: "inadequate", deEscalationAttempted: false, childDebriefed: false, restraintUsed: true }),
    ];
    const result = evaluateIncidentResponse(incidents, []);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("should score lower with all inadequate responses", () => {
    const good = [makeIncident({ responseQuality: "exemplary" })];
    const bad = [makeIncident({ responseQuality: "inadequate" })];
    const goodResult = evaluateIncidentResponse(good, []);
    const badResult = evaluateIncidentResponse(bad, []);
    expect(badResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("should score lower when restraint is used", () => {
    const noRestraint = [makeIncident({ restraintUsed: false })];
    const withRestraint = [makeIncident({ restraintUsed: true, restraintDurationMinutes: 3 })];
    const noResult = evaluateIncidentResponse(noRestraint, []);
    const withResult = evaluateIncidentResponse(withRestraint, []);
    expect(withResult.overallScore).toBeLessThan(noResult.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateNotificationCompliance()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateNotificationCompliance", () => {
  it("should return max score 25 with empty data", () => {
    const result = evaluateNotificationCompliance([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalNotifiable).toBe(0);
    expect(result.timelyCompleteRate).toBe(0);
    expect(result.lateNotificationCount).toBe(0);
    expect(result.notNotifiedCount).toBe(0);
    expect(result.managersInformedRate).toBe(0);
  });

  it("should score well for all timely and complete notifications", () => {
    const incidents = [
      makeIncident({ id: "inc-1", notificationStatus: "timely_and_complete", managersInformed: true }),
      makeIncident({ id: "inc-2", notificationStatus: "timely_and_complete", managersInformed: true }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.overallScore).toBe(25);
    expect(result.timelyCompleteRate).toBe(100);
    expect(result.managersInformedRate).toBe(100);
    expect(result.lateNotificationCount).toBe(0);
    expect(result.notNotifiedCount).toBe(0);
  });

  it("should count late notifications correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", notificationStatus: "late" }),
      makeIncident({ id: "inc-2", notificationStatus: "late" }),
      makeIncident({ id: "inc-3", notificationStatus: "timely_and_complete" }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.lateNotificationCount).toBe(2);
  });

  it("should count not-notified incidents correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", notificationStatus: "not_notified" }),
      makeIncident({ id: "inc-2", notificationStatus: "timely_and_complete" }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.notNotifiedCount).toBe(1);
  });

  it("should penalise heavily for not-notified incidents", () => {
    const good = [makeIncident({ notificationStatus: "timely_and_complete", managersInformed: true })];
    const bad = [makeIncident({ notificationStatus: "not_notified", managersInformed: false })];
    const goodResult = evaluateNotificationCompliance(good);
    const badResult = evaluateNotificationCompliance(bad);
    expect(badResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("should calculate timely complete rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", notificationStatus: "timely_and_complete" }),
      makeIncident({ id: "inc-2", notificationStatus: "timely_incomplete" }),
      makeIncident({ id: "inc-3", notificationStatus: "late" }),
      makeIncident({ id: "inc-4", notificationStatus: "not_notified" }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.timelyCompleteRate).toBe(25);
    expect(result.totalNotifiable).toBe(4);
  });

  it("should calculate managers informed rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", managersInformed: true }),
      makeIncident({ id: "inc-2", managersInformed: true }),
      makeIncident({ id: "inc-3", managersInformed: false }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.managersInformedRate).toBe(67);
  });

  it("should cap score at 25", () => {
    const incidents = [makeIncident({ notificationStatus: "timely_and_complete", managersInformed: true })];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("should not go below 0 with many not-notified", () => {
    const incidents = [
      makeIncident({ id: "inc-1", notificationStatus: "not_notified", managersInformed: false }),
      makeIncident({ id: "inc-2", notificationStatus: "not_notified", managersInformed: false }),
      makeIncident({ id: "inc-3", notificationStatus: "not_notified", managersInformed: false }),
      makeIncident({ id: "inc-4", notificationStatus: "not_notified", managersInformed: false }),
      makeIncident({ id: "inc-5", notificationStatus: "not_notified", managersInformed: false }),
      makeIncident({ id: "inc-6", notificationStatus: "not_notified", managersInformed: false }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });

  it("should score lower with timely_incomplete than timely_and_complete", () => {
    const complete = [makeIncident({ notificationStatus: "timely_and_complete", managersInformed: true })];
    const incomplete = [makeIncident({ notificationStatus: "timely_incomplete", managersInformed: true })];
    const completeResult = evaluateNotificationCompliance(complete);
    const incompleteResult = evaluateNotificationCompliance(incomplete);
    expect(incompleteResult.overallScore).toBeLessThan(completeResult.overallScore);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePatternAnalysis()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePatternAnalysis", () => {
  it("should return max score 25 with all empty data", () => {
    const result = evaluatePatternAnalysis([], [], []);
    expect(result.overallScore).toBe(25);
    expect(result.trendsAnalysed).toBe(0);
    expect(result.escalatingChildCount).toBe(0);
    expect(result.predominantCategory).toBe("none");
    expect(result.lessonsIdentifiedRate).toBe(0);
    expect(result.triggerPatternsIdentified).toBe(0);
    expect(result.environmentalFactorsCount).toBe(0);
  });

  it("should count trends analysed correctly", () => {
    const trends = [makeTrend({ id: "t1" }), makeTrend({ id: "t2", childId: "child-jordan" })];
    const result = evaluatePatternAnalysis([], trends, []);
    expect(result.trendsAnalysed).toBe(2);
  });

  it("should count escalating children correctly", () => {
    const trends = [
      makeTrend({ id: "t1", escalating: false }),
      makeTrend({ id: "t2", childId: "child-jordan", escalating: true }),
      makeTrend({ id: "t3", childId: "child-morgan", escalating: true }),
    ];
    const result = evaluatePatternAnalysis([], trends, []);
    expect(result.escalatingChildCount).toBe(2);
  });

  it("should penalise for escalating children", () => {
    const noEscalation = [makeTrend({ escalating: false })];
    const withEscalation = [makeTrend({ escalating: true })];
    const noResult = evaluatePatternAnalysis([], noEscalation, []);
    const withResult = evaluatePatternAnalysis([], withEscalation, []);
    expect(withResult.overallScore).toBeLessThan(noResult.overallScore);
  });

  it("should identify the predominant category", () => {
    const incidents = [
      makeIncident({ id: "inc-1", category: "physical_aggression" }),
      makeIncident({ id: "inc-2", category: "physical_aggression" }),
      makeIncident({ id: "inc-3", category: "verbal_aggression" }),
    ];
    const result = evaluatePatternAnalysis(incidents, [], []);
    expect(result.predominantCategory).toBe("physical_aggression");
  });

  it("should return none for predominant category when no incidents", () => {
    const result = evaluatePatternAnalysis([], [makeTrend()], []);
    expect(result.predominantCategory).toBe("none");
  });

  it("should calculate lessons identified rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", lessonsIdentified: true }),
      makeIncident({ id: "inc-2", lessonsIdentified: true }),
      makeIncident({ id: "inc-3", lessonsIdentified: false }),
    ];
    const result = evaluatePatternAnalysis(incidents, [], []);
    expect(result.lessonsIdentifiedRate).toBe(67);
  });

  it("should count unique trigger patterns from trends", () => {
    const trends = [
      makeTrend({ id: "t1", triggerPatterns: ["transitions", "homework"] }),
      makeTrend({ id: "t2", triggerPatterns: ["homework", "peer_conflict"] }),
    ];
    const result = evaluatePatternAnalysis([], trends, []);
    expect(result.triggerPatternsIdentified).toBe(3); // transitions, homework, peer_conflict
  });

  it("should count environmental factors from patterns", () => {
    const patterns = [
      makePattern({ id: "p1", environmentalTrigger: "After school transitions" }),
      makePattern({ id: "p2", environmentalTrigger: "Noisy communal area" }),
      makePattern({ id: "p3", environmentalTrigger: null }),
    ];
    const result = evaluatePatternAnalysis([], [], patterns);
    expect(result.environmentalFactorsCount).toBe(2);
  });

  it("should cap score at 25", () => {
    const incidents = [makeIncident({ lessonsIdentified: true })];
    const trends = [makeTrend({ triggerPatterns: ["a", "b", "c", "d", "e"] })];
    const patterns = [
      makePattern({ id: "p1", environmentalTrigger: "x" }),
      makePattern({ id: "p2", environmentalTrigger: "y" }),
      makePattern({ id: "p3", environmentalTrigger: "z" }),
    ];
    const result = evaluatePatternAnalysis(incidents, trends, patterns);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("should not go below 0", () => {
    const trends = [
      makeTrend({ id: "t1", escalating: true }),
      makeTrend({ id: "t2", escalating: true, childId: "child-2" }),
      makeTrend({ id: "t3", escalating: true, childId: "child-3" }),
      makeTrend({ id: "t4", escalating: true, childId: "child-4" }),
      makeTrend({ id: "t5", escalating: true, childId: "child-5" }),
    ];
    const incidents = [makeIncident({ lessonsIdentified: false })];
    const result = evaluatePatternAnalysis(incidents, trends, []);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePostIncident()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePostIncident", () => {
  it("should return max score 25 with empty data", () => {
    const result = evaluatePostIncident([]);
    expect(result.overallScore).toBe(25);
    expect(result.totalPostIncident).toBe(0);
    expect(result.debriefCompletionRate).toBe(0);
    expect(result.supportPlanUpdateRate).toBe(0);
    expect(result.medicalAttentionRate).toBe(0);
    expect(result.externalReferralRate).toBe(0);
    expect(result.noActionCount).toBe(0);
  });

  it("should score well for comprehensive post-incident follow-up", () => {
    const incidents = [
      makeIncident({
        postIncidentActions: ["debrief_completed", "support_plan_updated"],
        injuryOccurred: false,
      }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(20);
    expect(result.debriefCompletionRate).toBe(100);
    expect(result.supportPlanUpdateRate).toBe(100);
    expect(result.noActionCount).toBe(0);
  });

  it("should calculate debrief completion rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", postIncidentActions: ["debrief_completed"] }),
      makeIncident({ id: "inc-2", postIncidentActions: ["support_plan_updated"] }),
      makeIncident({ id: "inc-3", postIncidentActions: ["debrief_completed", "support_plan_updated"] }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.debriefCompletionRate).toBe(67);
  });

  it("should calculate support plan update rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", postIncidentActions: ["support_plan_updated"] }),
      makeIncident({ id: "inc-2", postIncidentActions: ["debrief_completed"] }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.supportPlanUpdateRate).toBe(50);
  });

  it("should calculate medical attention rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", postIncidentActions: ["medical_attention"], injuryOccurred: true }),
      makeIncident({ id: "inc-2", postIncidentActions: ["debrief_completed"], injuryOccurred: false }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.medicalAttentionRate).toBe(50);
  });

  it("should calculate external referral rate correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", postIncidentActions: ["external_referral"] }),
      makeIncident({ id: "inc-2", postIncidentActions: ["debrief_completed"] }),
      makeIncident({ id: "inc-3", postIncidentActions: ["debrief_completed"] }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.externalReferralRate).toBe(33);
  });

  it("should count no-action incidents correctly", () => {
    const incidents = [
      makeIncident({ id: "inc-1", postIncidentActions: ["no_action"] }),
      makeIncident({ id: "inc-2", postIncidentActions: ["debrief_completed"] }),
      makeIncident({ id: "inc-3", postIncidentActions: ["no_action"] }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.noActionCount).toBe(2);
  });

  it("should score lower when no action taken", () => {
    const good = [makeIncident({ postIncidentActions: ["debrief_completed", "support_plan_updated"] })];
    const bad = [makeIncident({ postIncidentActions: ["no_action"] })];
    const goodResult = evaluatePostIncident(good);
    const badResult = evaluatePostIncident(bad);
    expect(badResult.overallScore).toBeLessThan(goodResult.overallScore);
  });

  it("should handle injury with medical attention scoring", () => {
    const withMedical = [
      makeIncident({
        injuryOccurred: true,
        postIncidentActions: ["medical_attention", "debrief_completed"],
      }),
    ];
    const withoutMedical = [
      makeIncident({
        injuryOccurred: true,
        postIncidentActions: ["debrief_completed"],
      }),
    ];
    const withResult = evaluatePostIncident(withMedical);
    const withoutResult = evaluatePostIncident(withoutMedical);
    expect(withResult.overallScore).toBeGreaterThanOrEqual(withoutResult.overallScore);
  });

  it("should cap score at 25", () => {
    const incidents = [
      makeIncident({
        postIncidentActions: ["debrief_completed", "support_plan_updated"],
        injuryOccurred: false,
      }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.overallScore).toBeLessThanOrEqual(25);
  });

  it("should not go below 0", () => {
    const incidents = [
      makeIncident({ id: "inc-1", postIncidentActions: ["no_action"], injuryOccurred: true }),
      makeIncident({ id: "inc-2", postIncidentActions: ["no_action"], injuryOccurred: true }),
      makeIncident({ id: "inc-3", postIncidentActions: ["no_action"], injuryOccurred: true }),
    ];
    const result = evaluatePostIncident(incidents);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildIncidentProfiles()
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildIncidentProfiles", () => {
  it("should return empty array for no incidents", () => {
    const profiles = buildChildIncidentProfiles([], []);
    expect(profiles).toEqual([]);
  });

  it("should build profiles grouped by child", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "inc-2", childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "inc-3", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    expect(profiles).toHaveLength(2);
    const alex = profiles.find((p) => p.childId === "child-alex");
    const jordan = profiles.find((p) => p.childId === "child-jordan");
    expect(alex?.incidentCount).toBe(2);
    expect(jordan?.incidentCount).toBe(1);
  });

  it("should correctly count critical incidents per child", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", severity: "critical" }),
      makeIncident({ id: "inc-2", childId: "child-alex", severity: "minor" }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.criticalCount).toBe(1);
  });

  it("should identify predominant category per child", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", category: "physical_aggression" }),
      makeIncident({ id: "inc-2", childId: "child-alex", category: "physical_aggression" }),
      makeIncident({ id: "inc-3", childId: "child-alex", category: "verbal_aggression" }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.predominantCategory).toBe("physical_aggression");
  });

  it("should mark children as escalating from trends", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex" }),
    ];
    const trends = [
      makeTrend({ childId: "child-alex", escalating: true }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, trends);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.escalating).toBe(true);
  });

  it("should mark children as not escalating when no escalating trend", () => {
    const incidents = [makeIncident()];
    const trends = [makeTrend({ escalating: false })];
    const profiles = buildChildIncidentProfiles(incidents, trends);
    expect(profiles[0].escalating).toBe(false);
  });

  it("should calculate de-escalation success rate per child", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", deEscalationAttempted: true, deEscalationOutcome: "successful" }),
      makeIncident({ id: "inc-2", childId: "child-alex", deEscalationAttempted: true, deEscalationOutcome: "unsuccessful" }),
      makeIncident({ id: "inc-3", childId: "child-alex", deEscalationAttempted: false, deEscalationOutcome: "not_attempted" }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.deEscalationSuccessRate).toBe(50);
  });

  it("should count restraints per child", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", restraintUsed: true }),
      makeIncident({ id: "inc-2", childId: "child-alex", restraintUsed: false }),
      makeIncident({ id: "inc-3", childId: "child-alex", restraintUsed: true }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.restraintCount).toBe(2);
  });

  it("should score between 0 and 10 for each child", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", severity: "critical", restraintUsed: true }),
      makeIncident({ id: "inc-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    for (const profile of profiles) {
      expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      expect(profile.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("should sort profiles by overall score ascending (most concerning first)", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", severity: "critical", restraintUsed: true }),
      makeIncident({ id: "inc-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const profiles = buildChildIncidentProfiles(incidents, []);
    expect(profiles[0].overallScore).toBeLessThanOrEqual(profiles[1].overallScore);
  });

  it("should handle a child with many negative factors", () => {
    const incidents = [
      makeIncident({
        id: "inc-1",
        childId: "child-alex",
        severity: "critical",
        restraintUsed: true,
        deEscalationAttempted: true,
        deEscalationOutcome: "unsuccessful",
      }),
    ];
    const trends = [makeTrend({ childId: "child-alex", escalating: true })];
    const profiles = buildChildIncidentProfiles(incidents, trends);
    const alex = profiles.find((p) => p.childId === "child-alex");
    expect(alex?.overallScore).toBeLessThan(5);
    expect(alex?.escalating).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateIncidentPatternAnalysisIntelligence()
// ══════════════════════════════════════════════════════════════════════════════

describe("generateIncidentPatternAnalysisIntelligence", () => {
  it("should return max score 100 / outstanding with all empty data", () => {
    const result = generateIncidentPatternAnalysisIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
    expect(result.homeId).toBe(HOME_ID);
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("should sum sub-scores correctly", () => {
    const result = generateIncidentPatternAnalysisIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    const expectedTotal =
      result.incidentResponse.overallScore +
      result.notificationCompliance.overallScore +
      result.patternAnalysis.overallScore +
      result.postIncident.overallScore;
    expect(result.overallScore).toBe(expectedTotal);
  });

  it("should include all sub-result sections", () => {
    const result = generateIncidentPatternAnalysisIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.incidentResponse).toBeDefined();
    expect(result.notificationCompliance).toBeDefined();
    expect(result.patternAnalysis).toBeDefined();
    expect(result.postIncident).toBeDefined();
    expect(result.childProfiles).toBeDefined();
    expect(result.strengths).toBeDefined();
    expect(result.areasForImprovement).toBeDefined();
    expect(result.actions).toBeDefined();
    expect(result.regulatoryLinks).toBeDefined();
  });

  it("should include strength about no incidents when empty", () => {
    const result = generateIncidentPatternAnalysisIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.strengths.some((s) => s.includes("No incidents"))).toBe(true);
  });

  it("should include action about continuing current strategies when empty", () => {
    const result = generateIncidentPatternAnalysisIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.actions.some((a) => a.includes("Continue"))).toBe(true);
  });

  it("should include all required regulatory links", () => {
    const result = generateIncidentPatternAnalysisIntelligence([], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 40"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 3"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("KCSIE 2024"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Restraint Reduction Network"))).toBe(true);
  });

  it("should generate URGENT actions for critical incidents", () => {
    const incidents = [makeIncident({ severity: "critical" })];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("should generate URGENT actions for not-notified incidents", () => {
    const incidents = [makeIncident({ notificationStatus: "not_notified" })];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("notif"))).toBe(true);
  });

  it("should generate URGENT actions for escalating children", () => {
    const incidents = [makeIncident()];
    const trends = [makeTrend({ escalating: true })];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, trends, [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("escalating"))).toBe(true);
  });

  it("should generate URGENT actions for no-action incidents", () => {
    const incidents = [makeIncident({ postIncidentActions: ["no_action"] })];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.actions.some((a) => a.includes("URGENT") && a.includes("post-incident"))).toBe(true);
  });

  it("should include strengths for high response quality", () => {
    const incidents = [
      makeIncident({
        id: "inc-1",
        responseQuality: "exemplary",
        deEscalationAttempted: true,
        deEscalationOutcome: "successful",
        childDebriefed: true,
        restraintUsed: false,
        notificationStatus: "timely_and_complete",
        managersInformed: true,
        lessonsIdentified: true,
        postIncidentActions: ["debrief_completed", "support_plan_updated"],
      }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [makeStaffResponse()], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("should include areas for improvement when scores are low", () => {
    const incidents = [
      makeIncident({
        id: "inc-1",
        responseQuality: "inadequate",
        deEscalationAttempted: false,
        deEscalationOutcome: "not_attempted",
        childDebriefed: false,
        restraintUsed: true,
        restraintDurationMinutes: 10,
        notificationStatus: "not_notified",
        managersInformed: false,
        lessonsIdentified: false,
        postIncidentActions: ["no_action"],
        severity: "critical",
      }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("should produce a low score for terrible data", () => {
    const incidents = [
      makeIncident({
        id: "inc-1",
        severity: "critical",
        responseQuality: "inadequate",
        deEscalationAttempted: false,
        deEscalationOutcome: "not_attempted",
        childDebriefed: false,
        restraintUsed: true,
        notificationStatus: "not_notified",
        managersInformed: false,
        lessonsIdentified: false,
        postIncidentActions: ["no_action"],
        injuryOccurred: true,
        injuryDetails: "Bruising",
      }),
      makeIncident({
        id: "inc-2",
        severity: "critical",
        responseQuality: "inadequate",
        deEscalationAttempted: false,
        deEscalationOutcome: "not_attempted",
        childDebriefed: false,
        restraintUsed: true,
        notificationStatus: "not_notified",
        managersInformed: false,
        lessonsIdentified: false,
        postIncidentActions: ["no_action"],
        injuryOccurred: true,
        injuryDetails: "Bruising",
        childId: "child-jordan",
        childName: "Jordan",
      }),
    ];
    const trends = [
      makeTrend({ childId: "child-alex", escalating: true }),
      makeTrend({ id: "t2", childId: "child-jordan", childName: "Jordan", escalating: true }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, trends, [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("should produce a high score for excellent data", () => {
    const incidents = [
      makeIncident({
        id: "inc-1",
        severity: "minor",
        responseQuality: "exemplary",
        deEscalationAttempted: true,
        deEscalationOutcome: "successful",
        childDebriefed: true,
        restraintUsed: false,
        notificationStatus: "timely_and_complete",
        managersInformed: true,
        lessonsIdentified: true,
        postIncidentActions: ["debrief_completed", "support_plan_updated"],
      }),
    ];
    const trends = [makeTrend({ escalating: false, triggerPatterns: ["transitions", "homework", "peer_conflict", "mealtimes", "bedtime"] })];
    const patterns = [
      makePattern({ id: "p1", environmentalTrigger: "After school" }),
      makePattern({ id: "p2", environmentalTrigger: "Bedtime routine" }),
      makePattern({ id: "p3", environmentalTrigger: "Weekend mornings" }),
    ];
    const staffResponses = [makeStaffResponse()];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, trends, staffResponses, patterns, HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("should build child profiles for all children in incidents", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", childName: "Alex" }),
      makeIncident({ id: "inc-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.childProfiles).toHaveLength(2);
    expect(result.childProfiles.some((p) => p.childId === "child-alex")).toBe(true);
    expect(result.childProfiles.some((p) => p.childId === "child-jordan")).toBe(true);
  });

  it("should clamp overall score to 0-100", () => {
    // Even with many penalties, score should not go below 0
    const manyBadIncidents = Array.from({ length: 10 }, (_, i) =>
      makeIncident({
        id: `inc-${i}`,
        severity: "critical",
        responseQuality: "inadequate",
        notificationStatus: "not_notified",
        managersInformed: false,
        childDebriefed: false,
        deEscalationAttempted: false,
        restraintUsed: true,
        lessonsIdentified: false,
        postIncidentActions: ["no_action"],
      }),
    );
    const result = generateIncidentPatternAnalysisIntelligence(manyBadIncidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  describe("demo scenario — Oak House", () => {
    // Simulates the API demo data scenario
    const demoIncidents: IncidentRecord[] = [
      makeIncident({
        id: "inc-alex-001",
        childId: "child-alex",
        childName: "Alex",
        date: "2026-05-10",
        time: "16:00",
        category: "verbal_aggression",
        severity: "minor",
        description: "Verbal outburst during homework time",
        responseQuality: "appropriate",
        deEscalationAttempted: true,
        deEscalationOutcome: "successful",
        restraintUsed: false,
        childDebriefed: true,
        notificationStatus: "timely_and_complete",
        managersInformed: true,
        lessonsIdentified: true,
        postIncidentActions: ["debrief_completed", "support_plan_updated"],
      }),
      makeIncident({
        id: "inc-jordan-001",
        childId: "child-jordan",
        childName: "Jordan",
        date: "2026-05-05",
        time: "14:30",
        category: "physical_aggression",
        severity: "moderate",
        description: "Physical altercation with peer",
        responseQuality: "appropriate",
        deEscalationAttempted: true,
        deEscalationOutcome: "partially_successful",
        restraintUsed: false,
        childDebriefed: true,
        notificationStatus: "timely_and_complete",
        managersInformed: true,
        lessonsIdentified: true,
        postIncidentActions: ["debrief_completed", "support_plan_updated"],
      }),
      makeIncident({
        id: "inc-jordan-002",
        childId: "child-jordan",
        childName: "Jordan",
        date: "2026-05-08",
        time: "20:00",
        category: "physical_aggression",
        severity: "moderate",
        description: "Aggressive towards staff during bedtime routine",
        responseQuality: "appropriate",
        deEscalationAttempted: true,
        deEscalationOutcome: "successful",
        restraintUsed: false,
        childDebriefed: true,
        notificationStatus: "timely_and_complete",
        managersInformed: true,
        lessonsIdentified: true,
        postIncidentActions: ["debrief_completed"],
      }),
      makeIncident({
        id: "inc-jordan-003",
        childId: "child-jordan",
        childName: "Jordan",
        date: "2026-05-12",
        time: "09:30",
        category: "self_harm",
        severity: "major",
        description: "Self-harm episode following family contact",
        responseQuality: "exemplary",
        deEscalationAttempted: true,
        deEscalationOutcome: "successful",
        restraintUsed: true,
        restraintDurationMinutes: 3,
        childDebriefed: true,
        injuryOccurred: true,
        injuryDetails: "Superficial scratches to forearms",
        notificationStatus: "timely_and_complete",
        managersInformed: true,
        lessonsIdentified: true,
        postIncidentActions: ["debrief_completed", "support_plan_updated", "medical_attention"],
      }),
    ];

    const demoTrends: IncidentTrend[] = [
      makeTrend({
        id: "trend-jordan",
        childId: "child-jordan",
        childName: "Jordan",
        incidentCount: 3,
        predominantCategory: "physical_aggression",
        escalating: true,
        triggerPatterns: ["family_contact", "transitions", "bedtime"],
      }),
    ];

    const demoStaffResponses: StaffResponse[] = [
      makeStaffResponse({ id: "sr-1", incidentId: "inc-alex-001", staffName: "Sarah Johnson", responseTimeMins: 1 }),
      makeStaffResponse({ id: "sr-2", incidentId: "inc-jordan-001", staffName: "Tom Richards", responseTimeMins: 2 }),
      makeStaffResponse({ id: "sr-3", incidentId: "inc-jordan-002", staffName: "Lisa Williams", responseTimeMins: 3 }),
      makeStaffResponse({ id: "sr-4", incidentId: "inc-jordan-003", staffName: "Sarah Johnson", responseTimeMins: 1 }),
    ];

    it("should produce a realistic score for Oak House demo data", () => {
      const result = generateIncidentPatternAnalysisIntelligence(
        demoIncidents,
        demoTrends,
        demoStaffResponses,
        [],
        HOME_ID,
        "2026-05-01",
        "2026-05-18",
      );
      expect(result.overallScore).toBeGreaterThanOrEqual(40);
      expect(result.overallScore).toBeLessThanOrEqual(90);
    });

    it("should identify Jordan as escalating in profiles", () => {
      const result = generateIncidentPatternAnalysisIntelligence(
        demoIncidents,
        demoTrends,
        demoStaffResponses,
        [],
        HOME_ID,
        "2026-05-01",
        "2026-05-18",
      );
      const jordan = result.childProfiles.find((p) => p.childId === "child-jordan");
      expect(jordan).toBeDefined();
      expect(jordan?.escalating).toBe(true);
      expect(jordan?.incidentCount).toBe(3);
    });

    it("should have Alex with 1 incident and not escalating", () => {
      const result = generateIncidentPatternAnalysisIntelligence(
        demoIncidents,
        demoTrends,
        demoStaffResponses,
        [],
        HOME_ID,
        "2026-05-01",
        "2026-05-18",
      );
      const alex = result.childProfiles.find((p) => p.childId === "child-alex");
      expect(alex).toBeDefined();
      expect(alex?.incidentCount).toBe(1);
      expect(alex?.escalating).toBe(false);
    });

    it("should generate URGENT action for Jordan's escalating pattern", () => {
      const result = generateIncidentPatternAnalysisIntelligence(
        demoIncidents,
        demoTrends,
        demoStaffResponses,
        [],
        HOME_ID,
        "2026-05-01",
        "2026-05-18",
      );
      expect(result.actions.some((a) => a.includes("URGENT") && a.includes("Jordan"))).toBe(true);
    });

    it("should have physical_aggression as predominant category in pattern analysis", () => {
      const result = generateIncidentPatternAnalysisIntelligence(
        demoIncidents,
        demoTrends,
        demoStaffResponses,
        [],
        HOME_ID,
        "2026-05-01",
        "2026-05-18",
      );
      expect(result.patternAnalysis.predominantCategory).toBe("physical_aggression");
    });

    it("should have 100% notification compliance for demo data", () => {
      const result = generateIncidentPatternAnalysisIntelligence(
        demoIncidents,
        demoTrends,
        demoStaffResponses,
        [],
        HOME_ID,
        "2026-05-01",
        "2026-05-18",
      );
      expect(result.notificationCompliance.timelyCompleteRate).toBe(100);
      expect(result.notificationCompliance.managersInformedRate).toBe(100);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Edge Cases & Integration
// ══════════════════════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("should handle a single incident with every bad quality", () => {
    const inc = makeIncident({
      severity: "critical",
      responseQuality: "inadequate",
      deEscalationAttempted: false,
      deEscalationOutcome: "not_attempted",
      childDebriefed: false,
      restraintUsed: true,
      restraintDurationMinutes: 20,
      injuryOccurred: true,
      injuryDetails: "Severe bruising",
      notificationStatus: "not_notified",
      managersInformed: false,
      lessonsIdentified: false,
      postIncidentActions: ["no_action"],
    });
    const result = generateIncidentPatternAnalysisIntelligence([inc], [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.rating).toBe("inadequate");
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("should handle a single incident with every good quality", () => {
    const inc = makeIncident({
      severity: "minor",
      responseQuality: "exemplary",
      deEscalationAttempted: true,
      deEscalationOutcome: "successful",
      childDebriefed: true,
      restraintUsed: false,
      notificationStatus: "timely_and_complete",
      managersInformed: true,
      lessonsIdentified: true,
      postIncidentActions: ["debrief_completed", "support_plan_updated"],
    });
    const trends = [makeTrend({ escalating: false, triggerPatterns: ["a", "b", "c", "d", "e"] })];
    const patterns = [
      makePattern({ id: "p1", environmentalTrigger: "x" }),
      makePattern({ id: "p2", environmentalTrigger: "y" }),
      makePattern({ id: "p3", environmentalTrigger: "z" }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence([inc], trends, [makeStaffResponse()], patterns, HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("should handle multiple children with mixed outcomes", () => {
    const incidents = [
      makeIncident({ id: "inc-1", childId: "child-alex", childName: "Alex", severity: "minor", responseQuality: "exemplary" }),
      makeIncident({ id: "inc-2", childId: "child-jordan", childName: "Jordan", severity: "critical", responseQuality: "inadequate", notificationStatus: "not_notified", managersInformed: false, childDebriefed: false, lessonsIdentified: false, postIncidentActions: ["no_action"] }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.childProfiles).toHaveLength(2);
    // Jordan should score lower than Alex
    const alex = result.childProfiles.find((p) => p.childId === "child-alex");
    const jordan = result.childProfiles.find((p) => p.childId === "child-jordan");
    expect(jordan!.overallScore).toBeLessThan(alex!.overallScore);
  });

  it("should handle incidents with all categories", () => {
    const categories: IncidentCategory[] = [
      "physical_aggression", "verbal_aggression", "self_harm", "absconding",
      "property_damage", "substance_misuse", "sexual_behaviour", "online_safety",
      "bullying", "criminal_activity",
    ];
    const incidents = categories.map((cat, i) =>
      makeIncident({ id: `inc-${i}`, category: cat }),
    );
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.incidentResponse.totalIncidents).toBe(10);
  });

  it("should handle incidents with all severity levels", () => {
    const incidents = [
      makeIncident({ id: "inc-1", severity: "critical" }),
      makeIncident({ id: "inc-2", severity: "major" }),
      makeIncident({ id: "inc-3", severity: "moderate" }),
      makeIncident({ id: "inc-4", severity: "minor" }),
    ];
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.incidentResponse.criticalIncidentCount).toBe(1);
    expect(result.incidentResponse.majorIncidentCount).toBe(1);
  });

  it("should handle incidents with all notification statuses", () => {
    const incidents = [
      makeIncident({ id: "inc-1", notificationStatus: "timely_and_complete" }),
      makeIncident({ id: "inc-2", notificationStatus: "timely_incomplete" }),
      makeIncident({ id: "inc-3", notificationStatus: "late" }),
      makeIncident({ id: "inc-4", notificationStatus: "not_notified" }),
    ];
    const result = evaluateNotificationCompliance(incidents);
    expect(result.timelyCompleteRate).toBe(25);
    expect(result.lateNotificationCount).toBe(1);
    expect(result.notNotifiedCount).toBe(1);
  });

  it("should handle large number of incidents without error", () => {
    const incidents = Array.from({ length: 50 }, (_, i) =>
      makeIncident({ id: `inc-${i}` }),
    );
    const result = generateIncidentPatternAnalysisIntelligence(incidents, [], [], [], HOME_ID, PERIOD_START, PERIOD_END);
    expect(result.incidentResponse.totalIncidents).toBe(50);
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });
});
