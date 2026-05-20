/* ──────────────────────────────────────────────────────────────
   Pocket Money Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of pocket money management in residential
   care homes.

   Regulatory basis:
     - CHR 2015 Reg 9 — Positive relationships
     - CHR 2015 Reg 12 — Contact and independence
     - NMS 12 — Pocket money and personal possessions
     - SCCIF — Experiences and progress
     - Children Act 1989 s.22 — Duty to safeguard welfare
     - Quality Standards 2015 Standard 4
     - Financial Conduct Authority guidelines for looked-after children

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type PocketMoneyCategory =
  | "weekly_allowance"
  | "birthday_money"
  | "savings_deposit"
  | "educational_purchase"
  | "clothing_allowance"
  | "activity_funding"
  | "personal_spending"
  | "financial_literacy_session";

export type PocketMoneyOutcome =
  | "properly_recorded"
  | "partially_recorded"
  | "late_recording"
  | "unrecorded"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const pocketMoneyCategoryLabels: Record<PocketMoneyCategory, string> = {
  weekly_allowance: "Weekly Allowance",
  birthday_money: "Birthday Money",
  savings_deposit: "Savings Deposit",
  educational_purchase: "Educational Purchase",
  clothing_allowance: "Clothing Allowance",
  activity_funding: "Activity Funding",
  personal_spending: "Personal Spending",
  financial_literacy_session: "Financial Literacy Session",
};

const pocketMoneyOutcomeLabels: Record<PocketMoneyOutcome, string> = {
  properly_recorded: "Properly Recorded",
  partially_recorded: "Partially Recorded",
  late_recording: "Late Recording",
  unrecorded: "Unrecorded",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getPocketMoneyCategoryLabel(category: PocketMoneyCategory): string {
  return pocketMoneyCategoryLabels[category];
}

export function getPocketMoneyOutcomeLabel(outcome: PocketMoneyOutcome): string {
  return pocketMoneyOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface PocketMoneyRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: PocketMoneyCategory;
  outcome: PocketMoneyOutcome;
  receiptObtained: boolean;
  childConsentRecorded: boolean;
  balanceUpdated: boolean;
  supervisorApproved: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface PocketMoneyPolicy {
  pocketMoneyPolicy: boolean;
  savingsAccountPolicy: boolean;
  spendingApprovalProcess: boolean;
  financialRecordKeepingPolicy: boolean;
  financialLiteracyProgramme: boolean;
  birthdayChristmasMoneyPolicy: boolean;
  independentSpendingGuidance: boolean;
}

export interface StaffPocketMoneyTraining {
  staffId: string;
  financialManagementKnowledge: boolean;
  recordKeepingSkills: boolean;
  childConsentPractice: boolean;
  savingsGuidanceSkills: boolean;
  financialLiteracyDelivery: boolean;
  budgetingSupport: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface PocketMoneyQualityResult {
  overallScore: number;
  totalRecords: number;
  receiptObtainedRate: number;
  childConsentRecordedRate: number;
  balanceUpdatedRate: number;
  supervisorApprovedRate: number;
}

export interface PocketMoneyComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  receiptObtainedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface PocketMoneyPolicyResult {
  overallScore: number;
  pocketMoneyPolicy: boolean;
  savingsAccountPolicy: boolean;
  spendingApprovalProcess: boolean;
  financialRecordKeepingPolicy: boolean;
  financialLiteracyProgramme: boolean;
  birthdayChristmasMoneyPolicy: boolean;
  independentSpendingGuidance: boolean;
}

export interface StaffPocketMoneyReadinessResult {
  overallScore: number;
  totalStaff: number;
  financialManagementKnowledgeRate: number;
  recordKeepingSkillsRate: number;
  childConsentPracticeRate: number;
  savingsGuidanceSkillsRate: number;
  financialLiteracyDeliveryRate: number;
  budgetingSupportRate: number;
}

export interface ChildPocketMoneyProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  receiptObtainedRate: number;
  childConsentRecordedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface PocketMoneyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  pocketMoneyQuality: PocketMoneyQualityResult;
  pocketMoneyCompliance: PocketMoneyComplianceResult;
  pocketMoneyPolicy: PocketMoneyPolicyResult;
  staffReadiness: StaffPocketMoneyReadinessResult;
  childProfiles: ChildPocketMoneyProfile[];
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

export function evaluatePocketMoneyQuality(
  records: PocketMoneyRecord[],
): PocketMoneyQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, receiptObtainedRate: 0, childConsentRecordedRate: 0, balanceUpdatedRate: 0, supervisorApprovedRate: 0 };
  }

  const receiptObtainedRate = pct(records.filter((r) => r.receiptObtained).length, n);
  const childConsentRecordedRate = pct(records.filter((r) => r.childConsentRecorded).length, n);
  const balanceUpdatedRate = pct(records.filter((r) => r.balanceUpdated).length, n);
  const supervisorApprovedRate = pct(records.filter((r) => r.supervisorApproved).length, n);

  let score = 0;
  score += (receiptObtainedRate / 100) * 7;
  score += (childConsentRecordedRate / 100) * 6;
  score += (balanceUpdatedRate / 100) * 6;
  score += (supervisorApprovedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, receiptObtainedRate, childConsentRecordedRate, balanceUpdatedRate, supervisorApprovedRate };
}

// ── Evaluator 2: Compliance (0-25) ─────────────────────────────────────────

export function evaluatePocketMoneyCompliance(
  records: PocketMoneyRecord[],
): PocketMoneyComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, receiptObtainedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const receiptObtainedRate = pct(records.filter((r) => r.receiptObtained).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (receiptObtainedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, receiptObtainedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ─────────────────────────────────────────────

export function evaluatePocketMoneyPolicy(
  policy: PocketMoneyPolicy | null,
): PocketMoneyPolicyResult {
  if (policy === null) {
    return { overallScore: 0, pocketMoneyPolicy: false, savingsAccountPolicy: false, spendingApprovalProcess: false, financialRecordKeepingPolicy: false, financialLiteracyProgramme: false, birthdayChristmasMoneyPolicy: false, independentSpendingGuidance: false };
  }

  let score = 0;
  if (policy.pocketMoneyPolicy) score += 4;
  if (policy.savingsAccountPolicy) score += 4;
  if (policy.spendingApprovalProcess) score += 4;
  if (policy.financialRecordKeepingPolicy) score += 4;
  if (policy.financialLiteracyProgramme) score += 3;
  if (policy.birthdayChristmasMoneyPolicy) score += 3;
  if (policy.independentSpendingGuidance) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    pocketMoneyPolicy: policy.pocketMoneyPolicy,
    savingsAccountPolicy: policy.savingsAccountPolicy,
    spendingApprovalProcess: policy.spendingApprovalProcess,
    financialRecordKeepingPolicy: policy.financialRecordKeepingPolicy,
    financialLiteracyProgramme: policy.financialLiteracyProgramme,
    birthdayChristmasMoneyPolicy: policy.birthdayChristmasMoneyPolicy,
    independentSpendingGuidance: policy.independentSpendingGuidance,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ────────────────────────────────────

export function evaluateStaffPocketMoneyReadiness(
  training: StaffPocketMoneyTraining[],
): StaffPocketMoneyReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, financialManagementKnowledgeRate: 0, recordKeepingSkillsRate: 0, childConsentPracticeRate: 0, savingsGuidanceSkillsRate: 0, financialLiteracyDeliveryRate: 0, budgetingSupportRate: 0 };
  }

  const financialManagementKnowledgeRate = pct(training.filter((t) => t.financialManagementKnowledge).length, n);
  const recordKeepingSkillsRate = pct(training.filter((t) => t.recordKeepingSkills).length, n);
  const childConsentPracticeRate = pct(training.filter((t) => t.childConsentPractice).length, n);
  const savingsGuidanceSkillsRate = pct(training.filter((t) => t.savingsGuidanceSkills).length, n);
  const financialLiteracyDeliveryRate = pct(training.filter((t) => t.financialLiteracyDelivery).length, n);
  const budgetingSupportRate = pct(training.filter((t) => t.budgetingSupport).length, n);

  let score = 0;
  score += (financialManagementKnowledgeRate / 100) * 6;
  score += (recordKeepingSkillsRate / 100) * 5;
  score += (childConsentPracticeRate / 100) * 5;
  score += (savingsGuidanceSkillsRate / 100) * 4;
  score += (financialLiteracyDeliveryRate / 100) * 3;
  score += (budgetingSupportRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, financialManagementKnowledgeRate, recordKeepingSkillsRate, childConsentPracticeRate, savingsGuidanceSkillsRate, financialLiteracyDeliveryRate, budgetingSupportRate };
}

// ── Build Child Pocket Money Profiles ──────────────────────────────────────

export function buildChildPocketMoneyProfiles(
  records: PocketMoneyRecord[],
): ChildPocketMoneyProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: PocketMoneyRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const receiptObtainedRate = pct(child.records.filter((r) => r.receiptObtained).length, totalRecords);
    const childConsentRecordedRate = pct(child.records.filter((r) => r.childConsentRecorded).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (receiptObtainedRate >= 80) rate1Score = 3;
    else if (receiptObtainedRate >= 60) rate1Score = 2;
    else if (receiptObtainedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (childConsentRecordedRate >= 80) rate2Score = 3;
    else if (childConsentRecordedRate >= 60) rate2Score = 2;
    else if (childConsentRecordedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, receiptObtainedRate, childConsentRecordedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GeneratePocketMoneyIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: PocketMoneyRecord[];
  policy: PocketMoneyPolicy | null;
  staff: StaffPocketMoneyTraining[];
}

export function generatePocketMoneyIntelligence(
  input: GeneratePocketMoneyIntelligenceInput,
): PocketMoneyIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluatePocketMoneyQuality(periodRecords);
  const complianceResult = evaluatePocketMoneyCompliance(periodRecords);
  const policyResult = evaluatePocketMoneyPolicy(policy);
  const staffResult = evaluateStaffPocketMoneyReadiness(staff);

  const childProfiles = buildChildPocketMoneyProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  // ── Strengths ──────────────────────────────────────────────────────────
  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Pocket money management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Pocket money management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Financial quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Financial compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Financial policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff financial readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.receiptObtainedRate >= 90) strengths.push("Receipt obtainment rate at " + qualityResult.receiptObtainedRate + "%");
  if (periodRecords.length > 0 && qualityResult.childConsentRecordedRate >= 90) strengths.push("Child consent recording at " + qualityResult.childConsentRecordedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  // ── Areas for improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Pocket money management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Pocket money management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Financial quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Financial compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Financial policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff financial readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.receiptObtainedRate < 80) areasForImprovement.push("Receipt obtainment at " + qualityResult.receiptObtainedRate + "% — must improve for audit trail");
  if (periodRecords.length === 0) areasForImprovement.push("No pocket money records — financial transactions must be documented");
  if (policy === null) areasForImprovement.push("No pocket money policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff financial training records — training required");

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No pocket money policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff financial training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.receiptObtainedRate < 50) actions.push("HIGH: Receipt obtainment at " + qualityResult.receiptObtainedRate + "% — review receipt processes");
  if (periodRecords.length > 0 && qualityResult.childConsentRecordedRate < 50) actions.push("HIGH: Child consent recording at " + qualityResult.childConsentRecordedRate + "% — ensure consent is consistently captured");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all transactions must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.financialManagementKnowledgeRate < 50) actions.push("MEDIUM: Financial management knowledge at " + staffResult.financialManagementKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low financial management scores — review individual care plans");
  if (actions.length === 0) actions.push("No immediate actions required. Pocket money systems operating within expected standards.");

  // ── Regulatory links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 9 — Positive relationships",
    "CHR 2015 Reg 12 — Contact and independence",
    "NMS 12 — Pocket money and personal possessions",
    "SCCIF — Experiences and progress",
    "Children Act 1989 s.22 — Duty to safeguard welfare",
    "Quality Standards 2015 Standard 4",
    "Financial Conduct Authority guidelines for looked-after children",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    pocketMoneyQuality: qualityResult,
    pocketMoneyCompliance: complianceResult,
    pocketMoneyPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
