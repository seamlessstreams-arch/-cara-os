// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME ADMISSIONS & MATCHING ASSESSMENT INTELLIGENCE ENGINE
// Tracks referral assessment quality — pre-admission assessment completion,
// impact risk assessments on existing residents, matching criteria evaluation,
// placement suitability reviews, and admission planning quality.
// Critical for Ofsted under Children's Homes Regulations 2015 (Reg 36 —
// review of placement, SCCIF overall effectiveness).
// Pure deterministic engine — no imports, no LLM, no external deps.
// HOME-LEVEL engine.
// Store keys: referralAssessmentRecords, impactRiskAssessmentRecords,
//             matchingCriteriaRecords, placementSuitabilityRecords,
//             admissionPlanningRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface ReferralAssessmentRecordInput {
  id: string;
  referral_date: string;
  child_id: string;
  referral_source: string; // "local_authority"|"emergency"|"planned"|"transfer"|"other"
  status: string; // "completed"|"in_progress"|"not_started"|"declined"
  assessment_completed: boolean;
  assessment_timely: boolean; // completed within expected timeframe
  presenting_needs_documented: boolean;
  risk_factors_identified: boolean;
  risk_factors_count: number;
  background_history_reviewed: boolean;
  previous_placements_reviewed: boolean;
  education_needs_assessed: boolean;
  health_needs_assessed: boolean;
  emotional_needs_assessed: boolean;
  family_context_reviewed: boolean;
  safeguarding_history_checked: boolean;
  statement_of_purpose_aligned: boolean;
  assessor_name: string;
  quality_rating: number; // 1-5
  has_notes: boolean;
  created_at: string;
}

export interface ImpactRiskAssessmentRecordInput {
  id: string;
  referral_id: string;
  date: string;
  existing_children_count: number;
  children_consulted_count: number;
  individual_impacts_assessed: boolean;
  risk_level: string; // "low"|"medium"|"high"|"very_high"
  risks_identified_count: number;
  mitigations_documented_count: number;
  mitigations_adequate: boolean;
  staff_capacity_assessed: boolean;
  environmental_impact_assessed: boolean;
  peer_dynamics_considered: boolean;
  safeguarding_implications_reviewed: boolean;
  trigger_risks_assessed: boolean;
  has_manager_sign_off: boolean;
  has_review_date: boolean;
  quality_rating: number; // 1-5
  has_notes: boolean;
  created_at: string;
}

export interface MatchingCriteriaRecordInput {
  id: string;
  referral_id: string;
  date: string;
  criteria_count: number;
  criteria_met_count: number;
  age_compatibility_assessed: boolean;
  gender_compatibility_assessed: boolean;
  needs_compatibility_assessed: boolean;
  risk_compatibility_assessed: boolean;
  cultural_compatibility_assessed: boolean;
  educational_compatibility_assessed: boolean;
  emotional_compatibility_assessed: boolean;
  behavioural_compatibility_assessed: boolean;
  overall_match_rating: string; // "strong"|"acceptable"|"marginal"|"poor"
  child_views_sought: boolean;
  child_views_count: number;
  staff_views_sought: boolean;
  placing_authority_views_obtained: boolean;
  has_rationale: boolean;
  quality_rating: number; // 1-5
  has_notes: boolean;
  created_at: string;
}

export interface PlacementSuitabilityRecordInput {
  id: string;
  referral_id: string;
  date: string;
  suitability_determined: boolean;
  statement_of_purpose_check: boolean;
  bed_availability_confirmed: boolean;
  staffing_capacity_assessed: boolean;
  specialist_provision_available: boolean;
  location_suitability_assessed: boolean;
  education_provision_confirmed: boolean;
  health_provision_confirmed: boolean;
  contact_arrangements_feasible: boolean;
  regulatory_requirements_met: boolean;
  outcome: string; // "suitable"|"unsuitable"|"conditional"|"deferred"
  conditions_count: number;
  conditions_documented: boolean;
  has_decision_rationale: boolean;
  decision_maker: string;
  quality_rating: number; // 1-5
  has_notes: boolean;
  created_at: string;
}

export interface AdmissionPlanningRecordInput {
  id: string;
  referral_id: string;
  child_id: string;
  date: string;
  admission_date_planned: string;
  introductory_visit_completed: boolean;
  introductory_visit_child_feedback_positive: boolean;
  child_preparation_plan: boolean;
  existing_children_prepared: boolean;
  staff_briefing_completed: boolean;
  key_worker_allocated: boolean;
  bedroom_prepared: boolean;
  placement_plan_drafted: boolean;
  risk_management_plan_updated: boolean;
  education_arrangements_confirmed: boolean;
  health_appointments_booked: boolean;
  contact_plan_agreed: boolean;
  welcome_pack_provided: boolean;
  child_consulted: boolean;
  child_views_recorded: boolean;
  first_review_scheduled: boolean;
  quality_rating: number; // 1-5
  has_notes: boolean;
  created_at: string;
}

export interface AdmissionsMatchingInput {
  today: string;
  total_children: number;
  referral_assessment_records: ReferralAssessmentRecordInput[];
  impact_risk_assessment_records: ImpactRiskAssessmentRecordInput[];
  matching_criteria_records: MatchingCriteriaRecordInput[];
  placement_suitability_records: PlacementSuitabilityRecordInput[];
  admission_planning_records: AdmissionPlanningRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type AdmissionsMatchingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface AdmissionsMatchingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface AdmissionsMatchingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface AdmissionsMatchingResult {
  admissions_rating: AdmissionsMatchingRating;
  admissions_score: number;
  headline: string;
  total_referral_assessments: number;
  total_impact_assessments: number;
  total_matching_records: number;
  total_suitability_reviews: number;
  total_admission_plans: number;
  referral_assessment_rate: number;
  impact_assessment_rate: number;
  matching_quality_rate: number;
  suitability_review_rate: number;
  admission_planning_rate: number;
  child_consultation_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: AdmissionsMatchingRecommendation[];
  insights: AdmissionsMatchingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): AdmissionsMatchingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: AdmissionsMatchingRating,
  score: number,
  headline: string,
): AdmissionsMatchingResult {
  return {
    admissions_rating: rating,
    admissions_score: score,
    headline,
    total_referral_assessments: 0,
    total_impact_assessments: 0,
    total_matching_records: 0,
    total_suitability_reviews: 0,
    total_admission_plans: 0,
    referral_assessment_rate: 0,
    impact_assessment_rate: 0,
    matching_quality_rate: 0,
    suitability_review_rate: 0,
    admission_planning_rate: 0,
    child_consultation_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeAdmissionsMatchingAssessment(
  input: AdmissionsMatchingInput,
): AdmissionsMatchingResult {
  const {
    total_children,
    referral_assessment_records,
    impact_risk_assessment_records,
    matching_criteria_records,
    placement_suitability_records,
    admission_planning_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    referral_assessment_records.length === 0 &&
    impact_risk_assessment_records.length === 0 &&
    matching_criteria_records.length === 0 &&
    placement_suitability_records.length === 0 &&
    admission_planning_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess admissions and matching quality.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No admissions or matching assessment data recorded despite children on placement — referral assessment, impact risk analysis, and matching processes require urgent attention.",
      ),
      concerns: [
        "No referral assessments, impact risk assessments, matching criteria evaluations, suitability reviews, or admission planning records exist despite children being on placement — the home cannot evidence compliance with Reg 36 placement review requirements.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement comprehensive referral assessment recording including presenting needs, risk factors, background history, and alignment with the home's Statement of Purpose to evidence rigorous pre-admission evaluation.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
        },
        {
          rank: 2,
          recommendation:
            "Establish a formal impact risk assessment process that evaluates the effect of each new admission on existing residents, including individual consultations with children currently placed and documented mitigation plans.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Overall effectiveness",
        },
      ],
      insights: [
        {
          text: "The complete absence of admissions and matching assessment records means the home cannot demonstrate to Ofsted how it evaluates referrals, assesses impact on existing children, or ensures placement suitability. This represents a fundamental gap in Reg 36 compliance and overall effectiveness.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Referral assessment metrics ---
  const totalReferralAssessments = referral_assessment_records.length;
  const completedAssessments = referral_assessment_records.filter((r) => r.assessment_completed).length;
  const referralAssessmentRate = pct(completedAssessments, totalReferralAssessments);

  const timelyAssessments = referral_assessment_records.filter((r) => r.assessment_completed && r.assessment_timely).length;
  const timelyAssessmentRate = pct(timelyAssessments, totalReferralAssessments);

  const presentingNeedsDocumented = referral_assessment_records.filter((r) => r.presenting_needs_documented).length;
  const presentingNeedsRate = pct(presentingNeedsDocumented, totalReferralAssessments);

  const riskFactorsIdentified = referral_assessment_records.filter((r) => r.risk_factors_identified).length;
  const riskIdentificationRate = pct(riskFactorsIdentified, totalReferralAssessments);

  const backgroundReviewed = referral_assessment_records.filter((r) => r.background_history_reviewed).length;
  const backgroundReviewRate = pct(backgroundReviewed, totalReferralAssessments);

  const safeguardingChecked = referral_assessment_records.filter((r) => r.safeguarding_history_checked).length;
  const safeguardingCheckRate = pct(safeguardingChecked, totalReferralAssessments);

  const sopAligned = referral_assessment_records.filter((r) => r.statement_of_purpose_aligned).length;
  const sopAlignmentRate = pct(sopAligned, totalReferralAssessments);

  const prevPlacementsReviewed = referral_assessment_records.filter((r) => r.previous_placements_reviewed).length;
  const prevPlacementsRate = pct(prevPlacementsReviewed, totalReferralAssessments);

  const healthAssessed = referral_assessment_records.filter((r) => r.health_needs_assessed).length;
  const educationAssessed = referral_assessment_records.filter((r) => r.education_needs_assessed).length;
  const emotionalAssessed = referral_assessment_records.filter((r) => r.emotional_needs_assessed).length;
  const holisticNeedsCount = healthAssessed + educationAssessed + emotionalAssessed;
  const holisticNeedsRate = pct(holisticNeedsCount, totalReferralAssessments * 3);

  const referralQualitySum = referral_assessment_records.reduce((s, r) => s + r.quality_rating, 0);
  const avgReferralQuality = totalReferralAssessments > 0
    ? Math.round((referralQualitySum / totalReferralAssessments) * 100) / 100
    : 0;

  // --- Impact risk assessment metrics ---
  const totalImpactAssessments = impact_risk_assessment_records.length;
  const totalExistingChildren = impact_risk_assessment_records.reduce((s, a) => s + a.existing_children_count, 0);
  const totalChildrenConsulted = impact_risk_assessment_records.reduce((s, a) => s + a.children_consulted_count, 0);
  const impactChildConsultRate = pct(totalChildrenConsulted, totalExistingChildren);

  const individualImpactsAssessed = impact_risk_assessment_records.filter((a) => a.individual_impacts_assessed).length;
  const individualImpactRate = pct(individualImpactsAssessed, totalImpactAssessments);

  const totalRisksIdentified = impact_risk_assessment_records.reduce((s, a) => s + a.risks_identified_count, 0);
  const totalMitigationsDocumented = impact_risk_assessment_records.reduce((s, a) => s + a.mitigations_documented_count, 0);
  const mitigationDocumentationRate = pct(totalMitigationsDocumented, totalRisksIdentified);

  const mitigationsAdequate = impact_risk_assessment_records.filter((a) => a.mitigations_adequate).length;
  const mitigationAdequacyRate = pct(mitigationsAdequate, totalImpactAssessments);

  const staffCapacityAssessed = impact_risk_assessment_records.filter((a) => a.staff_capacity_assessed).length;
  const staffCapacityRate = pct(staffCapacityAssessed, totalImpactAssessments);

  const peerDynamicsConsidered = impact_risk_assessment_records.filter((a) => a.peer_dynamics_considered).length;
  const peerDynamicsRate = pct(peerDynamicsConsidered, totalImpactAssessments);

  const safeguardingImplicationsReviewed = impact_risk_assessment_records.filter((a) => a.safeguarding_implications_reviewed).length;
  const safeguardingImplicationsRate = pct(safeguardingImplicationsReviewed, totalImpactAssessments);

  const triggerRisksAssessed = impact_risk_assessment_records.filter((a) => a.trigger_risks_assessed).length;
  const triggerRiskRate = pct(triggerRisksAssessed, totalImpactAssessments);

  const managerSignOff = impact_risk_assessment_records.filter((a) => a.has_manager_sign_off).length;
  const managerSignOffRate = pct(managerSignOff, totalImpactAssessments);

  const impactReviewScheduled = impact_risk_assessment_records.filter((a) => a.has_review_date).length;
  const impactReviewScheduledRate = pct(impactReviewScheduled, totalImpactAssessments);

  const highRiskImpacts = impact_risk_assessment_records.filter((a) => a.risk_level === "high" || a.risk_level === "very_high").length;

  const impactQualitySum = impact_risk_assessment_records.reduce((s, a) => s + a.quality_rating, 0);
  const avgImpactQuality = totalImpactAssessments > 0
    ? Math.round((impactQualitySum / totalImpactAssessments) * 100) / 100
    : 0;

  // Composite impact assessment rate
  const impactAssessmentRate = totalImpactAssessments > 0
    ? Math.round((individualImpactRate + impactChildConsultRate + mitigationAdequacyRate + safeguardingImplicationsRate) / 4)
    : 0;

  // --- Matching criteria metrics ---
  const totalMatchingRecords = matching_criteria_records.length;
  const totalCriteriaCount = matching_criteria_records.reduce((s, m) => s + m.criteria_count, 0);
  const totalCriteriaMet = matching_criteria_records.reduce((s, m) => s + m.criteria_met_count, 0);
  const criteriaMetRate = pct(totalCriteriaMet, totalCriteriaCount);

  const childViewsSought = matching_criteria_records.filter((m) => m.child_views_sought).length;
  const matchingChildViewsRate = pct(childViewsSought, totalMatchingRecords);

  const staffViewsSought = matching_criteria_records.filter((m) => m.staff_views_sought).length;
  const matchingStaffViewsRate = pct(staffViewsSought, totalMatchingRecords);

  const placingAuthorityViews = matching_criteria_records.filter((m) => m.placing_authority_views_obtained).length;
  const placingAuthorityRate = pct(placingAuthorityViews, totalMatchingRecords);

  const matchingRationale = matching_criteria_records.filter((m) => m.has_rationale).length;
  const matchingRationaleRate = pct(matchingRationale, totalMatchingRecords);

  const strongMatches = matching_criteria_records.filter((m) => m.overall_match_rating === "strong").length;
  const acceptableMatches = matching_criteria_records.filter((m) => m.overall_match_rating === "acceptable").length;
  const poorMatches = matching_criteria_records.filter((m) => m.overall_match_rating === "poor").length;
  const marginalMatches = matching_criteria_records.filter((m) => m.overall_match_rating === "marginal").length;

  // Compatibility domain coverage
  const ageCompat = matching_criteria_records.filter((m) => m.age_compatibility_assessed).length;
  const needsCompat = matching_criteria_records.filter((m) => m.needs_compatibility_assessed).length;
  const riskCompat = matching_criteria_records.filter((m) => m.risk_compatibility_assessed).length;
  const culturalCompat = matching_criteria_records.filter((m) => m.cultural_compatibility_assessed).length;
  const emotionalCompat = matching_criteria_records.filter((m) => m.emotional_compatibility_assessed).length;
  const behaviouralCompat = matching_criteria_records.filter((m) => m.behavioural_compatibility_assessed).length;
  const domainCoverageCount = ageCompat + needsCompat + riskCompat + culturalCompat + emotionalCompat + behaviouralCompat;
  const domainCoverageRate = pct(domainCoverageCount, totalMatchingRecords * 6);

  const matchingQualitySum = matching_criteria_records.reduce((s, m) => s + m.quality_rating, 0);
  const avgMatchingQuality = totalMatchingRecords > 0
    ? Math.round((matchingQualitySum / totalMatchingRecords) * 100) / 100
    : 0;

  // Composite matching quality rate
  const matchingQualityRate = totalMatchingRecords > 0
    ? Math.round((criteriaMetRate + matchingChildViewsRate + domainCoverageRate + matchingRationaleRate) / 4)
    : 0;

  // --- Placement suitability metrics ---
  const totalSuitabilityReviews = placement_suitability_records.length;
  const suitabilityDetermined = placement_suitability_records.filter((s) => s.suitability_determined).length;
  const suitabilityDeterminedRate = pct(suitabilityDetermined, totalSuitabilityReviews);

  const sopChecked = placement_suitability_records.filter((s) => s.statement_of_purpose_check).length;
  const sopCheckRate = pct(sopChecked, totalSuitabilityReviews);

  const staffingAssessed = placement_suitability_records.filter((s) => s.staffing_capacity_assessed).length;
  const staffingAssessedRate = pct(staffingAssessed, totalSuitabilityReviews);

  const regulatoryMet = placement_suitability_records.filter((s) => s.regulatory_requirements_met).length;
  const regulatoryMetRate = pct(regulatoryMet, totalSuitabilityReviews);

  const decisionRationale = placement_suitability_records.filter((s) => s.has_decision_rationale).length;
  const decisionRationaleRate = pct(decisionRationale, totalSuitabilityReviews);

  const suitableOutcomes = placement_suitability_records.filter((s) => s.outcome === "suitable").length;
  const unsuitableOutcomes = placement_suitability_records.filter((s) => s.outcome === "unsuitable").length;
  const conditionalOutcomes = placement_suitability_records.filter((s) => s.outcome === "conditional").length;
  const deferredOutcomes = placement_suitability_records.filter((s) => s.outcome === "deferred").length;

  const conditionsDocumented = placement_suitability_records.filter((s) => s.conditions_count > 0 && s.conditions_documented).length;
  const totalWithConditions = placement_suitability_records.filter((s) => s.conditions_count > 0).length;
  const conditionsDocRate = pct(conditionsDocumented, totalWithConditions);

  const specialistAvailable = placement_suitability_records.filter((s) => s.specialist_provision_available).length;
  const specialistRate = pct(specialistAvailable, totalSuitabilityReviews);

  const locationAssessed = placement_suitability_records.filter((s) => s.location_suitability_assessed).length;
  const locationRate = pct(locationAssessed, totalSuitabilityReviews);

  const educationConfirmed = placement_suitability_records.filter((s) => s.education_provision_confirmed).length;
  const suitabilityEdRate = pct(educationConfirmed, totalSuitabilityReviews);

  const contactFeasible = placement_suitability_records.filter((s) => s.contact_arrangements_feasible).length;
  const contactFeasibleRate = pct(contactFeasible, totalSuitabilityReviews);

  const suitabilityQualitySum = placement_suitability_records.reduce((s, p) => s + p.quality_rating, 0);
  const avgSuitabilityQuality = totalSuitabilityReviews > 0
    ? Math.round((suitabilityQualitySum / totalSuitabilityReviews) * 100) / 100
    : 0;

  // Composite suitability review rate
  const suitabilityReviewRate = totalSuitabilityReviews > 0
    ? Math.round((suitabilityDeterminedRate + sopCheckRate + decisionRationaleRate + regulatoryMetRate) / 4)
    : 0;

  // --- Admission planning metrics ---
  const totalAdmissionPlans = admission_planning_records.length;
  const introVisitCompleted = admission_planning_records.filter((a) => a.introductory_visit_completed).length;
  const introVisitRate = pct(introVisitCompleted, totalAdmissionPlans);

  const introVisitPositive = admission_planning_records.filter((a) => a.introductory_visit_completed && a.introductory_visit_child_feedback_positive).length;
  const introPositiveRate = pct(introVisitPositive, introVisitCompleted);

  const childPrepPlan = admission_planning_records.filter((a) => a.child_preparation_plan).length;
  const childPrepRate = pct(childPrepPlan, totalAdmissionPlans);

  const existingChildrenPrepared = admission_planning_records.filter((a) => a.existing_children_prepared).length;
  const existingPrepRate = pct(existingChildrenPrepared, totalAdmissionPlans);

  const staffBriefed = admission_planning_records.filter((a) => a.staff_briefing_completed).length;
  const staffBriefingRate = pct(staffBriefed, totalAdmissionPlans);

  const keyWorkerAllocated = admission_planning_records.filter((a) => a.key_worker_allocated).length;
  const keyWorkerRate = pct(keyWorkerAllocated, totalAdmissionPlans);

  const placementPlanDrafted = admission_planning_records.filter((a) => a.placement_plan_drafted).length;
  const placementPlanRate = pct(placementPlanDrafted, totalAdmissionPlans);

  const riskPlanUpdated = admission_planning_records.filter((a) => a.risk_management_plan_updated).length;
  const riskPlanRate = pct(riskPlanUpdated, totalAdmissionPlans);

  const childConsulted = admission_planning_records.filter((a) => a.child_consulted).length;
  const childConsultedRate = pct(childConsulted, totalAdmissionPlans);

  const childViewsRecorded = admission_planning_records.filter((a) => a.child_views_recorded).length;
  const childViewsRecordedRate = pct(childViewsRecorded, totalAdmissionPlans);

  const firstReviewScheduled = admission_planning_records.filter((a) => a.first_review_scheduled).length;
  const firstReviewRate = pct(firstReviewScheduled, totalAdmissionPlans);

  const welcomePackProvided = admission_planning_records.filter((a) => a.welcome_pack_provided).length;
  const welcomePackRate = pct(welcomePackProvided, totalAdmissionPlans);

  const bedroomPrepared = admission_planning_records.filter((a) => a.bedroom_prepared).length;
  const bedroomPrepRate = pct(bedroomPrepared, totalAdmissionPlans);

  const edArrangementsConfirmed = admission_planning_records.filter((a) => a.education_arrangements_confirmed).length;
  const planEdRate = pct(edArrangementsConfirmed, totalAdmissionPlans);

  const healthBooked = admission_planning_records.filter((a) => a.health_appointments_booked).length;
  const healthBookedRate = pct(healthBooked, totalAdmissionPlans);

  const contactAgreed = admission_planning_records.filter((a) => a.contact_plan_agreed).length;
  const contactAgreedRate = pct(contactAgreed, totalAdmissionPlans);

  const planQualitySum = admission_planning_records.reduce((s, a) => s + a.quality_rating, 0);
  const avgPlanQuality = totalAdmissionPlans > 0
    ? Math.round((planQualitySum / totalAdmissionPlans) * 100) / 100
    : 0;

  // Composite admission planning rate
  const admissionPlanningRate = totalAdmissionPlans > 0
    ? Math.round((introVisitRate + childPrepRate + staffBriefingRate + placementPlanRate + keyWorkerRate) / 5)
    : 0;

  // --- Child consultation composite ---
  // Composite across all arrays where child voice is captured
  const childConsultNumerators: number[] = [];
  const childConsultDenominators: number[] = [];

  if (totalImpactAssessments > 0 && totalExistingChildren > 0) {
    childConsultNumerators.push(totalChildrenConsulted);
    childConsultDenominators.push(totalExistingChildren);
  }
  if (totalMatchingRecords > 0) {
    childConsultNumerators.push(childViewsSought);
    childConsultDenominators.push(totalMatchingRecords);
  }
  if (totalAdmissionPlans > 0) {
    childConsultNumerators.push(childConsulted);
    childConsultDenominators.push(totalAdmissionPlans);
  }

  const totalChildConsultNum = childConsultNumerators.reduce((a, b) => a + b, 0);
  const totalChildConsultDenom = childConsultDenominators.reduce((a, b) => a + b, 0);
  const childConsultationRate = pct(totalChildConsultNum, totalChildConsultDenom);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: referralAssessmentRate (>=90: +4, >=70: +2) ---
  if (referralAssessmentRate >= 90) score += 4;
  else if (referralAssessmentRate >= 70) score += 2;

  // --- Bonus 2: impactAssessmentRate (>=90: +4, >=70: +2) ---
  if (impactAssessmentRate >= 90) score += 4;
  else if (impactAssessmentRate >= 70) score += 2;

  // --- Bonus 3: matchingQualityRate (>=90: +3, >=70: +1) ---
  if (matchingQualityRate >= 90) score += 3;
  else if (matchingQualityRate >= 70) score += 1;

  // --- Bonus 4: suitabilityReviewRate (>=90: +3, >=70: +1) ---
  if (suitabilityReviewRate >= 90) score += 3;
  else if (suitabilityReviewRate >= 70) score += 1;

  // --- Bonus 5: admissionPlanningRate (>=90: +3, >=70: +1) ---
  if (admissionPlanningRate >= 90) score += 3;
  else if (admissionPlanningRate >= 70) score += 1;

  // --- Bonus 6: childConsultationRate (>=90: +3, >=70: +1) ---
  if (childConsultationRate >= 90) score += 3;
  else if (childConsultationRate >= 70) score += 1;

  // --- Bonus 7: safeguardingCheckRate (>=90: +3, >=70: +1) ---
  if (safeguardingCheckRate >= 90) score += 3;
  else if (safeguardingCheckRate >= 70) score += 1;

  // --- Bonus 8: sopAlignmentRate (>=90: +3, >=70: +1) ---
  if (sopAlignmentRate >= 90) score += 3;
  else if (sopAlignmentRate >= 70) score += 1;

  // --- Bonus 9: avgReferralQuality + avgImpactQuality composite (>=4.0: +2, >=3.0: +1) ---
  const avgQualityComposite = totalReferralAssessments > 0 && totalImpactAssessments > 0
    ? Math.round(((avgReferralQuality + avgImpactQuality) / 2) * 100) / 100
    : totalReferralAssessments > 0 ? avgReferralQuality
    : totalImpactAssessments > 0 ? avgImpactQuality
    : 0;
  if (avgQualityComposite >= 4.0) score += 2;
  else if (avgQualityComposite >= 3.0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // referralAssessmentRate < 40 → -5 (guarded)
  if (referralAssessmentRate < 40 && referral_assessment_records.length > 0) score -= 5;

  // impactAssessmentRate < 40 → -5 (guarded)
  if (impactAssessmentRate < 40 && impact_risk_assessment_records.length > 0) score -= 5;

  // childConsultationRate < 30 → -4 (guarded)
  if (childConsultationRate < 30 && totalChildConsultDenom > 0) score -= 4;

  // matchingQualityRate < 30 → -4 (guarded)
  if (matchingQualityRate < 30 && matching_criteria_records.length > 0) score -= 4;

  score = clamp(score, 0, 100);

  const admissions_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (referralAssessmentRate >= 90 && totalReferralAssessments > 0) {
    strengths.push(
      `${referralAssessmentRate}% referral assessment completion — the home demonstrates thorough pre-admission evaluation of every referral, ensuring informed placement decisions.`,
    );
  } else if (referralAssessmentRate >= 70 && totalReferralAssessments > 0) {
    strengths.push(
      `${referralAssessmentRate}% referral assessment rate — good completion of pre-admission assessments supporting sound placement decisions.`,
    );
  }

  if (impactAssessmentRate >= 90 && totalImpactAssessments > 0) {
    strengths.push(
      `${impactAssessmentRate}% impact assessment quality — comprehensive risk assessment of each admission's effect on existing children, with child consultation and adequate mitigations.`,
    );
  } else if (impactAssessmentRate >= 70 && totalImpactAssessments > 0) {
    strengths.push(
      `${impactAssessmentRate}% impact assessment rate — good evaluation of how new admissions affect existing residents.`,
    );
  }

  if (matchingQualityRate >= 90 && totalMatchingRecords > 0) {
    strengths.push(
      `${matchingQualityRate}% matching quality — outstanding multi-domain compatibility assessment ensuring children are well-matched to the home and existing group.`,
    );
  } else if (matchingQualityRate >= 70 && totalMatchingRecords > 0) {
    strengths.push(
      `${matchingQualityRate}% matching quality rate — children's compatibility is consistently evaluated across key domains before placement.`,
    );
  }

  if (suitabilityReviewRate >= 90 && totalSuitabilityReviews > 0) {
    strengths.push(
      `${suitabilityReviewRate}% suitability review quality — placement suitability decisions are well-documented with regulatory compliance and clear rationale.`,
    );
  } else if (suitabilityReviewRate >= 70 && totalSuitabilityReviews > 0) {
    strengths.push(
      `${suitabilityReviewRate}% suitability review rate — good standard of placement suitability decision-making.`,
    );
  }

  if (admissionPlanningRate >= 90 && totalAdmissionPlans > 0) {
    strengths.push(
      `${admissionPlanningRate}% admission planning quality — the home prepares thoroughly for each admission with introductory visits, staff briefings, key worker allocation, and placement plans.`,
    );
  } else if (admissionPlanningRate >= 70 && totalAdmissionPlans > 0) {
    strengths.push(
      `${admissionPlanningRate}% admission planning rate — good preparation processes support smooth transitions into the home.`,
    );
  }

  if (childConsultationRate >= 90 && totalChildConsultDenom > 0) {
    strengths.push(
      `${childConsultationRate}% child consultation across admissions processes — children's views consistently drive placement decisions, demonstrating genuine commitment to the voice of the child.`,
    );
  } else if (childConsultationRate >= 70 && totalChildConsultDenom > 0) {
    strengths.push(
      `${childConsultationRate}% child consultation rate — good engagement with children's views during admissions and matching.`,
    );
  }

  if (safeguardingCheckRate >= 90 && totalReferralAssessments > 0) {
    strengths.push(
      `${safeguardingCheckRate}% safeguarding history checks — comprehensive safeguarding screening of referrals protects existing residents and supports informed decision-making.`,
    );
  } else if (safeguardingCheckRate >= 70 && totalReferralAssessments > 0) {
    strengths.push(
      `${safeguardingCheckRate}% safeguarding check rate — good practice in screening referral safeguarding histories.`,
    );
  }

  if (sopAlignmentRate >= 90 && totalReferralAssessments > 0) {
    strengths.push(
      `${sopAlignmentRate}% alignment with Statement of Purpose — every referral is rigorously assessed against the home's registered purpose, ensuring appropriate placements.`,
    );
  }

  if (introVisitRate >= 90 && totalAdmissionPlans > 0) {
    strengths.push(
      "Introductory visits are completed for virtually all admissions — children are given the opportunity to experience the home before placement, reducing anxiety and supporting successful transitions.",
    );
  }

  if (existingPrepRate >= 90 && totalAdmissionPlans > 0) {
    strengths.push(
      "Existing children are consistently prepared for new admissions — the home actively manages the impact of arrivals on the established group.",
    );
  }

  if (managerSignOffRate >= 90 && totalImpactAssessments > 0) {
    strengths.push(
      "Manager sign-off is obtained on virtually all impact assessments — demonstrating strong governance and oversight of admission decisions.",
    );
  }

  if (domainCoverageRate >= 90 && totalMatchingRecords > 0) {
    strengths.push(
      `${domainCoverageRate}% matching domain coverage — age, needs, risk, cultural, emotional, and behavioural compatibility are consistently assessed across all matching evaluations.`,
    );
  }

  if (avgQualityComposite >= 4.0) {
    strengths.push(
      `Assessment quality averaging ${avgQualityComposite}/5 — the standard of referral and impact assessment documentation is consistently high.`,
    );
  }

  if (firstReviewRate >= 90 && totalAdmissionPlans > 0) {
    strengths.push(
      "First placement reviews are scheduled for virtually all new admissions — the home monitors whether matching decisions prove effective.",
    );
  }

  if (unsuitableOutcomes > 0 && totalSuitabilityReviews > 0) {
    strengths.push(
      `${unsuitableOutcomes} referral${unsuitableOutcomes > 1 ? "s" : ""} assessed as unsuitable — the home demonstrates willingness to decline placements that do not align with children's needs or the Statement of Purpose.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (referralAssessmentRate < 40 && totalReferralAssessments > 0) {
    concerns.push(
      `Only ${referralAssessmentRate}% referral assessment completion — the majority of referrals lack completed pre-admission assessments, undermining the home's ability to make informed placement decisions (Reg 36).`,
    );
  } else if (referralAssessmentRate < 70 && referralAssessmentRate >= 40 && totalReferralAssessments > 0) {
    concerns.push(
      `Referral assessment completion at ${referralAssessmentRate}% — too many referrals are not being fully assessed before admission decisions, creating risk of unsuitable placements.`,
    );
  }

  if (impactAssessmentRate < 40 && totalImpactAssessments > 0) {
    concerns.push(
      `Only ${impactAssessmentRate}% impact assessment quality — existing children's welfare is not adequately protected through thorough impact and risk assessment of new admissions.`,
    );
  } else if (impactAssessmentRate < 70 && impactAssessmentRate >= 40 && totalImpactAssessments > 0) {
    concerns.push(
      `Impact assessment quality at ${impactAssessmentRate}% — gaps in individual impact assessment, child consultation, or mitigation planning leave existing residents potentially exposed.`,
    );
  }

  if (totalImpactAssessments === 0 && totalReferralAssessments > 0 && total_children > 0) {
    concerns.push(
      "No impact risk assessments despite active referrals and children on placement — the home cannot evidence how it protects existing residents during the admissions process (Reg 36).",
    );
  }

  if (matchingQualityRate < 30 && totalMatchingRecords > 0) {
    concerns.push(
      `Only ${matchingQualityRate}% matching quality — matching criteria are poorly evaluated, children's views are not sought, and compatibility domains are inadequately assessed.`,
    );
  } else if (matchingQualityRate < 70 && matchingQualityRate >= 30 && totalMatchingRecords > 0) {
    concerns.push(
      `Matching quality at ${matchingQualityRate}% — inconsistencies in criteria evaluation, child consultation, or domain coverage weaken the matching process.`,
    );
  }

  if (totalMatchingRecords === 0 && totalReferralAssessments > 0) {
    concerns.push(
      "No matching criteria evaluations despite active referrals — the home cannot evidence how it assesses compatibility between referred children and the existing group.",
    );
  }

  if (childConsultationRate < 30 && totalChildConsultDenom > 0) {
    concerns.push(
      `Only ${childConsultationRate}% child consultation across admissions — children's voices are largely absent from placement decisions, contradicting the voice of the child principle.`,
    );
  } else if (childConsultationRate < 70 && childConsultationRate >= 30 && totalChildConsultDenom > 0) {
    concerns.push(
      `Child consultation at ${childConsultationRate}% — not all children are consistently consulted during admissions and matching processes.`,
    );
  }

  if (safeguardingCheckRate < 50 && totalReferralAssessments > 0) {
    concerns.push(
      `Only ${safeguardingCheckRate}% of referrals have safeguarding history checks — the home may be accepting children without adequate safeguarding screening, putting existing residents at risk.`,
    );
  }

  if (sopAlignmentRate < 50 && totalReferralAssessments > 0) {
    concerns.push(
      `Only ${sopAlignmentRate}% of referrals assessed against the Statement of Purpose — the home may be accepting placements outside its registered purpose.`,
    );
  }

  if (suitabilityReviewRate < 50 && totalSuitabilityReviews > 0) {
    concerns.push(
      `Suitability review quality at only ${suitabilityReviewRate}% — placement suitability decisions lack adequate documentation, SoP checks, or regulatory compliance verification.`,
    );
  }

  if (admissionPlanningRate < 40 && totalAdmissionPlans > 0) {
    concerns.push(
      `Admission planning at only ${admissionPlanningRate}% — children are not being adequately prepared for admission, with gaps in introductory visits, staff briefings, or key worker allocation.`,
    );
  }

  if (poorMatches > 0 && totalMatchingRecords > 0) {
    concerns.push(
      `${poorMatches} placement${poorMatches > 1 ? "s" : ""} assessed as poor match — the home has accepted or is considering placements with significant compatibility concerns.`,
    );
  }

  if (highRiskImpacts > 0 && mitigationAdequacyRate < 50 && totalImpactAssessments > 0) {
    concerns.push(
      `${highRiskImpacts} high/very-high risk impact assessment${highRiskImpacts > 1 ? "s" : ""} with inadequate mitigations — serious risks to existing children are not being properly managed.`,
    );
  }

  if (decisionRationaleRate < 50 && totalSuitabilityReviews > 0) {
    concerns.push(
      `Only ${decisionRationaleRate}% of suitability decisions have documented rationale — Ofsted will question the rigour and transparency of placement decisions.`,
    );
  }

  if (introVisitRate < 50 && totalAdmissionPlans > 0) {
    concerns.push(
      `Only ${introVisitRate}% of admissions include an introductory visit — children are being placed without the opportunity to experience the home beforehand, increasing anxiety and placement disruption risk.`,
    );
  }

  if (firstReviewRate < 40 && totalAdmissionPlans > 0) {
    concerns.push(
      `Only ${firstReviewRate}% of admissions have a first review scheduled — the home cannot verify whether matching decisions prove effective without planned reviews.`,
    );
  }

  if (timelyAssessmentRate < 50 && totalReferralAssessments > 0) {
    concerns.push(
      `Only ${timelyAssessmentRate}% of referral assessments completed within expected timeframes — delays in assessment may lead to pressure for hasty admission decisions.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: AdmissionsMatchingRecommendation[] = [];
  let rank = 0;

  if (referralAssessmentRate < 40 && totalReferralAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve referral assessment completion — every referral must have a comprehensive pre-admission assessment covering presenting needs, risk factors, background history, safeguarding checks, and Statement of Purpose alignment before any admission decision is made.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (impactAssessmentRate < 40 && totalImpactAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen impact risk assessment quality — each new admission must include individual impact assessment on every existing child, documented risk mitigations, child consultation, and safeguarding implications review with manager sign-off.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Overall effectiveness",
    });
  }

  if (totalImpactAssessments === 0 && totalReferralAssessments > 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement formal impact risk assessments for all admissions — the absence of impact assessments means the home cannot evidence how it protects existing residents when considering new placements.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (childConsultationRate < 30 && totalChildConsultDenom > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child is consulted during admissions processes — existing children must be asked about potential new admissions, and incoming children's views must be recorded during matching and planning.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (safeguardingCheckRate < 50 && totalReferralAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Mandate safeguarding history checks for every referral — no admission decision should proceed without a thorough review of the child's safeguarding background to protect existing residents.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (totalMatchingRecords === 0 && totalReferralAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish formal matching criteria evaluation for all referrals — assess compatibility across age, needs, risk, cultural, emotional, and behavioural domains with documented rationale and child views.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Overall effectiveness",
    });
  }

  if (matchingQualityRate < 50 && matchingQualityRate > 0 && totalMatchingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve matching quality by ensuring all compatibility domains are assessed, children's views are consistently sought, matching rationale is documented, and criteria met rates are tracked for each placement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (sopAlignmentRate < 70 && totalReferralAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every referral is formally assessed against the Statement of Purpose — accepting placements outside the home's registered purpose risks regulatory non-compliance and poor outcomes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (admissionPlanningRate < 50 && totalAdmissionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen admission planning to include introductory visits, child preparation plans, staff briefings, key worker allocation, and drafted placement plans for every new admission.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Overall effectiveness",
    });
  }

  if (decisionRationaleRate < 60 && totalSuitabilityReviews > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document clear rationale for every placement suitability decision — Ofsted expects transparent, evidence-based decision-making that can withstand scrutiny.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (introVisitRate < 70 && totalAdmissionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Prioritise introductory visits for all planned admissions — where emergency placements prevent visits, schedule a retrospective orientation within 48 hours of arrival.",
      urgency: "soon",
      regulatory_ref: "SCCIF — Overall effectiveness",
    });
  }

  if (firstReviewRate < 60 && totalAdmissionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Schedule first placement reviews within 4 weeks of every new admission to assess whether the matching decision was appropriate and identify any emerging concerns early.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (existingPrepRate < 70 && totalAdmissionPlans > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure existing children are prepared for every new admission — hold group discussions, individual key work sessions, and provide age-appropriate information about the new child's arrival.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (
    referralAssessmentRate >= 40 &&
    referralAssessmentRate < 70 &&
    totalReferralAssessments > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve referral assessment completion towards 90% — review current processes to identify barriers to timely completion and ensure all referrals receive comprehensive evaluation.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 36 — Review of placement",
    });
  }

  if (
    childConsultationRate >= 30 &&
    childConsultationRate < 70 &&
    totalChildConsultDenom > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen child consultation by embedding it as a mandatory step in impact assessment, matching, and admission planning — create accessible formats for children to express their views about proposed placements.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (peerDynamicsRate < 60 && totalImpactAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include peer dynamics analysis in every impact assessment — understanding how a new child may affect group relationships is essential for predicting and managing placement stability.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Overall effectiveness",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: AdmissionsMatchingInsight[] = [];

  // -- Critical insights --

  if (referralAssessmentRate < 40 && totalReferralAssessments > 0) {
    insights.push({
      text: `Only ${referralAssessmentRate}% of referral assessments are completed. Without thorough pre-admission evaluation, the home cannot evidence that it accepts appropriate placements or that admission decisions are informed by comprehensive assessment of the child's needs, risks, and background. Ofsted will view this as a significant shortfall under Reg 36.`,
      severity: "critical",
    });
  }

  if (impactAssessmentRate < 40 && totalImpactAssessments > 0) {
    insights.push({
      text: `Impact assessment quality at only ${impactAssessmentRate}%. Inadequate impact risk assessment means the home cannot demonstrate that it protects existing children when admitting new residents. This undermines the home's overall effectiveness judgement under SCCIF.`,
      severity: "critical",
    });
  }

  if (totalImpactAssessments === 0 && totalReferralAssessments > 0 && total_children > 0) {
    insights.push({
      text: "No impact risk assessments exist despite active referrals and children on placement. The absence of formal impact assessment means Ofsted cannot verify how the home protects existing residents during the admissions process — a fundamental gap in Reg 36 compliance.",
      severity: "critical",
    });
  }

  if (childConsultationRate < 30 && totalChildConsultDenom > 0) {
    insights.push({
      text: `Child consultation at only ${childConsultationRate}% across admissions processes. Children's views are largely absent from placement decisions. Under SCCIF, the voice of the child must inform matching and admission decisions — without this, the home cannot demonstrate child-centred practice.`,
      severity: "critical",
    });
  }

  if (poorMatches > 0 && unsuitableOutcomes === 0 && totalMatchingRecords > 0) {
    insights.push({
      text: `${poorMatches} placement${poorMatches > 1 ? "s" : ""} assessed as poor match with no referrals declined — the home may be accepting unsuitable placements rather than prioritising compatibility. Ofsted will question whether occupancy is being prioritised over children's welfare.`,
      severity: "critical",
    });
  }

  if (safeguardingCheckRate < 30 && totalReferralAssessments > 0) {
    insights.push({
      text: `Only ${safeguardingCheckRate}% of referrals include safeguarding history checks. Admitting children without reviewing their safeguarding background exposes existing residents to unassessed risk — this represents a fundamental safeguarding failure.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    referralAssessmentRate >= 40 &&
    referralAssessmentRate < 70 &&
    totalReferralAssessments > 0
  ) {
    insights.push({
      text: `Referral assessment completion at ${referralAssessmentRate}% — improving but some referrals are still not fully assessed before admission decisions. Gaps in assessment create risk of accepting placements that do not align with the home's capability or existing group dynamics.`,
      severity: "warning",
    });
  }

  if (
    impactAssessmentRate >= 40 &&
    impactAssessmentRate < 70 &&
    totalImpactAssessments > 0
  ) {
    insights.push({
      text: `Impact assessment quality at ${impactAssessmentRate}% — while assessments are being completed, gaps in child consultation, individual impact analysis, or mitigation planning weaken the protection offered to existing residents.`,
      severity: "warning",
    });
  }

  if (
    matchingQualityRate >= 30 &&
    matchingQualityRate < 70 &&
    totalMatchingRecords > 0
  ) {
    insights.push({
      text: `Matching quality at ${matchingQualityRate}% — not all compatibility domains are consistently assessed, and children's views are not always sought. Strengthening the matching process would improve placement stability and outcomes.`,
      severity: "warning",
    });
  }

  if (
    childConsultationRate >= 30 &&
    childConsultationRate < 70 &&
    totalChildConsultDenom > 0
  ) {
    insights.push({
      text: `Child consultation at ${childConsultationRate}% — some children's views are being sought but this is not yet consistent across all stages of the admissions process. Embedding child voice as a mandatory step would strengthen practice.`,
      severity: "warning",
    });
  }

  if (
    suitabilityReviewRate >= 40 &&
    suitabilityReviewRate < 70 &&
    totalSuitabilityReviews > 0
  ) {
    insights.push({
      text: `Suitability review quality at ${suitabilityReviewRate}% — placement suitability decisions are being made but documentation, SoP checks, or regulatory compliance verification are inconsistent.`,
      severity: "warning",
    });
  }

  if (
    admissionPlanningRate >= 40 &&
    admissionPlanningRate < 70 &&
    totalAdmissionPlans > 0
  ) {
    insights.push({
      text: `Admission planning at ${admissionPlanningRate}% — some aspects of admission preparation are in place but inconsistencies in introductory visits, child preparation, or staff briefings may affect the quality of transitions.`,
      severity: "warning",
    });
  }

  if (highRiskImpacts > 0 && totalImpactAssessments > 0) {
    insights.push({
      text: `${highRiskImpacts} high or very-high risk impact assessment${highRiskImpacts > 1 ? "s" : ""} identified — the home is managing complex referrals that require enhanced scrutiny, robust mitigations, and careful monitoring.`,
      severity: "warning",
    });
  }

  if (marginalMatches > 0 && totalMatchingRecords > 0) {
    insights.push({
      text: `${marginalMatches} placement${marginalMatches > 1 ? "s" : ""} assessed as marginal match — these placements carry elevated risk of disruption and require enhanced monitoring and support.`,
      severity: "warning",
    });
  }

  if (
    timelyAssessmentRate >= 40 &&
    timelyAssessmentRate < 70 &&
    totalReferralAssessments > 0
  ) {
    insights.push({
      text: `Referral assessment timeliness at ${timelyAssessmentRate}% — delays in completing assessments may create pressure for rushed admission decisions or extended uncertainty for referred children.`,
      severity: "warning",
    });
  }

  if (
    managerSignOffRate >= 50 &&
    managerSignOffRate < 80 &&
    totalImpactAssessments > 0
  ) {
    insights.push({
      text: `Manager sign-off on impact assessments at ${managerSignOffRate}% — not all admission decisions have formal management oversight, which weakens governance of the admissions process.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (admissions_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding admissions and matching practice — referral assessments are thorough, impact on existing children is rigorously evaluated, matching criteria are comprehensively assessed, and children's views consistently inform placement decisions. This contributes positively to overall effectiveness and Reg 36 compliance.",
      severity: "positive",
    });
  }

  if (
    referralAssessmentRate >= 90 &&
    safeguardingCheckRate >= 90 &&
    sopAlignmentRate >= 90 &&
    totalReferralAssessments > 0
  ) {
    insights.push({
      text: `${referralAssessmentRate}% assessment completion with ${safeguardingCheckRate}% safeguarding checks and ${sopAlignmentRate}% SoP alignment — the home's referral assessment process is comprehensive and rigorous, ensuring only appropriate placements are accepted.`,
      severity: "positive",
    });
  }

  if (
    impactAssessmentRate >= 90 &&
    impactChildConsultRate >= 90 &&
    mitigationAdequacyRate >= 90 &&
    totalImpactAssessments > 0
  ) {
    insights.push({
      text: `Outstanding impact assessment practice with ${impactChildConsultRate}% child consultation and ${mitigationAdequacyRate}% mitigation adequacy — existing children are genuinely protected through thorough, child-centred impact evaluation.`,
      severity: "positive",
    });
  }

  if (
    matchingQualityRate >= 90 &&
    domainCoverageRate >= 90 &&
    totalMatchingRecords > 0
  ) {
    insights.push({
      text: `${matchingQualityRate}% matching quality with ${domainCoverageRate}% domain coverage — the home assesses compatibility across all key dimensions ensuring well-matched placements that support stability and positive outcomes.`,
      severity: "positive",
    });
  }

  if (
    childConsultationRate >= 90 &&
    totalChildConsultDenom > 0
  ) {
    insights.push({
      text: `${childConsultationRate}% child consultation across admissions processes — children's voices genuinely shape placement decisions, demonstrating exemplary child-centred practice that Ofsted values highly under SCCIF.`,
      severity: "positive",
    });
  }

  if (
    admissionPlanningRate >= 90 &&
    existingPrepRate >= 90 &&
    totalAdmissionPlans > 0
  ) {
    insights.push({
      text: `${admissionPlanningRate}% admission planning quality with ${existingPrepRate}% existing children preparation — thorough planning supports smooth transitions and demonstrates that both incoming and existing children's needs are prioritised.`,
      severity: "positive",
    });
  }

  if (
    introVisitRate >= 90 &&
    introPositiveRate >= 80 &&
    introVisitCompleted > 0
  ) {
    insights.push({
      text: `Introductory visits completed for ${introVisitRate}% of admissions with ${introPositiveRate}% positive child feedback — children are given meaningful opportunity to experience the home before placement, supporting informed consent and reducing anxiety.`,
      severity: "positive",
    });
  }

  if (unsuitableOutcomes > 0 && totalSuitabilityReviews > 0) {
    insights.push({
      text: `${unsuitableOutcomes} referral${unsuitableOutcomes > 1 ? "s" : ""} formally assessed as unsuitable — the home demonstrates willingness to decline placements that do not align with its Statement of Purpose or the needs of existing children. This prioritises quality over occupancy.`,
      severity: "positive",
    });
  }

  if (conditionalOutcomes > 0 && conditionsDocRate >= 80 && totalSuitabilityReviews > 0) {
    insights.push({
      text: "Conditional placements have well-documented conditions — the home applies proportionate safeguards with clear expectations, demonstrating nuanced decision-making rather than binary accept/reject outcomes.",
      severity: "positive",
    });
  }

  if (
    firstReviewRate >= 90 &&
    totalAdmissionPlans > 0
  ) {
    insights.push({
      text: "First placement reviews are scheduled for virtually all new admissions — the home actively monitors whether matching decisions prove effective and can identify emerging concerns early.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (admissions_rating === "outstanding") {
    headline =
      "Outstanding admissions and matching assessment — referral evaluations are thorough, impact on existing children is rigorously assessed, and matching decisions are informed by comprehensive compatibility analysis and children's views.";
  } else if (admissions_rating === "good") {
    headline = `Good admissions and matching practice — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (admissions_rating === "adequate") {
    headline = `Adequate admissions and matching assessment — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure robust referral evaluation, impact assessment, and placement matching.`;
  } else {
    headline = `Admissions and matching assessment is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure referral assessment quality, impact risk analysis, and placement suitability.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    admissions_rating,
    admissions_score: score,
    headline,
    total_referral_assessments: totalReferralAssessments,
    total_impact_assessments: totalImpactAssessments,
    total_matching_records: totalMatchingRecords,
    total_suitability_reviews: totalSuitabilityReviews,
    total_admission_plans: totalAdmissionPlans,
    referral_assessment_rate: referralAssessmentRate,
    impact_assessment_rate: impactAssessmentRate,
    matching_quality_rate: matchingQualityRate,
    suitability_review_rate: suitabilityReviewRate,
    admission_planning_rate: admissionPlanningRate,
    child_consultation_rate: childConsultationRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
