// Independent Living Skills Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type SkillType =
  | "cooking_meal_prep"
  | "cleaning_tidying"
  | "laundry_clothing_care"
  | "budgeting_money"
  | "personal_hygiene"
  | "shopping_errands"
  | "travel_navigation"
  | "home_maintenance";

export type CompetencyLevel =
  | "independent"
  | "mostly_independent"
  | "developing"
  | "requires_support"
  | "not_started";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  cooking_meal_prep: "Cooking & Meal Prep",
  cleaning_tidying: "Cleaning & Tidying",
  laundry_clothing_care: "Laundry & Clothing Care",
  budgeting_money: "Budgeting & Money",
  personal_hygiene: "Personal Hygiene",
  shopping_errands: "Shopping & Errands",
  travel_navigation: "Travel & Navigation",
  home_maintenance: "Home Maintenance",
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

export function getSkillTypeLabel(v: SkillType): string { return SKILL_TYPE_LABELS[v]; }
export function getCompetencyLevelLabel(v: CompetencyLevel): string { return COMPETENCY_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface SkillsSession {
  id: string;
  childId: string;
  childName: string;
  sessionDate: string;
  skillType: SkillType;
  competencyLevel: CompetencyLevel;
  childEngaged: boolean;
  progressMade: boolean;
  confidenceBuilt: boolean;
  documentedInPlan: boolean;
  staffSupported: boolean;
  feedbackGiven: boolean;
}

export interface LivingSkillsPolicy {
  id: string;
  independenceStrategy: boolean;
  skillsDevelopmentPlan: boolean;
  ageAppropriateFramework: boolean;
  riskAssessmentProcess: boolean;
  pathwayPlanIntegration: boolean;
  communityAccessPolicy: boolean;
  regularReview: boolean;
}

export interface StaffLivingSkillsTraining {
  id: string;
  staffId: string;
  staffName: string;
  independencePromotion: boolean;
  practicalSkillsTeaching: boolean;
  riskEnablement: boolean;
  pathwayPlanning: boolean;
  communityAccess: boolean;
  motivationalApproaches: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface LivingSkillsQualityResult {
  overallScore: number;
  totalSessions: number;
  competencyRate: number;
  engagementRate: number;
  progressRate: number;
  confidenceRate: number;
}

export interface LivingSkillsComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffSupportedRate: number;
  feedbackRate: number;
  skillTypeDiversityRatio: number;
}

export interface LivingSkillsPolicyResult {
  overallScore: number;
  independenceStrategy: boolean;
  skillsDevelopmentPlan: boolean;
  ageAppropriateFramework: boolean;
  riskAssessmentProcess: boolean;
  pathwayPlanIntegration: boolean;
  communityAccessPolicy: boolean;
  regularReview: boolean;
}

export interface StaffLivingSkillsReadinessResult {
  overallScore: number;
  totalStaff: number;
  independencePromotionRate: number;
  practicalSkillsTeachingRate: number;
  riskEnablementRate: number;
  pathwayPlanningRate: number;
  communityAccessRate: number;
  motivationalApproachesRate: number;
}

export interface ChildLivingSkillsProfile {
  childId: string;
  childName: string;
  totalSessions: number;
  competencyRate: number;
  engagementRate: number;
  overallScore: number;
}

export interface IndependentLivingSkillsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  livingSkillsQuality: LivingSkillsQualityResult;
  livingSkillsCompliance: LivingSkillsComplianceResult;
  livingSkillsPolicy: LivingSkillsPolicyResult;
  staffLivingSkillsReadiness: StaffLivingSkillsReadinessResult;
  childProfiles: ChildLivingSkillsProfile[];
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

export function evaluateLivingSkillsQuality(sessions: SkillsSession[]): LivingSkillsQualityResult {
  if (sessions.length === 0) {
    return { overallScore: 0, totalSessions: 0, competencyRate: 0, engagementRate: 0, progressRate: 0, confidenceRate: 0 };
  }

  const total = sessions.length;
  const competentCount = sessions.filter((s) => s.competencyLevel === "independent" || s.competencyLevel === "mostly_independent").length;
  const engagedCount = sessions.filter((s) => s.childEngaged).length;
  const progressCount = sessions.filter((s) => s.progressMade).length;
  const confidenceCount = sessions.filter((s) => s.confidenceBuilt).length;

  const competencyRate = pct(competentCount, total);
  const engagementRate = pct(engagedCount, total);
  const progressRate = pct(progressCount, total);
  const confidenceRate = pct(confidenceCount, total);

  const compScore = Math.round((competencyRate / 100) * 7);
  const engScore = Math.round((engagementRate / 100) * 6);
  const progScore = Math.round((progressRate / 100) * 6);
  const confScore = Math.round((confidenceRate / 100) * 6);

  const overallScore = Math.min(25, compScore + engScore + progScore + confScore);

  return { overallScore, totalSessions: total, competencyRate, engagementRate, progressRate, confidenceRate };
}

export function evaluateLivingSkillsCompliance(sessions: SkillsSession[]): LivingSkillsComplianceResult {
  if (sessions.length === 0) {
    return { overallScore: 0, documentedRate: 0, staffSupportedRate: 0, feedbackRate: 0, skillTypeDiversityRatio: 0 };
  }

  const total = sessions.length;
  const documentedCount = sessions.filter((s) => s.documentedInPlan).length;
  const staffCount = sessions.filter((s) => s.staffSupported).length;
  const feedbackCount = sessions.filter((s) => s.feedbackGiven).length;
  const uniqueTypes = new Set(sessions.map((s) => s.skillType)).size;
  const diversityRatio = pct(uniqueTypes, 8);

  const documentedRate = pct(documentedCount, total);
  const staffSupportedRate = pct(staffCount, total);
  const feedbackRate = pct(feedbackCount, total);

  const docScore = Math.round((documentedRate / 100) * 8);
  const staffScore = Math.round((staffSupportedRate / 100) * 7);
  const fbScore = Math.round((feedbackRate / 100) * 5);
  const divScore = Math.round((diversityRatio / 100) * 5);

  const overallScore = Math.min(25, docScore + staffScore + fbScore + divScore);

  return { overallScore, documentedRate, staffSupportedRate, feedbackRate, skillTypeDiversityRatio: diversityRatio };
}

export function evaluateLivingSkillsPolicy(policy: LivingSkillsPolicy | null): LivingSkillsPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      independenceStrategy: false,
      skillsDevelopmentPlan: false,
      ageAppropriateFramework: false,
      riskAssessmentProcess: false,
      pathwayPlanIntegration: false,
      communityAccessPolicy: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.independenceStrategy) score += 4;
  if (policy.skillsDevelopmentPlan) score += 4;
  if (policy.ageAppropriateFramework) score += 4;
  if (policy.riskAssessmentProcess) score += 4;
  if (policy.pathwayPlanIntegration) score += 3;
  if (policy.communityAccessPolicy) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    independenceStrategy: policy.independenceStrategy,
    skillsDevelopmentPlan: policy.skillsDevelopmentPlan,
    ageAppropriateFramework: policy.ageAppropriateFramework,
    riskAssessmentProcess: policy.riskAssessmentProcess,
    pathwayPlanIntegration: policy.pathwayPlanIntegration,
    communityAccessPolicy: policy.communityAccessPolicy,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffLivingSkillsReadiness(training: StaffLivingSkillsTraining[]): StaffLivingSkillsReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, independencePromotionRate: 0, practicalSkillsTeachingRate: 0, riskEnablementRate: 0, pathwayPlanningRate: 0, communityAccessRate: 0, motivationalApproachesRate: 0 };
  }

  const total = training.length;
  const ipCount = training.filter((t) => t.independencePromotion).length;
  const psCount = training.filter((t) => t.practicalSkillsTeaching).length;
  const reCount = training.filter((t) => t.riskEnablement).length;
  const ppCount = training.filter((t) => t.pathwayPlanning).length;
  const caCount = training.filter((t) => t.communityAccess).length;
  const maCount = training.filter((t) => t.motivationalApproaches).length;

  const independencePromotionRate = pct(ipCount, total);
  const practicalSkillsTeachingRate = pct(psCount, total);
  const riskEnablementRate = pct(reCount, total);
  const pathwayPlanningRate = pct(ppCount, total);
  const communityAccessRate = pct(caCount, total);
  const motivationalApproachesRate = pct(maCount, total);

  const s1 = Math.round((independencePromotionRate / 100) * 6);
  const s2 = Math.round((practicalSkillsTeachingRate / 100) * 5);
  const s3 = Math.round((riskEnablementRate / 100) * 5);
  const s4 = Math.round((pathwayPlanningRate / 100) * 4);
  const s5 = Math.round((communityAccessRate / 100) * 3);
  const s6 = Math.round((motivationalApproachesRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, independencePromotionRate, practicalSkillsTeachingRate, riskEnablementRate, pathwayPlanningRate, communityAccessRate, motivationalApproachesRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildLivingSkillsProfiles(sessions: SkillsSession[]): ChildLivingSkillsProfile[] {
  if (sessions.length === 0) return [];

  const grouped = new Map<string, SkillsSession[]>();
  for (const s of sessions) {
    if (!grouped.has(s.childId)) grouped.set(s.childId, []);
    grouped.get(s.childId)!.push(s);
  }

  const profiles: ChildLivingSkillsProfile[] = [];

  for (const [childId, sess] of grouped) {
    const childName = sess[0].childName;
    const total = sess.length;
    const competentCount = sess.filter((s) => s.competencyLevel === "independent" || s.competencyLevel === "mostly_independent").length;
    const engagedCount = sess.filter((s) => s.childEngaged).length;

    const competencyRate = pct(competentCount, total);
    const engagementRate = pct(engagedCount, total);

    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let compScore = 0;
    if (competencyRate >= 80) compScore = 3;
    else if (competencyRate >= 60) compScore = 2;
    else if (competencyRate >= 40) compScore = 1;

    let engScore = 0;
    if (engagementRate >= 80) engScore = 3;
    else if (engagementRate >= 60) engScore = 2;
    else if (engagementRate >= 40) engScore = 1;

    const uniqueTypes = new Set(sess.map((s) => s.skillType)).size;
    let divScore = 0;
    if (uniqueTypes >= 4) divScore = 2;
    else if (uniqueTypes >= 2) divScore = 1;

    const overallScore = Math.min(10, freqScore + compScore + engScore + divScore);

    profiles.push({ childId, childName, totalSessions: total, competencyRate, engagementRate, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generateIndependentLivingSkillsIntelligence(
  sessions: SkillsSession[],
  policy: LivingSkillsPolicy | null,
  training: StaffLivingSkillsTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): IndependentLivingSkillsIntelligence {
  const livingSkillsQuality = evaluateLivingSkillsQuality(sessions);
  const livingSkillsCompliance = evaluateLivingSkillsCompliance(sessions);
  const livingSkillsPolicy = evaluateLivingSkillsPolicy(policy);
  const staffLivingSkillsReadiness = evaluateStaffLivingSkillsReadiness(training);

  const overallScore = Math.min(100, livingSkillsQuality.overallScore + livingSkillsCompliance.overallScore + livingSkillsPolicy.overallScore + staffLivingSkillsReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildLivingSkillsProfiles(sessions);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  if (livingSkillsQuality.competencyRate >= 80) strengths.push("Strong competency levels — children are developing practical independence skills effectively");
  if (livingSkillsQuality.engagementRate >= 80) strengths.push("Children are consistently engaged and motivated in living skills sessions");
  if (livingSkillsQuality.progressRate >= 80) strengths.push("Excellent progress being made across living skills development");
  if (livingSkillsCompliance.documentedRate >= 80) strengths.push("Living skills development is well documented in care and pathway plans");

  if (sessions.length > 0 && livingSkillsQuality.competencyRate < 60) areasForImprovement.push("Competency levels need improvement — review teaching approaches and differentiation");
  if (sessions.length > 0 && livingSkillsQuality.engagementRate < 60) areasForImprovement.push("Child engagement in living skills sessions is low — explore motivational strategies");
  if (sessions.length > 0 && livingSkillsCompliance.feedbackRate < 60) areasForImprovement.push("Feedback on living skills progress not consistently given — improve review process");
  if (sessions.length > 0 && livingSkillsQuality.confidenceRate < 60) areasForImprovement.push("Confidence building through living skills is insufficient — embed strengths-based practice");

  if (sessions.length === 0) actions.push("No living skills session records found — develop and implement independence programme");
  if (!policy) actions.push("URGENT: No living skills policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff living skills training recorded — arrange training for all staff");
  if (sessions.length > 0 && livingSkillsCompliance.staffSupportedRate < 60) actions.push("Improve staff support and involvement in living skills sessions");
  if (sessions.length > 0 && livingSkillsQuality.progressRate < 60) actions.push("Strengthen progress tracking and outcome measurement for living skills");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 5 — Engaging with the wider community",
    "CHR 2015 Regulation 8 — The education standard (preparation for life)",
    "SCCIF — Preparing for adulthood and independence",
    "NMS 14 — Preparing for leaving care",
    "Children Act 1989 — Section 22(3A) duty to promote welfare",
    "Children and Social Work Act 2017 — Local offer for care leavers",
    "Staying Close/Staying Put Guidance 2024",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    livingSkillsQuality, livingSkillsCompliance, livingSkillsPolicy, staffLivingSkillsReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
