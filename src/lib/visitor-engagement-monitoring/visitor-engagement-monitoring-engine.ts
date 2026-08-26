import { below, meanOf, meets, rate } from "@/lib/metrics/rate";
// ══════════════════════════════════════════════════════════════════════════════
// VISITOR ENGAGEMENT MONITORING INTELLIGENCE ENGINE
//
// Pure deterministic engine for evaluating how well a children's residential
// care home manages visitor access, monitors visitor engagement quality, and
// ensures safeguarding during visits to the home.
//
// Regulatory basis:
//   - CHR 2015 Regulation 12 — The protection of children
//   - CHR 2015 Regulation 22 — Monitoring the home
//   - SCCIF — Safety of children
//   - NMS 15 — Contact and access to the home
//   - Children Act 1989 — Welfare and safeguarding
//   - Working Together to Safeguard Children 2023
//   - Ofsted ILACS — Impact of leaders on practice
//
// No AI. No external calls. No randomness. No Date.now(). Pure input → output.
// ══════════════════════════════════════════════════════════════════════════════

// ── Type Unions ───────────────────────────────────────────────────────────

export type VisitorType =
  | "family_member"
  | "social_worker"
  | "independent_visitor"
  | "therapist"
  | "advocate"
  | "inspector"
  | "professional"
  | "other";

export type VisitOutcome =
  | "very_positive"
  | "positive"
  | "neutral"
  | "concerning"
  | "safeguarding_issue";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Label Maps & Getters ─────────────────────────────────────────────────

const visitorTypeLabels: Record<VisitorType, string> = {
  family_member: "Family Member",
  social_worker: "Social Worker",
  independent_visitor: "Independent Visitor",
  therapist: "Therapist",
  advocate: "Advocate",
  inspector: "Inspector",
  professional: "Professional",
  other: "Other",
};

export function getVisitorTypeLabel(t: VisitorType): string {
  return visitorTypeLabels[t] ?? t;
}

const visitOutcomeLabels: Record<VisitOutcome, string> = {
  very_positive: "Very Positive",
  positive: "Positive",
  neutral: "Neutral",
  concerning: "Concerning",
  safeguarding_issue: "Safeguarding Issue",
};

export function getVisitOutcomeLabel(o: VisitOutcome): string {
  return visitOutcomeLabels[o] ?? o;
}

const ratingLabels: Record<Rating, string> = {
  outstanding: "Outstanding",
  good: "Good",
  requires_improvement: "Requires Improvement",
  inadequate: "Inadequate",
};

export function getRatingLabel(r: Rating): string {
  return ratingLabels[r] ?? r;
}

// ── Core Interfaces ──────────────────────────────────────────────────────

export interface VisitorRecord {
  id: string;
  visitorType: VisitorType;
  visitDate: string;
  visitOutcome: VisitOutcome;
  identityVerified: boolean;
  signedIn: boolean;
  dbsChecked: boolean;
  childConsented: boolean;
  supervisedAppropriately: boolean;
  feedbackRecorded: boolean;
  safeguardingFollowed: boolean;
  documentedInLog: boolean;
}

export interface VisitorPolicy {
  id: string;
  visitorManagementPolicy: boolean;
  identityVerification: boolean;
  dbsCheckingProcess: boolean;
  childConsentProtocol: boolean;
  supervisionGuidance: boolean;
  safeguardingProcedure: boolean;
  regularReview: boolean;
}

export interface StaffVisitorTraining {
  id: string;
  staffId: string;
  staffName: string;
  visitorManagement: boolean;
  safeguardingVisitors: boolean;
  identityChecking: boolean;
  childProtection: boolean;
  conflictManagement: boolean;
  recordKeeping: boolean;
}

// ── Result Interfaces ────────────────────────────────────────────────────

export interface VisitorSafeguardingEvaluation {
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  identityVerifiedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  dbsCheckedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingFollowedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  signedInRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  documentedInLogRate: number | null;
  score: number;
}

export interface VisitQualityEvaluation {
  totalRecords: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveOutcomeRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childConsentedRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  feedbackRecordedRate: number | null;
  score: number;
}

export interface VisitorPolicyEvaluation {
  hasPolicy: boolean;
  visitorManagementPolicy: boolean;
  identityVerification: boolean;
  dbsCheckingProcess: boolean;
  childConsentProtocol: boolean;
  supervisionGuidance: boolean;
  safeguardingProcedure: boolean;
  regularReview: boolean;
  score: number;
}

export interface StaffVisitorReadinessEvaluation {
  totalStaff: number;
  /** null when the population is empty — nothing measured, not 0%. */
  visitorManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingVisitorsRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  identityCheckingRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  childProtectionRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  conflictManagementRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  recordKeepingRate: number | null;
  score: number;
}

export interface VisitorTypeBreakdownEntry {
  visitorType: VisitorType;
  count: number;
  /** null when the population is empty — nothing measured, not 0%. */
  positiveRate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  safeguardingRate: number | null;
}

export interface VisitorEngagementMonitoringIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  visitorSafeguarding: VisitorSafeguardingEvaluation;
  visitQuality: VisitQualityEvaluation;
  visitorPolicy: VisitorPolicyEvaluation;
  staffVisitorReadiness: StaffVisitorReadinessEvaluation;
  visitorTypeBreakdown: VisitorTypeBreakdownEntry[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── 1. Evaluate Visitor Safeguarding (25 points) ─────────────────────────
// ABSENCE pattern: empty records = 25 (no visitor issues is good)

export function evaluateVisitorSafeguarding(
  records: VisitorRecord[],
): VisitorSafeguardingEvaluation {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      identityVerifiedRate: null,
      dbsCheckedRate: null,
      safeguardingFollowedRate: null,
      signedInRate: null,
      documentedInLogRate: null,
      score: 25,
    };
  }

  const total = records.length;

  const identityVerifiedCount = records.filter((r) => r.identityVerified).length;
  const identityVerifiedRate = rate(identityVerifiedCount, total);

  const dbsCheckedCount = records.filter((r) => r.dbsChecked).length;
  const dbsCheckedRate = rate(dbsCheckedCount, total);

  const safeguardingFollowedCount = records.filter((r) => r.safeguardingFollowed).length;
  const safeguardingFollowedRate = rate(safeguardingFollowedCount, total);

  const signedInCount = records.filter((r) => r.signedIn).length;
  const signedInRate = rate(signedInCount, total);

  const documentedInLogCount = records.filter((r) => r.documentedInLog).length;
  const documentedInLogRate = rate(documentedInLogCount, total);

  // Weighted scoring:
  // Identity verified rate: 0-7
  const identityScore = Math.round(((identityVerifiedRate ?? 0) / 100) * 7);
  // DBS checked rate: 0-6
  const dbsScore = Math.round(((dbsCheckedRate ?? 0) / 100) * 6);
  // Safeguarding followed rate: 0-6
  const safeguardingScore = Math.round(((safeguardingFollowedRate ?? 0) / 100) * 6);
  // Combined signedIn + documentedInLog: 0-6
  const combinedSignDocAvg = meanOf([signedInRate, documentedInLogRate]);
  const combinedScore = Math.round(((combinedSignDocAvg ?? 0) / 100) * 6);

  const score = clamp(identityScore + dbsScore + safeguardingScore + combinedScore, 0, 25);

  return {
    totalRecords: total,
    identityVerifiedRate,
    dbsCheckedRate,
    safeguardingFollowedRate,
    signedInRate,
    documentedInLogRate,
    score,
  };
}

// ── 2. Evaluate Visit Quality (25 points) ────────────────────────────────
// empty = 0

export function evaluateVisitQuality(
  records: VisitorRecord[],
): VisitQualityEvaluation {
  if (records.length === 0) {
    return {
      totalRecords: 0,
      positiveOutcomeRate: null,
      childConsentedRate: null,
      feedbackRecordedRate: null,
      score: 0,
    };
  }

  const total = records.length;

  const positiveCount = records.filter(
    (r) => r.visitOutcome === "very_positive" || r.visitOutcome === "positive",
  ).length;
  const positiveOutcomeRate = rate(positiveCount, total);

  const childConsentedCount = records.filter((r) => r.childConsented).length;
  const childConsentedRate = rate(childConsentedCount, total);

  const feedbackRecordedCount = records.filter((r) => r.feedbackRecorded).length;
  const feedbackRecordedRate = rate(feedbackRecordedCount, total);

  // Weighted scoring:
  // Positive outcome rate: 0-8
  const positiveScore = Math.round(((positiveOutcomeRate ?? 0) / 100) * 8);
  // Child consented rate: 0-9
  const consentScore = Math.round(((childConsentedRate ?? 0) / 100) * 9);
  // Feedback recorded rate: 0-8
  const feedbackScore = Math.round(((feedbackRecordedRate ?? 0) / 100) * 8);

  const score = clamp(positiveScore + consentScore + feedbackScore, 0, 25);

  return {
    totalRecords: total,
    positiveOutcomeRate,
    childConsentedRate,
    feedbackRecordedRate,
    score,
  };
}

// ── 3. Evaluate Visitor Policy (25 points) ───────────────────────────────
// null = 0

export function evaluateVisitorPolicy(
  policy: VisitorPolicy | null,
): VisitorPolicyEvaluation {
  if (policy === null) {
    return {
      hasPolicy: false,
      visitorManagementPolicy: false,
      identityVerification: false,
      dbsCheckingProcess: false,
      childConsentProtocol: false,
      supervisionGuidance: false,
      safeguardingProcedure: false,
      regularReview: false,
      score: 0,
    };
  }

  // 7 booleans weighted: 4+4+4+4+3+3+3 = 25
  let score = 0;
  if (policy.visitorManagementPolicy) score += 4;
  if (policy.identityVerification) score += 4;
  if (policy.dbsCheckingProcess) score += 4;
  if (policy.childConsentProtocol) score += 4;
  if (policy.supervisionGuidance) score += 3;
  if (policy.safeguardingProcedure) score += 3;
  if (policy.regularReview) score += 3;

  return {
    hasPolicy: true,
    visitorManagementPolicy: policy.visitorManagementPolicy,
    identityVerification: policy.identityVerification,
    dbsCheckingProcess: policy.dbsCheckingProcess,
    childConsentProtocol: policy.childConsentProtocol,
    supervisionGuidance: policy.supervisionGuidance,
    safeguardingProcedure: policy.safeguardingProcedure,
    regularReview: policy.regularReview,
    score: clamp(score, 0, 25),
  };
}

// ── 4. Evaluate Staff Visitor Readiness (25 points) ──────────────────────
// empty = 0

export function evaluateStaffVisitorReadiness(
  training: StaffVisitorTraining[],
): StaffVisitorReadinessEvaluation {
  if (training.length === 0) {
    return {
      totalStaff: 0,
      visitorManagementRate: null,
      safeguardingVisitorsRate: null,
      identityCheckingRate: null,
      childProtectionRate: null,
      conflictManagementRate: null,
      recordKeepingRate: null,
      score: 0,
    };
  }

  const total = training.length;

  const visitorManagementCount = training.filter((t) => t.visitorManagement).length;
  const visitorManagementRate = rate(visitorManagementCount, total);

  const safeguardingVisitorsCount = training.filter((t) => t.safeguardingVisitors).length;
  const safeguardingVisitorsRate = rate(safeguardingVisitorsCount, total);

  const identityCheckingCount = training.filter((t) => t.identityChecking).length;
  const identityCheckingRate = rate(identityCheckingCount, total);

  const childProtectionCount = training.filter((t) => t.childProtection).length;
  const childProtectionRate = rate(childProtectionCount, total);

  const conflictManagementCount = training.filter((t) => t.conflictManagement).length;
  const conflictManagementRate = rate(conflictManagementCount, total);

  const recordKeepingCount = training.filter((t) => t.recordKeeping).length;
  const recordKeepingRate = rate(recordKeepingCount, total);

  // 6 skills weighted: 6+5+5+4+3+2 = 25
  const vmScore = Math.round(((visitorManagementRate ?? 0) / 100) * 6);
  const svScore = Math.round(((safeguardingVisitorsRate ?? 0) / 100) * 5);
  const icScore = Math.round(((identityCheckingRate ?? 0) / 100) * 5);
  const cpScore = Math.round(((childProtectionRate ?? 0) / 100) * 4);
  const cmScore = Math.round(((conflictManagementRate ?? 0) / 100) * 3);
  const rkScore = Math.round(((recordKeepingRate ?? 0) / 100) * 2);

  const score = clamp(vmScore + svScore + icScore + cpScore + cmScore + rkScore, 0, 25);

  return {
    totalStaff: total,
    visitorManagementRate,
    safeguardingVisitorsRate,
    identityCheckingRate,
    childProtectionRate,
    conflictManagementRate,
    recordKeepingRate,
    score,
  };
}

// ── Build Visitor Type Breakdown ─────────────────────────────────────────

export function buildVisitorTypeBreakdown(
  records: VisitorRecord[],
): VisitorTypeBreakdownEntry[] {
  const groups = new Map<VisitorType, VisitorRecord[]>();

  for (const r of records) {
    const existing = groups.get(r.visitorType) ?? [];
    existing.push(r);
    groups.set(r.visitorType, existing);
  }

  const result: VisitorTypeBreakdownEntry[] = [];

  for (const [visitorType, recs] of groups) {
    const count = recs.length;
    const positiveCount = recs.filter(
      (r) => r.visitOutcome === "very_positive" || r.visitOutcome === "positive",
    ).length;
    const safeguardingCount = recs.filter((r) => r.safeguardingFollowed).length;

    result.push({
      visitorType,
      count,
      positiveRate: rate(positiveCount, count),
      safeguardingRate: rate(safeguardingCount, count),
    });
  }

  return result;
}

// ── Generate Full Intelligence ───────────────────────────────────────────

export function generateVisitorEngagementMonitoringIntelligence(
  records: VisitorRecord[],
  policy: VisitorPolicy | null,
  training: StaffVisitorTraining[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
): VisitorEngagementMonitoringIntelligence {
  const visitorSafeguarding = evaluateVisitorSafeguarding(records);
  const visitQuality = evaluateVisitQuality(records);
  const visitorPolicy = evaluateVisitorPolicy(policy);
  const staffVisitorReadiness = evaluateStaffVisitorReadiness(training);
  const visitorTypeBreakdown = buildVisitorTypeBreakdown(records);

  // Sum 4 evaluators, cap at 100
  const overallScore = clamp(
    visitorSafeguarding.score +
      visitQuality.score +
      visitorPolicy.score +
      staffVisitorReadiness.score,
    0,
    100,
  );

  const rating = getRating(overallScore);

  // ── Strengths ─────────────────────────────────────────────────────────
  const strengths: string[] = [];

  if (meets(visitorSafeguarding.identityVerifiedRate, 80) && visitorSafeguarding.totalRecords > 0) {
    strengths.push("Strong identity verification practices — visitors are consistently verified before access is granted");
  }

  if (meets(visitQuality.childConsentedRate, 80) && visitQuality.totalRecords > 0) {
    strengths.push("Children's wishes are respected — consent is routinely sought and recorded before visits take place");
  }

  if (meets(visitorSafeguarding.safeguardingFollowedRate, 80) && visitorSafeguarding.totalRecords > 0) {
    strengths.push("Robust safeguarding protocols during visits — safeguarding procedures are consistently followed");
  }

  if (meets(visitorSafeguarding.dbsCheckedRate, 80) && visitorSafeguarding.totalRecords > 0) {
    strengths.push("DBS checking is thorough — the home verifies visitor suitability before allowing access");
  }

  if (meets(visitorSafeguarding.signedInRate, 80) && visitorSafeguarding.totalRecords > 0) {
    strengths.push("Visitor sign-in compliance is strong — access to the home is well controlled");
  }

  if (meets(visitorSafeguarding.documentedInLogRate, 80) && visitorSafeguarding.totalRecords > 0) {
    strengths.push("Visitor logs are well maintained — visits are accurately documented for oversight and audit");
  }

  if (meets(visitQuality.positiveOutcomeRate, 80) && visitQuality.totalRecords > 0) {
    strengths.push("Visit outcomes are overwhelmingly positive — visitors and children benefit from well-managed engagement");
  }

  if (meets(visitQuality.feedbackRecordedRate, 80) && visitQuality.totalRecords > 0) {
    strengths.push("Feedback is routinely recorded after visits — the home actively monitors engagement quality");
  }

  if (visitorPolicy.hasPolicy && visitorPolicy.score >= 20) {
    strengths.push("Comprehensive visitor policy framework in place — policies cover key safeguarding areas");
  }

  if (staffVisitorReadiness.score >= 20 && staffVisitorReadiness.totalStaff > 0) {
    strengths.push("Staff are well trained in visitor management — the team is equipped to manage visits safely");
  }

  // ── Areas for Improvement ─────────────────────────────────────────────
  const areasForImprovement: string[] = [];

  if (visitQuality.totalRecords > 0 && below(visitQuality.positiveOutcomeRate, 60)) {
    areasForImprovement.push("Positive visit outcomes are below 60% — visit planning and support arrangements should be reviewed");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.safeguardingFollowedRate, 80)) {
    areasForImprovement.push("Safeguarding procedures are not consistently followed during visits — this must be addressed as a priority");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.identityVerifiedRate, 80)) {
    areasForImprovement.push("Identity verification is inconsistent — not all visitors are being checked before entry");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.dbsCheckedRate, 80)) {
    areasForImprovement.push("DBS checking rates are below expected standards — visitor suitability checks need improvement");
  }

  if (visitQuality.totalRecords > 0 && below(visitQuality.childConsentedRate, 80)) {
    areasForImprovement.push("Child consent is not being consistently obtained before visits — the voice of the child must be prioritised");
  }

  if (visitQuality.totalRecords > 0 && below(visitQuality.feedbackRecordedRate, 80)) {
    areasForImprovement.push("Post-visit feedback is not being consistently recorded — monitoring of engagement quality is incomplete");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.signedInRate, 80)) {
    areasForImprovement.push("Visitor sign-in compliance is below standard — access control must be tightened");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.documentedInLogRate, 80)) {
    areasForImprovement.push("Visitor log documentation is incomplete — all visits must be recorded in the visitor log");
  }

  // ── Actions ───────────────────────────────────────────────────────────
  const actions: string[] = [];

  if (records.length === 0) {
    actions.push("Begin recording visitor engagement data — no visitor records are currently held for this period");
  }

  if (policy === null) {
    actions.push("[URGENT] Develop and implement a visitor engagement and management policy immediately — this is a regulatory requirement");
  }

  if (training.length === 0) {
    actions.push("[URGENT] Establish staff training records for visitor management — no training data is currently held");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.safeguardingFollowedRate, 80)) {
    actions.push("Review and reinforce safeguarding procedures for all visits — compliance is below the expected threshold");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.identityVerifiedRate, 80)) {
    actions.push("Implement mandatory identity verification for all visitors before entry to the home");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.dbsCheckedRate, 80)) {
    actions.push("Ensure DBS checks are completed and verified for all visitors who require them");
  }

  if (visitQuality.totalRecords > 0 && below(visitQuality.childConsentedRate, 80)) {
    actions.push("Ensure child consent is obtained and documented before every visit takes place");
  }

  if (visitQuality.totalRecords > 0 && below(visitQuality.positiveOutcomeRate, 60)) {
    actions.push("Review visit planning arrangements to improve the quality and outcomes of visits");
  }

  if (visitQuality.totalRecords > 0 && below(visitQuality.feedbackRecordedRate, 80)) {
    actions.push("Introduce a systematic process for recording feedback after every visit");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.signedInRate, 80)) {
    actions.push("Enforce visitor sign-in procedures at all entry points to the home");
  }

  if (visitorSafeguarding.totalRecords > 0 && below(visitorSafeguarding.documentedInLogRate, 80)) {
    actions.push("Ensure all visits are documented in the visitor log without exception");
  }

  if (staffVisitorReadiness.totalStaff > 0 && staffVisitorReadiness.score < 20) {
    actions.push("Prioritise staff training in visitor management — current training levels are insufficient");
  }

  // ── Regulatory Links ──────────────────────────────────────────────────
  const regulatoryLinks: string[] = [
    "CHR 2015 Regulation 12 — The protection of children",
    "CHR 2015 Regulation 22 — Monitoring the home",
    "SCCIF — Safety of children",
    "NMS 15 — Contact and access to the home",
    "Children Act 1989 — Welfare and safeguarding",
    "Working Together to Safeguard Children 2023",
    "Ofsted ILACS — Impact of leaders on practice",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    visitorSafeguarding,
    visitQuality,
    visitorPolicy,
    staffVisitorReadiness,
    visitorTypeBreakdown,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
