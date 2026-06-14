/* ──────────────────────────────────────────────────────────────
   Cara Learning Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of Cara agent learning, cost reduction, and
   organisational AI capability in children's residential care.

   Regulatory basis:
     - CHR 2015 Reg 13 — Leadership and management
     - CHR 2015 Reg 22 — Use of technology
     - NMS 22 — Technology and e-safety
     - SCCIF — Leadership and management
     - Data Protection Act 2018 — AI data handling
     - Quality Standards 2015 — Standard 9 (leadership)
     - ICO AI Governance guidance

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type CaraLearningCategory =
  | "agent_task_completion"
  | "cost_reduction_analysis"
  | "learning_pattern_identification"
  | "knowledge_base_update"
  | "agent_capability_assessment"
  | "resolution_tier_evaluation"
  | "replacement_readiness_review"
  | "performance_benchmark";

export type CaraLearningOutcome =
  | "exceeds_target"
  | "meets_target"
  | "approaching_target"
  | "below_target"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const caraLearningCategoryLabels: Record<CaraLearningCategory, string> = {
  agent_task_completion: "Agent Task Completion",
  cost_reduction_analysis: "Cost Reduction Analysis",
  learning_pattern_identification: "Learning Pattern Identification",
  knowledge_base_update: "Knowledge Base Update",
  agent_capability_assessment: "Agent Capability Assessment",
  resolution_tier_evaluation: "Resolution Tier Evaluation",
  replacement_readiness_review: "Replacement Readiness Review",
  performance_benchmark: "Performance Benchmark",
};

const caraLearningOutcomeLabels: Record<CaraLearningOutcome, string> = {
  exceeds_target: "Exceeds Target",
  meets_target: "Meets Target",
  approaching_target: "Approaching Target",
  below_target: "Below Target",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getCaraLearningCategoryLabel(category: CaraLearningCategory): string {
  return caraLearningCategoryLabels[category];
}

export function getCaraLearningOutcomeLabel(outcome: CaraLearningOutcome): string {
  return caraLearningOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface CaraLearningRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: CaraLearningCategory;
  outcome: CaraLearningOutcome;
  taskCompletedAccurately: boolean;
  costEfficiencyMaintained: boolean;
  learningDocumented: boolean;
  qualityAssurancePassed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface CaraLearningPolicy {
  agentLearningPolicy: boolean;
  costReductionFramework: boolean;
  qualityAssurancePolicy: boolean;
  dataProtectionForAgents: boolean;
  performanceBenchmarkingPolicy: boolean;
  humanOversightPolicy: boolean;
  agentCapabilityReviewPolicy: boolean;
}

export interface StaffCaraLearningTraining {
  staffId: string;
  agentManagementKnowledge: boolean;
  costAnalysisSkills: boolean;
  qualityAssuranceSkills: boolean;
  dataInterpretationSkills: boolean;
  performanceMonitoringSkills: boolean;
  humanOversightCapability: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface CaraLearningQualityResult {
  overallScore: number;
  totalRecords: number;
  taskCompletedAccuratelyRate: number;
  costEfficiencyMaintainedRate: number;
  learningDocumentedRate: number;
  qualityAssurancePassedRate: number;
}

export interface CaraLearningComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  taskCompletedAccuratelyRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface CaraLearningPolicyResult {
  overallScore: number;
  agentLearningPolicy: boolean;
  costReductionFramework: boolean;
  qualityAssurancePolicy: boolean;
  dataProtectionForAgents: boolean;
  performanceBenchmarkingPolicy: boolean;
  humanOversightPolicy: boolean;
  agentCapabilityReviewPolicy: boolean;
}

export interface StaffCaraLearningReadinessResult {
  overallScore: number;
  totalStaff: number;
  agentManagementKnowledgeRate: number;
  costAnalysisSkillsRate: number;
  qualityAssuranceSkillsRate: number;
  dataInterpretationSkillsRate: number;
  performanceMonitoringSkillsRate: number;
  humanOversightCapabilityRate: number;
}

export interface ChildCaraLearningProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  taskCompletedAccuratelyRate: number;
  costEfficiencyMaintainedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface CaraLearningIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  caraLearningQuality: CaraLearningQualityResult;
  caraLearningCompliance: CaraLearningComplianceResult;
  caraLearningPolicy: CaraLearningPolicyResult;
  staffReadiness: StaffCaraLearningReadinessResult;
  childProfiles: ChildCaraLearningProfile[];
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

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateCaraLearningQuality(
  records: CaraLearningRecord[],
): CaraLearningQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, taskCompletedAccuratelyRate: 0, costEfficiencyMaintainedRate: 0, learningDocumentedRate: 0, qualityAssurancePassedRate: 0 };
  }

  const taskCompletedAccuratelyRate = pct(records.filter((r) => r.taskCompletedAccurately).length, n);
  const costEfficiencyMaintainedRate = pct(records.filter((r) => r.costEfficiencyMaintained).length, n);
  const learningDocumentedRate = pct(records.filter((r) => r.learningDocumented).length, n);
  const qualityAssurancePassedRate = pct(records.filter((r) => r.qualityAssurancePassed).length, n);

  let score = 0;
  score += (taskCompletedAccuratelyRate / 100) * 7;
  score += (costEfficiencyMaintainedRate / 100) * 6;
  score += (learningDocumentedRate / 100) * 6;
  score += (qualityAssurancePassedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, taskCompletedAccuratelyRate, costEfficiencyMaintainedRate, learningDocumentedRate, qualityAssurancePassedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateCaraLearningCompliance(
  records: CaraLearningRecord[],
): CaraLearningComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, taskCompletedAccuratelyRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const taskCompletedAccuratelyRate = pct(records.filter((r) => r.taskCompletedAccurately).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (taskCompletedAccuratelyRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, taskCompletedAccuratelyRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateCaraLearningPolicy(
  policy: CaraLearningPolicy | null,
): CaraLearningPolicyResult {
  if (policy === null) {
    return { overallScore: 0, agentLearningPolicy: false, costReductionFramework: false, qualityAssurancePolicy: false, dataProtectionForAgents: false, performanceBenchmarkingPolicy: false, humanOversightPolicy: false, agentCapabilityReviewPolicy: false };
  }

  let score = 0;
  if (policy.agentLearningPolicy) score += 4;
  if (policy.costReductionFramework) score += 4;
  if (policy.qualityAssurancePolicy) score += 4;
  if (policy.dataProtectionForAgents) score += 4;
  if (policy.performanceBenchmarkingPolicy) score += 3;
  if (policy.humanOversightPolicy) score += 3;
  if (policy.agentCapabilityReviewPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    agentLearningPolicy: policy.agentLearningPolicy,
    costReductionFramework: policy.costReductionFramework,
    qualityAssurancePolicy: policy.qualityAssurancePolicy,
    dataProtectionForAgents: policy.dataProtectionForAgents,
    performanceBenchmarkingPolicy: policy.performanceBenchmarkingPolicy,
    humanOversightPolicy: policy.humanOversightPolicy,
    agentCapabilityReviewPolicy: policy.agentCapabilityReviewPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffCaraLearningReadiness(
  training: StaffCaraLearningTraining[],
): StaffCaraLearningReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, agentManagementKnowledgeRate: 0, costAnalysisSkillsRate: 0, qualityAssuranceSkillsRate: 0, dataInterpretationSkillsRate: 0, performanceMonitoringSkillsRate: 0, humanOversightCapabilityRate: 0 };
  }

  const agentManagementKnowledgeRate = pct(training.filter((t) => t.agentManagementKnowledge).length, n);
  const costAnalysisSkillsRate = pct(training.filter((t) => t.costAnalysisSkills).length, n);
  const qualityAssuranceSkillsRate = pct(training.filter((t) => t.qualityAssuranceSkills).length, n);
  const dataInterpretationSkillsRate = pct(training.filter((t) => t.dataInterpretationSkills).length, n);
  const performanceMonitoringSkillsRate = pct(training.filter((t) => t.performanceMonitoringSkills).length, n);
  const humanOversightCapabilityRate = pct(training.filter((t) => t.humanOversightCapability).length, n);

  let score = 0;
  score += (agentManagementKnowledgeRate / 100) * 6;
  score += (costAnalysisSkillsRate / 100) * 5;
  score += (qualityAssuranceSkillsRate / 100) * 5;
  score += (dataInterpretationSkillsRate / 100) * 4;
  score += (performanceMonitoringSkillsRate / 100) * 3;
  score += (humanOversightCapabilityRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, agentManagementKnowledgeRate, costAnalysisSkillsRate, qualityAssuranceSkillsRate, dataInterpretationSkillsRate, performanceMonitoringSkillsRate, humanOversightCapabilityRate };
}

// ── Build Child Cara Learning Profiles ──────────────────────────────────

export function buildChildCaraLearningProfiles(
  records: CaraLearningRecord[],
): ChildCaraLearningProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: CaraLearningRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const taskCompletedAccuratelyRate = pct(child.records.filter((r) => r.taskCompletedAccurately).length, totalRecords);
    const costEfficiencyMaintainedRate = pct(child.records.filter((r) => r.costEfficiencyMaintained).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (taskCompletedAccuratelyRate >= 80) rate1Score = 3;
    else if (taskCompletedAccuratelyRate >= 60) rate1Score = 2;
    else if (taskCompletedAccuratelyRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (costEfficiencyMaintainedRate >= 80) rate2Score = 3;
    else if (costEfficiencyMaintainedRate >= 60) rate2Score = 2;
    else if (costEfficiencyMaintainedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, taskCompletedAccuratelyRate, costEfficiencyMaintainedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateCaraLearningIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: CaraLearningRecord[];
  policy: CaraLearningPolicy | null;
  staff: StaffCaraLearningTraining[];
}

export function generateCaraLearningIntelligence(
  input: GenerateCaraLearningIntelligenceInput,
): CaraLearningIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateCaraLearningQuality(periodRecords);
  const complianceResult = evaluateCaraLearningCompliance(periodRecords);
  const policyResult = evaluateCaraLearningPolicy(policy);
  const staffResult = evaluateStaffCaraLearningReadiness(staff);

  const childProfiles = buildChildCaraLearningProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Cara learning capability rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Cara learning capability rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Cara learning quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Cara learning compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Cara learning policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff Cara learning readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.taskCompletedAccuratelyRate >= 90) strengths.push("Task completion accuracy at " + qualityResult.taskCompletedAccuratelyRate + "%");
  if (periodRecords.length > 0 && qualityResult.costEfficiencyMaintainedRate >= 90) strengths.push("Cost efficiency maintained at " + qualityResult.costEfficiencyMaintainedRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Cara learning capability rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Cara learning capability Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Cara learning quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Cara learning compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Cara learning policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff Cara learning readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.costEfficiencyMaintainedRate < 80) areasForImprovement.push("Cost efficiency at " + qualityResult.costEfficiencyMaintainedRate + "% — must improve");
  if (periodRecords.length === 0) areasForImprovement.push("No Cara learning records — agent learning must be documented");
  if (policy === null) areasForImprovement.push("No Cara learning policy in place — governance requirement");
  if (staff.length === 0) areasForImprovement.push("No staff Cara learning training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No Cara learning policy — develop and implement comprehensive agent governance framework immediately");
  if (staff.length === 0) actions.push("URGENT: No staff Cara learning training — schedule training for all care staff");
  if (periodRecords.length > 0 && qualityResult.taskCompletedAccuratelyRate < 50) actions.push("HIGH: Task completion accuracy at " + qualityResult.taskCompletedAccuratelyRate + "% — review agent configuration and training data");
  if (periodRecords.length > 0 && qualityResult.costEfficiencyMaintainedRate < 50) actions.push("HIGH: Cost efficiency at " + qualityResult.costEfficiencyMaintainedRate + "% — review agent usage patterns and optimise");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all agent activities must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.agentManagementKnowledgeRate < 50) actions.push("MEDIUM: Agent management knowledge at " + staffResult.agentManagementKnowledgeRate + "% — schedule training");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low Cara learning engagement scores — review individual agent support plans");
  if (actions.length === 0) actions.push("No immediate actions required. Cara learning systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 13 — Leadership and management",
    "CHR 2015 Reg 22 — Use of technology",
    "NMS 22 — Technology and e-safety",
    "SCCIF — Leadership and management",
    "Data Protection Act 2018 — AI data handling",
    "Quality Standards 2015 — Standard 9 (leadership)",
    "ICO AI Governance guidance",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    caraLearningQuality: qualityResult,
    caraLearningCompliance: complianceResult,
    caraLearningPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
