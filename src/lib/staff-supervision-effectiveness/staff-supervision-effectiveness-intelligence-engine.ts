/* ──────────────────────────────────────────────────────────────
   Staff Supervision Effectiveness Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   effectiveness of staff supervision arrangements in
   children's residential care homes.

   Covers formal supervision, reflective practice, case
   discussion, safeguarding supervision, clinical supervision,
   performance review, peer supervision, and management
   oversight.

   Regulatory basis:
     - CHR 2015 Reg 33 — Employment of staff (supervision)
     - CHR 2015 Reg 32 — Fitness of workers
     - CHR 2015 Reg 13 — Leadership and management
     - NMS 19 — Staffing
     - SCCIF — Effectiveness of leaders and managers
     - Quality Standards 2015 — Standard 7 (workforce)
     - KCSIE 2024 — Supervision requirements

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type StaffSupervisionEffectivenessCategory =
  | "formal_supervision"
  | "reflective_practice"
  | "case_discussion"
  | "safeguarding_supervision"
  | "clinical_supervision"
  | "performance_review"
  | "peer_supervision"
  | "management_oversight";

export type StaffSupervisionEffectivenessOutcome =
  | "highly_effective"
  | "effective"
  | "partially_effective"
  | "ineffective"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const staffSupervisionEffectivenessCategoryLabels: Record<StaffSupervisionEffectivenessCategory, string> = {
  formal_supervision: "Formal Supervision",
  reflective_practice: "Reflective Practice",
  case_discussion: "Case Discussion",
  safeguarding_supervision: "Safeguarding Supervision",
  clinical_supervision: "Clinical Supervision",
  performance_review: "Performance Review",
  peer_supervision: "Peer Supervision",
  management_oversight: "Management Oversight",
};

const staffSupervisionEffectivenessOutcomeLabels: Record<StaffSupervisionEffectivenessOutcome, string> = {
  highly_effective: "Highly Effective",
  effective: "Effective",
  partially_effective: "Partially Effective",
  ineffective: "Ineffective",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getStaffSupervisionEffectivenessCategoryLabel(category: StaffSupervisionEffectivenessCategory): string {
  return staffSupervisionEffectivenessCategoryLabels[category];
}

export function getStaffSupervisionEffectivenessOutcomeLabel(outcome: StaffSupervisionEffectivenessOutcome): string {
  return staffSupervisionEffectivenessOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface StaffSupervisionEffectivenessRecord {
  id: string;
  homeId: string;
  date: string;
  staffId: string;
  staffName: string;
  supervisorId: string;
  supervisorName: string;
  category: StaffSupervisionEffectivenessCategory;
  outcome: StaffSupervisionEffectivenessOutcome;
  safeguardingDiscussed: boolean;
  wellbeingChecked: boolean;
  actionPointsSet: boolean;
  previousActionsReviewed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface StaffSupervisionEffectivenessPolicy {
  supervisionFramework: boolean;
  frequencyStandards: boolean;
  safeguardingRequirement: boolean;
  reflectivePracticePolicy: boolean;
  supervisionRecordTemplate: boolean;
  escalationProcedure: boolean;
  newStarterSupervisionPolicy: boolean;
}

export interface StaffSupervisionEffectivenessTraining {
  staffId: string;
  supervisionFacilitationSkills: boolean;
  reflectivePracticeKnowledge: boolean;
  safeguardingSupervisionSkills: boolean;
  performanceManagementSkills: boolean;
  mentoringCoachingSkills: boolean;
  documentationStandards: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface StaffSupervisionEffectivenessQualityResult {
  overallScore: number;
  totalRecords: number;
  safeguardingDiscussedRate: number;
  wellbeingCheckedRate: number;
  actionPointsSetRate: number;
  previousActionsReviewedRate: number;
}

export interface StaffSupervisionEffectivenessComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  safeguardingDiscussedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface StaffSupervisionEffectivenessPolicyResult {
  overallScore: number;
  supervisionFramework: boolean;
  frequencyStandards: boolean;
  safeguardingRequirement: boolean;
  reflectivePracticePolicy: boolean;
  supervisionRecordTemplate: boolean;
  escalationProcedure: boolean;
  newStarterSupervisionPolicy: boolean;
}

export interface StaffSupervisionEffectivenessReadinessResult {
  overallScore: number;
  totalSupervisors: number;
  supervisionFacilitationSkillsRate: number;
  reflectivePracticeKnowledgeRate: number;
  safeguardingSupervisionSkillsRate: number;
  performanceManagementSkillsRate: number;
  mentoringCoachingSkillsRate: number;
  documentationStandardsRate: number;
}

export interface StaffSupervisionEffectivenessProfile {
  staffId: string;
  staffName: string;
  totalRecords: number;
  safeguardingDiscussedRate: number;
  wellbeingCheckedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface StaffSupervisionEffectivenessIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  staffSupervisionEffectivenessQuality: StaffSupervisionEffectivenessQualityResult;
  staffSupervisionEffectivenessCompliance: StaffSupervisionEffectivenessComplianceResult;
  staffSupervisionEffectivenessPolicy: StaffSupervisionEffectivenessPolicyResult;
  supervisorReadiness: StaffSupervisionEffectivenessReadinessResult;
  staffProfiles: StaffSupervisionEffectivenessProfile[];
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

// ── Evaluator 1: Quality (0-25) ────────────────────────────────────────────

export function evaluateStaffSupervisionEffectivenessQuality(
  records: StaffSupervisionEffectivenessRecord[],
): StaffSupervisionEffectivenessQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, safeguardingDiscussedRate: 0, wellbeingCheckedRate: 0, actionPointsSetRate: 0, previousActionsReviewedRate: 0 };
  }

  const safeguardingDiscussedRate = pct(records.filter((r) => r.safeguardingDiscussed).length, n);
  const wellbeingCheckedRate = pct(records.filter((r) => r.wellbeingChecked).length, n);
  const actionPointsSetRate = pct(records.filter((r) => r.actionPointsSet).length, n);
  const previousActionsReviewedRate = pct(records.filter((r) => r.previousActionsReviewed).length, n);

  let score = 0;
  score += (safeguardingDiscussedRate / 100) * 7;
  score += (wellbeingCheckedRate / 100) * 6;
  score += (actionPointsSetRate / 100) * 6;
  score += (previousActionsReviewedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, safeguardingDiscussedRate, wellbeingCheckedRate, actionPointsSetRate, previousActionsReviewedRate };
}

// ── Evaluator 2: Compliance (0-25) ─────────────────────────────────────────

export function evaluateStaffSupervisionEffectivenessCompliance(
  records: StaffSupervisionEffectivenessRecord[],
): StaffSupervisionEffectivenessComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, safeguardingDiscussedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const safeguardingDiscussedRate = pct(records.filter((r) => r.safeguardingDiscussed).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (safeguardingDiscussedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, safeguardingDiscussedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ─────────────────────────────────────────────

export function evaluateStaffSupervisionEffectivenessPolicy(
  policy: StaffSupervisionEffectivenessPolicy | null,
): StaffSupervisionEffectivenessPolicyResult {
  if (policy === null) {
    return { overallScore: 0, supervisionFramework: false, frequencyStandards: false, safeguardingRequirement: false, reflectivePracticePolicy: false, supervisionRecordTemplate: false, escalationProcedure: false, newStarterSupervisionPolicy: false };
  }

  let score = 0;
  if (policy.supervisionFramework) score += 4;
  if (policy.frequencyStandards) score += 4;
  if (policy.safeguardingRequirement) score += 4;
  if (policy.reflectivePracticePolicy) score += 4;
  if (policy.supervisionRecordTemplate) score += 3;
  if (policy.escalationProcedure) score += 3;
  if (policy.newStarterSupervisionPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    supervisionFramework: policy.supervisionFramework,
    frequencyStandards: policy.frequencyStandards,
    safeguardingRequirement: policy.safeguardingRequirement,
    reflectivePracticePolicy: policy.reflectivePracticePolicy,
    supervisionRecordTemplate: policy.supervisionRecordTemplate,
    escalationProcedure: policy.escalationProcedure,
    newStarterSupervisionPolicy: policy.newStarterSupervisionPolicy,
  };
}

// ── Evaluator 4: Supervisor Readiness (0-25) ───────────────────────────────

export function evaluateStaffSupervisionEffectivenessReadiness(
  training: StaffSupervisionEffectivenessTraining[],
): StaffSupervisionEffectivenessReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalSupervisors: 0, supervisionFacilitationSkillsRate: 0, reflectivePracticeKnowledgeRate: 0, safeguardingSupervisionSkillsRate: 0, performanceManagementSkillsRate: 0, mentoringCoachingSkillsRate: 0, documentationStandardsRate: 0 };
  }

  const supervisionFacilitationSkillsRate = pct(training.filter((t) => t.supervisionFacilitationSkills).length, n);
  const reflectivePracticeKnowledgeRate = pct(training.filter((t) => t.reflectivePracticeKnowledge).length, n);
  const safeguardingSupervisionSkillsRate = pct(training.filter((t) => t.safeguardingSupervisionSkills).length, n);
  const performanceManagementSkillsRate = pct(training.filter((t) => t.performanceManagementSkills).length, n);
  const mentoringCoachingSkillsRate = pct(training.filter((t) => t.mentoringCoachingSkills).length, n);
  const documentationStandardsRate = pct(training.filter((t) => t.documentationStandards).length, n);

  let score = 0;
  score += (supervisionFacilitationSkillsRate / 100) * 6;
  score += (reflectivePracticeKnowledgeRate / 100) * 5;
  score += (safeguardingSupervisionSkillsRate / 100) * 5;
  score += (performanceManagementSkillsRate / 100) * 4;
  score += (mentoringCoachingSkillsRate / 100) * 3;
  score += (documentationStandardsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalSupervisors: n, supervisionFacilitationSkillsRate, reflectivePracticeKnowledgeRate, safeguardingSupervisionSkillsRate, performanceManagementSkillsRate, mentoringCoachingSkillsRate, documentationStandardsRate };
}

// ── Build Staff Supervision Profiles ───────────────────────────────────────

export function buildStaffSupervisionProfiles(
  records: StaffSupervisionEffectivenessRecord[],
): StaffSupervisionEffectivenessProfile[] {
  if (records.length === 0) return [];

  const staffMap = new Map<string, { staffId: string; staffName: string; records: StaffSupervisionEffectivenessRecord[] }>();

  for (const r of records) {
    if (!staffMap.has(r.staffId)) {
      staffMap.set(r.staffId, { staffId: r.staffId, staffName: r.staffName, records: [] });
    }
    staffMap.get(r.staffId)!.records.push(r);
  }

  return Array.from(staffMap.values()).map((staff) => {
    const totalRecords = staff.records.length;
    const safeguardingDiscussedRate = pct(staff.records.filter((r) => r.safeguardingDiscussed).length, totalRecords);
    const wellbeingCheckedRate = pct(staff.records.filter((r) => r.wellbeingChecked).length, totalRecords);
    const uniqueCategoriesSet = new Set(staff.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (safeguardingDiscussedRate >= 80) rate1Score = 3;
    else if (safeguardingDiscussedRate >= 60) rate1Score = 2;
    else if (safeguardingDiscussedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (wellbeingCheckedRate >= 80) rate2Score = 3;
    else if (wellbeingCheckedRate >= 60) rate2Score = 2;
    else if (wellbeingCheckedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { staffId: staff.staffId, staffName: staff.staffName, totalRecords, safeguardingDiscussedRate, wellbeingCheckedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateStaffSupervisionEffectivenessIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: StaffSupervisionEffectivenessRecord[];
  policy: StaffSupervisionEffectivenessPolicy | null;
  training: StaffSupervisionEffectivenessTraining[];
}

export function generateStaffSupervisionEffectivenessIntelligence(
  input: GenerateStaffSupervisionEffectivenessIntelligenceInput,
): StaffSupervisionEffectivenessIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, training } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateStaffSupervisionEffectivenessQuality(periodRecords);
  const complianceResult = evaluateStaffSupervisionEffectivenessCompliance(periodRecords);
  const policyResult = evaluateStaffSupervisionEffectivenessPolicy(policy);
  const readinessResult = evaluateStaffSupervisionEffectivenessReadiness(training);

  const staffProfiles = buildStaffSupervisionProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + readinessResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Staff supervision effectiveness rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Staff supervision effectiveness rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Supervision quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Supervision compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Supervision policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (readinessResult.overallScore >= 20) strengths.push("Supervisor readiness is strong (score " + readinessResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.safeguardingDiscussedRate >= 90) strengths.push("Safeguarding discussed in " + qualityResult.safeguardingDiscussedRate + "% of supervision sessions");
  if (periodRecords.length > 0 && qualityResult.wellbeingCheckedRate >= 90) strengths.push("Staff wellbeing checked in " + qualityResult.wellbeingCheckedRate + "% of supervision sessions");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Staff supervision effectiveness rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Staff supervision effectiveness Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Supervision quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Supervision compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Supervision policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (readinessResult.overallScore < 15) areasForImprovement.push("Supervisor readiness needs improvement (score " + readinessResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.safeguardingDiscussedRate < 80) areasForImprovement.push("Safeguarding discussed in only " + qualityResult.safeguardingDiscussedRate + "% of sessions — must improve");
  if (periodRecords.length === 0) areasForImprovement.push("No supervision records — supervision sessions must be documented");
  if (policy === null) areasForImprovement.push("No supervision policy in place — statutory requirement");
  if (training.length === 0) areasForImprovement.push("No supervisor training records — training required for all supervisors");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No supervision policy — develop and implement comprehensive supervision framework immediately");
  if (training.length === 0) actions.push("URGENT: No supervisor training — schedule supervision skills training for all supervisors");
  if (periodRecords.length > 0 && qualityResult.safeguardingDiscussedRate < 50) actions.push("HIGH: Safeguarding discussed in only " + qualityResult.safeguardingDiscussedRate + "% of sessions — embed safeguarding in supervision agenda");
  if (periodRecords.length > 0 && qualityResult.wellbeingCheckedRate < 50) actions.push("HIGH: Wellbeing checked in only " + qualityResult.wellbeingCheckedRate + "% of sessions — embed wellbeing checks in every session");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all supervision must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (training.length > 0 && readinessResult.supervisionFacilitationSkillsRate < 50) actions.push("MEDIUM: Supervision facilitation skills at " + readinessResult.supervisionFacilitationSkillsRate + "% — schedule training for supervisors");
  const lowScoreStaff = staffProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreStaff.length > 0) actions.push("MEDIUM: " + lowScoreStaff.length + " staff member(s) with low supervision scores — review individual supervision provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Supervision systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 33 — Employment of staff (supervision)",
    "CHR 2015 Reg 32 — Fitness of workers",
    "CHR 2015 Reg 13 — Leadership and management",
    "NMS 19 — Staffing",
    "SCCIF — Effectiveness of leaders and managers",
    "Quality Standards 2015 — Standard 7 (workforce)",
    "KCSIE 2024 — Supervision requirements",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    staffSupervisionEffectivenessQuality: qualityResult,
    staffSupervisionEffectivenessCompliance: complianceResult,
    staffSupervisionEffectivenessPolicy: policyResult,
    supervisorReadiness: readinessResult,
    staffProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
