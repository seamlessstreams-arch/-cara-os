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
  progressRate: number;
  pathwayPlanRate: number;
  personalAdvisorRate: number;
  childVoiceRate: number;
}

export interface TransitionComplianceResult {
  overallScore: number;
  goalsSetRate: number;
  documentedRate: number;
  reviewScheduledRate: number;
  areaDiversityRatio: number;
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
  leavingCareActRate: number;
  pathwayPlanningRate: number;
  independencePracticalRate: number;
  financialCapabilityRate: number;
  emotionalResilienceRate: number;
  housingOptionsRate: number;
}

export interface ChildTransitionProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  progressRate: number;
  pathwayPlanRate: number;
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

// ── Evaluators ───────────────────────────────────────────────────────────────

export function evaluateReadinessPreparation(assessments: TransitionAssessment[]): ReadinessPreparationResult {
  if (assessments.length === 0) {
    return { overallScore: 0, totalAssessments: 0, progressRate: 0, pathwayPlanRate: 0, personalAdvisorRate: 0, childVoiceRate: 0 };
  }

  const total = assessments.length;
  const progressCount = assessments.filter((a) => a.progressLevel === "exceeding" || a.progressLevel === "on_track").length;
  const pathwayCount = assessments.filter((a) => a.pathwayPlanLinked).length;
  const advisorCount = assessments.filter((a) => a.personalAdvisorInvolved).length;
  const voiceCount = assessments.filter((a) => a.childVoiceCaptured).length;

  const progressRate = pct(progressCount, total);
  const pathwayPlanRate = pct(pathwayCount, total);
  const personalAdvisorRate = pct(advisorCount, total);
  const childVoiceRate = pct(voiceCount, total);

  const progScore = Math.round((progressRate / 100) * 7);
  const pathScore = Math.round((pathwayPlanRate / 100) * 6);
  const advScore = Math.round((personalAdvisorRate / 100) * 6);
  const voiceScore = Math.round((childVoiceRate / 100) * 6);

  const overallScore = Math.min(25, progScore + pathScore + advScore + voiceScore);

  return { overallScore, totalAssessments: total, progressRate, pathwayPlanRate, personalAdvisorRate, childVoiceRate };
}

export function evaluateTransitionCompliance(assessments: TransitionAssessment[]): TransitionComplianceResult {
  if (assessments.length === 0) {
    return { overallScore: 0, goalsSetRate: 0, documentedRate: 0, reviewScheduledRate: 0, areaDiversityRatio: 0 };
  }

  const total = assessments.length;
  const goalsCount = assessments.filter((a) => a.goalsSet).length;
  const documentedCount = assessments.filter((a) => a.documentedInPlan).length;
  const reviewCount = assessments.filter((a) => a.reviewScheduled).length;
  const uniqueAreas = new Set(assessments.map((a) => a.readinessArea)).size;
  const diversityRatio = pct(uniqueAreas, 8);

  const goalsSetRate = pct(goalsCount, total);
  const documentedRate = pct(documentedCount, total);
  const reviewScheduledRate = pct(reviewCount, total);

  const goalScore = Math.round((goalsSetRate / 100) * 8);
  const docScore = Math.round((documentedRate / 100) * 7);
  const revScore = Math.round((reviewScheduledRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

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
    return { overallScore: 0, totalStaff: 0, leavingCareActRate: 0, pathwayPlanningRate: 0, independencePracticalRate: 0, financialCapabilityRate: 0, emotionalResilienceRate: 0, housingOptionsRate: 0 };
  }

  const total = training.length;
  const lcaCount = training.filter((t) => t.leavingCareAct).length;
  const ppCount = training.filter((t) => t.pathwayPlanning).length;
  const ipCount = training.filter((t) => t.independencePractical).length;
  const fcCount = training.filter((t) => t.financialCapability).length;
  const erCount = training.filter((t) => t.emotionalResilience).length;
  const hoCount = training.filter((t) => t.housingOptions).length;

  const leavingCareActRate = pct(lcaCount, total);
  const pathwayPlanningRate = pct(ppCount, total);
  const independencePracticalRate = pct(ipCount, total);
  const financialCapabilityRate = pct(fcCount, total);
  const emotionalResilienceRate = pct(erCount, total);
  const housingOptionsRate = pct(hoCount, total);

  const s1 = Math.round((leavingCareActRate / 100) * 6);
  const s2 = Math.round((pathwayPlanningRate / 100) * 5);
  const s3 = Math.round((independencePracticalRate / 100) * 5);
  const s4 = Math.round((financialCapabilityRate / 100) * 4);
  const s5 = Math.round((emotionalResilienceRate / 100) * 3);
  const s6 = Math.round((housingOptionsRate / 100) * 2);

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

    const progressRate = pct(progressCount, total);
    const pathwayPlanRate = pct(pathwayCount, total);

    // Score 0-10: frequency(0-2), progress(0-3), pathway(0-3), diversity(0-2)
    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let progScore = 0;
    if (progressRate >= 80) progScore = 3;
    else if (progressRate >= 60) progScore = 2;
    else if (progressRate >= 40) progScore = 1;

    let pathScore = 0;
    if (pathwayPlanRate >= 80) pathScore = 3;
    else if (pathwayPlanRate >= 60) pathScore = 2;
    else if (pathwayPlanRate >= 40) pathScore = 1;

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

  if (readinessPreparation.progressRate >= 80) strengths.push("Strong transition readiness — young people are progressing well across independence areas");
  if (readinessPreparation.childVoiceRate >= 80) strengths.push("Young people's voices are consistently captured in transition planning");
  if (readinessPreparation.personalAdvisorRate >= 80) strengths.push("Personal advisors are consistently involved in transition assessments");
  if (transitionCompliance.documentedRate >= 80) strengths.push("Excellent documentation of transition planning in pathway plans");

  if (assessments.length > 0 && readinessPreparation.progressRate < 60) areasForImprovement.push("Transition readiness progress needs improvement — review independence programme content");
  if (assessments.length > 0 && readinessPreparation.childVoiceRate < 60) areasForImprovement.push("Young people's voices not consistently captured — embed participation in every assessment");
  if (assessments.length > 0 && transitionCompliance.goalsSetRate < 60) areasForImprovement.push("Goals not consistently set in transition assessments — improve planning structure");
  if (assessments.length > 0 && readinessPreparation.personalAdvisorRate < 60) areasForImprovement.push("Personal advisor involvement is low — ensure allocation and engagement");

  if (assessments.length === 0) actions.push("No transition assessment records found — begin systematic readiness assessments immediately");
  if (!policy) actions.push("URGENT: No transition and leaving care policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff transition training recorded — arrange training for all staff");
  if (assessments.length > 0 && transitionCompliance.reviewScheduledRate < 60) actions.push("Improve review scheduling for transition assessments");
  if (assessments.length > 0 && readinessPreparation.pathwayPlanRate < 60) actions.push("Strengthen links between transition assessments and pathway plans");

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
