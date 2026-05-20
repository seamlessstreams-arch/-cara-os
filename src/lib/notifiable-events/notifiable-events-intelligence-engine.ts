/* ──────────────────────────────────────────────────────────────
   Notifiable Events Intelligence Engine

   Pure deterministic engine for evaluating the quality and
   compliance of notifiable event reporting in children's
   residential care homes.

   Regulatory basis:
     - CHR 2015 Reg 40 — Notification of significant events
     - CHR 2015 Reg 41 — Notification to Ofsted
     - SCCIF — Social Care Common Inspection Framework
     - Children Act 1989
     - WTSC 2023 — Working Together to Safeguard Children
     - NMS 18 — Notification of significant events
     - Ofsted: Guide to notifications

   No AI. No external calls. Pure input → output.
   ────────────────────────────────────────────────────────────── */

// ── Types ──────────────────────────────────────────────────────────────────

export type NotifiableEventsCategory =
  | "serious_injury"
  | "child_death"
  | "child_protection_referral"
  | "police_involvement"
  | "safeguarding_concern"
  | "missing_from_care"
  | "allegation_against_staff"
  | "significant_incident";

export type NotifiableEventsOutcome =
  | "notified_within_timeframe"
  | "late_notification"
  | "partial_notification"
  | "not_notified"
  | "not_applicable";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Label Maps ─────────────────────────────────────────────────────────────

const notifiableEventsCategoryLabels: Record<NotifiableEventsCategory, string> = {
  serious_injury: "Serious Injury",
  child_death: "Child Death",
  child_protection_referral: "Child Protection Referral",
  police_involvement: "Police Involvement",
  safeguarding_concern: "Safeguarding Concern",
  missing_from_care: "Missing from Care",
  allegation_against_staff: "Allegation Against Staff",
  significant_incident: "Significant Incident",
};

const notifiableEventsOutcomeLabels: Record<NotifiableEventsOutcome, string> = {
  notified_within_timeframe: "Notified Within Timeframe",
  late_notification: "Late Notification",
  partial_notification: "Partial Notification",
  not_notified: "Not Notified",
  not_applicable: "Not Applicable",
};

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getNotifiableEventsCategoryLabel(category: NotifiableEventsCategory): string {
  return notifiableEventsCategoryLabels[category];
}

export function getNotifiableEventsOutcomeLabel(outcome: NotifiableEventsOutcome): string {
  return notifiableEventsOutcomeLabels[outcome];
}

export function getRatingLabel(rating: Rating): string {
  return ratingLabels[rating];
}

// ── Core Interfaces ────────────────────────────────────────────────────────

export interface NotifiableEventsRecord {
  id: string;
  homeId: string;
  date: string;
  childId: string;
  childName: string;
  category: NotifiableEventsCategory;
  outcome: NotifiableEventsOutcome;
  notificationTimely: boolean;
  correctRecipientsNotified: boolean;
  documentationComplete: boolean;
  followUpActioned: boolean;
  regulatoryBodyNotified: boolean;
  timelyRecording: boolean;
}

export interface NotifiableEventsPolicy {
  notifiableEventsPolicy: boolean;
  notificationTimeframePolicy: boolean;
  ofstedNotificationProcedure: boolean;
  localAuthorityNotificationPolicy: boolean;
  internalEscalationPolicy: boolean;
  postIncidentReviewPolicy: boolean;
  recordKeepingPolicy: boolean;
}

export interface StaffNotifiableEventsTraining {
  staffId: string;
  notifiableEventsKnowledge: boolean;
  ofstedNotificationProcess: boolean;
  localAuthorityReporting: boolean;
  internalEscalationProcedure: boolean;
  documentationRequirements: boolean;
  postIncidentReviewSkills: boolean;
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface NotifiableEventsQualityResult {
  overallScore: number;
  totalRecords: number;
  notificationTimelyRate: number;
  correctRecipientsNotifiedRate: number;
  documentationCompleteRate: number;
  followUpActionedRate: number;
}

export interface NotifiableEventsComplianceResult {
  overallScore: number;
  totalRecords: number;
  regulatoryBodyNotifiedRate: number;
  timelyRecordingRate: number;
  notificationTimelyRate: number;
  categoryDiversityRatio: number;
  uniqueCategories: number;
}

export interface NotifiableEventsPolicyResult {
  overallScore: number;
  notifiableEventsPolicy: boolean;
  notificationTimeframePolicy: boolean;
  ofstedNotificationProcedure: boolean;
  localAuthorityNotificationPolicy: boolean;
  internalEscalationPolicy: boolean;
  postIncidentReviewPolicy: boolean;
  recordKeepingPolicy: boolean;
}

export interface StaffNotifiableEventsReadinessResult {
  overallScore: number;
  totalStaff: number;
  notifiableEventsKnowledgeRate: number;
  ofstedNotificationProcessRate: number;
  localAuthorityReportingRate: number;
  internalEscalationProcedureRate: number;
  documentationRequirementsRate: number;
  postIncidentReviewSkillsRate: number;
}

export interface ChildNotifiableEventsProfile {
  childId: string;
  childName: string;
  totalRecords: number;
  notificationTimelyRate: number;
  correctRecipientsNotifiedRate: number;
  categoriesCovered: string[];
  overallScore: number;
}

export interface NotifiableEventsIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  notifiableEventsQuality: NotifiableEventsQualityResult;
  notifiableEventsCompliance: NotifiableEventsComplianceResult;
  notifiableEventsPolicy: NotifiableEventsPolicyResult;
  staffReadiness: StaffNotifiableEventsReadinessResult;
  childProfiles: ChildNotifiableEventsProfile[];
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

export function evaluateNotifiableEventsQuality(
  records: NotifiableEventsRecord[],
): NotifiableEventsQualityResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, notificationTimelyRate: 0, correctRecipientsNotifiedRate: 0, documentationCompleteRate: 0, followUpActionedRate: 0 };
  }

  const notificationTimelyRate = pct(records.filter((r) => r.notificationTimely).length, n);
  const correctRecipientsNotifiedRate = pct(records.filter((r) => r.correctRecipientsNotified).length, n);
  const documentationCompleteRate = pct(records.filter((r) => r.documentationComplete).length, n);
  const followUpActionedRate = pct(records.filter((r) => r.followUpActioned).length, n);

  let score = 0;
  score += (notificationTimelyRate / 100) * 7;
  score += (correctRecipientsNotifiedRate / 100) * 6;
  score += (documentationCompleteRate / 100) * 6;
  score += (followUpActionedRate / 100) * 6;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, notificationTimelyRate, correctRecipientsNotifiedRate, documentationCompleteRate, followUpActionedRate };
}

// ── Evaluator 2: Compliance (0-25) ───────────────────────────────────────

export function evaluateNotifiableEventsCompliance(
  records: NotifiableEventsRecord[],
): NotifiableEventsComplianceResult {
  const n = records.length;

  if (n === 0) {
    return { overallScore: 0, totalRecords: 0, regulatoryBodyNotifiedRate: 0, timelyRecordingRate: 0, notificationTimelyRate: 0, categoryDiversityRatio: 0, uniqueCategories: 0 };
  }

  const regulatoryBodyNotifiedRate = pct(records.filter((r) => r.regulatoryBodyNotified).length, n);
  const timelyRecordingRate = pct(records.filter((r) => r.timelyRecording).length, n);
  const notificationTimelyRate = pct(records.filter((r) => r.notificationTimely).length, n);

  const uniqueCategoriesSet = new Set(records.map((r) => r.category));
  const uniqueCategories = uniqueCategoriesSet.size;
  const categoryDiversityRatio = Math.round((uniqueCategories / 8) * 100) / 100;

  let score = 0;
  score += (regulatoryBodyNotifiedRate / 100) * 8;
  score += (timelyRecordingRate / 100) * 7;
  score += (notificationTimelyRate / 100) * 5;
  score += categoryDiversityRatio * 5;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalRecords: n, regulatoryBodyNotifiedRate, timelyRecordingRate, notificationTimelyRate, categoryDiversityRatio, uniqueCategories };
}

// ── Evaluator 3: Policy (0-25) ───────────────────────────────────────────

export function evaluateNotifiableEventsPolicy(
  policy: NotifiableEventsPolicy | null,
): NotifiableEventsPolicyResult {
  if (policy === null) {
    return { overallScore: 0, notifiableEventsPolicy: false, notificationTimeframePolicy: false, ofstedNotificationProcedure: false, localAuthorityNotificationPolicy: false, internalEscalationPolicy: false, postIncidentReviewPolicy: false, recordKeepingPolicy: false };
  }

  let score = 0;
  if (policy.notifiableEventsPolicy) score += 4;
  if (policy.notificationTimeframePolicy) score += 4;
  if (policy.ofstedNotificationProcedure) score += 4;
  if (policy.localAuthorityNotificationPolicy) score += 4;
  if (policy.internalEscalationPolicy) score += 3;
  if (policy.postIncidentReviewPolicy) score += 3;
  if (policy.recordKeepingPolicy) score += 3;

  return {
    overallScore: Math.min(25, Math.max(0, score)),
    notifiableEventsPolicy: policy.notifiableEventsPolicy,
    notificationTimeframePolicy: policy.notificationTimeframePolicy,
    ofstedNotificationProcedure: policy.ofstedNotificationProcedure,
    localAuthorityNotificationPolicy: policy.localAuthorityNotificationPolicy,
    internalEscalationPolicy: policy.internalEscalationPolicy,
    postIncidentReviewPolicy: policy.postIncidentReviewPolicy,
    recordKeepingPolicy: policy.recordKeepingPolicy,
  };
}

// ── Evaluator 4: Staff Readiness (0-25) ──────────────────────────────────

export function evaluateStaffNotifiableEventsReadiness(
  training: StaffNotifiableEventsTraining[],
): StaffNotifiableEventsReadinessResult {
  const n = training.length;

  if (n === 0) {
    return { overallScore: 0, totalStaff: 0, notifiableEventsKnowledgeRate: 0, ofstedNotificationProcessRate: 0, localAuthorityReportingRate: 0, internalEscalationProcedureRate: 0, documentationRequirementsRate: 0, postIncidentReviewSkillsRate: 0 };
  }

  const notifiableEventsKnowledgeRate = pct(training.filter((t) => t.notifiableEventsKnowledge).length, n);
  const ofstedNotificationProcessRate = pct(training.filter((t) => t.ofstedNotificationProcess).length, n);
  const localAuthorityReportingRate = pct(training.filter((t) => t.localAuthorityReporting).length, n);
  const internalEscalationProcedureRate = pct(training.filter((t) => t.internalEscalationProcedure).length, n);
  const documentationRequirementsRate = pct(training.filter((t) => t.documentationRequirements).length, n);
  const postIncidentReviewSkillsRate = pct(training.filter((t) => t.postIncidentReviewSkills).length, n);

  let score = 0;
  score += (notifiableEventsKnowledgeRate / 100) * 6;
  score += (ofstedNotificationProcessRate / 100) * 5;
  score += (localAuthorityReportingRate / 100) * 5;
  score += (internalEscalationProcedureRate / 100) * 4;
  score += (documentationRequirementsRate / 100) * 3;
  score += (postIncidentReviewSkillsRate / 100) * 2;
  score = Math.round(score * 10) / 10;
  score = Math.max(0, Math.min(25, score));

  return { overallScore: score, totalStaff: n, notifiableEventsKnowledgeRate, ofstedNotificationProcessRate, localAuthorityReportingRate, internalEscalationProcedureRate, documentationRequirementsRate, postIncidentReviewSkillsRate };
}

// ── Build Child Notifiable Events Profiles ──────────────────────────────

export function buildChildNotifiableEventsProfiles(
  records: NotifiableEventsRecord[],
): ChildNotifiableEventsProfile[] {
  if (records.length === 0) return [];

  const childMap = new Map<string, { childId: string; childName: string; records: NotifiableEventsRecord[] }>();

  for (const r of records) {
    if (!childMap.has(r.childId)) {
      childMap.set(r.childId, { childId: r.childId, childName: r.childName, records: [] });
    }
    childMap.get(r.childId)!.records.push(r);
  }

  return Array.from(childMap.values()).map((child) => {
    const totalRecords = child.records.length;
    const notificationTimelyRate = pct(child.records.filter((r) => r.notificationTimely).length, totalRecords);
    const correctRecipientsNotifiedRate = pct(child.records.filter((r) => r.correctRecipientsNotified).length, totalRecords);
    const uniqueCategoriesSet = new Set(child.records.map((r) => r.category));
    const categoriesCovered = Array.from(uniqueCategoriesSet);

    let frequencyScore = 0;
    if (totalRecords >= 10) frequencyScore = 2;
    else if (totalRecords >= 5) frequencyScore = 1;

    let rate1Score = 0;
    if (notificationTimelyRate >= 80) rate1Score = 3;
    else if (notificationTimelyRate >= 60) rate1Score = 2;
    else if (notificationTimelyRate >= 40) rate1Score = 1;

    let rate2Score = 0;
    if (correctRecipientsNotifiedRate >= 80) rate2Score = 3;
    else if (correctRecipientsNotifiedRate >= 60) rate2Score = 2;
    else if (correctRecipientsNotifiedRate >= 40) rate2Score = 1;

    let diversityBonus = 0;
    if (categoriesCovered.length >= 4) diversityBonus = 2;
    else if (categoriesCovered.length >= 2) diversityBonus = 1;

    const overallScore = Math.min(10, frequencyScore + rate1Score + rate2Score + diversityBonus);

    return { childId: child.childId, childName: child.childName, totalRecords, notificationTimelyRate, correctRecipientsNotifiedRate, categoriesCovered, overallScore };
  });
}

// ── Orchestrator ──────────────────────────────────────────────────────────

export interface GenerateNotifiableEventsIntelligenceInput {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  records: NotifiableEventsRecord[];
  policy: NotifiableEventsPolicy | null;
  staff: StaffNotifiableEventsTraining[];
}

export function generateNotifiableEventsIntelligence(
  input: GenerateNotifiableEventsIntelligenceInput,
): NotifiableEventsIntelligence {
  const { homeId, periodStart, periodEnd, records, policy, staff } = input;

  const periodRecords = records.filter((r) => r.date >= periodStart && r.date <= periodEnd);

  const qualityResult = evaluateNotifiableEventsQuality(periodRecords);
  const complianceResult = evaluateNotifiableEventsCompliance(periodRecords);
  const policyResult = evaluateNotifiableEventsPolicy(policy);
  const staffResult = evaluateStaffNotifiableEventsReadiness(staff);

  const childProfiles = buildChildNotifiableEventsProfiles(periodRecords);

  const rawScore = qualityResult.overallScore + complianceResult.overallScore + policyResult.overallScore + staffResult.overallScore;
  const overallScore = Math.min(100, Math.round(rawScore));
  const rating = getRating(overallScore);

  const strengths: string[] = [];
  if (overallScore >= 80) strengths.push("Notifiable events management rated Outstanding (" + overallScore + "/100)");
  else if (overallScore >= 60) strengths.push("Notifiable events management rated Good (" + overallScore + "/100)");
  if (qualityResult.overallScore >= 20) strengths.push("Notification quality is strong (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore >= 20) strengths.push("Notification compliance is strong (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore >= 20) strengths.push("Notifiable events policy framework is robust (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore >= 20) strengths.push("Staff notifiable events readiness is strong (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.notificationTimelyRate >= 90) strengths.push("Notification timeliness at " + qualityResult.notificationTimelyRate + "%");
  if (periodRecords.length > 0 && qualityResult.correctRecipientsNotifiedRate >= 90) strengths.push("Correct recipients notified at " + qualityResult.correctRecipientsNotifiedRate + "%");
  if (periodRecords.length > 0 && complianceResult.regulatoryBodyNotifiedRate >= 90) strengths.push("Regulatory body notification rate at " + complianceResult.regulatoryBodyNotifiedRate + "%");

  const areasForImprovement: string[] = [];
  if (overallScore < 40) areasForImprovement.push("Notifiable events management rated Inadequate (" + overallScore + "/100) — urgent systemic review required");
  else if (overallScore < 60) areasForImprovement.push("Notifiable events management Requires Improvement (" + overallScore + "/100)");
  if (qualityResult.overallScore < 15) areasForImprovement.push("Notification quality needs improvement (score " + qualityResult.overallScore + "/25)");
  if (complianceResult.overallScore < 15) areasForImprovement.push("Notification compliance needs improvement (score " + complianceResult.overallScore + "/25)");
  if (policyResult.overallScore < 15) areasForImprovement.push("Notifiable events policy needs strengthening (score " + policyResult.overallScore + "/25)");
  if (staffResult.overallScore < 15) areasForImprovement.push("Staff notifiable events readiness needs improvement (score " + staffResult.overallScore + "/25)");
  if (periodRecords.length > 0 && qualityResult.notificationTimelyRate < 80) areasForImprovement.push("Notification timeliness at " + qualityResult.notificationTimelyRate + "% — must improve for regulatory compliance");
  if (periodRecords.length === 0) areasForImprovement.push("No notifiable events records — recording must be documented");
  if (policy === null) areasForImprovement.push("No notifiable events policy in place — statutory requirement");
  if (staff.length === 0) areasForImprovement.push("No staff notifiable events training records — training required");

  const actions: string[] = [];
  if (policy === null || policyResult.overallScore === 0) actions.push("URGENT: No notifiable events policy — develop and implement comprehensive policy immediately");
  if (staff.length === 0) actions.push("URGENT: No staff notifiable events training — schedule training for all staff");
  if (periodRecords.length > 0 && qualityResult.notificationTimelyRate < 50) actions.push("HIGH: Notification timeliness at " + qualityResult.notificationTimelyRate + "% — review notification procedures");
  if (periodRecords.length > 0 && qualityResult.correctRecipientsNotifiedRate < 50) actions.push("HIGH: Correct recipients notified at " + qualityResult.correctRecipientsNotifiedRate + "% — ensure notification lists are up to date");
  if (periodRecords.length > 0 && qualityResult.documentationCompleteRate < 50) actions.push("HIGH: Documentation rate at " + qualityResult.documentationCompleteRate + "% — all notifiable events must be fully documented");
  if (periodRecords.length > 0 && complianceResult.timelyRecordingRate < 50) actions.push("MEDIUM: Timely recording at " + complianceResult.timelyRecordingRate + "% — records must be completed promptly");
  if (staff.length > 0 && staffResult.notifiableEventsKnowledgeRate < 50) actions.push("MEDIUM: Notifiable events knowledge at " + staffResult.notifiableEventsKnowledgeRate + "% — schedule training for staff");
  const lowScoreChildren = childProfiles.filter((p) => p.overallScore <= 3);
  if (lowScoreChildren.length > 0) actions.push("MEDIUM: " + lowScoreChildren.length + " child(ren) with low notifiable events scores — review individual notification provisions");
  if (actions.length === 0) actions.push("No immediate actions required. Notifiable events systems operating within expected standards.");

  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 40 — Notification of significant events",
    "CHR 2015 Reg 41 — Notification to Ofsted",
    "SCCIF — Social Care Common Inspection Framework",
    "Children Act 1989",
    "WTSC 2023 — Working Together to Safeguard Children",
    "NMS 18 — Notification of significant events",
    "Ofsted: Guide to notifications",
  ];

  return {
    homeId, periodStart, periodEnd, overallScore, rating,
    notifiableEventsQuality: qualityResult,
    notifiableEventsCompliance: complianceResult,
    notifiableEventsPolicy: policyResult,
    staffReadiness: staffResult,
    childProfiles, strengths, areasForImprovement, actions, regulatoryLinks,
  };
}
