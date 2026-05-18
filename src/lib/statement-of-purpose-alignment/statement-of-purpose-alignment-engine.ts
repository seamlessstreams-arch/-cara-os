// ==============================================================================
// Cornerstone -- Statement of Purpose Alignment Intelligence Engine
//
// Pure deterministic engine -- no AI, no external calls.
// Measures how well the actual care provided aligns with the children's
// home's registered Statement of Purpose (SoP). Ofsted inspectors
// specifically assess this alignment.
//
// Maps to: CHR 2015 Reg 16 (statement of purpose), CHR 2015 Reg 7
// (registered person), SCCIF -- leadership and management, NMS 1
// (statement of purpose and function), UNCRC Article 3 (best interests),
// CA 1989 s22(3)(a)
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type SoPSection =
  | "ethos_values"
  | "care_approach"
  | "admission_criteria"
  | "staffing_model"
  | "education_support"
  | "health_wellbeing"
  | "behaviour_management"
  | "safeguarding"
  | "family_contact"
  | "transition_planning"
  | "location_community"
  | "complaints_procedure";

export type AlignmentLevel =
  | "fully_aligned"
  | "mostly_aligned"
  | "partially_aligned"
  | "not_aligned"
  | "not_assessed";

export type ReviewStatus =
  | "current"
  | "due_for_review"
  | "overdue"
  | "not_completed";

export type EvidenceQuality =
  | "strong"
  | "adequate"
  | "limited"
  | "no_evidence";

export type StakeholderType =
  | "child"
  | "staff"
  | "social_worker"
  | "family"
  | "reg44_visitor"
  | "manager";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface SoPAlignmentAssessment {
  id: string;
  section: SoPSection;
  alignmentLevel: AlignmentLevel;
  assessedDate: string;
  assessedBy: string;
  evidenceQuality: EvidenceQuality;
  evidenceDescription: string | null;
  actionRequired: boolean;
  actionTaken: boolean | null;
}

export interface SoPReviewRecord {
  id: string;
  reviewDate: string;
  reviewedBy: string;
  sopVersion: string;
  allSectionsReviewed: boolean;
  childrenConsulted: boolean;
  staffConsulted: boolean;
  regulatoryChangesIncorporated: boolean;
  ofstedRecommendationsAddressed: boolean;
  status: ReviewStatus;
}

export interface StakeholderFeedback {
  id: string;
  stakeholderType: StakeholderType;
  date: string;
  awareOfSoP: boolean;
  sopReflectsReality: boolean;
  valuesEvident: boolean;
  suggestionsProvided: boolean;
}

export interface OfstedRecommendation {
  id: string;
  inspectionDate: string;
  recommendation: string;
  relatedSection: SoPSection | null;
  addressed: boolean;
  evidenceOfChange: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface AlignmentQualityResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  fullyAlignedRate: number; // pct
  notAlignedCount: number;
  strongEvidenceRate: number; // pct
  actionsRequiredCount: number;
  actionsTakenRate: number; // pct
  sectionDistribution: Record<SoPSection, number>;
}

export interface ReviewCurrencyResult {
  overallScore: number; // 0-25
  totalReviews: number;
  currentRate: number; // pct
  overdueCount: number;
  childrenConsultedRate: number; // pct
  staffConsultedRate: number; // pct
  regulatoryRate: number; // pct
  allSectionsRate: number; // pct
}

export interface StakeholderAwarenessResult {
  overallScore: number; // 0-25
  totalFeedback: number;
  awareRate: number; // pct
  reflectsRealityRate: number; // pct
  valuesEvidentRate: number; // pct
  suggestionsRate: number; // pct
  stakeholderDistribution: Record<StakeholderType, number>;
}

export interface OfstedResponseResult {
  overallScore: number; // 0-25
  totalRecommendations: number;
  addressedRate: number; // pct
  evidenceRate: number; // pct
  outstandingCount: number;
}

export interface SectionAlignmentProfile {
  section: SoPSection;
  latestAlignment: AlignmentLevel;
  evidenceQuality: EvidenceQuality;
  assessmentCount: number;
  overallScore: number; // 0-10
}

export interface StatementOfPurposeAlignmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100 capped
  rating: Rating;
  alignmentQuality: AlignmentQualityResult;
  reviewCurrency: ReviewCurrencyResult;
  stakeholderAwareness: StakeholderAwarenessResult;
  ofstedResponse: OfstedResponseResult;
  sectionProfiles: SectionAlignmentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

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

// -- Label Functions ----------------------------------------------------------

export function getSoPSectionLabel(section: SoPSection): string {
  const labels: Record<SoPSection, string> = {
    ethos_values: "Ethos & Values",
    care_approach: "Care Approach",
    admission_criteria: "Admission Criteria",
    staffing_model: "Staffing Model",
    education_support: "Education Support",
    health_wellbeing: "Health & Wellbeing",
    behaviour_management: "Behaviour Management",
    safeguarding: "Safeguarding",
    family_contact: "Family Contact",
    transition_planning: "Transition Planning",
    location_community: "Location & Community",
    complaints_procedure: "Complaints Procedure",
  };
  return labels[section] || section;
}

export function getAlignmentLevelLabel(level: AlignmentLevel): string {
  const labels: Record<AlignmentLevel, string> = {
    fully_aligned: "Fully Aligned",
    mostly_aligned: "Mostly Aligned",
    partially_aligned: "Partially Aligned",
    not_aligned: "Not Aligned",
    not_assessed: "Not Assessed",
  };
  return labels[level] || level;
}

export function getReviewStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    current: "Current",
    due_for_review: "Due for Review",
    overdue: "Overdue",
    not_completed: "Not Completed",
  };
  return labels[status] || status;
}

export function getEvidenceQualityLabel(quality: EvidenceQuality): string {
  const labels: Record<EvidenceQuality, string> = {
    strong: "Strong",
    adequate: "Adequate",
    limited: "Limited",
    no_evidence: "No Evidence",
  };
  return labels[quality] || quality;
}

export function getStakeholderTypeLabel(type: StakeholderType): string {
  const labels: Record<StakeholderType, string> = {
    child: "Child",
    staff: "Staff",
    social_worker: "Social Worker",
    family: "Family",
    reg44_visitor: "Reg 44 Visitor",
    manager: "Manager",
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

// -- Evaluators ---------------------------------------------------------------

/**
 * Evaluate alignment quality (0-25).
 *
 * Fully aligned rate: 0-8, strong evidence rate: 0-6, actions taken rate: 0-5.
 * Penalty: -3 per not_aligned section (capped so score >= 0).
 * Empty data = 0.
 */
export function evaluateAlignmentQuality(
  assessments: SoPAlignmentAssessment[],
): AlignmentQualityResult {
  const allSections: SoPSection[] = [
    "ethos_values", "care_approach", "admission_criteria", "staffing_model",
    "education_support", "health_wellbeing", "behaviour_management",
    "safeguarding", "family_contact", "transition_planning",
    "location_community", "complaints_procedure",
  ];

  const sectionDistribution = {} as Record<SoPSection, number>;
  for (const s of allSections) {
    sectionDistribution[s] = assessments.filter((a) => a.section === s).length;
  }

  if (assessments.length === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      fullyAlignedRate: 0,
      notAlignedCount: 0,
      strongEvidenceRate: 0,
      actionsRequiredCount: 0,
      actionsTakenRate: 0,
      sectionDistribution,
    };
  }

  const fullyAligned = assessments.filter((a) => a.alignmentLevel === "fully_aligned");
  const notAligned = assessments.filter((a) => a.alignmentLevel === "not_aligned");
  const strongEvidence = assessments.filter((a) => a.evidenceQuality === "strong");
  const actionsRequired = assessments.filter((a) => a.actionRequired);
  const actionsTaken = actionsRequired.filter((a) => a.actionTaken === true);

  const fullyAlignedRate = pct(fullyAligned.length, assessments.length);
  const strongEvidenceRate = pct(strongEvidence.length, assessments.length);
  const actionsTakenRate = pct(actionsTaken.length, actionsRequired.length);

  // Scoring components
  const alignedScore = Math.round((fullyAlignedRate / 100) * 8);
  const evidenceScore = Math.round((strongEvidenceRate / 100) * 6);
  const actionsScore = actionsRequired.length > 0
    ? Math.round((actionsTakenRate / 100) * 5)
    : 5; // no actions required = full marks

  let score = alignedScore + evidenceScore + actionsScore;

  // Penalty: -3 per not_aligned section
  score = Math.max(0, score - notAligned.length * 3);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalAssessments: assessments.length,
    fullyAlignedRate,
    notAlignedCount: notAligned.length,
    strongEvidenceRate,
    actionsRequiredCount: actionsRequired.length,
    actionsTakenRate,
    sectionDistribution,
  };
}

/**
 * Evaluate review currency (0-25).
 *
 * Current rate: 0-7, children consulted: 0-5, staff consulted: 0-4,
 * regulatory changes: 0-4, all sections reviewed: 0-3.
 * Penalty: -4 per overdue review.
 * Empty data = 0.
 */
export function evaluateReviewCurrency(
  reviews: SoPReviewRecord[],
): ReviewCurrencyResult {
  if (reviews.length === 0) {
    return {
      overallScore: 0,
      totalReviews: 0,
      currentRate: 0,
      overdueCount: 0,
      childrenConsultedRate: 0,
      staffConsultedRate: 0,
      regulatoryRate: 0,
      allSectionsRate: 0,
    };
  }

  const current = reviews.filter((r) => r.status === "current");
  const overdue = reviews.filter((r) => r.status === "overdue");
  const childrenConsulted = reviews.filter((r) => r.childrenConsulted);
  const staffConsulted = reviews.filter((r) => r.staffConsulted);
  const regulatory = reviews.filter((r) => r.regulatoryChangesIncorporated);
  const allSections = reviews.filter((r) => r.allSectionsReviewed);

  const currentRate = pct(current.length, reviews.length);
  const childrenConsultedRate = pct(childrenConsulted.length, reviews.length);
  const staffConsultedRate = pct(staffConsulted.length, reviews.length);
  const regulatoryRate = pct(regulatory.length, reviews.length);
  const allSectionsRate = pct(allSections.length, reviews.length);

  // Scoring components
  const currentScore = Math.round((currentRate / 100) * 7);
  const childrenScore = Math.round((childrenConsultedRate / 100) * 5);
  const staffScore = Math.round((staffConsultedRate / 100) * 4);
  const regulatoryScore = Math.round((regulatoryRate / 100) * 4);
  const allSectionsScore = Math.round((allSectionsRate / 100) * 3);

  let score = currentScore + childrenScore + staffScore + regulatoryScore + allSectionsScore;

  // Penalty: -4 per overdue review
  score = Math.max(0, score - overdue.length * 4);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalReviews: reviews.length,
    currentRate,
    overdueCount: overdue.length,
    childrenConsultedRate,
    staffConsultedRate,
    regulatoryRate,
    allSectionsRate,
  };
}

/**
 * Evaluate stakeholder awareness (0-25).
 *
 * Aware rate: 0-7, reflects reality: 0-7, values evident: 0-6,
 * suggestions rate: 0-5.
 * Empty data = 0.
 */
export function evaluateStakeholderAwareness(
  feedback: StakeholderFeedback[],
): StakeholderAwarenessResult {
  const allStakeholderTypes: StakeholderType[] = [
    "child", "staff", "social_worker", "family", "reg44_visitor", "manager",
  ];

  const stakeholderDistribution = {} as Record<StakeholderType, number>;
  for (const t of allStakeholderTypes) {
    stakeholderDistribution[t] = feedback.filter((f) => f.stakeholderType === t).length;
  }

  if (feedback.length === 0) {
    return {
      overallScore: 0,
      totalFeedback: 0,
      awareRate: 0,
      reflectsRealityRate: 0,
      valuesEvidentRate: 0,
      suggestionsRate: 0,
      stakeholderDistribution,
    };
  }

  const aware = feedback.filter((f) => f.awareOfSoP);
  const reflectsReality = feedback.filter((f) => f.sopReflectsReality);
  const valuesEvident = feedback.filter((f) => f.valuesEvident);
  const suggestions = feedback.filter((f) => f.suggestionsProvided);

  const awareRate = pct(aware.length, feedback.length);
  const reflectsRealityRate = pct(reflectsReality.length, feedback.length);
  const valuesEvidentRate = pct(valuesEvident.length, feedback.length);
  const suggestionsRate = pct(suggestions.length, feedback.length);

  // Scoring components
  const awareScore = Math.round((awareRate / 100) * 7);
  const realityScore = Math.round((reflectsRealityRate / 100) * 7);
  const valuesScore = Math.round((valuesEvidentRate / 100) * 6);
  const suggestionsScore = Math.round((suggestionsRate / 100) * 5);

  const score = awareScore + realityScore + valuesScore + suggestionsScore;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalFeedback: feedback.length,
    awareRate,
    reflectsRealityRate,
    valuesEvidentRate,
    suggestionsRate,
    stakeholderDistribution,
  };
}

/**
 * Evaluate Ofsted response (0-25).
 *
 * Addressed rate: 0-12, evidence of change: 0-8.
 * Penalty: -5 per outstanding recommendation.
 * Empty = 25 (no recommendations = good).
 */
export function evaluateOfstedResponse(
  recommendations: OfstedRecommendation[],
): OfstedResponseResult {
  if (recommendations.length === 0) {
    return {
      overallScore: 25,
      totalRecommendations: 0,
      addressedRate: 0,
      evidenceRate: 0,
      outstandingCount: 0,
    };
  }

  const addressed = recommendations.filter((r) => r.addressed);
  const withEvidence = recommendations.filter((r) => r.evidenceOfChange);
  const outstanding = recommendations.filter((r) => !r.addressed);

  const addressedRate = pct(addressed.length, recommendations.length);
  const evidenceRate = pct(withEvidence.length, recommendations.length);

  // Scoring components
  const addressedScore = Math.round((addressedRate / 100) * 12);
  const evidenceScore = Math.round((evidenceRate / 100) * 8);

  let score = addressedScore + evidenceScore;

  // Penalty: -5 per outstanding recommendation
  score = Math.max(0, score - outstanding.length * 5);

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    totalRecommendations: recommendations.length,
    addressedRate,
    evidenceRate,
    outstandingCount: outstanding.length,
  };
}

// -- Build Section Profiles ---------------------------------------------------

export function buildSectionProfiles(
  assessments: SoPAlignmentAssessment[],
): SectionAlignmentProfile[] {
  const allSections: SoPSection[] = [
    "ethos_values", "care_approach", "admission_criteria", "staffing_model",
    "education_support", "health_wellbeing", "behaviour_management",
    "safeguarding", "family_contact", "transition_planning",
    "location_community", "complaints_procedure",
  ];

  return allSections.map((section) => {
    const sectionAssessments = assessments.filter((a) => a.section === section);

    if (sectionAssessments.length === 0) {
      return {
        section,
        latestAlignment: "not_assessed" as AlignmentLevel,
        evidenceQuality: "no_evidence" as EvidenceQuality,
        assessmentCount: 0,
        overallScore: 0,
      };
    }

    // Sort by date descending to find latest
    const sorted = [...sectionAssessments].sort(
      (a, b) => new Date(b.assessedDate).getTime() - new Date(a.assessedDate).getTime(),
    );

    const latest = sorted[0];

    // Score 0-10 based on alignment and evidence
    const alignmentScores: Record<AlignmentLevel, number> = {
      fully_aligned: 6,
      mostly_aligned: 4,
      partially_aligned: 2,
      not_aligned: 0,
      not_assessed: 0,
    };
    const evidenceScores: Record<EvidenceQuality, number> = {
      strong: 4,
      adequate: 3,
      limited: 1,
      no_evidence: 0,
    };

    const overallScore = Math.min(
      10,
      alignmentScores[latest.alignmentLevel] + evidenceScores[latest.evidenceQuality],
    );

    return {
      section,
      latestAlignment: latest.alignmentLevel,
      evidenceQuality: latest.evidenceQuality,
      assessmentCount: sectionAssessments.length,
      overallScore,
    };
  });
}

// -- Main Intelligence Function -----------------------------------------------

export function generateStatementOfPurposeAlignmentIntelligence(
  assessments: SoPAlignmentAssessment[],
  reviews: SoPReviewRecord[],
  stakeholderFeedback: StakeholderFeedback[],
  ofstedRecommendations: OfstedRecommendation[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): StatementOfPurposeAlignmentIntelligence {
  const alignmentQuality = evaluateAlignmentQuality(assessments);
  const reviewCurrency = evaluateReviewCurrency(reviews);
  const stakeholderAwareness = evaluateStakeholderAwareness(stakeholderFeedback);
  const ofstedResponse = evaluateOfstedResponse(ofstedRecommendations);

  const sectionProfiles = buildSectionProfiles(assessments);

  // Overall score: sum of 4 evaluators (each 0-25) = 0-100
  const overallScore = Math.min(
    100,
    Math.max(
      0,
      alignmentQuality.overallScore +
        reviewCurrency.overallScore +
        stakeholderAwareness.overallScore +
        ofstedResponse.overallScore,
    ),
  );

  const rating = getRating(overallScore);

  // -- Strengths --
  const strengths: string[] = [];

  if (alignmentQuality.overallScore >= 20) {
    strengths.push(
      "Strong alignment between the Statement of Purpose and actual care delivery across most sections",
    );
  }
  if (alignmentQuality.fullyAlignedRate >= 80 && alignmentQuality.totalAssessments > 0) {
    strengths.push(
      `${alignmentQuality.fullyAlignedRate}% of assessed sections are fully aligned with the Statement of Purpose`,
    );
  }
  if (alignmentQuality.strongEvidenceRate >= 70 && alignmentQuality.totalAssessments > 0) {
    strengths.push(
      "Strong evidence base underpins alignment assessments across most sections",
    );
  }
  if (reviewCurrency.overallScore >= 20) {
    strengths.push(
      "Statement of Purpose is regularly reviewed with meaningful stakeholder consultation",
    );
  }
  if (reviewCurrency.childrenConsultedRate === 100 && reviewCurrency.totalReviews > 0) {
    strengths.push(
      "Children are consistently consulted during all Statement of Purpose reviews",
    );
  }
  if (stakeholderAwareness.overallScore >= 20) {
    strengths.push(
      "Stakeholders demonstrate strong awareness of the Statement of Purpose and its values",
    );
  }
  if (stakeholderAwareness.awareRate >= 90 && stakeholderAwareness.totalFeedback > 0) {
    strengths.push(
      "High stakeholder awareness of the Statement of Purpose across all groups",
    );
  }
  if (stakeholderAwareness.reflectsRealityRate >= 90 && stakeholderAwareness.totalFeedback > 0) {
    strengths.push(
      "Stakeholders confirm the Statement of Purpose accurately reflects the reality of care provided",
    );
  }
  if (ofstedResponse.overallScore >= 20) {
    strengths.push(
      "Ofsted recommendations have been effectively addressed with clear evidence of change",
    );
  }
  if (ofstedResponse.totalRecommendations === 0) {
    strengths.push(
      "No outstanding Ofsted recommendations relating to the Statement of Purpose",
    );
  }
  if (alignmentQuality.actionsTakenRate === 100 && alignmentQuality.actionsRequiredCount > 0) {
    strengths.push(
      "All identified alignment actions have been completed, demonstrating responsive management",
    );
  }

  // -- Areas for Improvement --
  const areasForImprovement: string[] = [];

  if (alignmentQuality.totalAssessments === 0) {
    areasForImprovement.push(
      "No alignment assessments have been completed -- the Statement of Purpose has not been evaluated against practice",
    );
  }
  if (alignmentQuality.notAlignedCount > 0) {
    areasForImprovement.push(
      `${alignmentQuality.notAlignedCount} section(s) assessed as not aligned with the Statement of Purpose`,
    );
  }
  if (alignmentQuality.fullyAlignedRate < 60 && alignmentQuality.totalAssessments > 0) {
    areasForImprovement.push(
      `Only ${alignmentQuality.fullyAlignedRate}% of sections are fully aligned -- targeted improvement needed`,
    );
  }
  if (alignmentQuality.strongEvidenceRate < 50 && alignmentQuality.totalAssessments > 0) {
    areasForImprovement.push(
      `Only ${alignmentQuality.strongEvidenceRate}% of assessments supported by strong evidence`,
    );
  }
  if (alignmentQuality.actionsTakenRate < 80 && alignmentQuality.actionsRequiredCount > 0) {
    areasForImprovement.push(
      `Only ${alignmentQuality.actionsTakenRate}% of required alignment actions have been completed`,
    );
  }
  if (reviewCurrency.totalReviews === 0) {
    areasForImprovement.push(
      "No reviews of the Statement of Purpose have been completed during this period",
    );
  }
  if (reviewCurrency.overdueCount > 0) {
    areasForImprovement.push(
      `${reviewCurrency.overdueCount} review(s) of the Statement of Purpose are overdue`,
    );
  }
  if (reviewCurrency.childrenConsultedRate < 80 && reviewCurrency.totalReviews > 0) {
    areasForImprovement.push(
      `Children consulted in only ${reviewCurrency.childrenConsultedRate}% of reviews -- their voice must inform the Statement of Purpose`,
    );
  }
  if (reviewCurrency.staffConsultedRate < 80 && reviewCurrency.totalReviews > 0) {
    areasForImprovement.push(
      `Staff consulted in only ${reviewCurrency.staffConsultedRate}% of reviews`,
    );
  }
  if (stakeholderAwareness.totalFeedback === 0) {
    areasForImprovement.push(
      "No stakeholder feedback gathered on Statement of Purpose awareness or alignment",
    );
  }
  if (stakeholderAwareness.awareRate < 70 && stakeholderAwareness.totalFeedback > 0) {
    areasForImprovement.push(
      `Only ${stakeholderAwareness.awareRate}% of stakeholders are aware of the Statement of Purpose`,
    );
  }
  if (stakeholderAwareness.reflectsRealityRate < 70 && stakeholderAwareness.totalFeedback > 0) {
    areasForImprovement.push(
      `Only ${stakeholderAwareness.reflectsRealityRate}% of stakeholders feel the Statement of Purpose reflects reality`,
    );
  }
  if (ofstedResponse.outstandingCount > 0) {
    areasForImprovement.push(
      `${ofstedResponse.outstandingCount} Ofsted recommendation(s) remain unaddressed`,
    );
  }

  // -- Actions --
  const actions: string[] = [];

  if (alignmentQuality.totalAssessments === 0) {
    actions.push(
      "Complete alignment assessments for all 12 sections of the Statement of Purpose against current practice",
    );
  }
  if (alignmentQuality.notAlignedCount > 0) {
    actions.push(
      "Develop and implement action plans for sections assessed as not aligned with the Statement of Purpose",
    );
  }
  if (alignmentQuality.strongEvidenceRate < 50 && alignmentQuality.totalAssessments > 0) {
    actions.push(
      "Strengthen the evidence base for alignment assessments through documented observations and records",
    );
  }
  if (alignmentQuality.actionsTakenRate < 100 && alignmentQuality.actionsRequiredCount > 0) {
    actions.push(
      "Complete all outstanding alignment actions and document the impact of changes made",
    );
  }
  if (reviewCurrency.totalReviews === 0) {
    actions.push(
      "Schedule and complete a comprehensive review of the Statement of Purpose with all stakeholders",
    );
  }
  if (reviewCurrency.overdueCount > 0) {
    actions.push(
      "Urgently complete overdue Statement of Purpose reviews to ensure the document remains current",
    );
  }
  if (reviewCurrency.childrenConsultedRate < 100 && reviewCurrency.totalReviews > 0) {
    actions.push(
      "Ensure children are consulted in all future reviews of the Statement of Purpose using age-appropriate methods",
    );
  }
  if (reviewCurrency.staffConsultedRate < 100 && reviewCurrency.totalReviews > 0) {
    actions.push(
      "Include all staff in Statement of Purpose reviews to ensure the team understands and delivers on commitments",
    );
  }
  if (stakeholderAwareness.totalFeedback === 0) {
    actions.push(
      "Gather feedback from children, staff, families, and professionals on their awareness of the Statement of Purpose",
    );
  }
  if (stakeholderAwareness.awareRate < 70 && stakeholderAwareness.totalFeedback > 0) {
    actions.push(
      "Improve communication of the Statement of Purpose to all stakeholders through accessible formats",
    );
  }
  if (stakeholderAwareness.reflectsRealityRate < 70 && stakeholderAwareness.totalFeedback > 0) {
    actions.push(
      "Review and update the Statement of Purpose to better reflect the reality of care provided",
    );
  }
  if (ofstedResponse.outstandingCount > 0) {
    actions.push(
      "Address all outstanding Ofsted recommendations and document evidence of the changes implemented",
    );
  }

  // Check for sections with no assessments
  const unassessedSections = sectionProfiles.filter(
    (p) => p.latestAlignment === "not_assessed",
  );
  if (unassessedSections.length > 0 && alignmentQuality.totalAssessments > 0) {
    actions.push(
      `Complete alignment assessments for ${unassessedSections.length} unassessed section(s) of the Statement of Purpose`,
    );
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 16 -- Statement of purpose: requirement to compile, maintain, review and make available",
    "CHR 2015 Reg 7 -- Registered person: ensuring the home is conducted in accordance with the Statement of Purpose",
    "SCCIF -- Leadership and management: evaluating alignment between stated purpose and practice",
    "NMS 1 -- Statement of purpose and function: content requirements and review expectations",
    "UNCRC Article 3 -- Best interests of the child as a primary consideration",
    "CA 1989 s22(3)(a) -- Duty to safeguard and promote the welfare of looked-after children",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    alignmentQuality,
    reviewCurrency,
    stakeholderAwareness,
    ofstedResponse,
    sectionProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
