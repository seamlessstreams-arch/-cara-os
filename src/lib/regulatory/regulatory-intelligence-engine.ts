/* ──────────────────────────────────────────────────────────────
   Regulatory Intelligence Engine

   Pure deterministic engine for evaluating regulatory compliance
   and reporting quality in children's residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 44/45 — Visits and reports
     - CHR 2015 Reg 40/41 — Notifications
     - NMS 15 — Notifications
     - SCCIF — Leadership and management
     - Children Act 1989
     - Quality Standards 2015 Standard 8
     - Ofsted inspection framework

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

import { withinPeriod } from "@/lib/date-period";

// ── Types ──────────────────────────────────────────────────────────────────

export type RegulatoryCategory =
  | "reg44_visit"
  | "reg45_report"
  | "ofsted_notification"
  | "schedule4_matter"
  | "statutory_notification"
  | "action_point_tracking"
  | "regulatory_inspection"
  | "compliance_audit";

export type RegulatoryOutcome =
  | "fully_compliant"
  | "partially_compliant"
  | "overdue"
  | "non_compliant"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const regulatoryCategoryLabels: Record<RegulatoryCategory, string> = {
  reg44_visit: "Reg 44 Visit",
  reg45_report: "Reg 45 Report",
  ofsted_notification: "Ofsted Notification",
  schedule4_matter: "Schedule 4 Matter",
  statutory_notification: "Statutory Notification",
  action_point_tracking: "Action Point Tracking",
  regulatory_inspection: "Regulatory Inspection",
  compliance_audit: "Compliance Audit",
};

const regulatoryOutcomeLabels: Record<RegulatoryOutcome, string> = {
  fully_compliant: "Fully Compliant",
  partially_compliant: "Partially Compliant",
  overdue: "Overdue",
  non_compliant: "Non-Compliant",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRegulatoryCategoryLabel(category: RegulatoryCategory): string {
  return regulatoryCategoryLabels[category];
}

export function getRegulatoryOutcomeLabel(outcome: RegulatoryOutcome): string {
  return regulatoryOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface RegulatoryRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: RegulatoryCategory;
  outcome: RegulatoryOutcome;
  reportAccurate: boolean;
  deadlineMet: boolean;
  evidenceAttached: boolean;
  actionPointsAddressed: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface RegulatoryPolicy {
  reg44VisitPolicy: boolean;
  reg45ReportingPolicy: boolean;
  ofstedNotificationPolicy: boolean;
  statutoryNotificationPolicy: boolean;
  actionPointTrackingPolicy: boolean;
  complianceAuditPolicy: boolean;
  regulatoryInspectionPolicy: boolean;
}

export interface StaffRegulatoryTraining {
  staffId: string;
  regulatoryKnowledge: boolean;
  reportWritingSkills: boolean;
  notificationProcedureKnowledge: boolean;
  actionPointManagementSkills: boolean;
  complianceAuditSkills: boolean;
  inspectionPreparationSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface RegulatoryQualityResult {
  overallScore: number;
  totalRecords: number;
  reportAccurateRate: number;
  deadlineMetRate: number;
  evidenceAttachedRate: number;
  actionPointsAddressedRate: number;
}

export interface RegulatoryComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  reportAccurateRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface RegulatoryPolicyResult {
  overallScore: number;
  reg44VisitPolicy: boolean;
  reg45ReportingPolicy: boolean;
  ofstedNotificationPolicy: boolean;
  statutoryNotificationPolicy: boolean;
  actionPointTrackingPolicy: boolean;
  complianceAuditPolicy: boolean;
  regulatoryInspectionPolicy: boolean;
}

export interface StaffRegulatoryReadinessResult {
  overallScore: number;
  totalStaff: number;
  regulatoryKnowledgeRate: number;
  reportWritingSkillsRate: number;
  notificationProcedureKnowledgeRate: number;
  actionPointManagementSkillsRate: number;
  complianceAuditSkillsRate: number;
  inspectionPreparationSkillsRate: number;
}

export interface ChildRegulatoryProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  reportAccurateRate: number;
  deadlineMetRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface RegulatoryIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  regulatoryQuality: RegulatoryQualityResult;
  regulatoryCompliance: RegulatoryComplianceResult;
  regulatoryPolicy: RegulatoryPolicyResult;
  staffReadiness: StaffRegulatoryReadinessResult;
  childProfiles: ChildRegulatoryProfile[];
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

export function evaluateRegulatoryQuality(
  records: RegulatoryRecord[],
): RegulatoryQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, reportAccurateRate: 0, deadlineMetRate: 0, evidenceAttachedRate: 0, actionPointsAddressedRate: 0 };
  }

  const reportAccurateRate = pct(records.filter((r) => r.reportAccurate).length, n);
  const deadlineMetRate = pct(records.filter((r) => r.deadlineMet).length, n);
  const evidenceAttachedRate = pct(records.filter((r) => r.evidenceAttached).length, n);
  const actionPointsAddressedRate = pct(records.filter((r) => r.actionPointsAddressed).length, n);

  let score = 0;
  score += (reportAccurateRate / 100) * 7;
  score += (deadlineMetRate / 100) * 6;
  score += (evidenceAttachedRate / 100) * 6;
  score += (actionPointsAddressedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, reportAccurateRate, deadlineMetRate, evidenceAttachedRate, actionPointsAddressedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateRegulatoryCompliance(
  records: RegulatoryRecord[],
): RegulatoryComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, reportAccurateRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const reportAccurateRate = pct(records.filter((r) => r.reportAccurate).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (reportAccurateRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, reportAccurateRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateRegulatoryPolicy(
  policy: RegulatoryPolicy | null,
): RegulatoryPolicyResult {
  if (policy === null) {
    return { overallScore: 0, reg44VisitPolicy: false, reg45ReportingPolicy: false, ofstedNotificationPolicy: false, statutoryNotificationPolicy: false, actionPointTrackingPolicy: false, complianceAuditPolicy: false, regulatoryInspectionPolicy: false };
  }

  let score = 0;
  if (policy.reg44VisitPolicy) score += 4;
  if (policy.reg45ReportingPolicy) score += 4;
  if (policy.ofstedNotificationPolicy) score += 4;
  if (policy.statutoryNotificationPolicy) score += 4;
  if (policy.actionPointTrackingPolicy) score += 3;
  if (policy.complianceAuditPolicy) score += 3;
  if (policy.regulatoryInspectionPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    reg44VisitPolicy: policy.reg44VisitPolicy,
    reg45ReportingPolicy: policy.reg45ReportingPolicy,
    ofstedNotificationPolicy: policy.ofstedNotificationPolicy,
    statutoryNotificationPolicy: policy.statutoryNotificationPolicy,
    actionPointTrackingPolicy: policy.actionPointTrackingPolicy,
    complianceAuditPolicy: policy.complianceAuditPolicy,
    regulatoryInspectionPolicy: policy.regulatoryInspectionPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffRegulatoryReadiness(
  training: StaffRegulatoryTraining[],
): StaffRegulatoryReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, regulatoryKnowledgeRate: 0, reportWritingSkillsRate: 0, notificationProcedureKnowledgeRate: 0, actionPointManagementSkillsRate: 0, complianceAuditSkillsRate: 0, inspectionPreparationSkillsRate: 0 };
  }

  const regulatoryKnowledgeRate = pct(training.filter((t) => t.regulatoryKnowledge).length, n);
  const reportWritingSkillsRate = pct(training.filter((t) => t.reportWritingSkills).length, n);
  const notificationProcedureKnowledgeRate = pct(training.filter((t) => t.notificationProcedureKnowledge).length, n);
  const actionPointManagementSkillsRate = pct(training.filter((t) => t.actionPointManagementSkills).length, n);
  const complianceAuditSkillsRate = pct(training.filter((t) => t.complianceAuditSkills).length, n);
  const inspectionPreparationSkillsRate = pct(training.filter((t) => t.inspectionPreparationSkills).length, n);

  let score = 0;
  score += (regulatoryKnowledgeRate / 100) * 6;
  score += (reportWritingSkillsRate / 100) * 5;
  score += (notificationProcedureKnowledgeRate / 100) * 5;
  score += (actionPointManagementSkillsRate / 100) * 4;
  score += (complianceAuditSkillsRate / 100) * 3;
  score += (inspectionPreparationSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, regulatoryKnowledgeRate, reportWritingSkillsRate, notificationProcedureKnowledgeRate, actionPointManagementSkillsRate, complianceAuditSkillsRate, inspectionPreparationSkillsRate };
}

// ── Build Child Regulatory Profiles ────────────────────────────────────

export function buildChildRegulatoryProfiles(
  records: RegulatoryRecord[],
): ChildRegulatoryProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: RegulatoryRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const reportAccurateRate = pct(child.records.filter((r) => r.reportAccurate).length, totalRecords);
    const deadlineMetRate = pct(child.records.filter((r) => r.deadlineMet).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (reportAccurateRate >= 80) rate1Score = 3;
    else if (reportAccurateRate >= 60) rate1Score = 2;
    else if (reportAccurateRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (deadlineMetRate >= 80) rate2Score = 3;
    else if (deadlineMetRate >= 60) rate2Score = 2;
    else if (deadlineMetRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, reportAccurateRate, deadlineMetRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateRegulatoryIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: RegulatoryRecord[];
  policy: RegulatoryPolicy | null;
  staff: StaffRegulatoryTraining[];
}

export function generateRegulatoryIntelligence(
  input: GenerateRegulatoryIntelligenceInput,
): RegulatoryIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const qualityResult = evaluateRegulatoryQuality(periodRecords);
  const complianceResult = evaluateRegulatoryCompliance(periodRecords);
  const policyResult = evaluateRegulatoryPolicy(policy);
  const staffResult = evaluateStaffRegulatoryReadiness(staff);

  const childProfiles = buildChildRegulatoryProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Regulatory compliance rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Regulatory compliance rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Regulatory quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Regulatory compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Regulatory policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff regulatory readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.reportAccurateRate >= 90) strengths.push("Report accuracy at " + qualityResult.reportAccurateRate + "%");
  if (periodRecords.length > 0 && qualityResult.deadlineMetRate >= 90) strengths.push("Deadline compliance at " + qualityResult.deadlineMetRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation completion rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Regulatory compliance rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Regulatory compliance Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Regulatory quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Regulatory compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Regulatory policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff regulatory readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.reportAccurateRate < 80) areasForImprovement.push("Report accuracy at " + qualityResult.reportAccurateRate + "% — must improve for regulatory compliance");
  if (periodRecords.length === 0) areasForImprovement.push("No regulatory records — recording must be documented");
  if (policy === null) areasForImprovement.push("No regulatory policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff regulatory training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No regulatory policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff regulatory training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.reportAccurateRate < 50) actions.push("HIGH: Report accuracy at " + qualityResult.reportAccurateRate + "% — review reporting procedures");
  if (periodRecords.length > 0 && qualityResult.deadlineMetRate < 50) actions.push("HIGH: Deadline compliance at " + qualityResult.deadlineMetRate + "% — ensure deadlines are tracked and met");
  if (periodRecords.length > 0 && qualityResult.evidenceAttachedRate < 50) actions.push("HIGH: Evidence attachment rate at " + qualityResult.evidenceAttachedRate + "% — all regulatory records must include evidence");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.regulatoryKnowledgeRate < 50) actions.push("MEDIUM: Regulatory knowledge at " + staffResult.regulatoryKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low regulatory scores — review individual compliance provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Regulatory systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 44/45 — Visits and reports",
    "CHR 2015 Reg 40/41 — Notifications",
    "NMS 15 — Notifications",
    "SCCIF — Leadership and management",
    "Children Act 1989",
    "Quality Standards 2015 Standard 8",
    "Ofsted inspection framework",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    regulatoryQuality: qualityResult,
    regulatoryCompliance: complianceResult,
    regulatoryPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
