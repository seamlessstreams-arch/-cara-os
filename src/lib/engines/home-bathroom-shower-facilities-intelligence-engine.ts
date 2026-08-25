// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME BATHROOM & SHOWER FACILITIES INTELLIGENCE ENGINE
// Monitors the home's bathroom and shower facilities including cleanliness
// audits, shower availability, hot water temperature safety, privacy
// provisions, accessibility compliance, and child satisfaction.
// Measures cleanliness audit outcomes, shower availability rates, hot water
// temperature safety compliance, privacy provision adequacy, accessibility
// standards, and children's satisfaction with bathroom facilities.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 25 (Premises), Reg 5 (Engaging and effective
// leadership); SCCIF safety — "Living in the home".
// Store keys: cleanlinessAuditRecords, showerAvailabilityRecords,
//             hotWaterRecords, privacyRecords, accessibilityRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

import { below, meets, rate } from "@/lib/metrics/rate";

export interface CleanlinessAuditRecordInput {
  id: string;
  date: string;
  bathroom_id: string;
  bathroom_name: string;
  auditor: string;
  overall_score: number; // 1-5
  surfaces_clean: boolean;
  floor_clean: boolean;
  toilet_clean: boolean;
  sink_clean: boolean;
  shower_bath_clean: boolean;
  mirrors_clean: boolean;
  bins_emptied: boolean;
  supplies_stocked: boolean; // soap, toilet paper, towels
  mould_detected: boolean;
  limescale_detected: boolean;
  ventilation_adequate: boolean;
  odour_free: boolean;
  hazards_found: boolean;
  hazard_description: string;
  corrective_action_taken: boolean;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  child_feedback_collected: boolean;
  child_feedback_positive: boolean;
  notes: string;
  created_at: string;
}

export interface ShowerAvailabilityRecordInput {
  id: string;
  date: string;
  bathroom_id: string;
  bathroom_name: string;
  shower_functional: boolean;
  bath_functional: boolean;
  hot_water_available: boolean;
  cold_water_available: boolean;
  adequate_water_pressure: boolean;
  drainage_clear: boolean;
  showerhead_condition: "good" | "fair" | "poor" | "replaced";
  anti_slip_measures_in_place: boolean;
  shower_curtain_screen_intact: boolean;
  reported_by: string;
  time_of_check: string;
  downtime_hours: number; // 0 = fully available
  repair_requested: boolean;
  repair_completed: boolean;
  child_affected: boolean;
  alternative_provided: boolean;
  notes: string;
  created_at: string;
}

export interface HotWaterRecordInput {
  id: string;
  date: string;
  bathroom_id: string;
  bathroom_name: string;
  temperature_celsius: number;
  within_safe_range: boolean; // typically 38-44°C at outlet
  tmv_fitted: boolean; // thermostatic mixing valve
  tmv_tested: boolean;
  tmv_test_passed: boolean;
  scalding_risk_identified: boolean;
  scalding_incident_occurred: boolean;
  legionella_check_completed: boolean;
  legionella_check_passed: boolean;
  water_quality_acceptable: boolean;
  tested_by: string;
  next_test_due: string;
  corrective_action_required: boolean;
  corrective_action_completed: boolean;
  notes: string;
  created_at: string;
}

export interface PrivacyRecordInput {
  id: string;
  date: string;
  bathroom_id: string;
  bathroom_name: string;
  lock_fitted: boolean;
  lock_functional: boolean;
  lock_overridable_externally: boolean; // emergency override from outside
  frosted_window_or_blind: boolean;
  adequate_screening: boolean; // shower curtains/screens
  individual_towels_provided: boolean;
  personal_storage_available: boolean; // shelf/cupboard for toiletries
  knock_before_entry_policy_observed: boolean;
  child_consulted_on_privacy: boolean;
  child_satisfied_with_privacy: boolean;
  shared_bathroom: boolean;
  sharing_arrangement_appropriate: boolean;
  privacy_complaint_received: boolean;
  complaint_resolved: boolean;
  assessed_by: string;
  notes: string;
  created_at: string;
}

export interface AccessibilityRecordInput {
  id: string;
  date: string;
  bathroom_id: string;
  bathroom_name: string;
  wheelchair_accessible: boolean;
  grab_rails_fitted: boolean;
  grab_rails_secure: boolean;
  non_slip_flooring: boolean;
  level_access_shower: boolean;
  adequate_space_for_mobility: boolean;
  emergency_pull_cord_fitted: boolean;
  emergency_pull_cord_functional: boolean;
  height_appropriate_fittings: boolean; // age-appropriate sink/toilet height
  sensory_adjustments_made: boolean; // for children with sensory needs
  individual_needs_assessment_completed: boolean;
  adaptations_match_care_plan: boolean;
  child_can_use_independently: boolean;
  assessed_by: string;
  next_review_due: string;
  notes: string;
  created_at: string;
}

export interface BathroomShowerFacilitiesInput {
  today: string;
  total_children: number;
  cleanliness_audit_records: CleanlinessAuditRecordInput[];
  shower_availability_records: ShowerAvailabilityRecordInput[];
  hot_water_records: HotWaterRecordInput[];
  privacy_records: PrivacyRecordInput[];
  accessibility_records: AccessibilityRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type BathroomShowerRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface BathroomShowerInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface BathroomShowerRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface BathroomShowerFacilitiesResult {
  bathroom_rating: BathroomShowerRating;
  bathroom_score: number;
  headline: string;
  total_cleanliness_audits: number;
  total_shower_availability_checks: number;
  total_hot_water_records: number;
  total_privacy_records: number;
  total_accessibility_records: number;
  /** null when the population is empty — nothing measured, not 0%. */
  cleanliness_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  shower_availability_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  hot_water_safety_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  privacy_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  accessibility_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  child_satisfaction_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: BathroomShowerRecommendation[];
  insights: BathroomShowerInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

// Was `d === 0 ? 0 : …`: nothing recorded read as 0%, not as unmeasured.
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): BathroomShowerRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: BathroomShowerRating,
  score: number,
  headline: string,
): BathroomShowerFacilitiesResult {
  return {
    bathroom_rating: rating,
    bathroom_score: score,
    headline,
    total_cleanliness_audits: 0,
    total_shower_availability_checks: 0,
    total_hot_water_records: 0,
    total_privacy_records: 0,
    total_accessibility_records: 0,
    cleanliness_rate: null,
    shower_availability_rate: null,
    hot_water_safety_rate: null,
    privacy_rate: null,
    accessibility_rate: null,
    child_satisfaction_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeBathroomShowerFacilities(
  input: BathroomShowerFacilitiesInput,
): BathroomShowerFacilitiesResult {
  const {
    total_children,
    cleanliness_audit_records,
    shower_availability_records,
    hot_water_records,
    privacy_records,
    accessibility_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    cleanliness_audit_records.length === 0 &&
    shower_availability_records.length === 0 &&
    hot_water_records.length === 0 &&
    privacy_records.length === 0 &&
    accessibility_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess bathroom and shower facilities.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No bathroom or shower facilities data recorded despite children on placement — cleanliness audits, shower availability, hot water safety, privacy, and accessibility require urgent attention.",
      ),
      concerns: [
        "No cleanliness audit records, shower availability checks, hot water temperature records, privacy assessments, or accessibility records exist despite children being on placement — the home cannot evidence safe and suitable bathroom facilities.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of bathroom cleanliness audits, shower availability checks, hot water temperature monitoring, privacy assessments, and accessibility reviews to evidence safe, hygienic, and suitable bathroom facilities for all children.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all hot water outlets in bathrooms used by children are fitted with thermostatic mixing valves and that temperatures are tested regularly to prevent scalding risk — this is a fundamental safety requirement.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
        },
      ],
      insights: [
        {
          text: "The complete absence of bathroom and shower facilities records means the home cannot demonstrate that bathrooms are clean, safe, private, and accessible. Under Reg 25, premises must be suitable for their purpose and maintained to a standard that promotes children's safety, comfort, and dignity. This is a significant regulatory compliance gap.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Cleanliness audit metrics ---
  const totalCleanlinessAudits = cleanliness_audit_records.length;

  // Count audits scoring 4+ out of 5 as "clean"
  const cleanAudits = cleanliness_audit_records.filter((a) => a.overall_score >= 4).length;
  const cleanlinessRate = rate(cleanAudits, totalCleanlinessAudits);

  const mouldDetectedCount = cleanliness_audit_records.filter((a) => a.mould_detected).length;
  const mouldRate = rate(mouldDetectedCount, totalCleanlinessAudits);

  const ventilationAdequateCount = cleanliness_audit_records.filter((a) => a.ventilation_adequate).length;
  const ventilationRate = rate(ventilationAdequateCount, totalCleanlinessAudits);

  const hazardsFoundCount = cleanliness_audit_records.filter((a) => a.hazards_found).length;

  const correctiveActionTakenCount = cleanliness_audit_records.filter(
    (a) => a.hazards_found && a.corrective_action_taken,
  ).length;
  const correctiveActionRate = hazardsFoundCount > 0 ? rate(correctiveActionTakenCount, hazardsFoundCount) : 100;

  const followUpRequiredCount = cleanliness_audit_records.filter((a) => a.follow_up_required).length;
  const followUpCompletedCount = cleanliness_audit_records.filter(
    (a) => a.follow_up_required && a.follow_up_completed,
  ).length;
  const followUpCompletionRate = followUpRequiredCount > 0 ? rate(followUpCompletedCount, followUpRequiredCount) : 100;

  // --- Shower availability metrics ---
  const totalShowerAvailabilityChecks = shower_availability_records.length;

  const antiSlipCount = shower_availability_records.filter((s) => s.anti_slip_measures_in_place).length;
  const antiSlipRate = rate(antiSlipCount, totalShowerAvailabilityChecks);

  const repairRequestedCount = shower_availability_records.filter((s) => s.repair_requested).length;
  const repairCompletedCount = shower_availability_records.filter(
    (s) => s.repair_requested && s.repair_completed,
  ).length;
  const repairCompletionRate = repairRequestedCount > 0 ? rate(repairCompletedCount, repairRequestedCount) : 100;

  // Composite shower availability: shower_functional OR bath_functional AND hot_water_available
  const showerAvailableComposite = shower_availability_records.filter(
    (s) => (s.shower_functional || s.bath_functional) && s.hot_water_available,
  ).length;
  const showerAvailabilityRate = rate(showerAvailableComposite, totalShowerAvailabilityChecks);

  // --- Hot water safety metrics ---
  const totalHotWaterRecords = hot_water_records.length;

  const withinSafeRangeCount = hot_water_records.filter((h) => h.within_safe_range).length;
  const hotWaterSafetyRate = rate(withinSafeRangeCount, totalHotWaterRecords);

  const tmvFittedCount = hot_water_records.filter((h) => h.tmv_fitted).length;
  const tmvFittedRate = rate(tmvFittedCount, totalHotWaterRecords);

  const scaldingRiskCount = hot_water_records.filter((h) => h.scalding_risk_identified).length;

  const scaldingIncidentCount = hot_water_records.filter((h) => h.scalding_incident_occurred).length;

  const legionellaCheckedCount = hot_water_records.filter((h) => h.legionella_check_completed).length;
  const legionellaCheckedRate = rate(legionellaCheckedCount, totalHotWaterRecords);

  const legionellaPassedCount = hot_water_records.filter(
    (h) => h.legionella_check_completed && h.legionella_check_passed,
  ).length;
  const legionellaPassedRate = legionellaCheckedCount > 0 ? rate(legionellaPassedCount, legionellaCheckedCount) : 0;

  const waterQualityAcceptableCount = hot_water_records.filter((h) => h.water_quality_acceptable).length;
  const waterQualityRate = rate(waterQualityAcceptableCount, totalHotWaterRecords);

  // --- Privacy metrics ---
  const totalPrivacyRecords = privacy_records.length;

  const lockFittedCount = privacy_records.filter((p) => p.lock_fitted).length;
  const lockFittedRate = rate(lockFittedCount, totalPrivacyRecords);

  const lockFunctionalCount = privacy_records.filter((p) => p.lock_fitted && p.lock_functional).length;

  const adequateScreeningCount = privacy_records.filter((p) => p.adequate_screening).length;

  const knockPolicyCount = privacy_records.filter((p) => p.knock_before_entry_policy_observed).length;
  const knockPolicyRate = rate(knockPolicyCount, totalPrivacyRecords);

  const childConsultedPrivacyCount = privacy_records.filter((p) => p.child_consulted_on_privacy).length;

  const childSatisfiedPrivacyCount = privacy_records.filter(
    (p) => p.child_consulted_on_privacy && p.child_satisfied_with_privacy,
  ).length;

  // Composite privacy rate: lock functional + adequate screening + knock policy
  const privacyCompositeNumerators: number[] = [];
  const privacyCompositeDenominators: number[] = [];
  if (totalPrivacyRecords > 0) {
    privacyCompositeNumerators.push(lockFunctionalCount, adequateScreeningCount, knockPolicyCount);
    privacyCompositeDenominators.push(totalPrivacyRecords, totalPrivacyRecords, totalPrivacyRecords);
  }
  const privacyCompositeNum = privacyCompositeNumerators.reduce((a, b) => a + b, 0);
  const privacyCompositeDen = privacyCompositeDenominators.reduce((a, b) => a + b, 0);
  const privacyRate = rate(privacyCompositeNum, privacyCompositeDen);

  // --- Accessibility metrics ---
  const totalAccessibilityRecords = accessibility_records.length;

  const needsAssessmentCount = accessibility_records.filter((a) => a.individual_needs_assessment_completed).length;
  const needsAssessmentRate = rate(needsAssessmentCount, totalAccessibilityRecords);

  const adaptationsMatchCount = accessibility_records.filter((a) => a.adaptations_match_care_plan).length;

  const childIndependentCount = accessibility_records.filter((a) => a.child_can_use_independently).length;
  const childIndependentRate = rate(childIndependentCount, totalAccessibilityRecords);

  // Composite accessibility rate: needs assessment + adaptations match + child independent use
  const accessibilityCompositeNumerators: number[] = [];
  const accessibilityCompositeDenominators: number[] = [];
  if (totalAccessibilityRecords > 0) {
    accessibilityCompositeNumerators.push(needsAssessmentCount, adaptationsMatchCount, childIndependentCount);
    accessibilityCompositeDenominators.push(
      totalAccessibilityRecords,
      totalAccessibilityRecords,
      totalAccessibilityRecords,
    );
  }
  const accessibilityCompositeNum = accessibilityCompositeNumerators.reduce((a, b) => a + b, 0);
  const accessibilityCompositeDen = accessibilityCompositeDenominators.reduce((a, b) => a + b, 0);
  const accessibilityRate = rate(accessibilityCompositeNum, accessibilityCompositeDen);

  // --- Child satisfaction composite ---
  // Composite across cleanliness feedback, privacy satisfaction, and independent use
  const childSatNumerators: number[] = [];
  const childSatDenominators: number[] = [];

  const cleanlinessChildFeedbackCount = cleanliness_audit_records.filter(
    (a) => a.child_feedback_collected && a.child_feedback_positive,
  ).length;
  const cleanlinessChildFeedbackTotal = cleanliness_audit_records.filter(
    (a) => a.child_feedback_collected,
  ).length;

  if (cleanlinessChildFeedbackTotal > 0) {
    childSatNumerators.push(cleanlinessChildFeedbackCount);
    childSatDenominators.push(cleanlinessChildFeedbackTotal);
  }

  if (childConsultedPrivacyCount > 0) {
    childSatNumerators.push(childSatisfiedPrivacyCount);
    childSatDenominators.push(childConsultedPrivacyCount);
  }

  if (totalAccessibilityRecords > 0) {
    childSatNumerators.push(childIndependentCount);
    childSatDenominators.push(totalAccessibilityRecords);
  }

  const totalChildSatNum = childSatNumerators.reduce((a, b) => a + b, 0);
  const totalChildSatDen = childSatDenominators.reduce((a, b) => a + b, 0);
  const childSatisfactionRate = rate(totalChildSatNum, totalChildSatDen);

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: cleanlinessRate (>=90: +5, >=70: +3) ---
  if (meets(cleanlinessRate, 90)) score += 5;
  else if (meets(cleanlinessRate, 70)) score += 3;

  // --- Bonus 2: showerAvailabilityRate (>=95: +5, >=80: +3) ---
  if (meets(showerAvailabilityRate, 95)) score += 5;
  else if (meets(showerAvailabilityRate, 80)) score += 3;

  // --- Bonus 3: hotWaterSafetyRate (>=95: +5, >=80: +3) ---
  if (meets(hotWaterSafetyRate, 95)) score += 5;
  else if (meets(hotWaterSafetyRate, 80)) score += 3;

  // --- Bonus 4: privacyRate (>=90: +4, >=70: +2) ---
  if (meets(privacyRate, 90)) score += 4;
  else if (meets(privacyRate, 70)) score += 2;

  // --- Bonus 5: accessibilityRate (>=90: +4, >=70: +2) ---
  if (meets(accessibilityRate, 90)) score += 4;
  else if (meets(accessibilityRate, 70)) score += 2;

  // --- Bonus 6: childSatisfactionRate (>=90: +3, >=70: +1) ---
  if (meets(childSatisfactionRate, 90)) score += 3;
  else if (meets(childSatisfactionRate, 70)) score += 1;

  // --- Bonus 7: ventilationRate (>=90: +1) ---
  if (meets(ventilationRate, 90) && totalCleanlinessAudits > 0) score += 1;

  // --- Bonus 8: tmvFittedRate (>=95: +1) ---
  if (meets(tmvFittedRate, 95) && totalHotWaterRecords > 0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // hotWaterSafetyRate < 60 → -8 (guarded) — scalding is a critical safety risk
  if (below(hotWaterSafetyRate, 60) && totalHotWaterRecords > 0) score -= 8;

  // cleanlinessRate < 50 → -5 (guarded)
  if (below(cleanlinessRate, 50) && totalCleanlinessAudits > 0) score -= 5;

  // privacyRate < 50 → -5 (guarded)
  if (below(privacyRate, 50) && totalPrivacyRecords > 0) score -= 5;

  // scaldingIncidentCount > 0 → -6 (guarded)
  if (scaldingIncidentCount > 0 && totalHotWaterRecords > 0) score -= 6;

  score = clamp(score, 0, 100);

  const bathroom_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(cleanlinessRate, 90) && totalCleanlinessAudits > 0) {
    strengths.push(
      `${cleanlinessRate}% of cleanliness audits scored 4+ out of 5 — bathrooms are maintained to an excellent standard of hygiene and cleanliness.`,
    );
  } else if (meets(cleanlinessRate, 70) && totalCleanlinessAudits > 0) {
    strengths.push(
      `${cleanlinessRate}% cleanliness audit pass rate — bathrooms are generally well-maintained with good standards of hygiene.`,
    );
  }

  if (meets(showerAvailabilityRate, 95) && totalShowerAvailabilityChecks > 0) {
    strengths.push(
      `${showerAvailabilityRate}% shower/bath availability with hot water — children have consistent access to functional bathing facilities.`,
    );
  } else if (meets(showerAvailabilityRate, 80) && totalShowerAvailabilityChecks > 0) {
    strengths.push(
      `${showerAvailabilityRate}% shower/bath availability — children generally have reliable access to bathing facilities with hot water.`,
    );
  }

  if (meets(hotWaterSafetyRate, 95) && totalHotWaterRecords > 0) {
    strengths.push(
      `${hotWaterSafetyRate}% hot water temperature safety compliance — water temperatures are consistently maintained within the safe range, protecting children from scalding risk.`,
    );
  } else if (meets(hotWaterSafetyRate, 80) && totalHotWaterRecords > 0) {
    strengths.push(
      `${hotWaterSafetyRate}% hot water safety rate — the majority of temperature checks show water within the safe range.`,
    );
  }

  if (meets(privacyRate, 90) && totalPrivacyRecords > 0) {
    strengths.push(
      `${privacyRate}% privacy compliance — bathrooms provide excellent privacy with functional locks, adequate screening, and staff observing knock-before-entry policy.`,
    );
  } else if (meets(privacyRate, 70) && totalPrivacyRecords > 0) {
    strengths.push(
      `${privacyRate}% privacy rate — the home provides good privacy provisions in bathroom facilities for children.`,
    );
  }

  if (meets(accessibilityRate, 90) && totalAccessibilityRecords > 0) {
    strengths.push(
      `${accessibilityRate}% accessibility compliance — bathroom facilities are well-adapted to children's individual needs with completed assessments and care plan-matched adaptations.`,
    );
  } else if (meets(accessibilityRate, 70) && totalAccessibilityRecords > 0) {
    strengths.push(
      `${accessibilityRate}% accessibility rate — the home demonstrates good attention to making bathroom facilities accessible to children's individual needs.`,
    );
  }

  if (meets(childSatisfactionRate, 90) && totalChildSatDen > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction with bathroom facilities — children report positive experiences across cleanliness, privacy, and accessibility.`,
    );
  } else if (meets(childSatisfactionRate, 70) && totalChildSatDen > 0) {
    strengths.push(
      `${childSatisfactionRate}% child satisfaction — children are generally satisfied with the bathroom facilities provided.`,
    );
  }

  if (meets(tmvFittedRate, 95) && totalHotWaterRecords > 0) {
    strengths.push(
      `${tmvFittedRate}% of hot water outlets fitted with thermostatic mixing valves — comprehensive scalding prevention measures are in place across all bathroom facilities.`,
    );
  } else if (meets(tmvFittedRate, 80) && totalHotWaterRecords > 0) {
    strengths.push(
      `${tmvFittedRate}% TMV fitting rate — the majority of hot water outlets have thermostatic mixing valves fitted for scalding prevention.`,
    );
  }

  if (meets(ventilationRate, 90) && totalCleanlinessAudits > 0) {
    strengths.push(
      `${ventilationRate}% of bathrooms have adequate ventilation — good air quality management reducing mould risk and maintaining comfortable facilities.`,
    );
  }

  if (meets(antiSlipRate, 90) && totalShowerAvailabilityChecks > 0) {
    strengths.push(
      `${antiSlipRate}% of shower/bath areas have anti-slip measures in place — proactive approach to preventing slip injuries in wet areas.`,
    );
  }

  if (mouldRate === 0 && totalCleanlinessAudits > 0) {
    strengths.push(
      "Zero mould detected across all bathroom audits — excellent preventive maintenance and ventilation management.",
    );
  }

  if (meets(knockPolicyRate, 95) && totalPrivacyRecords > 0) {
    strengths.push(
      `${knockPolicyRate}% staff compliance with knock-before-entry policy — children's dignity and privacy is consistently respected by all staff.`,
    );
  }

  if (meets(legionellaCheckedRate, 90) && meets(legionellaPassedRate, 95) && totalHotWaterRecords > 0) {
    strengths.push(
      "Comprehensive Legionella monitoring with consistent pass rates — water safety management is robust and well-evidenced.",
    );
  }

  if (meets(childIndependentRate, 90) && totalAccessibilityRecords > 0) {
    strengths.push(
      `${childIndependentRate}% of children can use bathroom facilities independently — adaptations and design support children's autonomy and dignity.`,
    );
  }

  if (meets(correctiveActionRate, 95) && hazardsFoundCount > 0) {
    strengths.push(
      `${correctiveActionRate}% of identified bathroom hazards had corrective action taken — responsive approach to maintaining a safe environment.`,
    );
  }

  if (scaldingRiskCount === 0 && scaldingIncidentCount === 0 && totalHotWaterRecords > 0) {
    strengths.push(
      "No scalding risks identified and zero scalding incidents — hot water safety management is exemplary.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(cleanlinessRate, 50) && totalCleanlinessAudits > 0) {
    concerns.push(
      `Only ${cleanlinessRate}% of cleanliness audits scored 4+ — the majority of bathrooms are not maintained to an acceptable standard of hygiene, creating an undignified and potentially unhealthy environment for children.`,
    );
  } else if (below(cleanlinessRate, 70) && meets(cleanlinessRate, 50) && totalCleanlinessAudits > 0) {
    concerns.push(
      `Cleanliness audit pass rate at ${cleanlinessRate}% — inconsistent cleaning standards mean some bathrooms are not meeting acceptable hygiene levels.`,
    );
  }

  if (below(showerAvailabilityRate, 70) && totalShowerAvailabilityChecks > 0) {
    concerns.push(
      `Only ${showerAvailabilityRate}% shower/bath availability — children do not have reliable access to functional bathing facilities with hot water, which is a fundamental requirement under Reg 25.`,
    );
  } else if (below(showerAvailabilityRate, 80) && meets(showerAvailabilityRate, 70) && totalShowerAvailabilityChecks > 0) {
    concerns.push(
      `Shower/bath availability at ${showerAvailabilityRate}% — some periods of reduced access to bathing facilities require attention to ensure consistent provision.`,
    );
  }

  if (below(hotWaterSafetyRate, 60) && totalHotWaterRecords > 0) {
    concerns.push(
      `Only ${hotWaterSafetyRate}% hot water temperature safety compliance — a significant proportion of water temperature checks fall outside the safe range, creating an unacceptable scalding risk for children. This is a critical safety failure.`,
    );
  } else if (below(hotWaterSafetyRate, 80) && meets(hotWaterSafetyRate, 60) && totalHotWaterRecords > 0) {
    concerns.push(
      `Hot water safety at ${hotWaterSafetyRate}% — water temperatures are not consistently within the safe range, indicating scalding risk that must be addressed.`,
    );
  }

  if (below(privacyRate, 50) && totalPrivacyRecords > 0) {
    concerns.push(
      `Only ${privacyRate}% privacy compliance — the majority of bathroom assessments show inadequate privacy provisions, compromising children's dignity and potentially breaching their right to privacy.`,
    );
  } else if (below(privacyRate, 70) && meets(privacyRate, 50) && totalPrivacyRecords > 0) {
    concerns.push(
      `Privacy rate at ${privacyRate}% — privacy provisions in some bathrooms are inadequate, requiring improvement to protect children's dignity.`,
    );
  }

  if (below(accessibilityRate, 50) && totalAccessibilityRecords > 0) {
    concerns.push(
      `Only ${accessibilityRate}% accessibility compliance — bathroom facilities do not adequately meet children's individual accessibility needs, limiting their independence and dignity.`,
    );
  } else if (below(accessibilityRate, 70) && meets(accessibilityRate, 50) && totalAccessibilityRecords > 0) {
    concerns.push(
      `Accessibility rate at ${accessibilityRate}% — some bathroom facilities are not fully adapted to children's individual needs, requiring review and improvement.`,
    );
  }

  if (below(childSatisfactionRate, 50) && totalChildSatDen > 0) {
    concerns.push(
      `Only ${childSatisfactionRate}% child satisfaction with bathroom facilities — children are not happy with the provision, which should be urgently addressed as their voice must inform improvements.`,
    );
  } else if (below(childSatisfactionRate, 70) && meets(childSatisfactionRate, 50) && totalChildSatDen > 0) {
    concerns.push(
      `Child satisfaction at ${childSatisfactionRate}% — some children are not satisfied with bathroom facilities, indicating areas where provision could be improved.`,
    );
  }

  if (scaldingIncidentCount > 0 && totalHotWaterRecords > 0) {
    concerns.push(
      `${scaldingIncidentCount} scalding incident${scaldingIncidentCount !== 1 ? "s" : ""} recorded — any scalding incident is a serious safety failure requiring immediate investigation and remediation. Hot water temperature controls must be reviewed and rectified without delay.`,
    );
  }

  if (scaldingRiskCount > 0 && scaldingIncidentCount === 0 && totalHotWaterRecords > 0) {
    concerns.push(
      `${scaldingRiskCount} scalding risk${scaldingRiskCount !== 1 ? "s" : ""} identified — while no incidents have occurred, identified risks must be addressed promptly to prevent harm.`,
    );
  }

  if (meets(mouldRate, 30) && totalCleanlinessAudits > 0) {
    concerns.push(
      `Mould detected in ${mouldRate}% of bathroom audits — persistent mould indicates ventilation problems and poses a health risk to children. This requires immediate remediation.`,
    );
  } else if (meets(mouldRate, 15) && below(mouldRate, 30) && totalCleanlinessAudits > 0) {
    concerns.push(
      `Mould detected in ${mouldRate}% of audits — early signs of mould require preventive action to avoid health risks and damage to facilities.`,
    );
  }

  if (below(tmvFittedRate, 50) && totalHotWaterRecords > 0) {
    concerns.push(
      `Only ${tmvFittedRate}% of hot water outlets have TMVs fitted — thermostatic mixing valves are essential to prevent scalding and their absence represents a significant safety gap.`,
    );
  } else if (below(tmvFittedRate, 80) && meets(tmvFittedRate, 50) && totalHotWaterRecords > 0) {
    concerns.push(
      `TMV fitting rate at ${tmvFittedRate}% — not all hot water outlets have thermostatic mixing valves, leaving some facilities without adequate scalding prevention.`,
    );
  }

  if (below(lockFittedRate, 70) && totalPrivacyRecords > 0) {
    concerns.push(
      `Only ${lockFittedRate}% of bathrooms have locks fitted — children cannot secure bathrooms for privacy, which is a basic dignity requirement.`,
    );
  }

  if (below(knockPolicyRate, 70) && totalPrivacyRecords > 0) {
    concerns.push(
      `Knock-before-entry policy observed in only ${knockPolicyRate}% of assessments — staff are not consistently respecting children's bathroom privacy.`,
    );
  }

  if (below(followUpCompletionRate, 70) && followUpRequiredCount > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of required follow-up actions completed — outstanding follow-ups from bathroom audits must be addressed to maintain safe facilities.`,
    );
  }

  if (below(repairCompletionRate, 50) && repairRequestedCount > 0) {
    concerns.push(
      `Only ${repairCompletionRate}% of bathroom repairs completed — unresolved repairs compromise the availability and safety of facilities for children.`,
    );
  }

  if (below(legionellaCheckedRate, 50) && totalHotWaterRecords > 0) {
    concerns.push(
      `Only ${legionellaCheckedRate}% of hot water records include Legionella checks — Legionella monitoring is a statutory water safety requirement that is not being consistently met.`,
    );
  }

  if (below(needsAssessmentRate, 50) && totalAccessibilityRecords > 0) {
    concerns.push(
      `Only ${needsAssessmentRate}% of accessibility records show completed individual needs assessments — the home cannot demonstrate that bathroom adaptations are based on assessed needs.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: BathroomShowerRecommendation[] = [];
  let rank = 0;

  if (scaldingIncidentCount > 0 && totalHotWaterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately investigate all scalding incidents — review and recalibrate thermostatic mixing valves on all affected outlets, verify temperature at every hot water point, and implement daily temperature checks until all readings are consistently within the safe range.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (below(hotWaterSafetyRate, 60) && totalHotWaterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address hot water temperature safety — ensure all outlets used by children are fitted with functioning TMVs, recalibrate existing valves, and implement a daily temperature testing regime until all readings are consistently within the safe range of 38-44°C at the outlet.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (below(cleanlinessRate, 50) && totalCleanlinessAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement an enhanced bathroom cleaning schedule with daily checks and weekly deep cleans — assign named staff to each bathroom, provide cleaning checklists, and conduct spot audits to drive improvement in hygiene standards.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(privacyRate, 50) && totalPrivacyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review bathroom privacy provisions — fit functional locks with emergency override capability to all bathrooms, install adequate screening, reinforce the knock-before-entry policy with all staff, and consult children about their privacy needs.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; Reg 5 — Engaging and effective leadership",
    });
  }

  if (below(tmvFittedRate, 50) && totalHotWaterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Fit thermostatic mixing valves to all hot water outlets in bathrooms used by children — this is a fundamental scalding prevention measure required to ensure children's safety.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (below(accessibilityRate, 50) && totalAccessibilityRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete individual accessibility needs assessments for all children and ensure bathroom adaptations match care plan requirements — children must be able to use bathroom facilities with maximum independence and dignity.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; Reg 5 — Engaging and effective leadership",
    });
  }

  if (meets(mouldRate, 30) && totalCleanlinessAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Commission a specialist assessment of mould-affected bathrooms — improve ventilation systems, treat existing mould, and implement a preventive maintenance schedule to protect children's respiratory health.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (below(showerAvailabilityRate, 70) && totalShowerAvailabilityChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review shower and bath availability to identify the root causes of reduced access — address plumbing issues, ensure adequate hot water supply, and develop contingency plans to guarantee children always have access to bathing facilities.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(hotWaterSafetyRate, 60) &&
    below(hotWaterSafetyRate, 80) &&
    totalHotWaterRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve hot water temperature monitoring — identify outlets with inconsistent readings, service TMVs where fitted, and increase testing frequency on any outlets that have recorded temperatures outside the safe range.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (
    meets(cleanlinessRate, 50) &&
    below(cleanlinessRate, 70) &&
    totalCleanlinessAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen bathroom cleaning routines — review the cleaning schedule, ensure adequate supplies and equipment, and consider a peer audit system where children can feedback on cleanliness standards.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(privacyRate, 50) &&
    below(privacyRate, 70) &&
    totalPrivacyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve bathroom privacy provisions — repair or replace non-functional locks, install frosted glass or blinds on windows, ensure adequate shower curtains/screens, and reinforce privacy expectations with all staff.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(knockPolicyRate, 70) && totalPrivacyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reinforce the knock-before-entry policy through staff training, supervision, and clear signage on bathroom doors — children's right to privacy in bathrooms must be consistently upheld by all staff at all times.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF — Living in the home",
    });
  }

  if (
    meets(accessibilityRate, 50) &&
    below(accessibilityRate, 70) &&
    totalAccessibilityRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review accessibility provisions to close gaps — ensure all individual needs assessments are up to date, that adaptations align with care plans, and that children can use facilities as independently as possible.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (below(legionellaCheckedRate, 50) && totalHotWaterRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure Legionella testing is completed at every scheduled water safety check — maintain a Legionella risk assessment and management plan in accordance with statutory requirements.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (below(childSatisfactionRate, 50) && totalChildSatDen > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently engage with children to understand their dissatisfaction with bathroom facilities — act on their feedback to make meaningful improvements that directly address their concerns and improve their daily experience.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (below(antiSlipRate, 70) && totalShowerAvailabilityChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Install anti-slip measures in all shower and bath areas — non-slip mats, textured surfaces, or anti-slip coatings should be fitted to reduce the risk of slip injuries in wet areas.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises; SCCIF safety",
    });
  }

  if (
    meets(tmvFittedRate, 50) &&
    below(tmvFittedRate, 80) &&
    totalHotWaterRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend TMV installation to all remaining hot water outlets used by children — a comprehensive approach to scalding prevention requires TMVs on every outlet, not just some.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  if (
    meets(mouldRate, 15) &&
    below(mouldRate, 30) &&
    totalCleanlinessAudits > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address early mould detections through improved ventilation and targeted anti-mould treatment — prevent escalation by reviewing extractor fan performance, window ventilation, and cleaning protocols.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 — Premises",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: BathroomShowerInsight[] = [];

  // -- Critical insights --

  if (scaldingIncidentCount > 0 && totalHotWaterRecords > 0) {
    insights.push({
      text: `${scaldingIncidentCount} scalding incident${scaldingIncidentCount !== 1 ? "s" : ""} recorded. Scalding is one of the most serious preventable injuries in children's homes. Under Reg 25, the registered person must ensure premises are safe. Each incident requires immediate investigation, root cause analysis, and corrective action. Ofsted will expect to see evidence that the home has taken all reasonable steps to prevent recurrence.`,
      severity: "critical",
    });
  }

  if (below(hotWaterSafetyRate, 60) && totalHotWaterRecords > 0) {
    insights.push({
      text: `Only ${hotWaterSafetyRate}% hot water temperature safety compliance. Water delivered at unsafe temperatures poses a direct scalding risk to children. This is a fundamental Reg 25 premises safety failure — all outlets must be fitted with functioning TMVs and regularly tested. Ofsted inspectors will scrutinise hot water safety as a critical safeguarding measure.`,
      severity: "critical",
    });
  }

  if (below(cleanlinessRate, 50) && totalCleanlinessAudits > 0) {
    insights.push({
      text: `Only ${cleanlinessRate}% of bathroom cleanliness audits passed. Poor bathroom hygiene creates an undignified living environment and poses infection control risks. Under Reg 25, premises must be maintained to a standard that promotes children's welfare. Children deserve clean, well-maintained facilities that respect their dignity.`,
      severity: "critical",
    });
  }

  if (below(privacyRate, 50) && totalPrivacyRecords > 0) {
    insights.push({
      text: `Only ${privacyRate}% privacy compliance in bathrooms. Inadequate privacy provisions undermine children's dignity and right to privacy — a fundamental aspect of quality care. Without functional locks, adequate screening, and staff respecting the knock-before-entry policy, children cannot feel safe and respected in their own home.`,
      severity: "critical",
    });
  }

  if (below(tmvFittedRate, 50) && totalHotWaterRecords > 0) {
    insights.push({
      text: `Only ${tmvFittedRate}% of hot water outlets have TMVs fitted. Thermostatic mixing valves are the primary engineering control against scalding. Their absence from the majority of outlets means the home is relying on behavioural controls alone, which is insufficient for vulnerable children. This should be treated as an urgent premises safety priority.`,
      severity: "critical",
    });
  }

  if (totalHotWaterRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No hot water temperature records despite children being on placement. Hot water temperature monitoring is a fundamental safety requirement — the home cannot evidence that water temperatures are safe and scalding risks are managed. This is a significant compliance gap that Ofsted will scrutinise.",
      severity: "critical",
    });
  }

  if (totalCleanlinessAudits === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No bathroom cleanliness audit records despite children being on placement. Without regular audits, the home cannot evidence that bathrooms are maintained to acceptable hygiene standards. A structured audit programme should be implemented immediately.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(hotWaterSafetyRate, 60) &&
    below(hotWaterSafetyRate, 80) &&
    totalHotWaterRecords > 0
  ) {
    insights.push({
      text: `Hot water safety at ${hotWaterSafetyRate}% — while most readings are safe, inconsistent compliance means some children may still be exposed to temperatures outside the safe range. TMV servicing and more frequent testing would improve consistency.`,
      severity: "warning",
    });
  }

  if (
    meets(cleanlinessRate, 50) &&
    below(cleanlinessRate, 70) &&
    totalCleanlinessAudits > 0
  ) {
    insights.push({
      text: `Bathroom cleanliness at ${cleanlinessRate}% — some bathrooms are not consistently meeting acceptable standards. A more structured cleaning schedule with regular spot checks would help maintain standards across all facilities.`,
      severity: "warning",
    });
  }

  if (
    meets(privacyRate, 50) &&
    below(privacyRate, 70) &&
    totalPrivacyRecords > 0
  ) {
    insights.push({
      text: `Privacy compliance at ${privacyRate}% — while some provisions are in place, gaps in locks, screening, or staff practice mean children's privacy is not consistently protected. A bathroom-by-bathroom review would identify specific improvements needed.`,
      severity: "warning",
    });
  }

  if (
    meets(accessibilityRate, 50) &&
    below(accessibilityRate, 70) &&
    totalAccessibilityRecords > 0
  ) {
    insights.push({
      text: `Accessibility at ${accessibilityRate}% — some children's individual needs are not fully met in bathroom facilities. Reviewing assessments and ensuring adaptations align with care plans would improve children's independence and dignity.`,
      severity: "warning",
    });
  }

  if (
    meets(showerAvailabilityRate, 70) &&
    below(showerAvailabilityRate, 80) &&
    totalShowerAvailabilityChecks > 0
  ) {
    insights.push({
      text: `Shower/bath availability at ${showerAvailabilityRate}% — while generally accessible, some periods of reduced availability suggest maintenance or supply issues that could affect children's daily routines and comfort.`,
      severity: "warning",
    });
  }

  if (
    meets(childSatisfactionRate, 50) &&
    below(childSatisfactionRate, 70) &&
    totalChildSatDen > 0
  ) {
    insights.push({
      text: `Child satisfaction at ${childSatisfactionRate}% — not all children are happy with bathroom facilities. Actively seeking and responding to children's feedback would help identify specific improvements that matter most to them.`,
      severity: "warning",
    });
  }

  if (
    meets(mouldRate, 15) &&
    below(mouldRate, 30) &&
    totalCleanlinessAudits > 0
  ) {
    insights.push({
      text: `Mould detected in ${mouldRate}% of bathroom audits — emerging mould suggests ventilation or moisture management issues that should be addressed before they worsen and affect children's health.`,
      severity: "warning",
    });
  }

  // Identify bathrooms with multiple issues
  const bathroomIssueMap: Record<string, number> = {};
  for (const a of cleanliness_audit_records) {
    if (a.overall_score < 4 || a.hazards_found || a.mould_detected) {
      bathroomIssueMap[a.bathroom_id] = (bathroomIssueMap[a.bathroom_id] ?? 0) + 1;
    }
  }
  for (const s of shower_availability_records) {
    if (!s.shower_functional || !s.hot_water_available) {
      bathroomIssueMap[s.bathroom_id] = (bathroomIssueMap[s.bathroom_id] ?? 0) + 1;
    }
  }
  for (const h of hot_water_records) {
    if (!h.within_safe_range || h.scalding_risk_identified) {
      bathroomIssueMap[h.bathroom_id] = (bathroomIssueMap[h.bathroom_id] ?? 0) + 1;
    }
  }
  const hotspotBathrooms = Object.entries(bathroomIssueMap)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1]);
  if (hotspotBathrooms.length > 0) {
    insights.push({
      text: `${hotspotBathrooms.length} bathroom${hotspotBathrooms.length !== 1 ? "s" : ""} identified with recurring issues across cleanliness, availability, and safety checks. These hotspot facilities require targeted intervention — a bathroom-by-bathroom improvement plan would address systemic problems rather than treating each issue in isolation.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (bathroom_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding bathroom and shower facilities management — bathrooms are clean, showers are reliably available, hot water is safely controlled, children's privacy is respected, and accessibility needs are met. This contributes positively to children's daily comfort, dignity, and safety.",
      severity: "positive",
    });
  }

  if (
    meets(hotWaterSafetyRate, 95) &&
    meets(tmvFittedRate, 95) &&
    scaldingIncidentCount === 0 &&
    totalHotWaterRecords > 0
  ) {
    insights.push({
      text: `${hotWaterSafetyRate}% hot water safety with ${tmvFittedRate}% TMV coverage and zero scalding incidents — the home demonstrates exemplary water temperature management that protects children from one of the most common preventable injuries in residential care.`,
      severity: "positive",
    });
  }

  if (
    meets(cleanlinessRate, 90) &&
    mouldRate === 0 &&
    meets(ventilationRate, 90) &&
    totalCleanlinessAudits > 0
  ) {
    insights.push({
      text: `${cleanlinessRate}% cleanliness with zero mould and ${ventilationRate}% adequate ventilation — bathrooms are maintained to an excellent standard that promotes children's health, comfort, and dignity. This evidences strong premises management under Reg 25.`,
      severity: "positive",
    });
  }

  if (
    meets(privacyRate, 90) &&
    meets(knockPolicyRate, 95) &&
    totalPrivacyRecords > 0
  ) {
    insights.push({
      text: `${privacyRate}% privacy compliance with ${knockPolicyRate}% knock-before-entry policy adherence — children's right to privacy and dignity in bathrooms is consistently upheld. Staff practice reflects genuine respect for children's personal boundaries.`,
      severity: "positive",
    });
  }

  if (
    meets(accessibilityRate, 90) &&
    meets(childIndependentRate, 90) &&
    totalAccessibilityRecords > 0
  ) {
    insights.push({
      text: `${accessibilityRate}% accessibility compliance with ${childIndependentRate}% of children able to use facilities independently — bathroom adaptations effectively support children's autonomy and dignity, demonstrating person-centred premises management.`,
      severity: "positive",
    });
  }

  if (
    meets(childSatisfactionRate, 90) &&
    totalChildSatDen > 0
  ) {
    insights.push({
      text: `${childSatisfactionRate}% child satisfaction across bathroom facilities — children are genuinely happy with the cleanliness, privacy, and accessibility of their bathroom facilities. This demonstrates that the home listens to and acts on children's views about their living environment.`,
      severity: "positive",
    });
  }

  if (
    meets(legionellaCheckedRate, 90) &&
    meets(legionellaPassedRate, 95) &&
    meets(waterQualityRate, 95) &&
    totalHotWaterRecords > 0
  ) {
    insights.push({
      text: "Comprehensive water safety management with consistent Legionella monitoring, high pass rates, and acceptable water quality — the home demonstrates robust compliance with statutory water safety requirements.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (bathroom_rating === "outstanding") {
    headline =
      "Outstanding bathroom and shower facilities — cleanliness is excellent, showers are reliably available, hot water is safely controlled, privacy is well-maintained, and accessibility needs are met.";
  } else if (bathroom_rating === "good") {
    headline = `Good bathroom and shower facilities — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (bathroom_rating === "adequate") {
    headline = `Adequate bathroom and shower facilities — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure safe, clean, private, and accessible facilities for all children.`;
  } else {
    headline = `Bathroom and shower facilities are inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's safety, hygiene, privacy, and dignity.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    bathroom_rating,
    bathroom_score: score,
    headline,
    total_cleanliness_audits: totalCleanlinessAudits,
    total_shower_availability_checks: totalShowerAvailabilityChecks,
    total_hot_water_records: totalHotWaterRecords,
    total_privacy_records: totalPrivacyRecords,
    total_accessibility_records: totalAccessibilityRecords,
    cleanliness_rate: cleanlinessRate,
    shower_availability_rate: showerAvailabilityRate,
    hot_water_safety_rate: hotWaterSafetyRate,
    privacy_rate: privacyRate,
    accessibility_rate: accessibilityRate,
    child_satisfaction_rate: childSatisfactionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
