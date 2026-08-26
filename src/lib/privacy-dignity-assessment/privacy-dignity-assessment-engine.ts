import { above, below, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Privacy & Dignity Assessment Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well children's privacy and dignity is maintained across:
//   1. Personal Privacy Practices (bedroom, bathroom, belongings)
//   2. Communication Privacy (phone, mail, digital)
//   3. Confidentiality Compliance (records, information sharing)
//   4. Staff Awareness & Training
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, NMS 3,
//             UNCRC Article 16, Human Rights Act 1998 Article 8,
//             Data Protection Act 2018
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type PrivacyDomain =
  | "bedroom"
  | "bathroom"
  | "communication"
  | "personal_belongings"
  | "personal_information"
  | "bodily_autonomy"
  | "digital_privacy"
  | "mail_correspondence";

export type ComplianceStatus =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant";

export type AuditOutcome =
  | "passed"
  | "minor_findings"
  | "major_findings"
  | "failed";

export type ChildFeedbackRating =
  | "very_positive"
  | "positive"
  | "neutral"
  | "negative"
  | "very_negative";

export type IncidentType =
  | "unauthorised_room_entry"
  | "belongings_searched_without_consent"
  | "communication_intercepted"
  | "information_disclosed"
  | "bodily_autonomy_breach"
  | "digital_privacy_breach"
  | "mail_opened"
  | "other";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const privacyDomainLabels: Record<PrivacyDomain, string> = {
  bedroom: "Bedroom Privacy",
  bathroom: "Bathroom Privacy",
  communication: "Communication Privacy",
  personal_belongings: "Personal Belongings",
  personal_information: "Personal Information",
  bodily_autonomy: "Bodily Autonomy",
  digital_privacy: "Digital Privacy",
  mail_correspondence: "Mail & Correspondence",
};

const complianceStatusLabels: Record<ComplianceStatus, string> = {
  fully_compliant: "Fully Compliant",
  mostly_compliant: "Mostly Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
};

const auditOutcomeLabels: Record<AuditOutcome, string> = {
  passed: "Passed",
  minor_findings: "Minor Findings",
  major_findings: "Major Findings",
  failed: "Failed",
};

const childFeedbackRatingLabels: Record<ChildFeedbackRating, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
  very_negative: "Very Negative",
};

const incidentTypeLabels: Record<IncidentType, string> = {
  unauthorised_room_entry: "Unauthorised Room Entry",
  belongings_searched_without_consent: "Belongings Searched Without Consent",
  communication_intercepted: "Communication Intercepted",
  information_disclosed: "Information Disclosed",
  bodily_autonomy_breach: "Bodily Autonomy Breach",
  digital_privacy_breach: "Digital Privacy Breach",
  mail_opened: "Mail Opened",
  other: "Other",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getPrivacyDomainLabel(d: PrivacyDomain): string {
  return privacyDomainLabels[d] ?? d;
}
export function getComplianceStatusLabel(s: ComplianceStatus): string {
  return complianceStatusLabels[s] ?? s;
}
export function getAuditOutcomeLabel(o: AuditOutcome): string {
  return auditOutcomeLabels[o] ?? o;
}
export function getChildFeedbackRatingLabel(r: ChildFeedbackRating): string {
  return childFeedbackRatingLabels[r] ?? r;
}
export function getIncidentTypeLabel(t: IncidentType): string {
  return incidentTypeLabels[t] ?? t;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface PrivacyAudit {
  id: string;
  auditDate: string;
  auditedBy: string;
  domain: PrivacyDomain;
  complianceStatus: ComplianceStatus;
  auditOutcome: AuditOutcome;
  knockingPolicyObserved: boolean;
  lockableStorageProvided: boolean;
  personalSpaceRespected: boolean;
  findingsNotes: string;
}

export interface ChildPrivacyFeedback {
  id: string;
  childId: string;
  childName: string;
  feedbackDate: string;
  domain: PrivacyDomain;
  rating: ChildFeedbackRating;
  feelsPrivacyRespected: boolean;
  feelsBedroomIsOwn: boolean;
  canMakePrivateCalls: boolean;
  belongingsSafe: boolean;
  comments: string;
}

export interface PrivacyIncident {
  id: string;
  childId: string;
  childName: string;
  date: string;
  incidentType: IncidentType;
  description: string;
  reportedBy: string;
  investigationCompleted: boolean;
  actionTaken: boolean;
  childInformed: boolean;
  preventiveMeasuresImplemented: boolean;
}

export interface StaffPrivacyTraining {
  id: string;
  staffId: string;
  staffName: string;
  privacyRightsAwareness: boolean;
  knockingPolicyTrained: boolean;
  confidentialityTrained: boolean;
  dataProtectionTrained: boolean;
  bodyAutonomyTrained: boolean;
  digitalPrivacyTrained: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface PersonalPrivacyResult {
  overallScore: number;
  totalAudits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  fullyCompliantRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  knockingObservedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  lockableStorageRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  personalSpaceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  passedRate: number | null;
}

export interface CommunicationPrivacyResult {
  overallScore: number;
  totalFeedback: number;
  /** null when the population is empty — nothing measured, not 0%. */
  feelsPrivacyRespectedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  canMakePrivateCallsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  belongingsSafeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feelsBedroomIsOwnRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveRatingRate: number | null;
}

export interface ConfidentialityComplianceResult {
  overallScore: number;
  totalIncidents: number;
  /** null when the population is empty — nothing measured, not 0%. */
  investigationCompletedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionTakenRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childInformedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  preventiveMeasuresRate: number | null;
}

export interface StaffPrivacyReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  privacyRightsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  knockingPolicyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  confidentialityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dataProtectionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  bodyAutonomyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  digitalPrivacyRate: number | null;
}

export interface ChildPrivacyProfile {
  childId: string;
  childName: string;
  feedbackCount: number;
  /** null when this child has no measurable population for it. */
  positiveRate: number | null;
  feelsRespected: boolean;
  incidentCount: number;
  overallScore: number;
}

export interface PrivacyDignityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  personalPrivacy: PersonalPrivacyResult;
  communicationPrivacy: CommunicationPrivacyResult;
  confidentialityCompliance: ConfidentialityComplianceResult;
  staffPrivacyReadiness: StaffPrivacyReadinessResult;
  childProfiles: ChildPrivacyProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers -------------------------------------------------------------------

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Evaluators ----------------------------------------------------------------

/**
 * Evaluates personal privacy practices through audit results.
 * Empty = 0 (no audits = no evidence of compliance).
 *
 *   Fully compliant rate         → 0-7
 *   Knocking policy observed     → 0-6
 *   Lockable storage provided    → 0-5
 *   Personal space respected     → 0-4
 *   Audit passed rate            → 0-3
 */
export function evaluatePersonalPrivacy(
  audits: PrivacyAudit[],
): PersonalPrivacyResult {
  if (audits.length === 0) {
    return {
      overallScore: 0,
      totalAudits: 0,
      fullyCompliantRate: null,
      knockingObservedRate: null,
      lockableStorageRate: null,
      personalSpaceRate: null,
      passedRate: null,
    };
  }

  let score = 0;

  const fullyCompliant = audits.filter(
    (a) => a.complianceStatus === "fully_compliant",
  ).length;
  const fullyCompliantRate = rate(fullyCompliant, audits.length);
  if (meets(fullyCompliantRate, 90)) score += 7;
  else if (meets(fullyCompliantRate, 70)) score += 5;
  else if (meets(fullyCompliantRate, 50)) score += 3;
  else if (above(fullyCompliantRate, 0)) score += 1;

  const knockingObserved = audits.filter(
    (a) => a.knockingPolicyObserved,
  ).length;
  const knockingObservedRate = rate(knockingObserved, audits.length);
  if (meets(knockingObservedRate, 90)) score += 6;
  else if (meets(knockingObservedRate, 70)) score += 4;
  else if (meets(knockingObservedRate, 50)) score += 3;
  else if (above(knockingObservedRate, 0)) score += 1;

  const lockableStorage = audits.filter(
    (a) => a.lockableStorageProvided,
  ).length;
  const lockableStorageRate = rate(lockableStorage, audits.length);
  if (meets(lockableStorageRate, 90)) score += 5;
  else if (meets(lockableStorageRate, 70)) score += 3;
  else if (meets(lockableStorageRate, 50)) score += 2;
  else if (above(lockableStorageRate, 0)) score += 1;

  const personalSpace = audits.filter(
    (a) => a.personalSpaceRespected,
  ).length;
  const personalSpaceRate = rate(personalSpace, audits.length);
  if (meets(personalSpaceRate, 90)) score += 4;
  else if (meets(personalSpaceRate, 70)) score += 3;
  else if (meets(personalSpaceRate, 50)) score += 2;
  else if (above(personalSpaceRate, 0)) score += 1;

  const passed = audits.filter(
    (a) => a.auditOutcome === "passed",
  ).length;
  const passedRate = rate(passed, audits.length);
  if (meets(passedRate, 90)) score += 3;
  else if (meets(passedRate, 70)) score += 2;
  else if (meets(passedRate, 50)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalAudits: audits.length,
    fullyCompliantRate,
    knockingObservedRate,
    lockableStorageRate,
    personalSpaceRate,
    passedRate,
  };
}

/**
 * Evaluates communication privacy through child feedback.
 * Empty = 0 (no feedback = no evidence children feel respected).
 *
 *   Feels privacy respected      → 0-7
 *   Can make private calls       → 0-6
 *   Belongings safe              → 0-5
 *   Feels bedroom is own         → 0-4
 *   Positive rating rate         → 0-3
 */
export function evaluateCommunicationPrivacy(
  feedback: ChildPrivacyFeedback[],
): CommunicationPrivacyResult {
  if (feedback.length === 0) {
    return {
      overallScore: 0,
      totalFeedback: 0,
      feelsPrivacyRespectedRate: null,
      canMakePrivateCallsRate: null,
      belongingsSafeRate: null,
      feelsBedroomIsOwnRate: null,
      positiveRatingRate: null,
    };
  }

  let score = 0;

  const respected = feedback.filter((f) => f.feelsPrivacyRespected).length;
  const feelsPrivacyRespectedRate = rate(respected, feedback.length);
  if (meets(feelsPrivacyRespectedRate, 90)) score += 7;
  else if (meets(feelsPrivacyRespectedRate, 70)) score += 5;
  else if (meets(feelsPrivacyRespectedRate, 50)) score += 3;
  else if (above(feelsPrivacyRespectedRate, 0)) score += 1;

  const privateCalls = feedback.filter((f) => f.canMakePrivateCalls).length;
  const canMakePrivateCallsRate = rate(privateCalls, feedback.length);
  if (meets(canMakePrivateCallsRate, 90)) score += 6;
  else if (meets(canMakePrivateCallsRate, 70)) score += 4;
  else if (meets(canMakePrivateCallsRate, 50)) score += 3;
  else if (above(canMakePrivateCallsRate, 0)) score += 1;

  const belongings = feedback.filter((f) => f.belongingsSafe).length;
  const belongingsSafeRate = rate(belongings, feedback.length);
  if (meets(belongingsSafeRate, 90)) score += 5;
  else if (meets(belongingsSafeRate, 70)) score += 3;
  else if (meets(belongingsSafeRate, 50)) score += 2;
  else if (above(belongingsSafeRate, 0)) score += 1;

  const bedroom = feedback.filter((f) => f.feelsBedroomIsOwn).length;
  const feelsBedroomIsOwnRate = rate(bedroom, feedback.length);
  if (meets(feelsBedroomIsOwnRate, 90)) score += 4;
  else if (meets(feelsBedroomIsOwnRate, 70)) score += 3;
  else if (meets(feelsBedroomIsOwnRate, 50)) score += 2;
  else if (above(feelsBedroomIsOwnRate, 0)) score += 1;

  const positive = feedback.filter(
    (f) => f.rating === "very_positive" || f.rating === "positive",
  ).length;
  const positiveRatingRate = rate(positive, feedback.length);
  if (meets(positiveRatingRate, 90)) score += 3;
  else if (meets(positiveRatingRate, 70)) score += 2;
  else if (meets(positiveRatingRate, 50)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalFeedback: feedback.length,
    feelsPrivacyRespectedRate,
    canMakePrivateCallsRate,
    belongingsSafeRate,
    feelsBedroomIsOwnRate,
    positiveRatingRate,
  };
}

/**
 * Evaluates confidentiality compliance through incident management.
 * Empty (no incidents) = 25 (no privacy breaches = excellent).
 *
 *   Investigation completed      → 0-8
 *   Action taken                 → 0-7
 *   Child informed               → 0-5
 *   Preventive measures          → 0-5
 */
export function evaluateConfidentialityCompliance(
  incidents: PrivacyIncident[],
): ConfidentialityComplianceResult {
  if (incidents.length === 0) {
    return {
      overallScore: 25,
      totalIncidents: 0,
      investigationCompletedRate: null,
      actionTakenRate: null,
      childInformedRate: null,
      preventiveMeasuresRate: null,
    };
  }

  let score = 0;

  const investigated = incidents.filter(
    (i) => i.investigationCompleted,
  ).length;
  const investigationCompletedRate = rate(investigated, incidents.length);
  if (meets(investigationCompletedRate, 90)) score += 8;
  else if (meets(investigationCompletedRate, 70)) score += 6;
  else if (meets(investigationCompletedRate, 50)) score += 4;
  else if (above(investigationCompletedRate, 0)) score += 2;

  const actioned = incidents.filter((i) => i.actionTaken).length;
  const actionTakenRate = rate(actioned, incidents.length);
  if (meets(actionTakenRate, 90)) score += 7;
  else if (meets(actionTakenRate, 70)) score += 5;
  else if (meets(actionTakenRate, 50)) score += 3;
  else if (above(actionTakenRate, 0)) score += 1;

  const informed = incidents.filter((i) => i.childInformed).length;
  const childInformedRate = rate(informed, incidents.length);
  if (meets(childInformedRate, 90)) score += 5;
  else if (meets(childInformedRate, 70)) score += 3;
  else if (meets(childInformedRate, 50)) score += 2;
  else if (above(childInformedRate, 0)) score += 1;

  const preventive = incidents.filter(
    (i) => i.preventiveMeasuresImplemented,
  ).length;
  const preventiveMeasuresRate = rate(preventive, incidents.length);
  if (meets(preventiveMeasuresRate, 90)) score += 5;
  else if (meets(preventiveMeasuresRate, 70)) score += 3;
  else if (meets(preventiveMeasuresRate, 50)) score += 2;
  else if (above(preventiveMeasuresRate, 0)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalIncidents: incidents.length,
    investigationCompletedRate,
    actionTakenRate,
    childInformedRate,
    preventiveMeasuresRate,
  };
}

/**
 * Evaluates staff readiness in privacy and dignity practices.
 * Empty = 0 (no staff training = no evidence of competence).
 *
 *   Privacy rights awareness     → 0-6
 *   Knocking policy trained      → 0-5
 *   Confidentiality trained      → 0-5
 *   Data protection trained      → 0-4
 *   Body autonomy trained        → 0-3
 *   Digital privacy trained      → 0-2
 */
export function evaluateStaffPrivacyReadiness(
  training: StaffPrivacyTraining[],
): StaffPrivacyReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      privacyRightsRate: null,
      knockingPolicyRate: null,
      confidentialityRate: null,
      dataProtectionRate: null,
      bodyAutonomyRate: null,
      digitalPrivacyRate: null,
    };
  }

  let score = 0;

  const privacyRights = training.filter(
    (t) => t.privacyRightsAwareness,
  ).length;
  const privacyRightsRate = rate(privacyRights, training.length);
  if (meets(privacyRightsRate, 90)) score += 6;
  else if (meets(privacyRightsRate, 70)) score += 4;
  else if (meets(privacyRightsRate, 50)) score += 3;
  else if (above(privacyRightsRate, 0)) score += 1;

  const knockingPolicy = training.filter(
    (t) => t.knockingPolicyTrained,
  ).length;
  const knockingPolicyRate = rate(knockingPolicy, training.length);
  if (meets(knockingPolicyRate, 90)) score += 5;
  else if (meets(knockingPolicyRate, 70)) score += 3;
  else if (meets(knockingPolicyRate, 50)) score += 2;
  else if (above(knockingPolicyRate, 0)) score += 1;

  const confidentiality = training.filter(
    (t) => t.confidentialityTrained,
  ).length;
  const confidentialityRate = rate(confidentiality, training.length);
  if (meets(confidentialityRate, 90)) score += 5;
  else if (meets(confidentialityRate, 70)) score += 3;
  else if (meets(confidentialityRate, 50)) score += 2;
  else if (above(confidentialityRate, 0)) score += 1;

  const dataProtection = training.filter(
    (t) => t.dataProtectionTrained,
  ).length;
  const dataProtectionRate = rate(dataProtection, training.length);
  if (meets(dataProtectionRate, 90)) score += 4;
  else if (meets(dataProtectionRate, 70)) score += 3;
  else if (meets(dataProtectionRate, 50)) score += 2;
  else if (above(dataProtectionRate, 0)) score += 1;

  const bodyAutonomy = training.filter(
    (t) => t.bodyAutonomyTrained,
  ).length;
  const bodyAutonomyRate = rate(bodyAutonomy, training.length);
  if (meets(bodyAutonomyRate, 90)) score += 3;
  else if (meets(bodyAutonomyRate, 70)) score += 2;
  else if (meets(bodyAutonomyRate, 50)) score += 1;

  const digitalPrivacy = training.filter(
    (t) => t.digitalPrivacyTrained,
  ).length;
  const digitalPrivacyRate = rate(digitalPrivacy, training.length);
  if (meets(digitalPrivacyRate, 90)) score += 2;
  else if (meets(digitalPrivacyRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    privacyRightsRate,
    knockingPolicyRate,
    confidentialityRate,
    dataProtectionRate,
    bodyAutonomyRate,
    digitalPrivacyRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildPrivacyProfiles(
  feedback: ChildPrivacyFeedback[],
  incidents: PrivacyIncident[],
): ChildPrivacyProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const f of feedback) {
    childIds.add(f.childId);
    childNames.set(f.childId, f.childName);
  }
  for (const i of incidents) {
    childIds.add(i.childId);
    childNames.set(i.childId, i.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childFeedback = feedback.filter((f) => f.childId === childId);
    const childIncidents = incidents.filter((i) => i.childId === childId);
    const childName = childNames.get(childId) ?? childId;

    const feedbackCount = childFeedback.length;
    const positive = childFeedback.filter(
      (f) => f.rating === "very_positive" || f.rating === "positive",
    ).length;
    const positiveRate = rate(positive, feedbackCount);
    const feelsRespected =
      feedbackCount > 0 &&
      childFeedback.every((f) => f.feelsPrivacyRespected);
    const incidentCount = childIncidents.length;

    // Score 0-10
    let score = 0;

    // Positive feedback (0-4)
    if (feedbackCount === 0) {
      score += 0;
    } else if (meets(positiveRate, 90)) {
      score += 4;
    } else if (meets(positiveRate, 70)) {
      score += 3;
    } else if (meets(positiveRate, 50)) {
      score += 2;
    } else {
      score += 1;
    }

    // Feels respected (0-3)
    if (feelsRespected) score += 3;
    else if (feedbackCount > 0) score += 1;

    // Incident penalty (0-3 bonus if none)
    if (incidentCount === 0) {
      score += 3;
    } else if (incidentCount === 1) {
      score += 1;
    }

    return {
      childId,
      childName,
      feedbackCount,
      positiveRate,
      feelsRespected,
      incidentCount,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generatePrivacyDignityIntelligence(
  audits: PrivacyAudit[],
  feedback: ChildPrivacyFeedback[],
  incidents: PrivacyIncident[],
  training: StaffPrivacyTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PrivacyDignityIntelligence {
  const personalPrivacy = evaluatePersonalPrivacy(audits);
  const communicationPrivacy = evaluateCommunicationPrivacy(feedback);
  const confidentialityCompliance =
    evaluateConfidentialityCompliance(incidents);
  const staffPrivacyReadiness = evaluateStaffPrivacyReadiness(training);

  const rawScore =
    personalPrivacy.overallScore +
    communicationPrivacy.overallScore +
    confidentialityCompliance.overallScore +
    staffPrivacyReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildPrivacyProfiles(feedback, incidents);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(personalPrivacy.fullyCompliantRate, 80)) {
    strengths.push(
      "Strong privacy audit compliance — over 80% of audits fully compliant",
    );
  }
  if (meets(personalPrivacy.knockingObservedRate, 90)) {
    strengths.push(
      "Excellent knocking policy adherence observed across the home",
    );
  }
  if (meets(communicationPrivacy.feelsPrivacyRespectedRate, 80)) {
    strengths.push(
      "Children consistently report feeling their privacy is respected",
    );
  }
  if (meets(communicationPrivacy.canMakePrivateCallsRate, 80)) {
    strengths.push(
      "Children have good access to private communication facilities",
    );
  }
  if (confidentialityCompliance.totalIncidents === 0) {
    strengths.push(
      "No privacy incidents recorded during the assessment period",
    );
  }
  if (
    meets(staffPrivacyReadiness.privacyRightsRate, 90) &&
    meets(staffPrivacyReadiness.confidentialityRate, 90)
  ) {
    strengths.push(
      "Staff demonstrate strong privacy rights awareness and confidentiality training",
    );
  }
  if (meets(communicationPrivacy.positiveRatingRate, 80)) {
    strengths.push(
      "High proportion of positive privacy feedback from children",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(personalPrivacy.fullyCompliantRate, 60) && audits.length > 0) {
    areasForImprovement.push(
      "Privacy audit compliance below 60% — review privacy practices across all domains",
    );
  }
  if (below(personalPrivacy.lockableStorageRate, 70) && audits.length > 0) {
    areasForImprovement.push(
      "Lockable storage provision needs improvement — ensure all children have secure personal storage",
    );
  }
  if (
    below(communicationPrivacy.canMakePrivateCallsRate, 70) &&
    feedback.length > 0
  ) {
    areasForImprovement.push(
      "Children report limited access to private phone calls — review communication arrangements",
    );
  }
  if (
    below(communicationPrivacy.feelsBedroomIsOwnRate, 70) &&
    feedback.length > 0
  ) {
    areasForImprovement.push(
      "Some children do not feel their bedroom is truly their own space",
    );
  }
  if (
    confidentialityCompliance.totalIncidents > 0 &&
    below(confidentialityCompliance.preventiveMeasuresRate, 70)
  ) {
    areasForImprovement.push(
      "Preventive measures not consistently implemented after privacy incidents",
    );
  }
  if (below(staffPrivacyReadiness.digitalPrivacyRate, 60) && training.length > 0) {
    areasForImprovement.push(
      "Digital privacy training coverage is insufficient across staff team",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (audits.length === 0) {
    actions.push(
      "URGENT: No privacy audits conducted — implement regular privacy and dignity audits immediately",
    );
  }
  if (feedback.length === 0) {
    actions.push(
      "URGENT: No children's privacy feedback collected — establish routine privacy feedback mechanism",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff privacy training records — deliver privacy and dignity training to all staff",
    );
  }
  if (
    confidentialityCompliance.totalIncidents > 0 &&
    below(confidentialityCompliance.investigationCompletedRate, 50)
  ) {
    actions.push(
      "URGENT: Over half of privacy incidents lack completed investigations",
    );
  }
  if (below(personalPrivacy.knockingObservedRate, 50) && audits.length > 0) {
    actions.push(
      "Reinforce knocking policy through team meeting and supervision",
    );
  }
  if (below(staffPrivacyReadiness.bodyAutonomyRate, 70) && training.length > 0) {
    actions.push(
      "Schedule body autonomy training for staff not yet completed",
    );
  }
  if (
    below(communicationPrivacy.belongingsSafeRate, 70) &&
    feedback.length > 0
  ) {
    actions.push(
      "Review personal belongings security arrangements for all children",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and well-being standard (privacy and dignity)",
    "CHR 2015 Reg 12 — The protection of children standard",
    "SCCIF — Social Care Common Inspection Framework (respect and dignity)",
    "NMS 3 — National Minimum Standards (privacy and confidentiality)",
    "UNCRC Article 16 — Right to privacy",
    "Human Rights Act 1998 Article 8 — Right to respect for private and family life",
    "Data Protection Act 2018 — Processing of personal data",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    personalPrivacy,
    communicationPrivacy,
    confidentialityCompliance,
    staffPrivacyReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
