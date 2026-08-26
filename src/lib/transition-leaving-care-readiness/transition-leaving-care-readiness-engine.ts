import { below, meets, rate } from "@/lib/metrics/rate";
// Transition & Leaving Care Readiness Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type ReadinessArea =
  | "independent_living_skills"
  | "financial_literacy"
  | "education_employment"
  | "health_management"
  | "housing_planning"
  | "social_networks"
  | "emotional_resilience"
  | "identity_belonging";

export type ProgressLevel =
  | "exceeding"
  | "on_track"
  | "developing"
  | "behind"
  | "not_started";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const READINESS_AREA_LABELS: Record<ReadinessArea, string> = {
  independent_living_skills: "Independent Living Skills",
  financial_literacy: "Financial Literacy",
  education_employment: "Education & Employment",
  health_management: "Health Management",
  housing_planning: "Housing Planning",
  social_networks: "Social Networks",
  emotional_resilience: "Emotional Resilience",
  identity_belonging: "Identity & Belonging",
};

const PROGRESS_LEVEL_LABELS: Record<ProgressLevel, string> = {
  exceeding: "Exceeding",
  on_track: "On Track",
  developing: "Developing",
  behind: "Behind",
  not_started: "Not Started",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getReadinessAreaLabel(v: ReadinessArea): string { return READINESS_AREA_LABELS[v]; }
export function getProgressLevelLabel(v: ProgressLevel): string { return PROGRESS_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface TransitionAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  readinessArea: ReadinessArea;
  progressLevel: ProgressLevel;
  pathwayPlanLinked: boolean;
  personalAdvisorInvolved: boolean;
  childVoiceCaptured: boolean;
  goalsSet: boolean;
  documentedInPlan: boolean;
  reviewScheduled: boolean;
}

export interface TransitionPolicy {
  id: string;
  pathwayPlanningFramework: boolean;
  independenceProgramme: boolean;
  personalAdvisorAllocation: boolean;
  housingPathway: boolean;
  financialCapabilityPlan: boolean;
  healthPassportScheme: boolean;
  regularReview: boolean;
}

export interface StaffTransitionTraining {
  id: string;
  staffId: string;
  staffName: string;
  leavingCareAct: boolean;
  pathwayPlanning: boolean;
  independencePractical: boolean;
  financialCapability: boolean;
  emotionalResilience: boolean;
  housingOptions: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface ReadinessPreparationResult {
  overallScore: number;
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  progressRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  pathwayPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  personalAdvisorRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childVoiceRate: number | null;
}

export interface TransitionComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  goalsSetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reviewScheduledRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  areaDiversityRatio: number | null;
}

export interface TransitionPolicyResult {
  overallScore: number;
  pathwayPlanningFramework: boolean;
  independenceProgramme: boolean;
  personalAdvisorAllocation: boolean;
  housingPathway: boolean;
  financialCapabilityPlan: boolean;
  healthPassportScheme: boolean;
  regularReview: boolean;
}

export interface StaffTransitionReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  leavingCareActRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  pathwayPlanningRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  independencePracticalRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  financialCapabilityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  emotionalResilienceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  housingOptionsRate: number | null;
}

export interface ChildTransitionProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  progressRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  pathwayPlanRate: number | null;
  overallScore: number;
}

export interface TransitionLeavingCareReadinessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  readinessPreparation: ReadinessPreparationResult;
  transitionCompliance: TransitionComplianceResult;
  transitionPolicy: TransitionPolicyResult;
  staffTransitionReadiness: StaffTransitionReadinessResult;
  childProfiles: ChildTransitionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateReadinessPreparation(assessments: TransitionAssessment[]): ReadinessPreparationResult {
  if (assessments.length === 0) {
    return { overallScore: 0, totalAssessments: 0, progressRate: null, pathwayPlanRate: null, personalAdvisorRate: null, childVoiceRate: null };
  }

  const total = assessments.length;
  const progressCount = assessments.filter((a) => a.progressLevel === "exceeding" || a.progressLevel === "on_track").length;
  const pathwayCount = assessments.filter((a) => a.pathwayPlanLinked).length;
  const advisorCount = assessments.filter((a) => a.personalAdvisorInvolved).length;
  const voiceCount = assessments.filter((a) => a.childVoiceCaptured).length;

  const progressRate = rate(progressCount, total);
  const pathwayPlanRate = rate(pathwayCount, total);
  const personalAdvisorRate = rate(advisorCount, total);
  const childVoiceRate = rate(voiceCount, total);

  const progScore = Math.round(((progressRate ?? 0) / 100) * 7);
  const pathScore = Math.round(((pathwayPlanRate ?? 0) / 100) * 6);
  const advScore = Math.round(((personalAdvisorRate ?? 0) / 100) * 6);
  const voiceScore = Math.round(((childVoiceRate ?? 0) / 100) * 6);

  const overallScore = Math.min(25, progScore + pathScore + advScore + voiceScore);

  return { overallScore, totalAssessments: total, progressRate, pathwayPlanRate, personalAdvisorRate, childVoiceRate };
}

export function evaluateTransitionCompliance(assessments: TransitionAssessment[]): TransitionComplianceResult {
  if (assessments.length === 0) {
    return { overallScore: 0, goalsSetRate: null, documentedRate: null, reviewScheduledRate: null, areaDiversityRatio: 0 };
  }

  const total = assessments.length;
  const goalsCount = assessments.filter((a) => a.goalsSet).length;
  const documentedCount = assessments.filter((a) => a.documentedInPlan).length;
  const reviewCount = assessments.filter((a) => a.reviewScheduled).length;
  const uniqueAreas = new Set(assessments.map((a) => a.readinessArea)).size;
  const diversityRatio = rate(uniqueAreas, 8);

  const goalsSetRate = rate(goalsCount, total);
  const documentedRate = rate(documentedCount, total);
  const reviewScheduledRate = rate(reviewCount, total);

  const goalScore = Math.round(((goalsSetRate ?? 0) / 100) * 8);
  const docScore = Math.round(((documentedRate ?? 0) / 100) * 7);
  const revScore = Math.round(((reviewScheduledRate ?? 0) / 100) * 5);
  const divScore = Math.round((diversityRatio! / 100) * 5);

  const overallScore = Math.min(25, goalScore + docScore + revScore + divScore);

  return { overallScore, goalsSetRate, documentedRate, reviewScheduledRate, areaDiversityRatio: diversityRatio };
}

export function evaluateTransitionPolicy(policy: TransitionPolicy | null): TransitionPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      pathwayPlanningFramework: false,
      independenceProgramme: false,
      personalAdvisorAllocation: false,
      housingPathway: false,
      financialCapabilityPlan: false,
      healthPassportScheme: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.pathwayPlanningFramework) score += 4;
  if (policy.independenceProgramme) score += 4;
  if (policy.personalAdvisorAllocation) score += 4;
  if (policy.housingPathway) score += 4;
  if (policy.financialCapabilityPlan) score += 3;
  if (policy.healthPassportScheme) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    pathwayPlanningFramework: policy.pathwayPlanningFramework,
    independenceProgramme: policy.independenceProgramme,
    personalAdvisorAllocation: policy.personalAdvisorAllocation,
    housingPathway: policy.housingPathway,
    financialCapabilityPlan: policy.financialCapabilityPlan,
    healthPassportScheme: policy.healthPassportScheme,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffTransitionReadiness(training: StaffTransitionTraining[]): StaffTransitionReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, leavingCareActRate: null, pathwayPlanningRate: null, independencePracticalRate: null, financialCapabilityRate: null, emotionalResilienceRate: null, housingOptionsRate: null };
  }

  const total = training.length;
  const lcaCount = training.filter((t) => t.leavingCareAct).length;
  const ppCount = training.filter((t) => t.pathwayPlanning).length;
  const ipCount = training.filter((t) => t.independencePractical).length;
  const fcCount = training.filter((t) => t.financialCapability).length;
  const erCount = training.filter((t) => t.emotionalResilience).length;
  const hoCount = training.filter((t) => t.housingOptions).length;

  const leavingCareActRate = rate(lcaCount, total);
  const pathwayPlanningRate = rate(ppCount, total);
  const independencePracticalRate = rate(ipCount, total);
  const financialCapabilityRate = rate(fcCount, total);
  const emotionalResilienceRate = rate(erCount, total);
  const housingOptionsRate = rate(hoCount, total);

  const s1 = Math.round(((leavingCareActRate ?? 0) / 100) * 6);
  const s2 = Math.round(((pathwayPlanningRate ?? 0) / 100) * 5);
  const s3 = Math.round(((independencePracticalRate ?? 0) / 100) * 5);
  const s4 = Math.round(((financialCapabilityRate ?? 0) / 100) * 4);
  const s5 = Math.round(((emotionalResilienceRate ?? 0) / 100) * 3);
  const s6 = Math.round(((housingOptionsRate ?? 0) / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, leavingCareActRate, pathwayPlanningRate, independencePracticalRate, financialCapabilityRate, emotionalResilienceRate, housingOptionsRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildTransitionProfiles(assessments: TransitionAssessment[]): ChildTransitionProfile[] {
  if (assessments.length === 0) return [];

  const grouped = new Map<string, TransitionAssessment[]>();
  for (const a of assessments) {
    if (!grouped.has(a.childId)) grouped.set(a.childId, []);
    grouped.get(a.childId)!.push(a);
  }

  const profiles: ChildTransitionProfile[] = [];

  for (const [childId, assess] of grouped) {
    const childName = assess[0].childName;
    const total = assess.length;
    const progressCount = assess.filter((a) => a.progressLevel === "exceeding" || a.progressLevel === "on_track").length;
    const pathwayCount = assess.filter((a) => a.pathwayPlanLinked).length;

    const progressRate = rate(progressCount, total);
    const pathwayPlanRate = rate(pathwayCount, total);

    // Score 0-10: frequency(0-2), progress(0-3), pathway(0-3), diversity(0-2)
    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let progScore = 0;
    if (meets(progressRate, 80)) progScore = 3;
    else if (meets(progressRate, 60)) progScore = 2;
    else if (meets(progressRate, 40)) progScore = 1;

    let pathScore = 0;
    if (meets(pathwayPlanRate, 80)) pathScore = 3;
    else if (meets(pathwayPlanRate, 60)) pathScore = 2;
    else if (meets(pathwayPlanRate, 40)) pathScore = 1;

    // Diversity: unique readiness areas
    const uniqueAreas = new Set(assess.map((a) => a.readinessArea)).size;
    let divScore = 0;
    if (uniqueAreas >= 6) divScore = 2;
    else if (uniqueAreas >= 3) divScore = 1;

    const overallScore = Math.min(10, freqScore + progScore + pathScore + divScore);

    profiles.push({ childId, childName, totalAssessments: total, progressRate, pathwayPlanRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateTransitionLeavingCareReadinessIntelligence(
  assessments: TransitionAssessment[],
  policy: TransitionPolicy | null,
  training: StaffTransitionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): TransitionLeavingCareReadinessIntelligence {
  const readinessPreparation = evaluateReadinessPreparation(assessments);
  const transitionCompliance = evaluateTransitionCompliance(assessments);
  const transitionPolicy = evaluateTransitionPolicy(policy);
  const staffTransitionReadiness = evaluateStaffTransitionReadiness(training);

  const overallScore = Math.min(100, readinessPreparation.overallScore + transitionCompliance.overallScore + transitionPolicy.overallScore + staffTransitionReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildTransitionProfiles(assessments);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (meets(readinessPreparation.progressRate, 80)) strengths.push("Strong transition readiness — young people are progressing well across independence areas");
  if (meets(readinessPreparation.childVoiceRate, 80)) strengths.push("Young people's voices are consistently captured in transition planning");
  if (meets(readinessPreparation.personalAdvisorRate, 80)) strengths.push("Personal advisors are consistently involved in transition assessments");
  if (meets(transitionCompliance.documentedRate, 80)) strengths.push("Excellent documentation of transition planning in pathway plans");

  if (assessments.length > 0 && below(readinessPreparation.progressRate, 60)) areasForImprovement.push("Transition readiness progress needs improvement — review independence programme content");
  if (assessments.length > 0 && below(readinessPreparation.childVoiceRate, 60)) areasForImprovement.push("Young people's voices not consistently captured — embed participation in every assessment");
  if (assessments.length > 0 && below(transitionCompliance.goalsSetRate, 60)) areasForImprovement.push("Goals not consistently set in transition assessments — improve planning structure");
  if (assessments.length > 0 && below(readinessPreparation.personalAdvisorRate, 60)) areasForImprovement.push("Personal advisor involvement is low — ensure allocation and engagement");

  if (assessments.length === 0) actions.push("No transition assessment records found — begin systematic readiness assessments immediately");
  if (!policy) actions.push("URGENT: No transition and leaving care policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff transition training recorded — arrange training for all staff");
  if (assessments.length > 0 && below(transitionCompliance.reviewScheduledRate, 60)) actions.push("Improve review scheduling for transition assessments");
  if (assessments.length > 0 && below(readinessPreparation.pathwayPlanRate, 60)) actions.push("Strengthen links between transition assessments and pathway plans");

  const regulatoryLinks: string[] = [
    "Children (Leaving Care) Act 2000 — Pathway planning duties",
    "CHR 2015 Regulation 13 — Leadership and management",
    "SCCIF — Experiences and progress of children",
    "NMS 15 — Preparation for leaving care",
    "Children Act 1989 Section 23C — Continuing functions",
    "Care Leavers Covenant — National commitments",
    "Ofsted ILACS — Leaving care inspection focus",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    readinessPreparation, transitionCompliance, transitionPolicy, staffTransitionReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
