// ══════════════════════════════════════════════════════════════════════════════
// WHISTLEBLOWING & PROFESSIONAL CONCERNS INTELLIGENCE ENGINE
//
// Pure deterministic engine — no AI, no external calls.
// Evaluates quality of whistleblowing culture, concern reporting, response
// quality, staff protection, and outcomes. Critical for safeguarding — staff
// must feel safe to raise concerns without fear of retaliation.
//
// Regulatory basis:
//   - CHR 2015 Reg 34 — Employment of staff (whistleblowing procedures)
//   - Public Interest Disclosure Act 1998 (PIDA) — Whistleblower protections
//   - SCCIF — Leadership and management (open culture, professional challenge)
//   - Working Together 2023 — Safeguarding culture and professional courage
//   - Ofsted Whistleblowing Policy — Expectations for children's homes
//
// No AI. No external calls. Pure input -> output.
// ══════════════════════════════════════════════════════════════════════════════

import { withinPeriod } from "@/lib/date-period";
import { below, formatRate, meets, rateOf } from "@/lib/metrics/rate";

// ── Types ──────────────────────────────────────────────────────────────────

export type ConcernCategory =
  | "safeguarding"
  | "practice_standards"
  | "regulatory_breach"
  | "bullying_harassment"
  | "fraud_financial"
  | "health_safety"
  | "data_protection"
  | "discrimination"
  | "management_conduct"
  | "staffing_levels";

export type ConcernSeverity = "critical" | "high" | "medium" | "low";

export type ConcernStatus =
  | "received"
  | "acknowledged"
  | "investigating"
  | "resolved"
  | "escalated"
  | "closed_no_action"
  | "withdrawn";

export type ResolutionOutcome =
  | "substantiated"
  | "partially_substantiated"
  | "unsubstantiated"
  | "inconclusive"
  | "withdrawn";

export type ProtectionStatus =
  | "fully_protected"
  | "partially_protected"
  | "not_protected"
  | "retaliation_reported";

export type ReporterType =
  | "staff_member"
  | "anonymous"
  | "external_professional"
  | "child"
  | "parent_carer"
  | "visitor";

export type Rating =
  | "outstanding"
  | "good"
  | "requires_improvement"
  | "inadequate";

// ── Input Interfaces ───────────────────────────────────────────────────────

export interface WhistleblowingConcern {
  id: string;
  reportDate: string;
  category: ConcernCategory;
  severity: ConcernSeverity;
  status: ConcernStatus;
  reporterType: ReporterType;
  isAnonymous: boolean;
  acknowledgedWithin48Hours: boolean;
  investigationStartedWithin7Days: boolean;
  resolvedWithin30Days: boolean;
  resolutionOutcome?: ResolutionOutcome;
  externalReferralMade: boolean;
  lessonsIdentified: boolean;
  actionsTaken: string[];
}

export interface StaffProtectionRecord {
  id: string;
  concernId: string;
  staffId: string;
  protectionStatus: ProtectionStatus;
  supportOffered: boolean;
  supportAccepted: boolean;
  confidentialityMaintained: boolean;
  retaliationReported: boolean;
  retaliationInvestigated: boolean;
}

export interface WhistleblowingPolicy {
  id: string;
  lastReviewedDate: string;
  staffAwareOfPolicy: boolean;
  policyAccessible: boolean;
  namedContactDesignated: boolean;
  externalContactsListed: boolean;
  childFriendlyVersionAvailable: boolean;
  trainingProvidedToAllStaff: boolean;
  annualRefresherCompleted: boolean;
}

export interface ConcernCulture {
  id: string;
  surveyDate: string;
  staffConfidenceToReport: number; // 0-10
  staffTrustInProcess: number; // 0-10
  perceivedFairnessOfOutcomes: number; // 0-10
  awarenessOfWhistleblowingPolicy: number; // 0-10
  responseRate: number; // 0-100 (% of staff responding)
}

// ── Result Interfaces ──────────────────────────────────────────────────────

export interface ReportingCultureResult {
  score: number;
  policyReviewedWithin12Months: boolean;
  staffAware: boolean;
  namedContact: boolean;
  externalContactsListed: boolean;
  childFriendlyVersion: boolean;
  staffConfidenceAbove7: boolean;
  staffTrustAbove7: boolean;
}

export interface ResponseQualityResult {
  score: number;
  totalConcerns: number;
  // null throughout = no concern of the relevant kind was raised, so there is
  // nothing to have acknowledged, investigated, resolved or referred.
  acknowledgedWithin48HrsRate: number | null;
  investigationStartedRate: number | null;
  resolvedWithin30DaysRate: number | null;
  lessonsIdentifiedRate: number | null;
  externalReferralForCriticalHighRate: number | null;
  averageActionsTaken: number | null;
}

export interface StaffProtectionResult {
  score: number;
  totalProtections: number;
  fullyProtectedRate: number | null;
  confidentialityMaintainedRate: number | null;
  supportOfferedRate: number | null;
  noRetaliationReported: boolean;
  allRetaliationInvestigated: boolean;
}

export interface OutcomesLearningResult {
  score: number;
  resolutionDocumentedRate: number | null;
  substantiationRate: number | null;
  lessonsIdentifiedRate: number | null;
  averageActionsPerConcern: number | null;
  escalationAppropriate: boolean;
}

export interface WhistleblowingConcernsIntelligenceResult {
  homeId: string;
  assessedAt: string;
  periodStart: string;
  periodEnd: string;

  overallScore: number;
  rating: Rating;

  reportingCulture: ReportingCultureResult;
  responseQuality: ResponseQualityResult;
  staffProtection: StaffProtectionResult;
  outcomesLearning: OutcomesLearningResult;

  strengths: string[];
  concerns: string[];
  immediateActions: string[];
  regulatoryLinks: string[];
}

// ── Sub-score 1: Reporting Culture (0-25) ──────────────────────────────────

export function evaluateReportingCulture(
  concerns: WhistleblowingConcern[],
  policy: WhistleblowingPolicy | null,
  culture: ConcernCulture | null,
): ReportingCultureResult {
  let score = 0;

  const policyReviewedWithin12Months = policy
    ? isWithin12Months(policy.lastReviewedDate)
    : false;
  const staffAware = policy?.staffAwareOfPolicy ?? false;
  const namedContact = policy?.namedContactDesignated ?? false;
  const externalContactsListed = policy?.externalContactsListed ?? false;
  const childFriendlyVersion = policy?.childFriendlyVersionAvailable ?? false;

  const staffConfidenceAbove7 = culture
    ? culture.staffConfidenceToReport >= 7
    : false;
  const staffTrustAbove7 = culture
    ? culture.staffTrustInProcess >= 7
    : false;

  if (policyReviewedWithin12Months) score += 5;
  if (staffAware) score += 4;
  if (namedContact) score += 3;
  if (externalContactsListed) score += 3;
  if (childFriendlyVersion) score += 3;
  if (staffConfidenceAbove7) score += 4;
  if (staffTrustAbove7) score += 3;

  return {
    score: Math.min(score, 25),
    policyReviewedWithin12Months,
    staffAware,
    namedContact,
    externalContactsListed,
    childFriendlyVersion,
    staffConfidenceAbove7,
    staffTrustAbove7,
  };
}

// ── Sub-score 2: Response Quality (0-30) ───────────────────────────────────

export function evaluateResponseQuality(
  concerns: WhistleblowingConcern[],
): ResponseQualityResult {
  if (concerns.length === 0) {
    // No concerns = good culture, award baseline + bonus
    return {
      score: Math.min(20 + 5, 30),
      totalConcerns: 0,
      acknowledgedWithin48HrsRate: null,
      investigationStartedRate: null,
      resolvedWithin30DaysRate: null,
      lessonsIdentifiedRate: null,
      externalReferralForCriticalHighRate: null,
      averageActionsTaken: null,
    };
  }

  let score = 0;
  const n = concerns.length;

  const ackRate = (concerns.filter((c) => c.acknowledgedWithin48Hours).length / n) * 100;
  const invRate = (concerns.filter((c) => c.investigationStartedWithin7Days).length / n) * 100;
  const resRate = (concerns.filter((c) => c.resolvedWithin30Days).length / n) * 100;
  const lessonsRate = (concerns.filter((c) => c.lessonsIdentified).length / n) * 100;

  const criticalHigh = concerns.filter(
    (c) => c.severity === "critical" || c.severity === "high",
  );
  const externalReferralRate = rateOf(
    criticalHigh.filter((c) => c.externalReferralMade),
    criticalHigh,
  );

  const totalActions = concerns.reduce((sum, c) => sum + c.actionsTaken.length, 0);
  const avgActions = totalActions / n;

  if (ackRate >= 90) score += 8;
  if (invRate >= 90) score += 6;
  if (resRate >= 80) score += 6;
  if (lessonsRate >= 80) score += 5;
  if (meets(externalReferralRate, 80)) score += 3;
  if (avgActions >= 2) score += 2;

  return {
    score: Math.min(score, 30),
    totalConcerns: n,
    acknowledgedWithin48HrsRate: Math.round(ackRate),
    investigationStartedRate: Math.round(invRate),
    resolvedWithin30DaysRate: Math.round(resRate),
    lessonsIdentifiedRate: Math.round(lessonsRate),
    externalReferralForCriticalHighRate: externalReferralRate,
    averageActionsTaken: Math.round(avgActions * 10) / 10,
  };
}

// ── Sub-score 3: Staff Protection (0-25) ───────────────────────────────────

export function evaluateStaffProtection(
  protections: StaffProtectionRecord[],
): StaffProtectionResult {
  if (protections.length === 0) {
    return {
      score: 0,
      totalProtections: 0,
      fullyProtectedRate: null,
      confidentialityMaintainedRate: null,
      supportOfferedRate: null,
      noRetaliationReported: true,
      allRetaliationInvestigated: true,
    };
  }

  let score = 0;
  const n = protections.length;

  const fullyProtectedRate =
    (protections.filter((p) => p.protectionStatus === "fully_protected").length / n) * 100;
  const confidentialityRate =
    (protections.filter((p) => p.confidentialityMaintained).length / n) * 100;
  const supportRate =
    (protections.filter((p) => p.supportOffered).length / n) * 100;

  const retaliationReported = protections.some((p) => p.retaliationReported);
  const retaliationCases = protections.filter((p) => p.retaliationReported);
  const allRetaliationInvestigated =
    retaliationCases.length === 0 ||
    retaliationCases.every((p) => p.retaliationInvestigated);

  if (fullyProtectedRate >= 90) score += 8;
  if (confidentialityRate >= 95) score += 5;
  if (supportRate >= 90) score += 4;
  if (!retaliationReported) score += 4;
  if (allRetaliationInvestigated) score += 4;

  return {
    score: Math.min(score, 25),
    totalProtections: n,
    fullyProtectedRate: Math.round(fullyProtectedRate),
    confidentialityMaintainedRate: Math.round(confidentialityRate),
    supportOfferedRate: Math.round(supportRate),
    noRetaliationReported: !retaliationReported,
    allRetaliationInvestigated,
  };
}

// ── Sub-score 4: Outcomes & Learning (0-20) ────────────────────────────────

export function evaluateOutcomesLearning(
  concerns: WhistleblowingConcern[],
): OutcomesLearningResult {
  if (concerns.length === 0) {
    return {
      score: 0,
      resolutionDocumentedRate: null,
      substantiationRate: null,
      lessonsIdentifiedRate: null,
      averageActionsPerConcern: null,
      escalationAppropriate: true,
    };
  }

  let score = 0;
  const n = concerns.length;

  // Resolution outcome documented rate
  const documented = concerns.filter((c) => c.resolutionOutcome !== undefined);
  const resolutionDocumentedRate = (documented.length / n) * 100;

  // Substantiation rate (documented only)
  const substantiated = documented.filter(
    (c) =>
      c.resolutionOutcome === "substantiated" ||
      c.resolutionOutcome === "partially_substantiated",
  );
  const substantiationRate = documented.length > 0
    ? (substantiated.length / documented.length) * 100
    : null;

  // Lessons identified rate
  const lessonsRate = (concerns.filter((c) => c.lessonsIdentified).length / n) * 100;

  // Average actions per concern
  const totalActions = concerns.reduce((sum, c) => sum + c.actionsTaken.length, 0);
  const avgActions = totalActions / n;

  // Escalation appropriate: critical/high concerns that are escalated or resolved
  const criticalHigh = concerns.filter(
    (c) => c.severity === "critical" || c.severity === "high",
  );
  const escalationAppropriate =
    criticalHigh.length === 0 ||
    criticalHigh.every(
      (c) => c.status === "escalated" || c.status === "resolved" || c.externalReferralMade,
    );

  // Score: +6 resolution documented, +5 substantiation appropriate, +4 lessons, +3 avg actions, +2 escalation
  score += Math.round((resolutionDocumentedRate / 100) * 6);

  // Substantiation rate "appropriate" means between 20-80% (not all upheld, not all rejected)
  if (substantiationRate !== null) {
    if (substantiationRate >= 20 && substantiationRate <= 80) {
      score += 5;
    } else if (substantiationRate > 0) {
      score += 3;
    }
  }

  if (lessonsRate >= 80) score += 4;
  if (avgActions >= 2) score += 3;
  if (escalationAppropriate) score += 2;

  return {
    score: Math.min(score, 20),
    resolutionDocumentedRate: Math.round(resolutionDocumentedRate),
    substantiationRate: substantiationRate === null ? null : Math.round(substantiationRate),
    lessonsIdentifiedRate: Math.round(lessonsRate),
    averageActionsPerConcern: Math.round(avgActions * 10) / 10,
    escalationAppropriate,
  };
}

// ── Rating ─────────────────────────────────────────────────────────────────

function getRating(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

// ── Insight Generation ─────────────────────────────────────────────────────

function generateStrengths(
  reportingCulture: ReportingCultureResult,
  responseQuality: ResponseQualityResult,
  staffProtection: StaffProtectionResult,
  outcomesLearning: OutcomesLearningResult,
): string[] {
  const strengths: string[] = [];

  if (reportingCulture.policyReviewedWithin12Months && reportingCulture.staffAware) {
    strengths.push(
      "Whistleblowing policy is current and staff are aware of reporting procedures",
    );
  }
  if (reportingCulture.namedContact && reportingCulture.externalContactsListed) {
    strengths.push(
      "Named contact designated and external reporting routes clearly documented",
    );
  }
  if (reportingCulture.childFriendlyVersion) {
    strengths.push(
      "Child-friendly version of whistleblowing policy available — promotes rights awareness",
    );
  }
  if (reportingCulture.staffConfidenceAbove7 && reportingCulture.staffTrustAbove7) {
    strengths.push(
      "Staff demonstrate high confidence and trust in whistleblowing processes",
    );
  }
  if (responseQuality.totalConcerns === 0) {
    strengths.push(
      "No formal concerns raised this period — may indicate healthy culture, but verify staff feel able to raise concerns",
    );
  }
  if (meets(responseQuality.acknowledgedWithin48HrsRate, 90)) {
    strengths.push(
      "Concerns consistently acknowledged within 48 hours — demonstrates responsive management",
    );
  }
  if (meets(responseQuality.resolvedWithin30DaysRate, 80)) {
    strengths.push(
      "Concerns resolved within 30 days in most cases — timely investigation and resolution",
    );
  }
  if (meets(staffProtection.fullyProtectedRate, 90)) {
    strengths.push(
      "Whistleblowers consistently protected from detriment — compliant with PIDA 1998",
    );
  }
  if (staffProtection.noRetaliationReported) {
    strengths.push(
      "No retaliation reported against staff who raised concerns",
    );
  }
  if (meets(staffProtection.confidentialityMaintainedRate, 95)) {
    strengths.push(
      "Confidentiality maintained in all or nearly all cases",
    );
  }
  if (meets(outcomesLearning.lessonsIdentifiedRate, 80)) {
    strengths.push(
      "Lessons consistently identified from concerns — evidence of learning culture",
    );
  }

  return strengths;
}

function generateConcerns(
  reportingCulture: ReportingCultureResult,
  responseQuality: ResponseQualityResult,
  staffProtection: StaffProtectionResult,
  outcomesLearning: OutcomesLearningResult,
): string[] {
  const concerns: string[] = [];

  if (!reportingCulture.policyReviewedWithin12Months) {
    concerns.push(
      "Whistleblowing policy not reviewed within 12 months — requires immediate review",
    );
  }
  if (!reportingCulture.staffAware) {
    concerns.push(
      "Staff not recorded as aware of whistleblowing policy — training gap",
    );
  }
  if (!reportingCulture.namedContact) {
    concerns.push(
      "No named contact designated for whistleblowing concerns — CHR 2015 Reg 34 requirement",
    );
  }
  if (!reportingCulture.externalContactsListed) {
    concerns.push(
      "External reporting contacts not listed in policy — staff must know how to report externally",
    );
  }
  if (!reportingCulture.childFriendlyVersion) {
    concerns.push(
      "No child-friendly version of whistleblowing policy — children should understand how to raise concerns",
    );
  }
  if (!reportingCulture.staffConfidenceAbove7) {
    concerns.push(
      "Staff confidence to report concerns is below target — potential barriers to raising concerns",
    );
  }
  if (below(responseQuality.acknowledgedWithin48HrsRate, 90)) {
    concerns.push(
      `Only ${formatRate(responseQuality.acknowledgedWithin48HrsRate)} of concerns acknowledged within 48 hours — target is 90%`,
    );
  }
  if (below(responseQuality.investigationStartedRate, 90)) {
    concerns.push(
      `Only ${formatRate(responseQuality.investigationStartedRate)} of investigations started within 7 days — target is 90%`,
    );
  }
  if (!staffProtection.noRetaliationReported) {
    concerns.push(
      "Retaliation reported against whistleblower(s) — serious PIDA 1998 breach requiring urgent action",
    );
  }
  if (below(staffProtection.fullyProtectedRate, 90)) {
    concerns.push(
      `Fully protected rate is ${formatRate(staffProtection.fullyProtectedRate)} — below 90% target`,
    );
  }
  if (below(staffProtection.confidentialityMaintainedRate, 95)) {
    concerns.push(
      `Confidentiality maintained in only ${formatRate(staffProtection.confidentialityMaintainedRate)} of cases — below 95% target`,
    );
  }
  if (below(outcomesLearning.lessonsIdentifiedRate, 80)) {
    concerns.push(
      `Lessons identified in only ${formatRate(outcomesLearning.lessonsIdentifiedRate)} of concerns — missing learning opportunities`,
    );
  }

  return concerns;
}

function generateImmediateActions(
  reportingCulture: ReportingCultureResult,
  responseQuality: ResponseQualityResult,
  staffProtection: StaffProtectionResult,
  outcomesLearning: OutcomesLearningResult,
): string[] {
  const actions: string[] = [];

  if (!reportingCulture.policyReviewedWithin12Months) {
    actions.push(
      "URGENT: Review and update whistleblowing policy — CHR 2015 Reg 34 requires current, accessible policy",
    );
  }
  if (!reportingCulture.namedContact) {
    actions.push(
      "HIGH: Designate a named contact for whistleblowing concerns and communicate to all staff",
    );
  }
  if (!staffProtection.noRetaliationReported) {
    actions.push(
      "URGENT: Investigate all reported retaliation against whistleblowers — PIDA 1998 duty",
    );
  }
  if (!staffProtection.allRetaliationInvestigated) {
    actions.push(
      "URGENT: Outstanding retaliation investigations must be completed as a matter of urgency",
    );
  }
  if (!reportingCulture.staffAware) {
    actions.push(
      "HIGH: Deliver whistleblowing awareness training to all staff within 30 days",
    );
  }
  if (!reportingCulture.externalContactsListed) {
    actions.push(
      "MEDIUM: Add external reporting contacts (Ofsted, CQC, local authority) to whistleblowing policy",
    );
  }
  if (!reportingCulture.childFriendlyVersion) {
    actions.push(
      "MEDIUM: Develop child-friendly version of whistleblowing information",
    );
  }
  if (below(responseQuality.acknowledgedWithin48HrsRate, 90)) {
    actions.push(
      "HIGH: Implement 48-hour acknowledgement protocol for all whistleblowing concerns",
    );
  }
  if (below(outcomesLearning.lessonsIdentifiedRate, 80)) {
    actions.push(
      "MEDIUM: Embed lessons-learned review into concern resolution process",
    );
  }

  if (actions.length === 0) {
    actions.push(
      "No immediate actions required. Whistleblowing procedures are operating effectively.",
    );
  }

  return actions;
}

function generateRegulatoryLinks(
  reportingCulture: ReportingCultureResult,
  staffProtection: StaffProtectionResult,
): string[] {
  const links = new Set<string>();

  links.add("CHR 2015 Reg 34 — Employment of staff (whistleblowing procedures)");
  links.add("Public Interest Disclosure Act 1998 — Whistleblower protections");
  links.add("SCCIF — Leadership and management (open culture)");

  if (!reportingCulture.policyReviewedWithin12Months || !reportingCulture.staffAware) {
    links.add("Working Together 2023 — Safeguarding culture and professional courage");
  }

  if (!staffProtection.noRetaliationReported) {
    links.add("PIDA 1998 s.47B — Protection from detriment for making protected disclosure");
  }

  links.add("Ofsted Whistleblowing Policy — Expectations for children's homes");

  return [...links];
}

// ── Helper ─────────────────────────────────────────────────────────────────

function isWithin12Months(dateStr: string): boolean {
  const reviewDate = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - reviewDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays <= 365;
}

// ── Label Functions ────────────────────────────────────────────────────────

export function getConcernCategoryLabel(category: ConcernCategory): string {
  const labels: Record<ConcernCategory, string> = {
    safeguarding: "Safeguarding",
    practice_standards: "Practice Standards",
    regulatory_breach: "Regulatory Breach",
    bullying_harassment: "Bullying & Harassment",
    fraud_financial: "Fraud / Financial",
    health_safety: "Health & Safety",
    data_protection: "Data Protection",
    discrimination: "Discrimination",
    management_conduct: "Management Conduct",
    staffing_levels: "Staffing Levels",
  };
  return labels[category];
}

export function getConcernSeverityLabel(severity: ConcernSeverity): string {
  const labels: Record<ConcernSeverity, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return labels[severity];
}

export function getConcernStatusLabel(status: ConcernStatus): string {
  const labels: Record<ConcernStatus, string> = {
    received: "Received",
    acknowledged: "Acknowledged",
    investigating: "Investigating",
    resolved: "Resolved",
    escalated: "Escalated",
    closed_no_action: "Closed — No Action",
    withdrawn: "Withdrawn",
  };
  return labels[status];
}

export function getResolutionOutcomeLabel(outcome: ResolutionOutcome): string {
  const labels: Record<ResolutionOutcome, string> = {
    substantiated: "Substantiated",
    partially_substantiated: "Partially Substantiated",
    unsubstantiated: "Unsubstantiated",
    inconclusive: "Inconclusive",
    withdrawn: "Withdrawn",
  };
  return labels[outcome];
}

export function getProtectionStatusLabel(status: ProtectionStatus): string {
  const labels: Record<ProtectionStatus, string> = {
    fully_protected: "Fully Protected",
    partially_protected: "Partially Protected",
    not_protected: "Not Protected",
    retaliation_reported: "Retaliation Reported",
  };
  return labels[status];
}

export function getReporterTypeLabel(type: ReporterType): string {
  const labels: Record<ReporterType, string> = {
    staff_member: "Staff Member",
    anonymous: "Anonymous",
    external_professional: "External Professional",
    child: "Child",
    parent_carer: "Parent / Carer",
    visitor: "Visitor",
  };
  return labels[type];
}

// ── Main: Generate Whistleblowing Concerns Intelligence ────────────────────

export function generateWhistleblowingConcernsIntelligence(
  concerns: WhistleblowingConcern[],
  protections: StaffProtectionRecord[],
  policy: WhistleblowingPolicy | null,
  culture: ConcernCulture | null,
  homeId: string,
  periodStart: string,
  periodEnd: string,
): WhistleblowingConcernsIntelligenceResult {
  const assessedAt = new Date().toISOString();

  // Filter concerns to period
  const periodConcerns = concerns.filter(
    (c) => withinPeriod(c.reportDate, periodStart, periodEnd),
  );

  // Filter protections to match period concerns
  const periodConcernIds = new Set(periodConcerns.map((c) => c.id));
  const periodProtections = protections.filter((p) =>
    periodConcernIds.has(p.concernId),
  );

  const reportingCulture = evaluateReportingCulture(periodConcerns, policy, culture);
  const responseQuality = evaluateResponseQuality(periodConcerns);
  const staffProtection = evaluateStaffProtection(periodProtections);
  const outcomesLearning = evaluateOutcomesLearning(periodConcerns);

  const overallScore = Math.max(
    0,
    Math.min(
      100,
      reportingCulture.score +
        responseQuality.score +
        staffProtection.score +
        outcomesLearning.score,
    ),
  );

  const rating = getRating(overallScore);

  const strengths = generateStrengths(
    reportingCulture,
    responseQuality,
    staffProtection,
    outcomesLearning,
  );
  const concernsList = generateConcerns(
    reportingCulture,
    responseQuality,
    staffProtection,
    outcomesLearning,
  );
  const immediateActions = generateImmediateActions(
    reportingCulture,
    responseQuality,
    staffProtection,
    outcomesLearning,
  );
  const regulatoryLinks = generateRegulatoryLinks(reportingCulture, staffProtection);

  return {
    homeId,
    assessedAt,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    reportingCulture,
    responseQuality,
    staffProtection,
    outcomesLearning,
    strengths,
    concerns: concernsList,
    immediateActions,
    regulatoryLinks,
  };
}

// ── Demo Data ──────────────────────────────────────────────────────────────

export function getDemoWhistleblowingConcernsData(): {
  concerns: WhistleblowingConcern[];
  protections: StaffProtectionRecord[];
  policy: WhistleblowingPolicy;
  culture: ConcernCulture;
} {
  const concerns: WhistleblowingConcern[] = [
    {
      id: "wbc-001",
      reportDate: "2026-02-15",
      category: "safeguarding",
      severity: "critical",
      status: "resolved",
      reporterType: "staff_member",
      isAnonymous: false,
      acknowledgedWithin48Hours: true,
      investigationStartedWithin7Days: true,
      resolvedWithin30Days: true,
      resolutionOutcome: "substantiated",
      externalReferralMade: true,
      lessonsIdentified: true,
      actionsTaken: [
        "Staff member suspended pending investigation",
        "LADO referral made",
        "Policy review initiated",
      ],
    },
    {
      id: "wbc-002",
      reportDate: "2026-03-10",
      category: "practice_standards",
      severity: "medium",
      status: "resolved",
      reporterType: "anonymous",
      isAnonymous: true,
      acknowledgedWithin48Hours: true,
      investigationStartedWithin7Days: true,
      resolvedWithin30Days: true,
      resolutionOutcome: "partially_substantiated",
      externalReferralMade: false,
      lessonsIdentified: true,
      actionsTaken: [
        "Supervision increased for identified staff",
        "Team training session delivered",
      ],
    },
  ];

  const protections: StaffProtectionRecord[] = [
    {
      id: "prot-001",
      concernId: "wbc-001",
      staffId: "staff-010",
      protectionStatus: "fully_protected",
      supportOffered: true,
      supportAccepted: true,
      confidentialityMaintained: true,
      retaliationReported: false,
      retaliationInvestigated: false,
    },
    {
      id: "prot-002",
      concernId: "wbc-002",
      staffId: "anonymous",
      protectionStatus: "fully_protected",
      supportOffered: true,
      supportAccepted: false,
      confidentialityMaintained: true,
      retaliationReported: false,
      retaliationInvestigated: false,
    },
  ];

  const policy: WhistleblowingPolicy = {
    id: "pol-001",
    lastReviewedDate: "2026-01-15",
    staffAwareOfPolicy: true,
    policyAccessible: true,
    namedContactDesignated: true,
    externalContactsListed: true,
    childFriendlyVersionAvailable: true,
    trainingProvidedToAllStaff: true,
    annualRefresherCompleted: true,
  };

  const culture: ConcernCulture = {
    id: "cult-001",
    surveyDate: "2026-01-20",
    staffConfidenceToReport: 8,
    staffTrustInProcess: 7.5,
    perceivedFairnessOfOutcomes: 7,
    awarenessOfWhistleblowingPolicy: 9,
    responseRate: 85,
  };

  return { concerns, protections, policy, culture };
}
