// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Consent Management Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Analyses effectiveness of consent management across:
//   • Consent recording & currency
//   • Delegated authority clarity
//   • Gillick competence assessments
//   • Consent compliance & audit
//
// Regulatory framework:
//   CHR 2015 Reg 20 (delegated authority)
//   Children Act 1989 s33(3) (parental responsibility)
//   Gillick v West Norfolk [1986] (competence)
//   DfE Delegated Authority Guide 2013
//   SCCIF (Social Care Common Inspection Framework)
//   UNCRC Article 12 (right to be heard in decisions)
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type ConsentArea =
  | "medical_routine"        // GP, dental, optician
  | "medical_emergency"      // Emergency medical treatment
  | "medical_specialist"     // Referrals to specialists, CAMHS
  | "medication"             // Administering medication
  | "immunisation"           // Vaccinations
  | "education"              // School trips, extra-curricular
  | "overnight_stay"         // Sleepovers, residential trips
  | "haircut"                // Haircuts and personal appearance
  | "photography"            // Photos for social media, school
  | "internet_social_media"  // Online access and social media
  | "contact"                // Contact with family/friends
  | "passport_travel"        // Travel documents and trips abroad
  | "religious_cultural"     // Religious observance, cultural activities
  | "data_sharing"           // Sharing info with professionals
  | "independent_activity"   // Going out independently
  | "other";

export type ConsentStatus =
  | "granted"
  | "refused"
  | "withdrawn"
  | "pending"
  | "not_sought"
  | "expired";

export type ConsentHolder =
  | "parent_mother"
  | "parent_father"
  | "local_authority"
  | "child_gillick"
  | "court_order"
  | "delegated_carer"
  | "other";

export type GillickOutcome =
  | "competent"
  | "not_competent"
  | "partially_competent"
  | "review_required";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface ConsentRecord {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  consentArea: ConsentArea;
  consentHolder: ConsentHolder;
  consentHolderName: string;
  status: ConsentStatus;
  dateRecorded: string;
  expiryDate?: string;          // When consent needs renewal
  conditions?: string;          // Any conditions on the consent
  evidenceOnFile: boolean;      // Written consent on file
  childInformed: boolean;       // Child was informed of the decision
  childAgreed?: boolean;        // Child's own view aligns
}

export interface DelegatedAuthority {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  area: ConsentArea;
  delegatedTo: "registered_manager" | "key_worker" | "any_carer" | "specific_staff";
  delegatedToName?: string;
  agreedDate: string;
  reviewDate: string;
  documentedInPlacementPlan: boolean;
  parentAgreed: boolean;
  localAuthorityAgreed: boolean;
  restrictions?: string;
}

export interface GillickAssessment {
  id: string;
  homeId: string;
  childId: string;
  childName: string;
  assessmentDate: string;
  assessedBy: string;
  area: ConsentArea;
  outcome: GillickOutcome;
  reasoning: string;
  childViews: string;
  reviewDate: string;
  parentInformed: boolean;
}

export interface ConsentAudit {
  id: string;
  homeId: string;
  auditDate: string;
  auditor: string;
  totalRecordsChecked: number;
  compliantRecords: number;
  issuesFound: string[];
  actionsRequired: string[];
  actionsCompleted: number;
  nextAuditDate: string;
}

export interface ChildConsentProfile {
  childId: string;
  childName: string;
  totalConsents: number;
  grantedConsents: number;
  pendingConsents: number;
  expiredConsents: number;
  evidenceOnFileRate: number;
  childInformedRate: number;
  delegatedAreas: number;
  gillickAssessments: number;
  gillickCompetentAreas: number;
  consentCoverageRate: number;   // % of standard areas with recorded consent
  overallScore: number;          // 0–10
}

// ── Result Types ────────────────────────────────────────────────────────────

export interface ConsentRecordingResult {
  totalRecords: number;
  granted: number;
  refused: number;
  withdrawn: number;
  pending: number;
  notSought: number;
  expired: number;
  evidenceOnFileRate: number;    // %
  childInformedRate: number;     // %
  childAgreedRate: number;       // % of those where child view is recorded
  consentCurrencyRate: number;   // % not expired
  overallScore: number;          // 0–30
}

export interface DelegatedAuthorityResult {
  totalDelegations: number;
  documentedInPlanRate: number;  // %
  parentAgreedRate: number;      // %
  laAgreedRate: number;          // %
  overdueReviews: number;
  areasWithDelegation: number;
  overallScore: number;          // 0–25
}

export interface GillickCompetenceResult {
  totalAssessments: number;
  competent: number;
  notCompetent: number;
  partiallyCompetent: number;
  reviewRequired: number;
  parentInformedRate: number;    // %
  overdueReviews: number;
  childViewsCapturedRate: number; // % where childViews is non-empty
  overallScore: number;          // 0–25
}

export interface ConsentAuditResult {
  totalAudits: number;
  averageComplianceRate: number; // %
  totalIssuesFound: number;
  actionsCompletionRate: number; // %
  auditCurrent: boolean;         // Most recent audit is not overdue
  overallScore: number;          // 0–20
}

export interface ConsentManagementIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  referenceDate: string;
  overallScore: number;
  rating: Rating;
  recording: ConsentRecordingResult;
  delegatedAuthority: DelegatedAuthorityResult;
  gillickCompetence: GillickCompetenceResult;
  audit: ConsentAuditResult;
  childProfiles: ChildConsentProfile[];
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Constants ───────────────────────────────────────────────────────────────

/** Standard consent areas every child should ideally have recorded. */
const STANDARD_CONSENT_AREAS: ConsentArea[] = [
  "medical_routine", "medical_emergency", "medication", "immunisation",
  "education", "overnight_stay", "haircut", "photography",
  "internet_social_media", "contact", "independent_activity", "data_sharing",
];

// ── Helper Functions ────────────────────────────────────────────────────────

function pct(num: number, den: number): number {
  if (den === 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function ratingFromScore(score: number): Rating {
  if (score >= 80) return "outstanding";
  if (score >= 60) return "good";
  if (score >= 40) return "requires_improvement";
  return "inadequate";
}

function isInPeriod(date: string | undefined, start: string, end: string): boolean {
  if (!date) return false;
  return date >= start && date <= end;
}

// ── Label Functions ─────────────────────────────────────────────────────────

export function getConsentAreaLabel(a: ConsentArea): string {
  const labels: Record<ConsentArea, string> = {
    medical_routine: "Routine Medical",
    medical_emergency: "Emergency Medical",
    medical_specialist: "Specialist Referral",
    medication: "Medication",
    immunisation: "Immunisation",
    education: "Education Activities",
    overnight_stay: "Overnight Stays",
    haircut: "Haircut / Appearance",
    photography: "Photography",
    internet_social_media: "Internet & Social Media",
    contact: "Contact Arrangements",
    passport_travel: "Passport & Travel",
    religious_cultural: "Religious / Cultural",
    data_sharing: "Data Sharing",
    independent_activity: "Independent Activities",
    other: "Other",
  };
  return labels[a] || a;
}

export function getConsentStatusLabel(s: ConsentStatus): string {
  const labels: Record<ConsentStatus, string> = {
    granted: "Granted",
    refused: "Refused",
    withdrawn: "Withdrawn",
    pending: "Pending",
    not_sought: "Not Sought",
    expired: "Expired",
  };
  return labels[s] || s;
}

export function getConsentHolderLabel(h: ConsentHolder): string {
  const labels: Record<ConsentHolder, string> = {
    parent_mother: "Mother",
    parent_father: "Father",
    local_authority: "Local Authority",
    child_gillick: "Child (Gillick Competent)",
    court_order: "Court Order",
    delegated_carer: "Delegated to Carer",
    other: "Other",
  };
  return labels[h] || h;
}

export function getGillickOutcomeLabel(o: GillickOutcome): string {
  const labels: Record<GillickOutcome, string> = {
    competent: "Competent",
    not_competent: "Not Competent",
    partially_competent: "Partially Competent",
    review_required: "Review Required",
  };
  return labels[o] || o;
}

// ── Core Evaluation Functions ───────────────────────────────────────────────

/**
 * Evaluate consent recording quality and currency.
 * Focuses on: evidence on file, child informed, consent currency, child agreement.
 * Score: 0–30
 */
export function evaluateConsentRecording(
  records: ConsentRecord[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): ConsentRecordingResult {
  // Include records recorded in-period OR currently active (not expired before period start)
  const relevantRecords = records.filter((r) =>
    isInPeriod(r.dateRecorded, periodStart, periodEnd) ||
    (r.status === "granted" && (!r.expiryDate || r.expiryDate >= periodStart)),
  );

  if (relevantRecords.length === 0) {
    return {
      totalRecords: 0, granted: 0, refused: 0, withdrawn: 0, pending: 0,
      notSought: 0, expired: 0, evidenceOnFileRate: 0, childInformedRate: 0,
      childAgreedRate: 0, consentCurrencyRate: 0, overallScore: 0,
    };
  }

  const granted = relevantRecords.filter((r) => r.status === "granted").length;
  const refused = relevantRecords.filter((r) => r.status === "refused").length;
  const withdrawn = relevantRecords.filter((r) => r.status === "withdrawn").length;
  const pending = relevantRecords.filter((r) => r.status === "pending").length;
  const notSought = relevantRecords.filter((r) => r.status === "not_sought").length;
  const expired = relevantRecords.filter((r) => r.status === "expired").length;

  const evidenceOnFile = relevantRecords.filter((r) => r.evidenceOnFile).length;
  const evidenceRate = pct(evidenceOnFile, relevantRecords.length);

  const childInformed = relevantRecords.filter((r) => r.childInformed).length;
  const informedRate = pct(childInformed, relevantRecords.length);

  // Child agreed rate — only for records where childAgreed is defined
  const withChildView = relevantRecords.filter((r) => r.childAgreed !== undefined);
  const childAgreed = withChildView.filter((r) => r.childAgreed === true).length;
  const agreedRate = pct(childAgreed, withChildView.length);

  // Currency — % of records that are not expired
  const current = relevantRecords.filter((r) => r.status !== "expired").length;
  const currencyRate = pct(current, relevantRecords.length);

  // Scoring — 30 points max
  let score = 0;

  // Evidence on file: up to 10 points
  score += (evidenceRate / 100) * 10;

  // Child informed: up to 8 points
  score += (informedRate / 100) * 8;

  // Currency rate: up to 6 points
  score += (currencyRate / 100) * 6;

  // Not-sought penalty: -1 point per "not_sought" (max -4)
  score -= Math.min(notSought, 4);

  // Pending items penalty: -0.5 per pending (max -3)
  score -= Math.min(pending * 0.5, 3);

  // Child agreement bonus: up to 6 points
  if (withChildView.length > 0) {
    score += (agreedRate / 100) * 6;
  } else {
    // No child views recorded — redistribute partially to evidence
    score += (evidenceRate / 100) * 3;
  }

  return {
    totalRecords: relevantRecords.length,
    granted,
    refused,
    withdrawn,
    pending,
    notSought,
    expired,
    evidenceOnFileRate: evidenceRate,
    childInformedRate: informedRate,
    childAgreedRate: agreedRate,
    consentCurrencyRate: currencyRate,
    overallScore: Math.round(clamp(score, 0, 30) * 10) / 10,
  };
}

/**
 * Evaluate delegated authority arrangements.
 * Delegated authority normalises children's lives by allowing carers to make
 * day-to-day decisions without requiring formal consent for every activity.
 * Score: 0–25
 */
export function evaluateDelegatedAuthority(
  delegations: DelegatedAuthority[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): DelegatedAuthorityResult {
  const relevantDelegations = delegations.filter((d) =>
    isInPeriod(d.agreedDate, periodStart, periodEnd) ||
    d.reviewDate >= periodStart,
  );

  if (relevantDelegations.length === 0) {
    return {
      totalDelegations: 0, documentedInPlanRate: 0, parentAgreedRate: 0,
      laAgreedRate: 0, overdueReviews: 0, areasWithDelegation: 0,
      overallScore: 0,
    };
  }

  const documented = relevantDelegations.filter((d) => d.documentedInPlacementPlan).length;
  const documentedRate = pct(documented, relevantDelegations.length);

  const parentAgreed = relevantDelegations.filter((d) => d.parentAgreed).length;
  const parentRate = pct(parentAgreed, relevantDelegations.length);

  const laAgreed = relevantDelegations.filter((d) => d.localAuthorityAgreed).length;
  const laRate = pct(laAgreed, relevantDelegations.length);

  const overdue = relevantDelegations.filter((d) => d.reviewDate < referenceDate).length;

  const uniqueAreas = new Set(relevantDelegations.map((d) => d.area));

  // Scoring — 25 points max
  let score = 0;

  // Documented in placement plan: up to 8 points
  score += (documentedRate / 100) * 8;

  // Parent agreed: up to 5 points
  score += (parentRate / 100) * 5;

  // LA agreed: up to 5 points
  score += (laRate / 100) * 5;

  // Number of areas with delegation: up to 4 points (more = more normalised life)
  score += Math.min(uniqueAreas.size / 6, 1) * 4;

  // Overdue reviews penalty: -1 per overdue (max -3)
  score -= Math.min(overdue, 3);

  // Having delegations at all: 3 points (shows proactive normalising)
  score += 3;

  return {
    totalDelegations: relevantDelegations.length,
    documentedInPlanRate: documentedRate,
    parentAgreedRate: parentRate,
    laAgreedRate: laRate,
    overdueReviews: overdue,
    areasWithDelegation: uniqueAreas.size,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate Gillick competence assessments.
 * Children's growing autonomy must be recognised. Gillick assessments
 * determine whether a child can make decisions for themselves.
 * Score: 0–25
 */
export function evaluateGillickCompetence(
  assessments: GillickAssessment[],
  childIds: string[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): GillickCompetenceResult {
  const periodAssessments = assessments.filter((a) =>
    isInPeriod(a.assessmentDate, periodStart, periodEnd),
  );

  if (periodAssessments.length === 0) {
    // No assessments — might be fine if all children are young, but engine can't know ages
    return {
      totalAssessments: 0, competent: 0, notCompetent: 0,
      partiallyCompetent: 0, reviewRequired: 0, parentInformedRate: 0,
      overdueReviews: 0, childViewsCapturedRate: 0, overallScore: 0,
    };
  }

  const competent = periodAssessments.filter((a) => a.outcome === "competent").length;
  const notCompetent = periodAssessments.filter((a) => a.outcome === "not_competent").length;
  const partial = periodAssessments.filter((a) => a.outcome === "partially_competent").length;
  const reviewReq = periodAssessments.filter((a) => a.outcome === "review_required").length;

  const parentInformed = periodAssessments.filter((a) => a.parentInformed).length;
  const parentRate = pct(parentInformed, periodAssessments.length);

  const overdue = periodAssessments.filter((a) => a.reviewDate < referenceDate).length;

  const withViews = periodAssessments.filter((a) => a.childViews && a.childViews.trim().length > 0).length;
  const viewsRate = pct(withViews, periodAssessments.length);

  // Scoring — 25 points max
  let score = 0;

  // Having assessments at all: up to 8 points (shows recognition of child autonomy)
  const coverageRatio = Math.min(periodAssessments.length / Math.max(childIds.length, 1), 1);
  score += coverageRatio * 8;

  // Child views captured: up to 7 points
  score += (viewsRate / 100) * 7;

  // Parent informed: up to 5 points
  score += (parentRate / 100) * 5;

  // Overdue review penalty: -1 per overdue (max -3)
  score -= Math.min(overdue, 3);

  // Competence recognition bonus: up to 5 points (more competent = greater autonomy recognised)
  if (periodAssessments.length > 0) {
    const competenceRate = pct(competent + partial, periodAssessments.length);
    score += (competenceRate / 100) * 5;
  }

  return {
    totalAssessments: periodAssessments.length,
    competent,
    notCompetent,
    partiallyCompetent: partial,
    reviewRequired: reviewReq,
    parentInformedRate: parentRate,
    overdueReviews: overdue,
    childViewsCapturedRate: viewsRate,
    overallScore: Math.round(clamp(score, 0, 25) * 10) / 10,
  };
}

/**
 * Evaluate consent audit findings and compliance.
 * Regular audits ensure consent records are maintained accurately.
 * Score: 0–20
 */
export function evaluateConsentAudit(
  audits: ConsentAudit[],
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): ConsentAuditResult {
  const periodAudits = audits.filter((a) => isInPeriod(a.auditDate, periodStart, periodEnd));

  if (periodAudits.length === 0) {
    return {
      totalAudits: 0, averageComplianceRate: 0, totalIssuesFound: 0,
      actionsCompletionRate: 0, auditCurrent: false, overallScore: 0,
    };
  }

  // Average compliance rate
  const totalCompliance = periodAudits.reduce(
    (sum, a) => sum + pct(a.compliantRecords, a.totalRecordsChecked),
    0,
  );
  const avgCompliance = Math.round((totalCompliance / periodAudits.length) * 10) / 10;

  const totalIssues = periodAudits.reduce((sum, a) => sum + a.issuesFound.length, 0);

  const totalActions = periodAudits.reduce((sum, a) => sum + a.actionsRequired.length, 0);
  const completedActions = periodAudits.reduce((sum, a) => sum + a.actionsCompleted, 0);
  const actionsRate = pct(completedActions, totalActions);

  // Is the most recent audit current?
  const sorted = [...periodAudits].sort((a, b) => b.auditDate.localeCompare(a.auditDate));
  const mostRecent = sorted[0];
  const auditCurrent = mostRecent.nextAuditDate >= referenceDate;

  // Scoring — 20 points max
  let score = 0;

  // Having audits: 4 points
  score += 4;

  // Average compliance: up to 8 points
  score += (avgCompliance / 100) * 8;

  // Actions completion: up to 5 points
  score += (actionsRate / 100) * 5;

  // Audit currency: 3 points if current, 0 if overdue
  if (auditCurrent) score += 3;

  return {
    totalAudits: periodAudits.length,
    averageComplianceRate: avgCompliance,
    totalIssuesFound: totalIssues,
    actionsCompletionRate: actionsRate,
    auditCurrent,
    overallScore: Math.round(clamp(score, 0, 20) * 10) / 10,
  };
}

/**
 * Build per-child consent profiles.
 */
export function buildChildConsentProfiles(
  records: ConsentRecord[],
  delegations: DelegatedAuthority[],
  gillickAssessments: GillickAssessment[],
  childIds: string[],
): ChildConsentProfile[] {
  return childIds.map((childId) => {
    const childRecords = records.filter((r) => r.childId === childId);
    const childDelegations = delegations.filter((d) => d.childId === childId);
    const childGillick = gillickAssessments.filter((a) => a.childId === childId);

    const childName = childRecords[0]?.childName || childDelegations[0]?.childName || childGillick[0]?.childName || childId;

    const granted = childRecords.filter((r) => r.status === "granted").length;
    const pending = childRecords.filter((r) => r.status === "pending").length;
    const expired = childRecords.filter((r) => r.status === "expired").length;

    const evidenceOnFile = childRecords.filter((r) => r.evidenceOnFile).length;
    const evidenceRate = pct(evidenceOnFile, childRecords.length);

    const childInformed = childRecords.filter((r) => r.childInformed).length;
    const informedRate = pct(childInformed, childRecords.length);

    const gillickCompetent = childGillick.filter(
      (a) => a.outcome === "competent" || a.outcome === "partially_competent",
    ).length;

    // Coverage: how many standard areas have a recorded consent
    const coveredAreas = new Set(childRecords.map((r) => r.consentArea));
    const coverageRate = pct(
      STANDARD_CONSENT_AREAS.filter((a) => coveredAreas.has(a)).length,
      STANDARD_CONSENT_AREAS.length,
    );

    // Child score: 0–10
    let score = 0;
    if (childRecords.length > 0) {
      score += (evidenceRate / 100) * 3;        // Evidence: 3
      score += (informedRate / 100) * 2;         // Informed: 2
      score += (coverageRate / 100) * 3;         // Coverage: 3
      if (childDelegations.length > 0) score += 1; // Has delegated authority: 1
      if (childGillick.length > 0) score += 1;     // Has Gillick assessment: 1
    }

    return {
      childId,
      childName,
      totalConsents: childRecords.length,
      grantedConsents: granted,
      pendingConsents: pending,
      expiredConsents: expired,
      evidenceOnFileRate: evidenceRate,
      childInformedRate: informedRate,
      delegatedAreas: childDelegations.length,
      gillickAssessments: childGillick.length,
      gillickCompetentAreas: gillickCompetent,
      consentCoverageRate: coverageRate,
      overallScore: Math.round(clamp(score, 0, 10) * 10) / 10,
    };
  });
}

// ── Main Intelligence Function ──────────────────────────────────────────────

/**
 * Generate comprehensive Consent Management intelligence for a home.
 */
export function generateConsentManagementIntelligence(
  records: ConsentRecord[],
  delegations: DelegatedAuthority[],
  gillickAssessments: GillickAssessment[],
  audits: ConsentAudit[],
  childIds: string[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate: string,
): ConsentManagementIntelligence {
  const recording = evaluateConsentRecording(records, periodStart, periodEnd, referenceDate);
  const delegatedAuth = evaluateDelegatedAuthority(delegations, periodStart, periodEnd, referenceDate);
  const gillick = evaluateGillickCompetence(gillickAssessments, childIds, periodStart, periodEnd, referenceDate);
  const audit = evaluateConsentAudit(audits, periodStart, periodEnd, referenceDate);
  const childProfiles = buildChildConsentProfiles(records, delegations, gillickAssessments, childIds);

  const overallScore = Math.round(
    (recording.overallScore + delegatedAuth.overallScore + gillick.overallScore + audit.overallScore) * 10,
  ) / 10;
  const rating = ratingFromScore(overallScore);

  // ── Strengths ──
  const strengths: string[] = [];
  if (recording.evidenceOnFileRate >= 90 && recording.totalRecords > 0) {
    strengths.push("Excellent record-keeping — written consent evidence is maintained on file for over 90% of decisions");
  }
  if (recording.childInformedRate >= 90 && recording.totalRecords > 0) {
    strengths.push("Children are consistently informed about consent decisions affecting them");
  }
  if (recording.consentCurrencyRate >= 95 && recording.totalRecords > 0) {
    strengths.push("Consent records are well maintained and kept up to date");
  }
  if (delegatedAuth.totalDelegations > 0 && delegatedAuth.documentedInPlanRate >= 90) {
    strengths.push("Delegated authority is clearly documented in placement plans, supporting normalised daily life");
  }
  if (delegatedAuth.areasWithDelegation >= 4) {
    strengths.push("Good range of delegated authority across multiple areas, enabling carers to make timely decisions");
  }
  if (gillick.totalAssessments > 0 && gillick.childViewsCapturedRate >= 90) {
    strengths.push("Gillick competence assessments consistently capture and respect children's views");
  }
  if (gillick.competent > 0) {
    strengths.push("Children's growing autonomy is recognised through Gillick competence assessments");
  }
  if (audit.auditCurrent && audit.averageComplianceRate >= 90) {
    strengths.push("Regular consent audits demonstrate high compliance and effective quality assurance");
  }

  // ── Areas for Improvement ──
  const areasForImprovement: string[] = [];
  if (recording.notSought > 0) {
    areasForImprovement.push(`Consent has not been sought for ${recording.notSought} area(s) — all consent decisions must be actively pursued`);
  }
  if (recording.expired > 0) {
    areasForImprovement.push(`${recording.expired} consent record(s) have expired — these need prompt renewal`);
  }
  if (recording.evidenceOnFileRate < 80 && recording.totalRecords > 0) {
    areasForImprovement.push("Written consent evidence is not consistently maintained on file");
  }
  if (recording.childInformedRate < 80 && recording.totalRecords > 0) {
    areasForImprovement.push("Children are not always informed about consent decisions — their right to be heard must be upheld");
  }
  if (delegatedAuth.totalDelegations === 0) {
    areasForImprovement.push("No delegated authority arrangements recorded — this may be restricting children's daily experiences");
  }
  if (delegatedAuth.overdueReviews > 0) {
    areasForImprovement.push(`${delegatedAuth.overdueReviews} delegated authority arrangement(s) are overdue for review`);
  }
  if (gillick.totalAssessments === 0 && childIds.length > 0) {
    areasForImprovement.push("No Gillick competence assessments recorded — children's capacity for autonomous decision-making should be assessed");
  }
  if (gillick.overdueReviews > 0) {
    areasForImprovement.push(`${gillick.overdueReviews} Gillick assessment(s) are overdue for review`);
  }
  if (audit.totalAudits === 0) {
    areasForImprovement.push("No consent audits have been conducted — regular auditing is essential for quality assurance");
  }
  if (!audit.auditCurrent && audit.totalAudits > 0) {
    areasForImprovement.push("The most recent consent audit is overdue for renewal");
  }

  // ── Actions ──
  const actions: string[] = [];
  if (recording.notSought > 0) {
    actions.push(`URGENT: Seek consent for all ${recording.notSought} outstanding area(s) where consent has not been obtained`);
  }
  if (recording.expired > 0) {
    actions.push(`HIGH: Renew ${recording.expired} expired consent record(s)`);
  }
  if (recording.pending > 0) {
    actions.push(`HIGH: Follow up on ${recording.pending} pending consent request(s)`);
  }
  if (delegatedAuth.overdueReviews > 0) {
    actions.push(`MEDIUM: Review ${delegatedAuth.overdueReviews} overdue delegated authority arrangement(s)`);
  }
  if (delegatedAuth.totalDelegations === 0 && childIds.length > 0) {
    actions.push("MEDIUM: Establish delegated authority arrangements to support normalised daily decision-making");
  }
  if (gillick.totalAssessments === 0 && childIds.length > 0) {
    actions.push("MEDIUM: Conduct Gillick competence assessments for all young people of appropriate age");
  }
  if (audit.totalAudits === 0) {
    actions.push("LOW: Schedule an initial consent records audit");
  }

  // ── Regulatory Links ──
  const regulatoryLinks: string[] = [
    "CHR 2015 Reg 20 — delegated authority to make decisions about a child's upbringing",
    "Children Act 1989 s33(3) — exercise of parental responsibility by the local authority",
    "Gillick v West Norfolk and Wisbech AHA [1986] — competence to consent",
    "DfE Delegated Authority Guide 2013 — practical guidance on normalising children's experiences",
    "SCCIF — Ofsted evaluates how effectively consent and delegated authority support children's daily lives",
    "UNCRC Article 12 — the right of the child to express views and have them given due weight",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    referenceDate,
    overallScore,
    rating,
    recording,
    delegatedAuthority: delegatedAuth,
    gillickCompetence: gillick,
    audit,
    childProfiles,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
