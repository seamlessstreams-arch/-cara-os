// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Deprivation of Liberty Intelligence Engine
//
// Evaluates DoLS/LPS compliance, proportionality of restrictions, safeguards,
// review timeliness, and rights-based practice within children's residential care.
//
// Regulatory basis:
//   - Mental Capacity Act 2005 (as amended by MCA Amendment Act 2019)
//   - Liberty Protection Safeguards (LPS) — when commenced
//   - ECHR Article 5 (Right to liberty and security)
//   - Children Act 1989 s25 (Secure Accommodation)
//   - CHR 2015 Reg 20 (restraint and deprivation of liberty)
//   - CHR 2015 Reg 35 (behaviour management)
//   - Re T (A Child) [2021] UKSC 35 — Supreme Court DoLS guidance
//   - UNCRC Article 37 (protection from torture, cruel treatment, deprivation of liberty)
//
// Pure deterministic engine — no AI, no external calls.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Definitions ─────────────────────────────────────────────────────────

export type RestrictionType =
  | "locked_doors"
  | "continuous_supervision"
  | "medication_covert"
  | "movement_restriction"
  | "technology_monitoring"
  | "seclusion"
  | "physical_restraint"
  | "chemical_restraint"
  | "environmental_restriction"
  | "communication_restriction";

export type AuthorisationStatus =
  | "court_authorised"
  | "local_authority_authorised"
  | "pending_application"
  | "not_required"
  | "expired"
  | "refused"
  | "under_review";

export type ReviewOutcome =
  | "continued"
  | "modified"
  | "ceased"
  | "escalated"
  | "deferred";

export type ProportionalityAssessment =
  | "proportionate"
  | "potentially_disproportionate"
  | "disproportionate"
  | "not_assessed";

export type ChildViewStatus =
  | "views_obtained"
  | "views_sought_not_obtained"
  | "views_not_sought"
  | "non_verbal_observation_used";

export type SafeguardType =
  | "independent_reviewer"
  | "advocacy"
  | "legal_representation"
  | "family_notification"
  | "local_authority_notification"
  | "ofsted_notification"
  | "rights_information_given"
  | "complaints_process_explained";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ─────────────────────────────────────────────────────────

export interface RestrictionRecord {
  id: string;
  childId: string;
  childName: string;
  restrictionType: RestrictionType;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  authorisationStatus: AuthorisationStatus;
  authorisedBy?: string;
  authorisationDate?: string;
  authorisationExpiryDate?: string;
  proportionality: ProportionalityAssessment;
  bestInterestsAssessmentCompleted: boolean;
  leastRestrictiveOptionConsidered: boolean;
  riskAssessmentLinked: boolean;
}

export interface DoLSReview {
  id: string;
  restrictionId: string;
  childId: string;
  reviewDate: string;
  reviewedBy: string;
  outcome: ReviewOutcome;
  childViewStatus: ChildViewStatus;
  familyConsulted: boolean;
  independentPersonInvolved: boolean;
  proportionalityReassessed: boolean;
  nextReviewDue: string;
  lessRestrictiveAlternativesConsidered: boolean;
}

export interface ChildRightsSafeguard {
  id: string;
  childId: string;
  restrictionId: string;
  safeguardType: SafeguardType;
  inPlace: boolean;
  arrangedDate?: string;
  providerName?: string;
  lastContactDate?: string;
}

export interface LegalCompliance {
  id: string;
  childId: string;
  courtOrderInPlace: boolean;
  courtOrderExpiryDate?: string;
  s25ApplicationMade: boolean;
  s25Outcome?: "approved" | "refused" | "pending" | "not_applicable";
  localAuthorityNotified: boolean;
  ofstedNotified: boolean;
  cafeassInvolved: boolean;
  lastLegalReviewDate?: string;
}

// ── Result Interfaces ────────────────────────────────────────────────────────

export interface AuthorisationComplianceResult {
  overallScore: number; // 0-30
  totalRestrictions: number;
  activeRestrictions: number;
  authorisedRate: number;
  pendingApplications: number;
  expiredAuthorisations: number;
  bestInterestsRate: number;
  leastRestrictiveRate: number;
  riskAssessmentRate: number;
}

export interface ProportionalityResult {
  overallScore: number; // 0-25
  proportionateRate: number;
  disproportionateCount: number;
  notAssessedCount: number;
  restrictionTypeBreakdown: Record<RestrictionType, number>;
  averageActiveDurationDays: number;
}

export interface ReviewSafeguardsResult {
  overallScore: number; // 0-25
  totalReviews: number;
  reviewsOnTime: number;
  overdueReviews: number;
  childViewsRate: number;
  familyConsultedRate: number;
  independentInvolvementRate: number;
  proportionalityReassessedRate: number;
  lessRestrictiveConsideredRate: number;
  reviewOutcomeBreakdown: Record<ReviewOutcome, number>;
}

export interface RightsProtectionResult {
  overallScore: number; // 0-20
  safeguardCoverage: number; // % of children with all required safeguards
  advocacyRate: number;
  legalRepresentationRate: number;
  rightsInformationRate: number;
  familyNotificationRate: number;
  ofstedNotificationRate: number;
  courtOrderComplianceRate: number;
}

export interface ChildDoLSProfile {
  childId: string;
  childName: string;
  activeRestrictions: number;
  allAuthorised: boolean;
  proportionalityStatus: ProportionalityAssessment;
  reviewsUpToDate: boolean;
  safeguardsInPlace: number;
  safeguardsRequired: number;
  overallScore: number; // 0-10
}

export interface DeprivationOfLibertyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  authorisationCompliance: AuthorisationComplianceResult;
  proportionality: ProportionalityResult;
  reviewSafeguards: ReviewSafeguardsResult;
  rightsProtection: RightsProtectionResult;
  childProfiles: ChildDoLSProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Label Functions ──────────────────────────────────────────────────────────

const RESTRICTION_TYPE_LABELS: Record<RestrictionType, string> = {
  locked_doors: "Locked Doors",
  continuous_supervision: "Continuous Supervision",
  medication_covert: "Covert Medication",
  movement_restriction: "Movement Restriction",
  technology_monitoring: "Technology Monitoring",
  seclusion: "Seclusion",
  physical_restraint: "Physical Restraint",
  chemical_restraint: "Chemical Restraint",
  environmental_restriction: "Environmental Restriction",
  communication_restriction: "Communication Restriction",
};

const AUTHORISATION_STATUS_LABELS: Record<AuthorisationStatus, string> = {
  court_authorised: "Court Authorised",
  local_authority_authorised: "Local Authority Authorised",
  pending_application: "Pending Application",
  not_required: "Not Required",
  expired: "Expired",
  refused: "Refused",
  under_review: "Under Review",
};

const REVIEW_OUTCOME_LABELS: Record<ReviewOutcome, string> = {
  continued: "Continued",
  modified: "Modified",
  ceased: "Ceased",
  escalated: "Escalated",
  deferred: "Deferred",
};

const PROPORTIONALITY_LABELS: Record<ProportionalityAssessment, string> = {
  proportionate: "Proportionate",
  potentially_disproportionate: "Potentially Disproportionate",
  disproportionate: "Disproportionate",
  not_assessed: "Not Assessed",
};

const CHILD_VIEW_STATUS_LABELS: Record<ChildViewStatus, string> = {
  views_obtained: "Views Obtained",
  views_sought_not_obtained: "Views Sought, Not Obtained",
  views_not_sought: "Views Not Sought",
  non_verbal_observation_used: "Non-Verbal Observation Used",
};

const SAFEGUARD_TYPE_LABELS: Record<SafeguardType, string> = {
  independent_reviewer: "Independent Reviewer",
  advocacy: "Advocacy",
  legal_representation: "Legal Representation",
  family_notification: "Family Notification",
  local_authority_notification: "Local Authority Notification",
  ofsted_notification: "Ofsted Notification",
  rights_information_given: "Rights Information Given",
  complaints_process_explained: "Complaints Process Explained",
};

export function getRestrictionTypeLabel(t: RestrictionType): string {
  return RESTRICTION_TYPE_LABELS[t] ?? t;
}

export function getAuthorisationStatusLabel(s: AuthorisationStatus): string {
  return AUTHORISATION_STATUS_LABELS[s] ?? s;
}

export function getReviewOutcomeLabel(o: ReviewOutcome): string {
  return REVIEW_OUTCOME_LABELS[o] ?? o;
}

export function getProportionalityLabel(p: ProportionalityAssessment): string {
  return PROPORTIONALITY_LABELS[p] ?? p;
}

export function getChildViewStatusLabel(s: ChildViewStatus): string {
  return CHILD_VIEW_STATUS_LABELS[s] ?? s;
}

export function getSafeguardTypeLabel(s: SafeguardType): string {
  return SAFEGUARD_TYPE_LABELS[s] ?? s;
}

// ── Utility ──────────────────────────────────────────────────────────────────

function pct(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function daysBetween(a: string, b: string): number {
  return Math.abs(
    Math.floor(
      (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluation Functions ─────────────────────────────────────────────────────

/**
 * Evaluates authorisation compliance for all restrictions.
 * Max score: 30
 */
export function evaluateAuthorisationCompliance(
  restrictions: RestrictionRecord[],
): AuthorisationComplianceResult {
  const total = restrictions.length;
  const active = restrictions.filter((r) => r.isActive);
  const activeCount = active.length;

  if (total === 0) {
    // No restrictions — excellent position (no deprivation of liberty occurring)
    return {
      overallScore: 30,
      totalRestrictions: 0,
      activeRestrictions: 0,
      authorisedRate: 100,
      pendingApplications: 0,
      expiredAuthorisations: 0,
      bestInterestsRate: 100,
      leastRestrictiveRate: 100,
      riskAssessmentRate: 100,
    };
  }

  let score = 0;

  // Authorisation rate: court_authorised or local_authority_authorised or not_required
  const authorised = restrictions.filter(
    (r) =>
      r.authorisationStatus === "court_authorised" ||
      r.authorisationStatus === "local_authority_authorised" ||
      r.authorisationStatus === "not_required",
  );
  const authorisedRate = pct(authorised.length, total);
  // +10 for ≥ 95% authorised, +7 for ≥ 80%, +4 for ≥ 60%
  if (authorisedRate >= 95) score += 10;
  else if (authorisedRate >= 80) score += 7;
  else if (authorisedRate >= 60) score += 4;
  else if (authorisedRate >= 40) score += 2;

  // Pending applications
  const pending = restrictions.filter(
    (r) => r.authorisationStatus === "pending_application",
  ).length;

  // Expired authorisations
  const expired = restrictions.filter(
    (r) => r.authorisationStatus === "expired",
  ).length;
  // +4 if no expired authorisations
  if (expired === 0) score += 4;

  // Best interests assessment rate
  const biCompleted = restrictions.filter(
    (r) => r.bestInterestsAssessmentCompleted,
  );
  const bestInterestsRate = pct(biCompleted.length, total);
  // +5 for ≥ 90%
  if (bestInterestsRate >= 90) score += 5;
  else if (bestInterestsRate >= 70) score += 3;
  else if (bestInterestsRate >= 50) score += 1;

  // Least restrictive option considered rate
  const leastRestrictive = restrictions.filter(
    (r) => r.leastRestrictiveOptionConsidered,
  );
  const leastRestrictiveRate = pct(leastRestrictive.length, total);
  // +5 for ≥ 90%
  if (leastRestrictiveRate >= 90) score += 5;
  else if (leastRestrictiveRate >= 70) score += 3;
  else if (leastRestrictiveRate >= 50) score += 1;

  // Risk assessment linked rate
  const riskLinked = restrictions.filter((r) => r.riskAssessmentLinked);
  const riskAssessmentRate = pct(riskLinked.length, total);
  // +4 for ≥ 90%
  if (riskAssessmentRate >= 90) score += 4;
  else if (riskAssessmentRate >= 70) score += 2;

  // +2 bonus if no refused authorisations
  const refused = restrictions.filter(
    (r) => r.authorisationStatus === "refused",
  ).length;
  if (refused === 0) score += 2;

  return {
    overallScore: Math.min(score, 30),
    totalRestrictions: total,
    activeRestrictions: activeCount,
    authorisedRate,
    pendingApplications: pending,
    expiredAuthorisations: expired,
    bestInterestsRate,
    leastRestrictiveRate,
    riskAssessmentRate,
  };
}

/**
 * Evaluates proportionality of restrictions.
 * Max score: 25
 */
export function evaluateProportionality(
  restrictions: RestrictionRecord[],
  periodEnd: string,
): ProportionalityResult {
  const typeBreakdown = {} as Record<RestrictionType, number>;
  for (const r of restrictions) {
    typeBreakdown[r.restrictionType] =
      (typeBreakdown[r.restrictionType] || 0) + 1;
  }

  if (restrictions.length === 0) {
    return {
      overallScore: 25,
      proportionateRate: 100,
      disproportionateCount: 0,
      notAssessedCount: 0,
      restrictionTypeBreakdown: typeBreakdown,
      averageActiveDurationDays: 0,
    };
  }

  let score = 0;

  // Proportionality assessment rates
  const proportionate = restrictions.filter(
    (r) => r.proportionality === "proportionate",
  ).length;
  const disproportionate = restrictions.filter(
    (r) =>
      r.proportionality === "disproportionate" ||
      r.proportionality === "potentially_disproportionate",
  ).length;
  const notAssessed = restrictions.filter(
    (r) => r.proportionality === "not_assessed",
  ).length;

  const proportionateRate = pct(proportionate, restrictions.length);

  // +8 for ≥ 90% proportionate, +5 for ≥ 70%, +3 for ≥ 50%
  if (proportionateRate >= 90) score += 8;
  else if (proportionateRate >= 70) score += 5;
  else if (proportionateRate >= 50) score += 3;

  // +4 if no disproportionate restrictions
  if (disproportionate === 0) score += 4;

  // +3 if all assessed (no not_assessed)
  if (notAssessed === 0) score += 3;

  // Average active restriction duration — shorter is better
  const activeRestrictions = restrictions.filter((r) => r.isActive);
  let avgDuration = 0;
  if (activeRestrictions.length > 0) {
    const totalDays = activeRestrictions.reduce((sum, r) => {
      const end = r.endDate || periodEnd;
      return sum + daysBetween(r.startDate, end);
    }, 0);
    avgDuration = Math.round(totalDays / activeRestrictions.length);
  }

  // +4 for avg duration ≤ 30 days, +2 for ≤ 90 days
  if (activeRestrictions.length === 0 || avgDuration <= 30) score += 4;
  else if (avgDuration <= 90) score += 2;

  // +3 if no seclusion or chemical_restraint types
  const hasSevereTypes = restrictions.some(
    (r) =>
      r.restrictionType === "seclusion" ||
      r.restrictionType === "chemical_restraint",
  );
  if (!hasSevereTypes) score += 3;

  // +3 bonus if least restrictive option considered for all
  const allLeastRestrictive = restrictions.every(
    (r) => r.leastRestrictiveOptionConsidered,
  );
  if (allLeastRestrictive) score += 3;

  return {
    overallScore: Math.min(score, 25),
    proportionateRate,
    disproportionateCount: disproportionate,
    notAssessedCount: notAssessed,
    restrictionTypeBreakdown: typeBreakdown,
    averageActiveDurationDays: avgDuration,
  };
}

/**
 * Evaluates review and safeguarding processes.
 * Max score: 25
 */
export function evaluateReviewSafeguards(
  reviews: DoLSReview[],
  restrictions: RestrictionRecord[],
  periodEnd: string,
): ReviewSafeguardsResult {
  const outcomeBreakdown = {} as Record<ReviewOutcome, number>;
  for (const r of reviews) {
    outcomeBreakdown[r.outcome] = (outcomeBreakdown[r.outcome] || 0) + 1;
  }

  const activeRestrictions = restrictions.filter((r) => r.isActive);

  if (activeRestrictions.length === 0 && reviews.length === 0) {
    // No active restrictions means no reviews needed — good position
    return {
      overallScore: 25,
      totalReviews: 0,
      reviewsOnTime: 0,
      overdueReviews: 0,
      childViewsRate: 100,
      familyConsultedRate: 100,
      independentInvolvementRate: 100,
      proportionalityReassessedRate: 100,
      lessRestrictiveConsideredRate: 100,
      reviewOutcomeBreakdown: outcomeBreakdown,
    };
  }

  if (reviews.length === 0 && activeRestrictions.length > 0) {
    // Active restrictions but no reviews — concerning
    return {
      overallScore: 0,
      totalReviews: 0,
      reviewsOnTime: 0,
      overdueReviews: activeRestrictions.length,
      childViewsRate: 0,
      familyConsultedRate: 0,
      independentInvolvementRate: 0,
      proportionalityReassessedRate: 0,
      lessRestrictiveConsideredRate: 0,
      reviewOutcomeBreakdown: outcomeBreakdown,
    };
  }

  let score = 0;

  // Review timeliness — how many reviews were on time vs overdue
  const overdueReviews = reviews.filter(
    (r) => new Date(r.nextReviewDue) < new Date(periodEnd),
  ).length;
  const onTimeRate = pct(reviews.length - overdueReviews, reviews.length);
  // +6 for ≥ 90% on time
  if (onTimeRate >= 90) score += 6;
  else if (onTimeRate >= 70) score += 4;
  else if (onTimeRate >= 50) score += 2;

  // Child views obtained rate
  const viewsObtained = reviews.filter(
    (r) =>
      r.childViewStatus === "views_obtained" ||
      r.childViewStatus === "non_verbal_observation_used",
  ).length;
  const childViewsRate = pct(viewsObtained, reviews.length);
  // +5 for ≥ 90%
  if (childViewsRate >= 90) score += 5;
  else if (childViewsRate >= 70) score += 3;
  else if (childViewsRate >= 50) score += 1;

  // Family consulted rate
  const familyConsulted = reviews.filter((r) => r.familyConsulted).length;
  const familyConsultedRate = pct(familyConsulted, reviews.length);
  // +3 for ≥ 80%
  if (familyConsultedRate >= 80) score += 3;
  else if (familyConsultedRate >= 60) score += 2;

  // Independent person involvement rate
  const independentInvolved = reviews.filter(
    (r) => r.independentPersonInvolved,
  ).length;
  const independentInvolvementRate = pct(
    independentInvolved,
    reviews.length,
  );
  // +3 for ≥ 80%
  if (independentInvolvementRate >= 80) score += 3;
  else if (independentInvolvementRate >= 60) score += 2;

  // Proportionality reassessed at review
  const propReassessed = reviews.filter(
    (r) => r.proportionalityReassessed,
  ).length;
  const proportionalityReassessedRate = pct(propReassessed, reviews.length);
  // +4 for ≥ 90%
  if (proportionalityReassessedRate >= 90) score += 4;
  else if (proportionalityReassessedRate >= 70) score += 2;

  // Less restrictive alternatives considered at review
  const lessRestrictive = reviews.filter(
    (r) => r.lessRestrictiveAlternativesConsidered,
  ).length;
  const lessRestrictiveConsideredRate = pct(
    lessRestrictive,
    reviews.length,
  );
  // +2 for ≥ 90%
  if (lessRestrictiveConsideredRate >= 90) score += 2;
  else if (lessRestrictiveConsideredRate >= 70) score += 1;

  // +2 bonus if reviews led to at least one modification or cessation (demonstrating active review)
  const modificationsOrCessations = reviews.filter(
    (r) => r.outcome === "modified" || r.outcome === "ceased",
  ).length;
  if (modificationsOrCessations > 0) score += 2;

  return {
    overallScore: Math.min(score, 25),
    totalReviews: reviews.length,
    reviewsOnTime: reviews.length - overdueReviews,
    overdueReviews,
    childViewsRate,
    familyConsultedRate,
    independentInvolvementRate,
    proportionalityReassessedRate,
    lessRestrictiveConsideredRate,
    reviewOutcomeBreakdown: outcomeBreakdown,
  };
}

/**
 * Evaluates rights protection and legal compliance.
 * Max score: 20
 */
export function evaluateRightsProtection(
  safeguards: ChildRightsSafeguard[],
  legalCompliance: LegalCompliance[],
  restrictions: RestrictionRecord[],
): RightsProtectionResult {
  // Identify unique children with restrictions
  const childrenWithRestrictions = [
    ...new Set(restrictions.map((r) => r.childId)),
  ];

  if (childrenWithRestrictions.length === 0) {
    return {
      overallScore: 20,
      safeguardCoverage: 100,
      advocacyRate: 100,
      legalRepresentationRate: 100,
      rightsInformationRate: 100,
      familyNotificationRate: 100,
      ofstedNotificationRate: 100,
      courtOrderComplianceRate: 100,
    };
  }

  let score = 0;

  const totalChildren = childrenWithRestrictions.length;

  // Required safeguards per child: advocacy, rights_information_given, family_notification, ofsted_notification
  const requiredSafeguards: SafeguardType[] = [
    "advocacy",
    "rights_information_given",
    "family_notification",
    "ofsted_notification",
  ];

  let childrenFullyCovered = 0;
  let advocacyCount = 0;
  let legalRepCount = 0;
  let rightsInfoCount = 0;
  let familyNotifCount = 0;
  let ofstedNotifCount = 0;

  for (const childId of childrenWithRestrictions) {
    const childSafeguards = safeguards.filter(
      (s) => s.childId === childId && s.inPlace,
    );
    const childSafeguardTypes = new Set(
      childSafeguards.map((s) => s.safeguardType),
    );

    const hasAllRequired = requiredSafeguards.every((st) =>
      childSafeguardTypes.has(st),
    );
    if (hasAllRequired) childrenFullyCovered++;

    if (childSafeguardTypes.has("advocacy")) advocacyCount++;
    if (childSafeguardTypes.has("legal_representation")) legalRepCount++;
    if (childSafeguardTypes.has("rights_information_given"))
      rightsInfoCount++;
    if (childSafeguardTypes.has("family_notification")) familyNotifCount++;
    if (childSafeguardTypes.has("ofsted_notification")) ofstedNotifCount++;
  }

  const safeguardCoverage = pct(childrenFullyCovered, totalChildren);
  const advocacyRate = pct(advocacyCount, totalChildren);
  const legalRepresentationRate = pct(legalRepCount, totalChildren);
  const rightsInformationRate = pct(rightsInfoCount, totalChildren);
  const familyNotificationRate = pct(familyNotifCount, totalChildren);
  const ofstedNotificationRate = pct(ofstedNotifCount, totalChildren);

  // +5 for safeguard coverage ≥ 90%
  if (safeguardCoverage >= 90) score += 5;
  else if (safeguardCoverage >= 70) score += 3;
  else if (safeguardCoverage >= 50) score += 1;

  // +3 for advocacy rate ≥ 90%
  if (advocacyRate >= 90) score += 3;
  else if (advocacyRate >= 70) score += 2;

  // +3 for rights information ≥ 90%
  if (rightsInformationRate >= 90) score += 3;
  else if (rightsInformationRate >= 70) score += 2;

  // +3 for Ofsted notification ≥ 90%
  if (ofstedNotificationRate >= 90) score += 3;
  else if (ofstedNotificationRate >= 70) score += 2;

  // Legal compliance — court orders
  const childrenWithCourtOrders = legalCompliance.filter(
    (l) => l.courtOrderInPlace,
  );
  const courtOrderComplianceRate =
    childrenWithCourtOrders.length > 0
      ? pct(
          childrenWithCourtOrders.filter(
            (l) => l.localAuthorityNotified && l.ofstedNotified,
          ).length,
          childrenWithCourtOrders.length,
        )
      : 100;

  // +3 for court order compliance
  if (courtOrderComplianceRate >= 90) score += 3;
  else if (courtOrderComplianceRate >= 70) score += 2;

  // +3 bonus if all children have legal representation where court order exists
  const courtChildren = legalCompliance.filter((l) => l.courtOrderInPlace);
  if (courtChildren.length > 0) {
    const allHaveLegalRep = courtChildren.every((l) => {
      const childSafeguards = safeguards.filter(
        (s) =>
          s.childId === l.childId &&
          s.safeguardType === "legal_representation" &&
          s.inPlace,
      );
      return childSafeguards.length > 0;
    });
    if (allHaveLegalRep) score += 3;
  } else {
    // No court orders — bonus applies
    score += 3;
  }

  return {
    overallScore: Math.min(score, 20),
    safeguardCoverage,
    advocacyRate,
    legalRepresentationRate,
    rightsInformationRate,
    familyNotificationRate,
    ofstedNotificationRate,
    courtOrderComplianceRate,
  };
}

// ── Child Profiles ───────────────────────────────────────────────────────────

export function buildChildDoLSProfiles(
  restrictions: RestrictionRecord[],
  reviews: DoLSReview[],
  safeguards: ChildRightsSafeguard[],
  periodEnd: string,
): ChildDoLSProfile[] {
  const childIds = [...new Set(restrictions.map((r) => r.childId))];
  const childNames: Record<string, string> = {};
  for (const r of restrictions) {
    childNames[r.childId] = r.childName;
  }

  return childIds.map((childId) => {
    const childRestrictions = restrictions.filter(
      (r) => r.childId === childId,
    );
    const activeRestrictions = childRestrictions.filter((r) => r.isActive);
    const childReviews = reviews.filter((r) => r.childId === childId);
    const childSafeguards = safeguards.filter(
      (s) => s.childId === childId && s.inPlace,
    );

    // All authorised?
    const allAuthorised = activeRestrictions.every(
      (r) =>
        r.authorisationStatus === "court_authorised" ||
        r.authorisationStatus === "local_authority_authorised" ||
        r.authorisationStatus === "not_required",
    );

    // Worst proportionality
    const propStatuses = childRestrictions.map((r) => r.proportionality);
    let worstProp: ProportionalityAssessment = "proportionate";
    if (propStatuses.includes("disproportionate"))
      worstProp = "disproportionate";
    else if (propStatuses.includes("potentially_disproportionate"))
      worstProp = "potentially_disproportionate";
    else if (propStatuses.includes("not_assessed"))
      worstProp = "not_assessed";

    // Reviews up to date?
    const reviewsUpToDate =
      activeRestrictions.length === 0 ||
      childReviews.some(
        (r) => new Date(r.nextReviewDue) >= new Date(periodEnd),
      );

    // Required safeguards
    const requiredSafeguardTypes: SafeguardType[] = [
      "advocacy",
      "rights_information_given",
      "family_notification",
      "ofsted_notification",
    ];
    const safeguardsRequired =
      activeRestrictions.length > 0 ? requiredSafeguardTypes.length : 0;
    const safeguardTypesPresent = new Set(
      childSafeguards.map((s) => s.safeguardType),
    );
    const safeguardsInPlace = requiredSafeguardTypes.filter((st) =>
      safeguardTypesPresent.has(st),
    ).length;

    // Score 0-10
    let profileScore = 5;
    if (allAuthorised) profileScore += 1;
    if (worstProp === "proportionate") profileScore += 1;
    if (reviewsUpToDate) profileScore += 1;
    if (safeguardsInPlace >= safeguardsRequired && safeguardsRequired > 0)
      profileScore += 1;
    if (activeRestrictions.length === 0) profileScore += 1;
    // Penalties
    if (!allAuthorised && activeRestrictions.length > 0) profileScore -= 2;
    if (worstProp === "disproportionate") profileScore -= 2;
    if (!reviewsUpToDate && activeRestrictions.length > 0) profileScore -= 1;

    return {
      childId,
      childName: childNames[childId] || childId,
      activeRestrictions: activeRestrictions.length,
      allAuthorised,
      proportionalityStatus: worstProp,
      reviewsUpToDate,
      safeguardsInPlace,
      safeguardsRequired,
      overallScore: Math.max(0, Math.min(profileScore, 10)),
    };
  });
}

// ── Strengths / Areas / Actions ──────────────────────────────────────────────

function generateStrengths(
  auth: AuthorisationComplianceResult,
  prop: ProportionalityResult,
  review: ReviewSafeguardsResult,
  rights: RightsProtectionResult,
): string[] {
  const strengths: string[] = [];

  if (auth.totalRestrictions === 0) {
    strengths.push(
      "No deprivation of liberty restrictions in place — rights-based care model operating effectively",
    );
  }

  if (auth.authorisedRate >= 95 && auth.totalRestrictions > 0) {
    strengths.push(
      "Excellent authorisation compliance — all restrictions properly authorised",
    );
  }

  if (auth.bestInterestsRate >= 90 && auth.totalRestrictions > 0) {
    strengths.push(
      "Best interests assessments completed for all restrictions",
    );
  }

  if (prop.proportionateRate >= 90 && auth.totalRestrictions > 0) {
    strengths.push(
      "High proportionality rate demonstrates careful consideration of necessity",
    );
  }

  if (prop.disproportionateCount === 0 && auth.totalRestrictions > 0) {
    strengths.push("No disproportionate restrictions identified");
  }

  if (review.childViewsRate >= 90 && review.totalReviews > 0) {
    strengths.push(
      "Strong child participation — views obtained in the majority of reviews",
    );
  }

  if (review.independentInvolvementRate >= 80 && review.totalReviews > 0) {
    strengths.push(
      "Good independent oversight with external involvement in reviews",
    );
  }

  if (rights.advocacyRate >= 90 && auth.totalRestrictions > 0) {
    strengths.push("Advocacy in place for all children subject to restrictions");
  }

  if (rights.safeguardCoverage >= 90 && auth.totalRestrictions > 0) {
    strengths.push(
      "Comprehensive safeguards in place — children's rights well protected",
    );
  }

  if (
    review.lessRestrictiveConsideredRate >= 90 &&
    review.totalReviews > 0
  ) {
    strengths.push(
      "Less restrictive alternatives consistently explored at review — evidence of rights-based practice",
    );
  }

  return strengths;
}

function generateAreasForImprovement(
  auth: AuthorisationComplianceResult,
  prop: ProportionalityResult,
  review: ReviewSafeguardsResult,
  rights: RightsProtectionResult,
): string[] {
  const areas: string[] = [];

  if (auth.expiredAuthorisations > 0) {
    areas.push(
      `${auth.expiredAuthorisations} expired authorisation(s) requiring urgent renewal`,
    );
  }

  if (auth.authorisedRate < 90 && auth.totalRestrictions > 0) {
    areas.push(
      `Authorisation compliance at ${auth.authorisedRate}% — below the 90% target`,
    );
  }

  if (auth.bestInterestsRate < 90 && auth.totalRestrictions > 0) {
    areas.push(
      `Best interests assessments completed for only ${auth.bestInterestsRate}% of restrictions`,
    );
  }

  if (prop.disproportionateCount > 0) {
    areas.push(
      `${prop.disproportionateCount} restriction(s) assessed as disproportionate — requires immediate review`,
    );
  }

  if (prop.notAssessedCount > 0) {
    areas.push(
      `${prop.notAssessedCount} restriction(s) without proportionality assessment`,
    );
  }

  if (review.overdueReviews > 0) {
    areas.push(
      `${review.overdueReviews} overdue review(s) — timely review is a legal requirement`,
    );
  }

  if (review.childViewsRate < 80 && review.totalReviews > 0) {
    areas.push(
      `Child views obtained in only ${review.childViewsRate}% of reviews — UNCRC Art 12 requires participation`,
    );
  }

  if (rights.advocacyRate < 80 && auth.totalRestrictions > 0) {
    areas.push(
      `Advocacy provision at ${rights.advocacyRate}% — all children subject to DoLS should have an advocate`,
    );
  }

  if (rights.ofstedNotificationRate < 100 && auth.totalRestrictions > 0) {
    areas.push(
      `Ofsted notification rate at ${rights.ofstedNotificationRate}% — Reg 40 requires notification of all restrictions`,
    );
  }

  return areas;
}

function generateActions(
  auth: AuthorisationComplianceResult,
  prop: ProportionalityResult,
  review: ReviewSafeguardsResult,
  rights: RightsProtectionResult,
): string[] {
  const actions: string[] = [];

  if (auth.expiredAuthorisations > 0) {
    actions.push(
      "URGENT: Renew expired DoLS authorisations immediately — operating without valid authorisation is unlawful",
    );
  }

  if (prop.disproportionateCount > 0) {
    actions.push(
      "URGENT: Review all disproportionate restrictions and implement less restrictive alternatives where possible",
    );
  }

  if (review.overdueReviews > 0) {
    actions.push(
      "Schedule and complete all overdue DoLS reviews within 7 days",
    );
  }

  if (auth.bestInterestsRate < 100 && auth.totalRestrictions > 0) {
    actions.push(
      "Complete best interests assessments for all current restrictions",
    );
  }

  if (prop.notAssessedCount > 0) {
    actions.push(
      "Conduct proportionality assessments for all unassessed restrictions",
    );
  }

  if (review.childViewsRate < 90 && review.totalReviews > 0) {
    actions.push(
      "Implement child participation strategy for DoLS reviews — ensure views are routinely sought",
    );
  }

  if (rights.advocacyRate < 100 && auth.totalRestrictions > 0) {
    actions.push(
      "Arrange advocacy support for all children subject to deprivation of liberty",
    );
  }

  if (review.familyConsultedRate < 80 && review.totalReviews > 0) {
    actions.push(
      "Improve family consultation rates in DoLS reviews — families should be consulted unless contra-indicated",
    );
  }

  if (rights.ofstedNotificationRate < 100 && auth.totalRestrictions > 0) {
    actions.push(
      "Ensure Ofsted is notified of all deprivation of liberty restrictions as required by Reg 40",
    );
  }

  if (
    auth.totalRestrictions > 0 &&
    auth.leastRestrictiveRate < 100
  ) {
    actions.push(
      "Document least restrictive alternative considerations for all restrictions",
    );
  }

  return actions;
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateDeprivationOfLibertyIntelligence(
  restrictions: RestrictionRecord[],
  reviews: DoLSReview[],
  safeguards: ChildRightsSafeguard[],
  legalCompliance: LegalCompliance[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): DeprivationOfLibertyIntelligence {
  const authResult = evaluateAuthorisationCompliance(restrictions);
  const propResult = evaluateProportionality(restrictions, periodEnd);
  const reviewResult = evaluateReviewSafeguards(
    reviews,
    restrictions,
    periodEnd,
  );
  const rightsResult = evaluateRightsProtection(
    safeguards,
    legalCompliance,
    restrictions,
  );

  const overallScore =
    authResult.overallScore +
    propResult.overallScore +
    reviewResult.overallScore +
    rightsResult.overallScore;

  const childProfiles = buildChildDoLSProfiles(
    restrictions,
    reviews,
    safeguards,
    periodEnd,
  );

  const strengths = generateStrengths(
    authResult,
    propResult,
    reviewResult,
    rightsResult,
  );
  const areasForImprovement = generateAreasForImprovement(
    authResult,
    propResult,
    reviewResult,
    rightsResult,
  );
  const actions = generateActions(
    authResult,
    propResult,
    reviewResult,
    rightsResult,
  );

  const regulatoryLinks = [
    "Mental Capacity Act 2005 — framework for deprivation of liberty safeguards",
    "MCA Amendment Act 2019 — Liberty Protection Safeguards (when commenced)",
    "ECHR Article 5 — Right to liberty and security of person",
    "Children Act 1989 s25 — use of accommodation for restricting liberty",
    "CHR 2015 Reg 20 — restraint and deprivation of liberty in children's homes",
    "CHR 2015 Reg 35 — behaviour management policies and procedures",
    "CHR 2015 Reg 40 — notification of serious events including restrictions on liberty",
    "Re T (A Child) [2021] UKSC 35 — Supreme Court guidance on DoLS for children",
    "UNCRC Article 37 — protection from deprivation of liberty except as last resort",
    "SCCIF — inspection of arrangements for protecting children's liberty rights",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore: Math.min(overallScore, 100),
    rating: getRating(overallScore),
    authorisationCompliance: authResult,
    proportionality: propResult,
    reviewSafeguards: reviewResult,
    rightsProtection: rightsResult,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
