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
  positiveOutcomeRate: number;
  childEngagementRate: number;
  childSatisfactionRate: number;
  recordedRate: number;
  privateTimeRate: number;
}

export interface AdvocacyAccessResult {
  overallScore: number;
  totalReferrals: number;
  successfulRate: number;
  informedOfRightsRate: number;
  consentObtainedRate: number;
  timelyResponseRate: number;
  childSatisfactionRate: number;
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
  advocacyRightsRate: number;
  independentVisitorRate: number;
  complaintsProcessRate: number;
  signpostingRate: number;
  childParticipationRate: number;
  confidentialityRate: number;
}

export interface ChildAdvocacyProfile {
  childId: string;
  childName: string;
  totalVisits: number;
  totalReferrals: number;
  positiveOutcomeRate: number;
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
      positiveOutcomeRate: 0,
      childEngagementRate: 0,
      childSatisfactionRate: 0,
      recordedRate: 0,
      privateTimeRate: 0,
    };
  }

  let score = 0;

  const positive = visits.filter(
    (v) => v.visitOutcome === "very_positive" || v.visitOutcome === "positive",
  ).length;
  const positiveOutcomeRate = pct(positive, visits.length);
  if (positiveOutcomeRate >= 80) score += 7;
  else if (positiveOutcomeRate >= 60) score += 5;
  else if (positiveOutcomeRate >= 40) score += 3;
  else if (positiveOutcomeRate > 0) score += 1;

  const engaged = visits.filter((v) => v.childEngaged).length;
  const childEngagementRate = pct(engaged, visits.length);
  if (childEngagementRate >= 90) score += 6;
  else if (childEngagementRate >= 70) score += 4;
  else if (childEngagementRate >= 50) score += 3;
  else if (childEngagementRate > 0) score += 1;

  const recorded = visits.filter((v) => v.recordedInCasefile).length;
  const recordedRate = pct(recorded, visits.length);
  if (recordedRate >= 90) score += 6;
  else if (recordedRate >= 70) score += 4;
  else if (recordedRate >= 50) score += 3;
  else if (recordedRate > 0) score += 1;

  const satisfied = visits.filter((v) => v.childSatisfied).length;
  const childSatisfactionRate = pct(satisfied, visits.length);
  const priv = visits.filter((v) => v.privateTimeProvided).length;
  const privateTimeRate = pct(priv, visits.length);
  const combinedRate = Math.round((childSatisfactionRate + privateTimeRate) / 2);
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
      successfulRate: 0,
      informedOfRightsRate: 0,
      consentObtainedRate: 0,
      timelyResponseRate: 0,
      childSatisfactionRate: 0,
    };
  }

  let score = 0;

  const successful = referrals.filter(
    (r) => r.referralOutcome === "successful" || r.referralOutcome === "not_needed",
  ).length;
  const successfulRate = pct(successful, referrals.length);
  if (successfulRate >= 80) score += 7;
  else if (successfulRate >= 60) score += 5;
  else if (successfulRate >= 40) score += 3;
  else if (successfulRate > 0) score += 1;

  const informed = referrals.filter((r) => r.childInformedOfRights).length;
  const informedOfRightsRate = pct(informed, referrals.length);
  if (informedOfRightsRate >= 90) score += 6;
  else if (informedOfRightsRate >= 70) score += 4;
  else if (informedOfRightsRate >= 50) score += 3;
  else if (informedOfRightsRate > 0) score += 1;

  const consent = referrals.filter((r) => r.childConsentObtained).length;
  const consentObtainedRate = pct(consent, referrals.length);
  if (consentObtainedRate >= 90) score += 6;
  else if (consentObtainedRate >= 70) score += 4;
  else if (consentObtainedRate >= 50) score += 3;
  else if (consentObtainedRate > 0) score += 1;

  const timely = referrals.filter((r) => r.timelyResponse).length;
  const timelyResponseRate = pct(timely, referrals.length);
  const sat = referrals.filter((r) => r.childSatisfied).length;
  const childSatisfactionRate = pct(sat, referrals.length);
  const combinedRate = Math.round((timelyResponseRate + childSatisfactionRate) / 2);
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
      advocacyRightsRate: 0,
      independentVisitorRate: 0,
      complaintsProcessRate: 0,
      signpostingRate: 0,
      childParticipationRate: 0,
      confidentialityRate: 0,
    };
  }

  let score = 0;

  const rights = training.filter((t) => t.advocacyRights).length;
  const advocacyRightsRate = pct(rights, training.length);
  if (advocacyRightsRate >= 90) score += 6;
  else if (advocacyRightsRate >= 70) score += 4;
  else if (advocacyRightsRate >= 50) score += 3;
  else if (advocacyRightsRate > 0) score += 1;

  const iv = training.filter((t) => t.independentVisitorRole).length;
  const independentVisitorRate = pct(iv, training.length);
  if (independentVisitorRate >= 90) score += 5;
  else if (independentVisitorRate >= 70) score += 3;
  else if (independentVisitorRate >= 50) score += 2;
  else if (independentVisitorRate > 0) score += 1;

  const complaints = training.filter((t) => t.complaintsProcess).length;
  const complaintsProcessRate = pct(complaints, training.length);
  if (complaintsProcessRate >= 90) score += 5;
  else if (complaintsProcessRate >= 70) score += 3;
  else if (complaintsProcessRate >= 50) score += 2;
  else if (complaintsProcessRate > 0) score += 1;

  const signpost = training.filter((t) => t.signposting).length;
  const signpostingRate = pct(signpost, training.length);
  if (signpostingRate >= 90) score += 4;
  else if (signpostingRate >= 70) score += 3;
  else if (signpostingRate >= 50) score += 2;
  else if (signpostingRate > 0) score += 1;

  const participation = training.filter((t) => t.childParticipation).length;
  const childParticipationRate = pct(participation, training.length);
  if (childParticipationRate >= 90) score += 3;
  else if (childParticipationRate >= 70) score += 2;
  else if (childParticipationRate >= 50) score += 1;

  const confidential = training.filter((t) => t.confidentiality).length;
  const confidentialityRate = pct(confidential, training.length);
  if (confidentialityRate >= 90) score += 2;
  else if (confidentialityRate >= 70) score += 1;

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
    const positiveOutcomeRate = pct(positiveVisits, entry.visits.length);
    if (positiveOutcomeRate >= 80) score += 3;
    else if (positiveOutcomeRate >= 50) score += 2;
    else if (positiveOutcomeRate > 0) score += 1;

    // Satisfaction (0-2) — combined visits + referrals
    const visitSat = entry.visits.filter((v) => v.childSatisfied).length;
    const refSat = entry.referrals.filter((r) => r.childSatisfied).length;
    const totalItems = entry.visits.length + entry.referrals.length;
    const satisfactionRate = pct(visitSat + refSat, totalItems);
    if (satisfactionRate >= 80) score += 2;
    else if (satisfactionRate >= 50) score += 1;

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

  if (visitorActivity.positiveOutcomeRate >= 80 && visits.length > 0) {
    strengths.push(
      "Independent visitor relationships producing consistently positive outcomes",
    );
  }
  if (visitorActivity.childEngagementRate >= 90 && visits.length > 0) {
    strengths.push(
      "Children highly engaged with their independent visitors",
    );
  }
  if (visitorActivity.privateTimeRate >= 90 && visits.length > 0) {
    strengths.push(
      "Private time consistently provided during independent visitor sessions",
    );
  }
  if (advocacyAccess.informedOfRightsRate >= 90 && referrals.length > 0) {
    strengths.push(
      "Children consistently informed of their advocacy rights",
    );
  }
  if (advocacyAccess.successfulRate >= 80 && referrals.length > 0) {
    strengths.push(
      "Advocacy referrals consistently resulting in successful outcomes",
    );
  }
  if (staffAdvocacyReadiness.advocacyRightsRate >= 90 && training.length > 0) {
    strengths.push(
      "Staff team fully trained in children's advocacy rights",
    );
  }
  if (staffAdvocacyReadiness.signpostingRate >= 90 && training.length > 0) {
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

  if (visitorActivity.positiveOutcomeRate < 60 && visits.length > 0) {
    areasForImprovement.push(
      "Independent visitor outcomes below expected standard — review matching and support",
    );
  }
  if (visitorActivity.recordedRate < 70 && visits.length > 0) {
    areasForImprovement.push(
      "Independent visitor sessions not consistently recorded in casefiles",
    );
  }
  if (advocacyAccess.informedOfRightsRate < 70 && referrals.length > 0) {
    areasForImprovement.push(
      "Children not consistently informed of their advocacy rights during referrals",
    );
  }
  if (staffAdvocacyReadiness.independentVisitorRate < 70 && training.length > 0) {
    areasForImprovement.push(
      "Staff training on independent visitor role needs strengthening",
    );
  }
  if (staffAdvocacyReadiness.complaintsProcessRate < 70 && training.length > 0) {
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
  if (visitorActivity.privateTimeRate < 70 && visits.length > 0) {
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
  if (advocacyAccess.consentObtainedRate < 80 && referrals.length > 0) {
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
