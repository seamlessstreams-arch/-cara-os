/* ──────────────────────────────────────────────────────────────
   Multi-Agency Intelligence Engine

   Pure deterministic engine for evaluating the quality,
   compliance, and effectiveness of multi-agency working
   in residential children's care homes.

   Regulatory basis:
     - CHR 2015 Reg 5 — Engaging with others
     - CHR 2015 Reg 22 — Contact between child and family
     - NMS 18 — Multi-agency working
     - SCCIF — Leadership and management
     - Children Act 1989 s.22(3A) — Duty to promote welfare
     - WTSC 2023 — Multi-agency safeguarding arrangements
     - Quality Standards 2015 Standard 5

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type MultiAgencyCategory =
  | "strategy_meeting"
  | "lac_review"
  | "care_team_meeting"
  | "professional_consultation"
  | "information_sharing"
  | "joint_assessment"
  | "referral_coordination"
  | "multi_agency_training";

export type MultiAgencyOutcome =
  | "fully_engaged"
  | "partially_engaged"
  | "agency_declined"
  | "no_response"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const multiAgencyCategoryLabels: Record<MultiAgencyCategory, string> = {
  strategy_meeting: "Strategy Meeting",
  lac_review: "LAC Review",
  care_team_meeting: "Care Team Meeting",
  professional_consultation: "Professional Consultation",
  information_sharing: "Information Sharing",
  joint_assessment: "Joint Assessment",
  referral_coordination: "Referral Coordination",
  multi_agency_training: "Multi-Agency Training",
};

const multiAgencyOutcomeLabels: Record<MultiAgencyOutcome, string> = {
  fully_engaged: "Fully Engaged",
  partially_engaged: "Partially Engaged",
  agency_declined: "Agency Declined",
  no_response: "No Response",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getMultiAgencyCategoryLabel(category: MultiAgencyCategory): string {
  return multiAgencyCategoryLabels[category];
}

export function getMultiAgencyOutcomeLabel(outcome: MultiAgencyOutcome): string {
  return multiAgencyOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface MultiAgencyRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: MultiAgencyCategory;
  outcome: MultiAgencyOutcome;
  agencyAttendanceConfirmed: boolean;
  actionPointsRecorded: boolean;
  informationSharedAppropriately: boolean;
  childViewRepresented: boolean;
  documentationComplete: boolean;
  timelyRecording: boolean;
}

export interface MultiAgencyPolicy {
  multiAgencyWorkingPolicy: boolean;
  informationSharingProtocol: boolean;
  lacReviewProcedure: boolean;
  referralCoordinationPolicy: boolean;
  jointAssessmentFramework: boolean;
  professionalConsultationPolicy: boolean;
  multiAgencyTrainingPolicy: boolean;
}

export interface StaffMultiAgencyTraining {
  staffId: string;
  multiAgencyWorkingKnowledge: boolean;
  informationSharingSkills: boolean;
  meetingFacilitationSkills: boolean;
  referralProcessKnowledge: boolean;
  jointAssessmentSkills: boolean;
  professionalBoundaries: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface MultiAgencyQualityResult {
  overallScore: number;
  totalRecords: number;
  agencyAttendanceConfirmedRate: number;
  actionPointsRecordedRate: number;
  informationSharedAppropriatelyRate: number;
  childViewRepresentedRate: number;
}

export interface MultiAgencyComplianceResult {
  overallScore: number;
  totalRecords: number;
  documentationCompleteRate: number;
  timelyRecordingRate: number;
  agencyAttendanceConfirmedRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface MultiAgencyPolicyResult {
  overallScore: number;
  multiAgencyWorkingPolicy: boolean;
  informationSharingProtocol: boolean;
  lacReviewProcedure: boolean;
  referralCoordinationPolicy: boolean;
  jointAssessmentFramework: boolean;
  professionalConsultationPolicy: boolean;
  multiAgencyTrainingPolicy: boolean;
}

export interface StaffMultiAgencyReadinessResult {
  overallScore: number;
  totalStaff: number;
  multiAgencyWorkingKnowledgeRate: number;
  informationSharingSkillsRate: number;
  meetingFacilitationSkillsRate: number;
  referralProcessKnowledgeRate: number;
  jointAssessmentSkillsRate: number;
  professionalBoundariesRate: number;
}

export interface ChildMultiAgencyProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  agencyAttendanceConfirmedRate: number;
  childViewRepresentedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface MultiAgencyIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  multiAgencyQuality: MultiAgencyQualityResult;
  multiAgencyCompliance: MultiAgencyComplianceResult;
  multiAgencyPolicy: MultiAgencyPolicyResult;
  staffReadiness: StaffMultiAgencyReadinessResult;
  childProfiles: ChildMultiAgencyProfile[];
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

export function evaluateMultiAgencyQuality(
  records: MultiAgencyRecord[],
): MultiAgencyQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, agencyAttendanceConfirmedRate: 0, actionPointsRecordedRate: 0, informationSharedAppropriatelyRate: 0, childViewRepresentedRate: 0 };
  }

  const agencyAttendanceConfirmedRate = pct(records.filter((r) => r.agencyAttendanceConfirmed).length, n);
  const actionPointsRecordedRate = pct(records.filter((r) => r.actionPointsRecorded).length, n);
  const informationSharedAppropriatelyRate = pct(records.filter((r) => r.informationSharedAppropriately).length, n);
  const childViewRepresentedRate = pct(records.filter((r) => r.childViewRepresented).length, n);

  let score = 0;
  score += (agencyAttendanceConfirmedRate / 100) * 7;
  score += (actionPointsRecordedRate / 100) * 6;
  score += (informationSharedAppropriatelyRate / 100) * 6;
  score += (childViewRepresentedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, agencyAttendanceConfirmedRate, actionPointsRecordedRate, informationSharedAppropriatelyRate, childViewRepresentedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateMultiAgencyCompliance(
  records: MultiAgencyRecord[],
): MultiAgencyComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, documentationCompleteRate: 0, timelyRecordingRate: 0, agencyAttendanceConfirmedRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const agencyAttendanceConfirmedRate = pct(records.filter((r) => r.agencyAttendanceConfirmed).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (documentationCompleteRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (agencyAttendanceConfirmedRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, documentationCompleteRate, timelyRecordingRate, agencyAttendanceConfirmedRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateMultiAgencyPolicy(
  policy: MultiAgencyPolicy | null,
): MultiAgencyPolicyResult {
  if (policy === null) {
    return { overallScore: 0, multiAgencyWorkingPolicy: false, informationSharingProtocol: false, lacReviewProcedure: false, referralCoordinationPolicy: false, jointAssessmentFramework: false, professionalConsultationPolicy: false, multiAgencyTrainingPolicy: false };
  }

  let score = 0;
  if (policy.multiAgencyWorkingPolicy) score += 4;
  if (policy.informationSharingProtocol) score += 4;
  if (policy.lacReviewProcedure) score += 4;
  if (policy.referralCoordinationPolicy) score += 4;
  if (policy.jointAssessmentFramework) score += 3;
  if (policy.professionalConsultationPolicy) score += 3;
  if (policy.multiAgencyTrainingPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    multiAgencyWorkingPolicy: policy.multiAgencyWorkingPolicy,
    informationSharingProtocol: policy.informationSharingProtocol,
    lacReviewProcedure: policy.lacReviewProcedure,
    referralCoordinationPolicy: policy.referralCoordinationPolicy,
    jointAssessmentFramework: policy.jointAssessmentFramework,
    professionalConsultationPolicy: policy.professionalConsultationPolicy,
    multiAgencyTrainingPolicy: policy.multiAgencyTrainingPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffMultiAgencyReadiness(
  training: StaffMultiAgencyTraining[],
): StaffMultiAgencyReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, multiAgencyWorkingKnowledgeRate: 0, informationSharingSkillsRate: 0, meetingFacilitationSkillsRate: 0, referralProcessKnowledgeRate: 0, jointAssessmentSkillsRate: 0, professionalBoundariesRate: 0 };
  }

  const multiAgencyWorkingKnowledgeRate = pct(training.filter((t) => t.multiAgencyWorkingKnowledge).length, n);
  const informationSharingSkillsRate = pct(training.filter((t) => t.informationSharingSkills).length, n);
  const meetingFacilitationSkillsRate = pct(training.filter((t) => t.meetingFacilitationSkills).length, n);
  const referralProcessKnowledgeRate = pct(training.filter((t) => t.referralProcessKnowledge).length, n);
  const jointAssessmentSkillsRate = pct(training.filter((t) => t.jointAssessmentSkills).length, n);
  const professionalBoundariesRate = pct(training.filter((t) => t.professionalBoundaries).length, n);

  let score = 0;
  score += (multiAgencyWorkingKnowledgeRate / 100) * 6;
  score += (informationSharingSkillsRate / 100) * 5;
  score += (meetingFacilitationSkillsRate / 100) * 5;
  score += (referralProcessKnowledgeRate / 100) * 4;
  score += (jointAssessmentSkillsRate / 100) * 3;
  score += (professionalBoundariesRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, multiAgencyWorkingKnowledgeRate, informationSharingSkillsRate, meetingFacilitationSkillsRate, referralProcessKnowledgeRate, jointAssessmentSkillsRate, professionalBoundariesRate };
}

// ── Build Child Multi-Agency Profiles ───────────────────────────────────

export function buildChildMultiAgencyProfiles(
  records: MultiAgencyRecord[],
): ChildMultiAgencyProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: MultiAgencyRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const agencyAttendanceConfirmedRate = pct(child.records.filter((r) => r.agencyAttendanceConfirmed).length, totalRecords);
    const childViewRepresentedRate = pct(child.records.filter((r) => r.childViewRepresented).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (agencyAttendanceConfirmedRate >= 80) rate1Score = 3;
    else if (agencyAttendanceConfirmedRate >= 60) rate1Score = 2;
    else if (agencyAttendanceConfirmedRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (childViewRepresentedRate >= 80) rate2Score = 3;
    else if (childViewRepresentedRate >= 60) rate2Score = 2;
    else if (childViewRepresentedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, agencyAttendanceConfirmedRate, childViewRepresentedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateMultiAgencyIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: MultiAgencyRecord[];
  policy: MultiAgencyPolicy | null;
  staff: StaffMultiAgencyTraining[];
}

export function generateMultiAgencyIntelligence(
  input: GenerateMultiAgencyIntelligenceInput,
): MultiAgencyIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateMultiAgencyQuality(periodRecords);
  const complianceResult = evaluateMultiAgencyCompliance(periodRecords);
  const policyResult = evaluateMultiAgencyPolicy(policy);
  const staffResult = evaluateStaffMultiAgencyReadiness(staff);

  const childProfiles = buildChildMultiAgencyProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Multi-agency working rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Multi-agency working rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Multi-agency quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Multi-agency compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Multi-agency policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff multi-agency readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.agencyAttendanceConfirmedRate >= 90) strengths.push("Agency attendance confirmation rate at " + qualityResult.agencyAttendanceConfirmedRate + "%");
  if (periodRecords.length > 0 && qualityResult.childViewRepresentedRate >= 90) strengths.push("Child view representation rate at " + qualityResult.childViewRepresentedRate + "%");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate >= 90) strengths.push("Documentation rate at " + complianceResult.documentationCompleteRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Multi-agency working rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Multi-agency working Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Multi-agency quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Multi-agency compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Multi-agency policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff multi-agency readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.agencyAttendanceConfirmedRate < 80) areasForImprovement.push("Agency attendance confirmation at " + qualityResult.agencyAttendanceConfirmedRate + "% — must improve for effective partnership");
  if (periodRecords.length === 0) areasForImprovement.push("No multi-agency records — multi-agency working must be documented");
  if (policy === null) areasForImprovement.push("No multi-agency policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff multi-agency training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No multi-agency policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff multi-agency training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.agencyAttendanceConfirmedRate < 50) actions.push("HIGH: Agency attendance confirmation at " + qualityResult.agencyAttendanceConfirmedRate + "% — review coordination processes");
  if (periodRecords.length > 0 && qualityResult.childViewRepresentedRate < 50) actions.push("HIGH: Child view representation at " + qualityResult.childViewRepresentedRate + "% — ensure child voices are consistently captured");
  if (periodRecords.length > 0 && complianceResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + complianceResult.documentationCompleteRate + "% — all multi-agency activity must be recorded");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.multiAgencyWorkingKnowledgeRate < 50) actions.push("MEDIUM: Multi-agency working knowledge at " + staffResult.multiAgencyWorkingKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low multi-agency scores — review individual care plans");
  if (actions.length === 0) actions.push("No immediate actions required. Multi-agency working systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 5 — Engaging with others",
    "CHR 2015 Reg 22 — Contact between child and family",
    "NMS 18 — Multi-agency working",
    "SCCIF — Leadership and management",
    "Children Act 1989 s.22(3A) — Duty to promote welfare",
    "WTSC 2023 — Multi-agency safeguarding arrangements",
    "Quality Standards 2015 Standard 5",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    multiAgencyQuality: qualityResult,
    multiAgencyCompliance: complianceResult,
    multiAgencyPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
