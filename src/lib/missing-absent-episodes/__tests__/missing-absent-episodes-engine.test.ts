// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Missing & Absent Episodes Intelligence Engine
//
// Demo: Chamberlain House, 3 children (Alex, Jordan, Morgan),
// Staff: Sarah Johnson, Tom Richards, Lisa Williams, Darren Laville
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateEpisodeManagement,
  evaluatePreventionEffectiveness,
  evaluateMissingPolicy,
  evaluateStaffMissingReadiness,
  buildChildMissingProfiles,
  generateMissingAbsentEpisodesIntelligence,
  getEpisodeTypeLabel,
  getEpisodeOutcomeLabel,
  getRiskLevelLabel,
  getRatingLabel,
  pct,
  getRating,
} from "../missing-absent-episodes-engine";
import type {
  MissingEpisode,
  MissingPolicy,
  StaffMissingTraining,
} from "../missing-absent-episodes-engine";

// ── Test Fixtures ─────────────────────────────────────────────────────────

const makeEpisode = (overrides: Partial<MissingEpisode> = {}): MissingEpisode => ({
  id: "ep-001",
  childId: "child-alex",
  childName: "Alex",
  episodeType: "missing",
  reportedDate: "2026-03-10",
  resolvedDate: "2026-03-10",
  durationMinutes: 120,
  riskLevel: "medium",
  outcome: "returned_self",
  returnInterviewCompleted: true,
  returnInterviewTimely: true,
  triggerIdentified: true,
  preventionPlanUpdated: true,
  policeNotified: true,
  localAuthorityNotified: true,
  ...overrides,
});

const makePolicy = (overrides: Partial<MissingPolicy> = {}): MissingPolicy => ({
  id: "policy-001",
  missingProtocolInPlace: true,
  riskAssessmentFramework: true,
  returnInterviewProcess: true,
  preventionStrategy: true,
  multiAgencyProtocol: true,
  regularReview: true,
  staffGuidanceClear: true,
  ...overrides,
});

const makeTraining = (overrides: Partial<StaffMissingTraining> = {}): StaffMissingTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  missingProtocol: true,
  riskAssessment: true,
  returnInterviews: true,
  preventionStrategies: true,
  multiAgencyWorking: true,
  recordKeeping: true,
  ...overrides,
});

// Chamberlain House demo data
const OAK_HOUSE_EPISODES: MissingEpisode[] = [
  makeEpisode({
    id: "ep-001",
    childId: "child-alex",
    childName: "Alex",
    episodeType: "missing",
    reportedDate: "2026-02-15",
    resolvedDate: "2026-02-15",
    durationMinutes: 180,
    riskLevel: "medium",
    outcome: "returned_self",
  }),
  makeEpisode({
    id: "ep-002",
    childId: "child-jordan",
    childName: "Jordan",
    episodeType: "absent_without_permission",
    reportedDate: "2026-03-01",
    resolvedDate: "2026-03-01",
    durationMinutes: 90,
    riskLevel: "low",
    outcome: "found_by_staff",
  }),
  makeEpisode({
    id: "ep-003",
    childId: "child-alex",
    childName: "Alex",
    episodeType: "failure_to_return",
    reportedDate: "2026-03-20",
    resolvedDate: "2026-03-21",
    durationMinutes: 480,
    riskLevel: "high",
    outcome: "found_by_police",
    returnInterviewTimely: true,
    triggerIdentified: true,
    preventionPlanUpdated: true,
  }),
  makeEpisode({
    id: "ep-004",
    childId: "child-morgan",
    childName: "Morgan",
    episodeType: "absent_no_contact",
    reportedDate: "2026-04-10",
    resolvedDate: "2026-04-10",
    durationMinutes: 60,
    riskLevel: "low",
    outcome: "returned_self",
  }),
];

const OAK_HOUSE_POLICY = makePolicy();

const OAK_HOUSE_TRAINING: StaffMissingTraining[] = [
  makeTraining({ id: "t-001", staffId: "staff-sarah", staffName: "Sarah Johnson" }),
  makeTraining({ id: "t-002", staffId: "staff-tom", staffName: "Tom Richards" }),
  makeTraining({
    id: "t-003",
    staffId: "staff-lisa",
    staffName: "Lisa Williams",
    returnInterviews: false,
  }),
  makeTraining({ id: "t-004", staffId: "staff-darren", staffName: "Darren Laville" }),
];

// ══════════════════════════════════════════════════════════════════════════════
// pct()
// ══════════════════════════════════════════════════════════════════════════════

describe("pct()", () => {
  it("returns 0 when denominator is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("returns 0 when numerator is 0", () => {
    expect(pct(0, 10)).toBe(0);
  });

  it("returns 100 when num equals den", () => {
    expect(pct(10, 10)).toBe(100);
  });

  it("returns 50 for half", () => {
    expect(pct(1, 2)).toBe(50);
  });

  it("rounds to nearest integer", () => {
    expect(pct(1, 3)).toBe(33);
    expect(pct(2, 3)).toBe(67);
  });

  it("handles large numerator", () => {
    expect(pct(200, 100)).toBe(200);
  });

  it("handles pct(0, 0)", () => {
    expect(pct(0, 0)).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// getRating()
// ══════════════════════════════════════════════════════════════════════════════

describe("getRating()", () => {
  it("returns outstanding for score >= 80", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(100)).toBe("outstanding");
    expect(getRating(95)).toBe("outstanding");
  });

  it("returns good for score 60-79", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(79)).toBe("good");
    expect(getRating(70)).toBe("good");
  });

  it("returns requires_improvement for score 40-59", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(59)).toBe("requires_improvement");
    expect(getRating(50)).toBe("requires_improvement");
  });

  it("returns inadequate for score < 40", () => {
    expect(getRating(39)).toBe("inadequate");
    expect(getRating(0)).toBe("inadequate");
    expect(getRating(20)).toBe("inadequate");
  });

  it("handles boundary at 80 exactly", () => {
    expect(getRating(80)).toBe("outstanding");
    expect(getRating(79)).toBe("good");
  });

  it("handles boundary at 60 exactly", () => {
    expect(getRating(60)).toBe("good");
    expect(getRating(59)).toBe("requires_improvement");
  });

  it("handles boundary at 40 exactly", () => {
    expect(getRating(40)).toBe("requires_improvement");
    expect(getRating(39)).toBe("inadequate");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label Getters
// ══════════════════════════════════════════════════════════════════════════════

describe("getEpisodeTypeLabel()", () => {
  it("returns correct label for missing", () => {
    expect(getEpisodeTypeLabel("missing")).toBe("Missing");
  });
  it("returns correct label for absent_without_permission", () => {
    expect(getEpisodeTypeLabel("absent_without_permission")).toBe("Absent Without Permission");
  });
  it("returns correct label for absent_no_contact", () => {
    expect(getEpisodeTypeLabel("absent_no_contact")).toBe("Absent — No Contact");
  });
  it("returns correct label for failure_to_return", () => {
    expect(getEpisodeTypeLabel("failure_to_return")).toBe("Failure to Return");
  });
  it("returns correct label for absconded", () => {
    expect(getEpisodeTypeLabel("absconded")).toBe("Absconded");
  });
});

describe("getEpisodeOutcomeLabel()", () => {
  it("returns correct label for returned_self", () => {
    expect(getEpisodeOutcomeLabel("returned_self")).toBe("Returned Self");
  });
  it("returns correct label for found_by_staff", () => {
    expect(getEpisodeOutcomeLabel("found_by_staff")).toBe("Found by Staff");
  });
  it("returns correct label for found_by_police", () => {
    expect(getEpisodeOutcomeLabel("found_by_police")).toBe("Found by Police");
  });
  it("returns correct label for returned_by_carer", () => {
    expect(getEpisodeOutcomeLabel("returned_by_carer")).toBe("Returned by Carer");
  });
  it("returns correct label for returned_by_third_party", () => {
    expect(getEpisodeOutcomeLabel("returned_by_third_party")).toBe("Returned by Third Party");
  });
  it("returns correct label for still_missing", () => {
    expect(getEpisodeOutcomeLabel("still_missing")).toBe("Still Missing");
  });
});

describe("getRiskLevelLabel()", () => {
  it("returns correct label for low", () => {
    expect(getRiskLevelLabel("low")).toBe("Low");
  });
  it("returns correct label for medium", () => {
    expect(getRiskLevelLabel("medium")).toBe("Medium");
  });
  it("returns correct label for high", () => {
    expect(getRiskLevelLabel("high")).toBe("High");
  });
  it("returns correct label for very_high", () => {
    expect(getRiskLevelLabel("very_high")).toBe("Very High");
  });
});

describe("getRatingLabel()", () => {
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
// evaluateEpisodeManagement()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateEpisodeManagement()", () => {
  it("returns score 25 for empty episodes (ideal — no episodes)", () => {
    const result = evaluateEpisodeManagement([]);
    expect(result.score).toBe(25);
  });

  it("returns correct rates for empty input", () => {
    const result = evaluateEpisodeManagement([]);
    expect(result.returnInterviewCompletionRate).toBe(0);
    expect(result.returnInterviewTimelyRate).toBe(0);
    expect(result.policeNotificationRate).toBe(0);
    expect(result.localAuthorityNotificationRate).toBe(0);
  });

  it("returns empty risk breakdown for empty input", () => {
    const result = evaluateEpisodeManagement([]);
    expect(result.riskBreakdown).toEqual({ low: 0, medium: 0, high: 0, very_high: 0 });
  });

  it("scores perfect episode management (all booleans true, low risk)", () => {
    const perfect = [makeEpisode({ riskLevel: "low" })];
    const result = evaluateEpisodeManagement(perfect);
    // RI completion: 100% => 7, Risk: low(1) => (4-1)/3*6 = 6, Notification: 100% => 6, Timely: 100% => 6
    // Total: 25 (capped)
    expect(result.score).toBe(25);
    expect(result.returnInterviewCompletionRate).toBe(100);
    expect(result.returnInterviewTimelyRate).toBe(100);
    expect(result.policeNotificationRate).toBe(100);
    expect(result.localAuthorityNotificationRate).toBe(100);
  });

  it("penalises high average risk level", () => {
    const highRisk = [
      makeEpisode({ riskLevel: "very_high" }),
    ];
    const result = evaluateEpisodeManagement(highRisk);
    // Risk score: (4-4)/3*6 = 0
    expect(result.score).toBeLessThan(25);
    expect(result.riskBreakdown.very_high).toBe(1);
  });

  it("penalises missing return interviews", () => {
    const noRI = [makeEpisode({ returnInterviewCompleted: false, returnInterviewTimely: false, riskLevel: "low" })];
    const result = evaluateEpisodeManagement(noRI);
    expect(result.returnInterviewCompletionRate).toBe(0);
    expect(result.score).toBeLessThan(25);
  });

  it("penalises missing police and LA notification", () => {
    const noNotify = [makeEpisode({ policeNotified: false, localAuthorityNotified: false, riskLevel: "low" })];
    const result = evaluateEpisodeManagement(noNotify);
    expect(result.policeNotificationRate).toBe(0);
    expect(result.localAuthorityNotificationRate).toBe(0);
  });

  it("handles mixed episodes correctly", () => {
    const result = evaluateEpisodeManagement(OAK_HOUSE_EPISODES);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.returnInterviewCompletionRate).toBe(100);
    expect(result.riskBreakdown.low).toBe(2);
    expect(result.riskBreakdown.medium).toBe(1);
    expect(result.riskBreakdown.high).toBe(1);
  });

  it("score is capped at 25", () => {
    const result = evaluateEpisodeManagement([makeEpisode({ riskLevel: "low" })]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never below 0", () => {
    const worst = [makeEpisode({
      riskLevel: "very_high",
      returnInterviewCompleted: false,
      returnInterviewTimely: false,
      policeNotified: false,
      localAuthorityNotified: false,
    })];
    const result = evaluateEpisodeManagement(worst);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("calculates correct risk breakdown with multiple episodes", () => {
    const episodes = [
      makeEpisode({ riskLevel: "low" }),
      makeEpisode({ id: "ep-2", riskLevel: "low" }),
      makeEpisode({ id: "ep-3", riskLevel: "high" }),
    ];
    const result = evaluateEpisodeManagement(episodes);
    expect(result.riskBreakdown.low).toBe(2);
    expect(result.riskBreakdown.high).toBe(1);
    expect(result.riskBreakdown.medium).toBe(0);
  });

  it("partial RI completion gives partial score", () => {
    const episodes = [
      makeEpisode({ returnInterviewCompleted: true, riskLevel: "low" }),
      makeEpisode({ id: "ep-2", returnInterviewCompleted: false, riskLevel: "low" }),
    ];
    const result = evaluateEpisodeManagement(episodes);
    expect(result.returnInterviewCompletionRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluatePreventionEffectiveness()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluatePreventionEffectiveness()", () => {
  it("returns score 25 for empty episodes (no episodes to prevent)", () => {
    const result = evaluatePreventionEffectiveness([]);
    expect(result.score).toBe(25);
  });

  it("returns zero rates for empty input", () => {
    const result = evaluatePreventionEffectiveness([]);
    expect(result.triggerIdentificationRate).toBe(0);
    expect(result.preventionPlanUpdateRate).toBe(0);
    expect(result.resolutionRate).toBe(0);
    expect(result.selfReturnRate).toBe(0);
  });

  it("scores perfect prevention (all true, resolved, self-return)", () => {
    const perfect = [makeEpisode({ outcome: "returned_self" })];
    const result = evaluatePreventionEffectiveness(perfect);
    // Trigger: 100% => 7, Plan: 100% => 6, Resolution: 100% => 6, SelfReturn: 100% => 6
    // Total: 25
    expect(result.score).toBe(25);
    expect(result.triggerIdentificationRate).toBe(100);
    expect(result.preventionPlanUpdateRate).toBe(100);
    expect(result.resolutionRate).toBe(100);
    expect(result.selfReturnRate).toBe(100);
  });

  it("penalises unresolved episodes (still_missing)", () => {
    const unresolved = [makeEpisode({
      outcome: "still_missing",
      resolvedDate: null,
      durationMinutes: null,
    })];
    const result = evaluatePreventionEffectiveness(unresolved);
    expect(result.resolutionRate).toBe(0);
    expect(result.selfReturnRate).toBe(0);
    expect(result.score).toBeLessThan(25);
  });

  it("penalises missing trigger identification", () => {
    const noTrigger = [makeEpisode({ triggerIdentified: false })];
    const result = evaluatePreventionEffectiveness(noTrigger);
    expect(result.triggerIdentificationRate).toBe(0);
  });

  it("penalises missing prevention plan updates", () => {
    const noPlan = [makeEpisode({ preventionPlanUpdated: false })];
    const result = evaluatePreventionEffectiveness(noPlan);
    expect(result.preventionPlanUpdateRate).toBe(0);
  });

  it("scores 0 when all fields are worst case", () => {
    const worst = [makeEpisode({
      triggerIdentified: false,
      preventionPlanUpdated: false,
      outcome: "still_missing",
      resolvedDate: null,
      durationMinutes: null,
    })];
    const result = evaluatePreventionEffectiveness(worst);
    expect(result.score).toBe(0);
  });

  it("handles mixed data", () => {
    const result = evaluatePreventionEffectiveness(OAK_HOUSE_EPISODES);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.resolutionRate).toBe(100);
  });

  it("calculates correct self-return rate", () => {
    const episodes = [
      makeEpisode({ outcome: "returned_self" }),
      makeEpisode({ id: "ep-2", outcome: "found_by_staff" }),
      makeEpisode({ id: "ep-3", outcome: "returned_self" }),
    ];
    const result = evaluatePreventionEffectiveness(episodes);
    expect(result.selfReturnRate).toBe(67);
  });

  it("score is capped at 25", () => {
    const result = evaluatePreventionEffectiveness([makeEpisode()]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never below 0", () => {
    const result = evaluatePreventionEffectiveness([makeEpisode({
      triggerIdentified: false,
      preventionPlanUpdated: false,
      outcome: "still_missing",
      resolvedDate: null,
      durationMinutes: null,
    })]);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateMissingPolicy()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateMissingPolicy()", () => {
  it("returns score 0 for null policy", () => {
    const result = evaluateMissingPolicy(null);
    expect(result.score).toBe(0);
    expect(result.fieldsCompliant).toBe(0);
    expect(result.totalFields).toBe(7);
    expect(result.complianceRate).toBe(0);
  });

  it("returns score 25 for fully compliant policy", () => {
    const result = evaluateMissingPolicy(makePolicy());
    expect(result.score).toBe(25);
    expect(result.fieldsCompliant).toBe(7);
    expect(result.complianceRate).toBe(100);
  });

  it("scores missingProtocolInPlace at 5 points", () => {
    const policy = makePolicy({
      riskAssessmentFramework: false,
      returnInterviewProcess: false,
      preventionStrategy: false,
      multiAgencyProtocol: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(5);
    expect(result.fieldsCompliant).toBe(1);
  });

  it("scores riskAssessmentFramework at 4 points", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      returnInterviewProcess: false,
      preventionStrategy: false,
      multiAgencyProtocol: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(4);
  });

  it("scores returnInterviewProcess at 4 points", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      riskAssessmentFramework: false,
      preventionStrategy: false,
      multiAgencyProtocol: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(4);
  });

  it("scores preventionStrategy at 4 points", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      riskAssessmentFramework: false,
      returnInterviewProcess: false,
      multiAgencyProtocol: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(4);
  });

  it("scores multiAgencyProtocol at 3 points", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      riskAssessmentFramework: false,
      returnInterviewProcess: false,
      preventionStrategy: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(3);
  });

  it("scores regularReview at 3 points", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      riskAssessmentFramework: false,
      returnInterviewProcess: false,
      preventionStrategy: false,
      multiAgencyProtocol: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(3);
  });

  it("scores staffGuidanceClear at 2 points", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      riskAssessmentFramework: false,
      returnInterviewProcess: false,
      preventionStrategy: false,
      multiAgencyProtocol: false,
      regularReview: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(2);
  });

  it("handles partial compliance", () => {
    const policy = makePolicy({
      multiAgencyProtocol: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    // 5 + 4 + 4 + 4 = 17
    expect(result.score).toBe(17);
    expect(result.fieldsCompliant).toBe(4);
  });

  it("totalFields is always 7", () => {
    expect(evaluateMissingPolicy(null).totalFields).toBe(7);
    expect(evaluateMissingPolicy(makePolicy()).totalFields).toBe(7);
  });

  it("score is capped at 25", () => {
    const result = evaluateMissingPolicy(makePolicy());
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("complianceRate is correct for partial", () => {
    const policy = makePolicy({
      multiAgencyProtocol: false,
      regularReview: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.fieldsCompliant).toBe(5);
    expect(result.complianceRate).toBe(71);
  });

  it("all-false policy scores 0", () => {
    const policy = makePolicy({
      missingProtocolInPlace: false,
      riskAssessmentFramework: false,
      returnInterviewProcess: false,
      preventionStrategy: false,
      multiAgencyProtocol: false,
      regularReview: false,
      staffGuidanceClear: false,
    });
    const result = evaluateMissingPolicy(policy);
    expect(result.score).toBe(0);
    expect(result.fieldsCompliant).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateStaffMissingReadiness()
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateStaffMissingReadiness()", () => {
  it("returns score 0 for empty training array", () => {
    const result = evaluateStaffMissingReadiness([]);
    expect(result.score).toBe(0);
    expect(result.totalStaff).toBe(0);
    expect(result.averageCompetencyRate).toBe(0);
  });

  it("returns empty competency breakdown for empty input", () => {
    const result = evaluateStaffMissingReadiness([]);
    expect(result.competencyBreakdown).toEqual({
      missingProtocol: 0,
      riskAssessment: 0,
      returnInterviews: 0,
      preventionStrategies: 0,
      multiAgencyWorking: 0,
      recordKeeping: 0,
    });
  });

  it("scores perfect training (all competencies true)", () => {
    const result = evaluateStaffMissingReadiness([makeTraining()]);
    expect(result.score).toBe(25);
    expect(result.averageCompetencyRate).toBe(100);
    expect(result.totalStaff).toBe(1);
  });

  it("scores multiple fully-trained staff at 25", () => {
    const staff = [
      makeTraining({ id: "t-1", staffId: "s-1" }),
      makeTraining({ id: "t-2", staffId: "s-2" }),
      makeTraining({ id: "t-3", staffId: "s-3" }),
    ];
    const result = evaluateStaffMissingReadiness(staff);
    expect(result.score).toBe(25);
  });

  it("penalises missing competencies", () => {
    const untrained = [makeTraining({
      missingProtocol: false,
      riskAssessment: false,
      returnInterviews: false,
      preventionStrategies: false,
      multiAgencyWorking: false,
      recordKeeping: false,
    })];
    const result = evaluateStaffMissingReadiness(untrained);
    expect(result.score).toBe(0);
    expect(result.averageCompetencyRate).toBe(0);
  });

  it("handles partial training correctly", () => {
    const partial = [makeTraining({
      missingProtocol: true,
      riskAssessment: true,
      returnInterviews: false,
      preventionStrategies: false,
      multiAgencyWorking: false,
      recordKeeping: false,
    })];
    const result = evaluateStaffMissingReadiness(partial);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(25);
    expect(result.competencyBreakdown.missingProtocol).toBe(100);
    expect(result.competencyBreakdown.returnInterviews).toBe(0);
  });

  it("handles Chamberlain House training data", () => {
    const result = evaluateStaffMissingReadiness(OAK_HOUSE_TRAINING);
    expect(result.totalStaff).toBe(4);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(25);
    // Lisa is missing returnInterviews, so returnInterviews rate = 3/4 = 75%
    expect(result.competencyBreakdown.returnInterviews).toBe(75);
    expect(result.competencyBreakdown.missingProtocol).toBe(100);
  });

  it("score is capped at 25", () => {
    const result = evaluateStaffMissingReadiness([makeTraining()]);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("score is never below 0", () => {
    const result = evaluateStaffMissingReadiness([makeTraining({
      missingProtocol: false,
      riskAssessment: false,
      returnInterviews: false,
      preventionStrategies: false,
      multiAgencyWorking: false,
      recordKeeping: false,
    })]);
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("correctly calculates average competency rate", () => {
    const half = [makeTraining({
      missingProtocol: true,
      riskAssessment: true,
      returnInterviews: true,
      preventionStrategies: false,
      multiAgencyWorking: false,
      recordKeeping: false,
    })];
    const result = evaluateStaffMissingReadiness(half);
    // 3 of 6 = 50%
    expect(result.averageCompetencyRate).toBe(50);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildChildMissingProfiles()
// ══════════════════════════════════════════════════════════════════════════════

describe("buildChildMissingProfiles()", () => {
  it("returns empty array for empty episodes", () => {
    const result = buildChildMissingProfiles([]);
    expect(result).toEqual([]);
  });

  it("builds profile for single child with single episode", () => {
    const episodes = [makeEpisode()];
    const result = buildChildMissingProfiles(episodes);
    expect(result).toHaveLength(1);
    expect(result[0].childId).toBe("child-alex");
    expect(result[0].childName).toBe("Alex");
    expect(result[0].totalEpisodes).toBe(1);
    expect(result[0].returnInterviewRate).toBe(100);
    expect(result[0].triggerIdentifiedRate).toBe(100);
  });

  it("merges episodes for the same child", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", childId: "child-alex", childName: "Alex" }),
      makeEpisode({ id: "ep-2", childId: "child-alex", childName: "Alex", riskLevel: "high" }),
    ];
    const result = buildChildMissingProfiles(episodes);
    expect(result).toHaveLength(1);
    expect(result[0].totalEpisodes).toBe(2);
    expect(result[0].highRiskEpisodes).toBe(1);
  });

  it("builds separate profiles for multiple children", () => {
    const result = buildChildMissingProfiles(OAK_HOUSE_EPISODES);
    expect(result).toHaveLength(3);
    const alex = result.find((p) => p.childId === "child-alex");
    const jordan = result.find((p) => p.childId === "child-jordan");
    const morgan = result.find((p) => p.childId === "child-morgan");
    expect(alex).toBeDefined();
    expect(jordan).toBeDefined();
    expect(morgan).toBeDefined();
    expect(alex!.totalEpisodes).toBe(2);
    expect(jordan!.totalEpisodes).toBe(1);
    expect(morgan!.totalEpisodes).toBe(1);
  });

  it("counts high risk episodes correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", riskLevel: "low" }),
      makeEpisode({ id: "ep-2", riskLevel: "high" }),
      makeEpisode({ id: "ep-3", riskLevel: "very_high" }),
    ];
    const result = buildChildMissingProfiles(episodes);
    expect(result[0].highRiskEpisodes).toBe(2);
  });

  it("calculates return interview rate correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", returnInterviewCompleted: true }),
      makeEpisode({ id: "ep-2", returnInterviewCompleted: false }),
    ];
    const result = buildChildMissingProfiles(episodes);
    expect(result[0].returnInterviewRate).toBe(50);
  });

  it("calculates trigger identification rate correctly", () => {
    const episodes = [
      makeEpisode({ id: "ep-1", triggerIdentified: true }),
      makeEpisode({ id: "ep-2", triggerIdentified: true }),
      makeEpisode({ id: "ep-3", triggerIdentified: false }),
    ];
    const result = buildChildMissingProfiles(episodes);
    expect(result[0].triggerIdentifiedRate).toBe(67);
  });

  it("overallScore is between 0 and 10", () => {
    const profiles = buildChildMissingProfiles(OAK_HOUSE_EPISODES);
    for (const p of profiles) {
      expect(p.overallScore).toBeGreaterThanOrEqual(0);
      expect(p.overallScore).toBeLessThanOrEqual(10);
    }
  });

  it("child with no high-risk, good practice gets high score", () => {
    const good = [makeEpisode({ riskLevel: "low" })];
    const result = buildChildMissingProfiles(good);
    expect(result[0].overallScore).toBeGreaterThanOrEqual(7);
  });

  it("child with many high-risk episodes gets low score", () => {
    const bad = [
      makeEpisode({ id: "ep-1", riskLevel: "very_high", returnInterviewCompleted: false, triggerIdentified: false }),
      makeEpisode({ id: "ep-2", riskLevel: "high", returnInterviewCompleted: false, triggerIdentified: false }),
      makeEpisode({ id: "ep-3", riskLevel: "high", returnInterviewCompleted: false, triggerIdentified: false }),
      makeEpisode({ id: "ep-4", riskLevel: "very_high", returnInterviewCompleted: false, triggerIdentified: false }),
    ];
    const result = buildChildMissingProfiles(bad);
    expect(result[0].overallScore).toBeLessThanOrEqual(3);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateMissingAbsentEpisodesIntelligence()
// ══════════════════════════════════════════════════════════════════════════════

describe("generateMissingAbsentEpisodesIntelligence()", () => {
  it("returns inadequate rating for empty inputs (no policy, no training)", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    // episodes: 25 + 25 + policy: 0 + training: 0 = 50 => requires_improvement
    expect(result.overallScore).toBe(50);
    expect(result.rating).toBe("requires_improvement");
  });

  it("returns outstanding for perfect inputs", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    // episodes: 25 + 25 + policy: 25 + training: 25 = 100
    expect(result.overallScore).toBe(100);
    expect(result.rating).toBe("outstanding");
  });

  it("includes homeId and period", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.homeId).toBe("oak-house");
    expect(result.periodStart).toBe("2026-01-01");
    expect(result.periodEnd).toBe("2026-05-19");
  });

  it("includes assessedAt timestamp", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.assessedAt).toBeTruthy();
  });

  it("includes all 4 evaluator results", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.episodeManagement).toBeDefined();
    expect(result.preventionEffectiveness).toBeDefined();
    expect(result.missingPolicy).toBeDefined();
    expect(result.staffReadiness).toBeDefined();
  });

  it("overall score is sum of 4 evaluators capped at 100", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    const sum =
      result.episodeManagement.score +
      result.preventionEffectiveness.score +
      result.missingPolicy.score +
      result.staffReadiness.score;
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, sum)));
  });

  it("returns correct totalEpisodes", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.totalEpisodes).toBe(4);
  });

  it("includes child profiles", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.childProfiles).toHaveLength(3);
  });

  it("generates strengths for good data", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("generates strengths when no episodes", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("No missing or absent episodes"))).toBe(true);
  });

  it("generates areas for improvement when data is poor", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [makeEpisode({
        returnInterviewCompleted: false,
        returnInterviewTimely: false,
        triggerIdentified: false,
        preventionPlanUpdated: false,
        policeNotified: false,
        localAuthorityNotified: false,
        riskLevel: "very_high",
        outcome: "still_missing",
        resolvedDate: null,
        durationMinutes: null,
      })],
      null,
      [],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("generates actions for high-risk children", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [makeEpisode({ riskLevel: "high" })],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("URGENT"))).toBe(true);
  });

  it("generates no-action message when everything is perfect with no episodes", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No immediate actions required"))).toBe(true);
  });

  it("includes all 7 regulatory links", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.regulatoryLinks).toHaveLength(7);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 12"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("CHR 2015, Reg 34"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Children Act 1989"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("Statutory guidance"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("NMS 5"))).toBe(true);
    expect(result.regulatoryLinks.some((l) => l.includes("DfE Missing Children protocol"))).toBe(true);
  });

  it("rating matches overall score", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.rating).toBe(getRating(result.overallScore));
  });

  it("overallScore is between 0 and 100", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      OAK_HOUSE_EPISODES, OAK_HOUSE_POLICY, OAK_HOUSE_TRAINING, "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("generates action for no policy", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No missing persons policy"))).toBe(true);
  });

  it("generates action for no training", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], null, [], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.actions.some((a) => a.includes("No staff training"))).toBe(true);
  });

  it("generates area for improvement about poor notification compliance", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [makeEpisode({ policeNotified: false, localAuthorityNotified: false, riskLevel: "low" })],
      makePolicy(),
      [makeTraining()],
      "oak-house",
      "2026-01-01",
      "2026-05-19",
    );
    expect(result.areasForImprovement.some((a) => a.includes("Police notification rate"))).toBe(true);
    expect(result.areasForImprovement.some((a) => a.includes("Local authority notification rate"))).toBe(true);
  });

  it("generates strength about return interview completion when high", () => {
    const episodes = [
      makeEpisode({ id: "ep-1" }),
      makeEpisode({ id: "ep-2", childId: "child-jordan", childName: "Jordan" }),
    ];
    const result = generateMissingAbsentEpisodesIntelligence(
      episodes, makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("return interview completion rate"))).toBe(true);
  });

  it("generates strength for comprehensive policy", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("policy framework"))).toBe(true);
  });

  it("generates strength for excellent staff training", () => {
    const result = generateMissingAbsentEpisodesIntelligence(
      [], makePolicy(), [makeTraining()], "oak-house", "2026-01-01", "2026-05-19",
    );
    expect(result.strengths.some((s) => s.includes("Staff training"))).toBe(true);
  });
});
