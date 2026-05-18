// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Cultural Identity Support Intelligence Engine
//
// Evaluates how well children's cultural, ethnic, religious, and linguistic
// identities are recognised, supported, and celebrated within the home.
//
// Regulatory basis:
//   - CHR 2015 Reg 6 (quality of care standard including cultural needs)
//   - Equality Act 2010 (protection from discrimination)
//   - SCCIF (experiences and progress of children)
//   - UNCRC Article 8 (right to preservation of identity)
//   - UNCRC Article 30 (minority culture, religion, and language rights)
//   - NMS 7 (leisure activities)
//   - Working Together 2023
//   - CA 1989 s22(5)(c) (due consideration to religious, racial, cultural,
//     linguistic needs)
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type IdentityDimension =
  | "ethnicity"
  | "religion"
  | "language"
  | "heritage"
  | "disability"
  | "gender_identity"
  | "sexual_orientation"
  | "nationality"
  | "family_traditions";

export type SupportLevel =
  | "fully_supported"
  | "mostly_supported"
  | "partially_supported"
  | "not_supported"
  | "not_assessed";

export type DietaryProvision =
  | "fully_met"
  | "mostly_met"
  | "partially_met"
  | "not_met"
  | "not_applicable";

export type CulturalActivityType =
  | "religious_observance"
  | "cultural_celebration"
  | "language_maintenance"
  | "food_preparation"
  | "community_connection"
  | "heritage_exploration"
  | "identity_work"
  | "life_story";

export type StaffCompetenceLevel =
  | "advanced"
  | "competent"
  | "developing"
  | "needs_training";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface IdentityAssessment {
  id: string;
  childId: string;
  childName: string;
  dimension: IdentityDimension;
  supportLevel: SupportLevel;
  assessedDate: string;
  assessedBy: string;
  childViewsSought: boolean;
  needsIdentified: string | null;
  planInPlace: boolean;
}

export interface CulturalActivity {
  id: string;
  childId: string;
  childName: string;
  activityType: CulturalActivityType;
  date: string;
  description: string;
  childChose: boolean;
  childEnjoyedIt: boolean;
  staffFacilitated: boolean;
  communityLink: boolean;
}

export interface DietaryNeedRecord {
  id: string;
  childId: string;
  childName: string;
  dietaryRequirement: string;
  provision: DietaryProvision;
  reviewDate: string | null;
  childSatisfied: boolean;
}

export interface StaffCulturalCompetence {
  id: string;
  staffId: string;
  staffName: string;
  competenceLevel: StaffCompetenceLevel;
  trainingCompleted: string[];
  lastTrainingDate: string | null;
  canSupportLanguage: boolean;
  understandsFaithNeeds: boolean;
  antiRacistPractice: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface IdentityRecognitionResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  fullySupportedRate: number;
  childViewsSoughtRate: number;
  planInPlaceRate: number;
  dimensionsCovered: number;
  notAssessedCount: number;
}

export interface CulturalProvisionResult {
  overallScore: number; // 0-25
  totalActivities: number;
  childChoiceRate: number;
  childEnjoymentRate: number;
  communityLinkRate: number;
  activityVariety: number;
  staffFacilitatedRate: number;
}

export interface DietaryRespectResult {
  overallScore: number; // 0-25
  totalRecords: number;
  fullyMetRate: number;
  childSatisfiedRate: number;
  reviewedRate: number;
}

export interface StaffCompetenceResult {
  overallScore: number; // 0-25
  totalStaff: number;
  competentAdvancedRate: number;
  languageSupportRate: number;
  faithNeedsRate: number;
  antiRacistRate: number;
  trainingCompletedRate: number;
}

export interface ChildCulturalProfile {
  childId: string;
  childName: string;
  dimensionsAssessed: number;
  fullySupportedDimensions: number;
  activitiesCount: number;
  dietaryMetRate: number;
  overallScore: number; // 0-10
}

export interface CulturalIdentitySupportIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  identityRecognition: IdentityRecognitionResult;
  culturalProvision: CulturalProvisionResult;
  dietaryRespect: DietaryRespectResult;
  staffCompetence: StaffCompetenceResult;
  childProfiles: ChildCulturalProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Maps ──────────────────────────────────────────────────────────────

const IDENTITY_DIMENSION_LABELS: Record<IdentityDimension, string> = {
  ethnicity: "Ethnicity",
  religion: "Religion",
  language: "Language",
  heritage: "Heritage",
  disability: "Disability",
  gender_identity: "Gender Identity",
  sexual_orientation: "Sexual Orientation",
  nationality: "Nationality",
  family_traditions: "Family Traditions",
};

const SUPPORT_LEVEL_LABELS: Record<SupportLevel, string> = {
  fully_supported: "Fully Supported",
  mostly_supported: "Mostly Supported",
  partially_supported: "Partially Supported",
  not_supported: "Not Supported",
  not_assessed: "Not Assessed",
};

const DIETARY_PROVISION_LABELS: Record<DietaryProvision, string> = {
  fully_met: "Fully Met",
  mostly_met: "Mostly Met",
  partially_met: "Partially Met",
  not_met: "Not Met",
  not_applicable: "Not Applicable",
};

const CULTURAL_ACTIVITY_TYPE_LABELS: Record<CulturalActivityType, string> = {
  religious_observance: "Religious Observance",
  cultural_celebration: "Cultural Celebration",
  language_maintenance: "Language Maintenance",
  food_preparation: "Food Preparation",
  community_connection: "Community Connection",
  heritage_exploration: "Heritage Exploration",
  identity_work: "Identity Work",
  life_story: "Life Story",
};

const STAFF_COMPETENCE_LEVEL_LABELS: Record<StaffCompetenceLevel, string> = {
  advanced: "Advanced",
  competent: "Competent",
  developing: "Developing",
  needs_training: "Needs Training",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// ── Label Functions ──────────────────────────────────────────────────────────

export function getIdentityDimensionLabel(d: IdentityDimension): string {
  return IDENTITY_DIMENSION_LABELS[d] ?? d;
}

export function getSupportLevelLabel(s: SupportLevel): string {
  return SUPPORT_LEVEL_LABELS[s] ?? s;
}

export function getDietaryProvisionLabel(p: DietaryProvision): string {
  return DIETARY_PROVISION_LABELS[p] ?? p;
}

export function getCulturalActivityTypeLabel(t: CulturalActivityType): string {
  return CULTURAL_ACTIVITY_TYPE_LABELS[t] ?? t;
}

export function getStaffCompetenceLevelLabel(l: StaffCompetenceLevel): string {
  return STAFF_COMPETENCE_LEVEL_LABELS[l] ?? l;
}

export function getRatingLabel(r: Rating): string {
  return RATING_LABELS[r] ?? r;
}

// ── Utility ──────────────────────────────────────────────────────────────────

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

// ── Evaluation Functions ─────────────────────────────────────────────────────

/**
 * Evaluates how well children's identity dimensions are recognised and supported.
 * Considers: support level, child views sought, plans in place, dimension coverage.
 * Max score: 25
 */
export function evaluateIdentityRecognition(
  assessments: IdentityAssessment[],
): IdentityRecognitionResult {
  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      fullySupportedRate: 0,
      childViewsSoughtRate: 0,
      planInPlaceRate: 0,
      dimensionsCovered: 0,
      notAssessedCount: 0,
    };
  }

  let score = 0;

  // Fully supported rate (fully_supported or mostly_supported)
  const supported = assessments.filter(
    (a) => a.supportLevel === "fully_supported" || a.supportLevel === "mostly_supported",
  ).length;
  const fullySupportedRate = pct(supported, assessments.length);
  // +7 for >= 80%, +5 for >= 60%, +3 for >= 40%
  if (fullySupportedRate >= 80) score += 7;
  else if (fullySupportedRate >= 60) score += 5;
  else if (fullySupportedRate >= 40) score += 3;

  // Child views sought rate
  const viewsSought = assessments.filter((a) => a.childViewsSought).length;
  const childViewsSoughtRate = pct(viewsSought, assessments.length);
  // +6 for >= 90%, +4 for >= 70%, +2 for >= 50%
  if (childViewsSoughtRate >= 90) score += 6;
  else if (childViewsSoughtRate >= 70) score += 4;
  else if (childViewsSoughtRate >= 50) score += 2;

  // Plan in place rate (for those with needs identified)
  const withNeeds = assessments.filter((a) => a.needsIdentified !== null);
  const plansInPlace = withNeeds.filter((a) => a.planInPlace).length;
  const planInPlaceRate = withNeeds.length > 0 ? pct(plansInPlace, withNeeds.length) : 0;
  // +6 for >= 90%, +4 for >= 70%, +2 for >= 50%
  if (withNeeds.length > 0) {
    if (planInPlaceRate >= 90) score += 6;
    else if (planInPlaceRate >= 70) score += 4;
    else if (planInPlaceRate >= 50) score += 2;
  } else {
    // No needs identified — award mid-range
    score += 3;
  }

  // Dimension coverage (unique dimensions assessed)
  const uniqueDimensions = new Set(assessments.map((a) => a.dimension));
  const dimensionsCovered = uniqueDimensions.size;
  // +6 for >= 7 dimensions, +4 for >= 5, +2 for >= 3, +1 for >= 1
  if (dimensionsCovered >= 7) score += 6;
  else if (dimensionsCovered >= 5) score += 4;
  else if (dimensionsCovered >= 3) score += 2;
  else if (dimensionsCovered >= 1) score += 1;

  // Not assessed count
  const notAssessedCount = assessments.filter(
    (a) => a.supportLevel === "not_assessed",
  ).length;

  return {
    overallScore: Math.min(score, 25),
    totalAssessments: assessments.length,
    fullySupportedRate,
    childViewsSoughtRate,
    planInPlaceRate,
    dimensionsCovered,
    notAssessedCount,
  };
}

/**
 * Evaluates cultural provision through activities.
 * Considers: child choice, enjoyment, community links, variety, staff facilitation.
 * Max score: 25
 */
export function evaluateCulturalProvision(
  activities: CulturalActivity[],
): CulturalProvisionResult {
  if (activities.length === 0) {
    return {
      overallScore: 0,
      totalActivities: 0,
      childChoiceRate: 0,
      childEnjoymentRate: 0,
      communityLinkRate: 0,
      activityVariety: 0,
      staffFacilitatedRate: 0,
    };
  }

  let score = 0;

  // Child choice rate
  const childChose = activities.filter((a) => a.childChose).length;
  const childChoiceRate = pct(childChose, activities.length);
  // +6 for >= 80%, +4 for >= 60%, +2 for >= 40%
  if (childChoiceRate >= 80) score += 6;
  else if (childChoiceRate >= 60) score += 4;
  else if (childChoiceRate >= 40) score += 2;

  // Child enjoyment rate
  const enjoyed = activities.filter((a) => a.childEnjoyedIt).length;
  const childEnjoymentRate = pct(enjoyed, activities.length);
  // +6 for >= 85%, +4 for >= 65%, +2 for >= 45%
  if (childEnjoymentRate >= 85) score += 6;
  else if (childEnjoymentRate >= 65) score += 4;
  else if (childEnjoymentRate >= 45) score += 2;

  // Community link rate
  const communityLinked = activities.filter((a) => a.communityLink).length;
  const communityLinkRate = pct(communityLinked, activities.length);
  // +5 for >= 70%, +3 for >= 50%, +1 for >= 30%
  if (communityLinkRate >= 70) score += 5;
  else if (communityLinkRate >= 50) score += 3;
  else if (communityLinkRate >= 30) score += 1;

  // Activity variety (unique types)
  const uniqueTypes = new Set(activities.map((a) => a.activityType));
  const activityVariety = uniqueTypes.size;
  // +4 for >= 5 types, +3 for >= 3, +1 for >= 1
  if (activityVariety >= 5) score += 4;
  else if (activityVariety >= 3) score += 3;
  else if (activityVariety >= 1) score += 1;

  // Staff facilitated rate
  const staffFacilitated = activities.filter((a) => a.staffFacilitated).length;
  const staffFacilitatedRate = pct(staffFacilitated, activities.length);
  // +4 for >= 80%, +2 for >= 50%
  if (staffFacilitatedRate >= 80) score += 4;
  else if (staffFacilitatedRate >= 50) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalActivities: activities.length,
    childChoiceRate,
    childEnjoymentRate,
    communityLinkRate,
    activityVariety,
    staffFacilitatedRate,
  };
}

/**
 * Evaluates how well dietary needs rooted in culture/religion are respected.
 * Considers: fully met rate, child satisfaction, review coverage.
 * If no dietary records exist, returns score 0 (not assessed).
 * Max score: 25
 */
export function evaluateDietaryRespect(
  records: DietaryNeedRecord[],
): DietaryRespectResult {
  if (records.length === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      fullyMetRate: 0,
      childSatisfiedRate: 0,
      reviewedRate: 0,
    };
  }

  // Filter out not_applicable records for scoring
  const applicableRecords = records.filter((r) => r.provision !== "not_applicable");

  if (applicableRecords.length === 0) {
    // All records are not_applicable — perfect compliance
    return {
      overallScore: 25,
      totalRecords: records.length,
      fullyMetRate: 0,
      childSatisfiedRate: 0,
      reviewedRate: 0,
    };
  }

  let score = 0;

  // Fully met rate
  const fullyMet = applicableRecords.filter((r) => r.provision === "fully_met").length;
  const fullyMetRate = pct(fullyMet, applicableRecords.length);
  // +10 for >= 90%, +7 for >= 70%, +4 for >= 50%, +2 for >= 30%
  if (fullyMetRate >= 90) score += 10;
  else if (fullyMetRate >= 70) score += 7;
  else if (fullyMetRate >= 50) score += 4;
  else if (fullyMetRate >= 30) score += 2;

  // Child satisfied rate
  const satisfied = applicableRecords.filter((r) => r.childSatisfied).length;
  const childSatisfiedRate = pct(satisfied, applicableRecords.length);
  // +8 for >= 90%, +6 for >= 70%, +3 for >= 50%
  if (childSatisfiedRate >= 90) score += 8;
  else if (childSatisfiedRate >= 70) score += 6;
  else if (childSatisfiedRate >= 50) score += 3;

  // Reviewed rate (has a review date)
  const reviewed = applicableRecords.filter((r) => r.reviewDate !== null).length;
  const reviewedRate = pct(reviewed, applicableRecords.length);
  // +7 for >= 90%, +5 for >= 70%, +3 for >= 50%, +1 for >= 30%
  if (reviewedRate >= 90) score += 7;
  else if (reviewedRate >= 70) score += 5;
  else if (reviewedRate >= 50) score += 3;
  else if (reviewedRate >= 30) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalRecords: records.length,
    fullyMetRate,
    childSatisfiedRate,
    reviewedRate,
  };
}

/**
 * Evaluates staff cultural competence across the team.
 * Considers: competence level, language support, faith needs understanding,
 * anti-racist practice, training completion.
 * Max score: 25
 */
export function evaluateStaffCompetence(
  competences: StaffCulturalCompetence[],
): StaffCompetenceResult {
  if (competences.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      competentAdvancedRate: 0,
      languageSupportRate: 0,
      faithNeedsRate: 0,
      antiRacistRate: 0,
      trainingCompletedRate: 0,
    };
  }

  let score = 0;
  const total = competences.length;

  // Competent or advanced rate
  const competentAdvanced = competences.filter(
    (c) => c.competenceLevel === "competent" || c.competenceLevel === "advanced",
  ).length;
  const competentAdvancedRate = pct(competentAdvanced, total);
  // +7 for >= 80%, +5 for >= 60%, +3 for >= 40%
  if (competentAdvancedRate >= 80) score += 7;
  else if (competentAdvancedRate >= 60) score += 5;
  else if (competentAdvancedRate >= 40) score += 3;

  // Language support rate
  const languageSupport = competences.filter((c) => c.canSupportLanguage).length;
  const languageSupportRate = pct(languageSupport, total);
  // +5 for >= 60%, +3 for >= 40%, +1 for >= 20%
  if (languageSupportRate >= 60) score += 5;
  else if (languageSupportRate >= 40) score += 3;
  else if (languageSupportRate >= 20) score += 1;

  // Faith needs understanding rate
  const faithNeeds = competences.filter((c) => c.understandsFaithNeeds).length;
  const faithNeedsRate = pct(faithNeeds, total);
  // +5 for >= 80%, +3 for >= 60%, +1 for >= 40%
  if (faithNeedsRate >= 80) score += 5;
  else if (faithNeedsRate >= 60) score += 3;
  else if (faithNeedsRate >= 40) score += 1;

  // Anti-racist practice rate
  const antiRacist = competences.filter((c) => c.antiRacistPractice).length;
  const antiRacistRate = pct(antiRacist, total);
  // +4 for >= 90%, +3 for >= 70%, +1 for >= 50%
  if (antiRacistRate >= 90) score += 4;
  else if (antiRacistRate >= 70) score += 3;
  else if (antiRacistRate >= 50) score += 1;

  // Training completed rate (staff with at least one training completed)
  const trained = competences.filter((c) => c.trainingCompleted.length > 0).length;
  const trainingCompletedRate = pct(trained, total);
  // +4 for >= 90%, +3 for >= 70%, +1 for >= 50%
  if (trainingCompletedRate >= 90) score += 4;
  else if (trainingCompletedRate >= 70) score += 3;
  else if (trainingCompletedRate >= 50) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: total,
    competentAdvancedRate,
    languageSupportRate,
    faithNeedsRate,
    antiRacistRate,
    trainingCompletedRate,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildCulturalProfiles(
  assessments: IdentityAssessment[],
  activities: CulturalActivity[],
  dietaryRecords: DietaryNeedRecord[],
): ChildCulturalProfile[] {
  // Collect all unique child IDs across all data sources
  const childMap = new Map<string, { id: string; name: string }>();
  for (const a of assessments) {
    childMap.set(a.childId, { id: a.childId, name: a.childName });
  }
  for (const a of activities) {
    childMap.set(a.childId, { id: a.childId, name: a.childName });
  }
  for (const d of dietaryRecords) {
    childMap.set(d.childId, { id: d.childId, name: d.childName });
  }

  return [...childMap.values()].map((child) => {
    const childAssessments = assessments.filter((a) => a.childId === child.id);
    const childActivities = activities.filter((a) => a.childId === child.id);
    const childDietary = dietaryRecords.filter((d) => d.childId === child.id);

    // Dimensions assessed (unique dimensions)
    const uniqueDimensions = new Set(childAssessments.map((a) => a.dimension));
    const dimensionsAssessed = uniqueDimensions.size;

    // Fully supported dimensions
    const fullySupportedDimensions = new Set(
      childAssessments
        .filter((a) => a.supportLevel === "fully_supported")
        .map((a) => a.dimension),
    ).size;

    // Activities count
    const activitiesCount = childActivities.length;

    // Dietary met rate
    const applicableDietary = childDietary.filter(
      (d) => d.provision !== "not_applicable",
    );
    const dietaryMet = applicableDietary.filter(
      (d) => d.provision === "fully_met",
    ).length;
    const dietaryMetRate = applicableDietary.length > 0
      ? pct(dietaryMet, applicableDietary.length)
      : 0;

    // Profile score 0-10
    let profileScore = 0;

    // Identity dimensions assessed (up to 3 points)
    if (dimensionsAssessed >= 5) profileScore += 3;
    else if (dimensionsAssessed >= 3) profileScore += 2;
    else if (dimensionsAssessed >= 1) profileScore += 1;

    // Fully supported rate (up to 2 points)
    if (dimensionsAssessed > 0) {
      const supportRate = pct(fullySupportedDimensions, dimensionsAssessed);
      if (supportRate >= 80) profileScore += 2;
      else if (supportRate >= 50) profileScore += 1;
    }

    // Cultural activities (up to 2 points)
    if (activitiesCount >= 3) profileScore += 2;
    else if (activitiesCount >= 1) profileScore += 1;

    // Dietary provision (up to 2 points)
    if (applicableDietary.length === 0) {
      // No dietary needs — neutral (1 point)
      profileScore += 1;
    } else if (dietaryMetRate >= 90) {
      profileScore += 2;
    } else if (dietaryMetRate >= 50) {
      profileScore += 1;
    }

    // Child views sought bonus (1 point)
    const viewsSought = childAssessments.filter((a) => a.childViewsSought).length;
    if (childAssessments.length > 0 && pct(viewsSought, childAssessments.length) >= 80) {
      profileScore += 1;
    }

    return {
      childId: child.id,
      childName: child.name,
      dimensionsAssessed,
      fullySupportedDimensions,
      activitiesCount,
      dietaryMetRate,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  identity: IdentityRecognitionResult,
  provision: CulturalProvisionResult,
  dietary: DietaryRespectResult,
  staff: StaffCompetenceResult,
): string[] {
  const strengths: string[] = [];

  if (identity.fullySupportedRate >= 80) {
    strengths.push(
      "Strong identity support — the majority of children's cultural identity dimensions are fully or mostly supported",
    );
  }

  if (identity.childViewsSoughtRate >= 90) {
    strengths.push(
      "Excellent practice in seeking children's views about their cultural identity and needs",
    );
  }

  if (identity.dimensionsCovered >= 7) {
    strengths.push(
      "Comprehensive identity coverage — assessments span a wide range of identity dimensions",
    );
  }

  if (identity.planInPlaceRate >= 90 && identity.totalAssessments > 0) {
    strengths.push(
      "Where needs are identified, plans are consistently in place to support cultural identity",
    );
  }

  if (provision.childChoiceRate >= 80) {
    strengths.push(
      "Children are actively choosing their own cultural activities — promoting agency and ownership",
    );
  }

  if (provision.childEnjoymentRate >= 85) {
    strengths.push(
      "High enjoyment rate in cultural activities — activities are meaningful to children",
    );
  }

  if (provision.communityLinkRate >= 70) {
    strengths.push(
      "Strong community links through cultural activities — children connect with their wider cultural community",
    );
  }

  if (provision.activityVariety >= 5) {
    strengths.push(
      "Excellent variety of cultural activities — children experience diverse forms of cultural engagement",
    );
  }

  if (dietary.fullyMetRate >= 90 && dietary.totalRecords > 0) {
    strengths.push(
      "Dietary needs fully met for all children — cultural and religious food requirements are respected",
    );
  }

  if (dietary.childSatisfiedRate >= 90 && dietary.totalRecords > 0) {
    strengths.push(
      "Children express high satisfaction with how their dietary needs are met",
    );
  }

  if (staff.competentAdvancedRate >= 80) {
    strengths.push(
      "Strong staff cultural competence — the majority of the team are competent or advanced in cultural practice",
    );
  }

  if (staff.antiRacistRate >= 90) {
    strengths.push(
      "Excellent anti-racist practice across the staff team — all staff demonstrate commitment to equality",
    );
  }

  if (staff.faithNeedsRate >= 80) {
    strengths.push(
      "Staff demonstrate strong understanding of children's faith needs",
    );
  }

  if (staff.trainingCompletedRate >= 90) {
    strengths.push(
      "All staff have completed cultural competence training — demonstrating organisational commitment",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  identity: IdentityRecognitionResult,
  provision: CulturalProvisionResult,
  dietary: DietaryRespectResult,
  staff: StaffCompetenceResult,
): string[] {
  const areas: string[] = [];

  if (identity.totalAssessments === 0) {
    areas.push(
      "No identity assessments recorded — children's cultural, ethnic, and religious identities must be assessed and documented",
    );
  }

  if (identity.fullySupportedRate < 60 && identity.totalAssessments > 0) {
    areas.push(
      `Only ${identity.fullySupportedRate}% of identity dimensions are fully or mostly supported — more proactive cultural support is needed`,
    );
  }

  if (identity.childViewsSoughtRate < 70 && identity.totalAssessments > 0) {
    areas.push(
      `Children's views sought in only ${identity.childViewsSoughtRate}% of assessments — their voice must be central to identity work`,
    );
  }

  if (identity.notAssessedCount > 0) {
    areas.push(
      `${identity.notAssessedCount} identity dimension(s) remain "not assessed" — all relevant dimensions should be assessed`,
    );
  }

  if (identity.planInPlaceRate < 70 && identity.totalAssessments > 0) {
    areas.push(
      `Plans in place for only ${identity.planInPlaceRate}% of identified needs — all cultural needs should have supporting plans`,
    );
  }

  if (provision.totalActivities === 0) {
    areas.push(
      "No cultural activities recorded — children should have regular access to cultural, religious, and heritage activities",
    );
  }

  if (provision.childChoiceRate < 60 && provision.totalActivities > 0) {
    areas.push(
      `Child choice rate at ${provision.childChoiceRate}% — more activities should be chosen by children themselves`,
    );
  }

  if (provision.childEnjoymentRate < 65 && provision.totalActivities > 0) {
    areas.push(
      `Child enjoyment rate at ${provision.childEnjoymentRate}% — activities should better reflect children's genuine interests`,
    );
  }

  if (provision.communityLinkRate < 50 && provision.totalActivities > 0) {
    areas.push(
      `Only ${provision.communityLinkRate}% of cultural activities link to the wider community — more community engagement needed`,
    );
  }

  if (dietary.fullyMetRate < 70 && dietary.totalRecords > 0) {
    areas.push(
      `Dietary needs fully met for only ${dietary.fullyMetRate}% of children — cultural and religious dietary requirements must be consistently honoured`,
    );
  }

  if (dietary.childSatisfiedRate < 70 && dietary.totalRecords > 0) {
    areas.push(
      `Child satisfaction with dietary provision at ${dietary.childSatisfiedRate}% — children's views about food should be sought and acted upon`,
    );
  }

  if (dietary.reviewedRate < 70 && dietary.totalRecords > 0) {
    areas.push(
      `Only ${dietary.reviewedRate}% of dietary records have been reviewed — regular review of dietary provision is needed`,
    );
  }

  if (staff.totalStaff === 0) {
    areas.push(
      "No staff cultural competence assessments recorded — all staff should have their cultural competence assessed",
    );
  }

  if (staff.competentAdvancedRate < 60 && staff.totalStaff > 0) {
    areas.push(
      `Only ${staff.competentAdvancedRate}% of staff are competent or advanced — more cultural competence development is needed`,
    );
  }

  if (staff.antiRacistRate < 70 && staff.totalStaff > 0) {
    areas.push(
      `Anti-racist practice at ${staff.antiRacistRate}% — all staff should demonstrate commitment to anti-racist practice`,
    );
  }

  if (staff.faithNeedsRate < 60 && staff.totalStaff > 0) {
    areas.push(
      `Only ${staff.faithNeedsRate}% of staff understand faith needs — training on religious and spiritual needs is required`,
    );
  }

  return areas;
}

function generateActions(
  identity: IdentityRecognitionResult,
  provision: CulturalProvisionResult,
  dietary: DietaryRespectResult,
  staff: StaffCompetenceResult,
): string[] {
  const actions: string[] = [];

  if (identity.totalAssessments === 0) {
    actions.push(
      "URGENT: Complete cultural identity assessments for all children — CA 1989 s22(5)(c) requires due consideration of cultural needs",
    );
  }

  if (provision.totalActivities === 0) {
    actions.push(
      "URGENT: Implement a cultural activities programme — children must have access to activities that support their identity (UNCRC Article 30)",
    );
  }

  if (staff.totalStaff === 0) {
    actions.push(
      "URGENT: Assess staff cultural competence — the team must be equipped to support children's diverse identities",
    );
  }

  if (identity.childViewsSoughtRate < 70 && identity.totalAssessments > 0) {
    actions.push(
      "Seek children's views in all identity assessments — use age-appropriate methods to understand their wishes and feelings",
    );
  }

  if (identity.notAssessedCount > 0) {
    actions.push(
      "Complete assessments for all outstanding identity dimensions — ensure no aspect of a child's identity is overlooked",
    );
  }

  if (identity.planInPlaceRate < 70 && identity.totalAssessments > 0) {
    actions.push(
      "Develop support plans for all identified cultural needs — plans should be specific, actionable, and regularly reviewed",
    );
  }

  if (provision.communityLinkRate < 50 && provision.totalActivities > 0) {
    actions.push(
      "Strengthen community links — connect with local cultural groups, faith communities, and heritage organisations",
    );
  }

  if (provision.activityVariety < 3 && provision.totalActivities > 0) {
    actions.push(
      "Broaden the range of cultural activities — include religious observance, language maintenance, heritage exploration, and community connection",
    );
  }

  if (dietary.fullyMetRate < 70 && dietary.totalRecords > 0) {
    actions.push(
      "Review dietary provision — ensure all cultural and religious food requirements are consistently met",
    );
  }

  if (dietary.reviewedRate < 70 && dietary.totalRecords > 0) {
    actions.push(
      "Schedule regular reviews of dietary provision — engage children in reviewing how well their food needs are being met",
    );
  }

  if (staff.competentAdvancedRate < 60 && staff.totalStaff > 0) {
    actions.push(
      "Provide targeted cultural competence training — focus on areas identified through staff assessments",
    );
  }

  if (staff.antiRacistRate < 70 && staff.totalStaff > 0) {
    actions.push(
      "Implement anti-racist practice training for all staff — Equality Act 2010 compliance requires proactive commitment",
    );
  }

  if (staff.faithNeedsRate < 60 && staff.totalStaff > 0) {
    actions.push(
      "Deliver faith awareness training — staff must understand and respect children's religious and spiritual needs",
    );
  }

  if (staff.languageSupportRate < 40 && staff.totalStaff > 0) {
    actions.push(
      "Develop language support capability — recruit or train staff who can support children's home languages",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateCulturalIdentitySupportIntelligence(
  assessments: IdentityAssessment[],
  activities: CulturalActivity[],
  dietaryRecords: DietaryNeedRecord[],
  staffCompetences: StaffCulturalCompetence[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CulturalIdentitySupportIntelligence {
  const identityResult = evaluateIdentityRecognition(assessments);
  const provisionResult = evaluateCulturalProvision(activities);
  const dietaryResult = evaluateDietaryRespect(dietaryRecords);
  const staffResult = evaluateStaffCompetence(staffCompetences);

  const overallScore =
    identityResult.overallScore +
    provisionResult.overallScore +
    dietaryResult.overallScore +
    staffResult.overallScore;

  const childProfiles = buildChildCulturalProfiles(
    assessments,
    activities,
    dietaryRecords,
  );

  const strengths = generateStrengths(
    identityResult,
    provisionResult,
    dietaryResult,
    staffResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    identityResult,
    provisionResult,
    dietaryResult,
    staffResult,
  );
  const actions = generateActions(
    identityResult,
    provisionResult,
    dietaryResult,
    staffResult,
  );

  const regulatoryLinks = [
    "CHR 2015 Reg 6 — quality of care standard including cultural identity needs",
    "Equality Act 2010 — protection from discrimination and promotion of equality",
    "SCCIF — experiences and progress of children including cultural identity",
    "UNCRC Article 8 — right to preservation of identity",
    "UNCRC Article 30 — right of minority children to enjoy their own culture, religion, and language",
    "NMS 7 — leisure activities supporting cultural identity and heritage",
    "Working Together 2023 — multi-agency safeguarding including cultural considerations",
    "CA 1989 s22(5)(c) — due consideration to religious, racial, cultural, and linguistic needs",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    identityRecognition: identityResult,
    culturalProvision: provisionResult,
    dietaryRespect: dietaryResult,
    staffCompetence: staffResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
