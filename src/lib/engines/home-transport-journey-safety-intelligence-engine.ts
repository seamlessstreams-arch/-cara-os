// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME TRANSPORT & JOURNEY SAFETY INTELLIGENCE ENGINE
// Pure deterministic engine: transport logs, risk assessments, vehicle checks,
// driver compliance, incident tracking, and journey safety management.
// CHR 2015 Reg 25: "Premises: inc. transport arrangements."
// ══════════════════════════════════════════════════════════════════════════════

import { above, below, formatRate, meets, rate } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface TransportLogInput {
  id: string;
  driver_licence_checked: boolean;
  vehicle_checked: boolean;
  incident_during_journey: boolean;
  behaviour_during_journey: string; // "good"|"challenging"|"incident"|"n_a"
  has_risk_assessment: boolean;
}

export interface TransportRiskAssessmentInput {
  id: string;
  behaviour_risk_rating: string; // "Low"|"Medium"|"High"
  missing_risk_rating: string; // "Low"|"Medium"|"High"
  hazards_count: number;
  mitigations_count: number;
  signed_off_by_rm: boolean;
  in_use: boolean;
  needs_review: boolean; // derived: nextReviewDate < today
}

export interface VehicleCheckInput {
  id: string;
  defects_found_count: number;
  tyres_checked: boolean;
  seatbelts_ok: boolean;
  first_aid_kit_present: boolean;
  insurance_confirmed: boolean;
  mot_valid: boolean;
}

export interface TransportJourneySafetyInput {
  today: string;
  total_children: number;
  logs: TransportLogInput[];
  risk_assessments: TransportRiskAssessmentInput[];
  vehicle_checks: VehicleCheckInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type TransportSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface TransportJourneySafetyResult {
  transport_rating: TransportSafetyRating;
  transport_score: number;
  headline: string;
  total_journeys: number;
  /** null when the population is empty — nothing measured, not 0%. */
  driver_compliance_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  vehicle_check_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  incident_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  risk_assessment_coverage_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  defect_free_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: {
    rank: number;
    recommendation: string;
    urgency: "immediate" | "soon" | "planned";
    regulatory_ref: string;
  }[];
  insights: { text: string; severity: "critical" | "warning" | "positive" }[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): TransportSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Engine ──────────────────────────────────────────────────────────────────

export function computeTransportJourneySafety(
  input: TransportJourneySafetyInput,
): TransportJourneySafetyResult {
  const { logs, risk_assessments, vehicle_checks, total_children } = input;

  // Insufficient data guard
  if (total_children === 0) {
    return {
      transport_rating: "insufficient_data",
      transport_score: 0,
      headline: "No data available for transport safety analysis",
      total_journeys: 0,
      driver_compliance_rate: null,
      vehicle_check_rate: null,
      incident_rate: null,
      risk_assessment_coverage_rate: null,
      defect_free_rate: null,
      strengths: [],
      concerns: [],
      recommendations: [],
      insights: [],
    };
  }

  // ── Metrics ────────────────────────────────────────────────────────────
  const totalJourneys = logs.length;

  const driverCompliant = logs.filter(l => l.driver_licence_checked).length;
  const driverComplianceRate = rate(driverCompliant, totalJourneys);

  const vehicleChecked = logs.filter(l => l.vehicle_checked).length;
  const vehicleCheckRate = rate(vehicleChecked, totalJourneys);

  const incidents = logs.filter(l => l.incident_during_journey).length;
  const incidentRate = rate(incidents, totalJourneys);

  const withRA = logs.filter(l => l.has_risk_assessment).length;
  const raCoverageRate = rate(withRA, totalJourneys);

  const defectFree = vehicle_checks.filter(v => v.defects_found_count === 0).length;
  const defectFreeRate = rate(defectFree, vehicle_checks.length);

  // ── Scoring ────────────────────────────────────────────────────────────
  let score = 52;

  // Modifier 1: Driver compliance
  if (totalJourneys === 0) {
    score += 1;
  } else {
    if (meets(driverComplianceRate, 95)) score += 5;
    else if (meets(driverComplianceRate, 80)) score += 2;
    else score -= 5;
  }

  // Modifier 2: Vehicle pre-check compliance
  if (totalJourneys === 0) {
    // no adjustment
  } else {
    if (meets(vehicleCheckRate, 95)) score += 6;
    else if (meets(vehicleCheckRate, 80)) score += 2;
    else if (below(vehicleCheckRate, 60)) score -= 5;
  }

  // Modifier 3: Incident rate (lower is better)
  if (totalJourneys === 0) {
    score += 2;
  } else {
    if (incidentRate === 0) score += 5;
    else if ((incidentRate !== null && incidentRate <= 5)) score += 2;
    else if (above(incidentRate, 15)) score -= 5;
  }

  // Modifier 4: Risk assessment coverage
  if (totalJourneys === 0) {
    score -= 1;
  } else {
    if (meets(raCoverageRate, 95)) score += 5;
    else if (meets(raCoverageRate, 80)) score += 2;
    else if (below(raCoverageRate, 60)) score -= 4;
  }

  // Modifier 5: Vehicle defect-free rate
  if (vehicle_checks.length === 0) {
    score -= 2;
  } else {
    if (meets(defectFreeRate, 90)) score += 4;
    else if (meets(defectFreeRate, 70)) score += 1;
    else if (below(defectFreeRate, 50)) score -= 4;
  }

  // Modifier 6: Risk assessment quality (signed-off and in-use)
  const activeRAs = risk_assessments.filter(ra => ra.in_use);
  const signedOff = activeRAs.filter(ra => ra.signed_off_by_rm).length;
  const signedOffRate = rate(signedOff, activeRAs.length);
  const needingReview = risk_assessments.filter(ra => ra.needs_review).length;

  if (risk_assessments.length === 0) {
    score -= 2;
  } else {
    if (meets(signedOffRate, 90) && needingReview === 0) score += 5;
    else if (meets(signedOffRate, 70)) score += 2;
    else if (below(signedOffRate, 50)) score -= 5;
  }

  score = clamp(score, 0, 100);
  const rating = toRating(score);

  // ── Headline ───────────────────────────────────────────────────────────
  let headline: string;
  switch (rating) {
    case "outstanding":
      headline = "Transport safety is exemplary — comprehensive checks, risk assessments and zero incidents";
      break;
    case "good":
      headline = "Good transport safety practices with effective driver compliance and vehicle management";
      break;
    case "adequate":
      headline = "Transport safety is adequate but improvements needed in compliance and risk coverage";
      break;
    case "inadequate":
      headline = "Transport safety practices are inadequate — children may be at risk during journeys";
      break;
    default:
      headline = "No data available for transport safety analysis";
  }

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (meets(driverComplianceRate, 95) && totalJourneys > 0) strengths.push("Driver licence checks are completed for all journeys — ensuring legal compliance");
  if (meets(vehicleCheckRate, 95) && totalJourneys > 0) strengths.push("Vehicles are systematically checked before every journey");
  if (incidentRate === 0 && totalJourneys > 0) strengths.push("Zero journey incidents recorded — children travel safely");
  if (meets(raCoverageRate, 95) && totalJourneys > 0) strengths.push("All journeys have associated risk assessments in place");
  if (meets(defectFreeRate, 90) && vehicle_checks.length > 0) strengths.push("Vehicle fleet is maintained to a high standard with minimal defects");
  if (meets(signedOffRate, 90) && risk_assessments.length > 0 && needingReview === 0) strengths.push("Transport risk assessments are all signed off and up to date");

  // ── Concerns ───────────────────────────────────────────────────────────
  const concerns: string[] = [];
  if (below(driverComplianceRate, 80) && totalJourneys > 0) concerns.push(`Driver licence checks not completed for ${100 - driverComplianceRate!}% of journeys — legal risk`);
  if (below(vehicleCheckRate, 60) && totalJourneys > 0) concerns.push("Vehicles are not being checked before the majority of journeys");
  if (above(incidentRate, 15) && totalJourneys > 0) concerns.push(`High incident rate of ${formatRate(incidentRate)} during journeys — pattern requires investigation`);
  if (below(raCoverageRate, 60) && totalJourneys > 0) concerns.push("Most journeys lack an associated risk assessment");
  if (below(defectFreeRate, 50) && vehicle_checks.length > 0) concerns.push("Over half of vehicle checks identify defects — fleet maintenance needs urgent attention");
  if (risk_assessments.length === 0 && totalJourneys > 0) concerns.push("No transport risk assessments in place — children's journey safety is not evidenced");

  // ── Recommendations ────────────────────────────────────────────────────
  const recs: TransportJourneySafetyResult["recommendations"] = [];

  if (below(driverComplianceRate, 80) && totalJourneys > 0) {
    recs.push({ rank: 1, recommendation: "Implement mandatory driver licence verification before every journey", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (below(vehicleCheckRate, 80) && totalJourneys > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Ensure pre-use vehicle checks are completed and recorded for all journeys", urgency: "immediate", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (below(raCoverageRate, 80) && totalJourneys > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Develop transport risk assessments for all regular and ad-hoc journey routes", urgency: "soon", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (above(incidentRate, 10) && totalJourneys > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review journey incident patterns and implement targeted prevention measures", urgency: "soon", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (below(defectFreeRate, 70) && vehicle_checks.length > 0) {
    recs.push({ rank: recs.length + 1, recommendation: "Review vehicle maintenance schedule to address recurring defects", urgency: "planned", regulatory_ref: "CHR 2015 Reg 25" });
  }
  if (needingReview > 0) {
    recs.push({ rank: recs.length + 1, recommendation: `Review ${needingReview} transport risk assessment(s) that are overdue for review`, urgency: "soon", regulatory_ref: "CHR 2015 Reg 25" });
  }

  const cappedRecs = recs.slice(0, 5).map((r, i) => ({ ...r, rank: i + 1 }));

  // ── Insights ───────────────────────────────────────────────────────────
  const insights: TransportJourneySafetyResult["insights"] = [];

  if (meets(driverComplianceRate, 95) && meets(vehicleCheckRate, 95) && incidentRate === 0 && totalJourneys > 0) {
    insights.push({ text: "Transport governance is comprehensive — children's safety during journeys is fully evidenced", severity: "positive" });
  }
  if (below(driverComplianceRate, 80) && totalJourneys > 0) {
    insights.push({ text: "Unchecked drivers present a safeguarding and legal risk — this must be addressed urgently", severity: "critical" });
  }
  if (above(incidentRate, 15) && totalJourneys > 0) {
    insights.push({ text: "Elevated journey incident rate suggests route or behaviour factors need strategic review", severity: "warning" });
  }
  if (risk_assessments.length === 0 && totalJourneys > 0) {
    insights.push({ text: "No transport risk assessments means journey risks are unmanaged — regulators will flag this", severity: "critical" });
  }
  if (meets(defectFreeRate, 90) && vehicle_checks.length > 0) {
    insights.push({ text: "Well-maintained fleet with minimal defects — good evidence of vehicle management", severity: "positive" });
  }

  const cappedInsights = insights.slice(0, 3);

  return {
    transport_rating: rating,
    transport_score: score,
    headline,
    total_journeys: totalJourneys,
    driver_compliance_rate: driverComplianceRate,
    vehicle_check_rate: vehicleCheckRate,
    incident_rate: incidentRate,
    risk_assessment_coverage_rate: raCoverageRate,
    defect_free_rate: defectFreeRate,
    strengths,
    concerns,
    recommendations: cappedRecs,
    insights: cappedInsights,
  };
}
