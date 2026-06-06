// Risk Assessment Quality Intelligence Engine
// Pure deterministic — no AI, no external calls, no randomness, no Date.now()

import { withinPeriod } from "@/lib/date-period";

// ── Type Unions ──────────────────────────────────────────────────────────

export type RiskCategory =
  | "self_harm"
  | "aggression"
  | "absconding"
  | "exploitation"
  | "substance_misuse"
  | "online_safety"
  | "fire_setting"
  | "bullying";

export type RiskLevel =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "minimal";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps ───────────────────────────────────────────────────────────

const RISK_CATEGORY_LABELS: Record<RiskCategory, string> = {
  self_harm: "Self-Harm",
  aggression: "Aggression",
  absconding: "Absconding",
  exploitation: "Exploitation",
  substance_misuse: "Substance Misuse",
  online_safety: "Online Safety",
  fire_setting: "Fire Setting",
  bullying: "Bullying",
};

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
  minimal: "Minimal",
};

const RATING_LABELS: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRiskCategoryLabel(category: RiskCategory): string {
  return RISK_CATEGORY_LABELS[category];
}

export function getRiskLevelLabel(level: RiskLevel): string {
  return RISK_LEVEL_LABELS[level];
}

export function getRatingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

// ── Input Interfaces ─────────────────────────────────────────────────────

export interface RiskAssessment {
  id: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  riskCategory: RiskCategory;
  riskLevel: RiskLevel;
  mitigationPlanInPlace: boolean;
  childConsulted: boolean;
  reviewScheduled: boolean;
  documentedInPlan: boolean;
  staffAware: boolean;
  feedbackGiven: boolean;
}

export interface RiskAssessmentPolicy {
  id: string;
  riskManagementFramework: boolean;
  dynamicAssessmentProcedure: boolean;
  positiveRiskTakingPolicy: boolean;
  incidentResponseProtocol: boolean;
  multiAgencyRiskSharing: boolean;
  staffRiskTrainingRequirement: boolean;
  regularReview: boolean;
}

export interface StaffRiskAssessmentTraining {
  id: string;
  staffId: string;
  staffName: string;
  riskIdentification: boolean;
  mitigationPlanning: boolean;
  dynamicRiskAssessment: boolean;
  positiveRiskTaking: boolean;
  incidentManagement: boolean;
  multiAgencyWorking: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────

export interface RiskQualityResult {
  overallScore: number;
  totalAssessments: number;
  mitigationRate: number;
  childConsultedRate: number;
  reviewScheduledRate: number;
  comprehensiveRate: number;
}

export interface RiskComplianceResult {
  overallScore: number;
  documentedRate: number;
  staffAwareRate: number;
  feedbackRate: number;
  riskCategoryDiversityRatio: number;
}

export interface RiskPolicyResult {
  overallScore: number;
  riskManagementFramework: boolean;
  dynamicAssessmentProcedure: boolean;
  positiveRiskTakingPolicy: boolean;
  incidentResponseProtocol: boolean;
  multiAgencyRiskSharing: boolean;
  staffRiskTrainingRequirement: boolean;
  regularReview: boolean;
}

export interface StaffRiskReadinessResult {
  overallScore: number;
  totalStaff: number;
  riskIdentificationRate: number;
  mitigationPlanningRate: number;
  dynamicRiskAssessmentRate: number;
  positiveRiskTakingRate: number;
  incidentManagementRate: number;
  multiAgencyWorkingRate: number;
}

export interface ChildRiskProfile {
  childId: string;
  childName: string;
  totalAssessments: number;
  mitigationRate: number;
  consultedRate: number;
  overallScore: number;
}

export interface RiskAssessmentQualityIntelligence {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number;
  rating: Rating;

  riskQuality: RiskQualityResult;
  riskCompliance: RiskComplianceResult;
  riskPolicy: RiskPolicyResult;
  staffRiskReadiness: StaffRiskReadinessResult;

  childProfiles: ChildRiskProfile[];

  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

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

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Evaluator 1: Risk Quality (0-25) ────────────────────────────────────

export function evaluateRiskQuality(assessments: RiskAssessment[]): RiskQualityResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      overallScore: 0,
      totalAssessments: 0,
      mitigationRate: 0,
      childConsultedRate: 0,
      reviewScheduledRate: 0,
      comprehensiveRate: 0,
    };
  }

  const mitigationCount = assessments.filter((a) => a.mitigationPlanInPlace).length;
  const childConsultedCount = assessments.filter((a) => a.childConsulted).length;
  const reviewScheduledCount = assessments.filter((a) => a.reviewScheduled).length;
  const comprehensiveCount = assessments.filter(
    (a) => a.mitigationPlanInPlace && a.childConsulted && a.reviewScheduled,
  ).length;

  const mitigationRate = pct(mitigationCount, total);
  const childConsultedRate = pct(childConsultedCount, total);
  const reviewScheduledRate = pct(reviewScheduledCount, total);
  const comprehensiveRate = pct(comprehensiveCount, total);

  // Weighted scoring: mitigation 0-7, consulted 0-6, review 0-6, comprehensive 0-6
  let score = 0;
  score += (mitigationRate / 100) * 7;
  score += (childConsultedRate / 100) * 6;
  score += (reviewScheduledRate / 100) * 6;
  score += (comprehensiveRate / 100) * 6;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    totalAssessments: total,
    mitigationRate,
    childConsultedRate,
    reviewScheduledRate,
    comprehensiveRate,
  };
}

// ── Evaluator 2: Risk Compliance (0-25) ─────────────────────────────────

export function evaluateRiskCompliance(assessments: RiskAssessment[]): RiskComplianceResult {
  const total = assessments.length;

  if (total === 0) {
    return {
      overallScore: 0,
      documentedRate: 0,
      staffAwareRate: 0,
      feedbackRate: 0,
      riskCategoryDiversityRatio: 0,
    };
  }

  const documentedCount = assessments.filter((a) => a.documentedInPlan).length;
  const staffAwareCount = assessments.filter((a) => a.staffAware).length;
  const feedbackCount = assessments.filter((a) => a.feedbackGiven).length;

  const documentedRate = pct(documentedCount, total);
  const staffAwareRate = pct(staffAwareCount, total);
  const feedbackRate = pct(feedbackCount, total);

  // Diversity: unique categories out of 8 possible
  const uniqueCategories = new Set(assessments.map((a) => a.riskCategory)).size;
  const riskCategoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weighted scoring: documented 0-8, staffAware 0-7, feedback 0-5, diversity 0-5
  let score = 0;
  score += (documentedRate / 100) * 8;
  score += (staffAwareRate / 100) * 7;
  score += (feedbackRate / 100) * 5;
  score += riskCategoryDiversityRatio * 5;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    documentedRate,
    staffAwareRate,
    feedbackRate,
    riskCategoryDiversityRatio,
  };
}

// ── Evaluator 3: Risk Policy (0-25) ─────────────────────────────────────

export function evaluateRiskPolicy(policy: RiskAssessmentPolicy | null): RiskPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      riskManagementFramework: false,
      dynamicAssessmentProcedure: false,
      positiveRiskTakingPolicy: false,
      incidentResponseProtocol: false,
      multiAgencyRiskSharing: false,
      staffRiskTrainingRequirement: false,
      regularReview: false,
    };
  }

  // Weights: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.riskManagementFramework) score += 4;
  if (policy.dynamicAssessmentProcedure) score += 4;
  if (policy.positiveRiskTakingPolicy) score += 4;
  if (policy.incidentResponseProtocol) score += 4;
  if (policy.multiAgencyRiskSharing) score += 3;
  if (policy.staffRiskTrainingRequirement) score += 3;
  if (policy.regularReview) score += 3;

  score = clamp(score, 0, 25);

  return {
    overallScore: score,
    riskManagementFramework: policy.riskManagementFramework,
    dynamicAssessmentProcedure: policy.dynamicAssessmentProcedure,
    positiveRiskTakingPolicy: policy.positiveRiskTakingPolicy,
    incidentResponseProtocol: policy.incidentResponseProtocol,
    multiAgencyRiskSharing: policy.multiAgencyRiskSharing,
    staffRiskTrainingRequirement: policy.staffRiskTrainingRequirement,
    regularReview: policy.regularReview,
  };
}

// ── Evaluator 4: Staff Risk Readiness (0-25) ────────────────────────────

export function evaluateStaffRiskReadiness(training: StaffRiskAssessmentTraining[]): StaffRiskReadinessResult {
  const totalStaff = training.length;

  if (totalStaff === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      riskIdentificationRate: 0,
      mitigationPlanningRate: 0,
      dynamicRiskAssessmentRate: 0,
      positiveRiskTakingRate: 0,
      incidentManagementRate: 0,
      multiAgencyWorkingRate: 0,
    };
  }

  const riskIdentificationCount = training.filter((t) => t.riskIdentification).length;
  const mitigationPlanningCount = training.filter((t) => t.mitigationPlanning).length;
  const dynamicRiskAssessmentCount = training.filter((t) => t.dynamicRiskAssessment).length;
  const positiveRiskTakingCount = training.filter((t) => t.positiveRiskTaking).length;
  const incidentManagementCount = training.filter((t) => t.incidentManagement).length;
  const multiAgencyWorkingCount = training.filter((t) => t.multiAgencyWorking).length;

  const riskIdentificationRate = pct(riskIdentificationCount, totalStaff);
  const mitigationPlanningRate = pct(mitigationPlanningCount, totalStaff);
  const dynamicRiskAssessmentRate = pct(dynamicRiskAssessmentCount, totalStaff);
  const positiveRiskTakingRate = pct(positiveRiskTakingCount, totalStaff);
  const incidentManagementRate = pct(incidentManagementCount, totalStaff);
  const multiAgencyWorkingRate = pct(multiAgencyWorkingCount, totalStaff);

  // Weighted scoring: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (riskIdentificationRate / 100) * 6;
  score += (mitigationPlanningRate / 100) * 5;
  score += (dynamicRiskAssessmentRate / 100) * 5;
  score += (positiveRiskTakingRate / 100) * 4;
  score += (incidentManagementRate / 100) * 3;
  score += (multiAgencyWorkingRate / 100) * 2;

  score = clamp(Math.round(score * 10) / 10, 0, 25);

  return {
    overallScore: score,
    totalStaff,
    riskIdentificationRate,
    mitigationPlanningRate,
    dynamicRiskAssessmentRate,
    positiveRiskTakingRate,
    incidentManagementRate,
    multiAgencyWorkingRate,
  };
}

// ── Child Risk Profiles ─────────────────────────────────────────────────

export function buildChildRiskProfiles(assessments: RiskAssessment[]): ChildRiskProfile[] {
  const childMap = new Map<string, RiskAssessment[]>();

  for (const a of assessments) {
    const existing = childMap.get(a.childId) ?? [];
    existing.push(a);
    childMap.set(a.childId, existing);
  }

  return Array.from(childMap.entries()).map(([childId, childAssessments]) => {
    const childName = childAssessments[0].childName;
    const totalAssessments = childAssessments.length;

    const mitigationCount = childAssessments.filter((a) => a.mitigationPlanInPlace).length;
    const consultedCount = childAssessments.filter((a) => a.childConsulted).length;
    const mitigationRate = pct(mitigationCount, totalAssessments);
    const consultedRate = pct(consultedCount, totalAssessments);

    // Score 0-10
    let overallScore = 0;

    // Frequency: >=10 -> 2, >=5 -> 1
    if (totalAssessments >= 10) overallScore += 2;
    else if (totalAssessments >= 5) overallScore += 1;

    // Mitigation: >=80 -> 3, >=60 -> 2, >=40 -> 1
    if (mitigationRate >= 80) overallScore += 3;
    else if (mitigationRate >= 60) overallScore += 2;
    else if (mitigationRate >= 40) overallScore += 1;

    // Consulted: >=80 -> 3, >=60 -> 2, >=40 -> 1
    if (consultedRate >= 80) overallScore += 3;
    else if (consultedRate >= 60) overallScore += 2;
    else if (consultedRate >= 40) overallScore += 1;

    // Diversity: unique categories >= 4 -> 2, >=2 -> 1
    const uniqueCategories = new Set(childAssessments.map((a) => a.riskCategory)).size;
    if (uniqueCategories >= 4) overallScore += 2;
    else if (uniqueCategories >= 2) overallScore += 1;

    overallScore = clamp(overallScore, 0, 10);

    return {
      childId,
      childName,
      totalAssessments,
      mitigationRate,
      consultedRate,
      overallScore,
    };
  });
}

// ── Orchestrator ─────────────────────────────────────────────────────────

export function generateRiskAssessmentQualityIntelligence(
  assessments: RiskAssessment[],
  policy: RiskAssessmentPolicy | null,
  training: StaffRiskAssessmentTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): RiskAssessmentQualityIntelligence {
  const assessedAt = new Date().toISOString();

  // Filter assessments to period
  const periodAssessments = assessments.filter(
    (a) => withinPeriod(a.assessmentDate, periodStart, periodEnd),
  );

  // Evaluate each layer
  const riskQuality = evaluateRiskQuality(periodAssessments);
  const riskCompliance = evaluateRiskCompliance(periodAssessments);
  const riskPolicy = evaluateRiskPolicy(policy);
  const staffRiskReadiness = evaluateStaffRiskReadiness(training);

  // Build child profiles
  const childProfiles = buildChildRiskProfiles(periodAssessments);

  // Overall score (100 points)
  const overallScore = clamp(
    Math.round(
      riskQuality.overallScore +
      riskCompliance.overallScore +
      riskPolicy.overallScore +
      staffRiskReadiness.overallScore,
    ),
    0,
    100,
  );

  const rating = getRating(overallScore);

  // Aggregate insights
  const strengths = aggregateStrengths(riskQuality, riskCompliance, riskPolicy, staffRiskReadiness, overallScore);
  const areasForImprovement = aggregateAreasForImprovement(riskQuality, riskCompliance, riskPolicy, staffRiskReadiness, overallScore);
  const actions = generateActions(riskQuality, riskCompliance, riskPolicy, staffRiskReadiness, childProfiles);
  const regulatoryLinks = [
    "CHR 2015 Regulation 12 — Positive behaviour support (risk assessment)",
    "CHR 2015 Regulation 13 — Protection of children (risk management)",
    "SCCIF — Safety of children (risk assessment quality)",
    "NMS 4 — Safeguarding (risk assessment and management)",
    "Children Act 1989 — Duty of care",
    "UNCRC Article 19 — Protection from harm",
    "Working Together to Safeguard Children 2023 — Risk assessment",
  ];

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    riskQuality,
    riskCompliance,
    riskPolicy,
    staffRiskReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}

// ── Aggregate Strengths ──────────────────────────────────────────────────

function aggregateStrengths(
  quality: RiskQualityResult,
  compliance: RiskComplianceResult,
  policy: RiskPolicyResult,
  staff: StaffRiskReadinessResult,
  overallScore: number,
): string[] {
  const strengths: string[] = [];

  if (overallScore >= 80) {
    strengths.push("Overall risk assessment quality rated Outstanding (" + overallScore + "/100)");
  } else if (overallScore >= 60) {
    strengths.push("Overall risk assessment quality rated Good (" + overallScore + "/100)");
  }

  if (quality.mitigationRate >= 90) {
    strengths.push("Excellent mitigation planning: " + quality.mitigationRate + "% of assessments have mitigation plans in place");
  }
  if (quality.childConsultedRate >= 90) {
    strengths.push("Children's voice prioritised: " + quality.childConsultedRate + "% of assessments include child consultation");
  }
  if (quality.comprehensiveRate >= 80) {
    strengths.push("Strong comprehensive coverage: " + quality.comprehensiveRate + "% of assessments are fully comprehensive");
  }

  if (compliance.documentedRate >= 90) {
    strengths.push("High documentation compliance: " + compliance.documentedRate + "% of assessments documented in care plans");
  }
  if (compliance.staffAwareRate >= 90) {
    strengths.push("Excellent staff awareness: " + compliance.staffAwareRate + "% of assessments have staff awareness confirmed");
  }
  if (compliance.feedbackRate >= 90) {
    strengths.push("Consistent feedback practice: " + compliance.feedbackRate + "% of assessments have feedback given");
  }

  if (policy.overallScore >= 20) {
    strengths.push("Robust risk assessment policy framework with " + policy.overallScore + "/25 coverage");
  }

  if (staff.riskIdentificationRate >= 90) {
    strengths.push("Strong risk identification skills: " + staff.riskIdentificationRate + "% of staff trained");
  }
  if (staff.overallScore >= 20) {
    strengths.push("High staff risk readiness with comprehensive training across competencies");
  }

  return strengths;
}

// ── Aggregate Areas for Improvement ──────────────────────────────────────

function aggregateAreasForImprovement(
  quality: RiskQualityResult,
  compliance: RiskComplianceResult,
  policy: RiskPolicyResult,
  staff: StaffRiskReadinessResult,
  overallScore: number,
): string[] {
  const areas: string[] = [];

  if (overallScore < 40) {
    areas.push("Overall risk assessment quality rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  } else if (overallScore < 60) {
    areas.push("Overall risk assessment quality Requires Improvement (" + overallScore + "/100)");
  }

  if (quality.mitigationRate < 70 && quality.totalAssessments > 0) {
    areas.push("Mitigation planning at " + quality.mitigationRate + "% — below 70% threshold. All identified risks must have mitigation plans");
  }
  if (quality.childConsultedRate < 70 && quality.totalAssessments > 0) {
    areas.push("Child consultation at " + quality.childConsultedRate + "% — UNCRC Article 12 requires children's participation in risk decisions");
  }
  if (quality.reviewScheduledRate < 70 && quality.totalAssessments > 0) {
    areas.push("Review scheduling at " + quality.reviewScheduledRate + "% — risk assessments must be regularly reviewed");
  }

  if (compliance.documentedRate < 70 && quality.totalAssessments > 0) {
    areas.push("Documentation rate at " + compliance.documentedRate + "% — risk assessments must be documented in care plans");
  }
  if (compliance.staffAwareRate < 70 && quality.totalAssessments > 0) {
    areas.push("Staff awareness at " + compliance.staffAwareRate + "% — all staff must be aware of identified risks");
  }

  if (policy.overallScore < 15) {
    areas.push("Risk assessment policy coverage at " + policy.overallScore + "/25 — significant policy gaps identified");
  }

  if (staff.riskIdentificationRate < 70 && staff.totalStaff > 0) {
    areas.push("Risk identification skills at " + staff.riskIdentificationRate + "% — staff may miss emerging risks");
  }
  if (staff.overallScore < 15 && staff.totalStaff > 0) {
    areas.push("Staff risk readiness score at " + staff.overallScore + "/25 — comprehensive training programme required");
  }

  return areas;
}

// ── Generate Actions ─────────────────────────────────────────────────────

function generateActions(
  quality: RiskQualityResult,
  compliance: RiskComplianceResult,
  policy: RiskPolicyResult,
  staff: StaffRiskReadinessResult,
  childProfiles: ChildRiskProfile[],
): string[] {
  const actions: string[] = [];

  if (quality.totalAssessments === 0) {
    actions.push("URGENT: No risk assessments recorded — all children must have current risk assessments per CHR 2015 Regulation 12");
  }

  if (quality.mitigationRate < 50 && quality.totalAssessments > 0) {
    actions.push("URGENT: Only " + quality.mitigationRate + "% of assessments have mitigation plans — immediate action required to safeguard children");
  }

  if (compliance.staffAwareRate < 50 && quality.totalAssessments > 0) {
    actions.push("URGENT: Only " + compliance.staffAwareRate + "% of staff are aware of risk assessments — conduct immediate briefings");
  }

  if (policy.overallScore === 0) {
    actions.push("URGENT: No risk assessment policy in place — develop and implement policy per regulatory requirements");
  }

  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) {
    actions.push("HIGH: " + lowScoreChildren.length + " child(ren) with low risk profile scores — review and update individual risk assessments");
  }

  if (quality.childConsultedRate < 70 && quality.totalAssessments > 0) {
    actions.push("HIGH: Child consultation at " + quality.childConsultedRate + "% — embed child voice in all risk assessment processes");
  }

  if (staff.riskIdentificationRate < 70 && staff.totalStaff > 0) {
    actions.push("MEDIUM: Risk identification training at " + staff.riskIdentificationRate + "% — schedule training for remaining staff");
  }

  if (compliance.feedbackRate < 70 && quality.totalAssessments > 0) {
    actions.push("MEDIUM: Feedback rate at " + compliance.feedbackRate + "% — ensure feedback is given following all risk assessments");
  }

  if (!policy.riskManagementFramework) {
    actions.push("MEDIUM: Risk management framework missing — develop comprehensive framework");
  }

  if (!policy.dynamicAssessmentProcedure) {
    actions.push("MEDIUM: Dynamic assessment procedure not in place — implement dynamic risk assessment processes");
  }

  if (actions.length === 0) {
    actions.push("No immediate actions required. Risk assessment quality operating within expected standards.");
  }

  return actions;
}
