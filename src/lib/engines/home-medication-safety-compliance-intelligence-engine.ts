// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME MEDICATION SAFETY & COMPLIANCE INTELLIGENCE ENGINE
// Monitors medication management safety across the home — administration
// accuracy, error rates, audit compliance, storage standards, and emergency
// medication readiness. Critical for Ofsted under CHR 2015 Reg 23 (Medicines)
// and SCCIF health outcomes.
// Pure deterministic engine — no imports, no LLM, no external deps.
// Store keys: medicationAdministrations, medicationErrors, medicationAuditRecords,
//             medicationStorageAudits, emergencyMedicationProtocols
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface MedicationAdministrationInput {
  id: string;
  child_id: string;
  date: string;
  medication_name: string;
  dose: string;
  administered_by: string;
  witnessed_by: string | null;
  on_time: boolean;
  refused: boolean;
  reason_refused: string | null;
  is_prn: boolean;
  prn_reason_documented: boolean;
  is_controlled_drug: boolean;
  created_at: string;
}

export interface MedicationErrorInput {
  id: string;
  child_id: string;
  date: string;
  error_type: "wrong_dose" | "wrong_time" | "wrong_medication" | "omission" | "other";
  severity: "minor" | "moderate" | "serious";
  investigation_completed: boolean;
  actions_taken: string;
  created_at: string;
}

export interface MedicationAuditInput {
  id: string;
  audit_date: string;
  auditor: string;
  all_records_accurate: boolean;
  discrepancies_found: number;
  discrepancies_resolved: number;
  controlled_drugs_checked: boolean;
  mar_charts_correct: boolean;
  created_at: string;
}

export interface MedicationStorageAuditInput {
  id: string;
  audit_date: string;
  temperature_in_range: boolean;
  locked_storage_verified: boolean;
  expiry_dates_checked: boolean;
  stock_levels_adequate: boolean;
  created_at: string;
}

export interface EmergencyMedicationProtocolInput {
  id: string;
  child_id: string;
  medication_name: string;
  protocol_current: boolean;
  last_reviewed: string;
  next_review_date: string;
  staff_trained_count: number;
  created_at: string;
}

export interface MedicationSafetyComplianceInput {
  today: string;
  total_children: number;
  medication_administrations: MedicationAdministrationInput[];
  medication_errors: MedicationErrorInput[];
  medication_audit_records: MedicationAuditInput[];
  medication_storage_audits: MedicationStorageAuditInput[];
  emergency_medication_protocols: EmergencyMedicationProtocolInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type MedicationSafetyRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface MedicationSafetyInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface MedicationSafetyRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface MedicationSafetyComplianceResult {
  safety_rating: MedicationSafetyRating;
  safety_score: number;
  headline: string;
  total_administrations: number;
  administration_accuracy_rate: number;
  error_rate: number;
  audit_compliance_rate: number;
  storage_pass_rate: number;
  emergency_protocol_currency_rate: number;
  witness_rate: number;
  controlled_drug_compliance_rate: number;
  prn_documentation_rate: number;
  staff_competency_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: MedicationSafetyRecommendation[];
  insights: MedicationSafetyInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): MedicationSafetyRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: MedicationSafetyRating,
  score: number,
  headline: string,
): MedicationSafetyComplianceResult {
  return {
    safety_rating: rating,
    safety_score: score,
    headline,
    total_administrations: 0,
    administration_accuracy_rate: 0,
    error_rate: 0,
    audit_compliance_rate: 0,
    storage_pass_rate: 0,
    emergency_protocol_currency_rate: 0,
    witness_rate: 0,
    controlled_drug_compliance_rate: 0,
    prn_documentation_rate: 0,
    staff_competency_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeMedicationSafetyCompliance(
  input: MedicationSafetyComplianceInput,
): MedicationSafetyComplianceResult {
  const {
    today,
    total_children,
    medication_administrations,
    medication_errors,
    medication_audit_records,
    medication_storage_audits,
    emergency_medication_protocols,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    medication_administrations.length === 0 &&
    medication_errors.length === 0 &&
    medication_audit_records.length === 0 &&
    medication_storage_audits.length === 0 &&
    emergency_medication_protocols.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess medication safety and compliance.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No medication records exist despite children on placement — medication safety requires urgent attention.",
      ),
      concerns: [
        "No medication administration records, error reports, audits, storage checks, or emergency protocols exist despite children being on placement — the home cannot evidence safe medication management.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish medication management systems including MAR charts, administration recording, medication audits, storage checks, and emergency medication protocols for all children requiring medication.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 23 — Medicines",
        },
        {
          rank: 2,
          recommendation:
            "Ensure all staff involved in medication administration receive appropriate training and competency assessment before administering any medication.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Health outcomes",
        },
      ],
      insights: [
        {
          text: "The complete absence of medication records means Ofsted cannot verify that medicines are managed safely. Under Reg 23, the registered person must make arrangements for the handling, recording, safekeeping, safe administration, and disposal of medicines. This is a fundamental failure in medication safety.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Administration metrics ---
  const totalAdministrations = medication_administrations.length;
  const nonRefusedAdministrations = medication_administrations.filter(
    (a) => !a.refused,
  );
  const onTimeNonRefused = nonRefusedAdministrations.filter(
    (a) => a.on_time,
  ).length;
  const administrationAccuracyRate = pct(onTimeNonRefused, nonRefusedAdministrations.length);

  // Witness rate: administrations with a witness
  const witnessedAdministrations = medication_administrations.filter(
    (a) => a.witnessed_by !== null && a.witnessed_by.trim() !== "",
  ).length;
  const witnessRate = pct(witnessedAdministrations, totalAdministrations);

  // Controlled drug compliance: controlled drug administrations that were witnessed
  const controlledDrugAdministrations = medication_administrations.filter(
    (a) => a.is_controlled_drug,
  );
  const controlledDrugWitnessed = controlledDrugAdministrations.filter(
    (a) => a.witnessed_by !== null && a.witnessed_by.trim() !== "",
  ).length;
  const controlledDrugComplianceRate = pct(
    controlledDrugWitnessed,
    controlledDrugAdministrations.length,
  );

  // PRN documentation rate: PRN administrations with reason documented
  const prnAdministrations = medication_administrations.filter(
    (a) => a.is_prn,
  );
  const prnDocumented = prnAdministrations.filter(
    (a) => a.prn_reason_documented,
  ).length;
  const prnDocumentationRate = pct(prnDocumented, prnAdministrations.length);

  // Refused medications with reason documented
  const refusedAdministrations = medication_administrations.filter(
    (a) => a.refused,
  );
  const refusedWithReason = refusedAdministrations.filter(
    (a) => a.reason_refused !== null && a.reason_refused.trim() !== "",
  ).length;
  const refusalDocumentationRate = pct(refusedWithReason, refusedAdministrations.length);

  // --- Error metrics ---
  const totalErrors = medication_errors.length;
  const errorRate = pct(totalErrors, totalAdministrations);
  const seriousErrors = medication_errors.filter(
    (e) => e.severity === "serious",
  ).length;
  const moderateErrors = medication_errors.filter(
    (e) => e.severity === "moderate",
  ).length;
  const investigatedErrors = medication_errors.filter(
    (e) => e.investigation_completed,
  ).length;
  const errorInvestigationRate = pct(investigatedErrors, totalErrors);
  const errorsWithActions = medication_errors.filter(
    (e) => e.actions_taken && e.actions_taken.trim() !== "",
  ).length;

  // --- Audit metrics ---
  const totalAudits = medication_audit_records.length;
  const accurateAudits = medication_audit_records.filter(
    (a) => a.all_records_accurate,
  ).length;
  const auditComplianceRate = pct(accurateAudits, totalAudits);

  const auditsWithControlledCheck = medication_audit_records.filter(
    (a) => a.controlled_drugs_checked,
  ).length;
  const controlledDrugAuditRate = pct(auditsWithControlledCheck, totalAudits);

  const auditsWithMarCorrect = medication_audit_records.filter(
    (a) => a.mar_charts_correct,
  ).length;
  const marChartAccuracyRate = pct(auditsWithMarCorrect, totalAudits);

  const totalDiscrepanciesFound = medication_audit_records.reduce(
    (sum, a) => sum + a.discrepancies_found,
    0,
  );
  const totalDiscrepanciesResolved = medication_audit_records.reduce(
    (sum, a) => sum + a.discrepancies_resolved,
    0,
  );
  const discrepancyResolutionRate = pct(totalDiscrepanciesResolved, totalDiscrepanciesFound);

  // --- Storage audit metrics ---
  const totalStorageAudits = medication_storage_audits.length;
  const storageFullyCompliant = medication_storage_audits.filter(
    (s) =>
      s.temperature_in_range &&
      s.locked_storage_verified &&
      s.expiry_dates_checked &&
      s.stock_levels_adequate,
  ).length;
  const storagePassRate = pct(storageFullyCompliant, totalStorageAudits);

  const temperatureCompliant = medication_storage_audits.filter(
    (s) => s.temperature_in_range,
  ).length;
  const temperatureComplianceRate = pct(temperatureCompliant, totalStorageAudits);

  const lockedStorageCompliant = medication_storage_audits.filter(
    (s) => s.locked_storage_verified,
  ).length;
  const lockedStorageRate = pct(lockedStorageCompliant, totalStorageAudits);

  const expiryChecked = medication_storage_audits.filter(
    (s) => s.expiry_dates_checked,
  ).length;
  const expiryCheckRate = pct(expiryChecked, totalStorageAudits);

  // --- Emergency protocol metrics ---
  const totalProtocols = emergency_medication_protocols.length;
  const currentProtocols = emergency_medication_protocols.filter(
    (p) => p.protocol_current,
  ).length;
  const emergencyProtocolCurrencyRate = pct(currentProtocols, totalProtocols);

  const overdueProtocols = emergency_medication_protocols.filter(
    (p) => p.next_review_date && p.next_review_date < today,
  ).length;

  // Staff competency: protocols where at least 2 staff are trained
  const protocolsWithAdequateTraining = emergency_medication_protocols.filter(
    (p) => p.staff_trained_count >= 2,
  ).length;
  const staffCompetencyRate = pct(protocolsWithAdequateTraining, totalProtocols);

  const totalStaffTrained = emergency_medication_protocols.reduce(
    (sum, p) => sum + p.staff_trained_count,
    0,
  );
  const avgStaffTrained = totalProtocols > 0
    ? Math.round(totalStaffTrained / totalProtocols)
    : 0;

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // Bonuses sum to exactly 28: 4+3+3+3+3+3+3+3+3 = 28

  let score = 52;

  // --- Bonus 1: Administration accuracy rate (>=95: +4, >=80: +2) ---
  if (administrationAccuracyRate >= 95) score += 4;
  else if (administrationAccuracyRate >= 80) score += 2;

  // --- Bonus 2: Error rate (inverse — low errors) (0 errors: +3, errorRate<=2: +1) ---
  if (totalAdministrations > 0 && totalErrors === 0) score += 3;
  else if (totalAdministrations > 0 && errorRate <= 2) score += 1;

  // --- Bonus 3: Audit compliance rate (>=95: +3, >=80: +1) ---
  if (auditComplianceRate >= 95) score += 3;
  else if (auditComplianceRate >= 80) score += 1;

  // --- Bonus 4: Storage audit pass rate (>=95: +3, >=80: +1) ---
  if (storagePassRate >= 95) score += 3;
  else if (storagePassRate >= 80) score += 1;

  // --- Bonus 5: Emergency protocol currency (>=100: +3, >=80: +1) ---
  if (emergencyProtocolCurrencyRate >= 100) score += 3;
  else if (emergencyProtocolCurrencyRate >= 80) score += 1;

  // --- Bonus 6: Witness rate (>=90: +3, >=70: +1) ---
  if (witnessRate >= 90) score += 3;
  else if (witnessRate >= 70) score += 1;

  // --- Bonus 7: Controlled drug compliance (>=100: +3, >=90: +1) ---
  if (controlledDrugAdministrations.length > 0 && controlledDrugComplianceRate >= 100) score += 3;
  else if (controlledDrugAdministrations.length > 0 && controlledDrugComplianceRate >= 90) score += 1;
  else if (controlledDrugAdministrations.length === 0 && totalAdministrations > 0) score += 3;

  // --- Bonus 8: PRN documentation rate (>=95: +3, >=80: +1) ---
  if (prnAdministrations.length > 0 && prnDocumentationRate >= 95) score += 3;
  else if (prnAdministrations.length > 0 && prnDocumentationRate >= 80) score += 1;
  else if (prnAdministrations.length === 0 && totalAdministrations > 0) score += 3;

  // --- Bonus 9: Staff competency rate (>=90: +3, >=70: +1) ---
  if (staffCompetencyRate >= 90) score += 3;
  else if (staffCompetencyRate >= 70) score += 1;

  // ── Penalties ─────────────────────────────────────────────────────────

  // Penalty 1: Serious medication errors exist — -8
  if (seriousErrors > 0) score -= 8;

  // Penalty 2: Error rate > 5% — -5 (guard: need administrations)
  if (errorRate > 5 && totalAdministrations > 0) score -= 5;

  // Penalty 3: Storage audit failures — locked storage not verified — -5 (guard: need audits)
  if (lockedStorageRate < 80 && totalStorageAudits > 0) score -= 5;

  // Penalty 4: No medication audits despite administrations — -4 (guard: no children check)
  if (totalAudits === 0 && totalAdministrations > 0 && total_children > 0) score -= 4;

  score = clamp(score, 0, 100);

  const safety_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (administrationAccuracyRate >= 95 && nonRefusedAdministrations.length > 0) {
    strengths.push(
      `${administrationAccuracyRate}% medication administration accuracy rate — medicines are being administered on time and as prescribed, demonstrating excellent medication management practice.`,
    );
  } else if (administrationAccuracyRate >= 80 && nonRefusedAdministrations.length > 0) {
    strengths.push(
      `${administrationAccuracyRate}% administration accuracy rate — good standard of medication administration with the majority of medicines given on time.`,
    );
  }

  if (totalAdministrations > 0 && totalErrors === 0) {
    strengths.push(
      "Zero medication errors recorded — the home demonstrates an excellent safety record in medication management.",
    );
  } else if (totalAdministrations > 0 && errorRate <= 2) {
    strengths.push(
      `Medication error rate at ${errorRate}% — errors are rare and the home maintains a strong safety record.`,
    );
  }

  if (auditComplianceRate >= 95 && totalAudits > 0) {
    strengths.push(
      `${auditComplianceRate}% medication audit compliance — records are consistently accurate and audits confirm robust medication management systems.`,
    );
  } else if (auditComplianceRate >= 80 && totalAudits > 0) {
    strengths.push(
      `${auditComplianceRate}% audit compliance rate — medication records are largely accurate with good auditing practice in place.`,
    );
  }

  if (storagePassRate >= 95 && totalStorageAudits > 0) {
    strengths.push(
      `${storagePassRate}% storage audit pass rate — medication storage consistently meets all safety standards including temperature, security, and stock management.`,
    );
  } else if (storagePassRate >= 80 && totalStorageAudits > 0) {
    strengths.push(
      `${storagePassRate}% storage compliance — medication storage generally meets safety requirements.`,
    );
  }

  if (emergencyProtocolCurrencyRate >= 100 && totalProtocols > 0) {
    strengths.push(
      "All emergency medication protocols are current — the home ensures emergency medication plans are reviewed and up to date for every child who requires them.",
    );
  } else if (emergencyProtocolCurrencyRate >= 80 && totalProtocols > 0) {
    strengths.push(
      `${emergencyProtocolCurrencyRate}% of emergency medication protocols are current — good oversight of emergency medication readiness.`,
    );
  }

  if (witnessRate >= 90 && totalAdministrations > 0) {
    strengths.push(
      `${witnessRate}% of medication administrations are witnessed — the home operates robust dual-signature verification for medication safety.`,
    );
  } else if (witnessRate >= 70 && totalAdministrations > 0) {
    strengths.push(
      `${witnessRate}% witness rate for medication administration — good practice in verification of medication given.`,
    );
  }

  if (controlledDrugComplianceRate >= 100 && controlledDrugAdministrations.length > 0) {
    strengths.push(
      "All controlled drug administrations are witnessed — full compliance with controlled drug witness requirements.",
    );
  } else if (controlledDrugComplianceRate >= 90 && controlledDrugAdministrations.length > 0) {
    strengths.push(
      `${controlledDrugComplianceRate}% controlled drug witness compliance — strong adherence to controlled substance protocols.`,
    );
  }

  if (prnDocumentationRate >= 95 && prnAdministrations.length > 0) {
    strengths.push(
      `${prnDocumentationRate}% of PRN (as-needed) medication administrations have documented reasons — excellent practice in recording clinical rationale for PRN use.`,
    );
  } else if (prnDocumentationRate >= 80 && prnAdministrations.length > 0) {
    strengths.push(
      `${prnDocumentationRate}% PRN documentation rate — good recording of reasons for as-needed medication use.`,
    );
  }

  if (staffCompetencyRate >= 90 && totalProtocols > 0) {
    strengths.push(
      `${staffCompetencyRate}% of emergency medication protocols have at least 2 trained staff — robust staff competency coverage ensures emergency medication can be administered safely at all times.`,
    );
  } else if (staffCompetencyRate >= 70 && totalProtocols > 0) {
    strengths.push(
      `${staffCompetencyRate}% of emergency protocols have adequate trained staff — good coverage of staff competency for emergency medication.`,
    );
  }

  if (errorInvestigationRate >= 100 && totalErrors > 0) {
    strengths.push(
      "All medication errors have been fully investigated — the home demonstrates a learning culture that responds to errors with thorough investigation.",
    );
  } else if (errorInvestigationRate >= 80 && totalErrors > 0) {
    strengths.push(
      `${errorInvestigationRate}% of medication errors investigated — good practice in learning from medication incidents.`,
    );
  }

  if (marChartAccuracyRate >= 100 && totalAudits > 0) {
    strengths.push(
      "MAR charts confirmed accurate in all audits — medication administration records are consistently well-maintained.",
    );
  }

  if (discrepancyResolutionRate >= 100 && totalDiscrepanciesFound > 0) {
    strengths.push(
      "All audit discrepancies have been resolved — the home responds effectively to identified medication record issues.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (seriousErrors > 0) {
    concerns.push(
      `${seriousErrors} serious medication error${seriousErrors !== 1 ? "s" : ""} recorded — serious errors pose significant risk to children's safety and require immediate investigation and remedial action.`,
    );
  }

  if (errorRate > 5 && totalAdministrations > 0) {
    concerns.push(
      `Medication error rate at ${errorRate}% — this exceeds acceptable thresholds and indicates systemic issues with medication management that must be addressed urgently.`,
    );
  } else if (errorRate > 2 && errorRate <= 5 && totalAdministrations > 0) {
    concerns.push(
      `Medication error rate at ${errorRate}% — while not critical, this rate warrants review of medication processes to prevent escalation.`,
    );
  }

  if (administrationAccuracyRate < 50 && nonRefusedAdministrations.length > 0) {
    concerns.push(
      `Only ${administrationAccuracyRate}% of medications administered on time — the majority of medicines are not given as prescribed, posing significant risk to children's health.`,
    );
  } else if (administrationAccuracyRate < 80 && administrationAccuracyRate >= 50 && nonRefusedAdministrations.length > 0) {
    concerns.push(
      `Administration accuracy at ${administrationAccuracyRate}% — a significant proportion of medications are not being administered on time.`,
    );
  }

  if (lockedStorageRate < 80 && totalStorageAudits > 0) {
    concerns.push(
      `Locked storage verification rate at only ${lockedStorageRate}% — medications must be stored securely at all times. Failure to maintain locked storage is a serious regulatory breach.`,
    );
  }

  if (controlledDrugComplianceRate < 80 && controlledDrugAdministrations.length > 0) {
    concerns.push(
      `Only ${controlledDrugComplianceRate}% of controlled drug administrations are witnessed — controlled drugs require dual-signature witnessing for every administration. This is a regulatory requirement.`,
    );
  } else if (controlledDrugComplianceRate < 100 && controlledDrugComplianceRate >= 80 && controlledDrugAdministrations.length > 0) {
    concerns.push(
      `Controlled drug witness rate at ${controlledDrugComplianceRate}% — while good, all controlled drug administrations must be witnessed without exception.`,
    );
  }

  if (auditComplianceRate < 50 && totalAudits > 0) {
    concerns.push(
      `Only ${auditComplianceRate}% of medication audits show accurate records — widespread record inaccuracies suggest fundamental problems with medication documentation.`,
    );
  } else if (auditComplianceRate < 80 && auditComplianceRate >= 50 && totalAudits > 0) {
    concerns.push(
      `Medication audit compliance at ${auditComplianceRate}% — record accuracy needs improvement to meet regulatory standards.`,
    );
  }

  if (storagePassRate < 50 && totalStorageAudits > 0) {
    concerns.push(
      `Only ${storagePassRate}% of storage audits fully pass — medication storage standards are not being consistently maintained, risking medication safety and efficacy.`,
    );
  } else if (storagePassRate < 80 && storagePassRate >= 50 && totalStorageAudits > 0) {
    concerns.push(
      `Storage audit pass rate at ${storagePassRate}% — storage conditions do not consistently meet all safety requirements.`,
    );
  }

  if (emergencyProtocolCurrencyRate < 50 && totalProtocols > 0) {
    concerns.push(
      `Only ${emergencyProtocolCurrencyRate}% of emergency medication protocols are current — the majority of emergency medication plans are outdated, meaning staff may not have correct guidance in an emergency.`,
    );
  } else if (emergencyProtocolCurrencyRate < 80 && emergencyProtocolCurrencyRate >= 50 && totalProtocols > 0) {
    concerns.push(
      `Emergency protocol currency at ${emergencyProtocolCurrencyRate}% — some emergency medication plans need review to ensure they reflect current prescriptions and guidance.`,
    );
  }

  if (totalAudits === 0 && totalAdministrations > 0 && total_children > 0) {
    concerns.push(
      "No medication audits have been conducted despite medication being administered — the home cannot evidence that medication records are accurate and systems are functioning safely.",
    );
  }

  if (witnessRate < 50 && totalAdministrations > 0) {
    concerns.push(
      `Only ${witnessRate}% of medication administrations are witnessed — the majority of medications are administered without a second person verifying the correct medication and dose.`,
    );
  } else if (witnessRate < 70 && witnessRate >= 50 && totalAdministrations > 0) {
    concerns.push(
      `Witness rate at ${witnessRate}% — a significant proportion of medication administrations lack secondary verification.`,
    );
  }

  if (prnDocumentationRate < 50 && prnAdministrations.length > 0) {
    concerns.push(
      `Only ${prnDocumentationRate}% of PRN medication administrations have a documented reason — PRN medication must always have a clinical rationale recorded to justify its use.`,
    );
  } else if (prnDocumentationRate < 80 && prnDocumentationRate >= 50 && prnAdministrations.length > 0) {
    concerns.push(
      `PRN documentation rate at ${prnDocumentationRate}% — not all as-needed medication use is supported by a documented reason.`,
    );
  }

  if (staffCompetencyRate < 50 && totalProtocols > 0) {
    concerns.push(
      `Only ${staffCompetencyRate}% of emergency medication protocols have at least 2 trained staff — children may be at risk if an emergency occurs and no trained staff member is available.`,
    );
  } else if (staffCompetencyRate < 70 && staffCompetencyRate >= 50 && totalProtocols > 0) {
    concerns.push(
      `Staff competency coverage at ${staffCompetencyRate}% — not all emergency protocols have sufficient trained staff for safe round-the-clock coverage.`,
    );
  }

  if (overdueProtocols > 0) {
    concerns.push(
      `${overdueProtocols} emergency medication protocol${overdueProtocols !== 1 ? "s are" : " is"} overdue for review — overdue reviews mean protocols may not reflect current medical guidance.`,
    );
  }

  if (errorInvestigationRate < 50 && totalErrors > 0) {
    concerns.push(
      `Only ${errorInvestigationRate}% of medication errors have been investigated — the home is not learning from medication incidents, increasing the risk of recurrence.`,
    );
  }

  if (totalStorageAudits === 0 && total_children > 0 && totalAdministrations > 0) {
    concerns.push(
      "No medication storage audits have been conducted — the home cannot evidence that medicines are stored safely and at the correct temperature.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: MedicationSafetyRecommendation[] = [];
  let rank = 0;

  if (seriousErrors > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct a full investigation into all serious medication errors, implement immediate corrective actions, and notify relevant authorities as required. Review medication administration processes with all staff involved.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (errorRate > 5 && totalAdministrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review medication administration processes — the error rate exceeds safe thresholds. Implement additional safeguards such as mandatory dual-checking, staff re-training, and root cause analysis of all errors.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (lockedStorageRate < 80 && totalStorageAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Immediately ensure all medication storage is locked and secure at all times — unlocked medication storage is a serious regulatory breach that puts children at risk of unauthorised access to medicines.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (controlledDrugComplianceRate < 80 && controlledDrugAdministrations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Enforce mandatory dual-witness policy for all controlled drug administrations — every controlled substance must be signed for by two staff members. Review controlled drug protocols with all medication-trained staff immediately.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines, Misuse of Drugs Regulations",
    });
  }

  if (totalAudits === 0 && totalAdministrations > 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a regular medication audit schedule — at minimum monthly audits should be conducted to verify MAR chart accuracy, controlled drug registers, stock counts, and overall compliance with medication management policies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (totalStorageAudits === 0 && total_children > 0 && totalAdministrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement regular medication storage audits including temperature monitoring, locked storage verification, expiry date checks, and stock level reviews.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (emergencyProtocolCurrencyRate < 50 && totalProtocols > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently review and update all out-of-date emergency medication protocols — staff need current guidance to respond safely in medication emergencies.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (staffCompetencyRate < 50 && totalProtocols > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Arrange emergency medication training for additional staff to ensure at least 2 trained staff are available for each emergency protocol — this ensures safe coverage across all shifts.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Health outcomes",
    });
  }

  if (administrationAccuracyRate < 50 && nonRefusedAdministrations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Conduct an urgent review of medication administration practice — the accuracy rate is critically low. Implement time-specific medication alerts, additional staff training, and supervisory oversight of all medication rounds.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (prnDocumentationRate < 50 && prnAdministrations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Ensure all PRN medication administrations include a documented clinical reason — this is essential for evidencing that as-needed medication is given appropriately and not used as a form of control.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (errorInvestigationRate < 50 && totalErrors > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Investigate all outstanding medication errors and implement corrective actions — learning from errors is essential for preventing recurrence and demonstrating a safety culture.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (auditComplianceRate < 50 && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve medication record accuracy as a priority — widespread inaccuracies identified through audit suggest fundamental issues with medication documentation practice.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (administrationAccuracyRate >= 50 && administrationAccuracyRate < 80 && nonRefusedAdministrations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve medication administration timeliness — implement medication round schedules and alerts to ensure medicines are given within their prescribed time windows.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (witnessRate < 70 && totalAdministrations > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase the witness rate for medication administration — implement a policy of dual-checking for all medication rounds to reduce the risk of errors.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (emergencyProtocolCurrencyRate >= 50 && emergencyProtocolCurrencyRate < 80 && totalProtocols > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and update emergency medication protocols that are not current — aim for 100% protocol currency to ensure staff always have up-to-date guidance.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (storagePassRate >= 50 && storagePassRate < 80 && totalStorageAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Address storage audit failures to achieve consistent compliance — all four storage criteria (temperature, security, expiry, stock) must be met at every audit.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (overdueProtocols > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Schedule reviews for ${overdueProtocols} overdue emergency medication protocol${overdueProtocols !== 1 ? "s" : ""} — protocols should be reviewed before their next review date to maintain currency.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (prnDocumentationRate >= 50 && prnDocumentationRate < 80 && prnAdministrations.length > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve PRN medication documentation — ensure every as-needed medication administration includes the clinical reason and outcome to support safe and appropriate use.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  if (staffCompetencyRate >= 50 && staffCompetencyRate < 70 && totalProtocols > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Train additional staff in emergency medication protocols to improve coverage — aim for at least 2 trained staff per protocol across all shift patterns.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health outcomes",
    });
  }

  if (auditComplianceRate >= 50 && auditComplianceRate < 80 && totalAudits > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve medication record accuracy through additional auditing and staff guidance — aim for at least 80% of audits confirming accurate records.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 23 — Medicines",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: MedicationSafetyInsight[] = [];

  // -- Critical insights --

  if (seriousErrors > 0) {
    insights.push({
      text: `${seriousErrors} serious medication error${seriousErrors !== 1 ? "s have" : " has"} been recorded. Serious medication errors can cause direct harm to children and represent a significant safeguarding concern. Ofsted will scrutinise the home's response to these errors under Reg 23 and may issue a compliance notice if the response is inadequate.`,
      severity: "critical",
    });
  }

  if (errorRate > 5 && totalAdministrations > 0) {
    insights.push({
      text: `The medication error rate of ${errorRate}% is above safe operating thresholds. This pattern of errors suggests systemic issues with medication management — possible contributing factors include inadequate staff training, insufficient checking procedures, or poorly maintained MAR charts.`,
      severity: "critical",
    });
  }

  if (lockedStorageRate < 80 && totalStorageAudits > 0) {
    insights.push({
      text: `Locked storage verification rate at ${lockedStorageRate}% — medication storage must be locked and secure at all times under Reg 23. Unsecured medication storage creates a direct risk of children or unauthorised persons accessing medicines.`,
      severity: "critical",
    });
  }

  if (controlledDrugComplianceRate < 80 && controlledDrugAdministrations.length > 0) {
    insights.push({
      text: `Only ${controlledDrugComplianceRate}% of controlled drug administrations are witnessed. Controlled drugs are subject to the Misuse of Drugs Regulations and require witnessed administration. The current compliance gap creates both regulatory risk and the potential for diversion.`,
      severity: "critical",
    });
  }

  if (emergencyProtocolCurrencyRate < 50 && totalProtocols > 0) {
    insights.push({
      text: `Only ${emergencyProtocolCurrencyRate}% of emergency medication protocols are current. Outdated protocols mean staff may administer emergency medication based on incorrect dosages, routes, or indications — this creates a direct risk to children's safety in an emergency.`,
      severity: "critical",
    });
  }

  if (administrationAccuracyRate < 50 && nonRefusedAdministrations.length > 0) {
    insights.push({
      text: `Medication administration accuracy at only ${administrationAccuracyRate}%. The majority of medications are not being given on time or as prescribed. Late or missed medications can have serious clinical consequences, particularly for time-sensitive medicines such as epilepsy medication, insulin, or antibiotics.`,
      severity: "critical",
    });
  }

  if (totalAudits === 0 && totalAdministrations > 0 && total_children > 0) {
    insights.push({
      text: "No medication audits have been conducted despite medication being administered. Without auditing, the home has no mechanism to detect errors, discrepancies, or patterns of concern in medication management. Ofsted will view this as a significant gap in governance under Reg 23.",
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (errorRate > 2 && errorRate <= 5 && totalAdministrations > 0) {
    insights.push({
      text: `Medication error rate at ${errorRate}% — while not at crisis level, this rate warrants proactive review of medication administration processes to identify patterns and prevent escalation.`,
      severity: "warning",
    });
  }

  if (administrationAccuracyRate >= 50 && administrationAccuracyRate < 80 && nonRefusedAdministrations.length > 0) {
    insights.push({
      text: `Administration accuracy at ${administrationAccuracyRate}% — improving but not yet meeting expected standards. Consistent on-time administration is essential for medication effectiveness and children's health outcomes.`,
      severity: "warning",
    });
  }

  if (witnessRate >= 50 && witnessRate < 70 && totalAdministrations > 0) {
    insights.push({
      text: `Witness rate at ${witnessRate}% — while some medications are verified by a second person, increasing this rate would strengthen the home's safety net against medication errors.`,
      severity: "warning",
    });
  }

  if (storagePassRate >= 50 && storagePassRate < 80 && totalStorageAudits > 0) {
    insights.push({
      text: `Storage audit pass rate at ${storagePassRate}% — not all storage audits meet the full range of safety criteria. Consistent storage compliance is essential for maintaining medication efficacy and safety.`,
      severity: "warning",
    });
  }

  if (emergencyProtocolCurrencyRate >= 50 && emergencyProtocolCurrencyRate < 80 && totalProtocols > 0) {
    insights.push({
      text: `${emergencyProtocolCurrencyRate}% of emergency protocols are current — some protocols are becoming outdated which could lead to incorrect emergency medication guidance for staff.`,
      severity: "warning",
    });
  }

  if (prnDocumentationRate >= 50 && prnDocumentationRate < 80 && prnAdministrations.length > 0) {
    insights.push({
      text: `PRN documentation at ${prnDocumentationRate}% — not all as-needed medication use is supported by documented clinical reasoning. Ofsted may question whether PRN medication is being used appropriately if reasons are not recorded.`,
      severity: "warning",
    });
  }

  if (staffCompetencyRate >= 50 && staffCompetencyRate < 70 && totalProtocols > 0) {
    insights.push({
      text: `Staff competency coverage at ${staffCompetencyRate}% — not all emergency protocols have sufficient trained staff to guarantee safe coverage across all shift patterns.`,
      severity: "warning",
    });
  }

  if (auditComplianceRate >= 50 && auditComplianceRate < 80 && totalAudits > 0) {
    insights.push({
      text: `Medication audit compliance at ${auditComplianceRate}% — record inaccuracies are being identified through auditing, which is positive, but the accuracy rate needs improvement to provide confidence in medication management systems.`,
      severity: "warning",
    });
  }

  if (overdueProtocols > 0 && overdueProtocols <= 2) {
    insights.push({
      text: `${overdueProtocols} emergency protocol${overdueProtocols !== 1 ? "s are" : " is"} overdue for review — prompt scheduling of reviews is needed to maintain protocol currency.`,
      severity: "warning",
    });
  }

  if (overdueProtocols > 2) {
    insights.push({
      text: `${overdueProtocols} emergency protocols are overdue for review — this volume of overdue reviews suggests a systemic issue with protocol management scheduling.`,
      severity: "warning",
    });
  }

  if (moderateErrors > 0 && seriousErrors === 0) {
    insights.push({
      text: `${moderateErrors} moderate medication error${moderateErrors !== 1 ? "s" : ""} recorded — while no serious errors have occurred, moderate errors still represent a risk to children's health and should be investigated to prevent escalation.`,
      severity: "warning",
    });
  }

  if (refusedAdministrations.length > 0 && refusalDocumentationRate < 80) {
    insights.push({
      text: `Only ${refusalDocumentationRate}% of medication refusals have a documented reason — understanding why children refuse medication is important for addressing concerns, adjusting care plans, and evidencing that the child's voice is heard.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (safety_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding medication safety and compliance — medicines are managed safely, accurately, and in full compliance with Reg 23. Administration accuracy, audit compliance, storage standards, and emergency readiness all meet or exceed expected standards.",
      severity: "positive",
    });
  }

  if (totalAdministrations > 0 && totalErrors === 0) {
    insights.push({
      text: "A zero-error medication record is an excellent achievement that demonstrates the home's commitment to medication safety. This reflects well-trained staff, robust checking procedures, and effective medication management systems.",
      severity: "positive",
    });
  }

  if (administrationAccuracyRate >= 95 && nonRefusedAdministrations.length > 0) {
    insights.push({
      text: `${administrationAccuracyRate}% administration accuracy demonstrates excellent medication management — medicines are being given as prescribed, on time, and in the correct doses, optimising therapeutic outcomes for children.`,
      severity: "positive",
    });
  }

  if (controlledDrugComplianceRate >= 100 && controlledDrugAdministrations.length > 0) {
    insights.push({
      text: "Full compliance with controlled drug witness requirements demonstrates the home's understanding of the heightened regulatory standards for controlled substances and its commitment to safe practice.",
      severity: "positive",
    });
  }

  if (storagePassRate >= 95 && totalStorageAudits > 0) {
    insights.push({
      text: `${storagePassRate}% storage compliance confirms that medication is consistently stored safely — temperature control, secure storage, expiry management, and stock levels all meet safety standards.`,
      severity: "positive",
    });
  }

  if (emergencyProtocolCurrencyRate >= 100 && staffCompetencyRate >= 90 && totalProtocols > 0) {
    insights.push({
      text: "All emergency medication protocols are current and adequately staffed — the home is well-prepared to respond to medication emergencies safely and effectively.",
      severity: "positive",
    });
  }

  if (errorInvestigationRate >= 100 && totalErrors > 0) {
    insights.push({
      text: "All medication errors have been fully investigated — the home demonstrates an open learning culture that uses incidents as opportunities to improve practice and prevent recurrence.",
      severity: "positive",
    });
  }

  if (auditComplianceRate >= 95 && marChartAccuracyRate >= 95 && totalAudits > 0) {
    insights.push({
      text: "Medication audits consistently confirm accurate records and correct MAR charts — this provides strong governance assurance that medication systems are functioning safely.",
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (safety_rating === "outstanding") {
    headline =
      "Outstanding medication safety and compliance — medicines are managed safely, accurately, and in full compliance with Reg 23 requirements across administration, audit, storage, and emergency readiness.";
  } else if (safety_rating === "good") {
    headline = `Good medication safety and compliance — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (safety_rating === "adequate") {
    headline = `Adequate medication safety — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure medicines are managed safely for all children.`;
  } else {
    headline = `Medication safety is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure safe medication management under Reg 23.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    safety_rating,
    safety_score: score,
    headline,
    total_administrations: totalAdministrations,
    administration_accuracy_rate: administrationAccuracyRate,
    error_rate: errorRate,
    audit_compliance_rate: auditComplianceRate,
    storage_pass_rate: storagePassRate,
    emergency_protocol_currency_rate: emergencyProtocolCurrencyRate,
    witness_rate: witnessRate,
    controlled_drug_compliance_rate: controlledDrugComplianceRate,
    prn_documentation_rate: prnDocumentationRate,
    staff_competency_rate: staffCompetencyRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
