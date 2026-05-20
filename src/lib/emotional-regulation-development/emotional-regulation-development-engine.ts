// Emotional Regulation Development Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type Unions ─────────────────────────────────────────────────────────────

export type RegulationStrategy =
  | "deep_breathing"
  | "grounding_technique"
  | "mindfulness"
  | "physical_activity"
  | "creative_expression"
  | "talking_therapy"
  | "sensory_tool"
  | "safe_space_use";

export type EmotionalState =
  | "calm_regulated"
  | "mildly_dysregulated"
  | "moderately_dysregulated"
  | "highly_dysregulated"
  | "crisis";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps & Getters ────────────────────────────────────────────────────

const regulationStrategyLabels: Record<RegulationStrategy, string> = {
  deep_breathing: "Deep Breathing",
  grounding_technique: "Grounding Technique",
  mindfulness: "Mindfulness",
  physical_activity: "Physical Activity",
  creative_expression: "Creative Expression",
  talking_therapy: "Talking Therapy",
  sensory_tool: "Sensory Tool",
  safe_space_use: "Safe Space Use",
};

const emotionalStateLabels: Record<EmotionalState, string> = {
  calm_regulated: "Calm / Regulated",
  mildly_dysregulated: "Mildly Dysregulated",
  moderately_dysregulated: "Moderately Dysregulated",
  highly_dysregulated: "Highly Dysregulated",
  crisis: "Crisis",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRegulationStrategyLabel(strategy: RegulationStrategy): string {
  return regulationStrategyLabels[strategy] || strategy;
}

export function getEmotionalStateLabel(state: EmotionalState): string {
  return emotionalStateLabels[state] || state;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] || rating;
}

export function getRegulationStrategyLabels(): Record<RegulationStrategy, string> {
  return { ...regulationStrategyLabels };
}

export function getEmotionalStateLabels(): Record<EmotionalState, string> {
  return { ...emotionalStateLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface RegulationSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  strategyUsed: RegulationStrategy;
  emotionalStateBefore: EmotionalState;
  emotionalStateAfter: EmotionalState;
  staffGuided: boolean;
  childInitiated: boolean;
  progressNoted: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface EmotionalRegulationPolicy {
  id: string;
  emotionalWellbeingStrategy: boolean;
  therapeuticApproachFramework: boolean;
  crisisInterventionProtocol: boolean;
  deEscalationProcedure: boolean;
  sensoryEnvironmentPolicy: boolean;
  staffEmotionalSupportGuidance: boolean;
  regularReview: boolean;
}

export interface StaffEmotionalRegulationTraining {
  id: string;
  staffId: string;
  staffName: string;
  emotionalLiteracy: boolean;
  deEscalationTechniques: boolean;
  therapeuticApproaches: boolean;
  traumaInformedCare: boolean;
  crisisIntervention: boolean;
  reflectivePractice: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface RegulationQualityResult {
  overallScore: number;
  totalSessions: number;
  improvementRate: number;
  childInitiatedRate: number;
  progressRate: number;
  strategyEffectivenessRate: number;
}

export interface RegulationComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  strategyDiversityRatio: number;
}

export interface RegulationPolicyResult {
  overallScore: number;
  emotionalWellbeingStrategy: boolean;
  therapeuticApproachFramework: boolean;
  crisisInterventionProtocol: boolean;
  deEscalationProcedure: boolean;
  sensoryEnvironmentPolicy: boolean;
  staffEmotionalSupportGuidance: boolean;
  regularReview: boolean;
}

export interface StaffEmotionalRegulationReadinessResult {
  overallScore: number;
  totalStaff: number;
  emotionalLiteracyRate: number;
  deEscalationTechniquesRate: number;
  therapeuticApproachesRate: number;
  traumaInformedCareRate: number;
  crisisInterventionRate: number;
  reflectivePracticeRate: number;
}

export interface ChildEmotionalRegulationProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  improvementRate: number;
  childInitiatedRate: number;
  overallScore: number;
}

export interface EmotionalRegulationDevelopmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  regulationQuality: RegulationQualityResult;
  regulationCompliance: RegulationComplianceResult;
  regulationPolicy: RegulationPolicyResult;
  staffReadiness: StaffEmotionalRegulationReadinessResult;
  childProfiles: ChildEmotionalRegulationProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

// ── Improvement Logic ───────────────────────────────────────────────────────

const emotionalStateRank: Record<EmotionalState, number> = {
  calm_regulated: 0,
  mildly_dysregulated: 1,
  moderately_dysregulated: 2,
  highly_dysregulated: 3,
  crisis: 4,
};

function isImprovement(before: EmotionalState, after: EmotionalState): boolean {
  return emotionalStateRank[after] < emotionalStateRank[before];
}

// ── Evaluator 1: Regulation Quality (0-25) ──────────────────────────────────

export function evaluateRegulationQuality(sessions: RegulationSession[]): RegulationQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      improvementRate: 0,
      childInitiatedRate: 0,
      progressRate: 0,
      strategyEffectivenessRate: 0,
    };
  }

  const total = sessions.length;
  const improvedCount = sessions.filter(s => isImprovement(s.emotionalStateBefore, s.emotionalStateAfter)).length;
  const childInitiatedCount = sessions.filter(s => s.childInitiated).length;
  const progressCount = sessions.filter(s => s.progressNoted).length;
  const effectiveCount = sessions.filter(s => isImprovement(s.emotionalStateBefore, s.emotionalStateAfter)).length;

  const improvementRate = pct(improvedCount, total);
  const childInitiatedRate = pct(childInitiatedCount, total);
  const progressRate = pct(progressCount, total);
  const strategyEffectivenessRate = pct(effectiveCount, total);

  // Weighted: improvement 0-7, childInitiated 0-6, progress 0-6, effectiveness 0-6
  const improvementScore = Math.min(Math.round((improvementRate / 100) * 7), 7);
  const childInitiatedScore = Math.min(Math.round((childInitiatedRate / 100) * 6), 6);
  const progressScore = Math.min(Math.round((progressRate / 100) * 6), 6);
  const effectivenessScore = Math.min(Math.round((strategyEffectivenessRate / 100) * 6), 6);

  const overallScore = Math.min(improvementScore + childInitiatedScore + progressScore + effectivenessScore, 25);

  return {
    overallScore,
    totalSessions: total,
    improvementRate,
    childInitiatedRate,
    progressRate,
    strategyEffectivenessRate,
  };
}

// ── Evaluator 2: Regulation Compliance (0-25) ───────────────────────────────

export function evaluateRegulationCompliance(sessions: RegulationSession[]): RegulationComplianceResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      staffSupportedRate: 0,
      feedbackRate: 0,
      strategyDiversityRatio: 0,
    };
  }

  const total = sessions.length;
  const documentedCount = sessions.filter(s => s.documentedInPlan).length;
  const staffSupportedCount = sessions.filter(s => s.staffSupported).length;
  const feedbackCount = sessions.filter(s => s.feedbackGiven).length;

  const documentedRate = pct(documentedCount, total);
  const staffSupportedRate = pct(staffSupportedCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const uniqueStrategies = new Set(sessions.map(s => s.strategyUsed)).size;
  const strategyDiversityRatio = pct(uniqueStrategies, 8);

  // Weighted: documented 0-8, staffSupported 0-7, feedback 0-5, diversity 0-5
  const documentedScore = Math.min(Math.round((documentedRate / 100) * 8), 8);
  const staffSupportedScore = Math.min(Math.round((staffSupportedRate / 100) * 7), 7);
  const feedbackScore = Math.min(Math.round((feedbackRate / 100) * 5), 5);
  const diversityScore = Math.min(Math.round((strategyDiversityRatio / 100) * 5), 5);

  const overallScore = Math.min(documentedScore + staffSupportedScore + feedbackScore + diversityScore, 25);

  return {
    overallScore,
    documentedRate,
    staffSupportedRate,
    feedbackRate,
    strategyDiversityRatio,
  };
}

// ── Evaluator 3: Regulation Policy (0-25) ───────────────────────────────────

export function evaluateRegulationPolicy(policy: EmotionalRegulationPolicy | null): RegulationPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      emotionalWellbeingStrategy: false,
      therapeuticApproachFramework: false,
      crisisInterventionProtocol: false,
      deEscalationProcedure: false,
      sensoryEnvironmentPolicy: false,
      staffEmotionalSupportGuidance: false,
      regularReview: false,
    };
  }

  // Boolean scoring per field (total = 25)
  // 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.emotionalWellbeingStrategy) score += 4;
  if (policy.therapeuticApproachFramework) score += 4;
  if (policy.crisisInterventionProtocol) score += 4;
  if (policy.deEscalationProcedure) score += 4;
  if (policy.sensoryEnvironmentPolicy) score += 3;
  if (policy.staffEmotionalSupportGuidance) score += 3;
  if (policy.regularReview) score += 3;

  const overallScore = Math.min(score, 25);

  return {
    overallScore,
    emotionalWellbeingStrategy: policy.emotionalWellbeingStrategy,
    therapeuticApproachFramework: policy.therapeuticApproachFramework,
    crisisInterventionProtocol: policy.crisisInterventionProtocol,
    deEscalationProcedure: policy.deEscalationProcedure,
    sensoryEnvironmentPolicy: policy.sensoryEnvironmentPolicy,
    staffEmotionalSupportGuidance: policy.staffEmotionalSupportGuidance,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Emotional Regulation Readiness (0-25) ────────────────

export function evaluateStaffEmotionalRegulationReadiness(training: StaffEmotionalRegulationTraining[]): StaffEmotionalRegulationReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      emotionalLiteracyRate: 0,
      deEscalationTechniquesRate: 0,
      therapeuticApproachesRate: 0,
      traumaInformedCareRate: 0,
      crisisInterventionRate: 0,
      reflectivePracticeRate: 0,
    };
  }

  const total = training.length;
  const emotionalLiteracyRate = pct(training.filter(t => t.emotionalLiteracy).length, total);
  const deEscalationTechniquesRate = pct(training.filter(t => t.deEscalationTechniques).length, total);
  const therapeuticApproachesRate = pct(training.filter(t => t.therapeuticApproaches).length, total);
  const traumaInformedCareRate = pct(training.filter(t => t.traumaInformedCare).length, total);
  const crisisInterventionRate = pct(training.filter(t => t.crisisIntervention).length, total);
  const reflectivePracticeRate = pct(training.filter(t => t.reflectivePractice).length, total);

  // Rate-based scoring per field (total = 25)
  // emotionalLiteracy=6, deEscalation=5, therapeutic=5, traumaInformed=4, crisis=3, reflective=2
  const elScore = Math.min(Math.round((emotionalLiteracyRate / 100) * 6), 6);
  const deScore = Math.min(Math.round((deEscalationTechniquesRate / 100) * 5), 5);
  const taScore = Math.min(Math.round((therapeuticApproachesRate / 100) * 5), 5);
  const tiScore = Math.min(Math.round((traumaInformedCareRate / 100) * 4), 4);
  const ciScore = Math.min(Math.round((crisisInterventionRate / 100) * 3), 3);
  const rpScore = Math.min(Math.round((reflectivePracticeRate / 100) * 2), 2);

  const overallScore = Math.min(elScore + deScore + taScore + tiScore + ciScore + rpScore, 25);

  return {
    overallScore,
    totalStaff: total,
    emotionalLiteracyRate,
    deEscalationTechniquesRate,
    therapeuticApproachesRate,
    traumaInformedCareRate,
    crisisInterventionRate,
    reflectivePracticeRate,
  };
}

// ── Child Emotional Regulation Profiles ─────────────────────────────────────

export function buildChildEmotionalRegulationProfiles(sessions: RegulationSession[]): ChildEmotionalRegulationProfile[] {
  const childIds = new Set<string>();
  for (const s of sessions) childIds.add(s.childId);

  if (childIds.size === 0) return [];

  return Array.from(childIds).map(childId => {
    const childSessions = sessions.filter(s => s.childId === childId);
    const childName = childSessions[0]?.childName || childId;

    const totalSessions = childSessions.length;
    const improvedCount = childSessions.filter(s => isImprovement(s.emotionalStateBefore, s.emotionalStateAfter)).length;
    const childInitiatedCount = childSessions.filter(s => s.childInitiated).length;

    const improvementRate = pct(improvedCount, totalSessions);
    const childInitiatedRate = pct(childInitiatedCount, totalSessions);

    // Score 0-10
    let score = 0;

    // Frequency: >=10 -> 2, >=5 -> 1
    if (totalSessions >= 10) score += 2;
    else if (totalSessions >= 5) score += 1;

    // Improvement: >=80 -> 3, >=60 -> 2, >=40 -> 1
    if (improvementRate >= 80) score += 3;
    else if (improvementRate >= 60) score += 2;
    else if (improvementRate >= 40) score += 1;

    // Child-initiated: >=80 -> 3, >=60 -> 2, >=40 -> 1
    if (childInitiatedRate >= 80) score += 3;
    else if (childInitiatedRate >= 60) score += 2;
    else if (childInitiatedRate >= 40) score += 1;

    // Diversity: unique strategies >=4 -> 2, >=2 -> 1
    const uniqueStrategies = new Set(childSessions.map(s => s.strategyUsed)).size;
    if (uniqueStrategies >= 4) score += 2;
    else if (uniqueStrategies >= 2) score += 1;

    const overallScore = Math.min(score, 10);

    return {
      childId,
      childName,
      totalSessions,
      improvementRate,
      childInitiatedRate,
      overallScore,
    };
  });
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

export function generateEmotionalRegulationDevelopmentIntelligence(
  sessions: RegulationSession[],
  policy: EmotionalRegulationPolicy | null,
  training: StaffEmotionalRegulationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EmotionalRegulationDevelopmentIntelligence {
  const regulationQuality = evaluateRegulationQuality(sessions);
  const regulationCompliance = evaluateRegulationCompliance(sessions);
  const regulationPolicyResult = evaluateRegulationPolicy(policy);
  const staffReadiness = evaluateStaffEmotionalRegulationReadiness(training);
  const childProfiles = buildChildEmotionalRegulationProfiles(sessions);

  // Sum 4 evaluators (each 0-25, total 0-100)
  const rawScore = regulationQuality.overallScore + regulationCompliance.overallScore + regulationPolicyResult.overallScore + staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  // Strengths (at >=80)
  const strengths: string[] = [];
  if (regulationQuality.improvementRate >= 80) strengths.push("High emotional state improvement rate across regulation sessions — children are making clear progress");
  if (regulationQuality.childInitiatedRate >= 80) strengths.push("Children frequently initiate their own regulation strategies — strong autonomy and self-awareness");
  if (regulationQuality.progressRate >= 80) strengths.push("Progress consistently noted in regulation sessions — effective monitoring of emotional development");
  if (regulationQuality.strategyEffectivenessRate >= 80) strengths.push("Regulation strategies are highly effective — evidence of well-matched approaches for children");
  if (regulationCompliance.documentedRate >= 80) strengths.push("Regulation sessions consistently documented in care plans — strong record-keeping practice");
  if (regulationCompliance.staffSupportedRate >= 80) strengths.push("Staff provide consistent support during regulation sessions — children feel safe and guided");
  if (regulationCompliance.feedbackRate >= 80) strengths.push("Feedback regularly given following regulation sessions — promotes reflective practice");
  if (regulationCompliance.strategyDiversityRatio >= 80) strengths.push("Wide diversity of regulation strategies in use — children benefit from varied approaches");
  if (regulationPolicyResult.overallScore >= 20) strengths.push("Comprehensive emotional regulation policy covering wellbeing, therapeutic, and crisis frameworks");
  if (staffReadiness.overallScore >= 20) strengths.push("Strong staff readiness across emotional literacy, de-escalation, and trauma-informed care");
  if (staffReadiness.emotionalLiteracyRate >= 80) strengths.push("Majority of staff trained in emotional literacy — consistent understanding of children's emotional needs");
  if (staffReadiness.deEscalationTechniquesRate >= 80) strengths.push("Strong de-escalation training coverage supports safe responses during dysregulation");

  // Areas for improvement (at <60)
  const areasForImprovement: string[] = [];
  if (regulationQuality.improvementRate < 60 && regulationQuality.totalSessions > 0) areasForImprovement.push("Emotional state improvement rate is below expected level — review strategy matching for children");
  if (regulationQuality.childInitiatedRate < 60 && regulationQuality.totalSessions > 0) areasForImprovement.push("Children rarely initiate their own regulation — more opportunities for autonomy needed");
  if (regulationQuality.progressRate < 60 && regulationQuality.totalSessions > 0) areasForImprovement.push("Progress not consistently noted in regulation sessions — monitoring gaps identified");
  if (regulationQuality.strategyEffectivenessRate < 60 && regulationQuality.totalSessions > 0) areasForImprovement.push("Strategy effectiveness rate is low — consider reviewing and adjusting approaches");
  if (regulationCompliance.documentedRate < 60 && sessions.length > 0) areasForImprovement.push("Regulation sessions not consistently documented in care plans — compliance gaps identified");
  if (regulationCompliance.staffSupportedRate < 60 && sessions.length > 0) areasForImprovement.push("Staff support during regulation sessions is inconsistent — children may lack guidance");
  if (regulationCompliance.feedbackRate < 60 && sessions.length > 0) areasForImprovement.push("Feedback not regularly given after regulation sessions — limits reflective learning");
  if (regulationCompliance.strategyDiversityRatio < 60 && sessions.length > 0) areasForImprovement.push("Limited diversity of regulation strategies — children benefit from varied approaches");
  if (!regulationPolicyResult.emotionalWellbeingStrategy) areasForImprovement.push("No emotional wellbeing strategy in policy — foundational guidance is missing");
  if (!regulationPolicyResult.therapeuticApproachFramework) areasForImprovement.push("Policy lacks therapeutic approach framework — structured support is needed");
  if (!regulationPolicyResult.crisisInterventionProtocol) areasForImprovement.push("Crisis intervention protocol not included in policy — risk during high-intensity episodes");
  if (!regulationPolicyResult.deEscalationProcedure) areasForImprovement.push("De-escalation procedure missing from policy — staff need clear guidance");
  if (!regulationPolicyResult.sensoryEnvironmentPolicy) areasForImprovement.push("Sensory environment policy not in place — many children benefit from sensory-based regulation");
  if (!regulationPolicyResult.staffEmotionalSupportGuidance) areasForImprovement.push("Staff emotional support guidance missing — staff need support to support children");
  if (!regulationPolicyResult.regularReview) areasForImprovement.push("No regular review of emotional regulation policy — risk of outdated practices");
  if (staffReadiness.emotionalLiteracyRate < 80 && staffReadiness.totalStaff > 0) areasForImprovement.push("Emotional literacy training coverage is insufficient — all staff should be trained");
  if (staffReadiness.deEscalationTechniquesRate < 60 && staffReadiness.totalStaff > 0) areasForImprovement.push("De-escalation techniques training is low — staff need skills to manage dysregulation safely");
  if (staffReadiness.traumaInformedCareRate < 60 && staffReadiness.totalStaff > 0) areasForImprovement.push("Trauma-informed care training is insufficient — essential for understanding emotional dysregulation");

  // URGENT for missing data
  const actions: string[] = [];
  if (sessions.length === 0) actions.push("URGENT: No regulation sessions recorded — begin documenting emotional regulation support immediately");
  if (policy === null) actions.push("URGENT: No emotional regulation policy in place — develop and implement one as a priority");
  if (training.length === 0) actions.push("URGENT: No staff emotional regulation training records — schedule training for all staff immediately");
  if (regulationQuality.improvementRate < 60 && regulationQuality.totalSessions > 0) actions.push("Review regulation strategies for children with low improvement rates and consider alternative approaches");
  if (regulationQuality.childInitiatedRate < 60 && regulationQuality.totalSessions > 0) actions.push("Develop opportunities for children to initiate their own regulation with graduated support");
  if (regulationCompliance.documentedRate < 60 && sessions.length > 0) actions.push("Implement a documentation protocol to ensure all regulation sessions are recorded in care plans");
  if (regulationCompliance.feedbackRate < 60 && sessions.length > 0) actions.push("Establish a feedback routine following regulation sessions to promote reflective learning");
  if (!regulationPolicyResult.emotionalWellbeingStrategy) actions.push("Develop and embed an emotional wellbeing strategy within the home's policy");
  if (!regulationPolicyResult.crisisInterventionProtocol) actions.push("Establish a crisis intervention protocol within the emotional regulation policy");
  if (!regulationPolicyResult.deEscalationProcedure) actions.push("Add de-escalation procedures to the policy so staff have clear protocols");
  if (staffReadiness.emotionalLiteracyRate < 100 && staffReadiness.totalStaff > 0) actions.push("Schedule emotional literacy training for all staff who have not yet completed it");
  if (staffReadiness.deEscalationTechniquesRate < 80 && staffReadiness.totalStaff > 0) actions.push("Provide de-escalation techniques training to increase staff confidence in managing dysregulation");
  if (staffReadiness.traumaInformedCareRate < 80 && staffReadiness.totalStaff > 0) actions.push("Deliver trauma-informed care training to strengthen understanding of emotional dysregulation");

  const regulatoryLinks = [
    "CHR 2015 Regulation 6 — Health and well-being standard (emotional)",
    "CHR 2015 Regulation 12 — Positive behaviour support",
    "SCCIF — Experiences and progress of children (emotional development)",
    "NMS 3 — Health and well-being (emotional regulation)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 39 — Recovery and reintegration",
    "NICE CG158 — Looked-after children: emotional wellbeing",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    regulationQuality,
    regulationCompliance,
    regulationPolicy: regulationPolicyResult,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
