// ==============================================================================
// CARA -- HOME DATA PROTECTION & GDPR COMPLIANCE INTELLIGENCE ENGINE
// Measures data protection policy compliance, subject access request handling,
// data breach management, privacy notice currency, staff GDPR training, and
// record security across the home.
// Pure deterministic engine -- no imports, no LLM, no external deps.
// Ofsted CHR 2015 Reg 21 (Privacy and confidentiality), GDPR 2018 (UK GDPR),
// SCCIF Leadership and management.
// Store keys: dataProtectionPolicyRecords, subjectAccessRequestRecords,
//             dataBreachRecords, privacyNoticeRecords, gdprTrainingRecords
// ==============================================================================

import { above, below, meanOf, meets, rate } from "@/lib/metrics/rate";

// -- Input Types --------------------------------------------------------------

export interface DataProtectionPolicyRecordInput {
  id: string;
  policy_name: string;
  policy_type: "data_protection" | "information_security" | "retention" | "sharing" | "consent" | "breach_response" | "privacy_impact" | "other";
  version: string;
  last_reviewed_date: string | null;
  next_review_date: string | null;
  approved_by: string;
  approved_date: string | null;
  compliant_with_gdpr: boolean;
  compliant_with_chr2015: boolean;
  staff_acknowledged: number;
  staff_total: number;
  gaps_identified: number;
  gaps_resolved: number;
  dpo_signed_off: boolean;
  accessible_to_staff: boolean;
  notes: string;
  created_at: string;
}

export interface SubjectAccessRequestRecordInput {
  id: string;
  requester_type: "young_person" | "parent" | "placing_authority" | "former_resident" | "staff" | "other";
  date_received: string;
  date_acknowledged: string | null;
  date_completed: string | null;
  deadline_date: string;
  completed_within_deadline: boolean;
  redaction_applied: boolean;
  third_party_data_identified: boolean;
  third_party_consulted: boolean;
  exemptions_applied: string[];
  outcome: "completed" | "partially_completed" | "refused" | "pending" | "withdrawn";
  quality_checked: boolean;
  dpo_involved: boolean;
  complainant_satisfied: boolean;
  notes: string;
  created_at: string;
}

export interface DataBreachRecordInput {
  id: string;
  breach_date: string;
  detected_date: string;
  reported_to_ico: boolean;
  reported_to_ico_within_72h: boolean;
  individuals_notified: boolean;
  severity: "low" | "medium" | "high" | "critical";
  breach_type: "unauthorised_access" | "data_loss" | "data_theft" | "accidental_disclosure" | "cyber_attack" | "physical_breach" | "other";
  records_affected: number;
  children_data_involved: boolean;
  root_cause_identified: boolean;
  corrective_actions_taken: boolean;
  corrective_actions_completed: boolean;
  lessons_learned_documented: boolean;
  recurrence_prevented: boolean;
  dpo_notified: boolean;
  risk_assessment_completed: boolean;
  notes: string;
  created_at: string;
}

export interface PrivacyNoticeRecordInput {
  id: string;
  notice_type: "children" | "parents" | "staff" | "visitors" | "placing_authorities" | "general" | "other";
  audience: string;
  last_updated_date: string | null;
  review_due_date: string | null;
  compliant_with_gdpr: boolean;
  plain_language: boolean;
  age_appropriate: boolean;
  covers_all_processing: boolean;
  lawful_basis_stated: boolean;
  data_rights_explained: boolean;
  retention_periods_stated: boolean;
  contact_details_included: boolean;
  accessible_format: boolean;
  published: boolean;
  acknowledged_count: number;
  target_audience_count: number;
  notes: string;
  created_at: string;
}

export interface GdprTrainingRecordInput {
  id: string;
  staff_id: string;
  staff_name: string;
  training_type: "induction" | "annual_refresher" | "specialist" | "breach_response" | "sar_handling" | "dpia" | "other";
  training_date: string;
  training_provider: string;
  passed: boolean;
  score: number | null; // percentage if applicable
  certificate_held: boolean;
  expiry_date: string | null;
  refresher_due_date: string | null;
  refresher_completed: boolean;
  topics_covered: string[];
  notes: string;
  created_at: string;
}

export interface DataProtectionGdprComplianceInput {
  today: string;
  total_children: number;
  total_staff: number;
  policy_compliance_records: DataProtectionPolicyRecordInput[];
  sar_records: SubjectAccessRequestRecordInput[];
  breach_records: DataBreachRecordInput[];
  privacy_notice_records: PrivacyNoticeRecordInput[];
  training_records: GdprTrainingRecordInput[];
}

// -- Output Types -------------------------------------------------------------

export type DataProtectionRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface DataProtectionInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface DataProtectionRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface DataProtectionGdprComplianceResult {
  data_protection_rating: DataProtectionRating;
  data_protection_score: number;
  headline: string;
  // fab-0: null when no policies exist to score.
  policy_compliance_rate: number | null;
  // fab-0: null when no SARs recorded.
  sar_handling_rate: number | null;
  /** null only on the all-empty builder; measured path is always a number (no breaches = 100 by design). */
  breach_management_rate: number | null;
  // fab-0: null when no privacy notices published.
  privacy_notice_rate: number | null;
  // fab-0: null when no training records logged.
  staff_training_rate: number | null;
  /** null when the population is empty — nothing measured, not 0%. */
  record_security_rate: number | null;
  policy_compliance_records: DataProtectionPolicyRecordInput[];
  sar_records: SubjectAccessRequestRecordInput[];
  breach_records: DataBreachRecordInput[];
  privacy_notice_records: PrivacyNoticeRecordInput[];
  training_records: GdprTrainingRecordInput[];
  strengths: string[];
  concerns: string[];
  recommendations: DataProtectionRecommendation[];
  insights: DataProtectionInsight[];
}

// -- Helpers ------------------------------------------------------------------

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): DataProtectionRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime();
  const msB = new Date(b).getTime();
  if (isNaN(msA) || isNaN(msB)) return 0;
  return Math.floor((msB - msA) / 86_400_000);
}

function isOverdue(dateStr: string | null, today: string): boolean {
  if (!dateStr) return false;
  return daysBetween(dateStr, today) > 0;
}

function isWithinDays(dateStr: string | null, today: string, days: number): boolean {
  if (!dateStr) return false;
  const diff = daysBetween(today, dateStr);
  return diff >= 0 && diff <= days;
}

// -- Empty Result Factory -----------------------------------------------------

function emptyResult(
  rating: DataProtectionRating,
  score: number,
  headline: string,
): DataProtectionGdprComplianceResult {
  return {
    data_protection_rating: rating,
    data_protection_score: score,
    headline,
    policy_compliance_rate: null,
    sar_handling_rate: null,
    breach_management_rate: null,
    privacy_notice_rate: null,
    staff_training_rate: null,
    record_security_rate: null,
    policy_compliance_records: [],
    sar_records: [],
    breach_records: [],
    privacy_notice_records: [],
    training_records: [],
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// -- Main Compute -------------------------------------------------------------

export function computeDataProtectionGdprCompliance(
  input: DataProtectionGdprComplianceInput,
): DataProtectionGdprComplianceResult {
  const {
    today,
    total_children,
    total_staff,
    policy_compliance_records,
    sar_records,
    breach_records,
    privacy_notice_records,
    training_records,
  } = input;

  // -- Special case: all empty + 0 children -> insufficient_data ------------
  const allEmpty =
    policy_compliance_records.length === 0 &&
    sar_records.length === 0 &&
    breach_records.length === 0 &&
    privacy_notice_records.length === 0 &&
    training_records.length === 0;

  if (allEmpty && total_children === 0 && total_staff === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children or staff on record -- insufficient data to assess data protection and GDPR compliance.",
    );
  }

  // -- Special case: all empty + children or staff > 0 -> inadequate --------
  if (allEmpty && (total_children > 0 || total_staff > 0)) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No data protection or GDPR compliance records exist despite children and staff being on record -- data protection governance, policy compliance, privacy notices, and GDPR training all require urgent attention.",
      ),
      concerns: [
        "No data protection policy records, subject access request records, breach records, privacy notices, or GDPR training records exist -- the home cannot evidence GDPR compliance or data protection governance to Ofsted or the ICO.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement a comprehensive data protection framework including policies, privacy notices, breach response procedures, SAR handling processes, and mandatory GDPR training for all staff to meet UK GDPR requirements and CHR 2015 Reg 21.",
          urgency: "immediate",
          regulatory_ref: "UK GDPR 2018 Art 5, 24 / CHR 2015 Reg 21",
        },
        {
          rank: 2,
          recommendation:
            "Appoint or confirm a Data Protection Officer and ensure all staff receive GDPR induction training before handling any personal data relating to children or staff.",
          urgency: "immediate",
          regulatory_ref: "UK GDPR 2018 Art 37-39",
        },
      ],
      insights: [
        {
          text: "The complete absence of data protection and GDPR compliance records means the home cannot demonstrate to Ofsted or the ICO that children's personal data is handled lawfully, fairly, and transparently. This represents a fundamental governance failure under Reg 21 and UK GDPR.",
          severity: "critical",
        },
      ],
    };
  }

  // -- Compute core metrics -------------------------------------------------

  // === 1. Policy compliance ===
  const totalPolicies = policy_compliance_records.length;
  const gdprCompliantPolicies = policy_compliance_records.filter((r) => r.compliant_with_gdpr).length;
  const chr2015CompliantPolicies = policy_compliance_records.filter((r) => r.compliant_with_chr2015).length;
  const dpoSignedOffPolicies = policy_compliance_records.filter((r) => r.dpo_signed_off).length;
  const accessiblePolicies = policy_compliance_records.filter((r) => r.accessible_to_staff).length;

  const policiesReviewedOnTime = policy_compliance_records.filter((r) => {
    if (!r.next_review_date) return false;
    return !isOverdue(r.next_review_date, today);
  }).length;

  const policiesOverdue = policy_compliance_records.filter((r) => {
    return isOverdue(r.next_review_date, today);
  }).length;

  const totalPolicyGaps = policy_compliance_records.reduce((sum, r) => sum + r.gaps_identified, 0);
  const totalPolicyGapsResolved = policy_compliance_records.reduce((sum, r) => sum + r.gaps_resolved, 0);
  const policyGapResolutionRate = rate(totalPolicyGapsResolved, totalPolicyGaps);

  const totalStaffAcknowledged = policy_compliance_records.reduce((sum, r) => sum + r.staff_acknowledged, 0);
  const totalStaffForAcknowledgement = policy_compliance_records.reduce((sum, r) => sum + r.staff_total, 0);
  const staffAcknowledgementRate = rate(totalStaffAcknowledged, totalStaffForAcknowledgement);

  const gdprComplianceRate = rate(gdprCompliantPolicies, totalPolicies);
  const chr2015ComplianceRate = rate(chr2015CompliantPolicies, totalPolicies);
  const dpoSignOffRate = rate(dpoSignedOffPolicies, totalPolicies);
  const policyAccessibilityRate = rate(accessiblePolicies, totalPolicies);
  const policyReviewRate = rate(policiesReviewedOnTime, totalPolicies);

  // Composite policy compliance rate
  // staffAcknowledgementRate is measured over staff, not policies — meanOf
  // averages what is measured instead of fabricating an unmeasured term.
  const policyComplianceRate: number | null = meanOf([
    gdprComplianceRate, chr2015ComplianceRate, policyReviewRate, staffAcknowledgementRate, dpoSignOffRate,
  ]);

  // === 2. Subject Access Request handling ===
  const totalSars = sar_records.length;
  const completedSars = sar_records.filter((r) => r.outcome === "completed" || r.outcome === "partially_completed").length;
  const sarsWithinDeadline = sar_records.filter((r) => r.completed_within_deadline).length;
  const sarsQualityChecked = sar_records.filter((r) => r.quality_checked).length;
  const sarsSatisfied = sar_records.filter((r) => r.complainant_satisfied).length;

  const sarsAcknowledgedTimely = sar_records.filter((r) => {
    if (!r.date_acknowledged || !r.date_received) return false;
    const ackDays = daysBetween(r.date_received, r.date_acknowledged);
    return ackDays >= 0 && ackDays <= 2; // acknowledged within 2 working days
  }).length;

  const sarCompletionRate = rate(completedSars, totalSars);
  const sarDeadlineRate = rate(sarsWithinDeadline, totalSars);
  const sarQualityRate = rate(sarsQualityChecked, totalSars);
  const sarSatisfactionRate = rate(sarsSatisfied, totalSars);
  const sarAcknowledgementRate = rate(sarsAcknowledgedTimely, totalSars);

  const sarPendingCount = sar_records.filter((r) => r.outcome === "pending").length;
  const sarOverdueCount = sar_records.filter((r) => {
    return r.outcome === "pending" && isOverdue(r.deadline_date, today);
  }).length;

  // Composite SAR handling rate
  const sarHandlingRate: number | null =
    totalSars > 0 ? Math.round(
          (sarCompletionRate! + sarDeadlineRate! + sarQualityRate! + sarAcknowledgementRate!) / 4) : null;

  // === 3. Data breach management ===
  const totalBreaches = breach_records.length;
  const highSeverityBreaches = breach_records.filter((r) => r.severity === "high" || r.severity === "critical").length;
  const breachesWithRootCause = breach_records.filter((r) => r.root_cause_identified).length;
  const breachesWithCorrectiveAction = breach_records.filter((r) => r.corrective_actions_taken).length;
  const breachesActionsCompleted = breach_records.filter((r) => r.corrective_actions_completed).length;
  const breachesLessonsLearned = breach_records.filter((r) => r.lessons_learned_documented).length;
  const breachesRecurrencePrevented = breach_records.filter((r) => r.recurrence_prevented).length;
  const breachesDpoNotified = breach_records.filter((r) => r.dpo_notified).length;
  const breachesRiskAssessed = breach_records.filter((r) => r.risk_assessment_completed).length;

  const icoReportableBreaches = breach_records.filter((r) => r.reported_to_ico).length;
  const icoWithin72h = breach_records.filter((r) => r.reported_to_ico && r.reported_to_ico_within_72h).length;
  const icoTimelinessRate = rate(icoWithin72h, icoReportableBreaches);

  const childrenDataBreaches = breach_records.filter((r) => r.children_data_involved).length;

  const rootCauseRate = rate(breachesWithRootCause, totalBreaches);
  const correctiveActionRate = rate(breachesWithCorrectiveAction, totalBreaches);
  const actionsCompletedRate = rate(breachesActionsCompleted, totalBreaches);
  const lessonsLearnedRate = rate(breachesLessonsLearned, totalBreaches);
  const recurrencePreventionRate = rate(breachesRecurrencePrevented, totalBreaches);
  const dpoNotificationRate = rate(breachesDpoNotified, totalBreaches);
  const riskAssessmentRate = rate(breachesRiskAssessed, totalBreaches);

  // Composite breach management rate
  const breachManagementRate =
    totalBreaches > 0
      ? Math.round(
          (rootCauseRate! + correctiveActionRate! + actionsCompletedRate! + lessonsLearnedRate! + dpoNotificationRate!) / 5,
        )
      : 100; // no breaches is perfect

  // === 4. Privacy notice currency ===
  const totalNotices = privacy_notice_records.length;
  const gdprCompliantNotices = privacy_notice_records.filter((r) => r.compliant_with_gdpr).length;
  const plainLanguageNotices = privacy_notice_records.filter((r) => r.plain_language).length;
  const ageAppropriateNotices = privacy_notice_records.filter((r) => r.age_appropriate).length;
  const allProcessingCovered = privacy_notice_records.filter((r) => r.covers_all_processing).length;
  const lawfulBasisStated = privacy_notice_records.filter((r) => r.lawful_basis_stated).length;
  const dataRightsExplained = privacy_notice_records.filter((r) => r.data_rights_explained).length;
  const retentionStated = privacy_notice_records.filter((r) => r.retention_periods_stated).length;
  const publishedNotices = privacy_notice_records.filter((r) => r.published).length;

  const noticesOverdue = privacy_notice_records.filter((r) => {
    return isOverdue(r.review_due_date, today);
  }).length;

  const noticesDueSoon = privacy_notice_records.filter((r) => {
    return isWithinDays(r.review_due_date, today, 30);
  }).length;

  const totalNoticeAcknowledged = privacy_notice_records.reduce((sum, r) => sum + r.acknowledged_count, 0);
  const totalNoticeAudience = privacy_notice_records.reduce((sum, r) => sum + r.target_audience_count, 0);
  const noticeAcknowledgementRate = rate(totalNoticeAcknowledged, totalNoticeAudience);

  const noticeGdprRate = rate(gdprCompliantNotices, totalNotices);
  const noticePlainLanguageRate = rate(plainLanguageNotices, totalNotices);
  const noticeAgeAppropriateRate = rate(ageAppropriateNotices, totalNotices);
  const noticeProcessingRate = rate(allProcessingCovered, totalNotices);
  const noticeLawfulBasisRate = rate(lawfulBasisStated, totalNotices);
  const noticeRightsRate = rate(dataRightsExplained, totalNotices);
  const noticeRetentionRate = rate(retentionStated, totalNotices);
  const noticePublishedRate = rate(publishedNotices, totalNotices);

  // Composite privacy notice rate
  const privacyNoticeRate: number | null =
    totalNotices > 0 ? Math.round(
          (noticeGdprRate! + noticePlainLanguageRate! + noticeProcessingRate! + noticeLawfulBasisRate! + noticeRightsRate! + noticePublishedRate!) / 6) : null;

  // === 5. Staff GDPR training ===
  const totalTrainingRecords = training_records.length;
  const passedTraining = training_records.filter((r) => r.passed).length;
  const certificateHeld = training_records.filter((r) => r.certificate_held).length;

  const uniqueStaffTrained = new Set(training_records.filter((r) => r.passed).map((r) => r.staff_id)).size;
  const staffTrainingCoverage = rate(uniqueStaffTrained, total_staff);

  const trainingCurrent = training_records.filter((r) => {
    if (!r.expiry_date) return true; // no expiry = still valid
    return !isOverdue(r.expiry_date, today);
  }).length;

  const trainingExpired = training_records.filter((r) => {
    return isOverdue(r.expiry_date, today);
  }).length;

  const refreshersDue = training_records.filter((r) => {
    return r.refresher_due_date && !r.refresher_completed && isOverdue(r.refresher_due_date, today);
  }).length;

  const refreshersCompleted = training_records.filter((r) => r.refresher_completed).length;
  const refreshersDueTotal = training_records.filter((r) => r.refresher_due_date !== null).length;
  const refresherCompletionRate = rate(refreshersCompleted, refreshersDueTotal);

  const trainingPassRate = rate(passedTraining, totalTrainingRecords);
  const trainingCurrentRate = rate(trainingCurrent, totalTrainingRecords);
  const certificateRate = rate(certificateHeld, totalTrainingRecords);

  // Composite staff training rate
  // Gated on training records existing at all (the engine's documented fab-0
  // contract); within that, staffTrainingCoverage (per staff) and
  // refresherCompletionRate (per due refresher) have their own denominators —
  // meanOf averages what is measured.
  const staffTrainingRate: number | null =
    totalTrainingRecords > 0
      ? meanOf([trainingPassRate, staffTrainingCoverage, trainingCurrentRate, refresherCompletionRate])
      : null;

  // === 6. Record security composite ===
  // Derived from policy accessibility, DPO oversight, breach response quality, and training coverage
  const recordSecurityRate =
    totalPolicies > 0 || totalTrainingRecords > 0
      ? meanOf([
          policyAccessibilityRate,
          dpoSignOffRate,
          totalBreaches > 0 ? riskAssessmentRate : 100, // no breaches = full marks, by design
          staffTrainingCoverage,
        ])
      : null;

  // -- Scoring: base 52 ----------------------------------------------------

  let score = 52;

  // --- Bonus 1: policyComplianceRate (>=90: +5, >=70: +3) ---
  if (meets(policyComplianceRate, 90)) score += 5;
  else if (meets(policyComplianceRate, 70)) score += 3;

  // --- Bonus 2: sarHandlingRate (>=90: +5, >=70: +2) ---
  if (meets(sarHandlingRate, 90)) score += 5;
  else if (meets(sarHandlingRate, 70)) score += 2;

  // --- Bonus 3: breachManagementRate (>=90: +5, >=70: +2) ---
  if (breachManagementRate >= 90) score += 5;
  else if (breachManagementRate >= 70) score += 2;

  // --- Bonus 4: privacyNoticeRate (>=90: +4, >=70: +2) ---
  if (meets(privacyNoticeRate, 90)) score += 4;
  else if (meets(privacyNoticeRate, 70)) score += 2;

  // --- Bonus 5: staffTrainingRate (>=90: +5, >=70: +2) ---
  if (meets(staffTrainingRate, 90)) score += 5;
  else if (meets(staffTrainingRate, 70)) score += 2;

  // --- Bonus 6: recordSecurityRate (>=90: +4, >=70: +2) ---
  if (meets(recordSecurityRate, 90)) score += 4;
  else if (meets(recordSecurityRate, 70)) score += 2;

  // -- Penalties (4 with guards) -------------------------------------------

  // policyComplianceRate < 50 -> -6
  if (below(policyComplianceRate, 50) && totalPolicies > 0) score -= 6;

  // sarHandlingRate < 50 (with pending overdue SARs) -> -5
  if (below(sarHandlingRate, 50) && totalSars > 0 && sarOverdueCount > 0) score -= 5;

  // breachManagementRate < 50 with high-severity breaches -> -6
  if (breachManagementRate < 50 && totalBreaches > 0 && highSeverityBreaches > 0) score -= 6;

  // staffTrainingRate < 40 -> -5
  if (below(staffTrainingRate, 40) && totalTrainingRecords > 0) score -= 5;

  score = clamp(score, 0, 100);

  const data_protection_rating = toRating(score);

  // -- Strengths ------------------------------------------------------------

  const strengths: string[] = [];

  if (meets(gdprComplianceRate, 90) && totalPolicies > 0) {
    strengths.push(
      `${gdprComplianceRate}% of data protection policies are GDPR-compliant -- the home demonstrates a strong commitment to lawful data processing and regulatory compliance.`,
    );
  } else if (meets(gdprComplianceRate, 70) && totalPolicies > 0) {
    strengths.push(
      `${gdprComplianceRate}% of policies meet GDPR requirements -- good overall policy alignment with data protection legislation.`,
    );
  }

  if (meets(chr2015ComplianceRate, 90) && totalPolicies > 0) {
    strengths.push(
      `${chr2015ComplianceRate}% of policies compliant with CHR 2015 -- the home's data protection framework is well aligned with children's home regulatory requirements.`,
    );
  }

  if (meets(policyReviewRate, 90) && totalPolicies > 0) {
    strengths.push(
      `${policyReviewRate}% of policies reviewed within schedule -- the home maintains current and relevant data protection documentation.`,
    );
  } else if (meets(policyReviewRate, 70) && totalPolicies > 0) {
    strengths.push(
      `${policyReviewRate}% of policies reviewed on time -- most data protection policies are kept current.`,
    );
  }

  if (meets(dpoSignOffRate, 90) && totalPolicies > 0) {
    strengths.push(
      `DPO has signed off ${dpoSignOffRate}% of policies -- strong data protection governance with appropriate oversight.`,
    );
  }

  if (meets(staffAcknowledgementRate, 90) && totalStaffForAcknowledgement > 0) {
    strengths.push(
      `${staffAcknowledgementRate}% staff acknowledgement of data protection policies -- staff are aware of and committed to data protection obligations.`,
    );
  } else if (meets(staffAcknowledgementRate, 70) && totalStaffForAcknowledgement > 0) {
    strengths.push(
      `${staffAcknowledgementRate}% staff policy acknowledgement rate -- most staff have confirmed awareness of data protection policies.`,
    );
  }

  if (meets(policyGapResolutionRate, 90) && totalPolicyGaps > 0) {
    strengths.push(
      `${policyGapResolutionRate}% of identified policy gaps resolved -- the home demonstrates effective remediation of data protection weaknesses.`,
    );
  }

  if (meets(sarDeadlineRate, 90) && totalSars > 0) {
    strengths.push(
      `${sarDeadlineRate}% of subject access requests completed within statutory deadline -- the home handles SARs efficiently and within legal timescales.`,
    );
  } else if (meets(sarDeadlineRate, 70) && totalSars > 0) {
    strengths.push(
      `${sarDeadlineRate}% of SARs completed within deadline -- most subject access requests are processed on time.`,
    );
  }

  if (meets(sarQualityRate, 90) && totalSars > 0) {
    strengths.push(
      `${sarQualityRate}% of SAR responses quality-checked -- strong quality assurance in subject access request handling.`,
    );
  }

  if (meets(sarSatisfactionRate, 80) && totalSars > 0) {
    strengths.push(
      `${sarSatisfactionRate}% requester satisfaction with SAR responses -- the home handles data access requests with care and professionalism.`,
    );
  }

  if (meets(sarAcknowledgementRate, 90) && totalSars > 0) {
    strengths.push(
      `${sarAcknowledgementRate}% of SARs acknowledged within 2 working days -- prompt acknowledgement demonstrates respect for data subject rights.`,
    );
  }

  if (totalBreaches === 0) {
    strengths.push(
      "No data breaches recorded -- the home maintains strong data security practices and has avoided breaches of personal data.",
    );
  }

  if (meets(rootCauseRate, 90) && totalBreaches > 0) {
    strengths.push(
      `Root cause identified in ${rootCauseRate}% of breaches -- the home investigates breaches thoroughly to understand why they occurred.`,
    );
  }

  if (meets(actionsCompletedRate, 90) && totalBreaches > 0) {
    strengths.push(
      `${actionsCompletedRate}% of breach corrective actions completed -- the home follows through on remediation to prevent recurrence.`,
    );
  }

  if (meets(lessonsLearnedRate, 90) && totalBreaches > 0) {
    strengths.push(
      `Lessons learned documented for ${lessonsLearnedRate}% of breaches -- the home demonstrates a mature learning culture around data security incidents.`,
    );
  }

  if (meets(icoTimelinessRate, 100) && icoReportableBreaches > 0) {
    strengths.push(
      "All ICO-reportable breaches reported within 72 hours -- the home meets its statutory notification obligations promptly.",
    );
  }

  if (meets(recurrencePreventionRate, 90) && totalBreaches > 0) {
    strengths.push(
      `Recurrence prevention measures in place for ${recurrencePreventionRate}% of breaches -- effective systemic responses to data security incidents.`,
    );
  }

  if (meets(noticeGdprRate, 90) && totalNotices > 0) {
    strengths.push(
      `${noticeGdprRate}% of privacy notices are GDPR-compliant -- comprehensive and legally sound transparency information for data subjects.`,
    );
  } else if (meets(noticeGdprRate, 70) && totalNotices > 0) {
    strengths.push(
      `${noticeGdprRate}% of privacy notices meet GDPR standards -- most transparency information is legally compliant.`,
    );
  }

  if (meets(noticePlainLanguageRate, 90) && totalNotices > 0) {
    strengths.push(
      `${noticePlainLanguageRate}% of privacy notices written in plain language -- data subjects can genuinely understand how their data is used.`,
    );
  }

  if (meets(noticeAgeAppropriateRate, 90) && totalNotices > 0) {
    strengths.push(
      `${noticeAgeAppropriateRate}% of privacy notices are age-appropriate -- children can understand their data rights in a way that is meaningful to them.`,
    );
  }

  if (meets(noticeAcknowledgementRate, 90) && totalNoticeAudience > 0) {
    strengths.push(
      `${noticeAcknowledgementRate}% privacy notice acknowledgement rate -- data subjects have confirmed receipt and understanding of how their data is processed.`,
    );
  }

  if (meets(noticePublishedRate, 100) && totalNotices > 0) {
    strengths.push(
      "All privacy notices are published and accessible -- full transparency with all data subject groups.",
    );
  }

  if (meets(noticeLawfulBasisRate, 90) && totalNotices > 0) {
    strengths.push(
      `${noticeLawfulBasisRate}% of notices state the lawful basis for processing -- strong legal foundation for all data processing activities.`,
    );
  }

  if (meets(noticeRightsRate, 90) && totalNotices > 0) {
    strengths.push(
      `${noticeRightsRate}% of notices explain data subject rights -- individuals are informed about their rights under GDPR.`,
    );
  }

  if (meets(staffTrainingCoverage, 90) && total_staff > 0) {
    strengths.push(
      `${staffTrainingCoverage}% of staff have completed GDPR training -- near-universal workforce awareness of data protection obligations.`,
    );
  } else if (meets(staffTrainingCoverage, 70) && total_staff > 0) {
    strengths.push(
      `${staffTrainingCoverage}% staff GDPR training coverage -- most staff have received data protection training.`,
    );
  }

  if (meets(trainingPassRate, 95) && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingPassRate}% training pass rate -- staff demonstrate strong understanding of GDPR requirements.`,
    );
  } else if (meets(trainingPassRate, 80) && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingPassRate}% training pass rate -- staff generally demonstrate good GDPR knowledge.`,
    );
  }

  if (meets(trainingCurrentRate, 90) && totalTrainingRecords > 0) {
    strengths.push(
      `${trainingCurrentRate}% of training certifications are current -- the home maintains up-to-date GDPR competency across the workforce.`,
    );
  }

  if (meets(refresherCompletionRate, 90) && refreshersDueTotal > 0) {
    strengths.push(
      `${refresherCompletionRate}% of GDPR refresher training completed -- the home ensures ongoing competency rather than one-off training.`,
    );
  }

  if (meets(certificateRate, 90) && totalTrainingRecords > 0) {
    strengths.push(
      `${certificateRate}% of training records backed by certificates -- strong evidence base for staff GDPR competency.`,
    );
  }

  if (meets(policyAccessibilityRate, 100) && totalPolicies > 0) {
    strengths.push(
      "All data protection policies accessible to staff -- staff can reference guidance whenever needed.",
    );
  }

  // -- Concerns -------------------------------------------------------------

  const concerns: string[] = [];

  if (below(gdprComplianceRate, 50) && totalPolicies > 0) {
    concerns.push(
      `Only ${gdprComplianceRate}% of data protection policies are GDPR-compliant -- the majority of the home's data protection framework does not meet legal requirements, exposing the organisation to regulatory action.`,
    );
  } else if (below(gdprComplianceRate, 70) && meets(gdprComplianceRate, 50) && totalPolicies > 0) {
    concerns.push(
      `${gdprComplianceRate}% GDPR policy compliance -- several data protection policies need updating to meet current legal standards.`,
    );
  }

  if (policiesOverdue > 0 && totalPolicies > 0) {
    concerns.push(
      `${policiesOverdue} data protection ${policiesOverdue === 1 ? "policy is" : "policies are"} overdue for review -- outdated policies may not reflect current legislation, processing activities, or organisational practices.`,
    );
  }

  if (below(staffAcknowledgementRate, 50) && totalStaffForAcknowledgement > 0) {
    concerns.push(
      `Only ${staffAcknowledgementRate}% of staff have acknowledged data protection policies -- the majority of the workforce may be unaware of their data handling obligations.`,
    );
  } else if (below(staffAcknowledgementRate, 70) && meets(staffAcknowledgementRate, 50) && totalStaffForAcknowledgement > 0) {
    concerns.push(
      `Staff policy acknowledgement at ${staffAcknowledgementRate}% -- a significant proportion of staff have not confirmed awareness of data protection policies.`,
    );
  }

  if (below(policyGapResolutionRate, 50) && totalPolicyGaps > 0) {
    concerns.push(
      `Only ${policyGapResolutionRate}% of identified policy gaps resolved -- known weaknesses in data protection governance remain unaddressed.`,
    );
  }

  if (below(dpoSignOffRate, 50) && totalPolicies > 0) {
    concerns.push(
      `DPO has signed off only ${dpoSignOffRate}% of policies -- insufficient DPO oversight of data protection governance.`,
    );
  }

  if (totalPolicies === 0 && (total_children > 0 || total_staff > 0) && !allEmpty) {
    concerns.push(
      "No data protection policies recorded -- the home cannot evidence a formal data protection framework to Ofsted or the ICO.",
    );
  }

  if (sarOverdueCount > 0) {
    concerns.push(
      `${sarOverdueCount} subject access ${sarOverdueCount === 1 ? "request is" : "requests are"} overdue -- failing to respond to SARs within 30 calendar days is a breach of UK GDPR Article 12.`,
    );
  }

  if (below(sarDeadlineRate, 50) && totalSars > 0) {
    concerns.push(
      `Only ${sarDeadlineRate}% of SARs completed within statutory deadline -- the home is routinely failing to meet its legal obligation to respond within 30 days.`,
    );
  } else if (below(sarDeadlineRate, 70) && meets(sarDeadlineRate, 50) && totalSars > 0) {
    concerns.push(
      `SAR deadline compliance at ${sarDeadlineRate}% -- some subject access requests are not being completed within the statutory 30-day timeframe.`,
    );
  }

  if (below(sarQualityRate, 50) && totalSars > 0) {
    concerns.push(
      `Only ${sarQualityRate}% of SAR responses quality-checked -- inadequate quality assurance risks incomplete or inaccurate disclosure.`,
    );
  }

  if (below(sarSatisfactionRate, 50) && totalSars > 0) {
    concerns.push(
      `Requester satisfaction with SAR responses at only ${sarSatisfactionRate}% -- data subjects are not satisfied with how the home handles their access requests.`,
    );
  }

  if (highSeverityBreaches > 0) {
    concerns.push(
      `${highSeverityBreaches} high or critical severity data ${highSeverityBreaches === 1 ? "breach" : "breaches"} recorded -- these represent serious risks to the privacy and safety of children and staff whose data has been compromised.`,
    );
  }

  if (childrenDataBreaches > 0) {
    concerns.push(
      `${childrenDataBreaches} data ${childrenDataBreaches === 1 ? "breach involves" : "breaches involve"} children's personal data -- breaches affecting vulnerable children's information are particularly serious and may trigger Ofsted notification requirements.`,
    );
  }

  if (below(rootCauseRate, 50) && totalBreaches > 0) {
    concerns.push(
      `Root cause identified in only ${rootCauseRate}% of breaches -- without understanding why breaches occur, the home cannot prevent recurrence.`,
    );
  }

  if (below(actionsCompletedRate, 50) && totalBreaches > 0) {
    concerns.push(
      `Only ${actionsCompletedRate}% of breach corrective actions completed -- known vulnerabilities remain unaddressed, leaving children's data at continued risk.`,
    );
  }

  if (icoReportableBreaches > 0 && below(icoTimelinessRate, 100)) {
    concerns.push(
      `${100 - icoTimelinessRate!}% of ICO-reportable breaches were not reported within 72 hours -- late reporting is itself a regulatory breach and may result in ICO enforcement action.`,
    );
  }

  if (below(lessonsLearnedRate, 50) && totalBreaches > 0) {
    concerns.push(
      `Lessons learned documented for only ${lessonsLearnedRate}% of breaches -- the home is not systematically learning from data security incidents.`,
    );
  }

  if (below(noticeGdprRate, 50) && totalNotices > 0) {
    concerns.push(
      `Only ${noticeGdprRate}% of privacy notices are GDPR-compliant -- data subjects are not receiving legally required transparency information about how their data is processed.`,
    );
  } else if (below(noticeGdprRate, 70) && meets(noticeGdprRate, 50) && totalNotices > 0) {
    concerns.push(
      `${noticeGdprRate}% privacy notice GDPR compliance -- some notices need updating to meet legal transparency requirements.`,
    );
  }

  if (noticesOverdue > 0 && totalNotices > 0) {
    concerns.push(
      `${noticesOverdue} privacy ${noticesOverdue === 1 ? "notice is" : "notices are"} overdue for review -- outdated notices may not accurately reflect current data processing activities.`,
    );
  }

  if (below(noticePlainLanguageRate, 50) && totalNotices > 0) {
    concerns.push(
      `Only ${noticePlainLanguageRate}% of privacy notices written in plain language -- data subjects, particularly children, cannot meaningfully understand how their data is used.`,
    );
  }

  if (below(noticeAgeAppropriateRate, 50) && totalNotices > 0) {
    concerns.push(
      `Only ${noticeAgeAppropriateRate}% of privacy notices are age-appropriate -- children cannot understand their data rights, undermining the home's transparency obligations.`,
    );
  }

  if (below(noticeLawfulBasisRate, 50) && totalNotices > 0) {
    concerns.push(
      `Lawful basis stated in only ${noticeLawfulBasisRate}% of notices -- failing to communicate the legal basis for processing is a GDPR Article 13/14 breach.`,
    );
  }

  if (totalNotices === 0 && (total_children > 0 || total_staff > 0) && !allEmpty) {
    concerns.push(
      "No privacy notices recorded -- the home has not documented how it communicates data processing information to children, parents, staff, or other data subjects.",
    );
  }

  if (below(staffTrainingCoverage, 50) && total_staff > 0) {
    concerns.push(
      `Only ${staffTrainingCoverage}% of staff have completed GDPR training -- the majority of the workforce may not understand their data protection obligations, creating significant compliance risk.`,
    );
  } else if (below(staffTrainingCoverage, 70) && meets(staffTrainingCoverage, 50) && total_staff > 0) {
    concerns.push(
      `GDPR training coverage at ${staffTrainingCoverage}% -- a significant proportion of staff have not received data protection training.`,
    );
  }

  if (trainingExpired > 0) {
    concerns.push(
      `${trainingExpired} GDPR training ${trainingExpired === 1 ? "certification has" : "certifications have"} expired -- staff with expired training may not be current on data protection requirements and legal changes.`,
    );
  }

  if (refreshersDue > 0) {
    concerns.push(
      `${refreshersDue} GDPR refresher ${refreshersDue === 1 ? "training session is" : "training sessions are"} overdue -- staff knowledge of data protection may be deteriorating without regular updates.`,
    );
  }

  if (below(trainingPassRate, 70) && totalTrainingRecords > 0) {
    concerns.push(
      `GDPR training pass rate at only ${trainingPassRate}% -- a significant proportion of staff are not demonstrating adequate understanding of data protection requirements.`,
    );
  }

  if (totalTrainingRecords === 0 && total_staff > 0 && !allEmpty) {
    concerns.push(
      "No GDPR training records -- the home cannot evidence that any staff have received data protection training, which is a fundamental requirement for handling children's sensitive personal data.",
    );
  }

  if (below(policyAccessibilityRate, 50) && totalPolicies > 0) {
    concerns.push(
      `Only ${policyAccessibilityRate}% of policies accessible to staff -- data protection guidance is not readily available to the workforce.`,
    );
  }

  // -- Recommendations ------------------------------------------------------

  const recommendations: DataProtectionRecommendation[] = [];
  let rank = 0;

  if (below(gdprComplianceRate, 50) && totalPolicies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and update all data protection policies to ensure GDPR compliance -- engage the DPO and legal advice to address gaps in lawful basis, data subject rights, retention schedules, and data sharing agreements.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 5, 24 / CHR 2015 Reg 21",
    });
  }

  if (totalPolicies === 0 && (total_children > 0 || total_staff > 0) && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop a comprehensive data protection policy framework covering data protection, information security, data retention, data sharing, consent management, and breach response. Ensure DPO sign-off and make all policies accessible to staff.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 24 / CHR 2015 Reg 21",
    });
  }

  if (sarOverdueCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Prioritise completion of ${sarOverdueCount} overdue subject access ${sarOverdueCount === 1 ? "request" : "requests"} -- failure to respond within 30 calendar days is a breach of UK GDPR Article 12 and may result in ICO enforcement action or complaints.`,
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 12, 15",
    });
  }

  if (highSeverityBreaches > 0 && below(actionsCompletedRate, 50)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete all outstanding corrective actions for high-severity data breaches as a matter of urgency -- unresolved vulnerabilities leave children's personal data at continued risk of compromise.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 33, 34",
    });
  }

  if (icoReportableBreaches > 0 && below(icoTimelinessRate, 100)) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a breach notification procedure ensuring all reportable breaches are notified to the ICO within 72 hours of becoming aware -- assign clear responsibilities and establish an escalation pathway for out-of-hours breaches.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 33",
    });
  }

  if (below(staffTrainingCoverage, 50) && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory GDPR training for all staff who handle personal data -- ensure induction training is completed before staff access children's records and schedule annual refresher training for all employees.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 39(1)(b) / CHR 2015 Reg 21",
    });
  }

  if (totalTrainingRecords === 0 && total_staff > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently establish a GDPR training programme for all staff -- no training records exist, meaning the home cannot demonstrate that staff understand their data protection obligations when handling children's sensitive personal data.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 39(1)(b)",
    });
  }

  if (totalNotices === 0 && (total_children > 0 || total_staff > 0) && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop and publish privacy notices for all data subject groups including children, parents, staff, visitors, and placing authorities -- each notice must explain the lawful basis, data rights, retention periods, and contact details for the DPO.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 13, 14",
    });
  }

  if (below(noticeGdprRate, 50) && totalNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and update privacy notices to achieve GDPR compliance -- ensure all notices cover lawful basis, purpose specification, data subject rights, retention periods, and complaint procedures.",
      urgency: "immediate",
      regulatory_ref: "UK GDPR 2018 Art 13, 14",
    });
  }

  if (below(noticePlainLanguageRate, 50) && totalNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Rewrite privacy notices in plain, accessible language -- GDPR requires transparency information to be concise, clear, and easy to understand, particularly when communicating with children.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 12(1)",
    });
  }

  if (below(noticeAgeAppropriateRate, 50) && totalNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Develop age-appropriate privacy notices for children in the home's care -- children must be able to understand how their personal data is collected, used, and shared in a way that is meaningful to them.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Recital 58 / ICO Children's Code",
    });
  }

  if (below(sarDeadlineRate, 50) && above(sarDeadlineRate, 0) && totalSars > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a SAR tracking system with automated deadline alerts -- assign a named SAR coordinator and establish a triage process to ensure all requests are acknowledged within 2 working days and completed within 30 calendar days.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 12, 15",
    });
  } else if (meets(sarDeadlineRate, 50) && below(sarDeadlineRate, 70) && totalSars > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve SAR handling timeliness to at least 70% within statutory deadline -- review the current process for bottlenecks and ensure adequate resourcing for timely response.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 12, 15",
    });
  }

  if (below(sarQualityRate, 50) && totalSars > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Introduce mandatory quality-checking for all SAR responses before disclosure -- ensure redaction is applied correctly, third-party data is identified, and responses are complete and accurate.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 15",
    });
  }

  if (below(rootCauseRate, 50) && totalBreaches > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct root cause analysis for all data breaches -- understanding the systemic causes of breaches is essential for implementing effective preventative measures and demonstrating accountability.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 5(2) -- Accountability",
    });
  }

  if (below(lessonsLearnedRate, 50) && totalBreaches > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Document lessons learned from all data breaches and share findings with staff -- embed breach learning into team meetings, supervision, and training to build a culture of continuous improvement.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 5(2) / SCCIF Leadership",
    });
  }

  if (policiesOverdue > 0 && totalPolicies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Review ${policiesOverdue} overdue data protection ${policiesOverdue === 1 ? "policy" : "policies"} -- ensure all policies reflect current legislation, processing activities, and organisational practices. Establish a policy review calendar with DPO oversight.`,
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 24 / CHR 2015 Reg 21",
    });
  }

  if (below(staffAcknowledgementRate, 50) && totalStaffForAcknowledgement > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Require all staff to acknowledge data protection policies in writing and maintain an acknowledgement register -- staff who have not acknowledged policies cannot demonstrate awareness of their data handling obligations.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 39(1)(b)",
    });
  }

  if (trainingExpired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Schedule refresher training for ${trainingExpired} staff with expired GDPR certifications -- expired training means staff may not be current on legal requirements and best practice.`,
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 39(1)(b)",
    });
  }

  if (refreshersDue > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Complete ${refreshersDue} overdue GDPR refresher training ${refreshersDue === 1 ? "session" : "sessions"} -- annual refresher training ensures staff remain current on evolving data protection requirements and threats.`,
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 39(1)(b)",
    });
  }

  if (meets(staffTrainingCoverage, 50) && below(staffTrainingCoverage, 70) && total_staff > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase GDPR training coverage to at least 70% of staff -- prioritise staff who regularly handle children's personal data and those in supervisory roles.",
      urgency: "soon",
      regulatory_ref: "UK GDPR 2018 Art 39(1)(b)",
    });
  }

  if (noticesOverdue > 0 && totalNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Review ${noticesOverdue} overdue privacy ${noticesOverdue === 1 ? "notice" : "notices"} -- privacy notices must be kept current to accurately reflect data processing activities and comply with GDPR transparency requirements.`,
      urgency: "planned",
      regulatory_ref: "UK GDPR 2018 Art 13, 14",
    });
  }

  if (below(noticeAcknowledgementRate, 70) && totalNoticeAudience > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase privacy notice acknowledgement rates by integrating notice distribution into admission, induction, and annual review processes -- ensure every data subject has received and understood the relevant privacy notice.",
      urgency: "planned",
      regulatory_ref: "UK GDPR 2018 Art 12",
    });
  }

  if (meets(gdprComplianceRate, 50) && below(gdprComplianceRate, 70) && totalPolicies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Continue improving GDPR compliance across remaining policies -- target 70% compliance as a minimum with a roadmap to full alignment.",
      urgency: "planned",
      regulatory_ref: "UK GDPR 2018 Art 5, 24",
    });
  }

  if (below(policyAccessibilityRate, 70) && totalPolicies > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Make all data protection policies accessible to staff through a central policy hub or shared drive -- staff should be able to reference guidance easily when handling personal data.",
      urgency: "planned",
      regulatory_ref: "UK GDPR 2018 Art 24 / CHR 2015 Reg 21",
    });
  }

  if (below(noticeLawfulBasisRate, 70) && meets(noticeLawfulBasisRate, 50) && totalNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Update privacy notices to clearly state the lawful basis for each processing activity -- this is a mandatory requirement under GDPR Articles 13 and 14.",
      urgency: "planned",
      regulatory_ref: "UK GDPR 2018 Art 13(1)(c), 14(1)(c)",
    });
  }

  if (below(noticeRetentionRate, 70) && totalNotices > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include retention periods in all privacy notices -- data subjects must be informed how long their personal data will be retained or the criteria used to determine retention periods.",
      urgency: "planned",
      regulatory_ref: "UK GDPR 2018 Art 13(2)(a)",
    });
  }

  // -- Insights -------------------------------------------------------------

  const insights: DataProtectionInsight[] = [];

  // --- Critical insights ---

  if (below(gdprComplianceRate, 50) && totalPolicies > 0) {
    insights.push({
      text: `Only ${gdprComplianceRate}% of data protection policies are GDPR-compliant. The ICO and Ofsted will view this as evidence that the home has not established the minimum legal framework for protecting children's personal data -- this exposes the organisation to enforcement action and undermines trust.`,
      severity: "critical",
    });
  }

  if (sarOverdueCount > 0) {
    insights.push({
      text: `${sarOverdueCount} subject access ${sarOverdueCount === 1 ? "request is" : "requests are"} overdue. Failing to respond to SARs within 30 days is a direct breach of UK GDPR Article 12 -- the ICO can issue enforcement notices, and complainants can escalate to the Information Commissioner.`,
      severity: "critical",
    });
  }

  if (highSeverityBreaches > 0 && below(actionsCompletedRate, 50)) {
    insights.push({
      text: `${highSeverityBreaches} high-severity ${highSeverityBreaches === 1 ? "breach" : "breaches"} with only ${actionsCompletedRate}% corrective actions completed. Children's personal data remains at significant risk -- Ofsted will view incomplete breach remediation as evidence of inadequate leadership and management under SCCIF.`,
      severity: "critical",
    });
  }

  if (childrenDataBreaches > 0 && !allEmpty) {
    insights.push({
      text: `${childrenDataBreaches} data ${childrenDataBreaches === 1 ? "breach involves" : "breaches involve"} children's personal data. Looked-after children's information is highly sensitive -- breaches can compromise their safety, undermine placement stability, and cause lasting harm to their trust in the care system.`,
      severity: "critical",
    });
  }

  if (below(staffTrainingCoverage, 40) && total_staff > 0) {
    insights.push({
      text: `Only ${staffTrainingCoverage}% of staff have GDPR training. Staff handling children's sensitive personal data without adequate training creates a systemic risk of breaches, inappropriate disclosure, and non-compliant data handling -- the ICO expects controllers to train all staff.`,
      severity: "critical",
    });
  }

  if (totalPolicies === 0 && totalNotices === 0 && (total_children > 0 || total_staff > 0) && !allEmpty) {
    insights.push({
      text: "No data protection policies or privacy notices exist. The home lacks the foundational governance structure required by UK GDPR and CHR 2015 Reg 21 -- without policies and transparency documents, the home cannot demonstrate accountability for personal data processing.",
      severity: "critical",
    });
  }

  if (icoReportableBreaches > 0 && below(icoTimelinessRate, 100)) {
    insights.push({
      text: `Not all ICO-reportable breaches were reported within 72 hours. Late notification is itself a regulatory breach under UK GDPR Article 33 -- the ICO has the power to impose fines for failure to notify within the statutory timeframe.`,
      severity: "critical",
    });
  }

  // --- Warning insights ---

  if (meets(gdprComplianceRate, 50) && below(gdprComplianceRate, 70) && totalPolicies > 0) {
    insights.push({
      text: `GDPR policy compliance at ${gdprComplianceRate}% -- improving but not yet at the level needed to satisfy ICO expectations. Each non-compliant policy represents a gap in the home's data protection framework.`,
      severity: "warning",
    });
  }

  if (policiesOverdue > 0 && totalPolicies > 0) {
    insights.push({
      text: `${policiesOverdue} ${policiesOverdue === 1 ? "policy" : "policies"} overdue for review. Overdue policies may reference superseded legislation or fail to account for new processing activities -- Ofsted expects policies to be living documents that reflect current practice.`,
      severity: "warning",
    });
  }

  if (meets(sarDeadlineRate, 50) && below(sarDeadlineRate, 70) && totalSars > 0) {
    insights.push({
      text: `SAR deadline compliance at ${sarDeadlineRate}% -- while most requests are handled, inconsistent timeliness suggests the SAR process may lack structure, resourcing, or management oversight.`,
      severity: "warning",
    });
  }

  if (sarPendingCount > 0 && sarOverdueCount === 0) {
    insights.push({
      text: `${sarPendingCount} subject access ${sarPendingCount === 1 ? "request" : "requests"} currently pending -- while none are yet overdue, active monitoring is needed to ensure statutory deadlines are met.`,
      severity: "warning",
    });
  }

  if (meets(rootCauseRate, 50) && below(rootCauseRate, 80) && totalBreaches > 0) {
    insights.push({
      text: `Root cause analysis completed for ${rootCauseRate}% of breaches -- some breaches lack thorough investigation, which may allow systemic weaknesses to persist and recurrence to go unaddressed.`,
      severity: "warning",
    });
  }

  if (below(recurrencePreventionRate, 70) && totalBreaches > 0) {
    insights.push({
      text: `Recurrence prevention measures in place for only ${recurrencePreventionRate}% of breaches -- without systemic changes following incidents, the home remains vulnerable to repeat breaches.`,
      severity: "warning",
    });
  }

  if (noticesOverdue > 0 && totalNotices > 0) {
    insights.push({
      text: `${noticesOverdue} privacy ${noticesOverdue === 1 ? "notice is" : "notices are"} overdue for review. Outdated privacy notices may not reflect current processing activities, creating a gap between what data subjects are told and what actually happens with their data.`,
      severity: "warning",
    });
  }

  if (noticesDueSoon > 0 && totalNotices > 0) {
    insights.push({
      text: `${noticesDueSoon} privacy ${noticesDueSoon === 1 ? "notice" : "notices"} due for review within 30 days -- proactive review will avoid notices becoming overdue and maintain continuous GDPR compliance.`,
      severity: "warning",
    });
  }

  if (meets(noticeAgeAppropriateRate, 50) && below(noticeAgeAppropriateRate, 90) && totalNotices > 0) {
    insights.push({
      text: `Age-appropriate notices at ${noticeAgeAppropriateRate}% -- some notices may not be accessible to children. The ICO Children's Code emphasises that transparency information must be understandable by the children it is intended for.`,
      severity: "warning",
    });
  }

  if (meets(staffTrainingCoverage, 50) && below(staffTrainingCoverage, 70) && total_staff > 0) {
    insights.push({
      text: `GDPR training coverage at ${staffTrainingCoverage}% -- a notable proportion of staff have not received data protection training. Every staff member who accesses personal data should have demonstrable GDPR competency.`,
      severity: "warning",
    });
  }

  if (trainingExpired > 0 && totalTrainingRecords > 0) {
    insights.push({
      text: `${trainingExpired} training ${trainingExpired === 1 ? "certification has" : "certifications have"} expired. The GDPR landscape evolves with new ICO guidance, case law, and threats -- staff with expired training may not be aware of current requirements and risks.`,
      severity: "warning",
    });
  }

  if (refreshersDue > 0 && totalTrainingRecords > 0) {
    insights.push({
      text: `${refreshersDue} GDPR refresher ${refreshersDue === 1 ? "session is" : "sessions are"} overdue. Annual refresher training is essential for maintaining awareness of evolving data protection requirements, new threats, and organisational changes to processing activities.`,
      severity: "warning",
    });
  }

  if (meets(policyAccessibilityRate, 50) && below(policyAccessibilityRate, 80) && totalPolicies > 0) {
    insights.push({
      text: `${policyAccessibilityRate}% of policies accessible to staff -- some data protection guidance is not readily available to those who need it. Inaccessible policies undermine their purpose and increase the risk of non-compliant data handling.`,
      severity: "warning",
    });
  }

  // --- Positive insights ---

  if (data_protection_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding data protection and GDPR compliance -- policies, SAR handling, breach management, privacy notices, and staff training all evidence a mature governance framework that protects children's personal data effectively. This is strong evidence for Reg 21 compliance and SCCIF leadership.",
      severity: "positive",
    });
  }

  if (meets(gdprComplianceRate, 90) && meets(policyReviewRate, 90) && totalPolicies > 0) {
    insights.push({
      text: `${gdprComplianceRate}% GDPR-compliant policies with ${policyReviewRate}% reviewed on schedule -- the home maintains a robust, current data protection framework. Ofsted and the ICO will recognise this as evidence of strong governance and accountability.`,
      severity: "positive",
    });
  }

  if (meets(sarDeadlineRate, 90) && meets(sarQualityRate, 90) && totalSars > 0) {
    insights.push({
      text: `${sarDeadlineRate}% SAR deadline compliance with ${sarQualityRate}% quality-checked -- the home handles subject access requests efficiently, accurately, and within statutory timescales. This demonstrates respect for data subject rights.`,
      severity: "positive",
    });
  }

  if (totalBreaches === 0 && totalPolicies > 0) {
    insights.push({
      text: "Zero data breaches with policies in place -- the home's data protection governance is effectively preventing unauthorised access, loss, or disclosure of personal data. This is the standard Ofsted and the ICO expect.",
      severity: "positive",
    });
  }

  if (totalBreaches > 0 && meets(rootCauseRate, 90) && meets(actionsCompletedRate, 90) && meets(lessonsLearnedRate, 90)) {
    insights.push({
      text: `Despite ${totalBreaches} ${totalBreaches === 1 ? "breach" : "breaches"}, root cause analysis (${rootCauseRate}%), corrective actions (${actionsCompletedRate}%), and lessons learned (${lessonsLearnedRate}%) all demonstrate a mature incident response culture. The home learns from breaches and takes systematic action to prevent recurrence.`,
      severity: "positive",
    });
  }

  if (meets(noticeGdprRate, 90) && meets(noticePlainLanguageRate, 90) && totalNotices > 0) {
    insights.push({
      text: `${noticeGdprRate}% GDPR-compliant privacy notices, ${noticePlainLanguageRate}% in plain language -- data subjects receive clear, legally compliant transparency information. This is exemplary practice in GDPR transparency obligations.`,
      severity: "positive",
    });
  }

  if (meets(noticeAgeAppropriateRate, 90) && totalNotices > 0) {
    insights.push({
      text: `${noticeAgeAppropriateRate}% of privacy notices are age-appropriate -- children can genuinely understand their data rights. This exceeds the ICO Children's Code expectations and demonstrates child-centred data protection practice.`,
      severity: "positive",
    });
  }

  if (meets(staffTrainingCoverage, 90) && meets(trainingPassRate, 90) && total_staff > 0) {
    insights.push({
      text: `${staffTrainingCoverage}% staff training coverage with ${trainingPassRate}% pass rate -- near-universal GDPR competency across the workforce. This provides strong assurance that children's personal data is handled by staff who understand their legal obligations.`,
      severity: "positive",
    });
  }

  if (meets(refresherCompletionRate, 90) && refreshersDueTotal > 0) {
    insights.push({
      text: `${refresherCompletionRate}% GDPR refresher completion -- the home invests in maintaining ongoing data protection competency rather than treating training as a one-off exercise. This demonstrates a commitment to continuous improvement.`,
      severity: "positive",
    });
  }

  if (meets(dpoSignOffRate, 90) && meets(staffAcknowledgementRate, 90) && totalPolicies > 0) {
    insights.push({
      text: `DPO sign-off at ${dpoSignOffRate}% and staff acknowledgement at ${staffAcknowledgementRate}% -- strong governance chain from policy approval to workforce awareness. This evidences a well-embedded data protection culture.`,
      severity: "positive",
    });
  }

  if (meets(policyGapResolutionRate, 90) && totalPolicyGaps > 0) {
    insights.push({
      text: `${policyGapResolutionRate}% of identified policy gaps resolved -- the home demonstrates accountability by identifying and addressing weaknesses in its data protection framework. This proactive approach is valued by both Ofsted and the ICO.`,
      severity: "positive",
    });
  }

  // -- Headline -------------------------------------------------------------

  let headline: string;

  if (data_protection_rating === "outstanding") {
    headline =
      "Outstanding data protection and GDPR compliance -- policies, SAR handling, breach management, privacy notices, and staff training all evidence a mature governance framework protecting children's personal data.";
  } else if (data_protection_rating === "good") {
    headline = `Good data protection and GDPR compliance -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (data_protection_rating === "adequate") {
    headline = `Adequate data protection and GDPR compliance -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's personal data is fully protected.`;
  } else {
    headline = `Data protection and GDPR compliance is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to meet UK GDPR and CHR 2015 Reg 21 requirements.`;
  }

  // -- Return ---------------------------------------------------------------

  return {
    data_protection_rating,
    data_protection_score: score,
    headline,
    policy_compliance_rate: policyComplianceRate,
    sar_handling_rate: sarHandlingRate,
    breach_management_rate: breachManagementRate,
    privacy_notice_rate: privacyNoticeRate,
    staff_training_rate: staffTrainingRate,
    record_security_rate: recordSecurityRate,
    policy_compliance_records,
    sar_records,
    breach_records,
    privacy_notice_records,
    training_records,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
