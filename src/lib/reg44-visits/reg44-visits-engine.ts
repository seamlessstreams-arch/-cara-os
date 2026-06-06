// ==============================================================================
// Cornerstone Reg 44 Visits Intelligence Engine
//
// Deterministic engine for evaluating the quality and compliance of
// Regulation 44 independent person visits in children's residential homes.
//
// Aligned to:
//   - CHR 2015 Reg 44 -- Independent person: visits and reports
//   - CHR 2015 Reg 45 -- Review of quality of care
//   - NMS 19 -- Staffing of children's homes
//   - SCCIF -- Leadership and management: quality assurance
//   - Children Act 1989 s.87 -- Welfare of children in care homes
//   - Quality Standards 2015 -- Standard 7 (effective management)
//   - CHR 2015 Reg 13 -- Leadership and management
//
// No AI. No external calls. Pure input -> output.
// ==============================================================================

import { withinPeriod } from "@/lib/date-period";

// -- Types --------------------------------------------------------------------

export type Reg44VisitCategory =
  | "scheduled_visit"
  | "unannounced_visit"
  | "follow_up_visit"
  | "child_interview"
  | "staff_interview"
  | "records_review"
  | "premises_inspection"
  | "action_review";

export type Reg44VisitOutcome =
  | "satisfactory"
  | "minor_concern"
  | "significant_concern"
  | "action_required"
  | "not_applicable";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// -- Input Records ------------------------------------------------------------

export interface Reg44VisitRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: Reg44VisitCategory;
  outcome: Reg44VisitOutcome;
  childrenInterviewed: boolean;
  staffInterviewed: boolean;
  recordsReviewed: boolean;
  premisesInspected: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface Reg44VisitPolicy {
  reg44VisitPolicy: boolean;
  visitFrequencyGuidance: boolean;
  childInterviewProcedure: boolean;
  reportWritingStandard: boolean;
  actionTrackingProcedure: boolean;
  escalationProtocol: boolean;
  independentVisitorPolicy: boolean;
}

export interface StaffReg44VisitTraining {
  staffId: string;
  reg44Requirements: boolean;
  childInterviewSkills: boolean;
  reportWriting: boolean;
  actionTracking: boolean;
  regulatoryKnowledge: boolean;
  escalationProcedure: boolean;
}

// -- Result Interfaces --------------------------------------------------------

export interface Reg44VisitQualityResult {
  overallScore: number;
  totalRecords: number;
  childrenInterviewedRate: number;
  staffInterviewedRate: number;
  recordsReviewedRate: number;
  premisesInspectedRate: number;
}

export interface Reg44VisitComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationRate: number;
  timelyRecordingRate: number;
  childrenInterviewedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface Reg44VisitPolicyResult {
  overallScore: number;
  reg44VisitPolicy: boolean;
  visitFrequencyGuidance: boolean;
  childInterviewProcedure: boolean;
  reportWritingStandard: boolean;
  actionTrackingProcedure: boolean;
  escalationProtocol: boolean;
  independentVisitorPolicy: boolean;
}

export interface StaffReg44VisitReadinessResult {
  overallScore: number;
  totalStaff: number;
  reg44RequirementsRate: number;
  childInterviewSkillsRate: number;
  reportWritingRate: number;
  actionTrackingRate: number;
  regulatoryKnowledgeRate: number;
  escalationProcedureRate: number;
}

export interface ChildReg44VisitProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  childrenInterviewedRate: number;
  staffInterviewedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface Reg44VisitIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  visitQuality: Reg44VisitQualityResult;
  visitCompliance: Reg44VisitComplianceResult;
  visitPolicy: Reg44VisitPolicyResult;
  staffReadiness: StaffReg44VisitReadinessResult;
  childProfiles: ChildReg44VisitProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// -- Helpers ------------------------------------------------------------------

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

// -- Label Functions ----------------------------------------------------------

export function getReg44VisitCategoryLabel(category: Reg44VisitCategory): string {
  const labels: Record<Reg44VisitCategory, string> = {
    scheduled_visit: "Scheduled Visit",
    unannounced_visit: "Unannounced Visit",
    follow_up_visit: "Follow-Up Visit",
    child_interview: "Child Interview",
    staff_interview: "Staff Interview",
    records_review: "Records Review",
    premises_inspection: "Premises Inspection",
    action_review: "Action Review",
  };
  return labels[category] ?? category;
}

export function getReg44VisitOutcomeLabel(outcome: Reg44VisitOutcome): string {
  const labels: Record<Reg44VisitOutcome, string> = {
    satisfactory: "Satisfactory",
    minor_concern: "Minor Concern",
    significant_concern: "Significant Concern",
    action_required: "Action Required",
    not_applicable: "Not Applicable",
  };
  return labels[outcome] ?? outcome;
}

export function getRatingLabel(r: Rating): string {
  return r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// -- Constants ----------------------------------------------------------------

const ALL_CATEGORIES: Reg44VisitCategory[] = [
  "scheduled_visit",
  "unannounced_visit",
  "follow_up_visit",
  "child_interview",
  "staff_interview",
  "records_review",
  "premises_inspection",
  "action_review",
];

// -- Evaluator 1: Visit Quality (0-25) ---------------------------------------

export function evaluateReg44VisitQuality(records: Reg44VisitRecord[]): Reg44VisitQualityResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      childrenInterviewedRate: 0,
      staffInterviewedRate: 0,
      recordsReviewedRate: 0,
      premisesInspectedRate: 0,
    };
  }

  const childrenInterviewedRate = pct(records.filter((r) => r.childrenInterviewed).length, total);
  const staffInterviewedRate = pct(records.filter((r) => r.staffInterviewed).length, total);
  const recordsReviewedRate = pct(records.filter((r) => r.recordsReviewed).length, total);
  const premisesInspectedRate = pct(records.filter((r) => r.premisesInspected).length, total);

  // Weighted: childrenInterviewedRate(7) + staffInterviewedRate(6) + recordsReviewedRate(6) + premisesInspectedRate(6) = 25
  let score = 0;
  score += (childrenInterviewedRate / 100) * 7;
  score += (staffInterviewedRate / 100) * 6;
  score += (recordsReviewedRate / 100) * 6;
  score += (premisesInspectedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: total,
    childrenInterviewedRate,
    staffInterviewedRate,
    recordsReviewedRate,
    premisesInspectedRate,
  };
}

// -- Evaluator 2: Visit Compliance (0-25) ------------------------------------

export function evaluateReg44VisitCompliance(records: Reg44VisitRecord[]): Reg44VisitComplianceResult {
  const total = records.length;
  if (total === 0) {
    return {
      overallScore: 0,
      totalRecords: 0,
      documentationRate: 0,
      timelyRecordingRate: 0,
      childrenInterviewedRate: 0,
      categoryDiversityRatio: 0,
      uniqueCategories: 0,
    };
  }

  const documentationRate = pct(records.filter((r) => r.documentationComplete).length, total);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, total);
  const childrenInterviewedRate = pct(records.filter((r) => r.childrenInterviewed).length, total);

  const uniqueCategories = new Set(records.map((r) => r.category)).size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  // Weighted: documentationRate(8) + timelyRecordingRate(7) + childrenInterviewedRate(5) + categoryDiversityRatio(5) = 25
  let score = 0;
  score += (documentationRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (childrenInterviewedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalRecords: total,
    documentationRate,
    timelyRecordingRate,
    childrenInterviewedRate,
    categoryDiversityRatio,
    uniqueCategories,
  };
}

// -- Evaluator 3: Policy & Governance (0-25) ---------------------------------

export function evaluateReg44VisitPolicy(policy: Reg44VisitPolicy | null): Reg44VisitPolicyResult {
  if (!policy) {
    return {
      overallScore: 0,
      reg44VisitPolicy: false,
      visitFrequencyGuidance: false,
      childInterviewProcedure: false,
      reportWritingStandard: false,
      actionTrackingProcedure: false,
      escalationProtocol: false,
      independentVisitorPolicy: false,
    };
  }

  // First 4 at 4 points, last 3 at 3 points = 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.reg44VisitPolicy) score += 4;
  if (policy.visitFrequencyGuidance) score += 4;
  if (policy.childInterviewProcedure) score += 4;
  if (policy.reportWritingStandard) score += 4;
  if (policy.actionTrackingProcedure) score += 3;
  if (policy.escalationProtocol) score += 3;
  if (policy.independentVisitorPolicy) score += 3;

  return {
    overallScore: score,
    reg44VisitPolicy: policy.reg44VisitPolicy,
    visitFrequencyGuidance: policy.visitFrequencyGuidance,
    childInterviewProcedure: policy.childInterviewProcedure,
    reportWritingStandard: policy.reportWritingStandard,
    actionTrackingProcedure: policy.actionTrackingProcedure,
    escalationProtocol: policy.escalationProtocol,
    independentVisitorPolicy: policy.independentVisitorPolicy,
  };
}

// -- Evaluator 4: Staff Readiness (0-25) -------------------------------------

export function evaluateStaffReg44VisitReadiness(staff: StaffReg44VisitTraining[]): StaffReg44VisitReadinessResult {
  const count = staff.length;
  if (count === 0) {
    return {
      overallScore: 0,
      totalStaff: 0,
      reg44RequirementsRate: 0,
      childInterviewSkillsRate: 0,
      reportWritingRate: 0,
      actionTrackingRate: 0,
      regulatoryKnowledgeRate: 0,
      escalationProcedureRate: 0,
    };
  }

  const reg44RequirementsRate = pct(staff.filter((s) => s.reg44Requirements).length, count);
  const childInterviewSkillsRate = pct(staff.filter((s) => s.childInterviewSkills).length, count);
  const reportWritingRate = pct(staff.filter((s) => s.reportWriting).length, count);
  const actionTrackingRate = pct(staff.filter((s) => s.actionTracking).length, count);
  const regulatoryKnowledgeRate = pct(staff.filter((s) => s.regulatoryKnowledge).length, count);
  const escalationProcedureRate = pct(staff.filter((s) => s.escalationProcedure).length, count);

  // Weighted: 6+5+5+4+3+2 = 25
  let score = 0;
  score += (reg44RequirementsRate / 100) * 6;
  score += (childInterviewSkillsRate / 100) * 5;
  score += (reportWritingRate / 100) * 5;
  score += (actionTrackingRate / 100) * 4;
  score += (regulatoryKnowledgeRate / 100) * 3;
  score += (escalationProcedureRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return {
    overallScore: score,
    totalStaff: count,
    reg44RequirementsRate,
    childInterviewSkillsRate,
    reportWritingRate,
    actionTrackingRate,
    regulatoryKnowledgeRate,
    escalationProcedureRate,
  };
}

// -- Child Profiles (0-10) ----------------------------------------------------

export function buildChildReg44VisitProfiles(records: Reg44VisitRecord[]): ChildReg44VisitProfile[] {
  const grouped = new Map<string, Reg44VisitRecord[]>();
  for (const r of records) {
    const arr = grouped.get(r.childId) || [];
    arr.push(r);
    grouped.set(r.childId, arr);
  }

  const profiles: ChildReg44VisitProfile[] = [];
  for (const [childId, recs] of grouped) {
    const childName = recs[0].childName;
    const totalRecords = recs.length;

    const childrenInterviewedRate = pct(recs.filter((r) => r.childrenInterviewed).length, totalRecords);
    const staffInterviewedRate = pct(recs.filter((r) => r.staffInterviewed).length, totalRecords);

    const catsSet = new Set(recs.map((r) => r.category));
    const categoriesCovered = [...catsSet] as string[];

    // Scoring: freq [>=10->2, >=5->1] + rate1 childrenInterviewedRate [>=80->3, >=60->2, >=40->1]
    //          + rate2 staffInterviewedRate [same] + diversity [>=4->2, >=2->1], capped at 10
    let score = 0;

    if (totalRecords >= 10) score += 2;
    else if (totalRecords >= 5) score += 1;

    if (childrenInterviewedRate >= 80) score += 3;
    else if (childrenInterviewedRate >= 60) score += 2;
    else if (childrenInterviewedRate >= 40) score += 1;

    if (staffInterviewedRate >= 80) score += 3;
    else if (staffInterviewedRate >= 60) score += 2;
    else if (staffInterviewedRate >= 40) score += 1;

    const catCount = categoriesCovered.length;
    if (catCount >= 4) score += 2;
    else if (catCount >= 2) score += 1;

    profiles.push({
      childId,
      childName,
      totalRecords,
      childrenInterviewedRate,
      staffInterviewedRate,
      categoriesCovered,
      overallScore: Math.min(10, score),
    });
  }

  return profiles;
}

// -- Master Intelligence Generator --------------------------------------------

export function generateReg44VisitIntelligence(input: {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: Reg44VisitRecord[];
  policy: Reg44VisitPolicy | null;
  staff: StaffReg44VisitTraining[];
}): Reg44VisitIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  // Filter records to period
  const filtered = records.filter((r) => withinPeriod(r.date, periodStart, periodEnd));

  const visitQuality = evaluateReg44VisitQuality(filtered);
  const visitCompliance = evaluateReg44VisitCompliance(filtered);
  const visitPolicy = evaluateReg44VisitPolicy(policy);
  const staffReadiness = evaluateStaffReg44VisitReadiness(staff);
  const childProfiles = buildChildReg44VisitProfiles(filtered);

  const overallScore = Math.min(
    100,
    visitQuality.overallScore + visitCompliance.overallScore + visitPolicy.overallScore + staffReadiness.overallScore,
  );
  const rating = getRating(overallScore);

  // Strengths (>=80%)
  const strengths: string[] = [];
  if (visitQuality.childrenInterviewedRate >= 80) strengths.push("Children are consistently interviewed during Reg 44 visits");
  if (visitQuality.staffInterviewedRate >= 80) strengths.push("Staff interviews are routinely conducted as part of visit programme");
  if (visitQuality.recordsReviewedRate >= 80) strengths.push("Records are thoroughly reviewed during independent visits");
  if (visitQuality.premisesInspectedRate >= 80) strengths.push("Premises inspections are consistently carried out during visits");
  if (visitCompliance.documentationRate >= 80) strengths.push("Visit documentation is comprehensive and complete");
  if (visitCompliance.timelyRecordingRate >= 80) strengths.push("Visit reports are produced in a timely manner");
  if (staffReadiness.reg44RequirementsRate >= 80) strengths.push("Staff demonstrate strong understanding of Reg 44 requirements");
  if (staffReadiness.childInterviewSkillsRate >= 80) strengths.push("Staff are well trained in child interview skills");

  // Areas for improvement (<60%)
  const areasForImprovement: string[] = [];
  if (visitQuality.childrenInterviewedRate < 60) areasForImprovement.push("Children are not being consistently interviewed during Reg 44 visits");
  if (visitQuality.staffInterviewedRate < 60) areasForImprovement.push("Staff interviews are not routinely included in visit programme");
  if (visitQuality.recordsReviewedRate < 60) areasForImprovement.push("Records review during visits needs to be more systematic");
  if (visitQuality.premisesInspectedRate < 60) areasForImprovement.push("Premises inspections are not consistently undertaken");
  if (visitCompliance.documentationRate < 60) areasForImprovement.push("Visit documentation is incomplete or inconsistent");
  if (visitCompliance.timelyRecordingRate < 60) areasForImprovement.push("Visit reports are not being completed in a timely manner");
  if (staffReadiness.reg44RequirementsRate < 60) areasForImprovement.push("Staff understanding of Reg 44 requirements needs development");
  if (staffReadiness.childInterviewSkillsRate < 60) areasForImprovement.push("Staff child interview skills training requires improvement");

  // Actions
  const actions: string[] = [];
  if (visitPolicy.overallScore === 0) actions.push("URGENT: Establish a formal Reg 44 visits policy -- CHR 2015 Reg 44 requires documented independent visit procedures");
  if (staffReadiness.overallScore === 0) actions.push("URGENT: Provide Reg 44 training to all staff -- proper visit conduct depends on skilled practitioners");
  if (visitQuality.childrenInterviewedRate < 50) actions.push("Implement systematic child interviews in all Reg 44 visits -- children's views must be sought (SCCIF)");
  if (visitQuality.staffInterviewedRate < 50) actions.push("Ensure staff interviews are included in visit programme -- Reg 44 requires comprehensive assessment");
  if (visitCompliance.documentationRate < 50) actions.push("Improve visit documentation -- reports must be comprehensive and timely (Reg 44/45)");
  if (visitCompliance.timelyRecordingRate < 50) actions.push("Review visit recording timescales -- reports should be completed promptly after each visit");
  if (visitQuality.premisesInspectedRate < 50) actions.push("Include premises inspection in all visits to monitor home environment and safety");
  if (staffReadiness.escalationProcedureRate < 50) actions.push("Train staff in escalation procedures for concerns raised during Reg 44 visits");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 44 — Independent person: visits and reports",
    "CHR 2015 Reg 45 — Review of quality of care",
    "NMS 19 — Staffing of children's homes",
    "SCCIF — Leadership and management: quality assurance",
    "Children Act 1989 s.87 — Welfare of children in care homes",
    "Quality Standards 2015 — Standard 7 (effective management)",
    "CHR 2015 Reg 13 — Leadership and management",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    visitQuality,
    visitCompliance,
    visitPolicy,
    staffReadiness,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
