// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME VISITOR MANAGEMENT & SECURITY INTELLIGENCE ENGINE
// Monitors visitor registration compliance, DBS check verification,
// ID verification, safeguarding protocol adherence, visitor log completeness,
// and escort compliance across the children's home.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 22 (Review of premises), Reg 32 (Fitness of premises),
// Reg 33 (Environmental Safety), Reg 34 (Safeguarding children).
// SCCIF: "Safety of the child", "Leadership and management".
// Store keys: visitorRegistrationRecords, dbsCheckRecords,
//             idVerificationRecords, safeguardingProtocolRecords,
//             visitorLogRecords
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface VisitorRegistrationRecordInput {
  id: string;
  visitor_name: string;
  visitor_type: "professional" | "family" | "contractor" | "inspector" | "volunteer" | "other";
  visit_date: string;
  pre_registered: boolean;
  registration_complete: boolean;
  purpose_recorded: boolean;
  host_staff_assigned: boolean;
  host_staff_name: string | null;
  approved_by: string | null;
  approval_date: string | null;
  visit_duration_minutes: number | null;
  child_ids_involved: string[];
  created_at: string;
}

export interface DbsCheckRecordInput {
  id: string;
  visitor_name: string;
  visitor_type: "professional" | "family" | "contractor" | "inspector" | "volunteer" | "other";
  dbs_required: boolean;
  dbs_verified: boolean;
  dbs_certificate_number: string | null;
  dbs_level: "basic" | "standard" | "enhanced" | "enhanced_barred" | null;
  dbs_check_date: string | null;
  dbs_expiry_date: string | null;
  dbs_expired: boolean;
  verified_by: string | null;
  verified_date: string | null;
  exemption_reason: string | null;
  created_at: string;
}

export interface IdVerificationRecordInput {
  id: string;
  visitor_name: string;
  visit_date: string;
  id_requested: boolean;
  id_provided: boolean;
  id_type: "photo_id" | "driving_licence" | "passport" | "professional_id" | "other" | null;
  id_verified: boolean;
  verified_by: string | null;
  photo_match_confirmed: boolean;
  refusal_action_taken: string | null;
  created_at: string;
}

export interface SafeguardingProtocolRecordInput {
  id: string;
  visit_date: string;
  visitor_name: string;
  visitor_type: "professional" | "family" | "contractor" | "inspector" | "volunteer" | "other";
  safeguarding_briefing_given: boolean;
  emergency_procedures_shared: boolean;
  confidentiality_agreement_signed: boolean;
  prohibited_areas_communicated: boolean;
  child_protection_policy_acknowledged: boolean;
  lone_access_permitted: boolean;
  lone_access_risk_assessed: boolean;
  escort_required: boolean;
  escort_provided: boolean;
  escort_staff_name: string | null;
  incident_during_visit: boolean;
  incident_details: string | null;
  created_at: string;
}

export interface VisitorLogRecordInput {
  id: string;
  visitor_name: string;
  visit_date: string;
  sign_in_time: string | null;
  sign_out_time: string | null;
  sign_in_recorded: boolean;
  sign_out_recorded: boolean;
  badge_issued: boolean;
  badge_returned: boolean;
  vehicle_registration_recorded: boolean;
  belongings_checked: boolean;
  departure_confirmed: boolean;
  log_reviewed_by: string | null;
  log_review_date: string | null;
  created_at: string;
}

export interface VisitorManagementSecurityInput {
  today: string;
  total_children: number;
  visitor_registration_records: VisitorRegistrationRecordInput[];
  dbs_check_records: DbsCheckRecordInput[];
  id_verification_records: IdVerificationRecordInput[];
  safeguarding_protocol_records: SafeguardingProtocolRecordInput[];
  visitor_log_records: VisitorLogRecordInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type VisitorSecurityRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface VisitorSecurityInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface VisitorSecurityRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface VisitorManagementSecurityResult {
  visitor_rating: VisitorSecurityRating;
  visitor_score: number;
  headline: string;
  total_visits: number;
  registration_compliance_rate: number;
  dbs_verification_rate: number;
  id_check_rate: number;
  safeguarding_adherence_rate: number;
  log_completeness_rate: number;
  escort_compliance_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: VisitorSecurityRecommendation[];
  insights: VisitorSecurityInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): VisitorSecurityRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: VisitorSecurityRating,
  score: number,
  headline: string,
): VisitorManagementSecurityResult {
  return {
    visitor_rating: rating,
    visitor_score: score,
    headline,
    total_visits: 0,
    registration_compliance_rate: 0,
    dbs_verification_rate: 0,
    id_check_rate: 0,
    safeguarding_adherence_rate: 0,
    log_completeness_rate: 0,
    escort_compliance_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeVisitorManagementSecurity(
  input: VisitorManagementSecurityInput,
): VisitorManagementSecurityResult {
  const {
    total_children,
    visitor_registration_records,
    dbs_check_records,
    id_verification_records,
    safeguarding_protocol_records,
    visitor_log_records,
  } = input;

  // ── Special case: all empty + 0 children -> insufficient_data ──────────
  const allEmpty =
    visitor_registration_records.length === 0 &&
    dbs_check_records.length === 0 &&
    id_verification_records.length === 0 &&
    safeguarding_protocol_records.length === 0 &&
    visitor_log_records.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement -- insufficient data to assess visitor management and security intelligence.",
    );
  }

  // ── Special case: all empty + children > 0 -> inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No visitor management or security data recorded despite children on placement -- visitor management and security protocols require urgent attention.",
      ),
      concerns: [
        "No visitor registration, DBS check, ID verification, safeguarding protocol, or visitor log records exist despite children being on placement -- the home cannot evidence safe visitor management or security controls.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Implement structured recording of visitor registration, DBS verification, ID checks, safeguarding briefings, and visitor sign-in/sign-out logs to evidence safe visitor management practices.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all visitors are subject to appropriate DBS and identity checks before gaining access to the home, with full records maintained for audit and inspection purposes.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 32 -- Fitness of premises",
        },
      ],
      insights: [
        {
          text: "The complete absence of visitor management and security records means Ofsted cannot verify that children are protected from unsuitable visitors, that DBS checks are completed, or that safeguarding protocols are followed during visits. This represents a fundamental gap in Reg 34 compliance.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Registration compliance ---
  const totalRegistrations = visitor_registration_records.length;

  const compliantRegistrations = visitor_registration_records.filter(
    (r) =>
      r.registration_complete &&
      r.purpose_recorded &&
      r.host_staff_assigned,
  ).length;
  const registrationComplianceRate = pct(compliantRegistrations, totalRegistrations);

  const preRegisteredVisitors = visitor_registration_records.filter(
    (r) => r.pre_registered,
  ).length;
  const preRegistrationRate = pct(preRegisteredVisitors, totalRegistrations);

  const approvedVisitors = visitor_registration_records.filter(
    (r) => r.approved_by !== null && r.approved_by !== "",
  ).length;
  const approvalRate = pct(approvedVisitors, totalRegistrations);

  // --- DBS verification ---
  const dbsRequired = dbs_check_records.filter((d) => d.dbs_required);
  const totalDbsRequired = dbsRequired.length;

  const dbsVerified = dbsRequired.filter((d) => d.dbs_verified && !d.dbs_expired).length;
  const dbsVerificationRate = pct(dbsVerified, totalDbsRequired);

  const dbsExpired = dbs_check_records.filter(
    (d) => d.dbs_required && d.dbs_expired,
  ).length;
  const dbsExpiredRate = pct(dbsExpired, totalDbsRequired);

  const enhancedDbs = dbs_check_records.filter(
    (d) =>
      d.dbs_required &&
      d.dbs_verified &&
      (d.dbs_level === "enhanced" || d.dbs_level === "enhanced_barred"),
  ).length;
  const enhancedDbsRate = pct(enhancedDbs, totalDbsRequired);

  // --- ID verification ---
  const totalIdChecks = id_verification_records.length;

  const idVerified = id_verification_records.filter(
    (v) => v.id_requested && v.id_provided && v.id_verified,
  ).length;
  const idCheckRate = pct(idVerified, totalIdChecks);

  const photoMatchConfirmed = id_verification_records.filter(
    (v) => v.photo_match_confirmed,
  ).length;
  const photoMatchRate = pct(photoMatchConfirmed, totalIdChecks);

  const idRefusals = id_verification_records.filter(
    (v) => v.id_requested && !v.id_provided,
  ).length;
  const idRefusalRate = pct(idRefusals, totalIdChecks);

  const refusalActioned = id_verification_records.filter(
    (v) =>
      v.id_requested &&
      !v.id_provided &&
      v.refusal_action_taken !== null &&
      v.refusal_action_taken !== "",
  ).length;

  // --- Safeguarding protocol adherence ---
  const totalSafeguardingRecords = safeguarding_protocol_records.length;

  const safeguardingCompliant = safeguarding_protocol_records.filter(
    (s) =>
      s.safeguarding_briefing_given &&
      s.confidentiality_agreement_signed &&
      s.child_protection_policy_acknowledged,
  ).length;
  const safeguardingAdherenceRate = pct(safeguardingCompliant, totalSafeguardingRecords);

  const emergencyProceduresShared = safeguarding_protocol_records.filter(
    (s) => s.emergency_procedures_shared,
  ).length;
  const emergencyProceduresRate = pct(emergencyProceduresShared, totalSafeguardingRecords);

  const prohibitedAreasCommunicated = safeguarding_protocol_records.filter(
    (s) => s.prohibited_areas_communicated,
  ).length;
  const prohibitedAreasRate = pct(prohibitedAreasCommunicated, totalSafeguardingRecords);

  const loneAccessVisits = safeguarding_protocol_records.filter(
    (s) => s.lone_access_permitted,
  );
  const loneAccessRiskAssessed = loneAccessVisits.filter(
    (s) => s.lone_access_risk_assessed,
  ).length;
  const loneAccessAssessmentRate = pct(loneAccessRiskAssessed, loneAccessVisits.length);

  const incidentsDuringVisits = safeguarding_protocol_records.filter(
    (s) => s.incident_during_visit,
  ).length;

  // --- Escort compliance ---
  const escortRequired = safeguarding_protocol_records.filter(
    (s) => s.escort_required,
  );
  const totalEscortRequired = escortRequired.length;

  const escortProvided = escortRequired.filter(
    (s) => s.escort_provided,
  ).length;
  const escortComplianceRate = pct(escortProvided, totalEscortRequired);

  // --- Visitor log completeness ---
  const totalLogRecords = visitor_log_records.length;

  const completeLogEntries = visitor_log_records.filter(
    (l) =>
      l.sign_in_recorded &&
      l.sign_out_recorded &&
      l.badge_issued &&
      l.departure_confirmed,
  ).length;
  const logCompletenessRate = pct(completeLogEntries, totalLogRecords);

  const signInRecorded = visitor_log_records.filter((l) => l.sign_in_recorded).length;
  const signOutRecorded = visitor_log_records.filter((l) => l.sign_out_recorded).length;
  const signInRate = pct(signInRecorded, totalLogRecords);
  const signOutRate = pct(signOutRecorded, totalLogRecords);

  const badgesIssued = visitor_log_records.filter((l) => l.badge_issued).length;
  const badgeIssuedRate = pct(badgesIssued, totalLogRecords);

  const badgesReturned = visitor_log_records.filter(
    (l) => l.badge_issued && l.badge_returned,
  ).length;
  const badgeReturnRate = pct(badgesReturned, badgesIssued);

  const logsReviewed = visitor_log_records.filter(
    (l) => l.log_reviewed_by !== null && l.log_reviewed_by !== "",
  ).length;
  const logReviewRate = pct(logsReviewed, totalLogRecords);

  const departureConfirmed = visitor_log_records.filter(
    (l) => l.departure_confirmed,
  ).length;
  const departureConfirmationRate = pct(departureConfirmed, totalLogRecords);

  // Total visits is the maximum count across all record types
  const totalVisits = Math.max(
    totalRegistrations,
    totalIdChecks,
    totalLogRecords,
    totalSafeguardingRecords,
  );

  // ── Scoring: base 52 ─────────────────────────────────────────────────

  let score = 52;

  // --- Bonus 1: registrationComplianceRate (>=95: +4, >=80: +2) ---
  if (registrationComplianceRate >= 95) score += 4;
  else if (registrationComplianceRate >= 80) score += 2;

  // --- Bonus 2: dbsVerificationRate (>=100: +4, >=85: +2) ---
  if (dbsVerificationRate >= 100) score += 4;
  else if (dbsVerificationRate >= 85) score += 2;

  // --- Bonus 3: idCheckRate (>=95: +3, >=80: +1) ---
  if (idCheckRate >= 95) score += 3;
  else if (idCheckRate >= 80) score += 1;

  // --- Bonus 4: safeguardingAdherenceRate (>=95: +4, >=80: +2) ---
  if (safeguardingAdherenceRate >= 95) score += 4;
  else if (safeguardingAdherenceRate >= 80) score += 2;

  // --- Bonus 5: logCompletenessRate (>=95: +3, >=80: +1) ---
  if (logCompletenessRate >= 95) score += 3;
  else if (logCompletenessRate >= 80) score += 1;

  // --- Bonus 6: escortComplianceRate (>=100: +3, >=85: +1) ---
  if (escortComplianceRate >= 100 && totalEscortRequired > 0) score += 3;
  else if (escortComplianceRate >= 85 && totalEscortRequired > 0) score += 1;

  // --- Bonus 7: preRegistrationRate (>=90: +2, >=70: +1) ---
  if (preRegistrationRate >= 90 && totalRegistrations > 0) score += 2;
  else if (preRegistrationRate >= 70 && totalRegistrations > 0) score += 1;

  // --- Bonus 8: logReviewRate (>=90: +3, >=70: +1) ---
  if (logReviewRate >= 90 && totalLogRecords > 0) score += 3;
  else if (logReviewRate >= 70 && totalLogRecords > 0) score += 1;

  // --- Bonus 9: loneAccessAssessmentRate (>=100: +2, >=80: +1) ---
  if (loneAccessAssessmentRate >= 100 && loneAccessVisits.length > 0) score += 2;
  else if (loneAccessAssessmentRate >= 80 && loneAccessVisits.length > 0) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: dbsVerificationRate < 50 -> -6 (guarded)
  if (dbsVerificationRate < 50 && totalDbsRequired > 0) score -= 6;

  // Penalty 2: registrationComplianceRate < 50 -> -5 (guarded)
  if (registrationComplianceRate < 50 && totalRegistrations > 0) score -= 5;

  // Penalty 3: safeguardingAdherenceRate < 50 -> -5 (guarded)
  if (safeguardingAdherenceRate < 50 && totalSafeguardingRecords > 0) score -= 5;

  // Penalty 4: escortComplianceRate < 50 -> -4 (guarded)
  if (escortComplianceRate < 50 && totalEscortRequired > 0) score -= 4;

  score = clamp(score, 0, 100);

  const visitor_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (registrationComplianceRate >= 95 && totalRegistrations > 0) {
    strengths.push(
      "Visitor registration compliance is exemplary -- virtually all visitors are fully registered with purpose recorded and host staff assigned before access is granted.",
    );
  } else if (registrationComplianceRate >= 80 && totalRegistrations > 0) {
    strengths.push(
      `${registrationComplianceRate}% registration compliance rate -- the home maintains strong visitor registration practices with purpose and host staff consistently documented.`,
    );
  }

  if (dbsVerificationRate >= 100 && totalDbsRequired > 0) {
    strengths.push(
      "Every visitor requiring a DBS check has been verified with a current, valid certificate -- the home maintains robust safeguarding checks for all relevant visitors.",
    );
  } else if (dbsVerificationRate >= 85 && totalDbsRequired > 0) {
    strengths.push(
      `${dbsVerificationRate}% DBS verification rate -- the home ensures the vast majority of visitors requiring DBS checks are properly verified before access.`,
    );
  }

  if (idCheckRate >= 95 && totalIdChecks > 0) {
    strengths.push(
      "ID verification is near-comprehensive -- virtually every visitor has their identity confirmed before entering the home, providing robust security for children.",
    );
  } else if (idCheckRate >= 80 && totalIdChecks > 0) {
    strengths.push(
      `${idCheckRate}% ID verification rate -- the home consistently verifies visitor identity, supporting a secure environment for children.`,
    );
  }

  if (safeguardingAdherenceRate >= 95 && totalSafeguardingRecords > 0) {
    strengths.push(
      "Safeguarding protocol adherence is exemplary -- virtually all visitors receive safeguarding briefings, sign confidentiality agreements, and acknowledge child protection policies.",
    );
  } else if (safeguardingAdherenceRate >= 80 && totalSafeguardingRecords > 0) {
    strengths.push(
      `${safeguardingAdherenceRate}% safeguarding protocol adherence -- the home consistently briefs visitors on safeguarding responsibilities.`,
    );
  }

  if (logCompletenessRate >= 95 && totalLogRecords > 0) {
    strengths.push(
      "Visitor log completeness is exemplary -- sign-in, sign-out, badge issuance, and departure confirmation are recorded for virtually every visit.",
    );
  } else if (logCompletenessRate >= 80 && totalLogRecords > 0) {
    strengths.push(
      `${logCompletenessRate}% visitor log completeness -- the home maintains detailed records of visitor movements, supporting accountability and audit readiness.`,
    );
  }

  if (escortComplianceRate >= 100 && totalEscortRequired > 0) {
    strengths.push(
      "Every visitor requiring an escort has been escorted -- the home ensures no unaccompanied access where escort protocols apply.",
    );
  } else if (escortComplianceRate >= 85 && totalEscortRequired > 0) {
    strengths.push(
      `${escortComplianceRate}% escort compliance rate -- visitors requiring escorts are consistently accompanied by designated staff.`,
    );
  }

  if (preRegistrationRate >= 90 && totalRegistrations > 0) {
    strengths.push(
      `${preRegistrationRate}% of visitors are pre-registered -- the home proactively manages visitor access by ensuring visits are planned and approved in advance.`,
    );
  } else if (preRegistrationRate >= 70 && totalRegistrations > 0) {
    strengths.push(
      `${preRegistrationRate}% pre-registration rate -- the majority of visitors are registered in advance, supporting planned and safe access.`,
    );
  }

  if (logReviewRate >= 90 && totalLogRecords > 0) {
    strengths.push(
      `${logReviewRate}% of visitor logs reviewed by management -- strong oversight of visitor activity supporting accountability and safeguarding governance.`,
    );
  } else if (logReviewRate >= 70 && totalLogRecords > 0) {
    strengths.push(
      `${logReviewRate}% log review rate -- the majority of visitor logs receive management review, supporting oversight of visitor access.`,
    );
  }

  if (loneAccessAssessmentRate >= 100 && loneAccessVisits.length > 0) {
    strengths.push(
      "Every instance of lone visitor access has been risk assessed -- the home ensures no unsupervised contact without documented risk assessment.",
    );
  } else if (loneAccessAssessmentRate >= 80 && loneAccessVisits.length > 0) {
    strengths.push(
      `${loneAccessAssessmentRate}% of lone access visits risk assessed -- the home generally ensures unsupervised visitor contact is preceded by risk assessment.`,
    );
  }

  if (photoMatchRate >= 90 && totalIdChecks > 0) {
    strengths.push(
      `${photoMatchRate}% photo match confirmation rate -- the home goes beyond basic ID checks to verify visitors match their photographic identification.`,
    );
  }

  if (emergencyProceduresRate >= 90 && totalSafeguardingRecords > 0) {
    strengths.push(
      `${emergencyProceduresRate}% of visitors briefed on emergency procedures -- the home ensures visitors know how to respond in an emergency, supporting children's safety.`,
    );
  }

  if (badgeIssuedRate >= 95 && totalLogRecords > 0) {
    strengths.push(
      `${badgeIssuedRate}% badge issuance rate -- visitors are clearly identifiable within the home, supporting children's ability to distinguish authorised visitors from strangers.`,
    );
  }

  if (incidentsDuringVisits === 0 && totalSafeguardingRecords > 0) {
    strengths.push(
      "No incidents recorded during visitor access -- the home's visitor management protocols are effectively preventing safeguarding incidents related to visits.",
    );
  }

  if (departureConfirmationRate >= 95 && totalLogRecords > 0) {
    strengths.push(
      `${departureConfirmationRate}% departure confirmation rate -- the home verifies that all visitors leave the premises, eliminating the risk of unaccounted visitors remaining on site.`,
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (dbsVerificationRate < 50 && totalDbsRequired > 0) {
    concerns.push(
      `Only ${dbsVerificationRate}% of visitors requiring DBS checks have been verified -- the majority of visitors who should have DBS clearance are accessing the home without confirmed safeguarding checks. This is a critical safeguarding failure.`,
    );
  } else if (dbsVerificationRate < 85 && dbsVerificationRate >= 50 && totalDbsRequired > 0) {
    concerns.push(
      `DBS verification rate at ${dbsVerificationRate}% -- some visitors requiring DBS checks are accessing the home without verified clearance, which represents a safeguarding risk.`,
    );
  }

  if (registrationComplianceRate < 50 && totalRegistrations > 0) {
    concerns.push(
      `Only ${registrationComplianceRate}% of visitor registrations are complete -- the majority of visitors are not fully registered with purpose, host staff assignment, and completion confirmed.`,
    );
  } else if (registrationComplianceRate < 80 && registrationComplianceRate >= 50 && totalRegistrations > 0) {
    concerns.push(
      `Registration compliance at ${registrationComplianceRate}% -- some visitors are not fully registered before accessing the home, weakening accountability and traceability.`,
    );
  }

  if (idCheckRate < 50 && totalIdChecks > 0) {
    concerns.push(
      `Only ${idCheckRate}% of visitors have verified ID -- the home cannot confirm the identity of the majority of visitors, which represents a significant security risk.`,
    );
  } else if (idCheckRate < 80 && idCheckRate >= 50 && totalIdChecks > 0) {
    concerns.push(
      `ID verification rate at ${idCheckRate}% -- some visitors enter the home without confirmed identity, which may compromise children's safety.`,
    );
  }

  if (safeguardingAdherenceRate < 50 && totalSafeguardingRecords > 0) {
    concerns.push(
      `Only ${safeguardingAdherenceRate}% safeguarding protocol adherence -- the majority of visitors are not receiving safeguarding briefings, signing confidentiality agreements, or acknowledging child protection policies before access.`,
    );
  } else if (safeguardingAdherenceRate < 80 && safeguardingAdherenceRate >= 50 && totalSafeguardingRecords > 0) {
    concerns.push(
      `Safeguarding protocol adherence at ${safeguardingAdherenceRate}% -- some visitors are not fully briefed on safeguarding responsibilities before entering the home.`,
    );
  }

  if (logCompletenessRate < 50 && totalLogRecords > 0) {
    concerns.push(
      `Only ${logCompletenessRate}% of visitor logs are complete -- the home cannot account for visitor movements, creating gaps in the audit trail for Ofsted inspection.`,
    );
  } else if (logCompletenessRate < 80 && logCompletenessRate >= 50 && totalLogRecords > 0) {
    concerns.push(
      `Visitor log completeness at ${logCompletenessRate}% -- gaps in sign-in, sign-out, or badge records mean the home cannot fully account for all visitor activity.`,
    );
  }

  if (escortComplianceRate < 50 && totalEscortRequired > 0) {
    concerns.push(
      `Only ${escortComplianceRate}% escort compliance -- the majority of visitors requiring escorts are accessing the home unaccompanied, which is a direct safeguarding risk.`,
    );
  } else if (escortComplianceRate < 85 && escortComplianceRate >= 50 && totalEscortRequired > 0) {
    concerns.push(
      `Escort compliance at ${escortComplianceRate}% -- some visitors requiring escorts are not being accompanied, which may compromise children's safety.`,
    );
  }

  if (dbsExpiredRate > 0 && totalDbsRequired > 0) {
    concerns.push(
      `${dbsExpiredRate}% of DBS checks have expired -- visitors with expired DBS certificates are accessing the home, which undermines safeguarding assurance.`,
    );
  }

  if (signOutRate < 80 && totalLogRecords > 0) {
    concerns.push(
      `Sign-out recording rate at ${signOutRate}% -- the home cannot confirm when all visitors have left the premises, creating accountability gaps.`,
    );
  }

  if (loneAccessAssessmentRate < 80 && loneAccessVisits.length > 0) {
    concerns.push(
      `Only ${loneAccessAssessmentRate}% of lone access visits risk assessed -- visitors with unsupervised contact with children are not consistently subject to documented risk assessment.`,
    );
  }

  if (incidentsDuringVisits > 0) {
    concerns.push(
      `${incidentsDuringVisits} incident${incidentsDuringVisits !== 1 ? "s" : ""} recorded during visitor access -- the home should review visitor management protocols to prevent recurrence and ensure children's safety.`,
    );
  }

  if (idRefusals > 0 && refusalActioned < idRefusals) {
    const unactioned = idRefusals - refusalActioned;
    concerns.push(
      `${unactioned} instance${unactioned !== 1 ? "s" : ""} where visitors refused ID but no action was recorded -- the home must document the response to ID refusals to evidence appropriate safeguarding action.`,
    );
  }

  if (prohibitedAreasRate < 70 && totalSafeguardingRecords > 0) {
    concerns.push(
      `Only ${prohibitedAreasRate}% of visitors informed about prohibited areas -- visitors may inadvertently access sensitive areas of the home without awareness of restrictions.`,
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: VisitorSecurityRecommendation[] = [];
  let rank = 0;

  if (dbsVerificationRate < 50 && totalDbsRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently verify DBS status for all visitors requiring checks before granting access -- no visitor should enter the home without confirmed DBS clearance where required. Implement a DBS verification gateway at point of entry.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (registrationComplianceRate < 50 && totalRegistrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a mandatory visitor registration process requiring purpose of visit, host staff assignment, and management approval before any visitor is granted access to the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 -- Fitness of premises",
    });
  }

  if (safeguardingAdherenceRate < 50 && totalSafeguardingRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enforce safeguarding protocol compliance for all visitors -- every visitor must receive a safeguarding briefing, sign a confidentiality agreement, and acknowledge the child protection policy before entering the home.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (escortComplianceRate < 50 && totalEscortRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all visitors requiring escorts are accompanied at all times -- unescorted access where escorts are required represents a direct risk to children's safety.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (idCheckRate < 50 && totalIdChecks > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement mandatory ID verification for all visitors at the point of entry -- no visitor should be admitted without confirmed identity. Consider photo ID as the minimum standard.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 32 -- Fitness of premises",
    });
  }

  if (logCompletenessRate < 50 && totalLogRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Overhaul the visitor log process to ensure sign-in, sign-out, badge issuance, and departure confirmation are recorded for every visit. An incomplete visitor log is an incomplete audit trail.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 22 -- Review of premises",
    });
  }

  if (dbsExpiredRate > 0 && totalDbsRequired > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and renew all expired DBS certificates -- implement a proactive DBS expiry tracking system to ensure renewals are completed before certificates lapse.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (loneAccessAssessmentRate < 80 && loneAccessVisits.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure every instance of lone visitor access is preceded by a documented risk assessment -- unsupervised contact between visitors and children without risk assessment is a safeguarding risk.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (
    dbsVerificationRate >= 50 &&
    dbsVerificationRate < 85 &&
    totalDbsRequired > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve DBS verification rate to at least 85% -- implement a checklist-based admission process that gates visitor entry on DBS confirmation for relevant visitor types.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (
    registrationComplianceRate >= 50 &&
    registrationComplianceRate < 80 &&
    totalRegistrations > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Strengthen visitor registration processes to achieve at least 80% compliance -- ensure purpose, host staff assignment, and completion are consistently recorded for every visit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32 -- Fitness of premises",
    });
  }

  if (
    safeguardingAdherenceRate >= 50 &&
    safeguardingAdherenceRate < 80 &&
    totalSafeguardingRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve safeguarding protocol adherence to at least 80% -- develop a standardised visitor safeguarding pack to be completed at every visit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (
    idCheckRate >= 50 &&
    idCheckRate < 80 &&
    totalIdChecks > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Extend ID verification to at least 80% coverage -- consider implementing a digital ID check system at the front entrance to streamline verification.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 32 -- Fitness of premises",
    });
  }

  if (
    logCompletenessRate >= 50 &&
    logCompletenessRate < 80 &&
    totalLogRecords > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve visitor log completeness to at least 80% -- consider electronic sign-in/sign-out systems to reduce gaps in visitor movement records.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 22 -- Review of premises",
    });
  }

  if (
    escortComplianceRate >= 50 &&
    escortComplianceRate < 85 &&
    totalEscortRequired > 0
  ) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve escort compliance to at least 85% -- assign specific staff to escort duties and implement a handover process for escort responsibility during shift changes.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  if (logReviewRate < 70 && totalLogRecords > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a management review process for visitor logs -- at least 70% of logs should receive management oversight to ensure accountability and identify patterns.",
      urgency: "planned",
      regulatory_ref: "SCCIF -- Leadership and management",
    });
  }

  if (preRegistrationRate < 70 && totalRegistrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase pre-registration of visitors to at least 70% -- pre-registration allows DBS and ID checks to be completed in advance, reducing delays and improving security.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 32 -- Fitness of premises",
    });
  }

  if (incidentsDuringVisits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review all incidents that occurred during visitor access and implement lessons learned -- consider whether additional visitor management controls are needed to prevent recurrence.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 34 -- Safeguarding children",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: VisitorSecurityInsight[] = [];

  // -- Critical insights --

  if (dbsVerificationRate < 50 && totalDbsRequired > 0) {
    insights.push({
      text: `Only ${dbsVerificationRate}% of visitors requiring DBS checks have been verified. Ofsted will view unverified DBS status as evidence that the home is failing to protect children from potentially unsuitable adults. This is a critical breach of Reg 34 safeguarding requirements.`,
      severity: "critical",
    });
  }

  if (registrationComplianceRate < 50 && totalRegistrations > 0) {
    insights.push({
      text: `Only ${registrationComplianceRate}% of visitor registrations are complete. Without full registration records, the home cannot evidence who visited, why, or who was responsible for their supervision. This fundamentally undermines audit readiness and accountability.`,
      severity: "critical",
    });
  }

  if (safeguardingAdherenceRate < 50 && totalSafeguardingRecords > 0) {
    insights.push({
      text: `Only ${safeguardingAdherenceRate}% safeguarding protocol adherence. Visitors entering the home without safeguarding briefings, confidentiality agreements, or child protection acknowledgements represent a direct risk to children. Ofsted expects every visitor to understand their safeguarding responsibilities.`,
      severity: "critical",
    });
  }

  if (escortComplianceRate < 50 && totalEscortRequired > 0) {
    insights.push({
      text: `Only ${escortComplianceRate}% escort compliance where escorts are required. Unescorted visitors in a children's home where escort protocols exist represents a fundamental safeguarding failure. Children may be exposed to unsupervised contact with adults who should be accompanied.`,
      severity: "critical",
    });
  }

  if (logCompletenessRate < 50 && totalLogRecords > 0) {
    insights.push({
      text: `Only ${logCompletenessRate}% of visitor logs are complete. An incomplete visitor log means the home cannot account for who was on the premises at any given time. In a safeguarding incident, gaps in the visitor log could compromise the investigation and evidence trail.`,
      severity: "critical",
    });
  }

  if (loneAccessAssessmentRate < 50 && loneAccessVisits.length > 0) {
    insights.push({
      text: `Only ${loneAccessAssessmentRate}% of lone access visits are risk assessed. Visitors with unsupervised contact with children without documented risk assessment represent a direct and unmitigated safeguarding risk.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (
    dbsVerificationRate >= 50 &&
    dbsVerificationRate < 85 &&
    totalDbsRequired > 0
  ) {
    insights.push({
      text: `DBS verification rate at ${dbsVerificationRate}% -- improving but not yet comprehensive. Every unverified visitor represents a potential safeguarding gap. Aim for 100% verification where DBS checks are required.`,
      severity: "warning",
    });
  }

  if (
    registrationComplianceRate >= 50 &&
    registrationComplianceRate < 80 &&
    totalRegistrations > 0
  ) {
    insights.push({
      text: `Registration compliance at ${registrationComplianceRate}% -- the home is partially capturing visitor details but gaps remain. Incomplete registrations weaken the accountability framework.`,
      severity: "warning",
    });
  }

  if (
    idCheckRate >= 50 &&
    idCheckRate < 80 &&
    totalIdChecks > 0
  ) {
    insights.push({
      text: `ID verification at ${idCheckRate}% -- some visitors enter without confirmed identity. While the home is verifying the majority, every unverified visitor is a potential security risk.`,
      severity: "warning",
    });
  }

  if (
    safeguardingAdherenceRate >= 50 &&
    safeguardingAdherenceRate < 80 &&
    totalSafeguardingRecords > 0
  ) {
    insights.push({
      text: `Safeguarding adherence at ${safeguardingAdherenceRate}% -- not all visitors receive the full safeguarding protocol. Consistent application is essential to maintain children's safety.`,
      severity: "warning",
    });
  }

  if (
    logCompletenessRate >= 50 &&
    logCompletenessRate < 80 &&
    totalLogRecords > 0
  ) {
    insights.push({
      text: `Visitor log completeness at ${logCompletenessRate}% -- partial logs may satisfy routine operation but will not withstand Ofsted scrutiny. Every gap is a question the home cannot answer about who was on premises.`,
      severity: "warning",
    });
  }

  if (
    escortComplianceRate >= 50 &&
    escortComplianceRate < 85 &&
    totalEscortRequired > 0
  ) {
    insights.push({
      text: `Escort compliance at ${escortComplianceRate}% -- some visitors requiring escorts are not being accompanied. Each gap represents a period where a visitor has unsupervised access to areas of the home.`,
      severity: "warning",
    });
  }

  if (dbsExpiredRate > 0 && totalDbsRequired > 0) {
    insights.push({
      text: `${dbsExpiredRate}% of DBS checks have expired. Expired DBS certificates provide no current safeguarding assurance. The home must treat expired DBS status the same as no DBS check at all until renewed.`,
      severity: "warning",
    });
  }

  if (signOutRate < 80 && signOutRate >= 50 && totalLogRecords > 0) {
    insights.push({
      text: `Sign-out rate at ${signOutRate}% -- the home cannot confirm departure for a significant proportion of visitors. In a safeguarding context, knowing who has left the premises is as important as knowing who entered.`,
      severity: "warning",
    });
  }

  if (incidentsDuringVisits > 0 && incidentsDuringVisits <= 2) {
    insights.push({
      text: `${incidentsDuringVisits} incident${incidentsDuringVisits !== 1 ? "s" : ""} during visitor access. While the number is low, any incident during a visit warrants review of visitor management protocols to identify whether enhanced controls could have prevented the event.`,
      severity: "warning",
    });
  } else if (incidentsDuringVisits > 2) {
    insights.push({
      text: `${incidentsDuringVisits} incidents during visitor access -- this pattern suggests systemic weaknesses in visitor management protocols. A comprehensive review of access controls, escort procedures, and visitor vetting is needed.`,
      severity: "critical",
    });
  }

  // Visitor type analysis
  const contractorVisits = visitor_registration_records.filter(
    (r) => r.visitor_type === "contractor",
  ).length;
  const familyVisits = visitor_registration_records.filter(
    (r) => r.visitor_type === "family",
  ).length;
  const professionalVisits = visitor_registration_records.filter(
    (r) => r.visitor_type === "professional",
  ).length;

  if (contractorVisits > 0 && totalRegistrations > 0) {
    const contractorRate = pct(contractorVisits, totalRegistrations);
    if (contractorRate > 30) {
      insights.push({
        text: `Contractors account for ${contractorRate}% of all visits. High contractor traffic requires particular attention to DBS checks, escort compliance, and restricted area management to protect children from exposure to transient adult visitors.`,
        severity: "warning",
      });
    }
  }

  // -- Positive insights --

  if (visitor_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding visitor management and security -- visitor registration is comprehensive, DBS and ID checks are robust, safeguarding protocols are consistently followed, and visitor logs provide a complete audit trail. This is strong evidence of Reg 34 and Reg 32 compliance.",
      severity: "positive",
    });
  }

  if (
    dbsVerificationRate >= 100 &&
    totalDbsRequired > 0
  ) {
    insights.push({
      text: "Every visitor requiring a DBS check has been verified with a current certificate. This comprehensive approach to vetting ensures children are protected from unsuitable adults and provides robust evidence for Ofsted inspection.",
      severity: "positive",
    });
  }

  if (
    registrationComplianceRate >= 95 &&
    safeguardingAdherenceRate >= 95 &&
    totalRegistrations > 0 &&
    totalSafeguardingRecords > 0
  ) {
    insights.push({
      text: "Registration and safeguarding compliance are both near-perfect -- every visitor is accounted for, briefed on safeguarding responsibilities, and subject to appropriate checks. This demonstrates a culture of security and child protection.",
      severity: "positive",
    });
  }

  if (
    logCompletenessRate >= 95 &&
    logReviewRate >= 90 &&
    totalLogRecords > 0
  ) {
    insights.push({
      text: "Visitor logs are comprehensive and consistently reviewed by management -- the home maintains a robust, auditable record of all visitor activity with active management oversight. This supports both accountability and inspection readiness.",
      severity: "positive",
    });
  }

  if (
    escortComplianceRate >= 100 &&
    totalEscortRequired > 0 &&
    loneAccessAssessmentRate >= 100 &&
    loneAccessVisits.length > 0
  ) {
    insights.push({
      text: "Escort and lone access protocols are fully compliant -- every visitor requiring an escort is accompanied, and every instance of lone access is risk assessed. The home takes a rigorous approach to managing visitor-child contact.",
      severity: "positive",
    });
  }

  if (
    idCheckRate >= 95 &&
    photoMatchRate >= 90 &&
    totalIdChecks > 0
  ) {
    insights.push({
      text: `ID verification at ${idCheckRate}% with ${photoMatchRate}% photo match confirmation -- the home verifies identity thoroughly, going beyond basic checks to confirm visitors match their photographic identification.`,
      severity: "positive",
    });
  }

  if (
    departureConfirmationRate >= 95 &&
    signInRate >= 95 &&
    signOutRate >= 95 &&
    totalLogRecords > 0
  ) {
    insights.push({
      text: "Sign-in, sign-out, and departure confirmation are all near-comprehensive -- the home can account for every visitor from arrival to departure, providing a complete movement record for safeguarding and audit purposes.",
      severity: "positive",
    });
  }

  if (
    badgeIssuedRate >= 95 &&
    badgeReturnRate >= 95 &&
    totalLogRecords > 0
  ) {
    insights.push({
      text: `Badge issuance at ${badgeIssuedRate}% with ${badgeReturnRate}% return rate -- visitors are identifiable throughout their visit and badges are recovered on departure, preventing unauthorised badge retention.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (visitor_rating === "outstanding") {
    headline =
      "Outstanding visitor management and security -- registration, DBS checks, ID verification, safeguarding protocols, and visitor logs are all comprehensive and well-managed.";
  } else if (visitor_rating === "good") {
    headline = `Good visitor management and security -- ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (visitor_rating === "adequate") {
    headline = `Adequate visitor management and security -- ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure all visitors are properly vetted, registered, and supervised.`;
  } else {
    headline = `Visitor management and security is inadequate -- ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children are protected from unsuitable or unvetted visitors.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    visitor_rating,
    visitor_score: score,
    headline,
    total_visits: totalVisits,
    registration_compliance_rate: registrationComplianceRate,
    dbs_verification_rate: dbsVerificationRate,
    id_check_rate: idCheckRate,
    safeguarding_adherence_rate: safeguardingAdherenceRate,
    log_completeness_rate: logCompletenessRate,
    escort_compliance_rate: escortComplianceRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
