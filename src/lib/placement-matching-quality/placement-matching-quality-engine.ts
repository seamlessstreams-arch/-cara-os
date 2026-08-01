// ==============================================================================
// PLACEMENT MATCHING QUALITY INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well children are matched to the
// home and to each other, considering needs, risks, and compatibility.
//
// Aligned to:
//   - CHR 2015 Reg 12 — Safeguarding: matching risks and group dynamics
//   - CHR 2015 Reg 14 — Admission and placement plan
//   - SCCIF — Experience and progress of children and young people
//   - NMS 11 — Admission and assessment of needs
//   - UNCRC Article 3 — Best interests of the child
//   - Working Together to Safeguard Children 2023
//   - CA 1989 s22C — Sufficiency duty
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

// -- Types --------------------------------------------------------------------

export type MatchingCriteria =
  | "age_appropriateness"
  | "gender_compatibility"
  | "needs_compatibility"
  | "risk_compatibility"
  | "education_needs"
  | "cultural_needs"
  | "therapeutic_needs"
  | "location_suitability"
  | "sibling_placement"
  | "peer_dynamics";

export type MatchingOutcome =
  | "excellent_match"
  | "good_match"
  | "adequate_match"
  | "poor_match"
  | "placement_disrupted";

export type ImpactAssessmentStatus =
  | "completed_pre_admission"
  | "completed_post_admission"
  | "not_completed"
  | "in_progress";

export type ConsultationStatus =
  | "all_consulted"
  | "partially_consulted"
  | "not_consulted";

export type StabilityIndicator =
  | "stable"
  | "settling"
  | "unsettled"
  | "at_risk_of_disruption"
  | "disrupted";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// -- Input Interfaces ---------------------------------------------------------

export interface PlacementMatch {
  id: string;
  childId: string;
  childName: string;
  admissionDate: string;
  matchingOutcome: MatchingOutcome;
  impactAssessmentStatus: ImpactAssessmentStatus;
  existingChildrenConsulted: ConsultationStatus;
  staffConsulted: boolean;
  referralInformationComplete: boolean;
  trialOvernight: boolean | null;
  criteriaAssessed: MatchingCriteria[];
  criteriaMetCount: number;
  riskAssessmentCompleted: boolean;
}

export interface CompatibilityReview {
  id: string;
  reviewDate: string;
  reviewedBy: string;
  childId1: string;
  childId2: string;
  compatible: boolean;
  riskIdentified: boolean;
  managementPlanInPlace: boolean;
  positiveRelationship: boolean;
}

export interface PlacementStability {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  stabilityIndicator: StabilityIndicator;
  daysInPlacement: number;
  incidentCount: number;
  missingCount: number;
  schoolAttending: boolean;
  therapeuticEngaged: boolean;
  keyRelationshipEstablished: boolean;
}

export interface DisruptionRecord {
  id: string;
  childId: string;
  childName: string;
  disruptionDate: string;
  reason: string;
  plannedMove: boolean;
  alternativePlacement: boolean;
  lessonLearnedDocumented: boolean;
  impactOnOtherChildren: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface MatchingProcessResult {
  overallScore: number; // 0-25
  totalPlacements: number;
  excellentGoodRate: number;
  impactAssessmentRate: number;
  consultationRate: number;
  referralCompleteRate: number;
  riskAssessmentRate: number;
  averageCriteriaMet: number;
}

export interface CompatibilityResult {
  overallScore: number; // 0-25
  totalReviews: number;
  compatibleRate: number;
  managementPlanRate: number | null;
  positiveRelationshipRate: number;
  risksIdentifiedCount: number;
}

export interface StabilityOutcomeResult {
  overallScore: number; // 0-25
  totalAssessments: number;
  stableSettlingRate: number;
  atRiskCount: number;
  disruptedCount: number;
  schoolAttendingRate: number;
  therapeuticEngagedRate: number;
  keyRelationshipRate: number;
  averageDaysInPlacement: number;
}

export interface DisruptionLearningResult {
  overallScore: number; // 0-25
  totalDisruptions: number;
  plannedMoveRate: number;
  lessonDocumentedRate: number;
  impactAssessedRate: number;
}

export interface ChildPlacementProfile {
  childId: string;
  childName: string;
  matchingOutcome: MatchingOutcome;
  stabilityIndicator: StabilityIndicator;
  daysInPlacement: number;
  compatibilityIssues: number;
  overallScore: number; // 0-10
}

export interface PlacementMatchingQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number; // 0-100
  rating: Rating;
  matchingProcess: MatchingProcessResult;
  compatibility: CompatibilityResult;
  stabilityOutcome: StabilityOutcomeResult;
  disruptionLearning: DisruptionLearningResult;
  childProfiles: ChildPlacementProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Constants ----------------------------------------------------------------

const ALL_MATCHING_CRITERIA: MatchingCriteria[] = [
  "age_appropriateness",
  "gender_compatibility",
  "needs_compatibility",
  "risk_compatibility",
  "education_needs",
  "cultural_needs",
  "therapeutic_needs",
  "location_suitability",
  "sibling_placement",
  "peer_dynamics",
];

// -- Core Function 1: Evaluate Matching Process -------------------------------

export function evaluateMatchingProcess(
  placements: PlacementMatch[],
): MatchingProcessResult {
  const totalPlacements = placements.length;

  if (totalPlacements === 0) {
    return {
      overallScore: 0,
      totalPlacements: 0,
      excellentGoodRate: 0,
      impactAssessmentRate: 0,
      consultationRate: 0,
      referralCompleteRate: 0,
      riskAssessmentRate: 0,
      averageCriteriaMet: 0,
    };
  }

  const excellentGoodCount = placements.filter(
    (p) => p.matchingOutcome === "excellent_match" || p.matchingOutcome === "good_match",
  ).length;
  const excellentGoodRate = Math.round((excellentGoodCount / totalPlacements) * 100);

  const impactAssessmentCount = placements.filter(
    (p) =>
      p.impactAssessmentStatus === "completed_pre_admission" ||
      p.impactAssessmentStatus === "completed_post_admission",
  ).length;
  const impactAssessmentRate = Math.round((impactAssessmentCount / totalPlacements) * 100);

  const consultationCount = placements.filter(
    (p) => p.existingChildrenConsulted === "all_consulted",
  ).length;
  const consultationRate = Math.round((consultationCount / totalPlacements) * 100);

  const referralCompleteCount = placements.filter(
    (p) => p.referralInformationComplete,
  ).length;
  const referralCompleteRate = Math.round((referralCompleteCount / totalPlacements) * 100);

  const riskAssessmentCount = placements.filter(
    (p) => p.riskAssessmentCompleted,
  ).length;
  const riskAssessmentRate = Math.round((riskAssessmentCount / totalPlacements) * 100);

  const totalCriteriaMet = placements.reduce((s, p) => s + p.criteriaMetCount, 0);
  const averageCriteriaMet =
    Math.round((totalCriteriaMet / totalPlacements) * 10) / 10;

  // Score: max 25
  let score = 0;
  // Excellent/good rate: 8 pts
  score += (excellentGoodRate / 100) * 8;
  // Impact assessment: 5 pts
  score += (impactAssessmentRate / 100) * 5;
  // Consultation: 4 pts
  score += (consultationRate / 100) * 4;
  // Referral completeness: 4 pts
  score += (referralCompleteRate / 100) * 4;
  // Risk assessment: 4 pts
  score += (riskAssessmentRate / 100) * 4;

  const overallScore = Math.round(score * 10) / 10;

  return {
    overallScore: Math.min(overallScore, 25),
    totalPlacements,
    excellentGoodRate,
    impactAssessmentRate,
    consultationRate,
    referralCompleteRate,
    riskAssessmentRate,
    averageCriteriaMet,
  };
}

// -- Core Function 2: Evaluate Compatibility ----------------------------------

export function evaluateCompatibility(
  reviews: CompatibilityReview[],
): CompatibilityResult {
  const totalReviews = reviews.length;

  if (totalReviews === 0) {
    return {
      overallScore: 0,
      totalReviews: 0,
      compatibleRate: 0,
      managementPlanRate: 0,
      positiveRelationshipRate: 0,
      risksIdentifiedCount: 0,
    };
  }

  const compatibleCount = reviews.filter((r) => r.compatible).length;
  const compatibleRate = Math.round((compatibleCount / totalReviews) * 100);

  const risksIdentifiedCount = reviews.filter((r) => r.riskIdentified).length;
  const reviewsWithRisk = reviews.filter((r) => r.riskIdentified);
  const managementPlanCount = reviewsWithRisk.filter(
    (r) => r.managementPlanInPlace,
  ).length;
  const managementPlanRate =
    reviewsWithRisk.length > 0
      ? Math.round((managementPlanCount / reviewsWithRisk.length) * 100)
      : null;

  const positiveRelationshipCount = reviews.filter(
    (r) => r.positiveRelationship,
  ).length;
  const positiveRelationshipRate = Math.round(
    (positiveRelationshipCount / totalReviews) * 100,
  );

  // Score: max 25
  let score = 0;
  // Compatibility rate: 10 pts
  score += (compatibleRate / 100) * 10;
  // Management plans where risks identified: 7 pts
  score += ((managementPlanRate ?? 0) / 100) * 7;
  // Positive relationships: 8 pts
  score += (positiveRelationshipRate / 100) * 8;

  const overallScore = Math.round(score * 10) / 10;

  return {
    overallScore: Math.min(overallScore, 25),
    totalReviews,
    compatibleRate,
    managementPlanRate,
    positiveRelationshipRate,
    risksIdentifiedCount,
  };
}

// -- Core Function 3: Evaluate Stability Outcomes -----------------------------

export function evaluateStabilityOutcomes(
  assessments: PlacementStability[],
): StabilityOutcomeResult {
  const totalAssessments = assessments.length;

  if (totalAssessments === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      stableSettlingRate: 0,
      atRiskCount: 0,
      disruptedCount: 0,
      schoolAttendingRate: 0,
      therapeuticEngagedRate: 0,
      keyRelationshipRate: 0,
      averageDaysInPlacement: 0,
    };
  }

  const stableSettlingCount = assessments.filter(
    (a) => a.stabilityIndicator === "stable" || a.stabilityIndicator === "settling",
  ).length;
  const stableSettlingRate = Math.round((stableSettlingCount / totalAssessments) * 100);

  const atRiskCount = assessments.filter(
    (a) => a.stabilityIndicator === "at_risk_of_disruption",
  ).length;
  const disruptedCount = assessments.filter(
    (a) => a.stabilityIndicator === "disrupted",
  ).length;

  const schoolAttendingCount = assessments.filter((a) => a.schoolAttending).length;
  const schoolAttendingRate = Math.round((schoolAttendingCount / totalAssessments) * 100);

  const therapeuticEngagedCount = assessments.filter((a) => a.therapeuticEngaged).length;
  const therapeuticEngagedRate = Math.round(
    (therapeuticEngagedCount / totalAssessments) * 100,
  );

  const keyRelationshipCount = assessments.filter(
    (a) => a.keyRelationshipEstablished,
  ).length;
  const keyRelationshipRate = Math.round(
    (keyRelationshipCount / totalAssessments) * 100,
  );

  const totalDays = assessments.reduce((s, a) => s + a.daysInPlacement, 0);
  const averageDaysInPlacement =
    Math.round((totalDays / totalAssessments) * 10) / 10;

  // Score: max 25
  let score = 0;
  // Stable/settling rate: 8 pts
  score += (stableSettlingRate / 100) * 8;
  // School attending: 5 pts
  score += (schoolAttendingRate / 100) * 5;
  // Therapeutic engagement: 5 pts
  score += (therapeuticEngagedRate / 100) * 5;
  // Key relationships: 7 pts
  score += (keyRelationshipRate / 100) * 7;

  const overallScore = Math.round(score * 10) / 10;

  return {
    overallScore: Math.min(overallScore, 25),
    totalAssessments,
    stableSettlingRate,
    atRiskCount,
    disruptedCount,
    schoolAttendingRate,
    therapeuticEngagedRate,
    keyRelationshipRate,
    averageDaysInPlacement,
  };
}

// -- Core Function 4: Evaluate Disruption Learning ----------------------------

export function evaluateDisruptionLearning(
  disruptions: DisruptionRecord[],
): DisruptionLearningResult {
  const totalDisruptions = disruptions.length;

  // No disruptions = excellent — score 25
  if (totalDisruptions === 0) {
    return {
      overallScore: 25,
      totalDisruptions: 0,
      plannedMoveRate: 0,
      lessonDocumentedRate: 0,
      impactAssessedRate: 0,
    };
  }

  const plannedMoveCount = disruptions.filter((d) => d.plannedMove).length;
  const plannedMoveRate = Math.round((plannedMoveCount / totalDisruptions) * 100);

  const lessonDocumentedCount = disruptions.filter(
    (d) => d.lessonLearnedDocumented,
  ).length;
  const lessonDocumentedRate = Math.round(
    (lessonDocumentedCount / totalDisruptions) * 100,
  );

  const impactAssessedCount = disruptions.filter(
    (d) => d.impactOnOtherChildren,
  ).length;
  const impactAssessedRate = Math.round(
    (impactAssessedCount / totalDisruptions) * 100,
  );

  // Score: max 25, but disruptions existing means reduced base
  // Base reduction: lose up to 10 pts based on number of disruptions (each costs 3.33, max 3)
  const disruptionPenalty = Math.min(totalDisruptions * 3.33, 10);
  let score = 25 - disruptionPenalty;
  // Recover up to 5 pts for planned moves
  score += (plannedMoveRate / 100) * 5;
  // Recover up to 5 pts for lessons documented
  score += (lessonDocumentedRate / 100) * 5;
  // Recover up to 5 pts for impact assessed
  score += (impactAssessedRate / 100) * 5;

  const overallScore = Math.max(0, Math.round(score * 10) / 10);

  return {
    overallScore: Math.min(overallScore, 25),
    totalDisruptions,
    plannedMoveRate,
    lessonDocumentedRate,
    impactAssessedRate,
  };
}

// -- Core Function 5: Build Child Profiles ------------------------------------

export function buildChildProfiles(
  placements: PlacementMatch[],
  stability: PlacementStability[],
  reviews: CompatibilityReview[],
): ChildPlacementProfile[] {
  return placements.map((placement) => {
    const stabilityRecord = stability.find(
      (s) => s.childId === placement.childId,
    );

    const compatibilityIssues = reviews.filter(
      (r) =>
        (r.childId1 === placement.childId || r.childId2 === placement.childId) &&
        !r.compatible,
    ).length;

    const stabilityIndicator: StabilityIndicator = stabilityRecord
      ? stabilityRecord.stabilityIndicator
      : "settling";

    const daysInPlacement = stabilityRecord ? stabilityRecord.daysInPlacement : 0;

    // Child overall score: 0-10
    let childScore = 0;

    // Matching outcome: 4 pts
    const outcomeScores: Record<MatchingOutcome, number> = {
      excellent_match: 4,
      good_match: 3,
      adequate_match: 2,
      poor_match: 1,
      placement_disrupted: 0,
    };
    childScore += outcomeScores[placement.matchingOutcome];

    // Stability: 3 pts
    const stabilityScores: Record<StabilityIndicator, number> = {
      stable: 3,
      settling: 2,
      unsettled: 1,
      at_risk_of_disruption: 0.5,
      disrupted: 0,
    };
    childScore += stabilityScores[stabilityIndicator];

    // Compatibility: 3 pts (deduct for issues)
    childScore += Math.max(0, 3 - compatibilityIssues);

    return {
      childId: placement.childId,
      childName: placement.childName,
      matchingOutcome: placement.matchingOutcome,
      stabilityIndicator,
      daysInPlacement,
      compatibilityIssues,
      overallScore: Math.round(Math.min(childScore, 10) * 10) / 10,
    };
  });
}

// -- Core Function 6: Generate Full Intelligence ------------------------------

export function generatePlacementMatchingQualityIntelligence(
  placements: PlacementMatch[],
  reviews: CompatibilityReview[],
  stability: PlacementStability[],
  disruptions: DisruptionRecord[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): PlacementMatchingQualityIntelligence {
  const matchingProcess = evaluateMatchingProcess(placements);
  const compatibility = evaluateCompatibility(reviews);
  const stabilityOutcome = evaluateStabilityOutcomes(stability);
  const disruptionLearning = evaluateDisruptionLearning(disruptions);

  const childProfiles = buildChildProfiles(placements, stability, reviews);

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        matchingProcess.overallScore +
          compatibility.overallScore +
          stabilityOutcome.overallScore +
          disruptionLearning.overallScore,
      ),
    ),
  );

  const rating = getOverallRating(overallScore);

  const strengths = generateStrengths(
    matchingProcess,
    compatibility,
    stabilityOutcome,
    disruptionLearning,
  );
  const areasForImprovement = generateAreasForImprovement(
    matchingProcess,
    compatibility,
    stabilityOutcome,
    disruptionLearning,
  );
  const actions = generateActions(
    matchingProcess,
    compatibility,
    stabilityOutcome,
    disruptionLearning,
  );
  const regulatoryLinks = generateRegulatoryLinks();

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    matchingProcess,
    compatibility,
    stabilityOutcome,
    disruptionLearning,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// -- Rating -------------------------------------------------------------------

function getOverallRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// -- Strengths ----------------------------------------------------------------

function generateStrengths(
  mp: MatchingProcessResult,
  comp: CompatibilityResult,
  stab: StabilityOutcomeResult,
  dl: DisruptionLearningResult,
): string[] {
  const strengths: string[] = [];

  if (mp.excellentGoodRate >= 80 && mp.totalPlacements > 0) {
    strengths.push(
      "Strong matching practice: over 80% of placements assessed as excellent or good match",
    );
  }

  if (mp.impactAssessmentRate >= 90 && mp.totalPlacements > 0) {
    strengths.push(
      "Impact assessments consistently completed, supporting informed admission decisions per Reg 12",
    );
  }

  if (mp.consultationRate >= 90 && mp.totalPlacements > 0) {
    strengths.push(
      "Existing children consistently consulted before new admissions, supporting child-centred practice",
    );
  }

  if (mp.riskAssessmentRate >= 90 && mp.totalPlacements > 0) {
    strengths.push(
      "Risk assessments completed for all or nearly all placements, demonstrating thorough safeguarding",
    );
  }

  if (mp.referralCompleteRate >= 90 && mp.totalPlacements > 0) {
    strengths.push(
      "Referral information consistently complete, enabling well-informed matching decisions",
    );
  }

  if (comp.compatibleRate >= 80 && comp.totalReviews > 0) {
    strengths.push(
      "High compatibility between children in the home, indicating effective group dynamics management",
    );
  }

  if (comp.positiveRelationshipRate >= 80 && comp.totalReviews > 0) {
    strengths.push(
      "Positive peer relationships observed across the home, supporting children's emotional wellbeing",
    );
  }

  if ((comp.managementPlanRate ?? 0) >= 90 && comp.risksIdentifiedCount > 0) {
    strengths.push(
      "Management plans in place for all identified compatibility risks, ensuring proactive risk mitigation",
    );
  }

  if (stab.stableSettlingRate >= 80 && stab.totalAssessments > 0) {
    strengths.push(
      "High placement stability: over 80% of children are stable or settling well",
    );
  }

  if (stab.schoolAttendingRate >= 90 && stab.totalAssessments > 0) {
    strengths.push(
      "Excellent school attendance rate, supporting children's educational outcomes",
    );
  }

  if (stab.therapeuticEngagedRate >= 80 && stab.totalAssessments > 0) {
    strengths.push(
      "Strong therapeutic engagement across placements, supporting recovery and development",
    );
  }

  if (stab.keyRelationshipRate >= 90 && stab.totalAssessments > 0) {
    strengths.push(
      "Key relationships established for nearly all children, providing essential attachment security",
    );
  }

  if (dl.totalDisruptions === 0) {
    strengths.push(
      "No placement disruptions in the period, indicating stable and well-matched placements",
    );
  }

  if (dl.totalDisruptions > 0 && dl.lessonDocumentedRate >= 90) {
    strengths.push(
      "Lessons learned consistently documented following disruptions, supporting continuous improvement",
    );
  }

  return strengths;
}

// -- Areas for Improvement ----------------------------------------------------

function generateAreasForImprovement(
  mp: MatchingProcessResult,
  comp: CompatibilityResult,
  stab: StabilityOutcomeResult,
  dl: DisruptionLearningResult,
): string[] {
  const areas: string[] = [];

  if (mp.excellentGoodRate < 60 && mp.totalPlacements > 0) {
    areas.push(
      "Less than 60% of placements rated excellent or good: review matching criteria and assessment rigour",
    );
  }

  if (mp.impactAssessmentRate < 80 && mp.totalPlacements > 0) {
    areas.push(
      "Impact assessments not consistently completed: ensure all admissions have pre-admission impact assessments per Reg 12",
    );
  }

  if (mp.consultationRate < 70 && mp.totalPlacements > 0) {
    areas.push(
      "Existing children not consistently consulted: develop structured consultation process before every new admission",
    );
  }

  if (mp.riskAssessmentRate < 80 && mp.totalPlacements > 0) {
    areas.push(
      "Risk assessments not completed for all placements: ensure all admissions include comprehensive risk assessment",
    );
  }

  if (mp.referralCompleteRate < 80 && mp.totalPlacements > 0) {
    areas.push(
      "Referral information incomplete for some placements: strengthen liaison with placing authorities to obtain full information",
    );
  }

  if (comp.compatibleRate < 60 && comp.totalReviews > 0) {
    areas.push(
      "Low compatibility rate among children: review group composition and matching decisions",
    );
  }

  if ((comp.managementPlanRate ?? 0) < 70 && comp.risksIdentifiedCount > 0) {
    areas.push(
      "Management plans not in place for all identified risks: ensure every identified risk has a documented management plan",
    );
  }

  if (comp.positiveRelationshipRate < 60 && comp.totalReviews > 0) {
    areas.push(
      "Low positive relationship rate: invest in relationship-building activities and peer support programmes",
    );
  }

  if (stab.stableSettlingRate < 60 && stab.totalAssessments > 0) {
    areas.push(
      "Less than 60% of placements stable or settling: urgent review of placement matching and support provision needed",
    );
  }

  if (stab.schoolAttendingRate < 70 && stab.totalAssessments > 0) {
    areas.push(
      "School attendance below 70%: review education provision and barriers to attendance",
    );
  }

  if (stab.therapeuticEngagedRate < 60 && stab.totalAssessments > 0) {
    areas.push(
      "Therapeutic engagement below 60%: review access to therapeutic services and barriers to engagement",
    );
  }

  if (stab.keyRelationshipRate < 70 && stab.totalAssessments > 0) {
    areas.push(
      "Key relationships not established for many children: review key worker allocation and relationship-building support",
    );
  }

  if (dl.totalDisruptions > 0 && dl.lessonDocumentedRate < 70) {
    areas.push(
      "Lessons learned not consistently documented after disruptions: implement post-disruption review process",
    );
  }

  if (dl.totalDisruptions > 0 && dl.impactAssessedRate < 70) {
    areas.push(
      "Impact on other children not consistently assessed following disruptions: strengthen post-disruption impact assessment",
    );
  }

  return areas;
}

// -- Actions ------------------------------------------------------------------

function generateActions(
  mp: MatchingProcessResult,
  comp: CompatibilityResult,
  stab: StabilityOutcomeResult,
  dl: DisruptionLearningResult,
): string[] {
  const actions: string[] = [];

  if (mp.impactAssessmentRate < 100 && mp.totalPlacements > 0) {
    actions.push(
      "Implement mandatory pre-admission impact assessment checklist to ensure completion for every new placement",
    );
  }

  if (mp.consultationRate < 80 && mp.totalPlacements > 0) {
    actions.push(
      "Establish a routine consultation process with existing children before each new admission",
    );
  }

  if (mp.riskAssessmentRate < 100 && mp.totalPlacements > 0) {
    actions.push(
      "Ensure risk assessments are completed and documented for all new placements",
    );
  }

  if (comp.risksIdentifiedCount > 0 && (comp.managementPlanRate ?? 0) < 100) {
    actions.push(
      "Create management plans for all identified compatibility risks between children",
    );
  }

  if (stab.atRiskCount > 0) {
    actions.push(
      `Review ${stab.atRiskCount} placement(s) identified as at risk of disruption and implement stability support plans`,
    );
  }

  if (stab.disruptedCount > 0) {
    actions.push(
      `Complete disruption reviews for ${stab.disruptedCount} disrupted placement(s) and document lessons learned`,
    );
  }

  if (stab.schoolAttendingRate < 100 && stab.totalAssessments > 0) {
    actions.push(
      "Review education plans for children not currently attending school and address barriers to attendance",
    );
  }

  if (stab.keyRelationshipRate < 100 && stab.totalAssessments > 0) {
    actions.push(
      "Ensure all children have an identified key relationship with a member of staff",
    );
  }

  if (dl.totalDisruptions > 0 && dl.lessonDocumentedRate < 100) {
    actions.push(
      "Complete lessons learned documentation for all placement disruptions",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Placement matching quality is operating within required standards.",
    );
  }

  return actions;
}

// -- Regulatory Links ---------------------------------------------------------

function generateRegulatoryLinks(): string[] {
  return [
    "CHR 2015 Reg 12 — Safeguarding: matching risks must be assessed to protect all children in the home",
    "CHR 2015 Reg 14 — Admission and placement plan: each child must have a plan addressing their needs",
    "SCCIF — Experience and progress of children: matching quality directly impacts outcomes",
    "NMS 11 — Admission: thorough assessment of needs and compatibility before each admission",
    "UNCRC Article 3 — Best interests of the child must be the primary consideration in placement decisions",
    "Working Together to Safeguard Children 2023 — Multi-agency collaboration in placement matching",
    "CA 1989 s22C — Sufficiency duty: local authorities must ensure sufficient suitable placements",
  ];
}

// -- Label Functions ----------------------------------------------------------

export function getMatchingOutcomeLabel(outcome: MatchingOutcome): string {
  const labels: Record<MatchingOutcome, string> = {
    excellent_match: "Excellent Match",
    good_match: "Good Match",
    adequate_match: "Adequate Match",
    poor_match: "Poor Match",
    placement_disrupted: "Placement Disrupted",
  };
  return labels[outcome] ?? outcome;
}

export function getStabilityIndicatorLabel(indicator: StabilityIndicator): string {
  const labels: Record<StabilityIndicator, string> = {
    stable: "Stable",
    settling: "Settling",
    unsettled: "Unsettled",
    at_risk_of_disruption: "At Risk of Disruption",
    disrupted: "Disrupted",
  };
  return labels[indicator] ?? indicator;
}

export function getImpactAssessmentStatusLabel(
  status: ImpactAssessmentStatus,
): string {
  const labels: Record<ImpactAssessmentStatus, string> = {
    completed_pre_admission: "Completed Pre-Admission",
    completed_post_admission: "Completed Post-Admission",
    not_completed: "Not Completed",
    in_progress: "In Progress",
  };
  return labels[status] ?? status;
}

export function getConsultationStatusLabel(status: ConsultationStatus): string {
  const labels: Record<ConsultationStatus, string> = {
    all_consulted: "All Consulted",
    partially_consulted: "Partially Consulted",
    not_consulted: "Not Consulted",
  };
  return labels[status] ?? status;
}

export function getMatchingCriteriaLabel(criteria: MatchingCriteria): string {
  const labels: Record<MatchingCriteria, string> = {
    age_appropriateness: "Age Appropriateness",
    gender_compatibility: "Gender Compatibility",
    needs_compatibility: "Needs Compatibility",
    risk_compatibility: "Risk Compatibility",
    education_needs: "Education Needs",
    cultural_needs: "Cultural Needs",
    therapeutic_needs: "Therapeutic Needs",
    location_suitability: "Location Suitability",
    sibling_placement: "Sibling Placement",
    peer_dynamics: "Peer Dynamics",
  };
  return labels[criteria] ?? criteria;
}

export function getRatingLabel(rating: Rating): string {
  const labels: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return labels[rating] ?? rating;
}
