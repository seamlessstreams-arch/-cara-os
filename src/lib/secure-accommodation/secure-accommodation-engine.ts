import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Secure Accommodation Intelligence Engine
//
// Evaluates compliance with secure accommodation requirements under
// Children Act 1989 s25, welfare review quality, restriction justification,
// and young person participation within children's residential care.
//
// Regulatory basis:
//   - Children Act 1989 s25 (Secure Accommodation)
//   - The Children (Secure Accommodation) Regulations 1991
//   - CHR 2015 Reg 20 (restraint and deprivation of liberty)
//   - UNCRC Article 37 (protection from deprivation of liberty)
//   - ECHR Article 5 (Right to liberty and security)
//   - Secure Children's Homes — National Minimum Standards
//   - SCCIF — Social Care Common Inspection Framework
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type SecureOrderStatus =
  | "active"
  | "expired"
  | "pending"
  | "refused"
  | "not_required"
  | "revoked";

export type WelfareReviewStatus =
  | "completed_on_time"
  | "completed_late"
  | "overdue"
  | "not_due";

export type ReviewParticipant =
  | "child"
  | "parent"
  | "social_worker"
  | "iro"
  | "advocate"
  | "legal_representative"
  | "guardian";

export type RestrictionJustification =
  | "risk_to_self"
  | "risk_to_others"
  | "absconding_risk"
  | "criminal_activity"
  | "exploitation_risk";

export type ProgressOutcome =
  | "positive_progress"
  | "stable"
  | "deteriorating"
  | "insufficient_evidence";

export type DischargeReadiness =
  | "ready"
  | "nearly_ready"
  | "not_ready"
  | "requires_assessment";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface SecureAccommodationOrder {
  id: string;
  childId: string;
  childName: string;
  orderStatus: SecureOrderStatus;
  orderDate?: string;
  expiryDate?: string;
  courtName?: string;
  justification: RestrictionJustification[];
  maximumPeriodDays: number;
  localAuthorityApplicant: string;
  s25CriteriaDocumented: boolean;
  leastRestrictiveConsidered: boolean;
}

export interface WelfareReview {
  id: string;
  childId: string;
  orderId: string;
  reviewDate: string;
  status: WelfareReviewStatus;
  reviewedBy: string;
  participants: ReviewParticipant[];
  childViewsRecorded: boolean;
  childAttended: boolean;
  progressOutcome: ProgressOutcome;
  recommendationsMade: number;
  recommendationsActioned: number;
  continueSecureRecommended: boolean;
  alternativesConsidered: boolean;
  nextReviewDue: string;
}

export interface ChildWelfare {
  id: string;
  childId: string;
  educationProvided: boolean;
  educationHoursPerWeek: number;
  therapeuticSupportInPlace: boolean;
  therapySessions: number;
  familyContactMaintained: boolean;
  contactFrequency: string;
  healthNeedsMet: boolean;
  physicalActivityAccess: boolean;
  outsideTimeMinutesPerDay: number;
  personalBelongingsAccessible: boolean;
  privacyRespected: boolean;
  culturalNeedsMet: boolean;
  complaintsMechanismAvailable: boolean;
}

export interface DischargeAssessment {
  id: string;
  childId: string;
  orderId: string;
  assessmentDate: string;
  assessedBy: string;
  readiness: DischargeReadiness;
  transitionPlanInPlace: boolean;
  receivingPlacementIdentified: boolean;
  supportNetworkMapped: boolean;
  riskManagementPlanUpdated: boolean;
  childViewsOnDischarge: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface OrderComplianceResult {
  overallScore: number; // 0-30
  totalOrders: number;
  activeOrders: number;
  /** null when the population is empty — nothing measured, not 0%. */
  s25CriteriaRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  leastRestrictiveRate: number | null;
  expiredWithoutRenewal: number;
  /** null when the population is empty — nothing measured, not 0%. */
  justificationsDocumentedRate: number | null;
  refusedOrders: number;
}

export interface WelfareReviewQualityResult {
  overallScore: number; // 0-25
  totalReviews: number;
  /** null when the population is empty — nothing measured, not 0%. */
  timelinessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childAttendanceRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  alternativesConsideredRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recommendationsActionedRate: number | null;
  averageParticipantTypes: number;
}

export interface ChildWelfareResult {
  overallScore: number; // 0-25
  totalChildren: number;
  /** null when the population is empty — nothing measured, not 0%. */
  educationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  educationHoursAdequateRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  familyContactRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  healthNeedsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  outsideTimeAdequateRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  privacyRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  complaintsAvailableRate: number | null;
}

export interface DischargePreparednessResult {
  overallScore: number; // 0-20
  totalAssessments: number;
  /** null when the population is empty — nothing measured, not 0%. */
  transitionPlanRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  receivingPlacementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  supportNetworkRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  riskManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewsRate: number | null;
}

export interface ChildSecureProfile {
  childId: string;
  childName: string;
  hasActiveOrder: boolean;
  orderStatus: SecureOrderStatus | "none";
  reviewsCompleted: number;
  latestProgress: ProgressOutcome | "none";
  dischargeReadiness: DischargeReadiness | "not_assessed";
  overallScore: number; // 0-10
}

export interface SecureAccommodationIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  orderCompliance: OrderComplianceResult;
  welfareReviewQuality: WelfareReviewQualityResult;
  childWelfare: ChildWelfareResult;
  dischargePreparedness: DischargePreparednessResult;
  childProfiles: ChildSecureProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Functions ──────────────────────────────────────────────────────────

const SECURE_ORDER_STATUS_LABELS: Record<SecureOrderStatus, string> = {
  active: "Active",
  expired: "Expired",
  pending: "Pending",
  refused: "Refused",
  not_required: "Not Required",
  revoked: "Revoked",
};

const WELFARE_REVIEW_STATUS_LABELS: Record<WelfareReviewStatus, string> = {
  completed_on_time: "Completed on Time",
  completed_late: "Completed Late",
  overdue: "Overdue",
  not_due: "Not Due",
};

const REVIEW_PARTICIPANT_LABELS: Record<ReviewParticipant, string> = {
  child: "Child",
  parent: "Parent",
  social_worker: "Social Worker",
  iro: "Independent Reviewing Officer",
  advocate: "Advocate",
  legal_representative: "Legal Representative",
  guardian: "Guardian",
};

const RESTRICTION_JUSTIFICATION_LABELS: Record<RestrictionJustification, string> = {
  risk_to_self: "Risk to Self",
  risk_to_others: "Risk to Others",
  absconding_risk: "Absconding Risk",
  criminal_activity: "Criminal Activity",
  exploitation_risk: "Exploitation Risk",
};

const PROGRESS_OUTCOME_LABELS: Record<ProgressOutcome, string> = {
  positive_progress: "Positive Progress",
  stable: "Stable",
  deteriorating: "Deteriorating",
  insufficient_evidence: "Insufficient Evidence",
};

const DISCHARGE_READINESS_LABELS: Record<DischargeReadiness, string> = {
  ready: "Ready",
  nearly_ready: "Nearly Ready",
  not_ready: "Not Ready",
  requires_assessment: "Requires Assessment",
};

export function getSecureOrderStatusLabel(s: SecureOrderStatus): string {
  return SECURE_ORDER_STATUS_LABELS[s] ?? s;
}

export function getWelfareReviewStatusLabel(s: WelfareReviewStatus): string {
  return WELFARE_REVIEW_STATUS_LABELS[s] ?? s;
}

export function getReviewParticipantLabel(p: ReviewParticipant): string {
  return REVIEW_PARTICIPANT_LABELS[p] ?? p;
}

export function getRestrictionJustificationLabel(j: RestrictionJustification): string {
  return RESTRICTION_JUSTIFICATION_LABELS[j] ?? j;
}

export function getProgressOutcomeLabel(o: ProgressOutcome): string {
  return PROGRESS_OUTCOME_LABELS[o] ?? o;
}

export function getDischargeReadinessLabel(r: DischargeReadiness): string {
  return DISCHARGE_READINESS_LABELS[r] ?? r;
}

// ── Utility ──────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluation Functions ─────────────────────────────────────────────────────

/**
 * Evaluates order compliance for all secure accommodation orders.
 * Max score: 30
 *
 * +10 all s25 criteria documented
 * +8  all least restrictive considered
 * +5  no expired without renewal
 * +4  all justifications documented
 * +3  no refused orders
 */
export function evaluateOrderCompliance(
  orders: SecureAccommodationOrder[],
): OrderComplianceResult {
  const total = orders.length;
  const active = orders.filter((o) => o.orderStatus === "active");

  if (total === 0) {
    // No orders — no s25 restrictions needed — excellent position
    return {
      overallScore: 30,
      totalOrders: 0,
      activeOrders: 0,
      s25CriteriaRate: 100,
      leastRestrictiveRate: 100,
      expiredWithoutRenewal: 0,
      justificationsDocumentedRate: 100,
      refusedOrders: 0,
    };
  }

  let score = 0;

  // s25 criteria documented rate
  const s25Documented = orders.filter((o) => o.s25CriteriaDocumented);
  const s25Rate = rate(s25Documented.length, total);
  // +10 for all documented
  if (s25Rate === 100) score += 10;

  // Least restrictive considered rate
  const leastRestrictive = orders.filter((o) => o.leastRestrictiveConsidered);
  const leastRestrictiveRate = rate(leastRestrictive.length, total);
  // +8 for all considered
  if (leastRestrictiveRate === 100) score += 8;

  // Expired without renewal
  const expired = orders.filter((o) => o.orderStatus === "expired");
  const expiredWithoutRenewal = expired.length;
  // +5 if no expired without renewal
  if (expiredWithoutRenewal === 0) score += 5;

  // Justifications documented rate (every order must have at least 1 justification)
  const justificationsDocumented = orders.filter(
    (o) => o.justification.length > 0,
  );
  const justificationsDocumentedRate = rate(justificationsDocumented.length, total);
  // +4 for all documented
  if (justificationsDocumentedRate === 100) score += 4;

  // Refused orders
  const refused = orders.filter((o) => o.orderStatus === "refused");
  const refusedOrders = refused.length;
  // +3 for no refused orders
  if (refusedOrders === 0) score += 3;

  return {
    overallScore: Math.min(score, 30),
    totalOrders: total,
    activeOrders: active.length,
    s25CriteriaRate: s25Rate,
    leastRestrictiveRate,
    expiredWithoutRenewal,
    justificationsDocumentedRate,
    refusedOrders,
  };
}

/**
 * Evaluates welfare review quality.
 * Max score: 25
 *
 * +6  review timeliness >= 90%
 * +4  child views rate >= 90%
 * +4  child attendance >= 80%
 * +4  alternatives considered rate
 * +4  recommendations actioned rate >= 80%
 * +3  participant variety (avg >= 4 types)
 */
export function evaluateWelfareReviewQuality(
  reviews: WelfareReview[],
): WelfareReviewQualityResult {
  if (reviews.length === 0) {
    return {
      overallScore: 25,
      totalReviews: 0,
      timelinessRate: 100,
      childViewsRate: 100,
      childAttendanceRate: 100,
      alternativesConsideredRate: 100,
      recommendationsActionedRate: 100,
      averageParticipantTypes: 0,
    };
  }

  let score = 0;
  const total = reviews.length;

  // Review timeliness: completed_on_time or not_due count as timely
  const timely = reviews.filter(
    (r) => r.status === "completed_on_time" || r.status === "not_due",
  );
  const timelinessRate = rate(timely.length, total);
  // +6 for >= 90%
  if (meets(timelinessRate, 90)) score += 6;

  // Child views recorded rate
  const childViews = reviews.filter((r) => r.childViewsRecorded);
  const childViewsRate = rate(childViews.length, total);
  // +4 for >= 90%
  if (meets(childViewsRate, 90)) score += 4;

  // Child attendance rate
  const childAttended = reviews.filter((r) => r.childAttended);
  const childAttendanceRate = rate(childAttended.length, total);
  // +4 for >= 80%
  if (meets(childAttendanceRate, 80)) score += 4;

  // Alternatives considered rate
  const alternativesConsidered = reviews.filter((r) => r.alternativesConsidered);
  const alternativesConsideredRate = rate(alternativesConsidered.length, total);
  // +4 for >= 90%  (using 90% as threshold for full marks, 0 otherwise)
  if (meets(alternativesConsideredRate, 90)) score += 4;

  // Recommendations actioned rate
  const totalRecommendationsMade = reviews.reduce(
    (sum, r) => sum + r.recommendationsMade,
    0,
  );
  const totalRecommendationsActioned = reviews.reduce(
    (sum, r) => sum + r.recommendationsActioned,
    0,
  );
  const recommendationsActionedRate = rate(
    totalRecommendationsActioned,
    totalRecommendationsMade,
  );
  // +4 for >= 80%
  if (meets(recommendationsActionedRate, 80)) score += 4;

  // Participant variety
  const totalParticipantTypes = reviews.reduce(
    (sum, r) => sum + new Set(r.participants).size,
    0,
  );
  const averageParticipantTypes =
    Math.round((totalParticipantTypes / total) * 10) / 10;
  // +3 for avg >= 4 types
  if (averageParticipantTypes >= 4) score += 3;

  return {
    overallScore: Math.min(score, 25),
    totalReviews: total,
    timelinessRate,
    childViewsRate,
    childAttendanceRate,
    alternativesConsideredRate,
    recommendationsActionedRate,
    averageParticipantTypes,
  };
}

/**
 * Evaluates child welfare within secure accommodation.
 * Max score: 25
 *
 * +4  education 100%
 * +3  education hours >= 15/week
 * +4  therapeutic support
 * +3  family contact
 * +3  health needs
 * +3  outside time >= 60min
 * +3  privacy
 * +2  complaints available
 */
export function evaluateChildWelfare(
  welfare: ChildWelfare[],
): ChildWelfareResult {
  if (welfare.length === 0) {
    return {
      overallScore: 25,
      totalChildren: 0,
      educationRate: 100,
      educationHoursAdequateRate: 100,
      therapeuticSupportRate: 100,
      familyContactRate: 100,
      healthNeedsRate: 100,
      outsideTimeAdequateRate: 100,
      privacyRate: 100,
      complaintsAvailableRate: 100,
    };
  }

  let score = 0;
  const total = welfare.length;

  // Education provided rate
  const educationProvided = welfare.filter((w) => w.educationProvided);
  const educationRate = rate(educationProvided.length, total);
  // +4 for 100%
  if (educationRate === 100) score += 4;

  // Education hours adequate (>= 15 hrs/week)
  const educationHoursAdequate = welfare.filter(
    (w) => w.educationHoursPerWeek >= 15,
  );
  const educationHoursAdequateRate = rate(educationHoursAdequate.length, total);
  // +3 for 100%  (match spec: "+3 education hours >= 15/week" — means all meet threshold)
  if (educationHoursAdequateRate === 100) score += 3;

  // Therapeutic support
  const therapeuticSupport = welfare.filter((w) => w.therapeuticSupportInPlace);
  const therapeuticSupportRate = rate(therapeuticSupport.length, total);
  // +4 for 100%
  if (therapeuticSupportRate === 100) score += 4;

  // Family contact maintained
  const familyContact = welfare.filter((w) => w.familyContactMaintained);
  const familyContactRate = rate(familyContact.length, total);
  // +3 for 100%
  if (familyContactRate === 100) score += 3;

  // Health needs met
  const healthNeeds = welfare.filter((w) => w.healthNeedsMet);
  const healthNeedsRate = rate(healthNeeds.length, total);
  // +3 for 100%
  if (healthNeedsRate === 100) score += 3;

  // Outside time >= 60 min
  const outsideTimeAdequate = welfare.filter(
    (w) => w.outsideTimeMinutesPerDay >= 60,
  );
  const outsideTimeAdequateRate = rate(outsideTimeAdequate.length, total);
  // +3 for 100%
  if (outsideTimeAdequateRate === 100) score += 3;

  // Privacy respected
  const privacyRespected = welfare.filter((w) => w.privacyRespected);
  const privacyRate = rate(privacyRespected.length, total);
  // +3 for 100%
  if (privacyRate === 100) score += 3;

  // Complaints mechanism available
  const complaintsAvailable = welfare.filter(
    (w) => w.complaintsMechanismAvailable,
  );
  const complaintsAvailableRate = rate(complaintsAvailable.length, total);
  // +2 for 100%
  if (complaintsAvailableRate === 100) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalChildren: total,
    educationRate,
    educationHoursAdequateRate,
    therapeuticSupportRate,
    familyContactRate,
    healthNeedsRate,
    outsideTimeAdequateRate,
    privacyRate,
    complaintsAvailableRate,
  };
}

/**
 * Evaluates discharge preparedness.
 * Max score: 20
 *
 * +5  transition plans rate
 * +4  receiving placements identified
 * +4  support networks mapped
 * +4  risk management updated
 * +3  child views on discharge
 */
export function evaluateDischargePreparedness(
  assessments: DischargeAssessment[],
): DischargePreparednessResult {
  if (assessments.length === 0) {
    return {
      overallScore: 20,
      totalAssessments: 0,
      transitionPlanRate: 100,
      receivingPlacementRate: 100,
      supportNetworkRate: 100,
      riskManagementRate: 100,
      childViewsRate: 100,
    };
  }

  let score = 0;
  const total = assessments.length;

  // Transition plan rate
  const transitionPlans = assessments.filter((a) => a.transitionPlanInPlace);
  const transitionPlanRate = rate(transitionPlans.length, total);
  // +5 for 100%
  if (transitionPlanRate === 100) score += 5;

  // Receiving placement identified rate
  const receivingPlacements = assessments.filter(
    (a) => a.receivingPlacementIdentified,
  );
  const receivingPlacementRate = rate(receivingPlacements.length, total);
  // +4 for 100%
  if (receivingPlacementRate === 100) score += 4;

  // Support network mapped rate
  const supportNetworks = assessments.filter((a) => a.supportNetworkMapped);
  const supportNetworkRate = rate(supportNetworks.length, total);
  // +4 for 100%
  if (supportNetworkRate === 100) score += 4;

  // Risk management plan updated rate
  const riskManagement = assessments.filter(
    (a) => a.riskManagementPlanUpdated,
  );
  const riskManagementRate = rate(riskManagement.length, total);
  // +4 for 100%
  if (riskManagementRate === 100) score += 4;

  // Child views on discharge rate
  const childViews = assessments.filter((a) => a.childViewsOnDischarge);
  const childViewsRate = rate(childViews.length, total);
  // +3 for 100%
  if (childViewsRate === 100) score += 3;

  return {
    overallScore: Math.min(score, 20),
    totalAssessments: total,
    transitionPlanRate,
    receivingPlacementRate,
    supportNetworkRate,
    riskManagementRate,
    childViewsRate,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildSecureProfiles(
  orders: SecureAccommodationOrder[],
  reviews: WelfareReview[],
  dischargeAssessments: DischargeAssessment[],
): ChildSecureProfile[] {
  // Collect all unique children mentioned across all data sources
  const childMap = new Map<string, string>();
  for (const o of orders) {
    childMap.set(o.childId, o.childName);
  }

  const childIds = [...childMap.keys()];

  return childIds.map((childId) => {
    const childOrders = orders.filter((o) => o.childId === childId);
    const childReviews = reviews.filter((r) => r.childId === childId);
    const childDischarge = dischargeAssessments.filter(
      (d) => d.childId === childId,
    );

    const activeOrder = childOrders.find((o) => o.orderStatus === "active");
    const hasActiveOrder = !!activeOrder;
    const orderStatus: SecureOrderStatus | "none" = activeOrder
      ? activeOrder.orderStatus
      : childOrders.length > 0
        ? childOrders[childOrders.length - 1].orderStatus
        : "none";

    // Latest review's progress
    const sortedReviews = [...childReviews].sort(
      (a, b) =>
        new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime(),
    );
    const latestProgress: ProgressOutcome | "none" =
      sortedReviews.length > 0 ? sortedReviews[0].progressOutcome : "none";

    // Latest discharge assessment
    const sortedDischarge = [...childDischarge].sort(
      (a, b) =>
        new Date(b.assessmentDate).getTime() -
        new Date(a.assessmentDate).getTime(),
    );
    const dischargeReadiness: DischargeReadiness | "not_assessed" =
      sortedDischarge.length > 0 ? sortedDischarge[0].readiness : "not_assessed";

    // Score 0-10
    let profileScore = 5;
    if (hasActiveOrder) {
      // Child has active order — score based on compliance quality
      if (activeOrder.s25CriteriaDocumented) profileScore += 1;
      if (activeOrder.leastRestrictiveConsidered) profileScore += 1;
    } else {
      // No active order — positive outcome
      profileScore += 2;
    }
    if (
      latestProgress === "positive_progress" ||
      latestProgress === "stable"
    )
      profileScore += 1;
    if (latestProgress === "deteriorating") profileScore -= 2;
    if (dischargeReadiness === "ready" || dischargeReadiness === "nearly_ready")
      profileScore += 1;
    if (childReviews.length > 0) profileScore += 1;

    return {
      childId,
      childName: childMap.get(childId) || childId,
      hasActiveOrder,
      orderStatus,
      reviewsCompleted: childReviews.length,
      latestProgress,
      dischargeReadiness,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  order: OrderComplianceResult,
  review: WelfareReviewQualityResult,
  welfare: ChildWelfareResult,
  discharge: DischargePreparednessResult,
): string[] {
  const strengths: string[] = [];

  if (order.totalOrders === 0) {
    strengths.push(
      "No secure accommodation orders in place — children cared for without restriction of liberty",
    );
  }

  if (order.s25CriteriaRate === 100 && order.totalOrders > 0) {
    strengths.push(
      "Full s25 criteria documentation across all orders — strong legal compliance",
    );
  }

  if (order.leastRestrictiveRate === 100 && order.totalOrders > 0) {
    strengths.push(
      "Least restrictive alternatives considered for all orders — rights-based approach embedded",
    );
  }

  if (meets(review.timelinessRate, 90) && review.totalReviews > 0) {
    strengths.push(
      "Excellent welfare review timeliness — reviews consistently completed on schedule",
    );
  }

  if (meets(review.childViewsRate, 90) && review.totalReviews > 0) {
    strengths.push(
      "Strong child participation — views recorded in the majority of welfare reviews",
    );
  }

  if (meets(review.childAttendanceRate, 80) && review.totalReviews > 0) {
    strengths.push(
      "Good child attendance at welfare reviews — young people actively involved in decisions",
    );
  }

  if (meets(review.recommendationsActionedRate, 80) && review.totalReviews > 0) {
    strengths.push(
      "High rate of review recommendations actioned — demonstrating responsive care",
    );
  }

  if (welfare.educationRate === 100 && welfare.totalChildren > 0) {
    strengths.push(
      "Education provided to all children in secure accommodation — statutory entitlement met",
    );
  }

  if (welfare.therapeuticSupportRate === 100 && welfare.totalChildren > 0) {
    strengths.push(
      "Therapeutic support in place for all children — addressing underlying needs",
    );
  }

  if (discharge.transitionPlanRate === 100 && discharge.totalAssessments > 0) {
    strengths.push(
      "Transition plans in place for all assessed children — strong discharge planning",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  order: OrderComplianceResult,
  review: WelfareReviewQualityResult,
  welfare: ChildWelfareResult,
  discharge: DischargePreparednessResult,
): string[] {
  const areas: string[] = [];

  if (order.expiredWithoutRenewal > 0) {
    areas.push(
      `${order.expiredWithoutRenewal} expired order(s) without renewal — potential unlawful detention`,
    );
  }

  if (below(order.s25CriteriaRate, 100) && order.totalOrders > 0) {
    areas.push(
      `s25 criteria documented for only ${order.s25CriteriaRate}% of orders — full documentation required`,
    );
  }

  if (below(order.leastRestrictiveRate, 100) && order.totalOrders > 0) {
    areas.push(
      `Least restrictive alternatives considered for only ${order.leastRestrictiveRate}% of orders`,
    );
  }

  if (order.refusedOrders > 0) {
    areas.push(
      `${order.refusedOrders} refused order(s) — review criteria and application quality`,
    );
  }

  if (below(review.timelinessRate, 90) && review.totalReviews > 0) {
    areas.push(
      `Welfare review timeliness at ${review.timelinessRate}% — below 90% target`,
    );
  }

  if (below(review.childViewsRate, 90) && review.totalReviews > 0) {
    areas.push(
      `Child views recorded in only ${review.childViewsRate}% of reviews — UNCRC Art 12 requires participation`,
    );
  }

  if (below(review.alternativesConsideredRate, 90) && review.totalReviews > 0) {
    areas.push(
      `Alternatives to secure accommodation considered in only ${review.alternativesConsideredRate}% of reviews`,
    );
  }

  if (below(welfare.educationRate, 100) && welfare.totalChildren > 0) {
    areas.push(
      `Education not provided to all children — ${welfare.educationRate}% receiving education`,
    );
  }

  if (below(welfare.outsideTimeAdequateRate, 100) && welfare.totalChildren > 0) {
    areas.push(
      `Outside time below 60 minutes/day for some children — ${welfare.outsideTimeAdequateRate}% meeting threshold`,
    );
  }

  if (below(discharge.transitionPlanRate, 100) && discharge.totalAssessments > 0) {
    areas.push(
      `Transition plans in place for only ${discharge.transitionPlanRate}% of discharge assessments`,
    );
  }

  return areas;
}

function generateActions(
  order: OrderComplianceResult,
  review: WelfareReviewQualityResult,
  welfare: ChildWelfareResult,
  discharge: DischargePreparednessResult,
): string[] {
  const actions: string[] = [];

  if (order.expiredWithoutRenewal > 0) {
    actions.push(
      "URGENT: Address expired secure accommodation orders — seek renewal or release child immediately",
    );
  }

  if (below(order.s25CriteriaRate, 100) && order.totalOrders > 0) {
    actions.push(
      "Complete s25 criteria documentation for all current secure accommodation orders",
    );
  }

  if (below(order.leastRestrictiveRate, 100) && order.totalOrders > 0) {
    actions.push(
      "Document least restrictive alternative considerations for all orders as required by ECHR Art 5",
    );
  }

  if (below(review.timelinessRate, 90) && review.totalReviews > 0) {
    actions.push(
      "Implement welfare review scheduling system to ensure timely completion of all statutory reviews",
    );
  }

  if (below(review.childViewsRate, 90) && review.totalReviews > 0) {
    actions.push(
      "Develop child participation strategy for welfare reviews — ensure views are routinely sought and recorded",
    );
  }

  if (below(review.recommendationsActionedRate, 80) && review.totalReviews > 0) {
    actions.push(
      "Establish tracking system for welfare review recommendations to improve actioning rate",
    );
  }

  if (below(welfare.educationRate, 100) && welfare.totalChildren > 0) {
    actions.push(
      "Ensure education provision for all children in secure accommodation — statutory requirement",
    );
  }

  if (below(welfare.therapeuticSupportRate, 100) && welfare.totalChildren > 0) {
    actions.push(
      "Arrange therapeutic support for all children — secure accommodation should address underlying needs",
    );
  }

  if (below(welfare.outsideTimeAdequateRate, 100) && welfare.totalChildren > 0) {
    actions.push(
      "Review daily routines to ensure all children receive minimum 60 minutes outside time",
    );
  }

  if (below(discharge.transitionPlanRate, 100) && discharge.totalAssessments > 0) {
    actions.push(
      "Develop transition plans for all children approaching discharge from secure accommodation",
    );
  }

  if (below(discharge.childViewsRate, 100) && discharge.totalAssessments > 0) {
    actions.push(
      "Ensure all children have opportunity to express views on their discharge and transition planning",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateSecureAccommodationIntelligence(
  orders: SecureAccommodationOrder[],
  reviews: WelfareReview[],
  welfare: ChildWelfare[],
  dischargeAssessments: DischargeAssessment[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SecureAccommodationIntelligence {
  const orderResult = evaluateOrderCompliance(orders);
  const reviewResult = evaluateWelfareReviewQuality(reviews);
  const welfareResult = evaluateChildWelfare(welfare);
  const dischargeResult = evaluateDischargePreparedness(dischargeAssessments);

  const overallScore =
    orderResult.overallScore +
    reviewResult.overallScore +
    welfareResult.overallScore +
    dischargeResult.overallScore;

  const childProfiles = buildChildSecureProfiles(
    orders,
    reviews,
    dischargeAssessments,
  );

  const strengths = generateStrengths(
    orderResult,
    reviewResult,
    welfareResult,
    dischargeResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    orderResult,
    reviewResult,
    welfareResult,
    dischargeResult,
  );
  const actions = generateActions(
    orderResult,
    reviewResult,
    welfareResult,
    dischargeResult,
  );

  const regulatoryLinks = [
    "Children Act 1989 s25 — use of accommodation for restricting liberty",
    "The Children (Secure Accommodation) Regulations 1991 — procedural requirements",
    "CHR 2015 Reg 20 — restraint and deprivation of liberty in children's homes",
    "UNCRC Article 37 — deprivation of liberty only as last resort and for shortest time",
    "ECHR Article 5 — right to liberty and security of person",
    "Secure Children's Homes — National Minimum Standards",
    "SCCIF — Social Care Common Inspection Framework for secure settings",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    orderCompliance: orderResult,
    welfareReviewQuality: reviewResult,
    childWelfare: welfareResult,
    dischargePreparedness: dischargeResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
