// ==============================================================================
// SIBLING CONTACT QUALITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for analysing the quality and consistency of
// sibling contact arrangements for looked-after children. Covers contact
// frequency, quality of sessions, child voice, barriers, and compliance
// with care plans.
//
// Regulatory basis:
//   - CHR 2015, Reg 13 — Contact: maintaining family relationships
//   - Children Act 1989, s34 — Parental contact and sibling contact
//   - SCCIF — Overall experiences and progress of children
//   - NMS 9 — Contact: supporting family relationships
//   - Adoption & Children Act 2002 — Sibling placement duty
//   - UNCRC Article 8 — Right to preserve family relations
//   - UNCRC Article 9 — Right to maintain contact with family
//
// No AI. No external calls. Pure input → output.
// ==============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactType =
  | "face_to_face"
  | "supervised"
  | "unsupervised"
  | "virtual_video"
  | "telephone"
  | "letter_email"
  | "shared_activity"
  | "overnight_stay";

export type ContactQualityRating =
  | "excellent"
  | "good"
  | "adequate"
  | "poor"
  | "harmful";

export type BarrierType =
  | "distance"
  | "local_authority_decision"
  | "court_order"
  | "child_wishes"
  | "sibling_wishes"
  | "safeguarding_concern"
  | "placement_restriction"
  | "scheduling_difficulty"
  | "none";

export type ContactOutcome =
  | "positive"
  | "mixed"
  | "negative"
  | "cancelled_by_child"
  | "cancelled_by_sibling"
  | "cancelled_by_authority"
  | "no_show";

export type FrequencyCompliance =
  | "exceeds_plan"
  | "meets_plan"
  | "below_plan"
  | "significantly_below"
  | "no_plan";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface SiblingRelationship {
  id: string;
  childId: string;
  childName: string;
  siblingId: string;
  siblingName: string;
  siblingPlacement: "same_home" | "different_home" | "birth_family" | "adopted" | "independent";
  contactPlanExists: boolean;
  plannedFrequency: string;
  frequencyCompliance: FrequencyCompliance;
  lastContactDate: string | null;
  relationshipQuality: "strong" | "developing" | "strained" | "estranged" | "unknown";
}

export interface SiblingContactSession {
  id: string;
  childId: string;
  childName: string;
  siblingId: string;
  siblingName: string;
  date: string;
  contactType: ContactType;
  duration: number;
  qualityRating: ContactQualityRating;
  outcome: ContactOutcome;
  childViewSought: boolean;
  childEnjoyedContact: boolean | null;
  siblingViewSought: boolean;
  facilitatedBy: string;
  barriers: BarrierType[];
  followUpActions: string[];
}

export interface SiblingContactReview {
  id: string;
  childId: string;
  childName: string;
  reviewDate: string;
  reviewedBy: string;
  allSiblingsConsidered: boolean;
  contactPlanUpdated: boolean;
  childViewsIncluded: boolean;
  barriersAddressed: boolean;
  outcomeSatisfactory: boolean;
}

export interface StaffSiblingTraining {
  id: string;
  staffId: string;
  staffName: string;
  siblingRelationshipAwareness: boolean;
  facilitatingContactSkills: boolean;
  managingDifficultContact: boolean;
  childViewsTraining: boolean;
  legalFrameworkKnowledge: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ContactFrequencyResult {
  overallScore: number;
  totalRelationships: number;
  contactPlanRate: number;
  meetsOrExceedsPlanRate: number;
  significantlyBelowRate: number;
  noPlanRate: number;
  sameHomeSiblings: number;
  separatedSiblings: number;
}

export interface ContactQualityResult {
  overallScore: number;
  totalSessions: number;
  excellentGoodRate: number;
  positiveOutcomeRate: number;
  childViewSoughtRate: number;
  childEnjoyedRate: number;
  cancellationRate: number;
  averageDuration: number;
}

export interface ReviewComplianceResult {
  overallScore: number;
  totalReviews: number;
  allSiblingsConsideredRate: number;
  contactPlanUpdatedRate: number;
  childViewsIncludedRate: number;
  barriersAddressedRate: number;
  outcomeSatisfactoryRate: number;
}

export interface StaffReadinessResult {
  overallScore: number;
  totalStaff: number;
  siblingAwarenessRate: number;
  facilitatingSkillsRate: number;
  difficultContactRate: number;
  childViewsRate: number;
  legalKnowledgeRate: number;
}

export interface ChildSiblingProfile {
  childId: string;
  childName: string;
  siblingCount: number;
  separatedCount: number;
  sessionsInPeriod: number;
  positiveOutcomeRate: number;
  meetsContactPlan: boolean;
  overallScore: number;
}

export interface SiblingContactQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  contactFrequency: ContactFrequencyResult;
  contactQuality: ContactQualityResult;
  reviewCompliance: ReviewComplianceResult;
  staffReadiness: StaffReadinessResult;
  childProfiles: ChildSiblingProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

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

// ── Label Functions ────────────────────────────────────────────────────────

const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  face_to_face: "Face to Face",
  supervised: "Supervised",
  unsupervised: "Unsupervised",
  virtual_video: "Virtual / Video",
  telephone: "Telephone",
  letter_email: "Letter / Email",
  shared_activity: "Shared Activity",
  overnight_stay: "Overnight Stay",
};

const CONTACT_QUALITY_LABELS: Record<ContactQualityRating, string> = {
  excellent: "Excellent",
  good: "Good",
  adequate: "Adequate",
  poor: "Poor",
  harmful: "Harmful",
};

const BARRIER_TYPE_LABELS: Record<BarrierType, string> = {
  distance: "Distance",
  local_authority_decision: "Local Authority Decision",
  court_order: "Court Order",
  child_wishes: "Child's Wishes",
  sibling_wishes: "Sibling's Wishes",
  safeguarding_concern: "Safeguarding Concern",
  placement_restriction: "Placement Restriction",
  scheduling_difficulty: "Scheduling Difficulty",
  none: "None",
};

const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, string> = {
  positive: "Positive",
  mixed: "Mixed",
  negative: "Negative",
  cancelled_by_child: "Cancelled by Child",
  cancelled_by_sibling: "Cancelled by Sibling",
  cancelled_by_authority: "Cancelled by Authority",
  no_show: "No Show",
};

const FREQUENCY_COMPLIANCE_LABELS: Record<FrequencyCompliance, string> = {
  exceeds_plan: "Exceeds Plan",
  meets_plan: "Meets Plan",
  below_plan: "Below Plan",
  significantly_below: "Significantly Below",
  no_plan: "No Plan",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getContactTypeLabel(v: ContactType): string { return CONTACT_TYPE_LABELS[v]; }
export function getContactQualityLabel(v: ContactQualityRating): string { return CONTACT_QUALITY_LABELS[v]; }
export function getBarrierTypeLabel(v: BarrierType): string { return BARRIER_TYPE_LABELS[v]; }
export function getContactOutcomeLabel(v: ContactOutcome): string { return CONTACT_OUTCOME_LABELS[v]; }
export function getFrequencyComplianceLabel(v: FrequencyCompliance): string { return FREQUENCY_COMPLIANCE_LABELS[v]; }
export function getRatingLabel(v: Rating): string { return RATING_LABELS[v]; }

// ── Evaluators ─────────────────────────────────────────────────────────────

/**
 * Evaluates contact frequency and planning compliance.
 * Empty = 0 (no sibling relationships documented = non-compliant).
 */
export function evaluateContactFrequency(
  relationships: SiblingRelationship[],
): ContactFrequencyResult {
  if (relationships.length === 0) {
    return {
      overallScore: 0,
      totalRelationships: 0,
      contactPlanRate: 0,
      meetsOrExceedsPlanRate: 0,
      significantlyBelowRate: 0,
      noPlanRate: 0,
      sameHomeSiblings: 0,
      separatedSiblings: 0,
    };
  }

  const sameHome = relationships.filter((r) => r.siblingPlacement === "same_home").length;
  const separated = relationships.length - sameHome;

  let contactPlan = 0;
  let meetsOrExceeds = 0;
  let significantlyBelow = 0;
  let noPlan = 0;

  for (const r of relationships) {
    if (r.contactPlanExists) contactPlan++;
    if (r.frequencyCompliance === "meets_plan" || r.frequencyCompliance === "exceeds_plan") meetsOrExceeds++;
    if (r.frequencyCompliance === "significantly_below") significantlyBelow++;
    if (r.frequencyCompliance === "no_plan") noPlan++;
  }

  const contactPlanRate = pct(contactPlan, relationships.length);
  const meetsOrExceedsPlanRate = pct(meetsOrExceeds, relationships.length);
  const significantlyBelowRate = pct(significantlyBelow, relationships.length);
  const noPlanRate = pct(noPlan, relationships.length);

  // Scoring: contact plan (0-7), meets/exceeds plan (0-7), low significantly-below bonus (0-5),
  // low no-plan bonus (0-6)
  let score = 0;
  score += Math.round((contactPlanRate / 100) * 7);
  score += Math.round((meetsOrExceedsPlanRate / 100) * 7);
  if (significantlyBelowRate === 0) score += 5;
  else if (significantlyBelowRate <= 20) score += 2;
  if (noPlanRate === 0) score += 6;
  else if (noPlanRate <= 20) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRelationships: relationships.length,
    contactPlanRate,
    meetsOrExceedsPlanRate,
    significantlyBelowRate,
    noPlanRate,
    sameHomeSiblings: sameHome,
    separatedSiblings: separated,
  };
}

/**
 * Evaluates quality of contact sessions.
 * Empty = 0 (no sessions documented = non-compliant if separated siblings exist).
 */
export function evaluateContactQuality(
  sessions: SiblingContactSession[],
): ContactQualityResult {
  if (sessions.length === 0) {
    return {
      overallScore: 0,
      totalSessions: 0,
      excellentGoodRate: 0,
      positiveOutcomeRate: 0,
      childViewSoughtRate: 0,
      childEnjoyedRate: 0,
      cancellationRate: 0,
      averageDuration: 0,
    };
  }

  let excellentGood = 0;
  let positive = 0;
  let childViewSought = 0;
  let childEnjoyed = 0;
  let childEnjoyedTotal = 0;
  let cancellations = 0;
  let totalDuration = 0;

  for (const s of sessions) {
    if (s.qualityRating === "excellent" || s.qualityRating === "good") excellentGood++;
    if (s.outcome === "positive") positive++;
    if (s.childViewSought) childViewSought++;
    if (s.childEnjoyedContact !== null) {
      childEnjoyedTotal++;
      if (s.childEnjoyedContact) childEnjoyed++;
    }
    if (s.outcome === "cancelled_by_child" || s.outcome === "cancelled_by_sibling" ||
        s.outcome === "cancelled_by_authority" || s.outcome === "no_show") {
      cancellations++;
    }
    totalDuration += s.duration;
  }

  const excellentGoodRate = pct(excellentGood, sessions.length);
  const positiveOutcomeRate = pct(positive, sessions.length);
  const childViewSoughtRate = pct(childViewSought, sessions.length);
  const childEnjoyedRate = pct(childEnjoyed, childEnjoyedTotal);
  const cancellationRate = pct(cancellations, sessions.length);
  const averageDuration = Math.round(totalDuration / sessions.length);

  // Scoring: excellent/good quality (0-7), positive outcomes (0-6), child view (0-5),
  // low cancellation bonus (0-4), child enjoyed (0-3)
  let score = 0;
  score += Math.round((excellentGoodRate / 100) * 7);
  score += Math.round((positiveOutcomeRate / 100) * 6);
  score += Math.round((childViewSoughtRate / 100) * 5);
  if (cancellationRate === 0) score += 4;
  else if (cancellationRate <= 10) score += 2;
  score += Math.round((childEnjoyedRate / 100) * 3);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalSessions: sessions.length,
    excellentGoodRate,
    positiveOutcomeRate,
    childViewSoughtRate,
    childEnjoyedRate,
    cancellationRate,
    averageDuration,
  };
}

/**
 * Evaluates sibling contact review compliance.
 * Empty = 0 (no reviews = non-compliant).
 */
export function evaluateReviewCompliance(
  reviews: SiblingContactReview[],
): ReviewComplianceResult {
  if (reviews.length === 0) {
    return {
      overallScore: 0,
      totalReviews: 0,
      allSiblingsConsideredRate: 0,
      contactPlanUpdatedRate: 0,
      childViewsIncludedRate: 0,
      barriersAddressedRate: 0,
      outcomeSatisfactoryRate: 0,
    };
  }

  let allSiblings = 0;
  let planUpdated = 0;
  let childViews = 0;
  let barriers = 0;
  let satisfactory = 0;

  for (const r of reviews) {
    if (r.allSiblingsConsidered) allSiblings++;
    if (r.contactPlanUpdated) planUpdated++;
    if (r.childViewsIncluded) childViews++;
    if (r.barriersAddressed) barriers++;
    if (r.outcomeSatisfactory) satisfactory++;
  }

  const allSiblingsConsideredRate = pct(allSiblings, reviews.length);
  const contactPlanUpdatedRate = pct(planUpdated, reviews.length);
  const childViewsIncludedRate = pct(childViews, reviews.length);
  const barriersAddressedRate = pct(barriers, reviews.length);
  const outcomeSatisfactoryRate = pct(satisfactory, reviews.length);

  // Scoring: all siblings considered (0-6), child views (0-6), plan updated (0-5),
  // barriers addressed (0-4), satisfactory outcome (0-4)
  let score = 0;
  score += Math.round((allSiblingsConsideredRate / 100) * 6);
  score += Math.round((childViewsIncludedRate / 100) * 6);
  score += Math.round((contactPlanUpdatedRate / 100) * 5);
  score += Math.round((barriersAddressedRate / 100) * 4);
  score += Math.round((outcomeSatisfactoryRate / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalReviews: reviews.length,
    allSiblingsConsideredRate,
    contactPlanUpdatedRate,
    childViewsIncludedRate,
    barriersAddressedRate,
    outcomeSatisfactoryRate,
  };
}

/**
 * Evaluates staff readiness for sibling contact facilitation.
 * Empty = 0.
 */
export function evaluateStaffReadiness(
  training: StaffSiblingTraining[],
): StaffReadinessResult {
  if (training.length === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      siblingAwarenessRate: 0,
      facilitatingSkillsRate: 0,
      difficultContactRate: 0,
      childViewsRate: 0,
      legalKnowledgeRate: 0,
    };
  }

  let awareness = 0;
  let facilitating = 0;
  let difficult = 0;
  let childViews = 0;
  let legal = 0;

  for (const t of training) {
    if (t.siblingRelationshipAwareness) awareness++;
    if (t.facilitatingContactSkills) facilitating++;
    if (t.managingDifficultContact) difficult++;
    if (t.childViewsTraining) childViews++;
    if (t.legalFrameworkKnowledge) legal++;
  }

  const siblingAwarenessRate = pct(awareness, training.length);
  const facilitatingSkillsRate = pct(facilitating, training.length);
  const difficultContactRate = pct(difficult, training.length);
  const childViewsRate = pct(childViews, training.length);
  const legalKnowledgeRate = pct(legal, training.length);

  // Scoring: awareness (0-6), facilitating (0-6), difficult contact (0-5),
  // child views (0-4), legal (0-4)
  let score = 0;
  score += Math.round((siblingAwarenessRate / 100) * 6);
  score += Math.round((facilitatingSkillsRate / 100) * 6);
  score += Math.round((difficultContactRate / 100) * 5);
  score += Math.round((childViewsRate / 100) * 4);
  score += Math.round((legalKnowledgeRate / 100) * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalStaff: training.length,
    siblingAwarenessRate,
    facilitatingSkillsRate,
    difficultContactRate,
    childViewsRate,
    legalKnowledgeRate,
  };
}

// ── Child Profiles ────────────────────────────────────────────────────────

export function buildChildSiblingProfiles(
  relationships: SiblingRelationship[],
  sessions: SiblingContactSession[],
): ChildSiblingProfile[] {
  const childIds = new Set<string>();
  const childNames = new Map<string, string>();

  for (const r of relationships) {
    childIds.add(r.childId);
    childNames.set(r.childId, r.childName);
  }

  return Array.from(childIds).map((childId) => {
    const childRelationships = relationships.filter((r) => r.childId === childId);
    const childSessions = sessions.filter((s) => s.childId === childId);
    const separatedCount = childRelationships.filter(
      (r) => r.siblingPlacement !== "same_home",
    ).length;

    const positiveSessions = childSessions.filter((s) => s.outcome === "positive").length;
    const positiveOutcomeRate = pct(positiveSessions, childSessions.length);

    const meetsContactPlan = childRelationships.every(
      (r) => r.frequencyCompliance === "meets_plan" || r.frequencyCompliance === "exceeds_plan" || r.siblingPlacement === "same_home",
    );

    // Score 0-10
    let score = 0;
    if (meetsContactPlan) score += 3;
    else if (childRelationships.some((r) => r.frequencyCompliance === "meets_plan" || r.frequencyCompliance === "exceeds_plan")) score += 1;
    score += Math.round((positiveOutcomeRate / 100) * 3);
    if (childRelationships.every((r) => r.contactPlanExists)) score += 2;
    if (childSessions.length > 0) {
      const viewSought = childSessions.filter((s) => s.childViewSought).length;
      score += Math.round((pct(viewSought, childSessions.length) / 100) * 2);
    } else if (separatedCount === 0) {
      score += 2; // All siblings in same home, no sessions needed
    }

    return {
      childId,
      childName: childNames.get(childId) || "Unknown",
      siblingCount: childRelationships.length,
      separatedCount,
      sessionsInPeriod: childSessions.length,
      positiveOutcomeRate,
      meetsContactPlan,
      overallScore: Math.min(10, score),
    };
  });
}

// ── Main Function ──────────────────────────────────────────────────────────

export function generateSiblingContactQualityIntelligence(
  relationships: SiblingRelationship[],
  sessions: SiblingContactSession[],
  reviews: SiblingContactReview[],
  training: StaffSiblingTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): SiblingContactQualityIntelligence {
  const contactFrequency = evaluateContactFrequency(relationships);
  const contactQuality = evaluateContactQuality(sessions);
  const reviewCompliance = evaluateReviewCompliance(reviews);
  const staffReadiness = evaluateStaffReadiness(training);

  const rawScore =
    contactFrequency.overallScore +
    contactQuality.overallScore +
    reviewCompliance.overallScore +
    staffReadiness.overallScore;

  const overallScore = Math.min(100, Math.max(0, rawScore));
  const rating = getRating(overallScore);

  const childProfiles = buildChildSiblingProfiles(relationships, sessions);

  // ── Strengths ──
  const strengths: string[] = [];
  if (relationships.length > 0 && contactFrequency.contactPlanRate === 100)
    strengths.push("Contact plans in place for all sibling relationships");
  if (relationships.length > 0 && contactFrequency.meetsOrExceedsPlanRate >= 90)
    strengths.push("Contact frequency meets or exceeds plan for " + contactFrequency.meetsOrExceedsPlanRate + "% of relationships");
  if (sessions.length > 0 && contactQuality.excellentGoodRate >= 85)
    strengths.push("High quality sibling contact — " + contactQuality.excellentGoodRate + "% rated excellent or good");
  if (sessions.length > 0 && contactQuality.childViewSoughtRate === 100)
    strengths.push("Child's views consistently sought in all contact sessions");
  if (sessions.length > 0 && contactQuality.positiveOutcomeRate >= 90)
    strengths.push("Positive outcomes in " + contactQuality.positiveOutcomeRate + "% of sibling contact sessions");
  if (sessions.length > 0 && contactQuality.cancellationRate === 0)
    strengths.push("No cancelled sibling contact sessions in period");
  if (reviews.length > 0 && reviewCompliance.allSiblingsConsideredRate === 100)
    strengths.push("All siblings considered in every contact review");
  if (training.length > 0 && staffReadiness.siblingAwarenessRate === 100)
    strengths.push("All staff trained in sibling relationship awareness");

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (relationships.length === 0)
    areasForImprovement.push("No sibling relationships documented — all children should have sibling status recorded");
  if (relationships.length > 0 && contactFrequency.contactPlanRate < 100)
    areasForImprovement.push("Contact plans missing for " + (100 - contactFrequency.contactPlanRate) + "% of sibling relationships");
  if (relationships.length > 0 && contactFrequency.significantlyBelowRate > 0)
    areasForImprovement.push(contactFrequency.significantlyBelowRate + "% of relationships significantly below planned contact frequency");
  if (sessions.length > 0 && contactQuality.childViewSoughtRate < 80)
    areasForImprovement.push("Child views sought in only " + contactQuality.childViewSoughtRate + "% of sessions — target 100%");
  if (sessions.length > 0 && contactQuality.cancellationRate > 15)
    areasForImprovement.push("High cancellation rate at " + contactQuality.cancellationRate + "% — investigate causes");
  if (reviews.length === 0 && relationships.length > 0)
    areasForImprovement.push("No sibling contact reviews completed — schedule regular reviews");
  if (training.length === 0)
    areasForImprovement.push("No staff training records for sibling contact facilitation");
  if (sessions.length > 0 && contactQuality.excellentGoodRate < 60)
    areasForImprovement.push("Contact quality below expectations — only " + contactQuality.excellentGoodRate + "% rated good or excellent");

  // ── Actions ──
  const actions: string[] = [];
  const separated = relationships.filter((r) => r.siblingPlacement !== "same_home");
  const noContact = separated.filter((r) => r.lastContactDate === null);
  if (noContact.length > 0)
    actions.push("URGENT: " + noContact.length + " separated sibling relationship(s) with no recorded contact — arrange contact immediately");
  if (relationships.length > 0 && contactFrequency.noPlanRate > 0)
    actions.push("URGENT: " + contactFrequency.noPlanRate + "% of sibling relationships have no contact plan — statutory requirement");
  const harmful = sessions.filter((s) => s.qualityRating === "harmful");
  if (harmful.length > 0)
    actions.push("URGENT: " + harmful.length + " contact session(s) rated as harmful — immediate safeguarding review required");
  if (relationships.length === 0)
    actions.push("Document all sibling relationships for every child — required by care planning regulations");
  if (relationships.length > 0 && contactFrequency.significantlyBelowRate > 20)
    actions.push("Review contact barriers for relationships significantly below planned frequency");
  if (reviews.length === 0 && relationships.length > 0)
    actions.push("Schedule sibling contact reviews — at minimum every 6 months");
  if (training.length > 0 && staffReadiness.facilitatingSkillsRate < 75)
    actions.push("Arrange facilitating contact skills training — only " + staffReadiness.facilitatingSkillsRate + "% of staff trained");

  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 13 — Contact: duty to promote contact between children and family members",
    "Children Act 1989, s34 — Reasonable contact with parents and siblings for looked-after children",
    "SCCIF — Overall experiences: quality of sibling relationships and contact",
    "NMS 9 — Contact: proactive support for maintaining family relationships",
    "Adoption & Children Act 2002 — Duty to consider sibling placement together where possible",
    "UNCRC Article 8 — Right to preserve identity and family relations",
    "UNCRC Article 9 — Right to maintain contact with family when separated",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    contactFrequency,
    contactQuality,
    reviewCompliance,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
