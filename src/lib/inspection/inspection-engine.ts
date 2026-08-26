import { below, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// Cara Inspection Intelligence Engine
//
// Deterministic engine for evaluating inspection readiness and quality in
// children's homes — evidence documentation, action planning, staff
// preparation, child involvement, and regulatory compliance.
//
// Aligned to:
//   - CHR 2015 Reg 45 — Review of quality of care
//   - CHR 2015 Reg 46 — Review of premises and equipment
//   - SCCIF — Social Care Common Inspection Framework
//   - Ofsted Inspection Handbook — Children's homes
//   - CHR 2015 Reg 40 — Records and notifications
//   - DfE Guide to CRH — Quality standards and inspection
//   - Children Act 1989 — Welfare of the child
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type InspectionCategory =
  | "overall_effectiveness"
  | "quality_of_care"
  | "safety_of_children"
  | "leadership_management"
  | "outcomes_for_children"
  | "education_achievement"
  | "health_wellbeing"
  | "transitions_planning";

export type InspectionOutcome =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate"
  | "not_yet_inspected";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface InspectionRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: InspectionCategory;
  outcome: InspectionOutcome;
  evidenceDocumented: boolean;        // quality rate 1, weight 7
  actionPlanCreated: boolean;         // quality rate 2, weight 6
  staffPrepared: boolean;             // quality rate 3, weight 6
  childViewIncluded: boolean;         // quality rate 4, weight 6
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface InspectionPolicy {
  inspectionReadinessPolicy: boolean;         // 4
  selfAssessmentFramework: boolean;           // 4
  actionPlanningProcedure: boolean;           // 4
  evidenceCollectionPolicy: boolean;          // 4
  notificationProtocol: boolean;              // 3
  staffPreparationGuidance: boolean;          // 3
  continuousImprovementPolicy: boolean;       // 3
}

export interface StaffInspectionTraining {
  staffId: string;
  inspectionReadiness: boolean;           // 6
  evidencePresentation: boolean;          // 5
  regulatoryKnowledge: boolean;           // 5
  selfAssessment: boolean;               // 4
  actionPlanDevelopment: boolean;         // 3
  qualityAssurance: boolean;             // 2
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface InspectionQualityResult {
  overallScore: number;
  rating: Rating;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  evidenceDocumentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionPlanCreatedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  staffPreparedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewIncludedRate: number | null;
}

export interface InspectionComplianceResult {
  overallScore: number;
  rating: Rating;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewIncludedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  categoryDiversityRatio: number | null;
}

export interface InspectionPolicyResult {
  overallScore: number;
  rating: Rating;
  inspectionReadinessPolicy: boolean;
  selfAssessmentFramework: boolean;
  actionPlanningProcedure: boolean;
  evidenceCollectionPolicy: boolean;
  notificationProtocol: boolean;
  staffPreparationGuidance: boolean;
  continuousImprovementPolicy: boolean;
}

export interface StaffInspectionReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  inspectionReadinessRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  evidencePresentationRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  regulatoryKnowledgeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  selfAssessmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  actionPlanDevelopmentRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  qualityAssuranceRate: number | null;
}

export interface ChildInspectionProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  evidenceDocumentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childViewIncludedRate: number | null;
  categoriesCovered: string[];
  overallScore: number;
}

export interface InspectionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  inspectionQuality: InspectionQualityResult;
  inspectionCompliance: InspectionComplianceResult;
  inspectionPolicy: InspectionPolicyResult;
  staffReadiness: StaffInspectionReadinessResult;
  childProfiles: ChildInspectionProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

export function getInspectionCategoryLabel(cat: InspectionCategory): string {
  const labels: Record<InspectionCategory, string> = {
    overall_effectiveness: "Overall Effectiveness",
    quality_of_care: "Quality of Care",
    safety_of_children: "Safety of Children",
    leadership_management: "Leadership & Management",
    outcomes_for_children: "Outcomes for Children",
    education_achievement: "Education & Achievement",
    health_wellbeing: "Health & Wellbeing",
    transitions_planning: "Transitions & Planning",
  };
  return labels[cat] ?? cat;
}

export function getInspectionOutcomeLabel(outcome: InspectionOutcome): string {
  const labels: Record<InspectionOutcome, string> = {
    outstanding: "Outstanding",
    good: "Good",
    requires_improvement: "Requires Improvement",
    inadequate: "Inadequate",
    not_yet_inspected: "Not Yet Inspected",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: InspectionCategory[] = [
  "overall_effectiveness", "quality_of_care", "safety_of_children", "leadership_management",
  "outcomes_for_children", "education_achievement", "health_wellbeing", "transitions_planning",
];

// ── Evaluator 1: Inspection Quality (0-25) ─────────────────────────────────

export function evaluateInspectionQuality(records: InspectionRecord[]): InspectionQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalRecords: 0, evidenceDocumentedRate: null, actionPlanCreatedRate: null, staffPreparedRate: null, childViewIncludedRate: null };
  }

  const evidenceDocumentedRate = rate(records.filter((r) => r.evidenceDocumented).length, total);
  const actionPlanCreatedRate = rate(records.filter((r) => r.actionPlanCreated).length, total);
  const staffPreparedRate = rate(records.filter((r) => r.staffPrepared).length, total);
  const childViewIncludedRate = rate(records.filter((r) => r.childViewIncluded).length, total);

  // Weighted: evidenceDocumentedRate 7 + actionPlanCreatedRate 6 + staffPreparedRate 6 + childViewIncludedRate 6 = 25
  const raw = (evidenceDocumentedRate! / 100) * 7 + (actionPlanCreatedRate! / 100) * 6 + (staffPreparedRate! / 100) * 6 + (childViewIncludedRate! / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalRecords: total, evidenceDocumentedRate, actionPlanCreatedRate, staffPreparedRate, childViewIncludedRate };
}

// ── Evaluator 2: Inspection Compliance (0-25) ──────────────────────────────

export function evaluateInspectionCompliance(records: InspectionRecord[]): InspectionComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", documentationRate: null, timelyRecordingRate: null, childViewIncludedRate: null, categoryDiversityRatio: 0 };
  }

  const documentationRate = rate(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = rate(records.filter((r) => r.timelyRecording).length, total);
  const childViewIncludedRate = rate(records.filter((r) => r.childViewIncluded).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = rate(uniqueCategories, ALL_CATEGORIES.length);

  // Weighted: documentationRate 8 + timelyRecordingRate 7 + childViewIncludedRate 5 + categoryDiversityRatio 5 = 25
  const raw = (documentationRate! / 100) * 8 + (timelyRecordingRate! / 100) * 7 + (childViewIncludedRate! / 100) * 5 + ((categoryDiversityRatio ?? 0) / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), documentationRate, timelyRecordingRate, childViewIncludedRate, categoryDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateInspectionPolicy(policy: InspectionPolicy | null): InspectionPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", inspectionReadinessPolicy: false, selfAssessmentFramework: false, actionPlanningProcedure: false, evidenceCollectionPolicy: false, notificationProtocol: false, staffPreparationGuidance: false, continuousImprovementPolicy: false };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.inspectionReadinessPolicy) score += 4;
  if (policy.selfAssessmentFramework) score += 4;
  if (policy.actionPlanningProcedure) score += 4;
  if (policy.evidenceCollectionPolicy) score += 4;
  if (policy.notificationProtocol) score += 3;
  if (policy.staffPreparationGuidance) score += 3;
  if (policy.continuousImprovementPolicy) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    inspectionReadinessPolicy: policy.inspectionReadinessPolicy,
    selfAssessmentFramework: policy.selfAssessmentFramework,
    actionPlanningProcedure: policy.actionPlanningProcedure,
    evidenceCollectionPolicy: policy.evidenceCollectionPolicy,
    notificationProtocol: policy.notificationProtocol,
    staffPreparationGuidance: policy.staffPreparationGuidance,
    continuousImprovementPolicy: policy.continuousImprovementPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffInspectionReadiness(staff: StaffInspectionTraining[]): StaffInspectionReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, inspectionReadinessRate: null, evidencePresentationRate: null, regulatoryKnowledgeRate: null, selfAssessmentRate: null, actionPlanDevelopmentRate: null, qualityAssuranceRate: null };
  }

  const inspectionReadinessRate = rate(staff.filter((s) => s.inspectionReadiness).length, count);
  const evidencePresentationRate = rate(staff.filter((s) => s.evidencePresentation).length, count);
  const regulatoryKnowledgeRate = rate(staff.filter((s) => s.regulatoryKnowledge).length, count);
  const selfAssessmentRate = rate(staff.filter((s) => s.selfAssessment).length, count);
  const actionPlanDevelopmentRate = rate(staff.filter((s) => s.actionPlanDevelopment).length, count);
  const qualityAssuranceRate = rate(staff.filter((s) => s.qualityAssurance).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (inspectionReadinessRate! / 100) * 6 +
    (evidencePresentationRate! / 100) * 5 +
    (regulatoryKnowledgeRate! / 100) * 5 +
    (selfAssessmentRate! / 100) * 4 +
    (actionPlanDevelopmentRate! / 100) * 3 +
    (qualityAssuranceRate! / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, inspectionReadinessRate, evidencePresentationRate, regulatoryKnowledgeRate, selfAssessmentRate, actionPlanDevelopmentRate, qualityAssuranceRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildInspectionProfiles(records: InspectionRecord[]): ChildInspectionProfile[] {
  const grouped = new Map<string, InspectionRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildInspectionProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const evidenceDocumentedRate = rate(recs.filter((r) => r.evidenceDocumented).length, totalRecords);
    const childViewIncludedRate = rate(recs.filter((r) => r.childViewIncluded).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet];

    // Scoring: freq [>=10->2, >=5->1] + rate1 evidenceDocumentedRate [>=80->3, >=60->2, >=40->1] + rate2 childViewIncludedRate [same] + diversity [>=4->2, >=2->1]
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (meets(evidenceDocumentedRate, 80)) score += 3;
    else if (meets(evidenceDocumentedRate, 60)) score += 2;
    else if (meets(evidenceDocumentedRate, 40)) score += 1;

    if (meets(childViewIncludedRate, 80)) score += 3;
    else if (meets(childViewIncludedRate, 60)) score += 2;
    else if (meets(childViewIncludedRate, 40)) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      evidenceDocumentedRate,
      childViewIncludedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateInspectionIntelligence(
  records: InspectionRecord[],
  policy: InspectionPolicy | null,
  staff: StaffInspectionTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): InspectionIntelligence {
  const inspectionQuality = evaluateInspectionQuality(records);
  const inspectionCompliance = evaluateInspectionCompliance(records);
  const inspectionPolicy = evaluateInspectionPolicy(policy);
  const staffReadiness = evaluateStaffInspectionReadiness(staff);
  const childProfiles = buildChildInspectionProfiles(records);

  const overallScore = Math.min(
    100,
    inspectionQuality.overallScore + inspectionCompliance.overallScore + inspectionPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (meets(inspectionQuality.evidenceDocumentedRate, 80)) strengths.push("Evidence is consistently documented across inspection areas");
  if (meets(inspectionQuality.actionPlanCreatedRate, 80)) strengths.push("Action plans are routinely created following inspection activities");
  if (meets(inspectionQuality.staffPreparedRate, 80)) strengths.push("Staff are well prepared for inspection processes");
  if (meets(inspectionQuality.childViewIncludedRate, 80)) strengths.push("Children's views are consistently included in inspection evidence");
  if (meets(inspectionCompliance.documentationRate, 80)) strengths.push("Inspection documentation is thorough and complete");
  if (meets(inspectionCompliance.timelyRecordingRate, 80)) strengths.push("Records are completed within required timescales");
  if (meets(staffReadiness.inspectionReadinessRate, 80)) strengths.push("Staff have strong inspection readiness training");
  if (meets(staffReadiness.evidencePresentationRate, 80)) strengths.push("Staff are well trained in evidence presentation");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (below(inspectionQuality.evidenceDocumentedRate, 60)) areasForImprovement.push("Evidence documentation is not consistently maintained");
  if (below(inspectionQuality.actionPlanCreatedRate, 60)) areasForImprovement.push("Action plans are not routinely created after inspection activities");
  if (below(inspectionQuality.staffPreparedRate, 60)) areasForImprovement.push("Staff preparation for inspections needs improvement");
  if (below(inspectionQuality.childViewIncludedRate, 60)) areasForImprovement.push("Children's views are not consistently captured in inspection evidence");
  if (below(inspectionCompliance.documentationRate, 60)) areasForImprovement.push("Inspection documentation is incomplete or inconsistent");
  if (below(inspectionCompliance.timelyRecordingRate, 60)) areasForImprovement.push("Records are not being completed within required timescales");
  if (below(staffReadiness.inspectionReadinessRate, 60)) areasForImprovement.push("Staff inspection readiness training needs development");
  if (below(staffReadiness.evidencePresentationRate, 60)) areasForImprovement.push("Staff need more training in evidence presentation");

  // Actions
  const actions: string[] = [];
  if (inspectionPolicy.overallScore === 0) actions.push("URGENT: Establish an inspection readiness policy — CHR 2015 Reg 45 requires documented procedures for quality review");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide inspection readiness and evidence presentation training to all staff — effective preparation depends on skilled practitioners");
  if (below(inspectionQuality.evidenceDocumentedRate, 50)) actions.push("Ensure all inspection areas have documented evidence — SCCIF requires demonstrable quality across all judgement areas");
  if (below(inspectionQuality.actionPlanCreatedRate, 50)) actions.push("Implement systematic action planning following all inspection activities — CHR 2015 Reg 45");
  if (below(inspectionCompliance.documentationRate, 50)) actions.push("Improve inspection documentation — all quality reviews must be fully recorded");
  if (below(inspectionCompliance.timelyRecordingRate, 50)) actions.push("Review recording timescales — inspection records should be completed promptly");
  if (below(inspectionQuality.childViewIncludedRate, 50)) actions.push("Ensure children's views are gathered and included in all inspection evidence");
  if (below(staffReadiness.regulatoryKnowledgeRate, 50)) actions.push("Train staff in regulatory knowledge — understanding of CHR 2015 and SCCIF is essential for inspection readiness");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 45 — Review of quality of care",
    "CHR 2015 Reg 46 — Review of premises and equipment",
    "SCCIF — Social Care Common Inspection Framework",
    "Ofsted Inspection Handbook — Children's homes",
    "CHR 2015 Reg 40 — Records and notifications",
    "DfE Guide to CRH — Quality standards and inspection",
    "Children Act 1989 — Welfare of the child",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    inspectionQuality,
    inspectionCompliance,
    inspectionPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
