// Therapeutic Intervention Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// -- Type Unions ---------------------------------------------------------------

export type TherapyType =
  | "cbt"
  | "play_therapy"
  | "art_therapy"
  | "emdr"
  | "family_therapy"
  | "dialectical_behaviour"
  | "psychodynamic"
  | "occupational_therapy";

export type ProgressLevel =
  | "significant_progress"
  | "good_progress"
  | "some_progress"
  | "minimal_progress"
  | "no_progress";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps ----------------------------------------------------------------

const THERAPY_TYPE_LABELS: Record<TherapyType, string> = {
  cbt: "CBT",
  play_therapy: "Play Therapy",
  art_therapy: "Art Therapy",
  emdr: "EMDR",
  family_therapy: "Family Therapy",
  dialectical_behaviour: "Dialectical Behaviour",
  psychodynamic: "Psychodynamic",
  occupational_therapy: "Occupational Therapy",
};

const PROGRESS_LEVEL_LABELS: Record<ProgressLevel, string> = {
  significant_progress: "Significant Progress",
  good_progress: "Good Progress",
  some_progress: "Some Progress",
  minimal_progress: "Minimal Progress",
  no_progress: "No Progress",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Getters -------------------------------------------------------------

export function getTherapyTypeLabel(v: TherapyType): string {
  return THERAPY_TYPE_LABELS[v];
}

export function getProgressLevelLabel(v: ProgressLevel): string {
  return PROGRESS_LEVEL_LABELS[v];
}

export function getRatingLabel(v: Rating): string {
  return RATING_LABELS[v];
}

// -- Input Interfaces ----------------------------------------------------------

export interface TherapySession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  therapyType: TherapyType;
  progressLevel: ProgressLevel;
  childEngaged: boolean;
  goalsReviewed: boolean;
  therapeuticRelationshipStrong: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface TherapeuticPolicy {
  id: string;
  therapeuticFramework: boolean;
  referralPathway: boolean;
  consentAndConfidentialityProtocol: boolean;
  multiDisciplinaryApproach: boolean;
  outcomeMeasurementPlan: boolean;
  crisisTherapyProvision: boolean;
  regularReview: boolean;
}

export interface StaffTherapeuticTraining {
  id: string;
  staffId: string;
  staffName: string;
  therapeuticAwareness: boolean;
  traumaInformedPractice: boolean;
  attachmentTheory: boolean;
  therapeuticCommunication: boolean;
  boundaryManagement: boolean;
  reflectivePractice: boolean;
}

// -- Result Interfaces ---------------------------------------------------------

export interface QualityResult {
  overallScore: number;
  totalSessions: number;
  progressRate: number;
  engagementRate: number;
  goalsReviewedRate: number;
  relationshipRate: number;
}

export interface ComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  therapyDiversityRatio: number;
}

export interface PolicyResult {
  overallScore: number;
  therapeuticFramework: boolean;
  referralPathway: boolean;
  consentAndConfidentialityProtocol: boolean;
  multiDisciplinaryApproach: boolean;
  outcomeMeasurementPlan: boolean;
  crisisTherapyProvision: boolean;
  regularReview: boolean;
}

export interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  therapeuticAwarenessRate: number;
  traumaInformedPracticeRate: number;
  attachmentTheoryRate: number;
  therapeuticCommunicationRate: number;
  boundaryManagementRate: number;
  reflectivePracticeRate: number;
}

export interface ChildTherapyProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  progressRate: number;
  engagementRate: number;
  overallScore: number;
}

export interface TherapeuticInterventionQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  quality: QualityResult;
  compliance: ComplianceResult;
  policy: PolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildTherapyProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates therapeutic session quality.
 * Empty (no sessions) = 0 — no sessions means no therapeutic work.
 *
 * - Progress rate (significant + good) -> 0-7
 * - Engagement rate -> 0-6
 * - Goals reviewed rate -> 0-6
 * - Therapeutic relationship rate -> 0-6
 */
export function evaluateQuality(
  sessions: TherapySession[],
): QualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      progressRate: 0,
      engagementRate: 0,
      goalsReviewedRate: 0,
      relationshipRate: 0,
    };
  }

  let progressCount = 0;
  let engagedCount = 0;
  let goalsCount = 0;
  let relationshipCount = 0;

  for (const s of sessions) {
    if (s.progressLevel === "significant_progress" || s.progressLevel === "good_progress") {
      progressCount++;
    }
    if (s.childEngaged) engagedCount++;
    if (s.goalsReviewed) goalsCount++;
    if (s.therapeuticRelationshipStrong) relationshipCount++;
  }

  const progressRate = pct(progressCount, sessions.length);
  const engagementRate = pct(engagedCount, sessions.length);
  const goalsReviewedRate = pct(goalsCount, sessions.length);
  const relationshipRate = pct(relationshipCount, sessions.length);

  let score = 0;
  // Progress rate (significant + good) -> 0-7
  score += Math.round((progressRate / 100) * 7);
  // Engagement rate -> 0-6
  score += Math.round((engagementRate / 100) * 6);
  // Goals reviewed rate -> 0-6
  score += Math.round((goalsReviewedRate / 100) * 6);
  // Therapeutic relationship rate -> 0-6
  score += Math.round((relationshipRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    progressRate,
    engagementRate,
    goalsReviewedRate,
    relationshipRate,
  };
}

/**
 * Evaluates compliance of therapeutic sessions.
 * Empty (no sessions) = 0 — no sessions means no compliance data.
 *
 * - Documented in plan rate -> 0-8
 * - Staff supported rate -> 0-7
 * - Feedback given rate -> 0-5
 * - Therapy diversity ratio -> 0-5
 */
export function evaluateCompliance(
  sessions: TherapySession[],
): ComplianceResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      staffSupportedRate: 0,
      feedbackRate: 0,
      therapyDiversityRatio: 0,
    };
  }

  let documentedCount = 0;
  let staffSupportedCount = 0;
  let feedbackCount = 0;
  const therapyTypes = new Set<TherapyType>();

  for (const s of sessions) {
    if (s.documentedInPlan) documentedCount++;
    if (s.staffSupported) staffSupportedCount++;
    if (s.feedbackGiven) feedbackCount++;
    therapyTypes.add(s.therapyType);
  }

  const documentedRate = pct(documentedCount, sessions.length);
  const staffSupportedRate = pct(staffSupportedCount, sessions.length);
  const feedbackRate = pct(feedbackCount, sessions.length);
  const therapyDiversityRatio = pct(therapyTypes.size, 8);

  let score = 0;
  // Documented in plan rate -> 0-8
  score += Math.round((documentedRate / 100) * 8);
  // Staff supported rate -> 0-7
  score += Math.round((staffSupportedRate / 100) * 7);
  // Feedback given rate -> 0-5
  score += Math.round((feedbackRate / 100) * 5);
  // Therapy diversity ratio -> 0-5
  score += Math.round((therapyDiversityRatio / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    documentedRate,
    staffSupportedRate,
    feedbackRate,
    therapyDiversityRatio,
  };
}

/**
 * Evaluates therapeutic policy completeness.
 * Null = 0 — no policy is non-compliant.
 *
 * 7 boolean fields scored at different weights totalling 25:
 * - therapeuticFramework: 4
 * - referralPathway: 4
 * - consentAndConfidentialityProtocol: 4
 * - multiDisciplinaryApproach: 4
 * - outcomeMeasurementPlan: 3
 * - crisisTherapyProvision: 3
 * - regularReview: 3
 */
export function evaluatePolicy(
  policy: TherapeuticPolicy | null,
): PolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      therapeuticFramework: false,
      referralPathway: false,
      consentAndConfidentialityProtocol: false,
      multiDisciplinaryApproach: false,
      outcomeMeasurementPlan: false,
      crisisTherapyProvision: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.therapeuticFramework) score += 4;
  if (policy.referralPathway) score += 4;
  if (policy.consentAndConfidentialityProtocol) score += 4;
  if (policy.multiDisciplinaryApproach) score += 4;
  if (policy.outcomeMeasurementPlan) score += 3;
  if (policy.crisisTherapyProvision) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    therapeuticFramework: policy.therapeuticFramework,
    referralPathway: policy.referralPathway,
    consentAndConfidentialityProtocol: policy.consentAndConfidentialityProtocol,
    multiDisciplinaryApproach: policy.multiDisciplinaryApproach,
    outcomeMeasurementPlan: policy.outcomeMeasurementPlan,
    crisisTherapyProvision: policy.crisisTherapyProvision,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluates staff therapeutic readiness from training records.
 * Empty = 0 — no trained staff is non-compliant.
 *
 * 6 boolean training fields scored at different weights totalling 25:
 * - therapeuticAwareness: 6
 * - traumaInformedPractice: 5
 * - attachmentTheory: 5
 * - therapeuticCommunication: 4
 * - boundaryManagement: 3
 * - reflectivePractice: 2
 */
export function evaluateStaffReadiness(
  training: StaffTherapeuticTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      therapeuticAwarenessRate: 0,
      traumaInformedPracticeRate: 0,
      attachmentTheoryRate: 0,
      therapeuticCommunicationRate: 0,
      boundaryManagementRate: 0,
      reflectivePracticeRate: 0,
    };
  }

  let awareness = 0;
  let trauma = 0;
  let attachment = 0;
  let communication = 0;
  let boundary = 0;
  let reflective = 0;

  for (const t of training) {
    if (t.therapeuticAwareness) awareness++;
    if (t.traumaInformedPractice) trauma++;
    if (t.attachmentTheory) attachment++;
    if (t.therapeuticCommunication) communication++;
    if (t.boundaryManagement) boundary++;
    if (t.reflectivePractice) reflective++;
  }

  const therapeuticAwarenessRate = pct(awareness, training.length);
  const traumaInformedPracticeRate = pct(trauma, training.length);
  const attachmentTheoryRate = pct(attachment, training.length);
  const therapeuticCommunicationRate = pct(communication, training.length);
  const boundaryManagementRate = pct(boundary, training.length);
  const reflectivePracticeRate = pct(reflective, training.length);

  let score = 0;
  score += Math.round((therapeuticAwarenessRate / 100) * 6);
  score += Math.round((traumaInformedPracticeRate / 100) * 5);
  score += Math.round((attachmentTheoryRate / 100) * 5);
  score += Math.round((therapeuticCommunicationRate / 100) * 4);
  score += Math.round((boundaryManagementRate / 100) * 3);
  score += Math.round((reflectivePracticeRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    therapeuticAwarenessRate,
    traumaInformedPracticeRate,
    attachmentTheoryRate,
    therapeuticCommunicationRate,
    boundaryManagementRate,
    reflectivePracticeRate,
  };
}

// -- Child Therapy Profiles ----------------------------------------------------

/**
 * Builds per-child therapy profiles from session data.
 * Each child: childId, childName, totalSessions, progressRate,
 * engagementRate, overallScore (0-10).
 */
export function buildChildTherapyProfiles(
  sessions: TherapySession[],
): ChildTherapyProfile[] {
  const childMap = new Map<
    string,
    { childName: string; sessions: TherapySession[] }
  >();

  for (const s of sessions) {
    const existing = childMap.get(s.childId);
    if (existing) {
      existing.sessions.push(s);
    } else {
      childMap.set(s.childId, { childName: s.childName, sessions: [s] });
    }
  }

  return Array.from(childMap.entries()).map(([childId, data]) => {
    const childSessions = data.sessions;
    const totalSessions = childSessions.length;

    const progressCount = childSessions.filter(
      (s) =>
        s.progressLevel === "significant_progress" ||
        s.progressLevel === "good_progress",
    ).length;
    const progressRate = pct(progressCount, totalSessions);

    const engagedCount = childSessions.filter((s) => s.childEngaged).length;
    const engagementRate = pct(engagedCount, totalSessions);

    // Score 0-10
    let score = 0;

    // Progress rate (0-4)
    score += Math.round((progressRate / 100) * 4);

    // Engagement rate (0-3)
    score += Math.round((engagementRate / 100) * 3);

    // Goals reviewed rate (0-2)
    const goalsCount = childSessions.filter((s) => s.goalsReviewed).length;
    const goalsRate = pct(goalsCount, totalSessions);
    score += Math.round((goalsRate / 100) * 2);

    // Therapeutic relationship rate (0-1)
    const relCount = childSessions.filter(
      (s) => s.therapeuticRelationshipStrong,
    ).length;
    const relRate = pct(relCount, totalSessions);
    score += Math.round((relRate / 100) * 1);

    return {
      childId,
      childName: data.childName,
      totalSessions,
      progressRate,
      engagementRate,
      overallScore: Math.min(10, Math.max(0, score)),
    };
  });
}

// -- Main Orchestrator ---------------------------------------------------------

export function generateTherapeuticInterventionQualityIntelligence(
  sessions: TherapySession[],
  policy: TherapeuticPolicy | null,
  training: StaffTherapeuticTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TherapeuticInterventionQualityIntelligence {
  const quality = evaluateQuality(sessions);
  const compliance = evaluateCompliance(sessions);
  const policyResult = evaluatePolicy(policy);
  const staffReadiness = evaluateStaffReadiness(training);

  const rawScore =
    quality.overallScore +
    compliance.overallScore +
    policyResult.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildTherapyProfiles(sessions);

  // -- Strengths --
  const strengths: string[] = [];
  if (sessions.length > 0 && quality.progressRate >= 75) {
    strengths.push(
      "High therapeutic progress rate — " +
        quality.progressRate +
        "% of sessions showing significant or good progress",
    );
  }
  if (sessions.length > 0 && quality.engagementRate === 100) {
    strengths.push(
      "Child engagement at 100% across all therapy sessions",
    );
  }
  if (sessions.length > 0 && quality.goalsReviewedRate === 100) {
    strengths.push(
      "Therapeutic goals reviewed in every session",
    );
  }
  if (sessions.length > 0 && quality.relationshipRate === 100) {
    strengths.push(
      "Strong therapeutic relationships maintained across all sessions",
    );
  }
  if (sessions.length > 0 && compliance.documentedRate === 100) {
    strengths.push(
      "All therapy sessions documented in care plans",
    );
  }
  if (sessions.length > 0 && compliance.staffSupportedRate === 100) {
    strengths.push(
      "Staff support provided consistently across all sessions",
    );
  }
  if (sessions.length > 0 && compliance.feedbackRate === 100) {
    strengths.push(
      "Feedback given after every therapy session",
    );
  }
  if (policy !== null && policyResult.overallScore === 25) {
    strengths.push(
      "Comprehensive therapeutic policy in place covering all required areas",
    );
  }
  if (training.length > 0 && staffReadiness.therapeuticAwarenessRate === 100) {
    strengths.push(
      "All staff trained in therapeutic awareness",
    );
  }
  if (training.length > 0 && staffReadiness.traumaInformedPracticeRate === 100) {
    strengths.push(
      "All staff trained in trauma-informed practice",
    );
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (sessions.length === 0) {
    areasForImprovement.push(
      "No therapy sessions recorded in period — children may not be receiving therapeutic support",
    );
  }
  if (sessions.length > 0 && quality.progressRate < 50) {
    areasForImprovement.push(
      "Therapeutic progress rate at " +
        quality.progressRate +
        "% — review intervention effectiveness",
    );
  }
  if (sessions.length > 0 && quality.engagementRate < 80) {
    areasForImprovement.push(
      "Child engagement rate at " +
        quality.engagementRate +
        "% — explore barriers to engagement",
    );
  }
  if (sessions.length > 0 && quality.goalsReviewedRate < 80) {
    areasForImprovement.push(
      "Goals reviewed in only " +
        quality.goalsReviewedRate +
        "% of sessions — target 100%",
    );
  }
  if (sessions.length > 0 && compliance.documentedRate < 100) {
    areasForImprovement.push(
      "Documentation rate at " +
        compliance.documentedRate +
        "% — all sessions must be recorded in care plans",
    );
  }
  if (sessions.length > 0 && compliance.feedbackRate < 80) {
    areasForImprovement.push(
      "Feedback rate at " +
        compliance.feedbackRate +
        "% — feedback should follow every session",
    );
  }
  if (policy === null) {
    areasForImprovement.push(
      "No therapeutic intervention policy in place — statutory requirement",
    );
  }
  if (policy !== null && !policy.therapeuticFramework) {
    areasForImprovement.push(
      "Therapeutic framework not documented in policy",
    );
  }
  if (policy !== null && !policy.referralPathway) {
    areasForImprovement.push(
      "Referral pathway missing from therapeutic policy",
    );
  }
  if (training.length === 0) {
    areasForImprovement.push(
      "No staff therapeutic training records — all staff must be trained",
    );
  }
  if (training.length > 0 && staffReadiness.therapeuticAwarenessRate < 100) {
    areasForImprovement.push(
      "Only " +
        staffReadiness.therapeuticAwarenessRate +
        "% of staff trained in therapeutic awareness — all staff require this training",
    );
  }
  if (training.length > 0 && staffReadiness.traumaInformedPracticeRate < 75) {
    areasForImprovement.push(
      "Trauma-informed practice training completed by only " +
        staffReadiness.traumaInformedPracticeRate +
        "% of staff",
    );
  }

  // -- Actions --
  const actions: string[] = [];
  const noProgressSessions = sessions.filter(
    (s) => s.progressLevel === "no_progress",
  );
  const notEngagedSessions = sessions.filter((s) => !s.childEngaged);
  const notDocumentedSessions = sessions.filter((s) => !s.documentedInPlan);

  if (noProgressSessions.length > 0) {
    actions.push(
      "URGENT: " +
        noProgressSessions.length +
        " session(s) with no progress — review therapeutic approach and consider alternative interventions",
    );
  }
  if (notEngagedSessions.length > 0) {
    actions.push(
      "URGENT: " +
        notEngagedSessions.length +
        " session(s) where child was not engaged — assess barriers and adapt approach",
    );
  }
  if (notDocumentedSessions.length > 0) {
    actions.push(
      "URGENT: " +
        notDocumentedSessions.length +
        " session(s) not documented in care plan — update records immediately",
    );
  }
  if (policy === null) {
    actions.push(
      "Create therapeutic intervention policy — statutory requirement under CHR 2015 Regulation 6",
    );
  }
  if (policy !== null && !policy.outcomeMeasurementPlan) {
    actions.push(
      "Establish outcome measurement plan within therapeutic policy",
    );
  }
  if (policy !== null && !policy.regularReview) {
    actions.push(
      "Establish regular review schedule for therapeutic intervention policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: Arrange therapeutic awareness training for all staff immediately",
    );
  }
  if (training.length > 0 && staffReadiness.traumaInformedPracticeRate < 100) {
    actions.push(
      "Ensure all staff complete trauma-informed practice training — currently " +
        staffReadiness.traumaInformedPracticeRate +
        "%",
    );
  }
  if (training.length > 0 && staffReadiness.attachmentTheoryRate < 100) {
    actions.push(
      "Ensure all staff complete attachment theory training — currently " +
        staffReadiness.attachmentTheoryRate +
        "%",
    );
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health and well-being (therapeutic support)",
    "CHR 2015 Regulation 14 — Duty to secure access to health services",
    "SCCIF — Health and well-being of children (therapeutic intervention)",
    "NMS 6 — Health and well-being (therapeutic services)",
    "Children Act 1989 — Welfare of the child (emotional health)",
    "UNCRC Article 39 — Recovery and reintegration",
    "NICE CG158 — Looked-after children: emotional wellbeing",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    quality,
    compliance,
    policy: policyResult,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
