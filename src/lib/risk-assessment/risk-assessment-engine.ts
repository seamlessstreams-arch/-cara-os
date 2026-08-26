import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Risk Assessment Intelligence Engine  (v2 — standardised)
//
// Deterministic engine for evaluating risk assessment quality, compliance,
// policy frameworks, staff readiness, and per-child risk profiles.
//
// Aligned to:
//   - CHR 2015 Reg 34 — Safeguarding (risk assessment)
//   - CHR 2015 Reg 12 — Health and comfort (risk management)
//   - SCCIF — Safety: risk assessment and management
//   - Children Act 1989 s.22 — Duty to safeguard welfare
//   - Working Together to Safeguard Children 2023
//   - Quality Standards 2015 — Standard 5 (keeping safe)
//   - DfE Guide to CRH — Risk management expectations
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Enums / Literal Unions ────────────────────────────────────────────────

export type RiskAssessmentCategory =
  | "initial_assessment"
  | "review_assessment"
  | "dynamic_risk_update"
  | "positive_risk_taking"
  | "incident_triggered"
  | "placement_risk"
  | "community_risk"
  | "environmental_risk";

export type RiskAssessmentOutcome =
  | "risk_reduced"
  | "risk_maintained"
  | "risk_increased"
  | "controls_adequate"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Record ────────────────────────────────────────────────────────────────

export interface RiskAssessmentRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: RiskAssessmentCategory;
  outcome: RiskAssessmentOutcome;
  // Quality flags
  controlMeasuresIdentified: boolean;
  childViewIncluded: boolean;
  reviewDateSet: boolean;
  multiAgencyInput: boolean;
  // Compliance flags
  documentationComplete: boolean;
  timelyRecording: boolean;
}

// ── Policy (7 booleans) ───────────────────────────────────────────────────

export interface RiskAssessmentPolicy {
  riskAssessmentPolicy: boolean;
  dynamicRiskUpdatePolicy: boolean;
  positiveRiskTakingPolicy: boolean;
  incidentTriggeredReviewPolicy: boolean;
  communityRiskPolicy: boolean;
  environmentalRiskPolicy: boolean;
  multiAgencyRiskSharingPolicy: boolean;
}

// ── Staff Training (6 skills) ─────────────────────────────────────────────

export interface StaffRiskAssessmentTraining {
  staffId: string;
  riskAssessmentSkills: boolean;
  dynamicRiskManagement: boolean;
  positiveRiskTaking: boolean;
  incidentRiskAnalysis: boolean;
  childViewInRisk: boolean;
  multiAgencyRiskSharing: boolean;
}

// ── Result interfaces ─────────────────────────────────────────────────────

export interface RiskAssessmentQualityResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  controlMeasuresIdentifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewIncludedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  reviewDateSetRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyInputRate: number | null;
}

export interface RiskAssessmentComplianceResult {
  overallScore: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  controlMeasuresIdentifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface RiskAssessmentPolicyResult {
  overallScore: number;
  riskAssessmentPolicy: boolean;
  dynamicRiskUpdatePolicy: boolean;
  positiveRiskTakingPolicy: boolean;
  incidentTriggeredReviewPolicy: boolean;
  communityRiskPolicy: boolean;
  environmentalRiskPolicy: boolean;
  multiAgencyRiskSharingPolicy: boolean;
}

export interface StaffRiskAssessmentReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  riskAssessmentSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dynamicRiskManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveRiskTakingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  incidentRiskAnalysisRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewInRiskRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyRiskSharingRate: number | null;
}

export interface ChildRiskAssessmentProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  controlMeasuresIdentifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewIncludedRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface RiskAssessmentIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  riskAssessmentQuality: RiskAssessmentQualityResult;
  riskAssessmentCompliance: RiskAssessmentComplianceResult;
  riskAssessmentPolicy: RiskAssessmentPolicyResult;
  staffReadiness: StaffRiskAssessmentReadinessResult;
  childProfiles: ChildRiskAssessmentProfile[];
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

export function getRiskAssessmentCategoryLabel(cat: RiskAssessmentCategory): string {
  const map: Record<RiskAssessmentCategory, string> = {
    initial_assessment: "Initial Assessment",
    review_assessment: "Review Assessment",
    dynamic_risk_update: "Dynamic Risk Update",
    positive_risk_taking: "Positive Risk Taking",
    incident_triggered: "Incident Triggered",
    placement_risk: "Placement Risk",
    community_risk: "Community Risk",
    environmental_risk: "Environmental Risk",
  };
  return map[cat] ?? cat;
}

export function getRiskAssessmentOutcomeLabel(o: RiskAssessmentOutcome): string {
  const map: Record<RiskAssessmentOutcome, string> = {
    risk_reduced: "Risk Reduced",
    risk_maintained: "Risk Maintained",
    risk_increased: "Risk Increased",
    controls_adequate: "Controls Adequate",
    not_applicable: "Not Applicable",
  };
  return map[o] ?? o;
}

export function getRatingLabel(r: Rating): string {
  const map: Record<Rating, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
  };
  return map[r] ?? r;
}

// ── Evaluator 1: Quality (0-25) ───────────────────────────────────────────

export function evaluateRiskAssessmentQuality(records: RiskAssessmentRecord[]): RiskAssessmentQualityResult {
  const total = records.length;
  const controlMeasuresIdentifiedRate = rate(records.filter(r => r.controlMeasuresIdentified).length, total);
  const childViewIncludedRate = rate(records.filter(r => r.childViewIncluded).length, total);
  const reviewDateSetRate = rate(records.filter(r => r.reviewDateSet).length, total);
  const multiAgencyInputRate = rate(records.filter(r => r.multiAgencyInput).length, total);

  const raw =
    ((controlMeasuresIdentifiedRate ?? 0) / 100) * 7 +
    ((childViewIncludedRate ?? 0) / 100) * 6 +
    ((reviewDateSetRate ?? 0) / 100) * 6 +
    ((multiAgencyInputRate ?? 0) / 100) * 6;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalRecords: total, controlMeasuresIdentifiedRate, childViewIncludedRate, reviewDateSetRate, multiAgencyInputRate };
}

// ── Evaluator 2: Compliance (0-25) ────────────────────────────────────────

export function evaluateRiskAssessmentCompliance(records: RiskAssessmentRecord[]): RiskAssessmentComplianceResult {
  const total = records.length;
  const documentationRate = rate(records.filter(r => r.documentationComplete).length, total);
  const timelyRecordingRate = rate(records.filter(r => r.timelyRecording).length, total);
  const controlMeasuresIdentifiedRate = rate(records.filter(r => r.controlMeasuresIdentified).length, total);

  const ALL_CATEGORIES: RiskAssessmentCategory[] = [
    "initial_assessment", "review_assessment", "dynamic_risk_update", "positive_risk_taking",
    "incident_triggered", "placement_risk", "community_risk", "environmental_risk",
  ];
  const usedCategories = new Set(records.map(r => r.category));
  const categoryDiversityRatio = rate(usedCategories.size, ALL_CATEGORIES.length);

  const raw =
    ((documentationRate ?? 0) / 100) * 8 +
    ((timelyRecordingRate ?? 0) / 100) * 7 +
    ((controlMeasuresIdentifiedRate ?? 0) / 100) * 5 +
    ((categoryDiversityRatio ?? 0) / 100) * 5;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, documentationRate, timelyRecordingRate, controlMeasuresIdentifiedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy (0-25) ────────────────────────────────────────────

export function evaluateRiskAssessmentPolicy(policy: RiskAssessmentPolicy | null): RiskAssessmentPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      riskAssessmentPolicy: false,
      dynamicRiskUpdatePolicy: false,
      positiveRiskTakingPolicy: false,
      incidentTriggeredReviewPolicy: false,
      communityRiskPolicy: false,
      environmentalRiskPolicy: false,
      multiAgencyRiskSharingPolicy: false,
    };
  }

  const score =
    (policy.riskAssessmentPolicy ? 4 : 0) +
    (policy.dynamicRiskUpdatePolicy ? 4 : 0) +
    (policy.positiveRiskTakingPolicy ? 4 : 0) +
    (policy.incidentTriggeredReviewPolicy ? 4 : 0) +
    (policy.communityRiskPolicy ? 3 : 0) +
    (policy.environmentalRiskPolicy ? 3 : 0) +
    (policy.multiAgencyRiskSharingPolicy ? 3 : 0);

  return {
    overallScore: Math.min(25, score),
    riskAssessmentPolicy: policy.riskAssessmentPolicy,
    dynamicRiskUpdatePolicy: policy.dynamicRiskUpdatePolicy,
    positiveRiskTakingPolicy: policy.positiveRiskTakingPolicy,
    incidentTriggeredReviewPolicy: policy.incidentTriggeredReviewPolicy,
    communityRiskPolicy: policy.communityRiskPolicy,
    environmentalRiskPolicy: policy.environmentalRiskPolicy,
    multiAgencyRiskSharingPolicy: policy.multiAgencyRiskSharingPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ───────────────────────────────────

export function evaluateStaffRiskAssessmentReadiness(staff: StaffRiskAssessmentTraining[]): StaffRiskAssessmentReadinessResult {
  const total = staff.length;
  const riskAssessmentSkillsRate = rate(staff.filter(s => s.riskAssessmentSkills).length, total);
  const dynamicRiskManagementRate = rate(staff.filter(s => s.dynamicRiskManagement).length, total);
  const positiveRiskTakingRate = rate(staff.filter(s => s.positiveRiskTaking).length, total);
  const incidentRiskAnalysisRate = rate(staff.filter(s => s.incidentRiskAnalysis).length, total);
  const childViewInRiskRate = rate(staff.filter(s => s.childViewInRisk).length, total);
  const multiAgencyRiskSharingRate = rate(staff.filter(s => s.multiAgencyRiskSharing).length, total);

  const raw =
    ((riskAssessmentSkillsRate ?? 0) / 100) * 6 +
    ((dynamicRiskManagementRate ?? 0) / 100) * 5 +
    ((positiveRiskTakingRate ?? 0) / 100) * 5 +
    ((incidentRiskAnalysisRate ?? 0) / 100) * 4 +
    ((childViewInRiskRate ?? 0) / 100) * 3 +
    ((multiAgencyRiskSharingRate ?? 0) / 100) * 2;

  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, totalStaff: total, riskAssessmentSkillsRate, dynamicRiskManagementRate, positiveRiskTakingRate, incidentRiskAnalysisRate, childViewInRiskRate, multiAgencyRiskSharingRate };
}

// ── Child Risk Assessment Profiles (0-10) ─────────────────────────────────

export function buildChildRiskAssessmentProfiles(records: RiskAssessmentRecord[]): ChildRiskAssessmentProfile[] {
  const byChild = new Map<string, RiskAssessmentRecord[]>();
  for (const r of records) {
    const arr = byChild.get(r.childId) ?? [];
    arr.push(r);
    byChild.set(r.childId, arr);
  }

  const profiles: ChildRiskAssessmentProfile[] = [];

  for (const [childId, recs] of byChild) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;
    const controlMeasuresIdentifiedRate = rate(recs.filter(r => r.controlMeasuresIdentified).length, totalRecords);
    const childViewIncludedRate = rate(recs.filter(r => r.childViewIncluded).length, totalRecords);
    const categoriesCovered = [...new Set(recs.map(r => r.category))];

    let score = 0;
    if (meets(totalRecords, 10)) score += 2;
    else if (meets(totalRecords, 5)) score += 1;
    if (meets(controlMeasuresIdentifiedRate, 80)) score += 3;
    else if (meets(controlMeasuresIdentifiedRate, 60)) score += 2;
    else if (meets(controlMeasuresIdentifiedRate, 40)) score += 1;
    if (meets(childViewIncludedRate, 80)) score += 3;
    else if (meets(childViewIncludedRate, 60)) score += 2;
    else if (meets(childViewIncludedRate, 40)) score += 1;
    if (categoriesCovered.length >= 4) score += 2;
    else if (categoriesCovered.length >= 2) score += 1;

    profiles.push({ childId, childName, totalRecords, controlMeasuresIdentifiedRate, childViewIncludedRate, categoriesCovered, overallScore: Math.min(10, score) });
  }

  return profiles.sort((a, b) => b.overallScore - a.overallScore);
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export function generateRiskAssessmentIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: RiskAssessmentRecord[];
  policy: RiskAssessmentPolicy | null;
  staff: StaffRiskAssessmentTraining[];
}): RiskAssessmentIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const riskAssessmentQuality = evaluateRiskAssessmentQuality(records);
  const riskAssessmentCompliance = evaluateRiskAssessmentCompliance(records);
  const riskAssessmentPolicy = evaluateRiskAssessmentPolicy(policy);
  const staffReadiness = evaluateStaffRiskAssessmentReadiness(staff);
  const childProfiles = buildChildRiskAssessmentProfiles(records);

  const overallScore = Math.min(100,
    riskAssessmentQuality.overallScore +
    riskAssessmentCompliance.overallScore +
    riskAssessmentPolicy.overallScore +
    staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (meets(riskAssessmentQuality.controlMeasuresIdentifiedRate, 80)) strengths.push("Excellent control measure identification in risk assessments");
  if (meets(riskAssessmentQuality.childViewIncludedRate, 80)) strengths.push("Children's views consistently included in risk assessments");
  if (meets(riskAssessmentQuality.multiAgencyInputRate, 90)) strengths.push("Strong multi-agency input in risk assessment processes");
  if (meets(riskAssessmentQuality.reviewDateSetRate, 80)) strengths.push("Review dates consistently set for all risk assessments");
  if (meets(riskAssessmentCompliance.documentationRate, 90)) strengths.push("Excellent risk assessment documentation practices");
  if (meets(riskAssessmentCompliance.categoryDiversityRatio, 75)) strengths.push("Good variety of risk assessment types undertaken");
  if (meets(riskAssessmentPolicy.overallScore, 22)) strengths.push("Comprehensive risk assessment policies in place");
  if (meets(staffReadiness.riskAssessmentSkillsRate, 80)) strengths.push("Staff well-trained in risk assessment skills");
  if (meets(staffReadiness.dynamicRiskManagementRate, 80)) strengths.push("Staff competent in dynamic risk management");

  const areasForImprovement: string[] = [];
  if (below(riskAssessmentQuality.controlMeasuresIdentifiedRate, 60)) areasForImprovement.push("Control measures not consistently identified in assessments");
  if (below(riskAssessmentQuality.childViewIncludedRate, 60)) areasForImprovement.push("Children's views not consistently included in risk assessments");
  if (below(riskAssessmentQuality.multiAgencyInputRate, 60)) areasForImprovement.push("Multi-agency input needs strengthening in risk assessments");
  if (below(riskAssessmentCompliance.timelyRecordingRate, 70)) areasForImprovement.push("Risk assessment records not completed in a timely manner");
  if (below(riskAssessmentCompliance.categoryDiversityRatio, 50)) areasForImprovement.push("Limited range of risk assessment types");
  if (below(staffReadiness.positiveRiskTakingRate, 60)) areasForImprovement.push("Positive risk-taking training needs attention");
  if (below(staffReadiness.incidentRiskAnalysisRate, 60)) areasForImprovement.push("Incident risk analysis skills need development");

  const actions: string[] = [];
  if (below(riskAssessmentQuality.controlMeasuresIdentifiedRate, 40)) actions.push("URGENT: Ensure control measures are identified in all risk assessments");
  if (below(riskAssessmentQuality.childViewIncludedRate, 40)) actions.push("URGENT: Include children's views in every risk assessment");
  if (below(riskAssessmentCompliance.documentationRate, 60)) actions.push("URGENT: Ensure all risk assessments are properly documented");
  if (!policy || riskAssessmentPolicy.overallScore < 16) actions.push("Review and update risk assessment policies");
  if (below(staffReadiness.overallScore, 15)) actions.push("Prioritise staff risk assessment training programme");
  if (below(riskAssessmentQuality.reviewDateSetRate, 50)) actions.push("Ensure review dates are set for all risk assessments");
  if (records.length === 0) actions.push("URGENT: No risk assessment records found — establish systematic risk assessment processes immediately");
  // Surface the worst case explicitly: an assessment where the risk INCREASED but
  // no control measures were identified. A rate-based view (controlMeasuresRate)
  // can stay above threshold while this individual high-risk record is missed.
  const riskIncreasedNoControls = records.filter(
    (r) => r.outcome === "risk_increased" && !r.controlMeasuresIdentified,
  );
  if (riskIncreasedNoControls.length > 0) {
    actions.unshift(`URGENT: ${riskIncreasedNoControls.length} assessment(s) where risk increased without control measures identified — review and mitigate immediately`);
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 34 — Safeguarding (risk assessment)",
    "CHR 2015 Reg 12 — Health and comfort (risk management)",
    "SCCIF — Safety: risk assessment and management",
    "Children Act 1989 s.22 — Duty to safeguard welfare",
    "Working Together to Safeguard Children 2023",
    "Quality Standards 2015 — Standard 5 (keeping safe)",
    "DfE Guide to CRH — Risk management expectations",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    riskAssessmentQuality, riskAssessmentCompliance, riskAssessmentPolicy, staffReadiness,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
