import { above, below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// AFTERCARE OUTCOMES TRACKING INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing outcomes for children who have left
// care. Covers keeping in touch, housing stability, education/employment
// continuation, wellbeing check-ins, and support access.
//
// Regulatory basis:
//   - Children Act 1989, s23C — Staying put: continuing accommodation
//   - Children & Social Work Act 2017 — Corporate parenting principles
//   - CHR 2015, Reg 13 — Contact: maintaining relationships post-care
//   - SCCIF — Overall experiences and progress of children
//   - Leaving Care Act 2000 — Pathway planning and personal adviser duty
//   - UNCRC Article 20 — Right to special protection when deprived of family
//   - Care Leavers' Covenant — Cross-sector support commitment
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type LeavingReason =
  | "aged_out"
  | "reunification"
  | "adoption"
  | "placement_move"
  | "independent_living"
  | "other";

export type HousingStatus =
  | "stable"
  | "temporary"
  | "homeless"
  | "supported_housing"
  | "returned_home"
  | "unknown";

export type EmploymentEducationStatus =
  | "employed"
  | "in_education"
  | "training"
  | "neet"
  | "volunteering"
  | "unknown";

export type WellbeingRating =
  | "thriving"
  | "stable"
  | "struggling"
  | "crisis"
  | "unknown";

export type ContactFrequency =
  | "weekly"
  | "fortnightly"
  | "monthly"
  | "quarterly"
  | "none";

export type ContactMethod =
  | "visit"
  | "phone"
  | "video"
  | "text"
  | "email";

export type ContactInitiatedBy =
  | "home"
  | "child"
  | "adviser";

export type ServiceType =
  | "housing"
  | "education"
  | "employment"
  | "mental_health"
  | "financial"
  | "social"
  | "legal";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface CareLeaverProfile {
  id: string;
  childId: string;
  childName: string;
  dateOfBirth: string;
  leavingDate: string;
  leavingReason: LeavingReason;
  currentAge: number;
  housingStatus: HousingStatus;
  employmentEducationStatus: EmploymentEducationStatus;
  hasPathwayPlan: boolean;
  pathwayPlanReviewDate: string | null;
  personalAdviserAssigned: boolean;
  personalAdviserName: string | null;
}

export interface AftercareContact {
  id: string;
  childId: string;
  childName: string;
  date: string;
  contactMethod: ContactMethod;
  initiatedBy: ContactInitiatedBy;
  purpose: string;
  wellbeingRating: WellbeingRating;
  concernsRaised: boolean;
  followUpRequired: boolean;
  followUpCompleted: boolean;
}

export interface OutcomeAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  housingStable: boolean;
  educationEmploymentEngaged: boolean;
  mentalHealthSupported: boolean;
  physicalHealthRegistered: boolean;
  financiallyCapable: boolean;
  socialNetworkPresent: boolean;
  overallWellbeing: WellbeingRating;
}

export interface SupportService {
  id: string;
  childId: string;
  childName: string;
  serviceType: ServiceType;
  referralDate: string;
  accessedService: boolean;
  serviceOngoing: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface KeepingInTouchResult {
  overallScore: number;
  totalContacts: number;
  contactFrequencyScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  regularContactRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childInitiatedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  concernsFollowedUpRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  wellbeingRecordedRate: number | null;
}

export interface HousingStabilityResult {
  overallScore: number;
  totalLeavers: number;
  /** null when the population is empty — nothing measured, not 0%. */
  stableHousingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  pathwayPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  personalAdviserRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  homelessnessRate: number | null;
}

export interface EducationEmploymentResult {
  overallScore: number;
  totalLeavers: number;
  /** null when the population is empty — nothing measured, not 0%. */
  engagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  neetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  educationContinuedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  trainingAccessRate: number | null;
}

export interface WellbeingSupportResult {
  overallScore: number;
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  assessmentsDoneRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  thrivingStableRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportServicesAccessedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  mentalHealthSupportedRate: number | null;
}

export interface CareLeaverProfileResult {
  childId: string;
  childName: string;
  housingStatus: HousingStatus;
  employmentEducationStatus: EmploymentEducationStatus;
  wellbeingRating: WellbeingRating;
  contactCount: number;
  overallScore: number;
}

export interface AftercareOutcomesTrackingIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  keepingInTouch: KeepingInTouchResult;
  housingStability: HousingStabilityResult;
  educationEmployment: EducationEmploymentResult;
  wellbeingSupport: WellbeingSupportResult;
  childProfiles: CareLeaverProfileResult[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Label Maps ---------------------------------------------------------------

const LEAVING_REASON_LABELS: Record<LeavingReason, string> = {
  aged_out: "Aged Out",
  reunification: "Reunification",
  adoption: "Adoption",
  placement_move: "Placement Move",
  independent_living: "Independent Living",
  other: "Other",
};

const HOUSING_STATUS_LABELS: Record<HousingStatus, string> = {
  stable: "Stable",
  temporary: "Temporary",
  homeless: "Homeless",
  supported_housing: "Supported Housing",
  returned_home: "Returned Home",
  unknown: "Unknown",
};

const EMPLOYMENT_EDUCATION_STATUS_LABELS: Record<EmploymentEducationStatus, string> = {
  employed: "Employed",
  in_education: "In Education",
  training: "Training",
  neet: "NEET",
  volunteering: "Volunteering",
  unknown: "Unknown",
};

const WELLBEING_RATING_LABELS: Record<WellbeingRating, string> = {
  thriving: "Thriving",
  stable: "Stable",
  struggling: "Struggling",
  crisis: "Crisis",
  unknown: "Unknown",
};

const CONTACT_FREQUENCY_LABELS: Record<ContactFrequency, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  none: "None",
};

const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  visit: "Visit",
  phone: "Phone",
  video: "Video",
  text: "Text",
  email: "Email",
};

const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  housing: "Housing",
  education: "Education",
  employment: "Employment",
  mental_health: "Mental Health",
  financial: "Financial",
  social: "Social",
  legal: "Legal",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getLeavingReasonLabel(v: LeavingReason): string { return LEAVING_REASON_LABELS[v]; }
export function getHousingStatusLabel(v: HousingStatus): string { return HOUSING_STATUS_LABELS[v]; }
export function getEmploymentEducationStatusLabel(v: EmploymentEducationStatus): string { return EMPLOYMENT_EDUCATION_STATUS_LABELS[v]; }
export function getWellbeingRatingLabel(v: WellbeingRating): string { return WELLBEING_RATING_LABELS[v]; }
export function getContactFrequencyLabel(v: ContactFrequency): string { return CONTACT_FREQUENCY_LABELS[v]; }
export function getContactMethodLabel(v: ContactMethod): string { return CONTACT_METHOD_LABELS[v]; }
export function getServiceTypeLabel(v: ServiceType): string { return SERVICE_TYPE_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates how well the home keeps in touch with care leavers.
 * Empty = 0 (no contacts documented = non-compliant).
 */
export function evaluateKeepingInTouch(
  contacts: AftercareContact[],
  leavers: CareLeaverProfile[],
): KeepingInTouchResult {
  if (contacts.length === 0) {
    return {
      overallScore: 0,
      totalContacts: 0,
      contactFrequencyScore: 0,
      regularContactRate: null,
      childInitiatedRate: null,
      concernsFollowedUpRate: null,
      wellbeingRecordedRate: null,
    };
  }

  // Contact frequency: how many leavers have at least monthly contact
  const leaverContactCounts = new Map<string, number>();
  for (const c of contacts) {
    leaverContactCounts.set(c.childId, (leaverContactCounts.get(c.childId) || 0) + 1);
  }
  // Regular = at least 2 contacts in the period (approximation for monthly+)
  const leaverCount = leavers.length > 0 ? leavers.length : leaverContactCounts.size;
  let regularContactCount = 0;
  for (const count of leaverContactCounts.values()) {
    if (count >= 2) regularContactCount++;
  }
  const regularContactRate = rate(regularContactCount, leaverCount);

  // Child initiated contacts
  const childInitiated = contacts.filter((c) => c.initiatedBy === "child").length;
  const childInitiatedRate = rate(childInitiated, contacts.length);

  // Concerns followed up
  const concernsRaised = contacts.filter((c) => c.concernsRaised && c.followUpRequired);
  const concernsFollowedUp = concernsRaised.filter((c) => c.followUpCompleted).length;
  const concernsFollowedUpRate = rate(concernsFollowedUp, concernsRaised.length);

  // Wellbeing recorded (not "unknown")
  const wellbeingRecorded = contacts.filter((c) => c.wellbeingRating !== "unknown").length;
  const wellbeingRecordedRate = rate(wellbeingRecorded, contacts.length);

  // Scoring: contact frequency (0-7), regular contact rate (0-6),
  // child-initiated (0-5), concerns followed up (0-4), wellbeing recorded (0-3)
  let score = 0;

  // Contact frequency score: based on average contacts per leaver
  const avgContactsPerLeaver = leaverCount > 0 ? contacts.length / leaverCount : 0;
  const contactFrequencyScore = Math.min(7, Math.round(avgContactsPerLeaver * 2));
  score += contactFrequencyScore;

  score += Math.round(((regularContactRate ?? 0) / 100) * 6);
  score += Math.round(((childInitiatedRate ?? 0) / 100) * 5);

  // Concerns followed up: if no concerns, partial credit
  if (concernsRaised.length === 0) {
    score += 2; // partial credit — no concerns is neutral
  } else {
    score += Math.round(((concernsFollowedUpRate ?? 0) / 100) * 4);
  }

  score += Math.round(((wellbeingRecordedRate ?? 0) / 100) * 3);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalContacts: contacts.length,
    contactFrequencyScore,
    regularContactRate,
    childInitiatedRate,
    concernsFollowedUpRate,
    wellbeingRecordedRate,
  };
}

/**
 * Evaluates housing stability for care leavers.
 * Empty = 0 (no leavers documented = non-compliant).
 */
export function evaluateHousingStability(
  leavers: CareLeaverProfile[],
): HousingStabilityResult {
  if (leavers.length === 0) {
    return {
      overallScore: 0,
      totalLeavers: 0,
      stableHousingRate: null,
      pathwayPlanRate: null,
      personalAdviserRate: null,
      homelessnessRate: null,
    };
  }

  const stableHousing = leavers.filter(
    (l) => l.housingStatus === "stable" || l.housingStatus === "returned_home" || l.housingStatus === "supported_housing",
  ).length;
  const stableHousingRate = rate(stableHousing, leavers.length);

  const pathwayPlan = leavers.filter((l) => l.hasPathwayPlan).length;
  const pathwayPlanRate = rate(pathwayPlan, leavers.length);

  const personalAdviser = leavers.filter((l) => l.personalAdviserAssigned).length;
  const personalAdviserRate = rate(personalAdviser, leavers.length);

  const homeless = leavers.filter((l) => l.housingStatus === "homeless").length;
  const homelessnessRate = rate(homeless, leavers.length);

  // Scoring: stable housing rate (0-8), pathway plan rate (0-6),
  // personal adviser assigned (0-5), homelessness rate penalty (0-6 bonus if none homeless)
  let score = 0;
  score += Math.round(((stableHousingRate ?? 0) / 100) * 8);
  score += Math.round(((pathwayPlanRate ?? 0) / 100) * 6);
  score += Math.round(((personalAdviserRate ?? 0) / 100) * 5);

  // unmeasured homelessness (no leavers tracked) earns no bonus — the old
  // pct fabricated 0% here and awarded the full +6
  if (homelessnessRate !== null) {
    if (homelessnessRate === 0) score += 6;
    else if (homelessnessRate <= 10) score += 3;
    else if (homelessnessRate <= 25) score += 1;
  }

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalLeavers: leavers.length,
    stableHousingRate,
    pathwayPlanRate,
    personalAdviserRate,
    homelessnessRate,
  };
}

/**
 * Evaluates education and employment engagement for care leavers.
 * Empty = 0 (no leavers documented = non-compliant).
 */
export function evaluateEducationEmployment(
  leavers: CareLeaverProfile[],
): EducationEmploymentResult {
  if (leavers.length === 0) {
    return {
      overallScore: 0,
      totalLeavers: 0,
      engagedRate: null,
      neetRate: null,
      educationContinuedRate: null,
      trainingAccessRate: null,
    };
  }

  // ETE = employed + in_education + training + volunteering
  const engaged = leavers.filter(
    (l) =>
      l.employmentEducationStatus === "employed" ||
      l.employmentEducationStatus === "in_education" ||
      l.employmentEducationStatus === "training" ||
      l.employmentEducationStatus === "volunteering",
  ).length;
  const engagedRate = rate(engaged, leavers.length);

  const neet = leavers.filter((l) => l.employmentEducationStatus === "neet").length;
  const neetRate = rate(neet, leavers.length);

  const educationContinued = leavers.filter((l) => l.employmentEducationStatus === "in_education").length;
  const educationContinuedRate = rate(educationContinued, leavers.length);

  const trainingAccess = leavers.filter((l) => l.employmentEducationStatus === "training").length;
  const trainingAccessRate = rate(trainingAccess, leavers.length);

  // Scoring: engaged rate (0-8), NEET rate penalty (0-6 bonus if low),
  // education continued (0-5), training access (0-6)
  let score = 0;
  score += Math.round(((engagedRate ?? 0) / 100) * 8);

  if (neetRate !== null) {
    if (neetRate === 0) score += 6;
    else if (neetRate <= 10) score += 4;
    else if (neetRate <= 25) score += 2;
  }

  score += Math.round(((educationContinuedRate ?? 0) / 100) * 5);
  score += Math.round(((trainingAccessRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalLeavers: leavers.length,
    engagedRate,
    neetRate,
    educationContinuedRate,
    trainingAccessRate,
  };
}

/**
 * Evaluates wellbeing and support service access for care leavers.
 * Empty = 0 (no assessments documented = non-compliant).
 */
export function evaluateWellbeingSupport(
  assessments: OutcomeAssessment[],
  services: SupportService[],
  leavers: CareLeaverProfile[],
): WellbeingSupportResult {
  if (assessments.length === 0 && services.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      assessmentsDoneRate: null,
      thrivingStableRate: null,
      supportServicesAccessedRate: null,
      mentalHealthSupportedRate: null,
    };
  }

  // Assessments done rate: proportion of leavers who have an assessment
  const assessedChildIds = new Set(assessments.map((a) => a.childId));
  const leaverCount = leavers.length > 0 ? leavers.length : assessedChildIds.size;
  const assessmentsDoneRate = rate(assessedChildIds.size, leaverCount);

  // Thriving/stable rate among assessments
  const thrivingStable = assessments.filter(
    (a) => a.overallWellbeing === "thriving" || a.overallWellbeing === "stable",
  ).length;
  const thrivingStableRate = rate(thrivingStable, assessments.length);

  // Support services accessed
  const accessedServices = services.filter((s) => s.accessedService).length;
  const supportServicesAccessedRate = rate(accessedServices, services.length);

  // Mental health supported
  const mentalHealthSupported = assessments.filter((a) => a.mentalHealthSupported).length;
  const mentalHealthSupportedRate = rate(mentalHealthSupported, assessments.length);

  // Scoring: outcome assessments done (0-7), thriving/stable rate (0-6),
  // support services accessed (0-6), mental health supported (0-6)
  let score = 0;
  score += Math.round(((assessmentsDoneRate ?? 0) / 100) * 7);
  score += Math.round(((thrivingStableRate ?? 0) / 100) * 6);
  score += Math.round(((supportServicesAccessedRate ?? 0) / 100) * 6);
  score += Math.round(((mentalHealthSupportedRate ?? 0) / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAssessments: assessments.length,
    assessmentsDoneRate,
    thrivingStableRate,
    supportServicesAccessedRate,
    mentalHealthSupportedRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildCareLeaverProfiles(
  leavers: CareLeaverProfile[],
  contacts: AftercareContact[],
  assessments: OutcomeAssessment[],
): CareLeaverProfileResult[] {
  return leavers.map((leaver) => {
    const childContacts = contacts.filter((c) => c.childId === leaver.childId);
    const childAssessments = assessments.filter((a) => a.childId === leaver.childId);

    // Determine most recent wellbeing rating
    let wellbeingRating: WellbeingRating = "unknown";
    if (childAssessments.length > 0) {
      // Sort by date descending, take the latest
      const sorted = [...childAssessments].sort(
        (a, b) => b.assessmentDate.localeCompare(a.assessmentDate),
      );
      wellbeingRating = sorted[0].overallWellbeing;
    } else if (childContacts.length > 0) {
      // Fall back to latest contact wellbeing rating
      const sorted = [...childContacts].sort(
        (a, b) => b.date.localeCompare(a.date),
      );
      wellbeingRating = sorted[0].wellbeingRating;
    }

    // Score 0-10
    let score = 0;

    // Housing (0-3)
    if (leaver.housingStatus === "stable" || leaver.housingStatus === "returned_home") score += 3;
    else if (leaver.housingStatus === "supported_housing") score += 2;
    else if (leaver.housingStatus === "temporary") score += 1;

    // Employment/Education (0-3)
    if (leaver.employmentEducationStatus === "employed" || leaver.employmentEducationStatus === "in_education") score += 3;
    else if (leaver.employmentEducationStatus === "training" || leaver.employmentEducationStatus === "volunteering") score += 2;

    // Wellbeing (0-2)
    if (wellbeingRating === "thriving") score += 2;
    else if (wellbeingRating === "stable") score += 1;

    // Contact frequency (0-2)
    if (childContacts.length >= 4) score += 2;
    else if (childContacts.length >= 2) score += 1;

    return {
      childId: leaver.childId,
      childName: leaver.childName,
      housingStatus: leaver.housingStatus,
      employmentEducationStatus: leaver.employmentEducationStatus,
      wellbeingRating,
      contactCount: childContacts.length,
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateAftercareOutcomesTrackingIntelligence(
  leavers: CareLeaverProfile[],
  contacts: AftercareContact[],
  assessments: OutcomeAssessment[],
  services: SupportService[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): AftercareOutcomesTrackingIntelligence {
  const keepingInTouch = evaluateKeepingInTouch(contacts, leavers);
  const housingStability = evaluateHousingStability(leavers);
  const educationEmployment = evaluateEducationEmployment(leavers);
  const wellbeingSupport = evaluateWellbeingSupport(assessments, services, leavers);

  const rawScore =
    keepingInTouch.overallScore +
    housingStability.overallScore +
    educationEmployment.overallScore +
    wellbeingSupport.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildCareLeaverProfiles(leavers, contacts, assessments);

  // -- Strengths --
  const strengths: string[] = [];
  if (contacts.length > 0 && meets(keepingInTouch.regularContactRate, 90))
    strengths.push("Regular contact maintained with " + keepingInTouch.regularContactRate + "% of care leavers");
  if (contacts.length > 0 && keepingInTouch.wellbeingRecordedRate === 100)
    strengths.push("Wellbeing recorded in all aftercare contacts");
  if (contacts.length > 0 && meets(keepingInTouch.childInitiatedRate, 30))
    strengths.push("Good engagement — " + keepingInTouch.childInitiatedRate + "% of contacts initiated by care leavers");
  if (leavers.length > 0 && meets(housingStability.stableHousingRate, 80))
    strengths.push("Strong housing stability — " + housingStability.stableHousingRate + "% in stable accommodation");
  if (leavers.length > 0 && housingStability.pathwayPlanRate === 100)
    strengths.push("Pathway plans in place for all care leavers");
  if (leavers.length > 0 && housingStability.personalAdviserRate === 100)
    strengths.push("Personal adviser assigned to all care leavers");
  if (leavers.length > 0 && meets(educationEmployment.engagedRate, 80))
    strengths.push("High ETE engagement — " + educationEmployment.engagedRate + "% in education, employment, or training");
  if (leavers.length > 0 && educationEmployment.neetRate === 0)
    strengths.push("No care leavers classified as NEET");
  if (assessments.length > 0 && meets(wellbeingSupport.thrivingStableRate, 80))
    strengths.push("Positive wellbeing outcomes — " + wellbeingSupport.thrivingStableRate + "% thriving or stable");
  if (services.length > 0 && meets(wellbeingSupport.supportServicesAccessedRate, 80))
    strengths.push("Good support service access — " + wellbeingSupport.supportServicesAccessedRate + "% of referrals accessed");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (leavers.length === 0)
    areasForImprovement.push("No care leaver profiles documented — all leavers should have records maintained");
  if (contacts.length === 0 && leavers.length > 0)
    areasForImprovement.push("No aftercare contacts recorded — statutory duty to keep in touch");
  if (leavers.length > 0 && below(housingStability.pathwayPlanRate, 100))
    areasForImprovement.push("Pathway plans missing for " + (100 - (housingStability.pathwayPlanRate ?? 0)) + "% of care leavers");
  if (leavers.length > 0 && below(housingStability.personalAdviserRate, 100))
    areasForImprovement.push("Personal adviser not assigned for " + (100 - (housingStability.personalAdviserRate ?? 0)) + "% of care leavers");
  if (leavers.length > 0 && above(educationEmployment.neetRate, 20))
    areasForImprovement.push("High NEET rate at " + educationEmployment.neetRate + "% — targeted support required");
  if (contacts.length > 0 && below(keepingInTouch.concernsFollowedUpRate, 80) && contacts.some((c) => c.concernsRaised && c.followUpRequired))
    areasForImprovement.push("Concerns follow-up rate at " + keepingInTouch.concernsFollowedUpRate + "% — all concerns must be addressed");
  if (assessments.length === 0 && leavers.length > 0)
    areasForImprovement.push("No outcome assessments completed — schedule assessments for all care leavers");
  if (assessments.length > 0 && below(wellbeingSupport.thrivingStableRate, 50))
    areasForImprovement.push("Wellbeing concerns — only " + wellbeingSupport.thrivingStableRate + "% of care leavers thriving or stable");

  // -- Actions --
  const actions: string[] = [];
  const homeless = leavers.filter((l) => l.housingStatus === "homeless");
  if (homeless.length > 0)
    actions.push("URGENT: " + homeless.length + " care leaver(s) recorded as homeless — immediate housing support required");
  const crisis = assessments.filter((a) => a.overallWellbeing === "crisis");
  if (crisis.length > 0)
    actions.push("URGENT: " + crisis.length + " care leaver(s) in crisis — immediate safeguarding and support review required");
  const noAdviser = leavers.filter((l) => !l.personalAdviserAssigned);
  if (noAdviser.length > 0)
    actions.push("URGENT: " + noAdviser.length + " care leaver(s) without a personal adviser — statutory requirement under Leaving Care Act 2000");
  const neetLeavers = leavers.filter((l) => l.employmentEducationStatus === "neet");
  if (neetLeavers.length > 0)
    actions.push("Develop ETE engagement plans for " + neetLeavers.length + " NEET care leaver(s)");
  const noPathwayPlan = leavers.filter((l) => !l.hasPathwayPlan);
  if (noPathwayPlan.length > 0)
    actions.push("URGENT: Create pathway plans for " + noPathwayPlan.length + " care leaver(s) — statutory requirement");
  if (contacts.length === 0 && leavers.length > 0)
    actions.push("Establish regular contact schedule for all care leavers");
  if (assessments.length === 0 && leavers.length > 0)
    actions.push("Schedule outcome assessments for all care leavers");
  const unfollowedConcerns = contacts.filter((c) => c.concernsRaised && c.followUpRequired && !c.followUpCompleted);
  if (unfollowedConcerns.length > 0)
    actions.push("Complete follow-up for " + unfollowedConcerns.length + " outstanding concern(s) from aftercare contacts");

  const regulatoryLinks: string[] = [
    "Children Act 1989, s23C — Continuing functions: duty to keep in touch with care leavers",
    "Children & Social Work Act 2017 — Corporate parenting principles for care leavers",
    "CHR 2015, Reg 13 — Contact: maintaining relationships with children who have left",
    "SCCIF — Overall experiences and progress: outcomes for care leavers",
    "Leaving Care Act 2000 — Pathway planning, personal advisers, and support duties",
    "UNCRC Article 20 — Right to special protection for children deprived of family environment",
    "Care Leavers' Covenant — Cross-sector commitment to support care leavers",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    keepingInTouch,
    housingStability,
    educationEmployment,
    wellbeingSupport,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
