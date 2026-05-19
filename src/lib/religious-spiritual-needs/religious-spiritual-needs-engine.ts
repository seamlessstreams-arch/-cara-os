// ==============================================================================
// Cornerstone Religious & Spiritual Needs Intelligence Engine
//
// Evaluates how well the home identifies, records, and meets children's
// religious, spiritual, and faith-related needs — including worship access,
// dietary observance, festival celebration, and faith community connections.
//
// Regulatory basis:
//   - CHR 2015 Reg 10 (duty relating to the child's cultural, linguistic,
//     religious, and racial needs)
//   - CHR 2015 Reg 12 (the health and well-being standard — holistic
//     well-being includes spiritual needs)
//   - SCCIF (experiences and progress of children — respect for identity)
//   - Equality Act 2010 (religion or belief as a protected characteristic)
//   - NMS 3 (placement plan — religious observance and spiritual needs)
//   - Children Act 1989 s22(5)(c) (due consideration to religious
//     persuasion, racial origin, cultural and linguistic background)
//   - UNCRC Article 14 (freedom of thought, conscience, and religion)
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// ==============================================================================

// -- Type Definitions ---------------------------------------------------------

export type FaithBackground =
  | "christian"
  | "muslim"
  | "hindu"
  | "sikh"
  | "jewish"
  | "buddhist"
  | "no_faith"
  | "spiritual_not_religious"
  | "other";

export type SupportType =
  | "worship_access"
  | "dietary_observance"
  | "festival_celebration"
  | "prayer_space"
  | "faith_leader_contact"
  | "religious_education"
  | "faith_community"
  | "other";

export type Frequency =
  | "daily"
  | "weekly"
  | "monthly"
  | "occasionally"
  | "not_provided";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label Maps ---------------------------------------------------------------

const FAITH_BACKGROUND_LABELS: Record<FaithBackground, string> = {
  christian: "Christian",
  muslim: "Muslim",
  hindu: "Hindu",
  sikh: "Sikh",
  jewish: "Jewish",
  buddhist: "Buddhist",
  no_faith: "No Faith",
  spiritual_not_religious: "Spiritual but Not Religious",
  other: "Other",
};

const SUPPORT_TYPE_LABELS: Record<SupportType, string> = {
  worship_access: "Worship Access",
  dietary_observance: "Dietary Observance",
  festival_celebration: "Festival Celebration",
  prayer_space: "Prayer Space",
  faith_leader_contact: "Faith Leader Contact",
  religious_education: "Religious Education",
  faith_community: "Faith Community",
  other: "Other",
};

const FREQUENCY_LABELS: Record<Frequency, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  occasionally: "Occasionally",
  not_provided: "Not Provided",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label Functions ----------------------------------------------------------

export function getFaithBackgroundLabel(f: FaithBackground): string {
  return FAITH_BACKGROUND_LABELS[f] ?? f;
}

export function getSupportTypeLabel(s: SupportType): string {
  return SUPPORT_TYPE_LABELS[s] ?? s;
}

export function getFrequencyLabel(f: Frequency): string {
  return FREQUENCY_LABELS[f] ?? f;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// -- Input Interfaces ---------------------------------------------------------

export interface ReligiousSpiritualAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  faithBackground: FaithBackground;
  needsIdentified: boolean;
  preferencesRecorded: boolean;
  childViewsSought: boolean;
  parentCarerConsulted: boolean;
  careplanUpdated: boolean;
}

export interface ReligiousSupportRecord {
  id: string;
  childId: string;
  childName: string;
  supportDate: string;
  supportType: SupportType;
  facilitated: boolean;
  childSatisfied: boolean;
  frequency: Frequency;
  culturallyAppropriate: boolean;
}

export interface ReligiousPolicy {
  id: string;
  faithNeedsAssessedOnAdmission: boolean;
  worshipAccessProvided: boolean;
  dietaryObservanceMet: boolean;
  festivalRecognition: boolean;
  faithLeaderAccess: boolean;
  prayerSpaceAvailable: boolean;
  antiDiscriminationTraining: boolean;
}

export interface StaffReligiousTraining {
  id: string;
  staffId: string;
  staffName: string;
  faithAwareness: boolean;
  culturalCompetence: boolean;
  dietaryRequirements: boolean;
  festivalKnowledge: boolean;
  antiDiscrimination: boolean;
  childViewsAdvocacy: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface AssessmentQualityResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  needsIdentifiedRate: number;
  preferencesRecordedRate: number;
  childViewsRate: number;
  parentConsultedRate: number;
  careplanUpdatedRate: number;
}

export interface SupportDeliveryResult {
  overallScore: number; // 0-25
  totalRecords: number;
  facilitatedRate: number;
  childSatisfiedRate: number;
  culturallyAppropriateRate: number;
  regularFrequencyRate: number;
}

export interface ReligiousPolicyResult {
  overallScore: number; // 0-25
  totalPolicies: number;
  faithAssessedOnAdmissionRate: number;
  worshipAccessRate: number;
  dietaryObservanceRate: number;
  festivalRecognitionRate: number;
  faithLeaderAccessRate: number;
  prayerSpaceRate: number;
  antiDiscriminationRate: number;
}

export interface StaffReligiousReadinessResult {
  overallScore: number; // 0-25
  totalStaff: number;
  faithAwarenessRate: number;
  culturalCompetenceRate: number;
  dietaryRequirementsRate: number;
  festivalKnowledgeRate: number;
  antiDiscriminationRate: number;
  childViewsAdvocacyRate: number;
}

export interface ChildReligiousProfile {
  childId: string;
  childName: string;
  faithBackground: FaithBackground;
  assessmentCount: number;
  supportCount: number;
  needsIdentified: boolean;
  preferencesRecorded: boolean;
  score: number; // 0-10
}

export interface ReligiousSpiritualNeedsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  assessmentQuality: AssessmentQualityResult;
  supportDelivery: SupportDeliveryResult;
  religiousPolicy: ReligiousPolicyResult;
  staffReadiness: StaffReligiousReadinessResult;
  childProfiles: ChildReligiousProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Utility ------------------------------------------------------------------

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluator 1: Assessment Quality (0-25) -----------------------------------

/**
 * Evaluates how well children's religious and spiritual needs are assessed.
 * Measures: needsIdentified rate (0-6), preferencesRecorded rate (0-6),
 * childViews rate (0-5), parentConsulted rate (0-4), careplanUpdated rate (0-4).
 * Max score: 25
 */
export function evaluateAssessmentQuality(
  assessments: ReligiousSpiritualAssessment[],
): AssessmentQualityResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      needsIdentifiedRate: 0,
      preferencesRecordedRate: 0,
      childViewsRate: 0,
      parentConsultedRate: 0,
      careplanUpdatedRate: 0,
    };
  }

  let score = 0;
  const total = assessments.length;

  // Needs identified rate (0-6)
  const needsIdentified = assessments.filter((a) => a.needsIdentified).length;
  const needsIdentifiedRate = pct(needsIdentified, total);
  if (needsIdentifiedRate >= 90) score += 6;
  else if (needsIdentifiedRate >= 70) score += 4;
  else if (needsIdentifiedRate >= 50) score += 2;

  // Preferences recorded rate (0-6)
  const preferencesRecorded = assessments.filter((a) => a.preferencesRecorded).length;
  const preferencesRecordedRate = pct(preferencesRecorded, total);
  if (preferencesRecordedRate >= 90) score += 6;
  else if (preferencesRecordedRate >= 70) score += 4;
  else if (preferencesRecordedRate >= 50) score += 2;

  // Child views sought rate (0-5)
  const childViews = assessments.filter((a) => a.childViewsSought).length;
  const childViewsRate = pct(childViews, total);
  if (childViewsRate >= 90) score += 5;
  else if (childViewsRate >= 70) score += 3;
  else if (childViewsRate >= 50) score += 1;

  // Parent/carer consulted rate (0-4)
  const parentConsulted = assessments.filter((a) => a.parentCarerConsulted).length;
  const parentConsultedRate = pct(parentConsulted, total);
  if (parentConsultedRate >= 80) score += 4;
  else if (parentConsultedRate >= 60) score += 2;
  else if (parentConsultedRate >= 40) score += 1;

  // Care plan updated rate (0-4)
  const careplanUpdated = assessments.filter((a) => a.careplanUpdated).length;
  const careplanUpdatedRate = pct(careplanUpdated, total);
  if (careplanUpdatedRate >= 80) score += 4;
  else if (careplanUpdatedRate >= 60) score += 2;
  else if (careplanUpdatedRate >= 40) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: total,
    needsIdentifiedRate,
    preferencesRecordedRate,
    childViewsRate,
    parentConsultedRate,
    careplanUpdatedRate,
  };
}

// -- Evaluator 2: Support Delivery (0-25) -------------------------------------

/**
 * Evaluates how well religious and spiritual support is delivered.
 * Measures: facilitated rate (0-7), childSatisfied rate (0-6),
 * culturallyAppropriate rate (0-6), regular frequency rate (0-6).
 * Max score: 25
 */
export function evaluateSupportDelivery(
  records: ReligiousSupportRecord[],
): SupportDeliveryResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      facilitatedRate: 0,
      childSatisfiedRate: 0,
      culturallyAppropriateRate: 0,
      regularFrequencyRate: 0,
    };
  }

  let score = 0;
  const total = records.length;

  // Facilitated rate (0-7)
  const facilitated = records.filter((r) => r.facilitated).length;
  const facilitatedRate = pct(facilitated, total);
  if (facilitatedRate >= 90) score += 7;
  else if (facilitatedRate >= 70) score += 5;
  else if (facilitatedRate >= 50) score += 3;
  else if (facilitatedRate >= 30) score += 1;

  // Child satisfied rate (0-6)
  const childSatisfied = records.filter((r) => r.childSatisfied).length;
  const childSatisfiedRate = pct(childSatisfied, total);
  if (childSatisfiedRate >= 90) score += 6;
  else if (childSatisfiedRate >= 70) score += 4;
  else if (childSatisfiedRate >= 50) score += 2;

  // Culturally appropriate rate (0-6)
  const culturallyAppropriate = records.filter((r) => r.culturallyAppropriate).length;
  const culturallyAppropriateRate = pct(culturallyAppropriate, total);
  if (culturallyAppropriateRate >= 90) score += 6;
  else if (culturallyAppropriateRate >= 70) score += 4;
  else if (culturallyAppropriateRate >= 50) score += 2;

  // Regular frequency rate (daily, weekly, monthly = regular) (0-6)
  const regularFrequency = records.filter(
    (r) => r.frequency === "daily" || r.frequency === "weekly" || r.frequency === "monthly",
  ).length;
  const regularFrequencyRate = pct(regularFrequency, total);
  if (regularFrequencyRate >= 80) score += 6;
  else if (regularFrequencyRate >= 60) score += 4;
  else if (regularFrequencyRate >= 40) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: total,
    facilitatedRate,
    childSatisfiedRate,
    culturallyAppropriateRate,
    regularFrequencyRate,
  };
}

// -- Evaluator 3: Religious Policy (0-25) -------------------------------------

/**
 * Evaluates religious and spiritual policy provision.
 * Scores each boolean field across all policies.
 * Max score: 25
 */
export function evaluateReligiousPolicy(
  policies: ReligiousPolicy[],
): ReligiousPolicyResult {
  if (policies.length === 0) {
    return {
      overallScore: 0,
      totalPolicies: 0,
      faithAssessedOnAdmissionRate: 0,
      worshipAccessRate: 0,
      dietaryObservanceRate: 0,
      festivalRecognitionRate: 0,
      faithLeaderAccessRate: 0,
      prayerSpaceRate: 0,
      antiDiscriminationRate: 0,
    };
  }

  let score = 0;
  const total = policies.length;

  // Faith needs assessed on admission (0-4)
  const faithAssessed = policies.filter((p) => p.faithNeedsAssessedOnAdmission).length;
  const faithAssessedOnAdmissionRate = pct(faithAssessed, total);
  if (faithAssessedOnAdmissionRate >= 90) score += 4;
  else if (faithAssessedOnAdmissionRate >= 60) score += 2;
  else if (faithAssessedOnAdmissionRate >= 30) score += 1;

  // Worship access provided (0-4)
  const worshipAccess = policies.filter((p) => p.worshipAccessProvided).length;
  const worshipAccessRate = pct(worshipAccess, total);
  if (worshipAccessRate >= 90) score += 4;
  else if (worshipAccessRate >= 60) score += 2;
  else if (worshipAccessRate >= 30) score += 1;

  // Dietary observance met (0-4)
  const dietaryObs = policies.filter((p) => p.dietaryObservanceMet).length;
  const dietaryObservanceRate = pct(dietaryObs, total);
  if (dietaryObservanceRate >= 90) score += 4;
  else if (dietaryObservanceRate >= 60) score += 2;
  else if (dietaryObservanceRate >= 30) score += 1;

  // Festival recognition (0-4)
  const festivalRec = policies.filter((p) => p.festivalRecognition).length;
  const festivalRecognitionRate = pct(festivalRec, total);
  if (festivalRecognitionRate >= 90) score += 4;
  else if (festivalRecognitionRate >= 60) score += 2;
  else if (festivalRecognitionRate >= 30) score += 1;

  // Faith leader access (0-3)
  const faithLeader = policies.filter((p) => p.faithLeaderAccess).length;
  const faithLeaderAccessRate = pct(faithLeader, total);
  if (faithLeaderAccessRate >= 90) score += 3;
  else if (faithLeaderAccessRate >= 60) score += 2;
  else if (faithLeaderAccessRate >= 30) score += 1;

  // Prayer space available (0-3)
  const prayerSpace = policies.filter((p) => p.prayerSpaceAvailable).length;
  const prayerSpaceRate = pct(prayerSpace, total);
  if (prayerSpaceRate >= 90) score += 3;
  else if (prayerSpaceRate >= 60) score += 2;
  else if (prayerSpaceRate >= 30) score += 1;

  // Anti-discrimination training (0-3)
  const antiDisc = policies.filter((p) => p.antiDiscriminationTraining).length;
  const antiDiscriminationRate = pct(antiDisc, total);
  if (antiDiscriminationRate >= 90) score += 3;
  else if (antiDiscriminationRate >= 60) score += 2;
  else if (antiDiscriminationRate >= 30) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalPolicies: total,
    faithAssessedOnAdmissionRate,
    worshipAccessRate,
    dietaryObservanceRate,
    festivalRecognitionRate,
    faithLeaderAccessRate,
    prayerSpaceRate,
    antiDiscriminationRate,
  };
}

// -- Evaluator 4: Staff Religious Readiness (0-25) ----------------------------

/**
 * Evaluates staff preparedness to support children's religious/spiritual needs.
 * Weighted: faithAwareness=6, culturalCompetence=5, dietaryRequirements=5,
 * festivalKnowledge=4, antiDiscrimination=3, childViewsAdvocacy=2.
 * Max score: 25
 */
export function evaluateStaffReligiousReadiness(
  training: StaffReligiousTraining[],
): StaffReligiousReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      faithAwarenessRate: 0,
      culturalCompetenceRate: 0,
      dietaryRequirementsRate: 0,
      festivalKnowledgeRate: 0,
      antiDiscriminationRate: 0,
      childViewsAdvocacyRate: 0,
    };
  }

  let score = 0;
  const total = training.length;

  // Faith awareness (weight: 6)
  const faithAwareness = training.filter((t) => t.faithAwareness).length;
  const faithAwarenessRate = pct(faithAwareness, total);
  if (faithAwarenessRate >= 90) score += 6;
  else if (faithAwarenessRate >= 70) score += 4;
  else if (faithAwarenessRate >= 50) score += 2;

  // Cultural competence (weight: 5)
  const culturalCompetence = training.filter((t) => t.culturalCompetence).length;
  const culturalCompetenceRate = pct(culturalCompetence, total);
  if (culturalCompetenceRate >= 90) score += 5;
  else if (culturalCompetenceRate >= 70) score += 3;
  else if (culturalCompetenceRate >= 50) score += 1;

  // Dietary requirements (weight: 5)
  const dietaryReqs = training.filter((t) => t.dietaryRequirements).length;
  const dietaryRequirementsRate = pct(dietaryReqs, total);
  if (dietaryRequirementsRate >= 90) score += 5;
  else if (dietaryRequirementsRate >= 70) score += 3;
  else if (dietaryRequirementsRate >= 50) score += 1;

  // Festival knowledge (weight: 4)
  const festivalKnowledge = training.filter((t) => t.festivalKnowledge).length;
  const festivalKnowledgeRate = pct(festivalKnowledge, total);
  if (festivalKnowledgeRate >= 90) score += 4;
  else if (festivalKnowledgeRate >= 70) score += 3;
  else if (festivalKnowledgeRate >= 50) score += 1;

  // Anti-discrimination (weight: 3)
  const antiDiscrimination = training.filter((t) => t.antiDiscrimination).length;
  const antiDiscriminationRate = pct(antiDiscrimination, total);
  if (antiDiscriminationRate >= 90) score += 3;
  else if (antiDiscriminationRate >= 70) score += 2;
  else if (antiDiscriminationRate >= 50) score += 1;

  // Child views advocacy (weight: 2)
  const childViewsAdvocacy = training.filter((t) => t.childViewsAdvocacy).length;
  const childViewsAdvocacyRate = pct(childViewsAdvocacy, total);
  if (childViewsAdvocacyRate >= 90) score += 2;
  else if (childViewsAdvocacyRate >= 70) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: total,
    faithAwarenessRate,
    culturalCompetenceRate,
    dietaryRequirementsRate,
    festivalKnowledgeRate,
    antiDiscriminationRate,
    childViewsAdvocacyRate,
  };
}

// -- Child Religious Profiles -------------------------------------------------

/**
 * Builds per-child religious profiles from assessment and support data.
 * Score 0-10 per child based on assessment completeness and support delivery.
 */
export function buildChildReligiousProfiles(
  assessments: ReligiousSpiritualAssessment[],
  records: ReligiousSupportRecord[],
): ChildReligiousProfile[] {
  const childMap = new Map<
    string,
    {
      childId: string;
      childName: string;
      faithBackground: FaithBackground;
      assessments: ReligiousSpiritualAssessment[];
      records: ReligiousSupportRecord[];
    }
  >();

  for (const a of assessments) {
    if (!childMap.has(a.childId)) {
      childMap.set(a.childId, {
        childId: a.childId,
        childName: a.childName,
        faithBackground: a.faithBackground,
        assessments: [],
        records: [],
      });
    }
    childMap.get(a.childId)!.assessments.push(a);
  }

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, {
        childId: r.childId,
        childName: r.childName,
        faithBackground: "other",
        assessments: [],
        records: [],
      });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Assessment completeness (0-4)
    const hasNeeds = entry.assessments.some((a) => a.needsIdentified);
    const hasPrefs = entry.assessments.some((a) => a.preferencesRecorded);
    const hasViews = entry.assessments.some((a) => a.childViewsSought);
    const hasCareplan = entry.assessments.some((a) => a.careplanUpdated);
    if (hasNeeds) score += 1;
    if (hasPrefs) score += 1;
    if (hasViews) score += 1;
    if (hasCareplan) score += 1;

    // Support delivery (0-4)
    const facilitatedCount = entry.records.filter((r) => r.facilitated).length;
    const satisfiedCount = entry.records.filter((r) => r.childSatisfied).length;
    if (facilitatedCount >= 3) score += 2;
    else if (facilitatedCount >= 1) score += 1;
    if (satisfiedCount >= 3) score += 2;
    else if (satisfiedCount >= 1) score += 1;

    // Regular engagement (0-2)
    const regularCount = entry.records.filter(
      (r) => r.frequency === "daily" || r.frequency === "weekly" || r.frequency === "monthly",
    ).length;
    if (regularCount >= 3) score += 2;
    else if (regularCount >= 1) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      faithBackground: entry.faithBackground,
      assessmentCount: entry.assessments.length,
      supportCount: entry.records.length,
      needsIdentified: hasNeeds,
      preferencesRecorded: hasPrefs,
      score: Math.min(score, 10),
    };
  });
}

// -- Strengths ----------------------------------------------------------------

function generateStrengths(
  assessment: AssessmentQualityResult,
  support: SupportDeliveryResult,
  policy: ReligiousPolicyResult,
  staff: StaffReligiousReadinessResult,
): string[] {
  const strengths: string[] = [];

  if (assessment.needsIdentifiedRate >= 90) {
    strengths.push(
      "Excellent identification of children's religious and spiritual needs across assessments",
    );
  }

  if (assessment.preferencesRecordedRate >= 90) {
    strengths.push(
      "Children's religious preferences are consistently recorded and documented",
    );
  }

  if (assessment.childViewsRate >= 90) {
    strengths.push(
      "Outstanding practice in seeking children's views about their faith and spiritual needs",
    );
  }

  if (assessment.parentConsultedRate >= 80) {
    strengths.push(
      "Parents and carers are regularly consulted about children's religious upbringing and needs",
    );
  }

  if (assessment.careplanUpdatedRate >= 80) {
    strengths.push(
      "Care plans are consistently updated to reflect children's religious and spiritual needs",
    );
  }

  if (support.facilitatedRate >= 90) {
    strengths.push(
      "Religious and spiritual support is actively facilitated for children — demonstrating proactive practice",
    );
  }

  if (support.childSatisfiedRate >= 90) {
    strengths.push(
      "Children consistently report satisfaction with the religious and spiritual support they receive",
    );
  }

  if (support.culturallyAppropriateRate >= 90) {
    strengths.push(
      "Religious support is delivered in a culturally appropriate manner across all faiths",
    );
  }

  if (support.regularFrequencyRate >= 80) {
    strengths.push(
      "Regular and consistent provision of religious and spiritual support — children can rely on routine observance",
    );
  }

  if (policy.faithAssessedOnAdmissionRate >= 90) {
    strengths.push(
      "Faith needs are assessed as part of the admission process for all children",
    );
  }

  if (policy.worshipAccessRate >= 90) {
    strengths.push(
      "Worship access is provided as standard — children can attend services of their chosen faith",
    );
  }

  if (policy.dietaryObservanceRate >= 90) {
    strengths.push(
      "Dietary observance is fully met — menus reflect faith-based dietary requirements",
    );
  }

  if (policy.festivalRecognitionRate >= 90) {
    strengths.push(
      "Religious festivals are recognised and celebrated — children's faith is valued and visible",
    );
  }

  if (policy.prayerSpaceRate >= 90) {
    strengths.push(
      "Dedicated prayer and reflection space is available for children of all faiths",
    );
  }

  if (staff.faithAwarenessRate >= 90) {
    strengths.push(
      "All staff have completed faith awareness training — the team understands diverse religious needs",
    );
  }

  if (staff.culturalCompetenceRate >= 90) {
    strengths.push(
      "Strong cultural competence across the staff team — supporting faith-sensitive care",
    );
  }

  if (staff.dietaryRequirementsRate >= 90) {
    strengths.push(
      "Staff are well-trained in faith-based dietary requirements — ensuring safe and respectful food provision",
    );
  }

  return strengths;
}

// -- Areas for Improvement ----------------------------------------------------

function generateAreasForImprovement(
  assessment: AssessmentQualityResult,
  support: SupportDeliveryResult,
  policy: ReligiousPolicyResult,
  staff: StaffReligiousReadinessResult,
): string[] {
  const areas: string[] = [];

  if (assessment.totalAssessments === 0) {
    areas.push(
      "No religious or spiritual needs assessments recorded — every child's faith background and spiritual needs must be assessed",
    );
  }

  if (assessment.needsIdentifiedRate < 70 && assessment.totalAssessments > 0) {
    areas.push(
      `Only ${assessment.needsIdentifiedRate}% of assessments identify religious needs — all children's faith needs must be explored and documented`,
    );
  }

  if (assessment.preferencesRecordedRate < 70 && assessment.totalAssessments > 0) {
    areas.push(
      `Preferences recorded in only ${assessment.preferencesRecordedRate}% of assessments — children's religious preferences must be systematically captured`,
    );
  }

  if (assessment.childViewsRate < 70 && assessment.totalAssessments > 0) {
    areas.push(
      `Children's views sought in only ${assessment.childViewsRate}% of assessments — their voice must be central to faith provision`,
    );
  }

  if (assessment.parentConsultedRate < 60 && assessment.totalAssessments > 0) {
    areas.push(
      `Parent or carer consulted in only ${assessment.parentConsultedRate}% of assessments — family input is essential for understanding faith upbringing`,
    );
  }

  if (assessment.careplanUpdatedRate < 60 && assessment.totalAssessments > 0) {
    areas.push(
      `Care plans updated in only ${assessment.careplanUpdatedRate}% of assessments — care plans must reflect religious and spiritual needs`,
    );
  }

  if (support.totalRecords === 0) {
    areas.push(
      "No religious or spiritual support records found — children must have active access to faith-based support",
    );
  }

  if (support.facilitatedRate < 70 && support.totalRecords > 0) {
    areas.push(
      `Only ${support.facilitatedRate}% of religious support is facilitated — the home must proactively enable children's worship and spiritual practice`,
    );
  }

  if (support.childSatisfiedRate < 70 && support.totalRecords > 0) {
    areas.push(
      `Child satisfaction at ${support.childSatisfiedRate}% — religious support should be tailored to individual preferences and wishes`,
    );
  }

  if (support.culturallyAppropriateRate < 70 && support.totalRecords > 0) {
    areas.push(
      `Only ${support.culturallyAppropriateRate}% of support is culturally appropriate — staff must ensure faith practices are respected and authentic`,
    );
  }

  if (support.regularFrequencyRate < 60 && support.totalRecords > 0) {
    areas.push(
      `Regular frequency at ${support.regularFrequencyRate}% — children need consistent access to religious observance, not occasional provision`,
    );
  }

  if (policy.totalPolicies === 0) {
    areas.push(
      "No religious policy records found — the home must have clear policies on meeting children's faith and spiritual needs",
    );
  }

  if (policy.worshipAccessRate < 60 && policy.totalPolicies > 0) {
    areas.push(
      `Worship access provided in only ${policy.worshipAccessRate}% of policies — children must be able to attend services of their faith`,
    );
  }

  if (policy.dietaryObservanceRate < 60 && policy.totalPolicies > 0) {
    areas.push(
      `Dietary observance met in only ${policy.dietaryObservanceRate}% of policies — faith-based dietary needs are non-negotiable`,
    );
  }

  if (policy.prayerSpaceRate < 60 && policy.totalPolicies > 0) {
    areas.push(
      `Prayer space available in only ${policy.prayerSpaceRate}% of policies — a quiet, respectful space for prayer and reflection must be provided`,
    );
  }

  if (staff.totalStaff === 0) {
    areas.push(
      "No staff religious training records — all staff must receive training on supporting children's faith and spiritual needs",
    );
  }

  if (staff.faithAwarenessRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Faith awareness training at ${staff.faithAwarenessRate}% — all staff should understand the major faith traditions and their practices`,
    );
  }

  if (staff.dietaryRequirementsRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Dietary requirements training at ${staff.dietaryRequirementsRate}% — staff must know faith-based dietary rules (halal, kosher, vegetarian, etc.)`,
    );
  }

  if (staff.antiDiscriminationRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Anti-discrimination training at ${staff.antiDiscriminationRate}% — Equality Act 2010 requires protection from religious discrimination`,
    );
  }

  return areas;
}

// -- Actions ------------------------------------------------------------------

function generateActions(
  assessment: AssessmentQualityResult,
  support: SupportDeliveryResult,
  policy: ReligiousPolicyResult,
  staff: StaffReligiousReadinessResult,
): string[] {
  const actions: string[] = [];

  if (assessment.totalAssessments === 0) {
    actions.push(
      "URGENT: Complete religious and spiritual needs assessments for all children — CHR 2015 Reg 10 requires the home to meet children's religious needs",
    );
  }

  if (support.totalRecords === 0) {
    actions.push(
      "URGENT: Establish religious and spiritual support provision — children must have active access to worship, prayer, and faith community (UNCRC Article 14)",
    );
  }

  if (policy.totalPolicies === 0) {
    actions.push(
      "URGENT: Develop and implement religious and spiritual needs policies — NMS 3 requires placement plans to address religious observance",
    );
  }

  if (staff.totalStaff === 0) {
    actions.push(
      "URGENT: Record and assess staff religious and spiritual training — the team must be equipped to support diverse faith needs",
    );
  }

  if (assessment.childViewsRate < 70 && assessment.totalAssessments > 0) {
    actions.push(
      "Seek children's views in all religious assessments — use age-appropriate methods to understand their faith wishes and feelings",
    );
  }

  if (assessment.parentConsultedRate < 60 && assessment.totalAssessments > 0) {
    actions.push(
      "Increase parent and carer consultation — families hold essential knowledge about children's religious upbringing and traditions",
    );
  }

  if (assessment.careplanUpdatedRate < 60 && assessment.totalAssessments > 0) {
    actions.push(
      "Update care plans to reflect religious and spiritual needs — CHR 2015 Reg 12 requires holistic well-being including spiritual needs",
    );
  }

  if (assessment.needsIdentifiedRate < 70 && assessment.totalAssessments > 0) {
    actions.push(
      "Improve identification of religious needs in assessments — ensure every assessment explores faith background and spiritual wishes",
    );
  }

  if (support.facilitatedRate < 70 && support.totalRecords > 0) {
    actions.push(
      "Proactively facilitate religious support — arrange transport to places of worship and connect with faith leaders",
    );
  }

  if (support.childSatisfiedRate < 70 && support.totalRecords > 0) {
    actions.push(
      "Review religious support with children — ensure provision matches their actual wishes and preferences, not assumptions",
    );
  }

  if (support.culturallyAppropriateRate < 70 && support.totalRecords > 0) {
    actions.push(
      "Ensure all religious support is culturally appropriate — consult faith communities and cultural advisers where needed",
    );
  }

  if (support.regularFrequencyRate < 60 && support.totalRecords > 0) {
    actions.push(
      "Establish regular faith observance schedules — weekly worship and daily prayer where requested should be routine, not exceptional",
    );
  }

  if (policy.worshipAccessRate < 60 && policy.totalPolicies > 0) {
    actions.push(
      "Ensure worship access is embedded in policy — Equality Act 2010 protects religion as a characteristic",
    );
  }

  if (policy.dietaryObservanceRate < 60 && policy.totalPolicies > 0) {
    actions.push(
      "Update dietary policies to meet faith-based requirements — halal, kosher, vegetarian, and fasting observance must be supported",
    );
  }

  if (policy.prayerSpaceRate < 60 && policy.totalPolicies > 0) {
    actions.push(
      "Designate a prayer and reflection space — children need a quiet, respectful area for spiritual practice",
    );
  }

  if (staff.faithAwarenessRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Deliver faith awareness training to all staff — cover major world religions, spiritual practices, and how to support them",
    );
  }

  if (staff.dietaryRequirementsRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Train staff on faith-based dietary requirements — including halal, kosher, Hindu vegetarianism, Sikh dietary practices, and fasting",
    );
  }

  if (staff.antiDiscriminationRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Provide anti-discrimination training covering religion and belief — Equality Act 2010 compliance is mandatory",
    );
  }

  if (staff.festivalKnowledgeRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Train staff on religious festivals and their significance — Eid, Diwali, Hanukkah, Vaisakhi, Christmas, Vesak, and others",
    );
  }

  return actions;
}

// -- Main Intelligence Function -----------------------------------------------

export function generateReligiousSpiritualNeedsIntelligence(
  assessments: ReligiousSpiritualAssessment[],
  records: ReligiousSupportRecord[],
  policies: ReligiousPolicy[],
  training: StaffReligiousTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ReligiousSpiritualNeedsIntelligence {
  const assessmentResult = evaluateAssessmentQuality(assessments);
  const supportResult = evaluateSupportDelivery(records);
  const policyResult = evaluateReligiousPolicy(policies);
  const staffResult = evaluateStaffReligiousReadiness(training);

  const rawScore =
    assessmentResult.overallScore +
    supportResult.overallScore +
    policyResult.overallScore +
    staffResult.overallScore;
  const overallScore = Math.min(rawScore, 100);

  const childProfiles = buildChildReligiousProfiles(assessments, records);

  const strengths = generateStrengths(
    assessmentResult,
    supportResult,
    policyResult,
    staffResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    assessmentResult,
    supportResult,
    policyResult,
    staffResult,
  );
  const actions = generateActions(
    assessmentResult,
    supportResult,
    policyResult,
    staffResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 10 — duty to meet children's cultural, linguistic, religious, and racial needs",
    "CHR 2015 Reg 12 — health and well-being standard including spiritual and emotional well-being",
    "SCCIF — experiences and progress of children including respect for faith and identity",
    "Equality Act 2010 — religion or belief as a protected characteristic",
    "NMS 3 — placement plan must address religious observance and spiritual needs",
    "Children Act 1989 s22(5)(c) — due consideration to religious persuasion, racial origin, cultural and linguistic background",
    "UNCRC Article 14 — freedom of thought, conscience, and religion",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating: getRating(overallScore),
    assessmentQuality: assessmentResult,
    supportDelivery: supportResult,
    religiousPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
