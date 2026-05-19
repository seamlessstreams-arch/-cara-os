// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Emotional Regulation Support Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home supports children's emotional regulation through
// therapeutic approaches, co-regulation, and coping strategies.
//
// Maps to: CHR 2015 Reg 10 (duty of care), CHR 2015 Reg 12 (promoting health
// and wellbeing), SCCIF, NMS 3 (promoting good health and wellbeing),
// Children Act 1989, UNCRC Article 24, NICE CG158
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Unions ─────────────────────────────────────────────────────────────

export type StrategyType =
  | "breathing_exercises"
  | "grounding_techniques"
  | "sensory_tools"
  | "safe_space"
  | "co_regulation"
  | "emotion_coaching"
  | "mindfulness"
  | "physical_activity";

export type OutcomeLevel =
  | "very_effective"
  | "effective"
  | "partially_effective"
  | "not_effective";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ────────────────────────────────────────────────────────

export interface RegulationSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  strategyType: StrategyType;
  outcomeLevel: OutcomeLevel;
  childLed: boolean;
  staffCoRegulated: boolean;
  emotionIdentified: boolean;
  copingPlanUpdated: boolean;
  recordedInCasefile: boolean;
  therapeuticApproach: boolean;
}

export interface RegulationPolicy {
  id: string;
  emotionalRegulationFramework: boolean;
  coRegulationGuidance: boolean;
  therapeuticApproach: boolean;
  safeSpaceAvailable: boolean;
  sensoryToolsProvided: boolean;
  crisisDeescalation: boolean;
  regularReview: boolean;
}

export interface StaffRegulationTraining {
  id: string;
  staffId: string;
  staffName: string;
  emotionalRegulation: boolean;
  coRegulation: boolean;
  traumaInformed: boolean;
  sensoryProcessing: boolean;
  emotionCoaching: boolean;
  therapeuticApproach: boolean;
}

// ── Result Interfaces ───────────────────────────────────────────────────────

export interface SessionEffectivenessResult {
  totalSessions: number;
  positiveOutcomeRate: number;
  childLedRate: number;
  coRegulatedRate: number;
  recordedRate: number;
  emotionIdentifiedRate: number;
  overallScore: number;
}

export interface TherapeuticApproachResult {
  totalSessions: number;
  therapeuticRate: number;
  copingPlanUpdateRate: number;
  strategyDiversity: number;
  overallScore: number;
}

export interface RegulationPolicyResult {
  emotionalRegulationFramework: boolean;
  coRegulationGuidance: boolean;
  therapeuticApproach: boolean;
  safeSpaceAvailable: boolean;
  sensoryToolsProvided: boolean;
  crisisDeescalation: boolean;
  regularReview: boolean;
  overallScore: number;
}

export interface StaffRegulationReadinessResult {
  totalStaff: number;
  emotionalRegulationRate: number;
  coRegulationRate: number;
  traumaInformedRate: number;
  sensoryProcessingRate: number;
  emotionCoachingRate: number;
  therapeuticApproachRate: number;
  overallScore: number;
}

export interface ChildRegulationProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  strategyTypes: StrategyType[];
  childLedRate: number;
  positiveOutcomeRate: number;
  coRegulatedRate: number;
  overallScore: number;
  riskFactors: string[];
  protectiveFactors: string[];
}

export interface EmotionalRegulationSupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  sessionEffectiveness: SessionEffectivenessResult;
  therapeuticApproach: TherapeuticApproachResult;
  regulationPolicy: RegulationPolicyResult;
  staffReadiness: StaffRegulationReadinessResult;
  childProfiles: ChildRegulationProfile[];
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

// ── Label Maps & Getters ────────────────────────────────────────────────────

const strategyTypeLabels: Record<StrategyType, string> = {
  breathing_exercises: "Breathing Exercises",
  grounding_techniques: "Grounding Techniques",
  sensory_tools: "Sensory Tools",
  safe_space: "Safe Space",
  co_regulation: "Co-Regulation",
  emotion_coaching: "Emotion Coaching",
  mindfulness: "Mindfulness",
  physical_activity: "Physical Activity",
};

const outcomeLevelLabels: Record<OutcomeLevel, string> = {
  very_effective: "Very Effective",
  effective: "Effective",
  partially_effective: "Partially Effective",
  not_effective: "Not Effective",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getStrategyTypeLabel(type: StrategyType): string {
  return strategyTypeLabels[type] || type;
}

export function getOutcomeLevelLabel(level: OutcomeLevel): string {
  return outcomeLevelLabels[level] || level;
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating] || rating;
}

export function getStrategyTypeLabels(): Record<StrategyType, string> {
  return { ...strategyTypeLabels };
}

export function getOutcomeLevelLabels(): Record<OutcomeLevel, string> {
  return { ...outcomeLevelLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Evaluator 1: Session Effectiveness (0-25) ──────────────────────────────

export function evaluateSessionEffectiveness(sessions: RegulationSession[]): SessionEffectivenessResult {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      positiveOutcomeRate: 0,
      childLedRate: 0,
      coRegulatedRate: 0,
      recordedRate: 0,
      emotionIdentifiedRate: 0,
      overallScore: 0,
    };
  }

  const total = sessions.length;
  const positiveCount = sessions.filter(s => s.outcomeLevel === "very_effective" || s.outcomeLevel === "effective").length;
  const childLedCount = sessions.filter(s => s.childLed).length;
  const coRegulatedCount = sessions.filter(s => s.staffCoRegulated).length;
  const recordedCount = sessions.filter(s => s.recordedInCasefile).length;
  const emotionIdentifiedCount = sessions.filter(s => s.emotionIdentified).length;

  const positiveOutcomeRate = pct(positiveCount, total);
  const childLedRate = pct(childLedCount, total);
  const coRegulatedRate = pct(coRegulatedCount, total);
  const recordedRate = pct(recordedCount, total);
  const emotionIdentifiedRate = pct(emotionIdentifiedCount, total);

  // Outcome rate (0-7)
  const outcomeScore = Math.min(Math.round((positiveOutcomeRate / 100) * 7), 7);
  // Child-led rate (0-6)
  const childLedScore = Math.min(Math.round((childLedRate / 100) * 6), 6);
  // Co-regulated rate (0-6)
  const coRegulatedScore = Math.min(Math.round((coRegulatedRate / 100) * 6), 6);
  // Combined recorded + emotion identified (0-6)
  const combinedRate = pct(recordedCount + emotionIdentifiedCount, total * 2);
  const combinedScore = Math.min(Math.round((combinedRate / 100) * 6), 6);

  const overallScore = Math.min(outcomeScore + childLedScore + coRegulatedScore + combinedScore, 25);

  return {
    totalSessions: total,
    positiveOutcomeRate,
    childLedRate,
    coRegulatedRate,
    recordedRate,
    emotionIdentifiedRate,
    overallScore,
  };
}

// ── Evaluator 2: Therapeutic Approach (0-25) ────────────────────────────────

export function evaluateTherapeuticApproach(sessions: RegulationSession[]): TherapeuticApproachResult {
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      therapeuticRate: 0,
      copingPlanUpdateRate: 0,
      strategyDiversity: 0,
      overallScore: 0,
    };
  }

  const total = sessions.length;
  const therapeuticCount = sessions.filter(s => s.therapeuticApproach).length;
  const copingPlanCount = sessions.filter(s => s.copingPlanUpdated).length;

  const therapeuticRate = pct(therapeuticCount, total);
  const copingPlanUpdateRate = pct(copingPlanCount, total);

  const uniqueStrategies = new Set(sessions.map(s => s.strategyType)).size;
  const totalPossibleStrategies = 8; // total number of StrategyType values
  const strategyDiversity = uniqueStrategies;

  // Therapeutic rate (0-8)
  const therapeuticScore = Math.min(Math.round((therapeuticRate / 100) * 8), 8);
  // Coping plan update rate (0-9)
  const copingScore = Math.min(Math.round((copingPlanUpdateRate / 100) * 9), 9);
  // Strategy diversity (0-8)
  const diversityScore = Math.min(Math.round((uniqueStrategies / totalPossibleStrategies) * 8), 8);

  const overallScore = Math.min(therapeuticScore + copingScore + diversityScore, 25);

  return {
    totalSessions: total,
    therapeuticRate,
    copingPlanUpdateRate,
    strategyDiversity,
    overallScore,
  };
}

// ── Evaluator 3: Regulation Policy (0-25) ───────────────────────────────────

export function evaluateRegulationPolicy(policy: RegulationPolicy | null): RegulationPolicyResult {
  if (policy === null) {
    return {
      emotionalRegulationFramework: false,
      coRegulationGuidance: false,
      therapeuticApproach: false,
      safeSpaceAvailable: false,
      sensoryToolsProvided: false,
      crisisDeescalation: false,
      regularReview: false,
      overallScore: 0,
    };
  }

  // Boolean scoring per field (total = 25)
  // 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.emotionalRegulationFramework) score += 4;
  if (policy.coRegulationGuidance) score += 4;
  if (policy.therapeuticApproach) score += 4;
  if (policy.safeSpaceAvailable) score += 4;
  if (policy.sensoryToolsProvided) score += 3;
  if (policy.crisisDeescalation) score += 3;
  if (policy.regularReview) score += 3;

  const overallScore = Math.min(score, 25);

  return {
    emotionalRegulationFramework: policy.emotionalRegulationFramework,
    coRegulationGuidance: policy.coRegulationGuidance,
    therapeuticApproach: policy.therapeuticApproach,
    safeSpaceAvailable: policy.safeSpaceAvailable,
    sensoryToolsProvided: policy.sensoryToolsProvided,
    crisisDeescalation: policy.crisisDeescalation,
    regularReview: policy.regularReview,
    overallScore,
  };
}

// ── Evaluator 4: Staff Regulation Readiness (0-25) ──────────────────────────

export function evaluateStaffRegulationReadiness(training: StaffRegulationTraining[]): StaffRegulationReadinessResult {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      emotionalRegulationRate: 0,
      coRegulationRate: 0,
      traumaInformedRate: 0,
      sensoryProcessingRate: 0,
      emotionCoachingRate: 0,
      therapeuticApproachRate: 0,
      overallScore: 0,
    };
  }

  const total = training.length;
  const emotionalRegulationRate = pct(training.filter(t => t.emotionalRegulation).length, total);
  const coRegulationRate = pct(training.filter(t => t.coRegulation).length, total);
  const traumaInformedRate = pct(training.filter(t => t.traumaInformed).length, total);
  const sensoryProcessingRate = pct(training.filter(t => t.sensoryProcessing).length, total);
  const emotionCoachingRate = pct(training.filter(t => t.emotionCoaching).length, total);
  const therapeuticApproachRate = pct(training.filter(t => t.therapeuticApproach).length, total);

  // Rate-based scoring per field (total = 25)
  // emotionalRegulation=6, coRegulation=5, traumaInformed=5, sensoryProcessing=4, emotionCoaching=3, therapeuticApproach=2
  const erScore = Math.min(Math.round((emotionalRegulationRate / 100) * 6), 6);
  const crScore = Math.min(Math.round((coRegulationRate / 100) * 5), 5);
  const tiScore = Math.min(Math.round((traumaInformedRate / 100) * 5), 5);
  const spScore = Math.min(Math.round((sensoryProcessingRate / 100) * 4), 4);
  const ecScore = Math.min(Math.round((emotionCoachingRate / 100) * 3), 3);
  const taScore = Math.min(Math.round((therapeuticApproachRate / 100) * 2), 2);

  const overallScore = Math.min(erScore + crScore + tiScore + spScore + ecScore + taScore, 25);

  return {
    totalStaff: total,
    emotionalRegulationRate,
    coRegulationRate,
    traumaInformedRate,
    sensoryProcessingRate,
    emotionCoachingRate,
    therapeuticApproachRate,
    overallScore,
  };
}

// ── Child Regulation Profiles ───────────────────────────────────────────────

export function buildChildRegulationProfiles(sessions: RegulationSession[]): ChildRegulationProfile[] {
  const childIds = new Set<string>();
  for (const s of sessions) childIds.add(s.childId);

  if (childIds.size === 0) return [];

  return Array.from(childIds).map(childId => {
    const childSessions = sessions.filter(s => s.childId === childId);
    const childName = childSessions[0]?.childName || childId;

    const totalSessions = childSessions.length;
    const strategyTypes = [...new Set(childSessions.map(s => s.strategyType))];

    const childLedCount = childSessions.filter(s => s.childLed).length;
    const childLedRate = pct(childLedCount, totalSessions);

    const positiveCount = childSessions.filter(s => s.outcomeLevel === "very_effective" || s.outcomeLevel === "effective").length;
    const positiveOutcomeRate = pct(positiveCount, totalSessions);

    const coRegulatedCount = childSessions.filter(s => s.staffCoRegulated).length;
    const coRegulatedRate = pct(coRegulatedCount, totalSessions);

    // Overall score 0-10
    let score = 0;
    // Positive outcome rate (0-3)
    score += Math.min(Math.round((positiveOutcomeRate / 100) * 3), 3);
    // Child-led rate (0-3)
    score += Math.min(Math.round((childLedRate / 100) * 3), 3);
    // Co-regulated rate (0-2)
    score += Math.min(Math.round((coRegulatedRate / 100) * 2), 2);
    // Strategy diversity (0-2)
    score += Math.min(Math.round((strategyTypes.length / 8) * 2), 2);

    const overallScore = Math.min(score, 10);

    // Risk and protective factors
    const riskFactors: string[] = [];
    const protectiveFactors: string[] = [];

    if (positiveOutcomeRate < 50 && totalSessions > 0) riskFactors.push("Low positive outcome rate from regulation sessions");
    if (childLedRate < 30 && totalSessions > 0) riskFactors.push("Child rarely leads their own regulation — limited autonomy");
    if (coRegulatedRate < 50 && totalSessions > 0) riskFactors.push("Low co-regulation rate — child may lack adult support during dysregulation");
    if (strategyTypes.length <= 1 && totalSessions > 0) riskFactors.push("Limited strategy variety — child relies on single approach");
    if (totalSessions <= 1) riskFactors.push("Very few regulation sessions recorded — monitoring needed");

    if (positiveOutcomeRate >= 80 && totalSessions > 0) protectiveFactors.push("High positive outcome rate from regulation sessions");
    if (childLedRate >= 60 && totalSessions > 0) protectiveFactors.push("Child frequently leads their own regulation — good autonomy");
    if (coRegulatedRate >= 80 && totalSessions > 0) protectiveFactors.push("Strong co-regulation support from staff");
    if (strategyTypes.length >= 3) protectiveFactors.push("Diverse range of regulation strategies used");
    if (totalSessions >= 5) protectiveFactors.push("Good volume of regulation sessions — consistent support");

    return {
      childId,
      childName,
      totalSessions,
      strategyTypes,
      childLedRate,
      positiveOutcomeRate,
      coRegulatedRate,
      overallScore,
      riskFactors,
      protectiveFactors,
    };
  });
}

// ── Main Orchestrator ───────────────────────────────────────────────────────

export function generateEmotionalRegulationSupportIntelligence(
  sessions: RegulationSession[],
  policy: RegulationPolicy | null,
  training: StaffRegulationTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EmotionalRegulationSupportIntelligence {
  const sessionEffectiveness = evaluateSessionEffectiveness(sessions);
  const therapeuticApproach = evaluateTherapeuticApproach(sessions);
  const regulationPolicy = evaluateRegulationPolicy(policy);
  const staffReadiness = evaluateStaffRegulationReadiness(training);
  const childProfiles = buildChildRegulationProfiles(sessions);

  // Sum 4 evaluators (each 0-25, total 0-100)
  const rawScore = sessionEffectiveness.overallScore + therapeuticApproach.overallScore + regulationPolicy.overallScore + staffReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  // Strengths
  const strengths: string[] = [];
  if (sessionEffectiveness.overallScore >= 20) strengths.push("Strong session effectiveness with positive outcomes and good recording practices");
  if (sessionEffectiveness.positiveOutcomeRate >= 80) strengths.push("High positive outcome rate demonstrates effective regulation support");
  if (sessionEffectiveness.childLedRate >= 60) strengths.push("Children frequently lead their own regulation — promoting autonomy and resilience");
  if (sessionEffectiveness.coRegulatedRate >= 80) strengths.push("Excellent co-regulation support from staff during dysregulation episodes");
  if (therapeuticApproach.therapeuticRate >= 80) strengths.push("Therapeutic approaches consistently embedded in regulation sessions");
  if (therapeuticApproach.copingPlanUpdateRate >= 80) strengths.push("Coping plans regularly updated to reflect children's progress");
  if (therapeuticApproach.strategyDiversity >= 5) strengths.push("Wide range of regulation strategies offered including sensory, therapeutic, and physical approaches");
  if (regulationPolicy.overallScore >= 20) strengths.push("Comprehensive emotional regulation policy covering framework, co-regulation, and therapeutic approaches");
  if (regulationPolicy.safeSpaceAvailable && regulationPolicy.sensoryToolsProvided) strengths.push("Safe spaces and sensory tools available to support children's regulation needs");
  if (staffReadiness.overallScore >= 20) strengths.push("Strong staff readiness across emotional regulation, co-regulation, and trauma-informed practice");
  if (staffReadiness.emotionalRegulationRate >= 80) strengths.push("Majority of staff trained in emotional regulation — consistent responses to children's needs");
  if (staffReadiness.coRegulationRate >= 80) strengths.push("Strong co-regulation training coverage supports children during emotional crises");

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (sessionEffectiveness.positiveOutcomeRate < 60 && sessionEffectiveness.totalSessions > 0) areasForImprovement.push("Positive outcome rate from regulation sessions is below expected level — review strategy selection");
  if (sessionEffectiveness.childLedRate < 40 && sessionEffectiveness.totalSessions > 0) areasForImprovement.push("Children rarely lead their own regulation — more opportunities for autonomy needed");
  if (sessionEffectiveness.coRegulatedRate < 60 && sessionEffectiveness.totalSessions > 0) areasForImprovement.push("Co-regulation support is inconsistent — staff should be more actively involved during dysregulation");
  if (sessionEffectiveness.recordedRate < 80 && sessionEffectiveness.totalSessions > 0) areasForImprovement.push("Not all regulation sessions are recorded in casefiles — documentation gaps identified");
  if (sessionEffectiveness.emotionIdentifiedRate < 80 && sessionEffectiveness.totalSessions > 0) areasForImprovement.push("Emotions not consistently identified during sessions — limits understanding of triggers");
  if (therapeuticApproach.therapeuticRate < 60 && therapeuticApproach.totalSessions > 0) areasForImprovement.push("Therapeutic approaches underused in regulation sessions — greater integration needed");
  if (therapeuticApproach.copingPlanUpdateRate < 60 && therapeuticApproach.totalSessions > 0) areasForImprovement.push("Coping plans not regularly updated — risk of outdated strategies");
  if (therapeuticApproach.strategyDiversity < 3 && therapeuticApproach.totalSessions > 0) areasForImprovement.push("Limited variety of regulation strategies — children benefit from multiple approaches");
  if (!regulationPolicy.emotionalRegulationFramework) areasForImprovement.push("No emotional regulation framework in policy — foundational guidance is missing");
  if (!regulationPolicy.coRegulationGuidance) areasForImprovement.push("Policy lacks co-regulation guidance — staff need clear direction on supporting dysregulated children");
  if (!regulationPolicy.crisisDeescalation) areasForImprovement.push("Crisis de-escalation procedures not included in policy — risk during high-intensity episodes");
  if (!regulationPolicy.safeSpaceAvailable) areasForImprovement.push("No safe space available for children to regulate — physical environment needs attention");
  if (!regulationPolicy.sensoryToolsProvided) areasForImprovement.push("Sensory tools not provided — many children benefit from sensory-based regulation approaches");
  if (staffReadiness.emotionalRegulationRate < 80) areasForImprovement.push("Emotional regulation training coverage is insufficient — all staff should be trained");
  if (staffReadiness.coRegulationRate < 60) areasForImprovement.push("Co-regulation training is low — staff need skills to support children's emotional crises");
  if (staffReadiness.traumaInformedRate < 60) areasForImprovement.push("Trauma-informed practice training is insufficient — essential for understanding dysregulation");

  // Actions
  const actions: string[] = [];
  if (sessionEffectiveness.positiveOutcomeRate < 60 && sessionEffectiveness.totalSessions > 0) actions.push("Review regulation strategies for children with low outcome rates and consider alternative approaches");
  if (sessionEffectiveness.childLedRate < 40 && sessionEffectiveness.totalSessions > 0) actions.push("Develop opportunities for children to lead their own regulation with graduated support");
  if (sessionEffectiveness.recordedRate < 80 && sessionEffectiveness.totalSessions > 0) actions.push("Implement a recording protocol to ensure all regulation sessions are documented in casefiles");
  if (therapeuticApproach.copingPlanUpdateRate < 60 && therapeuticApproach.totalSessions > 0) actions.push("Schedule regular coping plan reviews for all children to ensure strategies remain current");
  if (therapeuticApproach.strategyDiversity < 3 && therapeuticApproach.totalSessions > 0) actions.push("Expand the range of regulation strategies available including sensory, mindfulness, and physical approaches");
  if (!regulationPolicy.emotionalRegulationFramework) actions.push("Develop and embed an emotional regulation framework within the home's policy");
  if (!regulationPolicy.coRegulationGuidance) actions.push("Add co-regulation guidance to the policy so staff have clear protocols for supporting dysregulated children");
  if (!regulationPolicy.crisisDeescalation) actions.push("Establish crisis de-escalation procedures within the emotional regulation policy");
  if (!regulationPolicy.safeSpaceAvailable) actions.push("Create a designated safe space where children can go to regulate their emotions");
  if (!regulationPolicy.sensoryToolsProvided) actions.push("Procure and make available sensory regulation tools for children's use");
  if (staffReadiness.emotionalRegulationRate < 100) actions.push("Schedule emotional regulation training for all staff who have not yet completed it");
  if (staffReadiness.coRegulationRate < 80) actions.push("Provide co-regulation training to increase staff confidence in supporting dysregulated children");
  if (staffReadiness.traumaInformedRate < 80) actions.push("Deliver trauma-informed practice training to strengthen understanding of emotional dysregulation");

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — Duty of care including supporting children's emotional wellbeing and regulation",
    "CHR 2015 Reg 12 — Promoting health and development including emotional and psychological health",
    "SCCIF — Experiences and progress of children including emotional wellbeing and regulation support",
    "NMS 3 — Promoting good health and wellbeing including emotional and mental health",
    "Children Act 1989 — Welfare of the child including emotional and behavioural development needs",
    "UNCRC Article 24 — Right to the highest attainable standard of health including mental and emotional wellbeing",
    "NICE CG158 — Antisocial behaviour and conduct disorders including emotional regulation strategies",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    sessionEffectiveness,
    therapeuticApproach,
    regulationPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
