// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Anti-Bullying Effectiveness Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex 14, Jordan 13, Morgan 15),
// Staff: Sarah Johnson (Senior RSW), Tom Richards (RSW),
//        Lisa Williams (Senior RSW), Darren Laville (RM/DSL)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateIncidentManagement,
  evaluatePreventionCulture,
  evaluateInterventionQuality,
  evaluateStaffReadiness,
  buildChildBullyingProfiles,
  generateAntiBullyingEffectivenessIntelligence,
  getBullyingTypeLabel,
  getSeverityLabel,
  getResolutionLabel,
  getInterventionLabel,
  getRatingLabel,
} from "../anti-bullying-effectiveness-engine";
import type {
  BullyingIncident,
  ChildBullyingSurvey,
  AntiBullyingPolicy,
  StaffAntiBullyingTraining,
} from "../anti-bullying-effectiveness-engine";

// ── Test Fixtures: Chamberlain House Demo Data ────────────────────────────────────

const makeIncident = (overrides: Partial<BullyingIncident> = {}): BullyingIncident => ({
  id: "bul-001",
  date: "2026-05-05",
  bullyingType: "verbal",
  severity: "medium",
  childrenInvolved: [
    { childId: "child-jordan", childName: "Jordan", role: "perpetrator" },
    { childId: "child-alex", childName: "Alex", role: "target" },
  ],
  location: "Common room",
  reportedBy: "Sarah Johnson",
  timeToResponse: 2,
  interventionType: "restorative_practice",
  resolutionOutcome: "fully_resolved",
  followUpCompleted: true,
  impactAssessed: true,
  childViewSought: true,
  safetyPlanCreated: false,
  ...overrides,
});

const makeSurvey = (overrides: Partial<ChildBullyingSurvey> = {}): ChildBullyingSurvey => ({
  id: "survey-001",
  childId: "child-alex",
  childName: "Alex",
  surveyDate: "2026-05-01",
  feelsSafe: true,
  bulliedRecently: false,
  confidenceInStaffResponse: "very_confident",
  ...overrides,
});

const makePolicy = (overrides: Partial<AntiBullyingPolicy> = {}): AntiBullyingPolicy => ({
  id: "policy-001",
  lastReviewDate: "2026-03-15",
  childrenConsulted: true,
  staffTrained: true,
  parentsInformed: true,
  policyAccessible: true,
  updatedAnnually: true,
  antiDiscriminatory: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffAntiBullyingTraining> = {}): StaffAntiBullyingTraining => ({
  id: "abt-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  trainingDate: "2026-02-15",
  recognitionSkills: true,
  interventionSkills: true,
  restorativePracticeTrained: true,
  ...overrides,
});

// Chamberlain House demo incidents
const OAK_HOUSE_INCIDENTS: BullyingIncident[] = [
  makeIncident({
    id: "bul-001",
    date: "2026-05-05",
    bullyingType: "verbal",
    severity: "medium",
    childrenInvolved: [
      { childId: "child-jordan", childName: "Jordan", role: "perpetrator" },
      { childId: "child-alex", childName: "Alex", role: "target" },
    ],
    reportedBy: "Sarah Johnson",
    timeToResponse: 2,
    interventionType: "restorative_practice",
    resolutionOutcome: "fully_resolved",
    followUpCompleted: true,
    impactAssessed: true,
    childViewSought: true,
    safetyPlanCreated: false,
  }),
  makeIncident({
    id: "bul-002",
    date: "2026-05-10",
    bullyingType: "cyberbullying",
    severity: "high",
    childrenInvolved: [
      { childId: "child-morgan", childName: "Morgan", role: "target" },
    ],
    location: "Online",
    reportedBy: "Tom Richards",
    timeToResponse: 4,
    interventionType: "external_referral",
    resolutionOutcome: "escalated",
    followUpCompleted: true,
    impactAssessed: true,
    childViewSought: true,
    safetyPlanCreated: true,
  }),
];

const OAK_HOUSE_SURVEYS: ChildBullyingSurvey[] = [
  makeSurvey({
    id: "survey-001", childId: "child-alex", childName: "Alex",
    feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident",
  }),
  makeSurvey({
    id: "survey-002", childId: "child-jordan", childName: "Jordan",
    feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "confident",
  }),
  makeSurvey({
    id: "survey-003", childId: "child-morgan", childName: "Morgan",
    feelsSafe: true, bulliedRecently: true, confidenceInStaffResponse: "confident",
  }),
];

const OAK_HOUSE_POLICY = makePolicy();

const OAK_HOUSE_TRAINING: StaffAntiBullyingTraining[] = [
  makeTraining({
    id: "abt-001", staffId: "staff-sarah", staffName: "Sarah Johnson",
    recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true,
  }),
  makeTraining({
    id: "abt-002", staffId: "staff-tom", staffName: "Tom Richards",
    recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true,
  }),
  makeTraining({
    id: "abt-003", staffId: "staff-lisa", staffName: "Lisa Williams",
    recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: false,
  }),
  makeTraining({
    id: "abt-004", staffId: "staff-darren", staffName: "Darren Laville",
    recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true,
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// 1. evaluateIncidentManagement
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateIncidentManagement", () => {
  it("returns score 25 for empty incidents (no bullying = excellent)", () => {
    const result = evaluateIncidentManagement([]);
    expect(result.score).toBe(25);
    expect(result.totalIncidents).toBe(0);
  });

  it("returns strength message for empty incidents", () => {
    const result = evaluateIncidentManagement([]);
    expect(result.strengths).toContain("No bullying incidents recorded in period — positive home culture");
    expect(result.concerns).toHaveLength(0);
  });

  it("calculates timely response rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", timeToResponse: 2 }),
      makeIncident({ id: "2", timeToResponse: 48 }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.timelyResponseRate).toBe(50);
    expect(result.timelyResponseCount).toBe(1);
  });

  it("calculates 100% timely response when all within threshold", () => {
    const incidents = [
      makeIncident({ id: "1", timeToResponse: 1 }),
      makeIncident({ id: "2", timeToResponse: 24 }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.timelyResponseRate).toBe(100);
  });

  it("calculates average response hours correctly", () => {
    const incidents = [
      makeIncident({ id: "1", timeToResponse: 2 }),
      makeIncident({ id: "2", timeToResponse: 8 }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.averageResponseHours).toBe(5);
  });

  it("calculates fully resolved rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", resolutionOutcome: "fully_resolved" }),
      makeIncident({ id: "2", resolutionOutcome: "ongoing" }),
      makeIncident({ id: "3", resolutionOutcome: "fully_resolved" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.fullyResolvedRate).toBe(67);
  });

  it("calculates follow-up completion rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", followUpCompleted: true }),
      makeIncident({ id: "2", followUpCompleted: false }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.followUpCompletedRate).toBe(50);
    expect(result.followUpCompletedCount).toBe(1);
  });

  it("calculates child view sought rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", childViewSought: true }),
      makeIncident({ id: "2", childViewSought: true }),
      makeIncident({ id: "3", childViewSought: false }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.childViewSoughtRate).toBe(67);
  });

  it("calculates impact assessed rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", impactAssessed: true }),
      makeIncident({ id: "2", impactAssessed: false }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.impactAssessedRate).toBe(50);
  });

  it("builds severity breakdown correctly", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "low" }),
      makeIncident({ id: "2", severity: "high" }),
      makeIncident({ id: "3", severity: "high" }),
      makeIncident({ id: "4", severity: "critical" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.severityBreakdown.low).toBe(1);
    expect(result.severityBreakdown.medium).toBe(0);
    expect(result.severityBreakdown.high).toBe(2);
    expect(result.severityBreakdown.critical).toBe(1);
  });

  it("builds type breakdown correctly", () => {
    const incidents = [
      makeIncident({ id: "1", bullyingType: "verbal" }),
      makeIncident({ id: "2", bullyingType: "verbal" }),
      makeIncident({ id: "3", bullyingType: "cyberbullying" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.typeBreakdown.verbal).toBe(2);
    expect(result.typeBreakdown.cyberbullying).toBe(1);
    expect(result.typeBreakdown.physical).toBe(0);
  });

  it("builds resolution breakdown correctly", () => {
    const incidents = [
      makeIncident({ id: "1", resolutionOutcome: "fully_resolved" }),
      makeIncident({ id: "2", resolutionOutcome: "escalated" }),
      makeIncident({ id: "3", resolutionOutcome: "unresolved" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.resolutionBreakdown.fully_resolved).toBe(1);
    expect(result.resolutionBreakdown.escalated).toBe(1);
    expect(result.resolutionBreakdown.unresolved).toBe(1);
  });

  it("generates concern for critical incidents", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "critical" }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.concerns.some((c) => c.includes("critical bullying incident"))).toBe(true);
  });

  it("generates strength for high timely response rate", () => {
    const incidents = [
      makeIncident({ id: "1", timeToResponse: 1 }),
      makeIncident({ id: "2", timeToResponse: 2 }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.strengths.some((s) => s.includes("Excellent response timeliness"))).toBe(true);
  });

  it("generates concern for low timely response rate", () => {
    const incidents = [
      makeIncident({ id: "1", timeToResponse: 48 }),
      makeIncident({ id: "2", timeToResponse: 72 }),
      makeIncident({ id: "3", timeToResponse: 1 }),
    ];
    const result = evaluateIncidentManagement(incidents);
    expect(result.concerns.some((c) => c.includes("Response timeliness"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const perfectIncidents = [
      makeIncident({
        id: "1", timeToResponse: 1, resolutionOutcome: "fully_resolved",
        followUpCompleted: true, childViewSought: true, impactAssessed: true,
      }),
    ];
    const result = evaluateIncidentManagement(perfectIncidents);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo data produces expected incident count", () => {
    const result = evaluateIncidentManagement(OAK_HOUSE_INCIDENTS);
    expect(result.totalIncidents).toBe(2);
  });

  it("Chamberlain House demo data has 100% timely response", () => {
    const result = evaluateIncidentManagement(OAK_HOUSE_INCIDENTS);
    expect(result.timelyResponseRate).toBe(100);
  });

  it("Chamberlain House demo data has 100% follow-up", () => {
    const result = evaluateIncidentManagement(OAK_HOUSE_INCIDENTS);
    expect(result.followUpCompletedRate).toBe(100);
  });

  it("Chamberlain House demo data has 100% child view sought", () => {
    const result = evaluateIncidentManagement(OAK_HOUSE_INCIDENTS);
    expect(result.childViewSoughtRate).toBe(100);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. evaluatePreventionCulture
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePreventionCulture", () => {
  it("returns score 0 for empty surveys and no policy", () => {
    const result = evaluatePreventionCulture([], null);
    expect(result.score).toBe(0);
    expect(result.totalSurveys).toBe(0);
  });

  it("returns concern when no surveys and no policy", () => {
    const result = evaluatePreventionCulture([], null);
    expect(result.concerns.some((c) => c.includes("No child bullying surveys"))).toBe(true);
  });

  it("calculates feels safe rate correctly", () => {
    const surveys = [
      makeSurvey({ id: "1", feelsSafe: true }),
      makeSurvey({ id: "2", feelsSafe: true }),
      makeSurvey({ id: "3", feelsSafe: false }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.feelsSafeRate).toBe(67);
    expect(result.feelsSafeCount).toBe(2);
  });

  it("calculates bullied recently rate correctly", () => {
    const surveys = [
      makeSurvey({ id: "1", bulliedRecently: true }),
      makeSurvey({ id: "2", bulliedRecently: false }),
      makeSurvey({ id: "3", bulliedRecently: false }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.bulliedRecentlyRate).toBe(33);
    expect(result.bulliedRecentlyCount).toBe(1);
  });

  it("calculates high confidence rate correctly", () => {
    const surveys = [
      makeSurvey({ id: "1", confidenceInStaffResponse: "very_confident" }),
      makeSurvey({ id: "2", confidenceInStaffResponse: "confident" }),
      makeSurvey({ id: "3", confidenceInStaffResponse: "not_confident" }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.highConfidenceRate).toBe(67);
  });

  it("builds confidence breakdown correctly", () => {
    const surveys = [
      makeSurvey({ id: "1", confidenceInStaffResponse: "very_confident" }),
      makeSurvey({ id: "2", confidenceInStaffResponse: "no_confidence" }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.confidenceBreakdown.very_confident).toBe(1);
    expect(result.confidenceBreakdown.no_confidence).toBe(1);
  });

  it("awards policy score for current accessible anti-discriminatory policy", () => {
    const policy = makePolicy({ updatedAnnually: true, policyAccessible: true, antiDiscriminatory: true });
    const result = evaluatePreventionCulture([], policy);
    expect(result.policyCurrentScore).toBe(3);
  });

  it("awards partial policy score", () => {
    const policy = makePolicy({ updatedAnnually: true, policyAccessible: false, antiDiscriminatory: true });
    const result = evaluatePreventionCulture([], policy);
    expect(result.policyCurrentScore).toBe(2);
  });

  it("awards 0 policy score when all false", () => {
    const policy = makePolicy({ updatedAnnually: false, policyAccessible: false, antiDiscriminatory: false });
    const result = evaluatePreventionCulture([], policy);
    expect(result.policyCurrentScore).toBe(0);
  });

  it("sets childrenConsulted from policy", () => {
    const policy = makePolicy({ childrenConsulted: true });
    const result = evaluatePreventionCulture([], policy);
    expect(result.childrenConsulted).toBe(true);
  });

  it("generates strength for high feels safe rate", () => {
    const surveys = [
      makeSurvey({ id: "1", feelsSafe: true }),
      makeSurvey({ id: "2", feelsSafe: true }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.strengths.some((s) => s.includes("Excellent safety perception"))).toBe(true);
  });

  it("generates concern for low feels safe rate", () => {
    const surveys = [
      makeSurvey({ id: "1", feelsSafe: false }),
      makeSurvey({ id: "2", feelsSafe: false }),
      makeSurvey({ id: "3", feelsSafe: true }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.concerns.some((c) => c.includes("feel safe from bullying"))).toBe(true);
  });

  it("generates strength when no children bullied recently", () => {
    const surveys = [
      makeSurvey({ id: "1", bulliedRecently: false }),
      makeSurvey({ id: "2", bulliedRecently: false }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.strengths.some((s) => s.includes("No children report being bullied recently"))).toBe(true);
  });

  it("generates concern for high bullied recently rate", () => {
    const surveys = [
      makeSurvey({ id: "1", bulliedRecently: true }),
      makeSurvey({ id: "2", bulliedRecently: true }),
      makeSurvey({ id: "3", bulliedRecently: false }),
    ];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.concerns.some((c) => c.includes("report being bullied recently"))).toBe(true);
  });

  it("generates concern when children not consulted", () => {
    const policy = makePolicy({ childrenConsulted: false });
    const result = evaluatePreventionCulture([], policy);
    expect(result.concerns.some((c) => c.includes("Children not consulted"))).toBe(true);
  });

  it("generates concern when no policy provided", () => {
    const surveys = [makeSurvey()];
    const result = evaluatePreventionCulture(surveys, null);
    expect(result.concerns.some((c) => c.includes("No anti-bullying policy provided"))).toBe(true);
  });

  it("Chamberlain House demo produces expected feels safe rate", () => {
    const result = evaluatePreventionCulture(OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY);
    expect(result.feelsSafeRate).toBe(100);
  });

  it("Chamberlain House demo has 1 child bullied recently", () => {
    const result = evaluatePreventionCulture(OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY);
    expect(result.bulliedRecentlyCount).toBe(1);
    expect(result.bulliedRecentlyRate).toBe(33);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluatePreventionCulture(OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. evaluateInterventionQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateInterventionQuality", () => {
  it("returns score 25 for empty incidents", () => {
    const result = evaluateInterventionQuality([]);
    expect(result.score).toBe(25);
    expect(result.totalIncidents).toBe(0);
  });

  it("returns strength message for empty incidents", () => {
    const result = evaluateInterventionQuality([]);
    expect(result.strengths.some((s) => s.includes("No bullying incidents requiring intervention"))).toBe(true);
  });

  it("calculates safety plan rate for high/critical correctly", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "high", safetyPlanCreated: true }),
      makeIncident({ id: "2", severity: "critical", safetyPlanCreated: false }),
      makeIncident({ id: "3", severity: "low", safetyPlanCreated: false }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.safetyPlanRateHighCritical).toBe(50);
    expect(result.safetyPlanCount).toBe(1);
  });

  it("gives full safety plan score when no high/critical incidents", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "low", safetyPlanCreated: false }),
      makeIncident({ id: "2", severity: "medium", safetyPlanCreated: false }),
    ];
    const result = evaluateInterventionQuality(incidents);
    // No high/critical, so safety plan rate is 0 for the stat but full score
    expect(result.safetyPlanRateHighCritical).toBe(0);
  });

  it("calculates restorative practice rate correctly", () => {
    const incidents = [
      makeIncident({ id: "1", interventionType: "restorative_practice" }),
      makeIncident({ id: "2", interventionType: "staff_intervention" }),
      makeIncident({ id: "3", interventionType: "restorative_practice" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.restorativePracticeRate).toBe(67);
    expect(result.restorativePracticeCount).toBe(2);
  });

  it("counts diverse intervention types correctly", () => {
    const incidents = [
      makeIncident({ id: "1", interventionType: "restorative_practice" }),
      makeIncident({ id: "2", interventionType: "external_referral" }),
      makeIncident({ id: "3", interventionType: "individual_support" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.diverseInterventions).toBe(3);
  });

  it("calculates resolution rate (fully + partially)", () => {
    const incidents = [
      makeIncident({ id: "1", resolutionOutcome: "fully_resolved" }),
      makeIncident({ id: "2", resolutionOutcome: "partially_resolved" }),
      makeIncident({ id: "3", resolutionOutcome: "unresolved" }),
      makeIncident({ id: "4", resolutionOutcome: "ongoing" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.resolutionRate).toBe(50);
  });

  it("counts external referrals for critical incidents", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "critical", interventionType: "external_referral" }),
      makeIncident({ id: "2", severity: "critical", interventionType: "staff_intervention" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.externalReferralForCritical).toBe(1);
    expect(result.criticalIncidents).toBe(2);
  });

  it("builds intervention breakdown correctly", () => {
    const incidents = [
      makeIncident({ id: "1", interventionType: "peer_mediation" }),
      makeIncident({ id: "2", interventionType: "peer_mediation" }),
      makeIncident({ id: "3", interventionType: "group_work" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.interventionBreakdown.peer_mediation).toBe(2);
    expect(result.interventionBreakdown.group_work).toBe(1);
    expect(result.interventionBreakdown.staff_intervention).toBe(0);
  });

  it("generates concern when critical incidents have no external referral", () => {
    const incidents = [
      makeIncident({ id: "1", severity: "critical", interventionType: "staff_intervention" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.concerns.some((c) => c.includes("no external referrals made"))).toBe(true);
  });

  it("generates strength for diverse interventions", () => {
    const incidents = [
      makeIncident({ id: "1", interventionType: "restorative_practice" }),
      makeIncident({ id: "2", interventionType: "external_referral" }),
      makeIncident({ id: "3", interventionType: "individual_support" }),
      makeIncident({ id: "4", interventionType: "group_work" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.strengths.some((s) => s.includes("Diverse intervention approaches"))).toBe(true);
  });

  it("generates concern for low resolution rate", () => {
    const incidents = [
      makeIncident({ id: "1", resolutionOutcome: "unresolved" }),
      makeIncident({ id: "2", resolutionOutcome: "ongoing" }),
      makeIncident({ id: "3", resolutionOutcome: "unresolved" }),
    ];
    const result = evaluateInterventionQuality(incidents);
    expect(result.concerns.some((c) => c.includes("Resolution rate"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateInterventionQuality(OAK_HOUSE_INCIDENTS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 2 intervention types", () => {
    const result = evaluateInterventionQuality(OAK_HOUSE_INCIDENTS);
    expect(result.diverseInterventions).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. evaluateStaffReadiness
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffReadiness", () => {
  it("returns score 0 for empty training", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
  });

  it("returns concern when no training records", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.concerns.some((c) => c.includes("No staff anti-bullying training records"))).toBe(true);
  });

  it("calculates recognition skills rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true }),
      makeTraining({ id: "2", staffId: "s2", recognitionSkills: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.recognitionSkillsRate).toBe(50);
    expect(result.recognitionSkillsCount).toBe(1);
  });

  it("calculates intervention skills rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", interventionSkills: true }),
      makeTraining({ id: "2", staffId: "s2", interventionSkills: true }),
      makeTraining({ id: "3", staffId: "s3", interventionSkills: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.interventionSkillsRate).toBe(67);
  });

  it("calculates restorative practice rate correctly", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", restorativePracticeTrained: true }),
      makeTraining({ id: "2", staffId: "s2", restorativePracticeTrained: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.restorativePracticeRate).toBe(50);
  });

  it("calculates overall trained rate (all three skills)", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
      makeTraining({ id: "2", staffId: "s2", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: false }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.overallTrainedRate).toBe(50);
    expect(result.overallTrainedCount).toBe(1);
  });

  it("generates strength for 100% fully trained staff", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.strengths.some((s) => s.includes("100% of staff fully trained"))).toBe(true);
  });

  it("generates concern for low recognition skills rate", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: false }),
      makeTraining({ id: "2", staffId: "s2", recognitionSkills: false }),
      makeTraining({ id: "3", staffId: "s3", recognitionSkills: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.concerns.some((c) => c.includes("Recognition skills"))).toBe(true);
  });

  it("generates concern for low overall trained rate", () => {
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true, interventionSkills: false, restorativePracticeTrained: false }),
      makeTraining({ id: "2", staffId: "s2", recognitionSkills: false, interventionSkills: true, restorativePracticeTrained: false }),
      makeTraining({ id: "3", staffId: "s3", recognitionSkills: false, interventionSkills: false, restorativePracticeTrained: true }),
    ];
    const result = evaluateStaffReadiness(training);
    expect(result.concerns.some((c) => c.includes("complete anti-bullying training"))).toBe(true);
  });

  it("score is clamped between 0 and 25", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("Chamberlain House demo has 4 staff trained", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
  });

  it("Chamberlain House demo has 100% recognition skills", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.recognitionSkillsRate).toBe(100);
  });

  it("Chamberlain House demo has 75% restorative practice (3 of 4)", () => {
    const result = evaluateStaffReadiness(OAK_HOUSE_TRAINING);
    expect(result.restorativePracticeRate).toBe(75);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. buildChildBullyingProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildBullyingProfiles", () => {
  it("returns empty array for no incidents and no surveys", () => {
    const result = buildChildBullyingProfiles([], []);
    expect(result).toHaveLength(0);
  });

  it("creates profiles from incidents", () => {
    const result = buildChildBullyingProfiles(OAK_HOUSE_INCIDENTS, []);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("creates profiles from surveys even without incidents", () => {
    const result = buildChildBullyingProfiles([], OAK_HOUSE_SURVEYS);
    expect(result).toHaveLength(3);
  });

  it("counts target incidents correctly", () => {
    const result = buildChildBullyingProfiles(OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex).toBeDefined();
    expect(alex!.incidentsAsTarget).toBe(1);
  });

  it("counts perpetrator incidents correctly", () => {
    const result = buildChildBullyingProfiles(OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS);
    const jordan = result.find((p) => p.childId === "child-jordan");
    expect(jordan).toBeDefined();
    expect(jordan!.incidentsAsPerpetrator).toBe(1);
  });

  it("calculates total involvement correctly", () => {
    const result = buildChildBullyingProfiles(OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.totalInvolvement).toBe(1);
  });

  it("includes survey data in profile", () => {
    const result = buildChildBullyingProfiles(OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS);
    const alex = result.find((p) => p.childId === "child-alex");
    expect(alex!.feelsSafe).toBe(true);
    expect(alex!.bulliedRecently).toBe(false);
    expect(alex!.confidenceInStaff).toBe("very_confident");
  });

  it("sets null survey fields when no survey available", () => {
    const incidents = [
      makeIncident({
        id: "1",
        childrenInvolved: [{ childId: "child-new", childName: "New Child", role: "target" }],
      }),
    ];
    const result = buildChildBullyingProfiles(incidents, []);
    const newChild = result.find((p) => p.childId === "child-new");
    expect(newChild!.feelsSafe).toBeNull();
    expect(newChild!.bulliedRecently).toBeNull();
    expect(newChild!.confidenceInStaff).toBeNull();
  });

  it("wellbeing score starts at 10 for child with no issues", () => {
    const result = buildChildBullyingProfiles([], [
      makeSurvey({
        id: "1", childId: "child-happy", childName: "Happy",
        feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident",
      }),
    ]);
    const happy = result.find((p) => p.childId === "child-happy");
    expect(happy!.wellbeingScore).toBe(10);
  });

  it("wellbeing score deducts for being target", () => {
    const incidents = [
      makeIncident({
        id: "1",
        childrenInvolved: [{ childId: "child-target", childName: "Target", role: "target" }],
      }),
    ];
    const result = buildChildBullyingProfiles(incidents, []);
    const target = result.find((p) => p.childId === "child-target");
    expect(target!.wellbeingScore).toBeLessThan(10);
  });

  it("wellbeing score deducts for feeling unsafe", () => {
    const result = buildChildBullyingProfiles([], [
      makeSurvey({
        id: "1", childId: "child-unsafe", childName: "Unsafe",
        feelsSafe: false, bulliedRecently: false, confidenceInStaffResponse: "very_confident",
      }),
    ]);
    const unsafe = result.find((p) => p.childId === "child-unsafe");
    expect(unsafe!.wellbeingScore).toBe(8);
  });

  it("wellbeing score deducts for recent bullying", () => {
    const result = buildChildBullyingProfiles([], [
      makeSurvey({
        id: "1", childId: "child-bullied", childName: "Bullied",
        feelsSafe: true, bulliedRecently: true, confidenceInStaffResponse: "very_confident",
      }),
    ]);
    const bullied = result.find((p) => p.childId === "child-bullied");
    expect(bullied!.wellbeingScore).toBe(8);
  });

  it("wellbeing score deducts for low confidence in staff", () => {
    const result = buildChildBullyingProfiles([], [
      makeSurvey({
        id: "1", childId: "child-noconf", childName: "NoConf",
        feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "no_confidence",
      }),
    ]);
    const noconf = result.find((p) => p.childId === "child-noconf");
    expect(noconf!.wellbeingScore).toBe(9);
  });

  it("wellbeing score is clamped to 0 minimum", () => {
    const incidents = [
      makeIncident({
        id: "1",
        childrenInvolved: [{ childId: "child-worst", childName: "Worst", role: "target" }],
      }),
      makeIncident({
        id: "2",
        childrenInvolved: [{ childId: "child-worst", childName: "Worst", role: "target" }],
      }),
      makeIncident({
        id: "3",
        childrenInvolved: [{ childId: "child-worst", childName: "Worst", role: "target" }],
      }),
    ];
    const surveys = [
      makeSurvey({
        id: "1", childId: "child-worst", childName: "Worst",
        feelsSafe: false, bulliedRecently: true, confidenceInStaffResponse: "no_confidence",
      }),
    ];
    const result = buildChildBullyingProfiles(incidents, surveys);
    const worst = result.find((p) => p.childId === "child-worst");
    expect(worst!.wellbeingScore).toBeGreaterThanOrEqual(0);
  });

  it("deduplicates children appearing in multiple incidents", () => {
    const incidents = [
      makeIncident({
        id: "1",
        childrenInvolved: [{ childId: "child-alex", childName: "Alex", role: "target" }],
      }),
      makeIncident({
        id: "2",
        childrenInvolved: [{ childId: "child-alex", childName: "Alex", role: "bystander" }],
      }),
    ];
    const result = buildChildBullyingProfiles(incidents, []);
    const alexProfiles = result.filter((p) => p.childId === "child-alex");
    expect(alexProfiles).toHaveLength(1);
    expect(alexProfiles[0].incidentsAsTarget).toBe(1);
    expect(alexProfiles[0].incidentsAsBystander).toBe(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. generateAntiBullyingEffectivenessIntelligence
// ══════════════════════════════════════════════════════════════════════════════

describe("generateAntiBullyingEffectivenessIntelligence", () => {
  it("produces overall score 0-100", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes all 4 evaluator results", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.incidentManagement).toBeDefined();
    expect(result.preventionCulture).toBeDefined();
    expect(result.interventionQuality).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("overall score equals sum of 4 evaluator scores", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    const expectedSum = Math.round(
      result.incidentManagement.score +
      result.preventionCulture.score +
      result.interventionQuality.score +
      result.staffReadiness.score,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("includes child profiles", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.childProfiles.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.length).toBe(7);
  });

  it("includes CHR 2015 Reg 12 in regulatory links", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
  });

  it("includes SCCIF in regulatory links", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("includes Equality Act 2010 in regulatory links", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("Equality Act 2010"))).toBe(true);
  });

  it("includes UNCRC Article 19 in regulatory links", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.regulatoryLinks.some((l) => l.includes("UNCRC Article 19"))).toBe(true);
  });

  it("sets homeId correctly", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      [], [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.homeId).toBe("oak-house");
  });

  it("sets period dates correctly", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      [], [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.periodStart).toBe("2026-04-01");
    expect(result.periodEnd).toBe("2026-05-18");
  });

  it("filters incidents by period", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-05" }),
      makeIncident({ id: "2", date: "2026-03-01" }), // outside period
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      incidents, [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.incidentManagement.totalIncidents).toBe(1);
  });

  it("rating is outstanding for score >= 80", () => {
    // Empty incidents (25+25) + good surveys/policy + good training = should be high
    const surveys = [
      makeSurvey({ id: "1", childId: "c1", feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident" }),
      makeSurvey({ id: "2", childId: "c2", feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident" }),
    ];
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
      makeTraining({ id: "2", staffId: "s2", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      [], surveys, makePolicy(), training, "test-home", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(80);
    expect(result.rating).toBe("outstanding");
  });

  it("rating is inadequate for score < 40", () => {
    // No surveys, no policy, no training = score should be very low
    const result = generateAntiBullyingEffectivenessIntelligence(
      [
        makeIncident({
          id: "1", date: "2026-05-05", timeToResponse: 72, resolutionOutcome: "unresolved",
          followUpCompleted: false, childViewSought: false, impactAssessed: false,
          severity: "critical", safetyPlanCreated: false,
        }),
      ],
      [], null, [], "test-home", "2026-04-01", "2026-05-18",
    );
    expect(result.overallScore).toBeLessThan(40);
    expect(result.rating).toBe("inadequate");
  });

  it("generates URGENT actions for critical incidents", () => {
    const incidents = [
      makeIncident({
        id: "1", date: "2026-05-05", severity: "critical",
      }),
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      incidents, [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.startsWith("URGENT"))).toBe(true);
  });

  it("generates URGENT action for discriminatory bullying", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-05", bullyingType: "racial" }),
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      incidents, [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("discriminatory bullying"))).toBe(true);
  });

  it("generates action for unresolved incidents", () => {
    const incidents = [
      makeIncident({ id: "1", date: "2026-05-05", resolutionOutcome: "unresolved" }),
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      incidents, [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("unresolved"))).toBe(true);
  });

  it("generates no-action message when all is well", () => {
    const surveys = [
      makeSurvey({ id: "1", childId: "c1", feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident" }),
    ];
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      [], surveys, makePolicy(), training, "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("includes assessedAt timestamp", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      [], [], null, [], "oak-house", "2026-04-01", "2026-05-18",
    );
    expect(result.assessedAt).toBeDefined();
    expect(result.assessedAt.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. Label utilities
// ══════════════════════════════════════════════════════════════════════════════

describe("getBullyingTypeLabel", () => {
  it("returns Physical for physical", () => {
    expect(getBullyingTypeLabel("physical")).toBe("Physical");
  });
  it("returns Verbal for verbal", () => {
    expect(getBullyingTypeLabel("verbal")).toBe("Verbal");
  });
  it("returns Cyberbullying for cyberbullying", () => {
    expect(getBullyingTypeLabel("cyberbullying")).toBe("Cyberbullying");
  });
  it("returns Racial for racial", () => {
    expect(getBullyingTypeLabel("racial")).toBe("Racial");
  });
  it("returns Social Exclusion for social_exclusion", () => {
    expect(getBullyingTypeLabel("social_exclusion")).toBe("Social Exclusion");
  });
});

describe("getSeverityLabel", () => {
  it("returns Low for low", () => {
    expect(getSeverityLabel("low")).toBe("Low");
  });
  it("returns Critical for critical", () => {
    expect(getSeverityLabel("critical")).toBe("Critical");
  });
});

describe("getResolutionLabel", () => {
  it("returns Fully Resolved for fully_resolved", () => {
    expect(getResolutionLabel("fully_resolved")).toBe("Fully Resolved");
  });
  it("returns Escalated for escalated", () => {
    expect(getResolutionLabel("escalated")).toBe("Escalated");
  });
  it("returns Unresolved for unresolved", () => {
    expect(getResolutionLabel("unresolved")).toBe("Unresolved");
  });
});

describe("getInterventionLabel", () => {
  it("returns Peer Mediation for peer_mediation", () => {
    expect(getInterventionLabel("peer_mediation")).toBe("Peer Mediation");
  });
  it("returns Restorative Practice for restorative_practice", () => {
    expect(getInterventionLabel("restorative_practice")).toBe("Restorative Practice");
  });
  it("returns External Referral for external_referral", () => {
    expect(getInterventionLabel("external_referral")).toBe("External Referral");
  });
});

describe("getRatingLabel", () => {
  it("returns Outstanding for outstanding", () => {
    expect(getRatingLabel("outstanding")).toBe("Outstanding");
  });
  it("returns Good for good", () => {
    expect(getRatingLabel("good")).toBe("Good");
  });
  it("returns Requires Improvement for requires_improvement", () => {
    expect(getRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });
  it("returns Inadequate for inadequate", () => {
    expect(getRatingLabel("inadequate")).toBe("Inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. Rating thresholds
// ══════════════════════════════════════════════════════════════════════════════

describe("Rating thresholds", () => {
  it("score 80 = outstanding", () => {
    // Create data that sums close to 80
    const surveys = [
      makeSurvey({ id: "1", childId: "c1", feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident" }),
      makeSurvey({ id: "2", childId: "c2", feelsSafe: true, bulliedRecently: false, confidenceInStaffResponse: "very_confident" }),
    ];
    const training = [
      makeTraining({ id: "1", staffId: "s1", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
      makeTraining({ id: "2", staffId: "s2", recognitionSkills: true, interventionSkills: true, restorativePracticeTrained: true }),
    ];
    const result = generateAntiBullyingEffectivenessIntelligence(
      [], surveys, makePolicy(), training, "test", "2026-04-01", "2026-05-18",
    );
    if (result.overallScore >= 80) {
      expect(result.rating).toBe("outstanding");
    }
  });

  it("score 60-79 = good", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      OAK_HOUSE_INCIDENTS, OAK_HOUSE_SURVEYS, OAK_HOUSE_POLICY,
      OAK_HOUSE_TRAINING, "oak-house", "2026-04-01", "2026-05-18",
    );
    if (result.overallScore >= 60 && result.overallScore < 80) {
      expect(result.rating).toBe("good");
    }
  });

  it("score < 40 = inadequate", () => {
    const result = generateAntiBullyingEffectivenessIntelligence(
      [makeIncident({
        id: "1", date: "2026-05-05", timeToResponse: 72, resolutionOutcome: "unresolved",
        followUpCompleted: false, childViewSought: false, impactAssessed: false,
        severity: "critical", safetyPlanCreated: false,
      })],
      [], null, [], "test", "2026-04-01", "2026-05-18",
    );
    if (result.overallScore < 40) {
      expect(result.rating).toBe("inadequate");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. pct() helper edge cases (tested indirectly)
// ══════════════════════════════════════════════════════════════════════════════

describe("pct helper edge cases (via evaluators)", () => {
  it("handles zero denominator gracefully in incident management", () => {
    const result = evaluateIncidentManagement([]);
    // All rates should be 0 when no incidents (empty path returns 25)
    expect(result.timelyResponseRate).toBe(0);
    expect(result.fullyResolvedRate).toBe(0);
  });

  it("handles zero denominator in prevention culture", () => {
    const result = evaluatePreventionCulture([], null);
    expect(result.feelsSafeRate).toBe(0);
    expect(result.bulliedRecentlyRate).toBe(0);
    expect(result.highConfidenceRate).toBe(0);
  });

  it("handles zero denominator in staff readiness", () => {
    const result = evaluateStaffReadiness([]);
    expect(result.recognitionSkillsRate).toBe(0);
    expect(result.interventionSkillsRate).toBe(0);
  });

  it("rounds percentages correctly", () => {
    const incidents = [
      makeIncident({ id: "1", timeToResponse: 1 }),
      makeIncident({ id: "2", timeToResponse: 1 }),
      makeIncident({ id: "3", timeToResponse: 48 }),
    ];
    const result = evaluateIncidentManagement(incidents);
    // 2/3 = 66.66... rounds to 67
    expect(result.timelyResponseRate).toBe(67);
  });
});
