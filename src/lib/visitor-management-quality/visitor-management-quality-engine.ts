import { below, meets, rate } from "@/lib/metrics/rate";
// Visitor Management Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

// ── Type Unions ───────────────────────────────────────────────────────────

export type VisitorType =
  | "family_member"
  | "social_worker"
  | "therapist"
  | "independent_visitor"
  | "advocate"
  | "friend"
  | "professional_visitor"
  | "inspector";

export type VisitQuality =
  | "excellent"
  | "good"
  | "satisfactory"
  | "poor"
  | "not_assessed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ────────────────────────────────────────────────────────────

const visitorTypeLabels: Record<VisitorType, string> = {
  family_member: "Family Member",
  social_worker: "Social Worker",
  therapist: "Therapist",
  independent_visitor: "Independent Visitor",
  advocate: "Advocate",
  friend: "Friend",
  professional_visitor: "Professional Visitor",
  inspector: "Inspector",
};

const visitQualityLabels: Record<VisitQuality, string> = {
  excellent: "Excellent",
  good: "Good",
  satisfactory: "Satisfactory",
  poor: "Poor",
  not_assessed: "Not Assessed",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getVisitorTypeLabel(type: VisitorType): string {
  return visitorTypeLabels[type];
}

export function getVisitQualityLabel(quality: VisitQuality): string {
  return visitQualityLabels[quality];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

export function getVisitorTypeLabels(): Record<VisitorType, string> {
  return { ...visitorTypeLabels };
}

export function getVisitQualityLabels(): Record<VisitQuality, string> {
  return { ...visitQualityLabels };
}

export function getRatingLabels(): Record<Rating, string> {
  return { ...ratingLabels };
}

// ── Input Interfaces ──────────────────────────────────────────────────────

export interface VisitorRecord {
  id: string;
  childId: string;
  childName: string;
  visitDate: string;
  visitorType: VisitorType;
  visitQuality: VisitQuality;
  childConsulted: boolean;
  safeguardingChecked: boolean;
  privacyMaintained: boolean;
  documentedInLog: boolean;
  staffSupervised: boolean;
  feedbackRecorded: boolean;
}

export interface VisitorPolicy {
  id: string;
  visitorManagementStrategy: boolean;
  safeguardingCheckProcedure: boolean;
  childConsentProtocol: boolean;
  privacyAndDignityGuidance: boolean;
  professionalVisitorFramework: boolean;
  emergencyVisitProtocol: boolean;
  regularReview: boolean;
}

export interface StaffVisitorTraining {
  id: string;
  staffId: string;
  staffName: string;
  visitorManagement: boolean;
  safeguardingChecks: boolean;
  childConsentPractice: boolean;
  privacyProtocol: boolean;
  conflictResolution: boolean;
  recordKeeping: boolean;
}

// ── Result Interfaces ─────────────────────────────────────────────────────

export interface VisitorManagementQualityResult {
  overallScore: number;
  totalVisits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childConsultedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  privacyRate: number | null;
}

export interface VisitorManagementComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffSupervisedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  visitorTypeDiversityRatio: number | null;
}

export interface VisitorManagementPolicyResult {
  overallScore: number;
  visitorManagementStrategy: boolean;
  safeguardingCheckProcedure: boolean;
  childConsentProtocol: boolean;
  privacyAndDignityGuidance: boolean;
  professionalVisitorFramework: boolean;
  emergencyVisitProtocol: boolean;
  regularReview: boolean;
}

export interface StaffVisitorReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  visitorManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingChecksRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childConsentPracticeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  privacyProtocolRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictResolutionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
}

export interface ChildVisitorProfile {
  childId: string;
  childName: string;
  totalVisits: number;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  consultedRate: number | null;
  overallScore: number;
}

export interface VisitorManagementQualityIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  visitorManagementQuality: VisitorManagementQualityResult;
  visitorManagementCompliance: VisitorManagementComplianceResult;
  visitorManagementPolicy: VisitorManagementPolicyResult;
  staffVisitorReadiness: StaffVisitorReadinessResult;
  childProfiles: ChildVisitorProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Evaluator 1: Visitor Management Quality (0–25) ───────────────────────

export function evaluateVisitorManagementQuality(
  visits: VisitorRecord[],
): VisitorManagementQualityResult {
  const total = visits.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalVisits: 0,
      qualityRate: null,
      childConsultedRate: null,
      safeguardingRate: null,
      privacyRate: null,
    };
  }

  const qualityCount = visits.filter(
    (v) => v.visitQuality === "excellent" || v.visitQuality === "good",
  ).length;
  const consultedCount = visits.filter((v) => v.childConsulted).length;
  const safeguardingCount = visits.filter((v) => v.safeguardingChecked).length;
  const privacyCount = visits.filter((v) => v.privacyMaintained).length;

  const qualityRate = rate(qualityCount, total);
  const childConsultedRate = rate(consultedCount, total);
  const safeguardingRate = rate(safeguardingCount, total);
  const privacyRate = rate(privacyCount, total);

  const score = Math.min(
    25,
    Math.round((qualityRate! / 100) * 7) +
      Math.round((childConsultedRate! / 100) * 6) +
      Math.round((safeguardingRate! / 100) * 6) +
      Math.round((privacyRate! / 100) * 6),
  );

  return {
    overallScore: score,
    totalVisits: total,
    qualityRate,
    childConsultedRate,
    safeguardingRate,
    privacyRate,
  };
}

// ── Evaluator 2: Visitor Management Compliance (0–25) ────────────────────

export function evaluateVisitorManagementCompliance(
  visits: VisitorRecord[],
): VisitorManagementComplianceResult {
  const total = visits.length;

  if (total === 0) {
    return {
      overallScore: 0,
      documentedRate: null,
      staffSupervisedRate: null,
      feedbackRate: null,
      visitorTypeDiversityRatio: 0,
    };
  }

  const documentedCount = visits.filter((v) => v.documentedInLog).length;
  const supervisedCount = visits.filter((v) => v.staffSupervised).length;
  const feedbackCount = visits.filter((v) => v.feedbackRecorded).length;

  const documentedRate = rate(documentedCount, total);
  const staffSupervisedRate = rate(supervisedCount, total);
  const feedbackRate = rate(feedbackCount, total);

  const uniqueTypes = new Set(visits.map((v) => v.visitorType)).size;
  const visitorTypeDiversityRatio = rate(uniqueTypes, 8);

  const score = Math.min(
    25,
    Math.round((documentedRate! / 100) * 8) +
      Math.round((staffSupervisedRate! / 100) * 7) +
      Math.round((feedbackRate! / 100) * 5) +
      Math.round((visitorTypeDiversityRatio! / 100) * 5),
  );

  return {
    overallScore: score,
    documentedRate,
    staffSupervisedRate,
    feedbackRate,
    visitorTypeDiversityRatio,
  };
}

// ── Evaluator 3: Visitor Management Policy (0–25) ────────────────────────

export function evaluateVisitorManagementPolicy(
  policy: VisitorPolicy | null,
): VisitorManagementPolicyResult {
  if (policy === null) {
    return {
      overallScore: 0,
      visitorManagementStrategy: false,
      safeguardingCheckProcedure: false,
      childConsentProtocol: false,
      privacyAndDignityGuidance: false,
      professionalVisitorFramework: false,
      emergencyVisitProtocol: false,
      regularReview: false,
    };
  }

  const score = Math.min(
    25,
    (policy.visitorManagementStrategy ? 4 : 0) +
      (policy.safeguardingCheckProcedure ? 4 : 0) +
      (policy.childConsentProtocol ? 4 : 0) +
      (policy.privacyAndDignityGuidance ? 4 : 0) +
      (policy.professionalVisitorFramework ? 3 : 0) +
      (policy.emergencyVisitProtocol ? 3 : 0) +
      (policy.regularReview ? 3 : 0),
  );

  return {
    overallScore: score,
    visitorManagementStrategy: policy.visitorManagementStrategy,
    safeguardingCheckProcedure: policy.safeguardingCheckProcedure,
    childConsentProtocol: policy.childConsentProtocol,
    privacyAndDignityGuidance: policy.privacyAndDignityGuidance,
    professionalVisitorFramework: policy.professionalVisitorFramework,
    emergencyVisitProtocol: policy.emergencyVisitProtocol,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Visitor Readiness (0–25) ─────────────────────────

export function evaluateStaffVisitorReadiness(
  training: StaffVisitorTraining[],
): StaffVisitorReadinessResult {
  const total = training.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      visitorManagementRate: null,
      safeguardingChecksRate: null,
      childConsentPracticeRate: null,
      privacyProtocolRate: null,
      conflictResolutionRate: null,
      recordKeepingRate: null,
    };
  }

  const visitorManagementRate = rate(
    training.filter((t) => t.visitorManagement).length,
    total,
  );
  const safeguardingChecksRate = rate(
    training.filter((t) => t.safeguardingChecks).length,
    total,
  );
  const childConsentPracticeRate = rate(
    training.filter((t) => t.childConsentPractice).length,
    total,
  );
  const privacyProtocolRate = rate(
    training.filter((t) => t.privacyProtocol).length,
    total,
  );
  const conflictResolutionRate = rate(
    training.filter((t) => t.conflictResolution).length,
    total,
  );
  const recordKeepingRate = rate(
    training.filter((t) => t.recordKeeping).length,
    total,
  );

  const score = Math.min(
    25,
    Math.round((visitorManagementRate! / 100) * 6) +
      Math.round((safeguardingChecksRate! / 100) * 5) +
      Math.round((childConsentPracticeRate! / 100) * 5) +
      Math.round((privacyProtocolRate! / 100) * 4) +
      Math.round((conflictResolutionRate! / 100) * 3) +
      Math.round(((recordKeepingRate ?? 0) / 100) * 2),
  );

  return {
    overallScore: score,
    totalStaff: total,
    visitorManagementRate,
    safeguardingChecksRate,
    childConsentPracticeRate,
    privacyProtocolRate,
    conflictResolutionRate,
    recordKeepingRate,
  };
}

// ── Child Profiles ────────────────────────────────────────────────────────

export function buildChildVisitorProfiles(
  visits: VisitorRecord[],
): ChildVisitorProfile[] {
  const grouped = new Map<string, VisitorRecord[]>();

  for (const v of visits) {
    const existing = grouped.get(v.childId) ?? [];
    existing.push(v);
    grouped.set(v.childId, existing);
  }

  const profiles: ChildVisitorProfile[] = [];

  for (const [childId, childVisits] of grouped) {
    const childName = childVisits[0].childName;
    const totalVisits = childVisits.length;

    const qualityCount = childVisits.filter(
      (v) => v.visitQuality === "excellent" || v.visitQuality === "good",
    ).length;
    const qualityRate = rate(qualityCount, totalVisits);

    const consultedCount = childVisits.filter((v) => v.childConsulted).length;
    const consultedRate = rate(consultedCount, totalVisits);

    const uniqueTypes = new Set(childVisits.map((v) => v.visitorType)).size;

    // Score 0–10
    let score = 0;

    // Frequency
    if (totalVisits >= 10) score += 2;
    else if (totalVisits >= 5) score += 1;

    // Quality rate
    if (meets(qualityRate, 80)) score += 3;
    else if (meets(qualityRate, 60)) score += 2;
    else if (meets(qualityRate, 40)) score += 1;

    // Consulted
    if (meets(consultedRate, 80)) score += 3;
    else if (meets(consultedRate, 60)) score += 2;
    else if (meets(consultedRate, 40)) score += 1;

    // Diversity
    if (uniqueTypes >= 4) score += 2;
    else if (uniqueTypes >= 2) score += 1;

    score = Math.min(10, score);

    profiles.push({
      childId,
      childName,
      totalVisits,
      qualityRate,
      consultedRate,
      overallScore: score,
    });
  }

  return profiles;
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateVisitorManagementQualityIntelligence(
  visits: VisitorRecord[],
  policy: VisitorPolicy | null,
  training: StaffVisitorTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): VisitorManagementQualityIntelligence {
  const visitorManagementQuality = evaluateVisitorManagementQuality(visits);
  const visitorManagementCompliance = evaluateVisitorManagementCompliance(visits);
  const visitorManagementPolicy = evaluateVisitorManagementPolicy(policy);
  const staffVisitorReadiness = evaluateStaffVisitorReadiness(training);

  const rawScore =
    visitorManagementQuality.overallScore +
    visitorManagementCompliance.overallScore +
    visitorManagementPolicy.overallScore +
    staffVisitorReadiness.overallScore;

  const overallScore = Math.min(100, rawScore);
  const rating = getRating(overallScore);
  const childProfiles = buildChildVisitorProfiles(visits);

  // Strengths
  const strengths: string[] = [];
  if (meets(visitorManagementQuality.qualityRate, 80)) {
    strengths.push("High rate of quality visitor experiences — children benefiting from well-managed visits");
  }
  if (meets(visitorManagementQuality.childConsultedRate, 80)) {
    strengths.push("Strong child consultation practice — children's views are actively sought about visitors");
  }
  if (meets(visitorManagementQuality.safeguardingRate, 80)) {
    strengths.push("Safeguarding checks are consistently completed for all visitors");
  }
  if (meets(visitorManagementQuality.privacyRate, 80)) {
    strengths.push("Privacy and dignity are well maintained during visits");
  }
  if (meets(visitorManagementCompliance.documentedRate, 80)) {
    strengths.push("Visitor records are well documented in the visitor log");
  }
  if (meets(visitorManagementCompliance.staffSupervisedRate, 80)) {
    strengths.push("Staff supervision of visits is consistently maintained");
  }
  if (meets(visitorManagementCompliance.feedbackRate, 80)) {
    strengths.push("Feedback is routinely recorded following visitor sessions");
  }
  if (visitorManagementPolicy.overallScore >= 20) {
    strengths.push("Comprehensive visitor management policy framework in place");
  }
  if (staffVisitorReadiness.overallScore >= 20) {
    strengths.push("Staff team demonstrates strong readiness to manage visitors effectively");
  }

  // Areas for improvement
  const areasForImprovement: string[] = [];
  if (below(visitorManagementQuality.qualityRate, 60)) {
    areasForImprovement.push("Visit quality rate is below 60% — review visitor management and support arrangements");
  }
  if (below(visitorManagementQuality.childConsultedRate, 60)) {
    areasForImprovement.push("Child consultation rate is low — ensure children's views shape visitor arrangements");
  }
  if (below(visitorManagementQuality.safeguardingRate, 60)) {
    areasForImprovement.push("Safeguarding check rate needs improvement — ensure all visitors are properly checked");
  }
  if (below(visitorManagementQuality.privacyRate, 60)) {
    areasForImprovement.push("Privacy maintenance during visits needs improvement — review privacy protocols");
  }
  if (below(visitorManagementCompliance.documentedRate, 60)) {
    areasForImprovement.push("Documentation of visits in the visitor log needs improvement");
  }
  if (below(visitorManagementCompliance.staffSupervisedRate, 60)) {
    areasForImprovement.push("Staff supervision during visits needs to be more consistent");
  }
  if (below(visitorManagementCompliance.feedbackRate, 60)) {
    areasForImprovement.push("Feedback recording after visitor sessions needs improvement");
  }
  if (visitorManagementPolicy.overallScore < 15) {
    areasForImprovement.push("Visitor management policy framework has significant gaps — review and update");
  }
  if (staffVisitorReadiness.overallScore < 15) {
    areasForImprovement.push("Staff training in visitor management areas requires improvement");
  }

  // Actions
  const actions: string[] = [];
  if (visits.length === 0) {
    actions.push("URGENT: No visitor records found — review whether visits are being facilitated and recorded");
  }
  if (policy === null) {
    actions.push("URGENT: No visitor management policy in place — develop and implement policy immediately");
  }
  if (training.length === 0) {
    actions.push("URGENT: No staff training records for visitor management — arrange training programme");
  }
  if (below(visitorManagementQuality.safeguardingRate, 60)) {
    actions.push("HIGH: Increase safeguarding check compliance — review individual visitor check procedures");
  }
  if (below(visitorManagementCompliance.visitorTypeDiversityRatio, 50)) {
    actions.push("MEDIUM: Diversify visitor types — consider independent visitors, advocates, and professional visitors");
  }

  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 7 — Contact with family and friends",
    "CHR 2015 Regulation 22 — Visitors to the home",
    "SCCIF — Safety of children (visitor management)",
    "NMS 15 — Contact and access (visitors)",
    "Children Act 1989 — Welfare of the child",
    "UNCRC Article 9 — Right to maintain contact",
    "Data Protection Act 2018 — Visitor data management",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    visitorManagementQuality,
    visitorManagementCompliance,
    visitorManagementPolicy,
    staffVisitorReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
