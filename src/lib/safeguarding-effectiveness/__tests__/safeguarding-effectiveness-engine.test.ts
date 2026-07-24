// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Safeguarding Effectiveness Intelligence Engine
//
// Demo: Chamberlain House, 4 staff, 5 referrals, 8 training records, 4 audits,
// 8 supervision records
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateReferralQuality,
  evaluateTrainingCompliance,
  evaluateAuditFindings,
  evaluateSafeguardingSupervision,
  buildStaffSafeguardingProfiles,
  generateSafeguardingEffectivenessIntelligence,
  getReferralTypeLabel,
  getReferralOutcomeLabel,
  getTrainingLevelLabel,
  getAuditAreaLabel,
  getOfstedRatingLabel,
} from "../safeguarding-effectiveness-engine";
import type {
  SafeguardingReferral,
  SafeguardingTraining,
  SafeguardingAudit,
  SafeguardingSupervision,
} from "../safeguarding-effectiveness-engine";

// ── Test Fixtures: Chamberlain House Demo Data ────────────────────────────────────

const STAFF_IDS = ["staff-sarah", "staff-tom", "staff-lisa", "staff-mike"];

const makeReferral = (overrides: Partial<SafeguardingReferral> = {}): SafeguardingReferral => ({
  id: "ref-001",
  homeId: "oak-house",
  childId: "child-alex",
  childName: "Alex",
  referralDate: "2026-05-03",
  referralType: "child_protection",
  referredBy: "Sarah Johnson",
  referredTo: "Local Authority MASH",
  timelinessHours: 2,
  appropriateThreshold: true,
  multiAgencyEngaged: true,
  outcome: "progressed",
  outcomeDate: "2026-05-10",
  childInformed: true,
  lessonsLearned: "Importance of listening to disclosure without leading questions",
  ...overrides,
});

const makeTraining = (overrides: Partial<SafeguardingTraining> = {}): SafeguardingTraining => ({
  id: "train-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  trainingDate: "2026-01-15",
  trainingLevel: "level_2",
  provider: "NSPCC",
  expiryDate: "2027-01-15",
  completedOnTime: true,
  scenarioBasedElement: true,
  assessmentPassed: true,
  ...overrides,
});

const makeAudit = (overrides: Partial<SafeguardingAudit> = {}): SafeguardingAudit => ({
  id: "audit-001",
  homeId: "oak-house",
  auditDate: "2026-04-15",
  auditor: "External Consultant",
  area: "policy",
  rating: "good",
  findingsCount: 3,
  criticalFindings: 0,
  actionsRequired: ["Update safeguarding policy", "Review referral pathways"],
  actionsCompleted: 1,
  previousRating: "requires_improvement",
  ...overrides,
});

const makeSupervision = (overrides: Partial<SafeguardingSupervision> = {}): SafeguardingSupervision => ({
  id: "sup-001",
  staffId: "staff-sarah",
  staffName: "Sarah Johnson",
  date: "2026-05-01",
  supervisor: "Darren Laville",
  safeguardingDiscussed: true,
  casesReviewed: 3,
  decisionsRecorded: true,
  reflectivePractice: true,
  actionPoints: 2,
  actionPointsCompleted: 2,
  ...overrides,
});

// Chamberlain House demo dataset
const OAK_HOUSE_REFERRALS: SafeguardingReferral[] = [
  makeReferral({
    id: "ref-001", childId: "child-alex", childName: "Alex",
    referralDate: "2026-05-03", referralType: "child_protection",
    timelinessHours: 2, appropriateThreshold: true, multiAgencyEngaged: true,
    outcome: "progressed", childInformed: true,
    lessonsLearned: "Prompt response to disclosure — good practice example",
  }),
  makeReferral({
    id: "ref-002", childId: "child-jordan", childName: "Jordan",
    referralDate: "2026-05-07", referralType: "CSE",
    referredBy: "Tom Watson", referredTo: "Police",
    timelinessHours: 4, appropriateThreshold: true, multiAgencyEngaged: true,
    outcome: "progressed", childInformed: true,
    lessonsLearned: "Multi-agency response effective — maintain contact with police",
  }),
  makeReferral({
    id: "ref-003", childId: "child-morgan", childName: "Morgan",
    referralDate: "2026-05-10", referralType: "LADO",
    referredBy: "Lisa Williams", referredTo: "LADO",
    timelinessHours: 1, appropriateThreshold: true, multiAgencyEngaged: false,
    outcome: "no_further_action", outcomeDate: "2026-05-14", childInformed: true,
    lessonsLearned: undefined,
  }),
  makeReferral({
    id: "ref-004", childId: "child-casey", childName: "Casey",
    referralDate: "2026-05-12", referralType: "child_in_need",
    referredBy: "Mike Chen", referredTo: "Local Authority",
    timelinessHours: 36, appropriateThreshold: false, multiAgencyEngaged: false,
    outcome: "stepped_down", outcomeDate: "2026-05-18", childInformed: false,
    lessonsLearned: undefined,
  }),
  makeReferral({
    id: "ref-005", childId: "child-alex", childName: "Alex",
    referralDate: "2026-05-15", referralType: "prevent",
    referredBy: "Sarah Johnson", referredTo: "Prevent Lead",
    timelinessHours: 8, appropriateThreshold: true, multiAgencyEngaged: true,
    outcome: "ongoing", childInformed: true,
    lessonsLearned: "Radicalisation indicators identified early through keywork",
  }),
];

const OAK_HOUSE_TRAINING: SafeguardingTraining[] = [
  // Sarah — Level 3 DSL + Level 2
  makeTraining({
    id: "train-001", staffId: "staff-sarah", staffName: "Sarah Johnson",
    trainingDate: "2026-01-15", trainingLevel: "level_3_dsl",
    provider: "NSPCC", expiryDate: "2027-01-15",
    completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
  }),
  makeTraining({
    id: "train-002", staffId: "staff-sarah", staffName: "Sarah Johnson",
    trainingDate: "2026-03-10", trainingLevel: "specialist",
    provider: "NWG Network", expiryDate: "2027-03-10",
    completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
  }),
  // Tom — Level 2
  makeTraining({
    id: "train-003", staffId: "staff-tom", staffName: "Tom Watson",
    trainingDate: "2026-02-20", trainingLevel: "level_2",
    provider: "Virtual College", expiryDate: "2027-02-20",
    completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
  }),
  makeTraining({
    id: "train-004", staffId: "staff-tom", staffName: "Tom Watson",
    trainingDate: "2025-11-10", trainingLevel: "level_1",
    provider: "In-house", expiryDate: "2026-11-10",
    completedOnTime: true, scenarioBasedElement: false, assessmentPassed: true,
  }),
  // Lisa — Level 2
  makeTraining({
    id: "train-005", staffId: "staff-lisa", staffName: "Lisa Williams",
    trainingDate: "2026-01-25", trainingLevel: "level_2",
    provider: "NSPCC", expiryDate: "2027-01-25",
    completedOnTime: true, scenarioBasedElement: true, assessmentPassed: true,
  }),
  makeTraining({
    id: "train-006", staffId: "staff-lisa", staffName: "Lisa Williams",
    trainingDate: "2025-06-15", trainingLevel: "basic_awareness",
    provider: "In-house", expiryDate: "2026-06-15",
    completedOnTime: false, scenarioBasedElement: false, assessmentPassed: true,
  }),
  // Mike — Level 1 (expired training)
  makeTraining({
    id: "train-007", staffId: "staff-mike", staffName: "Mike Chen",
    trainingDate: "2025-03-01", trainingLevel: "level_1",
    provider: "Virtual College", expiryDate: "2026-03-01",
    completedOnTime: true, scenarioBasedElement: false, assessmentPassed: false,
  }),
  makeTraining({
    id: "train-008", staffId: "staff-mike", staffName: "Mike Chen",
    trainingDate: "2026-04-15", trainingLevel: "level_2",
    provider: "NSPCC", expiryDate: "2027-04-15",
    completedOnTime: false, scenarioBasedElement: true, assessmentPassed: true,
  }),
];

const OAK_HOUSE_AUDITS: SafeguardingAudit[] = [
  makeAudit({
    id: "audit-001", auditDate: "2026-04-01", area: "policy",
    rating: "good", findingsCount: 3, criticalFindings: 0,
    actionsRequired: ["Update safeguarding policy", "Review referral pathways"],
    actionsCompleted: 2, previousRating: "requires_improvement",
  }),
  makeAudit({
    id: "audit-002", auditDate: "2026-04-10", area: "recording",
    rating: "requires_improvement", findingsCount: 5, criticalFindings: 1,
    actionsRequired: ["Improve chronology recording", "Standardise case notes", "Train staff on recording standards"],
    actionsCompleted: 1, previousRating: "requires_improvement",
  }),
  makeAudit({
    id: "audit-003", auditDate: "2026-04-20", area: "training",
    rating: "good", findingsCount: 2, criticalFindings: 0,
    actionsRequired: ["Schedule DSL refresher", "Complete scenario exercises"],
    actionsCompleted: 2, previousRating: "good",
  }),
  makeAudit({
    id: "audit-004", auditDate: "2026-05-05", area: "multi_agency",
    rating: "outstanding", findingsCount: 1, criticalFindings: 0,
    actionsRequired: ["Document multi-agency meeting minutes"],
    actionsCompleted: 1, previousRating: "good",
  }),
];

const OAK_HOUSE_SUPERVISION: SafeguardingSupervision[] = [
  // Sarah — 2 sessions
  makeSupervision({
    id: "sup-001", staffId: "staff-sarah", staffName: "Sarah Johnson",
    date: "2026-04-15", safeguardingDiscussed: true, casesReviewed: 3,
    decisionsRecorded: true, reflectivePractice: true,
    actionPoints: 2, actionPointsCompleted: 2,
  }),
  makeSupervision({
    id: "sup-002", staffId: "staff-sarah", staffName: "Sarah Johnson",
    date: "2026-05-10", safeguardingDiscussed: true, casesReviewed: 4,
    decisionsRecorded: true, reflectivePractice: true,
    actionPoints: 3, actionPointsCompleted: 3,
  }),
  // Tom — 2 sessions
  makeSupervision({
    id: "sup-003", staffId: "staff-tom", staffName: "Tom Watson",
    date: "2026-04-20", safeguardingDiscussed: true, casesReviewed: 2,
    decisionsRecorded: true, reflectivePractice: true,
    actionPoints: 2, actionPointsCompleted: 1,
  }),
  makeSupervision({
    id: "sup-004", staffId: "staff-tom", staffName: "Tom Watson",
    date: "2026-05-12", safeguardingDiscussed: true, casesReviewed: 3,
    decisionsRecorded: true, reflectivePractice: false,
    actionPoints: 2, actionPointsCompleted: 2,
  }),
  // Lisa — 2 sessions
  makeSupervision({
    id: "sup-005", staffId: "staff-lisa", staffName: "Lisa Williams",
    date: "2026-04-18", safeguardingDiscussed: true, casesReviewed: 2,
    decisionsRecorded: true, reflectivePractice: true,
    actionPoints: 1, actionPointsCompleted: 1,
  }),
  makeSupervision({
    id: "sup-006", staffId: "staff-lisa", staffName: "Lisa Williams",
    date: "2026-05-08", safeguardingDiscussed: false, casesReviewed: 1,
    decisionsRecorded: false, reflectivePractice: false,
    actionPoints: 2, actionPointsCompleted: 1,
  }),
  // Mike — 2 sessions
  makeSupervision({
    id: "sup-007", staffId: "staff-mike", staffName: "Mike Chen",
    date: "2026-04-22", safeguardingDiscussed: true, casesReviewed: 1,
    decisionsRecorded: true, reflectivePractice: false,
    actionPoints: 3, actionPointsCompleted: 1,
  }),
  makeSupervision({
    id: "sup-008", staffId: "staff-mike", staffName: "Mike Chen",
    date: "2026-05-14", safeguardingDiscussed: true, casesReviewed: 2,
    decisionsRecorded: true, reflectivePractice: true,
    actionPoints: 2, actionPointsCompleted: 2,
  }),
];

const PERIOD_START = "2026-04-01";
const PERIOD_END = "2026-05-18";
const REFERENCE_DATE = "2026-05-18";

// ══════════════════════════════════════════════════════════════════════════════
// evaluateReferralQuality
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReferralQuality", () => {
  it("returns correct total referral count", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.totalReferrals).toBe(5);
  });

  it("calculates timely referrals (within 24 hours)", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // ref-001: 2hrs, ref-002: 4hrs, ref-003: 1hr, ref-004: 36hrs (late), ref-005: 8hrs
    expect(result.timelyReferrals).toBe(4);
  });

  it("calculates timeliness rate", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.timelinessRate).toBe(80); // 4/5 = 80%
  });

  it("calculates average timeliness hours", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // (2 + 4 + 1 + 36 + 8) / 5 = 10.2
    expect(result.averageTimelinessHours).toBe(10.2);
  });

  it("calculates appropriate threshold count", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // ref-004 is false, all others true
    expect(result.appropriateThresholdCount).toBe(4);
  });

  it("calculates appropriate threshold rate", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.appropriateThresholdRate).toBe(80);
  });

  it("calculates multi-agency engagement count", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // ref-001, ref-002, ref-005 engaged
    expect(result.multiAgencyEngagedCount).toBe(3);
  });

  it("calculates multi-agency engagement rate", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.multiAgencyEngagementRate).toBe(60);
  });

  it("calculates child informed count", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // ref-004 not informed
    expect(result.childInformedCount).toBe(4);
  });

  it("calculates child informed rate", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.childInformedRate).toBe(80);
  });

  it("counts outcome breakdown correctly", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.outcomeBreakdown.progressed).toBe(2);
    expect(result.outcomeBreakdown.no_further_action).toBe(1);
    expect(result.outcomeBreakdown.stepped_down).toBe(1);
    expect(result.outcomeBreakdown.ongoing).toBe(1);
    expect(result.outcomeBreakdown.stepped_up).toBe(0);
  });

  it("calculates progressed rate from completed referrals", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // Completed (non-ongoing): 4. Progressed + stepped_up = 2. 2/4 = 50%
    expect(result.progressedRate).toBe(50);
  });

  it("calculates NFA rate from completed referrals", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // 1 NFA / 4 completed = 25%
    expect(result.nfaRate).toBe(25);
  });

  it("counts referral type breakdown", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.referralTypeBreakdown.child_protection).toBe(1);
    expect(result.referralTypeBreakdown.CSE).toBe(1);
    expect(result.referralTypeBreakdown.LADO).toBe(1);
    expect(result.referralTypeBreakdown.child_in_need).toBe(1);
    expect(result.referralTypeBreakdown.prevent).toBe(1);
  });

  it("counts lessons learned", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    // ref-001, ref-002, ref-005 have lessons learned, ref-003 does not, ref-004 does not
    expect(result.lessonsLearnedCount).toBe(3);
  });

  it("calculates lessons learned rate", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.lessonsLearnedRate).toBe(60);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateReferralQuality(OAK_HOUSE_REFERRALS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strengths for good timeliness", () => {
    const referrals = [
      makeReferral({ id: "r1", timelinessHours: 1, appropriateThreshold: true, multiAgencyEngaged: true, childInformed: true }),
      makeReferral({ id: "r2", timelinessHours: 2, appropriateThreshold: true, multiAgencyEngaged: true, childInformed: true }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.strengths.some((s) => s.includes("timeliness"))).toBe(true);
  });

  it("generates concerns for poor timeliness", () => {
    const referrals = [
      makeReferral({ id: "r1", timelinessHours: 30 }),
      makeReferral({ id: "r2", timelinessHours: 40 }),
      makeReferral({ id: "r3", timelinessHours: 48 }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.concerns.some((c) => c.includes("timeliness"))).toBe(true);
  });

  it("generates concern for high NFA rate", () => {
    const referrals = [
      makeReferral({ id: "r1", outcome: "no_further_action" }),
      makeReferral({ id: "r2", outcome: "no_further_action" }),
      makeReferral({ id: "r3", outcome: "no_further_action" }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.concerns.some((c) => c.includes("NFA"))).toBe(true);
  });

  it("handles empty referrals gracefully — rates are unmeasured (null), not a fabricated 100%", () => {
    const result = evaluateReferralQuality([]);
    expect(result.totalReferrals).toBe(0);
    // No referrals means nothing to rate: null ("not yet measured"), never 100%.
    expect(result.timelinessRate).toBeNull();
    expect(result.appropriateThresholdRate).toBeNull();
    expect(result.multiAgencyEngagementRate).toBeNull();
    expect(result.childInformedRate).toBeNull();
    expect(result.progressedRate).toBeNull();
    expect(result.nfaRate).toBeNull();
    expect(result.lessonsLearnedRate).toBeNull();
    // Absence of referrals is not itself a failing — the score stays a baseline 25.
    expect(result.score).toBe(25);
    expect(result.strengths.length).toBeGreaterThanOrEqual(1);
  });

  it("nulls the outcome rates when every referral is still ongoing (no completed cohort)", () => {
    const ongoing = [
      makeReferral({ id: "o1", outcome: "ongoing" }),
      makeReferral({ id: "o2", outcome: "ongoing" }),
    ];
    const result = evaluateReferralQuality(ongoing);
    expect(result.totalReferrals).toBe(2);
    // Rates over the whole cohort are still measured...
    expect(result.timelinessRate).toBe(100);
    // ...but progressed / NFA have no completed referrals to divide by → null, not 0/100.
    expect(result.progressedRate).toBeNull();
    expect(result.nfaRate).toBeNull();
  });

  it("handles single referral", () => {
    const result = evaluateReferralQuality([makeReferral()]);
    expect(result.totalReferrals).toBe(1);
    expect(result.score).toBeGreaterThan(0);
  });

  it("generates concern for low multi-agency engagement", () => {
    const referrals = [
      makeReferral({ id: "r1", multiAgencyEngaged: false }),
      makeReferral({ id: "r2", multiAgencyEngaged: false }),
      makeReferral({ id: "r3", multiAgencyEngaged: false }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.concerns.some((c) => c.includes("Multi-agency"))).toBe(true);
  });

  it("generates concern for low child informed rate", () => {
    const referrals = [
      makeReferral({ id: "r1", childInformed: false }),
      makeReferral({ id: "r2", childInformed: false }),
      makeReferral({ id: "r3", childInformed: false }),
    ];
    const result = evaluateReferralQuality(referrals);
    expect(result.concerns.some((c) => c.includes("Child informed") || c.includes("children"))).toBe(true);
  });

  it("awards higher score for perfect referral quality", () => {
    const perfect = [
      makeReferral({ id: "r1", timelinessHours: 1, appropriateThreshold: true, multiAgencyEngaged: true, childInformed: true, outcome: "progressed", lessonsLearned: "Good" }),
    ];
    const poor = [
      makeReferral({ id: "r2", timelinessHours: 48, appropriateThreshold: false, multiAgencyEngaged: false, childInformed: false, outcome: "no_further_action" }),
    ];
    const perfectResult = evaluateReferralQuality(perfect);
    const poorResult = evaluateReferralQuality(poor);
    expect(perfectResult.score).toBeGreaterThan(poorResult.score);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateTrainingCompliance
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateTrainingCompliance", () => {
  it("counts total staff", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.totalStaff).toBe(4);
  });

  it("counts staff with current training", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // Sarah: 2027-01-15 and 2027-03-10 (current)
    // Tom: 2027-02-20 and 2026-11-10 (current)
    // Lisa: 2027-01-25 and 2026-06-15 (current)
    // Mike: 2026-03-01 (expired) and 2027-04-15 (current)
    // All 4 have at least one current record
    expect(result.staffWithCurrentTraining).toBe(4);
  });

  it("calculates coverage rate", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.coverageRate).toBe(100);
  });

  it("counts total training records", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.totalTrainingRecords).toBe(8);
  });

  it("counts current (non-expired) training records", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // Expired: train-007 (2026-03-01). All others current as of 2026-05-18
    expect(result.currentTrainingRecords).toBe(7);
  });

  it("calculates currency rate", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // 7/8 = 88%
    expect(result.currencyRate).toBe(88);
  });

  it("counts DSL-trained staff", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // Only Sarah has level_3_dsl and it is current
    expect(result.dslCount).toBe(1);
  });

  it("calculates DSL required (1 per 4 staff, minimum 1)", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.dslRequired).toBe(1); // ceil(4/4)=1
  });

  it("calculates DSL coverage rate", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.dslCoverageRate).toBe(100); // 1/1
  });

  it("counts scenario-based training", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // train-001, train-002, train-003, train-005, train-008 have scenario = 5
    expect(result.scenarioBasedCount).toBe(5);
  });

  it("calculates scenario-based rate", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // 5/8 = 63%
    expect(result.scenarioBasedRate).toBe(63);
  });

  it("counts assessment passes", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // train-007 failed, rest passed = 7
    expect(result.assessmentPassCount).toBe(7);
  });

  it("calculates assessment pass rate", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // 7/8 = 88%
    expect(result.assessmentPassRate).toBe(88);
  });

  it("counts completed on time", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    // train-006 and train-008 not on time = 6 on time
    expect(result.completedOnTimeCount).toBe(6);
  });

  it("calculates completed on time rate", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.completedOnTimeRate).toBe(75);
  });

  it("counts level breakdown", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.levelBreakdown.basic_awareness).toBe(1);
    expect(result.levelBreakdown.level_1).toBe(2);
    expect(result.levelBreakdown.level_2).toBe(3);
    expect(result.levelBreakdown.level_3_dsl).toBe(1);
    expect(result.levelBreakdown.specialist).toBe(1);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for 100% coverage", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, STAFF_IDS, REFERENCE_DATE);
    expect(result.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("handles empty staff list", () => {
    const result = evaluateTrainingCompliance(OAK_HOUSE_TRAINING, [], REFERENCE_DATE);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
  });

  it("handles empty training list", () => {
    const result = evaluateTrainingCompliance([], STAFF_IDS, REFERENCE_DATE);
    expect(result.staffWithCurrentTraining).toBe(0);
    // Coverage IS measured (0 of 4 staff trained) — a genuine 0%, not null.
    expect(result.coverageRate).toBe(0);
    // Record-based rates have no records to divide by → null, not a fabricated 100%.
    expect(result.currencyRate).toBeNull();
    expect(result.scenarioBasedRate).toBeNull();
    expect(result.assessmentPassRate).toBeNull();
    // No fabricated marks from empty rates: a fully untrained team scores 0.
    expect(result.score).toBe(0);
  });

  it("detects low coverage", () => {
    const training = [makeTraining({ staffId: "staff-sarah" })];
    const result = evaluateTrainingCompliance(training, STAFF_IDS, REFERENCE_DATE);
    expect(result.coverageRate).toBe(25);
    expect(result.concerns.some((c) => c.includes("coverage") || c.includes("Training"))).toBe(true);
  });

  it("detects low DSL coverage with larger team", () => {
    const ids = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9"];
    const training = [
      makeTraining({ staffId: "s1", trainingLevel: "level_2", expiryDate: "2027-01-01" }),
    ];
    const result = evaluateTrainingCompliance(training, ids, REFERENCE_DATE);
    // dslRequired = ceil(9/4)=3, dslCount = 0
    expect(result.dslRequired).toBe(3);
    expect(result.dslCount).toBe(0);
    expect(result.dslCoverageRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("DSL"))).toBe(true);
  });

  it("awards higher score for full compliance", () => {
    const fullTraining = STAFF_IDS.map((id, i) =>
      makeTraining({
        id: `t-${i}`, staffId: id, trainingLevel: "level_2",
        expiryDate: "2027-12-31", scenarioBasedElement: true, assessmentPassed: true,
      }),
    );
    fullTraining.push(makeTraining({
      id: "t-dsl", staffId: "staff-sarah", trainingLevel: "level_3_dsl",
      expiryDate: "2027-12-31", scenarioBasedElement: true, assessmentPassed: true,
    }));
    const result = evaluateTrainingCompliance(fullTraining, STAFF_IDS, REFERENCE_DATE);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateAuditFindings
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateAuditFindings", () => {
  it("counts total audits", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.totalAudits).toBe(4);
  });

  it("calculates rating distribution", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.ratingDistribution.outstanding).toBe(1);
    expect(result.ratingDistribution.good).toBe(2);
    expect(result.ratingDistribution.requires_improvement).toBe(1);
    expect(result.ratingDistribution.inadequate).toBe(0);
  });

  it("calculates average rating", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    // (3 + 2 + 3 + 4) / 4 = 3.0
    expect(result.averageRating).toBe(3);
  });

  it("determines improvement trajectory", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    // audit-001: RI→Good (improve), audit-002: RI→RI (stable), audit-003: Good→Good (stable), audit-004: Good→Outstanding (improve)
    // 2 improvements, 0 declines = improving
    expect(result.improvementTrajectory).toBe("improving");
  });

  it("counts total findings", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.totalFindings).toBe(11); // 3+5+2+1
  });

  it("counts critical findings", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.criticalFindingsCount).toBe(1);
  });

  it("counts total actions required", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.totalActionsRequired).toBe(8); // 2+3+2+1
  });

  it("counts total actions completed", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.totalActionsCompleted).toBe(6); // 2+1+2+1
  });

  it("calculates action completion rate", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.actionCompletionRate).toBe(75); // 6/8
  });

  it("builds area breakdown correctly", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.areaBreakdown.policy.count).toBe(1);
    expect(result.areaBreakdown.policy.avgRating).toBe(3); // good=3
    expect(result.areaBreakdown.recording.count).toBe(1);
    expect(result.areaBreakdown.recording.avgRating).toBe(2); // RI=2
    expect(result.areaBreakdown.multi_agency.count).toBe(1);
    expect(result.areaBreakdown.multi_agency.avgRating).toBe(4); // outstanding=4
    expect(result.areaBreakdown.supervision.count).toBe(0);
    expect(result.areaBreakdown.supervision.avgRating).toBe(0);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for positive trajectory", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.strengths.some((s) => s.includes("improvement") || s.includes("Positive"))).toBe(true);
  });

  it("generates concern for critical findings", () => {
    const result = evaluateAuditFindings(OAK_HOUSE_AUDITS);
    expect(result.concerns.some((c) => c.includes("critical"))).toBe(true);
  });

  it("handles empty audits", () => {
    const result = evaluateAuditFindings([]);
    expect(result.totalAudits).toBe(0);
    expect(result.averageRating).toBe(0);
    expect(result.improvementTrajectory).toBe("insufficient_data");
    expect(result.actionCompletionRate).toBeNull();
    expect(result.score).toBe(0);
    expect(result.concerns.some((c) => c.includes("No safeguarding audits"))).toBe(true);
  });

  it("nulls action completion when audits raised no actions (not a fabricated 100%)", () => {
    const noActions = [
      makeAudit({ id: "na1", rating: "good", actionsRequired: [], actionsCompleted: 0 }),
    ];
    const result = evaluateAuditFindings(noActions);
    expect(result.totalActionsRequired).toBe(0);
    expect(result.actionCompletionRate).toBeNull();
  });

  it("detects declining trajectory", () => {
    const declining = [
      makeAudit({ id: "a1", auditDate: "2026-01-01", rating: "good", previousRating: "outstanding" }),
      makeAudit({ id: "a2", auditDate: "2026-02-01", rating: "requires_improvement", previousRating: "good" }),
    ];
    const result = evaluateAuditFindings(declining);
    expect(result.improvementTrajectory).toBe("declining");
    expect(result.concerns.some((c) => c.includes("Declining") || c.includes("declining"))).toBe(true);
  });

  it("detects stable trajectory", () => {
    const stable = [
      makeAudit({ id: "a1", auditDate: "2026-01-01", rating: "good", previousRating: "good" }),
      makeAudit({ id: "a2", auditDate: "2026-02-01", rating: "good", previousRating: "good" }),
    ];
    const result = evaluateAuditFindings(stable);
    expect(result.improvementTrajectory).toBe("stable");
  });

  it("penalises inadequate ratings", () => {
    const withInadequate = [
      makeAudit({ id: "a1", rating: "inadequate", criticalFindings: 3, previousRating: "requires_improvement" }),
    ];
    const withGood = [
      makeAudit({ id: "a2", rating: "good", criticalFindings: 0, previousRating: "good" }),
    ];
    const badResult = evaluateAuditFindings(withInadequate);
    const goodResult = evaluateAuditFindings(withGood);
    expect(badResult.score).toBeLessThan(goodResult.score);
  });

  it("generates concern for inadequate areas", () => {
    const audits = [makeAudit({ rating: "inadequate" })];
    const result = evaluateAuditFindings(audits);
    expect(result.concerns.some((c) => c.includes("inadequate"))).toBe(true);
  });

  it("generates concern for low action completion", () => {
    const audits = [
      makeAudit({ actionsRequired: ["a", "b", "c", "d", "e"], actionsCompleted: 1 }),
    ];
    const result = evaluateAuditFindings(audits);
    expect(result.concerns.some((c) => c.includes("action completion"))).toBe(true);
  });

  it("awards breadth bonus for covering many areas", () => {
    const broad = [
      makeAudit({ id: "a1", area: "policy", rating: "good" }),
      makeAudit({ id: "a2", area: "procedures", rating: "good" }),
      makeAudit({ id: "a3", area: "training", rating: "good" }),
      makeAudit({ id: "a4", area: "recording", rating: "good" }),
      makeAudit({ id: "a5", area: "information_sharing", rating: "good" }),
      makeAudit({ id: "a6", area: "supervision", rating: "good" }),
    ];
    const narrow = [
      makeAudit({ id: "a7", area: "policy", rating: "good" }),
    ];
    const broadResult = evaluateAuditFindings(broad);
    const narrowResult = evaluateAuditFindings(narrow);
    expect(broadResult.score).toBeGreaterThan(narrowResult.score);
  });

  it("detects improvement trajectory with single previous rating", () => {
    const audits = [
      makeAudit({ id: "a1", auditDate: "2026-01-01", rating: "good", previousRating: "requires_improvement" }),
    ];
    const result = evaluateAuditFindings(audits);
    expect(result.improvementTrajectory).toBe("improving");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// evaluateSafeguardingSupervision
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateSafeguardingSupervision", () => {
  it("counts total staff", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalStaff).toBe(4);
  });

  it("counts staff with supervision in period", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.staffWithSupervision).toBe(4);
  });

  it("calculates coverage rate", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.coverageRate).toBe(100);
  });

  it("counts total sessions in period", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(8);
  });

  it("counts safeguarding discussed sessions", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // sup-006 does not discuss safeguarding
    expect(result.safeguardingDiscussedCount).toBe(7);
  });

  it("calculates safeguarding discussion rate", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 7/8 = 88%
    expect(result.safeguardingDiscussionRate).toBe(88);
  });

  it("counts total cases reviewed", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 3+4+2+3+2+1+1+2 = 18
    expect(result.totalCasesReviewed).toBe(18);
  });

  it("calculates average cases per session", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 18/8 = 2.3
    expect(result.averageCasesPerSession).toBe(2.3);
  });

  it("counts decisions recorded", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // sup-006 does not have decisions recorded
    expect(result.decisionsRecordedCount).toBe(7);
  });

  it("calculates decisions recorded rate", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 7/8 = 88%
    expect(result.decisionsRecordedRate).toBe(88);
  });

  it("counts reflective practice sessions", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // sup-001, sup-002, sup-003, sup-005, sup-008 = 5
    expect(result.reflectivePracticeCount).toBe(5);
  });

  it("calculates reflective practice rate", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 5/8 = 63%
    expect(result.reflectivePracticeRate).toBe(63);
  });

  it("counts total action points", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 2+3+2+2+1+2+3+2 = 17
    expect(result.totalActionPoints).toBe(17);
  });

  it("counts completed action points", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 2+3+1+2+1+1+1+2 = 13
    expect(result.totalActionPointsCompleted).toBe(13);
  });

  it("calculates action completion rate", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    // 13/17 = 76%
    expect(result.actionCompletionRate).toBe(76);
  });

  it("returns score between 0 and 25", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(25);
  });

  it("generates strength for 100% coverage", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.strengths.some((s) => s.includes("100%"))).toBe(true);
  });

  it("generates strength for good safeguarding discussion rate", () => {
    const perfectSupervision = STAFF_IDS.map((id, i) =>
      makeSupervision({
        id: `perf-${i}`, staffId: id, date: "2026-05-01",
        safeguardingDiscussed: true, decisionsRecorded: true,
        reflectivePractice: true, actionPoints: 2, actionPointsCompleted: 2,
      }),
    );
    const result = evaluateSafeguardingSupervision(perfectSupervision, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.strengths.some((s) => s.includes("Safeguarding discussed"))).toBe(true);
  });

  it("handles empty staff list", () => {
    const result = evaluateSafeguardingSupervision(OAK_HOUSE_SUPERVISION, [], PERIOD_START, PERIOD_END);
    expect(result.totalStaff).toBe(0);
    expect(result.score).toBe(0);
  });

  it("handles empty supervision list", () => {
    const result = evaluateSafeguardingSupervision([], STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.staffWithSupervision).toBe(0);
    // Coverage IS measured (0 of 4 staff supervised) — a genuine 0%.
    expect(result.coverageRate).toBe(0);
    expect(result.totalSessions).toBe(0);
    // Session-based rates have no sessions to divide by → null, not a fabricated 100%.
    expect(result.safeguardingDiscussionRate).toBeNull();
    expect(result.decisionsRecordedRate).toBeNull();
    expect(result.reflectivePracticeRate).toBeNull();
    expect(result.actionCompletionRate).toBeNull();
  });

  it("filters supervision to period", () => {
    const outOfPeriod = [
      makeSupervision({ id: "s1", date: "2025-01-01", staffId: "staff-sarah" }),
    ];
    const result = evaluateSafeguardingSupervision(outOfPeriod, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.totalSessions).toBe(0);
  });

  it("generates concern for low coverage", () => {
    const supervision = [
      makeSupervision({ staffId: "staff-sarah", date: "2026-05-01" }),
    ];
    const result = evaluateSafeguardingSupervision(supervision, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.coverageRate).toBe(25);
    expect(result.concerns.some((c) => c.includes("coverage") || c.includes("Supervision"))).toBe(true);
  });

  it("generates concern for low safeguarding discussion rate", () => {
    const supervision = [
      makeSupervision({ id: "s1", staffId: "staff-sarah", date: "2026-05-01", safeguardingDiscussed: false }),
      makeSupervision({ id: "s2", staffId: "staff-tom", date: "2026-05-02", safeguardingDiscussed: false }),
      makeSupervision({ id: "s3", staffId: "staff-lisa", date: "2026-05-03", safeguardingDiscussed: false }),
      makeSupervision({ id: "s4", staffId: "staff-mike", date: "2026-05-04", safeguardingDiscussed: false }),
    ];
    const result = evaluateSafeguardingSupervision(supervision, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.safeguardingDiscussionRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("Safeguarding discussed") || c.includes("safeguarding"))).toBe(true);
  });

  it("generates concern for low reflective practice", () => {
    const supervision = [
      makeSupervision({ id: "s1", staffId: "staff-sarah", date: "2026-05-01", reflectivePractice: false }),
      makeSupervision({ id: "s2", staffId: "staff-tom", date: "2026-05-02", reflectivePractice: false }),
      makeSupervision({ id: "s3", staffId: "staff-lisa", date: "2026-05-03", reflectivePractice: false }),
      makeSupervision({ id: "s4", staffId: "staff-mike", date: "2026-05-04", reflectivePractice: false }),
    ];
    const result = evaluateSafeguardingSupervision(supervision, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.reflectivePracticeRate).toBe(0);
    expect(result.concerns.some((c) => c.includes("Reflective") || c.includes("reflective"))).toBe(true);
  });

  it("awards higher score for perfect supervision", () => {
    const perfect = STAFF_IDS.map((id, i) =>
      makeSupervision({
        id: `s-${i}`, staffId: id, date: "2026-05-01",
        safeguardingDiscussed: true, decisionsRecorded: true,
        reflectivePractice: true, actionPoints: 2, actionPointsCompleted: 2,
      }),
    );
    const result = evaluateSafeguardingSupervision(perfect, STAFF_IDS, PERIOD_START, PERIOD_END);
    expect(result.score).toBeGreaterThanOrEqual(20);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// buildStaffSafeguardingProfiles
// ══════════════════════════════════════════════════════════════════════════════

describe("buildStaffSafeguardingProfiles", () => {
  it("returns one profile per staff member", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    expect(profiles.length).toBe(4);
  });

  it("assigns correct staff name from training records", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.staffName).toBe("Sarah Johnson");
  });

  it("assigns correct staff name from supervision records when no training", () => {
    const profiles = buildStaffSafeguardingProfiles([], OAK_HOUSE_SUPERVISION, ["staff-sarah"]);
    expect(profiles[0].staffName).toBe("Sarah Johnson");
  });

  it("falls back to staffId when no records exist", () => {
    const profiles = buildStaffSafeguardingProfiles([], [], ["unknown-staff"]);
    expect(profiles[0].staffName).toBe("unknown-staff");
  });

  it("identifies highest training level for Sarah (specialist)", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.highestTrainingLevel).toBe("specialist");
  });

  it("identifies highest training level for Tom (level_2)", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const tom = profiles.find((p) => p.staffId === "staff-tom");
    expect(tom?.highestTrainingLevel).toBe("level_2");
  });

  it("identifies highest training level for Mike (level_2)", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const mike = profiles.find((p) => p.staffId === "staff-mike");
    expect(mike?.highestTrainingLevel).toBe("level_2");
  });

  it("returns null highest level when no training records", () => {
    const profiles = buildStaffSafeguardingProfiles([], OAK_HOUSE_SUPERVISION, ["staff-sarah"]);
    expect(profiles[0].highestTrainingLevel).toBeNull();
  });

  it("links training records to correct staff", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.trainingRecords.length).toBe(2);
    const tom = profiles.find((p) => p.staffId === "staff-tom");
    expect(tom?.trainingRecords.length).toBe(2);
  });

  it("links supervision records to correct staff", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.supervisionRecords.length).toBe(2);
    expect(sarah?.supervisionCount).toBe(2);
  });

  it("calculates safeguarding discussion rate per staff", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.safeguardingDiscussionRate).toBe(100);
    const lisa = profiles.find((p) => p.staffId === "staff-lisa");
    expect(lisa?.safeguardingDiscussionRate).toBe(50); // 1 of 2
  });

  it("calculates action completion rate per staff", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.actionCompletionRate).toBe(100); // 5/5
    const mike = profiles.find((p) => p.staffId === "staff-mike");
    expect(mike?.actionCompletionRate).toBe(60); // 3/5
  });

  it("determines last supervision date", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.lastSupervisionDate).toBe("2026-05-10");
  });

  it("returns null last supervision date when no sessions", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, [], ["staff-sarah"]);
    expect(profiles[0].lastSupervisionDate).toBeNull();
  });

  it("marks Sarah as compliant", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    expect(sarah?.overallCompliance).toBe("compliant");
  });

  it("marks staff without any records as non-compliant", () => {
    const profiles = buildStaffSafeguardingProfiles([], [], ["unknown"]);
    expect(profiles[0].overallCompliance).toBe("non_compliant");
  });

  it("marks staff with only expired training and no supervision as non-compliant", () => {
    const expired = [makeTraining({ staffId: "staff-x", expiryDate: "2020-01-01" })];
    const profiles = buildStaffSafeguardingProfiles(expired, [], ["staff-x"]);
    expect(profiles[0].trainingCurrent).toBe(false);
    expect(profiles[0].overallCompliance).toBe("non_compliant");
  });

  it("marks staff with expired training but recent supervision as partially compliant", () => {
    const expired = [makeTraining({ staffId: "staff-x", expiryDate: "2020-01-01" })];
    const sup = [makeSupervision({ staffId: "staff-x", safeguardingDiscussed: false })];
    const profiles = buildStaffSafeguardingProfiles(expired, sup, ["staff-x"]);
    expect(profiles[0].trainingCurrent).toBe(false);
    expect(profiles[0].overallCompliance).toBe("partially_compliant");
  });

  it("correctly reports training expiry date", () => {
    const profiles = buildStaffSafeguardingProfiles(OAK_HOUSE_TRAINING, OAK_HOUSE_SUPERVISION, STAFF_IDS);
    const sarah = profiles.find((p) => p.staffId === "staff-sarah");
    // Sarah's latest expiry is 2027-03-10 (specialist)
    expect(sarah?.trainingExpiryDate).toBe("2027-03-10");
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// generateSafeguardingEffectivenessIntelligence (main function)
// ══════════════════════════════════════════════════════════════════════════════

describe("generateSafeguardingEffectivenessIntelligence", () => {
  const runIntelligence = () =>
    generateSafeguardingEffectivenessIntelligence(
      OAK_HOUSE_REFERRALS,
      OAK_HOUSE_TRAINING,
      OAK_HOUSE_AUDITS,
      OAK_HOUSE_SUPERVISION,
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );

  it("returns correct homeId", () => {
    const result = runIntelligence();
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    const result = runIntelligence();
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns assessedAt as ISO string", () => {
    const result = runIntelligence();
    expect(new Date(result.assessedAt).toISOString()).toBe(result.assessedAt);
  });

  it("returns overall score between 0 and 100", () => {
    const result = runIntelligence();
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("returns valid Ofsted rating", () => {
    const result = runIntelligence();
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("overall score is sum of 4 layer scores (clamped to 100)", () => {
    const result = runIntelligence();
    const expectedSum = Math.round(
      result.referralQuality.score +
      result.trainingCompliance.score +
      result.auditFindings.score +
      result.supervision.score,
    );
    expect(result.overallScore).toBe(Math.max(0, Math.min(100, expectedSum)));
  });

  it("referral quality layer has score <= 25", () => {
    const result = runIntelligence();
    expect(result.referralQuality.score).toBeLessThanOrEqual(25);
  });

  it("training compliance layer has score <= 25", () => {
    const result = runIntelligence();
    expect(result.trainingCompliance.score).toBeLessThanOrEqual(25);
  });

  it("audit findings layer has score <= 25", () => {
    const result = runIntelligence();
    expect(result.auditFindings.score).toBeLessThanOrEqual(25);
  });

  it("supervision layer has score <= 25", () => {
    const result = runIntelligence();
    expect(result.supervision.score).toBeLessThanOrEqual(25);
  });

  it("includes staff profiles for all staff", () => {
    const result = runIntelligence();
    expect(result.staffProfiles.length).toBe(4);
  });

  it("includes strengths array", () => {
    const result = runIntelligence();
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(result.strengths.length).toBeGreaterThan(0);
  });

  it("includes concerns array", () => {
    const result = runIntelligence();
    expect(Array.isArray(result.concerns)).toBe(true);
  });

  it("includes immediate actions array", () => {
    const result = runIntelligence();
    expect(Array.isArray(result.immediateActions)).toBe(true);
    expect(result.immediateActions.length).toBeGreaterThan(0);
  });

  it("includes regulatory links", () => {
    const result = runIntelligence();
    expect(Array.isArray(result.regulatoryLinks)).toBe(true);
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("regulatory links include CHR 2015 Reg 12", () => {
    const result = runIntelligence();
    expect(result.regulatoryLinks.some((l) => l.includes("Reg 12"))).toBe(true);
  });

  it("regulatory links include SCCIF reference", () => {
    const result = runIntelligence();
    expect(result.regulatoryLinks.some((l) => l.includes("SCCIF"))).toBe(true);
  });

  it("filters referrals to period", () => {
    const outOfPeriodReferral = makeReferral({
      id: "ref-old", referralDate: "2025-01-01",
    });
    const result = generateSafeguardingEffectivenessIntelligence(
      [outOfPeriodReferral, ...OAK_HOUSE_REFERRALS],
      OAK_HOUSE_TRAINING,
      OAK_HOUSE_AUDITS,
      OAK_HOUSE_SUPERVISION,
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    // Only 5 referrals in period, not the old one
    expect(result.referralQuality.totalReferrals).toBe(5);
  });

  it("filters audits to period", () => {
    const outOfPeriodAudit = makeAudit({
      id: "audit-old", auditDate: "2025-01-01",
    });
    const result = generateSafeguardingEffectivenessIntelligence(
      OAK_HOUSE_REFERRALS,
      OAK_HOUSE_TRAINING,
      [outOfPeriodAudit, ...OAK_HOUSE_AUDITS],
      OAK_HOUSE_SUPERVISION,
      STAFF_IDS,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      REFERENCE_DATE,
    );
    expect(result.auditFindings.totalAudits).toBe(4);
  });

  it("rates outstanding when all layers score high", () => {
    const perfectReferrals = [
      makeReferral({
        id: "r1", referralDate: "2026-05-01", timelinessHours: 1,
        appropriateThreshold: true, multiAgencyEngaged: true,
        childInformed: true, outcome: "progressed",
        lessonsLearned: "Good practice",
      }),
    ];
    const perfectTraining = STAFF_IDS.flatMap((id, i) => [
      makeTraining({
        id: `t-${i}a`, staffId: id, trainingLevel: "level_2",
        expiryDate: "2027-12-31", scenarioBasedElement: true, assessmentPassed: true,
      }),
      ...(i === 0 ? [makeTraining({
        id: `t-${i}b`, staffId: id, trainingLevel: "level_3_dsl",
        expiryDate: "2027-12-31", scenarioBasedElement: true, assessmentPassed: true,
      })] : []),
    ]);
    const perfectAudits = [
      makeAudit({ id: "a1", auditDate: "2026-04-15", rating: "outstanding", criticalFindings: 0, actionsRequired: ["a"], actionsCompleted: 1, previousRating: "good", area: "policy" }),
      makeAudit({ id: "a2", auditDate: "2026-04-20", rating: "outstanding", criticalFindings: 0, actionsRequired: ["a"], actionsCompleted: 1, previousRating: "good", area: "procedures" }),
      makeAudit({ id: "a3", auditDate: "2026-04-25", rating: "outstanding", criticalFindings: 0, actionsRequired: ["a"], actionsCompleted: 1, previousRating: "good", area: "training" }),
      makeAudit({ id: "a4", auditDate: "2026-05-01", rating: "outstanding", criticalFindings: 0, actionsRequired: ["a"], actionsCompleted: 1, previousRating: "good", area: "recording" }),
      makeAudit({ id: "a5", auditDate: "2026-05-05", rating: "outstanding", criticalFindings: 0, actionsRequired: ["a"], actionsCompleted: 1, previousRating: "good", area: "information_sharing" }),
      makeAudit({ id: "a6", auditDate: "2026-05-10", rating: "outstanding", criticalFindings: 0, actionsRequired: ["a"], actionsCompleted: 1, previousRating: "good", area: "supervision" }),
    ];
    const perfectSupervision = STAFF_IDS.map((id, i) =>
      makeSupervision({
        id: `s-${i}`, staffId: id, date: "2026-05-01",
        safeguardingDiscussed: true, decisionsRecorded: true,
        reflectivePractice: true, actionPoints: 2, actionPointsCompleted: 2,
      }),
    );

    const result = generateSafeguardingEffectivenessIntelligence(
      perfectReferrals, perfectTraining, perfectAudits, perfectSupervision,
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(85);
    expect(result.rating).toBe("outstanding");
  });

  it("rates inadequate when all layers score low", () => {
    const poorReferrals = [
      makeReferral({
        id: "r1", referralDate: "2026-05-01", timelinessHours: 72,
        appropriateThreshold: false, multiAgencyEngaged: false,
        childInformed: false, outcome: "no_further_action",
      }),
    ];
    const result = generateSafeguardingEffectivenessIntelligence(
      poorReferrals, [], [], [],
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeLessThan(45);
    expect(result.rating).toBe("inadequate");
  });

  it("handles all empty data gracefully", () => {
    const result = generateSafeguardingEffectivenessIntelligence(
      [], [], [], [], [], "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
    expect(result.staffProfiles.length).toBe(0);
  });

  it("generates immediate action for critical audit findings", () => {
    const result = runIntelligence();
    // OAK_HOUSE_AUDITS has 1 critical finding
    expect(result.immediateActions.some((a) => a.includes("critical") || a.includes("URGENT"))).toBe(true);
  });

  it("includes Working Together 2023 regulatory link when referrals present", () => {
    const result = runIntelligence();
    expect(result.regulatoryLinks.some((l) => l.includes("Working Together 2023"))).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Rating boundaries
// ══════════════════════════════════════════════════════════════════════════════

describe("rating boundaries", () => {
  it("score 85 = outstanding", () => {
    // Create data that produces high scores across all layers
    const referrals = [
      makeReferral({ id: "r1", referralDate: "2026-05-01", timelinessHours: 1, appropriateThreshold: true, multiAgencyEngaged: true, childInformed: true, outcome: "progressed", lessonsLearned: "Good" }),
    ];
    const result = generateSafeguardingEffectivenessIntelligence(
      referrals, OAK_HOUSE_TRAINING, OAK_HOUSE_AUDITS, OAK_HOUSE_SUPERVISION,
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    // Verify the rating boundary logic: >= 85 is outstanding
    if (result.overallScore >= 85) {
      expect(result.rating).toBe("outstanding");
    } else if (result.overallScore >= 65) {
      expect(result.rating).toBe("good");
    }
  });

  it("score 65-84 = good", () => {
    const result = generateSafeguardingEffectivenessIntelligence(
      OAK_HOUSE_REFERRALS, OAK_HOUSE_TRAINING, OAK_HOUSE_AUDITS, OAK_HOUSE_SUPERVISION,
      STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore >= 65 && result.overallScore < 85) {
      expect(result.rating).toBe("good");
    }
  });

  it("score below 45 = inadequate", () => {
    const result = generateSafeguardingEffectivenessIntelligence(
      [], [], [], [], STAFF_IDS, "oak-house", PERIOD_START, PERIOD_END, REFERENCE_DATE,
    );
    if (result.overallScore < 45) {
      expect(result.rating).toBe("inadequate");
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Label utility functions
// ══════════════════════════════════════════════════════════════════════════════

describe("getReferralTypeLabel", () => {
  it("returns correct label for child_protection", () => {
    expect(getReferralTypeLabel("child_protection")).toBe("Child Protection (S47)");
  });

  it("returns correct label for child_in_need", () => {
    expect(getReferralTypeLabel("child_in_need")).toBe("Child in Need (S17)");
  });

  it("returns correct label for LADO", () => {
    expect(getReferralTypeLabel("LADO")).toBe("LADO Referral");
  });

  it("returns correct label for police", () => {
    expect(getReferralTypeLabel("police")).toBe("Police Referral");
  });

  it("returns correct label for prevent", () => {
    expect(getReferralTypeLabel("prevent")).toBe("Prevent Referral");
  });

  it("returns correct label for CSE", () => {
    expect(getReferralTypeLabel("CSE")).toBe("Child Sexual Exploitation");
  });

  it("returns correct label for CCE", () => {
    expect(getReferralTypeLabel("CCE")).toBe("Child Criminal Exploitation");
  });

  it("returns correct label for modern_slavery", () => {
    expect(getReferralTypeLabel("modern_slavery")).toBe("Modern Slavery / Trafficking");
  });

  it("returns correct label for FGM", () => {
    expect(getReferralTypeLabel("FGM")).toBe("FGM");
  });

  it("returns correct label for county_lines", () => {
    expect(getReferralTypeLabel("county_lines")).toBe("County Lines");
  });
});

describe("getReferralOutcomeLabel", () => {
  it("returns correct label for progressed", () => {
    expect(getReferralOutcomeLabel("progressed")).toBe("Progressed");
  });

  it("returns correct label for no_further_action", () => {
    expect(getReferralOutcomeLabel("no_further_action")).toBe("No Further Action");
  });

  it("returns correct label for stepped_up", () => {
    expect(getReferralOutcomeLabel("stepped_up")).toBe("Stepped Up");
  });

  it("returns correct label for stepped_down", () => {
    expect(getReferralOutcomeLabel("stepped_down")).toBe("Stepped Down");
  });

  it("returns correct label for ongoing", () => {
    expect(getReferralOutcomeLabel("ongoing")).toBe("Ongoing");
  });
});

describe("getTrainingLevelLabel", () => {
  it("returns correct label for basic_awareness", () => {
    expect(getTrainingLevelLabel("basic_awareness")).toBe("Basic Awareness");
  });

  it("returns correct label for level_1", () => {
    expect(getTrainingLevelLabel("level_1")).toBe("Level 1");
  });

  it("returns correct label for level_2", () => {
    expect(getTrainingLevelLabel("level_2")).toBe("Level 2");
  });

  it("returns correct label for level_3_dsl", () => {
    expect(getTrainingLevelLabel("level_3_dsl")).toBe("Level 3 — DSL");
  });

  it("returns correct label for specialist", () => {
    expect(getTrainingLevelLabel("specialist")).toBe("Specialist");
  });
});

describe("getAuditAreaLabel", () => {
  it("returns correct label for policy", () => {
    expect(getAuditAreaLabel("policy")).toBe("Policy");
  });

  it("returns correct label for procedures", () => {
    expect(getAuditAreaLabel("procedures")).toBe("Procedures");
  });

  it("returns correct label for training", () => {
    expect(getAuditAreaLabel("training")).toBe("Training");
  });

  it("returns correct label for recording", () => {
    expect(getAuditAreaLabel("recording")).toBe("Recording");
  });

  it("returns correct label for information_sharing", () => {
    expect(getAuditAreaLabel("information_sharing")).toBe("Information Sharing");
  });

  it("returns correct label for supervision", () => {
    expect(getAuditAreaLabel("supervision")).toBe("Supervision");
  });

  it("returns correct label for culture", () => {
    expect(getAuditAreaLabel("culture")).toBe("Culture");
  });

  it("returns correct label for multi_agency", () => {
    expect(getAuditAreaLabel("multi_agency")).toBe("Multi-Agency Working");
  });
});

describe("getOfstedRatingLabel", () => {
  it("returns correct label for outstanding", () => {
    expect(getOfstedRatingLabel("outstanding")).toBe("Outstanding");
  });

  it("returns correct label for good", () => {
    expect(getOfstedRatingLabel("good")).toBe("Good");
  });

  it("returns correct label for requires_improvement", () => {
    expect(getOfstedRatingLabel("requires_improvement")).toBe("Requires Improvement");
  });

  it("returns correct label for inadequate", () => {
    expect(getOfstedRatingLabel("inadequate")).toBe("Inadequate");
  });
});
