// ==============================================================================
// CARA -- HOME NEIGHBOURHOOD SAFETY & RISK ASSESSMENT INTELLIGENCE ENGINE
// Measures neighbourhood risk assessments, local area safety mapping,
// environmental hazard identification, route safety reviews, and community
// safety partnerships for the children's home.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 25 (Premises -- suitability of location), Reg 5
// (Engagement with parents, police, and the wider community), SCCIF safety.
// Store keys: riskAssessmentRecords, safetyMappingRecords, hazardRecords,
//             routeSafetyRecords, communityPartnershipRecords
// ==============================================================================

import { above, below, meets } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface RiskAssessmentRecordInput {
  id: string;
  child_id: string;
  assessment_type: "initial" | "annual_review" | "triggered" | "placement_change" | "incident_driven" | "other";
  date: string;
  assessor: string;
  risk_level: "low" | "medium" | "high" | "critical";
  areas_covered: string[];
  local_crime_reviewed: boolean;
  antisocial_behaviour_reviewed: boolean;
  drug_activity_reviewed: boolean;
  exploitation_risk_reviewed: boolean;
  gang_activity_reviewed: boolean;
  traffic_risk_reviewed: boolean;
  environmental_risk_reviewed: boolean;
  mitigations_documented: boolean;
  mitigations_implemented: boolean;
  review_due_date: string | null;
  overdue: boolean;
  child_consulted: boolean;
  outcome_shared_with_child: boolean;
  approved_by_manager: boolean;
  notes: string;
  created_at: string;
}

export interface SafetyMappingRecordInput {
  id: string;
  area_name: string;
  date: string;
  mapping_type: "full_area" | "specific_zone" | "route" | "hotspot" | "seasonal" | "other";
  safe_zones_identified: number;
  risk_zones_identified: number;
  child_friendly_spaces: number;
  cctv_coverage_noted: boolean;
  lighting_assessed: boolean;
  lighting_adequate: boolean;
  public_transport_access: boolean;
  nearest_emergency_services_distance_km: number;
  child_involvement: boolean;
  staff_walked_area: boolean;
  last_updated: string;
  update_frequency_met: boolean;
  notes: string;
  created_at: string;
}

export interface HazardRecordInput {
  id: string;
  hazard_type: "environmental" | "structural" | "chemical" | "traffic" | "water" | "construction" | "derelict_building" | "fly_tipping" | "other";
  location_description: string;
  date_identified: string;
  severity: "low" | "medium" | "high" | "critical";
  reported_to_authority: boolean;
  authority_name: string;
  date_reported: string | null;
  mitigation_in_place: boolean;
  mitigation_description: string;
  children_informed: boolean;
  resolved: boolean;
  date_resolved: string | null;
  days_to_resolve: number;
  recurrent: boolean;
  notes: string;
  created_at: string;
}

export interface RouteSafetyRecordInput {
  id: string;
  child_id: string;
  route_name: string;
  route_type: "school" | "activity" | "contact" | "worship" | "healthcare" | "shopping" | "recreation" | "other";
  date_assessed: string;
  assessed_by: string;
  risk_level: "low" | "medium" | "high" | "critical";
  safe_crossing_points: boolean;
  adequate_lighting: boolean;
  cctv_present: boolean;
  traffic_risk_level: "low" | "medium" | "high";
  pedestrian_access: boolean;
  public_transport_available: boolean;
  known_hazards: string[];
  mitigations_in_place: boolean;
  alternative_route_available: boolean;
  child_walked_route: boolean;
  child_confident_on_route: boolean;
  review_due_date: string | null;
  overdue: boolean;
  notes: string;
  created_at: string;
}

export interface CommunityPartnershipRecordInput {
  id: string;
  partner_name: string;
  partner_type: "police" | "fire_service" | "local_authority" | "neighbourhood_watch" | "school" | "health" | "voluntary" | "youth_service" | "other";
  relationship_status: "active" | "developing" | "dormant" | "ended";
  date_established: string;
  last_contact_date: string;
  contact_frequency: "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually" | "ad_hoc";
  contact_frequency_met: boolean;
  information_sharing_agreement: boolean;
  joint_risk_assessments: boolean;
  safeguarding_protocols_agreed: boolean;
  partnership_effectiveness: number; // 1-5
  children_benefit_documented: boolean;
  key_contact_named: boolean;
  notes: string;
  created_at: string;
}

export interface NeighbourhoodSafetyRiskAssessmentInput {
  today: string;
  total_children: number;
  risk_assessment_records: RiskAssessmentRecordInput[];
  safety_mapping_records: SafetyMappingRecordInput[];
  hazard_records: HazardRecordInput[];
  route_safety_records: RouteSafetyRecordInput[];
  community_partnership_records: CommunityPartnershipRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type NeighbourhoodSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface NeighbourhoodSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface NeighbourhoodSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface NeighbourhoodSafetyRiskAssessmentResult {
  neighbourhood_rating: NeighbourhoodSafetyRating;
  neighbourhood_score: number;
  headline: string;
  // child_awareness_rate uses pct() over a manual multi-source denominator
  // (deterministic 0 on empty). The five composite rates below are null on
  // empty: no records ⇒ no signal. "0% risk assessment / 0% hazard resolution
  // / 0% route safety" would read as a home actively ignoring neighbourhood
  // risk, not "unmeasured". Fab-0 doctrine.
  risk_assessment_rate: number | null;
  safety_mapping_rate: number | null;
  hazard_identification_rate: number | null;
  route_safety_rate: number | null;
  community_partnership_rate: number | null;
  child_awareness_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: NeighbourhoodSafetyRecommendation[];
  insights: NeighbourhoodSafetyInsight[];
}

// -- Helpers ------------------------------------------------------------------

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): NeighbourhoodSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.floor((db.getTime() - da.getTime()) / 86_400_000);
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: NeighbourhoodSafetyRating,
  score: number,
  headline: string,
): NeighbourhoodSafetyRiskAssessmentResult {
  return {
    neighbourhood_rating: rating,
    neighbourhood_score: score,
    headline,
    risk_assessment_rate: null,
    safety_mapping_rate: null,
    hazard_identification_rate: null,
    route_safety_rate: null,
    community_partnership_rate: null,
    child_awareness_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeNeighbourhoodSafetyRiskAssessment(
  input: NeighbourhoodSafetyRiskAssessmentInput,
): NeighbourhoodSafetyRiskAssessmentResult {
  const {
    today,
    total_children,
    risk_assessment_records,
    safety_mapping_records,
    hazard_records,
    route_safety_records,
    community_partnership_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data --------------
  const allEmpty =
    risk_assessment_records.length === 0 &&
    safety_mapping_records.length === 0 &&
    hazard_records.length === 0 &&
    route_safety_records.length === 0 &&
    community_partnership_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess neighbourhood safety and risk.",
    );
  }

  // -- Special case: all empty + children > 0 -> inadequate -------------------
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No neighbourhood safety or risk assessment data recorded despite children on placement -- risk assessments, safety mapping, hazard identification, route reviews, and community partnerships require urgent attention.",
      ),
      concerns: [
        "No risk assessment, safety mapping, hazard identification, route safety, or community partnership records exist despite children being on placement -- the home cannot evidence that the neighbourhood is safe or that risks are identified and mitigated.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement comprehensive neighbourhood risk assessments covering local crime, antisocial behaviour, drug activity, exploitation, gang activity, traffic, and environmental hazards to evidence that the home's location is suitable and risks are managed.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
        },
        {
          rank: 2,
          recommendation:
            "Establish community safety partnerships with local police, fire service, neighbourhood watch, and other relevant agencies to support proactive risk management and information sharing.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
        },
      ],
      insights: [
        {
          text: "The complete absence of neighbourhood safety and risk assessment records means Ofsted cannot verify that the home's location is suitable or that environmental risks to children are identified, assessed, and mitigated. This represents a fundamental gap in Reg 25 compliance and the home's duty to safeguard children.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics ---------------------------------------------------

  // --- Risk assessment completeness and quality ---
  const totalRiskAssessments = risk_assessment_records.length;
  const mitigationsDocumented = risk_assessment_records.filter(
    (r) => r.mitigations_documented,
  ).length;
  const mitigationsImplemented = risk_assessment_records.filter(
    (r) => r.mitigations_implemented,
  ).length;
  const mitigationDocRate = pct(mitigationsDocumented, totalRiskAssessments);
  const mitigationImplRate = pct(mitigationsImplemented, totalRiskAssessments);

  const crimeReviewed = risk_assessment_records.filter(
    (r) => r.local_crime_reviewed,
  ).length;
  const crimeReviewRate = pct(crimeReviewed, totalRiskAssessments);

  const exploitationReviewed = risk_assessment_records.filter(
    (r) => r.exploitation_risk_reviewed,
  ).length;
  const exploitationReviewRate = pct(exploitationReviewed, totalRiskAssessments);

  const gangReviewed = risk_assessment_records.filter(
    (r) => r.gang_activity_reviewed,
  ).length;
  const gangReviewRate = pct(gangReviewed, totalRiskAssessments);

  const asbReviewed = risk_assessment_records.filter(
    (r) => r.antisocial_behaviour_reviewed,
  ).length;
  const asbReviewRate = pct(asbReviewed, totalRiskAssessments);

  const drugReviewed = risk_assessment_records.filter(
    (r) => r.drug_activity_reviewed,
  ).length;
  const drugReviewRate = pct(drugReviewed, totalRiskAssessments);

  const trafficReviewed = risk_assessment_records.filter(
    (r) => r.traffic_risk_reviewed,
  ).length;
  const trafficReviewRate = pct(trafficReviewed, totalRiskAssessments);

  const environmentalReviewed = risk_assessment_records.filter(
    (r) => r.environmental_risk_reviewed,
  ).length;
  const environmentalReviewRate = pct(environmentalReviewed, totalRiskAssessments);

  const managerApproved = risk_assessment_records.filter(
    (r) => r.approved_by_manager,
  ).length;
  const managerApprovalRate = pct(managerApproved, totalRiskAssessments);

  const overdueRiskAssessments = risk_assessment_records.filter(
    (r) => r.overdue,
  ).length;
  const overdueRiskRate = pct(overdueRiskAssessments, totalRiskAssessments);

  const childConsulted = risk_assessment_records.filter(
    (r) => r.child_consulted,
  ).length;
  const childConsultedRate = pct(childConsulted, totalRiskAssessments);

  const outcomeShared = risk_assessment_records.filter(
    (r) => r.outcome_shared_with_child,
  ).length;
  const outcomeSharedRate = pct(outcomeShared, totalRiskAssessments);

  const highCriticalAssessments = risk_assessment_records.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical",
  ).length;
  const highCriticalRate = pct(highCriticalAssessments, totalRiskAssessments);

  // Comprehensive coverage: all 7 areas reviewed
  const comprehensiveAssessments = risk_assessment_records.filter(
    (r) =>
      r.local_crime_reviewed &&
      r.antisocial_behaviour_reviewed &&
      r.drug_activity_reviewed &&
      r.exploitation_risk_reviewed &&
      r.gang_activity_reviewed &&
      r.traffic_risk_reviewed &&
      r.environmental_risk_reviewed,
  ).length;
  const comprehensiveCoverageRate = pct(comprehensiveAssessments, totalRiskAssessments);

  // Risk assessment composite rate
  const riskAssessmentRate: number | null =
    totalRiskAssessments > 0
      ? Math.round(
          (mitigationDocRate + mitigationImplRate + comprehensiveCoverageRate + managerApprovalRate) / 4,
        )
      : null;

  // --- Safety mapping coverage ---
  const totalMappings = safety_mapping_records.length;
  const staffWalked = safety_mapping_records.filter(
    (r) => r.staff_walked_area,
  ).length;
  const staffWalkedRate = pct(staffWalked, totalMappings);

  const lightingAssessed = safety_mapping_records.filter(
    (r) => r.lighting_assessed,
  ).length;
  const lightingAssessedRate = pct(lightingAssessed, totalMappings);

  const lightingAdequate = safety_mapping_records.filter(
    (r) => r.lighting_adequate,
  ).length;
  const lightingAdequateRate = pct(lightingAdequate, totalMappings);

  const cctvNoted = safety_mapping_records.filter(
    (r) => r.cctv_coverage_noted,
  ).length;
  const cctvRate = pct(cctvNoted, totalMappings);

  const updateFrequencyMet = safety_mapping_records.filter(
    (r) => r.update_frequency_met,
  ).length;
  const updateFrequencyRate = pct(updateFrequencyMet, totalMappings);

  const childInvolvedMapping = safety_mapping_records.filter(
    (r) => r.child_involvement,
  ).length;
  const childMappingInvolvementRate = pct(childInvolvedMapping, totalMappings);

  const totalSafeZones = safety_mapping_records.reduce(
    (sum, r) => sum + r.safe_zones_identified, 0,
  );
  const totalRiskZones = safety_mapping_records.reduce(
    (sum, r) => sum + r.risk_zones_identified, 0,
  );
  const totalChildFriendlySpaces = safety_mapping_records.reduce(
    (sum, r) => sum + r.child_friendly_spaces, 0,
  );

  // Safety mapping composite rate
  const safetyMappingRate: number | null =
    totalMappings > 0
      ? Math.round(
          (staffWalkedRate + lightingAssessedRate + updateFrequencyRate + cctvRate) / 4,
        )
      : null;

  // --- Hazard identification and resolution ---
  const totalHazards = hazard_records.length;
  const reportedHazards = hazard_records.filter(
    (r) => r.reported_to_authority,
  ).length;
  const hazardReportingRate = pct(reportedHazards, totalHazards);

  const mitigatedHazards = hazard_records.filter(
    (r) => r.mitigation_in_place,
  ).length;
  const hazardMitigationRate = pct(mitigatedHazards, totalHazards);

  const resolvedHazards = hazard_records.filter(
    (r) => r.resolved,
  ).length;
  const hazardResolutionRate = pct(resolvedHazards, totalHazards);

  const childrenInformedHazards = hazard_records.filter(
    (r) => r.children_informed,
  ).length;
  const childrenInformedHazardRate = pct(childrenInformedHazards, totalHazards);

  const highCriticalHazards = hazard_records.filter(
    (r) => r.severity === "high" || r.severity === "critical",
  ).length;
  const highCriticalHazardRate = pct(highCriticalHazards, totalHazards);

  const unresolvedHighCritical = hazard_records.filter(
    (r) => (r.severity === "high" || r.severity === "critical") && !r.resolved,
  ).length;

  const recurrentHazards = hazard_records.filter(
    (r) => r.recurrent,
  ).length;
  const recurrentHazardRate = pct(recurrentHazards, totalHazards);

  const avgDaysToResolve: number | null =
    resolvedHazards > 0
      ? Math.round(
          hazard_records
            .filter((r) => r.resolved)
            .reduce((sum, r) => sum + r.days_to_resolve, 0) / resolvedHazards,
        )
      : null;

  // Hazard identification composite rate
  const hazardIdentificationRate: number | null =
    totalHazards > 0
      ? Math.round(
          (hazardReportingRate + hazardMitigationRate + hazardResolutionRate) / 3,
        )
      : null;

  // --- Route safety assessment ---
  const totalRoutes = route_safety_records.length;
  const routeMitigated = route_safety_records.filter(
    (r) => r.mitigations_in_place,
  ).length;
  const routeMitigationRate = pct(routeMitigated, totalRoutes);

  const routeChildWalked = route_safety_records.filter(
    (r) => r.child_walked_route,
  ).length;
  const routeChildWalkedRate = pct(routeChildWalked, totalRoutes);

  const routeChildConfident = route_safety_records.filter(
    (r) => r.child_confident_on_route,
  ).length;
  const routeChildConfidentRate = pct(routeChildConfident, totalRoutes);

  const routeSafeCrossings = route_safety_records.filter(
    (r) => r.safe_crossing_points,
  ).length;
  const safeCrossingRate = pct(routeSafeCrossings, totalRoutes);

  const routeAdequateLighting = route_safety_records.filter(
    (r) => r.adequate_lighting,
  ).length;
  const routeLightingRate = pct(routeAdequateLighting, totalRoutes);

  const routePedestrian = route_safety_records.filter(
    (r) => r.pedestrian_access,
  ).length;
  const routePedestrianRate = pct(routePedestrian, totalRoutes);

  const routeAlternative = route_safety_records.filter(
    (r) => r.alternative_route_available,
  ).length;
  const alternativeRouteRate = pct(routeAlternative, totalRoutes);

  const overdueRoutes = route_safety_records.filter(
    (r) => r.overdue,
  ).length;
  const overdueRouteRate = pct(overdueRoutes, totalRoutes);

  const highCriticalRoutes = route_safety_records.filter(
    (r) => r.risk_level === "high" || r.risk_level === "critical",
  ).length;
  const highCriticalRouteRate = pct(highCriticalRoutes, totalRoutes);

  const highTrafficRoutes = route_safety_records.filter(
    (r) => r.traffic_risk_level === "high",
  ).length;
  const highTrafficRate = pct(highTrafficRoutes, totalRoutes);

  // Route safety composite rate
  const routeSafetyRate: number | null =
    totalRoutes > 0
      ? Math.round(
          (routeMitigationRate + routeChildWalkedRate + safeCrossingRate + routeLightingRate) / 4,
        )
      : null;

  // --- Community partnership effectiveness ---
  const totalPartnerships = community_partnership_records.length;
  const activePartnerships = community_partnership_records.filter(
    (r) => r.relationship_status === "active",
  ).length;
  const activePartnershipRate = pct(activePartnerships, totalPartnerships);

  const frequencyMet = community_partnership_records.filter(
    (r) => r.contact_frequency_met,
  ).length;
  const contactFrequencyRate = pct(frequencyMet, totalPartnerships);

  const infoSharingAgreed = community_partnership_records.filter(
    (r) => r.information_sharing_agreement,
  ).length;
  const infoSharingRate = pct(infoSharingAgreed, totalPartnerships);

  const jointRiskAssessments = community_partnership_records.filter(
    (r) => r.joint_risk_assessments,
  ).length;
  const jointRiskRate = pct(jointRiskAssessments, totalPartnerships);

  const safeguardingProtocols = community_partnership_records.filter(
    (r) => r.safeguarding_protocols_agreed,
  ).length;
  const safeguardingProtocolRate = pct(safeguardingProtocols, totalPartnerships);

  const childBenefitDocumented = community_partnership_records.filter(
    (r) => r.children_benefit_documented,
  ).length;
  const childBenefitRate = pct(childBenefitDocumented, totalPartnerships);

  const keyContactNamed = community_partnership_records.filter(
    (r) => r.key_contact_named,
  ).length;
  const keyContactRate = pct(keyContactNamed, totalPartnerships);

  const effectivenessSum = community_partnership_records.reduce(
    (sum, r) => sum + r.partnership_effectiveness, 0,
  );
  const effectivenessAvg: number | null =
    totalPartnerships > 0
      ? Math.round((effectivenessSum / totalPartnerships) * 100) / 100
      : null;

  const policePartnership = community_partnership_records.filter(
    (r) => r.partner_type === "police" && r.relationship_status === "active",
  ).length;

  const dormantPartnerships = community_partnership_records.filter(
    (r) => r.relationship_status === "dormant",
  ).length;
  const dormantPartnershipRate = pct(dormantPartnerships, totalPartnerships);

  // Community partnership composite rate
  const communityPartnershipRate: number | null =
    totalPartnerships > 0
      ? Math.round(
          (activePartnershipRate + contactFrequencyRate + infoSharingRate + safeguardingProtocolRate) / 4,
        )
      : null;

  // --- Child awareness composite ---
  const childAwarenessDenominator =
    totalRiskAssessments + totalHazards + totalRoutes + totalMappings;
  const childAwarenessNumerator =
    childConsulted +
    childrenInformedHazards +
    routeChildWalked +
    childInvolvedMapping;
  const childAwarenessRate = pct(childAwarenessNumerator, childAwarenessDenominator);

  // -- Scoring: base 52 ------------------------------------------------------

  let score = 52;

  // --- Bonus 1: riskAssessmentRate (>=90: +5, >=70: +3) ---
  if (meets(riskAssessmentRate, 90)) score += 5;
  else if (meets(riskAssessmentRate, 70)) score += 3;

  // --- Bonus 2: safetyMappingRate (>=90: +5, >=70: +2) ---
  if (meets(safetyMappingRate, 90)) score += 5;
  else if (meets(safetyMappingRate, 70)) score += 2;

  // --- Bonus 3: hazardIdentificationRate (>=90: +4, >=70: +2) ---
  if (meets(hazardIdentificationRate, 90)) score += 4;
  else if (meets(hazardIdentificationRate, 70)) score += 2;

  // --- Bonus 4: routeSafetyRate (>=90: +4, >=70: +2) ---
  if (meets(routeSafetyRate, 90)) score += 4;
  else if (meets(routeSafetyRate, 70)) score += 2;

  // --- Bonus 5: communityPartnershipRate (>=90: +5, >=70: +2) ---
  if (meets(communityPartnershipRate, 90)) score += 5;
  else if (meets(communityPartnershipRate, 70)) score += 2;

  // --- Bonus 6: childAwarenessRate (>=80: +3, >=60: +1) ---
  if (childAwarenessRate >= 80) score += 3;
  else if (childAwarenessRate >= 60) score += 1;

  // --- Bonus 7: comprehensiveCoverageRate (>=90: +2) ---
  if (comprehensiveCoverageRate >= 90 && totalRiskAssessments > 0) score += 2;

  // -- Penalties (4 with guards) ----------------------------------------------

  // below(riskAssessmentRate, 50) -> -6
  if (below(riskAssessmentRate, 50) && totalRiskAssessments > 0) score -= 6;

  // below(hazardIdentificationRate, 40) -> -5
  if (below(hazardIdentificationRate, 40) && totalHazards > 0) score -= 5;

  // below(routeSafetyRate, 50) -> -4
  if (below(routeSafetyRate, 50) && totalRoutes > 0) score -= 4;

  // below(communityPartnershipRate, 40) -> -5
  if (below(communityPartnershipRate, 40) && totalPartnerships > 0) score -= 5;

  score = clamp(score, 0, 100);

  const neighbourhood_rating = toRating(score);

  // -- Strengths --------------------------------------------------------------

  const strengths: string[] = [];

  if (meets(riskAssessmentRate, 90) && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% risk assessment completeness rate -- the home demonstrates comprehensive and thorough neighbourhood risk assessment with documented mitigations, full area coverage, and manager approval.`,
    );
  } else if (meets(riskAssessmentRate, 70) && totalRiskAssessments > 0) {
    strengths.push(
      `${riskAssessmentRate}% risk assessment completeness -- good practice in assessing neighbourhood risks with documented mitigations and management oversight.`,
    );
  }

  if (comprehensiveCoverageRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${comprehensiveCoverageRate}% of risk assessments cover all seven key areas (crime, ASB, drugs, exploitation, gangs, traffic, environment) -- assessments are thorough and leave no area unexamined.`,
    );
  } else if (comprehensiveCoverageRate >= 70 && totalRiskAssessments > 0) {
    strengths.push(
      `${comprehensiveCoverageRate}% of risk assessments cover all seven key areas -- most assessments demonstrate comprehensive area coverage.`,
    );
  }

  if (mitigationImplRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${mitigationImplRate}% of identified risk mitigations have been implemented -- the home moves decisively from risk identification to protective action.`,
    );
  }

  if (managerApprovalRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `${managerApprovalRate}% of risk assessments are manager-approved -- strong management oversight ensures quality and accountability in risk assessment.`,
    );
  }

  if (exploitationReviewRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `Exploitation risk reviewed in ${exploitationReviewRate}% of assessments -- the home is proactive in identifying and mitigating exploitation threats in the local area.`,
    );
  }

  if (meets(safetyMappingRate, 90) && totalMappings > 0) {
    strengths.push(
      `${safetyMappingRate}% safety mapping completeness -- the home maintains a thorough and up-to-date understanding of the local area's safety landscape.`,
    );
  } else if (meets(safetyMappingRate, 70) && totalMappings > 0) {
    strengths.push(
      `${safetyMappingRate}% safety mapping completeness -- good local area knowledge with staff-walked assessments, lighting checks, and CCTV coverage noted.`,
    );
  }

  if (staffWalkedRate >= 90 && totalMappings > 0) {
    strengths.push(
      `Staff have physically walked ${staffWalkedRate}% of mapped areas -- first-hand knowledge of the neighbourhood ensures assessments reflect ground-level reality.`,
    );
  }

  if (totalChildFriendlySpaces >= 5 && totalMappings > 0) {
    strengths.push(
      `${totalChildFriendlySpaces} child-friendly spaces identified across mapped areas -- children have access to safe recreational spaces in the neighbourhood.`,
    );
  }

  if (lightingAdequateRate >= 90 && totalMappings > 0) {
    strengths.push(
      `Lighting assessed as adequate in ${lightingAdequateRate}% of mapped areas -- the local environment supports safe movement after dark.`,
    );
  }

  if (meets(hazardIdentificationRate, 90) && totalHazards > 0) {
    strengths.push(
      `${hazardIdentificationRate}% hazard management rate -- hazards are reported, mitigated, and resolved effectively, demonstrating robust environmental hazard management.`,
    );
  } else if (meets(hazardIdentificationRate, 70) && totalHazards > 0) {
    strengths.push(
      `${hazardIdentificationRate}% hazard management rate -- most identified hazards are reported, mitigated, and resolved.`,
    );
  }

  if (hazardResolutionRate >= 90 && totalHazards > 0) {
    strengths.push(
      `${hazardResolutionRate}% of identified hazards resolved -- the home drives hazards through to full resolution, not just temporary mitigation.`,
    );
  }

  if (avgDaysToResolve! <= 7 && resolvedHazards > 0) {
    strengths.push(
      `Average hazard resolution time of ${avgDaysToResolve} days -- the home responds rapidly to environmental hazards, minimising children's exposure to risk.`,
    );
  }

  if (childrenInformedHazardRate >= 90 && totalHazards > 0) {
    strengths.push(
      `Children informed about ${childrenInformedHazardRate}% of identified hazards -- children are empowered to recognise and avoid environmental dangers.`,
    );
  }

  if (meets(routeSafetyRate, 90) && totalRoutes > 0) {
    strengths.push(
      `${routeSafetyRate}% route safety completeness -- routes are assessed with mitigations in place, safe crossings confirmed, adequate lighting verified, and children walked through key routes.`,
    );
  } else if (meets(routeSafetyRate, 70) && totalRoutes > 0) {
    strengths.push(
      `${routeSafetyRate}% route safety completeness -- good practice in assessing and securing children's regular routes.`,
    );
  }

  if (routeChildConfidentRate >= 80 && totalRoutes > 0) {
    strengths.push(
      `${routeChildConfidentRate}% of children report confidence on their assessed routes -- children feel safe navigating their neighbourhood independently.`,
    );
  }

  if (safeCrossingRate >= 90 && totalRoutes > 0) {
    strengths.push(
      `Safe crossing points confirmed on ${safeCrossingRate}% of assessed routes -- pedestrian safety is a clear priority in route planning.`,
    );
  }

  if (alternativeRouteRate >= 70 && totalRoutes > 0) {
    strengths.push(
      `Alternative routes available for ${alternativeRouteRate}% of assessed routes -- contingency planning ensures children always have a safe option.`,
    );
  }

  if (meets(communityPartnershipRate, 90) && totalPartnerships > 0) {
    strengths.push(
      `${communityPartnershipRate}% community partnership effectiveness -- the home maintains active, well-structured partnerships with information sharing, agreed safeguarding protocols, and regular contact.`,
    );
  } else if (meets(communityPartnershipRate, 70) && totalPartnerships > 0) {
    strengths.push(
      `${communityPartnershipRate}% community partnership effectiveness -- good engagement with community safety partners supports proactive risk management.`,
    );
  }

  if (policePartnership > 0) {
    strengths.push(
      `Active police partnership in place -- the home engages with local policing to share intelligence and manage neighbourhood safety risks collaboratively.`,
    );
  }

  if (infoSharingRate >= 90 && totalPartnerships > 0) {
    strengths.push(
      `Information sharing agreements in place with ${infoSharingRate}% of partners -- the home can access and share safety-critical intelligence effectively.`,
    );
  }

  if (safeguardingProtocolRate >= 90 && totalPartnerships > 0) {
    strengths.push(
      `Safeguarding protocols agreed with ${safeguardingProtocolRate}% of partners -- clear safeguarding expectations underpin all community safety partnerships.`,
    );
  }

  if (jointRiskRate >= 70 && totalPartnerships > 0) {
    strengths.push(
      `Joint risk assessments conducted with ${jointRiskRate}% of partners -- collaborative risk assessment strengthens the home's understanding of neighbourhood threats.`,
    );
  }

  if (meets(effectivenessAvg, 4.0) && totalPartnerships > 0) {
    strengths.push(
      `Community partnership effectiveness averages ${effectivenessAvg}/5 -- partners are rated as highly effective in supporting children's safety.`,
    );
  }

  if (childAwarenessRate >= 80 && childAwarenessDenominator > 0) {
    strengths.push(
      `Child awareness and involvement at ${childAwarenessRate}% -- children are consulted on risk assessments, informed about hazards, walked through routes, and involved in safety mapping. Their voice genuinely shapes safety planning.`,
    );
  } else if (childAwarenessRate >= 60 && childAwarenessDenominator > 0) {
    strengths.push(
      `Child awareness and involvement at ${childAwarenessRate}% -- children are regularly included in neighbourhood safety processes.`,
    );
  }

  if (childConsultedRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `Children consulted in ${childConsultedRate}% of risk assessments -- children's lived experience of the neighbourhood directly informs risk management decisions.`,
    );
  }

  if (outcomeSharedRate >= 90 && totalRiskAssessments > 0) {
    strengths.push(
      `Risk assessment outcomes shared with children in ${outcomeSharedRate}% of cases -- children understand the safety measures in place for their protection.`,
    );
  }

  // -- Concerns ---------------------------------------------------------------

  const concerns: string[] = [];

  if (below(riskAssessmentRate, 50) && totalRiskAssessments > 0) {
    concerns.push(
      `Risk assessment completeness at only ${riskAssessmentRate}% -- assessments lack documented mitigations, comprehensive area coverage, or manager approval, leaving significant gaps in evidencing that neighbourhood risks are managed.`,
    );
  } else if (below(riskAssessmentRate, 70) && meets(riskAssessmentRate, 50) && totalRiskAssessments > 0) {
    concerns.push(
      `Risk assessment completeness at ${riskAssessmentRate}% -- some assessments lack full area coverage, documented mitigations, or management sign-off.`,
    );
  }

  if (comprehensiveCoverageRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Only ${comprehensiveCoverageRate}% of risk assessments cover all seven key areas -- incomplete assessments leave blind spots in the home's understanding of neighbourhood threats.`,
    );
  }

  if (overdueRiskRate >= 20 && totalRiskAssessments > 0) {
    concerns.push(
      `${overdueRiskRate}% of risk assessments are overdue for review -- outdated assessments may not reflect current neighbourhood risks and could leave children exposed to unidentified threats.`,
    );
  }

  if (exploitationReviewRate < 70 && totalRiskAssessments > 0) {
    concerns.push(
      `Exploitation risk reviewed in only ${exploitationReviewRate}% of assessments -- failure to consistently assess exploitation risk is a serious safeguarding gap given the vulnerability of looked-after children.`,
    );
  }

  if (gangReviewRate < 70 && totalRiskAssessments > 0) {
    concerns.push(
      `Gang activity reviewed in only ${gangReviewRate}% of assessments -- gang presence is a critical risk factor for children in care that must be systematically assessed.`,
    );
  }

  if (mitigationImplRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Only ${mitigationImplRate}% of identified mitigations have been implemented -- risk assessments are identifying threats but the home is not acting on its own recommendations.`,
    );
  }

  if (highCriticalRate >= 40 && totalRiskAssessments > 0) {
    concerns.push(
      `${highCriticalRate}% of risk assessments identify high or critical risk levels -- the neighbourhood presents significant safety challenges requiring robust and sustained mitigation.`,
    );
  }

  if (below(safetyMappingRate, 50) && totalMappings > 0) {
    concerns.push(
      `Safety mapping completeness at only ${safetyMappingRate}% -- the home's understanding of the local area's safety landscape is insufficient to protect children effectively.`,
    );
  } else if (below(safetyMappingRate, 70) && meets(safetyMappingRate, 50) && totalMappings > 0) {
    concerns.push(
      `Safety mapping completeness at ${safetyMappingRate}% -- staff area walks, lighting assessments, and update schedules need strengthening.`,
    );
  }

  if (staffWalkedRate < 50 && totalMappings > 0) {
    concerns.push(
      `Staff have only walked ${staffWalkedRate}% of mapped areas -- desk-based mapping alone cannot provide the ground-level insight needed to keep children safe.`,
    );
  }

  if (lightingAdequateRate < 50 && totalMappings > 0) {
    concerns.push(
      `Lighting assessed as adequate in only ${lightingAdequateRate}% of mapped areas -- poor lighting increases children's vulnerability, particularly during darker months.`,
    );
  }

  if (updateFrequencyRate < 50 && totalMappings > 0) {
    concerns.push(
      `Safety mapping update frequency met in only ${updateFrequencyRate}% of areas -- outdated maps cannot reflect changes in the local environment.`,
    );
  }

  if (below(hazardIdentificationRate, 40) && totalHazards > 0) {
    concerns.push(
      `Hazard management rate at only ${hazardIdentificationRate}% -- hazards are being identified but not consistently reported, mitigated, or resolved, leaving children exposed to avoidable environmental risks.`,
    );
  } else if (below(hazardIdentificationRate, 70) && meets(hazardIdentificationRate, 40) && totalHazards > 0) {
    concerns.push(
      `Hazard management rate at ${hazardIdentificationRate}% -- reporting, mitigation, and resolution need improvement to ensure all hazards are addressed promptly.`,
    );
  }

  if (unresolvedHighCritical > 0) {
    concerns.push(
      `${unresolvedHighCritical} high or critical severity hazard${unresolvedHighCritical !== 1 ? "s" : ""} remain${unresolvedHighCritical === 1 ? "s" : ""} unresolved -- children are currently exposed to serious environmental risks that require urgent action.`,
    );
  }

  if (recurrentHazardRate >= 30 && totalHazards > 0) {
    concerns.push(
      `${recurrentHazardRate}% of hazards are recurrent -- the same hazards keep reappearing, suggesting root causes are not being addressed.`,
    );
  }

  if (meets(avgDaysToResolve, 30) && resolvedHazards > 0) {
    concerns.push(
      `Average hazard resolution time of ${avgDaysToResolve} days -- prolonged exposure to identified hazards increases risk to children.`,
    );
  }

  if (hazardReportingRate < 50 && totalHazards > 0) {
    concerns.push(
      `Only ${hazardReportingRate}% of hazards reported to relevant authorities -- under-reporting means hazards may persist longer than necessary.`,
    );
  }

  if (below(routeSafetyRate, 50) && totalRoutes > 0) {
    concerns.push(
      `Route safety completeness at only ${routeSafetyRate}% -- children's regular routes lack adequate mitigations, safe crossing confirmation, lighting checks, or child familiarisation.`,
    );
  } else if (below(routeSafetyRate, 70) && meets(routeSafetyRate, 50) && totalRoutes > 0) {
    concerns.push(
      `Route safety completeness at ${routeSafetyRate}% -- some routes need further assessment for crossings, lighting, and child familiarisation.`,
    );
  }

  if (highCriticalRouteRate >= 30 && totalRoutes > 0) {
    concerns.push(
      `${highCriticalRouteRate}% of assessed routes are rated high or critical risk -- children are regularly using routes with significant safety concerns.`,
    );
  }

  if (overdueRouteRate >= 20 && totalRoutes > 0) {
    concerns.push(
      `${overdueRouteRate}% of route safety assessments are overdue for review -- changing conditions may have altered route safety since last assessment.`,
    );
  }

  if (routeChildConfidentRate < 50 && totalRoutes > 0) {
    concerns.push(
      `Only ${routeChildConfidentRate}% of children report confidence on their assessed routes -- children feel unsafe navigating their neighbourhood, which may restrict their independence and wellbeing.`,
    );
  }

  if (highTrafficRate >= 40 && totalRoutes > 0) {
    concerns.push(
      `${highTrafficRate}% of assessed routes have high traffic risk -- children face significant road safety hazards on their regular journeys.`,
    );
  }

  if (below(communityPartnershipRate, 40) && totalPartnerships > 0) {
    concerns.push(
      `Community partnership effectiveness at only ${communityPartnershipRate}% -- partnerships lack active engagement, regular contact, information sharing, or agreed safeguarding protocols, undermining collaborative safety management.`,
    );
  } else if (below(communityPartnershipRate, 70) && meets(communityPartnershipRate, 40) && totalPartnerships > 0) {
    concerns.push(
      `Community partnership effectiveness at ${communityPartnershipRate}% -- some partnerships need strengthening in contact frequency, information sharing, or safeguarding protocols.`,
    );
  }

  if (policePartnership === 0 && totalPartnerships > 0) {
    concerns.push(
      "No active police partnership in place -- the home cannot access local crime intelligence or coordinate safeguarding responses with law enforcement.",
    );
  }

  if (dormantPartnershipRate >= 30 && totalPartnerships > 0) {
    concerns.push(
      `${dormantPartnershipRate}% of community partnerships are dormant -- inactive relationships reduce the home's safety network and intelligence-gathering capability.`,
    );
  }

  if (below(effectivenessAvg, 3.0) && totalPartnerships > 0) {
    concerns.push(
      `Community partnership effectiveness averages only ${effectivenessAvg}/5 -- partners are not delivering meaningful safety benefits for children.`,
    );
  }

  if (childAwarenessRate < 50 && childAwarenessDenominator > 0) {
    concerns.push(
      `Child awareness and involvement at only ${childAwarenessRate}% -- children are not being sufficiently consulted, informed, or included in neighbourhood safety planning.`,
    );
  } else if (childAwarenessRate < 60 && childAwarenessRate >= 50 && childAwarenessDenominator > 0) {
    concerns.push(
      `Child awareness at ${childAwarenessRate}% -- children's involvement in neighbourhood safety processes needs strengthening.`,
    );
  }

  if (childConsultedRate < 50 && totalRiskAssessments > 0) {
    concerns.push(
      `Children consulted in only ${childConsultedRate}% of risk assessments -- children's lived experience of the neighbourhood is not informing risk management.`,
    );
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No neighbourhood risk assessments recorded despite children being on placement -- the home cannot evidence that the location is suitable or that risks to children from the surrounding area are identified and managed.",
    );
  }

  if (totalMappings === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No local area safety mapping recorded -- the home has not documented its understanding of safe zones, risk areas, lighting, CCTV coverage, or child-friendly spaces in the neighbourhood.",
    );
  }

  if (totalRoutes === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No route safety assessments recorded -- children's regular routes to school, activities, and other destinations have not been assessed for safety.",
    );
  }

  if (totalPartnerships === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No community safety partnerships recorded -- the home is not evidencing engagement with police, local authority, or other community safety agencies.",
    );
  }

  // -- Recommendations --------------------------------------------------------

  const recommendations: NeighbourhoodSafetyRecommendation[] = [];
  let rank = 0;

  if (below(riskAssessmentRate, 50) && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently improve neighbourhood risk assessment quality -- ensure every assessment covers all seven key areas (crime, ASB, drugs, exploitation, gangs, traffic, environment), documents mitigations with implementation timelines, and is approved by the registered manager.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (unresolvedHighCritical > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Resolve all ${unresolvedHighCritical} outstanding high/critical hazard${unresolvedHighCritical !== 1 ? "s" : ""} immediately -- report to relevant authorities, implement interim mitigations, inform children, and drive through to full resolution. Document all actions taken.`,
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (below(hazardIdentificationRate, 40) && totalHazards > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul the environmental hazard management process -- ensure all identified hazards are reported to relevant authorities, mitigated with interim measures, and driven to resolution. Implement a tracking system with clear accountability and timescales.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (below(routeSafetyRate, 50) && totalRoutes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct thorough route safety assessments for all children's regular routes -- walk each route with the child, confirm safe crossing points, assess lighting and traffic conditions, and document mitigations for all identified risks.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (below(communityPartnershipRate, 40) && totalPartnerships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Revitalise community safety partnerships -- establish regular contact schedules, agree information sharing protocols and safeguarding procedures, and ensure partnerships deliver measurable safety benefits for children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
    });
  }

  if (policePartnership === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish an active partnership with local police as a matter of urgency -- agree a named contact, set up regular liaison meetings, and establish an information sharing agreement to support neighbourhood safety management.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
    });
  }

  if (childAwarenessRate < 50 && childAwarenessDenominator > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Embed child voice in all neighbourhood safety processes -- consult children during risk assessments, inform them about hazards, walk routes with them, and involve them in safety mapping so they understand and can contribute to their own safety.",
      urgency: "immediate",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (exploitationReviewRate < 70 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure exploitation risk is reviewed in every neighbourhood risk assessment -- looked-after children are disproportionately vulnerable to criminal and sexual exploitation, and local area intelligence is critical for prevention.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (overdueRiskRate >= 20 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all overdue risk assessments up to date -- implement a review tracker with automatic reminders to ensure assessments are reviewed before their due dates.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (mitigationImplRate >= 50 && mitigationImplRate < 80 && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve mitigation implementation rate to at least 80% -- risk assessments are only effective if the identified mitigations are put into practice. Track implementation progress against clear timescales.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (meets(safetyMappingRate, 50) && below(safetyMappingRate, 70) && totalMappings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen safety mapping by ensuring staff physically walk all areas, lighting is formally assessed, update schedules are maintained, and CCTV coverage is documented.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (staffWalkedRate < 50 && totalMappings > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Require staff to physically walk all mapped areas rather than relying on desk-based assessment -- first-hand observation identifies risks that cannot be captured remotely.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (recurrentHazardRate >= 30 && totalHazards > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate root causes of recurrent hazards and work with local authority and community partners to implement permanent solutions rather than repeated temporary fixes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (hazardReportingRate >= 50 && hazardReportingRate < 80 && totalHazards > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase hazard reporting rate to relevant authorities -- ensure all identified environmental hazards are formally reported so they can be addressed by responsible parties.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (overdueRouteRate >= 20 && totalRoutes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all overdue route safety assessments up to date -- route conditions can change with seasons, construction, and traffic pattern changes.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (routeChildConfidentRate >= 50 && routeChildConfidentRate < 80 && totalRoutes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work with children who lack confidence on their routes to identify specific concerns and provide additional support, familiarisation walks, or alternative routes.",
      urgency: "soon",
      regulatory_ref: "SCCIF -- Experiences and progress of children",
    });
  }

  if (dormantPartnershipRate >= 30 && totalPartnerships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Reactivate dormant community partnerships or formally end and replace them -- inactive partnerships provide no safety benefit and create a false sense of collaborative protection.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
    });
  }

  if (infoSharingRate < 70 && totalPartnerships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Agree information sharing protocols with all community safety partners to enable the home to receive and share safety-critical intelligence about the neighbourhood.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
    });
  }

  if (meets(riskAssessmentRate, 50) && below(riskAssessmentRate, 70) && totalRiskAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve risk assessment completeness to at least 70% -- ensure all assessments document mitigations, cover all key risk areas, and receive manager approval.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (meets(routeSafetyRate, 50) && below(routeSafetyRate, 70) && totalRoutes > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve route safety completeness to at least 70% -- strengthen crossing point identification, lighting assessments, and child familiarisation walks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (meets(communityPartnershipRate, 40) && below(communityPartnershipRate, 70) && totalPartnerships > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen community partnerships by ensuring regular contact, formalising information sharing, and agreeing safeguarding protocols with all partners.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
    });
  }

  if (totalRiskAssessments === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement comprehensive neighbourhood risk assessments immediately -- assess all seven key risk areas, document mitigations, secure manager approval, and involve children in the process.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (totalMappings === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a comprehensive local area safety mapping exercise -- staff should physically walk the area to identify safe zones, risk zones, child-friendly spaces, lighting quality, and CCTV coverage.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises (suitability of location)",
    });
  }

  if (totalRoutes === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Assess the safety of all children's regular routes to school, activities, healthcare, and other frequent destinations. Walk each route with the child and document risks, mitigations, and alternatives.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 25 -- Premises",
    });
  }

  if (totalPartnerships === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish community safety partnerships with local police, fire service, neighbourhood watch, and other relevant agencies. Agree named contacts, contact schedules, information sharing protocols, and safeguarding procedures.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 5 -- Engagement with parents, police, wider community",
    });
  }

  // -- Insights ---------------------------------------------------------------

  const insights: NeighbourhoodSafetyInsight[] = [];

  // --- Critical insights ---

  if (below(riskAssessmentRate, 50) && totalRiskAssessments > 0) {
    insights.push({
      text: `Risk assessment completeness at only ${riskAssessmentRate}%. Ofsted will expect the home to demonstrate that the neighbourhood's risks are thoroughly assessed, mitigated, and managed. Incomplete assessments suggest the home cannot evidence that the location remains suitable under Reg 25.`,
      severity: "critical",
    });
  }

  if (unresolvedHighCritical > 0) {
    insights.push({
      text: `${unresolvedHighCritical} high/critical hazard${unresolvedHighCritical !== 1 ? "s" : ""} remain${unresolvedHighCritical === 1 ? "s" : ""} unresolved. Unresolved high-severity environmental hazards represent an active threat to children's safety. Ofsted will view this as a failure to safeguard children from foreseeable harm.`,
      severity: "critical",
    });
  }

  if (below(hazardIdentificationRate, 40) && totalHazards > 0) {
    insights.push({
      text: `Hazard management rate at only ${hazardIdentificationRate}%. Environmental hazards are being identified but not effectively reported, mitigated, or resolved. Ofsted expects a clear process from identification through to resolution, with evidence of accountability and urgency.`,
      severity: "critical",
    });
  }

  if (below(routeSafetyRate, 50) && totalRoutes > 0) {
    insights.push({
      text: `Route safety completeness at only ${routeSafetyRate}%. Children's regular routes lack adequate safety assessment and mitigation. Ofsted expects the home to demonstrate that children can travel safely to school, activities, and other regular destinations.`,
      severity: "critical",
    });
  }

  if (below(communityPartnershipRate, 40) && totalPartnerships > 0) {
    insights.push({
      text: `Community partnership effectiveness at only ${communityPartnershipRate}%. Weak community partnerships mean the home lacks the collaborative intelligence and response capability needed to manage neighbourhood safety proactively. Ofsted expects active engagement with police and other community safety agencies under Reg 5.`,
      severity: "critical",
    });
  }

  if (policePartnership === 0 && total_children > 0) {
    insights.push({
      text: "No active police partnership. The absence of a police liaison means the home cannot access local crime intelligence, county lines alerts, or coordinate safeguarding responses. Ofsted will view this as a significant gap in community engagement under Reg 5.",
      severity: "critical",
    });
  }

  if (totalRiskAssessments === 0 && totalMappings === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No neighbourhood risk assessments or safety mapping despite children being on placement. Ofsted cannot verify that the home's location is suitable or that environmental risks are identified and managed. This is a fundamental gap in Reg 25 compliance.",
      severity: "critical",
    });
  }

  if (exploitationReviewRate < 50 && totalRiskAssessments > 0) {
    insights.push({
      text: `Exploitation risk reviewed in only ${exploitationReviewRate}% of assessments. Looked-after children are disproportionately vulnerable to criminal and sexual exploitation. Failing to systematically assess local exploitation risks is a serious safeguarding gap that Ofsted will challenge.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (meets(riskAssessmentRate, 50) && below(riskAssessmentRate, 70) && totalRiskAssessments > 0) {
    insights.push({
      text: `Risk assessment completeness at ${riskAssessmentRate}% -- improving but some assessments lack full area coverage, documented mitigations, or management sign-off. Consistent quality across all assessments will strengthen the home's Reg 25 evidence base.`,
      severity: "warning",
    });
  }

  if (meets(safetyMappingRate, 50) && below(safetyMappingRate, 70) && totalMappings > 0) {
    insights.push({
      text: `Safety mapping completeness at ${safetyMappingRate}% -- the home has begun mapping the local area but gaps in staff-walked assessments, lighting checks, or update schedules weaken the evidence base.`,
      severity: "warning",
    });
  }

  if (meets(hazardIdentificationRate, 40) && below(hazardIdentificationRate, 70) && totalHazards > 0) {
    insights.push({
      text: `Hazard management rate at ${hazardIdentificationRate}% -- hazards are partially managed but reporting, mitigation, and resolution processes need strengthening to ensure all environmental risks are addressed promptly.`,
      severity: "warning",
    });
  }

  if (meets(routeSafetyRate, 50) && below(routeSafetyRate, 70) && totalRoutes > 0) {
    insights.push({
      text: `Route safety completeness at ${routeSafetyRate}% -- some routes have been assessed but crossing points, lighting, and child familiarisation need more consistent attention.`,
      severity: "warning",
    });
  }

  if (meets(communityPartnershipRate, 40) && below(communityPartnershipRate, 70) && totalPartnerships > 0) {
    insights.push({
      text: `Community partnership effectiveness at ${communityPartnershipRate}% -- partnerships exist but need strengthening in contact frequency, information sharing, or safeguarding protocols to deliver maximum safety benefit.`,
      severity: "warning",
    });
  }

  if (childAwarenessRate >= 50 && childAwarenessRate < 80 && childAwarenessDenominator > 0) {
    insights.push({
      text: `Child awareness and involvement at ${childAwarenessRate}% -- children are partially involved in neighbourhood safety processes but their voice needs to be more consistently embedded in risk assessments, hazard awareness, route familiarisation, and safety mapping.`,
      severity: "warning",
    });
  }

  if (overdueRiskRate >= 20 && totalRiskAssessments > 0) {
    insights.push({
      text: `${overdueRiskRate}% of risk assessments overdue. Neighbourhood conditions change -- new developments, seasonal patterns, crime trends -- and outdated assessments may not reflect current risks to children.`,
      severity: "warning",
    });
  }

  if (recurrentHazardRate >= 30 && totalHazards > 0) {
    insights.push({
      text: `${recurrentHazardRate}% of hazards are recurrent. Repeated temporary fixes without addressing root causes suggest a reactive rather than preventative approach to environmental hazard management.`,
      severity: "warning",
    });
  }

  if (highCriticalRouteRate >= 30 && totalRoutes > 0) {
    insights.push({
      text: `${highCriticalRouteRate}% of routes rated high/critical risk. Children regularly using high-risk routes need enhanced mitigations, alternative options, and close monitoring of route conditions.`,
      severity: "warning",
    });
  }

  if (dormantPartnershipRate >= 30 && totalPartnerships > 0) {
    insights.push({
      text: `${dormantPartnershipRate}% of partnerships dormant. Inactive partnerships create a false impression of collaborative safety management. The home should either reactivate these relationships or replace them with effective alternatives.`,
      severity: "warning",
    });
  }

  // --- Partnership diversity insight ---
  const partnerTypes = new Set(
    community_partnership_records
      .filter((r) => r.relationship_status === "active")
      .map((r) => r.partner_type),
  );
  if (partnerTypes.size >= 4) {
    insights.push({
      text: `The home maintains active partnerships with ${partnerTypes.size} different types of community safety partners -- this breadth of engagement supports comprehensive neighbourhood intelligence and multi-agency safeguarding.`,
      severity: "positive",
    });
  }

  // --- Positive insights ---

  if (neighbourhood_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding neighbourhood safety and risk assessment -- comprehensive risk assessments, effective hazard management, thorough route safety reviews, and strong community partnerships evidence that the location is suitable and children are protected from environmental risks.",
      severity: "positive",
    });
  }

  if (meets(riskAssessmentRate, 90) && comprehensiveCoverageRate >= 90 && totalRiskAssessments > 0) {
    insights.push({
      text: `${riskAssessmentRate}% risk assessment completeness with ${comprehensiveCoverageRate}% comprehensive coverage -- every assessment addresses all key risk areas with documented mitigations and management approval. This is exemplary evidence for Reg 25 compliance.`,
      severity: "positive",
    });
  }

  if (meets(hazardIdentificationRate, 90) && avgDaysToResolve! <= 7 && totalHazards > 0 && resolvedHazards > 0) {
    insights.push({
      text: `${hazardIdentificationRate}% hazard management rate with average resolution in ${avgDaysToResolve} days -- the home demonstrates an effective and responsive approach to environmental hazard identification, reporting, and resolution.`,
      severity: "positive",
    });
  }

  if (meets(routeSafetyRate, 90) && routeChildConfidentRate >= 80 && totalRoutes > 0) {
    insights.push({
      text: `${routeSafetyRate}% route safety completeness with ${routeChildConfidentRate}% child confidence -- children's routes are thoroughly assessed and children feel safe navigating their neighbourhood. This supports independence and wellbeing.`,
      severity: "positive",
    });
  }

  if (meets(communityPartnershipRate, 90) && meets(effectivenessAvg, 4.0) && totalPartnerships > 0) {
    insights.push({
      text: `${communityPartnershipRate}% partnership effectiveness with average rating ${effectivenessAvg}/5 -- community safety partnerships are active, well-structured, and delivering real safety benefits for children. This is strong Reg 5 compliance evidence.`,
      severity: "positive",
    });
  }

  if (childAwarenessRate >= 80 && childAwarenessDenominator > 0) {
    insights.push({
      text: `Child awareness and involvement at ${childAwarenessRate}% -- children are consulted in risk assessments, informed about hazards, walked through routes, and involved in safety mapping. Their lived experience genuinely shapes neighbourhood safety planning.`,
      severity: "positive",
    });
  }

  if (meets(safetyMappingRate, 90) && staffWalkedRate >= 90 && totalMappings > 0) {
    insights.push({
      text: `${safetyMappingRate}% safety mapping completeness with ${staffWalkedRate}% staff-walked verification -- the home maintains a thorough, first-hand understanding of the local area's safety landscape, regularly updated to reflect changing conditions.`,
      severity: "positive",
    });
  }

  if (infoSharingRate >= 90 && safeguardingProtocolRate >= 90 && totalPartnerships > 0) {
    insights.push({
      text: `Information sharing agreements (${infoSharingRate}%) and safeguarding protocols (${safeguardingProtocolRate}%) in place across partnerships -- the home can access and share safety-critical intelligence with clear safeguarding expectations underpinning all collaborative relationships.`,
      severity: "positive",
    });
  }

  // -- Headline ---------------------------------------------------------------

  let headline: string;

  if (neighbourhood_rating === "outstanding") {
    headline =
      "Outstanding neighbourhood safety and risk assessment -- comprehensive risk assessments, effective hazard management, thorough route reviews, and strong community partnerships protect children.";
  } else if (neighbourhood_rating === "good") {
    headline = `Good neighbourhood safety and risk assessment -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (neighbourhood_rating === "adequate") {
    headline = `Adequate neighbourhood safety and risk assessment -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure the local area is safe for children.`;
  } else {
    headline = `Neighbourhood safety and risk assessment is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to evidence that the location is suitable and children are protected from environmental risks.`;
  }

  // -- Return -----------------------------------------------------------------

  return {
    neighbourhood_rating,
    neighbourhood_score: score,
    headline,
    risk_assessment_rate: riskAssessmentRate,
    safety_mapping_rate: safetyMappingRate,
    hazard_identification_rate: hazardIdentificationRate,
    route_safety_rate: routeSafetyRate,
    community_partnership_rate: communityPartnershipRate,
    child_awareness_rate: childAwarenessRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
