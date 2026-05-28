// ══════════════════════════════════════════════════════════════════════════════
// CORNERSTONE — HOME HEALTH & WELLBEING OVERSIGHT INTELLIGENCE ENGINE
// Aggregates across all health-related data at the home level to assess whether
// children's physical health, dental, and ongoing medical needs are being met.
// Measures LAC health assessment compliance, dental/optical check timeliness,
// health passport currency, and monitoring quality.
// Pure deterministic engine — no imports, no LLM, no external deps.
// CHR 2015 Reg 33 (Health), Reg 7 (Welfare of children).
// SCCIF: "Experiences and progress of children — health".
// Store keys: healthAssessments, dentalRecords, healthMonitoring,
//             healthPassports, healthRecordEntries
// ══════════════════════════════════════════════════════════════════════════════

// ── Input Types ─────────────────────────────────────────────────────────────

export interface HealthAssessmentInput {
  id: string;
  child_id: string;
  assessment_date: string;
  assessment_type: "initial" | "annual" | "review";
  outcome: string;
  actions_identified: number;
  actions_completed: number;
  next_due_date: string;
  completed_by: string;
  created_at: string;
}

export interface DentalRecordInput {
  id: string;
  child_id: string;
  appointment_date: string;
  check_type: "routine" | "treatment" | "emergency";
  outcome: string;
  next_due_date: string;
  attended: boolean;
  created_at: string;
}

export interface HealthMonitoringInput {
  id: string;
  child_id: string;
  date: string;
  monitoring_type: string;
  readings_recorded: boolean;
  concerns_flagged: boolean;
  actions_taken: string;
  reviewed_by: string;
  created_at: string;
}

export interface HealthPassportInput {
  id: string;
  child_id: string;
  last_updated: string;
  immunisations_current: boolean;
  allergies_documented: boolean;
  medications_documented: boolean;
  gp_registered: boolean;
  dentist_registered: boolean;
  optician_registered: boolean;
  consent_forms_signed: boolean;
  created_at: string;
}

export interface HealthRecordEntryInput {
  id: string;
  child_id: string;
  date: string;
  entry_type: "appointment" | "medication" | "observation" | "referral";
  description: string;
  outcome: string;
  follow_up_required: boolean;
  follow_up_completed: boolean;
  created_at: string;
}

export interface HealthWellbeingOversightInput {
  today: string;
  total_children: number;
  health_assessments: HealthAssessmentInput[];
  dental_records: DentalRecordInput[];
  health_monitoring: HealthMonitoringInput[];
  health_passports: HealthPassportInput[];
  health_record_entries: HealthRecordEntryInput[];
}

// ── Output Types ────────────────────────────────────────────────────────────

export type HealthWellbeingRating =
  | "outstanding"
  | "good"
  | "adequate"
  | "inadequate"
  | "insufficient_data";

export interface HealthWellbeingInsight {
  text: string;
  severity: "critical" | "warning" | "positive";
}

export interface HealthWellbeingRecommendation {
  rank: number;
  recommendation: string;
  urgency: "immediate" | "soon" | "planned";
  regulatory_ref: string;
}

export interface HealthWellbeingOversightResult {
  wellbeing_rating: HealthWellbeingRating;
  wellbeing_score: number;
  headline: string;
  total_health_assessments: number;
  health_assessment_compliance_rate: number;
  dental_check_rate: number;
  health_passport_currency_rate: number;
  monitoring_completion_rate: number;
  health_action_completion_rate: number;
  immunisation_rate: number;
  consent_form_rate: number;
  follow_up_completion_rate: number;
  strengths: string[];
  concerns: string[];
  recommendations: HealthWellbeingRecommendation[];
  insights: HealthWellbeingInsight[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function toRating(score: number): HealthWellbeingRating {
  if (score >= 80) return "outstanding";
  if (score >= 65) return "good";
  if (score >= 45) return "adequate";
  return "inadequate";
}

// ── Empty Result Factory ────────────────────────────────────────────────────

function emptyResult(
  rating: HealthWellbeingRating,
  score: number,
  headline: string,
): HealthWellbeingOversightResult {
  return {
    wellbeing_rating: rating,
    wellbeing_score: score,
    headline,
    total_health_assessments: 0,
    health_assessment_compliance_rate: 0,
    dental_check_rate: 0,
    health_passport_currency_rate: 0,
    monitoring_completion_rate: 0,
    health_action_completion_rate: 0,
    immunisation_rate: 0,
    consent_form_rate: 0,
    follow_up_completion_rate: 0,
    strengths: [],
    concerns: [],
    recommendations: [],
    insights: [],
  };
}

// ── Main Compute ────────────────────────────────────────────────────────────

export function computeHealthWellbeingOversight(
  input: HealthWellbeingOversightInput,
): HealthWellbeingOversightResult {
  const {
    today,
    total_children,
    health_assessments,
    dental_records,
    health_monitoring,
    health_passports,
    health_record_entries,
  } = input;

  // ── Special case: all empty + 0 children → insufficient_data ──────────
  const allEmpty =
    health_assessments.length === 0 &&
    dental_records.length === 0 &&
    health_monitoring.length === 0 &&
    health_passports.length === 0 &&
    health_record_entries.length === 0;

  if (allEmpty && total_children === 0) {
    return emptyResult(
      "insufficient_data",
      0,
      "No children on placement — insufficient data to assess health and wellbeing oversight.",
    );
  }

  // ── Special case: all empty + children > 0 → inadequate ───────────────
  if (allEmpty && total_children > 0) {
    return {
      ...emptyResult(
        "inadequate",
        15,
        "No health data recorded despite children on placement — health oversight requires urgent attention.",
      ),
      concerns: [
        "No health assessments, dental records, health monitoring, health passports, or health record entries exist despite children being on placement — the home cannot evidence that children's health needs are being met.",
      ],
      recommendations: [
        {
          rank: 1,
          recommendation:
            "Immediately establish health recording practices including LAC health assessments, dental check tracking, health passports, and ongoing health monitoring for all children in placement.",
          urgency: "immediate",
          regulatory_ref: "CHR 2015 Reg 33 — Health",
        },
        {
          rank: 2,
          recommendation:
            "Ensure every child has an up-to-date health passport documenting GP registration, dental registration, immunisation status, allergies, and medication records.",
          urgency: "immediate",
          regulatory_ref: "SCCIF — Health outcomes",
        },
      ],
      insights: [
        {
          text: "The complete absence of health records means Ofsted cannot verify that children's physical health, dental, optical, and ongoing medical needs are being met. This is a fundamental failure in health oversight under Reg 33.",
          severity: "critical",
        },
      ],
    };
  }

  // ── Compute core metrics ──────────────────────────────────────────────

  // --- Health assessment metrics ---
  const totalHealthAssessments = health_assessments.length;

  // Unique children with at least one health assessment
  const childrenWithAssessment = new Set(
    health_assessments.map((a) => a.child_id),
  ).size;
  const healthAssessmentComplianceRate = pct(childrenWithAssessment, total_children);

  // Health action plan completion
  const totalActionsIdentified = health_assessments.reduce(
    (sum, a) => sum + a.actions_identified,
    0,
  );
  const totalActionsCompleted = health_assessments.reduce(
    (sum, a) => sum + a.actions_completed,
    0,
  );
  const healthActionCompletionRate = pct(totalActionsCompleted, totalActionsIdentified);

  // Health assessment timeliness: assessments with next_due_date not overdue
  const overdueAssessments = health_assessments.filter(
    (a) => a.next_due_date && a.next_due_date < today,
  ).length;
  const assessmentsWithDueDate = health_assessments.filter(
    (a) => a.next_due_date && a.next_due_date.length > 0,
  ).length;
  const assessmentTimelinessRate = assessmentsWithDueDate > 0
    ? pct(assessmentsWithDueDate - overdueAssessments, assessmentsWithDueDate)
    : 0;

  // --- Dental metrics ---
  const totalDentalRecords = dental_records.length;
  const attendedDental = dental_records.filter((d) => d.attended).length;
  const dentalAttendanceRate = pct(attendedDental, totalDentalRecords);

  // Unique children with at least one dental record
  const childrenWithDental = new Set(
    dental_records.map((d) => d.child_id),
  ).size;
  const dentalCheckRate = pct(childrenWithDental, total_children);

  // Overdue dental checks
  const overdueDental = dental_records.filter(
    (d) => d.next_due_date && d.next_due_date < today,
  ).length;

  // --- Health monitoring metrics ---
  const totalMonitoring = health_monitoring.length;
  const monitoringWithReadings = health_monitoring.filter(
    (m) => m.readings_recorded,
  ).length;
  const monitoringCompletionRate = pct(monitoringWithReadings, totalMonitoring);

  const monitoringWithReview = health_monitoring.filter(
    (m) => m.reviewed_by && m.reviewed_by.trim() !== "",
  ).length;
  const monitoringReviewRate = pct(monitoringWithReview, totalMonitoring);

  const monitoringWithConcerns = health_monitoring.filter(
    (m) => m.concerns_flagged,
  ).length;
  const monitoringConcernsActioned = health_monitoring.filter(
    (m) => m.concerns_flagged && m.actions_taken && m.actions_taken.trim() !== "",
  ).length;
  const concernsActionedRate = pct(monitoringConcernsActioned, monitoringWithConcerns);

  // --- Health passport metrics ---
  const totalPassports = health_passports.length;

  const passportsImmunisationsCurrent = health_passports.filter(
    (p) => p.immunisations_current,
  ).length;
  const immunisationRate = pct(passportsImmunisationsCurrent, totalPassports);

  const passportsWithConsent = health_passports.filter(
    (p) => p.consent_forms_signed,
  ).length;
  const consentFormRate = pct(passportsWithConsent, totalPassports);

  const passportsGpRegistered = health_passports.filter(
    (p) => p.gp_registered,
  ).length;
  const gpRegistrationRate = pct(passportsGpRegistered, totalPassports);

  const passportsDentistRegistered = health_passports.filter(
    (p) => p.dentist_registered,
  ).length;
  const dentistRegistrationRate = pct(passportsDentistRegistered, totalPassports);

  const passportsOpticianRegistered = health_passports.filter(
    (p) => p.optician_registered,
  ).length;
  const opticianRegistrationRate = pct(passportsOpticianRegistered, totalPassports);

  const passportsAllergiesDocumented = health_passports.filter(
    (p) => p.allergies_documented,
  ).length;
  const allergiesDocumentedRate = pct(passportsAllergiesDocumented, totalPassports);

  const passportsMedsDocumented = health_passports.filter(
    (p) => p.medications_documented,
  ).length;
  const medsDocumentedRate = pct(passportsMedsDocumented, totalPassports);

  // Health passport currency: updated within last 90 days
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().slice(0, 10);

  const currentPassports = health_passports.filter(
    (p) => p.last_updated >= ninetyDaysAgoStr,
  ).length;
  const healthPassportCurrencyRate = pct(currentPassports, totalPassports);

  // --- Health record entry metrics ---
  const totalRecordEntries = health_record_entries.length;
  const entriesRequiringFollowUp = health_record_entries.filter(
    (e) => e.follow_up_required,
  ).length;
  const entriesFollowUpCompleted = health_record_entries.filter(
    (e) => e.follow_up_required && e.follow_up_completed,
  ).length;
  const followUpCompletionRate = pct(entriesFollowUpCompleted, entriesRequiringFollowUp);

  const referralEntries = health_record_entries.filter(
    (e) => e.entry_type === "referral",
  ).length;
  const appointmentEntries = health_record_entries.filter(
    (e) => e.entry_type === "appointment",
  ).length;
  const observationEntries = health_record_entries.filter(
    (e) => e.entry_type === "observation",
  ).length;

  // ── Scoring: base 52 ─────────────────────────────────────────────────
  // Bonuses sum to exactly 28: 4+3+3+3+3+3+2+3+4 = 28

  let score = 52;

  // --- Bonus 1: healthAssessmentComplianceRate (>=100: +4, >=80: +2) ---
  if (healthAssessmentComplianceRate >= 100) score += 4;
  else if (healthAssessmentComplianceRate >= 80) score += 2;

  // --- Bonus 2: dentalCheckRate (>=100: +3, >=80: +1) ---
  if (dentalCheckRate >= 100) score += 3;
  else if (dentalCheckRate >= 80) score += 1;

  // --- Bonus 3: healthPassportCurrencyRate (>=100: +3, >=80: +1) ---
  if (healthPassportCurrencyRate >= 100) score += 3;
  else if (healthPassportCurrencyRate >= 80) score += 1;

  // --- Bonus 4: monitoringCompletionRate (>=95: +3, >=80: +1) ---
  if (monitoringCompletionRate >= 95) score += 3;
  else if (monitoringCompletionRate >= 80) score += 1;

  // --- Bonus 5: opticianRegistrationRate (>=100: +3, >=80: +1) ---
  if (opticianRegistrationRate >= 100) score += 3;
  else if (opticianRegistrationRate >= 80) score += 1;

  // --- Bonus 6: healthActionCompletionRate (>=90: +3, >=70: +1) ---
  if (healthActionCompletionRate >= 90) score += 3;
  else if (healthActionCompletionRate >= 70) score += 1;

  // --- Bonus 7: immunisationRate (>=100: +2, >=80: +1) ---
  if (immunisationRate >= 100) score += 2;
  else if (immunisationRate >= 80) score += 1;

  // --- Bonus 8: consentFormRate (>=100: +3, >=80: +1) ---
  if (consentFormRate >= 100) score += 3;
  else if (consentFormRate >= 80) score += 1;

  // --- Bonus 9: healthReviewTimeliness (assessmentTimelinessRate) (>=90: +4, >=75: +2) ---
  if (assessmentTimelinessRate >= 90) score += 4;
  else if (assessmentTimelinessRate >= 75) score += 2;

  // ── Penalties ─────────────────────────────────────────────────────────

  // healthAssessmentComplianceRate < 50 → -5
  if (healthAssessmentComplianceRate < 50 && total_children > 0) score -= 5;

  // dentalCheckRate < 50 → -5
  if (dentalCheckRate < 50 && total_children > 0) score -= 5;

  // monitoringCompletionRate < 50 → -5
  if (monitoringCompletionRate < 50 && totalMonitoring > 0) score -= 5;

  // healthPassportCurrencyRate < 50 → -3
  if (healthPassportCurrencyRate < 50 && totalPassports > 0) score -= 3;

  score = clamp(score, 0, 100);

  const wellbeing_rating = toRating(score);

  // ── Strengths ─────────────────────────────────────────────────────────

  const strengths: string[] = [];

  if (healthAssessmentComplianceRate >= 100 && total_children > 0) {
    strengths.push(
      "Every child has a completed LAC health assessment — the home demonstrates full compliance with statutory health assessment requirements.",
    );
  } else if (healthAssessmentComplianceRate >= 80 && total_children > 0) {
    strengths.push(
      `${healthAssessmentComplianceRate}% of children have a completed health assessment — strong commitment to meeting statutory health requirements.`,
    );
  }

  if (dentalCheckRate >= 100 && total_children > 0) {
    strengths.push(
      "All children have dental check records — oral health needs are being systematically tracked and met.",
    );
  } else if (dentalCheckRate >= 80 && total_children > 0) {
    strengths.push(
      `${dentalCheckRate}% of children have dental check records — good coverage of oral health needs.`,
    );
  }

  if (healthPassportCurrencyRate >= 100 && totalPassports > 0) {
    strengths.push(
      "All health passports updated within the last 90 days — health documentation is current and accessible.",
    );
  } else if (healthPassportCurrencyRate >= 80 && totalPassports > 0) {
    strengths.push(
      `${healthPassportCurrencyRate}% of health passports are current — health documentation is largely up to date.`,
    );
  }

  if (monitoringCompletionRate >= 95 && totalMonitoring > 0) {
    strengths.push(
      `${monitoringCompletionRate}% of health monitoring entries have readings recorded — thorough and consistent health monitoring practice.`,
    );
  } else if (monitoringCompletionRate >= 80 && totalMonitoring > 0) {
    strengths.push(
      `${monitoringCompletionRate}% monitoring completion rate — health observations are generally well documented.`,
    );
  }

  if (healthActionCompletionRate >= 90 && totalActionsIdentified > 0) {
    strengths.push(
      `${healthActionCompletionRate}% of health assessment actions completed — identified health needs are being followed through effectively.`,
    );
  } else if (healthActionCompletionRate >= 70 && totalActionsIdentified > 0) {
    strengths.push(
      `${healthActionCompletionRate}% of health actions completed — good progress in addressing identified health needs.`,
    );
  }

  if (immunisationRate >= 100 && totalPassports > 0) {
    strengths.push(
      "All children have current immunisations — the home ensures children are protected through timely vaccination.",
    );
  } else if (immunisationRate >= 80 && totalPassports > 0) {
    strengths.push(
      `${immunisationRate}% immunisation compliance — the majority of children have up-to-date immunisation records.`,
    );
  }

  if (consentFormRate >= 100 && totalPassports > 0) {
    strengths.push(
      "Consent forms signed for all children — the home has appropriate authorisation for health-related decisions.",
    );
  } else if (consentFormRate >= 80 && totalPassports > 0) {
    strengths.push(
      `${consentFormRate}% consent form completion — strong compliance with health consent requirements.`,
    );
  }

  if (followUpCompletionRate >= 90 && entriesRequiringFollowUp > 0) {
    strengths.push(
      `${followUpCompletionRate}% of health follow-ups completed — the home ensures health concerns are tracked to resolution.`,
    );
  } else if (followUpCompletionRate >= 70 && entriesRequiringFollowUp > 0) {
    strengths.push(
      `${followUpCompletionRate}% health follow-up completion — most identified health needs receive appropriate follow-through.`,
    );
  }

  if (gpRegistrationRate >= 100 && totalPassports > 0) {
    strengths.push(
      "All children registered with a GP — universal primary healthcare access is ensured.",
    );
  }

  if (dentistRegistrationRate >= 100 && totalPassports > 0) {
    strengths.push(
      "All children registered with a dentist — dental health access is properly established for every child.",
    );
  }

  if (opticianRegistrationRate >= 100 && totalPassports > 0) {
    strengths.push(
      "All children registered with an optician — optical health needs are proactively managed.",
    );
  }

  if (assessmentTimelinessRate >= 90 && assessmentsWithDueDate > 0) {
    strengths.push(
      `${assessmentTimelinessRate}% of health assessments are on schedule — the home proactively manages health review timelines.`,
    );
  }

  if (dentalAttendanceRate >= 95 && totalDentalRecords > 0) {
    strengths.push(
      `${dentalAttendanceRate}% dental appointment attendance rate — children consistently attend their dental appointments.`,
    );
  }

  if (concernsActionedRate >= 90 && monitoringWithConcerns > 0) {
    strengths.push(
      `${concernsActionedRate}% of flagged health concerns have documented actions taken — the home responds effectively when health issues are identified.`,
    );
  }

  if (allergiesDocumentedRate >= 100 && totalPassports > 0) {
    strengths.push(
      "Allergies documented for all children — critical safety information is comprehensively recorded.",
    );
  }

  // ── Concerns ──────────────────────────────────────────────────────────

  const concerns: string[] = [];

  if (healthAssessmentComplianceRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${healthAssessmentComplianceRate}% of children have a completed health assessment — the majority of children lack statutory LAC health assessments, representing a significant compliance failure.`,
    );
  } else if (healthAssessmentComplianceRate < 80 && healthAssessmentComplianceRate >= 50 && total_children > 0) {
    concerns.push(
      `Health assessment compliance at ${healthAssessmentComplianceRate}% — not all children have received their statutory LAC health assessment.`,
    );
  }

  if (dentalCheckRate < 50 && total_children > 0) {
    concerns.push(
      `Only ${dentalCheckRate}% of children have dental check records — the majority of children's oral health needs are not being tracked or met.`,
    );
  } else if (dentalCheckRate < 80 && dentalCheckRate >= 50 && total_children > 0) {
    concerns.push(
      `Dental check coverage at ${dentalCheckRate}% — some children lack dental health records, which may indicate unmet oral health needs.`,
    );
  }

  if (healthPassportCurrencyRate < 50 && totalPassports > 0) {
    concerns.push(
      `Only ${healthPassportCurrencyRate}% of health passports are current — the majority of health documentation is outdated, meaning children's current health needs may not be properly understood.`,
    );
  } else if (healthPassportCurrencyRate < 80 && healthPassportCurrencyRate >= 50 && totalPassports > 0) {
    concerns.push(
      `Health passport currency at ${healthPassportCurrencyRate}% — some health passports have not been updated recently, risking outdated health information.`,
    );
  }

  if (monitoringCompletionRate < 50 && totalMonitoring > 0) {
    concerns.push(
      `Only ${monitoringCompletionRate}% of health monitoring entries have readings recorded — health monitoring is largely incomplete, undermining the home's ability to track children's health.`,
    );
  } else if (monitoringCompletionRate < 80 && monitoringCompletionRate >= 50 && totalMonitoring > 0) {
    concerns.push(
      `Monitoring completion rate at ${monitoringCompletionRate}% — not all health monitoring observations include recorded readings.`,
    );
  }

  if (healthActionCompletionRate < 50 && totalActionsIdentified > 0) {
    concerns.push(
      `Only ${healthActionCompletionRate}% of health assessment actions completed — the majority of identified health needs remain unaddressed.`,
    );
  } else if (healthActionCompletionRate < 70 && healthActionCompletionRate >= 50 && totalActionsIdentified > 0) {
    concerns.push(
      `Health action completion rate at ${healthActionCompletionRate}% — a significant proportion of identified health needs have not been followed through.`,
    );
  }

  if (immunisationRate < 50 && totalPassports > 0) {
    concerns.push(
      `Only ${immunisationRate}% of children have current immunisations — the majority of children may be unprotected against preventable diseases.`,
    );
  } else if (immunisationRate < 80 && immunisationRate >= 50 && totalPassports > 0) {
    concerns.push(
      `Immunisation rate at ${immunisationRate}% — some children's immunisation records are not current, which may leave them unprotected.`,
    );
  }

  if (consentFormRate < 50 && totalPassports > 0) {
    concerns.push(
      `Only ${consentFormRate}% of children have signed consent forms — the home may lack authorisation for health-related decisions for most children.`,
    );
  } else if (consentFormRate < 80 && consentFormRate >= 50 && totalPassports > 0) {
    concerns.push(
      `Consent form completion at ${consentFormRate}% — some children lack signed consent forms, potentially delaying health interventions.`,
    );
  }

  if (followUpCompletionRate < 50 && entriesRequiringFollowUp > 0) {
    concerns.push(
      `Only ${followUpCompletionRate}% of health follow-ups completed — the majority of identified health concerns are not being tracked to resolution.`,
    );
  } else if (followUpCompletionRate < 70 && followUpCompletionRate >= 50 && entriesRequiringFollowUp > 0) {
    concerns.push(
      `Follow-up completion rate at ${followUpCompletionRate}% — a notable proportion of flagged health issues remain unresolved.`,
    );
  }

  if (gpRegistrationRate < 80 && totalPassports > 0) {
    concerns.push(
      `Only ${gpRegistrationRate}% of children registered with a GP — some children lack access to primary healthcare.`,
    );
  }

  if (dentistRegistrationRate < 80 && totalPassports > 0) {
    concerns.push(
      `Only ${dentistRegistrationRate}% of children registered with a dentist — dental access is not established for all children.`,
    );
  }

  if (opticianRegistrationRate < 80 && totalPassports > 0) {
    concerns.push(
      `Only ${opticianRegistrationRate}% of children registered with an optician — optical health access is incomplete.`,
    );
  }

  if (overdueAssessments > 0) {
    concerns.push(
      `${overdueAssessments} health assessment${overdueAssessments !== 1 ? "s" : ""} overdue — children may miss critical health reviews.`,
    );
  }

  if (overdueDental > 0) {
    concerns.push(
      `${overdueDental} dental appointment${overdueDental !== 1 ? "s" : ""} overdue — children's oral health may be at risk from missed check-ups.`,
    );
  }

  if (totalPassports === 0 && total_children > 0) {
    concerns.push(
      "No health passports exist for any child — the home cannot demonstrate that children's comprehensive health information is documented and accessible.",
    );
  }

  if (totalMonitoring === 0 && total_children > 0) {
    concerns.push(
      "No health monitoring entries recorded — there is no evidence of ongoing health observation or tracking for children in placement.",
    );
  }

  // ── Recommendations ───────────────────────────────────────────────────

  const recommendations: HealthWellbeingRecommendation[] = [];
  let rank = 0;

  if (healthAssessmentComplianceRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently arrange LAC health assessments for all children without one — statutory health assessments are a legal requirement and their absence represents a compliance failure that Ofsted will identify.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (totalPassports === 0 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Create and maintain a health passport for every child in placement — this must document GP registration, dental/optical registration, immunisations, allergies, medications, and consent forms.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Health, SCCIF health outcomes",
    });
  }

  if (dentalCheckRate < 50 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Urgently register all children with a dentist and arrange routine dental checks — oral health is a core component of LAC health oversight and current coverage is critically low.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (immunisationRate < 50 && totalPassports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Review and update immunisation records for all children — liaise with GPs to ensure vaccination schedules are current and any missed immunisations are caught up.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (consentFormRate < 50 && totalPassports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Obtain signed health consent forms for all children in placement — without appropriate consent, the home may face delays in accessing health treatment for children.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (healthActionCompletionRate < 50 && totalActionsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Implement a health action plan tracker to ensure all identified health needs from assessments are followed through — the current completion rate means most health needs remain unaddressed.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Health outcomes",
    });
  }

  if (followUpCompletionRate < 50 && entriesRequiringFollowUp > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a health follow-up system to track all flagged health concerns to completion — currently the majority of follow-ups are outstanding.",
      urgency: "immediate",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (monitoringCompletionRate < 50 && totalMonitoring > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve health monitoring recording practice — ensure all monitoring entries include full readings and observations to provide a reliable picture of children's ongoing health.",
      urgency: "immediate",
      regulatory_ref: "SCCIF — Health outcomes",
    });
  }

  if (healthPassportCurrencyRate < 50 && totalPassports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Update all health passports to reflect current health information — outdated passports mean the home is working with potentially inaccurate health data.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (healthAssessmentComplianceRate >= 50 && healthAssessmentComplianceRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase health assessment coverage to at least 80% — prioritise arranging assessments for children who have not yet received one.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (dentalCheckRate >= 50 && dentalCheckRate < 80 && total_children > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Improve dental check coverage to at least 80% — ensure all children are registered with a dentist and have routine check-ups scheduled.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (immunisationRate >= 50 && immunisationRate < 80 && totalPassports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Work with GPs to bring immunisation rates above 80% — ensure all children are up to date with their vaccination schedules.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (opticianRegistrationRate < 80 && totalPassports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Register all children with an optician and arrange routine eye tests — optical health is part of the statutory health oversight requirement.",
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (overdueAssessments > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        `Reschedule ${overdueAssessments} overdue health assessment${overdueAssessments !== 1 ? "s" : ""} as a priority — overdue assessments mean children's health needs may have changed without review.`,
      urgency: "soon",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  if (healthActionCompletionRate >= 50 && healthActionCompletionRate < 70 && totalActionsIdentified > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Increase health action plan completion to at least 70% — ensure identified health needs are being addressed within agreed timescales.",
      urgency: "planned",
      regulatory_ref: "SCCIF — Health outcomes",
    });
  }

  if (healthPassportCurrencyRate >= 50 && healthPassportCurrencyRate < 80 && totalPassports > 0) {
    recommendations.push({
      rank: ++rank,
      recommendation:
        "Establish a quarterly health passport review cycle to maintain currency — aim for all passports updated within the last 90 days.",
      urgency: "planned",
      regulatory_ref: "CHR 2015 Reg 33 — Health",
    });
  }

  // ── Insights ──────────────────────────────────────────────────────────

  const insights: HealthWellbeingInsight[] = [];

  // -- Critical insights --

  if (healthAssessmentComplianceRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${healthAssessmentComplianceRate}% of children have a LAC health assessment. Ofsted will view this as a failure to meet statutory requirements under Reg 33. Children without health assessments may have unidentified health needs going unmet.`,
      severity: "critical",
    });
  }

  if (dentalCheckRate < 50 && total_children > 0) {
    insights.push({
      text: `Only ${dentalCheckRate}% of children have dental records. Looked-after children are at higher risk of poor oral health, and the absence of dental oversight for the majority of children is a significant health gap.`,
      severity: "critical",
    });
  }

  if (immunisationRate < 50 && totalPassports > 0) {
    insights.push({
      text: `Only ${immunisationRate}% of children have current immunisations. This leaves the majority of children potentially unprotected against preventable diseases and represents a public health risk within the home.`,
      severity: "critical",
    });
  }

  if (totalPassports === 0 && total_children > 0) {
    insights.push({
      text: "No health passports exist for any child in placement. Without health passports, the home cannot demonstrate a comprehensive understanding of each child's health status, allergies, medications, or registration with health services. This is a fundamental gap under Reg 33.",
      severity: "critical",
    });
  }

  if (healthActionCompletionRate < 50 && totalActionsIdentified > 0) {
    insights.push({
      text: `Only ${healthActionCompletionRate}% of health assessment actions have been completed. Identified health needs are being documented but not acted upon, which undermines the purpose of health assessments entirely.`,
      severity: "critical",
    });
  }

  if (consentFormRate < 50 && totalPassports > 0) {
    insights.push({
      text: `Only ${consentFormRate}% of children have signed consent forms. Without consent, the home may be unable to authorise routine health treatments or emergency medical care, placing children at risk.`,
      severity: "critical",
    });
  }

  // -- Warning insights --

  if (healthAssessmentComplianceRate >= 50 && healthAssessmentComplianceRate < 80 && total_children > 0) {
    insights.push({
      text: `Health assessment compliance at ${healthAssessmentComplianceRate}% — improving but not yet meeting the expected standard. Ofsted will want to see evidence that all children receive their statutory health assessment.`,
      severity: "warning",
    });
  }

  if (dentalCheckRate >= 50 && dentalCheckRate < 80 && total_children > 0) {
    insights.push({
      text: `Dental coverage at ${dentalCheckRate}% — some children are receiving dental care but coverage gaps remain. Consistent dental oversight is expected under health outcome standards.`,
      severity: "warning",
    });
  }

  if (healthPassportCurrencyRate >= 50 && healthPassportCurrencyRate < 80 && totalPassports > 0) {
    insights.push({
      text: `${healthPassportCurrencyRate}% of health passports are current — some passports are becoming outdated, which means decisions may be based on stale health information.`,
      severity: "warning",
    });
  }

  if (monitoringCompletionRate >= 50 && monitoringCompletionRate < 80 && totalMonitoring > 0) {
    insights.push({
      text: `Health monitoring completion at ${monitoringCompletionRate}% — not all monitoring observations include full readings, which limits the home's ability to identify health trends.`,
      severity: "warning",
    });
  }

  if (followUpCompletionRate >= 50 && followUpCompletionRate < 70 && entriesRequiringFollowUp > 0) {
    insights.push({
      text: `Health follow-up completion at ${followUpCompletionRate}% — some flagged health concerns are being resolved but a significant proportion remain outstanding.`,
      severity: "warning",
    });
  }

  if (immunisationRate >= 50 && immunisationRate < 80 && totalPassports > 0) {
    insights.push({
      text: `Immunisation rate at ${immunisationRate}% — while most children are immunised, gaps remain that should be addressed in liaison with GP services.`,
      severity: "warning",
    });
  }

  if (opticianRegistrationRate < 80 && totalPassports > 0) {
    insights.push({
      text: `Only ${opticianRegistrationRate}% of children registered with an optician — optical health is often overlooked in LAC care but undiagnosed vision issues can significantly impact education and wellbeing.`,
      severity: "warning",
    });
  }

  if (overdueAssessments > 0 && overdueAssessments <= 3) {
    insights.push({
      text: `${overdueAssessments} health assessment${overdueAssessments !== 1 ? "s are" : " is"} overdue — prompt rescheduling is needed to ensure health review timelines are maintained.`,
      severity: "warning",
    });
  }

  if (overdueAssessments > 3) {
    insights.push({
      text: `${overdueAssessments} health assessments are overdue — this volume of overdue assessments suggests a systemic issue with health review scheduling.`,
      severity: "warning",
    });
  }

  if (concernsActionedRate < 70 && monitoringWithConcerns > 0) {
    insights.push({
      text: `Only ${concernsActionedRate}% of flagged health concerns have documented actions — when monitoring identifies a concern, it must be followed through with a clear action plan.`,
      severity: "warning",
    });
  }

  // -- Positive insights --

  if (wellbeing_rating === "outstanding") {
    insights.push({
      text: "The home demonstrates outstanding health and wellbeing oversight — children's physical health, dental, optical, and ongoing medical needs are being comprehensively met with strong compliance, current documentation, and effective follow-through. This is strong evidence for Reg 33 compliance.",
      severity: "positive",
    });
  }

  if (healthAssessmentComplianceRate >= 100 && dentalCheckRate >= 100 && total_children > 0) {
    insights.push({
      text: "Full health assessment and dental coverage for all children — the home meets the core statutory health oversight requirements comprehensively. Ofsted will view this positively under Reg 33.",
      severity: "positive",
    });
  }

  if (immunisationRate >= 100 && consentFormRate >= 100 && totalPassports > 0) {
    insights.push({
      text: "All children have current immunisations and signed consent forms — the home is proactively managing preventive health and ensuring appropriate authorisations are in place.",
      severity: "positive",
    });
  }

  if (healthPassportCurrencyRate >= 100 && totalPassports > 0) {
    insights.push({
      text: "All health passports are current — the home maintains up-to-date comprehensive health records for every child, enabling informed care decisions.",
      severity: "positive",
    });
  }

  if (followUpCompletionRate >= 90 && entriesRequiringFollowUp > 0) {
    insights.push({
      text: `${followUpCompletionRate}% of health follow-ups completed — the home demonstrates excellent tracking of health concerns through to resolution, ensuring no child's health needs slip through the gaps.`,
      severity: "positive",
    });
  }

  if (healthActionCompletionRate >= 90 && totalActionsIdentified > 0) {
    insights.push({
      text: `${healthActionCompletionRate}% of health assessment actions completed — identified health needs are being systematically addressed, demonstrating that assessments lead to meaningful health improvements for children.`,
      severity: "positive",
    });
  }

  if (gpRegistrationRate >= 100 && dentistRegistrationRate >= 100 && opticianRegistrationRate >= 100 && totalPassports > 0) {
    insights.push({
      text: "All children registered with GP, dentist, and optician — comprehensive health service access is established for every child, meeting the full spectrum of primary health needs.",
      severity: "positive",
    });
  }

  if (monitoringCompletionRate >= 95 && monitoringReviewRate >= 90 && totalMonitoring > 0) {
    insights.push({
      text: "Health monitoring is thorough and consistently reviewed — the home demonstrates an embedded culture of ongoing health observation and professional oversight.",
      severity: "positive",
    });
  }

  if (concernsActionedRate >= 90 && monitoringWithConcerns > 0) {
    insights.push({
      text: `${concernsActionedRate}% of flagged health concerns have documented actions — the home responds effectively and promptly when monitoring identifies a health issue.`,
      severity: "positive",
    });
  }

  // ── Headline ──────────────────────────────────────────────────────────

  let headline: string;

  if (wellbeing_rating === "outstanding") {
    headline =
      "Outstanding health and wellbeing oversight — children's physical health, dental, optical, and medical needs are comprehensively met with full compliance and current documentation.";
  } else if (wellbeing_rating === "good") {
    headline = `Good health and wellbeing oversight — ${strengths.length} strength${strengths.length !== 1 ? "s" : ""} identified${concerns.length > 0 ? `, ${concerns.length} area${concerns.length !== 1 ? "s" : ""} for improvement` : ""}.`;
  } else if (wellbeing_rating === "adequate") {
    headline = `Adequate health and wellbeing oversight — ${concerns.length} concern${concerns.length !== 1 ? "s" : ""} identified requiring improvement to ensure children's health needs are consistently met.`;
  } else {
    headline = `Health and wellbeing oversight is inadequate — ${concerns.length} significant concern${concerns.length !== 1 ? "s" : ""} requiring urgent action to ensure children's health needs are met.`;
  }

  // ── Return ────────────────────────────────────────────────────────────

  return {
    wellbeing_rating,
    wellbeing_score: score,
    headline,
    total_health_assessments: totalHealthAssessments,
    health_assessment_compliance_rate: healthAssessmentComplianceRate,
    dental_check_rate: dentalCheckRate,
    health_passport_currency_rate: healthPassportCurrencyRate,
    monitoring_completion_rate: monitoringCompletionRate,
    health_action_completion_rate: healthActionCompletionRate,
    immunisation_rate: immunisationRate,
    consent_form_rate: consentFormRate,
    follow_up_completion_rate: followUpCompletionRate,
    strengths,
    concerns,
    recommendations,
    insights,
  };
}
