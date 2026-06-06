// ══════════════════════════════════════════════════════════════════════════════
// ADMISSIONS & MATCHING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating the quality of admissions processes,
// matching decisions, introduction planning, and admission outcomes.
//
// Aligned to:
//   - CHR 2015 Reg 3  — Statement of purpose (matching against home's purpose)
//   - CHR 2015 Reg 5  — Engaging with the placing authority
//   - CHR 2015 Reg 12 — Protection of children (matching, group dynamics)
//   - CHR 2015 Reg 14 — Care planning (initial care plan on admission)
//   - SCCIF — Experience and progress of children and young people
//   - Working Together to Safeguard Children 2023
//   - DfE Guide to Children's Homes Regulations: Matching
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReferralStatus =
  | "received"
  | "screening"
  | "assessment"
  | "accepted"
  | "declined"
  | "withdrawn"
  | "on_hold";

export type DeclineReason =
  | "not_matched"
  | "capacity"
  | "needs_not_met"
  | "risk_to_group"
  | "location"
  | "age_range"
  | "regulatory_limit";

export type MatchingCriterion =
  | "age_compatibility"
  | "gender_dynamics"
  | "needs_compatibility"
  | "risk_assessment"
  | "cultural_needs"
  | "educational_needs"
  | "therapeutic_needs"
  | "group_dynamics"
  | "location_proximity"
  | "statement_of_purpose_fit";

export type IntroductionPhase =
  | "pre_visit_info"
  | "initial_visit"
  | "overnight_stay"
  | "extended_stay"
  | "full_admission";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface Referral {
  id: string;
  childName: string;
  childAge: number;
  referringAuthority: string;
  referralDate: string;
  currentStatus: ReferralStatus;
  declineReason?: DeclineReason;
  keyNeeds: string[];
  riskFactors: string[];
  screeningCompletedDate?: string;
  assessmentCompletedDate?: string;
  decisionDate?: string;
  decisionBy?: string;
}

export interface MatchingAssessment {
  id: string;
  referralId: string;
  assessedBy: string;
  assessmentDate: string;
  criteria: MatchingScore[];
  overallScore: number;
  recommendation: "accept" | "decline" | "further_info_needed";
  impactOnExistingChildren: string;
  impactOnNewChild: string;
  groupDynamicsAnalysis: string;
  notes?: string;
}

export interface MatchingScore {
  criterion: MatchingCriterion;
  score: number; // 1-5
  rationale: string;
}

export interface IntroductionPlan {
  id: string;
  referralId: string;
  childName: string;
  phases: IntroductionPhaseRecord[];
  keyWorkerAssigned?: string;
  welcomePack: boolean;
  childrenConsulted: boolean;
  childVoiceRecorded: boolean;
}

export interface IntroductionPhaseRecord {
  phase: IntroductionPhase;
  plannedDate: string;
  completedDate?: string;
  status: "pending" | "completed" | "skipped";
  outcome?: string;
  childFeedback?: string;
}

export interface AdmissionOutcome {
  id: string;
  referralId: string;
  childName: string;
  admissionDate: string;
  settlingInReviewDate?: string;
  settlingInCompleted: boolean;
  initialCareplanCreated: boolean;
  placementPlanSigned: boolean;
  existingChildrenFeedback?: string;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReferralProcessingResult {
  totalReferrals: number;
  acceptedCount: number;
  declinedCount: number;
  withdrawnCount: number;
  onHoldCount: number;
  inProgressCount: number;
  acceptanceRate: number;
  declineReasons: Record<string, number>;
  averageProcessingDays: number;
  screeningTimelinessRate: number;
}

export interface MatchingQualityResult {
  totalAssessments: number;
  averageOverallScore: number;
  criterionBreakdown: { criterion: MatchingCriterion; averageScore: number; count: number }[];
  fullCriteriaAssessedRate: number;
  groupDynamicsConsiderationRate: number;
  recommendationBreakdown: { accept: number; decline: number; further_info_needed: number };
}

export interface IntroductionPlanningResult {
  totalPlans: number;
  welcomePackRate: number;
  childrenConsultedRate: number;
  childVoiceRate: number;
  phaseCompletionRate: number;
  averagePhasesCompleted: number;
  keyWorkerAssignedRate: number;
}

export interface AdmissionOutcomesResult {
  totalOutcomes: number;
  settlingInReviewRate: number;
  initialCareplanRate: number;
  placementPlanSignedRate: number;
  existingChildrenFeedbackRate: number;
}

export interface ReferralTimelineEntry {
  referralId: string;
  childName: string;
  referralDate: string;
  currentStatus: ReferralStatus;
  milestones: { label: string; date: string; daysFromReferral: number }[];
  totalDurationDays: number;
  hasAssessment: boolean;
  hasIntroductionPlan: boolean;
  hasAdmissionOutcome: boolean;
}

export interface AdmissionsMatchingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  referralProcessing: ReferralProcessingResult;
  matchingQuality: MatchingQualityResult;
  introductionPlanning: IntroductionPlanningResult;
  admissionOutcomes: AdmissionOutcomesResult;
  referralTimelines: ReferralTimelineEntry[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
  componentScores: {
    referralProcessing: number;
    matchingQuality: number;
    introductionPlanning: number;
    admissionOutcomes: number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_MATCHING_CRITERIA: MatchingCriterion[] = [
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
];

const SCREENING_TARGET_DAYS = 2;

// ── Core Function 1: Evaluate Referral Processing ──────────────────────────

export function evaluateReferralProcessing(
  referrals: Referral[],
  periodStart: string,
  periodEnd: string,
): ReferralProcessingResult {
  const periodReferrals = referrals.filter(
    (r) => withinPeriod(r.referralDate, periodStart, periodEnd),
  );

  const totalReferrals = periodReferrals.length;
  const acceptedCount = periodReferrals.filter((r) => r.currentStatus === "accepted").length;
  const declinedCount = periodReferrals.filter((r) => r.currentStatus === "declined").length;
  const withdrawnCount = periodReferrals.filter((r) => r.currentStatus === "withdrawn").length;
  const onHoldCount = periodReferrals.filter((r) => r.currentStatus === "on_hold").length;
  const inProgressCount = periodReferrals.filter(
    (r) => r.currentStatus === "received" || r.currentStatus === "screening" || r.currentStatus === "assessment",
  ).length;

  const decided = periodReferrals.filter(
    (r) => r.currentStatus === "accepted" || r.currentStatus === "declined",
  );
  const acceptanceRate =
    decided.length > 0 ? Math.round((acceptedCount / decided.length) * 100) : 0;

  // Decline reasons breakdown
  const declineReasons: Record<string, number> = {};
  periodReferrals
    .filter((r) => r.currentStatus === "declined" && r.declineReason)
    .forEach((r) => {
      declineReasons[r.declineReason!] = (declineReasons[r.declineReason!] || 0) + 1;
    });

  // Average processing time (referral to decision)
  const processingDays = periodReferrals
    .filter((r) => r.decisionDate)
    .map((r) => daysBetween(r.referralDate, r.decisionDate!));
  const averageProcessingDays =
    processingDays.length > 0
      ? Math.round((processingDays.reduce((s, d) => s + d, 0) / processingDays.length) * 10) / 10
      : 0;

  // Screening timeliness
  const screenedReferrals = periodReferrals.filter((r) => r.screeningCompletedDate);
  const timelyScreenings = screenedReferrals.filter(
    (r) => daysBetween(r.referralDate, r.screeningCompletedDate!) <= SCREENING_TARGET_DAYS,
  );
  const screeningTimelinessRate =
    screenedReferrals.length > 0
      ? Math.round((timelyScreenings.length / screenedReferrals.length) * 100)
      : 0;

  return {
    totalReferrals,
    acceptedCount,
    declinedCount,
    withdrawnCount,
    onHoldCount,
    inProgressCount,
    acceptanceRate,
    declineReasons,
    averageProcessingDays,
    screeningTimelinessRate,
  };
}

// ── Core Function 2: Evaluate Matching Quality ─────────────────────────────

export function evaluateMatchingQuality(
  assessments: MatchingAssessment[],
): MatchingQualityResult {
  const totalAssessments = assessments.length;

  const averageOverallScore =
    totalAssessments > 0
      ? Math.round(
          (assessments.reduce((s, a) => s + a.overallScore, 0) / totalAssessments) * 10,
        ) / 10
      : 0;

  // Criterion-level breakdown
  const criterionMap = new Map<MatchingCriterion, { total: number; count: number }>();
  for (const assessment of assessments) {
    for (const score of assessment.criteria) {
      const existing = criterionMap.get(score.criterion) || { total: 0, count: 0 };
      existing.total += score.score;
      existing.count += 1;
      criterionMap.set(score.criterion, existing);
    }
  }

  const criterionBreakdown = ALL_MATCHING_CRITERIA
    .filter((c) => criterionMap.has(c))
    .map((c) => {
      const data = criterionMap.get(c)!;
      return {
        criterion: c,
        averageScore: Math.round((data.total / data.count) * 10) / 10,
        count: data.count,
      };
    });

  // Full criteria assessed rate — proportion of assessments that assessed all 10 criteria
  const fullCriteriaAssessedRate =
    totalAssessments > 0
      ? Math.round(
          (assessments.filter((a) => a.criteria.length >= ALL_MATCHING_CRITERIA.length).length /
            totalAssessments) *
            100,
        )
      : 0;

  // Group dynamics consideration rate
  const groupDynamicsConsiderationRate =
    totalAssessments > 0
      ? Math.round(
          (assessments.filter(
            (a) =>
              a.groupDynamicsAnalysis.length > 0 &&
              a.criteria.some((c) => c.criterion === "group_dynamics"),
          ).length /
            totalAssessments) *
            100,
        )
      : 0;

  // Recommendation breakdown
  const recommendationBreakdown = {
    accept: assessments.filter((a) => a.recommendation === "accept").length,
    decline: assessments.filter((a) => a.recommendation === "decline").length,
    further_info_needed: assessments.filter((a) => a.recommendation === "further_info_needed").length,
  };

  return {
    totalAssessments,
    averageOverallScore,
    criterionBreakdown,
    fullCriteriaAssessedRate,
    groupDynamicsConsiderationRate,
    recommendationBreakdown,
  };
}

// ── Core Function 3: Evaluate Introduction Planning ────────────────────────

export function evaluateIntroductionPlanning(
  plans: IntroductionPlan[],
): IntroductionPlanningResult {
  const totalPlans = plans.length;

  const welcomePackRate =
    totalPlans > 0
      ? Math.round((plans.filter((p) => p.welcomePack).length / totalPlans) * 100)
      : 0;

  const childrenConsultedRate =
    totalPlans > 0
      ? Math.round((plans.filter((p) => p.childrenConsulted).length / totalPlans) * 100)
      : 0;

  const childVoiceRate =
    totalPlans > 0
      ? Math.round((plans.filter((p) => p.childVoiceRecorded).length / totalPlans) * 100)
      : 0;

  // Phase completion rate: across all phases in all plans
  const allPhases = plans.flatMap((p) => p.phases);
  const completedPhases = allPhases.filter((p) => p.status === "completed");
  const phaseCompletionRate =
    allPhases.length > 0
      ? Math.round((completedPhases.length / allPhases.length) * 100)
      : 0;

  // Average phases completed per plan
  const averagePhasesCompleted =
    totalPlans > 0
      ? Math.round(
          (plans.reduce(
            (s, p) => s + p.phases.filter((ph) => ph.status === "completed").length,
            0,
          ) /
            totalPlans) *
            10,
        ) / 10
      : 0;

  // Key worker assignment rate
  const keyWorkerAssignedRate =
    totalPlans > 0
      ? Math.round(
          (plans.filter((p) => p.keyWorkerAssigned && p.keyWorkerAssigned.length > 0).length /
            totalPlans) *
            100,
        )
      : 0;

  return {
    totalPlans,
    welcomePackRate,
    childrenConsultedRate,
    childVoiceRate,
    phaseCompletionRate,
    averagePhasesCompleted,
    keyWorkerAssignedRate,
  };
}

// ── Core Function 4: Evaluate Admission Outcomes ───────────────────────────

export function evaluateAdmissionOutcomes(
  outcomes: AdmissionOutcome[],
): AdmissionOutcomesResult {
  const totalOutcomes = outcomes.length;

  const settlingInReviewRate =
    totalOutcomes > 0
      ? Math.round((outcomes.filter((o) => o.settlingInCompleted).length / totalOutcomes) * 100)
      : 0;

  const initialCareplanRate =
    totalOutcomes > 0
      ? Math.round(
          (outcomes.filter((o) => o.initialCareplanCreated).length / totalOutcomes) * 100,
        )
      : 0;

  const placementPlanSignedRate =
    totalOutcomes > 0
      ? Math.round(
          (outcomes.filter((o) => o.placementPlanSigned).length / totalOutcomes) * 100,
        )
      : 0;

  const existingChildrenFeedbackRate =
    totalOutcomes > 0
      ? Math.round(
          (outcomes.filter(
            (o) => o.existingChildrenFeedback && o.existingChildrenFeedback.length > 0,
          ).length /
            totalOutcomes) *
            100,
        )
      : 0;

  return {
    totalOutcomes,
    settlingInReviewRate,
    initialCareplanRate,
    placementPlanSignedRate,
    existingChildrenFeedbackRate,
  };
}

// ── Core Function 5: Build Referral Timeline ───────────────────────────────

export function buildReferralTimeline(
  referrals: Referral[],
  assessments: MatchingAssessment[],
  plans: IntroductionPlan[],
  outcomes: AdmissionOutcome[],
): ReferralTimelineEntry[] {
  return referrals.map((referral) => {
    const milestones: { label: string; date: string; daysFromReferral: number }[] = [];

    // Referral received
    milestones.push({
      label: "Referral received",
      date: referral.referralDate,
      daysFromReferral: 0,
    });

    // Screening completed
    if (referral.screeningCompletedDate) {
      milestones.push({
        label: "Screening completed",
        date: referral.screeningCompletedDate,
        daysFromReferral: daysBetween(referral.referralDate, referral.screeningCompletedDate),
      });
    }

    // Assessment completed
    if (referral.assessmentCompletedDate) {
      milestones.push({
        label: "Assessment completed",
        date: referral.assessmentCompletedDate,
        daysFromReferral: daysBetween(referral.referralDate, referral.assessmentCompletedDate),
      });
    }

    // Matching assessment
    const assessment = assessments.find((a) => a.referralId === referral.id);
    const hasAssessment = !!assessment;
    if (assessment) {
      milestones.push({
        label: "Matching assessment completed",
        date: assessment.assessmentDate,
        daysFromReferral: daysBetween(referral.referralDate, assessment.assessmentDate),
      });
    }

    // Decision
    if (referral.decisionDate) {
      const statusLabel =
        referral.currentStatus === "accepted"
          ? "Accepted"
          : referral.currentStatus === "declined"
            ? "Declined"
            : referral.currentStatus === "withdrawn"
              ? "Withdrawn"
              : "Decision made";
      milestones.push({
        label: statusLabel,
        date: referral.decisionDate,
        daysFromReferral: daysBetween(referral.referralDate, referral.decisionDate),
      });
    }

    // Introduction plan phases
    const plan = plans.find((p) => p.referralId === referral.id);
    const hasIntroductionPlan = !!plan;
    if (plan) {
      for (const phase of plan.phases) {
        if (phase.completedDate) {
          milestones.push({
            label: `Introduction: ${getIntroductionPhaseLabel(phase.phase)}`,
            date: phase.completedDate,
            daysFromReferral: daysBetween(referral.referralDate, phase.completedDate),
          });
        }
      }
    }

    // Admission outcome
    const outcome = outcomes.find((o) => o.referralId === referral.id);
    const hasAdmissionOutcome = !!outcome;
    if (outcome) {
      milestones.push({
        label: "Admitted",
        date: outcome.admissionDate,
        daysFromReferral: daysBetween(referral.referralDate, outcome.admissionDate),
      });

      if (outcome.settlingInReviewDate) {
        milestones.push({
          label: "Settling-in review",
          date: outcome.settlingInReviewDate,
          daysFromReferral: daysBetween(referral.referralDate, outcome.settlingInReviewDate),
        });
      }
    }

    // Sort milestones by date
    milestones.sort((a, b) => a.date.localeCompare(b.date));

    // Total duration
    const lastMilestone = milestones[milestones.length - 1];
    const totalDurationDays = lastMilestone ? lastMilestone.daysFromReferral : 0;

    return {
      referralId: referral.id,
      childName: referral.childName,
      referralDate: referral.referralDate,
      currentStatus: referral.currentStatus,
      milestones,
      totalDurationDays,
      hasAssessment,
      hasIntroductionPlan,
      hasAdmissionOutcome,
    };
  });
}

// ── Core Function 6: Generate Admissions Matching Intelligence ─────────────

export function generateAdmissionsMatchingIntelligence(
  referrals: Referral[],
  assessments: MatchingAssessment[],
  plans: IntroductionPlan[],
  outcomes: AdmissionOutcome[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): AdmissionsMatchingIntelligence {
  const referralProcessing = evaluateReferralProcessing(referrals, periodStart, periodEnd);
  const matchingQuality = evaluateMatchingQuality(assessments);
  const introductionPlanning = evaluateIntroductionPlanning(plans);
  const admissionOutcomes = evaluateAdmissionOutcomes(outcomes);
  const referralTimelines = buildReferralTimeline(referrals, assessments, plans, outcomes);

  // Component scores
  const componentScores = calculateComponentScores(
    referralProcessing,
    matchingQuality,
    introductionPlanning,
    admissionOutcomes,
  );

  const overallScore = Math.round(
    componentScores.referralProcessing +
      componentScores.matchingQuality +
      componentScores.introductionPlanning +
      componentScores.admissionOutcomes,
  );

  const rating = getOverallRating(overallScore);

  const strengths = generateStrengths(
    referralProcessing,
    matchingQuality,
    introductionPlanning,
    admissionOutcomes,
  );
  const areasForImprovement = generateAreasForImprovement(
    referralProcessing,
    matchingQuality,
    introductionPlanning,
    admissionOutcomes,
  );
  const actions = generateActions(
    referralProcessing,
    matchingQuality,
    introductionPlanning,
    admissionOutcomes,
  );
  const regulatoryLinks = generateRegulatoryLinks(
    referralProcessing,
    matchingQuality,
    introductionPlanning,
    admissionOutcomes,
  );

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    referralProcessing,
    matchingQuality,
    introductionPlanning,
    admissionOutcomes,
    referralTimelines,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
    componentScores,
  };
}

// ── Scoring ────────────────────────────────────────────────────────────────

function calculateComponentScores(
  rp: ReferralProcessingResult,
  mq: MatchingQualityResult,
  ip: IntroductionPlanningResult,
  ao: AdmissionOutcomesResult,
): {
  referralProcessing: number;
  matchingQuality: number;
  introductionPlanning: number;
  admissionOutcomes: number;
} {
  // Referral processing: max 20 points
  let rpScore = 0;
  // Timeliness: 10 pts
  rpScore += (rp.screeningTimelinessRate / 100) * 10;
  // Decision clarity: 10 pts — based on having decisions made (not stuck in progress)
  if (rp.totalReferrals > 0) {
    const decisionMadeRate =
      ((rp.acceptedCount + rp.declinedCount + rp.withdrawnCount) / rp.totalReferrals) * 100;
    rpScore += (Math.min(decisionMadeRate, 100) / 100) * 10;
  } else {
    rpScore += 10; // no referrals = nothing wrong
  }

  // Matching quality: max 30 points
  let mqScore = 0;
  if (mq.totalAssessments > 0) {
    // Comprehensive assessment (avg score): 12 pts
    mqScore += (Math.min(mq.averageOverallScore, 5) / 5) * 12;
    // Criteria coverage: 10 pts
    mqScore += (mq.fullCriteriaAssessedRate / 100) * 10;
    // Group dynamics consideration: 8 pts
    mqScore += (mq.groupDynamicsConsiderationRate / 100) * 8;
  } else {
    // No assessments — if there were referrals that needed them, this is bad
    mqScore = 0;
  }

  // Introduction planning: max 25 points
  let ipScore = 0;
  if (ip.totalPlans > 0) {
    // Consultation: 8 pts
    ipScore += (ip.childrenConsultedRate / 100) * 8;
    // Child voice: 9 pts
    ipScore += (ip.childVoiceRate / 100) * 9;
    // Phase completion: 8 pts
    ipScore += (ip.phaseCompletionRate / 100) * 8;
  } else {
    ipScore = 0;
  }

  // Admission outcomes: max 25 points
  let aoScore = 0;
  if (ao.totalOutcomes > 0) {
    // Settling-in reviews: 8 pts
    aoScore += (ao.settlingInReviewRate / 100) * 8;
    // Care plans: 7 pts
    aoScore += (ao.initialCareplanRate / 100) * 7;
    // Placement plan signed: 5 pts
    aoScore += (ao.placementPlanSignedRate / 100) * 5;
    // Existing children consulted: 5 pts
    aoScore += (ao.existingChildrenFeedbackRate / 100) * 5;
  } else {
    aoScore = 0;
  }

  return {
    referralProcessing: Math.round(rpScore * 10) / 10,
    matchingQuality: Math.round(mqScore * 10) / 10,
    introductionPlanning: Math.round(ipScore * 10) / 10,
    admissionOutcomes: Math.round(aoScore * 10) / 10,
  };
}

function getOverallRating(
  score: number,
): "outstanding" | "good" | "requires_improvement" | "inadequate" {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  rp: ReferralProcessingResult,
  mq: MatchingQualityResult,
  ip: IntroductionPlanningResult,
  ao: AdmissionOutcomesResult,
): string[] {
  const strengths: string[] = [];

  if (rp.screeningTimelinessRate >= 90) {
    strengths.push(
      "Excellent referral screening timeliness: over 90% screened within target timeframe",
    );
  }

  if (rp.averageProcessingDays > 0 && rp.averageProcessingDays <= 5) {
    strengths.push(
      `Efficient referral processing with average decision time of ${rp.averageProcessingDays} days`,
    );
  }

  if (mq.averageOverallScore >= 4) {
    strengths.push(
      "High-quality matching assessments with strong average scores across criteria",
    );
  }

  if (mq.fullCriteriaAssessedRate >= 80) {
    strengths.push(
      "Comprehensive matching practice: most assessments cover all required criteria",
    );
  }

  if (mq.groupDynamicsConsiderationRate >= 90) {
    strengths.push(
      "Group dynamics consistently considered in matching decisions, supporting Reg 12 compliance",
    );
  }

  if (ip.childVoiceRate >= 90) {
    strengths.push(
      "Excellent child voice practice: children's views consistently recorded during introductions",
    );
  }

  if (ip.childrenConsultedRate >= 90) {
    strengths.push(
      "Existing children consistently consulted before new admissions, supporting child-centred practice",
    );
  }

  if (ip.welcomePackRate >= 90) {
    strengths.push(
      "Welcome packs consistently provided to new children, supporting positive transition experiences",
    );
  }

  if (ao.settlingInReviewRate >= 90) {
    strengths.push(
      "Settling-in reviews consistently completed, ensuring new placements are monitored effectively",
    );
  }

  if (ao.initialCareplanRate === 100) {
    strengths.push(
      "All admissions have initial care plans created, meeting Reg 14 requirements",
    );
  }

  if (ao.placementPlanSignedRate >= 90) {
    strengths.push(
      "Placement plans consistently signed on admission, demonstrating effective partnership with placing authorities",
    );
  }

  if (ao.existingChildrenFeedbackRate >= 80) {
    strengths.push(
      "Strong practice in gathering existing children's feedback post-admission",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  rp: ReferralProcessingResult,
  mq: MatchingQualityResult,
  ip: IntroductionPlanningResult,
  ao: AdmissionOutcomesResult,
): string[] {
  const areas: string[] = [];

  if (rp.screeningTimelinessRate < 70 && rp.totalReferrals > 0) {
    areas.push(
      "Referral screening timeliness below 70%: review process to ensure timely initial response to placing authorities",
    );
  }

  if (rp.averageProcessingDays > 10 && rp.totalReferrals > 0) {
    areas.push(
      `Average referral processing time of ${rp.averageProcessingDays} days exceeds best practice: review decision-making workflow`,
    );
  }

  if (mq.averageOverallScore < 3 && mq.totalAssessments > 0) {
    areas.push(
      "Low average matching scores suggest placements may not be well matched to the home's statement of purpose",
    );
  }

  if (mq.fullCriteriaAssessedRate < 60 && mq.totalAssessments > 0) {
    areas.push(
      "Less than 60% of matching assessments cover all criteria: ensure comprehensive assessments including cultural, educational, and therapeutic needs",
    );
  }

  if (mq.groupDynamicsConsiderationRate < 70 && mq.totalAssessments > 0) {
    areas.push(
      "Group dynamics not consistently considered in matching: strengthen impact assessment process per Reg 12",
    );
  }

  if (ip.childVoiceRate < 70 && ip.totalPlans > 0) {
    areas.push(
      "Child voice not consistently recorded during introductions: ensure all children have opportunity to share their views",
    );
  }

  if (ip.childrenConsultedRate < 70 && ip.totalPlans > 0) {
    areas.push(
      "Existing children not consistently consulted before new admissions: develop consultation processes",
    );
  }

  if (ip.welcomePackRate < 70 && ip.totalPlans > 0) {
    areas.push(
      "Welcome packs not consistently provided: ensure all new children receive information about the home",
    );
  }

  if (ao.settlingInReviewRate < 70 && ao.totalOutcomes > 0) {
    areas.push(
      "Settling-in reviews not consistently completed: implement tracking to ensure all new admissions are reviewed",
    );
  }

  if (ao.initialCareplanRate < 80 && ao.totalOutcomes > 0) {
    areas.push(
      "Not all admissions have initial care plans: ensure care plans are created promptly on admission per Reg 14",
    );
  }

  if (ao.placementPlanSignedRate < 70 && ao.totalOutcomes > 0) {
    areas.push(
      "Placement plans not consistently signed: strengthen liaison with placing authorities",
    );
  }

  if (ao.existingChildrenFeedbackRate < 50 && ao.totalOutcomes > 0) {
    areas.push(
      "Existing children's feedback rarely gathered post-admission: develop post-placement feedback process",
    );
  }

  return areas;
}

function generateActions(
  rp: ReferralProcessingResult,
  mq: MatchingQualityResult,
  ip: IntroductionPlanningResult,
  ao: AdmissionOutcomesResult,
): string[] {
  const actions: string[] = [];

  if (rp.inProgressCount > 0) {
    actions.push(
      `Review ${rp.inProgressCount} referral(s) currently in progress to ensure timely decisions are made`,
    );
  }

  if (rp.onHoldCount > 0) {
    actions.push(
      `Review ${rp.onHoldCount} referral(s) on hold — confirm whether to progress or decline`,
    );
  }

  if (mq.fullCriteriaAssessedRate < 80 && mq.totalAssessments > 0) {
    actions.push(
      "Implement matching assessment checklist to ensure all 10 criteria are evaluated for every referral",
    );
  }

  if (mq.groupDynamicsConsiderationRate < 80 && mq.totalAssessments > 0) {
    actions.push(
      "Strengthen group dynamics analysis: assess impact on each existing child before accepting new placements",
    );
  }

  if (ip.childVoiceRate < 80 && ip.totalPlans > 0) {
    actions.push(
      "Develop child voice recording process for introduction phases, ensuring each child's views are documented",
    );
  }

  if (ip.childrenConsultedRate < 80 && ip.totalPlans > 0) {
    actions.push(
      "Establish routine consultation with existing children before each new admission",
    );
  }

  if (ao.settlingInReviewRate < 80 && ao.totalOutcomes > 0) {
    actions.push(
      "Schedule settling-in reviews within 72 hours of admission and track completion",
    );
  }

  if (ao.initialCareplanRate < 100 && ao.totalOutcomes > 0) {
    actions.push(
      "Ensure initial care plans are created for all new admissions on or before the admission date",
    );
  }

  if (ao.placementPlanSignedRate < 80 && ao.totalOutcomes > 0) {
    actions.push(
      "Follow up with placing authorities to ensure placement plans are signed within the first week",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Admissions and matching practice is operating within required standards.",
    );
  }

  return actions;
}

function generateRegulatoryLinks(
  rp: ReferralProcessingResult,
  mq: MatchingQualityResult,
  ip: IntroductionPlanningResult,
  ao: AdmissionOutcomesResult,
): string[] {
  const links: string[] = [];

  // Always relevant
  links.push(
    "CHR 2015 Reg 3 — Statement of purpose: children matched to the home's stated aims and objectives",
  );
  links.push(
    "CHR 2015 Reg 12 — Protection of children: matching assessments must consider risk to existing group",
  );

  if (rp.totalReferrals > 0) {
    links.push(
      "CHR 2015 Reg 5 — Engaging with placing authority: timely communication on referral decisions",
    );
  }

  if (ao.totalOutcomes > 0 || ip.totalPlans > 0) {
    links.push(
      "CHR 2015 Reg 14 — Care planning: initial care plan required on admission",
    );
  }

  links.push(
    "SCCIF — Experience and progress of children: admissions and matching decisions support positive outcomes",
  );

  links.push(
    "Working Together 2023 — Multi-agency working: placement decisions involve relevant professionals",
  );

  if (mq.groupDynamicsConsiderationRate < 80 && mq.totalAssessments > 0) {
    links.push(
      "DfE Guide to Children's Homes Regulations — Matching: full impact assessment before every admission",
    );
  }

  return links;
}

// ── Labels ─────────────────────────────────────────────────────────────────

export function getIntroductionPhaseLabel(phase: IntroductionPhase): string {
  const labels: Record<IntroductionPhase, string> = {
    pre_visit_info: "Pre-visit information",
    initial_visit: "Initial visit",
    overnight_stay: "Overnight stay",
    extended_stay: "Extended stay",
    full_admission: "Full admission",
  };
  return labels[phase] ?? phase;
}

export function getReferralStatusLabel(status: ReferralStatus): string {
  const labels: Record<ReferralStatus, string> = {
    received: "Received",
    screening: "Screening",
    assessment: "Assessment",
    accepted: "Accepted",
    declined: "Declined",
    withdrawn: "Withdrawn",
    on_hold: "On Hold",
  };
  return labels[status] ?? status;
}

export function getDeclineReasonLabel(reason: DeclineReason): string {
  const labels: Record<DeclineReason, string> = {
    not_matched: "Not matched",
    capacity: "At capacity",
    needs_not_met: "Needs not met",
    risk_to_group: "Risk to group",
    location: "Location",
    age_range: "Age range",
    regulatory_limit: "Regulatory limit",
  };
  return labels[reason] ?? reason;
}

export function getMatchingCriterionLabel(criterion: MatchingCriterion): string {
  const labels: Record<MatchingCriterion, string> = {
    age_compatibility: "Age Compatibility",
    gender_dynamics: "Gender Dynamics",
    needs_compatibility: "Needs Compatibility",
    risk_assessment: "Risk Assessment",
    cultural_needs: "Cultural Needs",
    educational_needs: "Educational Needs",
    therapeutic_needs: "Therapeutic Needs",
    group_dynamics: "Group Dynamics",
    location_proximity: "Location Proximity",
    statement_of_purpose_fit: "Statement of Purpose Fit",
  };
  return labels[criterion] ?? criterion;
}

// ── Utility ────────────────────────────────────────────────────────────────

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(dateB).getTime() - new Date(dateA).getTime()) / msPerDay,
  );
}
