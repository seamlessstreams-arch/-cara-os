// ══════════════════════════════════════════════════════════════════════════════
// Cornerstone — Data Protection & GDPR Intelligence Engine
//
// Pure deterministic engine — no AI, no external calls.
// Evaluates GDPR / DPA 2018 compliance for children's homes:
//   • Data breach management & ICO notification
//   • Consent tracking (photography, medical, therapeutic, etc.)
//   • Subject Access Request (SAR) handling
//   • Information governance practices
//
// Regulatory framework:
//   UK GDPR (retained EU GDPR)
//   Data Protection Act 2018
//   ICO Children's Code (Age Appropriate Design Code)
//   CHR 2015 Reg 40 — notifications
//   GDPR Articles 5, 6, 9 — principles, lawful basis, special categories
//   Information Sharing Advice 2018
// ══════════════════════════════════════════════════════════════════════════════

// ── Types ───────────────────────────────────────────────────────────────────

export type BreachSeverity = "critical" | "high" | "medium" | "low";

export type BreachStatus =
  | "detected"
  | "reported"
  | "investigating"
  | "resolved"
  | "closed";

export type ConsentType =
  | "photography"
  | "social_media"
  | "data_sharing"
  | "medical_info"
  | "education_records"
  | "therapeutic_records"
  | "contact_info"
  | "location_tracking";

export type ConsentStatus =
  | "given"
  | "refused"
  | "withdrawn"
  | "not_sought"
  | "expired";

export type SARStatus =
  | "received"
  | "acknowledged"
  | "in_progress"
  | "completed"
  | "overdue"
  | "refused";

export type DataCategory =
  | "personal"
  | "sensitive"
  | "special_category"
  | "child_records"
  | "staff_records"
  | "financial";

export type Rating = "outstanding" | "good" | "requires_improvement" | "inadequate";

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface DataBreach {
  id: string;
  detectedDate: string;
  reportedDate?: string;
  severity: BreachSeverity;
  status: BreachStatus;
  childrenAffected: number;
  staffAffected: number;
  icoNotified: boolean;
  icoNotifiedWithin72Hours: boolean;
  containmentMeasures: string[];
  rootCauseIdentified: boolean;
  lessonsLearned?: string;
}

export interface ConsentRecord {
  id: string;
  childId: string;
  childName: string;
  consentType: ConsentType;
  status: ConsentStatus;
  obtainedDate?: string;
  reviewDate?: string;
  obtainedFrom: string;
  ageAppropriateExplained: boolean;
}

export interface SubjectAccessRequest {
  id: string;
  requestDate: string;
  requesterType: string;
  status: SARStatus;
  acknowledgedWithin5Days: boolean;
  completedWithin30Days: boolean;
  redactionCompleted: boolean;
  qualityChecked: boolean;
}

export interface DataGovernance {
  id: string;
  dataProtectionOfficerAppointed: boolean;
  dpiaCompleted: boolean;
  retentionScheduleInPlace: boolean;
  privacyNoticesUpToDate: boolean;
  staffTrainingCompliance: number; // percentage 0-100
  lastAuditDate?: string;
  dataProcessingRegisterMaintained: boolean;
  thirdPartyAgreementsReviewed: boolean;
}

// ── Result Types ────────────────────────────────────────────────────────────

export interface BreachManagementResult {
  totalBreaches: number;
  criticalBreaches: number;
  highBreaches: number;
  mediumBreaches: number;
  lowBreaches: number;
  icoNotificationRate: number;
  icoNotificationWithin72HoursRate: number;
  containmentRate: number;
  rootCauseRate: number;
  lessonsLearnedRate: number;
  resolutionRate: number;
  childrenAffectedTotal: number;
  staffAffectedTotal: number;
  overallScore: number; // 0-25
}

export interface ConsentComplianceResult {
  totalRecords: number;
  uniqueChildren: number;
  consentObtainedRate: number;
  ageAppropriateExplainedRate: number;
  reviewDateCurrentRate: number;
  expiredConsentCount: number;
  averageTypesPerChild: number;
  consentByType: Record<string, { given: number; refused: number; withdrawn: number; notSought: number; expired: number }>;
  overallScore: number; // 0-25
}

export interface SARComplianceResult {
  totalRequests: number;
  acknowledgedWithin5DaysRate: number;
  completedWithin30DaysRate: number;
  redactionCompletedRate: number;
  qualityCheckedRate: number;
  overdueCount: number;
  byStatus: Record<string, number>;
  overallScore: number; // 0-25
}

export interface GovernancePracticeResult {
  dpoAppointed: boolean;
  dpiaCompleted: boolean;
  retentionScheduleInPlace: boolean;
  privacyNoticesUpToDate: boolean;
  staffTrainingCompliance: number;
  auditWithin12Months: boolean;
  dataProcessingRegisterMaintained: boolean;
  thirdPartyAgreementsReviewed: boolean;
  overallScore: number; // 0-25
}

export interface DataProtectionIntelligence {
  homeId: string;
  periodStart: string;
  periodEnd: string;
  overallScore: number;
  rating: Rating;
  breachManagement: BreachManagementResult;
  consentCompliance: ConsentComplianceResult;
  sarCompliance: SARComplianceResult;
  governancePractice: GovernancePracticeResult;
  strengths: string[];
  areasForImprovement: string[];
  actions: string[];
  regulatoryLinks: string[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function daysBetween(dateA: string, dateB: string): number {
  const a = new Date(dateA);
  const b = new Date(dateB);
  return Math.abs(Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Evaluators ──────────────────────────────────────────────────────────────

export function evaluateBreachManagement(breaches: DataBreach[]): BreachManagementResult {
  const total = breaches.length;

  const criticalBreaches = breaches.filter((b) => b.severity === "critical").length;
  const highBreaches = breaches.filter((b) => b.severity === "high").length;
  const mediumBreaches = breaches.filter((b) => b.severity === "medium").length;
  const lowBreaches = breaches.filter((b) => b.severity === "low").length;

  const childrenAffectedTotal = breaches.reduce((sum, b) => sum + b.childrenAffected, 0);
  const staffAffectedTotal = breaches.reduce((sum, b) => sum + b.staffAffected, 0);

  if (total === 0) {
    // No breaches = strong baseline of 22, plus 3 bonus
    return {
      totalBreaches: 0,
      criticalBreaches: 0,
      highBreaches: 0,
      mediumBreaches: 0,
      lowBreaches: 0,
      icoNotificationRate: 0,
      icoNotificationWithin72HoursRate: 0,
      containmentRate: 0,
      rootCauseRate: 0,
      lessonsLearnedRate: 0,
      resolutionRate: 0,
      childrenAffectedTotal: 0,
      staffAffectedTotal: 0,
      overallScore: 25,
    };
  }

  const icoNotified = breaches.filter((b) => b.icoNotified).length;
  const icoNotifiedWithin72h = breaches.filter((b) => b.icoNotifiedWithin72Hours).length;
  const containmentCount = breaches.filter((b) => b.containmentMeasures.length > 0).length;
  const rootCauseCount = breaches.filter((b) => b.rootCauseIdentified).length;
  const lessonsLearnedCount = breaches.filter(
    (b) => b.lessonsLearned !== undefined && b.lessonsLearned !== ""
  ).length;
  const resolvedCount = breaches.filter(
    (b) => b.status === "resolved" || b.status === "closed"
  ).length;

  const icoNotificationRate = pct(icoNotified, total);
  const icoNotificationWithin72HoursRate = pct(icoNotifiedWithin72h, total);
  const containmentRate = pct(containmentCount, total);
  const rootCauseRate = pct(rootCauseCount, total);
  const lessonsLearnedRate = pct(lessonsLearnedCount, total);
  const resolutionRate = pct(resolvedCount, total);

  // Scoring: +7 all reported to ICO within 72h, +5 containment, +5 root cause,
  //          +4 lessons learned, +4 resolution
  let score = 0;
  score += icoNotificationWithin72HoursRate === 100 ? 7 : (icoNotificationWithin72HoursRate / 100) * 7;
  score += (containmentRate / 100) * 5;
  score += (rootCauseRate / 100) * 5;
  score += (lessonsLearnedRate / 100) * 4;
  score += (resolutionRate / 100) * 4;

  // Penalty for critical/high severity breaches
  if (criticalBreaches > 0) score = Math.max(0, score - 3 * criticalBreaches);
  if (highBreaches > 0) score = Math.max(0, score - 1.5 * highBreaches);

  return {
    totalBreaches: total,
    criticalBreaches,
    highBreaches,
    mediumBreaches,
    lowBreaches,
    icoNotificationRate,
    icoNotificationWithin72HoursRate,
    containmentRate,
    rootCauseRate,
    lessonsLearnedRate,
    resolutionRate,
    childrenAffectedTotal,
    staffAffectedTotal,
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
  };
}

export function evaluateConsentCompliance(records: ConsentRecord[]): ConsentComplianceResult {
  const total = records.length;

  const consentByType: Record<
    string,
    { given: number; refused: number; withdrawn: number; notSought: number; expired: number }
  > = {};

  for (const r of records) {
    if (!consentByType[r.consentType]) {
      consentByType[r.consentType] = { given: 0, refused: 0, withdrawn: 0, notSought: 0, expired: 0 };
    }
    if (r.status === "given") consentByType[r.consentType].given++;
    else if (r.status === "refused") consentByType[r.consentType].refused++;
    else if (r.status === "withdrawn") consentByType[r.consentType].withdrawn++;
    else if (r.status === "not_sought") consentByType[r.consentType].notSought++;
    else if (r.status === "expired") consentByType[r.consentType].expired++;
  }

  if (total === 0) {
    return {
      totalRecords: 0,
      uniqueChildren: 0,
      consentObtainedRate: 0,
      ageAppropriateExplainedRate: 0,
      reviewDateCurrentRate: 0,
      expiredConsentCount: 0,
      averageTypesPerChild: 0,
      consentByType,
      overallScore: 0,
    };
  }

  // Consent obtained = given or refused (decision was actively recorded)
  const consentObtained = records.filter(
    (r) => r.status === "given" || r.status === "refused"
  ).length;
  const consentObtainedRate = pct(consentObtained, total);

  const ageAppropriateExplained = records.filter((r) => r.ageAppropriateExplained).length;
  const ageAppropriateExplainedRate = pct(ageAppropriateExplained, total);

  const today = new Date().toISOString().split("T")[0];
  const reviewDateCurrent = records.filter(
    (r) => r.reviewDate && r.reviewDate >= today
  ).length;
  const recordsWithReviewDate = records.filter((r) => r.reviewDate).length;
  const reviewDateCurrentRate = pct(reviewDateCurrent, recordsWithReviewDate);

  const expiredConsentCount = records.filter((r) => r.status === "expired").length;

  // Unique children and types per child
  const childTypes: Record<string, Set<string>> = {};
  for (const r of records) {
    if (!childTypes[r.childId]) childTypes[r.childId] = new Set();
    childTypes[r.childId].add(r.consentType);
  }
  const uniqueChildren = Object.keys(childTypes).length;
  const typeCountsPerChild = Object.values(childTypes).map((s) => s.size);
  const averageTypesPerChild =
    typeCountsPerChild.length > 0
      ? Math.round((typeCountsPerChild.reduce((a, b) => a + b, 0) / typeCountsPerChild.length) * 10) / 10
      : 0;

  // Scoring: +8 consent obtained >=95%, +5 age-appropriate, +4 review current,
  //          +4 no expired, +4 coverage (>=5 types per child)
  let score = 0;

  // +8 consent obtained rate (full marks at 95%+)
  if (consentObtainedRate >= 95) score += 8;
  else score += (consentObtainedRate / 95) * 8;

  // +5 age-appropriate explained rate
  score += (ageAppropriateExplainedRate / 100) * 5;

  // +4 review date current
  score += (reviewDateCurrentRate / 100) * 4;

  // +4 no expired consents
  if (expiredConsentCount === 0) score += 4;
  else score += Math.max(0, 4 - expiredConsentCount);

  // +4 coverage (>=5 types per child)
  if (uniqueChildren > 0) {
    const coverageRate = typeCountsPerChild.filter((c) => c >= 5).length / uniqueChildren;
    score += coverageRate * 4;
  }

  return {
    totalRecords: total,
    uniqueChildren,
    consentObtainedRate,
    ageAppropriateExplainedRate,
    reviewDateCurrentRate,
    expiredConsentCount,
    averageTypesPerChild,
    consentByType,
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
  };
}

export function evaluateSARCompliance(requests: SubjectAccessRequest[]): SARComplianceResult {
  const total = requests.length;

  const byStatus: Record<string, number> = {};
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  if (total === 0) {
    // No SARs = decent baseline of 20 + 3 bonus
    return {
      totalRequests: 0,
      acknowledgedWithin5DaysRate: 0,
      completedWithin30DaysRate: 0,
      redactionCompletedRate: 0,
      qualityCheckedRate: 0,
      overdueCount: 0,
      byStatus,
      overallScore: 23,
    };
  }

  const acknowledgedWithin5Days = requests.filter((r) => r.acknowledgedWithin5Days).length;
  const completedWithin30Days = requests.filter((r) => r.completedWithin30Days).length;
  const redactionCompleted = requests.filter((r) => r.redactionCompleted).length;
  const qualityChecked = requests.filter((r) => r.qualityChecked).length;
  const overdueCount = requests.filter((r) => r.status === "overdue").length;

  const acknowledgedWithin5DaysRate = pct(acknowledgedWithin5Days, total);
  const completedWithin30DaysRate = pct(completedWithin30Days, total);
  const redactionCompletedRate = pct(redactionCompleted, total);
  const qualityCheckedRate = pct(qualityChecked, total);

  // Scoring: +8 acknowledged within 5 days, +6 completed within 30 days,
  //          +4 redaction, +4 quality checked, +3 no overdue
  let score = 0;
  score += (acknowledgedWithin5DaysRate / 100) * 8;
  score += (completedWithin30DaysRate / 100) * 6;
  score += (redactionCompletedRate / 100) * 4;
  score += (qualityCheckedRate / 100) * 4;
  if (overdueCount === 0) score += 3;
  else score += Math.max(0, 3 - overdueCount);

  return {
    totalRequests: total,
    acknowledgedWithin5DaysRate,
    completedWithin30DaysRate,
    redactionCompletedRate,
    qualityCheckedRate,
    overdueCount,
    byStatus,
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
  };
}

export function evaluateGovernancePractice(
  governance: DataGovernance[],
  referenceDate?: string
): GovernancePracticeResult {
  if (governance.length === 0) {
    return {
      dpoAppointed: false,
      dpiaCompleted: false,
      retentionScheduleInPlace: false,
      privacyNoticesUpToDate: false,
      staffTrainingCompliance: 0,
      auditWithin12Months: false,
      dataProcessingRegisterMaintained: false,
      thirdPartyAgreementsReviewed: false,
      overallScore: 0,
    };
  }

  // Use most recent governance record
  const gov = governance[governance.length - 1];
  const refDate = referenceDate || new Date().toISOString().split("T")[0];

  const auditWithin12Months =
    gov.lastAuditDate !== undefined &&
    gov.lastAuditDate !== "" &&
    daysBetween(gov.lastAuditDate, refDate) <= 365;

  // Scoring: +4 DPO, +3 DPIA, +3 retention schedule, +3 privacy notices,
  //          +4 staff training >=90%, +3 audit within 12 months,
  //          +3 register maintained, +2 third party reviewed
  let score = 0;
  if (gov.dataProtectionOfficerAppointed) score += 4;
  if (gov.dpiaCompleted) score += 3;
  if (gov.retentionScheduleInPlace) score += 3;
  if (gov.privacyNoticesUpToDate) score += 3;
  if (gov.staffTrainingCompliance >= 90) score += 4;
  else score += (gov.staffTrainingCompliance / 90) * 4;
  if (auditWithin12Months) score += 3;
  if (gov.dataProcessingRegisterMaintained) score += 3;
  if (gov.thirdPartyAgreementsReviewed) score += 2;

  return {
    dpoAppointed: gov.dataProtectionOfficerAppointed,
    dpiaCompleted: gov.dpiaCompleted,
    retentionScheduleInPlace: gov.retentionScheduleInPlace,
    privacyNoticesUpToDate: gov.privacyNoticesUpToDate,
    staffTrainingCompliance: gov.staffTrainingCompliance,
    auditWithin12Months,
    dataProcessingRegisterMaintained: gov.dataProcessingRegisterMaintained,
    thirdPartyAgreementsReviewed: gov.thirdPartyAgreementsReviewed,
    overallScore: clamp(Math.round(score * 10) / 10, 0, 25),
  };
}

// ── Strength / Area / Action Generation ─────────────────────────────────────

function generateStrengths(
  breach: BreachManagementResult,
  consent: ConsentComplianceResult,
  sar: SARComplianceResult,
  governance: GovernancePracticeResult
): string[] {
  const strengths: string[] = [];

  if (breach.totalBreaches === 0) {
    strengths.push("No data breaches recorded during the assessment period");
  } else {
    if (breach.icoNotificationWithin72HoursRate === 100) {
      strengths.push("All data breaches reported to ICO within the required 72-hour window");
    }
    if (breach.containmentRate === 100) {
      strengths.push("Effective containment measures applied to all recorded breaches");
    }
    if (breach.rootCauseRate === 100) {
      strengths.push("Root cause analysis completed for all data breaches");
    }
  }

  if (consent.consentObtainedRate >= 95) {
    strengths.push("Consent obtained or actively recorded for 95%+ of applicable areas");
  }
  if (consent.ageAppropriateExplainedRate >= 90) {
    strengths.push("Age-appropriate explanations provided for consent decisions at a high rate");
  }
  if (consent.expiredConsentCount === 0) {
    strengths.push("No expired consent records — review cycle is well maintained");
  }

  if (sar.totalRequests === 0) {
    strengths.push("No subject access requests overdue or outstanding");
  } else {
    if (sar.acknowledgedWithin5DaysRate === 100) {
      strengths.push("All subject access requests acknowledged within the 5-day target");
    }
    if (sar.completedWithin30DaysRate === 100) {
      strengths.push("All SARs completed within the statutory 30-day timeframe");
    }
  }

  if (governance.dpoAppointed) {
    strengths.push("Data Protection Officer appointed in line with GDPR requirements");
  }
  if (governance.staffTrainingCompliance >= 90) {
    strengths.push("Staff data protection training compliance at 90% or above");
  }
  if (governance.auditWithin12Months) {
    strengths.push("Data protection audit completed within the last 12 months");
  }

  return strengths;
}

function generateAreasForImprovement(
  breach: BreachManagementResult,
  consent: ConsentComplianceResult,
  sar: SARComplianceResult,
  governance: GovernancePracticeResult
): string[] {
  const areas: string[] = [];

  if (breach.totalBreaches > 0) {
    if (breach.icoNotificationWithin72HoursRate < 100) {
      areas.push("Not all breaches reported to ICO within 72 hours — risk of regulatory action");
    }
    if (breach.rootCauseRate < 100) {
      areas.push("Root cause analysis not completed for all breaches — repeat incidents may occur");
    }
    if (breach.lessonsLearnedRate < 100) {
      areas.push("Lessons learned not documented for all breaches — organisational learning gap");
    }
  }

  if (consent.consentObtainedRate < 95) {
    areas.push("Consent not actively obtained or recorded for all applicable areas");
  }
  if (consent.ageAppropriateExplainedRate < 80) {
    areas.push("Age-appropriate consent explanations below 80% — children may not understand their data rights");
  }
  if (consent.expiredConsentCount > 0) {
    areas.push(`${consent.expiredConsentCount} expired consent record(s) require urgent review`);
  }
  if (consent.averageTypesPerChild < 5) {
    areas.push("Consent coverage below 5 types per child — gaps in consent framework");
  }

  if (sar.overdueCount > 0) {
    areas.push(`${sar.overdueCount} overdue subject access request(s) — statutory breach risk`);
  }
  if (sar.totalRequests > 0 && sar.redactionCompletedRate < 100) {
    areas.push("Redaction not completed for all SARs — risk of inappropriate disclosure");
  }

  if (!governance.dpoAppointed) {
    areas.push("No Data Protection Officer appointed — GDPR requirement not met");
  }
  if (!governance.dpiaCompleted) {
    areas.push("Data Protection Impact Assessment not completed");
  }
  if (governance.staffTrainingCompliance < 90) {
    areas.push(`Staff training compliance at ${governance.staffTrainingCompliance}% — below 90% target`);
  }
  if (!governance.auditWithin12Months) {
    areas.push("No data protection audit within the last 12 months");
  }
  if (!governance.retentionScheduleInPlace) {
    areas.push("No data retention schedule in place — risk of unlawful data storage");
  }

  return areas;
}

function generateActions(
  breach: BreachManagementResult,
  consent: ConsentComplianceResult,
  sar: SARComplianceResult,
  governance: GovernancePracticeResult
): string[] {
  const actions: string[] = [];

  // Urgent actions first
  if (breach.criticalBreaches > 0) {
    actions.push("URGENT: Critical data breach(es) require immediate containment and ICO notification");
  }
  if (sar.overdueCount > 0) {
    actions.push("URGENT: Overdue SAR(s) must be completed immediately — statutory deadline breached");
  }
  if (!governance.dpoAppointed) {
    actions.push("URGENT: Appoint a Data Protection Officer to ensure GDPR compliance");
  }

  // Breach actions
  if (breach.totalBreaches > 0 && breach.icoNotificationWithin72HoursRate < 100) {
    actions.push("Review breach response procedures to ensure ICO notification within 72 hours");
  }
  if (breach.totalBreaches > 0 && breach.lessonsLearnedRate < 100) {
    actions.push("Complete lessons-learned reviews for all outstanding breach investigations");
  }

  // Consent actions
  if (consent.consentObtainedRate < 95) {
    actions.push("Conduct consent audit across all children to close gaps in consent records");
  }
  if (consent.expiredConsentCount > 0) {
    actions.push("Review and renew all expired consent records as a priority");
  }
  if (consent.ageAppropriateExplainedRate < 80) {
    actions.push("Develop age-appropriate data rights materials for use during consent conversations");
  }

  // SAR actions
  if (sar.totalRequests > 0 && sar.redactionCompletedRate < 100) {
    actions.push("Ensure redaction processes are applied to all SAR disclosures before release");
  }
  if (sar.totalRequests > 0 && sar.qualityCheckedRate < 100) {
    actions.push("Implement quality-check step for all SAR responses prior to disclosure");
  }

  // Governance actions
  if (!governance.dpiaCompleted) {
    actions.push("Complete Data Protection Impact Assessment for all processing activities");
  }
  if (governance.staffTrainingCompliance < 90) {
    actions.push("Schedule data protection refresher training for non-compliant staff");
  }
  if (!governance.auditWithin12Months) {
    actions.push("Commission annual data protection audit within the next quarter");
  }
  if (!governance.retentionScheduleInPlace) {
    actions.push("Develop and implement a data retention schedule aligned with DPA 2018 requirements");
  }
  if (!governance.privacyNoticesUpToDate) {
    actions.push("Review and update privacy notices to reflect current processing activities");
  }
  if (!governance.dataProcessingRegisterMaintained) {
    actions.push("Establish and maintain a record of processing activities (ROPA) per GDPR Art 30");
  }

  return actions;
}

// ── Main Generator ──────────────────────────────────────────────────────────

export function generateDataProtectionIntelligence(
  breaches: DataBreach[],
  consentRecords: ConsentRecord[],
  sarRequests: SubjectAccessRequest[],
  governance: DataGovernance[],
  homeId: string,
  periodStart: string,
  periodEnd: string,
  referenceDate?: string
): DataProtectionIntelligence {
  const refDate = referenceDate || new Date().toISOString().split("T")[0];

  const breachManagement = evaluateBreachManagement(breaches);
  const consentCompliance = evaluateConsentCompliance(consentRecords);
  const sarCompliance = evaluateSARCompliance(sarRequests);
  const governancePractice = evaluateGovernancePractice(governance, refDate);

  const rawScore =
    breachManagement.overallScore +
    consentCompliance.overallScore +
    sarCompliance.overallScore +
    governancePractice.overallScore;

  const overallScore = clamp(Math.round(rawScore * 10) / 10, 0, 100);
  const rating = ratingFromScore(overallScore);

  const strengths = generateStrengths(breachManagement, consentCompliance, sarCompliance, governancePractice);
  const areasForImprovement = generateAreasForImprovement(breachManagement, consentCompliance, sarCompliance, governancePractice);
  const actions = generateActions(breachManagement, consentCompliance, sarCompliance, governancePractice);

  const regulatoryLinks: string[] = [
    "UK GDPR Articles 5, 6, 9 — Data protection principles, lawful basis, special category data",
    "Data Protection Act 2018 — UK implementation of GDPR with children's data provisions",
    "ICO Children's Code — Age Appropriate Design Code for children's data",
    "CHR 2015 Reg 40 — Notification of events including data breaches",
    "GDPR Article 33 — Notification of personal data breaches to supervisory authority (72 hours)",
    "GDPR Article 15 — Right of access by the data subject (SAR)",
    "Information Sharing Advice 2018 — HM Government guidance on sharing information",
    "ICO Guide to Data Protection — Practical guidance on compliance obligations",
  ];

  return {
    homeId,
    periodStart,
    periodEnd,
    overallScore,
    rating,
    breachManagement,
    consentCompliance,
    sarCompliance,
    governancePractice,
    strengths,
    areasForImprovement,
    actions,
    regulatoryLinks,
  };
}
