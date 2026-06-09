// ══════════════════════════════════════════════════════════════════════════════
// COURT ORDER COMPLIANCE INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how effectively a children's home
// ensures compliance with court orders, condition monitoring, legal engagement,
// and staff legal knowledge.
//
// Regulatory basis:
//   - Children Act 1989, s31 — Care orders and supervision orders
//   - Children Act 1989, s22 — General duty of local authority to looked after children
//   - CHR 2015, Reg 36 — Notifiable events: reporting breaches to Ofsted
//   - SCCIF — Effectiveness of leaders and managers: legal compliance
//   - Human Rights Act 1998 — Article 8 right to family life, proportionality
//   - UNCRC Article 3 — Best interests of the child
//   - Care Planning Regulations 2010 — Review and compliance requirements
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type OrderType =
  | "care_order"
  | "interim_care_order"
  | "placement_order"
  | "supervision_order"
  | "child_arrangements_order"
  | "special_guardianship_order"
  | "secure_accommodation_order"
  | "emergency_protection_order";

export type ComplianceStatus =
  | "fully_compliant"
  | "substantially_compliant"
  | "partially_compliant"
  | "non_compliant";

export type ConditionType =
  | "contact_frequency"
  | "education_provision"
  | "health_assessment"
  | "therapy_attendance"
  | "living_arrangements"
  | "supervision_requirements"
  | "reporting_obligations"
  | "review_attendance";

export type ReviewStatus =
  | "completed_on_time"
  | "completed_late"
  | "overdue"
  | "not_due";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface OrderCondition {
  conditionType: ConditionType;
  description: string;
  complianceStatus: ComplianceStatus;
  lastEvidenced: string; // ISO date
}

export interface CourtOrder {
  id: string;
  childId: string;
  childName: string;
  orderType: OrderType;
  dateGranted: string; // ISO date
  expiryDate: string | null;
  isActive: boolean;
  conditions: OrderCondition[];
  lastReviewDate: string; // ISO date
  nextReviewDue: string; // ISO date
  socialWorkerAssigned: boolean;
  localAuthority: string;
}

export interface OrderConditionReview {
  id: string;
  orderId: string;
  childId: string;
  childName: string;
  reviewDate: string; // ISO date
  conditionsReviewed: number;
  conditionsMet: number;
  reviewOutcome: "all_met" | "mostly_met" | "some_concerns" | "significant_concerns";
  reviewerName: string;
}

export interface LegalMeeting {
  id: string;
  childId: string;
  childName: string;
  meetingDate: string; // ISO date
  meetingType: "lac_review" | "court_hearing" | "legal_planning" | "advocacy_meeting" | "placement_review";
  attendedByHome: boolean;
  childParticipated: boolean;
  minutesRecorded: boolean;
  actionsAgreed: number;
}

export interface LegalTraining {
  id: string;
  staffId: string;
  staffName: string;
  trainingDate: string; // ISO date
  courtOrderAwareness: boolean;
  childrenActKnowledge: boolean;
  humanRightsTraining: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface OrderComplianceResult {
  totalOrders: number;
  activeOrders: number;
  totalConditions: number;
  fullyCompliantConditions: number;
  fullyCompliantRate: number;
  substantiallyCompliantConditions: number;
  partiallyCompliantConditions: number;
  nonCompliantConditions: number;
  activeOrdersReviewed: number;
  activeOrdersReviewedRate: number;
  conditionsEvidenced: number;
  conditionsEvidencedRate: number;
  noNonCompliant: boolean;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ReviewTimelinessResult {
  totalReviews: number;
  onTimeReviews: number;
  onTimeRate: number;
  allMetReviews: number;
  allMetRate: number;
  concernsReviews: number;
  concernsRate: number;
  childrenCovered: number;
  totalChildren: number;
  coverageRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface LegalEngagementResult {
  totalMeetings: number;
  homeAttendance: number;
  homeAttendanceRate: number;
  childParticipation: number;
  childParticipationRate: number;
  minutesRecorded: number;
  minutesRecordedRate: number;
  actionsAgreed: number;
  meetingTypeBreakdown: Record<string, number>;
  meetingTypeCount: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface StaffLegalKnowledgeResult {
  totalStaff: number;
  courtOrderAwarenessCount: number;
  courtOrderAwarenessRate: number;
  childrenActKnowledgeCount: number;
  childrenActKnowledgeRate: number;
  humanRightsTrainingCount: number;
  humanRightsTrainingRate: number;
  allThreeCount: number;
  allThreeRate: number;
  score: number; // 0-25
  strengths: string[];
  concerns: string[];
}

export interface ChildOrderProfile {
  childId: string;
  childName: string;
  orders: CourtOrder[];
  activeOrderCount: number;
  totalConditions: number;
  fullyCompliantConditions: number;
  complianceRate: number;
  reviewsConducted: number;
  meetingsAttended: number;
  overallScore: number; // 0-10
}

export interface CourtOrderComplianceIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  orderCompliance: OrderComplianceResult;
  reviewTimeliness: ReviewTimelinessResult;
  legalEngagement: LegalEngagementResult;
  staffLegalKnowledge: StaffLegalKnowledgeResult;
  childOrderProfiles: ChildOrderProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Calculate percentage, returning 0 if denominator is 0. */
export function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

/** Map overall score (0-100) to Ofsted-style rating. */
export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Label Functions ────────────────────────────────────────────────────────

export function getOrderTypeLabel(type: OrderType): string {
  const labels: Record<OrderType, string> = {
    care_order: "Care Order (s31)",
    interim_care_order: "Interim Care Order (s38)",
    placement_order: "Placement Order",
    supervision_order: "Supervision Order",
    child_arrangements_order: "Child Arrangements Order",
    special_guardianship_order: "Special Guardianship Order",
    secure_accommodation_order: "Secure Accommodation Order (s25)",
    emergency_protection_order: "Emergency Protection Order (s44)",
  };
  return labels[type] || type;
}

export function getComplianceStatusLabel(status: ComplianceStatus): string {
  const labels: Record<ComplianceStatus, string> = {
    fully_compliant: "Fully Compliant",
    substantially_compliant: "Substantially Compliant",
    partially_compliant: "Partially Compliant",
    non_compliant: "Non-Compliant",
  };
  return labels[status] || status;
}

export function getConditionTypeLabel(type: ConditionType): string {
  const labels: Record<ConditionType, string> = {
    contact_frequency: "Contact Frequency",
    education_provision: "Education Provision",
    health_assessment: "Health Assessment",
    therapy_attendance: "Therapy Attendance",
    living_arrangements: "Living Arrangements",
    supervision_requirements: "Supervision Requirements",
    reporting_obligations: "Reporting Obligations",
    review_attendance: "Review Attendance",
  };
  return labels[type] || type;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] || rating;
}

// ── Core Function 1: Evaluate Order Compliance ─────────────────────────────

export function evaluateOrderCompliance(
  orders: CourtOrder[],
): OrderComplianceResult {
  if (orders.length === 0) {
    return {
      totalOrders: 0,
      activeOrders: 0,
      totalConditions: 0,
      fullyCompliantConditions: 0,
      fullyCompliantRate: 0,
      substantiallyCompliantConditions: 0,
      partiallyCompliantConditions: 0,
      nonCompliantConditions: 0,
      activeOrdersReviewed: 0,
      activeOrdersReviewedRate: 0,
      conditionsEvidenced: 0,
      conditionsEvidencedRate: 0,
      noNonCompliant: false,
      score: 0,
      strengths: [],
      concerns: ["No court orders on file — all looked-after children should have legal orders recorded"],
    };
  }

  const activeOrders = orders.filter((o) => o.isActive);
  const allConditions = orders.flatMap((o) => o.conditions);
  const totalConditions = allConditions.length;

  const fullyCompliantConditions = allConditions.filter(
    (c) => c.complianceStatus === "fully_compliant",
  ).length;
  const substantiallyCompliantConditions = allConditions.filter(
    (c) => c.complianceStatus === "substantially_compliant",
  ).length;
  const partiallyCompliantConditions = allConditions.filter(
    (c) => c.complianceStatus === "partially_compliant",
  ).length;
  const nonCompliantConditions = allConditions.filter(
    (c) => c.complianceStatus === "non_compliant",
  ).length;

  const fullyCompliantRate = pct(fullyCompliantConditions, totalConditions);

  // Active orders that have been reviewed (lastReviewDate is set and non-empty)
  const activeOrdersReviewed = activeOrders.filter(
    (o) => o.lastReviewDate && o.lastReviewDate.length > 0,
  ).length;
  const activeOrdersReviewedRate = pct(activeOrdersReviewed, activeOrders.length);

  // Conditions with evidence (lastEvidenced is set and non-empty)
  const conditionsEvidenced = allConditions.filter(
    (c) => c.lastEvidenced && c.lastEvidenced.length > 0,
  ).length;
  const conditionsEvidencedRate = pct(conditionsEvidenced, totalConditions);

  const noNonCompliant = nonCompliantConditions === 0;

  // Score (out of 25)
  // Fully compliant rate: 0-8
  const complianceScore = (fullyCompliantRate / 100) * 8;
  // Active orders reviewed rate: 0-6
  const reviewedScore = (activeOrdersReviewedRate / 100) * 6;
  // Conditions evidenced rate: 0-5
  const evidencedScore = (conditionsEvidencedRate / 100) * 5;
  // No non-compliant bonus: 0-6
  const noNonCompliantBonus = noNonCompliant ? 6 : Math.max(0, 6 - nonCompliantConditions * 2);

  let score = complianceScore + reviewedScore + evidencedScore + noNonCompliantBonus;
  score = Math.min(25, Math.max(0, Math.round(score * 10) / 10));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (fullyCompliantRate >= 90) {
    strengths.push(
      "Excellent court order compliance: " + fullyCompliantRate + "% of conditions fully compliant",
    );
  } else if (fullyCompliantRate < 70) {
    concerns.push(
      "Court order compliance at " + fullyCompliantRate + "% — below the expected standard for looked-after children",
    );
  }

  if (activeOrdersReviewedRate === 100 && activeOrders.length > 0) {
    strengths.push(
      "All active court orders have been reviewed, demonstrating robust oversight",
    );
  } else if (activeOrdersReviewedRate < 80) {
    concerns.push(
      "Only " + activeOrdersReviewedRate + "% of active orders reviewed — Care Planning Regulations require regular review",
    );
  }

  if (conditionsEvidencedRate >= 90) {
    strengths.push(
      "Strong evidence base: " + conditionsEvidencedRate + "% of conditions have recent evidence recorded",
    );
  } else if (conditionsEvidencedRate < 70) {
    concerns.push(
      "Only " + conditionsEvidencedRate + "% of conditions evidenced — gaps in evidence undermine compliance assurance",
    );
  }

  if (nonCompliantConditions > 0) {
    concerns.push(
      nonCompliantConditions + " condition(s) rated non-compliant — potential breach of court order requiring immediate action",
    );
  }

  if (noNonCompliant && totalConditions > 0) {
    strengths.push(
      "No non-compliant conditions across all court orders — strong legal compliance",
    );
  }

  return {
    totalOrders: orders.length,
    activeOrders: activeOrders.length,
    totalConditions,
    fullyCompliantConditions,
    fullyCompliantRate,
    substantiallyCompliantConditions,
    partiallyCompliantConditions,
    nonCompliantConditions,
    activeOrdersReviewed,
    activeOrdersReviewedRate,
    conditionsEvidenced,
    conditionsEvidencedRate,
    noNonCompliant,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 2: Evaluate Review Timeliness ────────────────────────────

export function evaluateReviewTimeliness(
  reviews: OrderConditionReview[],
  childIds: string[],
): ReviewTimelinessResult {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      onTimeReviews: 0,
      onTimeRate: 0,
      allMetReviews: 0,
      allMetRate: 0,
      concernsReviews: 0,
      concernsRate: 0,
      childrenCovered: 0,
      totalChildren: childIds.length,
      coverageRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No condition reviews conducted — court order conditions must be regularly reviewed"],
    };
  }

  // On-time reviews: conditionsMet equals conditionsReviewed implies timely
  // We count reviews where all conditions were actually reviewed (conditionsReviewed > 0)
  const onTimeReviews = reviews.filter(
    (r) => r.conditionsReviewed > 0 && r.conditionsMet >= 0,
  ).length;
  const onTimeRate = pct(onTimeReviews, reviews.length);

  // All met reviews
  const allMetReviews = reviews.filter(
    (r) => r.reviewOutcome === "all_met",
  ).length;
  const allMetRate = pct(allMetReviews, reviews.length);

  // Concerns reviews (some_concerns or significant_concerns)
  const concernsReviews = reviews.filter(
    (r) => r.reviewOutcome === "some_concerns" || r.reviewOutcome === "significant_concerns",
  ).length;
  const concernsRate = pct(concernsReviews, reviews.length);

  // Coverage: how many children have at least one review
  const childrenWithReviews = new Set(reviews.map((r) => r.childId));
  const childrenCovered = childrenWithReviews.size;
  const totalChildren = childIds.length;
  const coverageRate = pct(childrenCovered, totalChildren);

  // Score (out of 25)
  // On-time rate: 0-8
  const onTimeScore = (onTimeRate / 100) * 8;
  // All-met rate: 0-6
  const allMetScore = (allMetRate / 100) * 6;
  // Concerns rate inversely: 0-5 (lower concerns = higher score)
  const concernsScore = ((100 - concernsRate) / 100) * 5;
  // Coverage: 0-6
  const coverageScore = (coverageRate / 100) * 6;

  let score = onTimeScore + allMetScore + concernsScore + coverageScore;
  score = Math.min(25, Math.max(0, Math.round(score * 10) / 10));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (onTimeRate >= 90) {
    strengths.push(
      "Excellent review completion: " + onTimeRate + "% of condition reviews conducted on time",
    );
  } else if (onTimeRate < 70) {
    concerns.push(
      "Review completion rate at " + onTimeRate + "% — timely reviews are essential for court order compliance",
    );
  }

  if (allMetRate >= 80) {
    strengths.push(
      allMetRate + "% of reviews found all conditions met — strong compliance culture",
    );
  } else if (allMetRate < 50) {
    concerns.push(
      "Only " + allMetRate + "% of reviews found all conditions met — significant compliance gaps identified",
    );
  }

  if (coverageRate === 100 && totalChildren > 0) {
    strengths.push(
      "All children have received condition reviews, ensuring comprehensive oversight",
    );
  } else if (coverageRate < 80) {
    concerns.push(
      "Only " + coverageRate + "% of children have received condition reviews — some children may have unmonitored conditions",
    );
  }

  if (concernsRate > 30) {
    concerns.push(
      concernsRate + "% of reviews raised concerns — patterns of non-compliance need investigation",
    );
  }

  return {
    totalReviews: reviews.length,
    onTimeReviews,
    onTimeRate,
    allMetReviews,
    allMetRate,
    concernsReviews,
    concernsRate,
    childrenCovered,
    totalChildren,
    coverageRate,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 3: Evaluate Legal Engagement ─────────────────────────────

export function evaluateLegalEngagement(
  meetings: LegalMeeting[],
): LegalEngagementResult {
  if (meetings.length === 0) {
    return {
      totalMeetings: 0,
      homeAttendance: 0,
      homeAttendanceRate: 0,
      childParticipation: 0,
      childParticipationRate: 0,
      minutesRecorded: 0,
      minutesRecordedRate: 0,
      actionsAgreed: 0,
      meetingTypeBreakdown: {},
      meetingTypeCount: 0,
      score: 0,
      strengths: [],
      concerns: ["No legal meetings recorded — engagement with legal processes is essential for looked-after children"],
    };
  }

  const homeAttendance = meetings.filter((m) => m.attendedByHome).length;
  const homeAttendanceRate = pct(homeAttendance, meetings.length);

  const childParticipation = meetings.filter((m) => m.childParticipated).length;
  const childParticipationRate = pct(childParticipation, meetings.length);

  const minutesRecorded = meetings.filter((m) => m.minutesRecorded).length;
  const minutesRecordedRate = pct(minutesRecorded, meetings.length);

  const actionsAgreed = meetings.reduce((sum, m) => sum + m.actionsAgreed, 0);

  // Meeting type breakdown
  const meetingTypeBreakdown: Record<string, number> = {};
  for (const m of meetings) {
    meetingTypeBreakdown[m.meetingType] = (meetingTypeBreakdown[m.meetingType] || 0) + 1;
  }
  const meetingTypeCount = Object.keys(meetingTypeBreakdown).length;

  // Score (out of 25)
  // Home attendance: 0-7
  const attendanceScore = (homeAttendanceRate / 100) * 7;
  // Child participation: 0-6
  const participationScore = (childParticipationRate / 100) * 6;
  // Minutes recorded: 0-5
  const minutesScore = (minutesRecordedRate / 100) * 5;
  // Actions agreed: 0-4 (capped — any positive count is good)
  const actionsScore = actionsAgreed > 0 ? Math.min(4, (actionsAgreed / (meetings.length * 3)) * 4) : 0;
  // Variety of meetings: 0-3
  const varietyScore = Math.min(3, (meetingTypeCount / 5) * 3);

  let score = attendanceScore + participationScore + minutesScore + actionsScore + varietyScore;
  score = Math.min(25, Math.max(0, Math.round(score * 10) / 10));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (homeAttendanceRate >= 90) {
    strengths.push(
      "Strong attendance at legal meetings: " + homeAttendanceRate + "% attended by the home",
    );
  } else if (homeAttendanceRate < 70) {
    concerns.push(
      "Home attendance at legal meetings at " + homeAttendanceRate + "% — consistent representation is required",
    );
  }

  if (childParticipationRate >= 80) {
    strengths.push(
      "Good child participation in legal processes: " + childParticipationRate + "% of meetings included the child's voice",
    );
  } else if (childParticipationRate < 60) {
    concerns.push(
      "Child participation at " + childParticipationRate + "% — UNCRC Article 12 requires children's views to be heard",
    );
  }

  if (minutesRecordedRate >= 90) {
    strengths.push(
      "Minutes consistently recorded (" + minutesRecordedRate + "%) — strong evidence base for legal proceedings",
    );
  } else if (minutesRecordedRate < 70) {
    concerns.push(
      "Minutes recorded for only " + minutesRecordedRate + "% of meetings — gaps in records undermine accountability",
    );
  }

  if (meetingTypeCount >= 4) {
    strengths.push(
      "Broad engagement across " + meetingTypeCount + " meeting types demonstrates comprehensive legal participation",
    );
  } else if (meetingTypeCount <= 1) {
    concerns.push(
      "Limited variety of legal meetings (only " + meetingTypeCount + " type) — broader engagement with legal processes needed",
    );
  }

  return {
    totalMeetings: meetings.length,
    homeAttendance,
    homeAttendanceRate,
    childParticipation,
    childParticipationRate,
    minutesRecorded,
    minutesRecordedRate,
    actionsAgreed,
    meetingTypeBreakdown,
    meetingTypeCount,
    score,
    strengths,
    concerns,
  };
}

// ── Core Function 4: Evaluate Staff Legal Knowledge ────────────────────────

export function evaluateStaffLegalKnowledge(
  training: LegalTraining[],
): StaffLegalKnowledgeResult {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      courtOrderAwarenessCount: 0,
      courtOrderAwarenessRate: 0,
      childrenActKnowledgeCount: 0,
      childrenActKnowledgeRate: 0,
      humanRightsTrainingCount: 0,
      humanRightsTrainingRate: 0,
      allThreeCount: 0,
      allThreeRate: 0,
      score: 0,
      strengths: [],
      concerns: ["No legal training records found — staff must understand the legal framework for looked-after children"],
    };
  }

  const n = training.length;

  const courtOrderAwarenessCount = training.filter((t) => t.courtOrderAwareness).length;
  const courtOrderAwarenessRate = pct(courtOrderAwarenessCount, n);

  const childrenActKnowledgeCount = training.filter((t) => t.childrenActKnowledge).length;
  const childrenActKnowledgeRate = pct(childrenActKnowledgeCount, n);

  const humanRightsTrainingCount = training.filter((t) => t.humanRightsTraining).length;
  const humanRightsTrainingRate = pct(humanRightsTrainingCount, n);

  const allThreeCount = training.filter(
    (t) => t.courtOrderAwareness && t.childrenActKnowledge && t.humanRightsTraining,
  ).length;
  const allThreeRate = pct(allThreeCount, n);

  // Score (out of 25)
  // Court order awareness: 0-7
  const awarenessScore = (courtOrderAwarenessRate / 100) * 7;
  // Children Act knowledge: 0-7
  const actScore = (childrenActKnowledgeRate / 100) * 7;
  // Human rights training: 0-6
  const humanRightsScore = (humanRightsTrainingRate / 100) * 6;
  // Overall all-three rate: 0-5
  const overallRate = (allThreeRate / 100) * 5;

  let score = awarenessScore + actScore + humanRightsScore + overallRate;
  score = Math.min(25, Math.max(0, Math.round(score * 10) / 10));

  // Insights
  const strengths: string[] = [];
  const concerns: string[] = [];

  if (courtOrderAwarenessRate >= 90) {
    strengths.push(
      "Strong court order awareness: " + courtOrderAwarenessRate + "% of staff trained",
    );
  } else if (courtOrderAwarenessRate < 70) {
    concerns.push(
      "Court order awareness at " + courtOrderAwarenessRate + "% — staff must understand the legal orders for children in their care",
    );
  }

  if (childrenActKnowledgeRate >= 90) {
    strengths.push(
      "Excellent Children Act knowledge: " + childrenActKnowledgeRate + "% of staff trained",
    );
  } else if (childrenActKnowledgeRate < 70) {
    concerns.push(
      "Children Act knowledge at " + childrenActKnowledgeRate + "% — foundational legal knowledge is essential for all staff",
    );
  }

  if (humanRightsTrainingRate >= 90) {
    strengths.push(
      "Good human rights training coverage: " + humanRightsTrainingRate + "% of staff trained",
    );
  } else if (humanRightsTrainingRate < 70) {
    concerns.push(
      "Human rights training at " + humanRightsTrainingRate + "% — Article 8 rights require staff understanding",
    );
  }

  if (allThreeRate >= 80) {
    strengths.push(
      allThreeRate + "% of staff have completed all three legal training areas — comprehensive knowledge base",
    );
  } else if (allThreeRate < 50) {
    concerns.push(
      "Only " + allThreeRate + "% of staff have completed all three legal training areas — significant training gaps",
    );
  }

  return {
    totalStaff: n,
    courtOrderAwarenessCount,
    courtOrderAwarenessRate,
    childrenActKnowledgeCount,
    childrenActKnowledgeRate,
    humanRightsTrainingCount,
    humanRightsTrainingRate,
    allThreeCount,
    allThreeRate,
    score,
    strengths,
    concerns,
  };
}

// ── Build Child Order Profiles ─────────────────────────────────────────────

export function buildChildOrderProfiles(
  orders: CourtOrder[],
  reviews: OrderConditionReview[],
  meetings: LegalMeeting[],
): ChildOrderProfile[] {
  const childIds = [...new Set(orders.map((o) => o.childId))];

  return childIds.map((childId) => {
    const childOrders = orders.filter((o) => o.childId === childId);
    const childName = childOrders[0]?.childName || childId;
    const activeOrderCount = childOrders.filter((o) => o.isActive).length;

    const allConditions = childOrders.flatMap((o) => o.conditions);
    const totalConditions = allConditions.length;
    const fullyCompliantConditions = allConditions.filter(
      (c) => c.complianceStatus === "fully_compliant",
    ).length;
    const complianceRate = pct(fullyCompliantConditions, totalConditions);

    const reviewsConducted = reviews.filter((r) => r.childId === childId).length;
    const meetingsAttended = meetings.filter(
      (m) => m.childId === childId && m.attendedByHome,
    ).length;

    // Score (0-10): compliance rate (0-4) + reviews conducted (0-3) + meetings (0-3)
    const complianceScore = totalConditions > 0 ? (complianceRate / 100) * 4 : 4;
    const reviewScore = reviewsConducted > 0 ? Math.min(3, reviewsConducted) : 0;
    const meetingScore = meetingsAttended > 0 ? Math.min(3, meetingsAttended) : 0;

    const overallScore = Math.min(10, Math.max(0,
      Math.round((complianceScore + reviewScore + meetingScore) * 10) / 10,
    ));

    return {
      childId,
      childName,
      orders: childOrders,
      activeOrderCount,
      totalConditions,
      fullyCompliantConditions,
      complianceRate,
      reviewsConducted,
      meetingsAttended,
      overallScore,
    };
  });
}

// ── Main Intelligence Function ─────────────────────────────────────────────

export function generateCourtOrderComplianceIntelligence(
  orders: CourtOrder[],
  reviews: OrderConditionReview[],
  meetings: LegalMeeting[],
  training: LegalTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): CourtOrderComplianceIntelligence {
  const childIds = [...new Set(orders.map((o) => o.childId))];

  const orderCompliance = evaluateOrderCompliance(orders);
  const reviewTimeliness = evaluateReviewTimeliness(reviews, childIds);
  const legalEngagement = evaluateLegalEngagement(meetings);
  const staffLegalKnowledge = evaluateStaffLegalKnowledge(training);

  const childOrderProfiles = buildChildOrderProfiles(orders, reviews, meetings);

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        orderCompliance.score +
        reviewTimeliness.score +
        legalEngagement.score +
        staffLegalKnowledge.score,
      ),
    ),
  );

  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push(
      "Overall court order compliance rated Outstanding (" + overallScore + "/100)",
    );
  } else if (overallScore >= 60) {
    strengths.push(
      "Overall court order compliance rated Good (" + overallScore + "/100)",
    );
  }

  strengths.push(...orderCompliance.strengths.slice(0, 2));
  strengths.push(...reviewTimeliness.strengths.slice(0, 2));
  strengths.push(...legalEngagement.strengths.slice(0, 2));
  strengths.push(...staffLegalKnowledge.strengths.slice(0, 2));

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (overallScore < 40) {
    areasForImprovement.push(
      "Overall court order compliance rated Inadequate (" + overallScore + "/100) — urgent systemic review required",
    );
  } else if (overallScore < 60) {
    areasForImprovement.push(
      "Overall court order compliance Requires Improvement (" + overallScore + "/100)",
    );
  }

  areasForImprovement.push(...orderCompliance.concerns);
  areasForImprovement.push(...reviewTimeliness.concerns);
  areasForImprovement.push(...legalEngagement.concerns);
  areasForImprovement.push(...staffLegalKnowledge.concerns);

  // ── Actions ──
  const actions: string[] = [];

  if (orderCompliance.nonCompliantConditions > 0) {
    actions.push(
      "URGENT: " + orderCompliance.nonCompliantConditions + " court order condition(s) non-compliant — convene legal planning meeting within 48 hours and notify Ofsted per Reg 36",
    );
  }

  if (orderCompliance.totalOrders === 0) {
    actions.push(
      "URGENT: No court orders on file — obtain and record all legal orders for looked-after children immediately",
    );
  }

  if (reviewTimeliness.totalReviews === 0) {
    actions.push(
      "URGENT: No condition reviews conducted — implement a review schedule for all court order conditions",
    );
  }

  if (reviewTimeliness.concernsRate > 30) {
    actions.push(
      "URGENT: " + reviewTimeliness.concernsRate + "% of reviews raised concerns — investigate patterns and develop remediation plan",
    );
  }

  if (legalEngagement.totalMeetings === 0) {
    actions.push(
      "URGENT: No legal meetings recorded — ensure attendance at all LAC reviews, court hearings and legal planning meetings",
    );
  }

  if (legalEngagement.homeAttendanceRate < 80 && legalEngagement.totalMeetings > 0) {
    actions.push(
      "URGENT: Home attendance at legal meetings at " + legalEngagement.homeAttendanceRate + "% — arrange cover to ensure representation at all meetings",
    );
  }

  if (staffLegalKnowledge.totalStaff === 0) {
    actions.push(
      "URGENT: No legal training records — schedule court order awareness, Children Act and human rights training for all staff",
    );
  }

  if (staffLegalKnowledge.courtOrderAwarenessRate < 80 && staffLegalKnowledge.totalStaff > 0) {
    actions.push(
      "URGENT: Court order awareness training at " + staffLegalKnowledge.courtOrderAwarenessRate + "% — schedule training for untrained staff within 10 working days",
    );
  }

  if (staffLegalKnowledge.humanRightsTrainingRate < 80 && staffLegalKnowledge.totalStaff > 0) {
    actions.push(
      "URGENT: Human rights training at " + staffLegalKnowledge.humanRightsTrainingRate + "% — Article 8 proportionality understanding is essential",
    );
  }

  if (legalEngagement.childParticipationRate < 70 && legalEngagement.totalMeetings > 0) {
    actions.push(
      "URGENT: Child participation at " + legalEngagement.childParticipationRate + "% — develop advocacy support to ensure children's voices are heard in legal processes",
    );
  }

  if (orderCompliance.conditionsEvidencedRate < 80 && orderCompliance.totalConditions > 0) {
    actions.push(
      "URGENT: Only " + orderCompliance.conditionsEvidencedRate + "% of conditions evidenced — implement evidence tracking for all court order conditions",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No urgent actions required — court order compliance systems operating effectively",
    );
  }

  // ── Regulatory Links ──
  const regulatoryLinks = [
    "Children Act 1989, s31 — Care orders and supervision orders",
    "Children Act 1989, s22 — General duty of local authority to looked after children",
    "CHR 2015, Reg 36 — Notifiable events: reporting breaches to Ofsted",
    "SCCIF — Effectiveness of leaders and managers: legal compliance",
    "Human Rights Act 1998 — Article 8 right to family life, proportionality",
    "UNCRC Article 3 — Best interests of the child",
    "Care Planning Regulations 2010 — Review and compliance requirements",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    orderCompliance,
    reviewTimeliness,
    legalEngagement,
    staffLegalKnowledge,
    childOrderProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Demo Data: Chamberlain House ──────────────────────────────────────────────────

export function generateDemoData(): {
  orders: CourtOrder[];
  reviews: OrderConditionReview[];
  meetings: LegalMeeting[];
  training: LegalTraining[];
} {
  const orders: CourtOrder[] = [
    {
      id: "order-001",
      childId: "child-alex",
      childName: "Alex",
      orderType: "care_order",
      dateGranted: "2025-09-15",
      expiryDate: null,
      isActive: true,
      conditions: [
        {
          conditionType: "contact_frequency",
          description: "Supervised contact with birth mother twice monthly",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-10",
        },
        {
          conditionType: "education_provision",
          description: "Full-time education placement with termly PEP reviews",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-08",
        },
        {
          conditionType: "health_assessment",
          description: "Annual health assessment and 6-monthly dental checks",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-04-20",
        },
      ],
      lastReviewDate: "2026-04-15",
      nextReviewDue: "2026-10-15",
      socialWorkerAssigned: true,
      localAuthority: "Anytown Council",
    },
    {
      id: "order-002",
      childId: "child-jordan",
      childName: "Jordan",
      orderType: "interim_care_order",
      dateGranted: "2026-01-20",
      expiryDate: "2026-07-20",
      isActive: true,
      conditions: [
        {
          conditionType: "contact_frequency",
          description: "Weekly supervised contact with both parents",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-12",
        },
        {
          conditionType: "therapy_attendance",
          description: "Weekly therapeutic sessions with CAMHS",
          complianceStatus: "substantially_compliant",
          lastEvidenced: "2026-05-06",
        },
        {
          conditionType: "reporting_obligations",
          description: "Fortnightly reports to allocated social worker",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-14",
        },
        {
          conditionType: "review_attendance",
          description: "Attendance at all scheduled court hearings and reviews",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-01",
        },
      ],
      lastReviewDate: "2026-05-01",
      nextReviewDue: "2026-06-01",
      socialWorkerAssigned: true,
      localAuthority: "Anytown Council",
    },
    {
      id: "order-003",
      childId: "child-morgan",
      childName: "Morgan",
      orderType: "care_order",
      dateGranted: "2025-06-10",
      expiryDate: null,
      isActive: true,
      conditions: [
        {
          conditionType: "living_arrangements",
          description: "Stable placement at Chamberlain House with named keyworker",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-15",
        },
        {
          conditionType: "education_provision",
          description: "Full-time education with SEND support in place",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-10",
        },
        {
          conditionType: "supervision_requirements",
          description: "Regular supervision by allocated social worker with quarterly visits",
          complianceStatus: "fully_compliant",
          lastEvidenced: "2026-05-05",
        },
      ],
      lastReviewDate: "2026-03-10",
      nextReviewDue: "2026-09-10",
      socialWorkerAssigned: true,
      localAuthority: "Anytown Council",
    },
  ];

  const reviews: OrderConditionReview[] = [
    {
      id: "review-001",
      orderId: "order-001",
      childId: "child-alex",
      childName: "Alex",
      reviewDate: "2026-04-15",
      conditionsReviewed: 3,
      conditionsMet: 3,
      reviewOutcome: "all_met",
      reviewerName: "Sarah Johnson",
    },
    {
      id: "review-002",
      orderId: "order-002",
      childId: "child-jordan",
      childName: "Jordan",
      reviewDate: "2026-05-01",
      conditionsReviewed: 4,
      conditionsMet: 3,
      reviewOutcome: "mostly_met",
      reviewerName: "Lisa Williams",
    },
    {
      id: "review-003",
      orderId: "order-003",
      childId: "child-morgan",
      childName: "Morgan",
      reviewDate: "2026-03-10",
      conditionsReviewed: 3,
      conditionsMet: 3,
      reviewOutcome: "all_met",
      reviewerName: "Darren Laville",
    },
  ];

  const meetings: LegalMeeting[] = [
    {
      id: "meeting-001",
      childId: "child-alex",
      childName: "Alex",
      meetingDate: "2026-04-15",
      meetingType: "lac_review",
      attendedByHome: true,
      childParticipated: true,
      minutesRecorded: true,
      actionsAgreed: 3,
    },
    {
      id: "meeting-002",
      childId: "child-jordan",
      childName: "Jordan",
      meetingDate: "2026-05-01",
      meetingType: "court_hearing",
      attendedByHome: true,
      childParticipated: false,
      minutesRecorded: true,
      actionsAgreed: 2,
    },
    {
      id: "meeting-003",
      childId: "child-jordan",
      childName: "Jordan",
      meetingDate: "2026-04-20",
      meetingType: "legal_planning",
      attendedByHome: true,
      childParticipated: true,
      minutesRecorded: true,
      actionsAgreed: 4,
    },
    {
      id: "meeting-004",
      childId: "child-morgan",
      childName: "Morgan",
      meetingDate: "2026-03-10",
      meetingType: "lac_review",
      attendedByHome: true,
      childParticipated: true,
      minutesRecorded: true,
      actionsAgreed: 2,
    },
    {
      id: "meeting-005",
      childId: "child-alex",
      childName: "Alex",
      meetingDate: "2026-05-10",
      meetingType: "advocacy_meeting",
      attendedByHome: true,
      childParticipated: true,
      minutesRecorded: true,
      actionsAgreed: 1,
    },
  ];

  const training: LegalTraining[] = [
    {
      id: "lt-001",
      staffId: "staff-sarah",
      staffName: "Sarah Johnson",
      trainingDate: "2026-02-10",
      courtOrderAwareness: true,
      childrenActKnowledge: true,
      humanRightsTraining: true,
    },
    {
      id: "lt-002",
      staffId: "staff-tom",
      staffName: "Tom Richards",
      trainingDate: "2026-03-15",
      courtOrderAwareness: true,
      childrenActKnowledge: true,
      humanRightsTraining: true,
    },
    {
      id: "lt-003",
      staffId: "staff-lisa",
      staffName: "Lisa Williams",
      trainingDate: "2026-01-20",
      courtOrderAwareness: true,
      childrenActKnowledge: true,
      humanRightsTraining: true,
    },
    {
      id: "lt-004",
      staffId: "staff-darren",
      staffName: "Darren Laville",
      trainingDate: "2026-01-05",
      courtOrderAwareness: true,
      childrenActKnowledge: true,
      humanRightsTraining: true,
    },
  ];

  return { orders, reviews, meetings, training };
}
