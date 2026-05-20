// Hygiene Personal Care Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Types ──────────────────────────────────────────────────────────────────

export type HygieneArea =
  | "oral_care"
  | "bathing_showering"
  | "hand_washing"
  | "hair_care"
  | "skincare"
  | "nail_care"
  | "clothing_laundry"
  | "menstrual_hygiene";

export type CompetencyLevel =
  | "independent"
  | "mostly_independent"
  | "developing"
  | "requires_support"
  | "not_started";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const HYGIENE_AREA_LABELS: Record<HygieneArea, string> = {
  oral_care: "Oral Care",
  bathing_showering: "Bathing / Showering",
  hand_washing: "Hand Washing",
  hair_care: "Hair Care",
  skincare: "Skincare",
  nail_care: "Nail Care",
  clothing_laundry: "Clothing & Laundry",
  menstrual_hygiene: "Menstrual Hygiene",
};

const COMPETENCY_LEVEL_LABELS: Record<CompetencyLevel, string> = {
  independent: "Independent",
  mostly_independent: "Mostly Independent",
  developing: "Developing",
  requires_support: "Requires Support",
  not_started: "Not Started",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHygieneAreaLabel(v: HygieneArea): string { return HYGIENE_AREA_LABELS[v]; }
export function getCompetencyLevelLabel(v: CompetencyLevel): string { return COMPETENCY_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface HygieneSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  hygieneArea: HygieneArea;
  competencyLevel: CompetencyLevel;
  childParticipated: boolean;
  dignityMaintained: boolean;
  progressNoted: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface HygienePolicy {
  id: string;
  personalCareStrategy: boolean;
  dignityAndPrivacyProtocol: boolean;
  ageAppropriateGuidance: boolean;
  infectionControlProcedure: boolean;
  culturalSensitivityPolicy: boolean;
  staffTrainingRequirement: boolean;
  regularReview: boolean;
}

export interface StaffHygieneTraining {
  id: string;
  staffId: string;
  staffName: string;
  personalCareSkills: boolean;
  dignityAndPrivacy: boolean;
  infectionControl: boolean;
  ageAppropriateSupport: boolean;
  culturalAwareness: boolean;
  safeguardingInPersonalCare: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface QualityResult {
  overallScore: number;
  totalSessions: number;
  competencyRate: number;
  participationRate: number;
  dignityRate: number;
  progressRate: number;
}

export interface ComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  hygieneAreaDiversityRatio: number;
}

export interface PolicyResult {
  overallScore: number;
  personalCareStrategy: boolean;
  dignityAndPrivacyProtocol: boolean;
  ageAppropriateGuidance: boolean;
  infectionControlProcedure: boolean;
  culturalSensitivityPolicy: boolean;
  staffTrainingRequirement: boolean;
  regularReview: boolean;
}

export interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  personalCareSkillsRate: number;
  dignityAndPrivacyRate: number;
  infectionControlRate: number;
  ageAppropriateSupportRate: number;
  culturalAwarenessRate: number;
  safeguardingInPersonalCareRate: number;
}

export interface ChildProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  competencyRate: number;
  participationRate: number;
  overallScore: number;
}

export interface HygienePersonalCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  quality: QualityResult;
  compliance: ComplianceResult;
  policy: PolicyResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Evaluators ─────────────────────────────────────────────────────────────

/**
 * Evaluates hygiene session quality (0-25).
 * Weights: competencyRate (7) + participationRate (6) + dignityRate (6) + progressRate (6)
 */
export function evaluateQuality(sessions: HygieneSession[]): QualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      competencyRate: 0,
      participationRate: 0,
      dignityRate: 0,
      progressRate: 0,
    };
  }

  let competent = 0;
  let participated = 0;
  let dignity = 0;
  let progress = 0;

  for (const s of sessions) {
    if (s.competencyLevel === "independent" || s.competencyLevel === "mostly_independent") competent++;
    if (s.childParticipated) participated++;
    if (s.dignityMaintained) dignity++;
    if (s.progressNoted) progress++;
  }

  const competencyRate = pct(competent, sessions.length);
  const participationRate = pct(participated, sessions.length);
  const dignityRate = pct(dignity, sessions.length);
  const progressRate = pct(progress, sessions.length);

  let score = 0;
  score += Math.round((competencyRate / 100) * 7);
  score += Math.round((participationRate / 100) * 6);
  score += Math.round((dignityRate / 100) * 6);
  score += Math.round((progressRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    competencyRate,
    participationRate,
    dignityRate,
    progressRate,
  };
}

/**
 * Evaluates compliance (0-25).
 * Weights: documentedRate (8) + staffSupportedRate (7) + feedbackRate (5) + diversityRatio (5)
 */
export function evaluateCompliance(sessions: HygieneSession[]): ComplianceResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      staffSupportedRate: 0,
      feedbackRate: 0,
      hygieneAreaDiversityRatio: 0,
    };
  }

  let documented = 0;
  let staffSupported = 0;
  let feedback = 0;
  const areasUsed = new Set<HygieneArea>();

  for (const s of sessions) {
    if (s.documentedInPlan) documented++;
    if (s.staffSupported) staffSupported++;
    if (s.feedbackGiven) feedback++;
    areasUsed.add(s.hygieneArea);
  }

  const documentedRate = pct(documented, sessions.length);
  const staffSupportedRate = pct(staffSupported, sessions.length);
  const feedbackRate = pct(feedback, sessions.length);
  const hygieneAreaDiversityRatio = pct(areasUsed.size, 8);

  let score = 0;
  score += Math.round((documentedRate / 100) * 8);
  score += Math.round((staffSupportedRate / 100) * 7);
  score += Math.round((feedbackRate / 100) * 5);
  score += Math.round((hygieneAreaDiversityRatio / 100) * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    documentedRate,
    staffSupportedRate,
    feedbackRate,
    hygieneAreaDiversityRatio,
  };
}

/**
 * Evaluates policy compliance (0-25).
 * Weights: personalCareStrategy (4) + dignityAndPrivacyProtocol (4) + ageAppropriateGuidance (4) +
 *          infectionControlProcedure (4) + culturalSensitivityPolicy (3) + staffTrainingRequirement (3) + regularReview (3)
 */
export function evaluatePolicy(policy: HygienePolicy | null): PolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      personalCareStrategy: false,
      dignityAndPrivacyProtocol: false,
      ageAppropriateGuidance: false,
      infectionControlProcedure: false,
      culturalSensitivityPolicy: false,
      staffTrainingRequirement: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.personalCareStrategy) score += 4;
  if (policy.dignityAndPrivacyProtocol) score += 4;
  if (policy.ageAppropriateGuidance) score += 4;
  if (policy.infectionControlProcedure) score += 4;
  if (policy.culturalSensitivityPolicy) score += 3;
  if (policy.staffTrainingRequirement) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    personalCareStrategy: policy.personalCareStrategy,
    dignityAndPrivacyProtocol: policy.dignityAndPrivacyProtocol,
    ageAppropriateGuidance: policy.ageAppropriateGuidance,
    infectionControlProcedure: policy.infectionControlProcedure,
    culturalSensitivityPolicy: policy.culturalSensitivityPolicy,
    staffTrainingRequirement: policy.staffTrainingRequirement,
    regularReview: policy.regularReview,
  };
}

/**
 * Evaluates staff readiness (0-25).
 * Weights: personalCareSkills (6) + dignityAndPrivacy (5) + infectionControl (5) +
 *          ageAppropriateSupport (4) + culturalAwareness (3) + safeguardingInPersonalCare (2)
 */
export function evaluateStaffReadiness(training: StaffHygieneTraining[]): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      personalCareSkillsRate: 0,
      dignityAndPrivacyRate: 0,
      infectionControlRate: 0,
      ageAppropriateSupportRate: 0,
      culturalAwarenessRate: 0,
      safeguardingInPersonalCareRate: 0,
    };
  }

  let personalCareSkills = 0;
  let dignityAndPrivacy = 0;
  let infectionControl = 0;
  let ageAppropriateSupport = 0;
  let culturalAwareness = 0;
  let safeguarding = 0;

  for (const t of training) {
    if (t.personalCareSkills) personalCareSkills++;
    if (t.dignityAndPrivacy) dignityAndPrivacy++;
    if (t.infectionControl) infectionControl++;
    if (t.ageAppropriateSupport) ageAppropriateSupport++;
    if (t.culturalAwareness) culturalAwareness++;
    if (t.safeguardingInPersonalCare) safeguarding++;
  }

  const personalCareSkillsRate = pct(personalCareSkills, training.length);
  const dignityAndPrivacyRate = pct(dignityAndPrivacy, training.length);
  const infectionControlRate = pct(infectionControl, training.length);
  const ageAppropriateSupportRate = pct(ageAppropriateSupport, training.length);
  const culturalAwarenessRate = pct(culturalAwareness, training.length);
  const safeguardingInPersonalCareRate = pct(safeguarding, training.length);

  let score = 0;
  score += Math.round((personalCareSkillsRate / 100) * 6);
  score += Math.round((dignityAndPrivacyRate / 100) * 5);
  score += Math.round((infectionControlRate / 100) * 5);
  score += Math.round((ageAppropriateSupportRate / 100) * 4);
  score += Math.round((culturalAwarenessRate / 100) * 3);
  score += Math.round((safeguardingInPersonalCareRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    personalCareSkillsRate,
    dignityAndPrivacyRate,
    infectionControlRate,
    ageAppropriateSupportRate,
    culturalAwarenessRate,
    safeguardingInPersonalCareRate,
  };
}

// ── Child Profiles ─────────────────────────────────────────────────────────

/**
 * Builds per-child profiles (0-10 each).
 * Scoring: frequency (>=10 -> 2, >=5 -> 1) + competency (>=80 -> 3, >=60 -> 2, >=40 -> 1) +
 *          participation (>=80 -> 3, >=60 -> 2, >=40 -> 1) + diversity (>=4 -> 2, >=2 -> 1)
 */
export function buildChildProfiles(sessions: HygieneSession[]): ChildProfile[] {
  const childMap = new Map<string, { childId: string; childName: string }>();
  for (const s of sessions) {
    if (!childMap.has(s.childId)) childMap.set(s.childId, { childId: s.childId, childName: s.childName });
  }

  return Array.from(childMap.values()).map((child) => {
    const childSessions = sessions.filter((s) => s.childId === child.childId);

    const competent = childSessions.filter(
      (s) => s.competencyLevel === "independent" || s.competencyLevel === "mostly_independent",
    ).length;
    const participated = childSessions.filter((s) => s.childParticipated).length;
    const areasUsed = new Set(childSessions.map((s) => s.hygieneArea));

    const competencyRate = pct(competent, childSessions.length);
    const participationRate = pct(participated, childSessions.length);

    let score = 0;

    // Frequency (0-2)
    if (childSessions.length >= 10) score += 2;
    else if (childSessions.length >= 5) score += 1;

    // Competency (0-3)
    if (competencyRate >= 80) score += 3;
    else if (competencyRate >= 60) score += 2;
    else if (competencyRate >= 40) score += 1;

    // Participation (0-3)
    if (participationRate >= 80) score += 3;
    else if (participationRate >= 60) score += 2;
    else if (participationRate >= 40) score += 1;

    // Diversity (0-2)
    if (areasUsed.size >= 4) score += 2;
    else if (areasUsed.size >= 2) score += 1;

    return {
      childId: child.childId,
      childName: child.childName,
      totalSessions: childSessions.length,
      competencyRate,
      participationRate,
      overallScore: Math.min(10, score),
    };
  });
}

// ── Main Intelligence Orchestrator ─────────────────────────────────────────

export function generateHygienePersonalCareIntelligence(
  sessions: HygieneSession[],
  policy: HygienePolicy | null,
  staffTraining: StaffHygieneTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): HygienePersonalCareIntelligence {
  const quality = evaluateQuality(sessions);
  const compliance = evaluateCompliance(sessions);
  const policyResult = evaluatePolicy(policy);
  const staffReadiness = evaluateStaffReadiness(staffTraining);

  const rawScore =
    quality.overallScore +
    compliance.overallScore +
    policyResult.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildProfiles(sessions);

  // ── Strengths ──
  const strengths: string[] = [];
  if (sessions.length > 0 && quality.competencyRate >= 80)
    strengths.push("Strong competency levels — " + quality.competencyRate + "% of sessions show independent or mostly independent skills");
  if (sessions.length > 0 && quality.participationRate === 100)
    strengths.push("100% child participation across all hygiene sessions");
  if (sessions.length > 0 && quality.dignityRate === 100)
    strengths.push("Dignity maintained in all sessions — exemplary practice");
  if (sessions.length > 0 && quality.progressRate >= 80)
    strengths.push("Progress noted in " + quality.progressRate + "% of sessions — strong developmental tracking");
  if (sessions.length > 0 && compliance.documentedRate === 100)
    strengths.push("All sessions documented in care plans — excellent record keeping");
  if (sessions.length > 0 && compliance.staffSupportedRate === 100)
    strengths.push("Staff support provided in all sessions");
  if (sessions.length > 0 && compliance.feedbackRate === 100)
    strengths.push("Feedback given in all sessions — children's voices supported");
  if (sessions.length > 0 && compliance.hygieneAreaDiversityRatio === 100)
    strengths.push("All 8 hygiene areas covered — comprehensive personal care programme");
  if (policy && policyResult.overallScore === 25)
    strengths.push("Full policy framework in place — all 7 policy areas covered");
  if (staffTraining.length > 0 && staffReadiness.overallScore === 25)
    strengths.push("All staff fully trained across all personal care competencies");
  if (staffTraining.length > 0 && staffReadiness.personalCareSkillsRate === 100)
    strengths.push("All staff trained in personal care skills");
  if (staffTraining.length > 0 && staffReadiness.infectionControlRate === 100)
    strengths.push("All staff trained in infection control procedures");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (sessions.length === 0)
    areasForImprovement.push("URGENT: No hygiene session records — personal care monitoring must be established immediately");
  if (sessions.length > 0 && quality.competencyRate < 50)
    areasForImprovement.push("Low competency rate at " + quality.competencyRate + "% — targeted skill development programmes needed");
  if (sessions.length > 0 && quality.participationRate < 80)
    areasForImprovement.push("Child participation at " + quality.participationRate + "% — explore barriers to engagement");
  if (sessions.length > 0 && quality.dignityRate < 100)
    areasForImprovement.push("URGENT: Dignity maintained in only " + quality.dignityRate + "% of sessions — immediate review required under Regulation 10");
  if (sessions.length > 0 && quality.progressRate < 60)
    areasForImprovement.push("Progress noted in only " + quality.progressRate + "% of sessions — review developmental tracking approach");
  if (sessions.length > 0 && compliance.documentedRate < 100)
    areasForImprovement.push("Documentation rate at " + compliance.documentedRate + "% — all sessions must be documented in care plans");
  if (sessions.length > 0 && compliance.staffSupportedRate < 80)
    areasForImprovement.push("Staff support rate at " + compliance.staffSupportedRate + "% — ensure adequate staffing for personal care");
  if (sessions.length > 0 && compliance.feedbackRate < 80)
    areasForImprovement.push("Feedback given in only " + compliance.feedbackRate + "% of sessions — children need consistent feedback");
  if (sessions.length > 0 && compliance.hygieneAreaDiversityRatio < 50)
    areasForImprovement.push("Only " + compliance.hygieneAreaDiversityRatio + "% of hygiene areas covered — expand personal care programme");
  if (!policy)
    areasForImprovement.push("URGENT: No hygiene policy in place — required under CHR 2015 Regulation 6");
  if (policy && !policy.personalCareStrategy)
    areasForImprovement.push("No personal care strategy — required for structured hygiene support");
  if (policy && !policy.dignityAndPrivacyProtocol)
    areasForImprovement.push("URGENT: No dignity and privacy protocol — required under Regulation 10");
  if (policy && !policy.infectionControlProcedure)
    areasForImprovement.push("No infection control procedure — required under NICE guidance");
  if (staffTraining.length === 0)
    areasForImprovement.push("URGENT: No staff training records — all staff require personal care training");
  if (staffTraining.length > 0 && staffReadiness.personalCareSkillsRate < 100)
    areasForImprovement.push("Personal care skills training at " + staffReadiness.personalCareSkillsRate + "% — all staff should be trained");
  if (staffTraining.length > 0 && staffReadiness.dignityAndPrivacyRate < 100)
    areasForImprovement.push("Dignity and privacy training at " + staffReadiness.dignityAndPrivacyRate + "% — all staff must understand dignity requirements");
  if (staffTraining.length > 0 && staffReadiness.infectionControlRate < 100)
    areasForImprovement.push("Infection control training at " + staffReadiness.infectionControlRate + "% — all staff should complete this module");

  // ── Actions ──
  const actions: string[] = [];

  if (sessions.length === 0)
    actions.push("URGENT: Establish personal care monitoring and recording for all children — statutory requirement under CHR 2015, Regulation 6");
  if (!policy)
    actions.push("URGENT: Develop and implement a comprehensive hygiene and personal care policy");
  if (staffTraining.length === 0)
    actions.push("URGENT: Arrange personal care training for all staff immediately");

  if (sessions.length > 0 && quality.dignityRate < 100)
    actions.push("URGENT: Review all sessions where dignity was not maintained — conduct staff debrief and implement safeguards under Regulation 10");
  if (sessions.length > 0 && quality.competencyRate < 50)
    actions.push("Develop individualised skill-building plans to improve children's personal care competencies");
  if (sessions.length > 0 && quality.participationRate < 80)
    actions.push("Explore barriers to child participation and develop engagement strategies");
  if (sessions.length > 0 && compliance.documentedRate < 100)
    actions.push("Ensure all personal care sessions are documented in children's care plans — " + (100 - compliance.documentedRate) + "% currently undocumented");
  if (sessions.length > 0 && compliance.feedbackRate < 80)
    actions.push("Implement consistent feedback protocol for all personal care sessions");
  if (sessions.length > 0 && compliance.hygieneAreaDiversityRatio < 50)
    actions.push("Expand personal care programme to cover all 8 hygiene areas");

  if (policy && !policy.culturalSensitivityPolicy)
    actions.push("Develop cultural sensitivity policy for personal care — ensure diverse needs are met");
  if (policy && !policy.staffTrainingRequirement)
    actions.push("Add staff training requirements to the hygiene policy");
  if (policy && !policy.regularReview)
    actions.push("Establish a regular review cycle for the hygiene and personal care policy");

  if (staffTraining.length > 0 && staffReadiness.safeguardingInPersonalCareRate < 100)
    actions.push("Complete safeguarding in personal care training for all staff — " + (100 - staffReadiness.safeguardingInPersonalCareRate) + "% untrained");
  if (staffTraining.length > 0 && staffReadiness.culturalAwarenessRate < 100)
    actions.push("Arrange cultural awareness training for remaining staff — " + (100 - staffReadiness.culturalAwarenessRate) + "% untrained");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 6 — Health and well-being (personal care)",
    "CHR 2015 Regulation 10 — Dignity and privacy of children",
    "SCCIF — Health and well-being of children (hygiene)",
    "NMS 6 — Health and well-being (personal hygiene)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 24 — Right to health (hygiene)",
    "Infection Prevention and Control Guidance (NICE)",
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
