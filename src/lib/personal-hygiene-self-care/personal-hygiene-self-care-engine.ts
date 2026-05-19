// Personal Hygiene & Self-Care Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type unions ──────────────────────────────────────────────────────────────

export type HygieneArea =
  | "bathing_showering"
  | "dental_care"
  | "hair_care"
  | "skincare"
  | "nail_care"
  | "clothing_cleanliness"
  | "menstrual_hygiene"
  | "handwashing";

export type SupportLevel =
  | "independent"
  | "prompted"
  | "assisted"
  | "fully_supported"
  | "refused";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label maps ───────────────────────────────────────────────────────────────

const HYGIENE_AREA_LABELS: Record<HygieneArea, string> = {
  bathing_showering: "Bathing/Showering",
  dental_care: "Dental Care",
  hair_care: "Hair Care",
  skincare: "Skincare",
  nail_care: "Nail Care",
  clothing_cleanliness: "Clothing Cleanliness",
  menstrual_hygiene: "Menstrual Hygiene",
  handwashing: "Handwashing",
};

const SUPPORT_LEVEL_LABELS: Record<SupportLevel, string> = {
  independent: "Independent",
  prompted: "Prompted",
  assisted: "Assisted",
  fully_supported: "Fully Supported",
  refused: "Refused",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getHygieneAreaLabel(v: HygieneArea): string { return HYGIENE_AREA_LABELS[v]; }
export function getSupportLevelLabel(v: SupportLevel): string { return SUPPORT_LEVEL_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Input interfaces ─────────────────────────────────────────────────────────

export interface HygieneRecord {
  id: string;
  childId: string;
  childName: string;
  recordDate: string;
  hygieneArea: HygieneArea;
  supportLevel: SupportLevel;
  dignityMaintained: boolean;
  childChoiceRespected: boolean;
  appropriateProducts: boolean;
  privacyEnsured: boolean;
  staffSupportSensitive: boolean;
  documentedInPlan: boolean;
}

export interface HygienePolicy {
  id: string;
  personalCarePolicy: boolean;
  dignityPrivacyGuidance: boolean;
  ageAppropriateSupport: boolean;
  culturalSensitivity: boolean;
  menstrualHygieneProvision: boolean;
  productAvailability: boolean;
  regularReview: boolean;
}

export interface StaffHygieneTraining {
  id: string;
  staffId: string;
  staffName: string;
  personalCareSupport: boolean;
  dignityInPractice: boolean;
  culturalAwareness: boolean;
  menstrualHealthAwareness: boolean;
  infectionControl: boolean;
  sensitiveConversations: boolean;
}

// ── Result interfaces ────────────────────────────────────────────────────────

export interface SelfCareQualityResult {
  overallScore: number;
  totalRecords: number;
  independenceRate: number;
  dignityRate: number;
  choiceRespectedRate: number;
  appropriateProductsRate: number;
}

export interface DignityPrivacyResult {
  overallScore: number;
  privacyRate: number;
  sensitiveStaffRate: number;
  documentedRate: number;
  dignityMaintainedRate: number;
}

export interface HygienePolicyResult {
  overallScore: number;
  personalCarePolicy: boolean;
  dignityPrivacyGuidance: boolean;
  ageAppropriateSupport: boolean;
  culturalSensitivity: boolean;
  menstrualHygieneProvision: boolean;
  productAvailability: boolean;
  regularReview: boolean;
}

export interface StaffHygieneReadinessResult {
  overallScore: number;
  totalStaff: number;
  personalCareSupportRate: number;
  dignityInPracticeRate: number;
  culturalAwarenessRate: number;
  menstrualHealthRate: number;
  infectionControlRate: number;
  sensitiveConversationsRate: number;
}

export interface ChildHygieneProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  independenceRate: number;
  dignityRate: number;
  areasCount: number;
  overallScore: number;
}

export interface PersonalHygieneSelfCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  selfCareQuality: SelfCareQualityResult;
  dignityPrivacy: DignityPrivacyResult;
  hygienePolicy: HygienePolicyResult;
  staffReadiness: StaffHygieneReadinessResult;
  childProfiles: ChildHygieneProfile[];
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

export function evaluateSelfCareQuality(records: HygieneRecord[]): SelfCareQualityResult {
  if (records.length === 0) {
    return { overallScore: 0, totalRecords: 0, independenceRate: 0, dignityRate: 0, choiceRespectedRate: 0, appropriateProductsRate: 0 };
  }

  const total = records.length;
  const independentCount = records.filter((r) => r.supportLevel === "independent" || r.supportLevel === "prompted").length;
  const dignityCount = records.filter((r) => r.dignityMaintained).length;
  const choiceCount = records.filter((r) => r.childChoiceRespected).length;
  const productsCount = records.filter((r) => r.appropriateProducts).length;

  const independenceRate = pct(independentCount, total);
  const dignityRate = pct(dignityCount, total);
  const choiceRespectedRate = pct(choiceCount, total);
  const appropriateProductsRate = pct(productsCount, total);

  // Weighted: independence(0-7), dignity(0-6), choice(0-6), products(0-6)
  const independenceScore = Math.round((independenceRate / 100) * 7);
  const dignityScore = Math.round((dignityRate / 100) * 6);
  const choiceScore = Math.round((choiceRespectedRate / 100) * 6);
  const productsScore = Math.round((appropriateProductsRate / 100) * 6);

  const overallScore = Math.min(25, independenceScore + dignityScore + choiceScore + productsScore);

  return { overallScore, totalRecords: total, independenceRate, dignityRate, choiceRespectedRate, appropriateProductsRate };
}

export function evaluateDignityPrivacy(records: HygieneRecord[]): DignityPrivacyResult {
  if (records.length === 0) {
    return { overallScore: 0, privacyRate: 0, sensitiveStaffRate: 0, documentedRate: 0, dignityMaintainedRate: 0 };
  }

  const total = records.length;
  const privacyCount = records.filter((r) => r.privacyEnsured).length;
  const sensitiveCount = records.filter((r) => r.staffSupportSensitive).length;
  const documentedCount = records.filter((r) => r.documentedInPlan).length;
  const dignityCount = records.filter((r) => r.dignityMaintained).length;

  const privacyRate = pct(privacyCount, total);
  const sensitiveStaffRate = pct(sensitiveCount, total);
  const documentedRate = pct(documentedCount, total);
  const dignityMaintainedRate = pct(dignityCount, total);

  // Weighted: privacy(0-8), sensitiveStaff(0-7), documented(0-5), dignity(0-5)
  const privacyScore = Math.round((privacyRate / 100) * 8);
  const sensitiveScore = Math.round((sensitiveStaffRate / 100) * 7);
  const documentedScore = Math.round((documentedRate / 100) * 5);
  const dignityScore = Math.round((dignityMaintainedRate / 100) * 5);

  const overallScore = Math.min(25, privacyScore + sensitiveScore + documentedScore + dignityScore);

  return { overallScore, privacyRate, sensitiveStaffRate, documentedRate, dignityMaintainedRate };
}

export function evaluateHygienePolicy(policy: HygienePolicy | null): HygienePolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      personalCarePolicy: false,
      dignityPrivacyGuidance: false,
      ageAppropriateSupport: false,
      culturalSensitivity: false,
      menstrualHygieneProvision: false,
      productAvailability: false,
      regularReview: false,
    };
  }

  let score = 0;
  if (policy.personalCarePolicy) score += 4;
  if (policy.dignityPrivacyGuidance) score += 4;
  if (policy.ageAppropriateSupport) score += 4;
  if (policy.culturalSensitivity) score += 4;
  if (policy.menstrualHygieneProvision) score += 3;
  if (policy.productAvailability) score += 3;
  if (policy.regularReview) score += 3;

  return {
    overallScore: Math.min(25, score),
    personalCarePolicy: policy.personalCarePolicy,
    dignityPrivacyGuidance: policy.dignityPrivacyGuidance,
    ageAppropriateSupport: policy.ageAppropriateSupport,
    culturalSensitivity: policy.culturalSensitivity,
    menstrualHygieneProvision: policy.menstrualHygieneProvision,
    productAvailability: policy.productAvailability,
    regularReview: policy.regularReview,
  };
}

export function evaluateStaffHygieneReadiness(training: StaffHygieneTraining[]): StaffHygieneReadinessResult {
  if (training.length === 0) {
    return { overallScore: 0, totalStaff: 0, personalCareSupportRate: 0, dignityInPracticeRate: 0, culturalAwarenessRate: 0, menstrualHealthRate: 0, infectionControlRate: 0, sensitiveConversationsRate: 0 };
  }

  const total = training.length;
  const personalCareCount = training.filter((t) => t.personalCareSupport).length;
  const dignityCount = training.filter((t) => t.dignityInPractice).length;
  const culturalCount = training.filter((t) => t.culturalAwareness).length;
  const menstrualCount = training.filter((t) => t.menstrualHealthAwareness).length;
  const infectionCount = training.filter((t) => t.infectionControl).length;
  const sensitiveCount = training.filter((t) => t.sensitiveConversations).length;

  const personalCareSupportRate = pct(personalCareCount, total);
  const dignityInPracticeRate = pct(dignityCount, total);
  const culturalAwarenessRate = pct(culturalCount, total);
  const menstrualHealthRate = pct(menstrualCount, total);
  const infectionControlRate = pct(infectionCount, total);
  const sensitiveConversationsRate = pct(sensitiveCount, total);

  // Weighted: personalCare(0-6), dignity(0-5), cultural(0-5), menstrual(0-4), infection(0-3), sensitive(0-2)
  const s1 = Math.round((personalCareSupportRate / 100) * 6);
  const s2 = Math.round((dignityInPracticeRate / 100) * 5);
  const s3 = Math.round((culturalAwarenessRate / 100) * 5);
  const s4 = Math.round((menstrualHealthRate / 100) * 4);
  const s5 = Math.round((infectionControlRate / 100) * 3);
  const s6 = Math.round((sensitiveConversationsRate / 100) * 2);

  const overallScore = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return { overallScore, totalStaff: total, personalCareSupportRate, dignityInPracticeRate, culturalAwarenessRate, menstrualHealthRate, infectionControlRate, sensitiveConversationsRate };
}

// ── Child profiles ───────────────────────────────────────────────────────────

export function buildChildHygieneProfiles(records: HygieneRecord[]): ChildHygieneProfile[] {
  if (records.length === 0) return [];

  const grouped = new Map<string, HygieneRecord[]>();
  for (const r of records) {
    if (!grouped.has(r.childId)) grouped.set(r.childId, []);
    grouped.get(r.childId)!.push(r);
  }

  const profiles: ChildHygieneProfile[] = [];

  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const total = recs.length;
    const independentCount = recs.filter((r) => r.supportLevel === "independent" || r.supportLevel === "prompted").length;
    const dignityCount = recs.filter((r) => r.dignityMaintained).length;
    const uniqueAreas = new Set(recs.map((r) => r.hygieneArea)).size;

    const independenceRate = pct(independentCount, total);
    const dignityRate = pct(dignityCount, total);

    // Score 0-10: frequency(0-2), independence(0-3), dignity(0-3), areasCoverage(0-2)
    let freqScore = 0;
    if (total >= 10) freqScore = 2;
    else if (total >= 5) freqScore = 1;

    let indepScore = 0;
    if (independenceRate >= 80) indepScore = 3;
    else if (independenceRate >= 60) indepScore = 2;
    else if (independenceRate >= 40) indepScore = 1;

    let digScore = 0;
    if (dignityRate >= 80) digScore = 3;
    else if (dignityRate >= 60) digScore = 2;
    else if (dignityRate >= 40) digScore = 1;

    let areaScore = 0;
    if (uniqueAreas >= 5) areaScore = 2;
    else if (uniqueAreas >= 3) areaScore = 1;

    const overallScore = Math.min(10, freqScore + indepScore + digScore + areaScore);

    profiles.push({ childId, childName, totalRecords: total, independenceRate, dignityRate, areasCount: uniqueAreas, overallScore });
  }

  return profiles;
}

// ── Orchestrator ─────────────────────────────────────────────────────────────

export function generatePersonalHygieneSelfCareIntelligence(
  records: HygieneRecord[],
  policy: HygienePolicy | null,
  training: StaffHygieneTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PersonalHygieneSelfCareIntelligence {
  const selfCareQuality = evaluateSelfCareQuality(records);
  const dignityPrivacy = evaluateDignityPrivacy(records);
  const hygienePolicy = evaluateHygienePolicy(policy);
  const staffReadiness = evaluateStaffHygieneReadiness(training);

  const overallScore = Math.min(100, selfCareQuality.overallScore + dignityPrivacy.overallScore + hygienePolicy.overallScore + staffReadiness.overallScore);
  const rating = getRating(overallScore);

  const childProfiles = buildChildHygieneProfiles(records);

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (selfCareQuality.independenceRate >= 80) strengths.push("Excellent independence in personal hygiene — children are developing strong self-care skills");
  if (selfCareQuality.dignityRate >= 80) strengths.push("High standards of dignity maintained during personal care support");
  if (dignityPrivacy.privacyRate >= 80) strengths.push("Privacy is consistently ensured during personal care routines");
  if (selfCareQuality.choiceRespectedRate >= 80) strengths.push("Children's choices about personal care are consistently respected");

  // Areas for improvement
  if (records.length > 0 && selfCareQuality.independenceRate < 60) areasForImprovement.push("Independence rate in personal hygiene needs improvement — consider tailored self-care plans");
  if (records.length > 0 && selfCareQuality.dignityRate < 60) areasForImprovement.push("Dignity standards during personal care require attention");
  if (records.length > 0 && dignityPrivacy.privacyRate < 60) areasForImprovement.push("Privacy during personal care needs strengthening");
  if (records.length > 0 && dignityPrivacy.documentedRate < 60) areasForImprovement.push("Personal care documentation in care plans needs improvement");

  // Actions
  if (records.length === 0) actions.push("No personal hygiene records found — begin recording personal care support consistently");
  if (!policy) actions.push("URGENT: No personal care policy in place — develop and implement immediately");
  if (training.length === 0) actions.push("URGENT: No staff personal care training recorded — arrange training for all staff");
  if (records.length > 0 && selfCareQuality.appropriateProductsRate < 60) actions.push("Review availability of appropriate personal care products for children");
  if (records.length > 0 && dignityPrivacy.sensitiveStaffRate < 60) actions.push("Improve sensitivity of staff support during personal care — consider targeted training");

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 10 — The health and wellbeing standard",
    "CHR 2015 Regulation 12 — The protection of children standard",
    "SCCIF — Experiences and progress of children",
    "NMS 6 — Health and wellbeing",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 16 — Right to privacy",
    "NICE CG89 — When to suspect child maltreatment",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    selfCareQuality, dignityPrivacy, hygienePolicy, staffReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
