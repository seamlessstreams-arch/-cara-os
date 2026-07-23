// ==============================================================================
// PARENTAL CONTACT MANAGEMENT INTELLIGENCE ENGINE
//
// Pure deterministic engine for assessing quality of managed parental contact
// for looked-after children. Covers contact plan compliance, supervised visit
// quality, child voice in contact decisions, and risk management during
// parental contact.
//
// Regulatory basis:
//   - Children Act 1989 s34 — Parental contact with looked-after children
//   - CHR 2015 Reg 13 — Contact: maintaining family relationships
//   - SCCIF — Overall experiences and progress of children
//   - NMS 9 — Contact: supporting family relationships
//   - Working Together 2023 — Multi-agency safeguarding arrangements
//   - UNCRC Article 9 — Right to maintain contact with parents
//   - UNCRC Article 12 — Right of children to express views
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type ContactType =
  | "face_to_face_supervised"
  | "face_to_face_unsupervised"
  | "telephone"
  | "video_call"
  | "letter"
  | "no_contact_order";

export type ContactOutcome =
  | "positive"
  | "mixed"
  | "negative"
  | "cancelled_by_parent"
  | "cancelled_by_child"
  | "cancelled_by_authority";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "very_high";

export type ComplianceStatus =
  | "fully_compliant"
  | "mostly_compliant"
  | "partially_compliant"
  | "non_compliant";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface ParentalContactPlan {
  id: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  contactType: ContactType;
  frequency: string;
  riskLevel: RiskLevel;
  courtOrderInPlace: boolean;
  contactSupervisor: string;
  planReviewDate: string;
  planCurrent: boolean;
  childViewConsidered: boolean;
}

export interface ParentalContactSession {
  id: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  date: string;
  contactType: ContactType;
  duration: number;
  outcome: ContactOutcome;
  supervisedBy: string;
  childPrepared: boolean;
  childDebriefed: boolean;
  parentCooperative: boolean;
  safeguardingConcernRaised: boolean;
  incidentDuringContact: boolean;
}

export interface ContactRiskAssessment {
  id: string;
  childId: string;
  childName: string;
  parentId: string;
  parentName: string;
  assessmentDate: string;
  assessedBy: string;
  riskLevel: RiskLevel;
  riskFactorsIdentified: string[];
  safeguardingMeasures: string[];
  reviewDate: string;
  reviewCurrent: boolean;
}

export interface StaffContactTraining {
  id: string;
  staffId: string;
  staffName: string;
  supervisedContactTrained: boolean;
  riskAssessmentTrained: boolean;
  childPrepDebriefTrained: boolean;
  safeguardingInContact: boolean;
  managingParentalConflict: boolean;
  courtOrderAwareness: boolean;
}

import { below, formatRate, meets, rate, weightedMeanOf } from "@/lib/metrics/rate";

// -- Result Interfaces --------------------------------------------------------

export interface ContactPlanComplianceResult {
  overallScore: number;
  totalPlans: number;
  planExistsRate: number | null;
  planCurrentRate: number | null;
  childViewConsideredRate: number | null;
  /** null = no plan is court-ordered, so there is no order to comply with. */
  courtOrderCompliantRate: number | null;
}

export interface ContactQualityResult {
  overallScore: number;
  totalSessions: number;
  positiveOutcomeRate: number | null;
  childPreparedRate: number | null;
  childDebriefedRate: number | null;
  parentCooperativeRate: number | null;
}

export interface RiskManagementResult {
  overallScore: number;
  totalAssessments: number;
  riskAssessedRate: number | null;
  reviewCurrentRate: number | null;
  safeguardingMeasuresRate: number | null;
  incidentRate: number | null;
}

export interface StaffContactReadinessResult {
  overallScore: number;
  totalStaff: number;
  supervisedContactRate: number | null;
  riskAssessmentRate: number | null;
  prepDebriefRate: number | null;
  safeguardingRate: number | null;
  parentalConflictRate: number | null;
  courtOrderRate: number | null;
}

export interface ChildContactProfile {
  childId: string;
  childName: string;
  parentCount: number;
  sessionsInPeriod: number;
  positiveOutcomeRate: number | null;
  childPreparedRate: number | null;
  riskAssessed: boolean;
  overallScore: number;
}

export interface ParentalContactManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  contactPlanCompliance: ContactPlanComplianceResult;
  contactQuality: ContactQualityResult;
  riskManagement: RiskManagementResult;
  staffContactReadiness: StaffContactReadinessResult;
  childProfiles: ChildContactProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

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

// -- Label Maps & Getters -----------------------------------------------------

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  face_to_face_supervised: "Face to Face (Supervised)",
  face_to_face_unsupervised: "Face to Face (Unsupervised)",
  telephone: "Telephone",
  video_call: "Video Call",
  letter: "Letter",
  no_contact_order: "No Contact Order",
};

const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, string> = {
  positive: "Positive",
  mixed: "Mixed",
  negative: "Negative",
  cancelled_by_parent: "Cancelled by Parent",
  cancelled_by_child: "Cancelled by Child",
  cancelled_by_authority: "Cancelled by Authority",
};

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  very_high: "Very High",
};

const COMPLIANCE_STATUS_LABELS: Record<ComplianceStatus, string> = {
  fully_compliant: "Fully Compliant",
  mostly_compliant: "Mostly Compliant",
  partially_compliant: "Partially Compliant",
  non_compliant: "Non-Compliant",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getContactTypeLabel(v: ContactType): string { return CONTACT_TYPE_LABELS[v]; }
export function getContactOutcomeLabel(v: ContactOutcome): string { return CONTACT_OUTCOME_LABELS[v]; }
export function getRiskLevelLabel(v: RiskLevel): string { return RISK_LEVEL_LABELS[v]; }
export function getComplianceStatusLabel(v: ComplianceStatus): string { return COMPLIANCE_STATUS_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluates contact plan compliance.
 * Empty = 0 (no contact plans documented = non-compliant).
 *
 * Scoring: plan exists (0-7), plan current (0-6), child view considered (0-6),
 * court order compliant (0-6).
 */
export function evaluateContactPlanCompliance(
  plans: ParentalContactPlan[],
): ContactPlanComplianceResult {
  if (plans.length === 0) {
    return {
      overallScore: 0,
      totalPlans: 0,
      planExistsRate: null,
      planCurrentRate: null,
      childViewConsideredRate: null,
      courtOrderCompliantRate: null,
    };
  }

  // All plans that are not no_contact_order count as "plan exists"
  const activePlans = plans.filter((p) => p.contactType !== "no_contact_order");
  const planExistsCount = activePlans.length;
  const planCurrentCount = plans.filter((p) => p.planCurrent).length;
  const childViewCount = plans.filter((p) => p.childViewConsidered).length;
  const courtOrderPlans = plans.filter((p) => p.courtOrderInPlace);
  // Court order compliant = court order plans that are current
  const courtOrderCompliant = courtOrderPlans.filter((p) => p.planCurrent).length;

  const planExistsRate = pct(planExistsCount, plans.length);
  const planCurrentRate = pct(planCurrentCount, plans.length);
  const childViewConsideredRate = pct(childViewCount, plans.length);
  // Null when no plan is court-ordered — nothing to comply with, which is not
  // the same as every order being complied with
  const courtOrderCompliantRate = rate(courtOrderCompliant, courtOrderPlans.length);

  // Scoring, renormalised over the components that could be measured
  const score = Math.round(
    ((weightedMeanOf([
      { score: planExistsRate, weight: 7 },
      { score: planCurrentRate, weight: 6 },
      { score: childViewConsideredRate, weight: 6 },
      { score: courtOrderCompliantRate, weight: 6 },
    ]) ?? 0) / 100) * 25,
  );

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalPlans: plans.length,
    planExistsRate,
    planCurrentRate,
    childViewConsideredRate,
    courtOrderCompliantRate,
  };
}

/**
 * Evaluates quality of contact sessions.
 * Empty = 0 (no sessions documented = non-compliant).
 *
 * Scoring: positive outcome rate (0-7), child prepared (0-6),
 * child debriefed (0-6), parent cooperative (0-6).
 */
export function evaluateContactQuality(
  sessions: ParentalContactSession[],
): ContactQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      positiveOutcomeRate: null,
      childPreparedRate: null,
      childDebriefedRate: null,
      parentCooperativeRate: null,
    };
  }

  let positive = 0;
  let prepared = 0;
  let debriefed = 0;
  let cooperative = 0;

  for (const s of sessions) {
    if (s.outcome === "positive") positive++;
    if (s.childPrepared) prepared++;
    if (s.childDebriefed) debriefed++;
    if (s.parentCooperative) cooperative++;
  }

  const positiveOutcomeRate = pct(positive, sessions.length);
  const childPreparedRate = pct(prepared, sessions.length);
  const childDebriefedRate = pct(debriefed, sessions.length);
  const parentCooperativeRate = pct(cooperative, sessions.length);

  let score = 0;
  score += Math.round((positiveOutcomeRate / 100) * 7);
  score += Math.round((childPreparedRate / 100) * 6);
  score += Math.round((childDebriefedRate / 100) * 6);
  score += Math.round((parentCooperativeRate / 100) * 6);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    positiveOutcomeRate,
    childPreparedRate,
    childDebriefedRate,
    parentCooperativeRate,
  };
}

/**
 * Evaluates risk management during parental contact.
 * Empty (no assessments AND no sessions) = 25 (no contact = no risk).
 *
 * Scoring: risk assessed (0-7), review current (0-6),
 * safeguarding measures (0-6), incidents rate penalty (0-6 bonus if none).
 */
export function evaluateRiskManagement(
  assessments: ContactRiskAssessment[],
  sessions: ParentalContactSession[],
): RiskManagementResult {
  if (assessments.length === 0 && sessions.length === 0) {
    return {
      overallScore: 25,
      totalAssessments: 0,
      riskAssessedRate: null,
      reviewCurrentRate: null,
      safeguardingMeasuresRate: null,
      incidentRate: null,
    };
  }

  // Risk assessed: proportion of assessments that identified risk factors
  const riskAssessed = assessments.filter((a) => a.riskFactorsIdentified.length > 0).length;
  const reviewCurrent = assessments.filter((a) => a.reviewCurrent).length;
  const hasSafeguardingMeasures = assessments.filter((a) => a.safeguardingMeasures.length > 0).length;
  const incidents = sessions.filter((s) => s.incidentDuringContact).length;

  const riskAssessedRate = rate(riskAssessed, assessments.length);
  const reviewCurrentRate = rate(reviewCurrent, assessments.length);
  const safeguardingMeasuresRate = rate(hasSafeguardingMeasures, assessments.length);
  const incidentRate = rate(incidents, sessions.length);

  let score = 0;
  // Risk assessed: having assessments with risk factors identified is good practice
  if (assessments.length > 0) {
    score += Math.round(((riskAssessedRate ?? 0) / 100) * 7);
    score += Math.round(((reviewCurrentRate ?? 0) / 100) * 6);
    score += Math.round(((safeguardingMeasuresRate ?? 0) / 100) * 6);
  }
  // Incidents rate penalty: 0-6 bonus if no incidents
  if (incidentRate === null || incidentRate === 0) {
    score += 6;
  } else if (incidentRate <= 10) {
    score += 3;
  } else if (incidentRate <= 25) {
    score += 1;
  }

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAssessments: assessments.length,
    riskAssessedRate,
    reviewCurrentRate,
    safeguardingMeasuresRate,
    incidentRate,
  };
}

/**
 * Evaluates staff readiness for managing parental contact.
 * Empty = 0.
 *
 * Scoring: supervised contact (0-6), risk assessment (0-5),
 * prep/debrief (0-5), safeguarding (0-4), parental conflict (0-3),
 * court order (0-2).
 */
export function evaluateStaffContactReadiness(
  training: StaffContactTraining[],
): StaffContactReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      supervisedContactRate: null,
      riskAssessmentRate: null,
      prepDebriefRate: null,
      safeguardingRate: null,
      parentalConflictRate: null,
      courtOrderRate: null,
    };
  }

  let supervised = 0;
  let riskAssessment = 0;
  let prepDebrief = 0;
  let safeguarding = 0;
  let parentalConflict = 0;
  let courtOrder = 0;

  for (const t of training) {
    if (t.supervisedContactTrained) supervised++;
    if (t.riskAssessmentTrained) riskAssessment++;
    if (t.childPrepDebriefTrained) prepDebrief++;
    if (t.safeguardingInContact) safeguarding++;
    if (t.managingParentalConflict) parentalConflict++;
    if (t.courtOrderAwareness) courtOrder++;
  }

  const supervisedContactRate = pct(supervised, training.length);
  const riskAssessmentRate = pct(riskAssessment, training.length);
  const prepDebriefRate = pct(prepDebrief, training.length);
  const safeguardingRate = pct(safeguarding, training.length);
  const parentalConflictRate = pct(parentalConflict, training.length);
  const courtOrderRate = pct(courtOrder, training.length);

  let score = 0;
  score += Math.round((supervisedContactRate / 100) * 6);
  score += Math.round((riskAssessmentRate / 100) * 5);
  score += Math.round((prepDebriefRate / 100) * 5);
  score += Math.round((safeguardingRate / 100) * 4);
  score += Math.round((parentalConflictRate / 100) * 3);
  score += Math.round((courtOrderRate / 100) * 2);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    supervisedContactRate,
    riskAssessmentRate,
    prepDebriefRate,
    safeguardingRate,
    parentalConflictRate,
    courtOrderRate,
  };
}

// -- Child Profiles -----------------------------------------------------------

export function buildChildContactProfiles(
  plans: ParentalContactPlan[],
  sessions: ParentalContactSession[],
  assessments: ContactRiskAssessment[],
): ChildContactProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const p of plans) {
    childIds.add(p.childId);
    childNames.set(p.childId, p.childName);
  }
  for (const s of sessions) {
    childIds.add(s.childId);
    childNames.set(s.childId, s.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childPlans = plans.filter((p) => p.childId === childId);
    const childSessions = sessions.filter((s) => s.childId === childId);
    const childAssessments = assessments.filter((a) => a.childId === childId);

    const parentIds = new Set<string>();
    for (const p of childPlans) parentIds.add(p.parentId);
    for (const s of childSessions) parentIds.add(s.parentId);

    const positiveSessions = childSessions.filter((s) => s.outcome === "positive").length;
    const positiveOutcomeRate = rate(positiveSessions, childSessions.length);

    const preparedSessions = childSessions.filter((s) => s.childPrepared).length;
    const childPreparedRate = rate(preparedSessions, childSessions.length);

    const riskAssessed = childAssessments.length > 0;

    // Score 0-10
    let score = 0;
    // Plans current and child view considered (0-3)
    if (childPlans.length > 0) {
      const allCurrent = childPlans.every((p) => p.planCurrent);
      const allChildView = childPlans.every((p) => p.childViewConsidered);
      if (allCurrent) score += 1;
      if (allChildView) score += 1;
      if (allCurrent && allChildView) score += 1;
    }
    // Positive outcome rate (0-3)
    score += Math.round(((positiveOutcomeRate ?? 0) / 100) * 3);
    // Child prepared rate (0-2)
    score += Math.round(((childPreparedRate ?? 0) / 100) * 2);
    // Risk assessed (0-2)
    if (riskAssessed) {
      score += 1;
      if (childAssessments.every((a) => a.reviewCurrent)) score += 1;
    }

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      parentCount: parentIds.size,
      sessionsInPeriod: childSessions.length,
      positiveOutcomeRate,
      childPreparedRate,
      riskAssessed,
      overallScore: Math.min(10, score),
    };
  });
}

// -- Main Function ------------------------------------------------------------

export function generateParentalContactManagementIntelligence(
  plans: ParentalContactPlan[],
  sessions: ParentalContactSession[],
  assessments: ContactRiskAssessment[],
  training: StaffContactTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): ParentalContactManagementIntelligence {
  const contactPlanCompliance = evaluateContactPlanCompliance(plans);
  const contactQuality = evaluateContactQuality(sessions);
  const riskManagement = evaluateRiskManagement(assessments, sessions);
  const staffContactReadiness = evaluateStaffContactReadiness(training);

  const rawScore =
    contactPlanCompliance.overallScore +
    contactQuality.overallScore +
    riskManagement.overallScore +
    staffContactReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildContactProfiles(plans, sessions, assessments);

  // -- Strengths --
  const strengths: string[] = [];
  if (meets(contactPlanCompliance.planCurrentRate, 100))
    strengths.push("All parental contact plans are current and up to date");
  if (meets(contactPlanCompliance.childViewConsideredRate, 100))
    strengths.push("Child's views considered in all contact plan decisions");
  if (meets(contactQuality.positiveOutcomeRate, 90))
    strengths.push("Positive outcomes in " + formatRate(contactQuality.positiveOutcomeRate) + " of parental contact sessions");
  if (meets(contactQuality.childPreparedRate, 100))
    strengths.push("Children consistently prepared before every parental contact session");
  if (meets(contactQuality.childDebriefedRate, 100))
    strengths.push("Children consistently debriefed after every parental contact session");
  if (meets(contactQuality.parentCooperativeRate, 90))
    strengths.push("High level of parental cooperation at " + formatRate(contactQuality.parentCooperativeRate));
  if (meets(riskManagement.reviewCurrentRate, 100))
    strengths.push("All contact risk assessments are current and reviewed");
  if (riskManagement.incidentRate === 0)
    strengths.push("No incidents during parental contact in the reporting period");
  if (meets(staffContactReadiness.supervisedContactRate, 100))
    strengths.push("All staff trained in supervised contact management");

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];
  if (plans.length === 0)
    areasForImprovement.push("No parental contact plans documented — all children should have contact arrangements recorded");
  if (below(contactPlanCompliance.planCurrentRate, 100))
    areasForImprovement.push((100 - (contactPlanCompliance.planCurrentRate ?? 0)) + "% of contact plans are not current — review and update required");
  if (below(contactPlanCompliance.childViewConsideredRate, 80))
    areasForImprovement.push("Child views considered in only " + formatRate(contactPlanCompliance.childViewConsideredRate) + " of plans — target 100%");
  if (below(contactQuality.childPreparedRate, 80))
    areasForImprovement.push("Child preparation before contact at only " + formatRate(contactQuality.childPreparedRate) + " — improve pre-contact support");
  if (below(contactQuality.childDebriefedRate, 80))
    areasForImprovement.push("Child debriefing after contact at only " + formatRate(contactQuality.childDebriefedRate) + " — improve post-contact support");
  if (below(contactQuality.positiveOutcomeRate, 60))
    areasForImprovement.push("Only " + formatRate(contactQuality.positiveOutcomeRate) + " of sessions had positive outcomes — review contact arrangements");
  if (sessions.length === 0 && plans.length > 0)
    areasForImprovement.push("No contact sessions recorded despite active contact plans");
  if (training.length === 0)
    areasForImprovement.push("No staff training records for parental contact management");
  if (below(staffContactReadiness.supervisedContactRate, 75))
    areasForImprovement.push("Only " + formatRate(staffContactReadiness.supervisedContactRate) + " of staff trained in supervised contact — target 100%");

  // -- Actions --
  const actions: string[] = [];
  const courtOrderPlans = plans.filter((p) => p.courtOrderInPlace);
  const courtOrderNotCurrent = courtOrderPlans.filter((p) => !p.planCurrent);
  if (courtOrderNotCurrent.length > 0)
    actions.push("URGENT: " + courtOrderNotCurrent.length + " court-ordered contact plan(s) not current — legal compliance risk");
  const safeguardingSessions = sessions.filter((s) => s.safeguardingConcernRaised);
  if (safeguardingSessions.length > 0)
    actions.push("URGENT: " + safeguardingSessions.length + " safeguarding concern(s) raised during contact — ensure all referrals and follow-up complete");
  const incidentSessions = sessions.filter((s) => s.incidentDuringContact);
  if (incidentSessions.length > 0)
    actions.push("URGENT: " + incidentSessions.length + " incident(s) during parental contact — review risk assessments and contact arrangements");
  if (plans.length === 0)
    actions.push("Document parental contact plans for all children — statutory requirement under Children Act 1989 s34");
  if (assessments.length === 0 && sessions.length > 0)
    actions.push("Complete contact risk assessments — contact is occurring without documented risk assessment");
  if (below(riskManagement.reviewCurrentRate, 100))
    actions.push("Update " + (100 - (riskManagement.reviewCurrentRate ?? 0)) + "% of contact risk assessments that are overdue for review");
  const highRiskNoMeasures = assessments.filter(
    (a) => (a.riskLevel === "high" || a.riskLevel === "very_high") && a.safeguardingMeasures.length === 0,
  );
  if (highRiskNoMeasures.length > 0)
    actions.push("URGENT: " + highRiskNoMeasures.length + " high/very-high risk assessment(s) with no safeguarding measures documented");
  if (below(staffContactReadiness.safeguardingRate, 75))
    actions.push("Arrange safeguarding in contact training — only " + formatRate(staffContactReadiness.safeguardingRate) + " of staff trained");
  if (below(staffContactReadiness.courtOrderRate, 75))
    actions.push("Arrange court order awareness training — only " + formatRate(staffContactReadiness.courtOrderRate) + " of staff trained");

  const regulatoryLinks: string[] = [
    "Children Act 1989 s34 — Parental contact with looked-after children",
    "CHR 2015 Reg 13 — Contact: duty to promote contact with family members",
    "SCCIF — Overall experiences: quality of parental contact and relationships",
    "NMS 9 — Contact: supporting family relationships including parental contact",
    "Working Together 2023 — Multi-agency safeguarding during contact",
    "UNCRC Article 9 — Right to maintain contact with parents when separated",
    "UNCRC Article 12 — Right of children to express views in contact decisions",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    contactPlanCompliance,
    contactQuality,
    riskManagement,
    staffContactReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
