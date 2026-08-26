import { below, meets, rate } from "@/lib/metrics/rate";
// Placement Stability Continuity Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()
//
// Evaluates placement stability, disruption prevention, and continuity of care
// for children in residential settings.
//
// Regulatory basis:
//   - CHR 2015 Regulation 5 — Engaging with the wider community
//   - CHR 2015 Regulation 7 — The children's wishes and feelings standard
//   - SCCIF — Stability of placements and minimising disruption
//   - NMS 3 — Placement plan and review
//   - Children Act 1989 — Section 22C placement duties
//   - Care Planning Regulations 2010 — Placement stability
//   - NICE Guideline CG76 — Looked after children and young people

// ── Types ──────────────────────────────────────────────────────────────────

export type ReviewType =
  | "stability_assessment"
  | "disruption_meeting"
  | "placement_plan_review"
  | "matching_review"
  | "transition_planning"
  | "contact_review"
  | "key_worker_session"
  | "multi_agency_review";

export type StabilityStatus =
  | "stable"
  | "mostly_stable"
  | "some_concerns"
  | "at_risk"
  | "disrupted";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const reviewTypeLabels: Record<ReviewType, string> = {
  stability_assessment: "Stability Assessment",
  disruption_meeting: "Disruption Meeting",
  placement_plan_review: "Placement Plan Review",
  matching_review: "Matching Review",
  transition_planning: "Transition Planning",
  contact_review: "Contact Review",
  key_worker_session: "Key Worker Session",
  multi_agency_review: "Multi-Agency Review",
};

const stabilityStatusLabels: Record<StabilityStatus, string> = {
  stable: "Stable",
  mostly_stable: "Mostly Stable",
  some_concerns: "Some Concerns",
  at_risk: "At Risk",
  disrupted: "Disrupted",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getReviewTypeLabel(t: ReviewType): string {
  return reviewTypeLabels[t] ?? t;
}

export function getStabilityStatusLabel(s: StabilityStatus): string {
  return stabilityStatusLabels[s] ?? s;
}

export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface PlacementReview {
  id: string;
  childId: string;
  childName: string;
  reviewDate: string;
  reviewType: ReviewType;
  stabilityStatus: StabilityStatus;
  childParticipated: boolean;
  familyEngaged: boolean;
  continuityMaintained: boolean;
  documentedInPlan: boolean;
  managementOversight: boolean;
  actionsTaken: boolean;
}

export interface PlacementPolicy {
  id: string;
  stabilityStrategy: boolean;
  matchingProcess: boolean;
  disruptionProtocol: boolean;
  transitionFramework: boolean;
  contactArrangements: boolean;
  contingencyPlanning: boolean;
  regularReview: boolean;
}

export interface StaffPlacementTraining {
  id: string;
  staffId: string;
  staffName: string;
  attachmentTheory: boolean;
  therapeuticCaregiving: boolean;
  disruptionPrevention: boolean;
  transitionSupport: boolean;
  familyEngagement: boolean;
  multiAgencyWorking: boolean;
}

// ── Result Types ───────────────────────────────────────────────────────────

export interface PlacementQualityResult {
  totalReviews: number;
  /** null when the population is empty — nothing measured, not 0%. */
  stabilityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childParticipatedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  familyEngagedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  continuityRate: number | null;
  score: number;
}

export interface PlacementComplianceResult {
  totalReviews: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  managementOversightRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionsTakenRate: number | null;
  reviewTypeDiversityRatio: number;
  score: number;
}

export interface PlacementPolicyResult {
  stabilityStrategy: boolean;
  matchingProcess: boolean;
  disruptionProtocol: boolean;
  transitionFramework: boolean;
  contactArrangements: boolean;
  contingencyPlanning: boolean;
  regularReview: boolean;
  score: number;
}

export interface StaffPlacementReadinessResult {
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  attachmentTheoryRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticCaregivingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  disruptionPreventionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  transitionSupportRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  familyEngagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyWorkingRate: number | null;
  score: number;
}

export interface ChildPlacementProfile {
  childId: string;
  childName: string;
  totalReviews: number;
  /** null when the population is empty — nothing measured, not 0%. */
  stabilityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childParticipatedRate: number | null;
  reviewTypes: ReviewType[];
  overallScore: number;
}

export interface PlacementStabilityContinuityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  placementQuality: PlacementQualityResult;
  placementCompliance: PlacementComplianceResult;
  placementPolicy: PlacementPolicyResult;
  staffReadiness: StaffPlacementReadinessResult;
  childProfiles: ChildPlacementProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Placement Quality (0-25) ──────────────────────────────────

export function evaluatePlacementQuality(
  reviews: PlacementReview[],
): PlacementQualityResult {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      stabilityRate: null,
      childParticipatedRate: null,
      familyEngagedRate: null,
      continuityRate: null,
      score: 0,
    };
  }

  const total = reviews.length;
  const stableCount = reviews.filter(
    (r) => r.stabilityStatus === "stable" || r.stabilityStatus === "mostly_stable",
  ).length;

  const stabilityRate = rate(stableCount, total);
  const childParticipatedRate = rate(
    reviews.filter((r) => r.childParticipated).length,
    total,
  );
  const familyEngagedRate = rate(
    reviews.filter((r) => r.familyEngaged).length,
    total,
  );
  const continuityRate = rate(
    reviews.filter((r) => r.continuityMaintained).length,
    total,
  );

  // Scoring: stability 0-7, childParticipated 0-6, familyEngaged 0-6, continuity 0-6 = max 25
  const stabilityScore = Math.round((Math.min(stabilityRate!, 100) / 100) * 7);
  const participatedScore = Math.round((Math.min(childParticipatedRate!, 100) / 100) * 6);
  const familyScore = Math.round((Math.min(familyEngagedRate!, 100) / 100) * 6);
  const continuityScore = Math.round((Math.min(continuityRate!, 100) / 100) * 6);

  const score = Math.min(25, stabilityScore + participatedScore + familyScore + continuityScore);

  return {
    totalReviews: total,
    stabilityRate,
    childParticipatedRate,
    familyEngagedRate,
    continuityRate,
    score,
  };
}

// ── Evaluator 2: Placement Compliance (0-25) ──────────────────────────────

export function evaluatePlacementCompliance(
  reviews: PlacementReview[],
): PlacementComplianceResult {
  if (reviews.length === 0) {
    return {
      totalReviews: 0,
      documentedRate: null,
      managementOversightRate: null,
      actionsTakenRate: null,
      reviewTypeDiversityRatio: 0,
      score: 0,
    };
  }

  const total = reviews.length;
  const documentedRate = rate(
    reviews.filter((r) => r.documentedInPlan).length,
    total,
  );
  const managementOversightRate = rate(
    reviews.filter((r) => r.managementOversight).length,
    total,
  );
  const actionsTakenRate = rate(
    reviews.filter((r) => r.actionsTaken).length,
    total,
  );
  const uniqueTypes = new Set(reviews.map((r) => r.reviewType)).size;
  const reviewTypeDiversityRatio = Math.round((uniqueTypes / 8) * 100);

  // Scoring: documented 0-8, managementOversight 0-7, actionsTaken 0-5, diversity 0-5 = max 25
  const documentedScore = Math.round((Math.min(documentedRate!, 100) / 100) * 8);
  const oversightScore = Math.round((Math.min(managementOversightRate!, 100) / 100) * 7);
  const actionsScore = Math.round((Math.min(actionsTakenRate!, 100) / 100) * 5);
  const diversityScore = Math.round((Math.min(reviewTypeDiversityRatio, 100) / 100) * 5);

  const score = Math.min(25, documentedScore + oversightScore + actionsScore + diversityScore);

  return {
    totalReviews: total,
    documentedRate,
    managementOversightRate,
    actionsTakenRate,
    reviewTypeDiversityRatio,
    score,
  };
}

// ── Evaluator 3: Placement Policy (0-25) ──────────────────────────────────

export function evaluatePlacementPolicy(
  policy: PlacementPolicy | null,
): PlacementPolicyResult {
  if (policy === null) {
    return {
      stabilityStrategy: false,
      matchingProcess: false,
      disruptionProtocol: false,
      transitionFramework: false,
      contactArrangements: false,
      contingencyPlanning: false,
      regularReview: false,
      score: 0,
    };
  }

  // Weights: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.stabilityStrategy) score += 4;
  if (policy.matchingProcess) score += 4;
  if (policy.disruptionProtocol) score += 4;
  if (policy.transitionFramework) score += 4;
  if (policy.contactArrangements) score += 3;
  if (policy.contingencyPlanning) score += 3;
  if (policy.regularReview) score += 3;

  return {
    stabilityStrategy: policy.stabilityStrategy,
    matchingProcess: policy.matchingProcess,
    disruptionProtocol: policy.disruptionProtocol,
    transitionFramework: policy.transitionFramework,
    contactArrangements: policy.contactArrangements,
    contingencyPlanning: policy.contingencyPlanning,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Evaluator 4: Staff Placement Readiness (0-25) ─────────────────────────

export function evaluateStaffPlacementReadiness(
  staff: StaffPlacementTraining[],
): StaffPlacementReadinessResult {
  if (staff.length === 0) {
    return {
      totalStaff: 0,
      attachmentTheoryRate: null,
      therapeuticCaregivingRate: null,
      disruptionPreventionRate: null,
      transitionSupportRate: null,
      familyEngagementRate: null,
      multiAgencyWorkingRate: null,
      score: 0,
    };
  }

  const total = staff.length;
  const attachmentTheoryRate = rate(staff.filter((s) => s.attachmentTheory).length, total);
  const therapeuticCaregivingRate = rate(staff.filter((s) => s.therapeuticCaregiving).length, total);
  const disruptionPreventionRate = rate(staff.filter((s) => s.disruptionPrevention).length, total);
  const transitionSupportRate = rate(staff.filter((s) => s.transitionSupport).length, total);
  const familyEngagementRate = rate(staff.filter((s) => s.familyEngagement).length, total);
  const multiAgencyWorkingRate = rate(staff.filter((s) => s.multiAgencyWorking).length, total);

  // Weights: 6+5+5+4+3+2 = 25
  const s1 = Math.round((Math.min(attachmentTheoryRate!, 100) / 100) * 6);
  const s2 = Math.round((Math.min(therapeuticCaregivingRate!, 100) / 100) * 5);
  const s3 = Math.round((Math.min(disruptionPreventionRate!, 100) / 100) * 5);
  const s4 = Math.round((Math.min(transitionSupportRate!, 100) / 100) * 4);
  const s5 = Math.round((Math.min(familyEngagementRate!, 100) / 100) * 3);
  const s6 = Math.round((Math.min(multiAgencyWorkingRate!, 100) / 100) * 2);

  const score = Math.min(25, s1 + s2 + s3 + s4 + s5 + s6);

  return {
    totalStaff: total,
    attachmentTheoryRate,
    therapeuticCaregivingRate,
    disruptionPreventionRate,
    transitionSupportRate,
    familyEngagementRate,
    multiAgencyWorkingRate,
    score,
  };
}

// ── buildChildPlacementProfiles ────────────────────────────────────────────

export function buildChildPlacementProfiles(
  reviews: PlacementReview[],
): ChildPlacementProfile[] {
  if (reviews.length === 0) return [];

  const grouped = new Map<string, PlacementReview[]>();
  for (const r of reviews) {
    const existing = grouped.get(r.childId) ?? [];
    existing.push(r);
    grouped.set(r.childId, existing);
  }

  const profiles: ChildPlacementProfile[] = [];

  for (const [childId, childReviews] of grouped) {
    const childName = childReviews[0].childName;
    const totalReviews = childReviews.length;

    const stableCount = childReviews.filter(
      (r) => r.stabilityStatus === "stable" || r.stabilityStatus === "mostly_stable",
    ).length;
    const stabilityRate = rate(stableCount, totalReviews);

    const childParticipatedRate = rate(
      childReviews.filter((r) => r.childParticipated).length,
      totalReviews,
    );

    const uniqueTypes = new Set(childReviews.map((r) => r.reviewType));
    const reviewTypes = Array.from(uniqueTypes) as ReviewType[];

    // frequencyScore: >=10 -> 2, >=5 -> 1, else 0
    const frequencyScore = totalReviews >= 10 ? 2 : totalReviews >= 5 ? 1 : 0;

    // stabilityScore: >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    const stabilityScore = meets(stabilityRate, 80) ? 3 : meets(stabilityRate, 60) ? 2 : meets(stabilityRate, 40) ? 1 : 0;

    // participationScore: >=80 -> 3, >=60 -> 2, >=40 -> 1, else 0
    const participationScore = meets(childParticipatedRate, 80) ? 3 : meets(childParticipatedRate, 60) ? 2 : meets(childParticipatedRate, 40) ? 1 : 0;

    // diversityBonus: >=4 types -> 2, >=2 types -> 1, else 0
    const diversityBonus = uniqueTypes.size >= 4 ? 2 : uniqueTypes.size >= 2 ? 1 : 0;

    const overallScore = Math.min(10, frequencyScore + stabilityScore + participationScore + diversityBonus);

    profiles.push({
      childId,
      childName,
      totalReviews,
      stabilityRate,
      childParticipatedRate,
      reviewTypes,
      overallScore,
    });
  }

  return profiles;
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export function generatePlacementStabilityContinuityIntelligence(
  reviews: PlacementReview[],
  policy: PlacementPolicy | null,
  staff: StaffPlacementTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PlacementStabilityContinuityIntelligence {
  const placementQuality = evaluatePlacementQuality(reviews);
  const placementCompliance = evaluatePlacementCompliance(reviews);
  const placementPolicy = evaluatePlacementPolicy(policy);
  const staffReadiness = evaluateStaffPlacementReadiness(staff);
  const childProfiles = buildChildPlacementProfiles(reviews);

  const overallScore = Math.min(
    100,
    placementQuality.score + placementCompliance.score + placementPolicy.score + staffReadiness.score,
  );
  const rating = getRating(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];

  if (meets(placementQuality.stabilityRate, 80)) {
    strengths.push("High placement stability rate indicates children are settled and secure in their placements");
  }
  if (meets(placementQuality.childParticipatedRate, 80)) {
    strengths.push("Children are consistently participating in their placement reviews, reflecting a child-centred approach");
  }
  if (meets(placementQuality.familyEngagedRate, 80)) {
    strengths.push("Strong family engagement in placement reviews supports continuity and connectedness");
  }
  if (meets(placementQuality.continuityRate, 80)) {
    strengths.push("Continuity of care is being well maintained across placement reviews");
  }
  if (meets(placementCompliance.documentedRate, 80)) {
    strengths.push("Placement plans are well documented with clear records maintained");
  }
  if (meets(placementCompliance.managementOversightRate, 80)) {
    strengths.push("Strong management oversight of placement stability processes");
  }
  if (placementCompliance.reviewTypeDiversityRatio >= 75) {
    strengths.push("A diverse range of review types ensures comprehensive placement monitoring");
  }
  if (placementPolicy.score >= 20) {
    strengths.push("Robust placement stability policies are in place covering key areas");
  }
  if (staffReadiness.score >= 20) {
    strengths.push("Staff demonstrate strong placement readiness across all competency areas");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];

  if (below(placementQuality.stabilityRate, 60)) {
    areasForImprovement.push("Placement stability rate is below expected levels — disruption prevention strategies need strengthening");
  }
  if (below(placementQuality.childParticipatedRate, 60)) {
    areasForImprovement.push("Child participation in placement reviews needs improvement to meet the wishes and feelings standard");
  }
  if (below(placementQuality.familyEngagedRate, 60)) {
    areasForImprovement.push("Family engagement in the placement review process requires development");
  }
  if (below(placementQuality.continuityRate, 60)) {
    areasForImprovement.push("Continuity of care is not consistently maintained across reviews");
  }
  if (below(placementCompliance.documentedRate, 60)) {
    areasForImprovement.push("Documentation of placement plans needs to be more consistently completed");
  }
  if (below(placementCompliance.managementOversightRate, 60)) {
    areasForImprovement.push("Management oversight of placement stability processes should be increased");
  }
  if (placementCompliance.reviewTypeDiversityRatio < 50) {
    areasForImprovement.push("A wider range of review types should be used for comprehensive placement monitoring");
  }
  if (placementPolicy.score < 15) {
    areasForImprovement.push("Placement stability policies have significant gaps that need addressing");
  }
  if (staffReadiness.score < 15) {
    areasForImprovement.push("Staff training in placement stability competencies needs further development");
  }

  // ── Actions ──
  const actions: string[] = [];

  if (placementPolicy.score === 0) {
    actions.push("URGENT: No placement stability policy is in place — develop and implement a comprehensive placement stability policy immediately");
  } else {
    if (!placementPolicy.stabilityStrategy) {
      actions.push("URGENT: Develop a placement stability strategy as part of the policy framework");
    }
    if (!placementPolicy.disruptionProtocol) {
      actions.push("URGENT: Implement a disruption prevention and response protocol");
    }
    if (!placementPolicy.matchingProcess) {
      actions.push("Establish a formal matching process for placement decisions");
    }
    if (!placementPolicy.transitionFramework) {
      actions.push("Develop a transition framework to support placement changes");
    }
    if (!placementPolicy.contactArrangements) {
      actions.push("Review and formalise contact arrangements within placement plans");
    }
    if (!placementPolicy.contingencyPlanning) {
      actions.push("Ensure contingency planning is included in all placement plans");
    }
    if (!placementPolicy.regularReview) {
      actions.push("Implement a schedule for regular review of placement stability");
    }
  }

  if (staffReadiness.score === 0) {
    actions.push("URGENT: No staff have completed placement stability training — develop and deliver a comprehensive training programme");
  } else {
    if (below(staffReadiness.attachmentTheoryRate, 80)) {
      actions.push("URGENT: Prioritise attachment theory training for all staff to support placement stability");
    }
    if (below(staffReadiness.therapeuticCaregivingRate, 80)) {
      actions.push("Schedule therapeutic caregiving training to strengthen placement support skills");
    }
    if (below(staffReadiness.disruptionPreventionRate, 80)) {
      actions.push("URGENT: Deliver disruption prevention training to all care staff");
    }
    if (below(staffReadiness.transitionSupportRate, 80)) {
      actions.push("Provide transition support training to improve placement change outcomes");
    }
    if (below(staffReadiness.familyEngagementRate, 80)) {
      actions.push("Develop family engagement skills through targeted training");
    }
    if (below(staffReadiness.multiAgencyWorkingRate, 80)) {
      actions.push("Arrange multi-agency working training to improve collaborative practice");
    }
  }

  if (below(placementQuality.stabilityRate, 60)) {
    actions.push("Convene a placement stability review meeting to address disruption concerns");
  }
  if (below(placementQuality.childParticipatedRate, 60)) {
    actions.push("Implement strategies to increase child participation in placement reviews");
  }
  if (below(placementCompliance.documentedRate, 60)) {
    actions.push("Establish an audit process for placement plan documentation");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 5 — Engaging with the wider community",
    "CHR 2015 Regulation 7 — The children's wishes and feelings standard",
    "SCCIF — Stability of placements and minimising disruption",
    "NMS 3 — Placement plan and review",
    "Children Act 1989 — Section 22C placement duties",
    "Care Planning Regulations 2010 — Placement stability",
    "NICE Guideline CG76 — Looked after children and young people",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    placementQuality,
    placementCompliance,
    placementPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
