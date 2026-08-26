/* ──────────────────────────────────────────────────────────────
   Children Outcomes Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of children's outcomes tracking in residential
   care homes.

   Regulatory basis:
     - CHR 2015 Reg 6 — Quality of care standard
     - CHR 2015 Reg 8 — Education
     - CHR 2015 Reg 10 — Health
     - Children Act 1989 s.22(3A) — Duty to promote welfare
     - SCCIF — Experiences and progress
     - NMS 1 — Statement of purpose
     - Quality Standards 2015 — Children's outcomes

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";
import { below, meets, rate } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type ChildrenOutcomesCategory =
  | "educational_achievement"
  | "health_wellbeing"
  | "emotional_development"
  | "social_skills"
  | "independent_living"
  | "identity_belonging"
  | "positive_relationships"
  | "safety_stability";

export type ChildrenOutcomesOutcome =
  | "exceptional_progress"
  | "good_progress"
  | "steady_progress"
  | "limited_progress"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const childrenOutcomesCategoryLabels: Record<ChildrenOutcomesCategory, string> = {
  educational_achievement: "Educational Achievement",
  health_wellbeing: "Health & Wellbeing",
  emotional_development: "Emotional Development",
  social_skills: "Social Skills",
  independent_living: "Independent Living",
  identity_belonging: "Identity & Belonging",
  positive_relationships: "Positive Relationships",
  safety_stability: "Safety & Stability",
};

const childrenOutcomesOutcomeLabels: Record<ChildrenOutcomesOutcome, string> = {
  exceptional_progress: "Exceptional Progress",
  good_progress: "Good Progress",
  steady_progress: "Steady Progress",
  limited_progress: "Limited Progress",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getChildrenOutcomesCategoryLabel(category: ChildrenOutcomesCategory): string {
  return childrenOutcomesCategoryLabels[category];
}

export function getChildrenOutcomesOutcomeLabel(outcome: ChildrenOutcomesOutcome): string {
  return childrenOutcomesOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface ChildrenOutcomesRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: ChildrenOutcomesCategory;
  outcome: ChildrenOutcomesOutcome;
  outcomeMeasured: boolean;
  progressEvidenced: boolean;
  interventionAligned: boolean;
  voiceOfChildCaptured: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface ChildrenOutcomesPolicy {
  outcomesFrameworkPolicy: boolean;
  progressTrackingPolicy: boolean;
  educationSupportPolicy: boolean;
  healthWellbeingPolicy: boolean;
  independentLivingSkillsPolicy: boolean;
  voiceOfChildPolicy: boolean;
  multiAgencyOutcomesPolicy: boolean;
}

export interface StaffChildrenOutcomesTraining {
  staffId: string;
  outcomesFrameworkKnowledge: boolean;
  progressTrackingSkills: boolean;
  therapeuticInterventions: boolean;
  educationalSupportSkills: boolean;
  voiceOfChildTechniques: boolean;
  multiAgencyCollaboration: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ChildrenOutcomesQualityResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  outcomeMeasuredRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  progressEvidencedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  interventionAlignedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  voiceOfChildCapturedRate: number | null;
}

export interface ChildrenOutcomesComplianceResult {
  overallScore: number;
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  documentationCompleteRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  timelyRecordingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  outcomeMeasuredRate: number | null;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface ChildrenOutcomesPolicyResult {
  overallScore: number;
  outcomesFrameworkPolicy: boolean;
  progressTrackingPolicy: boolean;
  educationSupportPolicy: boolean;
  healthWellbeingPolicy: boolean;
  independentLivingSkillsPolicy: boolean;
  voiceOfChildPolicy: boolean;
  multiAgencyOutcomesPolicy: boolean;
}

export interface StaffChildrenOutcomesReadinessResult {
  overallScore: number;
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  outcomesFrameworkKnowledgeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  progressTrackingSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  therapeuticInterventionsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  educationalSupportSkillsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  voiceOfChildTechniquesRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  multiAgencyCollaborationRate: number | null;
}

export interface ChildOutcomesProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  outcomeMeasuredRate: number;
  progressEvidencedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface ChildrenOutcomesIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  childrenOutcomesQuality: ChildrenOutcomesQualityResult;
  childrenOutcomesCompliance: ChildrenOutcomesComplianceResult;
  childrenOutcomesPolicy: ChildrenOutcomesPolicyResult;
  staffReadiness: StaffChildrenOutcomesReadinessResult;
  childProfiles: ChildOutcomesProfile[];
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

// ── Evaluator 1: Quality (0-25) ──────────────────────────────────────────

export function evaluateChildrenOutcomesQuality(
  records: ChildrenOutcomesRecord[],
): ChildrenOutcomesQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, outcomeMeasuredRate: null, progressEvidencedRate: null, interventionAlignedRate: null, voiceOfChildCapturedRate: null };
  }

  const outcomeMeasuredRate = rate(records.filter((r) => r.outcomeMeasured).length, n);
  const progressEvidencedRate = rate(records.filter((r) => r.progressEvidenced).length, n);
  const interventionAlignedRate = rate(records.filter((r) => r.interventionAligned).length, n);
  const voiceOfChildCapturedRate = rate(records.filter((r) => r.voiceOfChildCaptured).length, n);

  let score = 0;
  score += ((outcomeMeasuredRate ?? 0) / 100) * 7;
  score += ((progressEvidencedRate ?? 0) / 100) * 6;
  score += ((interventionAlignedRate ?? 0) / 100) * 6;
  score += ((voiceOfChildCapturedRate ?? 0) / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, outcomeMeasuredRate, progressEvidencedRate, interventionAlignedRate, voiceOfChildCapturedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateChildrenOutcomesCompliance(
  records: ChildrenOutcomesRecord[],
): ChildrenOutcomesComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: null, timelyRecordingRate: null, outcomeMeasuredRate: null, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = rate(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = rate(records.filter((r) => r.timelyRecording).length, n);
  const outcomeMeasuredRate = rate(records.filter((r) => r.outcomeMeasured).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += ((documentationCompleteRate ?? 0) / 100) * 8;
  score += ((timelyRecordingRate ?? 0) / 100) * 7;
  score += ((outcomeMeasuredRate ?? 0) / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, outcomeMeasuredRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateChildrenOutcomesPolicy(
  policy: ChildrenOutcomesPolicy | null,
): ChildrenOutcomesPolicyResult {
  if (policy === null) {
    return { overallScore: 0, outcomesFrameworkPolicy: false, progressTrackingPolicy: false, educationSupportPolicy: false, healthWellbeingPolicy: false, independentLivingSkillsPolicy: false, voiceOfChildPolicy: false, multiAgencyOutcomesPolicy: false };
  }

  let score = 0;
  if (policy.outcomesFrameworkPolicy) score += 4;
  if (policy.progressTrackingPolicy) score += 4;
  if (policy.educationSupportPolicy) score += 4;
  if (policy.healthWellbeingPolicy) score += 4;
  if (policy.independentLivingSkillsPolicy) score += 3;
  if (policy.voiceOfChildPolicy) score += 3;
  if (policy.multiAgencyOutcomesPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    outcomesFrameworkPolicy: policy.outcomesFrameworkPolicy,
    progressTrackingPolicy: policy.progressTrackingPolicy,
    educationSupportPolicy: policy.educationSupportPolicy,
    healthWellbeingPolicy: policy.healthWellbeingPolicy,
    independentLivingSkillsPolicy: policy.independentLivingSkillsPolicy,
    voiceOfChildPolicy: policy.voiceOfChildPolicy,
    multiAgencyOutcomesPolicy: policy.multiAgencyOutcomesPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffChildrenOutcomesReadiness(
  training: StaffChildrenOutcomesTraining[],
): StaffChildrenOutcomesReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, outcomesFrameworkKnowledgeRate: null, progressTrackingSkillsRate: null, therapeuticInterventionsRate: null, educationalSupportSkillsRate: null, voiceOfChildTechniquesRate: null, multiAgencyCollaborationRate: null };
  }

  const outcomesFrameworkKnowledgeRate = rate(training.filter((t) => t.outcomesFrameworkKnowledge).length, n);
  const progressTrackingSkillsRate = rate(training.filter((t) => t.progressTrackingSkills).length, n);
  const therapeuticInterventionsRate = rate(training.filter((t) => t.therapeuticInterventions).length, n);
  const educationalSupportSkillsRate = rate(training.filter((t) => t.educationalSupportSkills).length, n);
  const voiceOfChildTechniquesRate = rate(training.filter((t) => t.voiceOfChildTechniques).length, n);
  const multiAgencyCollaborationRate = rate(training.filter((t) => t.multiAgencyCollaboration).length, n);

  let score = 0;
  score += ((outcomesFrameworkKnowledgeRate ?? 0) / 100) * 6;
  score += ((progressTrackingSkillsRate ?? 0) / 100) * 5;
  score += ((therapeuticInterventionsRate ?? 0) / 100) * 5;
  score += ((educationalSupportSkillsRate ?? 0) / 100) * 4;
  score += ((voiceOfChildTechniquesRate ?? 0) / 100) * 3;
  score += ((multiAgencyCollaborationRate ?? 0) / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, outcomesFrameworkKnowledgeRate, progressTrackingSkillsRate, therapeuticInterventionsRate, educationalSupportSkillsRate, voiceOfChildTechniquesRate, multiAgencyCollaborationRate };
}

// ── Build Child Outcomes Profiles ────────────────────────────────────────

export function buildChildOutcomesProfiles(
  records: ChildrenOutcomesRecord[],
): ChildOutcomesProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: ChildrenOutcomesRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const outcomeMeasuredRate = rate(child.records.filter((r) => r.outcomeMeasured).length, totalRecords)!;
    const progressEvidencedRate = rate(child.records.filter((r) => r.progressEvidenced).length, totalRecords)!;
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (meets(outcomeMeasuredRate, 80)) rate1Score = 3;
    else if (meets(outcomeMeasuredRate, 60)) rate1Score = 2;
    else if (meets(outcomeMeasuredRate, 40)) rate1Score = 1;

    let rate2Score = 0;
    if (meets(progressEvidencedRate, 80)) rate2Score = 3;
    else if (meets(progressEvidencedRate, 60)) rate2Score = 2;
    else if (meets(progressEvidencedRate, 40)) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, outcomeMeasuredRate, progressEvidencedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateChildrenOutcomesIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: ChildrenOutcomesRecord[];
  policy: ChildrenOutcomesPolicy | null;
  staff: StaffChildrenOutcomesTraining[];
}

export function generateChildrenOutcomesIntelligence(
  input: GenerateChildrenOutcomesIntelligenceInput,
): ChildrenOutcomesIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateChildrenOutcomesQuality(periodRecords);
  const complianceResult = evaluateChildrenOutcomesCompliance(periodRecords);
  const policyResult = evaluateChildrenOutcomesPolicy(policy);
  const staffResult = evaluateStaffChildrenOutcomesReadiness(staff);

  const childProfiles = buildChildOutcomesProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Children outcomes rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Children outcomes rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Outcomes quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Outcomes compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Outcomes policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff outcomes readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && meets(qualityResult.outcomeMeasuredRate, 90)) strengths.push("Outcome measurement rate at " + qualityResult.outcomeMeasuredRate + "%");
  if (periodRecords.length > 0 && meets(qualityResult.progressEvidencedRate, 90)) strengths.push("Progress evidenced at " + qualityResult.progressEvidencedRate + "%");
  if (periodRecords.length > 0 && meets(complianceResult.documentationCompleteRate, 90)) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Children outcomes rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Children outcomes Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Outcomes quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Outcomes compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Outcomes policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff outcomes readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && below(qualityResult.outcomeMeasuredRate, 80)) areasForImprovement.push("Outcome measurement at " + qualityResult.outcomeMeasuredRate + "% — must improve for child welfare");
  if (periodRecords.length === 0) areasForImprovement.push("No outcomes records — outcomes must be documented");
  if (policy === null) areasForImprovement.push("No outcomes policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff outcomes training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No outcomes policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff outcomes training — schedule training for all staff");
  if (periodRecords.length > 0 && below(qualityResult.outcomeMeasuredRate, 50)) actions.push("HIGH: Outcome measurement at " + qualityResult.outcomeMeasuredRate + "% — review measurement processes");
  if (periodRecords.length > 0 && below(qualityResult.progressEvidencedRate, 50)) actions.push("HIGH: Progress evidencing at " + qualityResult.progressEvidencedRate + "% — ensure progress is consistently documented");
  if (periodRecords.length > 0 && below(complianceResult.documentationCompleteRate, 50)) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all outcomes must be recorded");
  if (periodRecords.length > 0 && below(complianceResult.timelyRecordingRate, 50)) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && below(staffResult.outcomesFrameworkKnowledgeRate, 50)) actions.push("MEDIUM: Outcomes framework knowledge at " + staffResult.outcomesFrameworkKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low outcomes scores — review individual care plans");
  if (actions.length === 0) actions.push("No immediate actions required. Children outcomes systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 6 — Quality of care standard",
    "CHR 2015 Reg 8 — Education",
    "CHR 2015 Reg 10 — Health",
    "Children Act 1989 s.22(3A) — Duty to promote welfare",
    "SCCIF — Experiences and progress",
    "NMS 1 — Statement of purpose",
    "Quality Standards 2015 — Children's outcomes",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    childrenOutcomesQuality: qualityResult,
    childrenOutcomesCompliance: complianceResult,
    childrenOutcomesPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
