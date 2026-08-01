// ══════════════════════════════════════════════════════════════════════════════
// Cara — Whistleblowing & Professional Courage Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Maps to: CHR 2015 Reg 13 (leadership), Reg 12 (protection), Reg 32/33
// (staff fitness), SCCIF leadership & management, PIDA 1998
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export type ConcernCategory =
  | "safeguarding"
  | "poor_practice"
  | "policy_breach"
  | "health_and_safety"
  | "medication_error"
  | "discrimination"
  | "financial_irregularity"
  | "bullying"
  | "neglect"
  | "regulatory_breach"
  | "data_protection"
  | "other";

export type ConcernStatus =
  | "raised"
  | "acknowledged"
  | "under_investigation"
  | "resolved"
  | "escalated"
  | "closed_no_action"
  | "withdrawn";

export type RaisedWith =
  | "line_manager"
  | "registered_manager"
  | "responsible_individual"
  | "ofsted"
  | "local_authority"
  | "police"
  | "external_body"
  | "anonymous_hotline";

export type OutcomeType =
  | "concern_upheld"
  | "partially_upheld"
  | "not_upheld"
  | "inconclusive"
  | "ongoing";

export type ProtectionStatus =
  | "no_detriment"
  | "detriment_reported"
  | "detriment_investigated"
  | "detriment_resolved";

// ── Interfaces ───────────────────────────────────────────────────────────────

export interface WhistleblowingConcern {
  id: string;
  homeId: string;
  raisedDate: string;
  raisedBy: string; // Can be "anonymous"
  anonymous: boolean;
  category: ConcernCategory;
  description: string;
  raisedWith: RaisedWith;
  status: ConcernStatus;
  acknowledgedDate?: string;
  investigationStartDate?: string;
  resolvedDate?: string;
  outcome?: OutcomeType;
  actionsTaken: string[];
  feedbackToWhistleblower: boolean;
  protectionStatus: ProtectionStatus;
  escalated: boolean;
  escalatedTo?: string;
  lessonsLearned?: string;
}

export interface WhistleblowingPolicy {
  id: string;
  homeId: string;
  policyVersion: string;
  lastReviewDate: string;
  nextReviewDate: string;
  status: "current" | "under_review" | "expired";
  coversAnonymousReporting: boolean;
  coversExternalReporting: boolean;
  coversProtectionFromDetriment: boolean;
  coversEscalationProcess: boolean;
  accessibleToAllStaff: boolean;
  staffSignedAwareness: number;
  totalStaff: number;
}

export interface ProfessionalCourageRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  context: string;
  action: string;
  challengeType: "practice_concern" | "policy_disagreement" | "safeguarding_alert" | "multi_agency_challenge" | "management_decision" | "peer_behaviour";
  outcome: "positive_change" | "acknowledged_no_change" | "under_review" | "dismissed" | "escalated";
  supportedByManagement: boolean;
  documentedInSupervision: boolean;
}

export interface StaffAwarenessRecord {
  id: string;
  staffId: string;
  staffName: string;
  trainingDate: string;
  trainingType: "induction" | "refresher" | "policy_update" | "scenario_training";
  knowsHowToReport: boolean;
  knowsExternalRoutes: boolean;
  feelsConfidentToRaise: boolean;
  understandsProtection: boolean;
}

export interface CultureIndicator {
  id: string;
  homeId: string;
  date: string;
  source: "staff_survey" | "supervision" | "exit_interview" | "reg44_visit" | "annual_review";
  opennesScore: number; // 1-10
  trustInManagement: number; // 1-10
  confidenceToChallenge: number; // 1-10
  fearOfReprisal: number; // 1-10 (lower is better)
  respondentCount: number;
  themes: string[];
}

// ── Result Types ─────────────────────────────────────────────────────────────

export interface ConcernHandlingResult {
  totalConcerns: number;
  categoryBreakdown: Record<string, number>;
  statusBreakdown: Record<string, number>;
  averageAcknowledgementDays: number;
  averageResolutionDays: number;
  feedbackRate: number;
  protectionRate: number;
  escalationRate: number;
  outcomeBreakdown: Record<string, number>;
  overallScore: number;
}

export interface PolicyComplianceResult {
  policyCurrent: boolean;
  coverageScore: number; // 0-100 based on what policy covers
  staffAwarenessRate: number;
  overallScore: number;
}

export interface ProfessionalCourageResult {
  totalRecords: number;
  challengeTypeBreakdown: Record<string, number>;
  positiveOutcomeRate: number;
  managementSupportRate: number;
  documentedInSupervisionRate: number;
  staffEngaged: number;
  overallScore: number;
}

export interface StaffAwarenessResult {
  totalAssessments: number;
  staffAssessed: number;
  knowsHowToReportRate: number;
  knowsExternalRoutesRate: number;
  feelsConfidentRate: number;
  understandsProtectionRate: number;
  overallScore: number;
}

export interface CultureResult {
  totalIndicators: number;
  averageOpenness: number;
  averageTrust: number;
  averageConfidence: number;
  averageFearOfReprisal: number;
  improvingTrend: boolean;
  themes: string[];
  overallScore: number;
}

export interface WhistleblowingIntelligenceResult {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: "outstanding" | "good" | "requires_improvement" | "inadequate";
  concernHandling: ConcernHandlingResult;
  policyCompliance: PolicyComplianceResult;
  professionalCourage: ProfessionalCourageResult;
  staffAwareness: StaffAwarenessResult;
  culture: CultureResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Core Functions ───────────────────────────────────────────────────────────

export function evaluateConcernHandling(
  concerns: WhistleblowingConcern[],
): ConcernHandlingResult {
  if (concerns.length === 0) {
    return {
      totalConcerns: 0, categoryBreakdown: {}, statusBreakdown: {},
      averageAcknowledgementDays: 0, averageResolutionDays: 0,
      feedbackRate: 0, protectionRate: 0, escalationRate: 0,
      outcomeBreakdown: {}, overallScore: 0,
    };
  }

  const categoryBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};
  const outcomeBreakdown: Record<string, number> = {};
  let totalAckDays = 0;
  let ackCount = 0;
  let totalResDays = 0;
  let resCount = 0;
  let feedbackGiven = 0;
  let protected_ = 0;
  let escalated = 0;

  for (const c of concerns) {
    categoryBreakdown[c.category] = (categoryBreakdown[c.category] || 0) + 1;
    statusBreakdown[c.status] = (statusBreakdown[c.status] || 0) + 1;

    if (c.outcome) {
      outcomeBreakdown[c.outcome] = (outcomeBreakdown[c.outcome] || 0) + 1;
    }

    if (c.acknowledgedDate && c.raisedDate) {
      const days = (new Date(c.acknowledgedDate).getTime() - new Date(c.raisedDate).getTime()) / (1000 * 60 * 60 * 24);
      totalAckDays += days;
      ackCount++;
    }

    if (c.resolvedDate && c.raisedDate) {
      const days = (new Date(c.resolvedDate).getTime() - new Date(c.raisedDate).getTime()) / (1000 * 60 * 60 * 24);
      totalResDays += days;
      resCount++;
    }

    if (c.feedbackToWhistleblower) feedbackGiven++;
    if (c.protectionStatus === "no_detriment" || c.protectionStatus === "detriment_resolved") protected_++;
    if (c.escalated) escalated++;
  }

  const n = concerns.length;
  const avgAckDays = ackCount > 0 ? totalAckDays / ackCount : 0;
  const avgResDays = resCount > 0 ? totalResDays / resCount : 0;
  const feedbackRate = feedbackGiven / n;
  const protectionRate = protected_ / n;
  const escalationRate = escalated / n;

  // Score: timeliness (30) + feedback (25) + protection (25) + resolution (20)
  const timelinessScore = Math.max(30 - (avgAckDays * 5), 0); // Penalise slow acknowledgement
  const feedbackScore = feedbackRate * 25;
  const protectionScore = protectionRate * 25;
  const resolutionScore = resCount > 0 ? Math.min((resCount / n) * 20, 20) : null;

  return {
    totalConcerns: n,
    categoryBreakdown,
    statusBreakdown,
    averageAcknowledgementDays: Math.round(avgAckDays * 10) / 10,
    averageResolutionDays: Math.round(avgResDays * 10) / 10,
    feedbackRate: Math.round(feedbackRate * 100),
    protectionRate: Math.round(protectionRate * 100),
    escalationRate: Math.round(escalationRate * 100),
    outcomeBreakdown,
    overallScore: Math.round(Math.min(timelinessScore + feedbackScore + protectionScore + (resolutionScore ?? 0), 100)),
  };
}

export function evaluatePolicyCompliance(
  policy: WhistleblowingPolicy | null,
  referenceDate: string,
): PolicyComplianceResult {
  if (!policy) {
    return { policyCurrent: false, coverageScore: 0, staffAwarenessRate: 0, overallScore: 0 };
  }

  const isCurrent = policy.status === "current" && policy.nextReviewDate >= referenceDate;
  let coveragePoints = 0;
  if (policy.coversAnonymousReporting) coveragePoints += 20;
  if (policy.coversExternalReporting) coveragePoints += 20;
  if (policy.coversProtectionFromDetriment) coveragePoints += 30;
  if (policy.coversEscalationProcess) coveragePoints += 20;
  if (policy.accessibleToAllStaff) coveragePoints += 10;

  const staffAwarenessRate = policy.totalStaff > 0
    ? policy.staffSignedAwareness / policy.totalStaff
    : null;

  // Score: current policy (20) + coverage (40) + staff awareness (40)
  const currentScore = isCurrent ? 20 : 0;
  const coverageScore = (coveragePoints / 100) * 40;
  const awarenessScore = (staffAwarenessRate ?? 0) * 40;

  return {
    policyCurrent: isCurrent,
    coverageScore: coveragePoints,
    staffAwarenessRate: Math.round((staffAwarenessRate ?? 0) * 100),
    overallScore: Math.round(currentScore + coverageScore + awarenessScore),
  };
}

export function evaluateProfessionalCourage(
  records: ProfessionalCourageRecord[],
): ProfessionalCourageResult {
  if (records.length === 0) {
    return {
      totalRecords: 0, challengeTypeBreakdown: {},
      positiveOutcomeRate: 0, managementSupportRate: 0,
      documentedInSupervisionRate: 0, staffEngaged: 0, overallScore: 0,
    };
  }

  const typeBreakdown: Record<string, number> = {};
  let positiveOutcome = 0;
  let supported = 0;
  let documented = 0;
  const staffSet = new Set<string>();

  for (const r of records) {
    typeBreakdown[r.challengeType] = (typeBreakdown[r.challengeType] || 0) + 1;
    if (r.outcome === "positive_change" || r.outcome === "acknowledged_no_change") positiveOutcome++;
    if (r.supportedByManagement) supported++;
    if (r.documentedInSupervision) documented++;
    staffSet.add(r.staffId);
  }

  const n = records.length;
  const positiveRate = positiveOutcome / n;
  const supportRate = supported / n;
  const docRate = documented / n;

  // Score: activity (20) + outcomes (30) + support (25) + documentation (25)
  const activityScore = Math.min(n / 6, 1) * 20; // Target 6+ instances
  const outcomeScore = positiveRate * 30;
  const supportScore = supportRate * 25;
  const docScore = docRate * 25;

  return {
    totalRecords: n,
    challengeTypeBreakdown: typeBreakdown,
    positiveOutcomeRate: Math.round(positiveRate * 100),
    managementSupportRate: Math.round(supportRate * 100),
    documentedInSupervisionRate: Math.round(docRate * 100),
    staffEngaged: staffSet.size,
    overallScore: Math.round(activityScore + outcomeScore + supportScore + docScore),
  };
}

export function evaluateStaffAwareness(
  records: StaffAwarenessRecord[],
  staffIds: string[],
): StaffAwarenessResult {
  if (records.length === 0 || staffIds.length === 0) {
    return {
      totalAssessments: 0, staffAssessed: 0,
      knowsHowToReportRate: 0, knowsExternalRoutesRate: 0,
      feelsConfidentRate: 0, understandsProtectionRate: 0,
      overallScore: 0,
    };
  }

  // Latest per staff
  const latest = new Map<string, StaffAwarenessRecord>();
  for (const r of records) {
    const existing = latest.get(r.staffId);
    if (!existing || r.trainingDate > existing.trainingDate) {
      latest.set(r.staffId, r);
    }
  }

  let knowsReport = 0;
  let knowsExternal = 0;
  let confident = 0;
  let understandsProtection = 0;

  for (const r of latest.values()) {
    if (r.knowsHowToReport) knowsReport++;
    if (r.knowsExternalRoutes) knowsExternal++;
    if (r.feelsConfidentToRaise) confident++;
    if (r.understandsProtection) understandsProtection++;
  }

  const n = latest.size;
  const coverageRate = n / staffIds.length;
  const reportRate = knowsReport / n;
  const externalRate = knowsExternal / n;
  const confidentRate = confident / n;
  const protectionRate = understandsProtection / n;

  // Score: coverage (20) + knowledge (30) + confidence (30) + protection (20)
  const coverageScore = coverageRate * 20;
  const knowledgeScore = ((reportRate + externalRate) / 2) * 30;
  const confScore = confidentRate * 30;
  const protScore = protectionRate * 20;

  return {
    totalAssessments: records.length,
    staffAssessed: n,
    knowsHowToReportRate: Math.round(reportRate * 100),
    knowsExternalRoutesRate: Math.round(externalRate * 100),
    feelsConfidentRate: Math.round(confidentRate * 100),
    understandsProtectionRate: Math.round(protectionRate * 100),
    overallScore: Math.round(coverageScore + knowledgeScore + confScore + protScore),
  };
}

export function evaluateCulture(
  indicators: CultureIndicator[],
): CultureResult {
  if (indicators.length === 0) {
    return {
      totalIndicators: 0, averageOpenness: 0, averageTrust: 0,
      averageConfidence: 0, averageFearOfReprisal: 0,
      improvingTrend: false, themes: [], overallScore: 0,
    };
  }

  let totalOpenness = 0;
  let totalTrust = 0;
  let totalConfidence = 0;
  let totalFear = 0;
  const allThemes: string[] = [];

  for (const ind of indicators) {
    totalOpenness += ind.opennesScore;
    totalTrust += ind.trustInManagement;
    totalConfidence += ind.confidenceToChallenge;
    totalFear += ind.fearOfReprisal;
    allThemes.push(...ind.themes);
  }

  const n = indicators.length;
  const avgOpenness = totalOpenness / n;
  const avgTrust = totalTrust / n;
  const avgConfidence = totalConfidence / n;
  const avgFear = totalFear / n;

  // Improving trend: compare first half vs second half
  const sorted = [...indicators].sort((a, b) => a.date.localeCompare(b.date));
  let improvingTrend = false;
  if (sorted.length >= 2) {
    const mid = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, mid);
    const secondHalf = sorted.slice(mid);
    const firstAvg = firstHalf.reduce((s, i) => s + i.confidenceToChallenge, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, i) => s + i.confidenceToChallenge, 0) / secondHalf.length;
    improvingTrend = secondAvg > firstAvg;
  }

  // Deduplicate themes
  const uniqueThemes = [...new Set(allThemes)];

  // Score: openness (25) + trust (25) + confidence (25) + low fear (25)
  const opennessScore = (avgOpenness / 10) * 25;
  const trustScore = (avgTrust / 10) * 25;
  const confScore = (avgConfidence / 10) * 25;
  const fearScore = ((10 - avgFear) / 10) * 25; // Inverted — lower fear is better

  return {
    totalIndicators: n,
    averageOpenness: Math.round(avgOpenness * 10) / 10,
    averageTrust: Math.round(avgTrust * 10) / 10,
    averageConfidence: Math.round(avgConfidence * 10) / 10,
    averageFearOfReprisal: Math.round(avgFear * 10) / 10,
    improvingTrend,
    themes: uniqueThemes,
    overallScore: Math.round(opennessScore + trustScore + confScore + fearScore),
  };
}

// ── Main Intelligence Function ───────────────────────────────────────────────

export function generateWhistleblowingIntelligence(
  concerns: WhistleblowingConcern[],
  policy: WhistleblowingPolicy | null,
  courage: ProfessionalCourageRecord[],
  awareness: StaffAwarenessRecord[],
  culture: CultureIndicator[],
  staffIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): WhistleblowingIntelligenceResult {
  const concernResult = evaluateConcernHandling(concerns);
  const policyResult = evaluatePolicyCompliance(policy, referenceDate);
  const courageResult = evaluateProfessionalCourage(courage);
  const awarenessResult = evaluateStaffAwareness(awareness, staffIds);
  const cultureResult = evaluateCulture(culture);

  // Weighted scoring (100 points):
  // Policy compliance: 20
  // Staff awareness: 20
  // Professional courage: 20
  // Culture: 25
  // Concern handling: 15 (if no concerns, redistribute)
  let overallScore: number;
  if (concerns.length === 0) {
    // No concerns raised — weight shifts to proactive measures
    overallScore = Math.round(
      (policyResult.overallScore * 0.25) +
      (awarenessResult.overallScore * 0.25) +
      (courageResult.overallScore * 0.20) +
      (cultureResult.overallScore * 0.30),
    );
  } else {
    overallScore = Math.round(
      (concernResult.overallScore * 0.15) +
      (policyResult.overallScore * 0.20) +
      (courageResult.overallScore * 0.20) +
      (awarenessResult.overallScore * 0.20) +
      (cultureResult.overallScore * 0.25),
    );
  }

  const rating: WhistleblowingIntelligenceResult["rating"] =
    overallScore >= 80 ? "outstanding"
    : overallScore >= 60 ? "good"
    : overallScore >= 40 ? "requires_improvement"
    : "inadequate";

  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const actions: string[] = [];

  // Strengths
  if (policyResult.policyCurrent && policyResult.coverageScore >= 80) {
    strengths.push("Comprehensive, current whistleblowing policy covering all key areas including protection from detriment");
  }
  if (awarenessResult.feelsConfidentRate >= 80) {
    strengths.push("Staff feel confident to raise concerns through established channels");
  }
  if (courageResult.managementSupportRate >= 80) {
    strengths.push("Management consistently supports staff who demonstrate professional courage");
  }
  if (cultureResult.averageOpenness >= 8) {
    strengths.push("Strong culture of openness where challenge is welcomed and valued");
  }
  if (cultureResult.averageFearOfReprisal <= 3) {
    strengths.push("Low fear of reprisal indicates a psychologically safe working environment");
  }
  if (concernResult.feedbackRate >= 80 && concerns.length > 0) {
    strengths.push("Whistleblowers consistently receive feedback on the outcome of their concerns");
  }
  if (courageResult.totalRecords >= 4) {
    strengths.push("Active culture of professional challenge with multiple staff demonstrating courage");
  }

  // Areas for improvement
  if (!policyResult.policyCurrent) {
    areasForImprovement.push("Whistleblowing policy is not current and requires immediate review");
  }
  if (policyResult.staffAwarenessRate < 100) {
    areasForImprovement.push(`${100 - policyResult.staffAwarenessRate}% of staff have not signed whistleblowing policy awareness`);
  }
  if (awarenessResult.knowsExternalRoutesRate < 80) {
    areasForImprovement.push("Not all staff know external reporting routes (Ofsted, local authority, police)");
  }
  if (awarenessResult.feelsConfidentRate < 70) {
    areasForImprovement.push("Staff confidence to raise concerns is below target — indicates potential barriers");
  }
  if (cultureResult.averageFearOfReprisal > 5) {
    areasForImprovement.push("Fear of reprisal score indicates staff may not feel safe raising concerns");
  }
  if (concernResult.averageAcknowledgementDays > 3 && concerns.length > 0) {
    areasForImprovement.push("Average acknowledgement time exceeds 3 days — concerns should be acknowledged within 48 hours");
  }
  if (courageResult.documentedInSupervisionRate < 70) {
    areasForImprovement.push("Professional challenge not consistently documented in supervision records");
  }

  // Actions
  if (!policyResult.policyCurrent) {
    actions.push("Review and update whistleblowing policy as a matter of urgency");
  }
  if (awarenessResult.overallScore < 80) {
    actions.push("Deliver whistleblowing awareness training to all staff covering internal and external reporting routes");
  }
  if (cultureResult.overallScore < 70) {
    actions.push("Implement regular culture surveys and respond to themes to build trust and openness");
  }
  if (courageResult.overallScore < 60) {
    actions.push("Model and celebrate professional courage through team meetings and supervision");
  }
  if (awarenessResult.feelsConfidentRate < 80) {
    actions.push("Address barriers to raising concerns through anonymous feedback mechanisms and open-door policy reinforcement");
  }
  if (courageResult.documentedInSupervisionRate < 80) {
    actions.push("Include professional challenge as a standing agenda item in supervision");
  }

  const regulatoryLinks = [
    "CHR 2015 Reg 13 — Leadership and management (open culture, professional challenge)",
    "CHR 2015 Reg 12 — Protection of children (duty to report concerns)",
    "CHR 2015 Reg 32/33 — Fitness of workers (whistle-blowing awareness)",
    "Public Interest Disclosure Act 1998 — Protection for whistleblowers",
    "SCCIF — Effectiveness of leaders and managers (professional curiosity, challenge)",
    "Working Together 2023 — Professional courage and safeguarding culture",
  ];

  return {
    homeId, periodStart, periodEnd, referenceDate,
    overallScore, rating,
    concernHandling: concernResult,
    policyCompliance: policyResult,
    professionalCourage: courageResult,
    staffAwareness: awarenessResult,
    culture: cultureResult,
    strengths, areasForImprovement, actions, regulatoryLinks,
  };
}

// ── Label Functions ──────────────────────────────────────────────────────────

export function getConcernCategoryLabel(category: ConcernCategory): string {
  const labels: Record<ConcernCategory, string> = {
    safeguarding: "Safeguarding", poor_practice: "Poor Practice",
    policy_breach: "Policy Breach", health_and_safety: "Health & Safety",
    medication_error: "Medication Error", discrimination: "Discrimination",
    financial_irregularity: "Financial Irregularity", bullying: "Bullying",
    neglect: "Neglect", regulatory_breach: "Regulatory Breach",
    data_protection: "Data Protection", other: "Other",
  };
  return labels[category] || category;
}

export function getConcernStatusLabel(status: ConcernStatus): string {
  const labels: Record<ConcernStatus, string> = {
    raised: "Raised", acknowledged: "Acknowledged",
    under_investigation: "Under Investigation", resolved: "Resolved",
    escalated: "Escalated", closed_no_action: "Closed — No Action",
    withdrawn: "Withdrawn",
  };
  return labels[status] || status;
}

export function getRaisedWithLabel(raised: RaisedWith): string {
  const labels: Record<RaisedWith, string> = {
    line_manager: "Line Manager", registered_manager: "Registered Manager",
    responsible_individual: "Responsible Individual", ofsted: "Ofsted",
    local_authority: "Local Authority", police: "Police",
    external_body: "External Body", anonymous_hotline: "Anonymous Hotline",
  };
  return labels[raised] || raised;
}

export function getChallengeTypeLabel(type: ProfessionalCourageRecord["challengeType"]): string {
  const labels: Record<ProfessionalCourageRecord["challengeType"], string> = {
    practice_concern: "Practice Concern",
    policy_disagreement: "Policy Disagreement",
    safeguarding_alert: "Safeguarding Alert",
    multi_agency_challenge: "Multi-Agency Challenge",
    management_decision: "Management Decision",
    peer_behaviour: "Peer Behaviour",
  };
  return labels[type] || type;
}
