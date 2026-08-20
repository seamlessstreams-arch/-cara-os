// ══════════════════════════════════════════════════════════════════════════════
// CARA — HOME CCTV & SURVEILLANCE GOVERNANCE INTELLIGENCE ENGINE
// Monitors CCTV governance quality including policy compliance, privacy impact
// assessments, footage retention management, child awareness of surveillance,
// and data protection compliance across the home.
// Measures policy compliance rate, privacy impact rate, retention compliance
// rate, child awareness rate, data protection rate, and staff training rate.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 21 (Privacy and dignity), Reg 25 (Premises — review of
// appropriateness of surveillance), SCCIF: "Safety and protection",
// "Leadership and management".
// Store keys: cctvPolicyRecords, privacyImpactRecords, footageRetentionRecords,
//             childAwarenessRecords, dataProtectionRecords
// ══════════════════════════════════════════════════════════════════════════════

import { below, meets } from "@/lib/metrics/rate";

// ── Input Types ─────────────────────────────────────────────────────────────

export interface CctvPolicyRecordInput {
  id: string;
  policy_name: string;
  policy_type: "cctv_usage" | "surveillance_placement" | "signage" | "access_control" | "monitoring_schedule" | "data_handling" | "review" | "other";
  approved: boolean;
  approval_date: string | null;
  review_date: string | null;
  review_due_date: string | null;
  review_overdue: boolean;
  compliant_with_ico: boolean;
  covers_children_rights: boolean;
  covers_staff_rights: boolean;
  covers_visitor_notification: boolean;
  registered_manager_signed: boolean;
  shared_with_placing_authorities: boolean;
  version: string;
  notes: string;
  created_at: string;
}

export interface PrivacyImpactRecordInput {
  id: string;
  assessment_name: string;
  assessment_type: "full_pia" | "dpia" | "review" | "update" | "initial" | "other";
  date_completed: string;
  camera_location: string;
  justified: boolean;
  proportionate: boolean;
  less_intrusive_alternatives_considered: boolean;
  children_consulted: boolean;
  staff_consulted: boolean;
  risk_mitigations_documented: boolean;
  approved_by_dpo: boolean;
  review_date: string | null;
  review_overdue: boolean;
  outcome: "approved" | "approved_with_conditions" | "rejected" | "pending";
  notes: string;
  created_at: string;
}

export interface FootageRetentionRecordInput {
  id: string;
  camera_id: string;
  camera_location: string;
  retention_period_days: number;
  max_retention_days: number;
  within_retention_policy: boolean;
  auto_delete_enabled: boolean;
  deletion_log_maintained: boolean;
  access_log_maintained: boolean;
  footage_encrypted: boolean;
  footage_accessed_count: number;
  footage_accessed_authorised: number;
  subject_access_requests: number;
  subject_access_fulfilled: number;
  last_audit_date: string | null;
  audit_overdue: boolean;
  notes: string;
  created_at: string;
}

export interface ChildAwarenessRecordInput {
  id: string;
  child_id: string;
  date: string;
  awareness_type: "induction_briefing" | "ongoing_discussion" | "rights_explanation" | "complaint_process" | "review_meeting" | "house_meeting" | "individual_session" | "other";
  child_informed_of_camera_locations: boolean;
  child_informed_of_purpose: boolean;
  child_informed_of_rights: boolean;
  child_informed_of_complaint_process: boolean;
  child_views_recorded: boolean;
  child_views_positive: boolean;
  child_objections_raised: boolean;
  child_objections_addressed: boolean;
  age_appropriate_explanation: boolean;
  documented: boolean;
  staff_member: string;
  notes: string;
  created_at: string;
}

export interface DataProtectionRecordInput {
  id: string;
  record_type: "audit" | "breach_report" | "sar_response" | "training" | "policy_review" | "ico_correspondence" | "dpo_review" | "access_log_review" | "other";
  date: string;
  compliant: boolean;
  breach_occurred: boolean;
  breach_severity: "low" | "medium" | "high" | "critical" | null;
  breach_reported_to_ico: boolean;
  breach_reported_within_72hrs: boolean;
  staff_member: string;
  staff_trained: boolean;
  training_date: string | null;
  training_up_to_date: boolean;
  dpo_involved: boolean;
  ico_registration_current: boolean;
  data_sharing_agreements_current: boolean;
  encryption_in_place: boolean;
  access_controls_adequate: boolean;
  notes: string;
  created_at: string;
}

export interface CctvGovernanceInput {
  today: string;
  total_children: number;
  cctv_policy_records: CctvPolicyRecordInput[];
  privacy_impact_records: PrivacyImpactRecordInput[];
  footage_retention_records: FootageRetentionRecordInput[];
  child_awareness_records: ChildAwarenessRecordInput[];
  data_protection_records: DataProtectionRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type CctvGovernanceRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface CctvGovernanceInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface CctvGovernanceRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface CctvGovernanceResult {
  cctv_rating: CctvGovernanceRating;
  cctv_score: number;
  headline: string;
  total_policy_records: number;
  total_privacy_impact_records: number;
  total_retention_records: number;
  total_child_awareness_records: number;
  total_data_protection_records: number;
  // Null on empty across every composite rate — no source records ⇒ no
  // signal. "0% policy compliance / 0% privacy impact / 0% retention /
  // 0% child awareness / 0% data protection / 0% staff training" would
  // read as a home with unsupervised surveillance and no data-protection
  // safeguards, not "unmeasured". Fab-0 doctrine.
  policy_compliance_rate: number | null;
  privacy_impact_rate: number | null;
  retention_compliance_rate: number | null;
  child_awareness_rate: number | null;
  data_protection_rate: number | null;
  staff_training_rate: number | null;
  strengths: string[];
  concerns: string[];
  recommendations: CctvGovernanceRecommendation[];
  insights: CctvGovernanceInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): CctvGovernanceRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: CctvGovernanceRating,
  score: number,
  headline: string,
): CctvGovernanceResult {
  return {
    cctv_rating: rating,
    cctv_score: score,
    headline,
    total_policy_records: 0,
    total_privacy_impact_records: 0,
    total_retention_records: 0,
    total_child_awareness_records: 0,
    total_data_protection_records: 0,
    policy_compliance_rate: null,
    privacy_impact_rate: null,
    retention_compliance_rate: null,
    child_awareness_rate: null,
    data_protection_rate: null,
    staff_training_rate: null,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeCctvSurveillanceGovernance(
  input: CctvGovernanceInput,
): CctvGovernanceResult {
  const {
    total_children,
    cctv_policy_records,
    privacy_impact_records,
    footage_retention_records,
    child_awareness_records,
    data_protection_records,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    cctv_policy_records.length === 0 &&
    privacy_impact_records.length === 0 &&
    footage_retention_records.length === 0 &&
    child_awareness_records.length === 0 &&
    data_protection_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess CCTV and surveillance governance.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No CCTV or surveillance governance data recorded despite children on placement — CCTV policy compliance, privacy impact assessments, and children's awareness of surveillance require urgent attention.",
      ),
      concerns: [
        "No CCTV policy records, privacy impact assessments, footage retention records, child awareness records, or data protection records exist despite children being on placement — the home cannot evidence lawful and proportionate surveillance governance.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement comprehensive CCTV governance recording including approved policies, privacy impact assessments for each camera, footage retention management, child awareness documentation, and data protection compliance audits to evidence lawful and proportionate surveillance.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child is informed about the location, purpose, and their rights in relation to CCTV surveillance in an age-appropriate manner as part of placement induction and ongoing care planning.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Safety and protection",
        },
      ],
      insights: [
        {
          text: "The complete absence of CCTV surveillance governance records means the home cannot demonstrate that surveillance is lawful, proportionate, privacy-respecting, or that children are informed of their rights. This represents a serious governance gap under Regulation 21 (privacy and dignity) and raises significant data protection concerns.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- CCTV policy compliance metrics ---
  const totalPolicyRecords = cctv_policy_records.length;
  const approvedPolicies = cctv_policy_records.filter((p) => p.approved).length;
  const policyApprovalRate = pct(approvedPolicies, totalPolicyRecords);

  const icoCompliantPolicies = cctv_policy_records.filter((p) => p.approved && p.compliant_with_ico).length;
  const icoComplianceRate = pct(icoCompliantPolicies, totalPolicyRecords);

  const policiesCoveringChildrenRights = cctv_policy_records.filter((p) => p.approved && p.covers_children_rights).length;
  const childrenRightsCoverageRate = pct(policiesCoveringChildrenRights, totalPolicyRecords);

  const policiesCoveringStaffRights = cctv_policy_records.filter((p) => p.approved && p.covers_staff_rights).length;
  const staffRightsCoverageRate = pct(policiesCoveringStaffRights, totalPolicyRecords);

  const policiesCoveringVisitorNotification = cctv_policy_records.filter((p) => p.approved && p.covers_visitor_notification).length;
  const visitorNotificationRate = pct(policiesCoveringVisitorNotification, totalPolicyRecords);

  const rmSignedPolicies = cctv_policy_records.filter((p) => p.approved && p.registered_manager_signed).length;
  const rmSignedRate = pct(rmSignedPolicies, totalPolicyRecords);

  const sharedWithPlacingAuth = cctv_policy_records.filter((p) => p.approved && p.shared_with_placing_authorities).length;
  const sharedWithPlacingAuthRate = pct(sharedWithPlacingAuth, totalPolicyRecords);

  const overdueReviews = cctv_policy_records.filter((p) => p.review_overdue).length;
  const reviewOverdueRate = pct(overdueReviews, totalPolicyRecords);

  // Composite policy compliance rate: average of approval, ICO compliance, children rights coverage, RM signed
  const policyComplianceRate: number | null =
    totalPolicyRecords > 0
      ? Math.round(
          (policyApprovalRate + icoComplianceRate + childrenRightsCoverageRate + rmSignedRate) / 4,
        )
      : null;

  // --- Privacy impact assessment metrics ---
  const totalPrivacyImpactRecords = privacy_impact_records.length;
  const justifiedAssessments = privacy_impact_records.filter((p) => p.justified).length;
  const justificationRate = pct(justifiedAssessments, totalPrivacyImpactRecords);

  const proportionateAssessments = privacy_impact_records.filter((p) => p.proportionate).length;
  const proportionalityRate = pct(proportionateAssessments, totalPrivacyImpactRecords);

  const alternativesConsidered = privacy_impact_records.filter((p) => p.less_intrusive_alternatives_considered).length;
  const alternativesConsideredRate = pct(alternativesConsidered, totalPrivacyImpactRecords);

  const childrenConsulted = privacy_impact_records.filter((p) => p.children_consulted).length;
  const childrenConsultedRate = pct(childrenConsulted, totalPrivacyImpactRecords);

  const staffConsulted = privacy_impact_records.filter((p) => p.staff_consulted).length;
  const staffConsultedRate = pct(staffConsulted, totalPrivacyImpactRecords);

  const riskMitigationsDocumented = privacy_impact_records.filter((p) => p.risk_mitigations_documented).length;
  const riskMitigationRate = pct(riskMitigationsDocumented, totalPrivacyImpactRecords);

  const dpoApproved = privacy_impact_records.filter((p) => p.approved_by_dpo).length;
  const dpoApprovalRate = pct(dpoApproved, totalPrivacyImpactRecords);

  const piaOverdue = privacy_impact_records.filter((p) => p.review_overdue).length;
  const piaOverdueRate = pct(piaOverdue, totalPrivacyImpactRecords);

  const approvedAssessments = privacy_impact_records.filter(
    (p) => p.outcome === "approved" || p.outcome === "approved_with_conditions",
  ).length;
  const assessmentApprovalRate = pct(approvedAssessments, totalPrivacyImpactRecords);

  // Composite privacy impact rate: average of justification, proportionality, alternatives, risk mitigation, DPO approval
  const privacyImpactRate: number | null =
    totalPrivacyImpactRecords > 0
      ? Math.round(
          (justificationRate + proportionalityRate + alternativesConsideredRate + riskMitigationRate + dpoApprovalRate) / 5,
        )
      : null;

  // --- Footage retention compliance metrics ---
  const totalRetentionRecords = footage_retention_records.length;
  const withinRetentionPolicy = footage_retention_records.filter((r) => r.within_retention_policy).length;
  const retentionPolicyRate = pct(withinRetentionPolicy, totalRetentionRecords);

  const autoDeleteEnabled = footage_retention_records.filter((r) => r.auto_delete_enabled).length;
  const autoDeleteRate = pct(autoDeleteEnabled, totalRetentionRecords);

  const deletionLogMaintained = footage_retention_records.filter((r) => r.deletion_log_maintained).length;
  const deletionLogRate = pct(deletionLogMaintained, totalRetentionRecords);

  const accessLogMaintained = footage_retention_records.filter((r) => r.access_log_maintained).length;
  const accessLogRate = pct(accessLogMaintained, totalRetentionRecords);

  const footageEncrypted = footage_retention_records.filter((r) => r.footage_encrypted).length;
  const encryptionRate = pct(footageEncrypted, totalRetentionRecords);

  const totalAccessCount = footage_retention_records.reduce((sum, r) => sum + r.footage_accessed_count, 0);
  const totalAccessAuthorised = footage_retention_records.reduce((sum, r) => sum + r.footage_accessed_authorised, 0);
  const authorisedAccessRate = pct(totalAccessAuthorised, totalAccessCount);

  const totalSarRequests = footage_retention_records.reduce((sum, r) => sum + r.subject_access_requests, 0);
  const totalSarFulfilled = footage_retention_records.reduce((sum, r) => sum + r.subject_access_fulfilled, 0);
  const sarFulfilmentRate = pct(totalSarFulfilled, totalSarRequests);

  const auditOverdue = footage_retention_records.filter((r) => r.audit_overdue).length;
  const auditOverdueRate = pct(auditOverdue, totalRetentionRecords);

  // Composite retention compliance rate: average of retention policy, auto-delete, deletion log, access log, encryption
  const retentionComplianceRate: number | null =
    totalRetentionRecords > 0
      ? Math.round(
          (retentionPolicyRate + autoDeleteRate + deletionLogRate + accessLogRate + encryptionRate) / 5,
        )
      : null;

  // --- Child awareness metrics ---
  const totalChildAwarenessRecords = child_awareness_records.length;
  const informedOfLocations = child_awareness_records.filter((c) => c.child_informed_of_camera_locations).length;
  const locationAwarenessRate = pct(informedOfLocations, totalChildAwarenessRecords);

  const informedOfPurpose = child_awareness_records.filter((c) => c.child_informed_of_purpose).length;
  const purposeAwarenessRate = pct(informedOfPurpose, totalChildAwarenessRecords);

  const informedOfRights = child_awareness_records.filter((c) => c.child_informed_of_rights).length;
  const rightsAwarenessRate = pct(informedOfRights, totalChildAwarenessRecords);

  const informedOfComplaintProcess = child_awareness_records.filter((c) => c.child_informed_of_complaint_process).length;
  const complaintProcessAwarenessRate = pct(informedOfComplaintProcess, totalChildAwarenessRecords);

  const viewsRecorded = child_awareness_records.filter((c) => c.child_views_recorded).length;
  const viewsRecordedRate = pct(viewsRecorded, totalChildAwarenessRecords);

  const viewsPositive = child_awareness_records.filter((c) => c.child_views_recorded && c.child_views_positive).length;
  const positiveViewsRate = pct(viewsPositive, totalChildAwarenessRecords);

  const objectionsRaised = child_awareness_records.filter((c) => c.child_objections_raised).length;
  const objectionsAddressed = child_awareness_records.filter((c) => c.child_objections_raised && c.child_objections_addressed).length;
  const objectionsAddressedRate = pct(objectionsAddressed, objectionsRaised);

  const ageAppropriate = child_awareness_records.filter((c) => c.age_appropriate_explanation).length;
  const ageAppropriateRate = pct(ageAppropriate, totalChildAwarenessRecords);

  const documented = child_awareness_records.filter((c) => c.documented).length;
  const documentedRate = pct(documented, totalChildAwarenessRecords);

  const uniqueChildrenAware = new Set(
    child_awareness_records.filter(
      (c) => c.child_informed_of_camera_locations && c.child_informed_of_rights,
    ).map((c) => c.child_id),
  ).size;
  const childAwarenessCoverage = total_children > 0 ? pct(uniqueChildrenAware, total_children) : 0;

  // Composite child awareness rate: average of location awareness, purpose, rights, age-appropriate, documented
  const childAwarenessRate: number | null =
    totalChildAwarenessRecords > 0
      ? Math.round(
          (locationAwarenessRate + purposeAwarenessRate + rightsAwarenessRate + ageAppropriateRate + documentedRate) / 5,
        )
      : null;

  // --- Data protection compliance metrics ---
  const totalDataProtectionRecords = data_protection_records.length;
  const compliantRecords = data_protection_records.filter((d) => d.compliant).length;
  const complianceRate = pct(compliantRecords, totalDataProtectionRecords);

  const breachRecords = data_protection_records.filter((d) => d.breach_occurred).length;
  const breachRate = pct(breachRecords, totalDataProtectionRecords);

  const breachesReportedToIco = data_protection_records.filter(
    (d) => d.breach_occurred && d.breach_reported_to_ico,
  ).length;
  const breachReportingRate = pct(breachesReportedToIco, breachRecords);

  const breachesReportedWithin72hrs = data_protection_records.filter(
    (d) => d.breach_occurred && d.breach_reported_within_72hrs,
  ).length;
  const timelyBreachReportingRate = pct(breachesReportedWithin72hrs, breachRecords);

  const criticalBreaches = data_protection_records.filter(
    (d) => d.breach_occurred && (d.breach_severity === "critical" || d.breach_severity === "high"),
  ).length;

  const staffTrained = data_protection_records.filter((d) => d.staff_trained).length;
  const staffTrainedRate = pct(staffTrained, totalDataProtectionRecords);

  const trainingUpToDate = data_protection_records.filter((d) => d.staff_trained && d.training_up_to_date).length;
  const trainingCurrentRate = pct(trainingUpToDate, totalDataProtectionRecords);

  const dpoInvolved = data_protection_records.filter((d) => d.dpo_involved).length;
  const dpoInvolvementRate = pct(dpoInvolved, totalDataProtectionRecords);

  const icoRegistrationCurrent = data_protection_records.filter((d) => d.ico_registration_current).length;
  const icoRegistrationRate = pct(icoRegistrationCurrent, totalDataProtectionRecords);

  const dataSharingAgreementsCurrent = data_protection_records.filter((d) => d.data_sharing_agreements_current).length;
  const dataSharingRate = pct(dataSharingAgreementsCurrent, totalDataProtectionRecords);

  const encryptionInPlace = data_protection_records.filter((d) => d.encryption_in_place).length;
  const dpEncryptionRate = pct(encryptionInPlace, totalDataProtectionRecords);

  const accessControlsAdequate = data_protection_records.filter((d) => d.access_controls_adequate).length;
  const accessControlRate = pct(accessControlsAdequate, totalDataProtectionRecords);

  // Composite data protection rate: average of compliance, encryption, access controls, ICO registration, data sharing
  const dataProtectionRate: number | null =
    totalDataProtectionRecords > 0
      ? Math.round(
          (complianceRate + dpEncryptionRate + accessControlRate + icoRegistrationRate + dataSharingRate) / 5,
        )
      : null;

  // Staff training rate composite — combined from data protection staff training and policy coverage
  const staffTrainingRate: number | null =
    totalDataProtectionRecords > 0
      ? Math.round((staffTrainedRate + trainingCurrentRate) / 2)
      : null;

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: policyComplianceRate (>=90: +4, >=70: +2) ---
  if (meets(policyComplianceRate, 90)) score += 4;
  else if (meets(policyComplianceRate, 70)) score += 2;

  // --- Bonus 2: privacyImpactRate (>=90: +4, >=70: +2) ---
  if (meets(privacyImpactRate, 90)) score += 4;
  else if (meets(privacyImpactRate, 70)) score += 2;

  // --- Bonus 3: retentionComplianceRate (>=90: +4, >=70: +2) ---
  if (meets(retentionComplianceRate, 90)) score += 4;
  else if (meets(retentionComplianceRate, 70)) score += 2;

  // --- Bonus 4: childAwarenessRate (>=90: +4, >=70: +2) ---
  if (meets(childAwarenessRate, 90)) score += 4;
  else if (meets(childAwarenessRate, 70)) score += 2;

  // --- Bonus 5: dataProtectionRate (>=90: +4, >=70: +2) ---
  if (meets(dataProtectionRate, 90)) score += 4;
  else if (meets(dataProtectionRate, 70)) score += 2;

  // --- Bonus 6: staffTrainingRate (>=90: +3, >=70: +1) ---
  if (meets(staffTrainingRate, 90)) score += 3;
  else if (meets(staffTrainingRate, 70)) score += 1;

  // --- Bonus 7: authorisedAccessRate (>=95: +3, >=80: +1) ---
  if (authorisedAccessRate >= 95) score += 3;
  else if (authorisedAccessRate >= 80) score += 1;

  // --- Bonus 8: childAwarenessCoverage (>=100: +2, >=80: +1) ---
  if (childAwarenessCoverage >= 100 && total_children > 0) score += 2;
  else if (childAwarenessCoverage >= 80 && total_children > 0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // below(policyComplianceRate, 40) → -5 (guarded)
  if (below(policyComplianceRate, 40) && cctv_policy_records.length > 0) score -= 5;

  // below(privacyImpactRate, 40) → -5 (guarded)
  if (below(privacyImpactRate, 40) && privacy_impact_records.length > 0) score -= 5;

  // below(retentionComplianceRate, 40) → -5 (guarded)
  if (below(retentionComplianceRate, 40) && footage_retention_records.length > 0) score -= 5;

  // below(childAwarenessRate, 30) → -3 (guarded)
  if (below(childAwarenessRate, 30) && child_awareness_records.length > 0) score -= 3;

  score = clamp(score, 0, 100);

  const cctv_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (meets(policyComplianceRate, 90) && totalPolicyRecords > 0) {
    strengths.push(
      `${policyComplianceRate}% CCTV policy compliance — the home maintains comprehensive, approved, ICO-compliant surveillance policies that protect children's rights and are signed by the registered manager.`,
    );
  } else if (meets(policyComplianceRate, 70) && totalPolicyRecords > 0) {
    strengths.push(
      `${policyComplianceRate}% CCTV policy compliance — the home has a solid framework of approved surveillance policies covering key governance areas.`,
    );
  }

  if (meets(privacyImpactRate, 90) && totalPrivacyImpactRecords > 0) {
    strengths.push(
      `${privacyImpactRate}% privacy impact assessment compliance — every camera placement is justified, proportionate, with alternatives considered and DPO approval documented.`,
    );
  } else if (meets(privacyImpactRate, 70) && totalPrivacyImpactRecords > 0) {
    strengths.push(
      `${privacyImpactRate}% privacy impact assessment rate — the home demonstrates a structured approach to ensuring surveillance is justified and proportionate.`,
    );
  }

  if (meets(retentionComplianceRate, 90) && totalRetentionRecords > 0) {
    strengths.push(
      `${retentionComplianceRate}% footage retention compliance — footage is managed within policy, auto-deletion is enabled, logs are maintained, and encryption protects stored recordings.`,
    );
  } else if (meets(retentionComplianceRate, 70) && totalRetentionRecords > 0) {
    strengths.push(
      `${retentionComplianceRate}% footage retention compliance — the home generally manages footage within retention policies with appropriate safeguards.`,
    );
  }

  if (meets(childAwarenessRate, 90) && totalChildAwarenessRecords > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness rate — children are fully informed about camera locations, purposes, their rights, and how to complain, with age-appropriate explanations and documented conversations.`,
    );
  } else if (meets(childAwarenessRate, 70) && totalChildAwarenessRecords > 0) {
    strengths.push(
      `${childAwarenessRate}% child awareness rate — the home is informing children about CCTV surveillance and their rights in a generally effective manner.`,
    );
  }

  if (meets(dataProtectionRate, 90) && totalDataProtectionRecords > 0) {
    strengths.push(
      `${dataProtectionRate}% data protection compliance — ICO registration, encryption, access controls, and data sharing agreements are all properly maintained for CCTV data.`,
    );
  } else if (meets(dataProtectionRate, 70) && totalDataProtectionRecords > 0) {
    strengths.push(
      `${dataProtectionRate}% data protection compliance — the home demonstrates a good standard of data protection governance for CCTV and surveillance data.`,
    );
  }

  if (meets(staffTrainingRate, 90) && totalDataProtectionRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff training rate — staff are well-trained and up-to-date on CCTV data protection, access procedures, and surveillance governance responsibilities.`,
    );
  } else if (meets(staffTrainingRate, 70) && totalDataProtectionRecords > 0) {
    strengths.push(
      `${staffTrainingRate}% staff training rate — most staff have received CCTV and data protection training that remains current.`,
    );
  }

  if (authorisedAccessRate >= 95 && totalAccessCount > 0) {
    strengths.push(
      `${authorisedAccessRate}% of footage access is authorised — strong access controls ensure CCTV footage is only viewed with proper authorisation.`,
    );
  } else if (authorisedAccessRate >= 80 && totalAccessCount > 0) {
    strengths.push(
      `${authorisedAccessRate}% authorised footage access — the home generally maintains good access control over CCTV recordings.`,
    );
  }

  if (childAwarenessCoverage >= 100 && total_children > 0) {
    strengths.push(
      "Every child has been informed about CCTV camera locations and their rights — surveillance awareness is embedded in the placement induction and ongoing care approach.",
    );
  } else if (childAwarenessCoverage >= 80 && total_children > 0) {
    strengths.push(
      `${childAwarenessCoverage}% of children have been informed about CCTV locations and rights — strong coverage ensuring most children understand surveillance arrangements.`,
    );
  }

  if (objectionsAddressedRate >= 100 && objectionsRaised > 0) {
    strengths.push(
      "All child objections to surveillance have been addressed — the home demonstrates genuine respect for children's views and privacy concerns.",
    );
  } else if (objectionsAddressedRate >= 80 && objectionsRaised > 0) {
    strengths.push(
      `${objectionsAddressedRate}% of child objections to surveillance addressed — the home takes children's privacy concerns seriously and acts on them.`,
    );
  }

  if (sarFulfilmentRate >= 100 && totalSarRequests > 0) {
    strengths.push(
      "All subject access requests for CCTV footage have been fulfilled — the home meets its legal obligations under data protection law.",
    );
  } else if (sarFulfilmentRate >= 80 && totalSarRequests > 0) {
    strengths.push(
      `${sarFulfilmentRate}% of subject access requests fulfilled — the home generally meets its obligations regarding footage access requests.`,
    );
  }

  if (encryptionRate >= 100 && totalRetentionRecords > 0) {
    strengths.push(
      "All CCTV footage is encrypted — robust technical measures protect recorded data from unauthorised access.",
    );
  }

  if (icoComplianceRate >= 100 && totalPolicyRecords > 0) {
    strengths.push(
      "All CCTV policies are ICO-compliant — the home's surveillance framework fully aligns with Information Commissioner's Office requirements.",
    );
  }

  if (alternativesConsideredRate >= 100 && totalPrivacyImpactRecords > 0) {
    strengths.push(
      "Less intrusive alternatives have been considered for every camera placement — the home demonstrates that surveillance is a last resort and proportionate to identified risks.",
    );
  }

  if (reviewOverdueRate === 0 && totalPolicyRecords > 0) {
    strengths.push(
      "No CCTV policy reviews are overdue — the home maintains a current and regularly reviewed surveillance governance framework.",
    );
  }

  if (breachRate === 0 && totalDataProtectionRecords > 0) {
    strengths.push(
      "Zero CCTV data breaches recorded — the home's data protection controls are effectively preventing unauthorised disclosure of surveillance data.",
    );
  }

  if (positiveViewsRate >= 80 && totalChildAwarenessRecords > 0) {
    strengths.push(
      `${positiveViewsRate}% of children hold positive views about CCTV arrangements — surveillance is perceived as protective rather than intrusive, reflecting good communication and proportionate use.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (below(policyComplianceRate, 40) && totalPolicyRecords > 0) {
    concerns.push(
      `Only ${policyComplianceRate}% CCTV policy compliance — the majority of surveillance policies are not approved, not ICO-compliant, or do not adequately cover children's rights, representing a fundamental governance failure.`,
    );
  } else if (below(policyComplianceRate, 70) && meets(policyComplianceRate, 40) && totalPolicyRecords > 0) {
    concerns.push(
      `CCTV policy compliance at ${policyComplianceRate}% — gaps in policy approval, ICO compliance, or coverage of children's rights need to be addressed to meet governance standards.`,
    );
  }

  if (below(privacyImpactRate, 40) && totalPrivacyImpactRecords > 0) {
    concerns.push(
      `Only ${privacyImpactRate}% privacy impact assessment compliance — the majority of camera placements lack proper justification, proportionality assessment, or DPO approval, potentially making surveillance unlawful.`,
    );
  } else if (below(privacyImpactRate, 70) && meets(privacyImpactRate, 40) && totalPrivacyImpactRecords > 0) {
    concerns.push(
      `Privacy impact assessment rate at ${privacyImpactRate}% — not all camera placements have been fully assessed for justification, proportionality, and less intrusive alternatives.`,
    );
  }

  if (below(retentionComplianceRate, 40) && totalRetentionRecords > 0) {
    concerns.push(
      `Only ${retentionComplianceRate}% footage retention compliance — footage is not being managed within policy, auto-deletion may not be enabled, and logs may not be maintained, creating serious data protection risks.`,
    );
  } else if (below(retentionComplianceRate, 70) && meets(retentionComplianceRate, 40) && totalRetentionRecords > 0) {
    concerns.push(
      `Footage retention compliance at ${retentionComplianceRate}% — some cameras lack proper retention management, deletion logs, or encryption safeguards.`,
    );
  }

  if (below(childAwarenessRate, 30) && totalChildAwarenessRecords > 0) {
    concerns.push(
      `Only ${childAwarenessRate}% child awareness rate — the majority of children are not properly informed about camera locations, purposes, or their rights regarding surveillance, breaching their right to privacy and dignity.`,
    );
  } else if (below(childAwarenessRate, 70) && meets(childAwarenessRate, 30) && totalChildAwarenessRecords > 0) {
    concerns.push(
      `Child awareness rate at ${childAwarenessRate}% — not all children are fully informed about surveillance arrangements, their rights, or how to raise concerns.`,
    );
  }

  if (below(dataProtectionRate, 40) && totalDataProtectionRecords > 0) {
    concerns.push(
      `Only ${dataProtectionRate}% data protection compliance — significant gaps in encryption, access controls, ICO registration, or data sharing agreements for CCTV data create legal and privacy risks.`,
    );
  } else if (below(dataProtectionRate, 70) && meets(dataProtectionRate, 40) && totalDataProtectionRecords > 0) {
    concerns.push(
      `Data protection compliance at ${dataProtectionRate}% — some areas of CCTV data governance need strengthening to meet legal requirements.`,
    );
  }

  if (below(staffTrainingRate, 50) && totalDataProtectionRecords > 0) {
    concerns.push(
      `Only ${staffTrainingRate}% staff CCTV training rate — staff may not understand their responsibilities regarding surveillance access, data protection, and children's rights to privacy.`,
    );
  } else if (below(staffTrainingRate, 70) && meets(staffTrainingRate, 50) && totalDataProtectionRecords > 0) {
    concerns.push(
      `Staff CCTV training rate at ${staffTrainingRate}% — not all staff are adequately trained on surveillance governance and data protection responsibilities.`,
    );
  }

  if (criticalBreaches > 0) {
    concerns.push(
      `${criticalBreaches} high or critical severity CCTV data breach${criticalBreaches !== 1 ? "es" : ""} recorded — serious data protection incidents involving surveillance footage require urgent investigation and remediation.`,
    );
  }

  if (reviewOverdueRate >= 30 && totalPolicyRecords > 0) {
    concerns.push(
      `${reviewOverdueRate}% of CCTV policies have overdue reviews — out-of-date policies may not reflect current surveillance arrangements, camera placements, or regulatory requirements.`,
    );
  } else if (reviewOverdueRate >= 15 && reviewOverdueRate < 30 && totalPolicyRecords > 0) {
    concerns.push(
      `${reviewOverdueRate}% of CCTV policy reviews are overdue — some policies may not reflect current surveillance practice.`,
    );
  }

  if (piaOverdueRate >= 30 && totalPrivacyImpactRecords > 0) {
    concerns.push(
      `${piaOverdueRate}% of privacy impact assessments have overdue reviews — camera placements may no longer be justified or proportionate without regular reassessment.`,
    );
  } else if (piaOverdueRate >= 15 && piaOverdueRate < 30 && totalPrivacyImpactRecords > 0) {
    concerns.push(
      `${piaOverdueRate}% of privacy impact assessment reviews are overdue — some camera placements may need reassessment.`,
    );
  }

  if (auditOverdueRate >= 30 && totalRetentionRecords > 0) {
    concerns.push(
      `${auditOverdueRate}% of footage retention audits are overdue — without regular auditing, the home cannot be confident that footage is being managed within policy.`,
    );
  }

  if (childAwarenessCoverage < 50 && total_children > 0 && totalChildAwarenessRecords > 0) {
    concerns.push(
      `Only ${childAwarenessCoverage}% of children have been fully informed about CCTV locations and rights — many children may be unaware of surveillance in their living environment.`,
    );
  }

  if (authorisedAccessRate < 80 && totalAccessCount > 0) {
    concerns.push(
      `Only ${authorisedAccessRate}% of footage access events were authorised — unauthorised access to CCTV recordings is a serious data protection concern.`,
    );
  }

  if (objectionsRaised > 0 && objectionsAddressedRate < 50) {
    concerns.push(
      `Only ${objectionsAddressedRate}% of child objections to surveillance have been addressed — children's concerns about privacy are not being taken seriously.`,
    );
  }

  if (totalChildAwarenessRecords === 0 && total_children > 0 && !allEmpty) {
    concerns.push(
      "No child awareness records despite children being on placement and CCTV being in use — children may not know about surveillance, their rights, or how to raise concerns.",
    );
  }

  if (totalPrivacyImpactRecords === 0 && totalRetentionRecords > 0) {
    concerns.push(
      "No privacy impact assessments despite footage retention records existing — cameras may be in use without proper justification or proportionality assessment.",
    );
  }

  if (sharedWithPlacingAuthRate < 50 && totalPolicyRecords > 0) {
    concerns.push(
      `Only ${sharedWithPlacingAuthRate}% of CCTV policies shared with placing authorities — placing authorities may be unaware of the surveillance arrangements affecting the children they have placed.`,
    );
  }

  if (childrenConsultedRate < 50 && totalPrivacyImpactRecords > 0) {
    concerns.push(
      `Children consulted in only ${childrenConsultedRate}% of privacy impact assessments — the voice of the child is not being adequately captured in decisions about surveillance that directly affects them.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: CctvGovernanceRecommendation[] = [];
  let rank = 0;

  if (below(policyComplianceRate, 40) && totalPolicyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and update all CCTV policies — ensure each policy is formally approved, ICO-compliant, covers children's and staff rights, notification of visitors, and is signed by the registered manager.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (below(privacyImpactRate, 40) && totalPrivacyImpactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete privacy impact assessments for every camera — each assessment must document justification, proportionality, consideration of less intrusive alternatives, risk mitigations, and DPO approval before any camera operates.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (below(retentionComplianceRate, 40) && totalRetentionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement proper footage retention controls — enable auto-deletion within policy timeframes, maintain deletion and access logs, encrypt all stored footage, and schedule regular retention audits.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (below(childAwarenessRate, 30) && totalChildAwarenessRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every child is fully informed about CCTV surveillance — provide age-appropriate explanations of camera locations, purposes, their privacy rights, and how to raise objections or complaints.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (totalChildAwarenessRecords === 0 && total_children > 0 && !allEmpty) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish child awareness processes for CCTV surveillance — include surveillance briefing in placement induction, hold regular discussions about CCTV, record children's views, and ensure every child understands their privacy rights.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (below(dataProtectionRate, 40) && totalDataProtectionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently address data protection gaps for CCTV — ensure ICO registration is current, encryption is in place for all footage, access controls are adequate, and data sharing agreements are up to date.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (criticalBreaches > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all high and critical severity CCTV data breaches — establish root causes, implement corrective actions, ensure ICO notification within 72 hours for reportable breaches, and review access controls to prevent recurrence.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (authorisedAccessRate < 80 && totalAccessCount > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen CCTV footage access controls — implement a formal authorisation process for all footage viewing, maintain access logs, and audit access records regularly to eliminate unauthorised viewing.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (totalPrivacyImpactRecords === 0 && totalRetentionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete privacy impact assessments for all operating cameras — each camera must have a documented justification, proportionality assessment, and consideration of less intrusive alternatives before continued use.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (below(staffTrainingRate, 50) && totalDataProtectionRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Provide comprehensive CCTV and data protection training to all staff — staff must understand access authorisation procedures, children's privacy rights, data protection obligations, and their role in surveillance governance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Staff training",
    });
  }

  if (
    meets(policyComplianceRate, 40) &&
    below(policyComplianceRate, 70) &&
    totalPolicyRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and strengthen CCTV policies to improve compliance to at least 70% — focus on areas where policies lack ICO compliance, children's rights coverage, or registered manager sign-off.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (
    meets(privacyImpactRate, 40) &&
    below(privacyImpactRate, 70) &&
    totalPrivacyImpactRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Complete and improve privacy impact assessments — ensure justification, proportionality, and DPO approval are documented for all camera placements to evidence lawful surveillance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (
    meets(retentionComplianceRate, 40) &&
    below(retentionComplianceRate, 70) &&
    totalRetentionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve footage retention management — ensure auto-deletion, deletion logs, access logs, and encryption are enabled across all cameras to meet data protection standards.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (
    meets(childAwarenessRate, 30) &&
    below(childAwarenessRate, 70) &&
    totalChildAwarenessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve child CCTV awareness processes — ensure all conversations are age-appropriate, cover camera locations, purposes, rights, and complaint processes, and are properly documented.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Safety and protection",
    });
  }

  if (childrenConsultedRate < 50 && totalPrivacyImpactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Include children's views in privacy impact assessments — consult children when assessing camera placements in their living environment to respect their voice and agency regarding surveillance that affects them.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Voice of the child",
    });
  }

  if (reviewOverdueRate >= 15 && totalPolicyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all CCTV policy reviews up to date — overdue reviews mean policies may not reflect current surveillance arrangements, technology changes, or regulatory requirements.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (piaOverdueRate >= 15 && totalPrivacyImpactRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Bring all privacy impact assessment reviews up to date — camera placements that have not been reassessed may no longer be justified or proportionate to current risks.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (sharedWithPlacingAuthRate < 50 && totalPolicyRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Share CCTV policies and surveillance arrangements with placing authorities — they need to understand the surveillance environment in which the children they have placed are living.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (
    childAwarenessCoverage < 80 &&
    childAwarenessCoverage >= 50 &&
    total_children > 0 &&
    totalChildAwarenessRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend CCTV awareness coverage to reach all children — identify children who have not been fully informed and provide tailored, age-appropriate briefings about surveillance in their living environment.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  if (
    meets(dataProtectionRate, 40) &&
    below(dataProtectionRate, 70) &&
    totalDataProtectionRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen CCTV data protection governance — review ICO registration, encryption, access controls, and data sharing agreements to ensure comprehensive compliance.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 21 — Privacy and dignity",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: CctvGovernanceInsight[] = [];

  // -- Critical insights --

  if (below(policyComplianceRate, 40) && totalPolicyRecords > 0) {
    insights.push({
      text: `Only ${policyComplianceRate}% CCTV policy compliance. Inadequate surveillance policies mean the home cannot demonstrate that CCTV use is governed, lawful, and respects children's privacy rights under Regulation 21. This is a fundamental governance failure requiring urgent remediation.`,
      severity: "critical",
    });
  }

  if (below(privacyImpactRate, 40) && totalPrivacyImpactRecords > 0) {
    insights.push({
      text: `Only ${privacyImpactRate}% privacy impact assessment compliance. Without proper justification, proportionality assessment, and DPO approval for camera placements, the home's surveillance may be unlawful and disproportionately intrusive to children's privacy.`,
      severity: "critical",
    });
  }

  if (below(retentionComplianceRate, 40) && totalRetentionRecords > 0) {
    insights.push({
      text: `Only ${retentionComplianceRate}% footage retention compliance. Footage not managed within policy, without auto-deletion or encryption, creates serious data protection risks and potential for misuse of children's recorded images.`,
      severity: "critical",
    });
  }

  if (below(childAwarenessRate, 30) && totalChildAwarenessRecords > 0) {
    insights.push({
      text: `Child awareness of CCTV at only ${childAwarenessRate}%. Children living under surveillance without understanding its purpose, their rights, or how to complain is incompatible with their right to privacy and dignity under Regulation 21 and represents a failure to respect their voice.`,
      severity: "critical",
    });
  }

  if (criticalBreaches > 0) {
    insights.push({
      text: `${criticalBreaches} high or critical severity CCTV data breach${criticalBreaches !== 1 ? "es" : ""} recorded. Serious breaches of surveillance data involving children are safeguarding concerns as well as data protection failures. Ofsted and the ICO must be confident that footage of children is handled with the highest standards of security.`,
      severity: "critical",
    });
  }

  if (totalChildAwarenessRecords === 0 && total_children > 0 && !allEmpty) {
    insights.push({
      text: "No child awareness records exist despite children being on placement and surveillance infrastructure in place. Children have a right under Regulation 21 to understand how they are being monitored and to have their views heard. The absence of any awareness records is a significant governance gap.",
      severity: "critical",
    });
  }

  if (authorisedAccessRate < 70 && totalAccessCount > 0) {
    insights.push({
      text: `Only ${authorisedAccessRate}% of footage access was authorised. Unauthorised access to CCTV recordings of children is a serious data protection breach and potential safeguarding concern. Immediate action is needed to secure access controls.`,
      severity: "critical",
    });
  }

  if (totalPrivacyImpactRecords === 0 && totalRetentionRecords > 0) {
    insights.push({
      text: "Cameras are recording footage without any privacy impact assessments. Every camera placement in a children's home must be individually justified and assessed for proportionality. Operating cameras without PIAs may render the surveillance unlawful.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    meets(policyComplianceRate, 40) &&
    below(policyComplianceRate, 70) &&
    totalPolicyRecords > 0
  ) {
    insights.push({
      text: `CCTV policy compliance at ${policyComplianceRate}% — while some governance is in place, gaps in policy approval, ICO compliance, or children's rights coverage weaken the home's ability to evidence lawful and proportionate surveillance.`,
      severity: "warning",
    });
  }

  if (
    meets(privacyImpactRate, 40) &&
    below(privacyImpactRate, 70) &&
    totalPrivacyImpactRecords > 0
  ) {
    insights.push({
      text: `Privacy impact assessment rate at ${privacyImpactRate}% — some camera placements lack full documentation of justification, proportionality, or DPO approval. All cameras must have completed PIAs to evidence lawful surveillance.`,
      severity: "warning",
    });
  }

  if (
    meets(retentionComplianceRate, 40) &&
    below(retentionComplianceRate, 70) &&
    totalRetentionRecords > 0
  ) {
    insights.push({
      text: `Footage retention compliance at ${retentionComplianceRate}% — inconsistencies in retention management, auto-deletion, logging, or encryption across cameras create varying levels of data protection risk.`,
      severity: "warning",
    });
  }

  if (
    meets(childAwarenessRate, 30) &&
    below(childAwarenessRate, 70) &&
    totalChildAwarenessRecords > 0
  ) {
    insights.push({
      text: `Child CCTV awareness at ${childAwarenessRate}% — some children are informed but gaps remain in ensuring all children understand camera locations, purposes, and their rights. Incomplete awareness undermines children's dignity and agency.`,
      severity: "warning",
    });
  }

  if (
    meets(dataProtectionRate, 40) &&
    below(dataProtectionRate, 70) &&
    totalDataProtectionRecords > 0
  ) {
    insights.push({
      text: `Data protection compliance at ${dataProtectionRate}% — while some controls are in place, inconsistent encryption, access controls, or ICO registration creates compliance risks for CCTV data governance.`,
      severity: "warning",
    });
  }

  if (
    meets(staffTrainingRate, 50) &&
    below(staffTrainingRate, 70) &&
    totalDataProtectionRecords > 0
  ) {
    insights.push({
      text: `Staff CCTV training at ${staffTrainingRate}% — not all staff are trained on surveillance governance and data protection. Untrained staff may inadvertently breach children's privacy or access footage without authorisation.`,
      severity: "warning",
    });
  }

  if (
    reviewOverdueRate >= 15 &&
    reviewOverdueRate < 30 &&
    totalPolicyRecords > 0
  ) {
    insights.push({
      text: `${reviewOverdueRate}% of CCTV policy reviews are overdue — policies may not reflect current surveillance arrangements or regulatory changes. Regular review is essential to maintain governance standards.`,
      severity: "warning",
    });
  }

  if (
    piaOverdueRate >= 15 &&
    piaOverdueRate < 30 &&
    totalPrivacyImpactRecords > 0
  ) {
    insights.push({
      text: `${piaOverdueRate}% of privacy impact assessment reviews are overdue — camera placements should be regularly reassessed to confirm they remain justified and proportionate to current risks.`,
      severity: "warning",
    });
  }

  if (
    childrenConsultedRate >= 30 &&
    childrenConsultedRate < 50 &&
    totalPrivacyImpactRecords > 0
  ) {
    insights.push({
      text: `Children consulted in only ${childrenConsultedRate}% of privacy impact assessments — while some consultation occurs, children's views should be captured consistently when decisions about surveillance in their living environment are made.`,
      severity: "warning",
    });
  }

  if (
    authorisedAccessRate >= 70 &&
    authorisedAccessRate < 95 &&
    totalAccessCount > 0
  ) {
    insights.push({
      text: `${authorisedAccessRate}% authorised footage access — while most access is authorised, any unauthorised access to CCTV footage of children is concerning and access controls should be strengthened.`,
      severity: "warning",
    });
  }

  if (breachRate > 0 && criticalBreaches === 0 && breachRecords > 0) {
    insights.push({
      text: `${breachRate}% of data protection records involve breaches. While none are high or critical severity, any data breach involving children's surveillance footage requires thorough investigation and remediation to prevent escalation.`,
      severity: "warning",
    });
  }

  // Identify camera location coverage gaps
  const assessedLocations = new Set(privacy_impact_records.map((p) => p.camera_location));
  const allRetentionLocations = footage_retention_records.map((r) => r.camera_location);
  const uniqueLocationArr = allRetentionLocations.filter(
    (loc, idx) => allRetentionLocations.indexOf(loc) === idx,
  );
  const unassessedLocations = uniqueLocationArr.filter((loc) => !assessedLocations.has(loc));
  if (unassessedLocations.length > 0 && totalPrivacyImpactRecords > 0) {
    insights.push({
      text: `${unassessedLocations.length} camera location${unassessedLocations.length !== 1 ? "s" : ""} found in retention records without matching privacy impact assessments — cameras in ${unassessedLocations.slice(0, 3).join(", ")}${unassessedLocations.length > 3 ? " and others" : ""} may be operating without proper justification.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (cctv_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding CCTV and surveillance governance — policies are comprehensive and ICO-compliant, every camera has a justified and proportionate privacy impact assessment, footage is managed securely within retention policies, children are fully aware of surveillance and their rights, and data protection compliance is robust. This exemplary approach protects children's privacy while maintaining safety.",
      severity: "positive",
    });
  }

  if (
    meets(policyComplianceRate, 90) &&
    icoComplianceRate >= 100 &&
    totalPolicyRecords > 0
  ) {
    insights.push({
      text: `${policyComplianceRate}% policy compliance with full ICO alignment — the home's CCTV governance framework demonstrates exemplary compliance that would withstand regulatory scrutiny from both Ofsted and the ICO.`,
      severity: "positive",
    });
  }

  if (
    meets(privacyImpactRate, 90) &&
    alternativesConsideredRate >= 100 &&
    totalPrivacyImpactRecords > 0
  ) {
    insights.push({
      text: `${privacyImpactRate}% PIA compliance with less intrusive alternatives considered for every camera — the home can evidence that surveillance is genuinely proportionate and used only where necessary, respecting children's right to the least intrusive monitoring possible.`,
      severity: "positive",
    });
  }

  if (
    meets(retentionComplianceRate, 90) &&
    encryptionRate >= 100 &&
    totalRetentionRecords > 0
  ) {
    insights.push({
      text: `${retentionComplianceRate}% retention compliance with full encryption — footage is managed securely within policy, with strong technical controls protecting children's recorded images from unauthorised access.`,
      severity: "positive",
    });
  }

  if (
    meets(childAwarenessRate, 90) &&
    totalChildAwarenessRecords > 0
  ) {
    insights.push({
      text: `${childAwarenessRate}% child awareness of CCTV — children are fully informed about surveillance in their living environment, understand their rights, and know how to raise concerns. This demonstrates genuine respect for children's privacy and dignity under Regulation 21.`,
      severity: "positive",
    });
  }

  if (
    childAwarenessCoverage >= 100 &&
    total_children > 0 &&
    totalChildAwarenessRecords > 0
  ) {
    insights.push({
      text: "Every child has been briefed on CCTV locations and their surveillance rights — the home ensures universal coverage of privacy awareness as part of its commitment to children's dignity and participation.",
      severity: "positive",
    });
  }

  if (
    meets(dataProtectionRate, 90) &&
    breachRate === 0 &&
    totalDataProtectionRecords > 0
  ) {
    insights.push({
      text: `${dataProtectionRate}% data protection compliance with zero breaches — the home's CCTV data governance is robust, effectively preventing unauthorised disclosure and maintaining the security of children's surveillance data.`,
      severity: "positive",
    });
  }

  if (
    meets(staffTrainingRate, 90) &&
    totalDataProtectionRecords > 0
  ) {
    insights.push({
      text: `${staffTrainingRate}% staff training rate — staff are well-equipped to handle CCTV governance responsibilities, understand children's privacy rights, and follow proper access procedures.`,
      severity: "positive",
    });
  }

  if (
    objectionsRaised > 0 &&
    objectionsAddressedRate >= 100
  ) {
    insights.push({
      text: "All child objections to surveillance have been addressed — this demonstrates that the home genuinely respects children's agency and privacy concerns, taking their views seriously when making decisions about CCTV in their living environment.",
      severity: "positive",
    });
  }

  if (
    sarFulfilmentRate >= 100 &&
    totalSarRequests > 0
  ) {
    insights.push({
      text: "All subject access requests for CCTV footage have been fulfilled — the home meets its legal obligations promptly and demonstrates transparency in how surveillance footage is managed.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (cctv_rating === "outstanding") {
    headline =
      "Outstanding CCTV and surveillance governance — policies are comprehensive, privacy impact assessments are thorough, footage is securely managed, children are fully informed of their rights, and data protection compliance is exemplary.";
  } else if (cctv_rating === "good") {
    headline = `Good CCTV and surveillance governance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (cctv_rating === "adequate") {
    headline = `Adequate CCTV and surveillance governance — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure lawful, proportionate, and privacy-respecting surveillance.`;
  } else {
    headline = `CCTV and surveillance governance is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure surveillance is lawful, proportionate, and respects children's privacy and dignity.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    cctv_rating,
    cctv_score: score,
    headline,
    total_policy_records: totalPolicyRecords,
    total_privacy_impact_records: totalPrivacyImpactRecords,
    total_retention_records: totalRetentionRecords,
    total_child_awareness_records: totalChildAwarenessRecords,
    total_data_protection_records: totalDataProtectionRecords,
    policy_compliance_rate: policyComplianceRate,
    privacy_impact_rate: privacyImpactRate,
    retention_compliance_rate: retentionComplianceRate,
    child_awareness_rate: childAwarenessRate,
    data_protection_rate: dataProtectionRate,
    staff_training_rate: staffTrainingRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
