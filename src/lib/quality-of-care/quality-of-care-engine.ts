// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone Quality of Care Intelligence Engine
//
// Deterministic engine for evaluating the quality of care provided in
// children's homes across all key domains — safety, education, health,
// wellbeing, relationships, leadership, and outcomes.
//
// Aligned to:
//   - CHR 2015 Reg 45 — Review of quality of care
//   - CHR 2015 Reg 5  — Statement of purpose
//   - CHR 2015 Reg 13 — Leadership and management
//   - SCCIF            — Social Care Common Inspection Framework
//   - Ofsted Grade Descriptors — Outstanding/Good/RI/Inadequate
//   - Children Act 1989 — Welfare of the child
//   - CHR 2015 Reg 44 — Independent person visits
//
// No AI. No external calls. Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ──────────────────────────────────────────────────────────────────

export type QualityDomain =
  | "safety_welfare"
  | "education_learning"
  | "health_wellbeing"
  | "positive_relationships"
  | "protection_children"
  | "leadership_management"
  | "outcomes_progress"
  | "child_voice";

export type ReviewOutcome =
  | "exceeds_standard"
  | "meets_standard"
  | "partially_meets"
  | "does_not_meet"
  | "not_assessed";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Input Records ──────────────────────────────────────────────────────────

export interface QualityReviewRecord {
  id: string;
  childId: string;
  childName: string;
  reviewDate: string;
  domain: QualityDomain;
  outcome: ReviewOutcome;
  evidenceDocumented: boolean;
  childViewCaptured: boolean;
  actionPlanCreated: boolean;
  followUpCompleted: boolean;
  regulatoryAligned: boolean;
  improvementIdentified: boolean;
}

export interface QualityPolicy {
  id: string;
  qualityAssuranceFramework: boolean;
  reg45ReviewSchedule: boolean;
  continuousImprovementPlan: boolean;
  outcomesMeasurementPolicy: boolean;
  childParticipationStrategy: boolean;
  auditSchedule: boolean;
  feedbackMechanism: boolean;
}

export interface StaffQualityTraining {
  id: string;
  staffId: string;
  staffName: string;
  qualityAssuranceSkills: boolean;
  outcomesMonitoring: boolean;
  regulatoryKnowledge: boolean;
  reflectivePractice: boolean;
  dataAnalysis: boolean;
  childParticipation: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReviewQualityResult {
  overallScore: number;
  rating: Rating;
  totalReviews: number;
  meetsStandardRate: number;
  evidenceDocumentedRate: number;
  childViewRate: number;
  actionPlanRate: number;
}

export interface ReviewComplianceResult {
  overallScore: number;
  rating: Rating;
  followUpRate: number;
  regulatoryAlignedRate: number;
  improvementRate: number;
  domainDiversityRatio: number;
}

export interface QualityPolicyResult {
  overallScore: number;
  rating: Rating;
  qualityAssuranceFramework: boolean;
  reg45ReviewSchedule: boolean;
  continuousImprovementPlan: boolean;
  outcomesMeasurementPolicy: boolean;
  childParticipationStrategy: boolean;
  auditSchedule: boolean;
  feedbackMechanism: boolean;
}

export interface StaffQualityReadinessResult {
  overallScore: number;
  rating: Rating;
  totalStaff: number;
  qualityAssuranceRate: number;
  outcomesMonitoringRate: number;
  regulatoryKnowledgeRate: number;
  reflectivePracticeRate: number;
  dataAnalysisRate: number;
  childParticipationRate: number;
}

export interface ChildQualityProfile {
  childId: string;
  childName: string;
  totalReviews: number;
  meetsStandardRate: number;
  childViewRate: number;
  domainsCovered: string[];
  overallScore: number;
}

export interface QualityOfCareIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  reviewQuality: ReviewQualityResult;
  reviewCompliance: ReviewComplianceResult;
  qualityPolicy: QualityPolicyResult;
  staffReadiness: StaffQualityReadinessResult;
  childProfiles: ChildQualityProfile[];
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

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

export function getQualityDomainLabel(domain: QualityDomain): string {
  const labels: Record<QualityDomain, string> = {
    safety_welfare: "Safety & Welfare",
    education_learning: "Education & Learning",
    health_wellbeing: "Health & Wellbeing",
    positive_relationships: "Positive Relationships",
    protection_children: "Protection of Children",
    leadership_management: "Leadership & Management",
    outcomes_progress: "Outcomes & Progress",
    child_voice: "Child Voice",
  };
  return labels[domain] ?? domain;
}

export function getReviewOutcomeLabel(outcome: ReviewOutcome): string {
  const labels: Record<ReviewOutcome, string> = {
    exceeds_standard: "Exceeds Standard",
    meets_standard: "Meets Standard",
    partially_meets: "Partially Meets",
    does_not_meet: "Does Not Meet",
    not_assessed: "Not Assessed",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Constants ──────────────────────────────────────────────────────────────

const ALL_DOMAINS: QualityDomain[] = [
  "safety_welfare", "education_learning", "health_wellbeing",
  "positive_relationships", "protection_children", "leadership_management",
  "outcomes_progress", "child_voice",
];

// ── Evaluator 1: Review Quality (0-25) ─────────────────────────────────────

export function evaluateReviewQuality(records: QualityReviewRecord[]): ReviewQualityResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", totalReviews: 0, meetsStandardRate: 0, evidenceDocumentedRate: 0, childViewRate: 0, actionPlanRate: 0 };
  }

  const meetsStandardRate = pct(
    records.filter((r) => r.outcome === "exceeds_standard" || r.outcome === "meets_standard").length,
    total,
  );
  const evidenceDocumentedRate = pct(records.filter((r) => r.evidenceDocumented).length, total);
  const childViewRate = pct(records.filter((r) => r.childViewCaptured).length, total);
  const actionPlanRate = pct(records.filter((r) => r.actionPlanCreated).length, total);

  // Weighted: meetsStandardRate 7 + evidenceDocumentedRate 6 + childViewRate 6 + actionPlanRate 6 = 25
  const raw = (meetsStandardRate / 100) * 7 + (evidenceDocumentedRate / 100) * 6 + (childViewRate / 100) * 6 + (actionPlanRate / 100) * 6;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalReviews: total, meetsStandardRate, evidenceDocumentedRate, childViewRate, actionPlanRate };
}

// ── Evaluator 2: Review Compliance (0-25) ──────────────────────────────────

export function evaluateReviewCompliance(records: QualityReviewRecord[]): ReviewComplianceResult {
  const total = records.length;
  if (total === 0) {
    return { overallScore: 0, rating: "inadequate", followUpRate: 0, regulatoryAlignedRate: 0, improvementRate: 0, domainDiversityRatio: 0 };
  }

  const followUpRate = pct(records.filter((r) => r.followUpCompleted).length, total);
  const regulatoryAlignedRate = pct(records.filter((r) => r.regulatoryAligned).length, total);
  const improvementRate = pct(records.filter((r) => r.improvementIdentified).length, total);

  const uniqueDomains = new Set(records.map((r) => r.domain)).size;
  const domainDiversityRatio = pct(uniqueDomains, ALL_DOMAINS.length);

  // Weighted: followUpRate 8 + regulatoryAlignedRate 7 + improvementRate 5 + domainDiversityRatio 5 = 25
  const raw = (followUpRate / 100) * 8 + (regulatoryAlignedRate / 100) * 7 + (improvementRate / 100) * 5 + (domainDiversityRatio / 100) * 5;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), followUpRate, regulatoryAlignedRate, improvementRate, domainDiversityRatio };
}

// ── Evaluator 3: Policy & Governance (0-25) ────────────────────────────────

export function evaluateQualityPolicy(policy: QualityPolicy | null): QualityPolicyResult {
  if (!policy) {
    return { overallScore: 0, rating: "inadequate", qualityAssuranceFramework: false, reg45ReviewSchedule: false, continuousImprovementPlan: false, outcomesMeasurementPolicy: false, childParticipationStrategy: false, auditSchedule: false, feedbackMechanism: false };
  }

  // First 4 booleans at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.qualityAssuranceFramework) score += 4;
  if (policy.reg45ReviewSchedule) score += 4;
  if (policy.continuousImprovementPlan) score += 4;
  if (policy.outcomesMeasurementPolicy) score += 4;
  if (policy.childParticipationStrategy) score += 3;
  if (policy.auditSchedule) score += 3;
  if (policy.feedbackMechanism) score += 3;

  return {
    overallScore: score,
    rating: getRating(score * 4),
    qualityAssuranceFramework: policy.qualityAssuranceFramework,
    reg45ReviewSchedule: policy.reg45ReviewSchedule,
    continuousImprovementPlan: policy.continuousImprovementPlan,
    outcomesMeasurementPolicy: policy.outcomesMeasurementPolicy,
    childParticipationStrategy: policy.childParticipationStrategy,
    auditSchedule: policy.auditSchedule,
    feedbackMechanism: policy.feedbackMechanism,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffQualityReadiness(staff: StaffQualityTraining[]): StaffQualityReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return { overallScore: 0, rating: "inadequate", totalStaff: 0, qualityAssuranceRate: 0, outcomesMonitoringRate: 0, regulatoryKnowledgeRate: 0, reflectivePracticeRate: 0, dataAnalysisRate: 0, childParticipationRate: 0 };
  }

  const qualityAssuranceRate = pct(staff.filter((s) => s.qualityAssuranceSkills).length, count);
  const outcomesMonitoringRate = pct(staff.filter((s) => s.outcomesMonitoring).length, count);
  const regulatoryKnowledgeRate = pct(staff.filter((s) => s.regulatoryKnowledge).length, count);
  const reflectivePracticeRate = pct(staff.filter((s) => s.reflectivePractice).length, count);
  const dataAnalysisRate = pct(staff.filter((s) => s.dataAnalysis).length, count);
  const childParticipationRate = pct(staff.filter((s) => s.childParticipation).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  const raw =
    (qualityAssuranceRate / 100) * 6 +
    (outcomesMonitoringRate / 100) * 5 +
    (regulatoryKnowledgeRate / 100) * 5 +
    (reflectivePracticeRate / 100) * 4 +
    (dataAnalysisRate / 100) * 3 +
    (childParticipationRate / 100) * 2;
  const overallScore = Math.min(25, Math.round(raw));

  return { overallScore, rating: getRating(overallScore * 4), totalStaff: count, qualityAssuranceRate, outcomesMonitoringRate, regulatoryKnowledgeRate, reflectivePracticeRate, dataAnalysisRate, childParticipationRate };
}

// ── Child Profiles (0-10) ──────────────────────────────────────────────────

export function buildChildQualityProfiles(records: QualityReviewRecord[]): ChildQualityProfile[] {
  const grouped = new Map<string, QualityReviewRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildQualityProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalReviews = recs.length;

    const meetsStandardRate = pct(
      recs.filter((r) => r.outcome === "exceeds_standard" || r.outcome === "meets_standard").length,
      totalReviews,
    );
    const childViewRate = pct(recs.filter((r) => r.childViewCaptured).length, totalReviews);

    const domainsSet = new Set(recs.map((r) => r.domain));
    const domainsCovered = [...domainsSet];

    // Scoring: freq [>=10→2, >=5→1] + rate1 meetsStandardRate [>=80→3, >=60→2, >=40→1] + rate2 childViewRate [same] + diversity [>=4→2, >=2→1]
    let score = 0;

    if (totalReviews >= 10) score += 2;
    else if (totalReviews >= 5) score += 1;

    if (meetsStandardRate >= 80) score += 3;
    else if (meetsStandardRate >= 60) score += 2;
    else if (meetsStandardRate >= 40) score += 1;

    if (childViewRate >= 80) score += 3;
    else if (childViewRate >= 60) score += 2;
    else if (childViewRate >= 40) score += 1;

    const domainCount = domainsCovered.length;
    if (domainCount >= 4) score += 2;
    else if (domainCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalReviews,
      meetsStandardRate,
      childViewRate,
      domainsCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// ── Master Intelligence Generator ──────────────────────────────────────────

export function generateQualityOfCareIntelligence(
  records: QualityReviewRecord[],
  policy: QualityPolicy | null,
  staff: StaffQualityTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): QualityOfCareIntelligence {
  const reviewQuality = evaluateReviewQuality(records);
  const reviewCompliance = evaluateReviewCompliance(records);
  const qualityPolicy = evaluateQualityPolicy(policy);
  const staffReadiness = evaluateStaffQualityReadiness(staff);
  const childProfiles = buildChildQualityProfiles(records);

  const overallScore = Math.min(
    100,
    reviewQuality.overallScore + reviewCompliance.overallScore + qualityPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (reviewQuality.meetsStandardRate >= 80) strengths.push("Quality reviews consistently meet or exceed standards across domains");
  if (reviewQuality.evidenceDocumentedRate >= 80) strengths.push("Strong evidence documentation supporting quality judgements");
  if (reviewQuality.childViewRate >= 80) strengths.push("Children's views are consistently captured in quality reviews");
  if (reviewQuality.actionPlanRate >= 80) strengths.push("Action plans systematically created from quality review findings");
  if (reviewCompliance.followUpRate >= 80) strengths.push("Excellent follow-up completion on quality review actions");
  if (reviewCompliance.regulatoryAlignedRate >= 80) strengths.push("Reviews are well aligned with regulatory requirements");
  if (reviewCompliance.improvementRate >= 80) strengths.push("Continuous improvement culture — improvements consistently identified");
  if (staffReadiness.qualityAssuranceRate >= 80) strengths.push("Staff are well trained in quality assurance methods");
  if (staffReadiness.reflectivePracticeRate >= 80) strengths.push("Strong reflective practice culture across the team");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (reviewQuality.meetsStandardRate < 60) areasForImprovement.push("Too many reviews show standards not being met — targeted improvement needed");
  if (reviewQuality.evidenceDocumentedRate < 60) areasForImprovement.push("Evidence documentation is insufficient to support quality judgements");
  if (reviewQuality.childViewRate < 60) areasForImprovement.push("Children's views are not being adequately captured in quality reviews");
  if (reviewQuality.actionPlanRate < 60) areasForImprovement.push("Action planning from quality reviews needs to be more systematic");
  if (reviewCompliance.followUpRate < 60) areasForImprovement.push("Follow-up on quality review actions is incomplete");
  if (reviewCompliance.regulatoryAlignedRate < 60) areasForImprovement.push("Reviews need stronger alignment with regulatory requirements");
  if (staffReadiness.qualityAssuranceRate < 60) areasForImprovement.push("Staff training in quality assurance methods needs improvement");
  if (staffReadiness.regulatoryKnowledgeRate < 60) areasForImprovement.push("Staff regulatory knowledge is insufficient");

  // Actions
  const actions: string[] = [];
  if (qualityPolicy.overallScore === 0) actions.push("URGENT: Establish a quality assurance framework — CHR 2015 Reg 45 requires regular quality of care reviews");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide quality assurance training to all staff — quality monitoring depends on skilled practitioners");
  if (reviewQuality.meetsStandardRate < 50) actions.push("Review the quality improvement plan — fewer than half of reviews meet standard");
  if (reviewQuality.childViewRate < 50) actions.push("Implement systematic child voice capture in all quality reviews — SCCIF requires evidence of children's views");
  if (reviewCompliance.followUpRate < 50) actions.push("Establish a follow-up tracking system for quality review actions");
  if (reviewCompliance.domainDiversityRatio < 50) actions.push("Ensure quality reviews cover all SCCIF domains — current coverage is too narrow");
  if (reviewCompliance.regulatoryAlignedRate < 50) actions.push("Align quality review processes with CHR 2015 and SCCIF requirements");
  if (staffReadiness.reflectivePracticeRate < 50) actions.push("Promote reflective practice through supervision and team meetings");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 45 — Review of quality of care",
    "CHR 2015 Reg 5 — Statement of purpose",
    "CHR 2015 Reg 13 — Leadership and management",
    "CHR 2015 Reg 44 — Independent person visits",
    "SCCIF — Social Care Common Inspection Framework",
    "Ofsted Grade Descriptors — Quality judgement criteria",
    "Children Act 1989 — Welfare of the child",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    reviewQuality,
    reviewCompliance,
    qualityPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
