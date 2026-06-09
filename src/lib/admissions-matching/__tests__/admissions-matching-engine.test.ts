// ══════════════════════════════════════════════════════════════════════════════
// TESTS — Admissions & Matching Intelligence Engine
//
// Demo data: Chamberlain House with children Alex (14), Jordan (13), Morgan (15)
// Staff: Sarah Johnson (RM), Tom Richards (RSW), Lisa Williams (Senior RSW),
//        Darren Laville (RM)
//
// 5 referrals:
//   1. Alex (accepted) — full journey
//   2. Jordan (accepted) — full journey
//   3. Riley (declined, risk_to_group)
//   4. Sam (withdrawn)
//   5. Casey (currently in assessment)
// ══════════════════════════════════════════════════════════════════════════════

import { describe, it, expect } from "vitest";
import {
  evaluateReferralProcessing,
  evaluateMatchingQuality,
  evaluateIntroductionPlanning,
  evaluateAdmissionOutcomes,
  buildReferralTimeline,
  generateAdmissionsMatchingIntelligence,
  getIntroductionPhaseLabel,
  getReferralStatusLabel,
  getDeclineReasonLabel,
  getMatchingCriterionLabel,
} from "../admissions-matching-engine";
import type {
  Referral,
  MatchingAssessment,
  MatchingScore,
  IntroductionPlan,
  IntroductionPhaseRecord,
  AdmissionOutcome,
} from "../admissions-matching-engine";

// ── Helper Factories ───────────────────────────────────────────────────────

function makeReferral(overrides: Partial<Referral> = {}): Referral {
  return {
    id: "ref-001",
    childName: "Alex",
    childAge: 14,
    referringAuthority: "Manchester City Council",
    referralDate: "2026-04-01",
    currentStatus: "accepted",
    keyNeeds: ["emotional support", "education"],
    riskFactors: ["absconding history"],
    screeningCompletedDate: "2026-04-02",
    assessmentCompletedDate: "2026-04-05",
    decisionDate: "2026-04-07",
    decisionBy: "Darren Laville",
    ...overrides,
  };
}

function makeMatchingScore(overrides: Partial<MatchingScore> = {}): MatchingScore {
  return {
    criterion: "age_compatibility",
    score: 4,
    rationale: "Age range compatible with current group",
    ...overrides,
  };
}

function makeFullCriteriaScores(baseScore = 4): MatchingScore[] {
  const criteria = [
    "age_compatibility",
    "gender_dynamics",
    "needs_compatibility",
    "risk_assessment",
    "cultural_needs",
    "educational_needs",
    "therapeutic_needs",
    "group_dynamics",
    "location_proximity",
    "statement_of_purpose_fit",
  ] as const;
  return criteria.map((criterion) => ({
    criterion,
    score: baseScore,
    rationale: `Assessed as ${baseScore}/5 for ${criterion}`,
  }));
}

function makeAssessment(overrides: Partial<MatchingAssessment> = {}): MatchingAssessment {
  return {
    id: "ma-001",
    referralId: "ref-001",
    assessedBy: "Sarah Johnson",
    assessmentDate: "2026-04-05",
    criteria: makeFullCriteriaScores(4),
    overallScore: 4.0,
    recommendation: "accept",
    impactOnExistingChildren: "Minimal disruption expected given age compatibility",
    impactOnNewChild: "Good match with existing group interests and needs",
    groupDynamicsAnalysis: "Current group dynamics stable; Alex would integrate well",
    ...overrides,
  };
}

function makeIntroductionPlan(overrides: Partial<IntroductionPlan> = {}): IntroductionPlan {
  return {
    id: "ip-001",
    referralId: "ref-001",
    childName: "Alex",
    phases: [
      { phase: "pre_visit_info", plannedDate: "2026-04-08", completedDate: "2026-04-08", status: "completed", outcome: "Information pack sent", childFeedback: "Excited to visit" },
      { phase: "initial_visit", plannedDate: "2026-04-10", completedDate: "2026-04-10", status: "completed", outcome: "Positive visit", childFeedback: "Liked the house" },
      { phase: "overnight_stay", plannedDate: "2026-04-12", completedDate: "2026-04-12", status: "completed", outcome: "Settled well overnight" },
      { phase: "extended_stay", plannedDate: "2026-04-14", completedDate: "2026-04-15", status: "completed", outcome: "Positive extended stay" },
      { phase: "full_admission", plannedDate: "2026-04-17", completedDate: "2026-04-17", status: "completed", outcome: "Full admission completed" },
    ],
    keyWorkerAssigned: "Sarah Johnson",
    welcomePack: true,
    childrenConsulted: true,
    childVoiceRecorded: true,
    ...overrides,
  };
}

function makeAdmissionOutcome(overrides: Partial<AdmissionOutcome> = {}): AdmissionOutcome {
  return {
    id: "ao-001",
    referralId: "ref-001",
    childName: "Alex",
    admissionDate: "2026-04-17",
    settlingInReviewDate: "2026-04-19",
    settlingInCompleted: true,
    initialCareplanCreated: true,
    placementPlanSigned: true,
    existingChildrenFeedback: "Children felt welcomed and supported Alex's arrival",
    ...overrides,
  };
}

// ── Demo Data Set ──────────────────────────────────────────────────────────

const PERIOD_START = "2026-04-01";
const PERIOD_END = "2026-05-18";

const demoReferrals: Referral[] = [
  // 1. Alex — accepted
  makeReferral({
    id: "ref-001",
    childName: "Alex",
    childAge: 14,
    referringAuthority: "Manchester City Council",
    referralDate: "2026-04-01",
    currentStatus: "accepted",
    keyNeeds: ["emotional support", "education continuity"],
    riskFactors: ["absconding history"],
    screeningCompletedDate: "2026-04-02",
    assessmentCompletedDate: "2026-04-05",
    decisionDate: "2026-04-07",
    decisionBy: "Darren Laville",
  }),
  // 2. Jordan — accepted
  makeReferral({
    id: "ref-002",
    childName: "Jordan",
    childAge: 13,
    referringAuthority: "Salford City Council",
    referralDate: "2026-04-10",
    currentStatus: "accepted",
    keyNeeds: ["therapeutic support", "social skills"],
    riskFactors: ["peer conflict"],
    screeningCompletedDate: "2026-04-11",
    assessmentCompletedDate: "2026-04-14",
    decisionDate: "2026-04-16",
    decisionBy: "Darren Laville",
  }),
  // 3. Riley — declined (risk to group)
  makeReferral({
    id: "ref-003",
    childName: "Riley",
    childAge: 16,
    referringAuthority: "Bolton Council",
    referralDate: "2026-04-15",
    currentStatus: "declined",
    declineReason: "risk_to_group",
    keyNeeds: ["substance misuse support", "anger management"],
    riskFactors: ["violence to peers", "substance misuse", "criminal exploitation"],
    screeningCompletedDate: "2026-04-16",
    assessmentCompletedDate: "2026-04-18",
    decisionDate: "2026-04-19",
    decisionBy: "Darren Laville",
  }),
  // 4. Sam — withdrawn
  makeReferral({
    id: "ref-004",
    childName: "Sam",
    childAge: 12,
    referringAuthority: "Wigan Council",
    referralDate: "2026-04-20",
    currentStatus: "withdrawn",
    keyNeeds: ["attachment support"],
    riskFactors: [],
    screeningCompletedDate: "2026-04-21",
    decisionDate: "2026-04-23",
    decisionBy: "Darren Laville",
  }),
  // 5. Casey — in assessment
  makeReferral({
    id: "ref-005",
    childName: "Casey",
    childAge: 14,
    referringAuthority: "Trafford Council",
    referralDate: "2026-05-01",
    currentStatus: "assessment",
    keyNeeds: ["mental health support", "education"],
    riskFactors: ["self-harm"],
    screeningCompletedDate: "2026-05-02",
    assessmentCompletedDate: undefined,
    decisionDate: undefined,
    decisionBy: undefined,
  }),
];

const demoAssessments: MatchingAssessment[] = [
  // Alex — full criteria, high scores
  makeAssessment({
    id: "ma-001",
    referralId: "ref-001",
    assessedBy: "Sarah Johnson",
    assessmentDate: "2026-04-05",
    criteria: makeFullCriteriaScores(4),
    overallScore: 4.0,
    recommendation: "accept",
    impactOnExistingChildren: "Minimal disruption expected",
    impactOnNewChild: "Good match with existing group",
    groupDynamicsAnalysis: "Current group stable; Alex would integrate well",
  }),
  // Jordan — full criteria, moderate scores
  makeAssessment({
    id: "ma-002",
    referralId: "ref-002",
    assessedBy: "Lisa Williams",
    assessmentDate: "2026-04-14",
    criteria: makeFullCriteriaScores(3),
    overallScore: 3.0,
    recommendation: "accept",
    impactOnExistingChildren: "Some adjustment expected for existing children",
    impactOnNewChild: "Jordan would benefit from therapeutic milieu",
    groupDynamicsAnalysis: "Group dynamics will need monitoring during transition",
  }),
  // Riley — partial criteria, low scores, decline
  makeAssessment({
    id: "ma-003",
    referralId: "ref-003",
    assessedBy: "Sarah Johnson",
    assessmentDate: "2026-04-18",
    criteria: [
      makeMatchingScore({ criterion: "age_compatibility", score: 2, rationale: "Older than current group" }),
      makeMatchingScore({ criterion: "risk_assessment", score: 1, rationale: "Significant risk to existing children" }),
      makeMatchingScore({ criterion: "group_dynamics", score: 1, rationale: "Would destabilise current group" }),
      makeMatchingScore({ criterion: "needs_compatibility", score: 2, rationale: "Specialist substance misuse needs exceed home capabilities" }),
      makeMatchingScore({ criterion: "statement_of_purpose_fit", score: 2, rationale: "Profile outside statement of purpose" }),
    ],
    overallScore: 1.6,
    recommendation: "decline",
    impactOnExistingChildren: "High risk of negative impact on younger residents",
    impactOnNewChild: "Home cannot meet specialist needs",
    groupDynamicsAnalysis: "Significant disruption likely given risk profile",
  }),
  // Casey — partial criteria (still being assessed)
  makeAssessment({
    id: "ma-004",
    referralId: "ref-005",
    assessedBy: "Lisa Williams",
    assessmentDate: "2026-05-05",
    criteria: [
      makeMatchingScore({ criterion: "age_compatibility", score: 4, rationale: "Good age fit" }),
      makeMatchingScore({ criterion: "needs_compatibility", score: 3, rationale: "Needs can be met with additional support" }),
      makeMatchingScore({ criterion: "risk_assessment", score: 3, rationale: "Manageable risk with safety plan" }),
      makeMatchingScore({ criterion: "group_dynamics", score: 4, rationale: "Would benefit from current group" }),
    ],
    overallScore: 3.5,
    recommendation: "further_info_needed",
    impactOnExistingChildren: "Further assessment needed on impact",
    impactOnNewChild: "Would benefit from structure in the home",
    groupDynamicsAnalysis: "Positive potential but needs further exploration",
  }),
];

const demoPlans: IntroductionPlan[] = [
  // Alex — full plan, all completed
  makeIntroductionPlan({
    id: "ip-001",
    referralId: "ref-001",
    childName: "Alex",
    phases: [
      { phase: "pre_visit_info", plannedDate: "2026-04-08", completedDate: "2026-04-08", status: "completed", outcome: "Information pack sent", childFeedback: "Excited to visit" },
      { phase: "initial_visit", plannedDate: "2026-04-10", completedDate: "2026-04-10", status: "completed", outcome: "Positive visit", childFeedback: "Liked the house" },
      { phase: "overnight_stay", plannedDate: "2026-04-12", completedDate: "2026-04-12", status: "completed", outcome: "Settled well overnight" },
      { phase: "extended_stay", plannedDate: "2026-04-14", completedDate: "2026-04-15", status: "completed", outcome: "Positive extended stay" },
      { phase: "full_admission", plannedDate: "2026-04-17", completedDate: "2026-04-17", status: "completed", outcome: "Full admission completed" },
    ],
    keyWorkerAssigned: "Sarah Johnson",
    welcomePack: true,
    childrenConsulted: true,
    childVoiceRecorded: true,
  }),
  // Jordan — partial plan (no child voice, some phases pending)
  makeIntroductionPlan({
    id: "ip-002",
    referralId: "ref-002",
    childName: "Jordan",
    phases: [
      { phase: "pre_visit_info", plannedDate: "2026-04-17", completedDate: "2026-04-17", status: "completed", outcome: "Pack provided" },
      { phase: "initial_visit", plannedDate: "2026-04-19", completedDate: "2026-04-19", status: "completed", outcome: "Visit went well" },
      { phase: "overnight_stay", plannedDate: "2026-04-21", completedDate: "2026-04-21", status: "completed", outcome: "Some anxiety but settled" },
      { phase: "extended_stay", plannedDate: "2026-04-23", status: "pending" },
      { phase: "full_admission", plannedDate: "2026-04-26", completedDate: "2026-04-26", status: "completed", outcome: "Admitted" },
    ],
    keyWorkerAssigned: "Tom Richards",
    welcomePack: true,
    childrenConsulted: true,
    childVoiceRecorded: false,
  }),
];

const demoOutcomes: AdmissionOutcome[] = [
  // Alex — full outcome
  makeAdmissionOutcome({
    id: "ao-001",
    referralId: "ref-001",
    childName: "Alex",
    admissionDate: "2026-04-17",
    settlingInReviewDate: "2026-04-19",
    settlingInCompleted: true,
    initialCareplanCreated: true,
    placementPlanSigned: true,
    existingChildrenFeedback: "Children welcomed Alex warmly",
  }),
  // Jordan — partial outcome (no settling-in review, no feedback)
  makeAdmissionOutcome({
    id: "ao-002",
    referralId: "ref-002",
    childName: "Jordan",
    admissionDate: "2026-04-26",
    settlingInCompleted: false,
    initialCareplanCreated: true,
    placementPlanSigned: false,
    existingChildrenFeedback: undefined,
    settlingInReviewDate: undefined,
  }),
];

// ══════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════════════════════════════

describe("evaluateReferralProcessing", () => {
  it("counts total referrals in the period", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    expect(result.totalReferrals).toBe(5);
  });

  it("counts accepted referrals", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    expect(result.acceptedCount).toBe(2);
  });

  it("counts declined referrals", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    expect(result.declinedCount).toBe(1);
  });

  it("counts withdrawn referrals", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    expect(result.withdrawnCount).toBe(1);
  });

  it("counts in-progress referrals (received + screening + assessment)", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    expect(result.inProgressCount).toBe(1);
  });

  it("calculates acceptance rate from decided referrals only", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    // 2 accepted / 3 decided = 67%
    expect(result.acceptanceRate).toBe(67);
  });

  it("breaks down decline reasons", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    expect(result.declineReasons).toEqual({ risk_to_group: 1 });
  });

  it("calculates average processing days", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    // ref-001: 6 days, ref-002: 6 days, ref-003: 4 days, ref-004: 3 days = avg 4.8
    expect(result.averageProcessingDays).toBeGreaterThan(0);
    expect(result.averageProcessingDays).toBeLessThanOrEqual(10);
  });

  it("calculates screening timeliness rate", () => {
    const result = evaluateReferralProcessing(demoReferrals, PERIOD_START, PERIOD_END);
    // All 5 screened within 2 days target
    expect(result.screeningTimelinessRate).toBe(100);
  });

  it("filters referrals outside the period", () => {
    const result = evaluateReferralProcessing(demoReferrals, "2026-04-01", "2026-04-15");
    // Only ref-001, ref-002, ref-003 fall within
    expect(result.totalReferrals).toBe(3);
  });

  it("returns zero counts for empty referrals", () => {
    const result = evaluateReferralProcessing([], PERIOD_START, PERIOD_END);
    expect(result.totalReferrals).toBe(0);
    expect(result.acceptedCount).toBe(0);
    expect(result.acceptanceRate).toBe(0);
    expect(result.averageProcessingDays).toBe(0);
  });

  it("handles referrals with no decision date", () => {
    const refs = [makeReferral({ decisionDate: undefined, currentStatus: "assessment" })];
    const result = evaluateReferralProcessing(refs, PERIOD_START, PERIOD_END);
    expect(result.averageProcessingDays).toBe(0);
    expect(result.inProgressCount).toBe(1);
  });

  it("handles referrals with no screening date", () => {
    const refs = [makeReferral({ screeningCompletedDate: undefined, currentStatus: "received" })];
    const result = evaluateReferralProcessing(refs, PERIOD_START, PERIOD_END);
    expect(result.screeningTimelinessRate).toBe(0);
  });

  it("returns on-hold count", () => {
    const refs = [makeReferral({ currentStatus: "on_hold" })];
    const result = evaluateReferralProcessing(refs, PERIOD_START, PERIOD_END);
    expect(result.onHoldCount).toBe(1);
  });

  it("handles multiple decline reasons correctly", () => {
    const refs = [
      makeReferral({ id: "r1", currentStatus: "declined", declineReason: "risk_to_group" }),
      makeReferral({ id: "r2", currentStatus: "declined", declineReason: "capacity" }),
      makeReferral({ id: "r3", currentStatus: "declined", declineReason: "risk_to_group" }),
    ];
    const result = evaluateReferralProcessing(refs, PERIOD_START, PERIOD_END);
    expect(result.declineReasons).toEqual({ risk_to_group: 2, capacity: 1 });
  });

  it("screening timeliness handles late screening", () => {
    const refs = [
      makeReferral({ id: "r1", referralDate: "2026-04-01", screeningCompletedDate: "2026-04-01" }),
      makeReferral({ id: "r2", referralDate: "2026-04-01", screeningCompletedDate: "2026-04-10" }),
    ];
    const result = evaluateReferralProcessing(refs, PERIOD_START, PERIOD_END);
    expect(result.screeningTimelinessRate).toBe(50);
  });
});

describe("evaluateMatchingQuality", () => {
  it("counts total assessments", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    expect(result.totalAssessments).toBe(4);
  });

  it("calculates average overall score", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    // (4.0 + 3.0 + 1.6 + 3.5) / 4 = 3.025 => 3.0
    expect(result.averageOverallScore).toBeGreaterThanOrEqual(2.5);
    expect(result.averageOverallScore).toBeLessThanOrEqual(3.5);
  });

  it("provides criterion-level breakdown", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    expect(result.criterionBreakdown.length).toBeGreaterThan(0);
    const ageCriterion = result.criterionBreakdown.find(
      (c) => c.criterion === "age_compatibility",
    );
    expect(ageCriterion).toBeDefined();
    expect(ageCriterion!.averageScore).toBeGreaterThan(0);
  });

  it("calculates full criteria assessed rate", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    // 2 of 4 have full 10 criteria (ma-001 and ma-002)
    expect(result.fullCriteriaAssessedRate).toBe(50);
  });

  it("calculates group dynamics consideration rate", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    // All 4 have groupDynamicsAnalysis and group_dynamics criterion
    expect(result.groupDynamicsConsiderationRate).toBe(100);
  });

  it("provides recommendation breakdown", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    expect(result.recommendationBreakdown.accept).toBe(2);
    expect(result.recommendationBreakdown.decline).toBe(1);
    expect(result.recommendationBreakdown.further_info_needed).toBe(1);
  });

  it("returns zeros for empty assessments", () => {
    const result = evaluateMatchingQuality([]);
    expect(result.totalAssessments).toBe(0);
    expect(result.averageOverallScore).toBe(0);
    expect(result.criterionBreakdown).toEqual([]);
    expect(result.fullCriteriaAssessedRate).toBe(0);
    expect(result.groupDynamicsConsiderationRate).toBe(0);
  });

  it("handles single assessment", () => {
    const result = evaluateMatchingQuality([demoAssessments[0]]);
    expect(result.totalAssessments).toBe(1);
    expect(result.averageOverallScore).toBe(4.0);
    expect(result.fullCriteriaAssessedRate).toBe(100);
  });

  it("criterion breakdown includes count per criterion", () => {
    const result = evaluateMatchingQuality(demoAssessments);
    const riskCriterion = result.criterionBreakdown.find(
      (c) => c.criterion === "risk_assessment",
    );
    expect(riskCriterion).toBeDefined();
    // All 4 assessments have risk_assessment
    expect(riskCriterion!.count).toBe(4);
  });

  it("group dynamics rate is 0 when no analysis provided", () => {
    const noGroupAnalysis = [
      makeAssessment({
        groupDynamicsAnalysis: "",
        criteria: [makeMatchingScore({ criterion: "age_compatibility", score: 4 })],
      }),
    ];
    const result = evaluateMatchingQuality(noGroupAnalysis);
    expect(result.groupDynamicsConsiderationRate).toBe(0);
  });

  it("group dynamics rate requires both analysis text and criterion score", () => {
    const withTextButNoCriterion = [
      makeAssessment({
        groupDynamicsAnalysis: "Some analysis",
        criteria: [makeMatchingScore({ criterion: "age_compatibility", score: 4 })],
      }),
    ];
    const result = evaluateMatchingQuality(withTextButNoCriterion);
    expect(result.groupDynamicsConsiderationRate).toBe(0);
  });
});

describe("evaluateIntroductionPlanning", () => {
  it("counts total plans", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    expect(result.totalPlans).toBe(2);
  });

  it("calculates welcome pack rate", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    expect(result.welcomePackRate).toBe(100);
  });

  it("calculates children consulted rate", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    expect(result.childrenConsultedRate).toBe(100);
  });

  it("calculates child voice rate", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    // Alex yes, Jordan no = 50%
    expect(result.childVoiceRate).toBe(50);
  });

  it("calculates phase completion rate across all plans", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    // Alex: 5/5 completed, Jordan: 4/5 completed (extended_stay pending) = 9/10 = 90%
    expect(result.phaseCompletionRate).toBe(90);
  });

  it("calculates average phases completed per plan", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    // Alex: 5, Jordan: 4 = avg 4.5
    expect(result.averagePhasesCompleted).toBe(4.5);
  });

  it("calculates key worker assigned rate", () => {
    const result = evaluateIntroductionPlanning(demoPlans);
    expect(result.keyWorkerAssignedRate).toBe(100);
  });

  it("returns zeros for empty plans", () => {
    const result = evaluateIntroductionPlanning([]);
    expect(result.totalPlans).toBe(0);
    expect(result.welcomePackRate).toBe(0);
    expect(result.childrenConsultedRate).toBe(0);
    expect(result.childVoiceRate).toBe(0);
    expect(result.phaseCompletionRate).toBe(0);
    expect(result.averagePhasesCompleted).toBe(0);
  });

  it("handles plan with no completed phases", () => {
    const plan = makeIntroductionPlan({
      phases: [
        { phase: "pre_visit_info", plannedDate: "2026-05-01", status: "pending" },
        { phase: "initial_visit", plannedDate: "2026-05-03", status: "pending" },
      ],
    });
    const result = evaluateIntroductionPlanning([plan]);
    expect(result.phaseCompletionRate).toBe(0);
    expect(result.averagePhasesCompleted).toBe(0);
  });

  it("handles plan with skipped phases", () => {
    const plan = makeIntroductionPlan({
      phases: [
        { phase: "pre_visit_info", plannedDate: "2026-05-01", completedDate: "2026-05-01", status: "completed", outcome: "Done" },
        { phase: "initial_visit", plannedDate: "2026-05-03", status: "skipped" },
        { phase: "full_admission", plannedDate: "2026-05-05", completedDate: "2026-05-05", status: "completed", outcome: "Admitted" },
      ],
    });
    const result = evaluateIntroductionPlanning([plan]);
    // 2 completed / 3 total = 67%
    expect(result.phaseCompletionRate).toBe(67);
  });

  it("welcome pack rate reflects actual data", () => {
    const plans = [
      makeIntroductionPlan({ id: "ip-1", welcomePack: true }),
      makeIntroductionPlan({ id: "ip-2", welcomePack: false }),
      makeIntroductionPlan({ id: "ip-3", welcomePack: false }),
    ];
    const result = evaluateIntroductionPlanning(plans);
    expect(result.welcomePackRate).toBe(33);
  });

  it("key worker unassigned rate reflects empty strings", () => {
    const plans = [
      makeIntroductionPlan({ id: "ip-1", keyWorkerAssigned: "" }),
      makeIntroductionPlan({ id: "ip-2", keyWorkerAssigned: "Sarah Johnson" }),
    ];
    const result = evaluateIntroductionPlanning(plans);
    expect(result.keyWorkerAssignedRate).toBe(50);
  });

  it("key worker unassigned rate reflects undefined", () => {
    const plans = [
      makeIntroductionPlan({ id: "ip-1", keyWorkerAssigned: undefined }),
    ];
    const result = evaluateIntroductionPlanning(plans);
    expect(result.keyWorkerAssignedRate).toBe(0);
  });
});

describe("evaluateAdmissionOutcomes", () => {
  it("counts total outcomes", () => {
    const result = evaluateAdmissionOutcomes(demoOutcomes);
    expect(result.totalOutcomes).toBe(2);
  });

  it("calculates settling-in review rate", () => {
    const result = evaluateAdmissionOutcomes(demoOutcomes);
    // Alex completed, Jordan not = 50%
    expect(result.settlingInReviewRate).toBe(50);
  });

  it("calculates initial careplan rate", () => {
    const result = evaluateAdmissionOutcomes(demoOutcomes);
    // Both have care plans
    expect(result.initialCareplanRate).toBe(100);
  });

  it("calculates placement plan signed rate", () => {
    const result = evaluateAdmissionOutcomes(demoOutcomes);
    // Alex yes, Jordan no = 50%
    expect(result.placementPlanSignedRate).toBe(50);
  });

  it("calculates existing children feedback rate", () => {
    const result = evaluateAdmissionOutcomes(demoOutcomes);
    // Alex has feedback, Jordan does not = 50%
    expect(result.existingChildrenFeedbackRate).toBe(50);
  });

  it("returns zeros for empty outcomes", () => {
    const result = evaluateAdmissionOutcomes([]);
    expect(result.totalOutcomes).toBe(0);
    expect(result.settlingInReviewRate).toBe(0);
    expect(result.initialCareplanRate).toBe(0);
    expect(result.placementPlanSignedRate).toBe(0);
    expect(result.existingChildrenFeedbackRate).toBe(0);
  });

  it("handles all-positive outcomes", () => {
    const outcomes = [
      makeAdmissionOutcome({ id: "ao-1" }),
      makeAdmissionOutcome({ id: "ao-2" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes);
    expect(result.settlingInReviewRate).toBe(100);
    expect(result.initialCareplanRate).toBe(100);
    expect(result.placementPlanSignedRate).toBe(100);
    expect(result.existingChildrenFeedbackRate).toBe(100);
  });

  it("handles all-negative outcomes", () => {
    const outcomes = [
      makeAdmissionOutcome({
        id: "ao-1",
        settlingInCompleted: false,
        initialCareplanCreated: false,
        placementPlanSigned: false,
        existingChildrenFeedback: undefined,
      }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes);
    expect(result.settlingInReviewRate).toBe(0);
    expect(result.initialCareplanRate).toBe(0);
    expect(result.placementPlanSignedRate).toBe(0);
    expect(result.existingChildrenFeedbackRate).toBe(0);
  });

  it("existing children feedback treats empty string as no feedback", () => {
    const outcomes = [
      makeAdmissionOutcome({ id: "ao-1", existingChildrenFeedback: "" }),
    ];
    const result = evaluateAdmissionOutcomes(outcomes);
    expect(result.existingChildrenFeedbackRate).toBe(0);
  });
});

describe("buildReferralTimeline", () => {
  it("returns timeline entry for each referral", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    expect(timelines.length).toBe(5);
  });

  it("includes referral received milestone for every referral", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    for (const timeline of timelines) {
      const received = timeline.milestones.find((m) => m.label === "Referral received");
      expect(received).toBeDefined();
      expect(received!.daysFromReferral).toBe(0);
    }
  });

  it("includes screening milestone", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    const screening = alexTimeline.milestones.find((m) => m.label === "Screening completed");
    expect(screening).toBeDefined();
    expect(screening!.date).toBe("2026-04-02");
  });

  it("includes matching assessment milestone", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    expect(alexTimeline.hasAssessment).toBe(true);
    const matchMilestone = alexTimeline.milestones.find(
      (m) => m.label === "Matching assessment completed",
    );
    expect(matchMilestone).toBeDefined();
  });

  it("includes decision milestone with correct label", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    const decision = alexTimeline.milestones.find((m) => m.label === "Accepted");
    expect(decision).toBeDefined();

    const rileyTimeline = timelines.find((t) => t.referralId === "ref-003")!;
    const declined = rileyTimeline.milestones.find((m) => m.label === "Declined");
    expect(declined).toBeDefined();
  });

  it("includes introduction phase milestones", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    expect(alexTimeline.hasIntroductionPlan).toBe(true);
    const introMilestones = alexTimeline.milestones.filter((m) =>
      m.label.startsWith("Introduction:"),
    );
    expect(introMilestones.length).toBe(5);
  });

  it("includes admission milestone", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    expect(alexTimeline.hasAdmissionOutcome).toBe(true);
    const admitted = alexTimeline.milestones.find((m) => m.label === "Admitted");
    expect(admitted).toBeDefined();
  });

  it("includes settling-in review milestone", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    const review = alexTimeline.milestones.find((m) => m.label === "Settling-in review");
    expect(review).toBeDefined();
  });

  it("milestones are sorted chronologically", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    for (let i = 1; i < alexTimeline.milestones.length; i++) {
      expect(alexTimeline.milestones[i].date >= alexTimeline.milestones[i - 1].date).toBe(true);
    }
  });

  it("total duration reflects last milestone", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const alexTimeline = timelines.find((t) => t.referralId === "ref-001")!;
    expect(alexTimeline.totalDurationDays).toBeGreaterThan(0);
  });

  it("handles referral with no matching assessment", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const samTimeline = timelines.find((t) => t.referralId === "ref-004")!;
    expect(samTimeline.hasAssessment).toBe(false);
  });

  it("handles referral with no introduction plan", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const rileyTimeline = timelines.find((t) => t.referralId === "ref-003")!;
    expect(rileyTimeline.hasIntroductionPlan).toBe(false);
  });

  it("handles referral with no admission outcome", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const caseyTimeline = timelines.find((t) => t.referralId === "ref-005")!;
    expect(caseyTimeline.hasAdmissionOutcome).toBe(false);
  });

  it("withdrawn referral has withdrawn label", () => {
    const timelines = buildReferralTimeline(demoReferrals, demoAssessments, demoPlans, demoOutcomes);
    const samTimeline = timelines.find((t) => t.referralId === "ref-004")!;
    const decision = samTimeline.milestones.find((m) => m.label === "Withdrawn");
    expect(decision).toBeDefined();
  });

  it("returns empty array for empty inputs", () => {
    const timelines = buildReferralTimeline([], [], [], []);
    expect(timelines).toEqual([]);
  });
});

describe("generateAdmissionsMatchingIntelligence", () => {
  const result = generateAdmissionsMatchingIntelligence(
    demoReferrals,
    demoAssessments,
    demoPlans,
    demoOutcomes,
    "oak-house",
    PERIOD_START,
    PERIOD_END,
    "2026-05-18",
  );

  it("returns correct homeId", () => {
    expect(result.homeId).toBe("oak-house");
  });

  it("returns correct period", () => {
    expect(result.periodStart).toBe(PERIOD_START);
    expect(result.periodEnd).toBe(PERIOD_END);
  });

  it("returns correct reference date", () => {
    expect(result.referenceDate).toBe("2026-05-18");
  });

  it("produces an overall score between 0 and 100", () => {
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("produces a valid rating", () => {
    expect(["outstanding", "good", "requires_improvement", "inadequate"]).toContain(result.rating);
  });

  it("includes referral processing results", () => {
    expect(result.referralProcessing).toBeDefined();
    expect(result.referralProcessing.totalReferrals).toBe(5);
  });

  it("includes matching quality results", () => {
    expect(result.matchingQuality).toBeDefined();
    expect(result.matchingQuality.totalAssessments).toBe(4);
  });

  it("includes introduction planning results", () => {
    expect(result.introductionPlanning).toBeDefined();
    expect(result.introductionPlanning.totalPlans).toBe(2);
  });

  it("includes admission outcomes results", () => {
    expect(result.admissionOutcomes).toBeDefined();
    expect(result.admissionOutcomes.totalOutcomes).toBe(2);
  });

  it("includes referral timelines", () => {
    expect(result.referralTimelines.length).toBe(5);
  });

  it("includes component scores that sum to overall score", () => {
    const sum =
      result.componentScores.referralProcessing +
      result.componentScores.matchingQuality +
      result.componentScores.introductionPlanning +
      result.componentScores.admissionOutcomes;
    expect(result.overallScore).toBe(Math.round(sum));
  });

  it("component scores respect maximums", () => {
    expect(result.componentScores.referralProcessing).toBeLessThanOrEqual(20);
    expect(result.componentScores.matchingQuality).toBeLessThanOrEqual(30);
    expect(result.componentScores.introductionPlanning).toBeLessThanOrEqual(25);
    expect(result.componentScores.admissionOutcomes).toBeLessThanOrEqual(25);
  });

  it("generates strengths array", () => {
    expect(Array.isArray(result.strengths)).toBe(true);
  });

  it("generates areas for improvement array", () => {
    expect(Array.isArray(result.areasForImprovement)).toBe(true);
  });

  it("generates actions array", () => {
    expect(Array.isArray(result.actions)).toBe(true);
    expect(result.actions.length).toBeGreaterThan(0);
  });

  it("generates regulatory links", () => {
    expect(result.regulatoryLinks.length).toBeGreaterThan(0);
  });

  it("regulatory links include Reg 3 (statement of purpose)", () => {
    const hasReg3 = result.regulatoryLinks.some((l) => l.includes("Reg 3"));
    expect(hasReg3).toBe(true);
  });

  it("regulatory links include Reg 12 (protection)", () => {
    const hasReg12 = result.regulatoryLinks.some((l) => l.includes("Reg 12"));
    expect(hasReg12).toBe(true);
  });

  it("regulatory links include SCCIF", () => {
    const hasSCCIF = result.regulatoryLinks.some((l) => l.includes("SCCIF"));
    expect(hasSCCIF).toBe(true);
  });

  it("regulatory links include Working Together 2023", () => {
    const hasWT = result.regulatoryLinks.some((l) => l.includes("Working Together"));
    expect(hasWT).toBe(true);
  });
});

describe("Scoring thresholds", () => {
  it("outstanding rating for score >= 80", () => {
    const allGood = generateAdmissionsMatchingIntelligence(
      [makeReferral({ screeningCompletedDate: "2026-04-01", decisionDate: "2026-04-03" })],
      [makeAssessment({ criteria: makeFullCriteriaScores(5), overallScore: 5.0 })],
      [makeIntroductionPlan({ welcomePack: true, childrenConsulted: true, childVoiceRecorded: true })],
      [makeAdmissionOutcome({ settlingInCompleted: true, initialCareplanCreated: true, placementPlanSigned: true, existingChildrenFeedback: "Great" })],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(allGood.overallScore).toBeGreaterThanOrEqual(80);
    expect(allGood.rating).toBe("outstanding");
  });

  it("inadequate rating for score < 40", () => {
    const poor = generateAdmissionsMatchingIntelligence(
      [makeReferral({ screeningCompletedDate: undefined, decisionDate: undefined, currentStatus: "received" })],
      [makeAssessment({ criteria: [makeMatchingScore({ score: 1 })], overallScore: 1.0, groupDynamicsAnalysis: "" })],
      [makeIntroductionPlan({ welcomePack: false, childrenConsulted: false, childVoiceRecorded: false, phases: [{ phase: "pre_visit_info", plannedDate: "2026-05-01", status: "pending" }] })],
      [makeAdmissionOutcome({ settlingInCompleted: false, initialCareplanCreated: false, placementPlanSigned: false, existingChildrenFeedback: undefined })],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(poor.overallScore).toBeLessThan(40);
    expect(poor.rating).toBe("inadequate");
  });

  it("good rating for score between 60 and 79", () => {
    const moderate = generateAdmissionsMatchingIntelligence(
      [makeReferral({ screeningCompletedDate: "2026-04-02", decisionDate: "2026-04-07" })],
      [makeAssessment({
        criteria: [
          makeMatchingScore({ criterion: "age_compatibility", score: 3 }),
          makeMatchingScore({ criterion: "needs_compatibility", score: 3 }),
          makeMatchingScore({ criterion: "risk_assessment", score: 3 }),
          makeMatchingScore({ criterion: "group_dynamics", score: 3 }),
        ],
        overallScore: 3.0,
        groupDynamicsAnalysis: "Moderate match",
      })],
      [makeIntroductionPlan({
        welcomePack: true,
        childrenConsulted: true,
        childVoiceRecorded: false,
        phases: [
          { phase: "pre_visit_info", plannedDate: "2026-04-08", completedDate: "2026-04-08", status: "completed", outcome: "Done" },
          { phase: "initial_visit", plannedDate: "2026-04-10", completedDate: "2026-04-10", status: "completed", outcome: "Done" },
          { phase: "overnight_stay", plannedDate: "2026-04-11", status: "pending" },
          { phase: "full_admission", plannedDate: "2026-04-12", completedDate: "2026-04-12", status: "completed", outcome: "Done" },
        ],
      })],
      [makeAdmissionOutcome({ settlingInCompleted: true, initialCareplanCreated: true, placementPlanSigned: false, existingChildrenFeedback: undefined })],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(moderate.overallScore).toBeGreaterThanOrEqual(60);
    expect(moderate.overallScore).toBeLessThan(80);
    expect(moderate.rating).toBe("good");
  });

  it("requires_improvement rating for score between 40 and 59", () => {
    const weak = generateAdmissionsMatchingIntelligence(
      [makeReferral({ screeningCompletedDate: "2026-04-02", decisionDate: "2026-04-07" })],
      [makeAssessment({
        criteria: [
          makeMatchingScore({ criterion: "age_compatibility", score: 2 }),
          makeMatchingScore({ criterion: "risk_assessment", score: 2 }),
        ],
        overallScore: 2.0,
        groupDynamicsAnalysis: "",
      })],
      [makeIntroductionPlan({
        welcomePack: false,
        childrenConsulted: true,
        childVoiceRecorded: false,
        phases: [
          { phase: "pre_visit_info", plannedDate: "2026-04-08", completedDate: "2026-04-08", status: "completed", outcome: "Done" },
          { phase: "initial_visit", plannedDate: "2026-04-10", status: "pending" },
          { phase: "full_admission", plannedDate: "2026-04-12", completedDate: "2026-04-12", status: "completed", outcome: "Done" },
        ],
      })],
      [makeAdmissionOutcome({ settlingInCompleted: false, initialCareplanCreated: true, placementPlanSigned: false, existingChildrenFeedback: undefined })],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(weak.overallScore).toBeGreaterThanOrEqual(40);
    expect(weak.overallScore).toBeLessThan(60);
    expect(weak.rating).toBe("requires_improvement");
  });
});

describe("Strengths and areas generation", () => {
  it("generates screening timeliness strength when >= 90%", () => {
    const result = generateAdmissionsMatchingIntelligence(
      demoReferrals,
      demoAssessments,
      demoPlans,
      demoOutcomes,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    const hasScreeningStrength = result.strengths.some((s) =>
      s.includes("screening timeliness"),
    );
    expect(hasScreeningStrength).toBe(true);
  });

  it("flags area when child voice rate < 70%", () => {
    const result = generateAdmissionsMatchingIntelligence(
      demoReferrals,
      demoAssessments,
      demoPlans, // Jordan has no child voice (50%)
      demoOutcomes,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    const hasChildVoiceArea = result.areasForImprovement.some((a) =>
      a.includes("Child voice"),
    );
    expect(hasChildVoiceArea).toBe(true);
  });

  it("actions include in-progress referral review", () => {
    const result = generateAdmissionsMatchingIntelligence(
      demoReferrals,
      demoAssessments,
      demoPlans,
      demoOutcomes,
      "oak-house",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    const hasInProgressAction = result.actions.some((a) =>
      a.includes("in progress"),
    );
    expect(hasInProgressAction).toBe(true);
  });

  it("no actions message when everything is perfect", () => {
    const perfect = generateAdmissionsMatchingIntelligence(
      [makeReferral({ screeningCompletedDate: "2026-04-01", decisionDate: "2026-04-03" })],
      [makeAssessment({ criteria: makeFullCriteriaScores(5), overallScore: 5.0 })],
      [makeIntroductionPlan({ welcomePack: true, childrenConsulted: true, childVoiceRecorded: true })],
      [makeAdmissionOutcome({ settlingInCompleted: true, initialCareplanCreated: true, placementPlanSigned: true, existingChildrenFeedback: "Great" })],
      "test-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(perfect.actions.length).toBeGreaterThan(0);
    expect(perfect.actions[0]).toContain("No immediate actions");
  });
});

describe("Edge cases", () => {
  it("handles all empty data gracefully", () => {
    const result = generateAdmissionsMatchingIntelligence(
      [],
      [],
      [],
      [],
      "empty-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.referralProcessing.totalReferrals).toBe(0);
    expect(result.matchingQuality.totalAssessments).toBe(0);
    expect(result.introductionPlanning.totalPlans).toBe(0);
    expect(result.admissionOutcomes.totalOutcomes).toBe(0);
    expect(result.referralTimelines).toEqual([]);
  });

  it("handles single referral with full journey", () => {
    const result = generateAdmissionsMatchingIntelligence(
      [demoReferrals[0]],
      [demoAssessments[0]],
      [demoPlans[0]],
      [demoOutcomes[0]],
      "single-home",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.referralProcessing.totalReferrals).toBe(1);
    expect(result.referralTimelines.length).toBe(1);
  });

  it("referral outside period is excluded from processing", () => {
    const futureRef = makeReferral({ referralDate: "2027-01-01" });
    const result = evaluateReferralProcessing([futureRef], PERIOD_START, PERIOD_END);
    expect(result.totalReferrals).toBe(0);
  });

  it("assessment with all scores of 1 produces low quality", () => {
    const lowAssessment = makeAssessment({
      criteria: makeFullCriteriaScores(1),
      overallScore: 1.0,
    });
    const result = evaluateMatchingQuality([lowAssessment]);
    expect(result.averageOverallScore).toBe(1.0);
  });

  it("assessment with all scores of 5 produces high quality", () => {
    const highAssessment = makeAssessment({
      criteria: makeFullCriteriaScores(5),
      overallScore: 5.0,
    });
    const result = evaluateMatchingQuality([highAssessment]);
    expect(result.averageOverallScore).toBe(5.0);
    expect(result.fullCriteriaAssessedRate).toBe(100);
  });

  it("timeline for referral with only received status has single milestone", () => {
    const minimalRef = makeReferral({
      currentStatus: "received",
      screeningCompletedDate: undefined,
      assessmentCompletedDate: undefined,
      decisionDate: undefined,
    });
    const timelines = buildReferralTimeline([minimalRef], [], [], []);
    expect(timelines[0].milestones.length).toBe(1);
    expect(timelines[0].milestones[0].label).toBe("Referral received");
    expect(timelines[0].totalDurationDays).toBe(0);
  });

  it("overall score never exceeds 100", () => {
    const result = generateAdmissionsMatchingIntelligence(
      [makeReferral({ screeningCompletedDate: "2026-04-01", decisionDate: "2026-04-01" })],
      [makeAssessment({ criteria: makeFullCriteriaScores(5), overallScore: 5.0 })],
      [makeIntroductionPlan({ welcomePack: true, childrenConsulted: true, childVoiceRecorded: true })],
      [makeAdmissionOutcome({ settlingInCompleted: true, initialCareplanCreated: true, placementPlanSigned: true, existingChildrenFeedback: "Great" })],
      "test",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it("overall score never goes below 0", () => {
    const result = generateAdmissionsMatchingIntelligence(
      [],
      [],
      [],
      [],
      "test",
      PERIOD_START,
      PERIOD_END,
      "2026-05-18",
    );
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});

describe("Label functions", () => {
  it("getIntroductionPhaseLabel returns human-readable labels", () => {
    expect(getIntroductionPhaseLabel("pre_visit_info")).toBe("Pre-visit information");
    expect(getIntroductionPhaseLabel("initial_visit")).toBe("Initial visit");
    expect(getIntroductionPhaseLabel("overnight_stay")).toBe("Overnight stay");
    expect(getIntroductionPhaseLabel("extended_stay")).toBe("Extended stay");
    expect(getIntroductionPhaseLabel("full_admission")).toBe("Full admission");
  });

  it("getReferralStatusLabel returns human-readable labels", () => {
    expect(getReferralStatusLabel("received")).toBe("Received");
    expect(getReferralStatusLabel("screening")).toBe("Screening");
    expect(getReferralStatusLabel("assessment")).toBe("Assessment");
    expect(getReferralStatusLabel("accepted")).toBe("Accepted");
    expect(getReferralStatusLabel("declined")).toBe("Declined");
    expect(getReferralStatusLabel("withdrawn")).toBe("Withdrawn");
    expect(getReferralStatusLabel("on_hold")).toBe("On Hold");
  });

  it("getDeclineReasonLabel returns human-readable labels", () => {
    expect(getDeclineReasonLabel("not_matched")).toBe("Not matched");
    expect(getDeclineReasonLabel("capacity")).toBe("At capacity");
    expect(getDeclineReasonLabel("needs_not_met")).toBe("Needs not met");
    expect(getDeclineReasonLabel("risk_to_group")).toBe("Risk to group");
    expect(getDeclineReasonLabel("location")).toBe("Location");
    expect(getDeclineReasonLabel("age_range")).toBe("Age range");
    expect(getDeclineReasonLabel("regulatory_limit")).toBe("Regulatory limit");
  });

  it("getMatchingCriterionLabel returns human-readable labels", () => {
    expect(getMatchingCriterionLabel("age_compatibility")).toBe("Age Compatibility");
    expect(getMatchingCriterionLabel("gender_dynamics")).toBe("Gender Dynamics");
    expect(getMatchingCriterionLabel("needs_compatibility")).toBe("Needs Compatibility");
    expect(getMatchingCriterionLabel("risk_assessment")).toBe("Risk Assessment");
    expect(getMatchingCriterionLabel("cultural_needs")).toBe("Cultural Needs");
    expect(getMatchingCriterionLabel("educational_needs")).toBe("Educational Needs");
    expect(getMatchingCriterionLabel("therapeutic_needs")).toBe("Therapeutic Needs");
    expect(getMatchingCriterionLabel("group_dynamics")).toBe("Group Dynamics");
    expect(getMatchingCriterionLabel("location_proximity")).toBe("Location Proximity");
    expect(getMatchingCriterionLabel("statement_of_purpose_fit")).toBe("Statement of Purpose Fit");
  });
});
