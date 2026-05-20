/* ──────────────────────────────────────────────────────────────
   Emergency Preparedness Intelligence Engine

   Pure deterministic engine for evaluating emergency preparedness
   in children's residential care — drill quality, compliance,
   policy frameworks, and staff readiness.

   Regulatory basis:
     - CHR 2015, Reg 25 — Premises: fire safety, maintenance
     - CHR 2015, Reg 40 — Notification of events to Ofsted
     - Regulatory Reform (Fire Safety) Order 2005
     - Health and Safety at Work Act 1974
     - Civil Contingencies Act 2004
     - SCCIF — How well children are helped and protected
     - NMS 7 — Safeguarding: fire safety and emergency planning

   No AI. No external calls. No randomness. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type EmergencyType =
  | "fire_drill"
  | "evacuation_exercise"
  | "first_aid_scenario"
  | "lockdown_procedure"
  | "missing_child_protocol"
  | "medical_emergency"
  | "utility_failure"
  | "severe_weather";

export type ReadinessLevel =
  | "excellent"
  | "good"
  | "developing"
  | "limited"
  | "not_assessed";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps & Getters ─────────────────────────────────────────────────

const emergencyTypeLabels: Record<EmergencyType, string> = {
  fire_drill: "Fire Drill",
  evacuation_exercise: "Evacuation Exercise",
  first_aid_scenario: "First Aid Scenario",
  lockdown_procedure: "Lockdown Procedure",
  missing_child_protocol: "Missing Child Protocol",
  medical_emergency: "Medical Emergency",
  utility_failure: "Utility Failure",
  severe_weather: "Severe Weather",
};

export function getEmergencyTypeLabel(type: EmergencyType): string {
  return emergencyTypeLabels[type];
}

const readinessLevelLabels: Record<ReadinessLevel, string> = {
  excellent: "Excellent",
  good: "Good",
  developing: "Developing",
  limited: "Limited",
  not_assessed: "Not Assessed",
};

export function getReadinessLevelLabel(level: ReadinessLevel): string {
  return readinessLevelLabels[level];
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface EmergencyDrill {
  id: string;
  drillDate: string;
  drillType: EmergencyType;
  readinessLevel: ReadinessLevel;
  allStaffParticipated: boolean;
  childrenBriefed: boolean;
  completedWithinTarget: boolean;
  documentedProperly: boolean;
  debriefConducted: boolean;
  improvementsIdentified: boolean;
}

export interface EmergencyPolicy {
  id: string;
  fireEvacuationPlan: boolean;
  lockdownProcedure: boolean;
  missingChildProtocol: boolean;
  medicalEmergencyPlan: boolean;
  businessContinuityPlan: boolean;
  emergencyContactSystem: boolean;
  regularReview: boolean;
}

export interface StaffEmergencyTraining {
  id: string;
  staffId: string;
  staffName: string;
  firstAidCertified: boolean;
  fireMarshallTrained: boolean;
  evacuationProcedures: boolean;
  emergencyProtocols: boolean;
  safeguardingInEmergencies: boolean;
  communicationInCrisis: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface EmergencyQualityResult {
  totalDrills: number;
  readinessCount: number;
  readinessRate: number;
  completionCount: number;
  completionRate: number;
  childBriefingCount: number;
  childBriefingRate: number;
  debriefCount: number;
  debriefRate: number;
  score: number; // 0-25
}

export interface EmergencyComplianceResult {
  totalDrills: number;
  documentedCount: number;
  documentedRate: number;
  staffParticipationCount: number;
  staffParticipationRate: number;
  improvementsCount: number;
  improvementsRate: number;
  uniqueDrillTypes: number;
  typeDiversityRatio: number;
  score: number; // 0-25
}

export interface EmergencyPolicyResult {
  fireEvacuationPlan: boolean;
  lockdownProcedure: boolean;
  missingChildProtocol: boolean;
  medicalEmergencyPlan: boolean;
  businessContinuityPlan: boolean;
  emergencyContactSystem: boolean;
  regularReview: boolean;
  score: number; // 0-25
}

export interface StaffEmergencyReadinessResult {
  totalStaff: number;
  firstAidCertifiedCount: number;
  firstAidCertifiedRate: number;
  fireMarshallTrainedCount: number;
  fireMarshallTrainedRate: number;
  evacuationProceduresCount: number;
  evacuationProceduresRate: number;
  emergencyProtocolsCount: number;
  emergencyProtocolsRate: number;
  safeguardingInEmergenciesCount: number;
  safeguardingInEmergenciesRate: number;
  communicationInCrisisCount: number;
  communicationInCrisisRate: number;
  score: number; // 0-25
}

export interface DrillTypeSummary {
  drillType: EmergencyType;
  count: number;
  avgReadiness: number;
  lastDate: string;
}

export interface EmergencyPreparednessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number; // 0-100
  rating: Rating;

  emergencyQuality: EmergencyQualityResult;
  emergencyCompliance: EmergencyComplianceResult;
  emergencyPolicy: EmergencyPolicyResult;
  staffEmergencyReadiness: StaffEmergencyReadinessResult;

  drillSummary: DrillTypeSummary[];

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

function cap(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Emergency Quality (0-25) ─────────────────────────────────

export function evaluateEmergencyQuality(
  drills: EmergencyDrill[],
): EmergencyQualityResult {
  const total = drills.length;

  if (total === 0) {
    return {
      totalDrills: 0,
      readinessCount: 0,
      readinessRate: 0,
      completionCount: 0,
      completionRate: 0,
      childBriefingCount: 0,
      childBriefingRate: 0,
      debriefCount: 0,
      debriefRate: 0,
      score: 0,
    };
  }

  const readinessCount = drills.filter(
    (d) => d.readinessLevel === "excellent" || d.readinessLevel === "good",
  ).length;
  const readinessRate = pct(readinessCount, total);

  const completionCount = drills.filter((d) => d.completedWithinTarget).length;
  const completionRate = pct(completionCount, total);

  const childBriefingCount = drills.filter((d) => d.childrenBriefed).length;
  const childBriefingRate = pct(childBriefingCount, total);

  const debriefCount = drills.filter((d) => d.debriefConducted).length;
  const debriefRate = pct(debriefCount, total);

  // Weights: readinessRate 7 + completionRate 6 + childBriefingRate 6 + debriefRate 6 = 25
  let score = 0;
  score += (readinessRate / 100) * 7;
  score += (completionRate / 100) * 6;
  score += (childBriefingRate / 100) * 6;
  score += (debriefRate / 100) * 6;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalDrills: total,
    readinessCount,
    readinessRate,
    completionCount,
    completionRate,
    childBriefingCount,
    childBriefingRate,
    debriefCount,
    debriefRate,
    score,
  };
}

// ── Evaluator 2: Emergency Compliance (0-25) ──────────────────────────────

export function evaluateEmergencyCompliance(
  drills: EmergencyDrill[],
): EmergencyComplianceResult {
  const total = drills.length;

  if (total === 0) {
    return {
      totalDrills: 0,
      documentedCount: 0,
      documentedRate: 0,
      staffParticipationCount: 0,
      staffParticipationRate: 0,
      improvementsCount: 0,
      improvementsRate: 0,
      uniqueDrillTypes: 0,
      typeDiversityRatio: 0,
      score: 0,
    };
  }

  const documentedCount = drills.filter((d) => d.documentedProperly).length;
  const documentedRate = pct(documentedCount, total);

  const staffParticipationCount = drills.filter((d) => d.allStaffParticipated).length;
  const staffParticipationRate = pct(staffParticipationCount, total);

  const improvementsCount = drills.filter((d) => d.improvementsIdentified).length;
  const improvementsRate = pct(improvementsCount, total);

  const uniqueTypes = new Set(drills.map((d) => d.drillType));
  const uniqueDrillTypes = uniqueTypes.size;
  const typeDiversityRatio = Math.round((uniqueDrillTypes / 8) * 100) / 100;

  // Weights: documentedRate 8 + staffParticipationRate 7 + improvementsRate 5 + typeDiversityRatio 5 = 25
  let score = 0;
  score += (documentedRate / 100) * 8;
  score += (staffParticipationRate / 100) * 7;
  score += (improvementsRate / 100) * 5;
  score += typeDiversityRatio * 5;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalDrills: total,
    documentedCount,
    documentedRate,
    staffParticipationCount,
    staffParticipationRate,
    improvementsCount,
    improvementsRate,
    uniqueDrillTypes,
    typeDiversityRatio,
    score,
  };
}

// ── Evaluator 3: Emergency Policy (0-25) ──────────────────────────────────

export function evaluateEmergencyPolicy(
  policy: EmergencyPolicy | null,
): EmergencyPolicyResult {
  if (!policy) {
    return {
      fireEvacuationPlan: false,
      lockdownProcedure: false,
      missingChildProtocol: false,
      medicalEmergencyPlan: false,
      businessContinuityPlan: false,
      emergencyContactSystem: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.fireEvacuationPlan) score += 4;
  if (policy.lockdownProcedure) score += 4;
  if (policy.missingChildProtocol) score += 4;
  if (policy.medicalEmergencyPlan) score += 4;
  if (policy.businessContinuityPlan) score += 3;
  if (policy.emergencyContactSystem) score += 3;
  if (policy.regularReview) score += 3;

  score = cap(score, 0, 25);

  return {
    fireEvacuationPlan: policy.fireEvacuationPlan,
    lockdownProcedure: policy.lockdownProcedure,
    missingChildProtocol: policy.missingChildProtocol,
    medicalEmergencyPlan: policy.medicalEmergencyPlan,
    businessContinuityPlan: policy.businessContinuityPlan,
    emergencyContactSystem: policy.emergencyContactSystem,
    regularReview: policy.regularReview,
    score,
  };
}

// ── Evaluator 4: Staff Emergency Readiness (0-25) ─────────────────────────

export function evaluateStaffEmergencyReadiness(
  training: StaffEmergencyTraining[],
): StaffEmergencyReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      totalStaff: 0,
      firstAidCertifiedCount: 0,
      firstAidCertifiedRate: 0,
      fireMarshallTrainedCount: 0,
      fireMarshallTrainedRate: 0,
      evacuationProceduresCount: 0,
      evacuationProceduresRate: 0,
      emergencyProtocolsCount: 0,
      emergencyProtocolsRate: 0,
      safeguardingInEmergenciesCount: 0,
      safeguardingInEmergenciesRate: 0,
      communicationInCrisisCount: 0,
      communicationInCrisisRate: 0,
      score: 0,
    };
  }

  const firstAidCertifiedCount = training.filter((t) => t.firstAidCertified).length;
  const firstAidCertifiedRate = pct(firstAidCertifiedCount, totalStaff);

  const fireMarshallTrainedCount = training.filter((t) => t.fireMarshallTrained).length;
  const fireMarshallTrainedRate = pct(fireMarshallTrainedCount, totalStaff);

  const evacuationProceduresCount = training.filter((t) => t.evacuationProcedures).length;
  const evacuationProceduresRate = pct(evacuationProceduresCount, totalStaff);

  const emergencyProtocolsCount = training.filter((t) => t.emergencyProtocols).length;
  const emergencyProtocolsRate = pct(emergencyProtocolsCount, totalStaff);

  const safeguardingInEmergenciesCount = training.filter((t) => t.safeguardingInEmergencies).length;
  const safeguardingInEmergenciesRate = pct(safeguardingInEmergenciesCount, totalStaff);

  const communicationInCrisisCount = training.filter((t) => t.communicationInCrisis).length;
  const communicationInCrisisRate = pct(communicationInCrisisCount, totalStaff);

  // 6 skills weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (firstAidCertifiedRate / 100) * 6;
  score += (fireMarshallTrainedRate / 100) * 5;
  score += (evacuationProceduresRate / 100) * 5;
  score += (emergencyProtocolsRate / 100) * 4;
  score += (safeguardingInEmergenciesRate / 100) * 3;
  score += (communicationInCrisisRate / 100) * 2;

  score = cap(Math.round(score * 10) / 10, 0, 25);

  return {
    totalStaff,
    firstAidCertifiedCount,
    firstAidCertifiedRate,
    fireMarshallTrainedCount,
    fireMarshallTrainedRate,
    evacuationProceduresCount,
    evacuationProceduresRate,
    emergencyProtocolsCount,
    emergencyProtocolsRate,
    safeguardingInEmergenciesCount,
    safeguardingInEmergenciesRate,
    communicationInCrisisCount,
    communicationInCrisisRate,
    score,
  };
}

// ── Drill Type Summary ────────────────────────────────────────────────────

export function buildDrillTypeSummary(
  drills: EmergencyDrill[],
): DrillTypeSummary[] {
  if (drills.length === 0) return [];

  const grouped = new Map<
    EmergencyType,
    { count: number; readyCount: number; lastDate: string }
  >();

  for (const d of drills) {
    const existing = grouped.get(d.drillType);
    const isReady = d.readinessLevel === "excellent" || d.readinessLevel === "good";

    if (!existing) {
      grouped.set(d.drillType, {
        count: 1,
        readyCount: isReady ? 1 : 0,
        lastDate: d.drillDate,
      });
    } else {
      existing.count++;
      if (isReady) existing.readyCount++;
      if (d.drillDate > existing.lastDate) existing.lastDate = d.drillDate;
    }
  }

  const result: DrillTypeSummary[] = [];
  for (const [drillType, data] of grouped) {
    result.push({
      drillType,
      count: data.count,
      avgReadiness: pct(data.readyCount, data.count),
      lastDate: data.lastDate,
    });
  }

  return result;
}

// ── Master Generator ──────────────────────────────────────────────────────

export function generateEmergencyPreparednessIntelligence(
  drills: EmergencyDrill[],
  policy: EmergencyPolicy | null,
  training: StaffEmergencyTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): EmergencyPreparednessIntelligence {
  const quality = evaluateEmergencyQuality(drills);
  const compliance = evaluateEmergencyCompliance(drills);
  const policyResult = evaluateEmergencyPolicy(policy);
  const staffReadiness = evaluateStaffEmergencyReadiness(training);

  const rawScore = quality.score + compliance.score + policyResult.score + staffReadiness.score;
  const overallScore = cap(Math.round(rawScore), 0, 100);
  const rating = getRating(overallScore);

  const drillSummary = buildDrillTypeSummary(drills);

  // ── Strengths ────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (quality.score >= 20) {
    strengths.push("Emergency drill quality is consistently high with strong readiness levels");
  }
  if (compliance.score >= 20) {
    strengths.push("Compliance with drill documentation and diversity requirements is excellent");
  }
  if (policyResult.score >= 20) {
    strengths.push("Emergency policy framework is comprehensive and well-maintained");
  }
  if (staffReadiness.score >= 20) {
    strengths.push("Staff emergency training and readiness is at an exemplary level");
  }

  // ── Areas for Improvement ────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (quality.score < 15) {
    areasForImprovement.push("Emergency drill quality needs improvement — readiness levels and completion rates are below expectations");
  }
  if (compliance.score < 15) {
    areasForImprovement.push("Drill compliance is insufficient — documentation, staff participation, or type diversity needs attention");
  }
  if (policyResult.score < 15) {
    areasForImprovement.push("Emergency policy framework has significant gaps that must be addressed");
  }
  if (staffReadiness.score < 15) {
    areasForImprovement.push("Staff emergency training coverage is inadequate and requires immediate investment");
  }

  // ── Actions ──────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (policyResult.score === 0) {
    actions.push("URGENT: No emergency policy framework in place — develop and implement emergency policies immediately");
  }
  if (staffReadiness.score === 0) {
    actions.push("URGENT: No staff have completed emergency training — schedule training for all staff as a priority");
  }
  if (quality.readinessRate < 50 && quality.totalDrills > 0) {
    actions.push("Improve drill readiness levels — more than half of drills show readiness below good");
  }
  if (compliance.documentedRate < 50 && compliance.totalDrills > 0) {
    actions.push("Ensure all emergency drills are properly documented for regulatory compliance");
  }
  if (compliance.staffParticipationRate < 50 && compliance.totalDrills > 0) {
    actions.push("Increase staff participation in emergency drills — all staff must take part regularly");
  }
  if (quality.childBriefingRate < 50 && quality.totalDrills > 0) {
    actions.push("Brief children before and after emergency drills to build awareness and reduce anxiety");
  }
  if (quality.debriefRate < 50 && quality.totalDrills > 0) {
    actions.push("Conduct debriefs after all emergency drills to capture learning and drive improvement");
  }
  if (staffReadiness.firstAidCertifiedRate < 50 && staffReadiness.totalStaff > 0) {
    actions.push("Ensure at least 50% of staff hold current first aid certification");
  }

  // ── Regulatory Links ─────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015, Reg 25 — Premises: fire safety, maintenance, and environmental safety",
    "CHR 2015, Reg 40 — Notification of events to Ofsted within required timeframes",
    "Regulatory Reform (Fire Safety) Order 2005 — Fire risk assessment and evacuation procedures",
    "Health and Safety at Work Act 1974 — General duty of care for staff and children",
    "Civil Contingencies Act 2004 — Business continuity and emergency planning obligations",
    "SCCIF — How well children are helped and protected in emergency situations",
    "NMS 7 — Safeguarding: fire safety procedures and emergency planning requirements",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    emergencyQuality: quality,
    emergencyCompliance: compliance,
    emergencyPolicy: policyResult,
    staffEmergencyReadiness: staffReadiness,
    drillSummary,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
