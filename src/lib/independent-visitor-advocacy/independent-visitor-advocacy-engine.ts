import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ==============================================================================
// Independent Visitor & Advocacy Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls, no randomness.
// Evaluates how well the home supports children's access to independent
// visitors and advocacy services:
//   1. Independent Visitor Activity (visits, consistency, child relationship)
//   2. Advocacy Access (referrals, representation, child satisfaction)
//   3. Policy & Governance (information provision, rights awareness, referral)
//   4. Staff Readiness (training, knowledge of advocacy rights, signposting)
//
// Regulatory: CHR 2015 Reg 10, CHR 2015 Reg 12, SCCIF, Children Act 1989
//             s24, Advocacy Services Regulations 2004, NMS 15, UNCRC Art 12
// ==============================================================================

// -- Type unions ---------------------------------------------------------------

export type VisitorStatus =
  | "active"
  | "pending_match"
  | "not_requested"
  | "declined_by_child"
  | "ended";

export type VisitOutcome =
  | "very_positive"
  | "positive"
  | "neutral"
  | "difficult"
  | "did_not_happen";

export type AdvocacyType =
  | "formal_advocate"
  | "independent_visitor"
  | "childrens_rights_officer"
  | "complaints_advocacy"
  | "legal_advocacy"
  | "peer_advocacy"
  | "other";

export type ReferralOutcome =
  | "successful"
  | "in_progress"
  | "declined_by_child"
  | "no_service_available"
  | "not_needed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Label maps ----------------------------------------------------------------

const visitorStatusLabels: Record<VisitorStatus, string> = {
  active: "Active",
  pending_match: "Pending Match",
  not_requested: "Not Requested",
  declined_by_child: "Declined by Child",
  ended: "Ended",
};

const visitOutcomeLabels: Record<VisitOutcome, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  difficult: "Difficult",
  did_not_happen: "Did Not Happen",
};

const advocacyTypeLabels: Record<AdvocacyType, string> = {
  formal_advocate: "Formal Advocate",
  independent_visitor: "Independent Visitor",
  childrens_rights_officer: "Children's Rights Officer",
  complaints_advocacy: "Complaints Advocacy",
  legal_advocacy: "Legal Advocacy",
  peer_advocacy: "Peer Advocacy",
  other: "Other",
};

const referralOutcomeLabels: Record<ReferralOutcome, string> = {
  successful: "Successful",
  in_progress: "In Progress",
  declined_by_child: "Declined by Child",
  no_service_available: "No Service Available",
  not_needed: "Not Needed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

// -- Label getters -------------------------------------------------------------

export function getVisitorStatusLabel(s: VisitorStatus): string {
  return visitorStatusLabels[s] ?? s;
}
export function getVisitOutcomeLabel(o: VisitOutcome): string {
  return visitOutcomeLabels[o] ?? o;
}
export function getAdvocacyTypeLabel(t: AdvocacyType): string {
  return advocacyTypeLabels[t] ?? t;
}
export function getReferralOutcomeLabel(o: ReferralOutcome): string {
  return referralOutcomeLabels[o] ?? o;
}
export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// -- Input interfaces ----------------------------------------------------------

export interface IndependentVisit {
  id: string;
  childId: string;
  childName: string;
  visitDate: string;
  visitorName: string;
  visitOutcome: VisitOutcome;
  durationMinutes: number;
  childEngaged: boolean;
  childSatisfied: boolean;
  recordedInCasefile: boolean;
  privateTimeProvided: boolean;
}

export interface AdvocacyReferral {
  id: string;
  childId: string;
  childName: string;
  referralDate: string;
  advocacyType: AdvocacyType;
  referralOutcome: ReferralOutcome;
  childInformedOfRights: boolean;
  childConsentObtained: boolean;
  timelyResponse: boolean;
  childSatisfied: boolean;
}

export interface AdvocacyPolicy {
  id: string;
  advocacyInformationDisplayed: boolean;
  childrenInformedOnAdmission: boolean;
  independentVisitorPromoted: boolean;
  complaintsAdvocacyAvailable: boolean;
  rightsLeafletProvided: boolean;
  regularRightsReminders: boolean;
  advocacyContactDetailsAccessible: boolean;
}

export interface StaffAdvocacyTraining {
  id: string;
  staffId: string;
  staffName: string;
  advocacyRights: boolean;
  independentVisitorRole: boolean;
  complaintsProcess: boolean;
  signposting: boolean;
  childParticipation: boolean;
  confidentiality: boolean;
}

// -- Result interfaces ---------------------------------------------------------

export interface VisitorActivityResult {
  overallScore: number;
  totalVisits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveOutcomeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childEngagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childSatisfactionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  privateTimeRate: number | null;
}

export interface AdvocacyAccessResult {
  overallScore: number;
  totalReferrals: number;
  /** null when the population is empty — nothing measured, not 0%. */
  successfulRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  informedOfRightsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  consentObtainedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyResponseRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childSatisfactionRate: number | null;
}

export interface PolicyGovernanceResult {
  overallScore: number;
  informationDisplayed: boolean;
  informedOnAdmission: boolean;
  visitorPromoted: boolean;
  complaintsAvailable: boolean;
  leafletProvided: boolean;
  regularReminders: boolean;
  contactAccessible: boolean;
}

export interface StaffAdvocacyReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  advocacyRightsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  independentVisitorRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  complaintsProcessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  signpostingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childParticipationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  confidentialityRate: number | null;
}

export interface ChildAdvocacyProfile {
  childId: string;
  childName: string;
  totalVisits: number;
  totalReferrals: number;
  /** null when this child has no measurable population for it. */
  positiveOutcomeRate: number | null;
  satisfactionRate: number;
  overallScore: number;
}

export interface IndependentVisitorAdvocacyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  visitorActivity: VisitorActivityResult;
  advocacyAccess: AdvocacyAccessResult;
  policyGovernance: PolicyGovernanceResult;
  staffAdvocacyReadiness: StaffAdvocacyReadinessResult;
  childProfiles: ChildAdvocacyProfile[];
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
 * Evaluates independent visitor activity.
 * Empty = 0 (no visits = no evidence of IV programme).
 *
 *   Positive outcome rate (very_positive + positive)  → 0-7
 *   Child engagement rate                             → 0-6
 *   Recorded in casefile rate                         → 0-6
 *   Private time + satisfaction combined rate         → 0-6
 */
export function evaluateVisitorActivity(
  visits: IndependentVisit[],
): VisitorActivityResult {
  if (visits.length === 0) {
    return {
      overallScore: 0,
      totalVisits: 0,
      positiveOutcomeRate: null,
      childEngagementRate: null,
      childSatisfactionRate: null,
      recordedRate: null,
      privateTimeRate: null,
    };
  }

  let score = 0;

  const positive = visits.filter(
    (v) => v.visitOutcome === "very_positive" || v.visitOutcome === "positive",
  ).length;
  const positiveOutcomeRate = rate(positive, visits.length);
  if (meets(positiveOutcomeRate, 80)) score += 7;
  else if (meets(positiveOutcomeRate, 60)) score += 5;
  else if (meets(positiveOutcomeRate, 40)) score += 3;
  else if (above(positiveOutcomeRate, 0)) score += 1;

  const engaged = visits.filter((v) => v.childEngaged).length;
  const childEngagementRate = rate(engaged, visits.length);
  if (meets(childEngagementRate, 90)) score += 6;
  else if (meets(childEngagementRate, 70)) score += 4;
  else if (meets(childEngagementRate, 50)) score += 3;
  else if (above(childEngagementRate, 0)) score += 1;

  const recorded = visits.filter((v) => v.recordedInCasefile).length;
  const recordedRate = rate(recorded, visits.length);
  if (meets(recordedRate, 90)) score += 6;
  else if (meets(recordedRate, 70)) score += 4;
  else if (meets(recordedRate, 50)) score += 3;
  else if (above(recordedRate, 0)) score += 1;

  const satisfied = visits.filter((v) => v.childSatisfied).length;
  const childSatisfactionRate = rate(satisfied, visits.length);
  const priv = visits.filter((v) => v.privateTimeProvided).length;
  const privateTimeRate = rate(priv, visits.length);
  const combinedRate = meanOf([childSatisfactionRate, privateTimeRate]) ?? 0; // unmeasured earns no bonus
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalVisits: visits.length,
    positiveOutcomeRate,
    childEngagementRate,
    childSatisfactionRate,
    recordedRate,
    privateTimeRate,
  };
}

/**
 * Evaluates advocacy access and referrals.
 * Empty = 0 (no referrals = no evidence of advocacy access).
 *
 *   Successful referral rate          → 0-7
 *   Informed of rights rate           → 0-6
 *   Consent obtained rate             → 0-6
 *   Timely response + satisfaction    → 0-6
 */
export function evaluateAdvocacyAccess(
  referrals: AdvocacyReferral[],
): AdvocacyAccessResult {
  if (referrals.length === 0) {
    return {
      overallScore: 0,
      totalReferrals: 0,
      successfulRate: null,
      informedOfRightsRate: null,
      consentObtainedRate: null,
      timelyResponseRate: null,
      childSatisfactionRate: null,
    };
  }

  let score = 0;

  const successful = referrals.filter(
    (r) => r.referralOutcome === "successful" || r.referralOutcome === "not_needed",
  ).length;
  const successfulRate = rate(successful, referrals.length);
  if (meets(successfulRate, 80)) score += 7;
  else if (meets(successfulRate, 60)) score += 5;
  else if (meets(successfulRate, 40)) score += 3;
  else if (above(successfulRate, 0)) score += 1;

  const informed = referrals.filter((r) => r.childInformedOfRights).length;
  const informedOfRightsRate = rate(informed, referrals.length);
  if (meets(informedOfRightsRate, 90)) score += 6;
  else if (meets(informedOfRightsRate, 70)) score += 4;
  else if (meets(informedOfRightsRate, 50)) score += 3;
  else if (above(informedOfRightsRate, 0)) score += 1;

  const consent = referrals.filter((r) => r.childConsentObtained).length;
  const consentObtainedRate = rate(consent, referrals.length);
  if (meets(consentObtainedRate, 90)) score += 6;
  else if (meets(consentObtainedRate, 70)) score += 4;
  else if (meets(consentObtainedRate, 50)) score += 3;
  else if (above(consentObtainedRate, 0)) score += 1;

  const timely = referrals.filter((r) => r.timelyResponse).length;
  const timelyResponseRate = rate(timely, referrals.length);
  const sat = referrals.filter((r) => r.childSatisfied).length;
  const childSatisfactionRate = rate(sat, referrals.length);
  const combinedRate = meanOf([timelyResponseRate, childSatisfactionRate]) ?? 0;
  if (combinedRate >= 90) score += 6;
  else if (combinedRate >= 70) score += 4;
  else if (combinedRate >= 50) score += 3;
  else if (combinedRate > 0) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalReferrals: referrals.length,
    successfulRate,
    informedOfRightsRate,
    consentObtainedRate,
    timelyResponseRate,
    childSatisfactionRate,
  };
}

/**
 * Evaluates advocacy policy and governance.
 * Empty = 0 (no policy = no governance framework).
 *
 *   informationDisplayed        → 0-4
 *   informedOnAdmission         → 0-4
 *   visitorPromoted             → 0-4
 *   complaintsAvailable         → 0-4
 *   leafletProvided             → 0-3
 *   regularReminders            → 0-3
 *   contactAccessible           → 0-3
 */
export function evaluatePolicyGovernance(
  policy: AdvocacyPolicy | null,
): PolicyGovernanceResult {
  if (!policy) {
    return {
      overallScore: 0,
      informationDisplayed: false,
      informedOnAdmission: false,
      visitorPromoted: false,
      complaintsAvailable: false,
      leafletProvided: false,
      regularReminders: false,
      contactAccessible: false,
    };
  }

  let score = 0;

  if (policy.advocacyInformationDisplayed) score += 4;
  if (policy.childrenInformedOnAdmission) score += 4;
  if (policy.independentVisitorPromoted) score += 4;
  if (policy.complaintsAdvocacyAvailable) score += 4;
  if (policy.rightsLeafletProvided) score += 3;
  if (policy.regularRightsReminders) score += 3;
  if (policy.advocacyContactDetailsAccessible) score += 3;

  return {
    overallScore: Math.min(score, 25),
    informationDisplayed: policy.advocacyInformationDisplayed,
    informedOnAdmission: policy.childrenInformedOnAdmission,
    visitorPromoted: policy.independentVisitorPromoted,
    complaintsAvailable: policy.complaintsAdvocacyAvailable,
    leafletProvided: policy.rightsLeafletProvided,
    regularReminders: policy.regularRightsReminders,
    contactAccessible: policy.advocacyContactDetailsAccessible,
  };
}

/**
 * Evaluates staff training on advocacy and independent visitors.
 * Empty = 0 (no trained staff = no readiness).
 *
 *   Advocacy rights rate           → 0-6
 *   Independent visitor role rate  → 0-5
 *   Complaints process rate        → 0-5
 *   Signposting rate               → 0-4
 *   Child participation rate       → 0-3
 *   Confidentiality rate           → 0-2
 */
export function evaluateStaffAdvocacyReadiness(
  training: StaffAdvocacyTraining[],
): StaffAdvocacyReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      advocacyRightsRate: null,
      independentVisitorRate: null,
      complaintsProcessRate: null,
      signpostingRate: null,
      childParticipationRate: null,
      confidentialityRate: null,
    };
  }

  let score = 0;

  const rights = training.filter((t) => t.advocacyRights).length;
  const advocacyRightsRate = rate(rights, training.length);
  if (meets(advocacyRightsRate, 90)) score += 6;
  else if (meets(advocacyRightsRate, 70)) score += 4;
  else if (meets(advocacyRightsRate, 50)) score += 3;
  else if (above(advocacyRightsRate, 0)) score += 1;

  const iv = training.filter((t) => t.independentVisitorRole).length;
  const independentVisitorRate = rate(iv, training.length);
  if (meets(independentVisitorRate, 90)) score += 5;
  else if (meets(independentVisitorRate, 70)) score += 3;
  else if (meets(independentVisitorRate, 50)) score += 2;
  else if (above(independentVisitorRate, 0)) score += 1;

  const complaints = training.filter((t) => t.complaintsProcess).length;
  const complaintsProcessRate = rate(complaints, training.length);
  if (meets(complaintsProcessRate, 90)) score += 5;
  else if (meets(complaintsProcessRate, 70)) score += 3;
  else if (meets(complaintsProcessRate, 50)) score += 2;
  else if (above(complaintsProcessRate, 0)) score += 1;

  const signpost = training.filter((t) => t.signposting).length;
  const signpostingRate = rate(signpost, training.length);
  if (meets(signpostingRate, 90)) score += 4;
  else if (meets(signpostingRate, 70)) score += 3;
  else if (meets(signpostingRate, 50)) score += 2;
  else if (above(signpostingRate, 0)) score += 1;

  const participation = training.filter((t) => t.childParticipation).length;
  const childParticipationRate = rate(participation, training.length);
  if (meets(childParticipationRate, 90)) score += 3;
  else if (meets(childParticipationRate, 70)) score += 2;
  else if (meets(childParticipationRate, 50)) score += 1;

  const confidential = training.filter((t) => t.confidentiality).length;
  const confidentialityRate = rate(confidential, training.length);
  if (meets(confidentialityRate, 90)) score += 2;
  else if (meets(confidentialityRate, 70)) score += 1;

  return {
    overallScore: Math.min(score, 25),
    totalStaff: training.length,
    advocacyRightsRate,
    independentVisitorRate,
    complaintsProcessRate,
    signpostingRate,
    childParticipationRate,
    confidentialityRate,
  };
}

// -- Child Profiles ------------------------------------------------------------

export function buildChildAdvocacyProfiles(
  visits: IndependentVisit[],
  referrals: AdvocacyReferral[],
): ChildAdvocacyProfile[] {
  const childMap = new Map<
    string,
    { childId: string; childName: string; visits: IndependentVisit[]; referrals: AdvocacyReferral[] }
  >();

  for (const v of visits) {
    if (!childMap.has(v.childId)) {
      childMap.set(v.childId, { childId: v.childId, childName: v.childName, visits: [], referrals: [] });
    }
    childMap.get(v.childId)!.visits.push(v);
  }

  for (const r of referrals) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, visits: [], referrals: [] });
    }
    childMap.get(r.childId)!.referrals.push(r);
  }

  return Array.from(childMap.values()).map((entry) => {
    let score = 0;

    // Visits frequency (0-3)
    if (entry.visits.length >= 5) score += 3;
    else if (entry.visits.length >= 3) score += 2;
    else if (entry.visits.length >= 1) score += 1;

    // Positive visit outcomes (0-3)
    const positiveVisits = entry.visits.filter(
      (v) => v.visitOutcome === "very_positive" || v.visitOutcome === "positive",
    ).length;
    const positiveOutcomeRate = rate(positiveVisits, entry.visits.length);
    if (meets(positiveOutcomeRate, 80)) score += 3;
    else if (meets(positiveOutcomeRate, 50)) score += 2;
    else if (above(positiveOutcomeRate, 0)) score += 1;

    // Satisfaction (0-2) — combined visits + referrals
    const visitSat = entry.visits.filter((v) => v.childSatisfied).length;
    const refSat = entry.referrals.filter((r) => r.childSatisfied).length;
    const totalItems = entry.visits.length + entry.referrals.length;
    const satisfactionRate = rate(visitSat + refSat, totalItems)!;
    if (meets(satisfactionRate, 80)) score += 2;
    else if (meets(satisfactionRate, 50)) score += 1;

    // Advocacy access (0-2)
    if (entry.referrals.length >= 2) score += 2;
    else if (entry.referrals.length >= 1) score += 1;

    return {
      childId: entry.childId,
      childName: entry.childName,
      totalVisits: entry.visits.length,
      totalReferrals: entry.referrals.length,
      positiveOutcomeRate,
      satisfactionRate,
      overallScore: Math.min(Math.max(score, 0), 10),
    };
  });
}

// -- Main generator ------------------------------------------------------------

export function generateIndependentVisitorAdvocacyIntelligence(
  visits: IndependentVisit[],
  referrals: AdvocacyReferral[],
  policy: AdvocacyPolicy | null,
  training: StaffAdvocacyTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): IndependentVisitorAdvocacyIntelligence {
  const visitorActivity = evaluateVisitorActivity(visits);
  const advocacyAccess = evaluateAdvocacyAccess(referrals);
  const policyGovernance = evaluatePolicyGovernance(policy);
  const staffAdvocacyReadiness = evaluateStaffAdvocacyReadiness(training);

  const rawScore =
    visitorActivity.overallScore +
    advocacyAccess.overallScore +
    policyGovernance.overallScore +
    staffAdvocacyReadiness.overallScore;
  const overallScore = Math.min(rawScore, 100);
  const rating = getRating(overallScore);

  const childProfiles = buildChildAdvocacyProfiles(visits, referrals);

  // -- Strengths ---------------------------------------------------------------
  const strengths: string[] = [];

  if (meets(visitorActivity.positiveOutcomeRate, 80) && visits.length > 0) {
    strengths.push(
      "Independent visitor relationships producing consistently positive outcomes",
    );
  }
  if (meets(visitorActivity.childEngagementRate, 90) && visits.length > 0) {
    strengths.push(
      "Children highly engaged with their independent visitors",
    );
  }
  if (meets(visitorActivity.privateTimeRate, 90) && visits.length > 0) {
    strengths.push(
      "Private time consistently provided during independent visitor sessions",
    );
  }
  if (meets(advocacyAccess.informedOfRightsRate, 90) && referrals.length > 0) {
    strengths.push(
      "Children consistently informed of their advocacy rights",
    );
  }
  if (meets(advocacyAccess.successfulRate, 80) && referrals.length > 0) {
    strengths.push(
      "Advocacy referrals consistently resulting in successful outcomes",
    );
  }
  if (meets(staffAdvocacyReadiness.advocacyRightsRate, 90) && training.length > 0) {
    strengths.push(
      "Staff team fully trained in children's advocacy rights",
    );
  }
  if (meets(staffAdvocacyReadiness.signpostingRate, 90) && training.length > 0) {
    strengths.push(
      "Staff team trained to signpost children to advocacy services",
    );
  }
  if (policyGovernance.informedOnAdmission && policy) {
    strengths.push(
      "Children informed of advocacy and independent visitor options on admission",
    );
  }

  // -- Areas for improvement ---------------------------------------------------
  const areasForImprovement: string[] = [];

  if (below(visitorActivity.positiveOutcomeRate, 60) && visits.length > 0) {
    areasForImprovement.push(
      "Independent visitor outcomes below expected standard — review matching and support",
    );
  }
  if (below(visitorActivity.recordedRate, 70) && visits.length > 0) {
    areasForImprovement.push(
      "Independent visitor sessions not consistently recorded in casefiles",
    );
  }
  if (below(advocacyAccess.informedOfRightsRate, 70) && referrals.length > 0) {
    areasForImprovement.push(
      "Children not consistently informed of their advocacy rights during referrals",
    );
  }
  if (below(staffAdvocacyReadiness.independentVisitorRate, 70) && training.length > 0) {
    areasForImprovement.push(
      "Staff training on independent visitor role needs strengthening",
    );
  }
  if (below(staffAdvocacyReadiness.complaintsProcessRate, 70) && training.length > 0) {
    areasForImprovement.push(
      "Staff training on complaints advocacy process needs improvement",
    );
  }

  // -- Actions -----------------------------------------------------------------
  const actions: string[] = [];

  if (visits.length === 0) {
    actions.push(
      "No independent visitor sessions recorded — review whether children have been offered an independent visitor",
    );
  }
  if (referrals.length === 0) {
    actions.push(
      "No advocacy referrals recorded — ensure children are aware of and offered advocacy services",
    );
  }
  if (!policy) {
    actions.push(
      "URGENT: No advocacy policy in place — develop and implement advocacy and independent visitor policy",
    );
  }
  if (training.length === 0) {
    actions.push(
      "URGENT: No staff advocacy training records — deliver training on advocacy rights and independent visitors",
    );
  }
  if (below(visitorActivity.privateTimeRate, 70) && visits.length > 0) {
    actions.push(
      "Ensure private time is consistently provided during independent visitor sessions",
    );
  }
  const failedReferrals = referrals.filter(
    (r) => r.referralOutcome === "no_service_available",
  );
  if (failedReferrals.length > 0) {
    actions.push(
      `${failedReferrals.length} advocacy referral(s) failed due to no service available — explore alternative advocacy provision`,
    );
  }
  if (below(advocacyAccess.consentObtainedRate, 80) && referrals.length > 0) {
    actions.push(
      "Improve consent recording for advocacy referrals",
    );
  }

  // -- Regulatory links --------------------------------------------------------
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 10 — The health and wellbeing standard (emotional wellbeing and advocacy)",
    "CHR 2015 Reg 12 — The positive relationships standard",
    "SCCIF — Social Care Common Inspection Framework (advocacy and participation)",
    "Children Act 1989 s24 — Advice and assistance for looked-after children",
    "Advocacy Services Regulations 2004 — Independent advocacy for children in care",
    "NMS 15 — National Minimum Standards (complaints and advocacy)",
    "UNCRC Article 12 — Right to be heard and to have views given due weight",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    visitorActivity,
    advocacyAccess,
    policyGovernance,
    staffAdvocacyReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
